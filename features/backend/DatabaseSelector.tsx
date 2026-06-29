
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Database, Plus, Upload, FolderOpen, Clock, Trash2, Shield, Code, Briefcase, Package, Layout, Monitor, PlayCircle, Smartphone, Users, Cloud, HardDrive, Wifi, RefreshCw } from 'lucide-react';
import { DbType, Project, BackendLanguage, AuthConfig, BackendConfig, ProjectData } from '../../types/index';
import { getAllProjects, deleteProjectFromStorage, saveProjectToStorage } from '../../services/storageService';
import { cloudService } from '../../services/cloudService';
import { getTemplates } from '../../data/templates/index';
import { LanguageSelector } from '../../components/LanguageSelector';
import { useTranslation } from 'react-i18next';

interface ProjectSelectionViewProps {
  onSelectProject: (project: Project) => void;
  onCreateNew: (type: DbType, name: string, config?: BackendConfig, initialData?: Partial<ProjectData>) => void;
}

export const DatabaseSelector: React.FC<ProjectSelectionViewProps> = ({ onSelectProject, onCreateNew }) => {
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [cloudProjects, setCloudProjects] = useState<Project[]>([]);
  const [activeSource, setActiveSource] = useState<'local' | 'cloud'>('local');
  const [activeTab, setActiveTab] = useState<'create' | 'templates'>('create');
  const [loading, setLoading] = useState(false);
  
  const { t, i18n } = useTranslation();
  const templates = useMemo(() => getTemplates(i18n.language), [i18n.language]);

  // New Project Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [newDbType, setNewDbType] = useState<DbType>(DbType.SQL);
  const [newLanguage, setNewLanguage] = useState<BackendLanguage>('dotnet');
  
  // Dialog State (to avoid native confirm/alert)
  const [dialog, setDialog] = useState<{ 
      isOpen: boolean; 
      type: 'confirm' | 'alert'; 
      title: string; 
      message: string; 
      onConfirm?: () => void; 
  } | null>(null);

  // Auth Config
  const [authConfig, setAuthConfig] = useState<AuthConfig>({
      useWindowsAuth: false,
      useAdGroups: false,
      adGroups: '',
      useUserLogin: false,
      isMobileReady: false,
      devBypass: true
  });
  
  const [useMultiTenancy, setUseMultiTenancy] = useState(false);
  const [tenantField, setTenantField] = useState('ClubId');
  
  const [ssoProviders, setSsoProviders] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
        const local = await getAllProjects();
        setLocalProjects(local);
        
        // Simulate fetching cloud projects
        const cloud = await cloudService.getProjects();
        setCloudProjects(cloud);
    } finally {
        setLoading(false);
    }
  };

  const closeDialog = () => setDialog(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDialog({
        isOpen: true,
        type: 'confirm',
        title: 'Projekt löschen',
        message: t('start.msg_delete'),
        onConfirm: async () => {
            await deleteProjectFromStorage(id);
            loadProjects();
            closeDialog();
        }
    });
  };

  const handleCreate = () => {
    if (newProjectName.trim()) {
      // Auto-Prepare AD Mapping from simple string list if provided
      let finalAuthConfig = { ...authConfig };
      if (authConfig.useWindowsAuth && authConfig.useAdGroups && authConfig.adGroups) {
          const groups = authConfig.adGroups.split(',').map(g => g.trim()).filter(g => g);
          finalAuthConfig.adMapping = groups.map(g => ({ groupName: g, roleName: 'User' }));
      }

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
          authConfig: finalAuthConfig,
          multiTenancy: useMultiTenancy ? { enabled: true, strategy: 'discriminator', tenantField } : undefined,
          integrations: ssoProviders.length > 0 ? {
              sso: ssoProviders.map(p => ({ provider: p as 'google' | 'microsoft' | 'apple' | 'github', clientId: '' })),
              storage: { provider: 'local' },
              webhooks: []
          } : undefined
      };
      onCreateNew(newDbType, newProjectName, config);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
      const tmpl = templates.find(t => t.id === templateId);
      if (tmpl) {
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

        const finalizeImport = async (p: Project) => {
            p.lastModified = Date.now();
            await saveProjectToStorage(p);
            await loadProjects();
            setDialog({
                isOpen: true,
                type: 'alert',
                title: 'Import',
                message: t('start.msg_import_success')
            });
        };

        const existing = localProjects.find(p => p.id === project.id);
        if (existing) {
             setDialog({
                isOpen: true,
                type: 'confirm',
                title: 'Projekt existiert',
                message: t('start.msg_overwrite', { name: project.name }),
                onConfirm: async () => {
                    await finalizeImport(project);
                    closeDialog();
                }
             });
        } else {
            await finalizeImport(project);
        }

      } catch (err) {
        setDialog({
            isOpen: true,
            type: 'alert',
            title: 'Fehler',
            message: `${t('start.msg_import_error')}: ${err}`
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const projects = activeSource === 'local' ? localProjects : cloudProjects;

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden relative">
      
      {/* Language Selector Top Right */}
      <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
      </div>

      {/* Left Panel: Recent / Open */}
      <div className="w-5/12 p-8 flex flex-col border-r border-slate-200 bg-white">
        <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Database className="text-blue-600" /> {t('app.name')}
        </h1>
        <p className="text-slate-500 mb-6 text-sm">{t('app.description')}</p>

        {/* Source Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-6 self-start">
            <button 
                onClick={() => setActiveSource('local')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeSource === 'local' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <HardDrive size={16}/> Lokal
            </button>
            <button 
                onClick={() => setActiveSource('cloud')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeSource === 'cloud' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Cloud size={16}/> Team Cloud
            </button>
        </div>

        <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                <FolderOpen size={16} /> {activeSource === 'local' ? 'Lokale Projekte' : 'Team Projekte'}
                <button onClick={loadProjects} className="ml-2 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500 transition-colors" title="Liste aktualisieren">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
            </h2>
            <label className="cursor-pointer text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Upload size={12}/> {t('start.import')}
                <input type="file" ref={fileInputRef} accept=".dbsp" className="hidden" onChange={handleImport} />
            </label>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {projects.length === 0 ? (
                <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                    <FolderOpen size={48} className="mx-auto mb-2 opacity-20" />
                    <p>{t('start.no_projects')}</p>
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
                                <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 flex items-center gap-2">
                                    {p.name}
                                    {p.isCloud && <Cloud size={12} className="text-blue-400" />}
                                </h3>
                                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-3">
                                    <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">{p.data.backendConfig.dbType} / {p.data.backendConfig.language}</span>
                                    <span className="flex items-center gap-1"><Clock size={10}/> {new Date(p.lastModified).toLocaleDateString()}</span>
                                    {p.owner && <span className="flex items-center gap-1 text-blue-500"><Users size={10}/> {p.owner}</span>}
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
                     {t('start.empty_project')}
                 </button>
                 <button 
                    onClick={() => setActiveTab('templates')}
                    className={`pb-2 px-4 font-bold text-sm ${activeTab === 'templates' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                     {t('start.templates')}
                 </button>
             </div>

             {activeTab === 'create' ? (
                 <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                     <div className="text-center mb-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-2">
                            <Plus size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">{t('start.title')}</h2>
                     </div>

                     {/* 1. Basic Info */}
                     <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('start.project_name')}</label>
                         <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                            placeholder="MyProject"
                            value={newProjectName}
                            onChange={e => setNewProjectName(e.target.value)}
                            autoFocus
                         />
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                         {/* 2. Database */}
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Database size={12}/> {t('start.database')}</label>
                             <div className="space-y-2">
                                 {[
                                     { id: DbType.SQL, label: 'SQL Server' },
                                     { id: DbType.MySQL, label: 'MySQL' },
                                     { id: DbType.SQLite, label: 'SQLite (Lokal)' },
                                     { id: DbType.NoSQL, label: 'NoSQL (Mongo)' },
                                 ].map((type) => (
                                     <div 
                                        key={type.id}
                                        onClick={() => setNewDbType(type.id)}
                                        className={`p-2 rounded border cursor-pointer transition-all text-sm flex justify-between items-center ${newDbType === type.id ? 'border-blue-500 bg-blue-50 text-blue-800 font-semibold shadow-inner' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                                     >
                                         {type.label}
                                         {newDbType === type.id && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                     </div>
                                 ))}
                             </div>
                         </div>

                         {/* 3. Backend */}
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Code size={12}/> {t('start.backend')}</label>
                             <div className="space-y-2">
                                 {[
                                     { id: 'dotnet', label: '.NET (C#)' },
                                     { id: 'nodejs', label: 'Node.js' },
                                     { id: 'python', label: 'Python (FastAPI)' },
                                     { id: 'php', label: 'PHP' },
                                     { id: 'laravel', label: 'Laravel' },
                                 ].map((lang) => (
                                     <div 
                                        key={lang.id}
                                        onClick={() => setNewLanguage(lang.id as BackendLanguage)}
                                        className={`p-2 rounded border cursor-pointer transition-all text-sm flex justify-between items-center ${newLanguage === lang.id ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-semibold shadow-inner' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
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
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1"><Shield size={12}/> {t('start.security')}</label>
                         
                         <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-sm space-y-3">
                            {newLanguage === 'dotnet' && (
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={authConfig.useWindowsAuth} 
                                            onChange={e => setAuthConfig({...authConfig, useWindowsAuth: e.target.checked, useAdGroups: false})}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>{t('start.auth_windows')}</span>
                                    </label>
                                    
                                    {authConfig.useWindowsAuth && (
                                        <div className="ml-6 pl-3 border-l-2 border-slate-200 space-y-2 animate-in slide-in-from-top-1">
                                            <p className="text-[10px] text-slate-500 mb-2">{t('start.auth_domain_hint')}</p>
                                            
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={authConfig.useAdGroups} 
                                                    onChange={e => setAuthConfig({...authConfig, useAdGroups: e.target.checked})}
                                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="flex items-center gap-1 text-xs">
                                                    <Users size={12}/> Zugriff auf AD-Gruppe beschränken
                                                </span>
                                            </label>

                                            {authConfig.useAdGroups && (
                                                <div className="animate-in fade-in">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Erlaubte AD-Gruppe(n)</label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full border border-slate-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                                        placeholder="z.B. DOMAIN\Gruppe, DOMAIN\Admins"
                                                        value={authConfig.adGroups || ''}
                                                        onChange={e => setAuthConfig({...authConfig, adGroups: e.target.value})}
                                                    />
                                                    <p className="text-[10px] text-slate-400 mt-0.5">Kommagetrennt. Mappt diese Gruppen standardmäßig auf 'User'.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={authConfig.useUserLogin} 
                                        onChange={e => setAuthConfig({...authConfig, useUserLogin: e.target.checked})}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>{t('start.auth_user')}</span>
                                </label>
                                {authConfig.useUserLogin && (
                                    <div className="ml-5 mt-2 space-y-2 animate-in slide-in-from-top-1">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={authConfig.isMobileReady} 
                                                onChange={e => setAuthConfig({...authConfig, isMobileReady: e.target.checked})}
                                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="flex items-center gap-1"><Smartphone size={12}/> {t('start.auth_mobile')}</span>
                                        </label>
                                        
                                        <div className="pt-2">
                                            <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Single Sign-On (SSO)</span>
                                            <div className="flex flex-wrap gap-2">
                                                {['google', 'microsoft', 'apple', 'github'].map(provider => (
                                                    <label key={provider} className="flex items-center gap-1.5 cursor-pointer text-xs border border-slate-200 rounded px-2 py-1 hover:bg-slate-100 transition-colors">
                                                        <input 
                                                            type="checkbox"
                                                            checked={ssoProviders.includes(provider)}
                                                            onChange={e => {
                                                                if (e.target.checked) setSsoProviders([...ssoProviders, provider]);
                                                                else setSsoProviders(ssoProviders.filter(p => p !== provider));
                                                            }}
                                                            className="rounded text-indigo-600"
                                                        />
                                                        <span className="capitalize">{provider}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                         </div>
                     </div>

                     <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4 mb-4">
                         <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Users size={16} className="text-blue-600" />
                            Mandantenfähigkeit / SaaS (optional)
                         </h3>
                         <div className="space-y-3 text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={useMultiTenancy} 
                                    onChange={e => setUseMultiTenancy(e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>Multi-Tenancy aktivieren (z.B. für Vereins-CMS, SaaS)</span>
                            </label>
                            
                            {useMultiTenancy && (
                                <div className="ml-5 mt-2 animate-in slide-in-from-top-1">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Name des Identifier-Feldes (z.B. ClubId, TenantId)</label>
                                    <input 
                                        type="text" 
                                        className="w-full max-w-[200px] border border-slate-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                        value={tenantField}
                                        onChange={e => setTenantField(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-0.5">Wird automatisch in die Nutzer-Tabelle integriert.</p>
                                </div>
                            )}
                         </div>
                     </div>

                     <button 
                        onClick={handleCreate}
                        disabled={!newProjectName.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                     >
                         {t('start.create_btn')}
                     </button>
                 </div>
             ) : (
                 <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                     <p className="text-center text-slate-500 text-sm mb-4">{t('start.start_schema')}</p>
                     
                     <div className="grid grid-cols-1 gap-4">
                         {templates.map(tmpl => {
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

      {/* Local Dialog for Confirm/Alert */}
      {dialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in-25 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-lg shadow-2xl border border-slate-300 max-w-sm w-full mx-4">
                  <h3 className="font-bold text-lg mb-2 text-slate-800">{dialog.title}</h3>
                  <p className="mb-6 text-slate-600 text-sm">{dialog.message}</p>
                  <div className="flex justify-end gap-2">
                      {dialog.type === 'confirm' && (
                        <button onClick={closeDialog} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-sm">Abbrechen</button>
                      )}
                      <button 
                        onClick={() => { if(dialog.onConfirm) dialog.onConfirm(); else closeDialog(); }} 
                        className={`px-4 py-2 text-white rounded font-bold text-sm shadow-sm ${dialog.type === 'confirm' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                          {dialog.type === 'confirm' ? 'Ja, fortfahren' : 'OK'}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
