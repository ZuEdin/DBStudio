
import React, { useState, useEffect, useRef } from 'react';
import { Form, Table, FormElement } from '../../types/index';
import { ChevronLeft, ChevronRight, Plus, Trash2, Save, X, ChevronsLeft, ChevronsRight, Minimize2, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
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
}

export const FormView: React.FC<FormViewProps> = ({ 
  form, allForms, allTables, onTableChange, showConfirmation, isSubform, filteredData, parentRecord, linkConfig, onClose 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [tempRecord, setTempRecord] = useState<Record<string, any>>({});
  
  const [lookupModal, setLookupModal] = useState<{ isOpen: boolean; targetTableId: string; sourceFieldName: string; formId?: string } | null>(null);

  const sourceTable = allTables.find(t => t.id === form.sourceId);
  const isReadOnly = form.mode === 'readonly' || form.sourceType === 'query' || !sourceTable;
  
  const data = isSubform ? (filteredData || []) : (sourceTable?.data || []);
  
  const currentRecord = isCreating ? tempRecord : (data[currentIndex] || {});

  useEffect(() => {
    if (!isCreating) {
        if (currentIndex >= data.length && data.length > 0) setCurrentIndex(data.length - 1);
        else if (data.length === 0) setCurrentIndex(0);
    }
  }, [data.length, isCreating]);

  const handleInputChange = (fieldName: string, value: any) => {
      if (isReadOnly || !sourceTable) return;

      if (isCreating) {
          setTempRecord(prev => ({ ...prev, [fieldName]: value }));
          return;
      }

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

  const startCreate = () => {
      if (isReadOnly || !sourceTable) return;
      
      // Initialize defaults with type conversion
      let initialData = sourceTable.fields.reduce((acc, field) => {
        if (field.defaultValue !== undefined && field.defaultValue !== '') {
            if (field.type === 'BOOLEAN') {
                acc[field.name] = field.defaultValue === 'true';
            } else if ((field.type === 'DATE' || field.type === 'DATETIME') && field.defaultValue.toUpperCase() === 'NOW') {
                acc[field.name] = new Date().toISOString();
            } else {
                acc[field.name] = field.defaultValue;
            }
        } else {
            acc[field.name] = '';
        }
        return acc;
      }, {} as Record<string, any>);

      // Pre-fill Foreign Keys if Subform using Link Config
      if(isSubform && parentRecord && linkConfig) {
          const masterFieldName = getFieldName(linkConfig.masterFieldId);
          const childFieldName = sourceTable.fields.find(f => f.id === linkConfig.childFieldId)?.name;

          if (masterFieldName && childFieldName && parentRecord[masterFieldName] !== undefined) {
              initialData[childFieldName] = parentRecord[masterFieldName];
          }
      } 
      // Fallback for older configurations (Robustness)
      else if(isSubform && parentRecord) {
        const parentForm = allForms.find(f => f.subform?.formId === form.id);
        if(parentForm && parentForm.subform) {
            const parentSourceTable = allTables.find(t => t.id === parentForm.sourceId);
            const masterLinkField = parentSourceTable?.fields.find(f => f.id === parentForm.subform!.masterLinkFieldId);
            const childLinkField = sourceTable.fields.find(f => f.id === parentForm.subform!.childLinkFieldId);

            if(masterLinkField && childLinkField) {
                initialData[childLinkField.name] = parentRecord[masterLinkField.name];
            }
        }
      }

      setTempRecord(initialData);
      setIsCreating(true);
  };

  const saveNewRecord = () => {
      if (!sourceTable) return;

      // Handle Auto Increment for ID if missing in tempRecord
      const recordToSave = { ...tempRecord };
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
      
      setIsCreating(false);
      if (!isSubform) {
          setCurrentIndex(newData.length - 1);
      }
  };

  const cancelCreate = () => {
      setIsCreating(false);
      setTempRecord({});
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
      
      if (config.displayFormat && config.displayFormat.length > 0) {
          return table.data.map(row => {
              const label = config.displayFormat.map((item: any) => {
                  const f = table.fields.find(field => field.id === item.fieldId);
                  return `${item.prefix || ''}${f ? row[f.name] : ''}${item.suffix || ''}`;
              }).join('');
              const valField = table.fields.find(f => f.id === config.valueFieldId) || table.fields.find(f => f.isPrimaryKey);
              return { value: valField ? row[valField.name] : '', label: label };
          });
      }
      return table.data.map(row => ({ value: row.id || Object.values(row)[0], label: Object.values(row).slice(0, 2).join(' ') }));
  };

  const renderElement = (el: FormElement) => {
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
          if (isCreating) return <div key={el.id} className="p-4 text-center text-slate-400 border border-dashed rounded">Bitte speichern Sie den Datensatz, um Unterformulare zu bearbeiten.</div>;

          const subDef = allForms.find(f => f.id === el.subform!.formId);
          if (!subDef) return null;
          const subTable = allTables.find(t => t.id === subDef.sourceId);
          
          let subformData: Record<string, any>[] = [];
          if (sourceTable && subTable && currentRecord) {
             const masterLinkField = sourceTable.fields.find(f => f.id === el.subform!.masterLinkFieldId);
             const childLinkField = subTable.fields.find(f => f.id === el.subform!.childLinkFieldId);
             if (masterLinkField && childLinkField) {
                 const linkValue = currentRecord[masterLinkField.name];
                 // Use loose equality for ID matching (string vs number)
                 subformData = (subTable.data || []).filter(row => row[childLinkField.name] == linkValue);
             }
          }

          return (
            <div key={el.id} className={el.className}>
                <FormView 
                    form={subDef}
                    allForms={allForms}
                    allTables={allTables}
                    onTableChange={onTableChange}
                    showConfirmation={showConfirmation}
                    isSubform={true}
                    filteredData={subformData}
                    parentRecord={currentRecord}
                    linkConfig={{ // Pass the link config explicitly
                        masterFieldId: el.subform!.masterLinkFieldId,
                        childFieldId: el.subform!.childLinkFieldId
                    }}
                />
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
                    />
                  </div>
              </div>
          </div>
      );
  };

  const headerColorClass = isCreating 
    ? 'bg-emerald-600 text-white' 
    : (isSubform ? 'bg-indigo-100 text-indigo-900 border-b border-indigo-200' : 'bg-slate-800 text-white');

  return (
    <div className={`h-full flex flex-col ${isSubform || form.settings?.isFullScreen ? '' : 'p-4 bg-slate-100'}`}>
        <div className={`bg-white shadow border border-slate-200 rounded-lg flex flex-col h-full ${form.settings?.isFullScreen ? 'fixed inset-0 z-[100] m-0 rounded-none' : 'max-w-4xl mx-auto w-full'}`}>
            
            {/* Header */}
            <div className={`${headerColorClass} p-3 font-bold flex justify-between items-center shrink-0 transition-colors duration-300`}>
                <div className="flex items-center gap-2">
                    {isCreating ? <Plus size={20}/> : null}
                    <span>{isCreating ? 'Neuer Datensatz' : form.name}</span>
                </div>
                <div className="flex items-center gap-3">
                    {!isCreating && <span className="text-xs bg-white/20 px-2 py-0.5 rounded">{data.length > 0 ? `${currentIndex + 1} / ${data.length}` : '0 / 0'}</span>}
                    {form.settings?.isFullScreen && (
                        <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded transition-colors" title="Schließen"><X size={18} /></button>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
                {(data.length > 0 || isCreating) ? (form.layout ? renderElement(form.layout) : <div>Kein Layout definiert.</div>) : (
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
            <div className={`p-3 border-t border-slate-200 flex justify-between shrink-0 rounded-b-lg ${isCreating ? 'bg-emerald-50' : 'bg-slate-50'}`}>
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
                        <div className="flex gap-2">
                            {!isReadOnly && (
                                <>
                                    <button className="p-2 hover:bg-slate-200 rounded text-blue-600" onClick={startCreate} title="Neuer Datensatz">
                                        <Plus size={20}/>
                                    </button>
                                    <button className="p-2 hover:bg-slate-200 rounded text-red-500 disabled:opacity-50" onClick={deleteCurrentRecord} disabled={data.length === 0} title="Löschen">
                                        <Trash2 size={18}/>
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-slate-200 rounded disabled:opacity-30" onClick={() => setCurrentIndex(0)} disabled={currentIndex === 0}><ChevronsLeft size={18}/></button>
                            <button className="p-2 hover:bg-slate-200 rounded disabled:opacity-30" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}><ChevronLeft size={18}/></button>
                            <button className="p-2 hover:bg-slate-200 rounded disabled:opacity-30" onClick={() => setCurrentIndex(Math.min(data.length - 1, currentIndex + 1))} disabled={currentIndex >= data.length - 1}><ChevronRight size={18}/></button>
                            <button className="p-2 hover:bg-slate-200 rounded disabled:opacity-30" onClick={() => setCurrentIndex(data.length - 1)} disabled={currentIndex >= data.length - 1}><ChevronsRight size={18}/></button>
                        </div>
                    </>
                )}
            </div>
        </div>
        {renderLookupModal()}
    </div>
  );
};
