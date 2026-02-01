
import React from 'react';
import { Network, Globe } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';

interface ToolsTabProps {
  onAction: (action: string) => void;
}

export const ToolsTab: React.FC<ToolsTabProps> = ({ onAction }) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-4 h-full">
      <RibbonGroup label={t('ribbon.groups.database')}>
        <RibbonButton icon={<Network />} label={t('ribbon.actions.relationships')} onClick={() => onAction('relationships')} size="large" />
      </RibbonGroup>
      
      <RibbonGroup label={t('ribbon.groups.external')} isLast>
        <RibbonButton icon={<Globe className="text-blue-600" />} label={t('ribbon.actions.api_query')} onClick={() => onAction('api_import')} />
      </RibbonGroup>
    </div>
  );
};
