
import React, { useState } from 'react';
import { Form, Table, FormElement, Relationship } from '../../types/index';
import { Layout, Eye, Edit3, Monitor, GripVertical, Type, Box, List } from 'lucide-react';
import { LinkSubformModal } from './components/LinkSubformModal';
import { LookupConfigModal } from './components/LookupConfigModal';
import { PropertiesPanel } from './designer/PropertiesPanel';

interface FormDesignerViewProps {
  form: Form;
  allForms: Form[];
  allTables: Table[];
  relationships: Relationship[];
  onFormChange: (form: Form) => void;
  actionTrigger?: { action: string, timestamp: number }; 
}

export const FormDesignerView: React.FC<FormDesignerViewProps> = ({ form, allForms, allTables, relationships, onFormChange, actionTrigger }) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [linkingSubform, setLinkingSubform] = useState<Form | null>(null);
  const [showLookupModal, setShowLookupModal] = useState(false);
  
  const mainFormTable = allTables.find(t => t.id === form.sourceId);

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
        if (target && target.type !== 'container') target = layout; // Fallback to root
        
        const newId = crypto.randomUUID();
        const newEl: FormElement = { id: newId, type: 'container', children: [] }; // Default placeholder

        if (actionTrigger.action === 'form_add_label') {
            newEl.type = 'label'; newEl.label = 'Neues Label'; newEl.className = 'font-bold text-lg mb-2';
        } else if (actionTrigger.action === 'form_add_container') {
            newEl.type = 'container'; newEl.className = 'p-4 border border-dashed border-slate-300 rounded';
        } else if (actionTrigger.action === 'form_add_2col') {
            newEl.type = 'container'; newEl.className = 'grid grid-cols-2 gap-4';
            newEl.children = [
                { id: crypto.randomUUID(), type: 'container', className: 'border border-dashed p-2 min-h-[50px]', children: [] },
                { id: crypto.randomUUID(), type: 'container', className: 'border border-dashed p-2 min-h-[50px]', children: [] }
            ];
        }

        if (target && target.children) target.children.push(newEl);
    });
  }, [actionTrigger]);

  // --- Drag & Drop (Fields) ---
  const handleDropOnContainer = (e: React.DragEvent, containerId: string) => {
      e.preventDefault(); e.stopPropagation();
      const json = e.dataTransfer.getData('application/json');
      if (!json) return;
      const data = JSON.parse(json);

      updateFormLayout((layout) => {
          const container = findElement(layout, containerId);
          if (container && container.children) {
              if (data.type === 'field') {
                  container.children.push({ id: crypto.randomUUID(), type: 'field', fieldId: data.fieldId, label: data.label, className: 'mb-4' });
              } else if (data.type === 'form') {
                  setLinkingSubform(allForms.find(f => f.id === data.formId) || null);
                  (window as any).__tempContainerId = containerId; // Hack to pass container to modal callback
              }
          }
      });
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
      const baseClass = `relative border ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-transparent hover:border-slate-300'} transition-all`;

      if (el.type === 'container') {
          return (
              <div 
                key={el.id} className={`${baseClass} ${el.className} min-h-[40px]`}
                onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDropOnContainer(e, el.id)}
              >
                  {el.children?.length === 0 && <div className="text-xs text-slate-300 text-center py-2 pointer-events-none">Container</div>}
                  {el.children?.map(renderElement)}
              </div>
          );
      }
      if (el.type === 'field') {
          return (
              <div key={el.id} className={`${baseClass} ${el.className} bg-white p-2 rounded border border-slate-200`}
                   onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}>
                  <label className="block text-sm font-semibold text-slate-600 mb-1 pointer-events-none">{el.label}</label>
                  <div className="h-8 bg-slate-100 border rounded w-full flex items-center px-2 text-xs text-slate-400 pointer-events-none">
                      {el.widgetType || 'Input'}
                  </div>
              </div>
          );
      }
      if (el.type === 'subform') {
          return (
              <div key={el.id} className={`${baseClass} ${el.className} p-4`} onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}>
                  <div className="font-bold text-indigo-700">Subform: {el.label}</div>
              </div>
          );
      }
      return <div key={el.id} className={`${baseClass} ${el.className}`} onClick={(e) => {e.stopPropagation(); setSelectedElementId(el.id)}}>{el.label}</div>;
  };

  const selectedEl = form.layout ? findElement(form.layout, selectedElementId || '') : null;

  return (
    <div className="h-full bg-slate-200 flex">
      {/* Modals */}
      {linkingSubform && mainFormTable && (
        <LinkSubformModal 
          mainFormTable={mainFormTable}
          subFormTable={allTables.find(t => t.id === linkingSubform.sourceId)!}
          onLink={handleLinkSubform}
          onClose={() => setLinkingSubform(null)}
        />
      )}
      {showLookupModal && selectedEl && selectedEl.lookup && (
          <LookupConfigModal allTables={allTables} initialConfig={selectedEl.lookup} onSave={handleLookupSave} onClose={() => setShowLookupModal(false)} />
      )}

      {/* Main Canvas */}
      <div className="flex-1 p-8 overflow-y-auto" onClick={() => setSelectedElementId(null)}>
         <div className="max-w-4xl mx-auto">
            <div className="bg-white min-h-[600px] shadow-lg rounded-lg overflow-hidden flex flex-col">
                <div className="p-4 bg-slate-800 text-white font-bold flex justify-between items-center">
                    <span>{form.name}</span>
                    <div className="flex gap-2">
                        <button onClick={() => onFormChange({...form, mode: form.mode === 'edit' ? 'readonly' : 'edit'})} className="text-xs bg-slate-700 px-2 py-1 rounded">
                            {form.mode === 'edit' ? 'Modus: Bearbeiten' : 'Modus: Lesen'}
                        </button>
                    </div>
                </div>
                <div className="flex-1 p-6">
                    {form.layout ? renderElement(form.layout) : <div className="text-slate-400 text-center mt-20">Kein Layout.</div>}
                </div>
            </div>
         </div>
      </div>

      {/* Sidebar */}
      <div className="w-72 bg-white border-l border-slate-300 flex flex-col">
          <PropertiesPanel 
            form={form}
            selectedElement={selectedEl}
            allTables={allTables}
            allForms={allForms}
            onPropertyChange={handlePropertyChange}
            onLookupPropertyChange={(k, v) => { if(selectedEl?.lookup) handleLookupSave({ [k]: v }); }}
            onSubformPermissionChange={(k, v) => { if(selectedEl?.subform) { 
                updateFormLayout(l => { const el = findElement(l, selectedElementId!); if(el && el.subform) (el.subform as any)[k] = v; });
            }}}
            onDeleteSelected={deleteSelected}
            onShowLookupModal={() => setShowLookupModal(true)}
            onToggleFullScreen={() => onFormChange({...form, settings: {...form.settings, isFullScreen: !form.settings?.isFullScreen}})}
            onToggleEditButton={() => onFormChange({...form, settings: {...form.settings, showEditToggle: !form.settings?.showEditToggle}})}
          />
          <div className="h-1/3 border-t border-slate-300 p-4 overflow-y-auto bg-slate-50">
             <h4 className="font-bold text-xs text-slate-500 uppercase mb-2">Verfügbare Felder</h4>
             <div className="space-y-1">
                 {mainFormTable?.fields.map(f => (
                     <div key={f.id} draggable onDragStart={e => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'field', fieldId: f.id, label: f.name })); }} className="bg-white border p-1.5 rounded cursor-grab text-sm hover:shadow-sm flex gap-2">
                         <GripVertical size={14} className="text-slate-400"/> {f.name}
                     </div>
                 ))}
             </div>
             <h4 className="font-bold text-xs text-slate-500 uppercase mt-4 mb-2">Sub-Formulare</h4>
             <div className="space-y-1">
                 {allForms.filter(f => f.id !== form.id).map(f => (
                     <div key={f.id} draggable onDragStart={e => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'form', formId: f.id })); }} className="bg-indigo-50 border border-indigo-200 p-1.5 rounded cursor-grab text-sm flex gap-2 text-indigo-700">
                         <Layout size={14}/> {f.name}
                     </div>
                 ))}
             </div>
          </div>
      </div>
    </div>
  );
};
