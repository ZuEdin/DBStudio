import React from 'react';
import { 
  Database, 
  Server, 
  Laptop, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Globe, 
  FileCode2,
  Percent,
  Printer,
  Sparkles
} from 'lucide-react';

export const TechStackShowcase: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-[#24242e] border border-amber-500/30 rounded-2xl p-6 space-y-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-xs">
            <Zap size={12} className="text-amber-400" /> Multi-Target Ökosystem
          </span>
          <span className="text-xs text-neutral-400 font-medium">Standards &amp; Frameworks</span>
        </div>
        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
          Unterstützte Technologien &amp; Export-Ökosysteme
        </h2>
        <p className="text-xs md:text-sm text-neutral-300 leading-relaxed max-w-4xl">
          DB Studio Pro übersetzt visuelle Metamodelle direkt in sauberen, standardisierten Quellcode für moderne Enterprise-Technologien – ohne Vendor Lock-in und ohne proprietäre Zwangs-Laufzeiten.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. In-Browser Access MDB/ACCDB Engine */}
        <div className="bg-[#222222] border border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/50 transition-colors shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Database size={20} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/40">
                100% In-Browser
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Access MDB/ACCDB Migration</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Binäre Extraktion von Tabellen, AutoWert-Primärschlüsseln, <code>MSysQueries</code>, Formularen und Berichten direkt im Browser via <strong>MDBReader &amp; Buffer Polyfill</strong>.
            </p>
            <ul className="text-xs text-neutral-400 space-y-1.5 pt-2 border-t border-[#333333]">
              <li>• <strong>Auto-PK Inferenz:</strong> Zuverlässige Erkennung von Primär- und Fremdschlüsseln.</li>
              <li>• <strong>OLE-Strip:</strong> Wandelt Microsoft-spezifische OLE-Blobs in Standard-Bilder um.</li>
              <li>• <strong>Zero Cloud:</strong> 100% Datenschutz ohne Server-Upload.</li>
            </ul>
          </div>
        </div>

        {/* 2. DACH & Steuersatz Engine */}
        <div className="bg-[#222222] border border-red-500/30 rounded-2xl p-5 flex flex-col justify-between hover:border-red-500/50 transition-colors shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <Percent size={20} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/60 px-2.5 py-1 rounded-md border border-red-800/40">
                DACH &amp; Baunormen
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">DACH-Steuern &amp; Kalkulation</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Kaufmännische Steuer- und Abzugsberechnung für Österreich, Deutschland und die Schweiz inklusive Baunormen.
            </p>
            <ul className="text-xs text-neutral-400 space-y-1.5 pt-2 border-t border-[#333333]">
              <li>• <strong>AT / DE / CH Sätze:</strong> 20%, 19%, 8.1% und Bauleistungen (§19 / §13b UStG).</li>
              <li>• <strong>ÖNORM B 2110 &amp; VOB/B:</strong> 3% Haftrücklass und 5% Deckungsrücklass.</li>
              <li>• <strong>DB-Steuertabelle:</strong> 1-Klick Anlegen der strukturierten Steuersatz-Tabelle.</li>
            </ul>
          </div>
        </div>

        {/* 3. .NET 9/10 EF Core Multi-DB */}
        <div className="bg-[#222222] border border-purple-500/30 rounded-2xl p-5 flex flex-col justify-between hover:border-purple-500/50 transition-colors shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <FileCode2 size={20} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded-md border border-purple-800/40">
                .NET 10 / C#
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">C# EF Core Multi-DB Backend</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Generiert schlüsselfertige ASP.NET Core Web APIs mit Entity Framework Core für <strong>MSSQL, SQLite, MySQL und PostgreSQL</strong>.
            </p>
            <ul className="text-xs text-neutral-400 space-y-1.5 pt-2 border-t border-[#333333]">
              <li>• <strong>Fluent API &amp; Seed:</strong> DDL-Generierung &amp; <code>SET IDENTITY_INSERT</code>.</li>
              <li>• <strong>Junction Tables:</strong> n:m Relationen mit <code>.UsingEntity&lt;T&gt;()</code>.</li>
              <li>• <strong>Typensicher:</strong> C# Records, Models, Controller &amp; Swagger DTOs.</li>
            </ul>
          </div>
        </div>

        {/* 4. E-Invoicing & Berichte */}
        <div className="bg-[#222222] border border-amber-500/30 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-500/50 transition-colors shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Printer size={20} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-800/40">
                E-Invoicing &amp; Print
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">ZUGFeRD 2.0 &amp; Swiss QR-Bill</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Standardisierte B2B/B2G E-Rechnungen und Drucklayouts nach europäischen und Schweizer Zahlungsstandards.
            </p>
            <ul className="text-xs text-neutral-400 space-y-1.5 pt-2 border-t border-[#333333]">
              <li>• <strong>ZUGFeRD / Factur-X:</strong> Strukturierte XML-Rechnung (EN 16931).</li>
              <li>• <strong>Swiss QR-Bill:</strong> Schweizer Zahlteil mit QR-IBAN und Referenz.</li>
              <li>• <strong>DIN 5008:</strong> Briefkopf, Faltmarken &amp; Fensterkuvert-Adressfeld.</li>
            </ul>
          </div>
        </div>

        {/* 5. Node.js & TypeScript / Drizzle */}
        <div className="bg-[#222222] border border-cyan-500/30 rounded-2xl p-5 flex flex-col justify-between hover:border-cyan-500/50 transition-colors shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Server size={20} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800/40">
                Node.js &amp; TS
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Express &amp; TypeScript REST API</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Moderne Express-API mit Drizzle ORM Schema, JSON REST Endpoints, JWT Auth und OpenAPI 3.0 Spezifikation.
            </p>
            <ul className="text-xs text-neutral-400 space-y-1.5 pt-2 border-t border-[#333333]">
              <li>• <strong>Mock Server:</strong> In-Browser REST Mocking mit einstellbarer Latenz.</li>
              <li>• <strong>Docker Ready:</strong> Sofortige Bereitstellung via Dockerfile / Compose.</li>
              <li>• <strong>Strikte Typen:</strong> Automatische TypeScript Interfaces für alle Tabellen.</li>
            </ul>
          </div>
        </div>

        {/* 6. Frontend: React & Angular SDUI */}
        <div className="bg-[#222222] border border-rose-500/30 rounded-2xl p-5 flex flex-col justify-between hover:border-rose-500/50 transition-colors shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Layers size={20} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-md border border-rose-800/40">
                React &amp; Angular
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">React Tailwind &amp; Angular Signals</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Generiert vollständige CRUD-Frontends mit Datengitter, N-Ebenen Subforms, Normalisierungs-Matching und Suche.
            </p>
            <ul className="text-xs text-neutral-400 space-y-1.5 pt-2 border-t border-[#333333]">
              <li>• <strong>Smart Matching:</strong> Zuverlässige Auflösung von `clean(alias)` Spalten.</li>
              <li>• <strong>Server-Driven UI (SDUI):</strong> Dynamisches JSON-Rendering für Formulare.</li>
              <li>• <strong>Theming:</strong> Responsive Layouts mit vollständigem Dark- &amp; Light-Mode.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
