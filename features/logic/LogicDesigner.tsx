import React, { useState } from 'react';
import { BackendConfig, GlobalStateVariable, ProductTour } from '../../types';
import { Settings, Zap, Compass, Plus, Trash2 } from 'lucide-react';

interface LogicDesignerProps {
    config: BackendConfig;
    onUpdateConfig: (config: BackendConfig) => void;
    showMessage: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const LogicDesigner: React.FC<LogicDesignerProps> = ({ config, onUpdateConfig, showMessage }) => {
    const [activeTab, setActiveTab] = useState<'states' | 'tours'>('states');
    
    const states = config.globalStates || [];
    const tours = config.productTours || [];

    const updateStates = (newStates: GlobalStateVariable[]) => {
        onUpdateConfig({ ...config, globalStates: newStates });
    };

    const updateTours = (newTours: ProductTour[]) => {
        onUpdateConfig({ ...config, productTours: newTours });
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
            <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Zap size={20} className="text-indigo-500" /> App Logic & Onboarding
                </h2>
                <p className="text-xs text-slate-500">Konfigurieren Sie globale App-States und Guided Tours für Ihre Endbenutzer.</p>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-2 space-y-1">
                    <button onClick={() => setActiveTab('states')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${activeTab === 'states' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        <Settings size={16} /> Global App State
                    </button>
                    <button onClick={() => setActiveTab('tours')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${activeTab === 'tours' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        <Compass size={16} /> Product Tours
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {activeTab === 'states' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Globale State-Variablen</h3>
                                    <button 
                                        onClick={() => updateStates([...states, { id: crypto.randomUUID(), name: 'newState', type: 'string', defaultValue: '' }])}
                                        className="text-xs flex items-center gap-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 rounded font-semibold dark:bg-indigo-900/50 dark:text-indigo-300"
                                    >
                                        <Plus size={14}/> Variable hinzufügen
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {states.length === 0 && <p className="text-sm text-slate-500">Noch keine globalen Variablen definiert.</p>}
                                    {states.map((state, i) => (
                                        <div key={state.id} className="flex gap-4 items-end bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                                            <div className="flex-1">
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Variablen-Name</label>
                                                <input 
                                                    type="text" 
                                                    value={state.name} 
                                                    onChange={e => { const s=[...states]; s[i].name=e.target.value.replace(/[^a-zA-Z0-9_]/g,''); updateStates(s); }}
                                                    className="w-full text-sm border p-2 rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white font-mono"
                                                    placeholder="z.B. selectedYear"
                                                />
                                            </div>
                                            <div className="w-1/4">
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Datentyp</label>
                                                <select 
                                                    value={state.type}
                                                    onChange={e => { const s=[...states]; s[i].type=e.target.value as any; updateStates(s); }}
                                                    className="w-full text-sm border p-2 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white"
                                                >
                                                    <option value="string">String</option>
                                                    <option value="number">Number</option>
                                                    <option value="boolean">Boolean</option>
                                                </select>
                                            </div>
                                            <div className="w-1/4">
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Default</label>
                                                <input 
                                                    type="text" 
                                                    value={state.defaultValue} 
                                                    onChange={e => { const s=[...states]; s[i].defaultValue=e.target.value; updateStates(s); }}
                                                    className="w-full text-sm border p-2 rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white"
                                                    placeholder="Default Wert"
                                                />
                                            </div>
                                            <button onClick={() => updateStates(states.filter(s => s.id !== state.id))} className="text-red-500 hover:bg-red-50 p-2 rounded mb-0.5">
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'tours' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Guided Tours (Onboarding)</h3>
                                    <button 
                                        onClick={() => updateTours([...tours, { id: crypto.randomUUID(), name: 'Neue Tour', steps: [] }])}
                                        className="text-xs flex items-center gap-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 rounded font-semibold dark:bg-indigo-900/50 dark:text-indigo-300"
                                    >
                                        <Plus size={14}/> Tour erstellen
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    {tours.length === 0 && <p className="text-sm text-slate-500">Noch keine Touren angelegt.</p>}
                                    {tours.map((tour, tourIdx) => (
                                        <div key={tour.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-5 bg-white dark:bg-slate-800 shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tour-Name</label>
                                                    <input 
                                                        type="text" 
                                                        value={tour.name} 
                                                        onChange={e => { const t = [...tours]; t[tourIdx].name = e.target.value; updateTours(t); }}
                                                        className="w-1/2 text-sm border p-2 rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white font-bold"
                                                    />
                                                </div>
                                                <button onClick={() => updateTours(tours.filter(t => t.id !== tour.id))} className="text-red-500 hover:text-red-700 text-sm font-semibold">Tour löschen</button>
                                            </div>

                                            <div className="space-y-3 mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
                                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Schritte</h4>
                                                {(tour.steps || []).map((step, stepIdx) => (
                                                    <div key={stepIdx} className="flex gap-4 items-start bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700">
                                                        <div className="pt-2 font-bold text-slate-400">{stepIdx + 1}.</div>
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex gap-2">
                                                                <input type="text" placeholder="Titel (z.B. Willkommen)" value={step.title} onChange={e => { const t=[...tours]; t[tourIdx].steps[stepIdx].title = e.target.value; updateTours(t); }} className="w-1/2 text-sm border p-1.5 rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                                                                <input type="text" placeholder="CSS Ziel (z.B. #nav-dashboard)" value={step.targetSelector} onChange={e => { const t=[...tours]; t[tourIdx].steps[stepIdx].targetSelector = e.target.value; updateTours(t); }} className="w-1/2 text-sm border p-1.5 rounded font-mono text-indigo-600 dark:text-indigo-400 dark:bg-slate-800 dark:border-slate-600" />
                                                            </div>
                                                            <textarea placeholder="Text für dieses Popover..." value={step.content} onChange={e => { const t=[...tours]; t[tourIdx].steps[stepIdx].content = e.target.value; updateTours(t); }} rows={2} className="w-full text-sm border p-2 rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white"></textarea>
                                                        </div>
                                                        <button onClick={() => { const t=[...tours]; t[tourIdx].steps.splice(stepIdx, 1); updateTours(t); }} className="text-red-500 hover:bg-red-50 p-1.5 rounded mt-1">
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    </div>
                                                ))}
                                                <button 
                                                    onClick={() => { const t=[...tours]; t[tourIdx].steps.push({ title: '', content: '', targetSelector: '' }); updateTours(t); }}
                                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 mt-2"
                                                >
                                                    <Plus size={14} /> Weiteren Schritt hinzufügen
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
