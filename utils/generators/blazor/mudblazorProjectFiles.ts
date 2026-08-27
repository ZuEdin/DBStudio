import { Table, BackendConfig, VirtualFile } from '../../../types/index';

export const generateMudBlazorProjectFiles = (
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
    <PackageReference Include="MudBlazor" Version="7.15.0" />
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
@using MudBlazor
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
using MudBlazor.Services;
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

// Register MudBlazor Component Services
builder.Services.AddMudServices();

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
    <title>${config.projectName} - MudBlazor WebAssembly</title>
    <base href="/" />
    <!-- MudBlazor Fonts & Material Styles -->
    <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet" />
    <link href="_content/MudBlazor/MudBlazor.min.css" rel="stylesheet" />
    <link href="css/app.css" rel="stylesheet" />
    <link href="${namespace}.styles.css" rel="stylesheet" />
</head>
<body>
    <div id="app">
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background-color: #f5f5f5; text-align: center; font-family: 'Roboto', sans-serif;">
            <div style="border: 4px solid #e0e0e0; border-top: 4px solid #1976d2; border-radius: 50%; width: 48px; height: 48px; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
            <h4 style="margin: 0 0 8px 0; color: #212121; font-weight: 500;">${config.projectName}</h4>
            <p style="margin: 0; color: #757575; font-size: 14px;">MudBlazor WebAssembly wird initialisiert...</p>
        </div>
        <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    </div>

    <!-- File Export, MudBlazor & IndexedDB Scripts -->
    <script>
      window.exportFile = function(filename, content, mimeType) {
        var blob = new Blob([content], { type: mimeType });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
    </script>
    <script src="js/indexedDb.js"></script>
    <script src="_content/MudBlazor/MudBlazor.min.js"></script>
    <script src="_framework/blazor.webassembly.js"></script>
</body>
</html>`;
  files.push({ name: 'index.html', path: `${root}/wwwroot/index.html`, content: indexHtml, language: 'html' });
  files.push({ name: `${namespace}.styles.css`, path: `${root}/wwwroot/${namespace}.styles.css`, content: `/* Scoped CSS bundle */\n`, language: 'css' });

  // 6. app.css
  const appCss = `html, body {
    font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    background-color: #f8fafc;
    color: #1e293b;
    margin: 0;
    padding: 0;
}

.mud-layout {
    min-height: 100vh;
}

@media print {
    .mud-drawer-provider,
    .mud-drawer,
    .mud-drawer-responsive,
    .mud-appbar,
    .mud-popover-provider,
    .mud-snackbar-provider,
    .sidebar,
    .top-row,
    nav,
    header,
    aside,
    .no-print,
    button,
    .mud-button-root,
    .btn {
        display: none !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
    }

    body, html, main, .mud-layout, .mud-main-content, .page, article.content, .mud-container, .container-fluid {
        background: #ffffff !important;
        color: #000000 !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        box-shadow: none !important;
    }

    .printable-report {
        display: block !important;
        width: 100% !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 !important;
    }
}
`;
  files.push({ name: 'app.css', path: `${root}/wwwroot/css/app.css`, content: appCss, language: 'css' });

  // 7. App.razor
  const appRazor = useAuth ? `<CascadingAuthenticationState>
    <Router AppAssembly="@typeof(App).Assembly">
        <Found Context="routeData">
            <AuthorizeRouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)">
                <NotAuthorized>
                    <MudContainer Class="d-flex flex-column align-center justify-center min-vh-100 pa-4 text-center">
                        <MudIcon Icon="@Icons.Material.Filled.Security" Color="Color.Error" Size="Size.Large" Class="mb-3" />
                        <MudText Typo="Typo.h5" Color="Color.Error" Class="fw-bold mb-2">Zugriff verweigert</MudText>
                        <MudText Color="Color.Secondary" Class="mb-4">Sie haben keine Berechtigung für diese Seite oder Ihre Sitzung ist abgelaufen.</MudText>
                        <MudButton Variant="Variant.Filled" Color="Color.Primary" Link="login">Zum Login</MudButton>
                    </MudContainer>
                </NotAuthorized>
            </AuthorizeRouteView>
        </Found>
        <NotFound>
            <PageTitle>Seite nicht gefunden</PageTitle>
            <LayoutView Layout="@typeof(MainLayout)">
                <MudContainer Class="text-center py-8">
                    <MudText Typo="Typo.h2" Color="Color.Secondary" Class="fw-bold">404</MudText>
                    <MudText Typo="Typo.h6" Color="Color.Secondary">Die angeforderte Seite existiert nicht.</MudText>
                </MudContainer>
            </LayoutView>
        </NotFound>
    </Router>
</CascadingAuthenticationState>` : `<Router AppAssembly="@typeof(App).Assembly">
    <Found Context="routeData">
        <RouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)" />
        <FocusOnNavigate RouteData="@routeData" Selector="h1" />
    </Found>
    <NotFound>
        <PageTitle>Seite nicht gefunden</PageTitle>
        <LayoutView Layout="@typeof(MainLayout)">
            <MudContainer Class="text-center py-8">
                <MudText Typo="Typo.h2" Color="Color.Secondary" Class="fw-bold">404</MudText>
                <MudText Typo="Typo.h6" Color="Color.Secondary">Die angeforderte Seite existiert nicht.</MudText>
            </MudContainer>
        </LayoutView>
    </NotFound>
</Router>`;
  files.push({ name: 'App.razor', path: `${root}/App.razor`, content: appRazor, language: 'razor' });

  return files;
};
