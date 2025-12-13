
import { Table, Relationship, Query, SelectQuery, BackendConfig, VirtualFile, DbType } from '../../types/index';
import { DATA_TYPES } from '../../config/dataTypes';
import { resolveType, isNullable } from './common';

export const generateDotNet = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Backend/${config.projectName}`;
  
  // 0. README.md
  const readme = `# ${config.projectName}

## Database Provider: ${config.dbType}

1. **Database Configuration**:
   The connection string is configured in \`appsettings.json\`. 
   Current setting: ${config.dbConnection}

2. **Run**:
   The application is configured to **automatically create the database and tables** on startup if they don't exist.
   
   \`\`\`bash
   dotnet run
   \`\`\`
   
3. **API Documentation**:
   The app is configured to launch Swagger automatically at:
   https://localhost:${config.port + 2000}/swagger
   http://localhost:${config.port}/swagger
`;
  files.push({ name: 'README.md', path: `${root}/README.md`, content: readme, language: 'html' });

  // 0.1 CLI_COMMANDS.txt (Detailed Setup Guide)
  const cliCommands = `===============================================================
ANLEITUNG: ${config.projectName} (.NET 8/9 API)
===============================================================

VORAUSSETZUNGEN:
----------------
1. .NET SDK 9.0 (oder 8.0) muss installiert sein.
   Download: https://dotnet.microsoft.com/download
2. Datenbank:
   ${config.dbType === DbType.SQL ? '- SQL Server (LocalDB oder Express) muss laufen.' : ''}
   ${config.dbType === DbType.MySQL ? '- MySQL Server muss laufen und erreichbar sein.' : ''}
   ${config.dbType === DbType.SQLite ? '- Keine Installation nötig (Datei wird erstellt).' : ''}

BEFEHLE ZUM STARTEN (Terminal / CMD / PowerShell):
--------------------------------------------------

1. In das Projektverzeichnis wechseln:
   cd Backend/${config.projectName}

2. Abhängigkeiten wiederherstellen:
   dotnet restore

   (Hinweis: Sie müssen KEINE Pakete manuell mit 'dotnet add package' hinzufügen. 
   Alle benötigten Pakete wie EntityFrameworkCore sind bereits in der 
   Datei '${config.projectName}.csproj' definiert und werden durch 'restore' geladen.)

3. Projekt bauen (optional, prüft auf Fehler):
   dotnet build

4. Server starten:
   dotnet run

   Hinweis: Beim ersten Start wird die Datenbank automatisch angelegt 
   (dank 'context.Database.EnsureCreated()' in Program.cs).

5. API Testen:
   Öffnen Sie im Browser: http://localhost:${config.port}/swagger

HÄUFIGE FEHLER:
---------------
- "Connection refused": Prüfen Sie die ConnectionString in appsettings.json.
- "SDK not found": Prüfen Sie 'dotnet --version'.
`;
  files.push({ name: 'CLI_COMMANDS.txt', path: `${root}/CLI_COMMANDS.txt`, content: cliCommands, language: 'text' });

  // 1. appsettings.json
  const connectionString = config.dbConnection || (config.dbType === DbType.SQLite 
        ? "Data Source=app.db" 
        : "Server=.;Database=MyDb;Trusted_Connection=True;TrustServerCertificate=True;");
  
  const appSettings = {
    "Logging": {
      "LogLevel": {
        "Default": "Information",
        "Microsoft.AspNetCore": "Warning"
      }
    },
    "AllowedHosts": "*",
    "ConnectionStrings": {
      "DefaultConnection": connectionString
    }
  };
  files.push({ name: 'appsettings.json', path: `${root}/appsettings.json`, content: JSON.stringify(appSettings, null, 2), language: 'json' });

  // 1.1 Properties/launchSettings.json
  const httpsPort = config.port + 2000;
  const httpPort = config.port;

  const launchSettings = {
    "$schema": "https://json.schemastore.org/launchsettings.json",
    "profiles": {
      "http": {
        "commandName": "Project",
        "dotnetRunMessages": true,
        "launchBrowser": true,
        "launchUrl": config.useSwagger ? "swagger" : "",
        "applicationUrl": `http://localhost:${httpPort}`,
        "environmentVariables": {
          "ASPNETCORE_ENVIRONMENT": "Development"
        }
      },
      "https": {
        "commandName": "Project",
        "dotnetRunMessages": true,
        "launchBrowser": true,
        "launchUrl": config.useSwagger ? "swagger" : "",
        "applicationUrl": `https://localhost:${httpsPort};http://localhost:${httpPort}`,
        "environmentVariables": {
          "ASPNETCORE_ENVIRONMENT": "Development"
        }
      }
    }
  };
  files.push({ name: 'launchSettings.json', path: `${root}/Properties/launchSettings.json`, content: JSON.stringify(launchSettings, null, 2), language: 'json' });

  // 1.2 CSPROJ File - DYNAMIC PACKAGES based on DbType
  let dbPackage = '';
  if (config.dbType === DbType.MySQL) {
      dbPackage = `<PackageReference Include="Pomelo.EntityFrameworkCore.MySql" Version="8.0.0" />`;
  } else if (config.dbType === DbType.SQLite) {
      dbPackage = `<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="9.0.0" />`;
  } else {
      // Default to SQL Server
      dbPackage = `<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.0" />`;
  }

  const csprojContent = `<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="9.0.10" />
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />
    ${dbPackage}
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
  </ItemGroup>

</Project>`;
  files.push({ name: `${config.projectName}.csproj`, path: `${root}/${config.projectName}.csproj`, content: csprojContent, language: 'xml' });


  // 2. Program.cs - DYNAMIC Configuration based on DbType
  let dbConfigCode = '';
  if (config.dbType === DbType.MySQL) {
      dbConfigCode = `builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(builder.Configuration.GetConnectionString("DefaultConnection"), 
    ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))));`;
  } else if (config.dbType === DbType.SQLite) {
      dbConfigCode = `builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));`;
  } else {
      // SQL Server
      dbConfigCode = `builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));`;
  }

  const swaggerSetup = config.useSwagger ? `
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();` : '';
  const swaggerUse = config.useSwagger ? `
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}` : '';

  const programCs = `using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using ${config.projectName}.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Fixes circular references (Cycle Loop) when returning related data (Includes)
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// Database Connection
${dbConfigCode}
${swaggerSetup}

var app = builder.Build();

// --- AUTO-GENERATION: Create DB if not exists ---
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred creating the DB.");
    }
}
// ------------------------------------------------

// Configure the HTTP request pipeline.
${swaggerUse}

app.UseCors(x => x.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();`;

  files.push({ name: 'Program.cs', path: `${root}/Program.cs`, content: programCs, language: 'csharp' });

  // 3. DbContext
  const dbSets = tables.map(t => `        public DbSet<${t.name}> ${t.name}s { get; set; }`).join('\n');
  
  const dbContext = `using Microsoft.EntityFrameworkCore;
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
            
            // Optional: Fluent API configurations
        }
    }
}`;
  files.push({ name: 'AppDbContext.cs', path: `${root}/Data/AppDbContext.cs`, content: dbContext, language: 'csharp' });

  // 4. Models with Relationships
  tables.forEach(table => {
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
      
      // Handle Nullability
      let suffix = '';
      let initializer = '';

      if (f.allowNull) {
          type += '?';
      } else {
          // Non-nullable handling
          if (type === 'string') {
              // Avoid CS8618 by initializing
              initializer = ' = string.Empty;';
          } else if (!isValueType) {
              initializer = ' = default!;';
          }
      }
      
      if (f.defaultValue) {
          if (type.startsWith('string')) initializer = ` = "${f.defaultValue}";`;
          else initializer = ` = ${f.defaultValue};`;
      }

      const indent = "        "; 
      const attrBlock = attributes.length > 0 ? attributes.map(a => `${indent}${a}`).join('\n') + '\n' : '';
      return `${attrBlock}${indent}public ${type} ${f.name} { get; set; }${initializer}`;
    }).join('\n\n');

    // Add Navigation Properties
    const childRels = relationships.filter(r => r.fromTableId === table.id);
    const childProps = childRels.map(r => {
        const childTable = tables.find(t => t.id === r.toTableId);
        if (!childTable) return '';
        // Initialize list to avoid null reference on add
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

    const modelContent = `using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ${config.projectName}.Models
{
    public class ${table.name}
    {
${combinedProps}
    }
}`;
    files.push({ name: `${table.name}.cs`, path: `${root}/Models/${table.name}.cs`, content: modelContent, language: 'csharp' });
  });

  // 5. Query DTOs (Still relevant for specific queries)
  queries.forEach(query => {
      if (query.type !== 'SELECT') return;
      const selectQuery = query as SelectQuery;
      
      const props = selectQuery.columns.filter(c => c.show).map(col => {
          let csharpType = 'string';
          const table = tables.find(t => t.id === col.tableId);
          if (table) {
              const field = table.fields.find(f => f.id === col.fieldId);
              if (field) csharpType = resolveType(field, 'csharp');
          }
          if (col.aggregate === 'COUNT') csharpType = 'int';
          if (col.aggregate === 'SUM' || col.aggregate === 'AVG') csharpType = 'double';

          const propName = col.alias || col.fieldName;
          return `        public ${csharpType} ${propName} { get; set; }`;
      }).join('\n\n');

      const dtoName = `${query.name.replace(/\s+/g, '')}Dto`;
      const content = `namespace ${config.projectName}.Models.DTOs
{
    public class ${dtoName}
    {
${props}
    }
}`;
      files.push({ name: `${dtoName}.cs`, path: `${root}/Models/DTOs/${dtoName}.cs`, content: content, language: 'csharp' });
  });

  // 6. Query Controller
  if (queries.length > 0) {
      const queryMethods = queries.map(q => {
          if (q.type !== 'SELECT') return '';
          const dtoName = `${q.name.replace(/\s+/g, '')}Dto`;
          const methodName = `Get${q.name.replace(/\s+/g, '')}`;
          return `
        [HttpGet("${q.name.replace(/\s+/g, '-').toLowerCase()}")]
        public async Task<ActionResult<IEnumerable<${dtoName}>>> ${methodName}()
        {
            return Ok(new List<${dtoName}>());
        }`;
      }).join('\n');

      const queriesController = `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ${config.projectName}.Data;
using ${config.projectName}.Models.DTOs;

namespace ${config.projectName}.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class QueriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public QueriesController(AppDbContext context)
        {
            _context = context;
        }
${queryMethods}
    }
}`;
      files.push({ name: 'QueriesController.cs', path: `${root}/Controllers/QueriesController.cs`, content: queriesController, language: 'csharp' });
  }

  // 7. Controllers
  tables.forEach(table => {
    const pkField = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
    const pkType = resolveType(pkField, 'csharp');
    
    // Calculate Includes
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

    const controllerContent = `using Microsoft.AspNetCore.Mvc;
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

        // GET: api/${table.name}
        [HttpGet]
        public async Task<ActionResult<IEnumerable<${table.name}>>> Get${table.name}s()
        {
            return await _context.${table.name}s${includeString}.ToListAsync();
        }

        // GET: api/${table.name}/5
        [HttpGet("{id}")]
        public async Task<ActionResult<${table.name}>> Get${table.name}(${pkType} id)
        {
            var item = await _context.${table.name}s${includeString}
                .FirstOrDefaultAsync(x => x.${pkField.name} == id);

            if (item == null) return NotFound();
            return item;
        }

        // POST: api/${table.name}
        [HttpPost]
        public async Task<ActionResult<${table.name}>> Post${table.name}(${table.name} item)
        {
            _context.${table.name}s.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get${table.name}), new { id = item.${pkField.name} }, item);
        }

        // PUT: api/${table.name}/5
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

        // DELETE: api/${table.name}/5
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
    files.push({ name: `${table.name}Controller.cs`, path: `${root}/Controllers/${table.name}Controller.cs`, content: controllerContent, language: 'csharp' });
  });

  return files;
};
