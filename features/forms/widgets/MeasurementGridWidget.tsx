import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, Hash, ArrowUpDown, CheckCircle, AlertCircle } from 'lucide-react';

export interface MeasurementRow {
  id: string;
  pos: string;
  description: string;
  formula: string;
  factor: number;
  quantity: number;
  unit: string;
  isValid: boolean;
  errorMessage?: string;
}

interface MeasurementGridWidgetProps {
  id: string;
  label?: string;
  value?: any;
  isReadOnly?: boolean;
  defaultUnit?: string;
  onChange: (value: any) => void;
}

// Safe evaluation of mathematical formula strings without eval()
const evaluateMathFormula = (formulaStr: string): { result: number; isValid: boolean; error?: string } => {
  if (!formulaStr || !formulaStr.trim()) {
    return { result: 0, isValid: true };
  }

  try {
    // Sanitize: allow numbers, parentheses, decimal dots, commas, +, -, *, /
    const sanitized = formulaStr.replace(/,/g, '.').replace(/\s+/g, '');
    if (!/^[0-9+\-*/().]+$/.test(sanitized)) {
      return { result: 0, isValid: false, error: 'Ungültige Zeichen im Rechenansatz' };
    }

    // Evaluate safely using Function constructor for pure arithmetic
    // eslint-disable-next-line no-new-func
    const calcFunc = new Function(`return (${sanitized});`);
    const val = calcFunc();
    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      return { result: Math.round(val * 1000) / 1000, isValid: true };
    }
    return { result: 0, isValid: false, error: 'Rechenfehler' };
  } catch (err: any) {
    return { result: 0, isValid: false, error: 'Syntaxfehler' };
  }
};

