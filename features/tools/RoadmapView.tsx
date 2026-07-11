import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Square, Play, RefreshCw, Layers, Server, Cloud, Laptop, 
  ArrowRight, Shield, Database, Users, MessageSquare, Ticket, 
  Activity, Sparkles, ChevronRight, Plus, Trash2, ArrowUpRight, CheckCircle2 
} from 'lucide-react';
import { Ticket as TicketType } from '../../types/index';

interface RoadmapViewProps {
  onAddTicket?: (title: string, description: string, priority: 'low' | 'medium' | 'high', assignedTo: string) => Promise<void>;
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
  onSetView: (view: any) => void;
}

interface RoadmapItem {
  id: string;
  phase: number;
  task: string;
  defaultCompleted: boolean;
  category: string;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  onAddTicket,
  showMessage,
  onSetView
}) => {
  // Pre-loaded items from TODO.md Checklist
  const defaultItems: RoadmapItem[] = [
    // Phase 1
    { id: 'p1_sqlite', phase: 1, task: 'SQLite-Verbindungstreiber für Electron/Tauri konfigurieren.', defaultCompleted: true, category: 'Local Mode' },
    { id: 'p1_indexeddb', phase: 1, task: 'IndexedDB Wrapper für Browser-Fallback schreiben (Projekt-Auto-Save).', defaultCompleted: true, category: 'Local Mode' },
    { id: 'p1_styling', phase: 1, task: 'Styling-Frameworks (Bootstrap/Tailwind) sauber trennen und im Code-Generator unterstützen.', defaultCompleted: true, category: 'Local Mode' },
    
    // Phase 2
    { id: 'p2_express', phase: 2, task: 'Express/NestJS Server-Vorlage für den Cloud Hub erstellen.', defaultCompleted: true, category: 'Cloud backend' },
    { id: 'p2_rls', phase: 2, task: 'Multi-Tenant Isolation auf Datenbankebene (RLS - Row Level Security) implementieren.', defaultCompleted: true, category: 'Cloud backend' },
    { id: 'p2_jwt', phase: 2, task: 'JWT und OAuth2 (z. B. GitHub, Google) für Team-Logins bereitstellen.', defaultCompleted: true, category: 'Cloud backend' },
    
    // Phase 3
    { id: 'p3_diff', phase: 3, task: 'Eine UI-Komponente erstellen, die lokale Schema-Änderungen anzeigt.', defaultCompleted: true, category: 'Sync Assistant' },
    { id: 'p3_question', phase: 3, task: 'Fragebogen-Schnittstelle implementieren ("Was soll implementiert werden?").', defaultCompleted: true, category: 'Sync Assistant' },
    { id: 'p3_fk_val', phase: 3, task: 'Validierung von FK-Beziehungen vor dem Upload, um referenzielle Integrität zu sichern.', defaultCompleted: true, category: 'Sync Assistant' },
    { id: 'p3_mock', phase: 3, task: 'Mock-Verbindung für Demonstrationszwecke einbauen.', defaultCompleted: true, category: 'Sync Assistant' },
    
    // Phase 4
    { id: 'p4_mp_cursor', phase: 4, task: 'Multiplayer Cursor-Simulation für Live-Sitzungen.', defaultCompleted: true, category: 'Multiplayer' },
    { id: 'p4_kanban', phase: 4, task: 'Integriertes Kanban-Ticketsystem zur Aufgabensteuerung direkt an Datenfeldern.', defaultCompleted: true, category: 'Multiplayer' },
    { id: 'p4_chat', phase: 4, task: 'Echtzeit-Team-Chat-Panel mit Benachrichtigungsdienst für Schema-Änderungen.', defaultCompleted: true, category: 'Multiplayer' },
    { id: 'p4_git', phase: 4, task: 'Versionsverwaltung (Git-ähnlicher Commit-Verlauf für Schemata).', defaultCompleted: true, category: 'Multiplayer' }
  ];

  // Load state from localStorage or default
  const [items, setItems] = useState<RoadmapItem[]>(() => {
    try {
      const saved = localStorage.getItem('db_studio_roadmap_items');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return defaultItems;
  });

  const [completedState, setCompletedState] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('db_studio_roadmap_completed');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    // Set default values
    const initial: Record<string, boolean> = {};
    defaultItems.forEach(item => {
      initial[item.id] = item.defaultCompleted;
    });
    return initial;
  });

  // Custom User tasks
  const [customTask, setCustomTask] = useState('');
  const [customPhase, setCustomPhase] = useState<number>(1);
  const [customCategory, setCustomCategory] = useState('Benutzerdefiniert');

  // Info card active section
  const [activeArchSection, setActiveArchSection] = useState<'local' | 'sync' | 'cloud'>('local');

  // Save changes to localStorage on state changes
  useEffect(() => {
    localStorage.setItem('db_studio_roadmap_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('db_studio_roadmap_completed', JSON.stringify(completedState));
  }, [completedState]);

  const toggleTask = (id: string) => {
    setCompletedState(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      return updated;
    });
    showMessage("Planer aktualisiert", "Task-Status wurde angepasst.", "info");
  };

  const addCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTask.trim()) return;

    const newId = 'custom-' + crypto.randomUUID();
    const newItem: RoadmapItem = {
      id: newId,
      phase: customPhase,
      task: customTask.trim(),
      defaultCompleted: false,
      category: customCategory || 'Custom'
    };

    setItems(prev => [...prev, newItem]);
    setCompletedState(prev => ({ ...prev, [newId]: false }));
    setCustomTask('');
    showMessage("Task hinzugefügt", "Ihr benutzerdefiniertes Meilenstein-Ziel wurde in den Fahrplan aufgenommen.", "success");
  };

  const deleteCustomTask = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setCompletedState(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    showMessage("Task gelöscht", "Ziel wurde aus dem Fahrplan entfernt.", "info");
  };

  // Convert roadmap item to a team ticket
  const convertToTicket = async (item: RoadmapItem) => {
    if (!onAddTicket) {
      showMessage("Fehler", "Ticketsystem-Schnittstelle ist momentan nicht bereit.", "error");
      return;
    }

    try {
      await onAddTicket(
        `Implementieren: ${item.task.substring(0, 50)}...`,
        `Roadmap Phase ${item.phase} - ${item.category}\n\nVoller Auftrag:\n${item.task}\n\n(Automatisch aus dem DB Studio Pro ToDo-Planer generiert)`,
        item.phase >= 3 ? 'high' : 'medium',
        'u2' // Assign to Sarah as a teammate
      );
      showMessage("In Ticket umgewandelt", "Der Meilenstein wurde als offene Aufgabe im Kanban Board für Sarah hinterlegt!", "success");
    } catch (err) {
      showMessage("Fehler", "Ticket konnte nicht angelegt werden.", "error");
    }
  };

  // Calculate statistics
  const getPhaseStats = (phase: number) => {
    const phaseItems = items.filter(i => i.phase === phase);
    const completedCount = phaseItems.filter(i => completedState[i.id]).length;
    const totalCount = phaseItems.length;
    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    return { completedCount, totalCount, pct };
  };

  const totalCompleted = items.filter(i => completedState[i.id]).length;
  const totalTasks = items.length;
  const totalPct = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Header Bar */}
      <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 text-white">
            <CheckSquare className="text-emerald-400 shrink-0" size={20} />
            <span>DB Studio Pro - Roadmap &amp; Fahrplan</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">Interaktive ToDo.md</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Planen und visualisieren Sie die Entwicklung des self-hosted Backends sowie die Kollaborations-Roadmap direkt im System.
          </p>
        </div>

        {/* Global Progress Display */}
        <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 shrink-0 w-full md:w-auto">
          <div className="text-right shrink-0">
            <div className="text-xs text-slate-400 font-semibold">Gesamtfortschritt</div>
            <div className="text-sm font-bold text-white">{totalCompleted} / {totalTasks} erledigt</div>
          </div>
          <div className="relative w-24 h-2 bg-slate-800 rounded-full overflow-hidden shrink-0">
            <div className="absolute top-0 bottom-0 left-0 bg-emerald-500 transition-all duration-500" style={{ width: `${totalPct}%` }} />
          </div>
          <span className="text-xs font-bold text-emerald-400 shrink-0 font-mono">{totalPct}%</span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: The Interactive Checklists */}
        <div className="xl:col-span-7 space-y-6 flex flex-col min-h-0">
          
          {/* Quick instructions */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 flex items-center gap-3">
            <Sparkles className="text-indigo-400 shrink-0" size={18} />
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Entwicklungs-Fahrplan:</strong> Haken Sie Meilensteine ab, um Ihren Projektfortschritt zu loggen. Sie können Meilensteine direkt in <strong>Kanban-Tickets</strong> für Ihr Team umwandeln oder eigene Meilensteine definieren.
            </p>
          </div>

          {/* Phase 1-4 Accordion Checklist */}
          {[1, 2, 3, 4].map(phaseNum => {
            const stats = getPhaseStats(phaseNum);
            const phaseTitle = phaseNum === 1 ? 'Phase 1: Lokaler State & IndexedDB Sync (Local Mode)' :
                               phaseNum === 2 ? 'Phase 2: Team-Cloud Backend & API-Infrastruktur' :
                               phaseNum === 3 ? 'Phase 3: Der Interaktive Sync-Assistent (Local -> Cloud)' :
                               'Phase 4: Team-Kollaborations-Werkzeuge (Multiplayer)';
            const phaseIcon = phaseNum === 1 ? <Laptop size={15} className="text-amber-400" /> :
                              phaseNum === 2 ? <Server size={15} className="text-indigo-400" /> :
                              phaseNum === 3 ? <RefreshCw size={15} className="text-sky-400 animate-pulse" /> :
                              <Users size={15} className="text-emerald-400" />;

            return (
              <div key={phaseNum} className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
                
                {/* Accordion Phase Header */}
                <div className="px-4 py-3 bg-slate-900 flex items-center justify-between border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {phaseIcon}
                    <h3 className="text-xs font-bold text-white tracking-wide uppercase font-sans">{phaseTitle}</h3>
                  </div>
                  
                  {/* Phase stats */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {stats.completedCount}/{stats.totalCount} Done
                    </span>
                    <span className={`text-xs font-bold font-mono ${stats.pct === 100 ? 'text-emerald-400' : 'text-indigo-300'}`}>
                      {stats.pct}%
                    </span>
                  </div>
                </div>

                {/* Checklist Body */}
                <div className="p-4 divide-y divide-slate-800/40 space-y-1 max-h-64 overflow-y-auto">
                  {items.filter(item => item.phase === phaseNum).map(item => {
                    const isDone = !!completedState[item.id];
                    return (
                      <div key={item.id} className="flex items-start justify-between gap-4 py-2.5 hover:bg-slate-900/35 px-2 rounded-lg transition-colors group">
                        
                        {/* Left Label with Checkbox */}
                        <div className="flex items-start gap-3 cursor-pointer select-none" onClick={() => toggleTask(item.id)}>
                          <span className="mt-0.5 text-slate-500 hover:text-indigo-400 transition-colors shrink-0">
                            {isDone ? (
                              <CheckCircle2 size={16} className="text-emerald-400" />
                            ) : (
                              <Square size={16} className="text-slate-600" />
                            )}
                          </span>
                          <div>
                            <p className={`text-xs leading-relaxed transition-all ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                              {item.task}
                            </p>
                            <span className="inline-block mt-1 text-[9px] font-mono text-indigo-400 uppercase tracking-wide bg-indigo-500/10 px-1.5 py-0.2 rounded">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        {/* Right Quick Action: Convert to Ticket / Delete */}
                        <div className="flex items-center gap-2 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                          
                          {/* Convert to Kanban Ticket Button */}
                          <button
                            onClick={() => convertToTicket(item)}
                            title="In Team-Aufgabe / Kanban-Ticket umwandeln"
                            className="p-1 rounded bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-400 transition-all border border-slate-700/50"
                          >
                            <Ticket size={11} />
                          </button>

                          {/* Delete custom task */}
                          {item.id.startsWith('custom-') && (
                            <button
                              onClick={() => deleteCustomTask(item.id)}
                              title="Ziel löschen"
                              className="p-1 rounded bg-slate-800 hover:bg-red-600 hover:text-white text-red-400 transition-all border border-slate-700/50"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                  {items.filter(item => item.phase === phaseNum).length === 0 && (
                    <p className="text-xs text-slate-500 italic py-3 text-center">Keine Meilensteine in dieser Phase vorhanden.</p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add custom Meilenstein Goal */}
          <form onSubmit={addCustomTask} className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Plus size={14} className="text-indigo-400" />
              <span>Einen eigenen Projekt-Meilenstein hinzufügen</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6">
                <input 
                  type="text" 
                  value={customTask}
                  onChange={e => setCustomTask(e.target.value)}
                  placeholder="z.B. Integration von Supabase als Ausweich-Provider..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                />
              </div>
              <div className="md:col-span-3">
                <select
                  value={customPhase}
                  onChange={e => setCustomPhase(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-300 font-sans"
                >
                  <option value={1}>Phase 1 (Lokal)</option>
                  <option value={2}>Phase 2 (Cloud DB)</option>
                  <option value={3}>Phase 3 (Sync)</option>
                  <option value={4}>Phase 4 (Team)</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus size={12} />
                  <span>Hinzufügen</span>
                </button>
              </div>
            </div>
          </form>

        </div>

        {/* Right 5 Columns: The Flowchart & Metadata Schemas */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Architecture Chart (Section 1) */}
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800 flex flex-col">
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <Activity className="text-indigo-400" size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Zwei-System-Architektur (Visualisierung)</h3>
            </div>

            {/* Interactive Flowchart Graphics with standard CSS/Tailwind */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex flex-col items-center justify-center gap-2 shrink-0">
              
              {/* Local Dev Server Module */}
              <button 
                onClick={() => setActiveArchSection('local')}
                className={`w-full p-3 rounded-lg border text-left transition-all ${activeArchSection === 'local' ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-white font-sans">
                    <Laptop size={13} className="text-amber-400" />
                    <span>Lokal-First Desktop (Entwickler)</span>
                  </span>
                  <span className="text-[9px] font-bold text-amber-300 uppercase px-1 rounded bg-amber-500/10">SQLite / IndexedDB</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Sichere lokale Metadaten-Generierung, läuft komplett offline auf Ihrem System.</p>
              </button>

              {/* Connector */}
              <div className="flex flex-col items-center my-0.5">
                <div className="w-0.5 h-6 bg-slate-800 relative flex items-center justify-center">
                  <div className="absolute top-1/2 -translate-y-1/2 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[8px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                    Sync-Wizard
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-600 transform rotate-90 -mt-1" />
              </div>

              {/* Sync Bridge Module */}
              <button 
                onClick={() => setActiveArchSection('sync')}
                className={`w-full p-3 rounded-lg border text-left transition-all ${activeArchSection === 'sync' ? 'bg-sky-500/10 border-sky-500/50 shadow-lg shadow-sky-500/5' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-white font-sans">
                    <RefreshCw size={12} className="text-sky-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Sync Bridge (Uploader)</span>
                  </span>
                  <span className="text-[9px] font-bold text-sky-300 uppercase px-1 rounded bg-sky-500/10">SQL Migrations</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Interaktive Diff-Analyse, FK-Validierung und automatische Routen-Generierung.</p>
              </button>

              {/* Connector */}
              <div className="flex flex-col items-center my-0.5">
                <div className="w-0.5 h-4 bg-slate-800" />
                <ChevronRight size={14} className="text-slate-600 transform rotate-90 -mt-1" />
              </div>

              {/* Team-Cloud Hub Hosted Server Module */}
              <button 
                onClick={() => setActiveArchSection('cloud')}
                className={`w-full p-3 rounded-lg border text-left transition-all ${activeArchSection === 'cloud' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/5' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-white font-sans">
                    <Cloud size={13} className="text-emerald-400" />
                    <span>Team-Cloud Hub (Hosted Cluster)</span>
                  </span>
                  <span className="text-[9px] font-bold text-emerald-300 uppercase px-1 rounded bg-emerald-500/10">Postgres / Spanner</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Mandantenfähige Kollaboration, Multiplayer-Sitzungen und synchronisierte Tickets.</p>
              </button>

            </div>

            {/* Explanations section */}
            <div className="mt-4 p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex-1">
              {activeArchSection === 'local' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                    <Laptop size={14} />
                    <span>Lokal-First Fokus</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Alle in DB Studio Pro angelegten Entwürfe sind standardmäßig absolut privat. Über den Offline-Adapter (SQLite in der Electron App oder IndexedDB im Browser-Fallback) werden alle relationalen Metadaten sicher und ohne Netzwerkanforderung lokal persistiert.
                  </p>
                  <p className="text-[10px] text-slate-500 italic">Entspricht Phase 1 des Entwicklungsplans.</p>
                </div>
              )}

              {activeArchSection === 'sync' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sky-400 text-xs font-bold">
                    <RefreshCw size={14} />
                    <span>Intelligente Synchronisation</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Der Sync-Wizard gleicht Ihre lokale Datenbank-Struktur ab. Er validiert Fremdschlüssel-Sicherungen, führt einen Diff mit dem Serverstand durch und generiert zerstörungsfreie relationale DDL-Migrationsskripte für Postgres.
                  </p>
                  <p className="text-[10px] text-slate-500 italic">Entspricht Phase 3 des Entwicklungsplans.</p>
                </div>
              )}

              {activeArchSection === 'cloud' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                    <Cloud size={14} />
                    <span>Team-Cloud &amp; Mandantenfähigkeit</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sobald Daten in die Team-Cloud gepusht sind, können Teamkollegen wie Sarah oder Tom diese einsehen. Row-Level Security (RLS) verhindert die Datenüberschneidung zwischen Organisationen. Echtzeit-WebSockets halten Cursor und Chats synchron.
                  </p>
                  <p className="text-[10px] text-slate-500 italic">Entspricht Phase 2 &amp; 4 des Entwicklungsplans.</p>
                </div>
              )}
            </div>

          </div>

          {/* Quick Stats Panel */}
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Erledigte Meilensteine</h4>
              <p className="text-2xl font-black text-white mt-1 font-mono">{totalCompleted} / {totalTasks}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Offene Tickets im System</h4>
              <p className="text-2xl font-black text-indigo-400 mt-1 font-mono text-right">100% Sicher</p>
            </div>
            <button
              onClick={() => onSetView({ type: 'tickets_board' })}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition-colors flex items-center gap-1"
            >
              <span>Tickets öffnen</span>
              <ArrowUpRight size={12} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
