
import React from 'react';
import { SaveChangesModal } from './SaveChangesModal';
import { ItemContextMenu } from './ItemContextMenu';
import { InputModal } from './InputModal';
import { ReportWizardModal } from '../features/reports/ReportWizardModal';
import { FormWizardModal } from '../features/forms/FormWizardModal';
import { ConfirmationModal } from './ConfirmationModal';
import { DuplicateWizard, InconsistencyWizard } from '../features/queries/wizards/QueryWizards';
import { Table, Query, Report, Form, SelectQuery, ViewType } from '../types/index';

interface ModalLayerProps {
  savePrompt: { show: boolean; targetView?: ViewType };
  activeObject: Table | Query | Report | Form | null;
  onCloseSavePrompt: (action: 'yes' | 'no' | 'cancel') => void;
  
  itemContextMenu: { type: 'table' | 'query' | 'report' | 'form'; id: string; x: number; y: number } | null;
  onCloseContextMenu: () => void;
  onContextMenuAction: (action: 'view' | 'view_data' | 'export' | 'rename' | 'delete') => void;

  nameInput: { title: string; label: string; initialValue: string; onConfirm: (name: string) => void; onCancel: () => void } | null;
  
  showReportWizard: boolean;
  setShowReportWizard: (show: boolean) => void;
  onSaveReport: (report: Report) => void;
  
  showFormWizard: boolean;
  setShowFormWizard: (show: boolean) => void;
  onSaveForm: (form: Form) => void;
  
  activeWizard: 'duplicate' | 'inconsistency' | null;
  setActiveWizard: (wizard: 'duplicate' | 'inconsistency' | null) => void;
  onSaveWizardQuery: (query: SelectQuery) => void;
  
  confirmationModal: { title: string; message: string; onConfirm: () => void } | null;
  setConfirmationModal: (modal: null) => void;

  tables: Table[];
  queries: Query[];
}

export const ModalLayer: React.FC<ModalLayerProps> = (props) => {
  const {
    savePrompt, activeObject, onCloseSavePrompt,
    itemContextMenu, onCloseContextMenu, onContextMenuAction,
    nameInput,
    showReportWizard, setShowReportWizard, onSaveReport,
    showFormWizard, setShowFormWizard, onSaveForm,
    activeWizard, setActiveWizard, onSaveWizardQuery,
    confirmationModal, setConfirmationModal,
    tables, queries
  } = props;

  return (
    <>
      {savePrompt.show && (
        <SaveChangesModal 
          objectType={activeObject && 'fields' in activeObject ? 'Tabelle' : 'Abfrage'}
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

      {activeWizard === 'duplicate' && <DuplicateWizard tables={tables} onSave={onSaveWizardQuery} onClose={() => setActiveWizard(null)} />}
      {activeWizard === 'inconsistency' && <InconsistencyWizard tables={tables} onSave={onSaveWizardQuery} onClose={() => setActiveWizard(null)} />}

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
    </>
  );
};
