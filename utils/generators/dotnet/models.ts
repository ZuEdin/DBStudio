
import { Table, Relationship, BackendConfig, VirtualFile, Query, SelectQuery } from '../../../types/index';
import { DATA_TYPES } from '../../../config/dataTypes';
import { resolveType, toPascalCase } from '../common';

export const generateDbContext = (tables: Table[], queries: Query[], config: BackendConfig, root: string): VirtualFile => {
  const dbSets = tables.map(t => `        public DbSet<${toPascalCase(t.name)}> ${toPascalCase(t.name)}s { get; set; }`).join('\n');
  const queryDbSets = queries
    .filter(q => q.type === 'SELECT')
    .map(q => `        public DbSet<${toPascalCase(q.name)}> ${toPascalCase(q.name)}s { get; set; }`)
    .join('\n');
  
  const tableMappings = tables.map(t => `            modelBuilder.Entity<${toPascalCase(t.name)}>().ToTable("${t.name}");`).join('\n');
  const queryMappings = queries
    .filter(q => q.type === 'SELECT')
    .map(q => `            modelBuilder.Entity<${toPascalCase(q.name)}>().ToView("${q.name}").HasNoKey();`).join('\n');

  const content = `using Microsoft.EntityFrameworkCore;
using ${config.projectName}.Models;

namespace ${config.projectName}.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // Tables
${dbSets}

        // Queries (Views)
${queryDbSets}

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

${tableMappings}
${queryMappings}
        }
    }
}`;
  return { name: 'AppDbContext.cs', path: `${root}/Data/AppDbContext.cs`, content: content, language: 'csharp' };
};

export const generateModels = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // Table Models
  tables.forEach(table => {
    const safeName = toPascalCase(table.name);
    const props = table.fields.map(f => {
      let type = resolveType(f, 'csharp');
      const typeConfig = DATA_TYPES[f.type];
      const attributes = [];
      if (f.isPrimaryKey) attributes.push('[Key]');
      if (typeConfig && typeConfig.mappings.csharp.attributes) {
          attributes.push(...typeConfig.mappings.csharp.attributes({ length: f.length, precision: f.precision, scale: f.scale }));
      }
      
      const isValueType = ['int', 'decimal', 'double', 'DateTime', 'bool'].includes(type);
      let initializer = '';
      if (f.allowNull) type += '?';
      else {
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

    // Nav Properties
    const childRels = relationships.filter(r => r.fromTableId === table.id);
    const childProps = childRels.map(r => {
        const childTable = tables.find(t => t.id === r.toTableId);
        if (!childTable) return '';
        return `        public virtual ICollection<${toPascalCase(childTable.name)}> ${toPascalCase(childTable.name)}s { get; set; } = new List<${toPascalCase(childTable.name)}>();`;
    }).join('\n\n');

    const parentRels = relationships.filter(r => r.toTableId === table.id);
    const parentProps = parentRels.map(r => {
        const parentTable = tables.find(t => t.id === r.fromTableId);
        const fkField = table.fields.find(f => f.id === r.toFieldId);
        if (!parentTable || !fkField) return '';
        return `        [ForeignKey("${fkField.name}")]\n        public virtual ${toPascalCase(parentTable.name)} ${toPascalCase(parentTable.name)} { get; set; } = null!;`;
    }).join('\n\n');

    const combinedProps = [props, childProps, parentProps].filter(p => p).join('\n\n');

    const content = `using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ${config.projectName}.Models
{
    public class ${safeName}
    {
${combinedProps}
    }
}`;
    files.push({ name: `${safeName}.cs`, path: `${root}/Models/${safeName}.cs`, content: content, language: 'csharp' });
  });

  // Query Models (Read-Only View Models)
  queries.filter(q => q.type === 'SELECT').forEach(q => {
      const selectQ = q as SelectQuery;
      const safeName = toPascalCase(q.name);
      
      const props = selectQ.columns.filter(c => c.show).map(c => {
          // Find source field to guess type
          const table = tables.find(t => t.id === c.tableId);
          const field = table?.fields.find(f => f.id === c.fieldId);
          let type = 'string';
          if (field) {
              type = resolveType(field, 'csharp');
              if (field.allowNull) type += '?';
          }
          // Fallback for calculated fields or aggregates
          if (c.aggregate === 'COUNT') type = 'int';
          if (c.aggregate === 'SUM' && type === 'int') type = 'long?';
          
          const propName = toPascalCase(c.alias || c.fieldName); // Clean prop name
          return `        public ${type} ${propName} { get; set; }`;
      }).join('\n\n');

      const content = `namespace ${config.projectName}.Models
{
    public class ${safeName}
    {
${props}
    }
}`;
      files.push({ name: `${safeName}.cs`, path: `${root}/Models/${safeName}.cs`, content: content, language: 'csharp' });
  });

  return files;
};
