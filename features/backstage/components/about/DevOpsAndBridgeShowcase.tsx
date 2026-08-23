import React, { useState } from 'react';
import { 
  Server, 
  Terminal, 
  GitBranch, 
  UploadCloud, 
  Cpu, 
  Layers, 
  Box, 
  ShieldCheck, 
  CheckCircle2, 
  Laptop, 
  Workflow, 
  FolderTree, 
  HardDrive, 
  Zap, 
  RefreshCw, 
  Play, 
  Square, 
  RotateCw, 
  Download,
  Copy,
  Check,
  ExternalLink,
  Flame,
  Database,
  ArrowRight,
  Sparkles,
  FileCode,
  Lock,
  Container
} from 'lucide-react';

export const DevOpsAndBridgeShowcase: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-[#242432] border border-amber-500/40 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-xs">
              <Sparkles size={13} className="text-amber-400" /> Vor-1.0 Entwicklungsphase (Beta)
            </span>
            <span className="text-xs text-neutral-400 font-medium">Local Bridge &amp; DevOps Engine</span>
          </div>
          <div className="text-xs font-black px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Version 0.9.2 Beta (Pre-1.0)
          </div>
        </div>

        <h2 className="text-xl font-black text-white flex items-center gap-2.5">
          <Server className="text-indigo-400" size={22} /> DB Studio Local Bridge (v0.9.2 Beta) – Handbuch &amp; Kernfähigkeiten
        </h2>
        <p className="text-xs md:text-sm text-neutral-300 leading-relaxed max-w-4xl">
          Die <strong>DB Studio Local Bridge</strong> ist der leistungsfähige, lokale Hintergrunddienst (Host-Daemon) für Windows. Sie fungiert als intelligentes Bindeglied zwischen der visuellen Web-Suite <strong>DB Studio Pro (v0.8.5)</strong> und dem Betriebssystem für <strong>Hardware-Zugriff, OLEDB-Treiber, Desktop-Kompilierung, Migrationen und DevOps</strong>.
        </p>
      </div>

      {/* 2. Die perfekte Rollenverteilung: DB Studio Pro vs. Local Bridge */}
      <div className="bg-[#1f1f2a] border border-[#383848] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#323244]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="text-indigo-400" size={17} /> Die perfekte Rollenverteilung: DB Studio Pro vs. Local Bridge
          </h3>
          <span className="text-[11px] text-neutral-400 font-medium">Glasklare Aufgabenteilung ohne Redundanzen</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-[#333344] bg-[#1a1a24] rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-[#14141d] text-neutral-300 border-b border-[#333344]">
                <th className="p-3 font-bold">Bereich</th>
                <th className="p-3 font-bold text-indigo-300">🎨 DB Studio Pro (Hauptanwendung)</th>
                <th className="p-3 font-bold text-emerald-300">⚡ DB Studio Local Bridge (Daemon)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a3a] text-neutral-300">
              <tr>
                <td className="p-2.5 font-semibold text-white">Zweck</td>
                <td className="p-2.5 text-neutral-200">Designen, Modellieren, Konfigurieren &amp; No-Code UI</td>
                <td className="p-2.5 text-emerald-300 font-medium">Ausführen, Kompilieren, Migrieren &amp; Hardware-Zugriff</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-white">Tabellen &amp; Beziehungen</td>
                <td className="p-2.5 text-neutral-200">Visueller Entity-Relationship (ER) Canvas &amp; Form-Designer</td>
                <td className="p-2.5 text-emerald-300 font-medium">Extrahiert Roh-Tabellen aus Microsoft Access (.accdb/.mdb)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-white">SQL &amp; Abfragen</td>
                <td className="p-2.5 text-neutral-200">Visueller No-Code Query-Builder, Grid &amp; Filter-Matrix</td>
                <td className="p-2.5 text-emerald-300 font-medium">Transpiliert Access-VBA-Funktionen (NZ, IIF, Date) in ANSI-SQL</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-white">Datensätze &amp; Sync</td>
                <td className="p-2.5 text-neutral-200">Daten-Grid-Anzeige &amp; interaktive Tabellen-Bearbeitung</td>
                <td className="p-2.5 text-emerald-300 font-medium">Topologische Batch-Übertragung (Chunked Data Sync) &amp; .db Export</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-white">Projektdateien</td>
                <td className="p-2.5 text-neutral-200">Öffnet, editiert und exportiert native <code>.dbsp</code>-Projekte</td>
                <td className="p-2.5 text-emerald-300 font-medium">Erzeugt native <code>.dbsp</code>-Dateien aus alten Datenbanken</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-white">Kompilierung</td>
                <td className="p-2.5 text-neutral-200">Erzeugt vollständige Source-Code-Payloads (.NET, React, Node)</td>
                <td className="p-2.5 text-emerald-300 font-medium">Baut echte <code>.exe</code> / <code>.msi</code> Windows-Installer (Tauri, Electron)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-white">DevOps &amp; Hosting</td>
                <td className="p-2.5 text-neutral-200">Konfiguriert Datenbanken, Pipelines &amp; Deployments</td>
                <td className="p-2.5 text-emerald-300 font-medium">Steuert Docker Compose, Git Dual-Provider &amp; FTP-Uploads</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Die 10 Kernfähigkeiten der Local Bridge */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="text-amber-400" size={17} /> Die 10 Kernfähigkeiten der DB Studio Local Bridge (v0.9.2 Beta)
          </h3>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
            10 Module implementiert (Praxistest)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Access Migration Engine */}
          <div className="bg-[#1e1e24] border border-[#383848] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Database size={16} className="text-amber-400" /> 1. 🗃️ MS Access Migration Engine (.accdb &amp; .mdb)
              </span>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">Betriebsbereit (Feinschliff)</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Drag &amp; Drop von Access-Dateien (Access 97 bis 2024 / Office 365). 64-Bit OLEDB-Inspektion (`Microsoft.ACE.OLEDB.16.0`), Auto-Typentranspiler und Übersetzung von VBA-Funktionen (<code>NZ()</code> ➔ <code>COALESCE</code>, <code>IIF()</code> ➔ <code>CASE WHEN</code>, <code>Format()</code>, <code>Date()</code>, <code>&amp;</code>).
            </p>
          </div>

          {/* 2. Natives .dbsp Projekt-Export */}
          <div className="bg-[#1e1e24] border border-indigo-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <FileCode size={16} className="text-indigo-400" /> 2. 📦 Natives .dbsp Projekt-Export
              </span>
              <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded">Implementiert (Aktiv)</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Generiert mit 1-Klick eine vollwertige <code>.dbsp</code>-Projektdatei inklusive aller Tabellenstrukturen, echten Datensätzen, 1:n Beziehungen und fertig vorberechneten <code>x/y</code>-Koordinaten für das ER-Diagramm in DB Studio Pro.
            </p>
          </div>

          {/* 3. Live Data-Sync & Batch-Migration */}
          <div className="bg-[#1e1e24] border border-[#383848] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <RefreshCw size={16} className="text-cyan-400" /> 3. 🔄 Live Data-Sync &amp; Batch-Migration
              </span>
              <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">Funktional (Praxistest)</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              <strong>Topologische Sortierung (Dependency Graph):</strong> Ermittelt die exakte mathematische Reihenfolge (Eltern vor Kindern), damit Fremdschlüssel-Constraints nie scheitern. Erzeugt Multi-Row SQL-Dumps oder befüllt direkt lokale SQLite <code>.db</code>-Dateien.
            </p>
          </div>

          {/* 4. Desktop-Installer Builder */}
          <div className="bg-[#1e1e24] border border-[#383848] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-purple-300">
                <Laptop size={16} className="text-purple-400" /> 4. 🔨 Nativer Desktop-Installer Builder
              </span>
              <span className="text-[10px] font-bold text-purple-300 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded">Implementiert (Beta)</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Kompiliert <strong>Tauri 2.0 MSI &amp; NSIS Installer</strong>, <strong>Electron Setup.exe</strong> und <strong>.NET 10 Single-File Releases</strong> mit nativer Icon-Injektion und 1-Klick Start / Explorer-Markierung.
            </p>
          </div>

          {/* 5. Dependency Management & Symlinks */}
          <div className="bg-[#1e1e24] border border-[#383848] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <HardDrive size={16} className="text-emerald-400" /> 5. 📦 Shared Dependencies &amp; Symlink Cache
              </span>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">Betriebsbereit (Aktiv)</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Zentraler Paket-Speicher in <code>Shared_Dependencies</code>. NPM- und NuGet-Module werden per NTFS-Symlinks verknüpft – spart bis zu 80% Speicherplatz und beschleunigt Builds auf wenige Sekunden.
            </p>
          </div>

          {/* 6. Docker Compose */}
          <div className="bg-[#1e1e24] border border-[#383848] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-blue-300">
                <Workflow size={16} className="text-blue-400" /> 6. 🐳 Docker Compose Multi-Container Orchestrierung
              </span>
              <span className="text-[10px] font-bold text-blue-300 bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded">Implementiert (Presets)</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Vordefinierte Presets für MySQL 8.0, PostgreSQL 16, Redis 7 und Mailpit. Automatische Erstellung der <code>docker-compose.yml</code> sowie Steuerung von <code>docker compose up -d</code> und <code>down</code>.
            </p>
          </div>

          {/* 7. Git Dual-Provider */}
          <div className="bg-[#1e1e24] border border-[#383848] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-orange-300">
                <GitBranch size={16} className="text-orange-400" /> 7. 🐙 Git-Integration &amp; CI/CD Actions
              </span>
              <span className="text-[10px] font-bold text-orange-300 bg-orange-950/60 border border-orange-800/40 px-2 py-0.5 rounded">Funktional (GitHub/GitLab)</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              GitHub &amp; GitLab Dual-Provider (Cloud &amp; On-Premise). Live-Verbindungstest, automatisches <code>git init</code>, Remote-Repo-Erstellung, Push und Erzeugung von <code>.github/workflows</code> &amp; <code>.gitlab-ci.yml</code>.
            </p>
          </div>

          {/* 8. FTP Deployment Engine */}
          <div className="bg-[#1e1e24] border border-[#383848] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <UploadCloud size={16} className="text-emerald-400" /> 8. 🌐 FTP, FTPS &amp; SFTP Deployment Engine
              </span>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">Betriebsbereit (Streaming)</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Server-Verbindungstest mit Latenzmessung. Erkennt automatisch kompilierte Build-Artefakte (<code>dist/</code>, <code>publish/</code>) und lädt diese per Stream auf den Ziel-Webserver hoch.
            </p>
          </div>

          {/* 9. PHP Remote Relay */}
          <div className="bg-[#1e1e24] border border-[#383848] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <ShieldCheck size={16} className="text-indigo-400" /> 9. 🛡️ PHP Remote Relay Gateway (v0.9)
              </span>
              <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded">Funktional (Tunnel)</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Sicherer Tunnel hinter Firewalls &amp; NAT via HTTPS (<code>bridge_relay.php</code>). 1-Klick Download direkt in den Windows Downloads-Ordner und Explorer-Öffnung.
            </p>
          </div>

          {/* 10. Port-Kollisionsschutz & Autostart */}
          <div className="bg-[#1e1e24] border border-[#383848] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Zap size={16} className="text-amber-400" /> 10. ⚡ Port-Kollisionsschutz &amp; Windows Autostart
              </span>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">Implementiert (Port 5050+)</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Prüft beim Start Port 5050 und weicht bei Bedarf automatisch aus. Unterprozesse werden via <code>killProcessTree</code> restlos beendet. 1-Klick Windows Task Scheduler Einrichtung für automatischen Hintergrundstart.
            </p>
          </div>
        </div>
      </div>

      {/* 4-Step Access Migration Workflow */}
      <div className="bg-gradient-to-r from-amber-950/40 via-[#26221c] to-[#1c1c24] border border-amber-500/40 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/40">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <Database size={18} className="text-amber-400" /> Der native 4-Schritte-Workflow: Microsoft Access zu DB Studio Pro
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Nativer .dbsp Workflow
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-[#383838] space-y-1.5">
            <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
              <span>Schritt 1</span> <ArrowRight size={13} />
            </div>
            <h4 className="text-xs font-bold text-white">Access-Datei ablegen</h4>
            <p className="text-[11px] text-neutral-400">
              Ziehen Sie eine beliebige <code>.accdb</code> oder <code>.mdb</code> Datei per Drag &amp; Drop in die Bridge.
            </p>
          </div>

          <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-[#383838] space-y-1.5">
            <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
              <span>Schritt 2</span> <ArrowRight size={13} />
            </div>
            <h4 className="text-xs font-bold text-white">Live-Analyse &amp; Transpiler</h4>
            <p className="text-[11px] text-neutral-400">
              Die Bridge analysiert Tabellen, Datentypen, 1:n Relationen und transipiliert Access-VBA-Abfragen in ANSI-SQL.
            </p>
          </div>

          <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-[#383838] space-y-1.5">
            <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
              <span>Schritt 3</span> <ArrowRight size={13} />
            </div>
            <h4 className="text-xs font-bold text-white">.dbsp herunterladen</h4>
            <p className="text-[11px] text-neutral-400">
              Klicken Sie auf den Button <em>„📦 .dbsp Projektdatei herunterladen“</em> (mit allen Daten &amp; ER-Layout).
            </p>
          </div>

          <div className="bg-[#1a1a1a] p-3.5 rounded-xl border border-[#383838] space-y-1.5">
            <div className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
              <span>Schritt 4</span> <Check size={13} />
            </div>
            <h4 className="text-xs font-bold text-white">In DB Studio Pro öffnen</h4>
            <p className="text-[11px] text-neutral-400">
              Laden Sie die <code>.dbsp</code> in DB Studio Pro: ER-Diagramm, Formulare und Abfragen sind sofort einsatzbereit!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
