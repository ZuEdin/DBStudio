
import { Table, Relationship, Query, BackendConfig, VirtualFile, Form, Report, SelectQuery } from '../../types/index';
import { toPascalCase, toCamelCase, resolveType, isNullable } from './common';
import { DATA_TYPES } from '../../config/dataTypes';

export const generateBlazor = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig, forms: Form[], reports: Report[]): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Frontend/${config.projectName}.Client`;
  const namespace = `${config.projectName}.Client`;

  // 1. CSPROJ
  const csprojContent = `<Project Sdk="Microsoft.NET.Sdk.BlazorWebAssembly">

  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly" Version="9.0.0" />
    <PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly.DevServer" Version="9.0.0" PrivateAssets="all" />
  </ItemGroup>

</Project>
`;
  files.push({ name: `${namespace}.csproj`, path: `${root}/${namespace}.csproj`, content: csprojContent, language: 'xml' });

  // 2. _Imports.razor
  const importsContent = `@using System.Net.Http
@using System.Net.Http.Json
@using Microsoft.AspNetCore.Components.Forms
@using Microsoft.AspNetCore.Components.Routing
@using Microsoft.AspNetCore.Components.Web
@using Microsoft.AspNetCore.Components.Web.Virtualization
@using Microsoft.AspNetCore.Components.WebAssembly.Http
@using Microsoft.JSInterop
@using ${namespace}
@using ${namespace}.Layout
@using ${namespace}.Models
@using ${namespace}.Services
`;
  files.push({ name: '_Imports.razor', path: `${root}/_Imports.razor`, content: importsContent, language: 'razor' });

  // 3. Program.cs
  const programContent = `using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using ${namespace};
using ${namespace}.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// Connect to Backend API
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri("http://localhost:${config.port}/api/") });
builder.Services.AddScoped<ApiService>();

