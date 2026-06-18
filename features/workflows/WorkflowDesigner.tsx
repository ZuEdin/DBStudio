import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Workflow, Table, WorkflowNode as AppNode, WorkflowEdge as AppEdge } from '../../types/index';
import { Zap, GitBranch, PlayCircle, Settings, X, Plus, Globe, Upload, Square } from 'lucide-react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface WorkflowDesignerProps {
  workflow: Workflow;
  tables: Table[];
  onWorkflowChange: (workflow: Workflow) => void;
}

// Custom Node Components
const TriggerNode = ({ data }: any) => (
  <div className="bg-yellow-50 border-2 border-yellow-400 rounded shadow-md w-48 font-sans">
    <div className="p-2 border-b border-yellow-200 flex justify-between items-center bg-white/50">
      <span className="text-xs font-bold uppercase opacity-70 flex items-center gap-1 text-yellow-800">
        <Zap size={12}/> Trigger
      </span>
      {data.onDelete && <button onClick={data.onDelete} className="text-black/30 hover:text-red-600"><X size={14}/></button>}
    </div>
    <div className="p-3 text-sm font-medium text-center truncate text-slate-700">
      {data.label}
    </div>
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-yellow-500" />
  </div>
);

const ConditionNode = ({ data }: any) => (
  <div className="bg-purple-50 border-2 border-purple-400 rounded-3xl shadow-md w-48 font-sans">
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-500" />
    <div className="p-2 border-b border-purple-200 flex justify-between items-center bg-white/50 rounded-t-3xl">
      <span className="text-xs font-bold uppercase opacity-70 flex items-center gap-1 text-purple-800">
        <GitBranch size={12}/> Condition
      </span>
      {data.onDelete && <button onClick={data.onDelete} className="text-black/30 hover:text-red-600"><X size={14}/></button>}
    </div>
    <div className="p-3 text-sm font-medium text-center truncate text-slate-700">
      {data.label}
    </div>
    <Handle type="source" position={Position.Right} id="true" style={{ top: '30%' }} className="w-3 h-3 bg-green-500" />
    <Handle type="source" position={Position.Right} id="false" style={{ top: '70%' }} className="w-3 h-3 bg-red-500" />
  </div>
);

const ActionNode = ({ data }: any) => (
  <div className="bg-blue-50 border-2 border-blue-400 rounded shadow-md w-48 font-sans">
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />
    <div className="p-2 border-b border-blue-200 flex justify-between items-center bg-white/50">
      <span className="text-xs font-bold uppercase opacity-70 flex items-center gap-1 text-blue-800">
        <PlayCircle size={12}/> Action
      </span>
      {data.onDelete && <button onClick={data.onDelete} className="text-black/30 hover:text-red-600"><X size={14}/></button>}
    </div>
    <div className="p-3 text-sm font-medium text-center truncate text-slate-700">
      {data.label}
    </div>
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
  </div>
);

const ApiNode = ({ data }: any) => (
  <div className="bg-emerald-50 border-2 border-emerald-400 rounded shadow-md w-48 font-sans">
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-emerald-500" />
    <div className="p-2 border-b border-emerald-200 flex justify-between items-center bg-white/50">
      <span className="text-xs font-bold uppercase opacity-70 flex items-center gap-1 text-emerald-800">
        <Globe size={12}/> API-Abruf
      </span>
      {data.onDelete && <button onClick={data.onDelete} className="text-black/30 hover:text-red-600"><X size={14}/></button>}
    </div>
    <div className="p-3 text-sm font-medium text-center truncate text-slate-700">
      {data.label}
    </div>
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500" />
  </div>
);

