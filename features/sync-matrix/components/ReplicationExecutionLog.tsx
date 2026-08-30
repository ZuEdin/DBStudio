import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Terminal, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useSyncMatrixStore } from '../stores/useSyncMatrixStore';
import { useProjectStore } from '../../../stores/useProjectStore';

export const ReplicationExecutionLog: React.FC = () => {
  const { tables } = useProjectStore();
  const { isSyncing, syncProgress, lastReport, runSyncBatch } = useSyncMatrixStore();
  const [dryRun, setDryRun] = useState(false);

  const handleStartSync = () => {
    runSyncBatch(tables, { dryRun });
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Controls & Metrics */}
      <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Live Replikator & CDC Event-Log
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Führt die heterogene Replikation zwischen lokalem SQLite WASM und Cloud PostgreSQL aus
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Dry-Run (Testlauf ohne Schreiboperationen)</span>
            </label>

            <button
              onClick={handleStartSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-xs"
            >
              <Play className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Replikation läuft...' : 'Replikations-Lauf starten'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isSyncing && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
              <span>Synchronisiere Tabellen & Konfliktprüfung...</span>
              <span>{syncProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-200"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        {lastReport && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
            <div className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase">Tabellen</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{lastReport.totalTables}</span>
            </div>
            <div className="p-2 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-lg">
              <span className="text-emerald-600 dark:text-emerald-400 block text-[10px] uppercase">Lokal aktualisiert</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">{lastReport.updatedLocal}</span>
            </div>
            <div className="p-2 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg">
              <span className="text-indigo-600 dark:text-indigo-400 block text-[10px] uppercase">Cloud synchronisiert</span>
              <span className="font-bold text-indigo-700 dark:text-indigo-300">{lastReport.insertedCloud}</span>
            </div>
            <div className="p-2 bg-amber-50/50 dark:bg-amber-950/30 rounded-lg">
              <span className="text-amber-600 dark:text-amber-400 block text-[10px] uppercase">Konflikte / Gelöst</span>
              <span className="font-bold text-amber-700 dark:text-amber-300">{lastReport.conflictCount} / {lastReport.resolvedCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Log Console */}
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-200 overflow-y-auto space-y-1.5 shadow-inner">
        <div className="text-slate-500 pb-2 border-b border-slate-800 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Replikations-Konsole & CDC Event-Trace</span>
        </div>

        {lastReport?.logs && lastReport.logs.length > 0 ? (
          lastReport.logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 leading-relaxed">
              <span className="text-slate-500 text-[10px] shrink-0">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>
              <span className={`shrink-0 text-[10px] px-1 py-0.2 rounded font-bold ${
                log.level === 'success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                log.level === 'warn' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                log.level === 'error' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                'bg-slate-800 text-slate-300'
              }`}>
                {log.level.toUpperCase()}
              </span>
              {log.tableName && (
                <span className="text-indigo-400 shrink-0 font-semibold">[{log.tableName}]</span>
              )}
              <span className="text-slate-300">{log.message}</span>
            </div>
          ))
        ) : (
          <div className="text-slate-500 text-xs py-8 text-center">
            Noch kein Replikations-Lauf protokolliert. Klicken Sie auf "Replikations-Lauf starten".
          </div>
        )}
      </div>
    </div>
  );
};
