import React from 'react';
import { CustomPage, PageComponent, SelectQuery } from '../../../types/index';
import { 
  Trash2, MousePointerClick, Database, Layers, LayoutTemplate 
} from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { PageExpectedParamsEditor } from './PageExpectedParamsEditor';
import { ApiInspector } from './ApiInspector';

interface PropertiesPanelProps {
  page: CustomPage;
  onPageChange: (page: CustomPage) => void;
  selectedNodeId: string | null;
  selectedNode: PageComponent | null;
  updateSelectedNodeProps: (newProps: any) => void;
  setShowDeleteConfirm: (show: boolean) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  page,
  onPageChange,
  selectedNodeId,
  selectedNode,
  updateSelectedNodeProps,
  setShowDeleteConfirm,
}) => {
  const { queries, tables, pages, forms } = useProjectStore();

  const rolesTable = tables.find(t => t.name === 'sys_roles');
  const availableRoles = rolesTable && rolesTable.data && rolesTable.data.length > 0
    ? rolesTable.data.map((r: any) => r.Name || String(r.Id))
    : ['Admin', 'Manager', 'Editor', 'User', 'Guest'];

  return (
    <div className="w-[320px] bg-white border-l border-slate-300 flex flex-col shadow-[-2px_0_5px_rgba(0,0,0,0.05)] z-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Eigenschaften</h3>
           {selectedNodeId && selectedNodeId !== 'root' && (
               <button onClick={() => setShowDeleteConfirm(true)} className="text-slate-400 hover:text-red-500 hidden sm:block delay-150 transition" title="Löschen">
                   <Trash2 size={16} />
               </button>
           )}
        </div>
        
        {selectedNode ? (
            <div className="p-4 space-y-6">
               <div>
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Typ: {selectedNode.type}</div>
               </div>

               {/* Content Properties */}
               {selectedNode.type === 'text' && (
                   <div>
                       <label className="block text-xs font-semibold text-slate-600 mb-1">Text Inhalt</label>
                       <textarea
                           value={selectedNode.props.text || ''}
                           onChange={(e) => updateSelectedNodeProps({ text: e.target.value })}
                           className="w-full px-2 py-1 text-sm border border-slate-300 rounded min-h-[80px]"
                       />
                   </div>
               )}
               {selectedNode.type === 'button' && (
                   <div className="space-y-4">
                       <div>
                           <label className="block text-xs font-semibold text-slate-600 mb-1">Button-Beschriftung</label>
                           <input
                               type="text"
                               value={selectedNode.props.label || ''}
                               onChange={(e) => updateSelectedNodeProps({ label: e.target.value })}
                               className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                           />
                       </div>

                       <div className="pt-3 border-t border-slate-100">
                           <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                               <MousePointerClick size={14} className="text-indigo-600" />
                               Button-Aktion (CRUD &amp; Navigation)
                           </label>
                           <select
                               value={selectedNode.props.actionType || 'none'}
                               onChange={(e) => updateSelectedNodeProps({ 
                                   actionType: e.target.value,
                                   formId: '',
                                   formMode: 'create',
                                   targetTableId: '',
                                   paramKey: 'selectedId',
                                   paramName: '',
                                   paramValue: '',
                                   targetPageId: '',
                                   navigateTargetParams: []
                               })}
                               className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                           >
                               <option value="none">Keine Aktion</option>
                               <option value="open_form">Formular öffnen (CRUD Create/Edit)</option>
                               <option value="delete_record">Datensatz löschen (CRUD Delete)</option>
                               <option value="set_parameter">Parameter setzen (Status / Filter)</option>
                               <option value="navigate_to_page">Seite wechseln (Details / Navigation)</option>
                           </select>
                       </div>

                       {/* Open Form Action Fields */}
                       {selectedNode.props.actionType === 'open_form' && (
                           <div className="space-y-3 bg-indigo-50/30 border border-indigo-100 rounded p-2.5">
                               <div>
                                   <label className="block text-[10px] font-bold text-indigo-900 mb-1">Formular wählen</label>
                                   <select
                                       value={selectedNode.props.formId || ''}
                                       onChange={(e) => updateSelectedNodeProps({ formId: e.target.value })}
                                       className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                                   >
                                       <option value="">-- Formular wählen --</option>
                                       {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                   </select>
                               </div>
                               <div>
                                   <label className="block text-[10px] font-bold text-indigo-900 mb-1">Modus</label>
                                   <select
                                       value={selectedNode.props.formMode || 'create'}
                                       onChange={(e) => updateSelectedNodeProps({ formMode: e.target.value })}
                                       className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                                   >
                                       <option value="create">Neuen Datensatz erstellen (Create)</option>
                                       <option value="edit">Ausgewählten Datensatz bearbeiten (Update)</option>
                                   </select>
                               </div>
                               {selectedNode.props.formMode === 'edit' && (
                                   <p className="text-[9px] text-slate-500">
                                       Liest die Datensatz-ID aus dem Parameter <code className="font-mono text-indigo-700 bg-white px-0.5 border font-semibold">selectedId</code>.
                                    </p>
                               )}
                               <div className="pt-2 border-t border-indigo-100">
                                   <span className="block text-[10px] font-bold text-indigo-900 mb-1.5 flex justify-between items-center">
                                       <span>Parameter (Default Values)</span>
                                       <button 
                                           type="button"
                                           onClick={() => {
                                               const m = selectedNode.props.navigateTargetParams || [];
                                               updateSelectedNodeProps({
                                                   navigateTargetParams: [...m, { sourceKey: '', targetKey: '' }]
                                               });
                                           }}
                                           className="text-[9px] text-indigo-700 hover:underline font-bold"
                                       >
                                           + Hinzufügen
                                       </button>
                                   </span>
                                   {(() => {
                                       const mappings = selectedNode.props.navigateTargetParams || [];
                                       const targetForm = forms.find(f => f.id === selectedNode.props.formId);
                                       const targetTable = tables.find(t => t.id === targetForm?.sourceId);
                                       const formFields = targetTable?.fields || [];

                                       return (
                                           <div className="space-y-1.5">
                                               {mappings.length === 0 ? (
                                                   <span className="text-[9px] text-slate-400 italic block leading-normal">Aktuelle Seiten-Parameter werden automatisch übergeben, falls Feldnamen übereinstimmen.</span>
                                               ) : (
                                                   mappings.map((mapping: any, mIdx: number) => (
                                                       <div key={mIdx} className="flex gap-1 items-center">
                                                           <input
                                                               type="text"
                                                               value={mapping.sourceKey}
                                                               onChange={(e) => {
                                                                   const copy = [...mappings];
                                                                   copy[mIdx].sourceKey = e.target.value;
                                                                   updateSelectedNodeProps({ navigateTargetParams: copy });
                                                               }}
                                                               placeholder="Quelle (z.B. id)"
                                                               className="flex-1 text-[10px] font-mono px-1.5 py-0.5 border border-slate-300 rounded"
                                                           />
                                                           <span className="text-slate-400">➔</span>
                                                           <select
                                                               value={mapping.targetKey}
                                                               onChange={(e) => {
                                                                   const copy = [...mappings];
                                                                   copy[mIdx].targetKey = e.target.value;
                                                                   updateSelectedNodeProps({ navigateTargetParams: copy });
                                                               }}
                                                               className="flex-1 text-[10px] font-mono px-1 py-0.5 border border-slate-300 rounded bg-white"
                                                           >
                                                               <option value="">Formular-Feld</option>
                                                               {formFields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                                                           </select>
                                                           <button
                                                               type="button"
                                                               onClick={() => {
                                                                   updateSelectedNodeProps({
                                                                       navigateTargetParams: mappings.filter((_:any, idx:number) => idx !== mIdx)
                                                                   });
                                                               }}
                                                               className="text-red-500 text-[11px] font-bold px-1"
                                                           >
                                                               ×
                                                           </button>
                                                       </div>
                                                   ))
                                               )}
                                           </div>
                                       );
                                   })()}
                               </div>
                           </div>
                       )}

                       {/* Delete Record Action Fields */}
                       {selectedNode.props.actionType === 'delete_record' && (
                           <div className="space-y-3 bg-red-50/30 border border-red-100 rounded p-2.5">
                               <div>
                                   <label className="block text-[10px] font-bold text-red-900 mb-1">Tabelle wählen</label>
                                   <select
                                       value={selectedNode.props.targetTableId || ''}
                                       onChange={(e) => updateSelectedNodeProps({ targetTableId: e.target.value })}
                                       className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                                   >
                                       <option value="">-- Tabelle wählen --</option>
                                       {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                   </select>
                               </div>
                               <div>
                                   <label className="block text-[10px] font-bold text-red-900 mb-1">ID Parameterquelle</label>
                                   <input
                                       type="text"
                                       value={selectedNode.props.paramKey || 'selectedId'}
                                       onChange={(e) => updateSelectedNodeProps({ paramKey: e.target.value })}
                                       placeholder="z.B. selectedId"
                                       className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                                   />
                               </div>
                               <p className="text-[9px] text-slate-500 leading-normal">
                                   Löscht den Datensatz, dessen Primärschlüssel dem Parameterwert entspricht.
                               </p>
                           </div>
                       )}

                       {/* Set Parameter Action Fields */}
                       {selectedNode.props.actionType === 'set_parameter' && (
                           <div className="space-y-3 bg-slate-50 border border-slate-200 rounded p-2.5">
                               <div>
                                   <label className="block text-[10px] font-bold text-slate-700 mb-1">Parameter Name</label>
                                   <input
                                       type="text"
                                       value={selectedNode.props.paramName || ''}
                                       onChange={(e) => updateSelectedNodeProps({ paramName: e.target.value })}
                                       placeholder="z.B. filterId"
                                       className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                                   />
                               </div>
                               <div>
                                   <label className="block text-[10px] font-bold text-slate-700 mb-1">Parameter-Wert</label>
                                   <input
                                       type="text"
                                       value={selectedNode.props.paramValue || ''}
                                       onChange={(e) => updateSelectedNodeProps({ paramValue: e.target.value })}
                                       placeholder="z.B. {{id}} oder Konstante"
                                       className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                                   />
                                   <span className="text-[8px] text-slate-400 mt-0.5 block leading-normal">
                                       Unterstützt Platzhalter wie <code className="bg-white px-0.5">{"{{id}}"}</code> aus dem Schleifen-Kontext.
                                   </span>
                               </div>
                           </div>
                       )}

                       {/* Navigate to Page Action Fields */}
                       {selectedNode.props.actionType === 'navigate_to_page' && (
                           <div className="space-y-3 bg-emerald-50/30 border border-emerald-100 rounded p-2.5">
                               <div>
                                   <label className="block text-[10px] font-bold text-emerald-900 mb-1">Zielseite</label>
                                   <select
                                       value={selectedNode.props.targetPageId || ''}
                                       onChange={(e) => updateSelectedNodeProps({ targetPageId: e.target.value })}
                                       className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                                   >
                                       <option value="">-- Seite wählen --</option>
                                       {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                   </select>
                               </div>

                               <div className="pt-2 border-t border-emerald-100">
                                   <span className="block text-[10px] font-bold text-emerald-900 mb-1.5 flex justify-between items-center">
                                       <span>Parameter-Übergabe</span>
                                       <button 
                                           type="button"
                                           onClick={() => {
                                               const m = selectedNode.props.navigateTargetParams || [];
                                               updateSelectedNodeProps({
                                                   navigateTargetParams: [...m, { sourceKey: '', targetKey: '' }]
                                               });
                                           }}
                                           className="text-[9px] text-emerald-700 hover:underline font-bold"
                                       >
                                           + Hinzufügen
                                       </button>
                                   </span>
                                   {(() => {
                                       const mappings = selectedNode.props.navigateTargetParams || [];
                                       const targetPage = pages.find(p => p.id === selectedNode.props.targetPageId);
                                       const expectedTargetParams = targetPage?.expectedParams || [];

                                       return (
                                           <div className="space-y-1.5">
                                               {mappings.length === 0 ? (
                                                   <span className="text-[9px] text-slate-400 italic block">Keine Übergabe definiert.</span>
                                               ) : (
                                                   mappings.map((mapping: any, mIdx: number) => (
                                                       <div key={mIdx} className="flex gap-1 items-center">
                                                           <input
                                                               type="text"
                                                               value={mapping.sourceKey}
                                                               onChange={(e) => {
                                                                   const copy = [...mappings];
                                                                   copy[mIdx].sourceKey = e.target.value;
                                                                   updateSelectedNodeProps({ navigateTargetParams: copy });
                                                               }}
                                                               placeholder="Quelle (z.B. {{id}})"
                                                               className="flex-1 text-[10px] font-mono px-1.5 py-0.5 border border-slate-300 rounded"
                                                           />
                                                           <span className="text-slate-400">➔</span>
                                                           <select
                                                               value={mapping.targetKey}
                                                               onChange={(e) => {
                                                                   const copy = [...mappings];
                                                                   copy[mIdx].targetKey = e.target.value;
                                                                   updateSelectedNodeProps({ navigateTargetParams: copy });
                                                               }}
                                                               className="flex-1 text-[10px] font-mono px-1 py-0.5 border border-slate-300 rounded bg-white"
                                                           >
                                                               <option value="">Ziel-Key</option>
                                                               {expectedTargetParams.map(p => <option key={p} value={p}>{p}</option>)}
                                                               <option value="id">id (Standard)</option>
                                                               <option value="selectedId">selectedId</option>
                                                           </select>
                                                           <button
                                                               type="button"
                                                               onClick={() => {
                                                                   updateSelectedNodeProps({
                                                                       navigateTargetParams: mappings.filter((_:any, idx:number) => idx !== mIdx)
                                                                   });
                                                               }}
                                                               className="text-red-500 text-[11px] font-bold px-1"
                                                           >
                                                               ×
                                                           </button>
                                                       </div>
                                                   ))
                                               )}
                                           </div>
                                       );
                                   })()}
                               </div>
                           </div>
                       )}
                   </div>
               )}
               
               {/* Dropdown Data Binding */}
               {selectedNode.type === 'dropdown' && (
                   <div className="space-y-4">
                       <div>
                           <label className="block text-xs font-semibold text-slate-600 mb-1">Platzhalter Text</label>
                           <input
                               type="text"
                               value={selectedNode.props.placeholder || ''}
                               onChange={(e) => updateSelectedNodeProps({ placeholder: e.target.value })}
                               className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                           />
                       </div>
                       <div className="pt-4 border-t border-slate-100">
                           <h4 className="text-xs font-bold text-indigo-600 mb-2">Datenbindung (Query)</h4>
                           <label className="block text-xs font-semibold text-slate-600 mb-1">Datenquelle (Abfrage)</label>
                           <select 
                              value={selectedNode.props.queryId || ''} 
                              onChange={(e: any) => updateSelectedNodeProps({ queryId: e.target.value, valueField: '', labelField: '' })}
                              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-3"
                           >
                               <option value="">-- Keine Abfrage --</option>
                               {queries.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                           </select>

                           {selectedNode.props.queryId && (() => {
                               const selectedQuery = queries.find(q => q.id === selectedNode.props.queryId);
                               if (!selectedQuery) return null;
                               const cols = selectedQuery.type === 'SELECT' ? (selectedQuery as SelectQuery).columns : [];
                               return (
                                   <>
                                      <label className="block text-xs font-semibold text-slate-600 mb-1 mt-2">Wert-Spalte (Value ID)</label>
                                      <select 
                                          value={selectedNode.props.valueField || ''} 
                                          onChange={(e: any) => updateSelectedNodeProps({ valueField: e.target.value })}
                                          className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-2"
                                      >
                                          <option value="">-- Spalte wählen --</option>
                                          {cols.map(c => <option key={c.id} value={c.alias || c.fieldName}>{c.alias || c.fieldName}</option>)}
                                      </select>

                                      <label className="block text-xs font-semibold text-slate-600 mb-1 mt-2">Anzeige-Spalte (Label)</label>
                                      <select 
                                          value={selectedNode.props.labelField || ''} 
                                          onChange={(e: any) => updateSelectedNodeProps({ labelField: e.target.value })}
                                          className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-2"
                                      >
                                          <option value="">-- Spalte wählen --</option>
                                          {cols.map(c => <option key={c.id} value={c.alias || c.fieldName}>{c.alias || c.fieldName}</option>)}
                                      </select>

                                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                                            <h5 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                                                <Database size={12} /> Daten filtern über Parameter
                                            </h5>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Filter-Spalte (z.B. id)</label>
                                                <select
                                                    value={selectedNode.props.filterParamField || ''}
                                                    onChange={(e) => updateSelectedNodeProps({ filterParamField: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 font-medium"
                                                >
                                                    <option value="">-- Kein Filter --</option>
                                                    {cols.map(c => <option key={c.id} value={c.alias || c.fieldName}>{c.alias || c.fieldName}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Filter-Parameter Name (z.B. selectedId)</label>
                                                <input 
                                                    type="text"
                                                    value={selectedNode.props.filterParamName || ''}
                                                    onChange={(e) => updateSelectedNodeProps({ filterParamName: e.target.value })}
                                                    placeholder="z.B. selectedId"
                                                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                                                />
                                                <p className="text-[9px] text-slate-400 mt-1">
                                                    Filtert das Dropdown, sodass der Wert in der ausgewählten Filter-Spalte dem Wert des Parameters entspricht.
                                                </p>
                                            </div>
                                        </div>
                                   </>
                               );
                           })()}
                       </div>
                   </div>
               )}

               {/* Data Table Binding */}
               {(selectedNode.type === 'table_view' || selectedNode.type === 'list_repeater' || selectedNode.type === 'container') && (
                   <div className="space-y-4">
                       <div>
                           <h4 className="text-xs font-bold text-emerald-600 mb-2">Datenquelle</h4>
                           <label className="block text-xs font-semibold text-slate-600 mb-1">Typ</label>
                           <select 
                              value={selectedNode.props.dataSourceType || ''}
                              onChange={(e: any) => updateSelectedNodeProps({ dataSourceType: e.target.value, dataSourceId: '' })}
                              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-3"
                           >
                               <option value="">-- Wählen --</option>
                               <option value="table">Tabelle</option>
                               <option value="query">Abfrage</option>
                           </select>

                           {selectedNode.props.dataSourceType === 'table' && (
                               <>
                                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tabelle</label>
                                  <select 
                                       value={selectedNode.props.dataSourceId || ''}
                                       onChange={(e: any) => {
                                           const val = e.target.value;
                                           const table = tables.find(t => t.id === val);
                                           const cols = table ? table.fields.map(f => f.name).join(',') : '';
                                           updateSelectedNodeProps({ dataSourceId: val, columns: cols });
                                       }}
                                       className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-3"
                                   >
                                       <option value="">-- Tabelle wählen --</option>
                                      {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                  </select>
                               </>
                           )}

                           {selectedNode.props.dataSourceType === 'query' && (
                               <>
                                  <label className="block text-xs font-semibold text-slate-600 mb-1">Abfrage</label>
                                  <select 
                                       value={selectedNode.props.dataSourceId || ''}
                                       onChange={(e: any) => {
                                           const val = e.target.value;
                                           const q = queries.find(qi => qi.id === val);
                                           const cols = (q && q.type === 'SELECT') ? (q as SelectQuery).columns.map(c => c.alias || c.fieldName).join(',') : '';
                                           updateSelectedNodeProps({ dataSourceId: val, columns: cols });
                                       }}
                                       className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-3"
                                   >
                                       <option value="">-- Abfrage wählen --</option>
                                      {queries.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                                  </select>
                               </>
                           )}

                           {(selectedNode.type === 'table_view' || selectedNode.type === 'container' || selectedNode.type === 'list_repeater') && selectedNode.props.dataSourceId && (() => {
                               let availableCols: {id: string, label: string, name: string}[] = [];
                               if (selectedNode.props.dataSourceType === 'table') {
                                   const t = tables.find(tb => tb.id === selectedNode.props.dataSourceId);
                                   if (t) {
                                       availableCols = t.fields.map(f => ({ id: f.name, label: f.name, name: f.name }));
                                   }
                               } else if (selectedNode.props.dataSourceType === 'query') {
                                   const q = queries.find(qi => qi.id === selectedNode.props.dataSourceId);
                                   if (q) {
                                       availableCols = (q as any).columns.map((c: any) => {
                                            const lbl = c.alias || c.fieldName;
                                            return { id: lbl, label: lbl, name: lbl };
                                       });
                                   }
                               }
                               
                               const selectedCols: string[] = selectedNode.props.columns ? selectedNode.props.columns.split(',').map((c:string) => c.trim()).filter(Boolean) : [];

                               const toggleCol = (colName: string) => {
                                   const set = new Set(selectedCols);
                                   if (set.has(colName)) set.delete(colName);
                                   else set.add(colName);
                                   updateSelectedNodeProps({ columns: Array.from(set).join(',') });
                               };

                               return (
                                   <div className="mt-4 pt-4 border-t border-slate-200">
                                        <label className="block text-xs font-semibold text-slate-600 mb-2">Spalten auswählen</label>
                                       {availableCols.length === 0 ? (
                                            <div className="text-xs text-slate-400">Keine Spalten gefunden</div>
                                        ) : (
                                            <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-200 rounded p-2">
                                                {availableCols.map(col => (
                                                    <label key={col.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:bg-slate-50 p-1 rounded">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={selectedCols.includes(col.name)}
                                                            onChange={() => toggleCol(col.name)}
                                                            className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                                        />
                                                        {col.label}
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {/* Table Data Filtering with Parameters */}
                                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                                            <h5 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                                                <Database size={12} /> Daten filtern über Parameter
                                            </h5>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Filter-Spalte (z.B. id oder standort_id)</label>
                                                <select
                                                    value={selectedNode.props.filterParamField || ''}
                                                    onChange={(e) => updateSelectedNodeProps({ filterParamField: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 font-medium"
                                                >
                                                    <option value="">-- Kein Filter --</option>
                                                    {availableCols.map(col => (
                                                        <option key={col.id} value={col.name}>{col.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Filter-Parameter Name (z.B. selectedId)</label>
                                                <input 
                                                    type="text"
                                                    value={selectedNode.props.filterParamName || ''}
                                                    onChange={(e) => updateSelectedNodeProps({ filterParamName: e.target.value })}
                                                    placeholder="z.B. selectedId"
                                                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                                                />
                                                <p className="text-[9px] text-slate-400 mt-1">
                                                    Filtert die Zeilen dieser Tabelle, sodass der Wert in der ausgewählten Filter-Spalte dem aktuellen Wert des angegebenen Parameters entspricht.
                                                </p>
                                            </div>
                                        </div>
                                   </div>
                               );
                           })()}
                       </div>
                   </div>
               )}

               {/* Subpage Container Binding */}
               {selectedNode.type === 'subpage_container' && (
                   <div className="space-y-4">
                       <div>
                           <h4 className="text-xs font-bold text-emerald-600 mb-2">Unterseiten-Einstellungen</h4>
                           <label className="block text-xs font-semibold text-slate-600 mb-1">Eingebundene Seite (Sub-Page)</label>
                           <select 
                              value={selectedNode.props.subPageId || ''} 
                              onChange={(e: any) => updateSelectedNodeProps({ subPageId: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs mb-3"
                           >
                               <option value="">-- Keine Seite ausgewählt --</option>
                               {pages.map(p => (
                                   <option key={p.id} value={p.id}>
                                       {p.name}{p.isSubpage ? ' (Unterseite)' : ''}
                                   </option>
                               ))}
                           </select>
                       </div>

                       <div className="pt-4 border-t border-slate-100">
                           <h4 className="text-xs font-bold text-slate-700 mb-2">Parameter-Mapping</h4>
                           <p className="text-[10px] text-slate-400 mb-3">
                               Definiere, welche Variablen oder Spaltenwerte der Hauptseite an die Unterseite übergeben werden sollen.
                           </p>
                           
                           {(() => {
                               const mappings = selectedNode.props.parameterMappings || [];
                               
                               const addMapping = () => {
                                   const newMapping = { sourceKey: '', targetKey: '' };
                                   updateSelectedNodeProps({ parameterMappings: [...mappings, newMapping] });
                               };

                               const removeMapping = (idx: number) => {
                                   const next = [...mappings];
                                   next.splice(idx, 1);
                                   updateSelectedNodeProps({ parameterMappings: next });
                               };

                               const updateMapping = (idx: number, field: 'sourceKey' | 'targetKey', val: string) => {
                                   const next = [...mappings];
                                   next[idx] = { ...next[idx], [field]: val };
                                   updateSelectedNodeProps({ parameterMappings: next });
                               };

                               return (
                                   <div className="space-y-2">
                                       {mappings.map((m: any, idx: number) => (
                                           <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-2 rounded border border-slate-200">
                                               <div className="flex-1 space-y-1">
                                                   <input 
                                                       type="text"
                                                       value={m.sourceKey}
                                                       onChange={(e) => updateMapping(idx, 'sourceKey', e.target.value)}
                                                       placeholder="Source (z.B. id)"
                                                       className="w-full px-1.5 py-0.5 text-[11px] border border-slate-300 rounded font-mono"
                                                   />
                                                   <input 
                                                       type="text"
                                                       value={m.targetKey}
                                                       onChange={(e) => updateMapping(idx, 'targetKey', e.target.value)}
                                                       placeholder="Target (z.B. filterId)"
                                                       className="w-full px-1.5 py-0.5 text-[11px] border border-slate-300 rounded font-mono"
                                                   />
                                               </div>
                                               <button 
                                                   onClick={() => removeMapping(idx)}
                                                   className="text-slate-400 hover:text-red-500 p-1"
                                                   title="Mapping löschen"
                                                   type="button"
                                               >
                                                   <Trash2 size={14} />
                                               </button>
                                           </div>
                                       ))}
                                       
                                       <button 
                                           onClick={addMapping}
                                           className="w-full text-center py-1.5 border border-dashed border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                           type="button"
                                       >
                                           + Mapping hinzufügen
                                       </button>
                                   </div>
                               );
                           })()}
                       </div>
                   </div>
               )}

               {/* Embedded Form Binding */}
               {selectedNode.type === 'form_view' && (
                   <div className="pt-4 border-t border-slate-200 space-y-4">
                       <h4 className="text-xs font-bold text-emerald-600 mb-2">Formular (Embedded)</h4>
                       
                       <div>
                           <label className="block text-[10px] font-bold text-indigo-900 mb-1">Formular auswählen</label>
                           <select
                               value={selectedNode.props.formId || ''}
                               onChange={(e) => updateSelectedNodeProps({ formId: e.target.value })}
                               className="w-full bg-white border border-indigo-200 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                           >
                               <option value="">-- Formular wählen --</option>
                               {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                           </select>
                       </div>

                       <div>
                           <label className="block text-[10px] font-bold text-indigo-900 mb-1">Modus</label>
                           <select
                               value={selectedNode.props.formMode || 'edit'}
                               onChange={(e) => updateSelectedNodeProps({ formMode: e.target.value })}
                               className="w-full bg-white border border-indigo-200 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                           >
                               <option value="create">Neuen Datensatz erstellen (Create)</option>
                               <option value="edit">Ausgewählten Datensatz bearbeiten (Update)</option>
                               <option value="readonly">Nur Lesen (View)</option>
                           </select>
                       </div>

                       {selectedNode.props.formMode === 'edit' && (
                           <p className="text-[9px] text-slate-500">
                               Liest die Datensatz-ID aus dem Parameter <code className="font-mono text-indigo-700 bg-white px-0.5 border font-semibold">selectedId</code>.
                           </p>
                       )}

                       <div className="space-y-2 pt-2 border-t border-slate-200 mt-2">
                           <label className="block text-[10px] font-bold text-slate-500 uppercase">Ausblenden</label>
                           <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                               <input 
                                   type="checkbox" 
                                   checked={selectedNode.props.hideNavigation || false}
                                   onChange={(e) => updateSelectedNodeProps({ hideNavigation: e.target.checked })}
                               />
                               Navigation (Pfeile) verbergen
                           </label>
                           <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                               <input 
                                   type="checkbox" 
                                   checked={selectedNode.props.hideActions || false}
                                   onChange={(e) => updateSelectedNodeProps({ hideActions: e.target.checked })}
                               />
                               Aktionen (Speichern/Löschen/Neu) verbergen
                           </label>
                           <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                               <input 
                                   type="checkbox" 
                                   checked={selectedNode.props.hideHeader || false}
                                   onChange={(e) => updateSelectedNodeProps({ hideHeader: e.target.checked })}
                               />
                               Kopfzeile (Titel & Schließen-X) verbergen
                           </label>
                       </div>

                       <div className="pt-2 border-t border-indigo-100">
                           <span className="block text-[10px] font-bold text-indigo-900 mb-1.5 flex justify-between items-center">
                               <span>Parameter (Default Values)</span>
                               <button 
                                   type="button"
                                   onClick={() => {
                                       const m = selectedNode.props.navigateTargetParams || [];
                                       updateSelectedNodeProps({
                                           navigateTargetParams: [...m, { sourceKey: '', targetKey: '' }]
                                       });
                                   }}
                                   className="text-[9px] text-indigo-700 hover:underline font-bold"
                               >
                                   + Hinzufügen
                               </button>
                           </span>
                           {(() => {
                               const mappings = selectedNode.props.navigateTargetParams || [];
                               const formObj = forms.find(f => f.id === selectedNode.props.formId);
                               const sourceTable = formObj ? tables.find(t => t.id === formObj.sourceId) : null;
                               const formFields = sourceTable?.fields || [];
                               
                               return (
                                   <div className="space-y-1.5">
                                       {mappings.length === 0 ? (
                                           <span className="text-[9px] text-slate-400 italic block leading-normal">Keine Parameter definiert. Aktuelle Seiten-Parameter werden automatisch übergeben.</span>
                                       ) : (
                                           mappings.map((mapping: any, mIdx: number) => (
                                               <div key={mIdx} className="flex items-center gap-1 w-full bg-white p-1 rounded border border-indigo-50 shadow-sm">
                                                   <input
                                                       type="text"
                                                       value={mapping.sourceKey}
                                                       onChange={(e) => {
                                                           const copy = [...mappings];
                                                           copy[mIdx].sourceKey = e.target.value;
                                                           updateSelectedNodeProps({ navigateTargetParams: copy });
                                                       }}
                                                       placeholder="Quelle (z.B. id)"
                                                       className="flex-1 text-[10px] font-mono px-1.5 py-0.5 border border-slate-300 rounded min-w-0"
                                                   />
                                                   <span className="text-slate-400">➔</span>
                                                   <select
                                                       value={mapping.targetKey}
                                                       onChange={(e) => {
                                                           const copy = [...mappings];
                                                           copy[mIdx].targetKey = e.target.value;
                                                           updateSelectedNodeProps({ navigateTargetParams: copy });
                                                       }}
                                                       className="flex-1 text-[10px] font-mono px-1 py-0.5 border border-slate-300 rounded bg-white min-w-0"
                                                   >
                                                       <option value="">Formular-Feld</option>
                                                       {formFields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                                                   </select>
                                                   <button
                                                       type="button"
                                                       onClick={() => {
                                                           updateSelectedNodeProps({
                                                               navigateTargetParams: mappings.filter((_:any, idx:number) => idx !== mIdx)
                                                           });
                                                       }}
                                                       className="text-red-500 text-[11px] font-bold px-1"
                                                   >
                                                       ×
                                                   </button>
                                               </div>
                                           ))
                                       )}
                                   </div>
                               );
                           })()}
                       </div>
                   </div>
               )}

               {/* Table View Interactions & Detail Page Binding */}
               {selectedNode.type === 'table_view' && (
                   <div className="pt-4 border-t border-slate-200 space-y-4">
                       <h4 className="text-xs font-bold text-emerald-600 mb-2">Aktionen & Interaktionen</h4>
                       
                       <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                           <input 
                               type="checkbox"
                               checked={!!selectedNode.props.enableCrudActions}
                               onChange={(e) => updateSelectedNodeProps({ enableCrudActions: e.target.checked })}
                               className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                           />
                           CRUD-Aktionen aktivieren (Details, Bearbeiten, Löschen)
                       </label>

                       {selectedNode.props.enableCrudActions && (
                           <div className="space-y-3 pl-3 border-l-2 border-indigo-200">
                               <div>
                                   <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Formular für "Neu" (Erstellen)</label>
                                   <select
                                       value={selectedNode.props.createFormId || ''}
                                       onChange={(e) => updateSelectedNodeProps({ createFormId: e.target.value })}
                                       className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                                   >
                                       <option value="">-- Kein Formular (Deaktiviert) --</option>
                                       {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                   </select>
                               </div>
                               <div>
                                   <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Formular für "Bearbeiten"</label>
                                   <select
                                       value={selectedNode.props.editFormId || ''}
                                       onChange={(e) => updateSelectedNodeProps({ editFormId: e.target.value })}
                                       className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                                   >
                                       <option value="">-- Kein Formular (Deaktiviert) --</option>
                                       {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                   </select>
                               </div>
                           </div>
                       )}

                       <div className="pt-2 border-t border-slate-100">
                           <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                               <input 
                                   type="checkbox"
                                   checked={!!selectedNode.props.enableSelection}
                                   onChange={(e) => updateSelectedNodeProps({ enableSelection: e.target.checked })}
                                   className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                               />
                               Zeilen-Klick aktivieren (Parameter setzen)
                           </label>
                           
                           {(selectedNode.props.enableSelection || selectedNode.props.enableCrudActions) && (
                               <div className="space-y-3 mt-3 pl-3 border-l-2 border-indigo-200">
                                   <div>
                                       <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Ziel-Parameter Name</label>
                                       <input 
                                           type="text"
                                           value={selectedNode.props.selectionParamName || 'selectedId'}
                                           onChange={(e) => updateSelectedNodeProps({ selectionParamName: e.target.value })}
                                           placeholder="z.B. selectedId"
                                           className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                                       />
                                   </div>
                                   <div>
                                       <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Bei "Details"-Klick auf Seite navigieren</label>
                                       <select
                                           value={selectedNode.props.detailsPageId || ''}
                                           onChange={(e) => updateSelectedNodeProps({ detailsPageId: e.target.value })}
                                           className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                                       >
                                           <option value="">-- Kein Seitenwechsel (nur Parameter setzen) --</option>
                                           {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                       </select>
                                   </div>
                                   <div>
                                       <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Ereignis-Trigger für Details</label>
                                       <select
                                           value={selectedNode.props.rowClickTrigger || 'click'}
                                           onChange={(e) => updateSelectedNodeProps({ rowClickTrigger: e.target.value })}
                                           className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                                       >
                                           <option value="click">Einfacher Klick (Standard)</option>
                                           <option value="dblclick">Doppelklick (Sicherer, markiert bei Klick)</option>
                                       </select>
                                   </div>
                               </div>
                           )}
                       </div>
                   </div>
               )}

              {/* Row/Column Properties */}
              {(selectedNode.type === 'row' || selectedNode.type === 'column') && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                      <h4 className="text-xs font-bold text-indigo-600 mb-2">Layout Eigenschaften</h4>
                      
                      <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Abstand (Gap)</label>
                          <select 
                              value={selectedNode.props.gap || '4'}
                              onChange={(e) => updateSelectedNodeProps({ gap: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                          >
                              <option value="0">Kein (0)</option>
                              <option value="1">Klein (4px)</option>
                              <option value="2">Mittel (8px)</option>
                              <option value="4">Standard (16px)</option>
                              <option value="6">Groß (24px)</option>
                              <option value="8">Sehr Groß (32px)</option>
                          </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                          <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Ausrichtung (Align)</label>
                              <select 
                                  value={selectedNode.props.alignItems || (selectedNode.type === 'row' ? 'start' : 'stretch')}
                                  onChange={(e) => updateSelectedNodeProps({ alignItems: e.target.value })}
                                  className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                              >
                                  <option value="start">Oben/Anfang (Start)</option>
                                  <option value="center">Mittig (Center)</option>
                                  <option value="end">Unten/Ende (End)</option>
                                  <option value="stretch">Strecken (Stretch)</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Verteilung (Justify)</label>
                              <select 
                                  value={selectedNode.props.justifyContent || 'start'}
                                  onChange={(e) => updateSelectedNodeProps({ justifyContent: e.target.value })}
                                  className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                              >
                                  <option value="start">Anfang (Start)</option>
                                  <option value="center">Mittig (Center)</option>
                                  <option value="end">Ende (End)</option>
                                  <option value="between">Zwischen (Between)</option>
                              </select>
                          </div>
                      </div>

                      {selectedNode.type === 'row' && (
                          <label className="flex items-center gap-2 text-[10px] font-semibold text-slate-600 cursor-pointer mt-2">
                              <input 
                                  type="checkbox"
                                  checked={!!selectedNode.props.wrap}
                                  onChange={(e) => updateSelectedNodeProps({ wrap: e.target.checked })}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              Zeilenumbruch erlauben (Wrap)
                          </label>
                      )}
                  </div>
              )}

              {/* Card Properties */}
              {selectedNode.type === 'card' && (
                  <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-indigo-600 mb-2">Card Eigenschaften</h4>
                      <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Titel</label>
                          <input 
                              type="text"
                              value={selectedNode.props.title || ''}
                              onChange={(e) => updateSelectedNodeProps({ title: e.target.value })}
                              placeholder="Titel der Card (z.B. {name})"
                              className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                          />
                      </div>
                  </div>
              )}

              {/* Anzeige-Bedingung (ngIf equivalent) */}
               <div className="pt-4 border-t border-slate-100">
                   <h4 className="text-xs font-bold text-indigo-600 mb-2">Anzeige-Bedingung (ngIf)</h4>
                   <div className="space-y-2 text-slate-700">
                       <div>
                           <label className="block text-[10px] font-semibold text-slate-500">Filter-Feld (Variable/Spalte)</label>
                           <input
                               type="text"
                               value={selectedNode.props.visibilityField || ''}
                               onChange={(e) => updateSelectedNodeProps({ visibilityField: e.target.value })}
                               placeholder="z.B. STATUS oder id"
                               className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                           />
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                           <div>
                               <label className="block text-[10px] font-semibold text-slate-500">Operator</label>
                               <select
                                   value={selectedNode.props.visibilityOperator || '=='}
                                   onChange={(e) => updateSelectedNodeProps({ visibilityOperator: e.target.value })}
                                   className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                               >
                                   <option value="==">=(gleich)</option>
                                   <option value="!=">!=(ungleich)</option>
                                   <option value=">">&gt; (größer)</option>
                                   <option value="<">&lt; (kleiner)</option>
                                   <option value="contains">enthält</option>
                                   <option value="not_empty">ist gesetzt (nicht leer)</option>
                                   <option value="empty">ist leer</option>
                               </select>
                           </div>
                           <div>
                               <label className="block text-[10px] font-semibold text-slate-500">Vergleichswert</label>
                               <input
                                   type="text"
                                   value={selectedNode.props.visibilityValue || ''}
                                   onChange={(e) => updateSelectedNodeProps({ visibilityValue: e.target.value })}
                                   placeholder="Wert..."
                                   className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                               />
                           </div>
                       </div>
                       <p className="text-[10px] text-slate-400 italic">Bedingte Sichtbarkeit basierend auf dem aktuellen Loop- oder Datensatz-Kontext.</p>
                   </div>
               </div>

               {/* Custom Classes for styling */}
               <div className="pt-4 border-t border-slate-100">
                   <label className="block text-xs font-semibold text-slate-600 mb-1">Eigene CSS-Klassen (Tailwind)</label>
                  <input
                      type="text"
                      value={selectedNode.props.className || ''}
                      onChange={(e) => updateSelectedNodeProps({ className: e.target.value })}
                      placeholder="z.B. mt-4 bg-red-100"
                      className="w-full px-2 py-1 text-sm border font-mono text-xs border-slate-300 rounded"
                  />
              </div>

               {/* Rollen-Sichtbarkeit / Userlevels (RBAC) */}
               <div className="pt-4 border-t border-slate-100">
                   <h4 className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-1">
                       <Layers size={13} /> Rollen-Berechtigung (Userlevels)
                   </h4>
                   <p className="text-[10px] text-slate-400 mb-2">Wählen Sie aus, welche Benutzerrollen diese Komponente sehen dürfen. (Leer lassen für alle)</p>
                   <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50">
                       {availableRoles.map(role => {
                           const currentAllowed = selectedNode.props.allowedRoles || [];
                           const isChecked = currentAllowed.includes(role);
                           return (
                               <label key={role} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                                   <input 
                                       type="checkbox"
                                       checked={isChecked}
                                       onChange={(e) => {
                                           const nextRoles = e.target.checked 
                                               ? [...currentAllowed, role]
                                               : currentAllowed.filter((r: string) => r !== role);
                                           updateSelectedNodeProps({ allowedRoles: nextRoles });
                                       }}
                                       className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-3.5 w-3.5"
                                   />
                                   <span>{role}</span>
                               </label>
                           );
                       })}
                   </div>
               </div>
            </div>
        ) : (
            <div className="p-4 space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                        <LayoutTemplate size={16} className="text-amber-500" />
                        Seiten-Konfiguration
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Seitenname</label>
                            <input 
                                type="text" 
                                value={page.name} 
                                onChange={e => onPageChange({ ...page, name: e.target.value })}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2 select-none pt-2">
                            <input 
                                type="checkbox"
                                id="isSubpageCheckboxSidebar"
                                checked={!!page.isSubpage}
                                onChange={e => onPageChange({ ...page, isSubpage: e.target.checked })}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                            />
                            <label htmlFor="isSubpageCheckboxSidebar" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1">
                                <Layers size={13} className="text-emerald-600"/> Als Unterseite (Sub-Page) markieren
                            </label>
                        </div>

                        {page.isSubpage && (
                            <div className="space-y-3 pt-3 border-t border-slate-200">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hauptseite (Parent Page)</label>
                                    <select
                                        value={page.parentPageId || ''}
                                        onChange={(e) => onPageChange({ ...page, parentPageId: e.target.value || undefined })}
                                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                                    >
                                        <option value="">-- Keine Hauptseite --</option>
                                        {pages.filter(p => p.id !== page.id && !p.isSubpage).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Parameter-Übernahme & Bindung Info */}
                                <div className="bg-emerald-50 border border-emerald-100 rounded p-2.5">
                                    <h4 className="text-[10px] font-bold text-emerald-800 flex items-center gap-1 uppercase tracking-wider mb-1">
                                        <Layers size={10} /> Automatische Parameter
                                    </h4>
                                    
                                    {(() => {
                                        const relevantParentId = page.parentPageId;
                                        const parentPages = relevantParentId 
                                            ? pages.filter(p => p.id === relevantParentId) 
                                            : pages.filter(p => p.id !== page.id);
                                            
                                        const embeddingContainers: { pageName: string, mapping: any[] }[] = [];
                                        
                                        const findContainers = (node: PageComponent, pageName: string) => {
                                            if (node.type === 'subpage_container' && node.props.subPageId === page.id) {
                                                embeddingContainers.push({ pageName, mapping: node.props.parameterMappings || [] });
                                            }
                                            if (node.children) {
                                                node.children.forEach(c => findContainers(c, pageName));
                                            }
                                        };
                                        
                                        parentPages.forEach(p => findContainers(p.layout, p.name));
                                        
                                        if (embeddingContainers.length === 0) {
                                            return (
                                                <p className="text-[10px] text-slate-500 italic leading-normal">
                                                    Auf der Hauptseite wurde noch kein Sub-Container für diese Seite platziert. Füge dort eine "Unterseite" Komponente ein.
                                                </p>
                                            );
                                        }
                                        
                                        return (
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] text-emerald-700 leading-normal">
                                                    Aktive Einbindungs-Mappings gefunden:
                                                </p>
                                                {embeddingContainers.map((item, idx) => (
                                                    <div key={idx} className="bg-white border border-emerald-100 rounded p-1.5 text-[9px] font-mono">
                                                        <span className="font-bold text-slate-700 block mb-1">Seite: {item.pageName}</span>
                                                        {item.mapping.length === 0 ? (
                                                            <span className="text-slate-400 italic">Keine Mappings</span>
                                                        ) : (
                                                            item.mapping.map((m: any, mIdx: number) => (
                                                                <div key={mIdx} className="flex justify-between border-b border-slate-50 py-0.5">
                                                                    <span className="text-slate-500">{m.sourceKey}</span>
                                                                    <span className="text-emerald-600 font-bold">➔ {m.targetKey}</span>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Expected Parameters list */}
                                <div className="bg-white border border-slate-200 rounded p-2.5">
                                    <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Erwartete Parameter</h4>
                                    <p className="text-[9px] text-slate-400 mb-2">Fügen Sie Parameter hinzu, die die URL oder Hauptseite übergibt.</p>
                                    <PageExpectedParamsEditor page={page} onPageChange={onPageChange} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Schnittstellen & API-Inspector */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                        <Database size={16} className="text-indigo-500" />
                        Schnittstellen &amp; API-Inspector
                    </h3>
                    <p className="text-[10px] text-slate-400 mb-3">Abfragen und Datenquellen live einsehen und testen.</p>
                    
                    <ApiInspector queries={queries} tables={tables} />
                </div>
            </div>
        )}
    </div>
  );
};
