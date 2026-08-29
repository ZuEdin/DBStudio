import React, { useState } from 'react';
import { Calculator, X, Check, HelpCircle, Sparkles } from 'lucide-react';
import { Field } from '../../../types';

interface ComputedColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: Field;
  availableFields: Field[];
  onSave: (updates: Partial<Field>) => void;
}

export const ComputedColumnModal: React.FC<ComputedColumnModalProps> = ({
  isOpen,
  onClose,
  field,
  availableFields,
  onSave,
}) => {
  const [formula, setFormula] = useState(field.calculationFormula || '');
  const [isStored, setIsStored] = useState(field.isStored ?? false);

  if (!isOpen) return null;

  const otherFields = availableFields.filter((f) => f.id !== field.id);

  const insertField = (name: string) => {
    setFormula((prev) => `${prev} [${name}]`.trim());
  };

  const handleSave = () => {
    onSave({
      isCalculated: Boolean(formula.trim()),
      calculationFormula: formula.trim(),
      isStored,
    });
    onClose();
  };

  const handleClear = () => {
    onSave({
      isCalculated: false,
      calculationFormula: undefined,
      isStored: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Berechnete Spalte konfigurieren</h3>
              <p className="text-xs text-slate-400">Feld: <span className="font-mono text-amber-300 font-bold">{field.name}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-sm">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              Berechnungsformel / SQL-Ausdruck:
            </label>
            <textarea
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="z.B. [quantity] * [unit_price] oder [net_amount] * 1.19"
              rows={3}
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50"
            />
          </div>

          {/* Quick field chips */}
          <div>
            <span className="text-xs font-semibold text-slate-600 mb-1.5 block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Verfügbare Tabellenfelder einfügen:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
              {otherFields.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => insertField(f.name)}
                  className="px-2 py-1 text-xs bg-white border border-slate-300 rounded text-slate-700 hover:bg-amber-50 hover:border-amber-400 font-mono transition-colors shadow-2xs"
                >
                  [{f.name}] <span className="text-[10px] text-slate-400">({f.type})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Storage Mode */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Speicherungs-Modus (DDL):</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className={`p-2.5 rounded-lg border cursor-pointer flex flex-col gap-1 transition-colors ${!isStored ? 'bg-white border-amber-500 ring-1 ring-amber-500' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="storageMode"
                    checked={!isStored}
                    onChange={() => setIsStored(false)}
                    className="text-amber-600"
                  />
                  <span className="font-bold text-slate-800">VIRTUAL</span>
                </div>
                <span className="text-[10px] text-slate-500">Wird bei jeder Abfrage dynamisch berechnet. Spart Speicherplatz.</span>
              </label>

              <label className={`p-2.5 rounded-lg border cursor-pointer flex flex-col gap-1 transition-colors ${isStored ? 'bg-white border-amber-500 ring-1 ring-amber-500' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="storageMode"
                    checked={isStored}
                    onChange={() => setIsStored(true)}
                    className="text-amber-600"
                  />
                  <span className="font-bold text-slate-800">STORED</span>
                </div>
                <span className="text-[10px] text-slate-500">Wird physisch gespeichert und kann indiziert werden.</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleClear}
            className="text-xs text-rose-600 hover:text-rose-800 font-medium"
          >
            Formel entfernen
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" /> Formel übernehmen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
