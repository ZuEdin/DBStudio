import React, { useState, useMemo } from 'react';
import { Euro, Calculator, Percent, PlusCircle, Database, Globe, Check } from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';
import { createTableFromTemplate } from '../../../services/tableTemplateService';
import { BUILTIN_TABLE_TEMPLATES } from '../../../data/tableTemplates';

interface CurrencyCalculationWidgetProps {
  id: string;
  label?: string;
  value?: number | string;
  isReadOnly?: boolean;
  currency?: string; // default EUR
  showVobTaxBreakdown?: boolean;
  onChange: (value: number) => void;
}

interface TaxRateOption {
  id: string | number;
  label: string;
  rate: number;
  country?: string;
  isFromTable?: boolean;
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
  
  // Default to Austria 20% if selected or standard 20/19
  const [selectedCountry, setSelectedCountry] = useState<'AT' | 'DE' | 'CH' | 'CUSTOM' | 'DB'>('AT');
  const [taxRate, setTaxRate] = useState<number>(20);
  const [customTaxRate, setCustomTaxRate] = useState<string>('20');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [retentionPercent, setRetentionPercent] = useState<number>(5);
  const [showCalculator, setShowCalculator] = useState(true);
  const [createdSuccess, setCreatedSuccess] = useState(false);

  const tables = useProjectStore((s) => s.tables);
  const addTable = useProjectStore((s) => s.addTable);
  const addToast = useUIStore((s) => s.addToast);

  // Check if project has a Steuersätze table
  const taxTable = useMemo(() => {
    return tables.find((t) => {
      const lower = t.name.toLowerCase();
      return lower === 'steuersaetze' || lower === 'steuersätze' || lower === 'taxrates' || lower === 'mwst' || lower === 'steuern';
    });
  }, [tables]);

  // Extract available tax rates from project table if present
  const tableTaxRates = useMemo<TaxRateOption[]>(() => {
    if (!taxTable || !Array.isArray(taxTable.data) || taxTable.data.length === 0) {
      return [];
    }

    const rateField = taxTable.fields.find(f => 
      f.name.toLowerCase().includes('steuer') || 
      f.name.toLowerCase().includes('prozent') || 
      f.name.toLowerCase().includes('satz') ||
      f.name.toLowerCase().includes('rate')
    )?.name || 'Steuersatz';

    const labelField = taxTable.fields.find(f => 
      f.name.toLowerCase().includes('bezeichnung') || 
      f.name.toLowerCase().includes('name') || 
      f.name.toLowerCase().includes('titel')
    )?.name || 'Bezeichnung';

    const countryField = taxTable.fields.find(f => 
      f.name.toLowerCase().includes('land') || 
      f.name.toLowerCase().includes('country')
    )?.name || 'Land';

    return taxTable.data.map((row, idx) => {
      const r = typeof row[rateField] === 'number' ? row[rateField] : parseFloat(row[rateField]) || 0;
      const lbl = row[labelField] || `${r}% Steuersatz`;
      const country = row[countryField] || '';
      return {
        id: row.Id || row.id || idx,
        label: `${lbl} (${r}%)`,
        rate: r,
        country,
        isFromTable: true,
      };
    });
  }, [taxTable]);

  // Preset tax rates
  const predefinedRates: Record<'AT' | 'DE' | 'CH', TaxRateOption[]> = {
    AT: [
      { id: 'at_20', label: '🇦🇹 20% Regelsteuersatz (Österreich)', rate: 20, country: 'Österreich' },
      { id: 'at_10', label: '🇦🇹 10% Ermäßigter Satz (Lebensmittel, Miete)', rate: 10, country: 'Österreich' },
      { id: 'at_13', label: '🇦🇹 13% Ermäßigter Satz (Beherbergung, Holz)', rate: 13, country: 'Österreich' },
      { id: 'at_0', label: '🇦🇹 0% §19 UStG (Bauleistungen / Reverse Charge)', rate: 0, country: 'Österreich' },
    ],
    DE: [
      { id: 'de_19', label: '🇩🇪 19% Regelsteuersatz (Deutschland)', rate: 19, country: 'Deutschland' },
      { id: 'de_7', label: '🇩🇪 7% Ermäßigter Satz', rate: 7, country: 'Deutschland' },
      { id: 'de_0', label: '🇩🇪 0% §13b UStG (Bauleistungen)', rate: 0, country: 'Deutschland' },
    ],
    CH: [
      { id: 'ch_81', label: '🇨🇭 8.1% Normalsatz (Schweiz)', rate: 8.1, country: 'Schweiz' },
      { id: 'ch_26', label: '🇨🇭 2.6% Reduzierter Satz', rate: 2.6, country: 'Schweiz' },
      { id: 'ch_38', label: '🇨🇭 3.8% Sondersatz Beherbergung', rate: 3.8, country: 'Schweiz' },
      { id: 'ch_0', label: '🇨🇭 0% Steuerbefreit', rate: 0, country: 'Schweiz' },
    ]
  };

  const handleCreateTaxRatesTable = () => {
    const template = BUILTIN_TABLE_TEMPLATES.find(t => t.id === 'tpl_steuersaetze');
    if (template) {
      const newTable = createTableFromTemplate(template, tables, true);
      addTable(newTable);
      setSelectedCountry('DB');
      setCreatedSuccess(true);
      if (addToast) {
        addToast('Tabelle "Steuersaetze" mit Vorlagen für AT, DE und CH erfolgreich in der Datenbank angelegt!', 'success');
      }
      setTimeout(() => setCreatedSuccess(false), 4000);
    }
  };

