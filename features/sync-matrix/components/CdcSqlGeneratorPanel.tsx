import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  Download, 
  Check, 
  Database, 
  Cloud, 
  Terminal,
  Sparkles
} from 'lucide-react';
import { useSyncMatrixStore } from '../stores/useSyncMatrixStore';
import { SyncMatrixEngine } from '../services/syncMatrixEngine';

export const CdcSqlGeneratorPanel: React.FC = () => {
  const { rules } = useSyncMatrixStore();
  const [activeTab, setActiveTab] = useState<'postgres' | 'sqlite'>('postgres');
  const [copied, setCopied] = useState(false);

  const postgresSql = SyncMatrixEngine.generatePostgresCdcDdl(rules);
  const sqliteSql = SyncMatrixEngine.generateSqliteCdcDdl(rules);

  const currentSql = activeTab === 'postgres' ? postgresSql : sqliteSql;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = activeTab === 'postgres' ? 'postgres_cdc_triggers.sql' : 'sqlite_cdc_triggers.sql';
    const blob = new Blob([currentSql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Tabs & Actions */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
            <button
              onClick={() => setActiveTab('postgres')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'postgres'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>PostgreSQL CDC Triggers & Pub</span>
            </button>
            <button
              onClick={() => setActiveTab('sqlite')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'sqlite'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>SQLite Shadow Log DDL</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.SQL Datei exportieren</span>
          </button>
        </div>
      </div>

      {/* Code Editor Container */}
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-200 overflow-auto shadow-inner leading-relaxed">
        <pre className="whitespace-pre">{currentSql}</pre>
      </div>
    </div>
  );
};
