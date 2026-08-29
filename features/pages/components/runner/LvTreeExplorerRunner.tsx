import React, { useState } from 'react';
import { 
  FolderTree, ChevronDown, ChevronRight, FileText, Search, Plus, 
  Tag, Download, Layers, ShieldCheck, Calculator 
} from 'lucide-react';

export interface LvPosition {
  id: string;
  oz: string; // Ordnungszahl z.B. 01.01.0010
  type: 'TITLE' | 'LOT' | 'POSITION' | 'OPTIONAL' | 'ALLOWANCE';
  shortText: string;
  longText?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  totalPrice?: number;
  din276?: string;
}

const DEFAULT_LV_DATA: LvPosition[] = [
  { id: 'lv_1', oz: '01', type: 'LOT', shortText: 'Rohbau- & Erdarbeiten' },
  { id: 'lv_2', oz: '01.01', type: 'TITLE', shortText: 'Erdarbeiten & Baugrube' },
  { id: 'lv_3', oz: '01.01.0010', type: 'POSITION', shortText: 'Baugrube ausheben, Bodenklasse 3-4', quantity: 450, unit: 'm³', unitPrice: 18.50, totalPrice: 8325.00, din276: '312' },
  { id: 'lv_4', oz: '01.01.0020', type: 'POSITION', shortText: 'Boden abfahren und fachgerecht entsorgen', quantity: 450, unit: 'm³', unitPrice: 24.00, totalPrice: 10800.00, din276: '313' },
  { id: 'lv_5', oz: '01.02', type: 'TITLE', shortText: 'Beton- & Stahlbetonarbeiten' },
  { id: 'lv_6', oz: '01.02.0010', type: 'POSITION', shortText: 'Sauberkeitsschicht aus Magerbeton d=10cm', quantity: 180, unit: 'm²', unitPrice: 16.20, totalPrice: 2916.00, din276: '321' },
  { id: 'lv_7', oz: '01.02.0020', type: 'POSITION', shortText: 'Stahlbetonsohlplatte C25/30 d=25cm wasserundurchlässig', quantity: 180, unit: 'm²', unitPrice: 85.00, totalPrice: 15300.00, din276: '322' },
  { id: 'lv_8', oz: '01.02.0030', type: 'ALLOWANCE', shortText: 'Zulage für WU-Fugenblech einbauen', quantity: 64, unit: 'm', unitPrice: 32.00, totalPrice: 2048.00, din276: '322' },
];

export const LvTreeExplorerRunner: React.FC<{ props?: Record<string, any> }> = ({ props = {} }) => {
  const [items, setItems] = useState<LvPosition[]>(DEFAULT_LV_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string>('lv_3');

  const filtered = items.filter(
    (i) =>
      i.oz.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.shortText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.din276 && i.din276.includes(searchTerm))
  );

  const totalSum = items
    .filter((i) => i.type === 'POSITION' || i.type === 'ALLOWANCE')
    .reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

  const selectedItem = items.find((i) => i.id === selectedId);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col my-3">
      {/* Header */}
      <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center text-white">
            <FolderTree size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold">{props.title || 'Leistungsverzeichnis & GAEB LV-Tree'}</h3>
            <p className="text-[10px] text-slate-400">Hierarchische Ordnungszahlen (OZ), DIN 276 & Positionspreise</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">LV-Gesamtsumme (Netto)</div>
          <div className="text-sm font-bold text-emerald-400 font-mono">
            {totalSum.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Nach OZ, Kurztext oder DIN 276 filtern..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">{filtered.length} Einträge</span>
        </div>
      </div>

      {/* Main Grid / Tree */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 text-[11px]">
              <th className="py-2 px-3 w-28">OZ</th>
              <th className="py-2 px-3">Kurztext & Leistungsbeschreibung</th>
              <th className="py-2 px-3 w-20 text-center">DIN 276</th>
              <th className="py-2 px-3 w-24 text-right">Menge</th>
              <th className="py-2 px-3 w-16 text-center">Einheit</th>
              <th className="py-2 px-3 w-28 text-right">Einheitspreis</th>
              <th className="py-2 px-3 w-32 text-right">Gesamtpreis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.map((item) => {
              const isLot = item.type === 'LOT';
              const isTitle = item.type === 'TITLE';
              const isSelected = item.id === selectedId;

              if (isLot) {
                return (
                  <tr key={item.id} className="bg-indigo-50/70 dark:bg-indigo-950/40 font-bold text-indigo-950 dark:text-indigo-200">
                    <td className="py-2 px-3 font-mono">{item.oz}</td>
                    <td colSpan={6} className="py-2 px-3 uppercase tracking-wide">
                      Los: {item.shortText}
                    </td>
                  </tr>
                );
              }

              if (isTitle) {
                return (
                  <tr key={item.id} className="bg-slate-50 dark:bg-slate-800/40 font-semibold text-slate-800 dark:text-slate-200">
                    <td className="py-1.5 px-3 pl-5 font-mono">{item.oz}</td>
                    <td colSpan={6} className="py-1.5 px-3">
                      Titel: {item.shortText}
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 font-medium'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-2 px-3 pl-7 font-mono text-slate-700 dark:text-slate-300">{item.oz}</td>
                  <td className="py-2 px-3 text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {item.type === 'ALLOWANCE' && (
                      <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded text-[9px] font-bold">
                        Zulage
                      </span>
                    )}
                    <span>{item.shortText}</span>
                  </td>
                  <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">{item.din276 || '-'}</td>
                  <td className="py-2 px-3 text-right font-mono">{item.quantity?.toLocaleString('de-DE')}</td>
                  <td className="py-2 px-3 text-center text-slate-500">{item.unit}</td>
                  <td className="py-2 px-3 text-right font-mono">
                    {item.unitPrice?.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                    {item.totalPrice?.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
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
