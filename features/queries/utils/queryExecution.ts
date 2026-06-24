
import { Query, Table, Relationship, SelectQuery, QueryColumn } from '../../types/index';

// Helper to evaluate criteria
const matchesCriteria = (value: any, criteria: string): boolean => {
  if (!criteria) return true; 
  const crit = criteria.trim().toLowerCase();
  if (crit === '') return true;

  const strValue = String(value !== null && value !== undefined ? value : '').toLowerCase();
  
  // DATE LOGIC
  let targetDate = new Date();
  let isDateComparison = false;
  let operator = '=';

  // Check for keywords
  if (crit.includes('today') || crit.includes('heute')) {
      isDateComparison = true;
      targetDate.setHours(0,0,0,0);
  } else if (crit.includes('yesterday') || crit.includes('gestern')) {
      isDateComparison = true;
      targetDate.setDate(targetDate.getDate() - 1);
      targetDate.setHours(0,0,0,0);
  } else if (crit.includes('tomorrow') || crit.includes('morgen')) {
      isDateComparison = true;
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(0,0,0,0);
  } else {
      const cleanDateStr = crit.replace(/(>=|<=|>|<|=)/, '').trim();
      if (cleanDateStr.match(/^\d{4}-\d{2}-\d{2}$/) || cleanDateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
          isDateComparison = true;
          const iso = cleanDateStr.includes('.') ? cleanDateStr.split('.').reverse().join('-') : cleanDateStr;
          targetDate = new Date(iso);
          targetDate.setHours(0,0,0,0);
      }
  }

  if (isDateComparison) {
      if (crit.startsWith('>=')) operator = '>=';
      else if (crit.startsWith('<=')) operator = '<=';
      else if (crit.startsWith('>')) operator = '>';
      else if (crit.startsWith('<')) operator = '<';
      
      let valDate = new Date();
      if (typeof value === 'number') {
          valDate = new Date(value > 10000000000 ? value : value * 1000);
      } else {
          valDate = new Date(value);
      }
      
      if (isNaN(valDate.getTime())) return false;
      valDate.setHours(0,0,0,0);

      const t1 = valDate.getTime();
      const t2 = targetDate.getTime();

      switch(operator) {
          case '>': return t1 > t2;
          case '<': return t1 < t2;
          case '>=': return t1 >= t2;
          case '<=': return t1 <= t2;
          default: return t1 === t2;
      }
  }

  if (crit === 'is null' || crit === 'null') {
      return value === null || value === undefined || value === '' || String(value).trim() === '';
  }
  if (crit === 'is not null' || crit === 'not null') {
      return value !== null && value !== undefined && value !== '' && String(value).trim() !== '';
  }

  if (crit.startsWith('zwischen') || crit.includes(' and ')) {
    const parts = crit.replace('zwischen', '').split('und');
    if (parts.length === 2) {
      const min = parseFloat(parts[0].trim());
      const max = parseFloat(parts[1].trim());
      const numVal = parseFloat(value);
      return !isNaN(numVal) && !isNaN(min) && !isNaN(max) && numVal >= min && numVal <= max;
    }
  }

  if (crit.startsWith('>=')) return parseFloat(value) >= parseFloat(crit.substring(2).trim());
  if (crit.startsWith('<=')) return parseFloat(value) <= parseFloat(crit.substring(2).trim());
  if (crit.startsWith('>')) return parseFloat(value) > parseFloat(crit.substring(1).trim());
  if (crit.startsWith('<')) return parseFloat(value) < parseFloat(crit.substring(1).trim());
  if (crit.startsWith('!=')) return String(value) != crit.substring(2).trim();
  if (crit.startsWith('=')) {
      const target = crit.substring(1).trim();
      if (target === '""' || target === "''") return strValue === '';
      return strValue == target.replace(/^["']|["']$/g, '').toLowerCase();
  }

  if (crit.startsWith('wie') || crit.includes('*') || crit.includes('%')) {
    const pattern = crit.replace('wie', '').trim().replace(/\*/g, '.*').replace(/%/g, '.*');
    try {
      const regex = new RegExp(`^${pattern}$`, 'i');
      return regex.test(strValue);
    } catch (e) { return false; } 
  }

  if ((crit.startsWith('"') && crit.endsWith('"')) || (crit.startsWith("'") && crit.endsWith("'"))) {
    return strValue === crit.substring(1, crit.length - 1).toLowerCase();
  }
  
  if (!isNaN(Number(crit)) && !isNaN(Number(value))) {
      return Number(value) === Number(crit);
  }

  return strValue === crit;
};

const resolveExpression = (row: Record<string, any>, expression: string): any => {
  if (!expression) return null;
  let result = expression;
  const matches = expression.match(/\{\{([^}]+)\}\}/g);
  if (matches) {
    matches.forEach(match => {
      const key = match.substring(2, match.length - 2).trim(); // remove {{ }}
      const val = row[key] !== undefined ? row[key] : '';
      result = result.replace(match, String(val));
    });
  }
  try {
      if (result.includes('&')) {
          const parts = result.split('&').map(p => {
              p = p.trim();
              if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) {
                  return p.substring(1, p.length - 1);
              }
              return p; 
          });
          return parts.join('');
      }
      return result;
  } catch (e) {
      return "#ERROR";
  }
};

