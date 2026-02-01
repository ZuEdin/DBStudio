
import React from 'react';
import { BackendConfig } from '../types/index';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from 'react-i18next';
import { CollaborationBar } from './CollaborationBar';
import { cloudService } from '../services/cloudService';
import { Cloud, GitBranch } from 'lucide-react';

interface AppHeaderProps {
  projectName: string;
  backendConfig: BackendConfig;
  onExport: (config: BackendConfig) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ projectName, backendConfig, onExport }) => {
  const { t } = useTranslation();
  // Mock Data: In a real app, this would come from a Context/Store connected to Websockets
  const collaborators = cloudService.getCollaborators('mock-id');

  return (
    <div className="bg-slate-800 text-white text-xs px-2 py-1 flex justify-between items-center select-none shrink-0 print:hidden h-10 border-b border-slate-700">
        <div className="flex items-center gap-4">
            <span className="font-bold flex items-center gap-2">
                <Cloud size={14} className="text-blue-400" />
                {t('app.name')} <span className="opacity-50 mx-1">/</span> {projectName}
            </span>
            <div className="bg-slate-700 rounded px-2 py-0.5 flex items-center gap-1 text-[10px]">
                <GitBranch size={10} className="text-green-400"/>
                <span className="text-slate-300">main</span>
            </div>
        </div>

        <div className="flex items-center">
            <CollaborationBar collaborators={collaborators} />
            <div className="h-4 w-px bg-slate-600 mx-2"></div>
            <LanguageSelector />
            <div className="h-4 w-px bg-slate-600 mx-2"></div>
            <button onClick={() => onExport(backendConfig)} className="hover:text-blue-300 font-medium">
                {t('app.save_backup')}
            </button>
        </div>
    </div>
  );
};
