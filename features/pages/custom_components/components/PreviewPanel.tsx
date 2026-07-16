import React from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const ChartBar = Bar as any;
const ChartLine = Line as any;
const ChartArea = Area as any;
const ChartPie = Pie as any;

import { 
  AlertCircle, RefreshCw, HelpCircle, Filter, 
  TrendingUp, Users, DollarSign, Activity, Calendar, Percent, Award, ShoppingCart, Layout, Layers
} from 'lucide-react';
import { useProjectStore } from '../../../../stores/useProjectStore';
import { getNestedValueCaseInsensitive } from '../../utils/pageViewUtils';

const getNestedValue = (obj: any, path: string): any => {
  if (!path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = getNestedValueCaseInsensitive(current, part);
  }
  return current;
};

const renderCardWithTemplate = (row: any, config: any) => {
  const fields = config?.fields || [];
  const cardStyle = config?.cardStyle || {
    padding: 'p-3',
    rounded: 'rounded-xl',
    bg: 'bg-white dark:bg-slate-950',
    border: 'border border-slate-200 dark:border-slate-800',
    shadow: 'shadow-xs'
  };

  return (
    <div className={`${cardStyle.bg} ${cardStyle.padding} ${cardStyle.rounded} ${cardStyle.border} ${cardStyle.shadow} space-y-1.5 text-left transition-all duration-200`}>
      {fields.length === 0 ? (
        <div className="text-center py-4 text-[10px] text-slate-400 italic">Keine Felder definiert</div>
      ) : (
        fields.map((f: any, fIdx: number) => {
          const val = getNestedValue(row, f.field);
          if (val === undefined || val === null) return null;

          const alignClass = f.align || 'text-left';
          const sizeClass = f.fontSize || 'text-xs';
          const weightClass = f.fontWeight || 'font-normal';
          
          if (f.isBadge) {
            const badgeColorClass = f.badgeColor || 'bg-slate-100 text-slate-600';
            return (
              <div key={fIdx} className={`${alignClass} pt-0.5`}>
                <span className={`inline-block ${sizeClass} ${weightClass} ${badgeColorClass} px-2 py-0.5 rounded-md`}>
                  {f.showLabel !== false && f.label && <span className="opacity-80 mr-1">{f.label}:</span>}
                  {String(val)}
                </span>
              </div>
            );
          } else {
            const textColorClass = f.textColor || 'text-slate-800 dark:text-slate-100';
            return (
              <div key={fIdx} className={`${alignClass} ${sizeClass} ${weightClass} ${textColorClass} leading-tight`}>
                {f.showLabel !== false && f.label && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mr-1">{f.label}:</span>
                )}
                {String(val)}
              </div>
            );
          }
        })
      )}
    </div>
  );
};

