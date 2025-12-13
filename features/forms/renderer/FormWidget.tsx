
import React from 'react';
import { FormElement, Table } from '../../../types/index';
import { Plus } from 'lucide-react';

interface FormWidgetProps {
  element: FormElement;
  value: any;
  sourceTable?: Table;
  isReadOnly: boolean;
  onChange: (fieldName: string, value: any) => void;
  getLookupOptions: (lookupConfig: any) => any[];
  onOpenLookupModal?: (tableId: string, fieldName: string, formId?: string) => void;
}

export const FormWidget: React.FC<FormWidgetProps> = ({
  element,
  value,
  sourceTable,
  isReadOnly,
  onChange,
  getLookupOptions,
  onOpenLookupModal
}) => {
  const field = sourceTable?.fields.find(f => f.id === element.fieldId);
  const fieldName = field?.name || '';
  const label = element.label || fieldName;
  const elementId = `field_${element.id}`;

  let widget = element.widgetType;
  if (!widget && field) {
      if (field.type === 'BOOLEAN') widget = 'checkbox';
      else if (field.type === 'DATE') widget = 'date';
      else if (field.type === 'INTEGER' || field.type === 'DECIMAL') widget = 'number';
      else widget = 'text';
  }

  if (widget === 'checkbox') {
      return (
          <div className={element.className}>
              <div className="flex items-center gap-2 mt-6 mb-2">
                  <input 
                      id={elementId}
                      type="checkbox"
                      disabled={isReadOnly || field?.isAutoIncrement}
                      checked={!!value}
                      onChange={e => onChange(fieldName, e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={elementId} className="text-sm font-semibold text-slate-700 cursor-pointer">{label}</label>
              </div>
          </div>
      );
  }

  if (widget === 'select' && element.lookup) {
      const options = getLookupOptions(element.lookup);
      return (
          <div className={element.className}>
              <label htmlFor={elementId} className="block text-sm font-semibold text-slate-600 mb-1">{label}</label>
              <div className="flex gap-2">
                <select
                    id={elementId}
                    disabled={isReadOnly}
                    value={value || ''}
                    onChange={e => onChange(fieldName, e.target.value)}
                    className="flex-1 border border-slate-300 rounded p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">Bitte wählen...</option>
                    {options.map((opt, idx) => (
                        <option key={`${opt.value}-${idx}`} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                {element.lookup.allowQuickCreate && onOpenLookupModal && !isReadOnly && (
                    <button 
                        onClick={() => element.lookup && onOpenLookupModal(element.lookup.tableId, fieldName, element.lookup.quickCreateFormId)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 rounded px-3 flex items-center justify-center"
                        title="Neu"
                    >
                        <Plus size={18} />
                    </button>
                )}
              </div>
          </div>
      );
  }

  if (widget === 'textarea') {
       return (
          <div className={element.className}>
              <label htmlFor={elementId} className="block text-sm font-semibold text-slate-600 mb-1">{label}</label>
              <textarea
                  id={elementId}
                  readOnly={isReadOnly}
                  value={value || ''}
                  onChange={(e) => onChange(fieldName, e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-sm"
                  rows={3}
              />
          </div>
      );
  }

  return (
      <div className={element.className}>
          <label htmlFor={elementId} className="block text-sm font-semibold text-slate-600 mb-1">{label}</label>
          <input
            id={elementId}
            type={widget === 'date' ? 'date' : widget === 'number' ? 'number' : 'text'}
            readOnly={isReadOnly || field?.isAutoIncrement}
            value={value || ''}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className={`w-full border border-slate-300 rounded p-2 text-sm ${field?.isAutoIncrement ? 'bg-slate-100 text-slate-500 italic' : ''}`}
          />
      </div>
  );
};
