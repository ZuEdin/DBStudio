
import React from 'react';
import { Database, Code, Zap, Layers, ShieldCheck, Rocket, GitBranch, Layout, Server, Database as DbIcon, CheckCircle2, ArrowRight, Lock, Users, Cloud, HardDrive, Terminal, TrendingUp, ClipboardList, Briefcase as BriefcaseIcon, Mail, MapPin, Globe, Cpu, Monitor, Cpu as CpuIcon, Sparkles } from 'lucide-react';

interface AppInfoViewProps {
    onNavigate: (view: string) => void;
}

export const AppInfoView: React.FC<AppInfoViewProps> = ({ onNavigate }) => {
  return (
    <div className="h-full bg-slate-50 overflow-y-auto">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white pt-24 pb-28 px-8 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 opacity-5 pointer-events-none transform translate-x-1/3 -translate-y-1/3">
            <DbIcon size={600} />
        </div>
        <div className="absolute bottom-0 left-0 opacity-5 pointer-events-none transform -translate-x-1/3 translate-y-1/3">
            <Code size={500} />
        </div>

        <div className="max-w-5xl mx-auto relative z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                <Sparkles size={12} className="animate-pulse" /> Neuheit: Tauri & Rust Desktop Support
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
                Die Geschwindigkeit von <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 font-black">Access</span>.<br/>
                Die Power von <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 font-black">Rust & Modern Web</span>.
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed md:mx-0 mx-auto">
                **DB Studio Pro (v1.0.0)** ist das weltweit führende visuelle CASE-Tool, das die Brücke zwischen klassischer Desktop-Produktivität und modernsten Cloud-Native Architekturen schlägt. Entwerfen Sie Tabellen, Beziehungen, Formulare und generieren Sie per Knopfdruck vollständige, produktionsreife IaC-Infrastrukturen und Quellcode.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button onClick={() => onNavigate('create_table')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-1 text-sm md:text-base">
                    <Rocket size={20}/> Visuellen Designer starten
                </button>
                <button onClick={() => onNavigate('backend_generate')} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-3 transition-all text-sm md:text-base">
                    <Code size={20}/> Blueprint Center öffnen
                </button>
            </div>
        </div>
      </div>

      {/* NEW: Platform Architecture Highlight Section (Electron vs Tauri) */}
      <div className="bg-slate-100 border-y border-slate-200 py-16">
          <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-12">
                  <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-3">
                      High-Performance Desktop Targets
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Vollwertige native Desktop-Applikation</h2>
                  <p className="text-slate-500 text-sm max-w-2xl mx-auto mt-2">
                      Wählen Sie im Integration-Center Ihre bevorzugte Desktop-Runtime aus: Die traditionelle Reichweite von Electron oder den hochmodernen, ressourceneffizienten Kern von Tauri.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Electron Box */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                      <div>
                          <div className="flex items-center gap-3 mb-4">
                              <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                  <Monitor size={22} />
                              </span>
                              <div>
                                  <h3 className="font-bold text-slate-800 text-lg">Electron Ecosystem Build</h3>
                                  <p className="text-[11px] text-slate-500 font-semibold">Stabilität & Bewährte Reichweite</p>
                              </div>
                          </div>
                          <p className="text-slate-600 text-xs leading-relaxed mb-4">
                              Generiert ein einsatzbereites JS-Desktop-Projekt mit <code>main.js</code>, <code>preload.js</code> und konfigurierter <code>electron-builder</code>-Verpackung. Perfekt geeignet für plattformübergreifende Software mit tiefen, klassischen NodeJS-Integrationen.
                          </p>
                          <ul className="space-y-2 text-[11px] text-slate-500 mb-6">
                              <li className="flex items-center gap-2">✓ Voller Zugriff auf das gesamte NPM-Ecosystem im Backend</li>
                              <li className="flex items-center gap-2">✓ Bewährtes Modell für traditionelle Windows & macOS Installer</li>
                              <li className="flex items-center gap-2">✓ Schneller Einstieg ohne C++ oder Rust Compiler</li>
                          </ul>
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Standard-Bundle: ~85MB</span>
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">NodeJS Wrapper</span>
                      </div>
                  </div>

                  {/* Tauri Box */}
                  <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
                      <div>
                          <div className="flex items-center gap-3 mb-4">
                              <span className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                                  <Terminal size={22} />
                              </span>
                              <div>
                                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                      Tauri (Rust-Powered)
                                      <span className="bg-amber-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Neu in v1.0</span>
                                  </h3>
                                  <p className="text-[11px] text-amber-300 font-semibold">Maximum Performance & Minimum RAM</p>
                              </div>
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed mb-4">
                              Kompiliert das Web-Frontend in ein native Rust-Executable über das OS-eigene Webview. Das Backend läuft komplett in Rust – für unübertroffene Laufzeitgeschwindigkeit, kompromisslose Speichersicherheit und minimale Setup-Größen.
                          </p>
                          <ul className="space-y-2 text-[11px] text-slate-400 mb-6">
                              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Enorm kleiner RAM-Verbrauch (&lt;40MB) und App-Größe (&lt;15MB)</li>
                              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Typsichere IPC Tauri Commands (Rust <code>#[tauri::command]</code>)</li>
                              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Integrierter lokaler Socket-Ping-Test direkt im nativen Rust Core</li>
                          </ul>
                      </div>
                      <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Standard-Bundle: &lt;15MB</span>
                          <span className="bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">Rust Native</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* The "Access" Comparison Section */}
      <div className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 py-20">
              <div className="flex flex-col md:flex-row items-center gap-16">
                  <div className="flex-1">
                      <div className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                          Prototyping neu gedacht
                      </div>
                      <h2 className="text-3xl font-bold text-slate-800 mb-6">Das Beste aus beiden Welten</h2>
                      <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-6">
                          Erinnern Sie sich an <strong>Microsoft Access</strong>? Es ermöglichte es jedem, schnell relationale Datenbanken zusammenzuklicken und sofort zu betreiben. Aber es war proprietär, schwer zu verwalten, im Web nahezu unbenutzbar und litt unter starker Altersermüdung.
                      </p>
                      <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                          <strong>DB Studio Pro</strong> bringt dieses legendäre Gefühl von Produktivität zurück – aber mit modernsten Webtechnologien. Kein Vendor-Lock-in, kein proprietäres Dateiformat. Sie erhalten echten, sauberen Source Code, den jeder Entwickler liebt und sofort erweitern kann.
                      </p>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 gap-6">
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                          <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0"><Database size={24}/></div>
                          <div>
                              <h4 className="font-bold text-slate-800 text-lg">Visueller Designer</h4>
                              <p className="text-slate-600 text-xs mt-1">Wie der Tabellen-Editor von früher, aber mit SQL, NoSQL & Relations-Support.</p>
                          </div>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><Layout size={24}/></div>
                          <div>
                              <h4 className="font-bold text-slate-800 text-lg">Formulare & Berichte</h4>
                              <p className="text-slate-600 text-xs mt-1">Drag & Drop UI-Builder für Eingabemasken und PDF-Reports ohne CSS-Kampf.</p>
                          </div>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0"><CheckCircle2 size={24}/></div>
                          <div>
                              <h4 className="font-bold text-slate-800 text-lg">100% Exportierbar</h4>
                              <p className="text-slate-600 text-xs mt-1">Keine Black-Box. Generieren Sie VS Code Projekte für C#, TypeScript & PHP.</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Main Features Grid */}
      <div className="bg-slate-50 py-20">
          <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-slate-800 mb-4">Umfassende Features & Fähigkeiten</h2>
                  <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base">
                      DB Studio Pro ist kein einfaches Prototyping-Werkzeug. Es entwirft und konfiguriert die komplexe relationale Logik, die Benutzeroberflächen und die gesamte IaC-Infrastruktur für Ihr Enterprise-System.
                  </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Feature 1 */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 transition-all hover:-translate-y-1 flex flex-col justify-between">
                      <div>
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                              <Database size={24} />
                          </div>
                          <h3 className="text-base font-bold text-slate-800 mb-2">1. Visuelles DB-Design (ERD)</h3>
                          <p className="text-slate-600 text-xs leading-relaxed">
                              Erstellen Sie relationale Datenmodelle im interaktiven ERD-Editor. Entwerfen Sie Tabellen, Fremdschlüssel und Indizes manuell oder generieren Sie diese per KI-Copilot.
                          </p>
                      </div>
                      <div className="mt-4 text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">IndexedDB & SQL Export</div>
                  </div>

                  {/* Feature 2 */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all hover:-translate-y-1 flex flex-col justify-between">
                      <div>
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                              <Terminal size={24} />
                          </div>
                          <h3 className="text-base font-bold text-slate-800 mb-2">2. Abfrage-Designer</h3>
                          <p className="text-slate-600 text-xs leading-relaxed">
                              Visuelle Generierung komplexer Abfragen (SELECT, UPDATE, DELETE, APPEND) mit Branchenassistenten für das automatische Aufspüren von Daten-Inkonsistenzen und Dubletten.
                          </p>
                      </div>
                      <div className="mt-4 text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Echtzeit SQL Engine</div>
                  </div>

                  {/* Feature 3 */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-300 transition-all hover:-translate-y-1 flex flex-col justify-between">
                      <div>
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                              <Layout size={24} />
                          </div>
                          <h3 className="text-base font-bold text-slate-800 mb-2">3. Formular-Designer</h3>
                          <p className="text-slate-600 text-xs leading-relaxed">
                              Erstellen Sie anspruchsvolle Eingabemasken per Drag & Drop. Integrieren Sie Lookup-Felder, relationale Unterformulare (n:m), Dateimanager und benutzerdefinierte Auswahlelemente.
                          </p>
                      </div>
                      <div className="mt-4 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Drag & Drop Form-Builder</div>
                  </div>

                  {/* Feature 4 */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-purple-300 transition-all hover:-translate-y-1 flex flex-col justify-between">
                      <div>
                          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                              <ClipboardList size={24} />
                          </div>
                          <h3 className="text-base font-bold text-slate-800 mb-2">4. Berichts- & Print-Designer</h3>
                          <p className="text-slate-600 text-xs leading-relaxed">
                              Entwerfen Sie druckfertige PDF- und Bildschirm-Reports. Nutzen Sie bedingte Formatierungen, Gruppierungen (mit Seitenumbrüchen) und die Steuerung über das Ribbon-Menü.
                          </p>
                      </div>
                      <div className="mt-4 text-[10px] font-semibold text-purple-600 uppercase tracking-wider">Bericht-Entwurf Ribbon</div>
                  </div>

                  {/* Feature 5 */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-amber-300 transition-all hover:-translate-y-1 flex flex-col justify-between">
                      <div>
                          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                              <Zap size={24} />
                          </div>
                          <h3 className="text-base font-bold text-slate-800 mb-2">5. Workflows & Lifecycle</h3>
                          <p className="text-slate-600 text-xs leading-relaxed">
                              Modellieren Sie Geschäftslogiken und Daten-Lebenszyklen visuell im AST-basierten Workflow-Editor. Richten Sie zeitgesteuerte Cron-Jobs oder Event-Trigger ein.
                          </p>
                      </div>
                      <div className="mt-4 text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Typsichere Ablaufsteuerung</div>
                  </div>

                  {/* Feature 6 */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-sky-300 transition-all hover:-translate-y-1 flex flex-col justify-between">
                      <div>
                          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-4">
                              <Cloud size={24} />
                          </div>
                          <h3 className="text-base font-bold text-slate-800 mb-2">6. Daten-Integrationen</h3>
                          <p className="text-slate-600 text-xs leading-relaxed">
                              Importieren Sie mühelos Excel/CSV, SharePoint-Listen oder klassische MS Access XML-Schemata. Synchronisieren Sie lokale Entwürfe per Live-Sync mit echten SQL-Datenbanken.
                          </p>
                      </div>
                      <div className="mt-4 text-[10px] font-semibold text-sky-600 uppercase tracking-wider">Migrations- & Import-Hub</div>
                  </div>

                  {/* Feature 7 */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-rose-300 transition-all hover:-translate-y-1 flex flex-col justify-between">
                      <div>
                          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-4">
                              <ShieldCheck size={24} />
                          </div>
                          <h3 className="text-base font-bold text-slate-800 mb-2">7. RBAC & Multi-Tenancy</h3>
                          <p className="text-slate-600 text-xs leading-relaxed">
                              Verwalten Sie Berechtigungen granular bis auf Tabellenebene. Richten Sie anspruchsvolle SaaS-Architekturen mit Spalten- oder DB-basierter Mandantenfähigkeit ein.
                          </p>
                      </div>
                      <div className="mt-4 text-[10px] font-semibold text-rose-600 uppercase tracking-wider">Enterprise Security</div>
                  </div>

                  {/* Feature 8 */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-orange-300 transition-all hover:-translate-y-1 flex flex-col justify-between">
                      <div>
                          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                              <Code size={24} />
                          </div>
                          <h3 className="text-base font-bold text-slate-800 mb-2">8. Full-Stack Generator</h3>
                          <p className="text-slate-600 text-xs leading-relaxed">
                              Generieren Sie Code für .NET 9, Node.js, PHP/Laravel, React, Angular und Desktop-Pakete für Tauri (Rust) oder Electron inkl. Dockerfiles und Terraform AWS Skripten.
                          </p>
                      </div>
                      <div className="mt-4 text-[10px] font-semibold text-orange-600 uppercase tracking-wider">Tauri & Cloud-Native ready</div>
                  </div>
              </div>
          </div>
      </div>

      {/* Target Audience Section */}
      <div className="bg-white py-20 border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-slate-800 mb-12 text-center">Ein Werkzeug für das ganze Team</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1: IT */}
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-slate-800 text-white rounded-lg"><Terminal size={18} /></div>
                          <h3 className="font-bold text-slate-800 text-sm">Entwickler</h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                          Der ultimative **Boilerplate-Killer**. Sparen Sie Tage an Setup-Zeit. Generieren Sie fehlerfreie Blueprint-Dateien nach Industriestandard.
                      </p>
                  </div>

                  {/* Card 2: Business Analysts */}
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-600 text-white rounded-lg"><TrendingUp size={18} /></div>
                          <h3 className="font-bold text-slate-800 text-sm">Analysten</h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                          Modellieren Sie Datenbeziehungen visuell. Entwerfen Sie anspruchsvolle Architekturen ganz ohne manuelle SQL-Befehle schreiben zu müssen.
                      </p>
                  </div>

                  {/* Card 3: Project Management */}
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-orange-500 text-white rounded-lg"><ClipboardList size={18} /></div>
                          <h3 className="font-bold text-slate-800 text-sm">Projektleiter</h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                          Erstellen Sie interaktive, lauffähige Prototypen. Zeigen Sie Stakeholdern echte Eingabemasken direkt im Browser.
                      </p>
                  </div>

                  {/* Card 4: Departments */}
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-emerald-600 text-white rounded-lg"><BriefcaseIcon size={18} /></div>
                          <h3 className="font-bold text-slate-800 text-sm">Fachabteilung</h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                          Ersetzen Sie unübersichtliche und ungesicherte Excel-Dateien durch echte relationale, typisierte Datenbanken im Team.
                      </p>
                  </div>
              </div>
          </div>
      </div>

      {/* Security & Roadmap Section */}
      <div className="max-w-6xl mx-auto px-4 py-20 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              
              {/* Local First / Privacy */}
              <div className="bg-slate-50 p-10 rounded-3xl border border-slate-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                      <Lock size={140} />
                  </div>
                  <div className="relative z-10">
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <CheckCircle2 className="text-emerald-500" size={20}/> 100% Local-First
                      </h3>
                      <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                          Ihre Daten gehören Ihnen. DB Studio Pro arbeitet komplett im Sandbox-Verfahren. Alle Ihre Tabellen, Konfigurationen und Exporte werden ausschließlich lokal in den IndexedDB-Datenbanken Ihres Webbrowsers gesichert.
                      </p>
                      <ul className="space-y-3 text-xs text-slate-600 font-medium">
                          <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Keine unerwünschte Cloud-Übertragung.</li>
                          <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Optimal für vertrauliche Geschäftsmodelle &amp; NDAs.</li>
                          <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Vollständig offline einsatzbereit.</li>
                      </ul>
                  </div>
              </div>

              {/* Integrations */}
              <div className="bg-slate-900 text-white p-10 rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                      <Layers size={140} />
                  </div>
                  <div className="relative z-10">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          <Cloud className="text-blue-400" size={20}/> Integrations Hub
                      </h3>
                      <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                          Daten-Ökosysteme aufbrechen: Nutzen Sie unsere Assistenten, um klassische Legacy-Anbindungen in moderne Services zu transformieren.
                      </p>
                      <div className="flex flex-wrap gap-2">
                          <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/10">SharePoint Listen</span>
                          <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/10">Excel / CSV Dataseeds</span>
                          <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/10">REST API Brücken</span>
                          <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/10">MS Access XML Schema</span>
                          <span className="bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">Neu: Tauri-Commands (Rust)</span>
                      </div>
                  </div>
              </div>

          </div>
      </div>

      {/* Tech Stack Banner */}
      <div className="py-16 bg-slate-50 border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 text-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Unterstützte Technologien</h3>
              <div className="flex flex-wrap justify-center gap-3">
                  {['.NET 9 API', 'Node.js Express', 'PHP Native', 'Laravel', 'React + Vite', 'Angular', 'Vue.js', 'Blazor WASM', 'Tauri Desktop (Rust)', 'Electron Desktop', 'Docker', 'SQL Server', 'MySQL', 'MongoDB', 'SQLite'].map(tech => (
                      <span key={tech} className="bg-white border border-slate-200 px-4 py-2 rounded-full text-xs font-medium text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-600 transition-colors cursor-default">
                          {tech}
                      </span>
                  ))}
              </div>
          </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-slate-900 text-white p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Bereit, Zeit zu sparen?</h2>
          <p className="text-slate-300 mb-10 max-w-xl mx-auto text-sm md:text-base">
              Starten Sie jetzt mit DB Studio Pro Version 1.0. Vom ersten visuellen Entwurf über lauffähige UI-Eingaben bis hin zur fertigen Tauri/Electron-App in unter 5 Minuten.
          </p>
          <button onClick={() => onNavigate('create_table')} className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-4 rounded-lg font-bold shadow-lg shadow-emerald-950/50 transition-all transform hover:scale-105">
              <GitBranch size={20}/> Jetzt ersten Entwurf anlegen
          </button>
      </div>

      {/* Contact / Imprint Section */}
      <div className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-sm">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                  <div className="flex items-center gap-2 mb-2">
                      <DbIcon size={20} className="text-blue-500"/>
                      <span className="font-bold text-slate-200 text-lg">DB Studio Pro</span>
                  </div>
                  <p className="max-w-xs text-xs text-slate-500 leading-relaxed">
                      Die professionelle Komplettlösung für schnelles Datenmodellierungs-Prototyping und native Anwendungsgenerierungen.
                      Built with ❤️ and high-performance blueprints.
                  </p>
              </div>
              
              <div className="text-center md:text-right">
                  <h4 className="font-bold text-slate-200 mb-2 uppercase tracking-wider text-xs">Kontakt & Impressum</h4>
                  <p className="font-medium text-slate-300">Edin Zubovic</p>
                  <p className="flex items-center justify-center md:justify-end gap-1 text-xs"><MapPin size={12}/> Birkenstraße 23, 4600 Wels</p>
                  <a href="mailto:edin.zubovic@hotmail.de" className="flex items-center justify-center md:justify-end gap-2 text-blue-400 hover:text-blue-300 mt-2 transition-colors text-xs">
                      <Mail size={14}/> edin.zubovic@hotmail.de
                  </a>
              </div>
          </div>
      </div>
    </div>
  );
};
