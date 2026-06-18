
import { Table, VirtualFile, BackendConfig, Query, SelectQuery, Relationship, Form } from '../../types/index';
import { toCamelCase, toPascalCase, isNullable, resolveType } from './common';

const generateVueTemplateForLayout = (element: any, tables: Table[]): string => {
    if (!element) return '';
    if (element.type === 'container') {
        const children = element.children?.map((c: any) => generateVueTemplateForLayout(c, tables)).join('\n') || '';
        return `<div class="${element.className || 'space-y-4'}">\n${children}\n</div>`;
    }
    if (element.type === 'label') {
        return `<div class="${element.className || 'font-bold text-lg mb-2'}">${element.label}</div>`;
    }
    if (element.type === 'field' && element.fieldId) {
        let fieldName = '';
        let inputType = 'text';
        for (const t of tables) {
            const f = t.fields.find(field => field.id === element.fieldId);
            if (f) {
                fieldName = f.name;
                if (f.type === 'INTEGER' || f.type === 'DECIMAL') inputType = 'number';
                if (f.type === 'DATE') inputType = 'date';
                break;
            }
        }
        if (!fieldName) return `<!-- Field not found -->`;
        const bindProp = toCamelCase(fieldName);
        
        return `<div class="${element.className || 'mb-4'}">
            <label class="block text-sm font-bold mb-1">${element.label}</label>
            <input v-model="data.${bindProp}" type="${inputType}" class="w-full border rounded p-2" />
        </div>`;
    }
    return '';
};

export const generateVue = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig, forms: Form[] = []): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Frontend`;
  const useAuth = config.authConfig?.useUserLogin;
  
  const wl = config.whitelabel || { appName: config.projectName || 'App', companyName: 'My Company', primaryColor: '#3b82f6', secondaryColor: '#1e293b', removeBranding: false };

  const isTailwind = config.stylingFramework === 'tailwind' || !config.stylingFramework;
  const isBootstrap = config.stylingFramework === 'bootstrap';

  const dependencies: any = { "vue": "^3.3.4", "vue-router": "^4.2.4", "axios": "^1.6.0", "lucide-vue-next": "^0.294.0" };
  const devDependencies: any = { "@vitejs/plugin-vue": "^4.2.3", "typescript": "^5.0.2", "vite": "^4.4.5", "vue-tsc": "^1.8.5" };

  if (isBootstrap) {
      dependencies["bootstrap"] = "^5.3.3";
  }

  if (isTailwind) {
      devDependencies["tailwindcss"] = "^3.3.0";
      devDependencies["postcss"] = "^8.4.0";
      devDependencies["autoprefixer"] = "^10.4.0";
  }

  // 1. Configs & Base (package.json, index.html, main.ts, router)
  files.push({
      name: 'package.json', path: `${root}/package.json`,
      content: JSON.stringify({
          "name": (config.projectName || 'app').toLowerCase() + "-vue",
          "version": "1.0.0",
          "type": "module",
          "scripts": { "dev": "vite", "build": "vue-tsc && vite build", "preview": "vite preview" },
          "dependencies": dependencies,
          "devDependencies": devDependencies
      }, null, 2),
      language: 'json'
  });

  files.push({ name: 'vite.config.ts', path: `${root}/vite.config.ts`, content: `import { defineConfig } from 'vite';\nimport vue from '@vitejs/plugin-vue';\nimport path from 'path';\n\nexport default defineConfig({\n  plugins: [vue()],\n  resolve: { alias: { '@': path.resolve(__dirname, './src') } },\n  server: { port: 3000 }\n});`, language: 'typescript' });
  
  // Tailwind & PostCSS Configs
  if (isTailwind) {
      files.push({ name: 'tailwind.config.js', path: `${root}/tailwind.config.js`, content: `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],\n  theme: { extend: {} },\n  plugins: [],\n}`, language: 'javascript' });
      files.push({ name: 'postcss.config.js', path: `${root}/postcss.config.js`, content: `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }`, language: 'javascript' });
      files.push({ name: 'style.css', path: `${root}/src/style.css`, content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;`, language: 'css' });
  } else if (isBootstrap) {
      files.push({ name: 'style.css', path: `${root}/src/style.css`, content: `@import 'bootstrap/dist/css/bootstrap.min.css';\n\nbody {\n  background-color: #f8f9fa;\n}`, language: 'css' });
  } else {
      files.push({ name: 'style.css', path: `${root}/src/style.css`, content: `/* Custom CSS here */\nbody {\n  font-family: system-ui, -apple-system, sans-serif;\n}`, language: 'css' });
  }

  // Clean Index HTML (No CDN)
  files.push({ name: 'index.html', path: `${root}/index.html`, content: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${wl.appName}</title></head><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>`, language: 'html' });
  
  // Router Setup
  let routeEntries = [
      ...tables.map(t => {
          const p = toPascalCase(t.name);
          const c = toCamelCase(t.name);
          return `{ path: '/${c}', component: () => import('@/views/${p}List.vue') },\n    { path: '/${c}/:id', component: () => import('@/views/${p}Form.vue') }`;
      }),
      ...forms.map(f => {
          const p = toPascalCase(f.name);
          return `{ path: '/forms/${p.toLowerCase()}/:id', component: () => import('@/views/forms/${p}.vue') }`;
      })
  ];

  if (useAuth) {
      routeEntries = [`{ path: '/login', component: () => import('@/views/auth/Login.vue') }`, ...routeEntries];
  }

  const routerContent = `import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    ${routeEntries.join(',\n    ')}
  ]
});

