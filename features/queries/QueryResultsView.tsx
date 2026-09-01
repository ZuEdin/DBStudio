import React, { useState, useMemo } from 'react';
import { Query, SelectQuery, DbType } from '../../types/index';
import {
  FileSpreadsheet,
  FileText,
  FileJson,
  Download,
  Filter,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Activity,
  Table as TableIcon,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useDataFilter } from '../../hooks/useDataFilter';
import { useProjectStore } from '../../stores/useProjectStore';
import { QueryCostPlanModal } from './components/QueryCostPlanModal';
import { PivotMatrixView } from './components/PivotMatrixView';

interface QueryResultsViewProps {
  query: Query;
  results: Record<string, any>[];
}

export const QueryResultsView: React.FC<QueryResultsViewProps> = ({ query, results }) => {
  const [showCostPlan, setShowCostPlan] = useState(false);
  const tables = useProjectStore((state) => state.tables);
  const backendConfig = useProjectStore((state) => state.backendConfig);
  const dbType = backendConfig?.dbType || DbType.SQLite;

  if (!query) return null;

  if (query.type !== 'SELECT' && query.type !== 'CROSSTAB') {
    return (
      <div className="p-6 text-center text-slate-500">
        Ergebnisse können nur für SELECT- und Kreuztabellen-Abfragen angezeigt werden.
      </div>
    );
  }

  const selectQuery = query as SelectQuery;
  const isCrosstab =
    query.type === 'CROSSTAB' ||
    Boolean(query.crosstabConfig) ||
    selectQuery.columns.some((c) => c.crosstab === 'ROW_HEADING' || c.crosstab === 'COLUMN_HEADING');

  // Compute dynamic column headers from results so matrix columns are never truncated
  const { headers, dataKeys } = useMemo(() => {
    if (results && results.length > 0) {
      const keysSet = new Set<string>();
      results.forEach((row) => {
        if (row && typeof row === 'object') {
          Object.keys(row).forEach((k) => keysSet.add(k));
        }
      });
      const discoveredKeys = Array.from(keysSet);

      if (isCrosstab) {
        // Position row headers first, then total if present, then pivot columns
        const rowCols = selectQuery.columns
          .filter((c) => c.crosstab === 'ROW_HEADING')
          .map((c) => c.alias || c.fieldName);

        const orderedKeys = [
          ...rowCols.filter((k) => discoveredKeys.includes(k)),
          ...discoveredKeys.filter((k) => !rowCols.includes(k) && k.toLowerCase() !== 'gesamtwert' && k.toLowerCase() !== 'gesamtsumme'),
          ...discoveredKeys.filter((k) => k.toLowerCase() === 'gesamtwert' || k.toLowerCase() === 'gesamtsumme'),
        ];

        return {
          headers: orderedKeys,
          dataKeys: orderedKeys,
        };
      }

      // If discovered keys match standard query columns
      if (discoveredKeys.length > 0) {
        const visibleCols = selectQuery.columns.filter((c) => c.show).map((c) => c.alias || c.fieldName);
        const activeKeys = visibleCols.length > 0 && visibleCols.every((k) => discoveredKeys.includes(k))
          ? visibleCols
          : discoveredKeys;

        return {
          headers: activeKeys,
          dataKeys: activeKeys,
        };
      }
    }

    const defaultCols = selectQuery.columns.filter((c) => c.show).map((c) => c.alias || c.fieldName);
    return {
      headers: defaultCols,
      dataKeys: defaultCols,
    };
  }, [results, selectQuery.columns, isCrosstab]);

  const {
    filteredData,
    filters,
    setFilter,
    clearFilters,
    showFilters,
    setShowFilters,
    columnStats,
    sortColumn,
    sortDirection,
    handleSort,
  } = useDataFilter(results);

  const getRowVal = (row: any, key: string) => {
    if (!row || !key || typeof key !== 'string') return '';
    if (row[key] !== undefined && row[key] !== null) return row[key];
    const camel = key.charAt(0).toLowerCase() + (key.length > 1 ? key.slice(1) : '');
    if (row[camel] !== undefined && row[camel] !== null) return row[camel];
    const pascal = key.charAt(0).toUpperCase() + (key.length > 1 ? key.slice(1) : '');
    if (row[pascal] !== undefined && row[pascal] !== null) return row[pascal];
    const lower = key.toLowerCase();
    const foundKey = Object.keys(row || {}).find(
      (k) => k.toLowerCase() === lower || k.toLowerCase().endsWith('.' + lower)
    );
    return foundKey ? row[foundKey] : '';
  };

  const exportExcel = () => {
    if (filteredData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matrix_Daten');
    XLSX.writeFile(wb, `${query.name.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
  };

  const exportPDF = () => {
    if (filteredData.length === 0) return;
    const doc = new jsPDF();
    doc.text(`Abfrage: ${query.name}${isCrosstab ? ' (Kreuztabelle/Pivot)' : ''}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Erstellt am: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableBody = filteredData.map((row) => dataKeys.map((key) => String(getRowVal(row, key) ?? '')));

    autoTable(doc, {
      head: [headers],
      body: tableBody,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: isCrosstab ? [88, 28, 135] : [66, 66, 66] },
    });

    doc.save(`${query.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  };

  const exportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredData, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `${query.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    link.click();
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-100 h-full overflow-hidden flex flex-col">
      <div className="max-w-full mx-auto bg-white shadow-xl border border-slate-300 rounded-xl overflow-hidden flex flex-col h-full w-full">
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <TableIcon size={18} className={isCrosstab ? 'text-purple-400' : 'text-blue-400'} />
            <h2 className="text-base font-bold flex items-center gap-2">
              <span>{query.name}</span>
              {isCrosstab && (
                <span className="bg-purple-600/90 text-white text-[11px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Kreuztabelle
                </span>
              )}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            <button
              onClick={() => setShowCostPlan(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border bg-indigo-950/80 border-indigo-700 hover:bg-indigo-900 text-indigo-200 transition-colors font-semibold"
              title="Ausführungsplan und Index-Empfehlungen anzeigen"
            >
              <Activity size={14} className="text-indigo-400" /> EXPLAIN Plan
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                showFilters || Object.keys(filters).length > 0
                  ? 'bg-amber-600 border-amber-500 text-white shadow-xs'
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
              }`}
              title="Filter anzeigen"
            >
              <Filter size={14} /> Filter {Object.keys(filters).length > 0 ? `(${Object.keys(filters).length})` : ''}
            </button>

            <div className="flex gap-1.5 border-l border-slate-700 pl-3">
              <button
                onClick={exportExcel}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors text-white shadow-2xs"
                title="Export als Excel"
              >
                <FileSpreadsheet size={14} /> Excel
              </button>
              <button
                onClick={exportPDF}
                className="flex items-center gap-1.5 bg-rose-700 hover:bg-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors text-white shadow-2xs"
                title="Export als PDF"
              >
                <FileText size={14} /> PDF
              </button>
              <button
                onClick={exportJSON}
                className="flex items-center gap-1.5 bg-amber-700 hover:bg-amber-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors text-white shadow-2xs"
                title="Export als JSON"
              >
                <FileJson size={14} /> JSON
              </button>
            </div>
          </div>
        </div>

        {/* DATA FILTER BAR */}
        {showFilters && (
          <div className="bg-amber-50/70 border-b border-amber-200 p-2.5 flex overflow-x-auto gap-2 items-center animate-in slide-in-from-top-2 shadow-inner shrink-0">
            <div className="flex items-center gap-2 pr-4 border-r border-amber-200 mr-2 shrink-0">
              <span className="text-xs font-bold text-amber-900 uppercase flex items-center gap-1">
                <Filter size={13} /> Filter
              </span>
              <button
                onClick={clearFilters}
                className="text-amber-700 hover:text-amber-950 text-xs underline font-medium"
              >
                Alle löschen
              </button>
            </div>
            {headers.map((h, i) => {
              const key = dataKeys[i];
              const stats = columnStats[key] || { uniqueValues: [], isLowCardinality: false };
              const hasFilter = !!filters[key];

              return (
                <div
                  key={`filter-${i}-${key}`}
                  className={`flex flex-col min-w-[130px] max-w-[220px] ${
                    hasFilter ? 'bg-white rounded-lg shadow-sm border border-amber-300' : ''
                  } p-1`}
                >
                  <label className="text-[10px] font-bold text-amber-800 mb-0.5 truncate px-1">{h}</label>
                  {stats?.isLowCardinality ? (
                    <select
                      value={filters[key] || ''}
                      onChange={(e) => setFilter(key, e.target.value)}
                      className={`w-full border rounded-md px-1.5 py-1 text-xs outline-none ${
                        hasFilter ? 'border-amber-400 bg-amber-50 font-bold text-amber-950' : 'border-slate-300 bg-white'
                      }`}
                    >
                      <option value="">(Alle)</option>
                      {stats.uniqueValues.map((val) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={filters[key] || ''}
                        onChange={(e) => setFilter(key, e.target.value)}
                        placeholder="Suchen..."
                        className={`w-full border rounded-md px-1.5 py-1 text-xs outline-none pr-5 ${
                          hasFilter ? 'border-amber-400 bg-amber-50 font-bold text-amber-950' : 'border-slate-300 bg-white'
                        }`}
                      />
                      {filters[key] && (
                        <button
                          onClick={() => setFilter(key, '')}
                          className="absolute right-1.5 top-1 text-amber-500 hover:text-amber-700"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* DATA PRESENTATION: PIVOT MATRIX VIEW OR STANDARD TABULAR VIEW */}
        <div className="overflow-hidden flex-1 relative flex flex-col">
          {filteredData.length > 0 ? (
            isCrosstab ? (
              <PivotMatrixView
                query={selectQuery}
                results={filteredData}
                headers={headers}
                dataKeys={dataKeys}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                getRowVal={getRowVal}
              />
            ) : (
              <div className="overflow-auto flex-1 relative">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 shadow-xs z-10 select-none bg-slate-100 border-b border-slate-300">
                    <tr className="text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      {headers.map((header, i) => {
                        const key = dataKeys[i];
                        const isSorted = sortColumn === key;
                        return (
                          <th
                            key={`hdr-${i}-${header}`}
                            onClick={() => handleSort(key)}
                            className={`p-3 bg-slate-100 hover:bg-slate-200 cursor-pointer whitespace-nowrap transition-colors ${
                              isSorted ? 'bg-indigo-50 text-indigo-900 font-extrabold' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{header}</span>
                              <span className="text-slate-400">
                                {isSorted ? (
                                  sortDirection === 'asc' ? (
                                    <ArrowUp size={14} className="text-indigo-600" />
                                  ) : (
                                    <ArrowDown size={14} className="text-indigo-600" />
                                  )
                                ) : (
                                  <ArrowUpDown size={12} className="opacity-0 hover:opacity-100" />
                                )}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredData.map((row, rowIndex) => (
                      <tr key={`row-${rowIndex}`} className="hover:bg-slate-50 transition-colors">
                        {dataKeys.map((key, colIndex) => (
                          <td key={`cell-${rowIndex}-${colIndex}`} className="p-3 text-slate-700 whitespace-nowrap">
                            {String(getRowVal(row, key) ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="p-10 text-center text-slate-500 my-auto">
              {results.length > 0
                ? 'Keine Treffer für die aktuellen Filterkriterien.'
                : `Die Abfrage "${query.name}" hat keine Datensätze geliefert.`}
            </div>
          )}
        </div>

        {/* Bottom Footer Info */}
        <div className="bg-slate-100 border-t border-slate-300 px-4 py-2.5 text-xs text-slate-600 flex justify-between items-center shrink-0">
          <span>
            {isCrosstab
              ? `Kreuztabellen-Matrix (${filteredData.length} Zeilengruppen × ${headers.length} Spalten)`
              : 'Standard-Auswahlabfrage'}
          </span>
          <span className="font-semibold">
            {Object.keys(filters).length > 0
              ? `${filteredData.length} von ${results.length} Datensätzen angezeigt`
              : `${results.length} Zeilen gesamt`}
          </span>
        </div>
      </div>

      {showCostPlan && (
        <QueryCostPlanModal
          isOpen={showCostPlan}
          onClose={() => setShowCostPlan(false)}
          query={query}
          tables={tables}
          dbType={dbType}
        />
      )}
    </div>
  );
};
