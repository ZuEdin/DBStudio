
import { useState, useEffect } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import { ViewType, Table, Query, Report, Form, SelectQuery, BackendConfig, TableNode, NODE_WIDTH, DbType, Relationship } from '../types/index';
import { ToastInfo } from '../components/Toast';
import { saveProjectToStorage, getAllProjects } from '../services/storageService';

export const useAppController = () => {
  // Use Zustand Store
  const store = useProjectStore();
  
  // UI State
  const [currentView, setCurrentView] = useState<ViewType>({ type: 'welcome' });
  const [activeTab, setActiveTab] = useState('create');
  const [activeObject, setActiveObject] = useState<Table | Query | Report | Form | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [savePrompt, setSavePrompt] = useState<{show: boolean, targetView?: ViewType}>({show: false});
  const [relationshipNodes, setRelationshipNodes] = useState<TableNode[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRibbonOpen, setIsRibbonOpen] = useState(true);
  
  // Feedback State
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // Modals State
  const [itemContextMenu, setItemContextMenu] = useState<{
    type: 'table' | 'query' | 'report' | 'form';
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [nameInput, setNameInput] = useState<{
    title: string; label: string; initialValue: string; onConfirm: (name: string) => void; onCancel: () => void;
  } | null>(null);
  const [showReportWizard, setShowReportWizard] = useState(false);
  const [showFormWizard, setShowFormWizard] = useState(false);
  const [activeWizard, setActiveWizard] = useState<'duplicate' | 'inconsistency' | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    title: string; message: string; onConfirm: () => void;
  } | null>(null);

  // Triggers
  const [formActionTrigger, setFormActionTrigger] = useState<{ action: string, timestamp: number } | undefined>(undefined);

  // Initialize Store Engine
  useEffect(() => {
      store.init();
  }, []);

  // Keyboard Shortcuts (Undo/Redo)
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.ctrlKey && e.key === 'z') {
              e.preventDefault();
              store.undo();
              addToast("Rückgängig gemacht");
          } else if (e.ctrlKey && e.key === 'y') {
              e.preventDefault();
              store.redo();
              addToast("Wiederhergestellt");
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync Relationship Nodes
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

  // Sync Active Object with View
  useEffect(() => {
    setIsDirty(false);
    if (currentView.type === 'table_create') {
      setActiveObject({ id: crypto.randomUUID(), name: 'NeueTabelle', fields: [{ id: crypto.randomUUID(), name: 'ID', type: 'INTEGER', isPrimaryKey: true }] });
      setIsDirty(true);
    } else if (currentView.type === 'table_edit' || currentView.type === 'table_data') {
      setActiveObject(store.tables.find(t => t.id === currentView.tableId) || null);
    } else if (currentView.type === 'query_results') {
      setActiveObject(store.queries.find(q => q.id === currentView.queryId) || null);
    } else if (currentView.type === 'report_view') {
      setActiveObject(store.reports.find(r => r.id === currentView.reportId) || null);
    } else if (currentView.type === 'report_designer') {
      setActiveObject(store.reports.find(r => r.id === currentView.reportId) || null);
    } else if (currentView.type === 'form_view') {
      setActiveObject(store.forms.find(f => f.id === currentView.formId) || null);
    } else if (currentView.type === 'form_designer') {
      setActiveObject(store.forms.find(f => f.id === currentView.formId) || null);
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
  }, [currentView, store.tables, store.queries, store.reports, store.forms]);

  // --- Actions ---

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleSetView = (view: ViewType) => {
    if (isDirty) setSavePrompt({ show: true, targetView: view });
    else setCurrentView(view);
  };

  const handleActiveObjectChange = (newObjectState: Table | Query | Report | Form) => {
    setActiveObject(newObjectState);
    if (!isDirty) setIsDirty(true);
  };

  const handleSave = (): Promise<{ success: boolean; savedObject?: Table | Query | Report | Form; wasNew?: boolean }> => {
    return new Promise(async (resolve) => {
        if (!activeObject) {
            // Persist to IndexedDB
            if (store.projectId) {
                await saveProjectToStorage({
                    id: store.projectId,
                    name: store.projectName,
                    lastModified: Date.now(),
                    data: {
                        tables: store.tables, queries: store.queries, reports: store.reports,
                        forms: store.forms, relationships: store.relationships, backendConfig: store.backendConfig
                    }
                });
                addToast('Gesamtes Projekt erfolgreich gespeichert.');
            }
            return resolve({ success: true });
        }

        // Form or Report
        if ('sourceType' in activeObject) {
             if ('layout' in activeObject) {
                 store.setForms(store.forms.map(f => f.id === activeObject.id ? activeObject as Form : f));
                 if(!store.forms.some(f => f.id === activeObject.id)) store.setForms([...store.forms, activeObject as Form]);
                 
                 setIsDirty(false);
                 addToast(`Formular "${activeObject.name}" gespeichert.`);
                 resolve({ success: true, savedObject: activeObject as Form, wasNew: false });
                 return;
             }
             if ('summaries' in activeObject) {
                 store.setReports(store.reports.map(r => r.id === activeObject.id ? activeObject as Report : r));
                 setIsDirty(false);
                 addToast(`Bericht "${activeObject.name}" gespeichert.`);
                 resolve({ success: true, savedObject: activeObject as Report, wasNew: false });
                 return;
             }
             return resolve({ success: false });
        }

        const finishSave = (objectToSave: Table | Query, wasNew: boolean) => {
            if ('fields' in objectToSave && !('nodes' in objectToSave)) {
                // Table
                if (wasNew) store.setTables([...store.tables, objectToSave as Table]);
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
                label: "Geben Sie einen Namen für die Abfrage ein:",
                initialValue: objectToSave.name,
                onConfirm: (name) => {
                    objectToSave.name = name;
                    objectToSave.id = crypto.randomUUID();
                    setNameInput(null);
                    finishSave(objectToSave as Query, true);
                },
                onCancel: () => {
                    setNameInput(null);
                    resolve({ success: false });
                }
            });
        } else {
            finishSave(objectToSave as Table | Query, wasNew);
        }
    });
  };

  const handleRibbonAction = async (action: string) => {
    if (action === 'backend_generate') {
        if (currentView.type !== 'backend_generator') handleSetView({ type: 'backend_generator' });
        setFormActionTrigger({ action, timestamp: Date.now() });
        addToast('Backend-Code wird generiert...', 'success');
        return;
    }
    if (action === 'backend_export') {
        setFormActionTrigger({ action, timestamp: Date.now() });
        return;
    }
    if (action.startsWith('form_') || action === 'export_form') {
        setFormActionTrigger({ action, timestamp: Date.now() });
        return;
    }

    switch(action) {
      case 'new_db':
        if(confirm("Möchten Sie zum Startbildschirm zurückkehren?")) {
            store.projectId = null; // Clear to trigger selector
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
      case 'relationships': handleSetView({ type: 'relationships' }); break;
      case 'save':
        await handleSave();
        break;
    }
  };

  const closeSavePrompt = async (action: 'yes' | 'no' | 'cancel') => {
    const targetView = savePrompt.targetView || { type: 'welcome' };
    setSavePrompt({ show: false });
    if (action === 'yes') {
      const { success } = await handleSave();
      if (success) setCurrentView(targetView);
    } else if (action === 'no') {
      setIsDirty(false);
      setCurrentView(targetView);
    }
  };

  const handleContextMenuAction = (action: 'view' | 'view_data' | 'export' | 'rename' | 'delete') => {
    if (!itemContextMenu) return;
    const { type, id } = itemContextMenu;
    setItemContextMenu(null);

    const allObjects = [...store.tables, ...store.queries, ...store.reports, ...store.forms];
    const getObject = () => allObjects.find(o => o.id === id);

    switch (action) {
      case 'view_data':
        if (type === 'table') handleSetView({ type: 'table_data', tableId: id });
        else if (type === 'query') handleSetView({ type: 'query_results', queryId: id });
        else if (type === 'form') handleSetView({ type: 'form_view', formId: id });
        else if (type === 'report') handleSetView({ type: 'report_view', reportId: id });
        break;
      case 'view':
        if (type === 'table') handleSetView({ type: 'table_edit', tableId: id });
        else if (type === 'query') handleSetView({ type: 'query_designer', queryId: id });
        else if (type === 'report') handleSetView({ type: 'report_designer', reportId: id });
        else if (type === 'form') handleSetView({ type: 'form_designer', formId: id });
        break;
      case 'rename':
        const currentObject = getObject();
        if (currentObject) {
          setNameInput({
            title: `"${currentObject.name}" umbenennen`,
            label: 'Neuer Name:',
            initialValue: currentObject.name,
            onConfirm: (newName) => {
              if (newName?.trim()) {
                if (type === 'table') store.updateTable({ ...getObject() as Table, name: newName });
                if (type === 'query') store.setQueries(store.queries.map(q => q.id === id ? { ...q, name: newName } : q));
                if (type === 'report') store.setReports(store.reports.map(r => r.id === id ? { ...r, name: newName } : r));
                if (type === 'form') store.setForms(store.forms.map(f => f.id === id ? { ...f, name: newName } : f));
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
          title: 'Löschen bestätigen',
          message: 'Möchten Sie dieses Objekt wirklich löschen?',
          onConfirm: () => {
             if (type === 'table') {
                 store.setTables(store.tables.filter(t => t.id !== id));
                 store.setRelationships(store.relationships.filter(r => r.fromTableId !== id && r.toTableId !== id));
             }
             if (type === 'query') store.setQueries(store.queries.filter(q => q.id !== id));
             if (type === 'report') store.setReports(store.reports.filter(r => r.id !== id));
             if (type === 'form') store.setForms(store.forms.filter(f => f.id !== id));
             
             if (activeObject?.id === id) handleSetView({ type: 'welcome' });
             addToast('Objekt gelöscht.');
          }
        });
        break;
      case 'export': alert('Export noch nicht implementiert.'); break;
    }
  };

  // Bridge for old DB interface parts
  const db = {
      ...store,
      currentProjectName: store.projectName,
      dbType: store.backendConfig?.dbType || DbType.SQL, // Fallback
      deleteRelationship: (id: string) => store.setRelationships(store.relationships.filter(r => r.id !== id)),
      updateRelationship: (rel: Relationship) => store.setRelationships(store.relationships.map(r => r.id === rel.id ? rel : r)),
      saveTable: (t: Table, m: any) => m === 'create' ? store.setTables([...store.tables, t]) : store.updateTable(t),
      saveForm: (f: Form) => store.setForms([...store.forms.filter(o => o.id !== f.id), f]),
      saveReport: (r: Report) => store.setReports([...store.reports.filter(o => o.id !== r.id), r]),
      saveQuery: (q: Query) => store.setQueries([...store.queries.filter(o => o.id !== q.id), q]),
      loadProject: store.loadProject,
      createNewDatabase: store.createNew,
      exportProject: async (conf: BackendConfig) => {
          // Export Logic (Keep existing file download logic)
          const dataStr = JSON.stringify({
              id: store.projectId, name: store.projectName, lastModified: Date.now(),
              data: { tables: store.tables, queries: store.queries, reports: store.reports, forms: store.forms, relationships: store.relationships, backendConfig: conf }
          }, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', `${store.projectName}.dbsp`);
          linkElement.click();
      }
  };

  return {
    db, 
    // State
    currentView, activeTab, setActiveTab, activeObject, isDirty, 
    relationshipNodes, isSidebarOpen, setIsSidebarOpen, isRibbonOpen, setIsRibbonOpen,
    backendConfig: store.backendConfig, setBackendConfig: store.setBackendConfig, formActionTrigger,
    // Feedback
    toasts, addToast, removeToast,
    // Modals
    savePrompt, itemContextMenu, setItemContextMenu, nameInput, setNameInput,
    showReportWizard, setShowReportWizard, showFormWizard, setShowFormWizard,
    activeWizard, setActiveWizard, confirmationModal, setConfirmationModal,
    // Handlers
    handleSetView, handleActiveObjectChange, handleSave, handleRibbonAction,
    closeSavePrompt, handleContextMenuAction, setRelationshipNodes
  };
};
