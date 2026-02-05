
import React from 'react';
import { Globe, CloudLightning, Server, UploadCloud, Radio, CircuitBoard, Share2 } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';

interface IntegrationTabProps {
  onAction: (action: string) => void;
}

export const IntegrationTab: React.FC<IntegrationTabProps> = ({ onAction }) => {
  return (
    <div className="flex gap-4 h-full">
      
      {/* External Data Group */}
      <RibbonGroup label="Datenquellen">
        <RibbonButton 
            icon={<Globe className="text-blue-600" />} 
            label="API Import" 
            onClick={() => onAction('api_import')} 
        />
        <RibbonButton 
            icon={<Share2 className="text-teal-600" />} 
            label="SharePoint" 
            onClick={() => onAction('sharepoint_import')} 
        />
      </RibbonGroup>

      {/* Services Hub Group - The new Central Hub */}
      <RibbonGroup label="Dienste & Module">
        <RibbonButton 
            icon={<CircuitBoard className="text-purple-600" />} 
            label="Integrations Hub" 
            onClick={() => onAction('open_integrations')} 
            size="large"
        />
        <div className="flex flex-col gap-1">
             <button onClick={() => onAction('open_integrations')} className="text-[10px] text-left px-2 py-1 hover:bg-slate-200 rounded flex items-center gap-2 text-slate-600">
                 <CloudLightning size={12}/> AI & LLM
             </button>
             <button onClick={() => onAction('open_integrations')} className="text-[10px] text-left px-2 py-1 hover:bg-slate-200 rounded flex items-center gap-2 text-slate-600">
                 <Radio size={12}/> Chat / Realtime
             </button>
        </div>
      </RibbonGroup>

      {/* DevOps Group */}
      <RibbonGroup label="DevOps & Cloud" isLast>
        <RibbonButton 
            icon={<Server className="text-teal-600" />} 
            label="Umgebungen" 
            onClick={() => onAction('open_envs')} 
        />
        <RibbonButton 
            icon={<UploadCloud className="text-indigo-600" />} 
            label="Deployment" 
            onClick={() => onAction('open_deployment_modal')} 
        />
      </RibbonGroup>
    </div>
  );
};
