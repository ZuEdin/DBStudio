import {
  ZugferdInvoiceData,
  ZugferdProfile,
  En16931ValidationReport,
  En16931ValidationRuleIssue,
  LeitwegIdValidationResult,
} from './zugferdTypes';

const GERMAN_STATE_CODES: Record<string, string> = {
  '01': 'Schleswig-Holstein',
  '02': 'Hamburg',
  '03': 'Niedersachsen',
  '04': 'Bremen',
  '05': 'Nordrhein-Westfalen',
  '06': 'Hessen',
  '07': 'Rheinland-Pfalz',
  '08': 'Baden-Württemberg',
  '09': 'Bayern',
  '10': 'Saarland',
  '11': 'Berlin',
  '12': 'Brandenburg',
  '13': 'Mecklenburg-Vorpommern',
  '14': 'Sachsen',
  '15': 'Sachsen-Anhalt',
  '16': 'Thüringen',
  '99': 'Bund (Bundesbehörden / Bundesverwaltung)',
};

export class ZugferdValidator {
  /**
   * Validates a German Public Sector Leitweg-ID according to KoSIT specification
   */
  public static validateLeitwegId(rawId: string): LeitwegIdValidationResult {
    const trimmed = (rawId || '').trim();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!trimmed) {
      return {
        isValid: false,
        rawLeitwegId: '',
        formattedId: '',
        portalType: 'UNKNOWN',
        portalName: 'Keine Leitweg-ID hinterlegt',
        jurisdiction: 'Unbekannt',
        errors: ['Leitweg-ID ist leer. Für B2G E-Rechnungen an Behörden ist eine Leitweg-ID zwingend vorgeschrieben.'],
        warnings: [],
      };
    }

    // Pattern: [Grob-Adressierung]-[Fein-Adressierung]-[Prüfziffer]
    // Example: 04011000-12345-67 or 991-12345-67
    const parts = trimmed.split('-');
    if (parts.length < 2 || parts.length > 3) {
      errors.push('Format ungültig: Leitweg-ID muss aus 2 bis 3 Bindestrich-getrennten Blöcken bestehen (z.B. 04011000-12345-67).');
    }

    const grobCode = parts[0] || '';
    const statePrefix = grobCode.slice(0, 2);
    const jurisdiction = GERMAN_STATE_CODES[statePrefix] || `Unbekannte Gebietskörperschaft (${statePrefix})`;

    let portalType: 'ZRE' | 'OZG_RE' | 'UNKNOWN' = 'UNKNOWN';
    let portalName = 'Landesportal / OZG-RE';

    if (statePrefix === '99') {
      portalType = 'ZRE';
      portalName = 'ZRE (Zentrale Rechnungseingangsplattform des Bundes)';
    } else if (GERMAN_STATE_CODES[statePrefix]) {
      portalType = 'OZG_RE';
      portalName = `OZG-RE Länderportal (${jurisdiction})`;
    } else {
      errors.push(`Ungültiger Bundesland-Präfix "${statePrefix}". Erwartet 01-16 (Länder) oder 99 (Bund).`);
    }

    // Check digit inspection
    const checkDigits = parts[parts.length - 1];
    if (parts.length === 3) {
      if (!/^\d{2}$/.test(checkDigits)) {
        errors.push(`Prüfziffer "${checkDigits}" ist ungültig. Die Prüfziffer muss genau 2 Dezimalstellen aufweisen.`);
      }
    } else if (parts.length === 2 && !/^\d{2}$/.test(parts[1])) {
      warnings.push('Empfohlenes 3-teiliges KoSIT-Format mit separater 2-stelliger Prüfziffer verwenden.');
    }

