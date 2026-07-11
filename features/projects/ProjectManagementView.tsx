import React, { useState, useEffect } from 'react';
import { Briefcase, ClipboardList, Route, Zap, Database, Layers, ArrowLeft } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

// Subcomponents
import { ProjectOverview } from './components/ProjectOverview';
import { RequirementsDoc } from './components/RequirementsDoc';
import { VModelDesigner } from './components/VModelDesigner';
import { DotnetBackendSettings } from './components/DotnetBackendSettings';
import { SQLiteManager } from './components/SQLiteManager';
import { DBStudioRebuilder } from './components/DBStudioRebuilder';

interface Stage {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  description: string;
}

interface DBProject {
  id: string;
  name: string;
  description: string;
  created: string;
  currentStage: string;
  stages: Stage[];
}

interface ProjectManagementViewProps {
  initialPanel?: 'dashboard' | 'requirements' | 'vmodel' | 'dotnet' | 'sqlite' | 'rebuild';
}

export const ProjectManagementView: React.FC<ProjectManagementViewProps> = ({ initialPanel = 'dashboard' }) => {
  const ui = useUIStore();
  const [activePanel, setActivePanel] = useState<'dashboard' | 'requirements' | 'vmodel' | 'dotnet' | 'sqlite' | 'rebuild'>(initialPanel);
  const [activeProject, setActiveProject] = useState<DBProject | null>(null);

  // Sync activePanel if initialPanel prop changes via Ribbon trigger
  useEffect(() => {
    if (initialPanel) {
      setActivePanel(initialPanel);
    }
  }, [initialPanel]);

  const handleBackToWelcome = () => {
    ui.setCurrentView({ type: 'welcome' });
  };

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard & Phasen', icon: <Briefcase size={15} /> },
    { id: 'requirements' as const, label: 'Lasten- / Pflichtenheft', icon: <ClipboardList size={15} /> },
    { id: 'vmodel' as const, label: 'V-Modell Designer', icon: <Route size={15} /> },
    { id: 'dotnet' as const, label: '.NET 10 & SignalR Backend', icon: <Zap size={15} /> },
    { id: 'sqlite' as const, label: 'Projekt SQLite DBs', icon: <Database size={15} /> },
    { id: 'rebuild' as const, label: 'DB Studio nachbauen', icon: <Layers size={15} /> },
  ];

  const renderActivePanel = () => {
    switch (activePanel) {
      case 'dashboard':
        return <ProjectOverview onSetActiveProject={setActiveProject} activeProject={activeProject} />;
      case 'requirements':
        return <RequirementsDoc activeProjectId={activeProject?.id} />;
      case 'vmodel':
        return <VModelDesigner activeProjectId={activeProject?.id} />;
      case 'dotnet':
        return <DotnetBackendSettings activeProjectId={activeProject?.id} />;
      case 'sqlite':
        return <SQLiteManager activeProjectId={activeProject?.id} activeProjectName={activeProject?.name} />;
      case 'rebuild':
        return <DBStudioRebuilder />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden select-none">
      {/* View Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToWelcome}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
            title="Zurück zur Startseite"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Projekt & Anforderungs-Management (Requirements Engineering)
            </h1>
            <p className="text-[11px] text-slate-400">
              Steuern Sie Phasen, Spezifikationen und SQLite-Isolierungen für Ihr .NET 10 System
            </p>
          </div>
        </div>

        {activeProject && (
          <div className="hidden sm:flex items-center gap-2 bg-slate-55 shadow-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Aktives Projekt:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{activeProject.name}</span>
          </div>
        )}
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Vertical Sub-Navigation */}
        <div className="w-56 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 bg-slate-50 dark:bg-slate-900/40 p-3">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase px-3 mb-2 tracking-widest">Navigation</div>
            {navItems.map((item) => {
              const isActive = activePanel === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePanel(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-left transition ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mini Help Card */}
          <div className="bg-slate-100 dark:bg-slate-850 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500">
            <span className="font-bold block mb-1 text-slate-700 dark:text-slate-300">V-Modell & .NET 10</span>
            Konzipieren Sie Anforderungen im Lastenheft und übersetzen Sie diese über das V-Modell direkt in fertige .NET 10 Minimal APIs und SQLite Datenbank-Schnittstellen.
          </div>
        </div>

        {/* Dynamic Content Panel */}
        <div className="flex-1 p-5 overflow-hidden flex flex-col">
          {renderActivePanel()}
        </div>
      </div>
    </div>
  );
};
