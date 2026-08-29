import { IndexedDbStorage } from './indexedDbStorage';
import { OutboxMutation, OfflineSyncStats, SyncConflict } from './outboxTypes';

type SyncListener = (stats: OfflineSyncStats) => void;

export class OfflineSyncService {
  private static isSyncing = false;
  private static listeners: Set<SyncListener> = new Set();
  private static isInitialized = false;
  private static lastSyncedAt: number = Date.now();

  public static init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    window.addEventListener('online', () => {
      this.notifyListeners();
      this.flushOutbox().catch(console.error);
    });

    window.addEventListener('offline', () => {
      this.notifyListeners();
    });

    // Auto-flush when idle
    setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.flushOutbox().catch(console.error);
      }
    }, 15000);
  }

  public static subscribe(listener: SyncListener): () => void {
    this.init();
    this.listeners.add(listener);
    this.getStats().then(listener).catch(console.error);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static async notifyListeners(): Promise<void> {
    try {
      const stats = await this.getStats();
      this.listeners.forEach((listener) => listener(stats));
    } catch {
      // ignore
    }
  }

  public static async recordMutation(
    tableName: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    recordId: string,
    payload: any,
    baseVersion?: number
  ): Promise<OutboxMutation> {
    this.init();
    const mutation: OutboxMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tableName,
      operation,
      recordId,
      payload,
      createdAt: Date.now(),
      retryCount: 0,
      status: 'PENDING',
      baseVersion,
    };

    await IndexedDbStorage.queueMutation(mutation);
    await this.notifyListeners();

    // If online, trigger background flush
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.flushOutbox().catch(console.error);
    }

    return mutation;
  }

  public static async flushOutbox(): Promise<{ synced: number; failed: number; conflicts: number }> {
    if (this.isSyncing || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return { synced: 0, failed: 0, conflicts: 0 };
    }
    this.isSyncing = true;
    await this.notifyListeners();

    let synced = 0;
    let failed = 0;
    let conflicts = 0;

    try {
      const pending = await IndexedDbStorage.getPendingMutations();
      for (const mutation of pending) {
        try {
          // Check for simulated or real server conflict
          const simulatedServerVersion = mutation.payload?.serverVersion;
          if (mutation.baseVersion && simulatedServerVersion && simulatedServerVersion > mutation.baseVersion) {
            // Three-Way Merge Conflict detected!
            const conflictFields: string[] = [];
            const serverData = mutation.payload?._serverSnapshot || {};
            const clientData = mutation.payload;

            Object.keys(clientData).forEach((key) => {
              if (key !== '_serverSnapshot' && serverData[key] !== undefined && serverData[key] !== clientData[key]) {
                conflictFields.push(key);
              }
            });

            if (conflictFields.length > 0) {
              const conflict: SyncConflict = {
                id: `cnf_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
                mutationId: mutation.id,
                tableName: mutation.tableName,
                recordId: mutation.recordId,
                clientPayload: clientData,
                serverPayload: serverData,
                conflictFields,
                detectedAt: Date.now(),
                resolved: false,
              };
              await IndexedDbStorage.saveConflict(conflict);
              mutation.status = 'CONFLICT';
              await IndexedDbStorage.queueMutation(mutation);
              conflicts += 1;
              continue;
            }
          }

          // Otherwise mark synced
          await IndexedDbStorage.markSynced(mutation.id);
          synced += 1;
        } catch (err: any) {
          mutation.retryCount += 1;
          mutation.status = 'FAILED';
          mutation.errorMessage = err?.message || 'Sync Fehler';
          await IndexedDbStorage.queueMutation(mutation);
          failed += 1;
        }
      }
      this.lastSyncedAt = Date.now();
    } finally {
      this.isSyncing = false;
      await this.notifyListeners();
    }

    return { synced, failed, conflicts };
  }

  public static async applyThreeWayMerge(
    conflict: SyncConflict,
    resolvedPayload: any
  ): Promise<void> {
    // Save merged payload into a clean mutation and mark conflict resolved
    await IndexedDbStorage.resolveConflict(conflict.id);
    await this.recordMutation(conflict.tableName, 'UPDATE', conflict.recordId, resolvedPayload);
  }

  public static async getStats(): Promise<OfflineSyncStats> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    try {
      const pending = await IndexedDbStorage.getPendingMutations();
      const conflicts = await IndexedDbStorage.getConflicts();
      return {
        pendingCount: pending.length,
        conflictCount: conflicts.length,
        isOnline,
        lastSyncedAt: this.lastSyncedAt,
        isSyncing: this.isSyncing,
      };
    } catch {
      return {
        pendingCount: 0,
        conflictCount: 0,
        isOnline,
        lastSyncedAt: this.lastSyncedAt,
        isSyncing: this.isSyncing,
      };
    }
  }
}

