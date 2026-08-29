# Table Designer – Architektur-, Schema- & Erweiterungs-Blueprint
**System: Enterprise Bausoftware & Kalkulation (MFE-Architektur)**  
*Status: Produkt-Roadmap & Detaillierte Implementierungs-Checkliste*

---

## 📑 Inhaltsverzeichnis
1. [🟢 IST-Zustand & Vorhandene Basisfunktionen](#-1-ist-zustand--vorhandene-basisfunktionen)
2. [📐 2. Erweiterte Feldtypen & Fachdatentypen (Domain Types)](#-2-erweiterte-feldtypen--fachdatentypen-domain-types)
3. [🧮 3. Berechnete Spalten & Formel-Felder (Generated / Computed Columns)](#-3-berechnete-spalten--formel-felder-generated--computed-columns)
4. [🔐 4. Erweiterte Constraints, Indizes & Kaskadierung](#-4-erweiterte-constraints-indizes--kaskadierung)
5. [🛡️ 5. Enterprise Audit-Felder & Soft-Delete (1-Klick-Standard)](#️-5-enterprise-audit-felder--soft-delete-1-klick-standard)
6. [👥 6. Tabellen- & Spalten-Berechtigungen (Field-Level RBAC)](#-6-tabellen---spalten-berechtigungen-field-level-rbac)
7. [🔄 7. Schema-Migrations- & Diff-System (`ALTER TABLE`)](#-7-schema-migrations---diff-system-alter-table)
8. [🏗️ 8. Vordefinierte Branchen-Vorlagen (Industry Blueprints)](#️-8-vordefinierte-branchen-vorlagen-industry-blueprints)
9. [⚡ 9. MFE-Integration & Cross-Table Trigger](#-9-mfe-integration--cross-table-trigger)
10. [📅 10. Priorisierte Umsetzungs-Phasen & Roadmap](#-10-priorisierte-umsetzungs-phasen--roadmap)

---

## 🟢 1. IST-Zustand & Vorhandene Basisfunktionen

- [x] **Grundlegende SQL-Feldtypen**:
  - `TEXT` / `VARCHAR` / `CHAR`
  - `NUMBER` / `INTEGER` / `DECIMAL` / `FLOAT`
  - `BOOLEAN`
  - `DATE` / `DATETIME` / `TIME`
  - `SELECT` / `ENUM`
  - `JSON` / `BLOB`
- [x] **Primärschlüssel-Definition**:
  - Einzelspalten-PK mit konfigurierbarem Auto-Increment / Sequence.
- [x] **Fremdschlüssel-Beziehungen (1:n / 1:1)**:
  - Verknüpfung von Zieltabellen und Zielfeldern (`foreignKeyField`).
- [x] **Multi-Datenbank Schema-Generierung**:
  - DDL-Export für SQLite, MySQL, PostgreSQL, Microsoft SQL Server und IndexedDB.
- [x] **Einfache Validierungsregeln**:
  - `required` (NOT NULL), `unique`, Standardwerte (`DEFAULT`).

---

## 📐 2. Erweiterte Feldtypen & Fachdatentypen (Domain Types)

Standard-SQL-Typen sind im Bau- und ERP-Umfeld oft fehleranfällig. Diese spezialisierten Domain-Types kapseln Datentypen, Validierung und UI-Formatierung:

### 💶 2.1 Kaufmännische & Bau-Spezifische Typen
- [x] **`CURRENCY` / `MONEY` (Währungsfeld)**:
  - [x] Interne Speicherung als exakte Festkommazahl (`DECIMAL(18,4)` bzw. `BIGINT` in Cent/Bruchteilen) zur Vermeidung von IEEE-754 Rundungsfehlern (`0.1 + 0.2 != 0.3`).
  - [x] Konfigurierbare Standardwährung (EUR, CHF, USD) mit Währungssymbol.
  - [x] Automatische kaufmännische Rundung auf 2 Dezimalstellen in der Anzeige.
- [x] **`PERCENTAGE` (Prozentsatz)**:
  - [x] Speicherung als `DECIMAL(8,4)` (z. B. `0.1900` für 19%).
  - [x] UI-Eingabe wahlweise als `19` oder `0.19` mit automatischer Normalisierung.
  - [x] Min/Max-Grenzen (`0%` bis `100%` oder freie Spanne für Nachlässe/Aufschläge).
- [x] **`UNIT_MEASURE` (Mengeneinheit)**:
  - [x] Standard-Auswahlkatalog nach DIN 277 / GAEB (`m`, `m²`, `m³`, `Stk`, `Psch`, `Std`, `kg`, `to`, `l`, `km`).
  - [x] Verknüpfung mit Umrechnungsfaktoren (z. B. `kg` -> `to` Faktor `0.001`).
- [x] **`ORDNUNGSZAHL (OZ)` (Positionsnummer)**:
  - [x] GAEB-konforme Ordnungszahlen (z. B. `01.02.0030` oder `1.1.3`).
  - [x] Spezieller hierarchischer Sortierindex (damit `01.02.0030` korrekt nach `01.02.0020` sortiert wird).
  - [x] Automatische OZ-Inkrementierung beim Anlegen neuer Zeilen (`+10` Schrittweite).

### 🛡️ 2.2 Compliance-, Identifikator- & Geo-Typen
- [x] **`IBAN` & `BIC`**:
  - [x] Automatische ISO 7064 Prüfziffern-Validierung (Modulo 97) bei der Dateneingabe.
  - [x] Automatische Leerzeichen-Formatierung (`DE89 3705 0198 0000 0123 45`).
- [x] **`UST_IDNR` / `TAX_ID`**:
  - [x] Regex- und Formatprüfung nach EU-Länderkürzel (z. B. `DE[0-9]{9}`, `ATU[0-9]{8}`).
- [x] **`GEO_POINT` (Geokoordinaten)**:
  - [x] Speicherung von `Latitude` & `Longitude` (WGS 84 / Point-Datentyp).
  - [x] Integrierter Mini-Karten-Picker und Adress-Geocoding für Baustellenadressen.
- [x] **`FILE_ATTACHMENT` (Dokumenten- & Dateiverweis)**:
  - [x] Speicherung von Storage-Key, Dateiname, MIME-Typ und Dateigröße.
  - [x] Dateitypen-Filter (z. B. nur `.pdf`, `.dwg`, `.dxf`, `.xlsx`).
- [x] **`COLOR_HEX` / `STATUS_TAG`**:
  - [x] Farbcode-Feld mit Farb-Picker für dynamische Status-Badges und Kanban-Farben.

---

## 🧮 3. Berechnete Spalten & Formel-Felder (Generated / Computed Columns)

Automatische zeilenbasierte Berechnungen direkt im Datenbankschema, um doppelte Geschäftslogik in den Frontends zu vermeiden:

### 3.1 Virtuelle vs. Gespeicherte Spalten
- [x] **Typ-Auswahl**:
  - `VIRTUAL` / `VIRTUAL COLUMN`: Berechnung zur Laufzeit bei jeder Abfrage (ressourcensparend bei selten gelesenen Spalten).
  - `STORED` / `PERSISTENT`: Berechnung beim Schreiben und physische Speicherung auf der Platte (indizierbar für schnelle Filterung).
- [x] **Formel-Syntax & Autovervollständigung**:
  - [x] Syntax-Vorschläge für vorhandene Spaltennamen per `[` oder `{{`.
  - [x] Mathematische Operatoren: `+`, `-`, `*`, `/`, `^`, `%`.
  - [x] Typische Standard-Formeln:
    - `[Menge] * [Einzelpreis]` ➔ `GesamtpreisNetto`
    - `[GesamtpreisNetto] * (1 + [MwStSatz] / 100)` ➔ `GesamtpreisBrutto`
    - `CONCAT([Nachname], ', ', [Vorname])` ➔ `VollstaendigerName`
    - `[Enddatum] - [Startdatum]` ➔ `DauerTage`
- [x] **SQL-Dialekt-Übersetzer für Generated Columns**:
  - SQLite: `GENERATED ALWAYS AS (expr) VIRTUAL/STORED`
  - PostgreSQL: `GENERATED ALWAYS AS (expr) STORED`
  - MySQL: `AS (expr) VIRTUAL/STORED`
  - MS SQL Server: `AS (expr) PERSISTED`

---

## 🔐 4. Erweiterte Constraints, Indizes & Kaskadierung

### 4.1 Zusammengesetzte Schlüssel & Indizes (Composite Keys)
- [x] **Composite Primary Keys (Mehrspaltige PKs)**:
  - Definieren von Primärschlüsseln über mehrere Spalten (z. B. `(ProjektId, PositionsNr)`).
- [x] **Composite Unique Constraints**:
  - Eindeutigkeitsregeln über Spaltenkombinationen (z. B. `UNIQUE(KundeId, RechnungsNummer)`).
- [x] **Multi-Column Indexes**:
  - Performance-Indizes für typische Filterabfragen (z. B. `INDEX(ProjektId, Status, ErstellDatum)`).
  - Index-Typen wählbar: B-Tree, Hash, Unique Index.

### 4.2 CHECK-Constraints mit Regel-Editor
- [x] **Numerische Schranken**: `CHECK([Menge] > 0)`, `CHECK([RabattProzent] >= 0 AND [RabattProzent] <= 100)`.
- [x] **Datums-Hierarchien**: `CHECK([FertigstellungSoll] >= [BaubeginnSoll])`.
- [x] **Wertelisten-Einschränkung**: `CHECK([Status] IN ('Entwurf', 'Geprüft', 'Freigegeben', 'Abgelehnt'))`.

### 4.3 Kaskadierende Aktionen bei Fremdschlüsseln (`ON DELETE` / `ON UPDATE`)
- [x] **`ON DELETE` Optionen**:
  - `CASCADE`: Automatisches Löschen aller Kinddatensätze (z. B. Projekt löschen ➔ alle Kalkulationszeilen löschen).
  - `SET NULL`: Fremdschlüssel auf NULL setzen (z. B. Bauleiter gelöscht ➔ Projekt behält Status, Bauleiter-Feld wird leer).
  - `RESTRICT` / `NO ACTION`: Verhindert das Löschen des Elterndatensatzes, solange noch Kinddatensätze existieren.
- [x] **`ON UPDATE` Optionen**:
  - `CASCADE` für automatische Weitergabe geänderter Primärschlüssel.

---

## 🛡️ 5. Enterprise Audit-Felder & Soft-Delete (1-Klick-Standard)

Ein 1-Klick-Button **"Standard Enterprise-Audit-Felder einfügen"** generiert automatisch folgende geschäftskritische Spalten:

- [x] **Audit-Tracking Spalten**:
  - [x] `CreatedAt` (`DATETIME`, Default: `CURRENT_TIMESTAMP`, Not Null)
  - [x] `CreatedBy` (`VARCHAR(64)`, ID des erstellenden Benutzers)
  - [x] `UpdatedAt` (`DATETIME`, Auto-Update bei jeder Modifikation)
  - [x] `UpdatedBy` (`VARCHAR(64)`, ID des letzten Bearbeiters)
- [x] **Soft-Delete (Wiederherstellbarkeit)**:
  - [x] `IsDeleted` (`BOOLEAN`, Default: `FALSE`, Not Null)
  - [x] `DeletedAt` (`DATETIME`, Nullable)
  - [x] `DeletedBy` (`VARCHAR(64)`, Nullable)
  - [x] Automatische Filterung: Standard-Abfragen schließen `WHERE IsDeleted = FALSE` automatisch ein.
- [x] **Optimistic Locking (Schutz vor Überschreiben)**:
  - [x] `RowVersion` / `LockVersion` (`INTEGER`, Default: `1`)
  - [x] Bei jedem `UPDATE` wird die Version um 1 inkrementiert (`SET RowVersion = RowVersion + 1 WHERE RowVersion = @oldVersion`).

---

## 👥 6. Tabellen- & Spalten-Berechtigungen (Field-Level RBAC)

Bereits auf Schema-Ebene definieren, wer welche Daten lesen, schreiben oder maskiert sehen darf:

### 6.1 Rollenbasierte Tabellenrechte (CRUD-Matrix)
- [x] **Visuelle Rechte-Matrix pro Tabelle**:
  - Rollen: `Administrator`, `Kalkulator`, `Projektleiter`, `Bauleiter`, `Monteur`, `Gast`.
  - Berechtigungs-Flags: `Create`, `Read`, `Update`, `Delete`.
  - Beispiel: `tbl_kalkulation` ➔ *Kalkulator (CRUD)*, *Bauleiter (Read-Only)*, *Monteur (Kein Zugriff)*.

### 6.2 Spalten-Sicherheit & Datenmaskierung (Field Masking)
- [x] **Spalten-Sichtbarkeit pro Rolle**:
  - *Vollzugriff (Read/Write)*
  - *Nur Lesen (Read-Only)*
  - *Maskiert (Masked)*: z. B. `Einkaufspreis_EK` wird für Monteure als `*** €` oder `0.00 €` maskiert.
  - *Ausgeblendet (Hidden)*: Spalte wird gar nicht an den Client übertragen.

---

## 🔄 7. Schema-Migrations- & Diff-System (`ALTER TABLE`)

Sichere Anpassung bestehender Produktiv-Tabellen ohne Datenverlust:

- [x] **Visual Diff & Änderungs-Erkennung**:
  - Erkennt automatisch: Neue Spalten, gelöschte Spalten, geänderte Datentypen, geänderte Constraints.
- [x] **Generierung sicherer `ALTER TABLE` Skripte**:
  - `ALTER TABLE tbl_kalkulation ADD COLUMN SkontoTage INT DEFAULT 14;`
  - Automatische Zwischen-Tabellen-Migration für SQLite (da SQLite nur eingeschränktes `ALTER TABLE` unterstützt).
- [x] **Destruktions-Warnsystem (Data Loss Warning)**:
  - Warnhinweis bei riskanten Operationen (z. B. *"Typumwandlung von VARCHAR zu INT kann vorhandene Daten beschädigen"* oder *"Spalte löschen löscht 1.420 Datensätze"*).
- [x] **Schema-Versionierung & Migrations-Historie**:
  - Generierung fortlaufender Migrationsdateien (`V1__initial_schema.sql`, `V2__add_project_geopoint.sql`).
  - Protokoll-Tabelle `__schema_migrations` im Ziel-Backend.

---

## 🏗️ 8. Vordefinierte Branchen-Vorlagen (Industry Blueprints)

1-Klick-Vorlagen im Assistenten **"Neue Tabelle erstellen"**:

- [x] **Vorlage: Leistungsverzeichnis / Kalkulationspositionen (`tbl_positions`)**:
  - `Id`, `ProjectId`, `OZ` (Ordnungszahl), `PositionType` (Normal, Wahl, Eventual), `ShortText`, `LongText`, `Quantity`, `Unit`, `Cost_Labor`, `Cost_Material`, `Cost_Equipment`, `Cost_Subcontractor`, `UnitPrice`, `TotalPriceNet`.
- [x] **Vorlage: Kunden & Debitoren (`tbl_customers`)**:
  - `Id`, `CustomerNumber`, `CompanyName`, `ContactPerson`, `Street`, `ZipCode`, `City`, `Country`, `VatId`, `PaymentTermsDays`, `DiscountPercentage`, `IBAN`, `BIC`.
- [x] **Vorlage: Bautagebuch & Tagesbericht (`tbl_daily_reports`)**:
  - `Id`, `ProjectId`, `ReportDate`, `Weather`, `TemperatureMin`, `TemperatureMax`, `WorkersCount`, `SubcontractorsPresent`, `MachineryUsed`, `WorkCompleted`, `ObstaclesReported`, `SignedBy`.
- [x] **Vorlage: Abschlags- & Schlussrechnungen (`tbl_invoices`)**:
  - `Id`, `InvoiceNumber`, `ProjectId`, `CustomerId`, `InvoiceType` (Abschlag, Teilschluss, Schluss), `InvoiceDate`, `DueDate`, `AmountNet`, `VatRate`, `AmountGross`, `PaymentStatus`, `GiroCodePayload`.
- [x] **Vorlage: Mängelrügen & Protokolle (`tbl_defects`)**:
  - `Id`, `ProjectId`, `LocationPlanPin`, `Description`, `Severity` (Leicht, Mittel, Schwer), `DeadlineDate`, `AssignedSubcontractorId`, `PhotoBeforeUrl`, `PhotoAfterUrl`, `Status`.

---

## ⚡ 9. MFE-Integration & Cross-Table Trigger

- [x] **Table Event-Bus Dispatcher**:
  - Konfigurieren von automatischen Events bei Datenänderungen:
    - Bei `INSERT` in `tbl_invoices` ➔ Sende Event `INVOICE_CREATED` an das Billing-MFE.
    - Bei `UPDATE` an `tbl_positions` ➔ Sende Event `CALCULATION_TOTALS_CHANGED` an die Shell.
- [x] **Automatische TypeScript Type-Generierung**:
  - 1-Klick-Export von TypeScript-Interfaces aus dem Tabellenschema (`export interface Position { id: string; oz: string; ... }`).
  - Integration in Zod-Validierungsschemas für Frontend-Formulare.

---

## 📅 10. Priorisierte Umsetzungs-Phasen & Roadmap

| Phase | Fokusbereich | Konkrete Implementierungs-Schritte |
| :--- | :--- | :--- |
| **Phase 1** | *Enterprise Types & Audit* | • `CURRENCY`, `PERCENTAGE`, `UNIT_MEASURE`, `ORDNUNGSZAHL`<br>• 1-Klick Enterprise-Audit-Felder (`CreatedAt`, `IsDeleted`, `RowVersion`) |
| **Phase 2** | *Computed Columns & Constraints* | • Virtuelle & Gespeicherte Formel-Spalten (`[Menge] * [Preis]`)<br>• Composite Unique Keys & Multi-Column Indexes<br>• Kaskadierendes Löschen (`ON DELETE CASCADE`) |
| **Phase 3** | *Industry Blueprints* | • Vorlagen-Katalog (Kalkulation, Bautagebuch, Kunden, Rechnungen, Mängel)<br>• 1-Klick Schnellstart-Wizard im Tabellendesigner |
| **Phase 4** | *Schema Migrations* | • Schema-Diff Engine & `ALTER TABLE` Skript-Generator<br>• Destruktions-Warnsystem & Datenverlust-Schutz<br>• Schema-Versionsverwaltung (`V1__init.sql`) |
| **Phase 5** | *Security & RBAC* | • Granulare Tabellen- & Spaltenberechtigungen<br>• Datenmaskierung (`*** €`) für sensible Felder<br>• Rollenbasierte CRUD-Matrix |
| **Phase 6** | *Type-Export & MFE-Hooks* | • Automatischer TypeScript & Zod Schema-Export<br>• Event-Bus Trigger bei Tabellen-Operationen (Insert/Update/Delete) |
