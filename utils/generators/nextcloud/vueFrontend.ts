import { Table, Form, Report, CustomPage } from '../../../types/index';
import { NextcloudAppConfig } from '../../../types/nextcloud';

export const generateVueMainTs = (config: NextcloudAppConfig): string => {
  return `import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.mount('#content')
`;
};

export const generateVueApp = (
  config: NextcloudAppConfig,
  tables: Table[] = [],
  forms: Form[] = []
): string => {
  return `<template>
  <div class="nc-app-container flex h-full">
    <!-- Nextcloud App Navigation Sidebar -->
    <aside class="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
      <div class="p-4 border-b border-slate-200 dark:border-slate-800">
        <h2 class="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>📦</span> {{ appName }}
        </h2>
        <p class="text-xs text-slate-500 mt-1">v{{ appVersion }}</p>
      </div>

      <nav class="flex-1 overflow-y-auto p-3 space-y-1">
        <div class="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Tabellen & Daten
        </div>
        <button
          v-for="table in tables"
          :key="table.name"
          @click="currentView = 'table'; activeTable = table.name"
          :class="[
            'w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between transition-colors',
            currentView === 'table' && activeTable === table.name
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          ]"
        >
          <span class="truncate">📊 {{ table.name }}</span>
          <span class="text-[10px] opacity-75">{{ table.columns?.length || 0 }} Spalten</span>
        </button>

        <div v-if="forms.length > 0" class="pt-4 px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Formulare
        </div>
        <button
          v-for="form in forms"
          :key="form.id"
          @click="currentView = 'form'; activeFormId = form.id"
          :class="[
            'w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between transition-colors',
            currentView === 'form' && activeFormId === form.id
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          ]"
        >
          <span class="truncate">📝 {{ form.name }}</span>
        </button>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-slate-950">
      <header class="h-14 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
        <div>
          <h1 class="text-sm font-bold text-slate-900 dark:text-white">
            {{ currentView === 'table' ? 'Tabelle: ' + activeTable : 'Formular-Ansicht' }}
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            ● Nextcloud OCP API aktiv
          </span>
        </div>
      </header>

      <div class="flex-1 overflow-auto p-6">
        <TableView v-if="currentView === 'table'" :tableName="activeTable" />
        <div v-else class="p-6 text-center text-slate-500">
          Formularansicht aktiv
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TableView from './views/TableView.vue'

const appName = '${config.appName || 'DB Studio App'}'
const appVersion = '${config.version || '1.0.0'}'

const tables = ref(${JSON.stringify(tables.map(t => ({ name: t.name, columns: (t.fields || []).map(f => f.name) })))})
const forms = ref(${JSON.stringify(forms.map(f => ({ id: f.id, name: f.name })))})

const currentView = ref<'table' | 'form'>('table')
const activeTable = ref(tables.value[0]?.name || '')
const activeFormId = ref(forms.value[0]?.id || '')
</script>
`;
};

export const generateVueTableView = (config: NextcloudAppConfig): string => {
  return `<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-2">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Suchen..."
          class="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          @input="fetchData"
        />
        <button
          @click="fetchData"
          class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-xs font-medium transition"
        >
          🔄 Aktualisieren
        </button>
      </div>

      <button
        @click="showCreateModal = true"
        class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition"
      >
        + Neuer Datensatz
      </button>
    </div>

    <!-- Data Table -->
    <div class="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
      <table class="w-full text-left text-xs border-collapse">
        <thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th v-for="col in columns" :key="col" class="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300">
              {{ col }}
            </th>
            <th class="px-4 py-2.5 text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
          <tr v-if="loading">
            <td :colspan="columns.length + 1" class="px-4 py-8 text-center text-slate-500">
              Lade Datensätze über Nextcloud OCP API...
            </td>
          </tr>
          <tr v-else-if="rows.length === 0">
            <td :colspan="columns.length + 1" class="px-4 py-8 text-center text-slate-500">
              Keine Datensätze vorhanden.
            </td>
          </tr>
          <tr v-for="row in rows" :key="row.id || JSON.stringify(row)" class="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
            <td v-for="col in columns" :key="col" class="px-4 py-2 text-slate-800 dark:text-slate-200">
              {{ row[col] }}
            </td>
            <td class="px-4 py-2 text-right space-x-2">
              <button @click="deleteRow(row.id)" class="text-rose-600 hover:text-rose-800 text-xs">Löschen</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { fetchTableData, deleteTableRow } from '../services/api'

const props = defineProps<{
  tableName: string
}>()

const rows = ref<any[]>([])
const columns = ref<string[]>([])
const loading = ref(false)
const searchQuery = ref('')
const showCreateModal = ref(false)

const fetchData = async () => {
  if (!props.tableName) return
  loading.value = true
  try {
    const data = await fetchTableData(props.tableName, searchQuery.value)
    rows.value = data
    if (data.length > 0) {
      columns.value = Object.keys(data[0])
    }
  } catch (err) {
    console.error('Fehler beim Laden:', err)
  } finally {
    loading.value = false
  }
}

const deleteRow = async (id: any) => {
  if (!confirm('Datensatz wirklich löschen?')) return
  await deleteTableRow(props.tableName, id)
  await fetchData()
}

watch(() => props.tableName, () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})
</script>
`;
};

export const generateVueApiService = (config: NextcloudAppConfig): string => {
  return `import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'

const APP_ID = '${config.appId || 'dbs_custom_app'}'

export async function fetchTableData(tableName: string, search?: string): Promise<any[]> {
  const slug = tableName.toLowerCase().replace(/[^a-z0-9_]+/g, '_')
  const url = generateUrl(\`/apps/\${APP_ID}/api/v1/\${slug}\`)
  const response = await axios.get(url, { params: { search } })
  return response.data
}

export async function createTableRow(tableName: string, payload: any): Promise<any> {
  const slug = tableName.toLowerCase().replace(/[^a-z0-9_]+/g, '_')
  const url = generateUrl(\`/apps/\${APP_ID}/api/v1/\${slug}\`)
  const response = await axios.post(url, payload)
  return response.data
}

export async function updateTableRow(tableName: string, id: any, payload: any): Promise<any> {
  const slug = tableName.toLowerCase().replace(/[^a-z0-9_]+/g, '_')
  const url = generateUrl(\`/apps/\${APP_ID}/api/v1/\${slug}/\${id}\`)
  const response = await axios.put(url, payload)
  return response.data
}

export async function deleteTableRow(tableName: string, id: any): Promise<boolean> {
  const slug = tableName.toLowerCase().replace(/[^a-z0-9_]+/g, '_')
  const url = generateUrl(\`/apps/\${APP_ID}/api/v1/\${slug}/\${id}\`)
  const response = await axios.delete(url)
  return response.status === 200
}
`;
};
