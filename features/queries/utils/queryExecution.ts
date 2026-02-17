
import { Query, Table, Relationship, SelectQuery, QueryColumn } from '../../types/index';

// Helper to evaluate criteria
const matchesCriteria = (value: any, criteria: string): boolean => {
  if (!criteria) return true; 
  const crit = criteria.trim().toLowerCase();
  if (crit === '') return true;

  const strValue = String(value !== null && value !== undefined ? value : '').toLowerCase();
  
  // DATE LOGIC
  // Resolve Keywords
  let targetDate = new Date();
  let isDateComparison = false;
  let operator = '=';
  let compareVal = crit;

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
      // Check for explicit date strings (basic ISO or german)
      // Remove operators to parse date
      const cleanDateStr = crit.replace(/(>=|<=|>|<|=)/, '').trim();
      if (cleanDateStr.match(/^\d{4}-\d{2}-\d{2}$/) || cleanDateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
          isDateComparison = true;
          // Normalize german to iso for parsing
          const iso = cleanDateStr.includes('.') ? cleanDateStr.split('.').reverse().join('-') : cleanDateStr;
          targetDate = new Date(iso);
          targetDate.setHours(0,0,0,0);
      }
  }

  if (isDateComparison) {
      // Determine operator
      if (crit.startsWith('>=')) operator = '>=';
      else if (crit.startsWith('<=')) operator = '<=';
      else if (crit.startsWith('>')) operator = '>';
      else if (crit.startsWith('<')) operator = '<';
      
      // Parse Value (Handle Timestamp or String)
      let valDate = new Date();
      if (typeof value === 'number') {
          valDate = new Date(value > 10000000000 ? value : value * 1000);
      } else {
          valDate = new Date(value);
      }
      
      if (isNaN(valDate.getTime())) return false; // Invalid date value
      valDate.setHours(0,0,0,0); // Compare dates only

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

  // Handle IS NULL / IS NOT NULL / NULL
  if (crit === 'is null' || crit === 'null') {
      return value === null || value === undefined || value === '' || String(value).trim() === '';
  }
  if (crit === 'is not null' || crit === 'not null') {
      return value !== null && value !== undefined && value !== '' && String(value).trim() !== '';
  }

  // Between
  if (crit.startsWith('zwischen') || crit.includes(' and ')) {
    const parts = crit.replace('zwischen', '').split('und');
    if (parts.length === 2) {
      const min = parseFloat(parts[0].trim());
      const max = parseFloat(parts[1].trim());
      const numVal = parseFloat(value);
      return !isNaN(numVal) && !isNaN(min) && !isNaN(max) && numVal >= min && numVal <= max;
    }
  }

  // Standard Operators
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

  // Like
  if (crit.startsWith('wie') || crit.includes('*') || crit.includes('%')) {
    const pattern = crit.replace('wie', '').trim().replace(/\*/g, '.*').replace(/%/g, '.*');
    try {
      const regex = new RegExp(`^${pattern}$`, 'i');
      return regex.test(strValue);
    } catch (e) { return false; } 
  }

  // Exact match (default)
  if ((crit.startsWith('"') && crit.endsWith('"')) || (crit.startsWith("'") && crit.endsWith("'"))) {
    return strValue === crit.substring(1, crit.length - 1).toLowerCase();
  }
  
  // Numeric compare if possible
  if (!isNaN(Number(crit)) && !isNaN(Number(value))) {
      return Number(value) === Number(crit);
  }

  return strValue === crit;
};

// Helper to resolve calculated fields
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

    query.columns.filter(c => c.isCalculated && c.expression).forEach(col => {
        workingData.forEach(row => {
            row[`CALC_${col.id}`] = resolveExpression(row, col.expression!);
        });
    });

    let filteredData = workingData.filter(row => {
        for (const col of query.columns) {
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

    const hasAggregation = query.columns.some(c => c.aggregate && c.aggregate !== 'EXPRESSION');
    if (hasAggregation) {
        const groups: Record<string, any[]> = {};
        const groupByCols = query.columns.filter(c => c.aggregate === 'GROUP_BY');
        
        filteredData.forEach(row => {
            const groupKey = groupByCols.map(c => {
                 return c.isCalculated ? row[`CALC_${c.id}`] : row[`${c.tableName}.${c.fieldName}`];
            }).join('|||');
            
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(row);
        });

        filteredData = Object.values(groups).map(groupRows => {
            const resultRow: Record<string, any> = {};
            query.columns.forEach(col => {
                const key = col.isCalculated ? `CALC_${col.id}` : `${col.tableName}.${col.fieldName}`;
                
                if (col.aggregate === 'GROUP_BY') {
                    resultRow[key] = groupRows[0][key];
                } else if (col.aggregate === 'COUNT') {
                    resultRow[key] = groupRows.length;
                } else if (col.aggregate === 'SUM') {
                    resultRow[key] = groupRows.reduce((sum, r) => sum + (parseFloat(r[key]) || 0), 0);
                } else if (col.aggregate === 'AVG') {
                    const sum = groupRows.reduce((s, r) => s + (parseFloat(r[key]) || 0), 0);
                    resultRow[key] = groupRows.length ? sum / groupRows.length : 0;
                } else if (col.aggregate === 'MIN') {
                    resultRow[key] = groupRows.reduce((min, r) => (r[key] < min ? r[key] : min), groupRows[0][key]);
                } else if (col.aggregate === 'MAX') {
                    resultRow[key] = groupRows.reduce((max, r) => (r[key] > max ? r[key] : max), groupRows[0][key]);
                } else {
                     resultRow[key] = groupRows[0][key]; 
                }
            });
            return resultRow;
        });
    }

    if (query.columns.some(c => c.sort)) {
        filteredData.sort((a, b) => {
            for (const col of query.columns) {
                if (col.sort) {
                    const key = col.isCalculated ? `CALC_${col.id}` : `${col.tableName}.${col.fieldName}`;
                    const valA = a[key]; 
                    const valB = b[key];
                    const direction = col.sort.toUpperCase() === 'DESC' ? -1 : 1;
                    if (valA < valB) return -1 * direction;
                    if (valA > valB) return 1 * direction;
                }
            }
            return 0;
        });
    }

    const finalData = filteredData.map(row => {
        const newRow: Record<string, any> = {};
        query.columns.filter(c => c.show).forEach(col => {
           const sourceKey = col.isCalculated ? `CALC_${col.id}` : `${col.tableName}.${col.fieldName}`;
           const outputKey = col.alias && col.alias.trim() !== '' ? col.alias : col.fieldName;
           newRow[outputKey] = row[sourceKey];
        });
        return newRow;
    });

    return finalData;
};
