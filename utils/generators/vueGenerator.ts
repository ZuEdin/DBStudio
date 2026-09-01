import {
  Table,
  Relationship,
  Query,
  BackendConfig,
  VirtualFile,
  Form,
  Report,
  CustomPage,
} from '../../types/index';
import { toPascalCase } from './common';

export const generateVue = (
  tables: Table[] = [],
  relationships: Relationship[] = [],
  queries: Query[] = [],
  config: BackendConfig,
  forms: Form[] = [],
  reports: Report[] = [],
  pages: CustomPage[] = [],
  customComponents: any[] = []
): VirtualFile[] => {
  const root = 'Frontend';
  const projectName = config.projectName || 'VueClient';
  const port = config.frontendPort || 3000;
  const backendPort = config.port || 5000;
  const files: VirtualFile[] = [];

  // 1. package.json
  files.push({
    name: 'package.json',
    path: `${root}/package.json`,
    content: JSON.stringify(
      {
        name: projectName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        private: true,
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vue-tsc && vite build',
          preview: 'vite preview',
        },
        dependencies: {
          vue: '^3.5.0',
          'vue-router': '^4.4.0',
          pinia: '^2.2.0',
          'lucide-vue-next': '^0.438.0',
          axios: '^1.7.0',
        },
        devDependencies: {
          '@vitejs/plugin-vue': '^5.1.0',
          typescript: '~5.5.3',
          'vue-tsc': '^2.0.29',
          vite: '^5.4.0',
          tailwindcss: '^3.4.0',
          autoprefixer: '^10.4.0',
          postcss: '^8.4.0',
        },
      },
      null,
      2
    ),
    language: 'json',
  });

  // 2. vite.config.ts
  files.push({
    name: 'vite.config.ts',
    path: `${root}/vite.config.ts`,
    content: `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: ${port},
    proxy: {
      '/api': {
        target: 'http://localhost:${backendPort}',
        changeOrigin: true,
      },
    },
  },
});
`,
    language: 'typescript',
  });

  // 3. index.html
  files.push({
    name: 'index.html',
    path: `${root}/index.html`,
    content: `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body class="bg-slate-50 text-slate-900 antialiased">
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
    language: 'html',
  });

  // 4. src/main.ts
  files.push({
    name: 'main.ts',
    path: `${root}/src/main.ts`,
    content: `import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
`,
    language: 'typescript',
  });

  // 5. src/style.css
  files.push({
    name: 'style.css',
    path: `${root}/src/style.css`,
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
    language: 'css',
  });

  // 6. src/router/index.ts
  const routes = [
    `{ path: '/', name: 'home', component: () => import('../views/DashboardView.vue') }`,
    ...tables.map(
      (t) =>
        `{ path: '/tables/${t.name.toLowerCase()}', name: 'table-${t.name.toLowerCase()}', component: () => import('../views/TableView.vue'), props: { tableName: '${t.name}' } }`
    ),
  ];

  files.push({
    name: 'index.ts',
    path: `${root}/src/router/index.ts`,
    content: `import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ${routes.join(',\n    ')}
  ],
});

