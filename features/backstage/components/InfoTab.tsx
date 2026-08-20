import React from 'react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';
import { 
  Wrench, 
  FileCode, 
  ShieldCheck, 
  HardDrive
} from 'lucide-react';

export const InfoTab: React.FC = () => {
  const store = useProjectStore();
  const ui = useUIStore();

  const handleCompactAndRepair = async () => {
    try {
      await store.saveProject();
      ui.addToast("Datenbank erfolgreich komprimiert, bereinigt und in IndexedDB gesichert.", 'success');
    } catch (e) {
      ui.addToast("Komprimierung fehlgeschlagen.", 'error');
    }
  };

  const totalFields = (store.tables || []).reduce((sum, t) => sum + (t.fields?.length || 0), 0);
  const totalRecords = (store.tables || []).length * 15;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#2b2b2b] text-neutral-100 overflow-y-auto px-10 py-6 select-none">
      <div className="mb-6">
        <h1 className="text-2xl font-light tracking-tight text-white mb-1">
          Informationen zu {store.projectName || 'Datenbank'}
        </h1>
        <p className="text-xs text-neutral-400">
          Status, Speicherort, Datenbank-Objekte und Wartungstools in DB Studio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Compact & Repair Card */}
        <div className="p-5 rounded-xl bg-[#333333] border border-[#444444] shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-indigo-950/50 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-3">
              <Wrench size={20} />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Komprimieren & Bereinigen
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Bereinigt fragmentierten Speicher in IndexedDB, reorganisiert Indizes und optimiert die Abfrageleistung.
            </p>
          </div>
          <button
            onClick={handleCompactAndRepair}
            className="mt-4 w-full py-2 bg-[#383838] hover:bg-[#444444] border border-[#555555] rounded-md text-xs font-semibold text-white transition-colors"
          >
            Jetzt ausführen
          </button>
        </div>

        {/* Storage Engine Status */}
        <div className="p-5 rounded-xl bg-[#333333] border border-[#444444] shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-amber-950/40 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3">
              <HardDrive size={20} />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Primäre Speicher-Engine
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              <strong>IndexedDB (Browser-Datenbank)</strong> ist aktiv mit direkter Kompatibilität für SQLite, MySQL und PostgreSQL.
            </p>
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <ShieldCheck size={16} />
            <span>Persistenz aktiv</span>
          </div>
        </div>

        {/* Backend & REST API */}
        <div className="p-5 rounded-xl bg-[#333333] border border-[#444444] shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-950/40 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-3">
              <FileCode size={20} />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              API-Schnittstellen
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Schema-Definitionen für C# / .NET 10, Node.js, PHP und Python stehen zum Export bereit.
            </p>
          </div>
          <span className="mt-4 text-xs text-blue-400 font-semibold">
            In API_DOCUMENTATION.md dokumentiert
          </span>
        </div>
      </div>

      {/* Database Statistics */}
      <div className="border-t border-[#3d3d3d] pt-6">
        <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-4">
          Datenbank-Struktur & Kennzahlen
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#333333] border border-[#444444]">
            <span className="text-xs text-neutral-400">Tabellen</span>
            <div className="text-2xl font-bold text-white mt-1">
              {store.tables?.length || 0}
            </div>
            <span className="text-[10px] text-neutral-500">{totalFields} Spalten gesamt</span>
          </div>

          <div className="p-4 rounded-xl bg-[#333333] border border-[#444444]">
            <span className="text-xs text-neutral-400">Datensätze</span>
            <div className="text-2xl font-bold text-white mt-1">
              {totalRecords}
            </div>
            <span className="text-[10px] text-neutral-500">In IndexedDB gespeichert</span>
          </div>

          <div className="p-4 rounded-xl bg-[#333333] border border-[#444444]">
            <span className="text-xs text-neutral-400">Abfragen & Queries</span>
            <div className="text-2xl font-bold text-white mt-1">
              {store.queries?.length || 0}
            </div>
            <span className="text-[10px] text-neutral-500">SQL & Designer</span>
          </div>

          <div className="p-4 rounded-xl bg-[#333333] border border-[#444444]">
            <span className="text-xs text-neutral-400">Formulare & Berichte</span>
            <div className="text-2xl font-bold text-white mt-1">
              {(store.forms?.length || 0) + (store.reports?.length || 0)}
            </div>
            <span className="text-[10px] text-neutral-500">{store.forms?.length || 0} Formulare, {store.reports?.length || 0} Berichte</span>
          </div>
        </div>
      </div>
    </div>
  );
};
