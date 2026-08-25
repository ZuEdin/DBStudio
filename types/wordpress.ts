import { Table, Query, Form, Report, CustomPage } from './index';

export interface WordPressPluginConfig {
  pluginName: string;
  pluginSlug: string;
  pluginUri?: string;
  description: string;
  version: string;
  author: string;
  authorUri?: string;
  textDomain: string;
  license: string;
  requiresPhp: string;
  requiresWp: string;
  menuTitle: string;
  menuIcon: string;
  menuPosition: number;
  capability: string;
  tablePrefix: string;
  enableRestApi: boolean;
  enableShortcodes: boolean;
  enableGutenberg: boolean;
  enableAdminMenu: boolean;
  enableCustomTables: boolean;
  enableRolePermissions: boolean;
  includedTableIds: string[];
  includedFormIds: string[];
  includedReportIds: string[];
  includedPageIds: string[];
  includedQueryIds: string[];
  customPostTypeMapping?: Record<string, string>;
  publicSubmissions: boolean;
}

export interface WordPressShortcodeDef {
  tag: string;
  name: string;
  type: 'form' | 'table' | 'report' | 'page' | 'app';
  targetId: string;
  targetName: string;
  description: string;
  example: string;
}
