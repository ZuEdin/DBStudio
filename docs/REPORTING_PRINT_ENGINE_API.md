# 🖨️ Pixel-Perfect Enterprise Berichts- & Druck-Engine API Documentation

Diese Dokumentation beschreibt die Datenstrukturen, Bänder-Modelle, Barcode-Generierung, Running-Totals-Engines, PDF/A-3 / ZUGFeRD E-Rechnungen und IndexedDB-Persistenz der **Pixel-Perfect Enterprise Reporting & Print Engine**.

---

## 💾 1. IndexedDB Persistence & Print Job Queue API
`features/reports/services/reportIndexedDBService.ts`

Verwaltet Berichts-Entwürfe, Layout-JSONs und Druckaufträge in der lokalen IndexedDB-Datenbank für Offline-Fähigkeit und performanten Zugriff.

### Data Models
```typescript
export interface ReportDraftRecord {
  id: string;
  reportId: string;
  title: string;
  layoutJson: string;
  lastModified: number;
  isPdfACompliant: boolean;
  zugferdEnabled: boolean;
}

export interface PrintJobRecord {
  id: string;
  reportTitle: string;
  printedAt: number;
  pageCount: number;
  status: 'QUEUED' | 'PRINTED' | 'FAILED' | 'EMAILED';
  recipientEmail?: string;
}
```

### Methods
- `saveReportDraftToIndexedDB(draft)`: Speichert Layouts und Entwürfe persistent in IndexedDB.
- `savePrintJobToIndexedDB(job)`: Dokumentiert Druck- und E-Mail-Aufträge.
- `getAllPrintJobsFromIndexedDB()`: Ruft die Historie aller Druckaufträge ab.

---

## 📐 2. Hochentwickeltes Bänder-Modell (Advanced Band Model API)
`features/reports/components/BandModelEditorModal.tsx`

Ermöglicht Millimeter-genaue Steuerung von verschachtelten n-stufigen Gruppen-Bändern, Seitenumbrüchen und Kopfzeilen-Wiederholungen.

```typescript
export interface ReportBand {
  id: string;
  name: string;
  type: 'REPORT_HEADER' | 'PAGE_HEADER' | 'GROUP_HEADER' | 'DETAIL' | 'GROUP_FOOTER' | 'PAGE_FOOTER' | 'REPORT_FOOTER';
  heightMm: number;
  keepTogether: boolean;
  repeatOnEveryPage: boolean;
  forcePageBreakBefore: boolean;
  forcePageBreakAfter: boolean;
}
```

---

## 🧮 3. Running Totals & Page Carried Forward Engine API
`features/reports/utils/runningTotalsEngine.ts`

Berechnet kaufmännische Überträge auf Folgeseiten (*„Übertrag auf nächste Seite“* / *„Übertrag von vorheriger Seite“*), kumulierte Gesamtsummen und prozentuale Anteile.

### Methods
- `calculateRunningTotals(items)`: Gibt Zwischensummen je Gruppe, Seitenüberträge je Seite und laufende Summen zurück.

---

## 🏷️ 4. Barcode & 2D Code Generator API
`features/reports/utils/barcodeGenerator.ts`

Native Vektor-Generierung (SVG) für Industrie- und Finanz-Barcodes.

### Supported Types
- `QR_CODE`: Standard 2D QR-Code.
- `GIRO_CODE`: EPC-QR-Code für SEPA-Überweisungen in der EU.
- `SWISS_QR`: Schweizer QR-Bill (mit Schweizerkreuz).
- `EAN13`: EAN-13 Barcode für Einzelhandel.
- `CODE128`: Code-128 Industriestandard.
- `DATAMATRIX`: 2D DataMatrix für Logistik.
- `PDF417`: PDF417 Stapelcode.

---

## 📑 5. E-Rechnungen (ZUGFeRD 2.2 / XRechnung), PDF/A-3 & E-Mail API
`features/reports/utils/zugferdGenerator.ts` & `features/reports/components/PdfExportWorkflowModal.tsx`

Generiert Cross-Industry Invoice (CII) XML gemäß EN 16931 für ZUGFeRD 2.2 / Factur-X / XRechnung und verwaltet den PDF/A-3 Revisionssicherheits-Export sowie direkten E-Mail-Versand.
