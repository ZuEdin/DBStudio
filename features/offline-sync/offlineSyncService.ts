import { IndexedDbStorage, CrdtAuditRecord } from './indexedDbStorage';
import { OutboxMutation, OfflineSyncStats, SyncConflict } from './outboxTypes';
import { CrdtFieldMerger } from './crdtFieldMerger';
import { PayloadCompressionUtil } from './payloadCompressionUtil';
import { BackgroundSyncService } from './backgroundSyncService';

type SyncListener = (stats: OfflineSyncStats) => void;

export class OfflineSyncService {
  private static isSyncing = false;
  private static listeners: Set<SyncListener> = new Set();
  private static isInitialized = false;
  private static lastSyncedAt: number = Date.now();
  private static autoResolvedCrdtCount = 0;

  public static init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Initialize Background Sync Service Worker
    BackgroundSyncService.init(() => {
      this.flushOutbox().catch(console.error);
    }).catch(console.error);

    window.addEventListener('online', () => {
      this.notifyListeners();
      this.flushOutbox().catch(console.error);
      BackgroundSyncService.requestBackgroundSync().catch(console.error);
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
    baseVersion?: number,
    fieldTimestamps?: Record<string, number>
  ): Promise<OutboxMutation> {
    this.init();

    // Calculate timestamps for fields if not provided
    const now = Date.now();
    const timestamps: Record<string, number> = fieldTimestamps || {};
    if (typeof payload === 'object' && payload !== null) {
      Object.keys(payload).forEach((k) => {
        if (!timestamps[k]) timestamps[k] = now;
      });
    }

    // Determine payload compression for efficiency (photos, large reports, big JSON)
    const jsonStr = JSON.stringify(payload);
    const originalSizeBytes = new TextEncoder().encode(jsonStr).byteLength;
    let isCompressed = false;
    let compressionAlgorithm: 'gzip' | 'deflate' | 'raw' = 'raw';
    let compressedSizeBytes = originalSizeBytes;
    let storedPayload = payload;

    if (originalSizeBytes > 300) {
      try {
        const compressed = await PayloadCompressionUtil.compress(payload, 'gzip');
        if (compressed.compressedSizeBytes < originalSizeBytes) {
          isCompressed = true;
          compressionAlgorithm = 'gzip';
          compressedSizeBytes = compressed.compressedSizeBytes;
          // Store compressed reference alongside plain payload for ease of local query
          storedPayload = {
            ...payload,
            __compressedData: compressed.dataBase64,
            __compressionMeta: {
              algorithm: 'gzip',
              ratio: compressed.compressionRatio,
              originalSizeBytes,
              compressedSizeBytes,
            },
          };
        }
      } catch (err) {
        console.warn('Payload compression skipped:', err);
      }
    }

    const mutation: OutboxMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tableName,
      operation,
      recordId,
      payload: storedPayload,
      createdAt: now,
      retryCount: 0,
      status: 'PENDING',
      baseVersion,
      fieldTimestamps: timestamps,
      isCompressed,
      compressionAlgorithm,
      originalSizeBytes,
      compressedSizeBytes,
    };

    await IndexedDbStorage.queueMutation(mutation);
    await this.notifyListeners();

    // Register Background Sync if supported
    BackgroundSyncService.requestBackgroundSync().catch(console.error);

    // If online, trigger flush immediately
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.flushOutbox().catch(console.error);
    }

