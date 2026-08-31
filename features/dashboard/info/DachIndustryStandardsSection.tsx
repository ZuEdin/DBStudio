import React from 'react';
import { Layers, FileText, QrCode, HardHat, CheckCircle2, ArrowRight } from 'lucide-react';

export const DachIndustryStandardsSection: React.FC = () => {
  const standards = [
    {
      icon: <HardHat className="text-amber-500" size={22} />,
      badge: "Bau & Handwerk",
      badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/30",
      title: "GAEB DA XML (90, 2000, 3.2)",
      desc: "Importieren und exportieren Sie Leistungsverzeichnisse (X81 bis X86, D83) standardkonform. Berechnen Sie Einheitspreise und erstellen Sie direkt bepreiste Angebotsabgaben."
    },
    {
      icon: <Layers className="text-blue-500" size={22} />,
      badge: "Großhandel & Kataloge",
      badgeColor: "bg-blue-500/10 text-blue-300 border-blue-500/30",
      title: "DATANORM 4.0 & 5.0",
      desc: "Blitzschnelles Einlesen gigantischer Artikel- und Preiskataloge direkt in die IndexedDB. Verknüpfen Sie Großhandelspreise mit LV-Positionen und Rabattgruppen."
    },
    {
      icon: <FileText className="text-emerald-500" size={22} />,
      badge: "E-Rechnung (Gesetz 2025)",
      badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      title: "ZUGFeRD 2.2 & XRechnung",
      desc: "Erstellen Sie rechtskonforme Factur-X Hybrid-Rechnungen (PDF/A-3 mit eingebettetem XML) inklusive amtlicher Leitweg-ID für Behörden und B2B."
    },
    {
      icon: <QrCode className="text-rose-500" size={22} />,
      badge: "Schweiz & Liechtenstein",
      badgeColor: "bg-rose-500/10 text-rose-300 border-rose-500/30",
      title: "Swiss QR Bill (QR-Rechnung)",
      desc: "Integrierte Generierung des Schweizer QR-Zahlteils mit IBAN/QR-IBAN, strukturierter Referenz (SCOR) und mehrsprachigen Zahlungsangaben."
    }
  ];

  return (
    <div className="py-16 px-6 bg-slate-900 text-white border-b border-slate-800" id="dach-standards-section">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mb-3">
            <Layers size={13} /> DACH-Branchenstandards &amp; Schnittstellen
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            Maßgeschneidert für Deutschland, Österreich &amp; Schweiz
          </h2>
          <p className="text-slate-300 text-sm md:text-base max-w-3xl mx-auto mt-3 leading-relaxed">
            DB Studio bringt sofort einsatzbereite Schnittstellen für die anspruchsvollsten Branchenformate im deutschsprachigen Raum mit – ohne teure Zusatzmodule.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {standards.map((std, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    {std.icon}
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${std.badgeColor}`}>
                    {std.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{std.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{std.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
