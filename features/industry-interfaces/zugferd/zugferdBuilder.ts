import { ZugferdInvoiceData, ZugferdProfile } from './zugferdTypes';

export class ZugferdBuilder {
  /**
   * Generates Factur-X / ZUGFeRD 2.2 / XRechnung compliant CrossIndustryInvoice (CII) XML string
   */
  public static buildFacturXXml(data: ZugferdInvoiceData, profile: ZugferdProfile = 'COMFORT'): string {
    const urn = profile === 'XRECHNUNG'
      ? 'urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_2.2'
      : `urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:${profile.toLowerCase()}`;

    const formattedIssueDate = data.issueDate.replace(/-/g, '');
    const formattedDueDate = data.dueDate ? data.dueDate.replace(/-/g, '') : formattedIssueDate;

    // Line items XML
    const lineItemsXml = data.lineItems
      .map((item, idx) => {
        const lineId = idx + 1;
        const netPrice = item.unitPrice || 0;
        const totalLineAmount = item.totalAmount || item.quantity * netPrice;
        const taxCategory = data.isReverseCharge13b ? 'AE' : 'S';
        const taxPercent = data.isReverseCharge13b ? 0 : item.vatRate || 19;

        return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${lineId}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${this.escapeXml(item.name)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${netPrice.toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${this.mapUnitToUnece(item.unit)}">${item.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${taxCategory}</ram:CategoryCode>
          <ram:RateApplicablePercent>${taxPercent.toFixed(2)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${totalLineAmount.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
      })
      .join('');

    // Tax calculation elements
    const taxCategory = data.isReverseCharge13b ? 'AE' : 'S';
    const taxPercent = data.isReverseCharge13b ? 0 : 19;
    const taxExemptionReasonXml = data.isReverseCharge13b
      ? `
        <ram:ExemptionReasonCode>VATEX-EU-AE</ram:ExemptionReasonCode>
        <ram:ExemptionReason>${this.escapeXml(data.reverseChargeNote || 'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG')}</ram:ExemptionReason>`
      : '';

    const payableAmount = data.payableAmount !== undefined ? data.payableAmount : data.totalGross;
    const prepaidAmount = data.prepaidAmount || 0;

    return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>${urn}</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${this.escapeXml(data.invoiceNumber)}</ram:ID>
    <ram:TypeCode>${data.typeCode || '380'}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${formattedIssueDate}</udt:DateTimeString>
    </ram:IssueDateTime>
    ${data.isReverseCharge13b ? `<ram:IncludedNote><ram:Content>${this.escapeXml(data.reverseChargeNote || 'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG')}</ram:Content></ram:IncludedNote>` : ''}
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    ${lineItemsXml}
    <ram:ApplicableHeaderTradeAgreement>
      ${data.buyer.buyerReference ? `<ram:BuyerReference>${this.escapeXml(data.buyer.buyerReference)}</ram:BuyerReference>` : ''}
      <ram:SellerTradeParty>
        <ram:Name>${this.escapeXml(data.seller.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${this.escapeXml(data.seller.zipCode)}</ram:PostcodeCode>
          <ram:LineOne>${this.escapeXml(data.seller.street)}</ram:LineOne>
          <ram:CityName>${this.escapeXml(data.seller.city)}</ram:CityName>
          <ram:CountryID>${this.escapeXml(data.seller.country || 'DE')}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${data.seller.vatId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${this.escapeXml(data.seller.vatId)}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
        ${data.seller.taxNumber ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${this.escapeXml(data.seller.taxNumber)}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${this.escapeXml(data.buyer.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${this.escapeXml(data.buyer.zipCode)}</ram:PostcodeCode>
          <ram:LineOne>${this.escapeXml(data.buyer.street)}</ram:LineOne>
          <ram:CityName>${this.escapeXml(data.buyer.city)}</ram:CityName>
          <ram:CountryID>${this.escapeXml(data.buyer.country || 'DE')}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${data.buyer.vatId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${this.escapeXml(data.buyer.vatId)}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
      </ram:BuyerTradeParty>
      ${data.buyer.orderReference ? `<ram:BuyerOrderReferencedDocument><ram:IssuerAssignedID>${this.escapeXml(data.buyer.orderReference)}</ram:IssuerAssignedID></ram:BuyerOrderReferencedDocument>` : ''}
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${formattedIssueDate}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${this.escapeXml(data.currency || 'EUR')}</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${this.escapeXml(data.seller.iban)}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
        ${data.seller.bic ? `<ram:PayeeSpecifiedCreditorFinancialInstitution><ram:BICID>${this.escapeXml(data.seller.bic)}</ram:BICID></ram:PayeeSpecifiedCreditorFinancialInstitution>` : ''}
      </ram:SpecifiedTradeSettlementPaymentMeans>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${data.totalVat.toFixed(2)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${data.totalNet.toFixed(2)}</ram:BasisAmount>
        <ram:CategoryCode>${taxCategory}</ram:CategoryCode>${taxExemptionReasonXml}
        <ram:RateApplicablePercent>${taxPercent.toFixed(2)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradePaymentTerms>
        <ram:Description>Zahlbar bis zum ${data.dueDate || data.issueDate} ohne Abzug.</ram:Description>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${formattedDueDate}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${data.totalNet.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${data.totalNet.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${data.currency || 'EUR'}">${data.totalVat.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${data.totalGross.toFixed(2)}</ram:GrandTotalAmount>
        <ram:TotalPrepaidAmount>${prepaidAmount.toFixed(2)}</ram:TotalPrepaidAmount>
        <ram:DuePayableAmount>${payableAmount.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
  }

  private static mapUnitToUnece(unit: string): string {
    const clean = (unit || '').trim().toLowerCase();
    switch (clean) {
      case 'stk':
      case 'stück':
        return 'C62'; // One / Piece
      case 'm':
      case 'meter':
      case 'lfm':
        return 'MTR';
      case 'm²':
      case 'qm':
      case 'm2':
        return 'MTK'; // Square Metre
      case 'm³':
      case 'cbm':
      case 'm3':
        return 'MTQ'; // Cubic Metre
      case 'std':
      case 'h':
        return 'HUR'; // Hour
      case 'tag':
      case 'tage':
        return 'DAY';
      case 'kg':
        return 'KGM';
      case 't':
      case 'to':
        return 'TNE';
      case 'psch':
      case 'pauschal':
        return 'LS'; // Lump sum
      case 'l':
      case 'liter':
        return 'LTR';
      default:
        return 'C62';
    }
  }

  private static escapeXml(unsafe: string): string {
    return (unsafe || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
