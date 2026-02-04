
import { Table, Form, Report, VirtualFile, BackendConfig, Query } from '../../../types/index';
import { toPascalCase, toCamelCase } from '../common';

export const generateReactStructure = (tables: Table[], forms: Form[], reports: Report[], config: BackendConfig, root: string, queries: Query[] = []): VirtualFile[] => {
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

  // 2. Auth Components & Context
  if (useAuth) {
      // Auth Context with decoding
      const authContext = `import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, logoutUser } from '../services/api';

interface User {
    username: string;
    role: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (creds: any) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const decodeToken = (token: string) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                username: payload.unique_name || payload.sub,
                role: payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'User'
            };
        } catch { return null; }
    };

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            const u = decodeToken(token);
            if (u) setUser(u);
        }
        setLoading(false);
    }, []);

    const login = async (creds: any) => {
        const data = await loginUser(creds);
        if (data.token) {
            const u = decodeToken(data.token);
            setUser(u);
        }
    };

    const logout = () => {
        logoutUser();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);`;
      files.push({ name: 'AuthContext.tsx', path: `${root}/src/context/AuthContext.tsx`, content: authContext, language: 'typescript' });

      // Protected Route
      const protectedRoute = `import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from './Layout';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { isAuthenticated, user } = useAuth();
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/forbidden" replace />;
    }

    // FIX: Removed Layout wrapper here, as it is handled by parent Route or Outlet
    return <Layout><Outlet /></Layout>;
};`;
      files.push({ name: 'ProtectedRoute.tsx', path: `${root}/src/components/ProtectedRoute.tsx`, content: protectedRoute, language: 'typescript' });

      // Pages
      const loginPage = `import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [creds, setCreds] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try { await login(creds); navigate('/'); } catch (err) { setError('Login failed'); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-96">
                <h2 className="text-2xl font-bold mb-4 dark:text-white">Login</h2>
                {error && <p className="text-red-500 mb-2">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input className="w-full border p-2 rounded" placeholder="Username" value={creds.username} onChange={e => setCreds({...creds, username: e.target.value})} />
                    <input className="w-full border p-2 rounded" type="password" placeholder="Password" value={creds.password} onChange={e => setCreds({...creds, password: e.target.value})} />
                    <div className="text-right text-xs"><Link to="/forgot-password" class="text-blue-500">Passwort vergessen?</Link></div>
                    <button className="w-full bg-blue-600 text-white p-2 rounded">Login</button>
                </form>
                <div className="mt-4 text-center"><Link to="/register" className="text-blue-500">Register</Link></div>
            </div>
        </div>
    );
};`;
      files.push({ name: 'Login.tsx', path: `${root}/src/pages/auth/Login.tsx`, content: loginPage, language: 'typescript' });
      
      const registerPage = `import React, { useState } from 'react';
import { registerUser } from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';

export const Register = () => {
    const navigate = useNavigate();
    const [data, setData] = useState({ username: '', password: '', email: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try { await registerUser(data); navigate('/login'); } catch { alert('Error'); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-96">
                <h2 className="text-2xl font-bold mb-4 dark:text-white">Register</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input className="w-full border p-2 rounded" placeholder="Username" value={data.username} onChange={e => setData({...data, username: e.target.value})} />
                    <input className="w-full border p-2 rounded" placeholder="Email" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
                    <input className="w-full border p-2 rounded" type="password" placeholder="Password" value={data.password} onChange={e => setData({...data, password: e.target.value})} />
                    <button className="w-full bg-green-600 text-white p-2 rounded">Sign Up</button>
                </form>
                <div className="mt-4 text-center"><Link to="/login" className="text-blue-500">Login</Link></div>
            </div>
        </div>
    );
};`;
      files.push({ name: 'Register.tsx', path: `${root}/src/pages/auth/Register.tsx`, content: registerPage, language: 'typescript' });

      // Forgot Password
      files.push({
          name: 'ForgotPassword.tsx',
          path: `${root}/src/pages/auth/ForgotPassword.tsx`,
          content: `import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Ein Link zum Zurücksetzen wurde an ' + email + ' gesendet (Simuliert).');
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl font-bold mb-4">Passwort vergessen</h2>
                <form onSubmit={handleSend} className="space-y-4">
                    <input className="w-full border p-2 rounded" placeholder="E-Mail" value={email} onChange={e => setEmail(e.target.value)} required />
                    <button className="w-full bg-blue-600 text-white p-2 rounded">Senden</button>
                </form>
                <div className="mt-4 text-center"><Link to="/login" className="text-blue-500">Zurück</Link></div>
            </div>
        </div>
    );
};`,
          language: 'typescript'
      });

      // Forbidden
      files.push({
          name: 'Forbidden.tsx',
          path: `${root}/src/pages/auth/Forbidden.tsx`,
          content: `import React from 'react';
import { Link } from 'react-router-dom';

export const Forbidden = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
            <h2 className="text-2xl font-bold mb-2">Zugriff verweigert</h2>
            <p className="mb-6">Sie haben keine Berechtigung für diese Seite.</p>
            <Link to="/" className="text-blue-600 hover:underline">Zum Dashboard</Link>
        </div>
    </div>
);`,
          language: 'typescript'
      });

      // Profile
      files.push({
          name: 'Profile.tsx',
          path: `${root}/src/pages/auth/Profile.tsx`,
          content: `import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { changePassword } from '../../services/api';

export const Profile = () => {
    const { user } = useAuth();
    const [pass, setPass] = useState({ old: '', new: '' });

    const handlePwChange = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await changePassword({ oldPassword: pass.old, newPassword: pass.new });
            alert('Passwort geändert.');
            setPass({ old: '', new: '' });
        } catch { alert('Fehler beim Ändern.'); }
    };

    return (
        <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-bold mb-6">Mein Profil</h2>
            <div className="mb-4">
                <span className="text-sm font-bold text-gray-500 uppercase block">Benutzername</span>
                <span>{user?.username}</span>
            </div>
            <div className="mb-6">
                <span className="text-sm font-bold text-gray-500 uppercase block">Rolle</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{user?.role}</span>
            </div>
            <hr className="my-6"/>
            <h3 className="text-lg font-bold mb-4">Passwort ändern</h3>
            <form onSubmit={handlePwChange} className="space-y-4">
                <input className="w-full border p-2 rounded" type="password" placeholder="Altes Passwort" value={pass.old} onChange={e => setPass({...pass, old: e.target.value})} required />
                <input className="w-full border p-2 rounded" type="password" placeholder="Neues Passwort" value={pass.new} onChange={e => setPass({...pass, new: e.target.value})} required />
                <button className="bg-slate-800 text-white px-4 py-2 rounded">Ändern</button>
            </form>
        </div>
    );
};`,
          language: 'typescript'
      });
  }

  // 3. Navigation / Sidebar (Updated to hide Admin links)
  const sidebarTsx = `import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Table, Layout, FileText, Search, Database, Moon, Sun, X, Menu, LogOut, Shield, User } from 'lucide-react';
import { useTheme } from './theme-provider';
${useAuth ? "import { useAuth } from '../context/AuthContext';" : ""}

export const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  ${useAuth ? "const { logout, user } = useAuth();" : ""}
  
  const isActive = (path: string) => location.pathname.startsWith(path) ? 'bg-[${wl.primaryColor}] text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white';

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      
      <aside className={\`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[${wl.secondaryColor}] text-slate-100 flex flex-col transition-transform duration-300 \${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}\`}>
        <div className="p-6 font-bold text-xl border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
                ${wl.logoUrl ? `<img src="${wl.logoUrl}" alt="Logo" className="w-8 h-8 object-contain" />` : 
                `<div className="w-8 h-8 bg-[${wl.primaryColor}] rounded-lg flex items-center justify-center shadow-lg"><Database size={18} className="text-white"/></div>`}
                <span>${wl.appName}</span>
            </div>
            <button onClick={onClose} className="lg:hidden text-slate-400"><X size={20}/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
            
            ${queries.length > 0 ? `
            <div>
                <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Abfragen</div>
                <div className="space-y-1">
                ${queries.filter(q => q.type === 'SELECT').map(q => `<Link to="/queries/${toCamelCase(q.name)}" className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all \${isActive('/queries/${toCamelCase(q.name)}')}\`}><Search size={16}/> ${q.name}</Link>`).join('\n')}
                </div>
            </div>` : ''}

            ${reports.length > 0 ? `
            <div>
                <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Berichte</div>
                <div className="space-y-1">
                ${reports.map(r => `<Link to="/reports/${toPascalCase(r.name).toLowerCase()}Report" className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all \${isActive('/reports/${toPascalCase(r.name).toLowerCase()}Report')}\`}><FileText size={16}/> ${r.name}</Link>`).join('\n')}
                </div>
            </div>` : ''}
        </div>

        <div className="p-4 border-t border-white/10 text-center space-y-2">
            ${useAuth ? `<div className="text-xs text-slate-400 mb-2">Eingeloggt als: {user?.username} ({user?.role})</div>
            <Link to="/profile" className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium transition-colors mb-2">
                <User size={16} /> Profil
            </Link>
            <button onClick={logout} className="flex items-center justify-center gap-2 w-full bg-red-600/20 hover:bg-red-600/40 text-red-200 py-2 rounded-lg text-sm font-medium transition-colors">
                <LogOut size={16} /> Abmelden
            </button>` : ''}
            <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm font-medium transition-colors"
            >
                {theme === 'dark' ? <><Sun size={16} /> Light Mode</> : <><Moon size={16} /> Dark Mode</>}
            </button>
            <div className="text-[10px] text-slate-500 pt-2">
                &copy; {new Date().getFullYear()} ${wl.companyName}
            </div>
        </div>
      </aside>
    </>
  );
};`;
  files.push({ name: 'Sidebar.tsx', path: `${root}/src/components/Sidebar.tsx`, content: sidebarTsx, language: 'typescript' });

  // 4. Layout Wrapper (Standard)
  const layoutTsx = `import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                    <span className="font-bold text-lg dark:text-white">Menu</span>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white">
                        <Menu size={24} />
                    </button>
                </header>
                
                <div className="flex-1 overflow-auto p-4 sm:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};`;
  files.push({ name: 'Layout.tsx', path: `${root}/src/components/Layout.tsx`, content: layoutTsx, language: 'typescript' });

  // 5. Register Routes with Roles
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
  });

  // Forms, Reports, Queries default to authenticated (User)
  forms.forEach(form => {
      const compName = `${toPascalCase(form.name)}Form`;
      imports.push(`import { ${compName} } from './pages/forms/${compName}';`);
      routes.push(`<Route path="/forms/${toPascalCase(form.name).toLowerCase()}Form/:id" element={<${compName} />} />`);
  });

  reports.forEach(report => {
      const compName = `${toPascalCase(report.name)}Report`;
      imports.push(`import { ${compName} } from './pages/reports/${compName}';`);
      routes.push(`<Route path="/reports/${toPascalCase(report.name).toLowerCase()}Report" element={<${compName} />} />`);
  });

  queries.filter(q => q.type === 'SELECT').forEach(q => {
      const compName = `${toPascalCase(q.name)}Query`;
      imports.push(`import { ${compName} } from './pages/queries/${compName}';`);
      routes.push(`<Route path="/queries/${toCamelCase(q.name)}" element={<${compName} />} />`);
  });

  if (useAuth) {
      imports.push(`import { AuthProvider } from './context/AuthContext';`);
      imports.push(`import { ProtectedRoute } from './components/ProtectedRoute';`);
      imports.push(`import { Login } from './pages/auth/Login';`);
      imports.push(`import { Register } from './pages/auth/Register';`);
      imports.push(`import { ForgotPassword } from './pages/auth/ForgotPassword';`);
      imports.push(`import { Profile } from './pages/auth/Profile';`);
      imports.push(`import { Forbidden } from './pages/auth/Forbidden';`);
  }

  // App.tsx
  const appTsx = `import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { Layout } from './components/Layout';
${imports.join('\n')}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
        ${useAuth ? "<AuthProvider>" : ""}
        <BrowserRouter>
            <Routes>
                ${useAuth ? `
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/forbidden" element={<Forbidden />} />
                
                {/* Default Protected Route (All User Roles) */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/profile" element={<Profile />} />
                ` : `<Route element={<Layout><Outlet /></Layout>}>`}
                    <Route path="/" element={
                        // FIX: Removed inner <Layout> wrapper, as parent provides it
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <h1 className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight">Willkommen bei ${wl.appName}</h1>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md">Wählen Sie einen Eintrag aus dem Menü, um zu starten.</p>
                        </div>
                    } />
                    {/* Public/Standard Routes */}
                    ${queries.length > 0 || reports.length > 0 ? `<Route path="/queries/*" />` : ''}
                ${useAuth ? `</Route>` : `</Route>`}
                
                {/* Specific Table Routes (includes Admin checks) */}
                ${routes.join('\n                ')}
            </Routes>
        </BrowserRouter>
        ${useAuth ? "</AuthProvider>" : ""}
    </ThemeProvider>
  );
}
export default App;`;
  
  files.push({ name: 'App.tsx', path: `${root}/src/App.tsx`, content: appTsx, language: 'typescript' });
  
  files.push({ name: 'main.tsx', path: `${root}/src/main.tsx`, content: `import React from 'react'; import ReactDOM from 'react-dom/client'; import App from './App'; import './index.css'; ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);`, language: 'typescript' });
  files.push({ name: 'index.html', path: `${root}/index.html`, content: `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${wl.appName}</title>${wl.faviconUrl ? `<link rel="icon" type="image/x-icon" href="${wl.faviconUrl}">` : ''}</head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`, language: 'html' });

  return files;
};
