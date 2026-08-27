import { CustomPage, Table, VirtualFile } from '../../../../types/index';
import { toPascalCase, toCamelCase } from '../../common';

export const generateBlazorCustomPages = (
  pages: CustomPage[],
  tables: Table[],
  root: string,
  useAuth: boolean = false
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  pages.forEach(page => {
    const className = toPascalCase(page.name || 'CustomPage');
    const routeName = toCamelCase(page.name || 'customPage');

    const content = `@page "/pages/${page.id}"
@page "/${routeName}"
${useAuth ? '@attribute [Authorize]' : ''}
@inject StorageServiceManager StorageManager

<div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h3 class="fw-bold text-primary mb-1">
                <i class="bi bi-layout-text-window-reverse me-2"></i>${page.name}
            </h3>
            ${page.description ? `<p class="text-secondary small mb-0">${page.description}</p>` : ''}
        </div>
        <button class="btn btn-outline-primary btn-sm" @onclick="LoadData">
            <i class="bi bi-arrow-clockwise me-1"></i> Aktualisieren
        </button>
    </div>

    <!-- KPI Cards -->
    <div class="row g-3 mb-4">
        ${tables.slice(0, 4).map(t => `
        <div class="col-md-3">
            <div class="card border-0 shadow-sm p-3">
                <span class="text-secondary text-uppercase small fw-bold">${t.name}</span>
                <h2 class="fw-bold text-slate-800 mb-0">@(metrics.GetValueOrDefault("${t.name}", 0))</h2>
            </div>
        </div>
        `).join('\n')}
    </div>

    <!-- Data Table View -->
    ${tables.length > 0 ? `
    <div class="card border-0 shadow-sm">
        <div class="card-header bg-white py-3 border-0 fw-bold">${tables[0].name} - Übersicht</div>
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            ${tables[0].fields.slice(0, 5).map(f => `<th>${f.name}</th>`).join('\n')}
                        </tr>
                    </thead>
                    <tbody>
                        @foreach (var row in tableRecords)
                        {
                            <tr>
                                ${tables[0].fields.slice(0, 5).map(f => `<td>@row.GetValueOrDefault("${f.name}")</td>`).join('\n')}
                            </tr>
                        }
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    ` : ''}
</div>

@code {
    private Dictionary<string, int> metrics = new();
    private List<Dictionary<string, object>> tableRecords = new();

    protected override async Task OnInitializedAsync()
    {
        await LoadData();
    }

    private async Task LoadData()
    {
        try
        {
            ${tables.length > 0 ? `
            var records = await StorageManager.CurrentService.GetAll<Dictionary<string, object>>("${tables[0].name}");
            tableRecords = records ?? new();
            metrics["${tables[0].name}"] = tableRecords.Count;
            ` : ''}
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading custom page data: {ex.Message}");
        }
    }
}
`;

    files.push({
      name: `${className}Page.razor`,
      path: `${root}/Pages/CustomPages/${className}Page.razor`,
      content,
      language: 'razor'
    });
  });

  return files;
};
