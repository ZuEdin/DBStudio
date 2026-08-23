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
  HelpCircle,
  Server,
  GitBranch,
  UploadCloud,
  Flame,
  HardDrive,
  Laptop,
  Database,
  FileCode,
  Zap,
  User,
  Heart,
  Bug,
  History
} from 'lucide-react';

export const RealisticMaturityBreakdown: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header with clear mutual verdict */}
      <div className="bg-[#24242e] border border-amber-500/30 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-xs">
              <Sparkles size={12} className="text-amber-400" /> Vor-1.0 Entwicklungsstand (v0.8.5 Beta)
            </span>
            <span className="text-xs text-neutral-400 font-medium">Be-Honest Architektur- &amp; Entwicklungsreview</span>
          </div>
          <div className="text-xs font-black px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Gesamt-Reifegrad: ~80% (Aktiver Beta-Test &amp; Bridge v0.9.2)
          </div>
        </div>

        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2.5">
          <BarChart3 className="text-amber-400" size={22} /> Ehrlicher Reifegrad-Index nach technischen Bereichen
        </h2>
        <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
          Aktueller Status: Wir setzen auf die <strong>„Be Honest“-Methode</strong>. Software ist in ständiger Evolution – niemand glaubt bei echten Systemen an pauschale 100%. Die Kernmodule laufen hervorragend, während im täglichen Testbetrieb kontinuierlich Edge-Cases, Mängel und Treiber-Details nachjustiert werden: <strong>In-Browser Designer (~85%)</strong>, <strong>Code-Generatoren (~80%)</strong> und <strong>Local Bridge v0.9.2 (~75%)</strong>.
        </p>
      </div>

      {/* 3 Detailed Pillar Cards with generous padding */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Prototyping & In-Browser Tools */}
        <div className="bg-[#222222] border border-indigo-500/40 rounded-2xl p-6 space-y-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#333333]">
              <div className="text-indigo-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} /> 1. In-Browser Designer &amp; UI
              </div>
              <span className="text-xs font-black px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                ~85%
              </span>
            </div>

            <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full w-[85%]" />
            </div>

            <h3 className="text-sm font-bold text-white">Schema, Formulare, Abfragen &amp; Mock</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Kern-Engine stabil im Einsatz – Detail-UI-Feinschliff &amp; Validierungsoptimierungen laufen:
            </p>

            <ul className="text-xs text-neutral-300 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Relationale 1:n &amp; N-Ebenen Subforms (Master-Detail)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Drag-&amp;-Drop Formular-Designer (1–4 Spalten &amp; Container)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Visueller No-Code Query-Builder &amp; Live-SQL-Grid</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Formel-Engine, Validierungen &amp; Rollenrechte (RBAC)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Natives <code>.dbsp</code> Projekt-Laden, Bearbeiten &amp; Speichern</span>
              </li>
            </ul>
          </div>

          <div className="text-xs text-indigo-300 bg-indigo-950/40 p-3 rounded-xl border border-indigo-900/50 flex items-center justify-between">
            <span>Status:</span>
            <strong>Funktionale Kern-Engine (Feinschliff)</strong>
          </div>
        </div>

        {/* 2. Code Generation Engine */}
        <div className="bg-[#222222] border border-cyan-500/40 rounded-2xl p-6 space-y-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#333333]">
              <div className="text-cyan-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Code2 size={16} /> 2. Code-Generierung
              </div>
              <span className="text-xs font-black px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                ~80%
              </span>
            </div>

            <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full w-[80%]" />
            </div>

            <h3 className="text-sm font-bold text-white">Fullstack .NET, Node, PHP &amp; React</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Standard-Templates voll einsatzfähig – komplexe N:M Kaskaden werden laufend nachjustiert:
            </p>

            <ul className="text-xs text-neutral-300 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>ASP.NET Core (.NET 10) APIs &amp; EF Core <code>.UsingEntity&lt;T&gt;()</code></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Express (Node.js), TypeORM, Prisma &amp; PHP PDO Backends</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>React &amp; Angular Frontend-Generatoren mit Daten-Bindung</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Automatische SQL-Migrations (Flyway, Liquibase, Drizzle)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>SQLite 3-Schritt-Rebuild &amp; Pre-Flight Risikobewertung</span>
              </li>
            </ul>
          </div>

          <div className="text-xs text-cyan-300 bg-cyan-950/40 p-3 rounded-xl border border-cyan-900/50 flex items-center justify-between">
            <span>Status:</span>
            <strong>Standard-Exporte aktiv (Erweiterung)</strong>
          </div>
        </div>

        {/* 3. Local Bridge v0.9.2 & DevOps */}
        <div className="bg-[#222222] border border-amber-500/40 rounded-2xl p-6 space-y-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#333333]">
              <div className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Server size={16} /> 3. Local Bridge (v0.9.2 Beta)
              </div>
              <span className="text-xs font-black px-2.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                ~75%
              </span>
            </div>

            <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full w-[75%]" />
            </div>

            <h3 className="text-sm font-bold text-white">Host-Daemon &amp; 10 Kernfähigkeiten</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Kern-APIs, OLEDB-Treiber &amp; Sync laufen – Plattform-Härtung &amp; Randfälle in Bearbeitung:
            </p>

            <ul className="text-xs text-neutral-300 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Access-Migration &amp; .dbsp:</strong> OLEDB-Transpiler &amp; .dbsp Export</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Topologischer Data-Sync:</strong> Fremdschlüsselsichere Batch-Migration</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Native Installer:</strong> Tauri MSI/NSIS, Electron &amp; .NET Exe</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>DevOps:</strong> Docker Compose, Git Dual-Provider &amp; FTP/SFTP</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Netzwerk:</strong> Port 5050 REST/WS, PHP Relay &amp; Autostart</span>
              </li>
            </ul>
          </div>

          <div className="text-xs text-amber-300 bg-amber-950/40 p-3 rounded-xl border border-amber-900/50 flex items-center justify-between">
            <span>Status:</span>
            <strong>Beta-Betriebsbereit (Aktive Härtung)</strong>
          </div>
        </div>
      </div>

      {/* Honest Developer Story & Continuous Testing Note */}
      <div className="bg-gradient-to-br from-[#242436] via-[#1f1f2e] to-[#181824] border border-indigo-500/40 rounded-2xl p-6 md:p-7 space-y-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-indigo-900/40">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <User size={18} />
            </span>
            <div>
              <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                Die Entwickler-Geschichte: Handgemacht von einem Solo-Entwickler
              </h3>
              <span className="text-[11px] text-indigo-300 font-medium">
                Edin Zubovic • Über 14 Monate kontinuierliche Entwicklungsarbeit
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <Clock size={13} className="text-amber-400" /> &gt; 14 Monate Vollblut-Entwicklung
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-neutral-300 leading-relaxed">
          <div className="space-y-2.5 bg-[#171722]/80 border border-[#2e2e42] p-4.5 rounded-xl">
            <div className="text-white font-bold flex items-center gap-2 text-xs">
              <Heart size={15} className="text-rose-400" /> Was steckt in diesem Projekt?
            </div>
            <p>
              DB Studio Pro ist nicht das Produkt eines anonymen Großkonzerns oder einer Marketing-Agentur, sondern wurde von <strong>einem einzigen Entwickler (Edin Zubovic)</strong> über mehr als <strong>14 Monate intensive Entwicklungszeit</strong> mit Herzblut und Hingabe geschaffen.
            </p>
            <p>
              In dieser Zeit entstand das vollständige System aus In-Memory Schema-Designer, N-Ebenen Subforms, flexibler RBAC-Sicherheitsmatrix, AST-Codegeneratoren für .NET 10, Node.js, PHP, React und Angular sowie der komplette native <strong>Windows-Daemon (Local Bridge v0.9.2 Beta)</strong> mit OLEDB 64-Bit Treibern, SQLite-Synchronisation und Docker-DevOps.
            </p>
          </div>

          <div className="space-y-2.5 bg-[#171722]/80 border border-[#2e2e42] p-4.5 rounded-xl">
            <div className="text-amber-300 font-bold flex items-center gap-2 text-xs">
              <Bug size={15} className="text-amber-400" /> Ehrliche Transparenz &amp; Kontinuierliche Fehlerbehebung
            </div>
            <p>
              <strong>Sehr vieles funktioniert bereits hervorragend und absolut zuverlässig:</strong> Alle Kernfunktionen, Tabellenbeziehungen, Formelberechnungen, Code-Exporte und Bridge-Kommunikationen sind funktional implementiert und im täglichen Praxiseinsatz.
            </p>
            <p>
              <strong>Gleichzeitig gilt das ehrliche Entwickler-Credo:</strong> Bei einem so umfangreichen Software-Gesamtsystem werden beim intensiven Testen im Alltag immer wieder neue Randfälle, Detail-Mängel und Bugs aufgedeckt. Diese werden kontinuierlich analysiert, dokumentiert und Schritt für Schritt behoben, um die Software mit jedem Tag noch robuster und praxistauglicher zu machen.
            </p>
          </div>
        </div>
      </div>

      {/* Context Summary */}
      <div className="bg-[#1e1e1e] border border-[#333333] rounded-2xl p-6 space-y-2.5">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <HelpCircle size={16} className="text-indigo-400" /> Was macht das Zusammenspiel aus DB Studio Pro &amp; Local Bridge so stark?
        </h4>
        <p className="text-xs text-neutral-300 leading-relaxed">
          Das System kombiniert die <strong>visuelle Eleganz moderner Web-Technologien</strong> in <strong>DB Studio Pro (v0.8.5)</strong> (ER-Diagramm, N-Ebenen Subforms, visueller Query-Designer) mit der <strong>Ausführungskraft des lokalen Windows-Daemons</strong> (Local Bridge v0.9.2 Beta). Dank des nativen <code>.dbsp</code> Formats wandeln Sie alte Microsoft Access Datenbanken in moderne Fullstack-Anwendungen um – ohne Vendor Lock-in und mit 100% Quellcode-Eigentum.
        </p>
      </div>
    </div>
  );
};

