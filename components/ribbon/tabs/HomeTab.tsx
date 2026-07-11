import React from 'react';
import { Network, ShieldCheck, Layers, Settings, Wand2, Briefcase, ClipboardList, Route, Zap, Users, Database, Sparkles, History } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';

interface HomeTabProps {
  onAction: (action: string) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ onAction }) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-4 h-full">
      <RibbonGroup label="Design">
        <RibbonButton icon={<Network className="text-blue-600" />} label="Beziehungen" onClick={() => onAction('relationships')} size="large" />
      </RibbonGroup>

      <RibbonGroup label="Zusammenarbeit" isLast>
        <RibbonButton icon={<ClipboardList className="text-sky-600" />} label="Kanban-Board" onClick={() => onAction('tickets_board')} size="large" />
        <RibbonButton icon={<History className="text-amber-600" />} label="Git-Schema" onClick={() => onAction('version_control')} size="large" />
        <RibbonButton icon={<Sparkles className="text-purple-600 animate-pulse" />} label="AI-Schwarm (Inaktiv)" onClick={() => {}} size="large" disabled={true} />
      </RibbonGroup>
    </div>
  );
};
