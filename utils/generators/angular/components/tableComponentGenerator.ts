import { Table, Form, VirtualFile, Query, FormElement, Relationship } from '../../../../types/index';
import { toCamelCase, toKebabCase, toPascalCase } from '../../common';
import { generateHtmlForLayout } from '../layoutHelper';

const getFormParametersFromQuery = (query: any): { formName: string; fieldName: string; paramName: string }[] => {
    const params: { formName: string; fieldName: string; paramName: string }[] = [];
    if (query && query.type === 'SELECT') {
        query.columns?.forEach((c: any) => {
            c.criteria?.forEach((cr: any) => {
                if (cr) {
                    const match = cr.match(/(?:\[?Forms\]?!\s*\[?([^!\]]+)\]?!\s*\[?([^!\]\s]+)\]?)/i);
                    if (match && match.length >= 3) {
                        const formName = match[1].toLowerCase();
                        const fieldName = match[2].toLowerCase();
                        const paramName = `form_${formName}_${fieldName}`;
                        if (!params.some(p => p.paramName === paramName)) {
                            params.push({ formName, fieldName, paramName });
                        }
                    }
                }
            });
        });
    }
    return params;
};

interface RouteInfo {
  path: string;
  component: string;
  folder: string;
  file: string;
}

// Helper: Collect all unique lookup tables required by a form layout
const collectAngularLookups = (
  element: FormElement | undefined,
  tables: Table[],
  queries: Query[] = [],
  accumulated: Map<string, any> = new Map()
): any[] => {
  if (!element) return Array.from(accumulated.values());
  
  if (element.widgetType === 'select' && element.lookup?.tableId) {
      const table = tables.find(t => t.id === element.lookup!.tableId);
      
      let targetName = '';
      let sortInfo = undefined;
      let isQuery = false;
      if (table) {
          targetName = table.name;
          if (element.lookup!.sort) {
              const sortField = table.fields.find(f => f.id === element.lookup!.sort!.fieldId);
              if (sortField) sortInfo = { field: toCamelCase(sortField.name), dir: element.lookup!.sort!.direction };
          }
      } else {
          const query = queries.find(q => q.id === element.lookup!.tableId);
          if (query) {
              targetName = query.name;
              isQuery = true;
              if (element.lookup!.sort) {
                  const sortField = (query as any).columns?.find((c: any) => c.id === element.lookup!.sort!.fieldId);
                  if (sortField) sortInfo = { field: toCamelCase(sortField.alias || sortField.fieldName), dir: element.lookup!.sort!.direction };
              }
          }
      }
      if (targetName && !accumulated.has(targetName)) {
          accumulated.set(targetName, { 
              name: targetName, 
              sort: sortInfo, 
              isQuery,
              table: table || queries.find(q => q.id === element.lookup!.tableId)
          });
      }
  }
  if (element.children) {
      element.children.forEach(child => collectAngularLookups(child, tables, queries, accumulated));
  }
  return Array.from(accumulated.values());
};

// Helper: Collect Subforms to init arrays
const collectAngularSubforms = (
  element: FormElement | undefined,
  tables: Table[],
  forms: Form[],
  accumulated: any[] = []
): any[] => {
  if (!element) return accumulated;
  if (element.type === 'subform' && element.subform) {
      const subFormDef = forms.find(f => f.id === element.subform!.formId);
      const subTable = tables.find(t => t.id === subFormDef?.sourceId);
      if (subTable) {
          accumulated.push({ 
              id: element.id, 
              tableName: subTable.name, 
              childField: tables.find(t => t.id === subFormDef!.sourceId)?.fields.find(f => f.id === element.subform!.childLinkFieldId)?.name 
          });
      }
  }
  if (element.children) {
      element.children.forEach(child => collectAngularSubforms(child, tables, forms, accumulated));
  }
  return accumulated;
};

