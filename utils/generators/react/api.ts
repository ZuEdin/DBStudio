
import { Table, VirtualFile, BackendConfig, Query, SelectQuery } from '../../../types/index';
import { toCamelCase, toPascalCase, isNullable, resolveType } from '../common';

const mapPermissionObjectId = (row: any, tables: Table[], queries: Query[], isSql: boolean): any => {
    if (!row || typeof row !== 'object') return row;
    const newRow = { ...row };
    const key = Object.keys(newRow).find(k => k.toLowerCase() === 'objectid');
    if (!key) return row;

    const objectId = newRow[key];
    const objectTypeKey = Object.keys(newRow).find(k => k.toLowerCase() === 'objecttype');
    const objectType = objectTypeKey ? String(newRow[objectTypeKey]).toLowerCase() : '';

    if (objectType === 'table') {
        const matchedTable = tables.find(t => t.id === objectId);
        if (matchedTable) {
            newRow[key] = isSql ? toPascalCase(matchedTable.name) : matchedTable.name;
        }
    } else if (objectType === 'query') {
        const matchedQuery = queries.find(q => q.id === objectId);
        if (matchedQuery) {
            newRow[key] = isSql ? toPascalCase(matchedQuery.name) : matchedQuery.name;
        }
    } else if (objectType === 'field') {
        let matchedFieldName = '';
        for (const t of tables) {
            const f = t.fields.find(field => field.id === objectId);
            if (f) {
                matchedFieldName = f.name;
                break;
            }
        }
        if (matchedFieldName) {
            newRow[key] = matchedFieldName;
        }
    }
    return newRow;
};

