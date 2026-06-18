
import React, { useState } from 'react';
import { FormElement, Table } from '../../../types/index';
import { Plus, Search, User, Loader2 } from 'lucide-react';
import { UserPickerModal } from '../components/UserPickerModal';

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

  const [showUserPicker, setShowUserPicker] = useState<boolean>(false);
  const [pickerMode, setPickerMode] = useState<'me' | 'search'>('me');

  const openPicker = (mode: 'me' | 'search') => {
      if (isReadOnly) return;
      setPickerMode(mode);
      setShowUserPicker(true);
  };

  const handleUserSelect = (username: string, display: string) => {
      onChange(fieldName, username); // We store the username/ID
      setShowUserPicker(false);
  };

  let widget = element.widgetType;
  if (!widget && field) {
      if (field.type === 'BOOLEAN') widget = 'checkbox';
      else if (field.type === 'DATE') widget = 'date';
      else if (field.type === 'INTEGER' || field.type === 'DECIMAL') widget = 'number';
      else widget = 'text';
  }

  // --- RENDER: Current User (WhoAmI) ---
  if (widget === 'current-user') {
      return (
          <div className={element.className}>
              <label htmlFor={elementId} className="block text-sm font-semibold text-slate-600 mb-1">{label}</label>
              <div className="flex gap-2">
                  <div className="relative flex-1">
                      <User className="absolute left-2 top-2 text-emerald-600" size={16} />
                      <input
                        id={elementId}
                        type="text"
                        readOnly
                        value={value || ''}
                        className="w-full border border-emerald-300 bg-emerald-50 text-emerald-900 rounded p-2 pl-8 text-sm font-mono cursor-default focus:outline-none"
                        placeholder="(Leer)"
                      />
                  </div>
                  {!isReadOnly && (
                      <button 
                        onClick={() => openPicker('me')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-bold shadow-sm transition-colors whitespace-nowrap"
                        title="Mich selbst eintragen"
                      >
                          Ich (Auto)
                      </button>
                  )}
              </div>
              {showUserPicker && (
                  <UserPickerModal 
                    initialTab="me"
                    onSelect={handleUserSelect} 
                    onClose={() => setShowUserPicker(false)} 
                  />
              )}
          </div>
      );
  }

  // --- RENDER: AD Search ---
  if (widget === 'ad-search') {
      return (
          <div className={element.className}>
              <label htmlFor={elementId} className="block text-sm font-semibold text-slate-600 mb-1">{label}</label>
              <div className="flex gap-2">
                  <div className="relative flex-1">
                      <Search className="absolute left-2 top-2 text-blue-500" size={16} />
                      <input
                        id={elementId}
                        type="text"
                        readOnly={isReadOnly} // Editable manually? Maybe not if strict AD.
                        value={value || ''} 
                        onChange={(e) => onChange(fieldName, e.target.value)}
                        className="w-full border border-blue-200 bg-white rounded p-2 pl-8 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                        placeholder="Benutzer auswählen..."
                      />
                  </div>
                  {!isReadOnly && (
                      <button 
                        onClick={() => openPicker('search')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold shadow-sm transition-colors whitespace-nowrap flex items-center gap-1"
                      >
                          <Search size={14}/> Suchen
                      </button>
                  )}
              </div>
              {showUserPicker && (
                  <UserPickerModal 
                    initialTab="search"
                    onSelect={handleUserSelect} 
                    onClose={() => setShowUserPicker(false)} 
                  />
              )}
          </div>
      );
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

  if (widget === 'select') {
      const options = element.lookup ? getLookupOptions(element.lookup) : [{ value: '', label: '(Keine Datenquelle konfiguriert)' }];
      return (
          <div className={element.className}>
              <label htmlFor={elementId} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
              <div className="flex gap-2">
                <select
                    id={elementId}
                    disabled={isReadOnly || !element.lookup}
                    value={value || ''}
                    onChange={e => onChange(fieldName, e.target.value)}
                    className="flex-1 shrink-0 appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
                >
                    <option value="">Auswählen...</option>
                    {options.map((opt, idx) => (
                        <option key={`${opt.value}-${idx}`} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                {element.lookup && element.lookup.allowQuickCreate && onOpenLookupModal && !isReadOnly && (
                    <button 
                        onClick={() => element.lookup && onOpenLookupModal(element.lookup.tableId, fieldName, element.lookup.quickCreateFormId)}
                        className="shrink-0 h-9 w-9 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded flex items-center justify-center transition-colors shadow-sm focus:ring focus:ring-indigo-200"
                        title="Neuen Eintrag erstellen (+)"
                    >
                        <Plus size={16} strokeWidth={2.5} />
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
                  className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
            className={`w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${field?.isAutoIncrement ? 'bg-slate-100 text-slate-500 italic' : ''}`}
          />
      </div>
  );
};
