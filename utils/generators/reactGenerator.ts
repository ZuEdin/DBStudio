
import { Table, Query, SelectQuery, VirtualFile, Relationship, BackendConfig, Form, FormElement, Report, ReportColumn } from '../../types/index';
import { resolveType, isNullable } from './common';

// Helper: Convert string to camelCase (e.g. "KundenID" -> "kundenID")
const toCamelCase = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toLowerCase() + str.slice(1);
};

// Helper: Convert string to PascalCase (e.g. "kundenID" -> "KundenID", "my report" -> "MyReport")
const toPascalCase = (str: string) => {
  if (!str) return '';
  const clean = str.replace(/[^a-zA-Z0-9]/g, '');
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

// Helper: Collect all lookup configurations from the layout tree
const collectLookups = (element: FormElement, tables: Table[], accumulated: any[] = []) => {
    if (element.widgetType === 'select' && element.lookup && element.lookup.tableId) {
        const table = tables.find(t => t.id === element.lookup!.tableId);
        if (table) {
            const variableName = `${toCamelCase(table.name)}List`;
            // Avoid duplicates
            if (!accumulated.find(l => l.variableName === variableName)) {
                accumulated.push({
                    table,
                    variableName,
                    endpoint: table.name.toLowerCase()
                });
            }
        }
    }
    if (element.children) {
        element.children.forEach(child => collectLookups(child, tables, accumulated));
    }
    return accumulated;
};

// Helper: Recursive JSX Generation for Layouts
const generateJsxForLayout = (element: FormElement, tables: Table[], dataVar: string = 'data'): string => {
    if (element.type === 'container') {
        const childrenJsx = element.children?.map(c => generateJsxForLayout(c, tables, dataVar)).join('\n') || '';
        let className = element.className || '';
        return `<div className="${className}">\n${childrenJsx}\n</div>`;
    } 
    else if (element.type === 'label') {
        return `<div className="${element.className || 'text-lg font-bold mb-2'}">${element.label}</div>`;
    } 
    else if (element.type === 'field' && element.fieldId) {
        // Find field definition to know type
        let fieldName = '';
        let fieldType = 'text';
        let isAuto = false;
        
        for (const t of tables) {
            const f = t.fields.find(field => field.id === element.fieldId);
            if (f) {
                fieldName = f.name;
                isAuto = !!f.isAutoIncrement;
                if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') fieldType = 'number';
                else if (f.type === 'DATE') fieldType = 'date';
                else if (f.type === 'BOOLEAN') fieldType = 'checkbox';
                break;
            }
        }

        if (!fieldName) return `{/* Field ${element.label} not found */}`;
        const bindProp = toCamelCase(fieldName);
        const className = element.className || 'mb-4';

        // --- HANDLE SELECT / LOOKUP ---
        if (element.widgetType === 'select' && element.lookup) {
            const lookupTable = tables.find(t => t.id === element.lookup!.tableId);
            if (lookupTable) {
                const listVar = `${toCamelCase(lookupTable.name)}List`;
                const valueField = lookupTable.fields.find(f => f.id === element.lookup!.valueFieldId);
                const valueProp = valueField ? toCamelCase(valueField.name) : 'id';
                
                // Construct Label Expression
                let labelExpr = '';
                if (element.lookup.displayFormat && element.lookup.displayFormat.length > 0) {
                    const parts = element.lookup.displayFormat.map(fmt => {
                        const f = lookupTable.fields.find(field => field.id === fmt.fieldId);
                        if (!f) return "''";
                        const p = fmt.prefix ? `'${fmt.prefix}' + ` : '';
                        const s = fmt.suffix ? ` + '${fmt.suffix}'` : '';
                        return `${p}(item.${toCamelCase(f.name)} || '')${s}`;
                    });
                    labelExpr = parts.join(' + ');
                } else if (element.lookup.labelFields && element.lookup.labelFields.length > 0) {
                    const parts = element.lookup.labelFields.map(fid => {
                        const f = lookupTable.fields.find(field => field.id === fid);
                        return f ? `(item.${toCamelCase(f.name)} || '')` : "''";
                    });
                    labelExpr = parts.join(" + ' ' + ");
                } else {
                    labelExpr = `item.${valueProp}`;
                }

                const showQuickCreate = element.lookup.allowQuickCreate;
                const quickCreateAction = `navigate('/${lookupTable.name.toLowerCase()}/new')`;

                // Handle Number casting for value
                const valueCaster = fieldType === 'number' ? 'Number(e.target.value)' : 'e.target.value';

                return `
                <div className="${className}">
                    <label className="block text-sm font-medium text-gray-700 mb-1">${element.label}</label>
                    <div className="flex gap-2">
                        <select
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none flex-1"
                            value={${dataVar}.${bindProp} || ''}
                            disabled={${isAuto}}
                            onChange={e => setData({...${dataVar}, ${bindProp}: ${valueCaster}})}
                        >
                            <option value="">Bitte wählen...</option>
                            {${listVar}.map(item => (
                                <option key={item.${valueProp}} value={item.${valueProp}}>
                                    {${labelExpr}}
                                </option>
                            ))}
                        </select>
                        ${showQuickCreate ? `
                        <button 
                            type="button"
                            onClick={() => ${quickCreateAction}}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 rounded px-3 flex items-center justify-center transition-colors"
                            title="Neuen Eintrag erstellen"
                        >
                            <Plus size={18} />
                        </button>` : ''}
                    </div>
                </div>`;
            }
        }

        // --- HANDLE CHECKBOX ---
        if (fieldType === 'checkbox') {
             return `
            <div className="flex items-center gap-2 mb-4 ${className}">
                <input 
                    type="checkbox"
                    id="${bindProp}"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={${dataVar}.${bindProp} || false}
                    disabled={${isAuto}}
                    onChange={e => setData({...${dataVar}, ${bindProp}: e.target.checked})}
                />
                <label htmlFor="${bindProp}" className="text-sm font-medium text-gray-700">${element.label}</label>
            </div>`;
        }

        // --- HANDLE TEXTAREA ---
        if (element.widgetType === 'textarea') {
             return `
            <div className="${className}">
                <label className="block text-sm font-medium text-gray-700 mb-1">${element.label}</label>
                <textarea
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={3}
                    value={${dataVar}.${bindProp} || ''}
                    disabled={${isAuto}}
                    onChange={e => setData({...${dataVar}, ${bindProp}: e.target.value})}
                />
            </div>`;
        }

        // --- STANDARD INPUT (Text, Number, Date) ---
        // Proper casting for numbers
        const onChangeLogic = fieldType === 'number' 
            ? `onChange={e => setData({...${dataVar}, ${bindProp}: e.target.value === '' ? undefined : Number(e.target.value)})}`
            : `onChange={e => setData({...${dataVar}, ${bindProp}: e.target.value})}`;

        return `
        <div className="${className}">
            <label className="block text-sm font-medium text-gray-700 mb-1">${element.label}</label>
            <input 
                type="${fieldType}" 
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                value={${dataVar}.${bindProp} !== undefined ? ${dataVar}.${bindProp} : ''}
                disabled={${isAuto}}
                ${onChangeLogic}
            />
        </div>`;
    } 
    else if (element.type === 'subform') {
        return `
        <div className="border border-indigo-200 bg-indigo-50 p-4 rounded mb-4">
            <h3 className="font-bold text-indigo-800 mb-2">${element.label}</h3>
            <p className="text-sm text-indigo-600">Subform-Komponente hier einfügen...</p>
            {/* <${toPascalCase(element.label || 'Subform')} masterId={${dataVar}.id} /> */}
        </div>`;
    }
    return '';
};

export const generateReact = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig, forms: Form[] = [], reports: Report[] = []): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Frontend`;

  // 1. package.json
  const packageJson = {
    "name": "react-client",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "preview": "vite preview"
    },
    "dependencies": {
      "axios": "^1.6.2",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-router-dom": "^6.20.0",
      "lucide-react": "^0.294.0"
    },
    "devDependencies": {
      "@types/react": "^18.2.37",
      "@types/react-dom": "^18.2.15",
      "@vitejs/plugin-react": "^4.2.0",
      "autoprefixer": "^10.4.16",
      "postcss": "^8.4.31",
      "tailwindcss": "^3.3.5",
      "typescript": "^5.2.2",
      "vite": "^5.0.0"
    }
  };
  files.push({ name: 'package.json', path: `${root}/package.json`, content: JSON.stringify(packageJson, null, 2), language: 'json' });

  // 1a. tsconfig.json (Missing in previous version)
  const tsConfig = {
    "compilerOptions": {
      "target": "ES2020",
      "useDefineForClassFields": true,
      "lib": ["ES2020", "DOM", "DOM.Iterable"],
      "module": "ESNext",
      "skipLibCheck": true,
      "moduleResolution": "bundler",
      "allowImportingTsExtensions": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true,
      "jsx": "react-jsx",
      "strict": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noFallthroughCasesInSwitch": true
    },
    "include": ["src"],
    "references": [{ "path": "./tsconfig.node.json" }]
  };
  files.push({ name: 'tsconfig.json', path: `${root}/tsconfig.json`, content: JSON.stringify(tsConfig, null, 2), language: 'json' });

  // 1b. tsconfig.node.json
  const tsConfigNode = {
    "compilerOptions": {
      "composite": true,
      "skipLibCheck": true,
      "module": "ESNext",
      "moduleResolution": "bundler",
      "allowSyntheticDefaultImports": true
    },
    "include": ["vite.config.ts"]
  };
  files.push({ name: 'tsconfig.node.json', path: `${root}/tsconfig.node.json`, content: JSON.stringify(tsConfigNode, null, 2), language: 'json' });

  // 1c. postcss.config.js (Missing in previous version)
  const postCssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
  files.push({ name: 'postcss.config.js', path: `${root}/postcss.config.js`, content: postCssConfig, language: 'javascript' });

  // 1d. src/vite-env.d.ts (Recommended)
  const viteEnv = `/// <reference types="vite/client" />`;
  files.push({ name: 'vite-env.d.ts', path: `${root}/src/vite-env.d.ts`, content: viteEnv, language: 'typescript' });

  // 2. vite.config.ts
  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})
