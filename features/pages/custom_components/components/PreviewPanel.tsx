import React from 'react';
import { 
  AlertCircle, RefreshCw, HelpCircle, Filter, 
  TrendingUp, Users, DollarSign, Activity, Calendar, Percent, Award, ShoppingCart, Layout, Layers
} from 'lucide-react';

interface PreviewPanelProps {
  componentName: string;
  componentType: 'table_view' | 'chart_view' | 'form_view' | 'text' | 'button' | 'dropdown' | 'metric_card' | 'kanban_board';
  configObj: any;
  activeTab: 'visual' | 'json';
  jsonError: string | null;
  mockRows: any[];
  calculateAggregate: (colField: string, footerType: string, customText?: string) => string;
  forms: any[];
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  componentName,
  componentType,
  configObj,
  activeTab,
  jsonError,
  mockRows,
  calculateAggregate,
  forms,
}) => {
  return (
    <div className="flex-1 bg-slate-100 dark:bg-slate-950 flex flex-col p-6 overflow-y-auto z-0">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full min-h-[500px]">
        {/* Simulation Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/55 dark:bg-slate-950/35">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visual Canvas Preview &amp; Wireframe</h3>
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {componentName} <span className="font-mono text-slate-400 text-[10px]">({componentType})</span>
            </h2>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
              <RefreshCw size={10} className="animate-spin" /> Live Sync
            </span>
          </div>
        </div>

        {/* PREVIEW CONTAINER */}
        <div className="flex-1 p-6 flex flex-col justify-start">
          {activeTab === 'json' && jsonError ? (
            <div className="m-auto text-center text-slate-400 max-w-xs p-8">
              <AlertCircle size={36} className="mx-auto text-amber-500 mb-2" />
              <p className="text-xs">Die visuelle Vorschau wurde angehalten, bis das JSON korrigiert ist.</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col justify-between space-y-6">
              {/* Visual Renderings based on componentType */}
              <div className="flex-1">
                {/* TABLE VIEW PREVIEW */}
                {componentType === 'table_view' && (
                  <div className="space-y-4">
                    {/* Table Header toolbar preview */}
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{configObj.title || 'Tabellentitel'}</span>
                      {configObj.enableSearch && (
                        <input 
                          type="text" 
                          disabled 
                          placeholder={configObj.searchPlaceholder || 'Suchen...'} 
                          className="px-2 py-1 text-[11px] border dark:border-slate-700 rounded bg-white dark:bg-slate-800 w-48 opacity-60 cursor-not-allowed dark:text-white"
                        />
                      )}
                    </div>

                    {/* Filter toolbar preview */}
                    {configObj.enableFilters && (
                      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-lg border border-slate-150 dark:border-slate-800/60 text-[10px]">
                        <span className="text-slate-400 font-bold flex items-center gap-1 uppercase tracking-wider select-none">
                          <Filter size={10} className="text-indigo-500" /> Schnellfilter:
                        </span>
                        {(!configObj.filterFields || configObj.filterFields.length === 0) ? (
                          <span className="text-slate-400 italic">Keine Filterspalten ausgewählt</span>
                        ) : (
                          configObj.filterFields.map((field: string) => (
                            <div key={field} className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-slate-600 dark:text-slate-300 gap-1 shadow-sm font-mono text-[9px]">
                              <span>{field}:</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold font-sans">Alle</span>
                              <span className="text-[8px] text-slate-400">▼</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* TABLE MODE PREVIEW WITH EXPLICIT WIREFRAME HIGHLIGHTING */}
                    {configObj.layoutMode === 'table' ? (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                        <table className="w-full border-collapse text-left text-xs text-slate-600 dark:text-slate-400">
                          {/* 1. STATIC HEADER THEAD */}
                          <thead className="relative bg-slate-100 dark:bg-slate-850 border-2 border-indigo-400 border-dashed">
                            <tr className="relative">
                              {(!configObj.columns || configObj.columns.length === 0) ? (
                                <th className="p-3 text-slate-400 italic">Keine Spalten definiert</th>
                              ) : (
                                configObj.columns.map((col: any, cIdx: number) => {
                                  const isSortedField = configObj.enableSorting && configObj.defaultSortField === col.field;
                                  return (
                                    <th 
                                      key={cIdx} 
                                      className="p-3 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800"
                                      style={{ width: col.width || 'auto', textAlign: col.align || 'left' }}
                                    >
                                      <div className="flex items-center gap-1" style={{ justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}>
                                        <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-400 text-[8px] font-bold px-1 py-0.5 rounded mr-1 inline-block uppercase select-none shrink-0">
                                          Header
                                        </span>
                                        <span className="truncate">{col.title}</span>
                                        {configObj.enableSorting && (
                                          <span className={`text-[10px] select-none ml-1 shrink-0 ${isSortedField ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-300 dark:text-slate-600'}`}>
                                            {isSortedField ? (configObj.defaultSortOrder === 'desc' ? '▼' : '▲') : '↕'}
                                          </span>
                                        )}
                                      </div>
                                    </th>
                                  );
                                })
                              )}
                            </tr>
                            {/* Absolute Badge overlay for the static Header (Nested in valid row + cell) */}
                            <tr className="h-0 p-0 m-0 border-none select-none pointer-events-none">
                              <th colSpan={configObj.columns?.length || 1} className="p-0 border-none relative h-0">
                                <div className="absolute right-2 -top-2.5 bg-indigo-600 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow select-none pointer-events-none uppercase">
                                  Statischer Tabellen-Header &lt;thead&gt;
                                </div>
                              </th>
                            </tr>
                          </thead>

                          {/* 2. REPEATING BODY ROWS (TRs) */}
                          <tbody className="relative bg-white dark:bg-slate-900 border-2 border-amber-400 border-dashed">
                            {mockRows.slice(0, 3).map((row, rIdx) => (
                              <tr 
                                key={rIdx} 
                                className={`relative ${rIdx > 0 ? 'opacity-40 select-none' : 'bg-amber-50/10 dark:bg-amber-950/5'} ${configObj.tableStyle === 'striped' && rIdx % 2 === 1 ? 'bg-slate-50 dark:bg-slate-950/30' : ''}`}
                              >
                                {(!configObj.columns || configObj.columns.length === 0) ? (
                                  <td className="p-3 text-slate-300">-</td>
                                ) : (
                                  configObj.columns.map((col: any, cIdx: number) => {
                                    const cellVal = row[col.field];
                                    return (
                                      <td 
                                        key={cIdx} 
                                        className={`${configObj.tableStyle === 'compact' ? 'p-1.5' : 'p-3'} border-b border-slate-200 dark:border-slate-800 font-medium`}
                                        style={{ textAlign: col.align || 'left' }}
                                      >
                                        {rIdx === 0 && (
                                          <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 text-[8px] font-bold px-1 py-0.5 rounded mr-1 inline-block uppercase select-none">
                                            Loop
                                          </span>
                                        )}
                                        
                                        {/* Style cells based on visual selection format */}
                                        {col.type === 'badge' ? (
                                          <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold inline-block">
                                            {String(cellVal ?? 'Status')}
                                          </span>
                                        ) : col.type === 'currency' ? (
                                          <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                                            {Number(cellVal || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                          </span>
                                        ) : col.type === 'date' ? (
                                          <span className="text-slate-500 dark:text-slate-400 font-mono">
                                            {cellVal ? new Date(String(cellVal)).toLocaleDateString('de-DE') : '13.07.2026'}
                                          </span>
                                        ) : col.type === 'number' ? (
                                          <span className="font-mono font-semibold dark:text-slate-200">{String(cellVal ?? 0)}</span>
                                        ) : (
                                          <span className="dark:text-slate-300">{String(cellVal ?? '-')}</span>
                                        )}
                                      </td>
                                    );
                                  })
                                )}
                              </tr>
                            ))}
                            {/* Absolute Badge overlay for the dynamic Row Repeat Loop (Nested in valid row + cell) */}
                            <tr className="h-0 p-0 m-0 border-none select-none pointer-events-none">
                              <td colSpan={configObj.columns?.length || 1} className="p-0 border-none relative h-0">
                                <div className="absolute right-2 top-1.5 bg-amber-500 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow select-none pointer-events-none uppercase">
                                  Wiederholter Bereich &lt;tr&gt; (Loop über jeden DB-Eintrag)
                                </div>
                              </td>
                            </tr>
                          </tbody>

                          {/* 3. STATIC FOOTER TFOOT */}
                          {configObj.columns && configObj.columns.some((col: any) => col.footerType && col.footerType !== 'none') && (
                            <tfoot className="relative bg-slate-50 dark:bg-slate-950 border-2 border-purple-400 border-dashed">
                              <tr className="relative">
                                {configObj.columns.map((col: any, cIdx: number) => (
                                  <td 
                                    key={cIdx} 
                                    className="p-3 font-bold text-slate-700 dark:text-slate-300 border-t border-slate-300 dark:border-slate-800"
                                    style={{ textAlign: col.align || 'left' }}
                                  >
                                    <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-400 text-[8px] font-bold px-1 py-0.5 rounded mr-1 inline-block uppercase select-none">
                                      Footer
                                    </span>
                                    {calculateAggregate(col.field, col.footerType, col.footerCustomText)}
                                  </td>
                                ))}
                              </tr>
                              {/* Absolute Badge overlay for the static Footer (Nested in valid row + cell) */}
                              <tr className="h-0 p-0 m-0 border-none select-none pointer-events-none">
                                <td colSpan={configObj.columns?.length || 1} className="p-0 border-none relative h-0">
                                  <div className="absolute right-2 -bottom-2.5 bg-purple-600 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow select-none pointer-events-none uppercase">
                                    Statischer Tabellen-Footer &lt;tfoot&gt;
                                  </div>
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    ) : (
                      /* CARDS REPEATER GRID VIEW PREVIEW */
                      <div className={`grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-${configObj.cardGridCols || 3}`}>
                        {mockRows.slice(0, 3).map((row, rIdx) => {
                          const shadowStyle = 
                            configObj.cardShadow === 'sm' ? 'shadow-sm' :
                            configObj.cardShadow === 'md' ? 'shadow-md' :
                            configObj.cardShadow === 'lg' ? 'shadow-lg' : 'shadow-none';

                          const borderStyle = 
                            configObj.cardBorder === 'indigo' ? 'border-indigo-200 bg-indigo-50/10' :
                            configObj.cardBorder === 'none' ? 'border-transparent' : 'border-slate-200 dark:border-slate-800';

                          return (
                            <div 
                              key={rIdx}
                              className={`relative bg-white dark:bg-slate-900 border rounded-xl p-4 flex flex-col gap-2 transition ${shadowStyle} ${borderStyle} ${rIdx === 0 ? 'ring-2 ring-amber-400 ring-dashed' : 'opacity-40 select-none'}`}
                            >
                              {/* Card Wireframe Marker Label */}
                              {rIdx === 0 && (
                                <div className="absolute -top-3 left-3 bg-amber-500 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow select-none uppercase z-10">
                                  Wiederholte Card-Vorlage (Template Loop)
                                </div>
                              )}

                              {/* Card contents constructed by designer */}
                              {(!configObj.cardTemplate || configObj.cardTemplate.length === 0) ? (
                                <div className="text-center p-3 text-xs text-slate-300 italic">
                                  Leere Karte (Fügen Sie links Elemente hinzu)
                                </div>
                              ) : (
                                configObj.cardTemplate.map((elem: any, eIdx: number) => {
                                  const val = row[elem.field];
                                  return (
                                    <div key={eIdx} className={`${elem.style || ''}`}>
                                      {elem.label && <span className="text-[10px] text-slate-400 font-semibold block uppercase">{elem.label}</span>}
                                      {elem.type === 'badge' ? (
                                        <span className={`${elem.style || 'bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px]'}`}>
                                          {String(val ?? 'Badge')}
                                        </span>
                                      ) : elem.type === 'button' ? (
                                        <button disabled className="mt-1 px-3 py-1 bg-indigo-600/70 text-white text-[10px] rounded hover:bg-indigo-700/70 font-semibold pointer-events-none opacity-80 uppercase">
                                          {String(val ?? elem.label ?? 'CTA Button')}
                                        </button>
                                      ) : (
                                        <span className="dark:text-slate-200">{String(val ?? '-')}</span>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <div className="text-xs text-slate-400 italic bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded p-3 font-medium flex items-start gap-1.5 mt-2">
                      <HelpCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="dark:text-slate-300">
                        <strong>Für Designer:</strong> Der orange/amber umrandete Bereich stellt die Vorlage (<strong>&lt;tr&gt; Zeile</strong> bzw. <strong>&lt;Card&gt;</strong>) dar. Dieser wird vom SDUI Engine Renderer automatisch über jeden Datensatz Ihrer IndexedDB-Tabelle geloopt! Header und Footer bleiben statisch.
                      </p>
                    </div>
                  </div>
                )}

                {/* CHART VIEW PREVIEW */}
                {componentType === 'chart_view' && (
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{configObj.title || 'Diagramm'}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Typ: {configObj.chartType}</span>
                    </div>
                    <div className="h-44 flex items-end gap-3 justify-around pt-6 bg-white dark:bg-slate-950 p-4 border border-dashed rounded-lg dark:border-slate-800">
                      {mockRows.map((row, rIdx) => (
                        <div key={rIdx} className="flex flex-col items-center gap-1 w-full max-w-[60px]">
                          {/* Chart Pillar mockup */}
                          {configObj.chartType === 'bar' ? (
                            <div 
                              className="w-full rounded-t-md transition-all duration-500"
                              style={{ 
                                height: `${Math.min(100, 20 + rIdx * 25)}px`,
                                backgroundColor: configObj.series?.[0]?.color || '#3b82f6'
                              }}
                            />
                          ) : (
                            /* Line chart dot mockup */
                            <div className="w-full flex flex-col items-center justify-center h-[100px] relative">
                              <div 
                                className="h-3.5 w-3.5 rounded-full absolute"
                                style={{ 
                                  bottom: `${20 + rIdx * 22}px`,
                                  backgroundColor: configObj.series?.[0]?.color || '#3b82f6'
                                }}
                              />
                              <div className="w-[1px] h-full bg-slate-100 dark:bg-slate-800" />
                            </div>
                          )}
                          <span className="text-[10px] text-slate-400 truncate max-w-full font-mono mt-1">
                            {String(row[configObj.xAxisKey] || row.Month || row.Name || rIdx)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FORM VIEW PREVIEW */}
                {componentType === 'form_view' && (
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">Eingebettetes Formular</span>
                      <span className="text-[9px] font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded font-bold uppercase dark:text-indigo-400">
                        Form ID: {configObj.formId ? 'Konfiguriert' : 'Unbesetzt'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-850 p-5 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3 shadow-inner">
                      {!configObj.formId ? (
                        <div className="text-center p-8 text-slate-400 text-xs italic">
                          Bitte wählen Sie links ein Formular aus, das hier eingebettet werden soll.
                        </div>
                      ) : (
                        <>
                          {!configObj.hideHeader && (
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b dark:border-slate-800 pb-1.5">
                              Formular: {forms.find(f => f.id === configObj.formId)?.name || 'Geladen'} ({configObj.formMode})
                            </div>
                          )}
                          <div className="space-y-2 opacity-50 select-none">
                            <div>
                              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Vorname / Bezeichnung</label>
                              <input type="text" disabled className="w-full border dark:border-slate-700 p-1 text-xs rounded bg-slate-50 dark:bg-slate-800 dark:text-white" defaultValue="Max" />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">E-Mail Adresse</label>
                              <input type="text" disabled className="w-full border dark:border-slate-700 p-1 text-xs rounded bg-slate-50 dark:bg-slate-800 dark:text-white" defaultValue="max@beispiel.de" />
                            </div>
                          </div>
                          {!configObj.hideActions && (
                            <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-800">
                              <button disabled className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 text-[10px] font-bold rounded dark:text-slate-300">Abbrechen</button>
                              <button disabled className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded">Speichern ({configObj.formMode === 'create' ? 'Anlegen' : 'Update'})</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* TEXT PREVIEW */}
                {componentType === 'text' && (
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="bg-white dark:bg-slate-850 p-6 border dark:border-slate-800 rounded-lg shadow-inner min-h-[100px] flex items-center justify-center">
                      <div className={`w-full ${configObj.fontSize || 'text-base'} ${configObj.fontWeight || 'font-normal'} ${configObj.colorClass || 'text-slate-800'} ${configObj.alignment || 'text-left'}`}>
                        {configObj.text || 'Ihr konfigurierter Text wird hier abgebildet.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* BUTTON PREVIEW */}
                {componentType === 'button' && (
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="bg-white dark:bg-slate-850 p-6 border dark:border-slate-800 rounded-lg shadow-inner flex items-center justify-center">
                      <button 
                        disabled
                        className={`px-5 py-2 rounded-lg font-bold text-xs shadow-sm hover:shadow transition-all ${
                          configObj.variant === 'primary' ? 'bg-indigo-600 text-white' :
                          configObj.variant === 'secondary' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border dark:border-slate-700' :
                          configObj.variant === 'danger' ? 'bg-red-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {configObj.label || 'Aktions-Button'}
                      </button>
                    </div>
                  </div>
                )}

                {/* DROPDOWN PREVIEW */}
                {componentType === 'dropdown' && (
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="bg-white dark:bg-slate-850 p-6 border dark:border-slate-800 rounded-lg shadow-inner space-y-2">
                      {configObj.label && (
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">{configObj.label}</label>
                      )}
                      <select disabled className="w-full max-w-xs border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs opacity-75 dark:text-slate-300">
                        <option>{configObj.placeholder || '-- Bitte wählen --'}</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* METRIC CARD PREVIEW */}
                {componentType === 'metric_card' && (() => {
                  const theme = configObj.themeColor || 'indigo';
                  const themeClasses: Record<string, string> = {
                    indigo: 'bg-indigo-50/50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400',
                    emerald: 'bg-emerald-50/50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400',
                    rose: 'bg-rose-50/50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400',
                    sky: 'bg-sky-50/50 border-sky-100 text-sky-700 dark:bg-sky-950/20 dark:border-sky-900/40 dark:text-sky-400',
                    amber: 'bg-amber-50/50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400',
                    slate: 'bg-slate-50/50 border-slate-200 text-slate-700 dark:bg-slate-900/30 dark:border-slate-800 dark:text-slate-400'
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
                  const MetricIcon = IconDict[configObj.iconName || 'TrendingUp'] || TrendingUp;

                  // Live Metric Calculation logic on mockup data
                  const getLiveVal = () => {
                    if (configObj.aggType === 'custom') return configObj.customValue || '0';
                    if (!mockRows || mockRows.length === 0) return '0';
                    if (configObj.aggType === 'count') return mockRows.length.toString();

                    const f = configObj.aggField;
                    if (!f) return '0';

                    const numbers = mockRows.map(r => Number(r[f])).filter(val => !isNaN(val));
                    if (numbers.length === 0) return '0,00';

                    let res = 0;
                    if (configObj.aggType === 'sum') {
                      res = numbers.reduce((a, b) => a + b, 0);
                    } else if (configObj.aggType === 'avg') {
                      res = numbers.reduce((a, b) => a + b, 0) / numbers.length;
                    } else if (configObj.aggType === 'min') {
                      res = Math.min(...numbers);
                    } else if (configObj.aggType === 'max') {
                      res = Math.max(...numbers);
                    }

                    return res.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  };

                  return (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex justify-center">
                      <div className={`w-full max-w-sm border-2 p-5 rounded-2xl shadow-sm ${themeClasses[theme] || themeClasses.indigo}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {configObj.title || 'Kennzahl'}
                            </p>
                            <h4 className="text-3xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white font-sans">
                              {configObj.prefix || ''}{getLiveVal()}{configObj.suffix || ''}
                            </h4>
                          </div>
                          <div className={`p-2.5 rounded-xl ${iconBgClasses[theme] || iconBgClasses.indigo}`}>
                            <MetricIcon size={18} className={themeClasses[theme]?.split(' ')[2]} />
                          </div>
                        </div>
                        {configObj.subtext && (
                          <div className="mt-3 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 pt-2 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>{configObj.subtext}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* KANBAN BOARD PREVIEW */}
                {componentType === 'kanban_board' && (() => {
                  const groupBy = configObj.groupByField || 'Status';
                  const titleF = configObj.titleField || 'Name';
                  const descF = configObj.descField || 'Email';
                  const accentF = configObj.cardAccentField || 'Umsatz';

                  // Dynamic grouping of mockRows
                  const groups: Record<string, any[]> = {};
                  mockRows.forEach(row => {
                     const val = String(row[groupBy] || 'Unbekannt');
                     if (!groups[val]) groups[val] = [];
                     groups[val].push(row);
                  });

                  const columnsKeys = Object.keys(groups);

                  return (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                          <Layers size={13} className="text-indigo-500" /> {configObj.title || 'Kanban-Board'}
                        </h4>
                        <span className="text-[9px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono">
                          grouped by {groupBy}
                        </span>
                      </div>

                      {columnsKeys.length === 0 ? (
                        <div className="text-center p-6 text-slate-400 text-xs italic">
                          Wählen Sie ein Gruppierungs-Feld aus, um Kanban-Spalten zu erzeugen.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3 overflow-x-auto pb-2">
                          {columnsKeys.slice(0, 4).map(colKey => (
                            <div key={colKey} className="bg-slate-100/80 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col min-w-[150px]">
                              <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80%]">{colKey}</span>
                                <span className="text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                                  {groups[colKey].length}
                                </span>
                              </div>

                              <div className="space-y-2 flex-1">
                                {groups[colKey].map((row, rIdx) => {
                                  const cardTitle = row[titleF] ? String(row[titleF]) : `Karte #${rIdx + 1}`;
                                  const cardDesc = row[descF] ? String(row[descF]) : '';
                                  const cardAccent = row[accentF];

                                  return (
                                    <div key={rIdx} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all space-y-1.5">
                                      <h5 className="text-[10px] font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">{cardTitle}</h5>
                                      {cardDesc && <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">{cardDesc}</p>}
                                      
                                      {cardAccent !== undefined && (
                                        <div className="flex justify-end pt-1">
                                          <span className="text-[8px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono">
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
                })()}
              </div>

              {/* BOTTOM EXPLANATION BOX */}
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 font-mono text-[9px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg flex items-center gap-2">
                <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded uppercase shrink-0 font-sans">SDUI Integration</span>
                <p className="leading-relaxed">
                  Komponente in der Registry registriert. Sie können dieses Template im Page Builder über den Typ <strong>Custom Component</strong> direkt verknüpfen!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
