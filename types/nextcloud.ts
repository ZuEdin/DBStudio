export interface NextcloudAppConfig {
  appId: string; // e.g. 'dbs_custom_app'
  appName: string; // e.g. 'DB Studio App'
  description: string;
  version: string;
  author: string;
  authorEmail?: string;
  authorWebsite?: string;
  license: 'AGPL-3.0-or-later' | 'GPL-3.0-or-later' | 'MIT' | 'Apache-2.0';
  minNextcloudVersion: string; // e.g. '27'
  maxNextcloudVersion: string; // e.g. '31'
  category: 'organization' | 'tools' | 'office' | 'multimedia' | 'custom';
  
  // Features
  enableRestApi: boolean;
  enableVueFrontend: boolean;
  enableNavigationMenu: boolean;
  enableGroupPermissions: boolean;
  enableMigrations: boolean;
  enableCronBackgroundJobs: boolean;
  enableActivityStream: boolean;
  enableWebhookDispatcher: boolean;
  enablePublicNoCSRF: boolean;

  // Selected Entities
  includedTableIds: string[];
  includedFormIds: string[];
  includedReportIds: string[];
  includedQueryIds: string[];

  // Database / Multi-Backend Support
  supportedDbEngines: ('sqlite' | 'mysql' | 'postgres' | 'oracle')[];
  tablePrefix: string;
}

export type NcTab = 'metadata' | 'entities' | 'architecture' | 'frontend' | 'apidoc' | 'preview';
