import { Table, Query, VirtualFile } from '../../../../types/index';

export const generateQueriesPage = (
  tables: Table[],
  queries: Query[],
  root: string,
  useAuth: boolean = false
): VirtualFile => {
  const queriesPage = `@page "/queries"
${useAuth ? '@attribute [Authorize]' : ''}
@inject StorageServiceManager StorageManager
@inject ApiService ApiService
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
                    <button class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3" @onclick='() => SelectQuery(${idx}, "${q.name.replace(/'/g, "\\'")}")'>
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

  return {
    name: 'Queries.razor',
    path: `${root}/Pages/Queries.razor`,
    content: queriesPage,
    language: 'razor'
  };
};
