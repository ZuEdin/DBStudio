export interface TextStyle {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  borderBottom?: boolean;
}

export interface FormattingRule {
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: string;
  style: TextStyle;
}

export type ColumnRenderType = 'text' | 'qrcode' | 'barcode' | 'badge' | 'currency' | 'date' | 'image';

export interface ReportColumn {
  fieldId: string;
  label: string;
  visible: boolean;
  order: number;
  renderType?: ColumnRenderType;
  formattingRules?: FormattingRule[];
  width?: string;
}

export interface ReportSummary {
  fieldId: string;
  fieldName: string;
  calculation: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
  groupFieldId?: string; // If undefined, applies as grand total in Report Footer
}

export interface GroupLevel {
  fieldId: string;
  fieldName?: string;
  sortOrder?: 'asc' | 'desc';
  showHeader?: boolean;
  showFooter?: boolean;
  pageBreakBefore?: boolean; // Beginne Gruppe auf neuer Seite (z.B. Hauptkategorien, Kostenstellen)
  pageBreakAfter?: boolean; // Seitenumbruch nach Gruppenende
  keepTogether?: boolean; // Gruppe zusammenhalten (verhindert unschönen Seitenumbruch mitten in der Gruppe)
  keepWithNext?: boolean; // Header mit erster Detailzeile zusammenhalten (Orphan-Schutz)
  repeatOnEveryPage?: boolean;
}

export interface Din5008Config {
  enabled: boolean;
  formType: 'FormA' | 'FormB'; // Form A: 27mm top distance, Form B: 45mm top distance
  showFoldingMarks?: boolean; // DIN 5008 Falz- & Lochmarken (87mm, 148.5mm, 192mm / 210mm)
  senderLine: string; // e.g. "Musterbau GmbH • Baustr. 1 • 10115 Berlin"
  recipientAddress: string; // e.g. "Bauherr GmbH\nMax-Muster-Str. 4\n80331 München"
  infoblock: {
    ourRef?: string; // Unser Zeichen / Bearbeiter
    customerNo?: string; // Kundennummer
    invoiceNo?: string; // Rechnungs- / Vorgangsnummer
    projectNo?: string; // Baustellen / Projekt-Nr.
    servicePeriod?: string; // Leistungszeitraum
    date?: string; // Belegdatum
    phone?: string;
    email?: string;
  };
  threeColumnFooter: {
    col1Title?: string;
    col1Text?: string; // Company registry, court, CEO
    col2Title?: string;
    col2Text?: string; // Bank, IBAN, BIC
    col3Title?: string;
    col3Text?: string; // Tax ID, VAT, Gläubiger-ID
  };
}

export interface CommercialVobConfig {
  enabled: boolean;
  enableCarryOver: boolean; // Seitenübertrag oben / unten
  vatSplitting: {
    standard19: number; // Sum 19%
    reduced7: number; // Sum 7%
    taxFree13b: number; // Sum §13b VOB
  };
  deductions: {
    warrantyRetentionPercent?: number; // z.B. 5% Gewährleistungseinbehalt
    constructionInsurancePercent?: number; // z.B. 1% Bauwesenversicherung / Baustrom
    advancePaymentsDeducted?: number; // Bereits geleistete Abschlagszahlungen
    skontoPercent?: number; // Skontosatz z.B. 2%
    skontoDays?: number; // Tage z.B. 14 Tage
  };
  paymentTermsText?: string;
}

export interface EpcQrCodeConfig {
  enabled: boolean;
  recipientName: string;
  iban: string;
  bic?: string;
  amount?: number;
  reference?: string; // Verwendungszweck (z.B. RE-2026-0042)
}

export interface SwissQrCodeConfig {
  enabled: boolean;
  iban: string; // CH or LI IBAN
  creditor: {
    name: string;
    street: string;
    houseNo?: string;
    postalCode: string;
    city: string;
    country: string; // e.g. 'CH'
  };
  debtor?: {
    name: string;
    street: string;
    houseNo?: string;
    postalCode: string;
    city: string;
    country: string;
  };
  amount?: number;
  currency: 'CHF' | 'EUR';
  referenceType: 'QRR' | 'SCOR' | 'NON';
  reference?: string; // 27-digit QR-Reference or SCOR
  additionalInformation?: string;
}

export interface ZugferdConfig {
  enabled: boolean;
  profile: 'MINIMUM' | 'BASIC_WL' | 'BASIC' | 'EN16931' | 'COMFORT' | 'EXTENDED' | 'XRECHNUNG';
  invoiceNumber: string;
  issueDate?: string;
  dueDate?: string;
  buyerReference?: string; // Leitweg-ID for German public sector
  sellerName: string;
  sellerVatId: string;
  buyerName: string;
  buyerVatId?: string;
  currency: string; // EUR
  pdfCompliance: 'PDF/A-1b' | 'PDF/A-3b' | 'STANDARD';
}

export interface StationeryBackgroundConfig {
  enabled: boolean;
  page1OverlayUrl?: string; // Data URL or Image URL for page 1 letterhead
  page2OverlayUrl?: string; // Data URL or Image URL for follow-up pages
  opacity: number; // e.g. 0.95
  fitMode: 'fitPage' | 'original' | 'stretch';
}

