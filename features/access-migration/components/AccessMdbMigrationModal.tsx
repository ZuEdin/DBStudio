import React, { useState, useEffect, useRef } from 'react';
import { Table, Relationship } from '../../../types';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';
import { 
  AccessMdbParser, 
  AccessDatabaseMetadata, 
  AccessTableDefinition 
} from '../services/accessMdbParser';
import { 
  Database, 
  Upload, 
  FileSpreadsheet, 
  ArrowRight, 
  Check, 
  Layers, 
  ShieldCheck, 
  Sparkles, 
  X, 
  Table as TableIcon, 
  Link2, 
  FileText, 
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Eye,
  Info,
  Code2
} from 'lucide-react';
import { VbaConverterModal } from './VbaConverterModal';

interface AccessMdbMigrationModalProps {
  initialFile?: File | null;
  onSaveTables: (tables: Table[], relationships?: Relationship[], queries?: any[], forms?: any[], reports?: any[]) => void;
  onClose: () => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const AccessMdbMigrationModal: React.FC<AccessMdbMigrationModalProps> = ({
  initialFile,
  onSaveTables,
  onClose,
  onShowToast
}) => {
  const store = useProjectStore();
  const ui = useUIStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<AccessDatabaseMetadata | null>(null);
  const [selectedTableIndex, setSelectedTableIndex] = useState<number>(0);
  const [selectedTableNames, setSelectedTableNames] = useState<string[]>([]);
  const [showSystemTables, setShowSystemTables] = useState<boolean>(false);
  const [showVbaModal, setShowVbaModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const result = await AccessMdbParser.parseAccessBuffer(buffer, file.name);
      setMeta(result);
      
      const userTables = result.tables.filter(t => !t.isSystem).map(t => t.name);
      setSelectedTableNames(userTables);
      setSelectedTableIndex(0);
      setStep(2);
      onShowToast?.(`Access-Datei "${file.name}" (${result.formatName}) erfolgreich geladen! ${result.tables.length} Tabellen erkannt.`, 'success');
    } catch (err: any) {
      console.error("Access upload error:", err);
      onShowToast?.(`Fehler beim Lesen der Access Datei: ${err.message || String(err)}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialFile) {
      handleFileUpload(initialFile);
    }
  }, [initialFile]);

  const handleLoadDemo = async () => {
    setLoading(true);
    try {
      const dummyBuffer = new ArrayBuffer(2048 * 8);
      const dummyBytes = new Uint8Array(dummyBuffer);
      dummyBytes[0x14] = 0x01; // JET 4.0
      const result = await AccessMdbParser.parseAccessBuffer(dummyBuffer, 'BauProjektManager_2003.mdb');
      setMeta(result);
      const userTables = result.tables.filter(t => !t.isSystem).map(t => t.name);
      setSelectedTableNames(userTables);
      setSelectedTableIndex(0);
      setStep(2);
      onShowToast?.('Demo Access-Datenbank (MDB Jet 4) geladen!', 'success');
    } catch (err: any) {
      onShowToast?.(`Fehler: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTable = (name: string) => {
    setSelectedTableNames(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleExecuteImport = () => {
    if (!meta) return;

    // Filter only selected tables
    const filteredMeta: AccessDatabaseMetadata = {
      ...meta,
      tables: meta.tables.filter(t => selectedTableNames.includes(t.name))
    };

    const { tables, relationships, queries, forms, reports } = AccessMdbParser.convertToDBSP(filteredMeta);
    
    // If no project is currently loaded, initialize one
    if (!store.projectId) {
      const projName = meta.fileName ? meta.fileName.replace(/\.[^/.]+$/, "") : 'Access_Datenbank';
      store.loadProject({
        id: crypto.randomUUID(),
        name: projName,
        lastModified: Date.now(),
        data: {
          tables,
          relationships,
          queries: queries || [],
          forms: forms || [],
          reports: reports || [],
          charts: [],
          workflows: [],
          records: tables.reduce((acc, t) => {
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
      onSaveTables(tables, relationships, queries, forms, reports);
    }

    if (tables.length > 0) {
      ui.setCurrentView({ type: 'table_data', tableId: tables[0].id });
    }
    onShowToast?.(`${tables.length} Tabellen, ${queries?.length || 0} Abfragen, ${forms?.length || 0} Formulare & ${reports?.length || 0} Berichte erfolgreich migriert!`, 'success');
    onClose();
  };

  const currentTable: AccessTableDefinition | undefined = meta?.tables
    .filter(t => showSystemTables || !t.isSystem)[selectedTableIndex];

  return (
    <div className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Database size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Plattformunabhängige MS Access Migration</h3>
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  MDB / ACCDB WASM Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Reines Browser-Parsing für Jet 3.5, Jet 4.0 &amp; ACE 12-16 ohne Windows ODBC-Treiber
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVbaModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Access VBA-Makros in TypeScript transpilieren"
            >
              <Code2 size={14} className="text-amber-400" />
              <span>VBA &rarr; TypeScript</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs font-semibold">
          <div className="flex items-center gap-6">
            <span className={`flex items-center gap-2 ${step >= 1 ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/40 text-[11px]">1</span>
              Datei &amp; Format
            </span>
            <span className="text-slate-700">→</span>
            <span className={`flex items-center gap-2 ${step >= 2 ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/40 text-[11px]">2</span>
              Tabellen-Katalog
            </span>
            <span className="text-slate-700">→</span>
            <span className={`flex items-center gap-2 ${step >= 3 ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/40 text-[11px]">3</span>
              Typ-Mapping &amp; OLE
            </span>
            <span className="text-slate-700">→</span>
            <span className={`flex items-center gap-2 ${step >= 4 ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/40 text-[11px]">4</span>
              Daten-Vorschau &amp; Import
            </span>
          </div>

          {meta && (
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span className="text-red-400 font-bold">{meta.formatName}</span>
              <span>•</span>
              <span>{meta.pageSize}B Pages</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* STEP 1: FILE UPLOAD */}
          {step === 1 && (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-red-500/60 bg-slate-950/60 hover:bg-slate-950 rounded-2xl p-10 text-center cursor-pointer transition-all space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mdb,.accdb"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                />
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                  <Upload size={32} className="animate-bounce" />
                </div>
                <h4 className="text-sm font-bold text-white">Microsoft Access Datei hochladen (.mdb / .accdb)</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Ziehen Sie eine .mdb (Access 97/2000/2003) oder .accdb (Access 2007-2021) Datei hierher. Alle Tabellen, OLE-Bilder, RTF-Memos und Beziehungen werden automatisch extrahiert.
                </p>
                <div className="flex items-center justify-center gap-4 pt-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">Jet 3.5 / Jet 4.0</span>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">ACE 12.0 / 14.0 / 16.0</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Sparkles size={20} className="text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Keine eigene Access Datei zur Hand?</div>
                    <div className="text-[11px] text-slate-400">Testen Sie die WASM Engine mit unserem vorgefertigten Bau-ProjektManager Datensatz.</div>
                  </div>
                </div>
                <button
                  onClick={handleLoadDemo}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  <span>Demo Access-DB laden</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TABLE CATALOG */}
          {step === 2 && meta && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-300">Gefundene Tabellen ({meta.tables.filter(t => !t.isSystem).length}):</span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSystemTables}
                      onChange={(e) => setShowSystemTables(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-red-500"
                    />
                    <span>System-Tabellen (MSys*) anzeigen</span>
                  </label>
                </div>

                <div className="text-xs text-slate-400">
                  Ausgewählt: <strong className="text-red-400">{selectedTableNames.length}</strong> Tabellen
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {meta.tables
                  .filter(t => showSystemTables || !t.isSystem)
                  .map((t) => {
                    const isSelected = selectedTableNames.includes(t.name);
                    return (
                      <div
                        key={t.name}
                        className={`p-4 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-slate-950 border-red-500/50 ring-1 ring-red-500/30'
                            : 'bg-slate-950/40 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleTable(t.name)}
                              className="rounded bg-slate-800 border-slate-700 text-red-500 mt-0.5"
                            />
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-2">
                                <TableIcon size={14} className="text-red-400" />
                                <span>{t.name}</span>
                                {t.isSystem && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">SYS</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                                <span>{t.rowCount} Datensätze</span>
                                <span>•</span>
                                <span>{t.columns.length} Spalten</span>
                                {t.primaryKey && (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-400 font-mono">PK: {t.primaryKey}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {meta.relationships.length > 0 && (
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                    <Link2 size={15} />
                    <span>Erkannte 1:N Fremdschlüssel-Beziehungen ({meta.relationships.length}):</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                    {meta.relationships.map((r, i) => (
                      <div key={i} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-[11px]">
                        <span>{r.fromTable}.{r.fromColumn}</span>
                        <span className="text-red-400">➔</span>
                        <span>{r.toTable}.{r.toColumn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: TYPE MAPPING & OLE PREVIEW */}
          {step === 3 && meta && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {meta.tables
                  .filter(t => showSystemTables || !t.isSystem)
                  .map((t, idx) => (
                    <button
                      key={t.name}
                      onClick={() => setSelectedTableIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedTableIndex === idx
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:bg-slate-900 border border-slate-800'
                      }`}
                    >
                      {t.name} ({t.columns.length})
                    </button>
                  ))}
              </div>

              {currentTable && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Spalten-Definitionen für "{currentTable.name}"</span>
                    <span className="text-[11px] text-slate-400">{currentTable.columns.length} Spalten extrahiert</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                        <tr>
                          <th className="p-3">Spaltenname</th>
                          <th className="p-3">Access Datentyp</th>
                          <th className="p-3">DB Studio / SQL Typ</th>
                          <th className="p-3">Attribut</th>
                          <th className="p-3">Transpiler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {currentTable.columns.map((col, i) => (
                          <tr key={i} className="hover:bg-slate-900/50">
                            <td className="p-3 font-semibold text-white flex items-center gap-2">
                              {col.isPrimaryKey ? <span className="text-amber-400 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40">PK</span> : null}
                              <span>{col.name}</span>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-400">{col.accessType}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-red-950/50 border border-red-500/30 text-red-300 font-mono text-[10px] font-bold">
                                {col.mappedType} {col.size ? `(${col.size})` : ''}
                              </span>
                            </td>
                            <td className="p-3 text-[11px] text-slate-400">
                              {col.isNullable ? 'NULL erlaubt' : 'NOT NULL'}
                            </td>
                            <td className="p-3">
                              {col.isOleObject ? (
                                <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-semibold bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                                  <ImageIcon size={12} /> OLE-Header Stripper
                                </span>
                              ) : col.isMemoRtf ? (
                                <span className="flex items-center gap-1 text-indigo-400 text-[10px] font-semibold bg-indigo-950/40 border border-indigo-500/30 px-2 py-0.5 rounded">
                                  <FileText size={12} /> RTF to HTML
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[11px]">Nativ</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: DATA GRID & IMPORT */}
          {step === 4 && meta && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {meta.tables
                  .filter(t => selectedTableNames.includes(t.name))
                  .map((t, idx) => (
                    <button
                      key={t.name}
                      onClick={() => setSelectedTableIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedTableIndex === idx
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:bg-slate-900 border border-slate-800'
                      }`}
                    >
                      {t.name} ({t.rows.length} Zeilen)
                    </button>
                  ))}
              </div>

              {currentTable && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] sticky top-0">
                      <tr>
                        {currentTable.columns.map(c => (
                          <th key={c.name} className="p-2.5 whitespace-nowrap">{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {currentTable.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-900/50">
                          {currentTable.columns.map(c => {
                            const val = row[c.name];
                            return (
                              <td key={c.name} className="p-2.5 whitespace-nowrap text-[11px]">
                                {c.isOleObject && typeof val === 'string' && val.startsWith('data:') ? (
                                  <img src={val} alt="OLE" className="w-8 h-8 object-cover rounded border border-slate-700" />
                                ) : (
                                  String(val ?? 'NULL')
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep((prev) => Math.max(1, prev - 1) as any)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
              >
                Zurück
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < 4 ? (
              <button
                onClick={() => setStep((prev) => Math.min(4, prev + 1) as any)}
                disabled={!meta}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Weiter</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleExecuteImport}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>Ausgewählte {selectedTableNames.length} Tabellen in DB Studio Pro importieren</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showVbaModal && (
        <VbaConverterModal
          formName={meta?.tables[selectedTableIndex]?.name || 'AccessForm'}
          onClose={() => setShowVbaModal(false)}
        />
      )}
    </div>
  );
};
