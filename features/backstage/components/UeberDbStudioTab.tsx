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
import { DevOpsAndBridgeShowcase } from './about/DevOpsAndBridgeShowcase';
import { IndustryUseCasesSection } from './about/IndustryUseCasesSection';
import { CodeGenerationDeepDive } from './about/CodeGenerationDeepDive';
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
  BarChart3,
  Briefcase,
  Code2
} from 'lucide-react';

interface UeberDbStudioTabProps {
  onOpenNewModal?: () => void;
}

type SectionView = 'overview' | 'usecases' | 'codegen' | 'devops' | 'maturity' | 'guide' | 'matrix' | 'architecture' | 'comparison' | 'showroom';

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
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
              <Sparkles size={13} className="text-amber-400" /> Vor-1.0 Entwicklungsphase (v0.8.5 Beta)
            </span>
            <span className="text-xs text-neutral-500">|</span>
            <span className="text-xs text-indigo-300 font-bold flex items-center gap-1">
              <CheckCircle2 size={14} className="text-indigo-400" /> Reifegrad: ~82% (Ehrlicher Status • Local Bridge v0.9.2)
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                Über DB Studio Pro <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">v0.8.5 Beta • Be Honest</span>
              </h1>
              <p className="text-xs md:text-sm text-neutral-300 max-w-3xl leading-relaxed mt-1">
                Die Low-Code Suite für <strong>Datenbank-Modellierung, DevOps, GAEB-Schnittstellen und Code-Export</strong>: Sehr viele Kernfunktionen laufen stabil – kontinuierlich optimiert und getestet.
              </p>
            </div>

            {/* Reifegrad Card */}
            <div className="bg-[#242432]/90 border border-indigo-500/40 rounded-xl p-3.5 px-4 shrink-0 flex items-center gap-3 shadow-md">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <BarChart3 size={22} className="text-indigo-400" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-neutral-400">Reifegrad (Ehrlich bewertet)</div>
                <div className="text-sm font-black text-amber-300 flex items-center gap-1">
                  ~82% Funktional <span className="text-xs font-normal text-neutral-300">(Aktiver Beta-Test)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#3a3a4c]">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'overview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <Compass size={14} /> 1. Überblick
            </button>
            <button
              onClick={() => setActiveSection('usecases')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'usecases'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <Briefcase size={14} className="text-emerald-400" /> 2. Praxis-Szenarien
            </button>
            <button
              onClick={() => setActiveSection('codegen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'codegen'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <Code2 size={14} className="text-indigo-400" /> 3. Code-Generatoren
            </button>
            <button
              onClick={() => setActiveSection('devops')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'devops'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <Server size={14} className="text-indigo-400" /> 4. Local Bridge &amp; DevOps
            </button>
            <button
              onClick={() => setActiveSection('maturity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'maturity'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <BarChart3 size={14} className="text-amber-400" /> 5. Reifegrad (~82%)
            </button>
            <button
              onClick={() => setActiveSection('guide')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'guide'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <BookOpen size={14} className="text-indigo-400" /> 6. Entwickler-Guide
            </button>
            <button
              onClick={() => setActiveSection('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <CheckCircle2 size={14} /> 7. Roadmap &amp; To-Do
            </button>
            <button
              onClick={() => setActiveSection('comparison')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'comparison'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <Scale size={14} /> 8. Vergleich
            </button>
            <button
              onClick={() => setActiveSection('showroom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'showroom'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#2b2b2b] text-neutral-300 hover:bg-[#383838] hover:text-white'
              }`}
            >
              <Sparkles size={14} /> 9. Showroom
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto w-full px-6 lg:px-10 py-8 space-y-10">
        {activeSection === 'overview' && (
          <div className="space-y-10">
            <IndustryUseCasesSection />
            <CodeGenerationDeepDive />
            <DevOpsAndBridgeShowcase />
            <RealisticMaturityBreakdown />
            <RapidPrototypingFocus />
            <DeveloperDeepDiveGuide />
            <FeatureCapabilitiesGrid onNavigateAction={handleNavigate} />
            <RealCapabilitiesMatrix />
            <HonestArchitectureOverview />
            <TechStackShowcase />
            <HonestComparisonSection />
          </div>
        )}

        {activeSection === 'usecases' && (
          <div className="space-y-8">
            <IndustryUseCasesSection />
            <CodeGenerationDeepDive />
            <HonestComparisonSection />
          </div>
        )}

        {activeSection === 'codegen' && (
          <div className="space-y-8">
            <CodeGenerationDeepDive />
            <TechStackShowcase />
            <DeveloperDeepDiveGuide />
          </div>
        )}

        {activeSection === 'devops' && (
          <div className="space-y-8">
            <DevOpsAndBridgeShowcase />
            <RealCapabilitiesMatrix />
          </div>
        )}

        {activeSection === 'maturity' && (
          <div className="space-y-8">
            <RealisticMaturityBreakdown />
            <RealCapabilitiesMatrix />
          </div>
        )}

        {activeSection === 'guide' && (
          <div className="space-y-8">
            <DeveloperDeepDiveGuide />
            <CodeGenerationDeepDive />
          </div>
        )}

        {activeSection === 'matrix' && (
          <div className="space-y-8">
            <RealCapabilitiesMatrix />
            <DevOpsAndBridgeShowcase />
            <HonestComparisonSection />
          </div>
        )}

        {activeSection === 'comparison' && (
          <div className="space-y-8">
            <HonestComparisonSection />
            <IndustryUseCasesSection />
          </div>
        )}

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
