
import { Table, VirtualFile, BackendConfig, Query, SelectQuery } from '../../../types/index';
import { toCamelCase, toPascalCase, isNullable, resolveType } from '../common';

export const generateAngularServices = (tables: Table[], queries: Query[], config: BackendConfig, appRoot: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const useAuth = config.authConfig?.useUserLogin;

  // Table Models
  tables.forEach(table => {
    const safeName = toPascalCase(table.name);
    const props = table.fields.map(f => `  ${toCamelCase(f.name)}${isNullable(f) ? '?' : ''}: ${resolveType(f, 'typescript')};`);
    
    files.push({ 
        name: `${safeName.toLowerCase()}.interface.ts`, 
        path: `${appRoot}/models/${safeName.toLowerCase()}.interface.ts`, 
        content: `export interface ${safeName} {\n${props.join('\n')}\n}`, 
        language: 'typescript' 
    });
  });

  // Query Models
  queries.filter(q => q.type === 'SELECT').forEach(q => {
      const query = q as SelectQuery;
      const safeName = toPascalCase(q.name);
      const usedNames = new Set<string>();
      const props = query.columns.filter(c => c.show).map(c => {
          let type = 'string';
          const table = tables.find(t => t.id === c.tableId);
          const field = table?.fields.find(f => f.id === c.fieldId);
          if (field) {
              type = resolveType(field, 'typescript');
          }
          if (c.aggregate === 'COUNT') type = 'number';
          let propName = toCamelCase(c.alias || c.fieldName);
          if (usedNames.has(propName)) {
              const tableSuffix = toPascalCase(c.tableName);
              propName = toCamelCase(`${c.alias || c.fieldName}${tableSuffix}`);
          }
          let counter = 2;
          const original = propName;
          while (usedNames.has(propName)) {
              propName = `${original}${counter}`;
              counter++;
          }
          usedNames.add(propName);
          return `  ${propName}?: ${type};`;
      });
      files.push({ 
        name: `${safeName.toLowerCase()}.interface.ts`, 
        path: `${appRoot}/models/${safeName.toLowerCase()}.interface.ts`, 
        content: `export interface ${safeName} {\n${props.join('\n')}\n}`, 
        language: 'typescript' 
    });
  });

  // API Service
  const apiService = `import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  get<T>(endpoint: string, params: any = {}): Observable<T> {
    return this.http.get<T>(this.baseUrl + '/' + endpoint, { params, withCredentials: true });
  }

  getAll(endpoint: string, page: number = 1, pageSize: number = 20, search: string = ''): Observable<any> {
    let params = new HttpParams()
        .set('page', page.toString())
        .set('pageSize', pageSize.toString());
    
    if (search) params = params.set('search', search);

    return this.http.get<any>(this.baseUrl + '/' + endpoint, { params, withCredentials: true }).pipe(
      map(response => {
          if (Array.isArray(response)) return { data: response, total: response.length, page: 1, totalPages: 1 };
          if (response && response.data && Array.isArray(response.data)) return response;
          return { data: [], total: 0, page: 1, totalPages: 0 };
      })
    );
  }

  getById(endpoint: string, id: any): Observable<any> {
    return this.http.get<any>(this.baseUrl + '/' + endpoint + '/' + id, { withCredentials: true });
  }

  create(endpoint: string, item: any): Observable<any> {
    return this.http.post<any>(this.baseUrl + '/' + endpoint, item, { withCredentials: true });
  }

  update(endpoint: string, id: any, item: any): Observable<any> {
    return this.http.put<any>(this.baseUrl + '/' + endpoint + '/' + id, item, { withCredentials: true });
  }

  delete(endpoint: string, id: any): Observable<void> {
    return this.http.delete<void>(this.baseUrl + '/' + endpoint + '/' + id, { withCredentials: true });
  }
}`;
  files.push({ name: 'api.service.ts', path: `${appRoot}/services/api.service.ts`, content: apiService, language: 'typescript' });

  // Auth Logic Generation
  if (useAuth) {
      // 1. Auth Service
      const authService = `import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.apiUrl + '/auth';
  private tokenKey = 'auth_token';
  public userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const token = localStorage.getItem(this.tokenKey);
    if (token) this.decodeAndNotify(token);
  }

  private decodeAndNotify(token: string) {
      try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const user = {
              username: payload.unique_name || payload.sub,
              role: payload.role || 'User',
              token
          };
          this.userSubject.next(user);
      } catch (e) {
          this.logout();
      }
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(this.baseUrl + '/login', credentials).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          this.decodeAndNotify(response.token);
        }
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post<any>(this.baseUrl + '/register', data);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean { return !!this.userSubject.value; }
  
  hasRole(role: string): boolean { return this.userSubject.value?.role === role; }

  getToken(): string | null { return localStorage.getItem(this.tokenKey); }
}`;
      files.push({ name: 'auth.service.ts', path: `${appRoot}/services/auth.service.ts`, content: authService, language: 'typescript' });

      // 2. Auth Guard
      const authGuard = `import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Check Role requirements defined in route data
  const expectedRoles = route.data['roles'] as Array<string>;
  if (expectedRoles && expectedRoles.length > 0) {
      const userRole = auth.userSubject.value?.role;
      if (!userRole || !expectedRoles.includes(userRole)) {
          return router.createUrlTree(['/forbidden']);
      }
  }

  return true;
};`;
      files.push({ name: 'auth.guard.ts', path: `${appRoot}/guards/auth.guard.ts`, content: authGuard, language: 'typescript' });

      // 3. Auth Interceptor
      const authInterceptor = `import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: \`Bearer \${token}\` }
    });
  }

  return next(req);
};`;
      files.push({ name: 'auth.interceptor.ts', path: `${appRoot}/interceptors/auth.interceptor.ts`, content: authInterceptor, language: 'typescript' });
  }

  return files;
};
