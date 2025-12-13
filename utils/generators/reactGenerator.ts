
import { Table, Query, SelectQuery, VirtualFile, Relationship, BackendConfig } from '../../types/index';
import { resolveType, isNullable } from './common';

// Helper: Convert string to camelCase (e.g. "KundenID" -> "kundenID")
const toCamelCase = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toLowerCase() + str.slice(1);
};

export const generateReact = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Frontend`;

  // 1. package.json
  const packageJson = {
    "name": "react-client",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc && vite build",
      "preview": "vite preview"
    },
    "dependencies": {
      "axios": "^1.6.2",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-router-dom": "^6.20.0",
      "lucide-react": "^0.294.0"
    },
    "devDependencies": {
      "@types/react": "^18.2.37",
      "@types/react-dom": "^18.2.15",
      "@vitejs/plugin-react": "^4.2.0",
      "autoprefixer": "^10.4.16",
      "postcss": "^8.4.31",
      "tailwindcss": "^3.3.5",
      "typescript": "^5.2.2",
      "vite": "^5.0.0"
    }
  };
  files.push({ name: 'package.json', path: `${root}/package.json`, content: JSON.stringify(packageJson, null, 2), language: 'json' });

  // 2. vite.config.ts
  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})
`;
  files.push({ name: 'vite.config.ts', path: `${root}/vite.config.ts`, content: viteConfig, language: 'typescript' });

  // 3. Tailwind & CSS
  files.push({ name: 'tailwind.config.js', path: `${root}/tailwind.config.js`, content: `export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`, language: 'javascript' });

  files.push({ name: 'index.css', path: `${root}/src/index.css`, content: `@tailwind base;
@tailwind components;
@tailwind utilities;`, language: 'css' });

  // 4. API Service & Config
  const apiService = `import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:${config.port}/api';

export const api = axios.create({
  baseURL: API_URL
});

export const get = async <T>(endpoint: string) => {
  const response = await api.get<T>(endpoint);
  return response.data;
};

export const post = async <T>(endpoint: string, data: any) => {
  const response = await api.post<T>(endpoint, data);
  return response.data;
};

export const put = async <T>(endpoint: string, data: any) => {
  const response = await api.put<T>(endpoint, data);
  return response.data;
};

export const remove = async (endpoint: string) => {
  await api.delete(endpoint);
};
`;
  files.push({ name: 'api.ts', path: `${root}/src/services/api.ts`, content: apiService, language: 'typescript' });

  // 5. Types
  let typesContent = '';
  tables.forEach(table => {
    // Basic Fields
    const props = table.fields.map(f => {
        const tsType = resolveType(f, 'typescript');
        const optional = isNullable(f) ? '?' : '';
        return `  ${toCamelCase(f.name)}${optional}: ${tsType};`;
    });

    // Relations
    const parentRels = relationships.filter(r => r.toTableId === table.id);
    parentRels.forEach(r => {
        const parent = tables.find(t => t.id === r.fromTableId);
        if(parent) props.push(`  ${toCamelCase(parent.name)}?: ${parent.name};`);
    });

    const childRels = relationships.filter(r => r.fromTableId === table.id);
    childRels.forEach(r => {
        const child = tables.find(t => t.id === r.toTableId);
        if(child) props.push(`  ${toCamelCase(child.name)}s?: ${child.name}[];`);
    });

    typesContent += `export interface ${table.name} {\n${props.join('\n')}\n}\n\n`;
  });
  files.push({ name: 'types.ts', path: `${root}/src/types/index.ts`, content: typesContent, language: 'typescript' });

  // 6. Pages (List & Form for each table)
  tables.forEach(table => {
      const camelName = toCamelCase(table.name);
      const pkField = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
      const pkName = toCamelCase(pkField.name);

      // List Component
      const listComp = `import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ${table.name} } from '../types';
import { get, remove } from '../services/api';
import { Trash2, Edit, Plus } from 'lucide-react';

export const ${table.name}List = () => {
  const [items, setItems] = useState<${table.name}[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
        const data = await get<${table.name}[]>('${table.name.toLowerCase()}');
        setItems(data);
    } catch (err) {
        console.error(err);
    }
  };

  const handleDelete = async (id: any) => {
    if(!confirm('Wirklich löschen?')) return;
    try {
        await remove(\`${table.name.toLowerCase()}/\${id}\`);
        loadData();
    } catch (err) {
        alert('Fehler beim Löschen');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">${table.name} Liste</h1>
        <Link to="/${table.name.toLowerCase()}/new" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
            <Plus size={16}/> Neu
        </Link>
      </div>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              ${table.fields.slice(0, 5).map(f => `<th className="p-4 font-semibold">${f.name}</th>`).join('\n              ')}
              <th className="p-4">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.${pkName}} className="border-b hover:bg-gray-50">
                ${table.fields.slice(0, 5).map(f => `<td className="p-4">{String(item.${toCamelCase(f.name)} || '')}</td>`).join('\n                ')}
                <td className="p-4 flex gap-2">
                  <Link to={\`/${table.name.toLowerCase()}/\${item.${pkName}}\`} className="text-blue-600 hover:text-blue-800"><Edit size={16}/></Link>
                  <button onClick={() => handleDelete(item.${pkName})} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};`;
      files.push({ name: `${table.name}List.tsx`, path: `${root}/src/pages/${table.name}/${table.name}List.tsx`, content: listComp, language: 'typescript' });

      // Form Component
      const formComp = `import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ${table.name} } from '../../types';
import { get, post, put } from '../../services/api';

export const ${table.name}Form = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Partial<${table.name}>>({});

  useEffect(() => {
    if (id && id !== 'new') {
        loadData();
    }
  }, [id]);

  const loadData = async () => {
      try {
          const item = await get<${table.name}>(\`${table.name.toLowerCase()}/\${id}\`);
          setData(item);
      } catch (err) {
          console.error(err);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (id && id !== 'new') {
              await put(\`${table.name.toLowerCase()}/\${id}\`, data);
          } else {
              await post('${table.name.toLowerCase()}', data);
          }
          navigate('/${table.name.toLowerCase()}');
      } catch (err) {
          alert('Speichern fehlgeschlagen');
      }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{id === 'new' ? 'Neuer Eintrag' : 'Bearbeiten'} - ${table.name}</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
        ${table.fields.map(f => `
        <div>
            <label className="block text-sm font-medium text-gray-700">${f.name}</label>
            <input 
                type="${f.type === 'INTEGER' || f.type === 'DECIMAL' ? 'number' : f.type === 'DATE' ? 'date' : 'text'}" 
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                value={data.${toCamelCase(f.name)} || ''}
                ${f.isPrimaryKey && f.isAutoIncrement ? 'disabled' : ''}
                onChange={e => setData({...data, ${toCamelCase(f.name)}: e.target.value})}
            />
        </div>`).join('')}
        
        <div className="pt-4 flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Speichern</button>
            <button type="button" onClick={() => navigate(-1)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded">Abbrechen</button>
        </div>
      </form>
    </div>
  );
};`;
      files.push({ name: `${table.name}Form.tsx`, path: `${root}/src/pages/${table.name}/${table.name}Form.tsx`, content: formComp, language: 'typescript' });
  });

  // 7. App.tsx (Routing)
  const routes = tables.map(t => {
      return `          <Route path="/${t.name.toLowerCase()}" element={<${t.name}List />} />\n          <Route path="/${t.name.toLowerCase()}/:id" element={<${t.name}Form />} />`;
  }).join('\n');

  const imports = tables.map(t => {
      return `import { ${t.name}List } from './pages/${t.name}/${t.name}List';\nimport { ${t.name}Form } from './pages/${t.name}/${t.name}Form';`;
  }).join('\n');

  const navLinks = tables.map(t => `            <Link to="/${t.name.toLowerCase()}" className="block py-2 px-4 hover:bg-gray-700">${t.name}</Link>`).join('\n');

  const appTsx = `import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
${imports}

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-100 font-sans">
        <aside className="w-64 bg-gray-800 text-white shrink-0">
          <div className="p-4 font-bold text-xl border-b border-gray-700">${config.projectName}</div>
          <nav className="mt-4">
${navLinks}
          </nav>
        </aside>
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<div className="p-10 text-center text-gray-500">Willkommen im Dashboard</div>} />
${routes}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
`;
  files.push({ name: 'App.tsx', path: `${root}/src/App.tsx`, content: appTsx, language: 'typescript' });

  // 8. Main.tsx
  const mainTsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
  files.push({ name: 'main.tsx', path: `${root}/src/main.tsx`, content: mainTsx, language: 'typescript' });

  // 9. Index.html
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  files.push({ name: 'index.html', path: `${root}/index.html`, content: indexHtml, language: 'html' });

  return files;
};
