import React, { useState, useEffect } from 'react';
import { Box, Code, Save, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useProjectStore } from '../../stores/useProjectStore';
import { CustomComponent } from '../../types';

interface CustomComponentDesignerProps {
  componentId?: string;
}

export const CustomComponentDesigner: React.FC<CustomComponentDesignerProps> = ({ componentId }) => {
  const ui = useUIStore();
  const { customComponents = [], setCustomComponents, saveProject, queries, tables, forms } = useProjectStore();
  
  const existingComponent = componentId ? customComponents.find(c => c.id === componentId) : null;

  const [componentName, setComponentName] = useState('');
  const [componentDescription, setComponentDescription] = useState('');
  const [componentType, setComponentType] = useState<'table_view' | 'chart_view' | 'form_view' | 'text' | 'button' | 'dropdown'>('table_view');
  const [configJson, setConfigJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Default templates based on types
  const templates = {
    table_view: {
      tableId: tables[0]?.id || '',
      title: "Umsatzübersicht",
      pageSize: 5,
      columns: [
        { field: "id", title: "ID", width: "80px" },
        { field: "Name", title: "Name", sortable: true }
      ]
    },
    chart_view: {
      chartType: "bar",
      title: "Monatsumsatz",
      xAxisKey: "Month",
      series: [
        { key: "Revenue", label: "Umsatz", color: "#4f46e5" }
      ]
    },
    form_view: {
      formId: forms[0]?.id || '',
      formMode: "create",
      hideHeader: false,
      hideActions: false
    },
    text: {
      text: "Hallo {name}, willkommen zurück!",
      className: "text-lg font-bold text-indigo-900"
    },
    button: {
      label: "Speichern",
      actionType: "submit",
      variant: "primary"
    },
    dropdown: {
      label: "Status wählen",
      queryId: queries[0]?.id || '',
      displayField: "Name",
      valueField: "Id"
    }
  };

  useEffect(() => {
    if (existingComponent) {
      setComponentName(existingComponent.name);
      setComponentDescription(existingComponent.description || '');
      setComponentType(existingComponent.type);
      setConfigJson(JSON.stringify(existingComponent.configuration, null, 2));
    } else {
      setComponentName('MyCustomTable');
      setComponentDescription('Eine dynamische SDUI Tabelle');
      setComponentType('table_view');
      setConfigJson(JSON.stringify(templates.table_view, null, 2));
    }
  }, [componentId]);

  const handleTypeChange = (newType: any) => {
    setComponentType(newType);
    if (!existingComponent) {
      setConfigJson(JSON.stringify(templates[newType as keyof typeof templates] || {}, null, 2));
    }
  };

  // Validate JSON live
  useEffect(() => {
    if (!configJson) {
      setJsonError(null);
      return;
    }
    try {
      JSON.parse(configJson);
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message || 'Ungültiges JSON-Format');
    }
  }, [configJson]);

  const handleSave = async () => {
    if (!componentName.trim()) {
      ui.addToast('Bitte geben Sie einen Namen für die Komponente an.', 'error');
      return;
    }
    try {
      const parsedConfig = JSON.parse(configJson);
      
      const updatedComponent: CustomComponent = {
        id: existingComponent?.id || crypto.randomUUID(),
        name: componentName,
        description: componentDescription,
        type: componentType,
        configuration: parsedConfig
      };

      let nextComps: CustomComponent[];
      if (existingComponent) {
        nextComps = customComponents.map(c => c.id === existingComponent.id ? updatedComponent : c);
      } else {
        nextComps = [...customComponents, updatedComponent];
      }

      setCustomComponents(nextComps);
      ui.addToast('Komponente erfolgreich in der SDUI Registry gespeichert.', 'success');
      await saveProject();
      ui.setCurrentView({ type: 'custom_components_manager' });
    } catch (e) {
      ui.addToast('Fehler: Bitte korrigieren Sie das JSON vor dem Speichern.', 'error');
    }
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col h-full overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => ui.setCurrentView({ type: 'custom_components_manager' })}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition"
            title="Zurück"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Box className="text-emerald-500" size={22} />
              <span>{existingComponent ? 'Custom Component bearbeiten' : 'Neue Custom Component erstellen'}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Konfigurieren Sie dynamische Server-Driven UI Metadaten für Seiten.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => ui.setCurrentView({ type: 'custom_components_manager' })}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Abbrechen
          </button>
          <button 
            onClick={handleSave}
            disabled={!!jsonError}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded shadow transition-all"
          >
            <Save size={14} />
            <span>In Registry speichern</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Configuration & JSON */}
        <div className="w-1/2 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Name der Komponente</label>
                <input 
                  type="text" 
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  placeholder="z.B. CustomerGrid"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Basis-Typ (Factory)</label>
                <select 
                  value={componentType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="table_view">Tabelle / Liste (Table View)</option>
                  <option value="chart_view">Diagramm / Grafik (Chart View)</option>
                  <option value="form_view">Eingebettetes Formular (Form View)</option>
                  <option value="dropdown">Auswahlmenü (Dropdown)</option>
                  <option value="text">Einfacher Text / Label</option>
                  <option value="button">Aktions-Button</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Beschreibung</label>
              <input 
                type="text" 
                value={componentDescription}
                onChange={(e) => setComponentDescription(e.target.value)}
                placeholder="Kurze Beschreibung des Verhaltens..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden p-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1"><Code size={14} /> JSON-Schema / Metadaten</span>
              {jsonError ? (
                <span className="text-red-500 flex items-center gap-1 text-[9px] font-bold"><AlertCircle size={10} /> Fehler im Format</span>
              ) : (
                <span className="text-emerald-600 text-[9px] font-bold">✔ Valides JSON</span>
              )}
            </label>
            <textarea
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              className="flex-1 w-full bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded border border-slate-800 focus:outline-none focus:border-emerald-500 resize-none"
              spellCheck={false}
            />
            {jsonError && (
              <div className="mt-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[10px] p-2 rounded border border-red-200 dark:border-red-900/40 font-mono leading-relaxed">
                {jsonError}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: SDUI Engine Engine / Live Render Mock */}
        <div className="w-1/2 bg-slate-100 dark:bg-slate-950 flex flex-col p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Muster-Vorschau (SDUI Engine)</h3>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{componentName}</h2>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin" /> Live
              </span>
            </div>

            <div className="flex-1 p-6 flex flex-col items-center justify-center">
              {jsonError ? (
                <div className="text-center text-slate-400 max-w-xs">
                  <AlertCircle size={36} className="mx-auto text-amber-500 mb-2" />
                  <p className="text-xs">Die Vorschau wurde angehalten, bis das JSON korrigiert ist.</p>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col justify-between">
                  <div className="flex-1 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col items-center justify-center text-center">
                    <Box size={32} className="text-emerald-500 mb-2 animate-bounce" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Komponente: {componentType}</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-sm">
                      Diese Komponente wird zur Laufzeit direkt vom Server-Driven-UI Renderer verarbeitet.
                    </p>
                    
                    {/* Render basic properties representation based on base type */}
                    <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-3 w-full text-left font-mono text-[10px] space-y-1 max-h-[160px] overflow-y-auto">
                      <span className="text-indigo-600 font-bold block mb-1">Empfangene SDUI Metadaten:</span>
                      {(() => {
                        try {
                          const conf = JSON.parse(configJson);
                          return Object.entries(conf).map(([k, v]) => (
                            <div key={k} className="flex justify-between border-b border-slate-50 py-0.5">
                              <span className="text-slate-500">{k}:</span>
                              <span className="text-emerald-600 font-bold truncate max-w-[200px]">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                            </div>
                          ));
                        } catch {
                          return <span className="text-slate-400 italic">Lade Metadaten...</span>;
                        }
                      })()}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 font-mono text-[9px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 rounded">
                    <span className="text-blue-500 font-bold">🚀 DB Studio Pro SDUI Integration:</span>
                    <p className="mt-1 leading-normal">
                      Um diese Komponente auf einer Seite anzuzeigen, wählen Sie im Page Builder den Komponententyp <strong className="text-indigo-600">Custom Component</strong> aus und verknüpfen Sie sie mit dieser Registry-ID.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
