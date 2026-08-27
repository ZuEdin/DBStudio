import { Table, VirtualFile, Relationship, Field } from '../../../../types/index';
import { toPascalCase, toCamelCase, resolveType, findTargetTable, isNullable } from '../../common';
import { getFKTableInfo } from '../pages/fkHelper';

export const generateMudBlazorTableCrudPages = (
  tables: Table[],
  namespace: string,
  root: string,
  useAuth: boolean = false,
  relationships: Relationship[] = []
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  tables.forEach(table => {
    const className = toPascalCase(table.name);
    const pkField = table.fields.find(f => f.isPrimaryKey)?.name || 'id';
    const pkPascal = toPascalCase(pkField);

    const isSysTable = table.name.startsWith('sys_');
    const attributes = useAuth && isSysTable ? '@attribute [Authorize(Roles = "Admin")]' : (useAuth ? '@attribute [Authorize]' : '');

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
                    <MudIconButton Icon="@Icons.Material.Filled.ArrowBack" Href="/" Size="Size.Small" />
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

  return files;
};
