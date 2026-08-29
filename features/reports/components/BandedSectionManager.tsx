import React from 'react';
import { Layers, CheckSquare, FileText, ArrowDown, ArrowUp, Edit3 } from 'lucide-react';
import { BandSectionConfig } from '../../../types';

interface BandedSectionManagerProps {
  config?: BandSectionConfig;
  onChange: (config: BandSectionConfig) => void;
}

export const BandedSectionManager: React.FC<BandedSectionManagerProps> = ({ config, onChange }) => {
  const current: BandSectionConfig = config || {
    reportHeader: { visible: true, coverPage: false },
    pageHeader: { visible: true, repeatLogo: true },
    detailBand: { keepTogether: true, alternateZebra: true },
    pageFooter: { visible: true, showPageNumbers: true, printDate: true },
    reportFooter: { visible: true, showGrandTotal: true, signatureBox: true },
  };

  const updateSection = (
    section: keyof BandSectionConfig,
    key: string,
    val: any
  ) => {
    onChange({
      ...current,
      [section]: {
        ...current[section],
        [key]: val,
      },
    });
  };

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-indigo-950 flex items-start gap-2">
        <Layers className="text-indigo-600 shrink-0 mt-0.5" size={16} />
        <div>
          <div className="font-semibold">Banded Reporting Architektur</div>
          <div className="text-[11px] text-indigo-800">
            Hier konfigurieren Sie die einzelnen Drucksektionen (Berichtskopf, Seitenkopf, Detailzeilen, Fußzeilen) gemäß VOB- und Enterprise-Standards.
          </div>
        </div>
      </div>

      {/* 1. Report Header */}
      <div className="p-3 border border-slate-200 rounded bg-white space-y-2">
        <div className="flex justify-between items-center">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            1. Berichtskopf (Report Header)
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
            <input
              type="checkbox"
              checked={current.reportHeader?.visible ?? true}
              onChange={(e) => updateSection('reportHeader', 'visible', e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Aktiv</span>
          </label>
        </div>
        <div className="text-[11px] text-slate-500">
          Wird genau <strong>einmal</strong> ganz am Dokumentanfang gedruckt (z. B. Briefkopf, DIN 5008 Adressfeld).
        </div>
        <div className="flex gap-4 pt-1">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={current.reportHeader?.coverPage ?? false}
              onChange={(e) => updateSection('reportHeader', 'coverPage', e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Als separates Deckblatt ausgeben</span>
          </label>
        </div>
      </div>

      {/* 2. Page Header */}
      <div className="p-3 border border-slate-200 rounded bg-white space-y-2">
        <div className="flex justify-between items-center">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            2. Seitenkopf (Page Header)
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
            <input
              type="checkbox"
              checked={current.pageHeader?.visible ?? true}
              onChange={(e) => updateSection('pageHeader', 'visible', e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Aktiv</span>
          </label>
        </div>
        <div className="text-[11px] text-slate-500">
          Erscheint oben auf <strong>jeder Folgeseite</strong> (Spaltenüberschriften, Projektkürzel, Minilogo).
        </div>
        <div className="flex gap-4 pt-1">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={current.pageHeader?.repeatLogo ?? true}
              onChange={(e) => updateSection('pageHeader', 'repeatLogo', e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Firmenlogo auf Folgeseiten wiederholen</span>
          </label>
        </div>
      </div>

      {/* 3. Detail Band */}
      <div className="p-3 border border-slate-200 rounded bg-white space-y-2">
        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          3. Detail-Bereich (Detail Band)
        </div>
        <div className="text-[11px] text-slate-500">
          Wird für <strong>jeden einzelnen Datensatz</strong> (LV-Position, Rechnungszeile) gerendert.
        </div>
        <div className="flex flex-col gap-1.5 pt-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={current.detailBand?.keepTogether ?? true}
              onChange={(e) => updateSection('detailBand', 'keepTogether', e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Zeile nicht trennen (KeepTogether / Schutz vor Seitenumbruch mitten im Text)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={current.detailBand?.alternateZebra ?? true}
              onChange={(e) => updateSection('detailBand', 'alternateZebra', e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Zebra-Streifen für verbesserte Lesbarkeit</span>
          </label>
        </div>
      </div>

      {/* 4. Page Footer */}
      <div className="p-3 border border-slate-200 rounded bg-white space-y-2">
        <div className="flex justify-between items-center">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            4. Seitenfuß (Page Footer)
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
            <input
              type="checkbox"
              checked={current.pageFooter?.visible ?? true}
              onChange={(e) => updateSection('pageFooter', 'visible', e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Aktiv</span>
          </label>
        </div>
        <div className="text-[11px] text-slate-500">
          Wird am unteren Rand <strong>jeder Einzelseite</strong> gedruckt.
        </div>
        <div className="flex gap-4 pt-1">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={current.pageFooter?.showPageNumbers ?? true}
              onChange={(e) => updateSection('pageFooter', 'showPageNumbers', e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Paginierung ("Seite X von Y")</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={current.pageFooter?.printDate ?? true}
              onChange={(e) => updateSection('pageFooter', 'printDate', e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Druckdatum / Zeitstempel</span>
          </label>
        </div>
      </div>

      {/* 5. Report Footer */}
      <div className="p-3 border border-slate-200 rounded bg-white space-y-2">
        <div className="flex justify-between items-center">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            5. Berichtsfuß (Report Footer)
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
            <input
              type="checkbox"
              checked={current.reportFooter?.visible ?? true}
              onChange={(e) => updateSection('reportFooter', 'visible', e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Aktiv</span>
          </label>
        </div>
        <div className="text-[11px] text-slate-500">
          Wird genau <strong>einmal am Dokumentende</strong> gedruckt (Gesamtsummen, VOB-Matrix, Unterschriften, DIN 5008 3-Spalten-Fuß).
        </div>
        <div className="flex flex-col gap-1.5 pt-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={current.reportFooter?.showGrandTotal ?? true}
              onChange={(e) => updateSection('reportFooter', 'showGrandTotal', e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Kaufmännische Gesamtsummenzeile anzeigen</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={current.reportFooter?.signatureBox ?? true}
              onChange={(e) => updateSection('reportFooter', 'signatureBox', e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Unterschriftenfelder für Bauleitung & Auftraggeber</span>
          </label>
        </div>
      </div>
    </div>
  );
};
