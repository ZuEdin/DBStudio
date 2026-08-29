import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, X, Check, AlertTriangle, Play } from 'lucide-react';
import { Table, ValidationRule, ValidationOperator } from '../../../types';
import { validateTableRecord, ValidationError } from '../utils/validationEngine';

interface ValidationRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table;
  onUpdateRules: (rules: ValidationRule[]) => void;
}

export const ValidationRulesModal: React.FC<ValidationRulesModalProps> = ({
  isOpen,
  onClose,
  table,
  onUpdateRules,
}) => {
  const [rules, setRules] = useState<ValidationRule[]>(table.validationRules || []);
  const [testResults, setTestResults] = useState<{ total: number; failed: number; errors: ValidationError[] } | null>(
    null
  );

  if (!isOpen) return null;

  const handleAddRule = () => {
    const firstField = table.fields[0];
    const newRule: ValidationRule = {
      id: crypto.randomUUID(),
      fieldId: firstField?.id || firstField?.name || 'field_1',
      operator: 'gt',
      compareType: 'value',
      compareValue: '0',
      errorMessage: `Wert muss größer als 0 sein.`,
    };
    setRules([...rules, newRule]);
  };

  const handleUpdateRule = (index: number, updates: Partial<ValidationRule>) => {
    const next = [...rules];
    next[index] = { ...next[index], ...updates };
    setRules(next);
  };

  const handleDeleteRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onUpdateRules(rules);
    onClose();
  };

  const handleRunValidationTest = () => {
    const rawData = table.data || [];
    let failedCount = 0;
    const allErrors: ValidationError[] = [];

    const tempTable: Table = { ...table, validationRules: rules };

    rawData.forEach((row, idx) => {
      const errs = validateTableRecord(row, tempTable);
      if (errs.length > 0) {
        failedCount++;
        allErrors.push(...errs.map((e) => ({ ...e, rowId: idx + 1 })));
      }
    });

    setTestResults({
      total: rawData.length,
      failed: failedCount,
      errors: allErrors,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Gültigkeits- &amp; Validierungsregeln ({table.name})</h3>
              <p className="text-xs text-slate-400">Prüfbedingungen für Frontend-Eingabe &amp; Backend-Synchronisation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Aktive Regeln ({rules.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunValidationTest}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 border border-slate-300"
              >
                <Play className="w-3.5 h-3.5 text-indigo-600" /> Auf Datenbestand testen
              </button>
              <button
                type="button"
                onClick={handleAddRule}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg flex items-center gap-1 border border-indigo-200"
              >
                <Plus className="w-3.5 h-3.5" /> Neue Regel
              </button>
            </div>
          </div>

          {/* Test Results banner */}
          {testResults && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                testResults.failed === 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <span className="font-semibold">
                {testResults.failed === 0
                  ? `✓ Alle ${testResults.total} Datensätze erfüllen sämtliche Validierungsregeln!`
                  : `⚠ ${testResults.failed} von ${testResults.total} Datensätzen verletzen eine oder mehrere Regeln (${testResults.errors.length} Fehler).`}
              </span>
              <span className="font-mono text-[11px]">{testResults.errors.length} Befunde</span>
            </div>
          )}

          {/* Rules List */}
          {rules.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
              Keine Validierungsregeln definiert. Klicke auf &quot;Neue Regel&quot;, um Feldbedingungen wie Wertebereiche,
              Regex oder Datumsvergleiche hinzuzufügen.
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, idx) => {
                const targetField = table.fields.find((f) => f.id === rule.fieldId || f.name === rule.fieldId);
                return (
                  <div key={rule.id || idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2">
                      {/* Field Selection */}
                      <select
                        value={rule.fieldId}
                        onChange={(e) => handleUpdateRule(idx, { fieldId: e.target.value })}
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800"
                      >
                        {table.fields.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.type})
                          </option>
                        ))}
                      </select>

                      {/* Operator */}
                      <select
                        value={rule.operator}
                        onChange={(e) => handleUpdateRule(idx, { operator: e.target.value as ValidationOperator })}
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-indigo-700"
                      >
                        <option value="gt">&gt; (Größer als)</option>
                        <option value="gte">&gt;= (Größer gleich)</option>
                        <option value="lt">&lt; (Kleiner als)</option>
                        <option value="lte">&lt;= (Kleiner gleich)</option>
                        <option value="eq">= (Gleich)</option>
                        <option value="neq">!= (Ungleich)</option>
                        <option value="regex">RegEx (Muster)</option>
                      </select>

                      {/* Compare Type */}
                      <select
                        value={rule.compareType}
                        onChange={(e) => handleUpdateRule(idx, { compareType: e.target.value as 'value' | 'field' })}
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-600"
                      >
                        <option value="value">Fester Wert</option>
                        <option value="field">Anderes Feld</option>
                      </select>

                      {/* Compare Value */}
                      {rule.compareType === 'field' ? (
                        <select
                          value={rule.compareValue}
                          onChange={(e) => handleUpdateRule(idx, { compareValue: e.target.value })}
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs flex-1"
                        >
                          <option value="">Feld wählen...</option>
                          {table.fields
                            .filter((f) => f.id !== rule.fieldId)
                            .map((f) => (
                              <option key={f.id} value={f.name}>
                                {f.name}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={rule.compareValue}
                          onChange={(e) => handleUpdateRule(idx, { compareValue: e.target.value })}
                          placeholder="z.B. 0 oder ^[A-Z]+$"
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs flex-1 font-mono"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteRule(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title="Regel löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Custom Error Message */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 shrink-0">Fehlermeldung:</span>
                      <input
                        type="text"
                        value={rule.errorMessage || ''}
                        onChange={(e) => handleUpdateRule(idx, { errorMessage: e.target.value })}
                        placeholder="z.B. Der Betrag muss positiv sein."
                        className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs flex-1"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800">
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Check className="w-4 h-4" /> Regeln speichern ({rules.length})
          </button>
        </div>
      </div>
    </div>
  );
};
