import React, { useState } from 'react';
import { Database, FileCode, Play, AlertCircle, Copy, Check, Download, RefreshCw } from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';

interface SQLiteManagerProps {
  activeProjectId: string | undefined;
  activeProjectName: string | undefined;
}

export const SQLiteManager: React.FC<SQLiteManagerProps> = ({ activeProjectId, activeProjectName }) => {
  const store = useProjectStore();
  const [logs, setLogs] = useState<string[]>([
    'SQLite Engine initialisiert.',
    `Verbindung zu ${activeProjectId || 'project'}.db hergestellt.`
  ]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate real SQLite SQLite DDL Script based on active project tables
  const generateSQLiteScript = () => {
    let script = `-- =======================================================
-- SQLite Database Migrations & Initial Schema
-- Projekt: ${activeProjectName || 'Unbenannt'} (${activeProjectId || 'project'})
-- Erstellt am: ${new Date().toISOString().split('T')[0]}
-- =======================================================

PRAGMA foreign_keys = ON;

`;

    store.tables.forEach(table => {
      script += `-- Tabelle: ${table.name}\n`;
      script += `CREATE TABLE IF NOT EXISTS "${table.name}" (\n`;
      
      const columnsDef = (table.fields || []).map(col => {
        let typeStr = 'TEXT';
        const t = col.type.toLowerCase();
        if (t.includes('int') || t.includes('number')) typeStr = 'INTEGER';
        if (t.includes('bool')) typeStr = 'INTEGER'; // SQLite uses INTEGER for booleans
        if (t.includes('float') || t.includes('double') || t.includes('decimal')) typeStr = 'REAL';
        
        const primaryStr = col.isPrimaryKey ? ' PRIMARY KEY' : '';
        const nullableStr = col.allowNull ? '' : ' NOT NULL';
        const defaultStr = col.defaultValue ? ` DEFAULT ${col.defaultValue}` : '';
        
        return `    "${col.name}" ${typeStr}${primaryStr}${nullableStr}${defaultStr}`;
      }).join(',\n');

      script += columnsDef;

      // Check for foreign keys or relationships
      const foreignKeys = store.relationships?.filter(rel => rel.fromTable === table.name) || [];
      if (foreignKeys.length > 0) {
        script += ',\n';
        const fkDefs = foreignKeys.map(rel => {
          return `    FOREIGN KEY ("${rel.fromColumn}") REFERENCES "${rel.toTable}" ("${rel.toColumn}") ON DELETE CASCADE`;
        }).join(',\n');
        script += fkDefs;
      }

      script += '\n);\n\n';
    });

    return script;
  };

  const handleRunSimulation = () => {
    setIsSyncing(true);
    setLogs(prev => [...prev, `Verbindung neu aufgebaut...`, `Projekt SQLite-Datei gesperrt für Schreibvorgänge...`]);
    
    setTimeout(() => {
      setLogs(prev => [
        ...prev,
        `Führe Schema-Initialisierung für ${store.tables.length} Tabellen aus...`,
        ...store.tables.map(t => `-> Tabelle "${t.name}" erfolgreich erstellt/migriert.`),
        `SQLite Index-Optimierungen abgeschlossen.`,
        `Projekt-Datenbank ${activeProjectId || 'project'}.db erfolgreich synchronisiert & einsatzbereit! ✅`
      ]);
      setIsSyncing(false);
    }, 1200);
  };

  const copyScript = () => {
    navigator.clipboard.writeText(generateSQLiteScript());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden p-1">
      {/* Information & Actions (5 Columns) */}
      <div className="lg:col-span-5 border-r border-slate-200 dark:border-slate-800 pr-4 flex flex-col justify-between h-full overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Database size={14} className="text-teal-600" />
              SQLite Projekt-Isolation
            </h3>
            <p className="text-[11px] text-slate-500">
              Jedes Projekt erhält im DB Studio eine vollständig isolierte SQLite-Datenbank. Dadurch bleibt das Projekt in sich gekapselt, transportabel und offline-first-fähig.
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-3 rounded-lg flex items-start gap-2.5">
            <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-800 dark:text-amber-300">
              <span className="font-semibold">Isolations-Modus:</span> Um Ihr Projekt als eigenständige Einheit zu betreiben, verwenden Sie die unten generierten DDL-Anweisungen in Ihrem lokalen .NET 10 App-Verzeichnis.
            </div>
          </div>

          {/* SQLite simulation console */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-bold text-slate-400 uppercase">Live SQLite Engine Logs</label>
              <button
                onClick={handleRunSimulation}
                disabled={isSyncing}
                className="text-[10px] bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white px-2 py-1 rounded flex items-center gap-1 transition"
              >
                {isSyncing ? <RefreshCw size={10} className="animate-spin" /> : <Play size={10} />}
                DB Sync simulieren
              </button>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 h-44 overflow-y-auto space-y-1">
              {logs.map((log, i) => (
                <div key={i} className={log.includes('✅') ? 'text-emerald-400' : log.includes('->') ? 'text-slate-400 ml-2' : 'text-slate-300'}>
                  {`[${new Date().toLocaleTimeString()}] ${log}`}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info label */}
        <div className="text-[10px] text-slate-400 mt-4 leading-relaxed">
          SQLite Dateien werden standardmäßig im Anwendungs-Verzeichnis unter <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">App_Data/{activeProjectId || 'project'}.db</code> abgelegt.
        </div>
      </div>

      {/* DDL Schema Viewer (7 Columns) */}
      <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center mb-2 shrink-0">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <FileCode size={13} className="text-teal-600" />
            SQLite DDL Migrations-Skript
          </span>

          <div className="flex gap-1.5">
            <button
              onClick={copyScript}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white text-[11px] px-2.5 py-1 rounded transition"
            >
              {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              {copied ? 'Kopiert!' : 'Skript kopieren'}
            </button>
          </div>
        </div>

        {/* Script Viewer Container */}
        <div className="flex-1 overflow-auto bg-slate-950 p-4 rounded-lg font-mono text-[11px] text-teal-300 leading-relaxed border border-slate-850">
          <pre>{generateSQLiteScript()}</pre>
        </div>
      </div>
    </div>
  );
};
