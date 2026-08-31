import React, { useState } from 'react';
import { Workflow } from '../../types/index';
import { 
  CalendarClock, 
  Play, 
  Edit, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  RotateCw 
} from 'lucide-react';
import { CronBuilderModal } from './CronBuilderModal';
import { describeCronExpression, calculateNextCronRun } from './utils/cronHelper';
import { WorkflowExecutionEngine } from '../logic/WorkflowEngine';
import { useProjectStore } from '../../stores/useProjectStore';

interface SchedulerViewProps {
  workflows: Workflow[];
  onUpdateWorkflow: (workflow: Workflow) => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const SchedulerView: React.FC<SchedulerViewProps> = ({ 
  workflows, 
  onUpdateWorkflow,
  onShowToast 
}) => {
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  const [executingWorkflowId, setExecutingWorkflowId] = useState<string | null>(null);
  const store = useProjectStore();

  // Filter workflows that have at least one schedule trigger node, and deduplicate by ID
  const scheduledWorkflows = workflows.filter((w, index, self) => 
      w.nodes.some(n => n.type === 'triggerNode' && (n.data?.triggerConfig?.event === 'onSchedule' || (n.data?.triggerConfig?.event as string) === 'schedule')) &&
      self.findIndex(t => t.id === w.id) === index
  );

  const getCronExpression = (wf: Workflow) => {
      const node = wf.nodes.find(n => n.type === 'triggerNode' && (n.data?.triggerConfig?.event === 'onSchedule' || (n.data?.triggerConfig?.event as string) === 'schedule'));
      return node?.data?.triggerConfig?.cronExpression || '0 8 * * *';
  };

  const updateCron = (cron: string) => {
      if (!editingWorkflowId) return;
      const wf = workflows.find(w => w.id === editingWorkflowId);
      if (!wf) return;

      const newNodes = wf.nodes.map(n => {
          if (n.type === 'triggerNode' && (n.data?.triggerConfig?.event === 'onSchedule' || (n.data?.triggerConfig?.event as string) === 'schedule')) {
              return { ...n, data: { ...n.data, triggerConfig: { ...n.data.triggerConfig, cronExpression: cron } } };
          }
          return n;
      });
      
      onUpdateWorkflow({ ...wf, nodes: newNodes });
      setEditingWorkflowId(null);
      onShowToast?.(`Zeitplan für "${wf.name}" aktualisiert: ${describeCronExpression(cron)}`, 'success');
  };

  const handleManualTrigger = async (wf: Workflow) => {
    setExecutingWorkflowId(wf.id);
    try {
      const triggerTable = store.tables.find(t => t.id === wf.nodes.find(n => n.type === 'triggerNode')?.data.triggerConfig?.tableId) || store.tables[0];
      const record = triggerTable?.data?.[0] || { id: 'SCHED_001', name: 'Scheduled Job Trigger', betrag: 0 };
      
      const log = await WorkflowExecutionEngine.executeWorkflow(
        wf,
        'onSchedule',
        record,
        undefined,
        { onShowToast }
      );

      // Persist log into store
      const updatedWorkflows = (store.workflows || []).map(w => w.id === wf.id ? {
        ...w,
        executionLogs: [log, ...(w.executionLogs || [])].slice(0, 50)
      } : w);
      store.setWorkflows(updatedWorkflows);

      onShowToast?.(`Job "${wf.name}" manuell ausgeführt: ${log.status === 'success' ? 'Erfolgreich' : 'Fehlgeschlagen'} (${log.durationMs}ms)`, log.status === 'success' ? 'success' : 'error');
    } catch (err: any) {
      console.error('Trigger failed:', err);
    } finally {
      setExecutingWorkflowId(null);
    }
  };

  return (
    <div className="p-8 h-full bg-slate-100 overflow-y-auto" id="scheduler-view-root">
        <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-600 rounded-2xl text-white shadow-lg shadow-teal-600/20">
                      <CalendarClock size={32} />
                  </div>
                  <div>
                      <h1 className="text-2xl font-bold text-slate-800">Zeitplaner &amp; Cron-Trigger (Job Scheduler)</h1>
                      <p className="text-sm text-slate-500">Verwalten Sie zeitgesteuerte Hintergrund-Prozesse, automatische Synchronisationen &amp; Exporte.</p>
                  </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm">
                  {scheduledWorkflows.length} Geplante Jobs aktiv
                </span>
              </div>
            </div>

            {/* Jobs Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center">
                    <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                      Geplante Aufgaben &amp; Automatisierungen ({scheduledWorkflows.length})
                    </span>
                </div>
                
                {scheduledWorkflows.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Clock size={48} className="mx-auto mb-4 opacity-20"/>
                        <p className="font-bold text-slate-600">Keine zeitgesteuerten Workflows gefunden.</p>
                        <p className="text-xs mt-2 text-slate-400">
                          Erstellen Sie im Workflow-Studio einen neuen Workflow und wählen Sie beim Trigger-Knoten die Option <strong>„Zeitgesteuert (Cron / Intervall)“</strong>.
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Job Name (Workflow)</th>
                                <th className="p-4">Intervall (Cron)</th>
                                <th className="p-4">Bedeutung</th>
                                <th className="p-4">Nächster Lauf (Next Run)</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {scheduledWorkflows.map((wf, index) => {
                                const cron = getCronExpression(wf);
                                const isExecuting = executingWorkflowId === wf.id;
                                const nextRun = calculateNextCronRun(cron);

                                return (
                                    <tr key={`${wf.id}-${index}`} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 font-bold text-slate-800 flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
                                              <Zap size={14} />
                                            </div>
                                            <div>
                                              <div>{wf.name}</div>
                                              <div className="text-[10px] text-slate-400 font-normal">
                                                {wf.nodes.length} Knoten • {wf.executionLogs?.length || 0} Runs
                                              </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-indigo-600 font-bold">
                                            <span className="bg-indigo-50 border border-indigo-100 px-2 py-1 rounded">
                                              {cron}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-600 font-medium">
                                            {describeCronExpression(cron)}
                                        </td>
                                        <td className="p-4 text-slate-500 font-mono text-[11px]">
                                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                                              <Clock size={13} className="text-teal-600" />
                                              <span>{nextRun.nextDate.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} Uhr</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {wf.active ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Aktiv
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                    Inaktiv
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                              <button 
                                                  type="button"
                                                  onClick={() => handleManualTrigger(wf)}
                                                  disabled={isExecuting}
                                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition-colors border border-emerald-200 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                  title="Workflow jetzt sofort ausführen"
                                              >
                                                  {isExecuting ? <RotateCw size={13} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
                                                  <span>{isExecuting ? 'Läuft...' : 'Jetzt triggern'}</span>
                                              </button>

                                              <button 
                                                  type="button"
                                                  onClick={() => setEditingWorkflowId(wf.id)}
                                                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg transition-colors border border-slate-200 flex items-center gap-1 cursor-pointer"
                                                  title="Cron-Zeitplan anpassen"
                                              >
                                                  <Edit size={13}/>
                                                  <span>Ändern</span>
                                              </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Information Card */}
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-teal-700 shrink-0 mt-0.5" size={20} />
                <div className="text-xs text-teal-900 leading-relaxed">
                    <strong className="block mb-1 text-sm text-teal-950">Vollautomatische Server-Synchronisation:</strong>
                    Bei Generierung Ihrer Anwendung werden die Zeitpläne automatisch in typsichere Hintergrund-Scheduler überführt:
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                        <li><strong>Node.js Express:</strong> Generiert <code>node-cron</code> Job-Worker mit Fehler-Logging und Reconnect-Logik.</li>
                        <li><strong>.NET 10:</strong> Generiert <code>Quartz.NET</code> Hosted Services mit DI-Lifecycle und Transaktionssicherheit.</li>
                    </ul>
                </div>
            </div>
        </div>

        {editingWorkflowId && (
            <CronBuilderModal 
                initialValue={getCronExpression(workflows.find(w => w.id === editingWorkflowId)!)}
                onSave={updateCron}
                onClose={() => setEditingWorkflowId(null)}
            />
        )}
    </div>
  );
};
