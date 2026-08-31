import React from 'react';
import { 
  ShieldCheck, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Building2, 
  FileText, 
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { 
  ZugferdInvoiceData, 
  ZugferdProfile, 
  En16931ValidationReport,
  En16931ValidationRuleIssue 
} from './zugferdTypes';
import { ZugferdValidator } from './zugferdValidator';

interface ZugferdValidationPanelProps {
  invoiceData: ZugferdInvoiceData;
  profile: ZugferdProfile;
  onInvoiceUpdated: (updated: ZugferdInvoiceData) => void;
}

export const ZugferdValidationPanel: React.FC<ZugferdValidationPanelProps> = ({
  invoiceData,
  profile,
  onInvoiceUpdated,
}) => {
  const report: En16931ValidationReport = React.useMemo(() => {
    return ZugferdValidator.validateInvoice(invoiceData, profile);
  }, [invoiceData, profile]);

  const handleAutoFix = () => {
    const fixed = ZugferdValidator.autoFixInvoice(invoiceData);
    onInvoiceUpdated(fixed);
  };

  const handleFixIssue = (issue: En16931ValidationRuleIssue) => {
    const fixed: ZugferdInvoiceData = JSON.parse(JSON.stringify(invoiceData));
    if (issue.category === 'construction_13b') {
      fixed.totalVat = 0;
      fixed.totalGross = fixed.totalNet;
      fixed.reverseChargeNote = 'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG (Reverse Charge).';
      fixed.lineItems.forEach((item) => {
        item.vatRate = 0;
        item.vatCategoryCode = 'AE';
      });
    } else if (issue.code === 'BR-CO-10') {
      const sum = fixed.lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
      fixed.totalNet = Math.round(sum * 100) / 100;
      if (fixed.isReverseCharge13b) {
        fixed.totalGross = fixed.totalNet;
      } else {
        fixed.totalGross = Math.round((fixed.totalNet + fixed.totalVat) * 100) / 100;
      }
    }
    onInvoiceUpdated(fixed);
  };

  const leitweg = report.leitwegResult;

  return (
    <div className="space-y-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-xl text-xs">
      {/* Header Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          {report.isValid ? (
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
              EN 16931 &amp; Schematron Konformitätsprüfung
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                report.isValid
                  ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700'
                  : 'bg-rose-900/60 text-rose-300 border-rose-700'
              }`}>
                {report.isValid ? 'EN 16931 Valid' : `${report.errorCount} Fehler`}
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Prüfung von BT-Datenfeldern, Steuerkalkulation, §13b UStG Reverse-Charge &amp; B2G Leitweg-ID.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Konformitäts-Score</div>
            <div className={`text-base font-extrabold font-mono ${
              report.score >= 90 ? 'text-emerald-400' : report.score >= 60 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {report.score} / 100
            </div>
          </div>
          {report.issues.some((i) => i.autoFixable) && (
            <button
              onClick={handleAutoFix}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow transition"
            >
              <Wrench size={14} />
              <span>Auto-Reparatur</span>
            </button>
          )}
        </div>
      </div>

      {/* Leitweg-ID B2G Inspector */}
      {leitweg && (
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-slate-200">B2G Leitweg-ID Routing-Prüfung (KoSIT Standard)</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              leitweg.isValid
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                : 'bg-amber-900/60 text-amber-300 border border-amber-700'
            }`}>
              {leitweg.isValid ? 'Leitweg-ID Gültig' : 'Prüfung erforderlich'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[10px]">Ziel-Plattform</div>
              <div className="font-bold text-blue-300">{leitweg.portalName}</div>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[10px]">Gebietskörperschaft</div>
              <div className="font-bold text-slate-200">{leitweg.jurisdiction}</div>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[10px]">Formatierte ID</div>
              <div className="font-mono font-bold text-emerald-400">{leitweg.formattedId || '–'}</div>
            </div>
          </div>
        </div>
      )}

      {/* §13b UStG Reverse-Charge Bauleistungs-Badge */}
      {invoiceData.isReverseCharge13b && (
        <div className="p-2.5 rounded-lg border border-amber-800/80 bg-amber-950/30 text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold">§ 13b UStG Steuerschuldnerschaft:</span>
            <span>Umsatzsteuer schuldet der Leistungsempfänger (Steuercode AE / 0,00 % MwSt).</span>
          </div>
          <span className="text-[10px] bg-amber-900 text-amber-200 font-bold px-2 py-0.5 rounded">
            Bauleistung Aktiv
          </span>
        </div>
      )}

      {/* Issue List */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {report.issues.length === 0 ? (
          <div className="p-3 rounded-lg border border-emerald-800/60 bg-emerald-950/20 text-emerald-300 flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Alle branchenspezifischen EN 16931 &amp; Schematron-Regeln erfüllt. Dokument ist bereit für ZRE / OZG-RE.</span>
          </div>
        ) : (
          report.issues.map((issue) => (
            <div
              key={issue.id}
              className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/80 flex items-start justify-between gap-2"
            >
              <div className="flex items-start gap-2">
                {issue.severity === 'fatal' || issue.severity === 'error' ? (
                  <AlertCircle size={15} className="text-rose-400 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1 rounded">
                      {issue.code}
                    </span>
                    <span>{issue.title}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{issue.description}</p>
                </div>
              </div>

              {issue.autoFixable && (
                <button
                  onClick={() => handleFixIssue(issue)}
                  className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shrink-0 transition"
                >
                  Beheben
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
