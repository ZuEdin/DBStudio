
import React, { useState, useEffect } from 'react';
import { Table, DbType } from '../../types/index';
import { calculateMigration, MigrationScript } from '../../services/migrationService';
import { X, GitCommit, ArrowRight, Database, Download, CheckCircle, FileCode } from 'lucide-react';

interface MigrationManagerModalProps {
  currentTables: Table[];
  lastSnapshot: Table[] | undefined;
  dbType: DbType;
  onSnapshot: () => void;
  onClose: () => void;
}

export const MigrationManagerModal: React.FC<MigrationManagerModalProps> = ({ currentTables, lastSnapshot, dbType, onSnapshot, onClose }) => {
  const [migration, setMigration] = useState<MigrationScript | null>(null);
  const [activeTab, setActiveTab] = useState<'up' | 'down'>('up');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
      const result = calculateMigration(currentTables, lastSnapshot || [], dbType);
      setMigration(result);
  }, [currentTables, lastSnapshot, dbType]);

  const handleApply = () => {
      onSnapshot();
      onClose();
  };

  const handleDownload = () => {
      if(!migration) return;
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0,14);
      const content = `-- Migration Up\n${migration.up}\n\n-- Migration Down\n${migration.down}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${timestamp}_migration.sql`;
      a.click();
  };

  const hasChanges = migration && migration.description !== 'No changes';

  return (
    <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border border-slate-300 overflow-hidden flex flex-col h-[700px]">
        <div className="bg-slate-800 text-white p-5 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2"><GitCommit className="text-orange-400"/> Datenbank Migrationen</h2>
            <button onClick={onClose}><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-hidden flex">
            {/* Sidebar: Change Log */}
            <div className="w-1/3 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Änderungen erkannt</h3>
                {hasChanges ? (
                    <div className="space-y-2">
                        {migration?.description.split('\n').map((line, i) => (
                            <div key={i} className="bg-white p-2 rounded border border-slate-200 text-sm shadow-sm flex gap-2">
                                <div className={`w-1 h-full rounded-l ${line.startsWith('Create') ? 'bg-green-500' : line.startsWith('Drop') ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                <span>{line}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-400 mt-10">
                        <CheckCircle size={48} className="mx-auto mb-2 text-green-500 opacity-50"/>
                        <p>Schema ist synchron.</p>
                    </div>
                )}
            </div>

            {/* Main: SQL Preview */}
            <div className="flex-1 flex flex-col bg-white">
                <div className="border-b border-slate-200 flex">
                    <button 
                        onClick={() => setActiveTab('up')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'up' ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Up Script (Apply)
                    </button>
                    <button 
                        onClick={() => setActiveTab('down')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'down' ? 'border-red-500 text-red-700 bg-red-50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Down Script (Revert)
                    </button>
                </div>
                <div className="flex-1 relative bg-slate-900 overflow-auto">
                    <pre className="p-4 text-xs font-mono text-green-400 leading-relaxed">
                        {activeTab === 'up' ? migration?.up : migration?.down}
                    </pre>
                </div>
            </div>
        </div>

        <div className="p-4 bg-slate-50 border-t flex justify-between items-center shrink-0">
            {showConfirm ? (
                <div className="flex items-center gap-3 w-full justify-end bg-orange-50 p-2 rounded border border-orange-200">
                    <span className="text-sm text-orange-800 font-medium">Snapshot wirklich aktualisieren?</span>
                    <button onClick={() => setShowConfirm(false)} className="text-slate-500 text-xs hover:underline">Abbrechen</button>
                    <button onClick={handleApply} className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-bold shadow-sm">Ja, bestätigen</button>
                </div>
            ) : (
                <>
                    <div className="text-xs text-slate-500">
                        Vergleicht aktuellen Entwurf mit dem letzten Snapshot.
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded text-sm">Abbrechen</button>
                        {hasChanges && (
                            <>
                                <button onClick={handleDownload} className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 rounded text-sm font-medium flex items-center gap-2">
                                    <Download size={16}/> SQL Speichern
                                </button>
                                <button onClick={() => setShowConfirm(true)} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-bold shadow-sm flex items-center gap-2">
                                    <Database size={16}/> Snapshot aktualisieren
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
