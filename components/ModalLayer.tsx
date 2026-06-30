
import React from 'react';
import { SaveChangesModal } from './SaveChangesModal';
import { ItemContextMenu } from './ItemContextMenu';
import { InputModal } from './InputModal';
import { ReportWizardModal } from '../features/reports/ReportWizardModal';
import { FormWizardModal } from '../features/forms/FormWizardModal';
import { ConfirmationModal } from './ConfirmationModal';
import { ElectronSettingsModal } from '../features/backend/ElectronSettingsModal';
import { SecurityManagerModal } from '../features/security/SecurityManagerModal';
import { DeploymentModal } from '../features/backend/components/DeploymentModal';
import { WhitelabelModal } from '../features/backend/WhitelabelModal';
import { EnvironmentManagerModal } from '../features/backend/EnvironmentManagerModal';
import { MigrationManagerModal } from '../features/backend/MigrationManagerModal';
import { IntegrationsModal } from '../features/backend/IntegrationsModal';
import { DuplicateWizard, InconsistencyWizard } from '../features/queries/wizards/QueryWizards';
import { AppendQueryWizard } from '../features/queries/wizards/AppendQueryWizard';
import { DeleteQueryWizard } from '../features/queries/wizards/DeleteQueryWizard'; 
import { ExcelImportWizard } from '../features/tools/ExcelImportWizard';
import { AccessImportWizard } from '../features/tools/AccessImportWizard';
import { DummyDataWizard } from '../features/tools/DummyDataWizard';
import { SharePointImportWizard } from '../features/tools/SharePointImportWizard'; 
import { SchemaImportWizard } from '../features/tools/SchemaImportWizard'; 
import { MessageModal } from './MessageModal';
import { useProjectStore } from '../stores/useProjectStore';
import { useUIStore } from '../stores/useUIStore';
import { DbType } from '../types/index';

interface ModalLayerProps {
  onCloseSavePrompt: (action: 'yes' | 'no' | 'cancel') => void;
  onContextMenuAction: (action: any) => void;
  onSaveWizardQuery: (query: any) => void;
  onExecuteAppend: (source: any, target: any, map: any) => void;
  onExecuteDelete: (table: any, criteria: any) => void;
  onSaveElectronSettings: (settings: any) => void;
}

