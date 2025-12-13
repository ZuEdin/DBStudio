
import { Table, Query, VirtualFile, Relationship, BackendConfig, Form, Report } from '../../types/index';
import { generateReactConfigs } from './react/config';
import { generateReactApi } from './react/api';
import { generateReactPages } from './react/pages';
import { generateReactStructure } from './react/structure';

export const generateReact = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig, forms: Form[] = [], reports: Report[] = []): VirtualFile[] => {
  const root = `Frontend`;
  
  const configFiles = generateReactConfigs(config, root);
  // Pass queries for models
  const apiFiles = generateReactApi(tables, queries, config, root);
  const structureFiles = generateReactStructure(tables, forms, reports, config, root);
  const pageFiles = generateReactPages(tables, forms, reports, root, queries);

  return [
      ...configFiles,
      ...apiFiles,
      ...structureFiles,
      ...pageFiles
  ];
};
