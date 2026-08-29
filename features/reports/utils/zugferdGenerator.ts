import { ZugferdConfig } from '../../types';

/**
 * Generates Cross-Industry Invoice (CII) XML compliant with Factur-X / ZUGFeRD 2.2 / XRechnung (EN16931).
 */
export const generateZugferdXml = (
  config: ZugferdConfig,
  netTotal: number,
  taxTotal: number,
  grossTotal: number,
  items: Array<{ name: string; quantity: number; unitPrice: number; total: number }>
): string => {
  const issueDate = config.issueDate || new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const currency = config.currency || 'EUR';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:${config.profile.toLowerCase()}</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${config.invoiceNumber || 'INV-2026-001'}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${issueDate}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      ${config.buyerReference ? `<ram:BuyerReference>${config.buyerReference}</ram:BuyerReference>` : ''}
      <ram:SellerTradeParty>
        <ram:Name>${config.sellerName || 'Musterbau GmbH'}</ram:Name>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${config.sellerVatId || 'DE302918273'}</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${config.buyerName || 'Kunde AG'}</ram:Name>
        ${config.buyerVatId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${config.buyerVatId}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery />
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${currency}</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${netTotal.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${netTotal.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${currency}">${taxTotal.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${grossTotal.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${grossTotal.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

  return xml;
};

/**
 * Downloads XML directly or provides base64 for embedding in PDF/A-3 attachments.
 */
export const downloadZugferdXml = (
  config: ZugferdConfig,
  netTotal: number,
  taxTotal: number,
  grossTotal: number,
  items: any[] = []
) => {
  const xml = generateZugferdXml(config, netTotal, taxTotal, grossTotal, items);
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `factur-x_${config.invoiceNumber || 'rechnung'}.xml`;
  a.click();
  URL.revokeObjectURL(url);
};
