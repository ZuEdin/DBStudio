import React, { useState } from 'react';
import { QueryParameter, QueryParameterType } from '../../../types';
import { Sliders, Plus, Trash2, X, Check, HelpCircle } from 'lucide-react';

interface QueryParametersModalProps {
  isOpen: boolean;
  onClose: () => void;
  parameters: QueryParameter[];
  onSave: (parameters: QueryParameter[]) => void;
}

export const QueryParametersModal: React.FC<QueryParametersModalProps> = ({
  isOpen,
  onClose,
  parameters = [],
  onSave,
}) => {
  if (!isOpen) return null;

  const [localParams, setLocalParams] = useState<QueryParameter[]>(
    parameters.length > 0
      ? parameters.map((p) => ({ ...p }))
      : []
  );

  const handleAdd = () => {
    const newParam: QueryParameter = {
      id: crypto.randomUUID(),
      name: `param_${localParams.length + 1}`,
      type: 'STRING',
      defaultValue: '',
      required: false,
      description: '',
    };
    setLocalParams([...localParams, newParam]);
  };

  const handleUpdate = (index: number, patch: Partial<QueryParameter>) => {
    const updated = [...localParams];
    updated[index] = { ...updated[index], ...patch };
    setLocalParams(updated);
  };

  const handleDelete = (index: number) => {
    setLocalParams(localParams.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(localParams);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-base">Abfrage-Parameter verwalten (Query Parameters)</h3>
              <p className="text-xs text-slate-400">Definieren Sie dynamische Variablen wie :p_projekt_id oder @datumVon</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-600">
              Definierte Parameter ({localParams.length})
            </span>
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus size={14} /> Parameter hinzufügen
            </button>
          </div>

          {localParams.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-500">
              <Sliders className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">Keine Parameter definiert</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Parameter ermöglichen es, beim Ausführen der Abfrage flexible Werte wie Projekt-IDs oder Datumsbereiche abzufragen.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2.5">Parameter-Name (z.B. :id / @p)</th>
                    <th className="p-2.5">Datentyp</th>
                    <th className="p-2.5">Standardwert</th>
                    <th className="p-2.5 text-center">Pflicht</th>
                    <th className="p-2.5">Beschreibung</th>
                    <th className="p-2.5 text-center w-10">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localParams.map((param, idx) => (
                    <tr key={param.id || idx} className="hover:bg-slate-50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={param.name}
                          onChange={(e) => handleUpdate(idx, { name: e.target.value })}
                          placeholder="z.B. p_projekt_id"
                          className="w-full border border-slate-200 rounded px-2 py-1 font-mono text-indigo-700 font-semibold focus:outline-indigo-500"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={param.type}
                          onChange={(e) => handleUpdate(idx, { type: e.target.value as QueryParameterType })}
                          className="w-full border border-slate-200 rounded px-2 py-1 bg-white focus:outline-indigo-500"
                        >
                          <option value="STRING">Text (STRING)</option>
                          <option value="NUMBER">Zahl (NUMBER)</option>
                          <option value="DATE">Datum (DATE)</option>
                          <option value="BOOLEAN">Ja/Nein (BOOLEAN)</option>
                          <option value="ARRAY">Menge/Auswahl (ARRAY)</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={param.defaultValue || ''}
                          onChange={(e) => handleUpdate(idx, { defaultValue: e.target.value })}
                          placeholder="z.B. 1001 oder TODAY"
                          className="w-full border border-slate-200 rounded px-2 py-1 focus:outline-indigo-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(param.required)}
                          onChange={(e) => handleUpdate(idx, { required: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={param.description || ''}
                          onChange={(e) => handleUpdate(idx, { description: e.target.value })}
                          placeholder="Hinweis für Benutzer"
                          className="w-full border border-slate-200 rounded px-2 py-1 text-slate-600 focus:outline-indigo-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleDelete(idx)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                          title="Löschen"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <HelpCircle size={13} />
            <span>Syntax in Kriterien: Verwenden Sie <code className="bg-slate-200 px-1 rounded">:parameter_name</code></span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check size={14} />
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
