import React from 'react';
import { 
  Database, 
  ArrowLeftRight, 
  ArrowRight, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Settings2, 
  Sparkles, 
  Play, 
  Eye, 
  Radio
} from 'lucide-react';
import { ReplicationRule, ReplicationDirection } from '../types';
import { useSyncMatrixStore } from '../stores/useSyncMatrixStore';

interface SyncMatrixOverviewProps {
  onSelectRule: (rule: ReplicationRule) => void;
  onOpenConflictModal: () => void;
  onRunSync: () => void;
}

export const SyncMatrixOverview: React.FC<SyncMatrixOverviewProps> = ({
  onSelectRule,
  onOpenConflictModal,
  onRunSync,
}) => {
  const { rules, toggleRule, conflicts, isSyncing, triggerSampleConflict } = useSyncMatrixStore();
  const pendingConflicts = conflicts.filter(c => c.status === 'pending');

  const getDirectionIcon = (dir: ReplicationDirection) => {
    switch (dir) {
      case 'bidirectional':
        return <ArrowLeftRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'sqlite_to_postgres':
        return <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'postgres_to_sqlite':
        return <ArrowLeft className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    }
  };

  const getStrategyBadge = (strat: string) => {
    switch (strat) {
      case 'last_write_wins':
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Last-Write-Wins</span>;
      case 'server_authoritative':
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">Cloud Dominant</span>;
      case 'client_authoritative':
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Local (Edge) Wins</span>;
      case 'interactive_merge':
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">3-Way Merge Dialog</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{strat}</span>;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Heterogene Replikations-Matrix (SQLite ⮀ PostgreSQL)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {rules.filter(r => r.enabled).length} von {rules.length} Tabellen aktiv in der Hybrid-Replikation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingConflicts.length > 0 && (
            <button
              onClick={onOpenConflictModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-lg transition-colors shadow-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{pendingConflicts.length} Konflikt(e) lösen</span>
            </button>
          )}

          <button
            onClick={() => triggerSampleConflict()}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
            title="Simuliert einen gleichzeitigen Offline-/Cloud-Schreibzugriff"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Konflikt simulieren</span>
          </button>

          <button
            onClick={onRunSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-xs"
          >
            <Play className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronisiere...' : 'Jetzt replizieren'}</span>
          </button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3 w-10">Aktiv</th>
              <th className="py-2.5 px-3">Lokale Tabelle (SQLite)</th>
              <th className="py-2.5 px-2 text-center w-12">Richtung</th>
              <th className="py-2.5 px-3">Cloud Ziel (PostgreSQL)</th>
              <th className="py-2.5 px-3">Konflikt-Strategie</th>
              <th className="py-2.5 px-3 text-center">Zeilen (L / C)</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200">
            {rules.map((rule) => {
              const hasConflict = conflicts.some(c => c.ruleId === rule.id && c.status === 'pending');

              return (
                <tr 
                  key={rule.id}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors ${!rule.enabled ? 'opacity-50 bg-slate-50/30' : ''}`}
                >
                  <td className="py-2.5 px-3">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => toggleRule(rule.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                      <Database className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rule.tableName}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <div className="inline-flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-700/60 rounded">
                      {getDirectionIcon(rule.direction)}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-slate-600 dark:text-slate-300">{rule.targetTableName}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    {getStrategyBadge(rule.conflictStrategy)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{rule.rowCountLocal}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{rule.rowCountCloud}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    {hasConflict ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        <AlertTriangle className="w-3 h-3" />
                        Konflikt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        In-Sync
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onSelectRule(rule)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors"
                      title="Replikations-Regel & Feldzuordnung bearbeiten"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
