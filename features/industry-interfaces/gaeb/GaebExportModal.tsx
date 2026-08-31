import React, { useState } from 'react';
import { Download, CheckCircle2, AlertTriangle, X, ShieldCheck, FileCode, Copy, Check } from 'lucide-react';
import { GaebProjectDoc } from './gaebTypes';
import { GaebExporter, GaebSchemaValidationResult } from './gaebExporter';

interface GaebExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: GaebProjectDoc;
}

export const GaebExportModal: React.FC<GaebExportModalProps> = ({
  isOpen,
  onClose,
  doc,
}) => {
  const [selectedPhase, setSelectedPhase] = useState<'83' | '84'>('84');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generatedXml = selectedPhase === '83'
    ? GaebExporter.generateX83Xml(doc)
    : GaebExporter.generateX84Xml(doc);

  const validationResult: GaebSchemaValidationResult = GaebExporter.validateGaebXmlSchema(generatedXml);

  const handleDownload = () => {
    const filename = `${doc.projectNumber || 'gaeb_lv'}.X${selectedPhase}`;
    const blob = new Blob([generatedXml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">GAEB DA XML 3.3 Re-Export</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Strukturierte Erzeugung valider X83 (Ausschreibung) &amp; X84 (Angebotsabgabe) Dateien
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase Selector & Schema Status */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPhase('83')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedPhase === '83'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                }`}
              >
                <span>Phase X83 (Angebotsaufforderung / Blanko-LV)</span>
              </button>
              <button
                onClick={() => setSelectedPhase('84')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedPhase === '84'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                }`}
              >
                <span>Phase X84 (Angebotsabgabe mit Preisen)</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-500">
              DA XML 3.3 Schema Compliant
            </span>
          </div>

          {/* Schema Validation Banner */}
          <div className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
            validationResult.isValid
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}>
            {validationResult.isValid ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-[11px] space-y-1">
              <div className="font-bold flex items-center gap-2">
                <span>{validationResult.isValid ? 'Schema-Validierung erfolgreich bestanden' : 'Schema-Validierungswarnungen gefunden'}</span>
                <span className="bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded font-mono text-[10px]">
                  DA XML {validationResult.version} / X{selectedPhase}
                </span>
              </div>
              <div>
                Geprüft: {validationResult.elementCounts.sections} Gewerke, {validationResult.elementCounts.positions} Positionen ({validationResult.elementCounts.itemsWithPrice} mit Einheitspreis).
              </div>
              {validationResult.errors.length > 0 && (
                <div className="text-rose-600 dark:text-rose-400 font-semibold">
                  Fehler: {validationResult.errors.join(' | ')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* XML Viewer */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-950 text-emerald-400 font-mono text-[11px] leading-relaxed">
          <pre className="whitespace-pre-wrap">{generatedXml}</pre>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="text-xs text-slate-500">
            Datei: <span className="font-mono font-semibold">{doc.projectNumber || 'gaeb'}.X{selectedPhase}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopiert' : 'XML Kopieren'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>GAEB X{selectedPhase} Herunterladen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
