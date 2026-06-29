import React from 'react';
import { Network, ShieldCheck, Layers, Settings, Wand2, Briefcase, ClipboardList } from 'lucide-react';
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

      <RibbonGroup label="Zusammenarbeit">
        <RibbonButton icon={<ClipboardList className="text-sky-600" />} label="Kanban-Board" onClick={() => onAction('tickets_board')} size="large" />
      </RibbonGroup>

      <RibbonGroup label="App-Struktur">
        <RibbonButton icon={<Layers className="text-indigo-600" />} label="Navigation" onClick={() => onAction('navigation_designer')} />
        <RibbonButton icon={<Settings className="text-slate-600" />} label="Globale Logik" onClick={() => onAction('logic_designer')} />
        <RibbonButton icon={<ShieldCheck className="text-emerald-600" />} label="Sicherheit" onClick={() => onAction('security_manager')} />
      </RibbonGroup>

      <RibbonGroup label="Personalisierung">
        <RibbonButton icon={<Briefcase className="text-pink-600" />} label="Branding & Theme" onClick={() => onAction('theme_designer')} />
      </RibbonGroup>

      <RibbonGroup label="Testdaten" isLast>
        <RibbonButton icon={<Wand2 className="text-purple-600" />} label="Testdaten Gen" onClick={() => onAction('generate_dummy')} />
      </RibbonGroup>
    </div>
  );
};
