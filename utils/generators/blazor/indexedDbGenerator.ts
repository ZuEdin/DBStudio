import { Table, VirtualFile } from '../../../types/index';

export const generateBlazorIndexedDb = (
  tables: Table[],
  root: string
): VirtualFile => {
  const seedInit = tables.map(t => {
    const rows = t.data && t.data.length > 0 ? t.data : [];
    return `            if (!db.objectStoreNames.contains('${t.name}')) {
                const store = db.createObjectStore('${t.name}', { keyPath: 'id', autoIncrement: true });
                const seedRows = ${JSON.stringify(rows)};
                seedRows.forEach(row => {
                    try {
                        store.add(row);
                    } catch (e) {}
                });
            }`;
  }).join('\n');

  const indexedDbJs = `
const DB_NAME = 'db_studio_pro_blazor';
const DB_VERSION = 1;

window.indexedDbManager = {
    openDb: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
${seedInit}
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    getAll: async function(storeName) {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            if (!db.objectStoreNames.contains(storeName)) {
                resolve([]);
                return;
            }
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    },

    getById: async function(storeName, id) {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            if (!db.objectStoreNames.contains(storeName)) {
                resolve(null);
                return;
            }
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const parsedId = isNaN(Number(id)) ? id : Number(id);
            const req = store.get(parsedId);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    },

    add: async function(storeName, item) {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            if (item && item.id === 0) {
                delete item.id;
            }
            const req = store.add(item);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    update: async function(storeName, id, item) {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            if (id !== undefined && id !== null) {
                item.id = isNaN(Number(id)) ? id : Number(id);
            }
            const req = store.put(item);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    delete: async function(storeName, id) {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const parsedId = isNaN(Number(id)) ? id : Number(id);
            const req = store.delete(parsedId);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }
};
`;

  return {
    name: 'indexedDb.js',
    path: `${root}/wwwroot/js/indexedDb.js`,
    content: indexedDbJs,
    language: 'javascript'
  };
};
