import React, { useState } from 'react';
import { Table, Query, Report, Form } from '../../types/index';
import { 
  Database, Table as TableIcon, Search, FileText, Layout, 
  Activity, HardDrive, Plus, ArrowRight, Clock
} from 'lucide-react';
import { PromoView } from './PromoView';

interface DashboardProps {
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  onNavigate: (type: 'table_create' | 'query_designer' | 'create_report' | 'create_form' | 'table_data', id?: string) => void;
}

export const WelcomeView: React.FC<DashboardProps> = ({ tables, queries, reports, forms, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'promo'>('promo');
  
  // Calculate some dummy stats
  const totalRows = tables.reduce((acc, t) => acc + (t.data?.length || 0), 0);
  const totalFields = tables.reduce((acc, t) => acc + t.fields.length, 0);
  
  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors duration-300">
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
  );

  const QuickAction = ({ icon: Icon, label, desc, onClick, colorClass }: any) => (
    <button 
      onClick={onClick}
      className="group flex flex-col items-start p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all text-left w-full"
    >
      <div className={`p-2 rounded-md mb-3 ${colorClass} text-white`}>
        <Icon size={20} />
      </div>
      <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{label}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{desc}</span>
    </button>
  );

  if (activeTab === 'promo') {
    return (
      <div className="h-full overflow-y-auto bg-slate-900 scroll-smooth">
        {/* Live Admin Workspace selector */}
        <div className="bg-slate-950 px-8 py-3 border-b border-slate-800/80 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-indigo-500 block animate-ping" />
            <span className="text-xs text-indigo-300 font-extrabold tracking-wider uppercase">DB Studio Marketing Portal</span>
          </div>
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button 
              onClick={() => setActiveTab('promo')} 
              className="px-3.5 py-1.5 rounded-md font-bold text-white bg-indigo-600 shadow"
            >
              🚀 Promo-Website (Aktiv)
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="px-3.5 py-1.5 rounded-md font-bold text-slate-400 hover:text-slate-200 transition-colors"
            >
              📊 Studio Dashboard
            </button>
          </div>
        </div>
        <PromoView tables={tables} queries={queries} reports={reports} forms={forms} onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="p-8 h-full bg-slate-100 dark:bg-slate-950 overflow-y-auto transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header containing the Switcher */}
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Willkommen zurück in DB Studio Pro. Hier ist der aktuelle Status Ihrer Anwendung.</p>
          </div>
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
            <button 
              onClick={() => setActiveTab('promo')} 
              className="px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              🚀 Zur Promo-Site
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="px-3 py-1.5 rounded-md bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
            >
              📊 Dashboard
            </button>
          </div>
        </div>


        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Tabellen" value={tables.length} icon={TableIcon} color="bg-orange-600" />
          <StatCard title="Datensätze" value={totalRows} icon={Database} color="bg-emerald-600" />
          <StatCard title="Abfragen" value={queries.length} icon={Search} color="bg-blue-600" />
          <StatCard title="Berichte & Formulare" value={reports.length + forms.length} icon={Layout} color="bg-purple-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area - Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Activity size={18} /> Schnellstart
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickAction 
                icon={TableIcon} 
                label="Neue Tabelle erstellen" 
                desc="Definieren Sie Felder und Datentypen für eine neue Datenstruktur." 
                onClick={() => onNavigate('table_create')}
                colorClass="bg-orange-500"
              />
              <QuickAction 
                icon={Search} 
                label="Abfrage entwerfen" 
                desc="Erstellen Sie komplexe Sichten und Analysen Ihrer Daten." 
                onClick={() => onNavigate('query_designer')}
                colorClass="bg-blue-500"
              />
              <QuickAction 
                icon={Layout} 
                label="Formular gestalten" 
                desc="Bauen Sie Eingabemasken für eine benutzerfreundliche Datenerfassung." 
                onClick={() => onNavigate('create_form')}
                colorClass="bg-indigo-500"
              />
              <QuickAction 
                icon={FileText} 
                label="Bericht generieren" 
                desc="Bereiten Sie Daten für den Druck oder Export auf." 
                onClick={() => onNavigate('create_report')}
                colorClass="bg-green-500"
              />
            </div>

            {/* Recent Tables */}
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mt-8">
              <HardDrive size={18} /> Aktuelle Tabellen
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Name</th>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Felder</th>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-400">Einträge</th>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 text-right">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tables.slice(0, 5).map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 group transition-colors duration-150">
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <TableIcon size={14} className="text-slate-400 dark:text-slate-500" />
                        {t.name}
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">{t.fields.length}</td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">{t.data?.length || 0}</td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => onNavigate('table_data', t.id)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Öffnen <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tables.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 dark:text-slate-500 italic">Noch keine Tabellen vorhanden.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar Area - System Health / Info */}
          <div className="space-y-6">
             <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Clock size={16} /> Systemstatus
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Version</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">1.0.0 Pro</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Engine</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">React/TS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Speicher</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">Optimal</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Alle Änderungen werden lokal im Speicher gehalten. Nutzen Sie "Speichern" um Daten persistent zu machen (simuliert).
                    </p>
                  </div>
                </div>
             </div>

             <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-lg shadow-md text-white">
                <h3 className="font-bold mb-2">Profi-Tipp</h3>
                <p className="text-sm text-slate-300 mb-4">
                  Nutzen Sie den <strong>AI-Assistenten</strong> im Tabellen-Designer, um komplexe Schemata durch bloße Beschreibung zu generieren.
                </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};