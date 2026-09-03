import React, { useState } from 'react';
import { DACH_BUSINESS_TEMPLATES, DachBusinessTemplate } from './dachBusinessTemplates';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';
import { 
  X, 
  Sparkles, 
  Layers, 
  CheckCircle, 
  FileText, 
  Database, 
  ArrowRight, 
  ShieldCheck, 
  Receipt, 
  QrCode, 
  Building2, 
  FileSpreadsheet,
  Search,
  Check
} from 'lucide-react';

interface DachTemplateHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DachTemplateHubModal: React.FC<DachTemplateHubModalProps> = ({ isOpen, onClose }) => {
  const { tables, setTables, relationships, setRelationships, forms, setForms } = useProjectStore();
  const ui = useUIStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [selectedTemplate, setSelectedTemplate] = useState<DachBusinessTemplate>(DACH_BUSINESS_TEMPLATES[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ['Alle', 'Finanzen & Faktura', 'DACH Standards', 'Compliance & Recht', 'Vertrieb & CRM'];

  const filteredTemplates = DACH_BUSINESS_TEMPLATES.filter(t => {
    const matchesCat = selectedCategory === 'Alle' || t.category === selectedCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.badge.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleApplyTemplate = (tpl: DachBusinessTemplate) => {
    // Merge tables (avoid duplicates by id or name)
    const existingTableIds = new Set(tables.map(t => t.id));
    const newTables = tpl.tables.filter(t => !existingTableIds.has(t.id));
    const mergedTables = [...tables, ...newTables];

    // Merge relationships
    const existingRelIds = new Set(relationships.map(r => r.id));
    const newRels = tpl.relationships.filter(r => !existingRelIds.has(r.id));
    const mergedRels = [...relationships, ...newRels];

    // Merge forms
    const existingFormIds = new Set(forms.map(f => f.id));
    const newForms = tpl.forms.filter(f => !existingFormIds.has(f.id));
    const mergedForms = [...forms, ...newForms];

    setTables(mergedTables);
    setRelationships(mergedRels);
    setForms(mergedForms);

    setAppliedTemplateId(tpl.id);
    ui.addToast(`Vorlage "${tpl.name}" erfolgreich ins Projekt importiert! (${newTables.length} Tabellen, ${newForms.length} Masken)`, 'success');

    setTimeout(() => {
      setAppliedTemplateId(null);
      onClose();
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-xs"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] h-[720px] animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4.5 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-white shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                DACH-Business-Masken & Vorlagenkatalog
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                  Template Hub
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Normierte DACH-Geschäftsmasken, DIN 5008, Schweizer QR-Rechnung & DSGVO-Prozesse 1-Klick importieren
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Vorlagen durchsuchen..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Body Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Template List */}
          <div className="w-2/5 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
            {filteredTemplates.map(tpl => {
              const isSelected = selectedTemplate.id === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                      {tpl.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                      {tpl.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                    {tpl.description}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Database size={11} /> {tpl.tables.length} Tabellen
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={11} /> {tpl.forms.length} Masken
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Template Detail / Preview */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between bg-white dark:bg-slate-900">
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    {selectedTemplate.category}
                  </span>
                  <span className="text-[11px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-mono font-semibold">
                    {selectedTemplate.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedTemplate.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {selectedTemplate.description}
                </p>
              </div>

              {/* Highlights */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  Enthaltene Funktionen & Standards
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedTemplate.highlights.map((h, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                      <CheckCircle size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Included Schema Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <Database size={14} className="text-blue-500" />
                  Datenbank-Schema & Tabellen
                </h4>
                <div className="space-y-2">
                  {selectedTemplate.tables.map(t => (
                    <div key={t.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{t.name}</span>
                        <span className="text-[10px] text-slate-400">{t.fields.length} Felder · {t.data?.length || 0} Beispieldatensätze</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {t.fields.map(f => (
                          <span key={f.id} className="text-[10px] bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono">
                            {f.name} ({f.type})
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                1-Klick Import fügt Tabellen, Felder, Relationen und Formulare ohne Überschreiben hinzu.
              </div>
              <button
                type="button"
                onClick={() => handleApplyTemplate(selectedTemplate)}
                disabled={appliedTemplateId === selectedTemplate.id}
                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
                  appliedTemplateId === selectedTemplate.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {appliedTemplateId === selectedTemplate.id ? (
                  <>
                    <Check size={16} /> Importiert!
                  </>
                ) : (
                  <>
                    <Sparkles size={15} /> Vorlage ins Projekt importieren
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
