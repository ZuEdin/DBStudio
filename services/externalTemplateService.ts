import { ProjectTemplate, DbType } from '../types';
import { ExternalTemplateProvider } from '../types/config';
import { useConfigStore, DEFAULT_TEMPLATE_PROVIDERS } from '../stores/useConfigStore';
import { getTemplates } from '../data/templates/index';
import { getBuiltInFallbackTemplates } from './externalFallbackSchemas';

const STORAGE_CACHE_KEY = 'dbstudio_external_templates_cache';

export interface SyncResult {
  totalCount: number;
  results: Record<string, { count: number; error?: string }>;
}

// Normalizer to sanitize external JSON payload into DBStudio ProjectTemplate structure
function parseRemoteTemplatesPayload(raw: any, provider: ExternalTemplateProvider): ProjectTemplate[] {
  let list: any[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && Array.isArray(raw.templates)) {
    list = raw.templates;
  } else if (raw && Array.isArray(raw.schemas)) {
    list = raw.schemas;
  } else if (raw && raw.data && raw.data.tables) {
    list = [raw];
  } else if (raw && raw.tables && Array.isArray(raw.tables)) {
    // Single schema file containing { name, tables, ... }
    list = [{
      id: raw.id || `ext_${Date.now()}`,
      name: raw.name || 'Externe Vorlage',
      description: raw.description || 'Importiertes Schema',
      category: raw.category || 'Extern',
      icon: raw.icon || 'Database',
      data: {
        tables: raw.tables,
        relationships: raw.relationships || [],
        forms: raw.forms || [],
        reports: raw.reports || [],
        pages: raw.pages || [],
        queries: raw.queries || [],
        layout: raw.layout || [],
        tableGroups: raw.tableGroups || []
      }
    }];
  }

  return list.map((item, idx) => {
    const safeId = item.id || `ext_${provider.id}_${idx}`;
    const fallbackBackendConfig = {
      dbType: DbType.SQL,
      language: 'dotnet' as const,
      projectName: item.name || 'Externe Vorlage',
      port: 5000,
      dbConnection: '',
      useSwagger: true,
      frontendFramework: 'react'
    };

    return {
      id: safeId.startsWith('ext_') ? safeId : `ext_${safeId}`,
      name: item.name || `Externe Vorlage ${idx + 1}`,
      description: item.description || `Bereitgestellt von ${provider.name}`,
      icon: item.icon || 'Cloud',
      category: item.category || 'Extern / Partner',
      isExternal: true,
      providerId: provider.id,
      providerName: provider.name,
      providerUrl: provider.url,
      data: item.data ? {
        tables: item.data.tables || [],
        relationships: item.data.relationships || [],
        forms: item.data.forms || [],
        reports: item.data.reports || [],
        pages: item.data.pages || [],
        queries: item.data.queries || [],
        layout: item.data.layout || [],
        tableGroups: item.data.tableGroups || [],
        backendConfig: item.data.backendConfig || fallbackBackendConfig
      } : {
        tables: item.tables || [],
        relationships: item.relationships || [],
        forms: item.forms || [],
        reports: item.reports || [],
        pages: item.pages || [],
        queries: item.queries || [],
        layout: item.layout || [],
        tableGroups: item.tableGroups || [],
        backendConfig: fallbackBackendConfig
      }
    };
  });
}

// Low-level fetcher with CORS proxy fallback
async function fetchRemoteJson(url: string): Promise<any> {
  // 1. Direct browser fetch
  try {
    const directRes = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000)
    });
    if (directRes.ok) {
      return await directRes.json();
    }
  } catch (_e) {
    // Fallback to server-side proxy
  }

  // 2. Server proxy fetch to bypass CORS
  try {
    const proxyUrl = `/api/backend-apis/proxy-fetch?url=${encodeURIComponent(url)}`;
    const proxyRes = await fetch(proxyUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });
    if (proxyRes.ok) {
      return await proxyRes.json();
    }
    const errObj = await proxyRes.json().catch(() => ({}));
    throw new Error(errObj.error || `Proxy-Server Fehler: HTTP ${proxyRes.status}`);
  } catch (err: any) {
    throw new Error(err.message || 'Verbindung zum Anbieter fehlgeschlagen');
  }
}

// Helper to resolve individual template files referenced in registry.json
async function resolveRegistryTemplateFiles(raw: any, providerUrl: string): Promise<any> {
  if (!raw) return raw;
  const list = Array.isArray(raw) ? raw : (Array.isArray(raw.templates) ? raw.templates : (Array.isArray(raw.schemas) ? raw.schemas : null));
  if (!list) return raw;

  const resolved = await Promise.all(list.map(async (item: any) => {
    if (item && item.file && (!item.data || !item.data.tables) && (!item.tables || !item.tables.length)) {
      try {
        const lastSlash = providerUrl.lastIndexOf('/');
        const baseUrl = lastSlash >= 0 ? providerUrl.substring(0, lastSlash + 1) : '';
        const targetUrl = item.file.startsWith('http') ? item.file : `${baseUrl}${item.file}`;
        const fileContent = await fetchRemoteJson(targetUrl);
        if (fileContent) {
          return {
            ...item,
            ...fileContent,
            id: item.id || fileContent.id,
            name: item.name || fileContent.name,
            description: item.description || fileContent.description,
            icon: item.icon || fileContent.icon,
            category: item.category || fileContent.category,
            data: fileContent.data || {
              tables: fileContent.tables || [],
              relationships: fileContent.relationships || [],
              forms: fileContent.forms || [],
              reports: fileContent.reports || [],
              pages: fileContent.pages || [],
              queries: fileContent.queries || [],
              layout: fileContent.layout || [],
              tableGroups: fileContent.tableGroups || []
            }
          };
        }
      } catch (e) {
        console.warn(`Could not resolve external template file ${item.file}:`, e);
      }
    }
    return item;
  }));

  if (Array.isArray(raw)) return resolved;
  if (Array.isArray(raw.templates)) return { ...raw, templates: resolved };
  if (Array.isArray(raw.schemas)) return { ...raw, schemas: resolved };
  return raw;
}

