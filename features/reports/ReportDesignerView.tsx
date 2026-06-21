
import React, { useState, useEffect } from 'react';
import { Report, Field, Table, Query, ReportColumn, Relationship } from '../../types/index';
import { Eye, EyeOff, Settings, Columns, AlignJustify, GripVertical, Palette, LayoutTemplate, Shield } from 'lucide-react';
import { ReportFormattingPanel } from './designer/ReportFormattingPanel';
import { ReportView } from './ReportView';
import { executeSelectQuery } from '../queries/utils/queryExecution';

interface ReportDesignerViewProps {
  report: Report;
  tables: Table[];
  queries: Query[];
  relationships: Relationship[];
  onReportChange: (report: Report) => void;
}

export const ReportDesignerView: React.FC<ReportDesignerViewProps> = ({ report, tables, queries, relationships, onReportChange }) => {
  // Local state is the source of truth for the UI to prevent focus loss during typing
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [sourceFields, setSourceFields] = useState<Field[]>([]);
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [activeFormattingColIndex, setActiveFormattingColIndex] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Initialize Data & Fields based on Source
  useEffect(() => {
    let fields: Field[] = [];
    let data: any[] = [];

    if (report.sourceType === 'table') {
        const table = tables.find(t => t.id === report.sourceId);
        fields = table?.fields || [];
        data = table?.data || [];
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
            // Execute query logic for preview WITH relationships to ensure JOINs work
            data = executeSelectQuery(query, tables, relationships); 
        }
    }
    setSourceFields(fields);
    setPreviewData(data);

    // Initialize columns only if they differ significantly or on first load
    // We do NOT depend on 'report.columns' for every update to avoid overwriting local edit state
    const currentCols = report.columns || [];
    if (currentCols.length === 0) {
        const initialCols = fields.map((f, i) => ({
            fieldId: f.id, label: f.name, visible: true, order: i
        }));
        setColumns(initialCols);
        onReportChange({ ...report, columns: initialCols });
    } else {
        // Deep copy to ensure no read-only references
        setColumns(JSON.parse(JSON.stringify(currentCols)));
    }
  }, [report.id, report.sourceId, report.sourceType, tables, queries, relationships]); // Added dependencies to auto-refresh data

  const syncToReport = (newCols: ReportColumn[]) => {
      setColumns(newCols);
      onReportChange({ ...report, columns: newCols });
  };

  // --- Drag & Drop ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === dropIndex) return;
    
    // Create deep copy to avoid mutation errors
    const newCols = columns.map(c => ({...c}));
    const [movedCol] = newCols.splice(draggedColIndex, 1);
    newCols.splice(dropIndex, 0, movedCol);
    
    // Update order index
    newCols.forEach((col, idx) => { col.order = idx; });
    
    syncToReport(newCols);
    setDraggedColIndex(null);
  };

  // --- Actions ---
  const toggleVisibility = (index: number) => {
      const newCols = columns.map((c, i) => i === index ? { ...c, visible: !c.visible } : c);
      syncToReport(newCols);
  };

  const handleLabelChange = (index: number, val: string) => {
      const newCols = columns.map((c, i) => i === index ? { ...c, label: val } : c);
      setColumns(newCols); // Update local immediately
      // Don't sync to global store on every keystroke to prevent lag,
      // but for simplicity in this architecture we will, relying on local state to keep focus.
      onReportChange({ ...report, columns: newCols });
  };

  const updateSettings = (key: keyof typeof report.settings, value: any) => {
      onReportChange({ ...report, settings: { ...report.settings, [key]: value } });
  };

  const updateSingleColumn = (index: number, updates: Partial<ReportColumn>) => {
      const newCols = columns.map((c, i) => i === index ? { ...c, ...updates } : c);
      syncToReport(newCols);
  };

  // Construct a preview report object mixing global settings with local column state
  const previewReport: Report = {
      ...report,
      columns: columns
  };

  return (
    <div className="flex h-full bg-slate-100">
      {/* LEFT: Config Panel */}
      <div className="w-96 flex flex-col bg-white border-r border-slate-300 shadow-xl z-10">
          <div className="p-4 bg-slate-800 text-white flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg flex items-center gap-2"><LayoutTemplate size={18}/> Struktur</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Columns List */}
              <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1"><Columns size={14}/> Spalten</h3>
                  <div className="space-y-2">
                      {columns.map((col, idx) => (
                          <div 
                              key={col.fieldId} 
                              draggable
                              onDragStart={(e) => handleDragStart(e, idx)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, idx)}
                              className={`flex items-center gap-2 p-2 rounded border transition-all ${col.visible ? 'bg-white border-slate-300' : 'bg-slate-50 border-slate-200 opacity-70'} ${draggedColIndex === idx ? 'opacity-50 border-blue-400 border-dashed' : ''}`}
                          >
                              <div className="cursor-move text-slate-400 hover:text-slate-600 p-1"><GripVertical size={14}/></div>
                              <div className="flex-1 grid grid-cols-1 gap-1">
                                  <div className="text-[10px] font-mono text-slate-400 truncate">
                                      {sourceFields.find(f => f.id === col.fieldId)?.name || '???'}
                                  </div>
                                  <input 
                                    type="text" 
                                    value={col.label} 
                                    onChange={e => handleLabelChange(idx, e.target.value)} 
                                    className="w-full border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-sm font-medium bg-transparent" 
                                  />
                              </div>
                              <div className="flex items-center gap-1">
                                  <button 
                                      onClick={() => setActiveFormattingColIndex(activeFormattingColIndex === idx ? null : idx)}
                                      className={`p-1.5 rounded flex items-center gap-1 text-xs ${col.formattingRules?.length ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'text-slate-400 hover:bg-slate-100'}`}
                                      title="Bedingte Formatierung"
                                  >
                                      <Palette size={14} />
                                  </button>
                                  <button onClick={() => toggleVisibility(idx)} className={`p-1.5 rounded ${col.visible ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-200'}`}>
                                      {col.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Grouping Settings */}
              <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1"><AlignJustify size={14}/> Gruppierung</h4>
                  <select value={report.groupingFieldId || ''} onChange={e => onReportChange({ ...report, groupingFieldId: e.target.value || undefined })} className="w-full border border-slate-300 rounded p-2 text-sm bg-slate-50">
                      <option value="">(Keine Gruppierung)</option>
                      {sourceFields.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
                  </select>
                  {report.groupingFieldId && (
                      <div className="bg-blue-50 p-3 rounded border border-blue-100 space-y-3 mt-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={report.settings?.pageBreakAfterGroup || false} onChange={e => updateSettings('pageBreakAfterGroup', e.target.checked)} className="rounded border-slate-300 text-blue-600" />
                              <span className="text-xs text-slate-700">Seitenumbruch nach Gruppe</span>
                          </label>
                          <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Methode</label>
                              <select value={report.settings?.groupMethod || 'full'} onChange={e => updateSettings('groupMethod', e.target.value)} className="w-full border border-slate-300 rounded p-1 text-xs">
                                  <option value="full">Vollständiger Wert</option>
                                  <option value="firstLetter">Anfangsbuchstabe (A-Z)</option>
                              </select>
                          </div>
                      </div>
                  )}
              </div>

              {/* Security Settings */}
              <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1"><Shield size={14}/> Sicherheit</h4>
                  <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Erlaubte Rollen (kommasepariert)</label>
                      <input 
                         type="text" 
                         placeholder="z.B. Admin, User" 
                         value={report.allowedRoles?.join(', ') || ''} 
                         onChange={e => onReportChange({ ...report, allowedRoles: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                         className="w-full border border-slate-300 rounded p-2 text-sm bg-white" 
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Leer lassen, wenn für alle zugänglich.</p>
                  </div>
              </div>
          </div>
      </div>

      {/* CENTER: Live Preview */}
      <div className="flex-1 overflow-hidden flex flex-col">
          <div className="bg-slate-200 p-2 text-xs text-center text-slate-500 border-b border-slate-300 shrink-0">
              Live Vorschau (Design Modus)
          </div>
          <div className="flex-1 overflow-auto relative bg-slate-200">
             <div className="absolute inset-0 scale-[0.8] origin-top p-4">
                <ReportView 
                    report={previewReport} 
                    data={previewData} 
                    sourceFields={sourceFields}
                    allTables={tables} 
                    relationships={relationships} 
                />
             </div>
          </div>
      </div>

      {/* RIGHT: Formatting Sidebar (Conditional) */}
      {activeFormattingColIndex !== null && columns[activeFormattingColIndex] && (
          <ReportFormattingPanel 
            column={columns[activeFormattingColIndex]} 
            onUpdateColumn={(updates) => updateSingleColumn(activeFormattingColIndex, updates)}
            onClose={() => setActiveFormattingColIndex(null)}
          />
      )}
    </div>
  );
};
