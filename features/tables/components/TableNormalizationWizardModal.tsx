import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Database,
  Link as LinkIcon,
  X,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Table } from '../../../types/index';
import {
  analyzeTableFor3NF,
  execute3NFTableSplit,
  NormalizationSuggestion,
} from '../utils/normalizationEngine';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';

interface TableNormalizationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table;
  onTableChange: (table: Table) => void;
}

export const TableNormalizationWizardModal: React.FC<TableNormalizationWizardModalProps> = ({
  isOpen,
  onClose,
  table,
  onTableChange,
}) => {
  const allTables = useProjectStore((s) => s.tables);
  const relationships = useProjectStore((s) => s.relationships);
  const addTable = useProjectStore((s) => s.addTable);
  const setRelationships = useProjectStore((s) => s.setRelationships);

  const analysis = useMemo(() => analyzeTableFor3NF(table), [table]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(0);
  const [customTableName, setCustomTableName] = useState<string>('');
  const [customFkName, setCustomFkName] = useState<string>('');
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentSuggestion: NormalizationSuggestion | undefined =
    analysis.suggestions[selectedSuggestionIndex];

  // Initialize or reset customized parameters when selection changes
  React.useEffect(() => {
    if (currentSuggestion) {
      setCustomTableName(currentSuggestion.targetTableName);
      setCustomFkName(currentSuggestion.foreignKeyFieldName);
      setSelectedFieldIds(currentSuggestion.fieldIdsToExtract);
      setSuccessMessage(null);
    }
  }, [selectedSuggestionIndex, currentSuggestion]);

  if (!isOpen) return null;

  const handleApplySplit = () => {
    if (!currentSuggestion) return;

    const activeSuggestion: NormalizationSuggestion = {
      ...currentSuggestion,
      targetTableName: customTableName.trim() || currentSuggestion.targetTableName,
      foreignKeyFieldName: customFkName.trim() || currentSuggestion.foreignKeyFieldName,
      fieldIdsToExtract: selectedFieldIds,
      fieldNamesToExtract: table.fields
        .filter((f) => selectedFieldIds.includes(f.id))
        .map((f) => f.name),
    };

    const splitResult = execute3NFTableSplit(table, activeSuggestion, allTables);

    // 1. Add new target table to store
    addTable(splitResult.newTargetTable);

    // 2. Update source table
    onTableChange(splitResult.updatedSourceTable);

    // 3. Add 1:n relationship
    setRelationships([...relationships, splitResult.newRelationship]);

    setSuccessMessage(
      `Tabelle '${splitResult.newTargetTable.name}' erfolgreich erstellt und 1:n Beziehung verknüpft!`
    );

    // Toast notification
    useUIStore
      .getState()
      .addToast(
        `3NF Normalisierung: Tabelle '${splitResult.newTargetTable.name}' erstellt und 1:n Beziehung verknüpft.`,
        'success'
      );

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">3NF Normalisierungs-Assistent</h3>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    analysis.isThirdNormalForm
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  Score: {analysis.overallScore}% ({analysis.isThirdNormalForm ? '3NF Konform' : 'Potenzial erkannt'})
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automatische Erkennung transitiver Abhängigkeiten &amp; 1-Klick Tabellen-Splits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm bg-slate-50/50">
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2 font-semibold text-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Health & Score Banner */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Aktueller Normalisierungsstatus für &quot;{table.name}&quot;
              </div>
              <p className="text-xs text-slate-700 font-medium">
                {analysis.recommendationSummary}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-xs text-slate-400">Normalisierungsgrad</div>
                <div className="text-lg font-black text-indigo-700">{analysis.overallScore} / 100</div>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 flex items-center justify-center font-bold text-xs text-indigo-900 bg-indigo-50">
                3NF
              </div>
            </div>
          </div>

          {analysis.suggestions.length === 0 ? (
            <div className="p-10 bg-white rounded-xl border-2 border-dashed border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Optimal strukturiert!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                In der Tabelle &quot;{table.name}&quot; wurden keine redundanten Attribut-Cluster oder
                transitive Abhängigkeiten festgestellt. Alle Felder beziehen sich atomar auf den Primärschlüssel.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Suggestion Selector Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  Erkannte Normalisierungs-Potenziale ({analysis.suggestions.length}):
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {analysis.suggestions.map((sugg, idx) => (
                    <button
                      key={sugg.id}
                      type="button"
                      onClick={() => setSelectedSuggestionIndex(idx)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedSuggestionIndex === idx
                          ? 'bg-white border-indigo-600 shadow-md ring-1 ring-indigo-500'
                          : 'bg-white/80 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs text-slate-800 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-600" />
                          {sugg.title}
                        </span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">
                          +{sugg.scoreImpact} Score
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {sugg.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Details & Configuration */}
              {currentSuggestion && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Split-Konfiguration &amp; 1:n Verknüpfung
                    </h4>
                    <span className="text-xs text-slate-500">
                      {currentSuggestion.totalRowsCount > 0
                        ? `~${currentSuggestion.uniqueRowsCount} eindeutige Entitäten aus ${currentSuggestion.totalRowsCount} Zeilen`
                        : 'Schema-basierte Auslagerung'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Name der neuen Zieltabelle:
                      </label>
                      <input
                        type="text"
                        value={customTableName}
                        onChange={(e) => setCustomTableName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Fremdschlüssel in &quot;{table.name}&quot;:
                      </label>
                      <input
                        type="text"
                        value={customFkName}
                        onChange={(e) => setCustomFkName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-indigo-700 bg-white font-bold"
                      />
                    </div>
                  </div>

                  {/* Field Extraction Checkboxes */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">
                      Auslagernde Felder für &quot;{customTableName || 'Neue Tabelle'}&quot;:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {table.fields
                        .filter((f) => !f.isPrimaryKey)
                        .map((f) => {
                          const isSelected = selectedFieldIds.includes(f.id);
                          return (
                            <label
                              key={f.id}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
                                  : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedFieldIds([...selectedFieldIds, f.id]);
                                  } else {
                                    setSelectedFieldIds(selectedFieldIds.filter((id) => id !== f.id));
                                  }
                                }}
                                className="rounded text-indigo-600"
                              />
                              <span className="truncate">{f.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono ml-auto">
                                {f.type}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>

                  {/* Schema Transformation Preview */}
                  <div className="p-3 bg-slate-900 text-slate-200 rounded-xl space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
                      <span>DATENMODELL TRANSFORMATION (3NF)</span>
                      <span className="text-emerald-400">1:n RELATION</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <div className="truncate text-indigo-300">
                        📁 {table.name} ({table.fields.length - selectedFieldIds.length + 1} Spalten)
                        <span className="text-amber-400 block text-[10px]">
                          + {customFkName} [FK]
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                      <div className="truncate text-emerald-300 text-right">
                        📦 {customTableName} ({selectedFieldIds.length + 1} Spalten)
                        <span className="text-emerald-400 block text-[10px]">+ id [PK]</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Schließen
          </button>
          {analysis.suggestions.length > 0 && (
            <button
              onClick={handleApplySplit}
              disabled={selectedFieldIds.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" /> 1-Klick Split &amp; 3NF Migration anwenden
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
