import React from 'react';
import { Database, Filter, Sliders, PlayCircle } from 'lucide-react';
import { PageComponent, Query, Table, CustomPage, Form, SelectQuery } from '../../../../types';
import { FilterAndDisplayProperties } from './FilterAndDisplayProperties';

interface TableAndRepeaterPropertiesProps {
  selectedNode: PageComponent;
  updateSelectedNodeProps: (newProps: any) => void;
  queries: Query[];
  tables: Table[];
  pages: CustomPage[];
  forms: Form[];
}

export const TableAndRepeaterProperties: React.FC<TableAndRepeaterPropertiesProps> = ({
  selectedNode,
  updateSelectedNodeProps,
  queries,
  tables,
  pages,
  forms,
}) => {
  const [activeTab, setActiveTab] = React.useState<'source' | 'filter' | 'actions'>('source');

  return (
    <div className="space-y-4">
      {/* Sub-Tabs for Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-lg gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('source')}
          className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-md transition flex items-center justify-center gap-1 ${
            activeTab === 'source'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Database size={12} /> Datenquelle
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('filter')}
          className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-md transition flex items-center justify-center gap-1 ${
            activeTab === 'filter'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Filter size={12} /> Filter & Anzeige
        </button>
        {selectedNode.type === 'table_view' && (
          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-md transition flex items-center justify-center gap-1 ${
              activeTab === 'actions'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <PlayCircle size={12} /> Aktionen
          </button>
        )}
      </div>

      {activeTab === 'source' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold text-emerald-600 mb-2">Datenquelle</h4>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Typ</label>
            <select 
              value={selectedNode.props.dataSourceType || ''}
              onChange={(e: any) => updateSelectedNodeProps({ dataSourceType: e.target.value, dataSourceId: '' })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm mb-3"
            >
              <option value="">-- Wählen --</option>
              <option value="table">Tabelle</option>
              <option value="query">Abfrage</option>
            </select>

            {selectedNode.props.dataSourceType === 'table' && (
              <>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tabelle</label>
                <select 
                  value={selectedNode.props.dataSourceId || ''}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    const table = tables.find(t => t.id === val);
                    const cols = table ? table.fields.map(f => f.name).join(',') : '';
                    updateSelectedNodeProps({ dataSourceId: val, columns: cols });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm mb-3"
                >
                  <option value="">-- Tabelle wählen --</option>
                  {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </>
            )}

            {selectedNode.props.dataSourceType === 'query' && (
              <>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Abfrage</label>
                <select 
                  value={selectedNode.props.dataSourceId || ''}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    const q = queries.find(qi => qi.id === val);
                    const cols = (q && q.type === 'SELECT') ? (q as SelectQuery).columns.map(c => c.alias || c.fieldName).join(',') : '';
                    updateSelectedNodeProps({ dataSourceId: val, columns: cols });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm mb-3"
                >
                  <option value="">-- Abfrage wählen --</option>
                  {queries.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                </select>
              </>
            )}

            {selectedNode.props.dataSourceId && (() => {
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
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Spalten auswählen</label>
                  {availableCols.length === 0 ? (
                    <div className="text-xs text-slate-400">Keine Spalten gefunden</div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded p-2">
                      {availableCols.map(col => (
                        <label key={col.id} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded">
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
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === 'filter' && (
        <FilterAndDisplayProperties
          selectedNode={selectedNode}
          updateSelectedNodeProps={updateSelectedNodeProps}
          tables={tables}
          queries={queries}
          pages={pages}
        />
      )}

      {/* Actions and Interactions for table view */}
      {activeTab === 'actions' && selectedNode.type === 'table_view' && (
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-emerald-600 mb-2">Aktionen & Interaktionen</h4>
          
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input 
              type="checkbox" 
              checked={!!selectedNode.props.enableCrudActions}
              onChange={(e) => updateSelectedNodeProps({ enableCrudActions: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            CRUD-Aktionen aktivieren (Details, Bearbeiten, Löschen)
          </label>

          {selectedNode.props.enableCrudActions && (
            <div className="space-y-3 pl-3 border-l-2 border-indigo-200 dark:border-indigo-800">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Formular für "Neu" (Erstellen)</label>
                <select
                  value={selectedNode.props.createFormId || ''}
                  onChange={(e) => updateSelectedNodeProps({ createFormId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs"
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
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs"
                >
                  <option value="">-- Kein Formular (Deaktiviert) --</option>
                  {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={!!selectedNode.props.enableSelection}
                onChange={(e) => updateSelectedNodeProps({ enableSelection: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Zeilen-Klick aktivieren (Parameter setzen)
            </label>
            
            {(selectedNode.props.enableSelection || selectedNode.props.enableCrudActions) && (
              <div className="space-y-3 mt-3 pl-3 border-l-2 border-indigo-200 dark:border-indigo-800">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Ziel-Parameter Name</label>
                  <input 
                    type="text"
                    value={selectedNode.props.selectionParamName || 'selectedId'}
                    onChange={(e) => updateSelectedNodeProps({ selectionParamName: e.target.value })}
                    placeholder="z.B. selectedId"
                    className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Bei "Details"-Klick auf Seite navigieren</label>
                  <select
                    value={selectedNode.props.detailsPageId || ''}
                    onChange={(e) => updateSelectedNodeProps({ detailsPageId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs"
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs"
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
    </div>
  );
};
