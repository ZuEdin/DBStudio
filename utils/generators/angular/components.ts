
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
const collectAngularLookups = (element: FormElement | undefined, tables: Table[], accumulated: Set<string> = new Set()): string[] => {
    if (!element) return Array.from(accumulated);
    
    if (element.widgetType === 'select' && element.lookup?.tableId) {
        const table = tables.find(t => t.id === element.lookup!.tableId);
        if (table) {
            accumulated.add(table.name);
        }
    }
    if (element.children) {
        element.children.forEach(child => collectAngularLookups(child, tables, accumulated));
    }
    return Array.from(accumulated);
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

export const generateAngularComponents = (tables: Table[], relationships: Relationship[], forms: Form[], reports: Report[], config: BackendConfig, appRoot: string, queries: Query[]): { files: VirtualFile[], routes: RouteInfo[] } => {
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

      // --- LIST COMPONENT ---
      const listHtml = `
      <div class="p-8">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold text-slate-800">${table.name}</h1>
            <div class="flex gap-4">
                <input type="text" [(ngModel)]="search" (keyup.enter)="page=1;load()" placeholder="Suche..." class="border rounded px-3 py-2 text-sm" />
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
                    <tr *ngFor="let item of items" class="border-b hover:bg-slate-50">
                        ${table.fields.map(f => `<td class="p-4">{{item.${toCamelCase(f.name)}}}</td>`).join('')}
                        <td class="p-4">
                            <a [routerLink]="['/${camelName}', item.${pkCamel}]" class="text-blue-600 hover:underline mr-3">Edit</a>
                            <button (click)="delete(item.${pkCamel})" class="text-red-600 hover:underline">Delete</button>
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
          const layoutHtml = generateHtmlForLayout(linkedForm.layout, tables, forms);
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

          const lookupTableNames = collectAngularLookups(linkedForm.layout, tables);
          listDeclarations = lookupTableNames.map(name => `  public ${toCamelCase(name)}List: any[] = [];`).join('\n');
          listFetches = lookupTableNames.map(name => `    this.api.getAll('${toCamelCase(name)}').subscribe((res: any) => this.${toCamelCase(name)}List = res.data || res);`).join('\n');
          
          const subforms = collectAngularSubforms(linkedForm.layout, tables, forms);
          subformDeclarations = subforms.map(s => `  public ${toCamelCase(s.tableName)}SubList_${s.id.substring(0,8)}: any[] = [];`).join('\n');
          subformLoads = subforms.map(s => {
              const tName = toCamelCase(s.tableName);
              const fName = toCamelCase(s.childField);
              const listVar = `${tName}SubList_${s.id.substring(0,8)}`;
              return `    if(id && id!=='new') this.api.getAll('${tName}', 1, 1000).subscribe((res: any) => this.${listVar} = (res.data || res).filter((x:any) => String(x.${fName}) == String(id)));`;
          }).join('\n');
          
          subformSaveLogic = `
  saveSubform(table: string, childField: string, modalId: string) {
      const parentId = this.route.snapshot.paramMap.get('id');
      if(!parentId || parentId === 'new') { alert('Bitte erst Hauptdatensatz speichern, bevor Sie Details hinzufügen.'); return; }
      
      const childProp = childField.charAt(0).toLowerCase() + childField.slice(1);
      this.tempSubData[childProp] = parentId; 
      
      this.api.create(table, this.tempSubData).subscribe(() => {
          this.closeModal(modalId);
          this.api.getAll(table, 1, 1000).subscribe((res: any) => {
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
          this.api.getAll(table).subscribe((res: any) => (this as any)[table + 'List'] = res.data || res);
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

  return { files, routes };
};
