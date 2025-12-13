
import React, { useState } from 'react';
import { Form, Table, Subform, FormElement, FormElementType, FormWidgetType } from '../../types/index';
import { Layout, Trash2, Eye, Edit3, Type, Box, GripVertical, Monitor, List, CheckSquare, Settings2, Shield, PlusSquare } from 'lucide-react';
import { LinkSubformModal } from './components/LinkSubformModal';
import { LookupConfigModal } from './components/LookupConfigModal';

interface FormDesignerViewProps {
  form: Form;
  allForms: Form[];
  allTables: Table[];
  onFormChange: (form: Form) => void;
  // Expose methods for parent (App) to call
  actionTrigger?: { action: string, timestamp: number }; 
}

export const FormDesignerView: React.FC<FormDesignerViewProps> = ({ form, allForms, allTables, onFormChange, actionTrigger }) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [linkingSubform, setLinkingSubform] = useState<Form | null>(null);
  const [showLookupModal, setShowLookupModal] = useState(false);
  
  const mainFormTable = allTables.find(t => t.id === form.sourceId);

  const findElement = (root: FormElement, id: string): FormElement | null => {
    if (root.id === id) return root;
    if (root.children) {
      for (const child of root.children) {
        const found = findElement(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const getSelectedElement = () => form.layout ? findElement(form.layout, selectedElementId || '') : null;

  const toggleMode = () => {
      onFormChange({ ...form, mode: form.mode === 'readonly' ? 'edit' : 'readonly' });
  };
  
  const toggleFullScreen = () => {
      onFormChange({ 
          ...form, 
          settings: { ...form.settings, isFullScreen: !form.settings?.isFullScreen } 
      });
  };

  React.useEffect(() => {
    if (!actionTrigger) return;
    
    const addToSelectedOrRoot = (newEl: FormElement) => {
        const newLayout = JSON.parse(JSON.stringify(form.layout));
        let targetId = selectedElementId || newLayout.id;
        let targetEl = findElement(newLayout, targetId);
        
        if (targetEl && targetEl.type !== 'container') {
             targetEl = newLayout;
        }

        if (targetEl && targetEl.children) {
            targetEl.children.push(newEl);
        } else if (targetEl && !targetEl.children) {
            targetEl.children = [newEl];
        }
        
        onFormChange({ ...form, layout: newLayout });
    };

    switch(actionTrigger.action) {
        case 'form_add_label':
            addToSelectedOrRoot({
                id: crypto.randomUUID(), type: 'label', label: 'Neues Label', className: 'text-lg font-bold text-slate-800'
            });
            break;
        case 'form_add_container':
            addToSelectedOrRoot({
                id: crypto.randomUUID(), type: 'container', className: 'p-4 border border-dashed border-slate-300 rounded bg-slate-50', children: []
            });
            break;
        case 'form_add_2col':
             addToSelectedOrRoot({
                id: crypto.randomUUID(), type: 'container', className: 'grid grid-cols-2 gap-4', 
                children: [
                    { id: crypto.randomUUID(), type: 'container', className: 'p-2 border border-dashed border-slate-200', children: [] },
                    { id: crypto.randomUUID(), type: 'container', className: 'p-2 border border-dashed border-slate-200', children: [] }
                ]
            });
            break;
        case 'export_form':
            const dataStr = JSON.stringify(form, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `${form.name}.form.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            break;
    }
  }, [actionTrigger]);

  const handleDragStartField = (e: React.DragEvent, field: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'field', fieldId: field.id, label: field.name }));
    e.stopPropagation();
  };

  const handleDropOnContainer = (e: React.DragEvent, containerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const json = e.dataTransfer.getData('application/json');
      if (!json) return;
      const data = JSON.parse(json);
      
      const newLayout = JSON.parse(JSON.stringify(form.layout));
      const container = findElement(newLayout, containerId);
      
      if (container) {
          if (!container.children) container.children = [];
          
          if (data.type === 'field') {
              container.children.push({
                  id: crypto.randomUUID(),
                  type: 'field',
                  fieldId: data.fieldId,
                  label: data.label,
                  className: 'mb-2'
              });
          } else if (data.type === 'form') {
              const subformDef = allForms.find(f => f.id === data.formId);
              if (subformDef) {
                  setLinkingSubform(subformDef); 
                  (window as any).__targetContainerId = containerId; 
              }
          }
          onFormChange({ ...form, layout: newLayout });
      }
    } catch(err) { console.error(err); }
  };

  const handleLinkSubform = (master: string, child: string) => {
      const targetForm = linkingSubform;
      const containerId = (window as any).__targetContainerId;
      setLinkingSubform(null);
      if (!targetForm || !containerId) return;

      const newLayout = JSON.parse(JSON.stringify(form.layout));
      const container = findElement(newLayout, containerId);
      if (container) {
          if (!container.children) container.children = [];
          container.children.push({
              id: crypto.randomUUID(),
              type: 'subform',
              label: targetForm.name,
              subform: {
                  formId: targetForm.id,
                  masterLinkFieldId: master,
                  childLinkFieldId: child,
                  canAdd: true,
                  canDelete: true,
                  canEdit: true
              },
              className: 'border border-indigo-200 bg-indigo-50 p-2 rounded'
          });
          onFormChange({ ...form, layout: newLayout });
      }
  };

  const handlePropertyChange = (key: keyof FormElement, value: any) => {
      if (!selectedElementId) return;
      const newLayout = JSON.parse(JSON.stringify(form.layout));
      const el = findElement(newLayout, selectedElementId);
      if (el) {
          (el as any)[key] = value;
          // Auto-init lookup object if switching to select
          if (key === 'widgetType' && value === 'select' && !el.lookup) {
              el.lookup = { tableId: allTables[0]?.id || '', valueFieldId: '', labelFields: [] };
          }
          onFormChange({ ...form, layout: newLayout });
      }
  };
  
  const handleLookupPropertyChange = (key: string, value: any) => {
      if (!selectedElementId) return;
      const newLayout = JSON.parse(JSON.stringify(form.layout));
      const el = findElement(newLayout, selectedElementId);
      if (el && el.lookup) {
          (el.lookup as any)[key] = value;
          onFormChange({ ...form, layout: newLayout });
      }
  };

  const handleSubformPermissionChange = (perm: 'canAdd' | 'canDelete' | 'canEdit', val: boolean) => {
      if (!selectedElementId) return;
      const newLayout = JSON.parse(JSON.stringify(form.layout));
      const el = findElement(newLayout, selectedElementId);
      if (el && el.subform) {
          el.subform[perm] = val;
          onFormChange({ ...form, layout: newLayout });
      }
  };
  
  const handleLookupSave = (newLookup: any) => {
      if (!selectedElementId) return;
      const newLayout = JSON.parse(JSON.stringify(form.layout));
      const el = findElement(newLayout, selectedElementId);
      if (el) {
          // Merge old config (to keep allowQuickCreate) with new config
          el.lookup = { ...el.lookup, ...newLookup };
          onFormChange({ ...form, layout: newLayout });
      }
  };

  const deleteSelected = () => {
      if (!selectedElementId || selectedElementId === form.layout!.id) return;
      const newLayout = JSON.parse(JSON.stringify(form.layout));
      
      const removeNode = (parent: FormElement, id: string): boolean => {
          if (!parent.children) return false;
          const idx = parent.children.findIndex(c => c.id === id);
          if (idx > -1) {
              parent.children.splice(idx, 1);
              return true;
          }
          return parent.children.some(c => removeNode(c, id));
      };
      
      removeNode(newLayout, selectedElementId);
      setSelectedElementId(null);
      onFormChange({ ...form, layout: newLayout });
  };

  const renderElement = (el: FormElement) => {
      const isSelected = el.id === selectedElementId;
      const baseClass = `relative border ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-transparent hover:border-slate-300'} transition-all`;
      
      if (el.type === 'container') {
          return (
              <div 
                key={el.id} 
                className={`${baseClass} ${el.className || ''} min-h-[50px]`}
                onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                onDragOver={e => e.preventDefault()}
                onDrop={(e) => handleDropOnContainer(e, el.id)}
              >
                  {el.children?.length === 0 && <div className="text-xs text-slate-400 text-center py-2 pointer-events-none">Container (Hierher ziehen)</div>}
                  {el.children?.map(child => renderElement(child))}
                  {isSelected && <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-1">Container</div>}
              </div>
          );
      } else if (el.type === 'field') {
          let icon = <Type size={14} className="text-slate-400"/>;
          if (el.widgetType === 'checkbox') icon = <div className="w-3 h-3 border border-slate-400 rounded-sm"></div>;
          if (el.widgetType === 'select') icon = <List size={14} className="text-slate-400"/>;

          return (
              <div 
                key={el.id} 
                className={`${baseClass} ${el.className || ''} bg-white p-2 rounded border-slate-200 shadow-sm mb-2`}
                onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
              >
                  <label className="block text-sm font-semibold text-slate-600 mb-1 pointer-events-none flex justify-between">
                      {el.label}
                      <span className="text-[10px] uppercase text-slate-300 font-normal">{el.widgetType || 'auto'}</span>
                  </label>
                  <div className="h-8 bg-slate-100 border border-slate-300 rounded w-full pointer-events-none flex items-center px-2 gap-2">
                      {icon}
                      <span className="text-xs text-slate-400 italic">
                          {el.widgetType === 'select' ? 'Dropdown Auswahl' : 'Wert eingeben'}
                      </span>
                  </div>
              </div>
          );
      } else if (el.type === 'label') {
           return (
              <div 
                key={el.id} 
                className={`${baseClass} ${el.className || ''} p-1`}
                onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
              >
                  {el.label}
              </div>
          );
      } else if (el.type === 'subform') {
           return (
              <div 
                key={el.id} 
                className={`${baseClass} ${el.className || ''} p-4`}
                onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
              >
                  <div className="font-bold text-indigo-700 flex items-center gap-2"><Layout size={14}/> Subform: {el.label}</div>
                  {el.subform && (
                      <div className="text-xs text-indigo-500 mt-2 flex gap-3">
                          <span className={`flex items-center gap-1 ${el.subform.canAdd !== false ? 'text-green-600' : 'text-slate-400'}`}>
                              <div className={`w-2 h-2 rounded-full ${el.subform.canAdd !== false ? 'bg-green-500' : 'bg-slate-300'}`}></div> Neu
                          </span>
                          <span className={`flex items-center gap-1 ${el.subform.canDelete !== false ? 'text-red-600' : 'text-slate-400'}`}>
                              <div className={`w-2 h-2 rounded-full ${el.subform.canDelete !== false ? 'bg-red-500' : 'bg-slate-300'}`}></div> Löschen
                          </span>
                          <span className={`flex items-center gap-1 ${el.subform.canEdit !== false ? 'text-blue-600' : 'text-slate-400'}`}>
                              <div className={`w-2 h-2 rounded-full ${el.subform.canEdit !== false ? 'bg-blue-500' : 'bg-slate-300'}`}></div> Edit
                          </span>
                      </div>
                  )}
              </div>
          );
      }
      return null;
  };

  const selectedEl = getSelectedElement();

  return (
    <div className="h-full bg-slate-200 flex">
      {linkingSubform && mainFormTable && (
        <LinkSubformModal 
          mainFormTable={mainFormTable}
          subFormTable={allTables.find(t => t.id === linkingSubform.sourceId)!}
          onLink={handleLinkSubform}
          onClose={() => setLinkingSubform(null)}
        />
      )}

      {showLookupModal && selectedEl && selectedEl.lookup && (
          <LookupConfigModal
            allTables={allTables}
            initialConfig={selectedEl.lookup}
            onSave={handleLookupSave}
            onClose={() => setShowLookupModal(false)}
          />
      )}
      
      {/* Canvas */}
      <div className="flex-1 p-8 overflow-y-auto" onClick={() => setSelectedElementId(null)}>
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-slate-800">Formular-Designer: {form.name}</h2>
                <div className="flex gap-2">
                    <button 
                        onClick={toggleFullScreen}
                        className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-semibold border ${form.settings?.isFullScreen ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-white text-slate-700 border-slate-300'}`}
                        title="Formular füllt im View-Modus den gesamten Bereich aus"
                    >
                        <Monitor size={16}/> {form.settings?.isFullScreen ? 'Vollbild: Ein' : 'Vollbild: Aus'}
                    </button>
                    <button 
                        onClick={toggleMode} 
                        className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-semibold border ${form.mode === 'readonly' ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-white text-slate-700 border-slate-300'}`}
                    >
                        {form.mode === 'readonly' ? <Eye size={16}/> : <Edit3 size={16}/>}
                        {form.mode === 'readonly' ? 'Standard: Leseansicht' : 'Standard: Bearbeiten'}
                    </button>
                </div>
            </div>

            <div className="bg-white min-h-[500px] shadow-lg rounded-lg overflow-hidden">
                {form.layout ? renderElement(form.layout) : <div className="p-10 text-center text-slate-400">Kein Layout vorhanden.</div>}
            </div>
        </div>
      </div>
      
      {/* Sidebar Right: Properties */}
      <div className="w-72 bg-white border-l border-slate-300 flex flex-col">
          
          {/* Properties Panel */}
          <div className="flex-1 p-4 border-b border-slate-300 overflow-y-auto">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Edit3 size={16}/> Eigenschaften
              </h3>
              
              {selectedEl ? (
                  <div className="space-y-4 text-sm">
                      <div className="font-mono text-xs text-slate-500 mb-2">ID: {selectedEl.id.substring(0,8)}...</div>
                      <div>
                          <label className="block font-bold text-slate-700 mb-1">Typ</label>
                          <input type="text" disabled value={selectedEl.type} className="w-full bg-slate-100 border rounded p-1" />
                      </div>
                      
                      {(selectedEl.type === 'field' || selectedEl.type === 'label' || selectedEl.type === 'subform') && (
                          <div>
                              <label className="block font-bold text-slate-700 mb-1">{selectedEl.type === 'label' ? 'Text' : 'Titel / Label'}</label>
                              <input 
                                type="text" 
                                value={selectedEl.label || ''} 
                                onChange={e => handlePropertyChange('label', e.target.value)}
                                className="w-full border border-slate-300 rounded p-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                              />
                          </div>
                      )}

                      {/* Subform Specific Permissions */}
                      {selectedEl.type === 'subform' && selectedEl.subform && (
                          <div className="border border-indigo-200 bg-indigo-50 rounded p-2 mt-2">
                              <p className="font-bold text-indigo-800 mb-2 flex items-center gap-1"><Shield size={14}/> Berechtigungen</p>
                              <div className="space-y-2">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={selectedEl.subform.canAdd !== false} 
                                        onChange={e => handleSubformPermissionChange('canAdd', e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <span>Neu anlegen erlauben</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={selectedEl.subform.canDelete !== false} 
                                        onChange={e => handleSubformPermissionChange('canDelete', e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <span>Löschen erlauben</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={selectedEl.subform.canEdit !== false} 
                                        onChange={e => handleSubformPermissionChange('canEdit', e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <span>Bearbeiten erlauben</span>
                                  </label>
                              </div>
                          </div>
                      )}

                      {selectedEl.type === 'field' && (
                          <div className="border p-2 rounded bg-slate-50">
                              <label className="block font-bold text-slate-700 mb-1">Eingabe-Typ (Widget)</label>
                              <select 
                                  value={selectedEl.widgetType || ''}
                                  onChange={e => handlePropertyChange('widgetType', e.target.value)}
                                  className="w-full border border-slate-300 rounded p-1 mb-2 bg-white"
                              >
                                  <option value="">Automatisch</option>
                                  <option value="text">Textfeld</option>
                                  <option value="textarea">Mehrzeilig</option>
                                  <option value="number">Zahl</option>
                                  <option value="date">Datum</option>
                                  <option value="checkbox">Checkbox (Ja/Nein)</option>
                                  <option value="select">Dropdown (Lookup)</option>
                              </select>

                              {selectedEl.widgetType === 'select' && (
                                  <div className="mt-2 pt-2 border-t border-slate-200">
                                      <p className="text-xs font-bold text-blue-600 mb-2">Verknüpfung (Lookup)</p>
                                      
                                      <button 
                                        onClick={() => setShowLookupModal(true)}
                                        className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-semibold py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors border border-blue-200 mb-3"
                                      >
                                          <Settings2 size={14} /> Konfigurieren
                                      </button>
                                      
                                      {selectedEl.lookup?.tableId && (
                                          <div className="text-[10px] text-slate-500 space-y-2 bg-white p-2 rounded border border-slate-100">
                                              <div>Quelle: {allTables.find(t => t.id === selectedEl.lookup?.tableId)?.name || 'Unbekannt'}</div>
                                              <div>Felder: {selectedEl.lookup?.labelFields.length || 0} ausgewählt</div>
                                              
                                              {/* Quick Create Settings */}
                                              <div className="pt-2 border-t border-slate-100 mt-1">
                                                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                                                      <input 
                                                        type="checkbox" 
                                                        checked={selectedEl.lookup.allowQuickCreate || false}
                                                        onChange={e => handleLookupPropertyChange('allowQuickCreate', e.target.checked)}
                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                                                      />
                                                      <span className="font-semibold text-slate-700">Erstellen erlauben (+)</span>
                                                  </label>
                                                  
                                                  {selectedEl.lookup.allowQuickCreate && (
                                                      <div>
                                                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Formular für Neu-Anlage:</label>
                                                          <select 
                                                              value={selectedEl.lookup.quickCreateFormId || ''}
                                                              onChange={e => handleLookupPropertyChange('quickCreateFormId', e.target.value)}
                                                              className="w-full border border-slate-300 rounded p-1 text-[10px]"
                                                          >
                                                              <option value="">(Standard / Automatisch)</option>
                                                              {allForms
                                                                .filter(f => f.sourceId === selectedEl.lookup?.tableId)
                                                                .map(f => (
                                                                  <option key={f.id} value={f.id}>{f.name}</option>
                                                              ))}
                                                          </select>
                                                      </div>
                                                  )}
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>
                      )}

                      <div>
                          <label className="block font-bold text-slate-700 mb-1">CSS Klassen (Tailwind)</label>
                          <textarea 
                            value={selectedEl.className || ''} 
                            onChange={e => handlePropertyChange('className', e.target.value)}
                            className="w-full border border-slate-300 rounded p-1 h-20 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                          />
                          <p className="text-[10px] text-slate-500 mt-1">z.B. p-4 bg-red-500 text-white font-bold</p>
                      </div>

                      <button onClick={deleteSelected} className="w-full mt-4 bg-red-50 text-red-600 border border-red-200 p-2 rounded hover:bg-red-100 flex items-center justify-center gap-2">
                          <Trash2 size={14} /> Element löschen
                      </button>
                  </div>
              ) : (
                  <div className="text-slate-500 text-sm">
                      <p className="italic mb-4">Formulareigenschaften</p>
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={form.settings?.isFullScreen || false} 
                            onChange={toggleFullScreen}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Vollbild-Modus</span>
                      </label>
                      <p className="text-xs text-slate-400 mt-1">Wenn aktiviert, nimmt das Formular den gesamten Anzeigebereich ein (kein Rand, kein Schatten).</p>
                  </div>
              )}
          </div>

          {/* Toolbox Bottom (Fields) */}
          <div className="h-1/3 border-t border-slate-300 p-4 bg-slate-50 overflow-y-auto">
             <h3 className="font-bold text-slate-700 mb-2 text-xs uppercase tracking-wider">Datenfelder</h3>
             <div className="space-y-1">
                 {mainFormTable?.fields.map(f => (
                     <div 
                        key={f.id} 
                        draggable 
                        onDragStart={e => handleDragStartField(e, f)}
                        className="bg-white border border-slate-300 p-1.5 rounded cursor-grab flex items-center gap-2 text-sm hover:shadow-sm"
                     >
                         <GripVertical size={12} className="text-slate-400"/> {f.name}
                     </div>
                 ))}
             </div>
             
             <h3 className="font-bold text-slate-700 mt-4 mb-2 text-xs uppercase tracking-wider">Sub-Formulare</h3>
             <div className="space-y-1">
                 {allForms.filter(f => f.id !== form.id).map(f => (
                     <div 
                        key={f.id} 
                        draggable 
                        onDragStart={e => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'form', formId: f.id })); }}
                        className="bg-indigo-50 border border-indigo-200 p-1.5 rounded cursor-grab flex items-center gap-2 text-sm hover:shadow-sm"
                     >
                         <Layout size={12} className="text-indigo-500"/> {f.name}
                     </div>
                 ))}
             </div>
          </div>
      </div>
    </div>
  );
};
