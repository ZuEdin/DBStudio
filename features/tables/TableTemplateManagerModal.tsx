import React, { useState, useEffect, useMemo } from 'react';
import { Table } from '../../types/database';
import { TableTemplate, TemplateCategory } from '../../types/tableTemplates';
import { 
  getAllTemplates, 
  saveCustomTemplate, 
  deleteCustomTemplate, 
  exportCustomTemplatesJson, 
  importCustomTemplatesJson,
  saveTableAsTemplate 
} from '../../services/tableTemplateService';
import { 
  X, 
  Search, 
  Bookmark, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Table as TableIcon, 
  Users, 
  Briefcase, 
  DollarSign, 
  Receipt, 
  ListFilter, 
  Building2, 
  Check, 
  FileSpreadsheet,
  Layers,
  Info
} from 'lucide-react';

interface TableTemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTables: Table[];
  initialTableToSave?: Table | null;
  onSelectTemplate: (template: TableTemplate, withSampleData: boolean) => void;
}

export const TableTemplateManagerModal: React.FC<TableTemplateManagerModalProps> = ({
  isOpen,
  onClose,
  existingTables,
  initialTableToSave,
  onSelectTemplate
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'save_as'>('catalog');
  const [templates, setTemplates] = useState<TableTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<TableTemplate | null>(null);
  const [includeSampleData, setIncludeSampleData] = useState<boolean>(true);

  // Save as Template state
  const [selectedTableToSave, setSelectedTableToSave] = useState<string>(initialTableToSave?.id || (existingTables[0]?.id || ''));
  const [saveName, setSaveName] = useState<string>(initialTableToSave?.name || '');
  const [saveDescription, setSaveDescription] = useState<string>(initialTableToSave?.description || '');
  const [saveIncludeSample, setSaveIncludeSample] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadTemplates = () => {
    const list = getAllTemplates();
    setTemplates(list);
    if (!selectedTemplate && list.length > 0) {
      setSelectedTemplate(list[0]);
    } else if (selectedTemplate) {
      const found = list.find(t => t.id === selectedTemplate.id);
      setSelectedTemplate(found || list[0] || null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      if (initialTableToSave) {
        setActiveTab('save_as');
        setSelectedTableToSave(initialTableToSave.id);
        setSaveName(initialTableToSave.name);
        setSaveDescription(initialTableToSave.description || '');
      } else {
        setActiveTab('catalog');
      }
    }
  }, [isOpen, initialTableToSave]);

  const categories: { key: string; label: string; icon: any }[] = [
    { key: 'all', label: 'Alle Vorlagen', icon: Layers },
    { key: 'crm', label: 'CRM & Personen', icon: Users },
    { key: 'pm', label: 'Projektmanagement', icon: Briefcase },
    { key: 'finance', label: 'Finanzen & Buchhaltung', icon: DollarSign },
    { key: 'fakturierung', label: 'Faktura & Handel', icon: Receipt },
    { key: 'lookup', label: 'Kataloge & Lookup', icon: ListFilter },
    { key: 'org', label: 'Organisation & HR', icon: Building2 },
    { key: 'custom', label: 'Eigene Vorlagen', icon: Bookmark },
  ];

  const filteredTemplates = useMemo(() => {
    return templates.filter(tpl => {
      const matchCategory = selectedCategory === 'all' || (selectedCategory === 'custom' ? tpl.isCustom : tpl.category === selectedCategory);
      const matchSearch = !searchQuery.trim() || 
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.fields.some(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  const handleDeleteCustom = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Möchten Sie diese benutzerdefinierte Vorlage wirklich löschen?')) {
      deleteCustomTemplate(templateId);
      loadTemplates();
    }
  };

  const handleExportJson = () => {
    const json = exportCustomTemplatesJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dbstudio_custom_templates_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const res = importCustomTemplatesJson(content);
      if (res.success) {
        setFeedbackMsg({ text: `${res.count} Vorlage(n) erfolgreich importiert!`, type: 'success' });
        loadTemplates();
      } else {
        setFeedbackMsg({ text: res.error || 'Import fehlgeschlagen.', type: 'error' });
      }
      setTimeout(() => setFeedbackMsg(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveAsCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const sourceTable = existingTables.find(t => t.id === selectedTableToSave);
    if (!sourceTable) {
      setFeedbackMsg({ text: 'Bitte wählen Sie eine Quelltabelle aus.', type: 'error' });
      return;
    }
    if (!saveName.trim()) {
      setFeedbackMsg({ text: 'Bitte geben Sie einen Namen für die Vorlage an.', type: 'error' });
      return;
    }

    saveTableAsTemplate(sourceTable, {
      name: saveName.trim(),
      description: saveDescription.trim(),
      includeDataAsSample: saveIncludeSample
    });

    setFeedbackMsg({ text: `Vorlage "${saveName}" erfolgreich gespeichert!`, type: 'success' });
    loadTemplates();
    setTimeout(() => {
      setFeedbackMsg(null);
      setActiveTab('catalog');
      setSelectedCategory('custom');
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div id="table-template-manager-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Tabellen-Vorlagen Katalog</h2>
              <p className="text-xs text-slate-400">Standardisierte Schemas und eigene benutzerdefinierte Tabellenstrukturen verwenden</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                id="btn-tab-catalog"
                onClick={() => setActiveTab('catalog')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'catalog' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Katalog durchsuchen
              </button>
              <button
                id="btn-tab-save-as"
                onClick={() => setActiveTab('save_as')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'save_as' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tabelle als Vorlage sichern
              </button>
            </div>

            <button
              id="btn-close-template-modal"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Message */}
        {feedbackMsg && (
          <div className={`px-6 py-2 text-xs font-medium flex items-center gap-2 ${
            feedbackMsg.type === 'success' ? 'bg-emerald-900/40 text-emerald-300 border-b border-emerald-700/40' : 'bg-red-900/40 text-red-300 border-b border-red-700/40'
          }`}>
            <Info className="w-4 h-4" />
            {feedbackMsg.text}
          </div>
        )}

        {/* Content Area */}
        {activeTab === 'catalog' ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Categories */}
            <div className="w-64 border-r border-slate-800 bg-slate-950/40 p-4 flex flex-col gap-1 overflow-y-auto">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2.5 py-1 mb-1">
                Kategorien
              </span>
              {categories.map(cat => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.key;
                const count = cat.key === 'all' 
                  ? templates.length 
                  : (cat.key === 'custom' ? templates.filter(t => t.isCustom).length : templates.filter(t => t.category === cat.key).length);

                return (
                  <button
                    key={cat.key}
                    id={`cat-btn-${cat.key}`}
                    onClick={() => {
                      setSelectedCategory(cat.key);
                      const matching = templates.filter(t => cat.key === 'all' || (cat.key === 'custom' ? t.isCustom : t.category === cat.key));
                      if (matching.length > 0 && (!selectedTemplate || !matching.some(m => m.id === selectedTemplate.id))) {
                        setSelectedTemplate(matching[0]);
                      }
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isSelected 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{cat.label}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}

              <div className="mt-auto pt-4 border-t border-slate-800 flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2.5">
                  Import / Export
                </span>
                <div className="flex gap-2">
                  <button
                    id="btn-export-templates"
                    onClick={handleExportJson}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs border border-slate-700 transition-colors"
                    title="Eigene Vorlagen als JSON exportieren"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>
                  <label className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs border border-slate-700 transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import</span>
                    <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* List of Templates */}
            <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-slate-800">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    id="input-search-templates"
                    type="text"
                    placeholder="Vorlagen oder Felder filtern..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
                {filteredTemplates.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Keine passenden Vorlagen gefunden.
                  </div>
                ) : (
                  filteredTemplates.map(tpl => {
                    const isSelected = selectedTemplate?.id === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        id={`tpl-item-${tpl.id}`}
                        onClick={() => setSelectedTemplate(tpl)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-blue-600/15 border border-blue-500/40 text-white' 
                            : 'hover:bg-slate-800/50 border border-transparent text-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium text-xs flex items-center gap-1.5 text-white">
                            <TableIcon className="w-3.5 h-3.5 text-blue-400" />
                            {tpl.name}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {tpl.isCustom && (
                              <button
                                onClick={(e) => handleDeleteCustom(tpl.id, e)}
                                className="text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors"
                                title="Vorlage löschen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                              {tpl.fields.length} Felder
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {tpl.description || 'Keine Beschreibung verfügbar.'}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Template Detail & Preview Panel */}
            <div className="flex-1 flex flex-col bg-slate-950/20 overflow-hidden">
              {selectedTemplate ? (
                <div className="flex-1 flex flex-col overflow-hidden p-6">
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white">{selectedTemplate.name}</h3>
                        <span className="text-xs px-2 py-0.5 bg-blue-900/40 text-blue-300 border border-blue-700/40 rounded-md">
                          {selectedTemplate.categoryLabel || selectedTemplate.category}
                        </span>
                        {selectedTemplate.isCustom && (
                          <span className="text-xs px-2 py-0.5 bg-purple-900/40 text-purple-300 border border-purple-700/40 rounded-md">
                            Benutzerdefiniert
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{selectedTemplate.description}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                        <input
                          id="chk-include-samples"
                          type="checkbox"
                          checked={includeSampleData}
                          onChange={(e) => setIncludeSampleData(e.target.checked)}
                          className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                        <span>Mit Beispieldaten ({selectedTemplate.sampleData?.length || 0})</span>
                      </label>

                      <button
                        id="btn-apply-template"
                        onClick={() => onSelectTemplate(selectedTemplate, includeSampleData)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-blue-500/20 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Tabelle erstellen
                      </button>
                    </div>
                  </div>

                  {/* Schema Preview Table */}
                  <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <TableIcon className="w-3.5 h-3.5 text-blue-400" />
                        Tabellenstruktur ({selectedTemplate.fields.length} Spalten)
                      </h4>
                      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-medium">
                            <tr>
                              <th className="px-3 py-2">Feldname</th>
                              <th className="px-3 py-2">Datentyp</th>
                              <th className="px-3 py-2">Attribute</th>
                              <th className="px-3 py-2">Standardwert / Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            {selectedTemplate.fields.map(f => (
                              <tr key={f.id || f.name} className="hover:bg-slate-800/30">
                                <td className="px-3 py-2 font-mono text-white flex items-center gap-1.5">
                                  {f.isPrimaryKey && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded font-sans">PK</span>}
                                  {f.name}
                                </td>
                                <td className="px-3 py-2 font-mono text-blue-400">{f.type}</td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-1">
                                    {f.isAutoIncrement && <span className="text-[10px] bg-slate-800 text-slate-300 px-1 rounded">Auto</span>}
                                    {f.isUnique && <span className="text-[10px] bg-purple-900/40 text-purple-300 px-1 rounded">Unique</span>}
                                    {f.isIndexed && <span className="text-[10px] bg-cyan-900/40 text-cyan-300 px-1 rounded">Index</span>}
                                    {!f.allowNull && !f.isPrimaryKey && <span className="text-[10px] bg-slate-800 text-slate-400 px-1 rounded">Not Null</span>}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-slate-400 text-[11px]">
                                  {f.enumValues ? `Werte: ${f.enumValues.join(', ')}` : (f.defaultValue !== undefined ? `Standard: ${f.defaultValue}` : '-')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Sample Data Preview */}
                    {selectedTemplate.sampleData && Array.isArray(selectedTemplate.sampleData) && selectedTemplate.sampleData.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                          Beispieldaten Vorschau ({selectedTemplate.sampleData.length} Datensätze)
                        </h4>
                        <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-900/60">
                          <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-medium">
                              <tr>
                                {Object.keys(selectedTemplate.sampleData[0] || {}).map(key => (
                                  <th key={key} className="px-3 py-2 font-mono text-[11px]">{key}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-slate-300">
                              {(selectedTemplate.sampleData || []).slice(0, 5).map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-800/30">
                                  {Object.keys(selectedTemplate.sampleData![0] || {}).map(key => (
                                    <td key={key} className="px-3 py-1.5 text-slate-300 text-[11px]">
                                      {String(row[key] ?? '')}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                  Wählen Sie eine Vorlage aus der Liste aus.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Save As Template Form */
          <div className="flex-1 overflow-y-auto p-8 max-w-2xl mx-auto w-full">
            <form onSubmit={handleSaveAsCustomTemplate} className="space-y-5">
              <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-white mb-1">Bestehende Tabelle als Vorlage sichern</h3>
                <p className="text-xs text-slate-400">
                  Speichern Sie das Schema einer Ihrer Tabellen in Ihrem Vorlagen-Katalog, um es jederzeit in neuen Projekten wiederzuverwenden.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Quelltabelle auswählen
                </label>
                <select
                  id="select-source-table"
                  value={selectedTableToSave}
                  onChange={(e) => {
                    setSelectedTableToSave(e.target.value);
                    const tbl = existingTables.find(t => t.id === e.target.value);
                    if (tbl) {
                      setSaveName(tbl.name);
                      setSaveDescription(tbl.description || '');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {existingTables.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.fields.length} Felder, {t.data?.length || 0} Datensätze)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Name der Vorlage
                </label>
                <input
                  id="input-save-template-name"
                  type="text"
                  required
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="z.B. Kundendaten Premium"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Beschreibung
                </label>
                <textarea
                  id="textarea-save-template-desc"
                  rows={3}
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Kurze Beschreibung des Verwendungszwecks dieser Vorlage..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    id="chk-save-include-sample"
                    type="checkbox"
                    checked={saveIncludeSample}
                    onChange={(e) => setSaveIncludeSample(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 w-4 h-4"
                  />
                  <span>Bis zu 10 vorhandene Datensätze als Beispieldaten in Vorlage übernehmen</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  id="btn-submit-save-template"
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all"
                >
                  <Bookmark className="w-4 h-4" />
                  Vorlage im Katalog speichern
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
