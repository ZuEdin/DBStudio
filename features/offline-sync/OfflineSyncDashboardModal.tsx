import React, { useState, useEffect } from 'react';
import { 
  Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2, Clock, 
  Trash2, X, Download, HardHat, FileText, Camera, Smartphone, Database,
  GitMerge, Archive, Zap, Radio
} from 'lucide-react';
import { OfflineSyncService } from './offlineSyncService';
import { IndexedDbStorage } from './indexedDbStorage';
import { BackgroundSyncService } from './backgroundSyncService';
import { OutboxMutation, SyncConflict, LocalDailyReport, LocalDefect, LocalTimeTracking, OfflineSyncStats } from './outboxTypes';
import { ConflictResolutionModal } from './ConflictResolutionModal';
import { CrdtSimulatorPanel } from './CrdtSimulatorPanel';
import { CompressionWorkbenchPanel } from './CompressionWorkbenchPanel';

interface OfflineSyncDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineSyncDashboardModal: React.FC<OfflineSyncDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'outbox' | 'crdt' | 'compression' | 'conflicts' | 'construction' | 'pwa'>('outbox');
  const [stats, setStats] = useState<OfflineSyncStats>({
    pendingCount: 0,
    conflictCount: 0,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    backgroundSyncSupported: BackgroundSyncService.isSupported(),
    backgroundSyncRegistered: false,
    totalBytesSavedByCompression: 0,
    autoResolvedCrdtCount: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [mutations, setMutations] = useState<OutboxMutation[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  
  // Local construction data
  const [reports, setReports] = useState<LocalDailyReport[]>([]);
  const [defects, setDefects] = useState<LocalDefect[]>([]);
  const [times, setTimes] = useState<LocalTimeTracking[]>([]);

  const loadData = async () => {
    try {
      const muts = await IndexedDbStorage.getAllMutations();
      const cnfs = await IndexedDbStorage.getConflicts();
      const reps = await IndexedDbStorage.getDailyReports();
      const defs = await IndexedDbStorage.getDefects();
      const tms = await IndexedDbStorage.getTimeTrackings();
      const currentStats = await OfflineSyncService.getStats();

      setMutations(muts);
      setConflicts(cnfs);
      setReports(reps);
      setDefects(defs);
      setTimes(tms);
      setStats(currentStats);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadData();
    const unsub = OfflineSyncService.subscribe((newStats) => {
      setStats(newStats);
      setIsSyncing(!!newStats.isSyncing);
      loadData();
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    await OfflineSyncService.flushOutbox();
    await loadData();
    setIsSyncing(false);
  };

  const handleClearSynced = async (id: string) => {
    await IndexedDbStorage.markSynced(id);
    await loadData();
  };

  const handleTriggerBackgroundSync = async () => {
    const success = await BackgroundSyncService.requestBackgroundSync();
    if (success) {
      alert('Background Sync Request erfolgreich beim Service Worker registriert.');
    } else {
      await handleManualSync();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl max-w-5xl w-full flex flex-col h-[88vh] overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>Baustellen Offline- &amp; Synchronisations-Zentrale</span>
                {stats.isOnline ? (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Online
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> Offline (Funkloch-Modus)
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Background Sync API, Brotli/GZIP Payload-Kompression, CRDT Feldebene-Merge &amp; Outbox
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSync}
              disabled={isSyncing || !stats.isOnline}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center gap-1.5 transition shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronisiere...' : 'Jetzt Syncen'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Quick Bar */}
        <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Service Worker Background Sync:</span>
              <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                stats.backgroundSyncRegistered
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {stats.backgroundSyncRegistered ? 'Aktiviert (Service Worker)' : 'Bereit'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Auto-CRDT Merges:</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {stats.autoResolvedCrdtCount} gelöst
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Eingespartes Volumen:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {(stats.totalBytesSavedByCompression / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>

          <button
            onClick={handleTriggerBackgroundSync}
            className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1"
          >
            <Radio className="w-3 h-3 text-indigo-500" />
            <span>Background Sync anfordern</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 px-4 pt-2 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('outbox')}
            className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'outbox'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Outbox Warteschlange ({mutations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('crdt')}
            className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'crdt'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>CRDT Feldebene-Merge</span>
          </button>
          <button
            onClick={() => setActiveTab('compression')}
            className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'compression'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Payload-Kompression</span>
          </button>
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'conflicts'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>3-Way Konflikte ({conflicts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('construction')}
            className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'construction'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lokale Baustellendaten</span>
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'pwa'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>PWA &amp; Background Sync</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'outbox' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                Alle lokalen Schreibmutationen werden transaktionssicher in IndexedDB gepuffert und bei Online-Verbindung abgearbeitet:
              </div>
              {mutations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-lg border-slate-300 dark:border-slate-700">
                  Keine anstehenden Mutationen in der Outbox. Alle Daten sind synchron.
                </div>
              ) : (
                <div className="space-y-2">
                  {mutations.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-mono font-semibold">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              m.operation === 'INSERT'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : m.operation === 'UPDATE'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {m.operation}
                          </span>
                          <span>{m.tableName}</span>
                          <span className="text-slate-400">ID: {m.recordId}</span>
                          {m.isCompressed && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold">
                              GZIP ({(m.compressedSizeBytes || 0)} B)
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] font-mono truncate max-w-md">
                          Payload: {JSON.stringify(m.payload)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right text-[11px] text-slate-400">
                          <div>Status: <span className="font-semibold text-slate-700 dark:text-slate-200">{m.status}</span></div>
                          <div>Versuche: {m.retryCount}</div>
                        </div>
                        <button
                          onClick={() => handleClearSynced(m.id)}
                          title="Lokal verwerfen"
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'crdt' && <CrdtSimulatorPanel />}

          {activeTab === 'compression' && <CompressionWorkbenchPanel />}

          {activeTab === 'conflicts' && (
            <div className="space-y-3">
              {conflicts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-lg border-slate-300 dark:border-slate-700">
                  Keine ungelösten 3-Way Versionskonflikte vorhanden.
                </div>
              ) : (
                <div className="space-y-2">
                  {conflicts.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Konflikt in Tabelle {c.tableName} (ID: {c.recordId})</span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 mt-1">
                          Betroffene Felder: <span className="font-mono">{c.conflictFields.join(', ')}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedConflict(c)}
                        className="px-3 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white shadow"
                      >
                        Konflikt lösen
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'construction' && (
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">
                  Lokale Bautagesberichte ({reports.length})
                </h3>
                {reports.length === 0 ? (
                  <p className="text-slate-400 italic">Noch keine lokalen Tagesberichte gespeichert.</p>
                ) : (
                  <div className="space-y-1.5">
                    {reports.map((r) => (
                      <div key={r.id} className="p-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between">
                        <div>
                          <span className="font-bold">Datum: {r.reportDate}</span> – Wetter: {r.weatherTemp ?? 20}°C, {r.weatherCondition ?? 'Klar'} ({r.workerCount ?? 5} Arbeiter)
                        </div>
                        <span className="text-[10px] font-mono text-indigo-500">{r.syncStatus}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">
                  Lokale Mängelerfassungen mit Plan-Verortung ({defects.length})
                </h3>
                {defects.length === 0 ? (
                  <p className="text-slate-400 italic">Keine lokalen Mängel gespeichert.</p>
                ) : (
                  <div className="space-y-1.5">
                    {defects.map((d) => (
                      <div key={d.id} className="p-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between">
                        <div>
                          <span className="font-bold">{d.title}</span> ({d.trade}) – Schwere: {d.severity}
                        </div>
                        <span className="text-[10px] font-mono text-indigo-500">{d.syncStatus}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-3">
                <div className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  <span>Progressive Web App (PWA) &amp; Background Sync Engine</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  DB Studio Pro nutzt Service Worker mit W3C Background Sync API zur asynchronen Hintergrundübertragung von Outbox-Paketen, selbst wenn das Browser-Tab geschlossen wird oder das Gerät erst Stunden später wieder Mobilfunkempfang erhält.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Background Sync API</div>
                    <div className="text-slate-500">Automatisches Leeren der IndexedDB-Outbox via Service Worker Sync Event</div>
                  </div>
                  <div className="p-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Streams Compression</div>
                    <div className="text-slate-500">Native GZIP &amp; Brotli Kompression für Dokumente &amp; Baustellenfotos</div>
                  </div>
                  <div className="p-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">CRDT Feldebene</div>
                    <div className="text-slate-500">LWW-Element-Set Merging ohne blockierende Benutzerdialoge</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
          >
            Schließen
          </button>
        </div>
      </div>

      {selectedConflict && (
        <ConflictResolutionModal
          conflict={selectedConflict}
          onResolved={async () => {
            setSelectedConflict(null);
            await loadData();
          }}
          onClose={() => setSelectedConflict(null)}
        />
      )}
    </div>
  );
};
