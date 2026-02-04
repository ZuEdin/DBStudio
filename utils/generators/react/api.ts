
import { Table, VirtualFile, BackendConfig, Query, SelectQuery } from '../../../types/index';
import { toCamelCase, toPascalCase, isNullable, resolveType } from '../common';

export const generateReactApi = (tables: Table[], queries: Query[], config: BackendConfig, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const useAuth = config.authConfig?.useUserLogin;
  
  const apiService = `import axios from 'axios';
const API_URL = 'http://localhost:${config.port}/api';

export const api = axios.create({ baseURL: API_URL });

// Auth Interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
});

export interface PagedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export const get = async <T>(endpoint: string, params?: any) => {
    const response = await api.get<PagedResponse<T> | T[]>(endpoint, { params });
    // Normalize response: if backend returns array (old) or paged object (new)
    if (Array.isArray(response.data)) {
        return { data: response.data, total: response.data.length, page: 1, pageSize: response.data.length, totalPages: 1 };
    }
    return response.data as PagedResponse<T>;
};

export const post = async <T>(endpoint: string, data: any) => (await api.post<T>(endpoint, data)).data;
export const put = async <T>(endpoint: string, data: any) => (await api.put<T>(endpoint, data)).data;
export const remove = async (endpoint: string) => await api.delete(endpoint);

${useAuth ? `
// Auth API
export const loginUser = async (credentials: any) => {
    const { data } = await api.post('/auth/login', credentials);
    if (data.token) {
        localStorage.setItem('auth_token', data.token);
    }
    return data;
};

export const registerUser = async (userData: any) => {
    return await api.post('/auth/register', userData);
};

export const changePassword = async (data: any) => {
    return await api.post('/auth/change-password', data);
};

export const logoutUser = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
};
` : ''}`;
  
  files.push({ name: 'api.ts', path: `${root}/src/services/api.ts`, content: apiService, language: 'typescript' });

  let typesContent = '';
  
  // Table Interfaces
  tables.forEach(table => {
    const safeName = toPascalCase(table.name);
    const props = table.fields.map(f => `  ${toCamelCase(f.name)}${isNullable(f) ? '?' : ''}: ${resolveType(f, 'typescript')};`);
    typesContent += `export interface ${safeName} {\n${props.join('\n')}\n}\n\n`;
  });

  // Query Interfaces
  queries.filter(q => q.type === 'SELECT').forEach(q => {
      const query = q as SelectQuery;
      const safeName = toPascalCase(q.name);
      const usedNames = new Set<string>(); // Track used property names to prevent duplicates
      
      const props = query.columns.filter(c => c.show).map(c => {
          let type = 'string';
          const table = tables.find(t => t.id === c.tableId);
          const field = table?.fields.find(f => f.id === c.fieldId);
          if (field) {
              type = resolveType(field, 'typescript');
          }
          if (c.aggregate === 'COUNT') type = 'number';
          
          // Naming Logic: Alias -> FieldName -> FieldName + TableName -> FieldName + Counter
          let rawName = c.alias && c.alias.trim() !== '' ? c.alias : c.fieldName;
          let propName = toCamelCase(rawName);

          if (usedNames.has(propName)) {
              // Collision detected! Try appending TableName
              const tableSuffix = toPascalCase(c.tableName);
              propName = toCamelCase(`${rawName}${tableSuffix}`);
          }

          // If still collision, append number
          let counter = 2;
          const originalPropName = propName;
          while (usedNames.has(propName)) {
              propName = `${originalPropName}${counter}`;
              counter++;
          }

          usedNames.add(propName);
          return `  ${propName}?: ${type};`;
      });
      
      typesContent += `export interface ${safeName} {\n${props.join('\n')}\n}\n\n`;
  });

  files.push({ name: 'types.ts', path: `${root}/src/types/index.ts`, content: typesContent, language: 'typescript' });

  return files;
};
