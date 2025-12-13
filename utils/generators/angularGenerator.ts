
import { Table, Query, Form, VirtualFile, Relationship, BackendConfig, Report } from '../../types/index';
import { toCamelCase, toKebabCase, resolveType, isNullable, toPascalCase } from './common';

// Helper: Generate HTML for Layout recursively (Basic implementation for Angular)
const generateHtmlForLayout = (element: any, tables: Table[]): string => {
    if (element.type === 'container') {
        const children = element.children?.map((c: any) => generateHtmlForLayout(c, tables)).join('\n') || '';
        return `<div class="${element.className || ''}">${children}</div>`;
    }
    if (element.type === 'label') {
        return `<div class="${element.className || 'font-bold mb-2'}">${element.label}</div>`;
    }
    if (element.type === 'field' && element.fieldId) {
        let fieldName = '';
        for (const t of tables) {
            const f = t.fields.find(field => field.id === element.fieldId);
            if (f) { fieldName = f.name; break; }
        }
        if (!fieldName) return '';
        const bindProp = toCamelCase(fieldName);
        
        if (element.widgetType === 'select' && element.lookup) {
             const lookupTable = tables.find(t => t.id === element.lookup.tableId);
             const listVar = lookupTable ? `${toCamelCase(lookupTable.name)}List` : '[]';
             return `<div class="mb-4">
                <label class="block text-sm font-medium mb-1">${element.label}</label>
                <select [(ngModel)]="data.${bindProp}" name="${bindProp}" class="w-full border rounded p-2">
                    <option [ngValue]="null">Bitte wählen...</option>
                    <option *ngFor="let item of ${listVar}" [ngValue]="item.id">{{item.id}}</option> 
                </select>
             </div>`;
        }

        return `<div class="mb-4">
            <label class="block text-sm font-medium mb-1">${element.label}</label>
            <input type="text" [(ngModel)]="data.${bindProp}" name="${bindProp}" class="w-full border rounded p-2" />
        </div>`;
    }
    return '';
};

