import { Table, Query, Report, BackendConfig, VirtualFile, Relationship, Field } from '../../../types/index';
import { toPascalCase, toCamelCase, findTargetTable } from '../common';

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

export const generateBlazorPages = (
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
  files.push({ name: 'Index.razor', path: `${root}/Pages/Index.razor`, content: indexRazor, language: 'razor' });

  // 2. CRUD Pages for each table
  tables.forEach(table => {
    const className = toPascalCase(table.name);
    const isSystem = table.name.startsWith('sys_');
    let attributes = '';
    if (useAuth) {
      attributes = isSystem ? '@attribute [Authorize(Roles = "Admin")]' : '@attribute [Authorize]';
    }

    let tableHeaders = '';
    let tableRows = '';
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
      const propName = toPascalCase(f.name);
      const fkMatch = fkLookups.find(x => x.field.name === f.name);

      if (fkMatch) {
        const targetInfo = getFKTableInfo(fkMatch.targetTable);
        tableHeaders += `                        <th scope="col" class="fw-semibold text-secondary">${propName} (${fkMatch.targetTable.name})</th>\n`;
        tableRows += `                        <td>@Get${targetInfo.className}Display(item.${propName})</td>\n`;
      } else {
        tableHeaders += `                        <th scope="col" class="fw-semibold text-secondary">${propName}</th>\n`;

        if (f.type === 'BOOLEAN') {
          tableRows += `                        <td>
                            @if (item.${propName} == true)
                            {
                                <span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-lg"></i> Ja</span>
                            }
                            else
                            {
                                <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle"><i class="bi bi-x-lg"></i> Nein</span>
                            }
                        </td>\n`;
        } else if (f.type === 'DATE' || f.type === 'DATETIME') {
          tableRows += `                        <td>@(item.${propName}?.ToString("dd.MM.yyyy") ?? "-")</td>\n`;
        } else {
          tableRows += `                        <td>@item.${propName}</td>\n`;
        }
      }

      if (f.isPrimaryKey) {
        formFields += `                    <div class="mb-3">
                        <label class="form-label text-secondary small fw-bold">${propName} (Primärschlüssel)</label>
                        <input type="text" class="form-control bg-light" value="@(activeItem.${propName} == 0 ? "Wird automatisch generiert" : activeItem.${propName}.ToString())" disabled />
                    </div>\n`;
      } else if (fkMatch) {
        const targetInfo = getFKTableInfo(fkMatch.targetTable);
        formFields += `                    <div class="mb-3">
                        <label class="form-label text-secondary small fw-bold">${propName} (${fkMatch.targetTable.name})</label>
                        <select class="form-select" @bind="activeItem.${propName}">
                            <option value="">-- Bitte ${fkMatch.targetTable.name} auswählen --</option>
                            @if (${targetInfo.camelName}LookupList != null)
                            {
                                @foreach (var fkItem in ${targetInfo.camelName}LookupList)
                                {
                                    var fkId = fkItem.${targetInfo.pkProp};
                                    var fkLabel = fkItem.${targetInfo.labelProp}?.ToString() ?? "";
                                    <option value="@fkId">@(string.IsNullOrWhiteSpace(fkLabel) ? $"ID: {fkId}" : $"{fkLabel} (ID: {fkId})")</option>
                                }
                            }
                        </select>
                    </div>\n`;
      } else {
        if (f.type === 'BOOLEAN') {
          formFields += `                    <div class="mb-3 form-check form-switch">
                        <InputCheckbox id="${f.name}" class="form-check-input" @bind-Value="activeItem.${propName}" />
                        <label for="${f.name}" class="form-check-label fw-medium">${propName}</label>
                    </div>\n`;
        } else if (f.type === 'INTEGER' || f.type === 'DOUBLE' || f.type === 'DECIMAL' || f.type === 'FLOAT') {
          formFields += `                    <div class="mb-3">
                        <label class="form-label text-secondary small fw-bold">${propName}</label>
                        <InputNumber class="form-control" @bind-Value="activeItem.${propName}" placeholder="0" />
                    </div>\n`;
        } else if (f.type === 'DATE' || f.type === 'DATETIME') {
          formFields += `                    <div class="mb-3">
                        <label class="form-label text-secondary small fw-bold">${propName}</label>
                        <InputDate class="form-control" @bind-Value="activeItem.${propName}" />
                    </div>\n`;
        } else {
          formFields += `                    <div class="mb-3">
                        <label class="form-label text-secondary small fw-bold">${propName}</label>
                        <InputText class="form-control" @bind-Value="activeItem.${propName}" placeholder="${propName} eingeben" />
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

<div class="container-fluid py-2">
    <!-- Header & Action Bar -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
            <div class="d-flex align-items-center gap-2">
                <a href="" class="btn btn-outline-secondary btn-sm"><i class="bi bi-arrow-left"></i></a>
                <h2 class="fw-bold text-slate-800 mb-0">${table.name}</h2>
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle ms-2">
                    @(items?.Count ?? 0) Datensätze
                </span>
            </div>
            <p class="text-secondary small mb-0 mt-1">
                Verwaltung und Echtzeit-Bearbeitung von <b>${table.name}</b> (Quelle: <b>@StorageManager.CurrentService.BackendName</b>)
            </p>
        </div>
        <div class="d-flex align-items-center gap-2">
            <div class="input-group input-group-sm" style="max-width: 250px;">
                <span class="input-group-text bg-white"><i class="bi bi-search text-secondary"></i></span>
                <input type="text" class="form-control" placeholder="Suchen..." @bind="searchTerm" @bind:event="oninput" />
            </div>
            <button class="btn btn-primary btn-sm px-3 shadow-sm d-flex align-items-center gap-1" @onclick="OpenAddModal">
                <i class="bi bi-plus-lg"></i>
                <span>Neuer Eintrag</span>
            </button>
        </div>
    </div>

    <!-- Data Table Card -->
    <div class="card shadow-sm border-0 rounded-3 overflow-hidden">
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light border-bottom">
                        <tr>
${tableHeaders}
                            <th scope="col" class="text-end fw-semibold text-secondary" style="width: 140px;">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        @if (isLoading)
                        {
                            <tr>
                                <td colspan="${table.fields.length + 1}" class="text-center py-5">
                                    <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
                                    <span class="ms-2 text-secondary">Lade Daten aus <b>@StorageManager.CurrentService.BackendName</b>...</span>
                                </td>
                            </tr>
                        }
                        else if (FilteredItems == null || !FilteredItems.Any())
                        {
                            <tr>
                                <td colspan="${table.fields.length + 1}" class="text-center py-5 text-secondary">
                                    <div class="py-3">
                                        <i class="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                                        @if (!string.IsNullOrWhiteSpace(searchTerm))
                                        {
                                            <span>Keine Treffer für die Suche nach "<b>@searchTerm</b>".</span>
                                        }
                                        else
                                        {
                                            <span>Keine Datensätze vorhanden. Klicken Sie auf <b>"Neuer Eintrag"</b>, um Daten zu erfassen.</span>
                                        }
                                    </div>
                                </td>
                            </tr>
                        }
                        else
                        {
                            @foreach (var item in FilteredItems)
                            {
                                <tr>
${tableRows}
                                    <td class="text-end">
                                        <button class="btn btn-sm btn-outline-secondary me-1" title="Bearbeiten" @onclick="() => OpenEditModal(item)">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" title="Löschen" @onclick="() => DeleteItem(item)">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            }
                        }
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Modal Dialog (Add / Edit) -->
@if (showModal)
{
    <div class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content shadow-lg border-0">
                <div class="modal-header bg-light">
                    <h5 class="modal-title fw-bold text-slate-800">
                        <i class="bi @(isEditMode ? "bi-pencil-square" : "bi-plus-circle") me-2 text-primary"></i>
                        @(isEditMode ? "Eintrag bearbeiten" : "Neuer Eintrag")
                    </h5>
                    <button type="button" class="btn-close" @onclick="CloseModal"></button>
                </div>
                <EditForm Model="activeItem" OnValidSubmit="SaveItem">
                    <div class="modal-body py-4">
                        <DataAnnotationsValidator />
                        <ValidationSummary class="alert alert-danger" />
                        
${formFields}
                    </div>
                    <div class="modal-footer bg-light">
                        <button type="button" class="btn btn-outline-secondary" @onclick="CloseModal">Abbrechen</button>
                        <button type="submit" class="btn btn-primary px-4 fw-semibold">
                            <i class="bi bi-check-lg me-1"></i> Speichern
                        </button>
                    </div>
                </EditForm>
            </div>
        </div>
    </div>
}

@code {
    private List<${className}>? items;
    private ${className} activeItem = new();
    private bool showModal = false;
    private bool isEditMode = false;
    private bool isLoading = true;
    private string searchTerm = "";

${uniqueTargetTables.map(t => {
  const info = getFKTableInfo(t);
  return `    private List<${info.className}>? ${info.camelName}LookupList;`;
}).join('\n')}

    private IEnumerable<${className}> FilteredItems
    {
        get
        {
            if (items == null) return Enumerable.Empty<${className}>();
            if (string.IsNullOrWhiteSpace(searchTerm)) return items;

            return items.Where(i =>
            {
                var search = searchTerm.Trim();
                foreach (var prop in typeof(${className}).GetProperties())
                {
                    var val = prop.GetValue(i)?.ToString();
                    if (val != null && val.Contains(search, StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }
                }
                return false;
            });
        }
    }

    protected override async Task OnInitializedAsync()
    {
        StorageManager.OnStorageChanged += HandleStorageChanged;
        await LoadData();
    }

    private async void HandleStorageChanged()
    {
        await InvokeAsync(async () =>
        {
            await LoadData();
            StateHasChanged();
        });
    }

    private async Task LoadData()
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
        catch
        {
            items = new List<${className}>();
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

    private void OpenAddModal()
    {
        activeItem = new ${className}();
        isEditMode = false;
        showModal = true;
    }

    private void OpenEditModal(${className} item)
    {
        activeItem = new ${className}();
        foreach (var prop in typeof(${className}).GetProperties())
        {
            prop.SetValue(activeItem, prop.GetValue(item));
        }
        isEditMode = true;
        showModal = true;
    }

    private void CloseModal()
    {
        showModal = false;
    }

    private async Task SaveItem()
    {
        var service = StorageManager.CurrentService;
        if (isEditMode)
        {
            var idProp = typeof(${className}).GetProperty("Id") ?? typeof(${className}).GetProperty("id");
            var idVal = idProp?.GetValue(activeItem) ?? 0;
            await service.Update("${table.name}", idVal, activeItem);
        }
        else
        {
            await service.Add("${table.name}", activeItem);
        }

        CloseModal();
        await LoadData();
    }

    private async Task DeleteItem(${className} item)
    {
        var idProp = typeof(${className}).GetProperty("Id") ?? typeof(${className}).GetProperty("id");
        var idVal = idProp?.GetValue(item) ?? 0;
        await StorageManager.CurrentService.Delete("${table.name}", idVal);
        await LoadData();
    }

    public void Dispose()
    {
        StorageManager.OnStorageChanged -= HandleStorageChanged;
    }
}
`;
    files.push({
      name: `${className}List.razor`,
      path: `${root}/Pages/${className}List.razor`,
      content: pageContent,
      language: 'razor'
    });
  });

  // 3. Auth Pages
  if (useAuth) {
    // Login.razor
    const loginPage = `@page "/login"
@inject AuthService Auth
@inject NavigationManager Nav
@using ${namespace}.Models

<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-5 col-lg-4">
            <div class="card shadow-sm border-0 rounded-3">
                <div class="card-body p-4">
                    <div class="text-center mb-4">
                        <div class="bg-primary-subtle d-inline-block p-3 rounded-circle text-primary mb-2">
                            <i class="bi bi-person-lock fs-2"></i>
                        </div>
                        <h4 class="fw-bold text-slate-800">Anmeldung</h4>
                        <p class="text-secondary small">Melden Sie sich an, um fortzufahren.</p>
                    </div>

                    @if (!string.IsNullOrEmpty(errorMessage))
                    {
                        <div class="alert alert-danger py-2 small" role="alert">
                            @errorMessage
                        </div>
                    }

                    <EditForm Model="model" OnValidSubmit="DoLogin">
                        <DataAnnotationsValidator />
                        <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">Benutzername</label>
                            <InputText @bind-Value="model.Username" class="form-control" placeholder="Benutzername" />
                            <ValidationMessage For="@(() => model.Username)" class="text-danger small" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">Passwort</label>
                            <InputText @bind-Value="model.Password" type="password" class="form-control" placeholder="••••••••" />
                            <ValidationMessage For="@(() => model.Password)" class="text-danger small" />
                        </div>
                        <button class="btn btn-primary w-100 fw-semibold py-2 mt-2" type="submit" disabled="@isLoading">
                            @if (isLoading)
                            {
                                <span class="spinner-border spinner-border-sm me-2"></span>
                                <span>Anmelden...</span>
                            }
                            else
                            {
                                <span>Anmelden</span>
                            }
                        </button>
                    </EditForm>

                    <div class="mt-3 text-center">
                        <a href="forgot-password" class="small text-decoration-none">Passwort vergessen?</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

@code {
    private LoginModel model = new();
    private bool isLoading = false;
    private string errorMessage = "";

    private async Task DoLogin()
    {
        isLoading = true;
        errorMessage = "";
        try
        {
            var success = await Auth.Login(model);
            if (success)
            {
                Nav.NavigateTo("/");
            }
            else
            {
                errorMessage = "Ungültige Anmeldedaten.";
            }
        }
        catch (Exception ex)
        {
            errorMessage = $"Fehler beim Login: {ex.Message}";
        }
        finally
        {
            isLoading = false;
        }
    }
}
`;
    files.push({ name: 'Login.razor', path: `${root}/Pages/Login.razor`, content: loginPage, language: 'razor' });

    // Register.razor
    const registerPage = `@page "/register"
@inject AuthService Auth
@inject NavigationManager Nav
@using ${namespace}.Models

<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-5 col-lg-4">
            <div class="card shadow-sm border-0 rounded-3">
                <div class="card-body p-4">
                    <div class="text-center mb-4">
                        <h4 class="fw-bold text-slate-800">Konto registrieren</h4>
                        <p class="text-secondary small">Erstellen Sie ein neues Benutzerkonto.</p>
                    </div>

                    <EditForm Model="model" OnValidSubmit="DoRegister">
                        <DataAnnotationsValidator />
                        <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">Benutzername</label>
                            <InputText @bind-Value="model.Username" class="form-control" />
                            <ValidationMessage For="@(() => model.Username)" class="text-danger small" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">E-Mail</label>
                            <InputText @bind-Value="model.Email" class="form-control" />
                            <ValidationMessage For="@(() => model.Email)" class="text-danger small" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">Passwort</label>
                            <InputText @bind-Value="model.Password" type="password" class="form-control" />
                            <ValidationMessage For="@(() => model.Password)" class="text-danger small" />
                        </div>
                        <button class="btn btn-success w-100 fw-semibold py-2 mt-2" type="submit">Registrieren</button>
                    </EditForm>
                    <div class="mt-3 text-center">
                        <a href="login" class="small text-decoration-none">Bereits registriert? Zum Login</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

@code {
    private RegisterModel model = new();

    private async Task DoRegister()
    {
        var success = await Auth.Register(model);
        if (success)
        {
            Nav.NavigateTo("/login");
        }
    }
}
`;
    files.push({ name: 'Register.razor', path: `${root}/Pages/Register.razor`, content: registerPage, language: 'razor' });

    // ForgotPassword.razor
    const forgotPwPage = `@page "/forgot-password"
<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-5 col-lg-4">
            <div class="card shadow-sm border-0 rounded-3">
                <div class="card-body p-4 text-center">
                    <h4 class="fw-bold text-slate-800 mb-2">Passwort zurücksetzen</h4>
                    <p class="text-secondary small mb-4">Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen zu erhalten.</p>
                    <input type="email" class="form-control mb-3" placeholder="name@beispiel.de" />
                    <button class="btn btn-primary w-100 fw-semibold mb-3" @onclick="SendReset">Link senden</button>
                    <a href="login" class="small text-decoration-none d-block">Zurück zur Anmeldung</a>
                </div>
            </div>
        </div>
    </div>
</div>

@code {
    private void SendReset()
    {
        // Simulation reset
    }
}
`;
    files.push({ name: 'ForgotPassword.razor', path: `${root}/Pages/ForgotPassword.razor`, content: forgotPwPage, language: 'razor' });

    // Profile.razor
    const profilePage = `@page "/profile"
@attribute [Authorize]
@inject AuthService Auth
@using ${namespace}.Models

<div class="container py-3">
    <div class="row justify-content-center">
        <div class="col-md-6">
            <div class="card shadow-sm border-0 rounded-3">
                <div class="card-body p-4">
                    <h4 class="fw-bold text-slate-800 mb-3"><i class="bi bi-person-circle me-2 text-primary"></i>Mein Profil</h4>
                    <hr />
                    <h5 class="fw-bold text-secondary mb-3">Passwort ändern</h5>
                    
                    @if (isSuccess)
                    {
                        <div class="alert alert-success py-2 small">Passwort erfolgreich geändert!</div>
                    }

                    <EditForm Model="model" OnValidSubmit="ChangePw">
                        <DataAnnotationsValidator />
                        <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">Aktuelles Passwort</label>
                            <InputText @bind-Value="model.OldPassword" type="password" class="form-control" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-secondary small fw-bold">Neues Passwort</label>
                            <InputText @bind-Value="model.NewPassword" type="password" class="form-control" />
                        </div>
                        <button class="btn btn-primary fw-semibold" type="submit">Passwort speichern</button>
                    </EditForm>
                </div>
            </div>
        </div>
    </div>
</div>

@code {
    private ChangePasswordModel model = new();
    private bool isSuccess = false;

    private async Task ChangePw()
    {
        isSuccess = await Auth.ChangePassword(model);
    }
}
`;
    files.push({ name: 'Profile.razor', path: `${root}/Pages/Profile.razor`, content: profilePage, language: 'razor' });
  }

  // Queries.razor (Abfragen)
  const queriesPage = `@page "/queries"
${useAuth ? '@attribute [Authorize]' : ''}
@inject StorageServiceManager StorageManager
@inject IJSRuntime JS

<div class="container-fluid py-3">
    <div class="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
            <h3 class="fw-bold text-slate-800 mb-1"><i class="bi bi-search me-2 text-primary"></i>Abfragen</h3>
            <p class="text-secondary small mb-0">Führen Sie Datenabfragen aus oder filtern Sie Ihre Tabellen gezielt.</p>
        </div>
    </div>

    <div class="row">
        <div class="col-md-4 mb-4 no-print">
            <div class="card shadow-sm border-0 rounded-3">
                <div class="card-header bg-white py-3 fw-bold text-slate-800 border-bottom">
                    <i class="bi bi-list-nested me-2 text-primary"></i>Verfügbare Abfragen
                </div>
                <div class="list-group list-group-flush">
                    ${queries.length > 0 ? queries.map((q, idx) => `
                    <button class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3" @onclick="() => SelectQuery(${idx})">
                        <div>
                            <div class="fw-semibold text-slate-800">${q.name}</div>
                            <small class="text-muted">Typ: ${q.type || 'SELECT'}</small>
                        </div>
                        <i class="bi bi-chevron-right text-muted"></i>
                    </button>
                    `).join('') : tables.map(t => `
                    <button class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3" @onclick='() => SelectTableQuery("${t.name}")'>
                        <div>
                            <div class="fw-semibold text-slate-800">Alle ${t.name}</div>
                            <small class="text-muted">Standardabfrage für ${t.name}</small>
                        </div>
                        <i class="bi bi-chevron-right text-muted"></i>
                    </button>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="col-md-8 mb-4">
            <div class="card shadow-sm border-0 rounded-3 printable-report">
                <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom no-print">
                    <h5 class="fw-bold text-slate-800 mb-0">@selectedQueryTitle</h5>
                    <button class="btn btn-sm btn-outline-primary fw-semibold" @onclick="RunQuery"><i class="bi bi-play-fill me-1"></i>Abfrage ausführen</button>
                </div>
                <div class="card-body">
                    @if (isLoading)
                    {
                        <div class="text-center py-4">
                            <div class="spinner-border text-primary" role="status"></div>
                            <p class="text-secondary small mt-2">Lade Abfrageergebnisse...</p>
                        </div>
                    }
                    else
                    {
                        <div class="alert alert-light border mb-3 no-print">
                            <span class="badge bg-primary me-2">SQL Preview</span>
                            <code>@generatedSql</code>
                        </div>

                        @if (queryResults != null && queryResults.Any())
                        {
                            <div class="d-flex flex-wrap gap-2 mb-3 no-print">
                                <span class="fw-bold text-secondary small align-self-center me-2">Exportieren:</span>
                                <button class="btn btn-sm btn-outline-primary fw-semibold" @onclick="PrintExport"><i class="bi bi-printer me-1"></i> PDF / Drucken</button>
                                <button class="btn btn-sm btn-outline-success fw-semibold" @onclick="ExportXlsx"><i class="bi bi-file-earmark-excel me-1"></i> Excel (.xlsx)</button>
                                <button class="btn btn-sm btn-outline-info fw-semibold" @onclick="ExportCsv"><i class="bi bi-file-earmark-text me-1"></i> CSV</button>
                                <button class="btn btn-sm btn-outline-warning fw-semibold" @onclick="ExportXml"><i class="bi bi-file-earmark-code me-1"></i> XML</button>
                                <button class="btn btn-sm btn-outline-dark fw-semibold" @onclick="ExportJson"><i class="bi bi-code-square me-1"></i> JSON</button>
                            </div>

                            <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light sticky-top">
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
                                </table>
                            </div>
                        }
                        else
                        {
                            <div class="text-center py-4 text-muted">
                                <i class="bi bi-inbox fs-3 d-block mb-2"></i>
                                <span>Keine Daten für diese Abfrage vorhanden (@resultCount Datensätze)</span>
                            </div>
                        }
                    }
                </div>
            </div>
        </div>
    </div>
</div>

@code {
    private string selectedQueryTitle = "Standard-Abfrage";
    private string selectedTableName = "";
    private string generatedSql = "SELECT * FROM System_Tables;";
    private int resultCount = 0;
    private bool isLoading = false;
    private List<Dictionary<string, object>>? queryResults;

    private async Task RunQuery()
    {
        isLoading = true;
        try
        {
            if (!string.IsNullOrEmpty(selectedTableName))
            {
                queryResults = await StorageManager.CurrentService.GetAll<Dictionary<string, object>>(selectedTableName);
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
        }
    }

    private void SelectTableQuery(string tableName)
    {
        selectedTableName = tableName;
        selectedQueryTitle = $"Abfrage: {tableName}";
        generatedSql = $"SELECT * FROM [{tableName}] ORDER BY 1 DESC;";
        _ = RunQuery();
    }

    private void SelectQuery(int index)
    {
        selectedTableName = "";
        selectedQueryTitle = "Abfrage #" + (index + 1);
        generatedSql = "SELECT * FROM DataQuery WHERE Status = 'Active';";
        _ = RunQuery();
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
@inject IJSRuntime JS

<style>
@@media print {
    .sidebar, .top-row, nav, header, aside, .no-print, button, .btn {
        display: none !important;
        visibility: hidden !important;
    }
    body, .container-fluid {
        background: white !important;
        color: black !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
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

<div class="container-fluid py-3">
    <div class="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
            <h3 class="fw-bold text-slate-800 mb-1"><i class="bi bi-file-earmark-bar-graph me-2 text-primary"></i>Berichte &amp; Analysen</h3>
            <p class="text-secondary small mb-0">Generieren und exportieren Sie Auswertungen Ihrer Unternehmensdaten in verschiedenen Formaten.</p>
        </div>
        <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-primary btn-sm fw-semibold" @onclick="PrintReport"><i class="bi bi-printer me-1"></i> PDF / Drucken</button>
            <button class="btn btn-outline-success btn-sm fw-semibold" @onclick="ExportXlsx"><i class="bi bi-file-earmark-excel me-1"></i> Excel (.xlsx)</button>
            <button class="btn btn-outline-info btn-sm fw-semibold" @onclick="ExportCsv"><i class="bi bi-file-earmark-text me-1"></i> CSV</button>
            <button class="btn btn-outline-warning btn-sm fw-semibold" @onclick="ExportXml"><i class="bi bi-file-earmark-code me-1"></i> XML</button>
            <button class="btn btn-outline-dark btn-sm fw-semibold" @onclick="ExportJson"><i class="bi bi-code-square me-1"></i> JSON</button>
        </div>
    </div>

    <div class="row no-print">
        ${tables.map(t => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card shadow-sm border-0 h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center gap-2 mb-3">
                        <div class="bg-primary-subtle text-primary p-2 rounded">
                            <i class="bi bi-file-earmark-text fs-4"></i>
                        </div>
                        <div>
                            <h6 class="fw-bold text-slate-800 mb-0">${t.name} Übersicht</h6>
                            <small class="text-muted">Datenbericht für ${t.name}</small>
                        </div>
                    </div>
                    <p class="text-secondary small mb-3">
                        Detaillierter Auswertungsbericht mit Zusammenfassungen aller Felder der Tabelle <b>${t.name}</b>.
                    </p>
                    <button class="btn btn-outline-primary btn-sm w-100 fw-semibold" @onclick='() => GenerateReport("${t.name}")'>
                        <i class="bi bi-eye me-1"></i> Bericht anzeigen
                    </button>
                </div>
            </div>
        </div>
        `).join('')}
    </div>

    @if (!string.IsNullOrEmpty(activeReportName))
    {
        <div class="card shadow-sm border-0 rounded-3 mt-2 printable-report">
            <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
                <h5 class="fw-bold text-slate-800 mb-0"><i class="bi bi-file-earmark-pdf me-2 text-danger"></i>Bericht: @activeReportName</h5>
                <span class="badge bg-success-subtle text-success border border-success-subtle">Status: Generiert</span>
            </div>
            <div class="card-body p-4">
                <div class="d-flex justify-content-between mb-4 border-bottom pb-3">
                    <div>
                        <h4 class="fw-bold text-primary">${config.projectName}</h4>
                        <span class="text-muted small">Generiert am: @DateTime.Now.ToString("dd.MM.yyyy HH:mm")</span>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-light text-dark border">Datenquelle: @StorageManager.CurrentService.BackendName</span>
                    </div>
                </div>

                @if (isLoadingReport)
                {
                    <div class="text-center py-4">
                        <div class="spinner-border text-primary spinner-border-sm"></div>
                        <span class="ms-2 text-muted">Lade Daten für Bericht...</span>
                    </div>
                }
                else
                {
                    <div class="alert alert-info py-2 mb-3 no-print">
                        <b>Zusammenfassung:</b> Insgesammt <b>@reportCount</b> Datensätze in der Tabelle <b>@activeReportName</b> gefunden.
                    </div>

                    @if (activeReportData != null && activeReportData.Any())
                    {
                        <div class="table-responsive">
                            <table class="table table-bordered table-striped align-middle">
                                <thead class="table-dark">
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
                            </table>
                        </div>
                    }
                }
            </div>
        </div>
    }
</div>

@code {
    private string activeReportName = "";
    private int reportCount = 0;
    private List<Dictionary<string, object>>? activeReportData;
    private bool isLoadingReport = false;

    private async Task GenerateReport(string tableName)
    {
        activeReportName = tableName;
        isLoadingReport = true;
        try
        {
            activeReportData = await StorageManager.CurrentService.GetAll<Dictionary<string, object>>(tableName);
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
