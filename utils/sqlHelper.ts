import { DbType, QueryColumn, Table, Relationship } from '../types/index';

/**
 * Quotes an identifier (table or column name) according to the target SQL dialect.
 */
export function quoteSqlIdentifier(identifier: string, dbType: DbType | string = DbType.SQLite): string {
  if (!identifier) return '';
  if (identifier === '*') return '*';

  const typeStr = String(dbType).toUpperCase();
  if (typeStr.includes('MYSQL') || typeStr.includes('MARIA')) {
    return `\`${identifier.replace(/`/g, '``')}\``;
  }
  if (typeStr.includes('MSSQL') || typeStr.includes('SQL_SERVER') || typeStr === 'SQL') {
    return `[${identifier.replace(/\]/g, ']]')}]`;
  }
  // Standard ANSI & PostgreSQL / SQLite
  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Resolves dynamic criteria / form values in SQL criteria expressions.
 */
function resolveCriteriaExpression(
  crit: string,
  forExecution: boolean,
  context?: Record<string, any>
): string {
  if (!crit) return '';
  let resolved = crit.trim();

  // If starts with Access-style [Forms]![formName]![fieldName]
  const formRefPattern = /\[Forms\]!\[([^\]]+)\]!\[([^\]]+)\]/gi;
  if (forExecution && context) {
    resolved = resolved.replace(formRefPattern, (_match, formName, fieldName) => {
      const key1 = `forms.${formName.toLowerCase()}.${fieldName.toLowerCase()}`;
      if (context[key1] !== undefined) {
        const val = context[key1];
        return typeof val === 'number' ? String(val) : `'${String(val).replace(/'/g, "''")}'`;
      }
      if (context.currentRecord && context.currentRecord[fieldName] !== undefined) {
        const val = context.currentRecord[fieldName];
        return typeof val === 'number' ? String(val) : `'${String(val).replace(/'/g, "''")}'`;
      }
      if (context[fieldName] !== undefined) {
        const val = context[fieldName];
        return typeof val === 'number' ? String(val) : `'${String(val).replace(/'/g, "''")}'`;
      }
      return 'NULL';
    });
  }

  // Format shorthand operators: e.g. "> 50", "= 'Berlin'", "Like '*GmbH*'"
  if (resolved.startsWith('>') || resolved.startsWith('<') || resolved.startsWith('=')) {
    return resolved;
  }

  // Convert Access wildcards * and ? to SQL % and _
  if (/^like\s+/i.test(resolved)) {
    resolved = resolved
      .replace(/\*/g, '%')
      .replace(/\?/g, '_');
    return resolved;
  }

  // If user entered just a bare string or number
  if (/^['"].*['"]$/.test(resolved) || /^-?\d+(\.\d+)?$/.test(resolved)) {
    return `= ${resolved}`;
  }

  // If it doesn't contain comparison operators
  if (!/^(IS|IN|BETWEEN|LIKE|NOT|=|>|<)/i.test(resolved)) {
    // Treat as equality or string match
    return `= '${resolved.replace(/'/g, "''")}'`;
  }

  return resolved;
}

/**
 * Generates a full SQL SELECT statement from Visual Query Designer nodes, columns, and relationships.
 */
