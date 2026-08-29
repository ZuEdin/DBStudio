import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Table, 
  Play, 
  RefreshCw, 
  AlertTriangle, 
  Layers, 
  Terminal, 
  FileSpreadsheet
} from 'lucide-react';
import { bridgeApi } from '../../services/bridgeApi';
import { LocalProject } from '../../types/bridge';
import { AccessMigrationView } from '../database/AccessMigrationView';

export const DatabaseTab: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'access_migration' | 'explorer'>('access_migration');
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [databases, setDatabases] = useState<any[]>([]);
  const [selectedDbPath, setSelectedDbPath] = useState<string>('');
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [queryInput, setQueryInput] = useState<string>('');
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    rows: any[];
    rowCount: number;
    error?: string;
  } | null>(null);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projs = await bridgeApi.getProjects();
      setProjects(projs);
      if (projs.length > 0) {
        setSelectedProjectId(projs[0].id);
        loadDatabases(projs[0].id);
      } else {
        loadDatabases();
      }
    } catch {
      loadDatabases();
    }
  };

  const loadDatabases = async (projId?: string) => {
    setIsLoadingDatabases(true);
    setDatabases([]);
    setSelectedDbPath('');
    setTables([]);
    setQueryResult(null);
    try {
      const res = await bridgeApi.findDatabases(projId);
      if (res.success && res.databases.length > 0) {
        setDatabases(res.databases);
        setSelectedDbPath(res.databases[0].fullPath);
        inspectDb(res.databases[0].fullPath);
      }
    } catch {
      // Ignore
    } fontFinally: {
      setIsLoadingDatabases(false);
    }
  };

  const inspectDb = async (dbPath: string) => {
    if (!dbPath) return;
    try {
      const res = await bridgeApi.inspectDatabase(dbPath);
      if (res.success && res.tables) {
        setTables(res.tables);
        if (res.tables.length > 0) {
          const firstTable = res.tables[0].name;
          setSelectedTable(firstTable);
          const initialQuery = `SELECT * FROM ${firstTable} LIMIT 25;`;
          setQueryInput(initialQuery);
          executeQuery(dbPath, initialQuery);
        }
      }
    } catch {
      // Ignore
    }
  };

  const executeQuery = async (dbPath: string, sql: string) => {
    if (!dbPath || !sql.trim()) return;
    setIsQuerying(true);
    try {
      const res = await bridgeApi.queryDatabase(dbPath, sql.trim(), 50);
      if (res.success) {
        setQueryResult({
          columns: res.columns || [],
          rows: res.rows || [],
          rowCount: res.rowCount || 0
        });
      } else {
        setQueryResult({
          columns: [],
          rows: [],
          rowCount: 0,
          error: res.error
        });
      }
    } catch (e: any) {
      setQueryResult({
        columns: [],
        rows: [],
        rowCount: 0,
        error: e.message
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const handleSelectTable = (tblName: string) => {
    setSelectedTable(tblName);
    const sql = `SELECT * FROM ${tblName} LIMIT 25;`;
    setQueryInput(sql);
    executeQuery(selectedDbPath, sql);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Mode Switcher Bar */}
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm dark:shadow-xl flex items-center gap-2 transition-colors">
        <button
          onClick={() => setActiveMode('access_migration')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
            activeMode === 'access_migration'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Microsoft Access Migration (.accdb & .mdb)</span>
          <span className="text-[10px] font-mono bg-black/20 text-white px-2 py-0.2 rounded-full">
            Phase 8
          </span>
        </button>

        <button
          onClick={() => setActiveMode('explorer')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
            activeMode === 'explorer'
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>SQLite & Live DB Explorer</span>
          <span className="text-[10px] font-mono bg-black/20 text-white px-2 py-0.2 rounded-full">
            Phase 4
          </span>
        </button>
      </div>

      {activeMode === 'access_migration' ? (
        <AccessMigrationView />
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-heading">
                    <span>Datenbank & Schema Explorer</span>
                    <span className="text-[10px] font-mono uppercase bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/30 font-semibold">
                      Phase 4 Live
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Direkte Einsicht in SQLite- & Projekt-Datenbanken, Tabellen-Schemata und SQL-Abfragen</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0b1326] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Projekt:</span>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      loadDatabases(e.target.value);
                    }}
                    className="bg-transparent text-slate-900 dark:text-slate-100 text-xs font-semibold outline-none cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => loadDatabases(selectedProjectId)}
                  disabled={isLoadingDatabases}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-[#0b1326] dark:hover:bg-[#1a243a] text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDatabases ? 'animate-spin text-indigo-500' : ''}`} />
                  <span>Neu laden</span>
                </button>
              </div>
            </div>

            {databases.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <Database className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-400">Keine `.db` oder `.sqlite` Datenbankdateien in diesem Projekt gefunden.</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-2">Gefundene Datenbanken:</span>
                {databases.map((db, idx) => {
                  const isSelected = selectedDbPath === db.fullPath;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedDbPath(db.fullPath);
                        inspectDb(db.fullPath);
                      }}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-mono transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 shadow-sm'
                          : 'bg-slate-50 dark:bg-[#0b1326] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span className="font-bold">{db.name}</span>
                      <span className="text-[10px] opacity-70 font-sans">({db.sizeFormatted})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