`;
  files.push({ name: 'vite.config.ts', path: `${root}/vite.config.ts`, content: viteConfig, language: 'typescript' });

  // 3. Tailwind & CSS
  files.push({ name: 'tailwind.config.js', path: `${root}/tailwind.config.js`, content: `export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`, language: 'javascript' });

  files.push({ name: 'index.css', path: `${root}/src/index.css`, content: `@tailwind base;
@tailwind components;
@tailwind utilities;
@media print {
  @page { margin: 0; }
  body { margin: 1.6cm; }
  .no-print { display: none !important; }
}
`, language: 'css' });

  // 4. API Service & Config
  const apiService = `import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:${config.port}/api';

export const api = axios.create({
  baseURL: API_URL
});

export const get = async <T>(endpoint: string) => {
  const response = await api.get<T>(endpoint);
  return response.data;
};

export const post = async <T>(endpoint: string, data: any) => {
  const response = await api.post<T>(endpoint, data);
  return response.data;
};

export const put = async <T>(endpoint: string, data: any) => {
  const response = await api.put<T>(endpoint, data);
  return response.data;
};

export const remove = async (endpoint: string) => {
  await api.delete(endpoint);
};
`;
  files.push({ name: 'api.ts', path: `${root}/src/services/api.ts`, content: apiService, language: 'typescript' });

  // 5. Types
  let typesContent = '';
  tables.forEach(table => {
    // Basic Fields
    const props = table.fields.map(f => {
        const tsType = resolveType(f, 'typescript');
        const optional = isNullable(f) ? '?' : '';
        return `  ${toCamelCase(f.name)}${optional}: ${tsType};`;
    });

    // Relations
    const parentRels = relationships.filter(r => r.toTableId === table.id);
    parentRels.forEach(r => {
        const parent = tables.find(t => t.id === r.fromTableId);
        if(parent) props.push(`  ${toCamelCase(parent.name)}?: ${parent.name};`);
    });

    const childRels = relationships.filter(r => r.fromTableId === table.id);
    childRels.forEach(r => {
        const child = tables.find(t => t.id === r.toTableId);
        if(child) props.push(`  ${toCamelCase(child.name)}s?: ${child.name}[];`);
    });

    typesContent += `export interface ${table.name} {\n${props.join('\n')}\n}\n\n`;
  });
  files.push({ name: 'types.ts', path: `${root}/src/types/index.ts`, content: typesContent, language: 'typescript' });

  // 6. Generated Custom Forms
  const generatedFormRoutes: string[] = [];
  const generatedFormImports: string[] = [];

  forms.forEach(form => {
      const sourceTable = tables.find(t => t.id === form.sourceId);
      if (!sourceTable) return;

      // FIX: Use PascalCase to ensure React treats it as a Component
      const componentName = `${toPascalCase(form.name)}Form`; 
      const tableName = sourceTable.name;
      const camelTableName = toCamelCase(tableName);
      
      const lookups = form.layout ? collectLookups(form.layout, tables) : [];
      
      // Prepare Imports
      const tableImports = new Set<string>();
      tableImports.add(tableName);
      lookups.forEach(l => tableImports.add(l.table.name));
      const importsStr = Array.from(tableImports).join(', ');

      // Prepare State
      const stateDeclarations = lookups.map(l => 
          `  const [${l.variableName}, set${l.variableName}] = useState<${l.table.name}[]>([]);`
      ).join('\n');

      // Prepare Effects
      const effectLoadCalls = lookups.map(l => 
          `        get<${l.table.name}[]>('${l.endpoint}').then(set${l.variableName});`
      ).join('\n');

      let layoutJsx = '';
      if (form.layout) {
          layoutJsx = generateJsxForLayout(form.layout, tables, 'data');
      } else {
          layoutJsx = `<p>Leeres Layout</p>`;
      }

      const formContent = `import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ${importsStr} } from '../../types';
