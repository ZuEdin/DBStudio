import { Table, Query, Report, Form, CustomPage, BackendConfig, VirtualFile, Relationship } from '../../../../types/index';
import { generateDashboardPage } from './dashboardPageGenerator';
import { generateTableCrudPages } from './tableCrudPageGenerator';
import { generateAuthPages } from './authPagesGenerator';
import { generateQueriesPage } from './queriesPageGenerator';
import { generateReportsPage } from './reportsPageGenerator';
import { generateBlazorFormPages } from './customFormPageGenerator';
import { generateBlazorCustomPages } from './customPageGenerator';

export const generateBlazorPages = (
  tables: Table[],
  config: BackendConfig,
  namespace: string,
  root: string,
  useAuth: boolean = false,
  queries: Query[] = [],
  reports: Report[] = [],
  relationships: Relationship[] = [],
  forms: Form[] = [],
  pages: CustomPage[] = []
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // 1. Dashboard (Index.razor)
  files.push(generateDashboardPage(tables, config, root, useAuth));

  // 2. Table CRUD Pages ({className}List.razor)
  files.push(...generateTableCrudPages(tables, namespace, root, useAuth, relationships));

  // 3. Auth Pages (Login, Register, ForgotPassword, Profile)
  if (useAuth) {
    files.push(...generateAuthPages(namespace, root));
  }

  // 4. Queries Page (Queries.razor)
  files.push(generateQueriesPage(tables, queries, root, useAuth));

  // 5. Reports Page (Reports.razor)
  files.push(generateReportsPage(tables, config, root, useAuth));

  // 6. Custom Forms Pages ({FormName}Form.razor)
  files.push(...generateBlazorFormPages(forms, tables, root, useAuth));

  // 7. Custom Designer Pages ({PageName}Page.razor)
  files.push(...generateBlazorCustomPages(pages, tables, root, useAuth));

  return files;
};

export {
  generateDashboardPage,
  generateTableCrudPages,
  generateAuthPages,
  generateQueriesPage,
  generateReportsPage,
  generateBlazorFormPages,
  generateBlazorCustomPages
};
