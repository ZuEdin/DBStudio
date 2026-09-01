import React from 'react';
import { CheckCircle2, Shield, ArrowRight, ExternalLink } from 'lucide-react';

interface PromoLocalFirstBannerProps {
  onNavigate: (type: 'table_create') => void;
}

export const PromoLocalFirstBanner: React.FC<PromoLocalFirstBannerProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-12">
      <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-950 border border-indigo-900/50 rounded-3xl p-8 sm:p-12 max-w-5xl mx-auto space-y-8 flex flex-col md:flex-row gap-8 items-center justify-between shadow-2xl">
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-300 font-bold">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>100% Echte Softwareentwicklung &amp; Local-First</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            Volle Datensouveränität &amp; Null Vendor Lock-in
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            DB Studio Pro ist eine professionelle, autarke Entwicklungsumgebung. Ihre Schemata, Formulardefinitionen und Datensätze verbleiben lokal in Ihrem Browser und auf Ihrem PC. Kein Zwang zu proprietären Cloud-Abos und 100% Quellcode-Eigentum bei jedem Export.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
              <CheckCircle2 size={14} className="text-emerald-400" /> 0 € Lizenzgebühren
            </div>
            <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
              <CheckCircle2 size={14} className="text-indigo-400" /> Standard .NET / Node / Python
            </div>
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <CheckCircle2 size={14} className="text-amber-400" /> Native Local Bridge
            </div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 w-full md:w-80 shadow-lg shrink-0">
          <h4 className="text-xs font-extrabold uppercase text-slate-300 tracking-wider">
            Ihre Vorteile auf einen Blick
          </h4>
          <div className="space-y-2.5 text-xs">
            <div className="flex gap-2 items-center text-slate-300">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>100% quelloffener Code-Export</span>
            </div>
            <div className="flex gap-2 items-center text-slate-300">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>Offlinefähig dank IndexedDB</span>
            </div>
            <div className="flex gap-2 items-center text-slate-300">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>Kompatibel mit MS Access &amp; SQL Server</span>
            </div>
            <div className="flex gap-2 items-center text-slate-300">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>Natives .dbsp Projekt-Format</span>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('table_create')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            Jetzt Studio öffnen <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Footer info */}
      <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div>
          © 2026 DB Studio Pro. Alle Rechte vorbehalten. Low-Code &amp; Database Engineering Suite.
        </div>
        <div className="flex gap-4">
          <a href="#interactive-showroom" className="hover:text-white transition-colors">Spezifikation</a>
          <span className="text-slate-600">•</span>
          <span className="text-indigo-400 font-semibold">Version 1.0.0 Gold Master</span>
        </div>
      </div>
    </div>
  );
};
