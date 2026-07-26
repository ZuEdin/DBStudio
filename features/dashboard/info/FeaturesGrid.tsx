import React from 'react';
import { Database, Sparkles, Terminal, Layout, FileSpreadsheet, Zap, Code, Users, ClipboardList, Monitor } from 'lucide-react';

export const FeaturesGrid: React.FC = () => {
  return (
    <div className="bg-white py-16 px-6 border-b border-slate-200" id="features-grid-container">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded">
            Feature-Übersicht
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950 mt-3 mb-4">
            Was DB Studio Pro für Sie leisten kann
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            DB Studio Pro ist eine integrierte Entwicklungsumgebung für relationale Datenstrukturen. Erstellen Sie komplexe Tabellendesigns, automatisieren Sie Abläufe und generieren Sie sauberen Code.
          </p>
        </div>

        <div className="space-y-12">
          {/* Pillar 1: Datenarchitektur */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start border-t border-slate-100 pt-8">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <Database size={18} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Datenarchitektur</h3>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Der Grundstein für robuste Anwendungen. Entwerfen Sie relationale Schemata visuell oder lassen Sie sich von unserer KI unterstützen.
              </p>
            </div>
            
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-100" id="feat-erd">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Database size={16} className="text-blue-600" />
                  <span>1. ERD & Relationales Design</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Modellieren Sie Tabellen und Beziehungen (1:n, n:m) interaktiv. Definieren Sie Fremdschlüssel, Indizes und Feldtypen direkt im visuellen Editor.
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-100" id="feat-ai">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>2. KI-Schema-Assistent</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Beschreiben Sie Ihre Anforderungen in natürlicher deutscher Sprache. Die integrierte KI-Logik schlägt fertige Tabellenstrukturen und Datenbeziehungen vor.
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-100" id="feat-query">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Terminal size={16} className="text-indigo-600" />
                  <span>3. Visueller Abfrage-Designer</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Klicken Sie komplexe Abfragen zusammen. Unser Abfrage-Assistent findet automatisiert Dubletten, filtert Werte und berechnet Ausdrücke in Echtzeit.
                </p>
              </div>
            </div>
          </div>

          {/* Pillar 2: User Interfaces */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start border-t border-slate-100 pt-8">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Layout size={18} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">User Interfaces & Logik</h3>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Bringen Sie Daten auf den Bildschirm. Erstellen Sie professionelle Eingabemasken und automatisieren Sie Abläufe ganz ohne Programmierung.
              </p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-100" id="feat-forms">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Layout size={16} className="text-emerald-600" />
                  <span>4. Formular-Designer</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Bauen Sie Eingabemasken per Drag & Drop. Integrieren Sie Lookup-Felder, Unterformulare für verknüpfte Tabellen und Validierungsregeln.
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-100" id="feat-reports">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-purple-600" />
                  <span>5. Berichts- & PDF-Drucker</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Generieren Sie druckfertige PDF-Reports. Nutzen Sie bedingte Formatierungen, Gruppierungen mit Zwischensummen und Ribbon-gesteuerte Vorschauen.
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-100" id="feat-workflow">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Zap size={16} className="text-amber-600" />
                  <span>6. Visueller Makro-Editor</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Modellieren Sie Workflows grafisch im Makro-System. Richten Sie Daten-Validierungen, automatisierte E-Mails, Exporte und logische Bedingungen ein.
                </p>
              </div>
            </div>
          </div>

          {/* Pillar 3: Professional Suite */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start border-t border-slate-100 pt-8">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Code size={18} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Entwickler-Suite</h3>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Werkzeuge für professionelle Software-Teams. Beschleunigen Sie Ihre Entwicklungsschritte und arbeiten Sie nahtlos live mit Kollegen zusammen.
              </p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-100" id="feat-collab">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Users size={16} className="text-blue-600" />
                  <span>7. Live-Zusammenarbeit</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Arbeiten Sie mit Teammitgliedern in Echtzeit am selben Schema. Sehen Sie sofort, wer welche Tabellen bearbeitet, dank Live-Zusammenarbeits-Anzeige.
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-100" id="feat-tickets">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <ClipboardList size={16} className="text-red-500" />
                  <span>8. Integriertes Ticket-Board</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Koordinieren Sie offene Aufgaben direkt im System. Nutzen Sie das integrierte Kanban-Board für das Aufgabenmanagement direkt neben Ihren Modellen.
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-100" id="feat-codegen">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Code size={16} className="text-orange-600" />
                  <span>9. Multi-Target Code-Generator</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Exportieren Sie einsatzbereiten Source Code für React, Angular, Tauri (Rust), Electron (NodeJS), .NET Core, PHP/Laravel, Docker & Terraform AWS IaC.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
