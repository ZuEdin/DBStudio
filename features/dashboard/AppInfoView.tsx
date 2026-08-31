import React from 'react';
import { HeroSection } from './info/HeroSection';
import { IndexedDbFirstArchitectureSection } from './info/IndexedDbFirstArchitectureSection';
import { ComparisonSection } from './info/ComparisonSection';
import { FeaturesGrid } from './info/FeaturesGrid';
import { EnterpriseSecuritySection } from './info/EnterpriseSecuritySection';
import { DachIndustryStandardsSection } from './info/DachIndustryStandardsSection';
import { DesktopBuildsSection } from './info/DesktopBuildsSection';
import { AiAndAutomationSection } from './info/AiAndAutomationSection';
import { LiveCollaborationSection } from './info/LiveCollaborationSection';
import { FaqSection } from './info/FaqSection';
import { SupportedTechSection } from './info/SupportedTechSection';
import { FooterCTA } from './info/FooterCTA';

interface AppInfoViewProps {
  onNavigate: (view: string) => void;
}

export const AppInfoView: React.FC<AppInfoViewProps> = ({ onNavigate }) => {
  return (
    <div className="h-full bg-slate-950 text-slate-100 overflow-y-auto" id="app-info-view-root">
      <HeroSection onNavigate={onNavigate} />
      <IndexedDbFirstArchitectureSection />
      <ComparisonSection />
      <FeaturesGrid />
      <EnterpriseSecuritySection />
      <DachIndustryStandardsSection />
      <DesktopBuildsSection />
      <AiAndAutomationSection />
      <LiveCollaborationSection />
      <FaqSection />
      <SupportedTechSection />
      <FooterCTA onNavigate={onNavigate} />
    </div>
  );
};
