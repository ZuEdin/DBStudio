import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  BarChart3, 
  Compass, 
  HardDrive, 
  ShieldCheck, 
  Layers, 
  HelpCircle, 
  CheckSquare, 
  Briefcase, 
  Code2, 
  Server, 
  BookOpen, 
  Scale 
} from 'lucide-react';

export type SectionView = 
  | 'overview' 
  | 'indexeddb' 
  | 'security' 
  | 'dach' 
  | 'faq' 
  | 'checklists' 
  | 'usecases' 
  | 'codegen' 
  | 'devops' 
  | 'maturity' 
  | 'guide' 
  | 'matrix' 
  | 'comparison' 
  | 'showroom';

interface UeberDbStudioHeaderProps {
  activeSection: SectionView;
  setActiveSection: (section: SectionView) => void;
}

export const UeberDbStudioHeader: React.FC<UeberDbStudioHeaderProps> = ({
  activeSection,
  setActiveSection
}) => {
  return (
    <div className="bg-[#171b26] border-b border-[#2d3142] px-6 lg:px-10 py-7">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-xs">
            <Sparkles size={13} className="text-amber-400" /> Geheimtipp in aktiver Entwicklung (Pre-1.0 Preview)
          </span>
          <span className="text-xs text-neutral-500">•</span>
          <span className="text-xs text-emerald-300 font-bold flex items-center gap-1">
            <CheckCircle2 size={14} className="text-emerald-400" /> Keine Fake-Firmen • 100% ehrliche Software
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Über DB Studio Pro <span className="text-xs font-bold px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">v0.8.5 Beta Preview</span>
            </h1>
            <p className="text-xs md:text-sm text-neutral-300 max-w-3xl leading-relaxed mt-1">
              Die vollintegrierte Low-Code &amp; Database Engineering Suite für <strong>In-Browser Access-Migration, DACH-Kalkulation, .NET 10 / Node / Python Full-Stack Code-Generierung, E-Invoicing (ZUGFeRD / Swiss QR) und Multi-DB DDL</strong>. Noch wissen nur sehr wenige von diesem Tool – Ihr technologischer Vorteil als Early Adopter.
            </p>
          </div>

          {/* Reifegrad Card */}
          <div className="bg-[#1c2033] border border-amber-500/40 rounded-xl p-3.5 px-4 shrink-0 flex items-center gap-3 shadow-md">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <BarChart3 size={22} className="text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-neutral-400">Entwicklungs-Status &amp; Reifegrad</div>
              <div className="text-sm font-black text-amber-300 flex items-center gap-1">
                Developer Preview <span className="text-xs font-normal text-neutral-300">(Kernfunktionen stabil)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#3a3a4c]">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'overview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
            }`}
          >
            <Compass size={14} /> 1. Überblick
          </button>
          <button
            onClick={() => setActiveSection('indexeddb')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'indexeddb'
                ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400'
                : 'bg-[#2b2b2b] text-emerald-300 hover:bg-[#383838] hover:text-white'
            }`}
          >
            <HardDrive size={14} className="text-emerald-400" /> 2. IndexedDB &amp; Multi-DB
          </button>
          <button
            onClick={() => setActiveSection('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'security'
                ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-400'
                : 'bg-[#2b2b2b] text-rose-300 hover:bg-[#383838] hover:text-white'
            }`}
          >
            <ShieldCheck size={14} className="text-rose-400" /> 3. Security (RBAC/RLS)
          </button>
          <button
            onClick={() => setActiveSection('dach')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'dach'
                ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-400'
                : 'bg-[#2b2b2b] text-amber-300 hover:bg-[#383838] hover:text-white'
            }`}
          >
            <Layers size={14} className="text-amber-400" /> 4. DACH Standards
          </button>
          <button
            onClick={() => setActiveSection('faq')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'faq'
                ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-400'
                : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
            }`}
          >
            <HelpCircle size={14} className="text-amber-400" /> 5. FAQ Hub
          </button>
          <button
            onClick={() => setActiveSection('checklists')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'checklists'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
            }`}
          >
            <CheckSquare size={14} className="text-emerald-400" /> 6. Checklisten
          </button>
          <button
            onClick={() => setActiveSection('usecases')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'usecases'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
            }`}
          >
            <Briefcase size={14} className="text-indigo-400" /> 7. Praxis-Szenarien
          </button>
          <button
            onClick={() => setActiveSection('codegen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'codegen'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
            }`}
          >
            <Code2 size={14} className="text-indigo-400" /> 8. Code-Generatoren
          </button>
          <button
            onClick={() => setActiveSection('devops')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'devops'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
            }`}
          >
            <Server size={14} className="text-indigo-400" /> 9. Local Bridge
          </button>
          <button
            onClick={() => setActiveSection('maturity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'maturity'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
            }`}
          >
            <BarChart3 size={14} className="text-emerald-400" /> 10. Reifegrad
          </button>
          <button
            onClick={() => setActiveSection('guide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'guide'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
            }`}
          >
            <BookOpen size={14} className="text-indigo-400" /> 11. Entwickler-Guide
          </button>
          <button
            onClick={() => setActiveSection('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'matrix'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
            }`}
          >
            <CheckCircle2 size={14} /> 12. Roadmap
          </button>
          <button
            onClick={() => setActiveSection('comparison')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'comparison'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
            }`}
          >
            <Scale size={14} /> 13. Ehrlicher Vergleich
          </button>
          <button
            onClick={() => setActiveSection('showroom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'showroom'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-[#2b2b2b] text-amber-300 hover:bg-[#383838] hover:text-white'
            }`}
          >
            <Sparkles size={14} /> 14. Showroom &amp; Features
          </button>
        </div>
      </div>
    </div>
  );
};
