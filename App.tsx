
import React from 'react';
import { Ribbon } from './components/Ribbon';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { StatusBar } from './components/StatusBar';
import { AccessBackstageView } from './features/backstage/AccessBackstageView';
import { AppHeader } from './components/AppHeader';
import { ModalLayer } from './components/ModalLayer';
import { ToastContainer } from './components/Toast';
import { ChatPanel } from './components/ChatPanel';
import { ThemeInjector } from './components/ThemeInjector';
import { useAppController } from './hooks/useAppController';
import { useAuthStore } from './stores/useAuthStore';
import { useUIStore } from './stores/useUIStore';

export default function App() {
  const app = useAppController();
  const { db } = app;
  const { isBackstageOpen, setIsBackstageOpen, setActiveTab } = useUIStore();
  const { checkAdSession } = useAuthStore();

  React.useEffect(() => {
    if (checkAdSession) {
      checkAdSession();
    }
  }, [checkAdSession]);

  // If no project is currently open, show MS Access Start / Backstage View directly
  if (!db.projectId) {
    return (
      <div className="flex flex-col h-screen overflow-hidden text-sm bg-[#2b2b2b] text-neutral-100 font-sans">
        <ThemeInjector />
        <AccessBackstageView />
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

  return (
    <div className="app-container flex flex-col h-screen overflow-hidden text-sm bg-slate-100 dark:bg-slate-900 font-sans transition-colors duration-300 relative print:h-auto print:overflow-visible print:bg-white print:block">
      <ThemeInjector />
      <div className="no-print print:hidden">
        <AppHeader onAction={app.handleRibbonAction} chats={app.chats} />
        <Ribbon onAction={app.handleRibbonAction} />
      </div>
      
      <div className="flex flex-1 overflow-hidden relative print:overflow-visible print:h-auto print:block">
        <div className="no-print print:hidden">
          <Sidebar onSetView={app.handleSetView} />
        </div>
        
        <div className="app-workspace-content flex-1 flex flex-col overflow-hidden relative transition-all duration-300 print:overflow-visible print:h-auto print:block print:w-full print:p-0">
          <Workspace onSetView={app.handleSetView} onActiveObjectChange={app.handleActiveObjectChange} />
        </div>

        <div className="app-chat-panel no-print print:hidden">
          <ChatPanel 
              isOpen={app.isChatOpen} 
              onClose={() => app.setIsChatOpen(false)}
              chats={app.chats}
              activeChatId={app.activeChatId}
              onSelectChat={app.handleSelectChat}
              onSendMessage={app.handleSendMessage}
          />
        </div>
      </div>

      <div className="no-print print:hidden">
        <StatusBar 
          currentView={app.currentView} 
          activeObject={app.activeObject} 
          onSetView={app.handleSetView} 
        />
      </div>
      
      {/* MS Access Backstage View Overlay when 'Datei' (File) is clicked */}
      {isBackstageOpen && (
        <div className="no-print print:hidden">
          <AccessBackstageView 
            onCloseBackstage={() => {
              setIsBackstageOpen(false);
              if (app.activeTab === 'file') {
                setActiveTab('home');
              }
            }} 
          />
        </div>
      )}

      {/* ModalLayer rendered AFTER BackstageView so all modals (Close, Save, Wizards) sit cleanly above Backstage */}
      <div className="app-modal-layer no-print print:hidden">
        <ModalLayer 
          onCloseSavePrompt={app.closeSavePrompt}
          onContextMenuAction={app.handleContextMenuAction}
          onSaveWizardQuery={app.onSaveWizardQuery}
          onExecuteAppend={app.onExecuteAppend}
          onExecuteDelete={app.onExecuteDelete}
          onSaveElectronSettings={app.onSaveElectronSettings}
          onSetView={app.handleSetView}
        />
      </div>

      <div className="toast-container no-print print:hidden">
        <ToastContainer toasts={app.toasts} onDismiss={app.removeToast} />
      </div>
    </div>
  );
}
