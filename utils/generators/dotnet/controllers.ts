
import { Table, Relationship, BackendConfig, VirtualFile, Query } from '../../../types/index';
import { resolveType, toPascalCase } from '../common';

export const generateControllers = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // Table Controllers (CRUD)
  tables.forEach(table => {
    const safeName = toPascalCase(table.name);
    const pkField = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
    const pkType = resolveType(pkField, 'csharp');
    
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
        public async Task<ActionResult<IEnumerable<${safeName}>>> Get${safeName}s()
        {
            return await _context.${safeName}s${includeString}.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<${safeName}>> Get${safeName}(${pkType} id)
        {
            var item = await _context.${safeName}s${includeString}
                .FirstOrDefaultAsync(x => x.${pkField.name} == id);

            if (item == null) return NotFound();
            return item;
        }

        [HttpPost]
        public async Task<ActionResult<${safeName}>> Post${safeName}(${safeName} item)
        {
            _context.${safeName}s.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get${safeName}), new { id = item.${pkField.name} }, item);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put${safeName}(${pkType} id, ${safeName} item)
        {
            if (id != item.${pkField.name}) return BadRequest();
            _context.Entry(item).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.${safeName}s.Any(e => e.${pkField.name} == id)) return NotFound();
                throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete${safeName}(${pkType} id)
        {
            var item = await _context.${safeName}s.FindAsync(id);
            if (item == null) return NotFound();
            _context.${safeName}s.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
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
        public async Task<ActionResult<IEnumerable<${safeName}>>> Get()
        {
            return await _context.${safeName}s.ToListAsync();
        }
    }
}`;
      files.push({ name: `${safeName}Controller.cs`, path: `${root}/Controllers/${safeName}Controller.cs`, content: content, language: 'csharp' });
  });

  return files;
};
