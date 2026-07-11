import React, { useState, useEffect } from 'react';
import { Briefcase, Calendar, CheckCircle2, Circle, Clock, Plus, Trash2, FolderPlus, Tag } from 'lucide-react';

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

interface ProjectOverviewProps {
  onSetActiveProject: (proj: DBProject) => void;
  activeProject: DBProject | null;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({ onSetActiveProject, activeProject }) => {
  const [projects, setProjects] = useState<DBProject[]>([]);
  const [showAddProj, setShowAddProj] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newStageTitle, setNewStageTitle] = useState('');
  const [newStageDesc, setNewStageDesc] = useState('');

  // Initial projects template
  useEffect(() => {
    const saved = localStorage.getItem('dbstudio_pm_projects');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProjects(parsed);
      if (parsed.length > 0 && !activeProject) {
        onSetActiveProject(parsed[0]);
      }
    } else {
      const defaultProjects: DBProject[] = [
        {
          id: 'p1',
          name: 'Kundenportal & CRM',
          description: 'Zentrales Portal zur Verwaltung von Kundenstammdaten, Rechnungen und Support-Tickets.',
          created: '2026-07-01',
          currentStage: 'Implementierung',
          stages: [
            { id: 's1', title: 'Lastenheft freigeben', status: 'done', description: 'Benutzeranforderungen definiert' },
            { id: 's2', title: 'Pflichtenheft erstellen', status: 'done', description: 'Systemarchitektur entworfen' },
            { id: 's3', title: '.NET 10 API aufsetzen', status: 'in_progress', description: 'Web API & SignalR-Hub vorbereiten' },
            { id: 's4', title: 'SQLite Datenbank-Anbindung', status: 'todo', description: 'Projekt-SQLite Datei konfigurieren' },
          ]
        },
        {
          id: 'p2',
          name: 'Lagerverwaltung SaaS',
          description: 'Echtzeit-Bestandstracking mit automatischen Nachbestellungen und Barcode-Schnittstelle.',
          created: '2026-07-08',
          currentStage: 'Anforderungsanalyse',
          stages: [
            { id: 's2_1', title: 'Anforderungsanalyse mit dem Kunden', status: 'in_progress', description: 'Erstgespräch und Stakeholder-Interviews' },
            { id: 's2_2', title: 'ER-Diagramm erstellen', status: 'todo', description: 'Tabellenstrukturen entwerfen' },
          ]
        }
      ];
      setProjects(defaultProjects);
      localStorage.setItem('dbstudio_pm_projects', JSON.stringify(defaultProjects));
      onSetActiveProject(defaultProjects[0]);
    }
  }, []);

  const saveProjectsToStorage = (updated: DBProject[]) => {
    setProjects(updated);
    localStorage.setItem('dbstudio_pm_projects', JSON.stringify(updated));
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const newProj: DBProject = {
      id: 'proj_' + Date.now(),
      name: newProjName,
      description: newProjDesc,
      created: new Date().toISOString().split('T')[0],
      currentStage: 'Initiation',
      stages: [
        { id: 's_init_1', title: 'Projekt-Initiation', status: 'done', description: 'Projekt erstellt im DB Studio' },
        { id: 's_init_2', title: 'Lastenheft entwerfen', status: 'todo', description: 'Fachliche Anforderungen erfassen' }
      ]
    };

    const updated = [...projects, newProj];
    saveProjectsToStorage(updated);
    onSetActiveProject(newProj);
    setNewProjName('');
    setNewProjDesc('');
    setShowAddProj(false);
  };

  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newStageTitle.trim()) return;

    const newStage: Stage = {
      id: 'stage_' + Date.now(),
      title: newStageTitle,
      status: 'todo',
      description: newStageDesc
    };

    const updatedProjects = projects.map(p => {
      if (p.id === activeProject.id) {
        const updatedProj = {
          ...p,
          stages: [...p.stages, newStage]
        };
        onSetActiveProject(updatedProj);
        return updatedProj;
      }
      return p;
    });

    saveProjectsToStorage(updatedProjects);
    setNewStageTitle('');
    setNewStageDesc('');
  };

  const toggleStageStatus = (stageId: string) => {
    if (!activeProject) return;

    const updatedProjects = projects.map(p => {
      if (p.id === activeProject.id) {
        const updatedStages = p.stages.map(s => {
          if (s.id === stageId) {
            const nextStatus: 'todo' | 'in_progress' | 'done' = 
              s.status === 'todo' ? 'in_progress' : s.status === 'in_progress' ? 'done' : 'todo';
            return { ...s, status: nextStatus };
          }
          return s;
        });

        // Determine current overall stage
        const activeStage = updatedStages.find(s => s.status === 'in_progress')?.title || 
                            updatedStages.find(s => s.status === 'todo')?.title || 
                            'Abgeschlossen';

        const updatedProj = {
          ...p,
          stages: updatedStages,
          currentStage: activeStage
        };
        onSetActiveProject(updatedProj);
        return updatedProj;
      }
      return p;
    });

    saveProjectsToStorage(updatedProjects);
  };

  const handleDeleteStage = (stageId: string) => {
    if (!activeProject) return;

    const updatedProjects = projects.map(p => {
      if (p.id === activeProject.id) {
        const updatedStages = p.stages.filter(s => s.id !== stageId);
        const updatedProj = { ...p, stages: updatedStages };
        onSetActiveProject(updatedProj);
        return updatedProj;
      }
      return p;
    });

    saveProjectsToStorage(updatedProjects);
  };

  const handleDeleteProject = (projId: string) => {
    const updated = projects.filter(p => p.id !== projId);
    saveProjectsToStorage(updated);
    if (activeProject?.id === projId) {
      onSetActiveProject(updated[0] || null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden p-1">
      {/* Sidebar: Projects list */}
      <div className="lg:col-span-1 border-r border-slate-200 dark:border-slate-800 pr-4 flex flex-col h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Briefcase size={16} className="text-emerald-600" />
            Aktive Projekte
          </h3>
          <button 
            onClick={() => setShowAddProj(!showAddProj)}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded flex items-center gap-1 transition"
          >
            <FolderPlus size={14} />
            Neu
          </button>
        </div>

        {showAddProj && (
          <form onSubmit={handleAddProject} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 mb-4 space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Projektname</label>
              <input 
                type="text" 
                value={newProjName} 
                onChange={(e) => setNewProjName(e.target.value)}
                className="w-full text-xs px-2 py-1 border rounded dark:bg-slate-900 dark:border-slate-700"
                placeholder="z.B. ERP Suite v2"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Beschreibung</label>
              <textarea 
                value={newProjDesc} 
                onChange={(e) => setNewProjDesc(e.target.value)}
                className="w-full text-xs px-2 py-1 border rounded h-16 dark:bg-slate-900 dark:border-slate-700"
                placeholder="Kurze Projektbeschreibung..."
              />
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button 
                type="button" 
                onClick={() => setShowAddProj(false)}
                className="px-2 py-1 border rounded text-slate-600"
              >
                Abbrechen
              </button>
              <button 
                type="submit" 
                className="px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Erstellen
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {projects.map((p) => (
            <div 
              key={p.id}
              onClick={() => onSetActiveProject(p)}
              className={`p-3 rounded-lg border cursor-pointer transition ${
                activeProject?.id === p.id 
                  ? 'border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20' 
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30'
              }`}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-100">{p.name}</h4>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }}
                  className="text-slate-400 hover:text-red-500 p-0.5 rounded"
                  title="Projekt löschen"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{p.description || 'Keine Beschreibung'}</p>
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar size={10} />
                  {p.created}
                </span>
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-medium text-slate-600 dark:text-slate-300">
                  {p.currentStage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Panel: Active Project details and Stages */}
      <div className="lg:col-span-2 flex flex-col h-full overflow-y-auto pl-2">
        {activeProject ? (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{activeProject.name}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-full">
                  Phase: {activeProject.currentStage}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {activeProject.description || 'Fügen Sie eine Beschreibung in der linken Spalte hinzu.'}
              </p>
            </div>

            {/* Stages / Milestones section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projektphasen & Stages</h3>
                <span className="text-[10px] text-slate-500">Klicken Sie auf Symbole, um den Status zu wechseln</span>
              </div>

              {/* Add Stage Form */}
              <form onSubmit={handleAddStage} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                <input 
                  type="text" 
                  value={newStageTitle}
                  onChange={(e) => setNewStageTitle(e.target.value)}
                  placeholder="Phase / Meilenstein-Name"
                  className="text-xs px-2 py-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 md:col-span-1"
                  required
                />
                <input 
                  type="text" 
                  value={newStageDesc}
                  onChange={(e) => setNewStageDesc(e.target.value)}
                  placeholder="Kurze Beschreibung"
                  className="text-xs px-2 py-1.5 border rounded dark:bg-slate-900 dark:border-slate-700 md:col-span-1"
                />
                <button 
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded flex items-center justify-center gap-1 transition"
                >
                  <Plus size={14} /> Stage hinzufügen
                </button>
              </form>

              {/* Stages Timeline List */}
              <div className="space-y-2.5">
                {activeProject.stages.map((st, idx) => (
                  <div 
                    key={st.id} 
                    className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800/80 hover:shadow-sm transition"
                  >
                    <button 
                      onClick={() => toggleStageStatus(st.id)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition shrink-0"
                    >
                      {st.status === 'done' ? (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      ) : st.status === 'in_progress' ? (
                        <Clock size={16} className="text-amber-500 animate-spin-slow" />
                      ) : (
                        <Circle size={16} />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className={`text-xs font-semibold ${st.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                          {st.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            st.status === 'done' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300' :
                            st.status === 'in_progress' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300' :
                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {st.status === 'done' ? 'Erledigt' : st.status === 'in_progress' ? 'In Arbeit' : 'Offen'}
                          </span>
                          <button 
                            onClick={() => handleDeleteStage(st.id)}
                            className="text-slate-300 hover:text-red-500 transition p-0.5"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      {st.description && (
                        <p className={`text-[11px] mt-0.5 ${st.status === 'done' ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          {st.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Tag size={24} className="mb-2 text-slate-300" />
            <p className="text-xs font-medium">Wählen Sie ein Projekt aus oder legen Sie ein neues an.</p>
          </div>
        )}
      </div>
    </div>
  );
};
