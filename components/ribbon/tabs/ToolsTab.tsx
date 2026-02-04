
import React from 'react';
import { Network, Globe, FileSpreadsheet, Database, Wand2 } from 'lucide-react';
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
      
      <RibbonGroup label="Import & Migration">
        <RibbonButton icon={<FileSpreadsheet className="text-green-600" />} label="Excel Import" onClick={() => onAction('import_excel')} />
        <RibbonButton icon={<Database className="text-red-700" />} label="Access (XML)" onClick={() => onAction('import_access')} />
      </RibbonGroup>

      <RibbonGroup label="Testing">
        <RibbonButton icon={<Wand2 className="text-purple-600" />} label="Testdaten" onClick={() => onAction('generate_dummy')} />
      </RibbonGroup>

      <RibbonGroup label={t('ribbon.groups.external')} isLast>
        <RibbonButton icon={<Globe className="text-blue-600" />} label={t('ribbon.actions.api_query')} onClick={() => onAction('api_import')} />
      </RibbonGroup>
    </div>
  );
};