export const executeSelectQuery = (query: SelectQuery, tables: Table[], relationships: Relationship[]): Record<string, any>[] => {
    if (query.nodes.length === 0 || query.columns.length === 0) return [];

    // 1. Prepare Data (Cartesian Product / Join)
    let workingData: Record<string, any>[] = [];
    const queryTableIds = new Set(query.nodes.map(n => n.tableId));
    const initialTableId = query.nodes[0].tableId;
    const initialTable = tables.find(t => t.id === initialTableId);
    
    if (!initialTable || !initialTable.data) return [];

    workingData = initialTable.data.map(row => {
        const newRow: Record<string, any> = {};
        for (const key in row) { newRow[`${initialTable.name}.${key}`] = row[key]; }
        return newRow;
    });
    
    const joinedTables = new Set([initialTableId]);
    const relevantRels = relationships.filter(r => queryTableIds.has(r.fromTableId) && queryTableIds.has(r.toTableId));

    let progress = true;
    while(progress) {
        progress = false;
        for (const rel of relevantRels) {
            const join = (t1Id: string, t2Id: string, f1Id: string, f2Id: string) => {
                if (joinedTables.has(t1Id) && !joinedTables.has(t2Id)) {
                    const table1 = tables.find(t => t.id === t1Id)!;
                    const table2 = tables.find(t => t.id === t2Id)!;
                    if (!table2.data) return;
                    
                    const field1 = table1.fields.find(f => f.id === f1Id)!;
                    const field2 = table2.fields.find(f => f.id === f2Id)!;
                    
                    const newData: Record<string, any>[] = [];
                    workingData.forEach(row1 => {
                        table2.data!.forEach(row2 => {
                            if (String(row1[`${table1.name}.${field1.name}`]) === String(row2[field2.name])) {
                                const newRow = {...row1};
                                for (const key in row2) { newRow[`${table2.name}.${key}`] = row2[key]; }
                                newData.push(newRow);
                            }
                        });
                    });
                    workingData = newData;
                    joinedTables.add(t2Id);
                    progress = true;
                }
            };
            join(rel.fromTableId, rel.toTableId, rel.fromFieldId, rel.toFieldId);
            join(rel.toTableId, rel.fromTableId, rel.toFieldId, rel.fromFieldId);
        }
    }

    // 2. Add Calculated Fields (Pre-Aggregation)
    query.columns.filter(c => c.isCalculated && c.expression).forEach(col => {
        workingData.forEach(row => {
            row[`CALC_${col.id}`] = resolveExpression(row, col.expression!);
        });
    });

    // 3. Filter (WHERE)
    let filteredData = workingData.filter(row => {
        for (const col of query.columns) {
            // Apply filter only if column is part of Group By OR there is no aggregation
            // We do a simplified approach: Filter applied before aggregation
            if (col.aggregate && col.aggregate !== 'GROUP_BY' && col.aggregate !== 'EXPRESSION') continue;

            const validCriteria = col.criteria.filter(c => c && c.trim() !== '');
            if (validCriteria.length > 0) {
                let cellValue;
                if (col.isCalculated) {
                    cellValue = row[`CALC_${col.id}`];
                } else {
                    cellValue = row[`${col.tableName}.${col.fieldName}`];
                }

                const orConditionsMet = validCriteria.some(crit => matchesCriteria(cellValue, crit));
                if (!orConditionsMet) return false;
            }
        }
        return true;
    });

    // 4. Aggregation / Grouping
    const hasAggregation = query.columns.some(c => c.aggregate && c.aggregate !== 'EXPRESSION' && c.aggregate !== 'GROUP_BY'); // Fix check logic
    // Check strict: If ANY aggregate function exists (Sum, Count), we must group.
    const strictAggregation = query.columns.some(c => ['SUM','COUNT','AVG','MIN','MAX'].includes(c.aggregate || ''));

    if (strictAggregation) {
        const groups: Record<string, any[]> = {};
        const groupByCols = query.columns.filter(c => c.aggregate === 'GROUP_BY');
        
        filteredData.forEach(row => {
            // If no group by columns, everything is one group
            const groupKey = groupByCols.length > 0 ? groupByCols.map(c => {
                 return c.isCalculated ? row[`CALC_${c.id}`] : row[`${c.tableName}.${c.fieldName}`];
            }).join('|||') : 'ALL';
            
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(row);
        });

        filteredData = Object.values(groups).map(groupRows => {
            const resultRow: Record<string, any> = {};
            query.columns.forEach(col => {
                const key = col.isCalculated ? `CALC_${col.id}` : `${col.tableName}.${col.fieldName}`;
                const outputKey = key; // Keep internal key structure for now, map to alias later

                if (col.aggregate === 'GROUP_BY') {
                    resultRow[key] = groupRows[0][key];
                } else if (col.aggregate === 'COUNT') {
                    resultRow[key] = groupRows.length;
                } else if (col.aggregate === 'SUM') {
                    resultRow[key] = groupRows.reduce((sum, r) => sum + (parseFloat(r[key]) || 0), 0);
                } else if (col.aggregate === 'AVG') {
                    const sum = groupRows.reduce((s, r) => s + (parseFloat(r[key]) || 0), 0);
                    resultRow[key] = groupRows.length ? Number((sum / groupRows.length).toFixed(2)) : 0;
                } else if (col.aggregate === 'MIN') {
                    resultRow[key] = groupRows.reduce((min, r) => (r[key] < min ? r[key] : min), groupRows[0][key]);
                } else if (col.aggregate === 'MAX') {
                    resultRow[key] = groupRows.reduce((max, r) => (r[key] > max ? r[key] : max), groupRows[0][key]);
                } else if (col.aggregate === 'FIRST') {
                    resultRow[key] = groupRows[0][key];
                } else if (col.aggregate === 'LAST') {
                    resultRow[key] = groupRows[groupRows.length - 1][key];
                } else {
                     // Non-aggregated field in a Group By query - technically invalid SQL usually, 
                     // but in local engine we just pick first value
                     resultRow[key] = groupRows[0][key]; 
                }
            });
            return resultRow;
        });
    }

    // 5. Sorting
    if (query.columns.some(c => c.sort)) {
        filteredData.sort((a, b) => {
            for (const col of query.columns) {
                if (col.sort) {
                    const key = col.isCalculated ? `CALC_${col.id}` : `${col.tableName}.${col.fieldName}`;
                    const valA = a[key]; 
                    const valB = b[key];
                    
                    if (valA === valB) continue;

                    const direction = col.sort.toUpperCase() === 'DESC' ? -1 : 1;
                    
                    // Numeric Sort
                    if (!isNaN(Number(valA)) && !isNaN(Number(valB))) {
                        return (Number(valA) - Number(valB)) * direction;
                    }
                    // String Sort
                    if (valA < valB) return -1 * direction;
                    if (valA > valB) return 1 * direction;
                }
            }
            return 0;
        });
    }

    // 6. Projection (Aliases)
    const finalData = filteredData.map(row => {
        const newRow: Record<string, any> = {};
        const usedKeys = new Set<string>();
        query.columns.filter(c => c.show).forEach(col => {
           const sourceKey = col.isCalculated ? `CALC_${col.id}` : `${col.tableName}.${col.fieldName}`;
           let outputKey = col.alias && col.alias.trim() !== '' ? col.alias : col.fieldName;
           
           if (usedKeys.has(outputKey)) {
               if (!col.alias || col.alias.trim() === '') {
                   outputKey = `${col.tableName}_${col.fieldName}`;
               }
               let suffix = 1;
               let originalKey = outputKey;
               while (usedKeys.has(outputKey)) {
                   outputKey = `${originalKey}_${suffix}`;
                   suffix++;
               }
           }
           usedKeys.add(outputKey);
           newRow[outputKey] = row[sourceKey];
        });
        return newRow;
    });

    return finalData;
};
