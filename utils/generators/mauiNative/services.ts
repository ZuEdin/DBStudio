import { Table, BackendConfig, VirtualFile } from '../../../types/index';

export const generateMauiNativeServices = (
  tables: Table[],
  config: BackendConfig,
  namespace: string,
  root: string
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // Prepare seed json data map for initial offline storage
  const seedInitDict = tables.map(t => {
    const rows = t.data && t.data.length > 0 ? t.data : [];
    const jsonStr = JSON.stringify(JSON.stringify(rows));
    return `            { "${t.name}", ${jsonStr} }`;
  }).join(',\n');

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

  // JsonFileStorageService.cs
  const jsonFileStorageService = `using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Maui.Storage;

namespace ${namespace}.Services
{
    public class JsonFileStorageService : IStorageService
    {
        private readonly string _basePath = FileSystem.AppDataDirectory;
        public string BackendName => "Lokal & Offline (JSON-Datenbank)";

        private static readonly Dictionary<string, string> InitialSeedData = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
${seedInitDict}
        };

        private string GetFilePath(string tableName) => Path.Combine(_basePath, $"{tableName}.json");

        private async Task EnsureInitialized(string tableName)
        {
            var path = GetFilePath(tableName);
            if (!File.Exists(path))
            {
                string initialJson = "[]";
                if (InitialSeedData.TryGetValue(tableName, out var seed) && !string.IsNullOrWhiteSpace(seed))
                {
                    initialJson = seed;
                }
                await File.WriteAllTextAsync(path, initialJson);
            }
        }

        public async Task<List<T>> GetAll<T>(string tableName) where T : class, new()
        {
            await EnsureInitialized(tableName);
            var path = GetFilePath(tableName);

            try
            {
                var json = await File.ReadAllTextAsync(path);
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                return JsonSerializer.Deserialize<List<T>>(json, options) ?? new List<T>();
            }
            catch
            {
                return new List<T>();
            }
        }

        public async Task<T?> GetById<T>(string tableName, object id) where T : class, new()
        {
            var items = await GetAll<T>(tableName);
            var idProp = typeof(T).GetProperty("Id") ?? typeof(T).GetProperty("id");
            if (idProp == null) return null;

            foreach (var item in items)
            {
                var val = idProp.GetValue(item);
                if (val != null && val.ToString() == id.ToString())
                    return item;
            }
            return null;
        }

        public async Task Add<T>(string tableName, T record) where T : class, new()
        {
            var items = await GetAll<T>(tableName);
            
            // Handle Auto-Incrementing ID
            var idProp = typeof(T).GetProperty("Id") ?? typeof(T).GetProperty("id");
            if (idProp != null && (idProp.PropertyType == typeof(int) || idProp.PropertyType == typeof(long)))
            {
                int maxId = 0;
                foreach (var item in items)
                {
                    var idVal = idProp.GetValue(item);
                    if (idVal is int idInt && idInt > maxId) maxId = idInt;
                    else if (idVal is long idLong && idLong > maxId) maxId = (int)idLong;
                }
                idProp.SetValue(record, maxId + 1);
            }

            items.Add(record);
            await SaveAll(tableName, items);
        }

        public async Task Update<T>(string tableName, object id, T record) where T : class, new()
        {
            var items = await GetAll<T>(tableName);
            var idProp = typeof(T).GetProperty("Id") ?? typeof(T).GetProperty("id");
            if (idProp == null) return;

            int index = -1;
            for (int i = 0; i < items.Count; i++)
            {
                var val = idProp.GetValue(items[i]);
                if (val != null && val.ToString() == id.ToString())
                {
                    index = i;
                    break;
                }
            }

            if (index != -1)
            {
                items[index] = record;
                await SaveAll(tableName, items);
            }
        }

        public async Task Delete(string tableName, object id)
        {
            var path = GetFilePath(tableName);
            if (!File.Exists(path)) return;

            try
            {
                var json = await File.ReadAllTextAsync(path);
                var items = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (items == null) return;

                var idStr = id?.ToString();
                items.RemoveAll(item =>
                {
                    foreach (var kv in item)
                    {
                        if (kv.Key.Equals("id", StringComparison.OrdinalIgnoreCase))
                        {
                            return kv.Value?.ToString() == idStr;
                        }
                    }
                    return false;
                });

                var updatedJson = JsonSerializer.Serialize(items, new JsonSerializerOptions { WriteIndented = true });
                await File.WriteAllTextAsync(path, updatedJson);
            }
            catch { }
        }

        private async Task SaveAll<T>(string tableName, List<T> items)
        {
            var path = GetFilePath(tableName);
            var json = JsonSerializer.Serialize(items, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(path, json);
        }
    }
}
`;
  files.push({ name: 'JsonFileStorageService.cs', path: `${root}/Services/JsonFileStorageService.cs`, content: jsonFileStorageService, language: 'csharp' });

  // ApiService.cs
  const apiService = `using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

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
        private readonly JsonSerializerOptions _jsonOptions;
        public string BackendName => "REST API (MySQL / SQL Server)";

        public ApiService(HttpClient http)
        {
            _http = http;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
        }

        public async Task<List<T>> GetAll<T>(string tableName) where T : class, new()
        {
            try
            {
                // Controllers are mounted at /api/{tableName} or /api/data/{tableName}
                var response = await _http.GetAsync($"{tableName}");
                if (!response.IsSuccessStatusCode)
                {
                    response = await _http.GetAsync($"data/{tableName}");
                }

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    // First try deserializing as PagedResult<T> (default for our Controllers)
                    try
                    {
                        var paged = JsonSerializer.Deserialize<PagedApiResponse<T>>(content, _jsonOptions);
                        if (paged?.Data != null && paged.Data.Count > 0)
                        {
                            return paged.Data;
                        }
                    }
                    catch { }

                    // Fallback to direct List<T>
                    var list = JsonSerializer.Deserialize<List<T>>(content, _jsonOptions);
                    return list ?? new List<T>();
                }
                return new List<T>();
            }
            catch
            {
                return new List<T>();
            }
        }

        public async Task<T?> GetById<T>(string tableName, object id) where T : class, new()
        {
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
            var res = await _http.PostAsJsonAsync($"{tableName}", record);
            if (!res.IsSuccessStatusCode)
            {
                await _http.PostAsJsonAsync($"data/{tableName}", record);
            }
        }

        public async Task Update<T>(string tableName, object id, T record) where T : class, new()
        {
            var res = await _http.PutAsJsonAsync($"{tableName}/{id}", record);
            if (!res.IsSuccessStatusCode)
            {
                await _http.PutAsJsonAsync($"data/{tableName}/{id}", record);
            }
        }

        public async Task Delete(string tableName, object id)
        {
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
        public event Action? OnStorageChanged;

        public StorageServiceManager(IServiceProvider serviceProvider, JsonFileStorageService jsonService)
        {
            _serviceProvider = serviceProvider;
            CurrentService = jsonService; // Default to Local JSON Database as offline-first
        }

        public void SetStorageType(string type)
        {
            if (type == "Offline")
            {
                CurrentService = (IStorageService)_serviceProvider.GetService(typeof(JsonFileStorageService))!;
            }
            else
            {
                CurrentService = (IStorageService)_serviceProvider.GetService(typeof(ApiService))!;
            }
            OnStorageChanged?.Invoke();
        }
    }
}
`;
  files.push({ name: 'StorageServiceManager.cs', path: `${root}/Services/StorageServiceManager.cs`, content: storageServiceManager, language: 'csharp' });

  return files;
};