const UploadNode = ({ data }: any) => (
  <div className="bg-indigo-50 border-2 border-indigo-400 rounded shadow-md w-48 font-sans">
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-indigo-500" />
    <div className="p-2 border-b border-indigo-200 flex justify-between items-center bg-white/50">
      <span className="text-xs font-bold uppercase opacity-70 flex items-center gap-1 text-indigo-800">
        <Upload size={12}/> Datei-Upload
      </span>
      {data.onDelete && <button onClick={data.onDelete} className="text-black/30 hover:text-red-600"><X size={14}/></button>}
    </div>
    <div className="p-3 text-sm font-medium text-center truncate text-slate-700">
      {data.label}
    </div>
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-indigo-500" />
  </div>
);

const GroupNode = ({ data }: any) => (
  <div className="w-full h-full min-w-[200px] min-h-[150px] border-2 border-dashed border-slate-400 bg-slate-100/35 rounded-lg p-3 select-none pointer-events-none font-sans relative">
    <div className="absolute top-2 left-3 flex justify-between items-center right-3 pointer-events-auto">
      <span className="text-xs font-bold uppercase text-slate-600 bg-white/95 px-2 py-0.5 rounded shadow-sm border border-slate-200 select-none">
        📁 {data.label}
      </span>
      {data.onDelete && (
        <button 
          onClick={(e) => { e.stopPropagation(); data.onDelete(); }} 
          className="text-black/30 hover:text-red-600 p-0.5 rounded bg-white/90 border border-slate-200 shadow-sm"
          title="Rahmen löschen"
        >
          <X size={12}/>
        </button>
      )}
    </div>
  </div>
);

const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
  api: ApiNode,
  upload: UploadNode,
  group: GroupNode,
};

