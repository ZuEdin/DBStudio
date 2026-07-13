import React, { useState, useEffect, useContext } from 'react';
import { PageComponent } from '../../../types/index';
import { useProjectStore } from '../../../stores/useProjectStore';
import { executeSelectQuery } from '../../queries/utils/queryExecution';
import { LiveTable } from './LiveTable';
import { LiveForm } from './LiveForm';
import { CustomTableViewRunner } from './CustomTableViewRunner';
import { 
    PageParamsContext, 
    PageViewContext, 
    getNestedValueCaseInsensitive, 
    resolvePlaceholders, 
    getRowLabelAndValue 
} from '../utils/pageViewUtils';
import { Loader2, AlertCircle, TrendingUp, Users, DollarSign, Activity, Calendar, Percent, Award, ShoppingCart, Layers } from 'lucide-react';

interface LiveNodeProps {
    node: PageComponent;
    context?: Record<string, any>;
}

export const LiveNode: React.FC<LiveNodeProps> = ({ node, context }) => {
    const { queries, tables, relationships, pages, forms, updateTable, customComponents = [] } = useProjectStore();
    const { params, setParam } = useContext(PageParamsContext);
    const { openFormModal, showConfirm, navigate, activeRole } = useContext(PageViewContext);
    
    // Role-Based Visibility Check
    if (node.props.allowedRoles && node.props.allowedRoles.length > 0) {
        if (!activeRole || !node.props.allowedRoles.includes(activeRole)) {
            return null;
        }
    }

    const [fetchedData, setFetchedData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Load data binding or query records
    useEffect(() => {
        if (node.type === 'dropdown' && node.props.queryId) {
            setLoading(true);
            const query = queries.find(q => q.id === node.props.queryId);
            if (query && query.type === 'SELECT') {
                const data = executeSelectQuery(query as any, tables, relationships);
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
                    if (query && query.type === 'SELECT') {
                        const data = executeSelectQuery(query as any, tables, relationships);
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
                    if (query && query.type === 'SELECT') {
                        const data = executeSelectQuery(query as any, tables, relationships);
                        setFetchedData(data);
                    }
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        } else if (node.type === 'custom_component' && node.props.customComponentId) {
            setLoading(true);
            try {
                const comp = customComponents.find(c => c.id === node.props.customComponentId);
                if (comp) {
                    const conf = comp.configuration || {};
                    const dsType = conf.dataSourceType || (conf.tableId ? 'table' : '');
                    const dsId = conf.dataSourceId || conf.tableId;
                    if (dsType === 'table' && dsId) {
                        const table = tables.find(t => t.id === dsId);
                        if (table) setFetchedData(table.data || []);
                    } else if (dsType === 'query' && dsId) {
                        const query = queries.find(q => q.id === dsId);
                        if (query && query.type === 'SELECT') {
                            const data = executeSelectQuery(query as any, tables, relationships);
                            setFetchedData(data);
                        }
                    }
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        }
    }, [node.type, node.props.queryId, node.props.dataSourceType, node.props.dataSourceId, node.props.customComponentId, queries, tables, relationships, customComponents]);

    // Handle conditional visibility (ngIf)
    if (node.props.visibilityField) {
        const vField = node.props.visibilityField;
        const vOperator = node.props.visibilityOperator || '==';
        const vExpected = node.props.visibilityValue || '';

        // Check in loop context first, then fallback to parameters
        let actualVal = '';
        const contextVal = context ? getNestedValueCaseInsensitive(context, vField) : undefined;
        if (contextVal !== undefined) {
            actualVal = String(contextVal);
        } else {
            const paramVal = params ? getNestedValueCaseInsensitive(params, vField) : undefined;
            if (paramVal !== undefined) {
                actualVal = String(paramVal);
            }
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
        case 'row': {
             content = (
                  <div className={`w-full flex flex-row ${node.props.gap ? `gap-${node.props.gap}` : 'gap-4'} ${node.props.wrap ? 'flex-wrap' : ''} ${node.props.alignItems ? `items-${node.props.alignItems}` : 'items-start'} ${node.props.justifyContent ? `justify-${node.props.justifyContent}` : 'justify-start'} ${node.props.className || ''}`} style={node.props.style}>
                     {node.children?.map(c => <LiveNode key={c.id} node={c} context={context} />)}
                  </div>
             );
             break;
        }
        case 'column': {
             content = (
                  <div className={`flex flex-col ${node.props.gap ? `gap-${node.props.gap}` : 'gap-4'} ${node.props.alignItems ? `items-${node.props.alignItems}` : 'items-stretch'} ${node.props.justifyContent ? `justify-${node.props.justifyContent}` : 'justify-start'} ${node.props.className || ''}`} style={{ flex: node.props.flex || '1 1 0%', ...node.props.style }}>
                     {node.children?.map(c => <LiveNode key={c.id} node={c} context={context} />)}
                  </div>
             );
             break;
        }
        case 'card': {
             content = (
                  <div className={`bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden ${node.props.className || ''}`} style={node.props.style}>
                       {node.props.title && (
                           <div className={`px-4 py-3 border-b border-slate-200 bg-slate-50 font-medium text-slate-800 ${node.props.headerClassName || ''}`}>
                               {resolvePlaceholders(node.props.title, context, params)}
                           </div>
                       )}
                       <div className={`p-4 ${node.props.bodyClassName || ''}`}>
                          {node.children?.map(c => <LiveNode key={c.id} node={c} context={context} />)}
                       </div>
                  </div>
             );
             break;
        }
        case 'container': {
             let finalData = fetchedData;
             if (node.props.filterParamField && node.props.filterParamName) {
                 const filterField = node.props.filterParamField;
                 const filterParam = node.props.filterParamName;
                 const filterVal = params[filterParam];
                 if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
                     finalData = fetchedData.filter(row => String(getNestedValueCaseInsensitive(row, filterField) ?? '') === String(filterVal));
                 } else {
                     finalData = [];
                 }
             }

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
             const handleButtonClick = (e: React.MouseEvent) => {
                 e.stopPropagation();
                 const actType = node.props.actionType;
                 console.log('Button clicked!', { actType, props: node.props, params, context });
                 if (!actType || actType === 'none') return;

                 if (actType === 'open_form' && node.props.formId) {
                     const mode = node.props.formMode || 'create';
                     const rId = mode === 'edit' ? params.selectedId : undefined;
                     
                     const defaultValues: Record<string, any> = {};
                     if (node.props.navigateTargetParams && Array.isArray(node.props.navigateTargetParams)) {
                         node.props.navigateTargetParams.forEach((m: any) => {
                             let val: any;
                             const sourceVal = context ? getNestedValueCaseInsensitive(context, m.sourceKey) : undefined;
                             if (sourceVal !== undefined) {
                                 val = sourceVal;
                             } else if (params[m.sourceKey] !== undefined) {
                                 val = params[m.sourceKey];
                             } else if (m.sourceKey === 'id' && context) {
                                 val = context.id;
                             } else {
                                 val = m.sourceKey;
                             }
                             
                             if (val !== undefined && val !== '') {
                                 defaultValues[m.targetKey] = (val !== null && !isNaN(Number(val))) ? Number(val) : val;
                             }
                         });
                     }
                     
                     if (Object.keys(defaultValues).length === 0) {
                         Object.keys(params).forEach(key => {
                             const val = params[key];
                             defaultValues[key] = (val !== null && val !== '' && !isNaN(Number(val))) ? Number(val) : val;
                         });
                     }

                     console.log('Opening modal', { formId: node.props.formId, mode, rId, defaultValues });
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
                     
                     if (mappings.length === 0) {
                         if (params.selectedId) {
                             targetParams.selectedId = params.selectedId;
                             targetParams.id = params.selectedId;
                         }
                         const targetPage = pages.find(p => p.id === node.props.targetPageId);
                         const expected = targetPage?.expectedParams || [];
                         expected.forEach((pName: string) => {
                             const paramVal = params ? getNestedValueCaseInsensitive(params, pName) : undefined;
                             if (paramVal !== undefined) {
                                 targetParams[pName] = paramVal;
                             } else if (context) {
                                 const contextVal = getNestedValueCaseInsensitive(context, pName);
                                 if (contextVal !== undefined) {
                                     targetParams[pName] = contextVal;
                                 }
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

        case 'dropdown': {
             let finalData = fetchedData;
             if (node.props.filterParamField && node.props.filterParamName) {
                 const filterField = node.props.filterParamField;
                 const filterParam = node.props.filterParamName;
                 const filterVal = params[filterParam];
                 if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
                     finalData = fetchedData.filter(row => String(getNestedValueCaseInsensitive(row, filterField) ?? '') === String(filterVal));
                 } else {
                     finalData = [];
                 }
             }

             content = (
                  <div className={`p-2 ${node.props.className || ''}`}>
                      <select 
                          className="border border-slate-300 rounded px-3 py-2 bg-white w-full max-w-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                          style={node.props.style}
                          onChange={(e) => {
                              if (node.props.valueField) {
                                  setParam('selectedId', e.target.value);
                              }
                          }}
                      >
                          <option value="">{node.props.placeholder || 'Bitte wählen...'}</option>
                          {loading && <option disabled>Lade Daten...</option>}
                          {!loading && finalData.map((row, idx) => {
                              const { val, label } = getRowLabelAndValue(row, node.props, idx);
                              return <option key={idx} value={val}>{label}</option>
                          })}
                      </select>
                  </div>
             );
             break;
        }

        case 'table_view': {
             content = <LiveTable node={node} context={context} fetchedData={fetchedData} loading={loading} />;
             break;
        }

        case 'list_repeater': {
             let finalData = fetchedData;
             if (node.props.filterParamField && node.props.filterParamName) {
                 const filterField = node.props.filterParamField;
                 const filterParam = node.props.filterParamName;
                 const filterVal = params[filterParam];
                 if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
                     finalData = fetchedData.filter(row => String(getNestedValueCaseInsensitive(row, filterField) ?? '') === String(filterVal));
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

             const mappedParams: Record<string, any> = {};
             
             // 1. Automatic Parameter takeover
             const expected = subPage.expectedParams || [];
             expected.forEach((paramName: string) => {
                 const paramVal = params ? getNestedValueCaseInsensitive(params, paramName) : undefined;
                 if (paramVal !== undefined && paramVal !== null) {
                     mappedParams[paramName] = paramVal;
                 } else if (context) {
                     const contextVal = getNestedValueCaseInsensitive(context, paramName);
                     if (contextVal !== undefined && contextVal !== null) {
                         mappedParams[paramName] = contextVal;
                     }
                 }
             });

             // 2. Explicit mappings
             const mappings = node.props.parameterMappings || [];
             for (const mapping of mappings) {
                 if (mapping.sourceKey && mapping.targetKey) {
                     const resolvedVal = mapping.sourceKey.startsWith('{{') && mapping.sourceKey.endsWith('}}')
                         ? resolvePlaceholders(mapping.sourceKey, context, params)
                         : params[mapping.sourceKey] !== undefined ? params[mapping.sourceKey] : mapping.sourceKey;
                     mappedParams[mapping.targetKey] = resolvedVal;
                 }
             }

             content = (
                 <div className="w-full bg-slate-50/20 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg p-3 transition relative group">
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

        case 'custom_component': {
             const comp = customComponents.find(c => c.id === node.props.customComponentId);
             if (!comp) {
                 content = (
                     <div className="p-3 bg-amber-50 text-amber-700 text-xs border border-amber-200 rounded italic text-center">
                         Custom Component nicht verknüpft oder nicht gefunden
                     </div>
                 );
             } else {
                 content = (
                     <CustomComponentRunner 
                         comp={comp}
                         node={node}
                         context={context}
                         params={params}
                         setParam={setParam}
                         navigate={navigate}
                         fetchedData={fetchedData}
                         loading={loading}
                     />
                 );
             }
             break;
        }

        case 'form_view': {
             content = <LiveForm node={node} context={context} />;
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

// --- EXTRA HELPER FOR SDUI CUSTOM COMPONENTS RUNTIME EXECUTION ---
interface CustomComponentRunnerProps {
    comp: any;
    node: PageComponent;
    context: any;
    params: any;
    setParam: (k: string, v: any) => void;
    navigate: (pageId: string, initialParams?: Record<string, any>) => void;
    fetchedData: any[];
    loading: boolean;
}

const CustomComponentRunner: React.FC<CustomComponentRunnerProps> = ({ 
    comp, node, context, params, setParam, navigate, fetchedData, loading 
}) => {
    const { forms } = useProjectStore();
    const conf = comp.configuration || {};

    switch (comp.type) {
        case 'table_view': {
            return (
                <CustomTableViewRunner
                    comp={comp}
                    node={node}
                    context={context}
                    params={params}
                    setParam={setParam}
                    navigate={navigate}
                    fetchedData={fetchedData}
                    loading={loading}
                />
            );
        }

        case 'form_view': {
            const formNode = {
                id: node.id + '_form',
                type: 'form_view' as const,
                props: {
                    formId: conf.formId,
                    hideHeader: conf.hideHeader,
                    hideActions: conf.hideActions
                }
            };
            return <LiveForm node={formNode} context={context} />;
        }

        case 'text': {
            const txtSize = conf.fontSize || 'text-base';
            const txtWeight = conf.fontWeight || 'font-normal';
            const txtColor = conf.colorClass || 'text-slate-700';
            const txtAlign = conf.alignment || 'text-left';
            return (
                <div className={`w-full ${txtSize} ${txtWeight} ${txtColor} ${txtAlign} p-2`}>
                    {resolvePlaceholders(conf.text || '', context, params)}
                </div>
            );
        }

        case 'button': {
            const handleButtonClick = () => {
                if (conf.actionType === 'navigate' && conf.targetPageId) {
                    navigate(conf.targetPageId);
                } else if (conf.actionType === 'setParam' && conf.targetParamKey) {
                    setParam(conf.targetParamKey, conf.targetParamVal);
                }
            };
            return (
                <button 
                    onClick={handleButtonClick}
                    className={`px-4 py-2 bg-indigo-600 text-white rounded font-medium shadow-sm hover:bg-indigo-700 transition-colors m-2 ${
                        conf.variant === 'secondary' ? 'bg-slate-100 text-slate-700 border hover:bg-slate-200' :
                        conf.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                        conf.variant === 'outline' ? 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50' : ''
                    }`}
                >
                    {conf.label || 'Aktions-Button'}
                </button>
            );
        }

        case 'dropdown': {
            return (
                <div className="p-2 w-full">
                    {conf.label && <label className="block text-xs font-semibold text-slate-600 mb-1">{conf.label}</label>}
                    <select 
                        className="border border-slate-300 rounded px-3 py-2 bg-white w-full max-w-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                        onChange={(e) => {
                            if (conf.valueField) {
                                setParam('selectedId', e.target.value);
                            }
                        }}
                    >
                        <option value="">{conf.placeholder || '-- Bitte wählen --'}</option>
                        {fetchedData.map((row, idx) => {
                            const val = getNestedValueCaseInsensitive(row, conf.valueField || 'id');
                            const lbl = getNestedValueCaseInsensitive(row, conf.displayField || 'Name');
                            return <option key={idx} value={val}>{lbl}</option>
                        })}
                    </select>
                </div>
            );
        }

        case 'metric_card': {
            const theme = conf.themeColor || 'indigo';
            const themeClasses: Record<string, string> = {
                indigo: 'bg-indigo-50/40 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400',
                emerald: 'bg-emerald-50/40 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400',
                rose: 'bg-rose-50/40 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400',
                sky: 'bg-sky-50/40 border-sky-100 text-sky-700 dark:bg-sky-950/20 dark:border-sky-900/40 dark:text-sky-400',
                amber: 'bg-amber-50/40 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400',
                slate: 'bg-slate-50/40 border-slate-200 text-slate-700 dark:bg-slate-900/30 dark:border-slate-800 dark:text-slate-400'
            };

            const iconBgClasses: Record<string, string> = {
                indigo: 'bg-indigo-100 dark:bg-indigo-900/40',
                emerald: 'bg-emerald-100 dark:bg-emerald-900/40',
                rose: 'bg-rose-100 dark:bg-rose-900/40',
                sky: 'bg-sky-100 dark:bg-sky-900/40',
                amber: 'bg-amber-100 dark:bg-amber-900/40',
                slate: 'bg-slate-200 dark:bg-slate-800'
            };

            const IconDict: Record<string, any> = {
                TrendingUp, Users, DollarSign, Activity, Calendar, Percent, Award, ShoppingCart
            };
            const MetricIcon = IconDict[conf.iconName || 'TrendingUp'] || TrendingUp;

            // Runtime calculation on fetchedData
            const getComputedVal = () => {
                if (conf.aggType === 'custom') return conf.customValue || '0';
                if (!fetchedData || fetchedData.length === 0) return '0';
                if (conf.aggType === 'count') return fetchedData.length.toString();

                const f = conf.aggField;
                if (!f) return '0';

                const numbers = fetchedData.map(r => Number(getNestedValueCaseInsensitive(r, f))).filter(val => !isNaN(val));
                if (numbers.length === 0) return '0,00';

                let res = 0;
                if (conf.aggType === 'sum') {
                    res = numbers.reduce((a, b) => a + b, 0);
                } else if (conf.aggType === 'avg') {
                    res = numbers.reduce((a, b) => a + b, 0) / numbers.length;
                } else if (conf.aggType === 'min') {
                    res = Math.min(...numbers);
                } else if (conf.aggType === 'max') {
                    res = Math.max(...numbers);
                }

                return res.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };

            if (loading) {
                return (
                    <div className="p-4 w-full flex justify-center">
                        <div className="w-full max-w-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 animate-pulse rounded-2xl p-5 h-28"></div>
                    </div>
                );
            }

            return (
                <div className="p-4 w-full flex justify-center">
                    <div className={`w-full max-w-sm border-2 p-5 rounded-2xl shadow-sm ${themeClasses[theme] || themeClasses.indigo}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    {conf.title || 'Kennzahl'}
                                </p>
                                <h4 className="text-3xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white font-sans">
                                    {conf.prefix || ''}{getComputedVal()}{conf.suffix || ''}
                                </h4>
                            </div>
                            <div className={`p-2.5 rounded-xl ${iconBgClasses[theme] || iconBgClasses.indigo}`}>
                                <MetricIcon size={18} className={themeClasses[theme]?.split(' ')[2]} />
                            </div>
                        </div>
                        {conf.subtext && (
                            <div className="mt-3 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 pt-2 flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>{conf.subtext}</span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        case 'kanban_board': {
            const groupBy = conf.groupByField || 'Status';
            const titleF = conf.titleField || 'Name';
            const descF = conf.descField || 'Email';
            const accentF = conf.cardAccentField || 'Umsatz';

            // Runtime grouping of fetchedData
            const groups: Record<string, any[]> = {};
            fetchedData.forEach(row => {
                const val = String(getNestedValueCaseInsensitive(row, groupBy) || 'Unbekannt');
                if (!groups[val]) groups[val] = [];
                groups[val].push(row);
            });

            const columnsKeys = Object.keys(groups);

            const handleCardClick = (row: any) => {
                const idVal = getNestedValueCaseInsensitive(row, 'id');
                if (idVal !== undefined) {
                    setParam('selectedId', idVal);
                }
            };

            if (loading) {
                return (
                    <div className="p-4 w-full space-y-3">
                        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="h-48 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-xl"></div>
                            <div className="h-48 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-xl"></div>
                            <div className="h-48 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-xl"></div>
                        </div>
                    </div>
                );
            }

            return (
                <div className="p-4 w-full space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <Layers size={14} className="text-indigo-500" /> {conf.title || 'Kanban-Board'}
                        </h4>
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-mono font-medium">
                            Status-Spalte: {groupBy}
                        </span>
                    </div>

                    {columnsKeys.length === 0 ? (
                        <div className="text-center p-8 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic rounded-xl">
                            Keine Daten gefunden. Bitte wählen Sie ein gültiges Gruppierungs-Feld.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto pb-2">
                            {columnsKeys.map(colKey => (
                                <div key={colKey} className="bg-slate-100/60 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 flex flex-col min-w-[200px]">
                                    <div className="flex justify-between items-center mb-3 px-1">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80%]">{colKey}</span>
                                        <span className="text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                                            {groups[colKey].length}
                                        </span>
                                    </div>

                                    <div className="space-y-2.5 flex-1">
                                        {groups[colKey].map((row, rIdx) => {
                                            const cardTitle = getNestedValueCaseInsensitive(row, titleF) ? String(getNestedValueCaseInsensitive(row, titleF)) : `Task #${rIdx + 1}`;
                                            const cardDesc = getNestedValueCaseInsensitive(row, descF) ? String(getNestedValueCaseInsensitive(row, descF)) : '';
                                            const cardAccent = getNestedValueCaseInsensitive(row, accentF);

                                            return (
                                                <div 
                                                    key={rIdx} 
                                                    onClick={() => handleCardClick(row)}
                                                    className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-200 cursor-pointer space-y-2"
                                                >
                                                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">{cardTitle}</h5>
                                                    {cardDesc && <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">{cardDesc}</p>}
                                                    
                                                    {cardAccent !== undefined && cardAccent !== null && (
                                                        <div className="flex justify-end pt-1">
                                                            <span className="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-mono">
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
                </div>
            );
        }

        default:
            return (
                <div className="p-3 bg-slate-50 text-slate-500 text-xs italic border rounded text-center">
                    [Custom Component {comp.name} ({comp.type}) geladen]
                </div>
            );
    }
};