await builder.Build().RunAsync();
`;
  files.push({ name: 'Program.cs', path: `${root}/Program.cs`, content: programContent, language: 'csharp' });

  // 4. index.html
  const htmlContent = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.projectName}</title>
    <base href="/" />
    <link href="css/bootstrap/bootstrap.min.css" rel="stylesheet" />
    <link href="css/app.css" rel="stylesheet" />
    <link href="${namespace}.styles.css" rel="stylesheet" />
</head>

<body>
    <div id="app">
        <svg class="loading-progress">
            <circle r="40%" cx="50%" cy="50%" />
            <circle r="40%" cx="50%" cy="50%" />
        </svg>
        <div class="loading-progress-text">Loading...</div>
    </div>

    <div id="blazor-error-ui">
        An unhandled error has occurred.
        <a href="" class="reload">Reload</a>
        <a class="dismiss">🗙</a>
    </div>
    <script src="_framework/blazor.webassembly.js"></script>
</body>

</html>`;
  files.push({ name: 'index.html', path: `${root}/wwwroot/index.html`, content: htmlContent, language: 'html' });

  // 5. CSS
  files.push({ name: 'app.css', path: `${root}/wwwroot/css/app.css`, content: `
html, body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
h1:focus { outline: none; }
a, .btn-link { color: #0071c1; }
.btn-primary { color: #fff; background-color: #1b6ec2; border-color: #1861ac; }
.loading-progress { position: relative; display: block; width: 8rem; height: 8rem; margin: 20vh auto 1rem auto; }
.loading-progress circle { fill: none; stroke: #e0e0e0; stroke-width: 0.6rem; transform-origin: 50% 50%; transform: rotate(-90deg); }
.loading-progress circle:last-child { stroke: #1b6ec2; stroke-dasharray: calc(3.141 * 100% * 0.75), 500%; transition: stroke-dasharray 0.3s ease-in-out; }
.loading-progress-text { position: relative; text-align: center; font-weight: bold; top: -1rem; }
.top-row { height: 3.5rem; background-color: #f7f7f7; border-bottom: 1px solid #d6d5d5; justify-content: flex-end; }
.top-row a, .top-row .btn-link { white-space: nowrap; margin-left: 1.5rem; text-decoration: none; }
.top-row a:hover, .top-row .btn-link:hover { text-decoration: underline; }
.top-row a:first-child { overflow: hidden; text-overflow: ellipsis; }
@media (max-width: 640.98px) {
    .top-row { display: none; }
}
@media (min-width: 641px) {
    .page { flex-direction: row; }
    .sidebar { width: 250px; height: 100vh; position: sticky; top: 0; }
    .top-row { position: sticky; top: 0; z-index: 1; }
    .top-row, article { padding-left: 2rem !important; padding-right: 1.5rem !important; }
}
`, language: 'css' });

  // 6. Layouts
  files.push({ name: 'App.razor', path: `${root}/App.razor`, content: `<Router AppAssembly="@typeof(App).Assembly">
    <Found Context="routeData">
        <RouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)" />
        <FocusOnNavigate RouteData="@routeData" Selector="h1" />
    </Found>
    <NotFound>
        <PageTitle>Not found</PageTitle>
        <LayoutView Layout="@typeof(MainLayout)">
            <p role="alert">Sorry, there's nothing at this address.</p>
        </LayoutView>
    </NotFound>
</Router>`, language: 'razor' });

  files.push({ name: 'MainLayout.razor', path: `${root}/Layout/MainLayout.razor`, content: `@inherits LayoutComponentBase

<div class="page">
    <div class="sidebar">
        <NavMenu />
    </div>

    <main>
        <div class="top-row px-4">
            <a href="https://learn.microsoft.com/aspnet/core/" target="_blank">About</a>
        </div>

        <article class="content px-4">
            @Body
        </article>
    </main>
</div>`, language: 'razor' });

  // Generate NavLinks for Tables and Reports
  const tableLinks = tables.map(t => `
        <div class="nav-item px-3">
            <NavLink class="nav-link" href="${toCamelCase(t.name)}">
                <span class="bi bi-list-nested-nav-menu" aria-hidden="true"></span> ${t.name}
            </NavLink>
        </div>`).join('');

  const reportLinks = reports.map(r => `
        <div class="nav-item px-3">
            <NavLink class="nav-link" href="report/${toCamelCase(r.name)}">
                <span class="bi bi-file-earmark-text" aria-hidden="true"></span> ${r.name}
            </NavLink>
        </div>`).join('');

  files.push({ name: 'NavMenu.razor', path: `${root}/Layout/NavMenu.razor`, content: `<div class="top-row ps-3 navbar navbar-dark">
    <div class="container-fluid">
        <a class="navbar-brand" href="">${config.projectName}</a>
        <button title="Navigation menu" class="navbar-toggler" @onclick="ToggleNavMenu">
            <span class="navbar-toggler-icon"></span>
        </button>
    </div>
</div>

<div class="@NavMenuCssClass nav-scrollable" @onclick="ToggleNavMenu">
    <nav class="flex-column">
        <div class="nav-item px-3">
            <NavLink class="nav-link" href="" Match="NavLinkMatch.All">
                <span class="bi bi-house-door-fill-nav-menu" aria-hidden="true"></span> Home
            </NavLink>
        </div>
        <div class="nav-item px-3"><span class="text-white text-uppercase small font-weight-bold pl-3">Data</span></div>
        ${tableLinks}
        <div class="nav-item px-3"><span class="text-white text-uppercase small font-weight-bold pl-3">Reports</span></div>
        ${reportLinks}
    </nav>
</div>

@code {
    private bool collapseNavMenu = true;
    private string? NavMenuCssClass => collapseNavMenu ? "collapse" : null;
    private void ToggleNavMenu() => collapseNavMenu = !collapseNavMenu;
}`, language: 'razor' });

  files.push({ name: 'NavMenu.razor.css', path: `${root}/Layout/NavMenu.razor.css`, content: `.navbar-toggler { background-color: rgba(255, 255, 255, 0.1); }
.top-row { height: 3.5rem; background-color: rgba(0,0,0,0.4); }
.navbar-brand { font-size: 1.1rem; }
.bi { display: inline-block; position: relative; width: 1.25rem; height: 1.25rem; margin-right: 0.75rem; top: -1px; background-size: cover; }
.bi-house-door-fill-nav-menu { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' class='bi bi-house-door-fill' viewBox='0 0 16 16'%3E%3Cpath d='M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5Z'/%3E%3C/svg%3E"); }
.nav-item { font-size: 0.9rem; padding-bottom: 0.5rem; }
.nav-item:first-of-type { padding-top: 1rem; }
.nav-item:last-of-type { padding-bottom: 1rem; }
.nav-item ::deep a { color: #d7d7d7; border-radius: 4px; height: 3rem; display: flex; align-items: center; line-height: 3rem; }
.nav-item ::deep a.active { background-color: rgba(255,255,255,0.37); color: white; }
.nav-item ::deep a:hover { background-color: rgba(255,255,255,0.1); color: white; }
.nav-scrollable { display: flex; flex-direction: column; }
@media (min-width: 641px) {
    .navbar-toggler { display: none; }
    .collapse { display: block; }
    .nav-scrollable { height: calc(100vh - 3.5rem); overflow-y: auto; }
}
`, language: 'css' });

  // 7. Models (POCOs)
  tables.forEach(table => {
      const className = toPascalCase(table.name);
      const props = table.fields.map(f => {
          let type = resolveType(f, 'csharp');
          let nullable = isNullable(f) ? '?' : '';
          if (type === 'string') nullable = '?'; // Strings are ref types
          return `    public ${type}${nullable} ${toPascalCase(f.name)} { get; set; }`;
      }).join('\n');

      files.push({ name: `${className}.cs`, path: `${root}/Models/${className}.cs`, content: `namespace ${namespace}.Models
{
    public class ${className}
    {
${props}
    }
}`, language: 'csharp' });
  });

  // 7b. Models for Queries (Read Only)
  queries.filter(q => q.type === 'SELECT').forEach(q => {
      const selectQ = q as SelectQuery;
      const className = toPascalCase(q.name);
      const props = selectQ.columns.filter(c => c.show).map(c => {
          // Simplistic type guessing for query columns
          const table = tables.find(t => t.id === c.tableId);
          const field = table?.fields.find(f => f.id === c.fieldId);
          let type = field ? resolveType(field, 'csharp') : 'string';
          if(c.aggregate === 'COUNT' || c.aggregate === 'SUM') type = 'long';
          return `    public ${type}? ${toPascalCase(c.alias || c.fieldName)} { get; set; }`;
      }).join('\n');

      files.push({ name: `${className}.cs`, path: `${root}/Models/${className}.cs`, content: `namespace ${namespace}.Models
{
    public class ${className}
    {
${props}
    }
}`, language: 'csharp' });
  });

  // 8. ApiService
  files.push({ name: 'ApiService.cs', path: `${root}/Services/ApiService.cs`, content: `using System.Net.Http.Json;

namespace ${namespace}.Services
{
    public class ApiService
    {
        private readonly HttpClient _http;

        public ApiService(HttpClient http)
        {
            _http = http;
        }

        public async Task<List<T>> Get<T>(string endpoint)
        {
            return await _http.GetFromJsonAsync<List<T>>(endpoint) ?? new List<T>();
        }

        public async Task<T?> GetById<T>(string endpoint, object id)
        {
            return await _http.GetFromJsonAsync<T>($"{(endpoint)}/{id}");
        }

        public async Task Create<T>(string endpoint, T item)
        {
            await _http.PostAsJsonAsync(endpoint, item);
        }

        public async Task Update<T>(string endpoint, object id, T item)
        {
            await _http.PutAsJsonAsync($"{(endpoint)}/{id}", item);
        }

        public async Task Delete(string endpoint, object id)
        {
            await _http.DeleteAsync($"{(endpoint)}/{id}");
        }
    }
}`, language: 'csharp' });

  // 9. Pages (Lists & Forms)
  tables.forEach(table => {
      const className = toPascalCase(table.name);
      const routeBase = toCamelCase(table.name);
      const pkField = table.fields.find(f => f.isPrimaryKey)?.name || 'Id';
      const pkProp = toPascalCase(pkField);

      // List Page
      const listContent = `@page "/${routeBase}"
@inject ApiService Api
@inject NavigationManager Nav

<h3>${table.name}</h3>

<div class="mb-3">
    <button class="btn btn-primary" @onclick="Create">New Item</button>
</div>

@if (items == null)
{
    <p><em>Loading...</em></p>
}
else
{
    <table class="table">
        <thead>
            <tr>
${table.fields.map(f => `                <th>${f.name}</th>`).join('\n')}
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach (var item in items)
            {
                <tr>
${table.fields.map(f => `                    <td>@item.${toPascalCase(f.name)}</td>`).join('\n')}
                    <td>
                        <button class="btn btn-sm btn-secondary" @onclick="() => Edit(item.${pkProp})">Edit</button>
                        <button class="btn btn-sm btn-danger" @onclick="() => Delete(item.${pkProp})">Delete</button>
                    </td>
                </tr>
            }
        </tbody>
    </table>
}

@code {
    private List<${className}>? items;

    protected override async Task OnInitializedAsync()
    {
        await LoadData();
    }

    private async Task LoadData()
    {
        items = await Api.Get<${className}>("${className}");
    }

    private void Create()
    {
        Nav.NavigateTo("/${routeBase}/new");
    }

    private void Edit(object id)
    {
        Nav.NavigateTo($"/${routeBase}/{id}");
    }

    private async Task Delete(object id)
    {
        if (await JsRuntime.InvokeAsync<bool>("confirm", "Are you sure?"))
        {
            await Api.Delete("${className}", id);
            await LoadData();
        }
    }
    
    [Inject] IJSRuntime JsRuntime { get; set; } = default!;
}`;
      files.push({ name: `${className}List.razor`, path: `${root}/Pages/${className}/${className}List.razor`, content: listContent, language: 'razor' });

      // Edit/Create Page
      const editContent = `@page "/${routeBase}/{Id}"
@page "/${routeBase}/new"
@inject ApiService Api
@inject NavigationManager Nav

<h3>@(IsNew ? "Create" : "Edit") ${table.name}</h3>

@if (model == null)
{
    <p>Loading...</p>
}
else
{
    <EditForm Model="@model" OnValidSubmit="Save">
        <DataAnnotationsValidator />
        <ValidationSummary />

${table.fields.filter(f => !f.isPrimaryKey).map(f => {
    const prop = toPascalCase(f.name);
    let inputControl = `<InputText id="${f.name}" class="form-control" @bind-Value="model.${prop}" />`;
    if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') inputControl = `<InputNumber id="${f.name}" class="form-control" @bind-Value="model.${prop}" />`;
    if (f.type === 'BOOLEAN') inputControl = `<InputCheckbox id="${f.name}" class="form-check-input" @bind-Value="model.${prop}" />`;
    // Fix for DateTime error: use InputDate for DATE and DATETIME
    if (f.type === 'DATE') inputControl = `<InputDate id="${f.name}" class="form-control" @bind-Value="model.${prop}" />`;
    if (f.type === 'DATETIME') inputControl = `<InputDate id="${f.name}" class="form-control" @bind-Value="model.${prop}" Type="InputDateType.DateTimeLocal" />`;

    return `        <div class="mb-3">
            <label for="${f.name}" class="form-label">${f.name}</label>
            ${inputControl}
        </div>`;
}).join('\n')}

        <button type="submit" class="btn btn-primary">Save</button>
        <button type="button" class="btn btn-secondary" @onclick="Cancel">Cancel</button>
    </EditForm>
}

@code {
    [Parameter] public string? Id { get; set; }
    private ${className}? model;
    private bool IsNew => Id == "new" || string.IsNullOrEmpty(Id);

    protected override async Task OnInitializedAsync()
    {
        if (IsNew)
        {
            model = new ${className}();
        }
        else
        {
            model = await Api.GetById<${className}>("${className}", Id!);
        }
    }

    private async Task Save()
    {
        if (model == null) return;

        if (IsNew)
        {
            await Api.Create("${className}", model);
        }
        else
        {
            // Assuming PK is named Id or similar and is available in model
            var pkVal = model.GetType().GetProperty("${pkProp}")?.GetValue(model);
            if(pkVal != null)
                await Api.Update("${className}", pkVal, model);
        }
        Nav.NavigateTo("/${routeBase}");
    }

    private void Cancel()
    {
        Nav.NavigateTo("/${routeBase}");
    }
}`;
      files.push({ name: `${className}Form.razor`, path: `${root}/Pages/${className}/${className}Form.razor`, content: editContent, language: 'razor' });
  });

  // Docs
  const readmeContent = `# ${config.projectName} (Blazor Client)

## Voraussetzungen
- .NET SDK (Version 9.0 oder höher)

## Starten
Öffnen Sie ein Terminal im Ordner \`Frontend/${config.projectName}.Client\` und führen Sie aus:

\`\`\`bash
dotnet run
\`\`\`

Die Anwendung läuft standardmäßig unter \`http://localhost:5000\` (oder einem zufälligen Port, siehe Console-Output).
Stellen Sie sicher, dass das Backend läuft und CORS-Anfragen erlaubt.
`;

  files.push({ name: 'README.md', path: `Frontend/README.md`, content: readmeContent, language: 'markdown' });
  // Add to project root as well just in case
  files.push({ name: 'README.md', path: `${root}/README.md`, content: readmeContent, language: 'markdown' });

  return files;
};
