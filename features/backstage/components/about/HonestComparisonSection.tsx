import React from 'react';
import { 
  Scale, 
  Check, 
  X, 
  Minus, 
  Sparkles,
  Database,
  Code2,
  Lock,
  Layers
} from 'lucide-react';

export const HonestComparisonSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Scale className="text-amber-400" size={20} /> Ehrlicher Vergleich: DB Studio vs. Etablierte Alternativen
        </h2>
        <p className="text-xs text-neutral-400">
          Wo liegen die echten Vorteile von DB Studio und wo haben etablierte Werkzeuge aktuell noch die Nase vorn?
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse border border-[#383838] bg-[#222222] rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-[#1a1a1a] text-neutral-300 border-b border-[#383838]">
              <th className="p-3.5 font-bold">Kriterium</th>
              <th className="p-3.5 font-bold text-indigo-400">DB Studio Pro (Status Quo)</th>
              <th className="p-3.5 font-bold text-neutral-400">MS Access / FileMaker</th>
              <th className="p-3.5 font-bold text-neutral-400">Reines Hand-Coding</th>
              <th className="p-3.5 font-bold text-neutral-400">Cloud No-Code (Airtable etc.)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#333333] text-neutral-300">
            <tr>
              <td className="p-3 font-semibold text-white">Quellcode-Eigentum</td>
              <td className="p-3 text-emerald-400 font-bold flex items-center gap-1.5">
                <Check size={14} /> 100% Export (.NET, Node, PHP, React)
              </td>
              <td className="p-3 text-neutral-400">
                <Minus size={14} className="inline mr-1" /> Proprietäre .accdb / VBA
              </td>
              <td className="p-3 text-emerald-400">
                <Check size={14} className="inline mr-1" /> 100% eigener Code
              </td>
              <td className="p-3 text-rose-400">
                <X size={14} className="inline mr-1" /> Starker Vendor Lock-in
              </td>
            </tr>

            <tr>
              <td className="p-3 font-semibold text-white">Entwicklungs-Geschwindigkeit</td>
              <td className="p-3 text-emerald-400 font-bold">
                Sehr hoch (visueller Drag-&amp;-Drop Builder)
              </td>
              <td className="p-3 text-emerald-400">
                Hoch für Desktop-Prototypen
              </td>
              <td className="p-3 text-rose-400">
                Niedrig (alles muss manuell gebaut werden)
              </td>
              <td className="p-3 text-emerald-400">
                Sehr hoch
              </td>
            </tr>

            <tr>
              <td className="p-3 font-semibold text-white">Plattform-Unabhängigkeit</td>
              <td className="p-3 text-emerald-400 font-bold">
                Web, Mobil, Desktop (Tauri/Electron)
              </td>
              <td className="p-3 text-rose-400">
                Hauptsächlich Windows (Access)
              </td>
              <td className="p-3 text-emerald-400">
                Universell
              </td>
              <td className="p-3 text-neutral-400">
                Nur im Browser des Anbieters
              </td>
            </tr>

            <tr>
              <td className="p-3 font-semibold text-white">Lizenz- &amp; Betriebskosten</td>
              <td className="p-3 text-emerald-400 font-bold">
                0 € Lizenzkosten / Eigene Server
              </td>
              <td className="p-3 text-neutral-400">
                Microsoft 365 / Access Runtime nötig
              </td>
              <td className="p-3 text-emerald-400">
                Nur Serverkosten
              </td>
              <td className="p-3 text-rose-400">
                Monatliche Abokosten pro Nutzer
              </td>
            </tr>

            <tr>
              <td className="p-3 font-semibold text-white">Echte Live-ODBC/SQL Treiber</td>
              <td className="p-3 text-neutral-400 font-medium">
                <Minus size={14} className="inline mr-1" /> Im Browser nur Mock/Export (Kein nativer Socket)
              </td>
              <td className="p-3 text-emerald-400">
                <Check size={14} className="inline mr-1" /> Ausgereifte 32/64-Bit ODBC-Treiber
              </td>
              <td className="p-3 text-emerald-400">
                <Check size={14} className="inline mr-1" /> Direkte Treiber-Anbindung
              </td>
              <td className="p-3 text-neutral-400">
                Nur über Webhooks / REST APIs
              </td>
            </tr>

            <tr>
              <td className="p-3 font-semibold text-white">Reifegrad &amp; Ökosystem</td>
              <td className="p-3 text-amber-400 font-bold">
                ~60% (Aktives Solo-Entwickler-Projekt)
              </td>
              <td className="p-3 text-emerald-400">
                &gt; 30 Jahre Reife &amp; Stabilität
              </td>
              <td className="p-3 text-emerald-400">
                Unbegrenzte Flexibilität
              </td>
              <td className="p-3 text-emerald-400">
                Kommerziell etablierte Plattformen
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Honest Conclusion */}
      <div className="bg-[#1f1f28] border border-indigo-900/50 rounded-xl p-4.5 space-y-2">
        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
          Fazit &amp; Positionierung
        </h4>
        <p className="text-xs text-neutral-300 leading-relaxed">
          DB Studio schließt die Lücke zwischen der <strong>hohen Produktivität visueller RAD-Tools</strong> (wie MS Access) und der <strong>Zukunftssicherheit moderner Web-Technologien</strong>. Anstatt in einem geschlossenen Ökosystem gefangen zu sein, generiert DB Studio echten Standard-Quellcode (.NET, Express, PHP, Angular, React), der von jedem Entwicklerteam ohne DB Studio weiterentwickelt und betrieben werden kann.
        </p>
      </div>
    </div>
  );
};
