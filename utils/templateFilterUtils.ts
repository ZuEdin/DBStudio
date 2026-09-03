import { ProjectTemplate } from '../types';
import { ExternalTemplateProvider } from '../types/config';

export type TemplateFilterType = 'all' | 'community' | 'enterprise' | 'builtin' | string;

export interface ProviderTabInfo {
  id: string;
  name: string;
  count: number;
  iconType: 'all' | 'community' | 'enterprise' | 'provider' | 'builtin';
  description?: string;
  url?: string;
  isExternal?: boolean;
}

const COMMUNITY_ID_KEYWORDS = [
  'coffee_fund',
  'device_rental',
  'course_booking',
  'agile_pm',
  'agile_scrum_board',
  'cms_template',
  'cms_blog_editorial',
  'iot_machine_telemetry',
  'dbstudio_cluster_management',
  'fundraising_donations'
];

const ENTERPRISE_ID_KEYWORDS = [
  'ecommerce_orders',
  'crm_suite',
  'fakturierung_suite',
  'hr_directory',
  'inventory_app',
  'iot_telemetry',
  'pm_taskboard',
  'dbstudio_selfhost',
  'healthcare_iso27799',
  'ext_healthcare_iso27799',
  'fleet_logistics',
  'ext_fleet_logistics',
  'it_helpdesk'
];

export function isCommunityTemplate(tpl: ProjectTemplate): boolean {
  if (tpl.providerId === 'provider_community_hub') return true;
  if (tpl.providerName && /community/i.test(tpl.providerName)) return true;
  if (tpl.category && /(community|verein|club|bildung|education|non-profit|spende)/i.test(tpl.category)) return true;
  const idLower = tpl.id.toLowerCase();
  return COMMUNITY_ID_KEYWORDS.some(k => idLower.includes(k));
}

export function isEnterpriseTemplate(tpl: ProjectTemplate): boolean {
  if (tpl.providerId === 'provider_enterprise_schemes') return true;
  if (tpl.providerName && /enterprise/i.test(tpl.providerName)) return true;
  if (tpl.category && /(enterprise|erp|crm|iso|compliance|logistik|fleet|handel|faktura)/i.test(tpl.category)) return true;
  const idLower = tpl.id.toLowerCase();
  return ENTERPRISE_ID_KEYWORDS.some(k => idLower.includes(k));
}

export function getTemplateProviderTabs(
  templates: ProjectTemplate[],
  configuredProviders: ExternalTemplateProvider[] = []
): ProviderTabInfo[] {
  const allCount = templates.length;
  const communityCount = templates.filter(isCommunityTemplate).length;
  const enterpriseCount = templates.filter(isEnterpriseTemplate).length;
  const builtinCount = templates.filter(t => !t.isExternal).length;

  const tabs: ProviderTabInfo[] = [
    {
      id: 'all',
      name: 'Alle Vorlagen',
      count: allCount,
      iconType: 'all',
      description: 'Alle verfügbaren Datenbankschemen und Templates aus allen Quellen'
    },
    {
      id: 'community',
      name: 'Community Standards',
      count: communityCount,
      iconType: 'community',
      description: 'Open-Source & Community-Vorlagen (Kaffeekasse, Verleih, Kursbuchung, Agile Sprint, CMS, IoT)'
    },
    {
      id: 'enterprise',
      name: 'Enterprise Standards',
      count: enterpriseCount,
      iconType: 'enterprise',
      description: 'Professionelle Unternehmensschemen (CRM Pipeline, Projektmanagement, IT-Helpdesk, Fuhrpark, HR)'
    }
  ];

  // Detect custom third-party providers
  const customProviders = configuredProviders.filter(
    p => p.id !== 'provider_community_hub' && p.id !== 'provider_enterprise_schemes'
  );

  for (const prov of customProviders) {
    const pCount = templates.filter(t => t.providerId === prov.id || t.providerName === prov.name).length;
    tabs.push({
      id: `provider_${prov.id}`,
      name: prov.name,
      count: pCount,
      iconType: 'provider',
      description: prov.description || `Vorlagen von ${prov.url}`,
      url: prov.url,
      isExternal: true
    });
  }

  // Also tab for built-in offline templates
  tabs.push({
    id: 'builtin',
    name: 'Lokale Vorlagen',
    count: builtinCount,
    iconType: 'builtin',
    description: 'Integrierte Offline-Vorlagen von DBStudio Pro'
  });

  return tabs;
}

export function filterProjectTemplates(
  templates: ProjectTemplate[],
  activeTab: string,
  searchQuery: string
): ProjectTemplate[] {
  let list = templates;

  if (activeTab === 'community') {
    list = list.filter(isCommunityTemplate);
  } else if (activeTab === 'enterprise') {
    list = list.filter(isEnterpriseTemplate);
  } else if (activeTab === 'builtin') {
    list = list.filter(t => !t.isExternal);
  } else if (activeTab.startsWith('provider_')) {
    const provId = activeTab.replace('provider_', '');
    list = list.filter(t => t.providerId === provId || t.providerId === activeTab || (t.providerName && t.providerName.toLowerCase().includes(provId.toLowerCase())));
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(t => {
      const matchName = t.name.toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchCat = (t.category || '').toLowerCase().includes(q);
      const matchTables = (t.data?.tables || []).some(tbl => tbl.name.toLowerCase().includes(q));
      return matchName || matchDesc || matchCat || matchTables;
    });
  }

  return list;
}
