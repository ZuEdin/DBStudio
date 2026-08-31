import { Table, Relationship, FieldType } from '../../types';
import { FluentValidationGenerator } from './fluentValidationGenerator';

export interface EfCoreGeneratorOptions {
  namespace?: string;
  dbContextName?: string;
  targetFramework?: '.NET 10.0' | '.NET 9.0' | '.NET 8.0';
  useNullableReferenceTypes?: boolean;
  generateFluentApi?: boolean;
  generateSeedData?: boolean;
  usePascalCase?: boolean;
  databaseProvider?: 'SqlServer' | 'PostgreSQL' | 'Sqlite' | 'MySQL';
  includeAuditProperties?: boolean;
  generateValidators?: boolean;
}

export interface GeneratedCsFile {
  fileName: string;
  description: string;
  code: string;
  category: 'entity' | 'dbcontext' | 'seed' | 'controller' | 'validator' | 'csproj';
}

export interface EfCoreGenerationResult {
  entities: GeneratedCsFile[];
  dbContext: GeneratedCsFile;
  seedData?: GeneratedCsFile;
  controllers: GeneratedCsFile[];
  validators?: GeneratedCsFile[];
  csproj: GeneratedCsFile;
  summary: {
    totalEntities: number;
    totalProperties: number;
    totalRelationships: number;
    targetFramework: string;
  };
}

export class EfCoreCodeGenerator {
  public static generateAll(
    tables: Table[],
    relationships: Relationship[] = [],
    options: EfCoreGeneratorOptions = {}
  ): EfCoreGenerationResult {
    const namespace = options.namespace || 'EnterpriseStudio.Data';
    const dbContextName = options.dbContextName || 'AppDbContext';
    const targetFramework = options.targetFramework || '.NET 10.0';
    const useNullable = options.useNullableReferenceTypes ?? true;
    const provider = options.databaseProvider || 'SqlServer';

    // 1. Generate Domain Entities
    const entities: GeneratedCsFile[] = tables.map((table) => {
      const className = this.toPascalCase(table.name.replace(/^tbl_/, ''));
      const code = this.generateEntityClass(table, relationships, tables, namespace, useNullable);
      return {
        fileName: `${className}.cs`,
        description: `Entity Domain-Klasse für Tabelle ${table.name}`,
        code,
        category: 'entity',
      };
    });

    // 2. Generate DbContext
    const dbContextCode = this.generateDbContext(
      tables,
      relationships,
      namespace,
      dbContextName,
      options
    );
    const dbContext: GeneratedCsFile = {
      fileName: `${dbContextName}.cs`,
      description: `EF Core DbContext mit OnModelCreating Fluent-API`,
      code: dbContextCode,
      category: 'dbcontext',
    };

    // 3. Generate Seed Data
    const seedCode = this.generateSeedDataFile(tables, namespace);
    const seedData: GeneratedCsFile = {
      fileName: `ModelBuilderExtensions.Seed.cs`,
      description: `HasData() Initial-Seed-Erweiterungsmethode`,
      code: seedCode,
      category: 'seed',
    };

    // 4. Generate Web API Controllers (ASP.NET Core .NET 10)
    const controllers: GeneratedCsFile[] = tables.map((table) => {
      const entityName = this.toPascalCase(table.name.replace(/^tbl_/, ''));
      const code = this.generateApiController(table, entityName, namespace, dbContextName);
      return {
        fileName: `${entityName}Controller.cs`,
        description: `RESTful CRUD Web API Controller für ${entityName}`,
        code,
        category: 'controller',
      };
    });

    // 5. Generate FluentValidation Validators (.NET 10)
    const validators = options.generateValidators !== false 
      ? FluentValidationGenerator.generateValidators(tables, namespace)
      : undefined;

    // 6. Generate .csproj
    const csprojCode = this.generateCsproj(provider, targetFramework);
    const csproj: GeneratedCsFile = {
      fileName: `EnterpriseStudio.Backend.csproj`,
      description: `Vorkonfiguriertes .NET 10 C# Projektfile mit NuGet-Referenzen`,
      code: csprojCode,
      category: 'csproj',
    };

    let totalProps = 0;
    tables.forEach((t) => (totalProps += t.fields.length));

    return {
      entities,
      dbContext,
      seedData,
      controllers,
      validators,
      csproj,
      summary: {
        totalEntities: tables.length,
        totalProperties: totalProps,
        totalRelationships: relationships.length,
        targetFramework,
      },
    };
  }

