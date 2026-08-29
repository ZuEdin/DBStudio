import React, { useState } from 'react';
import { BookOpen, Search, Check, Layers, Tag, FileText, ChevronRight, X } from 'lucide-react';

interface GaebItem {
  oz: string;
  shortText: string;
  unit: string;
  unitPrice: number;
  costGroupDin276: string;
  longText?: string;
  trade: string;
}

const DEFAULT_GAEB_CATALOG: GaebItem[] = [
  {
    oz: '01.01.0010',
    trade: '01 Erdarbeiten',
    shortText: 'Baugrube ausheben, Bodenklasse 3-4',
    longText: 'Baugrube nach Plan ausheben, Bodenklasse 3 bis 4 (leichter bis mittelschwerer Boden), Boden seitlich lagern oder aufladen.',
    unit: 'm³',
    unitPrice: 18.50,
    costGroupDin276: '311 Baugrube',
  },
  {
    oz: '01.01.0020',
    trade: '01 Erdarbeiten',
    shortText: 'Bodenabfuhr und Deponieentsorgung',
    longText: 'Aushubboden auf LKW verladen, transportieren und ordnungsgemäß auf zugelassener Deponie entsorgen inkl. Gebühren.',
    unit: 'm³',
    unitPrice: 32.00,
    costGroupDin276: '311 Baugrube',
  },
  {
    oz: '02.01.0010',
    trade: '02 Beton- & Stahlbetonarbeiten',
    shortText: 'Sauberkeitsschicht aus Magerbeton C8/10, d=10cm',
    longText: 'Sauberkeitsschicht unter Fundamenten und Bodenplatten aus unbewehrtem Beton C8/10 herstellen, Dicke 10 cm einbauen und abziehen.',
    unit: 'm²',
    unitPrice: 24.80,
    costGroupDin276: '321 Gründung',
  },
  {
    oz: '02.01.0020',
    trade: '02 Beton- & Stahlbetonarbeiten',
    shortText: 'Stahlbeton-Bodenplatte C25/30 d=25cm wasserundurchlässig',
    longText: 'Bodenplatte aus wasserundurchlässigem Beton C25/30, WU-Richtlinie, Dicke 25 cm, liefern, einbringen und maschinell glätten.',
    unit: 'm²',
    unitPrice: 95.00,
    costGroupDin276: '322 Bodenplatte',
  },
  {
    oz: '02.02.0010',
    trade: '02 Beton- & Stahlbetonarbeiten',
    shortText: 'Betonstahl B500A/B schneiden und biegen',
    longText: 'Betonstabstahl und Lagermatten nach statischen Bewehrungsplänen liefern, biegen, verlegen und mit Rödeldraht fixieren.',
    unit: 'kg',
    unitPrice: 2.15,
    costGroupDin276: '322 Bodenplatte',
  },
  {
    oz: '03.01.0010',
    trade: '03 Mauerarbeiten',
    shortText: 'Kalksandstein-Mauerwerk KS 12-1.8 d=17.5cm',
    longText: 'Tragendes Innen- und Außenmauerwerk aus Kalksandstein-Plansteinen mit Dünnbettmörtel DIN EN 998-2 fachgerecht herstellen.',
    unit: 'm²',
    unitPrice: 68.40,
    costGroupDin276: '331 Tragende Außenwände',
  },
  {
    oz: '04.01.0010',
    trade: '04 Trockenbau & Putzarbeiten',
    shortText: 'Gipskarton-Ständerwand F30 d=100mm doppelt beplankt',
    longText: 'Metall-Ständerwerk CW/UW 75mm, Mineralwolldämmung 60mm, beidseitig 2x 12.5mm Feuerschutzplatten beplanken und verspachteln Q2.',
    unit: 'm²',
    unitPrice: 54.00,
    costGroupDin276: '341 Nichttragende Innenwände',
  },
  {
    oz: '05.01.0010',
    trade: '05 Estrich- & Bodenbelagsarbeiten',
    shortText: 'Zementestrich CT-C25-F4 auf Dämmschicht d=60mm',
    longText: 'Schwimmender Zementestrich auf Trittschall- und Wärmedämmung nach DIN 18560 einbringen, abziehen und glätten.',
    unit: 'm²',
    unitPrice: 36.50,
    costGroupDin276: '352 Bodenbeläge',
  },
];

