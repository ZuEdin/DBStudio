import React from 'react';
import { Layers, FileText, QrCode, HardHat, CheckCircle2, ArrowRight } from 'lucide-react';

export const DachIndustryStandardsDeepDive: React.FC = () => {
  return (
    <div className="bg-[#242432] border border-amber-500/30 rounded-2xl p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-[#38384a] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded border border-amber-500/40">
              DACH Branchenlösungen
            </span>
            <span className="text-xs text-neutral-400">GAEB XML 3.3 • DATANORM 5.0 • ZUGFeRD 2.3 / XRechnung 3.0 • Swiss QR Bill</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="text-amber-400" size={20} />
            Integrierte Branchen-Standards &amp; E-Invoicing (2026 Vorgaben)
          </h2>
        </div>
      </div>

      <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
        DB Studio Pro bringt native Parser, Rechner und Exporter für alle Kernstandards im deutschsprachigen Raum (D-A-CH) mit – direkt im Client ausführbar ohne Drittanbieter-Lizenzen:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#1c1c28] border border-[#333344] space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <HardHat size={15} /> GAEB DA XML 3.2 / 3.3 &amp; GAEB 90
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            Import von Leistungsverzeichnissen (X81 bis X86, D83), automatische relationale Tabellenstruktur (OZ, Menge, Einheit, Kurztext, Langtext) und Export von Angebotsabgaben (X84).
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#1c1c28] border border-[#333344] space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
            <Layers size={15} /> DATANORM 4.0 &amp; 5.0
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            Streaming-Import für Großhandelskataloge mit automatischer Erkennung von Artikelnummern, Matchcodes, Rabattgruppen und Staffelpreisen.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#1c1c28] border border-[#333344] space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <FileText size={15} /> ZUGFeRD 2.3 &amp; XRechnung 3.0 (Factur-X / EN 16931)
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            Gesetzeskonforme E-Rechnungen mit validiertem XML-Profil (BASIC, COMFORT, EXTENDED, XRECHNUNG) und Leitweg-ID für öffentliche Auftraggeber (B2B &amp; B2G).
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#1c1c28] border border-[#333344] space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <QrCode size={15} /> Swiss QR-Rechnung (Swiss QR-Bill)
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            Generierung druckfertiger Schweizer QR-Rechnungen nach ISO 20022 mit QR-IBAN, Creditor Reference (SCOR/NON) und automatischem Swiss-Cross Overlay in CHF &amp; EUR.
          </p>
        </div>
      </div>
    </div>
  );
};
