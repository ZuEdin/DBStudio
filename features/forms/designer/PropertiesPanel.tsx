
import React from 'react';
import { FormElement, Form, Table, Relationship } from '../../../types/index';
import { Edit3, Trash2, Settings2, Shield, Users } from 'lucide-react';

interface PropertiesPanelProps {
  form: Form;
  selectedElement: FormElement | null;
  allTables: Table[];
  allForms: Form[];
  onPropertyChange: (key: keyof FormElement, value: any) => void;
  onLookupPropertyChange: (key: string, value: any) => void;
  onSubformPermissionChange: (perm: string, val: boolean) => void;
  onDeleteSelected: () => void;
  onShowLookupModal: () => void;
  onToggleFullScreen: () => void;
  onToggleEditButton: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  form,
  selectedElement,
  allTables,
  allForms,
  onPropertyChange,
  onLookupPropertyChange,
  onSubformPermissionChange,
  onDeleteSelected,
  onShowLookupModal,
  onToggleFullScreen,
  onToggleEditButton
}) => {
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

            <div>
              <label className="block font-bold text-slate-700 mb-1">CSS Klassen (Tailwind)</label>
              <textarea 
                value={selectedElement.className || ''} 
                onChange={e => onPropertyChange('className', e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 h-20 font-mono text-xs" 
                placeholder="z.B. p-4 bg-gray-100"
              />
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
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.settings?.showEditToggle || false} onChange={onToggleEditButton} className="rounded" />
                    <span>Bearbeiten-Toggle anzeigen</span>
                </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
