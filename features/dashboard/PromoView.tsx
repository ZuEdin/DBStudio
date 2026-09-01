import React, { useState } from 'react';
import { Table, Query, Report, Form } from '../../types';
import { PromoHeroSection } from './promo/PromoHeroSection';
import { PromoInteractiveShowcase } from './promo/PromoInteractiveShowcase';
import { PromoFeaturesBento } from './promo/PromoFeaturesBento';
import { PromoRoiCalculator } from './promo/PromoRoiCalculator';
import { PromoTestimonialsAndBadges } from './promo/PromoTestimonialsAndBadges';
import { PromoLocalFirstBanner } from './promo/PromoLocalFirstBanner';

interface PromoViewProps {
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  onNavigate: (type: 'table_create' | 'query_designer' | 'create_report' | 'create_form' | 'table_data', id?: string) => void;
}

export const PromoView: React.FC<PromoViewProps> = ({ tables, queries, reports, forms, onNavigate }) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen overflow-x-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-20 relative z-10">
        <PromoHeroSection
          tables={tables}
          queries={queries}
          reports={reports}
          forms={forms}
          device={device}
          setDevice={setDevice}
          onNavigate={onNavigate}
        />

        <PromoInteractiveShowcase device={device} />

        <PromoFeaturesBento onNavigate={onNavigate} />

        <PromoRoiCalculator onNavigate={onNavigate} />

        <PromoTestimonialsAndBadges />

        <PromoLocalFirstBanner onNavigate={onNavigate} />
      </div>
    </div>
  );
};
