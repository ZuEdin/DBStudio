
export type AppMode = 'DEMO' | 'REGISTERED';
export type StorageTarget = 'local' | 'server';

export interface ExternalTemplateProvider {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  lastSync?: number;
  status?: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
  templatesCount?: number;
  description?: string;
}

export interface AppConfig {
  mode: AppMode;
  storage: StorageTarget;
  apiUrl: string;
  isConfigured: boolean;
  externalTemplateProviders?: ExternalTemplateProvider[];
}

export interface ConfigStore {
  config: AppConfig;
  updateConfig: (patch: Partial<AppConfig>) => void;
  resetConfig: () => void;
}
