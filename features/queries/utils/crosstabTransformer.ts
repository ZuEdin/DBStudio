import { AggregateFunction, CrosstabRole } from '../../../types';

export interface PivotHeaderDef {
  key: string;
  label: string;
  isRowHeader?: boolean;
  isPivotColumn?: boolean;
  isTotalColumn?: boolean;
}

export interface PivotMatrixResult {
  headers: string[];
  headerDefs: PivotHeaderDef[];
  rows: Record<string, any>[];
  columnValues: string[];
  rowHeaderKeys: string[];
  totalsRow: Record<string, any>;
  stats: {
    totalInputRows: number;
    matrixRowCount: number;
    pivotColumnCount: number;
    grandTotal: number;
  };
}

export interface CrosstabFieldConfig {
  fieldId: string;
  fieldName: string;
  alias?: string;
  tableName?: string;
  aggregate?: AggregateFunction;
  crosstabRole?: CrosstabRole;
}

export interface MatrixComputationConfig {
  rowHeaders: { fieldName: string; alias?: string }[];
  columnHeader: { fieldName: string; alias?: string };
  valueField: { fieldName: string; alias?: string; aggregate: AggregateFunction };
  showRowTotals?: boolean;
  showColTotals?: boolean;
  emptyCellPlaceholder?: number | string | null;
}

/**
 * Computes an aggregated scalar value from a list of raw values.
 */