    return {
      isValid: errors.length === 0,
      rawLeitwegId: trimmed,
      formattedId: trimmed,
      portalType,
      portalName,
      jurisdiction,
      errors,
      warnings,
    };
  }

  /**
   * Performs deep EN 16931 Schematron and German Construction (§13b UStG) validation
   */
  public static validateInvoice(data: ZugferdInvoiceData, profile: ZugferdProfile = 'COMFORT'): En16931ValidationReport {
    const issues: En16931ValidationRuleIssue[] = [];

    // 1. General Invoice & Dates
    if (!data.invoiceNumber || !data.invoiceNumber.trim()) {
      issues.push({
        id: 'err_inv_num',
        code: 'BR-01',
        severity: 'fatal',
        category: 'schema',
        title: 'Fehlende Rechnungsnummer (BT-1)',
        description: 'Jede Rechnung muss eine eindeutige Rechnungsnummer aufweisen.',
        field: 'invoiceNumber',
      });
    }

    if (!data.issueDate) {
      issues.push({
        id: 'err_issue_date',
        code: 'BR-02',
        severity: 'fatal',
        category: 'schema',
        title: 'Fehlendes Rechnungsdatum (BT-2)',
        description: 'Das Rechnungsdatum ist ein Pflichtbestandteil.',
        field: 'issueDate',
      });
    }

    // 2. Seller Details
    if (!data.seller.name || !data.seller.street || !data.seller.zipCode || !data.seller.city) {
      issues.push({
        id: 'err_seller_addr',
        code: 'BR-05',
        severity: 'error',
        category: 'schema',
        title: 'Unvollständige Verkäuferadresse (BT-27 - BT-32)',
        description: 'Name, Straße, PLZ und Ort des Rechnungsstellers müssen vollständig angegeben sein.',
        field: 'seller',
      });
    }

    if (!data.seller.vatId && !data.seller.taxNumber) {
      issues.push({
        id: 'err_seller_tax',
        code: 'BR-06',
        severity: 'fatal',
        category: 'schema',
        title: 'Fehlende USt-IdNr oder Steuernummer des Verkäufers (BT-31/32)',
        description: 'Mindestens eine USt-IdNr (z. B. DE123456789) oder Steuernummer ist gesetzlich verpflichtend.',
        field: 'seller.vatId',
      });
    } else if (data.seller.vatId && !/^DE\d{9}$/i.test(data.seller.vatId.replace(/\s/g, ''))) {
      issues.push({
        id: 'warn_seller_vat',
        code: 'BR-DE-06',
        severity: 'warning',
        category: 'schema',
        title: 'Format der USt-IdNr prüfen',
        description: `Die angegebene USt-IdNr "${data.seller.vatId}" weicht vom deutschen Standard DE+9 Ziffern ab.`,
        field: 'seller.vatId',
      });
    }

    if (!data.seller.iban || !data.seller.iban.replace(/\s/g, '').startsWith('DE')) {
      issues.push({
        id: 'warn_seller_iban',
        code: 'BR-DE-17',
        severity: 'warning',
        category: 'payment_terms',
        title: 'Bankverbindung / IBAN prüfen',
        description: 'Für SEPA-Überweisungen ist eine gültige IBAN zwingend anzugeben.',
        field: 'seller.iban',
      });
    }

    // 3. Buyer Details & B2G / XRechnung Leitweg-ID
    let leitwegResult: LeitwegIdValidationResult | undefined;
    if (profile === 'XRECHNUNG' || data.buyer.buyerReference) {
      leitwegResult = this.validateLeitwegId(data.buyer.buyerReference || '');
      if (!leitwegResult.isValid) {
        issues.push({
          id: 'err_leitweg_id',
          code: 'BR-DE-15',
          severity: profile === 'XRECHNUNG' ? 'error' : 'warning',
          category: 'leitweg_id',
          title: 'Ungültige Leitweg-ID (BT-10)',
          description: leitwegResult.errors.join(' '),
          field: 'buyer.buyerReference',
        });
      }
    }

    // 4. Construction specific rules (§13b UStG)
    let is13bCompliant = true;
    if (data.isReverseCharge13b) {
      // Check 1: total VAT must be 0
      if (data.totalVat > 0) {
        is13bCompliant = false;
        issues.push({
          id: 'err_13b_vat_sum',
          code: 'BR-13B-01',
          severity: 'error',
          category: 'construction_13b',
          title: '§13b UStG Verstoß: Steuerbetrag > 0,00 €',
          description: 'Bei Steuerschuldnerschaft des Leistungsempfängers nach § 13b UStG darf keine Umsatzsteuer ausgewiesen werden (MwSt = 0,00 €).',
          field: 'totalVat',
          autoFixable: true,
        });
      }

      // Check 2: Exemption note must exist
      const note = data.reverseChargeNote || '';
      if (!note.includes('13b') && !note.toLowerCase().includes('steuerschuldnerschaft')) {
        is13bCompliant = false;
        issues.push({
          id: 'err_13b_note',
          code: 'BR-13B-02',
          severity: 'error',
          category: 'construction_13b',
          title: '§13b UStG Pflichtvermerk fehlt (BT-22)',
          description: 'Pflichtvermerk "Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG" muss in der E-Rechnung hinterlegt sein.',
          field: 'reverseChargeNote',
          autoFixable: true,
        });
      }

      // Check 3: Buyer tax ID or VAT ID must exist
      if (!data.buyer.vatId && !data.buyer.taxNumber) {
        issues.push({
          id: 'warn_13b_buyer_tax',
          code: 'BR-13B-03',
          severity: 'warning',
          category: 'construction_13b',
          title: 'USt-IdNr des Leistungsempfängers fehlt (BT-48)',
          description: 'Für §13b UStG muss der Leistungsempfänger Unternehmer sein; USt-IdNr oder Steuernummer sollte vorliegen.',
          field: 'buyer.vatId',
        });
      }
    }

    // 5. Line items & Calculations
    if (data.lineItems.length === 0) {
      issues.push({
        id: 'err_no_items',
        code: 'BR-16',
        severity: 'fatal',
        category: 'schema',
        title: 'Keine Rechnungspositionen vorhanden (BG-25)',
        description: 'Eine Rechnung muss mindestens eine Position enthalten.',
        field: 'lineItems',
      });
    }

    let calculatedNet = 0;
    data.lineItems.forEach((item, idx) => {
      const itemNet = Math.round(item.quantity * item.unitPrice * 100) / 100;
      calculatedNet += itemNet;

      if (data.isReverseCharge13b && item.vatRate !== 0) {
        issues.push({
          id: `err_item_vat_${idx}`,
          code: 'BR-13B-LINE',
          severity: 'error',
          category: 'construction_13b',
          title: `Position "${item.name}": MwSt-Satz ungleich 0%`,
          description: `Bei §13b UStG muss der Steuersatz 0,00% (Kategorie AE) betragen (aktuell: ${item.vatRate}%).`,
          autoFixable: true,
        });
      }
    });

    if (Math.abs(calculatedNet - data.totalNet) > 0.05) {
      issues.push({
        id: 'err_net_sum_mismatch',
        code: 'BR-CO-10',
        severity: 'error',
        category: 'vat_calculation',
        title: 'Abweichung Nettosumme (BT-106)',
        description: `Summe der Positionen (${calculatedNet.toFixed(2)} €) stimmt nicht mit totalNet (${data.totalNet.toFixed(2)} €) überein.`,
        field: 'totalNet',
        autoFixable: true,
      });
    }

    const fatalCount = issues.filter((i) => i.severity === 'fatal').length;
    const errorCount = issues.filter((i) => i.severity === 'error' || i.severity === 'fatal').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;

    const deductions = errorCount * 25 + warningCount * 5;
    const score = Math.max(0, Math.min(100, 100 - deductions));

    return {
      isValid: errorCount === 0 && fatalCount === 0,
      profile,
      errorCount,
      warningCount,
      issues,
      leitwegResult,
      is13bCompliant,
      score,
    };
  }

  /**
   * Applies automated repairs to make invoice compliant with EN 16931 and §13b UStG
   */
  public static autoFixInvoice(data: ZugferdInvoiceData): ZugferdInvoiceData {
    const fixed: ZugferdInvoiceData = JSON.parse(JSON.stringify(data));

    if (fixed.isReverseCharge13b) {
      fixed.totalVat = 0;
      fixed.totalGross = fixed.totalNet;
      fixed.reverseChargeNote = 'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG (Reverse Charge).';

      fixed.lineItems.forEach((item) => {
        item.vatRate = 0;
        item.vatCategoryCode = 'AE';
      });
    }

    // Recalculate line totals
    let sumNet = 0;
    fixed.lineItems.forEach((item) => {
      item.totalAmount = Math.round(item.quantity * item.unitPrice * 100) / 100;
      sumNet += item.totalAmount;
    });

    fixed.totalNet = Math.round(sumNet * 100) / 100;

    if (!fixed.isReverseCharge13b) {
      fixed.totalVat = Math.round(fixed.totalNet * 0.19 * 100) / 100;
      fixed.totalGross = Math.round((fixed.totalNet + fixed.totalVat) * 100) / 100;
    }

    const retAmount = fixed.securityRetentionPercent
      ? Math.round(((fixed.totalGross * fixed.securityRetentionPercent) / 100) * 100) / 100
      : (fixed.securityRetentionAmount || 0);

    const prepaid = fixed.prepaidAmount || 0;
    fixed.payableAmount = Math.max(0, Math.round((fixed.totalGross - prepaid - retAmount) * 100) / 100);

    return fixed;
  }
}
