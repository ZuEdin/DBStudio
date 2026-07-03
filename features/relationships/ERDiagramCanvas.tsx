import React, { useEffect, useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType,
  Position,
  Handle,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Table, TableNode, Relationship, TableGroup } from '../../types/index';
import { 
  Database, 
  Globe, 
  Grid, 
  Zap, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Group, 
  AlignLeft, 
  Magnet, 
  Grid3X3,
  GripVertical,
  Info
} from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';

// Custom Group Node Component
const ERGroupNodeComponent = ({ data }: any) => {
  const { group, width, height, onNameChange, onCommentChange, onSelectMembers, onToggleCollapse, tablesInGroup, onColorChange } = data;
  const isCollapsed = group.isCollapsed;

  const colorStyles = {
    purple: 'border-purple-500 bg-purple-50/95 dark:bg-slate-900/95 ring-purple-500/10',
    blue: 'border-blue-500 bg-blue-50/95 dark:bg-slate-900/95 ring-blue-500/10',
    emerald: 'border-emerald-500 bg-emerald-50/95 dark:bg-slate-900/95 ring-emerald-500/10',
    rose: 'border-rose-500 bg-rose-50/95 dark:bg-slate-900/95 ring-rose-500/10',
    amber: 'border-amber-500 bg-amber-50/95 dark:bg-slate-900/95 ring-amber-500/10',
    slate: 'border-slate-500 bg-slate-50/95 dark:bg-slate-900/95 ring-slate-500/10'
  };

  const selectedColorClass = colorStyles[(group.color as keyof typeof colorStyles) || 'purple'];

  const uncollapsedColorStyles = {
    purple: 'border-purple-300 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-900/20',
    blue: 'border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-900/20',
    emerald: 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20',
    rose: 'border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-900/20',
    amber: 'border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-900/20',
    slate: 'border-slate-300 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40'
  };

  const selectedUncollapsedColorClass = uncollapsedColorStyles[(group.color as keyof typeof uncollapsedColorStyles) || 'slate'];

  const headerColors: any = {
    purple: 'bg-purple-600 text-white',
    blue: 'bg-blue-600 text-white',
    emerald: 'bg-emerald-600 text-white',
    rose: 'bg-rose-600 text-white',
    amber: 'bg-amber-600 text-white',
    slate: 'bg-slate-700 text-white'
  };

  const selectedHeaderClass = headerColors[(group.color as keyof typeof headerColors) || 'slate'];

  if (isCollapsed) {
    return (
      <div 
        className={`border-2 shadow-xl rounded-xl flex flex-col pointer-events-auto select-none hover:shadow-2xl transition-all relative border-solid ring-2 overflow-hidden ${selectedColorClass}`}
        style={{ width, height }}
      >
        {/* Handles for collapsed state - act as proxy for internal tables */}
        <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-white border-2 border-slate-400 dark:border-slate-600 dark:!bg-slate-800" id="top" />
        <Handle type="source" position={Position.Top} className="w-3 h-3 !bg-white border-2 border-slate-400 dark:border-slate-600 dark:!bg-slate-800" id="top-s" />
        
        <Handle type="target" position={Position.Bottom} className="w-3 h-3 !bg-white border-2 border-slate-400 dark:border-slate-600 dark:!bg-slate-800" id="bottom" />
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-white border-2 border-slate-400 dark:border-slate-600 dark:!bg-slate-800" id="bottom-s" />
        
        <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-white border-2 border-slate-400 dark:border-slate-600 dark:!bg-slate-800" id="left" />
        <Handle type="source" position={Position.Left} className="w-3 h-3 !bg-white border-2 border-slate-400 dark:border-slate-600 dark:!bg-slate-800" id="left-s" />
        
        <Handle type="target" position={Position.Right} className="w-3 h-3 !bg-white border-2 border-slate-400 dark:border-slate-600 dark:!bg-slate-800" id="right" />
        <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-white border-2 border-slate-400 dark:border-slate-600 dark:!bg-slate-800" id="right-s" />

        <div className={`flex items-center justify-between gap-2 p-3 ${selectedHeaderClass}`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-xs truncate font-sans tracking-tight" title={group.name}>{group.name}</span>
          </div>
          <button
            onClick={() => onToggleCollapse(group.id)}
            className="shrink-0 text-[10px] bg-white/20 hover:bg-white/30 text-white px-2.5 py-0.5 rounded-md transition-all font-semibold shadow-sm hover:shadow"
            onMouseDown={(e) => e.stopPropagation()}
          >
            Maximieren
          </button>
        </div>
        <div className="px-3 py-2 text-[10px] opacity-70 font-sans truncate" title={tablesInGroup?.join(', ') || 'Keine Tabellen'}>
          {tablesInGroup && tablesInGroup.length > 0 ? `${tablesInGroup.length} Tabellen: ${tablesInGroup.join(', ')}` : 'Keine Tabellen'}
        </div>
      </div>
    );
  }

  return (
    <div className="relative pointer-events-auto select-none" style={{ width, height }}>
      {/* Header and Comment floating above the box */}
      <div className="absolute top-0 left-0 w-full -translate-y-[calc(100%+8px)] flex flex-col gap-1.5 z-10">
        <div className="flex items-center justify-between gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-slate-400 shrink-0 cursor-grab active:cursor-grabbing">📁</span>
            <input
              className="bg-transparent font-bold text-xs outline-none w-full text-slate-800 dark:text-slate-200 border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-purple-500 font-sans tracking-tight truncate"
              value={group.name}
              onChange={(e) => onNameChange(group.id, e.target.value)}
              placeholder="Gruppenname"
              onMouseDown={(e) => e.stopPropagation()} // Prevent node drag when typing
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex gap-1 mr-2" onMouseDown={(e) => e.stopPropagation()}>
              {Object.keys(colorStyles).map((color) => (
                <button
                  key={color}
                  onClick={() => onColorChange(group.id, color)}
                  className={`w-3 h-3 rounded-full border border-black/20 ${group.color === color || (!group.color && color === 'slate') ? 'ring-2 ring-offset-1 ring-purple-500' : ''}`}
                  style={{
                    backgroundColor: color === 'purple' ? '#a855f7' : color === 'blue' ? '#3b82f6' : color === 'emerald' ? '#10b981' : color === 'rose' ? '#f43f5e' : color === 'amber' ? '#f59e0b' : '#64748b'
                  }}
                  title={color}
                />
              ))}
            </div>
            <button
              onClick={onSelectMembers}
              className="shrink-0 text-[10px] bg-slate-200/60 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded transition-all font-medium border border-slate-300/50 dark:border-slate-750"
              title="Alle Tabellen in dieser Gruppe markieren"
              onMouseDown={(e) => e.stopPropagation()}
            >
              Alle wählen
            </button>
            <button
              onClick={() => onToggleCollapse(group.id)}
              className="shrink-0 text-[10px] bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded transition-all font-semibold border border-purple-200/40"
              title="Gruppe minimieren"
              onMouseDown={(e) => e.stopPropagation()}
            >
              Minimieren
            </button>
          </div>
        </div>
        <textarea
          className="text-[11px] outline-none w-full resize-none leading-relaxed border rounded p-1.5 bg-white/90 dark:bg-slate-900/90 shadow-sm text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-purple-500 placeholder-slate-400 font-sans h-12 shrink-0"
          value={group.comment || ''}
          placeholder="Kommentar hinzufügen..."
          onChange={(e) => onCommentChange(group.id, e.target.value)}
          onMouseDown={(e) => e.stopPropagation()} // Prevent node drag when typing
        />
      </div>

      <div className={`w-full h-full border-2 border-dashed rounded-xl transition-all ${selectedUncollapsedColorClass}`} />
    </div>
  );
};

// Custom Table Node with Multiple Handles (source on right, target on left for every field)
const ERTableNodeComponent = ({ id, data, selected }: any) => {
  const { table, relationships, nodes, tableGroups, onDoubleClick } = data;
  const [activeCommentFieldId, setActiveCommentFieldId] = useState<string | null>(null);
  const { setNodes } = useReactFlow();

  // Ensure node is on top when a comment is active
  useEffect(() => {
    if (activeCommentFieldId) {
      setNodes((nds) => 
        nds.map((node) => {
          if (node.id === id) {
            return { ...node, zIndex: 1000 };
          }
          return node;
        })
      );
    } else {
      setNodes((nds) => 
        nds.map((node) => {
          if (node.id === id) {
            return { ...node, zIndex: undefined };
          }
          return node;
        })
      );
    }
  }, [activeCommentFieldId, id, setNodes]);

  // Find if this table belongs to any group
  const layoutNode = nodes?.find((n: any) => n.tableId === table.id);
  const group = tableGroups?.find((g: any) => g.id === layoutNode?.groupId);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-lg shadow-xl border-2 transition-all duration-150 ${selected || activeCommentFieldId ? 'z-50' : 'z-0'} ${selected ? 'border-purple-500 ring-4 ring-purple-500/25 scale-[1.02] shadow-2xl' : 'border-slate-300 dark:border-slate-800 hover:border-slate-400'} min-w-[240px] text-xs`}>
      {/* Node Header */}
      <div 
        className="bg-gradient-to-r from-slate-800 to-slate-950 text-white p-3 font-bold flex items-center justify-between cursor-pointer select-none rounded-t-lg"
        onDoubleClick={onDoubleClick}
        title="Doppelklick zum Bearbeiten"
      >
        <div className="flex items-center gap-2 min-w-0">
          {table.isApiImport ? (
            <Globe size={14} className="text-blue-400 shrink-0" />
          ) : (
            <Database size={14} className="text-emerald-400 shrink-0" />
          )}
          <span className="font-sans text-sm tracking-tight truncate">{table.name}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {group && (
            <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1 py-0.5 rounded font-medium max-w-[80px] truncate" title={`Gruppe: ${group.name}`}>
              📁 {group.name}
            </span>
          )}
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/50 uppercase font-mono">
            {table.isApiImport ? 'api' : 'sql'}
          </span>
        </div>
      </div>

      {/* Fields List */}
      <div className="p-1.5 space-y-1 bg-slate-50 dark:bg-slate-950 rounded-b-lg nodrag">
        {table.fields.map((field: any) => {
          const isPrimaryKey = field.isPrimaryKey;
          const isForeignKey = relationships?.some(
            (r: any) => r.toTableId === table.id && r.toFieldId === field.id
          );

          return (
            <div
              key={field.id}
              className={`relative h-8 px-2 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800 rounded border transition-all select-none group cursor-pointer nodrag ${activeCommentFieldId === field.id ? 'bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-900 ring-1 ring-purple-100 dark:ring-purple-900/30' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
              onClick={() => {
                if (field.comment) {
                  setActiveCommentFieldId(activeCommentFieldId === field.id ? null : field.id);
                }
              }}
            >
              {/* Target Handle (Incoming Foreign Key connection) */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${table.id}__${field.id}__target`}
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#3b82f6',
                  width: 8,
                  height: 8,
                  border: '2px solid white',
                }}
                className="opacity-40 group-hover:opacity-100 transition-opacity"
              />

              {/* Field Label and Key Icons */}
              <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                {isPrimaryKey && <span className="text-yellow-500 font-bold" title="Primary Key">🔑</span>}
                {isForeignKey && <span className="text-cyan-500 text-[10px] font-extrabold tracking-wider" title="Foreign Key">FK</span>}
                <span className={`truncate font-medium ${isPrimaryKey ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                  {field.name}
                </span>
              </div>

              {/* Field Type Indicator */}
              <div className="flex items-center gap-1.5 shrink-0">
                {field.comment && (
                  <Info 
                    size={10} 
                    className={`${activeCommentFieldId === field.id ? 'text-purple-500' : 'text-slate-400 opacity-0 group-hover:opacity-100'} transition-all`} 
                  />
                )}
                <div className="text-[9px] text-slate-400 font-mono uppercase bg-slate-200/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded">
                  {field.type.substring(0, 5)}
                </div>
              </div>

              {/* Comment Popover */}
              {activeCommentFieldId === field.id && field.comment && (
                <div 
                  className="absolute left-full ml-4 top-0 z-[100] w-64 bg-slate-900 text-white p-3 rounded-lg shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 slide-in-from-left-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2 mb-1.5 text-purple-400 font-bold uppercase tracking-wider text-[10px]">
                    <Info size={12} />
                    <span>Feld-Information</span>
                  </div>
                  <div className="text-[11px] leading-relaxed text-slate-200 whitespace-pre-wrap">
                    {field.comment}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800 flex justify-end">
                    <button 
                      onClick={() => setActiveCommentFieldId(null)}
                      className="text-[9px] text-slate-500 hover:text-white transition-colors"
                    >
                      Schließen
                    </button>
                  </div>
                </div>
              )}

              {/* Source Handle (Outgoing connection) */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${table.id}__${field.id}__source`}
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#10b981',
                  width: 8,
                  height: 8,
                  border: '2px solid white',
                }}
                className="opacity-40 group-hover:opacity-100 transition-opacity"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const nodeTypes = {
  erTableNode: ERTableNodeComponent,
  erGroupNode: ERGroupNodeComponent,
};

interface ERDiagramCanvasProps {
  nodes: TableNode[];
  tables: Table[];
  relationships: Relationship[];
  onMoveNode: (id: string, x: number, y: number) => void;
  onUpdateNodes?: (nodes: TableNode[]) => void;
  onConnect: (t1: string, f1: string, t2: string, f2: string) => void;
  onRelationshipContextMenu?: (event: React.MouseEvent, relId: string) => void;
  onNodeDoubleClick?: (tableId: string) => void;
  showConfirmation?: (title: string, message: string, onConfirm: () => void, confirmText?: string, confirmClass?: string) => void;
}

// Inner Component with access to useReactFlow
const ERDiagramCanvasInner: React.FC<ERDiagramCanvasProps> = ({
  nodes,
  tables,
  relationships,
  onMoveNode,
  onUpdateNodes,
  onConnect,
  onRelationshipContextMenu,
  onNodeDoubleClick,
  showConfirmation,
}) => {
  const [nodesState, setNodesState, onNodesChange] = useNodesState<Node>([]);
  const [edgesState, setEdgesState, onEdgesChange] = useEdgesState<Edge>([]);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  const tableGroups = useProjectStore((state) => state.tableGroups);
  const setTableGroups = useProjectStore((state) => state.setTableGroups);

  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const tablesLength = tables.length;
  const nodesLength = nodes?.length || 0;

  // Sync missing tables to layout nodes with non-overlapping positions
  useEffect(() => {
    if (!onUpdateNodes) return;
    
    let changed = false;
    const updatedNodes = [...(nodes || [])];

    tables.forEach((table, index) => {
      const exists = updatedNodes.some((n) => n.tableId === table.id);
      if (!exists) {
        const col = index % 4;
        const row = Math.floor(index / 4);
        const x = 50 + col * 280;
        const y = 80 + row * 320;

        updatedNodes.push({
          id: crypto.randomUUID(),
          tableId: table.id,
          x,
          y,
        });
        changed = true;
      }
    });

    if (changed) {
      onUpdateNodes(updatedNodes);
    }
  }, [tablesLength, nodesLength, onUpdateNodes]);

  const nodesPositionString = JSON.stringify((nodes || []).map((n) => ({ id: n.id, x: n.x, y: n.y, groupId: n.groupId })));

  // Sync tables and groups to React Flow nodes
  useEffect(() => {
    const collapsedGroupIds = new Set((tableGroups || []).filter(g => g.isCollapsed).map(g => g.id));

    setNodesState((prevNodes) => {
      const prevNodesMap = new Map(prevNodes.map((n) => [n.id, n]));

      // 1. Build Table Nodes (ONLY tables NOT in a collapsed group)
      const tableNodes: Node[] = tables
        .filter((table) => {
          const layoutNode = nodes.find((n) => n.tableId === table.id);
          return !layoutNode?.groupId || !collapsedGroupIds.has(layoutNode.groupId);
        })
        .map((table) => {
          const layoutNode = nodes.find((n) => n.tableId === table.id);
          const prevNode = prevNodesMap.get(table.id) as any;
          return {
            id: table.id,
            type: 'erTableNode',
            selected: prevNode ? prevNode.selected : false,
            position: {
              x: layoutNode ? layoutNode.x : Math.random() * 200 + 100,
              y: layoutNode ? layoutNode.y : Math.random() * 200 + 100,
            },
            data: {
              table,
              relationships,
              nodes,
              tableGroups,
              onDoubleClick: () => onNodeDoubleClick?.(table.id),
            },
          };
        });

      // 2. Build Group Nodes
      const activeGroups = (tableGroups || []).filter((group) => {
        return tables.some((t) => {
          const layoutNode = nodes.find((n) => n.tableId === t.id);
          return layoutNode?.groupId === group.id;
        });
      });

      const groupNodes: Node[] = activeGroups.map((group) => {
        const memberLayoutNodes = nodes.filter((n) => n.groupId === group.id);
        const tablesInGroup = tables
          .filter((t) => {
            const ln = nodes.find((n) => n.tableId === t.id);
            return ln?.groupId === group.id;
          })
          .map((t) => t.name);
        
        const minX = memberLayoutNodes.length > 0 ? Math.min(...memberLayoutNodes.map((n) => n.x)) - 20 : 100;
        const minY = memberLayoutNodes.length > 0 ? Math.min(...memberLayoutNodes.map((n) => n.y)) - 100 : 100;
        
        let width = 240;
        let height = 80;

        if (!group.isCollapsed) {
          const maxX = memberLayoutNodes.length > 0 ? Math.max(...memberLayoutNodes.map((n) => n.x + 240)) + 20 : 340;
          const maxY = memberLayoutNodes.length > 0 ? Math.max(...memberLayoutNodes.map((n) => {
            const table = tables.find((t) => t.id === n.tableId);
            const fieldCount = table?.fields.length || 0;
            const heightVal = 48 + fieldCount * 32 + 12;
            return n.y + heightVal;
          })) + 20 : 300;

          width = maxX - minX;
          height = maxY - minY;
        }

        const prevNode = prevNodesMap.get(`group__${group.id}`) as any;

        return {
          id: `group__${group.id}`,
          type: 'erGroupNode',
          selected: prevNode ? prevNode.selected : false,
          position: { x: minX, y: minY },
          style: { width, height, zIndex: group.isCollapsed ? 5 : -10 },
          draggable: true,
          selectable: true,
          data: {
            group,
            width,
            height,
            tablesInGroup,
            onNameChange: (groupId: string, newName: string) => {
              const updated = (tableGroups || []).map((g) => g.id === groupId ? { ...g, name: newName } : g);
              setTableGroups(updated);
            },
            onCommentChange: (groupId: string, newComment: string) => {
              const updated = (tableGroups || []).map((g) => g.id === groupId ? { ...g, comment: newComment } : g);
              setTableGroups(updated);
            },
            onColorChange: (groupId: string, color: string) => {
              const updated = (tableGroups || []).map((g) => g.id === groupId ? { ...g, color } : g);
              setTableGroups(updated);
            },
            onToggleCollapse: (groupId: string) => {
              const updated = (tableGroups || []).map((g) => g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g);
              setTableGroups(updated);
            },
            onSelectMembers: () => {
              const memberTableIds = tables
                .filter((t) => {
                  const ln = nodes.find((n) => n.tableId === t.id);
                  return ln?.groupId === group.id;
                })
                .map((t) => t.id);
              setNodesState((prev) =>
                prev.map((n) => ({
                  ...n,
                  selected: memberTableIds.includes(n.id),
                }))
              );
            }
          },
        };
      });

      return [...groupNodes, ...tableNodes];
    });
  }, [tables, nodesPositionString, relationships, tableGroups, setNodesState, onNodeDoubleClick, nodes, setTableGroups]);

  // Sync relationships to React Flow edge structures (handling collapsed groups)
  useEffect(() => {
    const collapsedGroupIds = new Set((tableGroups || []).filter(g => g.isCollapsed).map(g => g.id));
    
    // Map of tableId -> groupId (only for collapsed groups)
    const tableToCollapsedGroup = new Map<string, string>();
    tables.forEach(t => {
      const layoutNode = nodes.find(n => n.tableId === t.id);
      if (layoutNode?.groupId && collapsedGroupIds.has(layoutNode.groupId)) {
        tableToCollapsedGroup.set(t.id, layoutNode.groupId);
      }
    });

    const rfEdges: Edge[] = relationships
      .map((rel) => {
        const fromCollapsedGroupId = tableToCollapsedGroup.get(rel.fromTableId);
        const toCollapsedGroupId = tableToCollapsedGroup.get(rel.toTableId);

        // If both in SAME collapsed group, keep them hidden for now as it would just be a loop
        if (fromCollapsedGroupId && toCollapsedGroupId && fromCollapsedGroupId === toCollapsedGroupId) {
          return null;
        }

        const sourceNodeId = fromCollapsedGroupId ? `group__${fromCollapsedGroupId}` : rel.fromTableId;
        const targetNodeId = toCollapsedGroupId ? `group__${toCollapsedGroupId}` : rel.toTableId;

        // Try to get dynamic handles based on layout coordinates
        const sourceLayoutNode = nodes.find(n => (fromCollapsedGroupId ? n.id === sourceNodeId : n.tableId === sourceNodeId));
        const targetLayoutNode = nodes.find(n => (toCollapsedGroupId ? n.id === targetNodeId : n.tableId === targetNodeId));
        
        let dynamicSourceHandle = 'right-s';
        let dynamicTargetHandle = 'left';
        
        if (sourceLayoutNode && targetLayoutNode) {
          const dx = targetLayoutNode.x - sourceLayoutNode.x;
          const dy = targetLayoutNode.y - sourceLayoutNode.y;
          
          if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal connection
            if (dx > 0) {
              dynamicSourceHandle = 'right-s';
              dynamicTargetHandle = 'left';
            } else {
              dynamicSourceHandle = 'left-s';
              dynamicTargetHandle = 'right';
            }
          } else {
            // Vertical connection
            if (dy > 0) {
              dynamicSourceHandle = 'bottom-s';
              dynamicTargetHandle = 'top';
            } else {
              dynamicSourceHandle = 'top-s';
              dynamicTargetHandle = 'bottom';
            }
          }
        }

        const sourceHandle = fromCollapsedGroupId 
          ? dynamicSourceHandle
          : `${rel.fromTableId}__${rel.fromFieldId}__source`;
          
        const targetHandle = toCollapsedGroupId 
          ? dynamicTargetHandle
          : `${rel.toTableId}__${rel.toFieldId}__target`;

        return {
          id: rel.id,
          source: sourceNodeId,
          target: targetNodeId,
          sourceHandle,
          targetHandle,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: '#64748b',
          },
          style: {
            stroke: '#64748b',
            strokeWidth: 2,
          },
          label: rel.type === '1:1' ? '1 - 1' : '1 - 1:N',
          labelStyle: { fill: '#475569', fontWeight: 700, fontSize: 10 },
          labelBgPadding: [4, 2],
          labelBgBorderRadius: 4,
          labelBgStyle: { fill: '#f1f5f9', color: '#475569', fillOpacity: 0.9 },
        };
      })
      .filter(e => e !== null) as Edge[];

    setEdgesState(rfEdges);
  }, [relationships, setEdgesState, tableGroups, tables, nodes]);

  const dragStartPositions = React.useRef<Record<string, { x: number; y: number }>>({});
  
  const onNodeDragStart = useCallback((_event: any, node: any, nodes: any[]) => {
    nodes.forEach(n => {
      dragStartPositions.current[n.id] = { ...n.position };
    });
  }, []);

  const onNodeDrag = useCallback((_event: any, node: any, draggedNodes: any[]) => {
    if (!onUpdateNodes) return;
    
    // Live update the tables during group drag for visual feedback
    const draggedGroups = draggedNodes.filter(n => n.id.startsWith('group__'));
    if (draggedGroups.length === 0) return;
    
    setNodesState((prevNodes) => {
      let nextNodes = [...prevNodes];
      let changed = false;

      draggedGroups.forEach(groupNode => {
        const groupId = groupNode.id.replace('group__', '');
        const startPos = dragStartPositions.current[groupNode.id];
        if (startPos) {
          const dx = groupNode.position.x - startPos.x;
          const dy = groupNode.position.y - startPos.y;
          
          // Find member tables from the global `nodes` store
          const memberIds = nodes.filter(n => n.groupId === groupId).map(n => n.tableId);
          
          nextNodes = nextNodes.map(pn => {
            if (memberIds.includes(pn.id)) {
              const startChildPos = dragStartPositions.current[pn.id];
              if (startChildPos) {
                changed = true;
                return { ...pn, position: { x: startChildPos.x + dx, y: startChildPos.y + dy } };
              }
            }
            return pn;
          });
        }
      });
      return changed ? nextNodes : prevNodes;
    });
  }, [onUpdateNodes, setNodesState, nodes]);

  // Node move or drag ends -> persist coordinates in parent store
  const onNodeDragStop = useCallback(
    (_event: any, node: any, draggedNodes: any[]) => {
      const nodesToUpdate = Array.isArray(draggedNodes) && draggedNodes.length > 0 ? draggedNodes : [node];
      
      if (onUpdateNodes) {
        let updated = [...nodes];
        let potentialGroupId: string | null = null;
        let tableToGroup: string | null = null;

        // Check for drop on group (only if single table node is dragged)
        if (nodesToUpdate.length === 1 && !nodesToUpdate[0].id.startsWith('group__')) {
          const tableNodeId = nodesToUpdate[0].id;
          const tablePos = nodesToUpdate[0].position;
          
          // Find if dropped on a group node
          const groupNode = nodesState.find(n => 
            n.type === 'erGroupNode' && 
            tablePos.x >= n.position.x && 
            tablePos.x <= n.position.x + (n.style?.width as number || 240) &&
            tablePos.y >= n.position.y && 
            tablePos.y <= n.position.y + (n.style?.height as number || 80)
          );

          if (groupNode) {
            const groupId = groupNode.id.replace('group__', '');
            const currentTableNode = nodes.find(n => n.tableId === tableNodeId);
            if (currentTableNode && currentTableNode.groupId !== groupId) {
              potentialGroupId = groupId;
              tableToGroup = tableNodeId;
            }
          }
        }
        
        const performUpdate = (finalNodes: TableNode[]) => {
          onUpdateNodes(finalNodes);
        };

        const baseUpdated = [...updated];
        nodesToUpdate.forEach((dn) => {
          if (dn.id.startsWith('group__')) {
            const groupId = dn.id.replace('group__', '');
            const startPos = dragStartPositions.current[dn.id];
            if (startPos) {
              const dx = dn.position.x - startPos.x;
              const dy = dn.position.y - startPos.y;
              
              baseUpdated.forEach((n, idx) => {
                if (n.groupId === groupId) {
                  baseUpdated[idx] = { ...n, x: Math.round((n.x + dx) / 20) * 20, y: Math.round((n.y + dy) / 20) * 20 };
                }
              });
            }
          } else {
            const idx = baseUpdated.findIndex(n => n.tableId === dn.id);
            if (idx !== -1) {
              baseUpdated[idx] = { ...baseUpdated[idx], x: Math.round(dn.position.x / 20) * 20, y: Math.round(dn.position.y / 20) * 20 };
            }
          }
        });

        if (potentialGroupId && tableToGroup) {
          const targetGroup = tableGroups?.find(g => g.id === potentialGroupId);
          const targetTable = tables.find(t => t.id === tableToGroup);
          
          const applyGroupChange = () => {
            const finalUpdated = baseUpdated.map(n => 
              n.tableId === tableToGroup ? { ...n, groupId: potentialGroupId! } : n
            );
            performUpdate(finalUpdated);
          };

          if (showConfirmation && targetGroup && targetTable) {
            showConfirmation(
              'Tabelle zur Gruppe hinzufügen?',
              `Möchten Sie die Tabelle "${targetTable.name}" zur Gruppe "${targetGroup.name}" hinzufügen?`,
              applyGroupChange,
              'Hinzufügen',
              'bg-emerald-600 hover:bg-emerald-700 text-white'
            );
            // We still want to update positions even if they cancel or before they confirm?
            // Actually, if we wait for confirmation, the position might jump back if we don't update it now.
            // But if we update position now, and then they confirm, we update groupId later.
            performUpdate(baseUpdated);
          } else {
            applyGroupChange();
          }
        } else {
          performUpdate(baseUpdated);
        }
      } else {
        nodesToUpdate.forEach((dn) => {
          const layoutNode = nodes.find((n) => n.tableId === dn.id);
          if (layoutNode && !dn.id.startsWith('group__')) {
            onMoveNode(layoutNode.id, dn.position.x, dn.position.y);
          }
        });
      }
      dragStartPositions.current = {};
    },
    [nodes, onMoveNode, onUpdateNodes, nodesState, tableGroups, tables, showConfirmation]
  );

  // Handle new link drag & connect triggers
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (
        !connection.source ||
        !connection.target ||
        !connection.sourceHandle ||
        !connection.targetHandle
      )
        return;

      const sourceFieldId = connection.sourceHandle.split('__')[1];
      const targetFieldId = connection.targetHandle.split('__')[1];

      onConnect(connection.source, sourceFieldId, connection.target, targetFieldId);
    },
    [onConnect]
  );

  // Trigger ContextMenu for Relationships (Edges)
  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (onRelationshipContextMenu) {
        onRelationshipContextMenu(event, edge.id);
      }
    },
    [onRelationshipContextMenu]
  );

  // Force-directed Physics Layout
  const triggerPhysicsLayout = () => {
    if (!onUpdateNodes) return;

    // Determine target tables
    const selectedGroupNodes = nodesState.filter(n => n.selected && n.id.startsWith('group__'));
    const selectedGroupIds = selectedGroupNodes.map(n => n.id.replace('group__', ''));
    
    let targetTableIds: string[] = [];
    if (selectedGroupIds.length > 0) {
      targetTableIds = nodes
        .filter(n => n.groupId && selectedGroupIds.includes(n.groupId))
        .map(n => n.tableId);
    } else if (selectedTableIds.length > 0) {
      targetTableIds = selectedTableIds;
    }

    const tablesToLayout = targetTableIds.length > 0 
      ? nodes.filter(n => targetTableIds.includes(n.tableId))
      : nodes;

    if (tablesToLayout.length === 0) return;

    // Use current bounding box as reference
    const startX = Math.min(...tablesToLayout.map(n => n.x));
    const startY = Math.min(...tablesToLayout.map(n => n.y));

    const simNodes = tablesToLayout.map((n) => ({ ...n, vx: 0, vy: 0 }));
    const iterations = 150;
    const repulsion = 800000;
    const attraction = 0.05;
    const damping = 0.7;
    const optimalDist = 320;

    for (let i = 0; i < iterations; i++) {
      for (let j = 0; j < simNodes.length; j++) {
        for (let k = j + 1; k < simNodes.length; k++) {
          const dx = simNodes[j].x - simNodes[k].x;
          const dy = simNodes[j].y - simNodes[k].y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);
          const force = repulsion / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          simNodes[j].vx += fx;
          simNodes[j].vy += fy;
          simNodes[k].vx -= fx;
          simNodes[k].vy -= fy;
        }
      }

      relationships.forEach((rel) => {
        const sourceNode = simNodes.find((n) => n.tableId === rel.fromTableId);
        const targetNode = simNodes.find((n) => n.tableId === rel.toTableId);
        if (sourceNode && targetNode && sourceNode !== targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy || 1);
          const force = (dist - optimalDist) * attraction;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          sourceNode.vx += fx;
          sourceNode.vy += fy;
          targetNode.vx -= fx;
          targetNode.vy -= fy;
        }
      });

      simNodes.forEach((n) => {
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
      });
    }

    const simMinX = Math.min(...simNodes.map((n) => n.x));
    const simMinY = Math.min(...simNodes.map((n) => n.y));

    const updatedNodes = nodes.map((n) => {
      const simNode = simNodes.find((sn) => sn.tableId === n.tableId);
      if (simNode) {
        return {
          ...n,
          x: Math.round((simNode.x - simMinX + startX) / 20) * 20,
          y: Math.round((simNode.y - simMinY + startY) / 20) * 20,
        };
      }
      return n;
    });

    onUpdateNodes(updatedNodes);
  };

  // Align nodes into a clean grid
  const triggerGridLayout = () => {
    if (!onUpdateNodes) return;

    // Determine target tables
    const selectedGroupNodes = nodesState.filter(n => n.selected && n.id.startsWith('group__'));
    const selectedGroupIds = selectedGroupNodes.map(n => n.id.replace('group__', ''));
    
    let targetTableIds: string[] = [];
    if (selectedGroupIds.length > 0) {
      targetTableIds = nodes
        .filter(n => n.groupId && selectedGroupIds.includes(n.groupId))
        .map(n => n.tableId);
    } else if (selectedTableIds.length > 0) {
      targetTableIds = selectedTableIds;
    }

    const tablesToLayout = targetTableIds.length > 0 
      ? nodes.filter(n => targetTableIds.includes(n.tableId))
      : nodes;

    if (tablesToLayout.length === 0) return;

    // Use current bounding box as reference
    const startX = Math.min(...tablesToLayout.map(n => n.x));
    const startY = Math.min(...tablesToLayout.map(n => n.y));

    // Group tables by groupId
    const groupedTables: { [groupId: string]: any[] } = {};
    const unGroupedTables: any[] = [];

    tablesToLayout.forEach(n => {
      if (n.groupId) {
        if (!groupedTables[n.groupId]) groupedTables[n.groupId] = [];
        groupedTables[n.groupId].push(n);
      } else {
        unGroupedTables.push(n);
      }
    });

    const spacingX = 300;
    const spacingY = 240;
    const groupPaddingX = 100;
    const groupPaddingY = 100;

    let currentGroupStartX = startX;
    let currentGroupStartY = startY;
    let maxGroupHeightInRow = 0;
    const maxWidth = 1400; // threshold to wrap to next row of groups

    const updatedNodes = [...nodes];

    // Helper to layout a set of tables
    const layoutTableSet = (tableSet: any[], groupId: string | null) => {
      if (tableSet.length === 0) return;
      const cols = Math.ceil(Math.sqrt(tableSet.length));
      
      let maxW = 0;
      let maxH = 0;

      tableSet.forEach((n, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);

        const newX = currentGroupStartX + col * spacingX;
        const newY = currentGroupStartY + row * spacingY + (groupId ? 80 : 0); // 80px space for group header

        const originalNodeIdx = updatedNodes.findIndex(un => un.tableId === n.tableId);
        if (originalNodeIdx !== -1) {
          updatedNodes[originalNodeIdx] = { 
            ...updatedNodes[originalNodeIdx], 
            x: Math.round(newX / 20) * 20, 
            y: Math.round(newY / 20) * 20 
          };
        }

        maxW = Math.max(maxW, col * spacingX + 240); // 240 approx table width
        maxH = Math.max(maxH, row * spacingY + 300 + (groupId ? 80 : 0)); // 300 approx max table height
      });

      currentGroupStartX += maxW + groupPaddingX;
      maxGroupHeightInRow = Math.max(maxGroupHeightInRow, maxH);

      // Wrap logic for groups
      if (currentGroupStartX - startX > maxWidth) {
        currentGroupStartX = startX;
        currentGroupStartY += maxGroupHeightInRow + groupPaddingY;
        maxGroupHeightInRow = 0;
      }
    };

    // 1. Layout each group
    Object.entries(groupedTables).forEach(([groupId, tableSet]) => {
      layoutTableSet(tableSet, groupId);
    });

    // 2. Layout ungrouped tables below everything
    if (unGroupedTables.length > 0) {
      if (currentGroupStartX !== startX && maxGroupHeightInRow > 0) {
        currentGroupStartX = startX;
        currentGroupStartY += maxGroupHeightInRow + groupPaddingY;
      }
      layoutTableSet(unGroupedTables, null);
    }

    onUpdateNodes(updatedNodes);
  };

  // Align selected nodes to grid multiples of 20
  const handleAlignAllToGrid = () => {
    if (!onUpdateNodes) return;
    const updatedNodes = nodes.map((n) => ({
      ...n,
      x: Math.round(n.x / 20) * 20,
      y: Math.round(n.y / 20) * 20,
    }));
    onUpdateNodes(updatedNodes);
  };

  // Selection actions
  const selectedRFNodes = nodesState.filter((n) => n.selected && !n.id.startsWith('group__'));
  const selectedTableIds = selectedRFNodes.map((n) => n.id);

  // Group Selected Nodes
  const handleGroupSelected = () => {
    if (!onUpdateNodes || selectedTableIds.length === 0) return;
    const groupId = crypto.randomUUID();
    const newGroups = [...(tableGroups || []), { id: groupId, name: 'Neue Gruppe', comment: '' }];
    setTableGroups(newGroups);

    const updatedNodes = nodes.map((n) => {
      if (selectedTableIds.includes(n.tableId)) {
        return { ...n, groupId };
      }
      return n;
    });
    onUpdateNodes(updatedNodes);
  };

  // Ungroup Selected Nodes
  const handleUngroupSelected = () => {
    if (!onUpdateNodes || selectedTableIds.length === 0) return;

    const updatedNodes = nodes.map((n) => {
      if (selectedTableIds.includes(n.tableId)) {
        return { ...n, groupId: undefined };
      }
      return n;
    });
    onUpdateNodes(updatedNodes);

    // Clean up empty groups
    setTimeout(() => {
      const remainingGroupIds = new Set(updatedNodes.map((n) => n.groupId).filter(Boolean));
      const newGroups = (tableGroups || []).filter((g) => remainingGroupIds.has(g.id));
      setTableGroups(newGroups);
    }, 100);
  };

  // Align selected nodes - Top
  const handleAlignTop = () => {
    if (!onUpdateNodes || selectedTableIds.length === 0) return;
    const selectedLayoutNodes = nodes.filter((n) => selectedTableIds.includes(n.tableId));
    if (selectedLayoutNodes.length === 0) return;

    const minY = Math.min(...selectedLayoutNodes.map((n) => n.y));

    const updatedNodes = nodes.map((n) => {
      if (selectedTableIds.includes(n.tableId)) {
        return { ...n, y: minY };
      }
      return n;
    });
    onUpdateNodes(updatedNodes);
  };

  // Align selected nodes - Bottom
  const handleAlignBottom = () => {
    if (!onUpdateNodes || selectedTableIds.length === 0) return;
    const selectedLayoutNodes = nodes.filter((n) => selectedTableIds.includes(n.tableId));
    if (selectedLayoutNodes.length === 0) return;

    const maxY = Math.max(...selectedLayoutNodes.map((n) => n.y));

    const updatedNodes = nodes.map((n) => {
      if (selectedTableIds.includes(n.tableId)) {
        return { ...n, y: maxY };
      }
      return n;
    });
    onUpdateNodes(updatedNodes);
  };

  // Align selected nodes - Left
  const handleAlignLeft = () => {
    if (!onUpdateNodes || selectedTableIds.length === 0) return;
    const selectedLayoutNodes = nodes.filter((n) => selectedTableIds.includes(n.tableId));
    if (selectedLayoutNodes.length === 0) return;

    const minX = Math.min(...selectedLayoutNodes.map((n) => n.x));

    const updatedNodes = nodes.map((n) => {
      if (selectedTableIds.includes(n.tableId)) {
        return { ...n, x: minX };
      }
      return n;
    });
    onUpdateNodes(updatedNodes);
  };

  // Align selected nodes - Right
  const handleAlignRight = () => {
    if (!onUpdateNodes || selectedTableIds.length === 0) return;
    const selectedLayoutNodes = nodes.filter((n) => selectedTableIds.includes(n.tableId));
    if (selectedLayoutNodes.length === 0) return;

    const maxX = Math.max(...selectedLayoutNodes.map((n) => n.x));

    const updatedNodes = nodes.map((n) => {
      if (selectedTableIds.includes(n.tableId)) {
        return { ...n, x: maxX };
      }
      return n;
    });
    onUpdateNodes(updatedNodes);
  };

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onConnect={handleConnect}
        onEdgeContextMenu={onEdgeContextMenu}
        snapToGrid={snapToGrid}
        snapGrid={[20, 20]}
        fitView
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Shift"
      >
        <Background gap={20} size={1.2} color="#cbd5e1" />
        
        {/* Render the MiniMap raised cleanly above the status bar */}
        <MiniMap 
          zoomable 
          pannable 
          position="bottom-right" 
          style={{ bottom: 80, right: 16, height: 120, width: 180, margin: 12 }}
          nodeColor={(n: any) => {
            if (n.type === 'erGroupNode') {
              const groupColor = n.data?.group?.color || 'slate';
              const isCollapsed = n.data?.group?.isCollapsed;
              
              if (isCollapsed) {
                const solidColors: any = {
                  purple: '#a855f7',
                  blue: '#3b82f6',
                  emerald: '#10b981',
                  rose: '#f43f5e',
                  amber: '#f59e0b',
                  slate: '#64748b'
                };
                return solidColors[groupColor] || solidColors.slate;
              }

              const colors: any = {
                purple: '#f5f3ff',
                blue: '#eff6ff',
                emerald: '#ecfdf5',
                rose: '#fff1f2',
                amber: '#fffbeb',
                slate: '#f8fafc'
              };
              return colors[groupColor] || colors.slate;
            }
            if (n.type === 'erTableNode') {
              const table = n.data?.table;
              const layoutNode = nodes.find(ln => ln.tableId === table?.id);
              if (layoutNode?.groupId) {
                const group = tableGroups.find(g => g.id === layoutNode.groupId);
                const groupColor = group?.color || 'slate';
                const colors: any = {
                  purple: '#a855f7',
                  blue: '#3b82f6',
                  emerald: '#10b981',
                  rose: '#f43f5e',
                  amber: '#f59e0b',
                  slate: '#64748b'
                };
                return colors[groupColor] || colors.slate;
              }
            }
            return '#cbd5e1';
          }}
          nodeStrokeColor={(n: any) => {
            const tableId = n.data?.table?.id;
            const groupColor = n.data?.group?.color || (n.type === 'erTableNode' ? (tableGroups.find(g => g.id === nodes.find(ln => ln.tableId === tableId)?.groupId)?.color) : null) || 'slate';
            const colors: any = {
              purple: '#a855f7',
              blue: '#3b82f6',
              emerald: '#10b981',
              rose: '#f43f5e',
              amber: '#f59e0b',
              slate: '#64748b'
            };
            return colors[groupColor] || colors.slate;
          }}
          nodeStrokeWidth={3}
          maskColor="rgba(241, 245, 249, 0.7)"
        />

        {/* Multi-Selection Contextual Toolbar */}
        {selectedTableIds.length > 1 && (
          <Panel 
            position="top-center" 
            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-300 dark:border-slate-800 p-1 rounded-lg shadow-2xl flex items-center gap-1 z-50 select-none transition-all"
          >
            <button 
              onClick={handleGroupSelected}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors"
              title="Ausgewählte Tabellen in einer neuen Gruppe organisieren"
            >
              <Group size={14} className="text-purple-600 dark:text-purple-400" />
              <span>Gruppieren</span>
            </button>
            
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
            
            <button 
              onClick={handleUngroupSelected}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors"
              title="Gruppe aufheben"
            >
              <Group size={14} className="text-slate-400 opacity-60" />
              <span>Aufheben</span>
            </button>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

            <button 
              onClick={handleAlignTop}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors"
              title="An der höchsten Tabelle ausrichten"
            >
              <AlignLeft size={14} className="text-blue-500 rotate-90" />
              <span>Oben</span>
            </button>
            
            <button 
              onClick={handleAlignBottom}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors"
              title="An der tiefsten Tabelle ausrichten"
            >
              <AlignLeft size={14} className="text-blue-500 -rotate-90" />
              <span>Unten</span>
            </button>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

            <button 
              onClick={handleAlignLeft}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors"
              title="Am weitesten links ausrichten"
            >
              <AlignLeft size={14} className="text-emerald-500" />
              <span>Links</span>
            </button>

            <button 
              onClick={handleAlignRight}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors"
              title="Am weitesten rechts ausrichten"
            >
              <AlignLeft size={14} className="text-emerald-500 scale-x-[-1]" />
              <span>Rechts</span>
            </button>
          </Panel>
        )}

        {/* Bottom Floating Control Panel - Restoring zoom, panning & layout tools */}
        <Panel 
          position="bottom-left" 
          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-300 dark:border-slate-800 p-1 flex items-center gap-1 z-40 select-none shadow-xl rounded-lg transition-all"
        >
          {/* Zoom Tools */}
          <button 
            onClick={() => zoomIn()}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors"
            title="Zoom vergrößern"
          >
            <ZoomIn size={15} />
          </button>
          <button 
            onClick={() => zoomOut()}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors"
            title="Zoom verkleinern"
          >
            <ZoomOut size={15} />
          </button>
          <button 
            onClick={() => fitView()}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 text-[11px] font-semibold pr-2"
            title="Sichtfeld zurücksetzen / Zentrieren"
          >
            <Maximize size={15} />
            <span className="hidden sm:inline">Anpassen</span>
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Layout & Grid Tools */}
          <button 
            onClick={triggerPhysicsLayout}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 text-[11px] font-semibold"
            title="Smart Auto-Layout (Physik-basiert)"
          >
            <Zap size={15} className="text-amber-500" />
            <span className="hidden sm:inline">Smart Layout</span>
          </button>
          <button 
            onClick={triggerGridLayout}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 text-[11px] font-semibold"
            title="Tabellen automatisch im Gitter anordnen"
          >
            <Grid3X3 size={15} className="text-slate-400" />
            <span className="hidden sm:inline">Gitter</span>
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Snapping toggles */}
          <button 
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-1.5 rounded transition-colors flex items-center gap-1 text-[11px] font-semibold ${
              snapToGrid 
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Magnetisches Raster ein-/ausschalten"
          >
            <Grid size={15} />
            <span className="hidden sm:inline">Raster</span>
          </button>
          <button 
            onClick={handleAlignAllToGrid}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors"
            title="Alle Tabellen exakt am 20px-Raster ausrichten"
          >
            <Magnet size={15} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export const ERDiagramCanvas: React.FC<ERDiagramCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ERDiagramCanvasInner {...props} />
    </ReactFlowProvider>
  );
};
