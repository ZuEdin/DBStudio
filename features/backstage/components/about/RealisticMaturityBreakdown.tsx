import React from 'react';
import { 
  BarChart3, 
  Cpu, 
  Code2, 
  Terminal, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Layers,
  Wrench,
  Workflow,
  HelpCircle
} from 'lucide-react';

export const RealisticMaturityBreakdown: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header with clear mutual verdict */}
      <div className="bg-[#24242e] border border-indigo-500/30 rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-400" /> Übereinstimmende Selbsteinschätzung
            </span>
            <span className="text-xs text-neutral-400 font-medium">Entwickler &amp; KI-Architektur-Review</span>
          </div>
          <div className="text-xs font-black px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Gesamt-Reifegrad: ~75% (Core-System &amp; Code-Gen 100%)
          </div>
        </div>

        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 className="text-indigo-400" size={20} /> Ehrlicher Reifegrad-Index nach technischen Bereichen
        </h2>
        <p className="text-xs text-neutral-300 leading-relaxed">
          Aktueller Status: Sowohl der <strong>In-Browser Designer &amp; Formular-Engine (100%)</strong> als auch die <strong>Code-Generierung inklusive n:m ORM-Mapping &amp; automatischer SQL-Schema-Migrationen (100%)</strong> sind vollständig implementiert. Lediglich die <strong>externen DevOps-, Server- und Live-Deployment-Pipelines (20–25%)</strong> erfordern aktuell noch manuelle Downloads.
        </p>
      </div>

      {/* 3 Detailed Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Prototyping & In-Browser Tools */}
        <div className="bg-[#222222] border border-emerald-500/40 rounded-xl p-4.5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={15} /> 1. In-Browser Designer
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                100%
              </span>
            </div>

            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[100%]" />
            </div>

            <h3 className="text-sm font-bold text-white">Schema, Formulare &amp; Abfragen</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Für <strong>Rapid Prototyping und vollwertige Enterprise-Anwendungen</strong> ist die Designer-Engine komplett:
            </p>

            <ul className="text-[11px] text-neutral-400 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Relationale 1:n &amp; N-Ebenen Subforms (Master-Detail)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Drag-&amp;-Drop Formular-Designer (1–4 Spalten, Tabs &amp; Container)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Erweiterte Formel-Engine (Date Math, String, Subform-Aggregate)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Vollständige Validierungsregeln (Required, Min/Max, RegEx, JS)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Dynamische Feld-Sichtbarkeit &amp; Rollenrechte (RBAC)</span>
              </li>
            </ul>
          </div>

          <div className="text-[11px] text-emerald-300 bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/40">
            Status: <strong>100% Vollständig &amp; produktionsreif</strong>
          </div>
        </div>

        {/* 2. Code Generation Engine */}
        <div className="bg-[#222222] border border-emerald-500/40 rounded-xl p-4.5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Code2 size={15} /> 2. Code-Generierung
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                100%
              </span>
            </div>

            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[100%]" />
            </div>

            <h3 className="text-sm font-bold text-white">ZIP-Export für .NET, Node, PHP &amp; React</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Vollständiger Quellcode-Export inklusive aller ORMs, N:M Relationen und SQL-Migrationen:
            </p>

            <ul className="text-[11px] text-neutral-400 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Generiert saubere ASP.NET Core (.NET 10) APIs &amp; EF Core</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Generiert Express (Node.js) &amp; PHP PDO Backends</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>N:M Junction-Tables, UsingEntity &amp; Batch-Sync Endpoints</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Automatische SQL-Migrations (Flyway, Liquibase, Drizzle, EF)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>SQLite 3-Schritt-Rebuild &amp; Pre-Flight Risikobewertung</span>
              </li>
            </ul>
          </div>

          <div className="text-[11px] text-emerald-300 bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/40">
            Status: <strong>100% Vollständig &amp; produktionsreif</strong>
          </div>
        </div>

        {/* 3. DevOps, Server & Cloud Deploy */}
        <div className="bg-[#222222] border border-[#383838] rounded-xl p-4.5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-rose-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Cloud size={15} /> 3. DevOps &amp; Deploy
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                ~20 – 25%
              </span>
            </div>

            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full w-[22%]" />
            </div>

            <h3 className="text-sm font-bold text-white">Automatisierung &amp; Live-Hosting</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Hier liegt aktuell die größte Entwicklungs-Baustelle im Gesamtsystem:
            </p>

            <ul className="text-[11px] text-neutral-400 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <AlertCircle size={13} className="text-rose-400 shrink-0 mt-0.5" />
                <span>Kein direkter GitHub / GitLab Push per API</span>
              </li>
              <li className="flex items-start gap-1.5">
                <AlertCircle size={13} className="text-rose-400 shrink-0 mt-0.5" />
                <span>Kein FTP / SSH Upload auf Webhosting-Server</span>
              </li>
              <li className="flex items-start gap-1.5">
                <AlertCircle size={13} className="text-rose-400 shrink-0 mt-0.5" />
                <span>Kein Live-Multi-User WebSocket Server</span>
              </li>
              <li className="flex items-start gap-1.5">
                <AlertCircle size={13} className="text-rose-400 shrink-0 mt-0.5" />
                <span>Browser-Sandbox blockt rohe TCP SQL-Sockets</span>
              </li>
            </ul>
          </div>

          <div className="text-[11px] text-rose-300 bg-rose-950/30 p-2 rounded-lg border border-rose-900/40">
            Status: <strong>Aktuell manueller Download &amp; Deploy</strong>
          </div>
        </div>
      </div>

      {/* 100% Action Items Section */}
      <div className="bg-[#1a1a24] border border-indigo-500/30 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2d2d3d]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Wrench className="text-amber-400" size={16} /> Konkreter Maßnahmenkatalog: Was fehlt noch zu 100%?
          </h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
            Aus TODO.md (Kapitel 8)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* In-Browser Designer Gaps */}
          <div className="bg-[#1b2520] p-3.5 rounded-lg border border-emerald-500/40 space-y-2">
            <div className="text-xs font-bold text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Layers size={14} /> In-Browser Designer &amp; UI Forms</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/40">100% ABGESCHLOSSEN</span>
            </div>
            <ul className="text-[11px] text-neutral-300 space-y-1.5 leading-tight">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>N-Ebenen Sub-Subforms:</strong> Beliebig tiefe Master-Detail-Hierarchien (Kunde ➔ Auftrag ➔ Pos ➔ SerNr).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Erweiterte Formel-Engine:</strong> Datumsmathematik, String-Funktionen &amp; Aggregate über Subformulare.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Flexibler Canvas &amp; Drag-Drop:</strong> Spaltenlayouts, Reordering, Tabs &amp; Container-Hierarchien.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Dynamic Field State &amp; Rules:</strong> 9 Vergleichs-Operatoren für bedingte Sichtbarkeit &amp; 5 Validierungstypen.</span>
              </li>
            </ul>
          </div>

          {/* Code Gen N:M Gaps */}
          <div className="bg-[#1b2520] p-3.5 rounded-lg border border-emerald-500/40 space-y-2">
            <div className="text-xs font-bold text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Code2 size={14} /> N:M Code-Gen &amp; ORM Mapping</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/40">100% ABGESCHLOSSEN</span>
            </div>
            <ul className="text-[11px] text-neutral-300 space-y-1.5 leading-tight">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Auto Junction-Tables:</strong> Intelligente Erkennung &amp; Scaffolding von Pivot-Tabellen mit Composite PKs.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Full ORM Mapping:</strong> EF Core <code>.UsingEntity&lt;T&gt;()</code>, Prisma Many-to-Many &amp; TypeORM JoinTables.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>n:m UI-Komponenten:</strong> Tag-Input-Picker &amp; Multi-Select Badges in React &amp; Angular Form-Generatoren.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Cascade Sync:</strong> Automatisches Bereinigen verwaister Pivot-Datensätze über Batch-Sync Endpoints.</span>
              </li>
            </ul>
          </div>

          {/* SQL Migrations Gaps */}
          <div className="bg-[#1b2520] p-3.5 rounded-lg border border-emerald-500/40 space-y-2">
            <div className="text-xs font-bold text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Workflow size={14} /> SQL Migrations &amp; Diff</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/40">100% ABGESCHLOSSEN</span>
            </div>
            <ul className="text-[11px] text-neutral-300 space-y-1.5 leading-tight">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>DDL Diffing Engine:</strong> Präzise `ALTER TABLE` DDLs (Add, Drop, Type Cast, Nullability).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>SQLite 3-Schritt-Rebuild:</strong> Automatischer atomarer Rebuild für nicht-native ALTER Operationen.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Multi-Format Exports:</strong> Flyway (V/U), Liquibase (XML/YAML/SQL), EF Core C#, Prisma, Drizzle &amp; Knex.js.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Pre-Flight Risk Check:</strong> Automatischer Score &amp; Warnung bei partiellem oder vollem Datenverlust.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Context Summary */}
      <div className="bg-[#1e1e1e] border border-[#333333] rounded-xl p-4.5 space-y-2">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <HelpCircle size={15} className="text-indigo-400" /> Warum diese Transparenz wichtig ist:
        </h4>
        <p className="text-xs text-neutral-300 leading-relaxed">
          Statt falsche Marketing-Erwartungen zu schüren, positioniert sich DB Studio Pro exakt da, wo seine größte Stärke liegt: <strong>Als blitzschnelles Rapid-Prototyping-Werkzeug ohne Einrichtungsfrust</strong>. Sie sparen sich tagelanges Setup für Datenbank- und UI-Grundgerüste, können Kunden in Minutenschnelle funktionierende Oberflächen präsentieren und erhalten am Ende sauberen Standardcode zur Weiterentwicklung.
        </p>
      </div>
    </div>
  );
};
