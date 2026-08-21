import React, { useState } from 'react';
import { PromoView } from '../../dashboard/PromoView';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';
import { RapidPrototypingFocus } from './about/RapidPrototypingFocus';
import { HonestArchitectureOverview } from './about/HonestArchitectureOverview';
import { RealCapabilitiesMatrix } from './about/RealCapabilitiesMatrix';
import { HonestComparisonSection } from './about/HonestComparisonSection';
import { TechStackShowcase } from './about/TechStackShowcase';
import { FeatureCapabilitiesGrid } from './about/FeatureCapabilitiesGrid';
import { DeveloperDeepDiveGuide } from './about/DeveloperDeepDiveGuide';
import { RealisticMaturityBreakdown } from './about/RealisticMaturityBreakdown';
import { 
  Sparkles, 
  CheckCircle2, 
  Database, 
  Code, 
  Shield, 
  Layers, 
  Zap, 
  Clock, 
  Laptop, 
  Compass, 
  Server,
  Scale,
  Cpu,
  HelpCircle,
  FileCode,
  BookOpen,
  Rocket,
  BarChart3
} from 'lucide-react';

interface UeberDbStudioTabProps {
  onOpenNewModal?: () => void;
}

type SectionView = 'overview' | 'prototyping' | 'maturity' | 'guide' | 'matrix' | 'architecture' | 'techstack' | 'comparison' | 'showroom';

