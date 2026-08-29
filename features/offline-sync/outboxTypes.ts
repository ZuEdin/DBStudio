export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
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
  baseVersion?: number;
}

export interface OfflineSyncStats {
  pendingCount: number;
  conflictCount: number;
  isOnline: boolean;
  lastSyncedAt?: number;
  isSyncing?: boolean;
}

export interface SyncConflict {
  id: string;
  mutationId: string;
  tableName: string;
  recordId: string;
  clientPayload: any;
  serverPayload: any;
  basePayload?: any;
  conflictFields: string[];
  detectedAt: number;
  resolved: boolean;
}

export interface LocalDailyReport {
  id: string;
  projectId: string;
  reportDate: string;
  weatherTemp?: number;
  weatherCondition?: string;
  workerCount?: number;
  equipmentNotes?: string;
  workPerformedNotes?: string;
  notes?: string;
  signatureDataUrl?: string;
  signedBy?: string;
  signedAt?: string;
  updatedAt: number;
  syncStatus: SyncStatus;
}

export interface LocalDefect {
  id: string;
  projectId: string;
  title: string;
  description: string;
  trade: string;
  severity: 'LEICHT' | 'MITTEL' | 'SCHWER' | 'SICHERHEITSRELEVANT';
  status: 'OFFEN' | 'IN_BEARBEITUNG' | 'BEHOBEN' | 'ABGENOMMEN';
  photoDataUrl?: string;
  planX?: number; // 0..100 percentage
  planY?: number; // 0..100 percentage
  dueDate?: string;
  updatedAt: number;
  syncStatus: SyncStatus;
}

export interface LocalTimeTracking {
  id: string;
  projectId: string;
  workerName: string;
  workDate: string;
  hours: number;
  activityDescription: string;
  costCenter?: string;
  updatedAt: number;
  syncStatus: SyncStatus;
}
