
import React, { useState, useEffect } from 'react';
import { ViewType, Table, TableNode, Relationship, Query, Report, Form, SelectQuery, BackendConfig, Chart, Workflow, EnvironmentConfig, CustomPage } from '../types/index';
import { X, Command } from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { ViewRouter } from './ViewRouter';

interface WorkspaceProps {
  currentView: ViewType;
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  workflows?: Workflow[]; // NEW
  pages?: CustomPage[]; // NEW
  canvasNodes: TableNode[];
  relationships: Relationship[];
  activeObject: Table | Query | Report | Form | Chart | Workflow | null;
  isDirty: boolean;
  onSetView: (view: ViewType) => void;
  onActiveObjectChange: (obj: Table | Query | Report | Form | Chart | Workflow) => void;
  onSave: () => Promise<any>;
  onDeleteRelationship: (id: string) => void;
  onUpdateRelationship: (rel: Relationship) => void;
  onMoveRelationshipNode: (id: string, x: number, y: number) => void;
  onUpdateRelationshipNodes?: (nodes: TableNode[]) => void;
  setRelationships: React.Dispatch<React.SetStateAction<Relationship[]>>;
  executeQuery: (query: Query) => Record<string, any>[];
  saveTable: (table: Table, mode: 'create' | 'edit') => void;
  saveForm: (form: Form) => void;
  saveWorkflow?: (workflow: Workflow) => void; // NEW
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
  formActionTrigger?: { action: string, timestamp: number };
  backendConfig: BackendConfig;
  onUpdateBackendConfig?: (config: BackendConfig) => void; // NEW
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
  // Lock
  activeLock?: any;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  currentView,
  tables,
  queries,
  reports,
  forms,
  workflows = [],
  pages = [],
  canvasNodes,
  relationships,
  activeObject,
  isDirty,
  onSetView,
  onActiveObjectChange,
  onSave,
  onDeleteRelationship,
  onUpdateRelationship,
  onMoveRelationshipNode,
  onUpdateRelationshipNodes,
  setRelationships,
  executeQuery,
  saveTable,
  saveForm,
  saveWorkflow,
  showConfirmation,
  formActionTrigger,
  backendConfig,
  onUpdateBackendConfig,
  showMessage,
  activeLock
}) => {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [exportTrigger, setExportTrigger] = useState(0);
  const [generateTrigger, setGenerateTrigger] = useState(0);
  const [openDeploymentTrigger, setOpenDeploymentTrigger] = useState(0);

  // Keyboard shortcut for Command Palette (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(p => !p);
      }
    };
    const handleToggleEvent = () => {
      setShowCommandPalette(p => !p);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('toggle-command-palette', handleToggleEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('toggle-command-palette', handleToggleEvent);
    };
  }, []);

  // Listen for backend export from Ribbon (hacky passing via window or props)
  useEffect(() => {
      if (formActionTrigger?.action === 'backend_export') {
          setExportTrigger(Date.now());
      }
      if (formActionTrigger?.action === 'backend_generate') {
          setGenerateTrigger(Date.now());
      }
      if (formActionTrigger?.action === 'open_deployment_modal') {
          setOpenDeploymentTrigger(Date.now());
      }
  }, [formActionTrigger]);

  const handleCommandNavigate = (type: string, id: string) => {
      if (type === 'table_data') onSetView({ type: 'table_data', tableId: id });
      if (type === 'query_results') onSetView({ type: 'query_results', queryId: id });
      if (type === 'form_view') onSetView({ type: 'form_view', formId: id });
      if (type === 'report_view') onSetView({ type: 'report_view', reportId: id });
  };

  const getTabTitle = () => {
    if (!activeObject) {
      switch (currentView.type) {
         case 'relationships': return 'Beziehungen';
         case 'backend_generator': return 'App Generator';
         case 'navigation_designer': return 'Navigations-Designer';
         case 'scheduler': return 'Zeitplaner';
         case 'api_import': return 'API Import';
         case 'live_sync': return 'Live Datenbank-Sync (Introspection)';
         case 'api_routing_designer': return 'API Routing Designer';
         case 'lifecycle_designer': return 'Lifecycle Designer';
         case 'multi_tenancy_wizard': return 'SaaS Multi-Tenant Wizard';
         case 'data_seeder_view': return 'Data Seeder';
         default: return '';
      }
    }
    if (currentView.type === 'query_results' || currentView.type === 'report_view' || currentView.type === 'form_view') {
        return activeObject.name;
    }
    return `${activeObject.name}${isDirty ? '*' : ''}`;
  }

  return (
    <div className="flex-1 relative bg-slate-200 dark:bg-slate-950 overflow-hidden flex flex-col transition-colors duration-300">
      <div className="print:hidden">
        <CommandPalette 
            isOpen={showCommandPalette} 
            onClose={() => setShowCommandPalette(false)}
            tables={tables}
            queries={queries}
            reports={reports}
            forms={forms}
            onNavigate={handleCommandNavigate}
            onCreateTable={(name) => {
                const newId = crypto.randomUUID();
                saveTable({
                    id: newId,
                    name,
                    fields: [{ id: crypto.randomUUID(), name: 'id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true }],
                    createdAt: new Date().toISOString()
                }, 'create');
                onSetView({ type: 'table_designer', tableId: newId });
            }}
        />
      </div>
      
      <div className="bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 px-2 flex items-center h-8 justify-between print:hidden transition-colors duration-300">
         {currentView.type !== 'welcome' ? (
           <div className="bg-sky-100 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 px-3 py-1 text-xs font-bold border-t-2 border-sky-600 dark:border-sky-500 flex items-center gap-2">
             <span>{getTabTitle()}</span>
             <button onClick={() => onSetView({ type: 'welcome' })} className="hover:text-red-500 dark:hover:text-red-400"><X size={12}/></button>
           </div>
         ) : (
             <div className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2">Dashboard</div>
         )}
         
         <button 
            onClick={() => setShowCommandPalette(true)}
            className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300 mr-2 transition-colors"
            title="Befehlspalette öffnen (Strg+K)"
         >
             <Command size={12} /> <span className="hidden sm:inline">Suche (Strg+K)</span>
         </button>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col min-h-0 print:overflow-visible">
        <ViewRouter 
            currentView={currentView}
            tables={tables}
            queries={queries}
            reports={reports}
            forms={forms}
            workflows={workflows}
            pages={pages}
            canvasNodes={canvasNodes}
            relationships={relationships}
            activeObject={activeObject}
            onSetView={onSetView}
            onActiveObjectChange={onActiveObjectChange}
            onDeleteRelationship={onDeleteRelationship}
            onUpdateRelationship={onUpdateRelationship}
            onMoveRelationshipNode={onMoveRelationshipNode}
            onUpdateRelationshipNodes={onUpdateRelationshipNodes}
            setRelationships={setRelationships}
            executeQuery={executeQuery}
            saveTable={saveTable}
            showConfirmation={showConfirmation}
            formActionTrigger={formActionTrigger}
            backendConfig={backendConfig}
            onUpdateBackendConfig={onUpdateBackendConfig}
            exportTrigger={exportTrigger}
            generateTrigger={generateTrigger}
            showMessage={showMessage}
            onOpenDeployment={() => { /* Handled via effect in AppController usually, but passed here for direct view access if needed */ }}
            onUpdateWorkflow={saveWorkflow}
            activeLock={activeLock}
        />
      </div>
    </div>
  );
};