export interface FreeformCanvasElement {
  id: string;
  type: 'label' | 'box' | 'line' | 'image' | 'formula' | 'signature' | 'barcode' | 'qrcode' | 'stamp' | 'badge';
  section: 'reportHeader' | 'pageHeader' | 'detail' | 'pageFooter' | 'reportFooter';
  x: number; // mm
  y: number; // mm
  width: number; // mm
  height: number; // mm
  content: string; // text, formula 'SUM(price)', image URL or data, barcode payload
  style?: TextStyle;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  rotation?: number; // e.g. 0, 90, 270 degrees
  barcodeFormat?: 'CODE128' | 'EAN13' | 'QR' | 'DATAMATRIX';
}

export interface PrintReportEventPayload {
  reportId: string;
  reportName?: string;
  parameters?: Record<string, any>;
  outputFormat: 'pdf_download' | 'print_dialog' | 'blob_stream' | 'email_direct';
  recipientEmail?: string;
}

export interface BandSectionConfig {
  reportHeader: { visible: boolean; height?: number; text?: string; coverPage?: boolean };
  pageHeader: { visible: boolean; height?: number; repeatLogo?: boolean };
  detailBand: { keepTogether?: boolean; alternateZebra?: boolean };
  pageFooter: { visible: boolean; showPageNumbers?: boolean; printDate?: boolean };
  reportFooter: { visible: boolean; showGrandTotal?: boolean; signatureBox?: boolean; closingText?: string };
}

export interface ReportStyles {
  header?: TextStyle;
  groupHeader?: TextStyle;
  columnHeader?: TextStyle;
  detail?: TextStyle;
  footer?: TextStyle;
}

export interface SubReportConfig {
  reportId: string;
  foreignKeyFieldId: string;
  parentKeyFieldId: string;
  title?: string;
  inline?: boolean;
  keepTogether?: boolean; // Unterbericht als geschlossenen Block zusammenhalten
  pageBreakBefore?: boolean; // Unterbericht immer auf neuer Seite beginnen
}

export interface ThermalPrinterConfig {
  enabled?: boolean;
  paperWidth: '58mm' | '80mm';
  connectionType: 'webusb' | 'webserial' | 'webbluetooth' | 'network_raw' | 'browser_direct';
  networkHost?: string;
  networkPort?: number;
  characterSet?: 'CP437' | 'CP850' | 'CP1252' | 'UTF-8';
  autoCut?: boolean;
  openCashDrawer?: boolean;
  feedLines?: number;
  printBarcode?: boolean;
  barcodeType?: 'QR_CODE' | 'CODE128' | 'EAN13';
  barcodeContent?: string;
  receiptHeader?: string;
  receiptFooter?: string;
}

export interface EscPosReceiptData {
  title: string;
  subtitle?: string;
  meta: Array<{ label: string; value: string }>;
  items: Array<{ name: string; qty: number; unitPrice: number; total: number }>;
  vatRates?: Array<{ label: string; rate: number; net: number; tax: number }>;
  netTotal: number;
  taxTotal: number;
  grossTotal: number;
  paymentMethod?: string;
  cashGiven?: number;
  cashReturn?: number;
  qrCodeData?: string;
  barcodeData?: string;
  footerNotes?: string;
}

export interface ReportChartConfig {
  enabled: boolean;
  type: 'bar' | 'pie' | 'line';
  xAxisFieldId: string;
  yAxisFieldId: string;
  title?: string;
}

export interface ReportSettings {
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'Letter';
  pageBreakAfterGroup?: boolean;
  keepTableRowsTogether?: boolean; // Striktes Zusammenhalten von Tabellenzeilen über Seitenränder hinweg
  keepGroupFootersWithData?: boolean; // Verhindert verwaiste Summenzeilen am Seitenanfang (Orphan Footer Protection)
  groupMethod?: 'full' | 'firstLetter';
  showReportHeader?: boolean;
  showReportFooter?: boolean;
  showPageFooter?: boolean;
  zebraStriping?: boolean;
  showGridlines?: boolean;
  subtitle?: string;
  companyLogoUrl?: string;
  vectorLogoSvg?: string; // Skalierbare Vektorgrafik (SVG) für verlustfreien PDF/A-Druck
  vectorSignatureSvg?: string; // Vektorbasierte Prüfsignatur ohne Rasterverluste
  logoPosition?: 'left' | 'center' | 'right';
  logoWidth?: number;
  din5008?: Din5008Config;
  commercialVob?: CommercialVobConfig;
  epcQrCode?: EpcQrCodeConfig;
  swissQrCode?: SwissQrCodeConfig;
  zugferd?: ZugferdConfig;
  stationery?: StationeryBackgroundConfig;
  freeformElements?: FreeformCanvasElement[];
  bandSections?: BandSectionConfig;
  thermalPrinter?: ThermalPrinterConfig;
}

export interface DashboardWidget {
  id: string;
  sourceId: string;
  sourceType: 'report' | 'chart' | 'query';
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
}

export interface Report {
  id: string;
  name: string;
  sourceType: 'table' | 'query' | 'dashboard';
  sourceId: string;
  groupingFieldId?: string; // Legacy single group
  groupingFields?: GroupLevel[]; // Multi-level grouping
  columns?: ReportColumn[];
  summaries: ReportSummary[];
  styles?: ReportStyles;
  settings?: ReportSettings;
  subReport?: SubReportConfig;
  chartConfig?: ReportChartConfig;
  freeformElements?: FreeformCanvasElement[];
  dashboardWidgets?: DashboardWidget[];
  allowedRoles?: string[];
}
