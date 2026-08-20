import React from 'react';
import { useConfigStore } from '../../../stores/useConfigStore';
import { useUIStore } from '../../../stores/useUIStore';
import { 
  Sliders, 
  HardDrive, 
  Save, 
  Keyboard, 
  FileText, 
  CheckCircle2, 
  Server
} from 'lucide-react';

export const OptionenTab: React.FC = () => {
  const { config, updateConfig } = useConfigStore();
  const ui = useUIStore();

  const handleSaveOptions = () => {
    ui.addToast("Optionen erfolgreich gespeichert.", 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#2b2b2b] text-neutral-100 overflow-y-auto px-10 py-6 select-none">
      <div className="mb-6">
        <h1 className="text-2xl font-light tracking-tight text-white mb-1">
          DB Studio Optionen & Systemeinstellungen
        </h1>
        <p className="text-xs text-neutral-400">
          Konfigurieren Sie Standard-Datenbanktreiber, Auto-Save und API-Architektur
        </p>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Storage Engine Priority Setting */}
        <div className="p-5 rounded-xl bg-[#333333] border border-[#444444]">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive size={16} className="text-indigo-400" />
            <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Standard-Datenbank-Engine (Priorität)
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mb-4">
            Legt fest, welches Datenbanksystem standardmäßig für neue Projekte und Speichervorgänge priorisiert wird.
          </p>

          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/50 cursor-pointer">
              <input
                type="radio"
                name="storage_engine"
                checked={config.storage === 'local'}
                onChange={() => updateConfig({ storage: 'local' })}
                className="mt-1 accent-indigo-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">IndexedDB (Browser-Datenbank)</span>
                  <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded">
                    PRIORITÄT / STANDARD
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 mt-0.5">
                  100% autarke lokale Speicherung im Browser. Schnelle Ladezeiten, Offline-fähig und kein Serverzwang.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg bg-[#383838] border border-[#444444] hover:bg-[#3d3d3d] cursor-pointer">
              <input
                type="radio"
                name="storage_engine"
                checked={config.storage === 'server'}
                onChange={() => updateConfig({ storage: 'server' })}
                className="mt-1 accent-indigo-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Zentraler Backend-Server (MySQL / PostgreSQL / MSSQL)</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Synchronisiert Änderungen mit einer externen API und zentraler Serverdatenbank.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Auto-Save */}
        <div className="p-5 rounded-xl bg-[#333333] border border-[#444444]">
          <div className="flex items-center gap-2 mb-3">
            <Save size={16} className="text-emerald-400" />
            <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Automatisches Speichern (Auto-Save)
            </h2>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-medium text-white">Änderungen fortlaufend in IndexedDB sichern</span>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Alle 15 Sekunden bei erkannten Schema- oder Datensatz-Änderungen
              </p>
            </div>
            <span className="px-2 py-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
              Aktiviert
            </span>
          </div>
        </div>

        {/* Keyboard Shortcuts Overview */}
        <div className="p-5 rounded-xl bg-[#333333] border border-[#444444]">
          <div className="flex items-center gap-2 mb-3">
            <Keyboard size={16} className="text-blue-400" />
            <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Tastaturkürzel (DB Studio Shortcuts)
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between p-2.5 rounded bg-[#2d2d2d]">
              <span className="text-neutral-400">Speichern:</span>
              <span className="font-mono font-bold text-neutral-200">Strg + S</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#2d2d2d]">
              <span className="text-neutral-400">Befehlspalette:</span>
              <span className="font-mono font-bold text-neutral-200">Strg + K</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#2d2d2d]">
              <span className="text-neutral-400">Neue Tabelle:</span>
              <span className="font-mono font-bold text-neutral-200">Alt + N</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#2d2d2d]">
              <span className="text-neutral-400">Suchen / Filter:</span>
              <span className="font-mono font-bold text-neutral-200">Strg + F</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#2d2d2d]">
              <span className="text-neutral-400">Backstage verlassen:</span>
              <span className="font-mono font-bold text-neutral-200">Esc</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveOptions}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors"
          >
            Einstellungen übernehmen
          </button>
        </div>
      </div>
    </div>
  );
};
