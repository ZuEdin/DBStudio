import React, { useState } from 'react';
import { AlertTriangle, GitMerge, Check, ArrowRight, X, RefreshCw } from 'lucide-react';

export interface FormConflictField {
  fieldName: string;
  fieldLabel: string;
  localValue: any;
  serverValue: any;
  resolvedValue: any;
  chosenSource: 'local' | 'server' | 'custom';
}

interface FormConflictModalProps {
  isOpen: boolean;
  formName: string;
  recordId: string | number;
  localRecord: Record<string, any>;
  serverRecord: Record<string, any>;
  fieldLabels?: Record<string, string>;
  onResolve: (mergedRecord: Record<string, any>) => void;
  onCancel: () => void;
}

export const FormConflictModal: React.FC<FormConflictModalProps> = ({
  isOpen,
  formName,
  recordId,
  localRecord,
  serverRecord,
  fieldLabels = {},
  onResolve,
  onCancel,
}) => {
  if (!isOpen) return null;

  // Find all conflicting fields
  const allKeys = Array.from(new Set([...Object.keys(localRecord), ...Object.keys(serverRecord)]));
  const initialFields: FormConflictField[] = allKeys
    .filter((k) => k !== 'updatedAt' && k !== 'version' && k !== 'id')
    .map((key) => {
      const localVal = localRecord[key];
      const serverVal = serverRecord[key];
      const hasConflict = JSON.stringify(localVal) !== JSON.stringify(serverVal);
      return {
        fieldName: key,
        fieldLabel: fieldLabels[key] || key,
        localValue: localVal,
        serverValue: serverVal,
        resolvedValue: hasConflict ? localVal : localVal, // Default to local for conflicts
        chosenSource: 'local' as const,
      };
    })
    .filter((f) => JSON.stringify(f.localValue) !== JSON.stringify(f.serverValue));

  const [conflictFields, setConflictFields] = useState<FormConflictField[]>(initialFields);

  const setSourceForField = (fieldName: string, source: 'local' | 'server') => {
    setConflictFields((prev) =>
      prev.map((f) => {
        if (f.fieldName !== fieldName) return f;
        return {
          ...f,
          chosenSource: source,
          resolvedValue: source === 'local' ? f.localValue : f.serverValue,
        };
      })
    );
  };

  const applyAllSource = (source: 'local' | 'server') => {
    setConflictFields((prev) =>
      prev.map((f) => ({
        ...f,
        chosenSource: source,
        resolvedValue: source === 'local' ? f.localValue : f.serverValue,
      }))
    );
  };

  const handleConfirmMerge = () => {
    const merged = { ...serverRecord };
    conflictFields.forEach((f) => {
      merged[f.fieldName] = f.resolvedValue;
    });
    onResolve(merged);
  };

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return <span className="italic text-slate-400">Leer</span>;
    if (typeof val === 'boolean') return val ? 'Ja' : 'Nein';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-xl">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Versionskonflikt erkannt (Optimistic Locking)
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Datensatz <span className="font-mono font-bold">#{recordId}</span> im Formular "{formName}" wurde auf dem Server zwischenzeitlich geändert.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Global Action Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-400">
            {conflictFields.length} unterschiedliche Felder gefunden:
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyAllSource('server')}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors"
            >
              Alle Server-Werte übernehmen
            </button>
            <button
              type="button"
              onClick={() => applyAllSource('local')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors shadow-2xs"
            >
              Alle lokalen Werte erzwingen
            </button>
          </div>
        </div>

        {/* Diff Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {conflictFields.map((field) => {
            const isLocal = field.chosenSource === 'local';
            const isServer = field.chosenSource === 'server';

            return (
              <div
                key={field.fieldName}
                className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-900 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {field.fieldLabel} <span className="font-mono text-[10px] text-slate-400">({field.fieldName})</span>
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                    Ausgewählt: {isLocal ? 'Lokale Änderung' : 'Server-Version'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Local version card */}
                  <div
                    onClick={() => setSourceForField(field.fieldName, 'local')}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isLocal
                        ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Lokal (Ihre Eingabe)</span>
                      {isLocal && <Check size={14} className="text-blue-600" />}
                    </div>
                    <div className="text-xs font-mono text-slate-900 dark:text-white break-words">
                      {formatValue(field.localValue)}
                    </div>
                  </div>

                  {/* Server version card */}
                  <div
                    onClick={() => setSourceForField(field.fieldName, 'server')}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isServer
                        ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Server (Aktuell in Datenbank)</span>
                      {isServer && <Check size={14} className="text-blue-600" />}
                    </div>
                    <div className="text-xs font-mono text-slate-900 dark:text-white break-words">
                      {formatValue(field.serverValue)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Abbrechen (Nicht speichern)
          </button>
          <button
            type="button"
            onClick={handleConfirmMerge}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-2"
          >
            <GitMerge size={15} /> Zusammenführung speichern
          </button>
        </div>
      </div>
    </div>
  );
};
