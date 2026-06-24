import React, { useState } from 'react';
import { CustomPage, PageComponent, PageComponentType } from '../../types/index';
import { LayoutTemplate, Type, Square, Image as ImageIcon, Table2, MousePointerClick, ChevronRight, X, Trash2, List, Layers, Plus } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';

interface PageDesignerProps {
  page: CustomPage;
  onPageChange: (page: CustomPage) => void;
  onSetView: (v: any) => void;
}

const findNodeAndAdd = (rootNode: PageComponent, targetId: string, newNode: PageComponent): PageComponent => {
    if (rootNode.id === targetId) {
        return {
            ...rootNode,
            children: [...(rootNode.children || []), newNode]
        };
    }
    if (rootNode.children) {
        return {
            ...rootNode,
            children: rootNode.children.map(c => findNodeAndAdd(c, targetId, newNode))
        };
    }
    return rootNode;
}

const findNodeAndUpdateProps = (rootNode: PageComponent, targetId: string, newProps: any): PageComponent => {
    if (rootNode.id === targetId) {
        return {
            ...rootNode,
            props: { ...rootNode.props, ...newProps }
        };
    }
    if (rootNode.children) {
        return {
            ...rootNode,
            children: rootNode.children.map(c => findNodeAndUpdateProps(c, targetId, newProps))
        };
    }
    return rootNode;
}

const findNodeAndDelete = (rootNode: PageComponent, targetId: string): PageComponent | null => {
    if (rootNode.id === targetId) return null;
    if (rootNode.children) {
        return {
            ...rootNode,
            children: rootNode.children.map(c => findNodeAndDelete(c, targetId)).filter(Boolean) as PageComponent[]
        };
    }
    return rootNode;
}

const findNode = (rootNode: PageComponent, targetId: string): PageComponent | null => {
    if (rootNode.id === targetId) return rootNode;
    if (rootNode.children) {
        for (const child of rootNode.children) {
             const found = findNode(child, targetId);
             if (found) return found;
        }
    }
    return null;
}

