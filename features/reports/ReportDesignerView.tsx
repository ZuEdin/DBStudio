import React, { useState, useEffect } from 'react';
import {
  Report,
  Field,
  Table,
  Query,
  ReportColumn,
  Relationship,
  GroupLevel,
  ReportSummary,
  Din5008Config,
  CommercialVobConfig,
  EpcQrCodeConfig,
  BandSectionConfig,
} from '../../types/index';
import {
  Eye,
  EyeOff,
  Settings,
  Columns,
  GripVertical,
  Palette,
  Layers,
  Calculator,
  Layout,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileText,
} from 'lucide-react';
import { ReportFormattingPanel } from './designer/ReportFormattingPanel';
import { ReportView } from './ReportView';
import { executeSelectQuery } from '../queries/utils/queryExecution';
import { LogoUploadField } from '../../components/common/LogoUploadField';
import { Din5008ConfigPanel } from './components/Din5008ConfigPanel';
import { BandedSectionManager } from './components/BandedSectionManager';
import { AdvancedReportFeaturesPanel } from './components/AdvancedReportFeaturesPanel';
import { FreeformCanvasManager } from './components/FreeformCanvasManager';
import { BandModelEditorModal } from './components/BandModelEditorModal';
import { LabelThermalPrintModal } from './components/LabelThermalPrintModal';
import { PdfExportWorkflowModal } from './components/PdfExportWorkflowModal';
import { CrossPlatformPrintDialogModal } from './components/CrossPlatformPrintDialogModal';
import { WysiwygBandedReportDesigner } from './designer/WysiwygBandedReportDesigner';
import { ExpressionBuilderModal } from './designer/ExpressionBuilderModal';
import { eventBus } from '../../services/eventBus';

interface ReportDesignerViewProps {
  report: Report;
  tables: Table[];
  queries: Query[];
  relationships: Relationship[];
  allReports?: Report[];
  onReportChange: (report: Report) => void;
}

