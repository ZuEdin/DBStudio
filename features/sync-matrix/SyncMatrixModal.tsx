import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Layers, 
  AlertTriangle, 
  FileCode, 
  Terminal, 
  X, 
  Sparkles,
  ArrowLeftRight
} from 'lucide-react';
import { useSyncMatrixStore } from './stores/useSyncMatrixStore';
import { useProjectStore } from '../../stores/useProjectStore';
import { SyncMatrixOverview } from './components/SyncMatrixOverview';
import { ReplicationRuleEditor } from './components/ReplicationRuleEditor';
import { ConflictResolutionDrawer } from './components/ConflictResolutionDrawer';
import { CdcSqlGeneratorPanel } from './components/CdcSqlGeneratorPanel';
import { ReplicationExecutionLog } from './components/ReplicationExecutionLog';
import { ReplicationRule } from './types';

interface SyncMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncMatrixModal: React.FC<SyncMatrixModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { tables } = useProjectStore();
  const { 
    rules, 
    initRulesFromTables, 
    conflicts, 
    selectedRuleId, 
    setSelectedRuleId,
    runSyncBatch 
  } = useSyncMatrixStore();

  const [activeTab, setActiveTab] = useState<'matrix' | 'editor' | 'conflicts' | 'cdc_sql' | 'logs'>('matrix');

  useEffect(() => {
    if (isOpen && tables.length > 0) {
      initRulesFromTables(tables);
    }
  }, [isOpen, tables]);

  if (!isOpen) return null;

  const pendingConflicts = conflicts.filter(c => c.status === 'pending');
  const selectedRule = rules.find(r => r.id === selectedRuleId) || rules[0];

  const handleSelectRule = (rule: ReplicationRule) => {
    setSelectedRuleId(rule.id);
    setActiveTab('editor');
  };

  const handleRunSync = () => {
    setActiveTab('logs');
    runSyncBatch(tables);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-5xl w-full h-[88vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-xs">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Multi-DB Sync Matrix & Hybrid-Replikation
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  SQLite ⮀ PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Heterogene Replikationsregeln, Last-Write-Wins, Server-Authoritative & 3-Wege-Merge
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'matrix'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Replikations-Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'editor'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Regel-Editor {selectedRule ? `(${selectedRule.tableName})` : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('conflicts')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'conflicts'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Konflikt-Manager</span>
            {pendingConflicts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {pendingConflicts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('cdc_sql')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'cdc_sql'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>CDC Trigger & SQL DDL</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'logs'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Live Replikator & Logs</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-4 overflow-hidden">
          {activeTab === 'matrix' && (
            <SyncMatrixOverview
              onSelectRule={handleSelectRule}
              onOpenConflictModal={() => setActiveTab('conflicts')}
              onRunSync={handleRunSync}
            />
          )}

          {activeTab === 'editor' && selectedRule && (
            <ReplicationRuleEditor
              rule={selectedRule}
              onBack={() => setActiveTab('matrix')}
            />
          )}

          {activeTab === 'conflicts' && (
            <ConflictResolutionDrawer
              onClose={() => setActiveTab('matrix')}
            />
          )}

          {activeTab === 'cdc_sql' && (
            <CdcSqlGeneratorPanel />
          )}

          {activeTab === 'logs' && (
            <ReplicationExecutionLog />
          )}
        </div>
      </div>
    </div>
  );
};