export function computeAggregate(values: any[], agg: AggregateFunction): number | string {
  if (!values || values.length === 0) {
    return agg === 'COUNT' ? 0 : 0;
  }

  // Filter out null / undefined
  const validValues = values.filter((v) => v !== null && v !== undefined && v !== '');

  if (agg === 'COUNT') {
    return validValues.length;
  }

  if (agg === 'FIRST') {
    return validValues.length > 0 ? validValues[0] : '';
  }

  if (agg === 'LAST') {
    return validValues.length > 0 ? validValues[validValues.length - 1] : '';
  }

  // Numerical aggregations (SUM, AVG, MIN, MAX)
  const numValues = validValues.map((v) => {
    if (typeof v === 'number') return v;
    const parsed = parseFloat(String(v).replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  });

  if (numValues.length === 0) return 0;

  switch (agg) {
    case 'SUM': {
      const sum = numValues.reduce((acc, val) => acc + val, 0);
      return Math.round(sum * 100) / 100;
    }
    case 'AVG': {
      const sum = numValues.reduce((acc, val) => acc + val, 0);
      return Math.round((sum / numValues.length) * 100) / 100;
    }
    case 'MIN':
      return Math.min(...numValues);
    case 'MAX':
      return Math.max(...numValues);
    default: {
      // Default to SUM
      const sum = numValues.reduce((acc, val) => acc + val, 0);
      return Math.round(sum * 100) / 100;
    }
  }
}

/**
 * Helper to safely extract a field value from a row regardless of alias or dot notation.
 */
export function getRowFieldValue(row: Record<string, any>, fieldName: string, alias?: string): any {
  if (!row) return undefined;
  if (alias && row[alias] !== undefined) return row[alias];
  if (row[fieldName] !== undefined) return row[fieldName];

  const lowerField = fieldName.toLowerCase();
  const lowerAlias = alias ? alias.toLowerCase() : '';

  for (const [k, v] of Object.entries(row)) {
    const kLower = k.toLowerCase();
    if (kLower === lowerField || (lowerAlias && kLower === lowerAlias)) {
      return v;
    }
    if (kLower.endsWith('.' + lowerField)) {
      return v;
    }
  }

  return undefined;
}

/**
 * Transforms flat tabular/relational records into a true two-dimensional Pivot Matrix table.
 */
export function transformToPivotMatrix(
  data: Record<string, any>[],
  config: MatrixComputationConfig
): PivotMatrixResult {
  if (!data || data.length === 0) {
    return {
      headers: [],
      headerDefs: [],
      rows: [],
      columnValues: [],
      rowHeaderKeys: [],
      totalsRow: {},
      stats: { totalInputRows: 0, matrixRowCount: 0, pivotColumnCount: 0, grandTotal: 0 },
    };
  }

  const rowKeyNames = config.rowHeaders.map((r) => r.alias || r.fieldName);
  const colKeyName = config.columnHeader.alias || config.columnHeader.fieldName;
  const valKeyName = config.valueField.alias || config.valueField.fieldName;
  const agg = config.valueField.aggregate || 'COUNT';
  const showRowTotals = config.showRowTotals !== false;
  const showColTotals = config.showColTotals !== false;
  const emptyPlaceholder = config.emptyCellPlaceholder !== undefined ? config.emptyCellPlaceholder : 0;

  // 1. Discover all distinct column values from dataset
  const distinctColMap = new Map<string, string>(); // formatted key -> display label
  data.forEach((row) => {
    const rawVal = getRowFieldValue(row, config.columnHeader.fieldName, config.columnHeader.alias);
    let label = '';
    if (rawVal === null || rawVal === undefined || String(rawVal).trim() === '') {
      label = '(Keine Angabe)';
    } else if (typeof rawVal === 'boolean') {
      label = rawVal ? 'Ja' : 'Nein';
    } else {
      label = String(rawVal).trim();
    }
    distinctColMap.set(label, label);
  });

  const sortedPivotCols = Array.from(distinctColMap.keys()).sort((a, b) => {
    // Keep '(Keine Angabe)' at the end if present
    if (a === '(Keine Angabe)') return 1;
    if (b === '(Keine Angabe)') return -1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  // 2. Group records by row header values
  interface RowGroupBucket {
    rowData: Record<string, any>;
    cells: Record<string, any[]>; // colVal -> raw values
    allValues: any[];
  }

  const groupBuckets: Record<string, RowGroupBucket> = {};

  data.forEach((row) => {
    // Build unique composite key for row groupings
    const rowKeyParts = config.rowHeaders.map((r) => {
      const val = getRowFieldValue(row, r.fieldName, r.alias);
      return val === null || val === undefined ? '(Leer)' : String(val);
    });
    const groupKey = rowKeyParts.join('___');

    if (!groupBuckets[groupKey]) {
      const initialRowData: Record<string, any> = {};
      config.rowHeaders.forEach((r, idx) => {
        const outName = r.alias || r.fieldName;
        const rawVal = getRowFieldValue(row, r.fieldName, r.alias);
        initialRowData[outName] = rawVal === null || rawVal === undefined ? '' : rawVal;
      });

      groupBuckets[groupKey] = {
        rowData: initialRowData,
        cells: {},
        allValues: [],
      };
    }

    // Determine column heading for this row
    const rawColVal = getRowFieldValue(row, config.columnHeader.fieldName, config.columnHeader.alias);
    let colLabel = '(Keine Angabe)';
    if (rawColVal !== null && rawColVal !== undefined && String(rawColVal).trim() !== '') {
      colLabel = typeof rawColVal === 'boolean' ? (rawColVal ? 'Ja' : 'Nein') : String(rawColVal).trim();
    }

    // Extract value
    const rawVal = getRowFieldValue(row, config.valueField.fieldName, config.valueField.alias);

    if (!groupBuckets[groupKey].cells[colLabel]) {
      groupBuckets[groupKey].cells[colLabel] = [];
    }
    groupBuckets[groupKey].cells[colLabel].push(rawVal);
    groupBuckets[groupKey].allValues.push(rawVal);
  });

  // 3. Assemble matrix rows
  const matrixRows: Record<string, any>[] = [];
  const colTotalsAccumulator: Record<string, any[]> = {};
  sortedPivotCols.forEach((c) => (colTotalsAccumulator[c] = []));
  const grandTotalValues: any[] = [];

  Object.values(groupBuckets).forEach((bucket) => {
    const matrixRow: Record<string, any> = { ...bucket.rowData };

    // Calculate each column's aggregated cell value
    sortedPivotCols.forEach((colKey) => {
      const cellValues = bucket.cells[colKey];
      if (cellValues && cellValues.length > 0) {
        const cellAgg = computeAggregate(cellValues, agg);
        matrixRow[colKey] = cellAgg;
        colTotalsAccumulator[colKey].push(cellAgg);
      } else {
        matrixRow[colKey] = emptyPlaceholder;
      }
    });

    // Calculate Row Total (Gesamtsumme der Zeile)
    if (showRowTotals) {
      const rowTotal = computeAggregate(bucket.allValues, agg);
      matrixRow['Gesamtwert'] = rowTotal;
      grandTotalValues.push(rowTotal);
    }

    matrixRows.push(matrixRow);
  });

  // Sort rows naturally by the first row key
  if (config.rowHeaders.length > 0) {
    const firstRowKey = config.rowHeaders[0].alias || config.rowHeaders[0].fieldName;
    matrixRows.sort((a, b) => {
      const valA = String(a[firstRowKey] ?? '');
      const valB = String(b[firstRowKey] ?? '');
      return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  // 4. Assemble Bottom Totals Row (Gesamtergebnis)
  const totalsRow: Record<string, any> = {};
  if (config.rowHeaders.length > 0) {
    const firstRowKey = config.rowHeaders[0].alias || config.rowHeaders[0].fieldName;
    totalsRow[firstRowKey] = 'Gesamtergebnis';
    config.rowHeaders.slice(1).forEach((r) => {
      totalsRow[r.alias || r.fieldName] = '';
    });
  }

  sortedPivotCols.forEach((colKey) => {
    const colValues = colTotalsAccumulator[colKey] || [];
    totalsRow[colKey] = computeAggregate(colValues, agg === 'AVG' ? 'AVG' : 'SUM');
  });

  let grandTotalNumber = 0;
  if (showRowTotals) {
    const grandTotalVal = computeAggregate(grandTotalValues, agg === 'AVG' ? 'AVG' : 'SUM');
    totalsRow['Gesamtwert'] = grandTotalVal;
    grandTotalNumber = typeof grandTotalVal === 'number' ? grandTotalVal : parseFloat(String(grandTotalVal)) || 0;
  }

  // 5. Build Header Definitions
  const headerDefs: PivotHeaderDef[] = [];
  const headers: string[] = [];

  // Row header columns
  config.rowHeaders.forEach((r) => {
    const key = r.alias || r.fieldName;
    headers.push(key);
    headerDefs.push({
      key,
      label: r.alias || r.fieldName,
      isRowHeader: true,
    });
  });

  // Row Total column (if enabled, placed right next to row headers or at the end)
  if (showRowTotals) {
    headers.push('Gesamtwert');
    headerDefs.push({
      key: 'Gesamtwert',
      label: 'Gesamtwert',
      isTotalColumn: true,
    });
  }

  // Dynamic Pivot columns
  sortedPivotCols.forEach((colKey) => {
    headers.push(colKey);
    headerDefs.push({
      key: colKey,
      label: colKey,
      isPivotColumn: true,
    });
  });

  return {
    headers,
    headerDefs,
    rows: matrixRows,
    columnValues: sortedPivotCols,
    rowHeaderKeys: rowKeyNames,
    totalsRow,
    stats: {
      totalInputRows: data.length,
      matrixRowCount: matrixRows.length,
      pivotColumnCount: sortedPivotCols.length,
      grandTotal: grandTotalNumber,
    },
  };
}
