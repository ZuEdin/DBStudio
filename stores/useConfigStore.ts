
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConfigStore, AppConfig } from '../types';

const initialConfig: AppConfig = {
  mode: 'DEMO',
  storage: 'local',
  apiUrl: '',
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
