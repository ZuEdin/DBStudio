
import { Table, Form, Report, VirtualFile, BackendConfig, Query } from '../../../types/index';
import { toPascalCase, toCamelCase } from '../common';

export const generateReactStructure = (tables: Table[], forms: Form[], reports: Report[], config: BackendConfig, root: string, queries: Query[] = []): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const routes: string[] = [];
  const imports: string[] = [];

  // 1. Table Lists
  tables.forEach(table => {
      const pascalName = toPascalCase(table.name);
      const camelName = toCamelCase(table.name);
      const listName = `${pascalName}List`;
      imports.push(`import { ${listName} } from './pages/${pascalName}/${listName}';`);
      routes.push(`<Route path="/${camelName}" element={<${listName} />} />`);
  });

  // 2. Forms
  forms.forEach(form => {
      const compName = `${toPascalCase(form.name)}Form`;
      imports.push(`import { ${compName} } from './pages/forms/${compName}';`);
      routes.push(`<Route path="/forms/${toPascalCase(form.name).toLowerCase()}Form/:id" element={<${compName} />} />`);
  });

  // 3. Reports
  reports.forEach(report => {
      const compName = `${toPascalCase(report.name)}Report`;
      imports.push(`import { ${compName} } from './pages/reports/${compName}';`);
      routes.push(`<Route path="/reports/${toPascalCase(report.name).toLowerCase()}Report" element={<${compName} />} />`);
  });

  // 4. Queries (Select)
  queries.filter(q => q.type === 'SELECT').forEach(q => {
      const compName = `${toPascalCase(q.name)}Query`;
      imports.push(`import { ${compName} } from './pages/queries/${compName}';`);
      routes.push(`<Route path="/queries/${toCamelCase(q.name)}" element={<${compName} />} />`);
  });

  // App.tsx
  const appTsx = `import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
${imports.join('\n')}

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-100 font-sans text-slate-800">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<div className="p-10 text-center text-slate-500">Willkommen</div>} />
            ${routes.join('\n            ')}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
export default App;`;
  
  files.push({ name: 'App.tsx', path: `${root}/src/App.tsx`, content: appTsx, language: 'typescript' });
  
  // Sidebar (Updated to include Queries)
  const sidebarTsx = `import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Layout, FileText, Search, Database } from 'lucide-react';

export const Sidebar = () => (
  <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen overflow-y-auto">
    <div className="p-4 font-bold text-xl border-b border-slate-700 flex items-center gap-2"><Database/> ${config.projectName}</div>
    <div className="p-2 space-y-4">
        <div>
            <div className="px-2 text-xs font-bold text-slate-500 uppercase mb-2">Tabellen</div>
            ${tables.map(t => `<Link to="/${toCamelCase(t.name)}" class="flex items-center gap-2 px-2 py-1 hover:text-blue-300"><Table size={16}/> ${t.name}</Link>`).join('\n')}
        </div>
        <div>
            <div className="px-2 text-xs font-bold text-slate-500 uppercase mb-2">Abfragen</div>
            ${queries.filter(q => q.type === 'SELECT').map(q => `<Link to="/queries/${toCamelCase(q.name)}" class="flex items-center gap-2 px-2 py-1 hover:text-blue-300"><Search size={16}/> ${q.name}</Link>`).join('\n')}
        </div>
        <div>
            <div className="px-2 text-xs font-bold text-slate-500 uppercase mb-2">Berichte</div>
            ${reports.map(r => `<Link to="/reports/${toPascalCase(r.name).toLowerCase()}Report" class="flex items-center gap-2 px-2 py-1 hover:text-blue-300"><FileText size={16}/> ${r.name}</Link>`).join('\n')}
        </div>
    </div>
  </aside>
);`;
  files.push({ name: 'Sidebar.tsx', path: `${root}/src/components/Sidebar.tsx`, content: sidebarTsx, language: 'typescript' });

  // Main Entry
  files.push({ name: 'main.tsx', path: `${root}/src/main.tsx`, content: `import React from 'react'; import ReactDOM from 'react-dom/client'; import App from './App'; import './index.css'; ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);`, language: 'typescript' });
  files.push({ name: 'index.html', path: `${root}/index.html`, content: `<!doctype html><html lang="en"><head><title>${config.projectName}</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`, language: 'html' });

  return files;
};
