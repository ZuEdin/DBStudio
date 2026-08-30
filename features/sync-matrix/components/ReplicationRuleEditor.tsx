import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Layers, 
  Save, 
  Code, 
  Filter, 
  Clock, 
  Check, 
  Trash2,
  ChevronLeft
} from 'lucide-react';
import { ReplicationRule, ReplicationDirection, ConflictStrategy, ReplicationFrequency, ColumnMapping } from '../types';
import { useSyncMatrixStore } from '../stores/useSyncMatrixStore';

interface ReplicationRuleEditorProps {
  rule: ReplicationRule;
  onBack: () => void;
}

export const ReplicationRuleEditor: React.FC<ReplicationRuleEditorProps> = ({
  rule,
  onBack,
}) => {
  const { updateRule } = useSyncMatrixStore();

  const [direction, setDirection] = useState<ReplicationDirection>(rule.direction);
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>(rule.conflictStrategy);
  const [targetTableName, setTargetTableName] = useState<string>(rule.targetTableName);
  const [frequency, setFrequency] = useState<ReplicationFrequency>(rule.frequency);
  const [syncMode, setSyncMode] = useState<'full_snapshot' | 'cdc_delta' | 'filtered_subset'>(rule.syncMode);
  const [filterCriteria, setFilterCriteria] = useState<string>(rule.filterCriteria || '');
  const [customEvalScript, setCustomEvalScript] = useState<string>(
    rule.customEvalScript || `// Custom Conflict Resolver
// Input: local (SQLite Row), remote (PostgreSQL Row), base (Ancestor)
// Return merged JavaScript Object
return {
  ...remote,
  ...local,
  updated_at: new Date().toISOString()
};`
  );
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>(rule.columnMappings || []);

  const handleSave = () => {
    updateRule(rule.id, {
      direction,
      conflictStrategy,
      targetTableName,
      frequency,
      syncMode,
      filterCriteria,
      customEvalScript,
      columnMappings,
    });
    onBack();
  };

  const handleUpdateMapping = (index: number, updates: Partial<ColumnMapping>) => {
    setColumnMappings(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Replikationsregel: {rule.tableName}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Konfiguration der heterogenen Synchronisation & Konflikt-Strategie
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-xs"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Regel speichern</span>
        </button>
      </div>

      {/* Main Settings Grid */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Basic Configuration */}
        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Replication Direction */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Replikations-Richtung
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as ReplicationDirection)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-indigo-500"
              >
                <option value="bidirectional">🔄 Bidirektional (2-Wege SQLite ⮀ PostgreSQL)</option>
                <option value="sqlite_to_postgres">➔ Upload (SQLite ➔ PostgreSQL)</option>
                <option value="postgres_to_sqlite">⬅ Download (PostgreSQL ➔ SQLite)</option>
              </select>
            </div>

            {/* Target PostgreSQL Table Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                PostgreSQL Ziel-Tabelle (Cloud)
              </label>
              <input
                type="text"
                value={targetTableName}
                onChange={(e) => setTargetTableName(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono focus:ring-indigo-500"
                placeholder="public.tabelle"
              />
            </div>

            {/* Sync Frequency */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Intervall / Trigger-Modus
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as ReplicationFrequency)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-indigo-500"
              >
                <option value="realtime_event">⚡ Realtime (Event-Bus & CDC Triggers)</option>
                <option value="interval_5s">⏱️ Alle 5 Sekunden (Ultra-Fast)</option>
                <option value="interval_30s">⏱️ Alle 30 Sekunden (Standard)</option>
                <option value="interval_5m">⏱️ Alle 5 Minuten (Netzwerk-sparend)</option>
                <option value="manual">🖐️ Nur manuell (On-Demand)</option>
              </select>
            </div>
          </div>

          {/* Conflict Strategy Selector */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Automatische Konfliktlösungs-Strategie bei Kollisionen
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[
                {
                  id: 'last_write_wins',
                  title: 'Last-Write-Wins (LWW)',
                  desc: 'Neuester Zeitstempel gewinnt atomar (Standard bei Offline-Sync).'
                },
                {
                  id: 'server_authoritative',
                  title: 'Cloud / Server Authoritative',
                  desc: 'PostgreSQL gewinnt immer und überschreibt lokale SQLite-Änderungen.'
                },
                {
                  id: 'client_authoritative',
                  title: 'Client / Edge Authoritative',
                  desc: 'Lokale SQLite-Baustellenänderungen haben Vorrang vor der Zentrale.'
                },
                {
                  id: 'interactive_merge',
                  title: '3-Wege Merge-Dialog',
                  desc: 'Pausiert bei Konflikten und öffnet den interaktiven Feld-Editor.'
                }
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setConflictStrategy(opt.id as ConflictStrategy)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    conflictStrategy === opt.id
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{opt.title}</span>
                    {conflictStrategy === opt.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column Mapping Grid */}
        <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Heterogenes Spalten-Mapping & Typ-Casting</span>
            </h5>
            <span className="text-[11px] text-slate-400">
              {columnMappings.length} Spalten zugeordnet
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-700 text-slate-500">
                <tr>
                  <th className="p-2">SQLite Spalte (Typ)</th>
                  <th className="p-2">➔</th>
                  <th className="p-2">PostgreSQL Spalte (Typ)</th>
                  <th className="p-2">Transformation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
                {columnMappings.map((mapping, idx) => (
                  <tr key={mapping.sourceColumn} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="p-2">
                      <span className="font-medium font-mono text-slate-900 dark:text-slate-100">{mapping.sourceColumn}</span>
                      <span className="ml-1 text-[10px] text-slate-400">({mapping.sourceType})</span>
                    </td>
                    <td className="p-2 text-slate-400">➔</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={mapping.targetColumn}
                        onChange={(e) => handleUpdateMapping(idx, { targetColumn: e.target.value })}
                        className="text-xs p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono w-40"
                      />
                      <span className="ml-1 text-[10px] text-indigo-500 font-mono">{mapping.targetType}</span>
                    </td>
                    <td className="p-2">
                      <select
                        value={mapping.transform || 'none'}
                        onChange={(e) => handleUpdateMapping(idx, { transform: e.target.value as any })}
                        className="text-xs p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value="none">Keine (Direkt)</option>
                        <option value="trim">Trim Whitespace</option>
                        <option value="uppercase">Uppercase</option>
                        <option value="json_stringify">JSON Stringify</option>
                        <option value="coalesce_null">Coalesce Null</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
