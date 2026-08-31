import React, { useState } from 'react';
import { Plus, Trash2, Table as TableIcon, Copy, ArrowUp, ArrowDown } from 'lucide-react';
import { Table, FormElement, Form } from '../../../types/index';

interface SubformEditableGridProps {
  subformDef: Form;
  subTable: Table;
  dataRows: Record<string, any>[];
  columns: { id: string; fieldId: string; label: string; type?: string; widgetType?: string }[];
  isReadOnly?: boolean;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onRowChange: (rowIndex: number, fieldName: string, value: any) => void;
  onRowAdd: () => void;
  onRowDelete: (rowIndex: number) => void;
  onRowDuplicate?: (rowIndex: number) => void;
}

export const SubformEditableGrid: React.FC<SubformEditableGridProps> = ({
  subformDef,
  subTable,
  dataRows,
  columns,
  isReadOnly = false,
  canAdd = true,
  canEdit = true,
  canDelete = true,
  onRowChange,
  onRowAdd,
  onRowDelete,
  onRowDuplicate,
}) => {
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIdx: number,
    colIdx: number
  ) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        if (colIdx > 0) setActiveCell({ row: rowIdx, col: colIdx - 1 });
        else if (rowIdx > 0) setActiveCell({ row: rowIdx - 1, col: columns.length - 1 });
      } else {
        if (colIdx < columns.length - 1) setActiveCell({ row: rowIdx, col: colIdx + 1 });
        else if (rowIdx < dataRows.length - 1) setActiveCell({ row: rowIdx + 1, col: 0 });
        else if (canAdd && !isReadOnly) {
          onRowAdd();
          setActiveCell({ row: dataRows.length, col: 0 });
        }
      }
    } else if (e.key === 'ArrowDown' && rowIdx < dataRows.length - 1) {
      setActiveCell({ row: rowIdx + 1, col: colIdx });
    } else if (e.key === 'ArrowUp' && rowIdx > 0) {
      setActiveCell({ row: rowIdx - 1, col: colIdx });
    }
  };

  // Compute Column Rollups (SUM / AVG / COUNT)
  const columnRollups = columns.map((col) => {
    const f = subTable.fields.find((field) => field.id === col.fieldId);
    const fieldName = f?.name || '';
    const isNumeric = f?.type === 'INTEGER' || f?.type === 'DECIMAL' || f?.type === 'DOUBLE' || f?.type === 'FLOAT' || col.widgetType === 'currency' || col.widgetType === 'number';

    if (!isNumeric || dataRows.length === 0) return null;

    const sum = dataRows.reduce((acc, row) => {
      const val = parseFloat(row[fieldName]);
      return !isNaN(val) ? acc + val : acc;
    }, 0);

    const avg = sum / dataRows.length;
    return { sum, avg, count: dataRows.length };
  });

  return (
    <div className="w-full border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs bg-white dark:bg-slate-900">
      <div className="bg-slate-100 dark:bg-slate-950 px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TableIcon size={15} className="text-blue-600 dark:text-blue-400" />
          <span className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200">
            {subformDef.name} — Interaktiver Tabellen-Editor ({dataRows.length} Einträge)
          </span>
        </div>
        {!isReadOnly && canAdd && (
          <button
            type="button"
            onClick={onRowAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-2.5 py-1 rounded text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus size={13} strokeWidth={2.5} /> Zeile hinzufügen
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
            <tr>
              <th className="w-10 px-2 py-2 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800">
                #
              </th>
              {columns.map((col) => {
                const f = subTable.fields.find((field) => field.id === col.fieldId);
                return (
                  <th key={col.id || col.fieldId} className="px-3 py-2 border-r border-slate-200 dark:border-slate-800 min-w-[120px]">
                    {col.label || f?.name}
                  </th>
                );
              })}
              {!isReadOnly && (canEdit || canDelete) && (
                <th className="w-20 px-2 py-2 text-center">Aktionen</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {dataRows.map((rowItem, rowIdx) => (
              <tr key={rowItem.id || rowIdx} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition-colors group">
                <td className="px-2 py-1 text-center font-mono text-[11px] text-slate-400 bg-slate-50/50 dark:bg-slate-950/40 border-r border-slate-200 dark:border-slate-800">
                  {rowIdx + 1}
                </td>

                {columns.map((col, colIdx) => {
                  const f = subTable.fields.find((field) => field.id === col.fieldId);
                  const fieldName = f?.name || col.fieldId;
                  const value = rowItem[fieldName] ?? '';
                  const isActive = activeCell?.row === rowIdx && activeCell?.col === colIdx;

                  return (
                    <td
                      key={col.id || col.fieldId}
                      className={`p-1 border-r border-slate-200 dark:border-slate-800 transition-all ${
                        isActive ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-slate-800' : ''
                      }`}
                      onClick={() => setActiveCell({ row: rowIdx, col: colIdx })}
                    >
                      {isReadOnly || !canEdit ? (
                        <div className="px-2 py-1 text-slate-800 dark:text-slate-200 min-h-[26px]">
                          {String(value)}
                        </div>
                      ) : (
                        <input
                          type={f?.type === 'INTEGER' || f?.type === 'DECIMAL' ? 'number' : 'text'}
                          value={value}
                          onChange={(e) => onRowChange(rowIdx, fieldName, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                          onFocus={() => setActiveCell({ row: rowIdx, col: colIdx })}
                          className="w-full px-2 py-1 text-xs bg-transparent focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-400 rounded outline-none text-slate-900 dark:text-slate-100 transition-colors"
                        />
                      )}
                    </td>
                  );
                })}

                {!isReadOnly && (canEdit || canDelete) && (
                  <td className="px-2 py-1 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                      {onRowDuplicate && (
                        <button
                          type="button"
                          onClick={() => onRowDuplicate(rowIdx)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                          title="Zeile duplizieren"
                        >
                          <Copy size={13} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onRowDelete(rowIdx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Zeile löschen"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>

          {/* Rollup Aggregations Summary Footer Row */}
          {columnRollups.some((r) => r !== null) && (
            <tfoot className="bg-slate-100 dark:bg-slate-950 font-semibold text-[11px] text-slate-700 dark:text-slate-300 border-t-2 border-slate-300 dark:border-slate-700">
              <tr>
                <td className="px-2 py-1.5 text-center font-bold text-slate-500">Σ</td>
                {columns.map((col, idx) => {
                  const rollup = columnRollups[idx];
                  return (
                    <td key={col.id || col.fieldId} className="px-3 py-1.5 border-r border-slate-200 dark:border-slate-800">
                      {rollup ? (
                        <div className="flex flex-col text-[10px]">
                          <span className="text-blue-700 dark:text-blue-400 font-mono font-bold">
                            Summe: {rollup.sum.toLocaleString('de-DE', { maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-slate-500 font-mono">
                            Ø: {rollup.avg.toLocaleString('de-DE', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ) : null}
                    </td>
                  );
                })}
                {!isReadOnly && (canEdit || canDelete) && <td></td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
