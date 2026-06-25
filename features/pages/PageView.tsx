import React, { useState, useEffect, createContext, useContext } from 'react';
import { CustomPage, PageComponent, Table, Form } from '../../types/index';
import { useProjectStore } from '../../stores/useProjectStore';
import { executeSelectQuery } from '../queries/utils/queryExecution';
import { FormView } from '../forms/FormView';
import { Loader2, Trash2, Edit, Plus, X, Layers, AlertCircle, CheckCircle, ChevronRight, HelpCircle } from 'lucide-react';

interface PageViewProps {
  page: CustomPage;
  onSetView: (view: { type: 'page_designer' | 'page_view'; pageId: string }) => void;
}

// Context for managing page parameters (e.g. selectedId, activeTab)
export const PageParamsContext = createContext<{
    params: Record<string, any>;
    setParam: (key: string, value: any) => void;
}>({
    params: {},
    setParam: () => {}
});

// Context for managing page interactions (modals, confirmation overlays, page-navigation)
export const PageViewContext = createContext<{
    openFormModal: (formId: string, mode: 'create' | 'edit', recordId?: any, callback?: () => void, defaultValues?: Record<string, any>) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void) => void;
    navigate: (pageId: string, initialParams?: Record<string, any>) => void;
    activeRole?: string;
}>({
    openFormModal: () => {},
    showConfirm: () => {},
    navigate: () => {},
    activeRole: 'Admin'
});

// Helper to safely replace placeholders like {{name}} or {{selectedId}}
const resolvePlaceholders = (text: string, context?: Record<string, any>, params?: Record<string, any>): string => {
    if (!text) return '';
    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        // 1. Check local loop context first
        if (context && context[trimmedKey] !== undefined) {
            return String(context[trimmedKey]);
        }
        // 2. Check page-level parameters
        if (params && params[trimmedKey] !== undefined) {
            return String(params[trimmedKey]);
        }
        return '';
    });
};

// Helper to determine the label and value of lookup rows
const getRowLabelAndValue = (row: any, props: any, idx: number) => {
    if (!row || typeof row !== 'object') {
        return { val: idx, label: String(row ?? '') };
    }

    const keys = Object.keys(row);
    if (keys.length === 0) {
        return { val: idx, label: `Eintrag ${idx + 1}` };
    }

    let val: any = idx;
    if (props.valueField && row[props.valueField] !== undefined && row[props.valueField] !== null) {
        val = row[props.valueField];
    } else {
        const idKey = keys.find(k => k.toLowerCase() === 'id' || k.toLowerCase().endsWith('_id') || k.toLowerCase() === 'uuid');
        if (idKey && row[idKey] !== undefined && row[idKey] !== null) {
            val = row[idKey];
        } else if (row.id !== undefined && row.id !== null) {
            val = row.id;
        } else {
            const firstVal = Object.values(row)[0];
            val = (firstVal !== undefined && firstVal !== null) ? firstVal : idx;
        }
    }

    let label = '';
    if (props.labelField && row[props.labelField] !== undefined && row[props.labelField] !== null) {
        label = String(row[props.labelField]);
    } else {
        const labelKeywords = ['name', 'label', 'title', 'titel', 'text', 'bezeichnung', 'username', 'email', 'description'];
        const matchedKey = keys.find(k => {
            const kl = k.toLowerCase();
            return labelKeywords.some(kw => kl.includes(kw));
        });

        if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
            label = String(row[matchedKey]);
        } else {
            const nonIdKey = keys.find(k => {
                const kl = k.toLowerCase();
                return kl !== 'id' && !kl.endsWith('_id') && kl !== 'uuid' && row[k] !== null && row[k] !== undefined;
            });
            if (nonIdKey) {
                label = String(nonIdKey);
            } else {
                const firstVal = Object.values(row)[0];
                label = (firstVal !== undefined && firstVal !== null) ? String(firstVal) : `Eintrag ${idx + 1}`;
            }
        }
    }

    return { val, label };
};

