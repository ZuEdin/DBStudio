import { DbType, QueryColumn, Table, Relationship } from '../types/index';
import { toPascalCase } from './generators/common';

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
  distinct: boolean = false,
  usePascalCaseTableNames: boolean = false
): string {
  if (!nodes || nodes.length === 0) {
    return 'SELECT 1;';
  }

  // 1. Resolve Table Nodes
  const nodeTableMap = new Map<string, { tableName: string; alias: string; table?: Table; nodeId: string }>();
  nodes.forEach((node) => {
    const tableData = node.data || {};
    const tableId = node.tableId || tableData.tableId || (typeof node.id === 'string' && tables.some(t => t.id === node.id) ? node.id : undefined);
    const nodeTableName = (node as any).tableName || (node as any).name || tableData.name || tableData.tableName;
    const table = tables.find((t) => 
      (tableId && t.id === tableId) || 
      (nodeTableName && t.name.toLowerCase() === nodeTableName.toLowerCase()) || 
      t.id === node.id ||
      t.name.toLowerCase() === String(node.id).toLowerCase()
    );
    const resolvedName = table ? table.name : (nodeTableName || (tables.length > 0 ? tables[0].name : 'Table1'));
    const tableName = usePascalCaseTableNames ? toPascalCase(resolvedName) : resolvedName;
    const alias = node.id || tableName;
    nodeTableMap.set(node.id, { tableName, alias, table, nodeId: node.id });
  });

  const rootNode = nodes[0];
  const defaultRootName = tables[0]?.name || 'Table1';
  const rootInfo = nodeTableMap.get(rootNode.id) || {
    tableName: usePascalCaseTableNames ? toPascalCase(defaultRootName) : defaultRootName,
    alias: rootNode.id,
    table: tables[0],
    nodeId: rootNode.id
  };

  /**
   * Helper to resolve any column to its corresponding node alias in the query graph.
   */
  const resolveColumnNode = (col: QueryColumn): { tableName: string; alias: string; table?: Table; nodeId: string } => {
    // 1. Direct match by nodeId
    if (col.nodeId && nodeTableMap.has(col.nodeId)) {
      return nodeTableMap.get(col.nodeId)!;
    }

    // 2. Match by tableId in nodes or tables
    if (col.tableId) {
      for (const [_, info] of nodeTableMap) {
        if (
          info.nodeId === col.tableId ||
          (info.table && info.table.id === col.tableId)
        ) {
          return info;
        }
      }
    }

    // 3. Match by tableName (exact, case-insensitive, or pascalCase)
    if (col.tableName) {
      const lowerColTableName = col.tableName.trim().toLowerCase();
      const pascalColTableName = toPascalCase(col.tableName).toLowerCase();
      for (const [_, info] of nodeTableMap) {
        if (
          info.tableName.toLowerCase() === lowerColTableName ||
          info.tableName.toLowerCase() === pascalColTableName ||
          (info.table && info.table.name.toLowerCase() === lowerColTableName) ||
          info.alias.toLowerCase() === lowerColTableName
        ) {
          return info;
        }
      }
    }

    // 4. Match by fieldId or fieldName in node's table
    for (const [_, info] of nodeTableMap) {
      if (info.table?.fields) {
        const hasField = info.table.fields.some(
          (f) =>
            (col.fieldId && f.id === col.fieldId) ||
            (col.fieldName && f.name.toLowerCase() === col.fieldName.toLowerCase())
        );
        if (hasField) {
          return info;
        }
      }
    }

    // 5. Fallback to root node
    return rootInfo;
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
      const nodeInfo = resolveColumnNode(col);
      const targetTableOrAlias = nodeInfo.alias;
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

      const effectiveAlias = col.alias && col.alias.trim() ? col.alias.trim() : col.fieldName;
      itemSql += ` AS ${quoteSqlIdentifier(effectiveAlias, dbType)}`;

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
      let matchedRel: Relationship | null = null;
      let matchedSourceNodeId: string | null = null;
      let isReversed = false;

      for (const joinedId of Array.from(joinedNodeIds)) {
        const sourceInfo = nodeTableMap.get(joinedId);
        const rel = relationships.find(r => {
          const fromMatchesSource = r.fromTableId === joinedId || (sourceInfo?.table && r.fromTableId === sourceInfo.table.id) || r.fromTableId === sourceInfo?.tableName;
          const toMatchesTarget = r.toTableId === node.id || (nodeInfo?.table && r.toTableId === nodeInfo.table.id) || r.toTableId === nodeInfo?.tableName;
          if (fromMatchesSource && toMatchesTarget) {
            isReversed = false;
            return true;
          }
          const fromMatchesTarget = r.fromTableId === node.id || (nodeInfo?.table && r.fromTableId === nodeInfo.table.id) || r.fromTableId === nodeInfo?.tableName;
          const toMatchesSource = r.toTableId === joinedId || (sourceInfo?.table && r.toTableId === sourceInfo.table.id) || r.toTableId === sourceInfo?.tableName;
          if (fromMatchesTarget && toMatchesSource) {
            isReversed = true;
            return true;
          }
          return false;
        });

        if (rel) {
          matchedRel = rel;
          matchedSourceNodeId = joinedId;
          break;
        }
      }

      if (matchedRel && matchedSourceNodeId) {
        const sourceInfo = nodeTableMap.get(matchedSourceNodeId)!;
        const sourceAlias = sourceInfo.alias;
        const targetAlias = nodeInfo.alias;

        // Resolve field IDs to actual column names
        const relFromFieldId = isReversed ? matchedRel.toFieldId : matchedRel.fromFieldId;
        const relToFieldId = isReversed ? matchedRel.fromFieldId : matchedRel.toFieldId;

        const sourceField = sourceInfo.table?.fields.find(f => f.id === relFromFieldId || f.name === relFromFieldId);
        const targetField = nodeInfo.table?.fields.find(f => f.id === relToFieldId || f.name === relToFieldId);

        const sourceCol = sourceField?.name || relFromFieldId || 'id';
        const targetCol = targetField?.name || relToFieldId || 'id';

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
      const nodeInfo = resolveColumnNode(col);
      const targetTableOrAlias = nodeInfo.alias;
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
