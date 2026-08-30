/**
 * Multi-DB Sync & Hybrid Replication Engine
 * Handles replication execution, conflict detection, resolution strategies, and DDL generation.
 */

import { ReplicationRule, SyncConflictRecord, SyncExecutionReport, SyncExecutionLogItem, ConflictStrategy } from '../types';
import { HeterogeneousTypeMapper } from './heterogeneousTypeMapper';
import { Table } from '../../../types';

export class SyncMatrixEngine {
  /**
   * Generates default replication rules from DB Studio project tables
   */
  public static createDefaultRulesForTables(tables: Table[]): ReplicationRule[] {
    return tables.map((tbl) => {
      const pkeyField = tbl.fields.find(f => f.isPrimaryKey) || tbl.fields[0];
      const columnMappings = tbl.fields.map(f => ({
        sourceColumn: f.name,
        targetColumn: f.name.toLowerCase(),
        sourceType: f.type,
        targetType: HeterogeneousTypeMapper.getPostgresType(f.type),
        transform: 'none' as const,
        isKey: f.isPrimaryKey
      }));

      const rowCount = Array.isArray(tbl.data) ? tbl.data.length : 0;

      return {
        id: `rule_${tbl.id}`,
        tableName: tbl.name,
        targetTableName: `public.${tbl.name.toLowerCase()}`,
        direction: 'bidirectional',
        conflictStrategy: 'last_write_wins',
        enabled: true,
        syncMode: 'cdc_delta',
        columnMappings,
        frequency: 'interval_30s',
        syncStatus: 'in_sync',
        rowCountLocal: rowCount,
        rowCountCloud: rowCount,
        lagMs: 12,
        autoResolveBatch: true
      };
    });
  }

  /**
   * Detects conflicts between a local SQLite record and a remote PostgreSQL record
   */
  public static detectRowConflict(
    rule: ReplicationRule,
    localRow: Record<string, any>,
    remoteRow: Record<string, any>,
    baseRow?: Record<string, any>
  ): SyncConflictRecord | null {
    const keyField = rule.columnMappings.find(m => m.isKey)?.sourceColumn || 'id';
    const primaryKeyValue = localRow[keyField] || remoteRow[keyField];

    const localUpdatedAt = new Date(localRow.updated_at || localRow.modified_at || Date.now() - 60000).getTime();
    const remoteUpdatedAt = new Date(remoteRow.updated_at || remoteRow.modified_at || Date.now() - 30000).getTime();

    // Check conflicting columns
    const conflictingColumns: string[] = [];
    rule.columnMappings.forEach(mapping => {
      const localVal = localRow[mapping.sourceColumn];
      const remoteVal = remoteRow[mapping.targetColumn] ?? remoteRow[mapping.sourceColumn];

      if (localVal !== undefined && remoteVal !== undefined && String(localVal) !== String(remoteVal)) {
        conflictingColumns.push(mapping.sourceColumn);
      }
    });

    if (conflictingColumns.length === 0) {
      return null;
    }

    return {
      id: `conflict_${rule.tableName}_${primaryKeyValue}_${Date.now()}`,
      ruleId: rule.id,
      tableName: rule.tableName,
      primaryKeyValue,
      detectedAt: Date.now(),
      localRow: { ...localRow },
      remoteRow: { ...remoteRow },
      baseRow: baseRow ? { ...baseRow } : undefined,
      localUpdatedAt,
      remoteUpdatedAt,
      conflictingColumns,
      status: 'pending'
    };
  }

  /**
   * Resolves a conflict based on the configured strategy
   */
  public static resolveConflict(
    conflict: SyncConflictRecord,
    strategy: ConflictStrategy,
    customMergedPayload?: Record<string, any>,
    customScript?: string
  ): { resolvedValue: Record<string, any>; winner: 'local' | 'remote' | 'merged' } {
    if (strategy === 'server_authoritative') {
      return {
        resolvedValue: { ...conflict.remoteRow, synced_at: new Date().toISOString() },
        winner: 'remote'
      };
    }

    if (strategy === 'client_authoritative') {
      return {
        resolvedValue: { ...conflict.localRow, synced_at: new Date().toISOString() },
        winner: 'local'
      };
    }

    if (strategy === 'last_write_wins') {
      const localNewer = conflict.localUpdatedAt >= conflict.remoteUpdatedAt;
      return {
        resolvedValue: localNewer 
          ? { ...conflict.localRow, synced_at: new Date().toISOString() }
          : { ...conflict.remoteRow, synced_at: new Date().toISOString() },
        winner: localNewer ? 'local' : 'remote'
      };
    }

    if (strategy === 'interactive_merge' && customMergedPayload) {
      return {
        resolvedValue: { ...customMergedPayload, synced_at: new Date().toISOString() },
        winner: 'merged'
      };
    }

    if (strategy === 'custom_eval' && customScript) {
      try {
        const evalFn = new Function('local', 'remote', 'base', customScript);
        const result = evalFn(conflict.localRow, conflict.remoteRow, conflict.baseRow);
        if (result && typeof result === 'object') {
          return { resolvedValue: { ...result, synced_at: new Date().toISOString() }, winner: 'merged' };
        }
      } catch (err) {
        console.warn('Custom eval script failed, falling back to LWW:', err);
      }
    }

    // Default fallback to LWW
    const localNewer = conflict.localUpdatedAt >= conflict.remoteUpdatedAt;
    return {
      resolvedValue: localNewer ? conflict.localRow : conflict.remoteRow,
      winner: localNewer ? 'local' : 'remote'
    };
  }

