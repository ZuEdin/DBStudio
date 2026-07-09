
import { Table, Query, Form, VirtualFile, Relationship, BackendConfig, Report, CustomPage } from '../../types/index';
import { generateAngular18 } from './angular/angular18Generator';
import { generateAngular19 } from './angular/angular19Generator';
import { generateAngular20 } from './angular/angular20Generator';
import { generateAngular21 } from './angular/angular21Generator';

export const generateAngular = (
  tables: Table[],
  relationships: Relationship[],
  queries: Query[],
  forms: Form[],
  config: BackendConfig,
  reports: Report[] = [],
  pages: CustomPage[] = []
): VirtualFile[] => {
  const version = config.frontendVersion || '19';

  switch (version) {
    case '18':
      return generateAngular18(tables, relationships, queries, forms, config, reports, pages);
    case '20':
      return generateAngular20(tables, relationships, queries, forms, config, reports, pages);
    case '21':
      return generateAngular21(tables, relationships, queries, forms, config, reports, pages);
    case '19':
    default:
      return generateAngular19(tables, relationships, queries, forms, config, reports, pages);
  }
};
