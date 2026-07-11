import React, { useState, useEffect } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { Table, Field } from '../../types/index';

// Modular Subcomponents
import { LiveDatabaseSyncStep1Connect } from './live-db-sync/LiveDatabaseSyncStep1Connect';
import { LiveDatabaseSyncStep2Scan } from './live-db-sync/LiveDatabaseSyncStep2Scan';
import { LiveDatabaseSyncStep3Diff, MockDiff } from './live-db-sync/LiveDatabaseSyncStep3Diff';
import { LiveDatabaseSyncStep4Completed } from './live-db-sync/LiveDatabaseSyncStep4Completed';
import { LiveDatabaseSyncLogPanel } from './live-db-sync/LiveDatabaseSyncLogPanel';

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
  const [mockDiffs, setMockDiffs] = useState<MockDiff[]>([]);

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

    const generatedDiffs: MockDiff[] = [
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
            { id: 'inv_id', name: 'Id', type: 'UUID', isPrimaryKey: true, allowNull: false, isUnique: true, defaultValue: 'gen_random_uuid()' },
            { id: 'inv_nr', name: 'InvoiceNumber', type: 'VARCHAR', isPrimaryKey: false, allowNull: false, isUnique: false, length: 255 },
            { id: 'inv_date', name: 'IssueDate', type: 'DATE', isPrimaryKey: false, allowNull: false, isUnique: false },
            { id: 'inv_tot', name: 'TotalAmount', type: 'DECIMAL', isPrimaryKey: false, allowNull: false, isUnique: false },
            { id: 'inv_paid', name: 'IsPaid', type: 'BOOLEAN', isPrimaryKey: false, allowNull: true, isUnique: false, defaultValue: 'false' },
            { id: 'inv_cust', name: 'CustomerId', type: 'UUID', isPrimaryKey: false, allowNull: true, isUnique: false }
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
            { id: 'aud_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, allowNull: false, isUnique: true },
            { id: 'aud_act', name: 'Action', type: 'VARCHAR', isPrimaryKey: false, allowNull: false, isUnique: false, length: 100 },
            { id: 'aud_tbl', name: 'TableName', type: 'VARCHAR', isPrimaryKey: false, allowNull: false, isUnique: false, length: 100 },
            { id: 'aud_time', name: 'Timestamp', type: 'DATETIME', isPrimaryKey: false, allowNull: true, isUnique: false, defaultValue: 'NOW()' }
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
        if (!projectTables.some(t => t.name.toLowerCase() === diff.tableName.toLowerCase())) {
          addTable(diff.suggestedTable);
          appliedCount++;
        }
      } else if (diff.type === 'missing_column') {
        const targetTable = projectTables.find(t => t.name === diff.tableName);
        if (targetTable) {
          const newField: Field = {
            id: `f_sync_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: 'PhoneNumber',
            type: 'VARCHAR',
            isPrimaryKey: false,
            allowNull: true,
            isUnique: false,
            length: 50
          };
          
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
            <LiveDatabaseSyncStep1Connect
              dbType={dbType}
              setDbType={setDbType}
              host={host}
              setHost={setHost}
              port={port}
              setPort={setPort}
              database={database}
              setDatabase={setDatabase}
              username={username}
              setUsername={setUsername}
              password={password}
              setPassword={setPassword}
              ssl={ssl}
              setSsl={setSsl}
              handleConnect={handleConnect}
            />
          )}

          {syncStep === 'scanning' && (
            <LiveDatabaseSyncStep2Scan />
          )}

          {syncStep === 'diff' && (
            <LiveDatabaseSyncStep3Diff
              mockDiffs={mockDiffs}
              selectedDiffs={selectedDiffs}
              toggleDiffSelection={toggleDiffSelection}
              setSyncStep={setSyncStep}
              handleApplySync={handleApplySync}
            />
          )}

          {syncStep === 'completed' && (
            <LiveDatabaseSyncStep4Completed
              setSyncStep={setSyncStep}
            />
          )}

        </div>

        {/* Right column: live terminal log & API preparation */}
        <div className="flex flex-col gap-4">
          <LiveDatabaseSyncLogPanel logs={logs} />
        </div>

      </div>

    </div>
  );
};
