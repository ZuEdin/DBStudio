import { Table, Query, Report, BackendConfig, VirtualFile, Relationship, Field } from '../../../types/index';
import { toPascalCase, toCamelCase, resolveType, findTargetTable, isNullable } from '../common';

const getFKTableInfo = (targetTable: Table) => {
  const className = toPascalCase(targetTable.name);
  const camelName = toCamelCase(targetTable.name);
  const pkField = targetTable.fields.find(x => x.isPrimaryKey) || targetTable.fields[0];
  const pkProp = toPascalCase(pkField.name);
  const labelField = targetTable.fields.find(x => !x.isPrimaryKey && (
    x.name.toLowerCase().includes('name') ||
    x.name.toLowerCase().includes('bezeichnung') ||
    x.name.toLowerCase().includes('titel') ||
    x.name.toLowerCase().includes('firma') ||
    x.name.toLowerCase().includes('nummer') ||
    x.name.toLowerCase().includes('nr') ||
    x.name.toLowerCase().includes('beschreibung')
  )) || targetTable.fields.find(x => !x.isPrimaryKey && (x.type === 'VARCHAR' || x.type === 'TEXT' || x.type === 'CHAR' || x.type === 'EMAIL' || (x.type as string) === 'string')) || pkField;
  const labelProp = toPascalCase(labelField.name);
  return { className, camelName, pkProp, labelProp };
};

