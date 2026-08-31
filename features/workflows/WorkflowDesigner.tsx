import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
import { WorkflowExecutionConsole } from './components/WorkflowExecutionConsole';
import { WorkflowDebuggerPanel } from './components/WorkflowDebuggerPanel';
import { customNodeTypes } from './components/WorkflowNodes';
import { useProjectStore } from '../../stores/useProjectStore';
import { 
  Play, 
  Save, 
  Terminal, 
  Zap, 
  CheckCircle2, 
  Layers, 
  Sliders, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Share2,
  Bug,
  StepForward,
  Clock
} from 'lucide-react';
import { WorkflowExecutionEngine, WorkflowDebugSession } from '../logic/WorkflowEngine';
import { N8nExportModal } from './components/N8nExportModal';

interface WorkflowDesignerProps {
  workflow: Workflow;
  tables: Table[];
  onWorkflowChange: (workflow: Workflow) => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({ 
  workflow, 
  tables, 
  onWorkflowChange,
  onShowToast 
}) => {
  const store = useProjectStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const [showN8nExport, setShowN8nExport] = useState<boolean>(false);

  // Debugger states
  const [debugSession, setDebugSession] = useState<WorkflowDebugSession | null>(null);
  const [isDebugActive, setIsDebugActive] = useState<boolean>(false);
  const [debugCurrentNodeId, setDebugCurrentNodeId] = useState<string | null>(null);
  const [debugVariables, setDebugVariables] = useState<Record<string, any>>({});
  const [isDebuggerPanelOpen, setIsDebuggerPanelOpen] = useState<boolean>(false);

  // Transform our store nodes to React Flow nodes
  const initialNodes: Node[] = useMemo(() => (workflow.nodes || []).map(n => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
  })), [workflow.id]);

  const initialEdges: Edge[] = useMemo(() => (workflow.edges || []).map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    label: e.label,
    animated: e.animated ?? true,
    style: { strokeWidth: 2, stroke: '#6366f1' }
  })), [workflow.id]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state to parent and store
  const syncWorkflow = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    const updatedWorkflow: Workflow = {
      ...workflow,
      nodes: newNodes.map(n => ({
        id: n.id,
        type: n.type as any,
        position: n.position,
        data: n.data as any,
      })),
      edges: newEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: typeof e.label === 'string' ? e.label : undefined,
        animated: e.animated
      }))
    };
    onWorkflowChange(updatedWorkflow);
  }, [workflow, onWorkflowChange]);

  // Listen to custom breakpoint toggle events from custom nodes
  useEffect(() => {
    const handleToggleBreakpoint = (e: any) => {
      const { nodeId } = e.detail || {};
      if (!nodeId) return;
      setNodes((nds) => {
        const updated = nds.map((n) => {
          if (n.id === nodeId) {
            const hasBp = Boolean(n.data?.hasBreakpoint);
            return { ...n, data: { ...n.data, hasBreakpoint: !hasBp } };
          }
          return n;
        });
        syncWorkflow(updated, edges);
        return updated;
      });
    };
    window.addEventListener('workflow:toggle-breakpoint', handleToggleBreakpoint);
    return () => window.removeEventListener('workflow:toggle-breakpoint', handleToggleBreakpoint);
  }, [edges, syncWorkflow, setNodes]);

  const onConnect = useCallback((params: Connection) => {
    let edgeLabel: string | undefined = undefined;
    if (params.sourceHandle === 'true') edgeLabel = 'Wahr';
    if (params.sourceHandle === 'false') edgeLabel = 'Falsch';
    if (params.sourceHandle === 'body') edgeLabel = 'Schleife';
    if (params.sourceHandle === 'after') edgeLabel = 'Nachher';

    setEdges((eds) => {
      const newEds = addEdge({ 
        ...params, 
        animated: true, 
        label: edgeLabel,
        style: { strokeWidth: 2, stroke: '#6366f1' }
      }, eds);
      syncWorkflow(nodes, newEds);
      return newEds;
    });
  }, [nodes, syncWorkflow, setEdges]);

  // Handle Drag & Drop of new nodes onto the canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const defaultAction = event.dataTransfer.getData('application/defaultAction');

      if (!type || !reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Provide sensible default labels & configs
      let defaultLabel = 'Neuer Knoten';
      let nodeData: any = {};

      if (type === 'triggerNode') {
        defaultLabel = 'Datensatz erstellt';
        nodeData = {
          label: defaultLabel,
          triggerConfig: {
            event: 'onCreate',
            tableId: tables[0]?.id
          }
        };
      } else if (type === 'databaseActionNode') {
        const actionType = defaultAction || 'createRecord';
        const labels: Record<string, string> = {
          createRecord: 'Datensatz anlegen',
          updateRecord: 'Datensatz bearbeiten',
          deleteRecord: 'Datensatz löschen',
          calculateField: 'Formel berechnen'
        };
        defaultLabel = labels[actionType] || 'Datenbank-Aktion';
        nodeData = {
          label: defaultLabel,
          databaseActionConfig: {
            actionType,
            targetTableId: tables[0]?.id
          }
        };
      } else if (type === 'emailActionNode') {
        defaultLabel = 'E-Mail senden';
        nodeData = {
          label: defaultLabel,
          emailActionConfig: {
            to: '{{trigger.email}}',
            subject: 'Workflow Benachrichtigung',
            body: 'Hallo {{trigger.name}},\n\nIhre Anfrage wurde erfolgreich bearbeitet.'
          }
        };
      } else if (type === 'exportActionNode') {
        defaultLabel = 'Excel / PDF Export';
        nodeData = {
          label: defaultLabel,
          exportActionConfig: {
            exportType: 'excel',
            sourceType: 'table',
            sourceId: tables[0]?.id,
            fileName: 'Export_{{date}}'
          }
        };
      } else if (type === 'notificationActionNode') {
        defaultLabel = 'Toast Benachrichtigung';
        nodeData = {
          label: defaultLabel,
          notificationActionConfig: {
            type: 'toast',
            toastType: 'success',
            message: 'Aktion erfolgreich ausgeführt!'
          }
        };
      } else if (type === 'conditionNode') {
        defaultLabel = 'Prüfung (IF)';
        nodeData = {
          label: defaultLabel,
          conditionConfig: {
            operator: 'eq',
            value: 'Bezahlt'
          }
        };
      } else if (type === 'loopNode') {
        defaultLabel = 'Für jeden Eintrag';
        nodeData = {
          label: defaultLabel,
          loopConfig: {
            tableId: tables[0]?.id,
            variableName: 'item'
          }
        };
      } else if (type === 'apiNode') {
        defaultLabel = 'REST API Aufruf';
        nodeData = {
          label: defaultLabel,
          apiConfig: {
            method: 'POST',
            url: 'https://api.example.com/v1/event'
          }
        };
      } else if (type === 'delayNode') {
        defaultLabel = 'Wartezeit 5s';
        nodeData = {
          label: defaultLabel,
          delayConfig: {
            seconds: 5
          }
        };
      } else if (type === 'scriptNode') {
        defaultLabel = 'JavaScript Sandbox';
        nodeData = {
          label: defaultLabel,
          jsScriptConfig: {
            code: '// Script ausführen\nconsole.log("Trigger:", context.trigger);'
          }
        };
      }

      const newNode: Node = {
        id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type,
        position,
        data: nodeData,
      };

      setNodes((nds) => {
        const updated = nds.concat(newNode);
        syncWorkflow(updated, edges);
        return updated;
      });

      setSelectedNodeId(newNode.id);
    },
    [reactFlowInstance, tables, edges, syncWorkflow, setNodes]
  );

  const selectedNode = useMemo(() => 
    nodes.find(n => n.id === selectedNodeId), 
    [nodes, selectedNodeId]
  );

  const handleUpdateNodeData = (dataUpdate: any) => {
    if (!selectedNodeId) return;

    setNodes((nds) => {
      const updated = nds.map((n) => {
        if (n.id === selectedNodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              ...dataUpdate,
            },
          };
        }
        return n;
      });
      syncWorkflow(updated, edges);
      return updated;
    });
  };

  const handleToggleActive = () => {
    const newActive = !workflow.active;
    const updated = { ...workflow, active: newActive };
    onWorkflowChange(updated);
    if (onShowToast) {
      onShowToast(`Workflow "${workflow.name}" ist jetzt ${newActive ? 'aktiviert (lauscht auf Events)' : 'deaktiviert'}.`, newActive ? 'success' : 'info');
    }
  };

  // ----------------------------------------------------
  // STEP-BY-STEP DEBUGGER CONTROLS
  // ----------------------------------------------------
  const handleStartDebugger = () => {
    const triggerTable = tables.find(t => t.id === workflow.nodes.find(n => n.type === 'triggerNode')?.data.triggerConfig?.tableId) || tables[0];
    const record = triggerTable?.data?.[0] || { id: 'TEST_001', name: 'Test Datensatz', betrag: 149.99, status: 'Bezahlt' };
    const breakpoints = nodes.filter(n => n.data?.hasBreakpoint).map(n => n.id);

    const session = new WorkflowDebugSession(workflow, record, breakpoints, {
      onShowToast,
      onStepChange: (event) => {
        setDebugCurrentNodeId(event.nodeId);
        setDebugVariables(event.variables);
        setNodes(nds => nds.map(n => ({
          ...n,
          data: { ...n.data, isCurrentDebug: n.id === event.nodeId }
        })));
      }
    });

    setDebugSession(session);
    setIsDebugActive(true);
    setIsDebuggerPanelOpen(true);
    setDebugCurrentNodeId(session.currentNodeId);
    setDebugVariables(session.context.variables);

    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, isCurrentDebug: n.id === session.currentNodeId }
    })));

    onShowToast?.('Debugger gestartet: Workflow pausiert am Start-Knoten.', 'info');
  };

  const handleStepOver = async () => {
    if (!debugSession) return;
    const res = await debugSession.stepOver();
    if (res.status === 'completed') {
      onShowToast?.('Workflow Debugging abgeschlossen (100% Erfolgreich).', 'success');
      setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, isCurrentDebug: false } })));
    }
  };

  const handleResume = async () => {
    if (!debugSession) return;
    const log = await debugSession.resume();
    if (debugSession.isCompleted) {
      onShowToast?.(`Workflow Ausführung beendet: ${log.status === 'success' ? 'Erfolg' : 'Fehler'}`, log.status === 'success' ? 'success' : 'error');
      setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, isCurrentDebug: false } })));
    }
  };

  const handleStopDebugger = () => {
    if (debugSession) {
      debugSession.stop();
    }
    setDebugSession(null);
    setIsDebugActive(false);
    setIsDebuggerPanelOpen(false);
    setDebugCurrentNodeId(null);
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, isCurrentDebug: false } })));
    onShowToast?.('Debugger beendet.', 'info');
  };

  const handleUpdateDebugVariable = (path: string, value: any) => {
    if (!debugSession) return;
    debugSession.setVariable(path, value);
    setDebugVariables({ ...debugSession.context.variables });
    onShowToast?.(`Variable '${path}' aktualisiert.`, 'info');
  };

  const currentNodeObj = nodes.find(n => n.id === debugCurrentNodeId);

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 overflow-hidden" id="workflow-designer-root">
      
      {/* Top Workflow Action Bar */}
      <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Zap size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="font-bold text-slate-800 text-sm hover:bg-slate-50 focus:bg-white border border-transparent focus:border-slate-300 rounded px-1.5 py-0.5 outline-none"
                value={workflow.name}
                onChange={(e) => onWorkflowChange({ ...workflow, name: e.target.value })}
              />
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                workflow.active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                {workflow.active ? '● Aktiv' : '○ Entwurf'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {nodes.length} Knoten • {edges.length} Verbindungen
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Active Switch */}
          <button
            type="button"
            onClick={handleToggleActive}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
              workflow.active 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {workflow.active ? <ToggleRight size={16} className="text-emerald-600" /> : <ToggleLeft size={16} />}
            <span>{workflow.active ? 'Workflow Aktiv' : 'Inaktiv'}</span>
          </button>

          {/* n8n Export Button */}
          <button
            type="button"
            onClick={() => setShowN8nExport(true)}
            className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Diesen visuellen Workflow als n8n Workflow-JSON exportieren"
          >
            <Share2 size={13} className="text-orange-600" />
            <span>n8n Export</span>
          </button>

          {/* Step-by-Step Debugger Button */}
          <button
            type="button"
            onClick={isDebugActive ? () => setIsDebuggerPanelOpen(!isDebuggerPanelOpen) : handleStartDebugger}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer border ${
              isDebugActive
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-600 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
            }`}
            title="Einzelschritt-Debugger mit Breakpoints und Variableninspektor starten"
          >
            <Bug size={14} />
            <span>{isDebugActive ? 'Debugger Aktiv' : 'Debugger starten'}</span>
          </button>

          {/* Direct Run / Console Toggle */}
          <button
            type="button"
            onClick={() => setShowConsole(!showConsole)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border ${
              showConsole 
                ? 'bg-slate-800 text-white border-slate-700' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Terminal size={14} className={showConsole ? 'text-emerald-400' : 'text-slate-500'} />
            <span>Run-Logs ({workflow.executionLogs?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Main Canvas & Panels */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left: Toolbox */}
        <WorkflowToolbox />

        {/* Center: React Flow Canvas */}
        <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            nodeTypes={customNodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Controls className="bg-white border border-slate-200 rounded-lg shadow-md" />
            <MiniMap 
              className="bg-white border border-slate-200 rounded-lg shadow-md"
              nodeColor={(n) => {
                if (n.type === 'triggerNode') return '#6366f1';
                if (n.type === 'databaseActionNode') return '#10b981';
                if (n.type === 'emailActionNode') return '#3b82f6';
                if (n.type === 'exportActionNode') return '#a855f7';
                if (n.type === 'conditionNode') return '#f59e0b';
                if (n.type === 'loopNode') return '#f97316';
                return '#64748b';
              }}
            />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
          </ReactFlow>

          {/* Floating Live Debugger Panel */}
          <WorkflowDebuggerPanel
            isOpen={isDebuggerPanelOpen}
            isPaused={Boolean(debugSession?.isPaused)}
            currentNodeId={debugCurrentNodeId}
            currentNodeLabel={String(currentNodeObj?.data?.label || debugCurrentNodeId || 'Knoten')}
            variables={debugVariables}
            onStepOver={handleStepOver}
            onResume={handleResume}
            onStop={handleStopDebugger}
            onUpdateVariable={handleUpdateDebugVariable}
            onClose={() => setIsDebuggerPanelOpen(false)}
          />
        </div>

        {/* Right: Properties Inspector */}
        <WorkflowProperties 
          node={selectedNode} 
          tables={tables}
          reports={store.reports}
          onUpdate={handleUpdateNodeData}
        />
      </div>

      {/* Bottom Execution Console */}
      <WorkflowExecutionConsole
        workflow={workflow}
        tables={tables}
        isOpen={showConsole}
        onClose={() => setShowConsole(false)}
        onShowToast={onShowToast}
      />

      {/* n8n Export Modal */}
      {showN8nExport && (
        <N8nExportModal
          workflow={workflow}
          onClose={() => setShowN8nExport(false)}
          onShowToast={onShowToast}
        />
      )}

    </div>
  );
};
