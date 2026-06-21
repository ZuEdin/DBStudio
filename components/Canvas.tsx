
import React, { useRef, useState } from 'react';
import { Table, TableNode, Field, Relationship, HEADER_HEIGHT, FIELD_HEIGHT, NODE_WIDTH, TableGroup } from '../types/index';
import { X, Globe, Table as TableIcon, Hash, ZoomIn, ZoomOut, RotateCcw, Group, AlignLeft, AlignLeft as AlignLeftIcon } from 'lucide-react';
import { useProjectStore } from '../stores/useProjectStore';

interface CanvasProps {
  nodes: TableNode[];
  tables: Table[];
  relationships?: Relationship[];
  onMoveNode?: (id: string, x: number, y: number) => void;
  onUpdateNodes?: (nodes: TableNode[]) => void;
  onRemoveNode?: (id: string) => void;
  onConnect?: (sourceTableId: string, sourceFieldId: string, targetTableId: string, targetFieldId: string) => void;
  isInteractive?: boolean;
  onRelationshipContextMenu?: (event: React.MouseEvent, relId: string) => void;
  onNodeDoubleClick?: (tableId: string) => void;
}

type DragState = { 
  nodeIds: string[]; 
  initialPositions: { [id: string]: { x: number; y: number } }; 
  mouseStartX: number; 
  mouseStartY: number; 
} | null;

