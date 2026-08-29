/**
 * Cloud Provider & BaaS Plugin Interfaces
 * Provides decoupled, standalone abstraction for BaaS exports:
 * - Supabase (PostgreSQL DDL, RLS Policies, Triggers)
 * - PocketBase (pb_schema.json, Collection Rules, Field Mapping)
 * - Self-Hosted PostgreSQL / SQLite
 */

import { Table, Relationship } from './index';

export interface CloudProviderExportResult {
  providerId: string;
  providerName: string;
  files: {
    fileName: string;
    language: 'sql' | 'json' | 'typescript' | 'markdown';
    content: string;
    description: string;
  }[];
  notes?: string[];
}

export interface ICloudSyncProvider {
  id: string;
  name: string;
  description: string;
  category: 'baas' | 'sql' | 'nosql';
  generateExport: (tables: Table[], relationships: Relationship[], options?: Record<string, any>) => CloudProviderExportResult;
}
