
import { Table, Relationship, Query, BackendConfig, VirtualFile, Form, Report, SelectQuery } from '../../types/index';
import { toPascalCase, toCamelCase, resolveType, isNullable } from './common';
import { DATA_TYPES } from '../../config/dataTypes';

export const generateBlazor = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig, forms: Form[], reports: Report[]): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Frontend/${config.projectName}.Client`;
  const namespace = `${config.projectName}.Client`;
  
  // Define Client Port (Backend Port + 2 to avoid conflicts)
  const clientPort = config.port + 2;

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

  // launchSettings.json for Frontend
  const launchSettings = {
    "profiles": {
      "http": {
        "commandName": "Project",
        "dotnetRunMessages": true,
        "launchBrowser": true,
        "inspectUri": "{wsProtocol}://{url.hostname}:{url.port}/_framework/debug/ws-proxy?browser={browserInspectUri}",
        "applicationUrl": `http://localhost:${clientPort}`,
        "environmentVariables": {
          "ASPNETCORE_ENVIRONMENT": "Development"
        }
      }
    }
  };
  files.push({ name: 'launchSettings.json', path: `${root}/Properties/launchSettings.json`, content: JSON.stringify(launchSettings, null, 2), language: 'json' });

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
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link href="css/app.css" rel="stylesheet" />
    <link href="${namespace}.styles.css" rel="stylesheet" />
</head>