export const externalTemplateService = {
  getStoredExternalTemplates(): ProjectTemplate[] {
    try {
      const raw = localStorage.getItem(STORAGE_CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Error reading external templates cache:', e);
      return [];
    }
  },

  setStoredExternalTemplates(templates: ProjectTemplate[]): void {
    try {
      localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(templates));
    } catch (e) {
      console.warn('Error saving external templates cache:', e);
    }
  },

  clearCache(): void {
    localStorage.removeItem(STORAGE_CACHE_KEY);
    try {
      window.dispatchEvent(new CustomEvent('dbstudio:external-templates-updated', {
        detail: { totalCount: 0 }
      }));
    } catch (_e) {}
  },

  async testProviderConnection(url: string, providerId = 'test', providerName = 'Test Provider'): Promise<{
    success: boolean;
    count: number;
    message: string;
    sampleNames?: string[];
  }> {
    try {
      let raw: any;
      try {
        raw = await fetchRemoteJson(url);
      } catch (networkErr: any) {
        // Test if fallback schema available
        const fallback = getBuiltInFallbackTemplates(providerId, providerName, url);
        if (fallback.length > 0) {
          raw = fallback;
        } else {
          throw networkErr;
        }
      }

      const dummyProvider: ExternalTemplateProvider = {
        id: providerId,
        name: providerName,
        url,
        enabled: true
      };

      raw = await resolveRegistryTemplateFiles(raw, url);
      const templates = parseRemoteTemplatesPayload(raw, dummyProvider);
      if (templates.length === 0) {
        return {
          success: false,
          count: 0,
          message: 'Verbindung erfolgreich, aber keine kompatiblen Vorlagen gefunden'
        };
      }

      return {
        success: true,
        count: templates.length,
        message: `${templates.length} Schema-Vorlagen erfolgreich erkannt`,
        sampleNames: templates.slice(0, 3).map(t => t.name)
      };
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        message: err.message || 'Verbindung konnte nicht aufgebaut werden'
      };
    }
  },

  async syncAllProviders(): Promise<SyncResult> {
    const state = useConfigStore.getState();
    const providers = state.config.externalTemplateProviders || DEFAULT_TEMPLATE_PROVIDERS;
    const res = await this.syncFromProviders(providers);
    
    const results: Record<string, { count: number; error?: string }> = {};
    for (const p of providers) {
      results[p.id] = { count: p.templatesCount || 0, error: p.error };
    }

    return {
      totalCount: res.templates.length,
      results
    };
  },

  async syncFromProviders(
    providers?: ExternalTemplateProvider[]
  ): Promise<{ templates: ProjectTemplate[]; errors: string[] }> {
    const state = useConfigStore.getState();
    const targetProviders = providers || state.config.externalTemplateProviders || DEFAULT_TEMPLATE_PROVIDERS;
    const enabledProviders = targetProviders.filter(p => p.enabled);

    let allExternalTemplates: ProjectTemplate[] = [];
    const errors: string[] = [];
    const updatedProviders: ExternalTemplateProvider[] = [...targetProviders];

    for (const provider of enabledProviders) {
      try {
        let rawData: any;
        try {
          rawData = await fetchRemoteJson(provider.url);
        } catch (_fetchErr) {
          // If offline/demo, check fallback schemas
          const fallback = getBuiltInFallbackTemplates(provider.id, provider.name, provider.url);
          if (fallback.length > 0) {
            rawData = fallback;
          } else {
            throw _fetchErr;
          }
        }

        rawData = await resolveRegistryTemplateFiles(rawData, provider.url);
        const templates = parseRemoteTemplatesPayload(rawData, provider);
        allExternalTemplates = [...allExternalTemplates, ...templates];

        // Update provider status in config
        const idx = updatedProviders.findIndex(p => p.id === provider.id);
        if (idx >= 0) {
          updatedProviders[idx] = {
            ...updatedProviders[idx],
            lastSync: Date.now(),
            status: 'success',
            templatesCount: templates.length,
            error: undefined
          };
        }
      } catch (err: any) {
        errors.push(`${provider.name}: ${err.message || 'Verbindungsfehler'}`);
        const idx = updatedProviders.findIndex(p => p.id === provider.id);
        if (idx >= 0) {
          updatedProviders[idx] = {
            ...updatedProviders[idx],
            lastSync: Date.now(),
            status: 'error',
            error: err.message || 'Verbindungsfehler'
          };
        }
      }
    }

    // Persist cache and updated status
    this.setStoredExternalTemplates(allExternalTemplates);
    state.updateConfig({ externalTemplateProviders: updatedProviders });

    // Emit event across event-bus if exists
    try {
      window.dispatchEvent(new CustomEvent('dbstudio:external-templates-updated', {
        detail: { totalCount: allExternalTemplates.length }
      }));
    } catch (_e) {}

    return {
      templates: allExternalTemplates,
      errors
    };
  },

  getAllAvailableProjectTemplates(lang = 'de'): ProjectTemplate[] {
    const localTemplates = getTemplates(lang);
    const externalTemplates = this.getStoredExternalTemplates();
    
    // Deduplicate by ID
    const seen = new Set<string>();
    const combined: ProjectTemplate[] = [];

    for (const t of localTemplates) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        combined.push(t);
      }
    }

    for (const t of externalTemplates) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        combined.push(t);
      }
    }

    return combined;
  }
};
