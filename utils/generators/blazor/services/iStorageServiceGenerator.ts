import { VirtualFile } from '../../../../types/index';

export const generateIStorageService = (namespace: string, root: string): VirtualFile => {
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
  return {
    name: 'IStorageService.cs',
    path: `${root}/Services/IStorageService.cs`,
    content: iStorageService,
    language: 'csharp'
  };
};
