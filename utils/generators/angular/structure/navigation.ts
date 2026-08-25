import { VirtualFile, BackendConfig, Table, CustomPage, Report, Query, Form } from '../../../../types/index';
import { toCamelCase, toKebabCase, toPascalCase } from '../../common';

export const generateNavigationComponents = (
    config: BackendConfig,
    tables: Table[],
    appRoot: string,
    pages: CustomPage[] = [],
    reports: Report[] = [],
    queries: Query[] = [],
    forms: Form[] = []
): VirtualFile[] => {
    const files: VirtualFile[] = [];
    const useAuth = config.authConfig?.useUserLogin;
    const isBootstrap = config.stylingFramework?.toLowerCase() === 'bootstrap' || 
                        (config as any).frontendStyling?.toLowerCase() === 'bootstrap' || 
                        (config as any).styling?.toLowerCase() === 'bootstrap';
    const isTopNav = config.navigationPreset === 'top_nav';

    // Helper: resolve form route
    const getFormRoute = (form: Form): string => {
        if (form.sourceId) {
            const table = tables.find(t => t.id === form.sourceId);
            if (table) return `/${toCamelCase(table.name)}/new`;
        }
        return `/${toCamelCase(form.name)}/new`;
    };

    const hasNavConfig = config.navigationConfig && config.navigationConfig.length > 0;

    let sidebarHtml = '';
    let topnavHtml = '';

    if (isBootstrap) {
        if (hasNavConfig) {
            const compileBootstrapNavItems = (items: any[]): string => {
                return items.map(item => {
                    const requiredRoles = item.requiredRoles || [];
                    const rolesCheckAttr = useAuth && requiredRoles.length > 0
                        ? `*ngIf="hasRole(['${requiredRoles.join("', '")}'])"`
                        : '';

                    if (item.type === 'folder') {
                        const folderId = item.id.replace(/[^a-zA-Z0-9]/g, '_');
                        const childrenHtml = compileBootstrapNavItems(item.children || []);
                        return `
        <li class="nav-item mt-2" ${rolesCheckAttr}>
            <a href="javascript:void(0)" (click)="toggleFolder('${item.id}')" class="nav-link text-white-50 d-flex align-items-center justify-content-between px-3 py-2 fw-semibold">
                <span class="d-flex align-items-center gap-2">
                    <i class="bi bi-folder2 text-warning"></i>
                    <span>${item.title}</span>
                </span>
                <i class="bi" [ngClass]="isExpanded('${item.id}') ? 'bi-chevron-down' : 'bi-chevron-right'" style="font-size: 0.75rem;"></i>
            </a>
            <ul *ngIf="isExpanded('${item.id}')" class="nav nav-pills flex-column ps-3 mb-1 border-start border-secondary ms-3">
                ${childrenHtml}
            </ul>
        </li>`;
                    } else {
                        let route = item.route;
                        if (item.targetType === 'form' && item.targetId) {
                            const f = forms.find(x => x.id === item.targetId);
                            if (f) route = getFormRoute(f);
                        } else if (item.targetType === 'table' && item.targetId) {
                            const t = tables.find(x => x.id === item.targetId);
                            if (t) route = `/${toCamelCase(t.name)}`;
                        } else if (item.targetType === 'query' && item.targetId) {
                            const q = queries.find(x => x.id === item.targetId);
                            if (q) route = `/queries/${toKebabCase(q.name)}`;
                        } else if (item.targetType === 'report' && item.targetId) {
                            const r = reports.find(x => x.id === item.targetId);
                            if (r) route = `/reports/${toKebabCase(r.name)}`;
                        } else if ((item.targetType === 'page' || item.targetType === 'custom_page') && item.targetId) {
                            const p = pages.find(x => x.id === item.targetId);
                            if (p) route = `/custom/${toKebabCase(p.name)}`;
                        }

                        return `
        <li class="nav-item" ${rolesCheckAttr}>
            <a routerLink="${route}" routerLinkActive="active" class="nav-link text-white d-flex align-items-center justify-content-between py-1.5 px-3">
                <span>${item.title}</span>
                ${item.badgeCountQuery ? `<span class="badge bg-danger rounded-pill">${(item.badgeCountQuery.length % 5) + 3}</span>` : ''}
            </a>
        </li>`;
                    }
                }).join('\n');
            };

            sidebarHtml = `
<div class="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark d-print-none" style="width: 280px; height: 100vh; position: fixed; left: 0; top: 0; bottom: 0; overflow-y: auto;">
    <a routerLink="/" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
        <span class="fs-4 fw-bold">${config.projectName}</span>
    </a>
    <hr>
    <ul class="nav nav-pills flex-column mb-auto">
        ${compileBootstrapNavItems(config.navigationConfig || [])}
    </ul>
    ${useAuth ? `
    <div *ngIf="auth.user$ | async as user" class="p-3 border-top border-secondary my-3">
        <div class="d-flex align-items-center gap-2 mb-2">
            <div class="rounded-circle bg-primary d-flex align-items-center justify-center text-white font-bold uppercase" style="width: 32px; height: 32px; font-size: 14px;">
                {{ user.username.charAt(0) }}
            </div>
            <div class="text-truncate">
                <div class="fw-bold text-white text-truncate">{{ user.username }}</div>
                <div class="text-muted small text-uppercase" style="font-size: 10px;">{{ user.role }}</div>
            </div>
        </div>
        <button (click)="auth.logout()" class="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-1">
            Abmelden
        </button>
    </div>
    ` : ''}
    <hr>
    <div class="text-muted small text-center">
        &copy; ${new Date().getFullYear()} Generated App
    </div>
</div>`;
        } else {
            sidebarHtml = `
<div class="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark d-print-none" style="width: 280px; height: 100vh; position: fixed; left: 0; top: 0; bottom: 0; overflow-y: auto;">
    <a routerLink="/" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
        <span class="fs-4 fw-bold">${config.projectName}</span>
    </a>
    <hr>
    <ul class="nav nav-pills flex-column mb-auto">
        <li class="nav-item">
            <span class="text-uppercase text-muted small fw-bold px-3 mb-2 d-block">Tabellen</span>
        </li>
        ${tables.map(t => `
        <li class="nav-item">
            <a routerLink="/${toCamelCase(t.name)}" routerLinkActive="active" class="nav-link text-white">
                ${t.name}
            </a>
        </li>`).join('')}

        ${forms && forms.length > 0 ? `
        <li class="nav-item mt-3">
            <span class="text-uppercase text-muted small fw-bold px-3 mb-2 d-block">Formulare</span>
        </li>
        ${forms.map(f => `
        <li class="nav-item">
            <a routerLink="${getFormRoute(f)}" routerLinkActive="active" class="nav-link text-white">
                ${f.name}
            </a>
        </li>`).join('')}
        ` : ''}

        ${queries && queries.length > 0 ? `
        <li class="nav-item mt-3">
            <span class="text-uppercase text-muted small fw-bold px-3 mb-2 d-block">Abfragen</span>
        </li>
        ${queries.map(q => `
        <li class="nav-item">
            <a routerLink="/queries/${toKebabCase(q.name)}" routerLinkActive="active" class="nav-link text-white">
                ${q.name}
            </a>
        </li>`).join('')}
        ` : ''}

        ${reports && reports.length > 0 ? `
        <li class="nav-item mt-3">
            <span class="text-uppercase text-muted small fw-bold px-3 mb-2 d-block">Berichte</span>
        </li>
        ${reports.map(r => `
        <li class="nav-item">
            <a routerLink="/reports/${toKebabCase(r.name)}" routerLinkActive="active" class="nav-link text-white">
                ${r.name}
            </a>
        </li>`).join('')}
        ` : ''}

        ${pages && pages.length > 0 ? `
        <li class="nav-item mt-3">
            <span class="text-uppercase text-muted small fw-bold px-3 mb-2 d-block">Seiten</span>
        </li>
        ${pages.map(p => `
        <li class="nav-item">
            <a routerLink="/custom/${toKebabCase(p.name)}" routerLinkActive="active" class="nav-link text-white">
                ${p.name}
            </a>
        </li>`).join('')}
        ` : ''}
    </ul>
    ${useAuth ? `
    <div *ngIf="auth.user$ | async as user" class="p-3 border-top border-secondary my-3">
        <div class="d-flex align-items-center gap-2 mb-2">
            <div class="rounded-circle bg-primary d-flex align-items-center justify-center text-white font-bold uppercase" style="width: 32px; height: 32px; font-size: 14px;">
                {{ user.username.charAt(0) }}
            </div>
            <div class="text-truncate">
                <div class="fw-bold text-white text-truncate">{{ user.username }}</div>
                <div class="text-muted small text-uppercase" style="font-size: 10px;">{{ user.role }}</div>
            </div>
        </div>
        <button (click)="auth.logout()" class="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-1">
            Abmelden
        </button>
    </div>
    ` : ''}
    <hr>
    <div class="text-muted small text-center">
        &copy; ${new Date().getFullYear()} Generated App
    </div>
</div>`;
        }

        topnavHtml = `
<nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm d-print-none print:hidden">
    <div class="container-fluid px-4">
        <a class="navbar-brand fw-bold" routerLink="/">${config.projectName}</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#topnavContent" aria-controls="topnavContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="topnavContent">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                <li class="nav-item">
                    <a class="nav-link text-white" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Dashboard</a>
                </li>
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle text-white-50" href="#" id="navbarDropdownTables" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Tabellen
                    </a>
                    <ul class="dropdown-menu shadow-sm" aria-labelledby="navbarDropdownTables">
                        ${tables.map(t => `
                        <li><a routerLink="/${toCamelCase(t.name)}" class="dropdown-item">${t.name}</a></li>`).join('')}
                    </ul>
                </li>
                ${forms && forms.length > 0 ? `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle text-white-50" href="#" id="navbarDropdownForms" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Formulare
                    </a>
                    <ul class="dropdown-menu shadow-sm" aria-labelledby="navbarDropdownForms">
                        ${forms.map(f => `
                        <li><a routerLink="${getFormRoute(f)}" class="dropdown-item">${f.name}</a></li>`).join('')}
                    </ul>
                </li>
                ` : ''}
                ${queries && queries.length > 0 ? `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle text-white-50" href="#" id="navbarDropdownQueries" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Abfragen
                    </a>
                    <ul class="dropdown-menu shadow-sm" aria-labelledby="navbarDropdownQueries">
                        ${queries.map(q => `
                        <li><a routerLink="/queries/${toKebabCase(q.name)}" class="dropdown-item">${q.name}</a></li>`).join('')}
                    </ul>
                </li>
                ` : ''}
                ${reports && reports.length > 0 ? `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle text-white-50" href="#" id="navbarDropdownReports" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Berichte
                    </a>
                    <ul class="dropdown-menu shadow-sm" aria-labelledby="navbarDropdownReports">
                        ${reports.map(r => `
                        <li><a routerLink="/reports/${toKebabCase(r.name)}" class="dropdown-item">${r.name}</a></li>`).join('')}
                    </ul>
                </li>
                ` : ''}
                ${pages && pages.length > 0 ? `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle text-white-50" href="#" id="navbarDropdownPages" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Seiten
                    </a>
                    <ul class="dropdown-menu shadow-sm" aria-labelledby="navbarDropdownPages">
                        ${pages.map(p => `
                        <li><a routerLink="/custom/${toKebabCase(p.name)}" class="dropdown-item">${p.name}</a></li>`).join('')}
                    </ul>
                </li>
                ` : ''}
            </ul>
            ${useAuth ? `
            <div *ngIf="auth.user$ | async as user" class="d-flex align-items-center gap-3 me-3">
                <div class="d-flex align-items-center gap-2 bg-secondary bg-opacity-25 px-3 py-1 rounded-pill border border-secondary border-opacity-50">
                    <div class="rounded-circle bg-primary d-flex align-items-center justify-center text-white font-bold uppercase" style="width: 24px; height: 24px; font-size: 11px;">
                        {{ user.username.charAt(0) }}
                    </div>
                    <span class="text-white-50 small">{{ user.username }}</span>
                    <span class="badge bg-secondary text-uppercase" style="font-size: 9px;">{{ user.role }}</span>
                </div>
                <button (click)="auth.logout()" class="btn btn-outline-danger btn-sm d-flex align-items-center gap-1">
                    <span>Abmelden</span>
                </button>
            </div>
            ` : ''}
            <span class="navbar-text text-muted small">
                &copy; ${new Date().getFullYear()} Generated App
            </span>
        </div>
    </div>
</nav>`;
    } else {
        // Tailwind navigation
        if (hasNavConfig) {
            const compileTailwindNavItems = (items: any[]): string => {
                return items.map(item => {
                    const requiredRoles = item.requiredRoles || [];
                    const rolesCheckAttr = useAuth && requiredRoles.length > 0
                        ? `*ngIf="hasRole(['${requiredRoles.join("', '")}'])"`
                        : '';

                    if (item.type === 'folder') {
                        const childrenHtml = compileTailwindNavItems(item.children || []);
                        return `
        <div class="mt-3" ${rolesCheckAttr}>
            <button type="button" (click)="toggleFolder('${item.id}')" class="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-white transition-colors">
                <span class="flex items-center gap-2">
                    <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                    <span>${item.title}</span>
                </span>
                <svg class="w-3 h-3 transition-transform" [ngClass]="{'rotate-180': isExpanded('${item.id}')}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div *ngIf="isExpanded('${item.id}')" class="space-y-1 pl-3 mt-1 border-l border-slate-700 ml-3">
                ${childrenHtml}
            </div>
        </div>`;
                    } else {
                        let route = item.route;
                        if (item.targetType === 'form' && item.targetId) {
                            const f = forms.find(x => x.id === item.targetId);
                            if (f) route = getFormRoute(f);
                        } else if (item.targetType === 'table' && item.targetId) {
                            const t = tables.find(x => x.id === item.targetId);
                            if (t) route = `/${toCamelCase(t.name)}`;
                        } else if (item.targetType === 'query' && item.targetId) {
                            const q = queries.find(x => x.id === item.targetId);
                            if (q) route = `/queries/${toKebabCase(q.name)}`;
                        } else if (item.targetType === 'report' && item.targetId) {
                            const r = reports.find(x => x.id === item.targetId);
                            if (r) route = `/reports/${toKebabCase(r.name)}`;
                        } else if ((item.targetType === 'page' || item.targetType === 'custom_page') && item.targetId) {
                            const p = pages.find(x => x.id === item.targetId);
                            if (p) route = `/custom/${toKebabCase(p.name)}`;
                        }

                        return `
        <a routerLink="${route}" routerLinkActive="bg-slate-700 text-white font-medium shadow-sm" ${rolesCheckAttr} class="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/70 hover:text-white transition-colors">
            <span class="truncate">${item.title}</span>
            ${item.badgeCountQuery ? `<span class="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full animate-pulse">${(item.badgeCountQuery.length % 5) + 3}</span>` : ''}
        </a>`;
                    }
                }).join('\n');
            };

            sidebarHtml = `
<div class="h-full flex flex-col bg-slate-800 text-white w-64 fixed left-0 top-0 bottom-0 overflow-y-auto print:hidden no-print">
    <div class="p-4 font-bold text-xl border-b border-slate-700 flex items-center gap-2">
        <span>${config.projectName}</span>
    </div>
    <nav class="flex-1 p-2 space-y-1">
        ${compileTailwindNavItems(config.navigationConfig || [])}
    </nav>
    ${useAuth ? `
    <div *ngIf="auth.user$ | async as user" class="p-4 border-t border-slate-700 space-y-2">
        <div class="text-xs text-slate-400">Eingeloggt als:</div>
        <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                {{ user.username.charAt(0) }}
            </div>
            <div class="truncate">
                <div class="font-semibold text-sm text-slate-200">{{ user.username }}</div>
                <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{{ user.role }}</div>
            </div>
        </div>
        <button (click)="auth.logout()" class="mt-2 w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 py-2 rounded text-xs font-medium transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Abmelden
        </button>
    </div>
    ` : ''}
    <div class="p-4 border-t border-slate-700 text-xs text-slate-500 text-center">
        &copy; ${new Date().getFullYear()} Generated App
    </div>
</div>`;
        } else {
            sidebarHtml = `
<div class="h-full flex flex-col bg-slate-800 text-white w-64 fixed left-0 top-0 bottom-0 overflow-y-auto print:hidden no-print">
    <div class="p-4 font-bold text-xl border-b border-slate-700 flex items-center gap-2">
        <span>${config.projectName}</span>
    </div>
    <nav class="flex-1 p-2 space-y-1">
        <div class="text-[10px] font-bold text-slate-500 px-3 uppercase tracking-wider mb-2">Tabellen</div>
        ${tables.map(t => `
        <a routerLink="/${toCamelCase(t.name)}" routerLinkActive="bg-slate-700 text-white font-medium" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
            ${t.name}
        </a>`).join('')}

        ${forms && forms.length > 0 ? `
        <div class="text-[10px] font-bold text-slate-500 px-3 uppercase tracking-wider mt-4 mb-2">Formulare</div>
        ${forms.map(f => `
        <a routerLink="${getFormRoute(f)}" routerLinkActive="bg-slate-700 text-white font-medium" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
            ${f.name}
        </a>`).join('')}
        ` : ''}

        ${queries && queries.length > 0 ? `
        <div class="text-[10px] font-bold text-slate-500 px-3 uppercase tracking-wider mt-4 mb-2">Abfragen</div>
        ${queries.map(q => `
        <a routerLink="/queries/${toKebabCase(q.name)}" routerLinkActive="bg-slate-700 text-white font-medium" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
            ${q.name}
        </a>`).join('')}
        ` : ''}

        ${reports && reports.length > 0 ? `
        <div class="text-[10px] font-bold text-slate-500 px-3 uppercase tracking-wider mt-4 mb-2">Berichte</div>
        ${reports.map(r => `
        <a routerLink="/reports/${toKebabCase(r.name)}" routerLinkActive="bg-slate-700 text-white font-medium" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
            ${r.name}
        </a>`).join('')}
        ` : ''}

        ${pages && pages.length > 0 ? `
        <div class="text-[10px] font-bold text-slate-500 px-3 uppercase tracking-wider mt-4 mb-2">Seiten</div>
        ${pages.map(p => `
        <a routerLink="/custom/${toKebabCase(p.name)}" routerLinkActive="bg-slate-700 text-white font-medium" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
            ${p.name}
        </a>`).join('')}
        ` : ''}
    </nav>
    ${useAuth ? `
    <div *ngIf="auth.user$ | async as user" class="p-4 border-t border-slate-700 space-y-2">
        <div class="text-xs text-slate-400">Eingeloggt als:</div>
        <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                {{ user.username.charAt(0) }}
            </div>
            <div class="truncate">
                <div class="font-semibold text-sm text-slate-200">{{ user.username }}</div>
                <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{{ user.role }}</div>
            </div>
        </div>
        <button (click)="auth.logout()" class="mt-2 w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 py-2 rounded text-xs font-medium transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Abmelden
        </button>
    </div>
    ` : ''}
    <div class="p-4 border-t border-slate-700 text-xs text-slate-500 text-center">
        &copy; ${new Date().getFullYear()} Generated App
    </div>
</div>`;
        }

        topnavHtml = `
<nav class="bg-slate-800 text-white shadow-md border-b border-slate-700 w-full z-50 print:hidden no-print">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-8">
                <a routerLink="/" class="font-bold text-xl tracking-wider text-white hover:text-slate-200">${config.projectName}</a>
                <div class="flex space-x-4 items-center">
                    <a routerLink="/" routerLinkActive="bg-slate-900 text-white" [routerLinkActiveOptions]="{exact: true}" class="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition">Dashboard</a>
                    
                    <!-- Tabellen Dropdown -->
                    <div class="relative group">
                        <button class="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 transition">
                            Tabellen
                            <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        <div class="absolute left-0 mt-1 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            ${tables.map(t => `
                            <a routerLink="/${toCamelCase(t.name)}" class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition">${t.name}</a>`).join('')}
                        </div>
                    </div>

                    <!-- Formulare Dropdown -->
                    ${forms && forms.length > 0 ? `
                    <div class="relative group">
                        <button class="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 transition">
                            Formulare
                            <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        <div class="absolute left-0 mt-1 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            ${forms.map(f => `
                            <a routerLink="${getFormRoute(f)}" class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition">${f.name}</a>`).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Abfragen Dropdown -->
                    ${queries && queries.length > 0 ? `
                    <div class="relative group">
                        <button class="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 transition">
                            Abfragen
                            <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        <div class="absolute left-0 mt-1 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            ${queries.map(q => `
                            <a routerLink="/queries/${toKebabCase(q.name)}" class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition">${q.name}</a>`).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Berichte Dropdown -->
                    ${reports && reports.length > 0 ? `
                    <div class="relative group">
                        <button class="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 transition">
                            Berichte
                            <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        <div class="absolute left-0 mt-1 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            ${reports.map(r => `
                            <a routerLink="/reports/${toKebabCase(r.name)}" class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition">${r.name}</a>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Seiten Dropdown -->
                    ${pages && pages.length > 0 ? `
                    <div class="relative group">
                        <button class="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 transition">
                            Seiten
                            <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        <div class="absolute left-0 mt-1 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            ${pages.map(p => `
                            <a routerLink="/custom/${toKebabCase(p.name)}" class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition">${p.name}</a>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="flex items-center gap-4">
                ${useAuth ? `
                <div *ngIf="auth.user$ | async as user" class="flex items-center gap-3">
                    <div class="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-full border border-slate-600/50">
                        <div class="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                            {{ user.username.charAt(0) }}
                        </div>
                        <span class="text-slate-300 font-medium text-sm">{{ user.username }}</span>
                        <span class="text-[10px] bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded font-mono uppercase font-bold tracking-wider">{{ user.role }}</span>
                    </div>
                    <button (click)="auth.logout()" class="flex items-center justify-center gap-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        <span>Abmelden</span>
                    </button>
                </div>
                ` : ''}
                <div class="text-slate-400 text-xs hidden sm:block">
                    &copy; ${new Date().getFullYear()} Generated App
                </div>
            </div>
        </div>
    </div>
</nav>`;
    }

    const sidebarTs = `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
${useAuth ? "import { AuthService } from '../../services/auth.service';" : ""}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  expandedFolders: { [key: string]: boolean } = {};

  ${useAuth ? "constructor(public auth: AuthService) {}" : "constructor() {}"}

  toggleFolder(id: string): void {
    this.expandedFolders[id] = this.expandedFolders[id] === undefined ? false : !this.expandedFolders[id];
  }

  isExpanded(id: string): boolean {
    return this.expandedFolders[id] !== false;
  }

  hasRole(roles: string[]): boolean {
    if (!roles || roles.length === 0) return true;
    ${useAuth ? `
    const user = this.auth.currentUser;
    return user ? roles.includes(user.role) : false;
    ` : 'return true;'}
  }
}
    `;

    const topnavTs = `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
${useAuth ? "import { AuthService } from '../../services/auth.service';" : ""}

@Component({
  selector: 'app-topnav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './topnav.component.html'
})
export class TopnavComponent {
  ${useAuth ? "constructor(public auth: AuthService) {}" : "constructor() {}"}

  hasRole(roles: string[]): boolean {
    if (!roles || roles.length === 0) return true;
    ${useAuth ? `
    const user = this.auth.currentUser;
    return user ? roles.includes(user.role) : false;
    ` : 'return true;'}
  }
}
    `;

    if (isTopNav) {
        files.push({ name: 'topnav.component.html', path: `${appRoot}/components/topnav/topnav.component.html`, content: topnavHtml, language: 'html' });
        files.push({ name: 'topnav.component.ts', path: `${appRoot}/components/topnav/topnav.component.ts`, content: topnavTs, language: 'typescript' });
    } else {
        files.push({ name: 'sidebar.component.html', path: `${appRoot}/components/sidebar/sidebar.component.html`, content: sidebarHtml, language: 'html' });
        files.push({ name: 'sidebar.component.ts', path: `${appRoot}/components/sidebar/sidebar.component.ts`, content: sidebarTs, language: 'typescript' });
    }

    return files;
};

