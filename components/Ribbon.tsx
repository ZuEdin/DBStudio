
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ViewType, BackendConfig } from '../types/index';
import { ConnectionSettingsModal } from './ConnectionSettingsModal';
import { useTranslation } from 'react-i18next';

// Tabs
import { FileTab } from './ribbon/tabs/FileTab';
import { HomeTab } from './ribbon/tabs/HomeTab';
import { CreateTab } from './ribbon/tabs/CreateTab';
import { ExternalDataTab } from './ribbon/tabs/ExternalDataTab';
import { DeployTab } from './ribbon/tabs/DeployTab';
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
      case 'home':
        return <HomeTab onAction={onAction} />;
      case 'create':
        return <CreateTab onAction={onAction} />;
      case 'external':
        return <ExternalDataTab onAction={onAction} />;
      case 'deploy':
        if (!backendConfig || !setBackendConfig) return null;
        return (
          <DeployTab 
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
        return null; // Fallback normally to HomeTab based on logic
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
            onClick={() => setActiveTab('home')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap ${activeTab === 'home' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            Start
            </button>
            <button 
            onClick={() => setActiveTab('create')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap ${activeTab === 'create' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            {t('ribbon.create')}
            </button>
            <button 
            onClick={() => setActiveTab('external')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap ${activeTab === 'external' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            Externe Daten
            </button>
            <button 
            onClick={() => setActiveTab('deploy')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap border-t-2 border-green-500 ${activeTab === 'deploy' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            Bereitstellung & Generator
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
