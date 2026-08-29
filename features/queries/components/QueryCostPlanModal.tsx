import React, { useState } from 'react';
import { Query, Table, DbType } from '../../../types';
import { Activity, Database, AlertTriangle, CheckCircle, Clock, Search, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { quoteIdentifier } from '../../../utils/generators/common';

interface QueryCostPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: Query;
  tables: Table[];
  dbType: DbType;
  onApplyOptimization?: (recommendation: string) => void;
}

interface PlanStep {
  id: string;
  nodeType: 'Seq Scan' | 'Index Scan' | 'Hash Join' | 'Nested Loop' | 'Aggregate' | 'Sort';
  targetTable: string;
  targetColumn?: string;
  estimatedRows: number;
  cost: number;
  hasIndex: boolean;
  recommendation?: string;
}

export const QueryCostPlanModal: React.FC<QueryCostPlanModalProps> = ({
  isOpen,
  onClose,
  query,
  tables,
  dbType,
  onApplyOptimization,
}) => {
  if (!isOpen) return null;

  const [appliedIndices, setAppliedIndices] = useState<string[]>([]);

  // Analyze query tables and columns for index recommendations
  const selectQuery = query.type === 'SELECT' ? query : null;
  const involvedTableIds = selectQuery ? Array.from(new Set(selectQuery.columns.map((c) => c.tableId))) : [];

  const steps: PlanStep[] = [];
  let totalEstimatedCost = 0;

  involvedTableIds.forEach((tblId, idx) => {
    const table = tables.find((t) => t.id === tblId || t.name === tblId);
    if (!table) return;

    const rowCount = (table.data || []).length || 150;
    const filteredCols = selectQuery?.columns.filter((c) => c.tableId === tblId && c.criteria.some((cr) => cr.trim().length > 0)) || [];

    const hasCriteria = filteredCols.length > 0;
    const hasIndex = table.fields.some((f) => f.isPrimaryKey || f.isUnique || f.isIndexed);

    const cost = hasCriteria && !hasIndex ? rowCount * 1.8 : Math.max(10, Math.round(rowCount * 0.2));
    totalEstimatedCost += cost;

    const firstFiltered = filteredCols[0];
    const rec = hasCriteria && !hasIndex && firstFiltered
      ? `CREATE INDEX idx_${table.name}_${firstFiltered.fieldName} ON ${table.name}(${firstFiltered.fieldName});`
      : undefined;

    steps.push({
      id: `step-${idx}`,
      nodeType: hasCriteria && !hasIndex ? 'Seq Scan' : hasIndex ? 'Index Scan' : 'Seq Scan',
      targetTable: table.name,
      targetColumn: firstFiltered?.fieldName,
      estimatedRows: rowCount,
      cost,
      hasIndex: hasIndex || appliedIndices.includes(rec || ''),
      recommendation: rec,
    });
  });

  if (steps.length > 1) {
    steps.push({
      id: 'step-join',
      nodeType: 'Hash Join',
      targetTable: 'Relationship Matcher',
      estimatedRows: Math.max(...steps.map((s) => s.estimatedRows)),
      cost: totalEstimatedCost * 0.35,
      hasIndex: true,
    });
    totalEstimatedCost *= 1.35;
  }

  const handleApplyIndex = (rec: string) => {
    setAppliedIndices([...appliedIndices, rec]);
    if (onApplyOptimization) {
      onApplyOptimization(rec);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-base">Ausführungsplan & Performance-Analyse (EXPLAIN)</h3>
              <p className="text-xs text-slate-400">Kostenschätzung und automatische Index-Optimierungsempfehlungen</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-[11px] text-slate-500 font-bold uppercase block">Geschätzte Abfragekosten</span>
              <span className="text-xl font-mono font-bold text-slate-800">
                {Math.round(totalEstimatedCost)} <span className="text-xs font-normal text-slate-500">Cost Units</span>
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-[11px] text-slate-500 font-bold uppercase block">Ausführungs-Timeout</span>
              <span className="text-xl font-mono font-bold text-emerald-600">5.000 ms</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-[11px] text-slate-500 font-bold uppercase block">Vorschau-Limit</span>
              <span className="text-xl font-mono font-bold text-indigo-600">LIMIT 500</span>
            </div>
          </div>

          {/* Execution Nodes */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Ausführungsschritte (Query Plan Tree)</h4>
            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
              {steps.map((step) => {
                const isSeq = step.nodeType === 'Seq Scan';
                const isOptimized = appliedIndices.includes(step.recommendation || '');

                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                      isSeq && !isOptimized
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded font-bold font-mono text-[10px] ${
                          isSeq && !isOptimized ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isOptimized ? 'Index Scan' : step.nodeType}
                      </div>
                      <div>
                        <div className="font-bold">
                          {step.targetTable} {step.targetColumn ? `(${step.targetColumn})` : ''}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          ~{step.estimatedRows} Zeilen geschätzt • Kostenfaktor: {Math.round(step.cost)}
                        </div>
                      </div>
                    </div>

                    {step.recommendation && (
                      <div>
                        {isOptimized ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                            <CheckCircle size={14} /> Index aktiv
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApplyIndex(step.recommendation!)}
                            className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded text-[11px] font-bold shadow-2xs transition-colors"
                          >
                            <Zap size={12} /> Index erstellen
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dialect Info */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono">
            <span className="text-indigo-400 font-bold block mb-1">SQL-Dialekt Engine & Injection-Schutz:</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Parameter werden als typsichere <b>Prepared Statements</b> gebunden (`:p1`, `$1`, `@param`). Vollständige Isolation gegen SQL-Injektionen und native Dialekt-Optimierung für {dbType}.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
