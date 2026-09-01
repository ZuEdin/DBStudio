import React, { useMemo } from 'react';
import { SelectQuery } from '../../../types';
import { PivotMatrixResult, PivotHeaderDef } from '../utils/crosstabTransformer';
import { Calculator, Columns, Rows, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface PivotMatrixViewProps {
  query: SelectQuery;
  results: Record<string, any>[];
  headers: string[];
  dataKeys: string[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
  getRowVal: (row: any, key: string) => any;
}

export const PivotMatrixView: React.FC<PivotMatrixViewProps> = ({
  query,
  results,
  headers,
  dataKeys,
  sortColumn,
  sortDirection,
  onSort,
  getRowVal,
}) => {
  // Detect row header keys vs pivot value columns vs total columns
  const crosstabCfg = query.crosstabConfig;
  const rowCols = query.columns.filter((c) => c.crosstab === 'ROW_HEADING').map((c) => c.alias || c.fieldName);
  const colHeaderCol = query.columns.find((c) => c.crosstab === 'COLUMN_HEADING');
  const valueCol = query.columns.find((c) => c.crosstab === 'VALUE');

  // Compute bottom summary row across all currently displayed rows
  const bottomTotals = useMemo(() => {
    if (results.length === 0) return null;
    const totals: Record<string, any> = {};
    const firstKey = dataKeys[0];
    totals[firstKey] = 'Gesamtergebnis';

    // Blank out other row headers
    dataKeys.forEach((k) => {
      if (k !== firstKey) {
        const isRow = rowCols.includes(k);
        if (isRow) {
          totals[k] = '';
        } else {
          // Numerical sum for cell columns
          let sum = 0;
          let hasNumber = false;
          results.forEach((row) => {
            const raw = getRowVal(row, k);
            const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
            if (!isNaN(num)) {
              sum += num;
              hasNumber = true;
            }
          });
          totals[k] = hasNumber ? Math.round(sum * 100) / 100 : '-';
        }
      }
    });

    return totals;
  }, [results, dataKeys, rowCols, getRowVal]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Pivot Info Header Banner */}
      <div className="bg-purple-950/80 border-b border-purple-800 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <span className="bg-purple-600 text-white font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">
            Kreuztabelle (Pivot Matrix)
          </span>
          <span className="font-semibold text-purple-200">
            {query.name}
          </span>
        </div>

        <div className="flex items-center gap-4 text-purple-200">
          <div className="flex items-center gap-1.5 bg-purple-900/60 px-2.5 py-1 rounded border border-purple-700/50">
            <Rows size={13} className="text-purple-300" />
            <span className="text-purple-300">Zeilen:</span>
            <span className="font-bold text-white">
              {rowCols.length > 0 ? rowCols.join(', ') : crosstabCfg?.rowHeaders?.join(', ') || 'Zeilenfeld'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-purple-900/60 px-2.5 py-1 rounded border border-purple-700/50">
            <Columns size={13} className="text-emerald-300" />
            <span className="text-emerald-300">Spalten:</span>
            <span className="font-bold text-white">
              {colHeaderCol?.alias || colHeaderCol?.fieldName || crosstabCfg?.columnHeader || 'Spaltenfeld'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-purple-900/60 px-2.5 py-1 rounded border border-purple-700/50">
            <Calculator size={13} className="text-amber-300" />
            <span className="text-amber-300">Wert & Aggregation:</span>
            <span className="font-bold text-amber-200">
              {valueCol?.aggregate || crosstabCfg?.aggregate || 'Anzahl'} (
              {valueCol?.alias || valueCol?.fieldName || crosstabCfg?.valueField || 'Wert'})
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Matrix Table */}
      <div className="overflow-auto flex-1 relative bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 shadow-xs z-10 select-none bg-slate-100 border-b-2 border-purple-300">
            <tr className="text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
              {headers.map((header, i) => {
                const key = dataKeys[i];
                const isSorted = sortColumn === key;
                const isRowHeader = rowCols.includes(key) || (i === 0 && rowCols.length === 0);
                const isTotal = key.toLowerCase() === 'gesamtwert' || key.toLowerCase() === 'gesamtsumme' || key.toLowerCase() === 'gesamt';

                let headerBg = 'bg-slate-100 hover:bg-slate-200';
                if (isRowHeader) headerBg = 'bg-slate-200/90 text-slate-900 font-extrabold hover:bg-slate-300/80';
                if (isTotal) headerBg = 'bg-amber-100/90 text-amber-950 font-black hover:bg-amber-200';
                if (isSorted) headerBg = 'bg-purple-100 text-purple-950 font-extrabold';

                return (
                  <th
                    key={`pivot-hdr-${i}-${key}`}
                    onClick={() => onSort(key)}
                    className={`p-3 border-r border-slate-200 last:border-r-0 cursor-pointer whitespace-nowrap transition-colors ${headerBg}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {isRowHeader && <Rows size={12} className="text-purple-600" />}
                        {isTotal && <Calculator size={12} className="text-amber-700" />}
                        <span>{header}</span>
                      </div>
                      <span className="text-slate-400">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp size={14} className="text-purple-700 font-bold" />
                          ) : (
                            <ArrowDown size={14} className="text-purple-700 font-bold" />
                          )
                        ) : (
                          <ArrowUpDown size={11} className="opacity-0 hover:opacity-100 text-slate-400" />
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {results.map((row, rowIndex) => (
              <tr key={`matrix-row-${rowIndex}`} className="hover:bg-purple-50/40 transition-colors">
                {dataKeys.map((key, colIndex) => {
                  const isRowHeader = rowCols.includes(key) || (colIndex === 0 && rowCols.length === 0);
                  const isTotal = key.toLowerCase() === 'gesamtwert' || key.toLowerCase() === 'gesamtsumme' || key.toLowerCase() === 'gesamt';
                  const cellVal = getRowVal(row, key);
                  const isNumber = typeof cellVal === 'number' || (!isNaN(Number(cellVal)) && cellVal !== '' && cellVal !== null);

                  let cellClass = 'p-2.5 text-slate-800 whitespace-nowrap border-r border-slate-100 last:border-r-0';
                  if (isRowHeader) cellClass += ' bg-slate-50/70 font-semibold text-slate-900';
                  if (isTotal) cellClass += ' bg-amber-50/70 font-bold text-amber-950 text-right';
                  if (isNumber && !isRowHeader) cellClass += ' text-right font-mono font-medium';

                  return (
                    <td key={`matrix-cell-${rowIndex}-${colIndex}`} className={cellClass}>
                      {cellVal !== undefined && cellVal !== null && cellVal !== '' ? String(cellVal) : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>

          {/* Bottom Summary / Totals Footer Row */}
          {bottomTotals && (
            <tfoot className="bg-slate-200 font-black text-slate-900 border-t-2 border-slate-400 sticky bottom-0 z-10 shadow-inner">
              <tr>
                {dataKeys.map((key, i) => {
                  const val = bottomTotals[key];
                  const isFirst = i === 0;
                  const isTotal = key.toLowerCase() === 'gesamtwert' || key.toLowerCase() === 'gesamtsumme' || key.toLowerCase() === 'gesamt';

                  return (
                    <td
                      key={`matrix-foot-${i}`}
                      className={`p-3 whitespace-nowrap border-r border-slate-300 last:border-r-0 ${
                        isFirst ? 'font-black text-slate-900' : ''
                      } ${isTotal ? 'bg-amber-200 text-amber-950 font-black text-right' : 'text-right font-mono'}`}
                    >
                      {val !== undefined && val !== null ? String(val) : ''}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
