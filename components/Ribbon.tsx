
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { ConnectionSettingsModal } from './modals/ConnectionSettingsModal';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../stores/useProjectStore';
import { useUIStore } from '../stores/useUIStore';

// Tabs
import { FileTab } from './ribbon/tabs/FileTab';
import { HomeTab } from './ribbon/tabs/HomeTab';
import { CreateTab } from './ribbon/tabs/CreateTab';
import { PagesTab } from './ribbon/tabs/PagesTab';
import { ExternalDataTab } from './ribbon/tabs/ExternalDataTab';
import { DeployTab } from './ribbon/tabs/DeployTab';
import { TableDesignTab } from './ribbon/tabs/TableDesignTab';
import { QueryDesignTab } from './ribbon/tabs/QueryDesignTab';
import { FormDesignTab } from './ribbon/tabs/FormDesignTab';
import { ReportDesignTab } from './ribbon/tabs/ReportDesignTab';
import { WorkflowDesignTab } from './ribbon/tabs/WorkflowDesignTab';
import { ERDiagramTab } from './ribbon/tabs/ERDiagramTab';
import { ProjectsTab } from './ribbon/tabs/ProjectsTab';
import { PageDesignTab } from './ribbon/tabs/PageDesignTab';
import { SecurityTab } from './ribbon/tabs/SecurityTab';

interface RibbonProps {
  onAction: (action: string, payload?: any) => void;
}

