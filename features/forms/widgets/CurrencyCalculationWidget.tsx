import React, { useState } from 'react';
import { Euro, Calculator, Percent } from 'lucide-react';

interface CurrencyCalculationWidgetProps {
  id: string;
  label?: string;
  value?: number | string;
  isReadOnly?: boolean;
  currency?: string; // default EUR
  showVobTaxBreakdown?: boolean;
  onChange: (value: number) => void;
}

export const CurrencyCalculationWidget: React.FC<CurrencyCalculationWidgetProps> = ({
  id,
  label = 'Kaufmännischer Betrag',
  value = 0,
  isReadOnly = false,
  currency = 'EUR',
  showVobTaxBreakdown = true,
  onChange,
}) => {
  const numericVal = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.')) || 0;
  const [taxRate, setTaxRate] = useState<number>(19);
  const [retentionPercent, setRetentionPercent] = useState<number>(5);
  const [showCalculator, setShowCalculator] = useState(false);

  const vatAmount = (numericVal * taxRate) / 100;
  const grossAmount = numericVal + vatAmount;
  const retentionAmount = (grossAmount * retentionPercent) / 100;
  const payoutAmount = grossAmount - retentionAmount;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div id={id} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Euro size={16} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label} (Netto)</span>
        </div>
        <button
          type="button"
          onClick={() => setShowCalculator(!showCalculator)}
          className="text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"
        >
          <Calculator size={11} /> {showCalculator ? 'Ausblenden' : 'VOB/B Vorschau'}
        </button>
      </div>

      <div className="relative">
        <input
          type="number"
          step="0.01"
          disabled={isReadOnly}
          value={numericVal || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full text-sm font-mono font-bold pl-3 pr-12 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="0.00"
        />
        <div className="absolute right-3 top-2 text-xs font-bold text-slate-400 pointer-events-none">
          {currency}
        </div>
      </div>

      {/* VOB / Commercial Tax Breakdown Preview */}
      {(showCalculator || showVobTaxBreakdown) && (
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>Netto-Betrag:</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatCurrency(numericVal)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <span>zzgl. MwSt:</span>
              <select
                disabled={isReadOnly}
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                className="text-[10px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-1"
              >
                <option value={19}>19% Regelsteuersatz</option>
                <option value={7}>7% Ermäßigt</option>
                <option value={0}>0% §13b UStG (Bau)</option>
              </select>
            </div>
            <span className="font-mono">{formatCurrency(vatAmount)}</span>
          </div>

          <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
            <span>Brutto-Rechnungssumme:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(grossAmount)}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-1">
              <span>abzgl. VOB/B Sicherheitseinbehalt:</span>
              <select
                disabled={isReadOnly}
                value={retentionPercent}
                onChange={(e) => setRetentionPercent(parseFloat(e.target.value))}
                className="text-[10px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 px-1"
              >
                <option value={5}>5%</option>
                <option value={10}>10%</option>
                <option value={0}>0%</option>
              </select>
            </div>
            <span className="font-mono">-{formatCurrency(retentionAmount)}</span>
          </div>

          <div className="flex items-center justify-between font-bold text-blue-700 dark:text-blue-400 pt-1 border-t border-slate-200 dark:border-slate-800">
            <span>Auszahlungsbetrag:</span>
            <span className="font-mono">{formatCurrency(payoutAmount)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
