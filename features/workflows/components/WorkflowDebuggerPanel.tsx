import React, { useState } from 'react';
import { 
  Bug, 
  Play, 
  StepForward, 
  Square, 
  RotateCcw, 
  Variable, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  Edit3
} from 'lucide-react';
import { WorkflowDebugStepEvent } from '../../logic/WorkflowEngine';

interface WorkflowDebuggerPanelProps {
  isOpen: boolean;
  isPaused: boolean;
  currentNodeId: string | null;
  currentNodeLabel: string;
  variables: Record<string, any>;
  onStepOver: () => void;
  onResume: () => void;
  onStop: () => void;
  onUpdateVariable: (path: string, value: any) => void;
  onClose: () => void;
}

export const WorkflowDebuggerPanel: React.FC<WorkflowDebuggerPanelProps> = ({
  isOpen,
  isPaused,
  currentNodeId,
  currentNodeLabel,
  variables,
  onStepOver,
  onResume,
  onStop,
  onUpdateVariable,
  onClose
}) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  if (!isOpen) return null;

  const handleStartEdit = (key: string, val: any) => {
    setEditingKey(key);
    setEditingValue(typeof val === 'object' ? JSON.stringify(val) : String(val));
  };

  const handleSaveEdit = (path: string) => {
    try {
      let parsed: any = editingValue;
      if (editingValue === 'true') parsed = true;
      else if (editingValue === 'false') parsed = false;
      else if (!isNaN(Number(editingValue)) && editingValue.trim() !== '') parsed = Number(editingValue);
      else if (editingValue.startsWith('{') || editingValue.startsWith('[')) {
        parsed = JSON.parse(editingValue);
      }
      onUpdateVariable(path, parsed);
      setEditingKey(null);
    } catch {
      onUpdateVariable(path, editingValue);
      setEditingKey(null);
    }
  };

  return (
    <div className="absolute top-16 right-6 w-96 bg-slate-950/95 backdrop-blur-md border-2 border-amber-500/80 rounded-2xl shadow-2xl z-40 text-white flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Header Bar */}
      <div className="p-3 bg-gradient-to-r from-amber-600/30 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg font-bold">
            <Bug size={16} />
          </div>
          <div>
            <div className="font-bold text-xs flex items-center gap-1.5">
              <span>Step-by-Step Debugger</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </div>
            <div className="text-[10px] text-amber-300 truncate max-w-[200px]">
              {currentNodeId ? `Pausiert: ${currentNodeLabel}` : 'Initialisiert'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          title="Schließen"
        >
          <X size={15} />
        </button>
      </div>

      {/* Stepping Action Bar */}
      <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onStepOver}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow active:scale-95 cursor-pointer"
            title="Einen Schritt weiter ausführen (Step Over)"
          >
            <StepForward size={14} />
            <span>Schritt (Step)</span>
          </button>

          <button
            type="button"
            onClick={onResume}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow active:scale-95 cursor-pointer"
            title="Ausführen bis zum nächsten Breakpoint (Resume)"
          >
            <Play size={13} fill="currentColor" />
            <span>Weiter (Resume)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onStop}
          className="p-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
          title="Debugger beenden"
        >
          <Square size={13} fill="currentColor" />
          <span className="text-[10px]">Stopp</span>
        </button>
      </div>

      {/* Live Variables Inspector */}
      <div className="p-3 max-h-72 overflow-y-auto space-y-3 font-mono text-[11px]">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
          <div className="flex items-center gap-1.5">
            <Variable size={12} className="text-amber-400" />
            <span>Variablen-Inspektor (Live State)</span>
          </div>
          <span className="text-[9px] text-slate-500">Klick zum Bearbeiten</span>
        </div>

        {/* Trigger Record variables */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-indigo-400 uppercase">Trigger Daten</div>
          {Object.entries(variables.trigger || {}).length === 0 ? (
            <div className="text-slate-500 text-[10px] italic">Keine Trigger-Felder</div>
          ) : (
            Object.entries(variables.trigger || {}).map(([key, val]) => {
              const fullPath = `trigger.${key}`;
              const isEditing = editingKey === fullPath;

              return (
                <div 
                  key={key} 
                  className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 border border-slate-800/80 hover:border-amber-500/40"
                >
                  <span className="text-indigo-300 font-bold">{key}:</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="bg-slate-950 border border-amber-500 px-1 py-0.5 rounded text-[10px] text-white outline-none w-28"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(fullPath)}
                        className="text-[9px] px-1.5 py-0.5 bg-amber-500 text-slate-950 font-bold rounded"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => handleStartEdit(fullPath, val)}
                      className="cursor-pointer text-slate-200 hover:text-amber-300 truncate max-w-[160px]"
                      title="Klicken zum Bearbeiten"
                    >
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* System & Runtime Context */}
        <div className="space-y-1 pt-2 border-t border-slate-900">
          <div className="text-[10px] font-bold text-emerald-400 uppercase">System &amp; Kontext</div>
          <div className="flex items-center justify-between p-1 bg-slate-900/50 rounded text-slate-400">
            <span>Uhrzeit (time):</span>
            <span className="text-slate-200">{variables.system?.time || '-'}</span>
          </div>
          <div className="flex items-center justify-between p-1 bg-slate-900/50 rounded text-slate-400">
            <span>Datum (date):</span>
            <span className="text-slate-200">{variables.system?.date || '-'}</span>
          </div>
          {variables.createdRecord && (
            <div className="p-1.5 bg-emerald-950/40 border border-emerald-800/40 rounded text-[10px] text-emerald-300">
              <span className="font-bold block mb-0.5">Zuletzt erstellter Datensatz:</span>
              <pre className="overflow-x-auto text-[9px]">{JSON.stringify(variables.createdRecord, null, 2)}</pre>
            </div>
          )}
          {variables.lastSentEmail && (
            <div className="p-1.5 bg-blue-950/40 border border-blue-800/40 rounded text-[10px] text-blue-300">
              <span className="font-bold block mb-0.5">Versendete E-Mail:</span>
              <span>An: {variables.lastSentEmail.to} • Betreff: {variables.lastSentEmail.subject}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
