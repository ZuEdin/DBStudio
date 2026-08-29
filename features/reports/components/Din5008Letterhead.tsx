import React from 'react';
import { Din5008Config } from '../../../types';
import { Building2, Mail, Phone, Calendar, Hash, FileText } from 'lucide-react';

interface Din5008LetterheadProps {
  config?: Din5008Config;
  companyLogoUrl?: string;
  reportName: string;
}

export const Din5008Letterhead: React.FC<Din5008LetterheadProps> = ({
  config,
  companyLogoUrl,
  reportName,
}) => {
  if (!config || !config.enabled) return null;

  const isFormB = config.formType === 'FormB';

  return (
    <div className="w-full bg-white text-slate-800 font-sans border-b border-slate-200 pb-6 mb-6">
      {/* Top Header Row with Company Logo / Sender */}
      <div className="flex justify-between items-start mb-6">
        <div>
          {/* DIN 5008 Mini Return Address / Sender Line */}
          <div className="text-[10px] text-slate-500 underline decoration-slate-300 font-mono tracking-tight mb-3">
            {config.senderLine || 'Musterbau Enterprise GmbH • Baustraße 100 • 10115 Berlin'}
          </div>

          {/* DIN 5008 Window Address Field (85mm x 45mm compliant box) */}
          <div
            className={`w-72 bg-slate-50/50 border border-dashed border-slate-300 rounded p-3 text-xs leading-relaxed text-slate-900 shadow-2xs ${
              isFormB ? 'mt-4' : 'mt-1'
            }`}
          >
            <div className="text-[9px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">
              Empfänger (Fensterbrief DIN 5008 {config.formType})
            </div>
            <pre className="font-sans whitespace-pre-wrap font-medium">
              {config.recipientAddress ||
                'Bauherren & Partner GbR\nz. H. Herrn Bauleiter Müller\nIndustriestraße 45\n80339 München'}
            </pre>
          </div>
        </div>

        {/* Right Side: Logo & Infoblock */}
        <div className="w-80 flex flex-col items-end">
          {companyLogoUrl && (
            <img
              src={companyLogoUrl}
              alt="Logo"
              className="max-h-16 max-w-48 object-contain mb-4"
              referrerPolicy="no-referrer"
            />
          )}

          {/* Reference Info Block */}
          <div className="w-full bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs space-y-1.5 shadow-2xs">
            <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>Geschäftsangaben</span>
              <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                DIN 5008
              </span>
            </div>

            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Unser Zeichen:</span>
              <span className="font-mono font-semibold text-slate-800">
                {config.infoblock?.ourRef || 'MB/BL-2026'}
              </span>
            </div>

            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Kundennummer:</span>
              <span className="font-mono font-semibold text-slate-800">
                {config.infoblock?.customerNo || 'KD-9042'}
              </span>
            </div>

            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Vorgangs-/Rechnungs-Nr.:</span>
              <span className="font-mono font-bold text-indigo-700">
                {config.infoblock?.invoiceNo || 'RE-2026-0814'}
              </span>
            </div>

            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Projekt-/Baustellen-Nr.:</span>
              <span className="font-mono text-slate-800">
                {config.infoblock?.projectNo || 'BV-BER-Nord-04'}
              </span>
            </div>

            <div className="flex justify-between text-[11px] border-t border-slate-200 pt-1">
              <span className="text-slate-500">Datum:</span>
              <span className="font-semibold text-slate-800">
                {config.infoblock?.date || new Date().toLocaleDateString('de-DE')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Subject / Heading */}
      <div className="mt-4 pt-2">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{reportName}</h1>
        {config.infoblock?.servicePeriod && (
          <p className="text-xs text-slate-500 mt-0.5">
            Leistungszeitraum: {config.infoblock.servicePeriod}
          </p>
        )}
      </div>
    </div>
  );
};

export const Din5008ThreeColumnFooter: React.FC<{ config?: Din5008Config }> = ({ config }) => {
  if (!config || !config.enabled || !config.threeColumnFooter) return null;

  const f = config.threeColumnFooter;

  return (
    <div className="w-full mt-10 pt-4 border-t-2 border-slate-300 grid grid-cols-3 gap-4 text-[10px] text-slate-600 font-sans leading-normal bg-slate-50/70 p-3 rounded-b-lg">
      <div>
        <div className="font-bold text-slate-800 mb-0.5">{f.col1Title || 'Firmensitz & Register'}</div>
        <div className="whitespace-pre-line">
          {f.col1Text || 'Musterbau GmbH\nAmtsgericht Charlottenburg HRB 99882\nGeschäftsführer: Dipl.-Ing. H. Weber'}
        </div>
      </div>

      <div>
        <div className="font-bold text-slate-800 mb-0.5">{f.col2Title || 'Bankverbindung'}</div>
        <div className="whitespace-pre-line font-mono text-[9.5px]">
          {f.col2Text || 'Deutsche Bau-Kreditbank\nIBAN: DE89 1007 0000 0123 4567 89\nBIC: DEUTDEDDBAU'}
        </div>
      </div>

      <div>
        <div className="font-bold text-slate-800 mb-0.5">{f.col3Title || 'Steuer & Finanzamt'}</div>
        <div className="whitespace-pre-line">
          {f.col3Text || 'Steuernummer: 27/123/45678\nUSt-IdNr.: DE 302 918 273\nGläubiger-ID: DE98ZZZ00000123456'}
        </div>
      </div>
    </div>
  );
};
