import React from 'react';
import { Layout, Plus, Zap, AlertCircle } from 'lucide-react';
import { Form, Table, FormElement, Query, getWidthClasses } from '../../../../types/index';
import { FormWidget } from '../../renderer/FormWidget';
import { DropdownButtonWidget } from './DropdownButtonWidget';
import { executeMacro, getSavedMacros } from '../../../logic/MacroEngine';
import { useProjectStore } from '../../../../stores/useProjectStore';

interface FormElementRendererProps {
  el: FormElement;
  allForms: Form[];
  allTables: Table[];
  queries?: Query[];
  executeQuery?: (q: Query) => Record<string, any>[];
  onTableChange: (table: Table) => void;
  showConfirmation: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    confirmClass?: string
  ) => void;
  currentRecord: Record<string, any>;
  isReadOnly: boolean;
  isCreating: boolean;
  sourceTable?: Table;
  handleInputChange: (fieldName: string, value: any) => void;
  getLookupOptions: (config: any) => any[];
  setLookupModal: React.Dispatch<React.SetStateAction<any>>;
  setSubformModal: React.Dispatch<React.SetStateAction<any>>;
  handleContextMenu: (e: React.MouseEvent, fieldName: string, val: any) => void;
  setFocusedFieldName: (name: string | null) => void;
  getFieldName: (fieldId: string) => string;
  evalVisibility: (el: FormElement) => boolean;
  FormViewComponent: React.ComponentType<any>;
}

