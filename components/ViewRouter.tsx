
import React, { useEffect } from 'react';
import { ViewType, Table, Query, Report, Form, Relationship, SelectQuery, BackendConfig, TableNode, Chart, Workflow, EnvironmentConfig } from '../types/index';
import { WelcomeView } from '../features/dashboard/WelcomeView';
import { AppInfoView } from '../features/dashboard/AppInfoView'; // Import
import { TableDesigner } from '../features/tables/TableDesigner';
import { TableView } from '../features/tables/TableView';
import { RelationshipsView } from '../features/relationships/RelationshipsView';
import { QueryDesignerView } from '../features/queries/QueryDesignerView';
import { QueryResultsView } from '../features/queries/QueryResultsView';
import { ReportView } from '../features/reports/ReportView';
import { ReportDesignerView } from '../features/reports/ReportDesignerView';
import { DashboardDesigner } from '../features/reports/DashboardDesigner';
import { FormView } from '../features/forms/FormView';
import { FormDesignerView } from '../features/forms/FormDesignerView';
import { BackendView } from '../features/backend/BackendView';
import { ApiImportView } from '../features/tools/ApiImportView';
import { ChartView } from '../features/charts/ChartView';
import { WorkflowDesigner } from '../features/workflows/WorkflowDesigner';
import { SchedulerView } from '../features/scheduler/SchedulerView'; 
import { NavigationDesigner } from '../features/navigation/NavigationDesigner';
import { ThemeDesigner } from '../features/themes/ThemeDesigner';
import { LogicDesigner } from '../features/logic/LogicDesigner';
import { useAppController } from '../hooks/useAppController'; // Need context types or pass down

interface ViewRouterProps {
  currentView: ViewType;
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  workflows?: Workflow[]; 
  canvasNodes: TableNode[];
  relationships: Relationship[];
  activeObject: Table | Query | Report | Form | Chart | Workflow | null;
  onSetView: (view: ViewType) => void;
  onActiveObjectChange: (obj: Table | Query | Report | Form | Chart | Workflow) => void;
  onDeleteRelationship: (id: string) => void;
  onUpdateRelationship: (rel: Relationship) => void;
  onMoveRelationshipNode: (id: string, x: number, y: number) => void;
  onUpdateRelationshipNodes?: (nodes: TableNode[]) => void;
  setRelationships: React.Dispatch<React.SetStateAction<Relationship[]>>;
  executeQuery: (query: Query) => Record<string, any>[];
  saveTable: (table: Table, mode: 'create' | 'edit') => void;
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
  formActionTrigger?: { action: string, timestamp: number };
  backendConfig: BackendConfig;
  onUpdateBackendConfig?: (config: BackendConfig) => void; // NEW
  exportTrigger: number;
  generateTrigger: number;
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
  onOpenDeployment: () => void;
  onUpdateWorkflow?: (workflow: Workflow) => void;
  // NEW Lifecycle props
  lastSnapshot?: Table[];
  onSnapshot?: () => void;
  onUpdateEnvironments?: (envs: EnvironmentConfig[]) => void;
  // Lock Prop
  activeLock?: any;
}

