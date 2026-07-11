import React, { useState } from 'react';
import { Box, Code, Save, Play, Plus } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

export const CustomComponentDesigner: React.FC = () => {
  const ui = useUIStore();
  
  const [componentName, setComponentName] = useState('MyVirtualTable');
  const [componentType, setComponentType] = useState('VirtualTable');
  const [configJson, setConfigJson] = useState(JSON.stringify({
    dataSource: "api/customers",
    features: {
      enableSort: true,
      enableFilter: true,
      pagination: true
    },
    columns: [
      { field: "name", header: "Kunde", sortable: true },
      { field: "status", header: "Status", type: "badge" }
    ],
    events: {
      onDoubleClick: {
        action: "OPEN_MODAL",
        target: "RecordDetailModal",
        params: { id: "{row.id}" }
      }
    }
  }, null, 2));

  const handleSave = () => {
    try {
      JSON.parse(configJson); // Validate JSON
      ui.addToast('Custom Component erfolgreich als SDUI-Metadaten gespeichert.', 'success');
    } catch (e) {
      ui.addToast('Ungültiges JSON-Format in der Konfiguration.', 'error');
    }
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Box className="text-emerald-500" size={24} />
            <span>Custom Component Designer (SDUI)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Erstellen Sie datengetriebene UI-Komponenten über JSON-Konfigurationen, ohne Frontend-Code zu kompilieren.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow transition-all"
          >
            <Save size={14} />
            <span>In Component Registry speichern</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Config Panel */}
        <div className="w-1/2 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Name der Instanz</label>
                <input 
                  type="text" 
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Basis-Komponente (Factory)</label>
                <select 
                  value={componentType}
                  onChange={(e) => setComponentType(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                >
                  <option value="VirtualTable">VirtualTable (Data Grid)</option>
                  <option value="ChartWidget">ChartWidget (ECharts / Recharts)</option>
                  <option value="LiveForm">LiveForm (Dynamic Forms)</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Code size={14} /> JSON Konfiguration (Properties & Events)
            </label>
            <textarea
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              className="flex-1 w-full bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded border border-slate-800 focus:outline-none focus:border-emerald-500 resize-none"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right Preview Panel */}
        <div className="w-1/2 bg-slate-100 dark:bg-slate-950 flex flex-col">
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-900 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Live Preview & Generierter Code</span>
            <button className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 rounded">
              <Play size={12} /> Live Reload
            </button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{componentName} (Mock Preview)</h3>
              </div>
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center">
                <Box size={48} className="mb-4 text-slate-300 dark:text-slate-700" />
                <p className="text-sm">In einer Produktionsumgebung rendert die <strong>DynamicPage</strong> Engine hier nun die Komponente <code>{componentType}</code> mit den Eigenschaften aus der JSON-Konfiguration.</p>
                
                <div className="mt-8 text-left bg-slate-50 dark:bg-slate-950 p-4 rounded w-full border border-slate-200 dark:border-slate-800 font-mono text-xs overflow-x-auto text-slate-600 dark:text-slate-400">
                  <div className="text-indigo-500 mb-2">// Generierter React-Code Equivalent:</div>
                  {'<'}{componentType}{'\n'}
                  {'  '}config={'{JSON.parse(dbConfig)}'}{'\n'}
                  {'  '}events={'{actionDispatcher}'}{'\n'}
                  {'/>'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
