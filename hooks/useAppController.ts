
import { useState, useEffect } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import { ViewType, Table, Query, Report, Form, SelectQuery, BackendConfig, TableNode, NODE_WIDTH, DbType, Relationship, Chart, ElectronSettings, MessageModalConfig, DeploymentConfig, Workflow, EnvironmentConfig, WhitelabelConfig, MultiTenancyConfig, LicensingConfig, Project, LockInfo, Chat, ChatMessage, IntegrationsConfig } from '../types/index';
import { ToastInfo } from '../components/Toast';
import { saveProjectToStorage, getAllProjects } from '../services/storageService';
import { Criterion } from '../features/queries/wizards/DeleteQueryWizard';
import { cloudService } from '../services/cloudService'; 

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

  // Locking State
  const [activeLock, setActiveLock] = useState<LockInfo | null>(null);
  const [readOnlyMode, setReadOnlyMode] = useState(false);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([
      {
          id: 'c1', type: 'group', name: 'Projekt Team', participants: ['u1', 'u2', 'u3'], 
          messages: [
              { id: 'm1', senderId: 'u2', senderName: 'Sarah', text: 'Hat jemand die neue Tabelle gesehen?', timestamp: Date.now() - 3600000 },
              { id: 'm2', senderId: 'u3', senderName: 'Tom', text: 'Ja, sieht gut aus. Ich arbeite an der API.', timestamp: Date.now() - 3500000 }
          ], unreadCount: 0
      },
      {
          id: 'c2', type: 'private', name: 'Sarah Lee', participants: ['u1', 'u2'], isOnline: true,
          messages: [
              { id: 'm3', senderId: 'u2', senderName: 'Sarah', text: 'Kannst du den Deploy anstoßen?', timestamp: Date.now() - 100000 }
          ], unreadCount: 1
      },
      {
          id: 'c3', type: 'private', name: 'Tom H.', participants: ['u1', 'u3'], isOnline: false,
          messages: [], unreadCount: 0
      }
  ]);

  // Global Modals
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
  const [showExcelWizard, setShowExcelWizard] = useState(false);
  const [showAccessWizard, setShowAccessWizard] = useState(false);
  const [showDummyDataWizard, setShowDummyDataWizard] = useState(false);
  
  const [showElectronSettings, setShowElectronSettings] = useState(false);
  const [showSecurityManager, setShowSecurityManager] = useState(false);
  const [showWhitelabelModal, setShowWhitelabelModal] = useState(false);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false); // NEW Global State
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);

  const [activeWizard, setActiveWizard] = useState<'duplicate' | 'inconsistency' | 'append' | 'delete' | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    title: string; message: string; onConfirm: () => void;
  } | null>(null);

  const [formActionTrigger, setFormActionTrigger] = useState<{ action: string, timestamp: number } | undefined>(undefined);

  useEffect(() => { store.init(); }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => { setToasts(prev => prev.filter(t => t.id !== id)); };

  const showMessage = (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
      setMessageModal({ title, message, type });
  };

  const releaseCurrentLock = async () => {
      if (activeObject && 'id' in activeObject) {
          await cloudService.releaseLock(activeObject.id, 'u1'); // Mock user u1
          setActiveLock(null);
      }
  };

  const handleSetView = async (view: ViewType) => {
    // 1. Release Lock if changing away from editable view
    if (activeObject) {
        await releaseCurrentLock();
    }

    // 2. Check Dirty
    if (isDirty) { 
        setSavePrompt({ show: true, targetView: view }); 
        return; 
    }

    // 3. Set View & Check for new Lock
    setCurrentView(view);
    
    // Reset selection if moving to a general view
    if (view.type === 'welcome' || view.type === 'relationships' || view.type === 'backend_generator') {
        setActiveObject(null);
        setReadOnlyMode(false);
    }
  };

  const handleActiveObjectChange = (newObjectState: any) => {
    if (readOnlyMode) { 
        addToast("Schreibgeschützt.", 'error'); 
        return; 
    }
    setActiveObject(newObjectState);
    if (!isDirty) setIsDirty(true);
  };

  const handleSave = async () => { 
      // 1. Save Active Object to Memory Store
      if (activeObject) {
          if ('fields' in activeObject && !('nodes' in activeObject) && !('sourceType' in activeObject)) {
              store.updateTable(activeObject as Table);
          } else if ('nodes' in activeObject && 'columns' in activeObject) {
              const queries = store.queries.map(q => q.id === activeObject.id ? activeObject as Query : q);
              store.setQueries(queries);
          } else if ('layout' in activeObject) {
              const forms = store.forms.map(f => f.id === activeObject.id ? activeObject as Form : f);
              store.setForms(forms);
          } else if ('summaries' in activeObject) {
              const reports = store.reports.map(r => r.id === activeObject.id ? activeObject as Report : r);
              store.setReports(reports);
          } else if ('config' in activeObject) {
              const charts = store.charts.map(c => c.id === activeObject.id ? activeObject as Chart : c);
              store.setCharts(charts);
          } else if ('nodes' in activeObject) {
              const workflows = store.workflows.map(w => w.id === activeObject.id ? activeObject as Workflow : w);
              store.setWorkflows(workflows);
          }
          setIsDirty(false);
      }
      
      // 2. Persist Everything to IndexedDB (Project File)
      // This ensures BackendConfig (ApiURL etc.) and all other changes are written to disk
      await store.saveProject();
      
      addToast("Projekt gespeichert.", 'success');
      return {success:true}; 
  };

  const closeSavePrompt = async (action: 'yes' | 'no' | 'cancel') => {
      const target = savePrompt.targetView;
      setSavePrompt({ show: false, targetView: undefined });
      
      if (action === 'cancel') return;
      
      if (action === 'yes') {
          await handleSave();
      } else {
          // Discard changes: Reset dirty flag
          setIsDirty(false);
      }
      
      if (target) {
          handleSetView(target);
      }
  };

  const handleRibbonAction = async (action: string, payload?: any) => {
    try {
      if (action === 'backend_generate' || action === 'backend_export' || action.startsWith('form_') || action === 'export_form') {
          setFormActionTrigger({ action, timestamp: Date.now() });
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
        case 'wizard_duplicate': setActiveWizard('duplicate'); break;
        case 'wizard_inconsistency': setActiveWizard('inconsistency'); break;
        case 'wizard_append': setActiveWizard('append'); break;
        case 'wizard_delete': setActiveWizard('delete'); break;
        case 'create_report': setShowReportWizard(true); break;
        case 'create_form': setShowFormWizard(true); break;
        case 'create_chart': /* ... */ break;
        case 'create_workflow': /* ... */ break;
        
        case 'relationships': handleSetView({ type: 'relationships' }); break;
        case 'api_import': handleSetView({ type: 'api_import' }); break;
        
        case 'import_excel': setShowExcelWizard(true); break;
        case 'import_access': setShowAccessWizard(true); break;
        case 'generate_dummy': setShowDummyDataWizard(true); break;
        case 'save': await handleSave(); break;
        
        case 'electron_settings': setShowElectronSettings(true); break;
        case 'security_manager': setShowSecurityManager(true); break;
        case 'open_app_info': handleSetView({ type: 'app_info' }); break;
        case 'open_whitelabel': setShowWhitelabelModal(true); break;
        
        case 'open_integrations': setShowIntegrationsModal(true); break;
        case 'open_envs': setShowEnvModal(true); break;
        case 'open_migrations': setShowMigrationModal(true); break;
        case 'open_deployment_modal': setShowDeploymentModal(true); break;
      }
    } catch (error: any) { showMessage("Systemfehler", error.message, 'error'); }
  };

  const handleSaveIntegrations = (newConfig: IntegrationsConfig) => {
      if (store.backendConfig) {
          store.setBackendConfig({ ...store.backendConfig, integrations: newConfig });
          // Auto-save project on config change
          store.saveProject().then(() => addToast("Integrationen gespeichert."));
      }
  };

  const handleSelectChat = (id: string | null) => {
      setActiveChatId(id);
  };

  const handleSendMessage = (chatId: string, text: string) => {
      setChats(prev => prev.map(chat => {
          if (chat.id === chatId) {
              return {
                  ...chat,
                  messages: [...chat.messages, {
                      id: crypto.randomUUID(),
                      senderId: 'u1', 
                      senderName: 'Me',
                      text,
                      timestamp: Date.now()
                  }]
              };
          }
          return chat;
      }));
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
    relationshipNodes, isSidebarOpen, setIsSidebarOpen, isRibbonOpen, setIsRibbonOpen,
    backendConfig: store.backendConfig, setBackendConfig: store.setBackendConfig, formActionTrigger,
    toasts, addToast, removeToast,
    savePrompt, itemContextMenu, setItemContextMenu, nameInput, setNameInput,
    showReportWizard, setShowReportWizard, showFormWizard, setShowFormWizard,
    showSecurityManager, setShowSecurityManager, onUpdateTable: store.updateTable,
    showElectronSettings, electronSettings: store.backendConfig?.electronSettings || { includeBackend: true, bundleFrontend: true },
    onSaveElectronSettings: (s: any) => { if(store.backendConfig) store.setBackendConfig({...store.backendConfig, electronSettings: s}); setShowElectronSettings(false); }, onCloseElectronSettings: () => setShowElectronSettings(false),
    
    showDeploymentModal, setShowDeploymentModal, 
    onSaveDeploymentConfig: (c: any) => { if(store.backendConfig) store.setBackendConfig({...store.backendConfig, deploymentConfig: c}); }, onDeploy: () => { setShowDeploymentModal(false); setFormActionTrigger({action:'backend_generate', timestamp: Date.now()}); },
    
    showWhitelabelModal, setShowWhitelabelModal,
    showEnvModal, setShowEnvModal,
    showMigrationModal, setShowMigrationModal,
    showExcelWizard, setShowExcelWizard,
    showAccessWizard, setShowAccessWizard,
    showDummyDataWizard, setShowDummyDataWizard,
    
    // NEW Integrations
    showIntegrationsModal, setShowIntegrationsModal,
    onSaveIntegrations: handleSaveIntegrations,

    activeWizard, setActiveWizard, onSaveWizardQuery: (q: any) => { store.setQueries([...store.queries, q]); setActiveWizard(null); handleSetView({type: 'query_designer', queryId: q.id}); },
    onExecuteAppend: (s:any,t:any,m:any) => {}, 
    onExecuteDelete: (t:any,c:any) => {}, 

    confirmationModal, setConfirmationModal,
    handleSetView, handleActiveObjectChange, handleSave, handleRibbonAction,
    closeSavePrompt, handleContextMenuAction: (a:any) => {}, setRelationshipNodes,
    messageModal, showMessage, closeMessage: () => setMessageModal(null),
    
    onSnapshot: store.snapshot,
    onUpdateEnvironments: (e: any) => { if(store.backendConfig) store.setBackendConfig({...store.backendConfig, environments: e}); },
    onUpdateCommercial: (w:any,m:any,l:any) => { if(store.backendConfig) store.setBackendConfig({...store.backendConfig, whitelabel: w, multiTenancy: m, licensing: l}); },
    lastSnapshot: store.lastSnapshot,

    activeLock,
    isChatOpen, setIsChatOpen, chats, activeChatId, handleSelectChat, handleSendMessage
  };
};