export const Ribbon: React.FC<RibbonProps> = ({ onAction }) => {
  const store = useProjectStore();
  const ui = useUIStore();
  
  const { backendConfig, setBackendConfig } = store;
  const { activeTab, setActiveTab, currentView, isRibbonOpen: isOpen, setIsRibbonOpen: setIsOpen } = ui;
  const currentDbType = backendConfig?.dbType || 'SQLITE';

  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const { t } = useTranslation();

  const toggleRibbon = () => setIsOpen(!isOpen);

  // Automatisch zum Kontext-Tab wechseln, oder bei keinem aktiven Bereich auf 'Start' (home)
  useEffect(() => {
    if (currentView.type === 'table_edit' || currentView.type === 'table_create' || currentView.type === 'table_data') {
      setActiveTab('table_design');
    } else if (currentView.type === 'query_designer' || currentView.type === 'query_results') {
      setActiveTab('query_design');
    } else if (currentView.type === 'form_designer' || currentView.type === 'form_view') {
      setActiveTab('form_design');
    } else if (currentView.type === 'report_designer' || currentView.type === 'report_view') {
      setActiveTab('report_design');
    } else if (currentView.type === 'workflow_designer') {
      setActiveTab('workflow_design');
    } else if (currentView.type === 'page_designer' || currentView.type === 'page_view') {
      setActiveTab('page_design');
    } else if (currentView.type === 'relationships') {
      setActiveTab('er_diagram');
    } else {
      // Wenn kein aktiver Bereich ausgewählt ist (z.B. welcome, dashboard, app_info) -> Registerkarte Start anzeigen
      setActiveTab('home');
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
      case 'pages':
        return <PagesTab onAction={onAction} />;
      case 'page_design':
        if (currentView.type === 'page_designer' || currentView.type === 'page_view') {
          return <PageDesignTab onAction={onAction} />;
        }
        return <HomeTab onAction={onAction} />;
      case 'external':
        return <ExternalDataTab onAction={onAction} />;
      case 'deploy':
        if (!backendConfig || !setBackendConfig) return <HomeTab onAction={onAction} />;
        return (
          <DeployTab 
            onAction={onAction} 
            backendConfig={backendConfig} 
            setBackendConfig={setBackendConfig} 
            onOpenSettings={() => setShowConnectionModal(true)} 
          />
        );
      case 'table_design':
        if (currentView.type === 'table_edit' || currentView.type === 'table_create' || currentView.type === 'table_data') {
          return <TableDesignTab onAction={onAction} />;
        }
        return <HomeTab onAction={onAction} />;
      case 'query_design':
        if (currentView.type === 'query_designer' || currentView.type === 'query_results') {
          return <QueryDesignTab onAction={onAction} />;
        }
        return <HomeTab onAction={onAction} />;
      case 'form_design':
        if (currentView.type === 'form_designer' || currentView.type === 'form_view') {
          return <FormDesignTab onAction={onAction} />;
        }
        return <HomeTab onAction={onAction} />;
      case 'report_design':
        if (currentView.type === 'report_designer' || currentView.type === 'report_view') {
          return <ReportDesignTab onAction={onAction} />;
        }
        return <HomeTab onAction={onAction} />;
      case 'workflow_design':
        if (currentView.type === 'workflow_designer') {
          return <WorkflowDesignTab onAction={onAction} />;
        }
        return <HomeTab onAction={onAction} />;
      case 'er_diagram':
        if (currentView.type === 'relationships') {
          return <ERDiagramTab onAction={onAction} />;
        }
        return <HomeTab onAction={onAction} />;
      case 'projekte':
        return <ProjectsTab onAction={onAction} />;
      case 'security':
        return <SecurityTab onAction={onAction} />;
      default:
        return <HomeTab onAction={onAction} />;
    }
  };

  const getTabClass = (tabName: string, accentBorder?: string) => {
    const isActive = activeTab === tabName;
    const border = accentBorder ? `border-t-2 ${accentBorder}` : '';
    if (isActive) {
      return `px-4 py-1.5 rounded-t-lg text-sm whitespace-nowrap font-semibold bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs transition-colors cursor-pointer ${border}`;
    }
    return `px-4 py-1.5 rounded-t-lg text-sm whitespace-nowrap text-slate-300 dark:text-slate-400 hover:text-white hover:bg-slate-700/70 dark:hover:bg-slate-800/70 transition-colors cursor-pointer ${border}`;
  };

  const getContextTabClass = (tabName: string, accentBorder: string, inactiveBg: string) => {
    const isActive = activeTab === tabName;
    if (isActive) {
      return `px-4 py-1.5 rounded-t-lg text-sm whitespace-nowrap font-semibold bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs transition-colors cursor-pointer border-t-2 ${accentBorder}`;
    }
    return `px-4 py-1.5 rounded-t-lg text-sm whitespace-nowrap transition-colors cursor-pointer border-t-2 ${accentBorder} ${inactiveBg}`;
  };

  return (
    <nav className="app-ribbon flex flex-col bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 select-none relative z-40 transition-all duration-300 print:hidden no-print">
      {/* Tab Headers and Toggle */}
      <div className="flex bg-slate-800 dark:bg-slate-950 text-white pt-1 px-2 gap-1 overflow-x-auto items-end justify-between border-b border-slate-700 dark:border-slate-800/80">
        <div className="flex gap-1 items-end">
            <button 
              onClick={() => {
                ui.setIsBackstageOpen(true);
                ui.setBackstageActiveTab('startseite');
              }}
              className="px-4 py-1.5 rounded-t-lg text-sm whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Datei-Menü & Startseite (DB Studio Backstage View)"
            >
              <span>{t('ribbon.file')}</span>
            </button>
            <button 
              onClick={() => setActiveTab('home')}
              className={getTabClass('home')}
            >
              Start
            </button>
            <button 
              onClick={() => setActiveTab('create')}
              className={getTabClass('create')}
            >
              {t('ribbon.create')}
            </button>
            <button 
              onClick={() => setActiveTab('external')}
              className={getTabClass('external')}
            >
              Externe Daten
            </button>
            <button 
              onClick={() => setActiveTab('pages')}
              className={getTabClass('pages')}
            >
              Pages & SDUI
            </button>
            <button 
              onClick={() => setActiveTab('projekte')}
              className={getTabClass('projekte', 'border-emerald-500')}
            >
              Projekte
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`${getTabClass('security', 'border-emerald-400')} flex items-center gap-1.5`}
              title="Sicherheit, Rollen (RBAC), Active Directory & Audit Trail"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              Sicherheit & RBAC
            </button>
            <button 
              onClick={() => setActiveTab('deploy')}
              className={getTabClass('deploy', 'border-green-500')}
            >
              Bereitstellung & Generator
            </button>
            
            {/* Context Tabs for Active Objects & Views */}
            {(currentView.type === 'table_edit' || currentView.type === 'table_create' || currentView.type === 'table_data') && (
            <button 
                onClick={() => setActiveTab('table_design')}
                className={getContextTabClass('table_design', 'border-amber-500', 'bg-amber-950/80 text-amber-200 hover:bg-amber-900')}
            >
                Tabellen-Entwurf
            </button>
            )}
            {(currentView.type === 'query_designer' || currentView.type === 'query_results') && (
            <button 
                onClick={() => setActiveTab('query_design')}
                className={getContextTabClass('query_design', 'border-cyan-500', 'bg-cyan-950/80 text-cyan-200 hover:bg-cyan-900')}
            >
                Abfrage-Entwurf
            </button>
            )}
            {(currentView.type === 'form_designer' || currentView.type === 'form_view') && (
            <button 
                onClick={() => setActiveTab('form_design')}
                className={getContextTabClass('form_design', 'border-indigo-500', 'bg-indigo-950/80 text-indigo-200 hover:bg-indigo-900')}
            >
                {t('ribbon.form_design')}
            </button>
            )}
            {(currentView.type === 'report_designer' || currentView.type === 'report_view') && (
            <button 
                onClick={() => setActiveTab('report_design')}
                className={getContextTabClass('report_design', 'border-purple-500', 'bg-purple-950/80 text-purple-200 hover:bg-purple-900')}
            >
                {t('ribbon.report_design')}
            </button>
            )}
            {currentView.type === 'workflow_designer' && (
            <button 
                onClick={() => setActiveTab('workflow_design')}
                className={getContextTabClass('workflow_design', 'border-emerald-500', 'bg-emerald-950/80 text-emerald-200 hover:bg-emerald-900')}
            >
                Workflow Design
            </button>
            )}
            {(currentView.type === 'page_designer' || currentView.type === 'page_view') && (
            <button 
                onClick={() => setActiveTab('page_design')}
                className={getContextTabClass('page_design', 'border-indigo-400', 'bg-indigo-950/80 text-indigo-200 hover:bg-indigo-900')}
            >
                Page Design (Entwurf)
            </button>
            )}
            {currentView.type === 'relationships' && (
            <button 
                onClick={() => setActiveTab('er_diagram')}
                className={getContextTabClass('er_diagram', 'border-blue-500', 'bg-blue-950/80 text-blue-200 hover:bg-blue-900')}
            >
                Beziehungs-Tools
            </button>
            )}
        </div>
        
        <div className="flex items-center gap-1 pb-1">
          <button 
            onClick={() => ui.setShowButtonInfoModal(true)} 
            className="text-slate-400 hover:text-white px-2 py-1 flex items-center gap-1.5 rounded hover:bg-slate-700/70 dark:hover:bg-slate-800/70 transition-colors text-xs font-medium cursor-pointer" 
            title="Informationen zu allen Schaltflächen / Buttons öffnen"
          >
            <HelpCircle size={15} className="text-amber-400 shrink-0" />
            <span className="hidden md:inline text-slate-300 dark:text-slate-300">Schaltflächen-Info</span>
          </button>

          <button onClick={toggleRibbon} className="text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700/70 dark:hover:bg-slate-800/70 transition-colors cursor-pointer" title={isOpen ? "Menüband minimieren" : "Menüband erweitern"}>
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {isOpen && (
        <div className="h-28 px-4 flex items-center gap-2 overflow-visible shadow-inner bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
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
    </nav>
  );
};
