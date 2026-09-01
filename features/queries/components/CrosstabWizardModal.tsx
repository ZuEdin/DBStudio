import React, { useState, useEffect } from 'react';
import { Table, DbType } from '../../../types';
import { Table as TableIcon, Columns, Rows, Calculator, X, Play, Code2, Copy, Check, Sparkles } from 'lucide-react';
import { CrosstabConfig, generateCrosstabSql, executeCrosstabInMemory } from '../utils/crosstabGenerator';
import { PivotMatrixResult } from '../utils/crosstabTransformer';

interface CrosstabWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  dbType: DbType;
  onApplySql?: (sql: string) => void;
  onApplyCrosstab?: (config: CrosstabConfig, sql: string) => void;
}

export const CrosstabWizardModal: React.FC<CrosstabWizardModalProps> = ({
  isOpen,
  onClose,
  tables,
  dbType,
  onApplySql,
  onApplyCrosstab,
}) => {
  if (!isOpen) return null;

  const [selectedTableId, setSelectedTableId] = useState<string>(tables[0]?.id || '');
  const activeTable = tables.find((t) => t.id === selectedTableId) || tables[0];

  const [rowFieldIds, setRowFieldIds] = useState<string[]>(
    activeTable?.fields[0] ? [activeTable.fields[0].id] : []
  );
  const [colFieldId, setColFieldId] = useState<string>(
    activeTable?.fields[1] ? activeTable.fields[1].id : ''
  );
  const [valFieldId, setValFieldId] = useState<string>(
    activeTable?.fields[2] ? activeTable.fields[2].id : activeTable?.fields[0]?.id || ''
  );
  const [aggFunc, setAggFunc] = useState<'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'>('COUNT');

  const [copied, setCopied] = useState(false);
  const [previewData, setPreviewData] = useState<PivotMatrixResult | null>(null);

  const selectedColField = activeTable?.fields.find((f) => f.id === colFieldId);
  const selectedValField = activeTable?.fields.find((f) => f.id === valFieldId);

  // Derive distinct column values from sample data if available
  const sampleDistinctCols = Array.from(
    new Set(
      (activeTable?.data || [])
        .map((r) => String(r[selectedColField?.name || ''] ?? ''))
        .filter((v) => v.trim().length > 0)
    )
  ).slice(0, 8);

  const config: CrosstabConfig = {
    sourceTableId: activeTable?.id || '',
    rowHeaders: rowFieldIds.map((id) => {
      const f = activeTable?.fields.find((fld) => fld.id === id);
      return { fieldId: id, fieldName: f?.name || id };
    }),
    columnHeader: {
      fieldId: colFieldId,
      fieldName: selectedColField?.name || colFieldId,
    },
    valueField: {
      fieldId: valFieldId,
      fieldName: selectedValField?.name || valFieldId,
      aggregate: aggFunc,
    },
    distinctColumnHeaders: sampleDistinctCols.length > 0 ? sampleDistinctCols : undefined,
  };

  const generatedSql = activeTable ? generateCrosstabSql(config, tables, dbType) : '';

  // Auto-calculate live preview on configuration change
  useEffect(() => {
    if (activeTable && activeTable.data && activeTable.data.length > 0 && rowFieldIds.length > 0 && colFieldId && valFieldId) {
      const result = executeCrosstabInMemory(config, activeTable.data);
      setPreviewData(result);
    }
  }, [selectedTableId, rowFieldIds, colFieldId, valFieldId, aggFunc]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyToQuery = () => {
    if (onApplyCrosstab) {
      onApplyCrosstab(config, generatedSql);
    } else if (onApplySql) {
      onApplySql(generatedSql);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-bold text-base">Kreuztabellen- & Pivot-Assistent (Crosstab Wizard)</h3>
              <p className="text-xs text-slate-400">Erstellen Sie mehrdimensionale Matrix-Auswertungen (z.B. Lehrberuf × Geschlecht)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Wizard Controls */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Table Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              1. Quelltabelle auswählen
            </label>
            <select
              value={selectedTableId}
              onChange={(e) => {
                setSelectedTableId(e.target.value);
                const t = tables.find((tbl) => tbl.id === e.target.value);
                if (t && t.fields.length >= 3) {
                  setRowFieldIds([t.fields[0].id]);
                  setColFieldId(t.fields[1].id);
                  setValFieldId(t.fields[2].id);
                } else if (t && t.fields.length >= 2) {
                  setRowFieldIds([t.fields[0].id]);
                  setColFieldId(t.fields[1].id);
                  setValFieldId(t.fields[0].id);
                }
              }}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-purple-500 font-semibold"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.fields.length} Felder, {(t.data || []).length} Zeilen)
                </option>
              ))}
            </select>
          </div>

          {/* Matrix Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Rows */}
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                <Rows size={15} className="text-purple-600" /> Zeilenüberschriften
              </label>
              <p className="text-[11px] text-slate-500 mb-2">Gruppierung in den Zeilen (z.B. Lehrberuf, Abteilung)</p>
              <div className="space-y-1 max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white">
                {activeTable?.fields.map((f) => (
                  <label key={f.id} className="flex items-center gap-2 text-xs text-slate-700 hover:bg-slate-50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rowFieldIds.includes(f.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRowFieldIds([...rowFieldIds, f.id]);
                        } else {
                          if (rowFieldIds.length > 1) {
                            setRowFieldIds(rowFieldIds.filter((id) => id !== f.id));
                          }
                        }
                      }}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-mono text-slate-800 font-medium">{f.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Column Headers */}
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                <Columns size={15} className="text-emerald-600" /> Spaltenüberschriften
              </label>
              <p className="text-[11px] text-slate-500 mb-2">Werte werden zu Spalten (z.B. Geschlecht, Status, Jahr)</p>
              <select
                value={colFieldId}
                onChange={(e) => setColFieldId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                {activeTable?.fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.type})
                  </option>
                ))}
              </select>
              {sampleDistinctCols.length > 0 && (
                <div className="mt-2 text-[10px] text-slate-500">
                  <span className="font-semibold text-emerald-800">Erkannte Spaltenwerte: </span>
                  {sampleDistinctCols.join(', ')}
                </div>
              )}
            </div>

            {/* Values / Aggregates */}
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                <Calculator size={15} className="text-amber-600" /> Zellenwert & Funktion
              </label>
              <p className="text-[11px] text-slate-500 mb-2">Zu aggregierendes Feld (z.B. Anzahl von ID)</p>
              <div className="space-y-2">
                <select
                  value={valFieldId}
                  onChange={(e) => setValFieldId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-amber-500 font-semibold"
                >
                  {activeTable?.fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.type})
                    </option>
                  ))}
                </select>

                <div className="flex gap-1">
                  {(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'] as const).map((fn) => (
                    <button
                      key={fn}
                      type="button"
                      onClick={() => setAggFunc(fn)}
                      className={`flex-1 py-1 rounded text-[11px] font-bold transition-colors ${
                        aggFunc === fn
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {fn === 'COUNT' ? 'Anzahl' : fn === 'SUM' ? 'Summe' : fn === 'AVG' ? 'Mittel' : fn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action & Preview Header */}
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-600" /> Live-Matrix-Ergebnis
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>SQL kopieren</span>
            </button>
          </div>

          {/* In-Memory Live Preview Table */}
          {previewData && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 border-b border-slate-200 flex justify-between">
                <span>Berechnete Matrix-Vorschau</span>
                <span>{previewData.rows.length} Ergebniszeilen × {previewData.headers.length} Spalten</span>
              </div>
              <div className="max-h-56 overflow-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 font-bold text-slate-700">
                    <tr>
                      {previewData.headers.map((h, i) => (
                        <th key={i} className={`p-2.5 whitespace-nowrap border-r border-slate-200 last:border-r-0 ${
                          h === 'Gesamtwert' ? 'bg-amber-100/80 text-amber-950 font-black' : 'bg-slate-100'
                        }`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-purple-50/40">
                        {previewData.headers.map((h, cIdx) => (
                          <td key={cIdx} className={`p-2 whitespace-nowrap border-r border-slate-100 last:border-r-0 font-mono ${
                            h === 'Gesamtwert' ? 'bg-amber-50/50 font-bold text-right text-amber-950' : cIdx > 0 ? 'text-right' : 'font-semibold text-slate-800'
                          }`}>
                            {row[h] !== undefined ? String(row[h]) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Generated SQL Preview */}
          <div className="bg-slate-950 p-3.5 rounded-xl text-emerald-400 font-mono text-xs overflow-x-auto max-h-40 border border-slate-800">
            <pre>{generatedSql}</pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-[11px] text-slate-500">
            Kompatibel mit {dbType === DbType.SQL ? 'MS SQL Server (PIVOT)' : 'ANSI SQL (CASE WHEN) & MS Access (TRANSFORM)'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Schließen
            </button>
            <button
              onClick={handleApplyToQuery}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <TableIcon size={14} />
              Kreuztabelle in Designer übernehmen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
