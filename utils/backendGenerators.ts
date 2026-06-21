
import { Table, BackendConfig, VirtualFile, Relationship, Query, Form, Report, CustomPage } from '../types/index';
import { generateDotNet } from './generators/dotnetGenerator';
import { generateNodeJs } from './generators/nodeGenerator';
import { generateAngular } from './generators/angularGenerator';
import { generateReact } from './generators/reactGenerator';
import { generatePhp } from './generators/phpGenerator';
import { generateLaravel } from './generators/laravelGenerator';
import { generateBlazor } from './generators/blazorGenerator';
import { generateElectron } from './generators/electronGenerator';
import { generateVue } from './generators/vueGenerator';
import { generateDatabaseScripts } from './generators/databaseGenerator';
import { generateSolution } from './generators/dotnet/solution';

// Main Generator Function
export const generateBackendCode = (
    tables: Table[], 
    relationships: Relationship[], 
    queries: Query[], 
    config: BackendConfig, 
    forms: Form[] = [], 
    reports: Report[] = [],
    pages: CustomPage[] = []
): VirtualFile[] => {
  let files: VirtualFile[] = [];

  // Normalize Auth Config (Legacy String -> Mapping)
  // Ensures that simple comma-separated lists from the wizard are converted to proper Role Mappings for the backend
  const activeConfig = { ...config }; 
  if (activeConfig.authConfig) {
      activeConfig.authConfig = { ...activeConfig.authConfig }; // Shallow copy auth level
      if (activeConfig.authConfig.useWindowsAuth && 
          activeConfig.authConfig.useAdGroups && 
          activeConfig.authConfig.adGroups && 
          (!activeConfig.authConfig.adMapping || activeConfig.authConfig.adMapping.length === 0)) {
          
          const groups = activeConfig.authConfig.adGroups.split(',').map(g => g.trim()).filter(g => g);
          // Default mapping to 'User' role if not specified otherwise
          activeConfig.authConfig.adMapping = groups.map(g => ({ groupName: g, roleName: 'User' }));
      }
  }

  // 1. Generate Backend Language Code
  if (activeConfig.language === 'dotnet') {
    files = generateDotNet(tables, relationships, queries, activeConfig);
  } else if (activeConfig.language === 'nodejs' || activeConfig.language === 'electron') {
    // Treat 'electron' as 'nodejs' for the backend API structure
    files = generateNodeJs(tables, relationships, queries, activeConfig);
  } else if (activeConfig.language === 'php') {
    files = generatePhp(tables, relationships, queries, activeConfig);
  } else if (activeConfig.language === 'laravel' || activeConfig.language === 'php-laravel' as any) {
    files = generateLaravel(tables, relationships, queries, activeConfig);
  }

  // 2. Generate Database Schema/Scripts (Common for all backends)
  const dbFiles = generateDatabaseScripts(tables, relationships, activeConfig, queries);
  files = [...files, ...dbFiles];

  // 3. Generate Frontend Code
  if (activeConfig.frontendFramework === 'angular') {
    const angularFiles = generateAngular(tables, relationships, queries, forms, activeConfig, reports);
    files = [...files, ...angularFiles];
  } else if (activeConfig.frontendFramework === 'react') {
    const reactFiles = generateReact(tables, relationships, queries, activeConfig, forms, reports, pages);
    files = [...files, ...reactFiles];
  } else if (activeConfig.frontendFramework === 'blazor') {
    const blazorFiles = generateBlazor(tables, relationships, queries, activeConfig, forms, reports);
    files = [...files, ...blazorFiles];
  } else if (activeConfig.frontendFramework === 'vue') {
    const vueFiles = generateVue(tables, relationships, queries, activeConfig);
    files = [...files, ...vueFiles];
  } else if (activeConfig.frontendFramework === 'electron' || activeConfig.language === 'electron') {
    const electronFiles = generateElectron(tables, relationships, queries, activeConfig, forms, reports);
    files = [...files, ...electronFiles];
  }

  // --- SPECIAL POST-PROCESSING FOR BLAZOR + .NET ---
  // Transforms the structure from "Backend/Project" & "Frontend/Project.Client"
  // to "Project" & "Project.Client" at root level + Solution File
  if (activeConfig.language === 'dotnet' && activeConfig.frontendFramework === 'blazor') {
      const backendPrefix = `Backend/${activeConfig.projectName}`;
      const frontendPrefix = `Frontend/${activeConfig.projectName}.Client`;
      
      files.forEach(f => {
          // Move Backend up to Root
          if (f.path.startsWith(backendPrefix)) {
              f.path = f.path.replace(backendPrefix, activeConfig.projectName);
          }
          // Move Frontend up to Root
          if (f.path.startsWith(frontendPrefix)) {
              f.path = f.path.replace(frontendPrefix, `${activeConfig.projectName}.Client`);
          }
      });

      // Add Visual Studio Solution File
      files.push(generateSolution(activeConfig));
  }

  return files;
};
