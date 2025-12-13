
import { Table, Query, SelectQuery, Form, FormElement, VirtualFile, Relationship, BackendConfig } from '../../types/index';
import { resolveType, isNullable } from './common';

// Helper: Convert string to camelCase (e.g. "KundenID" -> "kundenID")
const toCamelCase = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toLowerCase() + str.slice(1);
};

// Helper: Collect all lookup configurations from the layout tree (Same logic as React generator)
const collectLookups = (element: FormElement, tables: Table[], accumulated: any[] = []) => {
    if (element.widgetType === 'select' && element.lookup && element.lookup.tableId) {
        const table = tables.find(t => t.id === element.lookup!.tableId);
        if (table) {
            const variableName = `${toCamelCase(table.name)}List`;
            // Avoid duplicates
            if (!accumulated.find(l => l.variableName === variableName)) {
                accumulated.push({
                    table,
                    variableName,
                    endpoint: table.name.toLowerCase()
                });
            }
        }
    }
    if (element.children) {
        element.children.forEach(child => collectLookups(child, tables, accumulated));
    }
    return accumulated;
};

// Helper to recursively generate HTML for Form Layout with camelCase bindings
const generateHtmlForLayout = (element: FormElement, tables: Table[]): string => {
    if (element.type === 'container') {
        const childrenHtml = element.children?.map(c => generateHtmlForLayout(c, tables)).join('\n    ') || '';
        return `<div class="${element.className || ''}">\n    ${childrenHtml}\n</div>`;
    } else if (element.type === 'label') {
        return `<div class="${element.className || 'text-lg font-bold mb-2'}">${element.label}</div>`;
    } else if (element.type === 'field' && element.fieldId) {
        // Find field definition
        let fieldName = '';
        let isAuto = false;
        let fieldType = 'text';

        for (const t of tables) {
            const f = t.fields.find(field => field.id === element.fieldId);
            if (f) {
                fieldName = f.name;
                isAuto = !!f.isAutoIncrement;
                if (f.type === 'INTEGER' || f.type === 'DECIMAL') fieldType = 'number';
                else if (f.type === 'DATE') fieldType = 'date';
                else if (f.type === 'BOOLEAN') fieldType = 'checkbox';
                break;
            }
        }

        if (!fieldName) return `<!-- Field ${element.label} not found -->`;
        const bindProp = toCamelCase(fieldName);
        
        // --- HANDLE SELECT / LOOKUP ---
        if (element.widgetType === 'select' && element.lookup) {
            const lookupTable = tables.find(t => t.id === element.lookup!.tableId);
            if (lookupTable) {
                const listVar = `${toCamelCase(lookupTable.name)}List`;
                const valueField = lookupTable.fields.find(f => f.id === element.lookup!.valueFieldId);
                const valueProp = valueField ? toCamelCase(valueField.name) : 'id';
                
                // Construct Label Expression for Angular Template
                let labelExpr = '';
                if (element.lookup.displayFormat && element.lookup.displayFormat.length > 0) {
                    const parts = element.lookup.displayFormat.map(fmt => {
                        const f = lookupTable.fields.find(field => field.id === fmt.fieldId);
                        if (!f) return "''";
                        const p = fmt.prefix ? `'${fmt.prefix}' + ` : '';
                        const s = fmt.suffix ? ` + '${fmt.suffix}'` : '';
                        // Note: Angular templates handle nulls gracefully usually, but simple concat is safest
                        return `${p}(item.${toCamelCase(f.name)} || '')${s}`;
                    });
                    labelExpr = parts.join(' + ');
                } else {
                    // Fallback
                    labelExpr = `item.${valueProp}`;
                }

                const quickCreateBtn = element.lookup.allowQuickCreate ? `
                <button 
                    type="button"
                    (click)="navigateToNew('${lookupTable.name.toLowerCase()}')"
                    class="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 rounded px-3 flex items-center justify-center transition-colors"
                    title="Neuen Eintrag erstellen"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>` : '';

                return `
                <div class="field-wrapper ${element.className || 'mb-4'}">
                    <label class="block text-sm font-medium text-gray-700 mb-1">${element.label}</label>
                    <div class="flex gap-2">
                        <select 
                            [(ngModel)]="data.${bindProp}" 
                            name="${bindProp}"
                            class="block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-2 focus:ring-blue-500 outline-none flex-1"
                            ${isAuto ? 'disabled' : ''}
                        >
                            <option [ngValue]="null">Bitte wählen...</option>
                            <option *ngFor="let item of ${listVar}" [ngValue]="item.${valueProp}">
                                {{ ${labelExpr} }}
                            </option>
                        </select>
                        ${quickCreateBtn}
                    </div>
                </div>`;
            }
        }

        // --- HANDLE CHECKBOX ---
        if (fieldType === 'checkbox') {
             return `
            <div class="flex items-center gap-2 mb-4 ${element.className || ''}">
                <input 
                    type="checkbox"
                    id="${bindProp}"
                    name="${bindProp}"
                    [(ngModel)]="data.${bindProp}"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    ${isAuto ? 'disabled' : ''}
                />
                <label for="${bindProp}" class="text-sm font-medium text-gray-700">${element.label}</label>
            </div>`;
        }

        // --- STANDARD INPUT ---
        return `
        <div class="field-wrapper ${element.className || 'mb-4'}">
            <label class="block text-sm font-medium text-gray-700 mb-1">${element.label}</label>
            <input 
                type="${fieldType}" 
                [(ngModel)]="data.${bindProp}" 
                name="${bindProp}"
                class="block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                ${isAuto ? 'disabled' : ''}
            />
        </div>`;
    } else if (element.type === 'subform') {
        return `<div class="subform-wrapper border p-4 rounded bg-indigo-50 border-indigo-200 mb-4">\n    <h3 class="font-bold text-indigo-800 mb-2">${element.label}</h3>\n    <!-- Subform Component Placeholder -->\n    <p class="text-sm text-indigo-600">Subform logic here...</p>\n</div>`;
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
      let htmlContent = `<div class="p-6 bg-white rounded shadow max-w-4xl mx-auto">\n  <h2 class="text-2xl font-bold mb-4 text-slate-800">${form.name}</h2>\n  <form *ngIf="data">\n`;
      if (form.layout) {
          htmlContent += generateHtmlForLayout(form.layout, tables);
      } else {
          htmlContent += `    <p>Kein Layout definiert.</p>`;
      }
      htmlContent += `\n    <div class="mt-6 flex justify-end gap-2 border-t pt-4">\n      <button type="button" (click)="goBack()" class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Abbrechen</button>\n      <button (click)="save()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">Speichern</button>\n    </div>\n  </form>\n</div>`;
      
      files.push({ name: `${componentName}.component.html`, path: `${root}/components/${componentName}/${componentName}.component.html`, content: htmlContent, language: 'html' });

      // CSS
      files.push({ name: `${componentName}.component.css`, path: `${root}/components/${componentName}/${componentName}.component.css`, content: `.field-wrapper { margin-bottom: 1rem; }`, language: 'css' });

      // Analyze layout to find Lookups
      const lookups = form.layout ? collectLookups(form.layout, tables) : [];
      
      // Prepare Imports
      const tableImports = new Set<string>();
      tableImports.add(tableName);
      lookups.forEach(l => tableImports.add(l.table.name));
      const importsStr = Array.from(tableImports).map(t => `import { ${t} } from '../../models/${t.toLowerCase()}.interface';`).join('\n');

      // Prepare Properties
      const lookupProperties = lookups.map(l => 
          `  public ${l.variableName}: ${l.table.name}[] = [];`
      ).join('\n');

      // Prepare Load Calls
      const loadCalls = lookups.map(l => 
          `    this.api.getAll('${l.endpoint}').subscribe(res => this.${l.variableName} = res);`
      ).join('\n');

      // TS
      const tsContent = `import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
${importsStr}

@Component({
  selector: 'app-${componentName}',
  templateUrl: './${componentName}.component.html',
  styleUrls: ['./${componentName}.component.css']
})
export class ${className} implements OnInit {
  public data: ${tableName} | any = {};
${lookupProperties}

  constructor(
    private api: ApiService<any>,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Load Lookups
${loadCalls}

    // Load Data if ID present
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
        this.api.getById('${tableName.toLowerCase()}', id).subscribe(res => this.data = res);
    }
  }

  save() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
        this.api.update('${tableName.toLowerCase()}', id, this.data).subscribe(() => this.goBack());
    } else {
        this.api.create('${tableName.toLowerCase()}', this.data).subscribe(() => this.goBack());
    }
  }

  goBack() {
    // Navigate back to list or previous page
    window.history.back();
  }

  navigateToNew(entity: string) {
    this.router.navigate(['/' + entity + '/new']);
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
