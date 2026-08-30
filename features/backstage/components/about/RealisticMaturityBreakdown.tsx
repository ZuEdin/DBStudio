import React from 'react';
import { 
  BarChart3, 
  Code2, 
  Sparkles,
  Layers,
  CheckCircle2,
  Server,
  Database,
  Percent,
  Printer,
  ShieldCheck
} from 'lucide-react';

export const RealisticMaturityBreakdown: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header with clear mutual verdict */}
      <div className="bg-[#24242e] border border-amber-500/30 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-xs">
              <Sparkles size={12} className="text-amber-400" /> Vor-1.0 Entwicklungsstand (v0.8.5 Beta)
            </span>
            <span className="text-xs text-neutral-400 font-medium">Be-Honest Architektur- &amp; Entwicklungsreview</span>
          </div>
          <div className="text-xs font-black px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Gesamt-Reifegrad: ~85% (Aktiver Beta-Test &amp; Bridge v0.9.2)
          </div>
        </div>

        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2.5">
          <BarChart3 className="text-amber-400" size={22} /> Ehrlicher Reifegrad-Index nach technischen Bereichen
        </h2>
        <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
          Aktueller Status nach der <strong>„Be Honest“-Methode</strong>: Wir legen alle Komponenten transparent offen. Die Kernmodule wie der In-Browser Access-Parser, die DACH-Steuerengine und der .NET 10 EF Core Multi-DB Generator arbeiten produktionsnah.
        </p>
      </div>

      {/* 6 Detailed Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. In-Browser Designer & UI */}
        <div className="bg-[#222222] border border-indigo-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-indigo-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} /> 1. In-Browser Designer &amp; UI
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                ~90%
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full w-[90%]" />
            </div>
            <h3 className="text-xs font-bold text-white">Schema, Subforms, Queries &amp; Layouts</h3>
            <ul className="text-xs text-neutral-300 space-y-1.5">
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Relationale 1:n &amp; N-Ebenen Subforms</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Drag-&amp;-Drop Formular-Designer (1–4 Spalten)</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Visueller No-Code Query-Builder (Access-Stil)</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Auto-PK Inferenz &amp; Normalisierungs-Matching</span></li>
            </ul>
          </div>
          <div className="text-[11px] text-indigo-300 bg-indigo-950/40 p-2 rounded-lg border border-indigo-900/50 flex items-center justify-between">
            <span>Status:</span><strong>Produktionsreif</strong>
          </div>
        </div>

        {/* 2. Access MDB/ACCDB Migration */}
        <div className="bg-[#222222] border border-emerald-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Database size={16} /> 2. Access Migration (In-Browser)
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                ~88%
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[88%]" />
            </div>
            <h3 className="text-xs font-bold text-white">MDBReader, MSysQueries, Forms &amp; Reports</h3>
            <ul className="text-xs text-neutral-300 space-y-1.5">
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>100% Client-Side Binary Extraction (Zero Cloud)</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Automatische Abfragen-, Formular- &amp; Bericht-Übernahme</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>OLE-Container Header Stripping für Bilder</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>VBA NZ/IIF/Format Expression Transpilation</span></li>
            </ul>
          </div>
          <div className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/50 flex items-center justify-between">
            <span>Status:</span><strong>Vollständig aktiv</strong>
          </div>
        </div>

        {/* 3. Code Generation Engine */}
        <div className="bg-[#222222] border border-cyan-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-cyan-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Code2 size={16} /> 3. Code-Generierung
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                ~86%
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full w-[86%]" />
            </div>
            <h3 className="text-xs font-bold text-white">.NET 10 EF Core Multi-DB, Node &amp; PHP</h3>
            <ul className="text-xs text-neutral-300 space-y-1.5">
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>MSSQL, SQLite, MySQL &amp; PostgreSQL Provider</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>DDL-Erstellung &amp; SET IDENTITY_INSERT</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Express (Node.js) mit TypeScript &amp; Drizzle ORM</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>PHP 8.3 PDO Prepared Statements REST API</span></li>
            </ul>
          </div>
          <div className="text-[11px] text-cyan-300 bg-cyan-950/40 p-2 rounded-lg border border-cyan-900/50 flex items-center justify-between">
            <span>Status:</span><strong>Multi-DB Exporte aktiv</strong>
          </div>
        </div>

        {/* 4. DACH-Steuern & Baunormen */}
        <div className="bg-[#222222] border border-red-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-red-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Percent size={16} /> 4. DACH-Kalkulation
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                ~92%
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full rounded-full w-[92%]" />
            </div>
            <h3 className="text-xs font-bold text-white">AT / DE / CH Sätze &amp; Einbehalte</h3>
            <ul className="text-xs text-neutral-300 space-y-1.5">
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>AT 20%/10%/13%/0% §19 &amp; DE 19%/7%/0% §13b</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Schweizer Mehrwertsteuersätze (8.1%, 2.6%, 3.8%)</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>ÖNORM B 2110 Haftrücklass (3%) &amp; VOB/B (5%)</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>1-Klick Steuersatz-Tabellengenerierung</span></li>
            </ul>
          </div>
          <div className="text-[11px] text-red-300 bg-red-950/40 p-2 rounded-lg border border-red-900/50 flex items-center justify-between">
            <span>Status:</span><strong>Hochpräzise Cent-Kalkulation</strong>
          </div>
        </div>

        {/* 5. E-Invoicing & Berichte */}
        <div className="bg-[#222222] border border-amber-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Printer size={16} /> 5. E-Invoicing &amp; Print
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                ~84%
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full w-[84%]" />
            </div>
            <h3 className="text-xs font-bold text-white">ZUGFeRD 2.0, Swiss QR &amp; DIN 5008</h3>
            <ul className="text-xs text-neutral-300 space-y-1.5">
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>ZUGFeRD 2.0 / Factur-X XML-Einbettung (CII)</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Swiss QR-Bill mit QR-IBAN und Referenz</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>DIN 5008 Faltmarken &amp; Adressfeld A/B</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>A4 Druckvorschau mit automatischer Paginierung</span></li>
            </ul>
          </div>
          <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-900/50 flex items-center justify-between">
            <span>Status:</span><strong>Normkonform</strong>
          </div>
        </div>

        {/* 6. Local Bridge & DevOps */}
        <div className="bg-[#222222] border border-purple-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-purple-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Server size={16} /> 6. Bridge &amp; Mock Server
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                ~78%
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full w-[78%]" />
            </div>
            <h3 className="text-xs font-bold text-white">OpenAPI 3.0 Mock, GAEB &amp; Sync</h3>
            <ul className="text-xs text-neutral-300 space-y-1.5">
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>In-Memory OpenAPI 3.0 REST Mock Server</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>GAEB DA XML 3.2 / 3.3 Validierung (X81-X86)</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Local Bridge Daemon mit 64-Bit OLEDB</span></li>
              <li className="flex items-start gap-1.5"><CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" /><span>Tauri 2.0 &amp; Electron Desktop Compiler</span></li>
            </ul>
          </div>
          <div className="text-[11px] text-purple-300 bg-purple-950/40 p-2 rounded-lg border border-purple-900/50 flex items-center justify-between">
            <span>Status:</span><strong>Fortgeschrittener Beta-Test</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
