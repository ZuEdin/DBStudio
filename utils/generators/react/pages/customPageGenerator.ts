import { CustomPage, Table, Query, Form, VirtualFile } from '../../../../types/index';
import { toCamelCase, toPascalCase } from '../../common';

export const generateCustomPage = (
  page: CustomPage,
  tables: Table[],
  queries: Query[],
  forms: Form[],
  root: string,
  pages: CustomPage[],
  customComponents: any[] = []
): VirtualFile => {
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
        const res = await get<any>('${fetchUrl}', { pageSize: 10 });
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
          case 'custom_component': {
              const comp = (customComponents || []).find(c => c.id === node.props?.customComponentId);
              if (!comp) {
                  return `<div className="p-3 bg-amber-50 text-amber-700 text-xs border border-amber-200 rounded italic text-center">Custom Component nicht verknüpft oder nicht gefunden</div>`;
              }
              
              const conf = comp.configuration || {};
              const idSuffix = node.id.replace(/-/g, '_');
              const stateName = `compData_${idSuffix}`;
              const loadingState = `compLoading_${idSuffix}`;
              
              // 1. Set up data fetching if the component has a dataSource configuration
              const dsType = conf.dataSourceType || (conf.tableId ? 'table' : '');
              const dsId = conf.dataSourceId || conf.tableId;
              let fetchUrl = '';
              if (dsType === 'table' && dsId) {
                  const tObj = tables.find(t => t.id === dsId);
                  if (tObj) fetchUrl = `${toCamelCase(tObj.name)}`;
              } else if (dsType === 'query' && dsId) {
                  const qObj = queries.find(q => q.id === dsId);
                  if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
              }
              
              if (fetchUrl) {
                  states.push(`const [${stateName}, set_${stateName}] = useState<any[]>([]);`);
                  states.push(`const [${loadingState}, set_${loadingState}] = useState(false);`);
                  imports.add('get');
                  imports.add('Loader2');
                  effects.push(`
  useEffect(() => {
    const fetch_${stateName} = async () => {
      try {
        set_${loadingState}(true);
        const res = await get<any>('${fetchUrl}', { pageSize: ${conf.pageSize || 10000} });
        set_${stateName}(res.data || res || []);
      } catch (err) {
        console.error(err);
      } finally {
        set_${loadingState}(false);
      }
    };
    fetch_${stateName}();
  }, []);`);
              }

              // 2. Render depending on comp.type
              if (comp.type === 'table_view') {
                  const searchState = `search_${idSuffix}`;
                  const selectedFiltersState = `selectedFilters_${idSuffix}`;
                  const sortFieldState = `sortField_${idSuffix}`;
                  const sortOrderState = `sortOrder_${idSuffix}`;
                  
                  states.push(`const [${searchState}, set_${searchState}] = useState('');`);
                  states.push(`const [${selectedFiltersState}, set_${selectedFiltersState}] = useState<Record<string, string>>({});`);
                  states.push(`const [${sortFieldState}, set_${sortFieldState}] = useState('${conf.defaultSortField || ''}');`);
                  states.push(`const [${sortOrderState}, set_${sortOrderState}] = useState<'asc' | 'desc'>('${conf.defaultSortOrder || 'asc'}');`);
                  
                  // Columns
                  const cols = conf.columns || [];
                  
                  // Processed memo state
                  const processedDataName = `processed_${idSuffix}`;
                  states.push(`
  const ${processedDataName} = useMemo(() => {
    let items = [...${stateName}];
    if (${searchState}.trim()) {
      const q = ${searchState}.toLowerCase().trim();
      items = items.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(q)));
    }
    Object.entries(${selectedFiltersState}).forEach(([field, val]) => {
      if (val) {
        items = items.filter(row => String(row[field] || '') === val);
      }
    });
    if (${sortFieldState}) {
      items.sort((a, b) => {
        const valA = a[${sortFieldState}];
        const valB = b[${sortFieldState}];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        const res = typeof valA === 'number' && typeof valB === 'number' 
          ? valA - valB 
          : String(valA).localeCompare(String(valB));
        return ${sortOrderState} === 'asc' ? res : -res;
      });
    }
    return items;
  }, [${stateName}, ${searchState}, ${selectedFiltersState}, ${sortFieldState}, ${sortOrderState}]);`);

                  let tableHeaderCols = '';
                  let tableBodyCells = '';
                  if (cols.length > 0) {
                      tableHeaderCols = cols.map((col: any) => `
                                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 select-none" onClick={() => {
                                          if (${sortFieldState} === '${col.field}') {
                                              set_${sortOrderState}(${sortOrderState} === 'asc' ? 'desc' : 'asc');
                                          } else {
                                              set_${sortFieldState}('${col.field}');
                                              set_${sortOrderState}('asc');
                                          }
                                      }}>
                                          <div className="flex items-center gap-1.5">
                                              <span>${col.title || col.field}</span>
                                          </div>
                                      </th>`).join('');
                      tableBodyCells = cols.map((col: any) => `
                                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                                                  {String(row['${col.field}'] ?? '-')}
                                              </td>`).join('');
                  } else {
                      tableHeaderCols = `<th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Daten</th>`;
                      tableBodyCells = `<td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{JSON.stringify(row)}</td>`;
                  }

                  let filtersHtml = '';
                  if (conf.enableFilters && conf.filterFields && conf.filterFields.length > 0) {
                      filtersHtml = `
                      <div className="flex flex-wrap gap-4 items-center">
                          ${conf.filterFields.map((field: string) => {
                              const uniqueOptsState = `uniqueOpts_${idSuffix}_${field.replace(/[^a-zA-Z0-9]/g, '_')}`;
                              states.push(`
  const ${uniqueOptsState} = useMemo(() => {
    return Array.from(new Set(${stateName}.map(r => String(r['${field}'] || '')).filter(Boolean))).sort();
  }, [${stateName}]);`);
                              return `
                              <div key="${field}" className="flex flex-col gap-1">
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">${field}</label>
                                  <select 
                                      value={${selectedFiltersState}['${field}'] || ''} 
                                      onChange={(e) => set_${selectedFiltersState}(prev => ({ ...prev, '${field}': e.target.value }))}
                                      className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-slate-800"
                                  >
                                      <option value="">Alle</option>
                                      {${uniqueOptsState}.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                              </div>`;
                          }).join('\n')}
                      </div>`;
                  }

                  let searchHtml = '';
                  if (conf.enableSearch) {
                      searchHtml = `
                      <div className="relative max-w-xs">
                          <input 
                              type="text" 
                              placeholder="${conf.searchPlaceholder || 'Suchen...'}"
                              value={${searchState}}
                              onChange={(e) => set_${searchState}(e.target.value)}
                              className="px-4 py-1.5 w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                      </div>`;
                  }

                  if (conf.layoutMode === 'grid') {
                      return `
              <div className="space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">${conf.title || comp.name}</h3>
                      <div className="flex items-center gap-4">
                          ${searchHtml}
                      </div>
                  </div>
                  ${filtersHtml}
                  {${loadingState} ? (
                      <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
                  ) : ${processedDataName}.length === 0 ? (
                      <div className="text-center py-12 text-sm text-slate-400 italic">Keine Einträge gefunden.</div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {${processedDataName}.map((row, idx) => (
                              <div key={idx} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2 text-left">
                                  ${cols.length > 0 ? cols.map((col: any, cIdx: number) => {
                                      if (cIdx === 0) {
                                          return `<h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{String(row['${col.field}'] ?? '-')}</h4>`;
                                      } else {
                                          return `
                                          <div className="flex justify-between text-xs border-b border-slate-50 dark:border-slate-700 pb-1">
                                              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">${col.title || col.field}</span>
                                              <span className="text-slate-700 dark:text-slate-300 font-medium">{String(row['${col.field}'] ?? '-')}</span>
                                          </div>`;
                                      }
                                  }).join('\n') : `<div>{JSON.stringify(row)}</div>`}
                              </div>
                          ))}
                      </div>
                  )}
              </div>`;
                  } else {
                      return `
              <div className="space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">${conf.title || comp.name}</h3>
                      <div className="flex items-center gap-4">
                          ${searchHtml}
                      </div>
                  </div>
                  ${filtersHtml}
                  {${loadingState} ? (
                      <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
                  ) : ${processedDataName}.length === 0 ? (
                      <div className="text-center py-12 text-sm text-slate-400 italic">Keine Einträge gefunden.</div>
                  ) : (
                      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
                          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                              <thead className="bg-slate-50 dark:bg-slate-900/60">
                                  <tr>
                                      ${tableHeaderCols}
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {${processedDataName}.map((row, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                          ${tableBodyCells}
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  )}
              </div>`;
                  }
              }

              if (comp.type === 'form_view') {
                  const formObj = forms.find(f => f.id === conf.formId);
                  const tbl = formObj ? tables.find(t => t.id === formObj.sourceId) : null;
                  
                  if (tbl) {
                      const tblCamel = toCamelCase(tbl.name);
                      const fieldsToRender = tbl.fields.filter(f => !f.isPrimaryKey);
                      const formDataState = `formData_${idSuffix}`;
                      states.push(`const [${formDataState}, set_${formDataState}] = useState<Record<string, any>>({});`);
                      imports.add('post');
                      
                      return `
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  {!${conf.hideHeader ? 'true' : 'false'} && (
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">${formObj?.name || comp.name}</h3>
                  )}
                  <form onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                          await post('${tblCamel}', ${formDataState});
                          alert('Erfolgreich gespeichert!');
                          set_${formDataState}({});
                      } catch (err) {
                          console.error(err);
                          alert('Fehler beim Speichern.');
                      }
                  }} className="space-y-4 text-left">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          ${fieldsToRender.map(f => {
                              const fCamel = toCamelCase(f.name);
                              return `
                              <div key="${f.id}" className="space-y-1">
                                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">${f.name}</label>
                                  <input 
                                      type="text"
                                      value={${formDataState}['${fCamel}'] || ''}
                                      onChange={(e) => set_${formDataState}(prev => ({ ...prev, '${fCamel}': e.target.value }))}
                                      className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900"
                                  />
                              </div>`;
                          }).join('\n')}
                      </div>
                      {!${conf.hideActions ? 'true' : 'false'} && (
                          <div className="flex justify-end pt-2">
                              <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow transition">
                                  Speichern
                              </button>
                          </div>
                      )}
                  </form>
              </div>`;
                  } else {
                      return `<div className="p-4 bg-slate-50 rounded border text-sm text-slate-400">Formular-Datenquelle nicht gefunden</div>`;
                  }
              }

              if (comp.type === 'text') {
                  const txtSize = conf.fontSize || 'text-base';
                  const txtWeight = conf.fontWeight || 'font-normal';
                  const txtColor = conf.colorClass || 'text-slate-700';
                  const txtAlign = conf.alignment || 'text-left';
                  const escapedText = (conf.text || '').replace(/'/g, "\\'");
                  return `<div className="w-full ${txtSize} ${txtWeight} ${txtColor} ${txtAlign} p-2">${escapedText}</div>`;
              }

              if (comp.type === 'button') {
                  const variantClasses = 
                      conf.variant === 'secondary' ? 'bg-slate-100 text-slate-700 border hover:bg-slate-200' :
                      conf.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
                      conf.variant === 'outline' ? 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50' : 'bg-indigo-600 text-white hover:bg-indigo-700';
                  
                  let clickHandler = '';
                  if (conf.actionType === 'navigate' && conf.targetPageId) {
                      const targetPage = pages.find(p => p.id === conf.targetPageId);
                      if (targetPage) {
                          clickHandler = `navigate('/pages/${toCamelCase(targetPage.name)}')`;
                      }
                  } else if (conf.actionType === 'setParam' && conf.targetParamKey) {
                      clickHandler = `console.log('Param set: ${conf.targetParamKey} = ${conf.targetParamVal}')`;
                  }
                  
                  return `
              <button 
                  onClick={() => ${clickHandler || "console.log('Button geklickt')"}}
                  className="px-4 py-2 rounded font-medium shadow-sm transition-colors m-2 ${variantClasses}"
              >
                  ${conf.label || 'Aktions-Button'}
              </button>`;
              }

              if (comp.type === 'dropdown') {
                  const valueField = toCamelCase(conf.valueField || 'id');
                  const labelField = toCamelCase(conf.displayField || 'Name');
                  return `
              <div className="p-2 w-full text-left">
                  ${conf.label ? `<label className="block text-xs font-semibold text-slate-600 mb-1">${conf.label}</label>` : ''}
                  <select 
                      className="border border-slate-300 rounded px-3 py-2 bg-white w-full max-w-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                      onChange={(e) => console.log('Dropdown changed: ' + e.target.value)}
                  >
                      <option value="">${conf.placeholder || '-- Bitte wählen --'}</option>
                      {${loadingState} && <option disabled>Lade Daten...</option>}
                      {!${loadingState} && ${stateName}.map((row, idx) => (
                          <option key={idx} value={row['${valueField}'] || row.id || idx}>
                              {String(row['${labelField}'] || row.name || Object.values(row)[0] || '')}
                          </option>
                      ))}
                  </select>
              </div>`;
              }

              if (comp.type === 'metric_card') {
                  const theme = conf.themeColor || 'indigo';
                  const themeClasses = {
                      indigo: 'bg-indigo-50/40 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400',
                      emerald: 'bg-emerald-50/40 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400',
                      rose: 'bg-rose-50/40 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400',
                      sky: 'bg-sky-50/40 border-sky-100 text-sky-700 dark:bg-sky-950/20 dark:border-sky-900/40 dark:text-sky-400',
                      amber: 'bg-amber-50/40 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400',
                      slate: 'bg-slate-50/40 border-slate-200 text-slate-700 dark:bg-slate-900/30 dark:border-slate-800 dark:text-slate-400'
                  };

                  const iconBgClasses = {
                      indigo: 'bg-indigo-100 dark:bg-indigo-900/40',
                      emerald: 'bg-emerald-100 dark:bg-emerald-900/40',
                      rose: 'bg-rose-100 dark:bg-rose-900/40',
                      sky: 'bg-sky-100 dark:bg-sky-900/40',
                      amber: 'bg-amber-100 dark:bg-amber-900/40',
                      slate: 'bg-slate-200 dark:bg-slate-800'
                  };

                  const computedValFn = `computeMetric_${idSuffix}`;
                  const aggFieldCamel = toCamelCase(conf.aggField || '');
                  
                  states.push(`
  const ${computedValFn} = useMemo(() => {
    if ('${conf.aggType}' === 'custom') return '${conf.customValue || '0'}';
    if (!${stateName} || ${stateName}.length === 0) return '0';
    if ('${conf.aggType}' === 'count') return ${stateName}.length.toString();
    
    const f = '${aggFieldCamel}';
    const numbers = ${stateName}.map(r => Number(r[f])).filter(val => !isNaN(val));
    if (numbers.length === 0) return '0,00';
    
    let res = 0;
    if ('${conf.aggType}' === 'sum') {
      res = numbers.reduce((a, b) => a + b, 0);
    } else if ('${conf.aggType}' === 'avg') {
      res = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    } else if ('${conf.aggType}' === 'min') {
      res = Math.min(...numbers);
    } else if ('${conf.aggType}' === 'max') {
      res = Math.max(...numbers);
    }
    return res.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [${stateName}]);`);

                  return `
              <div className="p-4 w-full flex justify-center text-left">
                  {${loadingState} ? (
                      <div className="w-full max-w-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 animate-pulse rounded-2xl p-5 h-28"></div>
                  ) : (
                      <div className={"w-full max-w-sm border-2 p-5 rounded-2xl shadow-sm " + ("\${(themeClasses as any)[theme] || themeClasses.indigo}")}>
                          <div className="flex justify-between items-start">
                              <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">${conf.title || 'Kennzahl'}</p>
                                  <h4 className="text-3xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white font-sans">
                                      ${conf.prefix || ''}{${computedValFn}}${conf.suffix || ''}
                                  </h4>
                              </div>
                              <div className={"p-2.5 rounded-xl " + ("\${(iconBgClasses as any)[theme] || iconBgClasses.indigo}")}>
                                  <span className="text-sm font-bold uppercase font-mono">${(conf.iconName || 'Up').substring(0, 3)}</span>
                              </div>
                          </div>
                          ${conf.subtext ? `
                          <div className="mt-3 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 pt-2 flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>${conf.subtext}</span>
                          </div>` : ''}
                      </div>
                  )}
              </div>`;
              }

              if (comp.type === 'kanban_board') {
                  const groupBy = toCamelCase(conf.groupByField || 'Status');
                  const titleF = toCamelCase(conf.titleField || 'Name');
                  const descF = toCamelCase(conf.descField || 'Email');
                  const accentF = toCamelCase(conf.cardAccentField || 'Umsatz');

                  const groupsState = `kanbanGroups_${idSuffix}`;
                  const colKeysState = `kanbanCols_${idSuffix}`;

                  states.push(`
  const ${groupsState} = useMemo(() => {
    const groups: Record<string, any[]> = {};
    ${stateName}.forEach(row => {
      const val = String(row['${groupBy}'] || 'Unbekannt');
      if (!groups[val]) groups[val] = [];
      groups[val].push(row);
    });
    return groups;
  }, [${stateName}]);

  const ${colKeysState} = useMemo(() => Object.keys(${groupsState}), [${groupsState}]);`);

                  return `
              <div className="p-4 w-full space-y-4 text-left">
                  <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">${conf.title || 'Kanban-Board'}</h4>
                      <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-mono font-medium">
                          Spalte: ${groupBy}
                      </span>
                  </div>
                  {${loadingState} ? (
                      <div className="grid grid-cols-3 gap-3">
                          <div className="h-48 bg-slate-100 animate-pulse rounded-xl"></div>
                          <div className="h-48 bg-slate-100 animate-pulse rounded-xl"></div>
                          <div className="h-48 bg-slate-100 animate-pulse rounded-xl"></div>
                      </div>
                  ) : ${colKeysState}.length === 0 ? (
                      <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs italic rounded-xl">
                          Keine Daten gefunden.
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto pb-2">
                          {${colKeysState}.map(colKey => (
                              <div key={colKey} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 flex flex-col min-w-[200px]">
                                  <div className="flex justify-between items-center mb-3 px-1">
                                      <span className="text-xs font-bold text-slate-700 truncate max-w-[80%]">{colKey}</span>
                                      <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                                          {${groupsState}[colKey].length}
                                      </span>
                                  </div>
                                  <div className="space-y-2.5 flex-1">
                                      {${groupsState}[colKey].map((row, rIdx) => {
                                          const cardTitle = row['${titleF}'] ? String(row['${titleF}']) : 'Task #' + (rIdx + 1);
                                          const cardDesc = row['${descF}'] ? String(row['${descF}']) : '';
                                          const cardAccent = row['${accentF}'];
                                          return (
                                              <div 
                                                  key={rIdx} 
                                                  className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer space-y-2"
                                              >
                                                  <h5 className="text-xs font-bold text-slate-800 leading-tight truncate">{cardTitle}</h5>
                                                  {cardDesc && <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-3">{cardDesc}</p>}
                                                  {cardAccent !== undefined && cardAccent !== null && (
                                                      <div className="flex justify-end pt-1">
                                                          <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-mono">
                                                              {typeof cardAccent === 'number' ? cardAccent.toLocaleString('de-DE') : String(cardAccent)}
                                                          </span>
                                                      </div>
                                                  )}
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>`;
              }

              return `<div className="p-3 bg-slate-50 text-slate-500 text-xs italic border rounded text-center">[Custom Component {comp.name} ({comp.type}) geladen]</div>`;
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

  return { name: `${compName}.tsx`, path: `${root}/src/pages/custom/${compName}.tsx`, content, language: 'typescript' };
};
