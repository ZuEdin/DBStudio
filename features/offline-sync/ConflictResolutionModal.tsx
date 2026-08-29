import React, { useState } from 'react';
import { AlertTriangle, Check, RefreshCw, X, ArrowRight, Layers } from 'lucide-react';
import { SyncConflict } from './outboxTypes';
import { OfflineSyncService } from './offlineSyncService';

interface ConflictResolutionModalProps {
  conflict: SyncConflict;
  onResolved: () => void;
  onClose: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflict,
  onResolved,
  onClose,
}) => {
  const [mergedValues, setMergedValues] = useState<Record<string, any>>(() => {
    // Default to client values
    return { ...conflict.serverPayload, ...conflict.clientPayload };
  });

  const [selectedSources, setSelectedSources] = useState<Record<string, 'client' | 'server' | 'custom'>>(() => {
    const map: Record<string, 'client' | 'server' | 'custom'> = {};
    conflict.conflictFields.forEach((field) => {
      map[field] = 'client';
    });
    return map;
  });

  const handleSelectField = (field: string, source: 'client' | 'server') => {
    setSelectedSources((prev) => ({ ...prev, [field]: source }));
    setMergedValues((prev) => ({
      ...prev,
      [field]: source === 'client' ? conflict.clientPayload[field] : conflict.serverPayload[field],
    }));
  };

  const handleCustomChange = (field: string, val: string) => {
    setSelectedSources((prev) => ({ ...prev, [field]: 'custom' }));
    setMergedValues((prev) => ({ ...prev, [field]: val }));
  };

  const handleApplyMerge = async () => {
    await OfflineSyncService.applyThreeWayMerge(conflict, mergedValues);
    onResolved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 bg-amber-500/10 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold">
            <AlertTriangle className="w-5 h-5" />
            <span>Synchronisations-Konflikt lösen (3-Way Merge)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 text-xs border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-between">
          <div>
            Tabelle: <span className="font-semibold">{conflict.tableName}</span> | Datensatz-ID:{' '}
            <span className="font-mono text-xs">{conflict.recordId}</span>
          </div>
          <div className="text-slate-400">
            Erkannt: {new Date(conflict.detectedAt).toLocaleTimeString()}
          </div>
        </div>

        {/* Content Comparison */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Auf dem Server existiert eine neuere Version dieses Datensatzes. Wählen Sie pro Feld, welche Version übernommen werden soll:
          </div>

          <div className="space-y-3">
            {conflict.conflictFields.map((field) => {
              const clientVal = conflict.clientPayload[field];
              const serverVal = conflict.serverPayload[field];
              const currentChoice = selectedSources[field];

              return (
                <div
                  key={field}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span>Feld: {field}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Client Box */}
                    <div
                      onClick={() => handleSelectField(field, 'client')}
                      className={`p-2.5 rounded-md border cursor-pointer transition ${
                        currentChoice === 'client'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 font-semibold text-indigo-700 dark:text-indigo-300">
                        <span>Ihre lokale Offline-Version</span>
                        {currentChoice === 'client' && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="font-mono text-xs break-all text-slate-700 dark:text-slate-300">
                        {String(clientVal ?? '–')}
                      </div>
                    </div>

                    {/* Server Box */}
                    <div
                      onClick={() => handleSelectField(field, 'server')}
                      className={`p-2.5 rounded-md border cursor-pointer transition ${
                        currentChoice === 'server'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-400'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 font-semibold text-emerald-700 dark:text-emerald-300">
                        <span>Aktuelle Server-Version</span>
                        {currentChoice === 'server' && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="font-mono text-xs break-all text-slate-700 dark:text-slate-300">
                        {String(serverVal ?? '–')}
                      </div>
                    </div>
                  </div>

                  {/* Custom override input */}
                  <div className="pt-1">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                      Oder manuell bearbeiteten Wert übernehmen:
                    </label>
                    <input
                      type="text"
                      value={mergedValues[field] ?? ''}
                      onChange={(e) => handleCustomChange(field, e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Abbrechen
          </button>
          <button
            onClick={handleApplyMerge}
            className="px-4 py-1.5 text-xs font-bold rounded bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow"
          >
            <span>Zusammenführung anwenden</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
