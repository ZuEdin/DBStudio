
import { Table, BackendConfig, VirtualFile, Relationship, Query, Form, Report } from '../types/index';
import { generateDotNet } from './generators/dotnetGenerator';
import { generateNodeJs } from './generators/nodeGenerator';
import { generateAngular } from './generators/angularGenerator';
import { generateReact } from './generators/reactGenerator';
import { generatePhp } from './generators/phpGenerator';
import { generateLaravel } from './generators/laravelGenerator';
import { generateDatabaseScripts } from './generators/databaseGenerator';

// Main Generator Function
export const generateBackendCode = (
    tables: Table[], 
    relationships: Relationship[], 
    queries: Query[], 
    config: BackendConfig, 
    forms: Form[] = [], 
    reports: Report[] = []
): VirtualFile[] => {
  let files: VirtualFile[] = [];

  // 1. Generate Backend Language Code
  if (config.language === 'dotnet') {
    files = generateDotNet(tables, relationships, queries, config);
  } else if (config.language === 'nodejs') {
    files = generateNodeJs(tables, relationships, queries, config);
  } else if (config.language === 'php') {
    files = generatePhp(tables, relationships, queries, config);
  } else if (config.language === 'laravel' || config.language === 'php-laravel' as any) {
    files = generateLaravel(tables, relationships, queries, config);
  }

  // 2. Generate Database Schema/Scripts (Common for all backends)
  const dbFiles = generateDatabaseScripts(tables, relationships, config, queries);
  files = [...files, ...dbFiles];

  // 3. Generate Frontend Code
  if (config.frontendFramework === 'angular') {
    const angularFiles = generateAngular(tables, relationships, queries, forms, config, reports);
    files = [...files, ...angularFiles];
  } else if (config.frontendFramework === 'react') {
    const reactFiles = generateReact(tables, relationships, queries, config, forms, reports);
    files = [...files, ...reactFiles];
  }

  return files;
};
