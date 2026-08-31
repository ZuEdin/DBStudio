/**
 * Automatic Index Advisor & Missing Index Hints Engine
 * Analyzes query structure (WHERE, JOIN, ORDER BY) to recommend missing database indexes.
 */

import { SelectQuery, Table, Relationship } from '../../../types/index';

export interface IndexRecommendation {
  id: string;
  tableName: string;
  suggestedIndexName: string;
  columns: string[];
  reason: string;
  estimatedPerformanceGainPercent: number;
  sqlCommand: string;
}

export const analyzeQueryIndexes = (
  selectQuery: SelectQuery,
  tables: Table[],
  relationships: Relationship[]
): IndexRecommendation[] => {
  const recommendations: IndexRecommendation[] = [];

  if (!selectQuery || selectQuery.nodes.length === 0) return recommendations;

  // 1. Analyze JOIN conditions
  selectQuery.nodes.forEach((node) => {
    const table = tables.find((t) => t.id === node.tableId);
    if (!table) return;

    // Check relationship columns
    const rels = relationships.filter((r) => r.fromTableId === table.id || r.toTableId === table.id);
    rels.forEach((r) => {
      const fieldId = r.fromTableId === table.id ? r.fromFieldId : r.toFieldId;
      const field = table.fields.find((f) => f.id === fieldId || f.name === fieldId);

      if (field && !field.isPrimaryKey && !field.isForeignKey) {
        const idxName = `idx_${table.name.toLowerCase()}_${field.name.toLowerCase()}`;
        recommendations.push({
          id: crypto.randomUUID(),
          tableName: table.name,
          suggestedIndexName: idxName,
          columns: [field.name],
          reason: `JOIN-Spalte '${field.name}' in Beziehung mit Fremdtabelle beschleunigen.`,
          estimatedPerformanceGainPercent: 65,
          sqlCommand: `CREATE INDEX ${idxName} ON "${table.name}" ("${field.name}");`,
        });
      }
    });

    // 2. Analyze WHERE criteria columns
    const filteredCols = selectQuery.columns.filter(
      (c) => (c.tableId === table.id || c.tableName === table.name) && c.criteria.some((cr) => cr && cr.trim() !== '')
    );

    if (filteredCols.length > 0) {
      const colNames = filteredCols.map((c) => c.fieldName);
      const idxName = `idx_${table.name.toLowerCase()}_filter_${colNames.join('_').toLowerCase()}`;
      recommendations.push({
        id: crypto.randomUUID(),
        tableName: table.name,
        suggestedIndexName: idxName,
        columns: colNames,
        reason: `WHERE-Filter auf Spalten (${colNames.join(', ')}) vermeiden Full Table Scans.`,
        estimatedPerformanceGainPercent: 85,
        sqlCommand: `CREATE INDEX ${idxName} ON "${table.name}" (${colNames.map((n) => `"${n}"`).join(', ')});`,
      });
    }

    // 3. Analyze ORDER BY columns
    const sortedCols = selectQuery.columns.filter(
      (c) => (c.tableId === table.id || c.tableName === table.name) && Boolean(c.sort)
    );

    if (sortedCols.length > 0) {
      const colNames = sortedCols.map((c) => `${c.fieldName} ${c.sort}`);
      const idxName = `idx_${table.name.toLowerCase()}_sort`;
      recommendations.push({
        id: crypto.randomUUID(),
        tableName: table.name,
        suggestedIndexName: idxName,
        columns: sortedCols.map((c) => c.fieldName),
        reason: `Sortierung ORDER BY (${colNames.join(', ')}) durch vorbereiteten Index beschleunigen.`,
        estimatedPerformanceGainPercent: 40,
        sqlCommand: `CREATE INDEX ${idxName} ON "${table.name}" (${sortedCols.map((c) => `"${c.fieldName}" ${c.sort}`).join(', ')});`,
      });
    }
  });

  return recommendations;
};
