import React from 'react';
import { Rocket, Code, Sparkles, Database } from 'lucide-react';

interface HeroSectionProps {
  onNavigate: (view: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  return (
    <div className="bg-slate-900 text-white pt-16 pb-20 px-6 relative overflow-hidden" id="hero-section">
      {/* Subtle non-gradient pattern */}
      <div className="absolute top-0 right-0 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
        <Database size={500} className="text-slate-100" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-xs font-bold mb-6">
          <Sparkles size={12} className="animate-pulse" />
          <span>Neu: Desktop-Support mit Tauri & Rust</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight leading-tight max-w-4xl text-white">
          Smarte Datenmodellierung, visuelles UI-Design und automatisierter Code.
        </h1>
        
        <p className="text-base md:text-lg text-slate-300 max-w-2xl mb-8 leading-relaxed">
          DB Studio Pro verbindet die Einfachheit klassischer Desktop-Datenbanken mit der Skalierbarkeit moderner Webtechnologien. Entwerfen Sie Ihre Tabellen visuell, automatisieren Sie Logik per Makro-Editor und generieren Sie einsatzbereite Anwendungen per Knopfdruck.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onNavigate('create_table')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-sm"
            id="btn-start-designer"
          >
            <Rocket size={16} />
            <span>Visuellen Designer starten</span>
          </button>
          
          <button
            onClick={() => onNavigate('backend_generate')}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-sm"
            id="btn-open-blueprints"
          >
            <Code size={16} />
            <span>Blueprint Center öffnen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
