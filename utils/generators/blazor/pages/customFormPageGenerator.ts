import { Form, Table, VirtualFile } from '../../../../types/index';
import { toPascalCase, toCamelCase } from '../../common';

export const generateBlazorFormPages = (
  forms: Form[],
  tables: Table[],
  root: string,
  useAuth: boolean = false
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  forms.forEach(form => {
    const className = toPascalCase(form.name || 'CustomForm');
    const routeName = toCamelCase(form.name || 'customForm');
    const targetTable = tables.find(t => t.id === form.sourceId || t.name === form.sourceId);
    const tableName = targetTable ? targetTable.name : 'Data';

    const fieldsMarkup = form.fields.map(f => {
      const fieldId = f.fieldId;
      const label = f.label || f.fieldId;
      return `
            <div class="col-md-6 mb-3">
                <label class="form-label fw-semibold">${label}</label>
                <input type="text" class="form-control" @bind="formData[\"${fieldId}\"]" />
            </div>`;
    }).join('\n');

    const content = `@page "/forms/${form.id}"
@page "/${routeName}Form"
${useAuth ? '@attribute [Authorize]' : ''}
@inject StorageServiceManager StorageManager
@inject NavigationManager Nav

<div class="container-fluid py-4">
    <div class="card shadow-sm border-0 mb-4">
        <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0">
            <div>
                <h4 class="fw-bold text-primary mb-1">
                    <i class="bi bi-file-earmark-text me-2"></i>${form.name}
                </h4>
                <p class="text-secondary small mb-0">Benutzerdefiniertes Formular (${tableName})</p>
            </div>
            <a href="/" class="btn btn-outline-secondary btn-sm">
                <i class="bi bi-arrow-left me-1"></i> Zurück
            </a>
        </div>
        <div class="card-body">
            <form @onsubmit="HandleSave">
                <div class="row">
                    ${fieldsMarkup || '<div class="col-12"><p class="text-muted">Keine Formularfelder konfiguriert.</p></div>'}
                </div>

                <div class="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" class="btn btn-light" @onclick="ResetForm">Zurücksetzen</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="bi bi-save me-1"></i> Speichern
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

@code {
    private Dictionary<string, string> formData = new();

    private async Task HandleSave()
    {
        try
        {
            await StorageManager.CurrentService.Add("${tableName}", formData);
            Nav.NavigateTo("/");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
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
