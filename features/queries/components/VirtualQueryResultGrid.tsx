import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Filter, Edit2, Download, Table as TableIcon, Check, EyeOff } from 'lucide-react';
import { exportQueryResult, ExportFormat } from '../utils/queryExportEngine';

interface VirtualQueryResultGridProps {
  rows: Record<string, any>[];
  columns: string[];
  onCellEdit?: (rowIndex: number, column: string, newValue: any) => void;
  title?: string;
}

export const VirtualQueryResultGrid: React.FC<VirtualQueryResultGridProps> = ({
  rows = [],
  columns = [],
  onCellEdit,
  title = 'Abfrageergebnisse',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editVal, setEditVal] = useState('');
  const [localRows, setLocalRows] = useState<Record<string, any>[]>(rows);

  // Sync rows if updated externally
  React.useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  const visibleColumns = useMemo(() => {
    return columns.filter((c) => !hiddenCols.includes(c));
  }, [columns, hiddenCols]);

  // Filter & Sort
  const filteredAndSortedRows = useMemo(() => {
    let result = [...localRows];

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(term))
      );
    }

    if (sortCol) {
      result.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (valA === valB) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDir === 'ASC' ? valA - valB : valB - valA;
        }
        return sortDir === 'ASC'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [localRows, searchTerm, sortCol, sortDir]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      if (sortDir === 'ASC') setSortDir('DESC');
      else {
        setSortCol(null);
        setSortDir('ASC');
      }
    } else {
      setSortCol(col);
      setSortDir('ASC');
    }
  };

  const saveCell = (rowIndex: number, col: string) => {
    const updated = [...localRows];
    updated[rowIndex] = { ...updated[rowIndex], [col]: editVal };
    setLocalRows(updated);
    if (onCellEdit) onCellEdit(rowIndex, col, editVal);
    setEditingCell(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden text-xs">
      {/* Top Controls Toolbar */}
      <div className="bg-slate-100 border-b border-slate-300 p-2.5 flex justify-between items-center flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1.5 text-slate-400" />
            <input
              type="text"
              placeholder="In Ergebnissen suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 bg-white border border-slate-300 rounded text-xs w-56 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <span className="text-slate-500 font-medium text-[11px]">
            {filteredAndSortedRows.length} von {localRows.length} Zeilen
          </span>
        </div>

        {/* Exports */}
        <div className="flex items-center gap-1.5">
          {(['EXCEL', 'CSV', 'JSON', 'XML', 'PARQUET'] as ExportFormat[]).map((fmt) => (
            <button
              key={fmt}
              onClick={() => exportQueryResult(filteredAndSortedRows, columns, fmt, title)}
              className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded text-[11px] font-bold text-slate-700 flex items-center gap-1 shadow-2xs"
            >
              <Download size={11} className="text-blue-600" />
              <span>{fmt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Table Container */}
      <div className="flex-1 overflow-auto relative">
        <table className="w-full border-collapse text-left font-sans">
          <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-300">
            <tr>
              <th className="w-10 px-2 py-1.5 border-r border-slate-300 text-center font-bold text-slate-500 bg-slate-200/60">
                #
              </th>
              {visibleColumns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-3 py-1.5 border-r border-slate-300 font-bold text-slate-800 hover:bg-slate-200/80 cursor-pointer select-none"
                >
                  <div className="flex justify-between items-center gap-1">
                    <span>{col}</span>
                    {sortCol === col ? (
                      <span className="text-blue-600 font-extrabold">{sortDir === 'ASC' ? '▲' : '▼'}</span>
                    ) : (
                      <ArrowUpDown size={11} className="text-slate-400" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredAndSortedRows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="p-8 text-center text-slate-400 italic">
                  Keine passenden Datensätze gefunden.
                </td>
              </tr>
            ) : (
              filteredAndSortedRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-2 py-1 border-r border-slate-200 text-center text-slate-400 font-mono text-[11px] bg-slate-50/50">
                    {rIdx + 1}
                  </td>
                  {visibleColumns.map((col) => {
                    const isEditing = editingCell?.row === rIdx && editingCell?.col === col;
                    const val = row[col];

                    return (
                      <td
                        key={col}
                        onDoubleClick={() => {
                          setEditingCell({ row: rIdx, col });
                          setEditVal(String(val ?? ''));
                        }}
                        className="px-3 py-1 border-r border-slate-200 text-slate-800 font-mono text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-xs cursor-text"
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            autoFocus
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                            onBlur={() => saveCell(rIdx, col)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveCell(rIdx, col);
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-full bg-blue-100 border border-blue-500 rounded px-1.5 py-0.5 font-mono text-xs focus:outline-hidden"
                          />
                        ) : (
                          <span>{val == null ? <em className="text-slate-300">NULL</em> : String(val)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
