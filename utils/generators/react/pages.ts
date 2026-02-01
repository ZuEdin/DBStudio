
import { Table, Form, Report, VirtualFile } from '../../../types/index';
import { toCamelCase, toPascalCase } from '../common';
import { generateJsxForLayout, collectLookups } from './layoutHelper';

export const generateReactPages = (tables: Table[], forms: Form[], reports: Report[], root: string, queries: any[] = []): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // Map Tables to their specific Forms
  const formMap = new Map<string, Form>();
  forms.forEach(f => { if(f.sourceType === 'table') formMap.set(f.sourceId, f); });

  // 1. Table Lists (Paginated Data Grid)
  tables.forEach(table => {
      const pascalName = toPascalCase(table.name);
      const camelName = toCamelCase(table.name);
      const listName = `${pascalName}List`;
      const pk = toCamelCase(table.fields.find(f=>f.isPrimaryKey)?.name || 'id');
      
      const customForm = formMap.get(table.id);
      const createLink = customForm ? `/forms/${toPascalCase(customForm.name).toLowerCase()}Form/new` : `/${camelName}/new`;
      const editLinkPrefix = customForm ? `/forms/${toPascalCase(customForm.name).toLowerCase()}Form/` : `/${camelName}/`;

      const content = `import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ${pascalName} } from '../../types';
import { get, remove } from '../../services/api';
import { Trash2, Plus, Edit, Search, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export const ${listName} = () => {
  const [items, setItems] = useState<${pascalName}[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Debounce Search
  useEffect(() => {
      const timer = setTimeout(() => { setPage(1); loadItems(); }, 500);
      return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => { loadItems(); }, [page]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await get<${pascalName}>('${camelName}', { page, pageSize, search: searchTerm });
      setItems(res.data);
      setTotal(res.total);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Fehler beim Laden der Daten.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Möchten Sie diesen Eintrag wirklich löschen?')) return;
    try {
      await remove(\`${camelName}/\${id}\`);
      loadItems();
    } catch (err: any) {
      alert('Fehler beim Löschen: ' + err.message);
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">${table.name}</h1>
            <p className="text-slate-500 dark:text-slate-400">Verwaltung der ${table.name} Einträge.</p>
          </div>
          <Link to="${createLink}" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex gap-2 items-center shadow-lg shadow-blue-600/20 transition-all">
            <Plus size={18}/> Neu erstellen
          </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} /> {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Suche..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                />
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                ${table.fields.map(f => `<th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">${f.name}</th>`).join('')}
                <th className="p-4 text-right font-semibold text-sm text-slate-600 dark:text-slate-300">Aktionen</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                    <tr><td colSpan={${table.fields.length + 1}} className="p-8 text-center text-slate-500 dark:text-slate-400">Lade Daten...</td></tr>
                ) : items.length === 0 ? (
                    <tr><td colSpan={${table.fields.length + 1}} className="p-8 text-center text-slate-500 dark:text-slate-400">Keine Einträge gefunden.</td></tr>
                ) : (
                    items.map(i => (
                        <tr key={i.${pk}} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            ${table.fields.map(f => `<td className="p-4 text-sm text-slate-800 dark:text-slate-200 whitespace-nowrap">{String(i.${toCamelCase(f.name)} ?? '')}</td>`).join('')}
                            <td className="p-4 flex justify-end gap-2">
                                <Link to={'${editLinkPrefix}' + i.${pk}} className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Edit size={16}/></Link>
                                <button onClick={()=>handleDelete(i.${pk})} className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={16}/></button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
                Zeige {(page - 1) * pageSize + 1} bis {Math.min(page * pageSize, total)} von {total} Einträgen
            </span>
            <div className="flex gap-1">
                <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    disabled={page === 1}
                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-50"
                >
                    <ChevronLeft size={18}/>
                </button>
                <span className="px-2 text-sm font-medium">{page} / {Math.max(1, totalPages)}</span>
                <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                    disabled={page >= totalPages}
                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-50"
                >
                    <ChevronRight size={18}/>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};`;
      files.push({ name: `${listName}.tsx`, path: `${root}/src/pages/${pascalName}/${listName}.tsx`, content, language: 'typescript' });
  });

  // 2. Forms (Modern Input Styling) - Same logic, slight helper update implicit
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
import { Save, ArrowLeft, Loader2 } from 'lucide-react';

export const ${compName} = () => {
  const { id } = useParams(); const navigate = useNavigate();
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  ${lookups.map(l => `const [${l.variableName}, set${toPascalCase(l.variableName)}] = useState<any[]>([]);`).join('\n')}

  useEffect(() => {
      const init = async () => {
        try {
          setLoading(true);
          // Lookups might need pagination logic if too large, currently loading all
          ${lookups.map(l => `const ${l.variableName}Res = await get('${l.endpoint}', { pageSize: 1000 }); set${toPascalCase(l.variableName)}(${l.variableName}Res.data);`).join('\n          ')}
          
          if (id && id !== 'new') {
             const record = await get(\`${sourceTableCamel}/\${id}\`);
             setData(record); // GetById returns object, not paged
          }
        } catch(err) {
          console.error(err);
          alert("Fehler beim Laden.");
        } finally {
          setLoading(false);
        }
      };
      init();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      try {
        setSubmitting(true);
        if (id && id !== 'new') {
            await put(\`${sourceTableCamel}/\${id}\`, data);
        } else {
            await post('${sourceTableCamel}', data);
        }
        navigate(-1);
      } catch (err: any) {
        alert('Fehler: ' + err.message);
      } finally {
        setSubmitting(false);
      }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400">
            <ArrowLeft size={20}/>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">${form.name}</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            ${layoutJsx}
            
            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors">
                    Abbrechen
                </button>
                <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium flex gap-2 items-center transition-colors shadow-sm">
                    {submitting ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} Speichern
                </button>
            </div>
          </form>
      </div>
    </div>
  );
};`;
      files.push({ name: `${compName}.tsx`, path: `${root}/src/pages/forms/${compName}.tsx`, content, language: 'typescript' });
  });

  return files;
};
