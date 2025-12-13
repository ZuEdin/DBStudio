
import React, { useState, useEffect, useRef } from 'react';
import { Form, Table, FormElement } from '../../types/index';
import { ChevronLeft, ChevronRight, Plus, Trash2, Save, X, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
}

export const FormView: React.FC<FormViewProps> = ({ 
  form, allForms, allTables, onTableChange, showConfirmation, isSubform, filteredData, parentRecord, linkConfig 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lookupModal, setLookupModal] = useState<{ isOpen: boolean; targetTableId: string; sourceFieldName: string; } | null>(null);

  const sourceTable = allTables.find(t => t.id === form.sourceId);
  const isReadOnly = form.mode === 'readonly' || form.sourceType === 'query' || !sourceTable;
  
  const data = isSubform ? (filteredData || []) : (sourceTable?.data || []);
  const currentRecord = data[currentIndex] || {};

  useEffect(() => {
    if (currentIndex >= data.length && data.length > 0) setCurrentIndex(data.length - 1);
    else if (data.length === 0) setCurrentIndex(0);
  }, [data.length]);

  const handleInputChange = (fieldName: string, value: any) => {
      if (isReadOnly || !sourceTable) return;
      const originalIndex = isSubform 
        ? sourceTable.data?.findIndex(row => JSON.stringify(row) === JSON.stringify(currentRecord)) 
        : currentIndex;
        
      if (originalIndex === undefined || originalIndex === -1) return;
      
      const newData = [...sourceTable.data!];
      newData[originalIndex] = { ...newData[originalIndex], [fieldName]: value };
      onTableChange({ ...sourceTable, data: newData });
  };

  const getLookupOptions = (config: any) => {
      const table = allTables.find(t => t.id === config.tableId);
      if (!table || !table.data) return [];
      // Simple label mapping for now
      return table.data.map(row => ({ value: row.id || Object.values(row)[0], label: Object.values(row).slice(0, 2).join(' ') }));
  };

  const renderElement = (el: FormElement) => {
      if (el.type === 'container') return <div key={el.id} className={el.className}>{el.children?.map(renderElement)}</div>;
      if (el.type === 'label') return <div key={el.id} className={el.className}>{el.label}</div>;
      if (el.type === 'field') {
          return <FormWidget 
            key={el.id} element={el} value={currentRecord[allTables.find(t=>t.id===form.sourceId)?.fields.find(f=>f.id===el.fieldId)?.name || ''] ?? ''}
            sourceTable={sourceTable} isReadOnly={isReadOnly} onChange={handleInputChange} getLookupOptions={getLookupOptions}
            onOpenLookupModal={(tid, fname) => setLookupModal({ isOpen: true, targetTableId: tid, sourceFieldName: fname })}
          />;
      }
      if (el.type === 'subform' && el.subform) {
          const subDef = allForms.find(f => f.id === el.subform!.formId);
          if (!subDef) return null;
          const subTable = allTables.find(t => t.id === subDef.sourceId);
          // Filter logic simplified for brevity
          return <div key={el.id} className={el.className}><div className="bg-indigo-50 p-2 text-center text-indigo-400 text-sm border border-indigo-100">Subform {subDef.name} (Preview)</div></div>
      }
      return null;
  };

  return (
    <div className={`h-full flex flex-col ${isSubform ? '' : 'p-4 bg-slate-100'}`}>
        <div className={`bg-white shadow border border-slate-200 rounded-lg flex flex-col h-full ${form.settings?.isFullScreen ? 'fixed inset-0 z-10 m-0 rounded-none' : 'max-w-4xl mx-auto w-full'}`}>
            <div className="bg-slate-800 text-white p-3 font-bold flex justify-between">
                <span>{form.name}</span>
                <span className="text-xs bg-white/20 px-2 rounded">{data.length > 0 ? `${currentIndex + 1} / ${data.length}` : '0 / 0'}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                {data.length > 0 ? (form.layout ? renderElement(form.layout) : <div>Kein Layout definiert.</div>) : <div className="text-center text-slate-400 mt-10">Keine Daten.</div>}
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between">
                <button className="p-2 hover:bg-slate-200 rounded" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}><ChevronLeft/></button>
                <button className="p-2 hover:bg-slate-200 rounded" onClick={() => setCurrentIndex(Math.min(data.length - 1, currentIndex + 1))}><ChevronRight/></button>
            </div>
        </div>
    </div>
  );
};
