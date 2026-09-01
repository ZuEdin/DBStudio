import React, { useState } from 'react';
import { X, Layers, Check, AlertTriangle } from 'lucide-react';
import { Table, Query } from '../../../types/index';

interface SetOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  queries: Query[];
  tables: Table[];
  onApplySql: (sql: string) => void;
}

export const SetOperationsModal: React.FC<SetOperationsModalProps> = ({
  isOpen,
  onClose,
  queries,
  tables,
  onApplySql,
}) => {
  const [operator, setOperator] = useState<'UNION ALL' | 'UNION' | 'INTERSECT' | 'EXCEPT'>('UNION ALL');
  const [query1Sql, setQuery1Sql] = useState(`SELECT "ID", "Name", 'Kunde' AS "Typ" FROM "${tables[0]?.name || 'Kunden'}"`);
  const [query2Sql, setQuery2Sql] = useState(`SELECT "ID", "Name", 'Lieferant' AS "Typ" FROM "${tables[1]?.name || tables[0]?.name || 'Lieferanten'}"`);

  if (!isOpen) return null;

  const combinedSql = `${query1Sql}\n${operator}\n${query2Sql};`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[300] p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Layers size={20} className="text-teal-400" />
            <h3 className="font-bold text-base">Mengen-Operatoren (UNION / INTERSECT / EXCEPT)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700">
          <div>
            <label className="block font-bold mb-1 text-slate-800">1. Erste Teil-Abfrage (SELECT A):</label>
            <textarea
              rows={3}
              value={query1Sql}
              onChange={(e) => setQuery1Sql(e.target.value)}
              className="w-full font-mono text-xs border border-slate-300 rounded p-2 bg-white"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-slate-800">Mengen-Operator wählen:</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: 'UNION ALL', desc: 'Alle Zeilen inkl. Duplikate' },
                { name: 'UNION', desc: 'Eindeutige Zeilen (ohne Duplikate)' },
                { name: 'INTERSECT', desc: 'Nur Schnittmenge (in A & B)' },
                { name: 'EXCEPT', desc: 'Differenzmenge (in A aber nicht in B)' },
              ].map((op) => (
                <button
                  key={op.name}
                  onClick={() => setOperator(op.name as any)}
                  className={`p-2 rounded border text-left transition ${
                    operator === op.name
                      ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold shadow-2xs'
                      : 'bg-white border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold">{op.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{op.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1 text-slate-800">2. Zweite Teil-Abfrage (SELECT B):</label>
            <textarea
              rows={3}
              value={query2Sql}
              onChange={(e) => setQuery2Sql(e.target.value)}
              className="w-full font-mono text-xs border border-slate-300 rounded p-2 bg-white"
            />
          </div>

          {/* Validation Hint */}
          <div className="flex items-center gap-2 text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200 text-[11px]">
            <AlertTriangle size={15} className="shrink-0 text-amber-600" />
            <span>
              <strong>Spalten-Kompatibilität:</strong> Beide SELECT-Anweisungen müssen die gleiche Anzahl an Spalten
              und kompatible Datentypen zurückliefern.
            </span>
          </div>

          {/* Combined Preview */}
          <div>
            <label className="block font-bold mb-1 text-slate-800">Generierter SQL Code:</label>
            <div className="bg-slate-900 text-teal-400 p-3 rounded font-mono text-xs overflow-x-auto border border-slate-800 whitespace-pre">
              {combinedSql}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-3.5 py-1.5 rounded border border-slate-300 bg-white font-medium">
            Abbrechen
          </button>
          <button
            onClick={() => {
              onApplySql(combinedSql);
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5 shadow-2xs"
          >
            <Check size={14} />
            <span>Mengen-Abfrage übernehmen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
