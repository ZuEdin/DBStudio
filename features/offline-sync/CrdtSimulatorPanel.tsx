import React, { useState, useEffect } from 'react';
import { GitMerge, Sparkles, CheckCircle2, AlertTriangle, Play, RefreshCw, Layers, ShieldCheck } from 'lucide-react';
import { CrdtFieldMerger } from './crdtFieldMerger';
import { IndexedDbStorage, CrdtAuditRecord } from './indexedDbStorage';
import { CrdtFieldMergeResult } from './outboxTypes';

export const CrdtSimulatorPanel: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<CrdtAuditRecord[]>([]);
  
  // Simulation State
  const [baseDoc, setBaseDoc] = useState({
    title: 'Betonage Bodenplatte Haus B',
    status: 'IN_BEARBEITUNG',
    workerCount: 6,
    weatherTemp: 18,
    notes: 'Schalung abgenommen um 08:30 Uhr.',
  });

  const [clientDoc, setClientDoc] = useState({
    title: 'Betonage Bodenplatte Haus B',
    status: 'ABGENOMMEN',
    workerCount: 8, // Client changed status & workerCount
    weatherTemp: 18,
    notes: 'Schalung abgenommen um 08:30 Uhr.',
  });

  const [serverDoc, setServerDoc] = useState({
    title: 'Betonage Bodenplatte Haus B',
    status: 'IN_BEARBEITUNG',
    workerCount: 6,
    weatherTemp: 22, // Server changed weatherTemp & notes
    notes: 'Schalung abgenommen um 08:30 Uhr. Betonmischer 2 verzögert.',
  });

  const [lastResult, setLastResult] = useState<CrdtFieldMergeResult | null>(null);

  const loadAuditLogs = async () => {
    const logs = await IndexedDbStorage.getCrdtAuditLogs();
    setAuditLogs(logs.reverse());
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleRunSimulation = async () => {
    const now = Date.now();
    const result = CrdtFieldMerger.mergeFields({
      clientPayload: clientDoc,
      serverPayload: serverDoc,
      basePayload: baseDoc,
      clientTimestamps: { status: now, workerCount: now },
      serverTimestamps: { weatherTemp: now - 500, notes: now - 300 },
      clientDefaultTime: now,
      serverDefaultTime: now - 500,
    });

    setLastResult(result);

    if (result.autoResolved) {
      const record: CrdtAuditRecord = {
        id: `sim_${Date.now()}`,
        tableName: 'tbl_bautagesbericht',
        recordId: 'REC-2026-088',
        resolvedFields: result.resolvedFields.map((f) => f.fieldName),
        notes: result.auditNotes,
        timestamp: Date.now(),
      };
      await IndexedDbStorage.logCrdtResolution(record);
      await loadAuditLogs();
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header Info */}
      <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-start gap-2.5">
        <GitMerge className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
            <span>CRDT Feldebene-Konfliktbereinigung (LWW-Element-Set)</span>
            <span className="bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded text-[10px] font-mono">
              Kein Benutzerdialog bei disjunkten Spalten
            </span>
          </div>
          <p className="text-indigo-700 dark:text-indigo-300 text-[11px] mt-0.5">
            Wenn Client und Server unterschiedliche Spalten desselben Datensatzes verändern, führt die CRDT-Engine die Daten deterministisch und kollisionsfrei zusammen.
          </p>
        </div>
      </div>

      {/* Simulator 3-Way Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Base Version */}
        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2">
          <div className="font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span>1. Basis-Zustand (Ausgangsversion)</span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div>Status: <span className="font-semibold">{baseDoc.status}</span></div>
            <div>Arbeiter: <span className="font-semibold">{baseDoc.workerCount}</span></div>
            <div>Temperatur: <span className="font-semibold">{baseDoc.weatherTemp}°C</span></div>
            <div className="truncate text-slate-500">Notiz: {baseDoc.notes}</div>
          </div>
        </div>

        {/* Client Changes */}
        <div className="p-3 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
          <div className="font-bold text-blue-700 dark:text-blue-300 flex items-center justify-between">
            <span>2. Offline Client-Änderung</span>
            <span className="text-[10px] bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold">Lokal</span>
          </div>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div>
              <label className="text-slate-500 block text-[10px]">Status (lokal geändert):</label>
              <select
                value={clientDoc.status}
                onChange={(e) => setClientDoc({ ...clientDoc, status: e.target.value })}
                className="w-full p-1 rounded border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-900 font-bold"
              >
                <option value="OFFEN">OFFEN</option>
                <option value="IN_BEARBEITUNG">IN_BEARBEITUNG</option>
                <option value="ABGENOMMEN">ABGENOMMEN</option>
              </select>
            </div>
            <div>
              <label className="text-slate-500 block text-[10px]">Arbeiteranzahl (lokal geändert):</label>
              <input
                type="number"
                value={clientDoc.workerCount}
                onChange={(e) => setClientDoc({ ...clientDoc, workerCount: parseInt(e.target.value) || 0 })}
                className="w-full p-1 rounded border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-900 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Server Changes */}
        <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
          <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
            <span>3. Parallele Server-Änderung</span>
            <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">Zentrale</span>
          </div>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div>
              <label className="text-slate-500 block text-[10px]">Temperatur (Server geändert):</label>
              <input
                type="number"
                value={serverDoc.weatherTemp}
                onChange={(e) => setServerDoc({ ...serverDoc, weatherTemp: parseInt(e.target.value) || 0 })}
                className="w-full p-1 rounded border border-emerald-300 dark:border-emerald-600 bg-white dark:bg-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="text-slate-500 block text-[10px]">Notiz (Server geändert):</label>
              <input
                type="text"
                value={serverDoc.notes}
                onChange={(e) => setServerDoc({ ...serverDoc, notes: e.target.value })}
                className="w-full p-1 rounded border border-emerald-300 dark:border-emerald-600 bg-white dark:bg-slate-900 font-bold truncate"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handleRunSimulation}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>CRDT Auto-Merge Test ausführen</span>
        </button>
      </div>

      {/* Result Display */}
      {lastResult && (
        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-bold flex items-center gap-2">
              {lastResult.autoResolved ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Automatische CRDT-Zusammenführung erfolgreich (0 Dialoge erforderlich)</span>
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Kollision auf gleichem Feld erkannt: {lastResult.conflictingFields.join(', ')}</span>
                </span>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded bg-slate-950 text-emerald-400 font-mono text-[11px]">
            <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">// Konvergierter Payload:</div>
            <pre>{JSON.stringify(lastResult.mergedPayload, null, 2)}</pre>
          </div>

          <div className="space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">Audit-Log Protokoll:</div>
            {lastResult.auditNotes.map((note, idx) => (
              <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical Audit Log */}
      {auditLogs.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="font-bold text-slate-700 dark:text-slate-200">
            Protokollierte CRDT Auto-Merges ({auditLogs.length})
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/40 text-[11px] flex justify-between items-center">
                <div>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{log.tableName}</span> ({log.recordId}) – Spalten: <span className="font-mono">{log.resolvedFields.join(', ')}</span>
                </div>
                <div className="text-slate-400 text-[10px]">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
