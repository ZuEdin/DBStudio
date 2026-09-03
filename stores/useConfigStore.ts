
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConfigStore, AppConfig, ExternalTemplateProvider } from '../types';

export const DEFAULT_TEMPLATE_PROVIDERS: ExternalTemplateProvider[] = [
  {
    id: 'provider_community_hub',
    name: 'DBStudio Community Standards Hub',
    url: 'https://raw.githubusercontent.com/ZuEdin/dbstudio-templates/refs/heads/main/community-standard-templates/registry.json',
    enabled: true,
    description: 'Community-Vorlagen (Kaffeekasse, Geräteverleih, Kursbuchung, Agile Sprint, CMS, IoT, Spenden)'
  },
  {
    id: 'provider_enterprise_schemes',
    name: 'Enterprise Industry Standards Hub',
    url: 'https://raw.githubusercontent.com/ZuEdin/dbstudio-templates/refs/heads/main/enterprise-standard-templates/registry.json',
    enabled: true,
    description: 'Enterprise-Vorlagen (CRM Pipeline, Projektmanagement, IT-Helpdesk, Fuhrpark, HR, Warenwirtschaft)'
  }
];

const initialConfig: AppConfig = {
  mode: 'DEMO',
  storage: 'local',
  apiUrl: 'http://localhost:5000',
  isConfigured: false,
  externalTemplateProviders: DEFAULT_TEMPLATE_PROVIDERS
};

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      config: initialConfig,
      updateConfig: (patch) => set((state) => ({
        config: { 
          ...state.config, 
          ...patch, 
          isConfigured: true,
          externalTemplateProviders: patch.externalTemplateProviders || state.config.externalTemplateProviders || DEFAULT_TEMPLATE_PROVIDERS
        }
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
  let baseUrl = (config.apiUrl || '').trim();

  const cleanPath = path.startsWith('/') ? path : '/' + path;
  const envBase = ((import.meta as any).env?.BASE_URL || '/').replace(/\/$/, '');
  const relativeFallback = envBase ? `${envBase}${cleanPath}` : cleanPath;

  // If not explicitly configured as SELF_HOST, or if using default http://localhost:5000,
  // use relative path (respecting subfolder base if deployed under a subfolder)
  if ((config.mode as string) !== 'SELF_HOST' || !baseUrl || baseUrl === 'http://localhost:5000' || baseUrl === 'http://localhost:5000/') {
    return relativeFallback;
  }

  // If baseUrl is a relative path (e.g. /dbstudio or /subfolder/api)
  if (baseUrl.startsWith('/')) {
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
      return `${cleanBase}${cleanPath.slice(4)}`;
    }
    return `${cleanBase}${cleanPath}`;
  }

  if (!/^https?:\/\//i.test(baseUrl)) {
    baseUrl = `http://${baseUrl}`;
  }
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
    return `${cleanBase}${cleanPath.slice(4)}`;
  }
  return `${cleanBase}${cleanPath}`;
}

