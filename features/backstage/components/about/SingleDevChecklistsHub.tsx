import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  CheckCircle2, 
  Circle, 
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Percent,
  Database,
  Printer,
  Server,
  Filter
} from 'lucide-react';
import { useUIStore } from '../../../../stores/useUIStore';
import { DEFAULT_CHECKLIST_ITEMS, CHECKLIST_CATEGORIES_META, ChecklistItem } from './checklistsData';

export const SingleDevChecklistsHub: React.FC = () => {
  const ui = useUIStore();
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem('dbsp_dev_checklists');
      return saved ? JSON.parse(saved) : DEFAULT_CHECKLIST_ITEMS;
    } catch {
      return DEFAULT_CHECKLIST_ITEMS;
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleItem = (id: string) => {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, status: !item.status } : item
      );
      try {
        localStorage.setItem('dbsp_dev_checklists', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleReset = () => {
    setItems(DEFAULT_CHECKLIST_ITEMS);
    try {
      localStorage.setItem('dbsp_dev_checklists', JSON.stringify(DEFAULT_CHECKLIST_ITEMS));
    } catch {}
    ui.addToast('Checklisten auf Standardwerte zurückgesetzt.', 'info');
  };

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return items;
    return items.filter((i) => i.category === selectedCategory);
  }, [items, selectedCategory]);

  const stats = useMemo(() => {
    const total = items.length;
    const passed = items.filter((i) => i.status).length;
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { total, passed, percentage };
  }, [items]);

  const handleAction = (target?: string) => {
    if (!target) return;
    if (target === 'access_import') {
      ui.setShowAccessMdbModal(true);
    } else if (target === 'industry_interfaces') {
      ui.setShowIntegrationsModal(true);
    } else if (target === 'code_export') {
      ui.setShowDeploymentModal(true);
    } else if (target === 'table_templates') {
      ui.setShowTableTemplateManager(true);
    } else if (target === 'reports') {
      ui.setIsBackstageOpen(false);
      ui.setActiveTab('reports');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#24242e] border border-emerald-500/30 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-xs">
                <ShieldCheck size={12} className="text-emerald-400" /> Qualitäts- &amp; Konformitäts-Center
              </span>
              <span className="text-xs text-neutral-400 font-medium">Praxis-Checklisten</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2.5">
              <CheckSquare className="text-emerald-400" size={22} /> Qualitäts-Checklisten für Entwicklung &amp; Abgabe
            </h2>
            <p className="text-xs md:text-sm text-neutral-300 max-w-3xl leading-relaxed">
              Interaktive Checklisten zur Validierung von <strong>DACH-Steuersätzen, Access-Migrationen, C# .NET 10 EF Core Multi-DB, E-Invoicing (ZUGFeRD / Swiss QR) und GAEB DA XML</strong>.
            </p>
          </div>

          {/* Overall Progress Widget */}
          <div className="bg-[#1b1b1b] border border-emerald-500/40 rounded-xl p-4 min-w-[220px] shrink-0 text-center shadow-md">
            <div className="text-[11px] uppercase font-bold text-neutral-400 mb-1">Qualitäts-Score</div>
            <div className="text-2xl font-black text-emerald-400 flex items-center justify-center gap-1">
              {stats.percentage}%
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
            <div className="text-[10px] text-neutral-400 mt-1.5 flex justify-between">
              <span>{stats.passed} von {stats.total} aktiv</span>
              <span>{stats.percentage === 100 ? 'Perfekt' : 'In Prüfung'}</span>
            </div>
          </div>
        </div>

        {/* Category Selector & Reset Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#333d36]">
          <div className="flex flex-wrap gap-1.5">
            {CHECKLIST_CATEGORIES_META.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'bg-[#1b1b1b] text-neutral-300 hover:bg-[#282828]'
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-70 px-1 py-0.2 bg-black/30 rounded">
                  {cat.id === 'all'
                    ? items.length
                    : items.filter((i) => i.category === cat.id).length}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-neutral-400 hover:text-white text-xs font-semibold rounded-lg border border-[#3d3d3d] transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Auf Standard-Checkliste zurücksetzen"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* Checklist Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between space-y-3 ${
              item.status
                ? 'bg-[#1b221e] border-emerald-500/30 hover:border-emerald-500/50'
                : 'bg-[#202020] border-[#333333] hover:border-[#444444] opacity-75'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0">
                    {item.status ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <Circle size={18} className="text-neutral-500" />
                    )}
                  </span>
                  <h4 className={`text-xs font-bold leading-snug ${item.status ? 'text-white' : 'text-neutral-300'}`}>
                    {item.title}
                  </h4>
                </div>
              </div>

              <p className="text-[11px] text-neutral-400 pl-7 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-2 border-t border-[#29322c] pl-7 flex flex-wrap items-center justify-between gap-2 text-[10px]">
              <span className="text-neutral-400 font-mono">
                {item.technicalRule}
              </span>

              {item.actionLabel && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(item.actionTarget);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {item.actionLabel} <ArrowRight size={11} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
