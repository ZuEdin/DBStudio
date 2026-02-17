
import { BackendConfig, DbType, VirtualFile, Table, Relationship, Query, SelectQuery } from '../../../types/index';
import { generateSqlSelect } from '../../sqlHelper';
import { toPascalCase } from '../common';

export const generateProgram = (config: BackendConfig, tables: Table[], relationships: Relationship[], queries: Query[], root: string): VirtualFile => {
  const isBlazor = config.frontendFramework === 'blazor';
  let dbConfigCode = `builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));`;
  if (config.dbType === DbType.SQLite) dbConfigCode = `builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));`;
  if (config.dbType === DbType.MySQL) dbConfigCode = `builder.Services.AddDbContext<AppDbContext>(options => options.UseMySql(builder.Configuration.GetConnectionString("DefaultConnection"), ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))));`;

  const swaggerSetup = config.useSwagger ? `builder.Services.AddEndpointsApiExplorer(); builder.Services.AddSwaggerGen();` : '';
  const swaggerUse = config.useSwagger ? `app.UseSwagger(); app.UseSwaggerUI();` : '';

  let authServices = '';
  let authAppUse = '';
  let namespaces = 'using System.Security.Claims;\nusing Quartz;\nusing Microsoft.AspNetCore.Authentication;';

  const authConfig = config.authConfig;

  // Always register CurrentUserService and HttpContextAccessor for Audit
  authServices += `
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<${config.projectName}.Services.ICurrentUserService, ${config.projectName}.Services.CurrentUserService>();
`;

  if (authConfig?.useWindowsAuth) {
      namespaces += '\nusing Microsoft.AspNetCore.Authentication.Negotiate;';
      authServices += `
builder.Services.AddAuthentication(NegotiateDefaults.AuthenticationScheme).AddNegotiate();
builder.Services.AddScoped<${config.projectName}.Services.IAdService, ${config.projectName}.Services.AdService>();
`;
      if (authConfig.adMapping && authConfig.adMapping.length > 0) {
          namespaces += `\nusing ${config.projectName}.Services;`;
          authServices += `\nbuilder.Services.AddTransient<IClaimsTransformation, AdRoleTransformer>();\n`;
      }
      authAppUse += `app.UseAuthentication(); app.UseAuthorization();`;
  } else if (authConfig?.useUserLogin) {
      namespaces += `\nusing ${config.projectName}.Services;`;
      authServices += `\nbuilder.Services.AddScoped<IPermissionService, PermissionService>();\n`;
  }

  // Update CORS policy to allow credentials if Windows Auth is enabled
  // Use SetIsOriginAllowed to allow any localhost port without wildcard
  const corsPolicy = authConfig?.useWindowsAuth 
    ? `app.UseCors(x => x.SetIsOriginAllowed(origin => true).AllowAnyMethod().AllowAnyHeader().AllowCredentials());`
    : `app.UseCors(x => x.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());`;

  const content = `using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using ${config.projectName}.Data;
${namespaces}
${config.multiTenancy?.enabled ? `using ${config.projectName}.Services;` : ''}

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options => { options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles; });
${config.multiTenancy?.enabled ? `builder.Services.AddScoped<ITenantService, TenantService>();` : ''}

${dbConfigCode}
${swaggerSetup}

builder.Services.AddQuartz(q => { q.UseMicrosoftDependencyInjectionJobFactory(); });
builder.Services.AddQuartzHostedService(opt => { opt.WaitForJobsToComplete = true; });

${authServices}

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();
        DbInitializer.Initialize(context);
    } catch (Exception ex) {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "DB Init Error");
    }
}

${swaggerUse}
${isBlazor ? 'app.UseBlazorFrameworkFiles();' : ''}
app.UseDefaultFiles();
app.UseStaticFiles();
${config.multiTenancy?.enabled ? `app.UseMiddleware<TenantMiddleware>();` : ''}

// CORS Config
${corsPolicy}

${authAppUse}
app.MapControllers();
${isBlazor ? 'app.MapFallbackToFile("index.html");' : 'app.MapFallbackToFile("index.html");'}

app.Run();`;

  return { name: 'Program.cs', path: `${root}/Program.cs`, content: content, language: 'csharp' };
};
