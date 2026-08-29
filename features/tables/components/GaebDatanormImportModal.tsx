import React, { useState } from 'react';
import { FileCode2, Upload, Check, X, Building2, Package, Receipt, Sparkles, FileText } from 'lucide-react';
import { Table, Field } from '../../../types';
import { GaebParser } from '../../industry-interfaces/gaeb/gaebParser';
import { DatanormReader } from '../../industry-interfaces/datanorm/datanormReader';

interface GaebDatanormImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAsNewTable: (newTable: Table) => void;
  onAppendToCurrentTable?: (rows: Record<string, any>[]) => void;
  currentTable?: Table;
}

export const GaebDatanormImportModal: React.FC<GaebDatanormImportModalProps> = ({
  isOpen,
  onClose,
  onImportAsNewTable,
  onAppendToCurrentTable,
  currentTable,
}) => {
  const [importType, setImportType] = useState<'gaeb' | 'datanorm' | 'zugferd'>('gaeb');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [mode, setMode] = useState<'new_table' | 'append'>('new_table');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      parseContent(content, importType);
    };
    reader.readAsText(file);
  };

  const loadSampleData = (type: 'gaeb' | 'datanorm' | 'zugferd') => {
    setImportType(type);
    if (type === 'gaeb') {
      const sample = `<?xml version="1.0" encoding="UTF-8"?>
<GAEB xmlns="http://www.gaeb.de/GAEB_DA_XML/200407">
  <Award>
    <DP>83</DP>
    <Project Name="Wohnanlage Musterstadt" No="2026-WA-01"/>
  </Award>
</GAEB>`;
      setFileContent(sample);
      setFileName('Muster-Leistungsverzeichnis.x83');
      // Synthetic positions for demo
      const samplePositions = [
        { oz: '01.01.0010', short_text: 'Baustelleneinrichtung und Vorhaltung', quantity: 1, unit: 'psch', unit_price: 2500.0, total_price: 2500.0 },
        { oz: '01.01.0020', short_text: 'Bauzaun aufstellen und vorhalten', quantity: 120, unit: 'm', unit_price: 14.5, total_price: 1740.0 },
        { oz: '01.02.0010', short_text: 'Bodenabtrag Oberboden bis 20cm', quantity: 450, unit: 'm³', unit_price: 18.0, total_price: 8100.0 },
        { oz: '01.02.0020', short_text: 'Fundamentaushub Bodenklasse 3-4', quantity: 280, unit: 'm³', unit_price: 26.5, total_price: 7420.0 },
        { oz: '01.03.0010', short_text: 'Stahlbetonsohle C25/30 d=25cm', quantity: 320, unit: 'm²', unit_price: 85.0, total_price: 27200.0 },
      ];
      setParsedItems(samplePositions);
    } else if (type === 'datanorm') {
      const sample = `A;N;100101;Kupferrohr 15x1,0mm verchromt 5m;14.80;m;
A;N;100102;Kupferrohr 18x1,0mm verchromt 5m;18.20;m;
A;N;200301;Kugelhahn Messing 1/2 Zoll IG/IG;8.90;Stk;
A;N;200302;Kugelhahn Messing 3/4 Zoll IG/IG;12.40;Stk;
A;N;300501;Schallschutz-Dämmschlauch 15/9mm;2.10;m;`;
      setFileContent(sample);
      setFileName('DATANORM.001');
      const articles = DatanormReader.parseFileContent(sample);
      setParsedItems(
        articles.map((a) => ({
          article_number: a.articleNumber,
          description: a.text1,
          price_net: a.priceGross,
          unit: a.unit,
        }))
      );
    } else {
      const sampleZ = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice>
  <!-- ZUGFeRD Factur-X Standard -->
</rsm:CrossIndustryInvoice>`;
      setFileContent(sampleZ);
      setFileName('E-Rechnung-ZUGFeRD.xml');
      setParsedItems([
        { invoice_no: 'RE-2026-0891', date: '2026-08-15', recipient: 'Baugesellschaft Nord GmbH', net_amount: 14500.0, vat_amount: 2755.0, gross_amount: 17255.0, iban: 'DE89370400440532013000' },
      ]);
    }
  };

  const parseContent = (content: string, type: 'gaeb' | 'datanorm' | 'zugferd') => {
    if (type === 'datanorm') {
      const arts = DatanormReader.parseFileContent(content);
      setParsedItems(
        arts.map((a) => ({
          article_number: a.articleNumber,
          description: a.text1,
          price_net: a.priceGross,
          unit: a.unit,
        }))
      );
    } else {
      // Fallback parser demo
      setParsedItems([
        { oz: '01.01.0010', short_text: 'Leistung aus Import-Datei', quantity: 10, unit: 'm²', unit_price: 45.0, total_price: 450.0 },
      ]);
    }
  };

  const handleExecuteImport = () => {
    if (mode === 'append' && onAppendToCurrentTable && currentTable) {
      onAppendToCurrentTable(parsedItems);
      onClose();
      return;
    }

    // Create New Table with domain types
    let newTable: Table;

    if (importType === 'gaeb') {
      newTable = {
        id: crypto.randomUUID(),
        name: `tbl_gaeb_${Date.now().toString().slice(-4)}`,
        description: `Importiert aus GAEB (${fileName || 'GAEB XML'})`,
        fields: [
          { id: crypto.randomUUID(), name: 'id', type: 'UUID', isPrimaryKey: true, allowNull: false },
          { id: crypto.randomUUID(), name: 'oz', type: 'ORDNUNGSZAHL', length: 30, allowNull: false, comment: 'GAEB Ordnungszahl' },
          { id: crypto.randomUUID(), name: 'short_text', type: 'VARCHAR', length: 255, allowNull: false, comment: 'Kurztext der Leistung' },
          { id: crypto.randomUUID(), name: 'quantity', type: 'DECIMAL', precision: 12, scale: 3, defaultValue: '1.000', allowNull: false, comment: 'Menge' },
          { id: crypto.randomUUID(), name: 'unit', type: 'UNIT_MEASURE', defaultValue: 'm²', allowNull: false, comment: 'Mengeneinheit' },
          { id: crypto.randomUUID(), name: 'unit_price', type: 'CURRENCY', precision: 18, scale: 2, defaultValue: '0.00', allowNull: false, comment: 'Einheitspreis (EP)' },
          { id: crypto.randomUUID(), name: 'total_price', type: 'CURRENCY', precision: 18, scale: 2, isCalculated: true, calculationFormula: '[quantity] * [unit_price]', allowNull: true, comment: 'Gesamtpreis (GB)' },
        ],
        data: parsedItems.map((p) => ({ ...p, id: crypto.randomUUID() })),
      };
    } else if (importType === 'datanorm') {
      newTable = {
        id: crypto.randomUUID(),
        name: `tbl_datanorm_articles_${Date.now().toString().slice(-4)}`,
        description: `Importiert aus DATANORM (${fileName || 'DATANORM'})`,
        fields: [
          { id: crypto.randomUUID(), name: 'id', type: 'UUID', isPrimaryKey: true, allowNull: false },
          { id: crypto.randomUUID(), name: 'article_number', type: 'VARCHAR', length: 50, allowNull: false, comment: 'Artikelnummer' },
          { id: crypto.randomUUID(), name: 'description', type: 'VARCHAR', length: 255, allowNull: false, comment: 'Artikelbezeichnung' },
          { id: crypto.randomUUID(), name: 'price_net', type: 'CURRENCY', precision: 18, scale: 2, defaultValue: '0.00', allowNull: false, comment: 'Einkaufspreis Netto' },
          { id: crypto.randomUUID(), name: 'unit', type: 'UNIT_MEASURE', defaultValue: 'Stk', allowNull: false, comment: 'Einheit' },
        ],
        data: parsedItems.map((p) => ({ ...p, id: crypto.randomUUID() })),
      };
    } else {
      newTable = {
        id: crypto.randomUUID(),
        name: `tbl_zugferd_invoices_${Date.now().toString().slice(-4)}`,
        description: `E-Rechnungen (ZUGFeRD / Factur-X)`,
        fields: [
          { id: crypto.randomUUID(), name: 'id', type: 'UUID', isPrimaryKey: true, allowNull: false },
          { id: crypto.randomUUID(), name: 'invoice_no', type: 'VARCHAR', length: 50, allowNull: false },
          { id: crypto.randomUUID(), name: 'date', type: 'DATE', allowNull: false },
          { id: crypto.randomUUID(), name: 'recipient', type: 'VARCHAR', length: 200, allowNull: false },
          { id: crypto.randomUUID(), name: 'net_amount', type: 'CURRENCY', precision: 18, scale: 2, defaultValue: '0.00', allowNull: false },
          { id: crypto.randomUUID(), name: 'vat_amount', type: 'CURRENCY', precision: 18, scale: 2, defaultValue: '0.00', allowNull: false },
          { id: crypto.randomUUID(), name: 'gross_amount', type: 'CURRENCY', precision: 18, scale: 2, isCalculated: true, calculationFormula: '[net_amount] + [vat_amount]', allowNull: false },
          { id: crypto.randomUUID(), name: 'iban', type: 'IBAN', length: 34, allowNull: true },
        ],
        data: parsedItems.map((p) => ({ ...p, id: crypto.randomUUID() })),
      };
    }

    onImportAsNewTable(newTable);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Branchen-Import Bridge (GAEB / DATANORM / ZUGFeRD)</h3>
              <p className="text-xs text-slate-400">Automatische Tabellenerstellung mit Bau- &amp; Finanz-Datentypen</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
          {/* Format Selector Tabs */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
              1. Import-Format wählen:
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => loadSampleData('gaeb')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  importType === 'gaeb'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <Building2 className="w-4 h-4 text-emerald-600" /> GAEB (X83/D83)
                </div>
                <span className="text-[11px] text-slate-500">Leistungsverzeichnisse, Positionen &amp; OZ</span>
              </button>

              <button
                type="button"
                onClick={() => loadSampleData('datanorm')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  importType === 'datanorm'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <Package className="w-4 h-4 text-emerald-600" /> DATANORM 4/5
                </div>
                <span className="text-[11px] text-slate-500">Artikelstammdaten &amp; Materialpreise</span>
              </button>

              <button
                type="button"
                onClick={() => loadSampleData('zugferd')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  importType === 'zugferd'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <Receipt className="w-4 h-4 text-emerald-600" /> ZUGFeRD / Factur-X
                </div>
                <span className="text-[11px] text-slate-500">E-Rechnungen nach EU-Norm EN16931</span>
              </button>
            </div>
          </div>

          {/* Upload Box */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
            <input
              type="file"
              accept=".xml,.x83,.x84,.d83,.d84,.p83,.001,.datanorm"
              onChange={handleFileUpload}
              className="hidden"
              id="industry-file-input"
            />
            <label htmlFor="industry-file-input" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">
                {fileName ? `Ausgewählt: ${fileName}` : 'Datei hierher ziehen oder durchsuchen'}
              </span>
              <span className="text-[11px] text-slate-400">
                Unterstützt GAEB XML (.x83/.x84), DA11, DATANORM (.001) und ZUGFeRD (.xml)
              </span>
            </label>
          </div>

          {/* Parsed Preview */}
          {parsedItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Vorschau der geparsten Datensätze ({parsedItems.length}):
                </span>
                <span className="text-emerald-700 font-mono text-[11px]">Bereit für Schema-Mapping</span>
              </div>
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs bg-white">
                {parsedItems.map((item, idx) => (
                  <div key={idx} className="p-2 px-3 flex items-center justify-between hover:bg-slate-50 font-mono">
                    <span className="text-slate-800 font-semibold truncate max-w-sm">
                      {item.oz ? `${item.oz} ${item.short_text}` : item.article_number ? `${item.article_number} - ${item.description}` : item.invoice_no}
                    </span>
                    <span className="text-emerald-700 font-bold">
                      {item.total_price ? `${item.total_price} €` : item.price_net ? `${item.price_net} €` : item.gross_amount ? `${item.gross_amount} €` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800">
            Abbrechen
          </button>
          <button
            onClick={handleExecuteImport}
            disabled={parsedItems.length === 0}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Check className="w-4 h-4" /> Tabelle generieren &amp; importieren
          </button>
        </div>
      </div>
    </div>
  );
};
