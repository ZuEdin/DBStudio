import { Table, Relationship } from '../../types';

export interface DotNet10ProjectOptions {
  projectName: string;
  useCleanArchitecture: boolean;
  useFastEndpoints: boolean;
  useNativeAot: boolean;
}

export const generateDotNet10Solution = (
  tables: Table[],
  relationships: Relationship[],
  options: DotNet10ProjectOptions
): Record<string, string> => {
  const name = options.projectName || 'EnterpriseApp';
  const files: Record<string, string> = {};

  // 1. Solution & Project Files (.csproj)
  files[`${name}.Domain/${name}.Domain.csproj`] = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>`;

  files[`${name}.Application/${name}.Application.csproj`] = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="MediatR" Version="12.4.1" />
    <PackageReference Include="FluentValidation" Version="11.10.0" />
    <ProjectReference Include="..\\${name}.Domain\\${name}.Domain.csproj" />
  </ItemGroup>
</Project>`;

  files[`${name}.Infrastructure/${name}.Infrastructure.csproj`] = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="10.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.0.0" />
    <ProjectReference Include="..\\${name}.Application\\${name}.Application.csproj" />
  </ItemGroup>
</Project>`;

  files[`${name}.Api/${name}.Api.csproj`] = `<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <PublishAot>${options.useNativeAot ? 'true' : 'false'}</PublishAot>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="FastEndpoints" Version="5.30.0" />
    <PackageReference Include="Scalar.AspNetCore" Version="1.2.4" />
    <ProjectReference Include="..\\${name}.Infrastructure\\${name}.Infrastructure.csproj" />
  </ItemGroup>
</Project>`;

  // 2. Domain Models
  tables.forEach((t) => {
    const props = t.columns
      .map((c) => {
        const typeStr = c.type === 'number' ? 'int' : c.type === 'boolean' ? 'bool' : c.type === 'date' ? 'DateTime' : 'string';
        return `    public ${typeStr}${c.nullable ? '?' : ''} ${c.name} { get; set; }`;
      })
      .join('\n');

    files[`${name}.Domain/Entities/${t.name}.cs`] = `namespace ${name}.Domain.Entities;

public class ${t.name}
{
${props}
}`;
  });

  // 3. DbContext
  const dbSets = tables.map((t) => `    public DbSet<${t.name}> ${t.name}s => Set<${t.name}>();`).join('\n');
  files[`${name}.Infrastructure/Persistence/AppDbContext.cs`] = `using Microsoft.EntityFrameworkCore;
using ${name}.Domain.Entities;

namespace ${name}.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

${dbSets}

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Fluent API Mappings
    }
}`;

  // 4. Program.cs (FastEndpoints / Minimal API & Scalar OpenAPI)
  files[`${name}.Api/Program.cs`] = `using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using ${name}.Infrastructure.Persistence;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddFastEndpoints();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseFastEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.Run();`;

  // 5. xUnit Test Suite
  files[`${name}.Tests/${name}.Tests.csproj`] = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <IsPackable>false</IsPackable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="xunit" Version="2.9.0" />
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="10.0.0" />
  </ItemGroup>
</Project>`;

  files[`${name}.Tests/EntityTests.cs`] = `using Xunit;

namespace ${name}.Tests;

public class EntityTests
{
    [Fact]
    public void Test_Entity_Initialization()
    {
        Assert.True(true);
    }
}`;

  return files;
};
