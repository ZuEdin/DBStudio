# Page Designer – Architektur-, Funktions- & Erweiterungs-Blueprint
**System: Enterprise Bausoftware & Kalkulation (MFE-Architektur)**  
*Status: Produkt-Roadmap & Detaillierter Implementierungsleitfaden*

---

## 📑 Inhaltsverzeichnis
1. [IST-Zustand & Kernarchitektur](#1-ist-zustand--kernarchitektur)
2. [Bauspezifische Fach- & Kalkulations-Engines](#2-bauspezifische-fach---kalkulations-engines)
3. [Micro Frontend (MFE) Integration & Event-Bus](#3-micro-frontend-mfe-integration--event-bus)
4. [Low-Code Logik-Engine, Workflows & Formel-Parser](#4-low-code-logik-engine-workflows--formel-parser)
5. [Enterprise Tabellen- & Daten-Raster (High-Density Data Grid)](#5-enterprise-tabellen---daten-raster-high-density-data-grid)
6. [Formular-, Validierungs- & Eingabe-Komponenten](#6-formular--validierungs---eingabe-komponenten)
7. [Dokumenten-, PDF- & Druckvorlagen-Designer](#7-dokumenten--pdf---druckvorlagen-designer)
8. [Sicherheit, RBAC, Governance & Compliance](#8-sicherheit-rbac-governance--compliance)
9. [Multi-Framework Code-Generierung (React & Angular Signals)](#9-multi-framework-code-generierung-react--angular-signals)
10. [Designer-Ergonomie, Canvas-Tools & AI-Copilot](#10-designer-ergonomie-canvas-tools--ai-copilot)
11. [Priorisierte Umsetzungs-Phasen (Roadmap)](#11-priorisierte-umsetzungs-phasen-roadmap)

---

## 🟢 1. IST-Zustand & Kernarchitektur

### 1.1 Vorhandene Basisfunktionen
- [x] **Visuelle Hierarchie & Tree-Engine**: Verschachtelbare Komponenten-Knoten (`container`, `card`, `tabs_container`, `subform`, `subpage_container`, `list_repeater`, `grid_layout`).
- [x] **Datenbindung & Kontext-Auflösung**: Rekursiver Platzhalter-Parser (`resolvePlaceholders`, `compilePlaceholders`, `compileAngularPlaceholders`) mit Case-Insensitive Matching (z. B. `{{rechnungsdatum}}`, `{{Rechnungsdatum}}`, `{{row.kunde.name}}`).
- [x] **Formatierungs-Pipes**: Bereinigung und Formatierung von SQL Server / C# 7-stelligen ISO-Timestamps (`2026-02-01T00:00:00.0000000` -> `01.02.2026`), Währungen (`currency`), Zahlen und Text-Transformationen.
- [x] **Interaktive Tabellen (`table_view` / `CustomTableViewRunner`)**:
  - Dynamische Spaltenkonfiguration, Pagination, Sortierung und Suchleiste.
  - Entkoppelte Zeilen-Trigger: **Einfachklick** für lokale visuelle Selektion vs. **Doppelklick** für Detailseiten-Navigation & `selectedId`-Parameter-Synchronisation.
- [x] **Master-Detail Subformulare**: 1:n Verknüpfungen mit Fremdschlüsseln (`foreignKeyField`).
- [x] **Code-Export**: Vollständiger Komponenten-Export für **React (Tailwind)** und **Angular (Standalone Component)**.

---

## 🏗️ 2. Bauspezifische Fach- & Kalkulations-Engines

Für ein vollwertiges Baukalkulations- und ERP-System benötigt der Page Designer spezialisierte Fachkomponenten, die über Standard-Formulare hinausgehen:

### 2.1 Leistungsverzeichnis-Explorer & Hierarchie-Grid (LV-Tree)
- [ ] **Hierarchische Ordnungszahlen (OZ)**:
  - Darstellung von Titeln, Losen, Unterbeschreibungen, Normalpositionen, Grund-/Wahlpositionen, Eventualpositionen und Zulagepositionen (z. B. `01.02.0030`).
- [ ] **GAEB XML / ÖNORM / DATANORM Viewer & Editor**:
  - Drag & Drop Import von GAEB-Dateien (X83 Angebotsaufforderung, X84 Angebotsabgabe, X86 Auftrags-LV).
  - Native Anzeige von Langtexten, Kurztexten und Einheitspreisen.
- [ ] **Mengenermittlung & Aufmaßblatt (REB 23.003 / Freies Aufmaß)**:
  - Formelbasierte Mengenberechnung pro Position (z. B. `Länge * Breite * Höhe - Abzüge`).
  - Zeilenweise Dokumentation mit Bauteilzuordnung und Aufmaß-Status (Freigegeben / Vorläufig).

### 2.2 EKT-Kalkulationsmatrix (Einzelkosten der Teilleistungen)
- [ ] **Kalkulations-Splitter nach Kostenarten**:
  - Aufteilung jeder Position in: **Lohn (L)**, **Stoff/Material (M)**, **Geräte (G)**, **Sonstiges (S)**, **Nachunternehmer (NU)**.
- [ ] **Zuschlagskalkulation (Gemeinkosten & Deckungsbeitrag)**:
  - Zuschlagssätze für Baustellengemeinkosten (BGK), Allgemeine Geschäftskosten (AGK) sowie Wagnis & Gewinn (W&G).
  - Berechnung von Endpreisen (EP) und Gesamtbeträgen (GB) mit Live-Update.
- [ ] **Bieter-Preisspiegel & Ausreißer-Analyse**:
  - Matrix-Komponente zum Vergleich mehrerer Nachunternehmer-Angebote mit prozentualer Abweichung zum Richtpreis und farblicher Heatmap (günstigster/teuerster Bieter).

### 2.3 Bautagebuch, Mängel- & Baustellen-Management
- [ ] **Wetter-Widget mit API-Automatik**:
  - Erfassung von Temperatur, Niederschlag und Witterung für den Bautag (relevant für Bedenkenanzeigen).
- [ ] **Kolonnen- & Geräte-Erfassung**:
  - Schnelleingabe anwesender Gewerke, eigener Mitarbeiter und Großgeräte.
- [ ] **Mängel-Tracking mit Foto-Marker**:
  - Bild-Upload-Komponente mit Pin-Drop auf Bauplänen/Grundrissen zur visuellen Verortung von Mängeln.

---

## ⚡ 3. Micro Frontend (MFE) Integration & Event-Bus

In einer skalierbaren Multi-Agenten-Architektur dürfen MFEs (CRM, Articles, Calc, Billing, Shell) nicht direkt voneinander importieren, sondern interagieren über standardisierte Verträge:

```
┌────────────────────────────────────────────────────────┐
│                   Shell / App Container                │
├───────────────┬────────────────┬───────────────────────┤
│   CRM (MFE)   │ Articles (MFE) │  Kalkulation (MFE)    │
└───────┬───────┴────────┬───────┴───────────┬───────────┘
        │                │                   │
        └────────────────┼───────────────────┘
                         ▼
             Globaler Event-Bus (Pub/Sub)
```

### 3.1 Event-Bus Verträge & Konfiguration im Page Designer
- [ ] **Visueller Event-Trigger Editor**:
  - Konfigurieren von Publikationen: z. B. Event `CONSTRUCTION_ARTICLE_SELECTED` mit Payload `{ articleId, unit, ekPrice }`.
  - Konfigurieren von Abonnements: Tabelle oder Formular lauscht auf `PROJECT_CHANGED` und filtert eigene Daten automatisch.
- [ ] **Cross-MFE Drag & Drop Zonen**:
  - Ziehen eines Artikels aus der `Articles`-MFE-Komponente direkt in eine Kalkulations-Zeile der `Calc`-MFE.
  - Konfigurierbare Payload-Mappung: `source.price_ek` -> `target.cost_material`.
- [ ] **Zentrales Session- & Filter-Context Sharing**:
  - Globaler Projekt-Umschalter (z. B. `activeProjectId`) steuert automatisch alle eingebetteten Subpages über Domain-Grenzen hinweg.

---

## 🧮 4. Low-Code Logik-Engine, Workflows & Formel-Parser

### 4.1 Client-Side Expression Engine (Excel-Syntax)
- [ ] **Mathematische & Kaufmännische Formeln**:
  - Syntax: `{{ ROUND(Menge * Einzelpreis * (1 - Rabatt / 100), 2) }}`.
  - Aggregationen: `{{ SUM(Positionen.Gesamtpreis) }}`, `{{ AVG(Messwerte.Druck) }}`.
- [ ] **Konditionale Logik**:
  - `{{ IF(Zahlungsstatus == 'Bezahlt', 'Abgeschlossen', IF(Faelligkeit < TODAY(), 'Überfällig', 'Offen')) }}`.
- [ ] **Datums-Arithmetik**:
  - `{{ DATEADD(Rechnungsdatum, 14, 'days') }}` für automatische Zahlungsziele.

### 4.2 Visueller Action-Flow Builder (Node-Graph)
- [ ] **Ereignis-Kaskaden**:
  - Auslöser: `OnClick`, `OnRowDoubleClick`, `OnFieldChange`, `OnPageLoad`.
  - Aktionen-Pipeline:
    1. `ValidateForm(formId)`
    2. `API_Call(POST /api/invoices, payload)`
    3. `ToastMessage("Erfolgreich gespeichert", "success")`
    4. `CloseModal(modalId)`
    5. `EmitEventBus("INVOICE_CREATED", res.data)`
    6. `ReloadDataset("invoiceList")`
- [ ] **Bedingte Verzweigungen**: Wenn API-Status `200` -> Route wechseln; Wenn `400` -> Validierungsfehler an Feldern markieren.

---

## 📊 5. Enterprise Tabellen- & Daten-Raster (High-Density Data Grid)

Enterprise-Anwender im Bauwesen verlangen extrem performante und flexible Tabellen:

- [ ] **In-Line Cell Editing (Excel-Feeling)**:
  - Direkte Bearbeitung von Preisen, Mengen und Beschreibungen in der Zeile ohne Modal-Öffnung.
  - Tastaturnavigation: Pfeiltasten, `Tab` für nächste Zelle, `Enter` zum Bestätigen.
- [ ] **Virtuelles Scrolling (Virtualization)**:
  - Flüssiges Rendern von über 50.000 Datensätzen mit konstant 60 FPS (DOM-Recycling).
- [ ] **Spalten-Management & Personalisierung**:
  - Drag & Drop Spalten-Reihenfolge.
  - Interaktives Spaltenbreiten-Resizing mit persistenter Speicherung je Benutzer.
  - Column-Picker (Spalten ein-/ausblenden).
  - Sticky/Frozen Columns (z. B. Spalte `Position` und `Aktionen` fixiert beim horizontalen Scrollen).
- [ ] **Mehrstufige Gruppierung & Zwischensummen**:
  - Gruppierung nach Gewerk -> Los -> Titel mit automatischen Zwischensummenzeilen.
- [ ] **1-Klick Daten-Export & Import**:
  - Export nach Excel (.xlsx mit intakten Formeln), CSV, GAEB und JSON.
  - CSV/Excel-Paste: Mehrere Zeilen aus Excel kopieren und direkt in die Tabelle einfügen.

---

## 📝 6. Formular-, Validierungs- & Eingabe-Komponenten

- [ ] **Intelligenter Datepicker mit Fristen- & Feiertagsrechner**:
  - Anzeige von Werktagen (ohne Samstage, Sonn- und Feiertage) für Bauzeitpläne.
  - Von-Bis Bereichsauswahl (Date-Range).
- [ ] **Multi-Select Tag-Picker mit Asynchroner Suche**:
  - Schnellsuche nach Gewerken, Kostenstellen oder Lieferanten mit Chips-Darstellung.
- [ ] **Digitale Unterschrift (Canvas Signature Pad)**:
  - Unterschriftsfeld für Monteure und Kunden auf Baustellen-Tablets mit Export als PNG/SVG/Base64.
- [ ] **Drag & Drop Datei- & Plan-Uploader**:
  - Mehrfach-Upload mit Fortschrittsbalken, Bildkomprimierung und PDF-Vorschau.
- [ ] **Cross-Field Validierungs-Engine**:
  - Relationale Prüfungen: `SkontoFristDatum <= FaelligkeitsDatum`, `RechnungsSumme == SUM(Positionen)`.
  - Regex-Muster (IBAN, USt-IdNr, Steuernummer, Postleitzahl, E-Mail).

---

## 📄 7. Dokumenten-, PDF- & Druckvorlagen-Designer

- [ ] **Pixelgenauer Druckseiten-Designer (A4 Portrait / Landscape)**:
  - Feste Seitenränder, Kopfzeilen mit Firmenlogo und wiederholende Fußzeilen mit Paginierung ("Seite X von Y").
  - Dynamischer Seitenumbruch (Page-Break) bei langen Positionslisten ohne abgeschnittene Zeilen.
- [ ] **Zahlungsverkehr & EPC-QR-Code (GiroCode)**:
  - Automatische Generierung von Bezahl-QR-Codes auf Rechnungen (gemäß EPC-Standard für Banking-Apps).
- [ ] **E-Rechnungs-Konformität (ZUGFeRD / XRechnung)**:
  - Integrierte Validierung und Vorschau für strukturierte XML-Rechnungen (Pflicht im B2B/B2G-Baugeschäft).

---

## 🔐 8. Sicherheit, RBAC, Governance & Compliance

- [ ] **Granulare Rollen- & Berechtigungssteuerung (Field-Level Security)**:
  - Konfigurierbare Rechte pro Komponente oder Spalte:
    - *Vollzugriff (Read/Write)*
    - *Nur Lesen (Read-Only)*
    - *Maskiert (z. B. Einkaufspreis nur für Kalkulatoren sichtbar, Monteure sehen `*** €`)*
    - *Vollständig ausgeblendet*
- [ ] **Revisionssicherheit & Audit Trail**:
  - Automatische Protokollierung jeder Layout-Änderung (Wer hat welche Komponente umgestellt?).
  - Diff-Vergleich zwischen Layout-Versionen mit Rollback-Funktion.
- [ ] **Draft vs. Published Workflow**:
  - Änderungen am Seitenlayout verbleiben im Entwurfsmodus (Draft) und werden erst nach Freigabe für Endanwender aktiv geschaltet.

---

## ⚡ 9. Multi-Framework Code-Generierung (React & Angular Signals)

Der Code-Generator muss sauberen, wartbaren und produktionsreifen Code ausgeben:

### 9.1 Angular Export (Moderne Standalone Architektur)
- [ ] **Signals & WritableSignals**: Generierung von `signal()`, `computed()` und `effect()` für reaktives State Management statt veralteter BehaviorSubjects.
- [ ] **Neue Control-Flow Syntax**: Native Nutzung von `@if`, `@for (item of items; track item.id)`, `@switch`.
- [ ] **Typed Reactive Forms**: Typsichere `FormGroup<{ [key]: FormControl<string> }>` mit Validatoren.
- [ ] **Micro Frontend Module Export**: Bereitstellung als eigenständige Remote-Komponente für Webpack/Vite Module Federation.

### 9.2 React Export (Modernes React 18+ / Next.js)
- [ ] **React Hook Form & Zod Schema**: Automatische Generierung von Zod-Validierungsschemas aus den Designer-Regeln.
- [ ] **TanStack Table (v8) Integration**: Generierung moderner Grid-Konfigurationen mit Sortierung und Pagination.
- [ ] **Tailwind CSS Utility Generation**: Saubere, redundanzfreie Klassen ohne Gradienten oder verbotene UI-Muster.

---

## 🎨 10. Designer-Ergonomie, Canvas-Tools & AI-Copilot

- [ ] **Canvas Zoom, Pan & Mini-Map**:
  - Stufenloser Zoom (50% bis 200%), Verschieben des Arbeitsbereichs (Pan per Leertaste + Drag).
- [ ] **Ausrichtungs- & Multi-Select Werkzeuge**:
  - Mehrfachauswahl von Elementen (`Shift + Klick`), Ausrichten (Links, Zentriert, Gleichmäßiger Abstand).
  - 8px Baseline-Grid mit Snap-to-Grid Hilfslinien.
- [ ] **Undo / Redo Transaktionsspeicher (`Ctrl+Z` / `Ctrl+Y`)**:
  - Volle Historie aller Aktionen mit Tastatur-Shortcuts.
- [ ] **Device Breakpoint Simulator**:
  - Live-Umschaltung zwischen Desktop (1920px), Tablet Baustelle (1024px) und Smartphone (375px).
- [ ] **AI-Copilot (Generative UI Assistant)**:
  - *Prompt-to-Page*: "Erstelle eine Bautagebuch-Detailseite mit Kopfdaten, anwesenden Kolonnen und Mängelliste."
  - *Auto-Mapper*: Automatische Verknüpfung von REST-API-Feldern mit geeigneten UI-Komponenten.
  - *Accessibility-Checker*: Live-Warnung bei unzureichendem Kontrast oder fehlenden Pflichtfeldern.

---

## 📅 11. Priorisierte Umsetzungs-Phasen (Roadmap)

| Phase | Fokusbereich | Kern-Features |
| :--- | :--- | :--- |
| **Phase 1** | *Calculation & Logic* | • Client-Formel-Parser (`{{ Menge * Preis }}`)<br>• Kaskadierende Live-Berechnungen<br>• Undo/Redo Transaktionsspeicher (`Ctrl+Z`) |
| **Phase 2** | *Enterprise Data Grid* | • In-Line Cell Editing<br>• Virtuelles High-Speed Scrolling<br>• Spalten-Resizing & Excel-Export |
| **Phase 3** | *MFE & Event-Bus* | • Visueller Event-Bus Pub/Sub Mapper<br>• Cross-MFE Drag & Drop Verknüpfungen<br>• Session Context Synchronisation |
| **Phase 4** | *Construction Specials* | • GAEB / LV-Hierarchie Explorer<br>• EKT-Kostenarten Matrix (L/M/G/S/NU)<br>• Digitale Kundenunterschrift & Aufmaßblatt |
| **Phase 5** | *Print & Documents* | • A4 Dokumenten-Designer für Angebote & Rechnungen<br>• EPC-GiroCode Generator & XRechnung / ZUGFeRD Preview |
| **Phase 6** | *Security & AI* | • Granulares RBAC auf Feldebene (Maskierung)<br>• AI "Prompt-to-Page" Assistent & Auto-Mapping |
