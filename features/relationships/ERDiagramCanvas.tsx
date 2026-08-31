import React, { useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType,
  Position,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Table, TableNode, Relationship, TableGroup } from '../../types/index';
import { 
  Group, 
  AlignLeft, 
} from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useERDiagramStore } from './stores/useERDiagramStore';

// Imported modular components
import { ERGroupNodeComponent } from './components/ERGroupNodeComponent';
import { ERTableNodeComponent } from './components/ERTableNodeComponent';
import { ERCustomEdge } from './components/ERCustomEdge';
import { SchemaLinterPanel } from './components/SchemaLinterPanel';
import { DbmlSplitEditor } from './components/DbmlSplitEditor';
import { SqlReverseEngineerModal } from './components/SqlReverseEngineerModal';
import { SchemaDiffModal } from './components/SchemaDiffModal';
import { MockDataGeneratorModal } from './components/MockDataGeneratorModal';
import { DataDictionaryModal } from './components/DataDictionaryModal';
import { IndexConstraintDesignerModal } from './components/IndexConstraintDesignerModal';
import { GlobalEnumManagerModal } from './components/GlobalEnumManagerModal';

// Services
import { AutoLayoutEngine } from './services/autoLayoutEngine';
import { SchemaLinterService } from './services/schemaLinter';
import { LayoutDirection, EnumDefinition, CustomTypeDefinition } from './types/erDesignerTypes';

const nodeTypes = {
  erTableNode: ERTableNodeComponent,
  erGroupNode: ERGroupNodeComponent,
};

