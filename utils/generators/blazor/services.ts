import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateBlazorServices = (
  config: BackendConfig,
  namespace: string,
  root: string,
  useAuth: boolean = false
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // IStorageService.cs
  const iStorageService = `using System.Collections.Generic;
using System.Threading.Tasks;

namespace ${namespace}.Services
{
    public interface IStorageService
    {
        string BackendName { get; }
        Task<List<T>> GetAll<T>(string tableName) where T : class, new();
        Task<T?> GetById<T>(string tableName, object id) where T : class, new();
        Task Add<T>(string tableName, T record) where T : class, new();
        Task Update<T>(string tableName, object id, T record) where T : class, new();
        Task Delete(string tableName, object id);
    }
}
`;
  files.push({ name: 'IStorageService.cs', path: `${root}/Services/IStorageService.cs`, content: iStorageService, language: 'csharp' });

  // IndexedDbService.cs
  const indexedDbService = `using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.JSInterop;

namespace ${namespace}.Services
{
    public class IndexedDbService : IStorageService
    {
        private readonly IJSRuntime _js;
        private readonly JsonSerializerOptions _jsonOptions;
        public string BackendName => "IndexedDB (Lokal & Offline)";

        public IndexedDbService(IJSRuntime js)
        {
            _js = js;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
        }

        public async Task<List<T>> GetAll<T>(string tableName) where T : class, new()
        {
            try
            {
                var jsonElement = await _js.InvokeAsync<JsonElement>("indexedDbManager.getAll", tableName);
                var items = JsonSerializer.Deserialize<List<T>>(jsonElement.GetRawText(), _jsonOptions);
                return items ?? new List<T>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[IndexedDbService] GetAll Fehler: {ex.Message}");
                return new List<T>();
            }
        }

        public async Task<T?> GetById<T>(string tableName, object id) where T : class, new()
        {
            try
            {
                var jsonElement = await _js.InvokeAsync<JsonElement>("indexedDbManager.getById", tableName, id);
                if (jsonElement.ValueKind == JsonValueKind.Null || jsonElement.ValueKind == JsonValueKind.Undefined)
                {
                    return null;
                }
                return JsonSerializer.Deserialize<T>(jsonElement.GetRawText(), _jsonOptions);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[IndexedDbService] GetById Fehler: {ex.Message}");
                return null;
            }
        }

        public async Task Add<T>(string tableName, T record) where T : class, new()
        {
            try
            {
                await _js.InvokeVoidAsync("indexedDbManager.add", tableName, record);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[IndexedDbService] Add Fehler: {ex.Message}");
            }
        }

        public async Task Update<T>(string tableName, object id, T record) where T : class, new()
        {
            try
            {
                await _js.InvokeVoidAsync("indexedDbManager.update", tableName, id, record);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[IndexedDbService] Update Fehler: {ex.Message}");
            }
        }

        public async Task Delete(string tableName, object id)
        {
            try
            {
                await _js.InvokeVoidAsync("indexedDbManager.delete", tableName, id);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[IndexedDbService] Delete Fehler: {ex.Message}");
            }
        }
    }
}
`;
  files.push({ name: 'IndexedDbService.cs', path: `${root}/Services/IndexedDbService.cs`, content: indexedDbService, language: 'csharp' });

  // ApiService.cs
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
        private readonly JsonSerializerOptions _jsonOptions;
        public string BackendName => "REST API (MySQL / SQL Server / SQLite)";

        public ApiService(HttpClient http, IJSRuntime js)
        {
            _http = http;
            _js = js;
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

        private string ToCamelCase(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return input;
            var clean = System.Text.RegularExpressions.Regex.Replace(input, @"[^a-zA-Z0-9\s_-]", " ");
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
            var clean = System.Text.RegularExpressions.Regex.Replace(input, @"[^a-zA-Z0-9\s_-]", " ");
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
                var camel = ToCamelCase(tableName);
                var camelNoStop = ToCamelCaseNoStopWords(tableName);

                var candidates = new List<string>
                {
                    $"queries/{camel}?page=1&pageSize=1000",
                    $"queries/{camelNoStop}?page=1&pageSize=1000",
                    $"queries/{tableName}?page=1&pageSize=1000",
                    $"queries/{camel}",
                    $"queries/{camelNoStop}",
                    $"queries/{tableName}",
                    $"{tableName}?page=1&pageSize=1000",
                    $"{tableName}",
                    $"{camel}?page=1&pageSize=1000",
                    $"{camel}",
                    $"data/{tableName}"
                };

                HttpResponseMessage? response = null;
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
                            response = res;
                            break;
                        }
                    }
                    catch { }
                }

                if (response != null && response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    if (string.IsNullOrWhiteSpace(content)) return new List<T>();

                    using var doc = JsonDocument.Parse(content);
                    var root = doc.RootElement;

                    if (root.ValueKind == JsonValueKind.Object)
                    {
                        if (root.TryGetProperty("data", out var dataProp) && dataProp.ValueKind == JsonValueKind.Array)
                        {
                            var items = JsonSerializer.Deserialize<List<T>>(dataProp.GetRawText(), _jsonOptions);
                            return items ?? new List<T>();
                        }
                        if (root.TryGetProperty("Data", out var dataPropPascal) && dataPropPascal.ValueKind == JsonValueKind.Array)
                        {
                            var items = JsonSerializer.Deserialize<List<T>>(dataPropPascal.GetRawText(), _jsonOptions);
                            return items ?? new List<T>();
                        }
                        if (root.TryGetProperty("items", out var itemsProp) && itemsProp.ValueKind == JsonValueKind.Array)
                        {
                            var items = JsonSerializer.Deserialize<List<T>>(itemsProp.GetRawText(), _jsonOptions);
                            return items ?? new List<T>();
                        }
                        if (root.TryGetProperty("Items", out var itemsPropPascal) && itemsPropPascal.ValueKind == JsonValueKind.Array)
                        {
                            var items = JsonSerializer.Deserialize<List<T>>(itemsPropPascal.GetRawText(), _jsonOptions);
                            return items ?? new List<T>();
                        }
                    }
                    else if (root.ValueKind == JsonValueKind.Array)
                    {
                        var items = JsonSerializer.Deserialize<List<T>>(root.GetRawText(), _jsonOptions);
                        return items ?? new List<T>();
                    }
                }
                return new List<T>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ApiService] GetAll Fehler: {ex.Message}");
                return new List<T>();
            }
        }

        public async Task<T?> GetById<T>(string tableName, object id) where T : class, new()
        {
            await AttachAuthHeaderAsync();
            try
            {
                var response = await _http.GetAsync($"{tableName}/{id}");
                if (!response.IsSuccessStatusCode)
                {
                    response = await _http.GetAsync($"data/{tableName}/{id}");
                }

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    return JsonSerializer.Deserialize<T>(content, _jsonOptions);
                }
                return null;
            }
            catch
            {
                return null;
            }
        }

        public async Task Add<T>(string tableName, T record) where T : class, new()
        {
            await AttachAuthHeaderAsync();
            var res = await _http.PostAsJsonAsync($"{tableName}", record);
            if (!res.IsSuccessStatusCode)
            {
                await _http.PostAsJsonAsync($"data/{tableName}", record);
            }
        }

        public async Task Update<T>(string tableName, object id, T record) where T : class, new()
        {
            await AttachAuthHeaderAsync();
            var res = await _http.PutAsJsonAsync($"{tableName}/{id}", record);
            if (!res.IsSuccessStatusCode)
            {
                await _http.PutAsJsonAsync($"data/{tableName}/{id}", record);
            }
        }

        public async Task Delete(string tableName, object id)
        {
            await AttachAuthHeaderAsync();
            var res = await _http.DeleteAsync($"{tableName}/{id}");
            if (!res.IsSuccessStatusCode)
            {
                await _http.DeleteAsync($"data/{tableName}/{id}");
            }
        }
    }
}
`;
  files.push({ name: 'ApiService.cs', path: `${root}/Services/ApiService.cs`, content: apiService, language: 'csharp' });

  // StorageServiceManager.cs
  const storageServiceManager = `using System;

