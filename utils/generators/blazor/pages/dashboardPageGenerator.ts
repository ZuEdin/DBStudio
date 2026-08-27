import { Table, BackendConfig, VirtualFile } from '../../../../types/index';
import { toPascalCase, toCamelCase } from '../../common';

export const generateDashboardPage = (
  tables: Table[],
  config: BackendConfig,
  root: string,
  useAuth: boolean = false
): VirtualFile => {
  let tableCardStats = '';
  tables.forEach(t => {
    tableCardStats += `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card shadow-sm border-0 h-100 transition-card">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="text-uppercase text-secondary fw-bold mb-0" style="font-size: 0.8rem; letter-spacing: 0.05em;">
                            <i class="bi bi-table me-1 text-primary"></i> ${t.name}
                        </h6>
                        <span class="badge bg-primary-subtle text-primary border border-primary-subtle">
                            @counts["${t.name}"] Einträge
                        </span>
                    </div>
                    <p class="card-text text-secondary small flex-grow-1">
                        Verwalten Sie Datensätze, führen Sie CRUD-Operationen aus und durchsuchen Sie die Tabelle <b>${t.name}</b>.
                    </p>
                    <div class="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
                        <a href="${toCamelCase(t.name)}" class="btn btn-outline-primary btn-sm fw-semibold">
                            <i class="bi bi-folder2-open me-1"></i> Tabelle öffnen
                        </a>
                        <small class="text-muted">${t.fields.length} Spalten</small>
                    </div>
                </div>
            </div>
        </div>`;
  });

  const indexRazor = `@page "/"
${useAuth ? '@attribute [Authorize]' : ''}
@inject StorageServiceManager StorageManager
@implements IDisposable

<div class="container-fluid py-2">
    <div class="p-5 mb-4 bg-white rounded-3 shadow-sm border">
        <div class="container-fluid py-2">
            <h1 class="display-5 fw-bold text-primary">${config.projectName}</h1>
            <p class="col-md-9 fs-5 text-secondary">
                Willkommen in Ihrer modernen <b>Blazor WebAssembly</b> Anwendung. Entwickelt mit C# und vollständiger Unterstützung für Offline-First Datenspeicherung und REST-API-Synchronisation.
            </p>
            <hr class="my-4" />
            <div class="row g-4">
                <div class="col-md-6">
                    <div class="d-flex align-items-start gap-3">
                        <div class="bg-success-subtle p-3 rounded-3 text-success">
                            <i class="bi bi-shield-check fs-3"></i>
                        </div>
                        <div>
                            <h5 class="fw-bold text-slate-800 mb-1">Offline-First (IndexedDB)</h5>
                            <p class="text-secondary small mb-0">
                                Standardmäßig speichert die Anwendung alle Daten lokal in der hochperformanten Browser-IndexedDB. Sie können jederzeit oben rechts die Datenquelle umschalten.
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="d-flex align-items-start gap-3">
                        <div class="bg-primary-subtle p-3 rounded-3 text-primary">
                            <i class="bi bi-database-check fs-3"></i>
                        </div>
                        <div>
                            <h5 class="fw-bold text-slate-800 mb-1">REST API &amp; SQL-Verbindung</h5>
                            <p class="text-secondary small mb-0">
                                Schnelle Umschaltung auf die ASP.NET Core REST-API, welche direkt mit MySQL, SQL Server, PostgreSQL oder SQLite kommuniziert.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="fw-bold mb-0 text-slate-800"><i class="bi bi-grid-fill me-2 text-primary"></i>Tabellenübersicht</h4>
        <span class="text-secondary small">Aktiver Modus: <b>@StorageManager.CurrentService.BackendName</b></span>
    </div>

    <div class="row">
        ${tableCardStats}
    </div>
</div>

@code {
    private Dictionary<string, int> counts = new() {
        ${tables.map(t => `{"${t.name}", 0}`).join(',\n        ')}
    };

    protected override async Task OnInitializedAsync()
    {
        StorageManager.OnStorageChanged += HandleStorageChanged;
        await LoadCounts();
    }

    private async void HandleStorageChanged()
    {
        await InvokeAsync(async () =>
        {
            await LoadCounts();
            StateHasChanged();
        });
    }

    private async Task LoadCounts()
    {
        var service = StorageManager.CurrentService;
        ${tables.map(t => `
        try {
            var ${toCamelCase(t.name)}List = await service.GetAll<${toPascalCase(t.name)}>("${t.name}");
            counts["${t.name}"] = ${toCamelCase(t.name)}List.Count;
        } catch { counts["${t.name}"] = 0; }
        `).join('\n')}
    }

    public void Dispose()
    {
        StorageManager.OnStorageChanged -= HandleStorageChanged;
    }
}
`;

  return {
    name: 'Index.razor',
    path: `${root}/Pages/Index.razor`,
    content: indexRazor,
    language: 'razor'
  };
};