  const vatAmount = (numericVal * taxRate) / 100;
  const grossAmount = numericVal + vatAmount;
  const retentionAmount = (grossAmount * retentionPercent) / 100;
  const payoutAmount = grossAmount - retentionAmount;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('de-AT', {
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
          className="text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded cursor-pointer"
        >
          <Calculator size={11} /> {showCalculator ? 'Ausblenden' : 'Steuer & VOB/B Vorschau'}
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

      {/* Commercial / Tax Breakdown & Country Settings */}
      {(showCalculator || showVobTaxBreakdown) && (
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 space-y-2 text-xs">
          
          {/* Country / Database Table Selector Header */}
          <div className="flex flex-wrap items-center justify-between gap-1 pb-1.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Region / Quelle:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCountry('AT');
                    setIsCustomMode(false);
                    setTaxRate(20);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    selectedCountry === 'AT' && !isCustomMode
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                  title="Österreich (20%, 10%, 13%, 0%)"
                >
                  🇦🇹 AT (20%)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCountry('DE');
                    setIsCustomMode(false);
                    setTaxRate(19);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    selectedCountry === 'DE' && !isCustomMode
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                  title="Deutschland (19%, 7%, 0%)"
                >
                  🇩🇪 DE (19%)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCountry('CH');
                    setIsCustomMode(false);
                    setTaxRate(8.1);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    selectedCountry === 'CH' && !isCustomMode
                      ? 'bg-red-700 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                  title="Schweiz (8.1%, 2.6%, 3.8%)"
                >
                  🇨🇭 CH (8.1%)
                </button>

                {tableTaxRates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCountry('DB');
                      setIsCustomMode(false);
                      setTaxRate(tableTaxRates[0]?.rate ?? 20);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1 transition-colors ${
                      selectedCountry === 'DB' && !isCustomMode
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50'
                    }`}
                    title="Aus Tabelle 'Steuersaetze'"
                  >
                    <Database size={10} /> DB-Tabelle ({tableTaxRates.length})
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsCustomMode(true);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    isCustomMode
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                  title="Eigenen Steuersatz eingeben"
                >
                  Manuell %
                </button>
              </div>
            </div>

            {/* Quick 1-click button to create Steuersätze table in database if not present */}
            {!taxTable && (
              <button
                type="button"
                onClick={handleCreateTaxRatesTable}
                className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded"
                title="Erstellt die Tabelle 'Steuersaetze' direkt in Ihrer Projektdatenbank"
              >
                <PlusCircle size={11} /> Tabelle "Steuersätze" anlegen
              </button>
            )}
            {createdSuccess && (
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                <Check size={10} /> Tabelle angelegt!
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>Netto-Betrag:</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatCurrency(numericVal)}</span>
          </div>

          {/* Tax Rate Selection */}
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 flex-1 mr-2">
              <span className="shrink-0 font-medium">zzgl. MwSt:</span>
              {isCustomMode ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    disabled={isReadOnly}
                    value={customTaxRate}
                    onChange={(e) => {
                      setCustomTaxRate(e.target.value);
                      const parsed = parseFloat(e.target.value);
                      if (!isNaN(parsed)) setTaxRate(parsed);
                    }}
                    className="w-16 text-[11px] font-mono border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-1 py-0.5"
                    placeholder="20.0"
                  />
                  <span className="text-[11px] font-bold">%</span>
                </div>
              ) : selectedCountry === 'DB' && tableTaxRates.length > 0 ? (
                <select
                  disabled={isReadOnly}
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                  className="text-[10px] border border-emerald-400 dark:border-emerald-600 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-1 py-0.5 max-w-[200px] truncate"
                >
                  {tableTaxRates.map((opt) => (
                    <option key={opt.id} value={opt.rate}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  disabled={isReadOnly}
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                  className="text-[10px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-1 py-0.5 max-w-[220px] truncate"
                >
                  {(predefinedRates[selectedCountry as 'AT' | 'DE' | 'CH'] || predefinedRates.AT).map((opt) => (
                    <option key={opt.id} value={opt.rate}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <span className="font-mono font-semibold shrink-0">{formatCurrency(vatAmount)}</span>
          </div>

          <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
            <span>Brutto-Rechnungssumme:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(grossAmount)}</span>
          </div>

          {/* Retention / Sicherheitseinbehalt (VOB/B oder ÖNORM B 2110 Haftrücklass) */}
          <div className="flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-1">
              <span>abzgl. Sicherheitseinbehalt / Rücklass:</span>
              <select
                disabled={isReadOnly}
                value={retentionPercent}
                onChange={(e) => setRetentionPercent(parseFloat(e.target.value))}
                className="text-[10px] border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 px-1 py-0.5"
              >
                <option value={0}>0% (Kein Abzug)</option>
                <option value={3}>3% (ÖNORM B 2110 Haftrücklass)</option>
                <option value={5}>5% (VOB/B / Deckungsrücklass)</option>
                <option value={10}>10% (Erfüllungsgarantie)</option>
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
