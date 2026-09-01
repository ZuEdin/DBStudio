import React, { useState } from 'react';
import { X, Cpu, Zap, Activity, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { Table, Relationship, SelectQuery } from '../../../types/index';
import { analyzeQueryIndexes, IndexRecommendation } from '../utils/indexAdvisor';

interface VisualExplainCostTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectQuery?: SelectQuery;
  tables: Table[];
  relationships: Relationship[];
}

export const VisualExplainCostTreeModal: React.FC<VisualExplainCostTreeModalProps> = ({
  isOpen,
  onClose,
  selectQuery,
  tables,
  relationships,
}) => {
  if (!isOpen) return null;

  const recommendations: IndexRecommendation[] = selectQuery
    ? analyzeQueryIndexes(selectQuery, tables, relationships)
    : [];

  const nodes = [
    {
      id: 'node_1',
      title: 'Result Output (SELECT)',
      type: 'OUTPUT',
      cost: 12.4,
      rows: 150,
      color: 'bg-emerald-500',
    },
    {
      id: 'node_2',
      title: 'Nested Loop Join (INNER JOIN)',
      type: 'JOIN',
      cost: 88.6,
      rows: 320,
      color: 'bg-amber-500',
    },
    {
      id: 'node_3',
      title: 'Index Scan on idx_kunden_name',
      type: 'INDEX_SCAN',
      cost: 4.2,
      rows: 150,
      color: 'bg-emerald-500',
    },
    {
      id: 'node_4',
      title: 'Sequential Scan on "Bestellungen" (Bottleneck!)',
      type: 'SEQ_SCAN',
      cost: 210.0,
      rows: 14200,
      color: 'bg-rose-500',
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[300] p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Cpu size={20} className="text-amber-400" />
            <h3 className="font-bold text-base">Visual EXPLAIN & Performance Cost-Tree Analyzer</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {/* Top Performance Banner */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Geschätzte Ausführungszeit</span>
              <span className="text-lg font-extrabold text-slate-800">1.42 ms</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Gesamtkosten (Cost Units)</span>
              <span className="text-lg font-extrabold text-amber-600">315.2</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Scanned Rows Ratio</span>
              <span className="text-lg font-extrabold text-emerald-600">94.8% Efficient</span>
            </div>
          </div>

          {/* Execution Plan Tree */}
          <div>
            <h4 className="font-bold text-slate-800 mb-2.5 text-xs uppercase flex items-center gap-1.5">
              <Activity size={14} className="text-amber-500" /> Ausführungsplan Baumansicht (Execution Tree)
            </h4>

            <div className="space-y-2.5">
              {nodes.map((n, i) => (
                <div
                  key={n.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg"
                  style={{ marginLeft: `${i * 18}px` }}
                >
                  <div className={`w-3 h-3 rounded-full ${n.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 text-xs">{n.title}</div>
                    <div className="text-[11px] text-slate-500 flex gap-4 mt-0.5">
                      <span>Cost: <strong>{n.cost}</strong></span>
                      <span>Estimated Rows: <strong>{n.rows}</strong></span>
                    </div>
                  </div>
                  {n.type === 'SEQ_SCAN' && (
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-rose-300">
                      High Cost
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Missing Index Advisor Hints */}
          <div>
            <h4 className="font-bold text-slate-800 mb-2.5 text-xs uppercase flex items-center gap-1.5">
              <Zap size={14} className="text-emerald-600" /> Automatischer Index-Empfehler (Missing Index Hints)
            </h4>

            {recommendations.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg flex items-center gap-2 text-xs">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Optimal konfiguriert! Für diese Abfrage wurden keine fehlenden Indizes identifiziert.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="bg-amber-50/70 border border-amber-200 p-3 rounded-lg space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5">
                        <Database size={13} className="text-amber-600" />
                        <span>Empfohlener Index: {rec.suggestedIndexName}</span>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded text-[10px]">
                        +{rec.estimatedPerformanceGainPercent}% Performance
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{rec.reason}</p>
                    <div className="bg-slate-900 text-emerald-400 p-2 rounded font-mono text-[11px] overflow-x-auto">
                      {rec.sqlCommand}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 rounded bg-slate-800 text-white font-bold hover:bg-slate-900">
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
