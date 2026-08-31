import React from 'react';
import { Database, HardDrive, RefreshCw, Zap, Server, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export const IndexedDbAndMultiDbShowcase: React.FC = () => {
  return (
    <div className="bg-[#242432] border border-indigo-500/30 rounded-2xl p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-[#38384a] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded border border-emerald-500/40">
              Architektur-Grundsatz
            </span>
            <span className="text-xs text-neutral-400">Client-Side First • Zero Backend Dependency</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HardDrive className="text-emerald-400" size={20} />
            IndexedDB als primäre Persistenz &amp; Multi-DB Transition
          </h2>
        </div>
      </div>

      <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
        DB Studio Pro ist so konzipiert, dass die <strong>IndexedDB des Browsers als Standard-Datenbank</strong> fungiert. Sie benötigen für Entwicklung, Prototyping, Formular-Design und Daten-Eingabe <strong>keinen aktiven Server</strong>. 
        Gleichzeitig sind alle Daten-Adapter und CRUD-Engines so modular aufgebaut, dass ein Übergang zu produktiven SQL-Servern (PostgreSQL, MySQL, SQLite, Microsoft SQL Server) ohne Code-Umbau im Frontend möglich ist.
      </p>

      {/* 3 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#1c1c28] border border-[#333344] space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <Database size={15} /> 1. IndexedDB Primärspeicher
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            Speichert Tabellenstrukturen, Views, Relationen, Formulare, Berichte und Datensätze persistent im Browser-Storage. Unbegrenzte Sessions, sofort verfügbar.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#1c1c28] border border-[#333344] space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
            <RefreshCw size={15} /> 2. Multi-DB Adapter Layer
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            Einheitliches Abfrage- und Datenmodell. DDL-Generatoren erzeugen native Schemata für SQLite, PostgreSQL, MySQL und MS SQL Server.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#1c1c28] border border-[#333344] space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <Zap size={15} /> 3. Offline-Sync &amp; Outbox
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed">
            Änderungen werden lokal gepuffert und bei Verbindung mit dem Ziel-Backend über 3-Wege-Merge konfliktfrei synchronisiert.
          </p>
        </div>
      </div>

      {/* Code / Architecture Schema Box */}
      <div className="p-4 rounded-xl bg-[#181822] border border-[#2e2e3e] font-mono text-xs text-neutral-300 space-y-2">
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">API-Abstraktion &amp; Datenfluss</div>
        <div className="text-emerald-400 font-semibold">
          UI / Designer / Formulare ──&gt; IDbAdapter (Unified Interface) ──&gt; IndexedDBProvider (Default)
        </div>
        <div className="text-indigo-300 text-[11px] pl-4">
          └─&gt; Optional: SqliteWasmProvider | PostgresProvider | MySqlProvider | SqlServerProvider
        </div>
      </div>
    </div>
  );
};