export const generateAngular = (tables: Table[], relationships: Relationship[], queries: Query[], forms: Form[], config: BackendConfig, reports: Report[] = []): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Frontend`;
  const appRoot = `${root}/src/app`;

  // 1. Configs
  files.push({ name: 'package.json', path: `${root}/package.json`, content: `{"name":"angular-client","version":"0.0.0","scripts":{"start":"ng serve","build":"ng build"},"dependencies":{"@angular/common":"^16.0.0","@angular/core":"^16.0.0","@angular/forms":"^16.0.0","@angular/router":"^16.0.0","rxjs":"~7.8.0","tslib":"^2.3.0","zone.js":"~0.13.0"},"devDependencies":{"@angular-devkit/build-angular":"^16.0.0","@angular/cli":"~16.0.0","@angular/compiler-cli":"^16.0.0","typescript":"~5.0.2","tailwindcss":"^3.3.0"}}`, language: 'json' });
  files.push({ name: 'angular.json', path: `${root}/angular.json`, content: JSON.stringify({"version":1,"projects":{"angular-client":{"projectType":"application","root":"","sourceRoot":"src","prefix":"app","architect":{"build":{"builder":"@angular-devkit/build-angular:browser","options":{"outputPath":"dist/angular-client","index":"src/index.html","main":"src/main.ts","polyfills":["zone.js"],"tsConfig":"tsconfig.app.json","assets":["src/favicon.ico","src/assets"],"styles":["src/styles.css"],"scripts":[]}},"serve":{"builder":"@angular-devkit/build-angular:dev-server","configurations":{"production":{"browserTarget":"angular-client:build:production"},"development":{"browserTarget":"angular-client:build:development"}},"defaultConfiguration":"development"}}}}}, null, 2), language: 'json' });
  files.push({ name: 'styles.css', path: `${root}/src/styles.css`, content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;`, language: 'css' });

  // 2. Services & Models
  tables.forEach(table => {
    const props = table.fields.map(f => `  ${toCamelCase(f.name)}${isNullable(f) ? '?' : ''}: ${resolveType(f, 'typescript')};`);
    files.push({ name: `${table.name.toLowerCase()}.interface.ts`, path: `${appRoot}/models/${table.name.toLowerCase()}.interface.ts`, content: `export interface ${table.name} {\n${props.join('\n')}\n}`, language: 'typescript' });
  });

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

  // 3. Components
  const routes: string[] = [];
  // Ensure SidebarComponent is in the declarations list
  const declarations: string[] = ['AppComponent', 'SidebarComponent']; 

  // --- Sidebar Component Generation ---
  // Create the HTML for the sidebar
  const navLinks = `
    <div class="px-4 py-2 text-xs font-bold text-slate-500 uppercase mt-4">Daten</div>
    ${tables.map(t => `<a routerLink="/${toCamelCase(t.name)}" routerLinkActive="bg-slate-700 text-white" class="block py-1 px-4 hover:bg-slate-700 text-slate-300 rounded mx-2 transition-colors">${t.name}</a>`).join('')}
    
    <div class="px-4 py-2 text-xs font-bold text-slate-500 uppercase mt-4">Formulare</div>
    ${forms.map(f => `<a routerLink="/forms/${toKebabCase(f.name)}" routerLinkActive="bg-slate-700 text-white" class="block py-1 px-4 hover:bg-slate-700 text-slate-300 rounded mx-2 transition-colors">${f.name}</a>`).join('')}
    
    <div class="px-4 py-2 text-xs font-bold text-slate-500 uppercase mt-4">Berichte</div>
    ${reports.map(r => `<a routerLink="/reports/${toKebabCase(r.name)}" routerLinkActive="bg-slate-700 text-white" class="block py-1 px-4 hover:bg-slate-700 text-slate-300 rounded mx-2 transition-colors">${r.name}</a>`).join('')}
  `;

  const sidebarHtml = `<aside class="w-64 bg-slate-800 text-white flex-shrink-0 flex flex-col h-screen">
    <div class="p-4 font-bold border-b border-slate-700 text-xl">${config.projectName}</div>
    <nav class="py-2 flex-1 overflow-y-auto">
        ${navLinks}
    </nav>
    <div class="p-4 border-t border-slate-700 text-xs text-slate-500">
        Generated by DB Studio Pro
    </div>
  </aside>`;

  const sidebarTs = `import { Component } from '@angular/core';
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {}`;

  // Push the sidebar files
  files.push({ name: 'sidebar.component.html', path: `${appRoot}/components/sidebar/sidebar.component.html`, content: sidebarHtml, language: 'html' });
  files.push({ name: 'sidebar.component.ts', path: `${appRoot}/components/sidebar/sidebar.component.ts`, content: sidebarTs, language: 'typescript' });


  // A. Lists (CRUD)
  tables.forEach(table => {
      const kebabName = toKebabCase(table.name);
      const listCompName = `${table.name}ListComponent`;
      declarations.push(listCompName);
      
      const html = `<div class="p-6">
        <h1 class="text-2xl font-bold mb-4">${table.name}</h1>
        <a routerLink="/${toCamelCase(table.name)}/new" class="bg-blue-600 text-white px-4 py-2 rounded mb-4 inline-block">Neu erstellen</a>
        <div class="bg-white shadow rounded overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead class="bg-gray-100 border-b"><tr>${table.fields.map(f=>`<th class="p-3 font-semibold text-sm text-gray-600">${f.name}</th>`).join('')}<th class="p-3 font-semibold text-sm text-gray-600 text-right">Aktionen</th></tr></thead>
                <tbody>
                    <tr *ngFor="let item of items" class="border-b hover:bg-gray-50">
                        ${table.fields.map(f=>`<td class="p-3 text-sm text-gray-800">{{item.${toCamelCase(f.name)}}}</td>`).join('')}
                        <td class="p-3 text-right">
                            <button (click)="delete(item.id)" class="text-red-600 hover:text-red-800 text-sm font-medium">Löschen</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
      </div>`;
      
      const ts = `import { Component, OnInit } from '@angular/core'; import { ApiService } from '../../services/api.service';
@Component({ selector: 'app-${kebabName}-list', templateUrl: './${kebabName}-list.component.html' })
export class ${listCompName} implements OnInit {
  items: any[] = []; constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }
  load() { this.api.getAll('${toCamelCase(table.name)}').subscribe(res => this.items = res); }
  delete(id: any) { if(confirm('Wirklich löschen?')) this.api.delete('${toCamelCase(table.name)}', id).subscribe(() => this.load()); }
}`;
      files.push({ name: `${kebabName}-list.component.html`, path: `${appRoot}/pages/${kebabName}/${kebabName}-list.component.html`, content: html, language: 'html' });
      files.push({ name: `${kebabName}-list.component.ts`, path: `${appRoot}/pages/${kebabName}/${kebabName}-list.component.ts`, content: ts, language: 'typescript' });
      routes.push(`{ path: '${toCamelCase(table.name)}', component: ${listCompName} }`);
  });

  // B. Custom Forms
  forms.forEach(form => {
      const formCompName = `${toPascalCase(form.name)}FormComponent`;
      const kebabName = toKebabCase(form.name) + '-form';
      declarations.push(formCompName);
      
      const sourceTable = tables.find(t => t.id === form.sourceId);
      const endpoint = sourceTable ? toCamelCase(sourceTable.name) : '';
      
      const lookups = [];
      const traverse = (el: any) => {
          if (el.widgetType === 'select' && el.lookup) lookups.push(el.lookup);
          if (el.children) el.children.forEach(traverse);
      };
      if (form.layout) traverse(form.layout);
      
      const lookupProps = lookups.map(l => {
          const t = tables.find(tbl => tbl.id === l.tableId);
          return t ? `${toCamelCase(t.name)}List: any[] = [];` : '';
      }).join('\n  ');
      
      const lookupLoads = lookups.map(l => {
          const t = tables.find(tbl => tbl.id === l.tableId);
          return t ? `this.api.getAll('${toCamelCase(t.name)}').subscribe(res => this.${toCamelCase(t.name)}List = res);` : '';
      }).join('\n    ');

      const html = `<div class="p-6 max-w-4xl mx-auto">
        <div class="bg-white shadow rounded-lg p-6">
            <h1 class="text-2xl font-bold mb-6 pb-2 border-b">${form.name}</h1>
            <form (ngSubmit)="save()">
                ${form.layout ? generateHtmlForLayout(form.layout, tables) : '<p>Kein Layout</p>'}
                <div class="mt-6 flex justify-end">
                    <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition-colors">Speichern</button>
                </div>
            </form>
        </div>
      </div>`;

      const ts = `import { Component, OnInit } from '@angular/core'; import { ActivatedRoute, Router } from '@angular/router'; import { ApiService } from '../../services/api.service';
@Component({ selector: 'app-${kebabName}', templateUrl: './${kebabName}.component.html' })
export class ${formCompName} implements OnInit {
  data: any = {};
  ${lookupProps}
  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit() {
    ${lookupLoads}
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
        this.api.getById('${endpoint}', id).subscribe(res => this.data = res);
    }
  }
  save() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
        this.api.update('${endpoint}', id, this.data).subscribe(() => this.router.navigate(['/${endpoint}']));
    } else {
        this.api.create('${endpoint}', this.data).subscribe(() => this.router.navigate(['/${endpoint}']));
    }
  }
}`;
      files.push({ name: `${kebabName}.component.html`, path: `${appRoot}/pages/forms/${kebabName}/${kebabName}.component.html`, content: html, language: 'html' });
      files.push({ name: `${kebabName}.component.ts`, path: `${appRoot}/pages/forms/${kebabName}/${kebabName}.component.ts`, content: ts, language: 'typescript' });
      
      routes.push(`{ path: 'forms/${toKebabCase(form.name)}/:id', component: ${formCompName} }`);
      if (sourceTable) {
          routes.push(`{ path: '${toCamelCase(sourceTable.name)}/:id', component: ${formCompName} }`); 
      }
  });

  // C. Reports
  reports.forEach(report => {
      const reportCompName = `${toPascalCase(report.name)}ReportComponent`;
      const kebabName = toKebabCase(report.name) + '-report';
      declarations.push(reportCompName);

      const sourceTable = tables.find(t => t.id === report.sourceId);
      const endpoint = sourceTable ? toCamelCase(sourceTable.name) : 'unknown';
      const columns = report.columns || [];
      
      const html = `<div class="p-8 bg-gray-50 min-h-full">
        <div class="bg-white shadow-lg p-10 max-w-5xl mx-auto">
            <h1 class="text-3xl font-bold mb-6 pb-2 border-b">${report.name}</h1>
            <div *ngIf="data.length === 0" class="text-gray-500 italic">Keine Daten verfügbar.</div>
            <table *ngIf="data.length > 0" class="w-full text-left border-collapse text-sm">
                <thead>
                    <tr class="border-b-2 border-black">
                        ${columns.map(c => `<th class="p-2 uppercase text-xs font-bold text-gray-600">${c.label}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let item of data" class="border-b hover:bg-gray-50">
                        ${columns.map(c => {
                            const fieldName = toCamelCase(c.label); 
                            return `<td class="p-2">{{ item['${fieldName}'] || item['${c.label}'] }}</td>`;
                        }).join('')}
                    </tr>
                </tbody>
            </table>
        </div>
      </div>`;

      const ts = `import { Component, OnInit } from '@angular/core'; import { ApiService } from '../../services/api.service';
@Component({ selector: 'app-${kebabName}', templateUrl: './${kebabName}.component.html' })
export class ${reportCompName} implements OnInit {
  data: any[] = [];
  constructor(private api: ApiService) {}
  ngOnInit() {
      this.api.getAll('${endpoint}').subscribe(res => this.data = res);
  }
}`;
      files.push({ name: `${kebabName}.component.html`, path: `${appRoot}/pages/reports/${kebabName}/${kebabName}.component.html`, content: html, language: 'html' });
      files.push({ name: `${kebabName}.component.ts`, path: `${appRoot}/pages/reports/${kebabName}/${kebabName}.component.ts`, content: ts, language: 'typescript' });
      routes.push(`{ path: 'reports/${toKebabCase(report.name)}', component: ${reportCompName} }`);
  });

  // App Module
  files.push({ name: 'app.module.ts', path: `${appRoot}/app.module.ts`, content: `import { NgModule } from '@angular/core'; import { BrowserModule } from '@angular/platform-browser'; import { HttpClientModule } from '@angular/common/http'; import { RouterModule } from '@angular/router'; import { FormsModule } from '@angular/forms'; import { AppComponent } from './app.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
// Declarations
${declarations.filter(d => d !== 'AppComponent' && d !== 'SidebarComponent').map(d => `import { ${d} } from './pages/${d.includes('Form') ? 'forms/' : d.includes('Report') ? 'reports/' : ''}${toKebabCase(d.replace('Component', ''))}/${toKebabCase(d.replace('Component', ''))}.component';`).join('\n')}

@NgModule({ 
  declarations: [${declarations.join(', ')}], 
  imports: [BrowserModule, HttpClientModule, FormsModule, RouterModule.forRoot([${routes.join(',')}])], 
  bootstrap: [AppComponent] 
}) export class AppModule { }`, language: 'typescript' });
  
  // App Component (Uses <app-sidebar>)
  files.push({ name: 'app.component.html', path: `${appRoot}/app.component.html`, content: `<div class="flex min-h-screen bg-gray-50">
    <app-sidebar></app-sidebar>
    <main class="flex-1 overflow-auto">
        <router-outlet></router-outlet>
    </main>
</div>`, language: 'html' });
  
  files.push({ name: 'app.component.ts', path: `${appRoot}/app.component.ts`, content: `import { Component } from '@angular/core'; @Component({ selector: 'app-root', templateUrl: './app.component.html' }) export class AppComponent {}`, language: 'typescript' });
  files.push({ name: 'main.ts', path: `${root}/src/main.ts`, content: `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'; import { AppModule } from './app/app.module'; platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));`, language: 'typescript' });
  files.push({ name: 'index.html', path: `${root}/src/index.html`, content: `<!doctype html><html lang="en"><head><title>${config.projectName}</title><base href="/"><script src="https://cdn.tailwindcss.com"></script></head><body><app-root></app-root></body></html>`, language: 'html' });

  return files;
};
