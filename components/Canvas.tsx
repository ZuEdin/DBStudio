
import React, { useRef, useState } from 'react';
import { Table, TableNode, Field, Relationship, HEADER_HEIGHT, FIELD_HEIGHT, NODE_WIDTH } from '../types/index';
import { X, Globe, Table as TableIcon, Hash, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface CanvasProps {
  nodes: TableNode[];
  tables: Table[];
  relationships?: Relationship[];
  onMoveNode: (id: string, x: number, y: number) => void;
  onRemoveNode?: (id: string) => void;
  onConnect?: (sourceTableId: string, sourceFieldId: string, targetTableId: string, targetFieldId: string) => void;
  isInteractive?: boolean;
  onRelationshipContextMenu?: (event: React.MouseEvent, relId: string) => void;
  onNodeDoubleClick?: (tableId: string) => void;
}

type DragState = { 
  nodeId: string; 
  startX: number; 
  startY: number; 
  mouseStartX: number; 
  mouseStartY: number; 
} | null;

export const Canvas: React.FC<CanvasProps> = ({ 
  nodes, 
  tables, 
  relationships = [], 
  onMoveNode, 
  onRemoveNode,
  onConnect,
  isInteractive = false,
  onRelationshipContextMenu,
  onNodeDoubleClick,
}) => {
  const [dragState, setDragState] = useState<DragState>(null);
  const [connectionStart, setConnectionStart] = useState<{ tableId: string, fieldId: string, nodeId: string } | null>(null);
  
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

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
      setDragState({
        nodeId,
        startX: node.x,
        startY: node.y,
        mouseStartX: e.clientX,
        mouseStartY: e.clientY,
      });
    }
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && isInteractive) {
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
      onMoveNode(dragState.nodeId, dragState.startX + dx, dragState.startY + dy);
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
    // Adjusted calculation: Shifted up by 7px (-7) instead of -2 to correct visual alignment
    const y = node.y + HEADER_HEIGHT + (fieldIndex * FIELD_HEIGHT) + (FIELD_HEIGHT / 2) - 7;
    const x = side === 'left' ? node.x : node.x + NODE_WIDTH;
    return { x, y };
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
        <svg className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none z-10">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
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
            
            const startSide = fromIsLeft ? 'right' : 'left';
            const endSide = fromIsLeft ? 'left' : 'right';

            const start = getFieldPos(fromNode, fromTable, rel.fromFieldId, startSide);
            const end = getFieldPos(toNode, toTable, rel.toFieldId, endSide);

            // Control points for bezier curve
            const controlOffset = 50;
            const cx1 = fromIsLeft ? start.x + controlOffset : start.x - controlOffset;
            const cx2 = fromIsLeft ? end.x - controlOffset : end.x + controlOffset;

            const d = `M ${start.x} ${start.y} C ${cx1} ${start.y}, ${cx2} ${end.y}, ${end.x} ${end.y}`;
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
                <circle cx={end.x} cy={end.y} r="4" fill="#64748b" className="pointer-events-none" stroke="white" strokeWidth="1" />

                 {/* Labels */}
                <text x={fromIsLeft ? start.x + 8 : start.x - 15} y={start.y + 4} className="fill-slate-600 font-mono text-xs font-bold pointer-events-none select-none">1</text>
                <text x={fromIsLeft ? end.x - 15 : end.x + 8} y={end.y + 4} className="fill-slate-600 font-mono text-xs font-bold pointer-events-none select-none">{labelTo}</text>
              </g>
            );
          })}
        </svg>

        {safeNodes.map(node => {
          const table = safeTables.find(t => t.id === node.tableId);
          if (!table) return null;

          return (
            <div
              key={node.id}
              className="absolute bg-white border border-slate-400 shadow-md rounded-sm select-none z-20"
              style={{ 
                left: node.x, 
                top: node.y, 
                width: NODE_WIDTH,
              }}
              onMouseDown={(e) => handleDragStart(e, node.id)}
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
      {/* Zoom Controls Overlay */}
      <div className="absolute bottom-4 left-4 bg-white rounded shadow border border-slate-300 p-1 flex items-center gap-1 z-30 select-none">
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
