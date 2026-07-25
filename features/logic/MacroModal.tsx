import React, { useState, useEffect } from 'react';
import { Macro, MacroStep, ExportFormat } from '../../types/macro';
import { getSavedMacros, saveMacro, deleteMacro, executeMacro } from './MacroEngine';
import { useProjectStore } from '../../stores/useProjectStore';
import { X, Play, Plus, Trash2, Cpu, FileOutput, Upload, Database, Check, Layers, Sparkles } from 'lucide-react';

interface MacroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunMacro?: (macro: Macro) => void;
}

export const MacroModal: React.FC<MacroModalProps> = ({
  isOpen,
  onClose,
  onRunMacro
}) => {
  const { tables, queries, reports } = useProjectStore();
  const [macros, setMacros] = useState<Macro[]>([]);
  const [selectedMacro, setSelectedMacro] = useState<Macro | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const list = getSavedMacros();
      setMacros(list);
      if (list.length > 0 && !selectedMacro) {
        setSelectedMacro(list[0]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateNewMacro = () => {
    const newM: Macro = {
      id: `macro_${Date.now()}`,
      name: 'Neues Makro',
      description: 'Benutzerdefiniertes MS Access Makro',
      category: 'CUSTOM',
      steps: [
        {
          id: `step_${Date.now()}`,
          name: 'Schritt 1: Bericht Exportieren',
          type: 'EXPORT_REPORT',
          exportConfig: {
            sourceType: 'table',
            sourceId: tables[0]?.id || '',
            format: 'PDF',
            title: 'Automatischer Bericht'
          }
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = saveMacro(newM);
    setMacros(updated);
    setSelectedMacro(newM);
    setIsEditing(true);
  };

  const handleAddStep = () => {
    if (!selectedMacro) return;
    const newStep: MacroStep = {
      id: `step_${Date.now()}`,
      name: 'Neuer Makro-Schritt',
      type: 'EXPORT_REPORT',
      exportConfig: {
        sourceType: 'table',
        sourceId: tables[0]?.id || '',
        format: 'PDF',
        title: 'Neuer Export'
      }
    };
    const updatedMacro = {
      ...selectedMacro,
      steps: [...selectedMacro.steps, newStep]
    };
    setSelectedMacro(updatedMacro);
  };

  const handleSaveSelectedMacro = () => {
    if (!selectedMacro) return;
    const updatedList = saveMacro(selectedMacro);
    setMacros(updatedList);
    setIsEditing(false);
  };

  const handleDeleteSelectedMacro = (id: string) => {
    const updated = deleteMacro(id);
    setMacros(updated);
    setSelectedMacro(updated[0] || null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[85vh] text-slate-100 font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400 border border-indigo-500/30">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Makro-Manager (MS Access Style)</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono border border-indigo-500/30">Automation & Background Tasks</span>
              </h3>
              <p className="text-xs text-slate-400">Erstellen und verwalten Sie automatisierte Makros für Berichts-Exports (PDF, Excel, XML, JSON, CSV) und Daten-Imports.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body Split View */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Sidebar: Macro List */}
          <div className="w-1/3 border-r border-slate-800 bg-slate-950/50 p-4 space-y-3 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gespeicherte Makros</span>
              <button
                onClick={handleCreateNewMacro}
                className="flex items-center gap-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg transition-colors"
              >
                <Plus size={14} /> Neu
              </button>
            </div>

            <div className="space-y-2">
              {macros.map(m => {
                const isSelected = selectedMacro?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => { setSelectedMacro(m); setIsEditing(false); }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${isSelected ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md' : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:border-slate-700'}`}
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="truncate">{m.name}</span>
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">{m.steps.length} Schritte</span>
                    </div>
                    {m.description && <p className="text-[11px] text-slate-400 mt-1 truncate">{m.description}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Editor Pane */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900">
            {selectedMacro ? (
              <div className="space-y-6">
                
                {/* Macro Metadata Header */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono">
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={selectedMacro.name}
                      onChange={(e) => setSelectedMacro({ ...selectedMacro, name: e.target.value })}
                      className="text-base font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none w-2/3"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteSelectedMacro(selectedMacro.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Makro löschen"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (onRunMacro) onRunMacro(selectedMacro);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        <Play size={14} /> Ausführen
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={selectedMacro.description || ''}
                    onChange={(e) => setSelectedMacro({ ...selectedMacro, description: e.target.value })}
                    placeholder="Beschreibung eingeben..."
                    className="w-full text-xs text-slate-400 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Macro Steps List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={14} className="text-indigo-400" /> Makro-Aktionen & Schritte
                    </h4>
                    <button
                      onClick={handleAddStep}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                    >
                      <Plus size={14} /> Aktion Hinzufügen
                    </button>
                  </div>

                  {selectedMacro.steps.map((step, idx) => (
                    <div key={step.id} className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3 font-mono text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                        <span className="font-bold text-indigo-300">Aktion #{idx + 1}: {step.name}</span>
                        <button
                          onClick={() => {
                            const filtered = selectedMacro.steps.filter(s => s.id !== step.id);
                            setSelectedMacro({ ...selectedMacro, steps: filtered });
                          }}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase block mb-1">Aktionstyp</label>
                          <select
                            value={step.type}
                            onChange={(e) => {
                              const newType = e.target.value as any;
                              const updatedSteps = selectedMacro.steps.map(s => s.id === step.id ? { ...s, type: newType } : s);
                              setSelectedMacro({ ...selectedMacro, steps: updatedSteps });
                            }}
                            className="w-full bg-slate-900 text-white p-2 rounded-lg border border-slate-700 focus:outline-none"
                          >
                            <option value="EXPORT_REPORT">📊 Bericht / Daten Exportieren (PDF, Excel, XML, JSON, CSV)</option>
                            <option value="SMART_IMPORT">📥 Smart Upload & Import Starten</option>
                            <option value="EXECUTE_QUERY">⚡ Abfrage Ausführen</option>
                            <option value="SHOW_TOAST">🔔 Benachrichtigung Anzeigen</option>
                          </select>
                        </div>

                        {/* EXPORT_REPORT Options */}
                        {step.type === 'EXPORT_REPORT' && (
                          <>
                            <div>
                              <label className="text-[10px] text-slate-400 uppercase block mb-1">Export-Format</label>
                              <select
                                value={step.exportConfig?.format || 'PDF'}
                                onChange={(e) => {
                                  const fmt = e.target.value as ExportFormat;
                                  const updatedSteps = selectedMacro.steps.map(s => s.id === step.id ? {
                                    ...s,
                                    exportConfig: { ...s.exportConfig!, format: fmt }
                                  } : s);
                                  setSelectedMacro({ ...selectedMacro, steps: updatedSteps });
                                }}
                                className="w-full bg-slate-900 text-emerald-400 font-bold p-2 rounded-lg border border-slate-700 focus:outline-none"
                              >
                                <option value="PDF">📄 PDF Dokument</option>
                                <option value="XLSX">📈 Excel Arbeitsmappe (.xlsx)</option>
                                <option value="CSV">📑 CSV Tabelle (.csv)</option>
                                <option value="JSON">📦 JSON Daten (.json)</option>
                                <option value="XML">🏷️ XML Markup (.xml)</option>
                                <option value="HTML_PRINT">🖨️ Druckansicht</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 uppercase block mb-1">Datenquelle</label>
                              <select
                                value={step.exportConfig?.sourceType || 'table'}
                                onChange={(e) => {
                                  const st = e.target.value as any;
                                  const updatedSteps = selectedMacro.steps.map(s => s.id === step.id ? {
                                    ...s,
                                    exportConfig: { ...s.exportConfig!, sourceType: st, sourceId: '' }
                                  } : s);
                                  setSelectedMacro({ ...selectedMacro, steps: updatedSteps });
                                }}
                                className="w-full bg-slate-900 text-white p-2 rounded-lg border border-slate-700 focus:outline-none"
                              >
                                <option value="table">Tabelle</option>
                                <option value="query">Abfrage (Query)</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 uppercase block mb-1">Quell-Objekt</label>
                              <select
                                value={step.exportConfig?.sourceId || ''}
                                onChange={(e) => {
                                  const sid = e.target.value;
                                  const updatedSteps = selectedMacro.steps.map(s => s.id === step.id ? {
                                    ...s,
                                    exportConfig: { ...s.exportConfig!, sourceId: sid }
                                  } : s);
                                  setSelectedMacro({ ...selectedMacro, steps: updatedSteps });
                                }}
                                className="w-full bg-slate-900 text-white p-2 rounded-lg border border-slate-700 focus:outline-none"
                              >
                                <option value="">-- Objekt wählen --</option>
                                {step.exportConfig?.sourceType === 'table' ? (
                                  tables.map(t => <option key={t.id} value={t.id}>Tabelle: {t.name}</option>)
                                ) : (
                                  queries.map(q => <option key={q.id} value={q.id}>Abfrage: {q.name}</option>)
                                )}
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleSaveSelectedMacro}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    <Check size={16} /> Makro Speichern
                  </button>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <Cpu size={40} className="mb-2 text-slate-700" />
                <span>Wählen Sie links ein Makro aus oder erstellen Sie ein neues.</span>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
