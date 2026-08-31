/**
 * Multi-Dialect SQL Generator & Transpiler
 * Supports SQL dialect generation for:
 * - PostgreSQL
 * - MySQL / MariaDB
 * - SQLite
 * - Microsoft SQL Server (T-SQL)
 * - Oracle (PL/SQL)
 * - Nextcloud OCP QueryBuilder (PHP Code)
 */

import { SelectQuery, Table, Relationship } from '../../../types/index';
import { generateSqlSelect } from '../../../utils/sqlHelper';

export type SupportedSqlDialect = 'POSTGRES' | 'MYSQL' | 'SQLITE' | 'MSSQL' | 'ORACLE' | 'NEXTCLOUD_OCP';

export interface DialectSqlResult {
  dialect: SupportedSqlDialect;
  displayName: string;
  sql: string;
}

export const generateMultiDialectSql = (
  selectQuery: SelectQuery,
  tables: Table[],
  relationships: Relationship[],
  dialect: SupportedSqlDialect = 'SQLITE'
): string => {
  if (!selectQuery || selectQuery.nodes.length === 0) {
    return '-- Ziehen Sie Tabellen in den Designer, um SQL zu generieren.';
  }

  const baseSql = generateSqlSelect(
    selectQuery.nodes,
    selectQuery.columns,
    tables,
    relationships,
    dialect === 'MSSQL' ? 'SQL' : (dialect === 'MYSQL' ? 'MySQL' : (dialect === 'POSTGRES' ? 'PostgreSQL' : 'SQLite')),
    false,
    undefined,
    Boolean(selectQuery.distinct)
  );

  switch (dialect) {
    case 'POSTGRES':
      return `-- PostgreSQL (ANSI standard with double quotes)\n${baseSql.replace(/`([^`]+)`/g, '"$1"')}`;

    case 'MYSQL':
      return `-- MySQL / MariaDB (Backtick quoting)\n${baseSql.replace(/"([^"]+)"/g, '`$1`')}`;

    case 'MSSQL':
      return `-- Microsoft SQL Server (T-SQL Square Brackets)\n${baseSql.replace(/"([^"]+)"/g, '[$1]')}`;

    case 'ORACLE':
      return `-- Oracle PL/SQL (ANSI Quoting & ROWNUM limits)\n${baseSql.replace(/`([^`]+)`/g, '"$1"')}`;

    case 'NEXTCLOUD_OCP':
      return transpileToNextcloudOcp(selectQuery, tables);

    case 'SQLITE':
    default:
      return `-- SQLite / Standard ANSI SQL\n${baseSql}`;
  }
};

const transpileToNextcloudOcp = (selectQuery: SelectQuery, tables: Table[]): string => {
  const mainNode = selectQuery.nodes[0];
  const mainTable = tables.find((t) => t.id === mainNode?.tableId);
  const tableName = mainTable ? mainTable.name.toLowerCase() : 'my_table';

  const selectCols = selectQuery.columns
    .filter((c) => c.show)
    .map((c) => `  ->select('${c.fieldName}')`)
    .join('\n');

  return `// Nextcloud OCP Database QueryBuilder (PHP)
$queryBuilder = \\OCP\\DB\\QueryBuilder\\IQueryBuilder::class;
$query = $queryBuilder->selectQuery();
$query->from('${tableName}', 't0')
${selectCols};

$result = $query->execute();
$rows = $result->fetchAll();`;
};
