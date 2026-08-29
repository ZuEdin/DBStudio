# Form Designer – Architektur-, Funktions- & Erweiterungs-Blueprint
**System: Enterprise Bausoftware & Kalkulation (MFE-Architektur)**  
*Status: Produkt-Roadmap & Detaillierter Implementierungsleitfaden für Formulare & Form Designer*

---

## 📑 Inhaltsverzeichnis
1. [IST-Zustand & Kernarchitektur des Formular-Systems](#1-ist-zustand--kernarchitektur-des-formular-systems)
2. [Form Designer Ergonomie & Visueller Canvas](#2-form-designer-ergonomie--visueller-canvas)
3. [Bauspezifische Fach- & Eingabe-Komponenten](#3-bauspezifische-fach---eingabe-komponenten)
4. [Low-Code Logik-, Validierungs- & Rechen-Engine](#4-low-code-logik--validierungs---rechen-engine)
5. [Micro Frontend (MFE) Integration & Event-Bus Verträge](#5-micro-frontend-mfe-integration--event-bus-verträge)
6. [Offline-Erfassung & Baustellen-Sync (PWA / Mobile)](#6-offline-erfassung--baustellen-sync-pwa--mobile)
7. [Sicherheit, Rollen (RBAC) & Revisionssicheres Audit-Logging](#7-sicherheit-rollen-rbac--revisionssicheres-audit-logging)
8. [Multi-Framework Code-Generierung (React & Angular)](#8-multi-framework-code-generierung-react--angular)
9. [Priorisierte TODO-Liste & Umsetzungs-Phasen](#9-priorisierte-todo-liste--umsetzungs-phasen)

---

## 🟢 1. IST-Zustand & Kernarchitektur des Formular-Systems

### 1.1 Vorhandene Basisfunktionen
- [x] **Hierarchischer Layout-Baum (`FormElement`)**:
  - Verschachtelbare Container (`container`), responsive Breiten (`1/12` bis `full` / 12-Spalten-Raster).
  - Registerkarten (`tabs`, `tab_page`) und Spalten-Layouts (`columns_2`, `columns_3`).
- [x] **Master-Detail & Subformulare (`subform`)**:
  - Einbettung von 1:n Unterformularen mit automatischer Verknüpfung über `masterLinkFieldId` und `childLinkFieldId`.
  - Konfigurierbare Rechte für Hinzufügen (`canAdd`), Bearbeiten (`canEdit`) und Löschen (`canDelete`).
- [x] **Nachschlagefelder (`lookup`)**:
  - Dynamische ComboBoxen / Dropdowns mit Verknüpfung zu Fremdtabellen, benutzerdefiniertem Anzeigeformat (`displayFormat`) und Schnell-Neuanlage (`allowQuickCreate`).
- [x] **Split-View / Stammdaten-Navigation (`FormSettings`)**:
  - Linke Datensatz-Navigationsliste mit Volltext-Filterung, Tastatur-Shortcuts (Pfeiltasten, `Strg+S`, `Strg+N`) und Detailansicht rechts.
- [x] **Aktions- & Makro-Trigger (`ActionFlow` & `FormEventHandler`)**:
  - Ereignisbehandlung für `OnClick`, `OnChange`, `OnCurrent`, `BeforeUpdate`, `AfterUpdate`.
  - Ausführung von Makros, Toast-Meldungen, Modalen Dialogen und API-Calls.

---

## 🎨 2. Form Designer Ergonomie & Visueller Canvas

Der Formular-Designer ermöglicht die visuelle Gestaltung von ergonomischen Eingabemasken für Büro- und Baustellenanwender:

### 2.1 Drag & Drop Layout-Editor
- [ ] **Visuelles 12-Spalten-Raster mit Live-Dropzones**:
  - Magnetisches Einrasten von Feldern und Labels.
  - Horizontale und vertikale Container mit automatischer Breitenberechnung.
- [ ] **Multi-Selection & Batch-Styling**:
  - Mehrfachauswahl von Feldern mit `Shift+Klick` oder Rahmen-Aufziehen.
  - Gemeinsames Ausrichten (Linksbündig, Rechtsbündig, Gleiche Breite, Gleicher Abstand).
- [ ] **Akkordeon- & Collapse-Sektionen**:
  - Einklappbare Formulargruppen für umfangreiche Stammdaten (z. B. "Kaufmännische Daten", "Zahlungsbedingungen", "VOB-Klauseln").
- [ ] **Dynamischer Ribbon FormDesignTab**:
  - Direkte Werkzeuge für Feldplatzierung, Container, Tabs, Aktionsbuttons und Validierungsregeln im Ribbon-Menü.

---

## 🏗️ 3. Bauspezifische Fach- & Eingabe-Komponenten

Für ein vollwertiges Baukalkulations- und ERP-System benötigt der Form Designer spezialisierte Widgets:

### 3.1 Baukaufmännische Spezial-Widgets
- [ ] **LV- & Positions-Picker (Katalog / GAEB)**:
  - Intelligente Nachschlage-Maske mit Volltextsuche nach Kurztext, Langtext und DIN 276 Kostengruppen.
- [ ] **Aufmaß-Schnelleingabe-Grid**:
  - Direkte Eingabezeilen für `Position | Formel / Rechenansatz | Menge | Einheit | Faktor`.
- [ ] **Kaufmännische Währungs- & Rundungsfelder**:
  - Automatische Formatierung (`12.345,67 €`), VOB/B Mehrwertsteuer-Splitting und Nachkommastellen-Präzision (bis 4 Dezimalstellen für Kalkulationsfaktoren).
- [ ] **DIN 5008 Adress-Block Widget**:
  - Standardisiertes 8-zeiliges Anschriftenfeld (Zusatz-, Vermerkzone, Anschriftzone) mit automatischer PLZ/Ort-Prüfung.

### 3.2 Baustellen- & Mobile-Erfassung
- [ ] **Digitale Unterschrift (Signature Pad)**:
  - Touch- und Stift-fähiges Signaturfeld für Baustellenabnahmen, Regieberichte und Stundenzettel mit Zeitstempel und Hash-Prüfsumme.
- [ ] **Foto- & Dokumenten-Upload mit Planmarker**:
  - Upload von Baustellenfotos direkt aus der Kamera, Zuweisung von Mangel-Kategorien und Pin-Platzierung auf PDF-Bauplänen.
- [ ] **GPS-Standort & Baustellen-Geocoding**:
  - Ein-Klick-Übernahme der aktuellen GPS-Koordinaten und Adress-Rückwärtsauflösung.
- [ ] **Barcode & QR-Code Scanner**:
  - Kamera-basierter Scanner für Lieferschein-Barcodes, EAN-13 Materialcodes und Geräte-Inventar-Tags.

---

## 🧠 4. Low-Code Logik-, Validierungs- & Rechen-Engine

### 4.1 Live Formel- & Rechen-Engine (Computed Fields)
- [ ] **Echtzeit-Berechnung abhängiger Felder**:
  - Syntax: `= [Menge] * [Einheitspreis] * (1 - [RabattProzent] / 100)`
  - Automatische Aktualisierung bei Feldänderung ohne Server-Roundtrip.
- [ ] **Summen- & Aggregat-Felder über Subformulare**:
  - Syntax: `= SUM(Subform.Positionen.Gesamtpreis)` oder `= COUNT(Subform.Mängel.Id)`.

### 4.2 Bedingte Sichtbarkeit & Feldsperren (Dynamic UI)
- [ ] **Regelbasierte Sichtbarkeit (`VisibleIf`)**:
  - Ein-/Ausblenden von Feldern oder ganzen Tabs basierend auf Feldwerten (z. B. "Bürgschaftsdetails nur anzeigen, wenn `Sicherheitseinbehalt > 0`").
- [ ] **Regelbasierte Bearbeitbarkeit (`EnabledIf` / `ReadOnlyIf`)**:
  - Sperren von Rechnungsfeldern, sobald der Status auf `"Freigegeben"` oder `"Abgerechnet"` wechselt.

### 4.3 Kaskadierende Dropdowns & abhängige Lookups
- [ ] **Hierarchische Filterung**:
  - Auswahl `Gewerk` filtert die verfügbaren Optionen in `Leistungsgruppe` -> filtert `Positionen`.

### 4.4 Feldübergreifende Validierung (Cross-Field Validation)
- [ ] **Erweiterte Konsistenzprüfungen**:
  - Prüfregeln wie `Enddatum >= Startdatum` oder `SkontoFristTage < NettoFristTage`.
  - Mehrstufige Fehlermeldungen: **Warnung** (gelb, speicherbar mit Begründung) vs. **Fehler** (rot, blockiert Speichern).

---

## ⚡ 5. Micro Frontend (MFE) Integration & Event-Bus Verträge

Formulare fungieren als zentrale Interaktionsknotenpunkte innerhalb der MFE-Architektur. Sie kommunizieren über strikte Event-Bus-Payloads:

```
┌────────────────────────────────────────────────────────┐
│                   Global MFE Event-Bus                 │
├─────────────────┬──────────────────┬───────────────────┤
│  CRM Frontend   │  Calc Frontend   │ Billing Frontend  │
└────────┬────────┴────────┬─────────┴─────────┬─────────┘
         │                 │                   │
         ▼                 ▼                   ▼
┌────────────────────────────────────────────────────────┐
│            Form View & Form Designer Engine            │
└────────────────────────────────────────────────────────┘
```

### 5.1 Standardisierte Formular-Events

#### 1. `FORM_LOAD_RECORD` (Datensatz laden)
```typescript
eventBus.publish('FORM_LOAD_RECORD', {
  formId: 'form_bauprojekt_detail',
  recordId: 'PRJ-2026-0814',
  mode: 'edit', // 'view' | 'edit' | 'create'
  initialValues: { status: 'In Planung' }
});
```

#### 2. `FORM_RECORD_SAVED` (Nach erfolgreichem Speichern)
```typescript
eventBus.publish('FORM_RECORD_SAVED', {
  formId: 'form_bauprojekt_detail',
  tableId: 'tab_projekte',
  recordId: 'PRJ-2026-0814',
  changedFields: ['budget', 'fertigstellung_soll'],
  fullRecord: { /* ... */ }
});
```

#### 3. `FORM_ACTION_TRIGGERED` (Benutzerdefinierte Schaltfläche)
```typescript
eventBus.publish('FORM_ACTION_TRIGGERED', {
  formId: 'form_rechnungsfreigabe',
  actionName: 'APPROVE_INVOICE_VOB',
  recordId: 'INV-2026-0042',
  contextUser: 'bauleiter_nord'
});
```

---

## 📱 6. Offline-Erfassung & Baustellen-Sync (PWA / Mobile)

- [ ] **Lokales IndexedDB Draft-Caching**:
  - Automatisches Zwischenspeichern ungespeicherter Formulardaten im Browser-Cache gegen Datenverlust bei Verbindungsabbruch.
- [ ] **Offline-Queue für Datensatz-Änderungen**:
  - Erfassung von Bautagesberichten und Mängeln ohne Internetverbindung; automatische Synchronisation beim Wiederherstellen der Verbindung.
- [ ] **Konflikterkennung & Merging (Optimistic Locking)**:
  - Erkennung von Versionskonflikten anhand eines `version` / `updated_at` Zeitstempels mit Side-by-Side Diff-Dialog.

---

## 🔒 7. Sicherheit, Rollen (RBAC) & Revisionssicheres Audit-Logging

- [ ] **Feld-Ebene Berechtigungen (Field-Level Security)**:
  - Deklaration von Lese- und Schreibrechten pro Feld (`allowedReadRoles`, `allowedWriteRoles`), z. B. Kalkulationsaufschläge nur für Rolle `Kalkulator` sichtbar.
- [ ] **Revisionssicheres Audit-Log pro Feldänderung**:
  - Lückenlose Aufzeichnung: `Wer` hat `welches Feld` von `Wert Alt` auf `Wert Neu` zu welchem `Zeitpunkt` geändert?
- [ ] **4-Augen-Freigabe-Workflow**:
  - Formularfelder für Freigaben können nur von berechtigten Prüfern mit digitalem Freigabe-Stempel signiert werden.

---

## 💻 8. Multi-Framework Code-Generierung (React & Angular)

- [ ] **React Export (`React Hook Form` + `Zod` Schema)**:
  - Generierung von sauberem TypeScript-Code mit Tailwind-CSS und voller Validierungstypisierung.
- [ ] **Angular Standalone Component Export**:
  - Export als Angular 18+ Reactive Forms Komponente mit Typed Forms (`FormGroup`, `FormControl`) und Signals.
- [ ] **Ausfüllbarer PDF-Formular-Export (AcroForm)**:
  - Export des Formularlayouts als druckfähiges und digital ausfüllbares PDF-Dokument.

---

## 📋 9. Priorisierte TODO-Liste & Umsetzungs-Phasen

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     FORM DESIGNER ROADMAP PHASEN                         │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────┤
│  PHASE 1     │  PHASE 2     │  PHASE 3     │  PHASE 4     │  PHASE 5     │
│  Ergonomie & │  Baufach-    │  Logik &     │  MFE-Bus &   │  Code-Export │
│  Ribbon-Sync │  Widgets     │  Formeln     │  Offline     │  & PDF-Form  │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

### 🔹 Phase 1: Designer-Ergonomie & Ribbon-Integration
- [x] Grundlegende Formular-Renderer & Subform-Hierarchie.
- [ ] Vollständige Ribbon-Anbindung im `FormDesignTab` (Controls, Formatierung, Tools, Aktionen).
- [ ] Visueller Drag & Drop Re-Order & Spalten-Resizing im Designer.
- [ ] Multi-Tab-Seiten (`tab_page`) Verwaltung im Designer-Baum.

### 🔹 Phase 2: Bauspezifische Fach-Widgets
- [ ] Digitale Signatur (`SignaturePadWidget`).
- [ ] Foto-Upload mit Markern (`BlueprintPhotoMarkerWidget`).
- [ ] DIN 5008 Adressblock-Komponente (`Din5008AddressWidget`).
- [ ] GPS-Standort & Geocoding-Komponente (`GeoLocationWidget`).

### 🔹 Phase 3: Rechen-Engine & Dynamik
- [ ] Parser für berechnete Felder (`=[Menge]*[EP]`).
- [ ] Dynamische `VisibleIf` und `ReadOnlyIf` Regelauswertung im laufenden Formular.
- [ ] Kaskadierende Dropdown-Filterung (Dependent Lookups).

### 🔹 Phase 4: MFE Event-Bus & Offline-Sync
- [ ] Globales Event-Bus Protokoll für `FORM_LOAD_RECORD`, `FORM_RECORD_SAVED`.
- [ ] IndexedDB Draft-Speicher für lückenlose Offline-Fähigkeit.
- [ ] Optimistic Locking & Konflikt-Dialog bei gleichzeitiger Bearbeitung.

### 🔹 Phase 5: Governance & Code-Generierung
- [ ] Field-Level RBAC & Audit-Trail Protokollierung.
- [ ] React Hook Form + Zod Generator.
- [ ] Angular Standalone Reactive Form Generator.
