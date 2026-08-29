import React from 'react';
import { ZugferdConfig, StationeryBackgroundConfig } from '../../../types';
import { FileCode, Image as ImageIcon, Shield, Download } from 'lucide-react';
import { downloadZugferdXml } from '../utils/zugferdGenerator';

interface AdvancedReportFeaturesPanelProps {
  zugferdConfig?: ZugferdConfig;
  stationeryConfig?: StationeryBackgroundConfig;
  onChangeZugferd: (config: ZugferdConfig) => void;
  onChangeStationery: (config: StationeryBackgroundConfig) => void;
}

export const AdvancedReportFeaturesPanel: React.FC<AdvancedReportFeaturesPanelProps> = ({
  zugferdConfig,
  stationeryConfig,
  onChangeZugferd,
  onChangeStationery,
}) => {
  const zugferd: ZugferdConfig = zugferdConfig || {
    enabled: false,
    profile: 'EN16931',
    invoiceNumber: 'RE-2026-0042',
    sellerName: 'Musterbau Enterprise GmbH',
    sellerVatId: 'DE302918273',
    buyerName: 'Bauherr AG',
    buyerVatId: 'DE819203948',
    buyerReference: '04011000-12345-67',
    currency: 'EUR',
    pdfCompliance: 'PDF/A-3b',
  };

  const stationery: StationeryBackgroundConfig = stationeryConfig || {
    enabled: false,
    opacity: 0.9,
    fitMode: 'fitPage',
    page1OverlayUrl: '',
    page2OverlayUrl: '',
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'page1' | 'page2') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target?.result as string;
      if (target === 'page1') {
        onChangeStationery({ ...stationery, page1OverlayUrl: dataUrl });
      } else {
        onChangeStationery({ ...stationery, page2OverlayUrl: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* 1. E-RECHNUNG (ZUGFeRD 2.2 / XRechnung / Factur-X) */}
      <div className="p-3.5 border border-slate-200 rounded bg-white space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <FileCode size={16} className="text-emerald-600" />
            <span>E-Rechnung (ZUGFeRD 2.2 / Factur-X)</span>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
            <input
              type="checkbox"
              checked={zugferd.enabled}
              onChange={(e) => onChangeZugferd({ ...zugferd, enabled: e.target.checked })}
              className="rounded text-emerald-600"
            />
            <span>Aktivieren</span>
          </label>
        </div>

        {zugferd.enabled && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-bold">Profil / Standard</label>
                <select
                  value={zugferd.profile}
                  onChange={(e) => onChangeZugferd({ ...zugferd, profile: e.target.value as any })}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white font-medium"
                >
                  <option value="EN16931">EN16931 (EU B2B Standard)</option>
                  <option value="XRECHNUNG">XRechnung (DE Public Sector)</option>
                  <option value="BASIC">BASIC (Kompakt)</option>
                  <option value="EXTENDED">EXTENDED (Vollständig)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold">PDF/A Konformität</label>
                <select
                  value={zugferd.pdfCompliance}
                  onChange={(e) => onChangeZugferd({ ...zugferd, pdfCompliance: e.target.value as any })}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white font-medium"
                >
                  <option value="PDF/A-3b">PDF/A-3b (ISO 19005-3)</option>
                  <option value="PDF/A-1b">PDF/A-1b (Archiv)</option>
                  <option value="STANDARD">Standard PDF</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500">Rechnungsnummer</label>
                <input
                  type="text"
                  value={zugferd.invoiceNumber}
                  onChange={(e) => onChangeZugferd({ ...zugferd, invoiceNumber: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Leitweg-ID / Buyer Reference</label>
                <input
                  type="text"
                  value={zugferd.buyerReference || ''}
                  onChange={(e) => onChangeZugferd({ ...zugferd, buyerReference: e.target.value })}
                  placeholder="z.B. 04011000-12345-67"
                  className="w-full px-2 py-1 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500">Verkäufer Name & USt-IdNr.</label>
                <input
                  type="text"
                  value={zugferd.sellerName}
                  onChange={(e) => onChangeZugferd({ ...zugferd, sellerName: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded mb-1"
                />
                <input
                  type="text"
                  value={zugferd.sellerVatId}
                  onChange={(e) => onChangeZugferd({ ...zugferd, sellerVatId: e.target.value })}
                  placeholder="USt-IdNr."
                  className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Käufer Name & USt-IdNr.</label>
                <input
                  type="text"
                  value={zugferd.buyerName}
                  onChange={(e) => onChangeZugferd({ ...zugferd, buyerName: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded mb-1"
                />
                <input
                  type="text"
                  value={zugferd.buyerVatId || ''}
                  onChange={(e) => onChangeZugferd({ ...zugferd, buyerVatId: e.target.value })}
                  placeholder="Käufer USt-IdNr."
                  className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => downloadZugferdXml(zugferd, 10000, 1900, 11900)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold flex items-center gap-1 text-[11px]"
              >
                <Download size={13} /> factur-x.xml herunterladen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. BACKGROUND PDF / STATIONERY OVERLAY */}
      <div className="p-3.5 border border-slate-200 rounded bg-white space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <ImageIcon size={16} className="text-blue-600" />
            <span>Hintergrund-Briefpapier (Stationery Overlay)</span>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
            <input
              type="checkbox"
              checked={stationery.enabled}
              onChange={(e) => onChangeStationery({ ...stationery, enabled: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Aktivieren</span>
          </label>
        </div>

        {stationery.enabled && (
          <div className="space-y-3 pt-1">
            <p className="text-[11px] text-slate-500">
              Legen Sie ein druckfähiges Firmen-Briefpapier (SVG / PNG / JPG) als Hintergrund unter das Dokument.
            </p>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Briefpapier Seite 1 (Vorderseite / Erstseite):
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'page1')}
                  className="text-[11px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700"
                />
                {stationery.page1OverlayUrl && (
                  <span className="text-emerald-600 text-[10px] font-bold">✓ Geladen</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Briefpapier Folgeseiten (Seite 2+):
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'page2')}
                  className="text-[11px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700"
                />
                {stationery.page2OverlayUrl && (
                  <span className="text-emerald-600 text-[10px] font-bold">✓ Geladen</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <label className="text-slate-600 font-medium">Deckkraft (Transparenz):</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={stationery.opacity}
                  onChange={(e) => onChangeStationery({ ...stationery, opacity: parseFloat(e.target.value) })}
                  className="w-28"
                />
                <span className="font-mono font-bold text-slate-800">{Math.round(stationery.opacity * 100)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
