import React from 'react';
import { 
  Building2, 
  FileSpreadsheet, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  Database, 
  ShieldCheck, 
  Smartphone, 
  FileText, 
  Zap, 
  Briefcase, 
  Workflow
} from 'lucide-react';

export const IndustryUseCasesSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#383838] pb-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Briefcase className="text-emerald-400" size={20} />
            Praxis-Einsatzszenarien &amp; Branchen-Lösungen
          </h2>
          <p className="text-xs text-neutral-400">
            Detaillierte Workflows: Wie DB Studio Pro in realen Unternehmens- und Bauprojekten Zeit und Kosten spart
          </p>
        </div>
        <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
          3 Haupt-Szenarien
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Case 1: Bau & Handwerk */}
        <div className="bg-[#242432] border border-emerald-500/30 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg hover:border-emerald-500/60 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Building2 size={22} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
                VOB &amp; Baubranche
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">1. GAEB, DATANORM &amp; Baustelle</h3>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                Vollständiger digitaler Workflow von der Ausschreibung bis zur behördlichen E-Rechnung.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#383848] text-xs text-neutral-300">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">1.</span>
                <span><strong>GAEB X83 / D83 Import:</strong> Ausschreibungs-Leistungsverzeichnisse per Drag-&amp;-Drop einlesen.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">2.</span>
                <span><strong>DATANORM 5.0 Abgleich:</strong> Großhandelspreise und Artikelstamm automatisch kalkulieren.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">3.</span>
                <span><strong>GAEB X84 Export:</strong> Fertig bepreiste Angebotsdatei für den Auftraggeber generieren.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">4.</span>
                <span><strong>Offline Baustellen-Sync:</strong> Aufmaße und Fotos ohne Netz erfassen, später per 3-Wege-Merge synchronisieren.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">5.</span>
                <span><strong>ZUGFeRD 2.2 / XRechnung:</strong> E-Rechnung mit Leitweg-ID nach Bundes-Standard exportieren.</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1c1c28] p-2.5 rounded-lg border border-[#333345] text-[11px] text-emerald-300 flex items-center justify-between font-mono">
            <span>ROI: ~90% Zeitersparnis</span>
            <span className="text-neutral-400">Kein GAEB-Abo</span>
          </div>
        </div>

        {/* Case 2: MS Access Ablösung */}
        <div className="bg-[#242432] border border-amber-500/30 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg hover:border-amber-500/60 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Database size={22} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded">
                Legacy Migration
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">2. MS Access Modernisierung</h3>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                Alte .mdb und .accdb Desktop-Lösungen sicher in moderne Web- &amp; Cloud-Apps überführen.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#383848] text-xs text-neutral-300">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">1.</span>
                <span><strong>OLEDB 64-Bit Scan:</strong> Tabellen, Relationen, Primärschlüssel und echte Datensätze direkt auslesen.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">2.</span>
                <span><strong>VBA-Transpiler:</strong> Berechnungsformeln und Ausdrücke wie NZ(), IIF() automatisch in SQL / JS konvertieren.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">3.</span>
                <span><strong>Relationaler Graph:</strong> Topologische Sortierung verhindert Fremdschlüssel-Fehler bei der Migration.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">4.</span>
                <span><strong>Multi-Stack Export:</strong> Wahlweise als .NET 10 Web-App, Node.js oder PHP 8 mit React-Frontend ausgeben.</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1c1c28] p-2.5 rounded-lg border border-[#333345] text-[11px] text-amber-300 flex items-center justify-between font-mono">
            <span>Keine Access-Lizenz nötig</span>
            <span className="text-neutral-400">100% Web-Ready</span>
          </div>
        </div>

        {/* Case 3: Mittelstand ERP/CRM */}
        <div className="bg-[#242432] border border-indigo-500/30 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg hover:border-indigo-500/60 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Zap size={22} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded">
                Custom ERP &amp; CRM
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">3. Maßgeschneiderte Business-Apps</h3>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                In Minuten relationale Datenbanken für Auftragsverwaltung, Inventar &amp; Zeiterfassung bauen.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#383848] text-xs text-neutral-300">
              <div className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">1.</span>
                <span><strong>Formulare mit Subforms:</strong> 1:n Auftragspositionen direkt im Kundenformular inline pflegen.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">2.</span>
                <span><strong>No-Code Query Builder:</strong> Komplexe Auswertungen und JOINs grafisch zusammenstellen.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">3.</span>
                <span><strong>Druck-Engine:</strong> A4-Rechnungen und Lieferscheine mit Zwischensummen und CI-Logo drucken.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">4.</span>
                <span><strong>BPMN Workflows:</strong> Automatische E-Mail-Trigger bei Statuswechsel (z.B. "Freigegeben").</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1c1c28] p-2.5 rounded-lg border border-[#333345] text-[11px] text-indigo-300 flex items-center justify-between font-mono">
            <span>0 € monatliche Gebühren</span>
            <span className="text-neutral-400">Self-Hosted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
