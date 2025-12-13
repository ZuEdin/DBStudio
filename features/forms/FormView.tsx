
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Form, Table, FormElement } from '../../types/index';
import { 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, Trash2, ShieldQuestion, X, Save
} from 'lucide-react';

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
  permissions?: { canAdd: boolean, canDelete: boolean, canEdit: boolean };
  startInAddMode?: boolean; 
  hideNavigation?: boolean; // New prop to hide footer
}

export const FormView: React.FC<FormViewProps> = ({ 
  form, 
  allForms,
  allTables,
  onTableChange,
  showConfirmation,
  isSubform = false,
  filteredData,
  parentRecord,
  linkConfig,
  permissions = { canAdd: true, canDelete: true, canEdit: true },
  startInAddMode = false,
  hideNavigation = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // State for Lookup "Quick Create" Modal
  const [lookupModal, setLookupModal] = useState<{
      isOpen: boolean;
      targetTableId: string;
      sourceFieldName: string; 
      initialRowCount: number;
      targetFormId?: string; 
  } | null>(null);

  const sourceTable = allTables.find(t => t.id === form.sourceId);
  const isDisplayMode = form.mode === 'readonly';
  const isQuerySource = form.sourceType === 'query';
  
  const isReadOnly = isDisplayMode || isQuerySource || !sourceTable || (isSubform && !permissions.canEdit);

  const data = isSubform ? (filteredData || []) : (sourceTable?.data || []);
  const currentRecord = data[currentIndex] || {};

  useEffect(() => {
    if (currentIndex >= data.length && data.length > 0) {
      setCurrentIndex(data.length - 1);
    } else if (data.length === 0 && !startInAddMode) {
        setCurrentIndex(0);
    }
  }, [data.length]); 

  // Initial Add Mode effect
  useEffect(() => {
      if (startInAddMode && !isReadOnly && permissions.canAdd) {
          addNewRecord();
      }
  }, []); 

  const handleInputChange = (fieldName: string, value: any) => {
    if (isReadOnly || !sourceTable) return;

    // Determine the index in the actual source table
    let originalIndex = -1;

    if (isSubform) {
        // If subform, we must find the record in the main table data
        originalIndex = sourceTable?.data?.findIndex(row => 
            JSON.stringify(row) === JSON.stringify(currentRecord)
        ) ?? -1;
    } else {
        // If main form (or modal acting as main form), currentIndex matches the data array
        originalIndex = currentIndex;
    }

    if (originalIndex === undefined || originalIndex === -1 || !sourceTable.data) return;

    const newFullData = [...sourceTable.data];
    if (newFullData[originalIndex]) {
      newFullData[originalIndex] = { ...newFullData[originalIndex], [fieldName]: value };
    }
    
    onTableChange({ ...sourceTable, data: newFullData });
  };
  
  const navigate = (index: number) => {
    if (index >= 0 && index < data.length) {
      setCurrentIndex(index);
    }
  };

  const addNewRecord = () => {
    if (isQuerySource || !sourceTable) return;
    if (isSubform && !permissions.canAdd) return;
    
    let newRow = sourceTable.fields.reduce((acc, field) => {
        if (field.isAutoIncrement && field.type === 'INTEGER') {
             const maxVal = (sourceTable.data || []).reduce((max, row) => {
                const val = parseInt(row[field.name], 10);
                return !isNaN(val) && val > max ? val : max;
            }, 0);
            acc[field.name] = maxVal + 1;
        } else {
            acc[field.name] = ''; 
        }
        return acc;
    }, {} as Record<string, any>);

    if(isSubform && parentRecord && linkConfig) {
        const childField = sourceTable.fields.find(f => f.id === linkConfig.childFieldId);
        const parentTable = allTables.find(t => t.fields.some(f => f.id === linkConfig.masterFieldId));
        const masterField = parentTable?.fields.find(f => f.id === linkConfig.masterFieldId);

        if(childField && masterField) {
            newRow[childField.name] = parentRecord[masterField.name];
        }
    }

    const newData = [...(sourceTable.data || []), newRow];
    onTableChange({ ...sourceTable, data: newData});
    
    if(!isSubform) {
        // Immediate jump to new record for main forms
        // We use the length of the new array because index is 0-based
        setCurrentIndex(newData.length - 1);
    }
  };
  
  const deleteCurrentRecord = () => {
     if (isQuerySource || data.length === 0 || !sourceTable) return;
     if (isSubform && !permissions.canDelete) return;

     showConfirmation(
      'Datensatz löschen',
      'Möchten Sie diesen Datensatz wirklich löschen?',
      () => {
        let originalIndex = -1;
        if (isSubform) {
             originalIndex = sourceTable.data?.findIndex(row => 
                JSON.stringify(row) === JSON.stringify(currentRecord)
            ) ?? -1;
        } else {
            originalIndex = currentIndex;
        }

        if (originalIndex === -1) return;

        const newFullData = (sourceTable.data || []).filter((_, i) => i !== originalIndex);
        onTableChange({...sourceTable, data: newFullData});
        
        if (currentIndex >= newFullData.length) {
            setCurrentIndex(Math.max(0, newFullData.length - 1));
        }
      }
     );
  };

  // --- Lookup Logic ---

  const getLookupOptions = (lookupConfig: { tableId: string, valueFieldId: string, labelFields: string[], displayFormat?: { fieldId: string, prefix?: string, suffix?: string }[], sort?: { fieldId: string, direction: 'ASC' | 'DESC' } }) => {
      const table = allTables.find(t => t.id === lookupConfig.tableId);
      if (!table) return [];
      
      const valueField = table.fields.find(f => f.id === lookupConfig.valueFieldId)?.name;
      if (!valueField || !table.data) return [];

      let sortedData = [...table.data];

      // Smart Sort Implementation
      if (lookupConfig.sort && lookupConfig.sort.fieldId) {
          const sortField = table.fields.find(f => f.id === lookupConfig.sort!.fieldId);
          if (sortField) {
              const directionMultiplier = lookupConfig.sort.direction === 'DESC' ? -1 : 1;
              const isNumeric = sortField.type === 'INTEGER' || sortField.type === 'DECIMAL' || sortField.type === 'DOUBLE';

              sortedData.sort((a, b) => {
                  const valA = a[sortField.name];
                  const valB = b[sortField.name];

                  if (valA === valB) return 0;
                  if (valA === null || valA === undefined) return 1; // Nulls last
                  if (valB === null || valB === undefined) return -1;

                  if (isNumeric) {
                      return (Number(valA) - Number(valB)) * directionMultiplier;
                  } else {
                      return String(valA).localeCompare(String(valB)) * directionMultiplier;
                  }
              });
          }
      } else {
          // Default sorting (e.g. by first label field or ID if no sort config)
          // Typically ID or First Display Field is good
      }

      return sortedData.map(row => {
          let label = '';
          
          if (lookupConfig.displayFormat && lookupConfig.displayFormat.length > 0) {
              label = lookupConfig.displayFormat.map(item => {
                  const fName = table.fields.find(f => f.id === item.fieldId)?.name;
                  const val = fName ? row[fName] : '';
                  return `${item.prefix || ''}${val}${item.suffix || ''}`;
              }).join('');
          } else {
              label = (lookupConfig.labelFields || []).map(fid => {
                  const fName = table.fields.find(f => f.id === fid)?.name;
                  return fName ? row[fName] : '';
              }).filter(val => val !== undefined && val !== null && val !== '').join(' ');
          }
          
          return {
              value: row[valueField],
              label: label || `ID: ${row[valueField]}`
          };
      });
  };

  const handleOpenLookupModal = (tableId: string, fieldName: string, configFormId?: string) => {
      const table = allTables.find(t => t.id === tableId);
      setLookupModal({
          isOpen: true,
          targetTableId: tableId,
          sourceFieldName: fieldName,
          initialRowCount: table?.data?.length || 0,
          targetFormId: configFormId
      });
  };

  const handleCloseLookupModal = () => {
      if (!lookupModal) return;
      
      // Auto-select logic
      const table = allTables.find(t => t.id === lookupModal.targetTableId);
      if (table && table.data && table.data.length > lookupModal.initialRowCount) {
          const newRecord = table.data[table.data.length - 1];
          const pkField = table.fields.find(f => f.isPrimaryKey);
          
          if (pkField && newRecord) {
              const newValue = newRecord[pkField.name];
              handleInputChange(lookupModal.sourceFieldName, newValue);
          }
      }

      setLookupModal(null);
  };

  // --- Rendering ---

  const renderElement = (el: FormElement) => {
      if (el.type === 'container') {
          return (
              <div key={el.id} className={el.className}>
                  {el.children?.map(child => renderElement(child))}
              </div>
          );
      } else if (el.type === 'label') {
          return <div key={el.id} className={el.className}>{el.label}</div>;
      } else if (el.type === 'field' && el.fieldId) {
          const field = sourceTable?.fields.find(f => f.id === el.fieldId);
          if (!field && !isQuerySource) return null; 
          
          let fieldName = field?.name || '';
          let fieldType = field?.type || 'VARCHAR';
          
          const value = currentRecord[fieldName] ?? '';
          const label = el.label || fieldName;
          const elementId = `field_${el.id}`; // Generate a unique ID for the input
          
          let widget = el.widgetType;
          if (!widget) {
              if (fieldType === 'BOOLEAN') widget = 'checkbox';
              else if (fieldType === 'DATE') widget = 'date';
              else if (fieldType === 'INTEGER' || fieldType === 'DECIMAL') widget = 'number';
              else widget = 'text';
          }

          if (widget === 'checkbox') {
              return (
                  <div key={el.id} className={el.className}>
                      <div className="flex items-center gap-2 mt-6 mb-2">
                          <input 
                              id={elementId}
                              name={fieldName}
                              type="checkbox"
                              disabled={isReadOnly || field?.isAutoIncrement}
                              checked={!!value}
                              onChange={e => handleInputChange(fieldName, e.target.checked)}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor={elementId} className="text-sm font-semibold text-slate-700 cursor-pointer">{label}</label>
                      </div>
                  </div>
              );
          }

          if (widget === 'select' && el.lookup) {
              const options = getLookupOptions(el.lookup);
              
              if (isReadOnly) {
                  const selectedOption = options.find(o => String(o.value) === String(value));
                  return (
                      <div key={el.id} className={el.className}>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">{label}</label>
                        <div className="w-full border-b border-slate-300 py-2 text-slate-800 text-sm min-h-[36px]">
                            {selectedOption ? selectedOption.label : <span className="text-slate-400 italic">{value || 'Leer'}</span>}
                        </div>
                      </div>
                  );
              }

              return (
                  <div key={el.id} className={el.className}>
                      <label htmlFor={elementId} className="block text-sm font-semibold text-slate-600 mb-1">{label}</label>
                      <div className="flex gap-2">
                        <select
                            id={elementId}
                            name={fieldName}
                            disabled={isReadOnly}
                            value={value}
                            onChange={e => handleInputChange(fieldName, e.target.value)}
                            className="flex-1 border border-slate-300 rounded p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Bitte wählen...</option>
                            {options.map((opt, idx) => (
                                <option key={`${opt.value}-${idx}`} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {el.lookup.allowQuickCreate && (
                            <button 
                                onClick={() => el.lookup && handleOpenLookupModal(el.lookup.tableId, fieldName, el.lookup.quickCreateFormId)}
                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 rounded px-3 flex items-center justify-center transition-colors"
                                title="Neuen Eintrag erstellen"
                            >
                                <Plus size={18} />
                            </button>
                        )}
                      </div>
                  </div>
              );
          }

          if (widget === 'textarea') {
               return (
                  <div key={el.id} className={el.className}>
                      <label htmlFor={elementId} className="block text-sm font-semibold text-slate-600 mb-1">{label}</label>
                      {isReadOnly ? (
                            <div className="w-full border-b border-slate-300 py-2 text-slate-800 text-sm min-h-[36px] whitespace-pre-wrap">
                                {value}
                            </div>
                        ) : (
                            <textarea
                                id={elementId}
                                name={fieldName}
                                readOnly={isReadOnly}
                                value={value}
                                onChange={(e) => handleInputChange(fieldName, e.target.value)}
                                className="w-full border border-slate-300 rounded p-2 text-sm"
                                rows={3}
                            />
                        )}
                  </div>
              );
          }

          return (
              <div key={el.id} className={el.className}>
                  <label htmlFor={elementId} className="block text-sm font-semibold text-slate-600 mb-1">{label}</label>
                  {isReadOnly ? (
                        <div className="w-full border-b border-slate-300 py-2 text-slate-800 text-sm min-h-[36px]">
                            {value !== '' ? value : <span className="text-slate-400 italic">Leer</span>}
                        </div>
                    ) : (
                        <input
                          id={elementId}
                          name={fieldName}
                          autoComplete="off"
                          type={widget === 'date' ? 'date' : widget === 'number' ? 'number' : 'text'}
                          readOnly={isReadOnly || field?.isAutoIncrement}
                          value={value}
                          onChange={(e) => handleInputChange(fieldName, e.target.value)}
                          className={`w-full border border-slate-300 rounded p-2 text-sm ${field?.isAutoIncrement ? 'bg-slate-100 text-slate-500 cursor-not-allowed italic' : ''}`}
                        />
                    )}
              </div>
          );
      } else if (el.type === 'subform' && el.subform) {
          const subformDef = allForms.find(f => f.id === el.subform!.formId);
          if (!subformDef) return null;
          
          const subTable = allTables.find(t => t.id === subformDef.sourceId);
          const masterField = sourceTable?.fields.find(f => f.id === el.subform!.masterLinkFieldId);
          const childField = subTable?.fields.find(f => f.id === el.subform!.childLinkFieldId);
          
          let subData: Record<string, any>[] = [];
          if (subTable && masterField && childField && currentRecord) {
             const linkVal = currentRecord[masterField.name];
             subData = (subTable.data || []).filter(r => r[childField.name] == linkVal);
          }

          const subPermissions = {
              canAdd: el.subform.canAdd !== false,
              canDelete: el.subform.canDelete !== false,
              canEdit: el.subform.canEdit !== false
          };

          return (
              <div key={el.id} className={el.className}>
                  <FormView 
                    form={subformDef}
                    allForms={allForms}
                    allTables={allTables}
                    onTableChange={onTableChange}
                    showConfirmation={showConfirmation}
                    isSubform={true}
                    filteredData={subData}
                    parentRecord={currentRecord}
                    linkConfig={{ masterFieldId: el.subform!.masterLinkFieldId, childFieldId: el.subform!.childLinkFieldId }}
                    permissions={subPermissions}
                  />
              </div>
          );
      }
      return null;
  };

  const isFullScreen = form.settings?.isFullScreen;

  // Determine modal content if open
  let modalContent = null;
  if (lookupModal) {
      const targetTable = allTables.find(t => t.id === lookupModal.targetTableId);
      
      let targetForm = lookupModal.targetFormId 
          ? allForms.find(f => f.id === lookupModal.targetFormId) 
          : allForms.find(f => f.sourceId === lookupModal.targetTableId && f.sourceType === 'table');

      if (targetForm && targetTable) {
          modalContent = (
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col border border-slate-300 overflow-hidden animate-in zoom-in-95 pointer-events-auto">
                  <div className="flex justify-between items-center p-3 bg-slate-800 text-white shrink-0">
                      <span className="font-bold flex items-center gap-2"><Plus size={18}/> Datensatz hinzufügen</span>
                      <button onClick={handleCloseLookupModal} className="hover:text-red-300"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-hidden relative">
                      <FormView 
                          form={targetForm}
                          allForms={allForms}
                          allTables={allTables}
                          onTableChange={onTableChange} 
                          showConfirmation={showConfirmation}
                          isSubform={false} // IMPORTANT: False, so it treats it as a root data source (but focused on the new record)
                          startInAddMode={true} 
                          hideNavigation={true} 
                      />
                  </div>
                  <div className="p-3 bg-slate-100 border-t border-slate-200 text-right shrink-0">
                      <button 
                        onClick={handleCloseLookupModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-semibold flex items-center gap-2 ml-auto"
                      >
                          <Save size={16}/> Fertig & Übernehmen
                      </button>
                  </div>
              </div>
          );
      } else if (targetTable) {
           modalContent = (
              <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center pointer-events-auto">
                  <ShieldQuestion size={48} className="mx-auto text-orange-500 mb-4"/>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Kein Formular gefunden</h3>
                  <p className="text-sm text-slate-600 mb-6">
                      Für die Tabelle "{targetTable.name}" wurde noch kein Formular erstellt. 
                      Bitte erstellen Sie zuerst ein Formular, um Daten hier zu bearbeiten.
                  </p>
                  <button onClick={() => setLookupModal(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded">Schließen</button>
              </div>
           );
      }
  }

  const formContainerClass = isSubform 
    ? "rounded-lg flex-1 flex flex-col min-h-[300px]"
    : isFullScreen 
        ? "w-full h-full bg-white flex flex-col" 
        : "max-w-4xl mx-auto bg-white shadow-lg border border-slate-300 rounded-lg flex-1 flex flex-col h-full max-h-full";

  const wrapperClass = isSubform 
    ? "p-0 h-full flex flex-col"
    : isFullScreen 
        ? "h-full w-full overflow-hidden flex flex-col bg-white"
        : "p-4 sm:p-8 bg-slate-200 h-full overflow-auto flex flex-col";

  return (
    <div className={wrapperClass}>
      {/* Modal Overlay using Portal */}
      {lookupModal && createPortal(
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              {modalContent}
          </div>,
          document.body
      )}

      <div className={formContainerClass}>
        <header className={`${isSubform ? 'bg-indigo-100 text-indigo-900 border-b border-indigo-200' : 'bg-slate-800 text-white'} p-4 ${!isFullScreen && !isSubform ? 'rounded-t-lg' : ''} flex justify-between items-center flex-shrink-0`}>
          <h1 className="text-xl font-bold">{form.name}</h1>
          {isDisplayMode && <span className="text-xs bg-white/20 px-2 py-1 rounded">Detailansicht</span>}
        </header>

        <main className="p-6 flex-1 overflow-y-auto">
          {data.length > 0 || startInAddMode ? (
              form.layout ? renderElement(form.layout) : (
                  <div className="text-red-500">Formular hat kein Layout. Bitte im Designer öffnen.</div>
              )
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                <ShieldQuestion size={48} className="mb-4" />
                <p>Keine Datensätze zum Anzeigen vorhanden.</p>
                {!isQuerySource && !isDisplayMode && permissions.canAdd && (
                    <button onClick={addNewRecord} className="mt-2 text-blue-600 hover:underline">
                        Neuen Datensatz anlegen
                    </button>
                )}
             </div>
          )}
        </main>
        
        {!hideNavigation && (
            <footer className={`${isSubform ? 'bg-indigo-50' : 'bg-slate-100'} border-t ${isSubform ? 'border-indigo-200' : 'border-slate-200'} p-3 flex justify-between items-center ${!isFullScreen && !isSubform ? 'rounded-b-lg' : ''} flex-shrink-0`}>
            <div className="flex items-center gap-2">
                {!isQuerySource && !isDisplayMode && (
                <>
                    {permissions.canAdd && (
                        <button onClick={addNewRecord} title="Neuer Datensatz" className="p-2 hover:bg-slate-200 rounded text-slate-700 flex items-center gap-1 text-sm"><Plus size={16} /> Neu</button>
                    )}
                    {permissions.canDelete && (
                        <button onClick={deleteCurrentRecord} title="Datensatz löschen" disabled={data.length === 0} className="p-2 hover:bg-slate-200 rounded text-slate-700 disabled:text-slate-400"><Trash2 size={16} /></button>
                    )}
                </>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => navigate(0)} disabled={currentIndex === 0} className="p-2 hover:bg-slate-200 rounded disabled:text-slate-400"><ChevronsLeft size={18} /></button>
                <button onClick={() => navigate(currentIndex - 1)} disabled={currentIndex === 0} className="p-2 hover:bg-slate-200 rounded disabled:text-slate-400"><ChevronLeft size={18} /></button>
                <span className="text-sm text-slate-600">
                    Datensatz {data.length > 0 ? currentIndex + 1 : 0} von {data.length}
                </span>
                <button onClick={() => navigate(currentIndex + 1)} disabled={currentIndex >= data.length - 1} className="p-2 hover:bg-slate-200 rounded disabled:text-slate-400"><ChevronRight size={18} /></button>
                <button onClick={() => navigate(data.length - 1)} disabled={currentIndex >= data.length - 1} className="p-2 hover:bg-slate-200 rounded disabled:text-slate-400"><ChevronsRight size={18} /></button>
            </div>
            </footer>
        )}
      </div>
    </div>
  );
};
