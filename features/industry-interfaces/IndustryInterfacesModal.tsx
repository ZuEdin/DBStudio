import React, { useState } from 'react';
import { 
  FileCode, Download, CheckCircle2, AlertCircle, 
  Layers, Package, FileText, X, ArrowRight, Table as TableIcon,
  ShieldCheck, Calculator, Building2
} from 'lucide-react';
import { 
  GaebParser, 
  GaebProjectDoc, 
  GaebValidationPanel, 
  GaebExportModal 
} from './gaeb';
import { 
  DatanormReader, 
  DatanormArticle, 
  DatanormMatrixPanel 
} from './datanorm';
import { 
  ZugferdBuilder, 
  ZugferdInvoiceData, 
  ZugferdProfile,
  ZugferdValidationPanel 
} from './zugferd';

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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // DATANORM State
  const [datanormText, setDatanormText] = useState('');
  const [parsedArticles, setParsedArticles] = useState<DatanormArticle[]>([]);
  
  // ZUGFeRD State
  const [selectedProfile, setSelectedProfile] = useState<ZugferdProfile>('COMFORT');
  const [invoiceData, setInvoiceData] = useState<ZugferdInvoiceData>({
    invoiceNumber: 'RE-2026-0042',
    typeCode: '380',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    currency: 'EUR',
    isReverseCharge13b: true,
    reverseChargeNote: 'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG (Reverse Charge).',
    securityRetentionPercent: 5,
    securityRetentionAmount: 2250,
    prepaidAmount: 0,
    seller: {
      name: 'Bauunternehmung Müller GmbH',
      street: 'Industriestraße 12',
      zipCode: '80339',
      city: 'München',
      country: 'DE',
      vatId: 'DE123456789',
      iban: 'DE44500105175407324911',
      bic: 'INGDDEFFXXX',
    },
    buyer: {
      name: 'Stadtverwaltung Hochbauamt',
      street: 'Rathausplatz 1',
      zipCode: '80331',
      city: 'München',
      country: 'DE',
      vatId: 'DE987654321',
      buyerReference: '04011000-12345-67',
      orderReference: 'PO-2026-891',
    },
    lineItems: [
      {
        name: 'Baustelleneinrichtung & Bauleitung',
        quantity: 1,
        unit: 'Psch',
        unitPrice: 15000,
        vatRate: 0,
        vatCategoryCode: 'AE',
        totalAmount: 15000,
      },
      {
        name: 'Stahlbetonarbeiten & Rohbau Sohle',
        quantity: 240,
        unit: 'm²',
        unitPrice: 125,
        vatRate: 0,
        vatCategoryCode: 'AE',
        totalAmount: 30000,
      },
    ],
    totalNet: 45000,
    totalVat: 0,
    totalGross: 45000,
    payableAmount: 42750,
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

  const handleParseDatanorm = () => {
    try {
      const pkg = DatanormReader.parseFullPackage(datanormText);
      setParsedArticles(pkg.articles);
    } catch {
      alert('Fehler beim Einlesen der DATANORM-Datei');
    }
  };

  const handleGenerateZugferd = () => {
    const xml = ZugferdBuilder.buildFacturXXml(invoiceData, selectedProfile);
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

  const handleToggleReverseCharge = (active: boolean) => {
    const updated = { ...invoiceData, isReverseCharge13b: active };
    if (active) {
      updated.totalVat = 0;
      updated.totalGross = updated.totalNet;
      updated.reverseChargeNote = 'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG (Reverse Charge).';
      updated.lineItems = updated.lineItems.map((it) => ({ ...it, vatRate: 0, vatCategoryCode: 'AE' }));
    } else {
      updated.totalVat = Math.round(updated.totalNet * 0.19 * 100) / 100;
      updated.totalGross = Math.round((updated.totalNet + updated.totalVat) * 100) / 100;
      updated.reverseChargeNote = undefined;
      updated.lineItems = updated.lineItems.map((it) => ({ ...it, vatRate: 19, vatCategoryCode: 'S' }));
    }
    const ret = updated.securityRetentionPercent ? (updated.totalGross * updated.securityRetentionPercent) / 100 : 0;
    updated.payableAmount = Math.round((updated.totalGross - ret) * 100) / 100;
    setInvoiceData(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl max-w-5xl w-full flex flex-col h-[90vh] overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Branchen-Schnittstellen (GAEB XML 3.3, DATANORM 5.0, ZUGFeRD 2.2)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                X83/X84 Re-Export, 10-stufige Rabattstaffel-Matrix, §13b UStG Reverse-Charge &amp; B2G Leitweg-ID
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
            <span>GAEB XML 3.3 (X83 / X84)</span>
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
            <span>DATANORM 5.0 &amp; Rabattstaffel-Matrix</span>
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
            <span>ZUGFeRD 2.2 / XRechnung (§13b UStG)</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 text-xs">
          {/* TAB 1: GAEB XML 3.3 */}
          {activeTab === 'gaeb' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold block mb-1">GAEB-Dateiinhalt (XML DA XML 3.3 oder GAEB 90 Text):</label>
                  <textarea
                    value={gaebText}
                    onChange={(e) => setGaebText(e.target.value)}
                    placeholder="<GAEB xmlns=...> oder GAEB 90 Text..."
                    rows={8}
                    className="w-full p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-[11px]"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleParseGaeb}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow"
                    >
                      GAEB Analysieren
                    </button>
                    <button
                      onClick={() => {
                        const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<GAEB xmlns="http://www.gaeb.de/GAEB_DA_XML/DA_XML_33">
  <GAEBInfo>
    <Version>3.3</Version>
    <Date>2026-08-31</Date>
    <ProgName>DB Studio Pro</ProgName>
  </GAEBInfo>
  <Award>
    <DP>83</DP>
    <Project Name="Schulzentrum Nord Sanierung" No="PRJ-2026-088">
      <BoQ ID="BOQ_MAIN">
        <BoQBody>
          <BoQCtgy ID="sec_1" RNoPart="01">
            <LblBoQCtgy>01</LblBoQCtgy>
            <OutlnText><TextOutlTxt><span>Rohbau &amp; Mauerwerk</span></TextOutlTxt></OutlnText>
            <BoQBody>
              <Itemlist>
                <Item ID="pos_1" RNoPart="0010">
                  <OZ>01.01.0010</OZ>
                  <OutlnText><TextOutlTxt><span>Baustelleneinrichtung vorhalten</span></TextOutlTxt></OutlnText>
                  <Qty>1</Qty>
                  <QU>Psch</QU>
                  <UP>3500.00</UP>
                </Item>
                <Item ID="pos_2" RNoPart="0020">
                  <OZ>01.01.0020</OZ>
                  <OutlnText><TextOutlTxt><span>Stahlbetonsohle d=25cm liefern &amp; einbauen</span></TextOutlTxt></OutlnText>
                  <Qty>240</Qty>
                  <QU>m²</QU>
                  <UP>85.50</UP>
                </Item>
              </Itemlist>
            </BoQBody>
          </BoQCtgy>
        </BoQBody>
      </BoQ>
    </Project>
  </Award>
</GAEB>`;
                        setGaebText(sampleXml);
                        setParsedGaeb(GaebParser.parse(sampleXml));
                      }}
                      className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded font-semibold text-xs"
                    >
                      Beispiel-GAEB laden
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded p-3 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                  <div className="font-bold text-slate-700 dark:text-slate-200">LV-Status &amp; Re-Export</div>
                  {parsedGaeb ? (
                    <div className="space-y-2">
                      <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                        <div>Projekt: <span className="font-bold">{parsedGaeb.projectName}</span></div>
                        <div>Nummer: <span className="font-mono">{parsedGaeb.projectNumber}</span> | Phase: X{parsedGaeb.phase}</div>
                        <div>Positionen: {parsedGaeb.sections.reduce((acc, s) => acc + s.positions.length, 0)}</div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setIsExportModalOpen(true)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold flex items-center gap-1.5 shadow"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>GAEB XML 3.3 Re-Export (X83 / X84)</span>
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

              {parsedGaeb && (
                <GaebValidationPanel
                  doc={parsedGaeb}
                  onDocUpdated={(updated) => setParsedGaeb(updated)}
                />
              )}
            </div>
          )}

          {/* TAB 2: DATANORM 5.0 */}
          {activeTab === 'datanorm' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold block mb-1">DATANORM.001 / DATPREIS / RAB Textzeilen:</label>
                  <textarea
                    value={datanormText}
                    onChange={(e) => setDatanormText(e.target.value)}
                    placeholder="A;01;ART-10023;Kupferrohr 15mm;12.50;m;01;WG-01&#10;RAB;01;Sanitär Standard;30;5;2.5;0;0;0;0;0;0;0"
                    rows={4}
                    className="w-full p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-[11px]"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleParseDatanorm}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow"
                    >
                      DATANORM Einlesen
                    </button>
                    <button
                      onClick={() => {
                        const sampleDatanorm = `A;01;ART-CU-15;Kupferrohr 15x1mm blank;24.50;m;01;WG-01
A;01;ART-CU-22;Kupferrohr 22x1mm blank;38.90;m;01;WG-01
A;01;ART-HZ-01;Kompaktheizkörper Typ 22 600x1000;185.00;Stk;02;WG-02
A;01;ART-ST-10;Bewehrungsstahl B500B d=12mm;42.00;m;04;WG-04
RAB;01;Sanitär & Rohre;30;5;2.5;0;0;0;0;0;0;0
RAB;02;Heizung & Kessel;25;4;3;1.5;0;0;0;0;0;0`;
                        setDatanormText(sampleDatanorm);
                        const pkg = DatanormReader.parseFullPackage(sampleDatanorm);
                        setParsedArticles(pkg.articles);
                      }}
                      className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded font-semibold text-xs"
                    >
                      Beispiel-Katalog laden
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  <div className="font-bold mb-1 text-slate-700 dark:text-slate-200">DATANORM 5.0 Katalogstatus</div>
                  <div className="text-slate-600 dark:text-slate-400">
                    Geladene Artikel: <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{parsedArticles.length}</span>
                  </div>
                </div>
              </div>

              {parsedArticles.length > 0 && (
                <DatanormMatrixPanel
                  articles={parsedArticles}
                  onImportToTable={onImportToTable}
                />
              )}
            </div>
          )}

          {/* TAB 3: ZUGFeRD 2.2 / XRechnung */}
          {activeTab === 'zugferd' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Rechnungsnummer:</label>
                  <input
                    type="text"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                    className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">B2G Leitweg-ID (Behörde):</label>
                  <input
                    type="text"
                    value={invoiceData.buyer.buyerReference || ''}
                    onChange={(e) =>
                      setInvoiceData({
                        ...invoiceData,
                        buyer: { ...invoiceData.buyer, buyerReference: e.target.value },
                      })
                    }
                    className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-emerald-600 dark:text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Profil:</label>
                  <select
                    value={selectedProfile}
                    onChange={(e) => setSelectedProfile(e.target.value as ZugferdProfile)}
                    className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="COMFORT">ZUGFeRD 2.2 COMFORT</option>
                    <option value="EXTENDED">ZUGFeRD 2.2 EXTENDED</option>
                    <option value="XRECHNUNG">XRechnung 2.2 (B2G Mandat)</option>
                  </select>
                </div>
              </div>

              {/* Bauleistung Quick Bar */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={invoiceData.isReverseCharge13b}
                    onChange={(e) => handleToggleReverseCharge(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>§ 13b UStG Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge)</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Sicherheitseinbehalt:</span>
                  <span className="font-mono font-bold text-amber-600">{invoiceData.securityRetentionPercent || 0}% ({invoiceData.securityRetentionAmount || 0} €)</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleGenerateZugferd}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Factur-X / {selectedProfile} XML generieren</span>
                </button>
              </div>

              <ZugferdValidationPanel
                invoiceData={invoiceData}
                profile={selectedProfile}
                onInvoiceUpdated={(updated) => setInvoiceData(updated)}
              />

              {zugferdXml && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-700 dark:text-slate-200">Generiertes Factur-X / CII XML:</div>
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

      {/* GAEB Export Modal */}
      {parsedGaeb && isExportModalOpen && (
        <GaebExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          doc={parsedGaeb}
        />
      )}
    </div>
  );
};
