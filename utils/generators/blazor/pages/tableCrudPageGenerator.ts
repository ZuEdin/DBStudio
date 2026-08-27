import { Table, VirtualFile, Relationship, Field } from '../../../../types/index';
import { toPascalCase, toCamelCase, findTargetTable } from '../../common';
import { getFKTableInfo } from './fkHelper';

export const generateTableCrudPages = (
  tables: Table[],
  namespace: string,
  root: string,
  useAuth: boolean = false,
  relationships: Relationship[] = []
): VirtualFile[] => {
  const files: VirtualFile[] = [];

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

  return files;
};
