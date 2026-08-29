import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Wrench, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  FileCheck,
  Coins
} from 'lucide-react';
import { GaebProjectDoc } from './gaebTypes';
import { GaebValidator, GaebValidationResult, GaebValidationIssue } from './gaebValidator';

interface GaebValidationPanelProps {
  doc: GaebProjectDoc;
  onDocUpdated: (updatedDoc: GaebProjectDoc) => void;
}

export const GaebValidationPanel: React.FC<GaebValidationPanelProps> = ({
  doc,
  onDocUpdated,
}) => {
  const result: GaebValidationResult = React.useMemo(() => {
    return GaebValidator.validate(doc);
  }, [doc]);

  const handleAutoFixAll = () => {
    const fixed = GaebValidator.autoFixAll(doc);
    onDocUpdated(fixed);
  };

  const handleFixSingleIssue = (issue: GaebValidationIssue) => {
    const fixedDoc: GaebProjectDoc = JSON.parse(JSON.stringify(doc));
    
    fixedDoc.sections.forEach((sec) => {
      sec.positions.forEach((pos) => {
        if (pos.id === issue.positionId) {
          if (issue.fixType === 'fix_unit') {
            const clean = (pos.unit || '').trim().toLowerCase();
            if (clean === 'qm' || clean === 'm2') pos.unit = 'm²';
            else if (clean === 'cbm' || clean === 'm3') pos.unit = 'm³';
            else if (clean === 'stk' || clean === 'stck' || clean === 'stück') pos.unit = 'Stk';
            else if (clean === 'std' || clean === 'h') pos.unit = 'Std';
            else if (clean === 'lfm' || clean === 'm1') pos.unit = 'm';
          } else if (issue.fixType === 'fix_price') {
            pos.unitPrice = 45.0; // standard estimation fallback
            pos.totalPrice = pos.quantity * pos.unitPrice;
          } else if (issue.fixType === 'recalc_total') {
            pos.totalPrice = Math.round((pos.quantity * (pos.unitPrice || 0)) * 100) / 100;
          } else if (issue.fixType === 'fix_bidder_text') {
            pos.longText = (pos.longText || pos.shortText) + '\n[Bieterangabe: Fabrikat MeisterBau Premium, Typ MB-2026]';
          }
        }
      });
      sec.totalPrice = sec.positions.reduce((acc, p) => acc + (p.totalPrice || 0), 0);
    });

    onDocUpdated(fixedDoc);
  };

  const priceFillPercentage = result.stats.totalPositions > 0
    ? Math.round((result.stats.filledPricesCount / result.stats.totalPositions) * 100)
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 text-white shadow-xl">
      {/* Header Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          {result.isValid ? (
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck size={18} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <AlertCircle size={18} />
            </div>
          )}
          <div>
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              GAEB DA XML 3.2 / 3.3 Konformitätsprüfung
              {result.isValid ? (
                <span className="text-[10px] bg-emerald-900/60 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-700">
                  X84-Bereit
                </span>
              ) : (
                <span className="text-[10px] bg-rose-900/60 text-rose-300 font-bold px-2 py-0.5 rounded border border-rose-700">
                  {result.errorCount} Fehler
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-400">
              Prüfung von Schema, OZ-Hierarchie, Pflichtpreisen, Bietertextergänzungen & Einheiten.
            </p>
          </div>
        </div>

        {/* Auto-Fix All Button */}
        {result.issues.some((i) => i.autoFixable) && (
          <button
            onClick={handleAutoFixAll}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-md transition-all active:scale-95"
          >
            <Sparkles size={14} className="text-amber-300" />
            <span>Alle Probleme reparieren</span>
          </button>
        )}
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Layers size={12} className="text-blue-400" /> Positionen gesamt
          </div>
          <div className="text-base font-bold text-slate-100 mt-0.5">
            {result.stats.totalPositions} <span className="text-[10px] font-normal text-slate-400">in {result.stats.totalSections} Titeln</span>
          </div>
        </div>

        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Coins size={12} className="text-emerald-400" /> Bepreiste Positionen
          </div>
          <div className="text-base font-bold text-emerald-400 mt-0.5">
            {result.stats.filledPricesCount} / {result.stats.totalPositions} ({priceFillPercentage}%)
          </div>
        </div>

        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <FileCheck size={12} className="text-amber-400" /> Bietertextergänzungen
          </div>
          <div className="text-base font-bold text-amber-300 mt-0.5">
            {result.stats.bidderTextComplementsCount}
          </div>
        </div>

        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
          <div className="text-[10px] text-slate-400">Gesamtsumme Netto</div>
          <div className="text-base font-bold text-indigo-300 mt-0.5">
            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(result.stats.totalNetValue)}
          </div>
        </div>
      </div>

      {/* Progress Bar for Pricing */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>Bepreisungsgrad für Angebotsabgabe (X84)</span>
          <span>{priceFillPercentage}%</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div 
            className={`h-full transition-all duration-500 ${
              priceFillPercentage === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-indigo-500'
            }`}
            style={{ width: `${priceFillPercentage}%` }}
          />
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {result.issues.length === 0 ? (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>Hervorragend! Das Leistungsverzeichnis erfüllt alle GAEB DA XML 3.2 / 3.3 Validierungskriterien ohne Beanstandungen.</span>
          </div>
        ) : (
          result.issues.map((issue) => (
            <div
              key={issue.id}
              className={`p-2.5 rounded-lg border text-xs flex items-start justify-between gap-3 transition-colors ${
                issue.severity === 'error'
                  ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                  : issue.severity === 'warning'
                  ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-start gap-2">
                {issue.severity === 'error' && <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />}
                {issue.severity === 'warning' && <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />}
                {issue.severity === 'info' && <Info size={15} className="text-blue-400 shrink-0 mt-0.5" />}
                <div>
                  <div className="font-semibold flex items-center gap-1.5">
                    {issue.oz && <span className="font-mono bg-black/40 px-1 py-0.5 rounded text-[10px] text-white">OZ {issue.oz}</span>}
                    <span>{issue.message}</span>
                  </div>
                  {issue.suggestion && (
                    <div className="text-[11px] opacity-80 mt-0.5 text-slate-300">
                      💡 Vorschlag: {issue.suggestion}
                    </div>
                  )}
                </div>
              </div>

              {issue.autoFixable && (
                <button
                  onClick={() => handleFixSingleIssue(issue)}
                  className="shrink-0 flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-[10px] font-bold transition-colors"
                  title="Dieses Problem automatisch beheben"
                >
                  <Wrench size={11} /> Korrigieren
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
