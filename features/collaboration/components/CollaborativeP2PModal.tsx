import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Radio, 
  Wifi, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Sparkles,
  RefreshCw,
  Layers,
  Activity
} from 'lucide-react';
import { CrdtLocalPeerSimulator } from '../../../services/crdtLocalPeerSimulator';
import { PeerPresence, FieldLockState } from '../../../types/crdtContracts';
import { useProjectStore } from '../../../stores/useProjectStore';

interface CollaborativeP2PModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CollaborativeP2PModal: React.FC<CollaborativeP2PModalProps> = ({
  isOpen,
  onClose,
}) => {
  const store = useProjectStore();
  const [peers, setPeers] = useState<PeerPresence[]>([]);
  const [locks, setLocks] = useState<FieldLockState[]>([]);
  const [localName, setLocalName] = useState<string>('Lokaler Entwickler (Tab 1)');
  const [localRole, setLocalRole] = useState<'Architect' | 'SiteManager' | 'Estimator' | 'Developer'>('Developer');

  useEffect(() => {
    if (isOpen) {
      CrdtLocalPeerSimulator.initialize(localName);
      const unsubscribe = CrdtLocalPeerSimulator.subscribe((currentPeers, currentLocks) => {
        setPeers(currentPeers);
        setLocks(currentLocks);
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateIdentity = () => {
    CrdtLocalPeerSimulator.setLocalUserInfo(localName, localRole);
  };

  const handleSimulateLock = (fieldId: string, tableId: string) => {
    CrdtLocalPeerSimulator.acquireFieldLock(tableId, fieldId);
  };

  const handleReleaseLock = (fieldId: string, tableId: string) => {
    CrdtLocalPeerSimulator.releaseFieldLock(tableId, fieldId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-[84vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Users size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  P2P / LAN Multi-User Kollaboration (CRDTs)
                </h2>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                  Serverless Live-Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Echtzeit-Synchronisation und kollaboratives Feld-Locking im lokalen Netzwerk / Browser-Tabs.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Radio size={15} className="text-emerald-400 animate-pulse" />
            <span className="font-bold text-white">
              BroadcastChannel &amp; WebRTC Datenkanal aktiv
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-[11px] text-slate-400">
              Erkannte Peers im LAN/Browser: <span className="text-emerald-400 font-bold">{peers.length + 1}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Aktive Feld-Locks: <span className="text-amber-400 font-bold">{locks.length}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {/* Identity Editor */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase">
              Eigene Identität im Peer-Netzwerk
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Benutzername:</label>
                <input
                  type="text"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500 font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Rolle:</label>
                <select
                  value={localRole}
                  onChange={(e) => setLocalRole(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500 font-bold"
                >
                  <option value="Developer">Entwickler / Architekt</option>
                  <option value="SiteManager">Bauleiter (Vor-Ort)</option>
                  <option value="Estimator">Kalkulator / Baukosten</option>
                  <option value="Architect">Planer / GAEB-Ersteller</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleUpdateIdentity}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold cursor-pointer transition-all"
                >
                  Presence aktualisieren
                </button>
              </div>
            </div>
          </div>

          {/* Active Peers & Simulated Locks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Peers */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-300 uppercase mb-3 flex items-center justify-between">
                  <span>Aktive Teilnehmer (Peers)</span>
                  <Activity size={14} className="text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <div>
                        <div className="font-bold text-white">{localName} (Du)</div>
                        <div className="text-[10px] text-emerald-300">{localRole}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-200">
                      Lokal
                    </span>
                  </div>

                  {peers.map((peer) => (
                    <div
                      key={peer.peerId}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: peer.color || '#6366f1' }}
                        />
                        <div>
                          <div className="font-bold text-white">{peer.userName}</div>
                          <div className="text-[10px] text-slate-400">{peer.userRole}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {peer.activeView}
                      </span>
                    </div>
                  ))}

                  {peers.length === 0 && (
                    <div className="text-xs text-slate-500 text-center py-4">
                      Öffnen Sie DB Studio in einem zweiten Browser-Tab, um Multi-User Sync live zu sehen.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Field Locking Simulator */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-slate-300 uppercase mb-3 flex items-center justify-between">
                <span>CRDT Feld-Locking Test</span>
                <Lock size={14} className="text-amber-400" />
              </div>
              <div className="space-y-2 text-xs">
                {store.tables.slice(0, 3).map((tbl) => (
                  <div key={tbl.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="font-bold text-white text-[11px]">{tbl.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {tbl.fields.slice(0, 3).map((f) => {
                        const isLocked = locks.some((l) => l.tableId === tbl.id && l.fieldId === f.id);
                        return (
                          <button
                            key={f.id}
                            onClick={() =>
                              isLocked
                                ? handleReleaseLock(f.id, tbl.id)
                                : handleSimulateLock(f.id, tbl.id)
                            }
                            className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all ${
                              isLocked
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                            <span>{f.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Konfliktfreie Replikation ohne externe Server (CRDT Yjs Standard)</span>
          </div>
          <div>Kanal: dbstudio_crdt_channel</div>
        </div>

      </div>
    </div>
  );
};
