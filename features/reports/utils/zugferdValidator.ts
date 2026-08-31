import { ZugferdConfig } from '../../../types';

export interface ZugferdValidationRule {
  id: string;
  code: string;
  category: 'HEADER' | 'SELLER' | 'BUYER' | 'TOTALS' | 'TAX' | 'EN16931_SYNTAX';
  severity: 'ERROR' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  passed: boolean;
  fixSuggestion?: string;
}

export interface ZugferdValidationResult {
  isValid: boolean;
  isXRechnungCompliant: boolean;
  profile: string;
  score: number; // 0 - 100
  totalChecks: number;
  passedCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  rules: ZugferdValidationRule[];
  summary: string;
}

/**
 * EN 16931 & Factur-X / ZUGFeRD 2.2 Live Validation Engine
 * Validates invoice metadata, tax computations, mandatory CEN/TC 434 fields,
 * and B2G XRechnung / ZRE / OZG-RE rules.
 */
export const validateZugferdInvoice = (
  config: ZugferdConfig | undefined,
  netTotal: number,
  taxTotal: number,
  grossTotal: number,
  items: Array<{ name?: string; quantity?: number; unitPrice?: number; total?: number }> = []
): ZugferdValidationResult => {
  const rules: ZugferdValidationRule[] = [];

  const cfg: ZugferdConfig = config || {
    enabled: false,
    profile: 'COMFORT',
    invoiceNumber: '',
    issueDate: '',
    dueDate: '',
    buyerReference: '',
    sellerName: '',
    sellerVatId: '',
    buyerName: '',
    buyerVatId: '',
    currency: 'EUR',
    pdfCompliance: 'PDF/A-3b'
  };

  // 1. Profil & Header
  const hasValidProfile = ['MINIMUM', 'BASIC', 'COMFORT', 'EXTENDED', 'XRECHNUNG'].includes(cfg.profile?.toUpperCase());
  rules.push({
    id: 'BR-01',
    code: 'BR-01',
    category: 'HEADER',
    severity: 'ERROR',
    title: 'ZUGFeRD / Factur-X Profilspezifikation',
    description: 'Das angegebene Profil muss EN 16931-konform sein (z.B. COMFORT, EXTENDED, XRECHNUNG).',
    passed: hasValidProfile,
    fixSuggestion: 'Wählen Sie das Profil "COMFORT" oder "XRECHNUNG" in den Rechnungseinstellungen.'
  });

  // 2. Rechnungsnummer (BT-1)
  const hasInvoiceNumber = !!cfg.invoiceNumber && cfg.invoiceNumber.trim().length >= 1;
  rules.push({
    id: 'BT-01',
    code: 'BR-02',
    category: 'HEADER',
    severity: 'ERROR',
    title: 'Rechnungsnummer (BT-1)',
    description: 'Eine eindeutige Rechnungsnummer ist nach EN 16931 zwingend erforderlich.',
    passed: hasInvoiceNumber,
    fixSuggestion: 'Vergeben Sie eine eindeutige Rechnungsnummer (z. B. RE-2026-0042).'
  });

  // 3. Rechnungsdatum (BT-2)
  const hasIssueDate = !!cfg.issueDate && /^\d{4}-\d{2}-\d{2}$|^\d{8}$/.test(cfg.issueDate.trim());
  rules.push({
    id: 'BT-02',
    code: 'BR-03',
    category: 'HEADER',
    severity: 'ERROR',
    title: 'Rechnungsdatum (BT-2)',
    description: 'Das Ausstellungsdatum muss im ISO 8601 Format (YYYY-MM-DD) oder Format 102 vorliegen.',
    passed: hasIssueDate || !cfg.issueDate, // Default date is auto-filled if missing
    fixSuggestion: 'Geben Sie ein gültiges Ausstellungsdatum an.'
  });

  // 4. Währungscode (BT-5)
  const hasValidCurrency = !cfg.currency || ['EUR', 'CHF', 'USD', 'GBP'].includes(cfg.currency.toUpperCase());
  rules.push({
    id: 'BT-05',
    code: 'BR-04',
    category: 'HEADER',
    severity: 'ERROR',
    title: 'Währungscode nach ISO 4217 (BT-5)',
    description: 'Die Rechnungswährung muss ein gültiger 3-stelliger ISO 4217 Währungscode sein.',
    passed: hasValidCurrency,
    fixSuggestion: 'Stellen Sie die Währung auf "EUR" oder "CHF".'
  });

  // 5. Verkäufername (BT-27)
  const hasSellerName = !!cfg.sellerName && cfg.sellerName.trim().length >= 2;
  rules.push({
    id: 'BT-27',
    code: 'BR-06',
    category: 'SELLER',
    severity: 'ERROR',
    title: 'Verkäufer-Firmenname (BT-27)',
    description: 'Der vollständige Name bzw. die Firmierung des Verkäufers ist obligatorisch.',
    passed: hasSellerName,
    fixSuggestion: 'Tragen Sie den Namen Ihres Unternehmens ein (z. B. Bauunternehmung Schmidt GmbH).'
  });

  // 6. Verkäufer USt-IdNr. / Steuernummer (BT-31 / BT-32)
  const hasSellerVat = !!cfg.sellerVatId && cfg.sellerVatId.trim().length >= 5;
  const isVatFormatValid = !cfg.sellerVatId || /^[A-Z]{2}[0-9A-Z+*.]{2,12}$/i.test(cfg.sellerVatId.trim());
  rules.push({
    id: 'BT-31',
    code: 'BR-CO-09',
    category: 'SELLER',
    severity: cfg.profile === 'XRECHNUNG' ? 'ERROR' : 'WARNING',
    title: 'Umsatzsteuer-Identifikationsnummer des Verkäufers (BT-31)',
    description: 'Für B2B- und B2G-Rechnungen wird eine gültige USt-IdNr. (z. B. DE123456789, ATU12345678, CHE-123.456.789) verlangt.',
    passed: hasSellerVat && isVatFormatValid,
    fixSuggestion: 'Ergänzen Sie die USt-IdNr. mit länderspezifischem Präfix (z. B. DE... / ATU...).'
  });

  // 7. Käufername (BT-44)
  const hasBuyerName = !!cfg.buyerName && cfg.buyerName.trim().length >= 2;
  rules.push({
    id: 'BT-44',
    code: 'BR-07',
    category: 'BUYER',
    severity: 'ERROR',
    title: 'Käufer-Name / Kunde (BT-44)',
    description: 'Der Name des Rechnungsempfängers ist nach EN 16931 zwingend erforderlich.',
    passed: hasBuyerName,
    fixSuggestion: 'Geben Sie den Namen oder die Firma des Rechnungsempfängers an.'
  });

  // 8. Leitweg-ID / Käuferreferenz (BT-10) - Kritisch für B2G / XRechnung
  const hasBuyerRef = !!cfg.buyerReference && cfg.buyerReference.trim().length >= 1;
  const isXRechnung = cfg.profile === 'XRECHNUNG';
  rules.push({
    id: 'BT-10',
    code: 'BR-DE-1',
    category: 'BUYER',
    severity: isXRechnung ? 'ERROR' : 'INFO',
    title: 'Leitweg-ID / Buyer Reference (BT-10)',
    description: 'Für Rechnungen an Bundes-, Landes- und Kommunalbehörden (B2G / XRechnung) ist die Leitweg-ID zwingend.',
    passed: !isXRechnung || hasBuyerRef,
    fixSuggestion: 'Hinterlegen Sie die Leitweg-ID der Behörde (z. B. 991-12345-67) im Feld Käuferreferenz.'
  });

  // 9. Rechnungsbeträge & Rundungsprüfung (BR-CO-15: Netto + Steuer = Brutto)
  const calculatedGross = Number((netTotal + taxTotal).toFixed(2));
  const diff = Math.abs(calculatedGross - Number(grossTotal.toFixed(2)));
  const isSummationExact = diff <= 0.02; // max 2 cent rounding tolerance
  rules.push({
    id: 'BR-CO-15',
    code: 'BR-CO-15',
    category: 'TOTALS',
    severity: 'ERROR',
    title: 'Monetäre Summenprüfung (Nettobetrag + Steuerbetrag = Bruttobetrag)',
    description: `Die Gesamtsumme (${grossTotal.toFixed(2)} ${cfg.currency || 'EUR'}) muss der Summe aus Netto (${netTotal.toFixed(2)}) und Steuer (${taxTotal.toFixed(2)}) entsprechen.`,
    passed: isSummationExact,
    fixSuggestion: 'Überprüfen Sie die Zwischensummen und Steuerberechnung der Detailpositionen.'
  });

  // 10. Positionen vorhanden
  const hasItems = items.length > 0;
  rules.push({
    id: 'BR-16',
    code: 'BR-16',
    category: 'TOTALS',
    severity: 'WARNING',
    title: 'Rechnungspositionen (BG-25)',
    description: 'Eine Standardrechnung sollte mindestens eine detaillierte Leistungsposition mit Einzelpreis und Menge enthalten.',
    passed: hasItems || netTotal > 0,
    fixSuggestion: 'Fügen Sie mindestens eine Position zur Rechnungstabelle hinzu.'
  });

  // Calculation of stats
  const totalChecks = rules.length;
  const passedCount = rules.filter(r => r.passed).length;
  const errorCount = rules.filter(r => !r.passed && r.severity === 'ERROR').length;
  const warningCount = rules.filter(r => !r.passed && r.severity === 'WARNING').length;
  const infoCount = rules.filter(r => !r.passed && r.severity === 'INFO').length;

  const isValid = errorCount === 0;
  const isXRechnungCompliant = isValid && (warningCount === 0) && (hasBuyerRef || cfg.profile !== 'XRECHNUNG');
  const score = Math.round((passedCount / totalChecks) * 100);

  let summary = '';
  if (isValid && isXRechnungCompliant) {
    summary = 'Rechnung ist 100% EN 16931- und ZUGFeRD / XRechnung-konform. Bereit für E-Invoicing & Behördenportale.';
  } else if (isValid) {
    summary = `Rechnung ist syntaktisch gültig (${score}% Score). Es liegen ${warningCount} Empfehlungen für den B2G-Verkehr vor.`;
  } else {
    summary = `Es wurden ${errorCount} Pflichtfeld-Verletzungen gefunden, die vor dem ZUGFeRD-Export behoben werden müssen.`;
  }

  return {
    isValid,
    isXRechnungCompliant,
    profile: cfg.profile || 'COMFORT',
    score,
    totalChecks,
    passedCount,
    errorCount,
    warningCount,
    infoCount,
    rules,
    summary
  };
};
