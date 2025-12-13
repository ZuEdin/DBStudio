
import { Table, VirtualFile, BackendConfig, Query, SelectQuery } from '../../../types/index';
import { toCamelCase, toPascalCase, isNullable, resolveType } from '../common';

export const generateReactApi = (tables: Table[], queries: Query[], config: BackendConfig, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  
  const apiService = `import axios from 'axios';
const API_URL = 'http://localhost:${config.port}/api';
export const api = axios.create({ baseURL: API_URL });
export const get = async <T>(endpoint: string) => (await api.get<T>(endpoint)).data;
export const post = async <T>(endpoint: string, data: any) => (await api.post<T>(endpoint, data)).data;
export const put = async <T>(endpoint: string, data: any) => (await api.put<T>(endpoint, data)).data;
export const remove = async (endpoint: string) => await api.delete(endpoint);`;
  
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
      
      const props = query.columns.filter(c => c.show).map(c => {
          let type = 'string';
          const table = tables.find(t => t.id === c.tableId);
          const field = table?.fields.find(f => f.id === c.fieldId);
          if (field) {
              type = resolveType(field, 'typescript');
          }
          if (c.aggregate === 'COUNT') type = 'number';
          
          const propName = toCamelCase(c.alias || c.fieldName);
          return `  ${propName}?: ${type};`;
      });
      
      typesContent += `export interface ${safeName} {\n${props.join('\n')}\n}\n\n`;
  });

  files.push({ name: 'types.ts', path: `${root}/src/types/index.ts`, content: typesContent, language: 'typescript' });

  return files;
};
