import React from 'react';
import { Database, Layout, Cpu, FileCheck, Layers, ChevronRight, HardDrive, RefreshCw, Sparkles, FileSpreadsheet } from 'lucide-react';

interface PromoFeaturesBentoProps {
  onNavigate: (type: 'table_create' | 'query_designer' | 'create_report' | 'create_form' | 'table_data', id?: string) => void;
}

export const PromoFeaturesBento: React.FC<PromoFeaturesBentoProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-950 border border-indigo-500/30 rounded-full text-xs text-indigo-300 font-semibold">
          <Sparkles size={12} className="text-indigo-400" />
          <span>Vollwertiges Low-Code &amp; Database Engineering Arsenal</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          6 Gründe, warum Entwickler DB Studio als Geheimwaffe nutzen
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Von der visuellen Modellierung über den clientseitigen Access-Binärimport bis hin zur automatisierten DACH-Fakturierung und .NET 10 Codegenerierung.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Schema Builder */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-amber-500/50 transition-all group shadow-sm">
          <div className="space-y-3">
            <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl w-fit text-amber-400">
              <Database size={22} />
            </div>
            <h4 className="font-extrabold text-white text-base group-hover:text-amber-400 transition-colors">
              1. Visueller Schema- &amp; Tabellen-Builder
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Definieren Sie Primärschlüssel, Fremdschlüssel-Relationen (1:n, n:m), Constraints und berechnete Formeln mit automatischer Normalisierungsprüfung.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('table_create')} 
            className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-900 cursor-pointer"
          >
            Tabelle erstellen <ChevronRight size={14} />
          </button>
        </div>

        {/* Card 2: Access Binary Migration */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-emerald-500/50 transition-all group shadow-sm">
          <div className="space-y-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl w-fit text-emerald-400">
              <FileSpreadsheet size={22} />
            </div>
            <h4 className="font-extrabold text-white text-base group-hover:text-emerald-400 transition-colors">
              2. 100% In-Browser Access-Migration
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direktes binäres Parsing von <code className="text-emerald-300 font-mono">.mdb</code> und <code className="text-emerald-300 font-mono">.accdb</code> Dateien ohne Server-Upload. Liest Tabellen, MSysQueries und generiert moderne Webmasken.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('table_create')} 
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-900 cursor-pointer"
          >
            Access-Import testen <ChevronRight size={14} />
          </button>
        </div>

        {/* Card 3: Form Designer */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-indigo-500/50 transition-all group shadow-sm">
          <div className="space-y-3">
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl w-fit text-indigo-400">
              <Layout size={22} />
            </div>
            <h4 className="font-extrabold text-white text-base group-hover:text-indigo-400 transition-colors">
              3. Drag-&amp;-Drop Formular-Studio
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Erstellen Sie mehrspaltige Eingabemasken mit Rollenberechtigungen (RBAC), Subforms für Master-Detail-Daten und dynamischen Sichtbarkeitsregeln.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('create_form')} 
            className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-900 cursor-pointer"
          >
            Formular entwerfen <ChevronRight size={14} />
          </button>
        </div>

        {/* Card 4: Query & Filter Engine */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-sky-500/50 transition-all group shadow-sm">
          <div className="space-y-3">
            <div className="bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-xl w-fit text-sky-400">
              <Cpu size={22} />
            </div>
            <h4 className="font-extrabold text-white text-base group-hover:text-sky-400 transition-colors">
              4. Abfrage-Designer &amp; QBE-Grid
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Visueller QBE-Grid-Editor im Access-Stil, Joins, Aggregationen (SUM, AVG, COUNT), Parameterabfragen und direkter SQL-Editor mit Syntax-Highlighting.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('query_designer')} 
            className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-900 cursor-pointer"
          >
            SQL-Abfrage bauen <ChevronRight size={14} />
          </button>
        </div>

        {/* Card 5: DACH E-Invoicing */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-rose-500/50 transition-all group shadow-sm">
          <div className="space-y-3">
            <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl w-fit text-rose-400">
              <FileCheck size={22} />
            </div>
            <h4 className="font-extrabold text-white text-base group-hover:text-rose-400 transition-colors">
              5. DACH E-Invoicing &amp; Compliance
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              ZUGFeRD 2.3, XRechnung 3.0 und Schweizer QR-Rechnung direkt in Berichten integriert – 100% rechtskonform nach EN 16931 für B2B &amp; B2G.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('create_report')} 
            className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-900 cursor-pointer"
          >
            Rechnung / Bericht anlegen <ChevronRight size={14} />
          </button>
        </div>

        {/* Card 6: Multi-DB & Full Code Export */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-purple-500/50 transition-all group shadow-sm">
          <div className="space-y-3">
            <div className="bg-purple-500/10 border border-purple-500/20 p-2.5 rounded-xl w-fit text-purple-400">
              <Layers size={22} />
            </div>
            <h4 className="font-extrabold text-white text-base group-hover:text-purple-400 transition-colors">
              6. .NET 10, Node &amp; Multi-DB Export
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generieren Sie DDL für PostgreSQL, SQLite, MySQL, MSSQL und Oracle sowie vollständige Backends in C# EF Core, Express oder Python FastAPI.
            </p>
          </div>
          <div className="text-xs text-purple-300 font-bold flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-900">
            <RefreshCw size={12} className="animate-spin" /> Echter Quellcode ohne Lock-in
          </div>
        </div>
      </div>
    </div>
  );
};
