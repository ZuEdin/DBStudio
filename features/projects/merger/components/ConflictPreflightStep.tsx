import React from 'react';
import { MergePreflightAnalysis, CrossDomainBridgeOption } from '../types';
import { AlertTriangle, CheckCircle2, Link2, GitBranch } from 'lucide-react';

interface ConflictPreflightStepProps {
  analysis: MergePreflightAnalysis;
  onToggleBridge: (bridgeId: string) => void;
}

export const ConflictPreflightStep: React.FC<ConflictPreflightStepProps> = ({
  analysis,
  onToggleBridge
}) => {
  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-center">
          <div className="text-xs text-slate-400 font-medium">Tabellen nach Merge</div>
          <div className="text-xl font-bold text-white mt-1">
            <span className="text-slate-400 font-normal text-sm">{analysis.totalTablesBefore} → </span>
            <span className="text-emerald-400">{analysis.totalTablesAfter}</span>
          </div>
        </div>

        <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-center">
          <div className="text-xs text-slate-400 font-medium">Relationen & Fremdschlüssel</div>
          <div className="text-xl font-bold text-indigo-400 mt-1">
            {analysis.totalRelationsAfter}
          </div>
        </div>

        <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-center">
          <div className="text-xs text-slate-400 font-medium">Namenskonflikte</div>
          <div className="text-xl font-bold mt-1">
            {analysis.conflicts.length === 0 ? (
              <span className="text-emerald-400 text-sm font-semibold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Keine Konflikte
              </span>
            ) : (
              <span className="text-amber-400 text-sm font-semibold flex items-center justify-center gap-1">
                <AlertTriangle className="w-4 h-4" /> {analysis.conflicts.length} Aufgelöst (Präfix)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Collision Alerts & Pre-Flight Resolution */}
      {analysis.conflicts.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Erkannte Namensüberschneidungen (Automatisch gelöst)
          </h4>
          <div className="space-y-2 bg-amber-950/20 border border-amber-800/40 rounded-lg p-3">
            {analysis.conflicts.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-900/80 rounded border border-amber-900/30">
                <div>
                  <span className="font-mono font-bold text-amber-300">{c.tableName}</span>
                  <span className="text-slate-400 ml-2">in {c.sourceNames.join(' & ')}</span>
                  {c.fieldDiscrepancies.length > 0 && (
                    <span className="text-slate-500 ml-2">({c.fieldDiscrepancies.length} abweichende Felder)</span>
                  )}
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700 font-medium">
                  Präfix-Isolation aktiv
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross-Domain Bridges */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-400" />
            Intelligente Cross-Domänen-Brücken (Automatische Verknüpfungen)
          </span>
          <span className="text-xs text-slate-400">
            {analysis.crossDomainBridges.filter(b => b.enabled).length} von {analysis.crossDomainBridges.length} aktiv
          </span>
        </h4>

        {analysis.crossDomainBridges.length === 0 ? (
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-xs text-slate-400 text-center">
            Keine automatischen Cross-Domänen-Beziehungen erkannt. Die ausgewählten Domänen werden vollständig modular und unabhängig zusammengeführt.
          </div>
        ) : (
          <div className="space-y-2.5">
            {analysis.crossDomainBridges.map(bridge => (
              <div
                key={bridge.id}
                onClick={() => onToggleBridge(bridge.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  bridge.enabled
                    ? 'bg-slate-800/90 border-emerald-500 ring-1 ring-emerald-500/40'
                    : 'bg-slate-900/50 border-slate-800 opacity-60 hover:opacity-90'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-medium text-sm text-white">
                    <GitBranch className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{bridge.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {bridge.description}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs font-mono text-slate-300">
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-indigo-300">
                      {bridge.fromTable}.{bridge.fromField}
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-emerald-300">
                      {bridge.toTable}.{bridge.toField}
                    </span>
                    <span className="text-slate-400 text-[11px]">({bridge.type})</span>
                  </div>
                </div>

                <div className="flex-shrink-0 pt-0.5">
                  <input
                    type="checkbox"
                    checked={bridge.enabled}
                    onChange={() => onToggleBridge(bridge.id)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
