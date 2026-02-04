
import React from 'react';
import { Database, Code, Zap, Layers, ShieldCheck, Rocket, GitBranch, Layout, Server, Database as DbIcon, CheckCircle2, ArrowRight, Lock, Users, Cloud, HardDrive, Terminal, TrendingUp, ClipboardList, Briefcase as BriefcaseIcon } from 'lucide-react';

interface AppInfoViewProps {
    onNavigate: (view: string) => void;
}

export const AppInfoView: React.FC<AppInfoViewProps> = ({ onNavigate }) => {
  return (
    <div className="h-full bg-slate-50 overflow-y-auto">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white pt-20 pb-24 px-8 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 opacity-5 pointer-events-none transform translate-x-1/3 -translate-y-1/3">
            <DbIcon size={600} />
        </div>
        <div className="absolute bottom-0 left-0 opacity-5 pointer-events-none transform -translate-x-1/3 translate-y-1/3">
            <Code size={500} />
        </div>

        <div className="max-w-5xl mx-auto relative z-10 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
                Die Geschwindigkeit von <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Access</span>.<br/>
                Die Power von <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Modern Web</span>.
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed md:mx-0 mx-auto">
                DB Studio Pro eliminiert die repetitive Arbeit beim Starten neuer Projekte. 
                Entwerfen Sie Ihr Datenmodell visuell, definieren Sie Logik und generieren Sie 
                per Knopfdruck eine vollständige Full-Stack Anwendung.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button onClick={() => onNavigate('create_table')} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1">
                    <Rocket size={24}/> Jetzt starten
                </button>
                <button onClick={() => onNavigate('backend_generate')} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-3 transition-all">
                    <Code size={24}/> Code generieren
                </button>
            </div>
        </div>
      </div>

      {/* The "Access" Comparison Section */}
      <div className="bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-6 py-16">
              <div className="flex flex-col md:flex-row items-center gap-12">
                  <div className="flex-1">
                      <div className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                          Prototyping neu gedacht
                      </div>
                      <h2 className="text-3xl font-bold text-slate-800 mb-4">Das Beste aus beiden Welten</h2>
                      <p className="text-slate-600 text-lg leading-relaxed mb-6">
                          Erinnern Sie sich an <strong>Microsoft Access</strong>? Es ermöglichte es jedem, schnell Datenbank-Anwendungen zusammenzuklicken. Aber es war schwer zu warten, schlecht im Web und proprietär.
                      </p>
                      <p className="text-slate-600 text-lg leading-relaxed">
                          <strong>DB Studio Pro</strong> bringt dieses Gefühl von Produktivität zurück – aber für moderne Architekturen. Kein Vendor-Lock-in. Sie erhalten echten, sauberen Source Code, den jeder Entwickler liebt.
                      </p>
                  </div>
                  <div className="flex-1 bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm relative">
                      <div className="space-y-4">
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0"><Database size={20}/></div>
                              <div>
                                  <h4 className="font-bold text-slate-800">Visueller Designer</h4>
                                  <p className="text-sm text-slate-500">Wie der Tabellen-Editor von früher, aber besser.</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><Layout size={20}/></div>
                              <div>
                                  <h4 className="font-bold text-slate-800">Formulare & Berichte</h4>
                                  <p className="text-sm text-slate-500">Drag & Drop UI ohne HTML/CSS Kampf.</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0"><CheckCircle2 size={20}/></div>
                              <div>
                                  <h4 className="font-bold text-slate-800">100% Exportierbar</h4>
                                  <p className="text-sm text-slate-500">C#, TypeScript, SQL. Kein "Runtime" Zwang.</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Target Audience Section (NEW) */}
      <div className="bg-slate-50 py-16 border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-12">
                  <h2 className="text-2xl font-bold text-slate-800 mb-4">Einsatzgebiete & Abteilungen</h2>
                  <p className="text-slate-500 max-w-2xl mx-auto">
                      DB Studio Pro ist nicht nur für Entwickler. Es befähigt Teams im ganzen Unternehmen, 
                      Datenprobleme zu lösen und Anforderungen präzise zu definieren.
                  </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1: IT */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-slate-800 text-white rounded-lg flex items-center justify-center mb-4">
                          <Terminal size={24} />
                      </div>
                      <h3 className="font-bold text-slate-800 mb-2">IT & Entwicklung</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                          Der ultimative <strong>Boilerplate-Killer</strong>. Sparen Sie Wochen an Setup-Zeit für neue Projekte. Generieren Sie sauberen Code als Basis für komplexe Systeme.
                      </p>
                  </div>

                  {/* Card 2: Business Analysts */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center mb-4">
                          <TrendingUp size={24} />
                      </div>
                      <h3 className="font-bold text-slate-800 mb-2">Business Analysten</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                          Modellieren Sie Datenbeziehungen visuell. Erstellen Sie Ad-hoc <strong>Berichte und Abfragen</strong>, um Antworten aus Daten zu gewinnen, ganz ohne SQL-Kenntnisse.
                      </p>
                  </div>

                  {/* Card 3: Project Management */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-orange-500 text-white rounded-lg flex items-center justify-center mb-4">
                          <ClipboardList size={24} />
                      </div>
                      <h3 className="font-bold text-slate-800 mb-2">Projektleiter / PO</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                          Erstellen Sie <strong>lebendige Spezifikationen</strong>. Zeigen Sie Stakeholdern echte Formulare und Datenflüsse, statt abstrakter Textwüsten.
                      </p>
                  </div>

                  {/* Card 4: Departments */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-emerald-600 text-white rounded-lg flex items-center justify-center mb-4">
                          <BriefcaseIcon size={24} />
                      </div>
                      <h3 className="font-bold text-slate-800 mb-2">Fachabteilungen</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                          Ersetzen Sie unübersichtliche <strong>Excel-Listen</strong> durch echte, sichere Datenbank-Anwendungen. Verwalten Sie Inventar, Kunden oder Aufgaben professionell.
                      </p>
                  </div>
              </div>
          </div>
      </div>

      {/* Security & Roadmap Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Local First / Privacy */}
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Lock size={120} />
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                          <HardDrive size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">100% Datenschutz: Local-First</h3>
                  </div>
                  <p className="text-slate-600 mb-4 leading-relaxed">
                      Wir nehmen Datenschutz ernst. DB Studio Pro arbeitet nach dem <strong>Local-First Prinzip</strong>. 
                      Alle Ihre Projekte, Tabellen und Daten werden ausschließlich <strong>lokal in Ihrem Browser</strong> (IndexedDB) gespeichert.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500 mb-6">
                      <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> Keine Cloud-Speicherung Ihrer Entwürfe.</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> Ideal für sensible Firmendaten & NDAs.</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500"/> Funktioniert komplett offline.</li>
                  </ul>
                  <div className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                      DSGVO Konform by Design
                  </div>
              </div>

              {/* Roadmap / Collaboration */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Cloud size={120} />
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg backdrop-blur-sm border border-blue-500/30">
                          <Users size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-white">Zukunft: Gemeinsames Arbeiten</h3>
                  </div>
                  <p className="text-slate-300 mb-4 leading-relaxed">
                      Skalieren Sie Ihr Prototyping. Wir arbeiten an einer optionalen <strong>Team Cloud</strong> Anbindung, 
                      um Projekte sicher mit Kollegen zu teilen und gemeinsam zu bearbeiten.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-400 mb-6">
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> Echtzeit-Kollaboration an Datenmodellen.</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> Zentrale Verwaltung von Vorlagen.</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> Versionierung und Rollback.</li>
                  </ul>
                  <div className="inline-block bg-blue-600/30 border border-blue-500/50 text-blue-200 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                      Coming Soon
                  </div>
              </div>

          </div>
      </div>

      {/* Main Features Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-10">Leistungsstarke Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors group">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Database size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Datenbank Design</h3>
                  <p className="text-slate-600 leading-relaxed">
                      Erstellen Sie Tabellen, definieren Sie Felder und ziehen Sie Relationen per Drag & Drop. 
                      Unterstützung für SQL Server, MySQL, SQLite und NoSQL.
                  </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 transition-colors group">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Layers size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Full-Stack Gen</h3>
                  <p className="text-slate-600 leading-relaxed">
                      Generieren Sie sauberen Code für Backend (.NET 9, Node.js, PHP) und Frontend (React, Angular, Vue). 
                      Inklusive Swagger und Docker Support.
                  </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:border-purple-200 transition-colors group">
                  <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <ShieldCheck size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Enterprise Ready</h3>
                  <p className="text-slate-600 leading-relaxed">
                      Integrierte Rollenverwaltung (RBAC), Multi-Tenancy Unterstützung, Windows Auth Integration 
                      und Whitelabeling-Optionen für Profis.
                  </p>
              </div>
          </div>
      </div>

      {/* Tech Stack Banner */}
      <div className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 text-center">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Unterstützte Technologien</h3>
              <div className="flex flex-wrap justify-center gap-3">
                  {['.NET 9 API', 'Node.js Express', 'PHP Native', 'Laravel', 'React + Vite', 'Angular', 'Vue.js', 'Blazor WASM', 'Electron', 'Docker', 'SQL Server', 'MySQL', 'MongoDB', 'SQLite'].map(tech => (
                      <span key={tech} className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-full text-sm font-medium text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-600 transition-colors cursor-default">
                          {tech}
                      </span>
                  ))}
              </div>
          </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-slate-900 text-white p-12 text-center">
          <h2 className="text-3xl font-bold mb-6">Bereit, Zeit zu sparen?</h2>
          <p className="text-slate-300 mb-10 max-w-xl mx-auto text-lg">
              Nutzen Sie DB Studio Pro für Ihr nächstes Projekt, Hackathon oder POC. 
              Vom Konzept zur laufenden App in unter 5 Minuten.
          </p>
          <button onClick={() => onNavigate('create_table')} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-bold shadow-lg shadow-emerald-900/50 transition-all transform hover:scale-105">
              <GitBranch size={24}/> Neues Projekt starten
          </button>
      </div>
    </div>
  );
};
