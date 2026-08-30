import React from 'react';
import { 
  CheckCircle2, 
  Database, 
  FormInput, 
  Filter, 
  Code2, 
  FileCode, 
  Layers, 
  Server, 
  Workflow, 
  Laptop, 
  GitBranch, 
  ShieldCheck,
  Percent,
  Printer
} from 'lucide-react';

export const RealCapabilitiesMatrix: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="text-indigo-400" size={20} /> Leistungs-Matrix: In-Browser Web-Suite (v0.8.5 Beta) vs. Local Bridge (v0.9.2 Beta)
        </h2>
        <p className="text-xs text-neutral-400">
          Ehrliche Übersicht aller Module und deren ideale architektonische Zuordnung (Be-Honest Methode):
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DB STUDIO PRO: Visual Low-Code Web Suite */}
        <div className="bg-[#242424] border border-indigo-900/50 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-950">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <Layers size={18} className="text-indigo-400" /> DB Studio Pro (Visuelle In-Browser Suite)
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              v0.8.5 (Beta-Betrieb)
            </span>
          </div>

          <div className="space-y-3 text-xs text-neutral-300">
            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Database size={15} className="text-indigo-400" /> 100% In-Browser Access Binary Parser
              </div>
              <p className="text-[11px] text-neutral-400">
                Extrahiert Tabellen, Daten, <code>MSysQueries</code>, Formulare und Berichte aus <code>.mdb</code>/<code>.accdb</code> ohne Server-Upload mit automatischer Primärschlüssel-Inferenz.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Percent size={15} className="text-red-400" /> DACH-Steuern, ÖNORM &amp; VOB/B Kalkulation
              </div>
              <p className="text-[11px] text-neutral-400">
                AT (20%/10%/13%/§19), DE (19%/7%/§13b), CH (8.1%/2.6%/3.8%), ÖNORM B 2110 3% Haftrücklass und VOB/B 5% Deckungsrücklass mit Cent-Genauigkeit.
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
                <Code2 size={15} className="text-cyan-400" /> .NET 10 EF Core Multi-DB Code-Generator
              </div>
              <p className="text-[11px] text-neutral-400">
                Generiert sauberen C# Code für SQL Server, SQLite, MySQL und PostgreSQL mit automatischer DDL-Erstellung und <code>SET IDENTITY_INSERT</code>.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Printer size={15} className="text-amber-400" /> ZUGFeRD 2.0 &amp; Swiss QR-Bill E-Invoicing
              </div>
              <p className="text-[11px] text-neutral-400">
                Erzeugt EN 16931-konforme XML-Rechnungsdateien, Schweizer Zahlteile und DIN 5008 Faltmarken-Layouts direkt im Browser.
              </p>
            </div>
          </div>
        </div>

        {/* DB STUDIO LOCAL BRIDGE: Native Host Daemon */}
        <div className="bg-[#242424] border border-amber-900/50 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-amber-950">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Server size={18} className="text-amber-400" /> DB Studio Local Bridge (v0.9.2 Beta Daemon)
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              v0.9.2 (Pre-1.0)
            </span>
          </div>

          <div className="space-y-3 text-xs text-neutral-300">
            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-emerald-900/40">
              <div className="font-bold text-emerald-300 flex items-center gap-2">
                <Database size={15} className="text-emerald-400" /> 1. Native 64-Bit OLEDB &amp; ACE Driver
              </div>
              <p className="text-[11px] text-neutral-300">
                Direkter Treiber-Zugriff auf Microsoft.ACE.OLEDB.16.0 für geschützte oder beschädigte Access-Dateien mit VBA-Transpiler (<code>NZ</code>, <code>IIF</code>, <code>Format</code>).
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
                Kompiliert Tauri 2.0 MSI/NSIS-Installer, Electron Setup.exe und .NET 10 Single-File Releases mit 1-Klick Start.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <GitBranch size={15} className="text-emerald-400" /> 4. Git Dual-Provider &amp; FTP Deployer
              </div>
              <p className="text-[11px] text-neutral-400">
                Automatischer GitHub / GitLab Push &amp; Repo-Create, CI/CD Pipeline Actions sowie FTP/FTPS Webserver-Upload.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-400" /> 5. PHP Relay, Ports &amp; Autostart
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
