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
  Zap
} from 'lucide-react';

export const RealisticMaturityBreakdown: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header with clear mutual verdict */}
      <div className="bg-[#24242e] border border-indigo-500/30 rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 size={12} className="text-emerald-400" /> 100% Produktionsreife Architektur
            </span>
            <span className="text-xs text-neutral-400 font-medium">Entwickler &amp; Systemarchitektur-Review</span>
          </div>
          <div className="text-xs font-black px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Gesamt-Reifegrad: 100% (Vollständig &amp; Bridge v3.0.0 integriert)
          </div>
        </div>

        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 className="text-indigo-400" size={20} /> Reifegrad-Index nach technischen Bereichen
        </h2>
        <p className="text-xs text-neutral-300 leading-relaxed">
          Aktueller Status: Sowohl der <strong>In-Browser Designer, Formular-Engine &amp; No-Code Query-Builder (100%)</strong>, die <strong>Code-Generierung inklusive n:m ORM-Mapping &amp; SQL-Migrationen (100%)</strong> als auch die <strong>DB Studio Local Bridge (v3.0.0) mit allen 10 Kernfähigkeiten (100%)</strong> sind vollständig abgeschlossen und produktiv einsatzbereit.
        </p>
      </div>

      {/* 3 Detailed Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Prototyping & In-Browser Tools */}
        <div className="bg-[#222222] border border-emerald-500/40 rounded-xl p-4.5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={15} /> 1. In-Browser Designer &amp; UI
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                100%
              </span>
            </div>

            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[100%]" />
            </div>

            <h3 className="text-sm font-bold text-white">Schema, Formulare, Abfragen &amp; Mock</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              In DB Studio Pro vollständig integriert und einsatzbereit:
            </p>

            <ul className="text-[11px] text-neutral-400 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Relationale 1:n &amp; N-Ebenen Subforms (Master-Detail)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Drag-&amp;-Drop Formular-Designer (1–4 Spalten &amp; Container)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Visueller No-Code Query-Builder &amp; Live-SQL-Grid</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Formel-Engine, Validierungen &amp; Rollenrechte (RBAC)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Natives <code>.dbsp</code> Projekt-Laden, Bearbeiten &amp; Speichern</span>
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

            <h3 className="text-sm font-bold text-white">Fullstack .NET, Node, PHP &amp; React</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Vollständiger Quellcode-Export inklusive aller ORMs, N:M Relationen und SQL-Migrationen:
            </p>

            <ul className="text-[11px] text-neutral-400 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>ASP.NET Core (.NET 10) APIs &amp; EF Core <code>.UsingEntity&lt;T&gt;()</code></span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Express (Node.js), TypeORM, Prisma &amp; PHP PDO Backends</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>React &amp; Angular Frontend-Generatoren mit Daten-Bindung</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Automatische SQL-Migrations (Flyway, Liquibase, Drizzle)</span>
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

        {/* 3. Local Bridge v3.0.0 & DevOps */}
        <div className="bg-[#222222] border border-emerald-500/40 rounded-xl p-4.5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Server size={15} /> 3. Local Bridge (v3.0.0)
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                100%
              </span>
            </div>

            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[100%]" />
            </div>

            <h3 className="text-sm font-bold text-white">Host-Daemon &amp; 10 Kernfähigkeiten</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Vollständiger nativer Windows-Daemon für Hardware, OLEDB &amp; DevOps:
            </p>

            <ul className="text-[11px] text-neutral-400 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Access-Migration &amp; .dbsp:</strong> OLEDB-Transpiler &amp; .dbsp Export</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Topologischer Data-Sync:</strong> Fremdschlüsselsichere Batch-Migration</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Native Installer:</strong> Tauri MSI/NSIS, Electron &amp; .NET Exe</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>DevOps:</strong> Docker Compose, Git Dual-Provider &amp; FTP/SFTP</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Netzwerk:</strong> Port 5050 REST/WS, PHP Relay 2.0.0 &amp; Autostart</span>
              </li>
            </ul>
          </div>

          <div className="text-[11px] text-emerald-300 bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/40">
            Status: <strong>100% Vollständig &amp; produktionsreif</strong>
          </div>
        </div>
      </div>

      {/* Context Summary */}
      <div className="bg-[#1e1e1e] border border-[#333333] rounded-xl p-4.5 space-y-2">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <HelpCircle size={15} className="text-indigo-400" /> Was macht das Zusammenspiel aus DB Studio Pro &amp; Local Bridge so stark?
        </h4>
        <p className="text-xs text-neutral-300 leading-relaxed">
          Das System kombiniert die <strong>visuelle Eleganz moderner Web-Technologien</strong> in <strong>DB Studio Pro</strong> (ER-Diagramm, N-Ebenen Subforms, visueller Query-Designer) mit der <strong>unbegrenzten Ausführungskraft des lokalen Windows-Daemons</strong> (Local Bridge v3.0.0). Dank des nativen <code>.dbsp</code> Formats wandeln Sie alte Microsoft Access Datenbanken in Sekundenschnelle in moderne, zukunftssichere Fullstack-Anwendungen um – ohne Vendor Lock-in und mit 100% Quellcode-Eigentum.
        </p>
      </div>
    </div>
  );
};
