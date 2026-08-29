import React, { useState } from 'react';
import { QrCode, Scan, CheckCircle2, Sparkles } from 'lucide-react';

interface BarcodeScannerWidgetProps {
  id: string;
  label?: string;
  value?: string;
  isReadOnly?: boolean;
  onChange: (value: string) => void;
}

export const BarcodeScannerWidget: React.FC<BarcodeScannerWidgetProps> = ({
  id,
  label = 'Barcode / QR-Code Scanner',
  value = '',
  isReadOnly = false,
  onChange,
}) => {
  const [isScanning, setIsScanning] = useState(false);

  const simulateScan = (sampleCode: string) => {
    setIsScanning(true);
    setTimeout(() => {
      onChange(sampleCode);
      setIsScanning(false);
    }, 400);
  };

  return (
    <div id={id} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode size={16} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
        </div>
        {value && (
          <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 size={11} /> Erfasst
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          disabled={isReadOnly}
          placeholder="Code scannen oder eingeben..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs font-mono font-bold px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
        />

        {!isReadOnly && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => simulateScan(`LS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)}
              disabled={isScanning}
              className="flex items-center gap-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50 whitespace-nowrap"
              title="Lieferschein Barcode simulieren"
            >
              <Scan size={14} className={isScanning ? 'animate-spin' : ''} />
              <span>Scan</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick sample barcodes for testing */}
      {!isReadOnly && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px]">
          <span className="text-slate-400 font-medium">Schnellscan:</span>
          <button
            type="button"
            onClick={() => simulateScan('EAN-4008123456789')}
            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded font-mono"
          >
            EAN-13 Material
          </button>
          <button
            type="button"
            onClick={() => simulateScan('INV-GERAET-2026-042')}
            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded font-mono"
          >
            Inventar-Tag
          </button>
        </div>
      )}
    </div>
  );
};
