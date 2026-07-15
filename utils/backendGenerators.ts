
import { Table, BackendConfig, VirtualFile, Relationship, Query, Form, Report, CustomPage } from '../types/index';
import { generateDotNet } from './generators/dotnetGenerator';
import { generateNodeJs } from './generators/nodeGenerator';
import { generateAngular } from './generators/angularGenerator';
import { generateReact } from './generators/reactGenerator';
import { generatePhp } from './generators/phpGenerator';
import { generateLaravel } from './generators/laravelGenerator';
import { generateBlazor } from './generators/blazorGenerator';
import { generateMaui } from './generators/maui/index';
import { generateMauiNative } from './generators/mauiNative/index';
import { generateElectron } from './generators/electronGenerator';
import { generateVue } from './generators/vueGenerator';
import { generatePython } from './generators/pythonGenerator';
import { generateMarkdownApiDocs } from "./generators/markdownApiGenerator";
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
    pages: CustomPage[] = [],
    customComponents: any[] = []
): VirtualFile[] => {
  let files: VirtualFile[] = [];

    const toPascalCase = (str) => {
        if (!str) return '';
        const words = str.match(/[a-z]+/gi) || [];
        return words.map(w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()).join('');
    };
    
    // Globally ensure that fields/columns do not have the same name as their table/class!
    // This resolves compile errors in many languages and improves UI component safety.
    const safeTables = tables.map(t => {
        const safeName = toPascalCase(t.name);
        return {
            ...t,
            fields: t.fields.map(f => {
                const propName = toPascalCase(f.name);
                if (propName === safeName) {
                    return {
                        ...f,
                        name: f.name + 'Value',
                        title: f.title || f.name
                    };
                }
                return f;
            })
        };
    });

    const safeQueries = queries.map(q => {
        const safeName = toPascalCase(q.name);
        return {
            ...q,
            columns: (q.columns || []).map(c => {
                const propName = toPascalCase(c.alias || c.fieldName);
                if (propName === safeName) {
                    return {
                        ...c,
                        alias: (c.alias || c.fieldName) + 'Value'
                    };
                }
                return c;
            })
        };
    });
    
    tables = safeTables;
    queries = safeQueries;


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
  } else if (activeConfig.language === 'python') {
    files = generatePython(tables, relationships, queries, activeConfig);
  }

  // 2. Generate Database Schema/Scripts (Common for all backends)
  const dbFiles = generateDatabaseScripts(tables, relationships, activeConfig, queries);
  files = [...files, ...dbFiles];

  // 3. Generate Frontend Code
  if (activeConfig.frontendFramework === 'angular') {
    const angularFiles = generateAngular(tables, relationships, queries, forms, activeConfig, reports, pages, customComponents);
    files = [...files, ...angularFiles];
  } else if (activeConfig.frontendFramework === 'react') {
    const reactFiles = generateReact(tables, relationships, queries, activeConfig, forms, reports, pages, customComponents);
    files = [...files, ...reactFiles];
  } else if (activeConfig.frontendFramework === 'blazor') {
    const blazorFiles = generateBlazor(tables, relationships, queries, activeConfig, forms, reports);
    files = [...files, ...blazorFiles];
  } else if (activeConfig.frontendFramework === 'maui') {
    const mauiFiles = generateMaui(tables, relationships, queries, activeConfig, forms, reports);
    files = [...files, ...mauiFiles];
  } else if (activeConfig.frontendFramework === 'maui-native') {
    const mauiNativeFiles = generateMauiNative(tables, relationships, queries, activeConfig, forms, reports);
    files = [...files, ...mauiNativeFiles];
  } else if (activeConfig.frontendFramework === 'vue') {
    const vueFiles = generateVue(tables, relationships, queries, activeConfig, forms, reports, pages, customComponents);
    files = [...files, ...vueFiles];
  } else if (activeConfig.frontendFramework === 'electron' || activeConfig.language === 'electron') {
    const electronFiles = generateElectron(tables, relationships, queries, activeConfig, forms, reports);
    files = [...files, ...electronFiles];
  }

  // --- SPECIAL POST-PROCESSING FOR BLAZOR & MAUI + .NET ---
  // Transforms the structure from "Backend/Project" & "Frontend/Project.Client" (or Project.Maui)
  // to "Project" & "Project.Client" (or Project.Maui) at root level + Solution File
  if (activeConfig.language === 'dotnet' && (
      activeConfig.frontendFramework === 'blazor' || 
      activeConfig.frontendFramework === 'maui' || 
      activeConfig.frontendFramework === 'maui-native'
  )) {
      const isMaui = activeConfig.frontendFramework === 'maui';
      const isMauiNative = activeConfig.frontendFramework === 'maui-native';
      const backendPrefix = `Backend/${activeConfig.projectName}.Server`;
      
      let frontendPrefix = `Frontend/${activeConfig.projectName}.Client`;
      let targetFrontendName = `${activeConfig.projectName}.Client`;
      
      if (isMaui) {
          frontendPrefix = `Frontend/${activeConfig.projectName}.Maui`;
          targetFrontendName = `${activeConfig.projectName}.Maui`;
      } else if (isMauiNative) {
          frontendPrefix = `Frontend/${activeConfig.projectName}.MauiNative`;
          targetFrontendName = `${activeConfig.projectName}.MauiNative`;
      }
      
      files.forEach(f => {
          // Move Backend up to Root
          if (f.path.startsWith(backendPrefix)) {
              f.path = f.path.replace(backendPrefix, `${activeConfig.projectName}.Server`);
          }
          // Move Frontend up to Root
          if (f.path.startsWith(frontendPrefix)) {
              f.path = f.path.replace(frontendPrefix, targetFrontendName);
          }
      });

      // Add Visual Studio Solution File
      files.push(generateSolution(activeConfig));
  }

  const apiDocsMd = generateMarkdownApiDocs(tables, activeConfig);
  files.push({ name: "API_DOCUMENTATION.md", path: "API_DOCUMENTATION.md", content: apiDocsMd, language: "markdown" });
  return files;
};