export const ViewRouter: React.FC<ViewRouterProps> = ({
  currentView,
  tables,
  queries,
  reports,
  forms,
  workflows = [],
  canvasNodes,
  relationships,
  activeObject,
  onSetView,
  onActiveObjectChange,
  onDeleteRelationship,
  onUpdateRelationship,
  onMoveRelationshipNode,
  onUpdateRelationshipNodes,
  setRelationships,
  executeQuery,
  saveTable,
  showConfirmation,
  formActionTrigger,
  backendConfig,
  onUpdateBackendConfig,
  exportTrigger,
  generateTrigger,
  showMessage,
  onOpenDeployment,
  onUpdateWorkflow,
  lastSnapshot,
  onSnapshot,
  onUpdateEnvironments,
  activeLock
}) => {

  useEffect(() => {
      if (formActionTrigger?.action === 'open_deployment_modal') {
          onOpenDeployment();
      }
  }, [formActionTrigger]);

  const handleConnect = (t1: string, f1: string, t2: string, f2: string) => {
        const fromTable = tables.find(t => t.id === t1);
        const toTable = tables.find(t => t.id === t2);
        if (!fromTable || !toTable) return;
        const fromField = fromTable.fields.find(f => f.id === f1);
        const toField = toTable.fields.find(f => f.id === f2);
        const type = fromField?.isPrimaryKey && !toField?.isPrimaryKey ? '1:n' : '1:1';
        const newRel: Relationship = { id: crypto.randomUUID(), fromTableId: t1, fromFieldId: f1, toTableId: t2, toFieldId: f2, type: type, referentialIntegrity: true };
        const currentRels = Array.isArray(relationships) ? relationships : [];
        setRelationships([...currentRels, newRel]);
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
                    else showMessage("Info", "Bitte nutzen Sie den 'Erstellen' Tab im Menüband.", 'info');
                }}
            />
        );
      case 'app_info': // New Route
        return <AppInfoView onNavigate={(action) => {
            if(action === 'create_table') onSetView({type: 'table_create'});
            else if(action === 'backend_generate') onSetView({type: 'backend_generator'});
        }} />;
      case 'table_create':
      case 'table_edit':
        if (activeObject && 'fields' in activeObject && !('nodes' in activeObject) && !('sourceType' in activeObject)) {
          return <TableDesigner table={activeObject as Table} onTableChange={onActiveObjectChange as any} lockedBy={activeLock} currentUserId="u1" relationships={relationships} showConfirmation={showConfirmation} />;
        }
        return null;
      case 'table_data':
        if (activeObject && 'fields' in activeObject && !('nodes' in activeObject) && !('sourceType' in activeObject)) {
          return <TableView table={activeObject as Table} allTables={tables} relationships={relationships} onTableChange={onActiveObjectChange as any} showConfirmation={showConfirmation} />;
        }
        return null;
      case 'query_results':
        if (activeObject && 'nodes' in activeObject) {
            const results = executeQuery(activeObject as Query);
            return <QueryResultsView query={activeObject as SelectQuery} results={results} />;
        }
        return null;
      case 'report_view':
         if (activeObject && 'sourceType' in activeObject && !('fields' in activeObject) && !('config' in activeObject)) {
            const report = activeObject as Report;
            if (report.sourceType === 'dashboard') {
                 // The view mode for dashboard is similar to designer but without add/remove controls
                 // We can either render a DashboardView, or just use DashboardDesigner without edit capabilities.
                 // For now, returning DashboardDesigner is acceptable, but let's make sure it represents view mode well.
                 // We'll reuse the designer but maybe it has everything we need to view.
                 const handleOpenReport = (reportId: string) => {
                     const rep = reports.find(r => r.id === reportId);
                     if (rep) {
                         onActiveObjectChange(rep);
                         onSetView('report_view' as any);
                     }
                 };
                 return <DashboardDesigner report={report} tables={tables} queries={queries} relationships={relationships} reports={reports} onReportChange={onActiveObjectChange as any} onOpenReport={handleOpenReport} />;
            }
            let data: Record<string, any>[] = [];
            const sourceFields = getSourceFieldsForReport(report) as any[];
            if (report.sourceType === 'table') {
                const table = tables.find(t => t.id === report.sourceId);
                data = table?.data || [];
            } else {
                const query = queries.find(q => q.id === report.sourceId);
                if (query) data = executeQuery(query);
            }
            return <ReportView report={report} data={data} sourceFields={sourceFields} allTables={tables} relationships={relationships} />;
        }
        return null;
      case 'report_designer':
          if (activeObject && 'sourceType' in activeObject && !('fields' in activeObject) && !('config' in activeObject)) {
              if (activeObject.sourceType === 'dashboard') {
                  const handleOpenReport = (reportId: string) => {
                      const rep = reports.find(r => r.id === reportId);
                      if (rep) {
                          onActiveObjectChange(rep);
                          onSetView('report_designer' as any);
                      }
                  };
                  return <DashboardDesigner report={activeObject as Report} tables={tables} queries={queries} relationships={relationships} reports={reports} onReportChange={onActiveObjectChange as any} onOpenReport={handleOpenReport} />;
              }
              return <ReportDesignerView report={activeObject as Report} tables={tables} queries={queries} relationships={relationships} onReportChange={onActiveObjectChange as any} />;
          }
          return null;
      case 'form_view':
        if (activeObject && 'sourceType' in activeObject && 'layout' in activeObject) {
            return <FormView 
                form={activeObject as Form} 
                allForms={forms} 
                allTables={tables} 
                onTableChange={(t) => saveTable(t, 'edit')} 
                showConfirmation={showConfirmation} 
                onClose={() => onSetView({ type: 'welcome' })}
            />;
        }
        return null;
      case 'form_designer':
        if (activeObject && 'sourceType' in activeObject && 'layout' in activeObject) {
            return <FormDesignerView form={activeObject as Form} allForms={forms} allTables={tables} relationships={relationships} onFormChange={onActiveObjectChange as any} actionTrigger={formActionTrigger} />;
        }
        return null;
      case 'chart_view':
        if (activeObject && 'config' in activeObject) {
            return <ChartView chart={activeObject as Chart} tables={tables} queries={queries} onChartChange={onActiveObjectChange as any} />;
        }
        return null;
      case 'workflow_designer':
        if (activeObject && 'nodes' in activeObject && 'active' in activeObject) {
            return <WorkflowDesigner workflow={activeObject as Workflow} tables={tables} onWorkflowChange={onActiveObjectChange as any} />;
        }
        return null;
      case 'scheduler':
          return <SchedulerView workflows={workflows} onUpdateWorkflow={onUpdateWorkflow!} />;
      case 'backend_generator':
          return (
            <BackendView 
                tables={tables} relationships={relationships} queries={queries} forms={forms} reports={reports} 
                exportTrigger={exportTrigger} generateTrigger={generateTrigger} config={backendConfig} 
                showMessage={showMessage} 
                onOpenDeployment={() => { /* via hook */ }}
                lastSnapshot={lastSnapshot}
                onSnapshot={onSnapshot}
                onUpdateEnvironments={onUpdateEnvironments}
            />
          );
      case 'relationships':
        return <RelationshipsView 
            nodes={canvasNodes} 
            tables={tables} 
            relationships={relationships} 
            onMoveNode={onMoveRelationshipNode} 
            onUpdateNodes={onUpdateRelationshipNodes}
            onConnect={handleConnect} 
            onDeleteRelationship={onDeleteRelationship} 
            onUpdateRelationship={onUpdateRelationship} 
            onNodeDoubleClick={(tId) => onSetView({ type: 'table_designer', tableId: tId })}
            showConfirmation={showConfirmation}
        />;
      case 'query_designer':
        if (activeObject && 'nodes' in activeObject) {
           return <QueryDesignerView query={activeObject as SelectQuery} onQueryChange={onActiveObjectChange as any} tables={tables} relationships={relationships} dbType={backendConfig.dbType} />;
        }
       return null;
      case 'api_import':
        return (
            <ApiImportView 
                onSaveTable={(t) => saveTable(t, 'create')} 
                showMessage={showMessage} 
                backendConfig={backendConfig}
                onUpdateConfig={onUpdateBackendConfig}
            />
        );
      case 'navigation_designer':
        return (
          <NavigationDesigner 
            tables={tables}
            queries={queries}
            reports={reports}
            forms={forms}
            backendConfig={backendConfig}
            onUpdateBackendConfig={onUpdateBackendConfig!}
            showMessage={showMessage}
          />
        );
      case 'theme_designer':
        return (
          <ThemeDesigner 
             config={backendConfig}
             onUpdateConfig={onUpdateBackendConfig!}
             showMessage={showMessage}
          />
        );
      case 'logic_designer':
        return (
          <LogicDesigner 
             config={backendConfig}
             onUpdateConfig={onUpdateBackendConfig!}
             showMessage={showMessage}
          />
        );
      default:
        return null;
    }
};
