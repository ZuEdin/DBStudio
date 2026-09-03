import React from 'react';
import { MergeSourceItem } from '../types';
import { Database, Plus, CheckCircle2, Layers } from 'lucide-react';

interface SourceSelectionStepProps {
  sources: MergeSourceItem[];
  currentProjectName: string;
  onToggleSource: (id: string) => void;
  availableTemplates: { id: string; name: string; category: string; description: string; tableCount: number }[];
  onAddTemplateAsSource: (templateId: string) => void;
}

export const SourceSelectionStep: React.FC<SourceSelectionStepProps> = ({
  sources,
  currentProjectName,
  onToggleSource,
  availableTemplates,
  onAddTemplateAsSource
}) => {
  const selectedCount = sources.filter(s => s.selected).length;

  return (
    <div className="space-y-6">
      {/* Target Info */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-900/60 text-indigo-400 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase font-semibold text-indigo-400 tracking-wider">Basis-Zielprojekt</div>
            <div className="text-base font-semibold text-white">{currentProjectName || 'Aktuelles Projekt'}</div>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-900/60 text-emerald-300 border border-emerald-700">
            {selectedCount} Quelle(n) zur Zusammenführung ausgewählt
          </span>
        </div>
      </div>

      {/* Selected Sources List */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Ausgewählte Quell-Projekte & Domänen-Vorlagen
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sources.map(src => (
            <div
              key={src.id}
              onClick={() => onToggleSource(src.id)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                src.selected
                  ? 'bg-slate-800/90 border-indigo-500 ring-1 ring-indigo-500/50'
                  : 'bg-slate-900/60 border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${
                    src.selected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {src.domainPrefix.toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="text-sm font-medium text-white truncate">{src.name}</div>
                  <div className="text-xs text-slate-400">
                    {src.tableCount} Tabellen • {src.relationCount} Relationen
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {src.type === 'saved_project' ? 'Gespeichert' : 'Vorlage'}
                </span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    src.selected ? 'bg-emerald-600 text-white' : 'border border-slate-600'
                  }`}
                >
                  {src.selected && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fast Add Domain Templates */}
      <div className="border-t border-slate-800 pt-5">
        <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            Weitere Vorlagen als Domäne hinzufügen
          </span>
          <span className="text-xs text-slate-400">Klick fügt die Domäne sofort der Auswahl hinzu</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {availableTemplates.map(tpl => {
            const alreadyAdded = sources.some(s => s.id === tpl.id);
            return (
              <button
                key={tpl.id}
                disabled={alreadyAdded}
                onClick={() => onAddTemplateAsSource(tpl.id)}
                className={`p-2.5 text-left rounded-lg border text-xs flex flex-col justify-between transition-all ${
                  alreadyAdded
                    ? 'bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:border-emerald-500/60 cursor-pointer'
                }`}
              >
                <div>
                  <div className="font-semibold text-white truncate">{tpl.name}</div>
                  <div className="text-slate-400 line-clamp-1 mt-0.5">{tpl.description}</div>
                </div>
                <div className="mt-2 flex items-center justify-between text-slate-400 border-t border-slate-700/50 pt-1.5">
                  <span>{tpl.category}</span>
                  <span className="text-emerald-400 font-medium">
                    {alreadyAdded ? 'Bereits aktiv' : '+ Hinzufügen'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
