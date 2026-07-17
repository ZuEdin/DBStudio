
import { Table, VirtualFile, BackendConfig, Query, SelectQuery } from '../../../types/index';
import { toCamelCase, toPascalCase, isNullable, resolveType } from '../common';

export const generateReactApi = (tables: Table[], queries: Query[], config: BackendConfig, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const useAuth = config.authConfig?.useUserLogin;
  
  const apiService = `import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 
    (typeof window !== 'undefined' ? 
        (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') ? 'http://localhost:${config.port}/api' : window.location.origin + '/api') 
        : '/api');

// withCredentials: true is required for Windows Auth (Negotiate) to work cross-origin
export const api = axios.create({ 
    baseURL: API_URL,
    withCredentials: true 
});

const DB_NAME = '${config.projectName.toLowerCase()}_db';
const DB_VERSION = 1;

const STORES = ${JSON.stringify(tables.map(t => {
  const pkField = t.fields.find(f => f.isPrimaryKey)?.name || 'id';
  return {
    name: toCamelCase(t.name),
    keyPath: toCamelCase(pkField)
  };
}))};

export interface PagedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = request.result;
            STORES.forEach(store => {
                if (!db.objectStoreNames.contains(store.name)) {
                    db.createObjectStore(store.name, { keyPath: store.keyPath });
                }
            });
            if (!db.objectStoreNames.contains('users')) {
                db.createObjectStore('users', { keyPath: 'username' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const parseEndpoint = (endpoint: string) => {
    const parts = endpoint.split('/').filter(Boolean);
    if (parts[0] === 'queries') {
        return { type: 'query', target: parts[1], id: undefined };
    }
    return { type: 'table', target: parts[0], id: parts[1] };
};

export const get = async <T>(endpoint: string, params?: any): Promise<PagedResponse<T> | any> => {
    const { type, target, id } = parseEndpoint(endpoint);
    
    if (type === 'query') {
        return { data: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
    }

    const storeConfig = STORES.find(s => s.name.toLowerCase() === target.toLowerCase());
    const storeName = storeConfig ? storeConfig.name : target;

    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) {
        return id ? null : { data: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        
        if (id) {
            const parsedId = isNaN(Number(id)) ? id : Number(id);
            const request = store.get(parsedId);
            request.onsuccess = () => {
                resolve(request.result || null);
            };
            request.onerror = () => reject(request.error);
        } else {
            const request = store.getAll();
            request.onsuccess = () => {
                let rows = request.result || [];
                
                if (params?.search) {
                    const term = String(params.search).toLowerCase();
                    rows = rows.filter(row => {
                        return Object.values(row).some(val => 
                            String(val).toLowerCase().includes(term)
                        );
                    });
                }
                
                const page = Number(params?.page || 1);
                const pageSize = Number(params?.pageSize || 20);
                const total = rows.length;
                const totalPages = Math.ceil(total / pageSize);
                const startIdx = (page - 1) * pageSize;
                const pagedRows = rows.slice(startIdx, startIdx + pageSize);
                
                resolve({
                    data: pagedRows,
                    total,
                    page,
                    pageSize,
                    totalPages
                });
            };
            request.onerror = () => reject(request.error);
        }
    });
};

export const post = async <T>(endpoint: string, data: any): Promise<T> => {
    const { target } = parseEndpoint(endpoint);
    const storeConfig = STORES.find(s => s.name.toLowerCase() === target.toLowerCase());
    const storeName = storeConfig ? storeConfig.name : target;
    const keyPath = storeConfig ? storeConfig.keyPath : 'id';

    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) {
        throw new Error('Store not found: ' + storeName);
    }

    const records = await new Promise<any[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });

    const payload = { ...data };
    
    if (payload[keyPath] === undefined || payload[keyPath] === null || payload[keyPath] === '') {
        const numericKeys = records.map(r => Number(r[keyPath])).filter(n => !isNaN(n));
        if (numericKeys.length > 0) {
            payload[keyPath] = Math.max(...numericKeys) + 1;
        } else {
            payload[keyPath] = Date.now();
        }
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.add(payload);
        request.onsuccess = () => resolve(payload as T);
        request.onerror = () => reject(request.error);
    });
};

export const put = async <T>(endpoint: string, data: any): Promise<T> => {
    const { target, id } = parseEndpoint(endpoint);
    const storeConfig = STORES.find(s => s.name.toLowerCase() === target.toLowerCase());
    const storeName = storeConfig ? storeConfig.name : target;
    const keyPath = storeConfig ? storeConfig.keyPath : 'id';

    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) {
        throw new Error('Store not found: ' + storeName);
    }

    const payload = { ...data };
    if (id) {
        payload[keyPath] = isNaN(Number(id)) ? id : Number(id);
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(payload);
        request.onsuccess = () => resolve(payload as T);
        request.onerror = () => reject(request.error);
    });
};

export const remove = async (endpoint: string): Promise<any> => {
    const { target, id } = parseEndpoint(endpoint);
    const storeConfig = STORES.find(s => s.name.toLowerCase() === target.toLowerCase());
    const storeName = storeConfig ? storeConfig.name : target;

    if (!id) throw new Error('Delete requires an ID');

    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) {
        throw new Error('Store not found: ' + storeName);
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const parsedId = isNaN(Number(id)) ? id : Number(id);
        const request = store.delete(parsedId);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => reject(request.error);
    });
};

// Local Auth API using IndexedDB
export const loginUser = async (credentials: any) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('users', 'readonly');
        const store = tx.objectStore('users');
        const request = store.get(credentials.username);
        request.onsuccess = () => {
            const user = request.result;
            if (user && user.password === credentials.password) {
                const token = 'mock-jwt-token-' + Date.now();
                localStorage.setItem('auth_token', token);
                localStorage.setItem('auth_user', JSON.stringify({ username: user.username, email: user.email }));
                resolve({ token, user: { username: user.username, email: user.email } });
            } else {
                if (credentials.username === 'admin' && credentials.password === 'admin') {
                    const token = 'mock-jwt-token-admin';
                    localStorage.setItem('auth_token', token);
                    localStorage.setItem('auth_user', JSON.stringify({ username: 'admin', email: 'admin@example.com' }));
                    resolve({ token, user: { username: 'admin', email: 'admin@example.com' } });
                } else {
                    reject(new Error('Ungültige Anmeldedaten'));
                }
            }
        };
        request.onerror = () => reject(request.error);
    });
};

export const registerUser = async (userData: any) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('users', 'readwrite');
        const store = tx.objectStore('users');
        const request = store.add(userData);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => reject(request.error);
    });
};

export const changePassword = async (data: any) => {
    const db = await openDB();
    const savedUser = localStorage.getItem('auth_user');
    if (!savedUser) throw new Error('Not logged in');
    const { username } = JSON.parse(savedUser);

    return new Promise((resolve, reject) => {
        const tx = db.transaction('users', 'readwrite');
        const store = tx.objectStore('users');
        const getReq = store.get(username);
        getReq.onsuccess = () => {
            const user = getReq.result;
            if (user) {
                user.password = data.newPassword;
                const putReq = store.put(user);
                putReq.onsuccess = () => resolve({ success: true });
                putReq.onerror = () => reject(putReq.error);
            } else {
                reject(new Error('User not found'));
            }
        };
        getReq.onerror = () => reject(getReq.error);
    });
};

export const logoutUser = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
};
`;;
  
  files.push({ name: 'api.ts', path: `${root}/src/services/api.ts`, content: apiService, language: 'typescript' });

  let typesContent = '';
  
  // Table Interfaces
  tables.forEach(table => {
    const safeName = toPascalCase(table.name);
    const props = table.fields.map(f => `  ${toCamelCase(f.name)}${isNullable(f) ? '?' : ''}: ${resolveType(f, 'typescript')};`);
    typesContent += `export interface ${safeName} {\n${props.join('\n')}\n}\n\n`;
  });

  // Query Interfaces
  queries.filter(q => q.type === 'SELECT').forEach(q => {
      const query = q as SelectQuery;
      const safeName = toPascalCase(q.name);
      const usedNames = new Set<string>(); // Track used property names to prevent duplicates
      
      const props = query.columns.filter(c => c.show).map(c => {
          let type = 'string';
          const table = tables.find(t => t.id === c.tableId);
          const field = table?.fields.find(f => f.id === c.fieldId);
          if (field) {
              type = resolveType(field, 'typescript');
          }
          if (c.aggregate === 'COUNT') type = 'number';
          
          // Naming Logic: Alias -> FieldName -> FieldName + TableName -> FieldName + Counter
          let rawName = c.alias && c.alias.trim() !== '' ? c.alias : c.fieldName;
          let propName = toCamelCase(rawName);

          if (usedNames.has(propName)) {
              // Collision detected! Try appending TableName
              const tableSuffix = toPascalCase(c.tableName);
              propName = toCamelCase(`${rawName}${tableSuffix}`);
          }

          // If still collision, append number
          let counter = 2;
          const originalPropName = propName;
          while (usedNames.has(propName)) {
              propName = `${originalPropName}${counter}`;
              counter++;
          }

          usedNames.add(propName);
          return `  ${propName}?: ${type};`;
      });
      
      typesContent += `export interface ${safeName} {\n${props.join('\n')}\n}\n\n`;
  });

  files.push({ name: 'types.ts', path: `${root}/src/types/index.ts`, content: typesContent, language: 'typescript' });

  return files;
};
