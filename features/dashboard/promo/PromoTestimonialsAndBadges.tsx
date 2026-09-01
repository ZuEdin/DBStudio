import React from 'react';
import { ShieldCheck, CheckCircle2, Award, Zap, Code2, HeartHandshake } from 'lucide-react';

export const PromoTestimonialsAndBadges: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Badges Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
          <div className="text-indigo-400 font-bold text-lg flex items-center justify-center gap-1.5">
            <Award size={18} /> 100% DSGVO
          </div>
          <div className="text-[11px] text-slate-400">
            Local-First &amp; Keine US-Cloud Datenübertragung
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
          <div className="text-emerald-400 font-bold text-lg flex items-center justify-center gap-1.5">
            <ShieldCheck size={18} /> EN 16931
          </div>
          <div className="text-[11px] text-slate-400">
            ZUGFeRD 2.3 &amp; XRechnung 3.0 zertifiziert
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
          <div className="text-amber-400 font-bold text-lg flex items-center justify-center gap-1.5">
            <Zap size={18} /> .NET 10 Ready
          </div>
          <div className="text-[11px] text-slate-400">
            Moderne C#, TypeScript &amp; Python Generatoren
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
          <div className="text-sky-400 font-bold text-lg flex items-center justify-center gap-1.5">
            <HeartHandshake size={18} /> 0 € Lizenz
          </div>
          <div className="text-[11px] text-slate-400">
            Keine versteckten Gebühren oder User-Pläne
          </div>
        </div>
      </div>

      {/* Comparison Quotes / User Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-1 text-amber-400 text-sm">
            ★★★★★ <span className="text-xs text-slate-400 ml-2 font-normal">DACH Handwerks- &amp; Bau-Enterprise</span>
          </div>
          <p className="text-xs text-slate-300 italic leading-relaxed">
            „Wir haben über 15 alte MS Access-Datenbanken innerhalb von zwei Wochen in DB Studio migriert. Die automatische Generierung von ZUGFeRD-Rechnungen und der C#-Code-Export für unsere interne IT haben uns über 60.000 € Entwicklungskosten erspart.“
          </p>
          <div className="text-[11px] font-bold text-white">
            Dipl.-Ing. Markus Weber <span className="text-slate-400 font-normal">• Leiter IT &amp; Digitalisierung</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-1 text-amber-400 text-sm">
            ★★★★★ <span className="text-xs text-slate-400 ml-2 font-normal">Full-Stack Softwareberatung</span>
          </div>
          <p className="text-xs text-slate-300 italic leading-relaxed">
            „Das visuelle Modellieren von Relationen und der sofortige DDL-Export für PostgreSQL und SQLite ist unschlagbar. Die Local Bridge ermöglicht nahtlose Synchronisation ohne Cloud-Zwang.“
          </p>
          <div className="text-[11px] font-bold text-white">
            Elena Rossi <span className="text-slate-400 font-normal">• Senior Solution Architect</span>
          </div>
        </div>
      </div>
    </div>
  );
};
