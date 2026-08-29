export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
export type MutationOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface OutboxMutation {
  id: string; // UUID v4
  tableName: string;
  operation: MutationOperation;
  recordId: string;
  payload: any;
  createdAt: number;
  retryCount: number;
  status: SyncStatus;
  errorMessage?: string;
}

export interface OfflineSyncStats {
  pendingCount: number;
  isOnline: boolean;
  lastSyncedAt?: number;
}