export const generateTableComponents = (
  tables: Table[],
  relationships: Relationship[],
  forms: Form[],
  appRoot: string,
  queries: Query[],
  useAuth: boolean,
  isBootstrap: boolean = false
): { files: VirtualFile[]; routes: RouteInfo[] } => {
  const files: VirtualFile[] = [];
  const routes: RouteInfo[] = [];

  tables.forEach(table => {
      const pascalName = toPascalCase(table.name);
      const camelName = toCamelCase(table.name);
      const kebabName = toKebabCase(table.name);
      const folder = pascalName;
      const pkField = table.fields.find(f => f.isPrimaryKey)?.name || 'id';
      const pkCamel = toCamelCase(pkField);

      let lookupMethodsCode = '';
      let onFieldChangeCode = `  onFieldChange(fieldName: string, value: any) {
    (this.data as any)[fieldName] = value;
  }`;

      // --- LIST COMPONENT ---
      let listHtml = '';
      if (isBootstrap) {
          listHtml = `
      <div class="container py-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="h2 text-dark">${table.name}</h1>
            <div class="d-flex gap-2 align-items-center">
                <input type="text" [(ngModel)]="search" (input)="page=1;load()" placeholder="Suche..." class="form-control form-control-sm" style="max-width: 250px;" />
                <a routerLink="/${camelName}/new" class="btn btn-primary">Neu</a>
            </div>
        </div>
        <div class="card shadow-sm border">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light border-bottom">
                        <tr>
                            ${table.fields.map(f => `<th class="px-4 py-3 text-muted fw-bold small text-uppercase">${f.name}</th>`).join('')}
                            <th class="px-4 py-3 text-muted fw-bold small text-uppercase">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let item of items" class="align-middle" (dblclick)="viewDetails(item)" style="cursor: pointer;">
                            ${table.fields.map(f => `<td class="px-4 py-3">{{getFieldValue(item, '${f.name}')}}</td>`).join('')}
                            <td class="px-4 py-3">
                                <button (click)="viewDetails(item)" class="btn btn-sm btn-link text-decoration-none me-2 p-0" title="Details"><svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg></button>
                                <a [routerLink]="['/${camelName}', getFieldValue(item, '${pkField}')]" class="btn btn-sm btn-link text-decoration-none me-2 p-0" title="Edit"><svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg></a>
                                <button (click)="delete(getFieldValue(item, '${pkField}'))" class="btn btn-sm btn-link text-danger text-decoration-none p-0" title="Delete"><svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/></svg></button>
                            </td>
                        </tr>
                        <tr *ngIf="items.length === 0">
                            <td class="p-4 text-center text-muted" colspan="${table.fields.length + 1}">Keine Einträge.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination -->
            <div class="card-footer d-flex justify-content-between align-items-center bg-light border-top">
                <span class="text-muted small">Seite {{page}} von {{totalPages}} ({{total}} Einträge)</span>
                <div class="btn-group">
                    <button (click)="changePage(page - 1)" [disabled]="page <= 1" class="btn btn-sm btn-outline-secondary">Zurück</button>
                    <button (click)="changePage(page + 1)" [disabled]="page >= totalPages" class="btn btn-sm btn-outline-secondary">Weiter</button>
                </div>
            </div>
        </div>

        <!-- Details Modal -->
        <div *ngIf="selectedItem" class="modal show d-block" style="background: rgba(0, 0, 0, 0.5);" (click)="closeDetails()">
            <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
                <div class="modal-content">
                    <div class="modal-header bg-light">
                        <h5 class="modal-title">${table.name} Details</h5>
                        <button type="button" class="btn-close" (click)="closeDetails()"></button>
                    </div>
                    <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
                        <div class="container-fluid">
                            ${table.fields.map(f => `
                            <div class="row py-2 border-bottom">
                                <div class="col-4 text-uppercase text-muted small fw-bold">${f.name}</div>
                                <div class="col-8 text-dark fw-medium text-break">{{ getFieldValue(selectedItem, '${f.name}') }}</div>
                            </div>`).join('')}
                        </div>
                    </div>
                    <div class="modal-footer bg-light">
                        <button (click)="closeDetails()" class="btn btn-secondary">Schließen</button>
                        <a [routerLink]="['/${camelName}', getFieldValue(selectedItem, '${pkField}')]" (click)="closeDetails()" class="btn btn-primary">Bearbeiten</a>
                    </div>
                </div>
            </div>
        </div>
      </div>`;
      } else {
          listHtml = `
      <div class="p-8">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold text-slate-800">${table.name}</h1>
            <div class="flex gap-4">
                <input type="text" [(ngModel)]="search" (input)="page=1;load()" placeholder="Suche..." class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <a routerLink="/${camelName}/new" class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Neu</a>
            </div>
        </div>
        <div class="bg-white rounded shadow overflow-hidden border border-slate-200">
            <table class="w-full text-left">
                <thead class="bg-slate-50 border-b">
                    <tr>
                        ${table.fields.map(f => `<th class="p-4 font-bold text-slate-600">${f.name}</th>`).join('')}
                        <th class="p-4">Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let item of items" class="border-b hover:bg-slate-50 cursor-pointer" (dblclick)="viewDetails(item)">
                        ${table.fields.map(f => `<td class="p-4">{{getFieldValue(item, '${f.name}')}}</td>`).join('')}
                        <td class="p-4">
                            <button (click)="viewDetails(item)" class="text-slate-500 hover:bg-slate-100 p-1.5 rounded mr-1" title="Details"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg></button>
                            <a [routerLink]="['/${camelName}', getFieldValue(item, '${pkField}')]" class="text-blue-600 hover:bg-blue-50 p-1.5 rounded mr-1" title="Edit"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></a>
                            <button (click)="delete(getFieldValue(item, '${pkField}'))" class="text-red-600 hover:bg-red-50 p-1.5 rounded" title="Delete"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                        </td>
                    </tr>
                    <tr *ngIf="items.length === 0">
                        <td class="p-6 text-center text-slate-400" colspan="${table.fields.length + 1}">Keine Einträge.</td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Pagination -->
            <div class="p-4 border-t flex justify-between items-center bg-slate-50">
                <span class="text-sm text-slate-500">Seite {{page}} von {{totalPages}} ({{total}} Einträge)</span>
                <div class="flex gap-2">
                    <button (click)="changePage(page - 1)" [disabled]="page <= 1" class="px-3 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-50">Zurück</button>
                    <button (click)="changePage(page + 1)" [disabled]="page >= totalPages" class="px-3 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-50">Weiter</button>
                </div>
            </div>
        </div>

        <!-- Details Modal -->
        <div *ngIf="selectedItem" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="closeDetails()">
            <div class="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200" (click)="$event.stopPropagation()">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 class="text-lg font-bold text-slate-800">${table.name} Details</h3>
                    <button (click)="closeDetails()" class="text-slate-400 hover:text-slate-600 transition">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    ${table.fields.map(f => `
                    <div class="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 last:border-0">
                        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">${f.name}</span>
                        <span class="col-span-2 text-sm text-slate-800 font-medium whitespace-pre-wrap">{{ getFieldValue(selectedItem, '${f.name}') }}</span>
                    </div>`).join('')}
                </div>
                <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                    <a [routerLink]="['/${camelName}', getFieldValue(selectedItem, '${pkField}')]" (click)="closeDetails()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold shadow-sm transition">Bearbeiten</a>
                    <button (click)="closeDetails()" class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded text-sm font-semibold transition">Schließen</button>
                </div>
            </div>
        </div>
      </div>`;
      }

      // Import the Interface
      const interfaceName = pascalName;
      
      const linkedForm = forms.find(f => f.sourceId === table.id && f.sourceType === 'table');
      const listLookups: any[] = [];
      if (linkedForm && linkedForm.layout) {
          const extractLookups = (node: any) => {
              if (node.type === 'field' && node.widgetType === 'select' && node.lookup) {
                  const tableField = table.fields.find(f => f.id === node.fieldId);
                  if (tableField) {
                      const lookupTable = tables.find(t => t.id === node.lookup.tableId);
                      const displayField = lookupTable?.fields.find(f => f.id === node.lookup.labelFields?.[0]);
                      if (lookupTable && displayField) {
                          listLookups.push({
                              fieldName: toCamelCase(tableField.name),
                              lookupTableName: toCamelCase(lookupTable.name),
                              displayFieldName: toCamelCase(displayField.name),
                              lookupStateName: `lookup_${toCamelCase(tableField.name)}`
                          });
                      }
                  }
              }
              if (node.children) {
                  node.children.forEach(extractLookups);
              }
          };
          extractLookups(linkedForm.layout);
      }

      const listTs = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ${interfaceName} } from '../../models/${interfaceName.toLowerCase()}.interface';

@Component({
  selector: 'app-${kebabName}-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './${kebabName}-list.component.html',
  styleUrl: './${kebabName}-list.component.css'
})
export class ${pascalName}ListComponent implements OnInit {
  items: ${interfaceName}[] = [];
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;
  
  search = '';
  selectedItem: any = null;
  ${listLookups.map(l => `${l.lookupStateName}: any[] = [];`).join('\n  ')}


  constructor(private api: ApiService) {}
  
  
  ngOnInit() { 
    this.load(); 
    ${listLookups.map(l => `
    this.api.getAll('${l.lookupTableName}', 1, 1000, '').subscribe((res: any) => {
      this.${l.lookupStateName} = res.data || [];
    });
    `).join('')}
  }

  
  load() { 
      this.api.getAll('${camelName}', this.page, this.pageSize, this.search).subscribe((res: any) => {
          this.items = res.data;
          this.total = res.total;
          this.page = res.page;
          this.totalPages = res.totalPages;
      }); 
  }
  
  changePage(newPage: number) {
      if (newPage >= 1 && newPage <= this.totalPages) {
          this.page = newPage;
          this.load();
      }
  }

  delete(id: any) { if(confirm('Löschen?')) this.api.delete('${camelName}', id).subscribe(() => this.load()); }

  viewDetails(item: any) { this.selectedItem = item; }
  closeDetails() { this.selectedItem = null; }

  getFieldValue(item: any, fieldName: string): any {
    if (!item) return '-';
    const camel = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
    let val = item[fieldName] !== undefined ? item[fieldName] : item[camel];
    
    ${listLookups.map(l => `
    if (camel === '${l.fieldName}') {
        const match = this.${l.lookupStateName}.find(r => String(r.id || r.Id) === String(val));
        if (match) {
            const disp = '${l.displayFieldName}';
            val = match[disp] !== undefined ? match[disp] : (match[disp.toLowerCase()] !== undefined ? match[disp.toLowerCase()] : match[disp.charAt(0).toUpperCase() + disp.slice(1)] || val);
        }
    }
    `).join('')}
    
    return val !== null && val !== undefined && val !== '' ? val : '-';
  }
}`;

      files.push({ name: `${kebabName}-list.component.html`, path: `${appRoot}/pages/${folder}/${kebabName}-list.component.html`, content: listHtml, language: 'html' });
      files.push({ name: `${kebabName}-list.component.css`, path: `${appRoot}/pages/${folder}/${kebabName}-list.component.css`, content: `/* CSS for ${kebabName}-list component */\n:host { display: block; }`, language: 'css' });
      files.push({ name: `${kebabName}-list.component.ts`, path: `${appRoot}/pages/${folder}/${kebabName}-list.component.ts`, content: listTs, language: 'typescript' });
      routes.push({ path: camelName, component: `${pascalName}ListComponent`, folder: folder, file: `${kebabName}-list.component` });


      // --- FORM COMPONENT ---
      
      
      let formHtml = '';
      let listDeclarations = '';
      let listFetches = '';
      let subformDeclarations = '';
      let subformLoads = '';
      let subformSaveLogic = '';
      let lookups: any[] = [];

      // DATA SANITIZATION LOGIC
      // Prevents empty strings for numbers/dates from being sent to API
      const sanitizationLogic = table.fields.map(f => {
          if (f.type !== 'VARCHAR' && f.type !== 'TEXT') {
              return `if ((this.data as any).${toCamelCase(f.name)} === '') (this.data as any).${toCamelCase(f.name)} = null;`;
          }
          return '';
      }).filter(s => s).join('\n      ');

      if (linkedForm && linkedForm.layout) {
          const layoutHtml = generateHtmlForLayout(linkedForm.layout, tables, forms, "data", queries, isBootstrap);
          if (isBootstrap) {
              formHtml = `<div class="container py-4" style="max-width: 800px;">
                <div class="card shadow-sm border">
                    <div class="card-header bg-dark text-white fw-bold py-3">${linkedForm.name}</div>
                    <div class="card-body p-4">
                        <form (ngSubmit)="save()">
                            ${layoutHtml}
                            <div class="mt-4 pt-4 border-top d-flex justify-content-end gap-2">
                                <a routerLink="/${camelName}" class="btn btn-outline-secondary px-4">Abbrechen</a>
                                <button type="submit" class="btn btn-primary px-4">Speichern</button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <app-user-picker 
                    [isOpen]="userPickerOpen" 
                    [initialTab]="userPickerMode"
                    (userSelected)="handleUserPicked($event)"
                    (closed)="userPickerOpen = false"
                ></app-user-picker>
              </div>`;
          } else {
              formHtml = `<div class="p-6 max-w-4xl mx-auto">
                <div class="bg-white shadow-xl rounded-xl border border-slate-200 overflow-hidden">
                    <div class="p-4 bg-slate-800 text-white font-bold">${linkedForm.name}</div>
                    <form (ngSubmit)="save()" class="p-6">
                        ${layoutHtml}
                        <div class="mt-8 flex justify-end gap-2 border-t pt-6">
                            <a routerLink="/${camelName}" class="bg-slate-100 px-6 py-2 rounded-lg border text-slate-600 hover:bg-slate-200 transition-colors">Abbrechen</a>
                            <button type="submit" class="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold shadow hover:bg-blue-700 transition-colors">Speichern</button>
                        </div>
                    </form>
                </div>
                
                <app-user-picker 
                    [isOpen]="userPickerOpen" 
                    [initialTab]="userPickerMode"
                    (userSelected)="handleUserPicked($event)"
                    (closed)="userPickerOpen = false"
                ></app-user-picker>
              </div>`;
          }

          lookups = collectAngularLookups(linkedForm.layout, tables, queries);
          listDeclarations = lookups.map((l: any) => `  public ${toCamelCase(l.name)}List: any[] = [];`).join('\n');
          
          lookupMethodsCode = lookups.map((l: any) => {
              const camel = toCamelCase(l.name);
              let sortLogic = '';
              if (l.sort) {
                  const dir = l.sort.dir === 'DESC' ? -1 : 1;
                  sortLogic = `.sort((a: any, b: any) => (a.${l.sort.field} > b.${l.sort.field} ? ${dir} : -1 * ${dir}))`;
              }
              if (l.isQuery) {
                  const formName = linkedForm.name.toLowerCase();
                  const queryParams = getFormParametersFromQuery(l.table);
                  const localDeps = queryParams.filter(p => p.formName === formName).map(p => `this.data.${toCamelCase(p.fieldName)}`);
                  
                  let checkCondition = '';
                  if (localDeps.length > 0) {
                      const conditionStr = localDeps.map(dep => `${dep} !== undefined && ${dep} !== null && ${dep} !== 'undefined' && ${dep} !== 'null' && ${dep} !== ''`).join(' && ');
                      checkCondition = `    if (!this.data || !(${conditionStr})) {
      this.${camel}List = [];
      return;
    }\n`;
                  }
                  
                  return `  loadLookup_${camel}() {
${checkCondition}    const params: Record<string, any> = {};
    if (this.data) {
        Object.keys(this.data).forEach(key => {
            const val = (this.data as any)[key];
            if (val !== undefined && val !== null && val !== 'undefined' && val !== 'null' && val !== '') {
                params['form_${formName}_' + key.toLowerCase()] = val;
            }
        });
    }
    this.api.getAll('queries/${camel}', 1, 10000, '', params).subscribe((res: any) => this.${camel}List = (res.data || res)${sortLogic});
  }`;
              } else {
                  return `  loadLookup_${camel}() {
    this.api.getAll('${camel}', 1, 10000).subscribe((res: any) => this.${camel}List = (res.data || res)${sortLogic});
  }`;
              }
          }).join('\n\n');

          listFetches = lookups.map((l: any) => `    this.loadLookup_${toCamelCase(l.name)}();`).join('\n');

          onFieldChangeCode = `  onFieldChange(fieldName: string, value: any) {
    (this.data as any)[fieldName] = value;
    // Reload query-based lookups to handle cascading changes
    ${lookups.filter((l: any) => l.isQuery).map((l: any) => `this.loadLookup_${toCamelCase(l.name)}();`).join('\n    ')}
  }`;
          
          const subforms = collectAngularSubforms(linkedForm.layout, tables, forms);
          subformDeclarations = subforms.map(s => `  public ${toCamelCase(s.tableName)}SubList_${s.id.substring(0,8)}: any[] = [];`).join('\n');
          subformLoads = subforms.map(s => {
              const tName = toCamelCase(s.tableName);
              const fName = toCamelCase(s.childField);
              const listVar = `${tName}SubList_${s.id.substring(0,8)}`;
              return `    if(id && id!=='new') this.api.getAll('${tName}', 1, 10000).subscribe((res: any) => this.${listVar} = (res.data || res).filter((x:any) => String(x.${fName}) == String(id)));`;
          }).join('\n');
          
          subformSaveLogic = `
  saveSubform(table: string, childField: string, modalId: string) {
      const parentId = this.route.snapshot.paramMap.get('id');
      if(!parentId || parentId === 'new') { alert('Bitte erst Hauptdatensatz speichern, bevor Sie Details hinzufügen.'); return; }
      
      const childProp = childField.charAt(0).toLowerCase() + childField.slice(1);
      this.tempSubData[childProp] = parentId; 
      
      this.api.create(table, this.tempSubData).subscribe(() => {
          this.closeModal(modalId);
          this.api.getAll(table, 1, 10000).subscribe((res: any) => {
              const listKeyPrefix = table + 'SubList_';
              const modalHash = modalId.replace('sub_','').substring(0,8);
              const targetKey = Object.keys(this).find(k => k.startsWith(listKeyPrefix) && k.includes(modalHash));
              if(targetKey) {
                  const allItems = res.data || res;
                  (this as any)[targetKey] = allItems.filter((x:any) => String(x[childProp]) == String(parentId));
              }
          });
      });
  }`;

      } else {
          // Default Layout logic
          if (isBootstrap) {
              const formFields = table.fields.map(f => {
                  if (f.isPrimaryKey && f.isAutoIncrement) return ''; 
                  let input = '';
                  const fieldProp = toCamelCase(f.name);
                  if (f.type === 'BOOLEAN') {
                      input = `
                      <div class="form-check">
                          <input type="checkbox" [(ngModel)]="data.${fieldProp}" name="${fieldProp}" class="form-check-input" id="check_${fieldProp}"/>
                          <label class="form-check-label fw-bold text-secondary small" for="check_${fieldProp}">${f.name}</label>
                      </div>`;
                  } else {
                      let type = 'text';
                      if (f.type === 'INTEGER' || f.type === 'DECIMAL') type = 'number';
                      if (f.type === 'DATE') type = 'date';
                      else if (f.type === 'TIME') type = 'time';
                      else if (f.type === 'DATETIME' || f.type === 'TIMESTAMP') type = 'datetime-local';
                      input = `
                      <label class="form-label fw-bold text-secondary small mb-1">${f.name}</label>
                      <input type="${type}" [(ngModel)]="data.${fieldProp}" name="${fieldProp}" class="form-control" />`;
                  }
                  return `<div class="mb-3">${input}</div>`;
              }).join('\n');

              formHtml = `
              <div class="container py-4" style="max-width: 600px;">
                <div class="card shadow-sm border">
                    <div class="card-header bg-dark text-white fw-bold py-3">{{ isNew ? 'Neu' : 'Bearbeiten' }} ${table.name}</div>
                    <div class="card-body p-4">
                        <form (ngSubmit)="save()">
                            ${formFields}
                            <div class="mt-4 pt-4 border-top d-flex justify-content-end gap-2">
                                <a routerLink="/${camelName}" class="btn btn-outline-secondary px-4">Abbrechen</a>
                                <button class="btn btn-primary px-4">Speichern</button>
                            </div>
                        </form>
                    </div>
                </div>
              </div>`;
          } else {
              const formFields = table.fields.map(f => {
                  if (f.isPrimaryKey && f.isAutoIncrement) return ''; 
                  let input = '';
                  const fieldProp = toCamelCase(f.name);
                  if (f.type === 'BOOLEAN') {
                      input = `<div class="flex items-center gap-2"><input type="checkbox" [(ngModel)]="data.${fieldProp}" name="${fieldProp}" class="w-4 h-4 rounded" /> <label>${f.name}</label></div>`;
                  } else {
                      let type = 'text';
                      if (f.type === 'INTEGER' || f.type === 'DECIMAL') type = 'number';
                      if (f.type === 'DATE') type = 'date';
                      else if (f.type === 'TIME') type = 'time';
                      else if (f.type === 'DATETIME' || f.type === 'TIMESTAMP') type = 'datetime-local';
                      input = `<label class="block text-sm font-bold mb-1">${f.name}</label><input type="${type}" [(ngModel)]="data.${fieldProp}" name="${fieldProp}" class="w-full border rounded p-2" />`;
                  }
                  return `<div class="mb-4">${input}</div>`;
              }).join('\n');

              formHtml = `
              <div class="p-8 max-w-2xl mx-auto">
                <div class="bg-white rounded shadow p-6">
                    <h2 class="text-2xl font-bold mb-6">{{ isNew ? 'Neu' : 'Bearbeiten' }} ${table.name}</h2>
                    <form (ngSubmit)="save()">
                        ${formFields}
                        <div class="flex justify-end gap-2 mt-6">
                            <a routerLink="/${camelName}" class="px-4 py-2 border rounded">Abbrechen</a>
                            <button class="px-4 py-2 bg-blue-600 text-white rounded">Speichern</button>
                        </div>
                    </form>
                </div>
              </div>`;
          }
      }

      const initObject = `{ ` + table.fields.flatMap(f => {
          let defVal = 'null';
          if (f.type === 'BOOLEAN') defVal = 'false';
          else if (f.type === 'INTEGER' || f.type === 'DECIMAL') defVal = '0';
          else defVal = `''`;
          const camel = toCamelCase(f.name);
          if (camel !== f.name) {
              return [`${camel}: ${defVal}`, `'${f.name}': ${defVal}`];
          }
          return [`${camel}: ${defVal}`];
      }).join(', ') + ` }`;

      const formTs = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { UserPickerComponent } from '../../components/user-picker/user-picker.component';
import { ${interfaceName} } from '../../models/${interfaceName.toLowerCase()}.interface';

@Component({
  selector: 'app-${kebabName}-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UserPickerComponent],
  templateUrl: './${kebabName}-form.component.html',
  styleUrl: './${kebabName}-form.component.css'
})
export class ${pascalName}FormComponent implements OnInit {
  data: ${interfaceName} = {} as ${interfaceName};
  tempData: any = {}; 
  tempSubData: any = {};
  modals: any = {};
  isNew = true;
  
  // User Picker State
  userPickerOpen = false;
  userPickerMode: 'me' | 'search' = 'me';
  userPickerTargetField = '';

${listDeclarations}
${subformDeclarations}

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}
  
  ngOnInit() {
      const id = this.route.snapshot.paramMap.get('id');
      if (id && id !== 'new') {
          this.isNew = false;
          this.api.getById('${camelName}', id).subscribe((res: any) => {
              this.data = res;
              if (this.data) {
                  ${table.fields.map(f => {
                      const prop = toCamelCase(f.name);
                      if (prop !== f.name) {
                          return `if ((this.data as any).${prop} === undefined) (this.data as any).${prop} = (this.data as any)['${f.name}'];
                  if ((this.data as any)['${f.name}'] === undefined) (this.data as any)['${f.name}'] = (this.data as any).${prop};`;
                      }
                      return '';
                  }).filter(Boolean).join('\n                  ')}
              }
              ${table.fields.filter(f => f.type === 'DATE').map(f => `
              if ((this.data as any).${toCamelCase(f.name)}) {
                  (this.data as any).${toCamelCase(f.name)} = ((this.data as any).${toCamelCase(f.name)} as any).split('T')[0];
              }
              if ((this.data as any)['${f.name}']) {
                  (this.data as any)['${f.name}'] = ((this.data as any)['${f.name}'] as any).split('T')[0];
              }`).join('\n              ')}
              // Reload query-based lookups now that data has been loaded asynchronously
              ${lookups.filter((l: any) => l.isQuery).map((l: any) => `this.loadLookup_${toCamelCase(l.name)}();`).join('\n              ')}
          });
          ${subformLoads}
      } else {
          this.data = ${initObject} as unknown as ${interfaceName};
      }
${listFetches}
  }

  save() {
      // Auto-Sanitize empty strings to null for backend compatibility
      ${sanitizationLogic}

      const op = this.isNew ? this.api.create('${camelName}', this.data) : this.api.update('${camelName}', (this.data as any).${pkCamel}, this.data);
      op.subscribe({
          next: () => this.router.navigate(['/${camelName}']),
          error: (err) => alert('Fehler beim Speichern: ' + (err.error?.title || err.message))
      });
  }

  openModal(id: string) { this.modals[id] = true; this.tempData = {}; this.tempSubData = {}; }
  closeModal(id: string) { this.modals[id] = false; }

  saveLookup(table: string, modalId: string) {
      this.api.create(table, this.tempData).subscribe(() => {
          this.closeModal(modalId);
          this.api.getAll(table, 1, 10000).subscribe((res: any) => (this as any)[table + 'List'] = res.data || res);
      });
  }

  openUserPicker(mode: 'me' | 'search', field: string) {
      this.userPickerMode = mode;
      this.userPickerTargetField = field;
      this.userPickerOpen = true;
  }

  handleUserPicked(event: {username: string, displayName: string}) {
      if (this.userPickerTargetField) {
          (this.data as any)[this.userPickerTargetField] = event.username;
      }
      this.userPickerOpen = false;
  }

${lookupMethodsCode}

${onFieldChangeCode}

  ${subformSaveLogic}
}`;

      files.push({ name: `${kebabName}-form.component.html`, path: `${appRoot}/pages/${folder}/${kebabName}-form.component.html`, content: formHtml, language: 'html' });
      files.push({ name: `${kebabName}-form.component.css`, path: `${appRoot}/pages/${folder}/${kebabName}-form.component.css`, content: `/* CSS for ${kebabName}-form component */\n:host { display: block; }`, language: 'css' });
      files.push({ name: `${kebabName}-form.component.ts`, path: `${appRoot}/pages/${folder}/${kebabName}-form.component.ts`, content: formTs, language: 'typescript' });
      
      routes.push({ path: `${camelName}/:id`, component: `${pascalName}FormComponent`, folder: folder, file: `${kebabName}-form.component` });
  });

  return { files, routes };
};
