import { Table } from '../../types';

export interface FrontendOptions {
  framework: 'REACT_19' | 'ANGULAR_19' | 'VUE_35' | 'SVELTE_5';
}

export const generateModernFrontendProject = (
  tables: Table[],
  options: FrontendOptions
): Record<string, string> => {
  const files: Record<string, string> = {};

  if (options.framework === 'REACT_19') {
    files['package.json'] = JSON.stringify(
      {
        name: 'react-19-enterprise',
        private: true,
        version: '1.0.0',
        type: 'module',
        scripts: { 
          dev: 'vite', 
          build: 'tsc && vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          '@tanstack/react-query': '^5.51.1',
          zustand: '^4.5.4',
          'lucide-react': '^0.400.0',
          clsx: '^2.1.1',
          'tailwind-merge': '^2.3.0',
        },
        devDependencies: {
          '@types/react': '^19.0.0',
          '@types/react-dom': '^19.0.0',
          '@types/node': '^20.12.0',
          '@vitejs/plugin-react': '^4.3.4',
          autoprefixer: '^10.4.19',
          postcss: '^8.4.38',
          tailwindcss: '^3.4.4',
          typescript: '^5.4.5',
          vite: '^5.4.14',
        },
      },
      null,
      2
    );

    files['vite.config.ts'] = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets resolve properly when hosted anywhere
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: true,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@tanstack') || id.includes('zustand')) {
              return 'vendor-state';
            }
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
});`;

    files['tailwind.config.js'] = `export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};`;

    files['postcss.config.js'] = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`;

    files['tsconfig.json'] = JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*'],
          },
          strict: false,
        },
        include: ['src'],
      },
      null,
      2
    );

    files['index.html'] = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React 19 Enterprise App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

    files['src/index.css'] = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #f8fafc;
}`;

    files['src/main.tsx'] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

    files['src/App.tsx'] = `import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-50 p-8 font-sans">
        <h1 className="text-2xl font-bold text-slate-800">React 19 + TanStack Query v5 Enterprise App</h1>
        <p className="text-sm text-slate-600 mt-2">Modern React Patterns with Zustand, Tailwind CSS and Vite</p>
      </div>
    </QueryClientProvider>
  );
}`;
  } else if (options.framework === 'ANGULAR_19') {
    files['src/app/app.component.ts'] = `import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <div className="p-6">
      <h1 className="text-xl font-bold">Angular 19 Standalone Signals</h1>
      <p>Count: {{ count() }}</p>
      <button (click)="increment()" className="px-3 py-1 bg-blue-600 text-white rounded">Increment</button>
    </div>
  \`
})
export class AppComponent {
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);

  increment() {
    this.count.update(n => n + 1);
  }
}`;
  } else if (options.framework === 'VUE_35') {
    files['src/App.vue'] = `<script setup lang="ts">
import { ref } from 'vue';
import { useMainStore } from './stores/main';

const store = useMainStore();
</script>

<template>
  <div class="p-6">
    <h1 class="text-xl font-bold">Vue 3.5 Composition API + Pinia</h1>
  </div>
</template>`;
  } else if (options.framework === 'SVELTE_5') {
    files['src/App.svelte'] = `<script>
  // Svelte 5 Runes ($state, $derived, $props)
  let count = $state(0);
  let double = $derived(count * 2);

  function increment() {
    count += 1;
  }
</script>

<div class="p-6 font-sans">
  <h1 class="text-xl font-bold text-slate-900">Svelte 5 Runes Reaktivität</h1>
  <p class="mt-2 text-slate-600">Count: {count} (Double: {double})</p>
  <button onclick={increment} class="mt-4 px-4 py-2 bg-emerald-600 text-white rounded font-bold">
    Erhöhen
  </button>
</div>`;
  }

  return files;
};
