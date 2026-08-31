import React, { useState } from 'react';
import {
  Report,
  Field,
  Table,
  Query,
  Relationship,
  ReportColumn,
  GroupLevel,
  FreeformCanvasElement,
} from '../../../types';
import {
  Layers,
  Ruler,
  Plus,
  Trash2,
  Edit3,
  Calculator,
  Eye,
  Settings,
  ChevronDown,
  ChevronRight,
  MoveVertical,
  Maximize2,
  FileText,
  Barcode,
  Image as ImageIcon,
  Type,
  HelpCircle,
} from 'lucide-react';
import { ExpressionBuilderModal } from './ExpressionBuilderModal';
import { ReportExpressionEngine } from '../utils/reportExpressionEngine';

interface WysiwygBandedReportDesignerProps {
  report: Report;
  sourceFields: Field[];
  sampleData?: Record<string, any>[];
  onReportChange: (report: Report) => void;
  onOpenExpressionBuilder?: () => void;
}

export const WysiwygBandedReportDesigner: React.FC<WysiwygBandedReportDesignerProps> = ({
  report,
  sourceFields,
  sampleData = [],
  onReportChange,
}) => {
  const [collapsedBands, setCollapsedBands] = useState<Record<string, boolean>>({});
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [expressionModalTarget, setExpressionModalTarget] = useState<{
    elementId?: string;
    section?: string;
    initialExpr: string;
  } | null>(null);

  // Group Levels
  const groupLevels =
    report.groupingFields ||
    (report.groupingFieldId
      ? [{ fieldId: report.groupingFieldId, fieldName: sourceFields.find((f) => f.id === report.groupingFieldId)?.name }]
      : []);

  const bandConfigs = report.settings?.bandSections || {
    reportHeader: { visible: true, height: 35, coverPage: false },
    pageHeader: { visible: true, height: 20, repeatLogo: true },
    detailBand: { keepTogether: true, alternateZebra: true },
    pageFooter: { visible: true, showPageNumbers: true, printDate: true },
    reportFooter: { visible: true, showGrandTotal: true, signatureBox: true },
  };

  const freeformElements = report.settings?.freeformElements || [];

  const toggleBandCollapse = (bandId: string) => {
    setCollapsedBands((prev) => ({ ...prev, [bandId]: !prev[bandId] }));
  };

  const updateBandConfig = (section: string, key: string, val: any) => {
    const updated = {
      ...bandConfigs,
      [section]: {
        ...(bandConfigs as any)[section],
        [key]: val,
      },
    };
    onReportChange({
      ...report,
      settings: {
        ...report.settings,
        bandSections: updated,
      },
    });
  };

  const addFreeformElement = (
    section: 'reportHeader' | 'pageHeader' | 'detail' | 'pageFooter' | 'reportFooter',
    type: 'label' | 'formula' | 'barcode' | 'image' | 'line',
    defaultContent?: string
  ) => {
    const newElement: FreeformCanvasElement = {
      id: `elem_${Date.now()}`,
      type: type === 'line' ? 'line' : type === 'formula' ? 'formula' : type === 'barcode' ? 'barcode' : type === 'image' ? 'image' : 'label',
      section,
      x: 10,
      y: 5,
      width: type === 'line' ? 180 : 50,
      height: type === 'line' ? 2 : 10,
      content: defaultContent || (type === 'formula' ? '=Summe([Betrag])' : type === 'barcode' ? 'INV-2026-001' : 'Neues Steuerelement'),
      style: {
        fontFamily: 'Arial',
        fontSize: 11,
        color: '#0f172a',
        bold: type === 'formula',
      },
    };

    const updated = [...freeformElements, newElement];
    onReportChange({
      ...report,
      settings: {
        ...report.settings,
        freeformElements: updated,
      },
    });
    setActiveElementId(newElement.id);
  };

  const removeFreeformElement = (id: string) => {
    const updated = freeformElements.filter((e) => e.id !== id);
    onReportChange({
      ...report,
      settings: {
        ...report.settings,
        freeformElements: updated,
      },
    });
  };

  const updateElementContent = (id: string, newContent: string) => {
    const updated = freeformElements.map((e) => (e.id === id ? { ...e, content: newContent } : e));
    onReportChange({
      ...report,
      settings: {
        ...report.settings,
        freeformElements: updated,
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Top Banner / Access Status Bar */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wide">
            <Ruler size={16} />
            <span>MS Access WYSIWYG Bänder-Entwurfsansicht (Banded Canvas)</span>
          </div>
          <span className="bg-slate-800 text-slate-300 text-[11px] px-2 py-0.5 rounded font-mono">
            Raster: 5mm Snapping | DIN A4 ({report.settings?.orientation === 'landscape' ? '297 × 210 mm' : '210 × 297 mm'})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setExpressionModalTarget({
                initialExpr: '=Summe([Betrag])',
              });
            }}
            className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-300 rounded font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Calculator size={13} /> Ausdrucks-Generator öffnen
          </button>
        </div>
      </div>

      {/* Main Band Canvas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/80">
        {/* 1. BERICHTSKOPF (REPORT HEADER) */}
        <div className="border border-blue-500/40 rounded-lg overflow-hidden bg-slate-950/60 shadow-lg">
          <div className="bg-blue-950/80 px-3 py-2 border-b border-blue-500/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleBandCollapse('reportHeader')}
                className="text-blue-400 hover:text-white cursor-pointer"
              >
                {collapsedBands['reportHeader'] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </button>
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
              <span className="font-bold text-xs text-blue-200 uppercase tracking-wider">
                1. Berichtskopf (Report Header)
              </span>
              <span className="text-[10px] text-blue-400 font-mono">(wird einmalig auf Seite 1 ausgegeben)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => addFreeformElement('reportHeader', 'label', 'FIRMENNAME / BERICHTSTITEL')}
                className="px-2 py-0.5 bg-blue-600/30 hover:bg-blue-600/60 border border-blue-500/40 rounded text-[11px] text-blue-200 flex items-center gap-1 cursor-pointer"
              >
                <Type size={12} /> + Titel
              </button>
              <button
                onClick={() => addFreeformElement('reportHeader', 'image', 'https://via.placeholder.com/150x50')}
                className="px-2 py-0.5 bg-blue-600/30 hover:bg-blue-600/60 border border-blue-500/40 rounded text-[11px] text-blue-200 flex items-center gap-1 cursor-pointer"
              >
                <ImageIcon size={12} /> + Logo
              </button>
            </div>
          </div>

          {!collapsedBands['reportHeader'] && (
            <div className="p-4 bg-blue-950/20 border-t border-blue-900/30 min-h-[70px] relative border-dashed border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center justify-between mb-2">
                <span>Elemente im Berichtskopf:</span>
                <span className="font-mono text-slate-500">Höhe: ~35 mm | DIN 5008 Absenderblock aktiv</span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 bg-slate-900 border border-slate-700 rounded text-xs flex justify-between items-center text-slate-300">
                  <div className="flex items-center gap-2">
                    <Type size={14} className="text-blue-400" />
                    <strong>Titel:</strong> {report.name}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Gebunden an [Berichtsname]</span>
                </div>
                {freeformElements
                  .filter((e) => e.section === 'reportHeader')
                  .map((elem) => (
                    <div
                      key={elem.id}
                      className="p-2 bg-slate-900 border border-blue-500/40 rounded flex items-center justify-between text-xs text-blue-100"
                    >
                      <span className="font-mono">{elem.content}</span>
                      <button
                        onClick={() => removeFreeformElement(elem.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. SEITENKOPF (PAGE HEADER) */}
        <div className="border border-cyan-500/40 rounded-lg overflow-hidden bg-slate-950/60 shadow-lg">
          <div className="bg-cyan-950/80 px-3 py-2 border-b border-cyan-500/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleBandCollapse('pageHeader')}
                className="text-cyan-400 hover:text-white cursor-pointer"
              >
                {collapsedBands['pageHeader'] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </button>
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
              <span className="font-bold text-xs text-cyan-200 uppercase tracking-wider">
                2. Seitenkopf (Page Header)
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">(Spaltenüberschriften oben auf jeder Folgeseite)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => addFreeformElement('pageHeader', 'formula', '=Format(Jetzt(); "TT.MM.JJJJ")')}
                className="px-2 py-0.5 bg-cyan-600/30 hover:bg-cyan-600/60 border border-cyan-500/40 rounded text-[11px] text-cyan-200 flex items-center gap-1 cursor-pointer"
              >
                <Calculator size={12} /> + Druckdatum
              </button>
            </div>
          </div>

          {!collapsedBands['pageHeader'] && (
            <div className="p-3 bg-cyan-950/20 border-t border-cyan-900/30 space-y-2">
              <div className="grid grid-cols-6 gap-2 bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px] font-bold text-slate-300">
                {(report.columns || []).filter((c) => c.visible).map((c) => (
                  <div key={c.fieldId} className="truncate border-r border-slate-800 pr-1 last:border-0">
                    {c.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. GRUPPENKOPF (GROUP HEADER) */}
        {groupLevels.map((grp, gIdx) => (
          <div key={grp.fieldId || gIdx} className="border border-amber-500/50 rounded-lg overflow-hidden bg-slate-950/60 shadow-lg">
            <div className="bg-amber-950/80 px-3 py-2 border-b border-amber-500/30 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBandCollapse(`grp_hdr_${gIdx}`)}
                  className="text-amber-400 hover:text-white cursor-pointer"
                >
                  {collapsedBands[`grp_hdr_${gIdx}`] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </button>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <span className="font-bold text-xs text-amber-200 uppercase tracking-wider">
                  Gruppenkopf {gIdx + 1}: [{grp.fieldName || grp.fieldId}]
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  (Sortierung: {grp.sortOrder?.toUpperCase() || 'ASC'} | KeepTogether: Aktiv)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Orphan-Schutz (KeepWithNext): Aktiv</span>
              </div>
            </div>

            {!collapsedBands[`grp_hdr_${gIdx}`] && (
              <div className="p-3 bg-amber-950/20 border-t border-amber-900/30 text-xs text-amber-100 flex items-center justify-between">
                <div className="font-mono bg-slate-900 px-3 py-1.5 rounded border border-amber-500/30">
                  📁 Gruppe: =[{grp.fieldName || grp.fieldId}]
                </div>
                <span className="text-[10px] text-slate-400">Automatischer Gruppen-Umbruch</span>
              </div>
            )}
          </div>
        ))}

        {/* 4. DETAILBEREICH (DETAIL BAND) */}
        <div className="border border-emerald-500/50 rounded-lg overflow-hidden bg-slate-950/60 shadow-lg">
          <div className="bg-emerald-950/80 px-3 py-2 border-b border-emerald-500/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleBandCollapse('detailBand')}
                className="text-emerald-400 hover:text-white cursor-pointer"
              >
                {collapsedBands['detailBand'] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </button>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              <span className="font-bold text-xs text-emerald-200 uppercase tracking-wider">
                4. Detailbereich (Detail Band)
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">(Wird für jeden Datensatz gerendert)</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-[11px] text-emerald-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bandConfigs.detailBand?.alternateZebra ?? true}
                  onChange={(e) => updateBandConfig('detailBand', 'alternateZebra', e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>Zebra-Streifen</span>
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-emerald-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bandConfigs.detailBand?.keepTogether ?? true}
                  onChange={(e) => updateBandConfig('detailBand', 'keepTogether', e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>KeepTogether</span>
              </label>
            </div>
          </div>

          {!collapsedBands['detailBand'] && (
            <div className="p-3 bg-emerald-950/20 border-t border-emerald-900/30 space-y-2">
              <div className="grid grid-cols-6 gap-2 bg-slate-900 p-2 rounded border border-emerald-500/30 text-xs font-mono text-emerald-300">
                {(report.columns || []).filter((c) => c.visible).map((c) => (
                  <div key={c.fieldId} className="truncate bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                    =[{c.label}]
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. GRUPPENFUSS (GROUP FOOTER) */}
        {groupLevels.map((grp, gIdx) => (
          <div key={grp.fieldId || gIdx} className="border border-orange-500/50 rounded-lg overflow-hidden bg-slate-950/60 shadow-lg">
            <div className="bg-orange-950/80 px-3 py-2 border-b border-orange-500/30 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBandCollapse(`grp_ftr_${gIdx}`)}
                  className="text-orange-400 hover:text-white cursor-pointer"
                >
                  {collapsedBands[`grp_ftr_${gIdx}`] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </button>
                <div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div>
                <span className="font-bold text-xs text-orange-200 uppercase tracking-wider">
                  Gruppenfuß {gIdx + 1}: Zwischensummen für [{grp.fieldName || grp.fieldId}]
                </span>
              </div>
              <button
                onClick={() =>
                  setExpressionModalTarget({
                    initialExpr: '=Summe([Betrag])',
                  })
                }
                className="px-2 py-0.5 bg-orange-600/30 hover:bg-orange-600/60 border border-orange-500/40 rounded text-[11px] text-orange-200 flex items-center gap-1 cursor-pointer"
              >
                <Calculator size={12} /> + Zwischensumme
              </button>
            </div>

            {!collapsedBands[`grp_ftr_${gIdx}`] && (
              <div className="p-3 bg-orange-950/20 border-t border-orange-900/30 space-y-2 text-xs">
                <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded border border-orange-500/30 text-orange-300 font-mono">
                  <span>Zwischensumme für Gruppe [{grp.fieldName || grp.fieldId}]:</span>
                  <span className="font-bold">=Summe([Gesamtbetrag])</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 6. SEITENFUSS (PAGE FOOTER) */}
        <div className="border border-indigo-500/40 rounded-lg overflow-hidden bg-slate-950/60 shadow-lg">
          <div className="bg-indigo-950/80 px-3 py-2 border-b border-indigo-500/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleBandCollapse('pageFooter')}
                className="text-indigo-400 hover:text-white cursor-pointer"
              >
                {collapsedBands['pageFooter'] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </button>
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-400"></div>
              <span className="font-bold text-xs text-indigo-200 uppercase tracking-wider">
                6. Seitenfuß (Page Footer)
              </span>
              <span className="text-[10px] text-indigo-400 font-mono">(Seitenzahlen & Übertrag am unteren Rand jeder Seite)</span>
            </div>
            <button
              onClick={() =>
                setExpressionModalTarget({
                  initialExpr: '="Seite " & [Seite] & " von " & [Seiten]',
                })
              }
              className="px-2 py-0.5 bg-indigo-600/30 hover:bg-indigo-600/60 border border-indigo-500/40 rounded text-[11px] text-indigo-200 flex items-center gap-1 cursor-pointer"
            >
              <Calculator size={12} /> + Seitenzahl
            </button>
          </div>

          {!collapsedBands['pageFooter'] && (
            <div className="p-3 bg-indigo-950/20 border-t border-indigo-900/30 flex justify-between items-center text-xs text-indigo-200 font-mono">
              <span className="text-slate-400">=Datum()</span>
              <span className="bg-slate-900 px-3 py-1 rounded border border-indigo-500/40 font-bold">
                ="Seite " & [Seite] & " von " & [Seiten]
              </span>
            </div>
          )}
        </div>

        {/* 7. BERICHTSFUSS (REPORT FOOTER) */}
        <div className="border border-red-500/50 rounded-lg overflow-hidden bg-slate-950/60 shadow-lg">
          <div className="bg-red-950/80 px-3 py-2 border-b border-red-500/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleBandCollapse('reportFooter')}
                className="text-red-400 hover:text-white cursor-pointer"
              >
                {collapsedBands['reportFooter'] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </button>
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <span className="font-bold text-xs text-red-200 uppercase tracking-wider">
                7. Berichtsfuß (Report Footer)
              </span>
              <span className="text-[10px] text-red-400 font-mono">(Gesamtsummen, MwSt.-Split & Unterschriftszeile)</span>
            </div>
            <button
              onClick={() =>
                setExpressionModalTarget({
                  initialExpr: '=Summe([Gesamtpreis])',
                })
              }
              className="px-2 py-0.5 bg-red-600/30 hover:bg-red-600/60 border border-red-500/40 rounded text-[11px] text-red-200 flex items-center gap-1 cursor-pointer"
            >
              <Calculator size={12} /> + Gesamtsumme
            </button>
          </div>

          {!collapsedBands['reportFooter'] && (
            <div className="p-3 bg-red-950/20 border-t border-red-900/30 space-y-2 text-xs">
              <div className="flex justify-between items-center bg-slate-900 px-3 py-2 rounded border border-red-500/40 text-red-200 font-mono">
                <span>GESAMTSUMME DES BERICHTS:</span>
                <span className="font-bold text-sm text-amber-400">=Summe([Gesamtbetrag])</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                <div className="border-t border-slate-600 pt-1 w-48 text-center">Ort, Datum</div>
                <div className="border-t border-slate-600 pt-1 w-48 text-center">Rechtsverbindliche Unterschrift</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expression Builder Modal */}
      {expressionModalTarget && (
        <ExpressionBuilderModal
          isOpen={!!expressionModalTarget}
          onClose={() => setExpressionModalTarget(null)}
          initialExpression={expressionModalTarget.initialExpr}
          sourceFields={sourceFields}
          sampleData={sampleData}
          onApplyExpression={(expr) => {
            if (expressionModalTarget.elementId) {
              updateElementContent(expressionModalTarget.elementId, expr);
            }
          }}
        />
      )}
    </div>
  );
};
