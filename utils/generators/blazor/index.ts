import { Table, Relationship, Query, BackendConfig, VirtualFile, Form, Report } from '../../../types/index';
import { generateBlazorProjectFiles } from './projectFiles';
import { generateBlazorServices } from './services';
import { generateBlazorModels } from './models';
import { generateBlazorLayouts } from './layouts';
import { generateBlazorPages } from './pages';
import { generateMudBlazorProjectFiles } from './mudblazorProjectFiles';
import { generateMudBlazorLayouts } from './mudblazorLayouts';
import { generateMudBlazorPages } from './mudblazorPages';
import { generateBlazorIndexedDb } from './indexedDbGenerator';

export const generateBlazor = (
  tables: Table[],
  relationships: Relationship[],
  queries: Query[],
  config: BackendConfig,
  forms: Form[] = [],
  reports: Report[] = []
): VirtualFile[] => {
  const root = `Frontend/${config.projectName}.Client`;
  const safeNamespace = config.projectName.replace(/[^a-zA-Z0-9_]/g, '_');
  const namespace = `${safeNamespace}.Client`;
  const useAuth = Boolean(config.authConfig?.useUserLogin);
  const isMudBlazor = config.frontendFramework === 'mudblazor';

  let version = config.backendVersion || '9.0';
  if (parseFloat(version) > 10.0) {
    version = '10.0';
  }
  const targetFramework = `net${version}`;

  const projectFiles = isMudBlazor
    ? generateMudBlazorProjectFiles(tables, config, namespace, root, targetFramework, version, useAuth)
    : generateBlazorProjectFiles(tables, config, namespace, root, targetFramework, version, useAuth);

  const layouts = isMudBlazor
    ? generateMudBlazorLayouts(tables, config, namespace, root, useAuth, queries, reports)
    : generateBlazorLayouts(tables, config, namespace, root, useAuth, queries, reports);

  const pages = isMudBlazor
    ? generateMudBlazorPages(tables, config, namespace, root, useAuth, queries, reports, relationships)
    : generateBlazorPages(tables, config, namespace, root, useAuth, queries, reports, relationships);

  return [
    // Project Manifest & Configs
    ...projectFiles,

    // Core Multi-Backend Services
    ...generateBlazorServices(config, namespace, root, useAuth),

    // Models
    ...generateBlazorModels(tables, namespace, root, useAuth),

    // Layouts & Nav
    ...layouts,

    // Rich Interactive Pages & Dashboard
    ...pages,

    // IndexedDB Offline JavaScript File
    generateBlazorIndexedDb(tables, root)
  ];
};
