import { create } from 'zustand';
import { 
  ReplicationRule, 
  SyncConflictRecord, 
  SyncExecutionReport, 
  SyncExecutionLogItem,
  ConflictStrategy,
  SyncMatrixConfig
} from '../types';
import { SyncMatrixEngine } from '../services/syncMatrixEngine';
import { globalEventBus } from '../../event-bus/mfeEventBus';
import { Table } from '../../../types';

interface SyncMatrixState {
  rules: ReplicationRule[];
  conflicts: SyncConflictRecord[];
  activeConflict: SyncConflictRecord | null;
  config: SyncMatrixConfig;
  isSyncing: boolean;
  syncProgress: number; // 0 to 100
  lastReport: SyncExecutionReport | null;
  executionHistory: SyncExecutionReport[];
  selectedRuleId: string | null;
  
  // Rule actions
  initRulesFromTables: (tables: Table[]) => void;
  updateRule: (ruleId: string, updates: Partial<ReplicationRule>) => void;
  toggleRule: (ruleId: string) => void;
  deleteRule: (ruleId: string) => void;
  addRule: (rule: ReplicationRule) => void;
  setSelectedRuleId: (ruleId: string | null) => void;
  
  // Conflict actions
  setActiveConflict: (conflict: SyncConflictRecord | null) => void;
  resolveConflict: (conflictId: string, strategy: ConflictStrategy, customPayload?: Record<string, any>) => void;
  resolveAllConflicts: (strategy: ConflictStrategy) => void;
  triggerSampleConflict: (ruleId?: string) => void;
  
  // Sync execution
  runSyncBatch: (tables: Table[], options?: { dryRun?: boolean }) => Promise<SyncExecutionReport>;
  
  // Configuration
  updateConfig: (updates: Partial<SyncMatrixConfig>) => void;
}

const DEFAULT_CONFIG: SyncMatrixConfig = {
  globalDefaultStrategy: 'last_write_wins',
  defaultBatchSize: 100,
  autoResolveThresholdSec: 300,
  enableTombstoneTracking: true,
  cloudPostgresConfig: {
    host: 'postgres.production.dbstudio.cloud',
    port: 5432,
    database: 'enterprise_core',
    user: 'dbstudio_app',
    schema: 'public',
    ssl: true
  },
  localSqliteConfig: {
    dbPath: 'local_construction.sqlite',
    inMemory: false,
    journalMode: 'WAL'
  }
};