export const Canvas: React.FC<CanvasProps> = ({ 
  nodes, 
  tables, 
  relationships = [], 
  onMoveNode, 
  onUpdateNodes,
  onRemoveNode,
  onConnect,
  isInteractive = false,
  onRelationshipContextMenu,
  onNodeDoubleClick,
}) => {
  const [dragState, setDragState] = useState<DragState>(null);
  const [connectionStart, setConnectionStart] = useState<{ tableId: string, fieldId: string, nodeId: string } | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const tableGroups = useProjectStore(state => state.tableGroups);
  const setTableGroups = useProjectStore(state => state.setTableGroups);

  const handleZoomIn = () => {
    setScale(prev => Math.min(2, Math.round(prev * 1.15 * 100) / 100));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.2, Math.round((prev / 1.15) * 100) / 100));
  };

  const handleZoomReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Safe Arrays to prevent "e.find is not a function" errors during fast state updates
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeTables = Array.isArray(tables) ? tables : [];
  const safeRelationships = Array.isArray(relationships) ? relationships : [];

  const handleDragStart = (e: React.MouseEvent, nodeId: string) => {
    const node = safeNodes.find(n => n.id === nodeId);
    if (!node || !isInteractive) return;

    if ((e.target as HTMLElement).closest('.node-header')) {
      e.stopPropagation();

      let newSelection = [...selectedNodeIds];
      
      if (e.shiftKey) {
        if (newSelection.includes(nodeId)) {
          newSelection = newSelection.filter(id => id !== nodeId);
        } else {
          newSelection.push(nodeId);
        }
      } else {
        if (!newSelection.includes(nodeId)) {
          newSelection = [nodeId];
          // If the node belongs to a group, select all nodes in that group
          if (node.groupId) {
             const groupNodes = safeNodes.filter(n => n.groupId === node.groupId).map(n => n.id);
             newSelection = Array.from(new Set([...newSelection, ...groupNodes]));
          }
        } else {
          // It's already selected. If it has a group, ensure the whole group is selected too.
          if (node.groupId) {
             const groupNodes = safeNodes.filter(n => n.groupId === node.groupId).map(n => n.id);
             newSelection = Array.from(new Set([...newSelection, ...groupNodes]));
          }
        }
      }
      
      setSelectedNodeIds(newSelection);

      const initialPositions: { [id: string]: { x: number; y: number } } = {};
      newSelection.forEach(id => {
        const n = safeNodes.find(n => n.id === id);
        if (n) initialPositions[id] = { x: n.x, y: n.y };
      });

      setDragState({
        nodeIds: newSelection,
        initialPositions,
        mouseStartX: e.clientX,
        mouseStartY: e.clientY,
      });
    }
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && isInteractive) {
      setSelectedNodeIds([]);
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    if (dragState) {
      const dx = (e.clientX - dragState.mouseStartX) / scale;
      const dy = (e.clientY - dragState.mouseStartY) / scale;
      
      if (onUpdateNodes) {
        const updatedNodes = safeNodes.map(n => {
           if (dragState.nodeIds.includes(n.id)) {
             return { ...n, x: dragState.initialPositions[n.id].x + dx, y: dragState.initialPositions[n.id].y + dy };
           }
           return n;
        });
        onUpdateNodes(updatedNodes);
      } else if (onMoveNode) {
        // Fallback for single node dragging
        dragState.nodeIds.forEach(id => {
          onMoveNode(id, dragState.initialPositions[id].x + dx, dragState.initialPositions[id].y + dy);
        });
      }
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
    setConnectionStart(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
    const clampedScale = Math.min(Math.max(0.2, newScale), 2);
    
    const panX = mouseX - (mouseX - pan.x) * (clampedScale / scale);
    const panY = mouseY - (mouseY - pan.y) * (clampedScale / scale);

    setScale(clampedScale);
    setPan({ x: panX, y: panY });
  };

  const handleFieldMouseDown = (e: React.MouseEvent, tableId: string, fieldId: string, nodeId: string) => {
    setSelectedNodeIds([nodeId]);
    if (!isInteractive || onRemoveNode) return; // Prevent connection in query view
    e.stopPropagation();
    setConnectionStart({ tableId, fieldId, nodeId });
  };

  const handleFieldMouseUp = (e: React.MouseEvent, tableId: string, fieldId: string) => {
    if (!isInteractive || !connectionStart || onRemoveNode) return;
    e.stopPropagation();
    
    if (connectionStart.tableId !== tableId && onConnect) {
      onConnect(connectionStart.tableId, connectionStart.fieldId, tableId, fieldId);
    }
    setConnectionStart(null);
  };

  const handleFieldDragStart = (e: React.DragEvent, tableId: string, fieldId: string) => {
    if (!onRemoveNode) return; // Only allow field dragging in query view
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'query_field', tableId, fieldId }));
    e.dataTransfer.effectAllowed = 'copy';
  };
  
  const getFieldPos = (node: TableNode, table: Table, fieldId: string, side: 'left' | 'right') => {
    const fieldIndex = table.fields.findIndex(f => f.id === fieldId);
    
    // Calculate Y center of the field row
    let y = node.y + HEADER_HEIGHT + (fieldIndex * FIELD_HEIGHT) + (FIELD_HEIGHT / 2);
    if (onRemoveNode) y += FIELD_HEIGHT; // Offset for the '*' row in query designer

    const x = side === 'left' ? node.x : node.x + NODE_WIDTH;
    return { x, y };
  };

  const handleGroupSelected = () => {
    if (!onUpdateNodes) return;
    const groupId = crypto.randomUUID();
    
    // Add to TableGroups
    const newGroups = [...(tableGroups || []), { id: groupId, name: 'Neue Gruppe' }];
    setTableGroups(newGroups);

    const updatedNodes = safeNodes.map(n => {
       if (selectedNodeIds.includes(n.id)) {
           return { ...n, groupId };
       }
       return n;
    });
    onUpdateNodes(updatedNodes);
  };

  const handleUngroupSelected = () => {
    if (!onUpdateNodes) return;
    const groupIdsToRemove = new Set(safeNodes.filter(n => selectedNodeIds.includes(n.id) && n.groupId).map(n => n.groupId));
    
    // Remove from TableGroups
    if (groupIdsToRemove.size > 0 && tableGroups) {
        setTableGroups(tableGroups.filter(g => !groupIdsToRemove.has(g.id)));
    }

    const updatedNodes = safeNodes.map(n => {
       if (selectedNodeIds.includes(n.id)) {
           return { ...n, groupId: undefined };
       }
       return n;
    });
    onUpdateNodes(updatedNodes);
  };

  const handleAlignTop = () => {
    if (!onUpdateNodes) return;
    const selectedNodes = safeNodes.filter(n => selectedNodeIds.includes(n.id));
    if (selectedNodes.length === 0) return;
    
    const minY = Math.min(...selectedNodes.map(n => n.y));
    
    const updatedNodes = safeNodes.map(n => {
       if (selectedNodeIds.includes(n.id)) {
           return { ...n, y: minY };
       }
       return n;
    });
    onUpdateNodes(updatedNodes);
  };

  const handleAlignLeft = () => {
    if (!onUpdateNodes) return;
    const selectedNodes = safeNodes.filter(n => selectedNodeIds.includes(n.id));
    if (selectedNodes.length === 0) return;
    
    const minX = Math.min(...selectedNodes.map(n => n.x));
    
    const updatedNodes = safeNodes.map(n => {
       if (selectedNodeIds.includes(n.id)) {
           return { ...n, x: minX };
       }
       return n;
    });
    onUpdateNodes(updatedNodes);
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden canvas-grid bg-slate-50 cursor-grab"
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      onWheel={handleWheel}
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="absolute top-0 left-0"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0' }}
      >
        {tableGroups && tableGroups.map(group => {
            const groupNodes = safeNodes.filter(n => n.groupId === group.id);
            if (groupNodes.length === 0) return null;
            
            const minX = Math.min(...groupNodes.map(n => n.x)) - 24;
            const minY = Math.min(...groupNodes.map(n => n.y)) - 100; 
            const maxX = Math.max(...groupNodes.map(n => n.x + NODE_WIDTH)) + 24;
            const maxY = Math.max(...groupNodes.map(n => {
               const t = safeTables.find(t => t.id === n.tableId);
               const h = t ? HEADER_HEIGHT + t.fields.length * FIELD_HEIGHT + (onRemoveNode ? FIELD_HEIGHT : 0) : 200;
               return n.y + h;
            })) + 24;

            const width = maxX - minX;
            const height = maxY - minY;
            const isSelected = groupNodes.some(n => selectedNodeIds.includes(n.id));

            return (
                <div 
                    key={group.id}
                    className={`absolute rounded-xl transition-all duration-200 pointer-events-auto ${isSelected ? 'border-2 border-blue-400 bg-blue-50/80 shadow-md z-0' : 'border-2 border-slate-300 bg-slate-100 shadow-sm z-0'}`}
                    style={{ left: minX, top: minY, width, height }}
                >
                   <div className="absolute top-0 left-0 w-full px-4 py-3 cursor-pointer transition-opacity">
                      <input 
                         className={`bg-transparent font-semibold text-sm outline-none w-full mb-1 pointer-events-auto transition-colors ${isSelected ? 'text-blue-900 placeholder-blue-300' : 'text-slate-800 placeholder-slate-400'}`}
                         value={group.name}
                         placeholder="Gruppenname"
                         onChange={(e) => {
                             const newGroups = tableGroups.map(g => g.id === group.id ? { ...g, name: e.target.value } : g);
                             setTableGroups(newGroups);
                         }}
                         onMouseDown={(e) => e.stopPropagation()}
                      />
                      {(isSelected || group.comment) && (
                          <textarea
                             className={`text-xs outline-none w-full resize-none pointer-events-auto leading-relaxed border rounded p-1.5 transition-colors ${isSelected ? 'bg-white/60 text-slate-700 border-blue-200 focus:border-blue-400 focus:bg-white placeholder-slate-400' : 'bg-transparent text-slate-600 border-transparent placeholder-slate-400'}`}
                             value={group.comment || ''}
                             placeholder={isSelected ? "Kommentar hinzufügen..." : ""}
                             rows={2}
                             onChange={(e) => {
                                 const newGroups = tableGroups.map(g => g.id === group.id ? { ...g, comment: e.target.value } : g);
                                 setTableGroups(newGroups);
                             }}
                             onMouseDown={(e) => e.stopPropagation()}
                          />
                      )}
                   </div>
                </div>
            );
        })}
        <svg className="absolute top-0 left-0 w-[10000px] h-[10000px] pointer-events-none z-10 overflow-visible" style={{ left: -5000, top: -5000, pointerEvents: 'none' }}>
          <g transform="translate(5000, 5000)">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
              </marker>
            </defs>
            {safeRelationships.map(rel => {
              const fromNode = safeNodes.find(n => n.tableId === rel.fromTableId);
              const toNode = safeNodes.find(n => n.tableId === rel.toTableId);
              const fromTable = safeTables.find(t => t.id === rel.fromTableId);
              const toTable = safeTables.find(t => t.id === rel.toTableId);

              if (!fromNode || !toNode || !fromTable || !toTable) return null;

              // Determine orientation based on X position
              const fromIsLeft = fromNode.x < toNode.x;
              
              // start is on the edge of the fromNode, end is on the edge of the toNode
              const startSide = fromIsLeft ? 'right' : 'left';
              const endSide = fromIsLeft ? 'left' : 'right';

              let start = getFieldPos(fromNode, fromTable, rel.fromFieldId, startSide);
              let end = getFieldPos(toNode, toTable, rel.toFieldId, endSide);

              // Fallback for missing fields (deleted but relation still exists)
              if (fromTable.fields.findIndex(f => f.id === rel.fromFieldId) === -1) {
                  start = { x: start.x, y: fromNode.y + HEADER_HEIGHT / 2 };
              }
              if (toTable.fields.findIndex(f => f.id === rel.toFieldId) === -1) {
                  end = { x: end.x, y: toNode.y + HEADER_HEIGHT / 2 };
              }

              // Adjust the visual end of the path backwards by 10px so the marker base touches the shortened line precisely, and the tip reaches the table edge perfectly 
              const adjustedEndX = fromIsLeft ? end.x - 10 : end.x + 10;
              const bezierEnd = { x: adjustedEndX, y: end.y };

              // Control points for bezier curve
              const controlOffset = 50;
              const cx1 = fromIsLeft ? start.x + controlOffset : start.x - controlOffset;
              const cx2 = fromIsLeft ? bezierEnd.x - controlOffset : bezierEnd.x + controlOffset;

              const d = `M ${start.x} ${start.y} C ${cx1} ${start.y}, ${cx2} ${bezierEnd.y}, ${bezierEnd.x} ${bezierEnd.y}`;
              const labelTo = rel.type === '1:1' ? '1' : '∞';

              return (
                <g 
                  key={rel.id} 
                  className="pointer-events-auto"
                  onContextMenu={(e) => onRelationshipContextMenu && onRelationshipContextMenu(e, rel.id)}
                >
                  {/* Invisible wide path for easier clicking */}
                  <path d={d} stroke="transparent" strokeWidth="12" fill="none" className="cursor-pointer hover:stroke-slate-200/50" />
                  {/* Visible path */}
                  <path d={d} stroke="#64748b" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" className="pointer-events-none" strokeDasharray={rel.referentialIntegrity === false ? '4 2' : 'none'}/>
                  
                  {/* Connection Dots (Circles) */}
                  <circle cx={start.x} cy={start.y} r="4" fill="#64748b" className="pointer-events-none" stroke="white" strokeWidth="1" />
                  <circle cx={bezierEnd.x} cy={bezierEnd.y} r="4" fill="#64748b" className="pointer-events-none" stroke="white" strokeWidth="1" />

                   {/* Labels - positioned slightly above the line */}
                  <text x={fromIsLeft ? start.x + 8 : start.x - 15} y={start.y - 6} className="fill-slate-600 font-mono text-xs font-bold pointer-events-none select-none">1</text>
                  <text x={fromIsLeft ? end.x - 18 : end.x + 10} y={end.y - 6} className="fill-slate-600 font-mono text-xs font-bold pointer-events-none select-none">{labelTo}</text>
                </g>
              );
            })}
          </g>
        </svg>

        {safeNodes.map(node => {
          const table = safeTables.find(t => t.id === node.tableId);
          if (!table) return null;

          return (
            <div
              key={node.id}
              className={`absolute bg-white border border-slate-400 rounded-sm select-none transition-shadow ${selectedNodeIds.includes(node.id) ? 'z-30 shadow-xl border-blue-500' : 'z-20 shadow-md'}`}
              style={{ 
                left: node.x, 
                top: node.y, 
                width: NODE_WIDTH,
              }}
              onMouseDown={(e) => {
                if (!selectedNodeIds.includes(node.id) && !e.shiftKey) {
                  setSelectedNodeIds([node.id]);
                }
                handleDragStart(e, node.id);
              }}
            >
              <div 
                className="node-header h-10 bg-gradient-to-b from-slate-100 to-slate-200 border-b border-slate-300 px-2 flex items-center justify-between cursor-move"
                onDoubleClick={() => onNodeDoubleClick && onNodeDoubleClick(table.id)}
              >
                <div className="flex items-center gap-2 truncate">
                    {/* Icon based on table type (API vs DB) */}
                    {table.isApiImport ? (
                        <span title="Externe API Tabelle" className="flex items-center text-blue-600 flex-shrink-0">
                            <Globe size={14} />
                        </span>
                    ) : (
                        <span title="Lokale Tabelle" className="flex items-center text-slate-500 flex-shrink-0">
                            <TableIcon size={14} />
                        </span>
                    )}
                    <span className="font-bold text-xs truncate text-slate-700" title={table.name}>{table.name}</span>
                </div>
                {onRemoveNode && (
                  <button onClick={() => onRemoveNode(node.id)} className="text-slate-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-800">
                {onRemoveNode && ( // Show '*' only in query designer
                  <div 
                    className="h-7 px-2 flex items-center font-bold hover:bg-sky-50 cursor-grab"
                    draggable
                    onDragStart={(e) => handleFieldDragStart(e, table.id, '*')}
                  >
                    *
                  </div>
                )}
                {table.fields.map(field => {
                  const isForeignKey = safeRelationships.some(r => r.toTableId === table.id && r.toFieldId === field.id);
                  return (
                    <div 
                      key={field.id} 
                      className={`h-7 px-2 flex items-center justify-between hover:bg-sky-50 ${connectionStart?.fieldId === field.id && connectionStart.tableId === table.id ? 'bg-sky-100' : ''} ${onRemoveNode ? 'cursor-grab' : ''}`}
                      onMouseDown={(e) => handleFieldMouseDown(e, table.id, field.id, node.id)}
                      onMouseUp={(e) => handleFieldMouseUp(e, table.id, field.id)}
                      draggable={!!onRemoveNode}
                      onDragStart={(e) => handleFieldDragStart(e, table.id, field.id)}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {field.isPrimaryKey && <span className="text-yellow-500 text-[10px]" title="Primary Key">🔑</span>}
                        {isForeignKey && <span className="text-cyan-600 text-[9px] font-bold" title="Foreign Key">FK</span>}
                        <span className="truncate">{field.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                          <span className="text-[9px] text-slate-400 uppercase">{field.type.substring(0,3)}</span>
                          {/* Auto Increment Indicator */}
                          {field.isAutoIncrement && (
                              <span className="text-[8px] bg-slate-200 text-slate-600 px-1 rounded flex items-center" title="Auto Increment">
                                  AI
                              </span>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Multi-Selection Toolbar */}
      {selectedNodeIds.length > 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-slate-300 p-1 flex items-center gap-1 z-50">
          <button 
            onClick={handleGroupSelected}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded text-slate-700 text-sm font-medium transition-colors"
            title="Zu einer Gruppe zusammenfassen"
          >
            <Group size={16} className="text-slate-500" />
            <span>Gruppieren</span>
          </button>
          
          <div className="w-px h-5 bg-slate-300 mx-1"></div>
          
          <button 
            onClick={handleUngroupSelected}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded text-slate-700 text-sm font-medium transition-colors"
            title="Gruppierung aufheben"
          >
            <Group size={16} className="text-slate-500 opacity-50" />
            <span>Aufheben</span>
          </button>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          <button 
            onClick={handleAlignTop}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded text-slate-700 text-sm font-medium transition-colors"
            title="An der höchsten Tabelle ausrichten"
          >
            <AlignLeftIcon size={16} className="text-slate-500 rotate-90" />
            <span>Oben ausrichten</span>
          </button>
          
          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          <button 
            onClick={handleAlignLeft}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded text-slate-700 text-sm font-medium transition-colors"
            title="Am weitesten links stehenden Tabelle ausrichten"
          >
            <AlignLeftIcon size={16} className="text-slate-500" />
            <span>Links ausrichten</span>
          </button>
        </div>
      )}

      {/* Zoom Controls Overlay */}
      <div className="absolute bottom-4 left-4 bg-white rounded shadow border border-slate-300 p-1 flex items-center gap-1 z-40 select-none">
        <button 
          onClick={handleZoomIn}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-600 active:bg-slate-200 transition-colors"
          title="Zoom vergrößern"
        >
          <ZoomIn size={16} />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-600 active:bg-slate-200 transition-colors"
          title="Zoom verkleinern"
        >
          <ZoomOut size={16} />
        </button>
        <button 
          onClick={handleZoomReset}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-600 active:bg-slate-200 transition-colors flex items-center gap-1.5 text-xs font-semibold border-l border-slate-200 pl-2 bg-slate-50"
          title="Zoom zurücksetzen"
        >
          <RotateCcw size={14} />
          <span>{Math.round(scale * 100)}%</span>
        </button>
      </div>
    </div>
  );
};
