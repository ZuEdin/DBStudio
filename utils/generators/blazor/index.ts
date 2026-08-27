import { Table, Relationship, Query, BackendConfig, VirtualFile, Form, Report } from '../../../types/index';
import { generateBlazorProjectFiles } from './projectFiles';
import { generateBlazorServices } from './services';
import { generateBlazorModels } from './models';
import { generateBlazorLayouts } from './layouts';
import { generateBlazorPages } from './pages';
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

  let version = config.backendVersion || '9.0';
  if (parseFloat(version) > 10.0) {
    version = '10.0';
  }
  const targetFramework = `net${version}`;

  return [
    // Project Manifest & Configs
    ...generateBlazorProjectFiles(tables, config, namespace, root, targetFramework, version, useAuth),

    // Core Multi-Backend Services
    ...generateBlazorServices(config, namespace, root, useAuth),

    // Models
    ...generateBlazorModels(tables, namespace, root, useAuth),

    // Layouts & Nav
    ...generateBlazorLayouts(tables, config, namespace, root, useAuth),

    // Rich Interactive Pages & Dashboard
    ...generateBlazorPages(tables, config, namespace, root, useAuth),

    // IndexedDB Offline JavaScript File
    generateBlazorIndexedDb(tables, root)
  ];
};
