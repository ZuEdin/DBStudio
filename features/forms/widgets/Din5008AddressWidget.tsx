import React, { useState } from 'react';
import { Mail, Building2, MapPin, CheckCircle } from 'lucide-react';

export interface Din5008AddressData {
  returnAddressHeader?: string; // Einzeilige Rücksendeangabe
  recipientCompany?: string;    // Name / Firma Zeile 1
  recipientDept?: string;       // Ansprechpartner / Abteilung Zeile 2
  recipientExtra?: string;      // Zusatz / Gebäude
  streetAndNumber?: string;     // Straße und Hausnummer
  postalCode?: string;          // Postleitzahl
  city?: string;                // Ort
  country?: string;             // Land (z. B. DEUTSCHLAND)
}

interface Din5008AddressWidgetProps {
  id: string;
  label?: string;
  value?: string | Din5008AddressData;
  isReadOnly?: boolean;
  onChange: (value: string) => void;
}

export const Din5008AddressWidget: React.FC<Din5008AddressWidgetProps> = ({
  id,
  label = 'DIN 5008 Empfängeranschrift',
  value,
  isReadOnly = false,
  onChange,
}) => {
  const parsedData: Din5008AddressData = typeof value === 'string' && value.startsWith('{')
    ? (() => {
        try {
          return JSON.parse(value);
        } catch {
          return {};
        }
      })()
    : typeof value === 'object' && value !== null
    ? (value as Din5008AddressData)
    : {
        recipientCompany: typeof value === 'string' ? value : '',
      };

  const updateField = (field: keyof Din5008AddressData, val: string) => {
    const updated = { ...parsedData, [field]: val };
    onChange(JSON.stringify(updated));
  };

  return (
    <div id={id} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
          <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded">
            DIN 5008 Form A/B
          </span>
        </div>
      </div>

      {/* DIN 5008 Address Envelope Preview Box */}
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-3 space-y-2">
        {/* Single-line Return Address (Rücksendeangabe) */}
        <div>
          <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Rücksendeangabe (Einzeilig 5pt-8pt)</label>
          <input
            type="text"
            disabled={isReadOnly}
            placeholder="z. B. Musterbau GmbH • Industriestr. 12 • 80331 München"
            value={parsedData.returnAddressHeader || ''}
            onChange={(e) => updateField('returnAddressHeader', e.target.value)}
            className="w-full text-[11px] font-mono px-2 py-1 border-b border-slate-300 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500"
          />
        </div>

        {/* Recipient Lines */}
        <div className="space-y-1.5 pt-1">
          <input
            type="text"
            disabled={isReadOnly}
            placeholder="Firma / Empfängerzeile 1 *"
            value={parsedData.recipientCompany || ''}
            onChange={(e) => updateField('recipientCompany', e.target.value)}
            className="w-full text-xs font-semibold px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            disabled={isReadOnly}
            placeholder="Abteilung / z. H. Herr/Frau (Zeile 2)"
            value={parsedData.recipientDept || ''}
            onChange={(e) => updateField('recipientDept', e.target.value)}
            className="w-full text-xs px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            disabled={isReadOnly}
            placeholder="Straße und Hausnummer *"
            value={parsedData.streetAndNumber || ''}
            onChange={(e) => updateField('streetAndNumber', e.target.value)}
            className="w-full text-xs px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <input
              type="text"
              disabled={isReadOnly}
              placeholder="PLZ *"
              value={parsedData.postalCode || ''}
              onChange={(e) => updateField('postalCode', e.target.value)}
              className="w-24 text-xs font-mono font-bold px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              disabled={isReadOnly}
              placeholder="Ort / Bestimmungsort *"
              value={parsedData.city || ''}
              onChange={(e) => updateField('city', e.target.value)}
              className="flex-1 text-xs px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <input
            type="text"
            disabled={isReadOnly}
            placeholder="Land (z. B. DEUTSCHLAND - nur bei Auslandssendung)"
            value={parsedData.country || ''}
            onChange={(e) => updateField('country', e.target.value)}
            className="w-full text-[11px] uppercase tracking-wider px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
