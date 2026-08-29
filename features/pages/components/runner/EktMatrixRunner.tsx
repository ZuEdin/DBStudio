import React, { useState } from 'react';
import { Calculator, Percent, DollarSign, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

export interface EktRow {
  id: string;
  oz: string;
  name: string;
  labor: number;      // Lohn (L)
  material: number;   // Stoff/Material (M)
  equipment: number;  // Geräte (G)
  other: number;      // Sonstiges (S)
  subcon: number;     // Nachunternehmer (NU)
}

const DEFAULT_EKT_ROWS: EktRow[] = [
  { id: 'ekt_1', oz: '01.01.0010', name: 'Baugrube ausheben', labor: 6.50, material: 0.00, equipment: 9.80, other: 0.50, subcon: 0.00 },
  { id: 'ekt_2', oz: '01.01.0020', name: 'Boden abfahren & deponieren', labor: 3.20, material: 0.00, equipment: 8.40, other: 1.20, subcon: 11.20 },
  { id: 'ekt_3', oz: '01.02.0020', name: 'Stahlbetonsohlplatte C25/30', labor: 28.50, material: 38.20, equipment: 6.40, other: 1.90, subcon: 0.00 },
];

export const EktMatrixRunner: React.FC<{ props?: Record<string, any> }> = ({ props = {} }) => {
  const [rows, setRows] = useState<EktRow[]>(DEFAULT_EKT_ROWS);
  
  // Surcharges in %
  const [bgk, setBgk] = useState<number>(12); // Baustellengemeinkosten
  const [agk, setAgk] = useState<number>(14); // Allgemeine Geschäftskosten
  const [wug, setWug] = useState<number>(6);  // Wagnis & Gewinn

  const totalSurchargeMultiplier = 1 + (bgk + agk + wug) / 100;

  const calculateTotalEkt = (r: EktRow) => r.labor + r.material + r.equipment + r.other + r.subcon;
  const calculateFinalPrice = (r: EktRow) => calculateTotalEkt(r) * totalSurchargeMultiplier;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs my-3">
      {/* Header */}
      <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-emerald-600 flex items-center justify-center text-white">
            <Calculator size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold">{props.title || 'EKT-Kalkulationsmatrix (Einzelkosten & Zuschläge)'}</h3>
            <p className="text-[10px] text-slate-400">Kostenartenaufteilung: Lohn, Material, Geräte, Sonstiges, NU</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">
            <span className="text-slate-400 text-[10px]">BGK:</span>
            <input
              type="number"
              value={bgk}
              onChange={(e) => setBgk(Number(e.target.value))}
              className="w-10 bg-slate-900 text-amber-300 font-mono text-center rounded px-1"
            />
            <span className="text-slate-400 text-[10px]">%</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">
            <span className="text-slate-400 text-[10px]">AGK:</span>
            <input
              type="number"
              value={agk}
              onChange={(e) => setAgk(Number(e.target.value))}
              className="w-10 bg-slate-900 text-sky-300 font-mono text-center rounded px-1"
            />
            <span className="text-slate-400 text-[10px]">%</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">
            <span className="text-slate-400 text-[10px]">W&G:</span>
            <input
              type="number"
              value={wug}
              onChange={(e) => setWug(Number(e.target.value))}
              className="w-10 bg-slate-900 text-emerald-300 font-mono text-center rounded px-1"
            />
            <span className="text-slate-400 text-[10px]">%</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 text-[11px]">
              <th className="py-2 px-3 w-28">OZ</th>
              <th className="py-2 px-3">Position</th>
              <th className="py-2 px-2 text-right text-indigo-700 dark:text-indigo-300">Lohn (L)</th>
              <th className="py-2 px-2 text-right text-blue-700 dark:text-blue-300">Stoff (M)</th>
              <th className="py-2 px-2 text-right text-amber-700 dark:text-amber-300">Gerät (G)</th>
              <th className="py-2 px-2 text-right text-slate-700 dark:text-slate-300">Sonst. (S)</th>
              <th className="py-2 px-2 text-right text-purple-700 dark:text-purple-300">NU</th>
              <th className="py-2 px-3 text-right font-bold bg-slate-200/50 dark:bg-slate-800">EKT Summe</th>
              <th className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30">Endpreis (EP)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map((r, idx) => {
              const ekt = calculateTotalEkt(r);
              const ep = calculateFinalPrice(r);
              return (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">{r.oz}</td>
                  <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{r.name}</td>
                  <td className="py-2 px-2 text-right font-mono">{r.labor.toFixed(2)} €</td>
                  <td className="py-2 px-2 text-right font-mono">{r.material.toFixed(2)} €</td>
                  <td className="py-2 px-2 text-right font-mono">{r.equipment.toFixed(2)} €</td>
                  <td className="py-2 px-2 text-right font-mono">{r.other.toFixed(2)} €</td>
                  <td className="py-2 px-2 text-right font-mono">{r.subcon.toFixed(2)} €</td>
                  <td className="py-2 px-3 text-right font-mono font-bold bg-slate-50 dark:bg-slate-800/60">
                    {ekt.toFixed(2)} €
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                    {ep.toFixed(2)} €
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
