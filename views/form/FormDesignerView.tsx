import React, { useState } from 'react';
import { Form, Table, Subform } from '../../types/index';
import { Layout, GripVertical, Trash2 } from 'lucide-react';
import { LinkSubformModal } from './LinkSubformModal';

interface FormDesignerViewProps {
  form: Form;
  allForms: Form[];
  allTables: Table[];
  onFormChange: (form: Form) => void;
}

export const FormDesignerView: React.FC<FormDesignerViewProps> = ({ form, allForms, allTables, onFormChange }) => {
  const [linkingSubform, setLinkingSubform] = useState<Form | null>(null);
  const mainFormTable = allTables.find(t => t.id === form.sourceId);

  const handleDragStart = (e: React.DragEvent, subform: Form) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'form', formId: subform.id }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'form') {
        const subform = allForms.find(f => f.id === data.formId);
        if (subform) {
          setLinkingSubform(subform);
        }
      }
    } catch (err) {
      console.error('Drop error', err);
    }
  };

  const handleLinkSubform = (masterLinkFieldId: string, childLinkFieldId: string) => {
    if (linkingSubform) {
      const subform: Subform = {
        formId: linkingSubform.id,
        masterLinkFieldId,
        childLinkFieldId
      };
      onFormChange({ ...form, subform });
    }
    setLinkingSubform(null);
  };

  const removeSubform = () => {
    const newForm = { ...form };
    delete newForm.subform;
    onFormChange(newForm);
  };

  const subformDetails = form.subform ? allForms.find(f => f.id === form.subform!.formId) : null;
  const availableSubforms = allForms.filter(f => f.id !== form.id && f.sourceType === 'table');

  return (
    <div className="h-full bg-slate-200 flex">
      {linkingSubform && mainFormTable && (
        <LinkSubformModal 
          mainFormTable={mainFormTable}
          subFormTable={allTables.find(t => t.id === linkingSubform.sourceId)!}
          onLink={handleLinkSubform}
          onClose={() => setLinkingSubform(null)}
        />
      )}
      {/* Designer Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Formular-Designer: {form.name}</h2>
          
          {/* Main Form Section */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-slate-300">
            <h3 className="font-bold text-lg mb-4 text-slate-700">Hauptformular-Felder</h3>
            <div className="space-y-2">
              {form.fields.map(field => (
                <div key={field.fieldId} className="flex items-center bg-slate-50 p-2 rounded border">
                  <GripVertical className="text-slate-400 mr-2" />
                  <span>{field.label}</span>
                </div>
              ))}
            </div>
            
            {/* Subform Drop Area */}
            <div 
              className="mt-6 border-2 border-dashed border-slate-300 rounded-lg p-4"
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
            >
              {!subformDetails ? (
                <div className="text-center text-slate-500">
                  <p>Unterformular hierher ziehen</p>
                </div>
              ) : (
                <div className="bg-indigo-50 p-4 rounded-md border border-indigo-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-indigo-800">Unterformular: {subformDetails.name}</h4>
                    <button onClick={removeSubform} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                   <div className="text-xs text-indigo-700 space-y-1">
                      <p><strong>Master-Feld:</strong> {mainFormTable?.fields.find(f => f.id === form.subform?.masterLinkFieldId)?.name}</p>
                      <p><strong>Child-Feld:</strong> {allTables.find(t => t.id === subformDetails.sourceId)?.fields.find(f => f.id === form.subform?.childLinkFieldId)?.name}</p>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Toolbox */}
      <div className="w-64 bg-white border-l border-slate-300 p-4">
        <h3 className="font-bold text-sm text-slate-600 uppercase tracking-wider mb-3">Verfügbare Formulare</h3>
        <div className="space-y-2">
          {availableSubforms.map(subform => (
            <div
              key={subform.id}
              draggable
              onDragStart={(e) => handleDragStart(e, subform)}
              className="flex items-center gap-2 p-2 bg-slate-100 rounded border border-slate-200 cursor-grab"
            >
              <Layout size={16} className="text-indigo-600" />
              <span className="text-sm text-slate-800 truncate">{subform.name}</span>
            </div>
          ))}
          {availableSubforms.length === 0 && <p className="text-xs text-slate-500 italic">Keine anderen Formulare verfügbar.</p>}
        </div>
      </div>
    </div>
  );
};
