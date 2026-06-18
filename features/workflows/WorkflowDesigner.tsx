import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Workflow, Table, WorkflowNode as AppNode, WorkflowEdge as AppEdge } from '../../types/index';
import { Zap, GitBranch, PlayCircle, Settings, X, Plus } from 'lucide-react';
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

const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
};

const WorkflowDesignerContent: React.FC<WorkflowDesignerProps> = ({ workflow, tables, onWorkflowChange }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Sync ReactFlow state with our App State
  const initialNodes: Node[] = React.useMemo(() => workflow.nodes.map(n => ({
    id: n.id,
    type: n.type,
    position: { x: n.x, y: n.y },
    data: { 
      label: n.label,
      onDelete: () => removeNode(n.id)
    }
  })), [workflow.nodes]);

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

  // Sync external changes
  useEffect(() => {
    setNodes(workflow.nodes.map(n => ({
      id: n.id,
      type: n.type,
      position: { x: n.x, y: n.y },
      data: { 
        label: n.label,
        onDelete: () => removeNode(n.id)
      }
    })));
  }, [workflow.nodes, setNodes]);

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
          label: type === 'trigger' ? 'Start' : type === 'condition' ? 'Bedingung' : 'Aktion',
          triggerConfig: type === 'trigger' ? { event: 'onCreate' } : undefined,
          conditionConfig: type === 'condition' ? { operator: '=' } : undefined,
          actionConfig: type === 'action' ? { actionType: 'sendEmail' } : undefined
      };
      onWorkflowChange({ ...workflow, nodes: [...workflow.nodes, newNode] });
  };

  const updateNode = (updates: Partial<AppNode>) => {
      if (!selectedNodeId) return;
      const newNodes = workflow.nodes.map(n => n.id === selectedNodeId ? { ...n, ...updates } : n);
      onWorkflowChange({ ...workflow, nodes: newNodes });
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
          label: type === 'trigger' ? 'Start' : type === 'condition' ? 'Bedingung' : 'Aktion',
          triggerConfig: type === 'trigger' ? { event: 'onCreate' } : undefined,
          conditionConfig: type === 'condition' ? { operator: '=' } : undefined,
          actionConfig: type === 'action' ? { actionType: 'sendEmail' } : undefined
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
    <div className="flex h-full bg-slate-100 font-sans">
        
        {/* Toolbox */}
        <div className="w-60 bg-white border-r border-slate-300 flex flex-col z-10 shadow-sm">
            <div className="p-4 border-b bg-slate-50 font-bold text-slate-700">Workflow: {workflow.name}</div>
            <div className="p-4 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bausteine</div>
                <div className="text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded border border-slate-200">
                    Ziehen Sie die Bausteine per Drag & Drop auf die freie Fläche.
                </div>
                <button onDragStart={(event) => onDragStart(event, 'trigger')} draggable onClick={() => addNode('trigger')} className="flex items-center gap-3 w-full p-3 bg-yellow-50 border border-yellow-200 rounded hover:shadow-md transition-all text-sm text-yellow-800 font-medium cursor-grab active:cursor-grabbing">
                    <Zap size={18}/> Auslöser (Trigger)
                </button>
                <button onDragStart={(event) => onDragStart(event, 'condition')} draggable onClick={() => addNode('condition')} className="flex items-center gap-3 w-full p-3 bg-purple-50 border border-purple-200 rounded hover:shadow-md transition-all text-sm text-purple-800 font-medium cursor-grab active:cursor-grabbing">
                    <GitBranch size={18}/> Bedingung (If)
                </button>
                <button onDragStart={(event) => onDragStart(event, 'action')} draggable onClick={() => addNode('action')} className="flex items-center gap-3 w-full p-3 bg-blue-50 border border-blue-200 rounded hover:shadow-md transition-all text-sm text-blue-800 font-medium cursor-grab active:cursor-grabbing">
                    <PlayCircle size={18}/> Aktion
                </button>
            </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-slate-50 wrapper h-[calc(100vh-140px)]" ref={(ref) => ref && reactFlowInstance?.fitView()}>
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
                onSelectionChange={onSelectionChange}
                onEdgesDelete={onEdgesDelete}
                nodeTypes={nodeTypes}
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
