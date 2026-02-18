
import { Table, Query, Form, VirtualFile, Relationship, BackendConfig, Report } from '../../types/index';
import { generateAngularConfigs } from './angular/configs';
import { generateAngularServices } from './angular/services';
import { generateAngularComponents } from './angular/components';
import { generateAngularStructure } from './angular/structure';
import { toPascalCase, toKebabCase, toCamelCase } from './common';

export const generateAngular = (tables: Table[], relationships: Relationship[], queries: Query[], forms: Form[], config: BackendConfig, reports: Report[] = []): VirtualFile[] => {
  const root = `Frontend`;
  const appRoot = `${root}/src/app`;
  const useAuth = config.authConfig?.useUserLogin;
  
  // Generate basic components and routes
  const { files: componentFiles, routes: routeObjects } = generateAngularComponents(tables, relationships, forms, reports, config, appRoot, queries);
  const files: VirtualFile[] = [...componentFiles];

  // --- Auth Pages Generation ---
  if (useAuth) {
      // Login Component
      files.push({
          name: 'login.component.ts',
          path: `${appRoot}/pages/auth/login.component.ts`,
          content: `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: \`<div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded shadow-md w-96">
      <h2 class="text-2xl font-bold mb-6 text-center text-slate-800">Login</h2>
      <div *ngIf="error" class="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{{error}}</div>
      <form (ngSubmit)="login()">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">Benutzername</label>
          <input [(ngModel)]="username" name="username" class="w-full border rounded p-2" required>
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2">Passwort</label>
          <input type="password" [(ngModel)]="password" name="password" class="w-full border rounded p-2" required>
        </div>
        <button type="submit" class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">Anmelden</button>
      </form>
      <div class="mt-4 text-center text-sm">
        <a routerLink="/register" class="text-blue-500 hover:underline">Registrieren</a>
      </div>
    </div>
  </div>\`
})
export class LoginComponent {
  username = ''; password = ''; error = '';
  constructor(private auth: AuthService, private router: Router) {}
  login() {
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => this.error = 'Login fehlgeschlagen. ' + (err.error?.message || '')
    });
  }
}`,
          language: 'typescript'
      });

      // Register Component
      files.push({
          name: 'register.component.ts',
          path: `${appRoot}/pages/auth/register.component.ts`,
          content: `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: \`<div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded shadow-md w-96">
      <h2 class="text-2xl font-bold mb-6 text-center text-slate-800">Registrieren</h2>
      <form (ngSubmit)="register()">
        <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Benutzername</label>
            <input [(ngModel)]="username" name="username" class="w-full border rounded p-2" required>
        </div>
        <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input [(ngModel)]="email" name="email" class="w-full border rounded p-2" required>
        </div>
        <div class="mb-6">
            <label class="block text-gray-700 text-sm font-bold mb-2">Passwort</label>
            <input type="password" [(ngModel)]="password" name="password" class="w-full border rounded p-2" required>
        </div>
        <button type="submit" class="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700">Konto erstellen</button>
      </form>
      <div class="mt-4 text-center text-sm">
        <a routerLink="/login" class="text-blue-500 hover:underline">Zum Login</a>
      </div>
    </div>
  </div>\`
})
export class RegisterComponent {
  username = ''; email = ''; password = '';
  constructor(private auth: AuthService, private router: Router) {}
  register() {
    this.auth.register({ username: this.username, email: this.email, password: this.password }).subscribe({
      next: () => { alert('Erfolgreich! Bitte einloggen.'); this.router.navigate(['/login']); },
      error: (err) => alert('Fehler: ' + err.message)
    });
  }
}`,
          language: 'typescript'
      });

      // Forbidden Component
      files.push({
          name: 'forbidden.component.ts',
          path: `${appRoot}/pages/auth/forbidden.component.ts`,
          content: `import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: \`<div class="p-10 text-center"><h1 class="text-4xl font-bold text-red-600 mb-4">403</h1><p class="text-xl mb-6">Zugriff verweigert.</p><a routerLink="/" class="text-blue-600 underline">Zurück zum Start</a></div>\`
})
export class ForbiddenComponent {}`,
          language: 'typescript'
      });
  }

  // --- Routes Generation ---
  let routeImports = [...new Set(routeObjects.map(r => `import { ${r.component} } from './pages/${r.folder}/${r.file}';`))].join('\n');
  routeImports += `\nimport { LayoutComponent } from './components/layout/layout.component';`;
  
  if (useAuth) {
      routeImports += `\nimport { LoginComponent } from './pages/auth/login.component';\nimport { RegisterComponent } from './pages/auth/register.component';\nimport { ForbiddenComponent } from './pages/auth/forbidden.component';\nimport { authGuard } from './guards/auth.guard';`;
  }

  // Deduplicate Routes
  const uniqueRoutes = new Map();
  routeObjects.forEach(r => {
      if (!uniqueRoutes.has(r.path)) uniqueRoutes.set(r.path, r);
  });

  const routeDefs = Array.from(uniqueRoutes.values()).map(r => {
      let guard = '';
      if (useAuth) {
          // Identify System Tables to protect with Admin Role
          const isAdminRoute = r.path.includes('sysUsers') || r.path.includes('sysRoles') || r.path.includes('sysPermissions');
          const rolesData = isAdminRoute ? `, data: { roles: ['Admin'] }` : '';
          guard = `, canActivate: [authGuard]${rolesData}`;
      }
      return `      { path: '${r.path}', component: ${r.component}${guard} }`;
  }).join(',\n');

  let routesContent = '';
  if (useAuth) {
      routesContent = `
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forbidden', component: ForbiddenComponent },
  { 
    path: '', 
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: '${routeObjects[0]?.path || 'profile'}', pathMatch: 'full' },
${routeDefs}
    ]
  },
  { path: '**', redirectTo: '' }`;
  } else {
      routesContent = `
  { 
    path: '', 
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: '${routeObjects[0]?.path || ''}', pathMatch: 'full' },
${routeDefs}
    ]
  },
  { path: '**', redirectTo: '' }`;
  }
  
  const routesFile: VirtualFile = {
    name: 'app.routes.ts',
    path: `${appRoot}/app.routes.ts`,
    content: `import { Routes } from '@angular/router';\n${routeImports}\n\nexport const appRoutes: Routes = [\n${routesContent}\n];`,
    language: 'typescript'
  };
  
  const configFiles = generateAngularConfigs(config, root);
  const serviceFiles = generateAngularServices(tables, queries, config, appRoot);
  const structureFiles = generateAngularStructure(config, tables, root);

  // --- Main.ts (Register Interceptor) ---
  const mainTsContent = `import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient${useAuth ? ', withInterceptors' : ''} } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
${useAuth ? "import { authInterceptor } from './app/interceptors/auth.interceptor';" : ""}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(${useAuth ? 'withInterceptors([authInterceptor])' : ''})
  ]
}).catch(err => console.error(err));
`;

  const mainFile: VirtualFile = { name: 'main.ts', path: `${root}/src/main.ts`, content: mainTsContent, language: 'typescript' };

  return [
      ...configFiles,
      ...serviceFiles,
      ...files,
      ...structureFiles,
      routesFile,
      mainFile
  ];
};
