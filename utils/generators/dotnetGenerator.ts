
import { Table, Relationship, Query, BackendConfig, VirtualFile, DbType, SelectQuery } from '../../types/index';
import { generateCsproj } from './dotnet/csproj';
import { generateProgram } from './dotnet/program';
import { generateDbContext, generateModels } from './dotnet/models';
import { generateControllers } from './dotnet/controllers';
import { generatePermissionService } from './dotnet/services';

export const generateDotNet = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Backend/${config.projectName}`;
  
  // 1. Base appsettings.json
  const connectionString = config.dbConnection || (config.dbType === DbType.SQLite 
        ? "Data Source=app.db" 
        : "Server=.;Database=MyDb;Trusted_Connection=True;TrustServerCertificate=True;");
  
  const appSettingsObj: any = {
    "Logging": { "LogLevel": { "Default": "Information", "Microsoft.AspNetCore": "Warning" } },
    "AllowedHosts": "*",
    "ConnectionStrings": { "DefaultConnection": connectionString }
  };

  if (config.licensing?.enabled) {
      appSettingsObj["LicenseKey"] = config.licensing.licenseKey || "";
  }

  files.push({ name: 'appsettings.json', path: `${root}/appsettings.json`, content: JSON.stringify(appSettingsObj, null, 2), language: 'json' });

  // 2. Environment specific appsettings
  if (config.environments) {
      config.environments.forEach(env => {
          const envSuffix = env.name === 'Production' ? 'Production' : env.name === 'Staging' ? 'Staging' : 'Development';
          files.push({ 
              name: `appsettings.${envSuffix}.json`, 
              path: `${root}/appsettings.${envSuffix}.json`, 
              content: JSON.stringify({
                "ConnectionStrings": { "DefaultConnection": env.dbConnection || connectionString },
              }, null, 2), 
              language: 'json' 
          });
      });
  }

  // launchSettings.json
  const launchSettings = {
    "$schema": "http://json.schemastore.org/launchsettings.json",
    "profiles": {
      "http": {
        "commandName": "Project",
        "dotnetRunMessages": true,
        "launchBrowser": true,
        "launchUrl": "swagger",
        "applicationUrl": `http://localhost:${config.port}`,
        "environmentVariables": {
          "ASPNETCORE_ENVIRONMENT": "Development"
        }
      }
    }
  };
  files.push({ name: 'launchSettings.json', path: `${root}/Properties/launchSettings.json`, content: JSON.stringify(launchSettings, null, 2), language: 'json' });

  // CSPROJ
  files.push(generateCsproj(config, root));

  // Program.cs
  files.push(generateProgram(config, tables, relationships, queries, root));
  
  // Services (Permission + MultiTenancy + License)
  if (config.authConfig?.useUserLogin) {
      files.push(generatePermissionService(config, root));
  }

  if (config.multiTenancy?.enabled) {
      // Tenant Middleware
      files.push({
          name: 'TenantMiddleware.cs',
          path: `${root}/Middleware/TenantMiddleware.cs`,
          content: `using ${config.projectName}.Services;

namespace ${config.projectName}
{
    public class TenantMiddleware
    {
        private readonly RequestDelegate _next;

        public TenantMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, ITenantService tenantService)
        {
            var tenantId = tenantService.GetTenantId();
            if(tenantId != null) context.Items["TenantId"] = tenantId;
            await _next(context);
        }
    }
}`,
          language: 'csharp'
      });
  }

  if (config.licensing?.enabled) {
      files.push({
          name: 'LicenseMiddleware.cs',
          path: `${root}/Middleware/LicenseMiddleware.cs`,
          content: `namespace ${config.projectName}
{
    public class LicenseMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _config;

        public LicenseMiddleware(RequestDelegate next, IConfiguration config)
        {
            _next = next;
            _config = config;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var key = _config["LicenseKey"];
            if (string.IsNullOrEmpty(key) || key.Length < 10) // Mock validation
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsync("Invalid License Key. Please contact support.");
                return;
            }
            await _next(context);
        }
    }
}`,
          language: 'csharp'
      });
  }

  // Data Layer
  files.push(generateDbContext(tables, queries, config, root));
  files.push(...generateModels(tables, relationships, queries, config, root));
  
  // API Layer
  files.push(...generateControllers(tables, relationships, queries, config, root));

  // Docs
  const readmeContent = `# ${config.projectName} (.NET Web API)

## Voraussetzungen
1. Installieren Sie das **.NET SDK** (Version ${config.backendVersion || '9.0'} oder höher).
2. Stellen Sie sicher, dass Ihre Datenbank (${config.dbType}) läuft.

## Environments
Das Projekt enthält Konfigurationen für:
${config.environments?.map(e => `- ${e.name} (appsettings.${e.name === 'Production' ? 'Production' : e.name === 'Staging' ? 'Staging' : 'Development'}.json)`).join('\n') || '- Default'}

## Multi-Tenancy
${config.multiTenancy?.enabled ? 'Aktiviert. Requests müssen den Header `X-Tenant-ID` senden.' : 'Deaktiviert.'}

## Starten
\`\`\`bash
dotnet restore
dotnet run --environment Development
\`\`\`
`;

  files.push({ name: 'README.md', path: `${root}/README.md`, content: readmeContent, language: 'markdown' });

  return files;
};
