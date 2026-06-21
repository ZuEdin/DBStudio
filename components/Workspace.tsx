
import React, { useState, useEffect } from 'react';
import { ViewType, Table, TableNode, Relationship, Query, Report, Form, SelectQuery, BackendConfig, Chart, Workflow, EnvironmentConfig } from '../types/index';
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
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
         default: return '';
      }
    }
    if (currentView.type === 'query_results' || currentView.type === 'report_view' || currentView.type === 'form_view') {
        return activeObject.name;
    }
    return `${activeObject.name}${isDirty ? '*' : ''}`;
  }

  return (
    <div className="flex-1 relative bg-slate-200 overflow-hidden flex flex-col">
      <div className="print:hidden">
        <CommandPalette 
            isOpen={showCommandPalette} 
            onClose={() => setShowCommandPalette(false)}
            tables={tables}
            queries={queries}
            reports={reports}
            forms={forms}
            onNavigate={handleCommandNavigate}
        />
      </div>
      
      <div className="bg-white border-b border-slate-300 px-2 flex items-center h-8 justify-between print:hidden">
         {currentView.type !== 'welcome' ? (
           <div className="bg-sky-100 text-sky-800 px-3 py-1 text-xs font-bold border-t-2 border-sky-600 flex items-center gap-2">
             <span>{getTabTitle()}</span>
             <button onClick={() => onSetView({ type: 'welcome' })}><X size={12}/></button>
           </div>
         ) : (
             <div className="text-xs font-bold text-slate-500 px-2">Dashboard</div>
         )}
         
         <button 
            onClick={() => setShowCommandPalette(true)}
            className="text-xs text-slate-400 flex items-center gap-1 hover:text-slate-600 mr-2"
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