export const MeasurementGridWidget: React.FC<MeasurementGridWidgetProps> = ({
  id,
  label = 'Aufmaß-Schnelleingabe',
  value,
  isReadOnly = false,
  defaultUnit = 'm²',
  onChange,
}) => {
  const [rows, setRows] = useState<MeasurementRow[]>(() => {
    if (value) {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // fallback string
        }
      }
    }
    return [
      {
        id: crypto.randomUUID(),
        pos: '1.1',
        description: 'Hauptfläche / Grundriss',
        formula: '12.50 * 8.40',
        factor: 1,
        quantity: 105,
        unit: defaultUnit,
        isValid: true,
      },
      {
        id: crypto.randomUUID(),
        pos: '1.2',
        description: 'Abzug Aussparung Treppe',
        formula: '3.20 * 1.80',
        factor: -1,
        quantity: -5.76,
        unit: defaultUnit,
        isValid: true,
      },
    ];
  });

  const totalQuantity = rows.reduce((sum, r) => sum + (r.isValid ? r.quantity * (r.factor || 1) : 0), 0);

  const updateRow = (rowId: string, updates: Partial<MeasurementRow>) => {
    if (isReadOnly) return;
    const newRows = rows.map((r) => {
      if (r.id !== rowId) return r;
      const updated = { ...r, ...updates };

      if ('formula' in updates || 'factor' in updates) {
        const evalRes = evaluateMathFormula(updated.formula);
        updated.isValid = evalRes.isValid;
        updated.errorMessage = evalRes.error;
        updated.quantity = evalRes.isValid ? evalRes.result : 0;
      }
      return updated;
    });
    setRows(newRows);
    onChange(newRows);
  };

  const addRow = () => {
    if (isReadOnly) return;
    const newIndex = rows.length + 1;
    const newRow: MeasurementRow = {
      id: crypto.randomUUID(),
      pos: `1.${newIndex}`,
      description: '',
      formula: '',
      factor: 1,
      quantity: 0,
      unit: defaultUnit,
      isValid: true,
    };
    const newRows = [...rows, newRow];
    setRows(newRows);
    onChange(newRows);
  };

  const removeRow = (rowId: string) => {
    if (isReadOnly) return;
    const newRows = rows.filter((r) => r.id !== rowId);
    setRows(newRows);
    onChange(newRows);
  };

  return (
    <div id={id} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator size={16} className="text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
            Aufmaß-Grid
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Gesamt: <span className="font-mono text-emerald-600 dark:text-emerald-400">{totalQuantity.toFixed(2)}</span> {defaultUnit}
          </span>
          {!isReadOnly && (
            <button
              type="button"
              onClick={addRow}
              className="text-xs bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-200 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus size={13} /> Zeile hinzufügen
            </button>
          )}
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-2 px-2.5 w-16">Pos</th>
              <th className="py-2 px-2.5">Bezeichnung / Bauteil</th>
              <th className="py-2 px-2.5 w-48">Rechenansatz (Formel)</th>
              <th className="py-2 px-2.5 w-16 text-center">Faktor</th>
              <th className="py-2 px-2.5 w-24 text-right">Menge</th>
              <th className="py-2 px-2.5 w-16 text-center">Einh.</th>
              {!isReadOnly && <th className="py-2 px-2 w-10 text-center"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row) => {
              const rowTotal = (row.quantity || 0) * (row.factor || 1);
              return (
                <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Pos */}
                  <td className="p-1.5">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={row.pos}
                      onChange={(e) => updateRow(row.id, { pos: e.target.value })}
                      className="w-full bg-transparent text-slate-800 dark:text-slate-200 font-mono px-1 py-1 rounded border border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 outline-none"
                    />
                  </td>
                  {/* Description */}
                  <td className="p-1.5">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="z.B. Achse A-D Wandfläche"
                      value={row.description}
                      onChange={(e) => updateRow(row.id, { description: e.target.value })}
                      className="w-full bg-transparent text-slate-800 dark:text-slate-200 px-1.5 py-1 rounded border border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 outline-none"
                    />
                  </td>
                  {/* Formula */}
                  <td className="p-1.5">
                    <div className="relative">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="(L+B)*H"
                        value={row.formula}
                        onChange={(e) => updateRow(row.id, { formula: e.target.value })}
                        className={`w-full font-mono text-xs px-2 py-1 rounded border outline-none ${
                          !row.isValid
                            ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                        }`}
                      />
                      {!row.isValid && (
                        <div
                          title={row.errorMessage}
                          className="absolute right-2 top-1.5 text-rose-500 cursor-help"
                        >
                          <AlertCircle size={13} />
                        </div>
                      )}
                    </div>
                  </td>
                  {/* Factor */}
                  <td className="p-1.5 text-center">
                    <input
                      type="number"
                      disabled={isReadOnly}
                      step="any"
                      value={row.factor}
                      onChange={(e) => updateRow(row.id, { factor: parseFloat(e.target.value) || 1 })}
                      className="w-14 text-center font-mono text-xs px-1 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                    />
                  </td>
                  {/* Result Quantity */}
                  <td className="p-1.5 text-right font-mono font-bold">
                    <span className={rowTotal < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}>
                      {row.isValid ? rowTotal.toFixed(2) : '-'}
                    </span>
                  </td>
                  {/* Unit */}
                  <td className="p-1.5 text-center">
                    <select
                      disabled={isReadOnly}
                      value={row.unit}
                      onChange={(e) => updateRow(row.id, { unit: e.target.value })}
                      className="bg-transparent text-slate-600 dark:text-slate-300 text-xs outline-none cursor-pointer"
                    >
                      <option value="m²">m²</option>
                      <option value="m³">m³</option>
                      <option value="m">m</option>
                      <option value="Stk">Stk</option>
                      <option value="kg">kg</option>
                      <option value="to">to</option>
                      <option value="Std">Std</option>
                      <option value="Psch">Psch</option>
                    </select>
                  </td>
                  {/* Actions */}
                  {!isReadOnly && (
                    <td className="p-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length <= 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                        title="Zeile entfernen"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {/* Footer Total */}
          <tfoot className="bg-slate-50 dark:bg-slate-950 font-bold border-t border-slate-200 dark:border-slate-700">
            <tr>
              <td colSpan={4} className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                Aufmaß-Gesamtsumme ({defaultUnit}):
              </td>
              <td className="py-2.5 px-2.5 text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                {totalQuantity.toFixed(2)}
              </td>
              <td className="py-2.5 px-2 text-center text-slate-500">{defaultUnit}</td>
              {!isReadOnly && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