export default router;`;
  files.push({ name: 'router.ts', path: `${root}/src/router/index.ts`, content: routerContent, language: 'typescript' });

  // 2. Views - Custom Designed Forms
  forms.forEach(form => {
      const p = toPascalCase(form.name);
      const sourceTable = tables.find(t => t.id === form.sourceId);
      if (!sourceTable) return;
      
      const camelTable = toCamelCase(sourceTable.name);
      const layoutHtml = form.layout ? generateVueTemplateForLayout(form.layout, tables) : '<p>Kein Layout.</p>';
      
      const content = `<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { get, post, put } from '@/services/api';

const route = useRoute();
const router = useRouter();
const data = ref<any>({});
const isNew = route.params.id === 'new';

onMounted(async () => {
    if (!isNew) {
        const res = await get('${camelTable}/' + route.params.id);
        data.value = res.data || res;
    }
});

const save = async () => {
    if (isNew) await post('${camelTable}', data.value);
    else await put('${camelTable}/' + route.params.id, data.value);
    router.push('/${camelTable}');
};
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="bg-white p-8 rounded shadow">
        <h1 class="text-2xl font-bold mb-6">${form.name}</h1>
        <form @submit.prevent="save">
            ${layoutHtml}
            <div class="mt-8 flex justify-end gap-3">
                <button type="button" @click="router.back()" class="px-4 py-2 border rounded">Abbrechen</button>
                <button class="px-6 py-2 bg-primary text-white rounded font-bold">Speichern</button>
            </div>
        </form>
    </div>
  </div>
</template>`;
      files.push({ name: `${p}.vue`, path: `${root}/src/views/forms/${p}.vue`, content, language: 'html' });
  });

  // Basic List & Form Views for Tables
  tables.forEach(table => {
      const p = toPascalCase(table.name);
      const c = toCamelCase(table.name);
      const pk = toCamelCase(table.fields.find(f => f.isPrimaryKey)?.name || 'id');

      // List View
      files.push({
          name: `${p}List.vue`, path: `${root}/src/views/${p}List.vue`,
          content: `<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { get, remove } from '@/services/api';
import { Plus, Edit, Trash2 } from 'lucide-vue-next';