namespace ${namespace}.Services
{
    public class StorageServiceManager
    {
        private readonly IServiceProvider _serviceProvider;
        public IStorageService CurrentService { get; private set; }
        public string StorageType { get; private set; } = "IndexedDB";

        public event Action? OnStorageChanged;

        public StorageServiceManager(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
            // Default Priority: REST API (Connected to Server Database)
            var apiService = _serviceProvider.GetService(typeof(ApiService)) as IStorageService;
            if (apiService != null)
            {
                StorageType = "API";
                CurrentService = apiService;
            }
            else
            {
                StorageType = "IndexedDB";
                CurrentService = (IStorageService)_serviceProvider.GetService(typeof(IndexedDbService))!;
            }
        }

        public void SetStorageType(string type)
        {
            StorageType = type;
            if (type == "API")
            {
                CurrentService = (IStorageService)_serviceProvider.GetService(typeof(ApiService))!;
            }
            else
            {
                CurrentService = (IStorageService)_serviceProvider.GetService(typeof(IndexedDbService))!;
            }
            OnStorageChanged?.Invoke();
        }
    }
}
`;
  files.push({ name: 'StorageServiceManager.cs', path: `${root}/Services/StorageServiceManager.cs`, content: storageServiceManager, language: 'csharp' });

  // AuthService & CustomAuthStateProvider
  if (useAuth) {
    const authService = `using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.JSInterop;
using ${namespace}.Models;

