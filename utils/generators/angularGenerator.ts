
import { Table, Query, Form, VirtualFile, Relationship, BackendConfig, Report } from '../../types/index';
import { generateAngularConfigs } from './angular/configs';
import { generateAngularServices } from './angular/services';
import { generateAngularComponents } from './angular/components';
import { toPascalCase, toKebabCase } from './common';

export const generateAngular = (tables: Table[], relationships: Relationship[], queries: Query[], forms: Form[], config: BackendConfig, reports: Report[] = []): VirtualFile[] => {
  const root = `Frontend`;
  const appRoot = `${root}/src/app`;
  
  // Generate component files and get route definitions
  const { files: componentFiles, routes: routeObjects } = generateAngularComponents(tables, relationships, forms, reports, config, appRoot, queries);

  // Generate app.routes.ts
  const routeImports = [...new Set(routeObjects.map(r => `import { ${r.component} } from './pages/${r.folder}/${r.file}';`))].join('\n');
  const routeDefs = routeObjects.map(r => `  { path: '${r.path}', component: ${r.component} }`).join(',\n');
  
  const routesFile: VirtualFile = {
    name: 'app.routes.ts',
    path: `${appRoot}/app.routes.ts`,
    content: `import { Routes } from '@angular/router';\n${routeImports}\n\nexport const appRoutes: Routes = [\n${routeDefs}\n];`,
    language: 'typescript'
  };
  
  // Generate other standard files (configs, services)
  const configFiles = generateAngularConfigs(config, root);
  const serviceFiles = generateAngularServices(tables, queries, config, appRoot);

  return [
      ...configFiles,
      ...serviceFiles,
      ...componentFiles,
      routesFile
  ];
};