import React from 'react';
import { Din5008Config, CommercialVobConfig, EpcQrCodeConfig, SwissQrCodeConfig } from '../../../types';
import { FileText, Building, CreditCard, QrCode, Crosshair } from 'lucide-react';

interface Din5008ConfigPanelProps {
  dinConfig?: Din5008Config;
  vobConfig?: CommercialVobConfig;
  epcConfig?: EpcQrCodeConfig;
  swissQrConfig?: SwissQrCodeConfig;
  onChangeDin: (config: Din5008Config) => void;
  onChangeVob: (config: CommercialVobConfig) => void;
  onChangeEpc: (config: EpcQrCodeConfig) => void;
  onChangeSwissQr?: (config: SwissQrCodeConfig) => void;
}

export const Din5008ConfigPanel: React.FC<Din5008ConfigPanelProps> = ({
  dinConfig,
  vobConfig,
  epcConfig,
  swissQrConfig,
  onChangeDin,
  onChangeVob,
  onChangeEpc,
  onChangeSwissQr,
}) => {
  const din: Din5008Config = dinConfig || {
    enabled: false,
    formType: 'FormB',
    senderLine: 'Musterbau Enterprise GmbH • Baustraße 100 • 10115 Berlin',
    recipientAddress: 'Bauherr GmbH & Co. KG\nz. H. Herrn Max Mustermann\nIndustrieweg 12\n80339 München',
    infoblock: {
      ourRef: 'MB/BL-2026',
      customerNo: 'KD-9042',
      invoiceNo: 'RE-2026-0814',
      projectNo: 'BV-BER-Nord-04',
      servicePeriod: '01.07.2026 - 31.08.2026',
      date: new Date().toLocaleDateString('de-DE'),
    },
    threeColumnFooter: {
      col1Title: 'Firmensitz & Register',
      col1Text: 'Musterbau Enterprise GmbH\nAmtsgericht Charlottenburg HRB 99882\nGeschäftsführer: Dipl.-Ing. H. Weber',
      col2Title: 'Bankverbindung',
      col2Text: 'Deutsche Bau-Kreditbank\nIBAN: DE89 1007 0000 0123 4567 89\nBIC: DEUTDEDDBAU',
      col3Title: 'Steuer & Finanzamt',
      col3Text: 'Steuernummer: 27/123/45678\nUSt-IdNr.: DE 302 918 273\nGläubiger-ID: DE98ZZZ00000123456',
    },
  };

  const vob: CommercialVobConfig = vobConfig || {
    enabled: false,
    enableCarryOver: true,
    vatSplitting: { standard19: 0, reduced7: 0, taxFree13b: 0 },
    deductions: {
      warrantyRetentionPercent: 5,
      constructionInsurancePercent: 1,
      advancePaymentsDeducted: 0,
      skontoPercent: 2,
      skontoDays: 14,
    },
    paymentTermsText: 'Zahlbar rein netto innerhalb von 30 Tagen nach Rechnungserhalt. 2% Skonto bei Zahlung binnen 14 Tagen.',
  };

  const epc: EpcQrCodeConfig = epcConfig || {
    enabled: false,
    recipientName: 'Musterbau Enterprise GmbH',
    iban: 'DE89 1007 0000 0123 4567 89',
    bic: 'DEUTDEDDBAU',
    reference: 'RE-2026-0814',
  };

  const swiss: SwissQrCodeConfig = swissQrConfig || {
    enabled: false,
    iban: 'CH44 3191 0123 4567 8901 2',
    currency: 'CHF',
    referenceType: 'QRR',
    reference: '210000000003139471430009017',
    creditor: {
      name: 'Swiss Construction AG',
      street: 'Bahnhofstrasse',
      houseNo: '42',
      postalCode: '8001',
      city: 'Zürich',
      country: 'CH',
    },
    debtor: {
      name: 'Bauherr Schweiz AG',
      street: 'Industriestrasse 10',
      postalCode: '4000',
      city: 'Basel',
      country: 'CH',
    },
    amount: 14850.0,
    additionalInformation: 'Schlussrechnung Bauvorhaben Zürich Nord',
  };

  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* 1. DIN 5008 Master Toggle */}
      <div className="p-3 border border-slate-200 rounded bg-white space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <FileText size={16} className="text-indigo-600" />
            <span>DIN 5008 Geschäftsbrief-Engine</span>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
            <input
              type="checkbox"
              checked={din.enabled}
              onChange={(e) => onChangeDin({ ...din, enabled: e.target.checked })}
              className="rounded text-indigo-600"
            />
            <span>Aktivieren</span>
          </label>
        </div>

        {din.enabled && (
          <div className="space-y-3 pt-1">
            <div className="flex gap-4 items-center">
              <label className="text-slate-600 font-medium">Briefformat:</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="formType"
                    checked={din.formType === 'FormA'}
                    onChange={() => onChangeDin({ ...din, formType: 'FormA' })}
                  />
                  <span>Form A (27mm Kopfabstand)</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="formType"
                    checked={din.formType === 'FormB'}
                    onChange={() => onChangeDin({ ...din, formType: 'FormB' })}
                  />
                  <span>Form B (45mm Kopfabstand - Standard)</span>
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={din.showFoldingMarks ?? true}
                  onChange={(e) => onChangeDin({ ...din, showFoldingMarks: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <Crosshair size={14} className="text-indigo-600" />
                <span>DIN 5008 Falz- und Lochmarken anzeigen (87mm, 105mm, 148.5mm, 192mm)</span>
              </label>
              <p className="text-[10px] text-slate-500 ml-6">
                Druckt exakte millimetergenaue Schneid-, Falz- und Lochmarken am linken Seitenrand für DIN-Briefumschläge DL/C65.
              </p>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Einzeilige Rücksendeangabe (Absenderzeile über Anschriftfeld):
              </label>
              <input
                type="text"
                value={din.senderLine}
                onChange={(e) => onChangeDin({ ...din, senderLine: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Empfänger-Anschrift (DIN 5008 Fensterbriefumschlag C4/C5):
              </label>
              <textarea
                rows={3}
                value={din.recipientAddress}
                onChange={(e) => onChangeDin({ ...din, recipientAddress: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-sans text-xs"
              />
            </div>

            {/* Infoblock Inputs */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-800">Infoblock / Bezugszeichen (Rechte Spalte):</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500">Unser Zeichen / Bearbeiter</label>
                  <input
                    type="text"
                    value={din.infoblock?.ourRef || ''}
                    onChange={(e) =>
                      onChangeDin({ ...din, infoblock: { ...din.infoblock, ourRef: e.target.value } })
                    }
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Kundennummer</label>
                  <input
                    type="text"
                    value={din.infoblock?.customerNo || ''}
                    onChange={(e) =>
                      onChangeDin({ ...din, infoblock: { ...din.infoblock, customerNo: e.target.value } })
                    }
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Rechnungs- / Vorgangs-Nr.</label>
                  <input
                    type="text"
                    value={din.infoblock?.invoiceNo || ''}
                    onChange={(e) =>
                      onChangeDin({ ...din, infoblock: { ...din.infoblock, invoiceNo: e.target.value } })
                    }
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Projekt- / Baustellen-Nr.</label>
                  <input
                    type="text"
                    value={din.infoblock?.projectNo || ''}
                    onChange={(e) =>
                      onChangeDin({ ...din, infoblock: { ...din.infoblock, projectNo: e.target.value } })
                    }
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 3-Column Footer Details */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-800">Dreispaltiger Firmen-Geschäftsfuß:</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500">Spalte 1 (Sitz & Register)</label>
                  <textarea
                    rows={3}
                    value={din.threeColumnFooter?.col1Text || ''}
                    onChange={(e) =>
                      onChangeDin({
                        ...din,
                        threeColumnFooter: { ...din.threeColumnFooter, col1Text: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1 border border-slate-300 rounded text-[10px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Spalte 2 (Bankverbindung)</label>
                  <textarea
                    rows={3}
                    value={din.threeColumnFooter?.col2Text || ''}
                    onChange={(e) =>
                      onChangeDin({
                        ...din,
                        threeColumnFooter: { ...din.threeColumnFooter, col2Text: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1 border border-slate-300 rounded text-[10px] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Spalte 3 (Steuern & USt-ID)</label>
                  <textarea
                    rows={3}
                    value={din.threeColumnFooter?.col3Text || ''}
                    onChange={(e) =>
                      onChangeDin({
                        ...din,
                        threeColumnFooter: { ...din.threeColumnFooter, col3Text: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1 border border-slate-300 rounded text-[10px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. VOB/B Commercial Calculation & Taxes */}
      <div className="p-3 border border-slate-200 rounded bg-white space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <Building size={16} className="text-emerald-600" />
            <span>VOB/B Abrechnung & Mehrwertsteuer-Splitting</span>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
            <input
              type="checkbox"
              checked={vob.enabled}
              onChange={(e) => onChangeVob({ ...vob, enabled: e.target.checked })}
              className="rounded text-indigo-600"
            />
            <span>Aktivieren</span>
          </label>
        </div>

        {vob.enabled && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500">Gewährleistungseinbehalt (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={vob.deductions?.warrantyRetentionPercent || 0}
                  onChange={(e) =>
                    onChangeVob({
                      ...vob,
                      deductions: { ...vob.deductions, warrantyRetentionPercent: Number(e.target.value) },
                    })
                  }
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Bauwesenversicherung (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vob.deductions?.constructionInsurancePercent || 0}
                  onChange={(e) =>
                    onChangeVob({
                      ...vob,
                      deductions: { ...vob.deductions, constructionInsurancePercent: Number(e.target.value) },
                    })
                  }
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Bisherige Abschläge (€)</label>
                <input
                  type="number"
                  value={vob.deductions?.advancePaymentsDeducted || 0}
                  onChange={(e) =>
                    onChangeVob({
                      ...vob,
                      deductions: { ...vob.deductions, advancePaymentsDeducted: Number(e.target.value) },
                    })
                  }
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Zahlungsbedingungen & Skonto:</label>
              <input
                type="text"
                value={vob.paymentTermsText || ''}
                onChange={(e) => onChangeVob({ ...vob, paymentTermsText: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. EPC GiroCode / Bank QR Code */}
      <div className="p-3 border border-slate-200 rounded bg-white space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <QrCode size={16} className="text-indigo-600" />
            <span>EPC-QR-Code (GiroCode) für Rechnungsfuß</span>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
            <input
              type="checkbox"
              checked={epc.enabled}
              onChange={(e) => onChangeEpc({ ...epc, enabled: e.target.checked })}
              className="rounded text-indigo-600"
            />
            <span>Aktivieren</span>
          </label>
        </div>

        {epc.enabled && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] text-slate-500">Zahlungsempfänger</label>
              <input
                type="text"
                value={epc.recipientName}
                onChange={(e) => onChangeEpc({ ...epc, recipientName: e.target.value })}
                className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500">IBAN</label>
              <input
                type="text"
                value={epc.iban}
                onChange={(e) => onChangeEpc({ ...epc, iban: e.target.value })}
                className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Swiss QR Code (Schweizer QR-Rechnung Standard) */}
      <div className="p-3 border border-slate-200 rounded bg-white space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <Crosshair size={16} className="text-red-600" />
            <span>Schweizer QR-Rechnung (Swiss QR-Bill)</span>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
            <input
              type="checkbox"
              checked={swiss.enabled}
              onChange={(e) => onChangeSwissQr?.({ ...swiss, enabled: e.target.checked })}
              className="rounded text-red-600"
            />
            <span>Aktivieren</span>
          </label>
        </div>

        {swiss.enabled && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-bold">QR-IBAN / IBAN</label>
                <input
                  type="text"
                  value={swiss.iban}
                  onChange={(e) => onChangeSwissQr?.({ ...swiss, iban: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold">Währung</label>
                <select
                  value={swiss.currency}
                  onChange={(e) => onChangeSwissQr?.({ ...swiss, currency: e.target.value as any })}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                >
                  <option value="CHF">CHF (Schweizer Franken)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold">Referenz-Typ</label>
                <select
                  value={swiss.referenceType}
                  onChange={(e) => onChangeSwissQr?.({ ...swiss, referenceType: e.target.value as any })}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                >
                  <option value="QRR">QRR (27-stellige QR-Referenz)</option>
                  <option value="SCOR">SCOR (Creditor Reference)</option>
                  <option value="NON">NON (Ohne Referenz)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold">Zahlungsreferenz</label>
              <input
                type="text"
                value={swiss.reference || ''}
                onChange={(e) => onChangeSwissQr?.({ ...swiss, reference: e.target.value })}
                className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-xs tracking-wider"
              />
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-2">
              <span className="font-semibold text-slate-800 text-[11px] block">Gläubiger (Empfänger):</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Firma / Name"
                  value={swiss.creditor?.name || ''}
                  onChange={(e) =>
                    onChangeSwissQr?.({ ...swiss, creditor: { ...(swiss.creditor || {}), name: e.target.value } as any })
                  }
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
                <input
                  type="text"
                  placeholder="Straße & Hausnr."
                  value={swiss.creditor?.street || ''}
                  onChange={(e) =>
                    onChangeSwissQr?.({ ...swiss, creditor: { ...(swiss.creditor || {}), street: e.target.value } as any })
                  }
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="PLZ & Ort"
                  value={`${swiss.creditor?.postalCode || ''} ${swiss.creditor?.city || ''}`.trim()}
                  onChange={(e) => {
                    const parts = (e.target.value || '').split(' ');
                    onChangeSwissQr?.({
                      ...swiss,
                      creditor: {
                        ...(swiss.creditor || {}),
                        postalCode: parts[0] || '',
                        city: parts.slice(1).join(' ') || '',
                      } as any,
                    });
                  }}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
                <input
                  type="text"
                  placeholder="Land (z.B. CH)"
                  value={swiss.creditor?.country || ''}
                  onChange={(e) =>
                    onChangeSwissQr?.({ ...swiss, creditor: { ...(swiss.creditor || {}), country: e.target.value } as any })
                  }
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
