/**
 * Form Offline Drafts & Optimistic Locking Manager
 * Persists uncommitted field edits to local storage for offline resiliency.
 */

export interface FormDraft {
  formId: string;
  recordId: string;
  savedAt: string;
  data: Record<string, any>;
  isDirty: boolean;
  version?: number;
}

export interface OfflineQueueItem {
  id: string;
  formId: string;
  tableId?: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;
  timestamp: number;
  synced: boolean;
  retryCount: number;
}

const DRAFT_PREFIX = 'dbstudio_form_draft_';
const QUEUE_KEY = 'dbstudio_offline_sync_queue';

export function saveFormDraft(formId: string, recordId: string, data: Record<string, any>, version?: number): void {
  try {
    const key = `${DRAFT_PREFIX}${formId}_${recordId || 'new'}`;
    const draft: FormDraft = {
      formId,
      recordId: recordId || 'new',
      savedAt: new Date().toISOString(),
      data,
      isDirty: true,
      version,
    };
    localStorage.setItem(key, JSON.stringify(draft));
  } catch (e) {
    console.warn('Failed to save offline form draft to localStorage', e);
  }
}

export function loadFormDraft(formId: string, recordId: string): FormDraft | null {
  try {
    const key = `${DRAFT_PREFIX}${formId}_${recordId || 'new'}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearFormDraft(formId: string, recordId: string): void {
  try {
    const key = `${DRAFT_PREFIX}${formId}_${recordId || 'new'}`;
    localStorage.removeItem(key);
  } catch {}
}

export function hasOfflineDraft(formId: string, recordId: string): boolean {
  const draft = loadFormDraft(formId, recordId);
  return Boolean(draft && draft.isDirty);
}

// --- Offline Queue & Background Sync ---

export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function enqueueOfflineAction(action: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'synced' | 'retryCount'>): OfflineQueueItem {
  const item: OfflineQueueItem = {
    ...action,
    id: 'queue_' + Math.random().toString(36).substring(2, 9),
    timestamp: Date.now(),
    synced: false,
    retryCount: 0,
  };
  try {
    const queue = getOfflineQueue();
    queue.push(item);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Failed to enqueue offline action', e);
  }
  return item;
}

export function removeOfflineAction(queueItemId: string): void {
  try {
    const queue = getOfflineQueue().filter((q) => q.id !== queueItemId);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {}
}

/**
 * Checks for optimistic locking conflicts between local state and server/table record.
 */
export function detectOptimisticConflict(
  localRecord: Record<string, any>,
  serverRecord: Record<string, any>
): boolean {
  if (!localRecord || !serverRecord) return false;
  
  // Version or timestamp based check
  if (localRecord.version !== undefined && serverRecord.version !== undefined) {
    if (localRecord.version < serverRecord.version) return true;
  }
  if (localRecord.updated_at && serverRecord.updated_at) {
    if (new Date(localRecord.updated_at).getTime() < new Date(serverRecord.updated_at).getTime()) return true;
  }
  return false;
}

