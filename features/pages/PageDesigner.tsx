import React, { useState } from 'react';
import { CustomPage, PageComponent, PageComponentType } from '../../types/index';
import { LayoutTemplate, Type, Square, Image as ImageIcon, Table2, MousePointerClick, ChevronRight, X, Trash2, List, Layers, Plus, Database, Layout, Columns, Rows, CreditCard } from 'lucide-react';
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

const SubPagePreviewNode: React.FC<{
    node: PageComponent;
    queries: any[];
    tables: any[];
    pages: any[];
}> = ({ node, queries, tables, pages }) => {
    let content = null;
    
    switch (node.type) {
        case 'container':
            content = (
                <div className={`flex flex-col gap-1.5 w-full p-2 border border-slate-200/50 rounded bg-slate-50/25 ${node.props.className || ''}`} style={node.props.style}>
                    {node.children && node.children.length > 0 ? (
                        node.children.map(c => <SubPagePreviewNode key={c.id} node={c} queries={queries} tables={tables} pages={pages} />)
                    ) : (
                        <div className="text-slate-300 text-[10px] text-center py-2 border border-dashed border-slate-200 rounded">Leerer Container (Subpage)</div>
                    )}
                </div>
            );
            break;
            
        case 'list_repeater':
            content = (
                <div className={`p-2.5 rounded border border-indigo-200/60 bg-indigo-50/10 w-full ${node.props.className || ''}`} style={node.props.style}>
                    <div className="text-[10px] font-bold text-indigo-700/80 mb-1 pointer-events-none uppercase flex items-center gap-1">
                        <Layers size={10} /> List-Repeater (Subpage)
                    </div>
                    <div className="flex flex-col gap-1 bg-white/70 p-1.5 rounded border border-indigo-100/50">
                        {node.children && node.children.length > 0 ? (
                            node.children.map(c => <SubPagePreviewNode key={c.id} node={c} queries={queries} tables={tables} pages={pages} />)
                        ) : (
                            <div className="text-slate-400 text-[9px] text-center py-1 italic">Repeater leer</div>
                        )}
                    </div>
                </div>
            );
            break;

        case 'text':
            content = (
                <div className={`p-1 text-xs text-slate-700 font-medium break-words ${node.props.className || ''}`} style={node.props.style}>
                    {node.props.text || 'New Text Block'}
                </div>
            );
            break;

        case 'button':
            content = (
                <button disabled className={`px-2.5 py-1 bg-indigo-600/50 text-white text-[10px] rounded hover:bg-indigo-700/50 m-0.5 opacity-70 cursor-not-allowed ${node.props.className || ''}`} style={node.props.style}>
                    {node.props.label || 'Button'}
                </button>
            );
            break;

        case 'dropdown':
            content = (
                <div className={`p-1 ${node.props.className || ''}`}>
                    <select disabled className="border border-slate-200 rounded px-2 py-0.5 bg-slate-50 text-[10px] w-full max-w-xs opacity-75 cursor-not-allowed">
                        <option>{node.props.placeholder || 'Select Option'}</option>
                    </select>
                </div>
            );
            break;

        case 'subpage_container': {
            const nestedSub = pages?.find(p => p.id === node.props.subPageId);
            content = (
                <div className="p-1.5 border border-emerald-200/50 rounded bg-emerald-50/20 text-[10px] text-emerald-800 flex items-center gap-1">
                    <Layers size={10} /> Eingebundene Unterseite: {nestedSub ? nestedSub.name : 'Keine'}
                </div>
            );
            break;
        }

        default:
            content = (
                <div className="p-1 bg-slate-100/40 text-slate-400 rounded text-[9px] border border-slate-100/50 italic text-center">
                    [{node.type}]
                </div>
            );
            break;
    }

    return (
        <div className="w-full relative pointer-events-none select-none">
            {content}
        </div>
    );
};

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
        case 'row':
             content = (
                 <div className={`flex flex-row gap-2 w-full min-h-[50px] p-2 border border-dashed border-blue-200/50 bg-blue-50/20 ${node.props.className || ''}`} style={node.props.style}>
                    {(node.children && node.children.length > 0) ? 
                        node.children.map(c => <RenderNode key={c.id} node={c} selectedNodeId={selectedNodeId} onSelect={onSelect} onDrop={onDrop} />)
                        : (
                            <div className="text-slate-300 text-xs text-center border-2 border-dashed border-slate-200 p-4 rounded hover:border-slate-300 hover:bg-slate-50 transition-colors w-full flex-1 flex items-center justify-center pointer-events-none">Spalten (Columns) oder Container hier ablegen</div>
                        )
                    }
                 </div>
             );
             break;
        case 'column':
             content = (
                 <div className={`flex flex-col gap-2 w-full min-h-[50px] p-2 border border-dashed border-emerald-200/50 bg-emerald-50/20 ${node.props.className || ''}`} style={{ flex: '1 1 0%', ...node.props.style }}>
                    {(node.children && node.children.length > 0) ? 
                        node.children.map(c => <RenderNode key={c.id} node={c} selectedNodeId={selectedNodeId} onSelect={onSelect} onDrop={onDrop} />)
                        : (
                            <div className="text-slate-300 text-xs text-center border-2 border-dashed border-slate-200 p-4 rounded hover:border-slate-300 hover:bg-slate-50 transition-colors w-full flex-1 flex items-center justify-center pointer-events-none">Komponenten hier ablegen</div>
                        )
                    }
                 </div>
             );
             break;
        case 'card':
             content = (
                 <div className={`bg-white rounded-lg shadow-sm border border-slate-200 w-full min-h-[100px] overflow-hidden ${node.props.className || ''}`} style={node.props.style}>
                     {node.props.title && (
                         <div className={`px-4 py-3 border-b border-slate-200 bg-slate-50 font-medium text-slate-800 ${node.props.headerClassName || ''}`}>
                             {node.props.title}
                         </div>
                     )}
                     <div className={`p-4 min-h-[60px] flex flex-col gap-2 ${node.props.bodyClassName || ''}`}>
                        {(node.children && node.children.length > 0) ? 
                            node.children.map(c => <RenderNode key={c.id} node={c} selectedNodeId={selectedNodeId} onSelect={onSelect} onDrop={onDrop} />)
                            : (
                                <div className="text-slate-300 text-xs text-center border-2 border-dashed border-slate-200 p-4 rounded hover:border-slate-300 hover:bg-slate-50 transition-colors w-full flex-1 flex items-center justify-center pointer-events-none">Card-Inhalt hier ablegen</div>
                            )
                        }
                     </div>
                 </div>
             );
             break;
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

                                 {/* Visual Subpage Preview */}
                                 <div className="mt-2 border border-emerald-200/50 bg-white/80 p-2.5 rounded shadow-inner mb-2 pointer-events-none">
                                     <div className="text-[9px] text-emerald-600 font-mono font-bold mb-1.5 uppercase select-none tracking-wider border-b border-emerald-100/50 pb-1 flex items-center gap-1">
                                         <Layers size={10} /> Inhalt Vorschau (Schreibgeschützt)
                                     </div>
                                     {subPage.layout ? (
                                         <SubPagePreviewNode node={subPage.layout} queries={queries} tables={tables} pages={pages} />
                                     ) : (
                                         <div className="text-slate-400 text-xs italic">Unterseite ist leer.</div>
                                     )}
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
           className={`relative border-2 ${isSelected ? 'border-amber-400 z-10 shadow-sm' : 'border-transparent hover:border-slate-200'} transition-colors rounded w-full ${node.id === 'root' ? 'bg-white shadow-lg border-slate-200' : ''}`}
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
  
  const rolesTable = tables.find(t => t.name === 'sys_roles');
  const availableRoles = rolesTable && rolesTable.data && rolesTable.data.length > 0
    ? rolesTable.data.map((r: any) => r.Name || String(r.Id))
    : ['Admin', 'Manager', 'Editor', 'User', 'Guest'];

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
      const dataSourceType = e.dataTransfer.getData('dataSourceType');
      const dataSourceId = e.dataTransfer.getData('dataSourceId');
      const columns = e.dataTransfer.getData('columns');

      const newNode: PageComponent = {
          id: 'node_' + crypto.randomUUID(),
          type,
          props: {},
          children: (type === 'container' || type === 'list_repeater' || type === 'row' || type === 'column' || type === 'card') ? [] : undefined
      };

      if (type === 'text') newNode.props.text = templateText || 'New Text Block';
      if (type === 'button') newNode.props.label = 'Button';
      if (dataSourceType && dataSourceId) {
          newNode.props.dataSourceType = dataSourceType;
          newNode.props.dataSourceId = dataSourceId;
          if (columns) {
              newNode.props.columns = columns;
          }
      }
      
      if (dataSourceType && dataSourceId) {
          newNode.props.dataSourceType = dataSourceType;
          newNode.props.dataSourceId = dataSourceId;
          if (columns) {
              newNode.props.columns = columns;
          }
      }

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
          <div className="flex items-center gap-2 self-end pb-1 ml-4 select-none">
            <input 
              type="checkbox"
              id="isSubpageCheckbox"
              checked={!!page.isSubpage}
              onChange={e => onPageChange({ ...page, isSubpage: e.target.checked })}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer h-4 w-4"
            />
            <label htmlFor="isSubpageCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1">
              <Layers size={13} className="text-emerald-600"/> Als Unterseite (Sub-Page) markieren
            </label>
            <span className="text-[10px] text-slate-400">
              (In Navigation ausblenden)
            </span>
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
              <div draggable onDragStart={(e) => handleDragStart(e, 'row')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
                  <Columns size={16} className="text-blue-500"/> Row Layout
              </div>
              <div draggable onDragStart={(e) => handleDragStart(e, 'column')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
                  <Rows size={16} className="text-blue-500"/> Column Layout
              </div>
              <div draggable onDragStart={(e) => handleDragStart(e, 'card')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
                  <CreditCard size={16} className="text-blue-500"/> Card
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
              <div draggable onDragStart={(e) => handleDragStart(e, 'form_view')} className="p-2 border border-slate-200 rounded flex items-center gap-2 cursor-grab hover:bg-slate-50 text-sm text-slate-700 font-medium active:cursor-grabbing">
                  <Layout size={16} className="text-blue-500"/> Formular (Embedded)
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
                                       <div 
                                            draggable
                                            onDragStart={e => {
                                                e.dataTransfer.setData('componentType', 'table_view');
                                                e.dataTransfer.setData('dataSourceType', 'table');
                                                e.dataTransfer.setData('dataSourceId', t.id);
                                                e.dataTransfer.setData('columns', t.fields.map(f => f.name).join(','));
                                                e.dataTransfer.effectAllowed = 'copy';
                                            }}
                                            className="text-xs font-semibold text-slate-700 mb-1.5 truncate bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded p-1 px-2 cursor-grab flex items-center justify-between transition-all"
                                            title="Ziehen, um eine Daten-Tabelle für diese Tabelle zu erstellen"
                                        >
                                            <span className="truncate">{t.name}</span>
                                            <span className="text-[8px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1 rounded uppercase">Drag Tab</span>
                                        </div>
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
                                       <div 
                                            draggable
                                            onDragStart={e => {
                                                e.dataTransfer.setData('componentType', 'table_view');
                                                e.dataTransfer.setData('dataSourceType', 'query');
                                                e.dataTransfer.setData('dataSourceId', q.id);
                                                e.dataTransfer.setData('columns', q.columns.map(c => c.alias || c.fieldName).join(','));
                                                e.dataTransfer.effectAllowed = 'copy';
                                            }}
                                            className="text-xs font-semibold text-slate-700 mb-1.5 truncate bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded p-1 px-2 cursor-grab flex items-center justify-between transition-all"
                                            title="Ziehen, um eine Daten-Tabelle für diese Abfrage zu erstellen"
                                        >
                                            <span className="truncate">{q.name}</span>
                                            <span className="text-[8px] font-mono font-bold bg-indigo-100 text-indigo-800 px-1 rounded uppercase">Drag Abg</span>
                                        </div>
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
           
           <div className="w-full max-w-[95%] relative z-10 flex flex-col items-center">
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
                       <div className="space-y-4">
                           <div>
                               <label className="block text-xs font-semibold text-slate-600 mb-1">Button-Beschriftung</label>
                               <input
                                   type="text"
                                   value={selectedNode.props.label || ''}
                                   onChange={(e) => updateSelectedNodeProps({ label: e.target.value })}
                                   className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                               />
                           </div>

                           <div className="pt-3 border-t border-slate-100">
                               <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                                   <MousePointerClick size={14} className="text-indigo-600" />
                                   Button-Aktion (CRUD &amp; Navigation)
                               </label>
                               <select
                                   value={selectedNode.props.actionType || 'none'}
                                   onChange={(e) => updateSelectedNodeProps({ 
                                       actionType: e.target.value,
                                       formId: '',
                                       formMode: 'create',
                                       targetTableId: '',
                                       paramKey: 'selectedId',
                                       paramName: '',
                                       paramValue: '',
                                       targetPageId: '',
                                       navigateTargetParams: []
                                   })}
                                   className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
                               >
                                   <option value="none">Keine Aktion</option>
                                   <option value="open_form">Formular öffnen (CRUD Create/Edit)</option>
                                   <option value="delete_record">Datensatz löschen (CRUD Delete)</option>
                                   <option value="set_parameter">Parameter setzen (Status / Filter)</option>
                                   <option value="navigate_to_page">Seite wechseln (Details / Navigation)</option>
                               </select>
                           </div>

                           {/* Open Form Action Fields */}
                           {selectedNode.props.actionType === 'open_form' && (
                               <div className="space-y-3 bg-indigo-50/30 border border-indigo-100 rounded p-2.5">
                                   <div>
                                       <label className="block text-[10px] font-bold text-indigo-900 mb-1">Formular wählen</label>
                                       <select
                                           value={selectedNode.props.formId || ''}
                                           onChange={(e) => updateSelectedNodeProps({ formId: e.target.value })}
                                           className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                                       >
                                           <option value="">-- Formular wählen --</option>
                                           {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                       </select>
                                   </div>
                                   <div>
                                       <label className="block text-[10px] font-bold text-indigo-900 mb-1">Modus</label>
                                       <select
                                           value={selectedNode.props.formMode || 'create'}
                                           onChange={(e) => updateSelectedNodeProps({ formMode: e.target.value })}
                                           className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                                       >
                                           <option value="create">Neuen Datensatz erstellen (Create)</option>
                                           <option value="edit">Ausgewählten Datensatz bearbeiten (Update)</option>
                                       </select>
                                   </div>
                                   {selectedNode.props.formMode === 'edit' && (
                                       <p className="text-[9px] text-slate-500">
                                           Liest die Datensatz-ID aus dem Parameter <code className="font-mono text-indigo-700 bg-white px-0.5 border font-semibold">selectedId</code>.
                                        </p>
                                   )}
                                   <div className="pt-2 border-t border-indigo-100">
                                       <span className="block text-[10px] font-bold text-indigo-900 mb-1.5 flex justify-between items-center">
                                           <span>Parameter (Default Values)</span>
                                           <button 
                                               type="button"
                                               onClick={() => {
                                                   const m = selectedNode.props.navigateTargetParams || [];
                                                   updateSelectedNodeProps({
                                                       navigateTargetParams: [...m, { sourceKey: '', targetKey: '' }]
                                                   });
                                               }}
                                               className="text-[9px] text-indigo-700 hover:underline font-bold"
                                           >
                                               + Hinzufügen
                                           </button>
                                       </span>
                                       {(() => {
                                           const mappings = selectedNode.props.navigateTargetParams || [];
                                           const targetForm = forms.find(f => f.id === selectedNode.props.formId);
                                           const targetTable = tables.find(t => t.id === targetForm?.sourceId);
                                           const formFields = targetTable?.fields || [];

                                           return (
                                               <div className="space-y-1.5">
                                                   {mappings.length === 0 ? (
                                                       <span className="text-[9px] text-slate-400 italic block leading-normal">Aktuelle Seiten-Parameter werden automatisch übergeben, falls Feldnamen übereinstimmen.</span>
                                                   ) : (
                                                       mappings.map((mapping: any, mIdx: number) => (
                                                           <div key={mIdx} className="flex gap-1 items-center">
                                                               <input
                                                                   type="text"
                                                                   value={mapping.sourceKey}
                                                                   onChange={(e) => {
                                                                       const copy = [...mappings];
                                                                       copy[mIdx].sourceKey = e.target.value;
                                                                       updateSelectedNodeProps({ navigateTargetParams: copy });
                                                                   }}
                                                                   placeholder="Quelle (z.B. id)"
                                                                   className="flex-1 text-[10px] font-mono px-1.5 py-0.5 border border-slate-300 rounded"
                                                               />
                                                               <span className="text-slate-400">➔</span>
                                                               <select
                                                                   value={mapping.targetKey}
                                                                   onChange={(e) => {
                                                                       const copy = [...mappings];
                                                                       copy[mIdx].targetKey = e.target.value;
                                                                       updateSelectedNodeProps({ navigateTargetParams: copy });
                                                                   }}
                                                                   className="flex-1 text-[10px] font-mono px-1 py-0.5 border border-slate-300 rounded bg-white"
                                                               >
                                                                   <option value="">Formular-Feld</option>
                                                                   {formFields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                                                               </select>
                                                               <button
                                                                   type="button"
                                                                   onClick={() => {
                                                                       updateSelectedNodeProps({
                                                                           navigateTargetParams: mappings.filter((_:any, idx:number) => idx !== mIdx)
                                                                       });
                                                                   }}
                                                                   className="text-red-500 text-[11px] font-bold px-1"
                                                               >
                                                                   ×
                                                               </button>
                                                           </div>
                                                       ))
                                                   )}
                                               </div>
                                           );
                                       })()}
                                   </div>
                               </div>
                           )}

                           {/* Delete Record Action Fields */}
                           {selectedNode.props.actionType === 'delete_record' && (
                               <div className="space-y-3 bg-red-50/30 border border-red-100 rounded p-2.5">
                                   <div>
                                       <label className="block text-[10px] font-bold text-red-900 mb-1">Tabelle wählen</label>
                                       <select
                                           value={selectedNode.props.targetTableId || ''}
                                           onChange={(e) => updateSelectedNodeProps({ targetTableId: e.target.value })}
                                           className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                                       >
                                           <option value="">-- Tabelle wählen --</option>
                                           {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                       </select>
                                   </div>
                                   <div>
                                       <label className="block text-[10px] font-bold text-red-900 mb-1">ID Parameterquelle</label>
                                       <input
                                           type="text"
                                           value={selectedNode.props.paramKey || 'selectedId'}
                                           onChange={(e) => updateSelectedNodeProps({ paramKey: e.target.value })}
                                           placeholder="z.B. selectedId"
                                           className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                                       />
                                   </div>
                                   <p className="text-[9px] text-slate-500 leading-normal">
                                       Löscht den Datensatz, dessen Primärschlüssel dem Parameterwert entspricht.
                                   </p>
                               </div>
                           )}

                           {/* Set Parameter Action Fields */}
                           {selectedNode.props.actionType === 'set_parameter' && (
                               <div className="space-y-3 bg-slate-50 border border-slate-200 rounded p-2.5">
                                   <div>
                                       <label className="block text-[10px] font-bold text-slate-700 mb-1">Parameter Name</label>
                                       <input
                                           type="text"
                                           value={selectedNode.props.paramName || ''}
                                           onChange={(e) => updateSelectedNodeProps({ paramName: e.target.value })}
                                           placeholder="z.B. filterId"
                                           className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                                       />
                                   </div>
                                   <div>
                                       <label className="block text-[10px] font-bold text-slate-700 mb-1">Parameter-Wert</label>
                                       <input
                                           type="text"
                                           value={selectedNode.props.paramValue || ''}
                                           onChange={(e) => updateSelectedNodeProps({ paramValue: e.target.value })}
                                           placeholder="z.B. {{id}} oder Konstante"
                                           className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                                       />
                                       <span className="text-[8px] text-slate-400 mt-0.5 block leading-normal">
                                           Unterstützt Platzhalter wie <code className="bg-white px-0.5">{"{{id}}"}</code> aus dem Schleifen-Kontext.
                                       </span>
                                   </div>
                                </div>
                           )}

                           {/* Navigate to Page Action Fields */}
                           {selectedNode.props.actionType === 'navigate_to_page' && (
                               <div className="space-y-3 bg-emerald-50/30 border border-emerald-100 rounded p-2.5">
                                   <div>
                                       <label className="block text-[10px] font-bold text-emerald-900 mb-1">Zielseite</label>
                                       <select
                                           value={selectedNode.props.targetPageId || ''}
                                           onChange={(e) => updateSelectedNodeProps({ targetPageId: e.target.value })}
                                           className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                                       >
                                           <option value="">-- Seite wählen --</option>
                                           {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                       </select>
                                   </div>

                                   <div className="pt-2 border-t border-emerald-100">
                                       <span className="block text-[10px] font-bold text-emerald-900 mb-1.5 flex justify-between items-center">
                                           <span>Parameter-Übergabe</span>
                                           <button 
                                               type="button"
                                               onClick={() => {
                                                   const m = selectedNode.props.navigateTargetParams || [];
                                                   updateSelectedNodeProps({
                                                       navigateTargetParams: [...m, { sourceKey: '', targetKey: '' }]
                                                   });
                                               }}
                                               className="text-[9px] text-emerald-700 hover:underline font-bold"
                                           >
                                               + Hinzufügen
                                           </button>
                                       </span>
                                       {(() => {
                                           const mappings = selectedNode.props.navigateTargetParams || [];
                                           const targetPage = pages.find(p => p.id === selectedNode.props.targetPageId);
                                           const expectedTargetParams = targetPage?.expectedParams || [];

                                           return (
                                               <div className="space-y-1.5">
                                                   {mappings.length === 0 ? (
                                                       <span className="text-[9px] text-slate-400 italic block">Keine Übergabe definiert.</span>
                                                   ) : (
                                                       mappings.map((mapping: any, mIdx: number) => (
                                                           <div key={mIdx} className="flex gap-1 items-center">
                                                               <input
                                                                   type="text"
                                                                   value={mapping.sourceKey}
                                                                   onChange={(e) => {
                                                                       const copy = [...mappings];
                                                                       copy[mIdx].sourceKey = e.target.value;
                                                                       updateSelectedNodeProps({ navigateTargetParams: copy });
                                                                   }}
                                                                   placeholder="Quelle (z.B. {{id}})"
                                                                   className="flex-1 text-[10px] font-mono px-1.5 py-0.5 border border-slate-300 rounded"
                                                               />
                                                               <span className="text-slate-400">➔</span>
                                                               <select
                                                                   value={mapping.targetKey}
                                                                   onChange={(e) => {
                                                                       const copy = [...mappings];
                                                                       copy[mIdx].targetKey = e.target.value;
                                                                       updateSelectedNodeProps({ navigateTargetParams: copy });
                                                                   }}
                                                                   className="flex-1 text-[10px] font-mono px-1 py-0.5 border border-slate-300 rounded bg-white"
                                                               >
                                                                   <option value="">Ziel-Key</option>
                                                                   {expectedTargetParams.map(p => <option key={p} value={p}>{p}</option>)}
                                                                   <option value="id">id (Standard)</option>
                                                                   <option value="selectedId">selectedId</option>
                                                               </select>
                                                               <button
                                                                   type="button"
                                                                   onClick={() => {
                                                                       updateSelectedNodeProps({
                                                                           navigateTargetParams: mappings.filter((_:any, idx:number) => idx !== mIdx)
                                                                       });
                                                                   }}
                                                                   className="text-red-500 text-[11px] font-bold px-1"
                                                               >
                                                                   ×
                                                               </button>
                                                           </div>
                                                       ))
                                                   )}
                                               </div>
                                           );
                                       })()}
                                   </div>
                               </div>
                           )}
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
                   {(selectedNode.type === 'table_view' || selectedNode.type === 'list_repeater' || selectedNode.type === 'container') && (
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
                                           onChange={(e: any) => {
                                               const val = e.target.value;
                                               const table = tables.find(t => t.id === val);
                                               const cols = table ? table.fields.map(f => f.name).join(',') : '';
                                               updateSelectedNodeProps({ dataSourceId: val, columns: cols });
                                           }}
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
                                           onChange={(e: any) => {
                                               const val = e.target.value;
                                               const q = queries.find(qi => qi.id === val);
                                               const cols = q ? q.columns.map(c => c.alias || c.fieldName).join(',') : '';
                                               updateSelectedNodeProps({ dataSourceId: val, columns: cols });
                                           }}
                                           className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm mb-3"
                                       >
                                           <option value="">-- Abfrage wählen --</option>
                                          {queries.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                                      </select>
                                   </>
                               )}

                               {(selectedNode.type === 'table_view' || selectedNode.type === 'container' || selectedNode.type === 'list_repeater') && selectedNode.props.dataSourceId && (() => {
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

                                            {/* Table Data Filtering with Parameters */}
                                            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                                                <h5 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                                                    <Database size={12} /> Daten filtern über Parameter
                                                </h5>
                                                <div>
                                                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Filter-Spalte (z.B. id oder standort_id)</label>
                                                    <select
                                                        value={selectedNode.props.filterParamField || ''}
                                                        onChange={(e) => updateSelectedNodeProps({ filterParamField: e.target.value })}
                                                        className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 font-medium"
                                                    >
                                                        <option value="">-- Kein Filter --</option>
                                                        {availableCols.map(col => (
                                                            <option key={col.id} value={col.name}>{col.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Filter-Parameter Name (z.B. selectedId)</label>
                                                    <input 
                                                        type="text"
                                                        value={selectedNode.props.filterParamName || ''}
                                                        onChange={(e) => updateSelectedNodeProps({ filterParamName: e.target.value })}
                                                        placeholder="z.B. selectedId"
                                                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                                                    />
                                                    <p className="text-[9px] text-slate-400 mt-1">
                                                        Filtert die Zeilen dieser Tabelle, sodass der Wert in der ausgewählten Filter-Spalte dem aktuellen Wert des angegebenen Parameters entspricht.
                                                    </p>
                                                </div>
                                            </div>
                                       </div>
                                   );
                               })()}
                           </div>
                       </div>
                   )}

                                        {/* Subpage Container Binding */}
                    {selectedNode && selectedNode.type === 'subpage_container' && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-bold text-emerald-600 mb-2">Unterseiten-Einstellungen</h4>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Eingebundene Seite (Sub-Page)</label>
                                <select 
                                   value={selectedNode.props.subPageId || ''} 
                                   onChange={(e: any) => updateSelectedNodeProps({ subPageId: e.target.value })}
                                   className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs mb-3"
                                >
                                    <option value="">-- Keine Seite ausgewählt --</option>
                                    {pages.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}{p.isSubpage ? ' (Unterseite)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-bold text-slate-700 mb-2">Parameter-Mapping</h4>
                                <p className="text-[10px] text-slate-400 mb-3">
                                    Definiere, welche Variablen oder Spaltenwerte der Hauptseite an die Unterseite übergeben werden sollen.
                                </p>
                                
                                {(() => {
                                    const mappings = selectedNode.props.parameterMappings || [];
                                    
                                    const addMapping = () => {
                                        const newMapping = { sourceKey: '', targetKey: '' };
                                        updateSelectedNodeProps({ parameterMappings: [...mappings, newMapping] });
                                    };

                                    const removeMapping = (idx: number) => {
                                        const next = [...mappings];
                                        next.splice(idx, 1);
                                        updateSelectedNodeProps({ parameterMappings: next });
                                    };

                                    const updateMapping = (idx: number, field: 'sourceKey' | 'targetKey', val: string) => {
                                        const next = [...mappings];
                                        next[idx] = { ...next[idx], [field]: val };
                                        updateSelectedNodeProps({ parameterMappings: next });
                                    };

                                    return (
                                        <div className="space-y-2">
                                            {mappings.map((m: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-2 rounded border border-slate-200">
                                                    <div className="flex-1 space-y-1">
                                                        <input 
                                                            type="text"
                                                            value={m.sourceKey}
                                                            onChange={(e) => updateMapping(idx, 'sourceKey', e.target.value)}
                                                            placeholder="Source (z.B. id)"
                                                            className="w-full px-1.5 py-0.5 text-[11px] border border-slate-300 rounded font-mono"
                                                        />
                                                        <input 
                                                            type="text"
                                                            value={m.targetKey}
                                                            onChange={(e) => updateMapping(idx, 'targetKey', e.target.value)}
                                                            placeholder="Target (z.B. filterId)"
                                                            className="w-full px-1.5 py-0.5 text-[11px] border border-slate-300 rounded font-mono"
                                                        />
                                                    </div>
                                                    <button 
                                                        onClick={() => removeMapping(idx)}
                                                        className="text-slate-400 hover:text-red-500 p-1"
                                                        title="Mapping löschen"
                                                        type="button"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            
                                            <button 
                                                onClick={addMapping}
                                                className="w-full text-center py-1.5 border border-dashed border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                                                type="button"
                                            >
                                                + Mapping hinzufügen
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Embedded Form Binding */}
                    {selectedNode && selectedNode.type === 'form_view' && (
                        <div className="pt-4 border-t border-slate-200 space-y-4">
                            <h4 className="text-xs font-bold text-emerald-600 mb-2">Formular (Embedded)</h4>
                            
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Formular auswählen</label>
                                <select
                                    value={selectedNode.props.formId || ''}
                                    onChange={(e) => updateSelectedNodeProps({ formId: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                                >
                                    <option value="">-- Formular wählen --</option>
                                    {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Modus</label>
                                <select
                                    value={selectedNode.props.formMode || 'edit'}
                                    onChange={(e) => updateSelectedNodeProps({ formMode: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                                >
                                    <option value="create">Erstellen (Create)</option>
                                    <option value="edit">Bearbeiten (Edit)</option>
                                    <option value="readonly">Nur Lesen (View)</option>
                                </select>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Ausblenden</label>
                                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedNode.props.hideNavigation || false}
                                        onChange={(e) => updateSelectedNodeProps({ hideNavigation: e.target.checked })}
                                    />
                                    Navigation (Pfeile) verbergen
                                </label>
                                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedNode.props.hideActions || false}
                                        onChange={(e) => updateSelectedNodeProps({ hideActions: e.target.checked })}
                                    />
                                    Aktionen (Speichern/Löschen/Neu) verbergen
                                </label>
                                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedNode.props.hideHeader || false}
                                        onChange={(e) => updateSelectedNodeProps({ hideHeader: e.target.checked })}
                                    />
                                    Kopfzeile (Titel & Schließen-X) verbergen
                                </label>
                            </div>

                            {(selectedNode.props.formMode === 'edit' || selectedNode.props.formMode === 'readonly') && (
                                <div className="pt-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Datensatz Filter</label>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="block text-[10px] text-slate-500">Filter-Feld (Variable/Spalte)</label>
                                            <input
                                                type="text"
                                                value={selectedNode.props.filterParamField || ''}
                                                onChange={(e) => updateSelectedNodeProps({ filterParamField: e.target.value })}
                                                placeholder="z.B. id"
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-500">Aus Parameter laden</label>
                                            <input
                                                type="text"
                                                value={selectedNode.props.filterParamName || ''}
                                                onChange={(e) => updateSelectedNodeProps({ filterParamName: e.target.value })}
                                                placeholder="z.B. selectedId"
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Table View Interactions & Detail Page Binding */}
                    {selectedNode && selectedNode.type === 'table_view' && (
                        <div className="pt-4 border-t border-slate-200 space-y-4">
                            <h4 className="text-xs font-bold text-emerald-600 mb-2">Aktionen & Interaktionen</h4>
                            
                            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    checked={!!selectedNode.props.enableCrudActions}
                                    onChange={(e) => updateSelectedNodeProps({ enableCrudActions: e.target.checked })}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                CRUD-Aktionen aktivieren (Details, Bearbeiten, Löschen)
                            </label>

                            {selectedNode.props.enableCrudActions && (
                                <div className="space-y-3 pl-3 border-l-2 border-indigo-200">
                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Formular für "Neu" (Erstellen)</label>
                                        <select
                                            value={selectedNode.props.createFormId || ''}
                                            onChange={(e) => updateSelectedNodeProps({ createFormId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                                        >
                                            <option value="">-- Kein Formular (Deaktiviert) --</option>
                                            {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Formular für "Bearbeiten"</label>
                                        <select
                                            value={selectedNode.props.editFormId || ''}
                                            onChange={(e) => updateSelectedNodeProps({ editFormId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                                        >
                                            <option value="">-- Kein Formular (Deaktiviert) --</option>
                                            {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 border-t border-slate-100">
                                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={!!selectedNode.props.enableSelection}
                                        onChange={(e) => updateSelectedNodeProps({ enableSelection: e.target.checked })}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Zeilen-Klick aktivieren (Parameter setzen)
                                </label>
                                
                                {(selectedNode.props.enableSelection || selectedNode.props.enableCrudActions) && (
                                    <div className="space-y-3 mt-3 pl-3 border-l-2 border-indigo-200">
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Ziel-Parameter Name</label>
                                            <input 
                                                type="text"
                                                value={selectedNode.props.selectionParamName || 'selectedId'}
                                                onChange={(e) => updateSelectedNodeProps({ selectionParamName: e.target.value })}
                                                placeholder="z.B. selectedId"
                                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Bei "Details"-Klick auf Seite navigieren</label>
                                            <select
                                                value={selectedNode.props.detailsPageId || ''}
                                                onChange={(e) => updateSelectedNodeProps({ detailsPageId: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                                            >
                                                <option value="">-- Kein Seitenwechsel (nur Parameter setzen) --</option>
                                                {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                   {/* Row/Column Properties */}
                   {(selectedNode.type === 'row' || selectedNode.type === 'column') && (
                       <div className="pt-4 border-t border-slate-100 space-y-3">
                           <h4 className="text-xs font-bold text-indigo-600 mb-2">Layout Eigenschaften</h4>
                           
                           <div>
                               <label className="block text-[10px] font-semibold text-slate-500 mb-1">Abstand (Gap)</label>
                               <select 
                                   value={selectedNode.props.gap || '4'}
                                   onChange={(e) => updateSelectedNodeProps({ gap: e.target.value })}
                                   className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                               >
                                   <option value="0">Kein (0)</option>
                                   <option value="1">Klein (4px)</option>
                                   <option value="2">Mittel (8px)</option>
                                   <option value="4">Standard (16px)</option>
                                   <option value="6">Groß (24px)</option>
                                   <option value="8">Sehr Groß (32px)</option>
                               </select>
                           </div>

                           <div className="grid grid-cols-2 gap-2">
                               <div>
                                   <label className="block text-[10px] font-semibold text-slate-500 mb-1">Ausrichtung (Align)</label>
                                   <select 
                                       value={selectedNode.props.alignItems || (selectedNode.type === 'row' ? 'start' : 'stretch')}
                                       onChange={(e) => updateSelectedNodeProps({ alignItems: e.target.value })}
                                       className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                                   >
                                       <option value="start">Oben/Anfang (Start)</option>
                                       <option value="center">Mittig (Center)</option>
                                       <option value="end">Unten/Ende (End)</option>
                                       <option value="stretch">Strecken (Stretch)</option>
                                   </select>
                               </div>
                               <div>
                                   <label className="block text-[10px] font-semibold text-slate-500 mb-1">Verteilung (Justify)</label>
                                   <select 
                                       value={selectedNode.props.justifyContent || 'start'}
                                       onChange={(e) => updateSelectedNodeProps({ justifyContent: e.target.value })}
                                       className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                                   >
                                       <option value="start">Anfang (Start)</option>
                                       <option value="center">Mittig (Center)</option>
                                       <option value="end">Ende (End)</option>
                                       <option value="between">Zwischen (Between)</option>
                                   </select>
                               </div>
                           </div>

                           {selectedNode.type === 'row' && (
                               <label className="flex items-center gap-2 text-[10px] font-semibold text-slate-600 cursor-pointer mt-2">
                                   <input 
                                       type="checkbox"
                                       checked={!!selectedNode.props.wrap}
                                       onChange={(e) => updateSelectedNodeProps({ wrap: e.target.checked })}
                                       className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                   />
                                   Zeilenumbruch erlauben (Wrap)
                               </label>
                           )}
                       </div>
                   )}

                   {/* Card Properties */}
                   {selectedNode.type === 'card' && (
                       <div className="pt-4 border-t border-slate-100">
                           <h4 className="text-xs font-bold text-indigo-600 mb-2">Card Eigenschaften</h4>
                           <div>
                               <label className="block text-xs font-semibold text-slate-600 mb-1">Titel</label>
                               <input 
                                   type="text"
                                   value={selectedNode.props.title || ''}
                                   onChange={(e) => updateSelectedNodeProps({ title: e.target.value })}
                                   placeholder="Titel der Card (z.B. {name})"
                                   className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                               />
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
                                        <option value="not_empty">ist gesetzt (nicht leer)</option>
                                        <option value="empty">ist leer</option>
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

                    {/* Rollen-Sichtbarkeit / Userlevels (RBAC) */}
                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-1">
                            <Layers size={13} /> Rollen-Berechtigung (Userlevels)
                        </h4>
                        <p className="text-[10px] text-slate-400 mb-2">Wählen Sie aus, welche Benutzerrollen diese Komponente sehen dürfen. (Leer lassen für alle)</p>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50">
                            {availableRoles.map(role => {
                                const currentAllowed = selectedNode.props.allowedRoles || [];
                                const isChecked = currentAllowed.includes(role);
                                return (
                                    <label key={role} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                                        <input 
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                                const nextRoles = e.target.checked 
                                                    ? [...currentAllowed, role]
                                                    : currentAllowed.filter((r: string) => r !== role);
                                                updateSelectedNodeProps({ allowedRoles: nextRoles });
                                            }}
                                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-3.5 w-3.5"
                                        />
                                        <span>{role}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            
            {!selectedNode && (
                <div className="p-4 space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                            <LayoutTemplate size={16} className="text-amber-500" />
                            Seiten-Konfiguration
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Seitenname</label>
                                <input 
                                    type="text" 
                                    value={page.name} 
                                    onChange={e => onPageChange({ ...page, name: e.target.value })}
                                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 select-none pt-2">
                                <input 
                                    type="checkbox"
                                    id="isSubpageCheckboxSidebar"
                                    checked={!!page.isSubpage}
                                    onChange={e => onPageChange({ ...page, isSubpage: e.target.checked })}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                                />
                                <label htmlFor="isSubpageCheckboxSidebar" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1">
                                    <Layers size={13} className="text-emerald-600"/> Als Unterseite (Sub-Page) markieren
                                </label>
                            </div>

                            {page.isSubpage && (
                                <div className="space-y-3 pt-3 border-t border-slate-200">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hauptseite (Parent Page)</label>
                                        <select
                                            value={page.parentPageId || ''}
                                            onChange={(e) => onPageChange({ ...page, parentPageId: e.target.value || undefined })}
                                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                                        >
                                            <option value="">-- Keine Hauptseite --</option>
                                            {pages.filter(p => p.id !== page.id && !p.isSubpage).map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Parameter-Übernahme & Bindung Info */}
                                    <div className="bg-emerald-50 border border-emerald-100 rounded p-2.5">
                                        <h4 className="text-[10px] font-bold text-emerald-800 flex items-center gap-1 uppercase tracking-wider mb-1">
                                            <Layers size={10} /> Automatische Parameter
                                        </h4>
                                        
                                        {(() => {
                                            const relevantParentId = page.parentPageId;
                                            const parentPages = relevantParentId 
                                                ? pages.filter(p => p.id === relevantParentId) 
                                                : pages.filter(p => p.id !== page.id);
                                                
                                            const embeddingContainers: { pageName: string, mapping: any[] }[] = [];
                                            
                                            const findContainers = (node: PageComponent, pageName: string) => {
                                                if (node.type === 'subpage_container' && node.props.subPageId === page.id) {
                                                    embeddingContainers.push({ pageName, mapping: node.props.parameterMappings || [] });
                                                }
                                                if (node.children) {
                                                    node.children.forEach(c => findContainers(c, pageName));
                                                }
                                            };
                                            
                                            parentPages.forEach(p => findContainers(p.layout, p.name));
                                            
                                            if (embeddingContainers.length === 0) {
                                                return (
                                                    <p className="text-[10px] text-slate-500 italic leading-normal">
                                                        Auf der Hauptseite wurde noch kein Sub-Container für diese Seite platziert. Füge dort eine "Unterseite" Komponente ein.
                                                    </p>
                                                );
                                            }
                                            
                                            return (
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] text-emerald-700 leading-normal">
                                                        Aktive Einbindungs-Mappings gefunden:
                                                    </p>
                                                    {embeddingContainers.map((item, idx) => (
                                                        <div key={idx} className="bg-white border border-emerald-100 rounded p-1.5 text-[9px] font-mono">
                                                            <span className="font-bold text-slate-700 block mb-1">Seite: {item.pageName}</span>
                                                            {item.mapping.length === 0 ? (
                                                                <span className="text-slate-400 italic">Keine Mappings</span>
                                                            ) : (
                                                                item.mapping.map((m: any, mIdx: number) => (
                                                                    <div key={mIdx} className="flex justify-between border-b border-slate-50 py-0.5">
                                                                        <span className="text-slate-500">{m.sourceKey}</span>
                                                                        <span className="text-emerald-600 font-bold">➔ {m.targetKey}</span>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Expected Parameters list */}
                                    <div className="bg-white border border-slate-200 rounded p-2.5">
                                        <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Erwartete Parameter</h4>
                                        <p className="text-[9px] text-slate-400 mb-2">Fügen Sie Parameter hinzu, die die URL oder Hauptseite übergibt.</p>
                                        <PageExpectedParamsEditor page={page} onPageChange={onPageChange} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Schnittstellen & API-Inspector */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                            <Database size={16} className="text-indigo-500" />
                            Schnittstellen &amp; API-Inspector
                        </h3>
                        <p className="text-[10px] text-slate-400 mb-3">Abfragen und Datenquellen live einsehen und testen.</p>
                        
                        <ApiInspector queries={queries} tables={tables} />
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

const PageExpectedParamsEditor: React.FC<{ page: CustomPage; onPageChange: (p: CustomPage) => void }> = ({ page, onPageChange }) => {
    const [newParam, setNewParam] = useState('');
    const expected = page.expectedParams || [];

    const handleAdd = () => {
        if (newParam.trim() && !expected.includes(newParam.trim())) {
            onPageChange({
                ...page,
                expectedParams: [...expected, newParam.trim()]
            });
            setNewParam('');
        }
    };

    const handleRemove = (p: string) => {
        onPageChange({
            ...page,
            expectedParams: expected.filter(x => x !== p)
        });
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-1">
                <input 
                    type="text"
                    value={newParam}
                    onChange={(e) => setNewParam(e.target.value)}
                    placeholder="z.B. customerId"
                    className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
                />
                <button 
                    type="button"
                    onClick={handleAdd}
                    className="px-2 py-1 bg-slate-800 text-white rounded text-xs font-bold hover:bg-slate-700"
                >
                    +
                </button>
            </div>
            {expected.length === 0 ? (
                <div className="text-[10px] text-slate-400 italic">Keine Parameter definiert.</div>
            ) : (
                <div className="flex flex-wrap gap-1 pt-1">
                    {expected.map(p => (
                        <span key={p} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-100">
                            {p}
                            <button type="button" onClick={() => handleRemove(p)} className="text-emerald-500 hover:text-emerald-800 font-bold focus:outline-none">×</button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

const ApiInspector: React.FC<{ queries: any[]; tables: any[] }> = ({ queries, tables }) => {
    const [selectedType, setSelectedType] = useState<'table' | 'query'>('table');
    const [selectedId, setSelectedId] = useState<string>('');
    const [mockData, setMockData] = useState<any[] | null>(null);

    const activeList = selectedType === 'table' ? tables : queries;

    const handleSelectType = (type: 'table' | 'query') => {
        setSelectedType(type);
        setSelectedId('');
        setMockData(null);
    };

    const handleSelectId = (id: string) => {
        setSelectedId(id);
        if (!id) {
            setMockData(null);
            return;
        }

        if (selectedType === 'table') {
            const t = tables.find(tb => tb.id === id);
            setMockData(t ? t.data || [] : []);
        } else {
            const q = queries.find(qi => qi.id === id);
            if (q) {
                const cols = q.columns || [];
                const mockRows = Array.from({ length: 3 }).map((_, idx) => {
                    const row: Record<string, any> = {};
                    cols.forEach((col: any) => {
                        const name = col.alias || col.fieldName || 'field';
                        if (name.toLowerCase().includes('id')) row[name] = idx + 1;
                        else if (name.toLowerCase().includes('name')) row[name] = ['Müller', 'Schmidt', 'Fischer'][idx];
                        else if (name.toLowerCase().includes('status')) row[name] = ['Aktiv', 'Inaktiv', 'Entwurf'][idx];
                        else row[name] = `Wert ${idx + 1}`;
                    });
                    return row;
                });
                setMockData(mockRows);
            } else {
                setMockData([]);
            }
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex bg-slate-200 p-0.5 rounded text-xs">
                <button 
                    type="button"
                    onClick={() => handleSelectType('table')}
                    className={`flex-1 py-1 rounded text-center font-medium transition ${selectedType === 'table' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    Tabellen
                </button>
                <button 
                    type="button"
                    onClick={() => handleSelectType('query')}
                    className={`flex-1 py-1 rounded text-center font-medium transition ${selectedType === 'query' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    Abfragen
                </button>
            </div>

            <select
                value={selectedId}
                onChange={(e) => handleSelectId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
            >
                <option value="">-- Quelle auswählen --</option>
                {activeList.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                ))}
            </select>

            {selectedId && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Endpoint &amp; Snippet:
                    </div>
                    <div className="bg-slate-900 text-slate-300 rounded p-2 text-[10px] font-mono select-all overflow-x-auto break-all">
                        {selectedType === 'table' ? (
                            `GET /api/tables/${activeList.find(x => x.id === selectedId)?.name || 'data'}`
                        ) : (
                            `GET /api/queries/${selectedId}`
                        )}
                    </div>

                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-1 flex justify-between items-center">
                        <span>Antwort-Vorschau (Muster):</span>
                        <span className="text-[8px] bg-indigo-100 text-indigo-700 font-bold px-1 rounded uppercase">JSON</span>
                    </div>

                    <div className="bg-slate-900 text-emerald-400 rounded p-2 text-[10px] font-mono overflow-y-auto max-h-40 whitespace-pre-wrap">
                        {mockData ? JSON.stringify(mockData, null, 2) : 'Keine Vorschau verfügbar'}
                    </div>
                </div>
            )}
        </div>
    );
};

