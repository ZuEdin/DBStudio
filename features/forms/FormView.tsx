
import React, { useState, useEffect, useRef } from 'react';
import { Form, Table, FormElement } from '../../types/index';
import { ChevronLeft, ChevronRight, Plus, Trash2, Save, X, ChevronsLeft, ChevronsRight, Minimize2, ExternalLink, CheckCircle, XCircle, Layout, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { FormWidget } from './renderer/FormWidget';

interface FormViewProps {
  form: Form;
  allForms: Form[];
  allTables: Table[];
  onTableChange: (table: Table) => void;
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
  isSubform?: boolean;
  filteredData?: Record<string, any>[];
  parentRecord?: Record<string, any>;
  linkConfig?: { masterFieldId: string, childFieldId: string };
  onClose?: () => void;
  initialMode?: 'create' | 'edit' | 'view';
  hideNavigation?: boolean;
  hideActions?: boolean;
  hideHeader?: boolean;
  embedded?: boolean;
  defaultValues?: Record<string, any>;
}

export const FormView: React.FC<FormViewProps> = ({ 
  form, allForms, allTables, onTableChange, showConfirmation, isSubform, filteredData, parentRecord, linkConfig, onClose, initialMode, hideNavigation, hideActions, hideHeader, embedded, defaultValues 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [tempRecord, setTempRecord] = useState<Record<string, any>>({});
  
  // Modals state
  const [lookupModal, setLookupModal] = useState<{ isOpen: boolean; targetTableId: string; sourceFieldName: string; formId?: string } | null>(null);
  const [subformModal, setSubformModal] = useState<{ isOpen: boolean; formId: string; parentField: string; childField: string; linkValue: any } | null>(null);

  const sourceTable = allTables.find(t => t.id === form.sourceId);
  const isUnbound = !form.sourceId || form.sourceId === '';
  const isReadOnly = form.mode === 'readonly' || initialMode === 'readonly' || form.sourceType === 'query' || (!sourceTable && !isUnbound);
  
  const data = isSubform ? (filteredData || []) : (sourceTable?.data || []);
  
  const currentRecord = (isCreating || isUnbound) ? tempRecord : (data[currentIndex] || {});

  useEffect(() => {
    if (!isCreating && !isUnbound) {
        if (currentIndex >= data.length && data.length > 0) setCurrentIndex(data.length - 1);
        else if (data.length === 0) setCurrentIndex(0);
    }
  }, [data.length, isCreating, isUnbound]);

  const handleInputChange = (fieldName: string, value: any) => {
      if (isReadOnly) return;

      if (isCreating || isUnbound) {
          setTempRecord(prev => ({ ...prev, [fieldName]: value }));
          return;
      }

      if (!sourceTable) return;

      const originalIndex = isSubform 
        ? sourceTable.data?.findIndex(row => JSON.stringify(row) === JSON.stringify(currentRecord)) 
        : currentIndex;
        
      if (originalIndex === undefined || originalIndex === -1) return;
      
      const newData = [...sourceTable.data!];
      newData[originalIndex] = { ...newData[originalIndex], [fieldName]: value };
      onTableChange({ ...sourceTable, data: newData });
  };

  const getFieldName = (fieldId: string) => {
      for (const t of allTables) {
          const f = t.fields.find(field => field.id === fieldId);
          if (f) return f.name;
      }
      return '';
  };

  // Generic Create Logic (Used by Inline New and Modal New)
  const prepareNewRecord = (table: Table, masterFieldId?: string, childFieldId?: string, parentVal?: any) => {
      let initialData = table.fields.reduce((acc, field) => {
        if (field.defaultValue !== undefined && field.defaultValue !== '') {
            if (field.type === 'BOOLEAN') {
                acc[field.name] = field.defaultValue === 'true';
            } else if ((field.type === 'DATE' || field.type === 'TIME' || field.type === 'DATETIME' || field.type === 'TIMESTAMP') && field.defaultValue.toUpperCase() === 'NOW') {
                acc[field.name] = new Date().toISOString();
            } else {
                acc[field.name] = field.defaultValue;
            }
        } else {
            acc[field.name] = '';
        }
        return acc;
      }, {} as Record<string, any>);

      if(masterFieldId && childFieldId && parentVal !== undefined) {
          const childFieldName = table.fields.find(f => f.id === childFieldId)?.name;
          if (childFieldName) {
              initialData[childFieldName] = parentVal;
          }
      }
      return initialData;
  };

  const startCreate = () => {
      if (isReadOnly || !sourceTable) return;
      
      let initialData = prepareNewRecord(sourceTable);

      // Pre-fill Foreign Keys if Subform
      if(isSubform && parentRecord && linkConfig) {
          const masterFieldName = getFieldName(linkConfig.masterFieldId);
          if (masterFieldName && parentRecord[masterFieldName] !== undefined) {
              // Re-run prepare with link info
              initialData = prepareNewRecord(sourceTable, linkConfig.masterFieldId, linkConfig.childFieldId, parentRecord[masterFieldName]);
          }
      } 
      
      if (defaultValues) {
          initialData = { ...initialData, ...defaultValues };
      }
      
      setTempRecord(initialData);
      setIsCreating(true);
  };

  const saveNewRecord = () => {
      if (!sourceTable) return;
      const recordToSave = { ...tempRecord };
      
      // Auto Increment ID
      sourceTable.fields.forEach(f => {
          if (f.isAutoIncrement && f.type === 'INTEGER' && !recordToSave[f.name]) {
               const maxVal = (sourceTable.data || []).reduce((max, row) => {
                  const val = parseInt(row[f.name], 10);
                  return !isNaN(val) && val > max ? val : max;
              }, 0);
              recordToSave[f.name] = maxVal + 1;
          }
      });

      const newData = [...(sourceTable.data || []), recordToSave];
      onTableChange({ ...sourceTable, data: newData });
      
      // Stay in create mode, just clear the form for the next record (MS Access style)
      let initialData: Record<string, any> = {};
      if (defaultValues) {
          initialData = { ...initialData, ...defaultValues };
      }
      setTempRecord(initialData);
  };

  const cancelCreate = () => {
      setIsCreating(false);
      setTempRecord({});
      if (onClose) onClose();
  };

  const deleteCurrentRecord = () => {
     if (isReadOnly || data.length === 0 || !sourceTable || isCreating) return;
     showConfirmation(
      'Datensatz löschen',
      'Möchten Sie diesen Datensatz wirklich löschen?',
      () => {
        const originalIndex = isSubform 
            ? sourceTable.data?.findIndex(row => JSON.stringify(row) === JSON.stringify(currentRecord)) 
            : currentIndex;
            
        if (originalIndex === undefined || originalIndex === -1) return;

        const newFullData = (sourceTable.data || []).filter((_, i) => i !== originalIndex);
        onTableChange({...sourceTable, data: newFullData});
      }
     );
  };

  const getLookupOptions = (config: any) => {
      const table = allTables.find(t => t.id === config.tableId);
      if (!table || !table.data) return [];
      
      let rows = [...table.data];
      
      if (config.sort && config.sort.fieldId) {
          const sortField = table.fields.find(f => f.id === config.sort.fieldId);
          if (sortField) {
              const fieldName = sortField.name;
              const direction = config.sort.direction || 'ASC';
              rows.sort((a, b) => {
                  const valA = a[fieldName];
                  const valB = b[fieldName];
                  if (valA === undefined || valA === null) return 1;
                  if (valB === undefined || valB === null) return -1;
                  
                  let comparison = 0;
                  if (typeof valA === 'number' && typeof valB === 'number') {
                      comparison = valA - valB;
                  } else {
                      comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
                  }
                  return direction === 'ASC' ? comparison : -comparison;
              });
          }
      }
      
      if (config.displayFormat && config.displayFormat.length > 0) {
          return rows.map(row => {
              const label = config.displayFormat.map((item: any) => {
                  const f = table.fields.find(field => field.id === item.fieldId);
                  return `${item.prefix || ''}${f ? row[f.name] : ''}${item.suffix || ''}`;
              }).join('');
              const valField = table.fields.find(f => f.id === config.valueFieldId) || table.fields.find(f => f.isPrimaryKey);
              return { value: valField ? row[valField.name] : '', label: label };
          });
      }
      return rows.map(row => ({ value: row.id || Object.values(row)[0], label: Object.values(row).slice(0, 2).join(' ') }));
  };

  // --- Subform Modal Logic ---
  const handleOpenSubformModal = (formId: string, masterFieldId: string, childFieldId: string) => {
      if (!sourceTable || !currentRecord) return;
      const masterFieldName = getFieldName(masterFieldId);
      const linkValue = currentRecord[masterFieldName];
      
      setSubformModal({
          isOpen: true,
          formId,
          parentField: masterFieldId,
          childField: childFieldId,
          linkValue
      });
  };

  const handleSubformSaveFromModal = (updatedTable: Table) => {
      onTableChange(updatedTable);
      // Close modal
      setSubformModal(null);
  };

  const evalVisibility = (el: FormElement) => {
      // Role check (mocked for now, assuming current user has 'admin' or no restrictions)
      if (el.allowedRoles && el.allowedRoles.length > 0) {
          // If we had a real user context, we'd check roles here. 
          // For now, we allow it if we're in designer or assume 'admin' is always granted.
          // In a real app, this would be: if (!el.allowedRoles.includes(currentUser.role)) return false;
      }

      if (!el.visibilityCondition || !el.visibilityCondition.fieldId) return true;
      const targetField = sourceTable?.fields.find(f => f.id === el.visibilityCondition!.fieldId);
      if (!targetField) return true;
      
      const val = currentRecord[targetField.name];
      const checkVal = el.visibilityCondition.value;
      
      if (el.visibilityCondition.operator === 'eq') return String(val || '') === String(checkVal || '');
      if (el.visibilityCondition.operator === 'neq') return String(val || '') !== String(checkVal || '');
      
      return true;
  };

  const renderElement = (el: FormElement) => {
      if (!evalVisibility(el)) return null;

      if (el.type === 'container') return <div key={el.id} className={el.className}>{el.children?.map(renderElement)}</div>;
      if (el.type === 'label') return <div key={el.id} className={el.className}>{el.label}</div>;
      if (el.type === 'field') {
          return <FormWidget 
            key={el.id} element={el} value={currentRecord[allTables.find(t=>t.id===form.sourceId)?.fields.find(f=>f.id===el.fieldId)?.name || ''] ?? ''}
            sourceTable={sourceTable} isReadOnly={isReadOnly} onChange={handleInputChange} getLookupOptions={getLookupOptions}
            onOpenLookupModal={(tid, fname, fid) => setLookupModal({ isOpen: true, targetTableId: tid, sourceFieldName: fname, formId: fid })}
          />;
      }
      if (el.type === 'subform' && el.subform) {
          // --- LOGIC CHANGE: BLOCK SUBFORM IF PARENT IS CREATING ---
          if (isCreating) {
              return (
                  <div key={el.id} className={`border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 mt-4 text-center ${el.className || ''}`}>
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                          <AlertCircle size={24} />
                          <p className="font-semibold text-sm">Unterformular "{el.label}" nicht verfügbar</p>
                          <p className="text-xs">Bitte speichern Sie den Hauptdatensatz, bevor Sie Einträge hinzufügen.</p>
                      </div>
                  </div>
              );
          }

          const subDef = allForms.find(f => f.id === el.subform!.formId);
          if (!subDef) return <div key={el.id} className="text-red-500">Subform nicht gefunden.</div>;
          
          const subTable = allTables.find(t => t.id === subDef.sourceId);
          let subformData: Record<string, any>[] = [];
          
          if (sourceTable && subTable && currentRecord) {
             const masterLinkField = sourceTable.fields.find(f => f.id === el.subform!.masterLinkFieldId);
             const childLinkField = subTable.fields.find(f => f.id === el.subform!.childLinkFieldId);
             if (masterLinkField && childLinkField) {
                 const linkValue = currentRecord[masterLinkField.name];
                 subformData = (subTable.data || []).filter(row => row[childLinkField.name] == linkValue);
             }
          }

          return (
            <div key={el.id} className={`border border-slate-300 rounded-md overflow-hidden mt-4 ${el.className || ''}`}>
                <div className="bg-slate-100 p-2 flex justify-between items-center border-b border-slate-200">
                    <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
                        <Layout size={14}/> {el.label || subDef.name} ({subformData.length})
                    </span>
                    {!isReadOnly && el.subform.canAdd && (
                        <button 
                            onClick={() => handleOpenSubformModal(el.subform!.formId, el.subform!.masterLinkFieldId, el.subform!.childLinkFieldId)}
                            className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded px-2 py-1 text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                        >
                            <Plus size={12} strokeWidth={3}/> Eintrag hinzufügen
                        </button>
                    )}
                </div>
                <div className="p-2 bg-slate-50/50">
                    {subformData.length > 0 ? (
                        <FormView 
                            form={subDef}
                            allForms={allForms}
                            allTables={allTables}
                            onTableChange={onTableChange}
                            showConfirmation={showConfirmation}
                            isSubform={true}
                            filteredData={subformData}
                            parentRecord={currentRecord}
                            linkConfig={{ masterFieldId: el.subform!.masterLinkFieldId, childFieldId: el.subform!.childLinkFieldId }}
                        />
                    ) : (
                        <div className="p-6 text-center">
                            <p className="text-slate-400 text-sm mb-3">Keine Einträge vorhanden.</p>
                            {!isReadOnly && el.subform.canAdd && (
                                <button 
                                    onClick={() => handleOpenSubformModal(el.subform!.formId, el.subform!.masterLinkFieldId, el.subform!.childLinkFieldId)}
                                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-blue-100 transition-colors mx-auto flex items-center gap-2"
                                >
                                    <Plus size={14}/> Ersten Eintrag erstellen
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

  const handleQuickCreateSave = (updatedTable: Table) => {
      onTableChange(updatedTable);
      const lastRow = updatedTable.data?.[updatedTable.data.length - 1];
      if (lastRow && lookupModal) {
          const targetTable = allTables.find(t => t.id === lookupModal.targetTableId);
          const pkField = updatedTable.fields.find(f => f.isPrimaryKey);
          if (pkField) {
              handleInputChange(lookupModal.sourceFieldName, lastRow[pkField.name]);
          }
      }
      setLookupModal(null);
  };

  // --- Modals Render ---
  const renderLookupModal = () => {
      if (!lookupModal || !lookupModal.isOpen) return null;
      const targetTable = allTables.find(t => t.id === lookupModal.targetTableId);
      if (!targetTable) return null;
      let targetForm = lookupModal.formId ? allForms.find(f => f.id === lookupModal.formId) : undefined;

      if (!targetForm) {
          targetForm = {
              id: 'temp_qc_' + crypto.randomUUID(),
              name: `Neu: ${targetTable.name}`,
              sourceType: 'table',
              sourceId: targetTable.id,
              layout: {
                  id: 'root', type: 'container', className: 'p-6 space-y-4',
                  children: targetTable.fields.filter(f => !f.isAutoIncrement).map(f => ({
                      id: f.id, type: 'field', fieldId: f.id, label: f.name, className: 'mb-4'
                  }))
              },
              fields: []
          };
      }

      return (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white w-full max-w-3xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden relative border border-slate-300">
                  <div className="flex justify-between items-center bg-slate-100 p-2 px-4 border-b border-slate-200 shrink-0">
                      <span className="text-sm font-bold text-slate-600 flex items-center gap-2"><ExternalLink size={14}/> Quick Create: {targetTable.name}</span>
                      <button onClick={() => setLookupModal(null)} className="p-1 hover:bg-slate-200 rounded text-slate-500"><X size={18}/></button>
                  </div>
                  <div className="flex-1 overflow-hidden relative">
                    <FormView 
                        form={targetForm}
                        allForms={allForms}
                        allTables={allTables}
                        onTableChange={handleQuickCreateSave}
                        showConfirmation={showConfirmation}
                        isSubform={false}
                        onClose={() => setLookupModal(null)}
                        linkConfig={undefined} // Quick Create usually doesn't cascade yet
                    />
                  </div>
              </div>
          </div>
      );
  };

  const renderSubformModal = () => {
      if (!subformModal || !subformModal.isOpen) return null;
      const targetForm = allForms.find(f => f.id === subformModal.formId);
      if (!targetForm) return null;
      const targetTable = allTables.find(t => t.id === targetForm.sourceId);
      if (!targetTable) return null;

      return (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden relative border border-slate-300">
                  <div className="flex justify-between items-center bg-indigo-50 p-3 px-4 border-b border-indigo-100 shrink-0">
                      <span className="text-sm font-bold text-indigo-800 flex items-center gap-2"><Layout size={14}/> Eintrag hinzufügen: {targetForm.name}</span>
                      <button onClick={() => setSubformModal(null)} className="p-1 hover:bg-indigo-100 rounded text-indigo-400"><X size={18}/></button>
                  </div>
                  <div className="flex-1 overflow-hidden relative">
                    {/* We pass a parentRecord prop so the child form knows how to link */}
                    <FormView 
                        form={targetForm}
                        allForms={allForms}
                        allTables={allTables}
                        onTableChange={handleSubformSaveFromModal}
                        showConfirmation={showConfirmation}
                        isSubform={false} // It's a modal top-level view now
                        parentRecord={currentRecord} // Pass current parent record
                        linkConfig={{ masterFieldId: subformModal.parentField, childFieldId: subformModal.childField }}
                        onClose={() => setSubformModal(null)}
                    />
                  </div>
              </div>
          </div>
      );
  };

  const headerColorClass = isCreating 
    ? 'bg-emerald-600 text-white' 
    : (isSubform ? 'bg-indigo-100 text-indigo-900 border-b border-indigo-200' : 'bg-slate-800 text-white');

  // Trigger Auto-Create for Modal instances if needed
  useEffect(() => {
      if (linkConfig && parentRecord && !isSubform && !isCreating && data.length === 0 && !isReadOnly) {
          // If opened in modal with link config and empty, auto-start create
          startCreate();
      }
  }, [linkConfig]);

  // Auto-start creation mode if requested via initialMode prop
  useEffect(() => {
      if (initialMode === 'create' && !isCreating && sourceTable && !isReadOnly) {
          startCreate();
      }
  }, [initialMode, sourceTable, isReadOnly]);

  return (
    <div className={`h-full flex flex-col ${isSubform || embedded || (form.settings?.isFullScreen && !embedded) ? '' : 'p-4 bg-slate-100'}`}>
        <div className={`bg-white shadow border border-slate-200 rounded-lg flex flex-col h-full ${(form.settings?.isFullScreen && !embedded) ? 'fixed inset-0 z-[100] m-0 rounded-none' : 'max-w-4xl mx-auto w-full'}`}>
            
            {/* Header */}
            {!hideHeader && (
                <div className={`${headerColorClass} p-3 font-bold flex justify-between items-center shrink-0 transition-colors duration-300`}>
                    <div className="flex items-center gap-2">
                        {isCreating ? <Plus size={20}/> : null}
                        <span>{isCreating ? 'Neuer Datensatz' : form.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isCreating && <span className="text-xs bg-white/20 px-2 py-0.5 rounded">{data.length > 0 ? `${currentIndex + 1} / ${data.length}` : '0 / 0'}</span>}
                        {!!onClose && (
                            <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded transition-colors" title="Schließen"><X size={18} /></button>
                        )}
                    </div>
                </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
                {(isUnbound || data.length > 0 || isCreating) ? (form.layout ? renderElement(form.layout) : <div>Kein Layout definiert.</div>) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <p className="mb-4">Keine Daten vorhanden.</p>
                        {!isReadOnly && !isCreating && (
                            <button onClick={startCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm transition-all">
                                <Plus size={16}/> Ersten Datensatz anlegen
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            {(!isUnbound && (isCreating || !hideNavigation || !hideActions || !!onClose)) && (
                <div className={`p-3 border-t border-slate-200 flex justify-between shrink-0 rounded-b-lg items-center ${isCreating ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                    {isCreating ? (
                        <div className="flex justify-end gap-2 w-full">
                            <button onClick={cancelCreate} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-100 flex items-center gap-2 text-sm font-medium">
                                <XCircle size={16} /> Abbrechen
                            </button>
                            <button onClick={saveNewRecord} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-2 text-sm font-medium shadow-sm">
                                <CheckCircle size={16} /> Speichern
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex gap-4 items-center">
                                {!hideNavigation && (
                                    <div className="flex gap-1 bg-white border border-slate-200 rounded p-0.5 shadow-sm">
                                        <button className="p-1 hover:bg-slate-100 rounded disabled:opacity-30" onClick={() => setCurrentIndex(0)} disabled={currentIndex === 0}><ChevronsLeft size={16}/></button>
                                        <button className="p-1 hover:bg-slate-100 rounded disabled:opacity-30" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}><ChevronLeft size={16}/></button>
                                        <span className="text-xs text-slate-500 font-medium px-2 flex items-center">{data.length > 0 ? `${currentIndex + 1} / ${data.length}` : '0 / 0'}</span>
                                        <button className="p-1 hover:bg-slate-100 rounded disabled:opacity-30" onClick={() => setCurrentIndex(Math.min(data.length - 1, currentIndex + 1))} disabled={currentIndex >= data.length - 1}><ChevronRight size={16}/></button>
                                        <button className="p-1 hover:bg-slate-100 rounded disabled:opacity-30" onClick={() => setCurrentIndex(data.length - 1)} disabled={currentIndex >= data.length - 1}><ChevronsRight size={16}/></button>
                                    </div>
                                )}
                                {(!isReadOnly && !hideActions) && (
                                    <div className="flex gap-1">
                                        <button className="p-1.5 hover:bg-slate-200 rounded text-blue-600 transition-colors" onClick={startCreate} title="Neuer Datensatz">
                                            <Plus size={18}/>
                                        </button>
                                        <button className="p-1.5 hover:bg-slate-200 rounded text-red-500 disabled:opacity-50 transition-colors" onClick={deleteCurrentRecord} disabled={data.length === 0} title="Löschen">
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end gap-2 flex-1">
                                {!!onClose && (
                                    <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-100 flex items-center gap-2 text-sm font-medium transition-colors">
                                        <XCircle size={16} /> Schließen
                                    </button>
                                )}
                                {(!isReadOnly && !hideActions) && (
                                    <button onClick={() => { /* Autosaved */ }} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-2 text-sm font-medium shadow-sm transition-colors">
                                        <CheckCircle size={16} /> Gespeichert
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
        {renderLookupModal()}
        {renderSubformModal()}
    </div>
  );
};
