import { VirtualFile } from '../../../../types/index';

export const generateApiService = (namespace: string, root: string): VirtualFile => {
  const apiService = `using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.JSInterop;

namespace ${namespace}.Services
{
    public class PagedApiResponse<T>
    {
        [JsonPropertyName("data")]
        public List<T> Data { get; set; } = new();

        [JsonPropertyName("total")]
        public int Total { get; set; }

        [JsonPropertyName("page")]
        public int Page { get; set; }

        [JsonPropertyName("pageSize")]
        public int PageSize { get; set; }

        [JsonPropertyName("totalPages")]
        public int TotalPages { get; set; }
    }

    public class ApiService : IStorageService
    {
        private readonly HttpClient _http;
        private readonly IJSRuntime _js;
        private readonly IndexedDbService _indexedDb;
        private readonly JsonSerializerOptions _jsonOptions;
        public string BackendName => "REST API (SQLite / Server DB)";

        public ApiService(HttpClient http, IJSRuntime js, IndexedDbService indexedDb)
        {
            _http = http;
            _js = js;
            _indexedDb = indexedDb;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
        }

        private async Task AttachAuthHeaderAsync()
        {
            try
            {
                var token = await _js.InvokeAsync<string>("localStorage.getItem", "auth_token");
                if (!string.IsNullOrEmpty(token))
                {
                    _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                }
            }
            catch { }
        }

        private string ToPascalCase(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return input;
            var clean = System.Text.RegularExpressions.Regex.Replace(input, @"[^a-zA-Z0-9\\s_-]", " ");
            var words = clean.Split(new[] { ' ', '_', '-' }, StringSplitOptions.RemoveEmptyEntries);
            if (words.Length == 0) return input;
            var sb = new System.Text.StringBuilder();
            foreach (var w in words)
            {
                var trimmed = w.Trim();
                if (string.IsNullOrEmpty(trimmed)) continue;
                sb.Append(char.ToUpperInvariant(trimmed[0])).Append(trimmed.Substring(1));
            }
            return sb.Length > 0 ? sb.ToString() : input;
        }

        private string ToCamelCase(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return input;
            var clean = System.Text.RegularExpressions.Regex.Replace(input, @"[^a-zA-Z0-9\\s_-]", " ");
            var words = clean.Split(new[] { ' ', '_', '-' }, StringSplitOptions.RemoveEmptyEntries);
            if (words.Length == 0) return input;
            var sb = new System.Text.StringBuilder();
            for (int i = 0; i < words.Length; i++)
            {
                var w = words[i].Trim();
                if (string.IsNullOrEmpty(w)) continue;
                if (sb.Length == 0)
                {
                    sb.Append(char.ToLowerInvariant(w[0])).Append(w.Substring(1));
                }
                else
                {
                    sb.Append(char.ToUpperInvariant(w[0])).Append(w.Substring(1));
                }
            }
            return sb.Length > 0 ? sb.ToString() : input;
        }

        private string ToCamelCaseNoStopWords(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return input;
            var stopWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "und", "and", "oder", "or", "mit", "with" };
            var clean = System.Text.RegularExpressions.Regex.Replace(input, @"[^a-zA-Z0-9\\s_-]", " ");
            var words = clean.Split(new[] { ' ', '_', '-' }, StringSplitOptions.RemoveEmptyEntries);
            var sb = new System.Text.StringBuilder();
            foreach (var w in words)
            {
                var trimmed = w.Trim();
                if (string.IsNullOrEmpty(trimmed) || stopWords.Contains(trimmed)) continue;
                if (sb.Length == 0)
                {
                    sb.Append(char.ToLowerInvariant(trimmed[0])).Append(trimmed.Substring(1));
                }
                else
                {
                    sb.Append(char.ToUpperInvariant(trimmed[0])).Append(trimmed.Substring(1));
                }
            }
            return sb.Length > 0 ? sb.ToString() : input;
        }

        public async Task<List<T>> GetAll<T>(string tableName) where T : class, new()
        {
            await AttachAuthHeaderAsync();
            try
            {
                var pascal = ToPascalCase(tableName);
                var camel = ToCamelCase(tableName);
                var camelNoStop = ToCamelCaseNoStopWords(tableName);

                var candidates = new List<string>
                {
                    $"{pascal}?page=1&pageSize=1000",
                    $"{pascal}",
                    $"{tableName}?page=1&pageSize=1000",
                    $"{tableName}",
                    $"{camel}?page=1&pageSize=1000",
                    $"{camel}",
                    $"data/{tableName}",
                    $"data/{pascal}",
                    $"db/data/{tableName}",
                    $"db/{tableName}",
                    $"backend-apis/{tableName}/data",
                    $"queries/{pascal}?page=1&pageSize=1000",
                    $"queries/{camel}?page=1&pageSize=1000",
                    $"queries/{camelNoStop}?page=1&pageSize=1000",
                    $"queries/{tableName}?page=1&pageSize=1000",
                    $"queries/{pascal}",
                    $"queries/{camel}",
                    $"queries/{camelNoStop}",
                    $"queries/{tableName}"
                };

                var tried = new HashSet<string>();
                foreach (var endpoint in candidates)
                {
                    if (tried.Contains(endpoint)) continue;
                    tried.Add(endpoint);
                    try
                    {
                        var res = await _http.GetAsync(endpoint);
                        if (res.IsSuccessStatusCode)
                        {
                            var content = await res.Content.ReadAsStringAsync();
                            if (string.IsNullOrWhiteSpace(content) || content.TrimStart().StartsWith("<")) continue;

                            using var doc = JsonDocument.Parse(content);
                            var root = doc.RootElement;
                            List<T>? items = null;

                            if (root.ValueKind == JsonValueKind.Array)
                            {
                                items = JsonSerializer.Deserialize<List<T>>(root.GetRawText(), _jsonOptions);
                            }
                            else if (root.ValueKind == JsonValueKind.Object)
                            {
                                string[] arrayPropNames = new[] { "data", "Data", "items", "Items", "value", "Value", "records", "Records", "rows", "Rows", "result", "Result" };
                                foreach (var propName in arrayPropNames)
                                {
                                    if (root.TryGetProperty(propName, out var arrProp) && arrProp.ValueKind == JsonValueKind.Array)
                                    {
                                        items = JsonSerializer.Deserialize<List<T>>(arrProp.GetRawText(), _jsonOptions);
                                        break;
                                    }
                                }
                            }

                            if (items != null && items.Count > 0)
                            {
                                return items;
                            }
                        }
                    }
                    catch { }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ApiService] GetAll Fehler (API): {ex.Message}");
            }

            // Fallback: If API returns no data or fails, attempt fetching from IndexedDB
            try
            {
                return await _indexedDb.GetAll<T>(tableName);
            }
            catch
            {
                return new List<T>();
            }
        }

        public async Task<T?> GetById<T>(string tableName, object id) where T : class, new()
        {
            await AttachAuthHeaderAsync();
            var pascal = ToPascalCase(tableName);
            var camel = ToCamelCase(tableName);
            var endpoints = new[]
            {
                $"{pascal}/{id}",
                $"{tableName}/{id}",
                $"{camel}/{id}",
                $"data/{tableName}/{id}",
                $"db/data/{tableName}/{id}"
            };
            foreach (var ep in endpoints)
            {
                try
                {
                    var response = await _http.GetAsync(ep);
                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        if (!string.IsNullOrWhiteSpace(content) && !content.TrimStart().StartsWith("<"))
                        {
                            var item = JsonSerializer.Deserialize<T>(content, _jsonOptions);
                            if (item != null) return item;
                        }
                    }
                }
                catch { }
            }
            try
            {
                return await _indexedDb.GetById<T>(tableName, id);
            }
            catch
            {
                return null;
            }
        }

        public async Task Add<T>(string tableName, T record) where T : class, new()
        {
            await AttachAuthHeaderAsync();
            var pascal = ToPascalCase(tableName);
            var camel = ToCamelCase(tableName);
            var endpoints = new[]
            {
                $"{pascal}",
                $"{tableName}",
                $"{camel}",
                $"data/{tableName}",
                $"db/data/{tableName}"
            };
            foreach (var ep in endpoints)
            {
                try
                {
                    var res = await _http.PostAsJsonAsync(ep, record);
                    if (res.IsSuccessStatusCode) break;
                }
                catch { }
            }
            try
            {
                await _indexedDb.Add(tableName, record);
            }
            catch { }
        }

        public async Task Update<T>(string tableName, object id, T record) where T : class, new()
        {
            await AttachAuthHeaderAsync();
            var pascal = ToPascalCase(tableName);
            var camel = ToCamelCase(tableName);
            var endpoints = new[]
            {
                $"{pascal}/{id}",
                $"{tableName}/{id}",
                $"{camel}/{id}",
                $"data/{tableName}/{id}",
                $"db/data/{tableName}/{id}"
            };
            foreach (var ep in endpoints)
            {
                try
                {
                    var res = await _http.PutAsJsonAsync(ep, record);
                    if (res.IsSuccessStatusCode) break;
                }
                catch { }
            }
            try
            {
                await _indexedDb.Update(tableName, id, record);
            }
            catch { }
        }

        public async Task Delete(string tableName, object id)
        {
            await AttachAuthHeaderAsync();
            var pascal = ToPascalCase(tableName);
            var camel = ToCamelCase(tableName);
            var endpoints = new[]
            {
                $"{pascal}/{id}",
                $"{tableName}/{id}",
                $"{camel}/{id}",
                $"data/{tableName}/{id}",
                $"db/data/{tableName}/{id}"
            };
            foreach (var ep in endpoints)
            {
                try
                {
                    var res = await _http.DeleteAsync(ep);
                    if (res.IsSuccessStatusCode) break;
                }
                catch { }
            }
            try
            {
                await _indexedDb.Delete(tableName, id);
            }
            catch { }
        }
    }
}
`;
  return {
    name: 'ApiService.cs',
    path: `${root}/Services/ApiService.cs`,
    content: apiService,
    language: 'csharp'
  };
};
