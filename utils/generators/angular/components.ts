
import { Table, Form, Report, VirtualFile, BackendConfig, Query, Relationship } from '../../../types/index';
import { toCamelCase, toKebabCase, toPascalCase } from '../common';
import { generateHtmlForLayout } from './layoutHelper';

interface RouteInfo {
  path: string;
  component: string;
  folder: string;
  file: string;
}

export const generateAngularComponents = (tables: Table[], relationships: Relationship[], forms: Form[], reports: Report[], config: BackendConfig, appRoot: string, queries: Query[]): { files: VirtualFile[], routes: RouteInfo[] } => {
  const files: VirtualFile[] = [];
  const routes: RouteInfo[] = [];

  // Map Tables to their specific Forms (if any)
  const formMap = new Map<string, Form>();
  forms.forEach(f => {
      if (f.sourceType === 'table') {
          // If multiple forms exist, we take the one marked as 'default' or the first one found
          // For this implementation, we take the first one found for simplicity
          if (!formMap.has(f.sourceId)) {
              formMap.set(f.sourceId, f);
          }
      }
  });

  // --- Sidebar & App Shell ---
  const navLinks = `
    <div class="px-4 py-2 text-xs font-bold text-slate-500 uppercase mt-4">Daten</div>
    ${tables.map(t => `<a routerLink="/${toCamelCase(t.name)}" routerLinkActive="bg-slate-700 text-white" class="block py-1 px-4 hover:bg-slate-700 text-slate-300 rounded mx-2 transition-colors">${t.name}</a>`).join('')}
    <div class="px-4 py-2 text-xs font-bold text-slate-500 uppercase mt-4">Berichte</div>
    ${reports.map(r => `<a routerLink="/reports/${toKebabCase(r.name)}" routerLinkActive="bg-slate-700 text-white" class="block py-1 px-4 hover:bg-slate-700 text-slate-300 rounded mx-2 transition-colors">${r.name}</a>`).join('')}
  `;
  
  files.push({ name: 'sidebar.component.html', path: `${appRoot}/components/sidebar/sidebar.component.html`, content: `<aside class="w-64 bg-slate-800 text-white flex-shrink-0 flex flex-col h-screen"><div class="p-4 font-bold border-b border-slate-700 text-xl">${config.projectName}</div><nav class="py-2 flex-1 overflow-y-auto">${navLinks}</nav></aside>`, language: 'html' });
  files.push({ name: 'sidebar.component.ts', path: `${appRoot}/components/sidebar/sidebar.component.ts`, content: `import { Component } from '@angular/core'; import { RouterLink, RouterLinkActive } from '@angular/router'; @Component({ selector: 'app-sidebar', standalone: true, imports: [RouterLink, RouterLinkActive], templateUrl: './sidebar.component.html' }) export class SidebarComponent {}`, language: 'typescript' });
  files.push({ name: 'app.component.html', path: `${appRoot}/app.component.html`, content: `<div class="flex min-h-screen bg-gray-50"><app-sidebar></app-sidebar><main class="flex-1 overflow-auto"><router-outlet></router-outlet></main></div>`, language: 'html' });
  files.push({ name: 'app.component.ts', path: `${appRoot}/app.component.ts`, content: `import { Component } from '@angular/core'; import { RouterOutlet } from '@angular/router'; import { SidebarComponent } from './components/sidebar/sidebar.component'; @Component({ selector: 'app-root', standalone: true, imports: [RouterOutlet, SidebarComponent], templateUrl: './app.component.html' }) export class AppComponent {}`, language: 'typescript' });

  // --- TABLES (List & Form) ---
  tables.forEach(table => {
      const pascalName = toPascalCase(table.name);
      const kebabName = toKebabCase(pascalName);
      const camelName = toCamelCase(pascalName);
      const pkField = toCamelCase(table.fields.find(f => f.isPrimaryKey)?.name || 'id');

      // Check if a custom form exists
      const customForm = formMap.get(table.id);
      
      // Route Path for "Create New": If custom form, use its route, else use default table route
      const createRoute = customForm 
          ? `/forms/${toKebabCase(customForm.name)}/new`
          : `/${camelName}/new`;
          
      const editRoutePrefix = customForm
          ? `/forms/${toKebabCase(customForm.name)}`
          : `/${camelName}`;

      // 1. List Component
      const listCompName = `${pascalName}ListComponent`;
      const listHtml = `<div class="p-6">
        <h1 class="text-2xl font-bold mb-4">${table.name}</h1>
        <a routerLink="${createRoute}" class="bg-blue-600 text-white px-4 py-2 rounded mb-4 inline-block">Neu erstellen</a>
        <div class="bg-white shadow rounded overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead class="bg-gray-100 border-b"><tr>${table.fields.map(f=>`<th class="p-3 font-semibold text-sm text-gray-600">${f.name}</th>`).join('')}<th class="p-3 text-right">Aktionen</th></tr></thead>
                <tbody>
                    <tr *ngFor="let item of items" class="border-b hover:bg-gray-50">
                        ${table.fields.map(f=>`<td class="p-3 text-sm text-gray-800">{{item.${toCamelCase(f.name)}}}</td>`).join('')}
                        <td class="p-3 text-right">
                            <a [routerLink]="['${editRoutePrefix}', item.${pkField}]" class="text-blue-600 hover:text-blue-800 text-sm font-medium mr-4">Bearbeiten</a>
                            <button (click)="delete(item.${pkField})" class="text-red-600 hover:text-red-800 text-sm font-medium">Löschen</button>
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
import { ${pascalName} } from '../../models/${pascalName.toLowerCase()}.interface';

@Component({
  selector: 'app-${kebabName}-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './${kebabName}-list.component.html'
})
export class ${listCompName} implements OnInit {
  items: ${pascalName}[] = [];
  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }
  load() { this.api.getAll('${camelName}').subscribe(res => this.items = res); }
  delete(id: any) { if(confirm('Löschen?')) this.api.delete('${camelName}', id).subscribe(() => this.load()); }
}`;
      files.push({ name: `${kebabName}-list.component.html`, path: `${appRoot}/pages/${kebabName}/${kebabName}-list.component.html`, content: listHtml, language: 'html' });
      files.push({ name: `${kebabName}-list.component.ts`, path: `${appRoot}/pages/${kebabName}/${kebabName}-list.component.ts`, content: listTs, language: 'typescript' });
      routes.push({ path: camelName, component: listCompName, folder: kebabName, file: `${kebabName}-list.component` });

      // 2. Default Form Component (Only if NO custom form exists)
      if (!customForm) {
          const formCompName = `${pascalName}FormComponent`;
          const formHtml = `<div class="p-6 max-w-lg mx-auto bg-white shadow rounded">
            <h1 class="text-xl font-bold mb-4">{{ data.${pkField} ? 'Bearbeiten' : 'Neu' }}</h1>
            <form (ngSubmit)="save()">
                ${table.fields.filter(f => !f.isPrimaryKey).map(f => `
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1">${f.name}</label>
                    <input [(ngModel)]="data.${toCamelCase(f.name)}" name="${toCamelCase(f.name)}" class="w-full border rounded p-2" />
                </div>`).join('')}
                <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Speichern</button>
            </form>
          </div>`;
          const formTs = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ${pascalName} } from '../../models/${pascalName.toLowerCase()}.interface';

@Component({ selector: 'app-${kebabName}-form', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './${kebabName}-form.component.html' })
export class ${formCompName} implements OnInit {
  data: ${pascalName} = {} as any;
  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if(id && id !== 'new') this.api.getById('${camelName}', id).subscribe(res => this.data = res);
  }
  save() {
    const op = this.data.${pkField} ? this.api.update('${camelName}', this.data.${pkField}, this.data) : this.api.create('${camelName}', this.data);
    op.subscribe(() => this.router.navigate(['/${camelName}']));
  }
}`;
          files.push({ name: `${kebabName}-form.component.html`, path: `${appRoot}/pages/${kebabName}/${kebabName}-form.component.html`, content: formHtml, language: 'html' });
          files.push({ name: `${kebabName}-form.component.ts`, path: `${appRoot}/pages/${kebabName}/${kebabName}-form.component.ts`, content: formTs, language: 'typescript' });
          routes.push({ path: `${camelName}/:id`, component: formCompName, folder: kebabName, file: `${kebabName}-form.component` });
      }
  });

  // --- CUSTOM FORMS ---
  forms.forEach(form => {
      const formPascal = toPascalCase(form.name);
      const formKebab = toKebabCase(form.name);
      const formCompName = `${formPascal}FormComponent`;
      const table = tables.find(t => t.id === form.sourceId);
      if (!table) return; // Should not happen
      
      const camelName = toCamelCase(table.name); // API endpoint
      const pkField = toCamelCase(table.fields.find(f => f.isPrimaryKey)?.name || 'id');

      // Generate HTML from Layout
      const layoutHtml = form.layout ? generateHtmlForLayout(form.layout, tables) : '<!-- Empty Layout -->';
      
      const html = `<div class="p-6 max-w-4xl mx-auto bg-white shadow rounded">
        <h1 class="text-2xl font-bold mb-6">${form.name}</h1>
        <form (ngSubmit)="save()">
            ${layoutHtml}
            <div class="mt-6 flex justify-end gap-2">
                <a routerLink="/${camelName}" class="bg-gray-200 px-4 py-2 rounded">Abbrechen</a>
                <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Speichern</button>
            </div>
        </form>
      </div>`;

      const ts = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({ selector: 'app-${formKebab}', standalone: true, imports: [CommonModule, FormsModule, RouterLink], templateUrl: './${formKebab}.component.html' })
export class ${formCompName} implements OnInit {
  data: any = {};
  // Lookups would be loaded here based on layout analysis
  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if(id && id !== 'new') this.api.getById('${camelName}', id).subscribe(res => this.data = res);
  }
  save() {
    const op = this.data.${pkField} ? this.api.update('${camelName}', this.data.${pkField}, this.data) : this.api.create('${camelName}', this.data);
    op.subscribe(() => this.router.navigate(['/${camelName}']));
  }
}`;
      
      const folder = `forms/${formKebab}`;
      files.push({ name: `${formKebab}.component.html`, path: `${appRoot}/pages/${folder}/${formKebab}.component.html`, content: html, language: 'html' });
      files.push({ name: `${formKebab}.component.ts`, path: `${appRoot}/pages/${folder}/${formKebab}.component.ts`, content: ts, language: 'typescript' });
      
      // Specific Route for this form
      routes.push({ path: `forms/${formKebab}/:id`, component: formCompName, folder: folder, file: `${formKebab}.component` });
  });

  return { files, routes };
};