export default router;
`,
    language: 'typescript',
  });

  // 7. src/services/apiService.ts
  files.push({
    name: 'apiService.ts',
    path: `${root}/src/services/apiService.ts`,
    content: `import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const tableApi = {
  getAll: async (tableName: string) => {
    const res = await api.get(\`/tables/\${tableName.toLowerCase()}\`);
    return res.data;
  },
  getById: async (tableName: string, id: string | number) => {
    const res = await api.get(\`/tables/\${tableName.toLowerCase()}/\${id}\`);
    return res.data;
  },
  create: async (tableName: string, data: any) => {
    const res = await api.post(\`/tables/\${tableName.toLowerCase()}\`, data);
    return res.data;
  },
  update: async (tableName: string, id: string | number, data: any) => {
    const res = await api.put(\`/tables/\${tableName.toLowerCase()}/\${id}\`, data);
    return res.data;
  },
  delete: async (tableName: string, id: string | number) => {
    const res = await api.delete(\`/tables/\${tableName.toLowerCase()}/\${id}\`);
    return res.data;
  },
};

export default api;
`,
    language: 'typescript',
  });

  // 8. src/App.vue
  files.push({
    name: 'App.vue',
    path: `${root}/src/App.vue`,
    content: `<template>
  <div class="min-h-screen flex bg-slate-100">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 text-slate-100 flex flex-col p-4">
      <div class="text-xl font-bold mb-6 text-blue-400 flex items-center gap-2">
        <span>${projectName}</span>
      </div>
      <nav class="space-y-1">
        <router-link
          to="/"
          class="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          active-class="bg-blue-600 text-white"
        >
          Dashboard
        </router-link>
        <div class="pt-4 pb-1 text-xs font-semibold uppercase text-slate-400">Tabellen</div>
        ${tables
          .map(
            (t) => `
        <router-link
          to="/tables/${t.name.toLowerCase()}"
          class="block px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors"
          active-class="bg-blue-600 text-white"
        >
          ${t.name}
        </router-link>`
          )
          .join('')}
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-8 overflow-y-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
// Main layout setup
</script>
`,
    language: 'html',
  });

  // 9. src/views/DashboardView.vue
  files.push({
    name: 'DashboardView.vue',
    path: `${root}/src/views/DashboardView.vue`,
    content: `<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-800 mb-2">Willkommen bei ${projectName}</h1>
    <p class="text-slate-600 mb-6">Generiertes Vue 3 + TypeScript Enterprise Frontend</p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div class="text-sm font-medium text-slate-500">Verfügbare Tabellen</div>
        <div class="text-3xl font-bold text-slate-800 mt-2">${tables.length}</div>
      </div>
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div class="text-sm font-medium text-slate-500">Abfragen (Queries)</div>
        <div class="text-3xl font-bold text-slate-800 mt-2">${queries.length}</div>
      </div>
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div class="text-sm font-medium text-slate-500">Formulare</div>
        <div class="text-3xl font-bold text-slate-800 mt-2">${forms.length}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Dashboard View
</script>
`,
    language: 'html',
  });

  // 10. src/views/TableView.vue
  files.push({
    name: 'TableView.vue',
    path: `${root}/src/views/TableView.vue`,
    content: `<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Tabelle: {{ tableName }}</h1>
      <button
        @click="loadData"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        Aktualisieren
      </button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-slate-500">Lade Daten...</div>
      <div v-else-if="records.length === 0" class="p-8 text-center text-slate-500">
        Keine Datensätze vorhanden.
      </div>
      <table v-else class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50">
          <tr>
            <th
              v-for="key in Object.keys(records[0])"
              :key="key"
              class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
            >
              {{ key }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-slate-200">
          <tr v-for="(row, idx) in records" :key="idx" class="hover:bg-slate-50">
            <td v-for="(val, k) in row" :key="k" class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
              {{ val }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { tableApi } from '../services/apiService';

const props = defineProps<{ tableName: string }>();
const records = ref<any[]>([]);
const loading = ref(false);

const loadData = async () => {
  loading.value = true;
  try {
    const data = await tableApi.getAll(props.tableName);
    records.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Failed to load table data', err);
    records.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);
watch(() => props.tableName, loadData);
</script>
`,
    language: 'html',
  });

  // 11. README.md
  files.push({
    name: 'README.md',
    path: `${root}/README.md`,
    content: `# ${projectName} (Vue 3 Client)

Dieses Frontend wurde automatisch mit **Vue 3 + Vite + TypeScript + Pinia** generiert.

## 🚀 Schnellstart

\`\`\`bash
cd Frontend
npm install
npm run dev
\`\`\`
`,
    language: 'markdown',
  });

  return files;
};