export const generateReactApi = (tables: Table[], queries: Query[], config: BackendConfig, root: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const useAuth = config.authConfig?.useUserLogin;

  const getSeededData = (table: Table) => {
    const initialRows = table.data || [];
    const isPermissionsTable = table.name.toLowerCase() === 'sys_permissions';
    return initialRows.map(row => {
      const mappedRow = isPermissionsTable ? mapPermissionObjectId(row, tables, queries || [], false) : row;
      const newRow: any = { ...mappedRow };
      table.fields.forEach(f => {
        const camelKey = toCamelCase(f.name);
        const rowKeys = Object.keys(mappedRow);
        const matchedKey = rowKeys.find(k => k.toLowerCase() === f.name.toLowerCase());
        if (matchedKey !== undefined) {
          newRow[camelKey] = mappedRow[matchedKey];
          newRow[matchedKey] = mappedRow[matchedKey];
        }
      });
      return newRow;
    });
  };

  const STORES_DATA = tables.map(t => {
    const pkField = t.fields.find(f => f.isPrimaryKey)?.name || 'id';
    return {
      name: toCamelCase(t.name),
      tableName: t.name,
      keyPath: toCamelCase(pkField),
      data: getSeededData(t),
      fields: t.fields.map(f => f.name)
    };
  });
  
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

const STORES = ${JSON.stringify(STORES_DATA, null, 2)};

const normalizeKeys = (row: any, storeConfig: any) => {
    if (!row) return row;
    const normalized = { ...row };
    if (storeConfig && storeConfig.fields) {
        storeConfig.fields.forEach((fName: string) => {
            const camelKey = fName.charAt(0).toLowerCase() + fName.slice(1);
            const pascalKey = fName.charAt(0).toUpperCase() + fName.slice(1);
            const rowKeys = Object.keys(row);
            const matchedKey = rowKeys.find(k => k.toLowerCase() === fName.toLowerCase());
            if (matchedKey !== undefined) {
                normalized[camelKey] = row[matchedKey];
                normalized[pascalKey] = row[matchedKey];
                normalized[fName] = row[matchedKey];
            }
        });
    } else {
        Object.keys(row).forEach(key => {
            const camel = key.charAt(0).toLowerCase() + key.slice(1);
            if (normalized[camel] === undefined) {
                normalized[camel] = row[key];
            }
        });
    }
    return normalized;
};

const normalizeKeysOnWrite = (row: any, storeConfig: any) => {
    if (!row) return row;
    const normalized = { ...row };
    if (storeConfig && storeConfig.fields) {
        storeConfig.fields.forEach((fName: string) => {
            const camelKey = fName.charAt(0).toLowerCase() + fName.slice(1);
            const pascalKey = fName.charAt(0).toUpperCase() + fName.slice(1);
            if (row[camelKey] !== undefined) {
                normalized[fName] = row[camelKey];
                normalized[pascalKey] = row[camelKey];
            } else if (row[fName] !== undefined) {
                normalized[camelKey] = row[fName];
                normalized[pascalKey] = row[fName];
            }
        });
    }
    return normalized;
};

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
        request.onsuccess = () => {
            const db = request.result;
            const seedKey = 'db_seeded_' + DB_NAME + '_v' + DB_VERSION + '_' + STORES.map(s => s.name + '_' + (s.fields?.join('-') || '') + '_' + (s.data?.length || 0)).join('_');
            if (!localStorage.getItem(seedKey)) {
                const promises = STORES.map(store => {
                    if (store.data && store.data.length > 0 && db.objectStoreNames.contains(store.name)) {
                        return new Promise<void>((res) => {
                            try {
                                const tx = db.transaction(store.name, 'readwrite');
                                const objStore = tx.objectStore(store.name);
                                const clearReq = objStore.clear();
                                clearReq.onsuccess = () => {
                                    store.data.forEach((row: any) => {
                                        objStore.add(row);
                                    });
                                    tx.oncomplete = () => res();
                                    tx.onerror = () => res();
                                };
                                clearReq.onerror = () => res();
                            } catch (err) {
                                res();
                            }
                        });
                    }
                    return Promise.resolve();
                });
                
                Promise.all(promises).then(() => {
                    localStorage.setItem(seedKey, 'true');
                    resolve(db);
                }).catch(() => {
                    resolve(db);
                });
            } else {
                resolve(db);
            }
        };
        request.onerror = () => reject(request.error);
    });
};
const generateSimulatedJwt = (payload: any) => {
    try {
        const jsonStr = JSON.stringify(payload);
        const encodedPayload = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
            return String.fromCharCode(parseInt(p1, 16));
        }));
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const signature = 'simulated-signature';
        return \`\${header}.\${encodedPayload}.\${signature}\`;
    } catch (e) {
        return 'mock.jwt.token';
    }
};

const getUserStoreName = (db: IDBDatabase): string => {
    const names = Array.from(db.objectStoreNames);
    const found = names.find(n => {
        const ln = n.toLowerCase().replace(/_|-/g, '');
        return ln === 'sysusers' || ln === 'users';
    });
    return found || 'users';
};

const parseEndpoint = (endpoint: string) => {
    const parts = endpoint.split('/').filter(Boolean);
    if (parts[0] === 'queries') {
        return { type: 'query', target: parts[1], id: undefined };
    }
    return { type: 'table', target: parts[0], id: parts[1] };
};

const findStoreConfig = (target: string) => {
    return STORES.find(s => 
        s.name.toLowerCase() === target.toLowerCase() || 
        (s.tableName && s.tableName.toLowerCase() === target.toLowerCase()) ||
        s.name.toLowerCase().replace(/_|-/g, '') === target.toLowerCase().replace(/_|-/g, '')
    );
};

export const get = async <T>(endpoint: string, params?: any): Promise<PagedResponse<T> | any> => {
    if (endpoint.startsWith('auth/')) {
        if (endpoint === 'auth/me') {
            const token = localStorage.getItem('auth_token');
            const savedUser = localStorage.getItem('auth_user');
            if (token && savedUser) {
                return { user: JSON.parse(savedUser) };
            }
            return null;
        }
        return null;
    }

    const { type, target, id } = parseEndpoint(endpoint);
    
    if (type === 'query') {
        return { data: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
    }

    const storeConfig = findStoreConfig(target);
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
                resolve(normalizeKeys(request.result, storeConfig) || null);
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
                const pagedRows = rows.slice(startIdx, startIdx + pageSize).map(row => normalizeKeys(row, storeConfig));
                
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
    if (endpoint.startsWith('auth/')) {
        if (endpoint === 'auth/login') {
            return loginUser(data) as any;
        }
        if (endpoint === 'auth/register') {
            return registerUser(data) as any;
        }
        if (endpoint === 'auth/login-sso') {
            const token = generateSimulatedJwt({ unique_name: data.provider || 'sso', role: 'User' });
            const user = { username: (data.provider || 'sso') + 'User', email: 'sso@example.com', role: 'User' };
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(user));
            return { token, user } as any;
        }
        throw new Error('Unsupported auth endpoint: ' + endpoint);
    }

    const { target } = parseEndpoint(endpoint);
    const storeConfig = findStoreConfig(target);
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

    const payload = normalizeKeysOnWrite({ ...data }, storeConfig);
    
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
        request.onsuccess = () => resolve(normalizeKeys(payload, storeConfig) as T);
        request.onerror = () => reject(request.error);
    });
};

export const put = async <T>(endpoint: string, data: any): Promise<T> => {
    const { target, id } = parseEndpoint(endpoint);
    const storeConfig = findStoreConfig(target);
    const storeName = storeConfig ? storeConfig.name : target;
    const keyPath = storeConfig ? storeConfig.keyPath : 'id';

    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) {
        throw new Error('Store not found: ' + storeName);
    }

    const payload = normalizeKeysOnWrite({ ...data }, storeConfig);
    if (id) {
        payload[keyPath] = isNaN(Number(id)) ? id : Number(id);
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(payload);
        request.onsuccess = () => resolve(normalizeKeys(payload, storeConfig) as T);
        request.onerror = () => reject(request.error);
    });
};

export const remove = async (endpoint: string): Promise<any> => {
    const { target, id } = parseEndpoint(endpoint);
    const storeConfig = findStoreConfig(target);
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
    const storeName = getUserStoreName(db);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => {
            const users = request.result || [];
            const user = users.find((u: any) => {
                const uName = (u.Username || u.username || '').toLowerCase();
                return uName === credentials.username.toLowerCase();
            });

            const passwordMatches = user && (
                user.PasswordHash === credentials.password ||
                user.passwordHash === credentials.password ||
                user.Password === credentials.password ||
                user.password === credentials.password
            );

            if (user && passwordMatches) {
                const uName = user.Username || user.username || credentials.username;
                const uEmail = user.Email || user.email || (uName + '@demo.com');
                const roleId = user.RoleId !== undefined ? user.RoleId : (user.roleId !== undefined ? user.roleId : 4);
                let role = user.Role || user.role || 'User';
                if (roleId === 1) role = 'Admin';
                else if (roleId === 2) role = 'Manager';
                else if (roleId === 3) role = 'Editor';
                else if (roleId === 4) role = 'User';

                const token = generateSimulatedJwt({ unique_name: uName, role });
                localStorage.setItem('auth_token', token);
                localStorage.setItem('auth_user', JSON.stringify({ username: uName, email: uEmail, role }));
                resolve({ token, user: { username: uName, email: uEmail, role } });
            } else {
                if (credentials.username === 'admin' && (credentials.password === 'admin' || credentials.password === 'admin123')) {
                    const token = generateSimulatedJwt({ unique_name: 'admin', role: 'Admin' });
                    localStorage.setItem('auth_token', token);
                    localStorage.setItem('auth_user', JSON.stringify({ username: 'admin', email: 'admin@example.com', role: 'Admin' }));
                    resolve({ token, user: { username: 'admin', email: 'admin@example.com', role: 'Admin' } });
                } else if (credentials.username === 'user' && (credentials.password === 'user' || credentials.password === 'user123')) {
                    const token = generateSimulatedJwt({ unique_name: 'user', role: 'User' });
                    localStorage.setItem('auth_token', token);
                    localStorage.setItem('auth_user', JSON.stringify({ username: 'user', email: 'user@example.com', role: 'User' }));
                    resolve({ token, user: { username: 'user', email: 'user@example.com', role: 'User' } });
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
    const storeName = getUserStoreName(db);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        
        const pkField = store.keyPath || 'id';
        const payload: any = {};
        
        payload[pkField] = Date.now();
        payload.Username = userData.username;
        payload.username = userData.username;
        payload.PasswordHash = userData.password;
        payload.password = userData.password;
        payload.Email = userData.email;
        payload.email = userData.email;
        payload.RoleId = 4;
        payload.roleId = 4;
        payload.IsActive = true;
        payload.isActive = true;

        const request = store.add(payload);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => reject(request.error);
    });
};

export const changePassword = async (data: any) => {
    const db = await openDB();
    const savedUser = localStorage.getItem('auth_user');
    if (!savedUser) throw new Error('Not logged in');
    const { username } = JSON.parse(savedUser);
    const storeName = getUserStoreName(db);

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const getReq = store.getAll();
        getReq.onsuccess = () => {
            const users = getReq.result || [];
            const user = users.find((u: any) => {
                const uName = (u.Username || u.username || '').toLowerCase();
                return uName === username.toLowerCase();
            });

            if (user) {
                if (user.PasswordHash !== undefined) user.PasswordHash = data.newPassword;
                if (user.passwordHash !== undefined) user.passwordHash = data.newPassword;
                if (user.Password !== undefined) user.Password = data.newPassword;
                if (user.password !== undefined) user.password = data.newPassword;
                
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
