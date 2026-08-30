import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Upload, 
  Download, 
  Save, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Table as TableIcon, 
  Layers, 
  RefreshCw, 
  FileCode, 
  HardDrive, 
  X, 
  Plus, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { SqliteWasmEngine, SqliteInspectionResult } from '../../../services/sqliteWasmEngine';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';

interface SqliteWasmStudioModalProps {
  isOpen: boolean;
  initialFile?: File | null;
  onClose: () => void;
}

export const SqliteWasmStudioModal: React.FC<SqliteWasmStudioModalProps> = ({
  isOpen,
  initialFile,
  onClose,
}) => {
  const store = useProjectStore();
  const ui = useUIStore();

  const [inspection, setInspection] = useState<SqliteInspectionResult | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tables' | 'query' | 'export'>('tables');
  const [queryInput, setQueryInput] = useState<string>('SELECT * FROM sqlite_master;');
  const [queryResult, setQueryResult] = useState<{ columns: string[]; rows: any[]; error?: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setStatusMessage(`Lade binäre SQLite-Datei "${file.name}" in WASM...`);
    try {
      const buffer = await file.arrayBuffer();
      const res = await SqliteWasmEngine.loadBinary(buffer, file.name);
      setInspection(res);
      if (res.tables.length > 0) {
        setSelectedTable(res.tables[0].name);
      }
      setStatusMessage(`Erfolgreich geladen: ${res.tableCount} Tabellen erkannt.`);
      ui.addToast(`SQLite-Datei "${file.name}" erfolgreich geladen! ${res.tableCount} Tabellen gefunden.`, 'success');
    } catch (err: any) {
      console.error("SQLite file upload error:", err);
      setStatusMessage(`Fehler beim Laden: ${err.message || String(err)}`);
      ui.addToast(`Fehler beim Lesen der SQLite Datei: ${err.message || String(err)}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialFile) {
        handleFileUpload(initialFile);
      } else if (!inspection) {
        // Create or inspect sample SQLite database if none loaded
        SqliteWasmEngine.createEmptyDatabase('projekte_lokal.sqlite').then((res) => {
          setInspection(res);
          if (res.tables.length > 0) {
            setSelectedTable(res.tables[0].name);
          }
        }).catch(console.error);
      }
    }
  }, [isOpen, initialFile]);

  if (!isOpen) return null;

  const handleRunQuery = () => {
    if (!queryInput.trim()) return;
    const res = SqliteWasmEngine.executeSql(queryInput);
    setQueryResult(res);
  };

  const handleTranspileToProject = () => {
    if (!inspection || inspection.transpiledTables.length === 0) return;
    
    // If no project is currently open, initialize a new project
    if (!store.projectId) {
      const projName = inspection.fileName ? inspection.fileName.replace(/\.[^/.]+$/, "") : 'SQLite_Datenbank';
      store.loadProject({
        id: crypto.randomUUID(),
        name: projName,
        lastModified: Date.now(),
        data: {
          tables: inspection.transpiledTables,
          relationships: inspection.relationships || [],
          queries: [],
          forms: [],
          reports: [],
          charts: [],
          workflows: [],
          records: inspection.transpiledTables.reduce((acc, t) => {
            acc[t.id] = t.data || [];
            return acc;
          }, {} as Record<string, any[]>),
          layout: [],
          tableGroups: [],
          backendConfig: {
            dbType: 'SQLITE' as any,
            language: 'dotnet',
            projectName: projName,
            port: 5000,
            dbConnection: '',
            useSwagger: true,
            frontendFramework: 'react',
          }
        }
      });
    } else {
      // Add transpiled tables to active project store
      inspection.transpiledTables.forEach((tbl) => {
        store.addTable(tbl);
      });
      if (inspection.relationships && inspection.relationships.length > 0) {
        store.setRelationships([...store.relationships, ...inspection.relationships]);
      }
    }

    ui.setCurrentView({ type: 'table_data', tableId: inspection.transpiledTables[0].id });
    ui.addToast(`${inspection.transpiledTables.length} SQLite-Tabellen mit allen Datensätzen erfolgreich importiert!`, 'success');
    onClose();
  };

  const handleDownloadSqlite = () => {
    SqliteWasmEngine.downloadDatabaseFile(inspection?.fileName);
  };

  const handleSaveViaFileSystem = async () => {
    setIsProcessing(true);
    await SqliteWasmEngine.saveToDiskViaFileSystemApi(inspection?.fileName);
    setIsProcessing(false);
  };

  const currentTableMeta = inspection?.tables.find((t) => t.name === selectedTable);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Database size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  SQLite WASM Studio &amp; Binary I/O Engine
                </h2>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                  100% Local-First
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direktes Öffnen, Abfragen und Abspeichern binärer .sqlite / .db Dateien ohne Server oder C#-Bridge.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSqlite}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer shadow-xs"
            >
              <Download size={14} className="text-emerald-400" />
              <span>.sqlite Export</span>
            </button>
            <button
              onClick={handleSaveViaFileSystem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs"
            >
              <Save size={14} />
              <span>Lokal speichern (FSA)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer ml-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action & Tab Toolbar */}
        <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer font-bold border border-slate-700">
              <Upload size={14} className="text-amber-400" />
              <span>.sqlite / .db Datei öffnen</span>
              <input
                type="file"
                accept=".sqlite,.db,.sqlite3"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
            </label>

            {inspection && inspection.tableCount > 0 && (
              <button
                onClick={handleTranspileToProject}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold cursor-pointer"
              >
                <Sparkles size={14} />
                <span>In Projekt-Designer übernehmen ({inspection.tableCount} Tabellen)</span>
              </button>
            )}
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                activeTab === 'tables' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tabellen ({inspection?.tableCount || 0})
            </button>
            <button
              onClick={() => setActiveTab('query')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                activeTab === 'query' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SQL Abfrage-Editor
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'tables' ? (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Tables Sidebar */}
              <div className="w-64 bg-slate-950/70 border-r border-slate-800 p-3 flex flex-col overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-400 uppercase px-2 mb-2">
                  SQLite Tabellen
                </div>
                {inspection?.tables.length === 0 ? (
                  <div className="text-xs text-slate-500 p-4 text-center">
                    Keine Tabellen vorhanden. Laden Sie eine .sqlite-Datei hoch.
                  </div>
                ) : (
                  inspection?.tables.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => setSelectedTable(t.name)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold text-left transition-all mb-1 cursor-pointer ${
                        selectedTable === t.name
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <TableIcon size={14} className={selectedTable === t.name ? 'text-amber-400' : 'text-slate-500'} />
                        <span className="truncate">{t.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {t.rowCount}
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* Right Table Detail */}
              <div className="flex-1 p-5 overflow-y-auto space-y-5">
                {currentTableMeta ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          {currentTableMeta.name}
                          <span className="text-xs font-normal text-slate-400 font-mono">
                            ({currentTableMeta.rowCount} Datensätze)
                          </span>
                        </h3>
                      </div>
                    </div>

                    {/* Columns Table */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
                        Spalten-Struktur &amp; Typen (PRAGMA table_info)
                      </h4>
                      <div className="border border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                            <tr>
                              <th className="p-2.5">#</th>
                              <th className="p-2.5">Spaltenname</th>
                              <th className="p-2.5">SQLite Typ</th>
                              <th className="p-2.5">Not Null</th>
                              <th className="p-2.5">Primary Key</th>
                              <th className="p-2.5">Default</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono">
                            {currentTableMeta.columns.map((c) => (
                              <tr key={c.name} className="hover:bg-slate-800/40">
                                <td className="p-2.5 text-slate-500">{c.cid}</td>
                                <td className="p-2.5 font-bold text-white">{c.name}</td>
                                <td className="p-2.5 text-amber-400">{c.type || 'TEXT'}</td>
                                <td className="p-2.5 text-slate-300">{c.notnull ? 'JA' : 'NEIN'}</td>
                                <td className="p-2.5">
                                  {c.pk > 0 ? (
                                    <span className="text-emerald-400 font-bold">PRIMARY KEY</span>
                                  ) : (
                                    <span className="text-slate-600">-</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-slate-400">{c.dflt_value ?? 'NULL'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* DDL Create Statement */}
                    {currentTableMeta.sql && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
                          Original DDL Statement
                        </h4>
                        <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto">
                          {currentTableMeta.sql}
                        </pre>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 text-slate-500 text-xs">
                    Wählen Sie links eine Tabelle aus.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Query Editor Tab */
            <div className="flex-1 flex flex-col p-5 space-y-4 overflow-hidden">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">SQL Abfrage eingeben:</span>
                  <button
                    onClick={handleRunQuery}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    <Play size={13} />
                    <span>Ausführen</span>
                  </button>
                </div>
                <textarea
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-amber-300 outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Query Result Grid */}
              <div className="flex-1 border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex flex-col">
                <div className="p-2.5 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
                  <span>Ergebnis: {queryResult?.rows?.length || 0} Zeilen</span>
                  {queryResult?.error && <span className="text-rose-400">{queryResult.error}</span>}
                </div>
                <div className="flex-1 overflow-auto p-2">
                  {queryResult?.rows && queryResult.rows.length > 0 ? (
                    <table className="w-full text-xs text-left font-mono">
                      <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                        <tr>
                          {queryResult.columns.map((c) => (
                            <th key={c} className="p-2">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {queryResult.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-900/50">
                            {queryResult.columns.map((c) => (
                              <td key={c} className="p-2 text-slate-300">{String(row[c] ?? '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-12 text-slate-600 text-xs font-mono">
                      Keine Datenzeilen zurückgegeben.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Status Bar */}
        <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span>Datei: {inspection?.fileName || 'Keine'} ({((inspection?.fileSizeBytes || 0) / 1024).toFixed(1)} KB)</span>
          </div>
          <div>{statusMessage || 'WASM Engine bereit'}</div>
        </div>

      </div>
    </div>
  );
};
