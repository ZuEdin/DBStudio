
import React, { useState, useRef } from 'react';
import { Workflow, Table, WorkflowNode } from '../../types/index';
import { Zap, GitBranch, Send, Database, PlayCircle, Settings, X, Plus } from 'lucide-react';

interface WorkflowDesignerProps {
  workflow: Workflow;
  tables: Table[];
  onWorkflowChange: (workflow: Workflow) => void;
}

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({ workflow, tables, onWorkflowChange }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  
  // Basic update helper
  const updateNode = (id: string, updates: Partial<WorkflowNode>) => {
      const newNodes = workflow.nodes.map(n => n.id === id ? { ...n, ...updates } : n);
      onWorkflowChange({ ...workflow, nodes: newNodes });
  };

  const addNode = (type: WorkflowNode['type'], x: number, y: number) => {
      const newNode: WorkflowNode = {
          id: crypto.randomUUID(),
          type,
          x,
          y,
          label: type === 'trigger' ? 'Start' : type === 'condition' ? 'Bedingung' : 'Aktion',
          // Init empty configs
          triggerConfig: type === 'trigger' ? { event: 'onCreate' } : undefined,
          conditionConfig: type === 'condition' ? { operator: '=' } : undefined,
          actionConfig: type === 'action' ? { actionType: 'sendEmail' } : undefined
      };
      onWorkflowChange({ ...workflow, nodes: [...workflow.nodes, newNode] });
  };

  const removeNode = (id: string) => {
      onWorkflowChange({ 
          ...workflow, 
          nodes: workflow.nodes.filter(n => n.id !== id),
          edges: workflow.edges.filter(e => e.sourceNodeId !== id && e.targetNodeId !== id)
      });
      if(selectedNodeId === id) setSelectedNodeId(null);
  };

  // Drag Logic
  const handleDragStart = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setDraggedNodeId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (draggedNodeId) {
          const containerRect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - containerRect.left - 50; // center offset
          const y = e.clientY - containerRect.top - 20;
          updateNode(draggedNodeId, { x, y });
      }
  };

  const handleMouseUp = () => setDraggedNodeId(null);

  // Drawing Edges (Simple straight lines for prototype)
  // Real implementation needs bezier curves like relationship view
  const renderEdges = () => {
      return workflow.edges.map(edge => {
          const source = workflow.nodes.find(n => n.id === edge.sourceNodeId);
          const target = workflow.nodes.find(n => n.id === edge.targetNodeId);
          if (!source || !target) return null;
          
          const x1 = source.x + 100; // Right side of source
          const y1 = source.y + 40;
          const x2 = target.x; // Left side of target
          const y2 = target.y + 40;

          return (
              <g key={edge.id}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="2" />
                  {edge.label && (
                      <text x={(x1+x2)/2} y={(y1+y2)/2 - 5} textAnchor="middle" className="text-[10px] fill-slate-500 font-bold bg-white">{edge.label}</text>
                  )}
              </g>
          );
      });
  };

  const selectedNode = workflow.nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex h-full bg-slate-100">
        
        {/* Toolbox */}
        <div className="w-60 bg-white border-r border-slate-300 flex flex-col">
            <div className="p-4 border-b bg-slate-50 font-bold text-slate-700">Workflow: {workflow.name}</div>
            <div className="p-4 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase">Bausteine</div>
                <button onClick={() => addNode('trigger', 100, 100)} className="flex items-center gap-3 w-full p-3 bg-yellow-50 border border-yellow-200 rounded hover:shadow-md transition-all text-sm text-yellow-800 font-medium">
                    <Zap size={18}/> Auslöser (Trigger)
                </button>
                <button onClick={() => addNode('condition', 100, 200)} className="flex items-center gap-3 w-full p-3 bg-purple-50 border border-purple-200 rounded hover:shadow-md transition-all text-sm text-purple-800 font-medium">
                    <GitBranch size={18}/> Bedingung (If)
                </button>
                <button onClick={() => addNode('action', 300, 100)} className="flex items-center gap-3 w-full p-3 bg-blue-50 border border-blue-200 rounded hover:shadow-md transition-all text-sm text-blue-800 font-medium">
                    <PlayCircle size={18}/> Aktion
                </button>
            </div>
            
            <div className="mt-auto p-4 border-t bg-slate-50 text-xs text-slate-500">
                Verbinden Sie die Knoten per Drag & Drop (noch in Entwicklung).
            </div>
        </div>

        {/* Canvas */}
        <div 
            className="flex-1 relative overflow-hidden bg-slate-100 canvas-grid"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <svg className="absolute inset-0 pointer-events-none w-full h-full">
                {renderEdges()}
            </svg>

            {workflow.nodes.map(node => (
                <div 
                    key={node.id}
                    className={`absolute w-48 rounded shadow-sm border-2 cursor-pointer select-none transition-shadow ${selectedNodeId === node.id ? 'ring-2 ring-offset-1 ring-blue-400' : ''} ${node.type === 'trigger' ? 'bg-yellow-50 border-yellow-400' : node.type === 'condition' ? 'bg-purple-50 border-purple-400 rounded-3xl' : 'bg-blue-50 border-blue-400'}`}
                    style={{ left: node.x, top: node.y, height: 80 }}
                    onMouseDown={(e) => handleDragStart(e, node.id)}
                    onClick={(e) => { e.stopPropagation(); setSelectedNodeId(node.id); }}
                >
                    <div className="p-2 border-b border-black/10 flex justify-between items-center bg-white/30">
                        <span className="text-xs font-bold uppercase opacity-70 flex items-center gap-1">
                            {node.type === 'trigger' && <Zap size={12}/>}
                            {node.type === 'condition' && <GitBranch size={12}/>}
                            {node.type === 'action' && <PlayCircle size={12}/>}
                            {node.type}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); removeNode(node.id); }} className="text-black/30 hover:text-red-600"><X size={14}/></button>
                    </div>
                    <div className="p-3 text-sm font-medium text-center truncate">
                        {node.label}
                    </div>
                </div>
            ))}
        </div>

        {/* Properties Panel */}
        {selectedNode && (
            <div className="w-80 bg-white border-l border-slate-300 flex flex-col animate-in slide-in-from-right-10">
                <div className="p-4 border-b bg-slate-50 font-bold flex items-center gap-2">
                    <Settings size={16}/> Konfiguration
                </div>
                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Beschriftung</label>
                        <input type="text" value={selectedNode.label} onChange={e => updateNode(selectedNode.id, { label: e.target.value })} className="w-full border rounded p-2 text-sm" />
                    </div>

                    {/* Trigger Config */}
                    {selectedNode.type === 'trigger' && selectedNode.triggerConfig && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ereignis</label>
                                <select 
                                    className="w-full border rounded p-2 text-sm"
                                    value={selectedNode.triggerConfig.event}
                                    onChange={e => updateNode(selectedNode.id, { triggerConfig: { ...selectedNode.triggerConfig, event: e.target.value as any } })}
                                >
                                    <option value="onCreate">Datensatz erstellt</option>
                                    <option value="onUpdate">Datensatz geändert</option>
                                    <option value="onDelete">Datensatz gelöscht</option>
                                    <option value="schedule">Zeitplan (Cron)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tabelle</label>
                                <select 
                                    className="w-full border rounded p-2 text-sm"
                                    value={selectedNode.triggerConfig.tableId || ''}
                                    onChange={e => updateNode(selectedNode.id, { triggerConfig: { ...selectedNode.triggerConfig, tableId: e.target.value } })}
                                >
                                    <option value="">(Wählen)</option>
                                    {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Condition Config */}
                    {selectedNode.type === 'condition' && selectedNode.conditionConfig && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Feld prüfen</label>
                                <select 
                                    className="w-full border rounded p-2 text-sm"
                                    value={selectedNode.conditionConfig.fieldId || ''}
                                    onChange={e => updateNode(selectedNode.id, { conditionConfig: { ...selectedNode.conditionConfig, fieldId: e.target.value } })}
                                >
                                    <option value="">(Wählen)</option>
                                    {/* Ideally we filter fields by the trigger table, for now list all with table prefix */}
                                    {tables.flatMap(t => t.fields.map(f => <option key={f.id} value={f.id}>{t.name}.{f.name}</option>))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-1/3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Operator</label>
                                    <select 
                                        className="w-full border rounded p-2 text-sm"
                                        value={selectedNode.conditionConfig.operator}
                                        onChange={e => updateNode(selectedNode.id, { conditionConfig: { ...selectedNode.conditionConfig, operator: e.target.value } })}
                                    >
                                        <option value="=">=</option>
                                        <option value=">">&gt;</option>
                                        <option value="<">&lt;</option>
                                        <option value="!=">!=</option>
                                        <option value="contains">Enthält</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Wert</label>
                                    <input 
                                        type="text" 
                                        className="w-full border rounded p-2 text-sm"
                                        value={selectedNode.conditionConfig.value || ''}
                                        onChange={e => updateNode(selectedNode.id, { conditionConfig: { ...selectedNode.conditionConfig, value: e.target.value } })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Config */}
                    {selectedNode.type === 'action' && selectedNode.actionConfig && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Aktionstyp</label>
                                <select 
                                    className="w-full border rounded p-2 text-sm"
                                    value={selectedNode.actionConfig.actionType}
                                    onChange={e => updateNode(selectedNode.id, { actionConfig: { ...selectedNode.actionConfig, actionType: e.target.value as any } })}
                                >
                                    <option value="sendEmail">E-Mail senden</option>
                                    <option value="updateRecord">Datensatz aktualisieren</option>
                                    <option value="createRecord">Datensatz erstellen</option>
                                </select>
                            </div>
                            
                            {selectedNode.actionConfig.actionType === 'sendEmail' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Empfänger (E-Mail)</label>
                                        <input type="text" className="w-full border rounded p-2 text-sm" placeholder="chef@firma.de" value={selectedNode.actionConfig.emailTo || ''} onChange={e => updateNode(selectedNode.id, { actionConfig: { ...selectedNode.actionConfig, emailTo: e.target.value } })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Betreff</label>
                                        <input type="text" className="w-full border rounded p-2 text-sm" placeholder="Wichtige Info" value={selectedNode.actionConfig.emailSubject || ''} onChange={e => updateNode(selectedNode.id, { actionConfig: { ...selectedNode.actionConfig, emailSubject: e.target.value } })} />
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
