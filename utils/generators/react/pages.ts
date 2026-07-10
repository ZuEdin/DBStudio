
import { Table, Form, Report, VirtualFile, Query, SelectQuery, CustomPage } from '../../../types/index';
import { toCamelCase, toPascalCase } from '../common';
import { generateJsxForLayout, collectLookups } from './layoutHelper';

export const generateReactPages = (tables: Table[], forms: Form[], reports: Report[], root: string, queries: Query[] = [], pages: CustomPage[] = []): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // 1. Table Lists (Standard CRUD)
  tables.forEach(table => {
      const pascalName = toPascalCase(table.name);
      const camelName = toCamelCase(table.name);
      const listName = `${pascalName}List`;
      const pk = toCamelCase(table.fields.find(f=>f.isPrimaryKey)?.name || 'id');
      
      const customForm = forms.find(f => f.sourceId === table.id && f.sourceType === 'table');
      const createLink = customForm ? `/forms/${toPascalCase(customForm.name).toLowerCase()}Form/new` : `/${camelName}/new`;
      const editLinkPrefix = customForm ? `/forms/${toPascalCase(customForm.name).toLowerCase()}Form/` : `/${camelName}/`;

      const fmtRules = (table.conditionalFormatting || []).map(r => {
          const f = table.fields.find(fi => fi.id === r.fieldId);
          return { ...r, propName: f ? toCamelCase(f.name) : '' };
      });

      const content = `import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ${pascalName} } from '../../types';
import { get, remove } from '../../services/api';
import { Trash2, Plus, Edit, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Eye } from 'lucide-react';

export const ${listName} = () => {
  const [data, setData] = useState<{ data: ${pascalName}[], total: number, page: number, totalPages: number }>({ data: [], total: 0, page: 1, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  ${table.enableMassUpdates ? `const [selectedIds, setSelectedIds] = useState<string[]>([]);` : ''}

  // Double-click Detail modal and single-select keyboard selection states
  const [activeRecord, setActiveRecord] = useState<${pascalName} | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailRecord, setDetailRecord] = useState<${pascalName} | null>(null);

  // Sorting & Filtering states
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);

  useEffect(() => { setPage(1); }, [searchTerm]);
  useEffect(() => { loadItems(); }, [searchTerm, page]);

  // Global keydown listener for Enter key triggers
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && activeRecord) {
        e.preventDefault();
        setDetailRecord(activeRecord);
        setShowDetail(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeRecord]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await get<${pascalName}>('${camelName}', { search: searchTerm, page: page, pageSize: 10 });
      setData(res as any);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: any) => {
    if (confirm('Löschen?')) { await remove(\`${camelName}/\${id}\`); loadItems(); }
  };

  const getRowStyle = (item: any) => {
      const rules = ${JSON.stringify(fmtRules)};
      for(const r of rules) {
          if(!r.propName) continue;
          const val = String(item[r.propName]);
          if(r.operator === 'eq' && val === r.value) return r.style;
          if(r.operator === 'neq' && val !== r.value) return r.style;
          if(r.operator === 'contains' && val.includes(r.value)) return r.style;
          if(r.operator === 'gt' && Number(val) > Number(r.value)) return r.style;
          if(r.operator === 'lt' && Number(val) < Number(r.value)) return r.style;
      }
      return {};
  };

  ${table.enableMassUpdates ? `
  const handleMassDelete = async () => {
      if(selectedIds.length === 0) return;
      if(confirm(\`Wirklich \${selectedIds.length} Einträge löschen?\`)) {
          // Fallback to multiple requests for generator demo
          for(const id of selectedIds) {
              await remove(\`${camelName}/\${id}\`);
          }
          setSelectedIds([]);
          loadItems();
      }
  };` : ''}

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') {
        setSortField(null);
        setSortDir(null);
      }
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Memoized local processing of items (local filtering and sorting)
  const processedItems = React.useMemo(() => {
    let items = [...data.data];
    
    // Apply column filters
    Object.keys(columnFilters).forEach(key => {
      const filterVal = columnFilters[key].toLowerCase().trim();
      if (filterVal) {
        const searchTerms = filterVal.split(/\s+/).filter(Boolean);
        items = items.filter(item => {
          const val = item[key as keyof ${pascalName}];
          if (val === undefined || val === null) return false;
          const cellStr = String(val).toLowerCase();
          return searchTerms.every(term => cellStr.includes(term));
        });
      }
    });

    // Apply sorting
    if (sortField && sortDir) {
      items.sort((a, b) => {
        const valA = a[sortField as keyof ${pascalName}];
        const valB = b[sortField as keyof ${pascalName}];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        
        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
          comparison = (valA ? 1 : 0) - (valB ? 1 : 0);
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }
        return sortDir === 'asc' ? comparison : -comparison;
      });
    }

    return items;
  }, [data.data, columnFilters, sortField, sortDir]);

  return (
    <div className="p-8 max-w-[95%] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2">${table.name}</h1>
          <div className="flex gap-4 w-full sm:w-auto">
              ${table.enableMassUpdates ? `
              {selectedIds.length > 0 && (
                  <button onClick={handleMassDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition">
                      <Trash2 size={18}/> <span>{selectedIds.length} löschen</span>
                  </button>
              )}` : ''}
              
              <button 
                  onClick={() => setShowFilterBar(prev => !prev)} 
                  className={\`p-2 border rounded-lg flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition \${showFilterBar ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white'}\`}
                  title="Spaltenfilter anzeigen/ausblenden"
              >
                  <Filter size={18}/>
                  <span className="hidden sm:inline">Filter</span>
              </button>

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
                        ${table.enableMassUpdates ? `<th className="p-4 w-12"><input type="checkbox" onChange={(e) => { const ids = e.target.checked ? data.data.map(i => i.${pk}) : []; setSelectedIds(ids); }} /></th>` : ''}
                        <th className="p-4 w-12 text-center text-slate-400" title="Datensatz auswählen (Enter für Details)">Auswahl</th>
                        ${table.fields.map(f => `
                        <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('${toCamelCase(f.name)}')}>
                            <div className="flex items-center gap-1.5 select-none">
                                <span>${f.name}</span>
                                {sortField === '${toCamelCase(f.name)}' ? (
                                    sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-500 shrink-0" /> : <ArrowDown size={14} className="text-blue-500 shrink-0" />
                                ) : (
                                    <ArrowUpDown size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                            </div>
                        </th>`).join('')}
                        <th className="p-4 text-right">Aktionen</th>
                    </tr>
                    {showFilterBar && (
                        <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                            ${table.enableMassUpdates ? `<th className="p-2"></th>` : ''}
                            <th className="p-2"></th>
                            ${table.fields.map(f => `
                            <th className="p-2">
                                <input 
                                    type="text"
                                    placeholder="Filtern..."
                                    className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    value={columnFilters['${toCamelCase(f.name)}'] || ''}
                                    onChange={e => setColumnFilters({ ...columnFilters, '${toCamelCase(f.name)}': e.target.value })}
                                />
                            </th>`).join('')}
                            <th className="p-2 text-right">
                                {Object.keys(columnFilters).length > 0 && (
                                    <button onClick={() => setColumnFilters({})} className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center justify-end gap-1 ml-auto">
                                        <X size={12}/> Löschen
                                    </button>
                                )}
                            </th>
                        </tr>
                    )}
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {processedItems.length > 0 ? processedItems.map(i => (
                        <tr 
                            key={i.${pk}} 
                            className={\`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer \${activeRecord?.${pk} === i.${pk} ? 'bg-blue-50/70 dark:bg-blue-900/20' : ''}\`}
                            style={getRowStyle(i)}
                            onClick={() => setActiveRecord(i)}
                            onDoubleClick={() => { setDetailRecord(i); setShowDetail(true); }}
                            title="Doppelklick für Details, Einfacher Klick zur Auswahl (Enter für Details)"
                        >
                            ${table.enableMassUpdates ? `<td className="p-4" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(i.${pk} as string)} onChange={(e) => { if(e.target.checked) setSelectedIds([...selectedIds, i.${pk} as string]); else setSelectedIds(selectedIds.filter(id => id !== i.${pk})); }} /></td>` : ''}
                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <input 
                                    type="checkbox" 
                                    checked={activeRecord?.${pk} === i.${pk}} 
                                    onChange={() => setActiveRecord(activeRecord?.${pk} === i.${pk} ? null : i)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                />
                            </td>
                            ${table.fields.map(f => {
                                const val = `i.${toCamelCase(f.name)}`;
                                if (f.rendererType === 'progress') {
                                    return `<td className="p-4"><div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: \`\${Math.min(100, Math.max(0, Number(${val}))) }%\` }}></div></div></td>`;
                                }
                                if (f.rendererType === 'status_pill') {
                                    return `<td className="p-4 text-sm"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">{String(${val} ?? '')}</span></td>`;
                                }
                                if (f.rendererType === 'avatar') {
                                    return `<td className="p-4 text-sm flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{String(${val} ?? '-').charAt(0).toUpperCase()}</div><span>{String(${val} ?? '')}</span></td>`;
                                }
                                if (f.rendererType === 'currency') {
                                    return `<td className="p-4 text-sm text-slate-700 dark:text-slate-300 font-mono">€ {Number(${val} || 0).toFixed(2)}</td>`;
                                }
                                return `<td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(${val} ?? '')}</td>`;
                            }).join('')}
                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => { setDetailRecord(i); setShowDetail(true); }} className="p-2 text-slate-600 hover:bg-slate-50 rounded dark:hover:bg-slate-700" title="Details"><Eye size={16}/></button>
                                    <Link to={'${editLinkPrefix}' + i.${pk}} className="p-2 text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-slate-700" title="Bearbeiten"><Edit size={16}/></Link>
                                    <button onClick={()=>handleDelete(i.${pk})} className="p-2 text-red-600 hover:bg-red-50 rounded dark:hover:bg-slate-700" title="Löschen"><Trash2 size={16}/></button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={${table.fields.length + 2 + (table.enableMassUpdates ? 1 : 0)}} className="p-8 text-center text-slate-400 italic">Keine Einträge gefunden.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
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

      {/* Double click / keyboard selection Detail View Modal */}
      {showDetail && detailRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => { setShowDetail(false); setDetailRecord(null); }}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>${table.name} Details</span>
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">ID: {String(detailRecord.${pk})}</span>
                </h3>
              </div>
              <button 
                onClick={() => { setShowDetail(false); setDetailRecord(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {${JSON.stringify(table.fields)}.map(field => {
                  const val = detailRecord[field.name as keyof ${pascalName}];
                  return (
                    <div key={field.name} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{field.name}</span>
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-all">
                        {val === true ? '✅ Ja' : val === false ? '❌ Nein' : String(val ?? '-')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
              <Link 
                to={'${editLinkPrefix}' + detailRecord.${pk}} 
                onClick={() => { setShowDetail(false); setDetailRecord(null); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
              >
                <Edit size={16} /> <span>Bearbeiten</span>
              </Link>
              <button 
                onClick={() => { setShowDetail(false); setDetailRecord(null); }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};`;
      files.push({ name: `${listName}.tsx`, path: `${root}/src/pages/${pascalName}/${listName}.tsx`, content, language: 'typescript' });

      if (!customForm) {
          const formCompName = `${pascalName}Form`;
          const formFieldsJsx = table.fields.filter(f => !f.isPrimaryKey && !f.isAutoIncrement).map(f => {
              const fCamel = toCamelCase(f.name);
              const label = f.comment || f.name;
              let inputJsx = '';
              if (f.type === 'BOOLEAN') {
                  inputJsx = `
                  <div className="flex items-center gap-2 mt-2">
                      <input 
                          type="checkbox" 
                          id="${fCamel}"
                          checked={!!data.${fCamel}} 
                          onChange={e => setData({ ...data, ${fCamel}: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700" 
                      />
                      <label htmlFor="${fCamel}" className="text-sm font-medium text-slate-700 dark:text-slate-300">${label}</label>
                  </div>`;
              } else if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') {
                  inputJsx = `
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">${label}</label>
                  <input 
                      type="number" 
                      value={data.${fCamel} ?? ''} 
                      onChange={e => setData({ ...data, ${fCamel}: e.target.value === '' ? null : Number(e.target.value) })}
                      className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      step="${f.type === 'INTEGER' ? '1' : 'any'}"
                  />`;
              } else if (f.type === 'DATE') {
                  inputJsx = `
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">${label}</label>
                  <input 
                      type="date" 
                      value={data.${fCamel} ? String(data.${fCamel}).split('T')[0] : ''} 
                      onChange={e => setData({ ...data, ${fCamel}: e.target.value })}
                      className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  />`;
              } else if (f.type === 'TIME') {
                  inputJsx = `
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">${label}</label>
                  <input 
                      type="time" 
                      value={data.${fCamel} ? String(data.${fCamel}).substring(0, 5) : ''} 
                      onChange={e => setData({ ...data, ${fCamel}: e.target.value })}
                      className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  />`;
              } else if (f.type === 'DATETIME' || f.type === 'TIMESTAMP') {
                  inputJsx = `
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">${label}</label>
                  <input 
                      type="datetime-local" 
                      value={data.${fCamel} ? new Date(data.${fCamel}).toISOString().slice(0, 16) : ''} 
                      onChange={e => setData({ ...data, ${fCamel}: e.target.value })}
                      className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  />`;
              } else {
                  inputJsx = `
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">${label}</label>
                  <input 
                      type="text" 
                      value={data.${fCamel} ?? ''} 
                      onChange={e => setData({ ...data, ${fCamel}: e.target.value })}
                      className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  />`;
              }

              return `              <div className="mb-4">
                  ${inputJsx}
              </div>`;
          }).join('\n');

          const defaultFields: string[] = [];
          const payloadSetups: string[] = [];
          table.fields.forEach(f => {
              const fCamel = toCamelCase(f.name);
              const isDateType = ['DATETIME', 'TIMESTAMP', 'DATE', 'TIME'].includes(f.type);
              const hasNowDefault = f.defaultValue && (
                  f.defaultValue.toLowerCase().includes('now') ||
                  f.defaultValue.toLowerCase().includes('current_timestamp') ||
                  f.defaultValue.toLowerCase().includes('getdate')
              );
              const isCreatedAtField = ['created_at', 'createdat', 'erstellt_am', 'created_date', 'createddate'].includes(f.name.toLowerCase());
              const isCreatedByField = ['created_by', 'createdby', 'erstellt_von', 'created_user', 'createduser'].includes(f.name.toLowerCase());

              if (isDateType && (hasNowDefault || isCreatedAtField)) {
                  if (f.type === 'DATE') {
                      defaultFields.push(`${fCamel}: new Date().toISOString().split('T')[0]`);
                      payloadSetups.push(`if (!payload.${fCamel}) payload.${fCamel} = new Date().toISOString().split('T')[0];`);
                  } else if (f.type === 'TIME') {
                      defaultFields.push(`${fCamel}: new Date().toTimeString().slice(0, 5)`);
                      payloadSetups.push(`if (!payload.${fCamel}) payload.${fCamel} = new Date().toTimeString().slice(0, 5);`);
                  } else {
                      defaultFields.push(`${fCamel}: new Date().toISOString().slice(0, 16)`);
                      payloadSetups.push(`if (!payload.${fCamel}) payload.${fCamel} = new Date().toISOString().slice(0, 16);`);
                  }
              } else if (isCreatedByField) {
                  defaultFields.push(`${fCamel}: getLoggedInUser()`);
                  payloadSetups.push(`if (!payload.${fCamel}) payload.${fCamel} = getLoggedInUser();`);
              } else if (f.defaultValue !== undefined && f.defaultValue !== null && f.defaultValue !== '') {
                  if (f.type === 'BOOLEAN') {
                      const bVal = f.defaultValue.toLowerCase() === 'true' || f.defaultValue === '1';
                      defaultFields.push(`${fCamel}: ${bVal}`);
                  } else if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') {
                      defaultFields.push(`${fCamel}: ${f.defaultValue}`);
                  } else {
                      defaultFields.push(`${fCamel}: "${f.defaultValue.replace(/"/g, '\\"')}"`);
                  }
              }
          });

          const initialDataObjStr = defaultFields.length > 0 ? `{\n      ${defaultFields.join(',\n      ')}\n    }` : '{}';
          const payloadSetupsCode = payloadSetups.length > 0 ? `const payload = { ...data };\n    ${payloadSetups.join('\n    ')}` : 'const payload = { ...data };';

          const formContent = `import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { get, post, put } from '../../services/api';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';

export const ${formCompName} = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const getLoggedInUser = () => {
      try {
          const savedUser = localStorage.getItem('auth_user');
          if (savedUser) {
              const parsed = JSON.parse(savedUser);
              return parsed.username || 'Admin';
          }
      } catch (e) {}
      return 'Admin';
  };

  useEffect(() => {
      const init = async () => {
        if (id && id !== 'new') {
            setLoading(true);
            try {
                const res = await get(\`${camelName}/\${id}\`);
                setData(res.data || res);
            } catch (e) { 
                console.error(e); 
            }
            setLoading(false);
        } else {
            setData(${initialDataObjStr});
        }
      };
      init();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    try { 
      ${payloadSetupsCode}
      if (id && id !== 'new') {
          await put(\`${camelName}/\${id}\`, payload); 
      } else {
          await post('${camelName}', payload); 
      }
      navigate(-1); 
    } catch (e) { 
      alert('Fehler beim Speichern'); 
    } 
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline-block mr-2 text-blue-500"/> Lade...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <button onClick={() => navigate(-1)} className="mb-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 transition-colors font-medium text-sm"><ArrowLeft size={16}/> Zurück</button>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {id === 'new' ? '${table.name} erstellen' : '${table.name} bearbeiten'}
              </h1>
          </div>
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="space-y-4">
                ${formFieldsJsx}
            </div>
            <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors">Abbrechen</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"><Save size={18}/> Speichern</button>
            </div>
          </form>
      </div>
    </div>
  );
};`;
          files.push({ name: `${formCompName}.tsx`, path: `${root}/src/pages/${pascalName}/${formCompName}.tsx`, content: formContent, language: 'typescript' });
      }
  });

  // 2. Custom Forms
  forms.forEach(form => {
      const compName = `${toPascalCase(form.name)}Form`;
      const sourceTable = tables.find(t => t.id === form.sourceId);
      if(!sourceTable) return;
      
      const sourceTableCamel = toCamelCase(sourceTable.name);
      const lookups = form.layout ? collectLookups(form.layout, tables, queries) : [];
      const requiredModals: any[] = [];
      const layoutJsx = form.layout ? generateJsxForLayout(form.layout, tables, forms, "data", requiredModals, queries) : '<div>Kein Layout definiert.</div>';
      
      const subformStateDecls = requiredModals.filter(m => m.type === 'subform').map(m => {
            const camelChild = toCamelCase(m.table.name);
            const varName = `${camelChild}SubList_${m.id.replace('sub_field_', '')}`;
            return `const [${varName}, set${toPascalCase(varName)}] = useState<any[]>([]);`;
        }).join('\n  ');

      const subformLoadLogic = requiredModals.filter(m => m.type === 'subform').map(m => {
            const childTableCamel = toCamelCase(m.table.name);
            const childField = m.table.fields.find(f => f.id === m.childField)?.name;
            const varName = `${childTableCamel}SubList_${m.id.replace('sub_field_', '')}`;
            return `if(id && id!=='new') { const subRes = await get('${childTableCamel}', { search: '', pageSize: 10000 }); set${toPascalCase(varName)}((subRes.data||subRes).filter((x:any) => String(x.${toCamelCase(childField)}) === String(id))); }`;
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
                  else if (f.type === 'TIME') input = `<input type="time" name="${name}" className="w-full border p-2 rounded" />`;
                  else if (f.type === 'DATETIME' || f.type === 'TIMESTAMP') input = `<input type="datetime-local" name="${name}" className="w-full border p-2 rounded" />`;
                  return `<div className="mb-3"><label className="block text-sm font-bold mb-1 text-slate-700">${label}</label>${input}</div>`;
              }).join('');
              
              return `<Modal isOpen={modals['${m.id}']} onClose={() => toggleModal('${m.id}', false)} title="Neu: ${m.table.name}"><form onSubmit={async (e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); const payload: any = {}; formData.forEach((value, key) => { if(value==='true') payload[key]=true; else if(value==='false') payload[key]=false; else payload[key]=value; }); try { await post('${toCamelCase(m.table.name)}', payload); const res = await get('${toCamelCase(m.table.name)}', { pageSize: 10000 }); set${toPascalCase(toCamelCase(m.table.name))}List(res.data || res); toggleModal('${m.id}', false); } catch (err) { alert('Fehler'); } }}><div className="space-y-2">${fields}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => toggleModal('${m.id}', false)} className="px-4 py-2 border rounded">Abbrechen</button><button className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">Speichern</button></div></form></Modal>`;
          }
          if (m.type === 'subform') {
              const subLayout = m.form.layout ? generateJsxForLayout(m.form.layout, tables, forms, "subData", [], queries) : '<div>Formular leer</div>';
              const childTableCamel = toCamelCase(m.table.name);
              const childField = m.table.fields.find(f => f.id === m.childField)?.name;
              return `<Modal isOpen={modals['${m.id}']} onClose={() => toggleModal('${m.id}', false)} title="Eintrag hinzufügen: ${m.form.name}"><SubFormWrapper onSave={async (subData) => { if(id && id!=='new') { subData.${toCamelCase(childField || '')} = id; await post('${childTableCamel}', subData); const subRes = await get('${childTableCamel}', { search: '', pageSize: 10000 }); set${toPascalCase(toCamelCase(m.table.name))}SubList_${m.id.replace('sub_field_', '')}((subRes.data||subRes).filter((x:any) => String(x.${toCamelCase(childField || '')}) === String(id))); } else { alert('Bitte erst Hauptdatensatz speichern.'); } toggleModal('${m.id}', false); }}>{${subLayout.replace(/data\./g, 'subData.')}}</SubFormWrapper></Modal>`;
          }
          if (m.type === 'user-picker') {
              return `<UserPickerModal isOpen={modals['${m.id}']} initialTab="${m.mode}" onSelect={(username, displayName) => { setData(prev => ({ ...prev, ${m.targetField}: username })); toggleModal('${m.id}', false); }} onClose={() => toggleModal('${m.id}', false)} />`;
          }
          return '';
      }).join('\n');

      const defaultFields: string[] = [];
      const payloadSetups: string[] = [];

      sourceTable.fields.forEach(f => {
          const camelName = toCamelCase(f.name);
          const isDateType = ['DATETIME', 'TIMESTAMP', 'DATE', 'TIME'].includes(f.type);
          const hasNowDefault = f.defaultValue && (
              f.defaultValue.toLowerCase().includes('now') ||
              f.defaultValue.toLowerCase().includes('current_timestamp') ||
              f.defaultValue.toLowerCase().includes('getdate')
          );
          const isCreatedAtField = ['created_at', 'createdat', 'erstellt_am', 'created_date', 'createddate'].includes(f.name.toLowerCase());
          const isCreatedByField = ['created_by', 'createdby', 'erstellt_von', 'created_user', 'createduser'].includes(f.name.toLowerCase());

          if (isDateType && (hasNowDefault || isCreatedAtField)) {
              if (f.type === 'DATE') {
                  defaultFields.push(`${camelName}: new Date().toISOString().split('T')[0]`);
                  payloadSetups.push(`if (!payload.${camelName}) payload.${camelName} = new Date().toISOString().split('T')[0];`);
              } else if (f.type === 'TIME') {
                  defaultFields.push(`${camelName}: new Date().toTimeString().slice(0, 5)`);
                  payloadSetups.push(`if (!payload.${camelName}) payload.${camelName} = new Date().toTimeString().slice(0, 5);`);
              } else {
                  defaultFields.push(`${camelName}: new Date().toISOString().slice(0, 16)`);
                  payloadSetups.push(`if (!payload.${camelName}) payload.${camelName} = new Date().toISOString().slice(0, 16);`);
              }
          } else if (isCreatedByField) {
              defaultFields.push(`${camelName}: getLoggedInUser()`);
              payloadSetups.push(`if (!payload.${camelName}) payload.${camelName} = getLoggedInUser();`);
          } else if (f.defaultValue !== undefined && f.defaultValue !== null && f.defaultValue !== '') {
              if (f.type === 'BOOLEAN') {
                  const bVal = f.defaultValue.toLowerCase() === 'true' || f.defaultValue === '1';
                  defaultFields.push(`${camelName}: ${bVal}`);
              } else if (f.type === 'INTEGER' || f.type === 'DECIMAL') {
                  defaultFields.push(`${camelName}: ${f.defaultValue}`);
              } else {
                  defaultFields.push(`${camelName}: "${f.defaultValue.replace(/"/g, '\\"')}"`);
              }
          }
      });
      const initialDataObjStr = defaultFields.length > 0 ? `{\n      ${defaultFields.join(',\n      ')}\n    }` : '{}';
      const payloadSetupsCode = payloadSetups.length > 0 ? `const payload = { ...data };\n    ${payloadSetups.join('\n    ')}` : 'const payload = { ...data };';

      const content = `import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { get, post, put } from '../../services/api';
import { Save, ArrowLeft, Loader2, Plus, Layout, User, Search } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { UserPickerModal } from '../../components/UserPickerModal';
import { useGlobalState } from '../../context/GlobalStateContext';

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
  const { states, setGlobalState, addToast } = useGlobalState() || { states: {}, setGlobalState: () => {}, addToast: () => {} };
  
  const UXRules = ${JSON.stringify(form.crossFieldValidations || [])};

  const getLoggedInUser = () => {
      try {
          const savedUser = localStorage.getItem('auth_user');
          if (savedUser) {
              const parsed = JSON.parse(savedUser);
              return parsed.username || 'Admin';
          }
      } catch (e) {}
      return 'Admin';
  };

  // Phase 5: Cross-field rule evaluator
  const evaluateUXRule = (rule: any, currentData: any) => {
      const val = currentData[rule.triggerFieldId];
      if(rule.condition === 'equals') return String(val) === String(rule.triggerValue);
      if(rule.condition === 'not_equals') return String(val) !== String(rule.triggerValue);
      if(rule.condition === 'greater_than') return Number(val) > Number(rule.triggerValue);
      if(rule.condition === 'less_than') return Number(val) < Number(rule.triggerValue);
      if(rule.condition === 'not_empty') return val !== undefined && val !== null && val !== '';
      if(rule.condition === 'is_empty') return val === undefined || val === null || val === '';
      if(rule.condition === 'is_true') return !!val === true;
      if(rule.condition === 'is_false') return !!val === false;
      return false;
  };

  const isFieldRequired = (fieldId: string) => UXRules.some((r: any) => r.targetFieldId === fieldId && r.action === 'require' && evaluateUXRule(r, data));
  const isFieldHidden = (fieldId: string) => UXRules.some((r: any) => r.targetFieldId === fieldId && r.action === 'hide' && evaluateUXRule(r, data));
  const isFieldDisabled = (fieldId: string) => UXRules.some((r: any) => r.targetFieldId === fieldId && r.action === 'disable' && evaluateUXRule(r, data));

  ${lookups.map(l => `const [${l.variableName}, set${toPascalCase(l.variableName)}] = useState<any[]>([]);`).join('\n  ')}
  ${subformStateDecls}

  const toggleModal = (id: string, state: boolean) => setModals(prev => ({...prev, [id]: state}));

  useEffect(() => {
      const init = async () => {
        setLoading(true);
        try {
            ${lookups.map(l => `const ${l.variableName}Res = await get('${l.endpoint}', { pageSize: 10000 });
            let ${l.variableName}Data = ${l.variableName}Res.data || ${l.variableName}Res;
            ${l.sort ? `
                const sortField = ${l.table.fields?.find((f:any) => f.id === l.sort.fieldId) ? "'" + toCamelCase(l.table.fields?.find((f:any) => f.id === l.sort.fieldId).name || l.table.fields?.find((f:any) => f.id === l.sort.fieldId).alias || l.table.fields?.find((f:any) => f.id === l.sort.fieldId).fieldName) + "'" : 'null'};
                if (sortField) {
                    ${l.variableName}Data = ${l.variableName}Data.sort((a: any, b: any) => (a[sortField] > b[sortField] ? ${l.sort.direction === 'DESC' ? -1 : 1} : -1 * ${l.sort.direction === 'DESC' ? -1 : 1}));
                }
            ` : ''}
            set${toPascalCase(l.variableName)}(${l.variableName}Data);`).join('\n            ')}
            if (id && id !== 'new') {
                const res = await get(\`${sourceTableCamel}/\${id}\`);
                setData(res.data || res);
                ${subformLoadLogic}
            } else {
                setData(${initialDataObjStr});
            }
        } catch (e) { console.error(e); }
        setLoading(false);
      };
      init();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    try { 
      ${payloadSetupsCode}
      if (id && id !== 'new') {
          await put(\`${sourceTableCamel}/\${id}\`, payload); 
      } else {
          await post('${sourceTableCamel}', payload); 
      }
      navigate(-1); 
    } catch (e) { 
      alert('Fehler'); 
    } 
  };

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

  // 3. Queries (Read-Only Grid)
  queries.filter(q => q.type === 'SELECT').forEach(query => {
      const q = query as SelectQuery;
      const compName = `${toPascalCase(q.name)}QueryPage`;
      const endpoint = toCamelCase(q.name); // Using view/query endpoint
      
      const columns = q.columns.filter(c => c.show).map(c => {
          const propName = toCamelCase(c.alias || c.fieldName);
          return `<th className="p-4">${c.alias || c.fieldName}</th>`;
      }).join('\n');

      const cells = q.columns.filter(c => c.show).map(c => {
          const propName = toCamelCase(c.alias || c.fieldName);
          return `<td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(item.${propName} ?? '')}</td>`;
      }).join('\n');

      const content = `import React, { useEffect, useState } from 'react';
import { get } from '../../services/api';
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';

export const ${compName} = () => {
  const [data, setData] = useState<{ data: any[], total: number, page: number, totalPages: number }>({ data: [], total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [page, search]);

  const load = async () => {
      setLoading(true);
      try {
          // If query has backend logic to handle params, pass them. Otherwise just fetch.
          const res = await get('${endpoint}', { page, pageSize: 20, search });
          setData(res as any);
      } finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-[95%] mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold dark:text-white">${q.name}</h1>
            <div className="flex gap-4">
                <input 
                    type="text" 
                    placeholder="Suchen..." 
                    className="pl-4 pr-4 py-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700 text-slate-500 uppercase text-xs font-semibold">
                        <tr>${columns}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {data.data.length > 0 ? data.data.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                ${cells}
                            </tr>
                        )) : (
                            <tr><td colSpan={${q.columns.filter(c=>c.show).length}} className="p-8 text-center text-slate-400">Keine Daten.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                <div className="text-sm text-slate-500">Seite {data.page} von {data.totalPages}</div>
                <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1} className="p-2 border rounded bg-white hover:bg-slate-50 disabled:opacity-50"><ChevronLeft size={16}/></button>
                    <button onClick={() => setPage(p => Math.min(data.totalPages, p+1))} disabled={page>=data.totalPages} className="p-2 border rounded bg-white hover:bg-slate-50 disabled:opacity-50"><ChevronRight size={16}/></button>
                </div>
            </div>
        </div>
    </div>
  );
};`;
      files.push({ name: `${compName}.tsx`, path: `${root}/src/pages/queries/${compName}.tsx`, content, language: 'typescript' });
  });

  // 4. Reports (With Grouping)
  reports.forEach(report => {
      const compName = `${toPascalCase(report.name)}ReportPage`;
      // Determine endpoint: Table or Query
      let endpoint = '';
      let fields: any[] = [];
      
      if (report.sourceType === 'table') {
          const table = tables.find(t => t.id === report.sourceId);
          if (table) {
              endpoint = toCamelCase(table.name);
              fields = table.fields.map(f => ({ name: f.name, prop: toCamelCase(f.name) }));
          }
      } else {
          const query = queries.find(q => q.id === report.sourceId);
          if (query) {
              endpoint = toCamelCase(query.name);
              // For Query, we map from columns
              fields = (query as SelectQuery).columns.map(c => ({ name: c.alias || c.fieldName, prop: toCamelCase(c.alias || c.fieldName) }));
          }
      }

      // Grouping Field
      const groupingFieldObj = fields.find(f => {
          // Find field def by ID in original source is hard here without ID mapping passed.
          // Fallback: name matching from report config (which uses ID)
          // Simplified: report.groupingFieldId matches field ID.
          if (report.sourceType === 'table') {
              const t = tables.find(t => t.id === report.sourceId);
              return t?.fields.find(field => field.id === report.groupingFieldId)?.name === f.name;
          }
          return false;
      });
      const groupingProp = groupingFieldObj ? groupingFieldObj.prop : null;

      // Summary Logic
      const summaryLogic = report.summaries.map(s => {
          const prop = toCamelCase(s.fieldName);
          if (s.calculation === 'COUNT') return `sum['${s.fieldName}'] = items.length;`;
          if (s.calculation === 'SUM') return `sum['${s.fieldName}'] = items.reduce((acc, curr) => acc + (Number(curr.${prop}) || 0), 0);`;
          return '';
      }).join('\n');

      const content = `import React, { useEffect, useState, useMemo } from 'react';
import { get } from '../../services/api';
import { FileText, Printer } from 'lucide-react';

export const ${compName} = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const load = async () => {
          try {
              const res = await get<any>('${endpoint}', { pageSize: 10000 }); // Fetch all for report
              setData(Array.isArray(res) ? res : res.data);
          } finally { setLoading(false); }
      };
      load();
  }, []);

  const groupedData = useMemo(() => {
      if (!data.length) return [];
      const groupBy = '${groupingProp}';
      
      if (!groupBy || groupBy === 'null') {
          return [{ key: 'Gesamt', items: data, summaries: calculateSummaries(data) }];
      }

      const groups: Record<string, any[]> = {};
      data.forEach(item => {
          const val = item[groupBy] || 'Unbekannt';
          if (!groups[val]) groups[val] = [];
          groups[val].push(item);
      });

      return Object.keys(groups).sort().map(key => ({
          key,
          items: groups[key],
          summaries: calculateSummaries(groups[key])
      }));
  }, [data]);

  function calculateSummaries(items: any[]) {
      const sum: any = {};
      ${summaryLogic}
      return sum;
  }

  const handlePrint = () => window.print();

  return (
    <div className="p-8 max-w-[210mm] mx-auto min-h-screen bg-white shadow-xl my-8 print:shadow-none print:m-0">
        <div className="flex justify-between items-start border-b-4 border-slate-800 pb-6 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">${report.name}</h1>
                <p className="text-slate-500 mt-1">Erstellt am: {new Date().toLocaleDateString()}</p>
            </div>
            <button onClick={handlePrint} className="print:hidden bg-slate-100 hover:bg-slate-200 p-2 rounded text-slate-600"><Printer size={20}/></button>
        </div>

        <div>
            {groupedData.map((group, idx) => (
                <div key={node.id || idx} className="mb-8 break-inside-avoid">
                    {group.key !== 'Gesamt' && (
                        <div className="bg-slate-100 p-2 font-bold text-lg text-slate-700 border-l-4 border-slate-400 mb-2">
                            {group.key}
                        </div>
                    )}
                    
                    <table className="w-full text-sm text-left mb-2">
                        <thead className="border-b border-slate-300">
                            <tr>
                                ${report.columns?.filter(c=>c.visible).map(c => `<th className="py-2 font-semibold uppercase text-xs text-slate-500">${c.label}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            {group.items.map((item, i) => (
                                <tr key={i} className="border-b border-slate-100 last:border-0">
                                    ${report.columns?.filter(c=>c.visible).map(c => {
                                        // Find prop name (simplified matching)
                                        const foundField = fields.find(f => f.name === c.label); // Fallback to label match if table source
                                        // For now assume query column label matches prop
                                        const prop = foundField ? foundField.prop : toCamelCase(c.label);
                                        return `<td className="py-2">${`{item.${prop}}`}</td>`;
                                    }).join('')}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {Object.keys(group.summaries).length > 0 && (
                        <div className="bg-slate-50 p-3 flex justify-end gap-6 text-sm border-t border-slate-200">
                            {Object.entries(group.summaries).map(([k, v]: any) => (
                                <div key={k}><strong>{k}:</strong> {v}</div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};`;
      files.push({ name: `${compName}.tsx`, path: `${root}/src/pages/reports/${compName}.tsx`, content, language: 'typescript' });
  });

  // 5. Custom Pages
  pages.forEach(page => {
      const compName = `${toPascalCase(page.name)}Page`;
      
      const states: string[] = [];
      const effects: string[] = [];
      const imports = new Set<string>(['React', 'useEffect', 'useState']);
      
      const generateNode = (node: any): string => {
          if (!node) return '';
          
          let classNameStr = node.props?.className || '';
          let styleStr = JSON.stringify(node.props?.style || {});
          
          switch(node.type) {
              case 'container': {
                  const childrenStr = (node.children || []).map((c: any) => generateNode(c)).join('\n');
                  return `<div className="${classNameStr || 'p-4 border rounded'}" style={${styleStr}}>${childrenStr}</div>`;
              }
              case 'text': {
                  return `<div className="break-words ${classNameStr}" style={${styleStr}}>${node.props?.text || ''}</div>`;
              }
              case 'button': {
                  return `<button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition ${classNameStr}" style={${styleStr}}>${node.props?.label || 'Button'}</button>`;
              }
              case 'divider': {
                  return `<hr className="border-slate-200 my-4 ${classNameStr}" style={${styleStr}} />`;
              }
              case 'image': {
                  return `<img referrerPolicy="no-referrer" src="${node.props?.src || ''}" className="max-w-full h-auto rounded ${classNameStr}" style={${styleStr}} alt="${node.props?.alt || ''}" />`;
              }
              case 'html': {
                  return `<div dangerouslySetInnerHTML={{ __html: ${HTML_SAFE(node.props?.html || '')} }} className="${classNameStr}" style={${styleStr}} />`;
              }
              case 'dropdown': {
                  const stateName = `dropdownData_${node.id.replace(/-/g, '_')}`;
                  const loadingState = `dropdownLoading_${node.id.replace(/-/g, '_')}`;
                  states.push(`const [${stateName}, set_${stateName}] = useState<any[]>([]);`);
                  states.push(`const [${loadingState}, set_${loadingState}] = useState(false);`);
                  
                  let fetchUrl = '';
                  if (node.props?.queryId) {
                      const qObj = queries.find(q => q.id === node.props.queryId);
                      if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
                  } else if (node.props?.dataSourceId) {
                      const tObj = tables.find(t => t.id === node.props.dataSourceId);
                      if (tObj) fetchUrl = `${toCamelCase(tObj.name)}`;
                  }
                  
                  if (fetchUrl) {
                      imports.add('get');
                      effects.push(`
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        set_${loadingState}(true);
        const res = await get<any>('${fetchUrl}', { pageSize: 10000 });
        set_${stateName}(res.data || res || []);
      } catch (err) {
        console.error(err);
      } finally {
        set_${loadingState}(false);
      }
    };
    fetchDropdownData();
  }, []);`);
                  }
                  
                  const valueField = node.props?.valueField || 'id';
                  const labelField = node.props?.labelField || 'name';
                  
                  return `
                  <div className="p-2 ${classNameStr}" style={${styleStr}}>
                      <select className="border border-slate-300 rounded px-3 py-2 bg-white w-full max-w-xs">
                          <option value="">${node.props?.placeholder || 'Bitte wählen...'}</option>
                          {${loadingState} && <option disabled>Lade Daten...</option>}
                          {!${loadingState} && ${stateName}.map((row, idx) => {
                              const val = row['${toCamelCase(valueField)}'] || row['${valueField}'] || row.id || idx;
                              const label = row['${toCamelCase(labelField)}'] || row['${labelField}'] || Object.values(row)[0] || '';
                              return <option key={val || idx} value={val}>{String(label)}</option>;
                          })}
                      </select>
                  </div>`;
              }
              case 'table_view': {
                  const idSuffix = node.id.replace(/-/g, '_');
                  const stateName = `tableData_${idSuffix}`;
                  const loadingState = `tableLoading_${idSuffix}`;
                  const searchState = `search_${idSuffix}`;
                  const columnFiltersState = `columnFilters_${idSuffix}`;
                  const showFiltersState = `showFilters_${idSuffix}`;
                  const sortFieldState = `sortField_${idSuffix}`;
                  const sortDirState = `sortDir_${idSuffix}`;
                  const processedName = `processedTableData_${idSuffix}`;
                  const pageState = `currentPage_${idSuffix}`;
                  const paginatedName = `paginatedTableData_${idSuffix}`;
                  const selectedRowState = `selectedRow_${idSuffix}`;

                  states.push(`const [${stateName}, set_${stateName}] = useState<any[]>([]);`);
                  states.push(`const [${loadingState}, set_${loadingState}] = useState(false);`);
                  states.push(`const [${searchState}, set_${searchState}] = useState('');`);
                  states.push(`const [${columnFiltersState}, set_${columnFiltersState}] = useState<Record<string, string>>({});`);
                  states.push(`const [${showFiltersState}, set_${showFiltersState}] = useState(false);`);
                  states.push(`const [${sortFieldState}, set_${sortFieldState}] = useState<string | null>(null);`);
                  states.push(`const [${sortDirState}, set_${sortDirState}] = useState<'asc' | 'desc' | null>(null);`);
                  states.push(`const [${pageState}, set_${pageState}] = useState(1);`);
                  states.push(`const [${selectedRowState}, set_${selectedRowState}] = useState<any>(null);`);
                  
                  let fetchUrl = '';
                  if (node.props?.dataSourceType === 'table' && node.props?.dataSourceId) {
                      const tObj = tables.find(t => t.id === node.props.dataSourceId);
                      if (tObj) fetchUrl = `${toCamelCase(tObj.name)}`;
                  } else if (node.props?.dataSourceType === 'query' && node.props?.dataSourceId) {
                      const qObj = queries.find(q => q.id === node.props.dataSourceId);
                      if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
                  }
                  
                  if (fetchUrl) {
                      imports.add('get');
                      imports.add('Loader2');
                      effects.push(`
  useEffect(() => {
    const fetchTableData = async () => {
      try {
        set_${loadingState}(true);
        const res = await get<any>('${fetchUrl}', { pageSize: 100 });
        set_${stateName}(res.data || res || []);
      } catch (err) {
        console.error(err);
      } finally {
        set_${loadingState}(false);
      }
    };
    fetchTableData();
  }, []);`);
                  }
                  
                  const columnsStr = node.props?.columns || '';
                  const columns = columnsStr ? columnsStr.split(',').map((c: string) => c.trim()) : [];
                  
                  effects.push(`
  const ${processedName} = useMemo(() => {
    let items = [...${stateName}];
    const globalSearch = ${searchState}.toLowerCase().trim();
    if (globalSearch) {
      const searchTerms = globalSearch.split(/\\s+/).filter(Boolean);
      items = items.filter(row => {
        return searchTerms.every(term => {
          return Object.values(row).some(val => 
            val !== undefined && val !== null && String(val).toLowerCase().includes(term)
          );
        });
      });
    }

    Object.keys(${columnFiltersState}).forEach(key => {
      const filterVal = ${columnFiltersState}[key].toLowerCase().trim();
      if (filterVal) {
        const searchTerms = filterVal.split(/\\s+/).filter(Boolean);
        items = items.filter(row => {
          const val = row[key];
          if (val === undefined || val === null) return false;
          const cellStr = String(val).toLowerCase();
          return searchTerms.every(term => cellStr.includes(term));
        });
      }
    });

    if (${sortFieldState} && ${sortDirState}) {
      items.sort((a, b) => {
        const valA = a[${sortFieldState}];
        const valB = b[sortFieldState];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        
        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
          comparison = (valA ? 1 : 0) - (valB ? 1 : 0);
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }
        return ${sortDirState} === 'asc' ? comparison : -comparison;
      });
    }

    return items;
  }, [${stateName}, ${searchState}, ${columnFiltersState}, ${sortFieldState}, ${sortDirState}]);`);

                  effects.push(`
  const ${paginatedName} = useMemo(() => {
    const startIndex = (${pageState} - 1) * 10;
    return ${processedName}.slice(startIndex, startIndex + 10);
  }, [${processedName}, ${pageState}]);`);

                  // Clicks and interactions configuration
                  const targetTable = node.props?.dataSourceType === 'table' && node.props?.dataSourceId 
                      ? tables.find(t => t.id === node.props.dataSourceId) 
                      : null;
                  const pkField = targetTable?.fields.find(f => f.isPrimaryKey) || targetTable?.fields[0];
                  const pkFieldName = pkField ? toCamelCase(pkField.name) : 'id';

                  const detailsPage = node.props?.detailsPageId 
                      ? pages.find(p => p.id === node.props.detailsPageId) 
                      : null;
                  const detailsPageRoute = detailsPage ? `/custom/${toCamelCase(detailsPage.name)}` : '';

                  const editForm = node.props?.editFormId 
                      ? forms.find(f => f.id === node.props.editFormId) 
                      : null;
                  const formRoute = editForm ? `/forms/${toPascalCase(editForm.name).toLowerCase()}Form` : '';

                  const paramKey = node.props?.selectionParamName || 'selectedId';
                  const clickTrigger = node.props?.rowClickTrigger || 'click';
                  const dblclickTrigger = node.props?.rowDoubleClickTrigger || 'dblclick';

                  let clickActionCode = '';
                  let dblclickActionCode = '';

                  if (detailsPageRoute) {
                      const code = `navigate(\`${detailsPageRoute}?\${paramKey}=\${idVal}\`);`;
                      if (clickTrigger === 'click') clickActionCode = code;
                      if (dblclickTrigger === 'dblclick') dblclickActionCode = code;
                  } else if (formRoute) {
                      const code = `navigate(\`${formRoute}/\${idVal}\`);`;
                      if (clickTrigger === 'click') clickActionCode = code;
                      if (dblclickTrigger === 'dblclick') dblclickActionCode = code;
                  }

                  let headerCells = '';
                  let bodyCells = '';
                  let filterRow = '';
                  
                  if (columns.length > 0) {
                      headerCells = columns.map((col: string) => `
                                          <th 
                                              key="${col}" 
                                              className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 select-none"
                                              onClick={() => {
                                                  if (${sortFieldState} === '${toCamelCase(col)}') {
                                                      set_${sortDirState}(${sortDirState} === 'asc' ? 'desc' : ${sortDirState} === 'desc' ? null : 'asc');
                                                      if (${sortDirState} === 'desc') set_${sortFieldState}(null);
                                                  } else {
                                                      set_${sortFieldState}('${toCamelCase(col)}');
                                                      set_${sortDirState}('asc');
                                                  }
                                              }}
                                          >
                                              <div className="flex items-center gap-1.5">
                                                  <span>${col}</span>
                                                  {${sortFieldState} === '${toCamelCase(col)}' ? (
                                                      ${sortDirState} === 'asc' ? <ArrowUp size={12} className="text-blue-500" /> : <ArrowDown size={12} className="text-blue-500" />
                                                  ) : (
                                                      <ArrowUpDown size={12} className="text-slate-300 dark:text-slate-600" />
                                                  )}
                                              </div>
                                          </th>`).join('\n');
                      
                      bodyCells = columns.map((col: string) => `<td key="${col}" className="px-3 py-2 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{String(row['${toCamelCase(col)}'] || row['${col}'] || '')}</td>`).join('\n');
                      
                      filterRow = `
                                  {${showFiltersState} && (
                                      <tr className="bg-slate-100/50 dark:bg-slate-900/50">
                                          ${columns.map((col: string) => `
                                          <th className="p-2">
                                              <input 
                                                  type="text"
                                                  placeholder="Filtern..."
                                                  className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                                  value={${columnFiltersState}['${toCamelCase(col)}'] || ''}
                                                  onChange={e => {
                                                      set_${columnFiltersState}({ ...${columnFiltersState}, '${toCamelCase(col)}': e.target.value });
                                                      set_${pageState}(1);
                                                  }}
                                              />
                                          </th>`).join('\n')}
                                      </tr>
                                  )}`;
                  } else {
                      headerCells = `
                                      {${stateName}.length > 0 ? Object.keys(${stateName}[0]).map(k => (
                                          <th 
                                              key={k} 
                                              className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 select-none"
                                              onClick={() => {
                                                  if (${sortFieldState} === k) {
                                                      set_${sortDirState}(${sortDirState} === 'asc' ? 'desc' : ${sortDirState} === 'desc' ? null : 'asc');
                                                      if (${sortDirState} === 'desc') set_${sortFieldState}(null);
                                                  } else {
                                                      set_${sortFieldState}(k);
                                                      set_${sortDirState}('asc');
                                                  }
                                              }}
                                          >
                                              <div className="flex items-center gap-1.5">
                                                  <span>{k}</span>
                                                  {${sortFieldState} === k ? (
                                                      ${sortDirState} === 'asc' ? <ArrowUp size={12} className="text-blue-500" /> : <ArrowDown size={12} className="text-blue-500" />
                                                  ) : (
                                                      <ArrowUpDown size={12} className="text-slate-300 dark:text-slate-600" />
                                                  )}
                                              </div>
                                          </th>
                                      )) : <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Keine Daten</th>}`;
                      
                      bodyCells = `
                                      {Object.values(row).map((val: any, vIdx) => (
                                          <td key={vIdx} className="px-3 py-2 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{String(val)}</td>
                                      ))}`;
                      
                      filterRow = `
                                  {${showFiltersState} && ${stateName}.length > 0 && (
                                      <tr className="bg-slate-100/50 dark:bg-slate-900/50">
                                          {Object.keys(${stateName}[0]).map(k => (
                                              <th key={k} className="p-2">
                                                  <input 
                                                      type="text"
                                                      placeholder="Filtern..."
                                                      className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                                      value={${columnFiltersState}[k] || ''}
                                                      onChange={e => {
                                                          set_${columnFiltersState}({ ...${columnFiltersState}, [k]: e.target.value });
                                                          set_${pageState}(1);
                                                      }}
                                                  />
                                              </th>
                                          ))}
                                      </tr>
                                  )}`;
                  }

                  const totalItems = `${processedName}.length`;
                  const totalPages = `Math.ceil(${totalItems} / 10) || 1`;
                  const startIndex = `(${pageState} - 1) * 10`;
                  const endIndex = `Math.min(${startIndex} + 10, ${totalItems})`;
                  
                  return `
                  <div className="p-4 w-full flex flex-col gap-4 \${classNameStr}" style={\${styleStr}}>
                      <div className="flex justify-between items-center gap-4">
                          <button 
                              onClick={() => set_${showFiltersState}(prev => !prev)} 
                              className={\`p-1.5 border rounded-lg flex items-center gap-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition \${${showFiltersState} ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white'}\`}
                              title="Spaltenfilter anzeigen/ausblenden"
                          >
                              <Filter size={14}/>
                              <span>Filter</span>
                          </button>
                          
                          <div className="relative flex-1 max-w-xs">
                              <Search className="absolute left-3 top-2 text-slate-400" size={14} />
                              <input 
                                  type="text" 
                                  placeholder="Suchen..." 
                                  className="pl-9 pr-3 py-1.5 border rounded-lg text-xs w-full bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                  value={${searchState}}
                                  onChange={e => {
                                      set_${searchState}(e.target.value);
                                      set_${pageState}(1);
                                  }}
                              />
                          </div>
                      </div>

                      {${loadingState} ? (
                          <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
                      ) : (
                          <div className="flex flex-col gap-3">
                              <div className="overflow-x-auto border rounded-lg dark:border-slate-700">
                                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                      <thead className="bg-slate-50 dark:bg-slate-900">
                                          <tr>
                                              \${headerCells}
                                          </tr>
                                          \${filterRow}
                                      </thead>
                                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                          {${paginatedName}.map((row: any, idx: number) => {
                                              const idVal = row['${pkFieldName}'] || row.id || row.ID || idx;
                                              return (
                                                  <tr 
                                                      key={row.id || row.ID || row.uuid || idx} 
                                                      onClick={() => {
                                                          set_${selectedRowState}(idVal);
                                                          ${clickActionCode ? `const idVal = row['${pkFieldName}'] || row.id || row.ID || idx; ${clickActionCode}` : ''}
                                                      }}
                                                      ${dblclickActionCode ? `onDoubleClick={() => {
                                                          const idVal = row['${pkFieldName}'] || row.id || row.ID || idx;
                                                          ${dblclickActionCode}
                                                      }}` : ''}
                                                      className={\`hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition select-none \${${selectedRowState} === idVal ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}\`}
                                                  >
                                                      \${bodyCells}
                                                  </tr>
                                              );
                                          })}
                                      </tbody>
                                  </table>
                              </div>

                              {/* Pagination Footer */}
                              {${totalItems} > 0 && (
                                  <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 px-1 gap-2 text-xs text-slate-500 dark:text-slate-400 select-none">
                                      <div>
                                          Zeige <span className="font-semibold text-slate-700 dark:text-slate-300">{${startIndex} + 1}</span> bis <span className="font-semibold text-slate-700 dark:text-slate-300">{${endIndex}}</span> von <span className="font-semibold text-slate-700 dark:text-slate-300">{${totalItems}}</span> Einträgen
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                          <button 
                                              onClick={() => set_${pageState}(1)} 
                                              disabled={${pageState} <= 1}
                                              className="px-2 py-1 border dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition"
                                          >
                                              Erste
                                          </button>
                                          <button 
                                              onClick={() => set_${pageState}(p => Math.max(1, p - 1))} 
                                              disabled={${pageState} <= 1}
                                              className="p-1 border dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition flex items-center justify-center"
                                          >
                                              <ChevronLeft size={14} />
                                          </button>
                                          <span className="px-3 py-1 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded">
                                              Seite {${pageState}} von {${totalPages}}
                                          </span>
                                          <button 
                                              onClick={() => set_${pageState}(p => Math.min(${totalPages}, p + 1))} 
                                              disabled={${pageState} >= ${totalPages}}
                                              className="p-1 border dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition flex items-center justify-center"
                                          >
                                              <ChevronRight size={14} />
                                          </button>
                                          <button 
                                              onClick={() => set_${pageState}(${totalPages})} 
                                              disabled={${pageState} >= ${totalPages}}
                                              className="px-2 py-1 border dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition"
                                          >
                                              Letzte
                                          </button>
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>`;
              }
              default:
                  return `<div className="p-4 bg-slate-50 rounded border text-sm text-slate-400">${node.type} Component</div>`;
          }
      };
      
      const HTML_SAFE = (htmlStr: string) => {
          return JSON.stringify(htmlStr);
      };

      const layoutHtml = generateNode(page.layout);
      
      const importsStr = Array.from(imports).map(imp => {
          if (imp === 'React' || imp === 'useEffect' || imp === 'useState') return '';
          if (imp === 'get') return "import { get } from '../../services/api';";
          if (imp === 'Loader2') return "";
          return '';
      }).filter(Boolean).join('\n');
      
      const content = `import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
${importsStr}

export const ${compName} = () => {
  const navigate = useNavigate();
  ${states.join('\n  ')}

  ${effects.join('\n  ')}

  return (
    <div className="p-8 max-w-[95%] mx-auto">
        <h1 className="text-3xl font-bold dark:text-white mb-6">${page.name}</h1>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700 p-6">
            ${layoutHtml}
        </div>
    </div>
  );
};`;
      files.push({ name: `${compName}.tsx`, path: `${root}/src/pages/custom/${compName}.tsx`, content, language: 'typescript' });
  });

  return files;
};
