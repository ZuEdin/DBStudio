
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Database, Plus, Upload, FolderOpen, Clock, Trash2, Shield, Code, Briefcase, Package, Layout, Monitor, PlayCircle, Smartphone, Users, Cloud, HardDrive, Wifi, RefreshCw, Copy, Edit2 } from 'lucide-react';
import { DbType, Project, BackendLanguage, AuthConfig, BackendConfig, ProjectData } from '../../types/index';
import { getAllProjects, deleteProjectFromStorage, saveProjectToStorage, getProjectById } from '../../services/storageService';
import { cloudService } from '../../services/cloudService';
import { getTemplates } from '../../data/templates/index';
import { LanguageSelector } from '../../components/LanguageSelector';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/useAuthStore';
import { getApiUrl } from '../../stores/useConfigStore';

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
  const { user, whoamiData, login, register } = useAuthStore();
  const templates = useMemo(() => getTemplates(i18n.language), [i18n.language]);

  // Backend & AD/LDAP configuration auto-detection state
  const [backendDetected, setBackendDetected] = useState<boolean>(false);
  const [isAdConfigured, setIsAdConfigured] = useState<boolean>(false);
  const [adServerAddress, setAdServerAddress] = useState<string>('');

  // Login form states
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // New Project Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [newDbType, setNewDbType] = useState<DbType>(DbType.SQL);
  const [newLanguage, setNewLanguage] = useState<BackendLanguage>('dotnet');
  const [newProjectType, setNewProjectType] = useState<'cloud' | 'local'>('cloud');
  
  // Dialog State (to avoid native confirm/alert)
  const [dialog, setDialog] = useState<{ 
      isOpen: boolean; 
      type: 'confirm' | 'alert'; 
      title: string; 
      message: string; 
      onConfirm?: () => void; 
  } | null>(null);

  const [copyingProject, setCopyingProject] = useState<Project | null>(null);
  const [renamingProject, setRenamingProject] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState('');

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

  // Manage Project Members State
  const [managingMembersProject, setManagingMembersProject] = useState<Project | null>(null);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [adUsers, setAdUsers] = useState<any[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [addingMemberRole, setAddingMemberRole] = useState('Entwickler');

  const filteredAdUsers = useMemo(() => {
    if (!memberSearchQuery) return adUsers;
    return adUsers.filter(u => 
      u.displayName?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(memberSearchQuery.toLowerCase())
    );
  }, [memberSearchQuery, adUsers]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-detect live backend on mount
    const detectBackend = async () => {
      try {
        const res = await fetch(getApiUrl('/api/health'), { credentials: 'include' });
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          setBackendDetected(true);
          // Auto-configure Team-Cloud mode
          setActiveSource('cloud');
          
          // Get AD status from backend
          const ldapRes = await fetch(getApiUrl('/api/auth/ldap-check'), { credentials: 'include' });
          if (ldapRes.ok && ldapRes.headers.get('content-type')?.includes('application/json')) {
            const ldapData = await ldapRes.json();
            const adActive = Boolean(ldapData.isAdConfigured);
            setIsAdConfigured(adActive);
            if (ldapData.serverAddress) setAdServerAddress(ldapData.serverAddress);
          }
          await useAuthStore.getState().checkAdSession();
        }
      } catch (err) {
        console.warn('Backend auto-detection failed:', err);
      }
    };
    
    detectBackend();
    loadProjects();
  }, []);

  const handleLoginSubmit = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Bitte füllen Sie alle Felder aus.');
      return;
    }
    setLoginSubmitting(true);
    setLoginError('');
    try {
      if (isRegistering) {
        const success = await register(loginEmail, loginPassword, loginName);
        if (success) {
          await login(loginEmail, loginPassword);
          await loadProjects();
        } else {
          setLoginError('Registrierung fehlgeschlagen. Möglicherweise existiert der Benutzer bereits.');
        }
      } else {
        const success = await login(loginEmail, loginPassword);
        if (success) {
          // Logged in! Switch projects to cloud and reload
          await loadProjects();
        } else {
          setLoginError('Ungültige Anmeldedaten. Wenn Sie kein Domänenkonto haben, registrieren Sie sich bitte.');
        }
      }
    } catch (err) {
      setLoginError('Ein Fehler ist aufgetreten.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
        const allProjects = await getAllProjects();
        const local = allProjects.filter(p => !p.isCloud);
        const cloudFromLocal = allProjects.filter(p => p.isCloud);

        // Fetch cloud projects from server
        const cloudRemote = await cloudService.getProjects();

        const cloudMap = new Map<string, Project>();
        cloudFromLocal.forEach(p => cloudMap.set(p.id, p));
        // Server takes priority for cloud projects
        if (cloudRemote && cloudRemote.length > 0) {
            cloudMap.clear();
            cloudRemote.forEach(p => cloudMap.set(p.id, p));
        }

        setLocalProjects(local);
        setCloudProjects(Array.from(cloudMap.values()));
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

  const handleCopyClick = (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    setCopyingProject(p);
    setRenameValue(`${p.name} - Kopie`);
  };

  const handleRenameClick = (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    setRenamingProject(p);
    setRenameValue(p.name);
  };

  const handleManageMembers = async (p: Project) => {
    setManagingMembersProject(p);
    setMemberSearchQuery('');
    setProjectMembers((p as any).teamMembers || []);
    setAdUsers([]);
    
    try {
      const adResponse = await fetch(getApiUrl('/api/ad/users'), { credentials: 'include' });
      if (adResponse.ok) {
        const adData = await adResponse.json();
        setAdUsers(adData || []);
      }
    } catch (err) {
      console.error('Fehler beim Laden der AD-Benutzer:', err);
    }
  };

  const addProjectMember = async (adUser: any) => {
    if (!managingMembersProject) return;
    try {
      const response = await fetch(getApiUrl(`/api/team/projects/${managingMembersProject.id}/members`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'user'
        },
        body: JSON.stringify({
          userId: adUser.username,
          name: adUser.displayName || adUser.username,
          email: adUser.email,
          role: addingMemberRole
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.project) {
          setProjectMembers(data.project.teamMembers || []);
          setCloudProjects(cloudProjects.map(item => item.id === data.project.id ? data.project : item));
        } else {
          setDialog({
            isOpen: true,
            type: 'alert',
            title: 'Fehler beim Hinzufügen',
            message: data.error || 'Mitglied konnte nicht hinzugefügt werden.'
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setDialog({
          isOpen: true,
          type: 'alert',
          title: 'Fehler beim Hinzufügen',
          message: errorData.error || 'Der Server hat den Zugriff verweigert.'
        });
      }
    } catch (err) {
      console.error('Fehler beim Hinzufügen des Mitglieds:', err);
    }
  };

  const removeProjectMember = async (memberId: string) => {
    if (!managingMembersProject) return;
    try {
      const response = await fetch(getApiUrl(`/api/team/projects/${managingMembersProject.id}/members/${memberId}`), {
        method: 'DELETE',
        headers: {
          'x-user-role': user?.role || 'user'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.project) {
          setProjectMembers(data.project.teamMembers || []);
          setCloudProjects(cloudProjects.map(item => item.id === data.project.id ? data.project : item));
        } else {
          setDialog({
            isOpen: true,
            type: 'alert',
            title: 'Fehler beim Entfernen',
            message: data.error || 'Mitglied konnte nicht entfernt werden.'
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setDialog({
          isOpen: true,
          type: 'alert',
          title: 'Fehler beim Entfernen',
          message: errorData.error || 'Der Server hat den Zugriff verweigert.'
        });
      }
    } catch (err) {
      console.error('Fehler beim Entfernen des Mitglieds:', err);
    }
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
          backendVersion: newLanguage === 'dotnet' ? '10.0' : undefined,
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
      const isCloud = newProjectType === 'cloud';
      const ownerName = user?.displayName || user?.name || whoamiData?.displayName || whoamiData?.username || user?.email || 'Administrator';
      const rawEmail = user?.email || whoamiData?.email;
      const ownerEmail = (rawEmail && rawEmail.includes('@') && rawEmail.includes('.'))
        ? rawEmail
        : `${ownerName.toLowerCase().replace(/[^a-z0-9.]/g, '')}@firma.de`;

      if (isCloud) {
        setActiveSource('cloud');
        cloudService.createProject({
          id: crypto.randomUUID(),
          name: newProjectName,
          lastModified: Date.now(),
          isCloud: true,
          owner: ownerName,
          ownerEmail: ownerEmail,
          data: {
            tables: [], queries: [], reports: [], forms: [], relationships: [], layout: [], tableGroups: [],
            backendConfig: config
          }
        } as any);
      }
      onCreateNew(newDbType, newProjectName, config, { isCloud, owner: ownerName });
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

        {/* Auto-Configuration Notification */}
        {backendDetected && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs rounded-lg p-3 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                <span className="flex h-2 w-2 relative mt-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <div className="flex-1">
                    <p className="font-bold text-[11px] uppercase tracking-wider text-emerald-800">Live-Backend Erkannt</p>
                    <p className="text-slate-600 mt-0.5 leading-normal">
                        DB Studio Pro hat automatisch ein aktives Backend erkannt, den **Team-Cloud-Modus** aktiviert und die API-Verbindung selbstständig eingerichtet.
                    </p>
                </div>
            </div>
        )}

        {/* WhoAmI API Startup Status Display Card */}
        {(whoamiData || user) && (
            <div className="mb-4 bg-slate-900 text-slate-100 rounded-xl p-3.5 border border-slate-700 shadow-sm animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
                    <div className="flex items-center gap-2">
                        <Shield size={16} className="text-blue-400" />
                        <span className="font-bold text-xs tracking-wide text-slate-200">WhoAmI Startup Status</span>
                    </div>
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded border border-blue-400/30">
                        GET /api/ad/whoami
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-2.5">
                    <div className="bg-slate-800/80 p-2 rounded border border-slate-700/60">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">DisplayName / Name</div>
                        <div className="font-extrabold text-blue-300 text-xs truncate mt-0.5">
                            {whoamiData?.displayName || whoamiData?.username || user?.displayName || user?.name || 'Zubeyr'}
                        </div>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded border border-slate-700/60">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Benutzer-ID</div>
                        <div className="font-mono text-slate-300 text-[11px] truncate mt-0.5">
                            {whoamiData?.userId || user?.id || 'usr_001'}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">User Rollen</div>
                        <div className="flex flex-wrap gap-1">
                            {(whoamiData?.roles || user?.roles || [user?.role || 'User']).map((role: string, i: number) => (
                                <span key={i} className="text-[9px] font-bold bg-blue-600/30 text-blue-200 border border-blue-500/40 px-2 py-0.5 rounded">
                                    {role}
                                </span>
                            ))}
                        </div>
                    </div>

                    {(whoamiData?.userLevels || user?.userLevels) && (
                        <div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">User Levels / Berechtigungen</div>
                            <div className="flex flex-wrap gap-1">
                                {(whoamiData?.userLevels || user?.userLevels || []).map((lvl: string, i: number) => (
                                    <span key={i} className="text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                                        {lvl}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* User Session Info / Logout */}
        {user?.isAuthenticated && (
            <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between text-xs text-slate-700 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-extrabold uppercase text-xs border border-blue-200 shadow-sm">
                        {(user.displayName || user.name || 'U')[0]}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-800">{user.displayName || user.name}</p>
                            {user.isAdUser && (
                                <span className="text-[8px] bg-blue-100 text-blue-700 font-extrabold px-1 rounded border border-blue-200">AD</span>
                            )}
                        </div>
                        {user.email && <p className="text-[10px] text-slate-500 mb-0.5 leading-tight">{user.email}</p>}
                        <p className="text-[9px] text-slate-400 leading-none font-mono capitalize bg-slate-200/40 px-1.5 py-0.5 rounded inline-block">
                            {user.role}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        useAuthStore.getState().logout();
                        setActiveSource('local');
                    }}
                    className="text-red-500 hover:text-red-700 font-bold hover:underline transition-all"
                >
                    Abmelden
                </button>
            </div>
        )}

        {/* Source Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-6 self-start">
            <button 
                onClick={() => setActiveSource('local')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeSource === 'local' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <HardDrive size={16}/> Lokal
            </button>
            {(user?.isAuthenticated || backendDetected) && (
                <button 
                    onClick={() => setActiveSource('cloud')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeSource === 'cloud' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Cloud size={16}/> Team Cloud
                    {!user?.isAuthenticated && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    )}
                </button>
            )}
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
            {activeSource === 'cloud' && user?.isAuthenticated && user?.isAdUser && (
                <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 text-xs flex items-center justify-between text-blue-800 animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
                            <Cloud size={14} />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800">{user.name}</span>
                                <span className="text-[8px] bg-blue-600 text-white font-black px-1.5 py-0.2 rounded shadow-sm">ACTIVE DIRECTORY</span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{user.email}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase">Verbunden</span>
                    </div>
                </div>
            )}
            {activeSource === 'cloud' && !user?.isAuthenticated && !whoamiData?.username ? (
                isAdConfigured ? (
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 animate-in fade-in">
                        <div className="flex items-center gap-2 text-slate-800 border-b border-slate-200/60 pb-2 mb-2">
                            <Shield className="text-blue-600 animate-pulse" size={18} />
                            <h3 className="font-bold text-sm">Windows-Domänencontroller Anmeldung</h3>
                        </div>
                        <div className="bg-blue-50 border border-blue-200/60 rounded-lg p-3 text-xs text-blue-900 space-y-1">
                            <div className="font-bold">Automatisches Login aktiv</div>
                            <p className="text-slate-600 leading-normal">
                                Sie befinden sich im Firmennetzwerk. Die Authentifizierung erfolgt direkt über Ihren **Active Directory Controller**.
                            </p>
                        </div>
                        <button 
                            onClick={() => useAuthStore.getState().checkAdSession()}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-xs transition-colors shadow-sm"
                        >
                            Verbindung erneut prüfen
                        </button>
                    </div>
                ) : (
                    /* Dynamic Interactive Login Form directly on Start Page */
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-2">
                            <div className="flex items-center gap-2 text-slate-800">
                                <Shield className="text-blue-600" size={18} />
                                <h3 className="font-bold text-sm">Team Cloud Anmeldung</h3>
                            </div>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                                LIVE API ONLINE
                            </span>
                        </div>

                        <div className="bg-blue-50 border border-blue-200/60 rounded-lg p-3 text-xs text-blue-900 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold">
                                <Cloud size={14} className="text-blue-600" />
                                Echtes Team-Cloud-Konto
                            </div>
                            <p className="text-slate-600 leading-normal">
                                Melden Sie sich mit Ihrer E-Mail-Adresse an, um als Owner eigene Cloud-Projekte zu erstellen und Ihr Entwickler-Team zusammenzustellen.
                            </p>
                        </div>

                        <div className="space-y-3 pt-1">
                            {isRegistering && (
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Name</label>
                                    <input 
                                        type="text"
                                        className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none font-medium text-slate-800"
                                        placeholder="Ihr Name"
                                        value={loginName}
                                        onChange={e => setLoginName(e.target.value)}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">E-Mail-Adresse</label>
                                <input 
                                    type="email"
                                    className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none font-medium text-slate-800"
                                    placeholder="ihre.email@firma.de"
                                    value={loginEmail}
                                    onChange={e => setLoginEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Passwort</label>
                                <input 
                                    type="password"
                                    className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none font-medium text-slate-800"
                                    placeholder="Ihr Passwort"
                                    value={loginPassword}
                                    onChange={e => setLoginPassword(e.target.value)}
                                />
                            </div>

                            {loginError && (
                                <p className="text-[11px] text-red-500 font-semibold">{loginError}</p>
                            )}

                            <button 
                                onClick={handleLoginSubmit}
                                disabled={loginSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                            >
                                {loginSubmitting ? 'Verarbeitung...' : (isRegistering ? 'Konto erstellen' : 'Anmelden')}
                            </button>

                            <button 
                                onClick={() => setIsRegistering(!isRegistering)}
                                className="w-full text-blue-600 hover:underline text-[11px]"
                            >
                                {isRegistering ? 'Bereits ein Konto? Hier anmelden' : 'Kein Konto? Hier registrieren'}
                            </button>
                        </div>
                    </div>
                )
            ) : projects.length === 0 ? (
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
                                    <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                                        {p.data?.backendConfig?.dbType || 'SQL'} / {p.data?.backendConfig?.language || '.NET 10'}
                                    </span>
                                    <span className="flex items-center gap-1"><Clock size={10}/> {new Date(p.lastModified || Date.now()).toLocaleDateString()}</span>
                                    {p.owner && <span className="flex items-center gap-1 text-blue-500"><Users size={10}/> {p.owner}</span>}
                                </div>
                            </div>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                {p.isCloud && (user?.role === 'admin' || user?.role === 'manager') && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleManageMembers(p);
                                        }}
                                        className="text-slate-400 hover:text-emerald-500 p-1.5 rounded-full hover:bg-emerald-50 transition-colors"
                                        title="Mitglieder verwalten"
                                    >
                                        <Users size={13} />
                                    </button>
                                )}
                                <button 
                                    onClick={(e) => handleRenameClick(e, p)}
                                    className="text-slate-400 hover:text-blue-500 p-1.5 rounded-full hover:bg-blue-50 transition-colors"
                                    title="Projekt umbenennen"
                                >
                                    <Edit2 size={13} />
                                </button>
                                <button 
                                    onClick={(e) => handleCopyClick(e, p)}
                                    className="text-slate-400 hover:text-indigo-500 p-1.5 rounded-full hover:bg-indigo-50 transition-colors"
                                    title="Projekt kopieren"
                                >
                                    <Copy size={13} />
                                </button>
                                <button 
                                    onClick={(e) => handleDelete(e, p.id)}
                                    className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                                    title="Projekt löschen"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Right Panel: Create New */}
      <div className="w-7/12 p-8 bg-slate-50 flex flex-col items-center relative overflow-y-auto">
         <div className="max-w-xl w-full z-10">
             {!( !isAdConfigured || user?.role === 'admin' ) ? (
                  <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200/80 text-center space-y-6 animate-in fade-in">
                      <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm animate-pulse">
                          <Shield size={32} />
                      </div>
                      <div className="space-y-2">
                          <h2 className="text-xl font-extrabold text-slate-800">Projekt-Erstellung gesperrt</h2>
                          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                              Laut Active Directory Richtlinien dürfen **nur Administratoren** neue Projekte (lokal oder Cloud) anlegen.
                          </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 max-w-md mx-auto text-left space-y-2 text-xs text-slate-600">
                          <div className="font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-200/40 pb-1.5">
                              <Users size={14} className="text-blue-500" />
                              Ihre aktuellen AD-Benutzerdetails:
                          </div>
                          <p>• <strong>Name:</strong> {user?.name || 'Gast'}</p>
                          <p>• <strong>E-Mail:</strong> {user?.email || 'Keine E-Mail'}</p>
                          <p>• <strong>Rolle:</strong> <span className="capitalize bg-slate-200/60 px-1.5 py-0.5 rounded text-[10px] font-mono">{user?.role || 'user'}</span></p>
                      </div>
                      <p className="text-xs text-slate-400">
                          Bitte kontaktieren Sie Ihren IT-Administrator, um Berechtigungen anzupassen oder ein neues Projekt erstellen zu lassen.
                      </p>
                  </div>
             ) : (
                 <>
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
                 <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200/80 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                     
                     {/* Active Owner Banner */}
                     <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-xl flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-sm shadow">
                              {user?.name ? user.name[0] : 'Z'}
                           </div>
                           <div>
                              <div className="flex items-center gap-1.5">
                                 <span className="font-bold text-xs">{user?.name || 'Zubeyr'}</span>
                                 <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">ANGEMELDET</span>
                              </div>
                              <p className="text-[10px] text-slate-300">{user?.email || 'zuboedin@gmail.com'}</p>
                           </div>
                        </div>
                        <span className="text-[10px] text-blue-300 font-mono bg-blue-900/60 border border-blue-700/50 px-2 py-0.5 rounded font-bold">
                           PROJECT OWNER
                        </span>
                     </div>

                     <div className="text-center">
                        <h2 className="text-lg font-bold text-slate-800">Neues leeres Projekt konfigurieren</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Wählen Sie den Projekt-Typ, Ihre Datenbank und das gewünschte Backend-Framework.</p>
                     </div>

                     {/* SCHRITT 1: Team Cloud vs. Normales Projekt */}
                     <div className="space-y-2">
                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                           <Users size={14} className="text-blue-600" />
                           1. Projekt-Typ wählen
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                           <div 
                              onClick={() => setNewProjectType('cloud')}
                              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${newProjectType === 'cloud' ? 'border-blue-600 bg-blue-50/70 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                           >
                              <div className="flex items-center justify-between mb-1">
                                 <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900">
                                    <Cloud size={16} className="text-blue-600" />
                                    Team Cloud Projekt
                                 </div>
                                 {newProjectType === 'cloud' && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                              </div>
                              <p className="text-[11px] text-slate-600 leading-tight">
                                 Multi-User Cloud-Sync, AD Domain-Controller Anbindung & Team-Freigaben.
                              </p>
                              <span className="inline-block mt-2 text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                 Empfohlen für Teams
                              </span>
                           </div>

                           <div 
                              onClick={() => setNewProjectType('local')}
                              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${newProjectType === 'local' ? 'border-indigo-600 bg-indigo-50/70 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                           >
                              <div className="flex items-center justify-between mb-1">
                                 <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                                    <HardDrive size={16} className="text-indigo-600" />
                                    Normales / Lokales Projekt
                                 </div>
                                 {newProjectType === 'local' && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                              </div>
                              <p className="text-[11px] text-slate-600 leading-tight">
                                 Speichert das Projekt lokal auf diesem Gerät. Ideal für isolated Demos & Tests.
                              </p>
                              <span className="inline-block mt-2 text-[9px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                                 Standalone / Offline
                              </span>
                           </div>
                        </div>
                     </div>

                     {/* SCHRITT 2 & 3: Datenbank & Backend */}
                     <div className="grid grid-cols-2 gap-4">
                         {/* Database Selection */}
                         <div>
                             <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Database size={13} className="text-emerald-600" />
                                2. Datenbank
                             </label>
                             <div className="space-y-1.5">
                                 {[
                                     { id: DbType.SQL, label: 'SQL Server (.NET)' },
                                     { id: DbType.MySQL, label: 'MySQL / MariaDB' },
                                     { id: DbType.SQLite, label: 'SQLite (Lokal)' },
                                     { id: DbType.NoSQL, label: 'MongoDB / NoSQL' },
                                 ].map((type) => (
                                     <div 
                                        key={type.id}
                                        onClick={() => setNewDbType(type.id)}
                                        className={`p-2.5 rounded-lg border cursor-pointer transition-all text-xs flex justify-between items-center ${newDbType === type.id ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-bold shadow-sm' : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'}`}
                                     >
                                         <span>{type.label}</span>
                                         {newDbType === type.id && <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>}
                                     </div>
                                 ))}
                             </div>
                         </div>

                         {/* Backend Selection */}
                         <div>
                             <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Code size={13} className="text-indigo-600" />
                                3. Backend-Framework
                             </label>
                             <div className="space-y-1.5">
                                 {[
                                     { id: 'dotnet', label: '.NET 10 (C# Enterprise)' },
                                     { id: 'nodejs', label: 'Node.js (TypeScript)' },
                                     { id: 'python', label: 'Python (FastAPI)' },
                                     { id: 'php', label: 'PHP / Laravel' },
                                 ].map((lang) => (
                                     <div 
                                        key={lang.id}
                                        onClick={() => setNewLanguage(lang.id as BackendLanguage)}
                                        className={`p-2.5 rounded-lg border cursor-pointer transition-all text-xs flex justify-between items-center ${newLanguage === lang.id ? 'border-indigo-500 bg-indigo-50/80 text-indigo-900 font-bold shadow-sm' : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'}`}
                                     >
                                         <span>{lang.label}</span>
                                         {newLanguage === lang.id && <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>}
                                     </div>
                                 ))}
                             </div>
                         </div>
                     </div>

                     {/* SCHRITT 4: Projektname */}
                     <div className="space-y-1.5 pt-2 border-t border-slate-100">
                         <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">4. Projektname</label>
                         <input 
                            type="text" 
                            className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-800 shadow-sm"
                            placeholder="z.B. MeinKundenPortal"
                            value={newProjectName}
                            onChange={e => setNewProjectName(e.target.value)}
                            autoFocus
                         />
                     </div>

                     {/* Optional Settings Accordion */}
                     <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-3">
                         <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1.5"><Shield size={14} className="text-blue-600"/> Security, Auth & Mandantenfähigkeit</span>
                            <span className="text-[10px] text-slate-400 uppercase">Optional</span>
                         </div>
                         <div className="grid grid-cols-2 gap-2 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200 hover:bg-slate-50">
                               <input 
                                  type="checkbox" 
                                  checked={authConfig.useUserLogin} 
                                  onChange={e => setAuthConfig({...authConfig, useUserLogin: e.target.checked})}
                                  className="rounded text-blue-600"
                               />
                               <span>Benutzer-Login (JWT)</span>
                            </label>
                            {newLanguage === 'dotnet' && (
                               <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200 hover:bg-slate-50">
                                  <input 
                                     type="checkbox" 
                                     checked={authConfig.useWindowsAuth} 
                                     onChange={e => setAuthConfig({...authConfig, useWindowsAuth: e.target.checked})}
                                     className="rounded text-blue-600"
                                  />
                                  <span>Active Directory / Windows Auth</span>
                               </label>
                            )}
                         </div>

                         {/* Multi-Tenancy / SaaS Option */}
                         <div className="border-t border-slate-200/60 pt-2 text-xs space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                               <input 
                                  type="checkbox" 
                                  checked={useMultiTenancy} 
                                  onChange={e => setUseMultiTenancy(e.target.checked)}
                                  className="rounded text-indigo-600 focus:ring-indigo-500"
                               />
                               <span className="flex items-center gap-1.5">
                                  <Users size={13} className="text-indigo-600" />
                                  Multi-Tenancy / Mandantenfähigkeit (SaaS / Vereins-CMS)
                               </span>
                            </label>
                            
                            {useMultiTenancy && (
                               <div className="ml-6 space-y-1 animate-in fade-in">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Identifier-Feldname (Tenant Key)</label>
                                  <input 
                                     type="text" 
                                     className="w-full max-w-xs border border-slate-300 rounded p-1.5 text-xs font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                                     value={tenantField}
                                     onChange={e => setTenantField(e.target.value)}
                                     placeholder="z.B. TenantId, ClubId, OrganizationId"
                                  />
                                  <p className="text-[10px] text-slate-400">Trennstrikte Daten-Isolierung pro Mandant in allen generierten Tabellen & APIs.</p>
                               </div>
                            )}
                         </div>
                     </div>

                     <button 
                        onClick={handleCreate}
                        disabled={!newProjectName.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        <Plus size={16} />
                        <span>Leeres Projekt Jetzt Erstellen</span>
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
                 </>
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

      {/* Dialog for Copying Project */}
      {copyingProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in-25 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-lg shadow-2xl border border-slate-300 max-w-sm w-full mx-4">
                  <h3 className="font-bold text-lg mb-2 text-slate-800">Projekt kopieren</h3>
                  <p className="mb-4 text-xs text-slate-500">Geben Sie einen Namen für das kopierte Projekt ein:</p>
                  <input
                      type="text"
                      className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold mb-6 text-slate-800"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      autoFocus
                      onKeyDown={async e => {
                          if (e.key === 'Enter' && renameValue.trim()) {
                              document.getElementById('btn-confirm-copy')?.click();
                          }
                      }}
                  />
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setCopyingProject(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-sm">Abbrechen</button>
                      <button 
                        id="btn-confirm-copy"
                        onClick={async () => {
                            if (!renameValue.trim()) return;
                            setLoading(true);
                            try {
                                const original = await getProjectById(copyingProject.id);
                                if (original) {
                                    const newId = crypto.randomUUID();
                                    const cleanName = renameValue.replace(/\s+/g, '') || 'MyProject';
                                    const clone: Project = {
                                        ...original,
                                        id: newId,
                                        name: renameValue,
                                        lastModified: Date.now(),
                                        data: {
                                            ...original.data,
                                            backendConfig: {
                                                ...original.data.backendConfig,
                                                projectName: cleanName
                                            } as BackendConfig
                                        }
                                    };
                                    await saveProjectToStorage(clone);
                                    await loadProjects();
                                }
                            } finally {
                                setLoading(false);
                                setCopyingProject(null);
                            }
                        }} 
                        disabled={!renameValue.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm shadow-sm disabled:opacity-50"
                      >
                          Kopieren
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Dialog for Renaming Project */}
      {renamingProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in-25 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-lg shadow-2xl border border-slate-300 max-w-sm w-full mx-4">
                  <h3 className="font-bold text-lg mb-2 text-slate-800">Projekt umbenennen</h3>
                  <p className="mb-4 text-xs text-slate-500">Geben Sie den neuen Namen für das Projekt ein:</p>
                  <input
                      type="text"
                      className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold mb-6 text-slate-800"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      autoFocus
                      onKeyDown={async e => {
                          if (e.key === 'Enter' && renameValue.trim()) {
                              document.getElementById('btn-confirm-rename')?.click();
                          }
                      }}
                  />
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setRenamingProject(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-sm">Abbrechen</button>
                      <button 
                        id="btn-confirm-rename"
                        onClick={async () => {
                            if (!renameValue.trim()) return;
                            setLoading(true);
                            try {
                                const original = await getProjectById(renamingProject.id);
                                if (original) {
                                    const cleanName = renameValue.replace(/\s+/g, '') || 'MyProject';
                                    const updated: Project = {
                                        ...original,
                                        name: renameValue,
                                        lastModified: Date.now(),
                                        data: {
                                            ...original.data,
                                            backendConfig: {
                                                ...original.data.backendConfig,
                                                projectName: cleanName
                                            } as BackendConfig
                                        }
                                    };
                                    await saveProjectToStorage(updated);
                                    await loadProjects();
                                }
                            } finally {
                                setLoading(false);
                                setRenamingProject(null);
                            }
                        }} 
                        disabled={!renameValue.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm shadow-sm disabled:opacity-50"
                      >
                          Umbenennen
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Modal for Managing Project Members */}
      {managingMembersProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in-25 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-300 max-w-lg w-full mx-4 flex flex-col max-h-[85vh]">
                  
                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
                      <div>
                          <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                              <Users className="text-blue-600" size={20} />
                              Mitglieder verwalten
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                              Projekt: <span className="font-semibold text-slate-700">{managingMembersProject.name}</span>
                          </p>
                      </div>
                      <button 
                          onClick={() => setManagingMembersProject(null)}
                          className="text-slate-400 hover:text-slate-600 text-sm font-bold bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors"
                      >
                          Schließen
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                      
                      {/* Section 1: Current Members */}
                      <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktuelle Projekt-Mitglieder</h4>
                          <div className="space-y-2">
                              {projectMembers.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic">Keine expliziten Mitglieder eingetragen. (Nur der Owner hat Zugriff)</p>
                              ) : (
                                  projectMembers.map(m => (
                                      <div key={m.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs">
                                          <div className="flex items-center gap-2.5">
                                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold font-mono">
                                                  {m.name ? m.name[0].toUpperCase() : 'U'}
                                              </div>
                                              <div>
                                                  <p className="font-bold text-slate-800">{m.name}</p>
                                                  <p className="text-[10px] text-slate-500">{m.email}</p>
                                              </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                              <span className="text-[10px] bg-slate-200/70 text-slate-600 font-medium px-2 py-0.5 rounded-full capitalize">
                                                  {m.role}
                                              </span>
                                              {m.role !== 'Projekt-Owner' && m.role !== 'Owner' && (
                                                  <button 
                                                      onClick={() => removeProjectMember(m.id)}
                                                      className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors"
                                                      title="Mitglied entfernen"
                                                  >
                                                      <Trash2 size={13} />
                                                  </button>
                                              )}
                                          </div>
                                      </div>
                                  ))
                              )}
                          </div>
                      </div>

                      {/* Section 2: Add New Member */}
                      <div className="border-t border-slate-100 pt-4 space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Plus size={14} className="text-emerald-500" />
                              Neues Mitglied hinzufügen (AD Suche)
                          </h4>

                          {/* Role Selection */}
                          <div className="flex items-center gap-3">
                              <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Rolle für neues Mitglied:</label>
                              <select 
                                  value={addingMemberRole} 
                                  onChange={e => setAddingMemberRole(e.target.value)}
                                  className="border border-slate-300 rounded-lg p-1.5 text-xs text-slate-700 font-semibold focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                              >
                                  <option value="Entwickler">Entwickler</option>
                                  <option value="Architekt">Architekt</option>
                                  <option value="Manager">Manager</option>
                                  <option value="Gast">Gast</option>
                              </select>
                          </div>

                          {/* Search AD User */}
                          <div className="space-y-2">
                              <input 
                                  type="text"
                                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 placeholder-slate-400"
                                  placeholder="Nach Name, Username oder E-Mail suchen..."
                                  value={memberSearchQuery}
                                  onChange={e => setMemberSearchQuery(e.target.value)}
                              />

                              {/* Search Results */}
                              <div className="max-h-44 overflow-y-auto border border-slate-100 rounded-xl bg-slate-50/50 divide-y divide-slate-100">
                                  {filteredAdUsers.length === 0 ? (
                                      <p className="text-xs text-slate-400 p-3 text-center">Keine passenden AD-Benutzer gefunden.</p>
                                  ) : (
                                      filteredAdUsers.map(user => {
                                          const isAlreadyMember = projectMembers.some(m => m.email.toLowerCase() === user.email.toLowerCase());
                                          return (
                                              <div 
                                                  key={user.username} 
                                                  className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-100 transition-colors"
                                              >
                                                  <div>
                                                      <p className="font-bold text-slate-800">{user.displayName}</p>
                                                      <p className="text-[10px] text-slate-500">{user.username} ({user.email})</p>
                                                  </div>
                                                  <button 
                                                      disabled={isAlreadyMember}
                                                      onClick={() => addProjectMember(user)}
                                                      className={`px-3 py-1 rounded font-bold text-[10px] transition-colors shadow-sm ${isAlreadyMember ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                                                  >
                                                      {isAlreadyMember ? 'Bereits Mitglied' : 'Hinzufügen'}
                                                  </button>
                                              </div>
                                          );
                                      })
                                  )}
                              </div>
                          </div>
                      </div>

                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
