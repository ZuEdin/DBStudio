import React, { useState } from 'react';
import { QrCode, CreditCard, Building, ShieldCheck, Copy, Check } from 'lucide-react';

export const GiroCodeQrRunner: React.FC<{ props?: Record<string, any> }> = ({ props = {} }) => {
  const [recipient, setRecipient] = useState<string>(props.recipient || 'Bauunternehmung Müller GmbH');
  const [iban, setIban] = useState<string>(props.iban || 'DE89 3704 0044 0532 0130 00');
  const [bic, setBic] = useState<string>(props.bic || 'DBKDEFFXXX');
  const [amount, setAmount] = useState<number>(props.amount || 28450.00);
  const [purpose, setPurpose] = useState<string>(props.purpose || 'Schlussrechnung BV-2026-08');

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs my-3">
      <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center text-white">
            <QrCode size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold">{props.title || 'EPC-QR-Code (GiroCode) Überweisungsträger'}</h3>
            <p className="text-[10px] text-slate-400">Standardisierter Zahlungsverkehr nach EPC069-12 Richtlinie</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col md:flex-row items-center gap-6">
        {/* QR Representation */}
        <div className="w-40 h-40 bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm flex flex-col items-center justify-center shrink-0">
          {/* Simulated clean QR visual */}
          <div className="w-full h-full bg-slate-950 rounded-lg p-2 flex flex-col items-center justify-between">
            <div className="w-full flex justify-between">
              <div className="w-6 h-6 border-2 border-white rounded-xs p-0.5"><div className="w-full h-full bg-white"/></div>
              <div className="w-6 h-6 border-2 border-white rounded-xs p-0.5"><div className="w-full h-full bg-white"/></div>
            </div>
            <div className="text-[9px] font-bold text-white font-mono tracking-widest text-center">
              GIROCODE
            </div>
            <div className="w-full flex justify-between">
              <div className="w-6 h-6 border-2 border-white rounded-xs p-0.5"><div className="w-full h-full bg-white"/></div>
              <div className="w-3 h-3 bg-white self-end"/>
            </div>
          </div>
        </div>

        {/* Payment details */}
        <div className="flex-1 space-y-2 text-xs w-full">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase">Empfänger</label>
              <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{recipient}</div>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase">Zahlbetrag</label>
              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase">IBAN / BIC</label>
            <div className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">{iban} ({bic})</div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase">Verwendungszweck</label>
            <div className="font-medium text-slate-800 dark:text-slate-200">{purpose}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
