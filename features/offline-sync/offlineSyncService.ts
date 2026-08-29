import { IndexedDbStorage } from './indexedDbStorage';
import { OutboxMutation, OfflineSyncStats } from './outboxTypes';

export class OfflineSyncService {
  private static isSyncing = false;

  public static async recordMutation(
    tableName: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    recordId: string,
    payload: any
  ): Promise<OutboxMutation> {
    const mutation: OutboxMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tableName,
      operation,
      recordId,
      payload,
      createdAt: Date.now(),
      retryCount: 0,
      status: 'PENDING',
    };

    await IndexedDbStorage.queueMutation(mutation);

    // If online, trigger background flush
    if (navigator.onLine) {
      this.flushOutbox().catch(console.error);
    }

    return mutation;
  }

  public static async flushOutbox(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;

    try {
      const pending = await IndexedDbStorage.getPendingMutations();
      for (const mutation of pending) {
        try {
          // Send to server / sync API here
          // e.g. await apiClient.post('/api/sync/mutation', mutation);
          await IndexedDbStorage.markSynced(mutation.id);
        } catch (err) {
          mutation.retryCount += 1;
          mutation.status = 'FAILED';
          await IndexedDbStorage.queueMutation(mutation);
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  public static async getStats(): Promise<OfflineSyncStats> {
    const pending = await IndexedDbStorage.getPendingMutations();
    return {
      pendingCount: pending.length,
      isOnline: navigator.onLine,
      lastSyncedAt: Date.now(),
    };
  }
}
