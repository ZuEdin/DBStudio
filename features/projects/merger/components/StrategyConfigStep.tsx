import React from 'react';
import { MergeSourceItem, MergeStrategy } from '../types';
import { ShieldCheck, Boxes, Network, Palette } from 'lucide-react';

interface StrategyConfigStepProps {
  strategy: MergeStrategy;
  setStrategy: (s: MergeStrategy) => void;
  sources: MergeSourceItem[];
  onUpdateSourcePrefix: (id: string, prefix: string) => void;
  onUpdateSourceColor: (id: string, color: string) => void;
  newProjectName: string;
  setNewProjectName: (name: string) => void;
  createAsNewProject: boolean;
  setCreateAsNewProject: (val: boolean) => void;
}

const COLOR_OPTIONS = ['indigo', 'emerald', 'amber', 'cyan', 'rose', 'purple', 'blue'];

export const StrategyConfigStep: React.FC<StrategyConfigStepProps> = ({
  strategy,
  setStrategy,
  sources,
  onUpdateSourcePrefix,
  onUpdateSourceColor,
  newProjectName,
  setNewProjectName,
  createAsNewProject,
  setCreateAsNewProject
}) => {
  return (
    <div className="space-y-6">
      {/* Strategy Selector */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Zusammenführungs-Strategie</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Prefix Option */}
          <div
            onClick={() => setStrategy('prefix')}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
              strategy === 'prefix'
                ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5 text-indigo-400 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4" />
              Domänen-Präfixe (Empfohlen)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jede Tabelle erhält ein Domänen-Kürzel (z.B. <code className="text-indigo-300">ECOM_Customer</code>). Verhindert Namenskollisionen vollständig und schafft saubere MFE-Grenzen.
            </p>
          </div>

          {/* Federate Option */}
          <div
            onClick={() => setStrategy('federate')}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
              strategy === 'federate'
                ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5 text-emerald-400 font-semibold text-sm">
              <Network className="w-4 h-4" />
              Cross-Domain Federation
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Behält originale Entitätsnamen bei und erzeugt intelligente Fremdschlüssel-Brücken zwischen den Modulen (z.B. Mitarbeiter als Auftragsverantwortliche).
            </p>
          </div>

          {/* Unify Option */}
          <div
            onClick={() => setStrategy('unify')}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
              strategy === 'unify'
                ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500'
                : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5 text-amber-400 font-semibold text-sm">
              <Boxes className="w-4 h-4" />
              Entitäten-Harmonisierung
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fasst identische Tabellen (wie <code className="text-amber-300">User</code>) automatisch in einen zentralen Stammdaten-Pool zusammen.
            </p>
          </div>
        </div>
      </div>

      {/* Domain Prefixes and Visual Group Colors */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-400" />
          Domänen-Präfixe & Farbcodierung der Tabellengruppen
        </h4>
        <div className="space-y-2.5 bg-slate-800/70 border border-slate-700 rounded-lg p-3">
          {sources.map(src => (
            <div key={src.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-900/60 rounded border border-slate-800">
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{src.name}</div>
                <div className="text-xs text-slate-400">{src.tableCount} Tabellen werden importiert</div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Präfix:</span>
                  <input
                    type="text"
                    value={src.domainPrefix}
                    onChange={e => onUpdateSourcePrefix(src.id, e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    className="w-20 px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-white font-mono uppercase focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">Farbe:</span>
                  <select
                    value={src.color}
                    onChange={e => onUpdateSourceColor(src.id, e.target.value)}
                    className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200 capitalize focus:border-indigo-500 focus:outline-none"
                  >
                    {COLOR_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Destination Settings */}
      <div className="border-t border-slate-800 pt-4 space-y-3">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={createAsNewProject}
            onChange={e => setCreateAsNewProject(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-slate-200">
            Als neues konsolidiertes Projekt speichern (Original-Projekt bleibt unverändert)
          </span>
        </label>

        {createAsNewProject && (
          <div className="pl-6">
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Name des neuen Multi-Domänen-Projekts
            </label>
            <input
              type="text"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              placeholder="z.B. Enterprise Bau & ERP Suite"
              className="w-full max-w-md px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};
