
import React, { useState, useEffect, useRef } from 'react';
import { Database, Plus, Upload, FolderOpen, Clock, Trash2, Laptop, PlayCircle } from 'lucide-react';
import { DbType, Project } from '../types/index';
import { getAllProjects, deleteProjectFromStorage, saveProjectToStorage } from '../services/storageService';

interface ProjectSelectionViewProps {
  onSelectProject: (project: Project) => void;
  onCreateNew: (type: DbType, name: string, isDemo?: boolean) => void;
}

export const DatabaseSelector: React.FC<ProjectSelectionViewProps> = ({ onSelectProject, onCreateNew }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  
  // New Project Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<DbType>(DbType.SQL);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const list = await getAllProjects();
    setProjects(list);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Möchten Sie dieses Projekt wirklich unwiderruflich löschen?')) {
      await deleteProjectFromStorage(id);
      loadProjects();
    }
  };

  const handleCreate = () => {
    if (newProjectName.trim()) {
      onCreateNew(newProjectType, newProjectName, false);
    }
  };

  const handleCreateDemo = () => {
      onCreateNew(DbType.SQL, "IT-Verleih Demo", true);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const project = JSON.parse(json) as Project;
        
        // Basic Validation
        if (!project.id || !project.data || !project.data.tables) {
            throw new Error("Ungültiges Dateiformat");
        }

        const existing = projects.find(p => p.id === project.id);
        if (existing) {
            if(!confirm(`Das Projekt "${project.name}" existiert bereits. Überschreiben?`)) {
                project.id = crypto.randomUUID();
                project.name = project.name + " (Importiert)";
            }
        }
        
        project.lastModified = Date.now();
        await saveProjectToStorage(project);
        await loadProjects();
        alert('Projekt erfolgreich importiert!');
      } catch (err) {
        alert('Fehler beim Importieren: ' + err);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      
      {/* Left Panel: Recent / Open */}
      <div className="w-1/2 p-10 flex flex-col border-r border-slate-200 bg-white">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <Database className="text-blue-600" /> DB Studio Pro
        </h1>
        <p className="text-slate-500 mb-8">Professionelles Datenbank-Design & Prototyping.</p>

        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <FolderOpen size={20} /> Ihre Projekte
            </h2>
            <label className="cursor-pointer text-sm text-blue-600 hover:underline flex items-center gap-1">
                <Upload size={14}/> Projekt importieren (.dbsp)
                <input type="file" ref={fileInputRef} accept=".dbsp" className="hidden" onChange={handleImport} />
            </label>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {projects.length === 0 ? (
                <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                    <FolderOpen size={48} className="mx-auto mb-2 opacity-20" />
                    <p>Keine Projekte gefunden.</p>
                    <p className="text-sm">Erstellen Sie rechts ein neues Projekt.</p>
                </div>
            ) : (
                projects.map(p => (
                    <div 
                        key={p.id} 
                        onClick={() => onSelectProject(p)}
                        className="group relative p-4 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-slate-50 hover:bg-white"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600">{p.name}</h3>
                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                                    <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono">{p.data.backendConfig.dbType}</span>
                                    <span className="flex items-center gap-1"><Clock size={10}/> {new Date(p.lastModified).toLocaleDateString()} {new Date(p.lastModified).toLocaleTimeString()}</span>
                                    <span>{p.data.tables.length} Tabellen</span>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => handleDelete(e, p.id)}
                                className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Projekt löschen"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Right Panel: Create New */}
      <div className="w-1/2 p-10 bg-slate-50 flex flex-col justify-center items-center relative overflow-y-auto">
         {/* Background Decor */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="absolute top-10 right-10 opacity-5"><Database size={300} /></div>
         </div>

         <div className="max-w-md w-full z-10">
             <div className="mb-8 text-center">
                 <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                     <Plus size={32} />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-800">Neues Projekt starten</h2>
                 <p className="text-slate-500">Wählen Sie einen Datenbank-Typ für Ihr neues Projekt.</p>
             </div>

             <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                 <div className="space-y-4">
                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-1">Projektname</label>
                         <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="MeinSuperProjekt"
                            value={newProjectName}
                            onChange={e => setNewProjectName(e.target.value)}
                            autoFocus
                         />
                     </div>

                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-3">Datenbank Technologie</label>
                         <div className="grid grid-cols-2 gap-3">
                             {[
                                 { id: DbType.SQL, label: 'SQL Server', desc: 'Enterprise Standard' },
                                 { id: DbType.MySQL, label: 'MySQL', desc: 'Web Popular' },
                                 { id: DbType.SQLite, label: 'SQLite', desc: 'Local / File' },
                                 { id: DbType.NoSQL, label: 'NoSQL', desc: 'Flexible Schema' },
                             ].map((type) => (
                                 <div 
                                    key={type.id}
                                    onClick={() => setNewProjectType(type.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${newProjectType === type.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}
                                 >
                                     <div className="font-bold text-sm text-slate-800">{type.label}</div>
                                     <div className="text-xs text-slate-500">{type.desc}</div>
                                 </div>
                             ))}
                         </div>
                     </div>

                     <button 
                        onClick={handleCreate}
                        disabled={!newProjectName.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                         Leeres Projekt erstellen
                     </button>
                 </div>
                 
                 <div className="mt-6 pt-6 border-t border-slate-100">
                    <button 
                        onClick={handleCreateDemo}
                        className="w-full group flex items-center justify-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-slate-600 hover:text-slate-800"
                    >
                        <div className="bg-white p-2 rounded-full shadow-sm text-orange-500 group-hover:text-orange-600">
                            <Laptop size={18} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-sm">Demo starten: IT-Verleih</div>
                            <div className="text-[10px] text-slate-400">Beispiel mit Mitarbeitern & Geräten</div>
                        </div>
                        <PlayCircle size={16} className="ml-auto opacity-0 group-hover:opacity-50" />
                    </button>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};
