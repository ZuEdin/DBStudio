
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ViewType, BackendConfig } from '../types/index';
import { ConnectionSettingsModal } from './ConnectionSettingsModal';
import { useTranslation } from 'react-i18next';

// Tabs
import { FileTab } from './ribbon/tabs/FileTab';
import { CreateTab } from './ribbon/tabs/CreateTab';
import { ProjectTab } from './ribbon/tabs/ProjectTab'; // NEW
import { ToolsTab } from './ribbon/tabs/ToolsTab';
import { BackendTab } from './ribbon/tabs/BackendTab';
import { FormDesignTab } from './ribbon/tabs/FormDesignTab';
import { ReportDesignTab } from './ribbon/tabs/ReportDesignTab';

interface RibbonProps {
  onAction: (action: string, payload?: any) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentDbType: string;
  currentView: ViewType;
  isOpen: boolean;
  toggleRibbon: () => void;
  backendConfig?: BackendConfig;
  setBackendConfig?: (config: BackendConfig) => void;
}

export const Ribbon: React.FC<RibbonProps> = ({ 
  onAction, 
  activeTab, 
  setActiveTab, 
  currentDbType, 
  currentView, 
  isOpen, 
  toggleRibbon, 
  backendConfig, 
  setBackendConfig 
}) => {
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const { t } = useTranslation();

  // Automatisch zum Kontext-Tab wechseln
  useEffect(() => {
    if (currentView.type === 'form_designer') {
      setActiveTab('form_design');
    } else if (currentView.type === 'report_designer') {
      setActiveTab('report_design');
    }
  }, [currentView.type, setActiveTab]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'file':
        return <FileTab onAction={onAction} currentDbType={currentDbType} />;
      case 'create':
        return <CreateTab onAction={onAction} />;
      case 'project': // NEW
        return <ProjectTab onAction={onAction} />;
      case 'tools':
        return <ToolsTab onAction={onAction} />;
      case 'backend':
        if (!backendConfig || !setBackendConfig) return null;
        return (
          <BackendTab 
            onAction={onAction} 
            backendConfig={backendConfig} 
            setBackendConfig={setBackendConfig} 
            onOpenSettings={() => setShowConnectionModal(true)} 
          />
        );
      case 'form_design':
        return <FormDesignTab onAction={onAction} />;
      case 'report_design':
        return <ReportDesignTab onAction={onAction} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col bg-slate-100 border-b border-slate-300 select-none relative z-20 transition-all duration-300 print:hidden">
      {/* Tab Headers and Toggle */}
      <div className="flex bg-slate-800 text-white pt-1 px-2 gap-1 overflow-x-auto items-end justify-between">
        <div className="flex gap-1">
            <button 
            onClick={() => setActiveTab('file')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap ${activeTab === 'file' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            {t('ribbon.file')}
            </button>
            <button 
            onClick={() => setActiveTab('create')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap ${activeTab === 'create' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            {t('ribbon.create')}
            </button>
            <button 
            onClick={() => setActiveTab('project')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap ${activeTab === 'project' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            {t('ribbon.project')}
            </button>
            <button 
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap ${activeTab === 'tools' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            {t('ribbon.tools')}
            </button>
            <button 
            onClick={() => setActiveTab('backend')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap border-t-2 border-green-500 ${activeTab === 'backend' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            {t('ribbon.generator')}
            </button>
            
            {/* Context Tabs */}
            {currentView.type === 'form_designer' && (
            <button 
                onClick={() => setActiveTab('form_design')}
                className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap border-t-2 border-indigo-500 ${activeTab === 'form_design' ? 'bg-slate-100 text-slate-900 font-semibold' : 'bg-indigo-900 hover:bg-indigo-800'}`}
            >
                {t('ribbon.form_design')}
            </button>
            )}
            {currentView.type === 'report_designer' && (
            <button 
                onClick={() => setActiveTab('report_design')}
                className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap border-t-2 border-purple-500 ${activeTab === 'report_design' ? 'bg-slate-100 text-slate-900 font-semibold' : 'bg-purple-900 hover:bg-purple-800'}`}
            >
                {t('ribbon.report_design')}
            </button>
            )}
        </div>
        
        <button onClick={toggleRibbon} className="text-slate-400 hover:text-white px-2 py-1" title={isOpen ? "Menüband minimieren" : "Menüband erweitern"}>
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Tab Content */}
      {isOpen && (
        <div className="h-28 px-4 flex items-center gap-2 overflow-visible shadow-inner bg-slate-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {renderActiveTab()}
        </div>
      )}

      {/* Connection Modal */}
      {showConnectionModal && backendConfig && setBackendConfig && (
          <ConnectionSettingsModal 
            dbType={backendConfig.dbType}
            currentConnectionString={backendConfig.dbConnection}
            onSave={(newConn) => setBackendConfig({...backendConfig, dbConnection: newConn})}
            onClose={() => setShowConnectionModal(false)}
          />
      )}
    </div>
  );
};
