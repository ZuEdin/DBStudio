import React, { useState, useEffect } from 'react';
import { Route, CheckCircle, Clock, Circle, ArrowDown, ArrowUp, Table, HelpCircle, Save } from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';

interface PhaseState {
  status: 'planned' | 'in_progress' | 'completed';
  notes: string;
  linkedTables: string[];
}

interface VModelDesignerProps {
  activeProjectId: string | undefined;
}

export const VModelDesigner: React.FC<VModelDesignerProps> = ({ activeProjectId }) => {
  const store = useProjectStore();
  const [selectedPhase, setSelectedPhase] = useState<string>('req');
  const [vmodelStates, setVmodelStates] = useState<Record<string, Record<string, PhaseState>>>({});

  const phases = [
    { id: 'req', label: '1. Anforderungsanalyse', type: 'left', desc: 'Anforderungen des Kunden ermitteln und im Lastenheft dokumentieren.' },
    { id: 'sys', label: '2. Systementwurf', type: 'left', desc: 'Spezifikation der Systemfunktionen und Datenstrukturen im Pflichtenheft.' },
    { id: 'arch', label: '3. Systemarchitektur', type: 'left', desc: 'Definition des Software-Stacks (.NET 10, SignalR, SQLite) und Komponentenmodelle.' },
    { id: 'detail', label: '4. Feinentwurf', type: 'left', desc: 'Detaillierter Entwurf von Datenbank-Tabellen, Beziehungen und Query-Logiken.' },
    
    { id: 'code', label: '5. Implementierung', type: 'bottom', desc: 'Tatsächliche Codegenerierung für die .NET 10 REST-API, SignalR Hubs und SQLite Anbindung.' },
    
    { id: 'unit', label: '6. Modultest', type: 'right', desc: 'Testen einzelner Codeabschnitte, Services und Tabellen-Trigger.' },
    { id: 'integration', label: '7. Integrationstest', type: 'right', desc: 'Verifikation der Schnittstellen zwischen .NET 10 Backend, SQLite DBs und Clients.' },
    { id: 'systemtest', label: '8. Systemtest', type: 'right', desc: 'Ganzheitliche Überprüfung des funktionstüchtigen DB Studio Projekts gegen das Pflichtenheft.' },
    { id: 'abnahme', label: '9. Abnahme & Betrieb', type: 'right', desc: 'Übergabe des voll funktionsfähigen Systems an die Endbenutzer.' },
  ];

  // Load and initialize phase states
  useEffect(() => {
    const saved = localStorage.getItem('dbstudio_vmodel_states');
    if (saved) {
      setVmodelStates(JSON.parse(saved));
    }
  }, []);

  const getPhaseState = (phaseId: string): PhaseState => {
    if (!activeProjectId) return { status: 'planned', notes: '', linkedTables: [] };
    return vmodelStates[activeProjectId]?.[phaseId] || { status: 'planned', notes: '', linkedTables: [] };
  };

  const handleUpdatePhase = (phaseId: string, updates: Partial<PhaseState>) => {
    if (!activeProjectId) return;

    const currentProjStates = vmodelStates[activeProjectId] || {};
    const currentPhaseState = currentProjStates[phaseId] || { status: 'planned', notes: '', linkedTables: [] };

    const updated = {
      ...vmodelStates,
      [activeProjectId]: {
        ...currentProjStates,
        [phaseId]: {
          ...currentPhaseState,
          ...updates
        }
      }
    };

    setVmodelStates(updated);
    localStorage.setItem('dbstudio_vmodel_states', JSON.stringify(updated));
  };

  const currentPhaseData = phases.find(p => p.id === selectedPhase);
  const currentPhaseState = getPhaseState(selectedPhase);

  const getStatusIcon = (status: 'planned' | 'in_progress' | 'completed') => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} className="text-emerald-500 shrink-0" />;
      case 'in_progress': return <Clock size={14} className="text-amber-500 shrink-0 animate-spin-slow" />;
      default: return <Circle size={14} className="text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden p-1">
      {/* V-Model visual layout (8 Columns) */}
      <div className="lg:col-span-8 flex flex-col h-full justify-between overflow-y-auto pr-2">
        <div className="text-center mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Interaktives V-Modell (System Engineering)</h3>
          <p className="text-[10px] text-slate-500">Wählen Sie Phasen aus, um Status, Verknüpfungen und Notizen zu verwalten</p>
        </div>

        {/* The "V" Container */}
        <div className="relative max-w-2xl mx-auto w-full py-2 space-y-3">
          {/* Left and Right level connections */}
          {[0, 1, 2, 3].map((lvl) => {
            const leftPh = phases[lvl];
            const rightPh = phases[8 - lvl];
            
            const leftState = getPhaseState(leftPh.id);
            const rightState = getPhaseState(rightPh.id);

            return (
              <div key={lvl} className="grid grid-cols-11 items-center gap-1">
                {/* Left Phase Box */}
                <button
                  onClick={() => setSelectedPhase(leftPh.id)}
                  className={`col-span-5 p-2 rounded-lg border text-left transition ${
                    selectedPhase === leftPh.id
                      ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">{leftPh.label}</span>
                    {getStatusIcon(leftState.status)}
                  </div>
                </button>

                {/* Verification/Validation connector arrow (Center Column) */}
                <div className="col-span-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                  <div className="h-px w-full bg-dashed border-b border-slate-300 dark:border-slate-800" />
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5">Test</span>
                </div>

                {/* Right Phase Box */}
                <button
                  onClick={() => setSelectedPhase(rightPh.id)}
                  className={`col-span-5 p-2 rounded-lg border text-left transition ${
                    selectedPhase === rightPh.id
                      ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">{rightPh.label}</span>
                    {getStatusIcon(rightState.status)}
                  </div>
                </button>
              </div>
            );
          })}

          {/* Bottom Phase Connection (Implementation) */}
          <div className="flex justify-center pt-2">
            <div className="flex items-center gap-2">
              <ArrowDown size={14} className="text-slate-300" />
              <button
                onClick={() => setSelectedPhase('code')}
                className={`p-3 rounded-xl border w-64 text-center transition ${
                  selectedPhase === 'code'
                    ? 'border-amber-600 bg-amber-50/20 dark:bg-amber-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">5. Implementierung</span>
                  {getStatusIcon(getPhaseState('code').status)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">.NET 10 & SQLite-Datenbank</div>
              </button>
              <ArrowUp size={14} className="text-slate-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Editor sidebar panel (4 Columns) */}
      <div className="lg:col-span-4 border-l border-slate-200 dark:border-slate-800 pl-4 flex flex-col h-full overflow-y-auto">
        {currentPhaseData ? (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{currentPhaseData.label}</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{currentPhaseData.desc}</p>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-2">Entwicklungsstatus</label>
              <div className="grid grid-cols-3 gap-1">
                {(['planned', 'in_progress', 'completed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdatePhase(selectedPhase, { status: st })}
                    className={`text-[10px] py-1 px-1.5 rounded border text-center font-medium capitalize transition ${
                      currentPhaseState.status === st
                        ? st === 'completed' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300'
                        : st === 'in_progress' ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300'
                        : 'bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850'
                    }`}
                  >
                    {st === 'planned' ? 'Geplant' : st === 'in_progress' ? 'In Arbeit' : 'Fertig'}
                  </button>
                ))}
              </div>
            </div>

            {/* Linked Tables mapping */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-2">
                Verknüpfte DB-Tabellen
              </label>
              <div className="max-h-28 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded p-2 space-y-1 bg-slate-50 dark:bg-slate-950/20">
                {store.tables && store.tables.length > 0 ? (
                  store.tables.map((t) => {
                    const isLinked = currentPhaseState.linkedTables.includes(t.name);
                    return (
                      <label key={t.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200">
                        <input
                          type="checkbox"
                          checked={isLinked}
                          onChange={(e) => {
                            const updatedList = e.target.checked
                              ? [...currentPhaseState.linkedTables, t.name]
                              : currentPhaseState.linkedTables.filter(x => x !== t.name);
                            handleUpdatePhase(selectedPhase, { linkedTables: updatedList });
                          }}
                          className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-900"
                        />
                        <Table size={12} className="text-slate-400" />
                        <span className="truncate">{t.name}</span>
                      </label>
                    );
                  })
                ) : (
                  <div className="text-[10px] text-slate-400 text-center py-2 flex items-center justify-center gap-1">
                    <HelpCircle size={12} /> Keine Tabellen im Projekt
                  </div>
                )}
              </div>
            </div>

            {/* Phase notes comments */}
            <div className="flex flex-col">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-2">Notizen & Verifikations-Details</label>
              <textarea
                value={currentPhaseState.notes}
                onChange={(e) => handleUpdatePhase(selectedPhase, { notes: e.target.value })}
                className="w-full h-32 p-2 text-xs border border-slate-200 dark:border-slate-800 rounded dark:bg-slate-900 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Tragen Sie Notizen, offene Punkte oder Testkriterien für diese Phase ein..."
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            Wählen Sie eine Phase im V-Modell aus.
          </div>
        )}
      </div>
    </div>
  );
};
