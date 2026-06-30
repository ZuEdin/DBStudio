
import React from 'react';
import { Play, Zap, ArrowRight, Settings, Database, Globe, Upload, RotateCcw } from 'lucide-react';

export const WorkflowToolbox: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Zap size={16} className="text-indigo-500" />
          Workflow Toolbox
        </h3>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Drag components onto canvas</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Triggers Section */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Triggers</h4>
          <div className="space-y-2">
            <div 
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50 cursor-grab active:cursor-grabbing transition-all group"
              onDragStart={(event) => onDragStart(event, 'triggerNode')}
              draggable
            >
              <div className="bg-indigo-500 text-white p-2 rounded-md shadow-sm group-hover:scale-110 transition-transform">
                <Play size={14} fill="currentColor" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700">Data Trigger</div>
                <div className="text-[10px] text-slate-400">On create, update...</div>
              </div>
            </div>
          </div>
        </div>

        {/* Logic Section */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Logic & Flow</h4>
          <div className="space-y-2">
            <div 
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-amber-300 hover:bg-amber-50 cursor-grab active:cursor-grabbing transition-all group"
              onDragStart={(event) => onDragStart(event, 'conditionNode')}
              draggable
            >
              <div className="bg-amber-500 text-white p-2 rounded-md shadow-sm group-hover:rotate-12 transition-transform">
                <Settings size={14} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700">Condition (If)</div>
                <div className="text-[10px] text-slate-400">Branching logic</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-orange-300 hover:bg-orange-50 cursor-grab active:cursor-grabbing transition-all group"
              onDragStart={(event) => onDragStart(event, 'loopNode')}
              draggable
            >
              <div className="bg-orange-500 text-white p-2 rounded-md shadow-sm group-hover:-rotate-45 transition-transform">
                <RotateCcw size={14} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700">Loop (For Each)</div>
                <div className="text-[10px] text-slate-400">Iterate collections</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Actions</h4>
          <div className="space-y-2">
            <div 
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50 cursor-grab active:cursor-grabbing transition-all group"
              onDragStart={(event) => onDragStart(event, 'actionNode')}
              draggable
            >
              <div className="bg-emerald-500 text-white p-2 rounded-md shadow-sm group-hover:translate-x-1 transition-transform">
                <Database size={14} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700">Database Action</div>
                <div className="text-[10px] text-slate-400">Create, Update record</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-sky-300 hover:bg-sky-50 cursor-grab active:cursor-grabbing transition-all group"
              onDragStart={(event) => onDragStart(event, 'apiNode')}
              draggable
            >
              <div className="bg-sky-500 text-white p-2 rounded-md shadow-sm group-hover:scale-110 transition-transform">
                <Globe size={14} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700">API Call</div>
                <div className="text-[10px] text-slate-400">External HTTP request</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-violet-300 hover:bg-violet-50 cursor-grab active:cursor-grabbing transition-all group"
              onDragStart={(event) => onDragStart(event, 'uploadNode')}
              draggable
            >
              <div className="bg-violet-500 text-white p-2 rounded-md shadow-sm group-hover:-translate-y-1 transition-transform">
                <Upload size={14} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700">File Upload</div>
                <div className="text-[10px] text-slate-400">Process uploads</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto p-4 bg-slate-50 border-t border-slate-100">
          <div className="text-[10px] text-slate-500 leading-relaxed italic">
            Pro Tip: Connect nodes by dragging lines between their handles. 
            Use Conditions to split your logic paths.
          </div>
      </div>
    </div>
  );
};
