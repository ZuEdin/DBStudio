export type ZugferdProfile = 'MINIMUM' | 'BASIC' | 'COMFORT' | 'EXTENDED' | 'XRECHNUNG';

export type InvoiceTypeCode = '380' | '326' | '384' | '389'; // 380: Handelsrechnung/Schlussrechnung, 326: Abschlagsrechnung / Teilrechnung, 384: Korrekturrechnung

export interface ZugferdLineItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number; // 19%, 7% or 0% for §13b UStG
  totalAmount: number;
  vatCategoryCode?: 'S' | 'AE' | 'Z' | 'E'; // S: Standard, AE: Reverse Charge (§13b UStG)
}

export interface ZugferdInvoiceData {
  invoiceNumber: string;
  typeCode: InvoiceTypeCode; // '380' | '326'
  issueDate: string;
  dueDate: string;
  currency: string;
  
  // German Construction specific rules
  isReverseCharge13b: boolean; // §13b UStG: Steuerschuldnerschaft des Leistungsempfängers
  reverseChargeNote?: string;  // e.g. "Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG"
  
  hasBauabzugssteuer48b?: boolean; // §48b EStG Freistellungsbescheinigung
  freistellungsBescheinigungNo?: string;

  securityRetentionPercent?: number; // Sicherheitseinbehalt / Gewährleistungseinbehalt in % (z.B. 5%)
  securityRetentionAmount?: number;  // In €

  prepaidAmount?: number; // Bereits bezahlte Abschlagsrechnungen in €

  seller: {
    name: string;
    street: string;
    zipCode: string;
    city: string;
    country: string;
    vatId: string; // USt-IdNr z.B. DE123456789
    taxNumber?: string; // Steuernummer
    iban: string;
    bic?: string;
    email?: string;
    contactName?: string;
  };
  buyer: {
    name: string;
    street: string;
    zipCode: string;
    city: string;
    country: string;
    vatId?: string;
    taxNumber?: string;
    buyerReference?: string; // Leitweg-ID (z.B. 04011000-12345-67 oder 991-12345-67)
    orderReference?: string; // Bestellnummer (BT-13)
    projectReference?: string; // Projektnummer
  };
  lineItems: ZugferdLineItem[];
  totalNet: number;
  totalVat: number;
  totalGross: number;
  payableAmount: number; // Fälliger Zahlungsbetrag (totalGross - prepaidAmount - securityRetentionAmount)
}

export interface LeitwegIdValidationResult {
  isValid: boolean;
  rawLeitwegId: string;
  formattedId: string;
  portalType: 'ZRE' | 'OZG_RE' | 'UNKNOWN';
  portalName: string; // e.g. "ZRE (Zentrale Rechnungseingangsplattform des Bundes)" or "OZG-RE Portal Bayern"
  jurisdiction: string; // e.g. "Bund (99)", "Bayern (09)", "Nordrhein-Westfalen (05)"
  errors: string[];
  warnings: string[];
}

export interface En16931ValidationRuleIssue {
  id: string;
  code: string; // e.g. "BR-DE-1", "BR-13b-1", "BR-CO-04"
  severity: 'fatal' | 'error' | 'warning' | 'info';
  category: 'schema' | 'construction_13b' | 'leitweg_id' | 'vat_calculation' | 'payment_terms';
  title: string;
  description: string;
  field?: string;
  autoFixable?: boolean;
}

export interface En16931ValidationReport {
  isValid: boolean;
  profile: ZugferdProfile;
  errorCount: number;
  warningCount: number;
  issues: En16931ValidationRuleIssue[];
  leitwegResult?: LeitwegIdValidationResult;
  is13bCompliant: boolean;
  score: number; // 0 - 100
}
