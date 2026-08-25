import { VirtualFile, BackendConfig } from '../../../../types/index';

export const generateLayoutComponents = (
    config: BackendConfig,
    appRoot: string
): VirtualFile[] => {
    const files: VirtualFile[] = [];
    const isBootstrap = config.stylingFramework?.toLowerCase() === 'bootstrap' || 
                        (config as any).frontendStyling?.toLowerCase() === 'bootstrap' || 
                        (config as any).styling?.toLowerCase() === 'bootstrap';
    const isTopNav = config.navigationPreset === 'top_nav';

    let layoutHtml = '';
    if (isTopNav) {
        if (isBootstrap) {
            layoutHtml = `
<div class="min-vh-100 bg-light d-flex flex-column print-container">
    <app-topnav class="d-print-none"></app-topnav>
    <main class="flex-grow-1 p-4 overflow-auto w-100 min-vw-0 print-main">
        <router-outlet></router-outlet>
    </main>
</div>
            `;
        } else {
            layoutHtml = `
<div class="min-h-screen bg-slate-50 flex flex-col print:min-h-0 print:bg-white">
    <app-topnav class="print:hidden"></app-topnav>
    <main class="flex-1 p-6 sm:p-8 w-full min-w-0 overflow-auto print:p-0 print:overflow-visible">
        <router-outlet></router-outlet>
    </main>
</div>
            `;
        }
    } else {
        if (isBootstrap) {
            layoutHtml = `
<div class="d-flex min-vh-100 bg-light print-container">
    <app-sidebar class="d-print-none"></app-sidebar>
    <div class="flex-grow-1 d-flex flex-column min-w-0 print-main" style="margin-left: 280px; min-height: 100vh;">
        <header class="bg-white shadow-sm border-bottom d-flex align-items-center px-4 d-print-none" style="height: 64px;">
            <h1 class="h5 mb-0 text-muted fw-semibold">Dashboard</h1>
        </header>
        <main class="flex-grow-1 p-4 overflow-auto w-100 print-main">
            <router-outlet></router-outlet>
        </main>
    </div>
</div>
            `;
        } else {
            layoutHtml = `
<div class="flex min-h-screen bg-slate-50 print:min-h-0 print:bg-white">
    <app-sidebar class="print:hidden"></app-sidebar>
    <div class="flex-1 ml-64 flex flex-col min-w-0 print:ml-0 print:p-0">
        <header class="bg-white shadow-sm border-b border-slate-200 h-16 flex items-center px-8 print:hidden">
            <h1 class="text-lg font-semibold text-slate-700">Dashboard</h1>
        </header>
        <main class="flex-1 p-6 sm:p-8 overflow-auto w-full min-w-0 print:p-0 print:overflow-visible">
            <router-outlet></router-outlet>
        </main>
    </div>
</div>
            `;
        }
    }

    const layoutTs = `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
${isTopNav ? `import { TopnavComponent } from '../topnav/topnav.component';` : `import { SidebarComponent } from '../sidebar/sidebar.component';`}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ${isTopNav ? 'TopnavComponent' : 'SidebarComponent'}],
  templateUrl: './layout.component.html'
})
export class LayoutComponent {}
    `;

    files.push({ name: 'layout.component.html', path: `${appRoot}/components/layout/layout.component.html`, content: layoutHtml, language: 'html' });
    files.push({ name: 'layout.component.ts', path: `${appRoot}/components/layout/layout.component.ts`, content: layoutTs, language: 'typescript' });

    return files;
};
