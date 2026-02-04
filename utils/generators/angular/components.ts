
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

  // --- 1. CUSTOM FORM COMPONENTS (Explicitly named routes) ---
  forms.forEach(form => {
      const formPascal = toPascalCase(form.name);
      const formKebab = toKebabCase(form.name);
      const table = tables.find(t => t.id === form.sourceId);
      if (!table) return; 
      
      const camelName = toCamelCase(table.name);
      const layoutHtml = form.layout ? generateHtmlForLayout(form.layout, tables, forms) : '<!-- Empty Layout -->';
      
      const lookupTableNames = collectAngularLookups(form.layout, tables);
      const subforms = form.layout ? collectAngularSubforms(form.layout, tables, forms) : [];

      const listDeclarations = lookupTableNames.map(name => `  public ${toCamelCase(name)}List: any[] = [];`).join('\n');
      const listFetches = lookupTableNames.map(name => `    this.api.getAll('${toCamelCase(name)}').subscribe((res: any) => this.${toCamelCase(name)}List = res);`).join('\n');
      
      const subformDeclarations = subforms.map(s => `  public ${toCamelCase(s.tableName)}SubList_${s.id.substring(0,8)}: any[] = [];`).join('\n');
      const subformLoads = subforms.map(s => {
          const tName = toCamelCase(s.tableName);
          const fName = toCamelCase(s.childField);
          return `    if(id && id!=='new') this.api.getAll('${tName}').subscribe((res: any) => this.${tName}SubList_${s.id.substring(0,8)} = res.filter((x:any) => String(x.${fName}) == String(id)));`;
      }).join('\n');

      const html = `<div class="p-6 max-w-4xl mx-auto">
        <div class="bg-white shadow-xl rounded-xl border border-slate-200 overflow-hidden">
            <div class="p-4 bg-slate-800 text-white font-bold">${form.name}</div>
            <form (ngSubmit)="save()" class="p-6">
                ${layoutHtml}
                <div class="mt-8 flex justify-end gap-2 border-t pt-6">
                    <a routerLink="/${camelName}" class="bg-slate-100 px-6 py-2 rounded-lg border text-slate-600 hover:bg-slate-200 transition-colors">Abbrechen</a>
                    <button type="submit" class="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold shadow hover:bg-blue-700 transition-colors">Speichern</button>
                </div>
            </form>
        </div>
      </div>`;

      const ts = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({ 
  selector: 'app-${formKebab}', 
  standalone: true, 
  imports: [CommonModule, FormsModule, RouterLink], 
  templateUrl: './${formKebab}.component.html' 
})
export class ${formPascal}FormComponent implements OnInit {
  data: any = {};
  tempData: any = {}; 
  tempSubData: any = {};
  modals: any = {};

${listDeclarations}
${subformDeclarations}

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if(id && id !== 'new') {
        this.api.getById('${camelName}', id).subscribe((res: any) => this.data = res);
        ${subformLoads}
    }
${listFetches}
  }

  save() {
    const id = this.route.snapshot.paramMap.get('id');
    const isNew = !id || id === 'new';
    const op = isNew ? this.api.create('${camelName}', this.data) : this.api.update('${camelName}', id, this.data);
    op.subscribe(() => this.router.navigate(['/${camelName}']));
  }

  openModal(id: string) { this.modals[id] = true; this.tempData = {}; this.tempSubData = {}; }
  closeModal(id: string) { this.modals[id] = false; }

  saveLookup(table: string, modalId: string) {
      this.api.create(table, this.tempData).subscribe(() => {
          this.closeModal(modalId);
          this.api.getAll(table).subscribe((res: any) => (this as any)[table + 'List'] = res);
      });
  }

  saveSubform(table: string, childField: string, modalId: string) {
      const parentId = this.route.snapshot.paramMap.get('id');
      if(!parentId || parentId === 'new') { alert('Bitte erst Hauptdatensatz speichern'); return; }
      
      this.tempSubData[childField] = parentId; 
      this.api.create(table, this.tempSubData).subscribe(() => {
          this.closeModal(modalId);
          this.api.getAll(table).subscribe((res: any) => {
             const listName = Object.keys(this).find(k => k.startsWith(table + 'SubList_') && k.includes(modalId.replace('sub_','').substring(0,8)));
             if(listName) (this as any)[listName] = res.filter((x:any) => String(x[childField]) == String(parentId));
          });
      });
  }
}`;
      const folder = `forms/${formKebab}`;
      files.push({ name: `${formKebab}.component.html`, path: `${appRoot}/pages/${folder}/${formKebab}.component.html`, content: html, language: 'html' });
      files.push({ name: `${formKebab}.component.ts`, path: `${appRoot}/pages/${folder}/${formKebab}.component.ts`, content: ts, language: 'typescript' });
      routes.push({ path: `forms/${formKebab}/:id`, component: `${formPascal}FormComponent`, folder: folder, file: `${formKebab}.component` });
  });

  // --- 2. STANDARD TABLE LIST & FORM COMPONENTS ---
  tables.forEach(table => {
      const pascalName = toPascalCase(table.name);
      const camelName = toCamelCase(table.name);
      const kebabName = toKebabCase(table.name);
      const folder = pascalName;
      const pkField = table.fields.find(f => f.isPrimaryKey)?.name || 'id';
      const pkCamel = toCamelCase(pkField);

      // LIST COMPONENT
      const listHtml = `
      <div class="p-8">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold text-slate-800">${table.name}</h1>
            <a routerLink="/${camelName}/new" class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Neu</a>
        </div>
        <div class="bg-white rounded shadow overflow-hidden">
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
                </tbody>
            </table>
        </div>
      </div>`;

      const listTs = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-${kebabName}-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './${kebabName}-list.component.html'
})
export class ${pascalName}ListComponent implements OnInit {
  items: any[] = [];
  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }
  load() { this.api.getAll('${camelName}').subscribe(data => this.items = data); }
  delete(id: any) { if(confirm('Löschen?')) this.api.delete('${camelName}', id).subscribe(() => this.load()); }
}`;

      files.push({ name: `${kebabName}-list.component.html`, path: `${appRoot}/pages/${folder}/${kebabName}-list.component.html`, content: listHtml, language: 'html' });
      files.push({ name: `${kebabName}-list.component.ts`, path: `${appRoot}/pages/${folder}/${kebabName}-list.component.ts`, content: listTs, language: 'typescript' });
      routes.push({ path: camelName, component: `${pascalName}ListComponent`, folder: folder, file: `${kebabName}-list.component` });

      // FORM COMPONENT (INTELLIGENT FALLBACK)
      // Check if there is a custom form designed for this table
      const linkedForm = forms.find(f => f.sourceId === table.id && f.sourceType === 'table');
      
      let formHtml = '';
      let listDeclarations = '';
      let listFetches = '';
      let subformDeclarations = '';
      let subformLoads = '';

      if (linkedForm && linkedForm.layout) {
          // Use the Designed Layout!
          formHtml = `<div class="p-6 max-w-4xl mx-auto">
            <div class="bg-white shadow-xl rounded-xl border border-slate-200 overflow-hidden">
                <div class="p-4 bg-slate-800 text-white font-bold">${linkedForm.name}</div>
                <form (ngSubmit)="save()" class="p-6">
                    ${generateHtmlForLayout(linkedForm.layout, tables, forms)}
                    <div class="mt-8 flex justify-end gap-2 border-t pt-6">
                        <a routerLink="/${camelName}" class="bg-slate-100 px-6 py-2 rounded-lg border text-slate-600 hover:bg-slate-200 transition-colors">Abbrechen</a>
                        <button type="submit" class="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold shadow hover:bg-blue-700 transition-colors">Speichern</button>
                    </div>
                </form>
            </div>
          </div>`;

          // Collect Lookups & Subforms for the designed layout
          const lookupTableNames = collectAngularLookups(linkedForm.layout, tables);
          const subforms = collectAngularSubforms(linkedForm.layout, tables, forms);

          listDeclarations = lookupTableNames.map(name => `  public ${toCamelCase(name)}List: any[] = [];`).join('\n');
          listFetches = lookupTableNames.map(name => `    this.api.getAll('${toCamelCase(name)}').subscribe((res: any) => this.${toCamelCase(name)}List = res);`).join('\n');
          
          subformDeclarations = subforms.map(s => `  public ${toCamelCase(s.tableName)}SubList_${s.id.substring(0,8)}: any[] = [];`).join('\n');
          subformLoads = subforms.map(s => {
              const tName = toCamelCase(s.tableName);
              const fName = toCamelCase(s.childField);
              return `    if(id && id!=='new') this.api.getAll('${tName}').subscribe((res: any) => this.${tName}SubList_${s.id.substring(0,8)} = res.filter((x:any) => String(x.${fName}) == String(id)));`;
          }).join('\n');

      } else {
          // Fallback: Basic Inputs
          const formFields = table.fields.map(f => {
              if (f.isPrimaryKey && f.isAutoIncrement) return ''; 
              let input = '';
              const fieldProp = toCamelCase(f.name);
              
              if (f.type === 'BOOLEAN') {
                  input = `<div class="flex items-center gap-2"><input type="checkbox" [(ngModel)]="data.${fieldProp}" name="${fieldProp}" class="w-4 h-4 rounded" /> <label>${f.name}</label></div>`;
              } else {
                  const type = f.type === 'INTEGER' || f.type === 'DECIMAL' ? 'number' : f.type === 'DATE' ? 'date' : 'text';
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

      const formTs = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-${kebabName}-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './${kebabName}-form.component.html'
})
export class ${pascalName}FormComponent implements OnInit {
  data: any = {};
  tempData: any = {}; 
  tempSubData: any = {};
  modals: any = {};
  isNew = true;

${listDeclarations}
${subformDeclarations}

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}
  
  ngOnInit() {
      const id = this.route.snapshot.paramMap.get('id');
      if (id && id !== 'new') {
          this.isNew = false;
          this.api.getById('${camelName}', id).subscribe(res => this.data = res);
          ${subformLoads}
      }
${listFetches}
  }

  save() {
      const op = this.isNew ? this.api.create('${camelName}', this.data) : this.api.update('${camelName}', this.data.${pkCamel}, this.data);
      op.subscribe(() => this.router.navigate(['/${camelName}']));
  }

  openModal(id: string) { this.modals[id] = true; this.tempData = {}; this.tempSubData = {}; }
  closeModal(id: string) { this.modals[id] = false; }

  saveLookup(table: string, modalId: string) {
      this.api.create(table, this.tempData).subscribe(() => {
          this.closeModal(modalId);
          this.api.getAll(table).subscribe((res: any) => (this as any)[table + 'List'] = res);
      });
  }

  saveSubform(table: string, childField: string, modalId: string) {
      const parentId = this.data.${pkCamel};
      if(!parentId) { alert('Bitte erst Hauptdatensatz speichern'); return; }
      
      this.tempSubData[childField] = parentId; 
      this.api.create(table, this.tempSubData).subscribe(() => {
          this.closeModal(modalId);
          this.api.getAll(table).subscribe((res: any) => {
             const listName = Object.keys(this).find(k => k.startsWith(table + 'SubList_') && k.includes(modalId.replace('sub_','').substring(0,8)));
             if(listName) (this as any)[listName] = res.filter((x:any) => String(x[childField]) == String(parentId));
          });
      });
  }
}`;

      files.push({ name: `${kebabName}-form.component.html`, path: `${appRoot}/pages/${folder}/${kebabName}-form.component.html`, content: formHtml, language: 'html' });
      files.push({ name: `${kebabName}-form.component.ts`, path: `${appRoot}/pages/${folder}/${kebabName}-form.component.ts`, content: formTs, language: 'typescript' });
      routes.push({ path: `${camelName}/:id`, component: `${pascalName}FormComponent`, folder: folder, file: `${kebabName}-form.component` });
  });

  return { files, routes };
};
