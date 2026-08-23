import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  GitBranch, 
  UploadCloud, 
  Cpu, 
  Layers, 
  FileCode, 
  Wrench,
  Workflow,
  Server,
  Flame,
  HardDrive,
  Database,
  Laptop,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const DevelopmentStatusRoadmap: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Reifegrad Status Box */}
      <div className="bg-[#252525] border border-[#3e3e3e] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#383838]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-xs">
                <Sparkles size={12} className="text-amber-400" /> Vor-1.0 Phase (v0.8.5 Beta)
              </span>
              <span className="text-xs text-neutral-400 font-medium">Reifegrad-Index:</span>
              <span className="text-xs font-black text-amber-300">~80% (Be-Honest Methode)</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Status &amp; Reifegrad des DB Studio Ökosystems
            </h3>
            <p className="text-xs text-neutral-300 max-w-3xl leading-relaxed">
              Architektur-Review und Praxis-Status: Die <strong>„Be Honest“-Methode</strong> zeigt den tatsächlichen Entwicklungsstand ohne Beschönigungen. Sehr viele Kernmodule laufen stabil, während im aktiven Praxistest kontinuierlich Feinjustierungen erfolgen: <strong>DB Studio Pro v0.8.5 (~85%)</strong> und <strong>Local Bridge v0.9.2 Beta (~75%)</strong>.
            </p>
          </div>

          <div className="bg-[#1c1c1c] border border-amber-500/40 rounded-xl p-4 min-w-[240px] shrink-0 text-center">
            <div className="text-xs text-neutral-400 font-semibold mb-1">Entwicklungsfortschritt</div>
            <div className="text-2xl font-black text-amber-300">~80%</div>
            {/* Progress bar */}
            <div className="w-full bg-neutral-700 h-2.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 via-amber-500 to-amber-400 h-full rounded-full w-[80%]" />
            </div>
            <div className="text-[10px] text-neutral-400 mt-1.5 flex justify-between">
              <span>Studio v0.8.5 (~85%)</span>
              <span>Bridge v0.9.2 (~75%)</span>
            </div>
          </div>
        </div>

        {/* 2-Column Comparison: DB Studio Pro vs Local Bridge */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
          {/* DB Studio Pro Web Suite */}
          <div className="bg-[#1e1e1e] border border-indigo-900/40 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider pb-2 border-b border-indigo-950">
              <Layers size={16} className="text-indigo-400" /> 1. DB Studio Pro Web-Suite (v0.8.5 Beta • ~85%)
            </div>
            <ul className="space-y-2.5 text-xs text-neutral-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Relationale Tabellen &amp; ER-Canvas:</strong> AutoWert, Primär- &amp; Fremdschlüssel (1:1, 1:n, n:m), Validierungen und Indizes.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Formular-Studio mit N-Ebenen Subforms:</strong> Drag-&amp;-Drop Masken, Formel-Engine, dynamische Sichtbarkeitsregeln und RBAC.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Visueller Query-Builder:</strong> Grafisches Zusammenklicken von SQL-Queries, JOIN-Matrix, Filter und Daten-Grid.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Multi-Target Code-Export:</strong> Vollständige Projekte für C# (.NET 10), Node.js / Express, Angular, PHP und React mit ORM &amp; Migrationen.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Natives .dbsp Format:</strong> 1-Klick Import und Export kompletter Studio-Projekte inklusive Layout.</span>
              </li>
            </ul>
          </div>

          {/* Local Bridge v0.9.2 */}
          <div className="bg-[#1e1e1e] border border-amber-900/40 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider pb-2 border-b border-amber-950">
              <Server size={16} className="text-amber-400" /> 2. DB Studio Local Bridge (v0.9.2 Beta • ~75%)
            </div>
            <ul className="space-y-2.5 text-xs text-neutral-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Access Migration Engine:</strong> 64-Bit OLEDB Inspektion von <code>.accdb</code>/<code>.mdb</code> mit Typ- &amp; VBA-Transpiler (<code>NZ</code>, <code>IIF</code>, <code>Format</code>).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Natives .dbsp Projekt-Generierung:</strong> Erzeugt einsatzbereite <code>.dbsp</code> Dateien mit Daten &amp; ER-Layout für DB Studio Pro.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Topologischer Data-Sync:</strong> Dependency-Graph Sortierung für Fremdschlüssel, SQL-Dumps und SQLite <code>.db</code> Erzeugung.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Native Desktop-Installer:</strong> Kompiliert Tauri 2.0 (MSI/NSIS), Electron Setup.exe und .NET 10 Single-File Releases.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>DevOps, Git &amp; PHP Relay:</strong> Docker Compose, GitHub/GitLab Push, FTP-Upload und HTTPS-Relay.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