  private static generateEntityClass(
    table: Table,
    relationships: Relationship[],
    allTables: Table[],
    namespace: string,
    useNullable: boolean
  ): string {
    const className = this.toPascalCase(table.name.replace(/^tbl_/, ''));
    const nullableMark = useNullable ? '?' : '';

    // Identify relations where this table is target (child) or source (parent)
    const incomingRelations = relationships.filter((r) => r.toTableId === table.id || r.toTable === table.name);
    const outgoingRelations = relationships.filter((r) => r.fromTableId === table.id || r.fromTable === table.name);

    let propsCode = '';

    for (const field of table.fields) {
      const isRequired = field.allowNull === false || field.isNullable === false || field.isPrimaryKey;
      const csharpType = this.mapFieldTypeToCSharp(field.type, isRequired);
      const propName = this.toPascalCase(field.name);
      const isPk = field.isPrimaryKey || field.name.toLowerCase() === 'id';

      if (isPk) {
        propsCode += `    [Key]\n`;
      }
      if (isRequired && csharpType.includes('string')) {
        propsCode += `    [Required]\n`;
      }
      if (field.length && csharpType.includes('string')) {
        propsCode += `    [MaxLength(${field.length})]\n`;
      }
      if (this.isDecimalField(field.type)) {
        propsCode += `    [Column(TypeName = "decimal(18,2)")]\n`;
      }

      propsCode += `    public ${csharpType} ${propName} { get; set; }`;
      if (csharpType === 'string' && !isRequired && useNullable) {
        propsCode += ` = string.Empty;`;
      } else if (csharpType === 'string' && isRequired) {
        propsCode += ` = null!;`;
      }
      propsCode += `\n\n`;
    }

    // Navigation Properties
    let navPropsCode = '';
    if (incomingRelations.length > 0 || outgoingRelations.length > 0) {
      navPropsCode += `    // ==========================================\n`;
      navPropsCode += `    // Navigation Properties & Relationen (EF Core)\n`;
      navPropsCode += `    // ==========================================\n`;

      for (const rel of outgoingRelations) {
        const targetTable = allTables.find((t) => t.id === rel.toTableId) || { name: rel.toTable || 'Target' };
        const targetEntity = this.toPascalCase(targetTable.name.replace(/^tbl_/, ''));
        navPropsCode += `    public virtual ICollection<${targetEntity}> ${targetEntity}List { get; set; } = new List<${targetEntity}>();\n`;
      }

      for (const rel of incomingRelations) {
        const sourceTable = allTables.find((t) => t.id === rel.fromTableId) || { name: rel.fromTable || 'Source' };
        const sourceEntity = this.toPascalCase(sourceTable.name.replace(/^tbl_/, ''));
        const fkName = rel.toField || 'ParentId';
        navPropsCode += `    [ForeignKey(nameof(${this.toPascalCase(fkName)}))]\n`;
        navPropsCode += `    public virtual ${sourceEntity}${nullableMark} ${sourceEntity} { get; set; }\n`;
      }
    }

    return `// <auto-generated>
//    Erstellt von DB Studio Pro - C# .NET 10 EF Core Generator
//    Generiert am: ${new Date().toISOString()}
// </auto-generated>

#nullable enable

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ${namespace}.Entities;

/// <summary>
/// Domain Entity repräsentiert Tabelle [${table.name}]
/// </summary>
[Table("${table.name}")]
public class ${className}
{
${propsCode}${navPropsCode}}
`;
  }

