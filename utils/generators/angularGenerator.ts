
import { Table, Query, SelectQuery, Form, FormElement, VirtualFile, Relationship, BackendConfig } from '../../types/index';
import { resolveType, isNullable } from './common';

// Helper: Convert string to camelCase (e.g. "KundenID" -> "kundenID")
const toCamelCase = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toLowerCase() + str.slice(1);
};

// Helper to find field name by ID for layout generation
const findFieldName = (fieldId: string, tables: Table[]) => {
    for (const t of tables) {
        const f = t.fields.find(field => field.id === fieldId);
        if (f) return f.name;
    }
    return null;
};

// Helper to recursively generate HTML for Form Layout with camelCase bindings
const generateHtmlForLayout = (element: FormElement, tables: Table[]): string => {
    if (element.type === 'container') {
        const childrenHtml = element.children?.map(c => generateHtmlForLayout(c, tables)).join('\n    ') || '';
        return `<div class="${element.className || ''}">\n    ${childrenHtml}\n</div>`;
    } else if (element.type === 'label') {
        return `<div class="${element.className || ''}">${element.label}</div>`;
    } else if (element.type === 'field' && element.fieldId) {
        const fieldName = findFieldName(element.fieldId, tables);
        // Use camelCase property access
        const bindProp = fieldName ? toCamelCase(fieldName) : `field_${element.fieldId}`;
        
        return `
        <div class="field-wrapper ${element.className || ''}">
            <label class="block text-sm font-medium text-gray-700">${element.label}</label>
            <input [(ngModel)]="data.${bindProp}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>`;
    } else if (element.type === 'subform') {
        return `<div class="subform-wrapper border p-4 rounded">\n    <h3>${element.label}</h3>\n    <!-- Subform Component Placeholder -->\n    <app-subform-${element.subform?.formId}></app-subform-${element.subform?.formId}>\n</div>`;
    }
    return '';
};

