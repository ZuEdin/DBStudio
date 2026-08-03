import { Table, Relationship, Query, BackendConfig, VirtualFile, Form, Report } from '../../../types/index';
import { generateAngular } from '../angularGenerator';

export const generateElectronAngularFrontend = (
  safeTables: Table[],
  safeRelationships: Relationship[],
  safeQueries: Query[],
  config: BackendConfig,
  safeForms: Form[],
  safeReports: Report[],
  root: string
): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const angularFiles = generateAngular(safeTables, safeRelationships, safeQueries, safeForms, config, safeReports);

  if (Array.isArray(angularFiles)) {
    angularFiles.forEach(f => {
      let relativePath = f.path.replace(/^Frontend\//, '');

      // Angular API Service: Portless Electron IPC local file access
      if (f.name === 'api.service.ts') {
        f.content = f.content.replace(
          /private baseUrl = .*/,
          `private baseUrl = (typeof window !== 'undefined' && (window as any).electronAPI) ? 'electron://local' : environment.apiUrl;`
        );

        // Enhance ApiService with Electron IPC local file/DB fallback
        f.content = f.content.replace(
          /get<T>\(endpoint: string, params: any = \{\}\): Observable<T> \{[\s\S]*?\n  \}/,
          `get<T>(endpoint: string, params: any = {}): Observable<T> {
    if (typeof window !== 'undefined' && ((window as any).electronAPI || window.location.protocol === 'file:')) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && electronAPI.readJson) {
        return new Observable<T>(subscriber => {
          electronAPI.readJson(endpoint).then((data: any) => {
            subscriber.next(data as T);
            subscriber.complete();
          }).catch((err: any) => {
            this.http.get<T>(this.getUrl(endpoint), { params, withCredentials: true }).subscribe(subscriber);
          });
        });
      }
    }
    return this.http.get<T>(this.getUrl(endpoint), { params, withCredentials: true });
  }`
        );
      }

      // Angular Main: Enable HashLocationStrategy for file:// compatibility
      if (f.name === 'main.ts') {
        f.content = f.content.replace(
          /import\s+\{\s*provideRouter\s*\}\s+from\s+'@angular\/router';/,
          "import { provideRouter, withHashLocation } from '@angular/router';"
        ).replace(
          /provideRouter\(appRoutes\)/,
          "provideRouter(appRoutes, withHashLocation())"
        );
      }

      // Angular Index HTML: Convert absolute base href to relative
      if (f.name === 'index.html') {
        f.content = f.content.replace(
          /<base href="\/">/,
          '<base href="./">'
        );
      }

      f.path = `${root}/AngularFrontend/${relativePath}`;
      files.push(f);
    });
  }

  return files;
};
