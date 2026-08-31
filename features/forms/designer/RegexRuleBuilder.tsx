import React, { useState } from 'react';
import { Check, X, AlertCircle, Sparkles, HelpCircle, Play } from 'lucide-react';
import { FormValidationRule } from '../../../types/index';
import { VALIDATION_PRESETS, testRegexPattern } from '../utils/formValidationEngine';

interface RegexRuleBuilderProps {
  rule: FormValidationRule;
  onUpdate: (updates: Partial<FormValidationRule>) => void;
}

export const RegexRuleBuilder: React.FC<RegexRuleBuilderProps> = ({ rule, onUpdate }) => {
  const [testString, setTestString] = useState<string>('');
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('');

  const currentPattern = rule.regexPattern || '';
  const testResult = testRegexPattern(currentPattern, testString);

  const handleSelectPreset = (presetKey: string) => {
    setSelectedPresetKey(presetKey);
    if (!presetKey) return;

    const preset = VALIDATION_PRESETS[presetKey];
    if (preset) {
      onUpdate({
        regexPattern: preset.pattern,
        errorMessage: rule.errorMessage || preset.defaultMessage,
      });
      setTestString(preset.example);
    }
  };

  return (
    <div className="space-y-2.5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
      {/* Preset Selector */}
      <div>
        <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Sparkles size={11} className="text-amber-500" />
            Standard-Muster (Presets):
          </span>
          <span className="text-[9px] text-slate-400 font-normal">DE / EU Formate</span>
        </label>
        <select
          value={selectedPresetKey}
          onChange={(e) => handleSelectPreset(e.target.value)}
          className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-semibold bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
        >
          <option value="">-- Benutzerdefiniertes Regex --</option>
          {Object.entries(VALIDATION_PRESETS).map(([key, item]) => (
            <option key={key} value={key}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* Regex Pattern Input */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <label className="text-[10px] font-bold text-slate-600">RegEx Ausdruck (Pattern):</label>
          <span className="text-[9px] font-mono text-slate-400">/muster/</span>
        </div>
        <input
          type="text"
          value={currentPattern}
          onChange={(e) => onUpdate({ regexPattern: e.target.value })}
          placeholder="z. B. ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
          className="w-full border border-slate-300 rounded px-2 py-1 text-[11px] font-mono bg-white text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
        />
        {!testResult.isValid && (
          <div className="mt-1 text-[10px] font-semibold text-rose-600 flex items-center gap-1">
            <AlertCircle size={11} />
            <span>Syntaxfehler: {testResult.error}</span>
          </div>
        )}
      </div>

      {/* Live Regex Simulator / Test Sandbox */}
      <div className="bg-white p-2 rounded border border-indigo-100 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-indigo-900 flex items-center gap-1">
            <Play size={10} className="text-indigo-600 fill-indigo-500" />
            Echtzeit-Muster-Tester (Simulator):
          </span>
          {currentPattern && testString && (
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${
                testResult.isValid && testResult.matches
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {testResult.isValid && testResult.matches ? (
                <>
                  <Check size={10} strokeWidth={3} /> Gültig (Match)
                </>
              ) : (
                <>
                  <X size={10} strokeWidth={3} /> Keine Übereinstimmung
                </>
              )}
            </span>
          )}
        </div>

        <input
          type="text"
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="Beispielwert eingeben zum Testen..."
          className="w-full border border-slate-200 rounded px-2 py-1 text-xs bg-slate-50/70 focus:bg-white text-slate-800 outline-none"
        />
      </div>
    </div>
  );
};
