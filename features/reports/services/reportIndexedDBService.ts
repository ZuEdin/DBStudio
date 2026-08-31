/**
 * IndexedDB Service for Report Templates, Drafts & Print Jobs
 * Implements priority local persistence for reporting engine.
 */

const DB_NAME = 'ReportEngineIndexedDB';
const DB_VERSION = 1;

export interface ReportDraftRecord {
  id: string;
  reportId: string;
  title: string;
  layoutJson: string;
  lastModified: number;
  isPdfACompliant: boolean;
  zugferdEnabled: boolean;
}

export interface PrintJobRecord {
  id: string;
  reportTitle: string;
  printedAt: number;
  pageCount: number;
  status: 'QUEUED' | 'PRINTED' | 'FAILED' | 'EMAILED';
  recipientEmail?: string;
}

const openReportDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject('IndexedDB is not available');
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (e) => reject((e.target as any).error);
    request.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('report_drafts')) {
        db.createObjectStore('report_drafts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('print_jobs')) {
        db.createObjectStore('print_jobs', { keyPath: 'id' });
      }
    };
  });
};

export const saveReportDraftToIndexedDB = async (draft: ReportDraftRecord): Promise<void> => {
  try {
    const db = await openReportDB();
    const tx = db.transaction(['report_drafts'], 'readwrite');
    tx.objectStore('report_drafts').put(draft);
  } catch (err) {
    console.warn('IndexedDB saveReportDraft warning:', err);
  }
};

export const savePrintJobToIndexedDB = async (job: PrintJobRecord): Promise<void> => {
  try {
    const db = await openReportDB();
    const tx = db.transaction(['print_jobs'], 'readwrite');
    tx.objectStore('print_jobs').put(job);
  } catch (err) {
    console.warn('IndexedDB savePrintJob warning:', err);
  }
};

export const getAllPrintJobsFromIndexedDB = async (): Promise<PrintJobRecord[]> => {
  try {
    const db = await openReportDB();
    return new Promise((resolve) => {
      const tx = db.transaction(['print_jobs'], 'readonly');
      const store = tx.objectStore('print_jobs');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
};
