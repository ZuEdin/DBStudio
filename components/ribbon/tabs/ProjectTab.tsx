
import React from 'react';
import { Briefcase, ShieldCheck, Globe, Database, Key } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';

interface ProjectTabProps {
  onAction: (action: string) => void;
}

export const ProjectTab: React.FC<ProjectTabProps> = ({ onAction }) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex gap-4 h-full">
      {/* Governance Group */}
      <RibbonGroup label={t('ribbon.groups.governance')}>
        <RibbonButton 
            icon={<ShieldCheck className="text-emerald-600" />} 
            label={t('ribbon.actions.security')} 
            onClick={() => onAction('security_manager')} 
            size="large"
        />
      </RibbonGroup>

      {/* Business Group */}
      <RibbonGroup label={t('ribbon.groups.business')}>
        <RibbonButton 
            icon={<Briefcase className="text-indigo-600" />} 
            label={t('ribbon.actions.whitelabel')} 
            onClick={() => onAction('open_whitelabel')} 
        />
        <div className="flex flex-col gap-1">
             <button onClick={() => onAction('open_whitelabel')} className="text-xs text-left px-2 py-1 hover:bg-slate-200 rounded flex items-center gap-2">
                 <Key size={12}/> Lizenzierung
             </button>
             <button onClick={() => onAction('open_whitelabel')} className="text-xs text-left px-2 py-1 hover:bg-slate-200 rounded flex items-center gap-2">
                 <Globe size={12}/> Multi-Tenancy
             </button>
        </div>
      </RibbonGroup>
    </div>
  );
};
