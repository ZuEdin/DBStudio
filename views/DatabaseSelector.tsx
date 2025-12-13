
import React, { useState, useEffect, useRef } from 'react';
import { Database, Plus, Upload, FolderOpen, Clock, Trash2, Laptop, PlayCircle, Shield, Code, Settings, Briefcase, Package, Layout, Monitor } from 'lucide-react';
import { DbType, Project, BackendLanguage, AuthConfig, BackendConfig, ProjectData } from '../types/index';
import { getAllProjects, deleteProjectFromStorage, saveProjectToStorage } from '../services/storageService';
import { TEMPLATES } from '../data/templates/index';

interface ProjectSelectionViewProps {
  onSelectProject: (project: Project) => void;
  onCreateNew: (type: DbType, name: string, config?: BackendConfig, initialData?: Partial<ProjectData>) => void;
}

export const DatabaseSelector: React.FC<ProjectSelectionViewProps> = ({ onSelectProject, onCreateNew }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'templates'>('create');
  
  // New Project Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [newDbType, setNewDbType] = useState<DbType>(DbType.SQL);
  const [newLanguage, setNewLanguage] = useState<BackendLanguage>('dotnet');
  
  // Auth Config
  const [authConfig, setAuthConfig] = useState<AuthConfig>({
      useWindowsAuth: false,
      useAdGroups: false,
      adGroups: '',
      useUserLogin: false,
      devBypass: true
  });

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
      const config: BackendConfig = {
          language: newLanguage,
          backendVersion: newLanguage === 'dotnet' ? '9.0' : undefined,
          dbType: newDbType,
          projectName: newProjectName.replace(/\s+/g, '') || 'MyProject',
          port: 5000,
          dbConnection: newDbType === DbType.SQLite ? 'Data Source=app.db' 
                        : newDbType === DbType.MySQL ? 'Server=localhost;Database=mydb;User=root;Password=password;'
                        : 'Server=.;Database=MyDb;Trusted_Connection=True;TrustServerCertificate=True;',
          useSwagger: true,
          frontendFramework: 'react',
          authConfig: authConfig
      };
      onCreateNew(newDbType, newProjectName, config);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
      const tmpl = TEMPLATES.find(t => t.id === templateId);
      if (tmpl) {
          // Use template config but allow override of name if needed later (currently auto-named)
          // We set isDemo=true implicitly by passing data
          const config = tmpl.data.backendConfig!;
          onCreateNew(config.dbType, tmpl.name, config, tmpl.data);
      }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const project = JSON.parse(json) as Project;
        
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
      <div className="w-5/12 p-8 flex flex-col border-r border-slate-200 bg-white">
        <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Database className="text-blue-600" /> DB Studio Pro
        </h1>
        <p className="text-slate-500 mb-6 text-sm">Professionelles Datenbank-Design & Prototyping.</p>

        <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                <FolderOpen size={16} /> Ihre Projekte
            </h2>
            <label className="cursor-pointer text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Upload size={12}/> Importieren (.dbsp)
                <input type="file" ref={fileInputRef} accept=".dbsp" className="hidden" onChange={handleImport} />
            </label>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {projects.length === 0 ? (
                <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                    <FolderOpen size={48} className="mx-auto mb-2 opacity-20" />
                    <p>Keine Projekte gefunden.</p>
                    <p className="text-xs">Erstellen Sie rechts ein neues Projekt.</p>
                </div>
            ) : (
                projects.map(p => (
                    <div 
                        key={p.id} 
                        onClick={() => onSelectProject(p)}
                        className="group relative p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-slate-50 hover:bg-white"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600">{p.name}</h3>
                                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-3">
                                    <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">{p.data.backendConfig.dbType} / {p.data.backendConfig.language}</span>
                                    <span className="flex items-center gap-1"><Clock size={10}/> {new Date(p.lastModified).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => handleDelete(e, p.id)}
                                className="text-slate-300 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Projekt löschen"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Right Panel: Create New */}
      <div className="w-7/12 p-8 bg-slate-50 flex flex-col items-center relative overflow-y-auto">
         <div className="max-w-xl w-full z-10">
             
             {/* Tabs */}
             <div className="flex gap-4 mb-6 justify-center">
                 <button 
                    onClick={() => setActiveTab('create')}
                    className={`pb-2 px-4 font-bold text-sm ${activeTab === 'create' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                     Leeres Projekt
                 </button>
                 <button 
                    onClick={() => setActiveTab('templates')}
                    className={`pb-2 px-4 font-bold text-sm ${activeTab === 'templates' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                     Beispiele & Vorlagen
                 </button>
             </div>

             {activeTab === 'create' ? (
                 <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                     <div className="text-center mb-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-2">
                            <Plus size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Neues Projekt starten</h2>
                     </div>

                     {/* 1. Basic Info */}
                     <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Projektname</label>
                         <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                            placeholder="MeinSuperProjekt"
                            value={newProjectName}
                            onChange={e => setNewProjectName(e.target.value)}
                            autoFocus
                         />
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                         {/* 2. Database */}
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Database size={12}/> Datenbank</label>
                             <div className="space-y-2">
                                 {[
                                     { id: DbType.SQL, label: 'SQL Server' },
                                     { id: DbType.MySQL, label: 'MySQL' },
                                     { id: DbType.SQLite, label: 'SQLite' },
                                     { id: DbType.NoSQL, label: 'NoSQL (Mongo)' },
                                 ].map((type) => (
                                     <div 
                                        key={type.id}
                                        onClick={() => setNewDbType(type.id)}
                                        className={`p-2 rounded border cursor-pointer transition-all text-sm flex justify-between items-center ${newDbType === type.id ? 'border-blue-500 bg-blue-50 text-blue-800 font-semibold' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                                     >
                                         {type.label}
                                         {newDbType === type.id && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                     </div>
                                 ))}
                             </div>
                         </div>

                         {/* 3. Backend */}
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Code size={12}/> Backend Technologie</label>
                             <div className="space-y-2">
                                 {[
                                     { id: 'dotnet', label: '.NET (C#)' },
                                     { id: 'nodejs', label: 'Node.js' },
                                     { id: 'php', label: 'PHP' },
                                     { id: 'laravel', label: 'Laravel' },
                                 ].map((lang) => (
                                     <div 
                                        key={lang.id}
                                        onClick={() => setNewLanguage(lang.id as BackendLanguage)}
                                        className={`p-2 rounded border cursor-pointer transition-all text-sm flex justify-between items-center ${newLanguage === lang.id ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-semibold' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                                     >
                                         {lang.label}
                                         {newLanguage === lang.id && <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>}
                                     </div>
                                 ))}
                             </div>
                         </div>
                     </div>

                     {/* 4. Security / Auth */}
                     <div className="border-t border-slate-100 pt-4">
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1"><Shield size={12}/> Sicherheit & Login</label>
                         
                         <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-sm space-y-3">
                            {newLanguage === 'dotnet' && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={authConfig.useWindowsAuth} 
                                        onChange={e => setAuthConfig({...authConfig, useWindowsAuth: e.target.checked})}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>Windows Authentifizierung (Domain)</span>
                                </label>
                            )}

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={authConfig.useUserLogin} 
                                    onChange={e => setAuthConfig({...authConfig, useUserLogin: e.target.checked})}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>Benutzer-Login (Tabelle 'Users')</span>
                            </label>
                         </div>
                     </div>

                     <button 
                        onClick={handleCreate}
                        disabled={!newProjectName.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                     >
                         Projekt erstellen
                     </button>
                 </div>
             ) : (
                 <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                     <p className="text-center text-slate-500 text-sm mb-4">Starten Sie mit einem vollständigen Datenschema.</p>
                     
                     <div className="grid grid-cols-1 gap-4">
                         {TEMPLATES.map(tmpl => {
                             const Icon = tmpl.icon === 'Briefcase' ? Briefcase : tmpl.icon === 'Package' ? Package : tmpl.icon === 'Kanban' ? Layout : tmpl.icon === 'Monitor' ? Monitor : Database;
                             return (
                                 <div 
                                    key={tmpl.id}
                                    onClick={() => handleTemplateSelect(tmpl.id)}
                                    className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex gap-4 items-start"
                                 >
                                     <div className={`p-3 rounded-lg ${tmpl.category === 'Business' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                         <Icon size={24} />
                                     </div>
                                     <div className="flex-1">
                                         <h3 className="font-bold text-slate-800">{tmpl.name}</h3>
                                         <p className="text-xs text-slate-500 mt-1">{tmpl.description}</p>
                                         <div className="mt-2 flex gap-2">
                                             <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200">{tmpl.data.backendConfig?.language}</span>
                                             <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200">{tmpl.data.backendConfig?.dbType}</span>
                                         </div>
                                     </div>
                                     <div className="self-center">
                                         <PlayCircle size={20} className="text-slate-300 group-hover:text-blue-500" />
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};