export const generateAngular = (tables: Table[], relationships: Relationship[], queries: Query[], forms: Form[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Frontend/src/app`;
  const envRoot = `Frontend/src/environments`;

  // 0. Environments
  const envContent = `export const environment = {
  production: false,
  apiUrl: 'http://localhost:${config.port}/api'
};`;
  files.push({ name: 'environment.ts', path: `${envRoot}/environment.ts`, content: envContent, language: 'typescript' });

  const envProdContent = `export const environment = {
  production: true,
  apiUrl: '/api'
};`;
  files.push({ name: 'environment.prod.ts', path: `${envRoot}/environment.prod.ts`, content: envProdContent, language: 'typescript' });

  // 1. Interfaces for Tables (Models)
  tables.forEach(table => {
    // Basic Fields
    const props = table.fields.map(f => {
        const tsType = resolveType(f, 'typescript');
        const optional = isNullable(f) ? '?' : '';
        // FORCE camelCase for property names
        return `  ${toCamelCase(f.name)}${optional}: ${tsType};`;
    });

    // Navigation Properties (Relationships)
    // 1. Parent Relations (BelongsTo) -> Single Object
    const parentRels = relationships.filter(r => r.toTableId === table.id);
    parentRels.forEach(r => {
        const parent = tables.find(t => t.id === r.fromTableId);
        if(parent) {
             props.push(`  ${toCamelCase(parent.name)}?: ${parent.name};`);
        }
    });

    // 2. Child Relations (HasMany) -> Array
    const childRels = relationships.filter(r => r.fromTableId === table.id);
    childRels.forEach(r => {
        const child = tables.find(t => t.id === r.toTableId);
        if(child) {
             // Matches the .NET generator's pluralization logic (name + "s")
             props.push(`  ${toCamelCase(child.name)}s?: ${child.name}[];`);
        }
    });
    
    const content = `export interface ${table.name} {
${props.join('\n')}
}`;
    files.push({ name: `${table.name.toLowerCase()}.interface.ts`, path: `${root}/models/${table.name.toLowerCase()}.interface.ts`, content: content, language: 'typescript' });
  });

  // 2. Interfaces for Query Results
  queries.forEach(q => {
      if (q.type !== 'SELECT') return;
      const selectQuery = q as SelectQuery;
      const props = selectQuery.columns.filter(c => c.show).map(c => {
          let tsType = 'string';
          if (c.aggregate === 'COUNT' || c.aggregate === 'SUM' || c.aggregate === 'AVG') tsType = 'number';
          
          const propName = c.alias || c.fieldName;
          // FORCE camelCase
          return `  ${toCamelCase(propName)}: ${tsType};`;
      }).join('\n');

      const content = `export interface ${q.name.replace(/\s+/g, '')}Result {
${props}
}`;
      files.push({ name: `${q.name.replace(/\s+/g, '').toLowerCase()}.result.ts`, path: `${root}/models/queries/${q.name.replace(/\s+/g, '').toLowerCase()}.result.ts`, content: content, language: 'typescript' });
  });

  // 3. Forms as Components
  forms.forEach(form => {
      const componentName = form.name.replace(/\s+/g, '-').toLowerCase();
      const className = form.name.replace(/\s+/g, '') + 'Component';
      
      const sourceTable = tables.find(t => t.id === form.sourceId);
      const tableName = sourceTable ? sourceTable.name : 'any';

      // HTML Template
      let htmlContent = `<div class="p-6 bg-white rounded shadow">\n  <h2 class="text-2xl font-bold mb-4">${form.name}</h2>\n  <form *ngIf="data">\n`;
      if (form.layout) {
          htmlContent += generateHtmlForLayout(form.layout, tables);
      } else {
          htmlContent += `    <p>Kein Layout definiert.</p>`;
      }
      htmlContent += `\n    <div class="mt-6 flex justify-end gap-2">\n      <button (click)="save()" class="px-4 py-2 bg-blue-600 text-white rounded">Speichern</button>\n    </div>\n  </form>\n</div>`;
      
      files.push({ name: `${componentName}.component.html`, path: `${root}/components/${componentName}/${componentName}.component.html`, content: htmlContent, language: 'html' });

      // CSS
      files.push({ name: `${componentName}.component.css`, path: `${root}/components/${componentName}/${componentName}.component.css`, content: `.field-wrapper { margin-bottom: 1rem; }`, language: 'css' });

      // TS
      const tsContent = `import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { ${sourceTable?.name || 'any'} } from '../../models/${sourceTable?.name.toLowerCase() || 'any'}.interface';

@Component({
  selector: 'app-${componentName}',
  templateUrl: './${componentName}.component.html',
  styleUrls: ['./${componentName}.component.css']
})
export class ${className} implements OnInit {
  data: ${tableName} | any = {};

  constructor(private api: ApiService<${tableName}>) {}

  ngOnInit(): void {
    // Load initial data if needed
  }

  save() {
    console.log('Saving data', this.data);
    this.api.create('${tableName.toLowerCase()}', this.data).subscribe(res => {
        alert('Gespeichert!');
    });
  }
}`;
      files.push({ name: `${componentName}.component.ts`, path: `${root}/components/${componentName}/${componentName}.component.ts`, content: tsContent, language: 'typescript' });
  });

  // 4. Generic Service
  const serviceContent = `import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService<T> {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAll(endpoint: string): Observable<T[]> {
    return this.http.get<T[]>(this.baseUrl + '/' + endpoint);
  }

  getById(endpoint: string, id: any): Observable<T> {
    return this.http.get<T>(this.baseUrl + '/' + endpoint + '/' + id);
  }

  create(endpoint: string, item: T): Observable<T> {
    return this.http.post<T>(this.baseUrl + '/' + endpoint, item);
  }

  update(endpoint: string, id: any, item: T): Observable<T> {
    return this.http.put<T>(this.baseUrl + '/' + endpoint + '/' + id, item);
  }

  delete(endpoint: string, id: any): Observable<void> {
    return this.http.delete<void>(this.baseUrl + '/' + endpoint + '/' + id);
  }
  
  executeQuery<R>(queryName: string): Observable<R[]> {
      return this.http.get<R[]>(this.baseUrl + '/queries/' + queryName);
  }
}`;
  files.push({ name: 'api.service.ts', path: `${root}/services/api.service.ts`, content: serviceContent, language: 'typescript' });

  return files;
};
