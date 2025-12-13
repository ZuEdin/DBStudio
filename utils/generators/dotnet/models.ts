
import { Table, Relationship, BackendConfig, VirtualFile } from '../../../types/index';
import { DATA_TYPES } from '../../../config/dataTypes';
import { resolveType } from '../common';

export const generateDbContext = (tables: Table[], config: BackendConfig, root: string): VirtualFile => {
  const dbSets = tables.map(t => `        public DbSet<${t.name}> ${t.name}s { get; set; }`).join('\n');
  
  const content = `using Microsoft.EntityFrameworkCore;
using ${config.projectName}.Models;

namespace ${config.projectName}.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

${dbSets}

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}`;
  return { name: 'AppDbContext.cs', path: `${root}/Data/AppDbContext.cs`, content: content, language: 'csharp' };
};

export const generateModels = (tables: Table[], relationships: Relationship[], config: BackendConfig, root: string): VirtualFile[] => {
  return tables.map(table => {
    const props = table.fields.map(f => {
      let type = resolveType(f, 'csharp');
      const typeConfig = DATA_TYPES[f.type];
      const attributes = [];
      
      if (f.isPrimaryKey) attributes.push('[Key]');
      
      if (typeConfig && typeConfig.mappings.csharp.attributes) {
          const customAttrs = typeConfig.mappings.csharp.attributes({ length: f.length, precision: f.precision, scale: f.scale });
          attributes.push(...customAttrs);
      }
      
      const isValueType = ['int', 'decimal', 'double', 'DateTime', 'bool'].includes(type);
      let initializer = '';

      if (f.allowNull) {
          type += '?';
      } else {
          if (type === 'string') initializer = ' = string.Empty;';
          else if (!isValueType) initializer = ' = default!;';
      }
      
      if (f.defaultValue) {
          if (type.startsWith('string')) initializer = ` = "${f.defaultValue}";`;
          else initializer = ` = ${f.defaultValue};`;
      }

      const indent = "        "; 
      const attrBlock = attributes.length > 0 ? attributes.map(a => `${indent}${a}`).join('\n') + '\n' : '';
      return `${attrBlock}${indent}public ${type} ${f.name} { get; set; }${initializer}`;
    }).join('\n\n');

    // Navigation Properties
    const childRels = relationships.filter(r => r.fromTableId === table.id);
    const childProps = childRels.map(r => {
        const childTable = tables.find(t => t.id === r.toTableId);
        if (!childTable) return '';
        return `        public virtual ICollection<${childTable.name}> ${childTable.name}s { get; set; } = new List<${childTable.name}>();`;
    }).join('\n\n');

    const parentRels = relationships.filter(r => r.toTableId === table.id);
    const parentProps = parentRels.map(r => {
        const parentTable = tables.find(t => t.id === r.fromTableId);
        const fkField = table.fields.find(f => f.id === r.toFieldId);
        if (!parentTable || !fkField) return '';
        return `        [ForeignKey("${fkField.name}")]\n        public virtual ${parentTable.name} ${parentTable.name} { get; set; } = null!;`;
    }).join('\n\n');

    const combinedProps = [props, childProps, parentProps].filter(p => p).join('\n\n');

    const content = `using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ${config.projectName}.Models
{
    public class ${table.name}
    {
${combinedProps}
    }
}`;
    return { name: `${table.name}.cs`, path: `${root}/Models/${table.name}.cs`, content: content, language: 'csharp' };
  });
};
