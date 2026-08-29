import React, { useState, useEffect } from 'react';
import { 
  Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2, Clock, 
  Trash2, X, Download, HardHat, FileText, Camera, Smartphone, Database 
} from 'lucide-react';
import { OfflineSyncService } from './offlineSyncService';
import { IndexedDbStorage } from './indexedDbStorage';
import { OutboxMutation, SyncConflict, LocalDailyReport, LocalDefect, LocalTimeTracking } from './outboxTypes';
import { ConflictResolutionModal } from './ConflictResolutionModal';

interface OfflineSyncDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineSyncDashboardModal: React.FC<OfflineSyncDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'outbox' | 'conflicts' | 'construction' | 'pwa'>('outbox');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
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

      setMutations(muts);
      setConflicts(cnfs);
      setReports(reps);
      setDefects(defs);
      setTimes(tms);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadData();
    const unsub = OfflineSyncService.subscribe((stats) => {
      setIsOnline(stats.isOnline);
      setIsSyncing(!!stats.isSyncing);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full flex flex-col h-[85vh] overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>Baustellen Offline- &amp; Synchronisations-Zentrale</span>
                {isOnline ? (
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
                IndexedDB Outbox-Pipeline, 3-Way-Merge Konfliktlösung und Baustellen-PWA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSync}
              disabled={isSyncing || !isOnline}
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

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('outbox')}
            className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'outbox'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Outbox Mutations-Warteschlange ({mutations.length})</span>
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
            <span>Konflikte ({conflicts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('construction')}
            className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'construction'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
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
            <span>PWA &amp; Tablet-Status</span>
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

          {activeTab === 'conflicts' && (
            <div className="space-y-3">
              {conflicts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-lg border-slate-300 dark:border-slate-700">
                  Keine Versionskonflikte vorhanden.
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
                  <span>Progressive Web App (PWA) &amp; Baustellen-Tablet Modus</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  DB Studio Pro ist als vollwertige Offline-PWA konzipiert. Auf Apple iPad (Safari ➔ Zum Home-Bildschirm) oder Android/Windows Tablets kann die App nativ installiert werden und startet im Vollbildmodus ohne Browser-Adressleiste.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Service Worker Cache</div>
                    <div className="text-slate-500">CacheFirst Strategie für Core-Assets, Fonts und Icons</div>
                  </div>
                  <div className="p-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Client-Side Compression</div>
                    <div className="text-slate-500">Automatische Reduktion von Baustellenfotos auf 1080p WebP</div>
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
