import { Table, Report, BackendConfig, VirtualFile } from '../../../../types/index';

export const generateMudBlazorReportsPage = (
  tables: Table[],
  config: BackendConfig,
  root: string,
  useAuth: boolean = false,
  reports: Report[] = []
): VirtualFile => {
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

  return {
    name: 'Reports.razor',
    path: `${root}/Pages/Reports.razor`,
    content: reportsPage,
    language: 'razor'
  };
};
