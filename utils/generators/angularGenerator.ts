
import { Table, Query, Form, VirtualFile, Relationship, BackendConfig, Report } from '../../types/index';
import { generateAngularConfigs } from './angular/configs';
import { generateAngularServices } from './angular/services';
import { generateAngularComponents } from './angular/components';
import { generateAngularStructure } from './angular/structure';
import { toPascalCase, toKebabCase } from './common';

export const generateAngular = (tables: Table[], relationships: Relationship[], queries: Query[], forms: Form[], config: BackendConfig, reports: Report[] = []): VirtualFile[] => {
  const root = `Frontend`;
  const appRoot = `${root}/src/app`;
  const useAuth = config.authConfig?.useUserLogin;
  
  // Generate component files and get route definitions
  const { files: componentFiles, routes: routeObjects } = generateAngularComponents(tables, relationships, forms, reports, config, appRoot, queries);

  // Generate app.routes.ts
  let routeImports = [...new Set(routeObjects.map(r => `import { ${r.component} } from './pages/${r.folder}/${r.file}';`))].join('\n');
  routeImports += `\nimport { LayoutComponent } from './components/layout/layout.component';`;
  
  if (useAuth) {
      routeImports += `\nimport { LoginComponent } from './pages/auth/login.component';\nimport { RegisterComponent } from './pages/auth/register.component';\nimport { ForgotPasswordComponent } from './pages/auth/forgot-password.component';\nimport { ProfileComponent } from './pages/auth/profile.component';\nimport { ForbiddenComponent } from './pages/auth/forbidden.component';\nimport { authGuard } from './guards/auth.guard';`;
  }

  let routeDefs = routeObjects.map(r => {
      let guard = '';
      if (useAuth) {
          const isAdminRoute = r.path.includes('sysUsers') || r.path.includes('sysRoles');
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
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'forbidden', component: ForbiddenComponent },
  { 
    path: '', 
    component: LayoutComponent,
    children: [
      { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
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

  const readmeContent = `# ${config.projectName} (Angular Client)`;
  const readme: VirtualFile = { name: 'README.md', path: `${root}/README.md`, content: readmeContent, language: 'markdown' };

  return [
      ...configFiles,
      ...serviceFiles,
      ...componentFiles,
      ...structureFiles,
      routesFile,
      readme
  ];
};
