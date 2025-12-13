
import { Table, BackendConfig, VirtualFile, Relationship, Query, Form, Report } from '../types/index';
import { generateDotNet } from './generators/dotnetGenerator';
import { generateNodeJs } from './generators/nodeGenerator';
import { generateAngular } from './generators/angularGenerator';
import { generateReact } from './generators/reactGenerator';
import { generatePhp } from './generators/phpGenerator';

// Main Generator Function
export const generateBackendCode = (
    tables: Table[], 
    relationships: Relationship[], 
    queries: Query[], 
    config: BackendConfig, 
    forms: Form[] = [], 
    reports: Report[] = [] // Add reports param
): VirtualFile[] => {
  let files: VirtualFile[] = [];

  if (config.language === 'dotnet') {
    files = generateDotNet(tables, relationships, queries, config);
  } else if (config.language === 'nodejs') {
    files = generateNodeJs(tables, relationships, queries, config);
  } else if (config.language === 'php') {
    files = generatePhp(tables, relationships, queries, config);
  }

  // Frontend Selection
  if (config.frontendFramework === 'angular') {
    const angularFiles = generateAngular(tables, relationships, queries, forms, config, reports);
    files = [...files, ...angularFiles];
  } else if (config.frontendFramework === 'react') {
    // Pass reports to React generator
    const reactFiles = generateReact(tables, relationships, queries, config, forms, reports);
    files = [...files, ...reactFiles];
  }

  return files;
};
