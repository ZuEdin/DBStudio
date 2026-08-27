import { Table, Query, Report, Form, CustomPage, BackendConfig, VirtualFile } from '../../../types/index';
import { toCamelCase } from '../common';

export const generateBlazorLayouts = (
  tables: Table[],
  config: BackendConfig,
  namespace: string,
  root: string,
  useAuth: boolean = false,
  queries: Query[] = [],
  reports: Report[] = [],
  pages: CustomPage[] = [],
  forms: Form[] = []
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // MainLayout.razor
  const mainLayout = `@inherits LayoutComponentBase
@inject StorageServiceManager StorageManager
${useAuth ? '@inject AuthService Auth\n@inject NavigationManager Nav' : ''}
@implements IDisposable

<style>
@@media print {
    .sidebar, .top-row, nav, header, aside, .no-print, button, .btn {
        display: none !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
    }
    body, html, main, .page, article.content, .container-fluid {
        background: white !important;
        color: black !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
    }
}
</style>

<div class="page">
    <div class="sidebar">
        <NavMenu />
    </div>
    <main>
        <div class="top-row px-4 shadow-sm d-flex justify-content-between align-items-center bg-white border-bottom">
            <div class="d-flex align-items-center gap-3">
                <span class="fw-bold text-secondary small text-uppercase">Datenquelle:</span>
                <select class="form-select form-select-sm shadow-none border-primary" style="width: auto; font-weight: 500;" @value="currentStorage" @onchange="OnStorageChanged">
                    <option value="API">REST API (Server &amp; SQLite / SQL)</option>
                    <option value="IndexedDB">IndexedDB (Lokal &amp; Offline)</option>
                </select>
                <span class="badge bg-light text-primary border border-primary-subtle d-none d-md-inline-block">
                    Modus: <b>@StorageManager.CurrentService.BackendName</b>
                </span>
            </div>
            <div>
${useAuth ? `                <AuthorizeView>
                    <Authorized>
                        <span class="me-2 text-secondary">Hallo, <b>@context.User.Identity?.Name</b></span>
                        <a href="profile" class="btn btn-outline-secondary btn-sm me-1"><i class="bi bi-person"></i> Profil</a>
                        <button class="btn btn-outline-danger btn-sm" @onclick="Logout"><i class="bi bi-box-arrow-right"></i> Logout</button>
                    </Authorized>
                    <NotAuthorized>
                        <a href="login" class="btn btn-primary btn-sm"><i class="bi bi-box-arrow-in-right"></i> Login</a>
                    </NotAuthorized>
                </AuthorizeView>` : ''}
            </div>
        </div>
        <article class="content px-4 py-4">
            @Body
        </article>
    </main>
</div>

@code {
    private string currentStorage = "API";

    protected override void OnInitialized()
    {
        currentStorage = StorageManager.StorageType;
        StorageManager.OnStorageChanged += HandleStorageChanged;
    }

    private void HandleStorageChanged()
    {
        currentStorage = StorageManager.StorageType;
        StateHasChanged();
    }

    private void OnStorageChanged(ChangeEventArgs e)
    {
        var val = e.Value?.ToString() ?? "API";
        currentStorage = val;
        StorageManager.SetStorageType(val);
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
    const link = `        <div class="nav-item px-3">
            <NavLink class="nav-link" href="/${toCamelCase(t.name)}">
                <i class="bi bi-table me-2"></i> ${t.name}
            </NavLink>
        </div>\n`;

    if (useAuth && isSystem) {
      navLinks += `        <AuthorizeView Roles="Admin">\n    ${link}        </AuthorizeView>\n`;
    } else {
      navLinks += link;
    }
  });

  let formLinks = '';
  forms.forEach(f => {
    formLinks += `        <div class="nav-item px-3">
            <NavLink class="nav-link" href="/forms/${f.id}">
                <i class="bi bi-file-earmark-text me-2"></i> ${f.name}
            </NavLink>
        </div>\n`;
  });

  let pageLinks = '';
  pages.forEach(p => {
    pageLinks += `        <div class="nav-item px-3">
            <NavLink class="nav-link" href="/pages/${p.id}">
                <i class="bi bi-layout-text-window-reverse me-2"></i> ${p.name}
            </NavLink>
        </div>\n`;
  });

  const navMenu = `<div class="top-row ps-3 navbar navbar-dark bg-dark">
    <a class="navbar-brand text-truncate fw-bold" href="/">
        <i class="bi bi-database me-2"></i>${config.projectName}
    </a>
</div>

<div class="nav-scrollable flex-grow-1 py-3" style="overflow-y: auto;">
    <nav class="flex-column">
        <div class="nav-item px-3">
            <NavLink class="nav-link" href="/" Match="NavLinkMatch.All">
                <i class="bi bi-speedometer2 me-2"></i> Dashboard
            </NavLink>
        </div>
        <hr class="text-secondary my-2 mx-3" />
        <div class="px-3 text-uppercase text-secondary fw-bold" style="font-size: 0.75rem; letter-spacing: 0.05em;">Tabellen</div>
${navLinks}
        ${forms.length > 0 ? `
        <hr class="text-secondary my-2 mx-3" />
        <div class="px-3 text-uppercase text-secondary fw-bold" style="font-size: 0.75rem; letter-spacing: 0.05em;">Formulare</div>
${formLinks}` : ''}
        ${pages.length > 0 ? `
        <hr class="text-secondary my-2 mx-3" />
        <div class="px-3 text-uppercase text-secondary fw-bold" style="font-size: 0.75rem; letter-spacing: 0.05em;">Designer Pages</div>
${pageLinks}` : ''}
        <hr class="text-secondary my-2 mx-3" />
        <div class="px-3 text-uppercase text-secondary fw-bold" style="font-size: 0.75rem; letter-spacing: 0.05em;">Analysen &amp; Auswertungen</div>
        <div class="nav-item px-3">
            <NavLink class="nav-link" href="/queries">
                <i class="bi bi-search me-2"></i> Abfragen
            </NavLink>
        </div>
        <div class="nav-item px-3">
            <NavLink class="nav-link" href="/reports">
                <i class="bi bi-file-earmark-bar-graph me-2"></i> Berichte
            </NavLink>
        </div>
    </nav>
</div>
`;
  files.push({ name: 'NavMenu.razor', path: `${root}/Layout/NavMenu.razor`, content: navMenu, language: 'razor' });

  const navMenuCss = `.navbar-toggler {
    background-color: rgba(255, 255, 255, 0.1);
}

.nav-item {
    font-size: 0.9rem;
    padding-bottom: 0.25rem;
}

.nav-item:first-of-type {
    padding-top: 0.5rem;
}

.nav-item:last-of-type {
    padding-bottom: 1rem;
}

.nav-item a {
    color: #adb5bd;
    border-radius: 6px;
    height: 2.5rem;
    display: flex;
    align-items: center;
    line-height: 2.5rem;
    text-decoration: none;
    transition: all 0.15s ease-in-out;
}

.nav-item a.active {
    background-color: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    font-weight: 600;
}

.nav-item a:hover {
    background-color: rgba(255, 255, 255, 0.08);
    color: #ffffff;
}
`;
  files.push({ name: 'NavMenu.razor.css', path: `${root}/Layout/NavMenu.razor.css`, content: navMenuCss, language: 'css' });

  return files;
};
