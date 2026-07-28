
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConfigStore, AppConfig } from '../types';

const initialConfig: AppConfig = {
  mode: 'DEMO',
  storage: 'local',
  apiUrl: 'http://localhost:5000',
  isConfigured: false
};

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      config: initialConfig,
      updateConfig: (patch) => set((state) => ({
        config: { ...state.config, ...patch, isConfigured: true }
      })),
      resetConfig: () => set({ config: initialConfig })
    }),
    {
      name: 'db-studio-config'
    }
  )
);

export function getApiUrl(path: string): string {
  const config = useConfigStore.getState().config;
  let baseUrl = (config.apiUrl || 'http://localhost:5000').trim();
  if (baseUrl) {
    if (!/^https?:\/\//i.test(baseUrl)) {
      baseUrl = `http://${baseUrl}`;
    }
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    
    if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
      return `${cleanBase}${cleanPath.slice(4)}`;
    }
    return `${cleanBase}${cleanPath}`;
  }
  return path;
}

