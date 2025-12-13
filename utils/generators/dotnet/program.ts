
import { BackendConfig, DbType, VirtualFile } from '../../../types/index';

export const generateProgram = (config: BackendConfig, root: string): VirtualFile => {
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
  let namespaces = 'using System.Security.Claims;';

  const authConfig = config.authConfig;

  if (authConfig?.useWindowsAuth) {
      namespaces += '\nusing Microsoft.AspNetCore.Authentication.Negotiate;';
      authServices += `
builder.Services.AddAuthentication(NegotiateDefaults.AuthenticationScheme)
   .AddNegotiate();

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = options.DefaultPolicy;
});`;
      authAppUse += `
app.UseAuthentication();
app.UseAuthorization();`;
  }

  if (authConfig?.useAdGroups && authConfig.adGroups) {
      // Split groups and create policy logic (simplified)
      const groups = authConfig.adGroups.split(',').map(g => g.trim());
      // Real implementation needs specific group SID or name check logic
      // This is a placeholder for the generated policy
      authServices += `
// AD Group Policy
builder.Services.AddAuthorization(options => {
    options.AddPolicy("AdGroupPolicy", policy => 
        policy.RequireAssertion(context => 
            ${groups.map(g => `context.User.IsInRole("${g}")`).join(' || ')}
        ));
});`;
  }

  if (authConfig?.devBypass) {
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

  const content = `using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using ${config.projectName}.Data;
${namespaces}

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// Database Connection
${dbConfigCode}
${swaggerSetup}

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
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred creating the DB.");
    }
}

// Configure the HTTP request pipeline.
${swaggerUse}

app.UseCors(x => x.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
app.UseHttpsRedirection();

${authAppUse}

app.MapControllers();

app.Run();`;

  return { name: 'Program.cs', path: `${root}/Program.cs`, content: content, language: 'csharp' };
};
