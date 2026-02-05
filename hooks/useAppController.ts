
import { useState, useEffect } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import { ViewType, Table, Query, Report, Form, Chart, Workflow, LockInfo, IntegrationsConfig } from '../types/index';
import { saveProjectToStorage } from '../services/storageService';
import { cloudService } from '../services/cloudService'; 
import * as XLSX from 'xlsx';

// Import Sub-Hooks
import { useUIState } from './useUIState';
import { useChatState } from './useChatState';

export const useAppController = () => {
  const store = useProjectStore();
  const ui = useUIState();
  const chat = useChatState();
  
  const [currentView, setCurrentView] = useState<ViewType>({ type: 'welcome' });
  const [activeTab, setActiveTab] = useState('create');
  const [activeObject, setActiveObject] = useState<Table | Query | Report | Form | Chart | Workflow | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [savePrompt, setSavePrompt] = useState<{show: boolean, targetView?: ViewType}>({show: false});
  
  // Locking State
  const [activeLock, setActiveLock] = useState<LockInfo | null>(null);
  const [readOnlyMode, setReadOnlyMode] = useState(false);

  useEffect(() => { store.init(); }, []);

  // --- Auto-Sync Tables to Layout Nodes ---
  useEffect(() => {
      if (!store.tables || store.tables.length === 0) return;

      const currentTableIds = store.tables.map(t => t.id);
      const currentNodes = store.layout || [];
      const layoutTableIds = new Set(currentNodes.map(n => n.tableId));
      
      let hasChanges = false;
      let newLayout = [...currentNodes];

      // Remove nodes for deleted tables
      const nodesToRemove = newLayout.filter(n => !store.tables.find(t => t.id === n.tableId));
      if (nodesToRemove.length > 0) {
          newLayout = newLayout.filter(n => store.tables.find(t => t.id === n.tableId));
          hasChanges = true;
      }

      // Add nodes for new tables
      const tablesToAdd = store.tables.filter(t => !layoutTableIds.has(t.id));
      if (tablesToAdd.length > 0) {
          tablesToAdd.forEach((t, i) => {
              newLayout.push({
                  id: `node_${t.id}`,
                  tableId: t.id,
                  x: 50 + (i * 250) % 1000, 
                  y: 50 + (Math.floor(i / 4) * 200)
              });
          });
          hasChanges = true;
      }

      if (hasChanges) {
          store.setLayout(newLayout);
      }
  }, [store.tables.length, store.layout.length]); // Check on length changes

  const releaseCurrentLock = async () => {
      if (activeObject && 'id' in activeObject) {
          await cloudService.releaseLock(activeObject.id, 'u1'); // Mock user u1
          setActiveLock(null);
      }
  };

  const handleSetView = async (view: ViewType) => {
    if (activeObject) {
        await releaseCurrentLock();
    }

    if (isDirty) { 
        setSavePrompt({ show: true, targetView: view }); 
        return; 
    }

    setCurrentView(view);
    
    // Use fresh state
    const freshState = useProjectStore.getState();
    let foundObject = null;

    if (view.type === 'table_data' || view.type === 'table_edit') {
        foundObject = freshState.tables.find(t => t.id === view.tableId) || null;
    } else if (view.type === 'query_results' || view.type === 'query_designer') {
        foundObject = freshState.queries.find(q => q.id === view.queryId) || null;
    } else if (view.type === 'form_view' || view.type === 'form_designer') {
        foundObject = freshState.forms.find(f => f.id === view.formId) || null;
    } else if (view.type === 'report_view' || view.type === 'report_designer') {
        foundObject = freshState.reports.find(r => r.id === view.reportId) || null;
    } else if (view.type === 'chart_view') {
        foundObject = freshState.charts.find(c => c.id === view.chartId) || null;
    } else if (view.type === 'workflow_designer') {
        foundObject = freshState.workflows.find(w => w.id === view.workflowId) || null;
    }

    if (foundObject) {
        setActiveObject(foundObject);
    } else if (view.type === 'table_create') {
        setActiveObject({
            id: 'new_table_' + Date.now(),
            name: 'NeueTabelle',
            fields: [{ id: crypto.randomUUID(), name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true }],
            data: []
        });
        setReadOnlyMode(false);
    } else if (view.type === 'query_designer' && !view.queryId) {
        setActiveObject({
            id: 'new_query_' + Date.now(),
            type: 'SELECT',
            name: 'NeueAbfrage',
            nodes: [],
            columns: []
        });
        setReadOnlyMode(false);
    } else if (
        view.type === 'welcome' || 
        view.type === 'relationships' || 
        view.type === 'backend_generator' || 
        view.type === 'scheduler' || 
        view.type === 'api_import' || 
        view.type === 'app_info'
    ) {
        setActiveObject(null);
        setReadOnlyMode(false);
    }
  };

  const handleActiveObjectChange = (newObjectState: any) => {
    if (readOnlyMode) { 
        ui.addToast("Schreibgeschützt.", 'error'); 
        return; 
    }
    setActiveObject(newObjectState);
    if (!isDirty) setIsDirty(true);
  };

  const handleSave = async () => { 
      if (activeObject) {
          if ('fields' in activeObject && !('nodes' in activeObject) && !('sourceType' in activeObject)) {
              // Table
              const exists = store.tables.some(t => t.id === activeObject.id);
              if (exists) store.updateTable(activeObject as Table);
              else store.addTable(activeObject as Table);
          } else if ('nodes' in activeObject && 'columns' in activeObject) {
              // Query
              const exists = store.queries.some(q => q.id === activeObject.id);
              if (exists) {
                  const queries = store.queries.map(q => q.id === activeObject.id ? activeObject as Query : q);
                  store.setQueries(queries);
              } else {
                  store.setQueries([...store.queries, activeObject as Query]);
              }
          } else if ('layout' in activeObject) {
              // Form
              const exists = store.forms.some(f => f.id === activeObject.id);
              if (exists) {
                  const forms = store.forms.map(f => f.id === activeObject.id ? activeObject as Form : f);
                  store.setForms(forms);
              } else {
                  store.setForms([...store.forms, activeObject as Form]);
              }
          } else if ('summaries' in activeObject) {
              // Report
              const exists = store.reports.some(r => r.id === activeObject.id);
              if (exists) {
                  const reports = store.reports.map(r => r.id === activeObject.id ? activeObject as Report : r);
                  store.setReports(reports);
              } else {
                  store.setReports([...store.reports, activeObject as Report]);
              }
          } else if ('config' in activeObject) {
              // Chart
              const exists = store.charts.some(c => c.id === activeObject.id);
              if (exists) {
                  const charts = store.charts.map(c => c.id === activeObject.id ? activeObject as Chart : c);
                  store.setCharts(charts);
              } else {
                  store.setCharts([...store.charts, activeObject as Chart]);
              }
          } else if ('nodes' in activeObject) {
              // Workflow
              const exists = store.workflows.some(w => w.id === activeObject.id);
              if (exists) {
                  const workflows = store.workflows.map(w => w.id === activeObject.id ? activeObject as Workflow : w);
                  store.setWorkflows(workflows);
              } else {
                  store.setWorkflows([...store.workflows, activeObject as Workflow]);
              }
          }
          setIsDirty(false);
      }
      
      await store.saveProject();
      ui.addToast("Projekt gespeichert.", 'success');
      return {success:true}; 
  };

  const handleContextMenuAction = (action: 'view' | 'view_data' | 'export' | 'rename' | 'delete') => {
      if (!ui.itemContextMenu) return;
      const { type, id } = ui.itemContextMenu;
      ui.setItemContextMenu(null);

      if (action === 'delete') {
          ui.setConfirmationModal({
              title: `${type === 'table' ? 'Tabelle' : 'Objekt'} löschen`,
              message: `Möchten Sie "${type}" wirklich löschen?`,
              onConfirm: () => {
                  if (type === 'table') store.setTables(store.tables.filter(t => t.id !== id));
                  if (type === 'query') store.setQueries(store.queries.filter(q => q.id !== id));
                  if (type === 'form') store.setForms(store.forms.filter(f => f.id !== id));
                  if (type === 'report') store.setReports(store.reports.filter(r => r.id !== id));
                  if (type === 'workflow') store.setWorkflows(store.workflows.filter(w => w.id !== id));
                  
                  if (activeObject?.id === id) {
                      setActiveObject(null);
                      setCurrentView({ type: 'welcome' });
                  }
                  ui.addToast("Gelöscht.", 'warning');
              }
          });
      }
      
      if (action === 'rename') {
          let currentName = '';
          if (type === 'table') currentName = store.tables.find(t => t.id === id)?.name || '';
          if (type === 'query') currentName = store.queries.find(q => q.id === id)?.name || '';
          if (type === 'form') currentName = store.forms.find(f => f.id === id)?.name || '';
          if (type === 'report') currentName = store.reports.find(r => r.id === id)?.name || '';
          if (type === 'workflow') currentName = store.workflows.find(w => w.id === id)?.name || '';

          ui.setNameInput({
              title: 'Umbenennen',
              label: 'Neuer Name',
              initialValue: currentName,
              onConfirm: (newName) => {
                  if (type === 'table') store.setTables(store.tables.map(t => t.id === id ? { ...t, name: newName } : t));
                  if (type === 'query') store.setQueries(store.queries.map(q => q.id === id ? { ...q, name: newName } : q));
                  if (type === 'form') store.setForms(store.forms.map(f => f.id === id ? { ...f, name: newName } : f));
                  if (type === 'report') store.setReports(store.reports.map(r => r.id === id ? { ...r, name: newName } : r));
                  if (type === 'workflow') store.setWorkflows(store.workflows.map(w => w.id === id ? { ...w, name: newName } : w));
                  ui.setNameInput(null);
              },
              onCancel: () => ui.setNameInput(null)
          });
      }

      if (action === 'view') {
          if (type === 'table') handleSetView({ type: 'table_edit', tableId: id });
          if (type === 'query') handleSetView({ type: 'query_designer', queryId: id });
          if (type === 'form') handleSetView({ type: 'form_designer', formId: id });
          if (type === 'report') handleSetView({ type: 'report_designer', reportId: id });
          if (type === 'workflow') handleSetView({ type: 'workflow_designer', workflowId: id });
          if (type === 'chart') handleSetView({ type: 'chart_view', chartId: id });
      }

      if (action === 'view_data') {
          if (type === 'table') handleSetView({ type: 'table_data', tableId: id });
          if (type === 'query') handleSetView({ type: 'query_results', queryId: id });
          if (type === 'form') handleSetView({ type: 'form_view', formId: id });
          if (type === 'report') handleSetView({ type: 'report_view', reportId: id });
      }

      if (action === 'export') {
          // EXPORT LOGIC
          if (type === 'table' || type === 'query') {
              // DATA EXPORT (EXCEL)
              let data: any[] = [];
              let fileName = 'export';
              
              if (type === 'table') {
                  const t = store.tables.find(x => x.id === id);
                  if (t) { data = t.data || []; fileName = t.name; }
              } else {
                  const q = store.queries.find(x => x.id === id);
                  if (q) { 
                      data = store.executeQuery(q); 
                      fileName = q.name; 
                  }
              }

              if (data.length === 0) {
                  ui.addToast("Keine Daten zum Exportieren.", 'warning');
                  return;
              }

              const ws = XLSX.utils.json_to_sheet(data);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Daten");
              XLSX.writeFile(wb, `${fileName}.xlsx`);
              ui.addToast(`${fileName} als Excel exportiert.`, 'success');

          } else {
              // DEFINITION EXPORT (JSON) - Forms, Reports, Workflows
              let obj = null;
              if (type === 'form') obj = store.forms.find(x => x.id === id);
              if (type === 'report') obj = store.reports.find(x => x.id === id);
              if (type === 'workflow') obj = store.workflows.find(x => x.id === id);
              if (type === 'chart') obj = store.charts.find(x => x.id === id);

              if (obj) {
                  const dataStr = JSON.stringify(obj, null, 2);
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${obj.name}_${type}_def.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  ui.addToast(`${type} Definition exportiert.`, 'success');
              }
          }
      }
  };

  const closeSavePrompt = async (action: 'yes' | 'no' | 'cancel') => {
      const target = savePrompt.targetView;
      setSavePrompt({ show: false, targetView: undefined });
      
      if (action === 'cancel') return;
      
      if (action === 'yes') {
          await handleSave();
      } else {
          setIsDirty(false);
      }
      
      if (target) {
          handleSetView(target);
      }
  };

  const handleRibbonAction = async (action: string, payload?: any) => {
    try {
      if (action === 'backend_generate' || action === 'backend_export' || action.startsWith('form_') || action === 'export_form') {
          ui.setFormActionTrigger({ action, timestamp: Date.now() });
          if(action === 'backend_generate' && currentView.type !== 'backend_generator') handleSetView({ type: 'backend_generator' });
          return;
      }
      
      if (action === 'report_update_style' && activeObject) { 
          const report = activeObject as Report;
          const { section, style } = payload;
          if (report.styles) {
              const newReport = { ...report, styles: { ...report.styles, [section]: { ...(report.styles as any)[section], ...style } } };
              handleActiveObjectChange(newReport);
          }
          return; 
      }

      switch(action) {
        case 'new_db': if(confirm("Zum Startbildschirm?")) { store.closeProject(); setCurrentView({ type: 'welcome' }); } break;
        case 'create_table': handleSetView({ type: 'table_create' }); break;
        case 'create_table_ai': handleSetView({ type: 'table_create' }); break;
        case 'create_query': handleSetView({ type: 'query_designer' }); break;
        case 'wizard_duplicate': ui.setActiveWizard('duplicate'); break;
        case 'wizard_inconsistency': ui.setActiveWizard('inconsistency'); break;
        case 'wizard_append': ui.setActiveWizard('append'); break;
        case 'wizard_delete': ui.setActiveWizard('delete'); break;
        case 'create_report': ui.setShowReportWizard(true); break;
        case 'create_form': ui.setShowFormWizard(true); break;
        case 'create_chart': /* ... */ break;
        case 'create_workflow': /* ... */ break;
        
        case 'relationships': handleSetView({ type: 'relationships' }); break;
        case 'api_import': handleSetView({ type: 'api_import' }); break;
        case 'sharepoint_import': ui.setShowSharePointWizard(true); break;
        
        case 'import_excel': ui.setShowExcelWizard(true); break;
        case 'import_access': ui.setShowAccessWizard(true); break;
        case 'generate_dummy': ui.setShowDummyDataWizard(true); break;
        case 'save': await handleSave(); break;
        
        case 'electron_settings': ui.setShowElectronSettings(true); break;
        case 'security_manager': ui.setShowSecurityManager(true); break;
        case 'open_app_info': handleSetView({ type: 'app_info' }); break;
        case 'open_whitelabel': ui.setShowWhitelabelModal(true); break;
        
        case 'open_integrations': ui.setShowIntegrationsModal(true); break;
        case 'open_envs': ui.setShowEnvModal(true); break;
        case 'open_migrations': ui.setShowMigrationModal(true); break;
        case 'open_deployment_modal': ui.setShowDeploymentModal(true); break;
      }
    } catch (error: any) { ui.showMessage("Systemfehler", error.message, 'error'); }
  };

  const handleSaveIntegrations = (newConfig: IntegrationsConfig) => {
      if (store.backendConfig) {
          store.setBackendConfig({ ...store.backendConfig, integrations: newConfig });
          store.saveProject().then(() => ui.addToast("Integrationen gespeichert."));
      }
  };

  return {
    db: {
        projectId: store.projectId,
        currentProjectName: store.projectName,
        dbType: store.backendConfig.dbType,
        tables: store.tables,
        queries: store.queries,
        reports: store.reports,
        forms: store.forms,
        workflows: store.workflows,
        relationships: store.relationships,
        loadProject: store.loadProject,
        createNewDatabase: store.createNew,
        saveTable: (t: any, mode: any) => mode === 'create' ? store.addTable(t) : store.updateTable(t),
        saveQuery: (q: any) => store.setQueries([...store.queries, q]),
        saveReport: (r: any) => store.setReports([...store.reports, r]),
        saveForm: (f: any) => store.setForms([...store.forms, f]),
        saveWorkflow: (w: any) => store.setWorkflows([...store.workflows, w]),
        deleteRelationship: (id: string) => store.setRelationships(store.relationships.filter(r => r.id !== id)),
        updateRelationship: (rel: any) => store.setRelationships(store.relationships.map(r => r.id === rel.id ? rel : r)),
        setRelationships: store.setRelationships,
        executeQuery: store.executeQuery,
        exportProject: async (conf: any) => { /* ... */ }
    },
    currentView, activeTab, setActiveTab, activeObject, isDirty, 
    backendConfig: store.backendConfig, setBackendConfig: store.setBackendConfig,
    savePrompt, 
    
    // UI State & Actions
    ...ui,
    // Provide store layout to UI hooks if needed or directly pass to ViewRouter
    relationshipNodes: store.layout || [], 
    setRelationshipNodes: store.setLayout, // Direct store update for moves
    
    // Chat State & Actions
    ...chat,

    // Core Logic Overrides
    onSaveElectronSettings: (s: any) => { if(store.backendConfig) store.setBackendConfig({...store.backendConfig, electronSettings: s}); ui.setShowElectronSettings(false); }, onCloseElectronSettings: () => ui.setShowElectronSettings(false),
    
    onSaveDeploymentConfig: (c: any) => { if(store.backendConfig) store.setBackendConfig({...store.backendConfig, deploymentConfig: c}); }, onDeploy: () => { ui.setShowDeploymentModal(false); ui.setFormActionTrigger({action:'backend_generate', timestamp: Date.now()}); },
    electronSettings: store.backendConfig?.electronSettings || { includeBackend: true, bundleFrontend: true },

    onSaveIntegrations: handleSaveIntegrations,
    onSaveWizardQuery: (q: any) => { store.setQueries([...store.queries, q]); ui.setActiveWizard(null); handleSetView({type: 'query_designer', queryId: q.id}); },
    onExecuteAppend: (s:any,t:any,m:any) => {}, 
    onExecuteDelete: (t:any,c:any) => {}, 
    onUpdateTable: store.updateTable,

    handleSetView, handleActiveObjectChange, handleSave, handleRibbonAction,
    closeSavePrompt, handleContextMenuAction, 
    
    onSnapshot: store.snapshot,
    onUpdateEnvironments: (e: any) => { if(store.backendConfig) store.setBackendConfig({...store.backendConfig, environments: e}); },
    onUpdateCommercial: (w:any,m:any,l:any) => { if(store.backendConfig) store.setBackendConfig({...store.backendConfig, whitelabel: w, multiTenancy: m, licensing: l}); },
    lastSnapshot: store.lastSnapshot,

    activeLock
  };
};