interface GaebPositionPickerWidgetProps {
  id: string;
  label?: string;
  value?: any;
  isReadOnly?: boolean;
  onChange: (value: any) => void;
}

export const GaebPositionPickerWidget: React.FC<GaebPositionPickerWidgetProps> = ({
  id,
  label = 'GAEB / LV-Position',
  value,
  isReadOnly = false,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<string>('all');
  const [selectedDin276, setSelectedDin276] = useState<string>('all');

  // Parse current value
  let currentSelection: GaebItem | null = null;
  if (value) {
    if (typeof value === 'object' && value.oz) {
      currentSelection = value as GaebItem;
    } else if (typeof value === 'string') {
      try {
        currentSelection = JSON.parse(value);
      } catch {
        currentSelection = DEFAULT_GAEB_CATALOG.find((item) => item.oz === value || item.shortText === value) || {
          oz: 'POS',
          shortText: value,
          unit: 'Stk',
          unitPrice: 0,
          costGroupDin276: '300',
          trade: 'Allgemein',
        };
      }
    }
  }

  const trades = Array.from(new Set(DEFAULT_GAEB_CATALOG.map((i) => i.trade)));
  const dinGroups = Array.from(new Set(DEFAULT_GAEB_CATALOG.map((i) => i.costGroupDin276)));

  const filteredItems = DEFAULT_GAEB_CATALOG.filter((item) => {
    const matchesTrade = selectedTrade === 'all' || item.trade === selectedTrade;
    const matchesDin = selectedDin276 === 'all' || item.costGroupDin276 === selectedDin276;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      item.oz.toLowerCase().includes(q) ||
      item.shortText.toLowerCase().includes(q) ||
      (item.longText && item.longText.toLowerCase().includes(q)) ||
      item.costGroupDin276.toLowerCase().includes(q);
    return matchesTrade && matchesDin && matchesQuery;
  });

  const handleSelect = (item: GaebItem) => {
    onChange(item);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div id={id} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
          <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-mono px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            GAEB / DIN 276
          </span>
        </div>
        {!isReadOnly && currentSelection && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5"
          >
            <X size={12} /> Auswahl aufheben
          </button>
        )}
      </div>

      {currentSelection ? (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col sm:flex-row justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                OZ: {currentSelection.oz}
              </span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Tag size={11} /> DIN 276: {currentSelection.costGroupDin276}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{currentSelection.shortText}</p>
            {currentSelection.longText && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{currentSelection.longText}</p>
            )}
          </div>
          <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-2 sm:pt-0 sm:pl-3 min-w-[120px]">
            <div className="text-right">
              <div className="text-xs text-slate-500 dark:text-slate-400">Richtpreis (EP)</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {currentSelection.unitPrice?.toFixed(2)} € / {currentSelection.unit}
              </div>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Ändern
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => setIsOpen(true)}
          className="w-full py-3 px-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Search size={15} /> Position aus GAEB / DIN 276 Katalog wählen...
        </button>
      )}

      {/* Catalog Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  GAEB Leistungskatalog & DIN 276 Positions-Picker
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative col-span-1 sm:col-span-1">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="OZ, Stichwort, Langtext..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="py-1.5 px-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
              >
                <option value="all">Alle Gewerke ({trades.length})</option>
                {trades.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={selectedDin276}
                onChange={(e) => setSelectedDin276(e.target.value)}
                className="py-1.5 px-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
              >
                <option value="all">Alle DIN 276 Kostengruppen</option>
                {dinGroups.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Keine Positionen für die gewählten Filterkriterien gefunden.
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.oz}
                    onClick={() => handleSelect(item)}
                    className="pt-2 first:pt-0 p-2.5 rounded-lg hover:bg-blue-50/60 dark:hover:bg-blue-950/30 cursor-pointer transition-colors flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                          {item.oz}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {item.trade}
                        </span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-900">
                          DIN 276: {item.costGroupDin276}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {item.shortText}
                      </h4>
                      {item.longText && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {item.longText}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.unitPrice.toFixed(2)} €
                      </div>
                      <div className="text-[10px] text-slate-400">pro {item.unit}</div>
                      <button
                        type="button"
                        className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                      >
                        Übernehmen <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center text-xs text-slate-500">
              <span>{filteredItems.length} Positionen verfügbar</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-medium"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
