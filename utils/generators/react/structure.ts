
import { Table, Form, Report, VirtualFile, BackendConfig, Query, CustomPage } from '../../../types/index';
import { toPascalCase, toCamelCase } from '../common';

export const generateReactStructure = (tables: Table[], forms: Form[], reports: Report[], config: BackendConfig, root: string, queries: Query[] = [], pages: CustomPage[] = []): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const routes: string[] = [];
  const imports: string[] = [];
  const useAuth = config.authConfig?.useUserLogin;

  // Whitelabel Defaults
  const wl = config.whitelabel || {
      appName: config.projectName,
      companyName: 'My Company',
      primaryColor: '#3b82f6',
      secondaryColor: '#1e293b',
      removeBranding: false
  };

  // --- Phase 6: Global State Context ---
  const globalStates = config.globalStates || [];
  const stateDefaults = globalStates.reduce((acc: any, s) => {
      acc[s.name] = s.defaultValue;
      return acc;
  }, {});
  
  files.push({
      name: 'GlobalStateContext.tsx',
      path: `${root}/src/context/GlobalStateContext.tsx`,
      language: 'typescript',
      content: `import React, { createContext, useContext, useState } from 'react';

export const GlobalStateContext = createContext<any>(null);

export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [states, setStates] = useState<Record<string, any>>(${JSON.stringify(stateDefaults, null, 2)});
  
  const setGlobalState = (key: string, value: any) => {
      setStates(prev => ({ ...prev, [key]: value }));
  };

  // Phase 6 Toast
  const [toasts, setToasts] = useState<any[]>([]);
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  
  return (
      <GlobalStateContext.Provider value={{ states, setGlobalState, addToast }}>
          {children}
          {/* Toast Container */}
          <div className="fixed bottom-4 right-4 z-[9999] space-y-2">
            {toasts.map(t => (
                <div key={t.id} className={\`px-4 py-3 rounded-lg shadow-xl text-white \${t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-green-600' : 'bg-blue-600'} flex items-center gap-2 animate-in slide-in-from-right-4\`}>
                    {t.message}
                </div>
            ))}
          </div>
      </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => useContext(GlobalStateContext);
`
  });
  imports.push(`import { GlobalStateProvider } from './context/GlobalStateContext';`);

  // 1. Theme Context (No Changes)
  const themeContext = `import React, { createContext, useContext, useEffect, useState } from "react";
type Theme = "dark" | "light" | "system";
type ThemeProviderProps = { children: React.ReactNode; defaultTheme?: Theme; storageKey?: string; };
type ThemeProviderState = { theme: Theme; setTheme: (theme: Theme) => void; };
const initialState: ThemeProviderState = { theme: "system", setTheme: () => null };
const ThemeProviderContext = createContext<ThemeProviderState>(initialState);
export function ThemeProvider({ children, defaultTheme = "system", storageKey = "vite-ui-theme" }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(storageKey) as Theme) || defaultTheme);
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
      return;
    }
    root.classList.add(theme);
  }, [theme]);
  const value = { theme, setTheme: (theme: Theme) => { localStorage.setItem(storageKey, theme); setTheme(theme); } };
  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};`;
  files.push({ name: 'theme-provider.tsx', path: `${root}/src/components/theme-provider.tsx`, content: themeContext, language: 'typescript' });

  // 1.1 Generic Modal Component
  const modalComponent = `import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border dark:border-slate-700">
                <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                    <h3 className="text-lg font-bold dark:text-white">{title}</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};`;
  files.push({ name: 'Modal.tsx', path: `${root}/src/components/Modal.tsx`, content: modalComponent, language: 'typescript' });

  // 1.2 User Picker Modal Component
  const userPickerModal = `import React, { useState, useEffect } from 'react';
import { X, User, Search, Check, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface AdUser {
    username: string;
    displayName: string;
    email: string;
    department?: string;
    groups?: string[];
}

interface UserPickerModalProps {
    isOpen: boolean;
    initialTab?: 'me' | 'search';
    onSelect: (username: string, displayName: string) => void;
    onClose: () => void;
}

export const UserPickerModal: React.FC<UserPickerModalProps> = ({ isOpen, initialTab = 'me', onSelect, onClose }) => {
    const [activeTab, setActiveTab] = useState<'me' | 'search'>(initialTab);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [me, setMe] = useState<AdUser | null>(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<AdUser[]>([]);

    useEffect(() => {
        if (isOpen && activeTab === 'me') loadMe();
    }, [isOpen, activeTab]);

    const loadMe = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/ad/me');
            const userData = (res as any).data || res;
            setMe(userData);
        } catch (e) {
            console.warn(e);
            setError("Konnte Benutzer nicht laden.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!query || query.length < 2) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(\`/ad/search?q=\${query}\`);
            const searchData = (res as any).data || res;
            setResults(Array.isArray(searchData) ? searchData : []);
        } catch (e) {
            setError("Suche fehlgeschlagen.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[250] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-300 dark:border-slate-700 overflow-hidden flex flex-col h-[500px]">
                <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
                    <h3 className="font-bold flex items-center gap-2"><User size={20}/> Benutzer auswählen</h3>
                    <button onClick={onClose}><X size={20}/></button>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                    <button onClick={() => setActiveTab('me')} className={\`flex-1 py-3 text-sm font-bold \${activeTab === 'me' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-t-2 border-blue-600' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}\`}>Aktueller User</button>
                    <button onClick={() => setActiveTab('search')} className={\`flex-1 py-3 text-sm font-bold \${activeTab === 'search' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-t-2 border-blue-600' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}\`}>Suchen</button>
                </div>
                <div className="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900 relative">
                    {loading && <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10"><Loader2 className="animate-spin text-blue-600" size={32}/></div>}
                    {error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded text-xs">{error}</div>}
                    
                    {activeTab === 'me' && me && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner">{me.displayName?.substring(0,2).toUpperCase()}</div>
                            <div><h4 className="text-xl font-bold dark:text-white">{me.displayName}</h4><p className="text-slate-500 text-sm font-mono">{me.username}</p></div>
                            <button onClick={() => onSelect(me.username, me.displayName)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm mt-4"><Check size={18}/> Als "{me.username}" übernehmen</button>
                        </div>
                    )}

                    {activeTab === 'search' && (
                        <div className="h-full flex flex-col">
                            <div className="flex gap-2 mb-4">
                                <input type="text" className="flex-1 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm dark:bg-slate-800 dark:text-white" placeholder="Name..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} autoFocus />
                                <button onClick={handleSearch} className="bg-slate-700 text-white px-4 rounded hover:bg-slate-800"><Search size={18}/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2">
                                {results.map((u) => (
                                    <div key={u.username} className="p-3 hover:bg-blue-50 dark:hover:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center cursor-pointer" onClick={() => onSelect(u.username, u.displayName)}>
                                        <div><div className="font-bold text-sm dark:text-white">{u.displayName}</div><div className="text-xs text-slate-500 font-mono">{u.username}</div></div>
                                        <button className="text-blue-600 dark:text-blue-400 text-xs font-bold">Wählen</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};`;
  files.push({ name: 'UserPickerModal.tsx', path: `${root}/src/components/UserPickerModal.tsx`, content: userPickerModal, language: 'typescript' });

  // 3. Navigation / Sidebar (with Custom Drag and Drop mapping)
  let sidebarMainContent = '';
  if (config.navigationConfig && config.navigationConfig.length > 0) {
      const compileItem = (item: any, indent = 12): string => {
          const requiredRoles = item.requiredRoles || [];
          const rolesStr = requiredRoles.map((r: any) => `'${r}'`).join(', ');
          const hasRolesCheck = useAuth && requiredRoles.length > 0;
          const checkStart = hasRolesCheck ? `{user && [${rolesStr}].includes(user.role) && (` : '';
          const checkEnd = hasRolesCheck ? ')}' : '';

          let iconName = 'BookOpen';
          if (item.icon === 'home') iconName = 'Home';
          else if (item.icon === 'database') iconName = 'Database';
          else if (item.icon === 'search') iconName = 'Search';
          else if (item.icon === 'file-text') iconName = 'FileText';
          else if (item.icon === 'form') iconName = 'Layout';
          else if (item.icon === 'calendar') iconName = 'Calendar';
          else if (item.icon === 'chart') iconName = 'PieChart';
          else if (item.icon === 'shield') iconName = 'Shield';
          else if (item.icon === 'settings') iconName = 'Sun';
          else if (item.icon === 'folder') iconName = 'Table';

          if (item.type === 'folder') {
              const childrenJsx = (item.children || []).map((c: any) => compileItem(c, indent + 4)).join('\n');
              return `${checkStart}
              <div className="mt-4">
                  <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                       <Table size={12}/> {getLabel(${JSON.stringify(item)})}
                  </div>
                  <div className="space-y-1 pl-3 border-l border-white/5">
                      ${childrenJsx}
                  </div>
              </div>
              ${checkEnd}`;
          } else {
              let realRoute = item.route;
              if (item.targetType === 'form' && item.targetId) {
                const f = forms.find(x => x.id === item.targetId);
                if (f) realRoute = `/forms/${toPascalCase(f.name).toLowerCase()}Form/1`;
              } else if (item.targetType === 'report' && item.targetId) {
                const r = reports.find(x => x.id === item.targetId);
                if (r) realRoute = `/reports/${toCamelCase(r.name)}`;
              } else if (item.targetType === 'table' && item.targetId) {
                const t = tables.find(x => x.id === item.targetId);
                if (t) realRoute = `/${toCamelCase(t.name)}`;
              } else if (item.targetType === 'query' && item.targetId) {
                const q = queries.find(x => x.id === item.targetId);
                if (q) realRoute = `/queries/${toCamelCase(q.name)}`;
              } else if ((item.targetType === 'page' || item.targetType === 'custom_page') && item.targetId) {
                const p = pages.find(x => x.id === item.targetId);
                if (p) realRoute = `/custom/${toCamelCase(p.name)}`;
              }
              const badgeHtml = item.badgeCountQuery ? `
                  <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-white bg-red-500 rounded-full animate-pulse shadow-sm">
                    {(${JSON.stringify(item.badgeCountQuery)}.length % 5) + 3}
                  </span>
              ` : '';
              return `${checkStart}
              <Link to="${realRoute}" className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all \${isActive('${realRoute}')}\`}>
                  <${iconName} size={16}/> <span>{getLabel(${JSON.stringify(item)})}</span>
                  ${badgeHtml}
              </Link>
              ${checkEnd}`;
          }
      };
      
      sidebarMainContent = config.navigationConfig.map(it => compileItem(it)).join('\n');
  } else {
      sidebarMainContent = `
            {/* Tables */}
            <div>
                <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Daten</div>
                <div className="space-y-1">
                ${tables.map(t => {
                    const isSystem = t.name.startsWith('sys_');
                    const cond = isSystem && useAuth ? `{user?.role === 'Admin' && (` : ``;
                    const closeCond = isSystem && useAuth ? `)}` : ``;
                    return `${cond}
                    <Link to="/${toCamelCase(t.name)}" className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all \${isActive('/${toCamelCase(t.name)}')}\`}>
                        ${isSystem ? '<Shield size={16}/>' : '<Table size={16}/>'} ${t.name}
                    </Link>${closeCond}`;
                }).join('\n')}
                </div>
            </div>
            
            {/* Queries */}
            {${queries.filter(q => q.type === 'SELECT' || q.type === 'UPDATE').length} > 0 && (
            <div>
                <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Abfragen</div>
                <div className="space-y-1">
                ${queries.filter(q => q.type === 'SELECT' || q.type === 'UPDATE').map(q => {
                    const iconName = q.type === 'UPDATE' ? 'RefreshCw' : 'Search';
                    return `
                    <Link to="/queries/${toCamelCase(q.name)}" className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all \${isActive('/queries/${toCamelCase(q.name)}')}\`}>
                        <${iconName} size={16}/> \${q.name}
                    </Link>`;
                }).join('\n')}
                </div>
            </div>
            )}

            {/* Reports */}
            {${reports.length} > 0 && (
            <div>
                <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Berichte</div>
                <div className="space-y-1">
                ${reports.map(r => `
                    <Link to="/reports/${toCamelCase(r.name)}" className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all \${isActive('/reports/${toCamelCase(r.name)}')}\`}>
                        <FileText size={16}/> \${r.name}
                    </Link>`).join('\n')}
                </div>
            </div>
            )}

            {/* Custom Pages */}
            {${pages.filter(p => !p.isSubpage).length} > 0 && (
            <div>
                <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Eigene Seiten</div>
                <div className="space-y-1">
                ${pages.filter(p => !p.isSubpage).map(p => `
                    <Link to="/custom/${toCamelCase(p.name)}" className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all \${isActive('/custom/${toCamelCase(p.name)}')}\`}>
                        <Layout size={16}/> \${p.name}
                    </Link>`).join('\n')}
                </div>
            </div>
            )}
      `;
  }

  // 3.5 CommandPalette Component for generated React Apps (Primary Phase 3 feature)
  const commandPaletteTsx = `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command } from 'lucide-react';

