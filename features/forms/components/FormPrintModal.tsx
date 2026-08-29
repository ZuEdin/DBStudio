import React, { useState, useRef } from 'react';
import { Form, Table, FormElement, FormPrintSettings } from '../../../types/index';
import { Printer, Download, X, Copy, Check, FileText, Settings2, Layout, Building2, Calendar, User, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { eventBus } from '../../../services/eventBus';

interface FormPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form;
  currentRecord: Record<string, any>;
  sourceTable?: Table;
  allTables?: Table[];
  allForms?: Form[];
}

export const FormPrintModal: React.FC<FormPrintModalProps> = ({
  isOpen,
  onClose,
  form,
  currentRecord,
  sourceTable,
  allTables = [],
  allForms = [],
}) => {
  const [settings, setSettings] = useState<FormPrintSettings>({
    paperFormat: 'a4',
    orientation: 'portrait',
    showLetterhead: true,
    companyName: 'Musterbau Enterprise GmbH',
    companySubtitle: 'Digitale Bauakte & Bauleitung • Berlin',
    footerText: 'Vertraulich • Erstellt mit DB-Studio Pro Enterprise Form Engine',
    showTimestamp: true,
    showUserStamp: true,
    includeSubformTables: true,
    columnsPerRow: 2,
    ...(form.settings as any)?.printSettings,
  });

  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Flatten form elements for printable key-value pairs
  const printableFields: Array<{ label: string; value: any; width?: string; type?: string }> = [];
  const collectPrintableFields = (el?: FormElement) => {
    if (!el) return;
    if (el.type === 'field' && el.fieldId) {
      const fieldObj = sourceTable?.fields.find((f) => f.id === el.fieldId || f.name === el.fieldId);
      const fieldName = fieldObj?.name || el.fieldId;
      const label = el.label || fieldObj?.name || fieldName;
      const val = currentRecord[fieldName] ?? currentRecord[el.fieldId] ?? '';
      printableFields.push({
        label,
        value: typeof val === 'boolean' ? (val ? 'Ja' : 'Nein') : String(val ?? ''),
        width: el.width,
        type: el.widgetType || fieldObj?.type,
      });
    }
    if (el.children) {
      el.children.forEach(collectPrintableFields);
    }
  };
  collectPrintableFields(form.layout);

  // If no fields found in layout, fallback to table fields
  if (printableFields.length === 0 && sourceTable) {
    sourceTable.fields.forEach((f) => {
      const val = currentRecord[f.name];
      printableFields.push({
        label: f.name,
        value: typeof val === 'boolean' ? (val ? 'Ja' : 'Nein') : String(val ?? ''),
        type: f.type,
      });
    });
  }

  // Collect Subform data for printing
  const subformTablesData: Array<{ subformName: string; columns: string[]; rows: any[][] }> = [];
  if (settings.includeSubformTables && form.layout) {
    const collectSubforms = (el?: FormElement) => {
      if (!el) return;
      if (el.type === 'subform' && el.subform) {
        const subDef = allForms.find((f) => f.id === el.subform!.formId);
        const subTable = allTables.find((t) => t.id === subDef?.sourceId);
        if (subTable) {
          const masterFieldObj = sourceTable?.fields.find(
            (f) => f.id === el.subform!.masterLinkFieldId || f.name === el.subform!.masterLinkFieldId
          );
          const masterFieldName = masterFieldObj?.name || el.subform!.masterLinkFieldId;
          const masterVal = currentRecord[masterFieldName] ?? currentRecord.id;

          const childFieldObj = subTable.fields.find(
            (f) => f.id === el.subform!.childLinkFieldId || f.name === el.subform!.childLinkFieldId
          );
          const childFieldName = childFieldObj?.name || el.subform!.childLinkFieldId;

          const linkedRows = (subTable.data || []).filter(
            (r) => String(r[childFieldName] ?? '') === String(masterVal ?? '')
          );

          const cols = subTable.fields.filter((f) => !f.isPrimaryKey && f.name !== childFieldName).slice(0, 6);
          const rows = linkedRows.map((r) => cols.map((c) => String(r[c.name] ?? '')));

          if (rows.length > 0) {
            subformTablesData.push({
              subformName: el.label || subDef?.name || subTable.name,
              columns: cols.map((c) => c.name),
              rows,
            });
          }
        }
      }
      if (el.children) {
        el.children.forEach(collectSubforms);
      }
    };
    collectSubforms(form.layout);
  }

  const handleNativePrint = () => {
    eventBus.publishFormPrint({
      formId: form.id,
      formName: form.name,
      record: currentRecord,
      printSettings: settings,
      timestamp: Date.now(),
    });
    window.print();
  };

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: settings.orientation || 'portrait',
        unit: 'mm',
        format: settings.paperFormat || 'a4',
      });

      let yPos = 20;

      // Header
      if (settings.showLetterhead) {
        doc.setFontSize(16);
        doc.setTextColor(30, 41, 59);
        doc.text(settings.companyName || 'Musterbau Enterprise GmbH', 15, yPos);

        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(settings.companySubtitle || 'Formulardruck', 15, yPos + 6);

        yPos += 16;
        doc.setDrawColor(226, 232, 240);
        doc.line(15, yPos, doc.internal.pageSize.width - 15, yPos);
        yPos += 8;
      }

      // Title & Reference
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(form.name, 15, yPos);

      const recordRef = currentRecord.id || currentRecord.ID || currentRecord.Belegnummer || currentRecord.Name || '';
      if (recordRef) {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Datensatz: ${recordRef}`, doc.internal.pageSize.width - 15, yPos, { align: 'right' });
      }

      yPos += 8;

      // Print timestamp
      if (settings.showTimestamp) {
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Gedruckt am: ${new Date().toLocaleString('de-DE')} von: admin`, 15, yPos);
        yPos += 8;
      }

      // Fields AutoTable
      const fieldRows = printableFields.map((f) => [f.label, f.value]);
      autoTable(doc, {
        startY: yPos,
        head: [['Feldbezeichnung', 'Wert']],
        body: fieldRows,
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 2.5 },
        columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold', textColor: [71, 85, 105] } },
        margin: { left: 15, right: 15 },
      });

      let nextY = (doc as any).lastAutoTable.finalY + 12;

      // Subform Tables
      subformTablesData.forEach((sub) => {
        if (nextY > doc.internal.pageSize.height - 40) {
          doc.addPage();
          nextY = 20;
        }

        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text(`Unterformular: ${sub.subformName}`, 15, nextY);
        nextY += 4;

        autoTable(doc, {
          startY: nextY,
          head: [sub.columns],
          body: sub.rows,
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
          styles: { fontSize: 8, cellPadding: 2 },
          margin: { left: 15, right: 15 },
        });

        nextY = (doc as any).lastAutoTable.finalY + 10;
      });

      // Footer
      if (settings.footerText) {
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `${settings.footerText} | Seite ${i} von ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }
      }

      const safeName = form.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      doc.save(`${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('[FormPrintModal] Error generating PDF:', err);
      alert('Fehler bei der PDF-Generierung.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopyText = () => {
    const textSummary = `${form.name}\n${'='.repeat(form.name.length)}\n` +
      printableFields.map((f) => `${f.label}: ${f.value}`).join('\n');
    navigator.clipboard.writeText(textSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Printer className="text-indigo-400" size={20} />
            <div>
              <h2 className="text-sm font-bold tracking-tight">Formular-Druck & PDF-Export</h2>
              <p className="text-[11px] text-slate-300 font-medium">DIN A4 optimierte Belegansicht mit Druckvorschau</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              id="btn-copy-form-text"
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              title="Daten als Text in Zwischenablage kopieren"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
            </button>
            <button
              onClick={handleExportPdf}
              id="btn-export-form-pdf"
              disabled={isExportingPdf}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Download size={14} />
              <span>{isExportingPdf ? 'Exportiere...' : 'PDF Herunterladen'}</span>
            </button>
            <button
              onClick={handleNativePrint}
              id="btn-trigger-form-print"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer size={14} />
              <span>Drucken</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors ml-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Print Settings Toolbar */}
          <div className="w-72 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-4 overflow-y-auto shrink-0 space-y-4 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              <Settings2 size={14} />
              <span>Druckoptionen</span>
            </div>

            {/* Layout Orientation */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-600 dark:text-slate-300">Ausrichtung</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, orientation: 'portrait' }))}
                  className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                    settings.orientation === 'portrait'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Hochformat
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, orientation: 'landscape' }))}
                  className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                    settings.orientation === 'landscape'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Querformat
                </button>
              </div>
            </div>

            {/* Grid Columns */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-600 dark:text-slate-300">Feldspalten im Druck</label>
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3].map((colNum) => (
                  <button
                    key={colNum}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, columnsPerRow: colNum as any }))}
                    className={`py-1.5 rounded-lg border text-center font-semibold transition-all ${
                      settings.columnsPerRow === colNum
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {colNum} {colNum === 1 ? 'Spalte' : 'Spalten'}
                  </button>
                ))}
              </div>
            </div>

            {/* Header / Letterhead settings */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.showLetterhead}
                  onChange={(e) => setSettings((s) => ({ ...s, showLetterhead: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Briefkopf / Logo andrucken</span>
              </label>

              {settings.showLetterhead && (
                <div className="space-y-2 pl-6">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Firmenname</span>
                    <input
                      type="text"
                      value={settings.companyName || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, companyName: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Untertitel / Standort</span>
                    <input
                      type="text"
                      value={settings.companySubtitle || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, companySubtitle: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800 font-medium"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Metadata stamps */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.showTimestamp}
                  onChange={(e) => setSettings((s) => ({ ...s, showTimestamp: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Druckdatum & Zeitstempel</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.includeSubformTables}
                  onChange={(e) => setSettings((s) => ({ ...s, includeSubformTables: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Unterformulare andrucken</span>
              </label>
            </div>

            {/* Footer Text */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Fußzeilentext</span>
              <input
                type="text"
                value={settings.footerText || ''}
                onChange={(e) => setSettings((s) => ({ ...s, footerText: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Right: DIN-A4 Live Preview */}
          <div className="flex-1 bg-slate-200 dark:bg-slate-900 p-6 overflow-y-auto flex justify-center">
            <div
              ref={printAreaRef}
              id="form-print-document"
              className={`bg-white text-slate-900 shadow-xl border border-slate-300 p-10 font-sans transition-all print:m-0 print:p-0 print:border-none print:shadow-none ${
                settings.orientation === 'landscape' ? 'w-[297mm] min-h-[210mm]' : 'w-[210mm] min-h-[297mm]'
              }`}
            >
              {/* Header */}
              {settings.showLetterhead && (
                <div className="border-b border-slate-300 pb-4 mb-6 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 size={20} className="text-slate-800" />
                      <h1 className="text-lg font-black text-slate-900 tracking-tight">{settings.companyName}</h1>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{settings.companySubtitle}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500 space-y-0.5">
                    <p className="font-semibold text-slate-800">Formular-Beleg</p>
                    <p>DIN 5008 konform</p>
                  </div>
                </div>
              )}

              {/* Form Title & Record ID */}
              <div className="mb-6 flex justify-between items-end border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{form.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quelle: {sourceTable?.name || 'Tabelle'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
                    ID: {currentRecord.id || currentRecord.ID || currentRecord.Belegnummer || 'DATENSATZ'}
                  </span>
                  {settings.showTimestamp && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      {new Date().toLocaleDateString('de-DE')} • {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>

              {/* Fields Grid */}
              <div
                className={`grid gap-4 mb-8 ${
                  settings.columnsPerRow === 1 ? 'grid-cols-1' : settings.columnsPerRow === 3 ? 'grid-cols-3' : 'grid-cols-2'
                }`}
              >
                {printableFields.map((field, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-lg break-inside-avoid"
                  >
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {field.label}
                    </span>
                    <span className="block text-sm font-semibold text-slate-800 font-mono break-words">
                      {field.value !== '' ? field.value : <span className="text-slate-300 font-normal italic">—</span>}
                    </span>
                  </div>
                ))}
              </div>

              {/* Subform Tables */}
              {subformTablesData.map((sub, sIdx) => (
                <div key={sIdx} className="mb-6 break-inside-avoid">
                  <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <FileText size={14} className="text-indigo-600" />
                    <span>{sub.subformName}</span>
                    <span className="text-xs font-normal text-slate-400">({sub.rows.length} Positionen)</span>
                  </h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          {sub.columns.map((c, cIdx) => (
                            <th key={cIdx} className="p-2 border-r border-slate-200 last:border-r-0">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sub.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-slate-200 last:border-b-0 even:bg-slate-50/50">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2 border-r border-slate-200 last:border-r-0 font-medium text-slate-800">
                                {cell || '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Footer */}
              {settings.footerText && (
                <div className="mt-12 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
                  <p>{settings.footerText}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
