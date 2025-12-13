
import { Table, Relationship, QueryColumn, TableNode } from '../types/index';

export const generateSqlSelect = (nodes: TableNode[], columns: QueryColumn[], tables: Table[], relationships: Relationship[]): string => {
    if (columns.length === 0 || nodes.length === 0) return '';
    
    const selectClause = columns.filter(c => c.show).map(c => {
        if (c.isCalculated) return `  (${c.expression}) AS ${c.alias || c.fieldName}`;
        // Use alias if defined, else default name
        return `  ${c.tableName}.${c.fieldName}${c.alias ? ` AS ${c.alias}` : ''}`;
    }).join(',\n');

    const fromTable = tables.find(t => t.id === nodes[0].tableId);
    if (!fromTable) return '';

    let fromClause = `FROM ${fromTable.name}`;
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
                    joins += `\nINNER JOIN ${toT.name} ON ${fromT.name}.${fromF.name} = ${toT.name}.${toF.name}`;
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
        const validCriteria = c.criteria.filter(crit => crit.trim() !== '');
        if (validCriteria.length === 0) return null;
        
        // Handling calculated fields in WHERE usually requires wrapping the query or repeating expression
        // For simplicity in this generator, we repeat expression or field name
        const fieldRef = c.isCalculated ? `(${c.expression})` : `${c.tableName}.${c.fieldName}`;
        
        const conditions = validCriteria.map(crit => {
            if (crit.toUpperCase() === 'IS NULL' || crit.toUpperCase() === 'IS NOT NULL') return `${fieldRef} ${crit}`;
            return `${fieldRef} ${crit}`; // Basic append (e.g. "> 5")
        });
        return conditions.length > 1 ? `(${conditions.join(' OR ')})` : conditions[0];
      }).filter(Boolean);

    let whereClause = '';
    if (whereConditions.length > 0) whereClause = `\nWHERE\n  ${whereConditions.join('\n  AND ')}`;
    
    return `SELECT\n${selectClause || '  *'}\n${fromClause}${joins}${whereClause}`;
};