export const generateMudBlazorPages = (
  tables: Table[],
  config: BackendConfig,
  namespace: string,
  root: string,
  useAuth: boolean = false,
  queries: Query[] = [],
  reports: Report[] = [],
  relationships: Relationship[] = []
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // 1. Dashboard (Index.razor)
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
  files.push({ name: 'Index.razor', path: `${root}/Pages/Index.razor`, content: indexRazor, language: 'razor' });

  // 2. Table CRUD Pages ({Tabelle}List.razor)
  tables.forEach(table => {
    const className = toPascalCase(table.name);
    const pkField = table.fields.find(f => f.isPrimaryKey)?.name || 'id';
    const pkPascal = toPascalCase(pkField);

    let isSysTable = table.name.startsWith('sys_');
    let attributes = useAuth && isSysTable ? '@attribute [Authorize(Roles = "Admin")]' : (useAuth ? '@attribute [Authorize]' : '');

    let mudTableHeaders = '';
    let mudTableRows = '';
    let formFields = '';

    const fkLookups: { field: Field; targetTable: Table; propName: string }[] = [];
    table.fields.forEach(f => {
      const targetTable = findTargetTable(f, table, tables, relationships);
      if (targetTable) {
        fkLookups.push({ field: f, targetTable, propName: toPascalCase(f.name) });
      }
    });

    const uniqueTargetTables = Array.from(
      new Map(fkLookups.map(item => [item.targetTable.id, item.targetTable])).values()
    );

    table.fields.forEach(f => {
      const fieldPascal = toPascalCase(f.name);
      const rawType = resolveType(f, 'csharp');
      const fieldNullable = isNullable(f);
      const fullCsharpType = rawType + (fieldNullable ? '?' : '');
      const fkMatch = fkLookups.find(x => x.field.name === f.name);

      if (fkMatch) {
        const targetInfo = getFKTableInfo(fkMatch.targetTable);
        mudTableHeaders += `            <MudTh>${f.name} (${fkMatch.targetTable.name})</MudTh>\n`;
        mudTableRows += `            <MudTd DataLabel="${f.name}">@Get${targetInfo.className}Display(context.${fieldPascal})</MudTd>\n`;
      } else {
        mudTableHeaders += `            <MudTh>${f.name}</MudTh>\n`;

        if (rawType === 'bool') {
          mudTableRows += `            <MudTd DataLabel="${f.name}">@(context.${fieldPascal} == true ? "Ja" : "Nein")</MudTd>\n`;
        } else if (rawType === 'DateTime') {
          mudTableRows += `            <MudTd DataLabel="${f.name}">@(context.${fieldPascal}?.ToString("dd.MM.yyyy") ?? "-")</MudTd>\n`;
        } else {
          mudTableRows += `            <MudTd DataLabel="${f.name}">@context.${fieldPascal}</MudTd>\n`;
        }
      }

      if (f.isPrimaryKey) {
        formFields += `                        <div class="mb-3">
                            <MudTextField Value="@(activeItem.${fieldPascal} == 0 ? "Wird automatisch generiert" : activeItem.${fieldPascal}.ToString())" Label="${f.name} (PK)" Variant="Variant.Outlined" Margin="Margin.Dense" Disabled="true" />
                        </div>\n`;
      } else if (fkMatch) {
        const targetInfo = getFKTableInfo(fkMatch.targetTable);
        const selectType = fullCsharpType;
        const nullValCast = fieldNullable ? `(${selectType})null` : `(${selectType})0`;

        formFields += `                        <div class="mb-3">
                            <MudSelect T="${selectType}" @bind-Value="activeItem.${fieldPascal}" Label="${f.name} (${fkMatch.targetTable.name})" Variant="Variant.Outlined" Margin="Margin.Dense" AnchorOrigin="Origin.BottomCenter">
                                <MudSelectItem T="${selectType}" Value="@(${nullValCast})">-- Bitte ${fkMatch.targetTable.name} auswählen --</MudSelectItem>
                                @if (${targetInfo.camelName}LookupList != null)
                                {
                                    @foreach (var fkItem in ${targetInfo.camelName}LookupList)
                                    {
                                        var fkId = fkItem.${targetInfo.pkProp};
                                        var fkLabel = fkItem.${targetInfo.labelProp}?.ToString() ?? "";
                                        <MudSelectItem T="${selectType}" Value="@((${selectType})fkId)">@(string.IsNullOrWhiteSpace(fkLabel) ? $"ID: {fkId}" : $"{fkLabel} (ID: {fkId})")</MudSelectItem>
                                    }
                                }
                            </MudSelect>
                        </div>\n`;
      } else {
        if (rawType === 'bool') {
          formFields += `                        <div class="mb-3">
                            <MudSwitch @bind-Value="activeItem.${fieldPascal}" Label="${f.name}" Color="Color.Primary" />
                        </div>\n`;
        } else if (rawType === 'int' || rawType === 'long' || rawType === 'short' || rawType === 'decimal' || rawType === 'double' || rawType === 'float') {
          formFields += `                        <div class="mb-3">
                            <MudNumericField @bind-Value="activeItem.${fieldPascal}" Label="${f.name}" Variant="Variant.Outlined" Margin="Margin.Dense" />
                        </div>\n`;
        } else if (rawType === 'DateTime') {
          formFields += `                        <div class="mb-3">
                            <MudDatePicker Label="${f.name}" @bind-Date="activeItem.${fieldPascal}" Variant="Variant.Outlined" Margin="Margin.Dense" />
                        </div>\n`;
        } else {
          formFields += `                        <div class="mb-3">
                            <MudTextField @bind-Value="activeItem.${fieldPascal}" Label="${f.name}" Variant="Variant.Outlined" Margin="Margin.Dense" />
                        </div>\n`;
        }
      }
    });

    const pageContent = `@page "/${toCamelCase(table.name)}"
${attributes}
@inject StorageServiceManager StorageManager
@inject NavigationManager NavigationManager
@implements IDisposable
@using ${namespace}.Models

<MudContainer MaxWidth="MaxWidth.ExtraExtraLarge" Class="py-4">
    <MudPaper Class="pa-4 mb-4" Elevation="1">
        <div class="d-flex flex-column flex-md-row justify-space-between align-center gap-3">
            <div>
                <div class="d-flex align-center gap-2">
                    <MudIconButton Icon="@Icons.Material.Filled.ArrowBack" Link="" Size="Size.Small" />
                    <MudText Typo="Typo.h5" Class="font-weight-bold">${table.name}</MudText>
                    <MudChip T="string" Color="Color.Primary" Size="Size.Small" Variant="Variant.Outlined">
                        @(items?.Count ?? 0) Datensätze
                    </MudChip>
                </div>
                <MudText Typo="Typo.body2" Color="Color.Secondary" Class="mt-1">
                    Verwaltung von <b>${table.name}</b> (Quelle: <b>@StorageManager.CurrentService.BackendName</b>)
                </MudText>
            </div>
            <div class="d-flex align-center gap-2">
                <MudTextField @bind-Value="searchTerm" Placeholder="Suchen..." Adornment="Adornment.Start" AdornmentIcon="@Icons.Material.Filled.Search" IconSize="Size.Medium" Margin="Margin.Dense" Variant="Variant.Outlined" Class="mt-0" Immediate="true" />
                <MudButton Variant="Variant.Filled" Color="Color.Primary" StartIcon="@Icons.Material.Filled.Add" OnClick="OpenAddModal">
                    Neuer Eintrag
                </MudButton>
            </div>
        </div>
    </MudPaper>

    <MudTable Items="@FilteredItems" Hover="true" Striped="true" Elevation="1" Loading="@isLoading" LoadingProgressColor="Color.Info">
        <HeaderContent>
${mudTableHeaders}
            <MudTh Style="text-align: right;">Aktionen</MudTh>
        </HeaderContent>
        <RowTemplate>
${mudTableRows}
            <MudTd DataLabel="Aktionen" Style="text-align: right;">
                <MudIconButton Icon="@Icons.Material.Filled.Edit" Color="Color.Default" Size="Size.Small" OnClick="() => OpenEditModal(context)" />
                <MudIconButton Icon="@Icons.Material.Filled.Delete" Color="Color.Error" Size="Size.Small" OnClick="() => DeleteItem(context)" />
            </MudTd>
        </RowTemplate>

        <NoRecordsContent>
            <MudText Class="py-4 text-center">Keine Datensätze gefunden.</MudText>
        </NoRecordsContent>
    </MudTable>
</MudContainer>

@if (showModal)
{
    <MudOverlay Visible="true" DarkBackground="true" Absolute="false" Style="z-index: 1050; display: flex; align-items: center; justify-content: center;">
        <MudPaper Elevation="8" Class="pa-6" Style="width: 100%; max-width: 550px; border-radius: 8px;">
            <div class="d-flex justify-space-between align-center mb-4">
                <MudText Typo="Typo.h6" Class="font-weight-bold">
                    @(isEditMode ? "Eintrag bearbeiten" : "Neuer Eintrag")
                </MudText>
                <MudIconButton Icon="@Icons.Material.Filled.Close" Size="Size.Small" OnClick="CloseModal" />
            </div>
            
            <EditForm Model="activeItem" OnValidSubmit="SaveItem">
                <DataAnnotationsValidator />
                <ValidationSummary />
                
                <div class="py-2">
${formFields}
                </div>
                
                <div class="d-flex justify-end gap-2 mt-4 pt-2 border-top">
                    <MudButton Variant="Variant.Outlined" Color="Color.Secondary" OnClick="CloseModal">Abbrechen</MudButton>
                    <MudButton ButtonType="ButtonType.Submit" Variant="Variant.Filled" Color="Color.Primary">Speichern</MudButton>
                </div>
            </EditForm>
        </MudPaper>
    </MudOverlay>
}

@code {
    private List<${className}> items = new();
    private ${className} activeItem = new();
    private bool isLoading = true;
    private bool showModal = false;
    private bool isEditMode = false;
    private string searchTerm = "";

${uniqueTargetTables.map(t => {
  const info = getFKTableInfo(t);
  return `    private List<${info.className}>? ${info.camelName}LookupList;`;
}).join('\n')}

    private IEnumerable<${className}> FilteredItems => string.IsNullOrWhiteSpace(searchTerm)
        ? items
        : items.Where(x => System.Text.Json.JsonSerializer.Serialize(x).Contains(searchTerm, StringComparison.OrdinalIgnoreCase));

    protected override async Task OnInitializedAsync()
    {
        StorageManager.OnStorageChanged += HandleStorageChanged;
        await LoadItems();
    }

    private async Task LoadItems()
    {
        isLoading = true;
        try
        {
            items = await StorageManager.CurrentService.GetAll<${className}>("${table.name}");
${uniqueTargetTables.map(t => {
  const info = getFKTableInfo(t);
  return `            try { ${info.camelName}LookupList = await StorageManager.CurrentService.GetAll<${info.className}>("${t.name}"); } catch {}`;
}).join('\n')}
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Fehler beim Laden der Tabelle ${table.name}: {ex.Message}");
        }
        finally
        {
            isLoading = false;
        }
    }

${uniqueTargetTables.map(t => {
  const info = getFKTableInfo(t);
  return `    private string Get${info.className}Display(object? val)
    {
        if (val == null || string.IsNullOrWhiteSpace(val.ToString()) || ${info.camelName}LookupList == null) return "-";
        var match = ${info.camelName}LookupList.FirstOrDefault(x => x.${info.pkProp}.ToString() == val.ToString());
        if (match != null)
        {
            var label = match.${info.labelProp}?.ToString();
            return !string.IsNullOrWhiteSpace(label) ? $"{label} (ID: {val})" : $"ID: {val}";
        }
        return $"ID: {val}";
    }`;
}).join('\n\n')}

    private async void HandleStorageChanged()
    {
        await LoadItems();
        await InvokeAsync(StateHasChanged);
    }

    private void OpenAddModal()
    {
        activeItem = new ${className}();
        isEditMode = false;
        showModal = true;
    }

    private void OpenEditModal(${className} item)
    {
        activeItem = new ${className}
        {
${table.fields.map(f => `            ${toPascalCase(f.name)} = item.${toPascalCase(f.name)}`).join(',\n')}
        };
        isEditMode = true;
        showModal = true;
    }

    private void CloseModal()
    {
        showModal = false;
    }

    private async Task SaveItem()
    {
        if (isEditMode)
        {
            await StorageManager.CurrentService.Update<${className}>("${table.name}", activeItem.${pkPascal}, activeItem);
        }
        else
        {
            await StorageManager.CurrentService.Add<${className}>("${table.name}", activeItem);
        }
        showModal = false;
        await LoadItems();
    }

    private async Task DeleteItem(${className} item)
    {
        await StorageManager.CurrentService.Delete("${table.name}", item.${pkPascal});
        await LoadItems();
    }

    public void Dispose()
    {
        StorageManager.OnStorageChanged -= HandleStorageChanged;
    }
}
`;
    files.push({ name: `${className}List.razor`, path: `${root}/Pages/${className}List.razor`, content: pageContent, language: 'razor' });
  });

  // Queries.razor (Abfragen)
  const queriesPage = `@page "/queries"
${useAuth ? '@attribute [Authorize]' : ''}
@inject StorageServiceManager StorageManager
@inject ApiService ApiService
@inject IJSRuntime JS

<MudContainer MaxWidth="MaxWidth.ExtraLarge" Class="py-4">
    <MudText Typo="Typo.h4" Color="Color.Primary" Class="font-weight-bold mb-1">
        <MudIcon Icon="@Icons.Material.Filled.Search" Class="mr-2" />Abfragen
    </MudText>
    <MudText Typo="Typo.body2" Color="Color.Secondary" Class="mb-4">Führen Sie gezielte Datenabfragen aus oder filtern Sie Ihre Tabellen.</MudText>

    <MudGrid>
        <MudItem xs="12" md="4" Class="no-print">
            <MudPaper Elevation="2" Class="pa-4">
                <MudText Typo="Typo.h6" Class="font-weight-bold mb-3">Verfügbare Abfragen</MudText>
                <MudList T="string" Clickable="true" Dense="true">
                    ${queries.length > 0 ? queries.map((q, idx) => `
                    <MudListItem Icon="@Icons.Material.Filled.ListAlt" OnClick='() => SelectQuery(${idx}, "${q.name.replace(/'/g, "\\'")}")'>
                        <MudText Typo="Typo.subtitle2">${q.name}</MudText>
                        <MudText Typo="Typo.caption" Color="Color.Secondary">Typ: ${q.type || 'SELECT'}</MudText>
                    </MudListItem>
                    `).join('') : tables.map(t => `
                    <MudListItem Icon="@Icons.Material.Filled.TableChart" OnClick='() => SelectTableQuery("${t.name}")'>
                        <MudText Typo="Typo.subtitle2">Alle ${t.name}</MudText>
                        <MudText Typo="Typo.caption" Color="Color.Secondary">Standardabfrage für ${t.name}</MudText>
                    </MudListItem>
                    `).join('')}
                </MudList>
            </MudPaper>
        </MudItem>

        <MudItem xs="12" md="8">
            <MudPaper Elevation="2" Class="pa-4 printable-report">
                <div class="d-flex justify-space-between align-center mb-4 no-print">
                    <MudText Typo="Typo.h6" Class="font-weight-bold">@selectedQueryTitle</MudText>
                    <MudButton Variant="Variant.Filled" Color="Color.Primary" StartIcon="@Icons.Material.Filled.PlayArrow" OnClick="RunQuery">Abfrage ausführen</MudButton>
                </div>

                @if (isLoading)
                {
                    <div class="d-flex justify-center pa-6">
                        <MudProgressCircular Color="Color.Primary" Indeterminate="true" />
                    </div>
                }
                else
                {
                    <MudAlert Severity="Severity.Normal" Class="mb-4 no-print" Variant="Variant.Outlined">
                        <b>SQL Preview:</b> <code>@generatedSql</code>
                    </MudAlert>

                    @if (queryResults != null && queryResults.Any())
                    {
                        <div class="d-flex flex-wrap gap-2 mb-3 no-print">
                            <MudText Typo="Typo.subtitle2" Class="align-self-center mr-2"><b>Exportieren:</b></MudText>
                            <MudButton Variant="Variant.Outlined" Color="Color.Primary" Size="Size.Small" StartIcon="@Icons.Material.Filled.Print" OnClick="PrintExport">PDF / Drucken</MudButton>
                            <MudButton Variant="Variant.Outlined" Color="Color.Success" Size="Size.Small" StartIcon="@Icons.Material.Filled.TableChart" OnClick="ExportXlsx">Excel (.xlsx)</MudButton>
                            <MudButton Variant="Variant.Outlined" Color="Color.Info" Size="Size.Small" StartIcon="@Icons.Material.Filled.FileDownload" OnClick="ExportCsv">CSV</MudButton>
                            <MudButton Variant="Variant.Outlined" Color="Color.Warning" Size="Size.Small" StartIcon="@Icons.Material.Filled.Code" OnClick="ExportXml">XML</MudButton>
                            <MudButton Variant="Variant.Outlined" Color="Color.Dark" Size="Size.Small" StartIcon="@Icons.Material.Filled.DataObject" OnClick="ExportJson">JSON</MudButton>
                        </div>

                        <MudSimpleTable Style="overflow-x: auto; max-height: 500px;">
                            <thead>
                                <tr>
                                    @foreach (var key in queryResults.First().Keys)
                                    {
                                        <th>@key</th>
                                    }
                                </tr>
                            </thead>
                            <tbody>
                                @foreach (var row in queryResults)
                                {
                                    <tr>
                                        @foreach (var val in row.Values)
                                        {
                                            <td>@(val?.ToString() ?? "-")</td>
                                        }
                                    </tr>
                                }
                            </tbody>
                        </MudSimpleTable>
                    }
                    else
                    {
                        <div class="pa-6 text-center text-secondary">
                            <MudIcon Icon="@Icons.Material.Filled.Inbox" Size="Size.Large" Class="mb-2" />
                            <MudText>Keine Daten für diese Abfrage vorhanden (@resultCount Datensätze)</MudText>
                        </div>
                    }
                }
            </MudPaper>
        </MudItem>
    </MudGrid>
</MudContainer>

@code {
    private string selectedQueryTitle = "Standard-Abfrage";
    private string selectedTableName = "";
    private string generatedSql = "SELECT * FROM System_Tables;";
    private int resultCount = 0;
    private bool isLoading = false;
    private List<Dictionary<string, object>>? queryResults;

    protected override async Task OnInitializedAsync()
    {
        ${queries.length > 0 ? `await SelectQuery(0, "${queries[0].name.replace(/'/g, "\\'")}");` : tables.length > 0 ? `await SelectTableQuery("${tables[0].name.replace(/'/g, "\\'")}");` : ''}
    }

    private async Task RunQuery()
    {
        isLoading = true;
        StateHasChanged();
        try
        {
            var target = !string.IsNullOrEmpty(selectedTableName) ? selectedTableName : "${tables.length > 0 ? tables[0].name : ''}";
            if (!string.IsNullOrEmpty(target))
            {
                queryResults = await StorageManager.CurrentService.GetAll<Dictionary<string, object>>(target);
                if ((queryResults == null || !queryResults.Any()) && ApiService != null)
                {
                    queryResults = await ApiService.GetAll<Dictionary<string, object>>(target);
                }
            }
            else
            {
                queryResults = new List<Dictionary<string, object>>();
            }
            resultCount = queryResults?.Count ?? 0;
        }
        catch
        {
            queryResults = new List<Dictionary<string, object>>();
            resultCount = 0;
        }
        finally
        {
            isLoading = false;
            StateHasChanged();
        }
    }

    private async Task SelectTableQuery(string tableName)
    {
        selectedTableName = tableName;
        selectedQueryTitle = $"Abfrage: {tableName}";
        generatedSql = $"SELECT * FROM [{tableName}] ORDER BY 1 DESC;";
        await RunQuery();
    }

    private async Task SelectQuery(int index, string queryName)
    {
        selectedTableName = queryName;
        selectedQueryTitle = "Abfrage: " + queryName;
        generatedSql = $"SELECT * FROM [{queryName}];";
        await RunQuery();
    }

    private async Task PrintExport()
    {
        await JS.InvokeVoidAsync("window.print");
    }

    private async Task ExportCsv()
    {
        if (queryResults == null || !queryResults.Any()) return;
        var name = string.IsNullOrWhiteSpace(selectedTableName) ? "Abfrage" : selectedTableName;
        var filename = name + "_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".csv";
        var keys = queryResults.First().Keys.ToList();
        var sb = new System.Text.StringBuilder();
        sb.Append("\uFEFF");
        var q = "\\\"";
        var headerCols = keys.Select(k => q + k.Replace(q, q + q) + q);
        sb.AppendLine(string.Join(";", headerCols));
        foreach (var row in queryResults)
        {
            var rowCols = keys.Select(k => {
                var val = row.ContainsKey(k) && row[k] != null ? row[k].ToString() : "";
                return q + (val ?? "").Replace(q, q + q) + q;
            });
            sb.AppendLine(string.Join(";", rowCols));
        }
        await JS.InvokeVoidAsync("exportFile", filename, sb.ToString(), "text/csv;charset=utf-8");
    }

    private async Task ExportJson()
    {
        if (queryResults == null || !queryResults.Any()) return;
        var name = string.IsNullOrWhiteSpace(selectedTableName) ? "Abfrage" : selectedTableName;
        var filename = name + "_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".json";
        var jsonContent = System.Text.Json.JsonSerializer.Serialize(queryResults, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
        await JS.InvokeVoidAsync("exportFile", filename, jsonContent, "application/json;charset=utf-8");
    }

    private async Task ExportXml()
    {
        if (queryResults == null || !queryResults.Any()) return;
        var name = string.IsNullOrWhiteSpace(selectedTableName) ? "Abfrage" : selectedTableName;
        var filename = name + "_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".xml";
        var q = "\\\"";
        var lt = "<";
        var gt = ">";
        var sb = new System.Text.StringBuilder();
        sb.AppendLine(lt + "?xml version=" + q + "1.0" + q + " encoding=" + q + "utf-8" + q + "?" + gt);
        sb.AppendLine(lt + "AbfrageDaten" + gt);
        foreach (var row in queryResults)
        {
            sb.AppendLine("  " + lt + "Eintrag" + gt);
            foreach (var kvp in row)
            {
                var cleanKey = System.Text.RegularExpressions.Regex.Replace(kvp.Key, "[^a-zA-Z0-9_]", "_");
                if (string.IsNullOrWhiteSpace(cleanKey)) cleanKey = "Feld";
                var val = System.Security.SecurityElement.Escape(kvp.Value?.ToString() ?? "");
                sb.AppendLine("    " + lt + cleanKey + gt + val + lt + "/" + cleanKey + gt);
            }
            sb.AppendLine("  " + lt + "/Eintrag" + gt);
        }
        sb.AppendLine(lt + "/AbfrageDaten" + gt);
        await JS.InvokeVoidAsync("exportFile", filename, sb.ToString(), "application/xml;charset=utf-8");
    }

    private async Task ExportXlsx()
    {
        if (queryResults == null || !queryResults.Any()) return;
        var name = string.IsNullOrWhiteSpace(selectedTableName) ? "Abfrage" : selectedTableName;
        var filename = name + "_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".xls";
        var keys = queryResults.First().Keys.ToList();
        var q = "\\\"";
        var lt = "<";
        var gt = ">";
        var sb = new System.Text.StringBuilder();
        sb.AppendLine(lt + "?xml version=" + q + "1.0" + q + "?" + gt);
        sb.AppendLine(lt + "?mso-application progid=" + q + "Excel.Sheet" + q + "?" + gt);
        sb.AppendLine(lt + "Workbook xmlns=" + q + "urn:schemas-microsoft-com:office:spreadsheet" + q + " xmlns:ss=" + q + "urn:schemas-microsoft-com:office:spreadsheet" + q + gt);
        sb.AppendLine(" " + lt + "Worksheet ss:Name=" + q + "Export" + q + gt);
        sb.AppendLine("  " + lt + "Table" + gt);
        sb.AppendLine("   " + lt + "Row" + gt);
        foreach (var k in keys)
        {
            sb.AppendLine("    " + lt + "Cell" + gt + lt + "Data ss:Type=" + q + "String" + q + gt + System.Security.SecurityElement.Escape(k) + lt + "/Data" + gt + lt + "/Cell" + gt);
        }
        sb.AppendLine("   " + lt + "/Row" + gt);
        foreach (var row in queryResults)
        {
            sb.AppendLine("   " + lt + "Row" + gt);
            foreach (var k in keys)
            {
                var val = row.ContainsKey(k) && row[k] != null ? row[k].ToString() : "";
                sb.AppendLine("    " + lt + "Cell" + gt + lt + "Data ss:Type=" + q + "String" + q + gt + System.Security.SecurityElement.Escape(val ?? "") + lt + "/Data" + gt + lt + "/Cell" + gt);
            }
            sb.AppendLine("   " + lt + "/Row" + gt);
        }
        sb.AppendLine("  " + lt + "/Table" + gt);
        sb.AppendLine(" " + lt + "/Worksheet" + gt);
        sb.AppendLine(lt + "/Workbook" + gt);
        await JS.InvokeVoidAsync("exportFile", filename, sb.ToString(), "application/vnd.ms-excel;charset=utf-8");
    }
}
`;
  files.push({ name: 'Queries.razor', path: `${root}/Pages/Queries.razor`, content: queriesPage, language: 'razor' });

  // Reports.razor (Berichte)
  const reportsPage = `@page "/reports"