import { get, post, put } from '../../services/api';
import { Save, X, Plus } from 'lucide-react';

export const ${componentName} = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Partial<${tableName}>>({});
  const [loading, setLoading] = useState(false);
${stateDeclarations}

  useEffect(() => {
${effectLoadCalls}
    if (id && id !== 'new') {
        loadData();
    }
  }, [id]);

  const loadData = async () => {
      try {
          setLoading(true);
          const item = await get<${tableName}>(\`${camelTableName.toLowerCase()}/\${id}\`);
          setData(item);
      } catch (err) {
          console.error(err);
          alert('Fehler beim Laden');
      } finally {
          setLoading(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (id && id !== 'new') {
              await put(\`${camelTableName.toLowerCase()}/\${id}\`, data);
          } else {
              await post('${camelTableName.toLowerCase()}', data);
          }
          navigate(-1); // Go back
      } catch (err) {
          alert('Speichern fehlgeschlagen');
      }
  };

  if (loading) return <div className="p-10">Lade...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800">${form.name}</h1>
          <button onClick={() => navigate(-1)}><X className="text-gray-500 hover:text-gray-700"/></button>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
        
        {/* Generated Layout */}
        ${layoutJsx}

        <div className="pt-6 border-t mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded font-medium">Abbrechen</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium flex items-center gap-2">
                <Save size={18} /> Speichern
            </button>
        </div>
      </form>
    </div>
  );
};`;
      files.push({ name: `${componentName}.tsx`, path: `${root}/src/pages/forms/${componentName}.tsx`, content: formContent, language: 'typescript' });
      
      generatedFormImports.push(`import { ${componentName} } from './pages/forms/${componentName}';`);
      generatedFormRoutes.push(`<Route path="/forms/${componentName.toLowerCase()}/:id" element={<${componentName} />} />`);
  });

  // 6.5 Generated Reports
  const generatedReportRoutes: string[] = [];
  const generatedReportImports: string[] = [];

  if (reports && reports.length > 0) {
      reports.forEach(report => {
          // FIX: Use PascalCase for Reports too
          const componentName = `${toPascalCase(report.name)}Report`;
          
          let endpoint = '';
          if (report.sourceType === 'table') {
              const table = tables.find(t => t.id === report.sourceId);
              endpoint = table ? table.name.toLowerCase() : '';
          } else {
              const query = queries.find(q => q.id === report.sourceId);
              endpoint = query ? `queries/${query.name.replace(/\s+/g, '-').toLowerCase()}` : '';
          }

          // ... (Report generation logic remains similar, ensuring component name is used correctly) ...
          let colMappingLogic = `
          // Map columns
          const columns = [
            ${(report.columns || []).map(col => {
                let fieldName = 'unknown';
                if (report.sourceType === 'table') {
                    const table = tables.find(t => t.id === report.sourceId);
                    const f = table?.fields.find(f => f.id === col.fieldId);
                    if(f) fieldName = f.name;
                } else {
                    const query = queries.find(q => q.id === report.sourceId);
                    if (query && query.type === 'SELECT') {
                        const qc = query.columns.find(c => c.id === col.fieldId);
                        if(qc) fieldName = qc.alias || qc.fieldName;
                    }
                }
                
                return `{ label: "${col.label}", prop: "${toCamelCase(fieldName)}", visible: ${col.visible} }`;
            }).join(',\n            ')}
          ];`;

          // Grouping Logic
          let groupingLogic = '';
          let groupingFieldProp = '';
          
          if (report.groupingFieldId) {
                let gFieldName = '';
                if (report.sourceType === 'table') {
                    const table = tables.find(t => t.id === report.sourceId);
                    const f = table?.fields.find(f => f.id === report.groupingFieldId);
                    if(f) gFieldName = f.name;
                } else {
                    const query = queries.find(q => q.id === report.sourceId);
                    if (query && query.type === 'SELECT') {
                        const qc = query.columns.find(c => c.id === report.groupingFieldId);
                        if(qc) gFieldName = qc.alias || qc.fieldName;
                    }
                }
                groupingFieldProp = toCamelCase(gFieldName);

                groupingLogic = `
                const grouped = {};
                data.forEach(item => {
                    const key = String(item['${groupingFieldProp}'] || 'Unbekannt');
                    if(!grouped[key]) grouped[key] = [];
                    grouped[key].push(item);
                });
                
                return Object.entries(grouped).map(([key, items]) => ({
                    groupValue: key,
                    items,
                    // Summaries
                    summaries: {
                        ${report.summaries.map(s => {
                            const sumProp = toCamelCase(s.fieldName);
                            if (s.calculation === 'SUM') return `'${s.fieldName}_SUM': items.reduce((a, b) => a + (Number(b['${sumProp}']) || 0), 0)`;
                            if (s.calculation === 'COUNT') return `'${s.fieldName}_COUNT': items.length`;
                            return '';
                        }).join(',\n                        ')}
                    }
                })).sort((a,b) => a.groupValue.localeCompare(b.groupValue));
                `;
          } else {
                // No grouping
                groupingLogic = `
                return [{
                    groupValue: 'Gesamt',
                    items: data,
                    summaries: {
                        ${report.summaries.map(s => {
                            const sumProp = toCamelCase(s.fieldName);
                            if (s.calculation === 'SUM') return `'${s.fieldName}_SUM': data.reduce((a, b) => a + (Number(b['${sumProp}']) || 0), 0)`;
                            if (s.calculation === 'COUNT') return `'${s.fieldName}_COUNT': data.length`;
                            return '';
                        }).join(',\n                        ')}
                    }
                }];
                `;
          }

          const reportContent = `import React, { useEffect, useState, useMemo } from 'react';
import { get } from '../../services/api';
import { Printer } from 'lucide-react';

export const ${componentName} = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      setLoading(true);
      get<any[]>('${endpoint}')
        .then(res => setData(res))
        .catch(err => alert('Fehler beim Laden'))
        .finally(() => setLoading(false));
  }, []);

  ${colMappingLogic}

  const processedData = useMemo(() => {
      if(!data || data.length === 0) return [];
      ${groupingLogic}
  }, [data]);

  const handlePrint = () => window.print();

  if (loading) return <div className="p-10">Lade Bericht...</div>;

  return (
    <div className="p-8 bg-slate-100 min-h-screen print:bg-white print:p-0">
        <div className="max-w-5xl mx-auto bg-white shadow-lg border border-slate-200 p-10 min-h-[297mm] print:shadow-none print:border-none print:w-full">
            
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">${report.name}</h1>
                    <p className="text-slate-500 mt-1">Erstellt am: {new Date().toLocaleDateString()}</p>
                </div>
                <button onClick={handlePrint} className="no-print flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700">
                    <Printer size={16}/> Drucken
                </button>
            </div>

            <div className="space-y-8">
                {processedData.map((group: any, idx: number) => (
                    <div key={idx} className="break-inside-avoid">
                        ${groupingFieldProp ? `
                        <div className="bg-slate-100 p-2 border-l-4 border-slate-500 mb-2 mt-4 print:bg-slate-100 print:print-color-adjust-exact">
                            <h2 className="text-lg font-bold text-slate-700">
                                Gruppe: <span className="font-normal text-black">{group.groupValue}</span>
                            </h2>
                        </div>` : ''}

                        <table className="w-full text-sm border-collapse mb-4">
                            <thead>
                                <tr className="border-b-2 border-slate-400 text-left">
                                    {columns.filter(c => c.visible).map((col, cIdx) => (
                                        <th key={cIdx} className="p-2 font-bold uppercase text-slate-600">{col.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {group.items.map((item: any, rIdx: number) => (
                                    <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50 print:hover:bg-transparent">
                                        {columns.filter(c => c.visible).map((col, cIdx) => (
                                            <td key={cIdx} className="p-2">{String(item[col.prop] || '')}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {Object.keys(group.summaries).length > 0 && (
                            <div className="bg-slate-50 p-2 border-t border-slate-300 rounded-b-md text-right text-sm print:bg-slate-50 print:print-color-adjust-exact">
                                {Object.entries(group.summaries).map(([k, v]) => (
                                    <div key={k}>
                                        <span className="font-semibold text-slate-600">{k.replace('_', ' ')}: </span>
                                        <span className="font-bold">{String(v)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="mt-10 text-center text-xs text-slate-400 print:fixed print:bottom-0 print:left-0 print:w-full print:p-2">
                Generiert mit DB Studio Pro
            </div>
        </div>
    </div>
  );
};`;
          files.push({ name: `${componentName}.tsx`, path: `${root}/src/pages/reports/${componentName}.tsx`, content: reportContent, language: 'typescript' });
          generatedReportImports.push(`import { ${componentName} } from './pages/reports/${componentName}';`);
          generatedReportRoutes.push(`<Route path="/reports/${componentName.toLowerCase()}" element={<${componentName} />} />`);
      });
  }

  // 7. App.tsx (Routing)
  // FIX: Collision Handling - Alias Standard CRUD Imports
  const standardRoutes = tables.map(t => {
      // Basic List View (we still generate these for admin purposes)
      return `          <Route path="/${t.name.toLowerCase()}" element={<${t.name}List />} />`;
  });
  
  // Imports for lists
  const tableImports = tables.map(t => {
      return `import { ${t.name}List } from './pages/${t.name}/${t.name}List';`; 
  });

  // Generate the List components as well (standard CRUD)
  tables.forEach(table => {
      const camelName = toCamelCase(table.name);
      const pkField = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
      const pkName = toCamelCase(pkField.name);

      const listComp = `import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ${table.name} } from '../../types';
import { get, remove } from '../../services/api';
import { Trash2, Edit, Plus } from 'lucide-react';

export const ${table.name}List = () => {
  const [items, setItems] = useState<${table.name}[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { const data = await get<${table.name}[]>('${table.name.toLowerCase()}'); setItems(data); } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: any) => {
    if(!confirm('Wirklich löschen?')) return;
    try { await remove(\`${table.name.toLowerCase()}/\${id}\`); loadData(); } catch (err) { alert('Fehler'); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">${table.name}</h1>
        <Link to="/${table.name.toLowerCase()}/new" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={16}/> Neu</Link>
      </div>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b uppercase text-gray-500">
            <tr>
              ${table.fields.slice(0, 5).map(f => `<th className="p-4 font-semibold">${f.name}</th>`).join('\n              ')}
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.${pkName}} className="border-b hover:bg-gray-50">
                ${table.fields.slice(0, 5).map(f => `<td className="p-4">{String(item.${toCamelCase(f.name)} || '')}</td>`).join('\n                ')}
                <td className="p-4 flex gap-2 justify-end">
                  <Link to={\`/${table.name.toLowerCase()}/\${item.${pkName}}\`} className="text-blue-600 hover:text-blue-800"><Edit size={16}/></Link>
                  <button onClick={() => handleDelete(item.${pkName})} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};`;
      files.push({ name: `${table.name}List.tsx`, path: `${root}/src/pages/${table.name}/${table.name}List.tsx`, content: listComp, language: 'typescript' });
      
      // Basic fallback Form (if no custom layout)
      const formComp = `import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ${table.name} } from '../../types';
import { get, post, put } from '../../services/api';

export const ${table.name}Form = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Partial<${table.name}>>({});

  useEffect(() => { if (id && id !== 'new') loadData(); }, [id]);

  const loadData = async () => { try { const item = await get<${table.name}>(\`${table.name.toLowerCase()}/\${id}\`); setData(item); } catch (e) {} };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (id && id !== 'new') await put(\`${table.name.toLowerCase()}/\${id}\`, data);
          else await post('${table.name.toLowerCase()}', data);
          navigate(-1);
      } catch (e) { alert('Error'); }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">${table.name}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 shadow rounded">
        ${table.fields.map(f => {
            const isNum = f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE';
            const bind = `data.${toCamelCase(f.name)}`;
            const changeHandler = isNum 
                ? `onChange={e=>setData({...data, ${toCamelCase(f.name)}: Number(e.target.value)})}` 
                : `onChange={e=>setData({...data, ${toCamelCase(f.name)}: e.target.value})}`;
            
            return `<div><label className="block text-sm font-bold">${f.name}</label><input type="${isNum ? 'number' : 'text'}" className="border w-full p-2 rounded" value={${bind}||''} ${changeHandler} /></div>`
        }).join('')}
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Speichern</button>
      </form>
    </div>
  );
};`;
      files.push({ name: `${table.name}Form.tsx`, path: `${root}/src/pages/${table.name}/${table.name}Form.tsx`, content: formComp, language: 'typescript' });
      
      // Alias the default form to prevent collision with custom forms
      tableImports.push(`import { ${table.name}Form as ${table.name}CrudForm } from './pages/${table.name}/${table.name}Form';`);
      standardRoutes.push(`          <Route path="/${table.name.toLowerCase()}/:id" element={<${table.name}CrudForm />} />`);
  });


  const appTsx = `import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Layout as LayoutIcon, Table as TableIcon, FileText as FileTextIcon } from 'lucide-react';

${tableImports.join('\n')}
${generatedFormImports.join('\n')}
${generatedReportImports.join('\n')}

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-100 font-sans">
        <aside className="w-64 bg-slate-900 text-white shrink-0 flex flex-col no-print">
          <div className="p-4 font-bold text-xl border-b border-slate-700 bg-slate-800">${config.projectName}</div>
          
          <nav className="flex-1 overflow-y-auto py-4">
            ${generatedFormRoutes.length > 0 ? `
            <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Formulare</div>
            ${forms.map(f => {
                // Ensure link uses PascalCase name
                const compName = toPascalCase(f.name) + 'Form';
                return `<Link to="/forms/${compName.toLowerCase()}/new" className="flex items-center gap-2 py-2 px-4 hover:bg-slate-800 text-sm"><LayoutIcon size={16}/> ${f.name}</Link>`;
            }).join('\n')}
            ` : ''}

            ${generatedReportRoutes.length > 0 ? `
            <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Berichte</div>
            ${reports.map(r => {
                const compName = toPascalCase(r.name) + 'Report';
                return `<Link to="/reports/${compName.toLowerCase()}" className="flex items-center gap-2 py-2 px-4 hover:bg-slate-800 text-sm text-green-300"><FileTextIcon size={16}/> ${r.name}</Link>`;
            }).join('\n')}
            ` : ''}

            <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Daten Tabellen</div>
            ${tables.map(t => `<Link to="/${t.name.toLowerCase()}" className="flex items-center gap-2 py-2 px-4 hover:bg-slate-800 text-sm text-slate-300"><TableIcon size={16}/> ${t.name}</Link>`).join('\n')}
          </nav>
        </aside>
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<div className="p-10 text-center text-gray-500">Wählen Sie ein Formular oder eine Tabelle.</div>} />
            {/* Standard CRUD */}
${standardRoutes.join('\n')}
            {/* Custom Forms */}
${generatedFormRoutes.join('\n')}
            {/* Reports */}
${generatedReportRoutes.join('\n')}
            {/* 404 Route */}
            <Route path="*" element={<div className="p-10 text-center text-red-500">Seite nicht gefunden (404)</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
`;
  files.push({ name: 'App.tsx', path: `${root}/src/App.tsx`, content: appTsx, language: 'typescript' });

  // 8. Main.tsx
  const mainTsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
  files.push({ name: 'main.tsx', path: `${root}/src/main.tsx`, content: mainTsx, language: 'typescript' });

  // 9. Index.html
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  files.push({ name: 'index.html', path: `${root}/index.html`, content: indexHtml, language: 'html' });

  return files;
};
