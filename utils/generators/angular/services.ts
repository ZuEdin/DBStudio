
import { Table, VirtualFile, BackendConfig, Query, SelectQuery } from '../../../types/index';
import { toCamelCase, toPascalCase, isNullable, resolveType } from '../common';

export const generateAngularServices = (tables: Table[], queries: Query[], config: BackendConfig, appRoot: string): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // Table Models
  tables.forEach(table => {
    const safeName = toPascalCase(table.name);
    const props = table.fields.map(f => `  ${toCamelCase(f.name)}${isNullable(f) ? '?' : ''}: ${resolveType(f, 'typescript')};`);
    
    files.push({ 
        name: `${safeName.toLowerCase()}.interface.ts`, 
        path: `${appRoot}/models/${safeName.toLowerCase()}.interface.ts`, 
        content: `export interface ${safeName} {\n${props.join('\n')}\n}`, 
        language: 'typescript' 
    });
  });

  // Query Models
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

      files.push({ 
        name: `${safeName.toLowerCase()}.interface.ts`, 
        path: `${appRoot}/models/${safeName.toLowerCase()}.interface.ts`, 
        content: `export interface ${safeName} {\n${props.join('\n')}\n}`, 
        language: 'typescript' 
    });
  });

  // API Service
  const apiService = `import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://localhost:${config.port}/api';

  constructor(private http: HttpClient) { }

  getAll(endpoint: string): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl + '/' + endpoint);
  }

  getById(endpoint: string, id: any): Observable<any> {
    return this.http.get<any>(this.baseUrl + '/' + endpoint + '/' + id);
  }

  create(endpoint: string, item: any): Observable<any> {
    return this.http.post<any>(this.baseUrl + '/' + endpoint, item);
  }

  update(endpoint: string, id: any, item: any): Observable<any> {
    return this.http.put<any>(this.baseUrl + '/' + endpoint + '/' + id, item);
  }

  delete(endpoint: string, id: any): Observable<void> {
    return this.http.delete<void>(this.baseUrl + '/' + endpoint + '/' + id);
  }
}`;
  files.push({ name: 'api.service.ts', path: `${appRoot}/services/api.service.ts`, content: apiService, language: 'typescript' });

  return files;
};