<body>
    <div id="app">
        <div class="loading-progress-text">Loading...</div>
    </div>

    <div id="blazor-error-ui">
        An unhandled error has occurred.
        <a href="" class="reload">Reload</a>
        <a class="dismiss">🗙</a>
    </div>
    <script src="_framework/blazor.webassembly.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>`;
  files.push({ name: 'index.html', path: `${root}/wwwroot/index.html`, content: htmlContent, language: 'html' });

  // 5. CSS
  files.push({ name: 'app.css', path: `${root}/wwwroot/css/app.css`, content: `
html, body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
.btn-primary { color: #fff; background-color: #1b6ec2; border-color: #1861ac; }
.loading-progress-text { position: relative; text-align: center; font-weight: bold; top: 50vh; }
`, language: 'css' });

  // 6. Layouts & Routing
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

  const tableLinks = tables.map(t => `
        <div class="nav-item px-3">
            <NavLink class="nav-link" href="${toCamelCase(t.name)}">
                <span class="bi bi-table" aria-hidden="true"></span> ${t.name}
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
                <span class="bi bi-house-door-fill" aria-hidden="true"></span> Home
            </NavLink>
        </div>
        ${tableLinks}
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
.nav-item { font-size: 0.9rem; padding-bottom: 0.5rem; }
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

  // 7. Models
  tables.forEach(table => {
      const className = toPascalCase(table.name);
      const props = table.fields.map(f => {
          let type = resolveType(f, 'csharp');
          let nullable = isNullable(f) ? '?' : '';
          if (type === 'string') nullable = '?'; 
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

  // 8. ApiService - ROBUST VERSION
  files.push({ name: 'ApiService.cs', path: `${root}/Services/ApiService.cs`, content: `using System.Net.Http.Json;
using System.Text.Json;

namespace ${namespace}.Services
{
    public class ApiService
    {
        private readonly HttpClient _http;
        private readonly JsonSerializerOptions _options;

        public ApiService(HttpClient http)
        {
            _http = http;
            // Config for correct Case Handling (Server=CamelCase, Client=PascalCase)
            _options = new JsonSerializerOptions 
            { 
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
            };
        }

        // Helper to throw on non-success, showing the real server error
        private async Task EnsureSuccess(HttpResponseMessage response)
        {
            if (response.IsSuccessStatusCode) return;
            var body = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException($"API Error {response.StatusCode}: {body}");
        }

        public async Task<List<T>> Get<T>(string endpoint)
        {
            var response = await _http.GetAsync(endpoint);
            await EnsureSuccess(response);
            return await response.Content.ReadFromJsonAsync<List<T>>(_options) ?? new List<T>();
        }

        public async Task<T?> GetById<T>(string endpoint, object id)
        {
            var response = await _http.GetAsync($"{(endpoint)}/{id}");
            await EnsureSuccess(response);
            return await response.Content.ReadFromJsonAsync<T>(_options);
        }

        public async Task Create<T>(string endpoint, T item)
        {
            var response = await _http.PostAsJsonAsync(endpoint, item, _options);
            await EnsureSuccess(response);
        }

        public async Task Update<T>(string endpoint, object id, T item)
        {
            var response = await _http.PutAsJsonAsync($"{(endpoint)}/{id}", item, _options);
            await EnsureSuccess(response);
        }

        public async Task Delete(string endpoint, object id)
        {
            var response = await _http.DeleteAsync($"{(endpoint)}/{id}");
            await EnsureSuccess(response);
        }
    }
}`, language: 'csharp' });

  // 9. Pages
  tables.forEach(table => {
      const className = toPascalCase(table.name);
      const routeBase = toCamelCase(table.name);
      const pkField = table.fields.find(f => f.isPrimaryKey)?.name || 'Id';
      const pkProp = toPascalCase(pkField);

      // List Page
      const listContent = `@page "/${routeBase}"
@inject ApiService Api
@inject NavigationManager Nav
@inject IJSRuntime JsRuntime

<h3>${table.name}</h3>

<div class="mb-3">
    <button class="btn btn-primary" @onclick="Create">New Item</button>
</div>

@if (errorMessage != null)
{
    <div class="alert alert-danger">@errorMessage</div>
}

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
    private string? errorMessage;

    protected override async Task OnInitializedAsync()
    {
        await LoadData();
    }

    private async Task LoadData()
    {
        try 
        {
            items = await Api.Get<${className}>("${className}");
            errorMessage = null;
        }
        catch (Exception ex)
        {
            errorMessage = ex.Message;
        }
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
            try
            {
                await Api.Delete("${className}", id);
                await LoadData();
            }
            catch (Exception ex)
            {
                await JsRuntime.InvokeVoidAsync("alert", "Delete failed: " + ex.Message);
            }
        }
    }
}`;
      files.push({ name: `${className}List.razor`, path: `${root}/Pages/${className}/${className}List.razor`, content: listContent, language: 'razor' });

      // --- EDIT PAGE with Dropdowns and Default Value Init ---
      
      // 1. Identify Relationships
      const parentRels = relationships.filter(r => r.toTableId === table.id);
      
      // 2. Prepare Code Block injections
      const parentListsDefs = parentRels.map(r => {
          const parentTable = tables.find(t => t.id === r.fromTableId);
          if(!parentTable) return '';
          return `    private List<${toPascalCase(parentTable.name)}> ${toCamelCase(parentTable.name)}List = new();`;
      }).join('\n');

      const parentLoadCalls = parentRels.map(r => {
          const parentTable = tables.find(t => t.id === r.fromTableId);
          if(!parentTable) return '';
          return `            ${toCamelCase(parentTable.name)}List = await Api.Get<${toPascalCase(parentTable.name)}>("${toPascalCase(parentTable.name)}");`;
      }).join('\n');

      // 3. Generate Default Value assignments
      const defaultAssignments = table.fields
        .filter(f => f.defaultValue !== undefined && f.defaultValue !== '')
        .map(f => {
            const prop = toPascalCase(f.name);
            const val = f.defaultValue;
            // Check type to quote strings
            const isString = f.type.includes('VARCHAR') || f.type.includes('TEXT');
            return `                model.${prop} = ${isString ? `"${val}"` : val};`;
        }).join('\n');

      // 4. Generate Fields (Auto-detect FKs)
      const formFields = table.fields.filter(f => !f.isPrimaryKey).map(f => {
          const prop = toPascalCase(f.name);
          
          // Check if this field is an FK
          const rel = parentRels.find(r => r.toFieldId === f.id);
          
          if (rel) {
              const parentTable = tables.find(t => t.id === rel.fromTableId);
              if (parentTable) {
                  // Found an FK relationship! Generate Dropdown.
                  const listName = `${toCamelCase(parentTable.name)}List`;
                  // Heuristic: Find the first string field for display, or ID
                  const displayField = parentTable.fields.find(pf => pf.type === 'VARCHAR') || parentTable.fields[0];
                  const displayProp = toPascalCase(displayField.name);
                  const pkPropParent = toPascalCase(parentTable.fields.find(pf => pf.isPrimaryKey)?.name || 'Id');

                  return `        <div class="mb-3">
            <label for="${f.name}" class="form-label">${f.name} (FK)</label>
            <InputSelect id="${f.name}" class="form-select" @bind-Value="model.${prop}">
                <option value="">-- Select --</option>
                @foreach (var parent in ${listName})
                {
                    <option value="@parent.${pkPropParent}">@parent.${displayProp}</option>
                }
            </InputSelect>
        </div>`;
              }
          }

          // Default inputs
          let inputControl = `<InputText id="${f.name}" class="form-control" @bind-Value="model.${prop}" />`;
          if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') inputControl = `<InputNumber id="${f.name}" class="form-control" @bind-Value="model.${prop}" />`;
          if (f.type === 'BOOLEAN') inputControl = `<InputCheckbox id="${f.name}" class="form-check-input" @bind-Value="model.${prop}" />`;
          if (f.type === 'DATE') inputControl = `<InputDate id="${f.name}" class="form-control" @bind-Value="model.${prop}" />`;
          if (f.type === 'DATETIME') inputControl = `<InputDate id="${f.name}" class="form-control" @bind-Value="model.${prop}" Type="InputDateType.DateTimeLocal" />`;

          return `        <div class="mb-3">
            <label for="${f.name}" class="form-label">${f.name}</label>
            ${inputControl}
        </div>`;
      }).join('\n');

      const editContent = `@page "/${routeBase}/{Id}"
