import { Table, Relationship, Query, BackendConfig, VirtualFile, Form, Report, DbType } from '../../../types/index';
import { generateTauriFrontend } from './frontend';
import { generateTauriConfigs } from './config';
import { generateTauriRustFiles } from './rust';
import { generateTauriScripts } from './scripts';
import { generateDatabaseScripts } from '../databaseGenerator';

export const generateTauri = (
  tables: Table[], 
  relationships: Relationship[], 
  queries: Query[], 
  config: BackendConfig, 
  forms: Form[], 
  reports: Report[]
): VirtualFile[] => {
  const root = `TauriApp`;
  
  const safeTables = tables || [];
  const safeRelationships = relationships || [];
  const safeQueries = queries || [];
  const safeForms = forms || [];
  const safeReports = reports || [];

  const dbTypeStr = String(config.dbType || 'sqlite').toLowerCase();
  const fePort = config.frontendPort || 3002;

  let defaultDbPort = 3306;
  if (dbTypeStr === 'postgres' || dbTypeStr === 'postgresql') defaultDbPort = 5432;
  if (dbTypeStr === 'mssql' || dbTypeStr === 'sqlserver') defaultDbPort = 1433;

  const frontendFiles = generateTauriFrontend(
    safeTables, safeRelationships, safeQueries, config, safeForms, safeReports, root, fePort
  );

  const configFiles = generateTauriConfigs(config, root);

  const rustFiles = generateTauriRustFiles(config, root, dbTypeStr, defaultDbPort);

  const scriptFiles = generateTauriScripts(config, root, dbTypeStr, defaultDbPort);

  // Generate database schema and seed data for SQLite / SQL in TauriApp root & src-tauri
  const dbScripts = generateDatabaseScripts(safeTables, safeRelationships, { ...config, dbType: DbType.SQLite }, safeQueries);
  const sqlFile = dbScripts.find(f => f.name === 'schema.sql');
  const dbFiles: VirtualFile[] = [];
  if (sqlFile) {
    dbFiles.push({
      name: 'seed.sql',
      path: `${root}/seed.sql`,
      content: sqlFile.content,
      language: 'sql'
    });
    dbFiles.push({
      name: 'seed.sql',
      path: `${root}/src-tauri/seed.sql`,
      content: sqlFile.content,
      language: 'sql'
    });
  }

  return [
    ...frontendFiles,
    ...configFiles,
    ...rustFiles,
    ...scriptFiles,
    ...dbFiles
  ];
};
