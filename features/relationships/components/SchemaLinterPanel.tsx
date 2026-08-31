import React, { useState } from 'react';
import { Table, Relationship, Field } from '../../../types/index';
import { SchemaLinterService } from '../services/schemaLinter';
import { LinterReport, NormalizationSuggestion, LinterIssue } from '../types/erDesignerTypes';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Wrench, 
  Check, 
  Layers, 
  X, 
  RefreshCw, 
  Lightbulb, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface SchemaLinterPanelProps {
  tables: Table[];
  relationships: Relationship[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateTable: (table: Table) => void;
  onAddTable?: (table: Table) => void;
}

export const SchemaLinterPanel: React.FC<SchemaLinterPanelProps> = ({
  tables,
  relationships,
  isOpen,
  onClose,
  onUpdateTable,
  onAddTable,
}) => {
  const [activeTab, setActiveTab] = useState<'linter' | 'normalization'>('linter');
  const [fixedIssueIds, setFixedIssueIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const report: LinterReport = SchemaLinterService.analyzeSchema(tables, relationships);
  const normalizationSuggestions: NormalizationSuggestion[] = SchemaLinterService.analyzeNormalization(tables, relationships);

  const handleQuickFix = (issue: LinterIssue) => {
    if (!issue.tableId) return;
    const table = tables.find(t => t.id === issue.tableId);
    if (!table) return;

    const updatedTable = { ...table, fields: [...table.fields] };

    if (issue.quickFixType === 'add_pk') {
      // Add 'id' UUID primary key
      updatedTable.fields.unshift({
        id: crypto.randomUUID(),
        name: 'id',
        type: 'UUID',
        isPrimaryKey: true,
        isAutoIncrement: false,
        isUnique: true,
        allowNull: false,
        isNullable: false,
        comment: 'Eindeutiger Primärschlüssel'
      });
      onUpdateTable(updatedTable);
      setFixedIssueIds(prev => new Set(prev).add(issue.id));
    } else if (issue.quickFixType === 'add_index') {
      // Mark field as indexed
      if (issue.fieldId) {
        updatedTable.fields = updatedTable.fields.map(f => f.id === issue.fieldId ? { ...f, isIndexed: true } : f);
        onUpdateTable(updatedTable);
        setFixedIssueIds(prev => new Set(prev).add(issue.id));
      }
    } else if (issue.quickFixType === 'add_audit_fields') {
      // Add created_at and updated_at
      updatedTable.fields.push(
        {
          id: crypto.randomUUID(),
          name: 'created_at',
          type: 'TIMESTAMP',
          defaultValue: 'CURRENT_TIMESTAMP',
          allowNull: false,
          isNullable: false,
          comment: 'Erstellungszeitpunkt'
        },
        {
          id: crypto.randomUUID(),
          name: 'updated_at',
          type: 'TIMESTAMP',
          defaultValue: 'CURRENT_TIMESTAMP',
          allowNull: false,
          isNullable: false,
          comment: 'Letzte Änderung'
        }
      );
      onUpdateTable(updatedTable);
      setFixedIssueIds(prev => new Set(prev).add(issue.id));
    } else if (issue.quickFixType === 'align_types') {
      // Find parent field type
      const rel = relationships.find(r => r.toTableId === table.id && r.toFieldId === issue.fieldId);
      if (rel) {
        const parentTbl = tables.find(t => t.id === rel.fromTableId);
        const parentFld = parentTbl?.fields.find(f => f.id === rel.fromFieldId);
        if (parentFld) {
          updatedTable.fields = updatedTable.fields.map(f => f.id === issue.fieldId ? { ...f, type: parentFld.type } : f);
          onUpdateTable(updatedTable);
          setFixedIssueIds(prev => new Set(prev).add(issue.id));
        }
      }
    }
  };

  const scoreColor = report.score >= 85 
    ? 'text-emerald-500 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800' 
    : report.score >= 60 
    ? 'text-amber-500 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800' 
    : 'text-red-500 bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800';

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-neutral-900 shadow-2xl border-l border-neutral-200 dark:border-neutral-800 z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Database Schema Linter</h2>
            <p className="text-xs text-neutral-500">Automatischer Gesundheitscheck & Normalisierung</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800"
        >
          <X size={18} />
        </button>
      </div>

      {/* Health Score Overview */}
      <div className="p-4 bg-neutral-50/50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Schema Health Score</div>
            <div className="text-xs text-neutral-400 mt-0.5">Letzter Scan: {report.checkedAt}</div>
          </div>
          <div className={`px-4 py-2 rounded-xl border text-xl font-black ${scoreColor}`}>
            {report.score} / 100
          </div>
        </div>

        {/* Summary Badges */}
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
            <AlertCircle size={14} />
            <span>{report.summary.errors} Fehler</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300">
            <AlertTriangle size={14} />
            <span>{report.summary.warnings} Warnungen</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300">
            <Info size={14} />
            <span>{report.summary.infos} Hinweise</span>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 px-3 pt-2 gap-2 text-xs">
        <button
          onClick={() => setActiveTab('linter')}
          className={`pb-2 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'linter'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Sparkles size={14} />
          Diagnose ({report.issues.length})
        </button>
        <button
          onClick={() => setActiveTab('normalization')}
          className={`pb-2 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'normalization'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Layers size={14} />
          Normalisierung ({normalizationSuggestions.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'linter' ? (
          report.issues.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <ShieldCheck size={48} className="mx-auto mb-2 text-emerald-500" />
              <div className="font-semibold text-neutral-700 dark:text-neutral-200">Perfektes Schema!</div>
              <p className="text-xs mt-1">Keine Regelverletzungen oder Leistungsengpässe gefunden.</p>
            </div>
          ) : (
            report.issues.map(issue => {
              const isFixed = fixedIssueIds.has(issue.id);
              return (
                <div 
                  key={issue.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isFixed 
                      ? 'bg-emerald-50/50 border-emerald-200 opacity-60' 
                      : issue.severity === 'error'
                      ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/60'
                      : issue.severity === 'warning'
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                      : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      {issue.severity === 'error' ? (
                        <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                      ) : issue.severity === 'warning' ? (
                        <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                      ) : (
                        <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          {issue.title}
                        </div>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                          {issue.description}
                        </p>
                        {issue.recommendation && (
                          <div className="mt-2 text-[11px] text-neutral-500 bg-white/60 dark:bg-neutral-900/60 p-2 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 flex items-center gap-1.5">
                            <Lightbulb size={12} className="text-amber-500 shrink-0" />
                            <span>{issue.recommendation}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {issue.quickFixType && !isFixed && (
                      <button
                        onClick={() => handleQuickFix(issue)}
                        className="shrink-0 px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-1 transition-colors"
                      >
                        <Wrench size={11} />
                        Auto-Fix
                      </button>
                    )}

                    {isFixed && (
                      <div className="shrink-0 px-2 py-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 rounded-lg flex items-center gap-1">
                        <Check size={12} />
                        Behoben
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )
        ) : (
          normalizationSuggestions.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <Layers size={48} className="mx-auto mb-2 text-blue-500" />
              <div className="font-semibold text-neutral-700 dark:text-neutral-200">Optimal normalisiert (3NF)</div>
              <p className="text-xs mt-1">Keine offensichtlichen Redundanzen oder transitive Abhängigkeiten erkannt.</p>
            </div>
          ) : (
            normalizationSuggestions.map(sugg => (
              <div 
                key={sugg.id}
                className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/60 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {sugg.level} Optimierung
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500 font-semibold">{sugg.tableName}</span>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300">{sugg.reason}</p>
                <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 text-[11px] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800">
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">Empfohlene Umstrukturierung:</div>
                  <div>{sugg.proposal}</div>
                </div>
                {sugg.suggestedNewTable && onAddTable && (
                  <button
                    onClick={() => {
                      onAddTable({
                        id: crypto.randomUUID(),
                        name: sugg.suggestedNewTable!.name,
                        fields: sugg.suggestedNewTable!.fields.map(f => ({
                          id: crypto.randomUUID(),
                          name: f.name,
                          type: f.type as any,
                          isPrimaryKey: f.isPrimaryKey
                        }))
                      });
                    }}
                    className="w-full mt-1 py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 rounded-lg text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Vorgeschlagene Tabelle "{sugg.suggestedNewTable.name}" anlegen</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
