import React, { useState } from 'react';
import { GeneratedMigrations } from '../schemaDiffTypes';
import { Copy, Check, Download, FileCode, Layers } from 'lucide-react';

interface MigrationCodeViewerProps {
  migrations: GeneratedMigrations;
  dbType: string;
}

export const MigrationCodeViewer: React.FC<MigrationCodeViewerProps> = ({ migrations, dbType }) => {
  const [subTab, setSubTab] = useState<'sql_up' | 'sql_down' | 'flyway' | 'liquibase_xml' | 'liquibase_yaml' | 'liquibase_sql'>('sql_up');
  const [copied, setCopied] = useState(false);

  const getActiveCode = () => {
    switch (subTab) {
      case 'sql_up': return { code: migrations.sqlUp, lang: 'sql', filename: `migration_up_${dbType}.sql` };
      case 'sql_down': return { code: migrations.sqlDown, lang: 'sql', filename: `migration_down_${dbType}.sql` };
      case 'flyway': return { code: migrations.flywayUpScript, lang: 'sql', filename: migrations.flywayUpFilename };
      case 'liquibase_xml': return { code: migrations.liquibaseXml, lang: 'xml', filename: 'changelog.xml' };
      case 'liquibase_yaml': return { code: migrations.liquibaseYaml, lang: 'yaml', filename: 'changelog.yaml' };
      case 'liquibase_sql': return { code: migrations.liquibaseSql, lang: 'sql', filename: 'changelog.sql' };
    }
  };

  const active = getActiveCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(active.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([active.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = active.filename;
    link.click();
  };

  return (
    <div className="space-y-3">
      {/* Sub tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSubTab('sql_up')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              subTab === 'sql_up' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            SQL Up (Migration)
          </button>
          <button
            onClick={() => setSubTab('sql_down')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              subTab === 'sql_down' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            SQL Down (Rollback)
          </button>
          <button
            onClick={() => setSubTab('flyway')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              subTab === 'flyway' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Flyway ({migrations.flywayUpFilename})
          </button>
          <button
            onClick={() => setSubTab('liquibase_xml')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              subTab === 'liquibase_xml' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Liquibase (XML)
          </button>
          <button
            onClick={() => setSubTab('liquibase_yaml')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              subTab === 'liquibase_yaml' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Liquibase (YAML)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs transition-all"
          >
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs transition-all"
          >
            <Download size={12} />
            <span>Download ({active.filename})</span>
          </button>
        </div>
      </div>

      {/* Code Display */}
      <div className="relative">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[320px] shadow-inner">
          <pre>{active.code}</pre>
        </div>
        <div className="absolute right-3 top-3 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-slate-700/60">
          {active.filename}
        </div>
      </div>
    </div>
  );
};
