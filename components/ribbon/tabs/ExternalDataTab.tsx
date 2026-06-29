import React from 'react';
import { FileSpreadsheet, Database, Globe, Share2, FileCode, RefreshCw } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';

interface ExternalDataTabProps {
  onAction: (action: string) => void;
}

export const ExternalDataTab: React.FC<ExternalDataTabProps> = ({ onAction }) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-4 h-full">
      <RibbonGroup label="Lokaler Import">
        <RibbonButton icon={<FileSpreadsheet className="text-green-600" />} label="Excel Import" onClick={() => onAction('import_excel')} />
        <RibbonButton icon={<Database className="text-red-700" />} label="Access (XML)" onClick={() => onAction('import_access')} />
        <RibbonButton icon={<FileCode className="text-purple-600" />} label="Schema/SQL/JSON" onClick={() => onAction('import_schema')} />
      </RibbonGroup>

      <RibbonGroup label="Cloud & APIs" isLast>
        <RibbonButton icon={<Globe className="text-blue-600" />} label="API Import" onClick={() => onAction('api_import')} />
        <RibbonButton icon={<Share2 className="text-teal-600" />} label="SharePoint" onClick={() => onAction('sharepoint_import')} />
        <RibbonButton icon={<RefreshCw className="text-cyan-600" />} label="Live DB Sync" onClick={() => onAction('live_sync')} />
      </RibbonGroup>
    </div>
  );
};
