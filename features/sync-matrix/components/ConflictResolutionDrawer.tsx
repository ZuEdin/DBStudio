import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Check, 
  X, 
  ArrowRight, 
  Layers, 
  Sparkles, 
  Database, 
  Cloud, 
  History,
  CheckCheck
} from 'lucide-react';
import { SyncConflictRecord, ConflictStrategy } from '../types';
import { useSyncMatrixStore } from '../stores/useSyncMatrixStore';

interface ConflictResolutionDrawerProps {
  onClose: () => void;
}

export const ConflictResolutionDrawer: React.FC<ConflictResolutionDrawerProps> = ({
  onClose,
}) => {
  const { conflicts, activeConflict, setActiveConflict, resolveConflict, resolveAllConflicts } = useSyncMatrixStore();
  const pendingConflicts = conflicts.filter(c => c.status === 'pending');

  const selectedConflict = activeConflict || pendingConflicts[0] || null;

  const [fieldSources, setFieldSources] = useState<Record<string, 'local' | 'remote' | 'custom'>>({});
  const [mergedData, setMergedData] = useState<Record<string, any>>({});

  // When selectedConflict changes, reset merge state
  React.useEffect(() => {
    if (selectedConflict) {
      const initialSources: Record<string, 'local' | 'remote' | 'custom'> = {};
      const initialMerged: Record<string, any> = { ...selectedConflict.remoteRow, ...selectedConflict.localRow };

      selectedConflict.conflictingColumns.forEach(col => {
        // Default to newer timestamp
        const localNewer = selectedConflict.localUpdatedAt >= selectedConflict.remoteUpdatedAt;
        initialSources[col] = localNewer ? 'local' : 'remote';
        initialMerged[col] = localNewer ? selectedConflict.localRow[col] : selectedConflict.remoteRow[col];
      });

      setFieldSources(initialSources);
      setMergedData(initialMerged);
    }
  }, [selectedConflict]);

  const handlePickField = (col: string, source: 'local' | 'remote') => {
    if (!selectedConflict) return;
    setFieldSources(prev => ({ ...prev, [col]: source }));
    setMergedData(prev => ({
      ...prev,
      [col]: source === 'local' ? selectedConflict.localRow[col] : selectedConflict.remoteRow[col]
    }));
  };

  const handleCustomChange = (col: string, val: any) => {
    setFieldSources(prev => ({ ...prev, [col]: 'custom' }));
    setMergedData(prev => ({ ...prev, [col]: val }));
  };

  const handleApplyResolution = () => {
    if (!selectedConflict) return;
    resolveConflict(selectedConflict.id, 'interactive_merge', mergedData);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-300 dark:border-amber-700/60 rounded-lg">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold">
              Konflikt-Manager & 3-Wege Replikations-Merge
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {pendingConflicts.length} offene Datenkollision(en) zwischen SQLite und PostgreSQL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => resolveAllConflicts('last_write_wins')}
            className="px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-xs"
            title="Löst alle offenen Konflikte anhand des neuesten Zeitstempels"
          >
            Alle mit LWW lösen
          </button>
          <button
            onClick={() => resolveAllConflicts('server_authoritative')}
            className="px-2.5 py-1 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors shadow-xs"
            title="Cloud-PostgreSQL überschreibt alle lokalen Konflikte"
          >
            Alle mit Cloud lösen
          </button>
        </div>
      </div>

      {/* Main Split View: Conflict List + 3-Way Diff Editor */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* Left: Conflict List */}
        <div className="w-full md:w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-y-auto p-2 space-y-1.5 shrink-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
            Offene Konflikte ({pendingConflicts.length})
          </div>

          {pendingConflicts.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              Keine ungelösten Konflikte vorhanden.
            </div>
          ) : (
            pendingConflicts.map((c) => {
              const isSelected = selectedConflict?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConflict(c)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="truncate">{c.tableName}</span>
                    <span className="font-mono text-[10px] text-slate-400">#{c.primaryKeyValue}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {c.conflictingColumns.length} Spalte(n) abweichend
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: 3-Way Field Diff & Merging Canvas */}
        {selectedConflict ? (
          <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col overflow-hidden">
            {/* Header info */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <div>
                Tabelle: <span className="font-bold text-slate-900 dark:text-slate-100">{selectedConflict.tableName}</span> | ID:{' '}
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedConflict.primaryKeyValue}</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                Erkannt: {new Date(selectedConflict.detectedAt).toLocaleTimeString()}
              </div>
            </div>

            {/* Field Diff List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Klicken Sie pro Feld auf die gewünschte Version oder editieren Sie das zusammengeführte Ergebnis:
              </div>

              <div className="space-y-3">
                {selectedConflict.conflictingColumns.map((col) => {
                  const localVal = selectedConflict.localRow[col];
                  const remoteVal = selectedConflict.remoteRow[col];
                  const currentSource = fieldSources[col];

                  return (
                    <div 
                      key={col}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-amber-500" />
                          <span>Spalte: {col}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Quelle: {currentSource === 'local' ? 'Lokale SQLite' : currentSource === 'remote' ? 'Cloud PostgreSQL' : 'Benutzerdefiniert'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* Local SQLite Card */}
                        <div
                          onClick={() => handlePickField(col, 'local')}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                            currentSource === 'local'
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-2xs'
                              : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                            <span className="flex items-center gap-1"><Database className="w-3 h-3" /> Lokale SQLite (Edge)</span>
                            {currentSource === 'local' && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div className="font-mono text-slate-800 dark:text-slate-200 break-all">{String(localVal)}</div>
                        </div>

                        {/* Remote PostgreSQL Card */}
                        <div
                          onClick={() => handlePickField(col, 'remote')}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                            currentSource === 'remote'
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-2xs'
                              : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                            <span className="flex items-center gap-1"><Cloud className="w-3 h-3" /> Cloud PostgreSQL</span>
                            {currentSource === 'remote' && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div className="font-mono text-slate-800 dark:text-slate-200 break-all">{String(remoteVal)}</div>
                        </div>
                      </div>

                      {/* Custom Value Editor Input */}
                      <div>
                        <input
                          type="text"
                          value={mergedData[col] !== undefined ? String(mergedData[col]) : ''}
                          onChange={(e) => handleCustomChange(col, e.target.value)}
                          className="w-full text-xs p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-slate-100 focus:ring-amber-500"
                          placeholder="Benutzerdefinierten Wert eingeben..."
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <button
                onClick={() => resolveConflict(selectedConflict.id, 'last_write_wins')}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Als LWW verwerfen
              </button>

              <button
                onClick={handleApplyResolution}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-xs"
              >
                <CheckCheck className="w-4 h-4" />
                <span>3-Wege Merge anwenden & synchronisieren</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-400">
            Wählen Sie einen Konflikt aus der linken Liste.
          </div>
        )}
      </div>
    </div>
  );
};
