
import { Table, VirtualFile, BackendConfig } from '../../../types/index';
import { toCamelCase, isNullable, resolveType } from '../common';

export const generateReactApi = (tables: Table[], config: BackendConfig, root: string): VirtualFile[] => {
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
  tables.forEach(table => {
    const props = table.fields.map(f => `  ${toCamelCase(f.name)}${isNullable(f) ? '?' : ''}: ${resolveType(f, 'typescript')};`);
    typesContent += `export interface ${table.name} {\n${props.join('\n')}\n}\n\n`;
  });
  files.push({ name: 'types.ts', path: `${root}/src/types/index.ts`, content: typesContent, language: 'typescript' });

  return files;
};
