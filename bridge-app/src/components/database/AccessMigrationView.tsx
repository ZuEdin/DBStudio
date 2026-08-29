import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  ArrowRight, 
  CheckCircle2, 
  Copy, 
  Download, 
  Layers, 
  Key, 
  Sparkles, 
  Database, 
  Code2, 
  Link2, 
  Table, 
  RefreshCw, 
  AlertCircle,
  FileCode
} from 'lucide-react';
import { bridgeApi } from '../../services/bridgeApi';
import { AccessInspectionResult, AccessTranspileResult } from '../../types/bridge';

export const AccessMigrationView: React.FC = () => {
  const [inspectionData, setInspectionData] = useState<AccessInspectionResult | null>(null);
  const [selectedDialect, setSelectedDialect] = useState<'postgres' | 'mysql' | 'sqlite' | 'sqlserver'>('postgres');
  const [transpileResult, setTranspileResult] = useState<AccessTranspileResult | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'ddl' | 'queries' | 'relations' | 'tables' | 'sync'>('ddl');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<any | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExportFullSqlDump = async () => {
    if (!inspectionData) return;
    setIsSyncing(true);
    setSyncStatus(`Generiere vollständigen ${selectedDialect.toUpperCase()} SQL Data-Dump...`);
    try {
      const res = await bridgeApi.exportSqlDataDump(inspectionData, selectedDialect);
      if (res.success && res.sqlDump) {
        const blob = new Blob([res.sqlDump], { type: 'text/sql;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.fileName || `${inspectionData.fileName}_full_dump.sql`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 200);

        setSyncStatus(`Erfolgreich! ${res.totalRows} Datensätze in ${res.totalTables} Tabellen exportiert.`);
        showNotification(`SQL Data-Dump '${res.fileName}' heruntergeladen!`);
      } else {
        setSyncStatus(`Fehler: ${res.error || 'Dump-Erstellung fehlgeschlagen'}`);
      }
    } catch (err: any) {
      setSyncStatus(`Fehler: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncToLocalSqlite = async () => {
    if (!inspectionData) return;
    setIsSyncing(true);
    setSyncStatus('Erstelle lokale SQLite-Datenbank und migriere alle Datensätze...');
    try {
      const res = await bridgeApi.syncToSqlite(inspectionData);
      if (res.success) {
        setSyncResult(res);
        setSyncStatus(`Fertig! ${res.totalRows} Datensätze erfolgreich in '${res.targetFileName}' gespeichert.`);
        showNotification(`SQLite-Datenbank '${res.targetFileName}' erfolgreich erstellt!`);
      } else {
        setSyncStatus(`Fehler: ${res.error || 'Migration fehlgeschlagen'}`);
      }
    } catch (err: any) {
      setSyncStatus(`Fehler: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        const res = await bridgeApi.uploadAccessDatabase(file.name, base64);
        if (res.success) {
          setInspectionData(res);
          await triggerTranspilation(res, selectedDialect);
          showNotification(`Access-Datei '${file.name}' erfolgreich analysiert!`);
        } else {
          showNotification(`Fehler: ${res.error || 'Inspektion fehlgeschlagen'}`);
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showNotification(`Fehler: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const triggerTranspilation = async (data: AccessInspectionResult, dialect: 'postgres' | 'mysql' | 'sqlite' | 'sqlserver') => {
    if (!data || !data.tables) return;
    try {
      const res = await bridgeApi.transpileAccessDatabase(data.tables, data.queries, dialect);
      if (res.success) {
        setTranspileResult(res);
      }
    } catch {
      // Ignore
    }
  };

  const handleDialectChange = async (dialect: 'postgres' | 'mysql' | 'sqlite' | 'sqlserver') => {
    setSelectedDialect(dialect);
    if (inspectionData) {
      await triggerTranspilation(inspectionData, dialect);
    }
  };

  const handleCopySql = () => {
    if (!transpileResult?.ddl) return;
    navigator.clipboard.writeText(transpileResult.ddl);
    showNotification('SQL DDL Skript in Zwischenablage kopiert!');
  };

  const handleDownloadSql = () => {
    if (!transpileResult?.ddl) return;
    const blob = new Blob([transpileResult.ddl], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inspectionData?.fileName || 'access_migration'}_${selectedDialect}.sql`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
    showNotification('SQL-Datei erfolgreich heruntergeladen!');
  };

  const handleDownloadDbsp = async () => {
    if (!inspectionData) return;
    setIsExporting(true);
    try {
      const res = await bridgeApi.exportAccessToDbsp(inspectionData);
      if (res.success && res.dbspContent) {
        const jsonStr = JSON.stringify(res.dbspContent, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.fileName || `${inspectionData.fileName}.dbsp`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 200);

        showNotification(`.dbsp Projektdatei '${res.fileName}' erfolgreich heruntergeladen!`);
      } else {
        showNotification(`Fehler: ${res.error || 'Export fehlgeschlagen'}`);
      }
    } catch (err: any) {
      showNotification(`Fehler: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0E1524]/95 border border-emerald-500/50 text-emerald-300 text-xs px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md glow-emerald flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-teal-500/5 border border-emerald-500/30 text-emerald-400 flex items-center justify-center glow-emerald shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Microsoft Access Migration Engine</h3>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                  Phase 8 Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Liest <code className="text-emerald-400 font-mono">.accdb</code> und <code className="text-emerald-400 font-mono">.mdb</code> Dateien ein, transpilliert Tabellen & Access-Abfragen (NZ, IIF, Date) in Standard-SQL und bereitet Beziehungen für DB Studio vor.
              </p>
            </div>
          </div>
        </div>
      </div>

      {!inspectionData ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
          className={`bg-[#0E1524]/60 backdrop-blur-md border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
            isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 text-emerald-400 flex items-center justify-center mx-auto shadow-inner glow-emerald">
              <Upload className={`w-8 h-8 ${isProcessing ? 'animate-bounce' : ''}`} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Access-Datenbank hier ablegen</h4>
              <p className="text-xs text-slate-400">Unterstützt .accdb (Access 2007-2024) und .mdb (Access 97-2003)</p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <label className="cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                <span>Datei auswählen...</span>
                <input
                  type="file"
                  accept=".accdb,.mdb"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-xl flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-1">Ziel-Datenbank:</span>
              {[
                { id: 'postgres', label: 'PostgreSQL' },
                { id: 'mysql', label: 'MySQL / MariaDB' },
                { id: 'sqlite', label: 'SQLite' },
                { id: 'sqlserver', label: 'SQL Server' }
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleDialectChange(d.id as any)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    selectedDialect === d.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 glow-emerald'
                      : 'bg-[#080D17] text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleDownloadDbsp}
                disabled={isExporting}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg glow-emerald"
              >
                <Download className="w-4 h-4" />
                <span>.dbsp Projektdatei herunterladen</span>
              </button>
            </div>
          </div>

          <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-3">
            <pre className="bg-[#080D17] p-4.5 rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-300 overflow-x-auto max-h-[500px]">
              {transpileResult?.ddl || '-- Generiere DDL...'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