${useAuth ? '@attribute [Authorize]' : ''}
@inject StorageServiceManager StorageManager
@inject ApiService ApiService
@inject IJSRuntime JS

<style>
@@media print {
    .mud-drawer-provider, .mud-drawer, .mud-drawer-responsive, .mud-appbar, .sidebar, .top-row, nav, header, aside, .no-print, button, .mud-button-root, .btn {
        display: none !important;
        visibility: hidden !important;
    }
    body, .mud-layout, .mud-main-content, .mud-container {
        background: white !important;
        color: black !important;
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
    }
    .printable-report {
        display: block !important;
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 !important;
    }
}
</style>

<MudContainer MaxWidth="MaxWidth.ExtraLarge" Class="py-4">
    <div class="d-flex justify-space-between align-center mb-4 no-print">
        <div>
            <MudText Typo="Typo.h4" Color="Color.Primary" Class="font-weight-bold mb-1">
                <MudIcon Icon="@Icons.Material.Filled.Assessment" Class="mr-2" />Berichte &amp; Analysen
            </MudText>
            <MudText Typo="Typo.body2" Color="Color.Secondary">Generieren und exportieren Sie Auswertungen Ihrer Unternehmensdaten in verschiedenen Formaten.</MudText>
        </div>
        <div class="d-flex flex-wrap align-center gap-2">
            <MudButton Variant="Variant.Filled" Color="Color.Primary" StartIcon="@Icons.Material.Filled.Print" OnClick="PrintReport">PDF / Drucken</MudButton>
            <MudButton Variant="Variant.Outlined" Color="Color.Success" StartIcon="@Icons.Material.Filled.TableChart" OnClick="ExportXlsx">Excel (.xlsx)</MudButton>
            <MudButton Variant="Variant.Outlined" Color="Color.Info" StartIcon="@Icons.Material.Filled.FileDownload" OnClick="ExportCsv">CSV</MudButton>
            <MudButton Variant="Variant.Outlined" Color="Color.Warning" StartIcon="@Icons.Material.Filled.Code" OnClick="ExportXml">XML</MudButton>
            <MudButton Variant="Variant.Outlined" Color="Color.Dark" StartIcon="@Icons.Material.Filled.DataObject" OnClick="ExportJson">JSON</MudButton>
        </div>
    </div>

    <MudGrid Class="mb-4 no-print">
        ${tables.map(t => `
        <MudItem xs="12" sm="6" md="4">
            <MudCard Elevation="2" Class="h-100">
                <MudCardContent>
                    <div class="d-flex align-center gap-2 mb-2">
                        <MudIcon Icon="@Icons.Material.Filled.InsertDriveFile" Color="Color.Primary" Size="Size.Medium" />
                        <MudText Typo="Typo.h6" Class="font-weight-bold">${t.name} Übersicht</MudText>
                    </div>
                    <MudText Typo="Typo.body2" Color="Color.Secondary" Class="mb-3">
                        Detaillierter Auswertungsbericht mit Zusammenfassungen aller Felder der Tabelle <b>${t.name}</b>.
                    </MudText>
                </MudCardContent>
                <MudCardActions>
                    <MudButton Variant="Variant.Outlined" Color="Color.Primary" FullWidth="true" OnClick='() => GenerateReport("${t.name}")'>
                        Bericht anzeigen
                    </MudButton>
                </MudCardActions>
            </MudCard>
        </MudItem>
        `).join('')}
    </MudGrid>

    @if (!string.IsNullOrEmpty(activeReportName))
    {
        <MudPaper Elevation="3" Class="pa-6 mt-4 printable-report">
            <div class="d-flex justify-space-between align-center mb-4 pb-3 border-bottom">
                <div>
                    <MudText Typo="Typo.h5" Color="Color.Primary" Class="font-weight-bold">${config.projectName} - Bericht: @activeReportName</MudText>
                    <MudText Typo="Typo.caption" Color="Color.Secondary">Generiert am: @DateTime.Now.ToString("dd.MM.yyyy HH:mm")</MudText>
                </div>
                <MudChip T="string" Color="Color.Success" Variant="Variant.Filled">Status: Generiert</MudChip>
            </div>

            @if (isLoadingReport)
            {
                <div class="d-flex justify-center pa-6">
                    <MudProgressCircular Color="Color.Primary" Indeterminate="true" />
                </div>
            }
            else
            {
                <MudAlert Severity="Severity.Info" Class="mb-4 no-print" Variant="Variant.Outlined">
                    Zusammenfassung: Insgesammt <b>@reportCount</b> Datensätze in der Tabelle <b>@activeReportName</b> geladen.
                </MudAlert>

                @if (activeReportData != null && activeReportData.Any())
                {
                    <MudSimpleTable Style="overflow-x: auto;">
                        <thead>
                            <tr>
                                @foreach (var key in activeReportData.First().Keys)
                                {
                                    <th>@key</th>
                                }
                            </tr>
                        </thead>
                        <tbody>
                            @foreach (var row in activeReportData.Take(25))
                            {
                                <tr>
                                    @foreach (var val in row.Values)
                                    {
                                        <td>@(val?.ToString() ?? "-")</td>
                                    }
                                </tr>
                            }
                        </tbody>
                    </MudSimpleTable>
                }
            }
        </MudPaper>
    }
