import React from 'react';
import { 
  BarChart3, 
  Code2, 
  Sparkles,
  Layers,
  Wrench,
  Workflow,
  HelpCircle,
  Server,
  Database,
  CheckCircle2,
  Clock,
  User,
  Heart,
  Bug,
  Building2,
  Smartphone,
  GitBranch
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
            Gesamt-Reifegrad: ~82% (Aktiver Beta-Test &amp; Bridge v0.9.2)
          </div>
        </div>

        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2.5">
          <BarChart3 className="text-amber-400" size={22} /> Ehrlicher Reifegrad-Index nach technischen Bereichen
        </h2>
        <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
          Aktueller Status: Wir setzen auf die <strong>„Be Honest“-Methode</strong>. Software ist in ständiger Evolution. Die Kernmodule laufen hervorragend, während im täglichen Testbetrieb kontinuierlich Edge-Cases, Mängel und Treiber-Details nachjustiert werden.
        </p>
      </div>

      {/* 6 Detailed Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Prototyping & In-Browser Tools */}
        <div className="bg-[#222222] border border-indigo-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-indigo-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} /> 1. In-Browser Designer &amp; UI
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                ~88%
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full w-[88%]" />
            </div>
            <h3 className="text-xs font-bold text-white">Schema, Subforms, Queries &amp; Druck</h3>
            <ul className="text-xs text-neutral-300 space-y-1.5">
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Relationale 1:n &amp; N-Ebenen Subforms</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Drag-&amp;-Drop Formular-Designer (1–4 Spalten)</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Visueller No-Code Query-Builder (Access-Stil)</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>A4-Berichte mit Währungsformatierung</span></li>
            </ul>
          </div>
          <div className="text-[11px] text-indigo-300 bg-indigo-950/40 p-2 rounded-lg border border-indigo-900/50 flex items-center justify-between">
            <span>Status:</span><strong>Funktional (Feinschliff)</strong>
          </div>
        </div>

        {/* 2. Code Generation Engine */}
        <div className="bg-[#222222] border border-cyan-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-cyan-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Code2 size={16} /> 2. Code-Generierung
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                ~85%
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full w-[85%]" />
            </div>
            <h3 className="text-xs font-bold text-white">Fullstack .NET 10, Node, PHP &amp; React</h3>
            <ul className="text-xs text-neutral-300 space-y-1.5">
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>ASP.NET Core (.NET 10) Minimal APIs &amp; EF Core</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Express (Node.js) mit TypeScript &amp; Drizzle</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>PHP 8.3 PDO Prepared Statements REST API</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>React (Tailwind) &amp; Angular Signals SDUI</span></li>
            </ul>
          </div>
          <div className="text-[11px] text-cyan-300 bg-cyan-950/40 p-2 rounded-lg border border-cyan-900/50 flex items-center justify-between">
            <span>Status:</span><strong>Standard-Exporte aktiv</strong>
          </div>
        </div>

        {/* 3. Local Bridge v0.9.2 */}
        <div className="bg-[#222222] border border-amber-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Server size={16} /> 3. Local Bridge (v0.9.2)
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                ~80%
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full w-[80%]" />
            </div>
            <h3 className="text-xs font-bold text-white">Host-Daemon &amp; Access OLEDB</h3>
            <ul className="text-xs text-neutral-300 space-y-1.5">
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Access OLEDB 64-Bit Transpiler &amp; .dbsp</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Topologischer Dependency-Graph Sync</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Desktop Installer (Tauri 2.0 / Electron)</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Docker Compose, Git CI/CD &amp; FTP Deploy</span></li>
            </ul>
          </div>
          <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-900/50 flex items-center justify-between">
            <span>Status:</span><strong>Beta-Betriebsbereit</strong>
          </div>
        </div>

        {/* 4. Branchen-Schnittstellen */}
        <div className="bg-[#222222] border border-emerald-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Building2 size={16} /> 4. GAEB / DATANORM / ZUGFeRD
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                ~85%
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[85%]" />
            </div>
            <h3 className="text-xs font-bold text-white">Baubranche &amp; E-Rechnung</h3>
            <ul className="text-xs text-neutral-300 space-y-1.5">
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>GAEB DA XML 3.2/3.3 (X81–X86) &amp; GAEB 90 (D83)</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>DATANORM 4.0 / 5.0 Großhandelskataloge</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>ZUGFeRD 2.2 / XRechnung Factur-X XML</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Behörden Leitweg-ID Konformität</span></li>
            </ul>
          </div>
          <div className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/50 flex items-center justify-between">
            <span>Status:</span><strong>Produktiv integriert</strong>
          </div>
        </div>

        {/* 5. Mobile & Offline-First */}
        <div className="bg-[#222222] border border-blue-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-blue-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Smartphone size={16} /> 5. Offline-First &amp; Baustellen-Sync
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                ~85%
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full w-[85%]" />
            </div>
            <h3 className="text-xs font-bold text-white">IndexedDB Outbox &amp; 3-Wege-Merge</h3>
            <ul className="text-xs text-neutral-300 space-y-1.5">
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Lokal arbeiten ohne Internetverbindung</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Transaktionale Outbox mit Auto-Retry</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>3-Wege-Merge Dialog bei Datenkonflikten</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Canvas WebP Fotokompression für Baustellen</span></li>
            </ul>
          </div>
          <div className="text-[11px] text-blue-300 bg-blue-950/40 p-2 rounded-lg border border-blue-900/50 flex items-center justify-between">
            <span>Status:</span><strong>Funktional integriert</strong>
          </div>
        </div>

        {/* 6. Automation & Workflows */}
        <div className="bg-[#222222] border border-purple-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-purple-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Workflow size={16} /> 6. Workflow &amp; Flow-Engine
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                ~80%
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full w-[80%]" />
            </div>
            <h3 className="text-xs font-bold text-white">Visueller BPMN Graph &amp; Trigger</h3>
            <ul className="text-xs text-neutral-300 space-y-1.5">
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Visueller Flow-Graph mit Drag-&amp;-Drop Knoten</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Trigger: on_insert, on_update, on_delete</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>IF-Conditions, Loops, REST-API &amp; Mail</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Live Flow-Execution &amp; n8n/JSON Export</span></li>
            </ul>
          </div>
          <div className="text-[11px] text-purple-300 bg-purple-950/40 p-2 rounded-lg border border-purple-900/50 flex items-center justify-between">
            <span>Status:</span><strong>Beta (Erweiterung)</strong>
          </div>
        </div>
      </div>

      {/* Developer Story */}
      <div className="bg-gradient-to-br from-[#242436] via-[#1f1f2e] to-[#181824] border border-indigo-500/40 rounded-2xl p-6 space-y-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-indigo-900/40">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <User size={18} />
            </span>
            <div>
              <h3 className="text-sm md:text-base font-bold text-white">
                Die Entwickler-Geschichte: Handgemacht von einem Solo-Entwickler
              </h3>
              <span className="text-[11px] text-indigo-300 font-medium">
                Edin Zubovic • Über 14 Monate kontinuierliche Vollzeit-Entwicklungsarbeit
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <Clock size={13} className="text-amber-400" /> &gt; 14 Monate Vollzeit-Entwicklung
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-neutral-300 leading-relaxed">
          <div className="space-y-2.5 bg-[#171722]/80 border border-[#2e2e42] p-4 rounded-xl">
            <div className="text-white font-bold flex items-center gap-2 text-xs">
              <Heart size={15} className="text-rose-400" /> Was steckt in diesem Projekt?
            </div>
            <p>
              DB Studio Pro ist nicht das Produkt eines anonymen Großkonzerns, sondern wurde von <strong>einem einzigen Entwickler (Edin Zubovic)</strong> über mehr als <strong>14 Monate intensive Vollzeit-Arbeit</strong> mit Herzblut und handwerklicher Präzision geschaffen.
            </p>
            <p>
              In dieser Zeit entstand das vollständige System aus Schema-Designer, N-Ebenen Subforms, RBAC-Matrix, AST-Codegeneratoren für .NET 10, Node.js, PHP, React, der native Windows-Daemon (Local Bridge v0.9.2 Beta) sowie GAEB, DATANORM, ZUGFeRD und die Offline-Sync-Engine.
            </p>
          </div>

          <div className="space-y-2.5 bg-[#171722]/80 border border-[#2e2e42] p-4 rounded-xl">
            <div className="text-amber-300 font-bold flex items-center gap-2 text-xs">
              <Bug size={15} className="text-amber-400" /> Ehrliche Transparenz &amp; Kontinuierliche Fehlerbehebung
            </div>
            <p>
              <strong>Sehr vieles funktioniert bereits hervorragend und absolut zuverlässig:</strong> Alle Kernfunktionen, Tabellenbeziehungen, Formeln, Code-Exporte und Bridge-Kommunikationen sind funktional implementiert und im Praxiseinsatz.
            </p>
            <p>
              <strong>Gleichzeitig gilt das ehrliche Entwickler-Credo:</strong> Bei einem so umfangreichen Softwaresystem werden beim intensiven Testen immer wieder neue Randfälle und Detail-Mängel aufgedeckt. Diese werden kontinuierlich analysiert, dokumentiert und Schritt für Schritt behoben.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
