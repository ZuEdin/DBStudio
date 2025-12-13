
import { Table, BackendConfig, VirtualFile, Relationship, Query, Form } from '../types/index';
import { generateDotNet } from './generators/dotnetGenerator';
import { generateNodeJs } from './generators/nodeGenerator';
import { generateAngular } from './generators/angularGenerator';
import { generateReact } from './generators/reactGenerator';
import { generatePhp } from './generators/phpGenerator';

// Main Generator Function
export const generateBackendCode = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig, forms: Form[] = []): VirtualFile[] => {
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
    const angularFiles = generateAngular(tables, relationships, queries, forms, config);
    files = [...files, ...angularFiles];
  } else if (config.frontendFramework === 'react') {
    const reactFiles = generateReact(tables, relationships, queries, config);
    files = [...files, ...reactFiles];
  }

  return files;
};
