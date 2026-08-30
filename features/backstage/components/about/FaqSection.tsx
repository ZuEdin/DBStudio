import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  Check, 
  Copy,
  Layers,
  FileCode,
  CheckCircle2,
  ChevronsUpDown
} from 'lucide-react';
import { FAQ_CATEGORIES, FaqCategory, FaqItem } from './faqData';

export const FaqSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({
    1: true,
    7: true,
    12: true,
    16: true,
    20: true,
    23: true
  });
  const [copiedSnippetId, setCopiedSnippetId] = useState<number | null>(null);

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return FAQ_CATEGORIES.map((cat) => {
      if (activeCategory !== 'all' && cat.id !== activeCategory) {
        return null;
      }
      if (!query) return cat;

      const matchingItems = cat.items.filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          (typeof item.answer === 'string' && item.answer.toLowerCase().includes(query)) ||
          item.codeSnippet?.code.toLowerCase().includes(query)
      );

      if (matchingItems.length === 0) return null;
      return { ...cat, items: matchingItems };
    }).filter(Boolean) as FaqCategory[];
  }, [searchQuery, activeCategory]);

  const totalQuestionCount = useMemo(() => {
    return FAQ_CATEGORIES.reduce((sum, c) => sum + c.items.length, 0);
  }, []);

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    FAQ_CATEGORIES.forEach((c) => c.items.forEach((i) => (all[i.id] = true)));
    setExpandedItems(all);
  };

  const collapseAll = () => {
    setExpandedItems({});
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#24242e] border border-indigo-500/30 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 shadow-xs">
              <Sparkles size={12} className="text-amber-400" /> Ausführliche Dokumentation
            </span>
            <span className="text-xs text-neutral-400 font-medium">Alle technischen Fragen &amp; Antworten</span>
          </div>
          <div className="text-xs font-black px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {totalQuestionCount} Fachfragen beantwortet
          </div>
        </div>

        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2.5">
          <HelpCircle className="text-amber-400" size={22} /> Häufig gestellte Fragen (FAQ Hub)
        </h2>
        <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
          Umfassende technische Erläuterungen zu Architektur, In-Browser Access-Migration, DACH-Steuersätzen, .NET 10 EF Core Multi-DB Generierung, ZUGFeRD 2.0 E-Invoicing und der Local Bridge.
        </p>

        {/* Search & Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input
              type="text"
              placeholder="Frage, Begriff oder Technologie suchen (z.B. Access, Steuersatz, EF Core, ZUGFeRD)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#1b1b1b] border border-[#3d3d3d] focus:border-indigo-500 rounded-xl text-xs text-white placeholder-neutral-500 outline-none transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={expandAll}
              className="px-3 py-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-neutral-300 text-xs font-semibold rounded-xl border border-[#3d3d3d] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronsUpDown size={14} /> Alle öffnen
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-neutral-400 hover:text-white text-xs font-semibold rounded-xl border border-[#3d3d3d] transition-colors cursor-pointer"
            >
              Schließen
            </button>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#353545]">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-[#1b1b1b] text-neutral-300 hover:bg-[#292929]'
            }`}
          >
            Alle ({totalQuestionCount})
          </button>
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-[#1b1b1b] text-neutral-300 hover:bg-[#292929]'
              }`}
            >
              {cat.icon}
              <span>{cat.badge}</span>
              <span className="text-[10px] opacity-70 px-1 py-0.2 bg-black/30 rounded">
                {cat.items.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Accordion Categories */}
      <div className="space-y-6">
        {filteredCategories.length === 0 ? (
          <div className="bg-[#222222] border border-[#333333] rounded-2xl p-8 text-center text-neutral-400 space-y-2">
            <HelpCircle size={32} className="mx-auto text-neutral-500 mb-2" />
            <div className="text-sm font-bold text-white">Keine Treffer für "{searchQuery}"</div>
            <p className="text-xs">Versuchen Sie einen anderen Suchbegriff oder setzen Sie den Filter zurück.</p>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.id} className="bg-[#202020] border border-[#333333] rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#2d2d2d]">
                <div className="flex items-center gap-2">
                  {cat.icon}
                  <div>
                    <h3 className="text-sm font-bold text-white">{cat.title}</h3>
                    <p className="text-[11px] text-neutral-400">{cat.description}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cat.badgeColor}`}>
                  {cat.items.length} Fragen
                </span>
              </div>

              <div className="space-y-2.5">
                {cat.items.map((item) => {
                  const isExpanded = !!expandedItems[item.id];
                  return (
                    <div
                      key={item.id}
                      className="bg-[#181818] border border-[#2b2b2b] hover:border-[#3d3d3d] rounded-xl overflow-hidden transition-colors"
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-semibold text-neutral-200 hover:text-white cursor-pointer"
                      >
                        <span className="leading-snug">{item.question}</span>
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-indigo-400 shrink-0" />
                        ) : (
                          <ChevronRight size={16} className="text-neutral-500 shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 text-xs text-neutral-300 space-y-3 border-t border-[#252525] bg-[#151515]">
                          <div className="leading-relaxed text-neutral-300">{item.answer}</div>

                          {item.codeSnippet && (
                            <div className="relative mt-2 rounded-lg bg-[#0d0d0d] border border-[#2c2c2c] overflow-hidden">
                              <div className="flex items-center justify-between px-3 py-1.5 bg-[#171717] border-b border-[#2c2c2c] text-[10px] text-neutral-400 font-mono">
                                <span>{item.codeSnippet.lang.toUpperCase()}</span>
                                <button
                                  onClick={() => handleCopyCode(item.id, item.codeSnippet!.code)}
                                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                                >
                                  {copiedSnippetId === item.id ? (
                                    <>
                                      <Check size={12} className="text-emerald-400" /> Kopiert!
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} /> Kopieren
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="p-3 text-[11px] font-mono text-neutral-200 overflow-x-auto whitespace-pre">
                                <code>{item.codeSnippet.code}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
