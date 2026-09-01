import { Table, DbType, SelectQuery, QueryColumn, AggregateFunction, CrosstabRole } from '../../../types';
import { quoteIdentifier } from '../../../utils/generators/common';
import {
  transformToPivotMatrix,
  PivotMatrixResult,
  MatrixComputationConfig,
} from './crosstabTransformer';

export interface CrosstabConfig {
  sourceTableId: string;
  rowHeaders: { fieldId: string; fieldName: string; alias?: string }[];
  columnHeader: { fieldId: string; fieldName: string; alias?: string };
  valueField: { fieldId: string; fieldName: string; alias?: string; aggregate: AggregateFunction };
  distinctColumnHeaders?: string[];
  showRowTotals?: boolean;
  showColTotals?: boolean;
}

/**
 * Extracts a normalized CrosstabConfig from a Query object.
 */
export function extractCrosstabConfigFromQuery(
  query: SelectQuery,
  tables: Table[]
): CrosstabConfig | null {
  if (!query || !query.columns || query.columns.length === 0) return null;

  const rowHeaders: { fieldId: string; fieldName: string; alias?: string }[] = [];
  let columnHeader: { fieldId: string; fieldName: string; alias?: string } | null = null;
  let valueField: { fieldId: string; fieldName: string; alias?: string; aggregate: AggregateFunction } | null = null;

  // 1. Check explicit crosstab role flags
  query.columns.forEach((col) => {
    if (col.crosstab === 'ROW_HEADING') {
      rowHeaders.push({ fieldId: col.fieldId, fieldName: col.fieldName, alias: col.alias });
    } else if (col.crosstab === 'COLUMN_HEADING') {
      columnHeader = { fieldId: col.fieldId, fieldName: col.fieldName, alias: col.alias };
    } else if (col.crosstab === 'VALUE') {
      valueField = {
        fieldId: col.fieldId,
        fieldName: col.fieldName,
        alias: col.alias,
        aggregate: (col.aggregate && col.aggregate !== 'GROUP_BY' ? col.aggregate : 'COUNT') as AggregateFunction,
      };
    }
  });

  // 2. Fallback: check query.crosstabConfig property
  if ((!columnHeader || !valueField) && query.crosstabConfig) {
    const cfg = query.crosstabConfig;
    const findField = (name: string) => {
      const col = query.columns.find((c) => c.fieldName === name || c.alias === name);
      return { fieldId: col?.fieldId || name, fieldName: name, alias: col?.alias };
    };

    return {
      sourceTableId: query.nodes[0]?.data?.tableId || query.nodes[0]?.id || tables[0]?.id || '',
      rowHeaders: (cfg.rowHeaders || []).map(findField),
      columnHeader: findField(cfg.columnHeader),
      valueField: {
        ...findField(cfg.valueField),
        aggregate: cfg.aggregate || 'COUNT',
      },
      showRowTotals: cfg.showRowTotals !== false,
      showColTotals: cfg.showColTotals !== false,
    };
  }

  // 3. Fallback: heuristic detection if query is marked as CROSSTAB or has GROUP_BY + Aggregates
  if (query.type === 'CROSSTAB' && (!columnHeader || !valueField)) {
    const visibleCols = query.columns.filter((c) => c.show);
    const groupCols = visibleCols.filter((c) => c.aggregate === 'GROUP_BY' || !c.aggregate);
    const aggCols = visibleCols.filter((c) => c.aggregate && c.aggregate !== 'GROUP_BY');

    if (groupCols.length >= 2 && aggCols.length >= 1) {
      // First N-1 group cols -> Row Headers, Last group col -> Column Header
      const rCols = groupCols.slice(0, groupCols.length - 1).map((c) => ({
        fieldId: c.fieldId,
        fieldName: c.fieldName,
        alias: c.alias,
      }));
      const cCol = {
        fieldId: groupCols[groupCols.length - 1].fieldId,
        fieldName: groupCols[groupCols.length - 1].fieldName,
        alias: groupCols[groupCols.length - 1].alias,
      };
      const vCol = {
        fieldId: aggCols[0].fieldId,
        fieldName: aggCols[0].fieldName,
        alias: aggCols[0].alias,
        aggregate: aggCols[0].aggregate as AggregateFunction,
      };

      return {
        sourceTableId: query.nodes[0]?.data?.tableId || query.nodes[0]?.id || tables[0]?.id || '',
        rowHeaders: rCols.length > 0 ? rCols : [{ fieldId: groupCols[0].fieldId, fieldName: groupCols[0].fieldName, alias: groupCols[0].alias }],
        columnHeader: cCol,
        valueField: vCol,
        showRowTotals: true,
        showColTotals: true,
      };
    }
  }

  if (rowHeaders.length > 0 && columnHeader && valueField) {
    return {
      sourceTableId: query.nodes[0]?.data?.tableId || query.nodes[0]?.id || tables[0]?.id || '',
      rowHeaders,
      columnHeader,
      valueField,
      showRowTotals: true,
      showColTotals: true,
    };
  }

  return null;
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
  const tableNameStr = table ? table.name : (config.sourceTableId || 'Tabelle');
  const tableName = quoteIdentifier(tableNameStr, dbType);

  const rowCols = config.rowHeaders.map((r) => quoteIdentifier(r.alias || r.fieldName, dbType)).join(', ');
  const colField = quoteIdentifier(config.columnHeader.alias || config.columnHeader.fieldName, dbType);
  const valField = quoteIdentifier(config.valueField.alias || config.valueField.fieldName, dbType);
  const agg = config.valueField.aggregate || 'COUNT';

  // Distinct column headers (or placeholders)
  const distinctVals = config.distinctColumnHeaders && config.distinctColumnHeaders.length > 0
    ? config.distinctColumnHeaders
    : ['Männlich', 'Weiblich', 'Divers'];

  // Access SQL format: TRANSFORM ... SELECT ... GROUP BY ... PIVOT ...
  const accessSql = `TRANSFORM ${agg}(${tableName}.${valField}) AS [${config.valueField.alias || 'Wert'}]
SELECT ${config.rowHeaders.map(r => `${tableName}.${quoteIdentifier(r.fieldName, DbType.SQL)}`).join(', ')}, ${agg}(${tableName}.${valField}) AS [Gesamtwert]
FROM ${tableName}
GROUP BY ${config.rowHeaders.map(r => `${tableName}.${quoteIdentifier(r.fieldName, DbType.SQL)}`).join(', ')}
PIVOT ${tableName}.${colField};`;

  if (String(dbType).toUpperCase().includes('ACCESS')) {
    return `-- MS Access SQL Kreuztabellenabfrage
${accessSql}`;
  }

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
) AS PivotTable;

