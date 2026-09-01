import React from 'react';
import { FileSpreadsheet, Database, Globe, Share2, FileCode, RefreshCw, Download, Save, Layers, WifiOff, ArrowLeftRight, Cloud, Wand2 } from 'lucide-react';
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
      <RibbonGroup label="Multi-DB Sync & Replikation">
        <RibbonButton 
          icon={<ArrowLeftRight className="text-indigo-600" />} 
          label="Sync Matrix & Replikation" 
          onClick={() => onAction('open_sync_matrix')} 
        />
        <RibbonButton 
          icon={<WifiOff className="text-amber-600" />} 
          label="Baustelle Offline-Sync" 
          onClick={() => onAction('open_construction_offline')} 
        />
      </RibbonGroup>

      <RibbonGroup label="Baubranche & Schnittstellen">
        <RibbonButton 
          icon={<Layers className="text-emerald-600" />} 
          label="GAEB / DATANORM / ZUGFeRD" 
          onClick={() => onAction('open_gaeb_interfaces')} 
        />
      </RibbonGroup>

      <RibbonGroup label="Lokaler Import">
        <RibbonButton icon={<FileSpreadsheet className="text-green-600" />} label="Excel Import" onClick={() => onAction('import_excel')} />
        <RibbonButton icon={<Wand2 className="text-amber-600" />} label="Smart CSV Migration" onClick={() => onAction('open_csv_migration')} />
        <RibbonButton icon={<Database className="text-red-700" />} label="MS Access (MDB/ACCDB)" onClick={() => onAction('open_access_mdb')} />
        <RibbonButton icon={<FileCode className="text-purple-600" />} label="Schema/SQL/JSON" onClick={() => onAction('import_schema')} />
        <RibbonButton icon={<ArrowLeftRight className="text-purple-600" />} label="AST Code Sync" onClick={() => onAction('open_ast_sync')} />
      </RibbonGroup>

      <RibbonGroup label="Lokaler Export">
        <RibbonButton icon={<FileSpreadsheet className="text-emerald-700" />} label="Excel Export" onClick={() => onAction('export_excel')} />
        <RibbonButton icon={<Database className="text-orange-700" />} label="XML Export" onClick={() => onAction('export_access')} />
        <RibbonButton icon={<FileCode className="text-indigo-600" />} label="SQL Dump / Schema" onClick={() => onAction('export_sql')} />
      </RibbonGroup>

      <RibbonGroup label="Cloud &amp; APIs">
        <RibbonButton icon={<Cloud className="text-sky-600" />} label="Nextcloud App" onClick={() => onAction('open_nextcloud_generator')} />
        <RibbonButton icon={<Globe className="text-blue-600" />} label="API Import" onClick={() => onAction('api_import')} />
        <RibbonButton icon={<Share2 className="text-teal-600" />} label="SharePoint" onClick={() => onAction('sharepoint_import')} />
        <RibbonButton icon={<RefreshCw className="text-cyan-600" />} label="Live DB Sync" onClick={() => onAction('live_sync')} />
      </RibbonGroup>

      <RibbonGroup label="No-Code &amp; Webhooks">
        <RibbonButton icon={<Globe className="text-cyan-500" />} label="Webhook Hub" onClick={() => onAction('open_webhook_hub')} />
        <RibbonButton icon={<Layers className="text-orange-500" />} label="n8n / Zapier" onClick={() => onAction('open_automation_modal')} />
      </RibbonGroup>

      <RibbonGroup label="Speichern & Sichern" isLast>
        <RibbonButton icon={<Save className="text-blue-700 font-bold" />} label="Daten speichern" onClick={() => onAction('save')} />
        <RibbonButton icon={<Download className="text-violet-600" />} label="Backup laden" onClick={() => onAction('load_backup')} />
      </RibbonGroup>
    </div>
  );
};


