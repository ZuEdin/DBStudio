import React, { useState } from 'react';
import {
  X,
  Printer,
  Apple,
  Terminal,
  Monitor,
  FileText,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Sliders,
  Settings,
  Layers,
} from 'lucide-react';
import { Report } from '../../../types';
import { savePrintJobToIndexedDB } from '../services/reportIndexedDBService';

interface CrossPlatformPrintDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report;
  pageCount?: number;
  onExecutePrint: (options: PrintJobOptions) => void;
  onExportPdfA: (compliance: 'PDF/A-3b' | 'PDF/A-1b' | 'STANDARD') => void;
}

export interface PrintJobOptions {
  targetOS: 'macos_airprint' | 'linux_cups' | 'windows_spooler' | 'browser_direct';
  paperSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  copies: number;
  duplex: 'none' | 'long_edge' | 'short_edge';
  marginsMm: number;
  colorMode: 'color' | 'grayscale' | 'monochrome';
  cupsPrinterName?: string;
  pdfCompliance: 'PDF/A-3b' | 'PDF/A-1b' | 'STANDARD';
}

export const CrossPlatformPrintDialogModal: React.FC<CrossPlatformPrintDialogModalProps> = ({
  isOpen,
  onClose,
  report,
  pageCount = 1,
  onExecutePrint,
  onExportPdfA,
}) => {
  const [targetOS, setTargetOS] = useState<'macos_airprint' | 'linux_cups' | 'windows_spooler' | 'browser_direct'>('browser_direct');
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(report.settings?.orientation || 'portrait');
  const [copies, setCopies] = useState<number>(1);
  const [duplex, setDuplex] = useState<'none' | 'long_edge' | 'short_edge'>('long_edge');
  const [marginsMm, setMarginsMm] = useState<number>(15);
  const [colorMode, setColorMode] = useState<'color' | 'grayscale' | 'monochrome'>('color');
  const [cupsPrinterName, setCupsPrinterName] = useState('Kyocera_TASKalfa_Office');
  const [pdfCompliance, setPdfCompliance] = useState<'PDF/A-3b' | 'PDF/A-1b' | 'STANDARD'>('PDF/A-3b');
  const [copiedCupsCmd, setCopiedCupsCmd] = useState(false);

  if (!isOpen) return null;

  const cupsCliCommand = `lp -d "${cupsPrinterName}" -o media=${paperSize} -o sides=${duplex === 'long_edge' ? 'two-sided-long-edge' : 'one-sided'} -o fit-to-page -n ${copies} "${report.name.replace(/[^a-z0-9]/gi, '_')}.pdf"`;

  const handleCopyCups = () => {
    navigator.clipboard.writeText(cupsCliCommand);
    setCopiedCupsCmd(true);
    setTimeout(() => setCopiedCupsCmd(false), 2000);
  };

  const handlePrintSubmit = async () => {
    await savePrintJobToIndexedDB({
      id: `print_${Date.now()}`,
      reportTitle: report.name,
      printedAt: Date.now(),
      pageCount,
      status: 'PRINTED',
    });

    onExecutePrint({
      targetOS,
      paperSize,
      orientation,
      copies,
      duplex,
      marginsMm,
      colorMode,
      cupsPrinterName,
      pdfCompliance,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Printer size={20} className="text-amber-400" />
            <div>
              <h3 className="font-bold text-base">Plattformunabhängiger Druck-Manager & OS-Profile</h3>
              <p className="text-[11px] text-slate-400">macOS (AirPrint), Linux (CUPS), Windows (Spooler) & PDF/A-3b</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700">
          {/* OS Selector Tabs */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">Ziel-Betriebssystem / Druckertreiber-Profil:</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setTargetOS('browser_direct')}
                className={`p-2.5 rounded-lg border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  targetOS === 'browser_direct'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold shadow-xs'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Monitor size={18} className="text-blue-600" />
                <span className="text-[11px]">System-Dialog</span>
              </button>

              <button
                onClick={() => setTargetOS('macos_airprint')}
                className={`p-2.5 rounded-lg border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  targetOS === 'macos_airprint'
                    ? 'border-slate-800 bg-slate-900 text-white font-bold shadow-xs'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Apple size={18} className={targetOS === 'macos_airprint' ? 'text-white' : 'text-slate-700'} />
                <span className="text-[11px]">macOS (AirPrint)</span>
              </button>

              <button
                onClick={() => setTargetOS('linux_cups')}
                className={`p-2.5 rounded-lg border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  targetOS === 'linux_cups'
                    ? 'border-amber-600 bg-amber-50/80 text-amber-950 font-bold shadow-xs'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Terminal size={18} className="text-amber-600" />
                <span className="text-[11px]">Linux (CUPS)</span>
              </button>

              <button
                onClick={() => setTargetOS('windows_spooler')}
                className={`p-2.5 rounded-lg border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  targetOS === 'windows_spooler'
                    ? 'border-sky-600 bg-sky-50/80 text-sky-950 font-bold shadow-xs'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Monitor size={18} className="text-sky-600" />
                <span className="text-[11px]">Windows Spooler</span>
              </button>
            </div>
          </div>

          {/* OS-Specific Hints */}
          {targetOS === 'macos_airprint' && (
            <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 text-[11px] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Apple size={14} /> Apple AirPrint Zero-Configuration Driver:
              </div>
              <p className="text-slate-600">
                Nutzt native PostScript-Vektortreiber mit automatischer Randanpassung (DIN 5008 konform) und DPI-Skalierung für Retina-Displays.
              </p>
            </div>
          )}

          {targetOS === 'linux_cups' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 text-[11px] space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <Terminal size={14} /> Linux CUPS (Common UNIX Printing System) Integration:
              </div>
              <div className="flex items-center gap-2">
                <label className="text-slate-600 font-bold">CUPS Drucker-Queue:</label>
                <input
                  type="text"
                  value={cupsPrinterName}
                  onChange={(e) => setCupsPrinterName(e.target.value)}
                  className="flex-1 border border-amber-300 rounded px-2 py-1 font-mono text-xs bg-white"
                />
              </div>
              <div className="p-2 bg-slate-900 text-emerald-400 rounded font-mono text-[10px] flex justify-between items-center">
                <span className="truncate">{cupsCliCommand}</span>
                <button
                  onClick={handleCopyCups}
                  className="ml-2 px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedCupsCmd ? <Check size={12} /> : <Copy size={12} />}
                  {copiedCupsCmd ? 'Kopiert' : 'Kopieren'}
                </button>
              </div>
            </div>
          )}

          {/* Print Layout Options */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Papierformat:</label>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium"
                >
                  <option value="A4">DIN A4 (210 × 297 mm - Standard DACH)</option>
                  <option value="Letter">US Letter (8.5 × 11 in)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ausrichtung:</label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium"
                >
                  <option value="portrait">Hochformat (Portrait)</option>
                  <option value="landscape">Querformat (Landscape)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Duplexdruck (Beidseitig):</label>
                <select
                  value={duplex}
                  onChange={(e) => setDuplex(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium"
                >
                  <option value="long_edge">Lange Kante spiegeln (Standard)</option>
                  <option value="short_edge">Kurze Kante spiegeln (Kalenderbindung)</option>
                  <option value="none">Einseitig drucken</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Anzahl Exemplare:</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Druckränder:</label>
                <select
                  value={marginsMm}
                  onChange={(e) => setMarginsMm(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium"
                >
                  <option value={15}>15 mm (DIN 5008 Standard)</option>
                  <option value={10}>10 mm (Kompakt)</option>
                  <option value={5}>5 mm (Minimal)</option>
                  <option value={20}>20 mm (Heftrand)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PDF Langzeit-Archiv (ISO 19005):</label>
                <select
                  value={pdfCompliance}
                  onChange={(e) => setPdfCompliance(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium"
                >
                  <option value="PDF/A-3b">PDF/A-3b (Revisionssicher + E-Rechnung)</option>
                  <option value="PDF/A-1b">PDF/A-1b (Klassisches Langzeit-Archiv)</option>
                  <option value="STANDARD">Standard PDF</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={() => onExportPdfA(pdfCompliance)}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download size={14} className="text-emerald-600" />
            <span>Als {pdfCompliance} exportieren</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 font-medium text-xs cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              onClick={handlePrintSubmit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer size={14} />
              <span>Drucken ({copies} {copies === 1 ? 'Exemplar' : 'Exemplare'})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
