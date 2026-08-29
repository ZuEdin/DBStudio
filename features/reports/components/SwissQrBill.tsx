import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { SwissQrCodeConfig } from '../../../types';
import { Crosshair, QrCode } from 'lucide-react';

interface SwissQrBillProps {
  config: SwissQrCodeConfig;
}

export const SwissQrBill: React.FC<SwissQrBillProps> = ({ config }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Generate Swiss QR Payload text according to SIX Swiss Payment Standards (SPC)
  useEffect(() => {
    if (!config.enabled) return;

    const payload = [
      'SPC', // Header
      '0200', // Version 2.0
      '1', // Coding Type UTF-8
      config.iban.replace(/\s+/g, ''), // Account / IBAN
      'K', // Address Type: Combined elements
      config.creditor.name,
      config.creditor.street + (config.creditor.houseNo ? ` ${config.creditor.houseNo}` : ''),
      config.creditor.postalCode,
      config.creditor.city,
      config.creditor.country || 'CH',
      '', // Ultimate creditor
      '',
      '',
      '',
      '',
      '',
      '',
      config.amount !== undefined && config.amount > 0 ? config.amount.toFixed(2) : '',
      config.currency || 'CHF',
      config.debtor ? 'K' : '',
      config.debtor?.name || '',
      config.debtor ? config.debtor.street + (config.debtor.houseNo ? ` ${config.debtor.houseNo}` : '') : '',
      config.debtor?.postalCode || '',
      config.debtor?.city || '',
      config.debtor?.country || (config.debtor ? 'CH' : ''),
      config.referenceType || 'NON',
      config.reference || '',
      config.additionalInformation || 'Rechnung / Facture',
      'EPD', // Trailer
      '',
    ].join('\r\n');

    QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 180,
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Swiss QR Generation error:', err));
  }, [config]);

  if (!config.enabled) return null;

  const formatAmount = (val?: number) => {
    if (val === undefined || isNaN(val)) return ' ';
    return new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div className="w-full mt-6 pt-4 border-t-2 border-dashed border-slate-400 bg-white text-slate-900 font-sans text-xs select-none">
      <div className="text-[10px] text-slate-400 font-mono mb-2 flex items-center justify-between">
        <span>--- SCHWEIZER QR-RECHNUNG (SWISS QR-BILL / SECTION DE PAIEMENT) ---</span>
        <span className="flex items-center gap-1 text-slate-600 font-semibold">
          <QrCode size={12} className="text-red-600" /> Swiss Payment Standard v2.0
        </span>
      </div>

      <div className="grid grid-cols-12 border border-slate-300 rounded overflow-hidden">
        {/* EMPFANGSSCHEIN / RECEIPT (Left Column: 62mm in DIN standard) */}
        <div className="col-span-12 md:col-span-4 p-3.5 border-r border-slate-300 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-sm mb-2 text-slate-800 tracking-tight">Empfangsschein</h4>
            <div className="mb-3 space-y-0.5">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Konto / Zahlbar an:</span>
              <p className="font-mono text-[11px] font-semibold text-slate-800">{config.iban}</p>
              <p className="font-medium text-slate-700">{config.creditor.name}</p>
              <p className="text-slate-600">{config.creditor.street} {config.creditor.houseNo}</p>
              <p className="text-slate-600">{config.creditor.postalCode} {config.creditor.city}</p>
            </div>

            {config.reference && (
              <div className="mb-3 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Referenz:</span>
                <p className="font-mono text-[11px] font-semibold tracking-wider text-slate-800">{config.reference}</p>
              </div>
            )}

            {config.debtor && (
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Zahlbar durch:</span>
                <p className="font-medium text-slate-700">{config.debtor.name}</p>
                <p className="text-slate-600">{config.debtor.street}</p>
                <p className="text-slate-600">{config.debtor.postalCode} {config.debtor.city}</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-end">
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase block">Währung</span>
              <span className="text-xs font-black font-mono">{config.currency}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-500 font-bold uppercase block">Betrag</span>
              <span className="text-sm font-black font-mono">{formatAmount(config.amount)}</span>
            </div>
          </div>
        </div>

        {/* ZAHLTEIL / PAYMENT PART (Right Column: 148mm) */}
        <div className="col-span-12 md:col-span-8 p-4 bg-white flex flex-col md:flex-row gap-4">
          {/* Swiss QR Code with Crosshair badge */}
          <div className="shrink-0 flex flex-col items-center justify-center">
            <div className="relative inline-block border-2 border-slate-900 p-1 bg-white rounded-xs">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Swiss QR-Code" className="w-36 h-36 object-contain" />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center bg-slate-100 text-[10px] text-slate-400">
                  QR Erzeugung...
                </div>
              )}
              {/* Swiss Cross Symbol overlay in center */}
              <div className="absolute inset-0 m-auto w-7 h-7 bg-black flex items-center justify-center rounded-xs shadow-xs pointer-events-none">
                <div className="w-4 h-4 bg-white flex items-center justify-center relative">
                  <div className="w-2.5 h-0.5 bg-black absolute"></div>
                  <div className="w-0.5 h-2.5 bg-black absolute"></div>
                </div>
              </div>
            </div>

            <div className="mt-2 flex gap-4 w-full justify-between items-end px-1">
              <div>
                <span className="text-[9px] text-slate-500 font-bold uppercase block">Währung</span>
                <span className="text-xs font-black font-mono">{config.currency}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-500 font-bold uppercase block">Betrag</span>
                <span className="text-base font-black font-mono">{formatAmount(config.amount)}</span>
              </div>
            </div>
          </div>

          {/* Details & Reference info */}
          <div className="flex-1 space-y-2.5 text-xs">
            <h4 className="font-extrabold text-base text-slate-900 tracking-tight">Zahlteil</h4>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Konto / Zahlbar an:</span>
              <p className="font-mono text-xs font-bold text-slate-900">{config.iban}</p>
              <p className="font-semibold text-slate-800">{config.creditor.name}</p>
              <p className="text-slate-600">{config.creditor.street} {config.creditor.houseNo}</p>
              <p className="text-slate-600">{config.creditor.postalCode} {config.creditor.city}</p>
            </div>

            {config.reference && (
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">
                  Referenz ({config.referenceType}):
                </span>
                <p className="font-mono text-xs font-bold tracking-wider text-slate-900 bg-slate-100 px-2 py-0.5 rounded inline-block">
                  {config.reference}
                </p>
              </div>
            )}

            {config.additionalInformation && (
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Zusätzliche Informationen:</span>
                <p className="text-slate-700 italic text-[11px]">{config.additionalInformation}</p>
              </div>
            )}

            {config.debtor && (
              <div className="space-y-0.5 pt-1 border-t border-slate-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Zahlbar durch:</span>
                <p className="font-semibold text-slate-800">{config.debtor.name}</p>
                <p className="text-slate-600">{config.debtor.street}</p>
                <p className="text-slate-600">{config.debtor.postalCode} {config.debtor.city}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
