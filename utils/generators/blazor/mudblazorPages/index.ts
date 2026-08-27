import { Table, Query, Report, BackendConfig, VirtualFile, Relationship } from '../../../../types/index';
import { generateMudBlazorDashboardPage } from './dashboardPageGenerator';
import { generateMudBlazorTableCrudPages } from './tableCrudPageGenerator';
import { generateMudBlazorQueriesPage } from './queriesPageGenerator';
import { generateMudBlazorReportsPage } from './reportsPageGenerator';
import { generateAuthPages } from '../pages/authPagesGenerator';

export const generateMudBlazorPages = (
  tables: Table[],
  config: BackendConfig,
  namespace: string,
  root: string,
  useAuth: boolean = false,
  queries: Query[] = [],
  reports: Report[] = [],
  relationships: Relationship[] = []
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

  return files;
};

export {
  generateMudBlazorDashboardPage,
  generateMudBlazorTableCrudPages,
  generateMudBlazorQueriesPage,
  generateMudBlazorReportsPage
};
