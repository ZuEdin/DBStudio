import React, { useState } from 'react';
import { X, Tag, Printer, Check, Eye } from 'lucide-react';
import { generateBarcodeSvg } from '../utils/barcodeGenerator';

interface LabelThermalPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LabelThermalPrintModal: React.FC<LabelThermalPrintModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'LABEL_SHEET' | 'THERMAL_RECEIPT'>('LABEL_SHEET');
  const [labelTemplate, setLabelTemplate] = useState('AVERY_L7160'); // 63.5 x 38.1 mm
  const [thermalWidth, setThermalWidth] = useState<'80mm' | '58mm'>('80mm');
  const [barcodeType, setBarcodeType] = useState<'QR_CODE' | 'EAN13' | 'CODE128'>('QR_CODE');
  const [barcodeVal, setBarcodeVal] = useState('ART-2026-9912');

  if (!isOpen) return null;

  const svgBarcode = generateBarcodeSvg({
    type: barcodeType,
    value: barcodeVal,
    width: mode === 'THERMAL_RECEIPT' ? 140 : 100,
    height: 50,
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Tag size={20} className="text-amber-400" />
            <h3 className="font-bold text-base">Endlosetiketten & Thermo-Bondruck Designer</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setMode('LABEL_SHEET')}
              className={`flex-1 py-1.5 font-bold rounded text-xs transition ${
                mode === 'LABEL_SHEET' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Etiketten-Bogen (Avery Zweckform / Zebra)
            </button>
            <button
              onClick={() => setMode('THERMAL_RECEIPT')}
              className={`flex-1 py-1.5 font-bold rounded text-xs transition ${
                mode === 'THERMAL_RECEIPT' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              POS-Thermo-Bondrucker (58mm / 80mm)
            </button>
          </div>

          {mode === 'LABEL_SHEET' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1 text-slate-800">Vorlagen-Raster wählen:</label>
                <select
                  value={labelTemplate}
                  onChange={(e) => setLabelTemplate(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium"
                >
                  <option value="AVERY_L7160">Avery L7160 (63.5 x 38.1 mm - 21 Labels/A4)</option>
                  <option value="AVERY_3474">Avery 3474 (70 x 37 mm - 24 Labels/A4)</option>
                  <option value="ZEBRA_4x6">Zebra Versandetikett (102 x 152 mm / 4x6")</option>
                  <option value="DYMO_LARGE">Dymo Large Address (89 x 36 mm)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-800">Barcode-Format:</label>
                <select
                  value={barcodeType}
                  onChange={(e) => setBarcodeType(e.target.value as any)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium"
                >
                  <option value="QR_CODE">2D QR-Code</option>
                  <option value="CODE128">Code-128 Industriestandard</option>
                  <option value="EAN13">EAN-13 Artikelnummer</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1 text-slate-800">Bon-Papierbreite:</label>
                <select
                  value={thermalWidth}
                  onChange={(e) => setThermalWidth(e.target.value as any)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-bold text-slate-800"
                >
                  <option value="80mm">80mm Standarbeleg (EPSON / Star)</option>
                  <option value="58mm">58mm Kompaktbeleg (Mobil-Drucker)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-800">Barcode-Inhalt / Artikel-SKU:</label>
                <input
                  type="text"
                  value={barcodeVal}
                  onChange={(e) => setBarcodeVal(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* Live Preview Box */}
          <div>
            <label className="block font-bold mb-1.5 text-slate-800 flex items-center gap-1.5">
              <Eye size={14} className="text-blue-600" /> Druckvorschau (Etikett / Kassenbon):
            </label>
            <div className="bg-slate-200 p-4 rounded-lg flex justify-center items-center">
              <div
                className="bg-white border-2 border-dashed border-slate-400 p-3 rounded shadow-sm text-center space-y-2 font-mono"
                style={{ width: mode === 'THERMAL_RECEIPT' ? (thermalWidth === '80mm' ? '240px' : '180px') : '220px' }}
              >
                <div className="font-bold text-[11px] text-slate-900 border-b pb-1">MUSTER BAU GMBH POS</div>
                <div className="text-[10px] text-slate-600">Datum: 31.08.2026 14:30</div>
                <div className="flex justify-center my-2" dangerouslySetInnerHTML={{ __html: svgBarcode }} />
                <div className="text-[10px] font-bold text-slate-800">{barcodeVal}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-3.5 py-1.5 rounded border border-slate-300 bg-white font-medium">
            Abbrechen
          </button>
          <button
            onClick={() => {
              window.print();
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-2xs"
          >
            <Printer size={14} />
            <span>Druckauftrag starten</span>
          </button>
        </div>
      </div>
    </div>
  );
};