export function generateSqlSelect(
  nodes: any[] = [],
  columns: QueryColumn[] = [],
  tables: Table[] = [],
  relationships: Relationship[] = [],
  dbType: DbType | string = DbType.SQLite,
  forExecution: boolean = false,
  context?: Record<string, any>,
  distinct: boolean = false
): string {
  if (!nodes || nodes.length === 0) {
    return 'SELECT 1;';
  }

  // 1. Resolve Table Nodes
  const nodeTableMap = new Map<string, { tableName: string; alias: string }>();
  nodes.forEach((node) => {
    const tableData = node.data || {};
    const tableId = tableData.tableId || node.id;
    const table = tables.find((t) => t.id === tableId || t.name === tableData.name);
    const tableName = table ? table.name : (tableData.name || 'Table1');
    const alias = node.id || tableName;
    nodeTableMap.set(node.id, { tableName, alias });
  });

  const rootNode = nodes[0];
  const rootInfo = nodeTableMap.get(rootNode.id) || {
    tableName: tables[0]?.name || 'Table1',
    alias: rootNode.id,
  };

  // 2. Build SELECT Columns
  const selectItems: string[] = [];
  const groupByItems: string[] = [];
  const orderByItems: string[] = [];
  let hasAggregate = false;

  // Filter columns that should be displayed
  const visibleColumns = columns.filter((col) => col.show !== false);

  if (visibleColumns.length === 0) {
    selectItems.push(`${quoteSqlIdentifier(rootInfo.alias, dbType)}.*`);
  } else {
    visibleColumns.forEach((col) => {
      const nodeInfo = col.nodeId ? nodeTableMap.get(col.nodeId) : null;
      const targetTableOrAlias = nodeInfo ? nodeInfo.alias : col.tableName;
      const quotedCol = `${quoteSqlIdentifier(targetTableOrAlias, dbType)}.${quoteSqlIdentifier(col.fieldName, dbType)}`;

      let itemSql = quotedCol;

      // Handle Expressions vs Aggregates
      if (col.isCalculated && col.expression) {
        itemSql = col.expression;
      } else if (col.aggregate && col.aggregate !== 'GROUP_BY') {
        hasAggregate = true;
        itemSql = `${col.aggregate}(${quotedCol})`;
      } else if (col.aggregate === 'GROUP_BY') {
        hasAggregate = true;
        groupByItems.push(quotedCol);
      }

      if (col.alias && col.alias.trim() && col.alias !== col.fieldName) {
        itemSql += ` AS ${quoteSqlIdentifier(col.alias.trim(), dbType)}`;
      }

      selectItems.push(itemSql);

      // Collect Sort Orders
      if (col.sort === 'ASC' || col.sort === 'DESC') {
        orderByItems.push(`${quotedCol} ${col.sort}`);
      }
    });
  }

  // 3. Build FROM & JOIN Clause
  let fromClause = `${quoteSqlIdentifier(rootInfo.tableName, dbType)} AS ${quoteSqlIdentifier(rootInfo.alias, dbType)}`;

  // Find relationships connecting the current nodes
  const joinedNodeIds = new Set<string>([rootNode.id]);
  const remainingNodes = nodes.slice(1);

  while (remainingNodes.length > 0) {
    let joinedInThisRound = false;

    for (let i = 0; i < remainingNodes.length; i++) {
      const node = remainingNodes[i];
      const nodeInfo = nodeTableMap.get(node.id)!;

      // Check if relationship exists between joinedNodeIds and this node
      const matchingRel = relationships.find((rel) => {
        const fromMatch =
          joinedNodeIds.has(rel.fromTableId) ||
          Array.from(joinedNodeIds).some((id) => nodeTableMap.get(id)?.tableName === rel.fromTableId);
        const toMatch =
          rel.toTableId === node.id ||
          rel.toTableId === nodeInfo.tableName ||
          nodeTableMap.get(node.id)?.tableName === rel.toTableId;
        return (fromMatch && toMatch) || (rel.fromTableId === node.id && joinedNodeIds.has(rel.toTableId));
      });

      if (matchingRel) {
        const sourceAlias = matchingRel.fromTableId;
        const targetAlias = nodeInfo.alias;
        const sourceCol = matchingRel.fromFieldId || 'id';
        const targetCol = matchingRel.toFieldId || 'id';

        fromClause += `\nLEFT JOIN ${quoteSqlIdentifier(nodeInfo.tableName, dbType)} AS ${quoteSqlIdentifier(
          targetAlias,
          dbType
        )} ON ${quoteSqlIdentifier(sourceAlias, dbType)}.${quoteSqlIdentifier(
          sourceCol,
          dbType
        )} = ${quoteSqlIdentifier(targetAlias, dbType)}.${quoteSqlIdentifier(targetCol, dbType)}`;

        joinedNodeIds.add(node.id);
        remainingNodes.splice(i, 1);
        joinedInThisRound = true;
        break;
      }
    }

    if (!joinedInThisRound) {
      // Cross join fallback for unlinked tables
      const fallbackNode = remainingNodes.shift()!;
      const fallbackInfo = nodeTableMap.get(fallbackNode.id)!;
      fromClause += `\nCROSS JOIN ${quoteSqlIdentifier(fallbackInfo.tableName, dbType)} AS ${quoteSqlIdentifier(
        fallbackInfo.alias,
        dbType
      )}`;
      joinedNodeIds.add(fallbackNode.id);
    }
  }

  // 4. Build WHERE Clause
  const whereConditions: string[] = [];
  columns.forEach((col) => {
    if (col.criteria && col.criteria.length > 0) {
      const nodeInfo = col.nodeId ? nodeTableMap.get(col.nodeId) : null;
      const targetTableOrAlias = nodeInfo ? nodeInfo.alias : col.tableName;
      const quotedCol = `${quoteSqlIdentifier(targetTableOrAlias, dbType)}.${quoteSqlIdentifier(col.fieldName, dbType)}`;

      const colCritList = col.criteria
        .filter((c) => Boolean(c && c.trim()))
        .map((c) => {
          const resolvedOpAndVal = resolveCriteriaExpression(c, forExecution, context);
          return `${quotedCol} ${resolvedOpAndVal}`;
        });

      if (colCritList.length > 0) {
        whereConditions.push(`(${colCritList.join(' OR ')})`);
      }
    }
  });

  // 5. Assemble Full SQL Query
  const distinctKeyword = distinct ? 'DISTINCT ' : '';
  let sql = `SELECT ${distinctKeyword}${selectItems.join(', ')}\nFROM ${fromClause}`;

  if (whereConditions.length > 0) {
    sql += `\nWHERE ${whereConditions.join(' AND ')}`;
  }

  if (hasAggregate && groupByItems.length > 0) {
    sql += `\nGROUP BY ${groupByItems.join(', ')}`;
  }

  if (orderByItems.length > 0) {
    sql += `\nORDER BY ${orderByItems.join(', ')}`;
  }

  return sql;
}