export const useSyncMatrixStore = create<SyncMatrixState>((set, get) => ({
  rules: [],
  conflicts: [],
  activeConflict: null,
  config: DEFAULT_CONFIG,
  isSyncing: false,
  syncProgress: 0,
  lastReport: null,
  executionHistory: [],
  selectedRuleId: null,

  initRulesFromTables: (tables: Table[]) => {
    const existingRules = get().rules;
    if (existingRules.length > 0) return;

    const defaultRules = SyncMatrixEngine.createDefaultRulesForTables(tables);
    set({ rules: defaultRules, selectedRuleId: defaultRules[0]?.id || null });
  },

  updateRule: (ruleId: string, updates: Partial<ReplicationRule>) => {
    set((state) => ({
      rules: state.rules.map(r => r.id === ruleId ? { ...r, ...updates } : r)
    }));
  },

  toggleRule: (ruleId: string) => {
    set((state) => ({
      rules: state.rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r)
    }));
  },

  deleteRule: (ruleId: string) => {
    set((state) => ({
      rules: state.rules.filter(r => r.id !== ruleId),
      selectedRuleId: state.selectedRuleId === ruleId ? null : state.selectedRuleId
    }));
  },

  addRule: (rule: ReplicationRule) => {
    set((state) => ({
      rules: [...state.rules, rule],
      selectedRuleId: rule.id
    }));
  },

  setSelectedRuleId: (ruleId: string | null) => {
    set({ selectedRuleId: ruleId });
  },

  setActiveConflict: (conflict: SyncConflictRecord | null) => {
    set({ activeConflict: conflict });
  },

  resolveConflict: (conflictId: string, strategy: ConflictStrategy, customPayload?: Record<string, any>) => {
    const conflict = get().conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    const { resolvedValue, winner } = SyncMatrixEngine.resolveConflict(conflict, strategy, customPayload);

    // Dispatch to MFE Event Bus
    try {
      globalEventBus.publish('REPLICATION_CONFLICT_RESOLVED', 'STUDIO', {
        conflictId: conflict.id,
        tableName: conflict.tableName,
        recordId: conflict.primaryKeyValue,
        strategy,
        winner
      });
    } catch (e) {}

    set((state) => ({
      conflicts: state.conflicts.map(c => c.id === conflictId ? {
        ...c,
        status: 'resolved',
        resolutionApplied: strategy,
        resolvedValue,
        resolvedAt: Date.now()
      } : c),
      activeConflict: state.activeConflict?.id === conflictId ? null : state.activeConflict
    }));
  },

  resolveAllConflicts: (strategy: ConflictStrategy) => {
    const pending = get().conflicts.filter(c => c.status === 'pending');
    pending.forEach(c => {
      get().resolveConflict(c.id, strategy);
    });
  },

  triggerSampleConflict: (ruleId?: string) => {
    const state = get();
    const targetRule = state.rules.find(r => r.id === ruleId) || state.rules[0] || {
      id: 'rule_sample',
      tableName: 'Baukalkulation_Positionen',
      targetTableName: 'public.baukalkulation_positionen',
      direction: 'bidirectional' as const,
      conflictStrategy: 'last_write_wins' as const,
      enabled: true,
      syncMode: 'cdc_delta' as const,
      columnMappings: [],
      frequency: 'interval_30s' as const,
      syncStatus: 'conflict' as const,
      rowCountLocal: 42,
      rowCountCloud: 42,
      lagMs: 45
    };

    const newConflict = SyncMatrixEngine.generateSampleConflict(targetRule);
    
    // Publish conflict to Event Bus
    try {
      globalEventBus.publish('REPLICATION_CONFLICT_DETECTED', 'STUDIO', {
        conflictId: newConflict.id,
        tableName: newConflict.tableName,
        recordId: newConflict.primaryKeyValue,
        conflictingFields: newConflict.conflictingColumns,
        localTimestamp: newConflict.localUpdatedAt,
        remoteTimestamp: newConflict.remoteUpdatedAt
      });
    } catch (e) {}

    set((s) => ({
      conflicts: [newConflict, ...s.conflicts.filter(c => c.id !== newConflict.id)],
      activeConflict: newConflict,
      rules: s.rules.map(r => r.id === targetRule.id ? { ...r, syncStatus: 'conflict' } : r)
    }));
  },

  runSyncBatch: async (tables: Table[], options = { dryRun: false }): Promise<SyncExecutionReport> => {
    const state = get();
    const batchId = `sync_${Date.now()}`;
    const startTime = Date.now();
    const activeRules = state.rules.filter(r => r.enabled);

    set({ isSyncing: true, syncProgress: 10 });

    try {
      globalEventBus.publish('REPLICATION_SYNC_STARTED', 'STUDIO', {
        syncBatchId: batchId,
        rulesCount: activeRules.length,
        mode: 'delta',
        timestamp: startTime
      });
    } catch (e) {}

    const logs: SyncExecutionLogItem[] = [
      {
        id: `log_start`,
        timestamp: Date.now(),
        level: 'info',
        message: `🚀 Hybrid-Replikation gestartet (${options.dryRun ? 'DRY-RUN Testmodus' : 'LIVE Ausführung'}). ${activeRules.length} Tabellen aktiv.`
      }
    ];

    let insertedLocal = 0;
    let updatedLocal = 0;
    let insertedCloud = 0;
    let updatedCloud = 0;
    let conflictCount = 0;
    let resolvedCount = 0;

    for (let i = 0; i < activeRules.length; i++) {
      const rule = activeRules[i];
      const progress = Math.round(15 + ((i + 1) / activeRules.length) * 75);
      set({ syncProgress: progress });

      logs.push({
        id: `log_${rule.id}_scan`,
        timestamp: Date.now(),
        level: 'info',
        tableName: rule.tableName,
        message: `Scanne Delta-Änderungen für "${rule.tableName}" (SQLite ↔ ${rule.targetTableName} PostgreSQL)...`
      });

      await new Promise(r => setTimeout(r, 120));

      // Emulate change processing
      const hasConflict = rule.syncStatus === 'conflict' || (i === 0 && state.conflicts.some(c => c.ruleId === rule.id && c.status === 'pending'));
      
      if (hasConflict) {
        conflictCount++;
        if (rule.autoResolveBatch && rule.conflictStrategy !== 'interactive_merge') {
          resolvedCount++;
          logs.push({
            id: `log_${rule.id}_conflict_res`,
            timestamp: Date.now(),
            level: 'warn',
            tableName: rule.tableName,
            message: `⚠️ Konflikt in "${rule.tableName}" automatisch gelöst via Strategie "${rule.conflictStrategy.toUpperCase()}".`
          });
        } else {
          logs.push({
            id: `log_${rule.id}_conflict`,
            timestamp: Date.now(),
            level: 'warn',
            tableName: rule.tableName,
            message: `⚠️ 1 ungelöster Konflikt in "${rule.tableName}" wartet auf manuelle Prüfung (3-Way Merge).`
          });
        }
      } else {
        const deltaCount = Math.floor(Math.random() * 4) + 1;
        insertedCloud += deltaCount;
        updatedLocal += 1;
        logs.push({
          id: `log_${rule.id}_ok`,
          timestamp: Date.now(),
          level: 'success',
          tableName: rule.tableName,
          message: `✅ "${rule.tableName}": ${deltaCount} Datensätze synchronisiert (Latenz: ${rule.lagMs}ms).`
        });
      }
    }

    const report: SyncExecutionReport = {
      id: batchId,
      startTime,
      endTime: Date.now(),
      status: conflictCount > resolvedCount ? 'partial' : 'success',
      totalTables: activeRules.length,
      insertedLocal,
      updatedLocal,
      deletedLocal: 0,
      insertedCloud,
      updatedCloud,
      deletedCloud: 0,
      conflictCount,
      resolvedCount,
      logs
    };

    try {
      globalEventBus.publish('REPLICATION_SYNC_COMPLETED', 'STUDIO', {
        syncBatchId: batchId,
        status: report.status,
        totalSynced: insertedCloud + updatedLocal,
        conflictsCount: conflictCount - resolvedCount,
        durationMs: Date.now() - startTime
      });
    } catch (e) {}

    set((s) => ({
      isSyncing: false,
      syncProgress: 100,
      lastReport: report,
      executionHistory: [report, ...(s.executionHistory || []).slice(0, 19)],
      rules: (s.rules || []).map(r => ({
        ...r,
        lastSyncTimestamp: Date.now(),
        syncStatus: (s.conflicts || []).some(c => c.ruleId === r.id && c.status === 'pending') ? 'conflict' : 'in_sync'
      }))
    }));

    return report;
  },

  updateConfig: (updates: Partial<SyncMatrixConfig>) => {
    set((state) => ({ config: { ...state.config, ...updates } }));
  }
}));
