import React, { useState } from 'react';
import { Calculator, Check, X, Code, Info, AlertCircle } from 'lucide-react';
import { FormElement, Table } from '../../../types/index';

interface FormulaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFormula?: string;
  sourceTable?: Table;
  onSaveFormula: (formula: string) => void;
}

const FORMULA_FUNCTIONS = [
  { name: 'SUM', snippet: 'SUM(subform.NettoBetrag)', desc: 'Summe aller Werte einer Unterformular-Spalte' },
  { name: 'AVG', snippet: 'AVG(subform.Wert)', desc: 'Durchschnittswert' },
  { name: 'COUNT', snippet: 'COUNT(subform.ID)', desc: 'Anzahl der Zeilen' },
  { name: 'MIN', snippet: 'MIN(subform.Preis)', desc: 'Minimalwert' },
  { name: 'MAX', snippet: 'MAX(subform.Preis)', desc: 'Maximalwert' },
  { name: 'DATEDIF', snippet: 'DATEDIF([StartDatum], [EndDatum], "D")', desc: 'Datumsdifferenz in Tagen' },
  { name: 'IF', snippet: 'IF([Betrag] > 1000, [Betrag] * 0.9, [Betrag])', desc: 'Bedingte Logik' },
  { name: 'ROUND', snippet: 'ROUND([GesamtNetto] * 1.19, 2)', desc: 'Kaufmännische Runden auf N Nachkommastellen' },
  { name: 'CONCAT', snippet: 'CONCAT([Vorname], " ", [Nachname])', desc: 'Textzeichenketten zusammenfügen' },
];

export const FormulaEditorModal: React.FC<FormulaEditorModalProps> = ({
  isOpen,
  onClose,
  initialFormula = '',
  sourceTable,
  onSaveFormula,
}) => {
  const [formula, setFormula] = useState(initialFormula);

  if (!isOpen) return null;

  const insertSnippet = (snippet: string) => {
    setFormula((prev) => (prev ? `${prev} ${snippet}` : snippet));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calculator size={20} className="text-amber-400" />
            <div>
              <h3 className="font-bold text-base">Berechnungs- & Formel-Editor</h3>
              <p className="text-xs text-slate-400">Mathematische, Datums-, Text- & Subform-Rollups</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Formula Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Code size={14} className="text-blue-500" /> Formel-Ausdruck:
            </label>
            <textarea
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              rows={4}
              placeholder="z. B. [Menge] * [Einzelpreis] oder SUM(positionen.Netto)"
              className="w-full font-mono text-xs p-3 bg-slate-950 text-emerald-400 rounded-xl border border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed shadow-inner"
            />
          </div>

          {/* Quick Helper Chips for Functions */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Verfügbare Formel-Funktionen:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {FORMULA_FUNCTIONS.map((fn) => (
                <button
                  key={fn.name}
                  type="button"
                  onClick={() => insertSnippet(fn.snippet)}
                  title={fn.desc}
                  className="bg-slate-100 hover:bg-amber-50 hover:border-amber-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {fn.name}()
                </button>
              ))}
            </div>
          </div>

          {/* Available Fields */}
          {sourceTable?.fields && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Verfügbare Tabellenfelder (Einfügen per Klick):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {sourceTable.fields.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => insertSnippet(`[${f.name}]`)}
                    className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium text-[11px] px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800"
                  >
                    [{f.name}]
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800">
            Abbrechen
          </button>
          <button
            onClick={() => {
              onSaveFormula(formula);
              onClose();
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Check size={14} /> Formel Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
};