export const UeberDbStudioTab: React.FC<UeberDbStudioTabProps> = ({ onOpenNewModal }) => {
  const store = useProjectStore();
  const ui = useUIStore();
  const [activeSection, setActiveSection] = useState<SectionView>('overview');

  const handleNavigate = (
    type: 'table_create' | 'query_designer' | 'create_report' | 'create_form' | 'table_data',
    id?: string
  ) => {
    if (store.projectId) {
      ui.setIsBackstageOpen(false);
      ui.setActiveTab('home');
      ui.setCurrentView({ type, tableId: id, queryId: id, reportId: id, formId: id } as any);
    } else {
      if (onOpenNewModal) {
        onOpenNewModal();
      } else {
        ui.setBackstageActiveTab('neu');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] text-neutral-100 overflow-y-auto select-none">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-[#272738] to-[#1c1c1c] border-b border-[#383838] px-6 lg:px-10 py-7">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-indigo-600/40 text-indigo-200 border border-indigo-500/50 flex items-center gap-1.5 shadow-sm">
              <Sparkles size={13} className="text-amber-400" /> Transparente Dokumentation &amp; Fakten
            </span>
            <span className="text-xs text-neutral-500">|</span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 size={14} /> Ehrliche Selbsteinschätzung &amp; Architekturübersicht
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                Über DB Studio Pro <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Rapid Prototyping &amp; Zero Setup</span>
              </h1>
              <p className="text-xs md:text-sm text-neutral-300 max-w-3xl leading-relaxed mt-1">
                Ein visuelles Werkzeug für <strong>blitzschnelles Prototyping und interaktive Modellierung</strong>: In kürzester Zeit präsentierbare, klickbare Fachanwendungen ohne Setup-Aufwand entwerfen – und als sauberen Standard-Quellcode (.NET 10, Express, PHP, React, Angular) exportieren.
              </p>
            </div>

            {/* Reifegrad Card */}
            <div className="bg-[#242432]/90 border border-indigo-500/40 rounded-xl p-3.5 px-4 shrink-0 flex items-center gap-3 shadow-md">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Clock size={20} className="animate-spin" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-neutral-400">Entwicklungsstand</div>
                <div className="text-sm font-black text-amber-400 flex items-center gap-1">
                  Reifegrad ~60% <span className="text-xs font-normal text-neutral-300">(Solo-Entwicklung)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#3a3a4c]">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'overview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <Compass size={14} /> 1. Überblick &amp; Philosophie
            </button>
            <button
              onClick={() => setActiveSection('prototyping')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'prototyping'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <Rocket size={14} className="text-amber-400" /> 2. Rapid Prototyping (Fokus)
            </button>
            <button
              onClick={() => setActiveSection('maturity')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'maturity'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <BarChart3 size={14} className="text-emerald-400" /> 3. Reifegrad-Index (~60%)
            </button>
            <button
              onClick={() => setActiveSection('guide')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'guide'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <BookOpen size={14} className="text-indigo-400" /> 4. Entwickler-Guide &amp; Einstieg
            </button>
            <button
              onClick={() => setActiveSection('matrix')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <CheckCircle2 size={14} /> 5. Was geht &amp; was nicht (Fakten)
            </button>
            <button
              onClick={() => setActiveSection('architecture')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'architecture'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <Cpu size={14} /> 6. Technische Architektur
            </button>
            <button
              onClick={() => setActiveSection('techstack')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'techstack'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <Server size={14} /> 7. Stacks (.NET, PHP, Node, Tauri)
            </button>
            <button
              onClick={() => setActiveSection('comparison')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'comparison'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <Scale size={14} /> 8. Ehrlicher Vergleich
            </button>
            <button
              onClick={() => setActiveSection('showroom')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'showroom'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <Sparkles size={14} /> 9. Live Showroom
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto w-full px-6 lg:px-10 py-8 space-y-10">
        {/* Section 1: Overview & Features */}
        {activeSection === 'overview' && (
          <div className="space-y-10">
            <RapidPrototypingFocus />
            <RealisticMaturityBreakdown />
            <DeveloperDeepDiveGuide />
            <FeatureCapabilitiesGrid onNavigateAction={handleNavigate} />
            <RealCapabilitiesMatrix />
            <HonestArchitectureOverview />
            <TechStackShowcase />
            <HonestComparisonSection />
          </div>
        )}

        {/* Section: Rapid Prototyping Focus */}
        {activeSection === 'prototyping' && (
          <div className="space-y-8">
            <RapidPrototypingFocus />
            <HonestComparisonSection />
          </div>
        )}

        {/* Section: Maturity Breakdown */}
        {activeSection === 'maturity' && (
          <div className="space-y-8">
            <RealisticMaturityBreakdown />
            <RealCapabilitiesMatrix />
          </div>
        )}

        {/* Section: Developer Guide */}
        {activeSection === 'guide' && (
          <div className="space-y-8">
            <DeveloperDeepDiveGuide />
          </div>
        )}

        {/* Section 2: Real Capabilities Matrix */}
        {activeSection === 'matrix' && (
          <div className="space-y-8">
            <RealCapabilitiesMatrix />
            <HonestComparisonSection />
          </div>
        )}

        {/* Section 3: Architecture Overview */}
        {activeSection === 'architecture' && (
          <div className="space-y-8">
            <HonestArchitectureOverview />
            <TechStackShowcase />
          </div>
        )}

        {/* Section 4: Tech Stack Showcase */}
        {activeSection === 'techstack' && (
          <div className="space-y-8">
            <TechStackShowcase />
            <FeatureCapabilitiesGrid onNavigateAction={handleNavigate} />
          </div>
        )}

        {/* Section 5: Honest Comparison */}
        {activeSection === 'comparison' && (
          <div className="space-y-8">
            <HonestComparisonSection />
            <RealCapabilitiesMatrix />
          </div>
        )}

        {/* Section 6: Showroom */}
        {activeSection === 'showroom' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="text-amber-400" size={20} /> Live-Showroom &amp; Komponenten-Vorschau
              </h2>
              <p className="text-xs text-neutral-400">
                Erkunden Sie direkt die im Projekt vorhandenen Tabellen, Formulare, Abfragen und Berichte:
              </p>
            </div>

            <PromoView
              tables={store.tables || []}
              queries={store.queries || []}
              reports={store.reports || []}
              forms={store.forms || []}
              onNavigate={handleNavigate}
            />
          </div>
        )}
      </div>
    </div>
  );
};
