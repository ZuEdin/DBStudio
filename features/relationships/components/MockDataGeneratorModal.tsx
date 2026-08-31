import React, { useState } from 'react';
import { Table, Relationship } from '../../../types/index';
import { MockDataSynthesisService } from '../services/mockDataSynthesis';
import { MockDataConfig } from '../types/erDesignerTypes';
import { 
  Sparkles, 
  Database, 
  Check, 
  AlertCircle, 
  X, 
  Layers, 
  Settings2, 
  Play,
  RotateCcw
} from 'lucide-react';

interface MockDataGeneratorModalProps {
  tables: Table[];
  relationships: Relationship[];
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (dataByTableId: Record<string, any[]>) => void;
}

export const MockDataGeneratorModal: React.FC<MockDataGeneratorModalProps> = ({
  tables,
  relationships,
  isOpen,
  onClose,
  onApplyData,
}) => {
  const [rowCounts, setRowCounts] = useState<Record<string, number>>({ default: 15 });
  const [locale, setLocale] = useState<'de' | 'en' | 'fr'>('de');
  const [preserveReferentialIntegrity, setPreserveIntegrity] = useState<boolean>(true);
  const [clearExisting, setClearExisting] = useState<boolean>(true);
  const [generatedPreview, setGeneratedPreview] = useState<Record<string, any[]> | null>(null);
  const [selectedTablePreview, setSelectedTablePreview] = useState<string>(tables[0]?.id || '');
  const [isDone, setIsDone] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRowCountChange = (tableId: string, count: number) => {
    setRowCounts(prev => ({
      ...prev,
      [tableId]: Math.max(1, count)
    }));
  };

  const handleGenerate = () => {
    const config: MockDataConfig = {
      rowCounts,
      locale,
      preserveReferentialIntegrity,
      clearExisting,
      nullProbability: 0.05
    };

    const result = MockDataSynthesisService.generateMockData(tables, relationships, config);
    setGeneratedPreview(result);
    if (!selectedTablePreview && tables.length > 0) {
      setSelectedTablePreview(tables[0].id);
    }
  };

  const handleCommit = () => {
    if (!generatedPreview) {
      handleGenerate();
      return;
    }
    onApplyData(generatedPreview);
    setIsDone(true);
    setTimeout(() => {
      setIsDone(false);
      onClose();
    }, 1200);
  };

  const activeTable = tables.find(t => t.id === selectedTablePreview);
  const activeTableRows = generatedPreview ? generatedPreview[selectedTablePreview] || [] : [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/10 text-purple-600 rounded-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Graph-Aware Mock-Daten Generator</h2>
              <p className="text-xs text-neutral-500">Synthetisiert relationale Testdaten mit topologischer Sortierung & Fremdschlüssel-Garantie</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Global Config Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-neutral-50/50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Standard Zeilenzahl:</label>
              <input
                type="number"
                min="1"
                max="500"
                value={rowCounts['default'] || 15}
                onChange={(e) => handleRowCountChange('default', parseInt(e.target.value) || 15)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Lokalisierung (Faker):</label>
              <select
                value={locale}
                onChange={(e: any) => setLocale(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              >
                <option value="de">🇩🇪 Deutsch (PLZ, Straßen, Städte, IBAN)</option>
                <option value="en">🇺🇸 Englisch (US Zip, States, Names)</option>
                <option value="fr">🇫🇷 Französisch</option>
              </select>
            </div>

            <div className="flex flex-col justify-end space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preserveReferentialIntegrity}
                  onChange={(e) => setPreserveIntegrity(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">FK-Konsistenz erzwingen</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearExisting}
                  onChange={(e) => setClearExisting(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-neutral-600 dark:text-neutral-400">Bestehende Zeilen überschreiben</span>
              </label>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              Tabellen ({tables.length}) & Generierungsvorschau
            </span>
            <button
              onClick={handleGenerate}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Play size={13} />
              <span>Vorschau neu berechnen</span>
            </button>
          </div>

          {/* Table Tab Selector & Table Data Preview */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 flex flex-col">
            {/* Table Tabs */}
            <div className="flex overflow-x-auto bg-neutral-100 dark:bg-neutral-950 p-1.5 gap-1 border-b border-neutral-200 dark:border-neutral-800">
              {tables.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTablePreview(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                    selectedTablePreview === t.id
                      ? 'bg-white dark:bg-neutral-800 text-purple-600 dark:text-purple-400 font-bold shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-900'
                  }`}
                >
                  {t.name}
                  {generatedPreview && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full">
                      {generatedPreview[t.id]?.length || 0}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Table View */}
            <div className="p-2 overflow-x-auto max-h-56">
              {activeTable && activeTableRows.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60">
                      {activeTable.fields.map(f => (
                        <th key={f.id} className="p-2 font-bold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                          {f.name} <span className="font-normal text-[10px] text-neutral-400">({f.type})</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeTableRows.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800/40 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                        {activeTable.fields.map(f => (
                          <td key={f.id} className="p-2 font-mono text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                            {String(row[f.name] ?? '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  Klicken Sie auf "Vorschau neu berechnen", um synthetische Datensätze zu generieren.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            Wird persistent in IndexedDB und im In-Browser SQLite Sandbox-Speicher hinterlegt.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleCommit}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
            >
              {isDone ? <Check size={14} className="text-emerald-300" /> : <Database size={14} />}
              <span>{isDone ? 'Daten gespeichert!' : 'Mock-Daten in IndexedDB schreiben'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
