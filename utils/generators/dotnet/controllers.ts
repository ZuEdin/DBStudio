
import { Table, Relationship, BackendConfig, VirtualFile } from '../../../types/index';
import { resolveType } from '../common';

export const generateControllers = (tables: Table[], relationships: Relationship[], config: BackendConfig, root: string): VirtualFile[] => {
  return tables.map(table => {
    const pkField = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
    const pkType = resolveType(pkField, 'csharp');
    
    // Includes
    const childRels = relationships.filter(r => r.fromTableId === table.id);
    const parentRels = relationships.filter(r => r.toTableId === table.id);
    
    const includes = [];
    parentRels.forEach(r => {
        const parent = tables.find(t => t.id === r.fromTableId);
        if (parent) includes.push(`.Include(x => x.${parent.name})`);
    });
    childRels.forEach(r => {
        const child = tables.find(t => t.id === r.toTableId);
        if (child) includes.push(`.Include(x => x.${child.name}s)`);
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
    public class ${table.name}Controller : ControllerBase
    {
        private readonly AppDbContext _context;

        public ${table.name}Controller(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<${table.name}>>> Get${table.name}s()
        {
            return await _context.${table.name}s${includeString}.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<${table.name}>> Get${table.name}(${pkType} id)
        {
            var item = await _context.${table.name}s${includeString}
                .FirstOrDefaultAsync(x => x.${pkField.name} == id);

            if (item == null) return NotFound();
            return item;
        }

        [HttpPost]
        public async Task<ActionResult<${table.name}>> Post${table.name}(${table.name} item)
        {
            _context.${table.name}s.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get${table.name}), new { id = item.${pkField.name} }, item);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put${table.name}(${pkType} id, ${table.name} item)
        {
            if (id != item.${pkField.name}) return BadRequest();
            _context.Entry(item).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.${table.name}s.Any(e => e.${pkField.name} == id)) return NotFound();
                throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete${table.name}(${pkType} id)
        {
            var item = await _context.${table.name}s.FindAsync(id);
            if (item == null) return NotFound();
            _context.${table.name}s.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}`;
    return { name: `${table.name}Controller.cs`, path: `${root}/Controllers/${table.name}Controller.cs`, content: content, language: 'csharp' };
  });
};
