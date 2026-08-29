import React, { useState } from 'react';
import { Field, Relationship } from '../../../types';
import {
  formatCurrencyValue,
  formatPercentageValue,
  formatUnitMeasureValue,
  formatIbanValue,
  isValidIban,
} from '../utils/tableCellFormatters';
import { ValidationError } from '../utils/validationEngine';
import { ExternalLink, AlertCircle, Calculator, Check, Copy } from 'lucide-react';

interface DataCellRendererProps {
  field: Field;
  row: Record<string, any>;
  computedRow: Record<string, any>;
  rowIndex: number;
  colIndex: number;
  relationship?: Relationship;
  validationErrors?: ValidationError[];
  onDataChange: (row: Record<string, any>, header: string, value: any) => void;
  onOpenDetailView?: (targetTableId: string, recordId: any) => void;
  onFocus?: (header: string) => void;
}

export const DataCellRenderer: React.FC<DataCellRendererProps> = ({
  field,
  row,
  computedRow,
  rowIndex,
  colIndex,
  relationship,
  validationErrors = [],
  onDataChange,
  onOpenDetailView,
  onFocus,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const rawVal = computedRow[field.name] ?? '';
  const isAutoInc = field.isAutoIncrement;
  const isCalculated = field.isCalculated || Boolean(field.calculationFormula);
  const isReadOnly = isAutoInc || isCalculated || field.inlineEditable === false;
  const isSoftDelete = field.isSoftDelete;
  const isRowVersion = field.isRowVersion;

  const showLink = Boolean(relationship && rawVal);
  const cellErrors = validationErrors.filter((e) => e.fieldName === field.name);
  const hasError = cellErrors.length > 0;

  // Custom Rendering when NOT in edit mode
  const renderFormattedDisplay = () => {
    if (isCalculated) {
      return (
        <span
          className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-amber-900 truncate"
          title={`⚡ Berechnet: ${field.calculationFormula} = ${String(rawVal)}`}
        >
          {field.type === 'CURRENCY' ? formatCurrencyValue(rawVal, field.currencySymbol) : String(rawVal)}
        </span>
      );
    }

    if (isRowVersion) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-mono font-bold">
          v{rawVal || 1}
        </span>
      );
    }

    if (field.type === 'CURRENCY') {
      return (
        <span className="font-mono text-xs font-semibold text-slate-800 text-right w-full block truncate">
          {formatCurrencyValue(rawVal, field.currencySymbol || '€')}
        </span>
      );
    }

    if (field.type === 'PERCENTAGE') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-mono text-xs font-medium border border-blue-200">
          {formatPercentageValue(rawVal)}
        </span>
      );
    }

    if (field.type === 'UNIT_MEASURE') {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-800">
          <span className="font-semibold">{rawVal}</span>
          <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-600 font-medium">
            {field.unit || 'm²'}
          </span>
        </span>
      );
    }

    if (field.type === 'ORDNUNGSZAHL') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-900 font-mono text-xs font-bold tracking-wider">
          {rawVal || '—'}
        </span>
      );
    }

    if (field.type === 'IBAN') {
      const valid = isValidIban(rawVal);
      return (
        <span
          className={`font-mono text-xs truncate ${valid ? 'text-slate-800' : 'text-amber-700 font-bold'}`}
          title={valid ? 'Gültiges IBAN-Format' : 'IBAN-Format prüfen'}
        >
          {formatIbanValue(rawVal) || '—'}
        </span>
      );
    }

    if (field.type === 'COLOR_HEX') {
      return (
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded border border-slate-300 shadow-2xs shrink-0"
            style={{ backgroundColor: String(rawVal) || '#ffffff' }}
          />
          <span className="font-mono text-[11px] text-slate-600 truncate">{rawVal || '#ffffff'}</span>
        </div>
      );
    }

    if (field.type === 'BOOLEAN') {
      const boolVal = Boolean(rawVal) && String(rawVal).toLowerCase() !== 'false' && String(rawVal) !== '0';
      return (
        <div className="flex items-center justify-center w-full">
          <input
            type="checkbox"
            checked={boolVal}
            disabled={isReadOnly}
            onChange={(e) => onDataChange(row, field.name, e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
        </div>
      );
    }

    if (field.type === 'ENUM') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-medium truncate">
          {rawVal || '—'}
        </span>
      );
    }

    if (field.type === 'DATE' && rawVal) {
      try {
        const d = new Date(rawVal);
        return <span className="text-xs text-slate-700">{!isNaN(d.getTime()) ? d.toLocaleDateString('de-DE') : rawVal}</span>;
      } catch {
        return <span className="text-xs text-slate-700">{rawVal}</span>;
      }
    }

    return <span className="text-xs text-slate-700 truncate">{String(rawVal ?? '')}</span>;
  };

  return (
    <div
      className={`w-40 shrink-0 border-r border-slate-100 h-full relative px-2.5 flex items-center transition-colors group/cell ${
        isAutoInc ? 'bg-slate-50' : isCalculated ? 'bg-amber-50/40' : ''
      } ${hasError ? 'bg-rose-50/70 border-b border-rose-300' : ''}`}
      onDoubleClick={() => !isReadOnly && setIsEditing(true)}
    >
      {/* Active Edit Mode */}
      {isEditing && !isReadOnly ? (
        <div className="flex-1 flex items-center h-full">
          {field.type === 'ENUM' ? (
            <select
              autoFocus
              value={String(rawVal || '')}
              onChange={(e) => onDataChange(row, field.name, e.target.value)}
              onBlur={() => setIsEditing(false)}
              className="w-full text-xs border border-indigo-500 rounded px-1.5 py-0.5 bg-white shadow-sm"
            >
              <option value="">(Leer)</option>
              {(field.enumValues || []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              autoFocus
              type={field.type === 'INTEGER' || field.type === 'DECIMAL' || field.type === 'CURRENCY' || field.type === 'PERCENTAGE' ? 'number' : 'text'}
              step={field.type === 'DECIMAL' || field.type === 'CURRENCY' || field.type === 'PERCENTAGE' ? '0.01' : undefined}
              value={rawVal}
              onChange={(e) => onDataChange(row, field.name, e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="w-full text-xs border border-blue-500 rounded px-1.5 py-0.5 bg-white shadow-sm font-mono"
            />
          )}
        </div>
      ) : (
        /* Display Mode */
        <div
          className="flex-1 flex items-center justify-between w-full overflow-hidden cursor-text"
          onClick={() => {
            onFocus?.(field.name);
            if (!isReadOnly && field.type !== 'BOOLEAN') setIsEditing(true);
          }}
        >
          {renderFormattedDisplay()}
        </div>
      )}

      {/* Foreign Key Link Button */}
      {showLink && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetailView?.(relationship!.toTableId, rawVal);
          }}
          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors ml-1"
          title="Verknüpften Datensatz öffnen"
        >
          <ExternalLink size={12} />
        </button>
      )}

      {/* Validation Error Badge */}
      {hasError && (
        <div
          className="ml-1 text-rose-600 hover:text-rose-800 cursor-pointer shrink-0"
          title={cellErrors.map((e) => e.message).join('\n')}
        >
          <AlertCircle size={13} />
        </div>
      )}
    </div>
  );
};
