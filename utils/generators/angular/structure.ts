
import { VirtualFile, BackendConfig, Table } from '../../../types/index';
import { toCamelCase } from '../common';

export const generateAngularStructure = (config: BackendConfig, tables: Table[], root: string): VirtualFile[] => {
    const files: VirtualFile[] = [];
    const appRoot = `${root}/src/app`;

    // 1. Sidebar Component
    const sidebarHtml = `
<div class="h-full flex flex-col bg-slate-800 text-white w-64 fixed left-0 top-0 bottom-0 overflow-y-auto">
    <div class="p-4 font-bold text-xl border-b border-slate-700 flex items-center gap-2">
        <span>${config.projectName}</span>
    </div>
    <nav class="flex-1 p-2 space-y-1">
        ${tables.map(t => `
        <a routerLink="/${toCamelCase(t.name)}" routerLinkActive="bg-slate-700 text-white" class="flex items-center gap-3 px-3 py-2 rounded text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
            ${t.name}
        </a>`).join('')}
    </nav>
    <div class="p-4 border-t border-slate-700 text-xs text-slate-500 text-center">
        &copy; ${new Date().getFullYear()} Generated App
    </div>
</div>
    `;

    const sidebarTs = `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {}
    `;

    files.push({ name: 'sidebar.component.html', path: `${appRoot}/components/sidebar/sidebar.component.html`, content: sidebarHtml, language: 'html' });
    files.push({ name: 'sidebar.component.ts', path: `${appRoot}/components/sidebar/sidebar.component.ts`, content: sidebarTs, language: 'typescript' });

    // 2. Layout Component
    const layoutHtml = `
<div class="flex min-h-screen bg-slate-50">
    <app-sidebar></app-sidebar>
    <div class="flex-1 ml-64 flex flex-col">
        <header class="bg-white shadow-sm border-b border-slate-200 h-16 flex items-center px-8">
            <h1 class="text-lg font-semibold text-slate-700">Dashboard</h1>
        </header>
        <main class="flex-1 p-8 overflow-auto">
            <router-outlet></router-outlet>
        </main>
    </div>
</div>
    `;

    const layoutTs = `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './layout.component.html'
})
export class LayoutComponent {}
    `;

    files.push({ name: 'layout.component.html', path: `${appRoot}/components/layout/layout.component.html`, content: layoutHtml, language: 'html' });
    files.push({ name: 'layout.component.ts', path: `${appRoot}/components/layout/layout.component.ts`, content: layoutTs, language: 'typescript' });

    // 3. User Picker Component
    const userPickerHtml = `
<div *ngIf="isOpen" class="fixed inset-0 bg-black/50 z-[250] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-300 overflow-hidden flex flex-col h-[500px]">
        
        <!-- Header -->
        <div class="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
            <h3 class="font-bold flex items-center gap-2">Benutzer auswählen</h3>
            <button (click)="close()" class="text-slate-400 hover:text-white">X</button>
        </div>

        <!-- Tabs -->
        <div class="flex bg-slate-100 border-b border-slate-200">
            <button (click)="activeTab='me'; loadMe()" [class.bg-white]="activeTab==='me'" [class.text-blue-600]="activeTab==='me'" class="flex-1 py-3 text-sm font-bold border-t-2 border-transparent" [class.border-blue-600]="activeTab==='me'">Aktueller User</button>
            <button (click)="activeTab='search'" [class.bg-white]="activeTab==='search'" [class.text-blue-600]="activeTab==='search'" class="flex-1 py-3 text-sm font-bold border-t-2 border-transparent" [class.border-blue-600]="activeTab==='search'">Suchen</button>
        </div>

        <!-- Content -->
        <div class="flex-1 p-6 overflow-y-auto bg-slate-50 relative">
            <div *ngIf="loading" class="absolute inset-0 bg-white/50 flex items-center justify-center z-10">Lade...</div>
            <div *ngIf="error" class="mb-4 p-3 bg-orange-50 border border-orange-200 text-orange-800 rounded text-xs">{{error}}</div>

            <div *ngIf="activeTab === 'me' && me" class="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div class="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner">
                    {{me.displayName?.substring(0,2).toUpperCase()}}
                </div>
                <div>
                    <h4 class="text-xl font-bold text-slate-800">{{me.displayName}}</h4>
                    <p class="text-slate-500 text-sm font-mono">{{me.username}}</p>
                </div>
                <button (click)="select(me.username, me.displayName)" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm mt-4">
                    Übernehmen
                </button>
            </div>

            <div *ngIf="activeTab === 'search'" class="h-full flex flex-col">
                <div class="flex gap-2 mb-4">
                    <input type="text" [(ngModel)]="query" (keydown.enter)="search()" class="flex-1 border border-slate-300 rounded p-2 text-sm" placeholder="Name..." autoFocus />
                    <button (click)="search()" class="bg-slate-700 text-white px-4 rounded hover:bg-slate-800">Suchen</button>
                </div>
                
                <div class="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded bg-white">
                    <div *ngFor="let u of results" class="p-3 hover:bg-blue-50 border-b border-slate-100 flex justify-between items-center cursor-pointer" (click)="select(u.username, u.displayName)">
                        <div>
                            <div class="font-bold text-slate-700 text-sm">{{u.displayName}}</div>
                            <div class="text-xs text-slate-500 font-mono">{{u.username}}</div>
                        </div>
                        <button class="text-blue-600 text-xs font-bold">Wählen</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
    `;

    const userPickerTs = `
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-user-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-picker.component.html'
})
export class UserPickerComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() initialTab: 'me' | 'search' = 'me';
  @Output() userSelected = new EventEmitter<{username: string, displayName: string}>();
  @Output() closed = new EventEmitter<void>();

  activeTab = 'me';
  loading = false;
  error = '';
  me: any = null;
  query = '';
  results: any[] = [];

  constructor(private api: ApiService) {}

  ngOnChanges(changes: SimpleChanges) {
      if (changes['isOpen']?.currentValue) {
          this.activeTab = this.initialTab;
          if (this.activeTab === 'me') this.loadMe();
      }
  }

  loadMe() {
      this.loading = true;
      this.error = '';
      // Use generic get() to avoid pagination wrapper, as endpoint returns single object
      this.api.get('ad/me').subscribe({
          next: (data) => { this.me = data; this.loading = false; },
          error: () => { this.error = 'Fehler beim Laden.'; this.loading = false; }
      });
  }

  search() {
      if (!this.query || this.query.length < 2) return;
      this.loading = true;
      this.error = '';
      // Use generic get() to avoid pagination wrapper, as endpoint returns raw array
      this.api.get('ad/search', { q: this.query }).subscribe({
          next: (res: any) => { this.results = res; this.loading = false; },
          error: () => { this.error = 'Suche fehlgeschlagen.'; this.loading = false; }
      });
  }

  select(username: string, displayName: string) {
      this.userSelected.emit({ username, displayName });
      this.close();
  }

  close() {
      this.closed.emit();
  }
}
    `;

    files.push({ name: 'user-picker.component.html', path: `${appRoot}/components/user-picker/user-picker.component.html`, content: userPickerHtml, language: 'html' });
    files.push({ name: 'user-picker.component.ts', path: `${appRoot}/components/user-picker/user-picker.component.ts`, content: userPickerTs, language: 'typescript' });

    if (config.authConfig?.useUserLogin) {
        const forbiddenHtml = `
<div class="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 font-sans text-center">
    <!-- Inline SVG instead of lucide-react to reduce deps -->
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500 mb-6 drop-shadow-md">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
    </svg>
    <h1 class="text-5xl font-black text-slate-800 tracking-widest mb-2 uppercase">NO ACCESS</h1>
    <p class="text-lg font-medium text-slate-500 mb-8 max-w-sm">Sie haben keine Berechtigung, auf diese Seite zuzugreifen. Bitte kontaktieren Sie einen Administrator.</p>
    <a routerLink="/" class="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-lg hover:shadow-red-600/30 transform hover:-translate-y-1 inline-block">
        Zurück zur Startseite
    </a>
</div>
        `;
        const forbiddenTs = `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: \`${forbiddenHtml}\`
})
export class ForbiddenComponent {}
        `;
        files.push({ name: 'forbidden.component.ts', path: `${appRoot}/pages/auth/forbidden.component.ts`, content: forbiddenTs, language: 'typescript' });

        const loginTs = `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: \`
    <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div class="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-200">
        <h2 class="text-3xl font-black text-slate-800 text-center mb-6">Anmelden</h2>
        
        <div *ngIf="error" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          {{error}}
        </div>
        
        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Benutzername</label>
            <input type="text" [(ngModel)]="username" name="username" required
              class="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Passwort</label>
            <input type="password" [(ngModel)]="password" name="password" required
              class="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          
          <button type="submit" [disabled]="loading"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50">
            {{ loading ? 'Melde an...' : 'Einloggen' }}
          </button>
        </form>
        
        <div class="mt-6 pt-6 border-t border-slate-100 flex justify-between text-xs text-blue-600 font-medium">
          <a routerLink="/forgot-password" class="hover:underline">Passwort vergessen?</a>
          <a routerLink="/register" class="hover:underline">Neues Konto erstellen</a>
        </div>
      </div>
    </div>
  \`
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Invalide Anmeldedaten oder Verbindung fehlgeschlagen.';
      }
    });
  }
}
        `;
        files.push({ name: 'login.component.ts', path: `${appRoot}/pages/auth/login.component.ts`, content: loginTs, language: 'typescript' });

        const registerTs = `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: \`
    <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div class="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-200">
        <h2 class="text-3xl font-black text-slate-800 text-center mb-6">Registrieren</h2>
        
        <div *ngIf="error" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          {{error}}
        </div>
        <div *ngIf="success" class="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
          Registrierung erfolgreich! Sie werden zur Anmeldung weitergeleitet.
        </div>
        
        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Benutzername</label>
            <input type="text" [(ngModel)]="username" name="username" required
              class="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">E-Mail</label>
            <input type="email" [(ngModel)]="email" name="email" required
              class="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Passwort</label>
            <input type="password" [(ngModel)]="password" name="password" required
              class="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          
          <button type="submit" [disabled]="loading"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50">
            {{ loading ? 'Registriere...' : 'Konto erstellen' }}
          </button>
        </form>
        
        <div class="mt-6 text-center text-xs text-blue-600 font-medium">
          <a routerLink="/login" class="hover:underline">Bereits registriert? Zum Login</a>
        </div>
      </div>
    </div>
  \`
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  error = '';
  success = false;
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.auth.register({ username: this.username, email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Registrierung fehlgeschlagen. Der Benutzername wird eventuell bereits verwendet.';
      }
    });
  }
}
        `;
    files.push({ name: 'register.component.ts', path: `${appRoot}/pages/auth/register.component.ts`, content: registerTs, language: 'typescript' });

    const forgotPasswordTs = `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: \`
    <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div class="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-200">
        <h2 class="text-3xl font-black text-slate-800 text-center mb-4">Passwort zurücksetzen</h2>
        <p class="text-slate-500 text-sm text-center mb-6">Geben Sie Ihren Namen oder Ihre E-Mail ein, um Ihr Passwort zurückzusetzen.</p>
        
        <div *ngIf="success" class="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
          Eine Zurücksetzungsanleitung wurde an Ihre E-Mail gesendet.
        </div>
        
        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Benutzername oder E-Mail</label>
            <input type="text" [(ngModel)]="username" name="username" required
              class="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          
          <button type="submit" [disabled]="loading"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50">
            {{ loading ? 'Sende...' : 'Zurücksetzen anfordern' }}
          </button>
        </form>
        
        <div class="mt-6 text-center text-xs text-blue-600 font-medium">
          <a routerLink="/login" class="hover:underline">Zurück zum Login</a>
        </div>
      </div>
    </div>
  \`
})
export class ForgotPasswordComponent {
  username = '';
  loading = false;
  success = false;

  onSubmit() {
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.success = true;
    }, 1000);
  }
}
        `;
    files.push({ name: 'forgot-password.component.ts', path: `${appRoot}/pages/auth/forgot-password.component.ts`, content: forgotPasswordTs, language: 'typescript' });

    const profileTs = `
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: \`
    <div class="p-8 max-w-2xl mx-auto font-sans">
      <div class="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <div class="p-6 bg-slate-800 text-white">
          <h2 class="text-2xl font-bold flex items-center gap-2">Profilübersicht</h2>
        </div>
        
        <div class="p-6 space-y-6">
          <div class="flex items-center gap-4 border-b pb-6">
            <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold shadow-inner">
              {{(user?.username || 'U').substring(0, 2).toUpperCase()}}
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-800">{{user?.username}}</h3>
              <p class="text-slate-500 text-sm">Rolle: <span class="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold ml-1">{{user?.role}}</span></p>
            </div>
          </div>
          
          <div class="pt-4">
            <h4 class="text-md font-bold text-slate-800 mb-4">Passwort ändern</h4>
            <div class="space-y-4">
                <div>
                   <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Neues Passwort</label>
                   <input type="password" [(ngModel)]="newPassword" class="w-full border rounded p-2 text-sm" />
                </div>
                <button (click)="changePassword()" class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition-colors">
                   Passwort aktualisieren
                </button>
            </div>
          </div>
          
          <div class="border-t pt-6 flex justify-end">
              <button (click)="logout()" class="px-6 py-2 border rounded-lg text-red-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
                 Ausloggen
              </button>
          </div>
        </div>
      </div>
    </div>
  \`
})
export class ProfileComponent implements OnInit {
  user: any = null;
  newPassword = '';
  error = '';
  success = false;
  loading = false;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.user$.subscribe(user => this.user = user);
  }

  logout() {
    this.auth.logout();
  }

  changePassword() {
    if (!this.newPassword) return;
    this.loading = true;
    this.error = '';
    this.success = false;
    this.auth.changePassword({ newPassword: this.newPassword }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.newPassword = '';
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Passwortänderung fehlgeschlagen.';
      }
    });
  }
}
        `;
    files.push({ name: 'profile.component.ts', path: `${appRoot}/pages/auth/profile.component.ts`, content: profileTs, language: 'typescript' });
    }

    return files;
};
