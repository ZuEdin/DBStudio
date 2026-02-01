
import { Table, Form, Report, VirtualFile, BackendConfig, Query } from '../../../types/index';
import { toPascalCase, toCamelCase } from '../common';

export const generateReactStructure = (tables: Table[], forms: Form[], reports: Report[], config: BackendConfig, root: string, queries: Query[] = []): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const routes: string[] = [];
  const imports: string[] = [];

  // Whitelabel Defaults
  const wl = config.whitelabel || {
      appName: config.projectName,
      companyName: 'My Company',
      primaryColor: '#3b82f6',
      secondaryColor: '#1e293b',
      removeBranding: false
  };

  // 1. Theme Context
  const themeContext = `import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};`;
  files.push({ name: 'theme-provider.tsx', path: `${root}/src/components/theme-provider.tsx`, content: themeContext, language: 'typescript' });

  // 2. Navigation / Sidebar (Whitelabel Aware)
  const sidebarTsx = `import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Table, Layout, FileText, Search, Database, Moon, Sun, X, Menu } from 'lucide-react';
import { useTheme } from './theme-provider';

export const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  
  // Whitelabel: Primary Color is used for active state
  const isActive = (path: string) => location.pathname.startsWith(path) ? 'bg-[${wl.primaryColor}] text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      
      {/* Sidebar - Whitelabel: Secondary Color for background */}
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
                ${tables.map(t => `<Link to="/${toCamelCase(t.name)}" className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all \${isActive('/${toCamelCase(t.name)}')}\`}><Table size={16}/> ${t.name}</Link>`).join('\n')}
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

        <div className="p-4 border-t border-white/10 text-center">
            <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg text-sm font-medium transition-colors mb-4"
            >
                {theme === 'dark' ? <><Sun size={16} /> Light Mode</> : <><Moon size={16} /> Dark Mode</>}
            </button>
            <div className="text-[10px] text-slate-500">
                &copy; {new Date().getFullYear()} ${wl.companyName}
                ${!wl.removeBranding ? '<br/>Powered by DB Studio Pro' : ''}
            </div>
        </div>
      </aside>
    </>
  );
};`;
  files.push({ name: 'Sidebar.tsx', path: `${root}/src/components/Sidebar.tsx`, content: sidebarTsx, language: 'typescript' });

  // 3. Layout Wrapper
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

  // 4. Register Routes
  // Table Lists
  tables.forEach(table => {
      const pascalName = toPascalCase(table.name);
      const camelName = toCamelCase(table.name);
      const listName = `${pascalName}List`;
      imports.push(`import { ${listName} } from './pages/${pascalName}/${listName}';`);
      routes.push(`<Route path="/${camelName}" element={<${listName} />} />`);
  });

  // Forms
  forms.forEach(form => {
      const compName = `${toPascalCase(form.name)}Form`;
      imports.push(`import { ${compName} } from './pages/forms/${compName}';`);
      routes.push(`<Route path="/forms/${toPascalCase(form.name).toLowerCase()}Form/:id" element={<${compName} />} />`);
  });

  // Reports
  reports.forEach(report => {
      const compName = `${toPascalCase(report.name)}Report`;
      imports.push(`import { ${compName} } from './pages/reports/${compName}';`);
      routes.push(`<Route path="/reports/${toPascalCase(report.name).toLowerCase()}Report" element={<${compName} />} />`);
  });

  // Queries
  queries.filter(q => q.type === 'SELECT').forEach(q => {
      const compName = `${toPascalCase(q.name)}Query`;
      imports.push(`import { ${compName} } from './pages/queries/${compName}';`);
      routes.push(`<Route path="/queries/${toCamelCase(q.name)}" element={<${compName} />} />`);
  });

  // App.tsx
  const appTsx = `import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { Layout } from './components/Layout';
${imports.join('\n')}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <h1 className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight">Willkommen bei ${wl.appName}</h1>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md">Wählen Sie einen Eintrag aus dem Menü, um zu starten.</p>
                        </div>
                    } />
                    ${routes.join('\n                    ')}
                </Routes>
            </Layout>
        </BrowserRouter>
    </ThemeProvider>
  );
}
export default App;`;
  
  files.push({ name: 'App.tsx', path: `${root}/src/App.tsx`, content: appTsx, language: 'typescript' });
  
  // Main Entry (ensure styles imported)
  files.push({ name: 'main.tsx', path: `${root}/src/main.tsx`, content: `import React from 'react'; import ReactDOM from 'react-dom/client'; import App from './App'; import './index.css'; ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);`, language: 'typescript' });
  files.push({ name: 'index.html', path: `${root}/index.html`, content: `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${wl.appName}</title>${wl.faviconUrl ? `<link rel="icon" type="image/x-icon" href="${wl.faviconUrl}">` : ''}</head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`, language: 'html' });

  return files;
};
