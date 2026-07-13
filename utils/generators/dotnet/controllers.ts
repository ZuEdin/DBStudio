
import { Table, Relationship, BackendConfig, VirtualFile, Query, SelectQuery } from '../../../types/index';
import { resolveType, toPascalCase, toCamelCase } from '../common';

export const generateControllers = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const useAuth = config.authConfig?.useUserLogin;
  const useWinAuth = config.authConfig?.useWindowsAuth;

  // NEW: AD Controller for User Search
  if (useWinAuth) {
      const adControllerContent = `using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ${config.projectName}.Services;

namespace ${config.projectName}.Controllers
{
    [Route("api/ad")]
    [ApiController]
    [Authorize]
    public class AdController : ControllerBase
    {
        private readonly IAdService _adService;
        private readonly ICurrentUserService _currentUser;

        public AdController(IAdService adService, ICurrentUserService currentUser)
        {
            _adService = adService;
            _currentUser = currentUser;
        }

        [HttpGet("me")]
        public ActionResult<AdUserInfo> GetMe()
        {
            // Returns the full AD profile of the currently logged in user
            var info = _adService.GetCurrentUserDetails(User);
            if (info == null) return NotFound();
            return Ok(info);
        }
        
        [HttpGet("whoami")]
        public IActionResult WhoAmI()
        {
            // Simple endpoint for non-AD contexts or debugging
            return Ok(new { 
                _currentUser.Username, 
                _currentUser.UserId, 
                _currentUser.IsAuthenticated,
                Roles = User.Claims.Where(c => c.Type == System.Security.Claims.ClaimTypes.Role).Select(c => c.Value)
            });
        }

        [HttpGet("search")]
        public ActionResult<List<AdUserInfo>> Search([FromQuery] string? q = null, [FromQuery] string? search = null)
        {
            var query = q ?? search;
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2) 
                return BadRequest("Query must be at least 2 characters.");

            return Ok(_adService.SearchUsers(query));
        }
    }
}`;
      files.push({ name: 'AdController.cs', path: `${root}/Controllers/AdController.cs`, content: adControllerContent, language: 'csharp' });
  }

  if (useAuth) {
      const authControllerContent = `using Microsoft.AspNetCore.Mvc;

namespace ${config.projectName}.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        public class LoginDto { public string? Username { get; set; } public string? Password { get; set; } }
        public class SsoLoginDto { public string? Provider { get; set; } }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto dto)
        {
            return Ok(new { token = "dummy-jwt-token-for-" + (dto.Username ?? "user"), user = new { username = dto.Username ?? "user", role = "Admin" } });
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] LoginDto dto)
        {
            return StatusCode(201, new { message = "User registered successfully" });
        }

        [HttpPost("login-sso")]
        public IActionResult LoginSso([FromBody] SsoLoginDto dto)
        {
            return Ok(new { token = "dummy-jwt-token-sso-" + (dto.Provider ?? "unknown"), user = new { username = dto.Provider + " User", role = "User" } });
        }
    }
}`;
      files.push({ name: 'AuthController.cs', path: `${root}/Controllers/AuthController.cs`, content: authControllerContent, language: 'csharp' });
  }

  const pagedResultClass = `namespace ${config.projectName}.Models
{
    public class PagedResult<T>
    {
        public IEnumerable<T> Data { get; set; } = new List<T>();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}`;
  files.push({ name: 'PagedResult.cs', path: `${root}/Models/PagedResult.cs`, content: pagedResultClass, language: 'csharp' });

  // Generic CRUD Controllers with Audit
  tables.forEach(table => {
      const safeName = toPascalCase(table.name);
      const pkField = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
      
      // SEARCH LOGIC
      // Create a predicate to search in all string columns
      const stringFields = table.fields.filter(f => f.type === 'VARCHAR' || f.type === 'TEXT');
      let searchLogic = '';
      if (stringFields.length > 0) {
          const predicate = stringFields.map(f => `(x.${toPascalCase(f.name)} != null && x.${toPascalCase(f.name)}.ToLower().Contains(search.ToLower()))`).join(' || ');
          searchLogic = `
            if (!string.IsNullOrEmpty(search))
            {
                q = q.Where(x => ${predicate});
            }`;
      }

      // AUDIT LOGIC (CreatedBy / ModifiedBy / Dates)
      const auditFields = {
          createdBy: table.fields.find(f => ['createdby', 'created_by', 'erstellt_von', 'erstelltvon', 'created_user', 'createduser'].includes(f.name.toLowerCase())),
          modifiedBy: table.fields.find(f => ['modifiedby', 'modified_by', 'updatedby', 'updated_by', 'geaendert_von', 'bearbeitetvon', 'bearbeitet_von'].includes(f.name.toLowerCase())),
          createdDate: table.fields.find(f => ['createddate', 'created_date', 'createdat', 'created_at', 'erstellt_am', 'erstelltam'].includes(f.name.toLowerCase())),
          modifiedDate: table.fields.find(f => ['modifieddate', 'modified_date', 'updatedat', 'updated_at', 'geaendert_am', 'bearbeitet_am'].includes(f.name.toLowerCase()))
      };
      
      let onCreateAudit = '';
      if (auditFields.createdBy) {
          if (auditFields.createdBy.type === 'VARCHAR' || auditFields.createdBy.type === 'TEXT') {
              onCreateAudit += `                item.${toPascalCase(auditFields.createdBy.name)} = _currentUser.Username ?? "System";\n`;
          } else if (auditFields.createdBy.type === 'INTEGER' || auditFields.createdBy.type === 'TINYINT') {
              onCreateAudit += `                if (int.TryParse(_currentUser.UserId, out var parsedCreatedBy)) item.${toPascalCase(auditFields.createdBy.name)} = parsedCreatedBy;\n`;
          }
      }
      if (auditFields.createdDate) onCreateAudit += `                item.${toPascalCase(auditFields.createdDate.name)} = DateTime.Now;\n`;
      
      let onUpdateAudit = '';
      if (auditFields.modifiedBy) {
          if (auditFields.modifiedBy.type === 'VARCHAR' || auditFields.modifiedBy.type === 'TEXT') {
              onUpdateAudit += `            existing.${toPascalCase(auditFields.modifiedBy.name)} = _currentUser.Username ?? "System";\n`;
          } else if (auditFields.modifiedBy.type === 'INTEGER' || auditFields.modifiedBy.type === 'TINYINT') {
              onUpdateAudit += `            if (int.TryParse(_currentUser.UserId, out var parsedModifiedBy)) existing.${toPascalCase(auditFields.modifiedBy.name)} = parsedModifiedBy;\n`;
          }
      }
      if (auditFields.modifiedDate) onUpdateAudit += `            existing.${toPascalCase(auditFields.modifiedDate.name)} = DateTime.Now;\n`;

      // Fallback logic for status fields to default to 1 if 0 (e.g. SQLite Status field)
      const statusField = table.fields.find(f => ['status', 'statusid'].includes(f.name.toLowerCase()) && f.type === 'INTEGER');
      let statusDefaultLogic = '';
      if (statusField) {
          statusDefaultLogic = `            if (item.${toPascalCase(statusField.name)} == 0)
            {
                item.${toPascalCase(statusField.name)} = 1;
            }\n`;
      }

      // Default values logic (e.g. TIMESTAMP with DEFAULT CURRENT_TIMESTAMP / NOW)
      let defaultValuesLogic = '';
      table.fields.forEach(f => {
          const fieldPascal = toPascalCase(f.name);
          const isDateType = ['DATETIME', 'TIMESTAMP', 'DATE', 'TIME'].includes(f.type);
          const hasNowDefault = f.defaultValue && (
              f.defaultValue.toLowerCase().includes('now') ||
              f.defaultValue.toLowerCase().includes('current_timestamp') ||
              f.defaultValue.toLowerCase().includes('getdate')
          );
          const isCreatedAtField = ['created_at', 'createdat', 'erstellt_am', 'created_date', 'createddate'].includes(f.name.toLowerCase());
          
          if (isDateType && (hasNowDefault || isCreatedAtField)) {
              defaultValuesLogic += `            if (item.${fieldPascal} == default(DateTime) || item.${fieldPascal} == DateTime.MinValue)
            {
                item.${fieldPascal} = DateTime.Now;
            }\n`;
          } else if (f.defaultValue !== undefined && f.defaultValue !== null && f.defaultValue !== '') {
              if (f.type === 'INTEGER' || f.type === 'TINYINT') {
                  const numVal = parseInt(f.defaultValue, 10);
                  if (!isNaN(numVal)) {
                      defaultValuesLogic += `            if (item.${fieldPascal} == 0)
            {
                item.${fieldPascal} = ${numVal};
            }\n`;
                  }
              } else if (f.type === 'BOOLEAN') {
                  const boolVal = f.defaultValue.toLowerCase() === 'true' || f.defaultValue === '1';
                  if (boolVal) {
                      const nullable = f.allowNull !== false && !f.isPrimaryKey;
                      if (nullable) {
                          defaultValuesLogic += `            if (item.${fieldPascal} == null || item.${fieldPascal} == false)
            {
                item.${fieldPascal} = true;
            }\n`;
                      } else {
                          defaultValuesLogic += `            if (!item.${fieldPascal})
            {
                item.${fieldPascal} = true;
            }\n`;
                      }
                  }
              } else if (['VARCHAR', 'TEXT', 'EMAIL', 'PHONE', 'URL'].includes(f.type)) {
                  defaultValuesLogic += `            if (string.IsNullOrEmpty(item.${fieldPascal}))
            {
                item.${fieldPascal} = "${f.defaultValue.replace(/"/g, '\\"')}";
            }\n`;
              }
          }
      });

      const content = `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ${config.projectName}.Data;
using ${config.projectName}.Models;
using ${config.projectName}.Services;

namespace ${config.projectName}.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ${safeName}Controller : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ICurrentUserService _currentUser;

        public ${safeName}Controller(AppDbContext context, ICurrentUserService currentUser) 
        { 
            _context = context; 
            _currentUser = currentUser;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<${safeName}>>> Get([FromQuery] int page=1, [FromQuery] int pageSize=20, [FromQuery] string? search = null)
        {
            var q = _context.${safeName}s.AsQueryable();

            // Search Logic
            ${searchLogic}

            var total = await q.CountAsync();
            var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
            
            return new PagedResult<${safeName}> { Data = items, Total = total, Page = page, PageSize = pageSize, TotalPages = (int)Math.Ceiling(total/(double)pageSize) };
        }
        
        [HttpGet("{id}")]
        public async Task<ActionResult<${safeName}>> GetById(${resolveType(pkField, 'csharp')} id)
        {
            var item = await _context.${safeName}s.FindAsync(id);
            if (item == null) return NotFound();
            return item;
        }

        [HttpPost]
        public async Task<ActionResult> Post(${safeName} item) 
        { 
            // Audit: Create
            ${onCreateAudit}
${statusDefaultLogic}${defaultValuesLogic}            
            _context.Add(item); 
            await _context.SaveChangesAsync(); 
            return Ok(item); 
        }
        
        [HttpPut("{id}")]
        public async Task<ActionResult> Put(${resolveType(pkField, 'csharp')} id, ${safeName} item) 
        { 
            if (id != item.${toPascalCase(pkField.name)}) return BadRequest();

            var existing = await _context.${safeName}s.FindAsync(id);
            if (existing == null) return NotFound();

            // Retain original creation info to make it unmanipulatable
${auditFields.createdBy ? `            item.${toPascalCase(auditFields.createdBy.name)} = existing.${toPascalCase(auditFields.createdBy.name)};\n` : ''}${auditFields.createdDate ? `            item.${toPascalCase(auditFields.createdDate.name)} = existing.${toPascalCase(auditFields.createdDate.name)};\n` : ''}
            _context.Entry(existing).CurrentValues.SetValues(item);

            // Audit: Update
            ${onUpdateAudit}

            await _context.SaveChangesAsync(); 
            return Ok(); 
        }
        
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(${resolveType(pkField, 'csharp')} id) { var i = await _context.${safeName}s.FindAsync(id); if(i!=null) { _context.Remove(i); await _context.SaveChangesAsync(); } return Ok(); }
    }
}`;
      files.push({ name: `${safeName}Controller.cs`, path: `${root}/Controllers/${safeName}Controller.cs`, content: content, language: 'csharp' });
  });

  const selectQueries = queries.filter(q => q.type === 'SELECT');
  if (selectQueries.length > 0) {
      const queryEndpoints = selectQueries.map(q => {
          const safeName = toPascalCase(q.name);
          const camelName = toCamelCase(q.name);
          
          // Generate the dynamic C# EF where clauses based on the form parameters criteria
          const filterLogics: string[] = [];
          (q as SelectQuery).columns?.forEach(c => {
              c.criteria?.forEach(cr => {
                  if (cr && /(?:\[?Forms\]?!)/i.test(cr)) {
                      const formMatch = cr.match(/(?:\[?Forms\]?!\s*\[?([^!\]]+)\]?!\s*\[?([^!\]\s]+)\]?)/i);
                      if (formMatch && formMatch.length >= 3) {
                          const formName = formMatch[1].toLowerCase();
                          const fieldName = formMatch[2].toLowerCase();
                          const paramName = `form_${formName}_${fieldName}`;
                          const opMatch = cr.match(/^(=|like |>|<|>=|<=)/i);
                          const op = opMatch ? opMatch[0].toUpperCase().trim() : '=';
                          const colName = toPascalCase(c.alias || c.fieldName);
                          
                          const colTable = tables.find(t => t.id === c.tableId);
                          const colField = colTable?.fields.find(f => f.id === c.fieldId);
                          let fieldType = 'string';
                          if (colField) {
                              fieldType = resolveType(colField, 'csharp');
                          }

                          let whereClause = '';
                          if (fieldType === 'string') {
                              if (op === 'LIKE') {
                                  whereClause = `q = q.Where(x => x.${colName} != null && EF.Functions.Like(x.${colName}, $"%{val}%"));`;
                              } else if (op === '>') {
                                  whereClause = `q = q.Where(x => x.${colName} != null && x.${colName}.CompareTo(val) > 0);`;
                              } else if (op === '<') {
                                  whereClause = `q = q.Where(x => x.${colName} != null && x.${colName}.CompareTo(val) < 0);`;
                              } else if (op === '>=') {
                                  whereClause = `q = q.Where(x => x.${colName} != null && x.${colName}.CompareTo(val) >= 0);`;
                              } else if (op === '<=') {
                                  whereClause = `q = q.Where(x => x.${colName} != null && x.${colName}.CompareTo(val) <= 0);`;
                              } else {
                                  whereClause = `q = q.Where(x => x.${colName} == val);`;
                              }
                          } else if (fieldType === 'int' || fieldType === 'long') {
                              let parseCode = `if (${fieldType}.TryParse(val, out var parsedVal)) { `;
                              if (op === 'LIKE') {
                                  whereClause = `${parseCode}q = q.Where(x => x.${colName} != null && EF.Functions.Like(x.${colName}.ToString(), $"%{val}%")); }`;
                                } else {
                                  whereClause = `${parseCode}q = q.Where(x => x.${colName} ${op} parsedVal); }`;
                              }
                          } else if (fieldType === 'decimal' || fieldType === 'double') {
                              let parseCode = `if (${fieldType}.TryParse(val, out var parsedVal)) { `;
                              if (op === 'LIKE') {
                                  whereClause = `${parseCode}q = q.Where(x => x.${colName} != null && EF.Functions.Like(x.${colName}.ToString(), $"%{val}%")); }`;
                              } else {
                                  whereClause = `${parseCode}q = q.Where(x => x.${colName} ${op} parsedVal); }`;
                              }
                          } else if (fieldType === 'bool') {
                              let parseCode = `if (bool.TryParse(val, out var parsedVal)) { `;
                              whereClause = `${parseCode}q = q.Where(x => x.${colName} == parsedVal); }`;
                          } else if (fieldType === 'DateTime') {
                              let parseCode = `if (DateTime.TryParse(val, out var parsedVal)) { `;
                              if (op === 'LIKE') {
                                  whereClause = `${parseCode}q = q.Where(x => x.${colName} != null && EF.Functions.Like(x.${colName}.ToString(), $"%{val}%")); }`;
                              } else {
                                  whereClause = `${parseCode}q = q.Where(x => x.${colName} ${op} parsedVal); }`;
                              }
                          } else {
                              if (op === 'LIKE') {
                                  whereClause = `q = q.Where(x => x.${colName} != null && EF.Functions.Like(x.${colName}.ToString(), $"%{val}%"));`;
                              } else if (op === '>') {
                                  whereClause = `q = q.Where(x => x.${colName} != null && x.${colName}.ToString().CompareTo(val) > 0);`;
                                } else if (op === '<') {
                                  whereClause = `q = q.Where(x => x.${colName} != null && x.${colName}.ToString().CompareTo(val) < 0);`;
                              } else if (op === '>=') {
                                  whereClause = `q = q.Where(x => x.${colName} != null && x.${colName}.ToString().CompareTo(val) >= 0);`;
                              } else if (op === '<=') {
                                  whereClause = `q = q.Where(x => x.${colName} != null && x.${colName}.ToString().CompareTo(val) <= 0);`;
                              } else {
                                  whereClause = `q = q.Where(x => x.${colName} != null && x.${colName}.ToString() == val);`;
                              }
                          }

                          filterLogics.push(`            if (Request.Query.ContainsKey("${paramName}"))
            {
                var val = Request.Query["${paramName}"].ToString();
                if (!string.IsNullOrEmpty(val) && val != "undefined" && val != "null")
                {
                    ${whereClause}
                }
            }`);
                      }
                  }
              });
          });
          const queryFiltering = filterLogics.length > 0 ? filterLogics.join('\n') : `            // No active dynamic form filters on this query`;

          return `        [HttpGet("${camelName}")]
        public async Task<ActionResult<PagedResult<${safeName}>>> Get${safeName}([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var q = _context.${safeName}s.AsQueryable();
            
            // Dynamic Query Filtering for [Forms]! criteria
${queryFiltering}

            var total = await q.CountAsync();
            var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            return new PagedResult<${safeName}> 
            { 
                Data = items, 
                Total = total, 
                Page = page, 
                PageSize = pageSize, 
                TotalPages = (int)Math.Ceiling(total / (double)pageSize) 
            };
        }`;
      }).join('\n\n');

      const queriesControllerContent = `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ${config.projectName}.Data;
using ${config.projectName}.Models;

namespace ${config.projectName}.Controllers
{
    [Route("api/queries")]
    [ApiController]
    public class QueriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public QueriesController(AppDbContext context)
        {
            _context = context;
        }

${queryEndpoints}
    }
}`;
      files.push({ name: 'QueriesController.cs', path: `${root}/Controllers/QueriesController.cs`, content: queriesControllerContent, language: 'csharp' });
  }

  return files;
};
