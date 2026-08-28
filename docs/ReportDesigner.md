# Report Designer – Architektur-, Layout- & Erweiterungs-Blueprint
**System: Enterprise Bausoftware, Druckausgabe & PDF-Reporting (MFE-Architektur)**  
*Status: Produkt-Roadmap & Detaillierte Implementierungs-Checkliste*

---

## 📑 Inhaltsverzeichnis
1. [🟢 1. IST-Zustand & Vorhandene Basisfunktionen](#-1-ist-zustand--vorhandene-basisfunktionen)
2. [📄 2. Band-Modell & Sektions-Architektur (Banded Report Engine)](#-2-band-modell--sektions-architektur-banded-report-engine)
3. [📑 3. DIN 5008 / Baugewerbe Briefbogen & Geschäftsbrief-Engine](#-3-din-5008--baugewerbe-briefbogen--geschäftsbrief-engine)
4. [💶 4. Kaufmännische Summen-, Übertrag- & GAEB-Zwischensummen-Engine](#-4-kaufmännische-summen--übertrag---gaeb-zwischensummen-engine)
5. [📦 5. Sub-Reports, Verknüpfungen & n-Ebenen Hierarchien](#-5-sub-reports-verknüpfungen--n-ebenen-hierarchien)
6. [🔲 6. Barcode-, QR-Code- & ZUGFeRD / XRechnung-Engine](#-6-barcode--qr-code---zugferd--xrechnung-engine)
7. [🎨 7. Visueller Pixel-Perfect Drag & Drop Designer (Freeform Canvas)](#-7-visueller-pixel-perfect-drag--drop-designer-freeform-canvas)
8. [🖨️ 8. Druck-, Paginierungs- & PDF-Export-Engine](#-8-druck--paginierungs---pdf-export-engine)
9. [⚡ 9. Micro Frontend (MFE) Export & Druck-Service Integration](#-9-micro-frontend-mfe-export--druck-service-integration)
10. [📅 10. Priorisierte Umsetzungs-Phasen & Roadmap](#-10-priorisierte-umsetzungs-phasen--roadmap)

---

## 🟢 1. IST-Zustand & Vorhandene Basisfunktionen

- [x] **Datenquellen-Anbindung**:
  - [x] Direktanbindung an **Tabellen** (`table`) oder **SELECT-Abfragen** (`query`).
- [x] **Spalten- & Feldkonfiguration**:
  - [x] Spaltenauswahl, Sichtbarkeits-Toggle (`visible: boolean`), Beschriftungen (`label`), Spalten-Reihenfolge per Drag & Drop.
  - [x] Render-Typen: `text`, `currency`, `date`, `badge`, `qrcode`, `barcode`, `image`.
- [x] **Hierarchische Gruppierung & Summen**:
  - [x] Mehrstufige Gruppierungsebenen (`GroupLevel`) mit konfigurierbarem Gruppen-Header & Gruppen-Footer.
  - [x] Aggregationen: `SUM`, `COUNT`, `AVG`, `MIN`, `MAX` (pro Gruppe und als Gesamtsumme).
- [x] **Basis-Styling & Layout**:
  - [x] Typografie (Schriftfamilie, Schriftgröße, Farben, Fett, Kursiv, Textausrichtung).
  - [x] Bedingte Formatierung (`FormattingRule`: z. B. bei Betrag > 5000 ➔ rote Schrift).
  - [x] Firmenlogo-Upload, Seitenorientierung (Hochformat / Querformat), Zebra-Streifen (`zebraStriping`).
- [x] **Sub-Reports & Diagramme**:
  - [x] Basis-Einbettung von Sub-Reports (`SubReportConfig`) über Eltern/Kind-Schlüssel.
  - [x] Integriertes Balken-, Linien- oder Kreisdiagramm (`ReportChartConfig`).
- [x] **Export-Optionen**:
  - [x] PDF-Generierung via `jsPDF` + `jspdf-autotable`.
  - [x] Excel-Export (`.xlsx`) via `SheetJS/xlsx`.
  - [x] Browser-Druckansicht (`window.print()`).

---

## 📄 2. Band-Modell & Sektions-Architektur (Banded Report Engine)

Im Enterprise-Reporting (insbesondere bei Rechnungen, Leistungsverzeichnissen und Bautagebüchern) reicht ein einfaches Tabellenlayout nicht aus. Benötigt wird eine **Banded Report Engine** mit strikt getrennten Sektionen:

### 2.1 Sektions-Hierarchie
- [ ] **Berichtskopf (Report Header)**:
  - Wird genau **einmal** ganz am Anfang des Gesamtdokuments gedruckt (z. B. Deckblatt, Projekt-Titelbild, Anschreiben).
- [ ] **Seitenkopf (Page Header)**:
  - Wird oben auf **jeder Seite** wiederholt (z. B. Minilogo, Projektname, Bauvorhaben, Datum, Spaltenüberschriften).
- [ ] **Gruppenkopf (Group Header - Ebene n)**:
  - Beginnt bei jedem Gruppenwechsel (z. B. `Gewerk 01 - Rohbauarbeiten`, `Titel 02 - Erdarbeiten`).
  - Option: *"Auf jeder Folgeseite wiederholen, falls Gruppe umbrochen wird"* (`RepeatOnEveryPage`).
  - Option: *"Neue Seite bei Gruppenwechsel beginnen"* (`PageBreakBefore`).
- [ ] **Detail-Bereich (Detail Band)**:
  - Wird für jeden einzelnen Datensatz / jede LV-Position gedruckt.
  - Dynamische Zeilenhöhe (Textumbruch für lange Leistungsbeschreibungen).
  - Option: *"Zeile nicht trennen"* (`KeepTogether` – verhindert halbe Zeilen am Seitenende).
- [ ] **Gruppenfuß (Group Footer - Ebene n)**:
  - Summenzeile der Gruppe (z. B. `Summe Titel 02: 48.250,00 €`).
- [ ] **Seitenfuß (Page Footer)**:
  - Wird unten auf **jeder Seite** gedruckt (z. B. Seitenzahl `"Seite X von Y"`, Druckdatum, Bearbeiter).
- [ ] **Berichtsfuß (Report Footer)**:
  - Wird genau **einmal** am Ende des Gesamtdokuments gedruckt (z. B. Gesamtsumme Netto/MwSt/Brutto, Skontovermerk, Zahlungsbedingungen, Unterschriftsfelder).

---

## 📑 3. DIN 5008 / Baugewerbe Briefbogen & Geschäftsbrief-Engine

Für rechtskonforme Angebote, Rechnungen und Bautagesberichte nach deutschem Standard:

### 3.1 DIN 5008 Konformität (Form A / Form B)
- [ ] **Absenderzeile (Rücksendeangabe)**:
  - Einzeilige Mini-Absenderzeile im Adressfenster (Schriftgröße 7-8pt): `Musterbau GmbH • Baustraße 1 • 10115 Berlin`.
- [ ] **Empfänger-Adressfeld (Fensterbriefumschlag C4/C5)**:
  - Exakte Positionierung nach DIN 5008 (45mm x 85mm; Abstand von oben: Form A 27mm, Form B 45mm).
  - Zusatz-/Vermerkzone (z. B. `Einschreiben`, `Elektronische Vorabmitteilung`).
- [ ] **Infoblock / Bezugszeichenblock (Rechts)**:
  - Rechtsbündiger oder tabellarischer Block mit:
    - *Unser Zeichen / Bearbeiter*
    - *Ihre Kundennummer / Rechnungsnummer*
    - *Projekt- / Baustellen-Nr.*
    - *Datum / Leistungszeitraum*
    - *Telefon / E-Mail*
- [ ] **Dreispaltiger Firmen-Geschäftsfuß (Footer)**:
  - Spalte 1: Firmensitz, Registergericht, HRB-Nummer, Geschäftsführer.
  - Spalte 2: Bankverbindung, IBAN, BIC, Bankname.
  - Spalte 3: Steuernummer, USt-IdNr., Gläubiger-ID.

---

## 💶 4. Kaufmännische Summen-, Übertrag- & GAEB-Zwischensummen-Engine

Im Baugewerbe und bei mehrseitigen Rechnungen ist die korrekte Seitenübertragsrechnung zwingend vorgeschrieben:

### 4.1 Seitenübertrag (Carry-Over / Page Totals)
- [ ] **Übertrag am Seitenende (Bottom Carry-Over)**:
  - Automatische Berechnung: `"Übertrag auf Seite (N+1): 124.500,00 €"`.
- [ ] **Übertrag am Seitenanfang (Top Carry-Over)**:
  - Automatische Wiederholung auf Folgeseite: `"Übertrag von Seite N: 124.500,00 €"`.
- [ ] **GAEB-Hierarchie-Summen**:
  - `Summe Position` ➔ `Summe Untertitel` ➔ `Summe Titel` ➔ `Summe Los` ➔ `Summe Gewerk` ➔ `Gesamtsumme Angebot`.
- [ ] **Umsatzsteuer-Aufschlüsselung (Multi-Tax Matrix)**:
  - Automatische Tabelle im Rechnungsfuß nach Steuersätzen:
    - Netto 19% (z. B. Material/Leistung): `100.000,00 €` ➔ MwSt: `19.000,00 €`
    - Netto 7% (z. B. Sonderleistungen): `5.000,00 €` ➔ MwSt: `350,00 €`
    - Netto 0% (§13b UStG Bauleistungen / Steuerschuldnerschaft): `50.000,00 €` ➔ MwSt: `0,00 €`
    - **Gesamtbetrag Brutto**: `174.350,00 €`
- [ ] **Sicherheitseinbehalt & Abzüge**:
  - Automatische Abzugsberechnung:
    - `- 5% Gewährleistungseinbehalt (VOB/B)`
    - `- 1% Bauwesenversicherung / Baustrom`
    - `- Geleistete Abschlagszahlungen (1. bis 3. Abschlag)`
    - `= Verbleibender Zahlbetrag`.

---

## 📦 5. Sub-Reports, Verknüpfungen & n-Ebenen Hierarchien

Ermöglicht verschachtelte Dokumente wie z. B. **Rechnung mit integriertem Aufmaßblatt** oder **Projektbericht mit Mängelprotokoll**:

- [ ] **Master-Detail Verknüpfung**:
  - Übergabe von Primärschlüsseln aus dem Hauptbericht an den Sub-Report (`MasterField: "id" -> ChildField: "invoice_id"`).
- [ ] **Inline- vs. Block-Sub-Reports**:
  - *Inline-Sub-Report*: Rendert direkt innerhalb des Detail-Bandes einer Position (z. B. Stückliste/Kalkulationsansatz zu einer LV-Position).
  - *Nachgelagerter Sub-Report*: Beginnt auf einer neuen Seite nach dem Hauptdokument (z. B. Anhang, AGBs, Fotodokumentation).
- [ ] **Unabhängige Spaltenraster im Sub-Report**:
  - Hauptbericht mit 4 Spalten, Sub-Report mit 8 Spalten ohne Layout-Kollision.

---

## 🔲 6. Barcode-, QR-Code- & ZUGFeRD / XRechnung-Engine

- [ ] **EPC-QR-Code (GiroCode)**:
  - Automatisches Generieren des europäischen Standard-Bank-QR-Codes im Rechnungsfuß.
  - Ermöglicht dem Kunden das sekundenschnelle Bezahlen per Banking-App ohne Tippfehler bei IBAN/Betrag/Verwendungszweck.
- [ ] **Schweizer QR-Rechnung (Swiss QR Code)**:
  - QR-Bill Zahlteil nach Schweizer Standard mit Zahlungsreferenz (QRR) und Kreuz im Zentrum.
- [ ] **Industrie-Barcodes**:
  - `Code 128`, `Code 39`, `EAN-13`, `DataMatrix` (z. B. für Lieferschein-Nummern, Inventar-Tags und Materialetiketten).
- [ ] **E-Rechnung (ZUGFeRD 2.2 / XRechnung Factur-X)**:
  - Generierung von hybriden **PDF/A-3** Dokumenten mit eingebetteter `factur-x.xml`.
  - Pflicht ab 2025/2026 für B2B-Geschäftsverkehr in Deutschland und Europa.

---

## 🎨 7. Visueller Pixel-Perfect Drag & Drop Designer (Freeform Canvas)

Erweiterung von der reinen Spalten-Tabelle hin zum vollwertigen visuellen Dokumenten-Gestalter:

- [ ] **Frei platzierbare Report-Elemente**:
  - [ ] **Textfeld / Label**: Statischer Text oder dynamische Datenbindung (`{{ Kunde.Firma }}`).
  - [ ] **Rechteck / Rahmen / Trennlinien**: Dekorative Boxen, Hintergrundflächen, Signaturlinien.
  - [ ] **Bild / Logo**: Firmenlogos, Stempel, Prüfsiegel, Unterschriften.
  - [ ] **Formel-Container**: `SUM()`, Datumsausdrücke, String-Verkettung.
  - [ ] **Rich-Text / HTML-Block**: Formatierte Leistungsbeschreibungen mit Fettdruck, Listen und Absätzen.
- [ ] **Ausrichtungs- & Layout-Hilfen**:
  - [ ] Millimeter-/Punkt-Lineal (A4: 210mm x 297mm).
  - [ ] Magnetische Fanglinien (Snap-to-Grid & Snap-to-Object).
  - [ ] Ausrichtungs-Werkzeuge (Links-, Rechts-, Zentriert-, Oben-, Untenbündig, Gleichmäßiger Abstand).

---

## 🖨️ 8. Druck-, Paginierungs- & PDF-Export-Engine

- [ ] **Perfekte PDF-Seitenumbruch-Kontrolle**:
  - [ ] Waisen- und Witwenkontrolle (Verhindert einzelne Zeilen am oberen/unteren Seitenrand).
  - [ ] Unterschriftenfeld darf nicht isoliert auf einer leeren letzten Seite stehen (`KeepWithNext`).
- [ ] **Dynamische Paginierung**:
  - [ ] `"Seite {PAGE_NUM} von {TOTAL_PAGES}"` (Zweiphasen-Rendering).
- [ ] **Hintergrund-Briefpapier (Stationery Overlay / Underlay)**:
  - [ ] Einbinden eines hochauflösenden PDF-Briefbogens als Hintergrund (Wasserzeichen / Firmenlayout).
  - [ ] Getrenntes Briefpapier für *Seite 1* (mit Logo/Briefkopf) und *Folgeseiten* (schlichter Kopf).
- [ ] **Archivierungsstandard PDF/A-1b & PDF/A-3b**:
  - [ ] Vollständige Einbettung aller Schriften (Font Embedding).
  - [ ] Konformität für revisionssichere Langzeitarchivierung (GoBD).

---

## ⚡ 9. Micro Frontend (MFE) Export & Druck-Service Integration

- [ ] **MFE Print-Event-Bus**:
  - [ ] Senden von Druckaufträgen aus anderen Micro Frontends:
    ```typescript
    eventBus.publish({
      type: 'PRINT_REPORT',
      payload: {
        reportId: 'rep_schlussrechnung_vob',
        parameters: { invoiceId: 'INV-2026-0042' },
        outputFormat: 'pdf_download' // 'print_dialog' | 'blob_stream'
      }
    });
    ```
- [ ] **Headless PDF Generation Service (Server-Side)**:
  - [ ] Node.js / Puppeteer / PDFKit Backend-Endpunkt: `POST /api/reports/render-pdf` für automatisierte Hintergrund-Generierung und nächtlichen Rechnungsversand.
- [ ] **E-Mail-Versand-Integration**:
  - [ ] Direktes Versenden des generierten PDF-Berichts als E-Mail-Anhang an Kunden/Nachunternehmer.

---

## 📅 10. Priorisierte Umsetzungs-Phasen & Roadmap

| Phase | Fokusbereich | Konkrete Implementierungs-Schritte |
| :--- | :--- | :--- |
| **Phase 1** | *Banded Sections & DIN 5008* | • Sektionen: ReportHeader, PageHeader, GroupHeader, Detail, GroupFooter, PageFooter, ReportFooter<br>• DIN 5008 Briefkopf, Adressfeld & 3-spaltiger Firmenfuß |
| **Phase 2** | *Carry-Over & VOB Totals* | • Seitenübertrag oben/unten ("Übertrag auf Seite X")<br>• Mehrwertsteuer-Splitting (19%, 7%, §13b)<br>• Sicherheitseinbehalt & VOB-Abzüge |
| **Phase 3** | *Payment QR & Barcodes* | • EPC-QR-Code (GiroCode) für Rechnungen<br>• Code 128 / DataMatrix Barcode-Renderer |
| **Phase 4** | *Freeform Canvas & Tools* | • Pixelgenaues Verschieben von Textboxen, Linien und Bildern per Drag & Drop<br>• Snap-to-Grid & Ausrichtungs-Lineale (mm/pt) |
| **Phase 5** | *Sub-Reports & Enclosures* | • Verschachtelte Master-Detail Sub-Reports<br>• Aufmaßblätter, Fotodokumentation & AGB-Anhänge |
| **Phase 6** | *ZUGFeRD & Background PDF* | • ZUGFeRD 2.2 / XRechnung XML-Einbettung (PDF/A-3)<br>• Hintergrund-Briefpapier (PDF-Underlay für Seite 1 / Folgeseiten)<br>• Headless Server-Side Rendering Service |
