import React, { useState } from 'react';
import { Table, Field } from '../../../types/index';
import { TableIndex, TableCheckConstraint, IndexType } from '../types/erDesignerTypes';
import { 
  KeyRound, 
  Zap, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Info 
} from 'lucide-react';

interface IndexConstraintDesignerModalProps {
  table: Table;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTable: (table: Table) => void;
}

export const IndexConstraintDesignerModal: React.FC<IndexConstraintDesignerModalProps> = ({
  table,
  isOpen,
  onClose,
  onUpdateTable,
}) => {
  const [activeTab, setActiveTab] = useState<'indexes' | 'checks' | 'composite_pk'>('indexes');
  const [indexes, setIndexes] = useState<TableIndex[]>((table as any).indexes || []);
  const [checks, setChecks] = useState<TableCheckConstraint[]>((table as any).checkConstraints || []);
  const [selectedPkFieldIds, setSelectedPkFieldIds] = useState<string[]>(
    table.fields.filter(f => f.isPrimaryKey).map(f => f.id)
  );

  if (!isOpen) return null;

  const handleAddIndex = () => {
    const newIdx: TableIndex = {
      id: crypto.randomUUID(),
      name: `idx_${table.name}_${table.fields[0]?.name || 'col'}`,
      tableId: table.id,
      columnNames: [table.fields[0]?.name || 'id'],
      type: 'BTREE',
      isUnique: false
    };
    setIndexes(prev => [...prev, newIdx]);
  };

  const handleRemoveIndex = (idxId: string) => {
    setIndexes(prev => prev.filter(i => i.id !== idxId));
  };

  const handleAddCheck = () => {
    const newChk: TableCheckConstraint = {
      id: crypto.randomUUID(),
      name: `chk_${table.name}_positive_amount`,
      tableId: table.id,
      expression: `${table.fields[0]?.name || 'amount'} > 0`
    };
    setChecks(prev => [...prev, newChk]);
  };

  const handleRemoveCheck = (chkId: string) => {
    setChecks(prev => prev.filter(c => c.id !== chkId));
  };

  const handleTogglePkField = (fieldId: string) => {
    setSelectedPkFieldIds(prev => 
      prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
    );
  };

  const handleSave = () => {
    const updatedTable: Table = {
      ...table,
      fields: table.fields.map(f => ({
        ...f,
        isPrimaryKey: selectedPkFieldIds.includes(f.id)
      })),
      ...({ indexes, checkConstraints: checks } as any)
    };

    onUpdateTable(updatedTable);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-3xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Indizes & Constraints: <span className="font-mono text-blue-600">{table.name}</span>
              </h2>
              <p className="text-xs text-neutral-500">BTREE/GIN/HASH Indizes, Composite Primary Keys und CHECK-Constraints</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 px-3 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('indexes')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'indexes'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Zap size={14} />
            Indizes ({indexes.length})
          </button>
          <button
            onClick={() => setActiveTab('composite_pk')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'composite_pk'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <KeyRound size={14} />
            Composite Primary Key ({selectedPkFieldIds.length})
          </button>
          <button
            onClick={() => setActiveTab('checks')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'checks'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <ShieldCheck size={14} />
            CHECK-Bedingungen ({checks.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'indexes' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Definieren Sie Performance-Indizes für schnelle Lookups und JOINs</span>
                <button
                  onClick={handleAddIndex}
                  className="px-2.5 py-1 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus size={13} />
                  Index hinzufügen
                </button>
              </div>

              {indexes.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  Noch keine benutzerdefinierten Indizes angelegt.
                </div>
              ) : (
                indexes.map((idx, i) => (
                  <div key={idx.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-neutral-500">Index-Name</label>
                        <input
                          type="text"
                          value={idx.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setIndexes(prev => prev.map((item, index) => index === i ? { ...item, name: val } : item));
                          }}
                          className="w-full px-2 py-1 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-neutral-500">Typ</label>
                        <select
                          value={idx.type}
                          onChange={(e: any) => {
                            const val = e.target.value;
                            setIndexes(prev => prev.map((item, index) => index === i ? { ...item, type: val } : item));
                          }}
                          className="w-full px-2 py-1 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                        >
                          <option value="BTREE">BTREE (Standard)</option>
                          <option value="HASH">HASH (Gleichheit)</option>
                          <option value="GIN">GIN (JSON / Arrays)</option>
                          <option value="GiST">GiST (Geometrie)</option>
                          <option value="BRIN">BRIN (Große Zeitreihen)</option>
                          <option value="UNIQUE">UNIQUE Index</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-neutral-500">Spalte(n)</label>
                        <select
                          value={idx.columnNames[0] || ''}
                          onChange={(e) => {
                            const col = e.target.value;
                            setIndexes(prev => prev.map((item, index) => index === i ? { ...item, columnNames: [col] } : item));
                          }}
                          className="w-full px-2 py-1 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                        >
                          {table.fields.map(f => (
                            <option key={f.id} value={f.name}>{f.name} ({f.type})</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={idx.isUnique}
                            onChange={(e) => {
                              const val = e.target.checked;
                              setIndexes(prev => prev.map((item, index) => index === i ? { ...item, isUnique: val } : item));
                            }}
                            className="rounded text-amber-500"
                          />
                          <span>Eindeutig</span>
                        </label>
                        <button
                          onClick={() => handleRemoveIndex(idx.id)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'composite_pk' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
                <Info size={16} className="shrink-0 mt-0.5" />
                <span>
                  Wählen Sie die Spalten aus, die gemeinsam den zusammengesetzten Primärschlüssel (Composite Primary Key) bilden.
                </span>
              </div>

              <div className="space-y-1.5">
                {table.fields.map(field => {
                  const isChecked = selectedPkFieldIds.includes(field.id);
                  return (
                    <label
                      key={field.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                          : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePkField(field.id)}
                          className="rounded text-amber-500"
                        />
                        <span className="font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200">{field.name}</span>
                        <span className="text-[11px] text-neutral-400">({field.type})</span>
                      </div>
                      {isChecked && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                          <KeyRound size={11} />
                          PK-Teil
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'checks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Integritätsbedingungen zur Validierung gültiger Wertebereiche</span>
                <button
                  onClick={handleAddCheck}
                  className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus size={13} />
                  CHECK hinzufügen
                </button>
              </div>

              {checks.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  Noch keine CHECK-Constraints hinterlegt.
                </div>
              ) : (
                checks.map((chk, i) => (
                  <div key={chk.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-neutral-500">Constraint-Name</label>
                        <input
                          type="text"
                          value={chk.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setChecks(prev => prev.map((item, index) => index === i ? { ...item, name: val } : item));
                          }}
                          className="w-full px-2 py-1 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] font-semibold text-neutral-500">SQL-Bedingung</label>
                          <input
                            type="text"
                            value={chk.expression}
                            placeholder="z.B. age >= 18 OR price > 0"
                            onChange={(e) => {
                              const val = e.target.value;
                              setChecks(prev => prev.map((item, index) => index === i ? { ...item, expression: val } : item));
                            }}
                            className="w-full px-2 py-1 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-emerald-600"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveCheck(chk.id)}
                          className="mt-4 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Check size={14} />
            <span>Übernehmen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
