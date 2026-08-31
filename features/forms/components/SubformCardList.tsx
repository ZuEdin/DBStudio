import React from 'react';
import { Plus, Edit2, Trash2, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { Table, Form } from '../../../types/index';

interface SubformCardListProps {
  subformDef: Form;
  subTable: Table;
  dataRows: Record<string, any>[];
  columns: { id: string; fieldId: string; label: string }[];
  isReadOnly?: boolean;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onEditRecord: (record: Record<string, any>) => void;
  onDeleteRecord: (record: Record<string, any>) => void;
  onAddRecord: () => void;
}

export const SubformCardList: React.FC<SubformCardListProps> = ({
  subformDef,
  subTable,
  dataRows,
  columns,
  isReadOnly = false,
  canAdd = true,
  canEdit = true,
  canDelete = true,
  onEditRecord,
  onDeleteRecord,
  onAddRecord,
}) => {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <LayoutGrid size={16} className="text-blue-600 dark:text-blue-400" />
          <span className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200">
            {subformDef.name} ({dataRows.length})
          </span>
        </div>
        {!isReadOnly && canAdd && (
          <button
            type="button"
            onClick={onAddRecord}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus size={14} /> Neu
          </button>
        )}
      </div>

      {dataRows.length === 0 ? (
        <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40">
          <p className="text-slate-400 text-xs mb-2">Keine Einträge vorhanden.</p>
          {!isReadOnly && canAdd && (
            <button
              type="button"
              onClick={onAddRecord}
              className="text-blue-600 dark:text-blue-400 font-semibold text-xs hover:underline inline-flex items-center gap-1"
            >
              <Plus size={12} /> Ersten Eintrag anlegen
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {dataRows.map((rowItem, idx) => (
            <div
              key={rowItem.id || idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    #{idx + 1}
                  </span>
                  <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full">
                    Pos. {idx + 1}
                  </span>
                </div>

                <div className="space-y-1">
                  {columns.map((col) => {
                    const f = subTable.fields.find((field) => field.id === col.fieldId);
                    const fieldName = f?.name || col.fieldId;
                    const val = rowItem[fieldName];

                    return (
                      <div key={col.id || col.fieldId} className="flex justify-between items-baseline text-xs">
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                          {col.label || f?.name}:
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[150px]">
                          {val !== undefined && val !== null ? String(val) : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {!isReadOnly && (canEdit || canDelete) && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onEditRecord(rowItem)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-2 py-1 rounded font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Edit2 size={12} /> Bearbeiten
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onDeleteRecord(rowItem)}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-1 rounded font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={12} /> Löschen
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