export const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isOpen) return null;

    // Get flat list of available pages
    const items = ${JSON.stringify(config.navigationConfig || [])};
    const flat: any[] = [];
    const recurse = (list: any[]) => {
        list.forEach(i => {
            if (i.type === 'page') flat.push(i);
            if (i.children) recurse(i.children);
        });
    };
    recurse(items);

    const filtered = flat.filter(f => 
        f.title.toLowerCase().includes(search.toLowerCase()) || 
        f.route.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 text-slate-800">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <Search className="text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Schnellsuche (Seiten, Formulare, Tabellen)..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-transparent text-sm text-slate-800 dark:text-white outline-none"
                        autoFocus
                    />
                    <kbd className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded">ESC</kbd>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2">
                    {filtered.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">Keine Resultate für "{search}"</div>
                    ) : (
                        filtered.map(f => (
                            <button
                                key={f.id}
                                onClick={() => {
                                    navigate(f.route);
                                    setIsOpen(false);
                                }}
                                className="w-full text-left p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
                            >
                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{f.title}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{f.route}</div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};`;
  files.push({ name: 'CommandPalette.tsx', path: `${root}/src/components/CommandPalette.tsx`, content: commandPaletteTsx, language: 'typescript' });

  const sidebarTsx = `import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Table, Layout, FileText, Search, Database, Moon, Sun, X, Menu, LogOut, Shield, User, PieChart, Home, Calendar, Globe } from 'lucide-react';
import { useTheme } from './theme-provider';
${useAuth ? "import { useAuth } from '../context/AuthContext';" : ""}

export const Sidebar = ({ isOpen, onClose, isTopNav }: { isOpen: boolean; onClose: () => void; isTopNav?: boolean }) => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [lang, setLang] = useState(localStorage.getItem('app_lang') || 'de');
  ${useAuth ? "const { logout, user } = useAuth();" : ""}
  
  const isActive = (path: string) => location.pathname.startsWith(path) ? 'bg-[${wl.primaryColor}] text-white shadow-lg font-bold' : 'text-slate-300 hover:bg-slate-800 hover:text-white';

  const getLabel = (item: any) => {
    return item.translations?.[lang] || item.title;
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'de' ? 'en' : lang === 'en' ? 'fr' : 'de';
    localStorage.setItem('app_lang', nextLang);
    setLang(nextLang);
  };

  const isDoubleRail = ${config.navigationPreset === 'double_rail' ? 'true' : 'false'};

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      
      <aside className={\`fixed inset-y-0 left-0 z-50 \${isDoubleRail ? 'w-72' : 'w-64'} bg-[${wl.secondaryColor}] text-slate-100 flex flex-col transition-transform duration-300 \${isOpen ? 'translate-x-0' : (isTopNav ? '-translate-x-full' : '-translate-x-full lg:translate-x-0 lg:static')}\`}>
        
        {/* Simple visual Double Rail ribbon effect decoration */}
        {isDoubleRail && (
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-black/15 flex flex-col items-center py-6 gap-6 border-r border-white/5">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/20">
              <Database size={20} className="text-white"/>
            </div>
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/15" onClick={toggleLanguage}>
              <Globe size={18} className="text-slate-400" />
            </div>
          </div>
        )}

        <div className={\`p-6 font-bold text-xl border-b border-white/10 flex items-center justify-between \${isDoubleRail ? 'pl-20' : ''}\`}>
            <div className="flex items-center gap-2">
                ${wl.logoUrl ? `<img src="${wl.logoUrl}" alt="Logo" className="w-8 h-8 object-contain" />` : 
                `<div className="w-8 h-8 bg-[${wl.primaryColor}] rounded-lg flex items-center justify-center shadow-lg"><Database size={18} className="text-white"/></div>`}
                <span>${wl.appName}</span>
            </div>
            <button onClick={onClose} className="lg:hidden text-slate-400"><X size={20}/></button>
        </div>
        
        <div className={\`flex-1 overflow-y-auto p-4 space-y-6 \${isDoubleRail ? 'pl-20' : ''}\`}>
            ${sidebarMainContent}
        </div>

        <div className={\`p-4 border-t border-white/10 text-center space-y-2 \${isDoubleRail ? 'pl-20' : ''}\`}>
            ${useAuth ? `<div className="text-xs text-slate-400 mb-2">Eingeloggt als: {user?.username} ({user?.role})</div>
            <Link to="/profile" className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium transition-colors mb-2">
                <User size={16} /> Profil
            </Link>
            <button onClick={logout} className="flex items-center justify-center gap-2 w-full bg-red-600/20 hover:bg-red-600/40 text-red-200 py-2 rounded-lg text-sm font-medium transition-colors">
                <LogOut size={16} /> Abmelden
            </button>` : ''}
            
            <div className="grid grid-cols-2 gap-1">
              <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-[11px] font-bold transition-colors"
                  title="Design anpassen"
              >
                  {theme === 'dark' ? <><Sun size={12} /> Light</> : <><Moon size={12} /> Dark</>}
              </button>
              
              <button 
                  onClick={toggleLanguage}
                  className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-[11px] font-bold transition-colors uppercase"
                  title="Sprache wechseln"
              >
                  <Globe size={12} />
                  <span>{lang}</span>
              </button>
            </div>

            <div className="text-[10px] text-slate-500 pt-2 flex items-center justify-center gap-1">
                <span>&copy; ${wl.companyName}</span>
                <span className="font-bold underline cursor-pointer" onClick={() => (window as any).dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}>Strg+K</span>
            </div>
        </div>
      </aside>
    </>
  );
};`;
  files.push({ name: 'Sidebar.tsx', path: `${root}/src/components/Sidebar.tsx`, content: sidebarTsx, language: 'typescript' });

  // 3.5. Top Navigation Dropdown Component
  const topNavTsx = `import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { NavigationItem } from '../types';
${useAuth ? "import { useAuth } from '../context/AuthContext';" : ""}

interface TopNavProps {
  items: NavigationItem[];
}

export const TopNav: React.FC<TopNavProps> = ({ items }) => {
  const location = useLocation();
  const [lang, setLang] = useState(localStorage.getItem('app_lang') || 'de');
  ${useAuth ? "const { user } = useAuth();" : ""}

  useEffect(() => {
    const handleLangChange = () => {
      setLang(localStorage.getItem('app_lang') || 'de');
    };
    window.addEventListener('storage', handleLangChange);
    const interval = setInterval(handleLangChange, 500);
    return () => {
      window.removeEventListener('storage', handleLangChange);
      clearInterval(interval);
    };
  }, []);

  const getLabel = (item: any) => {
    return item.translations?.[lang] || item.title;
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const hasAccess = (item: NavigationItem) => {
    const requiredRoles = item.requiredRoles || [];
    if (requiredRoles.length === 0) return true;
    ${useAuth ? "return user && requiredRoles.includes(user.role);" : "return true;"}
  };

  const getIconComponent = (name: string, size = 14) => {
    let iconName = 'BookOpen';
    if (name === 'home') iconName = 'Home';
    else if (name === 'database') iconName = 'Database';
    else if (name === 'search') iconName = 'Search';
    else if (name === 'file-text') iconName = 'FileText';
    else if (name === 'form') iconName = 'Layout';
    else if (name === 'calendar') iconName = 'Calendar';
    else if (name === 'chart') iconName = 'PieChart';
    else if (name === 'shield') iconName = 'Shield';
    else if (name === 'settings') iconName = 'Sun';
    else if (name === 'folder') iconName = 'Folder';
    
    const IconComponent = (Icons as any)[iconName] || Icons.BookOpen;
    return <IconComponent size={size} />;
  };

  const NavItem: React.FC<{ item: NavigationItem; isSubmenu?: boolean }> = ({ item, isSubmenu = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const timeoutRef = useRef<any>(null);

    if (!hasAccess(item)) return null;

    const handleMouseEnter = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsOpen(true);
    };

    const handleMouseLeave = () => {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 150);
    };

    const active = item.route ? isActive(item.route) : false;

    if (item.type === 'folder') {
      const visibleChildren = (item.children || []).filter(hasAccess);
      if (visibleChildren.length === 0) return null;

      return (
        <div 
          className="relative group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            type="button"
            className={\`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer \${
              isSubmenu 
                ? 'w-full text-left justify-between hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200' 
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }\`}
          >
            <span className="flex items-center gap-1.5">
              {getIconComponent(item.icon)}
              <span>{getLabel(item)}</span>
            </span>
            <Icons.ChevronDown size={12} className={\`transition-transform duration-200 text-slate-400 \${isOpen ? 'rotate-180' : ''}\`} />
          </button>

          {isOpen && (
            <div 
              className={\`absolute z-50 min-w-[220px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-150 \${
                isSubmenu ? 'left-full top-0 ml-1' : 'left-0 top-full mt-1'
              }\`}
            >
              {visibleChildren.map(child => (
                <NavItem key={child.id} item={child} isSubmenu={true} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        to={item.route}
        className={\`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 \${
          isSubmenu
            ? \`hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 \${active ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 font-bold' : ''}\`
            : \`\${active ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}\`
        }\`}
      >
        {getIconComponent(item.icon)}
        <span>{getLabel(item)}</span>
      </Link>
    );
  };

  return (
    <nav className="flex items-center gap-1">
      {items.map(item => (
        <NavItem key={item.id} item={item} />
      ))}
    </nav>
  );
};`;
  files.push({ name: 'TopNav.tsx', path: `${root}/src/components/TopNav.tsx`, content: topNavTsx, language: 'typescript' });

  // 4. Layout Wrapper with modern preset views
  const layoutTsx = `import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Menu, Search, Command } from 'lucide-react';
import { CommandPalette } from './CommandPalette';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isTopNav = ${config.navigationPreset === 'top_nav' ? 'true' : 'false'};
    const menuItems = ${JSON.stringify(config.navigationConfig || [])};

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isTopNav={isTopNav} />
            
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white shrink-0">
                            <Menu size={20} />
                        </button>
                        
                        <span className="font-bold text-base dark:text-white flex items-center gap-2 mr-4 shrink-0">
                            <span>${wl.appName}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300 py-0.5 px-2 rounded-full font-mono font-bold hidden md:inline">STRG+K</span>
                        </span>

                        {isTopNav && (
                            <div className="hidden lg:block overflow-x-auto">
                                <TopNav items={menuItems} />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button 
                            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                            className="bg-slate-50 border border-slate-200 hover:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 dark:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 cursor-pointer font-semibold shadow-sm text-slate-600"
                        >
                            <Command size={12} />
                            <span>Suche</span>
                        </button>
                    </div>
                </header>
                
                <div className="flex-1 overflow-auto p-4 sm:p-8">
                    {children}
                </div>
            </main>

            {/* Generated Command Palette */}
            <CommandPalette />
        </div>
    );
};`;
  files.push({ name: 'Layout.tsx', path: `${root}/src/components/Layout.tsx`, content: layoutTsx, language: 'typescript' });

  // 5. Register Routes
  
  // Table Routes
  tables.forEach(table => {
      const pascalName = toPascalCase(table.name);
      const camelName = toCamelCase(table.name);
      const listName = `${pascalName}List`;
      imports.push(`import { ${listName} } from './pages/${pascalName}/${listName}';`);
      
      const isSystem = table.name.startsWith('sys_');
      const rolesProp = isSystem ? ` allowedRoles={['Admin']}` : ``;
      
      if (useAuth) {
          routes.push(`<Route element={<ProtectedRoute${rolesProp} />}><Route path="/${camelName}" element={<${listName} />} /></Route>`);
      } else {
          routes.push(`<Route path="/${camelName}" element={<${listName} />} />`);
      }

      const customForm = forms.find(f => f.sourceId === table.id && f.sourceType === 'table');
      if (!customForm) {
          const formCompName = `${pascalName}Form`;
          imports.push(`import { ${formCompName} } from './pages/${pascalName}/${formCompName}';`);
          if (useAuth) {
              routes.push(`<Route element={<ProtectedRoute${rolesProp} />}><Route path="/${camelName}/new" element={<${formCompName} />} /><Route path="/${camelName}/:id" element={<${formCompName} />} /></Route>`);
          } else {
              routes.push(`<Route path="/${camelName}/new" element={<${formCompName} />} />`);
              routes.push(`<Route path="/${camelName}/:id" element={<${formCompName} />} />`);
          }
      }
  });

  // Custom Form Routes
  forms.forEach(form => {
      const compName = `${toPascalCase(form.name)}Form`;
      imports.push(`import { ${compName} } from './pages/forms/${compName}';`);
      routes.push(`<Route path="/forms/${toPascalCase(form.name).toLowerCase()}Form/:id" element={<${compName} />} />`);
  });

  // Query Routes
  queries.filter(q => q.type === 'SELECT' || q.type === 'UPDATE').forEach(q => {
      const compName = `${toPascalCase(q.name)}QueryPage`;
      imports.push(`import { ${compName} } from './pages/queries/${compName}';`);
      routes.push(`<Route path="/queries/${toCamelCase(q.name)}" element={<${compName} />} />`);
  });

  // Report Routes
  reports.forEach(r => {
      const compName = `${toPascalCase(r.name)}ReportPage`;
      imports.push(`import { ${compName} } from './pages/reports/${compName}';`);
      routes.push(`<Route path="/reports/${toCamelCase(r.name)}" element={<${compName} />} />`);
  });

  // Custom Pages Routes
  pages.forEach(p => {
      const pascalName = toPascalCase(p.name);
      imports.push(`import { ${pascalName}Page } from './pages/custom/${pascalName}Page';`);
      routes.push(`<Route path="/custom/${toCamelCase(p.name)}" element={<${pascalName}Page />} />`);
  });

  if (useAuth) {
      imports.push(`import { AuthProvider } from './context/AuthContext';`);
      imports.push(`import { ProtectedRoute } from './components/ProtectedRoute';`);
      imports.push(`import { Login } from './pages/auth/Login';`);
      imports.push(`import { Register } from './pages/auth/Register';`);
      imports.push(`import { ForgotPassword } from './pages/auth/ForgotPassword';`);
      imports.push(`import { Profile } from './pages/auth/Profile';`);
      imports.push(`import { Forbidden } from './pages/auth/Forbidden';`);
      
      const forbiddenCode = `import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Forbidden = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4 font-sans">
        <ShieldAlert size={80} className="text-red-500 mb-6 drop-shadow-md" />
        <h1 className="text-5xl font-black text-slate-800 dark:text-white tracking-widest mb-2 uppercase">NO ACCESS</h1>
        <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-8 max-w-sm text-center">Sie haben keine Berechtigung, auf diese Seite zuzugreifen. Bitte kontaktieren Sie einen Administrator.</p>
        <Link to="/" className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-lg hover:shadow-red-600/30 transform hover:-translate-y-1">
            Zurück zur Startseite
        </Link>
    </div>
);`;
      files.push({ name: 'Forbidden.tsx', path: `${root}/src/pages/auth/Forbidden.tsx`, content: forbiddenCode, language: 'typescript' });

      // Note: Full auth implementation (Login, Register, Context) is abstracted here due to scope, but skeleton is added
      // We will provide a simple ProtectedRoute that checks roles and redirects to Forbidden
      
      const ssoProviders = config.integrations?.sso || [];
      const ssoButtons = ssoProviders.length > 0 ? `
        <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="text-center text-xs text-slate-500 mb-4 uppercase tracking-wide font-bold">Oder anmelden mit</div>
            <div className="space-y-2">
                ${ssoProviders.map(sso => `
                <button onClick={() => loginWith('${sso.provider}')} type="button" className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2">
                    ${sso.provider === 'google' ? '<svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>' : ''}
                    ${sso.provider === 'apple' ? '<svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05 1.8-3.08 1.8-1.09 0-1.44-.65-2.7-.65-1.24 0-1.63.63-2.68.63-1.12 0-2.28-.95-3.13-1.93-2.7-3.1-3.6-7.88-1.28-10.4 1.13-1.22 2.76-1.88 4.22-1.88 1.13 0 2.21.57 2.83.57.65 0 2.03-.78 3.53-.78 1.5 0 2.9.48 3.65 1.13-2.3 1.18-2.68 3.65-1.3 5.08 1.12 1.18 2.5 1.48 2.75 1.5-.1.35-1.03 3.48-2.81 4.93zM14.62 4.41c.65-.89 1.15-2.18 1.05-3.41-1.08.06-2.5.7-3.23 1.63-.6.75-1.15 2.05-1 3.23 1.13.1 2.45-.63 3.18-1.45z"/></svg>' : ''}
                    ${sso.provider === 'microsoft' ? '<svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#f35325" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/></svg>' : ''}
                    ${sso.provider === 'github' ? '<svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>' : ''}
                    Mit ${sso.provider.charAt(0).toUpperCase() + sso.provider.slice(1)} anmelden
                </button>
                `).join('')}
            </div>
        </div>
      ` : '';

      const loginCode = `import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
export const Login = () => {
    const { login, loginWithSso } = useAuth();
    const navigate = useNavigate();
    const [u, setU] = useState('');
    const [p, setP] = useState('');
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(u, p);
        navigate('/');
    };
    const loginWith = async (provider: string) => {
        await loginWithSso(provider);
        navigate('/');
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
                <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input type="text" placeholder="Benutzername/Email" value={u} onChange={e=>setU(e.target.value)} className="w-full p-2 border rounded" required />
                    <input type="password" placeholder="Passwort" value={p} onChange={e=>setP(e.target.value)} className="w-full p-2 border rounded" required />
                    <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">Anmelden</button>
                </form>
                ${ssoButtons}
                <div className="mt-4 text-center text-sm">
                    <Link to="/register" className="text-blue-600 hover:underline">Registrieren</Link> | <Link to="/forgot-password" className="text-blue-600 hover:underline">Passwort vergessen?</Link>
                </div>
            </div>
        </div>
    );
};`;
      const registerCode = `import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { post } from '../../services/api';
export const Register = () => {
    const navigate = useNavigate();
    const [u, setU] = useState('');
    const [p, setP] = useState('');
    const handleReg = async (e: React.FormEvent) => {
        e.preventDefault();
        await post('auth/register', { username: u, password: p });
        navigate('/login');
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
                <h1 className="text-2xl font-bold mb-6 text-center">Konto erstellen</h1>
                <form onSubmit={handleReg} className="space-y-4">
                    <input type="email" placeholder="Email Adresse" value={u} onChange={e=>setU(e.target.value)} className="w-full p-2 border rounded" required />
                    <input type="password" placeholder="Passwort" value={p} onChange={e=>setP(e.target.value)} className="w-full p-2 border rounded" required />
                    <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">Registrieren</button>
                </form>
                <div className="mt-4 text-center text-sm">
                    <Link to="/login" className="text-blue-600 hover:underline">Zurück zum Login</Link>
                </div>
            </div>
        </div>
    );
};`;
      const forgotCode = `import React from 'react'; import { Link } from 'react-router-dom'; export const ForgotPassword = () => (<div className="p-8 text-center">Passwort vergessen? <Link to="/login">Zurück</Link></div>);`;
      const profileCode = `import React from 'react'; import { useAuth } from '../../context/AuthContext'; export const Profile = () => { const { user } = useAuth(); return <div className="p-8"><h1 className="text-2xl">Profil</h1><pre>{JSON.stringify(user, null, 2)}</pre></div>; };`;
      
      const authCtxCode = `import React, { createContext, useContext, useState, useEffect } from 'react';
import { post } from '../services/api';

interface AuthContextType {
    user: any;
    loading: boolean;
    login: (u: string, p: string) => Promise<void>;
    loginWithSso: (provider: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            const savedUser = localStorage.getItem('auth_user');
            if (savedUser) {
                try {
                    setUser(JSON.parse(savedUser));
                } catch {
                    setUser({ username: 'Admin User', role: 'Admin' });
                }
            } else {
                setUser({ username: 'Admin User', role: 'Admin' });
            }
        }
        setLoading(false);
    }, []);

    const login = async (u: string, p: string) => {
        const res: any = await post('auth/login', { username: u, password: p });
        if (res.token) {
            localStorage.setItem('auth_token', res.token);
            if (res.user) {
                localStorage.setItem('auth_user', JSON.stringify(res.user));
                setUser(res.user);
            } else {
                const userObj = { username: u, role: 'Admin' };
                localStorage.setItem('auth_user', JSON.stringify(userObj));
                setUser(userObj);
            }
        }
    };
    
    const loginWithSso = async (provider: string) => {
        const res: any = await post('auth/login-sso', { provider });
        if (res.token) {
            localStorage.setItem('auth_token', res.token);
            if (res.user) {
                localStorage.setItem('auth_user', JSON.stringify(res.user));
                setUser(res.user);
            } else {
                const userObj = { username: provider + ' User', role: 'User' };
                localStorage.setItem('auth_user', JSON.stringify(userObj));
                setUser(userObj);
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setUser(null);
    };

    return <AuthContext.Provider value={{ user, loading, login, loginWithSso, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};`;
      files.push({ name: 'AuthContext.tsx', path: `${root}/src/context/AuthContext.tsx`, content: authCtxCode, language: 'typescript' });
      files.push({ name: 'Login.tsx', path: `${root}/src/pages/auth/Login.tsx`, content: loginCode, language: 'typescript' });
      files.push({ name: 'Register.tsx', path: `${root}/src/pages/auth/Register.tsx`, content: registerCode, language: 'typescript' });
      files.push({ name: 'ForgotPassword.tsx', path: `${root}/src/pages/auth/ForgotPassword.tsx`, content: forgotCode, language: 'typescript' });
      files.push({ name: 'Profile.tsx', path: `${root}/src/pages/auth/Profile.tsx`, content: profileCode, language: 'typescript' });
      const protectedRouteCode = `import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from './Layout';

export const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
    const { user, loading } = useAuth() || { user: { role: 'User' }, loading: false }; // Mock fallback for demo
    
    if (loading) return <div>Lade...</div>;
    if (!user) return <Navigate to="/login" replace />;
    
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/forbidden" replace />;
    }
    
    return <Layout><Outlet /></Layout>;
};`;
      files.push({ name: 'ProtectedRoute.tsx', path: `${root}/src/components/ProtectedRoute.tsx`, content: protectedRouteCode, language: 'typescript' });
  }

  // App.tsx
  const appTsx = `import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { Layout } from './components/Layout';
${config.productTours && config.productTours.length > 0 ? "import Joyride, { Step } from 'react-joyride';" : ""}
${imports.join('\n')}

${config.productTours && config.productTours.length > 0 ? `
const toursData: Record<string, Step[]> = ${JSON.stringify(config.productTours.reduce((acc, tour) => {
    acc[tour.id] = tour.steps.map(s => ({ target: s.targetSelector, content: s.content, title: s.title }));
    return acc;
}, {} as any), null, 2)};
` : ""}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
        <GlobalStateProvider>
        ${useAuth ? "<AuthProvider>" : ""}
        ${config.productTours && config.productTours.length > 0 ? `
        {/* Render first tour for demonstration - in real app triggered dynamically */}
        <Joyride steps={toursData['${config.productTours[0].id}']} continuous showProgress showSkipButton />
        ` : ""}
        <BrowserRouter>
            <Routes>
                ${useAuth ? `
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/forbidden" element={<Forbidden />} />
                
                <Route element={<ProtectedRoute />}>
                    <Route path="/profile" element={<Profile />} />
                ` : `<Route element={<Layout><Outlet /></Layout>}>`}
                    <Route path="/" element={
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <h1 className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight">Willkommen bei ${wl.appName}</h1>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md">Wählen Sie einen Eintrag aus dem Menü, um zu starten.</p>
                        </div>
                    } />
                ${useAuth ? `</Route>` : `</Route>`}
                
                {/* Generated Routes */}
                ${routes.join('\n                ')}
            </Routes>
        </BrowserRouter>
        ${useAuth ? "</AuthProvider>" : ""}
        </GlobalStateProvider>
    </ThemeProvider>
  );
}
export default App;`;
  
  files.push({ name: 'App.tsx', path: `${root}/src/App.tsx`, content: appTsx, language: 'typescript' });
  
  files.push({ name: 'main.tsx', path: `${root}/src/main.tsx`, content: `import React from 'react'; import ReactDOM from 'react-dom/client'; import App from './App'; import './index.css'; ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);`, language: 'typescript' });
  
  files.push({ 
      name: 'index.html', 
      path: `${root}/index.html`, 
      content: `<!doctype html><html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${wl.appName}</title>
    ${wl.faviconUrl ? `<link rel="icon" type="image/x-icon" href="${wl.faviconUrl}">` : ''}
    ${wl.pwaConfiguration?.enabled ? `<link rel="manifest" href="/manifest.json" />` : ''}
    ${wl.pwaConfiguration?.themeColor ? `<meta name="theme-color" content="${wl.pwaConfiguration.themeColor}" />` : ''}
</head>
<body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`, 
      language: 'html' 
  });

  if (wl.pwaConfiguration?.enabled) {
      const pwaManifest = {
        name: wl.appName,
        short_name: wl.appName,
        start_url: '/',
        display: 'standalone',
        background_color: wl.pwaConfiguration.backgroundColor || '#ffffff',
        theme_color: wl.pwaConfiguration.themeColor || wl.primaryColor || '#3b82f6',
        icons: [
            {
                src: wl.logoUrl || "logo192.png",
                sizes: "192x192",
                type: "image/png"
            },
            {
                src: wl.logoUrl || "logo512.png",
                sizes: "512x512",
                type: "image/png"
            }
        ]
      };
      files.push({
          name: 'manifest.json',
          path: `${root}/public/manifest.json`,
          content: JSON.stringify(pwaManifest, null, 2),
          language: 'json'
      });
  }

  return files;
};
