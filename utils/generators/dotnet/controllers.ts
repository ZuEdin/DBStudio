
import { Table, Relationship, BackendConfig, VirtualFile, Query } from '../../../types/index';
import { resolveType, toPascalCase } from '../common';

export const generateControllers = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const useAuth = config.authConfig?.useUserLogin;

  // DTO for Paged Result
  const pagedResultClass = `
namespace ${config.projectName}.Models
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

  // Table Controllers (CRUD)
  tables.forEach(table => {
    const safeName = toPascalCase(table.name);
    const pkField = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
    const pkType = resolveType(pkField, 'csharp');
    const searchableFields = table.fields.filter(f => f.type === 'VARCHAR' || f.type === 'TEXT').map(f => toPascalCase(f.name));
    
    // Auth Injections
    let serviceInjection = '';
    let ctorParam = '';
    let ctorAssign = '';
    let authCheckGet = '';
    let authCheckWrite = '';
    let authCheckDelete = '';

    if (useAuth) {
        serviceInjection = `        private readonly IPermissionService _permissions;`;
        ctorParam = `, IPermissionService permissions`;
        ctorAssign = `            _permissions = permissions;`;
        authCheckGet = `            if (!await _permissions.CanReadTableAsync(User, "${table.id}")) return Forbid();`;
        authCheckWrite = `            if (!await _permissions.CanWriteTableAsync(User, "${table.id}")) return Forbid();`;
        authCheckDelete = `            if (!await _permissions.CanDeleteTableAsync(User, "${table.id}")) return Forbid();`;
    }

    const childRels = relationships.filter(r => r.fromTableId === table.id);
    const parentRels = relationships.filter(r => r.toTableId === table.id);
    
    const includes = [];
    parentRels.forEach(r => {
        const parent = tables.find(t => t.id === r.fromTableId);
        if (parent) includes.push(`.Include(x => x.${toPascalCase(parent.name)})`);
    });
    childRels.forEach(r => {
        const child = tables.find(t => t.id === r.toTableId);
        if (child) includes.push(`.Include(x => x.${toPascalCase(child.name)}s)`);
    });
    const includeString = includes.join('');

    // Search Logic construction
    let searchLogic = '';
    if (searchableFields.length > 0) {
        const conditions = searchableFields.map(f => `x.${f}.Contains(search)`).join(' || ');
        searchLogic = `
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(x => ${conditions});
            }`;
    }

    const content = `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ${config.projectName}.Data;
using ${config.projectName}.Models;
${useAuth ? `using ${config.projectName}.Services;` : ''}

namespace ${config.projectName}.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ${safeName}Controller : ControllerBase
    {
        private readonly AppDbContext _context;
${serviceInjection}

        public ${safeName}Controller(AppDbContext context${ctorParam})
        {
            _context = context;
${ctorAssign}
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<${safeName}>>> Get${safeName}s([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
        {
${authCheckGet}
            var query = _context.${safeName}s.AsNoTracking()${includeString}.AsQueryable();

            ${searchLogic}

            var total = await query.CountAsync();
            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            return new PagedResult<${safeName}>
            {
                Data = items,
                Total = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(total / (double)pageSize)
            };
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<${safeName}>> Get${safeName}(${pkType} id)
        {
${authCheckGet}
            var item = await _context.${safeName}s${includeString}
                .FirstOrDefaultAsync(x => x.${pkField.name} == id);

            if (item == null) return NotFound();
            return item;
        }

        [HttpPost]
        public async Task<ActionResult<${safeName}>> Post${safeName}(${safeName} item)
        {
${authCheckWrite}
            using var transaction = await _context.Database.BeginTransactionAsync();
            try 
            {
                _context.${safeName}s.Add(item);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return CreatedAtAction(nameof(Get${safeName}), new { id = item.${pkField.name} }, item);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put${safeName}(${pkType} id, ${safeName} item)
        {
${authCheckWrite}
            if (id != item.${pkField.name}) return BadRequest();

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Entry(item).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();
                if (!_context.${safeName}s.Any(e => e.${pkField.name} == id)) return NotFound();
                throw;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete${safeName}(${pkType} id)
        {
${authCheckDelete}
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var item = await _context.${safeName}s.FindAsync(id);
                if (item == null) return NotFound();
                _context.${safeName}s.Remove(item);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return NoContent();
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}`;
    files.push({ name: `${safeName}Controller.cs`, path: `${root}/Controllers/${safeName}Controller.cs`, content: content, language: 'csharp' });
  });

  // Query Controllers (Read-Only)
  queries.filter(q => q.type === 'SELECT').forEach(q => {
      const safeName = toPascalCase(q.name);
      const content = `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ${config.projectName}.Data;
using ${config.projectName}.Models;

namespace ${config.projectName}.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ${safeName}Controller : ControllerBase
    {
        private readonly AppDbContext _context;

        public ${safeName}Controller(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<${safeName}>>> Get([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _context.${safeName}s.AsNoTracking().AsQueryable();
            var total = await query.CountAsync();
            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            return new PagedResult<${safeName}>
            {
                Data = items,
                Total = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(total / (double)pageSize)
            };
        }
    }
}`;
      files.push({ name: `${safeName}Controller.cs`, path: `${root}/Controllers/${safeName}Controller.cs`, content: content, language: 'csharp' });
  });

  return files;
};