export const FormElementRenderer: React.FC<FormElementRendererProps> = ({
  el,
  allForms,
  allTables,
  queries,
  executeQuery,
  onTableChange,
  showConfirmation,
  currentRecord,
  isReadOnly,
  isCreating,
  sourceTable,
  handleInputChange,
  getLookupOptions,
  setLookupModal,
  setSubformModal,
  handleContextMenu,
  setFocusedFieldName,
  getFieldName,
  evalVisibility,
  FormViewComponent,
}) => {
  if (!evalVisibility(el)) return null;

  const renderChild = (childEl: FormElement) => (
    <FormElementRenderer
      key={childEl.id}
      el={childEl}
      allForms={allForms}
      allTables={allTables}
      queries={queries}
      executeQuery={executeQuery}
      onTableChange={onTableChange}
      showConfirmation={showConfirmation}
      currentRecord={currentRecord}
      isReadOnly={isReadOnly}
      isCreating={isCreating}
      sourceTable={sourceTable}
      handleInputChange={handleInputChange}
      getLookupOptions={getLookupOptions}
      setLookupModal={setLookupModal}
      setSubformModal={setSubformModal}
      handleContextMenu={handleContextMenu}
      setFocusedFieldName={setFocusedFieldName}
      getFieldName={getFieldName}
      evalVisibility={evalVisibility}
      FormViewComponent={FormViewComponent}
    />
  );

  if (el.type === 'container') {
    return (
      <div key={el.id} className={`${el.className || ''} ${getWidthClasses(el.width)}`.trim()} id={`container-${el.id}`}>
        {el.children?.map(renderChild)}
      </div>
    );
  }

  if (el.type === 'label') {
    return (
      <div key={el.id} className={`${el.className || ''} ${getWidthClasses(el.width)}`.trim()} id={`label-${el.id}`}>
        {el.label}
      </div>
    );
  }

  if (el.type === 'button') {
    const handleButtonClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!el.actions || el.actions.length === 0) {
        alert(`Schaltfläche "${el.label || 'Button'}": Keine Aktion konfiguriert.`);
        return;
      }

      el.actions.forEach((act) => {
        if (act.actionType === 'RunMacro') {
          const savedMacros = getSavedMacros();
          const macro = savedMacros.find((m) => m.id === act.macroId);
          if (macro) {
            const store = (useProjectStore as any)?.getState ? (useProjectStore as any).getState() : {};
            executeMacro(macro, {
              tables: allTables,
              queries: queries && queries.length > 0 ? queries : (store.queries || []),
              reports: store.reports || [],
              relationships: store.relationships || [],
              currentRecord,
              onTableChange,
              onShowToast: (msg, type) => {
                alert(`[${type?.toUpperCase() || 'INFO'}] ${msg}`);
              },
            });
          } else if (!act.macroId) {
            alert(`Schaltfläche "${el.label || 'Makro'}": Bitte wählen Sie im Formularentwurf in den Eigenschaften ein Makro aus.`);
          } else {
            alert(`Makro mit ID "${act.macroId}" nicht gefunden.`);
          }
        } else if (act.actionType === 'ShowToast') {
          alert(act.toastMessage || 'Aktion ausgeführt!');
        } else if (act.actionType === 'OpenModal' && act.modalId) {
          const targetForm = allForms.find((f) => f.id === act.modalId);
          if (targetForm) {
            setSubformModal({
              isOpen: true,
              formId: targetForm.id,
              parentField: '',
              childField: '',
              linkValue: null,
            });
          }
        } else if (act.actionType === 'Navigate' && act.routeUrl) {
          window.location.hash = act.routeUrl;
        }
      });
    };

    return (
      <div key={el.id} className={`my-2 inline-block ${el.className || ''} ${getWidthClasses(el.width)}`.trim()} id={`btn-container-${el.id}`}>
        <button
          type="button"
          onClick={handleButtonClick}
          className={
            el.className ||
            'bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2'
          }
        >
          <Zap size={16} className="text-amber-300 fill-amber-200" />
          <span>{el.label || 'Makro ausführen'}</span>
        </button>
      </div>
    );
  }

  if (el.type === 'dropdown_button') {
    return (
      <DropdownButtonWidget
        key={el.id}
        el={el}
        allForms={allForms}
        allTables={allTables}
        queries={queries}
        currentRecord={currentRecord}
        onTableChange={onTableChange}
        setSubformModal={setSubformModal}
      />
    );
  }

  if (el.type === 'field') {
    const fieldName = sourceTable?.fields.find((f) => f.id === el.fieldId)?.name || '';
    const fieldValue = currentRecord[fieldName] ?? '';
    return (
      <FormWidget
        key={el.id}
        element={el}
        value={fieldValue}
        sourceTable={sourceTable}
        isReadOnly={isReadOnly}
        onChange={handleInputChange}
        getLookupOptions={getLookupOptions}
        onOpenLookupModal={(tid, fname, fid) =>
          setLookupModal({ isOpen: true, targetTableId: tid, sourceFieldName: fname, formId: fid })
        }
        onContextMenu={handleContextMenu}
        onFocusField={(fname) => setFocusedFieldName(fname)}
      />
    );
  }

  if (el.type === 'subform' && el.subform) {
    if (isCreating) {
      return (
        <div
          key={el.id}
          className={`border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 mt-4 text-center ${
            el.className || ''
          }`}
          id={`subform-creating-block-${el.id}`}
        >
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <AlertCircle size={24} />
            <p className="font-semibold text-sm">Unterformular "{el.label}" nicht verfügbar</p>
            <p className="text-xs">Bitte speichern Sie den Hauptdatensatz, bevor Sie Einträge hinzufügen.</p>
          </div>
        </div>
      );
    }

    const subDef = allForms.find((f) => f.id === el.subform!.formId);
    if (!subDef) return <div key={el.id} className="text-red-500">Subform nicht gefunden.</div>;

    const subTable = allTables.find((t) => t.id === subDef.sourceId);
    let subformData: Record<string, any>[] = [];

    if (sourceTable && subTable && currentRecord) {
      const masterLinkField = sourceTable.fields.find((f) => f.id === el.subform!.masterLinkFieldId);
      const childLinkField = subTable.fields.find((f) => f.id === el.subform!.childLinkFieldId);
      if (masterLinkField && childLinkField) {
        const linkValue = currentRecord[masterLinkField.name];
        subformData = (subTable.data || []).filter(
          (row) => linkValue !== undefined && linkValue !== null && linkValue !== '' && String(row[childLinkField.name]) === String(linkValue)
        );
      }
    }

    const canAdd = el.subform.canAdd !== false;
    const canEdit = el.subform.canEdit !== false;
    const canDelete = el.subform.canDelete !== false;

    const handleOpenSubformModalLocal = () => {
      if (!sourceTable || !currentRecord) return;
      const masterLinkField = sourceTable.fields.find((f) => f.id === el.subform!.masterLinkFieldId);
      if (masterLinkField) {
        const masterFieldName = masterLinkField.name;
        const linkValue = currentRecord[masterFieldName];
        setSubformModal({
          isOpen: true,
          formId: el.subform!.formId,
          parentField: el.subform!.masterLinkFieldId,
          childField: el.subform!.childLinkFieldId,
          linkValue,
        });
      }
    };

    return (
      <div
        key={el.id}
        className={`border border-slate-300 rounded-md overflow-hidden mt-4 ${el.className || ''} ${getWidthClasses(el.width)}`.trim()}
        id={`subform-container-${el.id}`}
      >
        <div className="bg-slate-100 p-2 flex justify-between items-center border-b border-slate-200">
          <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
            <Layout size={14} /> {el.label || subDef.name} ({subformData.length})
          </span>
          {!isReadOnly && canAdd && (
            <button
              onClick={handleOpenSubformModalLocal}
              className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded px-2 py-1 text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
            >
              <Plus size={12} strokeWidth={3} /> Eintrag hinzufügen
            </button>
          )}
        </div>
        <div className="p-2 bg-slate-50/50">
          {subformData.length > 0 ? (
            <FormViewComponent
              form={subDef}
              allForms={allForms}
              allTables={allTables}
              queries={queries}
              executeQuery={executeQuery}
              onTableChange={onTableChange}
              showConfirmation={showConfirmation}
              isSubform={true}
              filteredData={subformData}
              parentRecord={currentRecord}
              linkConfig={{ masterFieldId: el.subform!.masterLinkFieldId, childFieldId: el.subform!.childLinkFieldId }}
              subformPermissions={{ canAdd, canEdit, canDelete }}
            />
          ) : (
            <div className="p-6 text-center">
              <p className="text-slate-400 text-sm mb-3">Keine Einträge vorhanden.</p>
              {!isReadOnly && canAdd && (
                <button
                  onClick={handleOpenSubformModalLocal}
                  className="bg-blue-50 text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-blue-100 transition-colors mx-auto flex items-center gap-2"
                >
                  <Plus size={14} /> Ersten Eintrag erstellen
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
