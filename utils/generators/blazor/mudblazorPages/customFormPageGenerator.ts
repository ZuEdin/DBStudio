import { Form, Table, VirtualFile } from '../../../../types/index';
import { toPascalCase, toCamelCase } from '../../common';

interface ExtractedField {
  fieldId: string;
  label: string;
}

const extractFieldsFromLayout = (element: any): ExtractedField[] => {
  if (!element) return [];
  const results: ExtractedField[] = [];

  if (element.type === 'field' && element.fieldId) {
    results.push({
      fieldId: element.fieldId,
      label: element.label || element.fieldId
    });
  }

  if (element.children && Array.isArray(element.children)) {
    for (const child of element.children) {
      results.push(...extractFieldsFromLayout(child));
    }
  }

  return results;
};

const getFormFields = (form: Form, targetTable?: Table): ExtractedField[] => {
  const fields: ExtractedField[] = [];
  const seen = new Set<string>();

  const addField = (fieldId: string, label?: string) => {
    if (fieldId && !seen.has(fieldId)) {
      seen.add(fieldId);
      fields.push({ fieldId, label: label || fieldId });
    }
  };

  // 1. From form.fields
  if (form.fields && Array.isArray(form.fields) && form.fields.length > 0) {
    form.fields.forEach(f => addField(f.fieldId, f.label));
  }

  // 2. From form.layout
  if (fields.length === 0 && form.layout) {
    const layoutFields = extractFieldsFromLayout(form.layout);
    layoutFields.forEach(f => addField(f.fieldId, f.label));
  }

  // 3. Fallback to targetTable fields
  if (fields.length === 0 && targetTable && targetTable.fields && targetTable.fields.length > 0) {
    targetTable.fields.forEach(f => addField(f.name, f.name));
  }

  return fields;
};

export const generateMudBlazorFormPages = (
  forms: Form[],
  tables: Table[],
  root: string,
  useAuth: boolean = false
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  forms.forEach(form => {
    const className = toPascalCase(form.name || 'CustomForm');
    const routeName = toCamelCase(form.name || 'customForm');
    const targetTable = tables.find(t => t.id === form.sourceId || t.name === form.sourceId || t.name.toLowerCase() === form.sourceId?.toLowerCase());
    const tableName = targetTable ? targetTable.name : 'Data';

    const effectiveFields = getFormFields(form, targetTable);

    const fieldsMarkup = effectiveFields.map(f => {
      const fieldId = f.fieldId;
      const label = f.label || f.fieldId;
      return `
        <MudItem xs="12" md="6">
            <MudTextField T="string" Label="${label}" @bind-Value="formData[\"${fieldId}\"]" Variant="Variant.Outlined" Margin="Margin.Dense" />
        </MudItem>`;
    }).join('\n');

    const content = `@page "/forms/${form.id}"
@page "/${routeName}Form"
${useAuth ? '@attribute [Authorize]' : ''}
@inject StorageServiceManager StorageManager
@inject ISnackbar Snackbar
@inject NavigationManager Nav

<MudContainer MaxWidth="MaxWidth.Large" Class="py-4">
    <MudPaper Class="pa-4 mb-4" Elevation="2">
        <div class="d-flex align-center justify-space-between mb-3">
            <div>
                <MudText Typo="Typo.h5" Color="Color.Primary" Class="font-weight-bold">
                    <MudIcon Icon="@Icons.Material.Filled.Assignment" Class="mr-2" />${form.name}
                </MudText>
                <MudText Typo="Typo.body2" Color="Color.Secondary">
                    Benutzerdefiniertes Formular (${tableName})
                </MudText>
            </div>
            <MudButton Variant="Variant.Outlined" StartIcon="@Icons.Material.Filled.ArrowBack" Href="/">
                Zurück
            </MudButton>
        </div>

        <MudForm @ref="formRef" OnValidSubmit="HandleSave">
            <MudGrid>
                ${fieldsMarkup || `
                <MudItem xs="12">
                    <MudText Typo="Typo.body1" Color="Color.Secondary">Keine Formularfelder konfiguriert.</MudText>
                </MudItem>`}
            </MudGrid>

            <div class="d-flex justify-end gap-2 mt-4">
                <MudButton Variant="Variant.Outlined" OnClick="ResetForm">Zurücksetzen</MudButton>
                <MudButton Variant="Variant.Filled" Color="Color.Primary" StartIcon="@Icons.Material.Filled.Save" ButtonType="ButtonType.Submit">
                    Speichern
                </MudButton>
            </div>
        </MudForm>
    </MudPaper>

    ${form.subform ? `
    <MudPaper Class="pa-4" Elevation="2">
        <MudText Typo="Typo.h6" Class="font-weight-bold mb-3">Subform Datensätze</MudText>
        <MudTable Items="subformItems" Hover="true" Striped="true" Dense="true">
            <HeaderContent>
                <MudTh>ID</MudTh>
                <MudTh>Details</MudTh>
            </HeaderContent>
            <RowTemplate>
                <MudTd>@context.GetValueOrDefault("id")</MudTd>
                <MudTd>@context.GetValueOrDefault("name")</MudTd>
            </RowTemplate>
        </MudTable>
    </MudPaper>
    ` : ''}
</MudContainer>

@code {
    private MudForm formRef = null!;
    private Dictionary<string, string> formData = new();
    private List<Dictionary<string, object>> subformItems = new();

    private async Task HandleSave()
    {
        try
        {
            await StorageManager.CurrentService.Add("${tableName}", formData);
            Snackbar.Add("Formulardaten erfolgreich gespeichert!", Severity.Success);
            Nav.NavigateTo("/");
        }
        catch (Exception ex)
        {
            Snackbar.Add($"Fehler beim Speichern: {ex.Message}", Severity.Error);
        }
    }

    private void ResetForm()
    {
        formData.Clear();
    }
}
`;

    files.push({
      name: `${className}Form.razor`,
      path: `${root}/Pages/Forms/${className}Form.razor`,
      content,
      language: 'razor'
    });
  });

  return files;
};
