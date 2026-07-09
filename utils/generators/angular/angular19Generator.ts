import { Table, Query, Form, VirtualFile, Relationship, BackendConfig, Report, CustomPage } from '../../../types/index';
import { generateAngularConfigs } from './configs';
import { generateAngularServices } from './services';
import { generateAngularComponents } from './components';
import { generateAngularStructure } from './structure';

export const generateAngular19 = (
  tables: Table[],
  relationships: Relationship[],
  queries: Query[],
  forms: Form[],
  config: BackendConfig,
  reports: Report[] = [],
  pages: CustomPage[] = []
): VirtualFile[] => {
  const root = `Frontend`;
  const appRoot = `${root}/src/app`;
  const useAuth = config.authConfig?.useUserLogin;

  // Generate component files
  const { files: componentFiles, routes: routeObjects } = generateAngularComponents(
    tables,
    relationships,
    forms,
    reports,
    config,
    appRoot,
    queries,
    pages
  );

  // Generate app.routes.ts
  let routeImports = [...new Set(routeObjects.map(r => `import { ${r.component} } from './pages/${r.folder}/${r.file}';`))].join('\n');
  routeImports += `\nimport { LayoutComponent } from './components/layout/layout.component';`;
  
  if (useAuth) {
    routeImports += `\nimport { LoginComponent } from './pages/auth/login.component';\nimport { RegisterComponent } from './pages/auth/register.component';\nimport { ForgotPasswordComponent } from './pages/auth/forgot-password.component';\nimport { ProfileComponent } from './pages/auth/profile.component';\nimport { ForbiddenComponent } from './pages/auth/forbidden.component';\nimport { authGuard } from './guards/auth.guard';`;
  }

  // Deduplicate Routes
  const uniqueRoutes = new Map();
  routeObjects.forEach(r => {
    if (!uniqueRoutes.has(r.path)) {
      uniqueRoutes.set(r.path, r);
    }
  });

  const routeDefs = Array.from(uniqueRoutes.values()).map(r => {
    let guard = '';
    if (useAuth) {
      const isAdminRoute = r.path.includes('sysUsers') || r.path.includes('sysRoles');
      const rolesData = isAdminRoute ? `, data: { roles: ['Admin'] }` : '';
      guard = `, canActivate: [authGuard]${rolesData}`;
    }
    return `      { path: '${r.path}', component: ${r.component}${guard} }`;
  }).join(',\n');

  let routesContent = '';
  if (useAuth) {
    routesContent = `
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'forbidden', component: ForbiddenComponent },
  { 
    path: '', 
    component: LayoutComponent,
    children: [
      { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
${routeDefs}
    ]
  },
  { path: '**', redirectTo: '' }`;
  } else {
    routesContent = `
  { 
    path: '', 
    component: LayoutComponent,
    children: [
${routeDefs}
    ]
  },
  { path: '**', redirectTo: '' }`;
  }
  
  const routesFile: VirtualFile = {
    name: 'app.routes.ts',
    path: `${appRoot}/app.routes.ts`,
    content: `import { Routes } from '@angular/router';\n${routeImports}\n\nexport const appRoutes: Routes = [\n${routesContent}\n];`,
    language: 'typescript'
  };

  // Adjust package.json dependencies for Angular 19
  const configFiles = generateAngularConfigs(config, root);
  const packageJsonIndex = configFiles.findIndex(f => f.name === 'package.json');
  if (packageJsonIndex !== -1) {
    const pkg = JSON.parse(configFiles[packageJsonIndex].content);
    pkg.dependencies = {
      ...pkg.dependencies,
      "@angular/common": "^19.0.0",
      "@angular/core": "^19.0.0",
      "@angular/forms": "^19.0.0",
      "@angular/platform-browser": "^19.0.0",
      "@angular/platform-browser-dynamic": "^19.0.0",
      "@angular/router": "^19.0.0",
      "rxjs": "~7.8.0"
    };
    pkg.devDependencies = {
      ...pkg.devDependencies,
      "@angular-devkit/build-angular": "^19.0.0",
      "@angular/cli": "^19.0.0",
      "@angular/compiler-cli": "^19.0.0",
      "typescript": "~5.6.2"
    };
    configFiles[packageJsonIndex].content = JSON.stringify(pkg, null, 2);
  }

  // Adjust main.ts to use zoneless change detection in Angular 19
  const mainTsIndex = configFiles.findIndex(f => f.name === 'main.ts');
  if (mainTsIndex !== -1) {
    configFiles[mainTsIndex].content = `import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient${useAuth ? ', withInterceptors' : ''} } from '@angular/common/http';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
${useAuth ? "import { authInterceptor } from './app/interceptors/auth.interceptor';" : ""}

bootstrapApplication(AppComponent, {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(appRoutes),
    provideHttpClient(${useAuth ? 'withInterceptors([authInterceptor])' : ''})
  ]
}).catch(err => console.error(err));
`;
  }

  // Generate standard services and local IndexedDB database
  const serviceFiles = generateAngularServices(tables, queries, config, appRoot);
  
  const indexedDbService = `import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IndexedDbService {
  private dbName = '${config.projectName}_local_db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {}

  private initDb(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        // Create store for every designer table
${tables.map(t => `        if (!db.objectStoreNames.contains('${t.name.toLowerCase()}')) {
          db.createObjectStore('${t.name.toLowerCase()}', { keyPath: 'id', autoIncrement: true });
        }`).join('\n')}
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve(this.db!);
      };

      request.onerror = (event: any) => {
        reject(event.target.error);
      };
    });
  }

  hasStore(storeName: string): Promise<boolean> {
    return this.initDb().then((db) => {
      const lower = storeName.toLowerCase();
      return db.objectStoreNames.contains(lower) || db.objectStoreNames.contains(storeName);
    }).catch(() => false);
  }

  private getStoreName(db: IDBDatabase, name: string): string {
    const lower = name.toLowerCase();
    if (db.objectStoreNames.contains(lower)) return lower;
    if (db.objectStoreNames.contains(name)) return name;
    throw new Error('Object store not found: ' + name);
  }

  getAll(storeName: string): Observable<any[]> {
    return from(
      this.initDb().then((db) => {
        return new Promise<any[]>((resolve, reject) => {
          try {
            const actualName = this.getStoreName(db, storeName);
            const transaction = db.transaction(actualName, 'readonly');
            const store = transaction.objectStore(actualName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          } catch (e) {
            reject(e);
          }
        });
      })
    );
  }

  getById(storeName: string, id: any): Observable<any> {
    const safeId = typeof id === 'string' && !isNaN(Number(id)) ? Number(id) : id;
    return from(
      this.initDb().then((db) => {
        return new Promise<any>((resolve, reject) => {
          try {
            const actualName = this.getStoreName(db, storeName);
            const transaction = db.transaction(actualName, 'readonly');
            const store = transaction.objectStore(actualName);
            const request = store.get(safeId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          } catch (e) {
            reject(e);
          }
        });
      })
    );
  }

  create(storeName: string, item: any): Observable<any> {
    const record = { ...item };
    if (!record.id) {
      record.id = Math.random().toString(36).substr(2, 9);
    }
    return from(
      this.initDb().then((db) => {
        return new Promise<any>((resolve, reject) => {
          try {
            const actualName = this.getStoreName(db, storeName);
            const transaction = db.transaction(actualName, 'readwrite');
            const store = transaction.objectStore(actualName);
            const request = store.put(record);

            request.onsuccess = () => resolve(record);
            request.onerror = () => reject(request.error);
          } catch (e) {
            reject(e);
          }
        });
      })
    );
  }

  update(storeName: string, id: any, item: any): Observable<any> {
    const record = { ...item, id };
    return from(
      this.initDb().then((db) => {
        return new Promise<any>((resolve, reject) => {
          try {
            const actualName = this.getStoreName(db, storeName);
            const transaction = db.transaction(actualName, 'readwrite');
            const store = transaction.objectStore(actualName);
            const request = store.put(record);

            request.onsuccess = () => resolve(record);
            request.onerror = () => reject(request.error);
          } catch (e) {
            reject(e);
          }
        });
      })
    );
  }

  delete(storeName: string, id: any): Observable<void> {
    const safeId = typeof id === 'string' && !isNaN(Number(id)) ? Number(id) : id;
    return from(
      this.initDb().then((db) => {
        return new Promise<void>((resolve, reject) => {
          try {
            const actualName = this.getStoreName(db, storeName);
            const transaction = db.transaction(actualName, 'readwrite');
            const store = transaction.objectStore(actualName);
            const request = store.delete(safeId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          } catch (e) {
            reject(e);
          }
        });
      })
    );
  }
}
`;
  serviceFiles.push({
    name: 'indexed-db.service.ts',
    path: `${appRoot}/services/indexed-db.service.ts`,
    content: indexedDbService,
    language: 'typescript'
  });

  const apiServiceIndex = serviceFiles.findIndex(f => f.name === 'api.service.ts');
  if (apiServiceIndex !== -1) {
    serviceFiles[apiServiceIndex].content = `import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { IndexedDbService } from './indexed-db.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private indexedDb = inject(IndexedDbService);

  // STORAGE TARGET PRIORITY TOGGLE:
  // Set to true to query the browser's persistent IndexedDB local store (Database Priority).
  // Set to false to proxy requests to SQL, MYSQL or external REST APIs.
  private useIndexedDb = true;

  get<T>(endpoint: string, params: any = {}): Observable<T> {
    return from(this.indexedDb.hasStore(endpoint)).pipe(
      switchMap(hasStore => {
        if (this.useIndexedDb && hasStore) {
          return this.indexedDb.getAll(endpoint) as unknown as Observable<T>;
        }
        return this.http.get<T>(this.baseUrl + '/' + endpoint, { params, withCredentials: true });
      }),
      catchError(err => {
        console.warn('IndexedDB fallback to HTTP for:', endpoint, err);
        return this.http.get<T>(this.baseUrl + '/' + endpoint, { params, withCredentials: true });
      })
    );
  }

  getAll(endpoint: string, page: number = 1, pageSize: number = 20, search: string = ''): Observable<any> {
    return from(this.indexedDb.hasStore(endpoint)).pipe(
      switchMap(hasStore => {
        if (this.useIndexedDb && hasStore) {
          return this.indexedDb.getAll(endpoint).pipe(
            map(items => {
              let filtered = [...items];
              if (search) {
                const term = search.toLowerCase();
                filtered = filtered.filter(item => 
                  Object.values(item).some(val => String(val).toLowerCase().includes(term))
                );
              }
              const total = filtered.length;
              const start = (page - 1) * pageSize;
              const paginated = filtered.slice(start, start + pageSize);
              return {
                data: paginated,
                total,
                page,
                totalPages: Math.ceil(total / pageSize)
              };
            })
          );
        }

        let params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());
        
        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<any>(this.baseUrl + '/' + endpoint, { params, withCredentials: true }).pipe(
          map(response => {
              if (Array.isArray(response)) {
                  return { data: response, total: response.length, page: 1, totalPages: 1 };
              }
              if (response && response.data && Array.isArray(response.data)) {
                  return response;
              }
              return { data: [], total: 0, page: 1, totalPages: 0 };
          })
        );
      }),
      catchError(err => {
        console.warn('IndexedDB fallback to HTTP for getAll:', endpoint, err);
        let params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());
        if (search) {
            params = params.set('search', search);
        }
        return this.http.get<any>(this.baseUrl + '/' + endpoint, { params, withCredentials: true }).pipe(
          map(response => {
              if (Array.isArray(response)) {
                  return { data: response, total: response.length, page: 1, totalPages: 1 };
              }
              if (response && response.data && Array.isArray(response.data)) {
                  return response;
              }
              return { data: [], total: 0, page: 1, totalPages: 0 };
          })
        );
      })
    );
  }

  getById(endpoint: string, id: any): Observable<any> {
    return from(this.indexedDb.hasStore(endpoint)).pipe(
      switchMap(hasStore => {
        if (this.useIndexedDb && hasStore) {
          return this.indexedDb.getById(endpoint, id);
        }
        return this.http.get<any>(this.baseUrl + '/' + endpoint + '/' + id, { withCredentials: true });
      }),
      catchError(err => {
        console.warn('IndexedDB fallback to HTTP for getById:', endpoint, err);
        return this.http.get<any>(this.baseUrl + '/' + endpoint + '/' + id, { withCredentials: true });
      })
    );
  }

  create(endpoint: string, item: any): Observable<any> {
    return from(this.indexedDb.hasStore(endpoint)).pipe(
      switchMap(hasStore => {
        if (this.useIndexedDb && hasStore) {
          return this.indexedDb.create(endpoint, item);
        }
        return this.http.post<any>(this.baseUrl + '/' + endpoint, item, { withCredentials: true });
      }),
      catchError(err => {
        console.warn('IndexedDB fallback to HTTP for create:', endpoint, err);
        return this.http.post<any>(this.baseUrl + '/' + endpoint, item, { withCredentials: true });
      })
    );
  }

  update(endpoint: string, id: any, item: any): Observable<any> {
    return from(this.indexedDb.hasStore(endpoint)).pipe(
      switchMap(hasStore => {
        if (this.useIndexedDb && hasStore) {
          return this.indexedDb.update(endpoint, id, item);
        }
        return this.http.put<any>(this.baseUrl + '/' + endpoint + '/' + id, item, { withCredentials: true });
      }),
      catchError(err => {
        console.warn('IndexedDB fallback to HTTP for update:', endpoint, err);
        return this.http.put<any>(this.baseUrl + '/' + endpoint + '/' + id, item, { withCredentials: true });
      })
    );
  }

  delete(endpoint: string, id: any): Observable<void> {
    return from(this.indexedDb.hasStore(endpoint)).pipe(
      switchMap(hasStore => {
        if (this.useIndexedDb && hasStore) {
          return this.indexedDb.delete(endpoint, id);
        }
        return this.http.delete<void>(this.baseUrl + '/' + endpoint + '/' + id, { withCredentials: true });
      }),
      catchError(err => {
        console.warn('IndexedDB fallback to HTTP for delete:', endpoint, err);
        return this.http.delete<void>(this.baseUrl + '/' + endpoint + '/' + id, { withCredentials: true });
      })
    );
  }
}`;
  }

  const structureFiles = generateAngularStructure(config, tables, root, pages);

  const readmeContent = `# ${config.projectName} (Angular 19 Client)

Dieses Frontend wurde mit **Angular 19** generiert. Es nutzt standardmäßig **Zoneless Change Detection** für bahnbrechende Performance sowie moderne Signal-basierte APIs.

## 🗄️ IndexedDB Datenbank-Priorität
Die Anwendung verwendet standardmäßig die **IndexedDB** des Browsers zur lokalen Datenspeicherung.
Dadurch ist die App sofort offline lauffähig, ohne dass ein Server gestartet werden muss.

* Die Schnittstellen in \`api.service.ts\` sind so strukturiert, dass durch Ändern von \`useIndexedDb = false\` sofort auf ein echtes Backend (PostgreSQL, MySQL, SQLite etc.) umgestellt werden kann!
`;
  const readme: VirtualFile = { name: 'README.md', path: `${root}/README.md`, content: readmeContent, language: 'markdown' };

  return [
    ...configFiles,
    ...serviceFiles,
    ...componentFiles,
    ...structureFiles,
    routesFile,
    readme
  ];
};