  /**
   * Generates PostgreSQL CDC Shadow Triggers and Logical Replication DDL
   */
  public static generatePostgresCdcDdl(rules: ReplicationRule[]): string {
    const activeRules = rules.filter(r => r.enabled);
    const tableStatements = activeRules.map(rule => {
      const cleanTable = rule.tableName.toLowerCase();
      return `-- ==========================================================
-- 🔄 CDC Trigger for Table: ${cleanTable} (Cloud PostgreSQL)
-- ==========================================================
CREATE TABLE IF NOT EXISTS _dbstudio_cdc_${cleanTable} (
    cdc_id BIGSERIAL PRIMARY KEY,
    operation VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    record_id TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    replicated_to_sqlite BOOLEAN DEFAULT FALSE
);

CREATE OR REPLACE FUNCTION fn_cdc_${cleanTable}()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO _dbstudio_cdc_${cleanTable} (operation, record_id, old_data, captured_at)
        VALUES ('DELETE', OLD.id::TEXT, to_jsonb(OLD), NOW());
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO _dbstudio_cdc_${cleanTable} (operation, record_id, old_data, new_data, captured_at)
        VALUES ('UPDATE', NEW.id::TEXT, to_jsonb(OLD), to_jsonb(NEW), NOW());
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO _dbstudio_cdc_${cleanTable} (operation, record_id, new_data, captured_at)
        VALUES ('INSERT', NEW.id::TEXT, to_jsonb(NEW), NOW());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cdc_${cleanTable} ON "${cleanTable}";
CREATE TRIGGER trg_cdc_${cleanTable}
AFTER INSERT OR UPDATE OR DELETE ON "${cleanTable}"
FOR EACH ROW EXECUTE FUNCTION fn_cdc_${cleanTable}();
`;
    }).join('\n\n');

    return `-- Multi-DB Sync Matrix: PostgreSQL Publication & CDC Triggers
-- Dialect: PostgreSQL 14+ / Supabase / Neon / RDS

-- 1. Create DB Studio Sync Publication (Logical Replication)
CREATE PUBLICATION dbstudio_replication_pub FOR ALL TABLES;

${tableStatements}
`;
  }

  /**
   * Generates SQLite Local Shadow Log Triggers DDL
   */
  public static generateSqliteCdcDdl(rules: ReplicationRule[]): string {
    const activeRules = rules.filter(r => r.enabled);
    const tableStatements = activeRules.map(rule => {
      const t = rule.tableName;
      return `-- 📦 SQLite CDC Trigger for "${t}"
CREATE TABLE IF NOT EXISTS _sqlite_cdc_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id TEXT NOT NULL,
    payload_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_synced INTEGER DEFAULT 0
);

CREATE TRIGGER IF NOT EXISTS trg_${t}_insert_cdc AFTER INSERT ON "${t}"
BEGIN
    INSERT INTO _sqlite_cdc_log (table_name, operation, record_id, payload_json)
    VALUES ('${t}', 'INSERT', NEW.id, json_object('id', NEW.id, 'updated_at', CURRENT_TIMESTAMP));
END;

CREATE TRIGGER IF NOT EXISTS trg_${t}_update_cdc AFTER UPDATE ON "${t}"
BEGIN
    INSERT INTO _sqlite_cdc_log (table_name, operation, record_id, payload_json)
    VALUES ('${t}', 'UPDATE', NEW.id, json_object('id', NEW.id, 'updated_at', CURRENT_TIMESTAMP));
END;

CREATE TRIGGER IF NOT EXISTS trg_${t}_delete_cdc AFTER DELETE ON "${t}"
BEGIN
    INSERT INTO _sqlite_cdc_log (table_name, operation, record_id, payload_json)
    VALUES ('${t}', 'DELETE', OLD.id, json_object('id', OLD.id));
END;`;
    }).join('\n\n');

    return `-- Multi-DB Sync Matrix: SQLite Shadow Triggers
${tableStatements}
`;
  }

  /**
   * Generates a sample conflict simulation for demo / verification
   */
  public static generateSampleConflict(rule: ReplicationRule): SyncConflictRecord {
    const baseId = 101;
    const now = Date.now();
    return {
      id: `sim_conflict_${rule.tableName}_${baseId}`,
      ruleId: rule.id,
      tableName: rule.tableName,
      primaryKeyValue: baseId,
      detectedAt: now,
      localRow: {
        id: baseId,
        titel: 'Baustelle A - Aushubarbeiten (Offline Baustelle)',
        status: 'In Bearbeitung',
        netto_betrag: 4850.00,
        notizen: 'Erdarbeiten planmäßig vorangetrieben, 3 Mann vor Ort.',
        updated_at: new Date(now - 1000 * 60 * 5).toISOString() // 5 mins ago
      },
      remoteRow: {
        id: baseId,
        titel: 'Baustelle A - Aushub & Fundament (Zentrale)',
        status: 'Freigegeben',
        netto_betrag: 5200.00,
        notizen: 'Zusätzliche Freigabe für Fundamentsockel durch Bauleitung erteilt.',
        updated_at: new Date(now - 1000 * 60 * 2).toISOString() // 2 mins ago (newer)
      },
      baseRow: {
        id: baseId,
        titel: 'Baustelle A - Aushubarbeiten',
        status: 'Offen',
        netto_betrag: 4500.00,
        notizen: 'Initiale Planung'
      },
      localUpdatedAt: now - 1000 * 60 * 5,
      remoteUpdatedAt: now - 1000 * 60 * 2,
      conflictingColumns: ['titel', 'status', 'netto_betrag', 'notizen'],
      status: 'pending'
    };
  }
}
