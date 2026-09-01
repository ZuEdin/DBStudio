import React from 'react';
import { Database, Layout, Cpu, Shield, FileCheck, Layers, ChevronRight, HardDrive, RefreshCw } from 'lucide-react';

interface PromoFeaturesBentoProps {
  onNavigate: (type: 'table_create' | 'query_designer' | 'create_report' | 'create_form' | 'table_data', id?: string) => void;
}

export const PromoFeaturesBento: React.FC<PromoFeaturesBentoProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Das umfassende Feature-Arsenal für Datenbank-Profis
        </h3>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Von der visuellen Modellierung über komplexe SQL-Abfragen bis hin zur automatisierten DACH-Fakturierung.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
        {/* Card 1: Schema Builder */}
        <div className="bg-slate-950/70 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-indigo-500/50 transition-all group">
          <div className="space-y-3">
            <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl w-fit text-amber-400">
              <Database size={22} />
            </div>
            <h4 className="font-extrabold text-white text-lg group-hover:text-indigo-400 transition-colors">
              Visueller Schema- &amp; Tabellen-Builder
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Definieren Sie Primärschlüssel, Relationen, Constraints, Indizes und berechnete Felder mit automatischer Integritätsprüfung.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('table_create')} 
            className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-900 cursor-pointer"
          >
            Tabelle erstellen <ChevronRight size={14} />
          </button>
        </div>

        {/* Card 2: Form Designer */}
        <div className="bg-slate-950/70 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-indigo-500/50 transition-all group">
          <div className="space-y-3">
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl w-fit text-indigo-400">
              <Layout size={22} />
            </div>
            <h4 className="font-extrabold text-white text-lg group-hover:text-indigo-400 transition-colors">
              Drag-&-Drop FormDesigner
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Erstellen Sie mehrspaltige Eingabemasken mit Rollenberechtigungen (RBAC), Validierungsregeln und Master-Detail-Subformularen.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('create_form')} 
            className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-900 cursor-pointer"
          >
            Formular entwerfen <ChevronRight size={14} />
          </button>
        </div>

        {/* Card 3: Query & Filter Engine */}
        <div className="bg-slate-950/70 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-indigo-500/50 transition-all group">
          <div className="space-y-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl w-fit text-emerald-400">
              <Cpu size={22} />
            </div>
            <h4 className="font-extrabold text-white text-lg group-hover:text-indigo-400 transition-colors">
              Abfrage-Designer &amp; SQL-Engine
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Visueller QBE-Grid-Editor, Joins, Aggregationen (SUM, AVG, COUNT), Parameterabfragen und direkter SQL-Editor mit Syntax-Highlighting.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('query_designer')} 
            className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-900 cursor-pointer"
          >
            SQL-Abfrage bauen <ChevronRight size={14} />
          </button>
        </div>

        {/* Card 4: DACH E-Invoicing */}
        <div className="bg-slate-950/70 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-indigo-500/50 transition-all group">
          <div className="space-y-3">
            <div className="bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-xl w-fit text-sky-400">
              <FileCheck size={22} />
            </div>
            <h4 className="font-extrabold text-white text-lg group-hover:text-indigo-400 transition-colors">
              DACH Fakturierung &amp; E-Rechnung
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              ZUGFeRD 2.3, XRechnung 3.0 und Schweizer QR-Rechnung direkt in Berichten integriert – 100% rechtskonform für B2B &amp; B2G.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('create_report')} 
            className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-900 cursor-pointer"
          >
            Bericht / Rechnung anlegen <ChevronRight size={14} />
          </button>
        </div>

        {/* Card 5: Local-First Storage */}
        <div className="bg-slate-950/70 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-indigo-500/50 transition-all group">
          <div className="space-y-3">
            <div className="bg-purple-500/10 border border-purple-500/20 p-2.5 rounded-xl w-fit text-purple-400">
              <HardDrive size={22} />
            </div>
            <h4 className="font-extrabold text-white text-lg group-hover:text-indigo-400 transition-colors">
              Local-First &amp; IndexedDB Engine
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Alle Daten bleiben sicher in Ihrem Browser oder werden per Local Bridge mit Ihren lokalen SQLite-, Access- oder Postgres-Dateien synchronisiert.
            </p>
          </div>
          <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-900">
            <RefreshCw size={12} className="animate-spin" /> Offlinefähig &amp; Sicher
          </div>
        </div>

        {/* Card 6: Multi-DB & Full Code Export */}
        <div className="bg-slate-950/70 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-indigo-500/50 transition-all group">
          <div className="space-y-3">
            <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl w-fit text-rose-400">
              <Layers size={22} />
            </div>
            <h4 className="font-extrabold text-white text-lg group-hover:text-indigo-400 transition-colors">
              Multi-DB DDL &amp; Code-Export
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generieren Sie DDL für PostgreSQL, SQLite, MySQL, MariaDB, Oracle und vollständigen Quellcode in C#, TypeScript oder Python.
            </p>
          </div>
          <div className="text-xs text-indigo-300 font-bold flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-900">
            <Shield size={12} /> 100% Quelloffen &amp; Frei
          </div>
        </div>
      </div>
    </div>
  );
};
