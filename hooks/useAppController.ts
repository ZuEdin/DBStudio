
import { useState, useEffect } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import { ViewType, Table, Query, Report, Form, SelectQuery, BackendConfig, TableNode, NODE_WIDTH, DbType, Relationship, Chart, ElectronSettings, MessageModalConfig, DeploymentConfig, Workflow, EnvironmentConfig, WhitelabelConfig, MultiTenancyConfig, LicensingConfig, Project, LockInfo } from '../types/index';
import { ToastInfo } from '../components/Toast';
import { saveProjectToStorage, getAllProjects } from '../services/storageService';
import { Criterion } from '../features/queries/wizards/DeleteQueryWizard';
import { cloudService } from '../services/cloudService'; // Import Cloud Service

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
  const [showExcelWizard, setShowExcelWizard] = useState(false);
  const [showElectronSettings, setShowElectronSettings] = useState(false);
  const [showSecurityManager, setShowSecurityManager] = useState(false);
  const [showWhitelabelModal, setShowWhitelabelModal] = useState(false);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);

  const [activeWizard, setActiveWizard] = useState<'duplicate' | 'inconsistency' | 'append' | 'delete' | null>(null);
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

  const addToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => { setToasts(prev => prev.filter(t => t.id !== id)); };

  const showMessage = (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
      setMessageModal({ title, message, type });
  };

  // --- LOCKING LOGIC ---
  const releaseCurrentLock = async () => {
      if (activeLock) {
          await cloudService.releaseLock(activeLock.objectId, 'u1'); // 'u1' is current user mock
          setActiveLock(null);
      }
      setReadOnlyMode(false);
  };

  const handleSetView = async (view: ViewType) => {
    // 1. Release old lock if moving away
    await releaseCurrentLock();

    // 2. Check for Dirty State
    if (isDirty) {
        setSavePrompt({ show: true, targetView: view });
        return;
    }

    // 3. Try Acquire Lock for new View (if it's an Edit View)
    let objectIdToLock = '';
    if (view.type === 'table_edit') objectIdToLock = view.tableId;
    if (view.type === 'table_edit' && store.tables.find(t => t.id === view.tableId)?.name === 'sys_users') objectIdToLock = 'sys_users'; // Hack for mock to match by ID or Name logic

    if (objectIdToLock) {
        const existingLock = await cloudService.checkLock(objectIdToLock);
        if (existingLock) {
            // Locked by someone else
            setReadOnlyMode(true);
            setActiveLock(existingLock); // Store info to display banner
            addToast(`Gesperrt durch ${existingLock.userName}. Schreibgeschützt.`, 'warning');
        } else {
            // Try to lock for me
            const success = await cloudService.acquireLock(objectIdToLock, 'u1', 'Du (Max)');
            if (success) {
                setActiveLock({ objectId: objectIdToLock, userId: 'u1', userName: 'Du (Max)', lockedAt: Date.now() });
            }
        }
    }

    setCurrentView(view);
  };

  const handleActiveObjectChange = (newObjectState: Table | Query | Report | Form | Chart | Workflow) => {
    if (readOnlyMode) {
        addToast("Änderungen nicht möglich: Objekt ist durch einen anderen Benutzer gesperrt.", 'error');
        return;
    }
    setActiveObject(newObjectState);
    if (!isDirty) setIsDirty(true);
  };

  const handleSave = (): Promise<{ success: boolean; savedObject?: Table | Query | Report | Form | Chart | Workflow; wasNew?: boolean }> => {
    return new Promise(async (resolve) => {
      if (readOnlyMode) {
          showMessage("Fehler", "Speichern nicht möglich, da das Objekt schreibgeschützt ist.", 'error');
          return resolve({ success: false });
      }

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

        // Charts, Workflows, Forms, Reports...
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
                if (wasNew) store.addTable(objectToSave as Table); 
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
            if(confirm("Zum Startbildschirm?")) { store.closeProject(); setCurrentView({ type: 'welcome' }); } break;
        case 'create_table_ai':
        case 'create_table': handleSetView({ type: 'table_create' }); break;
        case 'create_query': handleSetView({ type: 'query_designer' }); break;
        case 'wizard_duplicate': setActiveWizard('duplicate'); break;
        case 'wizard_inconsistency': setActiveWizard('inconsistency'); break;
        case 'wizard_append': setActiveWizard('append'); break;
        case 'wizard_delete': setActiveWizard('delete'); break; // NEW Action
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
            const newWorkflow: Workflow = { id: crypto.randomUUID(), name: 'Neuer Workflow', active: true, nodes: [], edges: [] };
            store.setWorkflows([...(store.workflows || []), newWorkflow]);
            handleSetView({ type: 'workflow_designer', workflowId: newWorkflow.id });
            break;
        case 'relationships': handleSetView({ type: 'relationships' }); break;
        case 'api_import': handleSetView({ type: 'api_import' }); break;
        case 'import_excel': setShowExcelWizard(true); break;
        case 'save': await handleSave(); break;
        case 'electron_settings': setShowElectronSettings(true); break;
        case 'security_manager': setShowSecurityManager(true); break;
        case 'open_app_info': handleSetView({ type: 'app_info' }); break;
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
    if (action === 'yes') { const { success } = await handleSave(); if (success) handleSetView(targetView); } 
    else if (action === 'no') { setIsDirty(false); handleSetView(targetView); }
  };

  const handleExecuteAppend = (sourceTable: Table, targetTable: Table, map: Record<string, string>) => {
      try {
          const sourceData = sourceTable.data || [];
          const targetData = [...(targetTable.data || [])];
          let addedCount = 0;

          // Find AutoInc fields in target to handle IDs manually if needed (local simulation)
          const autoIncFields = targetTable.fields.filter(f => f.isAutoIncrement && f.type === 'INTEGER');
          const nextAutoIncValues: Record<string, number> = {};
          
          if (autoIncFields.length > 0) {
              autoIncFields.forEach(f => {
                  const maxVal = targetData.reduce((max, row) => {
                      const val = parseInt(row[f.name], 10);
                      return !isNaN(val) && val > max ? val : max;
                  }, 0);
                  nextAutoIncValues[f.name] = maxVal + 1;
              });
          }

          sourceData.forEach(sourceRow => {
              const newRow: any = {};
              Object.entries(map).forEach(([targetFieldId, sourceFieldId]) => {
                  if (!sourceFieldId) return; 
                  const targetField = targetTable.fields.find(f => f.id === targetFieldId);
                  const sourceField = sourceTable.fields.find(f => f.id === sourceFieldId);
                  if (targetField && sourceField) newRow[targetField.name] = sourceRow[sourceField.name];
              });

              autoIncFields.forEach(f => {
                  if (newRow[f.name] === undefined || newRow[f.name] === null) {
                      newRow[f.name] = nextAutoIncValues[f.name];
                      nextAutoIncValues[f.name]++;
                  }
              });

              targetTable.fields.forEach(f => {
                  if (newRow[f.name] === undefined && f.defaultValue !== undefined && !f.isAutoIncrement) {
                      newRow[f.name] = f.defaultValue;
                  }
              });

              targetData.push(newRow);
              addedCount++;
          });

          store.updateTable({ ...targetTable, data: targetData });
          showMessage("Erfolg", `${addedCount} Datensätze wurden von "${sourceTable.name}" nach "${targetTable.name}" kopiert.`, 'success');
      } catch (e: any) {
          showMessage("Fehler bei Anfügeabfrage", e.message, 'error');
      }
  };

  const handleExecuteDelete = (table: Table, criteria: Criterion[]) => {
      try {
          if (!table.data) return;
          const originalCount = table.data.length;
          
          const newData = table.data.filter(row => {
              // Keep row if it DOES NOT match ALL criteria (Delete logic is "Delete WHERE...")
              // If criteria match, we delete -> so we filter OUT.
              
              // If no criteria, delete all -> filter keeps nothing (false)
              if (criteria.length === 0) return false;

              const matchesAll = criteria.every(crit => {
                  const field = table.fields.find(f => f.id === crit.fieldId);
                  if (!field) return false;
                  
                  const rowVal = row[field.name];
                  const critVal = crit.value;
                  const v1 = isNaN(Number(rowVal)) ? String(rowVal).toLowerCase() : Number(rowVal);
                  const v2 = isNaN(Number(critVal)) ? String(critVal).toLowerCase() : Number(critVal);

                  switch (crit.operator) {
                      case '=': return v1 == v2;
                      case '!=': return v1 != v2;
                      case '>': return v1 > v2;
                      case '<': return v1 < v2;
                      case '>=': return v1 >= v2;
                      case '<=': return v1 <= v2;
                      case 'contains': return String(v1).includes(String(v2));
                      default: return false;
                  }
              });
              
              return !matchesAll; // Keep if NOT matches all
          });

          const deletedCount = originalCount - newData.length;
          store.updateTable({ ...table, data: newData });
          showMessage("Löschung erfolgreich", `${deletedCount} Datensätze wurden aus "${table.name}" entfernt.`, 'success');
      } catch (e: any) {
          showMessage("Fehler bei Löschabfrage", e.message, 'error');
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

  const handleSnapshot = () => { store.snapshot(); };

  const handleUpdateEnvironments = (envs: EnvironmentConfig[]) => {
      if (store.backendConfig) store.setBackendConfig({ ...store.backendConfig, environments: envs });
  };

  const handleUpdateCommercial = (whitelabel: WhitelabelConfig, multiTenancy: MultiTenancyConfig, licensing: LicensingConfig) => {
      if (store.backendConfig) store.setBackendConfig({ ...store.backendConfig, whitelabel, multiTenancy, licensing });
  };

  const handleSaveElectronSettings = (newSettings: ElectronSettings) => {
      if (store.backendConfig) {
          store.setBackendConfig({ ...store.backendConfig, electronSettings: newSettings });
          addToast("Electron Konfiguration gespeichert.");
      }
  };

  const handleContextMenuAction = (action: 'view' | 'view_data' | 'export' | 'rename' | 'delete') => {
    if (!itemContextMenu) return;
    const { type, id } = itemContextMenu;
    
    setItemContextMenu(null);

    let object: any = null;
    if (type === 'table') object = store.tables.find(t => t.id === id);
    else if (type === 'query') object = store.queries.find(q => q.id === id);
    else if (type === 'report') object = store.reports.find(r => r.id === id);
    else if (type === 'form') object = store.forms.find(f => f.id === id);
    else if (type === 'chart') object = store.charts?.find(c => c.id === id);
    else if (type === 'workflow') object = store.workflows?.find(w => w.id === id);

    if (!object) return;

    if (action === 'view') {
        if (type === 'table') handleSetView({ type: 'table_edit', tableId: id });
        else if (type === 'query') handleSetView({ type: 'query_designer', queryId: id });
        else if (type === 'report') handleSetView({ type: 'report_designer', reportId: id });
        else if (type === 'form') handleSetView({ type: 'form_designer', formId: id });
        else if (type === 'chart') handleSetView({ type: 'chart_view', chartId: id });
        else if (type === 'workflow') handleSetView({ type: 'workflow_designer', workflowId: id });
    } else if (action === 'view_data') {
        if (type === 'table') handleSetView({ type: 'table_data', tableId: id });
        else if (type === 'query') handleSetView({ type: 'query_results', queryId: id });
        else if (type === 'form') handleSetView({ type: 'form_view', formId: id });
        else if (type === 'report') handleSetView({ type: 'report_view', reportId: id });
    } else if (action === 'export') {
        const dataStr = JSON.stringify(object, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `${object.name}.json`);
        linkElement.click();
    } else if (action === 'rename') {
        setNameInput({
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} umbenennen`,
            label: 'Neuer Name',
            initialValue: object.name,
            onConfirm: (newName) => {
                if (type === 'table') store.updateTable({ ...object, name: newName });
                else if (type === 'query') store.setQueries(store.queries.map(q => q.id === id ? { ...q, name: newName } : q));
                else if (type === 'report') store.setReports(store.reports.map(r => r.id === id ? { ...r, name: newName } : r));
                else if (type === 'form') store.setForms(store.forms.map(f => f.id === id ? { ...f, name: newName } : f));
                else if (type === 'chart') store.setCharts(store.charts?.map(c => c.id === id ? { ...c, name: newName } : c) || []);
                else if (type === 'workflow') store.setWorkflows(store.workflows?.map(w => w.id === id ? { ...w, name: newName } : w) || []);
                setNameInput(null);
            },
            onCancel: () => setNameInput(null)
        });
    } else if (action === 'delete') {
        setConfirmationModal({
            title: 'Löschen bestätigen',
            message: `Möchten Sie "${object.name}" wirklich löschen?`,
            onConfirm: () => {
                if (type === 'table') {
                    store.setTables(store.tables.filter(t => t.id !== id));
                    store.setRelationships(store.relationships.filter(r => r.fromTableId !== id && r.toTableId !== id));
                } else if (type === 'query') {
                    store.setQueries(store.queries.filter(q => q.id !== id));
                } else if (type === 'report') {
                    store.setReports(store.reports.filter(r => r.id !== id));
                } else if (type === 'form') {
                    store.setForms(store.forms.filter(f => f.id !== id));
                } else if (type === 'chart') {
                    store.setCharts(store.charts?.filter(c => c.id !== id) || []);
                } else if (type === 'workflow') {
                    store.setWorkflows(store.workflows?.filter(w => w.id !== id) || []);
                }
                if (activeObject?.id === id) handleSetView({ type: 'welcome' });
                addToast("Gelöscht");
            }
        });
    }
  };

  // Wrapper object for legacy compatibility with App.tsx which expects a 'db' object
  const db = {
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
    
    saveTable: (t: Table, mode: 'create' | 'edit') => mode === 'create' ? store.addTable(t) : store.updateTable(t),
    saveQuery: (q: Query) => store.setQueries(store.queries.some(x => x.id === q.id) ? store.queries.map(x => x.id === q.id ? q : x) : [...store.queries, q]),
    saveReport: (r: Report) => store.setReports(store.reports.some(x => x.id === r.id) ? store.reports.map(x => x.id === r.id ? r : x) : [...store.reports, r]),
    saveForm: (f: Form) => store.setForms(store.forms.some(x => x.id === f.id) ? store.forms.map(x => x.id === f.id ? f : x) : [...store.forms, f]),
    saveWorkflow: (w: Workflow) => store.setWorkflows(store.workflows?.some(x => x.id === w.id) ? store.workflows.map(x => x.id === w.id ? w : x) : [...(store.workflows || []), w]),
    
    deleteRelationship: (id: string) => store.setRelationships(store.relationships.filter(r => r.id !== id)),
    updateRelationship: (rel: Relationship) => store.setRelationships(store.relationships.map(r => r.id === rel.id ? rel : r)),
    setRelationships: store.setRelationships,
    
    executeQuery: store.executeQuery,
    exportProject: async (backendConfig: BackendConfig) => {
        if (!store.projectId) return;
        const project: Project = {
            id: store.projectId,
            name: store.projectName,
            lastModified: Date.now(),
            data: {
                tables: store.tables, queries: store.queries, reports: store.reports,
                forms: store.forms, charts: store.charts, workflows: store.workflows,
                relationships: store.relationships, backendConfig, lastSnapshot: store.lastSnapshot
            }
        };
        const dataStr = JSON.stringify(project, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `${store.projectName}.dbsp`);
        linkElement.click();
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
    showExcelWizard, setShowExcelWizard,

    activeWizard, setActiveWizard, onSaveWizardQuery: (q) => { store.setQueries([...store.queries, q]); setActiveWizard(null); handleSetView({type: 'query_designer', queryId: q.id}); },
    onExecuteAppend: handleExecuteAppend, 
    onExecuteDelete: handleExecuteDelete, // Pass handler

    confirmationModal, setConfirmationModal,
    handleSetView, handleActiveObjectChange, handleSave, handleRibbonAction,
    closeSavePrompt, handleContextMenuAction, setRelationshipNodes,
    messageModal, showMessage, closeMessage: () => setMessageModal(null),
    
    onSnapshot: handleSnapshot,
    onUpdateEnvironments: handleUpdateEnvironments,
    onUpdateCommercial: handleUpdateCommercial,
    lastSnapshot: store.lastSnapshot,

    activeLock // Expose lock to view
  };
};
