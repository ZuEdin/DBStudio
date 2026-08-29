import React from 'react';
import { CommercialVobConfig, EpcQrCodeConfig } from '../../../types';
import { Receipt, Percent, ShieldCheck, QrCode, FileCheck } from 'lucide-react';

interface CommercialVobSummaryProps {
  vobConfig?: CommercialVobConfig;
  epcConfig?: EpcQrCodeConfig;
  baseNetTotal: number;
}

export const CommercialVobSummary: React.FC<CommercialVobSummaryProps> = ({
  vobConfig,
  epcConfig,
  baseNetTotal,
}) => {
  if (!vobConfig || !vobConfig.enabled) return null;

  const net19 = vobConfig.vatSplitting?.standard19 || baseNetTotal;
  const net7 = vobConfig.vatSplitting?.reduced7 || 0;
  const net0 = vobConfig.vatSplitting?.taxFree13b || 0;

  const tax19 = Math.round(net19 * 0.19 * 100) / 100;
  const tax7 = Math.round(net7 * 0.07 * 100) / 100;
  const totalTax = tax19 + tax7;

  const totalNet = net19 + net7 + net0;
  const totalGross = totalNet + totalTax;

  // Deductions
  const retentionPercent = vobConfig.deductions?.warrantyRetentionPercent || 0;
  const insurancePercent = vobConfig.deductions?.constructionInsurancePercent || 0;
  const advances = vobConfig.deductions?.advancePaymentsDeducted || 0;

  const retentionAmount = retentionPercent > 0 ? Math.round(totalGross * (retentionPercent / 100) * 100) / 100 : 0;
  const insuranceAmount = insurancePercent > 0 ? Math.round(totalGross * (insurancePercent / 100) * 100) / 100 : 0;

  const finalPayable = Math.max(0, Math.round((totalGross - retentionAmount - insuranceAmount - advances) * 100) / 100);

  const formatEUR = (num: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(num);

  return (
    <div className="w-full mt-6 bg-slate-50 border border-slate-200 rounded-lg p-5 text-slate-800 font-sans shadow-2xs">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
        <Receipt className="text-indigo-600" size={18} />
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Kaufmännische Abrechnung & Umsatzsteuer-Aufschlüsselung (VOB/B)
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tax Splitting Matrix & VOB Deductions */}
        <div className="lg:col-span-8 space-y-4">
          <div className="border border-slate-200 rounded bg-white overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-1.5 px-3">Steuersatz / Kostenart</th>
                  <th className="py-1.5 px-3 text-right">Nettobetrag</th>
                  <th className="py-1.5 px-3 text-right">MwSt. Betrag</th>
                  <th className="py-1.5 px-3 text-right">Bruttobetrag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {net19 > 0 && (
                  <tr>
                    <td className="py-1 px-3">Bauleistungen / Material (19% MwSt.)</td>
                    <td className="py-1 px-3 text-right font-mono">{formatEUR(net19)}</td>
                    <td className="py-1 px-3 text-right font-mono">{formatEUR(tax19)}</td>
                    <td className="py-1 px-3 text-right font-mono font-medium">{formatEUR(net19 + tax19)}</td>
                  </tr>
                )}
                {net7 > 0 && (
                  <tr>
                    <td className="py-1 px-3">Ermäßigter Steuersatz (7% MwSt.)</td>
                    <td className="py-1 px-3 text-right font-mono">{formatEUR(net7)}</td>
                    <td className="py-1 px-3 text-right font-mono">{formatEUR(tax7)}</td>
                    <td className="py-1 px-3 text-right font-mono font-medium">{formatEUR(net7 + tax7)}</td>
                  </tr>
                )}
                {net0 > 0 && (
                  <tr>
                    <td className="py-1 px-3 text-amber-700">§13b UStG Steuerschuldnerschaft (0% MwSt.)</td>
                    <td className="py-1 px-3 text-right font-mono">{formatEUR(net0)}</td>
                    <td className="py-1 px-3 text-right font-mono">0,00 €</td>
                    <td className="py-1 px-3 text-right font-mono font-medium">{formatEUR(net0)}</td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                  <td className="py-1.5 px-3">Gesamtsumme (Rechnungsbetrag)</td>
                  <td className="py-1.5 px-3 text-right font-mono">{formatEUR(totalNet)}</td>
                  <td className="py-1.5 px-3 text-right font-mono">{formatEUR(totalTax)}</td>
                  <td className="py-1.5 px-3 text-right font-mono text-indigo-900">{formatEUR(totalGross)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* VOB Deductions Box */}
          {(retentionPercent > 0 || insurancePercent > 0 || advances > 0) && (
            <div className="bg-white border border-slate-200 rounded p-3 text-xs space-y-1.5">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Vertragliche Abzüge & Sicherheitseinbehalte:</span>
              </div>
              {retentionPercent > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>- {retentionPercent}% Gewährleistungseinbehalt nach VOB/B:</span>
                  <span className="font-mono text-rose-700 font-medium">-{formatEUR(retentionAmount)}</span>
                </div>
              )}
              {insurancePercent > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>- {insurancePercent}% Bauwesenversicherung / Baustrom:</span>
                  <span className="font-mono text-rose-700 font-medium">-{formatEUR(insuranceAmount)}</span>
                </div>
              )}
              {advances > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>- Bisher erhaltene Abschlagszahlungen:</span>
                  <span className="font-mono text-rose-700 font-medium">-{formatEUR(advances)}</span>
                </div>
              )}
            </div>
          )}

          {vobConfig.paymentTermsText && (
            <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded border border-slate-200">
              <span className="font-semibold text-slate-700">Zahlungsbedingungen: </span>
              {vobConfig.paymentTermsText}
            </div>
          )}
        </div>

        {/* Right Column: Final Payable Box & EPC GiroCode */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="bg-indigo-950 text-white rounded-lg p-4 shadow-sm border border-indigo-800">
            <div className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider mb-1">
              Fälliger Zahlungsbetrag
            </div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {formatEUR(finalPayable)}
            </div>
            {vobConfig.deductions?.skontoPercent && (
              <div className="text-[10px] text-indigo-200 mt-2 pt-2 border-t border-indigo-800/80">
                Bei Zahlung innerhalb von {vobConfig.deductions.skontoDays || 14} Tagen:{' '}
                <span className="font-bold text-emerald-300">
                  {vobConfig.deductions.skontoPercent}% Skonto (
                  {formatEUR(finalPayable * (1 - vobConfig.deductions.skontoPercent / 100))})
                </span>
              </div>
            )}
          </div>

          {/* EPC GiroCode (Bank QR Code) */}
          {epcConfig?.enabled && (
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-2xs">
              <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <QrCode size={12} className="text-indigo-600" /> EPC-QR (GiroCode)
              </div>
              <div className="flex justify-center my-2">
                <div className="w-24 h-24 bg-slate-100 border border-slate-300 rounded flex items-center justify-center p-1">
                  {/* Generated SVG QR Code representation */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      `BCD\n002\n1\nSCT\n${epcConfig.bic || ''}\n${epcConfig.recipientName || 'Musterbau GmbH'}\n${
                        epcConfig.iban || ''
                      }\nEUR${finalPayable.toFixed(2)}\n\n${epcConfig.reference || 'Rechnung'}`
                    )}`}
                    alt="EPC GiroCode"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="text-[9px] text-slate-500 font-mono">
                Scannen mit Banking-App für fehlerfreie Überweisung
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
