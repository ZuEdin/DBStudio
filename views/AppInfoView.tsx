
import React from 'react';
import { Database, Code, Zap, Layers, ShieldCheck, Rocket, GitBranch, Layout, Server, Database as DbIcon, CheckCircle2, ArrowRight, Lock, Users, Cloud, HardDrive, Terminal, TrendingUp, ClipboardList, Briefcase as BriefcaseIcon, Mail, MapPin, Globe, Cpu } from 'lucide-react';

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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-6">
                <Zap size={14} className="fill-current" /> Version 2.4 Enterprise
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
                Die Geschwindigkeit von <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Access</span>.<br/>
                Die Power von <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Modern Web</span>.
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed md:mx-0 mx-auto">
                DB Studio Pro eliminiert die repetitive Arbeit beim Starten neuer Projekte. 
                Entwerfen Sie Ihr Datenmodell visuell, definieren Sie Logik und generieren Sie 
                per Knopfdruck eine vollständige Full-Stack Anwendung – inkl. Source Code.
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
          <div className="max-w-6xl mx-auto px-6 py-20">
              <div className="flex flex-col md:flex-row items-center gap-16">
                  <div className="flex-1">
                      <div className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                          Prototyping neu gedacht
                      </div>
                      <h2 className="text-3xl font-bold text-slate-800 mb-6">Das Beste aus beiden Welten</h2>
                      <p className="text-slate-600 text-lg leading-relaxed mb-6">
                          Erinnern Sie sich an <strong>Microsoft Access</strong>? Es ermöglichte es jedem, schnell Datenbank-Anwendungen zusammenzuklicken. Aber es war schwer zu warten, schlecht im Web und proprietär.
                      </p>
                      <p className="text-slate-600 text-lg leading-relaxed">
                          <strong>DB Studio Pro</strong> bringt dieses Gefühl von Produktivität zurück – aber für moderne Architekturen. Kein Vendor-Lock-in. Sie erhalten echten, sauberen Source Code (.NET, React, Node), den jeder Entwickler liebt.
                      </p>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 gap-6">
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                          <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0"><Database size={24}/></div>
                          <div>
                              <h4 className="font-bold text-slate-800 text-lg">Visueller Designer</h4>
                              <p className="text-slate-600 mt-1">Wie der Tabellen-Editor von früher, aber mit SQL, NoSQL & Relations-Support.</p>
                          </div>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><Layout size={24}/></div>
                          <div>
                              <h4 className="font-bold text-slate-800 text-lg">Formulare & Berichte</h4>
                              <p className="text-slate-600 mt-1">Drag & Drop UI-Builder für Eingabemasken und PDF-Reports ohne CSS-Kampf.</p>
                          </div>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0"><CheckCircle2 size={24}/></div>
                          <div>
                              <h4 className="font-bold text-slate-800 text-lg">100% Exportierbar</h4>
                              <p className="text-slate-600 mt-1">Keine Black-Box. Generieren Sie VS Code Projekte für C#, TypeScript & PHP.</p>
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
                  <h2 className="text-3xl font-bold text-slate-800 mb-4">Enterprise Features inklusive</h2>
                  <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                      Wir bauen nicht nur "Hello World" Apps. DB Studio Pro generiert die komplexe Infrastruktur, 
                      die Unternehmensanwendungen benötigen.
                  </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Feature 1 */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-purple-300 transition-all hover:-translate-y-1">
                      <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                          <ShieldCheck size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-3">Sicherheit & RBAC</h3>
                      <p className="text-slate-600 leading-relaxed">
                          Integrierte Rollenverwaltung (Admin, User, Guest) und Rechte-Matrix bis auf Feldebene. 
                          Inklusive Unterstützung für <strong>Windows Authentication (AD)</strong> und JWT.
                      </p>
                  </div>
                  {/* Feature 2 */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all hover:-translate-y-1">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                          <Globe size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-3">Multi-Tenancy</h3>
                      <p className="text-slate-600 leading-relaxed">
                          Bauen Sie SaaS-Anwendungen. Der Generator unterstützt <strong>Mandantenfähigkeit</strong> 
                          sowohl über Discriminator-Columns als auch über separate Datenbanken pro Kunde.
                      </p>
                  </div>
                  {/* Feature 3 */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-300 transition-all hover:-translate-y-1">
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                          <Cpu size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-3">Workflows & Jobs</h3>
                      <p className="text-slate-600 leading-relaxed">
                          Definieren Sie Geschäftslogik visuell. Der integrierte <strong>Scheduler</strong> generiert 
                          Cron-Jobs (Node.js) oder Hosted Services (.NET) für automatisierte Aufgaben.
                      </p>
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
                          <div className="p-2 bg-slate-800 text-white rounded-lg"><Terminal size={20} /></div>
                          <h3 className="font-bold text-slate-800">Entwickler</h3>
                      </div>
                      <p className="text-sm text-slate-600">
                          Der ultimative <strong>Boilerplate-Killer</strong>. Sparen Sie Wochen an Setup-Zeit. Generieren Sie sauberen Code als Basis.
                      </p>
                  </div>

                  {/* Card 2: Business Analysts */}
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-600 text-white rounded-lg"><TrendingUp size={20} /></div>
                          <h3 className="font-bold text-slate-800">Analysten</h3>
                      </div>
                      <p className="text-sm text-slate-600">
                          Modellieren Sie Datenbeziehungen visuell. Erstellen Sie Ad-hoc Berichte ohne SQL-Kenntnisse.
                      </p>
                  </div>

                  {/* Card 3: Project Management */}
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-orange-500 text-white rounded-lg"><ClipboardList size={20} /></div>
                          <h3 className="font-bold text-slate-800">Projektleiter</h3>
                      </div>
                      <p className="text-sm text-slate-600">
                          Erstellen Sie <strong>lebendige Spezifikationen</strong>. Zeigen Sie Stakeholdern echte Formulare statt Wireframes.
                      </p>
                  </div>

                  {/* Card 4: Departments */}
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-emerald-600 text-white rounded-lg"><BriefcaseIcon size={20} /></div>
                          <h3 className="font-bold text-slate-800">Fachabteilung</h3>
                      </div>
                      <p className="text-sm text-slate-600">
                          Ersetzen Sie unübersichtliche <strong>Excel-Listen</strong> durch echte, sichere Datenbank-Anwendungen.
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
                          <CheckCircle2 className="text-emerald-500"/> 100% Local-First
                      </h3>
                      <p className="text-slate-600 mb-6 leading-relaxed">
                          Wir nehmen Datenschutz ernst. DB Studio Pro arbeitet nach dem Prinzip der Datenhoheit. 
                          Alle Ihre Projekte, Tabellen und Daten werden ausschließlich <strong>lokal in Ihrem Browser</strong> (IndexedDB) gespeichert.
                      </p>
                      <ul className="space-y-3 text-sm text-slate-600 font-medium">
                          <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Keine Cloud-Speicherung Ihrer Entwürfe.</li>
                          <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Ideal für sensible Firmendaten & NDAs.</li>
                          <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Funktioniert komplett offline.</li>
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
                          <Cloud className="text-blue-400"/> Integrations Hub
                      </h3>
                      <p className="text-slate-300 mb-6 leading-relaxed">
                          Ihre Daten leben nicht im Vakuum. Nutzen Sie unsere Wizards, um bestehende Silos aufzubrechen.
                      </p>
                      <div className="flex flex-wrap gap-2">
                          <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/10">SharePoint Listen</span>
                          <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/10">Excel / CSV</span>
                          <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/10">REST APIs</span>
                          <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/10">MS Access XML</span>
                          <span className="bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">Neu: AI Generation</span>
                      </div>
                  </div>
              </div>

          </div>
      </div>

      {/* Tech Stack Banner */}
      <div className="py-16 bg-slate-50 border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 text-center">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Unterstützte Technologien</h3>
              <div className="flex flex-wrap justify-center gap-3">
                  {['.NET 9 API', 'Node.js Express', 'PHP Native', 'Laravel', 'React + Vite', 'Angular', 'Vue.js', 'Blazor WASM', 'Electron', 'Docker', 'SQL Server', 'MySQL', 'MongoDB', 'SQLite'].map(tech => (
                      <span key={tech} className="bg-white border border-slate-200 px-4 py-2 rounded-full text-sm font-medium text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-600 transition-colors cursor-default">
                          {tech}
                      </span>
                  ))}
              </div>
          </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-slate-900 text-white p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Bereit, Zeit zu sparen?</h2>
          <p className="text-slate-300 mb-10 max-w-xl mx-auto text-lg">
              Nutzen Sie DB Studio Pro für Ihr nächstes Projekt, Hackathon oder POC. 
              Vom Konzept zur laufenden App in unter 5 Minuten.
          </p>
          <button onClick={() => onNavigate('create_table')} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-bold shadow-lg shadow-emerald-900/50 transition-all transform hover:scale-105">
              <GitBranch size={24}/> Neues Projekt starten
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
                  <p className="max-w-xs text-xs text-slate-500">
                      Die moderne Lösung für schnelles Prototyping und Generierung von Unternehmensanwendungen.
                      Built with ❤️ and Code.
                  </p>
              </div>
              
              <div className="text-center md:text-right">
                  <h4 className="font-bold text-slate-200 mb-2 uppercase tracking-wider text-xs">Kontakt & Impressum</h4>
                  <p className="font-medium text-slate-300">Edin Zubovic</p>
                  <p className="flex items-center justify-center md:justify-end gap-1"><MapPin size={12}/> Birkenstraße 23, 4600 Wels</p>
                  <a href="mailto:edin.zubovic@hotmail.de" className="flex items-center justify-center md:justify-end gap-2 text-blue-400 hover:text-blue-300 mt-2 transition-colors">
                      <Mail size={14}/> edin.zubovic@hotmail.de
                  </a>
              </div>
          </div>
      </div>
    </div>
  );
};