const edgeTypes = {
  erCustomEdge: ERCustomEdge,
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

  // ER Diagram Zustand Store (synced with Ribbon)
  const {
    notationStyle,
    snapToGrid,
    showMinimap,
    isLinterOpen,
    setIsLinterOpen,
    isDbmlOpen,
    setIsDbmlOpen,
    isSqlReverseModalOpen,
    setIsSqlReverseModalOpen,
    isSchemaDiffModalOpen,
    setIsSchemaDiffModalOpen,
    isMockDataModalOpen,
    setIsMockDataModalOpen,
    isDataDictionaryModalOpen,
    setIsDataDictionaryModalOpen,
    isEnumManagerModalOpen,
    setIsEnumManagerModalOpen,
    selectedTableForConstraints,
    setSelectedTableForConstraints,
    setLinterReport,
    actionTrigger
  } = useERDiagramStore();

  // Global Project Store Hooks
  const tableGroups = useProjectStore((state) => state.tableGroups) || [];
  const setTableGroups = useProjectStore((state) => state.setTableGroups);
  const setTables = useProjectStore((state) => state.setTables);
  const setRelationships = useProjectStore((state) => state.setRelationships);
  const enums = (useProjectStore((state: any) => state.enums) as EnumDefinition[]) || [];
  const customTypes = (useProjectStore((state: any) => state.customTypes) as CustomTypeDefinition[]) || [];

  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const tablesLength = tables.length;
  const nodesLength = nodes?.length || 0;

  // Linter Score for Ribbon Badge
  const linterReport = useMemo(() => {
    return SchemaLinterService.analyzeSchema(tables, relationships);
  }, [tables, relationships]);

  // Sync health metrics to store
  useEffect(() => {
    setLinterReport(linterReport.score, linterReport.issues.length);
  }, [linterReport, setLinterReport]);

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
        const x = 50 + col * 300;
        const y = 80 + row * 340;

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
  }, [tablesLength, nodesLength, onUpdateNodes, tables, nodes]);

  const nodesPositionString = JSON.stringify((nodes || []).map((n) => ({ id: n.id, x: n.x, y: n.y, groupId: n.groupId })));

  // Sync tables and groups to React Flow nodes
  useEffect(() => {
    const collapsedGroupIds = new Set((tableGroups || []).filter(g => g.isCollapsed).map(g => g.id));

    setNodesState((prevNodes) => {
      const prevNodesMap = new Map(prevNodes.map((n) => [n.id, n]));

      // 1. Build Table Nodes
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
              onOpenConstraints: (tbl: Table) => setSelectedTableForConstraints(tbl),
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
          const maxX = memberLayoutNodes.length > 0 ? Math.max(...memberLayoutNodes.map((n) => n.x + 260)) + 20 : 340;
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

  // Sync relationships to custom React Flow edges with notation style & fast triggers
  useEffect(() => {
    const collapsedGroupIds = new Set((tableGroups || []).filter(g => g.isCollapsed).map(g => g.id));
    
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

        if (fromCollapsedGroupId && toCollapsedGroupId && fromCollapsedGroupId === toCollapsedGroupId) {
          return null;
        }

        const sourceNodeId = fromCollapsedGroupId ? `group__${fromCollapsedGroupId}` : rel.fromTableId;
        const targetNodeId = toCollapsedGroupId ? `group__${toCollapsedGroupId}` : rel.toTableId;

        const sourceHandle = fromCollapsedGroupId 
          ? 'right-s'
          : `${rel.fromTableId}__${rel.fromFieldId}__source`;
          
        const targetHandle = toCollapsedGroupId 
          ? 'left'
          : `${rel.toTableId}__${rel.toFieldId}__target`;

        const fromTable = tables.find(t => t.id === rel.fromTableId);
        const toTable = tables.find(t => t.id === rel.toTableId);

        return {
          id: rel.id,
          source: sourceNodeId,
          target: targetNodeId,
          sourceHandle,
          targetHandle,
          type: 'erCustomEdge',
          data: {
            relationship: rel,
            notationStyle,
            sourceTable: fromTable?.name,
            targetTable: toTable?.name,
            onEdit: (r: Relationship) => {
              // Trigger context menu or relationship edit
              onRelationshipContextMenu?.({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, preventDefault: () => {} } as any, r.id);
            },
            onDelete: (relId: string) => {
              if (showConfirmation) {
                showConfirmation(
                  'Beziehung löschen?',
                  'Möchten Sie diese Verknüpfung wirklich entfernen?',
                  () => {
                    const nextRels = relationships.filter(r => r.id !== relId);
                    setRelationships(nextRels);
                  },
                  'Löschen',
                  'bg-red-600 hover:bg-red-700 text-white'
                );
              } else {
                setRelationships(relationships.filter(r => r.id !== relId));
              }
            }
          },
        };
      })
      .filter(e => e !== null) as Edge[];

    setEdgesState(rfEdges);
  }, [relationships, setEdgesState, tableGroups, tables, nodes, notationStyle, onRelationshipContextMenu, showConfirmation, setRelationships]);

  const dragStartPositions = React.useRef<Record<string, { x: number; y: number }>>({});
  
  const onNodeDragStart = useCallback((_event: any, _node: any, draggedNodes: any[]) => {
    draggedNodes.forEach(n => {
      dragStartPositions.current[n.id] = { ...n.position };
    });
  }, []);

  const onNodeDrag = useCallback((_event: any, _node: any, draggedNodes: any[]) => {
    if (!onUpdateNodes) return;
    
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

        if (nodesToUpdate.length === 1 && !nodesToUpdate[0].id.startsWith('group__')) {
          const tableNodeId = nodesToUpdate[0].id;
          const tablePos = nodesToUpdate[0].position;
          
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
          } else {
            applyGroupChange();
          }
        } else {
          performUpdate(baseUpdated);
        }
      }
    },
    [nodes, onUpdateNodes, tableGroups, tables, nodesState, showConfirmation]
  );

  const handleConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target && params.sourceHandle && params.targetHandle) {
        const [, f1] = params.sourceHandle.split('__');
        const [, f2] = params.targetHandle.split('__');
        onConnect(params.source, f1, params.target, f2);
      }
    },
    [onConnect]
  );

  const onEdgeContextMenu = (event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    if (onRelationshipContextMenu) {
      onRelationshipContextMenu(event, edge.id);
    }
  };

  // 1. Hierarchical DAG Auto-Layout Action (Top-Down / Left-Right)
  const handleHierarchicalAutoLayout = (direction: LayoutDirection) => {
    if (!onUpdateNodes) return;
    const layoutResult = AutoLayoutEngine.calculateAutoLayout(tables, relationships, nodes, {
      direction,
      rankSep: 140,
      nodeSep: 80,
    });

    onUpdateNodes(layoutResult.nodes);
    setTimeout(() => {
      fitView({ duration: 400, padding: 0.15 });
    }, 50);
  };

  // 2. Physics-based Layout Action
  const triggerPhysicsLayout = () => {
    if (!onUpdateNodes || tables.length === 0) return;

    const iterations = 80;
    const repulsion = 45000;
    const attraction = 0.05;
    const optimalDist = 280;
    const damping = 0.88;

    const startX = Math.min(...nodes.map((n) => n.x));
    const startY = Math.min(...nodes.map((n) => n.y));

    const simNodes = nodes.map((n) => ({
      tableId: n.tableId,
      x: n.x,
      y: n.y,
      vx: 0,
      vy: 0,
    }));

    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < simNodes.length; i++) {
        for (let j = i + 1; j < simNodes.length; j++) {
          const n1 = simNodes[i];
          const n2 = simNodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy || 1);
          if (dist < 800) {
            const force = repulsion / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            n1.vx -= fx;
            n1.vy -= fy;
            n2.vx += fx;
            n2.vy += fy;
          }
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
    setTimeout(() => {
      fitView({ duration: 400, padding: 0.15 });
    }, 50);
  };

  // 3. Grid Layout
  const triggerGridLayout = () => {
    if (!onUpdateNodes) return;
    const spacingX = 320;
    const spacingY = 340;
    const cols = Math.ceil(Math.sqrt(tables.length));

    const updatedNodes = nodes.map((n, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      return {
        ...n,
        x: 60 + col * spacingX,
        y: 80 + row * spacingY,
      };
    });

    onUpdateNodes(updatedNodes);
    setTimeout(() => {
      fitView({ duration: 400, padding: 0.15 });
    }, 50);
  };

  // Listen to Ribbon actions via useERDiagramStore.actionTrigger
  useEffect(() => {
    if (!actionTrigger) return;
    const { action } = actionTrigger;

    if (action === 'auto_layout_tb') {
      handleHierarchicalAutoLayout('TB');
    } else if (action === 'auto_layout_lr') {
      handleHierarchicalAutoLayout('LR');
    } else if (action === 'layout_physics') {
      triggerPhysicsLayout();
    } else if (action === 'layout_grid') {
      triggerGridLayout();
    } else if (action === 'fit_view') {
      fitView({ duration: 300, padding: 0.15 });
    } else if (action === 'zoom_in') {
      zoomIn();
    } else if (action === 'zoom_out') {
      zoomOut();
    }
  }, [actionTrigger, fitView, zoomIn, zoomOut]);

  // Multi-selection alignment & grouping
  const selectedTableIds = nodesState
    .filter((n) => n.selected && n.type === 'erTableNode')
    .map((n) => n.id);

  const handleGroupSelected = () => {
    if (!onUpdateNodes || selectedTableIds.length === 0) return;
    const groupId = crypto.randomUUID();
    const newGroups = [...(tableGroups || []), { id: groupId, name: 'Neue Domäne', comment: '', color: '#3b82f6' }];
    setTableGroups(newGroups);

    const updatedNodes = nodes.map((n) => {
      if (selectedTableIds.includes(n.tableId)) {
        return { ...n, groupId };
      }
      return n;
    });
    onUpdateNodes(updatedNodes);
  };

  const handleUngroupSelected = () => {
    if (!onUpdateNodes || selectedTableIds.length === 0) return;
    const updatedNodes = nodes.map((n) => {
      if (selectedTableIds.includes(n.tableId)) {
        return { ...n, groupId: undefined };
      }
      return n;
    });
    onUpdateNodes(updatedNodes);
  };

  const handleUpdateTable = (updatedTable: Table) => {
    const nextTables = tables.map(t => t.id === updatedTable.id ? updatedTable : t);
    setTables(nextTables);
  };

  const handleAddTable = (newTable: Table) => {
    const nextTables = [...tables, newTable];
    setTables(nextTables);
  };

  const handleApplyDbmlSchema = (newTables: Table[], newRels: Relationship[]) => {
    setTables(newTables);
    setRelationships(newRels);
    setTimeout(() => {
      handleHierarchicalAutoLayout('TB');
    }, 100);
  };

  const handleApplyMockData = (dataByTableId: Record<string, any[]>) => {
    const nextTables = tables.map(t => {
      const generatedRows = dataByTableId[t.id];
      if (generatedRows) {
        return {
          ...t,
          data: generatedRows
        };
      }
      return t;
    });
    setTables(nextTables);
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-neutral-100 dark:bg-neutral-950">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
        
        {showMinimap && (
          <MiniMap 
            zoomable 
            pannable 
            position="bottom-right" 
            style={{ bottom: 16, right: 16, height: 120, width: 180, margin: 12 }}
            nodeColor={(n: any) => {
              if (n.type === 'erGroupNode') {
                return '#cbd5e1';
              }
              return '#3b82f6';
            }}
            nodeStrokeWidth={2}
            maskColor="rgba(241, 245, 249, 0.7)"
          />
        )}

        {/* Multi-Selection Grouping Floating Toolbar (only when multiple tables are selected) */}
        {selectedTableIds.length > 1 && (
          <Panel 
            position="top-left" 
            className="m-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border border-neutral-300 dark:border-neutral-800 p-1.5 rounded-xl shadow-2xl flex items-center gap-1.5 z-40 select-none"
          >
            <button 
              onClick={handleGroupSelected}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors"
              title="Ausgewählte Tabellen in einer neuen Domäne/Gruppe organisieren"
            >
              <Group size={14} className="text-blue-600 dark:text-blue-400" />
              <span>Domäne erstellen</span>
            </button>
            
            <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-0.5" />
            
            <button 
              onClick={handleUngroupSelected}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors"
              title="Gruppe aufheben"
            >
              <Group size={14} className="text-neutral-400 opacity-60" />
              <span>Gruppe aufheben</span>
            </button>
          </Panel>
        )}
      </ReactFlow>

      {/* 1. DBML Live Split Editor Drawer */}
      <DbmlSplitEditor
        tables={tables}
        relationships={relationships}
        tableGroups={tableGroups}
        isOpen={isDbmlOpen}
        onClose={() => setIsDbmlOpen(false)}
        onApplySchema={handleApplyDbmlSchema}
      />

      {/* 2. Database Schema Linter Drawer */}
      <SchemaLinterPanel
        tables={tables}
        relationships={relationships}
        isOpen={isLinterOpen}
        onClose={() => setIsLinterOpen(false)}
        onUpdateTable={handleUpdateTable}
        onAddTable={handleAddTable}
      />

      {/* 3. SQL Reverse Engineer Modal */}
      <SqlReverseEngineerModal
        isOpen={isSqlReverseModalOpen}
        onClose={() => setIsSqlReverseModalOpen(false)}
        onImport={(importedTables, importedRels) => {
          handleApplyDbmlSchema(importedTables, importedRels);
        }}
      />

      {/* 4. Schema-Diff & Migrations (UP/DOWN) Modal */}
      <SchemaDiffModal
        currentTables={tables}
        currentRelationships={relationships}
        isOpen={isSchemaDiffModalOpen}
        onClose={() => setIsSchemaDiffModalOpen(false)}
      />

      {/* 5. Graph-Aware Relational Mock Data Synthesis Modal */}
      <MockDataGeneratorModal
        tables={tables}
        relationships={relationships}
        isOpen={isMockDataModalOpen}
        onClose={() => setIsMockDataModalOpen(false)}
        onApplyData={handleApplyMockData}
      />

      {/* 6. Data-Dictionary & Documentation Export Modal */}
      <DataDictionaryModal
        tables={tables}
        relationships={relationships}
        tableGroups={tableGroups}
        isOpen={isDataDictionaryModalOpen}
        onClose={() => setIsDataDictionaryModalOpen(false)}
      />

      {/* 7. Indizes, Constraints & Composite PK Designer Modal */}
      {selectedTableForConstraints && (
        <IndexConstraintDesignerModal
          table={selectedTableForConstraints}
          isOpen={!!selectedTableForConstraints}
          onClose={() => setSelectedTableForConstraints(null)}
          onUpdateTable={(updatedTable) => {
            handleUpdateTable(updatedTable);
            setSelectedTableForConstraints(null);
          }}
        />
      )}

      {/* 8. Global ENUMs & Custom Domain Types Modal */}
      <GlobalEnumManagerModal
        isOpen={isEnumManagerModalOpen}
        onClose={() => setIsEnumManagerModalOpen(false)}
        enums={enums}
        customTypes={customTypes}
        onSave={(updatedEnums, updatedCustomTypes) => {
          useProjectStore.setState({ 
            enums: updatedEnums, 
            customTypes: updatedCustomTypes 
          } as any);
        }}
      />
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
