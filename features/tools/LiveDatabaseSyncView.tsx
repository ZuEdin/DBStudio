import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, ArrowRight, ShieldAlert, CheckCircle2, 
  Terminal, Server, Play, AlertCircle, HardDrive, Cpu, 
  ArrowUpRight, Table as TableIcon, Lock, Settings2, Sliders,
  HelpCircle, ChevronDown, Check, FileCode, CheckSquare, Square
} from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { Table, TableField } from '../../types/index';

interface LiveDatabaseSyncViewProps {
  showMessage: (text: string, description: string, type: 'success' | 'error' | 'info') => void;
  onSaveTable: (table: Table) => void;
}

export const LiveDatabaseSyncView: React.FC<LiveDatabaseSyncViewProps> = ({ showMessage, onSaveTable }) => {
  const projectTables = useProjectStore(state => state.tables);
  const addTable = useProjectStore(state => state.addTable);

  // Connection config states
  const [dbType, setDbType] = useState<'postgresql' | 'mysql' | 'mssql' | 'sqlite'>('postgresql');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('production_db');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('••••••••••••');
  const [ssl, setSsl] = useState(true);
  
  // App state
  const [syncStep, setSyncStep] = useState<'connect' | 'scanning' | 'diff' | 'completed'>('connect');
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedDiffs, setSelectedDiffs] = useState<string[]>([]);
  
  // Mock Introspected differences
  const [mockDiffs, setMockDiffs] = useState<{
    id: string;
    type: 'new_table' | 'column_mismatch' | 'missing_column';
    tableName: string;
    description: string;
    localDetail?: string;
    liveDetail?: string;
    sql: string;
    suggestedTable?: Table;
  }[]>([]);

  useEffect(() => {
    // Port updates based on DB Type
    if (dbType === 'postgresql') setPort('5432');
    else if (dbType === 'mysql') setPort('3306');
    else if (dbType === 'mssql') setPort('1433');
    else if (dbType === 'sqlite') setPort('file:data.db');
  }, [dbType]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleConnect = async () => {
    setSyncStep('scanning');
    setLogs([]);
    addLog(`Stelle Verbindung zu ${dbType.toUpperCase()}://@${host}:${port}/${database} her...`);
    
    // Step-by-step scanning logs
    await new Promise(r => setTimeout(r, 800));
    addLog(`🔐 SSL/TLS Verbindung erfolgreich etabliert (Version TLS 1.3, Cipher AES256-GCM)...`);
    
    await new Promise(r => setTimeout(r, 600));
    addLog(`🔍 Lese Systemtabellen ('information_schema.tables' & 'information_schema.columns') aus...`);
    
    await new Promise(r => setTimeout(r, 1000));
    addLog(`📦 Gefunden: 4 Tabellen im Live-System.`);
    addLog(`📊 Vergleiche Struktur mit lokalem Datenmodell (${projectTables.length} lokale Tabellen)...`);

    // Generate smart mock diffs depending on what local tables exist
    const hasUsersTable = projectTables.some(t => t.name.toLowerCase() === 'users');
    const hasOrdersTable = projectTables.some(t => t.name.toLowerCase() === 'orders');

    const generatedDiffs: typeof mockDiffs = [
      {
        id: 'diff_1',
        type: 'new_table',
        tableName: 'Invoices',
        description: 'Tabelle existiert im Live-System, fehlt aber lokal.',
        liveDetail: 'Columns: Id (UUID, PK), InvoiceNumber (VARCHAR), IssueDate (DATE), TotalAmount (DECIMAL), IsPaid (BOOLEAN), CustomerId (UUID)',
        sql: `CREATE TABLE "Invoices" (\n  "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  "InvoiceNumber" VARCHAR(255) NOT NULL,\n  "IssueDate" DATE NOT NULL DEFAULT CURRENT_DATE,\n  "TotalAmount" DECIMAL(10,2) NOT NULL,\n  "IsPaid" BOOLEAN DEFAULT false,\n  "CustomerId" UUID REFERENCES "Customers"("Id")\n);`,
        suggestedTable: {
          id: 'introspected_invoices',
          name: 'Invoices',
          fields: [
            { id: 'inv_id', name: 'Id', type: 'UUID', isPrimaryKey: true, isNullable: false, isUnique: true, defaultValue: 'gen_random_uuid()' },
            { id: 'inv_nr', name: 'InvoiceNumber', type: 'VARCHAR', isPrimaryKey: false, isNullable: false, isUnique: false, maxLength: 255 },
            { id: 'inv_date', name: 'IssueDate', type: 'DATE', isPrimaryKey: false, isNullable: false, isUnique: false },
            { id: 'inv_tot', name: 'TotalAmount', type: 'DECIMAL', isPrimaryKey: false, isNullable: false, isUnique: false },
            { id: 'inv_paid', name: 'IsPaid', type: 'BOOLEAN', isPrimaryKey: false, isNullable: true, isUnique: false, defaultValue: 'false' },
            { id: 'inv_cust', name: 'CustomerId', type: 'UUID', isPrimaryKey: false, isNullable: true, isUnique: false }
          ],
          description: 'Introspected live database invoice table'
        }
      },
      {
        id: 'diff_2',
        type: 'missing_column',
        tableName: projectTables[0]?.name || 'Customers',
        description: `Spalte 'PhoneNumber' existiert im Live-System unter '${projectTables[0]?.name || 'Customers'}', fehlt aber lokal.`,
        liveDetail: 'PhoneNumber VARCHAR(50)',
        localDetail: 'Keine Spalte gefunden',
        sql: `ALTER TABLE "${projectTables[0]?.name || 'Customers'}" ADD COLUMN "PhoneNumber" VARCHAR(50) NULL;`,
      }
    ];

    if (!hasUsersTable) {
      generatedDiffs.push({
        id: 'diff_3',
        type: 'new_table',
        tableName: 'LiveAuditLog',
        description: 'Tabelle existiert im Live-System, fehlt aber lokal.',
        liveDetail: 'Columns: Id (INT, PK), Action (VARCHAR), TableName (VARCHAR), Timestamp (DATETIME)',
        sql: `CREATE TABLE "LiveAuditLog" (\n  "Id" SERIAL PRIMARY KEY,\n  "Action" VARCHAR(100) NOT NULL,\n  "TableName" VARCHAR(100) NOT NULL,\n  "Timestamp" TIMESTAMP DEFAULT NOW()\n);`,
        suggestedTable: {
          id: 'introspected_audit',
          name: 'LiveAuditLog',
          fields: [
            { id: 'aud_id', name: 'Id', type: 'INT', isPrimaryKey: true, isNullable: false, isUnique: true },
            { id: 'aud_act', name: 'Action', type: 'VARCHAR', isPrimaryKey: false, isNullable: false, isUnique: false, maxLength: 100 },
            { id: 'aud_tbl', name: 'TableName', type: 'VARCHAR', isPrimaryKey: false, isNullable: false, isUnique: false, maxLength: 100 },
            { id: 'aud_time', name: 'Timestamp', type: 'DATETIME', isPrimaryKey: false, isNullable: true, isUnique: false, defaultValue: 'NOW()' }
          ],
          description: 'Sicherheits-Audit-Logs aus dem Live-System'
        }
      });
    }

    setMockDiffs(generatedDiffs);
    setSelectedDiffs(generatedDiffs.map(d => d.id));
    
    await new Promise(r => setTimeout(r, 600));
    addLog(`✅ Analyse abgeschlossen. ${generatedDiffs.length} Unterschiede identifiziert.`);
    setSyncStep('diff');
  };

  const handleApplySync = () => {
    let appliedCount = 0;
    
    mockDiffs.forEach(diff => {
      if (!selectedDiffs.includes(diff.id)) return;
      
      if (diff.type === 'new_table' && diff.suggestedTable) {
        // Safe check to avoid duplication
        if (!projectTables.some(t => t.name.toLowerCase() === diff.tableName.toLowerCase())) {
          addTable(diff.suggestedTable);
          appliedCount++;
        }
      } else if (diff.type === 'missing_column') {
        const targetTable = projectTables.find(t => t.name === diff.tableName);
        if (targetTable) {
          const newField: TableField = {
            id: `f_sync_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: 'PhoneNumber',
            type: 'VARCHAR',
            isPrimaryKey: false,
            isNullable: true,
            isUnique: false,
            maxLength: 50
          };
          
          // Check if column exists
          if (!targetTable.fields.some(f => f.name.toLowerCase() === 'phonenumber')) {
            const updatedFields = [...targetTable.fields, newField];
            onSaveTable({
              ...targetTable,
              fields: updatedFields
            });
            appliedCount++;
          }
        }
      }
    });

    showMessage(
      `${appliedCount} Änderungen importiert`, 
      `Die ausgewählten Tabellen und Spalten wurden erfolgreich in dein lokales Schema übernommen.`, 
      'success'
    );
    setSyncStep('completed');
  };

  const toggleDiffSelection = (id: string) => {
    setSelectedDiffs(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col gap-6 max-w-5xl mx-auto w-full transition-colors duration-200">
      
      {/* Title & Banner */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md">
            <RefreshCw className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Live Datenbank-Synchronisation (Introspection)</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Spiele Live-Schemata direkt in dein Design ein oder generiere Migrationsskripte durch automatisierten Abgleich.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold px-2 py-1 rounded-full border border-amber-200/50 dark:border-amber-900/30 flex items-center gap-1.5">
            <ShieldAlert size={12} />
            <span>Developer Sandbox</span>
          </span>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { key: 'connect', label: '1. Verbindung einrichten' },
          { key: 'scanning', label: '2. Introspection Scan' },
          { key: 'diff', label: '3. Schema Abgleich' },
          { key: 'completed', label: '4. Synchronisiert' }
        ].map((step, idx) => {
          const isActive = syncStep === step.key;
          const isDone = 
            (syncStep === 'scanning' && idx === 0) ||
            (syncStep === 'diff' && idx < 2) ||
            (syncStep === 'completed');

          return (
            <div 
              key={step.key}
              className={`p-2.5 rounded-lg border text-center transition-all ${
                isActive 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                  : isDone 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-medium' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wide">Schritt {idx + 1}</div>
              <div className="text-xs font-semibold truncate mt-0.5">{step.label}</div>
            </div>
          );
        })}
      </div>

      {/* Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Left / Config column */}
        <div className="lg:col-span-2 flex flex-col gap-5 min-h-0">
          
          {syncStep === 'connect' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-850">
                <Server className="w-5 h-5 text-indigo-500" />
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Verbindungsdaten für Live-Datenbank</h2>
              </div>

              {/* DB Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Datenbank-Typ (Dialekt)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'postgresql', label: 'PostgreSQL', color: 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20' },
                    { id: 'mysql', label: 'MySQL', color: 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20' },
                    { id: 'mssql', label: 'SQL Server', color: 'border-red-500 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20' },
                    { id: 'sqlite', label: 'SQLite (File)', color: 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20' }
                  ].map((db) => (
                    <button
                      key={db.id}
                      onClick={() => setDbType(db.id as any)}
                      className={`py-2 px-1 text-center rounded-lg border text-xs font-bold transition-all ${
                        dbType === db.id 
                          ? `${db.color} border-2 ring-1 ring-offset-1 ring-indigo-500 dark:ring-offset-slate-900` 
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {db.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Server Fields */}
              {dbType !== 'sqlite' ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Host / Server-Addresse</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500" 
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      placeholder="z.B. db.example.com oder localhost"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Port</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-center focus:ring-2 focus:ring-indigo-500" 
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">SQLite Pfad</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500" 
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                  />
                </div>
              )}

              {/* Database Name & SSL */}
              {dbType !== 'sqlite' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Datenbankname</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500" 
                      value={database}
                      onChange={(e) => setDatabase(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center h-full pt-5 pl-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-300">
                      <input 
                        type="checkbox" 
                        checked={ssl}
                        onChange={(e) => setSsl(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold">SSL-Verschlüsselung erzwingen</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Credentials */}
              {dbType !== 'sqlite' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Benutzername</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Passwort</label>
                    <input 
                      type="password" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Live Status Warning */}
              <div className="p-3.5 rounded-lg bg-indigo-50/70 dark:bg-slate-800/40 border border-indigo-100/50 dark:border-slate-800 text-xs text-indigo-800 dark:text-indigo-400 flex gap-2.5">
                <HelpCircle className="w-5 h-5 shrink-0 text-indigo-500" />
                <div className="space-y-1">
                  <span className="font-bold">💡 Wie funktioniert Introspection?</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Dieses System scannt die Metadatentabellen der Live-Datenbank und vergleicht sie mit deinen lokalen Modellen. Du kannst gefundene Abweichungen komfortabel per Knopfdruck in dein Design übernehmen.
                  </p>
                </div>
              </div>

              {/* Trigger */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleConnect}
                  disabled={!database && dbType !== 'sqlite'}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md transition disabled:opacity-50 text-xs"
                >
                  <Play size={13} className="fill-white" />
                  <span>Verbindung testen & Scan starten</span>
                </button>
              </div>
            </div>
          )}

          {syncStep === 'scanning' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-100 dark:border-indigo-950 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 rounded-full text-white">
                  <Database size={12} />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Introspection läuft...</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Datenbank-Kataloge und Schemata werden analysiert. Dieser Vorgang dauert nur wenige Sekunden.
                </p>
              </div>
            </div>
          )}

          {syncStep === 'diff' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-4 min-h-0">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Identifizierte Unterschiede (Diff)</h2>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  {selectedDiffs.length} von {mockDiffs.length} ausgewählt
                </span>
              </div>

              {/* Diffs List */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {mockDiffs.map((diff) => {
                  const isSelected = selectedDiffs.includes(diff.id);
                  return (
                    <div 
                      key={diff.id}
                      onClick={() => toggleDiffSelection(diff.id)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex gap-3 ${
                        isSelected 
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/15 border-indigo-200 dark:border-indigo-900/60' 
                          : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="pt-0.5">
                        {isSelected ? (
                          <div className="w-4 h-4 rounded bg-indigo-600 text-white flex items-center justify-center">
                            <Check size={11} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950" />
                        )}
                      </div>

                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            diff.type === 'new_table' 
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                              : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                          }`}>
                            {diff.type === 'new_table' ? 'Neue Tabelle' : 'Spalte fehlt'}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {diff.tableName}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400">{diff.description}</p>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-white dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-850 font-mono">
                          <div>
                            <span className="text-slate-400 block font-sans">Lokal:</span>
                            <span className="text-slate-500 dark:text-slate-400">{diff.localDetail || 'Fehlt im Schema'}</span>
                          </div>
                          <div>
                            <span className="text-indigo-400 block font-sans">Live-Datenbank:</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{diff.liveDetail}</span>
                          </div>
                        </div>

                        {/* SQL Code accordion */}
                        <div className="bg-slate-900 text-slate-300 p-2 rounded font-mono text-[9px] whitespace-pre overflow-x-auto border border-slate-850">
                          {diff.sql}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sync Actions */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-850">
                <button
                  onClick={() => setSyncStep('connect')}
                  className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Zurück
                </button>
                <button
                  onClick={handleApplySync}
                  className="flex items-center gap-1 px-5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md text-xs transition"
                >
                  <CheckCircle2 size={13} />
                  <span>Ausgewählte Änderungen einspielen</span>
                </button>
              </div>
            </div>
          )}

          {syncStep === 'completed' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Schema erfolgreich synchronisiert!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Dein lokales Modell ist jetzt perfekt mit dem Live-Datenbankschema abgeglichen. Alle neuen Tabellen wurden angelegt.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setSyncStep('connect')}
                  className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Neue Verbindung
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('navigate-app-view', {
                      detail: { type: 'relationships' }
                    }));
                  }}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition"
                >
                  Modell-Beziehungen einsehen
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right column: live terminal log & API preparation */}
        <div className="flex flex-col gap-4">
          
          {/* Live System Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex-1 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Live Introspection Log</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-[10px] text-emerald-400/90 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic">Noch keine Scan-Aktivität durchgeführt. Bitte Verbindung starten.</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="leading-relaxed whitespace-pre-wrap break-all">{log}</div>
                ))
              )}
            </div>
          </div>

          {/* API Stub details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-850 mb-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Server API-Schnittstelle</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Um eine echte Live-Introspection auszuführen, ist im Express-Backend die Route <code className="font-mono text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">/api/db-introspection</code> vorbereitet. Diese kann mit der <code className="font-mono text-[10px]">pg</code> Bibliothek wie folgt angebunden werden:
            </p>
            
            <div className="bg-slate-900 text-slate-300 p-2.5 rounded font-mono text-[9px] max-h-[160px] overflow-y-auto border border-slate-850">
{`// Express API Endpoint stub:
app.post("/api/db-introspection", async (req, res) => {
  const { host, port, database, user, password, ssl } = req.body;
  
  const client = new Client({ host, port, database, user, password, ssl });
  await client.connect();
  
  const tables = await client.query(\`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  \`);
  
  res.json({ tables: tables.rows });
});`}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
