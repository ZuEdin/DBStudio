import React, { useState } from 'react';
import { Sliders, Plus, Trash2, Check, X, Shield, Eye, Lock } from 'lucide-react';
import { Form, FormElement, Table } from '../../../types/index';

interface ConditionRulesBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form;
  sourceTable?: Table;
  onSaveForm: (updatedForm: Form) => void;
}

export interface ConditionalRule {
  id: string;
  name: string;
  matchType: 'AND' | 'OR';
  conditions: {
    fieldId: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'not_empty' | 'empty';
    value: string;
  }[];
  actions: {
    targetElementId: string;
    effect: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'optional';
  }[];
}

export const ConditionRulesBuilderModal: React.FC<ConditionRulesBuilderModalProps> = ({
  isOpen,
  onClose,
  form,
  sourceTable,
  onSaveForm,
}) => {
  const [rules, setRules] = useState<ConditionalRule[]>(() => (form as any).conditionalRules || []);

  if (!isOpen) return null;

  const handleAddRule = () => {
    const newRule: ConditionalRule = {
      id: crypto.randomUUID(),
      name: `Regel ${rules.length + 1}`,
      matchType: 'AND',
      conditions: [{ fieldId: sourceTable?.fields[0]?.id || '', operator: 'eq', value: '' }],
      actions: [{ targetElementId: form.fields[0]?.fieldId || '', effect: 'show' }],
    };
    setRules([...rules, newRule]);
  };

  const handleRemoveRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const handleSave = () => {
    onSaveForm({
      ...form,
      conditionalRules: rules,
    } as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders size={20} className="text-blue-400" />
            <div>
              <h3 className="font-bold text-base">Visueller No-Code Regel-Builder</h3>
              <p className="text-xs text-slate-400">Bedingte Sichtbarkeit, Pflichtfelder & Logik steuern</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {rules.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40">
              <Eye size={32} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Keine Regeln definiert</p>
              <p className="text-xs text-slate-400 mb-4">Erstellen Sie bedingte Verhaltensregeln für Felder und Unterformulare.</p>
              <button
                type="button"
                onClick={handleAddRule}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs inline-flex items-center gap-2 shadow-sm"
              >
                <Plus size={14} /> Erste Regel hinzufügen
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule, ruleIdx) => (
                <div
                  key={rule.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/40 space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      value={rule.name}
                      onChange={(e) => {
                        const next = [...rules];
                        next[ruleIdx].name = e.target.value;
                        setRules(next);
                      }}
                      className="font-bold text-sm bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-slate-800 dark:text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(rule.id)}
                      className="text-rose-600 hover:text-rose-700 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Conditions List */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      WENN (Bedingungen):
                    </span>
                    {rule.conditions.map((cond, cIdx) => (
                      <div key={cIdx} className="flex items-center gap-2 text-xs">
                        <select
                          value={cond.fieldId}
                          onChange={(e) => {
                            const next = [...rules];
                            next[ruleIdx].conditions[cIdx].fieldId = e.target.value;
                            setRules(next);
                          }}
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1.5 font-medium"
                        >
                          {sourceTable?.fields.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={cond.operator}
                          onChange={(e) => {
                            const next = [...rules];
                            next[ruleIdx].conditions[cIdx].operator = e.target.value as any;
                            setRules(next);
                          }}
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1.5 font-medium"
                        >
                          <option value="eq">Gleich (==)</option>
                          <option value="neq">Ungleich (!=)</option>
                          <option value="gt">Größer als (&gt;)</option>
                          <option value="lt">Kleiner als (&lt;)</option>
                          <option value="contains">Enthält</option>
                          <option value="not_empty">Nicht leer</option>
                          <option value="empty">Ist leer</option>
                        </select>

                        <input
                          type="text"
                          value={cond.value}
                          onChange={(e) => {
                            const next = [...rules];
                            next[ruleIdx].conditions[cIdx].value = e.target.value;
                            setRules(next);
                          }}
                          placeholder="Wert"
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1.5"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Actions List */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      DANN (Aktionen):
                    </span>
                    {rule.actions.map((act, aIdx) => (
                      <div key={aIdx} className="flex items-center gap-2 text-xs">
                        <select
                          value={act.effect}
                          onChange={(e) => {
                            const next = [...rules];
                            next[ruleIdx].actions[aIdx].effect = e.target.value as any;
                            setRules(next);
                          }}
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1.5 font-semibold text-blue-600 dark:text-blue-400"
                        >
                          <option value="show">Einblenden</option>
                          <option value="hide">Ausblenden</option>
                          <option value="enable">Aktivieren (Schreibbar)</option>
                          <option value="disable">Sperren (Read-Only)</option>
                          <option value="require">Als Pflichtfeld markieren</option>
                          <option value="optional">Gleich optional machen</option>
                        </select>

                        <select
                          value={act.targetElementId}
                          onChange={(e) => {
                            const next = [...rules];
                            next[ruleIdx].actions[aIdx].targetElementId = e.target.value;
                            setRules(next);
                          }}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1.5 font-medium"
                        >
                          {sourceTable?.fields.map((f) => (
                            <option key={f.id} value={f.id}>
                              Feld: {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddRule}
                className="w-full py-2.5 border-2 border-dashed border-blue-300 dark:border-blue-800 rounded-xl text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Weitere Regel hinzufügen
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800">
            Abbrechen
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm">
            <Check size={14} /> Regeln Speichern
          </button>
        </div>
      </div>
    </div>
  );
};
