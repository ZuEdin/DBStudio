import React, { useState } from 'react';
import { X, Layers, Plus, Trash2, Check, ArrowUp, ArrowDown, Settings, Ruler } from 'lucide-react';

export interface ReportBand {
  id: string;
  name: string;
  type: 'REPORT_HEADER' | 'PAGE_HEADER' | 'GROUP_HEADER' | 'DETAIL' | 'GROUP_FOOTER' | 'PAGE_FOOTER' | 'REPORT_FOOTER';
  heightMm: number;
  keepTogether: boolean;
  repeatOnEveryPage: boolean;
  forcePageBreakBefore: boolean;
  forcePageBreakAfter: boolean;
}

interface BandModelEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBands: (bands: ReportBand[]) => void;
}

export const BandModelEditorModal: React.FC<BandModelEditorModalProps> = ({ isOpen, onClose, onSaveBands }) => {
  const [bands, setBands] = useState<ReportBand[]>([
    {
      id: 'b_rep_hdr',
      name: 'Berichtskopf (Report Header)',
      type: 'REPORT_HEADER',
      heightMm: 35,
      keepTogether: true,
      repeatOnEveryPage: false,
      forcePageBreakBefore: false,
      forcePageBreakAfter: false,
    },
    {
      id: 'b_page_hdr',
      name: 'Seitenkopf (Page Header / Folgeseiten)',
      type: 'PAGE_HEADER',
      heightMm: 20,
      keepTogether: true,
      repeatOnEveryPage: true,
      forcePageBreakBefore: false,
      forcePageBreakAfter: false,
    },
    {
      id: 'b_grp_hdr_1',
      name: 'Gruppenkopf 1: Kunde',
      type: 'GROUP_HEADER',
      heightMm: 15,
      keepTogether: true,
      repeatOnEveryPage: true,
      forcePageBreakBefore: false,
      forcePageBreakAfter: false,
    },
    {
      id: 'b_detail',
      name: 'Detailbereich (Positionszeilen)',
      type: 'DETAIL',
      heightMm: 12,
      keepTogether: false,
      repeatOnEveryPage: false,
      forcePageBreakBefore: false,
      forcePageBreakAfter: false,
    },
    {
      id: 'b_grp_ftr_1',
      name: 'Gruppenfuß 1: Kunden-Zwischensumme',
      type: 'GROUP_FOOTER',
      heightMm: 15,
      keepTogether: true,
      repeatOnEveryPage: false,
      forcePageBreakBefore: false,
      forcePageBreakAfter: false,
    },
    {
      id: 'b_page_ftr',
      name: 'Seitenfuß (Übertrag & Seitenzahl)',
      type: 'PAGE_FOOTER',
      heightMm: 18,
      keepTogether: true,
      repeatOnEveryPage: true,
      forcePageBreakBefore: false,
      forcePageBreakAfter: false,
    },
    {
      id: 'b_rep_ftr',
      name: 'Berichtsfuß (Gesamtsumme & Unterschrift)',
      type: 'REPORT_FOOTER',
      heightMm: 30,
      keepTogether: true,
      repeatOnEveryPage: false,
      forcePageBreakBefore: false,
      forcePageBreakAfter: false,
    },
  ]);

  if (!isOpen) return null;

  const moveBand = (index: number, direction: 'UP' | 'DOWN') => {
    const updated = [...bands];
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;

    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setBands(updated);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Layers size={20} className="text-blue-400" />
            <h3 className="font-bold text-base">Hochentwickeltes Bänder-Modell & Seitenumbruch-Manager</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700">
          <div className="flex justify-between items-center bg-blue-50/70 border border-blue-200 p-3 rounded-lg text-blue-900">
            <div className="flex items-center gap-2">
              <Ruler size={16} className="text-blue-600" />
              <span>
                <strong>Millimeter-genaue Bänderstruktur:</strong> Konfigurieren Sie Höhen, Keep-Together Verhalten und Gruppen-Kopfzeilen.
              </span>
            </div>
            <button
              onClick={() =>
                setBands([
                  ...bands,
                  {
                    id: `b_custom_${Date.now()}`,
                    name: `Zusätzliches Gruppenband ${bands.length + 1}`,
                    type: 'GROUP_HEADER',
                    heightMm: 15,
                    keepTogether: true,
                    repeatOnEveryPage: true,
                    forcePageBreakBefore: false,
                    forcePageBreakAfter: false,
                  },
                ])
              }
              className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 flex items-center gap-1 shrink-0"
            >
              <Plus size={13} /> Band hinzufügen
            </button>
          </div>

          <div className="space-y-2">
            {bands.map((band, idx) => (
              <div key={band.id} className="border border-slate-300 rounded-lg p-3.5 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-bold text-slate-800 text-xs">{band.name}</span>
                    <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                      {band.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveBand(idx, 'UP')}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => moveBand(idx, 'DOWN')}
                      disabled={idx === bands.length - 1}
                      className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      onClick={() => setBands(bands.filter((b) => b.id !== band.id))}
                      className="p-1 rounded hover:bg-rose-100 text-rose-600 ml-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 pt-1 border-t border-slate-200 text-[11px]">
                  <div>
                    <label className="block text-slate-500 font-bold mb-0.5">Höhe (mm):</label>
                    <input
                      type="number"
                      value={band.heightMm}
                      onChange={(e) => {
                        const updated = [...bands];
                        updated[idx].heightMm = Number(e.target.value);
                        setBands(updated);
                      }}
                      className="w-full border border-slate-300 rounded px-2 py-1 font-mono bg-white"
                    />
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={band.keepTogether}
                      onChange={(e) => {
                        const updated = [...bands];
                        updated[idx].keepTogether = e.target.checked;
                        setBands(updated);
                      }}
                      className="rounded text-blue-600"
                    />
                    <span>Gruppe zusammenhalten (Keep Together)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={band.repeatOnEveryPage}
                      onChange={(e) => {
                        const updated = [...bands];
                        updated[idx].repeatOnEveryPage = e.target.checked;
                        setBands(updated);
                      }}
                      className="rounded text-blue-600"
                    />
                    <span>Auf jeder Seite wiederholen</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={band.forcePageBreakAfter}
                      onChange={(e) => {
                        const updated = [...bands];
                        updated[idx].forcePageBreakAfter = e.target.checked;
                        setBands(updated);
                      }}
                      className="rounded text-blue-600"
                    />
                    <span>Seitenumbruch danach erzwingen</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-3.5 py-1.5 rounded border border-slate-300 bg-white font-medium">
            Abbrechen
          </button>
          <button
            onClick={() => {
              onSaveBands(bands);
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-2xs"
          >
            <Check size={14} />
            <span>Bänder-Konfiguration speichern</span>
          </button>
        </div>
      </div>
    </div>
  );
};
