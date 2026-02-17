
import { Table, Form, Report, VirtualFile } from '../../../types/index';
import { toCamelCase, toPascalCase } from '../common';
import { generateJsxForLayout, collectLookups } from './layoutHelper';

export const generateReactPages = (tables: Table[], forms: Form[], reports: Report[], root: string, queries: any[] = []): VirtualFile[] => {
  const files: VirtualFile[] = [];

  const formMap = new Map<string, Form>();
  forms.forEach(f => { if(f.sourceType === 'table') formMap.set(f.sourceId, f); });

  // 1. Table Lists (Standard CRUD)
  tables.forEach(table => {
      const pascalName = toPascalCase(table.name);
      const camelName = toCamelCase(table.name);
      const listName = `${pascalName}List`;
      const pk = toCamelCase(table.fields.find(f=>f.isPrimaryKey)?.name || 'id');
      
      const customForm = forms.find(f => f.sourceId === table.id && f.sourceType === 'table');
      const createLink = customForm ? `/forms/${toPascalCase(customForm.name).toLowerCase()}Form/new` : `/${camelName}/new`;
      const editLinkPrefix = customForm ? `/forms/${toPascalCase(customForm.name).toLowerCase()}Form/` : `/${camelName}/`;

      const content = `import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ${pascalName} } from '../../types';
import { get, remove } from '../../services/api';
import { Trash2, Plus, Edit, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export const ${listName} = () => {
  const [data, setData] = useState<{ data: ${pascalName}[], total: number, page: number, totalPages: number }>({ data: [], total: 0, page: 1, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Debounce Search reset page
  useEffect(() => { setPage(1); }, [searchTerm]);

  useEffect(() => { loadItems(); }, [searchTerm, page]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await get<${pascalName}>('${camelName}', { search: searchTerm, page: page, pageSize: 10 });
      // API Helper returns normalized PagedResponse
      setData(res as any);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: any) => {
    if (confirm('Löschen?')) { await remove(\`${camelName}/\${id}\`); loadItems(); }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2">${table.name}</h1>
          <div className="flex gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Suchen..." 
                    className="pl-10 pr-4 py-2 border rounded-lg w-full bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
              </div>
              <Link to="${createLink}" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
                <Plus size={18}/> <span className="hidden sm:inline">Neu anlegen</span>
              </Link>
          </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700 text-slate-500 uppercase text-xs font-semibold">
                    <tr>
                        ${table.fields.map(f => `<th className="p-4">${f.name}</th>`).join('')}
                        <th className="p-4 text-right">Aktionen</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {data.data.length > 0 ? data.data.map(i => (
                        <tr key={i.${pk}} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            ${table.fields.map(f => `<td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(i.${toCamelCase(f.name)} ?? '')}</td>`).join('')}
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <Link to={'${editLinkPrefix}' + i.${pk}} className="p-2 text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-slate-700"><Edit size={16}/></Link>
                                    <button onClick={()=>handleDelete(i.${pk})} className="p-2 text-red-600 hover:bg-red-50 rounded dark:hover:bg-slate-700"><Trash2 size={16}/></button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={${table.fields.length + 1}} className="p-8 text-center text-slate-400 italic">Keine Einträge gefunden.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <div className="text-sm text-slate-500 dark:text-slate-400">
                Seite <span className="font-bold">{data.page}</span> von <span className="font-bold">{data.totalPages}</span> ({data.total} Einträge)
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    disabled={data.page <= 1}
                    className="p-2 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <button 
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} 
                    disabled={data.page >= data.totalPages}
                    className="p-2 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};`;
      files.push({ name: `${listName}.tsx`, path: `${root}/src/pages/${pascalName}/${listName}.tsx`, content, language: 'typescript' });
  });

  // 2. Custom Forms with Smart Quick Create & User Pickers
  forms.forEach(form => {
      const compName = `${toPascalCase(form.name)}Form`;
      const sourceTable = tables.find(t => t.id === form.sourceId);
      if(!sourceTable) return;
      
      const sourceTableCamel = toCamelCase(sourceTable.name);
      const lookups = form.layout ? collectLookups(form.layout, tables) : [];
      const requiredModals: any[] = [];
      const layoutJsx = form.layout ? generateJsxForLayout(form.layout, tables, forms, 'data', requiredModals) : '<div>Kein Layout definiert.</div>';
      
      const subformStateDecls = requiredModals.filter(m => m.type === 'subform').map(m => {
            const camelChild = toCamelCase(m.table.name);
            const varName = `${camelChild}SubList_${m.id.replace('sub_field_', '')}`;
            return `const [${varName}, set${toPascalCase(varName)}] = useState<any[]>([]);`;
        }).join('\n  ');

      const subformLoadLogic = requiredModals.filter(m => m.type === 'subform').map(m => {
            const childTableCamel = toCamelCase(m.table.name);
            const childField = m.table.fields.find(f => f.id === m.childField)?.name;
            const varName = `${childTableCamel}SubList_${m.id.replace('sub_field_', '')}`;
            return `if(id && id!=='new') { const subRes = await get('${childTableCamel}', { search: '' }); set${toPascalCase(varName)}((subRes.data||subRes).filter((x:any) => String(x.${toCamelCase(childField)}) === String(id))); }`;
        }).join('\n        ');

      const modalJsx = requiredModals.map(m => {
          if (m.type === 'lookup') {
              const fields = m.table.fields.filter((f: any) => !f.isPrimaryKey && !f.isAutoIncrement).map((f: any) => {
                  const label = f.name;
                  const name = toCamelCase(f.name);
                  let input = `<input name="${name}" className="w-full border p-2 rounded" />`;
                  if (f.type === 'BOOLEAN') input = `<div className="flex items-center gap-2 mt-2"><input type="checkbox" name="${name}" value="true" className="w-4 h-4" /> <span className="text-sm">Aktivieren</span></div>`;
                  else if (f.type === 'INTEGER' || f.type === 'DECIMAL') input = `<input type="number" name="${name}" className="w-full border p-2 rounded" step="${f.type === 'INTEGER' ? '1' : '0.01'}" />`;
                  else if (f.type === 'DATE') input = `<input type="date" name="${name}" className="w-full border p-2 rounded" />`;
                  return `<div className="mb-3"><label className="block text-sm font-bold mb-1 text-slate-700">${label}</label>${input}</div>`;
              }).join('');
              
              return `<Modal isOpen={modals['${m.id}']} onClose={() => toggleModal('${m.id}', false)} title="Neu: ${m.table.name}"><form onSubmit={async (e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); const payload: any = {}; formData.forEach((value, key) => { if(value==='true') payload[key]=true; else if(value==='false') payload[key]=false; else payload[key]=value; }); try { await post('${toCamelCase(m.table.name)}', payload); const res = await get('${toCamelCase(m.table.name)}'); set${toPascalCase(toCamelCase(m.table.name))}List(res.data || res); toggleModal('${m.id}', false); } catch (err) { alert('Fehler'); } }}><div className="space-y-2">${fields}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => toggleModal('${m.id}', false)} className="px-4 py-2 border rounded">Abbrechen</button><button className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">Speichern</button></div></form></Modal>`;
          }
          if (m.type === 'subform') {
              const subLayout = m.form.layout ? generateJsxForLayout(m.form.layout, tables, forms, 'subData') : '<div>Formular leer</div>';
              const childTableCamel = toCamelCase(m.table.name);
              const childField = m.table.fields.find(f => f.id === m.childField)?.name;
              return `<Modal isOpen={modals['${m.id}']} onClose={() => toggleModal('${m.id}', false)} title="Eintrag hinzufügen: ${m.form.name}"><SubFormWrapper onSave={async (subData) => { if(id && id!=='new') { subData.${toCamelCase(childField || '')} = id; await post('${childTableCamel}', subData); const subRes = await get('${childTableCamel}', { search: '' }); set${toPascalCase(toCamelCase(m.table.name))}SubList_${m.id.replace('sub_field_', '')}((subRes.data||subRes).filter((x:any) => String(x.${toCamelCase(childField || '')}) === String(id))); } else { alert('Bitte erst Hauptdatensatz speichern.'); } toggleModal('${m.id}', false); }}>{${subLayout.replace(/data\./g, 'subData.')}}</SubFormWrapper></Modal>`;
          }
          if (m.type === 'user-picker') {
              return `<UserPickerModal isOpen={modals['${m.id}']} initialTab="${m.mode}" onClose={() => toggleModal('${m.id}', false)} onSelect={(username, display) => { setData({...data, ${m.targetField}: username}); toggleModal('${m.id}', false); }} />`;
          }
          return '';
      }).join('\n');

      const content = `import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { get, post, put } from '../../services/api';
import { Save, ArrowLeft, Loader2, Plus, Layout, User, Search } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { UserPickerModal } from '../../components/UserPickerModal';

const SubFormWrapper = ({ children, onSave }: any) => {
    const [subData, setData] = useState<any>({});
    const injectedChildren = React.Children.map(children, child => React.isValidElement(child) ? child : child);
    return (<div>{children}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => onSave(subData)} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">Speichern</button></div></div>);
}

export const ${compName} = () => {
  const { id } = useParams(); const navigate = useNavigate();
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [modals, setModals] = useState<Record<string, boolean>>({});
  
  ${lookups.map(l => `const [${l.variableName}, set${toPascalCase(l.variableName)}] = useState<any[]>([]);`).join('\n  ')}
  ${subformStateDecls}

  const toggleModal = (id: string, state: boolean) => setModals(prev => ({...prev, [id]: state}));

  useEffect(() => {
      const init = async () => {
        setLoading(true);
        try {
            ${lookups.map(l => `const ${l.variableName}Res = await get('${l.endpoint}'); set${toPascalCase(l.variableName)}(${l.variableName}Res.data || ${l.variableName}Res);`).join('\n            ')}
            if (id && id !== 'new') {
                const res = await get(\`${sourceTableCamel}/\${id}\`);
                setData(res.data || res);
                ${subformLoadLogic}
            }
        } catch (e) { console.error(e); }
        setLoading(false);
      };
      init();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { if (id && id !== 'new') await put(\`${sourceTableCamel}/\${id}\`, data); else await post('${sourceTableCamel}', data); navigate(-1); } catch (e) { alert('Fehler'); } };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline-block mr-2 text-blue-500"/> Lade...</div>;
  const subData: any = {}; const setSubData = (d: any) => {};

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <button onClick={() => navigate(-1)} className="mb-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 transition-colors font-medium text-sm"><ArrowLeft size={16}/> Zurück</button>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"><h1 className="text-2xl font-bold text-slate-800 dark:text-white">${form.name}</h1></div>
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            ${layoutJsx}
            <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors">Abbrechen</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"><Save size={18}/> Speichern</button>
            </div>
          </form>
      </div>
      ${modalJsx}
    </div>
  );
};`;
      files.push({ name: `${compName}.tsx`, path: `${root}/src/pages/forms/${compName}.tsx`, content, language: 'typescript' });
  });

  return files;
};
