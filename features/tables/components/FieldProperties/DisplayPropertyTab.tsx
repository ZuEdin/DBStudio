import React from 'react';
import { Field } from '../../../../types';

interface DisplayPropertyTabProps {
  field: Field;
  isReadOnly: boolean;
  onUpdate: (updates: Partial<Field>) => void;
}

export const DisplayPropertyTab: React.FC<DisplayPropertyTabProps> = ({
  field,
  isReadOnly,
  onUpdate,
}) => {
  return (
    <div className="p-4 space-y-4 text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Renderer Type */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">Darstellungs-Widget (UI-Renderer):</label>
          <select
            value={field.rendererType || 'text'}
            disabled={isReadOnly}
            onChange={(e) => onUpdate({ rendererType: e.target.value as any })}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-blue-500"
          >
            <option value="text">Standard-Text / Wert</option>
            <option value="currency">Währungsbetrag (€ / $)</option>
            <option value="status_pill">Status-Badge / Pill</option>
            <option value="progress">Fortschrittsbalken (0-100%)</option>
            <option value="date">Formatiertes Datum</option>
            <option value="avatar">Avatar / Bild-Icon</option>
            <option value="markdown">Rich Text / Markdown</option>
          </select>
        </div>

        {/* Display Format Mask */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">Format-Maske / Formatierung:</label>
          <input
            type="text"
            value={field.displayFormat || ''}
            disabled={isReadOnly}
            onChange={(e) => onUpdate({ displayFormat: e.target.value })}
            placeholder="z.B. DD.MM.YYYY oder #,##0.00 €"
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-mono"
          />
        </div>
      </div>

      {/* Unit and Currency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Mengeneinheit (Suffix):</label>
          <input
            type="text"
            value={field.unit || ''}
            disabled={isReadOnly}
            onChange={(e) => onUpdate({ unit: e.target.value })}
            placeholder="z.B. m², Stk, Std, kg, to"
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Währungssymbol:</label>
          <select
            value={field.currencySymbol || '€'}
            disabled={isReadOnly}
            onChange={(e) => onUpdate({ currencySymbol: e.target.value })}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
          >
            <option value="€">EUR (€)</option>
            <option value="$">USD ($)</option>
            <option value="CHF">CHF (Schweizer Franken)</option>
            <option value="£">GBP (£)</option>
          </select>
        </div>
      </div>

      {/* Inline Editing Toggle */}
      <div className="pt-2 border-t border-slate-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={field.inlineEditable !== false}
            disabled={isReadOnly || field.isPrimaryKey || field.isCalculated}
            onChange={(e) => onUpdate({ inlineEditable: e.target.checked })}
            className="rounded text-blue-600"
          />
          <span className="font-medium text-slate-700">
            Direktes Editieren in Tabellengrids erlauben (Inline Editing)
          </span>
        </label>
      </div>
    </div>
  );
};
