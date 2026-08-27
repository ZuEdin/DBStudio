import { Table, Query, VirtualFile } from '../../../../types/index';

export const generateMudBlazorQueriesPage = (
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

<MudContainer MaxWidth="MaxWidth.ExtraLarge" Class="py-4">
    <MudText Typo="Typo.h4" Color="Color.Primary" Class="font-weight-bold mb-1">
        <MudIcon Icon="@Icons.Material.Filled.Search" Class="mr-2" />Abfragen
    </MudText>
    <MudText Typo="Typo.body2" Color="Color.Secondary" Class="mb-4">Führen Sie gezielte Datenabfragen aus oder filtern Sie Ihre Tabellen.</MudText>

    <MudGrid>
        <MudItem xs="12" md="4" Class="no-print">
            <MudPaper Elevation="2" Class="pa-4">
                <MudText Typo="Typo.h6" Class="font-weight-bold mb-3">Verfügbare Abfragen</MudText>
                <MudList T="string" Clickable="true" Dense="true">
                    ${queries.length > 0 ? queries.map((q, idx) => `
                    <MudListItem Icon="@Icons.Material.Filled.ListAlt" OnClick='() => SelectQuery(${idx}, "${q.name.replace(/'/g, "\\'")}")'>
                        <MudText Typo="Typo.subtitle2">${q.name}</MudText>
                        <MudText Typo="Typo.caption" Color="Color.Secondary">Typ: ${q.type || 'SELECT'}</MudText>
                    </MudListItem>
                    `).join('') : tables.map(t => `
                    <MudListItem Icon="@Icons.Material.Filled.TableChart" OnClick='() => SelectTableQuery("${t.name}")'>
                        <MudText Typo="Typo.subtitle2">Alle ${t.name}</MudText>
                        <MudText Typo="Typo.caption" Color="Color.Secondary">Standardabfrage für ${t.name}</MudText>
                    </MudListItem>
                    `).join('')}
                </MudList>
            </MudPaper>
        </MudItem>

        <MudItem xs="12" md="8">
            <MudPaper Elevation="2" Class="pa-4 printable-report">
                <div class="d-flex justify-space-between align-center mb-4 no-print">
                    <MudText Typo="Typo.h6" Class="font-weight-bold">@selectedQueryTitle</MudText>
                    <MudButton Variant="Variant.Filled" Color="Color.Primary" StartIcon="@Icons.Material.Filled.PlayArrow" OnClick="RunQuery">Abfrage ausführen</MudButton>
                </div>

                @if (isLoading)
                {
                    <div class="d-flex justify-center pa-6">
                        <MudProgressCircular Color="Color.Primary" Indeterminate="true" />
                    </div>
                }
                else
                {
                    <MudAlert Severity="Severity.Normal" Class="mb-4 no-print" Variant="Variant.Outlined">
                        <b>SQL Preview:</b> <code>@generatedSql</code>
                    </MudAlert>

                    @if (queryResults != null && queryResults.Any())
                    {
                        <div class="d-flex flex-wrap gap-2 mb-3 no-print">
                            <MudText Typo="Typo.subtitle2" Class="align-self-center mr-2"><b>Exportieren:</b></MudText>
                            <MudButton Variant="Variant.Outlined" Color="Color.Primary" Size="Size.Small" StartIcon="@Icons.Material.Filled.Print" OnClick="PrintExport">PDF / Drucken</MudButton>
                            <MudButton Variant="Variant.Outlined" Color="Color.Success" Size="Size.Small" StartIcon="@Icons.Material.Filled.TableChart" OnClick="ExportXlsx">Excel (.xlsx)</MudButton>
                            <MudButton Variant="Variant.Outlined" Color="Color.Info" Size="Size.Small" StartIcon="@Icons.Material.Filled.FileDownload" OnClick="ExportCsv">CSV</MudButton>
                            <MudButton Variant="Variant.Outlined" Color="Color.Warning" Size="Size.Small" StartIcon="@Icons.Material.Filled.Code" OnClick="ExportXml">XML</MudButton>
                            <MudButton Variant="Variant.Outlined" Color="Color.Dark" Size="Size.Small" StartIcon="@Icons.Material.Filled.DataObject" OnClick="ExportJson">JSON</MudButton>
                        </div>

                        <MudSimpleTable Style="overflow-x: auto; max-height: 500px;">
                            <thead>
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
                        </MudSimpleTable>
                    }
                    else
                    {
                        <div class="pa-6 text-center text-secondary">
                            <MudIcon Icon="@Icons.Material.Filled.Inbox" Size="Size.Large" Class="mb-2" />
                            <MudText>Keine Daten für diese Abfrage vorhanden (@resultCount Datensätze)</MudText>
                        </div>
                    }
                }
            </MudPaper>
        </MudItem>
    </MudGrid>
</MudContainer>

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
