
import { Table, Query, Form, VirtualFile, Relationship, BackendConfig, Report } from '../../types/index';
import { generateAngularConfigs } from './angular/configs';
import { generateAngularServices } from './angular/services';
import { generateAngularComponents } from './angular/components';
import { generateAngularModule } from './angular/module';

export const generateAngular = (tables: Table[], relationships: Relationship[], queries: Query[], forms: Form[], config: BackendConfig, reports: Report[] = []): VirtualFile[] => {
  const root = `Frontend`;
  const appRoot = `${root}/src/app`;
  
  const configFiles = generateAngularConfigs(config, root);
  const serviceFiles = generateAngularServices(tables, config, appRoot);
  const { files: componentFiles, declarations, routes } = generateAngularComponents(tables, forms, reports, config, appRoot);
  const moduleFile = generateAngularModule(declarations, routes, appRoot);

  return [
      ...configFiles,
      ...serviceFiles,
      ...componentFiles,
      moduleFile
  ];
};