    return mutation;
  }

  public static async flushOutbox(): Promise<{ synced: number; failed: number; conflicts: number; autoMerged: number }> {
    if (this.isSyncing || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return { synced: 0, failed: 0, conflicts: 0, autoMerged: 0 };
    }
    this.isSyncing = true;
    await this.notifyListeners();

    let synced = 0;
    let failed = 0;
    let conflicts = 0;
    let autoMerged = 0;

    try {
      const pending = await IndexedDbStorage.getPendingMutations();
      for (const mutation of pending) {
        try {
          // Check for simulated or real server version difference
          const simulatedServerVersion = mutation.payload?.serverVersion;
          const serverData = mutation.payload?._serverSnapshot;

          if (mutation.baseVersion && simulatedServerVersion && simulatedServerVersion > mutation.baseVersion && serverData) {
            // Run Field-Level CRDT Merger
            const clientData = { ...mutation.payload };
            delete clientData._serverSnapshot;
            delete clientData.__compressedData;
            delete clientData.__compressionMeta;

            const mergeResult = CrdtFieldMerger.mergeFields({
              clientPayload: clientData,
              serverPayload: serverData,
              basePayload: mutation.payload?._baseSnapshot || {},
              clientTimestamps: mutation.fieldTimestamps || {},
              serverTimestamps: serverData.__timestamps || {},
              clientDefaultTime: mutation.createdAt,
              serverDefaultTime: Date.now() - 5000,
            });

            if (mergeResult.autoResolved) {
              // CRDT Auto-Merge succeeded on field level without user dialog!
              this.autoResolvedCrdtCount++;
              autoMerged++;

              const auditRecord: CrdtAuditRecord = {
                id: `crdt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                tableName: mutation.tableName,
                recordId: mutation.recordId,
                resolvedFields: mergeResult.resolvedFields.map((f) => f.fieldName),
                notes: mergeResult.auditNotes,
                timestamp: Date.now(),
              };
              await IndexedDbStorage.logCrdtResolution(auditRecord);

              // Update mutation with converged payload
              mutation.payload = mergeResult.mergedPayload;
              await IndexedDbStorage.markSynced(mutation.id);
              synced += 1;
              continue;
            } else {
              // True simultaneous collision on the same field
              const conflict: SyncConflict = {
                id: `cnf_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
                mutationId: mutation.id,
                tableName: mutation.tableName,
                recordId: mutation.recordId,
                clientPayload: clientData,
                serverPayload: serverData,
                conflictFields: mergeResult.conflictingFields,
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

          // Mark synced
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

    return { synced, failed, conflicts, autoMerged };
  }

  public static async applyThreeWayMerge(
    conflict: SyncConflict,
    resolvedPayload: any
  ): Promise<void> {
    await IndexedDbStorage.resolveConflict(conflict.id);
    await this.recordMutation(conflict.tableName, 'UPDATE', conflict.recordId, resolvedPayload);
  }

  public static async getStats(): Promise<OfflineSyncStats> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    try {
      const pending = await IndexedDbStorage.getPendingMutations();
      const allMutations = await IndexedDbStorage.getAllMutations();
      const conflicts = await IndexedDbStorage.getConflicts();

      let totalBytesSaved = 0;
      allMutations.forEach((m) => {
        if (m.isCompressed && m.originalSizeBytes && m.compressedSizeBytes) {
          totalBytesSaved += Math.max(0, m.originalSizeBytes - m.compressedSizeBytes);
        }
      });

      return {
        pendingCount: pending.length,
        conflictCount: conflicts.length,
        isOnline,
        lastSyncedAt: this.lastSyncedAt,
        isSyncing: this.isSyncing,
        backgroundSyncSupported: BackgroundSyncService.isSupported(),
        backgroundSyncRegistered: BackgroundSyncService.isServiceWorkerActive(),
        totalBytesSavedByCompression: totalBytesSaved,
        autoResolvedCrdtCount: this.autoResolvedCrdtCount,
      };
    } catch {
      return {
        pendingCount: 0,
        conflictCount: 0,
        isOnline,
        lastSyncedAt: this.lastSyncedAt,
        isSyncing: this.isSyncing,
        backgroundSyncSupported: BackgroundSyncService.isSupported(),
        backgroundSyncRegistered: BackgroundSyncService.isServiceWorkerActive(),
        totalBytesSavedByCompression: 0,
        autoResolvedCrdtCount: this.autoResolvedCrdtCount,
      };
    }
  }
}
