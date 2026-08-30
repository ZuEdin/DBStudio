/**
 * Multi-DB Sync Matrix & Hybrid-Replication Types
 * Heterogeneous Database Replication between Local SQLite and Cloud PostgreSQL
 */

export type ReplicationDirection = 'bidirectional' | 'sqlite_to_postgres' | 'postgres_to_sqlite';

export type ConflictStrategy = 
  | 'last_write_wins'       // Zeitstempel-basiert (neuester Schreibzugriff gewinnt)
  | 'server_authoritative'  // Cloud/PostgreSQL gewinnt immer
  | 'client_authoritative'  // Lokale SQLite-Änderungen überschreiben Cloud
  | 'interactive_merge'     // Visueller 3-Wege-Konfliktdialog pro Feld
  | 'custom_eval';          // JavaScript Expression Regel

export type ReplicationSyncMode = 'full_snapshot' | 'cdc_delta' | 'filtered_subset';

export type ReplicationFrequency = 'realtime_event' | 'interval_5s' | 'interval_30s' | 'interval_5m' | 'manual';

export type SyncStatus = 'in_sync' | 'syncing' | 'pending' | 'conflict' | 'error';

export interface ColumnMapping {
  sourceColumn: string;
  targetColumn: string;
  sourceType: string;
  targetType: string;
  transform?: 'none' | 'trim' | 'uppercase' | 'json_stringify' | 'json_parse' | 'hash_sha256' | 'encrypt' | 'coalesce_null';
  isKey?: boolean;
}

export interface ReplicationRule {
  id: string;
  tableName: string;
  targetTableName: string;
  direction: ReplicationDirection;
  conflictStrategy: ConflictStrategy;
  enabled: boolean;
  syncMode: ReplicationSyncMode;
  filterCriteria?: string; // e.g. "status != 'ARCHIVED'" or "tenant_id = 'T001'"
  columnMappings: ColumnMapping[];
  frequency: ReplicationFrequency;
  lastSyncTimestamp?: number;
  syncStatus: SyncStatus;
  rowCountLocal: number;
  rowCountCloud: number;
  lagMs: number;
  customEvalScript?: string;
  autoResolveBatch?: boolean;
}

export interface SyncConflictRecord {
  id: string;
  ruleId: string;
  tableName: string;
  primaryKeyValue: string | number;
  detectedAt: number;
  localRow: Record<string, any>;
  remoteRow: Record<string, any>;
  baseRow?: Record<string, any>;
  localUpdatedAt: number;
  remoteUpdatedAt: number;
  conflictingColumns: string[];
  status: 'pending' | 'resolved' | 'ignored';
  resolvedValue?: Record<string, any>;
  resolutionApplied?: ConflictStrategy;
  resolvedAt?: number;
}

export interface SyncExecutionLogItem {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success';
  tableName?: string;
  message: string;
  details?: any;
}

export interface SyncExecutionReport {
  id: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'success' | 'partial' | 'failed';
  totalTables: number;
  insertedLocal: number;
  updatedLocal: number;
  deletedLocal: number;
  insertedCloud: number;
  updatedCloud: number;
  deletedCloud: number;
  conflictCount: number;
  resolvedCount: number;
  logs: SyncExecutionLogItem[];
}

export interface SyncMatrixConfig {
  globalDefaultStrategy: ConflictStrategy;
  defaultBatchSize: number;
  autoResolveThresholdSec: number;
  enableTombstoneTracking: boolean;
  cloudPostgresConfig: {
    host: string;
    port: number;
    database: string;
    user: string;
    schema: string;
    ssl: boolean;
  };
  localSqliteConfig: {
    dbPath: string;
    inMemory: boolean;
    journalMode: 'WAL' | 'DELETE' | 'MEMORY';
  };
}
