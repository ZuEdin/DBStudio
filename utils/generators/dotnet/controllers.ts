
import { Table, Relationship, BackendConfig, VirtualFile, Query } from '../../../types/index';
import { resolveType, toPascalCase } from '../common';

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
          const predicate = stringFields.map(f => `x.${toPascalCase(f.name)}.Contains(search)`).join(' || ');
          searchLogic = `
            if (!string.IsNullOrEmpty(search))
            {
                q = q.Where(x => ${predicate});
            }`;
      }

      // AUDIT LOGIC (CreatedBy / ModifiedBy / Dates)
      const auditFields = {
          createdBy: table.fields.find(f => ['createdby', 'erstellt_von', 'erstelltvon'].includes(f.name.toLowerCase())),
          modifiedBy: table.fields.find(f => ['modifiedby', 'updatedby', 'geaendert_von', 'bearbeitetvon'].includes(f.name.toLowerCase())),
          createdDate: table.fields.find(f => ['createddate', 'createdat', 'erstellt_am'].includes(f.name.toLowerCase())),
          modifiedDate: table.fields.find(f => ['modifieddate', 'updatedat', 'geaendert_am'].includes(f.name.toLowerCase()))
      };
      
      let onCreateAudit = '';
      if (auditFields.createdBy) onCreateAudit += `                item.${toPascalCase(auditFields.createdBy.name)} = _currentUser.Username ?? "System";\n`;
      if (auditFields.createdDate) onCreateAudit += `                item.${toPascalCase(auditFields.createdDate.name)} = DateTime.Now;\n`;
      
      let onUpdateAudit = '';
      if (auditFields.modifiedBy) onUpdateAudit += `            item.${toPascalCase(auditFields.modifiedBy.name)} = _currentUser.Username ?? "System";\n`;
      if (auditFields.modifiedDate) onUpdateAudit += `            item.${toPascalCase(auditFields.modifiedDate.name)} = DateTime.Now;\n`;

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
            
            _context.Add(item); 
            await _context.SaveChangesAsync(); 
            return Ok(item); 
        }
        
        [HttpPut("{id}")]
        public async Task<ActionResult> Put(${resolveType(pkField, 'csharp')} id, ${safeName} item) 
        { 
            if (id != item.${toPascalCase(pkField.name)}) return BadRequest();

            // Audit: Update
            ${onUpdateAudit}

            _context.Entry(item).State = EntityState.Modified; 
            await _context.SaveChangesAsync(); 
            return Ok(); 
        }
        
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(${resolveType(pkField, 'csharp')} id) { var i = await _context.${safeName}s.FindAsync(id); if(i!=null) { _context.Remove(i); await _context.SaveChangesAsync(); } return Ok(); }
    }
}`;
      files.push({ name: `${safeName}Controller.cs`, path: `${root}/Controllers/${safeName}Controller.cs`, content: content, language: 'csharp' });
  });

  return files;
};
