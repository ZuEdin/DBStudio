import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';
import { Table, Relationship } from '../../types/index';
import { 
  GitBranch, GitCommit, GitFork, History, RefreshCw, Check, 
  ChevronRight, ArrowLeft, Code, Play, Plus, Trash, User, Info, AlertTriangle
} from 'lucide-react';

interface SchemaCommit {
  id: string;
  sha: string;
  message: string;
  author: string;
  timestamp: number;
  tables: Table[];
  relationships: Relationship[];
  branch: string;
}

export const VersionControlView: React.FC = () => {
  const store = useProjectStore();
  const ui = useUIStore();
  
  const [commits, setCommits] = useState<SchemaCommit[]>([]);
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);
  
  // Commit Form State
  const [commitMessage, setCommitMessage] = useState('');
  const [commitAuthor, setCommitAuthor] = useState('Me');
  const [activeBranch, setActiveBranch] = useState('main');

  const [showJsonModal, setShowJsonModal] = useState<string | null>(null);

  // Storage Key Scoped to Project
  const storageKey = `dbstudio_git_commits_${store.projectId || 'default'}`;

  // Initialize and load commits from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCommits(parsed);
        if (parsed.length > 0) {
          setSelectedCommitId(parsed[0].id);
        }
      } catch (e) {
        generateDefaultCommits();
      }
    } else {
      generateDefaultCommits();
    }
  }, [store.projectId]);

  const generateDefaultCommits = () => {
    // Generate some interesting history based on the current tables
    const currentTables = store.tables || [];
    const currentRels = store.relationships || [];

    const mockCommits: SchemaCommit[] = [
      {
        id: 'c1',
        sha: 'f72a1bc',
        message: 'Initiales Datenbankschema erstellt',
        author: 'Sarah Lee',
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        tables: currentTables.slice(0, Math.min(2, currentTables.length)),
        relationships: currentRels.slice(0, Math.min(1, currentRels.length)),
        branch: 'main'
      },
      {
        id: 'c2',
        sha: 'b819a0e',
        message: 'Fremdschlüssel-Beziehungen und Indizes hinzugefügt',
        author: 'Tom H.',
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
        tables: currentTables.slice(0, Math.min(4, currentTables.length)),
        relationships: currentRels,
        branch: 'main'
      }
    ];

    setCommits(mockCommits);
    setSelectedCommitId(mockCommits[1].id);
    localStorage.setItem(storageKey, JSON.stringify(mockCommits));
  };

  const handleCreateCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;

    const newCommit: SchemaCommit = {
      id: crypto.randomUUID(),
      sha: Math.random().toString(16).substring(2, 9),
      message: commitMessage.trim(),
      author: commitAuthor,
      timestamp: Date.now(),
      tables: JSON.parse(JSON.stringify(store.tables || [])),
      relationships: JSON.parse(JSON.stringify(store.relationships || [])),
      branch: activeBranch
    };

    const updated = [newCommit, ...commits];
    setCommits(updated);
    setSelectedCommitId(newCommit.id);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setCommitMessage('');

    ui.addToast(`Schema erfolgreich eingecheckt! (Commit ${newCommit.sha})`, 'success');
  };

  const handleCheckoutCommit = (commit: SchemaCommit) => {
    store.executeAction(s => {
      s.tables = JSON.parse(JSON.stringify(commit.tables));
      s.relationships = JSON.parse(JSON.stringify(commit.relationships));
    });
    
    ui.addToast(`Workspace auf Stand von Commit '${commit.sha}' zurückgesetzt.`, 'success');
  };

  const handleDeleteCommit = (id: string) => {
    const filtered = commits.filter(c => c.id !== id);
    setCommits(filtered);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    if (selectedCommitId === id) {
      setSelectedCommitId(filtered[0]?.id || null);
    }
    ui.addToast('Commit aus dem lokalen Verlauf gelöscht.', 'info');
  };

  const getSelectedCommit = () => {
    return commits.find(c => c.id === selectedCommitId) || null;
  };

  const selectedCommit = getSelectedCommit();

  // Find previous commit to compare and compute diffs
  const getPreviousCommit = (commit: SchemaCommit) => {
    const idx = commits.findIndex(c => c.id === commit.id);
    if (idx !== -1 && idx < commits.length - 1) {
      return commits[idx + 1];
    }
    return null;
  };

  const previousCommit = selectedCommit ? getPreviousCommit(selectedCommit) : null;

  // Compute detailed diff between selected and previous commit
  const computeDiff = () => {
    if (!selectedCommit) return { added: [], removed: [], modified: [] };
    
    const current = selectedCommit.tables;
    const base = previousCommit ? previousCommit.tables : [];

    const added: string[] = [];
    const removed: string[] = [];
    const modified: { tableName: string; fieldDiffs: string[] }[] = [];

    current.forEach(t => {
      const baseTable = base.find(bt => bt.id === t.id);
      if (!baseTable) {
        added.push(t.name);
      } else {
        const fieldDiffs: string[] = [];
        
        // Check for table rename
        if (baseTable.name !== t.name) {
          fieldDiffs.push(`Umbenannt von '${baseTable.name}' in '${t.name}'`);
        }

        // Check added fields
        t.fields.forEach(f => {
          const baseField = baseTable.fields.find(bf => bf.id === f.id);
          if (!baseField) {
            fieldDiffs.push(`Spalte hinzugefügt: '${f.name}' (${f.type})`);
          } else if (baseField.name !== f.name || baseField.type !== f.type) {
            fieldDiffs.push(`Spalte geändert: '${baseField.name}' (${baseField.type}) -> '${f.name}' (${f.type})`);
          }
        });

        // Check removed fields
        baseTable.fields.forEach(bf => {
          if (!t.fields.some(f => f.id === bf.id)) {
            fieldDiffs.push(`Spalte entfernt: '${bf.name}'`);
          }
        });

        if (fieldDiffs.length > 0) {
          modified.push({ tableName: t.name, fieldDiffs });
        }
      }
    });

    base.forEach(bt => {
      if (!current.some(t => t.id === bt.id)) {
        removed.push(bt.name);
      }
    });

    return { added, removed, modified };
  };

  const diff = computeDiff();

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col h-full overflow-hidden">
      {/* Title Header */}
      <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <History className="text-amber-500" size={24} />
            <span>Git-Schema-Versionierung</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verwalten Sie inkrementelle Schema-Snapshots, vergleichen Sie Tabellendifferenzen und rollen Sie Schema-Entwürfe im Team zurück.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-full text-xs font-semibold border border-amber-200/50">
            <GitBranch size={14} />
            <span>Zweig: {activeBranch}</span>
          </div>
          <button 
            onClick={generateDefaultCommits}
            className="flex items-center gap-1 px-3 py-1 text-xs border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition text-slate-600 dark:text-slate-300"
            title="Historie auf Standard-Demos zurücksetzen"
          >
            <RefreshCw size={12} />
            <span>Verlauf zurücksetzen</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Timeline Panel */}
        <div className="w-1/2 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900">
          
          {/* Commit Form */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <form onSubmit={handleCreateCommit} className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Neuen Schema-Commit erstellen</h3>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="z.B. Feature: Tabelle 'Customers' hinzugefügt"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:border-amber-500 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <select
                    value={commitAuthor}
                    onChange={(e) => setCommitAuthor(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:border-amber-500 dark:text-white"
                  >
                    <option value="Me">Ich (Entwickler)</option>
                    <option value="Sarah Lee">Sarah Lee (Lead)</option>
                    <option value="Tom H.">Tom H. (Backend)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-[10px] text-slate-400">
                  Übernimmt {store.tables?.length || 0} Tabellen und {store.relationships?.length || 0} Beziehungen.
                </p>
                <button
                  type="submit"
                  disabled={!commitMessage.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:dark:bg-slate-800 text-white text-xs font-bold rounded shadow transition-all"
                >
                  <Plus size={14} />
                  <span>Schema committen</span>
                </button>
              </div>
            </form>
          </div>

          {/* Commits List / Timeline */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Commit-Verlauf (Lokale Zeitlinie)</h3>
            
            {commits.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Info size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Keine Commits vorhanden.</p>
                <button 
                  onClick={generateDefaultCommits}
                  className="mt-2 text-xs text-amber-500 underline"
                >
                  Mock-Daten generieren
                </button>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6">
                {commits.map((commit, index) => {
                  const isSelected = selectedCommitId === commit.id;
                  const date = new Date(commit.timestamp).toLocaleString('de-DE', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div key={commit.id} className="relative pl-6">
                      {/* Timeline Dot */}
                      <span className={`absolute -left-2 top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition ${
                        isSelected 
                          ? 'border-amber-500 scale-125 shadow-sm' 
                          : 'border-slate-300 dark:border-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                      </span>

                      {/* Card block */}
                      <div 
                        onClick={() => setSelectedCommitId(commit.id)}
                        className={`p-3.5 rounded-lg border text-left cursor-pointer transition ${
                          isSelected 
                            ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-300 dark:border-amber-800/60 shadow-sm' 
                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-bold">
                            {commit.sha}
                          </span>
                          <span className="text-[10px] text-slate-400">{date}</span>
                        </div>

                        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                          {commit.message}
                        </h4>

                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-700 dark:text-slate-300">
                              {commit.author[0]}
                            </div>
                            <span>{commit.author}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span>{commit.tables?.length || 0} Tabellen</span>
                            <span>{commit.relationships?.length || 0} Rel.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="w-1/2 flex flex-col h-full bg-white dark:bg-slate-900">
          {selectedCommit ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Commit Head Details */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Ausgewählter Commit</span>
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {selectedCommit.message}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded font-bold">
                      SHA: {selectedCommit.sha}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(selectedCommit.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <User size={14} className="text-slate-400" />
                    <span>Autor: <strong className="text-slate-800 dark:text-slate-200">{selectedCommit.author}</strong></span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowJsonModal(JSON.stringify(selectedCommit.tables, null, 2))}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300"
                    >
                      <Code size={12} />
                      <span>JSON Schema</span>
                    </button>
                    
                    <button
                      onClick={() => handleCheckoutCommit(selectedCommit)}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold rounded shadow transition-all"
                    >
                      <Play size={12} />
                      <span>Wiederherstellen (Checkout)</span>
                    </button>

                    <button
                      onClick={() => handleDeleteCommit(selectedCommit.id)}
                      className="p-1 hover:text-red-500 text-slate-400 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
                      title="Commit löschen"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Commit Diffs / Tables List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Visual Schema Diff Box */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Änderungen in diesem Commit</h3>
                  
                  {!previousCommit ? (
                    <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded flex items-center gap-2">
                      <Info size={14} />
                      <span>Dies ist der erste Commit in der Historie. Er importiert alle Tabellen als initiales Schema.</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Added Tables */}
                      {diff.added.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Hinzugefügte Tabellen</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {diff.added.map(t => (
                              <span key={t} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs rounded border border-emerald-100">
                                + {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Modified Tables */}
                      {diff.modified.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Geänderte Tabellen</span>
                          <div className="mt-1 space-y-1.5">
                            {diff.modified.map(m => (
                              <div key={m.tableName} className="text-xs bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900 p-2 rounded">
                                <span className="font-bold text-blue-800 dark:text-blue-300">{m.tableName}</span>
                                <ul className="list-disc list-inside mt-1 space-y-0.5 pl-1 text-[11px] text-slate-600 dark:text-slate-400">
                                  {m.fieldDiffs.map((fd, i) => (
                                    <li key={i}>{fd}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Removed Tables */}
                      {diff.removed.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Gelöschte Tabellen</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {diff.removed.map(t => (
                              <span key={t} className="px-2 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs rounded border border-red-100">
                                - {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {diff.added.length === 0 && diff.modified.length === 0 && diff.removed.length === 0 && (
                        <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded text-center italic">
                          Keine Tabellen- oder Spalten-Änderungen in diesem Commit.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Schema Snapshots Tables list */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Gesichertes Tabellen-Schema ({selectedCommit.tables?.length || 0} Tabellen)
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {selectedCommit.tables?.map(t => (
                      <div key={t.id} className="border border-slate-100 dark:border-slate-800 p-2.5 rounded bg-slate-50/50 dark:bg-slate-900/40">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{t.name}</span>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {t.fields?.map(f => (
                            <span key={f.id} className="text-[9px] bg-slate-200/60 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-400 font-mono">
                              {f.name} <span className="text-slate-400 text-[8px]">{f.type}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-slate-400 italic text-sm">
              Bitte wählen Sie links einen Commit aus, um die Differenz anzuzeigen.
            </div>
          )}
        </div>
      </div>

      {/* JSON Viewer Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-lg">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Code size={16} className="text-amber-500" />
                <span>JSON Schema-Snapshot</span>
              </h3>
              <button 
                onClick={() => setShowJsonModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Schließen
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed rounded-b-lg">
              <pre className="whitespace-pre-wrap">{showJsonModal}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
