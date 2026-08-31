import React, { useState } from 'react';
import { X, Calculator, HelpCircle, Check, Play } from 'lucide-react';
import { Field } from '../../../types';
import { ReportExpressionEngine } from '../utils/reportExpressionEngine';

interface ExpressionBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialExpression: string;
  sourceFields: Field[];
  sampleData?: Record<string, any>[];
  onApplyExpression: (expression: string) => void;
}

export const ExpressionBuilderModal: React.FC<ExpressionBuilderModalProps> = ({
  isOpen,
  onClose,
  initialExpression,
  sourceFields,
  sampleData = [],
  onApplyExpression,
}) => {
  const [expression, setExpression] = useState(initialExpression || '=Summe([Betrag])');
  const [testResult, setTestResult] = useState<string | number>('');

  if (!isOpen) return null;

  const insertToken = (token: string) => {
    setExpression((prev) => prev + token);
  };

  const handleTest = () => {
    const res = ReportExpressionEngine.evaluate(expression, {
      pageNumber: 1,
      totalPages: 3,
      currentDate: new Date(),
      allItems: sampleData,
      groupItems: sampleData.slice(0, 5),
      currentItem: sampleData[0] || {},
    });
    setTestResult(res);
  };

  const handleSave = () => {
    onApplyExpression(expression);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Calculator size={20} className="text-amber-400" />
            <h3 className="font-bold text-base">MS Access Ausdrucks- & Formel-Generator (Expression Builder)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] leading-relaxed">
            <strong>Access-kompatible Syntax:</strong> Verwenden Sie <code>=Summe([Feld])</code>, <code>=Mittelwert([Feld])</code>, <code>=Anzahl([Feld])</code>, oder Seitenausdrücke wie <code>="Seite " & [Seite] & " von " & [Seiten]</code>.
          </div>

          {/* Editor Input */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">Formel-Ausdruck:</label>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="z.B. =Summe([Betrag]) oder =&quot;Seite &quot; & [Seite] & &quot; von &quot; & [Seiten]"
              className="w-full border-2 border-slate-300 focus:border-amber-500 rounded-lg px-3 py-2 text-sm font-mono bg-slate-50 text-slate-900 outline-none"
            />
          </div>

          {/* Quick Insert Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Functions */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Aggregat-Funktionen:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => insertToken('=Summe([')}
                  className="px-2 py-1 bg-white border border-slate-300 hover:bg-amber-50 hover:border-amber-400 rounded text-slate-800 font-mono text-[11px] cursor-pointer"
                >
                  =Summe(...)
                </button>
                <button
                  onClick={() => insertToken('=Mittelwert([')}
                  className="px-2 py-1 bg-white border border-slate-300 hover:bg-amber-50 hover:border-amber-400 rounded text-slate-800 font-mono text-[11px] cursor-pointer"
                >
                  =Mittelwert(...)
                </button>
                <button
                  onClick={() => insertToken('=Anzahl([')}
                  className="px-2 py-1 bg-white border border-slate-300 hover:bg-amber-50 hover:border-amber-400 rounded text-slate-800 font-mono text-[11px] cursor-pointer"
                >
                  =Anzahl(...)
                </button>
                <button
                  onClick={() => insertToken('=Min([')}
                  className="px-2 py-1 bg-white border border-slate-300 hover:bg-amber-50 hover:border-amber-400 rounded text-slate-800 font-mono text-[11px] cursor-pointer"
                >
                  =Min(...)
                </button>
                <button
                  onClick={() => insertToken('=Max([')}
                  className="px-2 py-1 bg-white border border-slate-300 hover:bg-amber-50 hover:border-amber-400 rounded text-slate-800 font-mono text-[11px] cursor-pointer"
                >
                  =Max(...)
                </button>
              </div>
            </div>

            {/* Page & Date Placeholders */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <span className="font-bold text-slate-800 text-[11px] uppercase">Seiten & Zeit:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setExpression('="Seite " & [Seite] & " von " & [Seiten]')}
                  className="px-2 py-1 bg-white border border-slate-300 hover:bg-blue-50 hover:border-blue-400 rounded text-slate-800 font-mono text-[11px] cursor-pointer"
                >
                  Seite X von Y
                </button>
                <button
                  onClick={() => insertToken('[Seite]')}
                  className="px-2 py-1 bg-white border border-slate-300 hover:bg-blue-50 hover:border-blue-400 rounded text-slate-800 font-mono text-[11px] cursor-pointer"
                >
                  [Seite]
                </button>
                <button
                  onClick={() => insertToken('[Seiten]')}
                  className="px-2 py-1 bg-white border border-slate-300 hover:bg-blue-50 hover:border-blue-400 rounded text-slate-800 font-mono text-[11px] cursor-pointer"
                >
                  [Seiten]
                </button>
                <button
                  onClick={() => setExpression('=Datum()')}
                  className="px-2 py-1 bg-white border border-slate-300 hover:bg-blue-50 hover:border-blue-400 rounded text-slate-800 font-mono text-[11px] cursor-pointer"
                >
                  =Datum()
                </button>
              </div>
            </div>
          </div>

          {/* Fields List */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <span className="font-bold text-slate-800 text-[11px] uppercase">Verfügbare Tabellenfelder:</span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {sourceFields.map((f) => (
                <button
                  key={f.id}
                  onClick={() => insertToken(`[${f.name}]`)}
                  className="px-2 py-1 bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-400 rounded text-slate-800 font-mono text-[11px] cursor-pointer"
                  title={`Feld: ${f.name} (${f.type})`}
                >
                  [{f.name}]
                </button>
              ))}
            </div>
          </div>

          {/* Live Test Evaluation */}
          <div className="p-3 border border-slate-300 rounded-lg bg-slate-900 text-white space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                <Play size={13} /> Live Auswertungstest:
              </span>
              <button
                onClick={handleTest}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded text-[11px] cursor-pointer"
              >
                Formel testen
              </button>
            </div>
            <div className="font-mono text-sm bg-slate-950 p-2 rounded border border-slate-800 text-emerald-400 min-h-[32px]">
              {testResult !== '' ? String(testResult) : 'Klicken Sie auf "Formel testen"...'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 font-medium text-xs cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Check size={14} /> Formel übernehmen
          </button>
        </div>
      </div>
    </div>
  );
};
