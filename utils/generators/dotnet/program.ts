
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

  const content = `using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using ${config.projectName}.Data;

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
app.UseAuthorization();
app.MapControllers();

app.Run();`;

  return { name: 'Program.cs', path: `${root}/Program.cs`, content: content, language: 'csharp' };
};
