import React from 'react';
import { 
  CheckCircle2, 
  Flame, 
  Sparkles,
  Database,
  FormInput,
  Filter,
  Printer,
  Code2,
  GitBranch,
  UploadCloud,
  Layers,
  Laptop,
  Server,
  Workflow,
  ShieldCheck,
  HardDrive,
  FileCode,
  Zap
} from 'lucide-react';

export const RealCapabilitiesMatrix: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="text-indigo-400" size={20} /> Leistungs-Matrix: DB Studio Pro (v0.8.5 Beta) vs. DB Studio Local Bridge (v0.9.2 Beta)
        </h2>
        <p className="text-xs text-neutral-400">
          Ehrliche Übersicht aller Module und deren ideale architektonische Zuordnung (Be-Honest Methode):
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DB STUDIO PRO: Visual Low-Code Web Suite */}
        <div className="bg-[#242424] border border-indigo-900/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-950">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <Layers size={18} className="text-indigo-400" /> DB Studio Pro (Visuelle Web-Suite)
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              v0.8.5 (Beta-Betrieb)
            </span>
          </div>

          <div className="space-y-3.5 text-xs text-neutral-300">
            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Database size={15} className="text-indigo-400" /> Visueller ER-Canvas &amp; Schema-Designer
              </div>
              <p className="text-[11px] text-neutral-400">
                Spaltendefinition mit AutoWert/PK, 1:1, 1:n &amp; n:m Fremdschlüsseln, Indizes, Validierungen und interaktiver Tabellen-Node-Anordnung.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <FormInput size={15} className="text-indigo-400" /> Formular-Studio mit N-Ebenen Subforms
              </div>
              <p className="text-[11px] text-neutral-400">
                Drag-&amp;-Drop Layouts (1–4 Spalten), berechnete Formeln, dynamische Sichtbarkeits-Regeln, Lookup-Dropdowns und rollenbasierte Feldrechte (RBAC).
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Filter size={15} className="text-indigo-400" /> Visueller No-Code SQL- &amp; Abfrage-Designer
              </div>
              <p className="text-[11px] text-neutral-400">
                Grafisches Zusammenklicken von JOIN-Verknüpfungen, Kriterien-Filter, Sortierung, SQL-Text-Vorschau und interaktives Live-Datenraster.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Code2 size={15} className="text-indigo-400" /> Fullstack Multi-Target Code-Generatoren
              </div>
              <p className="text-[11px] text-neutral-400">
                Generiert sauberen Quellcode für ASP.NET Core (.NET 10), Express (Node.js), PHP 8 PDO, React und Angular inklusive n:m Junction-Tables und EF Core <code>.UsingEntity&lt;T&gt;()</code>.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <FileCode size={15} className="text-indigo-400" /> .dbsp Projekt- &amp; Workflow-Management
              </div>
              <p className="text-[11px] text-neutral-400">
                Öffnet, editiert und speichert native <code>.dbsp</code>-Projektdateien. Kompatibel mit den Bridge-Exporten alter Access-Datenbanken.
              </p>
            </div>
          </div>
        </div>

        {/* DB STUDIO LOCAL BRIDGE: Native Host Daemon */}
        <div className="bg-[#242424] border border-amber-900/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-950">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Server size={18} className="text-amber-400" /> DB Studio Local Bridge (v0.9.2 Beta Daemon)
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              v0.9.2 (Pre-1.0)
            </span>
          </div>

          <div className="space-y-3.5 text-xs text-neutral-300">
            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-emerald-900/40">
              <div className="font-bold text-emerald-300 flex items-center gap-2">
                <Database size={15} className="text-emerald-400" /> 1. Access Migration &amp; .dbsp Export
              </div>
              <p className="text-[11px] text-neutral-300">
                64-Bit OLEDB-Inspektion (`.accdb`/`.mdb`), Typ-Transpiler, VBA-Transpiler (<code>NZ</code>, <code>IIF</code>, <code>Format</code>) und 1-Klick Erstellung nativer <code>.dbsp</code>-Projekte.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-emerald-900/40">
              <div className="font-bold text-emerald-300 flex items-center gap-2">
                <Workflow size={15} className="text-emerald-400" /> 2. Topologischer Live Data-Sync
              </div>
              <p className="text-[11px] text-neutral-300">
                Ermittelt die exakte mathematische Einfügereihenfolge (Dependency Graph), generiert SQL-Dumps oder befüllt direkt lokale SQLite <code>.db</code>-Dateien.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Laptop size={15} className="text-emerald-400" /> 3. Nativer Desktop-Installer Builder
              </div>
              <p className="text-[11px] text-neutral-400">
                Kompiliert Tauri 2.0 MSI/NSIS-Installer, Electron Setup.exe und .NET 10 Single-File Releases mit 1-Klick Start &amp; Explorer-Aufruf.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <GitBranch size={15} className="text-emerald-400" /> 4. Git Dual-Provider &amp; FTP Deployer
              </div>
              <p className="text-[11px] text-neutral-400">
                Automatischer GitHub / GitLab Push &amp; Repo-Create, CI/CD Pipeline Actions sowie FTP/FTPS Webserver-Upload mit Smart-Build Erkennung.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-400" /> 5. PHP Relay (v0.9), Ports &amp; Autostart
              </div>
              <p className="text-[11px] text-neutral-400">
                HTTPS-Relay für Firewalls, `killProcessTree` Port-Freigabe (Port 5050/5000/3000) und Windows Task Scheduler Autostart.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
