import React, { useState, useEffect } from 'react';
import { Form, Table } from '../../types/index';
import { 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, Trash2, ShieldQuestion 
} from 'lucide-react';

interface FormViewProps {
  form: Form;
  allForms: Form[]; // Needed to render subform
  allTables: Table[]; // Needed to find subform's table
  onTableChange: (table: Table) => void;
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
  // For subforms
  isSubform?: boolean;
  filteredData?: Record<string, any>[];
  parentRecord?: Record<string, any>;
}

export const FormView: React.FC<FormViewProps> = ({ 
  form, 
  allForms,
  allTables,
  onTableChange,
  showConfirmation,
  isSubform = false,
  filteredData,
  parentRecord
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const sourceTable = allTables.find(t => t.id === form.sourceId);
  const isReadOnly = form.sourceType === 'query' || !sourceTable;

  const data = isSubform ? (filteredData || []) : (sourceTable?.data || []);
  const currentRecord = data[currentIndex] || {};

  useEffect(() => {
    if (currentIndex >= data.length && data.length > 0) {
      setCurrentIndex(data.length - 1);
    } else if (data.length === 0) {
        setCurrentIndex(0);
    }
  }, [data, currentIndex]);

  const handleInputChange = (fieldName: string, value: any) => {
    if (isReadOnly || !sourceTable) return;

    // Find the original index in the full table data
    const originalIndex = sourceTable.data?.findIndex(row => 
        JSON.stringify(row) === JSON.stringify(currentRecord)
    );

    if (originalIndex === -1 && data.length > 0) return; // Should not happen

    const newFullData = [...(sourceTable.data || [])];
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
    if (isReadOnly || !sourceTable) return;
    let newRow = sourceTable.fields.reduce((acc, field) => {
        acc[field.name] = '';
        return acc;
    }, {} as Record<string, any>);

    // Correct logic for pre-filling foreign key in subform
    if(isSubform && parentRecord) {
        // Find the parent form configuration that links to this subform
        const parentForm = allForms.find(f => f.subform?.formId === form.id);
        if(parentForm && parentForm.subform) {
            const parentSourceTable = allTables.find(t => t.id === parentForm.sourceId);
            const masterLinkField = parentSourceTable?.fields.find(f => f.id === parentForm.subform!.masterLinkFieldId);
            const childLinkField = sourceTable.fields.find(f => f.id === parentForm.subform!.childLinkFieldId);

            if(masterLinkField && childLinkField) {
                newRow[childLinkField.name] = parentRecord[masterLinkField.name];
            }
        }
    }

    onTableChange({ ...sourceTable, data: [...(sourceTable.data || []), newRow]});
    if(!isSubform) {
        setCurrentIndex(data.length);
    }
  };
  
  const deleteCurrentRecord = () => {
     if (isReadOnly || data.length === 0 || !sourceTable) return;
     showConfirmation(
      'Datensatz löschen',
      'Möchten Sie diesen Datensatz wirklich löschen?',
      () => {
        const originalIndex = sourceTable.data?.findIndex(row => 
            JSON.stringify(row) === JSON.stringify(currentRecord)
        );
        if (originalIndex === -1) return;

        const newFullData = (sourceTable.data || []).filter((_, i) => i !== originalIndex);
        onTableChange({...sourceTable, data: newFullData});
      }
     );
  };
  
  const subformConfig = form.subform;
  const subform = subformConfig ? allForms.find(f => f.id === subformConfig.formId) : null;
  let subformData: Record<string, any>[] = [];
  
  if (subform && subformConfig && sourceTable) {
    const subformTable = allTables.find(t => t.id === subform.sourceId);
    const masterLinkField = sourceTable.fields.find(f => f.id === subformConfig.masterLinkFieldId);
    const childLinkField = subformTable?.fields.find(f => f.id === subformConfig.childLinkFieldId);

    if (subformTable && masterLinkField && childLinkField && currentRecord) {
        const linkValue = currentRecord[masterLinkField.name];
        subformData = (subformTable.data || []).filter(row => row[childLinkField.name] == linkValue);
    }
  }


  const formContainerClass = isSubform 
    ? "border border-indigo-200 bg-indigo-50 rounded-lg flex-1 flex flex-col min-h-[300px]"
    : "max-w-2xl mx-auto bg-white shadow-lg border border-slate-300 rounded-lg flex-1 flex flex-col";

  return (
    <div className={`p-4 sm:p-8 bg-slate-200 h-full overflow-auto flex flex-col ${isSubform ? 'p-0 sm:p-0' : ''}`}>
      <div className={formContainerClass}>
        {/* Form Header */}
        <header className={`${isSubform ? 'bg-indigo-200 text-indigo-900' : 'bg-slate-800 text-white'} p-4 rounded-t-lg`}>
          <h1 className="text-xl font-bold">{form.name}</h1>
          {isReadOnly && <p className="text-xs text-yellow-300 mt-1">Dieses Formular ist schreibgeschützt.</p>}
        </header>

        {/* Form Body */}
        <main className="p-6 space-y-4 flex-1 overflow-y-auto">
          {data.length > 0 ? form.fields.map(fieldDef => {
            const tableField = sourceTable?.fields.find(f => f.id === fieldDef.fieldId);
            if (!tableField) return null;
            
            return (
              <div key={fieldDef.fieldId}>
                <label className="block text-sm font-semibold text-slate-600 mb-1">{fieldDef.label}</label>
                <input
                  type="text"
                  readOnly={isReadOnly}
                  value={currentRecord[tableField.name] ?? ''}
                  onChange={(e) => handleInputChange(tableField.name, e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-sm read-only:bg-slate-100"
                />
              </div>
            )
          }) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <ShieldQuestion size={48} className="mb-4" />
                <p>Keine Datensätze zum Anzeigen vorhanden.</p>
                {!isReadOnly && (
                    <button onClick={addNewRecord} className="mt-2 text-blue-600 hover:underline">
                        Neuen Datensatz anlegen
                    </button>
                )}
             </div>
          )}

          {/* Render Subform */}
          {subform && (
            <div className="mt-6 pt-6 border-t border-slate-300">
              <FormView 
                form={subform}
                allForms={allForms}
                allTables={allTables}
                onTableChange={onTableChange}
                showConfirmation={showConfirmation}
                isSubform={true}
                filteredData={subformData}
                parentRecord={currentRecord}
              />
            </div>
          )}
        </main>
        
        {/* Form Footer / Navigation */}
        <footer className={`${isSubform ? 'bg-indigo-100' : 'bg-slate-100'} border-t ${isSubform ? 'border-indigo-200' : 'border-slate-200'} p-3 flex justify-between items-center rounded-b-lg`}>
           <div className="flex items-center gap-2">
            {!isReadOnly && (
              <>
                <button onClick={addNewRecord} title="Neuer Datensatz" className="p-2 hover:bg-slate-200 rounded text-slate-700 flex items-center gap-1 text-sm"><Plus size={16} /> Neu</button>
                <button onClick={deleteCurrentRecord} title="Datensatz löschen" disabled={data.length === 0} className="p-2 hover:bg-slate-200 rounded text-slate-700 disabled:text-slate-400"><Trash2 size={16} /></button>
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
      </div>
    </div>
  );
};