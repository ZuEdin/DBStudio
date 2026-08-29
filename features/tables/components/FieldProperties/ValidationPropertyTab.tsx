import React, { useState } from 'react';
import { Field } from '../../../../types';
import { ShieldCheck, Info } from 'lucide-react';

interface ValidationPropertyTabProps {
  field: Field;
  isReadOnly: boolean;
  onUpdate: (updates: Partial<Field>) => void;
}

export const ValidationPropertyTab: React.FC<ValidationPropertyTabProps> = ({
  field,
  isReadOnly,
  onUpdate,
}) => {
  const [enumInput, setEnumInput] = useState('');

  const handleAddEnum = () => {
    if (!enumInput.trim()) return;
    const current = field.enumValues || [];
    if (!current.includes(enumInput.trim())) {
      onUpdate({ enumValues: [...current, enumInput.trim()] });
    }
    setEnumInput('');
  };

  const handleRemoveEnum = (val: string) => {
    onUpdate({ enumValues: (field.enumValues || []).filter((v) => v !== val) });
  };

  return (
    <div className="p-4 space-y-4 text-xs">
      {/* Field Constraint Flags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={field.allowNull === false}
            disabled={isReadOnly || field.isPrimaryKey}
            onChange={(e) => onUpdate({ allowNull: !e.target.checked })}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300"
          />
          <div>
            <span className="font-semibold text-slate-800 block">Pflichtfeld (NOT NULL)</span>
            <span className="text-[11px] text-slate-500">Darf beim Speichern nicht leer bleiben</span>
          </div>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(field.isUnique)}
            disabled={isReadOnly || field.isPrimaryKey}
            onChange={(e) => onUpdate({ isUnique: e.target.checked })}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300"
          />
          <div>
            <span className="font-semibold text-slate-800 block">Eindeutiger Wert (UNIQUE)</span>
            <span className="text-[11px] text-slate-500">Keine Duplikate in dieser Spalte zulassen</span>
          </div>
        </label>
      </div>

      {/* Built-in Domain Type Validators Information */}
      {(field.type === 'IBAN' || field.type === 'BIC' || field.type === 'EMAIL' || field.type === 'ORDNUNGSZAHL' || field.type === 'CURRENCY') && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-start gap-2.5 text-indigo-900">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-[11px]">
            <span className="font-bold">Integrierte Domain-Validierung aktiv: </span>
            {field.type === 'IBAN' && 'Automatische Prüfung der Prüfziffern und Ländercodes (ISO 13616).'}
            {field.type === 'BIC' && 'Formatprüfung für SWIFT/BIC 8 oder 11 Stellen.'}
            {field.type === 'EMAIL' && 'Reguläre Syntaxprüfung für E-Mail-Adressen.'}
            {field.type === 'ORDNUNGSZAHL' && 'GAEB-Gliederungsschema (z.B. 01.02.0030) wird formatkonform überwacht.'}
            {field.type === 'CURRENCY' && 'Präzisions- und Nachkommastellenrundung für Währungsbeträge.'}
          </div>
        </div>
      )}

      {field.type === 'ENUM' ? (
        <div className="space-y-3">
          <label className="font-bold text-slate-700 block">Zulässige Auswahlwerte (Enum Options):</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={enumInput}
              disabled={isReadOnly}
              onChange={(e) => setEnumInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddEnum()}
              placeholder="Neuen Wert eingeben..."
              className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 bg-white"
            />
            <button
              type="button"
              onClick={handleAddEnum}
              disabled={isReadOnly || !enumInput.trim()}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded font-medium disabled:opacity-50"
            >
              Hinzufügen
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded">
            {(field.enumValues || []).map((val) => (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-300 text-slate-700 text-xs shadow-2xs"
              >
                {val}
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEnum(val)}
                    className="text-slate-400 hover:text-red-500 font-bold ml-1"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {(field.enumValues || []).length === 0 && (
              <span className="text-slate-400 italic">Noch keine Werte definiert.</span>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Standardwert (Default Value):</label>
            <input
              type="text"
              value={field.defaultValue || ''}
              disabled={isReadOnly}
              onChange={(e) => onUpdate({ defaultValue: e.target.value })}
              placeholder="z.B. 0, 'aktiv' oder CURRENT_TIMESTAMP"
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
};
