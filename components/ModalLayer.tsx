
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
import { DeleteQueryWizard, Criterion } from '../features/queries/wizards/DeleteQueryWizard'; 
import { ExcelImportWizard } from '../features/tools/ExcelImportWizard';
import { AccessImportWizard } from '../features/tools/AccessImportWizard';
import { DummyDataWizard } from '../features/tools/DummyDataWizard';
import { SharePointImportWizard } from '../features/tools/SharePointImportWizard'; 
import { MessageModal } from './MessageModal';
import { Table, Query, Report, Form, SelectQuery, ViewType, ElectronSettings, MessageModalConfig, DeploymentConfig, Chart, Workflow, EnvironmentConfig, WhitelabelConfig, MultiTenancyConfig, LicensingConfig, BackendConfig, DbType, IntegrationsConfig } from '../types/index';

interface ModalLayerProps {
  savePrompt: { show: boolean; targetView?: ViewType };
  activeObject: Table | Query | Report | Form | Chart | Workflow | null;
  onCloseSavePrompt: (action: 'yes' | 'no' | 'cancel') => void;
  
  itemContextMenu: { type: 'table' | 'query' | 'report' | 'form' | 'chart' | 'workflow'; id: string; x: number; y: number } | null;
  onCloseContextMenu: () => void;
  onContextMenuAction: (action: 'view' | 'view_data' | 'export' | 'rename' | 'delete') => void;

  nameInput: { title: string; label: string; initialValue: string; onConfirm: (name: string) => void; onCancel: () => void } | null;
  
  showReportWizard: boolean;
  setShowReportWizard: (show: boolean) => void;
  onSaveReport: (report: Report) => void;
  
  showFormWizard: boolean;
  setShowFormWizard: (show: boolean) => void;
  onSaveForm: (form: Form) => void;
  
  showSecurityManager: boolean;
  setShowSecurityManager: (show: boolean) => void;
  onUpdateTable: (table: Table) => void;
  onCreateTable: (table: Table) => void; 

  activeWizard: 'duplicate' | 'inconsistency' | 'append' | 'delete' | null;
  setActiveWizard: (wizard: 'duplicate' | 'inconsistency' | 'append' | 'delete' | null) => void;
  onSaveWizardQuery: (query: SelectQuery) => void;
  onExecuteAppend: (source: Table, target: Table, map: Record<string, string>) => void;
  onExecuteDelete: (table: Table, criteria: Criterion[]) => void;
  
  confirmationModal: { title: string; message: string; onConfirm: () => void } | null;
  setConfirmationModal: (modal: null) => void;

  // Electron
  showElectronSettings: boolean;
  electronSettings: ElectronSettings;
  onSaveElectronSettings: (settings: ElectronSettings) => void;
  onCloseElectronSettings: () => void;

  // Deployment
  showDeploymentModal?: boolean;
  deploymentConfig?: DeploymentConfig;
  onSaveDeploymentConfig?: (config: DeploymentConfig) => void;
  onDeploy?: () => void;
  onCloseDeploymentModal?: () => void;

  // Commercial / Lifecycle Modals
  showWhitelabelModal?: boolean;
  setShowWhitelabelModal?: (show: boolean) => void;
  onUpdateCommercial?: (w: WhitelabelConfig, m: MultiTenancyConfig, l: LicensingConfig) => void;
  
  showEnvModal?: boolean;
  setShowEnvModal?: (show: boolean) => void;
  onUpdateEnvironments?: (envs: EnvironmentConfig[]) => void;
  
  showMigrationModal?: boolean;
  setShowMigrationModal?: (show: boolean) => void;
  onSnapshot?: () => void;
  lastSnapshot?: Table[];

  // Integrations
  showIntegrationsModal?: boolean;
  setShowIntegrationsModal?: (show: boolean) => void;
  onSaveIntegrations?: (config: IntegrationsConfig) => void;

  // Imports / Tools
  showExcelWizard?: boolean;
  setShowExcelWizard?: (show: boolean) => void;
  showAccessWizard?: boolean; 
  setShowAccessWizard?: (show: boolean) => void;
  showDummyDataWizard?: boolean;
  setShowDummyDataWizard?: (show: boolean) => void;
  showSharePointWizard?: boolean; 
  setShowSharePointWizard?: (show: boolean) => void; 

  // Global Message Modal
  messageModal: MessageModalConfig | null;
  onCloseMessage: () => void;

  tables: Table[];
  queries: Query[];
  forms: Form[];
  reports: Report[];
  backendConfig?: BackendConfig;
  onUpdateBackendConfig?: (config: BackendConfig) => void;
}

