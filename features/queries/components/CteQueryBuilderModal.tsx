import React, { useState } from 'react';
import { X, Layers, Plus, Trash2, Check, GitCommit } from 'lucide-react';
import { Table } from '../../../types/index';

interface CteBlock {
  id: string;
  name: string;
  isRecursive: boolean;
  anchorSql: string;
  recursiveSql: string;
}

interface CteQueryBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  onApplyCteSql: (sql: string) => void;
}

export const CteQueryBuilderModal: React.FC<CteQueryBuilderModalProps> = ({
  isOpen,
  onClose,
  tables,
  onApplyCteSql,
}) => {
  const [ctes, setCtes] = useState<CteBlock[]>([
    {
      id: 'cte_1',
      name: 'HierarchieBaum',
      isRecursive: true,
      anchorSql: `SELECT "ID", "Name", "ParentID", 1 AS "Ebene"\nFROM "${tables[0]?.name || 'Mitarbeiter'}"\nWHERE "ParentID" IS NULL`,
      recursiveSql: `SELECT m."ID", m."Name", m."ParentID", h."Ebene" + 1\nFROM "${tables[0]?.name || 'Mitarbeiter'}" m\nJOIN "HierarchieBaum" h ON m."ParentID" = h."ID"`,
    },
  ]);

  const [mainSelect, setMainSelect] = useState('SELECT * FROM "HierarchieBaum" ORDER BY "Ebene", "Name";');

  if (!isOpen) return null;

  const generateFullCteSql = (): string => {
    if (ctes.length === 0) return mainSelect;

    const hasRecursive = ctes.some((c) => c.isRecursive);
    const withKeyword = hasRecursive ? 'WITH RECURSIVE' : 'WITH';

    const cteDefs = ctes
      .map((c) => {
        if (c.isRecursive) {
          return `${c.name} AS (\n  ${c.anchorSql}\n  UNION ALL\n  ${c.recursiveSql}\n)`;
        }
        return `${c.name} AS (\n  ${c.anchorSql}\n)`;
      })
      .join(',\n\n');

    return `${withKeyword} ${cteDefs}\n\n${mainSelect}`;
  };

  const fullSql = generateFullCteSql();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <GitCommit size={20} className="text-purple-400" />
            <h3 className="font-bold text-base">CTE (Common Table Expressions) & Rekursions-Builder</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {ctes.map((cte, idx) => (
            <div key={cte.id} className="border border-slate-300 rounded-lg p-4 bg-slate-50 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800">CTE #{idx + 1} Name:</span>
                  <input
                    type="text"
                    value={cte.name}
                    onChange={(e) => {
                      const updated = [...ctes];
                      updated[idx].name = e.target.value;
                      setCtes(updated);
                    }}
                    className="border border-slate-300 rounded px-2 py-1 font-mono font-bold text-xs bg-white"
                  />
                  <label className="flex items-center gap-1.5 text-purple-700 font-semibold cursor-pointer ml-2">
                    <input
                      type="checkbox"
                      checked={cte.isRecursive}
                      onChange={(e) => {
                        const updated = [...ctes];
                        updated[idx].isRecursive = e.target.checked;
                        setCtes(updated);
                      }}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Rekursiv (UNION ALL Hierarchie)</span>
                  </label>
                </div>

                {ctes.length > 1 && (
                  <button
                    onClick={() => setCtes(ctes.filter((c) => c.id !== cte.id))}
                    className="text-rose-600 hover:text-rose-800"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Anchor SQL */}
              <div>
                <label className="block font-bold mb-1 text-slate-700">
                  {cte.isRecursive ? '1. Anker-Abfrage (Start-Knoten):' : 'Abfrage-Definition:'}
                </label>
                <textarea
                  rows={3}
                  value={cte.anchorSql}
                  onChange={(e) => {
                    const updated = [...ctes];
                    updated[idx].anchorSql = e.target.value;
                    setCtes(updated);
                  }}
                  className="w-full font-mono text-xs border border-slate-300 rounded p-2 bg-white"
                />
              </div>

              {/* Recursive SQL */}
              {cte.isRecursive && (
                <div>
                  <label className="block font-bold mb-1 text-purple-800">
                    2. Rekursions-Abfrage (UNION ALL Verknüpfung):
                  </label>
                  <textarea
                    rows={3}
                    value={cte.recursiveSql}
                    onChange={(e) => {
                      const updated = [...ctes];
                      updated[idx].recursiveSql = e.target.value;
                      setCtes(updated);
                    }}
                    className="w-full font-mono text-xs border border-purple-200 rounded p-2 bg-purple-50/50"
                  />
                </div>
              )}
            </div>
          ))}

          {/* Main SQL */}
          <div>
            <label className="block font-bold mb-1 text-slate-800">Haupt-SELECT Anweisung:</label>
            <input
              type="text"
              value={mainSelect}
              onChange={(e) => setMainSelect(e.target.value)}
              className="w-full font-mono text-xs border border-slate-300 rounded p-2 bg-white"
            />
          </div>

          {/* Complete Generated SQL Preview */}
          <div>
            <label className="block font-bold mb-1 text-slate-800 font-mono">Generiertes CTE SQL:</label>
            <div className="bg-slate-900 text-emerald-400 p-3 rounded font-mono text-xs overflow-x-auto border border-slate-800 whitespace-pre">
              {fullSql}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex justify-between items-center">
          <button
            onClick={() =>
              setCtes([
                ...ctes,
                {
                  id: `cte_${Date.now()}`,
                  name: `SubQuery_${ctes.length + 1}`,
                  isRecursive: false,
                  anchorSql: `SELECT * FROM "${tables[0]?.name || 'Tabelle'}"`,
                  recursiveSql: '',
                },
              ])
            }
            className="flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900"
          >
            <Plus size={14} /> CTE hinzufügen
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3.5 py-1.5 rounded border border-slate-300 bg-white font-medium">
              Abbrechen
            </button>
            <button
              onClick={() => {
                onApplyCteSql(fullSql);
                onClose();
              }}
              className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <Check size={14} />
              <span>CTE-Abfrage übernehmen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
