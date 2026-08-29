import React from 'react';
import { Calculator, Sparkles } from 'lucide-react';
import { Field } from '../../../../types';

interface ComputedPropertyTabProps {
  field: Field;
  availableFields: Field[];
  isReadOnly: boolean;
  onUpdate: (updates: Partial<Field>) => void;
}

export const ComputedPropertyTab: React.FC<ComputedPropertyTabProps> = ({
  field,
  availableFields,
  isReadOnly,
  onUpdate,
}) => {
  const otherFields = availableFields.filter((f) => f.id !== field.id);

  const insertField = (name: string) => {
    const current = field.calculationFormula || '';
    onUpdate({
      calculationFormula: `${current} [${name}]`.trim(),
      isCalculated: true,
    });
  };

  return (
    <div className="p-4 space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(field.isCalculated)}
            disabled={isReadOnly}
            onChange={(e) =>
              onUpdate({
                isCalculated: e.target.checked,
                calculationFormula: e.target.checked ? field.calculationFormula || '' : undefined,
              })
            }
            className="rounded text-amber-600"
          />
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-amber-600" /> Als berechnete Spalte (Generated Column) deklarieren
          </span>
        </label>
      </div>

      {field.isCalculated && (
        <div className="space-y-3 bg-amber-50/50 p-3.5 rounded-lg border border-amber-200">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Berechnungsformel / SQL-Ausdruck:</label>
            <input
              type="text"
              value={field.calculationFormula || ''}
              disabled={isReadOnly}
              onChange={(e) => onUpdate({ calculationFormula: e.target.value })}
              placeholder="z.B. [quantity] * [unit_price]"
              className="w-full border border-slate-300 rounded px-3 py-2 font-mono text-xs bg-white focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-600 mb-1 block flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" /> Feld einfügen:
            </span>
            <div className="flex flex-wrap gap-1">
              {otherFields.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => insertField(f.name)}
                  className="px-2 py-0.5 text-[11px] bg-white border border-slate-300 rounded text-slate-700 hover:bg-amber-100 font-mono shadow-2xs"
                >
                  [{f.name}]
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-amber-200 flex items-center gap-6">
            <span className="font-bold text-slate-700">Persistenz-Modus:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="storedModeInline"
                checked={!field.isStored}
                disabled={isReadOnly}
                onChange={() => onUpdate({ isStored: false })}
                className="text-amber-600"
              />
              <span>VIRTUAL (On-The-Fly)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="storedModeInline"
                checked={Boolean(field.isStored)}
                disabled={isReadOnly}
                onChange={() => onUpdate({ isStored: true })}
                className="text-amber-600"
              />
              <span>STORED (Physisch abgelegt)</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
