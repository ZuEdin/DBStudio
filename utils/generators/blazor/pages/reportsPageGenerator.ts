import { Table, BackendConfig, VirtualFile } from '../../../../types/index';

export const generateReportsPage = (
  tables: Table[],
  config: BackendConfig,
  root: string,
  useAuth: boolean = false
): VirtualFile => {
  const reportsPage = `@page "/reports"
${useAuth ? '@attribute [Authorize]' : ''}
@inject StorageServiceManager StorageManager
@inject ApiService ApiService
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
