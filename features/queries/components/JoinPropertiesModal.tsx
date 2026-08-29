import React from 'react';
import { Relationship, JoinType, Table } from '../../../types';
import { GitCommit, X, Check, ArrowRight, ArrowLeft, ArrowLeftRight, HelpCircle } from 'lucide-react';

interface JoinPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  relationship: Relationship;
  tables: Table[];
  onSave: (updatedRel: Relationship) => void;
}

export const JoinPropertiesModal: React.FC<JoinPropertiesModalProps> = ({
  isOpen,
  onClose,
  relationship,
  tables,
  onSave,
}) => {
  if (!isOpen) return null;

  const fromTable = tables.find((t) => t.id === relationship.fromTableId || t.name === relationship.fromTableId);
  const toTable = tables.find((t) => t.id === relationship.toTableId || t.name === relationship.toTableId);

  const fromField = fromTable?.fields.find((f) => f.id === relationship.fromFieldId || f.name === relationship.fromFieldId);
  const toField = toTable?.fields.find((f) => f.id === relationship.toFieldId || f.name === relationship.toFieldId);

  const fromName = fromTable?.name || 'Tabelle 1';
  const toName = toTable?.name || 'Tabelle 2';
  const fromFieldName = fromField?.name || 'Feld 1';
  const toFieldName = toField?.name || 'Feld 2';

  const [selectedJoin, setSelectedJoin] = React.useState<JoinType>(relationship.joinType || 'LEFT');

  const joinOptions: { type: JoinType; title: string; description: string; sqlName: string; icon: any }[] = [
    {
      type: 'INNER',
      title: '1: Nur Datensätze einschließen, bei denen die Inhalte beider Tabellen übereinstimmen',
      description: `Gibt nur Zeilen zurück, wenn ${fromName}.${fromFieldName} = ${toName}.${toFieldName} existiert (Schnittmenge).`,
      sqlName: 'INNER JOIN',
      icon: GitCommit,
    },
    {
      type: 'LEFT',
      title: `2: ALLE Datensätze aus '${fromName}' und nur die passenden aus '${toName}'`,
      description: `Standard. Behält jeden Eintrag der Basistabelle '${fromName}', auch wenn keine Verknüpfung vorliegt.`,
      sqlName: 'LEFT OUTER JOIN',
      icon: ArrowRight,
    },
    {
      type: 'RIGHT',
      title: `3: ALLE Datensätze aus '${toName}' und nur die passenden aus '${fromName}'`,
      description: `Behält jeden Eintrag der Zieltabelle '${toName}', auch wenn die Quelltabelle leer ist.`,
      sqlName: 'RIGHT OUTER JOIN',
      icon: ArrowLeft,
    },
    {
      type: 'FULL',
      title: `4: ALLE Datensätze aus beiden Tabellen einschließen (Vollständigkeitsanalyse)`,
      description: `Gibt alle Zeilen aus beiden Tabellen aus; füllt fehlende Werte mit NULL auf.`,
      sqlName: 'FULL OUTER JOIN',
      icon: ArrowLeftRight,
    },
  ];

  const handleApply = () => {
    onSave({
      ...relationship,
      joinType: selectedJoin,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">Verknüpfungs-Eigenschaften (Join Properties)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Join Connection Summary */}
        <div className="bg-indigo-50/60 px-6 py-3 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
          <div>
            <span className="font-semibold text-slate-700">Linke Tabelle: </span>
            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">{fromName}.{fromFieldName}</span>
          </div>
          <span className="font-bold text-indigo-500">↔</span>
          <div>
            <span className="font-semibold text-slate-700">Rechte Tabelle: </span>
            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">{toName}.{toFieldName}</span>
          </div>
        </div>

        {/* Join Options (Access-style) */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {joinOptions.map((opt) => {
            const isSelected = selectedJoin === opt.type;
            const Icon = opt.icon;

            return (
              <div
                key={opt.type}
                onClick={() => setSelectedJoin(opt.type)}
                className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="joinOption"
                  checked={isSelected}
                  onChange={() => setSelectedJoin(opt.type)}
                  className="mt-1 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-slate-800 text-sm">{opt.title}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200 shrink-0">
                      {opt.sqlName}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{opt.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <HelpCircle size={13} />
            <span>Bestimmt, wie verknüpfte Zeilen im SQL-Statement kombiniert werden.</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check size={14} />
              Übernehmen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
