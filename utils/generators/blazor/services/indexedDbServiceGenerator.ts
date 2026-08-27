import { VirtualFile } from '../../../../types/index';

export const generateIndexedDbService = (namespace: string, root: string): VirtualFile => {
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
  return {
    name: 'IndexedDbService.cs',
    path: `${root}/Services/IndexedDbService.cs`,
    content: indexedDbService,
    language: 'csharp'
  };
};
