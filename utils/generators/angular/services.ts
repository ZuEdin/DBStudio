
import { Table, VirtualFile, BackendConfig } from '../../../types/index';
import { toCamelCase, isNullable, resolveType } from '../common';

export const generateAngularServices = (tables: Table[], config: BackendConfig, appRoot: string): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // Models
  tables.forEach(table => {
    const props = table.fields.map(f => `  ${toCamelCase(f.name)}${isNullable(f) ? '?' : ''}: ${resolveType(f, 'typescript')};`);
    files.push({ name: `${table.name.toLowerCase()}.interface.ts`, path: `${appRoot}/models/${table.name.toLowerCase()}.interface.ts`, content: `export interface ${table.name} {\n${props.join('\n')}\n}`, language: 'typescript' });
  });

  // API Service
  const apiService = `import { Injectable } from '@angular/core'; import { HttpClient } from '@angular/common/http'; import { Observable } from 'rxjs';
@Injectable({ providedIn: 'root' }) export class ApiService {
  private baseUrl = 'http://localhost:${config.port}/api';
  constructor(private http: HttpClient) { }
  getAll(endpoint: string): Observable<any[]> { return this.http.get<any[]>(this.baseUrl + '/' + endpoint); }
  getById(endpoint: string, id: any): Observable<any> { return this.http.get<any>(this.baseUrl + '/' + endpoint + '/' + id); }
  create(endpoint: string, item: any): Observable<any> { return this.http.post<any>(this.baseUrl + '/' + endpoint, item); }
  update(endpoint: string, id: any, item: any): Observable<any> { return this.http.put<any>(this.baseUrl + '/' + endpoint + '/' + id, item); }
  delete(endpoint: string, id: any): Observable<void> { return this.http.delete<void>(this.baseUrl + '/' + endpoint + '/' + id); }
}`;
  files.push({ name: 'api.service.ts', path: `${appRoot}/services/api.service.ts`, content: apiService, language: 'typescript' });

  return files;
};