const items = ref<any[]>([]);
const load = async () => { const res = await get('${c}'); items.value = res.data || res; };
onMounted(load);
const del = async (id: any) => { if(confirm('Löschen?')) { await remove('${c}/' + id); load(); } };
</script>
<template>
  <div>
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">${table.name}</h1>
        <router-link to="/${c}/new" class="bg-primary text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={16}/> Neu</router-link>
    </div>
    <div class="bg-white rounded shadow overflow-hidden">
        <table class="w-full text-left">
            <thead class="bg-gray-50 border-b">
                <tr>${table.fields.map(f => `<th class="p-4 font-bold text-sm text-gray-600">${f.name}</th>`).join('')}<th class="p-4"></th></tr>
            </thead>
            <tbody>
                <tr v-for="i in items" :key="i.${pk}" class="border-b hover:bg-gray-50">
                    ${table.fields.map(f => `<td class="p-4 text-sm">{{i.${toCamelCase(f.name)}}}</td>`).join('')}
                    <td class="p-4 text-right">
                        <router-link :to="'/${c}/' + i.${pk}" class="text-blue-600 mr-4"><Edit size={16}/></router-link>
                        <button @click="del(i.${pk})" class="text-red-600"><Trash2 size={16}/></button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
  </div>
</template>`, language: 'html'
      });

      // Default Form View (if no custom form exists)
      if (!forms.some(f => f.sourceId === table.id)) {
          files.push({
              name: `${p}Form.vue`, path: `${root}/src/views/${p}Form.vue`,
              content: `<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { get, post, put } from '@/services/api';
const route = useRoute(); const router = useRouter();
const data = ref<any>({}); const isNew = route.params.id === 'new';
onMounted(async () => { if(!isNew) { const res = await get('${c}/' + route.params.id); data.value = res.data || res; } });
const save = async () => { if(isNew) await post('${c}', data.value); else await put('${c}/' + route.params.id, data.value); router.push('/${c}'); };
</script>
<template>
  <div class="max-w-2xl mx-auto bg-white p-8 rounded shadow">
    <h1 class="text-xl font-bold mb-6">{{ isNew ? 'Neu' : 'Bearbeiten' }} ${table.name}</h1>
    <form @submit.prevent="save">
        ${table.fields.filter(f => !f.isPrimaryKey).map(f => `
        <div class="mb-4">
            <label class="block text-sm font-bold mb-1">${f.name}</label>
            <input v-model="data.${toCamelCase(f.name)}" class="w-full border rounded p-2" />
        </div>`).join('')}
        <div class="mt-6 flex justify-end gap-2">
            <button type="button" @click="router.back()" class="px-4 py-2 border rounded">Abbrechen</button>
            <button class="px-4 py-2 bg-primary text-white rounded">Speichern</button>
        </div>
    </form>
  </div>
</template>`, language: 'html'
          });
      }
  });

  // Base files (Sidebar, App, style)
  files.push({ name: 'main.ts', path: `${root}/src/main.ts`, content: `import { createApp } from 'vue';\nimport './style.css';\nimport App from './App.vue';\nimport router from './router';\n\ncreateApp(App).use(router).mount('#app');`, language: 'typescript' });
  
  // UPDATED: Added withCredentials: true
  const apiContent = "import axios from 'axios';\nconst API_URL = 'http://localhost:" + config.port + "/api';\nconst api = axios.create({ baseURL: API_URL, withCredentials: true });\nexport const get = async (e: string, p?: any) => (await api.get(e, { params: p })).data;\nexport const post = async (e: string, d: any) => (await api.post(e, d)).data;\nexport const put = async (e: string, d: any) => (await api.put(e, d)).data;\nexport const remove = async (e: string) => await api.delete(e);";
  files.push({ name: 'api.ts', path: `${root}/src/services/api.ts`, content: apiContent, language: 'typescript' });

  return files;
};
