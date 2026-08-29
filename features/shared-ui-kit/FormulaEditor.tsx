import React, { useState } from 'react';
import { Calculator } from 'lucide-react';

interface FormulaEditorProps {
  value: string;
  onChange: (val: string) => void;
  availableFields?: string[];
  placeholder?: string;
  id?: string;
}

export const FormulaEditor: React.FC<FormulaEditorProps> = ({
  value,
  onChange,
  availableFields = [],
  placeholder = 'z.B. [Menge] * [Einzelpreis]',
  id = 'formula_editor_input',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const insertField = (field: string) => {
    onChange(`${value} [${field}]`);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none pr-8"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-2.5 text-slate-400 hover:text-blue-600"
          title="Felder einfügen"
        >
          <Calculator className="w-4 h-4" />
        </button>
      </div>

      {isOpen && availableFields.length > 0 && (
        <div className="p-2 bg-slate-50 border border-slate-200 rounded-md">
          <p className="text-xs text-slate-500 mb-1 font-medium">Verfügbare Felder:</p>
          <div className="flex flex-wrap gap-1">
            {availableFields.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => insertField(f)}
                className="px-2 py-0.5 text-xs bg-white border border-slate-300 rounded text-slate-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                [{f}]
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
