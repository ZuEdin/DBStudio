import { Table, Query, Report, Form, CustomPage, BackendConfig, VirtualFile, Relationship } from '../../../../types/index';
import { generateMudBlazorDashboardPage } from './dashboardPageGenerator';
import { generateMudBlazorTableCrudPages } from './tableCrudPageGenerator';
import { generateMudBlazorQueriesPage } from './queriesPageGenerator';
import { generateMudBlazorReportsPage } from './reportsPageGenerator';
import { generateMudBlazorFormPages } from './customFormPageGenerator';
import { generateMudBlazorCustomPages } from './customPageGenerator';
import { generateAuthPages } from '../pages/authPagesGenerator';

export const generateMudBlazorPages = (
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
  files.push(generateMudBlazorDashboardPage(tables, config, root, useAuth));

  // 2. Table CRUD Pages ({className}List.razor)
  files.push(...generateMudBlazorTableCrudPages(tables, namespace, root, useAuth, relationships));

  // 3. Auth Pages (Login, Register, ForgotPassword, Profile)
  if (useAuth) {
    files.push(...generateAuthPages(namespace, root));
  }

  // 4. Queries Page (Queries.razor)
  files.push(generateMudBlazorQueriesPage(tables, queries, root, useAuth));

  // 5. Reports Page (Reports.razor)
  files.push(generateMudBlazorReportsPage(tables, config, root, useAuth, reports));

  // 6. Custom Forms Pages ({FormName}Form.razor)
  files.push(...generateMudBlazorFormPages(forms, tables, root, useAuth));

  // 7. Custom Designer Pages ({PageName}Page.razor)
  files.push(...generateMudBlazorCustomPages(pages, tables, root, useAuth));

  return files;
};

export {
  generateMudBlazorDashboardPage,
  generateMudBlazorTableCrudPages,
  generateMudBlazorQueriesPage,
  generateMudBlazorReportsPage,
  generateMudBlazorFormPages,
  generateMudBlazorCustomPages
};
