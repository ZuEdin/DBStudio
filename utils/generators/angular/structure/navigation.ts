import { VirtualFile, BackendConfig, Table, CustomPage, Report, Query } from '../../../../types/index';
import { toCamelCase, toKebabCase } from '../../common';

export const generateNavigationComponents = (
    config: BackendConfig,
    tables: Table[],
    appRoot: string,
    pages: CustomPage[] = [],
    reports: Report[] = [],
    queries: Query[] = []
): VirtualFile[] => {
    const files: VirtualFile[] = [];
    const isBootstrap = config.stylingFramework?.toLowerCase() === 'bootstrap' || 
                        (config as any).frontendStyling?.toLowerCase() === 'bootstrap' || 
                        (config as any).styling?.toLowerCase() === 'bootstrap';
    const isTopNav = config.navigationPreset === 'top_nav';

    let sidebarHtml = '';
    let topnavHtml = '';

    if (isBootstrap) {
        sidebarHtml = `
<div class="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" style="width: 280px; height: 100vh; position: fixed; left: 0; top: 0; bottom: 0; overflow-y: auto;">
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
    <hr>
    <div class="text-muted small text-center">
        &copy; ${new Date().getFullYear()} Generated App
    </div>
</div>
        `;

        topnavHtml = `
<nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
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
            <span class="navbar-text text-muted small">
                &copy; ${new Date().getFullYear()} Generated App
            </span>
        </div>
    </div>
</nav>
        `;
    } else {
        sidebarHtml = `
<div class="h-full flex flex-col bg-slate-800 text-white w-64 fixed left-0 top-0 bottom-0 overflow-y-auto">
    <div class="p-4 font-bold text-xl border-b border-slate-700 flex items-center gap-2">
        <span>${config.projectName}</span>
    </div>
    <nav class="flex-1 p-2 space-y-1">
        <div class="text-[10px] font-bold text-slate-500 px-3 uppercase tracking-wider mb-2">Tabellen</div>
        ${tables.map(t => `
        <a routerLink="/${toCamelCase(t.name)}" routerLinkActive="bg-slate-700 text-white" class="flex items-center gap-3 px-3 py-2 rounded text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
            ${t.name}
        </a>`).join('')}

        ${queries && queries.length > 0 ? `
        <div class="text-[10px] font-bold text-slate-500 px-3 uppercase tracking-wider mt-4 mb-2">Abfragen</div>
        ${queries.map(q => `
        <a routerLink="/queries/${toKebabCase(q.name)}" routerLinkActive="bg-slate-700 text-white" class="flex items-center gap-3 px-3 py-2 rounded text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
            ${q.name}
        </a>`).join('')}
        ` : ''}

        ${reports && reports.length > 0 ? `
        <div class="text-[10px] font-bold text-slate-500 px-3 uppercase tracking-wider mt-4 mb-2">Berichte</div>
        ${reports.map(r => `
        <a routerLink="/reports/${toKebabCase(r.name)}" routerLinkActive="bg-slate-700 text-white" class="flex items-center gap-3 px-3 py-2 rounded text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
            ${r.name}
        </a>`).join('')}
        ` : ''}

        ${pages && pages.length > 0 ? `
        <div class="text-[10px] font-bold text-slate-500 px-3 uppercase tracking-wider mt-4 mb-2">Seiten</div>
        ${pages.map(p => `
        <a routerLink="/custom/${toKebabCase(p.name)}" routerLinkActive="bg-slate-700 text-white" class="flex items-center gap-3 px-3 py-2 rounded text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
            ${p.name}
        </a>`).join('')}
        ` : ''}
    </nav>
    <div class="p-4 border-t border-slate-700 text-xs text-slate-500 text-center">
        &copy; ${new Date().getFullYear()} Generated App
    </div>
</div>
        `;

        topnavHtml = `
<nav class="bg-slate-800 text-white shadow-md border-b border-slate-700 w-full z-50">
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
            <div class="text-slate-400 text-xs hidden sm:block">
                &copy; ${new Date().getFullYear()} Generated App
            </div>
        </div>
    </div>
</nav>
        `;
    }

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

    const topnavTs = `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-topnav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './topnav.component.html'
})
export class TopnavComponent {}
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
