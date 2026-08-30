import * as XLSX from 'xlsx';
import { Table, Query, Relationship, Field } from '../../../types';
import { ExcelExportOptions } from '../types';

export class ExcelExportEngine {
  /**
   * Export multiple tables and/or queries into a single multi-sheet Excel (.xlsx) file
   */
  public static exportToWorkbook(
    tables: Table[],
    queries: Query[] = [],
    relationships: Relationship[] = [],
    options: ExcelExportOptions
  ): void {
    const wb = XLSX.utils.book_new();

    // 1. Export Selected Tables
    const selectedTables = tables.filter(t => options.selectedTableIds.includes(t.id));
    for (const table of selectedTables) {
      const ws = this.createWorksheetForTable(table, options);
      const sheetName = this.sanitizeSheetName(table.name);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    // 2. Export Selected Queries
    const selectedQueries = queries.filter(q => options.selectedQueryIds.includes(q.id));
    for (const query of selectedQueries) {
      const ws = this.createWorksheetForQuery(query, tables, options);
      const sheetName = this.sanitizeSheetName(`Q_${query.name}`);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    // 3. Optional: Schema Metadata Sheet (Data Dictionary)
    if (options.includeSchemaSheet && selectedTables.length > 0) {
      const schemaWs = this.createSchemaDictionarySheet(selectedTables, relationships);
      XLSX.utils.book_append_sheet(wb, schemaWs, '_Schema_Info');
    }

    // Fallback if empty
    if (wb.SheetNames.length === 0 && tables.length > 0) {
      const ws = this.createWorksheetForTable(tables[0], options);
      XLSX.utils.book_append_sheet(wb, ws, this.sanitizeSheetName(tables[0].name));
    }

    // Generate filename
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const defaultName = selectedTables.length === 1 
      ? `${selectedTables[0].name}_${dateStr}`
      : `DBStudio_Export_${dateStr}`;
    const baseName = (options.fileName?.trim() || defaultName).replace(/[^a-zA-Z0-9_-]/g, '_');

    if (options.format === 'csv') {
      const firstSheetName = wb.SheetNames[0];
      const csvData = XLSX.utils.sheet_to_csv(wb.Sheets[firstSheetName]);
      this.downloadBlob(new Blob([csvData], { type: 'text/csv;charset=utf-8;' }), `${baseName}.csv`);
    } else if (options.format === 'json') {
      const firstSheetName = wb.SheetNames[0];
      const jsonData = XLSX.utils.sheet_to_json(wb.Sheets[firstSheetName]);
      this.downloadBlob(new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' }), `${baseName}.json`);
    } else {
      XLSX.writeFile(wb, `${baseName}.xlsx`);
    }
  }

  /**
   * Export a single table immediately with standard options
   */
  public static exportSingleTable(table: Table, format: 'xlsx' | 'csv' = 'xlsx'): void {
    this.exportToWorkbook(
      [table],
      [],
      [],
      {
        format,
        theme: 'corporate_blue',
        includeTotalsRow: true,
        autoFitColumns: true,
        freezeHeaderRow: true,
        includeLookupRelations: false,
        includeSchemaSheet: false,
        selectedTableIds: [table.id],
        selectedQueryIds: []
      }
    );
  }

  /**
   * Export raw dataset (e.g. from SQL query runner) directly to Excel
   */
  public static exportRawDataset(
    title: string,
    columns: { header: string; key: string }[],
    data: any[],
    format: 'xlsx' | 'csv' = 'xlsx'
  ): void {
    const wb = XLSX.utils.book_new();
    const rows = data.map(row => {
      const obj: Record<string, any> = {};
      columns.forEach(col => {
        obj[col.header] = row[col.key] ?? row[col.header] ?? '';
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto column widths
    const colWidths = columns.map(c => ({
      wch: Math.max(c.header.length + 4, 12)
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, this.sanitizeSheetName(title));
    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      this.downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${cleanTitle}.csv`);
    } else {
      XLSX.writeFile(wb, `${cleanTitle}.xlsx`);
    }
  }

  private static createWorksheetForTable(table: Table, options: ExcelExportOptions): XLSX.WorkSheet {
    const fields = table.fields || [];
    const rows = (table.data || []).map(row => {
      const mappedRow: Record<string, any> = {};
      fields.forEach(f => {
        const val = row[f.name] ?? row[f.id];
        mappedRow[f.name] = this.formatCellValue(val, f.type);
      });
      return mappedRow;
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // 1. Column Width Calculation
    if (options.autoFitColumns) {
      ws['!cols'] = fields.map(f => {
        let maxLen = f.name.length;
        (table.data || []).slice(0, 100).forEach(r => {
          const v = String(r[f.name] ?? r[f.id] ?? '');
          if (v.length > maxLen) maxLen = v.length;
        });
        return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
      });
    }

    // 2. Add Totals Formula Row (SUM for numeric fields)
    if (options.includeTotalsRow && (table.data?.length || 0) > 0) {
      const lastRowNum = (table.data?.length || 0) + 1; // 1-indexed (header is 1)
      const totalsRowNum = lastRowNum + 1;

      fields.forEach((f, colIdx) => {
        if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE' || f.type === 'FLOAT' || f.type === 'REAL') {
          const colLetter = XLSX.utils.encode_col(colIdx);
          const cellRef = `${colLetter}${totalsRowNum}`;
          ws[cellRef] = {
            t: 'n',
            f: `SUM(${colLetter}2:${colLetter}${lastRowNum})`
          };
        } else if (colIdx === 0) {
          const cellRef = `A${totalsRowNum}`;
          ws[cellRef] = { t: 's', v: 'Gesamtsumme' };
        }
      });

      // Update worksheet range
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
      range.e.r = totalsRowNum - 1;
      ws['!ref'] = XLSX.utils.encode_range(range);
    }

    return ws;
  }

  private static createWorksheetForQuery(query: Query, tables: Table[], options: ExcelExportOptions): XLSX.WorkSheet {
    // Generate dummy/query rows based on query columns
    const columns = (query as any).columns || [];
    const dummyRows: any[] = [];
    for (let i = 1; i <= 5; i++) {
      const row: Record<string, any> = {};
      columns.forEach((c: any) => {
        const header = c.alias || c.field || `Spalte_${c.id}`;
        row[header] = `Ergebnis #${i}`;
      });
      dummyRows.push(row);
    }

    const ws = XLSX.utils.json_to_sheet(dummyRows);
    ws['!cols'] = columns.map((c: any) => ({
      wch: Math.max((c.alias || c.field || '').length + 4, 14)
    }));
    return ws;
  }

  private static createSchemaDictionarySheet(tables: Table[], relationships: Relationship[]): XLSX.WorkSheet {
    const dictionaryRows: any[] = [];

    tables.forEach(t => {
      t.fields.forEach(f => {
        dictionaryRows.push({
          Tabelle: t.name,
          Spalte: f.name,
          Datentyp: f.type,
          Primärschlüssel: f.isPrimaryKey ? 'JA' : 'NEIN',
          Pflichtfeld: f.isNullable === false ? 'JA' : 'NEIN',
          Standardwert: f.defaultValue || '',
          Beschreibung: (f as any).description || ''
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(dictionaryRows);
    ws['!cols'] = [
      { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 15 }, { wch: 25 }
    ];
    return ws;
  }

  private static formatCellValue(val: any, type: string): any {
    if (val === undefined || val === null) return '';
    if (type === 'BOOLEAN') {
      return val === true || val === 'true' || val === 1 ? 'WAHR' : 'FALSCH';
    }
    if (type === 'INTEGER' || type === 'DECIMAL' || type === 'DOUBLE' || type === 'FLOAT' || type === 'REAL' || type === 'INT') {
      const num = Number(val);
      return isNaN(num) ? val : num;
    }
    return val;
  }

  private static sanitizeSheetName(name: string): string {
    return name.replace(/[\\/?*[\]]/g, '_').substring(0, 31);
  }

  private static downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
