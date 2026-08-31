import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  X,
  FileText,
  Layers,
  Sparkles,
  Download,
  Trash2,
  Code2,
  Variable,
  Info,
  Maximize2
} from 'lucide-react';
import { Workflow, WorkflowExecutionLog, WorkflowExecutionStepLog } from '../../../types/workflow';
import { Table } from '../../../types/index';
import { WorkflowExecutionEngine } from '../../logic/WorkflowEngine';
import { useProjectStore } from '../../../stores/useProjectStore';

interface WorkflowExecutionConsoleProps {
  workflow: Workflow;
  tables: Table[];
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const WorkflowExecutionConsole: React.FC<WorkflowExecutionConsoleProps> = ({
  workflow,
  tables,
  isOpen,
  onClose,
  onShowToast
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WorkflowExecutionLog | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'steps' | 'payload' | 'email' | 'json'>('steps');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');

  const logs = (workflow.executionLogs || []).filter(l => {
    if (statusFilter === 'success') return l.status === 'success';
    if (statusFilter === 'failed') return l.status === 'failed';
    return true;
  });

  const currentLog = selectedLog || logs[0] || null;
  const currentStep = (currentLog && selectedStepIndex !== null) ? currentLog.steps[selectedStepIndex] : null;

  // Determine trigger table
  const triggerNode = workflow.nodes.find(n => n.type === 'triggerNode');
  const triggerTableId = triggerNode?.data.triggerConfig?.tableId;
  const triggerTable = tables.find(t => t.id === triggerTableId) || tables[0];
  const tableData = triggerTable?.data || [];

  const handleRunTest = async () => {
    setIsRunning(true);
    try {
      let recordToUse: Record<string, any> = {};
      if (selectedRecordId && triggerTable) {
        recordToUse = (triggerTable.data || []).find(r => r.id === selectedRecordId) || {};
      } else if (tableData.length > 0) {
        recordToUse = tableData[0];
      } else {
        // Mock default record
        recordToUse = {
          id: 'TEST_001',
          name: 'Mustermann Max',
          email: 'max.mustermann@example.com',
          betrag: 149.99,
          status: 'Bezahlt',
          created_at: new Date().toISOString()
        };
      }

      const log = await WorkflowExecutionEngine.executeWorkflow(
        workflow,
        'onManual',
        recordToUse,
        undefined,
        { onShowToast }
      );
      setSelectedLog(log);
      setSelectedStepIndex(0);
      if (onShowToast) {
        onShowToast(`Workflow-Testlauf beendet: ${log.status === 'success' ? 'Erfolgreich' : 'Mit Fehlern'} (${log.durationMs}ms)`, log.status === 'success' ? 'success' : 'error');
      }
    } catch (err: any) {
      console.error('Test run failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearLogs = () => {
    const store = useProjectStore.getState();
    const updated = (store.workflows || []).map(w => w.id === workflow.id ? { ...w, executionLogs: [] } : w);
    store.setWorkflows(updated);
    setSelectedLog(null);
    setSelectedStepIndex(null);
    onShowToast?.('Ausführungs-Historie geleert.', 'info');
  };

  const handleExportLogs = () => {
    const jsonStr = JSON.stringify(workflow.executionLogs || [], null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow_${workflow.name.toLowerCase().replace(/\s+/g, '_')}_logs.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast?.('Logs erfolgreich als JSON exportiert.', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="h-80 bg-slate-900 border-t border-slate-800 text-white flex flex-col shrink-0 relative z-20 shadow-2xl" id="workflow-execution-console">
      {/* Top Header Bar */}
      <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Terminal size={15} className="text-emerald-400" />
            <span>Workflow Ausführungs-Historie &amp; Run-Logs</span>
          </div>

          {/* Status Badge */}
          {currentLog && (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
              currentLog.status === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {currentLog.status === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              <span>{currentLog.status === 'success' ? 'Erfolgreich' : currentLog.status === 'cancelled' ? 'Abgebrochen' : 'Fehlgeschlagen'}</span>
              <span className="text-[10px] text-slate-400 font-mono">({currentLog.durationMs || 0}ms)</span>
            </div>
          )}
        </div>

        {/* Test Run Controls & Actions */}
        <div className="flex items-center gap-2">
          {triggerTable && tableData.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Test-Daten:</span>
              <select
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none max-w-[150px] truncate"
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
              >
                <option value="">1. Zeile ({triggerTable.name})</option>
                {tableData.slice(0, 10).map((row, i) => (
                  <option key={row.id || i} value={row.id}>
                    ID: {row.id} - {row.name || row.bezeichnung || row.titel || `Datensatz ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={handleRunTest}
            disabled={isRunning}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
            id="btn-run-workflow-test"
          >
            {isRunning ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
            <span>{isRunning ? 'Läuft...' : 'Testlauf'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportLogs}
            disabled={logs.length === 0}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors disabled:opacity-30"
            title="Logs als JSON exportieren"
          >
            <Download size={13} />
          </button>

          <button
            type="button"
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 rounded transition-colors disabled:opacity-30"
            title="Historie leeren"
          >
            <Trash2 size={13} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors ml-1"
            title="Konsole schließen"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Log History List */}
        <div className="w-64 border-r border-slate-800 bg-slate-950/60 p-2 flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Runs ({logs.length})
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-800 text-[10px] text-slate-300 rounded px-1 py-0.5 border border-slate-700"
            >
              <option value="all">Alle</option>
              <option value="success">Erfolg</option>
              <option value="failed">Fehler</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                Keine Protokolle vorhanden.
              </div>
            ) : (
              logs.map((log) => {
                const isSelected = currentLog?.id === log.id;
                return (
                  <button
                    key={log.id}
                    type="button"
                    onClick={() => {
                      setSelectedLog(log);
                      setSelectedStepIndex(0);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {log.status === 'success' ? (
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle size={13} className="text-rose-400 shrink-0" />
                      )}
                      <span className="truncate">{log.triggeredBy}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {new Date(log.startedAt).toLocaleTimeString('de-DE')}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Step Details, Payload Inspector & E-Mail Preview */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
          {/* Sub Tabs */}
          <div className="px-4 border-b border-slate-800 flex gap-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('steps')}
              className={`py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'steps' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers size={13} />
              <span>Schritt-Protokoll ({currentLog?.steps.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('payload')}
              className={`py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'payload' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 size={13} />
              <span>Payload &amp; Variablen Detail</span>
            </button>

            {currentLog?.emailSentPreview && (
              <button
                onClick={() => setActiveTab('email')}
                className={`py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'email' ? 'border-blue-400 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mail size={13} />
                <span>E-Mail Vorschau</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('json')}
              className={`py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'json' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText size={13} />
              <span>Rohdaten JSON</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-3 overflow-y-auto text-xs">
            {activeTab === 'steps' && currentLog && (
              <div className="space-y-2">
                {currentLog.steps.map((step, idx) => {
                  const isStepSelected = selectedStepIndex === idx;
                  return (
                    <div 
                      key={idx}
                      onClick={() => setSelectedStepIndex(idx)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer font-mono text-[11px] ${
                        isStepSelected 
                          ? 'bg-slate-950 border-emerald-500/60 ring-1 ring-emerald-500/30' 
                          : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {step.status === 'success' && <CheckCircle2 size={14} className="text-emerald-400" />}
                            {step.status === 'failed' && <AlertCircle size={14} className="text-rose-400" />}
                            {step.status === 'info' && <Clock size={14} className="text-blue-400" />}
                            {step.status === 'skipped' && <Clock size={14} className="text-slate-500" />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-200 flex items-center gap-2">
                              <span>{idx + 1}. {step.nodeLabel}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-sans uppercase">
                                {step.nodeType}
                              </span>
                              {step.durationMs && (
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {step.durationMs}ms
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 mt-1 leading-relaxed">{step.details}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-500">
                            {new Date(step.timestamp).toLocaleTimeString('de-DE')}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStepIndex(idx);
                              setActiveTab('payload');
                            }}
                            className="text-[10px] text-amber-400 hover:text-amber-300 underline font-sans"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'payload' && (
              <div className="h-full flex flex-col space-y-3">
                {currentStep ? (
                  <div className="grid grid-cols-2 gap-3 h-full">
                    {/* Left column: Input & Variables Snapshot */}
                    <div className="flex flex-col bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-hidden">
                      <div className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                        <Variable size={13} />
                        <span>Input Payload &amp; Snapshot: {currentStep.nodeLabel}</span>
                      </div>
                      <pre className="flex-1 overflow-y-auto font-mono text-[10px] text-slate-300 p-2 bg-slate-900 rounded border border-slate-800/80">
                        {JSON.stringify(currentStep.inputPayload || currentStep.variablesState || {}, null, 2)}
                      </pre>
                    </div>

                    {/* Right column: Output Payload */}
                    <div className="flex flex-col bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-hidden">
                      <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                        <Code2 size={13} />
                        <span>Output Payload / Result</span>
                      </div>
                      <pre className="flex-1 overflow-y-auto font-mono text-[10px] text-emerald-300 p-2 bg-slate-900 rounded border border-slate-800/80">
                        {JSON.stringify(currentStep.outputPayload || currentStep.output || { status: 'none' }, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    Wählen Sie einen Schritt im Schritt-Protokoll aus, um dessen Ein- und Ausgabedaten zu analysieren.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'email' && currentLog?.emailSentPreview && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 font-sans text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-blue-400 font-bold">
                  <Mail size={16} />
                  <span>Generierte E-Mail Nachricht</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-slate-400">
                  <span className="font-bold text-slate-500">An:</span>
                  <span className="col-span-3 text-slate-200 font-mono">{currentLog.emailSentPreview.to}</span>
                  <span className="font-bold text-slate-500">Betreff:</span>
                  <span className="col-span-3 text-white font-bold">{currentLog.emailSentPreview.subject}</span>
                  {currentLog.emailSentPreview.attachmentName && (
                    <>
                      <span className="font-bold text-slate-500">Anhang:</span>
                      <span className="col-span-3 text-purple-400 font-mono font-bold">
                        📎 {currentLog.emailSentPreview.attachmentName}
                      </span>
                    </>
                  )}
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {currentLog.emailSentPreview.body}
                </div>
              </div>
            )}

            {activeTab === 'json' && currentLog && (
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 font-mono text-[10px] overflow-x-auto">
                {JSON.stringify(currentLog, null, 2)}
              </pre>
            )}

            {!currentLog && (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Klicken Sie oben auf „Testlauf“, um den Workflow auszuführen.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
