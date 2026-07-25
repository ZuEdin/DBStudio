import { ExportFormat } from '../types/macro';

export interface ExportDataOptions {
  title?: string;
  data: Record<string, any>[];
  columns?: string[];
  filename?: string;
  format: ExportFormat;
}

export function exportDataToFile(options: ExportDataOptions) {
  const { title = 'Bericht_Export', data, filename = `export_${Date.now()}`, format } = options;

  if (!data || data.length === 0) {
    alert('Keine Daten für den Export vorhanden.');
    return;
  }

  const columns = options.columns && options.columns.length > 0 
    ? options.columns 
    : Object.keys(data[0] || {});

  switch (format) {
    case 'CSV': {
      let csvContent = '\uFEFF'; // UTF-8 BOM for Excel compatibility
      csvContent += columns.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';') + '\n';
      data.forEach(row => {
        const line = columns.map(c => {
          const val = row[c] !== undefined && row[c] !== null ? String(row[c]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        }).join(';');
        csvContent += line + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, `${filename}.csv`);
      break;
    }

    case 'JSON': {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      downloadBlob(blob, `${filename}.json`);
      break;
    }

    case 'XML': {
      let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<export>\n';
      xmlContent += `  <metadata>\n    <title>${escapeXml(title)}</title>\n    <generatedAt>${new Date().toISOString()}</generatedAt>\n  </metadata>\n  <records>\n`;
      data.forEach((row, i) => {
        xmlContent += `    <record id="${i + 1}">\n`;
        columns.forEach(col => {
          const val = row[col] !== undefined && row[col] !== null ? String(row[col]) : '';
          xmlContent += `      <${cleanXmlTag(col)}>${escapeXml(val)}</${cleanXmlTag(col)}>\n`;
        });
        xmlContent += '    </record>\n';
      });
      xmlContent += '  </records>\n</export>';

      const blob = new Blob([xmlContent], { type: 'text/xml;charset=utf-8;' });
      downloadBlob(blob, `${filename}.xml`);
      break;
    }

    case 'XLSX': {
      // Create HTML table structure that Excel reads natively as .xls/.xlsx
      let htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Daten</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  th { background-color: #4F46E5; color: white; font-weight: bold; padding: 8px; text-align: left; border: 1px solid #CBD5E1; }
  td { padding: 6px; border: 1px solid #E2E8F0; }
  table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
</style>
</head>
<body>
<h2>${escapeXml(title)}</h2>
<table>
  <thead>
    <tr>${columns.map(c => `<th>${escapeXml(c)}</th>`).join('')}</tr>
  </thead>
  <tbody>
    ${data.map(row => `<tr>${columns.map(c => `<td>${escapeXml(String(row[c] ?? ''))}</td>`).join('')}</tr>`).join('\n')}
  </tbody>
</table>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      downloadBlob(blob, `${filename}.xlsx`);
      break;
    }

    case 'PDF':
    case 'HTML_PRINT': {
      // Create printable HTML window or styled PDF view
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Pop-up vom Browser blockiert. Bitte erlauben Sie Pop-ups für den PDF-Druck.');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${escapeXml(title)}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; color: #1e293b; }
            h1 { color: #4338ca; border-b: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 4px; font-size: 20px; }
            .meta { font-size: 11px; color: #64748b; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background-color: #f1f5f9; color: #334155; font-weight: 700; text-align: left; padding: 10px 8px; border-bottom: 2px solid #cbd5e1; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 8px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 15px; display: flex; justify-content: space-between;">
            <button onclick="window.print()" style="background-color: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
              🖨️ Als PDF Drucken / Speichern
            </button>
            <button onclick="window.close()" style="background-color: #64748b; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
              Schließen
            </button>
          </div>
          <h1>${escapeXml(title)}</h1>
          <div class="meta">Exportiert am ${new Date().toLocaleString('de-DE')} • ${data.length} Datensätze</div>
          <table>
            <thead>
              <tr>${columns.map(c => `<th>${escapeXml(c)}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${data.map(row => `<tr>${columns.map(c => `<td>${escapeXml(String(row[c] ?? ''))}</td>`).join('')}</tr>`).join('\n')}
            </tbody>
          </table>
          <div class="footer">DB Studio Pro • Berichtsmakro Export</div>
        </body>
        </html>
      `);
      printWindow.document.close();
      break;
    }
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cleanXmlTag(str: string): string {
  const cleaned = str.replace(/[^a-zA-Z0-9_]/g, '_');
  return /^[a-zA-Z_]/.test(cleaned) ? cleaned : `field_${cleaned}`;
}
