
import React from 'react';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from 'react-i18next';
import { CollaborationBar } from './CollaborationBar';
import { cloudService } from '../services/cloudService';
import { Cloud, GitBranch, MessageSquare, Sun, Moon, Download } from 'lucide-react';
import { useProjectStore } from '../stores/useProjectStore';
import { useUIStore } from '../stores/useUIStore';

interface AppHeaderProps {
  onAction?: (action: string, payload?: any) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onAction }) => {
  const { t } = useTranslation();
  const store = useProjectStore();
  const ui = useUIStore();
  
  const { projectName, backendConfig } = store;
  const { darkMode, toggleDarkMode, isChatOpen, setIsChatOpen, setFormActionTrigger } = ui;

  // Mock Data: In a real app, this would come from a Context/Store connected to Websockets
  const collaborators = cloudService.getCollaborators('mock-id');

  const onExport = () => {
      if (onAction) {
          onAction('project_backup');
      } else {
          setFormActionTrigger({ action: 'backend_export', timestamp: Date.now() });
      }
  };

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
            
            {/* Chat & Tickets Toggle */}
            <div className="ml-2 mr-1">
                <button 
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className={`p-1.5 rounded transition-colors flex items-center gap-1.5 ${isChatOpen ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    title="Team Chat & Tickets / Aufgaben"
                >
                    <MessageSquare size={16} />
                    <span className="text-[10px] font-bold">Chat & Tickets</span>
                </button>
            </div>

            {/* Dark / Light Mode Toggle */}
            <div className="mr-2">
                <button 
                    onClick={toggleDarkMode}
                    className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {darkMode ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} />}
                </button>
            </div>

            <div className="h-4 w-px bg-slate-600 mx-1"></div>
            <LanguageSelector />
            <div className="h-4 w-px bg-slate-600 mx-2"></div>
            <button 
                onClick={onExport} 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-700/50 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 transition-all border border-blue-500/30 hover:border-blue-400/50 font-semibold"
            >
                <Download size={14} />
                {t('app.save_backup')}
            </button>
        </div>
    </div>
  );
};
