/**
 * Form Auto-Draft & Offline Persistence Service using IndexedDB.
 * Priority database for local transient drafts and unsaved form states.
 */

const DB_NAME = 'FormStudioDraftsDB';
const DB_VERSION = 1;
const DRAFT_STORE = 'form_drafts';

export interface FormDraft {
  id: string; // `${formId}_${recordId || 'new'}`
  formId: string;
  formName: string;
  recordId?: string | number;
  formData: Record<string, any>;
  lastSavedAt: number;
  isDirty: boolean;
}

const openDraftDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject('IndexedDB is not available in this environment');
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (e) => reject((e.target as any).error);
    request.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        const store = db.createObjectStore(DRAFT_STORE, { keyPath: 'id' });
        store.createIndex('formId', 'formId', { unique: false });
        store.createIndex('lastSavedAt', 'lastSavedAt', { unique: false });
      }
    };
  });
};

export const saveFormDraftToIndexedDB = async (
  formId: string,
  formName: string,
  formData: Record<string, any>,
  recordId?: string | number
): Promise<void> => {
  try {
    const db = await openDraftDB();
    const draftId = `${formId}_${recordId ?? 'new'}`;
    const draft: FormDraft = {
      id: draftId,
      formId,
      formName,
      recordId,
      formData,
      lastSavedAt: Date.now(),
      isDirty: true,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction([DRAFT_STORE], 'readwrite');
      tx.objectStore(DRAFT_STORE).put(draft);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject((e.target as any).error);
    });
  } catch (err) {
    console.warn('IndexedDB saveFormDraft failed:', err);
  }
};

export const getFormDraftFromIndexedDB = async (
  formId: string,
  recordId?: string | number
): Promise<FormDraft | null> => {
  try {
    const db = await openDraftDB();
    const draftId = `${formId}_${recordId ?? 'new'}`;

    return new Promise((resolve, reject) => {
      const tx = db.transaction([DRAFT_STORE], 'readonly');
      const req = tx.objectStore(DRAFT_STORE).get(draftId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = (e) => reject((e.target as any).error);
    });
  } catch (err) {
    console.warn('IndexedDB getFormDraft failed:', err);
    return null;
  }
};

export const clearFormDraftFromIndexedDB = async (
  formId: string,
  recordId?: string | number
): Promise<void> => {
  try {
    const db = await openDraftDB();
    const draftId = `${formId}_${recordId ?? 'new'}`;

    return new Promise((resolve, reject) => {
      const tx = db.transaction([DRAFT_STORE], 'readwrite');
      tx.objectStore(DRAFT_STORE).delete(draftId);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject((e.target as any).error);
    });
  } catch (err) {
    console.warn('IndexedDB clearFormDraft failed:', err);
  }
};

export const getAllFormDraftsFromIndexedDB = async (): Promise<FormDraft[]> => {
  try {
    const db = await openDraftDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([DRAFT_STORE], 'readonly');
      const req = tx.objectStore(DRAFT_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject((e.target as any).error);
    });
  } catch (err) {
    console.warn('IndexedDB getAllFormDrafts failed:', err);
    return [];
  }
};