  private static generateDbContext(
    tables: Table[],
    relationships: Relationship[],
    namespace: string,
    dbContextName: string,
    _options: EfCoreGeneratorOptions
  ): string {
    let dbSetsCode = '';
    let fluentApiCode = '';

    for (const table of tables) {
      const entityName = this.toPascalCase(table.name.replace(/^tbl_/, ''));
      const dbSetName = entityName.endsWith('s') ? `${entityName}es` : `${entityName}s`;
      dbSetsCode += `    public virtual DbSet<${entityName}> ${dbSetName} => Set<${entityName}>();\n`;

      fluentApiCode += `        // Konfiguration für Entity: ${entityName}\n`;
      fluentApiCode += `        modelBuilder.Entity<${entityName}>(entity =>\n`;
      fluentApiCode += `        {\n`;
      fluentApiCode += `            entity.ToTable("${table.name}");\n`;

      const pkField = table.fields.find((f) => f.isPrimaryKey || f.name.toLowerCase() === 'id');
      if (pkField) {
        fluentApiCode += `            entity.HasKey(e => e.${this.toPascalCase(pkField.name)});\n`;
      }

      // Fields configuration
      for (const field of table.fields) {
        const propName = this.toPascalCase(field.name);
        if (field.isUnique) {
          fluentApiCode += `            entity.HasIndex(e => e.${propName}).IsUnique();\n`;
        }
        if (this.isDecimalField(field.type)) {
          fluentApiCode += `            entity.Property(e => e.${propName}).HasPrecision(18, 2);\n`;
        }
        if (field.defaultValue !== undefined && field.defaultValue !== '') {
          const val = typeof field.defaultValue === 'string' ? `"${field.defaultValue}"` : field.defaultValue;
          fluentApiCode += `            entity.Property(e => e.${propName}).HasDefaultValue(${val});\n`;
        }
      }

      fluentApiCode += `        });\n\n`;
    }

    // Relationship Fluent API
    if (relationships.length > 0) {
      fluentApiCode += `        // Relationen & Fremdschlüssel-Konfiguration\n`;
      for (const rel of relationships) {
        const fromTable = tables.find((t) => t.id === rel.fromTableId) || { name: rel.fromTable || 'Source' };
        const toTable = tables.find((t) => t.id === rel.toTableId) || { name: rel.toTable || 'Target' };

        const fromEntity = this.toPascalCase(fromTable.name.replace(/^tbl_/, ''));
        const toEntity = this.toPascalCase(toTable.name.replace(/^tbl_/, ''));
        const fkProp = this.toPascalCase(rel.fromField || 'Id');
        const isCascade = rel.onDelete === 'CASCADE';

        fluentApiCode += `        modelBuilder.Entity<${toEntity}>()\n`;
        fluentApiCode += `            .HasOne(d => d.${fromEntity})\n`;
        fluentApiCode += `            .WithMany(p => p.${toEntity}List)\n`;
        fluentApiCode += `            .HasForeignKey("${fkProp}")\n`;
        fluentApiCode += `            .OnDelete(DeleteBehavior.${isCascade ? 'Cascade' : 'Restrict'});\n\n`;
      }
    }

    return `// <auto-generated>
//    Erstellt von DB Studio Pro - C# .NET 10 EF Core Generator
//    Generiert am: ${new Date().toISOString()}
// </auto-generated>

#nullable enable

using Microsoft.EntityFrameworkCore;
using ${namespace}.Entities;

namespace ${namespace};

/// <summary>
/// Haupt-Datenbankkontext für .NET 10 EF Core
/// </summary>
public class ${dbContextName} : DbContext
{
    public ${dbContextName}(DbContextOptions<${dbContextName}> options)
        : base(options)
    {
    }

    // ==========================================
    // DbSets (Tabellen-Mappings)
    // ==========================================
${dbSetsCode}
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

${fluentApiCode}
        // Initial-Seed Data laden
        modelBuilder.Seed();
    }
}
`;
  }

  private static generateSeedDataFile(tables: Table[], namespace: string): string {
    let seedBlocks = '';

    for (const table of tables) {
      const entityName = this.toPascalCase(table.name.replace(/^tbl_/, ''));
      if (table.data && table.data.length > 0) {
        seedBlocks += `        modelBuilder.Entity<${entityName}>().HasData(\n`;
        const recordItems = table.data.slice(0, 10).map((r, i) => {
          const fieldAssignments = Object.entries(r)
            .map(([k, v]) => {
              const prop = this.toPascalCase(k);
              const val = typeof v === 'string' ? `"${v.replace(/"/g, '\\"')}"` : typeof v === 'boolean' ? (v ? 'true' : 'false') : v;
              return `${prop} = ${val}`;
            })
            .join(', ');
          return `            new ${entityName} { ${fieldAssignments || `Id = ${i + 1}`} }`;
        });
        seedBlocks += recordItems.join(',\n') + '\n        );\n\n';
      }
    }

    return `// <auto-generated>
//    Erstellt von DB Studio Pro - C# .NET 10 EF Core Generator
// </auto-generated>

#nullable enable

using Microsoft.EntityFrameworkCore;
using ${namespace}.Entities;

namespace ${namespace};

public static class ModelBuilderExtensions
{
    public static void Seed(this ModelBuilder modelBuilder)
    {
${seedBlocks || '        // Keine Seed-Daten vorhanden\n'}
    }
}
`;
  }

