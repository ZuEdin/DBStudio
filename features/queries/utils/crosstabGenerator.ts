import { Table, DbType } from '../../../types';
import { quoteIdentifier } from '../../../utils/generators/common';

export interface CrosstabConfig {
  sourceTableId: string;
  rowHeaders: { fieldId: string; fieldName: string; alias?: string }[];
  columnHeader: { fieldId: string; fieldName: string };
  valueField: { fieldId: string; fieldName: string; aggregate: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' };
  distinctColumnHeaders?: string[];
}

/**
 * Generates Cross-tabulation / Pivot SQL for different database engines
 */
export const generateCrosstabSql = (
  config: CrosstabConfig,
  tables: Table[],
  dbType: DbType = DbType.SQLite
): string => {
  const table = tables.find((t) => t.id === config.sourceTableId || t.name === config.sourceTableId);
  if (!table) return '-- Quelltabelle für Kreuztabelle nicht gefunden';

  const tableName = quoteIdentifier(table.name, dbType);
  const rowCols = config.rowHeaders.map((r) => quoteIdentifier(r.fieldName, dbType)).join(', ');
  const colField = quoteIdentifier(config.columnHeader.fieldName, dbType);
  const valField = quoteIdentifier(config.valueField.fieldName, dbType);
  const agg = config.valueField.aggregate || 'SUM';

  // Sample or known distinct column headers (e.g. ['Lohn', 'Material', 'Geraete', 'Nachunternehmer'])
  const distinctVals = config.distinctColumnHeaders && config.distinctColumnHeaders.length > 0
    ? config.distinctColumnHeaders
    : ['Kategorie_A', 'Kategorie_B', 'Kategorie_C'];

  if (dbType === DbType.SQL) {
    // MS SQL Server PIVOT syntax
    const pivotCols = distinctVals.map((v) => `[${v}]`).join(', ');
    return `-- MS SQL Server Native PIVOT
SELECT ${rowCols}, ${pivotCols}
FROM (
    SELECT ${rowCols}, ${colField}, ${valField}
    FROM ${tableName}
) AS SourceTable
PIVOT (
    ${agg}(${valField})
    FOR ${colField} IN (${pivotCols})
) AS PivotTable;`;
  }

  // ANSI SQL / SQLite / PostgreSQL / MySQL using conditional aggregation
  const conditionalCols = distinctVals
    .map((val) => {
      const escapedVal = val.replace(/'/g, "''");
      const colAlias = quoteIdentifier(val, dbType);
      return `    ${agg}(CASE WHEN ${colField} = '${escapedVal}' THEN ${valField} ELSE NULL END) AS ${colAlias}`;
    })
    .join(',\n');

  const totalCol = `    ${agg}(${valField}) AS ${quoteIdentifier('Gesamtsumme', dbType)}`;

  return `-- ANSI SQL / ${dbType} Kreuztabellen-Abfrage (Pivot Matrix)
SELECT 
    ${rowCols},
${conditionalCols},
${totalCol}
FROM ${tableName}
GROUP BY ${rowCols}
ORDER BY ${rowCols};`;
};

/**
 * Execute in-memory pivot computation for preview
 */
export const executeCrosstabInMemory = (
  config: CrosstabConfig,
  tableData: Record<string, any>[]
): { headers: string[]; rows: Record<string, any>[] } => {
  if (!tableData || tableData.length === 0) {
    return { headers: [], rows: [] };
  }

  const rowKeyNames = config.rowHeaders.map((r) => r.fieldName);
  const colKeyName = config.columnHeader.fieldName;
  const valKeyName = config.valueField.fieldName;
  const agg = config.valueField.aggregate;

  // 1. Collect all distinct column headers
  const distinctCols = new Set<string>();
  tableData.forEach((row) => {
    const colVal = row[colKeyName];
    if (colVal !== undefined && colVal !== null) {
      distinctCols.add(String(colVal));
    }
  });

  const sortedCols = Array.from(distinctCols).sort();

  // 2. Group by row keys
  const grouped: Record<string, { rowData: Record<string, any>; pivotValues: Record<string, number[]>; allValues: number[] }> = {};

  tableData.forEach((row) => {
    const groupKey = rowKeyNames.map((k) => String(row[k] ?? '')).join('___');
    if (!grouped[groupKey]) {
      const initialRowData: Record<string, any> = {};
      rowKeyNames.forEach((k) => {
        initialRowData[k] = row[k];
      });
      grouped[groupKey] = {
        rowData: initialRowData,
        pivotValues: {},
        allValues: [],
      };
    }

    const colVal = String(row[colKeyName] ?? '');
    const numVal = Number(row[valKeyName]) || 0;

    if (!grouped[groupKey].pivotValues[colVal]) {
      grouped[groupKey].pivotValues[colVal] = [];
    }
    grouped[groupKey].pivotValues[colVal].push(numVal);
    grouped[groupKey].allValues.push(numVal);
  });

  const calcAgg = (values?: number[]): number => {
    if (!values || values.length === 0) return 0;
    if (agg === 'SUM') return values.reduce((a, b) => a + b, 0);
    if (agg === 'COUNT') return values.length;
    if (agg === 'AVG') return values.reduce((a, b) => a + b, 0) / values.length;
    if (agg === 'MIN') return Math.min(...values);
    if (agg === 'MAX') return Math.max(...values);
    return values.reduce((a, b) => a + b, 0);
  };

  const finalRows: Record<string, any>[] = Object.values(grouped).map((group) => {
    const rowObj: Record<string, any> = { ...group.rowData };
    sortedCols.forEach((col) => {
      const val = calcAgg(group.pivotValues[col]);
      rowObj[col] = Math.round(val * 100) / 100;
    });
    rowObj['Gesamtsumme'] = Math.round(calcAgg(group.allValues) * 100) / 100;
    return rowObj;
  });

  const headers = [...rowKeyNames, ...sortedCols, 'Gesamtsumme'];
  return { headers, rows: finalRows };
};
