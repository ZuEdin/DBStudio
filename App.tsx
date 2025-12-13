
import React, { useState, useEffect } from 'react';
import { DbType, ViewType, Relationship, TableNode, NODE_WIDTH, Table, Query, Report, Form, SelectQuery, BackendConfig } from './types/index';
import { Ribbon } from './components/Ribbon';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { StatusBar } from './components/StatusBar';
import { useDatabase } from './hooks/useDatabase';
import { DatabaseSelector } from './views/DatabaseSelector'; // Now actually ProjectSelector
import { SaveChangesModal } from './components/SaveChangesModal';
import { ItemContextMenu } from './components/ItemContextMenu';
import { InputModal } from './components/InputModal';
import { ReportWizardModal } from './features/reports/ReportWizardModal';
import { FormWizardModal } from './features/forms/FormWizardModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { DuplicateWizard, InconsistencyWizard } from './features/queries/wizards/QueryWizards';

export default function App() {
  const { 
    currentProjectId,
    currentProjectName,
    loadedBackendConfig,
    dbType, 
    tables, 
    queries, 
    reports, 
    forms,
    relationships, 
    setRelationships, 
    saveTable, 
    saveQuery, 
    saveReport, 
    saveForm,
    createNewDatabase,
    loadProject,
    persistProject,
    resetDatabase,
    deleteRelationship,
    updateRelationship,
    renameTable,
    renameQuery,
    renameReport,
    renameForm,
    deleteTable,
    deleteQuery,
    deleteReport,
    deleteForm,
    executeQuery,
    exportProject
  } = useDatabase();

  const [currentView, setCurrentView] = useState<ViewType>({ type: 'welcome' });
  const [activeTab, setActiveTab] = useState('create');
  
  const [activeObject, setActiveObject] = useState<Table | Query | Report | Form | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [savePrompt, setSavePrompt] = useState<{show: boolean, targetView?: ViewType}>({show: false});
  const [relationshipNodes, setRelationshipNodes] = useState<TableNode[]>([]);
  const [itemContextMenu, setItemContextMenu] = useState<{
    type: 'table' | 'query' | 'report' | 'form';
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [nameInput, setNameInput] = useState<{
    title: string;
    label: string;
    initialValue: string;
    onConfirm: (name: string) => void;
    onCancel: () => void;
  } | null>(null);
  const [showReportWizard, setShowReportWizard] = useState(false);
  const [showFormWizard, setShowFormWizard] = useState(false);
  
  const [activeWizard, setActiveWizard] = useState<'duplicate' | 'inconsistency' | null>(null);

  const [confirmationModal, setConfirmationModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Trigger state for form actions from ribbon
  const [formActionTrigger, setFormActionTrigger] = useState<{ action: string, timestamp: number } | undefined>(undefined);

  // Backend Configuration State
  const [backendConfig, setBackendConfig] = useState<BackendConfig>({
    language: 'dotnet',
    dbType: DbType.SQL, // Default
    projectName: 'MyApiProject',
    port: 5000,
    dbConnection: 'Server=.;Database=MyDb;Trusted_Connection=True;',
    useSwagger: true,
    frontendFramework: 'angular'
  });

  // Sync loaded project config to local state
  useEffect(() => {
      if (loadedBackendConfig) {
          setBackendConfig(loadedBackendConfig);
      } else if (dbType) {
          // Default init if new
          setBackendConfig(prev => ({
            ...prev,
            dbType: dbType,
            projectName: currentProjectName.replace(/\s+/g, '') || 'MyProject',
            // Set reasonable default connection strings
            dbConnection: dbType === DbType.SQLite ? 'Data Source=app.db' 
                        : dbType === DbType.MySQL ? 'Server=localhost;Database=mydb;User=root;Password=password;'
                        : 'Server=.;Database=MyDb;Trusted_Connection=True;TrustServerCertificate=True;'
        }));
      }
  }, [loadedBackendConfig, dbType, currentProjectName]);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRibbonOpen, setIsRibbonOpen] = useState(true);

  useEffect(() => {
    setRelationshipNodes((prevNodes: TableNode[]) => {
      const newNodes: TableNode[] = [];
      const existingNodesMap = new Map<string, TableNode>();
      prevNodes.forEach(n => existingNodesMap.set(n.tableId, n));
      
      tables.forEach((table, i) => {
        const existingNode = existingNodesMap.get(table.id);
        if (existingNode) {
          newNodes.push(existingNode);
        } else {
          newNodes.push({
            id: `rel_node_${table.id}`,
            tableId: table.id,
            x: 50 + (i * (NODE_WIDTH + 50)),
            y: 50
          });
        }
      });

      const tableIds = new Set(tables.map(t => t.id));
      return newNodes.filter(n => tableIds.has(n.tableId));
    });
  }, [tables]);

  useEffect(() => {
    setIsDirty(false);
    if (currentView.type === 'table_create') {
      setActiveObject({ id: crypto.randomUUID(), name: 'NeueTabelle', fields: [{ id: crypto.randomUUID(), name: 'ID', type: 'INTEGER', isPrimaryKey: true }] });
      setIsDirty(true);
    } else if (currentView.type === 'table_edit' || currentView.type === 'table_data') {
      setActiveObject(tables.find(t => t.id === currentView.tableId) || null);
    } else if (currentView.type === 'query_results') {
      setActiveObject(queries.find(q => q.id === currentView.queryId) || null);
    } else if (currentView.type === 'report_view') {
      setActiveObject(reports.find(r => r.id === currentView.reportId) || null);
    } else if (currentView.type === 'report_designer') {
      setActiveObject(reports.find(r => r.id === currentView.reportId) || null);
    } else if (currentView.type === 'form_view') {
      setActiveObject(forms.find(f => f.id === currentView.formId) || null);
    } else if (currentView.type === 'form_designer') {
      setActiveObject(forms.find(f => f.id === currentView.formId) || null);
    } else if (currentView.type === 'query_designer') {
      if (currentView.queryId) {
        setActiveObject(queries.find(q => q.id === currentView.queryId) || null);
      } else {
        setActiveObject({ id: '', type: 'SELECT', name: 'NeueAbfrage', nodes: [], columns: [] } as SelectQuery);
        setIsDirty(true);
      }
    } else {
      setActiveObject(null);
    }
  }, [currentView, tables, queries, reports, forms]);
  
  const handleSetView = (view: ViewType) => {
    if (isDirty) {
      setSavePrompt({ show: true, targetView: view });
    } else {
      setCurrentView(view);
    }
  };

  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmationModal({ title, message, onConfirm });
  };

  const handleActiveObjectChange = (newObjectState: Table | Query | Report | Form) => {
    setActiveObject(newObjectState);
    if (!isDirty) setIsDirty(true);
  };

  // Central save logic for open objects
  const handleSave = (): Promise<{ success: boolean; savedObject?: Table | Query | Report | Form; wasNew?: boolean }> => {
    return new Promise(async (resolve) => {
        if (!activeObject) {
            // If nothing open, clicking save on Ribbon persists the whole project to IndexedDB
            await persistProject(backendConfig);
            alert('Projekt gespeichert.');
            return resolve({ success: true });
        }

        // Logic for saving specific open objects (Tables, Queries, etc.)
        // Note: These saves only update React State. 
        // We trigger a project persist afterwards to be safe.

        if ('sourceType' in activeObject) {
             if (activeObject && 'layout' in activeObject) {
                 saveForm(activeObject as Form);
                 setIsDirty(false);
                 resolve({ success: true, savedObject: activeObject as Form, wasNew: false });
                 return;
             }
             if (activeObject && ('summaries' in activeObject)) {
                 saveReport(activeObject as Report);
                 setIsDirty(false);
                 resolve({ success: true, savedObject: activeObject as Report, wasNew: false });
                 return;
             }
             return resolve({ success: false });
        }

        const finishSave = (objectToSave: Table | Query, wasNew: boolean) => {
            if ('fields' in objectToSave && !('nodes' in objectToSave)) {
                saveTable(objectToSave as Table, wasNew ? 'create' : 'edit');
            } else {
                saveQuery(objectToSave as Query);
            }
            setIsDirty(false);
            setActiveObject(objectToSave);
            resolve({ success: true, savedObject: objectToSave, wasNew });
        };

        let objectToSave = { ...activeObject };
        const wasNew = !objectToSave.id || ('fields' in objectToSave && !('nodes' in objectToSave) && !tables.some(t => t.id === objectToSave.id));

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

  const handleSaveReport = (report: Report) => {
    saveReport(report);
    setShowReportWizard(false);
    handleSetView({ type: 'report_designer', reportId: report.id });
  };
  
  const handleSaveForm = (form: Form) => {
    saveForm(form);
    setShowFormWizard(false);
    handleSetView({ type: 'form_designer', formId: form.id });
  };

  const handleSaveWizardQuery = (query: SelectQuery) => {
    saveQuery(query);
    setActiveWizard(null);
    handleSetView({ type: 'query_designer', queryId: query.id });
  };
  
  const handleRibbonAction = async (action: string) => {
    if (action === 'backend_generate' || action === 'backend_export') {
        if (currentView.type !== 'backend_generator') {
            handleSetView({ type: 'backend_generator' });
        }
        setFormActionTrigger({ action, timestamp: Date.now() });
        return;
    }

    if (action.startsWith('form_') || action === 'export_form') {
        setFormActionTrigger({ action, timestamp: Date.now() });
        return;
    }

    switch(action) {
      case 'new_db':
        if(confirm("Möchten Sie zum Startbildschirm zurückkehren? Ungespeicherte Änderungen gehen verloren.")) {
            resetDatabase();
        }
        break;
      case 'create_table_ai':
      case 'create_table':
        handleSetView({ type: 'table_create' }); 
        break;
      case 'create_query':
        handleSetView({ type: 'query_designer' });
        break;
      case 'wizard_duplicate':
        setActiveWizard('duplicate');
        break;
      case 'wizard_inconsistency':
        setActiveWizard('inconsistency');
        break;
      case 'create_report':
        setShowReportWizard(true);
        break;
       case 'create_form':
        setShowFormWizard(true);
        break;
      case 'relationships':
        handleSetView({ type: 'relationships' });
        break;
      case 'save':
        await handleSave().then(async ({ success, savedObject, wasNew }) => {
            if (success) {
                // Also persist whole project to IndexedDB when explicitly saving
                await persistProject(backendConfig); 
                
                if (savedObject && wasNew) {
                    if ('fields' in savedObject && !('nodes' in savedObject)) {
                        setCurrentView({ type: 'table_edit', tableId: (savedObject as Table).id });
                    } else if ('nodes' in savedObject) {
                        setCurrentView({ type: 'query_designer', queryId: (savedObject as Query).id });
                    }
                }
            }
        });
        break;
    }
  };

  const closeSavePrompt = async (action: 'yes' | 'no' | 'cancel') => {
    const targetView = savePrompt.targetView || { type: 'welcome' };
    setSavePrompt({ show: false });
    
    if (action === 'yes') {
      const { success } = await handleSave();
      if (success) {
        setCurrentView(targetView);
      }
    } else if (action === 'no') {
      setIsDirty(false);
      setCurrentView(targetView);
    }
  };

  const handleMoveRelationshipNode = (id: string, x: number, y: number) => {
    setRelationshipNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  };
  
  const handleItemContextMenu = (e: React.MouseEvent, type: 'table' | 'query' | 'report' | 'form', id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setItemContextMenu({ type, id, x: e.clientX, y: e.clientY });
  };
  
  const closeItemContextMenu = () => setItemContextMenu(null);

  const handleContextMenuAction = (action: 'view' | 'view_data' | 'export' | 'rename' | 'delete') => {
    if (!itemContextMenu) return;
    const { type, id } = itemContextMenu;
    closeItemContextMenu();

    const allObjects = [...tables, ...queries, ...reports, ...forms];
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
              if (newName && newName.trim() !== '') {
                if (type === 'table') renameTable(id, newName.trim());
                if (type === 'query') renameQuery(id, newName.trim());
                if (type === 'report') renameReport(id, newName.trim());
                if (type === 'form') renameForm(id, newName.trim());
              }
              setNameInput(null);
            },
            onCancel: () => setNameInput(null)
          });
        }
        break;

      case 'delete':
        showConfirmation(
          'Löschen bestätigen',
          'Möchten Sie dieses Objekt wirklich löschen?',
          () => {
             if (type === 'table') deleteTable(id);
             if (type === 'query') deleteQuery(id);
             if (type === 'report') deleteReport(id);
             if (type === 'form') deleteForm(id);
             if (activeObject?.id === id) handleSetView({ type: 'welcome' });
          }
        );
        break;
        
      case 'export':
        alert('Export noch nicht implementiert.');
        break;
    }
  };

  // If no project selected (no DB Type), show Project Selector
  if (!dbType) {
    return <DatabaseSelector 
      onSelectProject={loadProject} 
      onCreateNew={(t, n, d) => createNewDatabase(t, n, d)} 
    />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden text-sm bg-slate-100 font-sans">
      <div className="bg-slate-800 text-white text-xs px-2 py-1 flex justify-between items-center select-none">
          <span>DB Studio Pro - {currentProjectName}</span>
          <button onClick={() => exportProject(backendConfig)} className="hover:text-blue-300">Sicherung erstellen (.dbsp)</button>
      </div>
      <Ribbon 
        onAction={handleRibbonAction} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        currentDbType={dbType}
        currentView={currentView}
        isOpen={isRibbonOpen}
        toggleRibbon={() => setIsRibbonOpen(!isRibbonOpen)}
        backendConfig={backendConfig}
        setBackendConfig={setBackendConfig}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          tables={tables} 
          queries={queries} 
          reports={reports} 
          forms={forms}
          onSelectTable={(id) => handleSetView({ type: 'table_data', tableId: id })}
          onSelectQuery={(id) => handleSetView({ type: 'query_results', queryId: id })}
          onSelectReport={(id) => handleSetView({ type: 'report_view', reportId: id })}
          onSelectForm={(id) => handleSetView({ type: 'form_view', formId: id })}
          onItemContextMenu={handleItemContextMenu}
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <Workspace 
            currentView={currentView}
            tables={tables}
            queries={queries}
            reports={reports}
            forms={forms}
            canvasNodes={relationshipNodes}
            relationships={relationships}
            activeObject={activeObject}
            isDirty={isDirty}
            onSetView={handleSetView}
            onActiveObjectChange={handleActiveObjectChange}
            onSave={handleSave}
            onDeleteRelationship={deleteRelationship}
            onUpdateRelationship={updateRelationship}
            onMoveRelationshipNode={handleMoveRelationshipNode}
            setRelationships={setRelationships}
            executeQuery={(q) => executeQuery(q)}
            saveTable={(t, m) => saveTable(t, m)}
            saveForm={saveForm}
            showConfirmation={showConfirmation}
            formActionTrigger={formActionTrigger}
            backendConfig={backendConfig}
          />
        </div>
      </div>

      <StatusBar currentView={currentView} activeObject={activeObject} onSetView={handleSetView} />
      
      {/* Modals */}
      {savePrompt.show && (
        <SaveChangesModal 
          objectType={activeObject && 'fields' in activeObject ? 'Tabelle' : 'Abfrage'}
          objectName={activeObject?.name || 'Unbenannt'}
          onYes={() => closeSavePrompt('yes')}
          onNo={() => closeSavePrompt('no')}
          onCancel={() => closeSavePrompt('cancel')}
        />
      )}
      
      {itemContextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeItemContextMenu}></div>
          <ItemContextMenu 
            x={itemContextMenu.x} 
            y={itemContextMenu.y} 
            itemType={itemContextMenu.type}
            onAction={handleContextMenuAction}
          />
        </>
      )}

      {nameInput && (
        <InputModal 
          title={nameInput.title}
          label={nameInput.label}
          initialValue={nameInput.initialValue}
          onConfirm={nameInput.onConfirm}
          onCancel={nameInput.onCancel}
        />
      )}

      {showReportWizard && (
        <ReportWizardModal 
          tables={tables} 
          queries={queries} 
          onSave={handleSaveReport}
          onClose={() => setShowReportWizard(false)} 
        />
      )}
      
      {showFormWizard && (
        <FormWizardModal
          tables={tables}
          queries={queries}
          onSave={handleSaveForm}
          onClose={() => setShowFormWizard(false)}
        />
      )}

      {activeWizard === 'duplicate' && <DuplicateWizard tables={tables} onSave={handleSaveWizardQuery} onClose={() => setActiveWizard(null)} />}
      {activeWizard === 'inconsistency' && <InconsistencyWizard tables={tables} onSave={handleSaveWizardQuery} onClose={() => setActiveWizard(null)} />}

      {confirmationModal && (
        <ConfirmationModal 
          title={confirmationModal.title}
          message={confirmationModal.message}
          onConfirm={() => {
            confirmationModal.onConfirm();
            setConfirmationModal(null);
          }}
          onCancel={() => setConfirmationModal(null)}
        />
      )}
    </div>
  );
}
