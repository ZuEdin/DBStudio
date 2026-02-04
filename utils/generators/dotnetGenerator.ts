
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
  
  // AD Role Transformer Service
  if (config.authConfig?.useWindowsAuth && config.authConfig?.useAdGroups && config.authConfig?.adMapping) {
      const mappingLogic = config.authConfig.adMapping.map(m => `
            if (principal.IsInRole(@"${m.groupName}"))
            {
                identity.AddClaim(new Claim(ClaimTypes.Role, "${m.roleName}"));
            }`).join('\n');

      files.push({
          name: 'AdRoleTransformer.cs',
          path: `${root}/Services/AdRoleTransformer.cs`,
          content: `using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;

namespace ${config.projectName}.Services
{
    public class AdRoleTransformer : IClaimsTransformation
    {
        public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            var identity = (ClaimsIdentity)principal.Identity!;
            
            // Map AD Groups to Internal Roles
${mappingLogic}

            return Task.FromResult(principal);
        }
    }
}`,
          language: 'csharp'
      });
  }

  // Services (Permission + MultiTenancy + License)
  if (config.authConfig?.useUserLogin || config.authConfig?.useWindowsAuth) {
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

Dieses Projekt wurde automatisch von **DB Studio Pro** generiert.

## 🚀 Schnellstart

### 1. Voraussetzungen
* **.NET SDK** (Version ${config.backendVersion || '9.0'} oder höher).
* Laufende Datenbank: **${config.dbType}**.

### 2. Konfiguration
Öffnen Sie \`appsettings.json\` und prüfen Sie den Connection String.
Aktueller Connection String:
\`\`\`
${connectionString}
\`\`\`

${config.authConfig?.useWindowsAuth ? `
**⚠️ Wichtig: Windows Authentifizierung**
Dieses Projekt ist für IIS oder HttpSys konfiguriert. 
${config.authConfig.adMapping && config.authConfig.adMapping.length > 0 ? `
Es werden folgende AD-Gruppen auf interne Rollen gemappt:
${config.authConfig.adMapping.map(m => `* ${m.groupName} -> ${m.roleName}`).join('\n')}
` : ''}
` : ''}

### 3. Starten (Development)
Öffnen Sie ein Terminal im Ordner \`${config.projectName}\`:

\`\`\`bash
# Abhängigkeiten wiederherstellen
dotnet restore

# Starten im Dev-Modus (Hot Reload)
dotnet watch run
\`\`\`

Die API ist unter **http://localhost:${config.port}** erreichbar.
Swagger UI finden Sie unter **http://localhost:${config.port}/swagger**.

### 4. Build (Production)
Für die Veröffentlichung auf einem Server (IIS oder Linux/Docker):

\`\`\`bash
dotnet publish -c Release -o ./publish
\`\`\`

Der Ordner \`./publish\` enthält nun die ausführbare Anwendung.

## 🔑 Authentifizierung
* Methode: ${config.authConfig?.useWindowsAuth ? 'Windows (AD)' : config.authConfig?.useUserLogin ? 'JWT (Login)' : 'Keine / Anonymous'}
${config.authConfig?.devBypass ? '* **Dev Bypass aktiv:** Im Entwicklungsmodus wird ein Admin-User simuliert.*' : ''}

## 📦 Multi-Tenancy
${config.multiTenancy?.enabled ? `Aktiviert (${config.multiTenancy.strategy}). Requests müssen den Header \`X-Tenant-ID\` senden oder den Query-Parameter \`?tenantId=...\`.` : 'Deaktiviert.'}
`;

  files.push({ name: 'README.md', path: `${root}/README.md`, content: readmeContent, language: 'markdown' });

  return files;
};
