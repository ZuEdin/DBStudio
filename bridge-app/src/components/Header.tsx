import React from 'react';
import { 
  Activity, 
  Shield, 
  Terminal, 
  FolderGit2, 
  FileCode2, 
  Rocket, 
  Settings, 
  ListTodo, 
  Boxes, 
  Database,
  Sun,
  Moon,
  Globe,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { EnvironmentHealth } from '../types/bridge';
import { useTheme } from '../services/themeContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: EnvironmentHealth;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, health }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const tabs = [
    { id: 'overview', label: 'Übersicht & SDKs', icon: Activity },
    { id: 'dependencies', label: 'Pakete & Shared Store', icon: Boxes },
    { id: 'database', label: 'Datenbank & Access', icon: Database },
    { id: 'todos', label: 'Developer TODOs', icon: ListTodo },
    { id: 'workspaces', label: 'Workspaces', icon: FolderGit2 },
    { id: 'deployments', label: 'Deployments & Releases', icon: Rocket },
    { id: 'terminal', label: 'Live Terminal & Logs', icon: Terminal },
    { id: 'security', label: 'Sicherheit & CORS', icon: Shield },
    { id: 'api_docs', label: 'Web-Payload API', icon: FileCode2 },
    { id: 'settings', label: 'Einstellungen', icon: Settings },
  ];

  return (
    <header className="bg-white/95 dark:bg-[#0b1326]/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 shrink-0 z-30 sticky top-0 shadow-sm dark:shadow-2xl transition-colors duration-200">
      {/* Top Brand Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/80 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#060e20] border border-slate-200 dark:border-slate-700/80 flex items-center justify-center p-1.5 shadow-sm overflow-hidden shrink-0">
            <span className="font-extrabold text-emerald-500 font-mono text-sm">DB</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm md:text-base tracking-tight font-heading">
                DB Studio Local Bridge
              </h1>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold tracking-wider flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                v1.0.0 Daemon
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Lokale Ausführungs-, Transpilations- & Build-Umgebung
            </p>
          </div>
        </div>

        {/* Global Bridge Status Badges, Theme Toggle & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Bridge Port Badge */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#060e20] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px]">
              Port: <strong className="text-emerald-600 dark:text-emerald-400">{health.bridgePort}</strong>
            </span>
          </div>

          {/* Quick Frontend Link */}
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            title="Frontend auf http://localhost:3000 öffnen"
          >
            <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>:3000</span>
          </a>

          {/* Quick Swagger Link */}
          <a 
            href="http://localhost:5000/swagger" 
            target="_blank" 
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            title="Swagger UI auf http://localhost:5000/swagger öffnen"
          >
            <BookOpen className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>Swagger</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
          </a>

          {/* Theme Switcher Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-[#060e20] dark:hover:bg-[#131b2e] text-slate-700 dark:text-slate-300 transition-all shadow-sm flex items-center gap-1.5 text-xs font-semibold"
            title={isDark ? 'Zu hellem Design wechseln (Light Mode)' : 'Zu dunklem Design wechseln (Dark Mode)'}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span className="hidden sm:inline text-[11px]">Hell</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline text-[11px]">Dunkel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Streamlined Navigation Tabs Bar */}
      <div className="flex px-4 py-1.5 gap-1 overflow-x-auto bg-slate-50/90 dark:bg-[#060e20]/90">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-[#131b2e] border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
