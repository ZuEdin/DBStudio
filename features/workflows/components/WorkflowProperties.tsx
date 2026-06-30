
import React from 'react';
import { Node } from '@xyflow/react';
import { Table, FieldType } from '../../../types/index';
import { X, Settings, Database, Info } from 'lucide-react';

interface WorkflowPropertiesProps {
  node: Node | undefined;
  tables: Table[];
  onUpdate: (data: any) => void;
}

export const WorkflowProperties: React.FC<WorkflowPropertiesProps> = ({ node, tables, onUpdate }) => {
  if (!node) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 items-center justify-center p-8 text-center text-slate-400">
        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
          <Info size={24} />
        </div>
        <h4 className="font-bold text-slate-600 text-sm">No node selected</h4>
        <p className="text-xs mt-2 leading-relaxed">Select a node on the canvas to configure its properties and logic.</p>
      </div>
    );
  }

  const renderTriggerProperties = () => {
    const config = node.data.triggerConfig || {};
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Trigger Event</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            value={config.event || ''}
            onChange={(e) => onUpdate({ triggerConfig: { ...config, event: e.target.value } })}
          >
            <option value="">Select Event...</option>
            <option value="onCreate">On Record Created</option>
            <option value="onUpdate">On Record Updated</option>
            <option value="onDelete">On Record Deleted</option>
            <option value="schedule">Scheduled (Cron)</option>
          </select>
        </div>

        {config.event !== 'schedule' && (
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Table</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              value={config.tableId || ''}
              onChange={(e) => onUpdate({ triggerConfig: { ...config, tableId: e.target.value } })}
            >
              <option value="">Select Table...</option>
              {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        {config.event === 'schedule' && (
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cron Expression</label>
            <input 
              type="text"
              placeholder="0 0 * * *"
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              value={config.cronExpression || ''}
              onChange={(e) => onUpdate({ triggerConfig: { ...config, cronExpression: e.target.value } })}
            />
            <p className="text-[9px] text-slate-400 mt-1 italic">Example: "0 0 * * *" for daily at midnight.</p>
          </div>
        )}
      </div>
    );
  };

  const renderActionProperties = () => {
    const config = node.data.actionConfig || {};
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Action Type</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            value={config.actionType || ''}
            onChange={(e) => onUpdate({ actionConfig: { ...config, actionType: e.target.value } })}
          >
            <option value="">Select Action...</option>
            <option value="createRecord">Create Record</option>
            <option value="updateRecord">Update Record</option>
            <option value="sendEmail">Send Email</option>
          </select>
        </div>

        {config.actionType === 'sendEmail' && (
          <>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recipient (To)</label>
              <input 
                type="text"
                placeholder="email@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                value={config.emailTo || ''}
                onChange={(e) => onUpdate({ actionConfig: { ...config, emailTo: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
              <input 
                type="text"
                placeholder="Workflow Notification"
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                value={config.emailSubject || ''}
                onChange={(e) => onUpdate({ actionConfig: { ...config, emailSubject: e.target.value } })}
              />
            </div>
          </>
        )}
      </div>
    );
  };

  const renderConditionProperties = () => {
      const config = node.data.conditionConfig || {};
      return (
          <div className="space-y-4">
              <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Field to Check</label>
                  <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                      value={config.fieldId || ''}
                      onChange={(e) => onUpdate({ conditionConfig: { ...config, fieldId: e.target.value } })}
                  >
                      <option value="">Select Field...</option>
                      {tables.flatMap(t => t.fields.map(f => <option key={`${t.id}-${f.id}`} value={f.id}>{t.name}.{f.name}</option>))}
                  </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Operator</label>
                    <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                        value={config.operator || ''}
                        onChange={(e) => onUpdate({ conditionConfig: { ...config, operator: e.target.value } })}
                    >
                        <option value="eq">==</option>
                        <option value="neq">!=</option>
                        <option value="gt">&gt;</option>
                        <option value="lt">&lt;</option>
                        <option value="contains">Contains</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Value</label>
                    <input 
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                        value={config.value || ''}
                        onChange={(e) => onUpdate({ conditionConfig: { ...config, value: e.target.value } })}
                    />
                </div>
              </div>
          </div>
      );
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Settings size={16} className="text-slate-400" />
          Properties
        </h3>
        <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">{node.id.split('-')[0]}</span>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Node Label</label>
          <input 
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-slate-400 outline-none"
            value={node.data.label || ''}
            onChange={(e) => onUpdate({ label: e.target.value })}
          />
        </div>

        <div className="border-t border-slate-100 pt-6">
          {node.type === 'triggerNode' && renderTriggerProperties()}
          {node.type === 'actionNode' && renderActionProperties()}
          {node.type === 'conditionNode' && renderConditionProperties()}
        </div>
      </div>

      <div className="mt-auto p-4 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Database size={12} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Metadata</span>
        </div>
        <div className="grid grid-cols-2 gap-y-2 text-[10px]">
            <span className="text-slate-400">Position X:</span>
            <span className="text-slate-600 font-mono text-right">{Math.round(node.position.x)}</span>
            <span className="text-slate-400">Position Y:</span>
            <span className="text-slate-600 font-mono text-right">{Math.round(node.position.y)}</span>
            <span className="text-slate-400">Type:</span>
            <span className="text-slate-600 text-right uppercase">{node.type}</span>
        </div>
      </div>
    </div>
  );
};
