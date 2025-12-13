
import React, { useState, useEffect } from 'react';
import { Report, Field, Table, Query, ReportColumn } from '../../types/index';
import { Eye, EyeOff, Settings, Columns, AlignJustify, GripVertical, Palette } from 'lucide-react';
import { ReportFormattingPanel } from './designer/ReportFormattingPanel';

interface ReportDesignerViewProps {
  report: Report;
  tables: Table[];
  queries: Query[];
  onReportChange: (report: Report) => void;
}

export const ReportDesignerView: React.FC<ReportDesignerViewProps> = ({ report, tables, queries, onReportChange }) => {
  const [columns, setColumns] = useState<ReportColumn[]>(report.columns || []);
  const [sourceFields, setSourceFields] = useState<Field[]>([]);
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [activeFormattingColIndex, setActiveFormattingColIndex] = useState<number | null>(null);

  // Initialize fields based on source
  useEffect(() => {
    let fields: Field[] = [];
    if (report.sourceType === 'table') {
        const table = tables.find(t => t.id === report.sourceId);
        fields = table?.fields || [];
    } else {
        const query = queries.find(q => q.id === report.sourceId);
        if (query && query.type === 'SELECT') {
             const fieldMap = new Map<string, Field>();
             query.columns.forEach(col => {
                const table = tables.find(t => t.id === col.tableId);
                const field = table?.fields.find(f => f.id === col.fieldId);
                if (field && !fieldMap.has(field.id)) {
                    fieldMap.set(field.id, field);
                }
            });
            fields = Array.from(fieldMap.values());
        }
    }
    setSourceFields(fields);

    if (!report.columns || report.columns.length === 0) {
        const initialCols = fields.map((f, i) => ({
            fieldId: f.id, label: f.name, visible: true, order: i
        }));
        setColumns(initialCols);
        onReportChange({ ...report, columns: initialCols });
    } else {
        setColumns(report.columns);
    }
  }, [report.sourceId, report.sourceType, tables, queries]);

  const updateColumns = (newCols: ReportColumn[]) => {
      setColumns(newCols);
      onReportChange({ ...report, columns: newCols });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === index) return;
    
    const newCols = [...columns];
    const draggedItem = newCols[draggedColIndex];
    newCols.splice(draggedColIndex, 1);
    newCols.splice(index, 0, draggedItem);
    newCols.forEach((col, idx) => col.order = idx);
    
    updateColumns(newCols);
    setDraggedColIndex(index);
  };

  const toggleVisibility = (index: number) => {
      const newCols = [...columns];
      newCols[index].visible = !newCols[index].visible;
      updateColumns(newCols);
  };

  const handleLabelChange = (index: number, val: string) => {
      const newCols = [...columns];
      newCols[index].label = val;
      updateColumns(newCols);
  };

  const updateSettings = (key: keyof typeof report.settings, value: any) => {
      onReportChange({ ...report, settings: { ...report.settings, [key]: value } });
  };

  const updateSingleColumn = (index: number, updates: Partial<ReportColumn>) => {
      const newCols = [...columns];
      newCols[index] = { ...newCols[index], ...updates };
      updateColumns(newCols);
  };

  return (
    <div className="flex h-full bg-slate-100">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                <h2 className="font-bold text-xl flex items-center gap-2"><Columns size={20}/> Berichts-Layout: {report.name}</h2>
            </div>
            <div className="p-6">
                <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">Spalten-Konfiguration</h3>
                <div className="space-y-2">
                    {columns.map((col, idx) => (
                        <div 
                            key={col.fieldId} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            className={`flex items-center gap-2 p-3 rounded border transition-all ${col.visible ? 'bg-white border-slate-300' : 'bg-slate-50 border-slate-200 opacity-70'} ${draggedColIndex === idx ? 'opacity-50' : ''}`}
                        >
                            <div className="cursor-move text-slate-400 hover:text-slate-600"><GripVertical size={16}/></div>
                            <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-4 text-sm font-mono text-slate-500">
                                    {sourceFields.find(f => f.id === col.fieldId)?.name || '???'}
                                </div>
                                <div className="col-span-5">
                                    <input type="text" value={col.label} onChange={e => handleLabelChange(idx, e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:border-blue-500 outline-none" placeholder="Beschriftung" />
                                </div>
                                <div className="col-span-3 flex justify-end gap-2">
                                    <button 
                                        onClick={() => setActiveFormattingColIndex(activeFormattingColIndex === idx ? null : idx)}
                                        className={`p-1.5 rounded flex items-center gap-1 text-xs ${col.formattingRules?.length ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'text-slate-400 hover:bg-slate-100'}`}
                                        title="Bedingte Formatierung"
                                    >
                                        <Palette size={14} /> {col.formattingRules?.length ? col.formattingRules.length : ''}
                                    </button>
                                    <button onClick={() => toggleVisibility(idx)} className={`p-1.5 rounded ${col.visible ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-200'}`}>
                                        {col.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* Sidebar / Properties */}
      {activeFormattingColIndex !== null ? (
          <ReportFormattingPanel 
            column={columns[activeFormattingColIndex]} 
            onUpdateColumn={(updates) => updateSingleColumn(activeFormattingColIndex, updates)}
            onClose={() => setActiveFormattingColIndex(null)}
          />
      ) : (
          <div className="w-80 bg-white border-l border-slate-300 flex flex-col overflow-y-auto">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><Settings size={16} /> Berichts-Einstellungen</h3>
                </div>
                <div className="p-4 space-y-6">
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1"><AlignJustify size={14}/> Gruppierung</h4>
                        <select value={report.groupingFieldId || ''} onChange={e => onReportChange({ ...report, groupingFieldId: e.target.value || undefined })} className="w-full border border-slate-300 rounded p-2 text-sm">
                            <option value="">(Keine Gruppierung)</option>
                            {sourceFields.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
                        </select>
                        {report.groupingFieldId && (
                            <div className="bg-blue-50 p-3 rounded border border-blue-100 space-y-3 mt-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={report.settings?.pageBreakAfterGroup || false} onChange={e => updateSettings('pageBreakAfterGroup', e.target.checked)} className="rounded border-slate-300 text-blue-600" />
                                    <span className="text-sm text-slate-700">Seitenumbruch nach Gruppe</span>
                                </label>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Gruppierungsmethode</label>
                                    <select value={report.settings?.groupMethod || 'full'} onChange={e => updateSettings('groupMethod', e.target.value)} className="w-full border border-slate-300 rounded p-1 text-sm">
                                        <option value="full">Vollständiger Wert</option>
                                        <option value="firstLetter">Anfangsbuchstabe (A-Z)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="border-t border-slate-200 pt-6">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Seite</h4>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ausrichtung</label>
                            <div className="flex gap-2">
                                <button onClick={() => updateSettings('orientation', 'portrait')} className={`flex-1 py-2 text-sm border rounded ${report.settings?.orientation !== 'landscape' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'}`}>Hochformat</button>
                                <button onClick={() => updateSettings('orientation', 'landscape')} className={`flex-1 py-2 text-sm border rounded ${report.settings?.orientation === 'landscape' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'}`}>Querformat</button>
                            </div>
                        </div>
                    </div>
                </div>
          </div>
      )}
    </div>
  );
};
