import { Table, BackendConfig, VirtualFile } from '../../../../types/index';
import { toCamelCase } from '../../common';

export const generateMudBlazorDashboardPage = (
  tables: Table[],
  config: BackendConfig,
  root: string,
  useAuth: boolean = false
): VirtualFile => {
  let tableCardStats = '';
  tables.forEach(t => {
    tableCardStats += `
        <MudItem xs="12" sm="6" md="4">
            <MudCard Elevation="1" Class="h-100">
                <MudCardContent>
                    <div class="d-flex justify-space-between align-center mb-2">
                        <MudText Typo="Typo.subtitle2" Color="Color.Primary" Class="font-weight-bold">
                            <MudIcon Icon="@Icons.Material.Filled.TableChart" Size="Size.Small" Class="mr-1" /> ${t.name}
                        </MudText>
                        <MudChip T="string" Color="Color.Primary" Size="Size.Small" Variant="Variant.Outlined">
                            @counts["${t.name}"] Einträge
                        </MudChip>
                    </div>
                    <MudText Typo="Typo.body2" Color="Color.Secondary" Class="mb-4">
                        Verwalten Sie Datensätze, führen Sie CRUD-Operationen aus und durchsuchen Sie die Tabelle <b>${t.name}</b>.
                    </MudText>
                </MudCardContent>
                <MudCardActions Class="pt-0">
                    <MudButton Variant="Variant.Outlined" Color="Color.Primary" Size="Size.Small" Link="${toCamelCase(t.name)}" StartIcon="@Icons.Material.Filled.FolderOpen">
                        Tabelle öffnen
                    </MudButton>
                    <MudSpacer />
                    <MudText Typo="Typo.caption" Color="Color.Secondary">${t.fields.length} Spalten</MudText>
                </MudCardActions>
            </MudCard>
        </MudItem>`;
  });

  const indexRazor = `@page "/"
${useAuth ? '@attribute [Authorize]' : ''}
@inject StorageServiceManager StorageManager
@implements IDisposable

<MudContainer MaxWidth="MaxWidth.ExtraExtraLarge" Class="py-4">
    <MudPaper Class="pa-6 mb-6" Elevation="1">
        <MudText Typo="Typo.h4" Color="Color.Primary" Class="font-weight-bold mb-2">${config.projectName}</MudText>
        <MudText Typo="Typo.body1" Color="Color.Secondary" Class="mb-4">
            Willkommen in Ihrer modernen <b>MudBlazor WebAssembly</b> Anwendung. Entwickelt mit C# und MudBlazor Component Engine für Material Design.
        </MudText>
        
        <MudDivider Class="my-4" />
        
        <MudGrid>
            <MudItem xs="12" md="6">
                <div class="d-flex align-center gap-3">
                    <MudIcon Icon="@Icons.Material.Filled.OfflinePin" Color="Color.Success" Size="Size.Large" />
                    <div>
                        <MudText Typo="Typo.subtitle1" Class="font-weight-bold">Offline-First (IndexedDB)</MudText>
                        <MudText Typo="Typo.body2" Color="Color.Secondary">
                            Speichert alle Daten lokal in der hochperformanten Browser-IndexedDB. Sie können jederzeit in der Kopfzeile die Datenquelle umschalten.
                        </MudText>
                    </div>
                </div>
            </MudItem>
            <MudItem xs="12" md="6">
                <div class="d-flex align-center gap-3">
                    <MudIcon Icon="@Icons.Material.Filled.Storage" Color="Color.Info" Size="Size.Large" />
                    <div>
                        <MudText Typo="Typo.subtitle1" Class="font-weight-bold">REST API &amp; SQL-Verbindung</MudText>
                        <MudText Typo="Typo.body2" Color="Color.Secondary">
                            Nahtlose Anbindung an die ASP.NET Core REST-API mit Unterstützung für MySQL, SQL Server, PostgreSQL und SQLite.
                        </MudText>
                    </div>
                </div>
            </MudItem>
        </MudGrid>
    </MudPaper>

    <div class="d-flex justify-space-between align-center mb-4">
        <MudText Typo="Typo.h5" Class="font-weight-bold">
            <MudIcon Icon="@Icons.Material.Filled.GridView" Size="Size.Medium" Class="mr-2" />Tabellenübersicht
        </MudText>
        <MudText Typo="Typo.body2" Color="Color.Secondary">Aktiver Modus: <b>@StorageManager.CurrentService.BackendName</b></MudText>
    </div>

    <MudGrid>
        ${tableCardStats}
    </MudGrid>
</MudContainer>

@code {
    private Dictionary<string, int> counts = new() {
        ${tables.map(t => `{"${t.name}", 0}`).join(',\n        ')}
    };

    protected override async Task OnInitializedAsync()
    {
        StorageManager.OnStorageChanged += HandleStorageChanged;
        await LoadCounts();
    }

    private async Task LoadCounts()
    {
        foreach (var key in counts.Keys.ToList())
        {
            try
            {
                var list = await StorageManager.CurrentService.GetAll<Dictionary<string, object>>(key);
                counts[key] = list?.Count ?? 0;
            }
            catch
            {
                counts[key] = 0;
            }
        }
    }

    private async void HandleStorageChanged()
    {
        await LoadCounts();
        await InvokeAsync(StateHasChanged);
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