export const ModalLayer: React.FC<ModalLayerProps> = (props) => {
  const store = useProjectStore();
  const ui = useUIStore();
  
  const { 
    tables, queries, reports, forms, backendConfig, setBackendConfig,
    addTable, updateTable, setQueries, setReports, setForms, snapshot, lastSnapshot
  } = store;
  
  const { 
    savePrompt, activeObject, itemContextMenu, setItemContextMenu, nameInput,
    showReportWizard, setShowReportWizard, showFormWizard, setShowFormWizard,
    showSecurityManager, setShowSecurityManager, activeWizard, setActiveWizard,
    confirmationModal, setConfirmationModal, showElectronSettings, setShowElectronSettings,
    showDeploymentModal, setShowDeploymentModal, showWhitelabelModal, setShowWhitelabelModal,
    showEnvModal, setShowEnvModal, showMigrationModal, setShowMigrationModal,
    showIntegrationsModal, setShowIntegrationsModal, showExcelWizard, setShowExcelWizard,
    showAccessWizard, setShowAccessWizard, showDummyDataWizard, setShowDummyDataWizard,
    showSharePointWizard, setShowSharePointWizard, showSchemaWizard, setShowSchemaWizard,
    messageModal, closeMessage: onCloseMessage, setCurrentView, addToast
  } = ui;

  const { onCloseSavePrompt, onContextMenuAction, onSaveWizardQuery, onExecuteAppend, onExecuteDelete, onSaveElectronSettings } = props;

  return (
    <>
      {savePrompt.show && (
        <SaveChangesModal 
          objectType={
            activeObject && 'fields' in activeObject ? 'Tabelle' : 
            activeObject && 'nodes' in activeObject && 'columns' in activeObject ? 'Abfrage' : 
            activeObject && 'layout' in activeObject ? 'Formular' :
            activeObject && 'summaries' in activeObject ? 'Bericht' :
            activeObject && 'config' in activeObject ? 'Diagramm' :
            activeObject && 'nodes' in activeObject ? 'Workflow' : 'Objekt'
          }
          objectName={activeObject?.name || 'Unbenannt'}
          onYes={() => onCloseSavePrompt('yes')}
          onNo={() => onCloseSavePrompt('no')}
          onCancel={() => onCloseSavePrompt('cancel')}
        />
      )}
      
      {itemContextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setItemContextMenu(null)}></div>
          <ItemContextMenu 
            x={itemContextMenu.x} 
            y={itemContextMenu.y} 
            itemType={itemContextMenu.type as any}
            onAction={onContextMenuAction}
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
          onSave={(r) => { setReports([...reports, r]); setShowReportWizard(false); setCurrentView({ type: 'report_designer', reportId: r.id }); }}
          onClose={() => setShowReportWizard(false)} 
        />
      )}
      
      {showFormWizard && (
        <FormWizardModal
          tables={tables}
          queries={queries}
          onSave={(f) => { setForms([...forms, f]); setShowFormWizard(false); setCurrentView({ type: 'form_designer', formId: f.id }); }}
          onClose={() => setShowFormWizard(false)}
        />
      )}

      {showExcelWizard && (
          <ExcelImportWizard 
            onSave={addTable} 
            onClose={() => setShowExcelWizard(false)} 
          />
      )}

      {showAccessWizard && (
          <AccessImportWizard 
            onSave={addTable} 
            onClose={() => setShowAccessWizard(false)} 
          />
      )}

      {showDummyDataWizard && (
          <DummyDataWizard 
            tables={tables}
            onGenerate={updateTable}
            onClose={() => setShowDummyDataWizard(false)}
          />
      )}

      {showSharePointWizard && (
          <SharePointImportWizard 
            onSave={addTable} 
            onClose={() => setShowSharePointWizard(false)}
            backendConfig={backendConfig}
            onUpdateConfig={setBackendConfig}
          />
      )}

      {showSchemaWizard && (
          <SchemaImportWizard
            onSave={addTable}
            onClose={() => setShowSchemaWizard(false)}
            onAddToast={addToast}
          />
      )}

      {showSecurityManager && (
          <SecurityManagerModal 
            tables={tables}
            queries={queries}
            forms={forms}
            reports={reports}
            onUpdateTable={updateTable}
            onCreateTable={addTable}
            onClose={() => setShowSecurityManager(false)}
            backendConfig={backendConfig}
            onUpdateBackendConfig={setBackendConfig}
          />
      )}

      {showElectronSettings && (
          <ElectronSettingsModal
            settings={backendConfig.electronSettings || { includeBackend: true, bundleFrontend: true }}
            onSave={onSaveElectronSettings}
            onClose={() => setShowElectronSettings(false)}
          />
      )}

      {showDeploymentModal && (
          <DeploymentModal
            config={backendConfig.deploymentConfig}
            onSave={(c) => setBackendConfig({...backendConfig, deploymentConfig: c})}
            onClose={() => setShowDeploymentModal(false)}
            onDeploy={() => { setShowDeploymentModal(false); ui.setFormActionTrigger({action:'backend_generate', timestamp: Date.now()}); }}
          />
      )}

      {showWhitelabelModal && (
          <WhitelabelModal
            whitelabel={backendConfig?.whitelabel}
            multiTenancy={backendConfig?.multiTenancy}
            licensing={backendConfig?.licensing}
            onSave={(w, m, l) => setBackendConfig({...backendConfig, whitelabel: w, multiTenancy: m, licensing: l})}
            onClose={() => setShowWhitelabelModal(false)}
          />
      )}

      {showEnvModal && (
          <EnvironmentManagerModal
            initialEnvs={backendConfig?.environments}
            dbType={backendConfig?.dbType || DbType.SQL}
            onSave={(e) => setBackendConfig({...backendConfig, environments: e})}
            onClose={() => setShowEnvModal(false)}
          />
      )}

      {showMigrationModal && (
          <MigrationManagerModal
            currentTables={tables}
            lastSnapshot={lastSnapshot}
            dbType={backendConfig?.dbType || DbType.SQL}
            onSnapshot={snapshot}
            onClose={() => setShowMigrationModal(false)}
          />
      )}

      {showIntegrationsModal && (
          <IntegrationsModal
            config={backendConfig?.integrations}
            onSave={(c) => setBackendConfig({...backendConfig, integrations: c})}
            onClose={() => setShowIntegrationsModal(false)}
          />
      )}

      {/* Query Wizards */}
      {activeWizard === 'duplicate' && <DuplicateWizard tables={tables} onSave={onSaveWizardQuery} onClose={() => setActiveWizard(null)} />}
      {activeWizard === 'inconsistency' && <InconsistencyWizard tables={tables} onSave={onSaveWizardQuery} onClose={() => setActiveWizard(null)} />}
      {activeWizard === 'append' && <AppendQueryWizard tables={tables} onExecute={onExecuteAppend} onClose={() => setActiveWizard(null)} />}
      {activeWizard === 'delete' && <DeleteQueryWizard tables={tables} onExecute={onExecuteDelete} onClose={() => setActiveWizard(null)} />}

      {confirmationModal && (
        <ConfirmationModal 
          title={confirmationModal.title}
          message={confirmationModal.message}
          confirmText={confirmationModal.confirmText}
          cancelText={confirmationModal.cancelText}
          alternateText={confirmationModal.alternateText}
          confirmClass={confirmationModal.confirmClass}
          onConfirm={() => {
            confirmationModal.onConfirm();
            setConfirmationModal(null);
          }}
          onCancel={() => {
            if (confirmationModal.onCancel) confirmationModal.onCancel();
            setConfirmationModal(null);
          }}
          onAlternate={confirmationModal.onAlternate ? () => {
            confirmationModal.onAlternate?.();
            setConfirmationModal(null);
          } : undefined}
        />
      )}

      {messageModal && (
        <MessageModal 
          type={messageModal.type}
          title={messageModal.title}
          message={messageModal.message}
          onClose={onCloseMessage}
        />
      )}
    </>
  );
};