const RenderNode: React.FC<{
    node: PageComponent; 
    selectedNodeId: string | null; 
    onSelect: (id: string, e: React.MouseEvent) => void;
    onDrop: (e: React.DragEvent, id: string) => void;
}> = ({ node, selectedNodeId, onSelect, onDrop }) => {
    const { queries, tables, pages } = useProjectStore();
    const isSelected = selectedNodeId === node.id;
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }
    
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }
    
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop(e, node.id);
    }
    
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(node.id, e);
    }

    let content = null;
    let isDropTarget = true;
    
    switch (node.type) {
        case 'container':
             content = (
                 <div className={`flex flex-col gap-2 w-full ${node.id === 'root' ? 'min-h-[800px] h-full p-8' : 'min-h-[50px] p-2'} ${node.props.className || ''}`} style={node.props.style}>
                    {(node.children && node.children.length > 0) ? 
                        node.children.map(c => <RenderNode key={c.id} node={c} selectedNodeId={selectedNodeId} onSelect={onSelect} onDrop={onDrop} />)
                        : (
                            <div className="text-slate-300 text-xs text-center border-2 border-dashed border-slate-200 p-8 rounded hover:border-slate-300 hover:bg-slate-50 transition-colors w-full flex-1 flex items-center justify-center pointer-events-none">Drop components here</div>
                        )
                    }
                 </div>
             );
             break;
        case 'list_repeater':
             content = (
                 <div className={`p-4 rounded-lg bg-indigo-50/50 border-2 border-indigo-200 w-full min-h-[120px] ${node.props.className || ''}`} style={node.props.style}>
                    <div className="flex items-center justify-between text-indigo-700 text-xs font-bold mb-3 border-b border-indigo-100 pb-1.5 pointer-events-none">
                        <span className="flex items-center gap-1">
                            <LayoutTemplate size={12}/> List-Repeater: {node.props.dataSourceType === 'query' ? `Abfrage: ${queries.find(q=>q.id===node.props.dataSourceId)?.name || 'Keine'}` : `Tabelle: ${tables.find(t=>t.id===node.props.dataSourceId)?.name || 'Keine'}`}
                        </span>
                        <span className="text-[10px] bg-indigo-100 px-1.5 py-0.5 rounded uppercase">Repeater Loop</span>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        {(node.children && node.children.length > 0) ? (
                            <div className="border border-indigo-100 bg-white p-3 rounded-md shadow-sm opacity-90 pointer-events-auto">
                                <div className="text-[10px] text-slate-400 font-mono mb-2 uppercase select-none">Repeater Element (Entwurf Layout)</div>
                                {node.children.map(c => (
                                    <RenderNode key={c.id} node={c} selectedNodeId={selectedNodeId} onSelect={onSelect} onDrop={onDrop} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 p-6 rounded bg-white hover:border-indigo-300 transition-colors pointer-events-none">
                                Komponenten hier ablegen, die für jede Zeile wiederholt werden sollen
                            </div>
                        )}
                        
                        {node.children && node.children.length > 0 && (
                            <div className="border border-indigo-100/50 bg-white/50 p-3 rounded-md shadow-sm opacity-50 select-none pointer-events-none border-dashed">
                                <div className="text-[10px] text-slate-400 font-mono mb-2 uppercase">Repeater Element (Wiederholung Vorschau)</div>
                                <div className="space-y-1.5">
                                    {node.children.map(c => (
                                        <div key={`mock-${c.id}`} className="text-xs text-slate-400 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                                             {c.type === 'text' ? `[Text Block] ${c.props.text || ''}` : `[${c.type}]`}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                 </div>
             );
             break;
        case 'text':
             content = <div className={`p-2 w-full break-words ${node.props.className || ''}`} style={node.props.style}>{node.props.text || 'New Text Block'}</div>;
             isDropTarget = false;
             break;
        case 'button':
             content = <button className={`px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 m-2 ${node.props.className || ''}`} style={node.props.style}>{node.props.label || 'Button'}</button>;
             isDropTarget = false;
             break;
        case 'dropdown':
             content = (
                  <div className={`p-2 ${node.props.className || ''}`}>
                      <select className="border border-slate-300 rounded px-3 py-2 bg-white w-full max-w-xs" style={node.props.style}>
                          <option>{node.props.placeholder || 'Select Option'}</option>
                      </select>
                  </div>
             );
             isDropTarget = false;
             break;
        case 'subpage_container': {
             const subPage = pages?.find(p => p.id === node.props.subPageId);
             content = (
                  <div className={`p-4 rounded-lg bg-emerald-50/50 border-2 border-emerald-200 w-full min-h-[100px] ${node.props.className || ''}`} style={node.props.style}>
                     <div className="flex items-center justify-between text-emerald-700 text-xs font-bold mb-3 border-b border-emerald-100 pb-1.5 pointer-events-none">
                         <span className="flex items-center gap-1">
                             <Layers size={12}/> Unterseiten-Container (Sub-Page)
                         </span>
                         <span className="text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded uppercase font-bold">Sub-Page</span>
                     </div>
                     <div className="text-xs text-slate-700 font-medium">
                         {subPage ? (
                             <div className="flex flex-col gap-1.5">
                                 <div className="text-emerald-800 font-semibold flex items-center gap-1">
                                     <Layers size={12} className="text-emerald-600"/> Eingebundene Seite: <span className="underline">{subPage.name}</span>
                                 </div>
                                 {node.props.parameterMappings && node.props.parameterMappings.length > 0 ? (
                                     <div className="text-[10px] text-slate-500 bg-white/75 p-1.5 rounded border border-emerald-100/50">
                                         <span className="font-bold">Übergabe:</span> {node.props.parameterMappings.map((m: any, idx: number) => (
                                             <span key={idx} className="mr-3 font-mono">
                                                 Parent: {m.sourceKey} ➔ Sub: {m.targetKey}
                                             </span>
                                         ))}
                                     </div>
                                 ) : (
                                     <div className="text-[10px] text-slate-400 italic">Keine Parameterweitergabe definiert.</div>
                                 )}
                             </div>
                         ) : (
                             <div className="text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 p-4 rounded bg-white hover:border-emerald-300 transition-colors pointer-events-none">
                                 Wählen Sie rechts eine Seite aus, die hier eingebunden werden soll
                             </div>
                         )}
                     </div>
                  </div>
             );
             isDropTarget = false;
             break;
        }
        case 'table_view':
        case 'form_view':
        case 'chart_view':
        case 'image':
        case 'html':
        case 'divider':
             content = <div className={`p-4 m-2 bg-slate-100 rounded border flex items-center justify-center border-slate-200 text-center text-sm font-medium text-slate-500 ${node.props.className || ''}`}>{node.type} placeholder</div>;
             isDropTarget = false;
             break;
    }

    return (
        <div 
           className={`relative border-2 ${isSelected ? 'border-amber-400 z-10 shadow-sm' : 'border-transparent hover:border-slate-200'} transition-colors rounded ${node.id === 'root' ? 'bg-white shadow-lg border-slate-200' : ''}`}
           onClick={handleClick}
           onDragOver={isDropTarget ? handleDragOver : undefined}
           onDragEnter={isDropTarget ? handleDragEnter : undefined}
           onDrop={isDropTarget ? handleDrop : undefined}
           style={node.id === 'root' ? { ...node.props.style } : {}}
        >
            {node.id !== 'root' && isSelected && (
                <div className="absolute -top-3 -left-0.5 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm pointer-events-none flex gap-1 items-center">
                    <span>{node.type}</span>
                    {node.props.visibilityField && (
                        <span className="bg-amber-600 px-1 rounded text-[8px] uppercase">
                            if: {node.props.visibilityField} {node.props.visibilityOperator || '=='} {node.props.visibilityValue || '""'}
                        </span>
                    )}
                </div>
            )}
            {content}
        </div>
    );
};

export const PageDesigner: React.FC<PageDesignerProps> = ({ page, onPageChange, onSetView }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { queries, tables, pages, forms } = useProjectStore();

  const handleDragStart = (e: React.DragEvent, type: PageComponentType) => {
      e.dataTransfer.setData('componentType', type);
      e.dataTransfer.setData('text/plain', type);
      e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDropElement = (e: React.DragEvent, parentId: string) => {
      let type = e.dataTransfer.getData('componentType') as PageComponentType;
      if (!type) {
          type = e.dataTransfer.getData('text/plain') as PageComponentType;
      }
      if (!type) return;

      const templateText = e.dataTransfer.getData('templateText');

      const newNode: PageComponent = {
          id: 'node_' + crypto.randomUUID(),
          type,
          props: {},
          children: (type === 'container' || type === 'list_repeater') ? [] : undefined
      };

      if (type === 'text') newNode.props.text = templateText || 'New Text Block';
      if (type === 'button') newNode.props.label = 'Button';

      const newLayout = findNodeAndAdd(page.layout, parentId, newNode);
      onPageChange({ ...page, layout: newLayout });
      setSelectedNodeId(newNode.id);
  };

  const selectedNode = selectedNodeId ? findNode(page.layout, selectedNodeId) : null;

  const updateSelectedNodeProps = (newProps: any) => {
      if (!selectedNodeId) return;
      const newLayout = findNodeAndUpdateProps(page.layout, selectedNodeId, newProps);
      onPageChange({ ...page, layout: newLayout });
  };

  const deleteSelectedNode = () => {
      if (!selectedNodeId || selectedNodeId === 'root') return;
      const newLayout = findNodeAndDelete(page.layout, selectedNodeId);
      if (newLayout) {
          onPageChange({ ...page, layout: newLayout });
          setSelectedNodeId(null);
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 font-sans">
      <div className="bg-white border-b border-slate-300 p-2 px-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
            <LayoutTemplate size={18} />
            Page Designer
          </div>
          <div className="w-[1px] h-6 bg-slate-300 mx-2"></div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Seitenname</label>
            <input 
              type="text" 
              value={page.name} 
              onChange={e => onPageChange({ ...page, name: e.target.value })}
              className="px-2 py-1 border border-slate-300 rounded text-sm w-64 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => onSetView({ type: 'page_view', pageId: page.id })} className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"><LayoutTemplate size={14}/> Vorschau</button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Components */}
        <div className="w-64 bg-white border-r border-slate-300 flex flex-col p-4 shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-0 overflow-y-auto shrink-0">
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Komponenten</h3>
           
           <div className="space-y-2">
              <div draggable onDragStart={(e) => handleDragStart(e, 'container')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
                  <Square size={16} className="text-blue-500"/> Container
              </div>
              <div draggable onDragStart={(e) => handleDragStart(e, 'list_repeater')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-indigo-50 text-sm text-indigo-700 font-semibold active:cursor-grabbing border-indigo-100 bg-indigo-50/20">
                  <LayoutTemplate size={16} className="text-indigo-600"/> List Repeater (Loop)
              </div>
              <div draggable onDragStart={(e) => handleDragStart(e, 'subpage_container')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-emerald-50 text-sm text-emerald-700 font-semibold active:cursor-grabbing border-emerald-100 bg-emerald-50/20">
                  <Layers size={16} className="text-emerald-600"/> Unterseite (Sub-Page)
              </div>
              <div draggable onDragStart={(e) => handleDragStart(e, 'text')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
                  <Type size={16} className="text-slate-500"/> Text Block
              </div>
              <div draggable onDragStart={(e) => handleDragStart(e, 'button')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
                  <MousePointerClick size={16} className="text-indigo-500"/> Button
              </div>
              <div draggable onDragStart={(e) => handleDragStart(e, 'dropdown')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
                  <List size={16} className="text-orange-500"/> Dropdown Menu
              </div>
              <div draggable onDragStart={(e) => handleDragStart(e, 'table_view')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
                  <Table2 size={16} className="text-emerald-500"/> Daten-Tabelle
              </div>
              <div draggable onDragStart={(e) => handleDragStart(e, 'image')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
                  <ImageIcon size={16} className="text-purple-500"/> Bild / Medien
              </div>
           </div>

           <div className="mt-8 pt-6 border-t border-slate-200">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Datenfelder</h3>
               <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">Ziehen Sie ein Feld auf die Seite, um es als Textblock mit Datenbindung anzuzeigen.</p>
               
               <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                   {/* Tables */}
                   {tables.length > 0 && (
                       <div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tabellen</div>
                           <div className="space-y-2">
                               {tables.map(t => (
                                   <div key={t.id} className="border border-slate-100 rounded p-1.5 bg-slate-50/50">
                                       <div className="text-xs font-semibold text-slate-600 mb-1.5 truncate">{t.name}</div>
                                       <div className="grid grid-cols-1 gap-1">
                                           {t.fields.map(f => (
                                               <div 
                                                   key={f.id}
                                                   draggable
                                                   onDragStart={e => {
                                                       e.dataTransfer.setData('componentType', 'text');
                                                       e.dataTransfer.setData('templateText', `{{${f.name}}}`);
                                                       e.dataTransfer.effectAllowed = 'copy';
                                                   }}
                                                   className="bg-white border border-slate-200 rounded p-1 px-2 text-[11px] text-slate-600 cursor-grab hover:border-amber-400 hover:text-amber-700 transition-colors flex items-center justify-between"
                                                   title={`Ziehen um {{${f.name}}} einzufügen`}
                                               >
                                                   <span className="truncate">{f.name}</span>
                                                   <span className="text-[8px] font-mono font-bold bg-amber-50 text-amber-600 px-1 rounded uppercase scale-90">Drag</span>
                                               </div>
                                           ))}
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}

                   {/* Queries */}
                   {queries.length > 0 && (
                       <div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 mt-2">Abfragen</div>
                           <div className="space-y-2">
                               {queries.map(q => (
                                   <div key={q.id} className="border border-slate-100 rounded p-1.5 bg-slate-50/50">
                                       <div className="text-xs font-semibold text-slate-600 mb-1.5 truncate">{q.name}</div>
                                       <div className="grid grid-cols-1 gap-1">
                                           {q.columns.map(c => {
                                               const name = c.alias || c.fieldName;
                                               return (
                                                   <div 
                                                       key={c.id}
                                                       draggable
                                                       onDragStart={e => {
                                                           e.dataTransfer.setData('componentType', 'text');
                                                           e.dataTransfer.setData('templateText', `{{${name}}}`);
                                                           e.dataTransfer.effectAllowed = 'copy';
                                                       }}
                                                       className="bg-white border border-slate-200 rounded p-1 px-2 text-[11px] text-slate-600 cursor-grab hover:border-amber-400 hover:text-amber-700 transition-colors flex items-center justify-between"
                                                       title={`Ziehen um {{${name}}} einzufügen`}
                                                   >
                                                       <span className="truncate">{name}</span>
                                                       <span className="text-[8px] font-mono font-bold bg-amber-50 text-amber-600 px-1 rounded scale-90">Drag</span>
                                                   </div>
                                               );
                                           })}
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}
               </div>
           </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 p-8 overflow-auto flex justify-center bg-slate-50 relative" onClick={() => setSelectedNodeId(null)}>
           <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
           
           <div className="w-full max-w-5xl relative z-10 flex flex-col items-center">
             <RenderNode 
                node={page.layout} 
                selectedNodeId={selectedNodeId} 
                onSelect={(id) => setSelectedNodeId(id)}
                onDrop={handleDropElement}
             />
           </div>
        </div>

        {/* Right Sidebar: Properties */}
        <div className="w-[320px] bg-white border-l border-slate-300 flex flex-col shadow-[-2px_0_5px_rgba(0,0,0,0.05)] z-0 overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Eigenschaften</h3>
               {selectedNodeId && selectedNodeId !== 'root' && (
                   <button onClick={deleteSelectedNode} className="text-slate-400 hover:text-red-500 hidden sm:block delay-150 transition" title="Löschen">
                       <Trash2 size={16} />
                   </button>
               )}
            </div>
            
            {selectedNode && (
                <div className="p-4 space-y-6">
                   <div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Typ: {selectedNode.type}</div>
                   </div>

                   {/* Content Properties */}
                   {selectedNode.type === 'text' && (
                       <div>
                           <label className="block text-xs font-semibold text-slate-600 mb-1">Text Inhalt</label>
                           <textarea
                               value={selectedNode.props.text || ''}
                               onChange={(e) => updateSelectedNodeProps({ text: e.target.value })}
                               className="w-full px-2 py-1 text-sm border border-slate-300 rounded min-h-[80px]"
                           />
                       </div>
                   )}
                   {selectedNode.type === 'button' && (
                       <div>
                           <label className="block text-xs font-semibold text-slate-600 mb-1">Button Beschriftung</label>
                           <input
                               type="text"
                               value={selectedNode.props.label || ''}
                               onChange={(e) => updateSelectedNodeProps({ label: e.target.value })}
                               className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                           />
                       </div>
                   )}
                   
                   {/* Dropdown Data Binding */}
                   {selectedNode.type === 'dropdown' && (
                       <div className="space-y-4">
                           <div>
                               <label className="block text-xs font-semibold text-slate-600 mb-1">Platzhalter Text</label>
                               <input
                                   type="text"
                                   value={selectedNode.props.placeholder || ''}
                                   onChange={(e) => updateSelectedNodeProps({ placeholder: e.target.value })}
                                   className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                               />
                           </div>
                           <div className="pt-4 border-t border-slate-100">
                               <h4 className="text-xs font-bold text-indigo-600 mb-2">Datenbindung (Query)</h4>
                               <label className="block text-xs font-semibold text-slate-600 mb-1">Datenquelle (Abfrage)</label>
                               <select 
                                  value={selectedNode.props.queryId || ''} 
                                  onChange={(e: any) => updateSelectedNodeProps({ queryId: e.target.value, valueField: '', labelField: '' })}
                                  className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-3"
                               >
                                   <option value="">-- Keine Abfrage --</option>
                                   {queries.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                               </select>

                               {selectedNode.props.queryId && (() => {
                                   const selectedQuery = queries.find(q => q.id === selectedNode.props.queryId);
                                   if (!selectedQuery) return null;
                                   const cols = selectedQuery.columns || [];
                                   return (
                                       <>
                                          <label className="block text-xs font-semibold text-slate-600 mb-1 mt-2">Wert-Spalte (Value ID)</label>
                                          <select 
                                              value={selectedNode.props.valueField || ''} 
                                              onChange={(e: any) => updateSelectedNodeProps({ valueField: e.target.value })}
                                              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-2"
                                          >
                                              <option value="">-- Spalte wählen --</option>
                                              {cols.map(c => <option key={c.id} value={c.alias || c.fieldName}>{c.alias || c.fieldName}</option>)}
                                          </select>

                                          <label className="block text-xs font-semibold text-slate-600 mb-1 mt-2">Anzeige-Spalte (Label)</label>
                                          <select 
                                              value={selectedNode.props.labelField || ''} 
                                              onChange={(e: any) => updateSelectedNodeProps({ labelField: e.target.value })}
                                              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-2"
                                          >
                                              <option value="">-- Spalte wählen --</option>
                                              {cols.map(c => <option key={c.id} value={c.alias || c.fieldName}>{c.alias || c.fieldName}</option>)}
                                          </select>
                                       </>
                                   );
                               })()}
                           </div>
                       </div>
                   )}

                   {/* Data Table Binding */}
                   {(selectedNode.type === 'table_view' || selectedNode.type === 'list_repeater') && (
                       <div className="space-y-4">
                           <div>
                               <h4 className="text-xs font-bold text-emerald-600 mb-2">Datenquelle</h4>
                               <label className="block text-xs font-semibold text-slate-600 mb-1">Typ</label>
                               <select 
                                  value={selectedNode.props.dataSourceType || ''}
                                  onChange={(e: any) => updateSelectedNodeProps({ dataSourceType: e.target.value, dataSourceId: '' })}
                                  className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-3"
                               >
                                   <option value="">-- Wählen --</option>
                                   <option value="table">Tabelle</option>
                                   <option value="query">Abfrage</option>
                               </select>

                               {selectedNode.props.dataSourceType === 'table' && (
                                   <>
                                      <label className="block text-xs font-semibold text-slate-600 mb-1">Tabelle</label>
                                      <select 
                                          value={selectedNode.props.dataSourceId || ''}
                                          onChange={(e: any) => updateSelectedNodeProps({ dataSourceId: e.target.value })}
                                          className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-3"
                                      >
                                          <option value="">-- Tabelle wählen --</option>
                                          {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                      </select>
                                   </>
                               )}

                               {selectedNode.props.dataSourceType === 'query' && (
                                   <>
                                      <label className="block text-xs font-semibold text-slate-600 mb-1">Abfrage</label>
                                      <select 
                                          value={selectedNode.props.dataSourceId || ''}
                                          onChange={(e: any) => updateSelectedNodeProps({ dataSourceId: e.target.value })}
                                          className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-3"
                                      >
                                          <option value="">-- Abfrage wählen --</option>
                                          {queries.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                                      </select>
                                   </>
                               )}

                               {selectedNode.type === 'table_view' && selectedNode.props.dataSourceId && (() => {
                                   let availableCols: {id: string, label: string, name: string}[] = [];
                                   if (selectedNode.props.dataSourceType === 'table') {
                                       const t = tables.find(tb => tb.id === selectedNode.props.dataSourceId);
                                       if (t) {
                                           availableCols = t.fields.map(f => ({ id: f.name, label: f.name, name: f.name }));
                                       }
                                   } else if (selectedNode.props.dataSourceType === 'query') {
                                       const q = queries.find(qi => qi.id === selectedNode.props.dataSourceId);
                                       if (q) {
                                           availableCols = q.columns.map(c => {
                                                const lbl = c.alias || c.fieldName;
                                                return { id: lbl, label: lbl, name: lbl };
                                           });
                                       }
                                   }
                                   
                                   const selectedCols: string[] = selectedNode.props.columns ? selectedNode.props.columns.split(',').map((c:string) => c.trim()).filter(Boolean) : [];

                                   const toggleCol = (colName: string) => {
                                       const set = new Set(selectedCols);
                                       if (set.has(colName)) set.delete(colName);
                                       else set.add(colName);
                                       updateSelectedNodeProps({ columns: Array.from(set).join(',') });
                                   };

                                   return (
                                       <div className="mt-4 pt-4 border-t border-slate-200">
                                            <label className="block text-xs font-semibold text-slate-600 mb-2">Spalten auswählen</label>
                                            {availableCols.length === 0 ? (
                                                <div className="text-xs text-slate-400">Keine Spalten gefunden</div>
                                            ) : (
                                                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-200 rounded p-2">
                                                    {availableCols.map(col => (
                                                        <label key={col.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer hover:bg-slate-50 p-1 rounded">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={selectedCols.includes(col.name)}
                                                                onChange={() => toggleCol(col.name)}
                                                                className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                                            />
                                                            {col.label}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                       </div>
                                   );
                               })()}
                           </div>
                       </div>
                   )}

                   {/* Anzeige-Bedingung (ngIf equivalent) */}
                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-indigo-600 mb-2">Anzeige-Bedingung (ngIf)</h4>
                        <div className="space-y-2 text-slate-700">
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-500">Filter-Feld (Variable/Spalte)</label>
                                <input
                                    type="text"
                                    value={selectedNode.props.visibilityField || ''}
                                    onChange={(e) => updateSelectedNodeProps({ visibilityField: e.target.value })}
                                    placeholder="z.B. STATUS oder id"
                                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] font-semibold text-slate-500">Operator</label>
                                    <select
                                        value={selectedNode.props.visibilityOperator || '=='}
                                        onChange={(e) => updateSelectedNodeProps({ visibilityOperator: e.target.value })}
                                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                                    >
                                        <option value="==">=(gleich)</option>
                                        <option value="!=">!=(ungleich)</option>
                                        <option value=">">&gt; (größer)</option>
                                        <option value="<">&lt; (kleiner)</option>
                                        <option value="contains">enthält</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-slate-500">Vergleichswert</label>
                                    <input
                                        type="text"
                                        value={selectedNode.props.visibilityValue || ''}
                                        onChange={(e) => updateSelectedNodeProps({ visibilityValue: e.target.value })}
                                        placeholder="Wert..."
                                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 italic">Bedingte Sichtbarkeit basierend auf dem aktuellen Loop- oder Datensatz-Kontext.</p>
                        </div>
                    </div>

                    {/* Custom Classes for styling */}
                    <div className="pt-4 border-t border-slate-100">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Eigene CSS-Klassen (Tailwind)</label>
                       <input
                           type="text"
                           value={selectedNode.props.className || ''}
                           onChange={(e) => updateSelectedNodeProps({ className: e.target.value })}
                           placeholder="z.B. mt-4 bg-red-100"
                           className="w-full px-2 py-1 text-sm border font-mono text-xs border-slate-300 rounded"
                       />
                   </div>
                </div>
            )}
            
            {!selectedNode && (
                <div className="text-center text-sm text-slate-400 mt-10">
                    Klicken Sie auf eine Komponente um ihre Eigenschaften zu bearbeiten.
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

