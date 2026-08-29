import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, Trash2, Send, ShieldAlert, CheckCircle2, Copy, X } from 'lucide-react';
import { globalEventBus } from './mfeEventBus';
import { MfeBaseEvent, MfeDomain } from './mfeEventTypes';

interface EventBusInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EventBusInspectorModal: React.FC<EventBusInspectorModalProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<ReadonlyArray<MfeBaseEvent>>([]);
  const [deadLetters, setDeadLetters] = useState<ReadonlyArray<MfeBaseEvent>>([]);
  const [selectedEvent, setSelectedEvent] = useState<MfeBaseEvent | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Test publisher state
  const [testDomain, setTestDomain] = useState<MfeDomain>('STUDIO');
  const [testEventType, setTestEventType] = useState<string>('SHELL:PROJECT_SELECTED');
  const [testPayload, setTestPayload] = useState<string>(
    JSON.stringify({ projectId: 'PROJ-101', projectNumber: 'BV-2026-08', title: 'Neubau Bürogebäude' }, null, 2)
  );

  const refreshData = () => {
    setEvents(globalEventBus.getHistory());
    setDeadLetters(globalEventBus.getDeadLetters());
  };

  useEffect(() => {
    if (!isOpen) return;
    refreshData();
    const unsub = globalEventBus.subscribe('*', () => {
      refreshData();
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEvents = events.filter((e) => {
    if (filterDomain !== 'ALL' && e.sourceDomain !== filterDomain) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.eventType.toLowerCase().includes(q) ||
        e.sourceDomain.toLowerCase().includes(q) ||
        JSON.stringify(e.payload).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSendTestEvent = () => {
    try {
      const parsed = JSON.parse(testPayload);
      globalEventBus.publish(testEventType, testDomain, parsed);
      refreshData();
    } catch (e: any) {
      alert('Ungültiges JSON-Format im Test-Payload: ' + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Radio size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                Cross-MFE Event-Bus Inspector & DevTools
                <span className="bg-indigo-500/30 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full border border-indigo-400/30 font-mono">
                  v1.0 Standard
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Echtzeit-Überwachung aller asynchronen Micro-Frontend Ereignisse (Pub/Sub)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Aktualisieren"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={() => {
                globalEventBus.clearHistory();
                refreshData();
                setSelectedEvent(null);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 transition-colors"
              title="Verlauf leeren"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-2"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Top Control Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <input
              type="text"
              placeholder="Events oder Payloads filtern..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden"
            >
              <option value="ALL">Alle Domains</option>
              <option value="SHELL">SHELL</option>
              <option value="CRM">CRM</option>
              <option value="ARTICLES">ARTICLES</option>
              <option value="CALC">CALC</option>
              <option value="BILLING">BILLING</option>
              <option value="STUDIO">STUDIO</option>
            </select>
          </div>

          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Events: <strong className="text-slate-800 dark:text-slate-200">{events.length}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-amber-500" />
              <span>Dead Letters: <strong className="text-slate-800 dark:text-slate-200">{deadLetters.length}</strong></span>
            </span>
          </div>
        </div>

        {/* Main Content Area (2-Columns) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Event Stream */}
          <div className="w-1/2 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 flex justify-between">
              <span>Event Timeline</span>
              <span>{filteredEvents.length} Treffer</span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/70 p-1">
              {filteredEvents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  Keine Events im Verlauf aufgezeichnet.
                </div>
              ) : (
                filteredEvents.slice().reverse().map((e) => (
                  <button
                    key={e.eventId}
                    onClick={() => setSelectedEvent(e)}
                    className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start justify-between gap-2 ${
                      selectedEvent?.eventId === e.eventId
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-l-4 border-indigo-600 shadow-xs'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">
                          {e.sourceDomain}
                        </span>
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">
                          {e.eventType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate font-mono">
                        {JSON.stringify(e.payload)}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Event Detail & Dispatcher */}
          <div className="w-1/2 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
            {selectedEvent ? (
              <div className="flex-1 flex flex-col overflow-hidden p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedEvent.eventType}</h3>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {selectedEvent.eventId}</div>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedEvent, null, 2))}
                    className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1"
                    title="JSON kopieren"
                  >
                    <Copy size={13} /> Kopieren
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Source Domain</div>
                      <div className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono">{selectedEvent.sourceDomain}</div>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Target Domain</div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{selectedEvent.targetDomain || '*'}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Payload Content</div>
                    <pre className="bg-slate-950 text-emerald-400 p-3 rounded-xl text-xs font-mono overflow-x-auto max-h-56">
                      {JSON.stringify(selectedEvent.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 text-xs">
                <Radio size={32} className="mb-2 text-slate-300 dark:text-slate-700" />
                Wähle ein Event aus der linken Timeline aus, um Payload & Metadaten im Detail zu analysieren.
              </div>
            )}

            {/* Bottom: Test Event Publisher */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                <span>Test Event manuell publishen</span>
                <button
                  onClick={handleSendTestEvent}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Send size={12} /> Senden
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <select
                  value={testDomain}
                  onChange={(e) => setTestDomain(e.target.value as MfeDomain)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-hidden"
                >
                  <option value="SHELL">SHELL</option>
                  <option value="CRM">CRM</option>
                  <option value="ARTICLES">ARTICLES</option>
                  <option value="CALC">CALC</option>
                  <option value="BILLING">BILLING</option>
                  <option value="STUDIO">STUDIO</option>
                </select>
                <input
                  type="text"
                  value={testEventType}
                  onChange={(e) => setTestEventType(e.target.value)}
                  placeholder="EventType z.B. SHELL:PROJECT_SELECTED"
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 font-mono focus:outline-hidden"
                />
              </div>
              <textarea
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                rows={2}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-[11px] font-mono focus:outline-hidden resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
