import React, { useState } from 'react';
import {
  X,
  Tag,
  Printer,
  Check,
  Eye,
  Usb,
  Radio,
  Wifi,
  Download,
  Code,
  DollarSign,
  Scissors,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { generateBarcodeSvg } from '../utils/barcodeGenerator';
import { EscPosReceiptData, ThermalPrinterConfig } from '../../../types/report';
import { generateEscPosReceipt, EscPosBuilder } from '../utils/escposGenerator';
import { ThermalPrinterService, PrinterConnectionResult } from '../services/thermalPrinterService';

interface LabelThermalPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LabelThermalPrintModal: React.FC<LabelThermalPrintModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'LABEL_SHEET' | 'THERMAL_RECEIPT'>('THERMAL_RECEIPT');
  const [labelTemplate, setLabelTemplate] = useState('AVERY_L7160');
  const [thermalWidth, setThermalWidth] = useState<'80mm' | '58mm'>('80mm');
  const [barcodeType, setBarcodeType] = useState<'QR_CODE' | 'EAN13' | 'CODE128'>('QR_CODE');
  const [barcodeVal, setBarcodeVal] = useState('ART-2026-9912');

  // Thermal Hardware & Receipt Configuration
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'hex' | 'hardware'>('preview');
  const [connectionType, setConnectionType] = useState<'browser_direct' | 'webusb' | 'webserial' | 'webbluetooth' | 'network_raw'>('browser_direct');
  const [networkHost, setNetworkHost] = useState('192.168.1.200');
  const [networkPort, setNetworkPort] = useState(9100);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [autoCut, setAutoCut] = useState(true);
  const [charSet, setCharSet] = useState<'CP850' | 'CP1252' | 'CP437'>('CP850');
  const [companyTitle, setCompanyTitle] = useState('MUSTERBAU GMBH POS');
  const [receiptNumber, setReceiptNumber] = useState('BELEG-2026-0842');

  // Sample line items
  const [items, setItems] = useState([
    { name: 'Portlandzement CEM II 25kg', qty: 4, unitPrice: 8.50, total: 34.00 },
    { name: 'Bewehrungsstahl B500B 12mm', qty: 10, unitPrice: 14.20, total: 142.00 },
    { name: 'Estrich-Dämmstoff EPS 30mm', qty: 6, unitPrice: 19.50, total: 117.00 },
  ]);

  const [printStatus, setPrintStatus] = useState<PrinterConnectionResult | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  const netTotal = items.reduce((acc, it) => acc + it.total, 0);
  const taxTotal = Math.round(netTotal * 0.19 * 100) / 100;
  const grossTotal = Math.round((netTotal + taxTotal) * 100) / 100;

  const receiptData: EscPosReceiptData = {
    title: companyTitle,
    subtitle: 'Baustoffhandel & Bauausführung',
    meta: [
      { label: 'Datum', value: new Date().toLocaleString('de-DE') },
      { label: 'Beleg-Nr', value: receiptNumber },
      { label: 'Kassierer', value: 'Büro / Terminal 01' },
      { label: 'Kunde', value: 'Barverkauf Baustelle' },
    ],
    items: items,
    vatRates: [{ label: 'Standard 19%', rate: 19, net: netTotal, tax: taxTotal }],
    netTotal: netTotal,
    taxTotal: taxTotal,
    grossTotal: grossTotal,
    paymentMethod: 'EC-Karte / Barzahlung',
    qrCodeData: `TSE-VOB-SIG-${receiptNumber}-${grossTotal}`,
    barcodeData: barcodeVal,
    footerNotes: 'Steuerfreie innergem. Lieferungen nach §4 Nr. 1b UStG separat vermerkt.',
  };

  const thermalConfig: ThermalPrinterConfig = {
    paperWidth: thermalWidth,
    connectionType: connectionType,
    networkHost: networkHost,
    networkPort: networkPort,
    characterSet: charSet,
    autoCut: autoCut,
    openCashDrawer: openDrawer,
    printBarcode: true,
    barcodeContent: barcodeVal,
  };

  const rawBytes = generateEscPosReceipt(receiptData, thermalConfig);
  const hexPreview = Array.from(rawBytes.slice(0, 180))
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');

  const svgBarcode = generateBarcodeSvg({
    type: barcodeType,
    value: barcodeVal,
    width: mode === 'THERMAL_RECEIPT' ? 140 : 100,
    height: 48,
  });

  const handlePrint = async () => {
    setIsPrinting(true);
    setPrintStatus(null);
    try {
      const res = await ThermalPrinterService.printReceipt(receiptData, thermalConfig);
      setPrintStatus(res);
      if (res.success && connectionType === 'browser_direct') {
        window.print();
      }
    } catch (err: any) {
      setPrintStatus({ success: false, message: err.message || 'Druckfehler' });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadBin = () => {
    ThermalPrinterService.downloadBinarySpool(rawBytes, `${receiptNumber}_raw_escpos.prn`);
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      data-no-print="true"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print print:hidden"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <Tag size={20} className="text-amber-400" />
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                ESC/POS Thermo-Bondrucker & Endlosetiketten Designer
              </h3>
              <p className="text-[11px] text-slate-400">
                Natives Senden von Raw-ESC/POS Steuerzeichen (58mm / 80mm) über WebUSB, Serial, Bluetooth & LAN
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setMode('THERMAL_RECEIPT')}
              className={`flex-1 py-1.5 font-bold rounded text-xs transition ${
                mode === 'THERMAL_RECEIPT'
                  ? 'bg-white shadow-2xs text-blue-700 border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              POS-Thermo-Bondrucker (58mm / 80mm ESC/POS)
            </button>
            <button
              onClick={() => setMode('LABEL_SHEET')}
              className={`flex-1 py-1.5 font-bold rounded text-xs transition ${
                mode === 'LABEL_SHEET'
                  ? 'bg-white shadow-2xs text-blue-700 border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Etiketten-Bogen (Avery Zweckform / Zebra)
            </button>
          </div>

          {mode === 'THERMAL_RECEIPT' ? (
            <div className="space-y-4">
              {/* Controls Bar */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block font-bold mb-1 text-slate-800">Papierformat:</label>
                  <select
                    value={thermalWidth}
                    onChange={(e) => setThermalWidth(e.target.value as any)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-bold text-slate-800"
                  >
                    <option value="80mm">80 mm Standard (Epson TM-T88 / Star TSP100)</option>
                    <option value="58mm">58 mm Kompakt (Mobil / POS-58)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-800">Schnittstelle (Hardware):</label>
                  <select
                    value={connectionType}
                    onChange={(e) => setConnectionType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium"
                  >
                    <option value="browser_direct">Browser Direct &amp; Spool (.prn)</option>
                    <option value="webusb">WebUSB (Direct Driverless)</option>
                    <option value="webserial">Web Serial (COM / RS-232)</option>
                    <option value="webbluetooth">Web Bluetooth (BLE Mobile POS)</option>
                    <option value="network_raw">Netzwerk Raw TCP (Port 9100)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-800">Zeichensatz / Codepage:</label>
                  <select
                    value={charSet}
                    onChange={(e) => setCharSet(e.target.value as any)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium"
                  >
                    <option value="CP850">CP850 (Westeuropa / Umlaute)</option>
                    <option value="CP1252">CP1252 (Windows Latin-1)</option>
                    <option value="CP437">CP437 (Standard US)</option>
                  </select>
                </div>
              </div>

              {/* Hardware Toggles */}
              <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-700 bg-white p-2.5 rounded border border-slate-200">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCut}
                    onChange={(e) => setAutoCut(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <Scissors size={13} className="text-slate-500" />
                  <span>Automatischer Papierschnitt (AutoCut GS V)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openDrawer}
                    onChange={(e) => setOpenDrawer(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <DollarSign size={13} className="text-slate-500" />
                  <span>Kassenschublade öffnen (Impuls ESC p)</span>
                </label>
              </div>

              {/* Sub-Tabs: Live Preview vs Raw Hex */}
              <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveSubTab('preview')}
                    className={`px-3 py-1 font-bold rounded text-xs flex items-center gap-1.5 ${
                      activeSubTab === 'preview' ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Eye size={13} /> Bon-Vorschau
                  </button>
                  <button
                    onClick={() => setActiveSubTab('hex')}
                    className={`px-3 py-1 font-bold rounded text-xs flex items-center gap-1.5 ${
                      activeSubTab === 'hex' ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Code size={13} /> Raw ESC/POS Bytes ({rawBytes.length} B)
                  </button>
                </div>
                <button
                  onClick={handleDownloadBin}
                  className="text-slate-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1"
                >
                  <Download size={13} /> Spool-Datei (.prn)
                </button>
              </div>

              {activeSubTab === 'preview' ? (
                <div className="bg-slate-200 p-4 rounded-lg flex justify-center items-center">
                  <div
                    className="bg-white border-2 border-dashed border-slate-400 p-4 rounded shadow-md font-mono text-[11px] leading-tight space-y-2 text-slate-900"
                    style={{ width: thermalWidth === '80mm' ? '300px' : '230px' }}
                  >
                    <div className="text-center border-b pb-1.5">
                      <div className="font-extrabold text-xs">{companyTitle}</div>
                      <div className="text-[10px] text-slate-500">Baustoffhandel &amp; Bauausführung</div>
                      <div className="text-[10px] text-slate-500">{new Date().toLocaleString('de-DE')}</div>
                      <div className="text-[10px] text-slate-500 font-bold">{receiptNumber}</div>
                    </div>

                    <div className="divide-y divide-slate-100 text-[10px]">
                      {items.map((item, idx) => (
                        <div key={idx} className="py-1">
                          <div className="font-semibold truncate">{item.name}</div>
                          <div className="flex justify-between text-slate-600">
                            <span>
                              {item.qty} x {item.unitPrice.toFixed(2)} EUR
                            </span>
                            <span className="font-bold text-slate-900">{item.total.toFixed(2)} EUR</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-dashed pt-1 space-y-0.5 text-[10px]">
                      <div className="flex justify-between text-slate-600">
                        <span>Netto 19%:</span>
                        <span>{netTotal.toFixed(2)} EUR</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>MwSt. 19%:</span>
                        <span>{taxTotal.toFixed(2)} EUR</span>
                      </div>
                      <div className="flex justify-between font-extrabold text-xs text-slate-900 border-t pt-1">
                        <span>GESAMT:</span>
                        <span>{grossTotal.toFixed(2)} EUR</span>
                      </div>
                    </div>

                    <div className="text-center pt-2 border-t border-dashed space-y-1">
                      <div className="text-[9px] text-slate-400">TSE / Fiskal-Signatur QR</div>
                      <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: svgBarcode }} />
                      <div className="text-[9px] text-slate-500">{barcodeVal}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-3.5 rounded-lg overflow-x-auto max-h-56 leading-relaxed">
                  <div className="text-slate-400 text-[10px] mb-1.5 border-b border-slate-800 pb-1">
                    ESC/POS Steuersequenz (Hexadecimal Stream Dump):
                  </div>
                  <div>{hexPreview} ...</div>
                  <div className="text-slate-400 text-[10px] mt-2 border-t border-slate-800 pt-1">
                    Gesamtgröße: {rawBytes.length} Bytes • ESC @, ESC t, GS !, ESC a, GS ( k, GS V
                  </div>
                </div>
              )}

              {/* Status Alert */}
              {printStatus && (
                <div
                  className={`p-3 rounded-lg border flex items-center gap-2 text-xs font-semibold ${
                    printStatus.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {printStatus.success ? <Check size={16} /> : <AlertCircle size={16} />}
                  <span>{printStatus.message}</span>
                </div>
              )}
            </div>
          ) : (
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
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex justify-between items-center shrink-0">
          <div className="text-[11px] text-slate-500">
            {connectionType === 'webusb' && 'Verbindung: WebUSB (Direkt)'}
            {connectionType === 'webserial' && 'Verbindung: Web Serial (COM-Port)'}
            {connectionType === 'webbluetooth' && 'Verbindung: Web Bluetooth BLE'}
            {connectionType === 'network_raw' && `Netzwerk: ${networkHost}:${networkPort}`}
            {connectionType === 'browser_direct' && 'Verbindung: nativer Druckdialog & Binary Spool'}
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="px-3.5 py-1.5 rounded border border-slate-300 bg-white font-medium">
              Schließen
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Printer size={14} />
              <span>{isPrinting ? 'Wird gesendet...' : 'ESC/POS Druck starten'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
