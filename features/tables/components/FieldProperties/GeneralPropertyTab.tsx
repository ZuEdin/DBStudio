import React from 'react';
import { Field, FieldType } from '../../../../types';
import { DATA_TYPES } from '../../../../config/dataTypes';

interface GeneralPropertyTabProps {
  field: Field;
  isReadOnly: boolean;
  onUpdate: (updates: Partial<Field>) => void;
}

export const GeneralPropertyTab: React.FC<GeneralPropertyTabProps> = ({
  field,
  isReadOnly,
  onUpdate,
}) => {
  const typeConfig = DATA_TYPES[field.type];

  return (
    <div className="p-4 space-y-4 text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Field Name */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">Feldname (technisch):</label>
          <input
            type="text"
            value={field.name}
            disabled={isReadOnly}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono bg-white focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Datatype Selection */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">Datentyp:</label>
          <select
            value={field.type}
            disabled={isReadOnly}
            onChange={(e) => onUpdate({ type: e.target.value as FieldType })}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-blue-500"
          >
            {Object.entries(DATA_TYPES).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Field Length / Precision */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {typeConfig?.hasLength && (
          <div>
            <label className="font-bold text-slate-700 block mb-1">Feldgröße (Länge):</label>
            <input
              type="number"
              value={field.length ?? typeConfig.defaultLength ?? 255}
              disabled={isReadOnly}
              onChange={(e) => onUpdate({ length: parseInt(e.target.value, 10) || undefined })}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
            />
          </div>
        )}

        {typeConfig?.hasPrecision && (
          <>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Genauigkeit (Precision):</label>
              <input
                type="number"
                value={field.precision ?? typeConfig.defaultPrecision ?? 18}
                disabled={isReadOnly}
                onChange={(e) => onUpdate({ precision: parseInt(e.target.value, 10) || undefined })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nachkommastellen (Scale):</label>
              <input
                type="number"
                value={field.scale ?? typeConfig.defaultScale ?? 2}
                disabled={isReadOnly}
                onChange={(e) => onUpdate({ scale: parseInt(e.target.value, 10) || undefined })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
              />
            </div>
          </>
        )}
      </div>

      {/* Default Value & Comment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Standardwert (Default):</label>
          <input
            type="text"
            value={field.defaultValue || ''}
            disabled={isReadOnly || field.isAutoIncrement}
            onChange={(e) => onUpdate({ defaultValue: e.target.value })}
            placeholder="z.B. CURRENT_TIMESTAMP oder 0"
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
          />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Kommentar / Feldbeschreibung:</label>
          <input
            type="text"
            value={field.comment || ''}
            disabled={isReadOnly}
            onChange={(e) => onUpdate({ comment: e.target.value })}
            placeholder="Hinweis für Entwickler & Benutzer"
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
          />
        </div>
      </div>

      {/* Constraints */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={field.isPrimaryKey || false}
            disabled={isReadOnly}
            onChange={(e) => onUpdate({ isPrimaryKey: e.target.checked, allowNull: !e.target.checked })}
            className="rounded text-blue-600"
          />
          <span className="font-medium text-slate-700">🔑 Primärschlüssel</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={field.allowNull !== false}
            disabled={isReadOnly || field.isPrimaryKey}
            onChange={(e) => onUpdate({ allowNull: e.target.checked })}
            className="rounded text-blue-600"
          />
          <span className="font-medium text-slate-700">Nullwerte erlauben (Nullable)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={field.isUnique || false}
            disabled={isReadOnly}
            onChange={(e) => onUpdate({ isUnique: e.target.checked })}
            className="rounded text-blue-600"
          />
          <span className="font-medium text-slate-700">Eindeutig (Unique)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={field.isIndexed || false}
            disabled={isReadOnly}
            onChange={(e) => onUpdate({ isIndexed: e.target.checked })}
            className="rounded text-blue-600"
          />
          <span className="font-medium text-slate-700">Indizieren (Index)</span>
        </label>
      </div>
    </div>
  );
};
