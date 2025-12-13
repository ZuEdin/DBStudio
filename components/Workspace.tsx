

import React, { useState, useEffect } from 'react';
import { ViewType, Table, TableNode, Relationship, Query, Report, Field, Form, SelectQuery, BackendConfig } from '../types/index';
import { X, Command } from 'lucide-react';
import { WelcomeView } from '../views/WelcomeView'; // This is now the Dashboard
import { TableDesigner } from '../features/tables/TableDesigner';
import { TableView } from '../features/tables/TableView';
import { RelationshipsView } from '../features/relationships/RelationshipsView';
import { QueryDesignerView } from '../features/queries/QueryDesignerView';
import { QueryResultsView } from '../features/queries/QueryResultsView';
import { ReportView } from '../features/reports/ReportView';
import { ReportDesignerView } from '../features/reports/ReportDesignerView';
import { FormView } from '../features/forms/FormView';
import { FormDesignerView } from '../features/forms/FormDesignerView';
import { BackendView } from '../features/backend/BackendView';
import { CommandPalette } from './CommandPalette';

interface WorkspaceProps {
  currentView: ViewType;
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  canvasNodes: TableNode[];
  relationships: Relationship[];
  activeObject: Table | Query | Report | Form | null;
  isDirty: boolean;
  onSetView: (view: ViewType) => void;
  onActiveObjectChange: (obj: Table | Query | Report | Form) => void;
  onSave: () => Promise<any>;
  onDeleteRelationship: (id: string) => void;
  onUpdateRelationship: (rel: Relationship) => void;
  onMoveRelationshipNode: (id: string, x: number, y: number) => void;
  setRelationships: React.Dispatch<React.SetStateAction<Relationship[]>>;
  executeQuery: (query: Query) => Record<string, any>[];
  saveTable: (table: Table, mode: 'create' | 'edit') => void;
  saveForm: (form: Form) => void;
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
  formActionTrigger?: { action: string, timestamp: number };
  backendConfig: BackendConfig;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  currentView,
  tables,
  queries,
  reports,
  forms,
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
  setRelationships,
  executeQuery,
  saveTable,
  saveForm,
  showConfirmation,
  formActionTrigger,
  backendConfig
}) => {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [exportTrigger, setExportTrigger] = useState(0);
  const [generateTrigger, setGenerateTrigger] = useState(0);

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
  }, [formActionTrigger]);

  const handleCommandNavigate = (type: string, id: string) => {
      if (type === 'table_data') onSetView({ type: 'table_data', tableId: id });
      if (type === 'query_results') onSetView({ type: 'query_results', queryId: id });
      if (type === 'form_view') onSetView({ type: 'form_view', formId: id });
      if (type === 'report_view') onSetView({ type: 'report_view', reportId: id });
  };

  const getSourceFieldsForReport = (report: Report): Field[] => {
      if (report.sourceType === 'table') {
          const table = tables.find(t => t.id === report.sourceId);
          return table?.fields || [];
      } else {
          const query = queries.find(q => q.id === report.sourceId);
          if (query && query.type === 'SELECT') {
              // Return fields based on Query Columns to support Aliases and Calculated Fields
              return query.columns.map(col => {
                  const table = tables.find(t => t.id === col.tableId);
                  const field = table?.fields.find(f => f.id === col.fieldId);
                  return {
                      id: col.id, // Use QueryColumn ID
                      name: col.alias && col.alias.trim() !== '' ? col.alias : col.fieldName, // Output Name
                      type: field?.type || 'VARCHAR', // Fallback type
                      isPrimaryKey: false
                  };
              });
          }
      }
      return [];
  };

  const renderView = () => {
    switch (currentView.type) {
      case 'welcome':
        return (
            <WelcomeView 
                tables={tables} 
                queries={queries} 
                reports={reports} 
                forms={forms}
                onNavigate={(type, id) => {
                    if(type === 'table_create') onSetView({type: 'table_create'});
                    else if(type === 'query_designer') onSetView({type: 'query_designer'});
                    else if(type === 'table_data' && id) onSetView({type: 'table_data', tableId: id});
                    else alert("Bitte nutzen Sie den 'Erstellen' Tab im Menüband.");
                }}
            />
        );
      case 'table_create':
      case 'table_edit':
        if (activeObject && 'fields' in activeObject && !('nodes' in activeObject) && !('sourceType' in activeObject)) {
          return (
            <TableDesigner 
              table={activeObject as Table}
              onTableChange={onActiveObjectChange as (t: Table) => void}
            />
          );
        }
        return null;
      case 'table_data':
        if (activeObject && 'fields' in activeObject && !('nodes' in activeObject) && !('sourceType' in activeObject)) {
          return (
            <TableView 
              table={activeObject as Table}
              onTableChange={onActiveObjectChange as (t: Table) => void}
              showConfirmation={showConfirmation}
            />
          );
        }
        return null;
      case 'query_results':
        if (activeObject && 'nodes' in activeObject) {
            const results = executeQuery(activeObject as Query);
            return <QueryResultsView query={activeObject as SelectQuery} results={results} />;
        }
        return null;
      case 'report_view':
         if (activeObject && 'sourceType' in activeObject && !('fields' in activeObject)) {
            const report = activeObject as Report;
            let data: Record<string, any>[] = [];
            const sourceFields = getSourceFieldsForReport(report);

            if (report.sourceType === 'table') {
                const table = tables.find(t => t.id === report.sourceId);
                data = table?.data || [];
            } else {
                const query = queries.find(q => q.id === report.sourceId);
                if (query) data = executeQuery(query);
            }
            return <ReportView report={report} data={data} sourceFields={sourceFields} />;
        }
        return null;
      case 'report_designer':
          if (activeObject && 'sourceType' in activeObject && !('fields' in activeObject)) {
              return (
                  <ReportDesignerView 
                    report={activeObject as Report}
                    tables={tables}
                    queries={queries}
                    onReportChange={onActiveObjectChange as (r: Report) => void}
                  />
              );
          }
          return null;
      case 'form_view':
        if (activeObject && 'sourceType' in activeObject && 'layout' in activeObject) {
            const form = activeObject as Form;
            return <FormView 
              form={form} 
              allForms={forms} 
              allTables={tables} 
              onTableChange={(t) => saveTable(t, 'edit')} 
              showConfirmation={showConfirmation}
            />
        }
        return null;
      case 'form_designer':
        if (activeObject && 'sourceType' in activeObject && 'layout' in activeObject) {
            const form = activeObject as Form;
            return (
              <FormDesignerView 
                form={form} 
                allForms={forms} 
                allTables={tables} 
                relationships={relationships}
                onFormChange={onActiveObjectChange as (f: Form) => void}
                actionTrigger={formActionTrigger}
              />
            );
        }
        return null;
      case 'backend_generator':
          return (
              <BackendView 
                tables={tables} 
                relationships={relationships} 
                queries={queries} 
                forms={forms} 
                reports={reports} // Pass reports here
                exportTrigger={exportTrigger}
                generateTrigger={generateTrigger}
                config={backendConfig}
              />
          );
      case 'relationships':
        const handleConnect = (t1: string, f1: string, t2: string, f2: string) => {
            const fromTable = tables.find(t => t.id === t1);
            const toTable = tables.find(t => t.id === t2);
            if (!fromTable || !toTable) return;
            const fromField = fromTable.fields.find(f => f.id === f1);
            const toField = toTable.fields.find(f => f.id === f2);
            const type = fromField?.isPrimaryKey && !toField?.isPrimaryKey ? '1:n' : '1:1';
            const newRel: Relationship = { id: crypto.randomUUID(), fromTableId: t1, fromFieldId: f1, toTableId: t2, toFieldId: f2, type: type, referentialIntegrity: true };
            setRelationships(prev => [...prev, newRel]);
        }
        return (
          <RelationshipsView 
            nodes={canvasNodes}
            tables={tables}
            relationships={relationships}
            onMoveNode={onMoveRelationshipNode}
            onConnect={handleConnect}
            onDeleteRelationship={onDeleteRelationship}
            onUpdateRelationship={onUpdateRelationship}
          />
        );
      case 'query_designer':
        if (activeObject && 'nodes' in activeObject) {
           return (
            <QueryDesignerView
              query={activeObject as SelectQuery}
              onQueryChange={onActiveObjectChange as (q: Query) => void}
              tables={tables}
              relationships={relationships}
              dbType={backendConfig.dbType}
            />
          );
        }
       return null;
      default:
        return (
            <WelcomeView 
                tables={tables} 
                queries={queries} 
                reports={reports} 
                forms={forms}
                onNavigate={(type, id) => {
                    if(type === 'table_create') onSetView({type: 'table_create'});
                    else if(type === 'query_designer') onSetView({type: 'query_designer'});
                    else if(type === 'table_data' && id) onSetView({type: 'table_data', tableId: id});
                    else alert("Bitte nutzen Sie den 'Erstellen' Tab im Menüband.");
                }}
            />
        );
    }
  }

  const getTabTitle = () => {
    if (!activeObject) {
      switch (currentView.type) {
         case 'relationships': return 'Beziehungen';
         case 'backend_generator': return 'App Generator';
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

      <div className="flex-1 relative overflow-auto print:overflow-visible">
        {renderView()}
      </div>
    </div>
  );
};