const LiveNode: React.FC<{ node: PageComponent; context?: Record<string, any> }> = ({ node, context }) => {
    const { queries, tables, relationships, pages, updateTable, forms } = useProjectStore();
    const { params, setParam } = useContext(PageParamsContext);
    const { openFormModal, showConfirm, navigate, activeRole } = useContext(PageViewContext);
    
    // Role-Based Visibility Check
    if (node.props.allowedRoles && node.props.allowedRoles.length > 0) {
        if (!activeRole || !node.props.allowedRoles.includes(activeRole)) {
            return null; // Dynamically hide component
        }
    }

    const [fetchedData, setFetchedData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Load data binding or query records
    useEffect(() => {
        if (node.type === 'dropdown' && node.props.queryId) {
            setLoading(true);
            const query = queries.find(q => q.id === node.props.queryId);
            if (query) {
                const data = executeSelectQuery(query, tables, relationships);
                setFetchedData(data);
            }
            setLoading(false);
        } else if ((node.type === 'table_view' || node.type === 'container') && node.props.dataSourceType) {
            setLoading(true);
            try {
                if (node.props.dataSourceType === 'table' && node.props.dataSourceId) {
                    const table = tables.find(t => t.id === node.props.dataSourceId);
                    if (table) setFetchedData(table.data || []);
                } else if (node.props.dataSourceType === 'query' && node.props.dataSourceId) {
                    const query = queries.find(q => q.id === node.props.dataSourceId);
                    if (query) {
                        const data = executeSelectQuery(query, tables, relationships);
                        setFetchedData(data);
                    }
                }
            } catch (err) {
                 console.error(err);
            }
            setLoading(false);
        } else if (node.type === 'list_repeater' && node.props.dataSourceId) {
            setLoading(true);
            try {
                if (node.props.dataSourceType === 'table') {
                    const table = tables.find(t => t.id === node.props.dataSourceId);
                    if (table) setFetchedData(table.data || []);
                } else {
                    const query = queries.find(q => q.id === node.props.dataSourceId);
                    if (query) {
                        const data = executeSelectQuery(query, tables, relationships);
                        setFetchedData(data);
                    }
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        }
    }, [node.type, node.props.queryId, node.props.dataSourceType, node.props.dataSourceId, queries, tables, relationships]);

    // Handle conditional visibility (ngIf)
    if (node.props.visibilityField) {
        const vField = node.props.visibilityField;
        const vOperator = node.props.visibilityOperator || '==';
        const vExpected = node.props.visibilityValue || '';

        // Check in loop context first, then fallback to parameters
        let actualVal = '';
        if (context && context[vField] !== undefined) {
            actualVal = String(context[vField]);
        } else if (params && params[vField] !== undefined) {
            actualVal = String(params[vField]);
        }

        let isVisible = false;
        if (vOperator === '==') isVisible = (actualVal === vExpected);
        else if (vOperator === '!=') isVisible = (actualVal !== vExpected);
        else if (vOperator === '>') isVisible = (parseFloat(actualVal) > parseFloat(vExpected));
        else if (vOperator === '<') isVisible = (parseFloat(actualVal) < parseFloat(vExpected));
        else if (vOperator === 'contains') isVisible = actualVal.toLowerCase().includes(vExpected.toLowerCase());
        else if (vOperator === 'not_empty') isVisible = (actualVal !== '' && actualVal !== 'undefined' && actualVal !== 'null');
        else if (vOperator === 'empty') isVisible = (actualVal === '' || actualVal === 'undefined' || actualVal === 'null');

        if (!isVisible) return null;
    }

    let content = null;

    switch (node.type) {
        case 'container': {
             let finalData = fetchedData;
             if (node.props.filterParamField && node.props.filterParamName) {
                 const filterField = node.props.filterParamField;
                 const filterParam = node.props.filterParamName;
                 const filterVal = params[filterParam];
                 if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
                     finalData = fetchedData.filter(row => String(row[filterField]) === String(filterVal));
                 } else {
                     // Empty result if param not set
                     finalData = [];
                 }
             }

             // Wenn der Container Daten geladen hat, nimm den ersten Datensatz als Kontext
             const containerContext = (finalData && finalData.length > 0)
                 ? { ...context, ...finalData[0] }
                 : context;

             content = (
                  <div className={`w-full ${node.props.className || ''}`} style={node.props.style}>
                     {node.children?.map(c => <LiveNode key={c.id} node={c} context={containerContext} />)}
                  </div>
             );
             break;
        }

        case 'text': {
             const resolvedText = resolvePlaceholders(node.props.text || '', context, params);
             content = <div className={`w-full break-words ${node.props.className || ''}`} style={node.props.style}>{resolvedText}</div>;
             break;
        }

        case 'button': {
             const handleButtonClick = () => {
                 const actType = node.props.actionType;
                 if (!actType || actType === 'none') return;

                 if (actType === 'open_form' && node.props.formId) {
                     const mode = node.props.formMode || 'create';
                     const rId = mode === 'edit' ? params.selectedId : undefined;
                     
                     const defaultValues: Record<string, any> = {};
                     if (node.props.navigateTargetParams && Array.isArray(node.props.navigateTargetParams)) {
                         node.props.navigateTargetParams.forEach((m: any) => {
                             let val: any;
                             if (context && context[m.sourceKey] !== undefined) {
                                 val = context[m.sourceKey];
                             } else if (params[m.sourceKey] !== undefined) {
                                 val = params[m.sourceKey];
                             } else if (m.sourceKey === 'id' && context) {
                                 val = context.id;
                             }
                             
                             if (val !== undefined) {
                                 defaultValues[m.targetKey] = (val !== null && val !== '' && !isNaN(Number(val))) ? Number(val) : val;
                             }
                         });
                     }
                     
                     if (Object.keys(defaultValues).length === 0) {
                         Object.keys(params).forEach(key => {
                             const val = params[key];
                             defaultValues[key] = (val !== null && val !== '' && !isNaN(Number(val))) ? Number(val) : val;
                         });
                     }

                     openFormModal(node.props.formId, mode, rId, undefined, defaultValues);
                 } else if (actType === 'delete_record' && node.props.targetTableId) {
                     const tableId = node.props.targetTableId;
                     const paramName = node.props.paramKey || 'selectedId';
                     const idVal = params[paramName];
                     if (!idVal) return;

                     showConfirm(
                         'Datensatz löschen',
                         `Sind Sie sicher, dass Sie den Datensatz mit ID "${idVal}" löschen möchten?`,
                         () => {
                             const targetT = tables.find(t => t.id === tableId);
                             if (targetT && targetT.data) {
                                 // Find primary key
                                 const pkField = targetT.fields.find(f => f.isPrimaryKey) || targetT.fields[0];
                                 const updatedData = targetT.data.filter(row => String(row[pkField?.name || 'Id']) !== String(idVal));
                                 updateTable({ ...targetT, data: updatedData });
                             }
                         }
                     );
                 } else if (actType === 'set_parameter' && node.props.paramName) {
                     const pName = node.props.paramName;
                     const pValRaw = node.props.paramValue || '';
                     const pVal = resolvePlaceholders(pValRaw, context, params);
                     setParam(pName, pVal);
                 } else if (actType === 'navigate_to_page' && node.props.targetPageId) {
                     const mappings = node.props.navigateTargetParams || [];
                     const targetParams: Record<string, any> = {};
                     mappings.forEach((m: any) => {
                         if (m.sourceKey && m.targetKey) {
                             const resolvedVal = resolvePlaceholders(m.sourceKey, context, params);
                             targetParams[m.targetKey] = resolvedVal;
                         }
                     });
                     
                     // Fallback automatic mapping if no explicit mappings are defined
                     if (mappings.length === 0) {
                         if (params.selectedId) {
                             targetParams.selectedId = params.selectedId;
                             targetParams.id = params.selectedId;
                         }
                         // Also forward any direct matching params
                         const targetPage = pages.find(p => p.id === node.props.targetPageId);
                         const expected = targetPage?.expectedParams || [];
                         expected.forEach((pName: string) => {
                             if (params[pName] !== undefined) {
                                 targetParams[pName] = params[pName];
                             } else if (context && context[pName] !== undefined) {
                                 targetParams[pName] = context[pName];
                             }
                         });
                     }

                     navigate(node.props.targetPageId, targetParams);
                 }
             };

             content = (
                 <button 
                     onClick={handleButtonClick}
                     className={`px-4 py-2 bg-indigo-600 text-white rounded font-medium shadow-sm hover:bg-indigo-700 transition-colors m-2 ${node.props.className || ''}`} 
                     style={node.props.style}
                 >
                     {resolvePlaceholders(node.props.label || 'Button', context, params)}
                 </button>
             );
             break;
        }

        case 'dropdown':
             content = (
                  <div className={`p-2 ${node.props.className || ''}`}>
                      <select 
                          className="border border-slate-300 rounded px-3 py-2 bg-white w-full max-w-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                          style={node.props.style}
                          onChange={(e) => {
                              // If bound to dynamic field
                              if (node.props.valueField) {
                                  setParam('selectedId', e.target.value);
                              }
                          }}
                      >
                          <option value="">{node.props.placeholder || 'Bitte wählen...'}</option>
                          {loading && <option disabled>Lade Daten...</option>}
                          {!loading && fetchedData.map((row, idx) => {
                              const { val, label } = getRowLabelAndValue(row, node.props, idx);
                              return <option key={idx} value={val}>{label}</option>
                          })}
                      </select>
                  </div>
             );
             break;

        case 'table_view': {
             const columns = node.props.columns ? node.props.columns.split(',').map((c: string) => c.trim()) : [];
             let finalData = fetchedData;

             // Apply runtime parameter filter (Master-Detail matching)
             if (node.props.filterParamField && node.props.filterParamName) {
                 const filterField = node.props.filterParamField;
                 const filterParam = node.props.filterParamName;
                 const filterVal = params[filterParam];
                 if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
                     finalData = fetchedData.filter(row => String(row[filterField]) === String(filterVal));
                 } else {
                     // Empty filter parameter -> optionally show no data or all data. Let's show none to avoid confusion
                     finalData = [];
                 }
             }

             const displayData = columns.length > 0 ? finalData.map(row => {
                 const newRow: any = {};
                 columns.forEach((c: string) => newRow[c] = row[c]);
                 return { ...newRow, _raw: row }; // Keep original record in _raw
             }) : finalData.map(row => ({ ...row, _raw: row }));

             const tableId = node.props.dataSourceId;
             const targetTable = tables.find(t => t.id === tableId);
             const pkField = targetTable?.fields.find(f => f.isPrimaryKey) || targetTable?.fields[0];
             const pkFieldName = pkField?.name || 'Id';

             const allColumns = columns.length > 0 ? columns : (targetTable ? targetTable.fields.map(f => f.name) : []);

             const handleRowClick = (row: any) => {
                 if (node.props.enableSelection) {
                     const paramKey = node.props.selectionParamName || 'selectedId';
                     const idVal = row._raw[pkFieldName];
                     if (node.props.detailsPageId) {
                         navigate(node.props.detailsPageId, { [paramKey]: idVal });
                     } else {
                         setParam(paramKey, idVal);
                     }
                 }
             };

             content = (
                  <div className={`p-4 w-full bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden ${node.props.className || ''}`} style={node.props.style}>
                       {/* Table Header Controls */}
                       <div className="flex items-center justify-between mb-4">
                           <div className="text-sm font-semibold text-slate-700">
                               {targetTable?.name || 'Tabelle'} {node.props.filterParamField && `(Gefiltert nach ${node.props.filterParamField})`}
                           </div>
                           {node.props.enableCrudActions && node.props.createFormId && (
                               <button 
                                   onClick={() => openFormModal(node.props.createFormId, 'create')}
                                   className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-3 rounded shadow-sm transition"
                               >
                                   <Plus size={13} /> Neu hinzufügen
                               </button>
                           )}
                       </div>

                       {loading ? (
                           <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>
                       ) : (
                           <div className="overflow-x-auto border border-slate-100 rounded-lg">
                               <table className="min-w-full divide-y divide-slate-200">
                                   <thead className="bg-slate-50">
                                       <tr>
                                           {allColumns.length > 0 ? allColumns.map(k => (
                                               <th key={k} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{k}</th>
                                           )) : <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Keine Einträge</th>}
                                           {node.props.enableCrudActions && <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktionen</th>}
                                       </tr>
                                   </thead>
                                   <tbody className="bg-white divide-y divide-slate-100">
                                       {displayData.length > 0 ? displayData.map((row, idx) => {
                                           const isSelected = String(row._raw[pkFieldName]) === String(params[node.props.selectionParamName || 'selectedId']);
                                           return (
                                               <tr 
                                                   key={idx} 
                                                   onClick={() => handleRowClick(row)}
                                                   className={`hover:bg-slate-50 transition cursor-pointer ${isSelected ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : ''}`}
                                               >
                                                   {Object.keys(row).filter(k => k !== '_raw').map((key, vIdx) => (
                                                       <td key={vIdx} className="px-3 py-2 whitespace-nowrap text-sm text-slate-600 font-medium">
                                                           {String(row[key] ?? '')}
                                                       </td>
                                                   ))}
                                                   
                                                   {node.props.enableCrudActions && (
                                                       <td className="px-3 py-1.5 whitespace-nowrap text-sm text-right font-medium space-x-1" onClick={e => e.stopPropagation()}>
                                                           <button 
                                                               onClick={() => {
                                                                   const rowId = row._raw[pkFieldName];
                                                                   const selectionKey = node.props.selectionParamName || 'selectedId';
                                                                   if (node.props.detailsPageId) {
                                                                       navigate(node.props.detailsPageId, { [selectionKey]: rowId });
                                                                   } else {
                                                                       setParam(selectionKey, rowId);
                                                                   }
                                                               }}
                                                               className="text-xs text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50 transition"
                                                               title="Details anzeigen"
                                                           >
                                                               Details
                                                           </button>
                                                           {node.props.editFormId && (
                                                               <button 
                                                                   onClick={() => {
                                                                       const rowId = row._raw[pkFieldName];
                                                                       openFormModal(node.props.editFormId, 'edit', rowId);
                                                                   }}
                                                                   className="text-xs text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-100 transition"
                                                                   title="Datensatz bearbeiten"
                                                               >
                                                                   Bearbeiten
                                                               </button>
                                                           )}
                                                           <button 
                                                               onClick={() => {
                                                                   const rowId = row._raw[pkFieldName];
                                                                   showConfirm(
                                                                       'Datensatz löschen',
                                                                       'Möchten Sie diesen Datensatz wirklich löschen?',
                                                                       () => {
                                                                           if (targetTable && targetTable.data) {
                                                                               const filtered = targetTable.data.filter(r => String(r[pkFieldName]) !== String(rowId));
                                                                               updateTable({ ...targetTable, data: filtered });
                                                                           }
                                                                       }
                                                                   );
                                                               }}
                                                               className="text-xs text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                                                               title="Löschen"
                                                           >
                                                               Löschen
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                       }) : (
                                            <tr>
                                                <td colSpan={allColumns.length + (node.props.enableCrudActions ? 1 : 0) || 1} className="px-3 py-8 text-center text-xs text-slate-400 italic">
                                                    Keine Daten verfügbar
                                                </td>
                                            </tr>
                                       )}
                                   </tbody>
                               </table>
                           </div>
                       )}
                  </div>
             );
             break;
        }

        case 'list_repeater': {
             let finalData = fetchedData;
             if (node.props.filterParamField && node.props.filterParamName) {
                 const filterField = node.props.filterParamField;
                 const filterParam = node.props.filterParamName;
                 const filterVal = params[filterParam];
                 if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
                     finalData = fetchedData.filter(row => String(row[filterField]) === String(filterVal));
                 } else {
                     finalData = [];
                 }
             }

             content = (
                  <div className={`w-full space-y-3 ${node.props.className || ''}`} style={node.props.style}>
                      {loading ? (
                          <div className="flex items-center justify-center p-4"><Loader2 className="animate-spin text-indigo-500" /></div>
                      ) : (
                          finalData.map((row, idx) => (
                              <div key={idx} className="bg-slate-50/50 p-4 rounded-lg border border-slate-150 relative hover:border-slate-300 hover:bg-slate-50 transition">
                                  {node.children?.map(c => <LiveNode key={c.id} node={c} context={row} />)}
                              </div>
                          ))
                      )}
                      {!loading && finalData.length === 0 && (
                          <div className="text-center p-4 text-xs text-slate-400 italic">Keine Einträge für Repeater</div>
                      )}
                  </div>
             );
             break;
        }

        case 'subpage_container': {
             const subPage = pages?.find(p => p.id === node.props.subPageId);
             if (!subPage) {
                 content = (
                     <div className="p-4 bg-yellow-50 text-yellow-700 text-xs border border-yellow-200 rounded flex items-center gap-2">
                         <AlertCircle size={14} /> Keine Unterseite konfiguriert oder gefunden
                     </div>
                 );
                 break;
             }

             // Map parent params to child params based on parameterMappings
             const mappedParams: Record<string, any> = {};
             
             // 1. Automatic Parameter takeover for expected child parameters
             const expected = subPage.expectedParams || [];
             expected.forEach((paramName: string) => {
                 if (params[paramName] !== undefined && params[paramName] !== null) {
                     mappedParams[paramName] = params[paramName];
                 } else if (context && context[paramName] !== undefined && context[paramName] !== null) {
                     mappedParams[paramName] = context[paramName];
                 }
             });

             // 2. Explicit mappings configured by the developer
             const mappings = node.props.parameterMappings || [];
             for (const mapping of mappings) {
                 if (mapping.sourceKey && mapping.targetKey) {
                     // Check if source key is a placeholder or direct value
                     const resolvedVal = mapping.sourceKey.startsWith('{{') && mapping.sourceKey.endsWith('}}')
                         ? resolvePlaceholders(mapping.sourceKey, context, params)
                         : params[mapping.sourceKey] !== undefined ? params[mapping.sourceKey] : mapping.sourceKey;
                     mappedParams[mapping.targetKey] = resolvedVal;
                 }
             }

             content = (
                 <div className="w-full bg-slate-50/20 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg p-3 transition relative group">
                     {/* Debug indicator badge for active parameters */}
                     <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition duration-150 flex gap-1 pointer-events-none select-none">
                         <span className="text-[8px] bg-slate-800 text-slate-300 font-mono font-bold px-1 py-0.5 rounded shadow-sm">
                             sub-page: {subPage.name}
                         </span>
                         {Object.keys(mappedParams).length > 0 && (
                             <span className="text-[8px] bg-emerald-100 text-emerald-800 font-mono font-bold px-1 py-0.5 rounded shadow-sm">
                                 params: {Object.keys(mappedParams).join(', ')}
                             </span>
                         )}
                     </div>
                     <PageParamsContext.Provider value={{ params: mappedParams, setParam: (k, v) => setParam(k, v) }}>
                         <LiveNode node={subPage.layout} context={context} />
                     </PageParamsContext.Provider>
                 </div>
             );
             break;
        }

        case 'form_view': {
             const formToRender = forms.find(f => f.id === node.props.formId);
             if (!formToRender) {
                 content = <div className="p-4 text-xs text-slate-500 italic bg-slate-50 border border-dashed rounded">Kein Formular ausgewählt</div>;
                 break;
             }

             // Handle filtering and pre-filling
             let formFilteredData = [];
             let hasFilter = false;
             let defaultValues: any = {};

             if (node.props.filterParamField && node.props.filterParamName) {
                 const filterField = node.props.filterParamField;
                 const filterVal = params[node.props.filterParamName];
                 
                 // Always set default value for pre-filling if available
                 if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
                     // Try to cast to number if it looks like one, to match IDs
                     defaultValues[filterField] = isNaN(Number(filterVal)) ? filterVal : Number(filterVal);
                 }

                 if (node.props.formMode !== 'create') {
                     hasFilter = true;
                     const targetTable = tables.find(t => t.id === formToRender.sourceId);
                     if (targetTable && targetTable.data && filterVal !== undefined && filterVal !== null && filterVal !== '') {
                         formFilteredData = targetTable.data.filter(row => String(row[filterField]) === String(filterVal));
                     }
                 }
             }

             content = (
                 <div className={`w-full ${node.props.className || ''}`} style={node.props.style}>
                     <FormView 
                         form={formToRender}
                         allForms={forms}
                         allTables={tables}
                         onTableChange={updateTable}
                         showConfirmation={(title, message, onConfirm) => {
                             if(window.confirm(`${title}\n${message}`)) onConfirm();
                         }}
                         isSubform={hasFilter} 
                         filteredData={formFilteredData}
                         defaultValues={defaultValues}
                         initialMode={node.props.formMode || 'edit'}
                         hideNavigation={node.props.hideNavigation}
                         hideActions={node.props.hideActions}
                         hideHeader={node.props.hideHeader}
                         embedded={true}
                     />
                 </div>
             );
             break;
        }

        case 'chart_view':
        case 'image':
        case 'html':
        case 'divider':
             content = <div className={`p-4 m-2 bg-slate-100 rounded border flex items-center justify-center border-slate-200 text-center text-sm text-slate-500 ${node.props.className || ''}`}>{node.type} Not Fully Implemented Live</div>;
             break;
    }

    return content;
};

export const PageView: React.FC<PageViewProps> = ({ page, onSetView }) => {
  const { pages, tables, forms, updateTable } = useProjectStore();
  const [currentPage, setCurrentPage] = useState<CustomPage>(page);
  const [pageParams, setPageParams] = useState<Record<string, any>>({});

  // Navigation within the player
  useEffect(() => {
      setCurrentPage(page);
  }, [page]);

  // Modal forms manager
  const [activeFormModal, setActiveFormModal] = useState<{
      isOpen: boolean;
      formId: string;
      mode: 'create' | 'edit';
      recordId?: any;
      callback?: () => void;
      defaultValues?: Record<string, any>;
  } | null>(null);

  // Custom Confirmation modal
  const [activeConfirm, setActiveConfirm] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      onConfirm: () => void;
  } | null>(null);

  const handleSetParam = (key: string, value: any) => {
      setPageParams(prev => ({ ...prev, [key]: value }));
  };

  const handleOpenFormModal = (formId: string, mode: 'create' | 'edit', recordId?: any, callback?: () => void, defaultValues?: Record<string, any>) => {
      setActiveFormModal({
          isOpen: true,
          formId,
          mode,
          recordId,
          callback,
          defaultValues
      });
  };

  const handleShowConfirm = (title: string, message: string, onConfirm: () => void) => {
      setActiveConfirm({
          isOpen: true,
          title,
          message,
          onConfirm: () => {
              onConfirm();
              setActiveConfirm(null);
          }
      });
  };

  const handleNavigate = (pageId: string, initialParams?: Record<string, any>) => {
      const targetP = pages.find(p => p.id === pageId);
      if (targetP) {
          if (initialParams) {
              setPageParams(initialParams);
          } else {
              setPageParams({});
          }
          setCurrentPage(targetP);
      }
  };

  const handleTableChange = (updatedT: Table) => {
      updateTable(updatedT);
      // If modal was active, trigger save callbacks or auto close
      if (activeFormModal?.callback) {
          activeFormModal.callback();
      }
      setActiveFormModal(null);
  };

  // Find form configuration for modal
  const modalForm = activeFormModal ? forms.find(f => f.id === activeFormModal.formId) : null;
  const targetTable = modalForm ? tables.find(t => t.id === modalForm.sourceId) : null;

  // Let's populate the correct row state inside FormView if we edit.
  // Wait, FormView loads the active record using "currentIndex" of data inside its own state.
  // To let FormView edit a specific recordId, we can filter or structure it beautifully.
  // Let's create a custom filteredData of 1 item containing ONLY the record to edit,
  // or let FormView edit normally. If we supply `filteredData` with only the row matching the ID,
  // FormView will automatically edit ONLY that row! This is a master stroke of code reuse!
  let modalFilteredData: any[] | undefined = undefined;
  if (activeFormModal?.mode === 'edit' && targetTable && activeFormModal.recordId) {
      const pkField = targetTable.fields.find(f => f.isPrimaryKey) || targetTable.fields[0];
      const matchCol = pkField?.name || 'Id';
      const recordToEdit = targetTable.data?.find(r => String(r[matchCol]) === String(activeFormModal.recordId));
      if (recordToEdit) {
          modalFilteredData = [recordToEdit];
      }
  }

  const [activeRole, setActiveRole] = useState<string>('Admin');

  // Load roles to select from
  const rolesTable = tables.find(t => t.name === 'sys_roles');
  const availableRoles = rolesTable && rolesTable.data && rolesTable.data.length > 0
    ? rolesTable.data.map((r: any) => r.Name || String(r.Id))
    : ['Admin', 'Manager', 'Editor', 'User', 'Guest'];

  return (
    <PageParamsContext.Provider value={{ params: pageParams, setParam: handleSetParam }}>
      <PageViewContext.Provider value={{ 
          openFormModal: handleOpenFormModal, 
          showConfirm: handleShowConfirm, 
          navigate: handleNavigate,
          activeRole
      }}>
        <div className="flex flex-col h-full bg-slate-50 font-sans overflow-auto relative">
          
          {/* Interactive Simulation Sandbox Bar */}
          <div className="bg-slate-900 text-slate-100 px-6 py-2.5 flex flex-wrap items-center justify-between border-b border-slate-800 text-xs shadow-sm z-30 select-none">
              <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold tracking-wider text-slate-300 uppercase text-[10px]">Simulation &amp; Sandbox</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">Aktive Seite: <strong className="text-white font-mono">{currentPage.name}</strong></span>
              </div>
              
              <div className="flex items-center gap-4">
                  {/* Active Parameters List */}
                  <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Parameter:</span>
                      {Object.keys(pageParams).length === 0 ? (
                          <span className="text-slate-500 italic font-mono text-[10px]">keine</span>
                      ) : (
                          <div className="flex gap-1">
                              {Object.entries(pageParams).map(([k, v]) => (
                                  <span key={k} className="bg-slate-800 border border-slate-700 text-emerald-400 font-mono text-[9px] px-1.5 py-0.5 rounded shadow-sm">
                                      {k}={String(v)}
                                  </span>
                              ))}
                          </div>
                      )}
                  </div>

                  <span className="text-slate-700">|</span>

                  {/* Active Simulation Role Dropdown (Userlevels) */}
                  <div className="flex items-center gap-1.5">
                      <label className="text-slate-300 font-medium">Test-Rolle:</label>
                      <select
                          value={activeRole}
                          onChange={(e) => setActiveRole(e.target.value)}
                          className="bg-slate-850 text-slate-100 border border-slate-700 rounded px-2 py-0.5 text-[11px] focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                      >
                          {availableRoles.map(role => (
                              <option key={role} value={role}>{role}</option>
                          ))}
                      </select>
                  </div>

                  {/* Reset Params Button */}
                  <button
                      onClick={() => setPageParams({})}
                      className="bg-slate-800 hover:bg-slate-700 active:bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1"
                      title="Parameter zurücksetzen"
                  >
                      Reset
                  </button>
              </div>
          </div>

          <div className="flex-1 p-8 overflow-auto relative">
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                 <button onClick={() => onSetView({ type: 'page_designer', pageId: page.id })} className="px-3 py-1 bg-white border border-slate-300 shadow-sm rounded text-xs font-semibold hover:bg-slate-50 transition">Zurück zum Designer</button>
              </div>
              <div className="max-w-[95%] mx-auto w-full bg-white shadow-md border border-slate-200 rounded-xl min-h-[800px] p-8 relative">
                  {currentPage.layout ? (
                      <LiveNode node={currentPage.layout} />
                  ) : (
                      <div className="text-center py-20 text-slate-400">Kein Layout für diese Seite gefunden.</div>
                  )}
              </div>
          </div>

          {/* Interactive Form Modal */}
          {activeFormModal && modalForm && (
              <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                          <h3 className="text-sm font-bold text-slate-800">
                              {activeFormModal.mode === 'create' ? 'Neuen Datensatz anlegen' : 'Datensatz bearbeiten'} - {modalForm.name}
                          </h3>
                          <button onClick={() => setActiveFormModal(null)} className="text-slate-400 hover:text-slate-600 transition">
                              <X size={18} />
                          </button>
                      </div>
                      <div className="p-6 overflow-y-auto flex-1">
                          <FormView 
                              form={{
                                  ...modalForm,
                                  mode: 'write' // force write mode inside the modal
                              }}
                              allForms={forms}
                              allTables={tables}
                              onTableChange={handleTableChange}
                              showConfirmation={(t, m, c) => handleShowConfirm(t, m, c)}
                              isSubform={activeFormModal.mode === 'edit'} // if editing, we treat it as bound to our custom filteredData list
                              filteredData={modalFilteredData}
                              defaultValues={{
                                  ...Object.keys(pageParams).reduce((acc, key) => {
                                      const val = pageParams[key];
                                      acc[key] = (val !== null && val !== '' && !isNaN(Number(val))) ? Number(val) : val;
                                      return acc;
                                  }, {} as any),
                                  ...(activeFormModal.defaultValues || {})
                              }}
                              onClose={() => setActiveFormModal(null)}
                              initialMode={activeFormModal.mode}
                              hideNavigation={true}
                              hideActions={true}
                          />
                      </div>
                  </div>
              </div>
          )}

          {/* Custom Confirmation Modal */}
          {activeConfirm && (
              <div className="fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
                      <div className="flex gap-3">
                          <div className="p-2 bg-red-50 text-red-600 rounded-full h-10 w-10 flex items-center justify-center">
                              <AlertCircle size={20} />
                          </div>
                          <div>
                              <h4 className="font-bold text-slate-800 text-base">{activeConfirm.title}</h4>
                              <p className="text-xs text-slate-500 mt-1">{activeConfirm.message}</p>
                          </div>
                      </div>
                      <div className="flex justify-end gap-2.5">
                          <button 
                              onClick={() => setActiveConfirm(null)} 
                              className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold rounded text-xs transition"
                          >
                              Abbrechen
                          </button>
                          <button 
                              onClick={activeConfirm.onConfirm} 
                              className="px-3.5 py-1.5 bg-red-600 text-white hover:bg-red-700 font-semibold rounded text-xs transition shadow-sm"
                          >
                              Löschen
                          </button>
                      </div>
                  </div>
              </div>
          )}
        </div>
      </PageViewContext.Provider>
    </PageParamsContext.Provider>
  );
};