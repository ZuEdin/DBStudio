import React from 'react';
import { Sliders } from 'lucide-react';

interface KanbanBoardViewDesignerProps {
  configObj: any;
  updateVisualConfig: (newProps: any) => void;
  tables: any[];
  fields: any[];
}

export const KanbanBoardViewDesigner: React.FC<KanbanBoardViewDesignerProps> = ({
  configObj,
  updateVisualConfig,
  tables,
  fields,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
        <Sliders size={13} /> Kanban-Board konfigurieren
      </h4>

      <div>
        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Board Titel</label>
        <input 
          type="text"
          value={configObj.title || ''}
          onChange={(e) => updateVisualConfig({ title: e.target.value })}
          placeholder="z.B. Aufgabenverteilung"
          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white font-medium"
        />
      </div>

      <div>
        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Datenquelle (Tabelle)</label>
        <select
          value={configObj.dataSourceId || ''}
          onChange={(e) => updateVisualConfig({ dataSourceId: e.target.value })}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
        >
          <option value="">-- Keine Datenbindung --</option>
          {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Gruppieren nach Spalte (Kanban-Spalten)</label>
        <select
          value={configObj.groupByField || ''}
          onChange={(e) => updateVisualConfig({ groupByField: e.target.value })}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white font-semibold text-indigo-700 dark:text-indigo-400"
        >
          <option value="">-- Spalte wählen (z.B. Status) --</option>
          {fields.map(f => <option key={f.name} value={f.name}>{f.name} ({f.type})</option>)}
        </select>
        <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">
          Das Board generiert automatisch eine Spalte für jeden eindeutigen Wert dieser Datenbankspalte.
        </p>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 my-2 pt-2 space-y-3">
        <h5 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Karten-Feldzuordnung (Mapping)</h5>
        
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Titel der Karte</label>
          <select
            value={configObj.titleField || ''}
            onChange={(e) => updateVisualConfig({ titleField: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
          >
            <option value="">-- Feld --</option>
            {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Beschreibung / Untertitel</label>
          <select
            value={configObj.descField || ''}
            onChange={(e) => updateVisualConfig({ descField: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
          >
            <option value="">-- Feld --</option>
            {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Zusatz / Akzent-Feld (z.B. Preis, Datum)</label>
          <select
            value={configObj.cardAccentField || ''}
            onChange={(e) => updateVisualConfig({ cardAccentField: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
          >
            <option value="">-- Feld --</option>
            {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};
