import React from 'react';
import { ViewType, Table, TableNode, Relationship, Query, Report, Field, Form, SelectQuery } from '../types/index';
import { X } from 'lucide-react';
import { WelcomeView } from '../views/WelcomeView';
import { TableDesigner } from './TableDesigner';
import { TableView } from '../views/TableView';
import { RelationshipsView } from '../views/relationships/RelationshipsView';
import { QueryDesignerView } from '../views/query/QueryDesignerView';
import { QueryResultsView } from '../views/query/QueryResultsView';
import { ReportView } from '../views/report/ReportView';
import { FormView } from '../views/form/FormView';
import { FormDesignerView } from '../views/form/FormDesignerView';

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
}) => {

  const renderView = () => {
    switch (currentView.type) {
      case 'welcome':
        return <WelcomeView />;
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
            let sourceFields: Field[] = [];

            if (report.sourceType === 'table') {
                const table = tables.find(t => t.id === report.sourceId);
                data = table?.data || [];
                sourceFields = table?.fields || [];
            } else {
                const query = queries.find(q => q.id === report.sourceId);
                // FIX: Added type guard to ensure query is a SelectQuery before accessing 'columns'.
                if (query && query.type === 'SELECT') {
                    data = executeQuery(query);
                    const fieldMap = new Map<string, Field>();
                     query.columns.forEach(col => {
                        const table = tables.find(t => t.id === col.tableId);
                        const field = table?.fields.find(f => f.id === col.fieldId);
                        if (field && !fieldMap.has(field.id)) {
                            fieldMap.set(field.id, field);
                        }
                    });
                    sourceFields = Array.from(fieldMap.values());
                }
            }
            return <ReportView report={report} data={data} sourceFields={sourceFields} />;
        }
        return null;
      case 'form_view':
        if (activeObject && 'sourceType' in activeObject && 'fields' in activeObject) {
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
        if (activeObject && 'sourceType' in activeObject && 'fields' in activeObject) {
            const form = activeObject as Form;
            return <FormDesignerView form={form} allForms={forms} allTables={tables} onFormChange={saveForm} />
        }
        return null;
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
            // FIX: The prop name `deleteRelationship` was incorrect and has been changed to `onDeleteRelationship` to match the component's props.
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
            />
          );
        }
       return null;
      default:
        return <WelcomeView />;
    }
  }

  const getTabTitle = () => {
    if (!activeObject) {
      switch (currentView.type) {
         case 'relationships': return 'Beziehungen';
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
      <div className="bg-white border-b border-slate-300 px-2 flex items-center h-8">
         {currentView.type !== 'welcome' && (
           <div className="bg-sky-100 text-sky-800 px-3 py-1 text-xs font-bold border-t-2 border-sky-600 flex items-center gap-2">
             <span>{getTabTitle()}</span>
             <button onClick={() => onSetView({ type: 'welcome' })}><X size={12}/></button>
           </div>
         )}
      </div>

      <div className="flex-1 relative overflow-auto">
        {renderView()}
      </div>
    </div>
  );
};