-- Alternativ (MS Access Dialekt):
${accessSql}`;
  }

  // ANSI SQL / SQLite / PostgreSQL / MySQL using conditional aggregation (CASE WHEN)
  const conditionalCols = distinctVals
    .map((val) => {
      const escapedVal = val.replace(/'/g, "''");
      const colAlias = quoteIdentifier(val, dbType);
      if (agg === 'COUNT') {
        return `    COUNT(CASE WHEN ${colField} = '${escapedVal}' THEN 1 ELSE NULL END) AS ${colAlias}`;
      }
      return `    ${agg}(CASE WHEN ${colField} = '${escapedVal}' THEN ${valField} ELSE NULL END) AS ${colAlias}`;
    })
    .join(',\n');

  const totalCol = agg === 'COUNT'
    ? `    COUNT(*) AS ${quoteIdentifier('Gesamtwert', dbType)}`
    : `    ${agg}(${valField}) AS ${quoteIdentifier('Gesamtwert', dbType)}`;

  return `-- ANSI SQL / ${dbType} Kreuztabellen-Abfrage (Pivot Matrix)
SELECT 
    ${rowCols},
${totalCol},
${conditionalCols}
FROM ${tableName}
GROUP BY ${rowCols}
ORDER BY ${rowCols};

-- MS Access Syntax (TRANSFORM ... PIVOT):
${accessSql}`;
};

/**
 * Execute in-memory pivot computation for live preview
 */
export const executeCrosstabInMemory = (
  config: CrosstabConfig,
  tableData: Record<string, any>[]
): PivotMatrixResult => {
  const transformConfig: MatrixComputationConfig = {
    rowHeaders: config.rowHeaders.map((r) => ({ fieldName: r.fieldName, alias: r.alias })),
    columnHeader: { fieldName: config.columnHeader.fieldName, alias: config.columnHeader.alias },
    valueField: {
      fieldName: config.valueField.fieldName,
      alias: config.valueField.alias,
      aggregate: config.valueField.aggregate || 'COUNT',
    },
    showRowTotals: config.showRowTotals !== false,
    showColTotals: config.showColTotals !== false,
  };

  return transformToPivotMatrix(tableData, transformConfig);
};
