import React, { useState } from 'react';
import { 
  FileCode, Upload, Download, CheckCircle2, AlertCircle, 
  Layers, Package, FileText, X, ArrowRight, Table as TableIcon 
} from 'lucide-react';
import { GaebParser } from './gaeb/gaebParser';
import { GaebProjectDoc } from './gaeb/gaebTypes';
import { DatanormReader } from './datanorm/datanormReader';
import { DatanormArticle } from './datanorm/datanormTypes';
import { ZugferdBuilder } from './zugferd/zugferdBuilder';
import { ZugferdInvoiceData } from './zugferd/zugferdTypes';

interface IndustryInterfacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportToTable?: (tableName: string, rows: any[]) => void;
}

export const IndustryInterfacesModal: React.FC<IndustryInterfacesModalProps> = ({
  isOpen,
  onClose,
  onImportToTable,
}) => {
  const [activeTab, setActiveTab] = useState<'gaeb' | 'datanorm' | 'zugferd'>('gaeb');
  
  // GAEB State
  const [gaebText, setGaebText] = useState('');
  const [parsedGaeb, setParsedGaeb] = useState<GaebProjectDoc | null>(null);
  
  // DATANORM State
  const [datanormText, setDatanormText] = useState('');
  const [parsedArticles, setParsedArticles] = useState<DatanormArticle[]>([]);
  
  // ZUGFeRD State
  const [invoiceData, setInvoiceData] = useState<ZugferdInvoiceData>({
    invoiceNumber: 'RE-2026-0042',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    sellerName: 'Bauunternehmung Müller GmbH',
    buyerName: 'Stadtverwaltung Hochbauamt',
    totalNet: 45000,
    totalTax: 8550,
    totalGross: 53550,
    currency: 'EUR',
    iban: 'DE44500105175407324911',
    bic: 'INGDDEFFXXX',
    leitwegId: '04011000-12345-67',
  });
  const [zugferdXml, setZugferdXml] = useState('');

  if (!isOpen) return null;

  const handleParseGaeb = () => {
    try {
      const doc = GaebParser.parse(gaebText);
      setParsedGaeb(doc);
    } catch {
      alert('Fehler beim Parsen der GAEB-Daten');
    }
  };

  const handleExportX84 = () => {
    if (!parsedGaeb) return;
    const xml = GaebParser.generateX84Xml(parsedGaeb);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${parsedGaeb.projectNumber || 'angebot'}.X84`;
    link.click();
  };

  const handleParseDatanorm = () => {
    try {
      const articles = DatanormReader.parseFileContent(datanormText);
      setParsedArticles(articles);
    } catch {
      alert('Fehler beim Einlesen der DATANORM-Datei');
    }
  };

  const handleGenerateZugferd = () => {
    const xml = ZugferdBuilder.buildFacturXXml(invoiceData, 'COMFORT');
    setZugferdXml(xml);
  };

  const handleImportGaebToTable = () => {
    if (!parsedGaeb || !onImportToTable) return;
    const flatRows: any[] = [];
    parsedGaeb.sections.forEach((sec) => {
      sec.positions.forEach((pos) => {
        flatRows.push({
          oz: pos.oz,
          titel: sec.title,
          kurztext: pos.shortText,
          menge: pos.quantity,
          einheit: pos.unit,
          einzelpreis: pos.unitPrice || 0,
          gesamtpreis: pos.totalPrice || 0,
          lohnanteil: pos.costLabor || 0,
          stoffanteil: pos.costMaterial || 0,
        });
      });
    });
    onImportToTable('tbl_leistungsverzeichnis', flatRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full flex flex-col h-[85vh] overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Branchen-Schnittstellen (GAEB, DATANORM, ZUGFeRD)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modularer Datenaustausch für Ausschreibungen, Großhandelskataloge und E-Rechnungen
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('gaeb')}
            className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'gaeb'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>GAEB XML &amp; 90 (X83 / X84 / D83)</span>
          </button>
          <button
            onClick={() => setActiveTab('datanorm')}
            className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'datanorm'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>DATANORM 4.0 / 5.0 Kataloge</span>
          </button>
          <button
            onClick={() => setActiveTab('zugferd')}
            className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'zugferd'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>E-Rechnung (ZUGFeRD 2.2 / XRechnung)</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 text-xs">
          {activeTab === 'gaeb' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold block mb-1">GAEB-Dateiinhalt (XML oder GAEB 90 Text einfügen):</label>
                  <textarea
                    value={gaebText}
                    onChange={(e) => setGaebText(e.target.value)}
                    placeholder="<GAEB xmlns=...> oder 25... GAEB 90 Zeilen"
                    rows={12}
                    className="w-full p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-[11px]"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleParseGaeb}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow"
                    >
                      GAEB Analysieren
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded p-3 bg-slate-50 dark:bg-slate-800/40">
                  <div className="font-bold mb-2 text-slate-700 dark:text-slate-200">LV-Vorschau &amp; Kennzahlen</div>
                  {parsedGaeb ? (
                    <div className="space-y-2">
                      <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                        <div>Projekt: <span className="font-bold">{parsedGaeb.projectName}</span></div>
                        <div>Nummer: <span className="font-mono">{parsedGaeb.projectNumber}</span> | Phase: X{parsedGaeb.phase}</div>
                        <div>Bereiche: {parsedGaeb.sections.length} | Positionen:{' '}
                          {parsedGaeb.sections.reduce((acc, s) => acc + s.positions.length, 0)}
                        </div>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {parsedGaeb.sections.map((s) => (
                          <div key={s.id} className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-[11px]">
                            <div className="font-bold">{s.oz} – {s.title}</div>
                            <div className="text-slate-500">{s.positions.length} Positionen</div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleExportX84}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Als X84 Exportieren</span>
                        </button>
                        {onImportToTable && (
                          <button
                            onClick={handleImportGaebToTable}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded font-bold flex items-center gap-1"
                          >
                            <TableIcon className="w-3.5 h-3.5" />
                            <span>In Tabelle laden</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 italic">Noch keine GAEB-Datei eingelesen.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'datanorm' && (
            <div className="space-y-4">
              <label className="font-bold block mb-1">DATANORM.001 / DATPREIS Textzeilen einfügen:</label>
              <textarea
                value={datanormText}
                onChange={(e) => setDatanormText(e.target.value)}
                placeholder="A;01;ART-10023;Kupferrohr 15mm;12.50;m"
                rows={6}
                className="w-full p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-[11px]"
              />
              <button
                onClick={handleParseDatanorm}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow"
              >
                DATANORM Einlesen
              </button>

              {parsedArticles.length > 0 && (
                <div className="p-3 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <div className="font-bold mb-2">Erkannte Artikel ({parsedArticles.length})</div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {parsedArticles.map((a, i) => (
                      <div key={i} className="p-1.5 rounded border border-slate-200 dark:border-slate-700 flex justify-between font-mono">
                        <span>{a.articleNumber}: {a.text1}</span>
                        <span>{a.priceGross.toFixed(2)} € / {a.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'zugferd' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Rechnungsnummer:</label>
                  <input
                    type="text"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                    className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Leitweg-ID (Behörde):</label>
                  <input
                    type="text"
                    value={invoiceData.leitwegId || ''}
                    onChange={(e) => setInvoiceData({ ...invoiceData, leitwegId: e.target.value })}
                    className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Bruttobetrag (€):</label>
                  <input
                    type="number"
                    value={invoiceData.totalGross}
                    onChange={(e) => setInvoiceData({ ...invoiceData, totalGross: parseFloat(e.target.value) || 0 })}
                    className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateZugferd}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow"
              >
                ZUGFeRD 2.2 Factur-X XML generieren
              </button>

              {zugferdXml && (
                <div className="space-y-2">
                  <div className="font-bold">Generiertes Factur-X / ZUGFeRD XML:</div>
                  <pre className="p-3 rounded bg-slate-950 text-emerald-400 font-mono text-[10px] max-h-48 overflow-y-auto">
                    {zugferdXml}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
