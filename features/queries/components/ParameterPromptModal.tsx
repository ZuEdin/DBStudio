import React, { useState } from 'react';
import { QueryParameter } from '../../../types';
import { Play, X, AlertCircle } from 'lucide-react';

interface ParameterPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  parameters: QueryParameter[];
  onExecute: (paramValues: Record<string, any>) => void;
}

export const ParameterPromptModal: React.FC<ParameterPromptModalProps> = ({
  isOpen,
  onClose,
  parameters = [],
  onExecute,
}) => {
  if (!isOpen) return null;

  const [values, setValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    parameters.forEach((p) => {
      initial[p.name] = p.defaultValue !== undefined ? p.defaultValue : '';
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRun = () => {
    const newErrors: Record<string, string> = {};
    parameters.forEach((p) => {
      if (p.required && (values[p.name] === undefined || values[p.name] === '')) {
        newErrors[p.name] = 'Pflichtfeld';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onExecute(values);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base">Parameterwerte eingeben</h3>
              <p className="text-xs text-slate-400">Bitte füllen Sie die geforderten Filterwerte für diese Abfrage aus</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Inputs */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {parameters.map((param) => (
            <div key={param.id || param.name} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-700">
                  {param.name}{' '}
                  {param.required && <span className="text-red-500 font-bold">*</span>}
                </label>
                <span className="font-mono text-[10px] text-slate-400">[{param.type}]</span>
              </div>
              {param.description && (
                <p className="text-[11px] text-slate-500">{param.description}</p>
              )}

              {param.type === 'BOOLEAN' ? (
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(values[param.name])}
                    onChange={(e) => setValues({ ...values, [param.name]: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                  />
                  <span className="text-xs text-slate-700 font-medium">Aktivieren (Wahr)</span>
                </label>
              ) : param.type === 'DATE' ? (
                <input
                  type="date"
                  value={values[param.name] || ''}
                  onChange={(e) => setValues({ ...values, [param.name]: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2 text-xs bg-white ${
                    errors[param.name] ? 'border-red-500 focus:ring-red-400' : 'border-slate-300 focus:ring-indigo-500'
                  }`}
                />
              ) : (
                <input
                  type={param.type === 'NUMBER' ? 'number' : 'text'}
                  value={values[param.name] || ''}
                  onChange={(e) => setValues({ ...values, [param.name]: e.target.value })}
                  placeholder={param.defaultValue ? `Standard: ${param.defaultValue}` : ''}
                  className={`w-full border rounded-lg px-3 py-2 text-xs bg-white ${
                    errors[param.name] ? 'border-red-500 focus:ring-red-400' : 'border-slate-300 focus:ring-indigo-500'
                  }`}
                />
              )}

              {errors[param.name] && (
                <p className="text-[11px] text-red-600 flex items-center gap-1 font-semibold mt-0.5">
                  <AlertCircle size={12} /> {errors[param.name]}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleRun}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Play size={14} />
            Abfrage ausführen
          </button>
        </div>
      </div>
    </div>
  );
};
