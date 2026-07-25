
import React, { useState } from 'react';
import { Form, Table, Query, FormElement, Relationship } from '../../types/index';
import { Layout, Eye, Edit3, Monitor, GripVertical, Type, Box, List, Columns, Plus, ChevronDown } from 'lucide-react';
import { LinkSubformModal } from './components/LinkSubformModal';
import { LookupConfigModal } from './components/LookupConfigModal';
import { PropertiesPanel } from './designer/PropertiesPanel';

interface FormDesignerViewProps {
  form: Form;
  allForms: Form[];
  allTables: Table[];
  queries: Query[];
  relationships: Relationship[];
  onFormChange: (form: Form) => void;
  actionTrigger?: { action: string, timestamp: number }; 
}

export const FormDesignerView: React.FC<FormDesignerViewProps> = ({ form, allForms, allTables, queries, relationships, onFormChange, actionTrigger }) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [linkingSubform, setLinkingSubform] = useState<Form | null>(null);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'layout' | 'validation'>('layout');
  
  const mainFormTable = allTables.find(t => t.id === form.sourceId);

  // Dynamically compute the displayed fields to ensure newly-added table fields are immediately available
  const displayedFields = React.useMemo(() => {
    if (!mainFormTable) return form.fields || [];
    const tableFields = mainFormTable.fields || [];
    const currentFields = form.fields || [];
    const existingFieldIds = new Set(currentFields.map(f => f.fieldId));
    const missing = tableFields.filter(f => !existingFieldIds.has(f.id));
    if (missing.length === 0) return currentFields;
    return [
      ...currentFields,
      ...missing.map(f => ({ fieldId: f.id, label: f.name }))
    ];
  }, [form.fields, mainFormTable?.fields]);

  // Synchronize the newly-added table fields back to the form object
  const tableFieldIdsString = JSON.stringify(mainFormTable?.fields?.map(f => f.id) || []);
  const formFieldIdsString = JSON.stringify(form.fields?.map(f => f.fieldId) || []);

  React.useEffect(() => {
    if (!mainFormTable) return;
    const tableFields = mainFormTable.fields || [];
    const currentFields = form.fields || [];
    const existingFieldIds = new Set(currentFields.map(f => f.fieldId));
    
    const missing = tableFields.filter(f => !existingFieldIds.has(f.id));
    if (missing.length > 0) {
      const merged = [
        ...currentFields,
        ...missing.map(f => ({ fieldId: f.id, label: f.name }))
      ];
      onFormChange({ ...form, fields: merged });
    }
  }, [tableFieldIdsString, formFieldIdsString, form.id]);

  // --- Helper Functions ---
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

  const updateFormLayout = (updater: (layout: FormElement) => void) => {
      const newLayout = JSON.parse(JSON.stringify(form.layout));
      updater(newLayout);
      onFormChange({ ...form, layout: newLayout });
  };

  // --- Event Handlers ---
  const handlePropertyChange = (key: keyof FormElement, value: any) => {
      if (!selectedElementId) return;
      updateFormLayout((layout) => {
          const el = findElement(layout, selectedElementId);
          if (el) {
              (el as any)[key] = value;
              // Auto-init lookup if needed
              if (key === 'widgetType' && value === 'select' && !el.lookup) {
                  el.lookup = { tableId: allTables[0]?.id || '', valueFieldId: '', labelFields: [] };
              }
          }
      });
  };

  const handleLookupSave = (newLookup: any) => {
      if (!selectedElementId) return;
      updateFormLayout((layout) => {
          const el = findElement(layout, selectedElementId);
          if (el) el.lookup = { ...el.lookup, ...newLookup };
      });
  };

  const deleteSelected = () => {
      if (!selectedElementId || selectedElementId === form.layout?.id) return;
      updateFormLayout((layout) => {
          const removeNode = (parent: FormElement, id: string): boolean => {
              if (!parent.children) return false;
              const idx = parent.children.findIndex(c => c.id === id);
              if (idx > -1) {
                  parent.children.splice(idx, 1);
                  return true;
              }
              return parent.children.some(c => removeNode(c, id));
          };
          removeNode(layout, selectedElementId);
      });
      setSelectedElementId(null);
  };

  // --- Action Trigger Handling (From Ribbon) ---
  React.useEffect(() => {
    if (!actionTrigger) return;
    if (actionTrigger.action === 'export_form') {
        // ... export logic ...
        return;
    }
    
    // Add Elements logic
    updateFormLayout((layout) => {
        let target = selectedElementId ? findElement(layout, selectedElementId) : layout;
        // If selected is a field, go to parent container
        if (target && target.type !== 'container') {
             // Basic finding of parent would be better, for now fallback to root if not container
             // Ideally we traverse to find parent, but for simplicity:
             target = layout; 
        }
        if (!target) target = layout;
        
        const newId = crypto.randomUUID();
        const newEl: FormElement = { id: newId, type: 'container', children: [] }; // Default placeholder

        if (actionTrigger.action === 'form_add_label') {
            newEl.type = 'label'; newEl.label = 'Neues Label'; newEl.className = 'font-bold text-lg mb-2';
        } else if (actionTrigger.action === 'form_add_button') {
            newEl.type = 'button'; newEl.label = 'Aktion ausführen'; newEl.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded';
            newEl.actions = [];
        } else if (actionTrigger.action === 'form_add_container') {
            newEl.type = 'container'; newEl.className = 'p-4 border border-dashed border-slate-300 rounded bg-slate-50 min-h-[60px]';
        } else if (actionTrigger.action === 'form_add_2col') {
            newEl.type = 'container'; newEl.className = 'grid grid-cols-2 gap-4';
            newEl.children = [
                { id: crypto.randomUUID(), type: 'container', className: 'border border-dashed border-slate-300 p-2 min-h-[60px] rounded bg-slate-50/50', children: [] },
                { id: crypto.randomUUID(), type: 'container', className: 'border border-dashed border-slate-300 p-2 min-h-[60px] rounded bg-slate-50/50', children: [] }
            ];
        }

        if (target && target.children) target.children.push(newEl);
    });
  }, [actionTrigger]);

  // --- Drag & Drop Logic ---

  // 1. Start Dragging an existing element
  const handleDragStart = (e: React.DragEvent, elementId: string) => {
      e.stopPropagation();
      setDraggedElementId(elementId);
      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'move_element', id: elementId }));
      e.dataTransfer.effectAllowed = 'move';
  };

  // 2. Drop on Container (Append to end)
  const handleDropOnContainer = (e: React.DragEvent, containerId: string) => {
      e.preventDefault(); e.stopPropagation();
      const json = e.dataTransfer.getData('application/json');
      if (!json) return;
      
      try {
        const data = JSON.parse(json);
        updateFormLayout((layout) => {
            const container = findElement(layout, containerId);
            if (!container || !container.children) return;

            if (data.type === 'move_element') {
                if (data.id === containerId) return; // Can't drop into self
                // Remove from old pos
                let itemToMove: FormElement | null = null;
                
                const removeAndFind = (parent: FormElement): boolean => {
                    if (!parent.children) return false;
                    const idx = parent.children.findIndex(c => c.id === data.id);
                    if (idx > -1) {
                        itemToMove = parent.children[idx];
                        parent.children.splice(idx, 1);
                        return true;
                    }
                    return parent.children.some(c => removeAndFind(c));
                };
                
                // If drop target is inside the dragged item (recursion check), abort
                const isChild = (parent: FormElement, childId: string): boolean => {
                    return parent.id === childId || (parent.children || []).some(c => isChild(c, childId));
                };
                if (isChild(findElement(layout, data.id)!, containerId)) return;

                removeAndFind(layout);
                if (itemToMove) container.children.push(itemToMove);

            } else if (data.type === 'field') {
                // New Field
                container.children.push({ id: crypto.randomUUID(), type: 'field', fieldId: data.fieldId, label: data.label, className: 'mb-4' });
            } else if (data.type === 'form') {
                // New Subform
                setLinkingSubform(allForms.find(f => f.id === data.formId) || null);
                (window as any).__tempContainerId = containerId;
            }
        });
      } catch (e) { console.error(e); }
      setDraggedElementId(null);
  };

  // 3. Drop on Element (Insert Before) - For Reordering & Inserting new items
  const handleDropOnElement = (e: React.DragEvent, targetElementId: string) => {
      e.preventDefault(); e.stopPropagation();
      const json = e.dataTransfer.getData('application/json');
      if (!json) return;

      try {
          const data = JSON.parse(json);
          // If moving self, do nothing
          if (data.type === 'move_element' && data.id === targetElementId) return;

          updateFormLayout((layout) => {
              let itemToInsert: FormElement | null = null;

              // CASE A: Moving existing element
              if (data.type === 'move_element') {
                  const removeAndFind = (parent: FormElement): boolean => {
                      if (!parent.children) return false;
                      const idx = parent.children.findIndex(c => c.id === data.id);
                      if (idx > -1) {
                          itemToInsert = parent.children[idx];
                          parent.children.splice(idx, 1);
                          return true;
                      }
                      return parent.children.some(c => removeAndFind(c));
                  };
                  
                  const draggedEl = findElement(layout, data.id);
                  const targetEl = findElement(layout, targetElementId);
                  
                  // Check recursion (dropping parent into child)
                  if(draggedEl && targetEl) {
                      const isChild = (parent: FormElement, childId: string): boolean => {
                          return parent.id === childId || (parent.children || []).some(c => isChild(c, childId));
                      };
                      if (!isChild(draggedEl, targetElementId)) {
                          removeAndFind(layout);
                      }
                  }
              } 
              // CASE B: Dropping new Field
              else if (data.type === 'field') {
                  itemToInsert = { 
                      id: crypto.randomUUID(), 
                      type: 'field', 
                      fieldId: data.fieldId, 
                      label: data.label, 
                      className: 'mb-4' 
                  };
              }
              // CASE C: Dropping new Subform (Not supported for insert-before yet, use container drop)
              
              // Perform Insertion
              if (itemToInsert) {
                  const insertBefore = (parent: FormElement): boolean => {
                      if (!parent.children) return false;
                      const idx = parent.children.findIndex(c => c.id === targetElementId);
                      if (idx > -1) {
                          parent.children.splice(idx, 0, itemToInsert!);
                          return true;
                      }
                      return parent.children.some(c => insertBefore(c));
                  };
                  insertBefore(layout);
              }
          });
      } catch (e) { console.error(e); }
      setDraggedElementId(null);
  };

  const handleLinkSubform = (m: string, c: string) => {
      const containerId = (window as any).__tempContainerId;
      if (linkingSubform && containerId) {
          updateFormLayout((layout) => {
              const container = findElement(layout, containerId);
              if (container && container.children) {
                  container.children.push({
                      id: crypto.randomUUID(), type: 'subform', label: linkingSubform.name,
                      subform: { formId: linkingSubform.id, masterLinkFieldId: m, childLinkFieldId: c },
                      className: 'border p-2 rounded bg-indigo-50'
                  });
              }
          });
      }
      setLinkingSubform(null);
  };

  // --- Recursive Renderer ---
  const renderElement = (el: FormElement) => {
      const isSelected = el.id === selectedElementId;
      const isDragging = el.id === draggedElementId;
      
      const commonProps = {
          onClick: (e: React.MouseEvent) => { e.stopPropagation(); setSelectedElementId(el.id); },
          draggable: true,
          onDragStart: (e: React.DragEvent) => handleDragStart(e, el.id),
          onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, // Allow Drop
          onDrop: (e: React.DragEvent) => handleDropOnElement(e, el.id)
      };

      const baseClass = `relative border transition-all cursor-pointer ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 z-10' : 'border-transparent hover:border-blue-300'} ${isDragging ? 'opacity-40' : 'opacity-100'}`;

      // Grip Handle for Items
      const GripHandle = () => (
          <div className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-move text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <GripVertical size={12} />
          </div>
      );

      if (el.type === 'container') {
          return (
              <div 
                key={el.id} 
                className={`${baseClass} ${el.className} min-h-[40px] group/container relative`}
                onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => handleDropOnContainer(e, el.id)}
                draggable // Containers are draggable too
                onDragStart={(e) => handleDragStart(e, el.id)}
              >
                  {/* Container Grip - Top Right */}
                  <div className="absolute right-0 top-0 p-1 cursor-move text-slate-300 hover:text-blue-500 opacity-0 group-hover/container:opacity-100 z-20 bg-white/50 rounded">
                      <GripVertical size={14} />
                  </div>
                  
                  {el.children?.length === 0 && <div className="text-xs text-slate-400 text-center py-4 border-2 border-dashed border-slate-200 rounded pointer-events-none">Hier Elemente ablegen</div>}
                  {el.children?.map(renderElement)}
              </div>
          );
      }
      
      if (el.type === 'field') {
          return (
              <div key={el.id} className={`${baseClass} ${el.className} bg-white p-3 pr-4 pl-8 rounded-lg border border-slate-200 group shadow-sm hover:shadow transition-shadow`} {...commonProps}>
                  <GripHandle />
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 pointer-events-none">{el.label}</label>
                  <div className="flex gap-2 relative pointer-events-none">
                    {el.widgetType === 'select' ? (
                         <div className="w-full relative pointer-events-none">
                             <select className="w-full appearance-none bg-white border border-slate-300 text-slate-600 text-sm rounded px-3 py-2 shadow-sm pointer-events-none" disabled>
                                 <option>Auswählen...</option>
                             </select>
                             <div className="absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                <ChevronDown size={14} />
                             </div>
                         </div>
                    ) : el.widgetType === 'textarea' ? (
                         <textarea className="w-full bg-slate-50 border border-slate-300 text-slate-400 text-sm rounded px-3 py-2 shadow-none pointer-events-none min-h-[80px]" placeholder="Text eingeben..." readOnly />
                    ) : el.widgetType === 'checkbox' ? (
                         <div className="flex items-center gap-2 pointer-events-none py-1.5">
                             <input type="checkbox" className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" readOnly />
                             <span className="text-sm text-slate-600">Aktivieren</span>
                         </div>
                    ) : (
                         <input type="text" className="w-full bg-slate-50 border border-slate-300 text-slate-400 text-sm rounded px-3 py-2 shadow-none pointer-events-none" placeholder="Eingabe..." readOnly />
                    )}
                    {el.widgetType === 'select' && el.lookup?.allowQuickCreate && (
                        <div className="h-9 w-9 shrink-0 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-center text-emerald-600 shadow-sm pointer-events-none" title="Quick Create aktiv">
                            <Plus size={16} strokeWidth={2.5} />
                        </div>
                    )}
                  </div>
              </div>
          );
      }
      
      if (el.type === 'label') {
          return (
              <div key={el.id} className={`${baseClass} ${el.className} pl-8 py-2 group`} {...commonProps}>
                  <GripHandle />
                  {el.label}
              </div>
          );
      }

      if (el.type === 'button') {
          return (
              <div key={el.id} className={`${baseClass} pl-8 pr-2 py-2 group inline-block mr-2`} {...commonProps}>
                  <GripHandle />
                  <button className={`${el.className} pointer-events-none opacity-90 shadow-sm transition-all focus:ring`}>
                      {el.label || 'Button'}
                  </button>
                  {el.actions && el.actions.length > 0 && (
                      <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow border border-white">
                          {el.actions.length}
                      </div>
                  )}
              </div>
          );
      }

      if (el.type === 'subform') {
          return (
              <div key={el.id} className={`${baseClass} ${el.className} p-4 pl-6 group`} {...commonProps}>
                  <GripHandle />
                  <div className="font-bold text-indigo-700 pointer-events-none">Subform: {el.label}</div>
                  <div className="text-xs text-indigo-400">Verknüpftes Formular</div>
              </div>
          );
      }
      return null;
  };

  const selectedEl = form.layout ? findElement(form.layout, selectedElementId || '') : null;

  return (
    <div className="h-full bg-slate-200 flex">
      {/* Modals */}
      {linkingSubform && (
        <LinkSubformModal 
          mainForm={form}
          subForm={linkingSubform}
          onLink={handleLinkSubform}
          onClose={() => setLinkingSubform(null)}
        />
      )}
      {showLookupModal && selectedEl && selectedEl.lookup && (
          <LookupConfigModal allTables={allTables} queries={queries} initialConfig={selectedEl.lookup} onSave={handleLookupSave} onClose={() => setShowLookupModal(false)} />
      )}

      {/* Main Canvas */}
      <div className="flex-1 p-8 overflow-y-auto" onClick={() => setSelectedElementId(null)}>
         <div className="max-w-4xl mx-auto">
            <div className="bg-white min-h-[600px] shadow-lg rounded-lg overflow-hidden flex flex-col border border-slate-300">
                <div className="p-4 bg-slate-800 text-white font-bold flex justify-between items-center shrink-0">
                    <div className="flex gap-4 items-center">
                        <span>{form.name}</span>
                        <div className="flex bg-black/20 rounded p-1">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setActiveTab('layout'); }} 
                                className={`px-3 py-1 rounded text-sm transition-colors ${activeTab === 'layout' ? 'bg-white text-slate-900 font-bold' : 'text-white/70 hover:text-white'}`}
                            >
                                Layout
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setActiveTab('validation'); }} 
                                className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${activeTab === 'validation' ? 'bg-white text-slate-900 font-bold' : 'text-white/70 hover:text-white'}`}
                            >
                                <Monitor size={14}/> UX & Logik
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); onFormChange({...form, mode: form.mode === 'edit' ? 'readonly' : 'edit'}); }} className="text-xs bg-slate-700 px-2 py-1 rounded">
                            {form.mode === 'edit' ? 'Modus: Bearbeiten' : 'Modus: Lesen'}
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto relative">
                    {activeTab === 'layout' ? (
                        <div className="p-6">
                            {form.layout ? renderElement(form.layout) : <div className="text-slate-400 text-center mt-20">Kein Layout.</div>}
                        </div>
                    ) : (
                        <div className="p-6 animate-in fade-in space-y-6">
                            <div className="bg-slate-100 p-4 border border-slate-200 rounded-lg">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><Type size={18} /> Cross-Field Validation</h3>
                                <p className="text-xs text-slate-600 mb-4">Spezifische Sichtbarkeits- und Pflichtfeld-Regeln für das User Interface.</p>
                                
                                <div className="space-y-2">
                                    {(form.crossFieldValidations || []).map((rule, idx) => (
                                        <div key={rule.id} className="flex flex-wrap gap-2 sm:gap-3 items-center bg-white border border-slate-200 rounded p-3 text-sm shadow-sm">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-slate-700">Wenn</span>
                                                <select 
                                                     className="border rounded p-1.5 bg-slate-50 text-xs font-bold text-blue-600 max-w-[150px]"
                                                     value={rule.triggerFieldId}
                                                     onChange={e => {
                                                         const updated = [...(form.crossFieldValidations || [])];
                                                         updated[idx] = { ...updated[idx], triggerFieldId: e.target.value };
                                                         onFormChange({...form, crossFieldValidations: updated});
                                                     }}
                                                 >
                                                    {displayedFields.map(f => (
                                                        <option key={f.fieldId} value={f.fieldId}>{f.label}</option>
                                                    ))}
                                                 </select>
                                                <select 
                                                    className="border rounded p-1.5 bg-slate-50 text-xs"
                                                    value={rule.condition}
                                                    onChange={e => {
                                                        const updated = [...(form.crossFieldValidations || [])];
                                                        updated[idx] = { ...updated[idx], condition: e.target.value as any };
                                                        onFormChange({...form, crossFieldValidations: updated});
                                                    }}
                                                >
                                                    <option value="equals">=(gleich)</option>
                                                    <option value="not_equals">!=(ungleich)</option>
                                                    <option value="greater_than">&gt;(größer als)</option>
                                                    <option value="less_than">&lt;(kleiner als)</option>
                                                    <option value="not_empty">ist gefüllt</option>
                                                    <option value="is_empty">ist leer</option>
                                                    <option value="is_true">ist angehakt</option>
                                                    <option value="is_false">ist nicht angehakt</option>
                                                </select>
                                                {(rule.condition === 'equals' || rule.condition === 'not_equals' || rule.condition === 'greater_than' || rule.condition === 'less_than') && (
                                                    <input 
                                                        type="text" 
                                                        className="border rounded p-1.5 w-24 text-xs" 
                                                        placeholder="Wert..."
                                                        value={rule.triggerValue || ''}
                                                        onChange={e => {
                                                            const updated = [...(form.crossFieldValidations || [])];
                                                            updated[idx] = { ...updated[idx], triggerValue: e.target.value };
                                                            onFormChange({...form, crossFieldValidations: updated});
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            
                                            <span className="text-slate-400 font-bold hidden sm:inline">»</span>
                                            
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-slate-700">dann mache</span>
                                                <select 
                                                     className="border rounded p-1.5 bg-slate-50 text-xs font-bold text-indigo-600 max-w-[150px]"
                                                     value={rule.targetFieldId}
                                                     onChange={e => {
                                                         const updated = [...(form.crossFieldValidations || [])];
                                                         updated[idx] = { ...updated[idx], targetFieldId: e.target.value };
                                                         onFormChange({...form, crossFieldValidations: updated});
                                                     }}
                                                 >
                                                    {displayedFields.map(f => (
                                                        <option key={f.fieldId} value={f.fieldId}>{f.label}</option>
                                                    ))}
                                                 </select>
                                                <select 
                                                    className="border rounded p-1.5 bg-slate-50 text-xs"
                                                    value={rule.action}
                                                    onChange={e => {
                                                        const updated = [...(form.crossFieldValidations || [])];
                                                        updated[idx] = { ...updated[idx], action: e.target.value as any };
                                                        onFormChange({...form, crossFieldValidations: updated});
                                                    }}
                                                >
                                                    <option value="require">zum Pflichtfeld</option>
                                                    <option value="hide">unsichtbar</option>
                                                    <option value="disable">gesperrt (readonly)</option>
                                                </select>
                                            </div>
                                            
                                            <button 
                                                className="text-red-500 hover:bg-red-50 p-1.5 rounded ml-auto text-xs font-bold shrink-0 self-start sm:self-auto"
                                                onClick={() => {
                                                    const updated = (form.crossFieldValidations || []).filter(r => r.id !== rule.id);
                                                    onFormChange({...form, crossFieldValidations: updated});
                                                }}
                                            >
                                                Löschen
                                            </button>
                                        </div>
                                    ))}

                                    <button 
                                        className="mt-4 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-bold"
                                        onClick={() => {
                                            const newRule = {
                                                id: crypto.randomUUID(),
                                                triggerFieldId: displayedFields[0]?.fieldId || '',
                                                condition: 'equals' as const,
                                                triggerValue: '',
                                                targetFieldId: displayedFields[1]?.fieldId || '',
                                                action: 'require' as const
                                            };
                                            onFormChange({...form, crossFieldValidations: [...(form.crossFieldValidations || []), newRule]});
                                        }}
                                    >
                                        <Plus size={16}/> Neue UX Regel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
         </div>
      </div>

      {/* Sidebar */}
      <div className="w-72 bg-white border-l border-slate-300 flex flex-col h-full">
          <div className="h-2/3 overflow-hidden flex flex-col">
            <PropertiesPanel 
                form={form}
                selectedElement={selectedEl}
                allTables={allTables}
                allForms={allForms}
                onPropertyChange={handlePropertyChange}
                onFormPropertyChange={(k, v) => onFormChange({...form, [k]: v})}
                onLookupPropertyChange={(k, v) => { if(selectedEl?.lookup) handleLookupSave({ [k]: v }); }}
                onSubformPermissionChange={(k, v) => { if(selectedEl?.subform) { 
                    updateFormLayout(l => { const el = findElement(l, selectedElementId!); if(el && el.subform) (el.subform as any)[k] = v; });
                }}}
                onDeleteSelected={deleteSelected}
                onShowLookupModal={() => setShowLookupModal(true)}
                onToggleFullScreen={() => onFormChange({...form, settings: {...form.settings, isFullScreen: !form.settings?.isFullScreen}})}
                onToggleEditButton={() => onFormChange({...form, settings: {...form.settings, showEditToggle: !form.settings?.showEditToggle}})}
                onToggleTableSplitView={() => onFormChange({...form, settings: {...form.settings, showTableSplitView: !form.settings?.showTableSplitView}})}
            />
          </div>
          <div className="h-1/3 border-t border-slate-300 p-4 overflow-y-auto bg-slate-50">
             <h4 className="font-bold text-xs text-slate-500 uppercase mb-2">Verfügbare Felder</h4>
             <p className="text-[10px] text-slate-400 mb-2">Drag & Drop auf das Formular.</p>
             <div className="space-y-1">
                 {displayedFields.map(f => (
                     <div 
                        key={f.fieldId} 
                        draggable 
                        onDragStart={e => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'field', fieldId: f.fieldId, label: f.label })); }} 
                        className="bg-white border p-1.5 rounded cursor-grab text-sm hover:shadow-sm flex gap-2 hover:border-blue-400 active:cursor-grabbing"
                     >
                         <GripVertical size={14} className="text-slate-400"/> {f.label}
                     </div>
                 ))}
             </div>
             <h4 className="font-bold text-xs text-slate-500 uppercase mt-4 mb-2">Unterformulare</h4>
             <div className="space-y-1">
                 {allForms.filter(f => f.id !== form.id).map(f => (
                     <div key={f.id} draggable onDragStart={e => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'form', formId: f.id })); }} className="bg-indigo-50 border border-indigo-200 p-1.5 rounded cursor-grab text-sm flex gap-2 text-indigo-700 hover:border-indigo-400 active:cursor-grabbing">
                         <Layout size={14}/> {f.name}
                     </div>
                 ))}
             </div>
          </div>
      </div>
    </div>
  );
};
