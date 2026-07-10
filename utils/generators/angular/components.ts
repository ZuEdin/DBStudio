
import { Table, Form, Report, VirtualFile, BackendConfig, Query, Relationship, FormElement } from '../../../types/index';
import { toCamelCase, toKebabCase, toPascalCase } from '../common';
import { generateHtmlForLayout } from './layoutHelper';

interface RouteInfo {
  path: string;
  component: string;
  folder: string;
  file: string;
}

// Helper: Collect all unique lookup tables required by a form layout
const collectAngularLookups = (element: FormElement | undefined, tables: Table[], queries: Query[] = [], accumulated: Map<string, any> = new Map()): any[] => {
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
            accumulated.set(targetName, { name: targetName, sort: sortInfo, isQuery });
        }
    
    }
    if (element.children) {
        element.children.forEach(child => collectAngularLookups(child, tables, queries, accumulated));
    }
    return Array.from(accumulated.values());
};

// Helper: Collect Subforms to init arrays
const collectAngularSubforms = (element: FormElement | undefined, tables: Table[], forms: Form[], accumulated: any[] = []): any[] => {
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

export const generateAngularComponents = (tables: Table[], relationships: Relationship[], forms: Form[], reports: Report[], config: BackendConfig, appRoot: string, queries: Query[], pages: any[] = []): { files: VirtualFile[], routes: RouteInfo[] } => {
  const files: VirtualFile[] = [];
  const routes: RouteInfo[] = [];
  const useAuth = config.authConfig?.useUserLogin;

  // Iterate Tables to generate List and Form components
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
      const listHtml = `
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
                        ${table.fields.map(f => `<td class="p-4">{{item.${toCamelCase(f.name)}}}</td>`).join('')}
                        <td class="p-4">
                            <button (click)="viewDetails(item)" class="text-indigo-600 hover:underline mr-3 font-semibold">Details</button>
                            <a [routerLink]="['/${camelName}', item.${pkCamel}]" class="text-blue-600 hover:underline mr-3 font-semibold">Edit</a>
                            <button (click)="delete(item.${pkCamel})" class="text-red-600 hover:underline font-semibold">Delete</button>
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
                        <span class="col-span-2 text-sm text-slate-800 font-medium whitespace-pre-wrap">{{ selectedItem.${toCamelCase(f.name)} !== null && selectedItem.${toCamelCase(f.name)} !== undefined && selectedItem.${toCamelCase(f.name)} !== '' ? selectedItem.${toCamelCase(f.name)} : '-' }}</span>
                    </div>`).join('')}
                </div>
                <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                    <a [routerLink]="['/${camelName}', selectedItem.${pkCamel}]" (click)="closeDetails()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold shadow-sm transition">Bearbeiten</a>
                    <button (click)="closeDetails()" class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded text-sm font-semibold transition">Schließen</button>
                </div>
            </div>
        </div>
      </div>`;

      // Import the Interface
      const interfaceName = pascalName;
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
  templateUrl: './${kebabName}-list.component.html'
})
export class ${pascalName}ListComponent implements OnInit {
  items: ${interfaceName}[] = [];
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;
  search = '';
  selectedItem: any = null;

  constructor(private api: ApiService) {}
  
  ngOnInit() { this.load(); }
  
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
}`;

      files.push({ name: `${kebabName}-list.component.html`, path: `${appRoot}/pages/${folder}/${kebabName}-list.component.html`, content: listHtml, language: 'html' });
      files.push({ name: `${kebabName}-list.component.ts`, path: `${appRoot}/pages/${folder}/${kebabName}-list.component.ts`, content: listTs, language: 'typescript' });
      routes.push({ path: camelName, component: `${pascalName}ListComponent`, folder: folder, file: `${kebabName}-list.component` });


      // --- FORM COMPONENT ---
      const linkedForm = forms.find(f => f.sourceId === table.id && f.sourceType === 'table');
      
      let formHtml = '';
      let listDeclarations = '';
      let listFetches = '';
      let subformDeclarations = '';
      let subformLoads = '';
      let subformSaveLogic = '';

      // DATA SANITIZATION LOGIC
      // Prevents empty strings for numbers/dates from being sent to API
      const sanitizationLogic = table.fields.map(f => {
          if (f.type !== 'VARCHAR' && f.type !== 'TEXT') {
              return `if ((this.data as any).${toCamelCase(f.name)} === '') (this.data as any).${toCamelCase(f.name)} = null;`;
          }
          return '';
      }).filter(s => s).join('\n      ');

      if (linkedForm && linkedForm.layout) {
          const layoutHtml = generateHtmlForLayout(linkedForm.layout, tables, forms, "data", queries);
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

          const lookups = collectAngularLookups(linkedForm.layout, tables, queries);
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
                  return `  loadLookup_${camel}() {
    const params: Record<string, any> = {};
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

      const initObject = `{ ` + table.fields.map(f => {
          let defVal = 'null';
          if (f.type === 'BOOLEAN') defVal = 'false';
          else if (f.type === 'INTEGER' || f.type === 'DECIMAL') defVal = '0';
          else defVal = `''`;
          return `${toCamelCase(f.name)}: ${defVal}`;
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
  templateUrl: './${kebabName}-form.component.html'
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
              ${table.fields.filter(f => f.type === 'DATE').map(f => `
              if (this.data.${toCamelCase(f.name)}) {
                  this.data.${toCamelCase(f.name)} = (this.data.${toCamelCase(f.name)} as any).split('T')[0];
              }`).join('\n')}
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
      files.push({ name: `${kebabName}-form.component.ts`, path: `${appRoot}/pages/${folder}/${kebabName}-form.component.ts`, content: formTs, language: 'typescript' });
      
      routes.push({ path: `${camelName}/:id`, component: `${pascalName}FormComponent`, folder: folder, file: `${kebabName}-form.component` });
  });

  // --- REPORT GENERATION (unchanged, just passed through) ---
  reports.forEach(report => {
      const pascalName = toPascalCase(report.name);
      const kebabName = toKebabCase(report.name);
      const folder = 'reports';
      const sourceName = report.sourceType === 'table' 
          ? toCamelCase(tables.find(t => t.id === report.sourceId)?.name || '') 
          : toCamelCase(queries.find(q => q.id === report.sourceId)?.name || '');
      const groupingField = tables.find(t => t.id === report.sourceId)?.fields.find(f => f.id === report.groupingFieldId)?.name;
      const groupingProp = groupingField ? toCamelCase(groupingField) : null;

      const reportHtml = `
      <div class="p-8 max-w-[210mm] mx-auto bg-white shadow-lg min-h-screen my-8 print:shadow-none print:m-0">
          <header class="border-b-4 border-slate-800 pb-4 mb-8">
              <h1 class="text-3xl font-bold">${report.name}</h1>
              <p class="text-slate-500">Erstellt am: {{ today | date }}</p>
          </header>
          <main>
              <div *ngFor="let group of reportData" class="mb-8 break-inside-avoid">
                  <div *ngIf="group.groupValue !== 'Gesamt'" class="bg-slate-100 p-2 border border-slate-200 rounded-t-md font-bold text-lg text-slate-700">
                      ${groupingField}: {{ group.groupValue }}
                  </div>
                  <table class="w-full border-collapse text-sm">
                      <thead>
                          <tr class="border-b border-slate-400 text-left">
                              ${report.columns?.filter(c => c.visible).map(c => `<th class="p-2 font-bold uppercase text-slate-600 text-xs">${c.label}</th>`).join('')}
                          </tr>
                      </thead>
                      <tbody>
                          <tr *ngFor="let item of group.items" class="border-b border-slate-200">
                              ${report.columns?.filter(c => c.visible).map(c => {
                                  let fieldName = '';
                                  if(report.sourceType === 'table') { fieldName = tables.find(t=>t.id===report.sourceId)?.fields.find(f=>f.id===c.fieldId)?.name || ''; } else { fieldName = c.label; }
                                  return `<td class="p-2 whitespace-nowrap">{{ item.${toCamelCase(fieldName)} }}</td>`;
                              }).join('')}
                          </tr>
                      </tbody>
                  </table>
                  <div *ngIf="group.summaries" class="bg-slate-50 p-2 mt-2 border-t-2 border-slate-300 rounded-b-md text-right text-sm">
                      <span *ngFor="let sum of group.summaries | keyvalue" class="ml-4"><strong>{{ sum.key }}:</strong> {{ sum.value }}</span>
                  </div>
              </div>
              <div *ngIf="reportData.length === 0" class="p-6 text-center text-slate-500">Keine Daten.</div>
          </main>
      </div>`;

      const reportTs = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-${kebabName}-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './${kebabName}-report.component.html'
})
export class ${pascalName}ReportComponent implements OnInit {
  reportData: any[] = [];
  today = new Date();
  constructor(private api: ApiService) {}
  ngOnInit() { this.api.getAll('${sourceName}', 1, 10000).subscribe((res: any) => { this.processData(res.data || res); }); }
  processData(data: any[]) {
      const groupingProp = '${groupingProp}';
      if (!groupingProp || groupingProp === 'null') {
          this.reportData = [{ groupValue: 'Gesamt', items: data, summaries: this.calcSummaries(data) }];
          return;
      }
      const groups: any = {};
      data.forEach(row => { const key = row[groupingProp] || 'Unbekannt'; if (!groups[key]) groups[key] = []; groups[key].push(row); });
      this.reportData = Object.keys(groups).sort().map(key => ({ groupValue: key, items: groups[key], summaries: this.calcSummaries(groups[key]) }));
  }
  calcSummaries(items: any[]) {
      const summaries: any = {};
      ${report.summaries.map(s => {
          const prop = toCamelCase(s.fieldName);
          if (s.calculation === 'COUNT') return `summaries['Anzahl ${s.fieldName}'] = items.length;`;
          if (s.calculation === 'SUM') return `summaries['Summe ${s.fieldName}'] = items.reduce((acc, curr) => acc + (Number(curr.${prop}) || 0), 0);`;
          return '';
      }).join('\n      ')}
      return summaries;
  }
}`;
      files.push({ name: `${kebabName}-report.component.html`, path: `${appRoot}/pages/${folder}/${kebabName}-report.component.html`, content: reportHtml, language: 'html' });
      files.push({ name: `${kebabName}-report.component.ts`, path: `${appRoot}/pages/${folder}/${kebabName}-report.component.ts`, content: reportTs, language: 'typescript' });
      routes.push({ path: `reports/${kebabName}`, component: `${pascalName}ReportComponent`, folder: folder, file: `${kebabName}-report.component` });
  });

  // --- CUSTOM PAGE GENERATION ---
  pages.forEach(page => {
      const pascalName = toPascalCase(page.name);
      const kebabName = toKebabCase(page.name);
      const folder = 'custom';
      const compName = `${pascalName}CustomComponent`;

      const states: string[] = [];
      const initCalls: string[] = [];
      const methods: string[] = [];

      const generateNode = (node: any): string => {
          if (!node) return '';
          
          let classNameStr = node.props?.className || '';
          let styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';
          
          switch(node.type) {
              case 'container': {
                  const childrenStr = (node.children || []).map((c: any) => generateNode(c)).join('\n');
                  return `<div class="${classNameStr || 'p-4 border rounded'}" ${styleAttr}>${childrenStr}</div>`;
              }
              case 'text': {
                  return `<div class="break-words ${classNameStr}" ${styleAttr}>${node.props?.text || ''}</div>`;
              }
              case 'button': {
                  return `<button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition ${classNameStr}" ${styleAttr}>${node.props?.label || 'Button'}</button>`;
              }
              case 'divider': {
                  return `<hr class="border-slate-200 my-4 ${classNameStr}" ${styleAttr} />`;
              }
              case 'image': {
                  return `<img referrerPolicy="no-referrer" src="${node.props?.src || ''}" class="max-w-full h-auto rounded ${classNameStr}" ${styleAttr} alt="${node.props?.alt || ''}" />`;
              }
              case 'html': {
                  const escapedHtml = (node.props?.html || '').replace(/'/g, "\\'");
                  return `<div [innerHTML]="'${escapedHtml}'" class="${classNameStr}" ${styleAttr}></div>`;
              }
              case 'dropdown': {
                  const stateName = `dropdownData_${node.id.replace(/-/g, '_')}`;
                  const loadingState = `dropdownLoading_${node.id.replace(/-/g, '_')}`;
                  states.push(`${stateName}: any[] = [];`);
                  states.push(`${loadingState} = false;`);
                  
                  let fetchUrl = '';
                  if (node.props?.queryId) {
                      const qObj = queries.find(q => q.id === node.props.queryId);
                      if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
                  } else if (node.props?.dataSourceId) {
                      const tObj = tables.find(t => t.id === node.props.dataSourceId);
                      if (tObj) fetchUrl = `${toCamelCase(tObj.name)}`;
                  }
                  
                  if (fetchUrl) {
                      initCalls.push(`this.loadDropdown_${node.id.replace(/-/g, '_')}();`);
                      methods.push(`
  loadDropdown_${node.id.replace(/-/g, '_')}() {
    this.${loadingState} = true;
    this.api.getAll('${fetchUrl}', 1, 10000).subscribe({
      next: (res: any) => {
        this.${stateName} = res.data || res || [];
        this.${loadingState} = false;
      },
      error: (err) => {
        console.error(err);
        this.${loadingState} = false;
      }
    });
  }`);
                  }
                  
                  const valueField = node.props?.valueField || 'id';
                  const labelField = node.props?.labelField || 'name';
                  
                  return `
                  <div class="p-2 ${classNameStr}" ${styleAttr}>
                      <select class="border border-slate-300 rounded px-3 py-2 bg-white w-full max-w-xs">
                          <option value="">${node.props?.placeholder || 'Bitte wählen...'}</option>
                          <option *ngIf="${loadingState}" disabled>Lade Daten...</option>
                          <ng-container *ngIf="!${loadingState}">
                              <option *ngFor="let row of ${stateName}; let idx = index" [value]="row['${toCamelCase(valueField)}'] || row['${valueField}'] || row.id || idx">
                                  {{ row['${toCamelCase(labelField)}'] || row['${labelField}'] || row.id || idx }}
                              </option>
                          </ng-container>
                      </select>
                  </div>`;
              }
              case 'table_view': {
                  const suffix = node.id.replace(/-/g, '_');
                  const stateName = `tableData_${suffix}`;
                  const loadingState = `tableLoading_${suffix}`;
                  const searchState = `search_${suffix}`;
                  const columnFiltersState = `columnFilters_${suffix}`;
                  const showFiltersState = `showFilters_${suffix}`;
                  const sortFieldState = `sortField_${suffix}`;
                  const sortDirState = `sortDir_${suffix}`;
                  const pageState = `currentPage_${suffix}`;
                  const selectedRowState = `selectedRow_${suffix}`;

                  states.push(`${stateName}: any[] = [];`);
                  states.push(`${loadingState} = false;`);
                  states.push(`${searchState} = '';`);
                  states.push(`${columnFiltersState}: Record<string, string> = {};`);
                  states.push(`${showFiltersState} = false;`);
                  states.push(`${sortFieldState}: string | null = null;`);
                  states.push(`${sortDirState}: 'asc' | 'desc' | null = null;`);
                  states.push(`${pageState} = 1;`);
                  states.push(`${selectedRowState}: any = null;`);
                  
                  let fetchUrl = '';
                  const tObj = node.props?.dataSourceType === 'table' && node.props?.dataSourceId
                      ? tables.find(t => t.id === node.props.dataSourceId)
                      : null;
                  const pkFieldName = tObj ? (tObj.fields.find(c => c.isPrimaryKey)?.name || 'id') : 'id';

                  if (tObj) {
                      fetchUrl = `${toCamelCase(tObj.name)}`;
                  } else if (node.props?.dataSourceType === 'query' && node.props?.dataSourceId) {
                      const qObj = queries.find(q => q.id === node.props.dataSourceId);
                      if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
                  }
                  
                  if (fetchUrl) {
                      initCalls.push(`this.loadTable_${suffix}();`);
                      methods.push(`
  loadTable_${suffix}() {
    this.${loadingState} = true;
    this.api.getAll('${fetchUrl}', 1, 10000).subscribe({
      next: (res: any) => {
        this.${stateName} = res.data || res || [];
        this.${loadingState} = false;
      },
      error: (err) => {
        console.error(err);
        this.${loadingState} = false;
      }
    });
  }`);
                  }
                  
                  // Helper methods for generic objects
                  if (!methods.some(m => m.includes('getObjKeys'))) {
                      methods.push(`
  getObjKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getObjValues(obj: any): any[] {
    return obj ? Object.values(obj) : [];
  }`);
                  }

                  const processedName = `processedTableData_${suffix}`;
                  const paginatedName = `paginatedTableData_${suffix}`;

                  methods.push(`
  get ${processedName}(): any[] {
    let items = [...this.${stateName}];
    const globalSearch = this.${searchState}.toLowerCase().trim();
    if (globalSearch) {
      const searchTerms = globalSearch.split(/\\s+/).filter(Boolean);
      items = items.filter(row => {
        return searchTerms.every(term => {
          return Object.values(row).some(val => 
            val !== undefined && val !== null && String(val).toLowerCase().includes(term)
          );
        });
      });
    }

    Object.keys(this.${columnFiltersState}).forEach(key => {
      const filterVal = this.${columnFiltersState}[key]?.toLowerCase().trim();
      if (filterVal) {
        const searchTerms = filterVal.split(/\\s+/).filter(Boolean);
        items = items.filter(row => {
          const val = row[key];
          if (val === undefined || val === null) return false;
          const cellStr = String(val).toLowerCase();
          return searchTerms.every(term => cellStr.includes(term));
        });
      }
    });

    if (this.${sortFieldState} && this.${sortDirState}) {
      items.sort((a, b) => {
        const valA = a[this.${sortFieldState}!];
        const valB = b[this.${sortFieldState}!];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        
        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
          comparison = (valA ? 1 : 0) - (valB ? 1 : 0);
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }
        return this.${sortDirState} === 'asc' ? comparison : -comparison;
      });
    }

    return items;
  }

  get ${paginatedName}(): any[] {
    const startIndex = (this.${pageState} - 1) * 10;
    return this.${processedName}.slice(startIndex, startIndex + 10);
  }

  get totalItems_${suffix}(): number {
    return this.${processedName}.length;
  }

  get totalPages_${suffix}(): number {
    return Math.ceil(this.totalItems_${suffix} / 10) || 1;
  }

  get startIndex_${suffix}(): number {
    return (this.${pageState} - 1) * 10;
  }

  get endIndex_${suffix}(): number {
    return Math.min(this.startIndex_${suffix} + 10, this.totalItems_${suffix});
  }

  toggleSort_${suffix}(field: string) {
    if (this.${sortFieldState} === field) {
      if (this.${sortDirState} === 'asc') {
        this.${sortDirState} = 'desc';
      } else if (this.${sortDirState} === 'desc') {
        this.${sortFieldState} = null;
        this.${sortDirState} = null;
      } else {
        this.${sortDirState} = 'asc';
      }
    } else {
      this.${sortFieldState} = field;
      this.${sortDirState} = 'asc';
    }
  }`);

                  const detailsPage = node.props?.detailsPageId 
                      ? pages.find(p => p.id === node.props.detailsPageId) 
                      : null;
                  const detailsPageRoute = detailsPage ? `/custom/${toKebabCase(detailsPage.name)}` : '';

                  const editForm = node.props?.editFormId 
                      ? forms.find(f => f.id === node.props.editFormId) 
                      : null;
                  const targetFormTable = editForm 
                      ? tables.find(t => t.id === editForm.sourceId) 
                      : null;
                  const formRoute = (editForm && targetFormTable) ? `/${toCamelCase(targetFormTable.name)}` : '';

                  const paramKey = node.props?.selectionParamName || 'selectedId';
                  const clickTrigger = node.props?.rowClickTrigger || 'click';
                  const dblclickTrigger = node.props?.rowDoubleClickTrigger || 'dblclick';

                  let clickActionCode = '';
                  let dblclickActionCode = '';

                  if (detailsPageRoute) {
                      const code = `this.router.navigate(['${detailsPageRoute}'], { queryParams: { '${paramKey}': idVal } });`;
                      if (clickTrigger === 'click') clickActionCode = code;
                      if (dblclickTrigger === 'dblclick') dblclickActionCode = code;
                  } else if (formRoute) {
                      const code = `this.router.navigate(['${formRoute}', idVal]);`;
                      if (clickTrigger === 'click') clickActionCode = code;
                      if (dblclickTrigger === 'dblclick') dblclickActionCode = code;
                  }

                  methods.push(`
  onRowClick_${suffix}(row: any, idx: number) {
    const idVal = row['${pkFieldName}'] || row.id || row.ID || idx;
    this.${selectedRowState} = idVal;
    ${clickActionCode ? `this.router.navigate(['${detailsPageRoute || formRoute}'], { queryParams: { '${paramKey}': idVal } });` : ''}
  }`);

                  if (dblclickActionCode) {
                      methods.push(`
  onRowDoubleClick_${suffix}(row: any, idx: number) {
    const idVal = row['${pkFieldName}'] || row.id || row.ID || idx;
    ${dblclickActionCode}
  }`);
                  }
                  
                  const columnsStr = node.props?.columns || '';
                  const columns = columnsStr ? columnsStr.split(',').map((c: string) => c.trim()) : [];
                  
                  return `
                  <div class="p-4 w-full flex flex-col gap-4 ${classNameStr}" style="${styleAttr}">
                      <div class="flex justify-between items-center gap-4">
                          <button 
                              (click)="${showFiltersState} = !${showFiltersState}" 
                              class="p-1.5 border rounded-lg flex items-center gap-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                              [class.bg-blue-50]="${showFiltersState}"
                              [class.border-blue-300]="${showFiltersState}"
                              [class.text-blue-600]="${showFiltersState}"
                              title="Spaltenfilter anzeigen/ausblenden"
                          >
                              <span>Filter</span>
                          </button>
                          
                          <div class="relative flex-1 max-w-xs">
                              <input 
                                  type="text" 
                                  placeholder="Suchen..." 
                                  class="pl-3 pr-3 py-1.5 border rounded-lg text-xs w-full bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                  [(ngModel)]="${searchState}"
                                  (ngModelChange)="${pageState} = 1"
                              />
                          </div>
                      </div>

                      <div *ngIf="${loadingState}" class="flex items-center justify-center p-8">
                          <div class="animate-spin text-slate-400">Lade Daten...</div>
                      </div>

                      <div *ngIf="!${loadingState}" class="flex flex-col gap-3">
                          <div class="overflow-x-auto border rounded-lg dark:border-slate-700">
                              <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                                  <thead class="bg-slate-50 dark:bg-slate-900">
                                      <tr>
                                          ${columns.length > 0 ? columns.map((col: string) => `
                                          <th 
                                              class="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
                                              (click)="toggleSort_${suffix}('${toCamelCase(col)}')"
                                          >
                                              <div class="flex items-center gap-1.5">
                                                  <span>${col}</span>
                                                  <span *ngIf="${sortFieldState} === '${toCamelCase(col)}'">
                                                      <span *ngIf="${sortDirState} === 'asc'">▲</span>
                                                      <span *ngIf="${sortDirState} === 'desc'">▼</span>
                                                  </span>
                                              </div>
                                          </th>`).join('\n') : `
                                          <ng-container *ngIf="${stateName}.length > 0">
                                              <th 
                                                  *ngFor="let k of getObjKeys(${stateName}[0])" 
                                                  class="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
                                                  (click)="toggleSort_${suffix}(k)"
                                              >
                                                  <div class="flex items-center gap-1.5">
                                                      <span>{{k}}</span>
                                                      <span *ngIf="${sortFieldState} === k">
                                                          <span *ngIf="${sortDirState} === 'asc'">▲</span>
                                                          <span *ngIf="${sortDirState} === 'desc'">▼</span>
                                                      </span>
                                                  </div>
                                              </th>
                                          </ng-container>
                                          <th *ngIf="${stateName}.length === 0" class="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Daten</th>`}
                                      </tr>
                                      
                                      <tr *ngIf="${showFiltersState}" class="bg-slate-100/50">
                                          ${columns.length > 0 ? columns.map((col: string) => `
                                          <th class="p-2">
                                              <input 
                                                  type="text"
                                                  placeholder="Filtern..."
                                                  class="w-full px-2 py-1 text-xs font-normal border rounded bg-white text-slate-800"
                                                  [(ngModel)]="${columnFiltersState}['${toCamelCase(col)}']"
                                                  (ngModelChange)="${pageState} = 1"
                                              />
                                          </th>`).join('\n') : `
                                          <ng-container *ngIf="${stateName}.length > 0">
                                              <th *ngFor="let k of getObjKeys(${stateName}[0])" class="p-2">
                                                  <input 
                                                      type="text"
                                                      placeholder="Filtern..."
                                                      class="w-full px-2 py-1 text-xs font-normal border rounded bg-white text-slate-800"
                                                      [(ngModel)]="${columnFiltersState}[k]"
                                                      (ngModelChange)="${pageState} = 1"
                                                  />
                                              </th>
                                          </ng-container>`}
                                      </tr>
                                  </thead>
                                  <tbody class="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                                      <tr 
                                          *ngFor="let row of ${paginatedName}; let idx = index" 
                                          class="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition select-none"
                                          [class.bg-blue-50]="row['${pkFieldName}'] === ${selectedRowState} || row.id === ${selectedRowState} || row.ID === ${selectedRowState}"
                                          (click)="onRowClick_${suffix}(row, idx)"
                                          ${dblclickActionCode ? `(dblclick)="onRowDoubleClick_${suffix}(row, idx)"` : ''}
                                      >
                                          ${columns.length > 0 ? columns.map((col: string) => `<td class="px-3 py-2 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{{ row['${toCamelCase(col)}'] || row['${col}'] || '' }}</td>`).join('\n') : `
                                          <td *ngFor="let val of getObjValues(row)" class="px-3 py-2 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{{ val }}</td>`}
                                      </tr>
                                      <tr *ngIf="${stateName}.length === 0">
                                          <td class="p-4 text-center text-slate-400 italic" colspan="100">Keine Einträge.</td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>

                          <div *ngIf="totalItems_${suffix} > 0" class="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 px-1 gap-2 text-xs text-slate-500 select-none">
                              <div>
                                  Zeige <span class="font-semibold text-slate-700 dark:text-white">{{startIndex_${suffix} + 1}}</span> bis <span class="font-semibold text-slate-700 dark:text-white">{{endIndex_${suffix}}}</span> von <span class="font-semibold text-slate-700 dark:text-white">{{totalItems_${suffix}}}</span> Einträgen
                              </div>
                              <div class="flex items-center gap-1.5">
                                  <button 
                                      (click)="${pageState} = 1" 
                                      [disabled]="${pageState} <= 1"
                                      class="px-2 py-1 border rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition"
                                  >
                                      Erste
                                  </button>
                                  <button 
                                      (click)="${pageState} = ${pageState} - 1" 
                                      [disabled]="${pageState} <= 1"
                                      class="px-2 py-1 border rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition"
                                  >
                                      Zurück
                                  </button>
                                  <span class="px-3 py-1 font-medium text-slate-700 dark:text-white bg-slate-50 dark:bg-slate-900 border rounded">
                                      Seite {{${pageState}}} von {{totalPages_${suffix}}}
                                  </span>
                                  <button 
                                      (click)="${pageState} = ${pageState} + 1" 
                                      [disabled]="${pageState} >= totalPages_${suffix}"
                                      class="px-2 py-1 border rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition"
                                  >
                                      Weiter
                                  </button>
                                  <button 
                                      (click)="${pageState} = totalPages_${suffix}" 
                                      [disabled]="${pageState} >= totalPages_${suffix}"
                                      class="px-2 py-1 border rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition"
                                  >
                                      Letzte
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>`;
              }
              default:
                  return `<div class="p-4 bg-slate-50 rounded border text-sm text-slate-400">${node.type} Component</div>`;
          }
      };

      const customHtml = `
      <div class="p-8">
          <div class="mb-6 flex justify-between items-center">
              <h1 class="text-3xl font-bold text-slate-800">${page.name}</h1>
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              ${generateNode(page.layout)}
          </div>
      </div>`;

      const customTs = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-${kebabName}-custom',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './${kebabName}-custom.component.html'
})
export class ${pascalName}CustomComponent implements OnInit {
  ${states.join('\n  ')}

  constructor(private api: ApiService) {}

  ngOnInit() {
    ${initCalls.join('\n    ')}
  }

  ${methods.join('\n\n  ')}
}`;

      files.push({ name: `${kebabName}-custom.component.html`, path: `${appRoot}/pages/${folder}/${kebabName}-custom.component.html`, content: customHtml, language: 'html' });
      files.push({ name: `${kebabName}-custom.component.ts`, path: `${appRoot}/pages/${folder}/${kebabName}-custom.component.ts`, content: customTs, language: 'typescript' });
      routes.push({ path: `custom/${kebabName}`, component: compName, folder: folder, file: `${kebabName}-custom.component` });
  });

  return { files, routes };
};
