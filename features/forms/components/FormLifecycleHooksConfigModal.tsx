import React, { useState } from 'react';
import { Zap, Plus, Trash2, Check, X, Code } from 'lucide-react';
import { Form, FormEventHandler } from '../../../types/index';

interface FormLifecycleHooksConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form;
  onSaveForm: (updatedForm: Form) => void;
}

export const FormLifecycleHooksConfigModal: React.FC<FormLifecycleHooksConfigModalProps> = ({
  isOpen,
  onClose,
  form,
  onSaveForm,
}) => {
  const [handlers, setHandlers] = useState<FormEventHandler[]>(() => form.eventHandlers || []);

  if (!isOpen) return null;

  const handleAddHandler = () => {
    const newH: FormEventHandler = {
      id: crypto.randomUUID(),
      event: 'BeforeUpdate',
      actionType: 'toast',
      toastMessage: 'Formularevent verarbeitet.',
    };
    setHandlers([...handlers, newH]);
  };

  const handleRemove = (id: string) => {
    setHandlers(handlers.filter((h) => h.id !== id));
  };

  const handleSave = () => {
    onSaveForm({
      ...form,
      eventHandlers: handlers,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Zap size={20} className="text-amber-400" />
            <div>
              <h3 className="font-bold text-base">Form-Lifecycle Hooks & Event-Trigger</h3>
              <p className="text-xs text-slate-400">`onLoad`, `beforeSave`, `afterSave`, `onChange`, `onDelete` Handler</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {handlers.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40">
              <Zap size={32} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Keine Lifecycle-Hooks konfiguriert</p>
              <p className="text-xs text-slate-400 mb-4">Lösen Sie automatisch Makros oder Skripte bei Formularevents aus.</p>
              <button
                type="button"
                onClick={handleAddHandler}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg text-xs inline-flex items-center gap-2 shadow-sm"
              >
                <Plus size={14} /> Ersten Lifecycle Hook erstellen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {handlers.map((h, idx) => (
                <div key={h.id} className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 flex items-center gap-3">
                  <select
                    value={h.event}
                    onChange={(e) => {
                      const next = [...handlers];
                      next[idx].event = e.target.value as any;
                      setHandlers(next);
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="OnCurrent">Beim Laden (OnCurrent / onLoad)</option>
                    <option value="BeforeUpdate">Vor dem Speichern (beforeSave)</option>
                    <option value="AfterUpdate">Nach dem Speichern (afterSave)</option>
                    <option value="OnClick">Beim Auslösen / Klick (onChange/onClick)</option>
                  </select>

                  <select
                    value={h.actionType}
                    onChange={(e) => {
                      const next = [...handlers];
                      next[idx].actionType = e.target.value as any;
                      setHandlers(next);
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400"
                  >
                    <option value="toast">Toast-Benachrichtigung</option>
                    <option value="macro">Makro ausführen</option>
                    <option value="js_script">Benutzerdefiniertes Skript</option>
                  </select>

                  <input
                    type="text"
                    value={h.toastMessage || h.jsCode || ''}
                    onChange={(e) => {
                      const next = [...handlers];
                      next[idx].toastMessage = e.target.value;
                      setHandlers(next);
                    }}
                    placeholder="Parameter / Nachricht / Skript"
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemove(h.id)}
                    className="text-rose-600 hover:text-rose-700 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddHandler}
                className="w-full py-2.5 border-2 border-dashed border-amber-300 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 font-bold text-xs hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Weitere Event-Aktion hinzufügen
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800">
            Abbrechen
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm">
            <Check size={14} /> Hooks Speichern
          </button>
        </div>
      </div>
    </div>
  );
};
