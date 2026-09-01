import React, { useMemo, useState, useEffect } from 'react';
import {
  Report,
  Field,
  ReportColumn,
  TextStyle,
  Table,
  Relationship,
  GroupLevel,
  Query,
  ColumnRenderType,
} from '../../types/index';
import {
  FileText,
  FileSpreadsheet,
  ExternalLink,
  Printer,
  Calculator,
  Building,
  CheckSquare,
  Mail,
  FileCode,
  Layers,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { RecordDetailModal } from '../../components/modals/RecordDetailModal';
import { ReportCellRenderer } from './components/ReportCellRenderer';
import { SubReportRenderer } from './components/SubReportRenderer';
import { ReportChartRenderer } from './components/ReportChartRenderer';
import { Din5008Letterhead, Din5008ThreeColumnFooter } from './components/Din5008Letterhead';
import { CommercialVobSummary } from './components/CommercialVobSummary';
import { SwissQrBill } from './components/SwissQrBill';
import { ReportEmailModal } from './components/ReportEmailModal';
import { FreeformCanvasRenderer } from './components/FreeformCanvasRenderer';
import { ZugferdValidationModal } from './components/ZugferdValidationModal';
import { CrossPlatformPrintDialogModal } from './components/CrossPlatformPrintDialogModal';
import { ReportGroupNodeRenderer } from './components/ReportGroupNodeRenderer';
import { ReportExpressionEngine } from './utils/reportExpressionEngine';
import { validateZugferdInvoice } from './utils/zugferdValidator';
import { downloadZugferdXml } from './utils/zugferdGenerator';
import { SvgPdfEmbedder } from './utils/svgPdfEmbedder';
import {
  buildMultiLevelGroupTree,
  calculateSliceSummaries,
  flattenGroupTreeForExport,
  getRecordFieldValue,
  GroupTreeNode,
  SummaryResult,
} from './utils/groupTreeProcessor';
import { eventBus } from '../../services/eventBus';

interface ReportViewProps {
  report: Report;
  data: Record<string, any>[];
  sourceFields: Field[];
  allTables: Table[];
  relationships: Relationship[];
  allReports?: Report[];
  allQueries?: Query[];
  widgetMode?: boolean;
}

const getCssFromStyle = (style?: TextStyle): React.CSSProperties => {
  if (!style) return {};
  return {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    color: style.color,
    backgroundColor: style.backgroundColor,
    fontWeight: style.bold ? 'bold' : 'normal',
    fontStyle: style.italic ? 'italic' : 'normal',
    textAlign: style.align,
    borderBottom: style.borderBottom ? '1px solid #e2e8f0' : undefined,
  };
};

export const ReportView: React.FC<ReportViewProps> = ({
  report,
  data,
  sourceFields,
  allTables,
  relationships,
  allReports = [],
  allQueries = [],
  widgetMode,
}) => {
  const [detailView, setDetailView] = useState<{ targetTableId: string; recordId: any } | null>(null);

  // Normalize group levels
  const groupLevels = useMemo((): GroupLevel[] => {
    if (report.groupingFields && report.groupingFields.length > 0) {
      return report.groupingFields;
    }
    if (report.groupingFieldId) {
      const field = sourceFields.find((f) => f.id === report.groupingFieldId);
      return [
        {
          fieldId: report.groupingFieldId,
          fieldName: field?.name,
          sortOrder: 'asc',
          showHeader: true,
          showFooter: true,
        },
      ];
    }
    return [];
  }, [report.groupingFields, report.groupingFieldId, sourceFields]);

  // Determine Columns to Display
  const displayColumns = useMemo((): {
    id: string;
    label: string;
    fieldName: string;
    renderType?: ColumnRenderType;
    isFK?: boolean;
    targetTableId?: string;
  }[] => {
    let cols: any[] = [];

    const mapCol = (fieldId: string, label: string, fieldName: string, renderType?: ColumnRenderType) => {
      let isFK = false;
      let targetTableId = undefined;

      if (report.sourceType === 'table') {
        const rel = relationships.find((r) => r.fromTableId === report.sourceId && r.fromFieldId === fieldId);
        if (rel) {
          isFK = true;
          targetTableId = rel.toTableId;
        }
      }
      return { id: fieldId, label, fieldName, renderType, isFK, targetTableId };
    };

    if (report.columns && report.columns.length > 0) {
      cols = report.columns
        .filter((c) => c.visible)
        .sort((a, b) => a.order - b.order)
        .map((c) =>
          mapCol(c.fieldId, c.label, sourceFields.find((f) => f.id === c.fieldId)?.name || '', c.renderType)
        );
    } else {
      cols = sourceFields.map((f) => mapCol(f.id, f.name, f.name));
    }

    const groupFieldIds = new Set(groupLevels.map((g) => g.fieldId));
    if (groupFieldIds.size > 0) {
      return cols.filter((c) => !groupFieldIds.has(c.id));
    }
    return cols;
  }, [report.columns, sourceFields, groupLevels, relationships, report.sourceId, report.sourceType]);

  // Grand totals across all dataset records
  const grandTotalSummaries = useMemo(() => {
    return calculateSliceSummaries(data, report.summaries);
  }, [data, report.summaries]);

  // Base Net Total for VOB summaries
  const baseNetTotal = useMemo(() => {
    const sumItem = grandTotalSummaries.find((s) => s.calc === 'SUM');
    if (sumItem && typeof sumItem.value === 'number') {
      return sumItem.value;
    }
    return 145000;
  }, [grandTotalSummaries]);

  // Multi-level grouping processor (Recursive Tree)
  const groupTree = useMemo(() => {
    return buildMultiLevelGroupTree(
      data,
      groupLevels,
      sourceFields,
      report.summaries,
      report.settings?.groupMethod
    );
  }, [data, groupLevels, sourceFields, report.summaries, report.settings?.groupMethod]);

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: report.settings?.orientation || 'portrait' });

    // Vector Logo
    if (report.settings?.vectorLogoSvg) {
      SvgPdfEmbedder.embedSvg(doc, report.settings.vectorLogoSvg, {
        x: 14,
        y: 10,
        width: 50,
        height: 18,
      });
    }

    const titleX = report.settings?.vectorLogoSvg ? 70 : 14;
    doc.setFontSize(report.styles?.header?.fontSize || 18);
    if (report.styles?.header?.bold) doc.setFont('helvetica', 'bold');
    if (report.styles?.header?.color) doc.setTextColor(report.styles.header.color);
    doc.text(report.name, titleX, 15);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    if (report.settings?.subtitle) {
      doc.text(report.settings.subtitle, titleX, 22);
    }
    doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, titleX, report.settings?.subtitle ? 27 : 22);

    let finalY = Math.max(report.settings?.vectorLogoSvg ? 32 : 28, report.settings?.subtitle ? 34 : 28);

    // Recursively render group tree in PDF
    function renderPdfNode(node: GroupTreeNode) {
      const activeGroupLevel = groupLevels[node.level] || groupLevels[0];
      const pageBreakBefore = activeGroupLevel?.pageBreakBefore;
      const keepTogether = activeGroupLevel?.keepTogether ?? report.settings?.bandSections?.detailBand?.keepTogether ?? true;

      if (pageBreakBefore && finalY > 40) {
        doc.addPage();
        finalY = 20;
      } else if (keepTogether && finalY > 250) {
        doc.addPage();
        finalY = 20;
      }

      // Group Header
      if (groupLevels.length > 0 && (node.config?.showHeader ?? true)) {
        const indentX = 14 + node.level * 6;
        doc.setFontSize(node.level === 0 ? 11 : 10);
        doc.setFont('helvetica', 'bold');
        if (node.level === 0) {
          doc.setFillColor(235, 240, 246);
        } else if (node.level === 1) {
          doc.setFillColor(243, 244, 246);
        } else {
          doc.setFillColor(254, 243, 199);
        }
        doc.rect(indentX, finalY, 182 - node.level * 6, 7, 'F');
        doc.setTextColor(30, 41, 59);
        doc.text(`[Ebene ${node.level + 1}] ${node.fieldLabel}: ${node.groupValue} (${node.totalCount} Zeilen)`, indentX + 2, finalY + 5);
        finalY += 10;
      }

      // If has subgroups, recurse
      if (node.subGroups && node.subGroups.length > 0) {
        node.subGroups.forEach(renderPdfNode);
      } else {
        // Leaf table
        const tableHeaders = displayColumns.map((c) => c.label);
        const tableBody = node.items.map((item) =>
          displayColumns.map((col) => String(getRecordFieldValue(item, col.fieldName, col.label) ?? ''))
        );

        autoTable(doc, {
          startY: finalY,
          head: [tableHeaders],
          body: tableBody,
          theme: report.settings?.showGridlines ? 'grid' : report.settings?.zebraStriping ? 'striped' : 'plain',
          rowPageBreak: report.settings?.keepTableRowsTogether !== false ? 'avoid' : 'auto',
          styles: {
            fontSize: report.styles?.detail?.fontSize || 9,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [226, 232, 240],
            textColor: [51, 65, 85],
            fontStyle: 'bold',
          },
          margin: { left: 14 + (node.level > 0 ? (node.level + 1) * 4 : 0), right: 14 },
        });

        // @ts-ignore
        finalY = doc.lastAutoTable.finalY + 4;
      }

      // Group Footer (summaries isolated to this node!)
      if (groupLevels.length > 0 && (node.config?.showFooter ?? true) && node.summaries.length > 0) {
        if (finalY > 265) {
          doc.addPage();
          finalY = 20;
        }
        const indentX = 14 + node.level * 6;
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        const summaryText = node.summaries.map((s) => `${s.label}: ${s.value}`).join('   |   ');
        doc.text(`[Zwischensumme ${node.fieldLabel}: ${node.groupValue}]: ${summaryText}`, indentX, finalY);
        finalY += 8;
      }
    }

    groupTree.forEach(renderPdfNode);

    // Grand Totals
    if (grandTotalSummaries.length > 0) {
      if (finalY > 245) {
        doc.addPage();
        finalY = 20;
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(226, 232, 240);
      doc.rect(14, finalY, 182, 8, 'F');
      doc.setTextColor(15, 23, 42);
      const text = grandTotalSummaries.map((s) => `${s.label}: ${s.value}`).join('   |   ');
      doc.text(`GESAMTERGEBNIS: ${text}`, 16, finalY + 5.5);
      finalY += 14;
    }

    // Signature Stamp
    if (report.settings?.vectorSignatureSvg) {
      if (finalY > 240) {
        doc.addPage();
        finalY = 20;
      }
      SvgPdfEmbedder.embedSvg(doc, report.settings.vectorSignatureSvg, {
        x: 14,
        y: finalY,
        width: 80,
        height: 25,
      });
    }

    doc.save(`${report.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  };

  const handleExportExcel = () => {
    const exportData = flattenGroupTreeForExport(
      groupTree,
      groupLevels,
      displayColumns.map((c) => ({ label: c.label, fieldName: c.fieldName }))
    );

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bericht');
    XLSX.writeFile(wb, `${report.name.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const isLandscape = report.settings?.orientation === 'landscape';
  const sizeClasses = isLandscape
    ? 'w-[297mm] min-h-[210mm] max-w-none'
    : 'w-[210mm] min-h-[297mm] max-w-none';

  const getCellStyle = (value: any, column: ReportColumn): React.CSSProperties => {
    if (!column.formattingRules || column.formattingRules.length === 0) return {};
    for (const rule of column.formattingRules) {
      let match = false;
      const numVal = Number(value);
      const ruleNum = Number(rule.value);
      switch (rule.operator) {
        case 'eq':
          match = String(value) === rule.value;
          break;
        case 'neq':
          match = String(value) !== rule.value;
          break;
        case 'gt':
          match = !isNaN(numVal) && !isNaN(ruleNum) && numVal > ruleNum;
          break;
        case 'lt':
          match = !isNaN(numVal) && !isNaN(ruleNum) && numVal < ruleNum;
          break;
        case 'gte':
          match = !isNaN(numVal) && !isNaN(ruleNum) && numVal >= ruleNum;
          break;
        case 'lte':
          match = !isNaN(numVal) && !isNaN(ruleNum) && numVal <= ruleNum;
          break;
        case 'contains':
          match = String(value).toLowerCase().includes(rule.value.toLowerCase());
          break;
      }
      if (match) return getCssFromStyle(rule.style);
    }
    return {};
  };

  const targetTable = detailView ? allTables.find((t) => t.id === detailView.targetTableId) : null;
  const din5008 = report.settings?.din5008;
  const vobConfig = report.settings?.commercialVob;
  const swissConfig = report.settings?.swissQrCode;
  const epcConfig = report.settings?.epcQrCode;
  const bandSections = report.settings?.bandSections;
  const zugferdConfig = report.settings?.zugferd;

  const [showPrintProfileModal, setShowPrintProfileModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showZugferdModal, setShowZugferdModal] = useState(false);

  const zugferdValidation = useMemo(() => {
    return validateZugferdInvoice(
      zugferdConfig,
      baseNetTotal,
      baseNetTotal * 0.19,
      baseNetTotal * 1.19,
      data
    );
  }, [zugferdConfig, baseNetTotal, data]);

  useEffect(() => {
    const unsubscribe = eventBus.subscribe('print_report', (payload: any) => {
      if (payload.reportId === report.id) {
        if (payload.outputFormat === 'pdf_download') {
          handleExportPDF();
        } else if (payload.outputFormat === 'email_direct') {
          setShowEmailModal(true);
        } else {
          handlePrint();
        }
      }
    });
    return () => unsubscribe();
  }, [report.id, groupTree, grandTotalSummaries]);

  return (
    <div className={`report-view-container ${widgetMode ? 'bg-transparent' : 'bg-slate-200'} h-full overflow-hidden flex flex-col print:h-auto print:overflow-visible print:bg-white`}>
      <style>{`
        @media print {
          @page {
            size: ${isLandscape ? 'landscape' : 'portrait'};
            margin: 12mm;
          }
          body {
            -webkit-print-color-adjust: exact;
          }
          .app-ribbon-sub,
          .no-print,
          .print\\:hidden,
          [data-no-print],
          [role="dialog"],
          .fixed {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>

      {/* Sticky Toolbar */}
      {!widgetMode && (
        <div className="app-ribbon-sub bg-white border-b border-slate-300 p-2 flex justify-between items-center flex-shrink-0 sticky top-0 z-20 shadow-sm no-print print:hidden">
          <div className="flex items-center gap-2 pl-2 text-xs font-bold text-slate-700">
            <Printer size={16} className="text-blue-600" />
            <span>Berichtsvorschau (Banded Report Engine)</span>
            <span className="text-slate-400 font-normal">
              | {groupLevels.length > 0 ? `${groupLevels.length}-stufig gruppiert` : 'Ohne Gruppierung'} ({data.length} Datensätze)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              title="Bericht direkt per E-Mail versenden"
            >
              <Mail size={14} /> E-Mail
            </button>
            {zugferdConfig?.enabled && (
              <button
                onClick={() => setShowZugferdModal(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold text-xs transition-colors shadow-sm cursor-pointer border ${
                  zugferdValidation.isValid
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-600'
                    : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500 animate-pulse'
                }`}
                title="ZUGFeRD 2.2 / EN 16931 Konformitätsbericht prüfen"
              >
                <FileCode size={14} />
                <span>ZUGFeRD {zugferdValidation.score}%</span>
              </button>
            )}
            <button
              id="report-print-profile-btn"
              onClick={() => setShowPrintProfileModal(true)}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-black font-bold px-3 py-1.5 rounded text-xs transition-all shadow-sm cursor-pointer"
              title="Plattformunabhängiger Druck-Manager (AirPrint, CUPS, Windows Spooler, PDF/A-3b)"
            >
              <Printer size={14} /> OS Druck-Manager
            </button>
            <button
              id="report-print-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white px-3 py-1.5 rounded font-semibold text-xs transition-all shadow-sm cursor-pointer"
              title="Bericht drucken"
            >
              <Printer size={14} /> Drucken
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded font-semibold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <FileSpreadsheet size={14} /> Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded font-semibold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <FileText size={14} /> PDF
            </button>
          </div>
        </div>
      )}

      <div className={`${widgetMode ? 'p-2 relative' : 'p-8 flex-1 bg-slate-200'} overflow-auto print:overflow-visible print:p-0 print:m-0 print:bg-white`}>
        <div
          id="report-paper-container"
          className={
            widgetMode
              ? 'w-full bg-white h-full report-paper'
              : `report-paper mx-auto bg-white shadow-2xl p-[15mm] border border-slate-300 transition-all duration-300 print:shadow-none print:border-none print:p-0 print:m-0 ${sizeClasses}`
          }
        >
          {/* ========================================================= */}
          {/* 1. BERICHTSKOPF (REPORT HEADER)                           */}
          {/* ========================================================= */}
          {din5008?.enabled ? (
            <div className="report-header-band report-section">
              <Din5008Letterhead
                config={din5008}
                companyLogoUrl={report.settings?.companyLogoUrl}
                reportName={report.name}
              />
            </div>
          ) : (
            !widgetMode &&
            report.settings?.showReportHeader !== false &&
            (bandSections?.reportHeader?.visible ?? true) && (
              <div
                className={`report-header-band report-section border-b-2 border-slate-800 pb-4 mb-6 ${
                  bandSections?.reportHeader?.coverPage ? 'break-after-page' : ''
                }`}
                style={getCssFromStyle(report.styles?.header)}
              >
                {report.settings?.logoPosition === 'center' ? (
                  <div className="flex flex-col items-center text-center space-y-2">
                    {report.settings?.companyLogoUrl && (
                      <img
                        src={report.settings.companyLogoUrl}
                        alt="Logo"
                        className="h-12 max-w-[200px] mb-1 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <h1
                      className="text-2xl font-black text-slate-900 tracking-tight"
                      style={{ color: 'inherit', fontSize: 'inherit' }}
                    >
                      {report.name}
                    </h1>
                    {report.settings?.subtitle && (
                      <p className="text-xs text-slate-600 font-medium">{report.settings.subtitle}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-mono pt-1">
                      <span>Datum: {new Date().toLocaleDateString('de-DE')}</span>
                      <span>•</span>
                      <span>
                        Uhrzeit:{' '}
                        {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ) : report.settings?.logoPosition === 'right' ? (
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h1
                        className="text-2xl font-black text-slate-900 tracking-tight"
                        style={{ color: 'inherit', fontSize: 'inherit' }}
                      >
                        {report.name}
                      </h1>
                      {report.settings?.subtitle && (
                        <p className="text-xs text-slate-600 font-medium">{report.settings.subtitle}</p>
                      )}
                      <div className="text-xs text-slate-500 font-mono pt-1">
                        <span>
                          Datum: {new Date().toLocaleDateString('de-DE')} (
                          {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr)
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {report.settings?.companyLogoUrl && (
                        <img
                          src={report.settings.companyLogoUrl}
                          alt="Logo"
                          className="h-12 max-w-[180px] object-contain"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      {report.settings?.companyLogoUrl && (
                        <img
                          src={report.settings.companyLogoUrl}
                          alt="Logo"
                          className="h-12 max-w-[180px] mb-2 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <h1
                        className="text-2xl font-black text-slate-900 tracking-tight"
                        style={{ color: 'inherit', fontSize: 'inherit' }}
                      >
                        {report.name}
                      </h1>
                      {report.settings?.subtitle && (
                        <p className="text-xs text-slate-600 font-medium">{report.settings.subtitle}</p>
                      )}
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold pt-1">
                        BERICHT • SEKTION: BERICHTSKOPF
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500 font-mono">
                      <p className="font-semibold text-slate-700">
                        Datum: {new Date().toLocaleDateString('de-DE')}
                      </p>
                      <p className="text-[10px]">
                        Uhrzeit:{' '}
                        {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* Freeform Elements in Report Header */}
          <FreeformCanvasRenderer elements={report.freeformElements || report.settings?.freeformElements} section="reportHeader" />

          {/* ========================================================= */}
          {/* 2. SEITENKOPF (PAGE HEADER)                               */}
          {/* ========================================================= */}
          {(bandSections?.pageHeader?.visible ?? true) && (
            <div className="report-page-header-band report-section border-b border-slate-300 pb-2 mb-4 flex justify-between items-center text-xs text-slate-600">
              <div className="flex items-center gap-3">
                {(bandSections?.pageHeader?.repeatLogo ?? true) && report.settings?.companyLogoUrl && (
                  <img
                    src={report.settings.companyLogoUrl}
                    alt="Logo"
                    className="h-6 max-w-[100px] object-contain"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="font-bold text-slate-800">{report.name}</span>
                {report.settings?.subtitle && (
                  <span className="text-slate-400">| {report.settings.subtitle}</span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {ReportExpressionEngine.evaluate('=Format(Jetzt(); "TT.MM.JJJJ")', {})}
              </div>
            </div>
          )}

          {/* Freeform Elements in Page Header */}
          <FreeformCanvasRenderer elements={report.freeformElements || report.settings?.freeformElements} section="pageHeader" />

          {/* Embedded Chart if enabled */}
          {report.chartConfig && report.chartConfig.enabled && (
            <ReportChartRenderer config={report.chartConfig} data={data} sourceFields={sourceFields} />
          )}

          {/* ========================================================= */}
          {/* 3. DETAILBEREICH & MEHRSTUFIGE GRUPPIERUNG (Detail Band)  */}
          {/* ========================================================= */}
          <div className="report-detail-section space-y-4">
            {/* Top Carry-Over (Übertrag am Seitenanfang) if enabled */}
            {vobConfig?.enabled && vobConfig.enableCarryOver && (
              <div className="bg-slate-100 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 flex justify-between items-center font-mono">
                <span className="font-semibold text-slate-600">Übertrag von vorheriger Seite:</span>
                <span className="font-bold text-slate-900">0,00 €</span>
              </div>
            )}

            {/* Recursive Multi-Level Group Nodes */}
            {groupTree.map((rootNode) => (
              <ReportGroupNodeRenderer
                key={rootNode.id}
                node={rootNode}
                groupLevelsCount={groupLevels.length}
                displayColumns={displayColumns}
                report={report}
                sourceFields={sourceFields}
                relationships={relationships}
                allReports={allReports}
                allTables={allTables}
                allQueries={allQueries}
                onShowDetail={(tableId, id) => setDetailView({ targetTableId: tableId, recordId: id })}
                getCellStyle={getCellStyle}
                getCssFromStyle={getCssFromStyle}
              />
            ))}

            {/* Freeform Elements in Detail Band */}
            <FreeformCanvasRenderer elements={report.freeformElements || report.settings?.freeformElements} section="detail" />

            {/* Bottom Carry-Over (Übertrag auf Folgeseite) if enabled */}
            {vobConfig?.enabled && vobConfig.enableCarryOver && (
              <div className="bg-slate-100 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 flex justify-between items-center font-mono mt-2">
                <span className="font-semibold text-slate-600">Übertrag auf Folgeseite:</span>
                <span className="font-bold text-slate-900">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(baseNetTotal)}
                </span>
              </div>
            )}

            {/* VOB/B Commercial Summary Matrix & EPC QR Code */}
            {vobConfig?.enabled && (
              <CommercialVobSummary
                vobConfig={vobConfig}
                epcConfig={epcConfig}
                baseNetTotal={baseNetTotal}
              />
            )}

            {/* Swiss QR-Bill */}
            {swissConfig?.enabled && (
              <SwissQrBill config={swissConfig} />
            )}

            {data.length === 0 && (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                Keine Daten für diesen Bericht vorhanden.
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 4. BERICHTSFUSS (REPORT FOOTER)                           */}
          {/* ========================================================= */}
          {!widgetMode &&
            report.settings?.showReportFooter !== false &&
            (bandSections?.reportFooter?.visible ?? true) && (
              <div className="report-footer-band report-section mt-8 pt-4 border-t-2 border-slate-800 space-y-4">
                {/* Grand Totals (Gesamtergebnisse) */}
                {(bandSections?.reportFooter?.showGrandTotal ?? true) &&
                  grandTotalSummaries.length > 0 &&
                  !vobConfig?.enabled && (
                    <div className="p-4 bg-slate-900 text-white rounded-lg shadow-md space-y-2 border border-slate-800">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                          <Calculator size={16} />
                          <span>Berichtsfuss — Gesamtergebnisse ({data.length} Datensätze gesamt)</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 pt-1">
                        {grandTotalSummaries.map((sum, i) => (
                          <div
                            key={i}
                            className="bg-slate-800 px-3 py-1.5 rounded border border-slate-700 flex items-center gap-2"
                          >
                            <span className="text-xs text-slate-300 font-medium">{sum.label}:</span>
                            <span className="text-sm font-bold font-mono text-amber-300">{sum.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Optional Custom Closing Text */}
                {bandSections?.reportFooter?.closingText && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 whitespace-pre-line">
                    {bandSections.reportFooter.closingText}
                  </div>
                )}

                {/* Freeform Elements in Report Footer */}
                <FreeformCanvasRenderer elements={report.freeformElements || report.settings?.freeformElements} section="reportFooter" />

                {/* Signature Box in Report Footer */}
                {(bandSections?.reportFooter?.signatureBox ?? true) && (
                  <div className="pt-4 grid grid-cols-2 gap-8 text-xs text-slate-600">
                    <div className="border-t border-dashed border-slate-400 pt-2">
                      <div className="font-semibold text-slate-800">Ort, Datum / Ersteller / Bauleitung</div>
                      <div className="text-[10px] text-slate-400">Geprüft & Freigegeben</div>
                    </div>
                    <div className="border-t border-dashed border-slate-400 pt-2">
                      <div className="font-semibold text-slate-800">Ort, Datum / Auftraggeber / Prüfer</div>
                      <div className="text-[10px] text-slate-400">Zur Kenntnis genommen & akzeptiert</div>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* ========================================================= */}
          {/* 5. SEITENFUSS (PAGE FOOTER)                               */}
          {/* ========================================================= */}
          {din5008?.enabled ? (
            <div className="report-page-footer-band report-section">
              <Din5008ThreeColumnFooter config={din5008} />
            </div>
          ) : (
            !widgetMode &&
            report.settings?.showPageFooter !== false &&
            (bandSections?.pageFooter?.visible ?? true) && (
              <div className="report-page-footer-band report-section mt-12 pt-3 border-t border-slate-300 flex justify-between items-center text-[11px] text-slate-500 font-mono">
                <div>
                  {(bandSections?.pageFooter?.printDate ?? true)
                    ? `DB Studio Pro • Banded Report Engine (${ReportExpressionEngine.evaluate('=Datum()', {})})`
                    : 'DB Studio Pro • Banded Report Engine'}
                </div>
                <div>
                  {(bandSections?.pageFooter?.showPageNumbers ?? true)
                    ? ReportExpressionEngine.evaluate('="Seite " & [Seite] & " von " & [Seiten]', { pageNumber: 1, totalPages: 1 })
                    : ''}
                </div>
              </div>
            )
          )}

          {/* Freeform Elements in Page Footer */}
          <FreeformCanvasRenderer elements={report.freeformElements || report.settings?.freeformElements} section="pageFooter" />
        </div>
      </div>

      {/* Modals & Dialogs (Excluded from Print) */}
      <div className="no-print print:hidden" data-no-print="true">
        {detailView && targetTable && (
          <RecordDetailModal table={targetTable} recordId={detailView.recordId} onClose={() => setDetailView(null)} />
        )}

        {showPrintProfileModal && (
          <CrossPlatformPrintDialogModal
            isOpen={showPrintProfileModal}
            onClose={() => setShowPrintProfileModal(false)}
            report={report}
            pageCount={1}
            onExecutePrint={(options) => {
              setShowPrintProfileModal(false);
              setTimeout(() => {
                handlePrint();
              }, 120);
            }}
            onExportPdfA={(compliance) => {
              setShowPrintProfileModal(false);
              setTimeout(() => {
                handleExportPDF();
              }, 50);
            }}
          />
        )}

        {showEmailModal && (
          <ReportEmailModal
            reportName={report.name}
            onClose={() => setShowEmailModal(false)}
          />
        )}

        {showZugferdModal && zugferdConfig && (
          <ZugferdValidationModal
            validation={zugferdValidation}
            config={zugferdConfig}
            netTotal={baseNetTotal}
            taxTotal={baseNetTotal * 0.19}
            grossTotal={baseNetTotal * 1.19}
            items={data}
            onClose={() => setShowZugferdModal(false)}
            onExportPdf={handleExportPDF}
          />
        )}
      </div>
    </div>
  );
};
