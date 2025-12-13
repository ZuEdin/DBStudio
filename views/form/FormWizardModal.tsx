
import React, { useState, useMemo } from 'react';
import { Table, Query, Form, FormField } from '../../types/index';
import { X, Layout } from 'lucide-react';

interface FormWizardModalProps {
  tables: Table[];
  queries: Query[];
  onSave: (form: Form) => void;
  onClose: () => void;
}

export const FormWizardModal: React.FC<FormWizardModalProps> = ({
  tables,
  queries,
  onSave,
  onClose,
}) => {
  const [formName, setFormName] = useState('Neues Formular');
  const [source, setSource] = useState<string>(''); // "table:id" or "query:id"

  const dataSources = useMemo(() => [
    ...tables.map(t => ({ id: `table:${t.id}`, name: t.name, type: 'Tabelle' })),
    ...queries.map(q => ({ id: `query:${q.id}`, name: q.name, type: 'Abfrage' }))
  ], [tables, queries]);

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setSource(val);
      const selected = dataSources.find(ds => ds.id === val);
      if (selected) {
          setFormName(selected.name);
      }
  };

  const handleSave = () => {
    if (!source || !formName) return;
    const [sourceType, sourceId] = source.split(':');
    
    let sourceFields: { id: string, name: string }[] = [];
    if (sourceType === 'table') {
        sourceFields = tables.find(t => t.id === sourceId)?.fields || [];
    } else {
        const query = queries.find(q => q.id === sourceId);
        // FIX: Add type guard to ensure query is a SelectQuery before accessing 'columns'.
        if (query && query.type === 'SELECT') {
            const fieldMap = new Map<string, { id: string, name: string }>();
            query.columns.forEach(col => {
                const table = tables.find(t => t.id === col.tableId);
                const field = table?.fields.find(f => f.id === col.fieldId);
                if (field && !fieldMap.has(field.id)) {
                    fieldMap.set(field.id, { id: field.id, name: field.name });
                }
            });
            sourceFields = Array.from(fieldMap.values());
        }
    }

    const formFields: FormField[] = sourceFields.map(f => ({
        fieldId: f.id,
        label: f.name,
    }));

    const newForm: Form = {
      id: crypto.randomUUID(),
      name: formName,
      sourceType: sourceType as 'table' | 'query',
      sourceId,
      fields: formFields,
    };
    onSave(newForm);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in-25">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg border border-slate-300 flex flex-col">
        <div className="flex justify-between items-center p-4 bg-slate-100 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Layout className="text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Formular erstellen</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Datenquelle auswählen</label>
            <p className="text-xs text-slate-500 mb-2">Wählen Sie eine Tabelle oder Abfrage, auf der das Formular basieren soll.</p>
            <select value={source} onChange={handleSourceChange} className="w-full border border-slate-300 rounded p-2 text-sm">
              <option value="">Bitte wählen...</option>
              {dataSources.map(ds => <option key={ds.id} value={ds.id}>{ds.type}: {ds.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Formularname</label>
            <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full max-w-md border border-slate-300 rounded p-2 text-sm" />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 bg-slate-50 border-t border-slate-200">
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded text-sm">Abbrechen</button>
          <button onClick={handleSave} disabled={!source || !formName} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50">Formular erstellen</button>
        </div>
      </div>
    </div>
  );
};
