import React from 'react';
import { Table, Query, Report, Form } from '../types/index';
import { 
  Database, Table as TableIcon, Search, FileText, Layout, 
  Activity, HardDrive, Plus, ArrowRight, Clock
} from 'lucide-react';

interface DashboardProps {
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  onNavigate: (type: 'table_create' | 'query_designer' | 'create_report' | 'create_form' | 'table_data', id?: string) => void;
}

export const WelcomeView: React.FC<DashboardProps> = ({ tables, queries, reports, forms, onNavigate }) => {
  
  // Calculate some dummy stats
  const totalRows = tables.reduce((acc, t) => acc + (t.data?.length || 0), 0);
  const totalFields = tables.reduce((acc, t) => acc + t.fields.length, 0);
  
  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
  );

  const QuickAction = ({ icon: Icon, label, desc, onClick, colorClass }: any) => (
    <button 
      onClick={onClick}
      className="group flex flex-col items-start p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-400 transition-all text-left w-full"
    >
      <div className={`p-2 rounded-md mb-3 ${colorClass} text-white`}>
        <Icon size={20} />
      </div>
      <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{label}</span>
      <span className="text-xs text-slate-500 mt-1">{desc}</span>
    </button>
  );

  return (
    <div className="p-8 h-full bg-slate-100 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500">Willkommen zurück in DB Studio Pro. Hier ist der aktuelle Status Ihrer Datenbank.</p>
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
            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
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
            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2 mt-8">
              <HardDrive size={18} /> Aktuelle Tabellen
            </h2>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-semibold text-slate-600">Name</th>
                    <th className="p-3 font-semibold text-slate-600">Felder</th>
                    <th className="p-3 font-semibold text-slate-600">Einträge</th>
                    <th className="p-3 font-semibold text-slate-600 text-right">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tables.slice(0, 5).map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 group">
                      <td className="p-3 font-medium text-slate-800 flex items-center gap-2">
                        <TableIcon size={14} className="text-slate-400" />
                        {t.name}
                      </td>
                      <td className="p-3 text-slate-500">{t.fields.length}</td>
                      <td className="p-3 text-slate-500">{t.data?.length || 0}</td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => onNavigate('table_data', t.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Öffnen <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tables.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 italic">Noch keine Tabellen vorhanden.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar Area - System Health / Info */}
          <div className="space-y-6">
             <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Clock size={16} /> Systemstatus
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Version</span>
                    <span className="font-mono text-slate-700">2.4.0 Pro</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Engine</span>
                    <span className="font-mono text-slate-700">React/TS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Speicher</span>
                    <span className="text-green-600 font-medium">Optimal</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 mt-2">
                    <p className="text-xs text-slate-400">
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