export const ModalLayer: React.FC<ModalLayerProps> = (props) => {
  const {
    savePrompt, activeObject, onCloseSavePrompt,
    itemContextMenu, onCloseContextMenu, onContextMenuAction,
    nameInput,
    showReportWizard, setShowReportWizard, onSaveReport,
    showFormWizard, setShowFormWizard, onSaveForm,
    showSecurityManager, setShowSecurityManager, onUpdateTable, onCreateTable,
    activeWizard, setActiveWizard, onSaveWizardQuery, onExecuteAppend, onExecuteDelete,
    confirmationModal, setConfirmationModal,
    showElectronSettings, electronSettings, onSaveElectronSettings, onCloseElectronSettings,
    showDeploymentModal, deploymentConfig, onSaveDeploymentConfig, onDeploy, onCloseDeploymentModal,
    
    showWhitelabelModal, setShowWhitelabelModal, onUpdateCommercial,
    showEnvModal, setShowEnvModal, onUpdateEnvironments,
    showMigrationModal, setShowMigrationModal, onSnapshot, lastSnapshot,
    
    showIntegrationsModal, setShowIntegrationsModal, onSaveIntegrations,

    showExcelWizard, setShowExcelWizard,
    showAccessWizard, setShowAccessWizard,
    showDummyDataWizard, setShowDummyDataWizard,
    showSharePointWizard, setShowSharePointWizard,
    
    messageModal, onCloseMessage,
    tables, queries, forms, reports, backendConfig, onUpdateBackendConfig
  } = props;

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
          <div className="fixed inset-0 z-40" onClick={onCloseContextMenu}></div>
          <ItemContextMenu 
            x={itemContextMenu.x} 
            y={itemContextMenu.y} 
            itemType={itemContextMenu.type}
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
          onSave={onSaveReport}
          onClose={() => setShowReportWizard(false)} 
        />
      )}
      
      {showFormWizard && (
        <FormWizardModal
          tables={tables}
          queries={queries}
          onSave={onSaveForm}
          onClose={() => setShowFormWizard(false)}
        />
      )}

      {showExcelWizard && setShowExcelWizard && (
          <ExcelImportWizard 
            onSave={onCreateTable} 
            onClose={() => setShowExcelWizard(false)} 
          />
      )}

      {showAccessWizard && setShowAccessWizard && (
          <AccessImportWizard 
            onSave={onCreateTable} 
            onClose={() => setShowAccessWizard(false)} 
          />
      )}

      {showDummyDataWizard && setShowDummyDataWizard && (
          <DummyDataWizard 
            tables={tables}
            onGenerate={onUpdateTable}
            onClose={() => setShowDummyDataWizard(false)}
          />
      )}

      {showSharePointWizard && setShowSharePointWizard && (
          <SharePointImportWizard 
            onSave={onCreateTable} 
            onClose={() => setShowSharePointWizard(false)}
            backendConfig={backendConfig}
            onUpdateConfig={onUpdateBackendConfig}
          />
      )}

      {showSecurityManager && (
          <SecurityManagerModal 
            tables={tables}
            queries={queries}
            forms={forms}
            reports={reports}
            onUpdateTable={onUpdateTable}
            onCreateTable={onCreateTable}
            onClose={() => setShowSecurityManager(false)}
            backendConfig={backendConfig}
            onUpdateBackendConfig={onUpdateBackendConfig}
          />
      )}

      {showElectronSettings && (
          <ElectronSettingsModal
            settings={electronSettings}
            onSave={onSaveElectronSettings}
            onClose={onCloseElectronSettings}
          />
      )}

      {showDeploymentModal && onSaveDeploymentConfig && onCloseDeploymentModal && onDeploy && (
          <DeploymentModal
            config={deploymentConfig}
            onSave={onSaveDeploymentConfig}
            onClose={onCloseDeploymentModal}
            onDeploy={onDeploy}
          />
      )}

      {showWhitelabelModal && onUpdateCommercial && setShowWhitelabelModal && (
          <WhitelabelModal
            whitelabel={backendConfig?.whitelabel}
            multiTenancy={backendConfig?.multiTenancy}
            licensing={backendConfig?.licensing}
            onSave={onUpdateCommercial}
            onClose={() => setShowWhitelabelModal(false)}
          />
      )}

      {showEnvModal && onUpdateEnvironments && setShowEnvModal && (
          <EnvironmentManagerModal
            initialEnvs={backendConfig?.environments}
            dbType={backendConfig?.dbType || DbType.SQL}
            onSave={onUpdateEnvironments}
            onClose={() => setShowEnvModal(false)}
          />
      )}

      {showMigrationModal && onSnapshot && setShowMigrationModal && (
          <MigrationManagerModal
            currentTables={tables}
            lastSnapshot={lastSnapshot}
            dbType={backendConfig?.dbType || DbType.SQL}
            onSnapshot={onSnapshot}
            onClose={() => setShowMigrationModal(false)}
          />
      )}

      {/* NEW: Integrations Modal Global */}
      {showIntegrationsModal && onSaveIntegrations && setShowIntegrationsModal && (
          <IntegrationsModal
            config={backendConfig?.integrations}
            onSave={onSaveIntegrations}
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
