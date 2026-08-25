import { Report, Table, Query, VirtualFile, SelectQuery } from '../../../../types/index';
import { toCamelCase, toPascalCase } from '../../common';

export const generateReportPage = (
  report: Report,
  tables: Table[],
  queries: Query[],
  root: string
): VirtualFile => {
  const compName = `${toPascalCase(report.name)}ReportPage`;
  const orientation = report.settings?.orientation || 'portrait';
  const widthClass = orientation === 'landscape' ? 'max-w-[297mm]' : 'max-w-[210mm]';
  
  // Determine endpoint: Table or Query
  let endpoint = '';
  let fields: any[] = [];
  
  if (report.sourceType === 'table') {
      const table = tables.find(t => t.id === report.sourceId);
      if (table) {
          endpoint = toCamelCase(table.name);
          fields = table.fields.map(f => ({ name: f.name, prop: toCamelCase(f.name) }));
      }
  } else {
      const query = queries.find(q => q.id === report.sourceId);
      if (query) {
          endpoint = `queries/${toCamelCase(query.name)}`;
          fields = (query as SelectQuery).columns.map(c => ({ name: c.alias || c.fieldName, prop: toCamelCase(c.alias || c.fieldName) }));
      }
  }

  // Grouping Field
  const groupingFieldObj = fields.find(f => {
      if (report.sourceType === 'table') {
          const t = tables.find(t => t.id === report.sourceId);
          return t?.fields.find(field => field.id === report.groupingFieldId)?.name === f.name;
      }
      return false;
  });
  const groupingProp = groupingFieldObj ? groupingFieldObj.prop : null;

  // Summary Logic
  const summaryLogic = report.summaries.map(s => {
      const prop = toCamelCase(s.fieldName);
      if (s.calculation === 'COUNT') return `sum['${s.fieldName}'] = items.length;`;
      if (s.calculation === 'SUM') return `sum['${s.fieldName}'] = items.reduce((acc, curr) => acc + (Number(curr.${prop}) || 0), 0);`;
      return '';
  }).join('\n');

  const safeReportName = report.name.replace(/[^a-zA-Z0-9_-]/g, '_');

  const content = `import React, { useEffect, useState, useMemo } from 'react';
import { get } from '../../services/api';
import { FileText, Printer, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ${compName} = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const load = async () => {
          try {
              const res = await get<any>('${endpoint}', { pageSize: 10000 }); // Fetch all for report
              const items = Array.isArray(res) ? res : (res?.data || res?.Data || res?.items || res?.Items || []);
              setData(items);
          } finally { setLoading(false); }
      };
      load();
  }, []);

  const groupedData = useMemo(() => {
      if (!data.length) return [];
      const groupBy: string | null = ${groupingProp ? `'${groupingProp}'` : 'null'};
      
      if (!groupBy) {
          return [{ key: 'Gesamt', items: data, summaries: calculateSummaries(data) }];
      }

      const groups: Record<string, any[]> = {};
      data.forEach(item => {
          const val = item[groupBy] || 'Unbekannt';
          if (!groups[val]) groups[val] = [];
          groups[val].push(item);
      });

      return Object.keys(groups).sort().map(key => ({
          key,
          items: groups[key],
          summaries: calculateSummaries(groups[key])
      }));
  }, [data]);

  function calculateSummaries(items: any[]) {
      const sum: any = {};
      ${summaryLogic}
      return sum;
  }

  const handlePrint = () => window.print();

  const handleExportExcel = () => {
      const exportData = groupedData.flatMap(group => {
          return group.items.map(item => {
              const row: any = {};
              if (group.key !== 'Gesamt') {
                  row['Gruppe'] = group.key;
              }
              ${report.columns?.filter(c=>c.visible).map(c => {
                  const foundField = fields.find(f => f.name === c.label);
                  const prop = foundField ? foundField.prop : toCamelCase(c.label);
                  const pascalProp = toPascalCase(c.label);
                  return `row['${c.label}'] = item['${prop}'] ?? item['${pascalProp}'] ?? item['${c.label}'] ?? '';`;
              }).join('\n              ')}
              return row;
          });
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bericht");
      XLSX.writeFile(wb, '${safeReportName}.xlsx');
  };

  const handleExportPDF = () => {
      const doc = new jsPDF({ orientation: '${orientation}' });
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('${report.name.replace(/'/g, "\\'")}', 14, 18);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      ${report.settings?.subtitle ? `doc.text('${report.settings.subtitle.replace(/'/g, "\\'")}', 14, 25);` : ''}
      doc.text('Erstellt am: ' + new Date().toLocaleDateString('de-DE') + ' ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr', 14, ${report.settings?.subtitle ? 31 : 25});
      
      let currentY = ${report.settings?.subtitle ? 38 : 32};
      const tableHeaders = [${report.columns?.filter(c=>c.visible).map(c => `'${c.label.replace(/'/g, "\\'")}'`).join(', ')}];
      
      groupedData.forEach((group) => {
          if (group.key !== 'Gesamt') {
              doc.setFontSize(11);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(30, 41, 59);
              doc.text(String(group.key), 14, currentY);
              currentY += 5;
          }
          
          const rows = group.items.map(item => [
              ${report.columns?.filter(c=>c.visible).map(c => {
                  const foundField = fields.find(f => f.name === c.label);
                  const prop = foundField ? foundField.prop : toCamelCase(c.label);
                  const pascalProp = toPascalCase(c.label);
                  return `String(item['${prop}'] ?? item['${pascalProp}'] ?? item['${c.label}'] ?? '')`;
              }).join(',\n              ')}
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
          
          if (Object.keys(group.summaries).length > 0) {
              doc.setFontSize(8.5);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(71, 85, 105);
              const sumText = Object.entries(group.summaries).map(([k, v]) => k + ': ' + v).join('   |   ');
              doc.text(sumText, 14, currentY);
              currentY += 8;
          }
          currentY += 4;
      });
      
      doc.save('${safeReportName}.pdf');
  };

  return (
    <div className="w-full space-y-6">
      <style dangerouslySetInnerHTML={{ __html: \`
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
            header, nav, aside, .no-print, .print\\:hidden, button {
                display: none !important;
            }
            main, .flex-grow-1, .min-h-screen {
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
        }
      \` }} />

      {/* Toolbar for Actions */}
      <div className="no-print print:hidden max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">${report.name}</h2>
              <p className="text-xs text-slate-500">Druckansicht, Excel & PDF Export</p>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={handlePrint} className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white font-medium px-3.5 py-2 rounded-lg text-xs shadow-sm transition-colors cursor-pointer">
                  <Printer size={15} />
                  Drucken
              </button>
              <button onClick={handleExportExcel} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3.5 py-2 rounded-lg text-xs shadow-sm transition-colors cursor-pointer">
                  <FileSpreadsheet size={15} />
                  Excel (.xlsx)
              </button>
              <button onClick={handleExportPDF} className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium px-3.5 py-2 rounded-lg text-xs shadow-sm transition-colors cursor-pointer">
                  <FileText size={15} />
                  PDF Export
              </button>
          </div>
      </div>

      {/* Printable Sheet */}
      <div className="report-paper p-8 sm:p-12 ${widthClass} mx-auto min-h-screen bg-white shadow-xl rounded-xl border border-slate-200/80 my-4 print:shadow-none print:border-none print:m-0 print:p-0 print:min-h-0 print:my-0 text-slate-800">
        <div className="border-b-2 border-slate-800 pb-4 mb-6">
          ${report.settings?.logoPosition === 'center' ? `
            <div className="flex flex-col items-center text-center space-y-2">
                ${report.settings?.companyLogoUrl ? `<img src="${report.settings.companyLogoUrl}" alt="Logo" className="h-12 max-w-[200px] mb-1 object-contain" />` : ''}
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">${report.name}</h1>
                ${report.settings?.subtitle ? `<p className="text-sm text-slate-600 font-medium">${report.settings.subtitle}</p>` : ''}
                <p className="text-xs text-slate-500 font-mono">Erstellt am: {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} Uhr</p>
            </div>
          ` : report.settings?.logoPosition === 'right' ? `
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">${report.name}</h1>
                    ${report.settings?.subtitle ? `<p className="text-sm text-slate-600 font-medium mt-1">${report.settings.subtitle}</p>` : ''}
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Erstellt am: {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} Uhr</p>
                </div>
                ${report.settings?.companyLogoUrl ? `
                <div className="flex-shrink-0">
                    <img src="${report.settings.companyLogoUrl}" alt="Logo" className="h-12 max-w-[180px] object-contain" />
                </div>` : ''}
            </div>
          ` : `
            <div className="flex justify-between items-start gap-4">
                <div>
                    ${report.settings?.companyLogoUrl ? `<img src="${report.settings.companyLogoUrl}" alt="Logo" className="h-12 max-w-[180px] mb-2 object-contain" />` : ''}
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">${report.name}</h1>
                    ${report.settings?.subtitle ? `<p className="text-sm text-slate-600 font-medium mt-1">${report.settings.subtitle}</p>` : ''}
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Erstellt am: {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} Uhr</p>
                </div>
            </div>
          `}
        </div>

        <div>
            {groupedData.map((group, idx) => (
                <div key={idx} className="mb-8 break-inside-avoid">
                    {group.key !== 'Gesamt' && (
                        <div className="bg-slate-100 p-2.5 font-bold text-base text-slate-700 border-l-4 border-slate-400 mb-2">
                            {group.key}
                        </div>
                    )}
                    
                    <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full text-sm text-left mb-2">
                            <thead className="border-b-2 border-slate-300 bg-slate-50">
                                <tr>
                                    ${report.columns?.filter(c=>c.visible).map(c => `<th className="py-2.5 px-2 font-semibold uppercase text-xs text-slate-600">${c.label}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                {group.items.map((item, i) => (
                                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                        ${report.columns?.filter(c=>c.visible).map(c => {
                                            const foundField = fields.find(f => f.name === c.label);
                                            const prop = foundField ? foundField.prop : toCamelCase(c.label);
                                            const pascalProp = toPascalCase(c.label);
                                            return `<td className="py-2 px-2">{item['${prop}'] ?? item['${pascalProp}'] ?? item['${c.label}'] ?? ''}</td>`;
                                        }).join('')}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {Object.keys(group.summaries).length > 0 && (
                        <div className="bg-slate-50 p-3 flex justify-end gap-6 text-xs sm:text-sm border-t-2 border-slate-200">
                            {Object.entries(group.summaries).map(([k, v]: any) => (
                                <div key={k}><strong>{k}:</strong> {String(v)}</div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            {groupedData.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                    <p className="text-base font-medium">Keine Berichtsdaten vorhanden.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};`;

  return { name: `${compName}.tsx`, path: `${root}/src/pages/reports/${compName}.tsx`, content, language: 'typescript' };
};
