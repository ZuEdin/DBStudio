import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  Info, 
  X, 
  FileCode, 
  FileCheck, 
  Download, 
  ExternalLink 
} from 'lucide-react';
import { ZugferdValidationResult } from '../utils/zugferdValidator';
import { ZugferdConfig } from '../../../types';
import { downloadZugferdXml } from '../utils/zugferdGenerator';

interface ZugferdValidationModalProps {
  validation: ZugferdValidationResult;
  config: ZugferdConfig;
  netTotal: number;
  taxTotal: number;
  grossTotal: number;
  items?: any[];
  onClose: () => void;
  onExportPdf: () => void;
}

export const ZugferdValidationModal: React.FC<ZugferdValidationModalProps> = ({
  validation,
  config,
  netTotal,
  taxTotal,
  grossTotal,
  items = [],
  onClose,
  onExportPdf
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ERRORS' | 'WARNINGS' | 'PASSED'>('ALL');

  const filteredRules = validation.rules.filter(rule => {
    if (filter === 'ERRORS') return !rule.passed && rule.severity === 'ERROR';
    if (filter === 'WARNINGS') return !rule.passed && rule.severity === 'WARNING';
    if (filter === 'PASSED') return rule.passed;
    return true;
  });

  return (
    <div 
      role="dialog"
      aria-modal="true"
      data-no-print="true"
      className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in no-print print:hidden"
    >
      <div className="bg-slate-900 text-slate-100 rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${validation.isValid ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                ZUGFeRD 2.2 / EN 16931 Live-Validierungsbericht
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                  Profil: {validation.profile}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Automatisierte Schematron- &amp; CEN/TC 434 Konformitätsprüfung für B2B / B2G E-Rechnungen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Score & Summary Banner */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/40 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-black ${validation.isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {validation.score}%
                </span>
                <span className="text-xs uppercase font-bold text-slate-400">Konformitäts-Index</span>
                {validation.isXRechnungCompliant && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 size={12} /> XRechnung &amp; ZRE Bereit
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                {validation.summary}
              </p>
            </div>

            {/* Metric Pills */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${filter === 'ALL' ? 'bg-slate-700 text-white border-slate-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
              >
                Alle ({validation.totalChecks})
              </button>
              <button
                onClick={() => setFilter('PASSED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${filter === 'PASSED' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-emerald-950/40 text-emerald-400 border-emerald-800 hover:bg-emerald-900/40'}`}
              >
                Bestanden ({validation.passedCount})
              </button>
              {validation.errorCount > 0 && (
                <button
                  onClick={() => setFilter('ERRORS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${filter === 'ERRORS' ? 'bg-rose-600 text-white border-rose-400' : 'bg-rose-950/40 text-rose-400 border-rose-800 hover:bg-rose-900/40'}`}
                >
                  Fehler ({validation.errorCount})
                </button>
              )}
              {validation.warningCount > 0 && (
                <button
                  onClick={() => setFilter('WARNINGS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${filter === 'WARNINGS' ? 'bg-amber-600 text-white border-amber-400' : 'bg-amber-950/40 text-amber-400 border-amber-800 hover:bg-amber-900/40'}`}
                >
                  Hinweise ({validation.warningCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rule List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {filteredRules.map((rule) => {
            let badgeBg = 'bg-emerald-950/40 text-emerald-400 border-emerald-800';
            let Icon = CheckCircle2;

            if (!rule.passed) {
              if (rule.severity === 'ERROR') {
                badgeBg = 'bg-rose-950/40 text-rose-400 border-rose-800';
                Icon = XCircle;
              } else if (rule.severity === 'WARNING') {
                badgeBg = 'bg-amber-950/40 text-amber-400 border-amber-800';
                Icon = AlertTriangle;
              } else {
                badgeBg = 'bg-sky-950/40 text-sky-400 border-sky-800';
                Icon = Info;
              }
            }

            return (
              <div
                key={rule.id}
                className={`p-3.5 rounded-xl border transition-all ${rule.passed ? 'bg-slate-850/50 border-slate-800 hover:border-slate-700' : 'bg-slate-850 border-slate-750'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 p-1 rounded-md border ${badgeBg}`}>
                      <Icon size={14} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{rule.title}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {rule.code}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          {rule.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {rule.description}
                      </p>
                      {!rule.passed && rule.fixSuggestion && (
                        <div className="mt-1.5 p-2 rounded-lg bg-amber-950/30 border border-amber-900/40 text-amber-300 text-[11px] flex items-start gap-1.5">
                          <Info size={13} className="shrink-0 mt-0.5" />
                          <span><strong>Lösungsvorschlag:</strong> {rule.fixSuggestion}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border shrink-0 ${rule.passed ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700' : rule.severity === 'ERROR' ? 'bg-rose-950/60 text-rose-300 border-rose-700' : 'bg-amber-950/60 text-amber-300 border-amber-700'}`}>
                    {rule.passed ? 'Bestanden' : rule.severity === 'ERROR' ? 'Pflichtfeld fehlt' : 'Empfehlung'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <FileCheck size={14} className="text-emerald-400" />
            <span>ZUGFeRD 2.2 / Factur-X / EN 16931 Validierungs-Engine aktiv</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadZugferdXml(config, netTotal, taxTotal, grossTotal, items)}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-sm"
              title="Factur-X XML herunterladen"
            >
              <FileCode size={14} /> Factur-X XML herunterladen
            </button>
            <button
              onClick={() => {
                onClose();
                onExportPdf();
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              <Download size={14} /> PDF/A-3 mit XML erzeugen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
