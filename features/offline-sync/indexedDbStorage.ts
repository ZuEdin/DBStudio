import { OutboxMutation } from './outboxTypes';

const DB_NAME = 'EnterpriseStudioOfflineDB';
const DB_VERSION = 1;
const STORE_OUTBOX = 'outbox_mutations';

export class IndexedDbStorage {
  private static async getDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
          const store = db.createObjectStore(STORE_OUTBOX, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  public static async queueMutation(mutation: OutboxMutation): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OUTBOX, 'readwrite');
      const store = tx.objectStore(STORE_OUTBOX);
      const req = store.put(mutation);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public static async getPendingMutations(): Promise<OutboxMutation[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OUTBOX, 'readonly');
      const store = tx.objectStore(STORE_OUTBOX);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as OutboxMutation[];
        resolve(results.filter((m) => m.status === 'PENDING' || m.status === 'FAILED'));
      };
      req.onerror = () => reject(req.error);
    });
  }

  public static async markSynced(mutationId: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OUTBOX, 'readwrite');
      const store = tx.objectStore(STORE_OUTBOX);
      const req = store.delete(mutationId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}
