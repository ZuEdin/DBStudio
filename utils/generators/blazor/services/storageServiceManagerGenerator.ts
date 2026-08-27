import { VirtualFile } from '../../../../types/index';

export const generateStorageServiceManager = (namespace: string, root: string): VirtualFile => {
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
            if (!string.IsNullOrEmpty(type) && (
                type.Equals("API", StringComparison.OrdinalIgnoreCase) ||
                type.StartsWith("SQLite", StringComparison.OrdinalIgnoreCase) ||
                type.StartsWith("SQL", StringComparison.OrdinalIgnoreCase) ||
                type.IndexOf("API", StringComparison.OrdinalIgnoreCase) >= 0 ||
                type.IndexOf("SQL", StringComparison.OrdinalIgnoreCase) >= 0))
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
  return {
    name: 'StorageServiceManager.cs',
    path: `${root}/Services/StorageServiceManager.cs`,
    content: storageServiceManager,
    language: 'csharp'
  };
};