export const ReportDesignerView: React.FC<ReportDesignerViewProps> = ({
  report,
  tables,
  queries,
  relationships,
  allReports = [],
  onReportChange,
}) => {
  const [activeTab, setActiveTab] = useState<'columns' | 'grouping' | 'summaries' | 'banded' | 'canvas' | 'din5008' | 'advanced' | 'settings'>('columns');
  const [viewMode, setViewMode] = useState<'wysiwyg' | 'preview' | 'split'>('wysiwyg');
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [sourceFields, setSourceFields] = useState<Field[]>([]);
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [activeFormattingColIndex, setActiveFormattingColIndex] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Advanced Reporting Engine Modal States
  const [showBandModelModal, setShowBandModelModal] = useState(false);
  const [showLabelThermalModal, setShowLabelThermalModal] = useState(false);
  const [showPdfWorkflowModal, setShowPdfWorkflowModal] = useState(false);
  const [showPrintProfileModal, setShowPrintProfileModal] = useState(false);
  const [showExpressionBuilderModal, setShowExpressionBuilderModal] = useState(false);

  useEffect(() => {
    const unsub = eventBus.subscribe('REPORT_DESIGN_ACTION', (payload: any) => {
      if (payload?.action === 'report_open_band_model') setShowBandModelModal(true);
      if (payload?.action === 'report_open_label_thermal') setShowLabelThermalModal(true);
      if (payload?.action === 'report_open_pdf_workflow') setShowPdfWorkflowModal(true);
    });
    return () => { unsub(); };
  }, []);

  // Initialize Data & Fields based on Source
  useEffect(() => {
    let fields: Field[] = [];
    let data: any[] = [];

    if (report.sourceType === 'table') {
      const table = tables.find((t) => t.id === report.sourceId);
      fields = table?.fields || [];
      data = table?.data || [];
    } else {
      const query = queries.find((q) => q.id === report.sourceId);
      if (query && query.type === 'SELECT') {
        const fieldMap = new Map<string, Field>();
        query.columns.forEach((col) => {
          const table = tables.find((t) => t.id === col.tableId);
          const field = table?.fields.find((f) => f.id === col.fieldId);
          if (field && !fieldMap.has(field.id)) {
            fieldMap.set(field.id, field);
          }
        });
        fields = Array.from(fieldMap.values());
        data = executeSelectQuery(query, tables, relationships);
      }
    }
    setSourceFields(fields);
    setPreviewData(data);

    const currentCols = report.columns || [];
    if (currentCols.length === 0) {
      const initialCols = fields.map((f, i) => ({
        fieldId: f.id,
        label: f.name,
        visible: true,
        order: i,
      }));
      setColumns(initialCols);
      onReportChange({ ...report, columns: initialCols });
    } else {
      setColumns(JSON.parse(JSON.stringify(currentCols)));
    }
  }, [report.id, report.sourceId, report.sourceType, tables, queries, relationships]);

  const syncToReport = (newCols: ReportColumn[]) => {
    setColumns(newCols);
    onReportChange({ ...report, columns: newCols });
  };

  // Drag & Drop for Columns
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === dropIndex) return;

    const newCols = columns.map((c) => ({ ...c }));
    const [movedCol] = newCols.splice(draggedColIndex, 1);
    newCols.splice(dropIndex, 0, movedCol);

    newCols.forEach((col, idx) => {
      col.order = idx;
    });

    syncToReport(newCols);
    setDraggedColIndex(null);
  };

  const toggleVisibility = (index: number) => {
    const newCols = columns.map((c, i) => (i === index ? { ...c, visible: !c.visible } : c));
    syncToReport(newCols);
  };

  const handleLabelChange = (index: number, val: string) => {
    const newCols = columns.map((c, i) => (i === index ? { ...c, label: val } : c));
    setColumns(newCols);
    onReportChange({ ...report, columns: newCols });
  };

  const updateSingleColumn = (index: number, updates: Partial<ReportColumn>) => {
    const newCols = columns.map((c, i) => (i === index ? { ...c, ...updates } : c));
    syncToReport(newCols);
  };

  // Grouping Handlers
  const groupLevels =
    report.groupingFields ||
    (report.groupingFieldId
      ? [{ fieldId: report.groupingFieldId, fieldName: sourceFields.find((f) => f.id === report.groupingFieldId)?.name }]
      : []);

  const handleAddGroupLevel = (fieldId: string) => {
    if (!fieldId) return;
    const field = sourceFields.find((f) => f.id === fieldId);
    const newGroup: GroupLevel = {
      fieldId,
      fieldName: field?.name || '',
      sortOrder: 'asc',
      showHeader: true,
      showFooter: true,
    };
    const updated = [...groupLevels, newGroup];
    onReportChange({
      ...report,
      groupingFields: updated,
      groupingFieldId: updated[0]?.fieldId,
    });
  };

  const handleRemoveGroupLevel = (index: number) => {
    const updated = groupLevels.filter((_, i) => i !== index);
    onReportChange({
      ...report,
      groupingFields: updated,
      groupingFieldId: updated[0]?.fieldId || undefined,
    });
  };

  const handleToggleGroupHeader = (index: number) => {
    const updated = groupLevels.map((g, i) => (i === index ? { ...g, showHeader: !g.showHeader } : g));
    onReportChange({ ...report, groupingFields: updated });
  };

  const handleToggleGroupFooter = (index: number) => {
    const updated = groupLevels.map((g, i) => (i === index ? { ...g, showFooter: !g.showFooter } : g));
    onReportChange({ ...report, groupingFields: updated });
  };

  const handleMoveGroupLevel = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= groupLevels.length) return;
    const updated = [...groupLevels];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    onReportChange({
      ...report,
      groupingFields: updated,
      groupingFieldId: updated[0]?.fieldId,
    });
  };

  // Summaries Handlers
  const handleAddSummary = (fieldId: string, calc: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX') => {
    const field = sourceFields.find((f) => f.id === fieldId);
    if (!field) return;
    const newSummary: ReportSummary = {
      fieldId,
      fieldName: field.name,
      calculation: calc,
    };
    const updated = [...report.summaries, newSummary];
    onReportChange({ ...report, summaries: updated });
  };

  const handleRemoveSummary = (index: number) => {
    const updated = report.summaries.filter((_, i) => i !== index);
    onReportChange({ ...report, summaries: updated });
  };

  const handleRenderTypeChange = (index: number, renderType: any) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], renderType };
    setColumns(updated);
    onReportChange({ ...report, columns: updated });
  };

  // Settings Handlers
  const updateSettings = (key: string, value: any) => {
    onReportChange({
      ...report,
      settings: {
        ...report.settings,
        [key]: value,
      },
    });
  };

  const previewReport: Report = {
    ...report,
    columns: columns,
  };

  return (
    <div className="flex h-full bg-slate-100">
      {/* LEFT: Config Panel */}
      <div className="w-[420px] flex flex-col bg-white border-r border-slate-300 shadow-xl z-10">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
          <div>
            <h2 className="font-extrabold text-base flex items-center gap-2 text-amber-400">
              <Layout size={18} /> Enterprise Report Designer
            </h2>
            <p className="text-[10px] text-slate-400">Banded Sektionen, DIN 5008 & VOB-Engine</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-slate-200 bg-slate-50 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('columns')}
            className={`px-3 py-2.5 text-center flex items-center justify-center gap-1 border-b-2 transition-colors ${
              activeTab === 'columns'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns size={13} /> Spalten
          </button>
          <button
            onClick={() => setActiveTab('grouping')}
            className={`px-3 py-2.5 text-center flex items-center justify-center gap-1 border-b-2 transition-colors ${
              activeTab === 'grouping'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={13} /> Gruppen
          </button>
          <button
            onClick={() => setActiveTab('summaries')}
            className={`px-3 py-2.5 text-center flex items-center justify-center gap-1 border-b-2 transition-colors ${
              activeTab === 'summaries'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator size={13} /> Summen
          </button>
          <button
            onClick={() => setActiveTab('banded')}
            className={`px-3 py-2.5 text-center flex items-center justify-center gap-1 border-b-2 transition-colors ${
              activeTab === 'banded'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={13} /> Sektionen
          </button>
          <button
            onClick={() => setActiveTab('canvas')}
            className={`px-3 py-2.5 text-center flex items-center justify-center gap-1 border-b-2 transition-colors ${
              activeTab === 'canvas'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layout size={13} /> Freiform
          </button>
          <button
            onClick={() => setActiveTab('din5008')}
            className={`px-3 py-2.5 text-center flex items-center justify-center gap-1 border-b-2 transition-colors ${
              activeTab === 'din5008'
                ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={13} /> DIN 5008 / VOB
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-3 py-2.5 text-center flex items-center justify-center gap-1 border-b-2 transition-colors ${
              activeTab === 'advanced'
                ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={13} /> E-Rechnung / Overlay
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2.5 text-center flex items-center justify-center gap-1 border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings size={13} /> Layout
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: SPALTEN & REIHENFOLGE */}
          {activeTab === 'columns' && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Columns size={14} /> Tabellen-Spalten
              </h3>
              <div className="space-y-2">
                {columns.map((col, idx) => (
                  <div
                    key={col.fieldId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                    className={`flex items-center gap-2 p-2 rounded border transition-all ${
                      col.visible ? 'bg-white border-slate-300' : 'bg-slate-50 border-slate-200 opacity-70'
                    } ${draggedColIndex === idx ? 'opacity-50 border-blue-400 border-dashed' : ''}`}
                  >
                    <div className="cursor-move text-slate-400 hover:text-slate-600 p-1">
                      <GripVertical size={14} />
                    </div>
                    <div className="flex-1 grid grid-cols-1 gap-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="truncate">
                          {sourceFields.find((f) => f.id === col.fieldId)?.name || '???'}
                        </span>
                        <select
                          value={col.renderType || 'text'}
                          onChange={(e) => handleRenderTypeChange(idx, e.target.value)}
                          className="bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-slate-700 font-sans"
                        >
                          <option value="text">Text</option>
                          <option value="currency">Währung (€)</option>
                          <option value="date">Datum</option>
                          <option value="badge">Status-Badge</option>
                          <option value="qrcode">QR-Code</option>
                          <option value="barcode">Barcode</option>
                          <option value="image">Bild URL</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        value={col.label}
                        onChange={(e) => handleLabelChange(idx, e.target.value)}
                        className="text-xs font-semibold px-2 py-1 border border-slate-200 rounded bg-white"
                        placeholder="Spaltenbeschriftung"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleVisibility(idx)}
                        className={`p-1.5 rounded transition-colors ${
                          col.visible ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-400 hover:bg-slate-200'
                        }`}
                        title={col.visible ? 'Spalte sichtbar' : 'Spalte ausgeblendet'}
                      >
                        {col.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        onClick={() => setActiveFormattingColIndex(idx)}
                        className={`p-1.5 rounded transition-colors ${
                          col.formattingRules && col.formattingRules.length > 0
                            ? 'text-amber-600 bg-amber-50'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title="Bedingte Formatierung anpassen"
                      >
                        <Palette size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: GRUPPIERUNG */}
          {activeTab === 'grouping' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Layers size={14} /> Gruppierungsebenen (Hierarchie)
                </h3>
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  Definieren Sie hierarchische Gruppen (z.B. Gewerk ➔ Titel ➔ Position).
                </p>

                {/* Add new group selector */}
                <div className="flex gap-2 mb-4">
                  <select
                    id="add-group-select"
                    className="flex-1 border border-slate-300 rounded p-1.5 text-xs bg-white"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      + Feld für neue Gruppierungsebene wählen...
                    </option>
                    {sourceFields
                      .filter((f) => !groupLevels.some((g) => g.fieldId === f.id))
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => {
                      const el = document.getElementById('add-group-select') as HTMLSelectElement;
                      if (el && el.value) {
                        handleAddGroupLevel(el.value);
                        el.value = '';
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"
                  >
                    <Plus size={14} /> Hinzufügen
                  </button>
                </div>

                {/* List of active groups */}
                <div className="space-y-2">
                  {groupLevels.map((group, idx) => (
                    <div
                      key={group.fieldId}
                      className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded font-mono">
                            Ebene {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">{group.fieldName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveGroupLevel(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => handleMoveGroupLevel(idx, 'down')}
                            disabled={idx === groupLevels.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            onClick={() => handleRemoveGroupLevel(idx)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-4 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={group.showHeader !== false}
                            onChange={() => handleToggleGroupHeader(idx)}
                            className="rounded text-blue-600"
                          />
                          <span>Gruppen-Header</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={group.showFooter !== false}
                            onChange={() => handleToggleGroupFooter(idx)}
                            className="rounded text-blue-600"
                          />
                          <span>Gruppen-Footer (Summen)</span>
                        </label>
                      </div>
                    </div>
                  ))}

                  {groupLevels.length === 0 && (
                    <div className="p-4 border-2 border-dashed border-slate-200 text-center text-slate-400 text-xs rounded-lg">
                      Keine Gruppierung aktiv. Alle Datensätze werden flach gerendert.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUMMEN & BERECHNUNGEN */}
          {activeTab === 'summaries' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Calculator size={14} /> Aggregationen & Gesamtergebnisse
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  Wählen Sie Spalten und Berechnungsfunktionen für automatische Summenzeilen.
                </p>

                {/* Add summary selector */}
                <div className="grid grid-cols-12 gap-2 mb-4 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="col-span-6">
                    <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Spalte</label>
                    <select
                      id="summary-field-select"
                      className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white"
                    >
                      {sourceFields.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4">
                    <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Funktion</label>
                    <select
                      id="summary-calc-select"
                      className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white font-mono"
                    >
                      <option value="SUM">SUM (Summe)</option>
                      <option value="COUNT">COUNT (Anzahl)</option>
                      <option value="AVG">AVG (Mittelwert)</option>
                      <option value="MIN">MIN (Minimum)</option>
                      <option value="MAX">MAX (Maximum)</option>
                    </select>
                  </div>
                  <div className="col-span-2 flex items-end">
                    <button
                      onClick={() => {
                        const fieldEl = document.getElementById('summary-field-select') as HTMLSelectElement;
                        const calcEl = document.getElementById('summary-calc-select') as HTMLSelectElement;
                        if (fieldEl && fieldEl.value && calcEl) {
                          handleAddSummary(fieldEl.value, calcEl.value as any);
                        }
                      }}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white p-1.5 rounded text-xs font-bold flex items-center justify-center"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* List active summaries */}
                <div className="space-y-2">
                  {report.summaries.map((sum, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-2xs"
                    >
                      <div>
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded font-mono mr-2">
                          {sum.calculation}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{sum.fieldName}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveSummary(idx)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {report.summaries.length === 0 && (
                    <div className="p-4 border-2 border-dashed border-slate-200 text-center text-slate-400 text-xs rounded-lg">
                      Keine Berechnungen konfiguriert.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BANDED SECTIONS */}
          {activeTab === 'banded' && (
            <BandedSectionManager
              config={report.settings?.bandSections}
              onChange={(conf) => updateSettings('bandSections', conf)}
            />
          )}

          {/* TAB 4b: FREIFORM CANVAS ELEMENTS */}
          {activeTab === 'canvas' && (
            <FreeformCanvasManager
              elements={report.settings?.freeformElements || []}
              onChangeElements={(els) => updateSettings('freeformElements', els)}
              section="reportHeader"
            />
          )}

          {/* TAB 5: DIN 5008 & VOB-ENGINE & SWISS QR */}
          {activeTab === 'din5008' && (
            <Din5008ConfigPanel
              dinConfig={report.settings?.din5008}
              vobConfig={report.settings?.commercialVob}
              epcConfig={report.settings?.epcQrCode}
              swissQrConfig={report.settings?.swissQrCode}
              onChangeDin={(din) => updateSettings('din5008', din)}
              onChangeVob={(vob) => updateSettings('commercialVob', vob)}
              onChangeEpc={(epc) => updateSettings('epcQrCode', epc)}
              onChangeSwissQr={(swiss) => updateSettings('swissQrCode', swiss)}
            />
          )}

          {/* TAB 5b: E-RECHNUNG (ZUGFeRD) & BRIEFPAPIER OVERLAY */}
          {activeTab === 'advanced' && (
            <AdvancedReportFeaturesPanel
              zugferdConfig={report.settings?.zugferd}
              stationeryConfig={report.settings?.stationery}
              onChangeZugferd={(zug) => updateSettings('zugferd', zug)}
              onChangeStationery={(stat) => updateSettings('stationery', stat)}
            />
          )}

          {/* TAB 6: LAYOUT & EINSTELLUNGEN */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Settings size={14} /> Berichtslayout
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Untertitel / Kopfzeile</label>
                    <input
                      type="text"
                      value={report.settings?.subtitle || ''}
                      onChange={(e) => updateSettings('subtitle', e.target.value)}
                      placeholder="z.B. Monatlicher Finanzbericht Q3"
                      className="w-full border border-slate-300 rounded p-2"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <LogoUploadField
                      logoUrl={report.settings?.companyLogoUrl || ''}
                      onLogoUrlChange={(url) => updateSettings('companyLogoUrl', url)}
                      logoPosition={report.settings?.logoPosition || 'left'}
                      onLogoPositionChange={(pos) => updateSettings('logoPosition', pos)}
                      label="Bericht-Firmenlogo (SVG, PNG, JPG)"
                      helperText="Wird im Berichtskopf & Drucklayout eingefügt."
                      showPositionSelector={true}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={report.settings?.showReportHeader !== false}
                        onChange={(e) => updateSettings('showReportHeader', e.target.checked)}
                      />
                      <span className="font-semibold text-slate-800">Berichtskopf anzeigen</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={report.settings?.showPageFooter !== false}
                        onChange={(e) => updateSettings('showPageFooter', e.target.checked)}
                      />
                      <span className="font-semibold text-slate-800">Seitenfuss (Seitenzahlen) anzeigen</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!report.settings?.zebraStriping}
                        onChange={(e) => updateSettings('zebraStriping', e.target.checked)}
                      />
                      <span className="font-semibold text-slate-800">Wechselnde Zeilenfarben (Zebra)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!report.settings?.showGridlines}
                        onChange={(e) => updateSettings('showGridlines', e.target.checked)}
                      />
                      <span className="font-semibold text-slate-800">Gitterlinien anzeigen</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!report.settings?.pageBreakAfterGroup}
                        onChange={(e) => updateSettings('pageBreakAfterGroup', e.target.checked)}
                      />
                      <span className="font-semibold text-slate-800">Seitenumbruch nach jeder Gruppe</span>
                    </label>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-slate-700 font-bold mb-1">Ausrichtung</label>
                    <select
                      value={report.settings?.orientation || 'portrait'}
                      onChange={(e) => updateSettings('orientation', e.target.value)}
                      className="w-full border border-slate-300 rounded p-2"
                    >
                      <option value="portrait">Hochformat (Portrait)</option>
                      <option value="landscape">Querformat (Landscape)</option>
                    </select>
                  </div>

                  {/* Unterbericht (Sub-Report) Configuration */}
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1">
                      <Layers size={14} className="text-blue-600" /> Unterbericht (1:N Details)
                    </h4>
                    <select
                      value={report.subReport?.reportId || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          onReportChange({ ...report, subReport: undefined });
                        } else {
                          onReportChange({
                            ...report,
                            subReport: {
                              reportId: val,
                              foreignKeyFieldId: report.subReport?.foreignKeyFieldId || '',
                              parentKeyFieldId: report.subReport?.parentKeyFieldId || sourceFields[0]?.id || '',
                            },
                          });
                        }
                      }}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs"
                    >
                      <option value="">Kein Unterbericht eingebunden</option>
                      {allReports
                        .filter((r) => r.id !== report.id)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER: WYSIWYG Canvas or Live Preview */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-slate-900 p-2 text-xs text-slate-300 border-b border-slate-800 shrink-0 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400 uppercase tracking-wide">Ansichtsmodus:</span>
            <div className="flex rounded-md bg-slate-800 p-0.5 border border-slate-700">
              <button
                onClick={() => setViewMode('wysiwyg')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'wysiwyg'
                    ? 'bg-amber-500 text-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                📐 WYSIWYG Entwurfsansicht
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                📄 Seitenansicht (Preview)
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                🎛️ Geteilt (Split)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExpressionBuilderModal(true)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Calculator size={13} /> Formel-Generator
            </button>
            <button
              onClick={() => setShowPrintProfileModal(true)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <FileText size={13} /> OS Druck-Manager
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto relative bg-slate-900/90">
          {viewMode === 'wysiwyg' && (
            <WysiwygBandedReportDesigner
              report={previewReport}
              sourceFields={sourceFields}
              sampleData={previewData}
              onReportChange={onReportChange}
            />
          )}

          {viewMode === 'preview' && (
            <div className="p-4 max-w-5xl mx-auto h-full">
              <ReportView
                report={previewReport}
                data={previewData}
                sourceFields={sourceFields}
                allTables={tables}
                relationships={relationships}
                allReports={allReports}
                allQueries={queries}
              />
            </div>
          )}

          {viewMode === 'split' && (
            <div className="grid grid-cols-2 h-full gap-2 p-2">
              <div className="h-full border-r border-slate-800 overflow-y-auto">
                <WysiwygBandedReportDesigner
                  report={previewReport}
                  sourceFields={sourceFields}
                  sampleData={previewData}
                  onReportChange={onReportChange}
                />
              </div>
              <div className="h-full overflow-y-auto bg-slate-200 p-2 rounded">
                <ReportView
                  report={previewReport}
                  data={previewData}
                  sourceFields={sourceFields}
                  allTables={tables}
                  relationships={relationships}
                  allReports={allReports}
                  allQueries={queries}
                />
              </div>
            </div>
          )}
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

      {/* Advanced Reporting Engine Modals */}
      {showBandModelModal && (
        <BandModelEditorModal
          isOpen={showBandModelModal}
          onClose={() => setShowBandModelModal(false)}
          onSaveBands={(bands) => {
            updateSettings('bands', bands);
          }}
        />
      )}

      {showLabelThermalModal && (
        <LabelThermalPrintModal
          isOpen={showLabelThermalModal}
          onClose={() => setShowLabelThermalModal(false)}
        />
      )}

      {showPdfWorkflowModal && (
        <PdfExportWorkflowModal
          isOpen={showPdfWorkflowModal}
          onClose={() => setShowPdfWorkflowModal(false)}
          reportTitle={report.name || 'Ausgangsrechnung_2026_001'}
        />
      )}

      {showPrintProfileModal && (
        <CrossPlatformPrintDialogModal
          isOpen={showPrintProfileModal}
          onClose={() => setShowPrintProfileModal(false)}
          report={previewReport}
          pageCount={1}
          onExecutePrint={() => {
            if (typeof window !== 'undefined') {
              window.print();
            }
          }}
          onExportPdfA={(compliance) => {
            setShowPdfWorkflowModal(true);
          }}
        />
      )}

      {showExpressionBuilderModal && (
        <ExpressionBuilderModal
          isOpen={showExpressionBuilderModal}
          onClose={() => setShowExpressionBuilderModal(false)}
          initialExpression="=Summe([Betrag])"
          sourceFields={sourceFields}
          sampleData={previewData}
          onApplyExpression={(expr) => {
            console.log('Expression applied:', expr);
          }}
        />
      )}
    </div>
  );
};
