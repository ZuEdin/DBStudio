import React, { useState, useEffect } from 'react';
import { DbType, ViewType, Relationship, TableNode, NODE_WIDTH, Table, Query, Report, Form, SelectQuery } from './types/index';
import { Ribbon } from './components/Ribbon';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { useDatabase } from './hooks/useDatabase';
import { DatabaseSelector } from './views/DatabaseSelector';
import { SaveChangesModal } from './components/SaveChangesModal';
import { ItemContextMenu } from './components/ItemContextMenu';
import { InputModal } from './components/InputModal';
import { ReportWizardModal } from './views/report/ReportWizardModal';
import { FormWizardModal } from './views/form/FormWizardModal';
import { ConfirmationModal } from './components/ConfirmationModal';

export default function App() {
  const { 
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
  const [confirmationModal, setConfirmationModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);


  useEffect(() => {
    setRelationshipNodes(prevNodes => {
      const newNodes: TableNode[] = [];
      const existingNodesMap = new Map(prevNodes.map(n => [n.tableId, n]));
      
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
    } else if (currentView.type === 'form_view') {
      setActiveObject(forms.find(f => f.id === currentView.formId) || null);
    } else if (currentView.type === 'form_designer') {
      setActiveObject(forms.find(f => f.id === currentView.formId) || null);
    } else if (currentView.type === 'query_designer') {
      if (currentView.queryId) {
        setActiveObject(queries.find(q => q.id === currentView.queryId) || null);
      } else {
        // FIX: Add type: 'SELECT' to create a valid SelectQuery object.
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

  const handleSave = (): Promise<{ success: boolean; savedObject?: Table | Query; wasNew?: boolean }> => {
    return new Promise((resolve) => {
        if (!activeObject || ('sourceType' in activeObject)) return resolve({ success: false });

        const finishSave = (objectToSave: Table | Query, wasNew: boolean) => {
            if ('fields' in objectToSave && !('nodes' in objectToSave)) {
                saveTable(objectToSave as Table, wasNew ? 'create' : 'edit');
            } else { // Query
                saveQuery(objectToSave as Query);
            }
            setIsDirty(false);
            setActiveObject(objectToSave);
            resolve({ success: true, savedObject: objectToSave, wasNew });
        };

        let objectToSave = { ...activeObject };
        const wasNew = !objectToSave.id || ('fields' in objectToSave && !('nodes' in objectToSave) && !tables.some(t => t.id === objectToSave.id));

        if (wasNew && 'nodes' in objectToSave) { // New Query needs a name
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
    handleSetView({ type: 'report_view', reportId: report.id });
  };
  
  const handleSaveForm = (form: Form) => {
    saveForm(form);
    setShowFormWizard(false);
    handleSetView({ type: 'form_view', formId: form.id });
  };
  
  const handleRibbonAction = (action: string) => {
    switch(action) {
      case 'new_db':
        resetDatabase();
        break;
      case 'create_table_ai':
      case 'create_table':
        handleSetView({ type: 'table_create' }); 
        break;
      case 'create_query':
        handleSetView({ type: 'query_designer' });
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
        handleSave().then(({ success, savedObject, wasNew }) => {
            if (success && savedObject && wasNew) {
                if ('fields' in savedObject && !('nodes' in savedObject)) {
                    setCurrentView({ type: 'table_edit', tableId: (savedObject as Table).id });
                } else if ('nodes' in savedObject) {
                    setCurrentView({ type: 'query_designer', queryId: (savedObject as Query).id });
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
        break;
      case 'view':
        if (type === 'table') handleSetView({ type: 'table_edit', tableId: id });
        else if (type === 'query') handleSetView({ type: 'query_designer', queryId: id });
        else if (type === 'report') handleSetView({ type: 'report_view', reportId: id });
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
                else if (type === 'query') renameQuery(id, newName.trim());
                else if (type === 'report') renameReport(id, newName.trim());
                else if (type === 'form') renameForm(id, newName.trim());
              }
              setNameInput(null);
            },
            onCancel: () => setNameInput(null)
          });
        }
        break;

      case 'delete':
        const objectToDelete = getObject();
        if (objectToDelete) {
          showConfirmation(
            `'${objectToDelete.name}' löschen`,
            `Möchten Sie das Objekt '${objectToDelete.name}' wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
            () => {
              if (activeObject?.id === id) {
                setIsDirty(false);
                setCurrentView({ type: 'welcome' });
              }
              if (type === 'table') deleteTable(id);
              else if (type === 'query') deleteQuery(id);
              else if (type === 'report') deleteReport(id);
              else if (type === 'form') deleteForm(id);
            }
          );
        }
        break;

      case 'export':
        const objectToExport = getObject();
        if (objectToExport) {
          const dataStr = JSON.stringify(objectToExport, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
          const exportFileDefaultName = `${objectToExport.name}.json`;
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', exportFileDefaultName);
          linkElement.click();
        }
        break;
    }
  };

  if (!dbType) {
    return <DatabaseSelector onSelectDbType={createNewDatabase} />;
  }
  
  const getCanvasNodes = (): TableNode[] => {
    if (currentView.type === 'relationships') {
      return relationshipNodes;
    }
    if (currentView.type === 'query_designer' && activeObject && 'nodes' in activeObject) {
      return (activeObject as SelectQuery).nodes;
    }
    return [];
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 font-sans text-slate-900" onClick={closeItemContextMenu}>
      {savePrompt.show && activeObject && (
        <SaveChangesModal 
          objectType={('fields' in activeObject && !('nodes' in activeObject) && !('sourceType' in activeObject)) ? 'Tabelle' : 'Abfrage'}
          objectName={activeObject.name}
          onYes={() => closeSavePrompt('yes')}
          onNo={() => closeSavePrompt('no')}
          onCancel={() => closeSavePrompt('cancel')}
        />
      )}
       {itemContextMenu && (
        <ItemContextMenu
          x={itemContextMenu.x}
          y={itemContextMenu.y}
          itemType={itemContextMenu.type}
          onAction={handleContextMenuAction}
        />
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
      <Ribbon 
        onAction={handleRibbonAction} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        currentDbType={dbType}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          tables={tables} 
          queries={queries} 
          reports={reports}
          forms={forms}
          onSelectTable={(id) => handleSetView({ type: 'table_data', tableId: id })}
          onSelectQuery={(id) => handleSetView({ type: 'query_designer', queryId: id })}
          onSelectReport={(id) => handleSetView({ type: 'report_view', reportId: id })}
          onSelectForm={(id) => handleSetView({ type: 'form_view', formId: id })}
          onItemContextMenu={handleItemContextMenu}
        />

        <Workspace
          currentView={currentView}
          tables={tables}
          queries={queries}
          reports={reports}
          forms={forms}
          canvasNodes={getCanvasNodes()}
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
          executeQuery={executeQuery}
          saveTable={saveTable}
          saveForm={saveForm}
          showConfirmation={showConfirmation}
        />
      </div>
    </div>
  );
}