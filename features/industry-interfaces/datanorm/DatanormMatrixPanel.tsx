import React, { useState } from 'react';
import { 
  Percent, 
  TrendingUp, 
  Calculator, 
  Layers, 
  Sliders, 
  ArrowRight, 
  Plus, 
  Table as TableIcon,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { 
  DatanormArticle, 
  DatanormDiscountTierMatrix, 
  DatanormTeuerungsMatrix,
  DatanormPositionCalculation 
} from './datanormTypes';
import { 
  DEFAULT_DISCOUNT_TIERS, 
  DEFAULT_TEUERUNGS_MATRIX, 
  DatanormCalculationEngine 
} from './datanormCalculationEngine';

interface DatanormMatrixPanelProps {
  articles: DatanormArticle[];
  onImportToTable?: (tableName: string, rows: any[]) => void;
}

export const DatanormMatrixPanel: React.FC<DatanormMatrixPanelProps> = ({
  articles,
  onImportToTable,
}) => {
  const [discountTiers, setDiscountTiers] = useState<DatanormDiscountTierMatrix[]>(DEFAULT_DISCOUNT_TIERS);
  const [teuerungsMatrix, setTeuerungsMatrix] = useState<DatanormTeuerungsMatrix[]>(DEFAULT_TEUERUNGS_MATRIX);
  const [selectedGroupCode, setSelectedGroupCode] = useState<string>('01');
  const [globalMargin, setGlobalMargin] = useState<number>(35);
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'calculator' | 'teuerung'>('matrix');

  // Convert to lookup maps
  const tierMap = React.useMemo(() => {
    const map: Record<string, DatanormDiscountTierMatrix> = {};
    discountTiers.forEach((dt) => {
      map[dt.groupCode] = dt;
    });
    return map;
  }, [discountTiers]);

  const teuerungsMap = React.useMemo(() => {
    const map: Record<string, DatanormTeuerungsMatrix> = {};
    teuerungsMatrix.forEach((tm) => {
      map[tm.code] = tm;
    });
    return map;
  }, [teuerungsMatrix]);

  const handleTierChange = (groupCode: string, tierIndex: number, value: number) => {
    setDiscountTiers((prev) =>
      prev.map((g) => {
        if (g.groupCode !== groupCode) return g;
        const newTiers = [...g.tiers];
        newTiers[tierIndex] = Math.max(0, Math.min(100, value));
        return { ...g, tiers: newTiers };
      })
    );
  };

  const handleTeuerungChange = (code: string, pct: number) => {
    setTeuerungsMatrix((prev) =>
      prev.map((t) => (t.code === code ? { ...t, percentage: Math.max(0, pct) } : t))
    );
  };

  // Calculate prices for all loaded articles
  const calculations: DatanormPositionCalculation[] = React.useMemo(() => {
    return articles.map((art) =>
      DatanormCalculationEngine.calculatePosition(art, 1, tierMap, teuerungsMap, globalMargin)
    );
  }, [articles, tierMap, teuerungsMap, globalMargin]);

  const handleExportCalculationsToTable = () => {
    if (!onImportToTable || calculations.length === 0) return;
    const flatRows = calculations.map((c) => ({
      artikelnr: c.articleNumber,
      bezeichnung: c.description,
      listenpreis_brutto: c.priceGross,
      rabatt_gesamt_prozent: c.combinedDiscountPercent,
      einkaufspreis_netto: c.priceNetPurchasing,
      teuerungszuschlag_prozent: c.teuerungPercent,
      teuerungsbetrag: c.teuerungAmount,
      gestehungskosten_ek: c.effectivePurchasingCost,
      marge_aufschlag_prozent: c.marginPercent,
      verkaufspreis_netto_vk: c.unitPriceSellingNet,
      einheit: c.unit,
    }));
    onImportToTable('tbl_datanorm_kalkulation', flatRows);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Sub tabs & margin quick bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>10-stufige Rabattstaffel-Matrix</span>
          </button>
          <button
            onClick={() => setActiveSubTab('teuerung')}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'teuerung'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Teuerungszuschläge (TZ)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('calculator')}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'calculator'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Positionskalkulation ({calculations.length} Artikel)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600 dark:text-slate-300">Kalkulationsaufschlag:</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={globalMargin}
              onChange={(e) => setGlobalMargin(parseFloat(e.target.value) || 0)}
              className="w-16 p-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-center"
              min={0}
              max={200}
            />
            <span className="font-bold">% Marge</span>
          </div>
        </div>
      </div>

      {/* 1. Matrix View: 10-Tiers Editor */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span>DATANORM 5.0 Warengruppen- &amp; Rabattgruppen-Matrix (Stufen 1–10)</span>
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-mono">
                Multi-Kaskade Verrechnung
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 uppercase tracking-wider font-mono">
                <tr>
                  <th className="p-2 border-b border-slate-200 dark:border-slate-700">Gruppe</th>
                  <th className="p-2 border-b border-slate-200 dark:border-slate-700">Bezeichnung</th>
                  {[...Array(10)].map((_, i) => (
                    <th key={i} className="p-1.5 border-b border-slate-200 dark:border-slate-700 text-center">
                      Stufe {i + 1}
                    </th>
                  ))}
                  <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-right">Rabatt gesamt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                {discountTiers.map((dt) => {
                  const { combinedDiscountPercent } = DatanormCalculationEngine.calculateCompoundDiscount(dt.tiers);
                  return (
                    <tr key={dt.groupCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2 font-bold text-indigo-600 dark:text-indigo-400">{dt.groupCode}</td>
                      <td className="p-2 font-sans font-medium text-slate-800 dark:text-slate-200">{dt.groupName}</td>
                      {dt.tiers.map((tierVal, tIdx) => (
                        <td key={tIdx} className="p-1 text-center">
                          <input
                            type="number"
                            step="0.5"
                            value={tierVal}
                            onChange={(e) => handleTierChange(dt.groupCode, tIdx, parseFloat(e.target.value) || 0)}
                            className={`w-12 p-1 rounded text-center border text-[11px] ${
                              tierVal > 0
                                ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400'
                            }`}
                          />
                        </td>
                      ))}
                      <td className="p-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {combinedDiscountPercent.toFixed(2)} %
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Teuerungszuschlag (TZ) View */}
      {activeSubTab === 'teuerung' && (
        <div className="space-y-3">
          <div className="font-bold text-slate-700 dark:text-slate-200">
            Rohstoff- &amp; Teuerungszuschläge (TZ / DEL-Notiz)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {teuerungsMatrix.map((tz) => (
              <div
                key={tz.code}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{tz.code}</span>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{tz.name}</h4>
                  </div>
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded">
                    TZ Aktiv
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <label className="text-slate-500">Zuschlagssatz:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tz.percentage}
                    onChange={(e) => handleTeuerungChange(tz.code, parseFloat(e.target.value) || 0)}
                    className="w-20 p-1 font-bold text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                  <span className="font-bold">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Detailed Article Calculation Matrix */}
      {activeSubTab === 'calculator' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="font-bold text-slate-700 dark:text-slate-200">
              Vollständige Kaskaden-Kalkulation (Brutto ➔ Netto-EK ➔ TZ ➔ VK)
            </div>
            {onImportToTable && calculations.length > 0 && (
              <button
                onClick={handleExportCalculationsToTable}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow flex items-center gap-1.5"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>In Projekt-Tabelle importieren</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg max-h-72">
            <table className="w-full text-left border-collapse font-mono text-[11px]">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 uppercase sticky top-0">
                <tr>
                  <th className="p-2 border-b">Artikelnr</th>
                  <th className="p-2 border-b font-sans">Bezeichnung</th>
                  <th className="p-2 border-b text-right">Listenpreis (G)</th>
                  <th className="p-2 border-b text-right">Rabatt (%)</th>
                  <th className="p-2 border-b text-right">EK-Netto</th>
                  <th className="p-2 border-b text-right">TZ (%)</th>
                  <th className="p-2 border-b text-right">Einstandspreis</th>
                  <th className="p-2 border-b text-right">Marge (%)</th>
                  <th className="p-2 border-b text-right text-emerald-600 dark:text-emerald-400">VK-Netto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {calculations.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-2 font-bold text-slate-700 dark:text-slate-300">{c.articleNumber}</td>
                    <td className="p-2 font-sans text-slate-800 dark:text-slate-200 truncate max-w-xs">{c.description}</td>
                    <td className="p-2 text-right">{c.priceGross.toFixed(2)} €</td>
                    <td className="p-2 text-right text-indigo-600 dark:text-indigo-400">-{c.combinedDiscountPercent.toFixed(1)}%</td>
                    <td className="p-2 text-right">{c.priceNetPurchasing.toFixed(2)} €</td>
                    <td className="p-2 text-right text-amber-600 dark:text-amber-400">+{c.teuerungPercent}%</td>
                    <td className="p-2 text-right font-semibold">{c.effectivePurchasingCost.toFixed(2)} €</td>
                    <td className="p-2 text-right">+{c.marginPercent}%</td>
                    <td className="p-2 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
                      {c.unitPriceSellingNet.toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
