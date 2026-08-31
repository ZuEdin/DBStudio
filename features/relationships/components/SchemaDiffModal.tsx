import React, { useState, useEffect } from 'react';
import { Table, Relationship } from '../../../types/index';
import { SchemaDiffService } from '../services/schemaDiffService';
import { SchemaDiffItem } from '../types/erDesignerTypes';
import { 
  GitCompare, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Copy, 
  Check, 
  Download, 
  X, 
  Layers, 
  Camera, 
  RefreshCw 
} from 'lucide-react';

interface SchemaDiffModalProps {
  currentTables: Table[];
  currentRelationships: Relationship[];
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaDiffModal: React.FC<SchemaDiffModalProps> = ({
  currentTables,
  currentRelationships,
  isOpen,
  onClose,
}) => {
  const [snapshotTables, setSnapshotTables] = useState<Table[]>([]);
  const [snapshotRelationships, setSnapshotRelationships] = useState<Relationship[]>([]);
  const [dialect, setDialect] = useState<'postgres' | 'mysql' | 'sqlite'>('postgres');
  const [activeTab, setActiveTab] = useState<'diff' | 'up_script' | 'down_script'>('diff');
  const [copied, setCopied] = useState<boolean>(false);

  // Initialize or load snapshot from localStorage / session
  useEffect(() => {
    if (isOpen && snapshotTables.length === 0) {
      const savedSnapshot = localStorage.getItem('db_schema_snapshot');
      if (savedSnapshot) {
        try {
          const parsed = JSON.parse(savedSnapshot);
          setSnapshotTables(parsed.tables || []);
          setSnapshotRelationships(parsed.relationships || []);
        } catch (e) {
          // Fallback to empty snapshot
        }
      }
    }
  }, [isOpen, snapshotTables.length]);

  if (!isOpen) return null;

  const handleTakeSnapshot = () => {
    setSnapshotTables(JSON.parse(JSON.stringify(currentTables)));
    setSnapshotRelationships(JSON.parse(JSON.stringify(currentRelationships)));
    localStorage.setItem(
      'db_schema_snapshot',
      JSON.stringify({
        tables: currentTables,
        relationships: currentRelationships,
        timestamp: new Date().toISOString()
      })
    );
  };

  const diffItems: SchemaDiffItem[] = SchemaDiffService.compareSchemas(
    snapshotTables,
    snapshotRelationships,
    currentTables,
    currentRelationships
  );

  const { upScript, downScript } = SchemaDiffService.generateMigrationScript(diffItems, dialect);

  const handleCopyScript = (scriptText: string) => {
    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = (scriptText: string, filename: string) => {
    const blob = new Blob([scriptText], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click;
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg">
              <GitCompare size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Schema-Diff & Migration Engine</h2>
              <p className="text-xs text-neutral-500">Vergleichen Sie Modelländerungen und exportieren Sie UP / DOWN Migrationsskripte</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action & Dialect Bar */}
        <div className="p-3 bg-neutral-50/50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTakeSnapshot}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Camera size={13} />
              Neuen Baseline-Snapshot setzen
            </button>
            <span className="text-xs text-neutral-400">
              {snapshotTables.length > 0 ? `Baseline: ${snapshotTables.length} Tabellen` : 'Kein Snapshot gesetzt (Alle Tabellen gelten als neu)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Ziel-SQL:</label>
            <select
              value={dialect}
              onChange={(e: any) => setDialect(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
            >
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL / MariaDB</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 px-3 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('diff')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'diff'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Layers size={14} />
            Änderungsliste ({diffItems.length})
          </button>
          <button
            onClick={() => setActiveTab('up_script')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'up_script'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <ArrowUpRight size={14} />
            UP Migration (Schema anwenden)
          </button>
          <button
            onClick={() => setActiveTab('down_script')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'down_script'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <ArrowDownLeft size={14} />
            DOWN Rollback Script
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'diff' ? (
            diffItems.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                <Check size={48} className="mx-auto mb-2 text-emerald-500" />
                <div className="font-semibold text-neutral-700 dark:text-neutral-200">Schema ist synchron!</div>
                <p className="text-xs mt-1">Keine Abweichungen zwischen Snapshot und aktuellem Canvas.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {diffItems.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                          item.type.includes('added') 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                            : item.type.includes('removed')
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {item.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">{item.target}</span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">{item.details}</p>
                    </div>

                    <div className="text-[11px] font-mono text-neutral-500 bg-white dark:bg-neutral-900 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 shrink-0 max-w-xs truncate">
                      {item.upSql[dialect]}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col h-full space-y-2">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => handleCopyScript(activeTab === 'up_script' ? upScript : downScript)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span>Kopieren</span>
                </button>
                <button
                  onClick={() => handleDownloadScript(
                    activeTab === 'up_script' ? upScript : downScript,
                    `migration_${activeTab === 'up_script' ? 'up' : 'down'}_${dialect}.sql`
                  )}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-colors"
                >
                  <Download size={13} />
                  <span>.sql herunterladen</span>
                </button>
              </div>

              <div className="flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 overflow-hidden bg-[#1e1e1e]">
                <textarea
                  readOnly
                  value={activeTab === 'up_script' ? upScript : downScript}
                  className="w-full h-80 bg-transparent text-emerald-400 font-mono text-xs p-3 resize-none focus:outline-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            Kompatibel mit Flyway, Liquibase, Prisma Migrate und EF Core Migrations
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-200 dark:hover:bg-white text-white dark:text-neutral-900 text-xs font-semibold rounded-lg transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