const WorkflowDesignerContent: React.FC<WorkflowDesignerProps> = ({ workflow, tables, onWorkflowChange }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Fit view once on load
  useEffect(() => {
    if (reactFlowInstance) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
      }, 50);
    }
  }, [reactFlowInstance]);

  // Sync ReactFlow state with our App State
  const initialNodes: Node[] = React.useMemo(() => workflow.nodes.map(n => ({
    id: n.id,
    type: n.type,
    position: { x: n.x, y: n.y },
    selected: n.id === selectedNodeId,
    parentId: n.parentId,
    extent: n.extent,
    style: n.style,
    width: n.width,
    height: n.height,
    data: { 
      label: n.label,
      onDelete: () => removeNode(n.id)
    }
  })), [workflow.nodes, selectedNodeId]);

  const initialEdges: Edge[] = React.useMemo(() => workflow.edges.map(e => ({
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    label: e.label,
    sourceHandle: e.label === 'True' ? 'true' : e.label === 'False' ? 'false' : undefined,
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 }
  })), [workflow.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync external changes safely
  useEffect(() => {
    setNodes((prevNodes) => {
      return workflow.nodes.map(n => {
        const existingNode = prevNodes.find(pn => pn.id === n.id);
        const base = existingNode ? { ...existingNode } : {};
        return {
          ...base,
          id: n.id,
          type: n.type,
          position: { x: n.x, y: n.y },
          selected: n.id === selectedNodeId,
          parentId: n.parentId,
          extent: n.extent,
          style: n.style,
          width: n.width,
          height: n.height,
          data: {
            ...base.data,
            label: n.label,
            onDelete: () => removeNode(n.id)
          }
        };
      });
    });
  }, [workflow.nodes, selectedNodeId, setNodes]);

  useEffect(() => {
    setEdges(workflow.edges.map(e => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      label: e.label,
      sourceHandle: e.label === 'True' ? 'true' : e.label === 'False' ? 'false' : undefined,
      animated: true,
      style: { stroke: '#94a3b8', strokeWidth: 2 }
    })));
  }, [workflow.edges, setEdges]);

  // Handle Drag & Drop to update workflow state
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    const updatedNodes = workflow.nodes.map(n => 
      n.id === node.id ? { ...n, x: node.position.x, y: node.position.y } : n
    );
    onWorkflowChange({ ...workflow, nodes: updatedNodes });
  }, [workflow, onWorkflowChange]);

  const onConnect = useCallback((params: Connection) => {
    let label = '';
    if (params.sourceHandle === 'true') label = 'True';
    if (params.sourceHandle === 'false') label = 'False';

    const newEdge: AppEdge = {
        id: crypto.randomUUID(),
        sourceNodeId: params.source!,
        targetNodeId: params.target!,
        label: label || undefined
    };
    onWorkflowChange({ ...workflow, edges: [...workflow.edges, newEdge] });
  }, [workflow, onWorkflowChange]);

  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
      const edgeIds = edgesToDelete.map(e => e.id);
      onWorkflowChange({
          ...workflow,
          edges: workflow.edges.filter(e => !edgeIds.includes(e.id))
      });
  }, [workflow, onWorkflowChange]);

  const removeNode = (id: string) => {
      onWorkflowChange({ 
          ...workflow, 
          nodes: workflow.nodes.filter(n => n.id !== id),
          edges: workflow.edges.filter(e => e.sourceNodeId !== id && e.targetNodeId !== id)
      });
      if(selectedNodeId === id) setSelectedNodeId(null);
  };

  const addNode = (type: AppNode['type']) => {
      const newNode: AppNode = {
          id: crypto.randomUUID(),
          type,
          x: Math.random() * 200 + 100,
          y: Math.random() * 200 + 100,
          label: type === 'trigger' ? 'Start' : type === 'condition' ? 'Bedingung' : type === 'action' ? 'Aktion' : type === 'api' ? 'API-Abruf' : type === 'upload' ? 'Datei-Upload' : 'Gruppen-Rahmen',
          triggerConfig: type === 'trigger' ? { event: 'onCreate' } : undefined,
          conditionConfig: type === 'condition' ? { operator: '=' } : undefined,
          actionConfig: type === 'action' ? { actionType: 'sendEmail' } : undefined,
          apiConfig: type === 'api' ? { method: 'GET', url: 'https://api.example.com/v1/resource' } : undefined,
          fileUploadConfig: type === 'upload' ? { fileTypes: '.pdf,.png,.jpg', maxSizeBytes: 5 * 1024 * 1024 } : undefined,
          style: type === 'group' ? { width: 400, height: 280, borderColor: '#94a3b8', backgroundColor: 'rgba(241, 145, 179, 0.03)', borderStyle: 'dashed' } : undefined,
          width: type === 'group' ? 400 : undefined,
          height: type === 'group' ? 280 : undefined
      };
      onWorkflowChange({ ...workflow, nodes: [...workflow.nodes, newNode] });
  };

  const updateNode = (updates: Partial<AppNode>) => {
      if (!selectedNodeId) return;
      const newNodes = workflow.nodes.map(n => n.id === selectedNodeId ? { ...n, ...updates } : n);
      onWorkflowChange({ ...workflow, nodes: newNodes });
  };

  const handleParentFrameChange = (nodeId: string, parentId: string) => {
      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node) return;

      if (!parentId) {
          const parentNode = workflow.nodes.find(n => n.id === node.parentId);
          let newX = node.x;
          let newY = node.y;
          if (parentNode) {
              newX = parentNode.x + node.x;
              newY = parentNode.y + node.y;
          }

          const updatedNodes = workflow.nodes.map(n => 
              n.id === nodeId ? { ...n, parentId: undefined, extent: undefined, x: newX, y: newY } : n
          );
          onWorkflowChange({ ...workflow, nodes: updatedNodes });
      } else {
          const parentNode = workflow.nodes.find(n => n.id === parentId);
          let newX = node.x;
          let newY = node.y;
          if (parentNode && !node.parentId) {
              newX = Math.max(20, Math.min((parentNode.width || 400) - 180, node.x - parentNode.x));
              newY = Math.max(60, Math.min((parentNode.height || 280) - 100, node.y - parentNode.y));
          } else if (parentNode && node.parentId && node.parentId !== parentId) {
              newX = 30 + Math.random() * 50;
              newY = 70 + Math.random() * 50;
          }

          const updatedNodes = workflow.nodes.map(n => 
              n.id === nodeId ? { ...n, parentId, extent: 'parent' as const, x: newX, y: newY } : n
          );
          onWorkflowChange({ ...workflow, nodes: updatedNodes });
      }
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as AppNode['type'];

      if (typeof type === 'undefined' || !type || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: AppNode = {
          id: crypto.randomUUID(),
          type,
          x: position.x,
          y: position.y,
          label: type === 'trigger' ? 'Start' : type === 'condition' ? 'Bedingung' : type === 'action' ? 'Aktion' : type === 'api' ? 'API-Abruf' : type === 'upload' ? 'Datei-Upload' : 'Gruppen-Rahmen',
          triggerConfig: type === 'trigger' ? { event: 'onCreate' } : undefined,
          conditionConfig: type === 'condition' ? { operator: '=' } : undefined,
          actionConfig: type === 'action' ? { actionType: 'sendEmail' } : undefined,
          apiConfig: type === 'api' ? { method: 'GET', url: 'https://api.example.com/v1/resource' } : undefined,
          fileUploadConfig: type === 'upload' ? { fileTypes: '.pdf,.png,.jpg', maxSizeBytes: 5 * 1024 * 1024 } : undefined,
          style: type === 'group' ? { width: 400, height: 280, borderColor: '#94a3b8', backgroundColor: 'rgba(241, 245, 249, 0.03)', borderStyle: 'dashed' } : undefined,
          width: type === 'group' ? 400 : undefined,
          height: type === 'group' ? 280 : undefined
      };
      
      onWorkflowChange({ ...workflow, nodes: [...workflow.nodes, newNode] });
    },
    [reactFlowInstance, workflow, onWorkflowChange],
  );

  const onSelectionChange = useCallback((params: { nodes: Node[], edges: Edge[] }) => {
      if (params.nodes.length > 0) {
          setSelectedNodeId(params.nodes[0].id);
      } else {
          setSelectedNodeId(null);
      }
  }, []);

  const selectedNode = workflow.nodes.find(n => n.id === selectedNodeId);

    return (
    <div className="flex h-full w-full overflow-hidden bg-slate-100 font-sans">
        
        {/* Toolbox */}
        <div className="w-60 bg-white border-r border-slate-300 flex flex-col z-10 shadow-sm">
            <div className="p-4 border-b bg-slate-50 font-bold text-slate-700">Workflow: {workflow.name}</div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bausteine</div>
                <div className="text-[11px] text-slate-500 mb-3 bg-slate-50 p-2 rounded border border-slate-200">
                    Klicken oder per Drag & Drop auf die freie Fläche ziehen.
                </div>
                <button onDragStart={(event) => onDragStart(event, 'trigger')} draggable onClick={() => addNode('trigger')} className="flex items-center gap-3 w-full p-2.5 bg-yellow-50 border border-yellow-200 rounded hover:shadow-md transition-all text-xs text-yellow-800 font-semibold cursor-grab active:cursor-grabbing text-left">
                    <Zap size={14} className="shrink-0 text-yellow-600"/> Auslöser (Trigger)
                </button>
                <button onDragStart={(event) => onDragStart(event, 'condition')} draggable onClick={() => addNode('condition')} className="flex items-center gap-3 w-full p-2.5 bg-purple-50 border border-purple-200 rounded hover:shadow-md transition-all text-xs text-purple-800 font-semibold cursor-grab active:cursor-grabbing text-left">
                    <GitBranch size={14} className="shrink-0 text-purple-600"/> Bedingung (If)
                </button>
                <button onDragStart={(event) => onDragStart(event, 'action')} draggable onClick={() => addNode('action')} className="flex items-center gap-3 w-full p-2.5 bg-blue-50 border border-blue-200 rounded hover:shadow-md transition-all text-xs text-blue-800 font-semibold cursor-grab active:cursor-grabbing text-left">
                    <PlayCircle size={14} className="shrink-0 text-blue-600"/> Aktion
                </button>
                <button onDragStart={(event) => onDragStart(event, 'api')} draggable onClick={() => addNode('api')} className="flex items-center gap-3 w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded hover:shadow-md transition-all text-xs text-emerald-800 font-semibold cursor-grab active:cursor-grabbing text-left">
                    <Globe size={14} className="shrink-0 text-emerald-600"/> API-Abruf
                </button>
                <button onDragStart={(event) => onDragStart(event, 'upload')} draggable onClick={() => addNode('upload')} className="flex items-center gap-3 w-full p-2.5 bg-indigo-50 border border-indigo-200 rounded hover:shadow-md transition-all text-xs text-indigo-800 font-semibold cursor-grab active:cursor-grabbing text-left">
                    <Upload size={14} className="shrink-0 text-indigo-600"/> Datei-Upload
                </button>
                
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-1">Struktur</div>
                <button onDragStart={(event) => onDragStart(event, 'group')} draggable onClick={() => addNode('group')} className="flex items-center gap-3 w-full p-2.5 bg-slate-50 border border-slate-200 rounded hover:shadow-md transition-all text-xs text-slate-700 font-semibold cursor-grab active:cursor-grabbing text-left">
                    <Square size={14} className="shrink-0 text-slate-500 border-dashed border border-slate-400 p-[1px]"/> Gruppen-Rahmen (Frame)
                </button>
            </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 h-full min-h-0 relative bg-slate-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDragStop={onNodeDragStop}
                onNodeClick={(event, node) => setSelectedNodeId(node.id)}
                onPaneClick={() => setSelectedNodeId(null)}
                onEdgesDelete={onEdgesDelete}
                nodeTypes={nodeTypes}
                snapToGrid={true}
                snapGrid={[15, 15]}
                fitView
                defaultEdgeOptions={{ type: 'smoothstep' }}
            >
                <Background color="#cbd5e1" gap={16} />
                <Controls />
                <MiniMap 
                    nodeColor={(n) => {
                        if (n.type === 'trigger') return '#fde047';
                        if (n.type === 'condition') return '#d8b4fe';
                        return '#93c5fd';
                    }} 
                />
            </ReactFlow>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
            <div className="w-80 bg-white border-l border-slate-300 flex flex-col z-10 shadow-sm animate-in slide-in-from-right-2">
                <div className="p-4 border-b bg-slate-50 font-bold flex items-center gap-2 text-slate-800">
                    <Settings size={18} className="text-slate-500"/> Konfiguration
                </div>
                <div className="p-4 space-y-5 overflow-y-auto flex-1">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Beschriftung</label>
                        <input type="text" value={selectedNode.label} onChange={e => updateNode({ label: e.target.value })} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    {/* Trigger Config */}
                    {selectedNode.type === 'trigger' && selectedNode.triggerConfig && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Ereignis</label>
                                <select 
                                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={selectedNode.triggerConfig.event}
                                    onChange={e => updateNode({ triggerConfig: { ...selectedNode.triggerConfig, event: e.target.value as any } })}
                                >
                                    <option value="onCreate">Datensatz erstellt</option>
                                    <option value="onUpdate">Datensatz geändert</option>
                                    <option value="onDelete">Datensatz gelöscht</option>
                                    <option value="schedule">Zeitplan (Cron)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Tabelle</label>
                                <select 
                                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={selectedNode.triggerConfig.tableId || ''}
                                    onChange={e => updateNode({ triggerConfig: { ...selectedNode.triggerConfig!, tableId: e.target.value } })}
                                >
                                    <option value="">(Tabelle wählen)</option>
                                    {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Condition Config */}
                    {selectedNode.type === 'condition' && selectedNode.conditionConfig && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Feld prüfen</label>
                                <select 
                                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={selectedNode.conditionConfig.fieldId || ''}
                                    onChange={e => updateNode({ conditionConfig: { ...selectedNode.conditionConfig!, fieldId: e.target.value } })}
                                >
                                    <option value="">(Feld wählen)</option>
                                    {tables.flatMap(t => t.fields.map(f => <option key={f.id} value={f.id}>{t.name}.{f.name}</option>))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-1/3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Operator</label>
                                    <select 
                                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={selectedNode.conditionConfig.operator}
                                        onChange={e => updateNode({ conditionConfig: { ...selectedNode.conditionConfig!, operator: e.target.value } })}
                                    >
                                        <option value="=">=</option>
                                        <option value=">">&gt;</option>
                                        <option value="<">&lt;</option>
                                        <option value="!=">!=</option>
                                        <option value="contains">Enthält</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Wert</label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={selectedNode.conditionConfig.value || ''}
                                        onChange={e => updateNode({ conditionConfig: { ...selectedNode.conditionConfig!, value: e.target.value } })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Config */}
                    {selectedNode.type === 'action' && selectedNode.actionConfig && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Aktionstyp</label>
                                <select 
                                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={selectedNode.actionConfig.actionType}
                                    onChange={e => updateNode({ actionConfig: { ...selectedNode.actionConfig!, actionType: e.target.value as any } })}
                                >
                                    <option value="sendEmail">E-Mail senden</option>
                                    <option value="updateRecord">Datensatz aktualisieren</option>
                                    <option value="createRecord">Datensatz erstellen</option>
                                </select>
                            </div>
                            
                            {selectedNode.actionConfig.actionType === 'sendEmail' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Empfänger (E-Mail)</label>
                                        <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="chef@firma.de" value={selectedNode.actionConfig.emailTo || ''} onChange={e => updateNode({ actionConfig: { ...selectedNode.actionConfig!, emailTo: e.target.value } })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Betreff</label>
                                        <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Wichtige Info" value={selectedNode.actionConfig.emailSubject || ''} onChange={e => updateNode({ actionConfig: { ...selectedNode.actionConfig!, emailSubject: e.target.value } })} />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* API Request Config */}
                    {selectedNode.type === 'api' && selectedNode.apiConfig && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">HTTP-Methode</label>
                                <select 
                                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={selectedNode.apiConfig.method || 'GET'}
                                    onChange={e => updateNode({ apiConfig: { ...selectedNode.apiConfig!, method: e.target.value as any } })}
                                >
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="DELETE">DELETE</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Endpunkt-URL</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs" 
                                    placeholder="https://api.beispiel.de/v1/produkte" 
                                    value={selectedNode.apiConfig.url || ''} 
                                    onChange={e => updateNode({ apiConfig: { ...selectedNode.apiConfig!, url: e.target.value } })} 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Header (JSON)</label>
                                <textarea 
                                    className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono h-20" 
                                    placeholder='{ "Content-Type": "application/json" }' 
                                    value={selectedNode.apiConfig.headers || ''} 
                                    onChange={e => updateNode({ apiConfig: { ...selectedNode.apiConfig!, headers: e.target.value } })}
                                />
                            </div>
                            {(selectedNode.apiConfig.method === 'POST' || selectedNode.apiConfig.method === 'PUT') && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Request-Body</label>
                                    <textarea 
                                        className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono h-24" 
                                        placeholder='{ "status": "aktiv" }' 
                                        value={selectedNode.apiConfig.body || ''} 
                                        onChange={e => updateNode({ apiConfig: { ...selectedNode.apiConfig!, body: e.target.value } })}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* File Upload Config */}
                    {selectedNode.type === 'upload' && selectedNode.fileUploadConfig && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Ziel-Tabelle</label>
                                <select 
                                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={selectedNode.fileUploadConfig.tableId || ''}
                                    onChange={e => updateNode({ fileUploadConfig: { ...selectedNode.fileUploadConfig!, tableId: e.target.value } })}
                                >
                                    <option value="">(Tabelle wählen)</option>
                                    {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Erlaubte Dateitypen</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder=".pdf,.png,.jpg,.xlsx" 
                                    value={selectedNode.fileUploadConfig.fileTypes || ''} 
                                    onChange={e => updateNode({ fileUploadConfig: { ...selectedNode.fileUploadConfig!, fileTypes: e.target.value } })} 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 font-sans">Max. Dateigröße (MB)</label>
                                <input 
                                    type="number" 
                                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={(selectedNode.fileUploadConfig.maxSizeBytes || 5242880) / (1024 * 1024)} 
                                    onChange={e => {
                                        const mb = parseFloat(e.target.value) || 5;
                                        updateNode({ fileUploadConfig: { ...selectedNode.fileUploadConfig!, maxSizeBytes: mb * 1024 * 1024 } });
                                    }} 
                                />
                            </div>
                        </div>
                    )}

                    {/* Group Frame Config */}
                    {selectedNode.type === 'group' && (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <div className="w-1/2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Breite (px)</label>
                                    <input 
                                        type="number" 
                                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={selectedNode.width || 400}
                                        onChange={e => {
                                            const w = parseInt(e.target.value) || 200;
                                            updateNode({ width: w, style: { ...selectedNode.style, width: w } });
                                        }}
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Höhe (px)</label>
                                    <input 
                                        type="number" 
                                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={selectedNode.height || 280}
                                        onChange={e => {
                                            const h = parseInt(e.target.value) || 150;
                                            updateNode({ height: h, style: { ...selectedNode.style, height: h } });
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Rahmen-Stil</label>
                                <select 
                                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={selectedNode.style?.borderColor || '#94a3b8'}
                                    onChange={e => {
                                        const color = e.target.value;
                                        let bg = 'rgba(241, 245, 249, 0.03)';
                                        if (color === '#3b82f6') bg = 'rgba(59, 130, 246, 0.015)';
                                        if (color === '#10b981') bg = 'rgba(16, 185, 129, 0.015)';
                                        if (color === '#f59e0b') bg = 'rgba(245, 158, 11, 0.015)';
                                        updateNode({ 
                                            style: { 
                                                ...selectedNode.style, 
                                                borderColor: color, 
                                                backgroundColor: bg,
                                                borderStyle: 'dashed'
                                            } 
                                        });
                                    }}
                                >
                                    <option value="#94a3b8 font-sans">Standard (Kühles Grau)</option>
                                    <option value="#3b82f6 font-sans">Blau (Information)</option>
                                    <option value="#10b981 font-sans">Grün (Erfolg)</option>
                                    <option value="#f59e0b font-sans">Warmes Orange (Auslöser)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Parent Frame Selector */}
                    {selectedNode.type !== 'group' && (
                        <div className="border-t border-slate-200 pt-4 mt-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                <Square size={12} className="text-slate-500"/> Gruppen-Rahmen (Frame)
                            </label>
                            <select 
                                className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-sans"
                                value={selectedNode.parentId || ''}
                                onChange={e => handleParentFrameChange(selectedNode.id, e.target.value)}
                            >
                                <option value="">(Kein Rahmen - frei schwebend)</option>
                                {workflow.nodes.filter(n => n.type === 'group').map(g => (
                                    <option key={g.id} value={g.id}>{g.label}</option>
                                ))}
                            </select>
                            <p className="text-[11px] text-slate-400 mt-1 font-sans">
                                Platziert diesen Baustein in einen Rahmen, sodass sie sich gemeinsam verschieben.
                            </p>
                        </div>
                    )}

                </div>
            </div>
        )}
    </div>
  );
};

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = (props) => (
  <ReactFlowProvider>
    <WorkflowDesignerContent {...props} />
  </ReactFlowProvider>
);