@page "/${routeBase}/new"
@inject ApiService Api
@inject NavigationManager Nav
@inject IJSRuntime JsRuntime

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

${formFields}

        <button type="submit" class="btn btn-primary">Save</button>
        <button type="button" class="btn btn-secondary" @onclick="Cancel">Cancel</button>
    </EditForm>
}

@code {
    [Parameter] public string? Id { get; set; }
    private ${className}? model;
    private bool IsNew => Id == "new" || string.IsNullOrEmpty(Id);
${parentListsDefs}

    protected override async Task OnInitializedAsync()
    {
        try
        {
            // Load FK Data
${parentLoadCalls}

            if (IsNew)
            {
                model = new ${className}();
${defaultAssignments}
            }
            else
            {
                model = await Api.GetById<${className}>("${className}", Id!);
            }
        }
        catch(Exception ex)
        {
            await JsRuntime.InvokeVoidAsync("alert", "Error loading data: " + ex.Message);
        }
    }

    private async Task Save()
    {
        if (model == null) return;

        try
        {
            if (IsNew)
            {
                await Api.Create("${className}", model);
            }
            else
            {
                var pkVal = model.GetType().GetProperty("${pkProp}")?.GetValue(model);
                if(pkVal != null)
                    await Api.Update("${className}", pkVal, model);
            }
            Nav.NavigateTo("/${routeBase}");
        }
        catch(Exception ex)
        {
            await JsRuntime.InvokeVoidAsync("alert", "Save failed: " + ex.Message);
        }
    }

    private void Cancel()
    {
        Nav.NavigateTo("/${routeBase}");
    }
}`;
      files.push({ name: `${className}Form.razor`, path: `${root}/Pages/${className}/${className}Form.razor`, content: editContent, language: 'razor' });
  });

  const readmeContent = `# ${config.projectName} (Blazor Client)
  
  Code generiert. ApiService ist konfiguriert für Case-Insensitive JSON und Fehlerbehandlung. FK-Dropdowns sind aktiviert.
  `;
  files.push({ name: 'README.md', path: `${root}/README.md`, content: readmeContent, language: 'markdown' });

  return files;
};
