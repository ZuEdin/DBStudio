import { CustomPage, Table, VirtualFile } from '../../../../types/index';
import { toPascalCase, toCamelCase } from '../../common';

export const generateMudBlazorCustomPages = (
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
@inject ISnackbar Snackbar

<MudContainer MaxWidth="MaxWidth.ExtraLarge" Class="py-4">
    <div class="d-flex justify-space-between align-center mb-4">
        <div>
            <MudText Typo="Typo.h4" Color="Color.Primary" Class="font-weight-bold mb-1">
                <MudIcon Icon="@Icons.Material.Filled.Web" Class="mr-2" />${page.name}
            </MudText>
            ${page.description ? `<MudText Typo="Typo.body2" Color="Color.Secondary">${page.description}</MudText>` : ''}
        </div>
        <MudButton Variant="Variant.Outlined" StartIcon="@Icons.Material.Filled.Refresh" OnClick="LoadData">
            Aktualisieren
        </MudButton>
    </div>

    <!-- KPI Metric Cards -->
    <MudGrid Class="mb-4">
        ${tables.slice(0, 4).map(t => `
        <MudItem xs="12" sm="6" md="3">
            <MudPaper Class="pa-4 d-flex align-center justify-space-between" Elevation="2">
                <div>
                    <MudText Typo="Typo.caption" Color="Color.Secondary">${t.name.toUpperCase()}</MudText>
                    <MudText Typo="Typo.h4" Class="font-weight-bold">@(metrics.GetValueOrDefault("${t.name}", 0))</MudText>
                </div>
                <MudAvatar Color="Color.Primary" Variant="Variant.Light">
                    <MudIcon Icon="@Icons.Material.Filled.TableChart" />
                </MudAvatar>
            </MudPaper>
        </MudItem>
        `).join('\n')}
    </MudGrid>

    <!-- Interactive MudChart View -->
    <MudGrid Class="mb-4">
        <MudItem xs="12" md="8">
            <MudPaper Class="pa-4" Elevation="2">
                <MudText Typo="Typo.h6" Class="font-weight-bold mb-3">Daten-Entwicklung</MudText>
                <MudChart ChartType="ChartType.Bar" ChartSeries="@series" XAxisLabels="@xAxisLabels" Width="100%" Height="300px" />
            </MudPaper>
        </MudItem>
        <MudItem xs="12" md="4">
            <MudPaper Class="pa-4" Elevation="2">
                <MudText Typo="Typo.h6" Class="font-weight-bold mb-3">Verteilung</MudText>
                <MudChart ChartType="ChartType.Donut" InputData="@donutData" InputLabels="@donutLabels" Width="100%" Height="300px" />
            </MudPaper>
        </MudItem>
    </MudGrid>

    <!-- Main Data Table View -->
    ${tables.length > 0 ? `
    <MudPaper Class="pa-4" Elevation="2">
        <MudText Typo="Typo.h6" Class="font-weight-bold mb-3">${tables[0].name} - Übersicht</MudText>
        <MudTable Items="tableRecords" Hover="true" Striped="true" Dense="true" Loading="@loading">
            <HeaderContent>
                ${tables[0].fields.slice(0, 5).map(f => `<MudTh>${f.name}</MudTh>`).join('\n')}
            </HeaderContent>
            <RowTemplate>
                ${tables[0].fields.slice(0, 5).map(f => `<MudTd>@context.GetValueOrDefault("${f.name}")</MudTd>`).join('\n')}
            </RowTemplate>
        </MudTable>
    </MudPaper>
    ` : ''}
</MudContainer>

@code {
    private bool loading = true;
    private Dictionary<string, int> metrics = new();
    private List<Dictionary<string, object>> tableRecords = new();

    private List<ChartSeries> series = new()
    {
        new ChartSeries { Name = "Aktivität", Data = new double[] { 40, 65, 80, 95, 120, 145 } }
    };
    private string[] xAxisLabels = new string[] { "Jan", "Feb", "Mär", "Apr", "Mai", "Jun" };

    private double[] donutData = new double[] { 45, 25, 20, 10 };
    private string[] donutLabels = new string[] { "Aktiv", "In Bearbeitung", "Pausiert", "Neu" };

    protected override async Task OnInitializedAsync()
    {
        await LoadData();
    }

    private async Task LoadData()
    {
        loading = true;
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
            Snackbar.Add($"Fehler beim Laden: {ex.Message}", Severity.Error);
        }
        finally
        {
            loading = false;
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
