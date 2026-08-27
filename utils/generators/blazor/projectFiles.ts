import { Table, BackendConfig, VirtualFile } from '../../../types/index';

export const generateBlazorProjectFiles = (
  tables: Table[],
  config: BackendConfig,
  namespace: string,
  root: string,
  targetFramework: string,
  version: string,
  useAuth: boolean = false
): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const clientPort = config.port + 2;
  const packageVersion = `${version}.0`;

  // 1. CSPROJ
  const csprojContent = `<Project Sdk="Microsoft.NET.Sdk.BlazorWebAssembly">
  <PropertyGroup>
    <TargetFramework>${targetFramework}</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly" Version="${packageVersion}" />
    <PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly.DevServer" Version="${packageVersion}" PrivateAssets="all" />
    <PackageReference Include="System.Net.Http.Json" Version="${packageVersion}" />
    ${useAuth ? `<PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly.Authentication" Version="${packageVersion}" />
    <PackageReference Include="Microsoft.AspNetCore.Components.Authorization" Version="${packageVersion}" />
    <PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="7.0.3" />` : ''}
  </ItemGroup>
</Project>`;
  files.push({ name: `${namespace}.csproj`, path: `${root}/${namespace}.csproj`, content: csprojContent, language: 'xml' });

  // 2. launchSettings.json
  const launchSettings = {
    profiles: {
      http: {
        commandName: "Project",
        dotnetRunMessages: true,
        launchBrowser: true,
        applicationUrl: `http://localhost:${clientPort}`,
        environmentVariables: {
          ASPNETCORE_ENVIRONMENT: "Development"
        }
      }
    }
  };
  files.push({ name: 'launchSettings.json', path: `${root}/Properties/launchSettings.json`, content: JSON.stringify(launchSettings, null, 2), language: 'json' });

  // 3. _Imports.razor
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
${useAuth ? '@using Microsoft.AspNetCore.Components.Authorization' : ''}
${useAuth ? '@using Microsoft.AspNetCore.Authorization' : ''}
`;
  files.push({ name: '_Imports.razor', path: `${root}/_Imports.razor`, content: importsContent, language: 'razor' });

  // 4. Program.cs
  let programContent = `using System;
using System.Net.Http;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using ${namespace};
using ${namespace}.Services;
${useAuth ? 'using Microsoft.AspNetCore.Components.Authorization;' : ''}

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// Register HttpClient for Backend REST API
builder.Services.AddScoped(sp => {
    var navigationManager = sp.GetRequiredService<NavigationManager>();
    var baseUri = navigationManager.BaseUri;
    string apiUri = baseUri.Contains("localhost") || baseUri.Contains("127.0.0.1") ? "http://localhost:${config.port}/api/" : $"{baseUri}api/";
    return new HttpClient { BaseAddress = new Uri(apiUri) };
});

// Register Multi-Backend Storage Services
builder.Services.AddScoped<IndexedDbService>();
builder.Services.AddScoped<ApiService>();
builder.Services.AddScoped<StorageServiceManager>();
`;

  if (useAuth) {
    programContent += `
builder.Services.AddAuthorizationCore();
builder.Services.AddScoped<AuthenticationStateProvider, CustomAuthStateProvider>();
builder.Services.AddScoped<AuthService>();
`;
  }

  programContent += `
await builder.Build().RunAsync();
`;
  files.push({ name: 'Program.cs', path: `${root}/Program.cs`, content: programContent, language: 'csharp' });

  // 5. index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.projectName} - Blazor WebAssembly</title>
    <base href="/" />
    <!-- Bootstrap 5 CSS & Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <link href="css/app.css" rel="stylesheet" />
    <link href="${namespace}.styles.css" rel="stylesheet" />
</head>
<body>
    <div id="app">
        <div class="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light text-center">
            <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">Lade Anwendung...</span>
            </div>
            <h4 class="fw-bold text-slate-800">${config.projectName}</h4>
            <p class="text-secondary small">Blazor WebAssembly wird initialisiert...</p>
        </div>
    </div>

    <!-- IndexedDB Interop Support -->
    <script src="js/indexedDb.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="_framework/blazor.webassembly.js"></script>
</body>
</html>`;
  files.push({ name: 'index.html', path: `${root}/wwwroot/index.html`, content: indexHtml, language: 'html' });

  // 6. app.css
  const appCss = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

html, body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #f8fafc;
    color: #1e293b;
}

.sidebar {
    background-color: #1e293b;
    min-height: 100vh;
}

.transition-card {
    transition: transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.transition-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04) !important;
}

.table th {
    background-color: #f8fafc;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.table td {
    font-size: 0.9rem;
}
`;
  files.push({ name: 'app.css', path: `${root}/wwwroot/css/app.css`, content: appCss, language: 'css' });

  // 7. App.razor
  const appRazor = useAuth ? `<CascadingAuthenticationState>
    <Router AppAssembly="@typeof(App).Assembly">
        <Found Context="routeData">
            <AuthorizeRouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)">
                <NotAuthorized>
                    <div class="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light p-4 text-center">
                        <div class="bg-danger-subtle p-3 rounded-circle text-danger mb-3">
                            <i class="bi bi-shield-lock fs-1"></i>
                        </div>
                        <h2 class="fw-bold text-danger mb-2">Zugriff verweigert</h2>
                        <p class="text-secondary mb-4">Sie haben keine Berechtigung für diese Seite oder Ihre Sitzung ist abgelaufen.</p>
                        <a href="login" class="btn btn-primary fw-semibold px-4">Zum Login</a>
                    </div>
                </NotAuthorized>
            </AuthorizeRouteView>
        </Found>
        <NotFound>
            <PageTitle>Seite nicht gefunden</PageTitle>
            <LayoutView Layout="@typeof(MainLayout)">
                <div class="text-center py-5">
                    <h1 class="display-4 fw-bold text-secondary">404</h1>
                    <p class="fs-5 text-muted">Die angeforderte Seite existiert nicht.</p>
                    <a href="" class="btn btn-outline-primary">Zurück zum Dashboard</a>
                </div>
            </LayoutView>
        </NotFound>
    </Router>
</CascadingAuthenticationState>` : `<Router AppAssembly="@typeof(App).Assembly">
    <Found Context="routeData">
        <RouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)" />
    </Found>
    <NotFound>
        <PageTitle>Seite nicht gefunden</PageTitle>
        <LayoutView Layout="@typeof(MainLayout)">
            <div class="text-center py-5">
                <h1 class="display-4 fw-bold text-secondary">404</h1>
                <p class="fs-5 text-muted">Die angeforderte Seite existiert nicht.</p>
                <a href="" class="btn btn-outline-primary">Zurück zum Dashboard</a>
            </div>
        </LayoutView>
    </NotFound>
</Router>`;
  files.push({ name: 'App.razor', path: `${root}/App.razor`, content: appRazor, language: 'razor' });

  return files;
};
