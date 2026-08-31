/**
 * Multi-Format Query Data Export Engine
 * Supports exporting result datasets to:
 * - Excel (.xlsx / CSV)
 * - JSON
 * - XML
 * - HTML Table
 * - Apache Parquet schema representation
 */

export type ExportFormat = 'EXCEL' | 'CSV' | 'JSON' | 'XML' | 'HTML' | 'PARQUET';

export const exportQueryResult = (
  rows: Record<string, any>[],
  columns: string[],
  format: ExportFormat,
  filename: string = 'AbfrageErgebnis'
): void => {
  let content = '';
  let mimeType = 'text/plain';
  let extension = 'txt';

  if (!rows || rows.length === 0) {
    alert('Keine Daten zum Exportieren vorhanden.');
    return;
  }

  switch (format) {
    case 'CSV':
      extension = 'csv';
      mimeType = 'text/csv;charset=utf-8;';
      const header = columns.map((c) => `"${c}"`).join(';');
      const body = rows
        .map((r) => columns.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(';'))
        .join('\n');
      content = `${header}\n${body}`;
      break;

    case 'JSON':
      extension = 'json';
      mimeType = 'application/json';
      content = JSON.stringify(rows, null, 2);
      break;

    case 'XML':
      extension = 'xml';
      mimeType = 'application/xml';
      const xmlRows = rows
        .map(
          (r) =>
            `  <record>\n` +
            columns.map((c) => `    <${c}>${r[c] ?? ''}</${c}>`).join('\n') +
            `\n  </record>`
        )
        .join('\n');
      content = `<?xml version="1.0" encoding="UTF-8"?>\n<query_result>\n${xmlRows}\n</query_result>`;
      break;

    case 'HTML':
      extension = 'html';
      mimeType = 'text/html';
      const htmlHeader = columns.map((c) => `<th style="border: 1px solid #ddd; padding: 8px; background: #f2f2f2;">${c}</th>`).join('');
      const htmlBody = rows
        .map(
          (r) =>
            `  <tr>` +
            columns.map((c) => `<td style="border: 1px solid #ddd; padding: 8px;">${r[c] ?? ''}</td>`).join('') +
            `</tr>`
        )
        .join('\n');
      content = `<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"/><title>${filename}</title></head>\n<body>\n<table style="border-collapse: collapse; width: 100%;">\n  <thead><tr>${htmlHeader}</tr></thead>\n  <tbody>\n${htmlBody}\n  </tbody>\n</table>\n</body>\n</html>`;
      break;

    case 'PARQUET':
      extension = 'json';
      mimeType = 'application/json';
      content = JSON.stringify(
        {
          parquetSchema: columns.map((c) => ({ name: c, type: 'BYTE_ARRAY', convertedType: 'UTF8' })),
          records: rows,
        },
        null,
        2
      );
      break;

    case 'EXCEL':
    default:
      extension = 'csv';
      mimeType = 'text/csv;charset=utf-8;';
      const xHeader = `\uFEFF` + columns.map((c) => `"${c}"`).join(';');
      const xBody = rows
        .map((r) => columns.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(';'))
        .join('\n');
      content = `${xHeader}\n${xBody}`;
      break;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
