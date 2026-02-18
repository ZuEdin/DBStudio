
import { Table, Relationship, Query, BackendConfig, VirtualFile, DbType, SelectQuery } from '../../types/index';
import { generateCsproj } from './dotnet/csproj';
import { generateProgram } from './dotnet/program';
import { generateDbContext, generateModels } from './dotnet/models';
import { generateControllers } from './dotnet/controllers';
import { generateAdServices } from './dotnet/services'; // UPDATED IMPORT
import { generateDbInitializer } from './dotnet/seed';

export const generateDotNet = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Backend/${config.projectName}`;
  
  // 1. Base appsettings.json
  const connectionString = config.dbConnection || (config.dbType === DbType.SQLite 
        ? "Data Source=app.db" 
        : "Server=.;Database=MyDb;Trusted_Connection=True;TrustServerCertificate=True;");
  
  // ... (Settings generation logic remains same) ...
  const baseAppSettings = {
    "Logging": { "LogLevel": { "Default": "Information", "Microsoft.AspNetCore": "Warning" } },
    "AllowedHosts": "*",
    "ConnectionStrings": { "DefaultConnection": connectionString }
  };
  files.push({ name: 'appsettings.json', path: `${root}/appsettings.json`, content: JSON.stringify(baseAppSettings, null, 2), language: 'json' });

  // 2. CSPROJ
  files.push(generateCsproj(config, root));

  // 3. Program.cs
  files.push(generateProgram(config, tables, relationships, queries, root));
  
  // 4. Services (Permission + AD + MultiTenancy)
  // CHANGED: Use generateAdServices to get array
  const servicesFiles = generateAdServices(config, root);
  files.push(...servicesFiles);

  if (config.authConfig?.useWindowsAuth && config.authConfig?.useAdGroups && config.authConfig?.adMapping) {
      // AdRoleTransformer logic...
      // Map configured AD Groups to Internal Roles
      const mappingLogic = config.authConfig.adMapping.map(m => `
            if (principal.IsInRole(@"${m.groupName}"))
            {
                // Assign Internal Role claim
                if (!identity.HasClaim(ClaimTypes.Role, "${m.roleName}")) 
                {
                    identity.AddClaim(new Claim(ClaimTypes.Role, "${m.roleName}"));
                }
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
            
            // Map AD Groups to Internal Roles (defined in App Generator)
            ${mappingLogic}
            
            return Task.FromResult(principal);
        }
    }
}`,
          language: 'csharp'
      });
  }

  if (config.multiTenancy?.enabled) {
      files.push({
          name: 'TenantMiddleware.cs',
          path: `${root}/Middleware/TenantMiddleware.cs`,
          content: `using ${config.projectName}.Services;
namespace ${config.projectName}
{
    public class TenantMiddleware
    {
        private readonly RequestDelegate _next;
        public TenantMiddleware(RequestDelegate next) { _next = next; }
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

  // Data Layer
  files.push(generateDbContext(tables, queries, config, root));
  files.push(generateDbInitializer(tables, config, root)); 
  files.push(...generateModels(tables, relationships, queries, config, root));
  
  // API Layer
  files.push(...generateControllers(tables, relationships, queries, config, root));

  // Docs
  files.push({ name: 'README.md', path: `${root}/README.md`, content: `# ${config.projectName}\n\nGenerated .NET API`, language: 'markdown' });

  return files;
};