  private static generateApiController(
    table: Table,
    entityName: string,
    namespace: string,
    dbContextName: string
  ): string {
    const pkField = table.fields.find((f) => f.isPrimaryKey || f.name.toLowerCase() === 'id');
    const pkType = pkField ? this.mapFieldTypeToCSharp(pkField.type, true) : 'int';
    const pkProp = pkField ? this.toPascalCase(pkField.name) : 'Id';
    const dbSetName = entityName.endsWith('s') ? `${entityName}es` : `${entityName}s`;

    return `// <auto-generated>
//    Erstellt von DB Studio Pro - ASP.NET Core 10 Web API Controller
// </auto-generated>

#nullable enable

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ${namespace}.Entities;

namespace ${namespace}.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ${entityName}Controller : ControllerBase
{
    private readonly ${dbContextName} _context;
    private readonly ILogger<${entityName}Controller> _logger;

    public ${entityName}Controller(${dbContextName} context, ILogger<${entityName}Controller> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/${entityName}
    [HttpGet]
    public async Task<ActionResult<IEnumerable<${entityName}>>> Get${entityName}List([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        return await _context.${dbSetName}
            .AsNoTracking()
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    // GET: api/${entityName}/5
    [HttpGet("{id}")]
    public async Task<ActionResult<${entityName}>> Get${entityName}(${pkType} id)
    {
        var item = await _context.${dbSetName}.FindAsync(id);
        if (item == null) return NotFound();
        return item;
    }

    // POST: api/${entityName}
    [HttpPost]
    public async Task<ActionResult<${entityName}>> Create${entityName}(${entityName} model)
    {
        _context.${dbSetName}.Add(model);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(Get${entityName}), new { id = model.${pkProp} }, model);
    }

    // PUT: api/${entityName}/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update${entityName}(${pkType} id, ${entityName} model)
    {
        if (id != model.${pkProp}) return BadRequest("ID mismatch");

        _context.Entry(model).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await _context.${dbSetName}.AnyAsync(e => e.${pkProp} == id))
                return NotFound();
            throw;
        }
        return NoContent();
    }

    // DELETE: api/${entityName}/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete${entityName}(${pkType} id)
    {
        var item = await _context.${dbSetName}.FindAsync(id);
        if (item == null) return NotFound();

        _context.${dbSetName}.Remove(item);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
`;
  }

  private static generateCsproj(provider: string, targetFramework: string): string {
    const tfm = targetFramework.includes('10') ? 'net10.0' : targetFramework.includes('9') ? 'net9.0' : 'net8.0';
    let packageRef = `<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.0" />`;

    if (provider === 'PostgreSQL') {
      packageRef = `<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="9.0.0" />`;
    } else if (provider === 'Sqlite') {
      packageRef = `<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="9.0.0" />`;
    } else if (provider === 'MySQL') {
      packageRef = `<PackageReference Include="Pomelo.EntityFrameworkCore.MySql" Version="8.0.2" />`;
    }

    return `<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>${tfm}</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="9.0.0">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    ${packageRef}
    <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="9.0.0">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="FluentValidation.AspNetCore" Version="11.3.0" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.9.0" />
  </ItemGroup>

</Project>
`;
  }

  private static isDecimalField(fieldType: FieldType | string): boolean {
    const t = String(fieldType).toUpperCase();
    return t === 'DECIMAL' || t === 'CURRENCY' || t === 'PERCENTAGE' || t === 'REAL';
  }

  private static mapFieldTypeToCSharp(fieldType: FieldType | string, isRequired?: boolean): string {
    const req = !!isRequired;
    const t = String(fieldType).toUpperCase();
    switch (t) {
      case 'ID':
      case 'UUID':
        return req ? 'Guid' : 'Guid?';
      case 'INT':
      case 'INTEGER':
      case 'TINYINT':
        return req ? 'int' : 'int?';
      case 'BIGINT':
        return req ? 'long' : 'long?';
      case 'DECIMAL':
      case 'CURRENCY':
      case 'PERCENTAGE':
        return req ? 'decimal' : 'decimal?';
      case 'FLOAT':
      case 'DOUBLE':
      case 'REAL':
        return req ? 'double' : 'double?';
      case 'BOOLEAN':
        return req ? 'bool' : 'bool?';
      case 'DATE':
      case 'DATETIME':
      case 'TIMESTAMP':
        return req ? 'DateTime' : 'DateTime?';
      case 'TIME':
        return req ? 'TimeSpan' : 'TimeSpan?';
      case 'JSON':
      case 'TEXT':
      case 'VARCHAR':
      case 'CHAR':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
      case 'IBAN':
      case 'BIC':
      case 'COLOR_HEX':
      case 'UNIT_MEASURE':
      case 'ORDNUNGSZAHL':
      case 'ENUM':
      default:
        return 'string';
    }
  }

  private static toPascalCase(str: string): string {
    if (!str) return 'Entity';
    return str
      .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
      .replace(/^[a-z]/, (c) => c.toUpperCase());
  }
}
