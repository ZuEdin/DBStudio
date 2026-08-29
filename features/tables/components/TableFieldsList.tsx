import React from 'react';
import { Field, FieldType } from '../../../types';
import { DATA_TYPES } from '../../../config/dataTypes';
import { Key, GripVertical, Trash2, Hash, Sparkles, Plus, Calculator } from 'lucide-react';

interface TableFieldsListProps {
  fields: Field[];
  selectedFieldId: string | null;
  onSelectField: (id: string) => void;
  onUpdateField: (id: string, updates: Partial<Field>) => void;
  onRemoveField: (id: string) => void;
  onAddField: () => void;
  onOpenSequenceModal: (field: Field) => void;
  onOpenComputedModal: (field: Field) => void;
  isReadOnly: boolean;
  draggedFieldIndex: number | null;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

export const TableFieldsList: React.FC<TableFieldsListProps> = ({
  fields,
  selectedFieldId,
  onSelectField,
  onUpdateField,
  onRemoveField,
  onAddField,
  onOpenSequenceModal,
  onOpenComputedModal,
  isReadOnly,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
        <span>Felderliste ({fields.length} Felder)</span>
        <span className="text-[11px] text-slate-500 font-normal">
          Klicken Sie auf eine Zeile, um unten die Feldeigenschaften &amp; Formeln zu bearbeiten.
        </span>
      </div>

      <div className="max-h-72 overflow-y-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <th className="p-2 w-6 text-center"></th>
              {!isReadOnly && <th className="p-2 w-8"></th>}
              <th className="p-2 w-10 text-center" title="Primärschlüssel">PK</th>
              <th className="p-2 w-1/4">Feldname</th>
              <th className="p-2 w-48">Datentyp</th>
              <th className="p-2 w-16 text-center" title="Erlaubt NULL-Werte">Null</th>
              <th className="p-2 w-20 text-center" title="Automatisch hochzählen">Auto</th>
              <th className="p-2 flex-1">Standard / Berechnete Formel</th>
              <th className="p-2 w-1/4">Kommentar</th>
              {!isReadOnly && <th className="p-2 w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {fields.map((field, idx) => {
              const isSelected = selectedFieldId === field.id;
              const isCalculated = Boolean(field.calculationFormula || field.isCalculated);

              return (
                <tr
                  key={field.id}
                  onClick={() => onSelectField(field.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50/90 font-medium text-slate-900 border-l-4 border-l-blue-600'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                  draggable={!isReadOnly}
                  onDragStart={(e) => onDragStart(e, idx)}
                  onDragOver={(e) => onDragOver(e, idx)}
                  onDrop={(e) => onDrop(e, idx)}
                >
                  <td className="p-2 text-center text-blue-600 font-bold text-xs">
                    {isSelected ? '▶' : ''}
                  </td>
                  {!isReadOnly && (
                    <td className="p-2 text-center cursor-move text-slate-300 hover:text-slate-500">
                      <GripVertical size={16} />
                    </td>
                  )}
                  <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      disabled={isReadOnly}
                      onClick={() =>
                        onUpdateField(field.id, {
                          isPrimaryKey: !field.isPrimaryKey,
                          allowNull: field.isPrimaryKey,
                        })
                      }
                      className={`p-1 rounded ${
                        field.isPrimaryKey ? 'text-amber-500' : 'text-slate-300'
                      } ${!isReadOnly ? 'hover:bg-slate-200' : ''}`}
                      title="Primärschlüssel umschalten"
                    >
                      <Key size={16} />
                    </button>
                  </td>
                  <td className="p-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={field.name}
                      disabled={isReadOnly}
                      onChange={(e) => onUpdateField(field.id, { name: e.target.value })}
                      className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-sm disabled:text-slate-500 font-medium"
                    />
                  </td>
                  <td className="p-2" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={field.type}
                      disabled={isReadOnly}
                      onChange={(e) => onUpdateField(field.id, { type: e.target.value as FieldType })}
                      className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-xs disabled:text-slate-500"
                    >
                      {Object.entries(DATA_TYPES).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={field.allowNull !== false}
                      disabled={field.isPrimaryKey || isReadOnly}
                      onChange={(e) => onUpdateField(field.id, { allowNull: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                    {field.sequenceConfig?.enabled ? (
                      <button
                        disabled={isReadOnly}
                        onClick={() => onOpenSequenceModal(field)}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-mono font-bold hover:bg-emerald-200 transition-colors"
                        title={`Nummernkreis: ${field.sequenceConfig.prefix || ''}000...`}
                      >
                        <Sparkles size={10} className="text-emerald-600" />
                        {field.sequenceConfig.prefix ? field.sequenceConfig.prefix.replace('-', '') : 'SEQ'}
                      </button>
                    ) : field.type === 'INTEGER' ? (
                      <button
                        disabled={isReadOnly}
                        onClick={() => onUpdateField(field.id, { isAutoIncrement: !field.isAutoIncrement })}
                        className={`p-1 rounded ${field.isAutoIncrement ? 'text-green-600' : 'text-slate-300'} ${!isReadOnly ? 'hover:bg-slate-200' : ''}`}
                        title="Auto-Inkrement umschalten"
                      >
                        <Hash size={16} />
                      </button>
                    ) : (
                      <button
                        disabled={isReadOnly}
                        onClick={() => onOpenSequenceModal(field)}
                        className="p-1 rounded text-slate-300 hover:text-blue-600 hover:bg-slate-200 transition-colors opacity-60 hover:opacity-100"
                        title="Nummernkreis einrichten"
                      >
                        <Hash size={14} />
                      </button>
                    )}
                  </td>
                  <td className="p-2" onClick={(e) => e.stopPropagation()}>
                    {isCalculated ? (
                      <button
                        type="button"
                        onClick={() => onOpenComputedModal(field)}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-xs font-mono font-bold cursor-pointer transition-colors"
                        title="Berechnete Spalte anpassen"
                      >
                        <Calculator size={12} className="text-amber-700" />
                        ⚡ {field.calculationFormula || 'Berechnet'}
                      </button>
                    ) : field.type === 'ENUM' ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-semibold">
                          🏷️ {(field.enumValues || []).length} Werte
                        </span>
                        {field.defaultValue && (
                          <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            = {String(field.defaultValue)}
                          </span>
                        )}
                      </div>
                    ) : field.defaultValue ? (
                      <span className="text-xs text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        = {String(field.defaultValue)}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenComputedModal(field)}
                        className="text-xs text-slate-400 hover:text-amber-600 italic hover:not-italic flex items-center gap-1"
                        title="Als berechnete Formel definieren"
                      >
                        (Standard / + Formel)
                      </button>
                    )}
                  </td>
                  <td className="p-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={field.comment || ''}
                      disabled={isReadOnly}
                      onChange={(e) => onUpdateField(field.id, { comment: e.target.value })}
                      placeholder="Kommentar..."
                      className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-xs text-slate-600 disabled:text-slate-400"
                    />
                  </td>
                  {!isReadOnly && (
                    <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onRemoveField(field.id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Feld löschen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isReadOnly && (
        <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onAddField}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-bold px-2 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            <Plus size={16} /> Neues Feld hinzufügen
          </button>
        </div>
      )}
    </div>
  );
};
