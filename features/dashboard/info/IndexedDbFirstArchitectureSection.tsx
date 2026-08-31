import React from 'react';
import { Database, HardDrive, Zap, RefreshCw, Layers, ShieldCheck, ArrowRight, Server, FileCode, CheckCircle2 } from 'lucide-react';

export const IndexedDbFirstArchitectureSection: React.FC = () => {
  const features = [
    {
      icon: <HardDrive className="text-emerald-500" size={22} />,
      title: "IndexedDB als Standard-Speicher",
      desc: "Alle Tabellen, Schemata, Formulare, Abfragen und Datensätze werden primär und ohne Latenz in der hochperformanten IndexedDB des Browsers persistiert."
    },
    {
      icon: <Zap className="text-amber-500" size={22} />,
      title: "Zero-Downtime & Offline-Betrieb",
      desc: "Arbeiten Sie komplett autark ohne aktiven Webserver oder Internetverbindung. Die gesamte Logik inklusive relationaler Integrität läuft lokal."
    },
    {
      icon: <RefreshCw className="text-indigo-500" size={22} />,
      title: "Nahtlose Multi-DB Replikation",
      desc: "Synchronisieren Sie lokale IndexedDB-Stände auf Knopfdruck oder im Hintergrund mit SQLite, PostgreSQL, MySQL oder Microsoft SQL Server."
    },
    {
      icon: <FileCode className="text-blue-500" size={22} />,
      title: "Modulare & saubere REST/SQL APIs",
      desc: "Alle Schnittstellen sind so abstrahiert, dass ein Wechsel von IndexedDB zu nativer SQL-Persistenz ohne Refactoring des Frontends möglich ist."
    }
  ];

  const dbTargets = [
    { name: "IndexedDB (Lokal)", badge: "Standard / Primär", desc: "100% Client-Side, bis zu mehreren GB pro Origin, sofort einsatzbereit.", color: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" },
    { name: "SQLite (Embedded / WASM)", badge: "Single-File / Local", desc: "Ideal für Desktop (Tauri / Electron) oder lokale Edge-Devices.", color: "border-blue-500/50 bg-blue-500/10 text-blue-300" },
    { name: "PostgreSQL & Supabase", badge: "Cloud & Enterprise", desc: "Volle Unterstützung für Row Level Security (RLS), JSONB und UUIDs.", color: "border-indigo-500/50 bg-indigo-500/10 text-indigo-300" },
    { name: "MySQL & MariaDB", badge: "Web-Standard", desc: "Perfekt für klassisches LAMP/LEMP Hosting, Laravel und PHP Backends.", color: "border-cyan-500/50 bg-cyan-500/10 text-cyan-300" },
    { name: "Microsoft SQL Server", badge: "Enterprise & Access", desc: "Optimaler Zielhafen für migrierte Access MDB/ACCDB Datenbanken.", color: "border-purple-500/50 bg-purple-500/10 text-purple-300" }
  ];

  return (
    <div className="py-16 px-6 bg-slate-900 text-white border-b border-slate-800" id="indexeddb-architecture-section">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-3">
            <Database size={13} /> IndexedDB-First Architektur
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            Lokale Datenhoheit mit universeller SQL-Skalierbarkeit
          </h2>
          <p className="text-slate-300 text-sm md:text-base max-w-3xl mx-auto mt-3 leading-relaxed">
            DB Studio setzt auf das <strong>Local-First-Paradigma</strong>: Entwickeln Sie direkt im Browser mit IndexedDB und exportieren oder synchronisieren Sie Ihre Daten nahtlos in relationale Unternehmensdatenbanken.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((item, idx) => (
            <div key={idx} className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/50 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 w-fit mb-3">
                  {item.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* DB Targets Overview */}
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="text-indigo-400" size={18} />
                Unterstützte Ziel-Datenbanken &amp; Replikationspfade
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ein einheitliches Datenmodell – überall einsetzbar ohne Architektur-Bruch
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50">
              API-Dokumentation: docs/API_DOCUMENTATION.md
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dbTargets.map((target, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="font-bold text-sm text-slate-100">{target.name}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${target.color}`}>
                    {target.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{target.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
