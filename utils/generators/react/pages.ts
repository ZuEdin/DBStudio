
import { Table, Form, Report, VirtualFile } from '../../../types/index';
import { toCamelCase, toPascalCase } from '../common';
import { generateJsxForLayout, collectLookups } from './layoutHelper';

export const generateReactPages = (tables: Table[], forms: Form[], reports: Report[], root: string, queries: any[] = []): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // Lists
  tables.forEach(table => {
      const listName = `${table.name}List`;
      const pk = toCamelCase(table.fields.find(f=>f.isPrimaryKey)?.name || 'id');
      const content = `import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ${table.name} } from '../../types';
import { get, remove } from '../../services/api';
import { Trash2, Plus } from 'lucide-react';

export const ${listName} = () => {
  const [items, setItems] = useState<${table.name}[]>([]);
  useEffect(() => { get<${table.name}[]>('${table.name.toLowerCase()}').then(setItems); }, []);
  const handleDelete = (id: any) => { if(confirm('Löschen?')) remove(\`${table.name.toLowerCase()}/\${id}\`).then(() => get<${table.name}[]>('${table.name.toLowerCase()}').then(setItems)); };
  return (
    <div className="p-6">
      <div className="flex justify-between mb-4"><h1 className="text-2xl font-bold">${table.name}</h1><Link to="/${table.name.toLowerCase()}/new" className="bg-blue-600 text-white px-4 py-2 rounded flex gap-2 items-center"><Plus size={16}/> Neu erstellen</Link></div>
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
      files.push({ name: `${listName}.tsx`, path: `${root}/src/pages/${table.name}/${listName}.tsx`, content, language: 'typescript' });
  });

  // Forms
  forms.forEach(form => {
      const compName = `${toPascalCase(form.name)}Form`;
      const sourceTable = tables.find(t => t.id === form.sourceId);
      if(!sourceTable) return;
      
      const lookups = form.layout ? collectLookups(form.layout, tables) : [];
      const layoutJsx = form.layout ? generateJsxForLayout(form.layout, tables) : 'Empty';
      
      const content = `import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { get, post, put } from '../../services/api';
import { Save } from 'lucide-react';

export const ${compName} = () => {
  const { id } = useParams(); const navigate = useNavigate();
  const [data, setData] = useState<any>({});
  ${lookups.map(l => `const [${l.variableName}, set${l.variableName}] = useState<any[]>([]);`).join('\n')}

  useEffect(() => {
      ${lookups.map(l => `get('${l.endpoint}').then(set${l.variableName});`).join('\n')}
      if (id && id !== 'new') get(\`${sourceTable.name.toLowerCase()}/\${id}\`).then(setData);
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); (id && id!=='new' ? put(\`${sourceTable.name.toLowerCase()}/\${id}\`, data) : post('${sourceTable.name.toLowerCase()}', data)).then(() => navigate(-1)); };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md border border-slate-200">
          <h1 className="text-2xl font-bold mb-6 pb-2 border-b text-slate-800">${form.name}</h1>
          <form onSubmit={handleSubmit}>
            ${layoutJsx}
            <div className="mt-8 flex justify-end">
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

  // Reports
  reports.forEach(report => {
      const compName = `${toPascalCase(report.name)}Report`;
      
      // Determine endpoint
      let endpoint = 'unknown';
      if (report.sourceType === 'table') {
          const t = tables.find(t => t.id === report.sourceId);
          if (t) endpoint = t.name.toLowerCase();
      } else if (report.sourceType === 'query') {
          const q = queries.find(q => q.id === report.sourceId);
          if (q) endpoint = q.name.toLowerCase();
      }

      const cols = report.columns || [];

      const content = `import React, { useEffect, useState } from 'react';
import { get } from '../../services/api';

export const ${compName} = () => {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => { get('${endpoint}').then(setData); }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white shadow-lg p-10">
        <h1 className="text-3xl font-bold mb-6 border-b-2 border-black pb-4">${report.name}</h1>
        <table className="w-full text-sm text-left">
            <thead>
                <tr className="border-b-2 border-black">
                    ${cols.map(c => `<th className="p-2 font-bold uppercase text-slate-600">${c.label}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                {data.length > 0 ? data.map((item, i) => (
                    <tr key={i} className="border-b hover:bg-slate-50">
                        ${cols.map(c => `<td className="p-2">{item.${toCamelCase(c.label)}}</td>`).join('')}
                    </tr>
                )) : (
                    <tr><td colSpan={${cols.length}} className="p-4 text-center text-slate-500 italic">Keine Daten vorhanden.</td></tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};`;
      files.push({ name: `${compName}.tsx`, path: `${root}/src/pages/reports/${compName}.tsx`, content, language: 'typescript' });
  });

  return files;
};
