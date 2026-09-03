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
import { SingleDevChecklistsHub } from './about/SingleDevChecklistsHub';
import { FaqSection } from './about/FaqSection';
import { IndexedDbAndMultiDbShowcase } from './about/IndexedDbAndMultiDbShowcase';
import { EnterpriseSecurityAndGovernanceDeepDive } from './about/EnterpriseSecurityAndGovernanceDeepDive';
import { DachIndustryStandardsDeepDive } from './about/DachIndustryStandardsDeepDive';
import { UeberDbStudioHeader, SectionView } from './about/UeberDbStudioHeader';
import { Sparkles } from 'lucide-react';

interface UeberDbStudioTabProps {
  onOpenNewModal?: () => void;
}

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
      {/* Top Hero Banner & Navigation */}
      <UeberDbStudioHeader
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto w-full px-6 lg:px-10 py-8 space-y-10">
        {activeSection === 'overview' && (
          <div className="space-y-10">
            <IndexedDbAndMultiDbShowcase />
            <EnterpriseSecurityAndGovernanceDeepDive />
            <DachIndustryStandardsDeepDive />
            <FaqSection />
            <SingleDevChecklistsHub />
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

        {activeSection === 'indexeddb' && (
          <div className="space-y-8">
            <IndexedDbAndMultiDbShowcase />
            <DevOpsAndBridgeShowcase />
            <TechStackShowcase />
          </div>
        )}

        {activeSection === 'security' && (
          <div className="space-y-8">
            <EnterpriseSecurityAndGovernanceDeepDive />
            <RealCapabilitiesMatrix />
          </div>
        )}

        {activeSection === 'dach' && (
          <div className="space-y-8">
            <DachIndustryStandardsDeepDive />
            <IndustryUseCasesSection />
          </div>
        )}

        {activeSection === 'faq' && (
          <div className="space-y-8">
            <FaqSection />
          </div>
        )}

        {activeSection === 'checklists' && (
          <div className="space-y-8">
            <SingleDevChecklistsHub />
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
