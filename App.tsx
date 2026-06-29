
import React from 'react';
import { Ribbon } from './components/Ribbon';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { StatusBar } from './components/StatusBar';
import { DatabaseSelector } from './features/backend/DatabaseSelector';
import { AppHeader } from './components/AppHeader';
import { ModalLayer } from './components/ModalLayer';
import { ToastContainer } from './components/Toast';
import { ChatPanel } from './components/ChatPanel'; // Import ChatPanel
import { useAppController } from './hooks/useAppController';

export default function App() {
  const app = useAppController();
  const { db } = app;

  if (!db.projectId) {
    return <DatabaseSelector 
      onSelectProject={db.loadProject} 
      onCreateNew={(t, n, c, d) => db.createNewDatabase(t, n, c, d)} 
    />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden text-sm bg-slate-100 font-sans">
      <AppHeader 
        projectName={db.currentProjectName} 
        backendConfig={app.backendConfig} 
        onExport={db.exportProject} 
        onToggleChat={() => app.setIsChatOpen(!app.isChatOpen)}
        isChatOpen={app.isChatOpen}
      />
      
      <Ribbon 
        onAction={app.handleRibbonAction} 
        activeTab={app.activeTab} 
        setActiveTab={app.setActiveTab}
        currentDbType={db.dbType}
        currentView={app.currentView}
        isOpen={app.isRibbonOpen}
        toggleRibbon={() => app.setIsRibbonOpen(!app.isRibbonOpen)}
        backendConfig={app.backendConfig}
        setBackendConfig={app.setBackendConfig}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          tables={db.tables} 
          queries={db.queries} 
          reports={db.reports} 
          forms={db.forms}
          workflows={db.workflows}
          pages={db.pages}
          onSelectTable={(id) => app.handleSetView({ type: 'table_data', tableId: id })}
          onSelectQuery={(id) => app.handleSetView({ type: 'query_results', queryId: id })}
          onSelectReport={(id) => app.handleSetView({ type: 'report_view', reportId: id })}
          onSelectForm={(id) => app.handleSetView({ type: 'form_view', formId: id })}
          onSelectWorkflow={(id) => app.handleSetView({ type: 'workflow_designer', workflowId: id })}
          onSelectPage={(id) => app.handleSetView({ type: 'page_designer', pageId: id })}
          onSelectScheduler={() => app.handleSetView({ type: 'scheduler' })}
          onItemContextMenu={(e, type, id) => { e.preventDefault(); app.setItemContextMenu({ type, id, x: e.clientX, y: e.clientY }); }}
          isOpen={app.isSidebarOpen}
          toggleSidebar={() => app.setIsSidebarOpen(!app.isSidebarOpen)}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">
          <Workspace 
            currentView={app.currentView}
            tables={db.tables}
            queries={db.queries}
            reports={db.reports}
            forms={db.forms}
            workflows={db.workflows}
            pages={db.pages}
            canvasNodes={app.relationshipNodes}
            relationships={db.relationships}
            activeObject={app.activeObject}
            isDirty={app.isDirty}
            onSetView={app.handleSetView}
            onActiveObjectChange={app.handleActiveObjectChange}
            onSave={app.handleSave}
            onDeleteRelationship={db.deleteRelationship}
            onUpdateRelationship={db.updateRelationship}
            onMoveRelationshipNode={(id, x, y) => app.setRelationshipNodes(app.relationshipNodes.map(n => n.id === id ? { ...n, x, y } : n))}
            onUpdateRelationshipNodes={(nodes) => app.setRelationshipNodes(nodes)}
            setRelationships={db.setRelationships}
            executeQuery={db.executeQuery}
            saveTable={db.saveTable}
            saveForm={db.saveForm}
            saveWorkflow={db.saveWorkflow}
            showConfirmation={(t, m, c) => app.setConfirmationModal({ title: t, message: m, onConfirm: c })}
            formActionTrigger={app.formActionTrigger}
            backendConfig={app.backendConfig}
            onUpdateBackendConfig={app.setBackendConfig} // Pass the setter!
            showMessage={app.showMessage}
            activeLock={app.activeLock}
          />
        </div>

        {/* Chat Panel */}
        <ChatPanel 
            isOpen={app.isChatOpen} 
            onClose={() => app.setIsChatOpen(false)}
            chats={app.chats}
            activeChatId={app.activeChatId}
            onSelectChat={app.handleSelectChat}
            onSendMessage={app.handleSendMessage}
        />
      </div>

      <StatusBar 
        currentView={app.currentView} 
        activeObject={app.activeObject} 
        onSetView={app.handleSetView} 
      />
      
      <ModalLayer 
        savePrompt={app.savePrompt}
        activeObject={app.activeObject}
        onCloseSavePrompt={app.closeSavePrompt}
        itemContextMenu={app.itemContextMenu}
        onCloseContextMenu={() => app.setItemContextMenu(null)}
        onContextMenuAction={app.handleContextMenuAction}
        nameInput={app.nameInput}
        showReportWizard={app.showReportWizard}
        setShowReportWizard={app.setShowReportWizard}
        onSaveReport={(r) => { db.saveReport(r); app.setShowReportWizard(false); app.handleSetView({ type: 'report_designer', reportId: r.id }); }}
        showFormWizard={app.showFormWizard}
        setShowFormWizard={app.setShowFormWizard}
        onSaveForm={(f) => { db.saveForm(f); app.setShowFormWizard(false); app.handleSetView({ type: 'form_designer', formId: f.id }); }}
        activeWizard={app.activeWizard}
        setActiveWizard={app.setActiveWizard}
        onSaveWizardQuery={(q) => { db.saveQuery(q); app.setActiveWizard(null); app.handleSetView({ type: 'query_designer', queryId: q.id }); }}
        onExecuteAppend={app.onExecuteAppend}
        onExecuteDelete={app.onExecuteDelete}
        confirmationModal={app.confirmationModal}
        setConfirmationModal={app.setConfirmationModal}
        tables={db.tables}
        queries={db.queries}
        showElectronSettings={app.showElectronSettings}
        electronSettings={app.electronSettings}
        onSaveElectronSettings={app.onSaveElectronSettings}
        onCloseElectronSettings={app.onCloseElectronSettings}
        
        showDeploymentModal={app.showDeploymentModal}
        deploymentConfig={app.backendConfig.deploymentConfig}
        onSaveDeploymentConfig={app.onSaveDeploymentConfig}
        onDeploy={app.onDeploy}
        onCloseDeploymentModal={() => app.setShowDeploymentModal(false)}

        messageModal={app.messageModal}
        onCloseMessage={app.closeMessage}
        showSecurityManager={app.showSecurityManager}
        setShowSecurityManager={app.setShowSecurityManager}
        onUpdateTable={app.onUpdateTable}
        onCreateTable={(t) => db.saveTable(t, 'create')} 
        forms={db.forms}
        reports={db.reports}
        
        // Pass Commercial Props
        showWhitelabelModal={app.showWhitelabelModal}
        setShowWhitelabelModal={app.setShowWhitelabelModal}
        onUpdateCommercial={app.onUpdateCommercial}
        
        showEnvModal={app.showEnvModal}
        setShowEnvModal={app.setShowEnvModal}
        onUpdateEnvironments={app.onUpdateEnvironments}
        
        showMigrationModal={app.showMigrationModal}
        setShowMigrationModal={app.setShowMigrationModal}
        onSnapshot={app.onSnapshot}
        lastSnapshot={app.lastSnapshot}
        
        // Pass Integration Props
        showIntegrationsModal={app.showIntegrationsModal}
        setShowIntegrationsModal={app.setShowIntegrationsModal}
        onSaveIntegrations={app.onSaveIntegrations}
        
        showExcelWizard={app.showExcelWizard}
        setShowExcelWizard={app.setShowExcelWizard}

        showAccessWizard={app.showAccessWizard}
        setShowAccessWizard={app.setShowAccessWizard}
        
        showDummyDataWizard={app.showDummyDataWizard}
        setShowDummyDataWizard={app.setShowDummyDataWizard}

        // FIX: Ensure SharePoint Props are passed
        showSharePointWizard={app.showSharePointWizard}
        setShowSharePointWizard={app.setShowSharePointWizard}

        showSchemaWizard={app.showSchemaWizard}
        setShowSchemaWizard={app.setShowSchemaWizard}
        onAddToast={app.addToast}

        backendConfig={app.backendConfig}
        onUpdateBackendConfig={app.setBackendConfig}
      />

      <ToastContainer toasts={app.toasts} onDismiss={app.removeToast} />
    </div>
  );
}
