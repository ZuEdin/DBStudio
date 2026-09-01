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

      {/* Honest Success Story Placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-dashed border-indigo-700/60 p-6 rounded-2xl space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 bg-indigo-950/70 border border-indigo-800/80 px-2.5 py-0.5 rounded-full">
              Hier kann Ihre Erfolgsgeschichte stehen #1
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Platzhalter</span>
          </div>
          <p className="text-xs text-slate-300 italic leading-relaxed">
            „Hier kann Ihre eigene Erfolgsgeschichte mit DB Studio Pro stehen: Berichten Sie von Ihrer erfolgreichen Access-Migration, Ihren individuellen Datenbankmasken, automatisierten E-Rechnungen (ZUGFeRD / Swiss QR) oder eingesparten Entwicklungskosten.“
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="font-bold text-white">Ihr Name / Ihr Unternehmen</span>
            <span className="text-slate-400 font-normal">Ihre Branche &amp; IT-Rolle</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-dashed border-indigo-700/60 p-6 rounded-2xl space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
              Hier kann Ihre Erfolgsgeschichte stehen #2
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Platzhalter</span>
          </div>
          <p className="text-xs text-slate-300 italic leading-relaxed">
            „Teilen Sie Ihre Praxis-Erfahrungen mit der Community: Wie hat Ihnen die visuelle Schema-Modellierung, der Multi-DB DDL-Export oder die lokale Offline-Fähigkeit in Ihrem Projekt geholfen?“
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="font-bold text-white">Ihr Team / Ihre Organisation</span>
            <span className="text-slate-400 font-normal">Ihr Anwendungsfall</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <CheckCircle2 size={13} className="text-emerald-400" />
          <span><strong>100% Transparenz:</strong> Wir verzichten bewusst auf erfundene Marketing-Testimonials. Echtes Feedback und echte Software stehen im Mittelpunkt.</span>
        </p>
      </div>
    </div>
  );
};
