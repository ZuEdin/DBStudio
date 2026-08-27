import { Table, Query, Report, BackendConfig, VirtualFile } from '../../../types/index';
import { toCamelCase } from '../common';

export const generateMudBlazorLayouts = (
  tables: Table[],
  config: BackendConfig,
  namespace: string,
  root: string,
  useAuth: boolean = false,
  queries: Query[] = [],
  reports: Report[] = []
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // MainLayout.razor
  const mainLayout = `@inherits LayoutComponentBase
@inject StorageServiceManager StorageManager
${useAuth ? '@inject AuthService Auth\n@inject NavigationManager Nav' : ''}
@implements IDisposable

<MudThemeProvider />
<MudPopoverProvider />
<MudDialogProvider />
<MudSnackbarProvider />

<style>
@@media print {
    .mud-drawer-provider, .mud-drawer, .mud-drawer-responsive, .mud-appbar, .mud-popover-provider, .mud-snackbar-provider, .sidebar, .top-row, nav, header, aside, .no-print, button, .mud-button-root, .btn {
        display: none !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
    }
    body, html, main, .mud-layout, .mud-main-content, .page, article.content, .mud-container {
        background: white !important;
        color: black !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
    }
}
</style>

<MudLayout>
    <MudAppBar Elevation="1" Color="Color.Primary" Dense="true">
        <MudIconButton Icon="@Icons.Material.Filled.Menu" Color="Color.Inherit" Edge="Edge.Start" OnClick="@((e) => DrawerToggle())" />
        <MudText Typo="Typo.h6" Class="ml-2 font-weight-bold">${config.projectName}</MudText>
        <MudSpacer />
        
        <MudChip T="string" Color="Color.Info" Variant="Variant.Filled" Size="Size.Small" Class="mr-3 d-none d-md-inline-flex">
            Modus: @StorageManager.CurrentService.BackendName
        </MudChip>

        <MudSelect T="string" Value="@currentStorage" ValueChanged="OnStorageChanged" Dense="true" Margin="Margin.Dense" Style="width: 220px; color: white;" Variant="Variant.Outlined">
            <MudSelectItem Value="@("IndexedDB")">IndexedDB (Lokal &amp; Offline)</MudSelectItem>
            <MudSelectItem Value="@("API")">REST API (Server &amp; SQL)</MudSelectItem>
        </MudSelect>

${useAuth ? `        <AuthorizeView>
            <Authorized>
                <MudText Class="mx-3 text-white">Hallo, <b>@context.User.Identity?.Name</b></MudText>
                <MudButton Variant="Variant.Outlined" Color="Color.Inherit" Size="Size.Small" OnClick="Logout" StartIcon="@Icons.Material.Filled.Logout">Logout</MudButton>
            </Authorized>
            <NotAuthorized>
                <MudButton Variant="Variant.Filled" Color="Color.Secondary" Size="Size.Small" Link="login" StartIcon="@Icons.Material.Filled.Login">Login</MudButton>
            </NotAuthorized>
        </AuthorizeView>` : ''}
    </MudAppBar>

    <MudDrawer @bind-Open="_drawerOpen" Elevation="2" ClipMode="DrawerClipMode.Always">
        <NavMenu />
    </MudDrawer>

    <MudMainContent Class="pa-4 bg-light min-vh-100">
        @Body
    </MudMainContent>
</MudLayout>

@code {
    private bool _drawerOpen = true;
    private string currentStorage = "IndexedDB";

    protected override void OnInitialized()
    {
        currentStorage = StorageManager.StorageType;
        StorageManager.OnStorageChanged += HandleStorageChanged;
    }

    private async void HandleStorageChanged()
    {
        currentStorage = StorageManager.StorageType;
        await InvokeAsync(StateHasChanged);
    }

    private void OnStorageChanged(string val)
    {
        currentStorage = val;
        StorageManager.SetStorageType(val);
    }

    private void DrawerToggle()
    {
        _drawerOpen = !_drawerOpen;
    }

${useAuth ? `    private async Task Logout()
    {
        await Auth.Logout();
        Nav.NavigateTo("/login");
    }` : ''}

    public void Dispose()
    {
        StorageManager.OnStorageChanged -= HandleStorageChanged;
    }
}
`;
  files.push({ name: 'MainLayout.razor', path: `${root}/Layout/MainLayout.razor`, content: mainLayout, language: 'razor' });

  // NavMenu.razor
  let navLinks = '';
  tables.forEach(t => {
    const isSystem = t.name.startsWith('sys_');
    const link = `<MudNavLink Icon="@Icons.Material.Filled.TableChart" Href="/${toCamelCase(t.name)}">${t.name}</MudNavLink>\n`;

    if (useAuth && isSystem) {
      navLinks += `<AuthorizeView Roles="Admin">\n    ${link}</AuthorizeView>\n`;
    } else {
      navLinks += link;
    }
  });

  const navMenu = `<MudNavMenu Class="mud-width-full py-2">
    <MudText Typo="Typo.subtitle2" Color="Color.Primary" Class="px-4 pt-2 pb-1 font-weight-bold">NAVIGATION</MudText>
    <MudNavLink Match="NavLinkMatch.All" Icon="@Icons.Material.Filled.Dashboard" Href="/">Dashboard</MudNavLink>
    
    <MudDivider Class="my-3" />
    <MudText Typo="Typo.subtitle2" Color="Color.Secondary" Class="px-4 pb-1 font-weight-bold">TABELLEN</MudText>
    ${navLinks}

    <MudDivider Class="my-3" />
    <MudText Typo="Typo.subtitle2" Color="Color.Info" Class="px-4 pb-1 font-weight-bold">ANALYSEN &amp; AUSWERTUNGEN</MudText>
    <MudNavLink Icon="@Icons.Material.Filled.Search" Href="/queries">Abfragen</MudNavLink>
    <MudNavLink Icon="@Icons.Material.Filled.Assessment" Href="/reports">Berichte</MudNavLink>
</MudNavMenu>
`;
  files.push({ name: 'NavMenu.razor', path: `${root}/Layout/NavMenu.razor`, content: navMenu, language: 'razor' });

  return files;
};
