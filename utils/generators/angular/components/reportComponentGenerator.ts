import { Table, Report, VirtualFile, Query } from '../../../../types/index';
import { toCamelCase, toKebabCase, toPascalCase } from '../../common';

interface RouteInfo {
  path: string;
  component: string;
  folder: string;
  file: string;
}

export const generateReportComponents = (
  reports: Report[],
  tables: Table[],
  queries: Query[],
  appRoot: string
): { files: VirtualFile[]; routes: RouteInfo[] } => {
  const files: VirtualFile[] = [];
  const routes: RouteInfo[] = [];

  reports.forEach(report => {
      const pascalName = toPascalCase(report.name);
      const kebabName = toKebabCase(report.name);
      const folder = 'reports';
      const sourceName = report.sourceType === 'table' 
          ? toCamelCase(tables.find(t => t.id === report.sourceId)?.name || '') 
          : `queries/${toCamelCase(queries.find(q => q.id === report.sourceId)?.name || '')}`;
      const groupingField = tables.find(t => t.id === report.sourceId)?.fields.find(f => f.id === report.groupingFieldId)?.name;
      const groupingProp = groupingField ? toCamelCase(groupingField) : null;
      const orientation = report.settings?.orientation || 'portrait';
      const widthClass = orientation === 'landscape' ? 'max-w-[297mm]' : 'max-w-[210mm]';

      const reportHtml = `
      <style>
          @media print {
              @page {
                  size: ${orientation};
                  margin: 12mm 15mm;
              }
              body, html {
                  background: #ffffff !important;
                  color: #000000 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }
              app-topnav, app-sidebar, header, nav, .no-print, .print\\:hidden, button, .btn {
                  display: none !important;
              }
              main, .flex-grow-1, .min-h-screen, .container, .container-fluid {
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow: visible !important;
                  width: 100% !important;
                  max-width: 100% !important;
              }
              .report-paper {
                  box-shadow: none !important;
                  border: none !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  max-width: 100% !important;
                  width: 100% !important;
                  min-height: auto !important;
                  height: auto !important;
              }
              .break-inside-avoid {
                  break-inside: avoid !important;
                  page-break-inside: avoid !important;
              }
              table {
                  width: 100% !important;
                  border-collapse: collapse !important;
              }
              th {
                  background-color: #f1f5f9 !important;
                  color: #1e293b !important;
              }
          }
      </style>
      
      <!-- Toolbar for Actions (Hidden in Print) -->
      <div class="no-print print:hidden max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div>
              <h2 class="text-lg font-bold text-slate-800">${report.name}</h2>
              <p class="text-xs text-slate-500">Druckansicht, Excel & PDF Export</p>
          </div>
          <div class="flex items-center gap-2">
              <button (click)="printReport()" class="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white font-medium px-3.5 py-2 rounded-lg text-xs shadow-sm transition-colors cursor-pointer">
                  <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                  Drucken
              </button>
              <button (click)="exportExcel()" class="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3.5 py-2 rounded-lg text-xs shadow-sm transition-colors cursor-pointer">
                  <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8M8 17h8M8 9h2"/></svg>
                  Excel (.xlsx)
              </button>
              <button (click)="exportPDF()" class="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium px-3.5 py-2 rounded-lg text-xs shadow-sm transition-colors cursor-pointer">
                  <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10 12l2 2 4-4"/></svg>
                  PDF Export
              </button>
          </div>
      </div>

      <!-- Report Paper Sheet -->
      <div class="report-paper p-8 sm:p-12 ${widthClass} mx-auto bg-white shadow-lg min-h-screen rounded-xl border border-slate-200/80 my-4 print:shadow-none print:border-none print:m-0 print:p-0 print:min-h-0 print:my-0">
          <header class="border-b-2 border-slate-800 pb-4 mb-6">
              ${report.settings?.logoPosition === 'center' ? `
                <div class="flex flex-col items-center text-center space-y-2">
                    ${report.settings?.companyLogoUrl ? `<img src="${report.settings.companyLogoUrl}" alt="Logo" class="h-12 max-w-[200px] mb-1 object-contain" />` : ''}
                    <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">${report.name}</h1>
                    ${report.settings?.subtitle ? `<p class="text-xs sm:text-sm text-slate-600">${report.settings.subtitle}</p>` : ''}
                    <p class="text-xs text-slate-500 font-mono">Generiert am: {{ today | date:'dd.MM.yyyy HH:mm' }} Uhr</p>
                </div>
              ` : report.settings?.logoPosition === 'right' ? `
                <div class="flex justify-between items-start gap-4">
                    <div>
                        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">${report.name}</h1>
                        ${report.settings?.subtitle ? `<p class="text-xs sm:text-sm text-slate-600 mt-1">${report.settings.subtitle}</p>` : ''}
                        <p class="text-xs sm:text-sm text-slate-500 mt-1">Generiert am: {{ today | date:'dd.MM.yyyy HH:mm' }} Uhr</p>
                    </div>
                    ${report.settings?.companyLogoUrl ? `
                    <div class="flex-shrink-0">
                        <img src="${report.settings.companyLogoUrl}" alt="Logo" class="h-12 max-w-[180px] object-contain" />
                    </div>` : ''}
                </div>
              ` : `
                <div class="flex justify-between items-start gap-4">
                    <div>
                        ${report.settings?.companyLogoUrl ? `<img src="${report.settings.companyLogoUrl}" alt="Logo" class="h-12 max-w-[180px] mb-2 object-contain" />` : ''}
                        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">${report.name}</h1>
                        ${report.settings?.subtitle ? `<p class="text-xs sm:text-sm text-slate-600 mt-1">${report.settings.subtitle}</p>` : ''}
                        <p class="text-xs sm:text-sm text-slate-500 mt-1">Generiert am: {{ today | date:'dd.MM.yyyy HH:mm' }} Uhr</p>
                    </div>
                </div>
              `}
          </header>
          <main>
              <div *ngFor="let group of reportData" class="mb-8 break-inside-avoid">
                  <div *ngIf="group.groupValue !== 'Gesamt'" class="bg-slate-100 p-2.5 border border-slate-300 rounded-t-md font-bold text-base text-slate-800">
                      ${groupingField}: {{ group.groupValue }}
                  </div>
                  <div class="overflow-x-auto print:overflow-visible">
                      <table class="w-full border-collapse text-sm">
                          <thead>
                              <tr class="border-b-2 border-slate-300 bg-slate-50 text-left">
                                  ${report.columns?.filter(c => c.visible).map(c => `<th class="p-2.5 font-bold uppercase text-slate-700 text-xs">${c.label}</th>`).join('')}
                              </tr>
                          </thead>
                          <tbody>
                              <tr *ngFor="let item of group.items" class="border-b border-slate-200 hover:bg-slate-50/50">
                                  ${report.columns?.filter(c => c.visible).map(c => {
                                      let fieldName = '';
                                      if(report.sourceType === 'table') { fieldName = tables.find(t=>t.id===report.sourceId)?.fields.find(f=>f.id===c.fieldId)?.name || ''; } else { fieldName = c.label; }
                                      return `<td class="p-2.5 text-slate-800">{{ item.${toCamelCase(fieldName)} }}</td>`;
                                  }).join('')}
                              </tr>
                          </tbody>
                      </table>
                  </div>
                  <div *ngIf="group.summaries" class="bg-slate-50 p-3 mt-1 border-t-2 border-slate-300 rounded-b-md text-right text-xs sm:text-sm text-slate-700">
                      <span *ngFor="let sum of group.summaries | keyvalue" class="ml-4 inline-block"><strong>{{ sum.key }}:</strong> {{ sum.value }}</span>
                  </div>
              </div>
              <div *ngIf="reportData.length === 0" class="p-12 text-center text-slate-400">
                  <p class="text-base font-medium">Keine Berichtsdaten gefunden.</p>
              </div>
          </main>
      </div>`;

      const reportTs = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-${kebabName}-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './${kebabName}-report.component.html'
})
export class ${pascalName}ReportComponent implements OnInit {
  reportData: any[] = [];
  today = new Date();
  constructor(private api: ApiService) {}
  ngOnInit() { this.api.getAll('${sourceName}', 1, 10000).subscribe((res: any) => { this.processData(res.data || res); }); }
  
  printReport() {
    window.print();
  }

  exportExcel() {
    const exportData = this.reportData.flatMap(group => {
      return group.items.map((item: any) => {
        const row: any = {};
        if (group.groupValue !== 'Gesamt') {
          row['Gruppe'] = group.groupValue;
        }
        ${report.columns?.filter(c => c.visible).map(c => {
          let fieldName = '';
          if(report.sourceType === 'table') { fieldName = tables.find(t=>t.id===report.sourceId)?.fields.find(f=>f.id===c.fieldId)?.name || ''; } else { fieldName = c.label; }
          return `row['${c.label}'] = item['${toCamelCase(fieldName)}'] ?? '';`;
        }).join('\n        ')}
        return row;
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bericht');
    XLSX.writeFile(wb, '${kebabName}-report.xlsx');
  }

  exportPDF() {
    const doc = new jsPDF({ orientation: '${orientation}' });
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('${report.name.replace(/'/g, "\\'")}', 14, 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    ${report.settings?.subtitle ? `doc.text('${report.settings.subtitle.replace(/'/g, "\\'")}', 14, 25);` : ''}
    doc.text('Erstellt am: ' + this.today.toLocaleDateString('de-DE') + ' ' + this.today.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr', 14, ${report.settings?.subtitle ? 31 : 25});
    
    let currentY = ${report.settings?.subtitle ? 38 : 32};
    const tableHeaders = [${report.columns?.filter(c=>c.visible).map(c => `'${c.label.replace(/'/g, "\\'")}'`).join(', ')}];
    
    this.reportData.forEach((group: any) => {
      if (group.groupValue !== 'Gesamt') {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(String(group.groupValue), 14, currentY);
        currentY += 5;
      }
      
      const rows = group.items.map((item: any) => [
        ${report.columns?.filter(c=>c.visible).map(c => {
          let fieldName = '';
          if(report.sourceType === 'table') { fieldName = tables.find(t=>t.id===report.sourceId)?.fields.find(f=>f.id===c.fieldId)?.name || ''; } else { fieldName = c.label; }
          return `String(item['${toCamelCase(fieldName)}'] ?? '')`;
        }).join(',\n        ')}
      ]);
      
      autoTable(doc, {
        head: [tableHeaders],
        body: rows,
        startY: currentY,
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [30, 41, 59] },
        margin: { left: 14, right: 14 }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 4;
      
      if (group.summaries && Object.keys(group.summaries).length > 0) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        const sumText = Object.entries(group.summaries).map(([k, v]) => k + ': ' + v).join('   |   ');
        doc.text(sumText, 14, currentY);
        currentY += 8;
      }
      currentY += 4;
    });
    
    doc.save('${kebabName}-report.pdf');
  }

  processData(data: any[]) {
      const groupingProp: string | null = ${groupingProp ? `'${groupingProp}'` : 'null'};
      if (!groupingProp) {
          this.reportData = [{ groupValue: 'Gesamt', items: data, summaries: this.calcSummaries(data) }];
          return;
      }
      const groups: any = {};
      data.forEach(row => { const key = row[groupingProp] || 'Unbekannt'; if (!groups[key]) groups[key] = []; groups[key].push(row); });
      this.reportData = Object.keys(groups).sort().map(key => ({ groupValue: key, items: groups[key], summaries: this.calcSummaries(groups[key]) }));
  }
  calcSummaries(items: any[]) {
      const summaries: any = {};
      ${report.summaries.map(s => {
          const prop = toCamelCase(s.fieldName);
          if (s.calculation === 'COUNT') return `summaries['Anzahl ${s.fieldName}'] = items.length;`;
          if (s.calculation === 'SUM') return `summaries['Summe ${s.fieldName}'] = items.reduce((acc, curr) => acc + (Number(curr.${prop}) || 0), 0);`;
          return '';
      }).join('\n      ')}
      return summaries;
  }
}`;
      files.push({ name: `${kebabName}-report.component.html`, path: `${appRoot}/pages/${folder}/${kebabName}-report.component.html`, content: reportHtml, language: 'html' });
      files.push({ name: `${kebabName}-report.component.ts`, path: `${appRoot}/pages/${folder}/${kebabName}-report.component.ts`, content: reportTs, language: 'typescript' });
      routes.push({ path: `reports/${kebabName}`, component: `${pascalName}ReportComponent`, folder: folder, file: `${kebabName}-report.component` });
  });

  return { files, routes };
};
