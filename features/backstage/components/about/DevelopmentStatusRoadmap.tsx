import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  GitBranch, 
  UploadCloud, 
  Cpu, 
  Layers, 
  Lock, 
  FileCode, 
  Wrench,
  Workflow
} from 'lucide-react';

export const DevelopmentStatusRoadmap: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Reifegrad Status Box */}
      <div className="bg-[#252525] border border-[#3e3e3e] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#383838]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <Clock size={12} className="animate-spin" /> Entwicklungsphase (Solo-Projekt)
              </span>
              <span className="text-xs text-neutral-400 font-medium">Reifegrad-Index:</span>
              <span className="text-xs font-black text-amber-400">~55–60% Gesamt-Funktionsumfang</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Transparenter Status &amp; Reifegrad der Software
            </h3>
            <p className="text-xs text-neutral-300 max-w-3xl leading-relaxed">
              Übereinstimmende Einschätzung aus Praxis-Erfahrung des Entwicklers und Quellcode-Architektur-Review: Für <strong>Rapid Prototyping und visuelles Modellieren liegt der Reifegrad bei starken 75–80%</strong>. Der Grund für den <strong>Gesamtindex von ~60%</strong> liegt in den noch offenen DevOps- und Deployment-Bausteinen (GitHub-Push, FTP-Uploads, Live-SQL-Sockets).
            </p>
          </div>

          <div className="bg-[#1c1c1c] border border-[#383838] rounded-xl p-4 min-w-[240px] shrink-0 text-center">
            <div className="text-xs text-neutral-400 font-semibold mb-1">Entwicklungsfortschritt</div>
            <div className="text-2xl font-black text-amber-400">60%</div>
            {/* Progress bar */}
            <div className="w-full bg-neutral-700 h-2.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full w-[60%]" />
            </div>
            <div className="text-[10px] text-neutral-400 mt-1.5 flex justify-between">
              <span>Basis &amp; Generatoren</span>
              <span>Cloud &amp; DevOps</span>
            </div>
          </div>
        </div>

        {/* 2-Column Comparison: Already Working vs Upcoming */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
          {/* Working (60%) */}
          <div className="bg-[#1e1e1e] border border-emerald-900/40 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider pb-2 border-b border-emerald-950">
              <CheckCircle2 size={16} /> Bereits implementiert &amp; einsatzfähig (~60%)
            </div>
            <ul className="space-y-2.5 text-xs text-neutral-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Relationale Tabellen &amp; Schema:</strong> AutoWert, Primär- &amp; Fremdschlüssel (1:1, 1:n), Validierungen, Indizes und ER-Diagramme.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Formular-Designer mit RBAC:</strong> Drag-&amp;-Drop Masken, Subformulare, berechnete Felder und feldspezifische Rollenrechte (Admin, User, Gast).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Visueller SQL- &amp; Filter-Designer:</strong> Abfragen grafisch zusammenklicken, JOINs und SQL-Vorschau.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Berichte &amp; Rechnungsdruck:</strong> Drucklayouts mit Kopf-/Fußzeilen, Summierungen und A4-Vorschau.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>SDUI Page- &amp; Dashboard Builder:</strong> Interaktive Kanban-Boards, Kalender und KPI-Metrik-Karten.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Multi-Target Code-Export:</strong> Vollständige Projekte für C# (.NET 10), Node.js / Express, Angular und PHP.</span>
              </li>
            </ul>
          </div>

          {/* Planned / In Progress (40%) */}
          <div className="bg-[#1e1e1e] border border-amber-900/40 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider pb-2 border-b border-amber-950">
              <Clock size={16} /> In Entwicklung &amp; Geplante Roadmap (~40%)
            </div>
            <ul className="space-y-2.5 text-xs text-neutral-300">
              <li className="flex items-start gap-2">
                <GitBranch size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span><strong>GitHub / GitLab Sync &amp; CI/CD:</strong> Direkter Push in Remote-Repositories (derzeit manueller ZIP/File-Download).</span>
              </li>
              <li className="flex items-start gap-2">
                <UploadCloud size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Integrierter FTP / SSH Deployer:</strong> 1-Klick-Upload des generierten PHP- oder Node-Backends auf Webhosting-Server.</span>
              </li>
              <li className="flex items-start gap-2">
                <Cpu size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Native Desktop Bridge (Tauri / Electron):</strong> Direkter Zugriff auf lokale SQLite- und Access-Dateien ohne Web-Sandbox.</span>
              </li>
              <li className="flex items-start gap-2">
                <Workflow size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Live Multi-User Collaboration:</strong> Gleichzeitiges Bearbeiten von Tabellen &amp; Formularen im Team über WebSockets.</span>
              </li>
              <li className="flex items-start gap-2">
                <FileCode size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Erweiterte ORM-Adapter:</strong> Direkte Generierung für Prisma, TypeORM, Dapper und Hibernate.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
