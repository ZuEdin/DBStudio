import React, { useState } from 'react';
import { X, Sliders, Plus, Trash2, Check, Sparkles } from 'lucide-react';
import { Table } from '../../../types/index';
import { WindowFunctionConfig, buildWindowFunctionSql } from '../utils/windowFunctionBuilder';

interface WindowFunctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  onApplySql: (sql: string) => void;
}

export const WindowFunctionModal: React.FC<WindowFunctionModalProps> = ({
  isOpen,
  onClose,
  tables,
  onApplySql,
}) => {
  const allFields = tables.flatMap((t) => t.fields.map((f) => ({ table: t.name, field: f.name })));

  const [config, setConfig] = useState<WindowFunctionConfig>({
    functionName: 'ROW_NUMBER',
    targetField: allFields[0]?.field || 'ID',
    leadLagOffset: 1,
    partitionByFields: [],
    orderByFields: [{ field: allFields[0]?.field || 'ID', direction: 'ASC' }],
    frameSpec: '',
    alias: 'RangNummer',
  });

  if (!isOpen) return null;

  const generatedSql = buildWindowFunctionSql(config);

  const togglePartitionField = (field: string) => {
    setConfig((prev) => ({
      ...prev,
      partitionByFields: prev.partitionByFields.includes(field)
        ? prev.partitionByFields.filter((f) => f !== field)
        : [...prev.partitionByFields, field],
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Sliders size={20} className="text-blue-400" />
            <h3 className="font-bold text-base">Window Functions & Analytik Builder</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {/* Function Selector */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1 text-slate-800">Funktion (Analytik):</label>
              <select
                value={config.functionName}
                onChange={(e) => setConfig({ ...config, functionName: e.target.value as any })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-medium bg-white"
              >
                <option value="ROW_NUMBER">ROW_NUMBER() - Fortlaufende Nummer</option>
                <option value="RANK">RANK() - Rangfolge (mit Lücken)</option>
                <option value="DENSE_RANK">DENSE_RANK() - Lückenlose Rangfolge</option>
                <option value="LEAD">LEAD() - Wert der Folgezeile</option>
                <option value="LAG">LAG() - Wert der Vorherigen Zeile</option>
                <option value="SUM">SUM() OVER () - Kumulierte Summe</option>
                <option value="AVG">AVG() OVER () - Gleitender Durchschnitt</option>
                <option value="NTILE">NTILE(n) - Perzentil / Quartil</option>
                <option value="FIRST_VALUE">FIRST_VALUE() - Erster Wert der Gruppe</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-800">Spalten-Alias:</label>
              <input
                type="text"
                value={config.alias}
                onChange={(e) => setConfig({ ...config, alias: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono text-xs"
                placeholder="SpaltenAlias"
              />
            </div>
          </div>

          {/* Target field for value window functions */}
          {['SUM', 'AVG', 'LEAD', 'LAG', 'FIRST_VALUE'].includes(config.functionName) && (
            <div>
              <label className="block font-bold mb-1 text-slate-800">Ziel-Feld für Berechnung:</label>
              <select
                value={config.targetField}
                onChange={(e) => setConfig({ ...config, targetField: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-mono"
              >
                {allFields.map((f, i) => (
                  <option key={i} value={f.field}>
                    {f.table}.{f.field}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Partition By */}
          <div>
            <label className="block font-bold mb-1 text-slate-800">PARTITION BY (Gruppierung):</label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded max-h-24 overflow-y-auto">
              {allFields.map((f, i) => {
                const isSelected = config.partitionByFields.includes(f.field);
                return (
                  <button
                    key={i}
                    onClick={() => togglePartitionField(f.field)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {f.table}.{f.field}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generated SQL Preview */}
          <div>
            <label className="block font-bold mb-1 text-slate-800">Vorschau (SQL Window Expression):</label>
            <div className="bg-slate-900 text-emerald-400 p-3 rounded font-mono text-xs overflow-x-auto border border-slate-800">
              {generatedSql}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex justify-between items-center">
          <span className="text-slate-500 text-[11px]">Unterstützt PostgreSQL, SQLite, MySQL 8+, MSSQL, Oracle</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 font-medium"
            >
              Abbrechen
            </button>
            <button
              onClick={() => {
                onApplySql(generatedSql);
                onClose();
              }}
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <Check size={14} />
              <span>In Abfrage übernehmen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
