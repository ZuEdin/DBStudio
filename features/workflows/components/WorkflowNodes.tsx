import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  Play, 
  Database, 
  Mail, 
  FileSpreadsheet, 
  Bell, 
  HelpCircle, 
  RotateCcw, 
  Globe, 
  Clock, 
  Code2, 
  CheckCircle2, 
  AlertCircle,
  PlusCircle,
  Edit3,
  Trash2,
  Calculator,
  Loader2,
  Bug
} from 'lucide-react';
import { WorkflowNodeData } from '../../../types/workflow';

interface CustomNodeProps {
  id?: string;
  data: WorkflowNodeData;
  isConnectable?: boolean;
  selected?: boolean;
}

// ----------------------------------------------------
// SHARED NODE SHELL WITH BREAKPOINT & DEBUG HIGHLIGHT
// ----------------------------------------------------
interface NodeShellProps {
  nodeId?: string;
  data: WorkflowNodeData;
  selected?: boolean;
  borderColor: string;
  ringColor: string;
  badgeBg: string;
  badgeText: string;
  categoryLabel: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  minWidth?: string;
  topInput?: boolean;
  bottomOutput?: boolean;
  isConnectable?: boolean;
  children?: React.ReactNode;
  sourceHandleId?: string;
}

const NodeShell: React.FC<NodeShellProps> = ({
  nodeId,
  data,
  selected,
  borderColor,
  ringColor,
  badgeBg,
  badgeText,
  categoryLabel,
  icon,
  title,
  subtitle,
  minWidth = 'min-w-[210px]',
  topInput = true,
  bottomOutput = true,
  isConnectable,
  children,
  sourceHandleId = 'output'
}) => {
  const hasBreakpoint = Boolean(data.hasBreakpoint);
  const isCurrentDebug = Boolean(data.isCurrentDebug);

  const toggleBreakpoint = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && nodeId) {
      window.dispatchEvent(
        new CustomEvent('workflow:toggle-breakpoint', {
          detail: { nodeId }
        })
      );
    }
  };

  return (
    <div
      className={`relative px-4 py-3 shadow-md rounded-xl bg-white border-2 ${minWidth} transition-all select-none ${
        isCurrentDebug 
          ? 'border-amber-500 ring-4 ring-amber-300 shadow-xl shadow-amber-100 z-50' 
          : selected 
            ? `${borderColor} ring-2 ${ringColor}` 
            : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      {/* Top Input Handle */}
      {topInput && (
        <Handle
          type="target"
          position={Position.Top}
          id="input"
          isConnectable={isConnectable}
          className="w-3 h-3 bg-slate-400 border-2 border-white"
        />
      )}

      {/* Breakpoint Button (Top-Left) */}
      <button
        type="button"
        onClick={toggleBreakpoint}
        title={hasBreakpoint ? 'Breakpoint entfernen' : 'Breakpoint setzen (F9)'}
        className={`absolute -top-2.5 -left-2.5 z-20 flex items-center justify-center rounded-full transition-transform hover:scale-125 focus:outline-none ${
          hasBreakpoint 
            ? 'w-5 h-5 bg-rose-600 border-2 border-white shadow-md text-white' 
            : 'w-4 h-4 bg-slate-200 hover:bg-rose-400 border border-slate-300 opacity-30 hover:opacity-100'
        }`}
      >
        {hasBreakpoint ? <span className="w-1.5 h-1.5 rounded-full bg-white" /> : null}
      </button>

      {/* Debugger Active Badge */}
      {isCurrentDebug && (
        <div className="absolute -top-3 right-2 z-20 px-2 py-0.5 bg-amber-500 text-white font-bold text-[9px] uppercase tracking-wider rounded-full shadow flex items-center gap-1 animate-bounce">
          <Bug size={10} />
          <span>Debugger Pausiert</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <div className={`p-1.5 rounded-lg ${badgeBg} ${badgeText}`}>
            {icon}
          </div>
          <span className={`font-bold text-[10px] uppercase tracking-wider ${badgeText}`}>
            {categoryLabel}
          </span>
        </div>

        {/* Node status / execution indicator */}
        <div className="flex items-center gap-1">
          {data.status === 'running' && (
            <Loader2 size={12} className="text-amber-500 animate-spin" />
          )}
          {data.status === 'success' && (
            <CheckCircle2 size={12} className="text-emerald-600" />
          )}
          {data.status === 'failed' && (
            <AlertCircle size={12} className="text-rose-600" />
          )}
          {hasBreakpoint && !isCurrentDebug && (
            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 rounded">BP</span>
          )}
        </div>
      </div>

      {/* Main title & subtitle */}
      <div className="font-bold text-xs text-slate-800 mt-1 truncate max-w-[200px]">{title}</div>
      {subtitle && (
        <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]">
          {subtitle}
        </div>
      )}

      {/* Extra children (e.g. true/false ports) */}
      {children}

      {/* Standard Bottom Output Handle */}
      {bottomOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          id={sourceHandleId}
          isConnectable={isConnectable}
          className="w-3 h-3 bg-indigo-600 border-2 border-white"
        />
      )}
    </div>
  );
};

// ----------------------------------------------------
// 1. TRIGGER NODE
// ----------------------------------------------------
export const TriggerNode: React.FC<CustomNodeProps> = ({ id, data, isConnectable, selected }) => {
  const event = data.triggerConfig?.event || 'onCreate';
  const eventLabels: Record<string, string> = {
    onCreate: 'Datensatz erstellt (onCreate)',
    onUpdate: 'Datensatz geändert (onUpdate)',
    onDelete: 'Datensatz gelöscht (onDelete)',
    onFieldChange: 'Feldwert geändert',
    onSchedule: 'Zeitgesteuert (Cron)',
    onManual: 'Manueller Start / Klick',
    onFormSubmit: 'Formular abgesendet'
  };

  return (
    <NodeShell
      nodeId={id}
      data={data}
      selected={selected}
      topInput={false}
      bottomOutput={true}
      isConnectable={isConnectable}
      borderColor="border-indigo-600"
      ringColor="ring-indigo-200"
      badgeBg="bg-indigo-50"
      badgeText="text-indigo-700"
      categoryLabel="Trigger"
      icon={<Play size={13} fill="currentColor" />}
      title={data.label || 'Workflow Start'}
      subtitle={eventLabels[event] || event}
    />
  );
};

// ----------------------------------------------------
// 2. DATABASE ACTION NODE (Create, Update, Delete, Calculate)
// ----------------------------------------------------
export const DatabaseActionNode: React.FC<CustomNodeProps> = ({ id, data, isConnectable, selected }) => {
  const dbCfg = data.databaseActionConfig || (data.actionConfig as any) || {};
  const actionType = dbCfg.actionType || 'createRecord';

  const actionIcons: Record<string, React.ReactNode> = {
    createRecord: <PlusCircle size={13} className="text-emerald-600" />,
    updateRecord: <Edit3 size={13} className="text-blue-600" />,
    deleteRecord: <Trash2 size={13} className="text-rose-600" />,
    calculateField: <Calculator size={13} className="text-amber-600" />,
    filterRecords: <Database size={13} className="text-indigo-600" />
  };

  const actionLabels: Record<string, string> = {
    createRecord: 'Datensatz anlegen',
    updateRecord: 'Datensatz aktualisieren',
    deleteRecord: 'Datensatz löschen',
    calculateField: 'Formel berechnen',
    filterRecords: 'Daten filtern'
  };

  return (
    <NodeShell
      nodeId={id}
      data={data}
      selected={selected}
      isConnectable={isConnectable}
      borderColor="border-emerald-600"
      ringColor="ring-emerald-200"
      badgeBg="bg-emerald-50"
      badgeText="text-emerald-700"
      categoryLabel="Datenbank"
      icon={actionIcons[actionType] || <Database size={13} />}
      title={data.label || 'Datenbank-Aktion'}
      subtitle={actionLabels[actionType] || actionType}
    />
  );
};

// ----------------------------------------------------
// 3. EMAIL ACTION NODE
// ----------------------------------------------------
export const EmailActionNode: React.FC<CustomNodeProps> = ({ id, data, isConnectable, selected }) => {
  const emailCfg = (data.emailActionConfig || (data.actionConfig as any) || {}) as any;

  return (
    <NodeShell
      nodeId={id}
      data={data}
      selected={selected}
      isConnectable={isConnectable}
      borderColor="border-blue-600"
      ringColor="ring-blue-200"
      badgeBg="bg-blue-50"
      badgeText="text-blue-700"
      categoryLabel="E-Mail Versand"
      icon={<Mail size={13} />}
      title={data.label || 'E-Mail senden'}
      subtitle={`An: ${emailCfg.to || '{{trigger.email}}'}`}
    />
  );
};

// ----------------------------------------------------
// 4. EXPORT ACTION NODE (PDF, EXCEL, CSV)
// ----------------------------------------------------
export const ExportActionNode: React.FC<CustomNodeProps> = ({ id, data, isConnectable, selected }) => {
  const exportCfg = data.exportActionConfig;
  const type = (exportCfg?.exportType || 'excel').toUpperCase();

  return (
    <NodeShell
      nodeId={id}
      data={data}
      selected={selected}
      isConnectable={isConnectable}
      borderColor="border-purple-600"
      ringColor="ring-purple-200"
      badgeBg="bg-purple-50"
      badgeText="text-purple-700"
      categoryLabel="Dokument-Export"
      icon={<FileSpreadsheet size={13} />}
      title={data.label || 'Export generieren'}
      subtitle={`Format: ${type}`}
    />
  );
};

// ----------------------------------------------------
// 5. NOTIFICATION ACTION NODE (Toast / Message Box)
// ----------------------------------------------------
export const NotificationActionNode: React.FC<CustomNodeProps> = ({ id, data, isConnectable, selected }) => {
  const notifCfg = data.notificationActionConfig;

  return (
    <NodeShell
      nodeId={id}
      data={data}
      selected={selected}
      isConnectable={isConnectable}
      borderColor="border-teal-600"
      ringColor="ring-teal-200"
      badgeBg="bg-teal-50"
      badgeText="text-teal-700"
      categoryLabel="Benachrichtigung"
      icon={<Bell size={13} />}
      title={data.label || 'Toast / Dialog'}
      subtitle={notifCfg?.message || 'Benachrichtigung anzeigen'}
    />
  );
};

// ----------------------------------------------------
// 6. CONDITION NODE (IF / ELSE WITH DUAL PORTS)
// ----------------------------------------------------
export const ConditionNode: React.FC<CustomNodeProps> = ({ id, data, isConnectable, selected }) => {
  const cond = data.conditionConfig;

  return (
    <NodeShell
      nodeId={id}
      data={data}
      selected={selected}
      bottomOutput={false}
      isConnectable={isConnectable}
      borderColor="border-amber-500"
      ringColor="ring-amber-200"
      badgeBg="bg-amber-50"
      badgeText="text-amber-700"
      categoryLabel="Bedingung (IF)"
      icon={<HelpCircle size={13} />}
      title={data.label || 'Prüfung'}
      subtitle={cond?.fieldId ? `${cond.fieldId} ${cond.operator} ${cond.value || ''}` : 'Regel definieren...'}
    >
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-[10px] font-bold">
        <div className="flex items-center gap-1 text-emerald-600 relative">
          <span>✓ Wahr</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            isConnectable={isConnectable}
            className="!left-4 !bottom-[-16px] w-3 h-3 bg-emerald-500 border-2 border-white"
          />
        </div>
        <div className="flex items-center gap-1 text-rose-500 relative">
          <span>✗ Falsch</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            isConnectable={isConnectable}
            className="!left-auto !right-4 !bottom-[-16px] w-3 h-3 bg-rose-500 border-2 border-white"
          />
        </div>
      </div>
    </NodeShell>
  );
};

// ----------------------------------------------------
// 7. LOOP NODE (FOR EACH WITH DUAL PORTS)
// ----------------------------------------------------
export const LoopNode: React.FC<CustomNodeProps> = ({ id, data, isConnectable, selected }) => {
  return (
    <NodeShell
      nodeId={id}
      data={data}
      selected={selected}
      bottomOutput={false}
      isConnectable={isConnectable}
      borderColor="border-orange-500"
      ringColor="ring-orange-200"
      badgeBg="bg-orange-50"
      badgeText="text-orange-700"
      categoryLabel="Schleife (Loop)"
      icon={<RotateCcw size={13} />}
      title={data.label || 'Für jeden Eintrag'}
      subtitle="Variable: item"
    >
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-[10px] font-bold">
        <div className="flex items-center gap-1 text-orange-600 relative">
          <span>Schleife</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="body"
            isConnectable={isConnectable}
            className="!left-4 !bottom-[-16px] w-3 h-3 bg-orange-500 border-2 border-white"
          />
        </div>
        <div className="flex items-center gap-1 text-slate-600 relative">
          <span>Nachher</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="after"
            isConnectable={isConnectable}
            className="!left-auto !right-4 !bottom-[-16px] w-3 h-3 bg-slate-500 border-2 border-white"
          />
        </div>
      </div>
    </NodeShell>
  );
};

// ----------------------------------------------------
// 8. API CALL NODE
// ----------------------------------------------------
export const ApiNode: React.FC<CustomNodeProps> = ({ id, data, isConnectable, selected }) => {
  const apiCfg = data.apiConfig;

  return (
    <NodeShell
      nodeId={id}
      data={data}
      selected={selected}
      isConnectable={isConnectable}
      borderColor="border-sky-600"
      ringColor="ring-sky-200"
      badgeBg="bg-sky-50"
      badgeText="text-sky-700"
      categoryLabel="REST API / Webhook"
      icon={<Globe size={13} />}
      title={data.label || 'API Aufruf'}
      subtitle={`${apiCfg?.method || 'POST'} ${apiCfg?.url || 'https://api.domain.com'}`}
    />
  );
};

// ----------------------------------------------------
// 9. DELAY NODE (Timer)
// ----------------------------------------------------
export const DelayNode: React.FC<CustomNodeProps> = ({ id, data, isConnectable, selected }) => {
  const secs = data.delayConfig?.seconds || 5;

  return (
    <NodeShell
      nodeId={id}
      data={data}
      selected={selected}
      isConnectable={isConnectable}
      borderColor="border-slate-600"
      ringColor="ring-slate-200"
      badgeBg="bg-slate-100"
      badgeText="text-slate-700"
      categoryLabel="Wartezeit"
      icon={<Clock size={13} />}
      title={data.label || 'Verzögerung'}
      subtitle={`Warte ${secs} Sekunden`}
    />
  );
};

// ----------------------------------------------------
// 10. SCRIPT NODE (Custom JS)
// ----------------------------------------------------
export const ScriptNode: React.FC<CustomNodeProps> = ({ id, data, isConnectable, selected }) => {
  return (
    <NodeShell
      nodeId={id}
      data={data}
      selected={selected}
      isConnectable={isConnectable}
      borderColor="border-pink-600"
      ringColor="ring-pink-200"
      badgeBg="bg-pink-50"
      badgeText="text-pink-700"
      categoryLabel="Code Script"
      icon={<Code2 size={13} />}
      title={data.label || 'JS Sandbox'}
      subtitle="(ctx, record) => ..."
    />
  );
};

export const customNodeTypes = {
  triggerNode: TriggerNode,
  databaseActionNode: DatabaseActionNode,
  emailActionNode: EmailActionNode,
  exportActionNode: ExportActionNode,
  notificationActionNode: NotificationActionNode,
  conditionNode: ConditionNode,
  loopNode: LoopNode,
  apiNode: ApiNode,
  delayNode: DelayNode,
  scriptNode: ScriptNode,
  // Backwards compatibility aliases
  actionNode: DatabaseActionNode,
  uploadNode: ExportActionNode
};
