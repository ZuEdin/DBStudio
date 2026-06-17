
import { Table, Relationship, QueryColumn, TableNode, DbType } from '../types/index';
import { quoteIdentifier, toPascalCase } from './generators/common';

export const generateSqlSelect = (nodes: TableNode[], columns: QueryColumn[], tables: Table[], relationships: Relationship[], dbType: DbType): string => {
    if (columns.length === 0 || nodes.length === 0) return '';
    
    // Check if any aggregation is used
    const hasAggregation = columns.some(c => c.aggregate && c.aggregate !== 'GROUP_BY' && c.aggregate !== 'EXPRESSION');
    const groupByColumns = columns.filter(c => c.aggregate === 'GROUP_BY');

    const selectClause = columns.filter(c => c.show).map(c => {
        const alias = c.alias ? toPascalCase(c.alias) : toPascalCase(c.fieldName);
        const quotedAlias = quoteIdentifier(alias, dbType);
        
        let fieldExpr = '';
        
        if (c.isCalculated) {
            fieldExpr = `(${c.expression})`;
        } else {
            fieldExpr = `${quoteIdentifier(toPascalCase(c.tableName), dbType)}.${quoteIdentifier(c.fieldName, dbType)}`;
        }

        // Wrap in Aggregate Function if needed
        if (c.aggregate && c.aggregate !== 'GROUP_BY' && c.aggregate !== 'EXPRESSION' && c.aggregate !== 'FIRST' && c.aggregate !== 'LAST') {
            fieldExpr = `${c.aggregate}(${fieldExpr})`;
        }

        // Use alias if defined, else default name
        return `  ${fieldExpr}${c.alias || hasAggregation ? ` AS ${quotedAlias}` : ''}`;
    }).join(',\n');

    const fromTable = tables.find(t => t.id === nodes[0].tableId);
    if (!fromTable) return '';

    let fromClause = `FROM ${quoteIdentifier(toPascalCase(fromTable.name), dbType)}`;
    const joinedTables = new Set([fromTable.id]);
    let joins = '';
    const queryTableIds = new Set(nodes.map(n => n.tableId));
    const relevantRels = relationships.filter(r => queryTableIds.has(r.fromTableId) && queryTableIds.has(r.toTableId));

    // Simple greedy join strategy
    let madeProgress = true;
    while(madeProgress && joinedTables.size < queryTableIds.size) {
        madeProgress = false;
        for (const rel of relevantRels) {
            const processJoin = (fromTId: string, toTId: string, fromFId: string, toFId: string) => {
                 if (joinedTables.has(fromTId) && !joinedTables.has(toTId)) {
                    const fromT = tables.find(t => t.id === fromTId)!; const fromF = fromT.fields.find(f => f.id === fromFId)!;
                    const toT = tables.find(t => t.id === toTId)!; const toF = toT.fields.find(f => f.id === toFId)!;
                    joins += `\nINNER JOIN ${quoteIdentifier(toPascalCase(toT.name), dbType)} ON ${quoteIdentifier(toPascalCase(fromT.name), dbType)}.${quoteIdentifier(fromF.name, dbType)} = ${quoteIdentifier(toPascalCase(toT.name), dbType)}.${quoteIdentifier(toF.name, dbType)}`;
                    joinedTables.add(toTId);
                    madeProgress = true;
                }
            }
            processJoin(rel.fromTableId, rel.toTableId, rel.fromFieldId, rel.toFieldId);
            processJoin(rel.toTableId, rel.fromTableId, rel.toFieldId, rel.fromFieldId);
        }
    }
    
    const whereConditions = columns
      .map(c => {
        // Only include criteria for fields that are EITHER:
        // 1. Not aggregated (standard WHERE)
        // 2. Part of GROUP BY (standard WHERE)
        // Note: HAVING clause for aggregated fields (e.g. SUM(x) > 100) is omitted for simplicity in this version, 
        // as the UI doesn't separate WHERE vs HAVING yet. We treat criteria as Pre-Aggregation filter (WHERE) by default.
        
        if (c.aggregate && c.aggregate !== 'GROUP_BY' && c.aggregate !== 'EXPRESSION') return null;

        const validCriteria = c.criteria.filter(crit => crit.trim() !== '');
        if (validCriteria.length === 0) return null;
        
        const fieldRef = c.isCalculated ? `(${c.expression})` : `${quoteIdentifier(toPascalCase(c.tableName), dbType)}.${quoteIdentifier(c.fieldName, dbType)}`;
        
        const conditions = validCriteria.map(crit => {
            let criteria = crit.trim();
            if (criteria.includes('"')) criteria = criteria.replace(/"/g, "'");
            if (criteria.includes('TODAY')) {
                const todaySql = dbType === DbType.SQL ? "CAST(GETDATE() AS DATE)" : (dbType === DbType.SQLite ? "DATE('now')" : "CURDATE()");
                criteria = criteria.replace(/TODAY/g, todaySql);
            }
            if (criteria.toUpperCase() === 'NULL') return `${fieldRef} IS NULL`;
            if (criteria.toUpperCase() === 'NOT NULL') return `${fieldRef} IS NOT NULL`;
            if (criteria.toUpperCase() === 'IS NULL' || criteria.toUpperCase() === 'IS NOT NULL') return `${fieldRef} ${criteria}`;
            return `${fieldRef} ${criteria}`; 
        });
        return conditions.length > 1 ? `(${conditions.join(' OR ')})` : conditions[0];
      }).filter(Boolean);

    let whereClause = '';
    if (whereConditions.length > 0) whereClause = `\nWHERE\n  ${whereConditions.join('\n  AND ')}`;
    
    let groupByClause = '';
    if (hasAggregation && groupByColumns.length > 0) {
        const groups = groupByColumns.map(c => {
            if (c.isCalculated) return `(${c.expression})`;
            return `${quoteIdentifier(toPascalCase(c.tableName), dbType)}.${quoteIdentifier(c.fieldName, dbType)}`;
        }).join(', ');
        groupByClause = `\nGROUP BY ${groups}`;
    }

    // ORDER BY
    const orderByCols = columns.filter(c => c.sort).map(c => {
        // Use Alias if available in ORDER BY for cleaner SQL, or expression
        const ref = c.alias ? quoteIdentifier(toPascalCase(c.alias), dbType) : (
            c.isCalculated ? `(${c.expression})` : `${quoteIdentifier(toPascalCase(c.tableName), dbType)}.${quoteIdentifier(c.fieldName, dbType)}`
        );
        return `${ref} ${c.sort}`;
    }).join(', ');
    
    const orderByClause = orderByCols ? `\nORDER BY ${orderByCols}` : '';
    
    return `SELECT\n${selectClause || '  *'}\n${fromClause}${joins}${whereClause}${groupByClause}${orderByClause}`;
};
