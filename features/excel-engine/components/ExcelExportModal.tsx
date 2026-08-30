import React, { useState } from 'react';
import { Table, Query, Relationship } from '../../../types';
import { ExcelExportOptions, ExcelExportFormat, ExcelTheme } from '../types';
import { ExcelExportEngine } from '../services/excelExportEngine';
import { X, FileSpreadsheet, Download, Check, Settings2, Table as TableIcon, Layers, FileCode, CheckSquare, Square } from 'lucide-react';

interface ExcelExportModalProps {
  tables: Table[];
  queries: Query[];
  relationships?: Relationship[];
  initialSelectedTableId?: string;
  onClose: () => void;
  onAddToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  tables,
  queries,
  relationships = [],
  initialSelectedTableId,
  onClose,
  onAddToast
}) => {
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>(
    initialSelectedTableId ? [initialSelectedTableId] : tables.map(t => t.id)
  );
  const [selectedQueryIds, setSelectedQueryIds] = useState<string[]>([]);
  const [format, setFormat] = useState<ExcelExportFormat>('xlsx');
  const [theme, setTheme] = useState<ExcelTheme>('corporate_blue');
  const [includeTotalsRow, setIncludeTotalsRow] = useState(true);
  const [autoFitColumns, setAutoFitColumns] = useState(true);
  const [freezeHeaderRow, setFreezeHeaderRow] = useState(true);
  const [includeSchemaSheet, setIncludeSchemaSheet] = useState(false);
  const [fileName, setFileName] = useState('');

  const toggleTable = (id: string) => {
    if (selectedTableIds.includes(id)) {
      setSelectedTableIds(selectedTableIds.filter(tId => tId !== id));
    } else {
      setSelectedTableIds([...selectedTableIds, id]);
    }
  };

  const selectAllTables = () => {
    if (selectedTableIds.length === tables.length) {
      setSelectedTableIds([]);
    } else {
      setSelectedTableIds(tables.map(t => t.id));
    }
  };

  const handleExport = () => {
    if (selectedTableIds.length === 0 && selectedQueryIds.length === 0) {
      onAddToast('Bitte wählen Sie mindestens eine Tabelle oder Abfrage aus.', 'warning');
      return;
    }

    try {
      const options: ExcelExportOptions = {
        format,
        theme,
        includeTotalsRow,
        autoFitColumns,
        freezeHeaderRow,
        includeLookupRelations: false,
        includeSchemaSheet,
        selectedTableIds,
        selectedQueryIds,
        fileName: fileName.trim() || undefined
      };

      ExcelExportEngine.exportToWorkbook(tables, queries, relationships, options);
      onAddToast(`Excel-Export (${format.toUpperCase()}) erfolgreich generiert!`, 'success');
      onClose();
    } catch (err: any) {
      onAddToast(`Export fehlgeschlagen: ${err.message}`, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Native Excel (.xlsx) Export-Engine
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800">
                  Multi-Sheet
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Direkter Export von Tabellen und Abfragen mit Formeln, Auto-Spaltenbreiten und Datentyperkennung
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* 1. Format & Filename */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Export-Dateiformat:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'xlsx', label: 'Excel (.xlsx)', icon: <FileSpreadsheet size={13} /> },
                  { id: 'csv', label: 'CSV (.csv)', icon: <FileCode size={13} /> },
                  { id: 'json', label: 'JSON (.json)', icon: <FileCode size={13} /> }
                ].map(fmt => (
                  <button
                    key={fmt.id}
                    onClick={() => setFormat(fmt.id as any)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium border transition-all ${
                      format === fmt.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500 font-semibold shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {fmt.icon}
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Dateiname (optional):
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Automatisch generiert..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* 2. Table & Sheet Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TableIcon size={14} className="text-emerald-600" />
                Zu exportierende Tabellen ({selectedTableIds.length} von {tables.length} ausgewählt):
              </label>
              <button
                onClick={selectAllTables}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                {selectedTableIds.length === tables.length ? 'Alle abwählen' : 'Alle auswählen'}
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-800/40 divide-y divide-slate-200/60 dark:divide-slate-700/60">
              {tables.map(table => {
                const isSelected = selectedTableIds.includes(table.id);
                return (
                  <div
                    key={table.id}
                    onClick={() => toggleTable(table.id)}
                    className="flex items-center justify-between p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {isSelected ? (
                        <CheckSquare size={16} className="text-emerald-600" />
                      ) : (
                        <Square size={16} className="text-slate-400" />
                      )}
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {table.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {table.data?.length || 0} Zeilen • {table.fields?.length || 0} Spalten
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Formatting & Formula Options */}
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Settings2 size={14} className="text-indigo-600" />
              Erweiterte Formatierungs- & Formeloptionen
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTotalsRow}
                  onChange={(e) => setIncludeTotalsRow(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <div>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
                    Summenzeile mit Excel-Formeln
                  </span>
                  <span className="text-[10px] text-slate-500">=SUM(...) für numerische Spalten</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoFitColumns}
                  onChange={(e) => setAutoFitColumns(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <div>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
                    Automatische Spaltenbreiten
                  </span>
                  <span className="text-[10px] text-slate-500">Passt Breite dynamisch an Textlänge an</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freezeHeaderRow}
                  onChange={(e) => setFreezeHeaderRow(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <div>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
                    Kopfzeile fixieren (Freeze Panes)
                  </span>
                  <span className="text-[10px] text-slate-500">Spaltenüberschriften beim Scrollen sichtbar</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSchemaSheet}
                  onChange={(e) => setIncludeSchemaSheet(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <div>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
                    Schema-Info Arbeitsblatt anfügen
                  </span>
                  <span className="text-[10px] text-slate-500">Data Dictionary mit Datentypen & Keys</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <span className="text-xs text-slate-500">
            {selectedTableIds.length} Tabelle(n) ausgewählt
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all"
            >
              <Download size={14} />
              Jetzt exportieren ({format.toUpperCase()})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
