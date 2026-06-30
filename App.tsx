
import React from 'react';
import { Ribbon } from './components/Ribbon';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { StatusBar } from './components/StatusBar';
import { DatabaseSelector } from './features/backend/DatabaseSelector';
import { AppHeader } from './components/AppHeader';
import { ModalLayer } from './components/ModalLayer';
import { ToastContainer } from './components/Toast';
import { ChatPanel } from './components/ChatPanel';
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
    <div className="flex flex-col h-screen overflow-hidden text-sm bg-slate-100 dark:bg-slate-900 font-sans transition-colors duration-300">
      <AppHeader />
      
      <Ribbon onAction={app.handleRibbonAction} />
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar onSetView={app.handleSetView} />
        
        <div className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">
          <Workspace onSetView={app.handleSetView} onActiveObjectChange={app.setActiveObject} />
        </div>

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
        onCloseSavePrompt={app.closeSavePrompt}
        onContextMenuAction={app.handleContextMenuAction}
        onSaveWizardQuery={app.onSaveWizardQuery}
        onExecuteAppend={app.onExecuteAppend}
        onExecuteDelete={app.onExecuteDelete}
        onSaveElectronSettings={app.onSaveElectronSettings}
        onSetView={app.handleSetView}
      />

      <ToastContainer toasts={app.toasts} onDismiss={app.removeToast} />
    </div>
  );
}
