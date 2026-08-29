import React, { useState } from 'react';
import { Database, Sliders, Eye, CheckSquare, Calculator } from 'lucide-react';
import { Field } from '../../../../types';
import { GeneralPropertyTab } from './GeneralPropertyTab';
import { DisplayPropertyTab } from './DisplayPropertyTab';
import { ValidationPropertyTab } from './ValidationPropertyTab';
import { ComputedPropertyTab } from './ComputedPropertyTab';

interface FieldPropertiesPanelProps {
  field: Field;
  availableFields: Field[];
  isReadOnly: boolean;
  onUpdate: (updates: Partial<Field>) => void;
}

export const FieldPropertiesPanel: React.FC<FieldPropertiesPanelProps> = ({
  field,
  availableFields,
  isReadOnly,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'display' | 'validation' | 'computed'>('general');

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm mt-6">
      {/* Top Banner */}
      <div className="bg-slate-800 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={15} className="text-amber-400" />
          <span>
            Feldeigenschaften: <span className="text-amber-300 font-mono font-semibold">{field.name}</span>{' '}
            <span className="text-slate-400 font-normal">({field.type})</span>
          </span>
        </div>
        <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Access Design Mode</span>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-100 text-xs px-2 pt-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t font-semibold transition-colors ${
            activeTab === 'general'
              ? 'bg-white border-t border-x border-slate-300 text-blue-700 shadow-2xs -mb-px'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders size={13} /> Allgemein
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('display')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t font-semibold transition-colors ${
            activeTab === 'display'
              ? 'bg-white border-t border-x border-slate-300 text-blue-700 shadow-2xs -mb-px'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye size={13} /> Anzeige &amp; Format
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('validation')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t font-semibold transition-colors ${
            activeTab === 'validation'
              ? 'bg-white border-t border-x border-slate-300 text-blue-700 shadow-2xs -mb-px'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckSquare size={13} /> Gültigkeitsregeln
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('computed')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t font-semibold transition-colors ${
            activeTab === 'computed'
              ? 'bg-white border-t border-x border-slate-300 text-amber-700 shadow-2xs -mb-px'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator size={13} /> Berechnungen {field.isCalculated && '⚡'}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-white">
        {activeTab === 'general' && (
          <GeneralPropertyTab field={field} isReadOnly={isReadOnly} onUpdate={onUpdate} />
        )}
        {activeTab === 'display' && (
          <DisplayPropertyTab field={field} isReadOnly={isReadOnly} onUpdate={onUpdate} />
        )}
        {activeTab === 'validation' && (
          <ValidationPropertyTab field={field} isReadOnly={isReadOnly} onUpdate={onUpdate} />
        )}
        {activeTab === 'computed' && (
          <ComputedPropertyTab
            field={field}
            availableFields={availableFields}
            isReadOnly={isReadOnly}
            onUpdate={onUpdate}
          />
        )}
      </div>
    </div>
  );
};
