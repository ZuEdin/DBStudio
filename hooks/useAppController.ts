
import { useState, useEffect } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import { ViewType, Table, Query, Report, Form, SelectQuery, BackendConfig, TableNode, NODE_WIDTH, DbType, Relationship, Chart, ElectronSettings, MessageModalConfig, DeploymentConfig, Workflow, EnvironmentConfig, WhitelabelConfig, MultiTenancyConfig, LicensingConfig } from '../types/index';
import { ToastInfo } from '../components/Toast';
import { saveProjectToStorage, getAllProjects } from '../services/storageService';

export const useAppController = () => {
  const store = useProjectStore();
  
  const [currentView, setCurrentView] = useState<ViewType>({ type: 'welcome' });
  const [activeTab, setActiveTab] = useState('create');
  const [activeObject, setActiveObject] = useState<Table | Query | Report | Form | Chart | Workflow | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [savePrompt, setSavePrompt] = useState<{show: boolean, targetView?: ViewType}>({show: false});
  const [relationshipNodes, setRelationshipNodes] = useState<TableNode[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRibbonOpen, setIsRibbonOpen] = useState(true);
  
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // New Global Message Modal State
  const [messageModal, setMessageModal] = useState<MessageModalConfig | null>(null);

  const [itemContextMenu, setItemContextMenu] = useState<{
    type: 'table' | 'query' | 'report' | 'form' | 'chart' | 'workflow';
    id: string;
    x: number;
    y: number;
  } | null>(null);
  
  const [nameInput, setNameInput] = useState<{
    title: string; label: string; initialValue: string; onConfirm: (name: string) => void; onCancel: () => void;
  } | null>(null);
  
  const [showReportWizard, setShowReportWizard] = useState(false);
  const [showFormWizard, setShowFormWizard] = useState(false);
  const [showElectronSettings, setShowElectronSettings] = useState(false);
  const [showSecurityManager, setShowSecurityManager] = useState(false);
  const [showWhitelabelModal, setShowWhitelabelModal] = useState(false); // NEW
  const [showEnvModal, setShowEnvModal] = useState(false); // NEW
  const [showMigrationModal, setShowMigrationModal] = useState(false); // NEW
  
  // NEW: Deployment Modal
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);

  const [activeWizard, setActiveWizard] = useState<'duplicate' | 'inconsistency' | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    title: string; message: string; onConfirm: () => void;
  } | null>(null);

  const [formActionTrigger, setFormActionTrigger] = useState<{ action: string, timestamp: number } | undefined>(undefined);

  useEffect(() => { store.init(); }, []);

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.ctrlKey && e.key === 'z') { e.preventDefault(); store.undo(); addToast("Rückgängig gemacht"); } 
          else if (e.ctrlKey && e.key === 'y') { e.preventDefault(); store.redo(); addToast("Wiederhergestellt"); }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setRelationshipNodes((prevNodes) => {
      const newNodes: TableNode[] = [];
      const existingNodesMap = new Map<string, TableNode>();
      prevNodes.forEach(n => existingNodesMap.set(n.tableId, n));
      
      store.tables.forEach((table, i) => {
        const existingNode = existingNodesMap.get(table.id);
        if (existingNode) newNodes.push(existingNode);
        else newNodes.push({ id: `rel_node_${table.id}`, tableId: table.id, x: 50 + (i * (NODE_WIDTH + 50)), y: 50 });
      });
      return newNodes.filter(n => store.tables.some(t => t.id === n.tableId));
    });
  }, [store.tables]);

  useEffect(() => {
    setIsDirty(false);
    if (currentView.type === 'table_create') {
      setActiveObject({ id: crypto.randomUUID(), name: 'NeueTabelle', fields: [{ id: crypto.randomUUID(), name: 'ID', type: 'INTEGER', isPrimaryKey: true }] });
      setIsDirty(true);
    } else if (currentView.type === 'table_edit' || currentView.type === 'table_data') {
      setActiveObject(store.tables.find(t => t.id === currentView.tableId) || null);
    } else if (currentView.type === 'query_results') {
      setActiveObject(store.queries.find(q => q.id === currentView.queryId) || null);
    } else if (currentView.type === 'report_view' || currentView.type === 'report_designer') {
      setActiveObject(store.reports.find(r => r.id === currentView.reportId) || null);
    } else if (currentView.type === 'form_view' || currentView.type === 'form_designer') {
      setActiveObject(store.forms.find(f => f.id === currentView.formId) || null);
    } else if (currentView.type === 'chart_view') {
      setActiveObject(store.charts?.find(c => c.id === currentView.chartId) || null);
    } else if (currentView.type === 'workflow_designer') {
      setActiveObject(store.workflows?.find(w => w.id === currentView.workflowId) || null);
    } else if (currentView.type === 'query_designer') {
      if (currentView.queryId) {
        setActiveObject(store.queries.find(q => q.id === currentView.queryId) || null);
      } else {
        setActiveObject({ id: '', type: 'SELECT', name: 'NeueAbfrage', nodes: [], columns: [] } as SelectQuery);
        setIsDirty(true);
      }
    } else {
      setActiveObject(null);
    }
  }, [currentView, store.tables, store.queries, store.reports, store.forms, store.charts, store.workflows]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => { setToasts(prev => prev.filter(t => t.id !== id)); };

  const showMessage = (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
      setMessageModal({ title, message, type });
  };

  const handleSetView = (view: ViewType) => {
    if (isDirty) setSavePrompt({ show: true, targetView: view });
    else setCurrentView(view);
  };

  const handleActiveObjectChange = (newObjectState: Table | Query | Report | Form | Chart | Workflow) => {
    setActiveObject(newObjectState);
    if (!isDirty) setIsDirty(true);
  };

  const handleSave = (): Promise<{ success: boolean; savedObject?: Table | Query | Report | Form | Chart | Workflow; wasNew?: boolean }> => {
    return new Promise(async (resolve) => {
      try {
        if (!activeObject) {
            if (store.projectId) {
                await saveProjectToStorage({
                    id: store.projectId,
                    name: store.projectName,
                    lastModified: Date.now(),
                    data: {
                        tables: store.tables, queries: store.queries, reports: store.reports,
                        forms: store.forms, charts: store.charts, workflows: store.workflows, relationships: store.relationships, backendConfig: store.backendConfig,
                        lastSnapshot: store.lastSnapshot
                    }
                });
                addToast('Projekt gespeichert.');
            }
            return resolve({ success: true });
        }

        // Charts
        if ('config' in activeObject && 'xAxisFieldId' in activeObject.config) {
            const chart = activeObject as Chart;
            if(!chart.id) chart.id = crypto.randomUUID(); 
            const existing = store.charts?.find(c => c.id === chart.id);
            if (existing) store.setCharts(store.charts?.map(c => c.id === chart.id ? chart : c) || [chart]);
            else store.setCharts([...(store.charts || []), chart]);
            setIsDirty(false); addToast(`Diagramm "${chart.name}" gespeichert.`);
            resolve({ success: true, savedObject: chart, wasNew: !existing });
            return;
        }

        // Workflow
        if ('nodes' in activeObject && 'edges' in activeObject) {
            const wf = activeObject as Workflow;
            if(!wf.id) wf.id = crypto.randomUUID();
            const existing = store.workflows?.find(w => w.id === wf.id);
            if (existing) store.setWorkflows(store.workflows?.map(w => w.id === wf.id ? wf : w) || [wf]);
            else store.setWorkflows([...(store.workflows || []), wf]);
            setIsDirty(false); addToast(`Workflow "${wf.name}" gespeichert.`);
            resolve({ success: true, savedObject: wf, wasNew: !existing });
            return;
        }

        // Form or Report
        if ('sourceType' in activeObject) {
             if ('layout' in activeObject) {
                 const form = activeObject as Form;
                 const exists = store.forms.some(f => f.id === form.id);
                 if(exists) store.setForms(store.forms.map(f => f.id === form.id ? form : f));
                 else store.setForms([...store.forms, form]);
                 setIsDirty(false); addToast(`Formular "${form.name}" gespeichert.`);
                 resolve({ success: true, savedObject: form, wasNew: !exists });
                 return;
             }
             if ('summaries' in activeObject) {
                 const report = activeObject as Report;
                 const exists = store.reports.some(r => r.id === report.id);
                 if(exists) store.setReports(store.reports.map(r => r.id === report.id ? report : r));
                 else store.setReports([...store.reports, report]);
                 setIsDirty(false); addToast(`Bericht "${report.name}" gespeichert.`);
                 resolve({ success: true, savedObject: report, wasNew: !exists });
                 return;
             }
        }

        const finishSave = (objectToSave: Table | Query, wasNew: boolean) => {
            if ('fields' in objectToSave && !('nodes' in objectToSave)) {
                // Table
                if (wasNew) store.addTable(objectToSave as Table); // Use new action
                else store.updateTable(objectToSave as Table);
                addToast(`Tabelle "${objectToSave.name}" ${wasNew ? 'erstellt' : 'aktualisiert'}.`);
            } else {
                // Query
                if (wasNew) store.setQueries([...store.queries, objectToSave as Query]);
                else store.setQueries(store.queries.map(q => q.id === objectToSave.id ? objectToSave as Query : q));
                addToast(`Abfrage "${objectToSave.name}" ${wasNew ? 'erstellt' : 'aktualisiert'}.`);
            }
            setIsDirty(false);
            setActiveObject(objectToSave);
            resolve({ success: true, savedObject: objectToSave, wasNew });
        };

        let objectToSave = { ...activeObject };
        const wasNew = !objectToSave.id || ('fields' in objectToSave && !('nodes' in objectToSave) && !store.tables.some(t => t.id === objectToSave.id));

        if (wasNew && 'nodes' in objectToSave) {
            setNameInput({
                title: "Abfrage speichern",
                label: "Name:",
                initialValue: objectToSave.name,
                onConfirm: (name) => {
                    objectToSave.name = name;
                    objectToSave.id = crypto.randomUUID();
                    setNameInput(null);
                    finishSave(objectToSave as Query, true);
                },
                onCancel: () => { setNameInput(null); resolve({ success: false }); }
            });
        } else {
            finishSave(objectToSave as Table | Query, wasNew);
        }
      } catch (error: any) {
        showMessage("Speichern fehlgeschlagen", error.message, 'error');
        resolve({ success: false });
      }
    });
  };

  const handleRibbonAction = async (action: string, payload?: any) => {
    try {
      if (action === 'backend_generate' || action === 'backend_export' || action.startsWith('form_') || action === 'export_form') {
          setFormActionTrigger({ action, timestamp: Date.now() });
          if(action === 'backend_generate' && currentView.type !== 'backend_generator') handleSetView({ type: 'backend_generator' });
          return;
      }
      
      if (action === 'report_update_style' && activeObject && 'styles' in activeObject) {
          const report = activeObject as Report;
          const section = payload.section as keyof typeof report.styles;
          handleActiveObjectChange({ ...report, styles: { ...report.styles, [section]: { ...report.styles?.[section], ...payload.style } } });
          return;
      }

      switch(action) {
        case 'new_db': 
            if(confirm("Zum Startbildschirm?")) { 
                store.closeProject(); 
                setCurrentView({ type: 'welcome' }); 
            } 
            break;
        case 'create_table_ai':
        case 'create_table': handleSetView({ type: 'table_create' }); break;
        case 'create_query': handleSetView({ type: 'query_designer' }); break;
        case 'wizard_duplicate': setActiveWizard('duplicate'); break;
        case 'wizard_inconsistency': setActiveWizard('inconsistency'); break;
        case 'create_report': setShowReportWizard(true); break;
        case 'create_form': setShowFormWizard(true); break;
        case 'create_chart': 
            if (store.tables.length === 0) { showMessage("Fehler", "Bitte erstellen Sie zuerst Tabellen.", 'error'); return; }
            const newChart: Chart = {
                id: crypto.randomUUID(), name: 'Neues Diagramm', type: 'bar', sourceType: 'table', sourceId: store.tables[0].id,
                config: { xAxisFieldId: store.tables[0].fields[0].name, yAxisFieldIds: [] }
            };
            store.setCharts([...(store.charts || []), newChart]);
            handleSetView({ type: 'chart_view', chartId: newChart.id });
            break;
        case 'create_workflow':
            const newWorkflow: Workflow = {
                id: crypto.randomUUID(), name: 'Neuer Workflow', active: true, nodes: [], edges: []
            };
            store.setWorkflows([...(store.workflows || []), newWorkflow]);
            handleSetView({ type: 'workflow_designer', workflowId: newWorkflow.id });
            break;
        case 'relationships': handleSetView({ type: 'relationships' }); break;
        case 'api_import': handleSetView({ type: 'api_import' }); break;
        case 'save': await handleSave(); break;
        case 'electron_settings': setShowElectronSettings(true); break;
        case 'security_manager': setShowSecurityManager(true); break;
        
        // NEW ACTIONS
        case 'open_whitelabel': setShowWhitelabelModal(true); break;
        case 'open_envs': setShowEnvModal(true); break;
        case 'open_migrations': setShowMigrationModal(true); break;
        case 'open_deployment_modal': setShowDeploymentModal(true); break;
      }
    } catch (error: any) { showMessage("Systemfehler", error.message, 'error'); }
  };

  const closeSavePrompt = async (action: 'yes' | 'no' | 'cancel') => {
    const targetView = savePrompt.targetView || { type: 'welcome' };
    setSavePrompt({ show: false });
    if (action === 'yes') { const { success } = await handleSave(); if (success) setCurrentView(targetView); } 
    else if (action === 'no') { setIsDirty(false); setCurrentView(targetView); }
  };

  const handleContextMenuAction = (action: 'view' | 'view_data' | 'export' | 'rename' | 'delete') => {
    if (!itemContextMenu) return;
    const { type, id } = itemContextMenu;
    setItemContextMenu(null);

    const allObjects = [...store.tables, ...store.queries, ...store.reports, ...store.forms, ...(store.charts || []), ...(store.workflows || [])];
    const getObject = () => allObjects.find(o => o.id === id);

    switch (action) {
      case 'view_data':
        if (type === 'table') handleSetView({ type: 'table_data', tableId: id });
        else if (type === 'query') handleSetView({ type: 'query_results', queryId: id });
        else if (type === 'form') handleSetView({ type: 'form_view', formId: id });
        else if (type === 'report') handleSetView({ type: 'report_view', reportId: id });
        else if (type === 'chart') handleSetView({ type: 'chart_view', chartId: id });
        break;
      case 'view':
        if (type === 'table') handleSetView({ type: 'table_edit', tableId: id });
        else if (type === 'query') handleSetView({ type: 'query_designer', queryId: id });
        else if (type === 'report') handleSetView({ type: 'report_designer', reportId: id });
        else if (type === 'form') handleSetView({ type: 'form_designer', formId: id });
        else if (type === 'chart') handleSetView({ type: 'chart_view', chartId: id });
        else if (type === 'workflow') handleSetView({ type: 'workflow_designer', workflowId: id });
        break;
      case 'rename':
        const obj = getObject();
        if (obj) {
          setNameInput({
            title: `"${obj.name}" umbenennen`, label: 'Neuer Name:', initialValue: obj.name,
            onConfirm: (newName) => {
              if (newName?.trim()) {
                if (type === 'table') store.updateTable({ ...obj as Table, name: newName });
                if (type === 'query') store.setQueries(store.queries.map(q => q.id === id ? { ...q, name: newName } : q));
                if (type === 'report') store.setReports(store.reports.map(r => r.id === id ? { ...r, name: newName } : r));
                if (type === 'form') store.setForms(store.forms.map(f => f.id === id ? { ...f, name: newName } : f));
                if (type === 'chart') store.setCharts(store.charts!.map(c => c.id === id ? { ...c, name: newName } : c));
                if (type === 'workflow') store.setWorkflows(store.workflows!.map(w => w.id === id ? { ...w, name: newName } : w));
                addToast('Umbennung erfolgreich.');
              }
              setNameInput(null);
            },
            onCancel: () => setNameInput(null)
          });
        }
        break;
      case 'delete':
        setConfirmationModal({
          title: 'Löschen bestätigen', message: 'Möchten Sie dieses Objekt wirklich löschen?',
          onConfirm: () => {
             if (type === 'table') { store.setTables(store.tables.filter(t => t.id !== id)); store.setRelationships(store.relationships.filter(r => r.fromTableId !== id && r.toTableId !== id)); }
             if (type === 'query') store.setQueries(store.queries.filter(q => q.id !== id));
             if (type === 'report') store.setReports(store.reports.filter(r => r.id !== id));
             if (type === 'form') store.setForms(store.forms.filter(f => f.id !== id));
             if (type === 'chart') store.setCharts(store.charts!.filter(c => c.id !== id));
             if (type === 'workflow') store.setWorkflows(store.workflows!.filter(w => w.id !== id));
             if (activeObject?.id === id) handleSetView({ type: 'welcome' });
             addToast('Objekt gelöscht.');
          }
        });
        break;
    }
  };

  const handleSaveDeploymentConfig = (config: DeploymentConfig) => {
      if (store.backendConfig) {
          store.setBackendConfig({ ...store.backendConfig, deploymentConfig: config });
          addToast("Deployment Konfiguration gespeichert.");
      }
  };

  const handleDeploy = () => {
      setShowDeploymentModal(false);
      setFormActionTrigger({ action: 'backend_generate', timestamp: Date.now() });
      setTimeout(() => {
          showMessage("Deployment Vorbereitet", "Die Deployment-Skripte wurden generiert (Dockerfile/FTP). Sie finden diese im 'App Generator' Tab unter 'Projekt Explorer'.", 'success');
      }, 500);
  };

  const handleSnapshot = () => {
      store.snapshot();
  };

  const handleUpdateEnvironments = (envs: EnvironmentConfig[]) => {
      if (store.backendConfig) {
          store.setBackendConfig({ ...store.backendConfig, environments: envs });
      }
  };

  const handleUpdateCommercial = (whitelabel: WhitelabelConfig, multiTenancy: MultiTenancyConfig, licensing: LicensingConfig) => {
      if (store.backendConfig) {
          store.setBackendConfig({
              ...store.backendConfig,
              whitelabel,
              multiTenancy,
              licensing
          });
      }
  };

  const db = {
      ...store,
      currentProjectName: store.projectName,
      dbType: store.backendConfig?.dbType || DbType.SQL,
      deleteRelationship: (id: string) => store.setRelationships(store.relationships.filter(r => r.id !== id)),
      updateRelationship: (rel: Relationship) => store.setRelationships(store.relationships.map(r => r.id === rel.id ? rel : r)),
      // Safe add using new action
      saveTable: (t: Table, m: any) => m === 'create' ? store.addTable(t) : store.updateTable(t),
      saveForm: (f: Form) => store.setForms([...store.forms.filter(o => o.id !== f.id), f]),
      saveReport: (r: Report) => store.setReports([...store.reports.filter(o => o.id !== r.id), r]),
      saveQuery: (q: Query) => store.setQueries([...store.queries.filter(o => o.id !== q.id), q]),
      saveWorkflow: (w: Workflow) => store.setWorkflows([...(store.workflows || []).filter(o => o.id !== w.id), w]),
      loadProject: store.loadProject,
      createNewDatabase: store.createNew,
      exportProject: async (conf: BackendConfig) => {
          const dataStr = JSON.stringify({
              id: store.projectId, name: store.projectName, lastModified: Date.now(),
              data: { tables: store.tables, queries: store.queries, reports: store.reports, forms: store.forms, charts: store.charts, workflows: store.workflows, relationships: store.relationships, backendConfig: conf, lastSnapshot: store.lastSnapshot }
          }, null, 2);
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr));
          linkElement.setAttribute('download', `${store.projectName}.dbsp`);
          linkElement.click();
      }
  };

  const handleSaveElectronSettings = (newSettings: ElectronSettings) => {
      if (store.backendConfig) {
          store.setBackendConfig({ ...store.backendConfig, electronSettings: newSettings });
          addToast("Electron Konfiguration gespeichert.");
      }
  };

  return {
    db, 
    currentView, activeTab, setActiveTab, activeObject, isDirty, 
    relationshipNodes, isSidebarOpen, setIsSidebarOpen, isRibbonOpen, setIsRibbonOpen,
    backendConfig: store.backendConfig, setBackendConfig: store.setBackendConfig, formActionTrigger,
    toasts, addToast, removeToast,
    savePrompt, itemContextMenu, setItemContextMenu, nameInput, setNameInput,
    showReportWizard, setShowReportWizard, showFormWizard, setShowFormWizard,
    showSecurityManager, setShowSecurityManager, onUpdateTable: store.updateTable,
    showElectronSettings, electronSettings: store.backendConfig?.electronSettings || { includeBackend: true, bundleFrontend: true },
    onSaveElectronSettings: handleSaveElectronSettings, onCloseElectronSettings: () => setShowElectronSettings(false),
    
    showDeploymentModal, setShowDeploymentModal, 
    onSaveDeploymentConfig: handleSaveDeploymentConfig, onDeploy: handleDeploy,
    
    // Pass new modal states
    showWhitelabelModal, setShowWhitelabelModal,
    showEnvModal, setShowEnvModal,
    showMigrationModal, setShowMigrationModal,

    activeWizard, setActiveWizard, confirmationModal, setConfirmationModal,
    handleSetView, handleActiveObjectChange, handleSave, handleRibbonAction,
    closeSavePrompt, handleContextMenuAction, setRelationshipNodes,
    messageModal, showMessage, closeMessage: () => setMessageModal(null),
    
    onSnapshot: handleSnapshot,
    onUpdateEnvironments: handleUpdateEnvironments,
    onUpdateCommercial: handleUpdateCommercial,
    lastSnapshot: store.lastSnapshot
  };
};
