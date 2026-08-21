import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  HelpCircle,
  Database,
  FormInput,
  Filter,
  Printer,
  Code2,
  GitBranch,
  UploadCloud,
  Layers,
  Laptop
} from 'lucide-react';

export const RealCapabilitiesMatrix: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="text-emerald-400" size={20} /> Tatsachen-Matrix: Was funktioniert &amp; was noch nicht?
        </h2>
        <p className="text-xs text-neutral-400">
          Eine ungeschminkte, ehrliche Gegenüberstellung aller Module und ihres aktuellen Implementierungsgrades:
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WORKING NOW */}
        <div className="bg-[#242424] border border-emerald-900/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-950">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 size={18} /> Was WIRKLICH funktioniert (Tatsachen)
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Einsatzbereit (~60%)
            </span>
          </div>

          <div className="space-y-3.5 text-xs text-neutral-300">
            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Database size={15} className="text-emerald-400" /> Relationales Schema &amp; Tabelleneditor
              </div>
              <p className="text-[11px] text-neutral-400">
                Spaltendefinition mit Typen (Text, Zahl, Datum, Boolean, AutoWert/ID), Fremdschlüssel-Beziehungen (1:1, 1:n), Validierungsregeln, Pflichtfelder und Defaultwerte. Inline-Datensatz-Bearbeitung im Grid.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <FormInput size={15} className="text-emerald-400" /> Drag-&amp;-Drop Formular-Designer &amp; Runner
              </div>
              <p className="text-[11px] text-neutral-400">
                Visuelle Anordnung von Steuerelementen, Mehrspalten-Raster (1–4 Spalten), berechnete Formelfelder, Nachschlage-Dropdowns und rollenbasierte Feldrechte (Admin, Bearbeiter, Gast).
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Filter size={15} className="text-emerald-400" /> Visueller Abfrage-Designer
              </div>
              <p className="text-[11px] text-neutral-400">
                Tabellen verknüpfen, Spalten auswählen, Kriterien/Filterregeln definieren, Sortierungen festlegen und Live-SQL-Text sowie Tabellenvorschau erzeugen.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Printer size={15} className="text-emerald-400" /> Berichts-Designer &amp; Druckansicht
              </div>
              <p className="text-[11px] text-neutral-400">
                Layouts für Rechnungen, Artikellisten und Stammdaten mit Kopf-/Fußzeilen, Summenbildungen und direktem Browser-A4-Druck.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Layers size={15} className="text-emerald-400" /> SDUI Pages &amp; Kanban-Runner
              </div>
              <p className="text-[11px] text-neutral-400">
                Dynamisches Rendern von Dashboards, KPI-Statistikkarten und vollwertigen Kanban-Boards mit Drag-and-Drop Spaltenstatus-Wechseln.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Code2 size={15} className="text-emerald-400" /> Quellcode-Generatoren (ZIP-Export)
              </div>
              <p className="text-[11px] text-neutral-400">
                Erzeugt sauberen, lesbaren Code für C# (.NET 10 Web API), Node.js (Express), PHP (PDO), Angular und React sowie SQL-DDL-Skripte (MySQL / SQLite).
              </p>
            </div>
          </div>
        </div>

        {/* NOT WORKING / LIMITATIONS */}
        <div className="bg-[#242424] border border-rose-900/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-950">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <XCircle size={18} /> Was aktuell (noch) NICHT geht / Grenzen
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
              Nicht implementiert (~40%)
            </span>
          </div>

          <div className="space-y-3.5 text-xs text-neutral-300">
            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <GitBranch size={15} className="text-rose-400" /> Kein direkter Git / GitHub Push
              </div>
              <p className="text-[11px] text-neutral-400">
                Es gibt keine automatische API-Kopplung zu GitHub oder GitLab. Der Code wird lokal als ZIP-Archiv oder Dateibaum heruntergeladen und muss manuell mit Git committed werden.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <UploadCloud size={15} className="text-rose-400" /> Kein integrierter FTP / SFTP Upload
              </div>
              <p className="text-[11px] text-neutral-400">
                Die Software kann erzeugte PHP- oder Node-Dateien nicht automatisch per FTP/SSH auf einen Webserver hochladen. Das Deployment erfolgt klassisch über eigene Hosting-Tools.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Database size={15} className="text-rose-400" /> Kein nativer TCP-Datenbanktreiber im Browser
              </div>
              <p className="text-[11px] text-neutral-400">
                Web-Browser können aus Sicherheitsgründen keine rohen TCP-Sockets zu PostgreSQL/MySQL öffnen. DB Studio arbeitet daher lokal mit JSON-Mockdaten und exportiert SQL-Skripte für echte Server.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Laptop size={15} className="text-rose-400" /> Tauri / Electron: Keine In-Browser Kompilierung
              </div>
              <p className="text-[11px] text-neutral-400">
                DB Studio erzeugt die fertigen Konfigurations- und Quellcodedateien für Tauri und Electron. Das Bauen der fertigen Windows `.exe` oder macOS `.app` muss lokal im Terminal mit Rust / Node erfolgen.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <AlertCircle size={15} className="text-rose-400" /> Keine Live-Multi-User Kollaboration
              </div>
              <p className="text-[11px] text-neutral-400">
                Aktuell arbeitet nur ein Entwickler lokal im Browser. Es gibt noch keinen WebSocket-Kollaborationsserver (wie bei Figma), der gleichzeitiges Editieren im Team synchronisiert.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