</MudContainer>

@code {
    private string activeReportName = "";
    private int reportCount = 0;
    private List<Dictionary<string, object>>? activeReportData;
    private bool isLoadingReport = false;

    protected override async Task OnInitializedAsync()
    {
        if (${tables.length > 0 ? 'true' : 'false'})
        {
            await GenerateReport("${tables[0]?.name || ''}");
        }
    }

    private async Task GenerateReport(string tableName)
    {
        activeReportName = tableName;
        isLoadingReport = true;
        try
        {
            activeReportData = await StorageManager.CurrentService.GetAll<Dictionary<string, object>>(tableName);
            if ((activeReportData == null || !activeReportData.Any()) && ApiService != null)
            {
                activeReportData = await ApiService.GetAll<Dictionary<string, object>>(tableName);
            }
            reportCount = activeReportData?.Count ?? 0;
        }
        catch
        {
            activeReportData = new List<Dictionary<string, object>>();
            reportCount = 0;
        }
        finally
        {
            isLoadingReport = false;
        }
    }

    private async Task EnsureReportLoaded()
    {
        if (string.IsNullOrEmpty(activeReportName) && ${tables.length > 0 ? 'true' : 'false'})
        {
            await GenerateReport("${tables[0]?.name || ''}");
        }
    }

    private async Task PrintReport()
    {
        await EnsureReportLoaded();
        await JS.InvokeVoidAsync("window.print");
    }

    private async Task ExportCsv()
    {
        await EnsureReportLoaded();
        if (activeReportData == null || !activeReportData.Any()) return;
        var filename = "Bericht_" + activeReportName + "_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".csv";
        var keys = activeReportData.First().Keys.ToList();
        var sb = new System.Text.StringBuilder();
        sb.Append("\uFEFF");
        var q = "\\\"";
        var headerCols = keys.Select(k => q + k.Replace(q, q + q) + q);
        sb.AppendLine(string.Join(";", headerCols));
        foreach (var row in activeReportData)
        {
            var rowCols = keys.Select(k => {
                var val = row.ContainsKey(k) && row[k] != null ? row[k].ToString() : "";
                return q + (val ?? "").Replace(q, q + q) + q;
            });
            sb.AppendLine(string.Join(";", rowCols));
        }
        await JS.InvokeVoidAsync("exportFile", filename, sb.ToString(), "text/csv;charset=utf-8");
    }

    private async Task ExportJson()
    {
        await EnsureReportLoaded();
        if (activeReportData == null || !activeReportData.Any()) return;
        var filename = "Bericht_" + activeReportName + "_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".json";
        var jsonContent = System.Text.Json.JsonSerializer.Serialize(activeReportData, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
        await JS.InvokeVoidAsync("exportFile", filename, jsonContent, "application/json;charset=utf-8");
    }

    private async Task ExportXml()
    {
        await EnsureReportLoaded();
        if (activeReportData == null || !activeReportData.Any()) return;
        var filename = "Bericht_" + activeReportName + "_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".xml";
        var q = "\\\"";
        var lt = "<";
        var gt = ">";
        var sb = new System.Text.StringBuilder();
        sb.AppendLine(lt + "?xml version=" + q + "1.0" + q + " encoding=" + q + "utf-8" + q + "?" + gt);
        sb.AppendLine(lt + "BerichtsDaten" + gt);
        foreach (var row in activeReportData)
        {
            sb.AppendLine("  " + lt + "Eintrag" + gt);
            foreach (var kvp in row)
            {
                var cleanKey = System.Text.RegularExpressions.Regex.Replace(kvp.Key, "[^a-zA-Z0-9_]", "_");
                if (string.IsNullOrWhiteSpace(cleanKey)) cleanKey = "Feld";
                var val = System.Security.SecurityElement.Escape(kvp.Value?.ToString() ?? "");
                sb.AppendLine("    " + lt + cleanKey + gt + val + lt + "/" + cleanKey + gt);
            }
            sb.AppendLine("  " + lt + "/Eintrag" + gt);
        }
        sb.AppendLine(lt + "/BerichtsDaten" + gt);
        await JS.InvokeVoidAsync("exportFile", filename, sb.ToString(), "application/xml;charset=utf-8");
    }

    private async Task ExportXlsx()
    {
        await EnsureReportLoaded();
        if (activeReportData == null || !activeReportData.Any()) return;
        var filename = "Bericht_" + activeReportName + "_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".xls";
        var keys = activeReportData.First().Keys.ToList();
        var q = "\\\"";
        var lt = "<";
        var gt = ">";
        var sb = new System.Text.StringBuilder();
        sb.AppendLine(lt + "?xml version=" + q + "1.0" + q + "?" + gt);
        sb.AppendLine(lt + "?mso-application progid=" + q + "Excel.Sheet" + q + "?" + gt);
        sb.AppendLine(lt + "Workbook xmlns=" + q + "urn:schemas-microsoft-com:office:spreadsheet" + q + " xmlns:ss=" + q + "urn:schemas-microsoft-com:office:spreadsheet" + q + gt);
        sb.AppendLine(" " + lt + "Worksheet ss:Name=" + q + "Export" + q + gt);
        sb.AppendLine("  " + lt + "Table" + gt);
        sb.AppendLine("   " + lt + "Row" + gt);
        foreach (var k in keys)
        {
            sb.AppendLine("    " + lt + "Cell" + gt + lt + "Data ss:Type=" + q + "String" + q + gt + System.Security.SecurityElement.Escape(k) + lt + "/Data" + gt + lt + "/Cell" + gt);
        }
        sb.AppendLine("   " + lt + "/Row" + gt);
        foreach (var row in activeReportData)
        {
            sb.AppendLine("   " + lt + "Row" + gt);
            foreach (var k in keys)
            {
                var val = row.ContainsKey(k) && row[k] != null ? row[k].ToString() : "";
                sb.AppendLine("    " + lt + "Cell" + gt + lt + "Data ss:Type=" + q + "String" + q + gt + System.Security.SecurityElement.Escape(val ?? "") + lt + "/Data" + gt + lt + "/Cell" + gt);
            }
            sb.AppendLine("   " + lt + "/Row" + gt);
        }
        sb.AppendLine("  " + lt + "/Table" + gt);
        sb.AppendLine(" " + lt + "/Worksheet" + gt);
        sb.AppendLine(lt + "/Workbook" + gt);
        await JS.InvokeVoidAsync("exportFile", filename, sb.ToString(), "application/vnd.ms-excel;charset=utf-8");
    }
}
`;
  files.push({ name: 'Reports.razor', path: `${root}/Pages/Reports.razor`, content: reportsPage, language: 'razor' });

  return files;
};

