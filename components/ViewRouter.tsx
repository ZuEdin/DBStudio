
import React from 'react';
import { ViewType, Table, Query, Report, Form, Relationship, SelectQuery, BackendConfig, TableNode } from '../types/index';
import { WelcomeView } from '../views/WelcomeView';
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

interface ViewRouterProps {
  currentView: ViewType;
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  canvasNodes: TableNode[];
  relationships: Relationship[];
  activeObject: Table | Query | Report | Form | null;
  onSetView: (view: ViewType) => void;
  onActiveObjectChange: (obj: Table | Query | Report | Form) => void;
  onDeleteRelationship: (id: string) => void;
  onUpdateRelationship: (rel: Relationship) => void;
  onMoveRelationshipNode: (id: string, x: number, y: number) => void;
  setRelationships: React.Dispatch<React.SetStateAction<Relationship[]>>;
  executeQuery: (query: Query) => Record<string, any>[];
  saveTable: (table: Table, mode: 'create' | 'edit') => void;
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
  formActionTrigger?: { action: string, timestamp: number };
  backendConfig: BackendConfig;
  exportTrigger: number;
  generateTrigger: number;
}

export const ViewRouter: React.FC<ViewRouterProps> = ({
  currentView,
  tables,
  queries,
  reports,
  forms,
  canvasNodes,
  relationships,
  activeObject,
  onSetView,
  onActiveObjectChange,
  onDeleteRelationship,
  onUpdateRelationship,
  onMoveRelationshipNode,
  setRelationships,
  executeQuery,
  saveTable,
  showConfirmation,
  formActionTrigger,
  backendConfig,
  exportTrigger,
  generateTrigger
}) => {

  const handleConnect = (t1: string, f1: string, t2: string, f2: string) => {
        const fromTable = tables.find(t => t.id === t1);
        const toTable = tables.find(t => t.id === t2);
        if (!fromTable || !toTable) return;
        const fromField = fromTable.fields.find(f => f.id === f1);
        const toField = toTable.fields.find(f => f.id === f2);
        const type = fromField?.isPrimaryKey && !toField?.isPrimaryKey ? '1:n' : '1:1';
        const newRel: Relationship = { id: crypto.randomUUID(), fromTableId: t1, fromFieldId: f1, toTableId: t2, toFieldId: f2, type: type, referentialIntegrity: true };
        setRelationships(prev => [...prev, newRel]);
  };

  const getSourceFieldsForReport = (report: Report) => {
      if (report.sourceType === 'table') {
          const table = tables.find(t => t.id === report.sourceId);
          return table?.fields || [];
      } else {
          const query = queries.find(q => q.id === report.sourceId);
          if (query && query.type === 'SELECT') {
              return query.columns.map(col => {
                  const table = tables.find(t => t.id === col.tableId);
                  const field = table?.fields.find(f => f.id === col.fieldId);
                  return {
                      id: col.id,
                      name: col.alias && col.alias.trim() !== '' ? col.alias : col.fieldName,
                      type: field?.type || 'VARCHAR',
                      isPrimaryKey: false
                  };
              });
          }
      }
      return [];
  };

  switch (currentView.type) {
      case 'welcome':
        return (
            <WelcomeView 
                tables={tables} queries={queries} reports={reports} forms={forms}
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
          return <TableDesigner table={activeObject as Table} onTableChange={onActiveObjectChange as any} />;
        }
        return null;
      case 'table_data':
        if (activeObject && 'fields' in activeObject && !('nodes' in activeObject) && !('sourceType' in activeObject)) {
          return <TableView table={activeObject as Table} onTableChange={onActiveObjectChange as any} showConfirmation={showConfirmation} />;
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
            const sourceFields = getSourceFieldsForReport(report) as any[];
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
              return <ReportDesignerView report={activeObject as Report} tables={tables} queries={queries} onReportChange={onActiveObjectChange as any} />;
          }
          return null;
      case 'form_view':
        if (activeObject && 'sourceType' in activeObject && 'layout' in activeObject) {
            return <FormView form={activeObject as Form} allForms={forms} allTables={tables} onTableChange={(t) => saveTable(t, 'edit')} showConfirmation={showConfirmation} />;
        }
        return null;
      case 'form_designer':
        if (activeObject && 'sourceType' in activeObject && 'layout' in activeObject) {
            return <FormDesignerView form={activeObject as Form} allForms={forms} allTables={tables} relationships={relationships} onFormChange={onActiveObjectChange as any} actionTrigger={formActionTrigger} />;
        }
        return null;
      case 'backend_generator':
          return <BackendView tables={tables} relationships={relationships} queries={queries} forms={forms} reports={reports} exportTrigger={exportTrigger} generateTrigger={generateTrigger} config={backendConfig} />;
      case 'relationships':
        return <RelationshipsView nodes={canvasNodes} tables={tables} relationships={relationships} onMoveNode={onMoveRelationshipNode} onConnect={handleConnect} onDeleteRelationship={onDeleteRelationship} onUpdateRelationship={onUpdateRelationship} />;
      case 'query_designer':
        if (activeObject && 'nodes' in activeObject) {
           return <QueryDesignerView query={activeObject as SelectQuery} onQueryChange={onActiveObjectChange as any} tables={tables} relationships={relationships} dbType={backendConfig.dbType} />;
        }
       return null;
      default:
        return null;
    }
};
