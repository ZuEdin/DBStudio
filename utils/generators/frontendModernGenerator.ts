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
        scripts: { dev: 'vite', build: 'tsc && vite build' },
        dependencies: {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          '@tanstack/react-query': '^5.51.1',
          zustand: '^4.5.4',
          'lucide-react': '^0.400.0',
        },
      },
      null,
      2
    );

    files['src/App.tsx'] = `import React from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-50 p-8 font-sans">
        <h1 className="text-2xl font-bold text-slate-800">React 19 + TanStack Query v5 Enterprise App</h1>
        <p className="text-sm text-slate-600 mt-2">Modern React Patterns with Zustand and Headless UI</p>
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