interface PreviewPanelProps {
  componentName: string;
  componentType: 'table_view' | 'chart_view' | 'form_view' | 'text' | 'button' | 'dropdown' | 'metric_card' | 'kanban_board' | 'card_template';
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
  const { customComponents = [], tables = [] } = useProjectStore();
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
                    <div className="h-64 bg-white dark:bg-slate-950 p-4 border rounded-lg dark:border-slate-800">
                        <ResponsiveContainer width="100%" height="100%">
                            {configObj.chartType === 'bar' ? (
                                <BarChart data={mockRows}>
                                    <XAxis dataKey={configObj.xAxisKey || 'Name'} tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    {configObj.series?.map((s, idx) => (
                                        <ChartBar key={s.key || idx} dataKey={s.key || 'value'} fill={s.color || '#3b82f6'} />
                                    ))}
                                </BarChart>
                            ) : configObj.chartType === 'line' ? (
                                <LineChart data={mockRows}>
                                    <XAxis dataKey={configObj.xAxisKey || 'Name'} tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <CartesianGrid strokeDasharray="3 3" />
                                    {configObj.series?.map((s, idx) => (
                                        <ChartLine key={s.key || idx} type="monotone" dataKey={s.key || 'value'} stroke={s.color || '#3b82f6'} />
                                    ))}
                                </LineChart>
                            ) : configObj.chartType === 'area' ? (
                                <AreaChart data={mockRows}>
                                    <XAxis dataKey={configObj.xAxisKey || 'Name'} tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <CartesianGrid strokeDasharray="3 3" />
                                    {configObj.series?.map((s, idx) => (
                                        <ChartArea key={s.key || idx} type="monotone" dataKey={s.key || 'value'} fill={s.color || '#3b82f6'} stroke={s.color || '#3b82f6'} />
                                    ))}
                                </AreaChart>
                            ) : configObj.chartType === 'pie' ? (
                                <PieChart>
                                    <ChartPie 
                                        data={mockRows} 
                                        dataKey={configObj.series?.[0]?.key || 'value'} 
                                        nameKey={configObj.xAxisKey || 'Name'} 
                                        cx="50%" cy="50%" outerRadius={80} 
                                        label
                                    >
                                        {mockRows.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={(configObj.series && configObj.series.length > 0) ? configObj.series[index % configObj.series.length].color : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                                        ))}
                                    </ChartPie>
                                    <Tooltip />
                                </PieChart>
                            ) : (
                                <div className="flex h-full items-center justify-center text-slate-400">Typ nicht unterstützt</div>
                            )}
                        </ResponsiveContainer>
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

                  // Build mapping: manual mapping + dynamic mapping from related table
                  const columnMapping: Record<string, string> = { ...(configObj.columnMapping || {}) };
                  if (configObj.columnSourceTableId && configObj.columnDisplayField) {
                      const sourceTable = tables.find(t => t.id === configObj.columnSourceTableId);
                      if (sourceTable && sourceTable.data) {
                          sourceTable.data.forEach(item => {
                              const idVal = getNestedValueCaseInsensitive(item, 'id') ?? getNestedValueCaseInsensitive(item, 'Id');
                              const labelVal = getNestedValueCaseInsensitive(item, configObj.columnDisplayField);
                              if (idVal !== undefined && idVal !== null && labelVal !== undefined && labelVal !== null) {
                                  columnMapping[String(idVal)] = String(labelVal);
                              }
                          });
                      }
                  }

                  const keysFromMapping = Object.keys(columnMapping);
                  const defaultCols = keysFromMapping.length > 0 ? keysFromMapping : (configObj.columns || ['Offen', 'In Arbeit', 'Erledigt']);

                  const groups: Record<string, any[]> = {};
                  const unassignedKey = "Nicht zugeordnet";

                  defaultCols.forEach((col: string) => { groups[col] = []; });
                  groups[unassignedKey] = [];

                  mockRows.forEach(row => {
                     const val = String(getNestedValueCaseInsensitive(row, groupBy) || '');
                     if (groups.hasOwnProperty(val)) {
                        groups[val].push(row);
                     } else {
                        groups[unassignedKey].push(row);
                     }
                  });

                  const columnsKeys = [...defaultCols, ...(groups[unassignedKey].length > 0 ? [unassignedKey] : [])];

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
                      ) : configObj.kanbanLayout === 'rows' ? (
                        <div className="flex flex-col gap-4 w-full">
                          {columnsKeys.map(colKey => (
                            <div key={colKey} className="bg-slate-100/40 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row gap-3 items-stretch w-full">
                              {/* Left side title for Row layout */}
                              <div className="w-full md:w-36 shrink-0 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 pb-1.5 md:pb-0 md:pr-3">
                                <div>
                                  <h5 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                    {columnMapping[colKey] || colKey}
                                  </h5>
                                  <p className="text-[8px] text-slate-400 mt-0.5 hidden md:block">Zeilen-Lane</p>
                                </div>
                                <span className="text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                                  {groups[colKey]?.length || 0}
                                </span>
                              </div>

                              {/* Cards container */}
                              <div className="flex-1 flex flex-row gap-3 overflow-x-auto py-1 items-start min-w-0 scrollbar-thin">
                                {groups[colKey]?.length === 0 ? (
                                  <div className="flex-1 flex items-center justify-center text-[9px] text-slate-400 italic py-2">
                                    Keine Einträge
                                  </div>
                                ) : (
                                  (groups[colKey] || []).map((row, rIdx) => {
                                    if (configObj.cardTemplateId) {
                                      const template = customComponents.find(c => c.id === configObj.cardTemplateId);
                                      if (template) {
                                        return (
                                          <div key={rIdx} className="w-56 shrink-0 cursor-pointer hover:scale-[1.01] transition-transform">
                                            {renderCardWithTemplate(row, template.configuration)}
                                          </div>
                                        );
                                      }
                                    }

                                    const mapValWithLookup = (val: any): string => {
                                      if (val === undefined || val === null) return '';
                                      const sVal = String(val);
                                      if (columnMapping && columnMapping[sVal] !== undefined) {
                                        return columnMapping[sVal];
                                      }
                                      return typeof val === 'number' ? val.toLocaleString('de-DE') : sVal;
                                    };

                                    const cardTitleVal = getNestedValue(row, titleF) || getNestedValue(row, 'Name') || getNestedValue(row, 'name') || getNestedValue(row, 'Title') || getNestedValue(row, 'title');
                                    const cardTitle = cardTitleVal ? mapValWithLookup(cardTitleVal) : `Karte #${rIdx + 1}`;
                                    const cardDescVal = getNestedValue(row, descF) || getNestedValue(row, 'Email') || getNestedValue(row, 'email');
                                    const cardDesc = cardDescVal ? mapValWithLookup(cardDescVal) : '';
                                    const cardAccent = getNestedValue(row, accentF);

                                    return (
                                      <div key={rIdx} className="w-56 shrink-0 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all space-y-1.5">
                                        <h5 className="text-[10px] font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">{cardTitle}</h5>
                                        {cardDesc && <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">{cardDesc}</p>}
                                        {cardAccent !== undefined && cardAccent !== null && (
                                          <div className="flex justify-end pt-1">
                                            <span className="text-[8px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono">
                                              {mapValWithLookup(cardAccent)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3 overflow-x-auto pb-2">
                          {columnsKeys.map(colKey => (
                            <div key={colKey} className="bg-slate-100/80 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col min-w-[150px]">
                              <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80%]">
                                  {columnMapping[colKey] || colKey}
                                </span>
                                <span className="text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                                  {groups[colKey]?.length || 0}
                                </span>
                              </div>

                              <div className="space-y-2 flex-1">
                                {(groups[colKey] || []).map((row, rIdx) => {
                                  if (configObj.cardTemplateId) {
                                    const template = customComponents.find(c => c.id === configObj.cardTemplateId);
                                    if (template) {
                                      return (
                                        <div key={rIdx} className="cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform">
                                          {renderCardWithTemplate(row, template.configuration)}
                                        </div>
                                      );
                                    }
                                  }

                                  const mapValWithLookup = (val: any): string => {
                                    if (val === undefined || val === null) return '';
                                    const sVal = String(val);
                                    if (columnMapping && columnMapping[sVal] !== undefined) {
                                      return columnMapping[sVal];
                                    }
                                    return typeof val === 'number' ? val.toLocaleString('de-DE') : sVal;
                                  };

                                  const cardTitleVal = getNestedValue(row, titleF) || getNestedValue(row, 'Name') || getNestedValue(row, 'name') || getNestedValue(row, 'Title') || getNestedValue(row, 'title') || getNestedValue(row, 'Username') || getNestedValue(row, 'username');
                                  const cardTitle = cardTitleVal ? mapValWithLookup(cardTitleVal) : `Karte #${rIdx + 1}`;
                                  
                                  const cardDescVal = getNestedValue(row, descF) || getNestedValue(row, 'Email') || getNestedValue(row, 'email') || getNestedValue(row, 'Description') || getNestedValue(row, 'description') || getNestedValue(row, 'Untertitel');
                                  const cardDesc = cardDescVal ? mapValWithLookup(cardDescVal) : '';

                                  const cardAccent = getNestedValue(row, accentF);

                                  return (
                                    <div key={rIdx} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all space-y-1.5">
                                      <h5 className="text-[10px] font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">{cardTitle}</h5>
                                      {cardDesc && <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">{cardDesc}</p>}
                                      
                                      {cardAccent !== undefined && cardAccent !== null && (
                                        <div className="flex justify-end pt-1">
                                          <span className="text-[8px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono">
                                            {mapValWithLookup(cardAccent)}
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

                {/* CARD TEMPLATE PREVIEW */}
                {componentType === 'card_template' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">Kartenvorlage (Card Template)</span>
                      <span className="text-[9px] font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded font-bold uppercase dark:text-indigo-400">
                        Vorlage
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mockRows.slice(0, 2).map((row, rIdx) => (
                        <div key={rIdx}>
                          {renderCardWithTemplate(row, configObj)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* LAYOUT CONTAINER PREVIEW */}
                {componentType === 'layout_container' && (() => {
                  const layoutType = configObj.layoutType || 'row';
                  const gap = configObj.gap || 'gap-4';
                  const padding = configObj.padding || 'p-4';
                  const bgStyle = configObj.bgStyle || 'bg-white dark:bg-slate-900';
                  const shadow = configObj.shadow || 'shadow-sm';
                  const borderStyle = configObj.borderStyle || '';
                  const children = configObj.children || [];

                  const getGridClass = () => {
                    const c = configObj.cols || 3;
                    if (c === 1) return 'grid-cols-1';
                    if (c === 2) return 'grid-cols-1 sm:grid-cols-2';
                    if (c === 3) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
                    if (c === 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
                    if (c === 6) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
                    return 'grid-cols-1 sm:grid-cols-3';
                  };

                  const containerClasses = layoutType === 'grid'
                    ? `grid ${getGridClass()} ${gap} ${padding} ${bgStyle} ${shadow} ${borderStyle}`
                    : layoutType === 'col'
                      ? `flex flex-col ${gap} ${padding} ${bgStyle} ${shadow} ${borderStyle}`
                      : `flex flex-col sm:flex-row flex-wrap sm:items-stretch ${gap} ${padding} ${bgStyle} ${shadow} ${borderStyle}`;

                  return (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center pb-1.5 border-b dark:border-slate-800">
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs flex items-center gap-1.5">
                          📐 Layout-Container Vorschau
                        </span>
                        <span className="text-[8px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase">
                          {layoutType === 'grid' ? `Grid (${configObj.cols || 3} Sp.)` : layoutType === 'col' ? 'Spalte (Vertical)' : 'Zeile (Horizontal)'}
                        </span>
                      </div>

                      <div className={`${containerClasses} transition-all`}>
                        {children.length === 0 ? (
                          <div className="w-full text-center py-8 text-xs text-slate-400 italic">
                            Noch keine Elemente hinzugefügt. Benutzen Sie den Designer auf der linken Seite.
                          </div>
                        ) : (
                          children.map((child: any, cIdx: number) => {
                            const widthClass = layoutType === 'row' ? (child.width || 'flex-1') : 'w-full';
                            return (
                              <div key={child.id || cIdx} className={`${widthClass} min-w-0 flex flex-col justify-center`}>
                                {/* Render Text Element */}
                                {child.type === 'text' && (
                                  <div className={`${child.config?.fontSize || 'text-xs'} ${child.config?.fontWeight || 'font-normal'} ${child.config?.colorClass || 'text-slate-700 dark:text-slate-300'} ${child.config?.alignment || 'text-left'} leading-relaxed`}>
                                    {child.config?.text || 'Textblock'}
                                  </div>
                                )}

                                {/* Render Button Element */}
                                {child.type === 'button' && (
                                  <div className="py-1">
                                    <button 
                                      type="button"
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs hover:scale-[1.01] transition-transform ${
                                        child.config?.variant === 'danger'
                                          ? 'bg-red-600 hover:bg-red-700 text-white'
                                          : child.config?.variant === 'secondary'
                                            ? 'bg-slate-200 hover:bg-slate-350 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
                                            : child.config?.variant === 'outline'
                                              ? 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                      }`}
                                    >
                                      {child.config?.label || 'Aktion'}
                                    </button>
                                  </div>
                                )}

                                {/* Render Metric Card */}
                                {child.type === 'metric_card' && (() => {
                                  const theme = child.config?.themeColor || 'indigo';
                                  const themeClasses: Record<string, string> = {
                                    indigo: 'border-indigo-100 dark:border-indigo-950 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400',
                                    emerald: 'border-emerald-100 dark:border-emerald-950 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400',
                                    rose: 'border-rose-100 dark:border-rose-950 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400',
                                    amber: 'border-amber-100 dark:border-amber-950 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400',
                                  };
                                  return (
                                    <div className={`p-3 rounded-xl border ${themeClasses[theme] || themeClasses.indigo} flex flex-col justify-center min-h-[64px]`}>
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">{child.config?.title || 'Kennzahl'}</span>
                                      <span className="text-base font-bold text-slate-800 dark:text-white mt-0.5 truncate">
                                        {child.config?.customValue || '0'}{child.config?.suffix || ''}
                                      </span>
                                    </div>
                                  );
                                })()}

                                {/* Render Custom Component Reference Placeholder */}
                                {child.type === 'component_ref' && (() => {
                                  const referenced = customComponents.find(c => c.id === child.config?.refComponentId);
                                  return (
                                    <div className="p-3.5 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/10 flex flex-col items-center justify-center text-center">
                                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 truncate max-w-full">
                                        🧩 {referenced?.name || 'Komponente referenzieren'}
                                      </span>
                                      <span className="text-[8px] text-slate-400 mt-0.5 font-mono">
                                        Ref: {referenced?.type || 'Keine Auswahl'}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          })
                        )}
                      </div>
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
