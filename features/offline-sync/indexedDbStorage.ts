import { OutboxMutation, SyncConflict, LocalDailyReport, LocalDefect, LocalTimeTracking } from './outboxTypes';

const DB_NAME = 'EnterpriseStudioOfflineDB';
const DB_VERSION = 2;

const STORE_OUTBOX = 'outbox_mutations';
const STORE_CONFLICTS = 'sync_conflicts';
const STORE_DAILY_REPORTS = 'local_daily_reports';
const STORE_DEFECTS = 'local_defects';
const STORE_TIME_TRACKING = 'local_time_trackings';

export class IndexedDbStorage {
  private static async getDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not available in this environment'));
        return;
      }

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

        if (!db.objectStoreNames.contains(STORE_CONFLICTS)) {
          const store = db.createObjectStore(STORE_CONFLICTS, { keyPath: 'id' });
          store.createIndex('tableName', 'tableName', { unique: false });
          store.createIndex('resolved', 'resolved', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_DAILY_REPORTS)) {
          const store = db.createObjectStore(STORE_DAILY_REPORTS, { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('reportDate', 'reportDate', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_DEFECTS)) {
          const store = db.createObjectStore(STORE_DEFECTS, { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_TIME_TRACKING)) {
          const store = db.createObjectStore(STORE_TIME_TRACKING, { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
        }
      };
    });
  }

  // Generic helpers
  private static async putItem<T>(storeName: string, item: T): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private static async getAllItems<T>(storeName: string): Promise<T[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  private static async deleteItem(storeName: string, key: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Outbox Mutations
  public static async queueMutation(mutation: OutboxMutation): Promise<void> {
    return this.putItem(STORE_OUTBOX, mutation);
  }

  public static async getPendingMutations(): Promise<OutboxMutation[]> {
    const all = await this.getAllItems<OutboxMutation>(STORE_OUTBOX);
    return all.filter((m) => m.status === 'PENDING' || m.status === 'FAILED');
  }

  public static async getAllMutations(): Promise<OutboxMutation[]> {
    return this.getAllItems<OutboxMutation>(STORE_OUTBOX);
  }

  public static async markSynced(mutationId: string): Promise<void> {
    return this.deleteItem(STORE_OUTBOX, mutationId);
  }

  // Conflicts
  public static async saveConflict(conflict: SyncConflict): Promise<void> {
    return this.putItem(STORE_CONFLICTS, conflict);
  }

  public static async getConflicts(): Promise<SyncConflict[]> {
    const all = await this.getAllItems<SyncConflict>(STORE_CONFLICTS);
    return all.filter((c) => !c.resolved);
  }

  public static async resolveConflict(conflictId: string): Promise<void> {
    return this.deleteItem(STORE_CONFLICTS, conflictId);
  }

  // Local Daily Reports
  public static async saveDailyReport(report: LocalDailyReport): Promise<void> {
    return this.putItem(STORE_DAILY_REPORTS, report);
  }

  public static async getDailyReports(projectId?: string): Promise<LocalDailyReport[]> {
    const reports = await this.getAllItems<LocalDailyReport>(STORE_DAILY_REPORTS);
    if (!projectId) return reports;
    return reports.filter((r) => r.projectId === projectId);
  }

  // Local Defects
  public static async saveDefect(defect: LocalDefect): Promise<void> {
    return this.putItem(STORE_DEFECTS, defect);
  }

  public static async getDefects(projectId?: string): Promise<LocalDefect[]> {
    const defects = await this.getAllItems<LocalDefect>(STORE_DEFECTS);
    if (!projectId) return defects;
    return defects.filter((d) => d.projectId === projectId);
  }

  // Local Time Tracking
  public static async saveTimeTracking(entry: LocalTimeTracking): Promise<void> {
    return this.putItem(STORE_TIME_TRACKING, entry);
  }

  public static async getTimeTrackings(projectId?: string): Promise<LocalTimeTracking[]> {
    const entries = await this.getAllItems<LocalTimeTracking>(STORE_TIME_TRACKING);
    if (!projectId) return entries;
    return entries.filter((e) => e.projectId === projectId);
  }
}

