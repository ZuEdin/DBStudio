
import React, { useState, useEffect } from 'react';
import { FormElement, Form, Table, Relationship } from '../../../types/index';
import { Edit3, Trash2, Settings2, Shield, Users, Zap, Plus, ChevronDown } from 'lucide-react';
import { getSavedMacros } from '../../logic/MacroEngine';

interface CommaSeparatedInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

const CommaSeparatedInput: React.FC<CommaSeparatedInputProps> = ({ value, onChange, placeholder, className }) => {
  const [localValue, setLocalValue] = useState(value.join(', '));

  useEffect(() => {
    const normalizedProp = value.join(', ');
    const normalizedLocal = localValue.split(',').map(v => v.trim()).filter(Boolean).join(', ');
    if (normalizedProp !== normalizedLocal) {
      setLocalValue(normalizedProp);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);
    const parsed = raw.split(',').map(v => v.trim());
    const filtered = parsed.filter(v => v !== '');
    onChange(filtered);
  };

  const handleBlur = () => {
    const parsed = localValue.split(',').map(v => v.trim()).filter(Boolean);
    setLocalValue(parsed.join(', '));
    onChange(parsed);
  };

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
};

interface PropertiesPanelProps {
  form: Form;
  selectedElement: FormElement | null;
  allTables: Table[];
  allForms: Form[];
  onPropertyChange: (key: keyof FormElement, value: any) => void;
  onFormPropertyChange: (key: keyof Form, value: any) => void;
  onLookupPropertyChange: (key: string, value: any) => void;
  onSubformPermissionChange: (perm: string, val: boolean) => void;
  onDeleteSelected: () => void;
  onShowLookupModal: () => void;
  onToggleFullScreen: () => void;
  onToggleEditButton: () => void;
  onToggleTableSplitView: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  form,
  selectedElement,
  allTables,
  allForms,
  onPropertyChange,
  onFormPropertyChange,
  onLookupPropertyChange,
  onSubformPermissionChange,
  onDeleteSelected,
  onShowLookupModal,
  onToggleFullScreen,
  onToggleEditButton,
  onToggleTableSplitView
}) => {
  const sourceTable = allTables.find(t => t.id === form.sourceId);

  return (
    <div className="w-72 bg-white border-l border-slate-300 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Edit3 size={16}/> Eigenschaften
        </h3>
      </div>
      
      <div className="p-4">
        {selectedElement ? (
          <div className="space-y-4 text-sm">
            <div className="font-mono text-xs text-slate-400">ID: {selectedElement.id.substring(0,8)}...</div>
            
            {(selectedElement.type === 'field' || selectedElement.type === 'label' || selectedElement.type === 'subform') && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">{selectedElement.type === 'label' ? 'Text' : 'Beschriftung'}</label>
                <input 
                  type="text" 
                  value={selectedElement.label || ''} 
                  onChange={e => onPropertyChange('label', e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5" 
                />
              </div>
            )}

            {selectedElement.type === 'field' && (
              <div className="border p-3 rounded bg-slate-50 space-y-3">
                <div>
                    <label className="block font-bold text-slate-700 mb-1">Widget Typ</label>
                    <select 
                      value={selectedElement.widgetType || ''}
                      onChange={e => onPropertyChange('widgetType', e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Automatisch (Text)</option>
                      <optgroup label="Standard">
                        <option value="text">Textfeld</option>
                        <option value="textarea">Mehrzeilig (Area)</option>
                        <option value="number">Zahl</option>
                        <option value="date">Datum</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="select">Dropdown (Lookup)</option>
                      </optgroup>
                      <optgroup label="Berechnungen & Ausdrücke">
                        <option value="calculated">⚡ Berechnetes Feld (Formel)</option>
                      </optgroup>
                      <optgroup label="Active Directory / Auth">
                        <option value="ad-search">🔍 AD User Suche</option>
                        <option value="current-user">👤 Aktueller User (WhoAmI)</option>
                      </optgroup>
                    </select>
                </div>

                {/* Additional Info for AD Types */}
                {selectedElement.widgetType === 'ad-search' && (
                    <div className="p-2 bg-blue-50 text-blue-800 text-xs rounded border border-blue-200">
                        <div className="flex items-center gap-1 font-bold mb-1"><Users size={12}/> AD Suche</div>
                        Ermöglicht das Suchen nach Benutzern im Active Directory via <code>/api/ad/search</code>.
                    </div>
                )}
                {selectedElement.widgetType === 'current-user' && (
                    <div className="p-2 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200">
                        <div className="flex items-center gap-1 font-bold mb-1"><Shield size={12}/> Auto-Fill</div>
                        Füllt das Feld automatisch mit dem Login-Namen des aktuellen Benutzers.
                    </div>
                )}
                {selectedElement.widgetType === 'calculated' && (
                    <div className="p-2.5 bg-amber-50 text-amber-900 text-xs rounded border border-amber-300/80 space-y-2">
                        <div className="font-bold text-amber-950 flex items-center gap-1">⚡ Formel-Editor</div>
                        <div>
                            <label className="block text-[10px] font-bold text-amber-800 mb-1">Berechnungsformel:</label>
                            <textarea
                                value={selectedElement.calculationFormula || ''}
                                onChange={e => onPropertyChange('calculationFormula', e.target.value)}
                                rows={2}
                                placeholder="z.B. AGE([Geburtsdatum]) oder [Preis] * [Menge]"
                                className="w-full border border-amber-300 rounded p-1.5 font-mono text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-amber-800 mb-1">Schnell-Vorlagen:</label>
                            <div className="grid grid-cols-1 gap-1">
                                <button
                                    type="button"
                                    onClick={() => onPropertyChange('calculationFormula', 'AGE([Geburtsdatum])')}
                                    className="text-left px-2 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-mono text-amber-900 transition-colors"
                                >
                                    🎂 AGE([Geburtsdatum])
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onPropertyChange('calculationFormula', '[Preis] * [Menge]')}
                                    className="text-left px-2 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-mono text-amber-900 transition-colors"
                                >
                                    🧮 [Preis] * [Menge]
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onPropertyChange('calculationFormula', "[Vorname] + ' ' + [Nachname]")}
                                    className="text-left px-2 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-mono text-amber-900 transition-colors"
                                >
                                    👤 [Vorname] + ' ' + [Nachname]
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onPropertyChange('calculationFormula', 'ROUND([Netto] * 1.19, 2)')}
                                    className="text-left px-2 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-mono text-amber-900 transition-colors"
                                >
                                    🏷️ ROUND([Netto] * 1.19, 2)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {selectedElement.widgetType === 'select' && (
                  <div className="pt-2 border-t border-slate-200">
                    <button 
                      onClick={onShowLookupModal}
                      className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-semibold py-2 px-3 rounded flex items-center justify-center gap-2 mb-2"
                    >
                      <Settings2 size={14} /> Konfiguration
                    </button>
                    
                    {selectedElement.lookup && (
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                type="checkbox" 
                                checked={selectedElement.lookup.allowQuickCreate || false}
                                onChange={e => onLookupPropertyChange('allowQuickCreate', e.target.checked)}
                                className="rounded text-blue-600"
                                />
                                <span className="text-xs font-semibold text-slate-700">Quick Create (+)</span>
                            </label>
                            {selectedElement.lookup.allowQuickCreate && (
                                <select 
                                    value={selectedElement.lookup.quickCreateFormId || ''}
                                    onChange={e => onLookupPropertyChange('quickCreateFormId', e.target.value)}
                                    className="w-full border border-slate-300 rounded p-1 text-xs"
                                >
                                    <option value="">(Auto-Formular)</option>
                                    {allForms.filter(f => f.sourceId === selectedElement.lookup?.tableId).map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {selectedElement.type === 'subform' && selectedElement.subform && (
               <div className="border border-indigo-200 bg-indigo-50 rounded p-2 text-xs space-y-2">
                  <div className="font-bold text-indigo-800 flex items-center gap-1"><Shield size={12}/> Rechte</div>
                  {['canAdd', 'canEdit', 'canDelete'].map(perm => (
                      <label key={perm} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={(selectedElement.subform as any)[perm] !== false} 
                          onChange={e => onSubformPermissionChange(perm, e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span>{perm.replace('can', '')} erlauben</span>
                      </label>
                  ))}
               </div>
            )}

            {selectedElement.type === 'button' && (
                <div className="border border-purple-200 bg-purple-50/70 rounded-lg p-3 text-xs space-y-3">
                    <div className="flex items-center gap-1.5 font-bold text-purple-900 border-b border-purple-200 pb-2">
                        <Zap size={15} className="text-amber-500 fill-amber-400" />
                        <span>Schaltfläche / Makro Steuerelement</span>
                    </div>

                    <div>
                        <label className="block font-bold text-slate-700 mb-1">Beschriftung (Label)</label>
                        <input 
                          type="text" 
                          value={selectedElement.label || ''} 
                          onChange={e => onPropertyChange('label', e.target.value)}
                          placeholder="z.B. Makro ausführen"
                          className="w-full border border-slate-300 rounded p-1.5 bg-white font-medium" 
                        />
                    </div>

                    <div className="font-bold text-purple-800 text-[11px] uppercase tracking-wider">Aktionen & Flows</div>
                    {(selectedElement.actions || []).map((action, actionIdx) => (
                        <div key={action.id} className="bg-white border border-purple-200 rounded-md p-2 shadow-xs space-y-2">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Ereignis (Trigger)</label>
                                <select 
                                    value={action.trigger}
                                    onChange={e => {
                                        const newActions = [...(selectedElement.actions || [])];
                                        newActions[actionIdx] = { ...newActions[actionIdx], trigger: e.target.value as any };
                                        onPropertyChange('actions', newActions);
                                    }}
                                    className="w-full border border-slate-300 rounded p-1 text-xs font-semibold bg-slate-50"
                                >
                                    <option value="OnClick">Bei Klick (OnClick)</option>
                                    <option value="OnChange">Bei Änderung (OnChange)</option>
                                    <option value="OnPageLoad">Beim Laden (OnPageLoad)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Aktions-Typ</label>
                                <select 
                                    value={action.actionType}
                                    onChange={e => {
                                        const newActions = [...(selectedElement.actions || [])];
                                        newActions[actionIdx] = { ...newActions[actionIdx], actionType: e.target.value as any };
                                        onPropertyChange('actions', newActions);
                                    }}
                                    className="w-full border border-slate-300 rounded p-1 text-xs font-bold text-purple-700 bg-white"
                                >
                                    <option value="RunMacro">⚡ Makro ausführen</option>
                                    <option value="ShowToast">🔔 Toast / Nachricht anzeigen</option>
                                    <option value="OpenModal">📋 Formular / Modal öffnen</option>
                                    <option value="Navigate">↗️ Navigieren zu Route</option>
                                    <option value="ExecuteAPI">🌐 API Call ausführen</option>
                                    <option value="SetState">⚙️ Global State setzen</option>
                                </select>
                            </div>

                            {action.actionType === 'RunMacro' && (
                                <div className="p-2 bg-amber-50/80 rounded border border-amber-200 space-y-1.5">
                                    <label className="block text-[10px] font-bold text-amber-900">Auszuführendes Makro:</label>
                                    <select 
                                        value={action.macroId || ''} 
                                        onChange={e => {
                                            const newActions = [...(selectedElement.actions || [])];
                                            newActions[actionIdx] = { ...newActions[actionIdx], macroId: e.target.value };
                                            onPropertyChange('actions', newActions);
                                        }} 
                                        className="w-full border border-amber-300 rounded p-1 text-xs font-bold bg-white text-slate-800"
                                    >
                                        <option value="">-- Makro auswählen --</option>
                                        {getSavedMacros().map(m => (
                                            <option key={m.id} value={m.id}>⚡ {m.name}</option>
                                        ))}
                                    </select>
                                    {getSavedMacros().length === 0 && (
                                        <p className="text-[10px] text-amber-700 italic">Keine Makros gefunden. Erstellen Sie Makros im Reiter "Makros & Logik".</p>
                                    )}
                                </div>
                            )}

                            {action.actionType === 'ShowToast' && (
                                <div className="space-y-1">
                                    <input type="text" placeholder="Nachricht..." value={action.toastMessage || ''} onChange={e => {
                                        const newActions = [...(selectedElement.actions || [])];
                                        newActions[actionIdx] = { ...newActions[actionIdx], toastMessage: e.target.value };
                                        onPropertyChange('actions', newActions);
                                    }} className="w-full border p-1 rounded" />
                                    <select value={action.toastType || 'success'} onChange={e => {
                                        const newActions = [...(selectedElement.actions || [])];
                                        newActions[actionIdx] = { ...newActions[actionIdx], toastType: e.target.value as any };
                                        onPropertyChange('actions', newActions);
                                    }} className="w-full border p-1 rounded">
                                        <option value="success">Erfolg (Grün)</option>
                                        <option value="error">Fehler (Rot)</option>
                                        <option value="info">Info (Blau)</option>
                                    </select>
                                </div>
                            )}

                            {action.actionType === 'OpenModal' && (
                                <select value={action.modalId || ''} onChange={e => {
                                        const newActions = [...(selectedElement.actions || [])];
                                        newActions[actionIdx] = { ...newActions[actionIdx], modalId: e.target.value };
                                        onPropertyChange('actions', newActions);
                                    }} className="w-full border p-1 rounded">
                                    <option value="">Formular wählen...</option>
                                    {allForms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            )}

                            {action.actionType === 'Navigate' && (
                                <input type="text" placeholder="/route/path" value={action.routeUrl || ''} onChange={e => {
                                    const newActions = [...(selectedElement.actions || [])];
                                    newActions[actionIdx] = { ...newActions[actionIdx], routeUrl: e.target.value };
                                    onPropertyChange('actions', newActions);
                                }} className="w-full border p-1 rounded" />
                            )}
                            
                            {action.actionType === 'SetState' && (
                                <div className="flex gap-1">
                                    <input type="text" placeholder="State ID" value={action.stateVariableId || ''} onChange={e => {
                                        const newActions = [...(selectedElement.actions || [])];
                                        newActions[actionIdx] = { ...newActions[actionIdx], stateVariableId: e.target.value };
                                        onPropertyChange('actions', newActions);
                                    }} className="w-1/2 border p-1 rounded" />
                                    <input type="text" placeholder="Wert" value={action.stateValue || ''} onChange={e => {
                                        const newActions = [...(selectedElement.actions || [])];
                                        newActions[actionIdx] = { ...newActions[actionIdx], stateValue: e.target.value };
                                        onPropertyChange('actions', newActions);
                                    }} className="w-1/2 border p-1 rounded" />
                                </div>
                            )}

                            <button onClick={() => {
                                const newActions = (selectedElement.actions || []).filter(a => a.id !== action.id);
                                onPropertyChange('actions', newActions);
                            }} className="text-red-500 hover:bg-red-50 py-0.5 rounded text-[11px] font-bold w-full text-center">Aktion entfernen</button>
                        </div>
                    ))}
                    <button 
                        onClick={() => {
                            const newActions = [...(selectedElement.actions || []), { id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }];
                            onPropertyChange('actions', newActions);
                        }}
                        className="text-purple-700 bg-purple-100 hover:bg-purple-200 w-full rounded-md py-1.5 font-bold shadow-2xs flex items-center justify-center gap-1 transition-colors"
                    >
                        <Zap size={14} /> + Aktion / Makro hinzufügen
                    </button>
                </div>
            )}

            {selectedElement.type === 'dropdown_button' && (
                <div className="border border-indigo-200 bg-indigo-50/70 rounded-lg p-3 text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                            <Zap size={15} className="text-indigo-600 fill-indigo-400" />
                            <span>Dropdown-Schaltfläche (Menü)</span>
                        </div>
                    </div>

                    <div>
                        <label className="block font-bold text-slate-700 mb-1">Haupt-Beschriftung (Label)</label>
                        <input 
                          type="text" 
                          value={selectedElement.label || ''} 
                          onChange={e => onPropertyChange('label', e.target.value)}
                          placeholder="z.B. Aktionen"
                          className="w-full border border-slate-300 rounded p-1.5 bg-white font-medium" 
                        />
                    </div>

                    <div className="border-t border-indigo-200 pt-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-900 text-xs uppercase tracking-wider">
                                Unter-Buttons ({selectedElement.dropdownItems?.length || 0})
                            </span>
                            <button
                                onClick={() => {
                                    const currentItems = selectedElement.dropdownItems || [];
                                    const newItem = {
                                        id: crypto.randomUUID(),
                                        label: `Aktion ${currentItems.length + 1}`,
                                        actions: [{ id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }]
                                    };
                                    onPropertyChange('dropdownItems', [...currentItems, newItem]);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-1 rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            >
                                <Plus size={12} /> Button hinzufügen
                            </button>
                        </div>

                        {(!selectedElement.dropdownItems || selectedElement.dropdownItems.length === 0) && (
                            <div className="p-3 bg-white border border-dashed border-indigo-200 rounded text-center text-slate-400 italic text-xs">
                                Keine Unter-Buttons definiert. Klicken Sie oben auf "Button hinzufügen".
                            </div>
                        )}

                        {(selectedElement.dropdownItems || []).map((item, itemIdx) => (
                            <div key={item.id} className="bg-white border border-indigo-200 rounded-lg p-2.5 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                                    <span className="font-bold text-slate-700 text-xs flex items-center gap-1">
                                        <span className="w-4 h-4 bg-indigo-100 text-indigo-700 rounded-full inline-flex items-center justify-center text-[10px]">
                                            {itemIdx + 1}
                                        </span>
                                        Unter-Button
                                    </span>
                                    <button
                                        onClick={() => {
                                            const updated = (selectedElement.dropdownItems || []).filter(i => i.id !== item.id);
                                            onPropertyChange('dropdownItems', updated);
                                        }}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors text-[11px] font-bold flex items-center gap-0.5"
                                        title="Unter-Button löschen"
                                    >
                                        <Trash2 size={13} /> Entfernen
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Titel / Name</label>
                                    <input
                                        type="text"
                                        value={item.label || ''}
                                        onChange={e => {
                                            const updated = [...(selectedElement.dropdownItems || [])];
                                            updated[itemIdx] = { ...updated[itemIdx], label: e.target.value };
                                            onPropertyChange('dropdownItems', updated);
                                        }}
                                        placeholder="z.B. Bericht drucken"
                                        className="w-full border border-slate-300 rounded p-1 text-xs font-semibold bg-white"
                                    />
                                </div>

                                <div className="space-y-1.5 pt-1">
                                    <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider flex items-center justify-between">
                                        <span>Befehle & Makros</span>
                                        <button
                                            onClick={() => {
                                                const updated = [...(selectedElement.dropdownItems || [])];
                                                const currentActions = updated[itemIdx].actions || [];
                                                updated[itemIdx] = {
                                                    ...updated[itemIdx],
                                                    actions: [...currentActions, { id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }]
                                                };
                                                onPropertyChange('dropdownItems', updated);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold underline"
                                        >
                                            + Befehl hinzufügen
                                        </button>
                                    </div>

                                    {(item.actions || []).map((action, actIdx) => (
                                        <div key={action.id} className="bg-slate-50 border border-indigo-100 rounded p-1.5 space-y-1.5">
                                            <div className="flex gap-1">
                                                <select
                                                    value={action.actionType}
                                                    onChange={e => {
                                                        const updated = [...(selectedElement.dropdownItems || [])];
                                                        const actions = [...(updated[itemIdx].actions || [])];
                                                        actions[actIdx] = { ...actions[actIdx], actionType: e.target.value as any };
                                                        updated[itemIdx] = { ...updated[itemIdx], actions };
                                                        onPropertyChange('dropdownItems', updated);
                                                    }}
                                                    className="w-full border border-slate-300 rounded p-1 text-xs font-bold text-purple-800 bg-white"
                                                >
                                                    <option value="RunMacro">⚡ Makro ausführen</option>
                                                    <option value="ShowToast">🔔 Toast anzeigen</option>
                                                    <option value="OpenModal">📋 Formular öffnen</option>
                                                    <option value="Navigate">↗️ Navigieren</option>
                                                </select>
                                                <button
                                                    onClick={() => {
                                                        const updated = [...(selectedElement.dropdownItems || [])];
                                                        const actions = (updated[itemIdx].actions || []).filter(a => a.id !== action.id);
                                                        updated[itemIdx] = { ...updated[itemIdx], actions };
                                                        onPropertyChange('dropdownItems', updated);
                                                    }}
                                                    className="text-red-500 hover:bg-red-100 p-1 rounded"
                                                    title="Befehl löschen"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>

                                            {action.actionType === 'RunMacro' && (
                                                <select
                                                    value={action.macroId || ''}
                                                    onChange={e => {
                                                        const updated = [...(selectedElement.dropdownItems || [])];
                                                        const actions = [...(updated[itemIdx].actions || [])];
                                                        actions[actIdx] = { ...actions[actIdx], macroId: e.target.value };
                                                        updated[itemIdx] = { ...updated[itemIdx], actions };
                                                        onPropertyChange('dropdownItems', updated);
                                                    }}
                                                    className="w-full border border-amber-300 rounded p-1 text-xs font-bold bg-amber-50 text-amber-950"
                                                >
                                                    <option value="">-- Makro wählen --</option>
                                                    {getSavedMacros().map(m => (
                                                        <option key={m.id} value={m.id}>⚡ {m.name}</option>
                                                    ))}
                                                </select>
                                            )}

                                            {action.actionType === 'ShowToast' && (
                                                <input
                                                    type="text"
                                                    placeholder="Nachricht..."
                                                    value={action.toastMessage || ''}
                                                    onChange={e => {
                                                        const updated = [...(selectedElement.dropdownItems || [])];
                                                        const actions = [...(updated[itemIdx].actions || [])];
                                                        actions[actIdx] = { ...actions[actIdx], toastMessage: e.target.value };
                                                        updated[itemIdx] = { ...updated[itemIdx], actions };
                                                        onPropertyChange('dropdownItems', updated);
                                                    }}
                                                    className="w-full border p-1 rounded text-xs bg-white"
                                                />
                                            )}

                                            {action.actionType === 'OpenModal' && (
                                                <select
                                                    value={action.modalId || ''}
                                                    onChange={e => {
                                                        const updated = [...(selectedElement.dropdownItems || [])];
                                                        const actions = [...(updated[itemIdx].actions || [])];
                                                        actions[actIdx] = { ...actions[actIdx], modalId: e.target.value };
                                                        updated[itemIdx] = { ...updated[itemIdx], actions };
                                                        onPropertyChange('dropdownItems', updated);
                                                    }}
                                                    className="w-full border p-1 rounded text-xs bg-white"
                                                >
                                                    <option value="">Formular wählen...</option>
                                                    {allForms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                </select>
                                            )}

                                            {action.actionType === 'Navigate' && (
                                                <input
                                                    type="text"
                                                    placeholder="/route/path"
                                                    value={action.routeUrl || ''}
                                                    onChange={e => {
                                                        const updated = [...(selectedElement.dropdownItems || [])];
                                                        const actions = [...(updated[itemIdx].actions || [])];
                                                        actions[actIdx] = { ...actions[actIdx], routeUrl: e.target.value };
                                                        updated[itemIdx] = { ...updated[itemIdx], actions };
                                                        onPropertyChange('dropdownItems', updated);
                                                    }}
                                                    className="w-full border p-1 rounded text-xs bg-white"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">CSS Klassen (Tailwind)</label>
              <textarea 
                value={selectedElement.className || ''} 
                onChange={e => onPropertyChange('className', e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 h-20 font-mono text-xs" 
                placeholder="z.B. p-4 bg-gray-100"
              />
            </div>
            
            <div className="border border-indigo-200 bg-indigo-50 rounded p-2 text-xs space-y-2">
                <div className="font-bold text-indigo-800 flex items-center gap-1"><Shield size={12}/> Sichtbarkeit (Rollen)</div>
                <CommaSeparatedInput 
                    placeholder="admin, user (kommagetrennt)"
                    value={selectedElement.allowedRoles || []} 
                    onChange={roles => {
                        onPropertyChange('allowedRoles', roles.length > 0 ? roles : undefined);
                    }}
                    className="w-full border p-1 rounded bg-white text-xs" 
                />
            </div>

            <div className="border border-emerald-200 bg-emerald-50/50 rounded p-2 text-xs space-y-2">
                <div className="font-bold text-emerald-800 flex items-center gap-1">
                  <Shield size={12}/> Validierungsregeln
                </div>
                <div className="space-y-1.5">
                  {(selectedElement.validationRules || []).map((rule, rIdx) => (
                    <div key={rule.id || rIdx} className="bg-white p-2 rounded border border-emerald-200 space-y-1">
                      <div className="flex justify-between items-center font-bold text-[11px] text-slate-700">
                        <span>Typ: {rule.type}</span>
                        <button 
                          onClick={() => {
                            const updated = (selectedElement.validationRules || []).filter((_, i) => i !== rIdx);
                            onPropertyChange('validationRules', updated);
                          }}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <input 
                        type="text"
                        placeholder="Fehlermeldung"
                        value={rule.errorMessage || ''}
                        onChange={e => {
                          const updated = [...(selectedElement.validationRules || [])];
                          updated[rIdx] = { ...updated[rIdx], errorMessage: e.target.value };
                          onPropertyChange('validationRules', updated);
                        }}
                        className="w-full border p-1 rounded text-[11px]"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newRule = {
                        id: crypto.randomUUID(),
                        fieldId: selectedElement.fieldId || selectedElement.id,
                        type: 'required' as const,
                        errorMessage: 'Dieses Feld darf nicht leer sein.'
                      };
                      onPropertyChange('validationRules', [...(selectedElement.validationRules || []), newRule]);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded p-1 text-[11px] font-bold shadow-2xs"
                  >
                    + Validierungsregel hinzufügen
                  </button>
                </div>
            </div>

            <div className="border border-amber-200 bg-amber-50 rounded p-2 text-xs space-y-2">
                <div className="font-bold text-amber-800 flex items-center gap-1"><Settings2 size={12}/> Bedingte Anzeige</div>
                <div className="space-y-1">
                    <input 
                        type="text" 
                        placeholder="Abhängige Feld ID (z.B. field_123)"
                        value={selectedElement.visibilityCondition?.fieldId || ''} 
                        onChange={e => onPropertyChange('visibilityCondition', { ...selectedElement.visibilityCondition, fieldId: e.target.value, operator: selectedElement.visibilityCondition?.operator || 'eq', value: selectedElement.visibilityCondition?.value || '' })}
                        className="w-full border p-1 rounded" 
                    />
                    <div className="flex gap-1">
                        <select 
                            value={selectedElement.visibilityCondition?.operator || 'eq'} 
                            onChange={e => onPropertyChange('visibilityCondition', { ...selectedElement.visibilityCondition, operator: e.target.value, fieldId: selectedElement.visibilityCondition?.fieldId || '', value: selectedElement.visibilityCondition?.value || '' })}
                            className="w-1/3 border p-1 rounded"
                        >
                            <option value="eq">=</option>
                            <option value="neq">!=</option>
                        </select>
                        <input 
                            type="text" 
                            placeholder="Wert (z.B. Ja)"
                            value={selectedElement.visibilityCondition?.value || ''} 
                            onChange={e => onPropertyChange('visibilityCondition', { ...selectedElement.visibilityCondition, value: e.target.value, fieldId: selectedElement.visibilityCondition?.fieldId || '', operator: selectedElement.visibilityCondition?.operator || 'eq' })}
                            className="w-2/3 border p-1 rounded" 
                        />
                    </div>
                </div>
            </div>

            <button onClick={onDeleteSelected} className="w-full mt-4 bg-red-50 text-red-600 border border-red-200 p-2 rounded hover:bg-red-100 flex items-center justify-center gap-2">
              <Trash2 size={14} /> Element löschen
            </button>
          </div>
        ) : (
          <div className="text-slate-500 text-sm space-y-4">
            <p className="italic">Kein Element ausgewählt.</p>
            <div className="pt-4 border-t border-slate-200">
                <p className="font-bold text-slate-700 mb-2">Formular-Optionen</p>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={form.settings?.isFullScreen || false} onChange={onToggleFullScreen} className="rounded" />
                    <span>Vollbild-Modus</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={form.settings?.showEditToggle || false} onChange={onToggleEditButton} className="rounded" />
                    <span>Bearbeiten-Toggle anzeigen</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={form.settings?.showTableSplitView || false} onChange={onToggleTableSplitView} className="rounded" />
                    <span>Tabelle & Formular (Split View)</span>
                </label>
                
                {form.settings?.showTableSplitView && sourceTable && (
                  <div className="mb-4 pl-4 py-2 bg-slate-50 border-l-2 border-slate-300 rounded-r-md space-y-2 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Anzeigefeld (Haupttitel)</label>
                      <select 
                        value={form.settings?.splitViewDisplayFieldId || ''} 
                        onChange={e => onFormPropertyChange('settings', { ...form.settings, splitViewDisplayFieldId: e.target.value })}
                        className="w-full border border-slate-300 rounded p-1.5 bg-white text-slate-700 font-medium"
                      >
                        <option value="">(Automatisch)</option>
                        {sourceTable.fields.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Anzeigefeld (Untertitel)</label>
                      <select 
                        value={form.settings?.splitViewSubtitleFieldId || ''} 
                        onChange={e => onFormPropertyChange('settings', { ...form.settings, splitViewSubtitleFieldId: e.target.value })}
                        className="w-full border border-slate-300 rounded p-1.5 bg-white text-slate-700 font-medium"
                      >
                        <option value="">(Automatisch / Primärschlüssel)</option>
                        {sourceTable.fields.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer mb-4">
                    <input 
                      type="checkbox" 
                      checked={form.settings?.hideNavigation || false} 
                      onChange={e => onFormPropertyChange('settings', { ...form.settings, hideNavigation: e.target.checked })} 
                      className="rounded" 
                    />
                    <span>Datensatznavigation ausblenden</span>
                </label>
                
                <div className="border border-indigo-200 bg-indigo-50 rounded p-2 text-xs space-y-2">
                    <div className="font-bold text-indigo-800 flex items-center gap-1"><Shield size={12}/> Formular-Sichtbarkeit (Rollen)</div>
                    <CommaSeparatedInput 
                        placeholder="admin, user (kommagetrennt)"
                        value={form.allowedRoles || []} 
                        onChange={roles => {
                            onFormPropertyChange('allowedRoles', roles.length > 0 ? roles : undefined);
                        }}
                        className="w-full border p-1 rounded bg-white text-xs" 
                    />
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
