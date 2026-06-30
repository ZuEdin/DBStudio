
import React, { useState, useCallback, useMemo } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Panel,
  Node,
  Edge,
  Connection,
  XYPosition,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Workflow, 
  Table, 
  WorkflowNode as MyWorkflowNode, 
  WorkflowEdge as MyWorkflowEdge 
} from '../../types/index';
import { WorkflowToolbox } from './components/WorkflowToolbox';
import { WorkflowProperties } from './components/WorkflowProperties';
import { useProjectStore } from '../../stores/useProjectStore';

// Custom Node Components
const TriggerNode = ({ data }: any) => (
  <div className="px-4 py-2 shadow-lg rounded-md bg-white border-2 border-indigo-500 min-w-[150px]">
    <div className="flex items-center">
      <div className="rounded-full w-2 h-2 bg-indigo-500 mr-2" />
      <div className="font-bold text-xs uppercase text-indigo-700">Trigger</div>
    </div>
    <div className="text-sm font-medium mt-1 text-slate-800">{data.label}</div>
    <div className="text-[10px] text-slate-400 italic">{data.triggerConfig?.event || 'Select event...'}</div>
  </div>
);

const ActionNode = ({ data }: any) => (
  <div className="px-4 py-2 shadow-lg rounded-md bg-white border-2 border-emerald-500 min-w-[150px]">
    <div className="flex items-center">
      <div className="rounded-full w-2 h-2 bg-emerald-500 mr-2" />
      <div className="font-bold text-xs uppercase text-emerald-700">Action</div>
    </div>
    <div className="text-sm font-medium mt-1 text-slate-800">{data.label}</div>
    <div className="text-[10px] text-slate-400 italic">{data.actionConfig?.actionType || 'Select action...'}</div>
  </div>
);

const ConditionNode = ({ data }: any) => (
  <div className="px-4 py-4 shadow-lg rounded-md bg-white border-2 border-amber-500 min-w-[120px] rotate-45 flex items-center justify-center text-center">
    <div className="-rotate-45">
       <div className="font-bold text-[10px] uppercase text-amber-700">If</div>
       <div className="text-xs font-medium text-slate-800">{data.label}</div>
    </div>
  </div>
);

const nodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
};

interface WorkflowDesignerProps {
  workflow: Workflow;
  tables: Table[];
  onWorkflowChange: (workflow: Workflow) => void;
}

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({ workflow, tables, onWorkflowChange }) => {
  const store = useProjectStore();
  
  // Transform our store nodes to React Flow nodes
  const initialNodes: Node[] = useMemo(() => workflow.nodes.map(n => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
  })), [workflow.id]);

  const initialEdges: Edge[] = useMemo(() => workflow.edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: e.animated,
  })), [workflow.id]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
    const newEdges = addEdge(params, edges as any);
    store.updateWorkflowEdges(workflow.id, newEdges as any);
  }, [setEdges, workflow.id, edges]);

  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    // Debounced or direct update to store
    // Since we have a patch-based store, we can update more frequently
    const updatedNodes = nodes.map(n => {
        const change = changes.find((c: any) => c.id === n.id && c.type === 'position');
        if (change && change.position) {
            return { ...n, position: change.position };
        }
        return n;
    });
    store.updateWorkflowNodes(workflow.id, updatedNodes as any);
  }, [onNodesChange, nodes, workflow.id]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const position: XYPosition = { x: event.clientX - 250, y: event.clientY - 100 };
    const newNode: Node = {
      id: crypto.randomUUID(),
      type,
      position,
      data: { label: `${type.replace('Node', '')} Node` },
    };

    setNodes((nds) => nds.concat(newNode));
    store.updateWorkflowNodes(workflow.id, [...nodes, newNode] as any);
  }, [nodes, setNodes, workflow.id]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const updateNodeData = (nodeId: string, newData: any) => {
      setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n));
      const updatedNodes = nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n);
      store.updateWorkflowNodes(workflow.id, updatedNodes as any);
  };

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden">
      {/* Toolbox */}
      <WorkflowToolbox />

      {/* Canvas */}
      <div className="flex-1 relative h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onInit={() => console.log('flow loaded')}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls />
          <MiniMap />
          <Panel position="top-right" className="bg-white p-2 border rounded shadow-md flex gap-2">
              <button 
                onClick={() => onWorkflowChange({ ...workflow, active: !workflow.active })}
                className={`px-3 py-1 rounded text-xs font-bold ${workflow.active ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-300'} border`}
              >
                {workflow.active ? 'Active' : 'Draft'}
              </button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Properties Panel */}
      <WorkflowProperties 
        node={selectedNode} 
        tables={tables}
        onUpdate={(data) => selectedNode && updateNodeData(selectedNode.id, data)}
      />
    </div>
  );
};
