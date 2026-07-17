import React from 'react';
import { PageComponent, SelectQuery } from '../../../types/index';
import { LayoutTemplate, Layers } from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';

import { CustomComponentRunner } from './runner/CustomComponentRunner';

interface SubPagePreviewNodeProps {
    node: PageComponent;
    queries: any[];
    tables: any[];
    pages: any[];
}

export const SubPagePreviewNode: React.FC<SubPagePreviewNodeProps> = ({ node, queries, tables, pages }) => {
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
        
        case 'custom_component': {
            content = (
                <div className="p-1 border border-emerald-200/50 rounded bg-emerald-50/10 text-[9px] text-emerald-800 italic">
                    [Custom Component: {node.props.customComponentId ? 'Konfiguriert' : 'Unkonfiguriert'}]
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

interface RenderNodeProps {
    node: PageComponent;
    selectedNodeId: string | null;
    onSelect: (id: string, e: React.MouseEvent) => void;
    onDrop: (e: React.DragEvent, id: string) => void;
}

export const RenderNode: React.FC<RenderNodeProps> = ({ node, selectedNodeId, onSelect, onDrop }) => {
    const { queries, tables, pages } = useProjectStore();
    const isSelected = selectedNodeId === node.id;
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop(e, node.id);
    };
    
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(node.id, e);
    };

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
             break;        case 'subpage_container': {
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
        case 'custom_component': {
             const { customComponents = [] } = useProjectStore();
             const comp = customComponents.find(c => c.id === node.props.customComponentId);
             content = (
                  <div className={`p-4 rounded-lg bg-emerald-50/40 border-2 border-emerald-200 w-full ${node.props.className || ''}`} style={node.props.style}>
                      <div className="flex items-center justify-between text-emerald-700 text-xs font-bold mb-2 pb-1 border-b border-emerald-100 pointer-events-none">
                          <span className="flex items-center gap-1">
                              <LayoutTemplate size={12}/> Custom SDUI Component: {comp ? comp.name : 'Nicht verknüpft'}
                          </span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase">{comp ? comp.type.replace('_view', '') : 'SDUI'}</span>
                      </div>
                      <div className="text-xs text-slate-700">
                          {comp ? (
                              <div className="space-y-1">
                                  {comp.description && <p className="text-[11px] text-slate-500 italic">{comp.description}</p>}
                                  <div className="bg-white/80 p-2 rounded border border-emerald-100 font-mono text-[9px] max-h-24 overflow-y-auto">
                                      <span className="font-bold text-indigo-900 block mb-1">Configuration (JSON):</span>
                                      {JSON.stringify(comp.configuration, null, 2)}
                                  </div>
                                </div>
                            ) : (
                                <span className="text-slate-400 italic">Bitte wählen Sie rechts in den Eigenschaften eine Custom Component aus.</span>
                            )}
                        </div>
                    </div>
               );
               isDropTarget = false;
               break;
         }
         case 'navbar':
             content = (
                 <div className={`w-full flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm ${node.props.className || ''}`} style={node.props.style}>
                     <div className="font-bold text-slate-800 text-lg">{node.props.brandName || 'BrandLogo'}</div>
                     <div className="flex gap-4 text-sm text-slate-600 font-medium">
                         <span>Home</span>
                         <span>Features</span>
                         <span>Pricing</span>
                         <span>Contact</span>
                     </div>
                 </div>
             );
             isDropTarget = false;
             break;
         case 'hero_section':
             content = (
                 <div className={`w-full p-12 py-24 flex flex-col items-center text-center bg-gradient-to-b from-slate-50 to-white ${node.props.className || ''}`} style={node.props.style}>
                     <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">{node.props.headline || 'Catchy Headline Here'}</h1>
                     <p className="text-lg text-slate-600 max-w-2xl mb-8">{node.props.subheadline || 'A compelling subheadline that explains the value proposition of your product or service.'}</p>
                     <div className="flex gap-4">
                         <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md">{node.props.primaryButtonText || 'Get Started'}</button>
                         <button className="px-6 py-3 bg-white text-slate-700 font-bold border border-slate-200 rounded-lg shadow-sm">{node.props.secondaryButtonText || 'Learn More'}</button>
                     </div>
                 </div>
             );
             isDropTarget = false;
             break;
         case 'feature_grid':
             content = (
                 <div className={`w-full p-12 bg-white ${node.props.className || ''}`} style={node.props.style}>
                     <div className="text-center mb-12">
                         <h2 className="text-3xl font-bold text-slate-900">{node.props.title || 'Amazing Features'}</h2>
                         <p className="text-slate-500 mt-2">{node.props.subtitle || 'Everything you need to succeed.'}</p>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         {[1, 2, 3].map(i => (
                             <div key={i} className="flex flex-col items-center text-center p-6 border border-slate-100 rounded-xl bg-slate-50">
                                 <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">✨</div>
                                 <h3 className="font-bold text-lg mb-2">Feature {i}</h3>
                                 <p className="text-slate-500 text-sm">Description for this amazing feature that will help users.</p>
                             </div>
                         ))}
                     </div>
                 </div>
             );
             isDropTarget = false;
             break;
         case 'pricing_table':
             content = (
                 <div className={`w-full p-12 bg-slate-50 ${node.props.className || ''}`} style={node.props.style}>
                     <div className="text-center mb-12">
                         <h2 className="text-3xl font-bold text-slate-900">Simple Pricing</h2>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                         {['Basic', 'Pro', 'Enterprise'].map((plan, i) => (
                             <div key={plan} className={`p-8 rounded-2xl border ${i === 1 ? 'border-blue-500 shadow-xl bg-white relative' : 'border-slate-200 bg-white shadow-sm'}`}>
                                 {i === 1 && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-3 py-1 text-xs font-bold rounded-full">MOST POPULAR</div>}
                                 <h3 className="text-xl font-bold mb-2">{plan}</h3>
                                 <div className="text-4xl font-extrabold mb-6">${(i + 1) * 19}<span className="text-sm font-normal text-slate-500">/mo</span></div>
                                 <ul className="space-y-3 mb-8 text-sm text-slate-600">
                                     <li>✓ Feature A</li>
                                     <li>✓ Feature B</li>
                                     <li>✓ Feature C</li>
                                 </ul>
                                 <button className={`w-full py-2 rounded-lg font-bold ${i === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Choose Plan</button>
                             </div>
                         ))}
                     </div>
                 </div>
             );
             isDropTarget = false;
             break;
         case 'testimonial':
             content = (
                 <div className={`w-full p-12 bg-white ${node.props.className || ''}`} style={node.props.style}>
                     <div className="max-w-3xl mx-auto text-center">
                         <div className="text-4xl text-blue-500 mb-4">"</div>
                         <p className="text-2xl font-medium text-slate-800 mb-8 italic">{node.props.quote || 'This product completely transformed how we work. Highly recommended!'}</p>
                         <div className="flex items-center justify-center gap-3">
                             <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                             <div className="text-left">
                                 <div className="font-bold text-slate-900">{node.props.author || 'Jane Doe'}</div>
                                 <div className="text-sm text-slate-500">{node.props.role || 'CEO, Company Inc'}</div>
                             </div>
                         </div>
                     </div>
                 </div>
             );
             isDropTarget = false;
             break;
         case 'footer':
             content = (
                 <div className={`w-full p-12 bg-slate-900 text-slate-400 ${node.props.className || ''}`} style={node.props.style}>
                     <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-slate-800 pb-8 mb-8">
                         <div className="max-w-xs">
                             <div className="font-bold text-white text-xl mb-4">{node.props.brandName || 'BrandLogo'}</div>
                             <p className="text-sm">Making the world a better place through constructing elegant hierarchies.</p>
                         </div>
                         <div className="flex gap-16">
                             <div>
                                 <h4 className="text-white font-bold mb-4">Product</h4>
                                 <ul className="space-y-2 text-sm"><li>Features</li><li>Pricing</li><li>Docs</li></ul>
                             </div>
                             <div>
                                 <h4 className="text-white font-bold mb-4">Company</h4>
                                 <ul className="space-y-2 text-sm"><li>About</li><li>Blog</li><li>Contact</li></ul>
                             </div>
                         </div>
                     </div>
                     <div className="text-sm flex justify-between">
                         <p>© 2024 Your Company. All rights reserved.</p>
                         <div className="flex gap-4"><span>Twitter</span><span>GitHub</span></div>
                     </div>
                 </div>
             );
             isDropTarget = false;
             break;

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
