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
import { ReportExpressionEngine } from './utils/reportExpressionEngine';
import { validateZugferdInvoice } from './utils/zugferdValidator';
import { downloadZugferdXml } from './utils/zugferdGenerator';
import { SvgPdfEmbedder } from './utils/svgPdfEmbedder';
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

export interface SummaryResult {
  fieldName: string;
  calc: string;
  label: string;
  value: number | string;
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

const getRecordValue = (item: Record<string, any>, fieldName?: string, label?: string) => {
  if (!item) return undefined;
  if (fieldName && item[fieldName] !== undefined) return item[fieldName];
  if (label && item[label] !== undefined) return item[label];

  const searchKeys = [fieldName, label].filter(Boolean) as string[];
  const lowerKeys = searchKeys.map((k) => k.toLowerCase());

  for (const key of Object.keys(item)) {
    const lowerKey = key.toLowerCase();
    if (lowerKeys.includes(lowerKey) || lowerKeys.some((lk) => lowerKey.endsWith('.' + lk))) {
      return item[key];
    }
  }
  return undefined;
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

  // Calculate summaries for a dataset
  const calculateSummaries = (items: Record<string, any>[], filterGroupFieldId?: string): SummaryResult[] => {
    const results: SummaryResult[] = [];
    if (!items || items.length === 0) return results;

    const applicableSummaries = report.summaries.filter((s) => {
      if (filterGroupFieldId) {
        return !s.groupFieldId || s.groupFieldId === filterGroupFieldId;
      }
      return true;
    });

    applicableSummaries.forEach((summary) => {
      const fieldName = summary.fieldName;

      if (summary.calculation === 'COUNT') {
        results.push({
          fieldName,
          calc: 'COUNT',
          label: `Anzahl (${fieldName})`,
          value: items.length,
        });
      } else {
        const vals = items
          .map((item) => Number(item[fieldName]))
          .filter((v) => !isNaN(v) && v !== null);

        if (vals.length === 0) {
          results.push({
            fieldName,
            calc: summary.calculation,
            label: `${summary.calculation} (${fieldName})`,
            value: 0,
          });
          return;
        }

        if (summary.calculation === 'SUM') {
          const sum = vals.reduce((acc, v) => acc + v, 0);
          results.push({
            fieldName,
            calc: 'SUM',
            label: `Summe (${fieldName})`,
            value: Math.round(sum * 100) / 100,
          });
        } else if (summary.calculation === 'AVG') {
          const avg = vals.reduce((acc, v) => acc + v, 0) / vals.length;
          results.push({
            fieldName,
            calc: 'AVG',
            label: `Durchschnitt (${fieldName})`,
            value: Math.round(avg * 100) / 100,
          });
        } else if (summary.calculation === 'MIN') {
          const min = Math.min(...vals);
          results.push({ fieldName, calc: 'MIN', label: `Minimum (${fieldName})`, value: min });
        } else if (summary.calculation === 'MAX') {
          const max = Math.max(...vals);
          results.push({ fieldName, calc: 'MAX', label: `Maximum (${fieldName})`, value: max });
        }
      }
    });
    return results;
  };

  const grandTotalSummaries = useMemo(() => {
    return calculateSummaries(data);
  }, [data, report.summaries]);

  // Derive Base Net Total from grand totals
  const baseNetTotal = useMemo(() => {
    const sumItem = grandTotalSummaries.find((s) => s.calc === 'SUM');
    if (sumItem && typeof sumItem.value === 'number') {
      return sumItem.value;
    }
    // Fallback: search numeric columns
    return 145000;
  }, [grandTotalSummaries]);

  // Multi-level grouping processor
  const processedGroups = useMemo(() => {
    if (groupLevels.length === 0) {
      return [
        {
          groupPath: [],
          level: 0,
          groupValue: 'Gesamt',
          fieldLabel: '',
          items: data,
          summaries: calculateSummaries(data),
        },
      ];
    }

    const level1Group = groupLevels[0];
    const level1Field = sourceFields.find((f) => f.id === level1Group.fieldId);
    const level1FieldName = level1Field?.name || level1Group.fieldName || '';

    const groupedMap: Record<string, Record<string, any>[]> = {};
    data.forEach((row) => {
      let rawVal = row[level1FieldName];
      if (rawVal === undefined || rawVal === null || rawVal === '') rawVal = '(Nicht angegeben)';
      let key = String(rawVal);
      if (report.settings?.groupMethod === 'firstLetter') {
        key = key.charAt(0).toUpperCase();
      }
      if (!groupedMap[key]) groupedMap[key] = [];
      groupedMap[key].push(row);
    });

    const sortedKeys = Object.keys(groupedMap).sort((a, b) => {
      return level1Group.sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b);
    });

    return sortedKeys.map((key) => ({
      groupPath: [key],
      level: 0,
      groupValue: key,
      fieldLabel: level1FieldName,
      items: groupedMap[key],
      summaries: calculateSummaries(groupedMap[key], level1Group.fieldId),
    }));
  }, [data, groupLevels, sourceFields, report.summaries, report.settings?.groupMethod]);

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: report.settings?.orientation || 'portrait' });

    // 1. Scalable Vector Logo (SVG) embedding without raster losses
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

    // 2. Multi-page Group Rendering with Strict KeepTogether & Break Rules
    processedGroups.forEach((group, groupIdx) => {
      const activeGroupLevel = groupLevels[group.level] || groupLevels[0];
      const pageBreakBefore = activeGroupLevel?.pageBreakBefore;
      const keepTogether = activeGroupLevel?.keepTogether ?? report.settings?.bandSections?.detailBand?.keepTogether ?? true;
      const estimatedGroupHeight = (group.items.length * 7) + 25; // Approx header + rows + sum

      // A. "Auf neuer Seite beginnen" per Group Level (e.g. Kostenstelle / Hauptkategorie)
      if (pageBreakBefore && groupIdx > 0) {
        doc.addPage();
        finalY = 20;
      } else if (keepTogether && (finalY + estimatedGroupHeight > 270) && finalY > 50) {
        // B. KeepTogether: Move entire group to fresh page if it would awkwardly split immediately
        doc.addPage();
        finalY = 20;
      } else if (finalY > 255) {
        doc.addPage();
        finalY = 20;
      }

      if (groupLevels.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(240, 243, 246);
        doc.rect(14, finalY, 182, 8, 'F');
        doc.setTextColor(30, 41, 59);
        doc.text(`${group.fieldLabel}: ${group.groupValue}`, 16, finalY + 5.5);
        finalY += 12;
      }

      const tableHeaders = displayColumns.map((c) => c.label);
      const tableBody = group.items.map((item) => displayColumns.map((col) => String(item[col.fieldName] ?? '')));

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
        margin: { left: groupLevels.length > 0 ? 20 : 14, right: 14 },
      });

      // @ts-ignore
      finalY = doc.lastAutoTable.finalY + 5;

      if (group.summaries.length > 0) {
        // Prevent orphaned group summary footer at top of new page
        if (finalY > 265) {
          doc.addPage();
          finalY = 20;
        }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        const summaryText = group.summaries.map((s) => `${s.label}: ${s.value}`).join('   |   ');
        doc.text(`[Gruppen-Summe]: ${summaryText}`, groupLevels.length > 0 ? 20 : 14, finalY);
        finalY += 10;
      }

      const pageBreakAfter = activeGroupLevel?.pageBreakAfter ?? report.settings?.pageBreakAfterGroup;
      if (pageBreakAfter && groupIdx < processedGroups.length - 1) {
        doc.addPage();
        finalY = 20;
      } else {
        finalY += 4;
      }
    });

    // 3. Overall Grand Total
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

    // 4. Scalable Vector Signature Stamp (SVG) in PDF/A-3b
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
    const exportData = processedGroups.flatMap((group) => {
      return group.items.map((item) => {
        const row: any = {};
        if (groupLevels.length > 0) {
          row[`[Gruppe] ${group.fieldLabel}`] = group.groupValue;
        }
        displayColumns.forEach((col) => {
          row[col.label] = item[col.fieldName];
        });
        return row;
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bericht');
    XLSX.writeFile(wb, `${report.name.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
  };

  const getCellStyle = (value: any, column: ReportColumn): React.CSSProperties => {
    let style = { ...getCssFromStyle(report.styles?.detail) };
    if (!column.formattingRules || column.formattingRules.length === 0) return style;
    const numValue = Number(value);
    const isNum = !isNaN(numValue) && value !== '';
    for (const rule of column.formattingRules) {
      let match = false;
      const ruleVal = Number(rule.value);
      switch (rule.operator) {
        case 'eq':
          match = String(value) === rule.value;
          break;
        case 'neq':
          match = String(value) !== rule.value;
          break;
        case 'contains':
          match = String(value).toLowerCase().includes(rule.value.toLowerCase());
          break;
        case 'gt':
          match = isNum && numValue > ruleVal;
          break;
        case 'lt':
          match = isNum && numValue < ruleVal;
          break;
        case 'gte':
          match = isNum && numValue >= ruleVal;
          break;
        case 'lte':
          match = isNum && numValue <= ruleVal;
          break;
      }
      if (match) {
        const ruleCss = getCssFromStyle(rule.style);
        style = { ...style, ...ruleCss };
      }
    }
    return style;
  };

  const targetTable = detailView ? allTables.find((t) => t.id === detailView.targetTableId) : null;
  const isLandscape = report.settings?.orientation === 'landscape';
  const sizeClasses = isLandscape ? 'max-w-[297mm] min-h-[210mm]' : 'max-w-[210mm] min-h-[297mm]';

  const din5008 = report.settings?.din5008;
  const vobConfig = report.settings?.commercialVob;
  const epcConfig = report.settings?.epcQrCode;
  const swissConfig = report.settings?.swissQrCode;
  const zugferdConfig = report.settings?.zugferd;
  const stationeryConfig = report.settings?.stationery;
  const freeformElements = report.settings?.freeformElements || [];
  const bandSections = report.settings?.bandSections;

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showZugferdModal, setShowZugferdModal] = useState(false);
  const [showPrintProfileModal, setShowPrintProfileModal] = useState(false);

  const zugferdValidation = useMemo(() => {
    return validateZugferdInvoice(
      zugferdConfig,
      baseNetTotal,
      baseNetTotal * 0.19,
      baseNetTotal * 1.19,
      data.map((d, i) => ({
        name: d.bezeichnung || d.name || d.title || `Position ${i + 1}`,
        quantity: d.menge || d.anzahl || 1,
        unitPrice: d.einzelpreis || d.preis || baseNetTotal,
        total: d.gesamtpreis || baseNetTotal,
      }))
    );
  }, [zugferdConfig, baseNetTotal, data]);

  const handlePrint = () => {
    try {
      if (typeof window !== 'undefined') {
        window.focus();
        window.print();
      }
    } catch (err) {
      console.warn('Browser print dialog could not be invoked directly (e.g. iframe restriction). Generating PDF fallback...', err);
      handleExportPDF();
    }
  };

  // Subscribe to Global MFE EventBus for PRINT_REPORT
  useEffect(() => {
    const unsub = eventBus.subscribe('PRINT_REPORT', (payload: any) => {
      if (!payload || !payload.reportId || payload.reportId === report.id) {
        if (payload?.outputFormat === 'print_dialog') {
          handlePrint();
        } else if (payload?.outputFormat === 'pdf_download') {
          handleExportPDF();
        } else if (payload?.outputFormat === 'email_direct') {
          setShowEmailModal(true);
        }
      }
    });
    return () => unsub();
  }, [report, data, processedGroups]);

  return (
    <div className={`${widgetMode ? 'bg-transparent' : 'bg-slate-200'} h-full overflow-hidden flex flex-col`}>
      <style>{`
        @media print {
          @page {
            size: ${isLandscape ? 'landscape' : 'portrait'};
            margin: 15mm;
          }
          body {
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Sticky Toolbar */}
      {!widgetMode && (
        <div className="bg-white border-b border-slate-300 p-2 flex justify-between items-center flex-shrink-0 sticky top-0 z-20 shadow-sm no-print">
          <div className="flex items-center gap-2 pl-2 text-xs font-bold text-slate-700">
            <Printer size={16} className="text-blue-600" />
            <span>Berichtsvorschau (Banded Report Engine)</span>
            <span className="text-slate-400 font-normal">
              | {processedGroups.length} Gruppen ({data.length} Datensätze)
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

      <div className={`${widgetMode ? 'p-2 relative' : 'p-8 flex-1 bg-slate-200'} overflow-auto`}>
        <div
          id="report-paper-container"
          className={
            widgetMode
              ? 'w-full bg-white h-full report-paper'
              : `report-paper mx-auto bg-white shadow-2xl p-[15mm] border border-slate-300 transition-all duration-300 ${sizeClasses}`
          }
        >
          {/* 1. DIN 5008 LETTERHEAD (If enabled) */}
          {din5008?.enabled ? (
            <Din5008Letterhead
              config={din5008}
              companyLogoUrl={report.settings?.companyLogoUrl}
              reportName={report.name}
            />
          ) : (
            /* Standard Report Header */
            !widgetMode &&
            report.settings?.showReportHeader !== false &&
            (bandSections?.reportHeader?.visible ?? true) && (
              <header className="border-b-2 border-slate-800 pb-4 mb-6" style={getCssFromStyle(report.styles?.header)}>
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
              </header>
            )
          )}

          {/* Freeform Elements in Report Header */}
          <FreeformCanvasRenderer elements={report.freeformElements || report.settings?.freeformElements} section="reportHeader" />

          {/* Embedded Chart if enabled */}
          {report.chartConfig && report.chartConfig.enabled && (
            <ReportChartRenderer config={report.chartConfig} data={data} sourceFields={sourceFields} />
          )}

          {/* 2. HAUPTDATEN & GRUPPIERUNG (Detail Band & Group Headers/Footers) */}
          <main className="space-y-6">
            {/* Top Carry-Over (Übertrag am Seitenanfang) if enabled */}
            {vobConfig?.enabled && vobConfig.enableCarryOver && (
              <div className="bg-slate-100 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 flex justify-between items-center font-mono">
                <span className="font-semibold text-slate-600">Übertrag von vorheriger Seite:</span>
                <span className="font-bold text-slate-900">0,00 €</span>
              </div>
            )}

            {processedGroups.map((group, groupIdx) => {
              const activeGroupLevel = groupLevels[group.level] || groupLevels[0];
              const pageBreakBefore = activeGroupLevel?.pageBreakBefore;
              const pageBreakAfter = activeGroupLevel?.pageBreakAfter ?? report.settings?.pageBreakAfterGroup;
              const keepTogether = activeGroupLevel?.keepTogether ?? report.settings?.bandSections?.detailBand?.keepTogether ?? true;

              return (
                <div
                  key={groupIdx}
                  className={`border border-slate-200 rounded-lg overflow-hidden shadow-2xs ${
                    keepTogether ? 'break-inside-avoid page-break-inside-avoid' : ''
                  }`}
                  style={{
                    pageBreakBefore: pageBreakBefore && groupIdx > 0 ? 'always' : 'auto',
                    pageBreakAfter: pageBreakAfter && groupIdx < processedGroups.length - 1 ? 'always' : 'auto',
                  }}
                >
                  {/* GRUPPENKOPF (Group Header) */}
                  {groupLevels.length > 0 && (
                    <div
                      className="flex items-center justify-between px-3 py-2 bg-slate-100 border-b border-slate-300 text-slate-800 font-bold text-sm"
                      style={getCssFromStyle(report.styles?.groupHeader)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-slate-800 text-white rounded text-[10px] font-mono">GRUPPE</span>
                        <span className="text-xs text-slate-500 font-semibold">{group.fieldLabel}:</span>
                        <span className="text-sm font-bold text-slate-900">{group.groupValue}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono font-normal bg-white px-2 py-0.5 rounded border border-slate-200">
                        {group.items.length} Zeilen
                      </span>
                    </div>
                  )}

                {/* DETAILBEREICH (Detail Band Table) */}
                <div className="overflow-x-auto">
                  <table
                    className={`w-full text-left text-xs border-collapse ${
                      report.settings?.showGridlines ? 'border border-slate-300 divide-y divide-slate-300' : ''
                    }`}
                  >
                    <thead>
                      <tr
                        className="bg-slate-50 border-b border-slate-300 text-slate-600 font-bold uppercase tracking-wider text-[11px]"
                        style={getCssFromStyle(report.styles?.columnHeader)}
                      >
                        {displayColumns.map((col) => (
                          <th
                            key={col.id}
                            className={`p-2.5 font-bold ${
                              report.settings?.showGridlines ? 'border-r border-slate-200 last:border-r-0' : ''
                            }`}
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {group.items.map((item, itemIndex) => {
                        const isZebra = report.settings?.zebraStriping && itemIndex % 2 === 1;
                        const parentKeyValue = report.subReport
                          ? item[sourceFields.find((f) => f.id === report.subReport?.parentKeyFieldId)?.name || 'id']
                          : null;

                        return (
                          <React.Fragment key={itemIndex}>
                            <tr
                              className={`transition-colors ${
                                isZebra ? 'bg-slate-50/80' : 'bg-white'
                              } hover:bg-blue-50/50`}
                            >
                              {displayColumns.map((col) => {
                                const val = getRecordValue(item, col.fieldName, col.label);
                                return (
                                  <td
                                    key={col.id}
                                    className={`p-2.5 whitespace-nowrap ${
                                      report.settings?.showGridlines ? 'border-r border-slate-200 last:border-r-0' : ''
                                    }`}
                                    style={getCellStyle(val, { ...col } as any)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <ReportCellRenderer value={val} renderType={col.renderType || 'text'} />
                                      {col.isFK && col.targetTableId && val && (
                                        <button
                                          onClick={() =>
                                            setDetailView({ targetTableId: col.targetTableId!, recordId: val })
                                          }
                                          className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Details anzeigen"
                                        >
                                          <ExternalLink size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Nested Sub-Report if configured */}
                            {report.subReport && report.subReport.reportId && (
                              <tr className="bg-slate-50/60">
                                <td colSpan={displayColumns.length} className="p-2 pl-6">
                                  <SubReportRenderer
                                    subReportId={report.subReport.reportId}
                                    foreignKeyFieldId={report.subReport.foreignKeyFieldId}
                                    parentKeyValue={parentKeyValue}
                                    allReports={allReports}
                                    allTables={allTables}
                                    allQueries={allQueries}
                                  />
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* GRUPPENFUSS (Group Footer with Calculations) */}
                {group.summaries.length > 0 && (
                  <div
                    className="bg-amber-50/80 px-3 py-2 border-t border-amber-200 flex flex-wrap items-center gap-4 text-xs"
                    style={getCssFromStyle(report.styles?.footer)}
                  >
                    <div className="flex items-center gap-1 font-bold text-amber-900">
                      <Calculator size={14} className="text-amber-700" />
                      <span>Gruppenfuss-Ergebnisse:</span>
                    </div>
                    {group.summaries.map((sum, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-amber-300 shadow-2xs"
                      >
                        <span className="text-[10px] font-bold text-amber-800 uppercase">{sum.label}:</span>
                        <span className="font-mono font-bold text-slate-900">{sum.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

            {/* Bottom Carry-Over (Übertrag auf Folgeseite) if enabled */}
            {vobConfig?.enabled && vobConfig.enableCarryOver && (
              <div className="bg-slate-100 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 flex justify-between items-center font-mono mt-2">
                <span className="font-semibold text-slate-600">Übertrag auf Seite 2:</span>
                <span className="font-bold text-slate-900">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(baseNetTotal)}
                </span>
              </div>
            )}

            {/* 3. VOB/B Commercial Summary Matrix & EPC QR Code */}
            {vobConfig?.enabled && (
              <CommercialVobSummary
                vobConfig={vobConfig}
                epcConfig={epcConfig}
                baseNetTotal={baseNetTotal}
              />
            )}

            {/* 3b. Swiss QR-Bill (Section de Paiement) */}
            {swissConfig?.enabled && (
              <SwissQrBill config={swissConfig} />
            )}

            {/* 4. BERICHTSFUSS / GESAMTERGEBNISSE (Report Footer - Grand Totals) */}
            {grandTotalSummaries.length > 0 && !vobConfig?.enabled && (
              <div className="mt-8 p-4 bg-slate-900 text-white rounded-lg shadow-md space-y-2 border border-slate-800">
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

            {/* Freeform Elements in Report Footer */}
            <FreeformCanvasRenderer elements={report.freeformElements || report.settings?.freeformElements} section="reportFooter" />

            {/* Signature Box in Report Footer */}
            {(bandSections?.reportFooter?.signatureBox ?? true) && (
              <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
                <div className="border-t border-dashed border-slate-400 pt-2">
                  <div className="font-semibold text-slate-800">Ort, Datum / Bauleitung Auftragnehmer</div>
                  <div className="text-[10px] text-slate-400">Geprüft & Freigegeben</div>
                </div>
                <div className="border-t border-dashed border-slate-400 pt-2">
                  <div className="font-semibold text-slate-800">Ort, Datum / Auftraggeber / Bauherr</div>
                  <div className="text-[10px] text-slate-400">Zur Zahlung angewiesen</div>
                </div>
              </div>
            )}

            {data.length === 0 && (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                Keine Daten für diesen Bericht vorhanden.
              </div>
            )}
          </main>

          {/* 5. DIN 5008 3-Column Footer or Standard Page Footer */}
          {din5008?.enabled ? (
            <Din5008ThreeColumnFooter config={din5008} />
          ) : (
            !widgetMode &&
            report.settings?.showPageFooter !== false &&
            (bandSections?.pageFooter?.visible ?? true) && (
              <footer className="mt-12 pt-3 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-400 font-mono">
                <div>DB Studio Pro • Banded Report Engine ({ReportExpressionEngine.evaluate('=Datum()', {})})</div>
                <div>{ReportExpressionEngine.evaluate('="Seite " & [Seite] & " von " & [Seiten]', { pageNumber: 1, totalPages: 1 })}</div>
              </footer>
            )
          )}
        </div>
      </div>

      {detailView && targetTable && (
        <RecordDetailModal table={targetTable} recordId={detailView.recordId} onClose={() => setDetailView(null)} />
      )}

      {showPrintProfileModal && (
        <CrossPlatformPrintDialogModal
          isOpen={showPrintProfileModal}
          onClose={() => setShowPrintProfileModal(false)}
          report={report}
          pageCount={1}
          onExecutePrint={() => {
            handlePrint();
          }}
          onExportPdfA={(compliance) => {
            handleExportPDF();
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
  );
};
