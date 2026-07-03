
import React, { useRef, useState, useEffect } from 'react';
import { Table, TableNode, Field, Relationship, HEADER_HEIGHT, FIELD_HEIGHT, NODE_WIDTH, TableGroup } from '../types/index';
import { X, Globe, Table as TableIcon, Hash, ZoomIn, ZoomOut, RotateCcw, Group, AlignLeft, AlignLeft as AlignLeftIcon, GripVertical, MousePointer, Hand, Grid3X3, Grid, Magnet, Network, Map, Eye, EyeOff } from 'lucide-react';
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
  const [hoveredRelId, setHoveredRelId] = useState<string | null>(null);
  
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const tableGroups = useProjectStore(state => state.tableGroups);
  const setTableGroups = useProjectStore(state => state.setTableGroups);

  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [canvasMode, setCanvasMode] = useState<'select' | 'pan'>('select');
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  // --- Live Multiplayer Collaborator Cursors Simulation ---
  const [collaboratorCursors, setCollaboratorCursors] = useState<{
    u2: { name: string; color: string; x: number; y: number; active: boolean; currentAction?: string };
    u3: { name: string; color: string; x: number; y: number; active: boolean; currentAction?: string };
  }>({
    u2: { name: 'Sarah Lee', color: '#10b981', x: 250, y: 350, active: true, currentAction: 'Bearbeitet Customers' },
    u3: { name: 'Tom H.', color: '#f59e0b', x: 500, y: 150, active: true, currentAction: 'Bearbeitet Users (LOCKED)' }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCollaboratorCursors(prev => {
        const next = { ...prev };
        // Find corresponding nodes for Sarah and Tom
        const customerNode = nodes.find(n => n.id.includes('customer') || n.id.includes('client') || n.id.includes('sys_customers')) || nodes[0];
        const userNode = nodes.find(n => n.id.includes('user') || n.id.includes('sys_users')) || nodes[1] || nodes[0];

        if (customerNode) {
          next.u2 = {
            ...prev.u2,
            x: customerNode.x + 80 + Math.sin(Date.now() / 1500) * 40,
            y: customerNode.y + 40 + Math.cos(Date.now() / 1500) * 30,
          };
        } else {
          next.u2 = {
            ...prev.u2,
            x: 250 + Math.sin(Date.now() / 2000) * 100,
            y: 350 + Math.cos(Date.now() / 2000) * 100,
          };
        }

        if (userNode) {
          next.u3 = {
            ...prev.u3,
            x: userNode.x + 120 + Math.sin(Date.now() / 1800) * 30,
            y: userNode.y + 50 + Math.cos(Date.now() / 1800) * 40,
          };
        } else {
          next.u3 = {
            ...prev.u3,
            x: 500 + Math.sin(Date.now() / 2500) * 80,
            y: 150 + Math.cos(Date.now() / 2500) * 80,
          };
        }

        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [nodes]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1000, height: 600 });
  const [showMinimap, setShowMinimap] = useState(true);
  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth || 1000,
          height: containerRef.current.clientHeight || 600
        });
      }
    };
    updateSize();
    
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    
    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const handleAlignAllToGrid = () => {
    if (!onUpdateNodes) return;
    const updatedNodes = safeNodes.map(n => ({
      ...n,
      x: Math.round(n.x / 20) * 20,
      y: Math.round(n.y / 20) * 20
    }));
    onUpdateNodes(updatedNodes);
  };

  const handleAutoArrange = () => {
    if (!onUpdateNodes) return;

    const updatedNodesMap: Record<string, { x: number; y: number }> = {};

    let currentGroupStartX = 80;
    let currentGroupStartY = 140;
    let maxGroupHeightInRow = 0;
    const groupSpacingX = 100; // horizontal gap between group containers
    const groupSpacingY = 160; // vertical gap between rows of groups
    const wrapWidth = 1400;

    // 1. Arrange Grouped Nodes
    const activeGroups = (tableGroups || [])
      .filter(g => safeNodes.some(n => n.groupId === g.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    activeGroups.forEach(group => {
      const groupNodes = safeNodes
        .filter(n => n.groupId === group.id)
        .sort((a, b) => {
          const tA = safeTables.find(t => t.id === a.tableId);
          const tB = safeTables.find(t => t.id === b.tableId);
          return (tA ? tA.name : '').localeCompare(tB ? tB.name : '');
        });

      const K = groupNodes.length;
      if (K === 0) return;

      const cols = K <= 2 ? K : (K <= 4 ? 2 : 3);
      const rows = Math.ceil(K / cols);

      const hSpacing = 280;
      const vSpacing = 280;

      const groupWidth = cols * hSpacing;
      const groupHeight = rows * vSpacing;

      // Check if we need to wrap to the next row of groups
      if (currentGroupStartX > 80 && currentGroupStartX + groupWidth > wrapWidth) {
        currentGroupStartX = 80;
        currentGroupStartY += maxGroupHeightInRow + groupSpacingY;
        maxGroupHeightInRow = 0;
      }

      // Place nodes of this group
      groupNodes.forEach((node, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        let x = currentGroupStartX + col * hSpacing;
        let y = currentGroupStartY + row * vSpacing;

        if (snapToGrid) {
          x = Math.round(x / 20) * 20;
          y = Math.round(y / 20) * 20;
        }

        updatedNodesMap[node.id] = { x, y };
      });

      maxGroupHeightInRow = Math.max(maxGroupHeightInRow, groupHeight);
      currentGroupStartX += groupWidth + groupSpacingX;
    });

    // Determine starting Y for ungrouped nodes
    let ungroupedStartY = 50;
    if (activeGroups.length > 0) {
      ungroupedStartY = currentGroupStartY + maxGroupHeightInRow + 140;
    }

    // 2. Arrange Ungrouped Nodes
    const ungroupedNodes = safeNodes
      .filter(n => !n.groupId)
      .sort((a, b) => {
        const tA = safeTables.find(t => t.id === a.tableId);
        const tB = safeTables.find(t => t.id === b.tableId);
        return (tA ? tA.name : '').localeCompare(tB ? tB.name : '');
      });

    const ungroupedCols = 4; // Use 4 columns for ungrouped nodes for a clean overview
    ungroupedNodes.forEach((node, index) => {
      const col = index % ungroupedCols;
      const row = Math.floor(index / ungroupedCols);

      let x = 80 + col * 280;
      let y = ungroupedStartY + row * 280;

      if (snapToGrid) {
        x = Math.round(x / 20) * 20;
        y = Math.round(y / 20) * 20;
      }

      updatedNodesMap[node.id] = { x, y };
    });

    // Build the final array of updated nodes
    const updatedNodes = safeNodes.map(n => {
      if (updatedNodesMap[n.id]) {
        return {
          ...n,
          x: updatedNodesMap[n.id].x,
          y: updatedNodesMap[n.id].y
        };
      }
      return n;
    });

    onUpdateNodes(updatedNodes);
  };

  const handlePhysicsLayout = () => {
    if (!onUpdateNodes) return;
    
    // Create a working copy for simulation
    const simNodes = safeNodes.map(n => ({ ...n, vx: 0, vy: 0 }));
    const iterations = 150;
    const repulsion = 800000; // Strong repulsion
    const attraction = 0.05;
    const damping = 0.7;
    const optimalDist = 350;
    
    for (let i = 0; i < iterations; i++) {
        // Repulsion
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
        
        // Attraction (Relationships)
        safeRelationships.forEach(rel => {
            const sourceNode = simNodes.find(n => n.tableId === rel.fromTableId);
            const targetNode = simNodes.find(n => n.tableId === rel.toTableId);
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
        
        // Update positions
        simNodes.forEach(n => {
            n.vx *= damping;
            n.vy *= damping;
            n.x += n.vx;
            n.y += n.vy;
        });
    }
    
    // Normalize to keep them positive and snapped
    const minX = Math.min(...simNodes.map(n => n.x));
    const minY = Math.min(...simNodes.map(n => n.y));
    
    const updatedNodes = simNodes.map(n => {
        let finalX = n.x - minX + 80;
        let finalY = n.y - minY + 80;
        if (snapToGrid) {
            finalX = Math.round(finalX / 20) * 20;
            finalY = Math.round(finalY / 20) * 20;
        }
        return { ...n, x: finalX, y: finalY };
    });
    
    onUpdateNodes(updatedNodes);
  };

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

  // Minimap Calculations and Configuration
  const minimapWidth = 200;
  const minimapHeight = 130;
  const minimapPadding = 150;

  const nodesX = safeNodes.map(n => n.x);
  const nodesY = safeNodes.map(n => n.y);
  const nodesWidths = safeNodes.map(() => NODE_WIDTH);
  const nodesHeights = safeNodes.map(n => {
    const t = safeTables.find(tbl => tbl.id === n.tableId);
    return t ? HEADER_HEIGHT + t.fields.length * FIELD_HEIGHT + (onRemoveNode ? FIELD_HEIGHT : 0) : 150;
  });

  const nodesMinX = nodesX.length > 0 ? Math.min(...nodesX) : 0;
  const nodesMaxX = nodesX.length > 0 ? Math.max(...nodesX.map((x, i) => x + nodesWidths[i])) : 1200;
  const nodesMinY = nodesY.length > 0 ? Math.min(...nodesY) : 0;
  const nodesMaxY = nodesY.length > 0 ? Math.max(...nodesY.map((y, i) => y + nodesHeights[i])) : 800;

  const minX = Math.min(0, nodesMinX - minimapPadding);
  const minY = Math.min(0, nodesMinY - minimapPadding);
  const maxX = Math.max(1600, nodesMaxX + minimapPadding);
  const maxY = Math.max(1000, nodesMaxY + minimapPadding);

  const boundsWidth = maxX - minX;
  const boundsHeight = maxY - minY;

  const handleMinimapInteraction = (clientX: number, clientY: number, containerElement: HTMLDivElement) => {
    const rect = containerElement.getBoundingClientRect();
    const mx = Math.max(0, Math.min(minimapWidth, clientX - rect.left));
    const my = Math.max(0, Math.min(minimapHeight, clientY - rect.top));

    const cx = minX + (mx / minimapWidth) * boundsWidth;
    const cy = minY + (my / minimapHeight) * boundsHeight;

    const panX = containerSize.width / 2 - cx * scale;
    const panY = containerSize.height / 2 - cy * scale;

    setPan({ x: panX, y: panY });
  };

  useEffect(() => {
    if (!isDraggingMinimap) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const mmElement = document.getElementById('minimap-content');
      if (mmElement) {
        handleMinimapInteraction(e.clientX, e.clientY, mmElement as HTMLDivElement);
      }
    };

    const handleWindowMouseUp = () => {
      setIsDraggingMinimap(false);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDraggingMinimap, containerSize, scale, minX, minY, boundsWidth, boundsHeight]);

  const handleGroupDragStart = (e: React.MouseEvent, groupNodeIds: string[]) => {
    if (!isInteractive) return;
    e.stopPropagation();

    // Select all nodes in the group if not already selected
    let newSelection = [...selectedNodeIds];
    if (!e.shiftKey) {
        newSelection = Array.from(new Set([...newSelection, ...groupNodeIds]));
    } else {
        // Toggle group selection
        const allSelected = groupNodeIds.every(id => newSelection.includes(id));
        if (allSelected) {
            newSelection = newSelection.filter(id => !groupNodeIds.includes(id));
        } else {
            newSelection = Array.from(new Set([...newSelection, ...groupNodeIds]));
        }
    }
    
    // Only drag if we have something to drag
    if (newSelection.length > 0) {
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
      if (canvasMode === 'pan' || e.altKey || e.button === 1) {
        setSelectedNodeIds([]);
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      } else {
        setSelectedNodeIds([]);
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setSelectionBox({
          startX: mouseX,
          startY: mouseY,
          currentX: mouseX,
          currentY: mouseY
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    if (selectionBox) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const selLeft = Math.min(selectionBox.startX, mouseX);
      const selRight = Math.max(selectionBox.startX, mouseX);
      const selTop = Math.min(selectionBox.startY, mouseY);
      const selBottom = Math.max(selectionBox.startY, mouseY);

      const newlySelected: string[] = [];
      safeNodes.forEach(node => {
        const table = safeTables.find(t => t.id === node.tableId);
        if (!table) return;

        const nodeHeight = HEADER_HEIGHT + table.fields.length * FIELD_HEIGHT + (onRemoveNode ? FIELD_HEIGHT : 0);

        const nodeLeft = node.x * scale + pan.x;
        const nodeRight = (node.x + NODE_WIDTH) * scale + pan.x;
        const nodeTop = node.y * scale + pan.y;
        const nodeBottom = (node.y + nodeHeight) * scale + pan.y;

        const overlapsX = nodeLeft < selRight && nodeRight > selLeft;
        const overlapsY = nodeTop < selBottom && nodeBottom > selTop;

        if (overlapsX && overlapsY) {
          newlySelected.push(node.id);
        }
      });

      setSelectedNodeIds(newlySelected);
      setSelectionBox({
        ...selectionBox,
        currentX: mouseX,
        currentY: mouseY
      });
      return;
    }
    if (dragState) {
      const dx = (e.clientX - dragState.mouseStartX) / scale;
      const dy = (e.clientY - dragState.mouseStartY) / scale;
      
      if (onUpdateNodes) {
        const updatedNodes = safeNodes.map(n => {
           if (dragState.nodeIds.includes(n.id)) {
             let newX = dragState.initialPositions[n.id].x + dx;
             let newY = dragState.initialPositions[n.id].y + dy;
             if (snapToGrid) {
               newX = Math.round(newX / 20) * 20;
               newY = Math.round(newY / 20) * 20;
             }
             return { ...n, x: newX, y: newY };
           }
           return n;
        });
        onUpdateNodes(updatedNodes);
      } else if (onMoveNode) {
        // Fallback for single node dragging
        dragState.nodeIds.forEach(id => {
          let newX = dragState.initialPositions[id].x + dx;
          let newY = dragState.initialPositions[id].y + dy;
          if (snapToGrid) {
            newX = Math.round(newX / 20) * 20;
            newY = Math.round(newY / 20) * 20;
          }
          onMoveNode(id, newX, newY);
        });
      }
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
    setConnectionStart(null);
    setIsPanning(false);
    setSelectionBox(null);
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
      ref={containerRef}
      className="relative w-full h-full overflow-hidden canvas-grid bg-slate-50 dark:bg-slate-950 cursor-grab"
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
                   <div className="absolute top-0 left-0 w-full px-4 py-3 transition-opacity flex flex-col pointer-events-none">
                       <div className="flex items-center gap-1 mb-1 w-full relative -ml-1">
                           <div 
                               className="cursor-move text-slate-400 hover:text-slate-600 active:text-blue-500 p-1 rounded flex-shrink-0 pointer-events-auto"
                               onMouseDown={(e) => handleGroupDragStart(e, groupNodes.map(n => n.id))}
                               title="Gruppe verschieben"
                           >
                               <GripVertical size={16} />
                           </div>
                           <input 
                              className={`bg-transparent font-semibold text-sm outline-none w-full pointer-events-auto transition-colors ${isSelected ? 'text-blue-900 placeholder-blue-300' : 'text-slate-800 placeholder-slate-400'}`}
                              value={group.name}
                              placeholder="Gruppenname"
                              onChange={(e) => {
                                  const newGroups = tableGroups.map(g => g.id === group.id ? { ...g, name: e.target.value } : g);
                                  setTableGroups(newGroups);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                           />
                       </div>
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

              const fromField = fromTable.fields.find(f => f.id === rel.fromFieldId);
              const toField = toTable.fields.find(f => f.id === rel.toFieldId);
              const fromFieldName = fromField ? fromField.name : '?';
              const toFieldName = toField ? toField.name : '?';

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
              
              const titleText = `${fromTable.name}.${fromFieldName} ${rel.type === '1:1' ? '-' : '->'} ${toTable.name}.${toFieldName}`;

              return (
                <g 
                  key={rel.id} 
                  className="pointer-events-auto"
                  onContextMenu={(e) => onRelationshipContextMenu && onRelationshipContextMenu(e, rel.id)}
                  onMouseEnter={() => setHoveredRelId(rel.id)}
                  onMouseLeave={() => setHoveredRelId(null)}
                >
                  <title>{titleText}</title>
                  {/* Invisible wide path for easier clicking */}
                  <path d={d} stroke="transparent" strokeWidth="16" fill="none" className="cursor-pointer" />
                  {/* Visible path */}
                  <path d={d} stroke={hoveredRelId === rel.id ? '#3b82f6' : '#64748b'} strokeWidth={hoveredRelId === rel.id ? "3" : "2"} fill="none" markerEnd="url(#arrowhead)" className="pointer-events-none transition-all duration-200" strokeDasharray={rel.referentialIntegrity === false ? '4 2' : 'none'}/>
                  
                  {/* Connection Dots (Circles) */}
                  <circle cx={start.x} cy={start.y} r={hoveredRelId === rel.id ? "5" : "4"} fill={hoveredRelId === rel.id ? '#3b82f6' : '#64748b'} className="pointer-events-none transition-all duration-200" stroke="white" strokeWidth="1" />
                  <circle cx={bezierEnd.x} cy={bezierEnd.y} r={hoveredRelId === rel.id ? "5" : "4"} fill={hoveredRelId === rel.id ? '#3b82f6' : '#64748b'} className="pointer-events-none transition-all duration-200" stroke="white" strokeWidth="1" />

                   {/* Labels - positioned slightly above the line */}
                  <text x={fromIsLeft ? start.x + 8 : start.x - 15} y={start.y - 6} className={`font-mono text-xs font-bold pointer-events-none select-none transition-colors ${hoveredRelId === rel.id ? 'fill-blue-600' : 'fill-slate-600'}`}>1</text>
                  <text x={fromIsLeft ? end.x - 18 : end.x + 10} y={end.y - 6} className={`font-mono text-xs font-bold pointer-events-none select-none transition-colors ${hoveredRelId === rel.id ? 'fill-blue-600' : 'fill-slate-600'}`}>{labelTo}</text>
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
              className={`absolute bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-800 rounded-sm select-none transition-shadow transition-colors duration-300 ${selectedNodeIds.includes(node.id) ? 'z-30 shadow-xl border-blue-500 dark:border-blue-500' : 'z-20 shadow-md'}`}
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
                className="node-header h-10 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-b border-slate-300 dark:border-slate-800 px-2 flex items-center justify-between cursor-move"
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
                    <span className="font-bold text-xs truncate text-slate-700 dark:text-slate-200" title={table.name}>{table.name}</span>
                </div>
                {onRemoveNode && (
                  <button onClick={() => onRemoveNode(node.id)} className="text-slate-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-800 dark:text-slate-200">
                {onRemoveNode && ( // Show '*' only in query designer
                  <div 
                    className="h-7 px-2 flex items-center font-bold hover:bg-sky-50 dark:hover:bg-slate-800/50 cursor-grab"
                    draggable
                    onDragStart={(e) => handleFieldDragStart(e, table.id, '*')}
                  >
                    *
                  </div>
                )}
                {table.fields.map(field => {
                  const isForeignKey = safeRelationships.some(r => r.toTableId === table.id && r.toFieldId === field.id);
                  const isHovered = hoveredRelId && safeRelationships.some(r => r.id === hoveredRelId && (r.fromFieldId === field.id || r.toFieldId === field.id));
                  return (
                    <div 
                      key={field.id} 
                      className={`h-7 px-2 flex items-center justify-between hover:bg-sky-50 dark:hover:bg-slate-800/50 ${isHovered ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-bold' : ''} ${connectionStart?.fieldId === field.id && connectionStart.tableId === table.id ? 'bg-sky-100 dark:bg-sky-950/50' : ''} ${onRemoveNode ? 'cursor-grab' : ''}`}
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
                              <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 rounded flex items-center" title="Auto Increment">
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

        {hoveredRelId && (() => {
          const rel = safeRelationships.find(r => r.id === hoveredRelId);
          if (!rel) return null;
          
          const fromNode = safeNodes.find(n => n.tableId === rel.fromTableId);
          const toNode = safeNodes.find(n => n.tableId === rel.toTableId);
          const fromTable = safeTables.find(t => t.id === rel.fromTableId);
          const toTable = safeTables.find(t => t.id === rel.toTableId);
          
          if (!fromNode || !toNode || !fromTable || !toTable) return null;
          
          const fromField = fromTable.fields.find(f => f.id === rel.fromFieldId);
          const toField = toTable.fields.find(f => f.id === rel.toFieldId);
          if (!fromField || !toField) return null;

          const fromIsLeft = fromNode.x < toNode.x;
          const startSide = fromIsLeft ? 'right' : 'left';
          const endSide = fromIsLeft ? 'left' : 'right';

          let start = getFieldPos(fromNode, fromTable, rel.fromFieldId, startSide);
          let end = getFieldPos(toNode, toTable, rel.toFieldId, endSide);
          
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;

          return (
            <div 
              className="absolute bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-lg border border-blue-500 shadow-2xl z-50 pointer-events-none backdrop-blur-sm max-w-xs transition-all duration-200"
              style={{ 
                left: midX - 120, 
                top: midY - 60,
                width: 240,
              }}
            >
              <div className="text-[10px] uppercase tracking-wider font-bold text-blue-400 border-b border-slate-700/50 pb-1 mb-1.5 flex justify-between items-center">
                <span>Beziehung ({rel.type})</span>
                {rel.referentialIntegrity !== false && (
                  <span className="bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded text-[8px]">FK Constraint</span>
                )}
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-300 font-medium truncate">{fromTable.name}</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-slate-300 font-medium truncate">{toTable.name}</span>
                </div>
                <div className="flex items-center justify-between gap-1 font-mono text-[10px] bg-slate-800 p-1 rounded border border-slate-700/30">
                  <span className="text-orange-400 truncate font-semibold">{fromField.name} {fromField.isPrimaryKey ? '🔑' : ''}</span>
                  <span className="text-slate-500">==</span>
                  <span className="text-blue-400 truncate font-semibold">{toField.name} {toField.isPrimaryKey ? '🔑' : '🔗'}</span>
                </div>
                {rel.comment && (
                  <p className="text-[10px] italic text-slate-400 mt-1.5 border-t border-slate-700/50 pt-1 leading-normal">
                    {rel.comment}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Real-time Multiplayer Cursors */}
        {Object.entries(collaboratorCursors).map(([id, cursorObj]) => {
          const cursor = cursorObj as any;
          return (
          <div 
            key={id}
            className="absolute pointer-events-none transition-all duration-100 ease-out z-40 select-none"
            style={{ left: cursor.x, top: cursor.y }}
          >
            <svg 
              width="14" 
              height="18" 
              viewBox="0 0 14 18" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.4)]"
            >
              <path 
                d="M1 1V14.5L4.5 11L7.5 17L10.5 15.5L7.5 9.5L12 9.5L1 1Z" 
                fill={cursor.color} 
                stroke="white" 
                strokeWidth="1.5" 
                strokeLinejoin="round" 
              />
            </svg>
            <div 
              className="ml-3.5 mt-2.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow-md flex flex-col min-w-[70px] leading-none border border-white/20"
              style={{ backgroundColor: cursor.color }}
            >
              <span className="font-sans font-bold">{cursor.name}</span>
              {cursor.currentAction && (
                <span className="text-[7px] font-normal opacity-90 truncate max-w-[120px] mt-0.5">
                  {cursor.currentAction}
                </span>
              )}
            </div>
          </div>
          );
        })}
      </div>
      
      {/* Multi-Selection Toolbar */}
      {selectedNodeIds.length > 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-300 dark:border-slate-800 p-1 flex items-center gap-1 z-50 transition-colors">
          <button 
            onClick={handleGroupSelected}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
            title="Zu einer Gruppe zusammenfassen"
          >
            <Group size={16} className="text-slate-500 dark:text-slate-400" />
            <span>Gruppieren</span>
          </button>
          
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1"></div>
          
          <button 
            onClick={handleUngroupSelected}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
            title="Gruppierung aufheben"
          >
            <Group size={16} className="text-slate-500 dark:text-slate-400 opacity-50" />
            <span>Aufheben</span>
          </button>

          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1"></div>

          <button 
            onClick={handleAlignTop}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
            title="An der höchsten Tabelle ausrichten"
          >
            <AlignLeftIcon size={16} className="text-slate-500 dark:text-slate-400 rotate-90" />
            <span>Oben ausrichten</span>
          </button>
          
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1"></div>

          <button 
            onClick={handleAlignLeft}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
            title="Am weitesten links stehenden Tabelle ausrichten"
          >
            <AlignLeftIcon size={16} className="text-slate-500 dark:text-slate-400" />
            <span>Links ausrichten</span>
          </button>
        </div>
      )}

      {/* Canvas Controls & Zoom Toolbar */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-300 dark:border-slate-800 p-1 flex items-center gap-1 z-[100] select-none transition-colors">
        {/* Interaction Modes */}
        <button 
          onClick={() => setCanvasMode('select')}
          className={`p-1.5 rounded transition-colors ${canvasMode === 'select' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          title="Auswahl-Werkzeug (Ziehen zum Markieren mehrerer Tabellen)"
        >
          <MousePointer size={16} />
        </button>
        <button 
          onClick={() => setCanvasMode('pan')}
          className={`p-1.5 rounded transition-colors ${canvasMode === 'pan' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          title="Hand-Werkzeug (Verschieben - oder Alt-Taste gedrückt halten)"
        >
          <Hand size={16} />
        </button>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-0.5"></div>

        {/* Layout & Grid Tools */}
        <button 
          onClick={handlePhysicsLayout}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold"
          title="Smart Auto-Layout (Physik-basiert)"
        >
          <Network size={16} className="text-slate-500 dark:text-slate-400" />
          <span className="hidden sm:inline">Smart Layout</span>
        </button>
        <button 
          onClick={handleAutoArrange}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold"
          title="Tabellen automatisch anordnen (Raster)"
        >
          <Grid3X3 size={16} className="text-slate-500" />
          <span className="hidden sm:inline">Raster-Layout</span>
        </button>
        <button 
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`p-1.5 rounded transition-colors flex items-center gap-1 text-xs font-semibold ${snapToGrid ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          title="Raster-Snapping ein-/ausschalten"
        >
          <Grid size={16} />
          <span className="hidden sm:inline">Raster</span>
        </button>
        <button 
          onClick={handleAlignAllToGrid}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
          title="Alle Tabellen am 20px-Raster ausrichten"
        >
          <Magnet size={16} className="text-slate-500 dark:text-slate-400" />
        </button>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-0.5"></div>

        {/* Zoom Controls */}
        <button 
          onClick={handleZoomIn}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
          title="Zoom vergrößern"
        >
          <ZoomIn size={16} />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
          title="Zoom verkleinern"
        >
          <ZoomOut size={16} />
        </button>
        <button 
          onClick={handleZoomReset}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold border-l border-slate-200 dark:border-slate-800 pl-2 bg-slate-50 dark:bg-slate-800/50"
          title="Zoom zurücksetzen"
        >
          <RotateCcw size={14} />
          <span>{Math.round(scale * 100)}%</span>
        </button>
      </div>

      {/* Minimap Overlay Component */}
      <div 
        className="absolute bottom-16 right-4 z-40 transition-all duration-300"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-850/80 select-none">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              <Map size={13} className="text-indigo-500" />
              <span>Minimap</span>
            </div>
            <button 
              onClick={() => setShowMinimap(!showMinimap)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={showMinimap ? "Minimap einklappen" : "Minimap ausklappen"}
            >
              {showMinimap ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>

          {/* Map Area */}
          {showMinimap && (
            <div 
              id="minimap-content"
              className="relative cursor-crosshair overflow-hidden select-none bg-slate-50/40 dark:bg-slate-950/40"
              style={{ width: minimapWidth, height: minimapHeight }}
              onMouseDown={(e) => {
                setIsDraggingMinimap(true);
                handleMinimapInteraction(e.clientX, e.clientY, e.currentTarget);
              }}
            >
              {/* Minimap Grid simulation */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:10px_10px] opacity-25 pointer-events-none" />

              {/* Group Bounds */}
              {tableGroups && tableGroups.map(group => {
                const groupNodes = safeNodes.filter(n => n.groupId === group.id);
                if (groupNodes.length === 0) return null;
                const gMinX = Math.min(...groupNodes.map(n => n.x)) - 24;
                const gMinY = Math.min(...groupNodes.map(n => n.y)) - 100;
                const gMaxX = Math.max(...groupNodes.map(n => n.x + NODE_WIDTH)) + 24;
                const gMaxY = Math.max(...groupNodes.map(n => {
                  const t = safeTables.find(tbl => tbl.id === n.tableId);
                  const h = t ? HEADER_HEIGHT + t.fields.length * FIELD_HEIGHT + (onRemoveNode ? FIELD_HEIGHT : 0) : 200;
                  return n.y + h;
                })) + 24;

                const gx = ((gMinX - minX) / boundsWidth) * minimapWidth;
                const gy = ((gMinY - minY) / boundsHeight) * minimapHeight;
                const gw = ((gMaxX - gMinX) / boundsWidth) * minimapWidth;
                const gh = ((gMaxY - gMinY) / boundsHeight) * minimapHeight;

                return (
                  <div
                    key={group.id}
                    className="absolute border border-dashed border-indigo-400/40 dark:border-indigo-500/30 bg-indigo-500/5 rounded pointer-events-none"
                    style={{ left: gx, top: gy, width: gw, height: gh }}
                  />
                );
              })}

              {/* Node Bounds */}
              {safeNodes.map(node => {
                const t = safeTables.find(tbl => tbl.id === node.tableId);
                const nodeHeight = t ? HEADER_HEIGHT + t.fields.length * FIELD_HEIGHT + (onRemoveNode ? FIELD_HEIGHT : 0) : 150;

                const nx = ((node.x - minX) / boundsWidth) * minimapWidth;
                const ny = ((node.y - minY) / boundsHeight) * minimapHeight;
                const nw = (NODE_WIDTH / boundsWidth) * minimapWidth;
                const nh = (nodeHeight / boundsHeight) * minimapHeight;
                const isSelected = selectedNodeIds.includes(node.id);

                return (
                  <div
                    key={node.id}
                    className={`absolute rounded-[2px] transition-all pointer-events-none ${
                      isSelected 
                        ? 'bg-indigo-500/45 border border-indigo-500 shadow-[0_0_4px_rgba(99,102,241,0.5)] z-10' 
                        : 'bg-slate-300 dark:bg-slate-700 border border-slate-400 dark:border-slate-650'
                    }`}
                    style={{ left: nx, top: ny, width: nw, height: nh }}
                  >
                    {/* Visual header bar matching table accent */}
                    <div className="h-[2px] w-full bg-slate-400 dark:bg-slate-500 rounded-t" />
                  </div>
                );
              })}

              {/* Viewport Bounds Rectangle */}
              {(() => {
                const viewportLeft = -pan.x / scale;
                const viewportTop = -pan.y / scale;
                const viewportRight = (-pan.x + containerSize.width) / scale;
                const viewportBottom = (-pan.y + containerSize.height) / scale;

                const vx = ((viewportLeft - minX) / boundsWidth) * minimapWidth;
                const vy = ((viewportTop - minY) / boundsHeight) * minimapHeight;
                const vw = ((viewportRight - viewportLeft) / boundsWidth) * minimapWidth;
                const vh = ((viewportBottom - viewportTop) / boundsHeight) * minimapHeight;

                return (
                  <div
                    className="absolute border-2 border-indigo-500 dark:border-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/15 rounded shadow-[0_0_8px_rgba(99,102,241,0.25)] pointer-events-none"
                    style={{
                      left: vx,
                      top: vy,
                      width: Math.max(12, vw),
                      height: Math.max(12, vh),
                    }}
                  />
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Real-time selection box overlay */}
      {selectionBox && (
        <div 
          className="absolute border border-blue-500 bg-blue-500/10 rounded pointer-events-none z-50 shadow-sm animate-pulse-subtle"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.currentX),
            top: Math.min(selectionBox.startY, selectionBox.currentY),
            width: Math.abs(selectionBox.startX - selectionBox.currentX),
            height: Math.abs(selectionBox.startY - selectionBox.currentY)
          }}
        />
      )}
    </div>
  );
};
