
import { BackendConfig, DbType, VirtualFile, Table, Relationship, Query, SelectQuery } from '../../../types/index';
import { generateSqlSelect } from '../../sqlHelper';
import { toPascalCase } from '../common';

export const generateProgram = (config: BackendConfig, tables: Table[], relationships: Relationship[], queries: Query[], root: string): VirtualFile => {
  let dbConfigCode = '';
  
  if (config.dbType === DbType.MySQL) {
      dbConfigCode = `builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(builder.Configuration.GetConnectionString("DefaultConnection"), 
    ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))));`;
  } else if (config.dbType === DbType.SQLite) {
      dbConfigCode = `builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));`;
  } else {
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

  // Auth Logic
  let authServices = '';
  let authAppUse = '';
  let namespaces = 'using System.Security.Claims;\nusing Quartz;\nusing Microsoft.AspNetCore.Authentication;';

  const authConfig = config.authConfig;

  if (authConfig?.useWindowsAuth) {
      namespaces += '\nusing Microsoft.AspNetCore.Authentication.Negotiate;';
      authServices += `
builder.Services.AddAuthentication(NegotiateDefaults.AuthenticationScheme)
   .AddNegotiate();
`;
      
      // Inject Transformer if mappings exist
      if (authConfig.adMapping && authConfig.adMapping.length > 0) {
          namespaces += `\nusing ${config.projectName}.Services;`;
          authServices += `\nbuilder.Services.AddTransient<IClaimsTransformation, AdRoleTransformer>();\n`;
      }

      // Add Permission Service for RBAC
      namespaces += `\nusing ${config.projectName}.Services;`;
      authServices += `\nbuilder.Services.AddScoped<IPermissionService, PermissionService>();\n`;

      authServices += `
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = options.DefaultPolicy;
});`;

      authAppUse += `
app.UseAuthentication();
app.UseAuthorization();`;
  } else if (authConfig?.useUserLogin) {
      // JWT setup (simplified for brevity in this specific file update, assuming other parts handle JWT logic if needed)
      namespaces += `\nusing ${config.projectName}.Services;`;
      authServices += `\nbuilder.Services.AddScoped<IPermissionService, PermissionService>();\n`;
  }

  if (authConfig?.devBypass) {
      // Default to Admin role for dev
      authAppUse = `
if (app.Environment.IsDevelopment())
{
    // DEV BYPASS: Simulate an authenticated user
    app.Use(async (context, next) =>
    {
        if (context.User.Identity == null || !context.User.Identity.IsAuthenticated)
        {
            var claims = new[] { 
                new Claim(ClaimTypes.Name, "DevUser"), 
                new Claim(ClaimTypes.Role, "Admin") 
            };
            var identity = new ClaimsIdentity(claims, "DevBypass");
            context.User = new ClaimsPrincipal(identity);
        }
        await next();
    });
}
` + authAppUse;
  }

  // --- View Creation Logic ---
  let viewExecutionCode = '';
  const selectQueries = queries.filter(q => q.type === 'SELECT') as SelectQuery[];
  
  if (selectQueries.length > 0) {
      viewExecutionCode += `
        // --- Auto-Generated View Creation ---`;
      
      selectQueries.forEach(q => {
          const viewName = toPascalCase(q.name);
          const rawSql = generateSqlSelect(q.nodes, q.columns, tables, relationships, config.dbType);
          if (!rawSql) return;

          const escapedSql = rawSql.replace(/"/g, '""');

          if (config.dbType === DbType.SQLite) {
              viewExecutionCode += `
        try 
        { 
            context.Database.ExecuteSqlRaw(@"DROP VIEW IF EXISTS ""${viewName}"""); 
            context.Database.ExecuteSqlRaw(@"CREATE VIEW ""${viewName}"" AS ${escapedSql}");
        } 
        catch (Exception ex) { logger.LogError(ex, "Error creating view ${viewName}"); }`;
          } 
          else if (config.dbType === DbType.MySQL) {
              viewExecutionCode += `
        try { context.Database.ExecuteSqlRaw(@"CREATE OR REPLACE VIEW \`${viewName}\` AS ${rawSql}"); } 
        catch (Exception ex) { logger.LogError(ex, "Error creating view ${viewName}"); }`;
          } 
          else {
              // SQL Server
              viewExecutionCode += `
        try { context.Database.ExecuteSqlRaw(@"CREATE OR ALTER VIEW [${viewName}] AS ${rawSql}"); } 
        catch (Exception ex) { logger.LogError(ex, "Error creating view ${viewName}"); }`;
          }
      });
  }

  const content = `using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using ${config.projectName}.Data;
${namespaces}
${config.multiTenancy?.enabled ? `using ${config.projectName}.Services;` : ''}

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

${config.multiTenancy?.enabled ? `
// Multi-Tenancy
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddHttpContextAccessor();
` : ''}

// Database Connection
${dbConfigCode}
${swaggerSetup}

// Background Jobs (Quartz)
builder.Services.AddQuartz(q =>
{
    q.UseMicrosoftDependencyInjectionJobFactory();
});
builder.Services.AddQuartzHostedService(opt =>
{
    opt.WaitForJobsToComplete = true;
});

// Authentication Config
${authServices}

var app = builder.Build();

// --- AUTO-GENERATION: Create DB if not exists ---
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();
        var logger = services.GetRequiredService<ILogger<Program>>();
        ${viewExecutionCode}
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred creating the DB.");
    }
}

// Configure the HTTP request pipeline.
${swaggerUse}

// Frontend Files Support
app.UseDefaultFiles();
app.UseStaticFiles();

${config.multiTenancy?.enabled ? `app.UseMiddleware<TenantMiddleware>();` : ''}
${config.licensing?.enabled ? `app.UseMiddleware<LicenseMiddleware>();` : ''}

app.UseCors(x => x.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

// FIX: Disabled HttpsRedirection to prevent issues with HTTP-only local setup
// app.UseHttpsRedirection();

${authAppUse}

app.MapControllers();

// SPA Fallback
app.MapFallbackToFile("index.html");

app.Run();`;

  return { name: 'Program.cs', path: `${root}/Program.cs`, content: content, language: 'csharp' };
};
