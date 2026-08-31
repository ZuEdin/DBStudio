/**
 * IndexedDB Service for Generated Full-Stack Code Projects & Templates
 * Priority local persistence for Code Generation Engine.
 */

const DB_NAME = 'CodeGenEngineIndexedDB';
const DB_VERSION = 1;

export interface CodeProjectRecord {
  id: string;
  projectName: string;
  targetStack: string;
  generatedAt: number;
  filesCount: number;
  zipSizeKb: number;
  filesJson: string; // Serialized file tree
}

export interface CodeTemplateRecord {
  id: string;
  name: string;
  framework: string;
  version: string;
  content: string;
}

const openCodeGenDB = (): Promise<IDBDatabase> => {
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
      if (!db.objectStoreNames.contains('code_projects')) {
        db.createObjectStore('code_projects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('code_templates')) {
        db.createObjectStore('code_templates', { keyPath: 'id' });
      }
    };
  });
};

export const saveCodeProjectToIndexedDB = async (project: CodeProjectRecord): Promise<void> => {
  try {
    const db = await openCodeGenDB();
    const tx = db.transaction(['code_projects'], 'readwrite');
    tx.objectStore('code_projects').put(project);
  } catch (err) {
    console.warn('IndexedDB saveCodeProject warning:', err);
  }
};

export const getAllCodeProjectsFromIndexedDB = async (): Promise<CodeProjectRecord[]> => {
  try {
    const db = await openCodeGenDB();
    return new Promise((resolve) => {
      const tx = db.transaction(['code_projects'], 'readonly');
      const store = tx.objectStore('code_projects');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
};
