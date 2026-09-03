import React, { useState, useMemo } from 'react';
import { Table, QueryColumn, SelectQuery, Relationship } from '../../../types/index';
import { 
  Play, 
  RefreshCw, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Database, 
  AlertCircle,
  Search,
  Maximize2
} from 'lucide-react';

interface LiveQueryDataPreviewProps {
  selectQuery: SelectQuery;
  tables: Table[];
  relationships: Relationship[];
  generatedSql: string;
}

export const LiveQueryDataPreview: React.FC<LiveQueryDataPreviewProps> = ({
  selectQuery,
  tables,
  relationships,
  generatedSql,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Compute live filtered and projected data
  const { previewRows, columns, executionTimeMs, totalMatchingCount, error } = useMemo(() => {
    const startTime = performance.now();
    try {
      const activeColumns = (selectQuery.columns || []).filter(c => c.show !== false);
      if (activeColumns.length === 0 || !selectQuery.nodes || selectQuery.nodes.length === 0) {
        return {
          previewRows: [],
          columns: [],
          executionTimeMs: 0,
          totalMatchingCount: 0,
          error: 'Keine Spalten oder Quelltabellen ausgewählt.'
        };
      }

      // Collect primary source table
      const primaryNode = selectQuery.nodes[0];
      const primaryTable = tables.find(t => t.id === primaryNode.tableId);
      if (!primaryTable || !primaryTable.data) {
        return {
          previewRows: [],
          columns: activeColumns.map(c => c.alias || c.fieldName),
          executionTimeMs: 0,
          totalMatchingCount: 0,
          error: 'Quelltabelle enthält noch keine Daten.'
        };
      }

      // Build join records if multiple tables are present
      let joinedData: Record<string, any>[] = primaryTable.data.map(r => ({ ...r }));

      if (selectQuery.nodes.length > 1) {
        for (let i = 1; i < selectQuery.nodes.length; i++) {
          const joinNode = selectQuery.nodes[i];
          const joinTable = tables.find(t => t.id === joinNode.tableId);
          if (!joinTable || !joinTable.data) continue;

          // Find relationship between primary or previous nodes and this join table
          const rel = relationships.find(
            r =>
              (r.fromTableId === primaryTable.id && r.toTableId === joinTable.id) ||
              (r.toTableId === primaryTable.id && r.fromTableId === joinTable.id)
          );

          if (rel) {
            const isFromPrimary = rel.fromTableId === primaryTable.id;
            const primaryField = (isFromPrimary ? primaryTable.fields.find(f => f.id === rel.fromFieldId) : primaryTable.fields.find(f => f.id === rel.toFieldId))?.name || 'id';
            const joinField = (isFromPrimary ? joinTable.fields.find(f => f.id === rel.toFieldId) : joinTable.fields.find(f => f.id === rel.fromFieldId))?.name || 'id';

            joinedData = joinedData.map(row => {
              const pVal = row[primaryField];
              const match = joinTable.data.find(jr => String(jr[joinField]) === String(pVal));
              return match ? { ...row, ...match } : row;
            });
          }
        }
      }

      // Evaluate criteria (filter)
      const filtered = joinedData.filter(row => {
        for (const col of selectQuery.columns) {
          if (!col.criteria || col.criteria.length === 0) continue;
          const crit = col.criteria[0]?.trim();
          if (!crit) continue;

          const rawVal = row[col.fieldName] ?? row[col.alias || ''];
          if (rawVal === undefined) continue;

          const strVal = String(rawVal).toLowerCase();

          // Evaluate basic operators
          if (crit.startsWith('>=')) {
            const num = parseFloat(crit.replace('>=', '').trim());
            if (isNaN(num) || Number(rawVal) < num) return false;
          } else if (crit.startsWith('<=')) {
            const num = parseFloat(crit.replace('<=', '').trim());
            if (isNaN(num) || Number(rawVal) > num) return false;
          } else if (crit.startsWith('>')) {
            const num = parseFloat(crit.replace('>', '').trim());
            if (isNaN(num) || Number(rawVal) <= num) return false;
          } else if (crit.startsWith('<')) {
            const num = parseFloat(crit.replace('<', '').trim());
            if (isNaN(num) || Number(rawVal) >= num) return false;
          } else if (crit.startsWith('<>') || crit.startsWith('!=')) {
            const target = crit.replace(/^(<>|!=)/, '').trim().replace(/['"]/g, '').toLowerCase();
            if (strVal === target) return false;
          } else if (crit.toLowerCase().startsWith('like')) {
            const pattern = crit.replace(/^like/i, '').trim().replace(/['"%*]/g, '').toLowerCase();
            if (!strVal.includes(pattern)) return false;
          } else if (crit.toLowerCase() === 'is null') {
            if (rawVal !== null && rawVal !== '' && rawVal !== undefined) return false;
          } else if (crit.toLowerCase() === 'is not null') {
            if (rawVal === null || rawVal === '' || rawVal === undefined) return false;
          } else {
            // Equality check
            const target = crit.replace(/['"]/g, '').toLowerCase();
            if (target && !strVal.includes(target) && strVal !== target) return false;
          }
        }
        return true;
      });

      // Sort data if sort property is specified
      const sortCol = selectQuery.columns.find(c => c.sort === 'ASC' || c.sort === 'DESC');
      if (sortCol) {
        filtered.sort((a, b) => {
          const valA = a[sortCol.fieldName] ?? a[sortCol.alias || ''] ?? '';
          const valB = b[sortCol.fieldName] ?? b[sortCol.alias || ''] ?? '';
          const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
          return sortCol.sort === 'ASC' ? cmp : -cmp;
        });
      }

      // Project columns
      const projected = filtered.slice(0, 25).map((row, idx) => {
        const out: Record<string, any> = { _rowIndex: idx + 1 };
        activeColumns.forEach(col => {
          const header = col.alias && col.alias.trim() !== '' ? col.alias : col.fieldName;
          if (col.isCalculated && col.expression) {
            // Simple calculation expression simulation
            try {
              out[header] = 'Berechnet';
            } catch {
              out[header] = '-';
            }
          } else {
            out[header] = row[col.fieldName] ?? row[col.alias || ''] ?? '-';
          }
        });
        return out;
      });

      const colHeaders = activeColumns.map(c => (c.alias && c.alias.trim() !== '' ? c.alias : c.fieldName));
      const endTime = performance.now();

      return {
        previewRows: projected,
        columns: colHeaders,
        executionTimeMs: parseFloat((endTime - startTime).toFixed(2)),
        totalMatchingCount: filtered.length,
        error: null
      };
    } catch (err: any) {
      return {
        previewRows: [],
        columns: [],
        executionTimeMs: 0,
        totalMatchingCount: 0,
        error: err?.message || 'Fehler bei der Live-Ausführung'
      };
    }
  }, [selectQuery, tables, relationships, refreshTrigger]);

  const filteredPreview = useMemo(() => {
    if (!searchTerm.trim()) return previewRows;
    const term = searchTerm.toLowerCase();
    return previewRows.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(term))
    );
  }, [previewRows, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 text-xs select-none">
      {/* Mini Header Bar */}
      <div className="bg-slate-950 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold text-emerald-400">
            <CheckCircle2 size={13} className="text-emerald-400 animate-pulse" />
            Live-Daten-Vorschau
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            {totalMatchingCount} {totalMatchingCount === 1 ? 'Zeile' : 'Zeilen'} (Top 25)
          </span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock size={11} /> {executionTimeMs} ms
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Treffer filtern..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded pl-6 pr-2 py-0.5 focus:outline-none focus:border-emerald-500 w-36"
            />
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="Daten manuell aktualisieren"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-auto bg-slate-900">
        {error ? (
          <div className="p-4 text-center text-slate-400 flex flex-col items-center justify-center h-full gap-2">
            <AlertCircle size={20} className="text-amber-400" />
            <p className="text-xs">{error}</p>
          </div>
        ) : filteredPreview.length === 0 ? (
          <div className="p-4 text-center text-slate-500 flex flex-col items-center justify-center h-full gap-1">
            <Database size={20} className="text-slate-600" />
            <p className="text-xs">Keine Datenzeilen entsprechen den aktuellen Kriterien.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-1.5 px-2.5 w-10 text-center text-slate-500 border-r border-slate-800">#</th>
                {columns.map((col, idx) => (
                  <th key={idx} className="p-1.5 px-3 border-r border-slate-800 whitespace-nowrap text-slate-300">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
              {filteredPreview.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-1.5 px-2 text-center text-slate-500 border-r border-slate-800/80 bg-slate-950/40">
                    {row._rowIndex}
                  </td>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="p-1.5 px-3 border-r border-slate-800/80 whitespace-nowrap text-slate-200">
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
