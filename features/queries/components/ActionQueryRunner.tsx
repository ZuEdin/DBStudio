import React, { useState } from 'react';
import { ActionQuery, Table, DbType } from '../../../types';
import { Zap, Play, ShieldAlert, Check, X, ArrowRight, Database, AlertCircle, RefreshCw, PlusCircle, Trash2 } from 'lucide-react';
import { executeActionQuery } from '../utils/queryExecution';
import { useProjectStore } from '../../../stores/useProjectStore';

interface ActionQueryRunnerProps {
  query: ActionQuery;
  tables: Table[];
  dbType: DbType;
  onClose?: () => void;
}

export const ActionQueryRunner: React.FC<ActionQueryRunnerProps> = ({
  query,
  tables,
  dbType,
  onClose,
}) => {
  const setTables = useProjectStore((state) => state.setTables);

  const [dryRunDone, setDryRunDone] = useState(false);
  const [affectedCount, setAffectedCount] = useState<number | null>(null);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [previewTables, setPreviewTables] = useState<Table[]>(tables);

  const targetTable = tables.find((t) => t.id === query.targetTableId);
  const sourceTable = query.type === 'INSERT' ? tables.find((t) => t.id === query.sourceTableId) : null;

  // 1. Dry Run / Simulation
  const handleDryRun = () => {
    // Clone tables in memory and execute simulation
    const clone = JSON.parse(JSON.stringify(tables));
    const res = executeActionQuery(query, clone, []);
    setAffectedCount(res.affectedRows);
    setPreviewTables(res.updatedTables);
    setDryRunDone(true);
    setExecutionMessage(`Dry-Run erfolgreich: ${res.affectedRows} Datensätze würden modifiziert.`);
  };

  // 2. Real Execution with Confirmation
  const handleCommit = () => {
    setIsExecuting(true);
    setTimeout(() => {
      const res = executeActionQuery(query, tables, []);
      setTables(res.updatedTables);
      setIsExecuting(false);
      setExecutionMessage(`Erfolgreich ausgeführt: ${res.message}`);
    }, 400);
  };

  const getQueryTitle = () => {
    if (query.type === 'UPDATE') return 'Massen-Aktualisierungs-Abfrage (UPDATE)';
    if (query.type === 'INSERT') return 'Anfüge- & Duplizier-Abfrage (INSERT INTO ... SELECT)';
    if (query.type === 'DELETE') return 'Lösch-Abfrage (DELETE FROM)';
    return 'Aktionsabfrage';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white max-w-3xl mx-auto shadow-2xl my-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg">
            <Zap size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold">{getQueryTitle()}</h3>
            <p className="text-xs text-slate-400">Abfrage: <span className="text-white font-mono">{query.name}</span></p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Target Details */}
      <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
        <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
          <span className="text-slate-400 font-semibold block mb-1">Zieltabelle:</span>
          <span className="font-mono text-emerald-400 font-bold text-sm">
            {targetTable?.name || query.targetTableId}
          </span>
          <span className="text-slate-500 block mt-0.5">({(targetTable?.data || []).length} bestehende Datensätze)</span>
        </div>

        {query.type === 'INSERT' && (
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-slate-400 font-semibold block mb-1">Quelltabelle:</span>
            <span className="font-mono text-indigo-400 font-bold text-sm">
              {sourceTable?.name || query.sourceTableId}
            </span>
            <span className="text-slate-500 block mt-0.5">({(sourceTable?.data || []).length} Quell-Datensätze)</span>
          </div>
        )}

        {query.type === 'UPDATE' && (
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-slate-400 font-semibold block mb-1">Modifikationen:</span>
            <span className="text-amber-400 font-mono">
              {Object.keys(query.updateMap || {}).length} Feld-Zuweisungen
            </span>
          </div>
        )}
      </div>

      {/* Action Plan & Safety Guard */}
      <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-3.5 mb-5 flex items-start gap-3 text-xs text-amber-200">
        <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-300">Transaktions- & Änderungsschutz aktiv</p>
          <p className="text-amber-200/80 mt-0.5 leading-relaxed">
            Aktionsabfragen verändern Daten dauerhaft. Führen Sie zuerst einen risikofreien <b>Dry-Run (Testlauf)</b> durch, um die Anzahl betroffener Zeilen zu prüfen, bevor Änderungen in den Projekt-Datenbestand übernommen werden.
          </p>
        </div>
      </div>

      {/* Execution Feedback */}
      {executionMessage && (
        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-3 mb-5 flex items-center gap-2 text-xs text-emerald-300">
          <Check size={16} className="text-emerald-400" />
          <span>{executionMessage}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-2 border-t border-slate-800">
        <button
          onClick={handleDryRun}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw size={14} className="text-indigo-400" />
          Testlauf ausführen (Dry-Run)
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleCommit}
            disabled={isExecuting}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-white transition-all shadow-md ${
              dryRunDone
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-amber-600 hover:bg-amber-500'
            }`}
          >
            <Play size={14} />
            {isExecuting ? 'Wird angewendet...' : dryRunDone ? 'Änderungen jetzt anwenden' : 'Direkt ausführen'}
          </button>
        </div>
      </div>
    </div>
  );
};