namespace ${namespace}.Services
{
    public class AuthService
    {
        private readonly HttpClient _http;
        private readonly AuthenticationStateProvider _provider;
        private readonly IJSRuntime _js;

        public AuthService(HttpClient http, AuthenticationStateProvider provider, IJSRuntime js)
        {
            _http = http;
            _provider = provider;
            _js = js;
        }

        public async Task<bool> Login(LoginModel model)
        {
            var res = await _http.PostAsJsonAsync("auth/login", model);
            if (!res.IsSuccessStatusCode)
            {
                return false;
            }

            var data = await res.Content.ReadFromJsonAsync<AuthResponse>();
            if (data != null && !string.IsNullOrEmpty(data.Token))
            {
                await _js.InvokeVoidAsync("localStorage.setItem", "auth_token", data.Token);
                ((CustomAuthStateProvider)_provider).NotifyUserAuthentication(data.Token);
                return true;
            }
            return false;
        }

        public async Task<bool> Register(RegisterModel model)
        {
            var res = await _http.PostAsJsonAsync("auth/register", model);
            return res.IsSuccessStatusCode;
        }

        public async Task<bool> ChangePassword(ChangePasswordModel model)
        {
            var res = await _http.PostAsJsonAsync("auth/change-password", model);
            return res.IsSuccessStatusCode;
        }

        public async Task Logout()
        {
            await _js.InvokeVoidAsync("localStorage.removeItem", "auth_token");
            ((CustomAuthStateProvider)_provider).NotifyUserLogout();
        }
    }
}
`;
    files.push({ name: 'AuthService.cs', path: `${root}/Services/AuthService.cs`, content: authService, language: 'csharp' });

    const authProvider = `using System;
using System.Security.Claims;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.JSInterop;
using System.Text.Json;

namespace ${namespace}.Services
{
    public class CustomAuthStateProvider : AuthenticationStateProvider
    {
        private readonly IJSRuntime _js;

        public CustomAuthStateProvider(IJSRuntime js)
        {
            _js = js;
        }

        public override async Task<AuthenticationState> GetAuthenticationStateAsync()
        {
            var token = await _js.InvokeAsync<string>("localStorage.getItem", "auth_token");
            if (string.IsNullOrEmpty(token))
            {
                return new AuthenticationState(new ClaimsPrincipal(new ClaimsIdentity()));
            }

            try
            {
                var claims = ParseClaimsFromJwt(token);
                var identity = new ClaimsIdentity(claims, "jwt");
                return new AuthenticationState(new ClaimsPrincipal(identity));
            }
            catch
            {
                return new AuthenticationState(new ClaimsPrincipal(new ClaimsIdentity()));
            }
        }

        public void NotifyUserAuthentication(string token)
        {
            var identity = new ClaimsIdentity(ParseClaimsFromJwt(token), "jwt");
            var user = new ClaimsPrincipal(identity);
            NotifyAuthenticationStateChanged(Task.FromResult(new AuthenticationState(user)));
        }

        public void NotifyUserLogout()
        {
            var identity = new ClaimsIdentity();
            var user = new ClaimsPrincipal(identity);
            NotifyAuthenticationStateChanged(Task.FromResult(new AuthenticationState(user)));
        }

        private IEnumerable<Claim> ParseClaimsFromJwt(string jwt)
        {
            var claims = new List<Claim>();
            var parts = jwt.Split('.');
            if (parts.Length < 2) return claims;

            var payload = parts[1];
            var jsonBytes = ParseBase64WithoutPadding(payload);
            var keyValuePairs = JsonSerializer.Deserialize<Dictionary<string, object>>(jsonBytes);

            if (keyValuePairs != null)
            {
                foreach (var kvp in keyValuePairs)
                {
                    if (kvp.Key == "role" || kvp.Key == "http://schemas.microsoft.com/ws/2008/06/identity/claims/role")
                    {
                        if (kvp.Value is JsonElement element && element.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var role in element.EnumerateArray())
                            {
                                claims.Add(new Claim(ClaimTypes.Role, role.ToString()));
                            }
                        }
                        else
                        {
                            claims.Add(new Claim(ClaimTypes.Role, kvp.Value.ToString()!));
                        }
                    }
                    else
                    {
                        claims.Add(new Claim(kvp.Key, kvp.Value?.ToString() ?? ""));
                    }
                }
            }
            return claims;
        }

        private byte[] ParseBase64WithoutPadding(string base64)
        {
            switch (base64.Length % 4)
            {
                case 2: base64 += "=="; break;
                case 3: base64 += "="; break;
            }
            return Convert.FromBase64String(base64);
        }
    }
}
`;
    files.push({ name: 'CustomAuthStateProvider.cs', path: `${root}/Services/CustomAuthStateProvider.cs`, content: authProvider, language: 'csharp' });
  }

  return files;
};
