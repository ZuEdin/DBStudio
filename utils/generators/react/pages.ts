
import { Table, Form, Report, VirtualFile } from '../../../types/index';
import { toCamelCase, toPascalCase } from '../common';
import { generateJsxForLayout, collectLookups } from './layoutHelper';

export const generateReactPages = (tables: Table[], forms: Form[], reports: Report[], root: string, queries: any[] = []): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // Map Tables to their specific Forms
  const formMap = new Map<string, Form>();
  forms.forEach(f => { if(f.sourceType === 'table') formMap.set(f.sourceId, f); });

  // 1. Table Lists
  tables.forEach(table => {
      const pascalName = toPascalCase(table.name);
      const camelName = toCamelCase(table.name);
      const listName = `${pascalName}List`;
      const pk = toCamelCase(table.fields.find(f=>f.isPrimaryKey)?.name || 'id');
      
      // Determine Link Targets
      const customForm = formMap.get(table.id);
      const createLink = customForm ? `/forms/${toPascalCase(customForm.name).toLowerCase()}Form/new` : `/${camelName}/new`;
      const editLinkPrefix = customForm ? `/forms/${toPascalCase(customForm.name).toLowerCase()}Form/` : `/${camelName}/`;

      const content = `import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ${pascalName} } from '../../types';
import { get, remove } from '../../services/api';
import { Trash2, Plus, Edit } from 'lucide-react';

export const ${listName} = () => {
  const [items, setItems] = useState<${pascalName}[]>([]);
  const loadItems = () => get<${pascalName}[]>('${camelName}').then(setItems);
  useEffect(() => { loadItems(); }, []);
  const handleDelete = (id: any) => { if(confirm('Löschen?')) remove(\`${camelName}/\${id}\`).then(loadItems); };
  
  return (
    <div className="p-6">
      <div className="flex justify-between mb-4"><h1 className="text-2xl font-bold">${table.name}</h1><Link to="${createLink}" className="bg-blue-600 text-white px-4 py-2 rounded flex gap-2 items-center"><Plus size={16}/> Neu erstellen</Link></div>
      <div className="bg-white shadow rounded overflow-hidden border border-slate-200">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b"><tr>
            ${table.fields.map(f => `<th className="p-4 font-semibold text-sm text-slate-600">${f.name}</th>`).join('')}
            <th className="p-4 text-right font-semibold text-sm text-slate-600">Aktionen</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(i => (
                <tr key={i.${pk}} className="hover:bg-slate-50">
                    ${table.fields.map(f => `<td className="p-4 text-sm text-slate-800">{i.${toCamelCase(f.name)}}</td>`).join('')}
                    <td className="p-4 flex justify-end gap-2">
                        <Link to={'${editLinkPrefix}' + i.${pk}} className="text-blue-500 hover:text-blue-700 transition-colors"><Edit size={18}/></Link>
                        <button onClick={()=>handleDelete(i.${pk})} className="text-red-500 hover:text-red-700 transition-colors"><Trash2 size={18}/></button>
                    </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};`;
      files.push({ name: `${listName}.tsx`, path: `${root}/src/pages/${pascalName}/${listName}.tsx`, content, language: 'typescript' });
  });

  // 2. Forms (Both Default and Custom logic handled here)
  // If a table has NO custom form, we should generate a default one? 
  // The structure.ts maps /tablename/:id to XForm.tsx. We need to ensure XForm exists.
  
  // A. Custom Forms
  forms.forEach(form => {
      const compName = `${toPascalCase(form.name)}Form`;
      const sourceTable = tables.find(t => t.id === form.sourceId);
      if(!sourceTable) return;
      
      const sourceTableCamel = toCamelCase(sourceTable.name);
      
      const lookups = form.layout ? collectLookups(form.layout, tables) : [];
      const layoutJsx = form.layout ? generateJsxForLayout(form.layout, tables) : '<div>Empty Layout</div>';
      
      const content = `import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { get, post, put } from '../../services/api';
import { Save } from 'lucide-react';

export const ${compName} = () => {
  const { id } = useParams(); const navigate = useNavigate();
  const [data, setData] = useState<any>({});
  ${lookups.map(l => `const [${l.variableName}, set${toPascalCase(l.variableName)}] = useState<any[]>([]);`).join('\n')}

  useEffect(() => {
      ${lookups.map(l => `get('${l.endpoint}').then(set${toPascalCase(l.variableName)});`).join('\n')}
      if (id && id !== 'new') get(\`${sourceTableCamel}/\${id}\`).then(setData);
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); (id && id!=='new' ? put(\`${sourceTableCamel}/\${id}\`, data) : post('${sourceTableCamel}', data)).then(() => navigate(-1)); };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md border border-slate-200">
          <h1 className="text-2xl font-bold mb-6 pb-2 border-b text-slate-800">${form.name}</h1>
          <form onSubmit={handleSubmit}>
            ${layoutJsx}
            <div className="mt-8 flex justify-end gap-2">
                <button type="button" onClick={() => navigate(-1)} className="bg-gray-200 px-4 py-2 rounded">Abbrechen</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium flex gap-2 items-center transition-colors">
                    <Save size={18}/> Speichern
                </button>
            </div>
          </form>
      </div>
    </div>
  );
};`;
      files.push({ name: `${compName}.tsx`, path: `${root}/src/pages/forms/${compName}.tsx`, content, language: 'typescript' });
  });

  // B. Queries (Select) - Read Only Grid
  queries.filter(q => q.type === 'SELECT').forEach(q => {
      const compName = `${toPascalCase(q.name)}Query`;
      const camelName = toCamelCase(q.name);
      // Assuming query is exposed as read-only API endpoint
      const cols = q.columns.filter((c: any) => c.show);
      
      const content = `import React, { useEffect, useState } from 'react';
import { get } from '../../services/api';

export const ${compName} = () => {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { get('${camelName}').then(setItems); }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">${q.name} (Abfrage)</h1>
      <div className="bg-white shadow rounded overflow-hidden border border-slate-200">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b"><tr>
            ${cols.map((c: any) => `<th className="p-4 font-semibold text-sm text-slate-600">${c.alias || c.fieldName}</th>`).join('')}
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50">
                    ${cols.map((c: any) => {
                        const prop = toCamelCase(c.alias || c.fieldName);
                        return `<td className="p-4 text-sm text-slate-800">{item.${prop}}</td>`
                    }).join('')}
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};`;
      files.push({ name: `${compName}.tsx`, path: `${root}/src/pages/queries/${compName}.tsx`, content, language: 'typescript' });
  });

  return files;
};
