# DB Studio Pro - Designer & Benutzeroberflächen Handbuch

> Enthält detaillierte Anleitungen und Konzepte für die visuellen Designer: Table Designer, Query Designer, Form Designer, Page Designer, Report Designer sowie Branchenschnittstellen wie GAEB.

## Inhaltsverzeichnis

1. [TableDesigner](#tabledesigner)
2. [QueryDesigner](#querydesigner)
3. [FormDesigner](#formdesigner)
4. [PageDesigner](#pagedesigner)
5. [ReportDesigner](#reportdesigner)
6. [GaebAndInterfaces](#gaebandinterfaces)

---

<a id="tabledesigner"></a>
# TableDesigner

> **Originaldatei:** `docs/TableDesigner.md`

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



---

<a id="querydesigner"></a>
# QueryDesigner

> **Originaldatei:** `docs/QueryDesigner.md`

# Query Designer – Architektur-, Funktions- & Erweiterungs-Blueprint
**System: Enterprise Bausoftware & Kalkulation (MFE-Architektur)**  
*Status: Produkt-Roadmap & Detaillierte Implementierungs-Checkliste*

---

## 📑 Inhaltsverzeichnis
1. [🟢 IST-Zustand & Vorhandene Basisfunktionen](#-1-ist-zustand--vorhandene-basisfunktionen)
2. [📐 2. Erweiterte Join-Typen & Graph-Beziehungs-Engine](#-2-erweiterte-join-typen--graph-beziehungs-engine)
3. [🧮 3. Aggregationen, Fensterfunktionen & Baukalkulations-Ausdrücke](#-3-aggregationen-fensterfunktionen--baukalkulations-ausdrücke)
4. [🎯 4. Parameter-, Filter- & Kriterien-Engine (Formeln & Formular-Binding)](#-4-parameter--filter---kriterien-engine-formeln--formular-binding)
5. [⚡ 5. Aktions- & Mutations-Abfragen (Action Queries & Bulk Updates)](#-5-aktions---mutations-abfragen-action-queries--bulk-updates)
6. [📊 6. Kreuztabellen-, Pivot- & Kostenmatrix-Abfragen](#-6-kreuztabellen--pivot---kostenmatrix-abfragen)
7. [🛡️ 7. SQL-Dialekt-Engine, Prepared Statements & SQL-Injection-Schutz](#-7-sql-dialekt-engine-prepared-statements--sql-injection-schutz)
8. [🚀 8. Performance, Virtualisiertes Live-Preview & Explain-Plan](#-8-performance-virtualisiertes-live-preview--explain-plan)
9. [🔌 9. Micro Frontend (MFE) API-Export & REST/GraphQL Integration](#-9-micro-frontend-mfe-api-export--restgraphql-integration)
10. [📅 10. Priorisierte Umsetzungs-Phasen & Roadmap](#-10-priorisierte-umsetzungs-phasen--roadmap)

---

## 🟢 1. IST-Zustand & Vorhandene Basisfunktionen

- [x] **Visueller Abfrage-Designer (Access/QBE-Style Canvas)**:
  - [x] Drag & Drop von Tabellenknoten auf die Canvas-Oberfläche.
  - [x] Spalten-Grid (Field, Table, Alias, Sortierung ASC/DESC, Show/Hide, Criteria-Zeilen).
  - [x] Automatische Beziehungserkennung via BFS (Breadth-First Search) basierend auf bestehenden Relationen.
- [x] **Basis SQL-Generierung (`generateSqlSelect`)**:
  - [x] Automatische Vergabe stabiler Tabellen-Aliase (`Table_0`, `Table_1`).
  - [x] Generierung von `SELECT`, `FROM`, `LEFT JOIN`, `WHERE`, `GROUP BY`, `HAVING` und `ORDER BY`.
  - [x] Unterstützung für Dialekt-Identifier Quoting (SQLite, PostgreSQL, MySQL, MSSQL).
- [x] **Basale Aggregatfunktionen**:
  - [x] `GROUP_BY`, `SUM`, `COUNT`, `AVG`, `MIN`, `MAX`, `FIRST`, `LAST`, `EXPRESSION`.
- [x] **Berechnete Spalten (`isCalculated`)**:
  - [x] Freitext-Ausdrücke mit Syntax-Vorschlägen (z. B. `"Tabelle"."Preis" * 1.2`).
- [x] **Basis-Aktionsabfragen (Wizards)**:
  - [x] `INSERT` (Anfügeabfrage / Append Query)
  - [x] `UPDATE` (Aktualisierungsabfrage)
  - [x] `DELETE` (Löschabfrage)
  - [x] `MAKE_TABLE` (Tabellenerstellungsabfrage)
- [x] **Ergebnis-Vorschau & Daten-Export**:
  - [x] Tabellarische Datenanzeige der Query-Ergebnisse.
  - [x] 1-Klick Export nach **Excel (.xlsx)**, **PDF (mit AutoTable)** und **JSON**.
  - [x] Spaltenfilterung und Sortierung im Vorschaufenster.

---

## 📐 2. Erweiterte Join-Typen & Graph-Beziehungs-Engine

Aktuell generiert der Designer primär `LEFT JOIN`s über vordefinierte Tabellenbeziehungen. Für komplexe Auswertungen (z. B. Nachunternehmer-Preisvergleiche, Fehlmengen, Vollständigkeitsprüfungen) werden vollwertige Join-Optionen benötigt:

### 2.1 Konfigurierbare Join-Eigenschaften (Visual Join Editor)
- [x] **Visuelle Klick-Konfiguration auf Beziehungslinien**:
  - [x] **`INNER JOIN` (Gleichheitsverknüpfung)**: Nur Datensätze einschließen, bei denen die verknüpften Felder in beiden Tabellen übereinstimmen.
  - [x] **`LEFT OUTER JOIN`**: Alle Datensätze aus Tabelle A und die passenden aus Tabelle B (Standard).
  - [x] **`RIGHT OUTER JOIN`**: Alle Datensätze aus Tabelle B und die passenden aus Tabelle A.
  - [x] **`FULL OUTER JOIN`**: Alle Datensätze aus beiden Tabellen einschließen (für Vollständigkeitsanalysen).
  - [x] **`CROSS JOIN` (Kartesisches Produkt)**: Matrix-Kombinationen (z. B. alle Gewerke x alle Baustellen für Planungsraster).
- [x] **Self-Joins & Mehrfach-Instanzen derselben Tabelle**:
  - [x] Selbe Tabelle mehrfach auf die Canvas ziehen (z. B. `tbl_mitarbeiter` als *Bauleiter* und `tbl_mitarbeiter` als *Vertreter*).
  - [x] Eindeutige Alias-Verwaltung (`Mitarbeiter_Bauleiter`, `Mitarbeiter_Vertreter`).
- [x] **Ad-hoc Join-Bedingungen (Non-Key Joins)**:
  - [x] Verknüpfung auf beliebige Felder ohne expliziten Fremdschlüssel (z. B. Verknüpfung über `PLZ` oder `ProjektNummer`).
  - [x] Komplexe Join-Bedingungen (z. B. `ON a.GueltigAb <= b.Datum AND a.GueltigBis >= b.Datum`).

---

## 🧮 3. Aggregationen, Fensterfunktionen & Baukalkulations-Ausdrücke

### 3.1 Erweiterte Baukalkulations- & Finanz-Funktionen
- [x] **Kaufmännische Rundung & Währungs-Formatierung**:
  - [x] `ROUND_CURRENCY(val)` (Rundet exakt kaufmännisch nach DIN 1333 auf 2 Dezimalstellen).
  - [x] `SUM_CURRENCY(col)` mit Überlaufschutz für große Bauaufträge.
- [x] **Kumulierte Summen & Zwischensummen (Rollup / Cube)**:
  - [x] `GROUP BY ROLLUP(Gewerk, Los, Titel)`: Erzeugt automatische Zwischensummenzeilen für jede Hierarchiestufe im Leistungsverzeichnis.
- [x] **SQL Fensterfunktionen (Window Functions / Analytic Functions)**:
  - [x] `ROW_NUMBER() OVER (PARTITION BY ProjektId ORDER BY Ordnungszahl)` (Automatische Neunummerierung von Positionen).
  - [x] `SUM(Gesamtbetrag) OVER (PARTITION BY ProjektId ORDER BY Rechnungsdatum)` (Kumulierter Rechnungsstand / Zahlungsverlauf).
  - [x] `LAG(Preis, 1) OVER (PARTITION BY ArtikelId ORDER BY Datum)` (Preishistorie / Preissteigerungs-Vergleich zum Vormonat).
  - [x] `DENSE_RANK()` / `PERCENT_RANK()` für Bieter-Rangfolgen im Preisspiegel.

### 3.2 Access- & Excel-Kompatibilitäts-Funktionen (Auto-Transpiler)
- [x] Automatische Übersetzung historischer Access-Ausdrücke in ANSI-SQL:
  - [x] `Nz([Feld], 0)` ➔ `COALESCE("Feld", 0)`
  - [x] `IIf([Menge] > 10, 'Groß', 'Klein')` ➔ `CASE WHEN "Menge" > 10 THEN 'Groß' ELSE 'Klein' END`
  - [x] `Format([Datum], 'yyyy-mm-dd')` ➔ `TO_CHAR` / `STRFTIME` / `FORMAT`
  - [x] `DateDiff('d', [Start], [Ende])` ➔ Dialekt-spezifische Tagesdifferenz.

---

## 🎯 4. Parameter-, Filter- & Kriterien-Engine (Formeln & Formular-Binding)

### 4.1 Dynamische Abfrage-Parameter
- [x] **Explizite Parameter-Definition**:
  - [x] Parameter-Typen: `STRING`, `NUMBER`, `DATE`, `DATE_RANGE`, `BOOLEAN`, `ARRAY/MULTI_SELECT`.
  - [x] Standardwerte und Pflichtfeld-Flags.
  - [x] Syntax im SQL: `:p_projekt_id` oder `@ProjektId` oder `$1`.
- [x] **Interaktiver Parameter-Prompt bei Ausführung**:
  - [x] Vor der Ausführung öffnet sich automatisch ein modaler Dialog zur Eingabe der Parameterwerte (z. B. Datum von/bis oder Projektauswahl).

### 4.2 Kriterien-Zeilen & ODER-Logik (Grid Kriterien)
- [x] **Mehrzeilige Kriterien im QBE-Grid**:
  - [x] Gleiche Zeile = `UND` (AND-Bedingung).
  - [x] Untereinanderliegende Kriterien-Zeilen = `ODER` (OR-Bedingung).
- [x] **Filter-Operatoren-Syntax**:
  - [x] Vergleichsoperatoren: `>`, `<`, `>=`, `<=`, `<>`, `!=`, `=`.
  - [x] Textsuche: `LIKE 'Muster*'`, `STARTS_WITH`, `CONTAINS`, `REGEX`.
  - [x] Mengenoperatoren: `IN ('Offen', 'In Bearbeitung')`, `NOT IN (...)`.
  - [x] Bereichsoperatoren: `BETWEEN '2026-01-01' AND '2026-12-31'`.
  - [x] Null-Prüfung: `IS NULL`, `IS NOT NULL`.

### 4.3 Formular- & Kontext-Bindung (`[Forms]![...]![...]`)
- [x] **Laufzeit-Auflösung von UI-Kontextwerten**:
  - [x] Auflösung von `[Forms]![RechnungsFormular]![ProjektId]` ➔ Liest den aktuell im geöffneten Formular ausgewählten Projekt-Wert.
  - [x] Globale Session-Variablen: `[CurrentUserId]`, `[CurrentTenantId]`, `[ActiveProjectId]`, `[Today]`.

---

## ⚡ 5. Aktions- & Mutations-Abfragen (Action Queries & Bulk Updates)

Aktionsabfragen ermöglichen Massenoperationen im Hintergrund ohne zeilenweises Einzelschreiben:

### 5.1 Massen-Aktualisierung (Update Queries)
- [x] **Index-Anpassungen & Teuerungszuschlag**:
  - [x] Beispiel: *"Erhöhe alle Lohn-Einheitspreise im Los 02 um 3.5%"*.
  - [x] SQL-Generierung: `UPDATE tbl_positions SET UnitPrice_Labor = UnitPrice_Labor * 1.035 WHERE ProjectId = :pid AND OZ LIKE '02.%';`
- [x] **Massen-Statuswechsel**:
  - [x] *"Setze alle geprüften Rechnungen mit Fälligkeit < Heute auf 'Überfällig'"*.

### 5.2 Anfüge- & Duplizier-Abfragen (Append Queries / Insert into ... Select)
- [x] **LV-Positions-Kopierer**:
  - [x] Kopieren ganzer Positionspakete von Projekt A nach Projekt B mit neuer ProjektId.
  - [x] `INSERT INTO tbl_positions (ProjectId, OZ, ShortText, UnitPrice) SELECT :targetProjectId, OZ, ShortText, UnitPrice FROM tbl_positions WHERE ProjectId = :sourceProjectId;`

### 5.3 Tabellenerstellungs-Abfragen (Make Table / CTAS)
- [x] **Kalkulations-Snapshot & Archivierung**:
  - [x] Erzeugt eine physische Historientabelle zum Zeitpunkt der Angebotsabgabe (`CREATE TABLE tbl_quote_snapshot_2026_01 AS SELECT ...`).

### 5.4 Transaktions-Sicherheit & Dry-Run
- [x] **Test-Lauf (Dry-Run / Preview)**:
  - [x] Vor Ausführung anzeigen: *"Diese Abfrage wird 428 Datensätze in 'tbl_positions' modifizieren."*
  - [x] Transaktionsschutz (`BEGIN TRANSACTION ... COMMIT / ROLLBACK`).

---

## 📊 6. Kreuztabellen-, Pivot- & Kostenmatrix-Abfragen

Für Baukalkulation und Finanzcontrolling sind Pivot-Abfragen unerlässlich:

- [x] **Visueller Kreuztabellen-Assistent (Crosstab / Pivot Wizard)**:
  - [x] **Zeilenüberschriften (Row Headers)**: z. B. `Gewerk` oder `ProjektId`.
  - [x] **Spaltenüberschriften (Column Headers)**: z. B. `Monat` oder `Kostenart (L/M/G/S/NU)`.
  - [x] **Zellenwerte (Value / Aggregation)**: `SUM(Gesamtbetrag)` oder `SUM(Arbeitsstunden)`.
- [x] **Automatische SQL-Generierung für Pivot-Tabellen**:
  - [x] PostgreSQL: `crosstab()` via `tablefunc` oder conditional aggregation (`SUM(CASE WHEN ...) AS Lohn`).
  - [x] MS SQL Server: Native `PIVOT(...)` Syntax.
  - [x] SQLite / MySQL: Dynamische `CASE WHEN`-Spaltensynthese.

---

## 🛡️ 7. SQL-Dialekt-Engine, Prepared Statements & SQL-Injection-Schutz

- [x] **Sichere Parameter-Ersetzung (Prepared Statements)**:
  - [x] Volle Trennung von SQL-Code und Datenwerten (kein unsicheres String-Concatenating).
  - [x] Automatische Typ-Konvertierung und Escaping.
- [x] **Multi-Dialekt DQL Generator**:
  - [x] **PostgreSQL**: `LIMIT n OFFSET m`, `ILIKE`, `::jsonb`, `RETURNING`.
  - [x] **SQLite**: `STRFTIME`, dynamische Typen.
  - [x] **Microsoft SQL Server**: `TOP (n)`, `OFFSET n ROWS FETCH NEXT m ROWS ONLY`, `CONVERT()`.
  - [x] **MySQL / MariaDB**: Backticks, `IFNULL()`, `GROUP_CONCAT()`.
- [x] **SQL Syntax Highlighter & Live-Linter**:
  - [x] Validierung von Tabellen- und Spaltennamen gegen das aktive Schema in Echtzeit.
  - [x] Warnung bei unvollständigen `GROUP BY` Klauseln (SQL Standard-Konformität).

---

## 🚀 8. Performance, Virtualisiertes Live-Preview & Explain-Plan

- [x] **Explain-Plan & Query-Kostenanalyse**:
  - [x] Visualisierung des Ausführungsplans (Sequential Scan vs. Index Scan).
  - [x] Erkennung fehlender Indizes mit 1-Klick-Button: *"Empfohlenen Index auf `tbl_positions.ProjectId` erstellen"*.
- [x] **Virtualisiertes Daten-Grid für Vorschau**:
  - [x] Schnelles Rendern von bis zu 100.000 Ergebniszeilen im Designer mit virtuellem DOM.
- [x] **Query Execution Timeout & Limitierung**:
  - [x] Standard-Limit im Entwurfsmodus (`LIMIT 500`) zur Vermeidung von Browser-Freezes.
  - [x] Abbrechbare Abfragen (AbortController).

---

## 🔌 9. Micro Frontend (MFE) API-Export & REST/GraphQL Integration

Jede gespeicherte Abfrage kann direkt als Backend-Schnittstelle exportiert werden:

- [x] **Automatischer REST-API-Endpunkt Generator**:
  - [x] `GET /api/queries/v1/ProjektKostenUebersicht?projektId=1001`
  - [x] Automatische Swagger / OpenAPI 3.0 Dokumentations-Generierung für die Abfrage.
- [x] **TypeScript Data-Access Hook Generator**:
  - [x] Generiert typsichere React/Angular Hooks mit TanStack Query (`useQuery`).
- [x] **Event-Bus Trigger**:
  - [x] Option: Nach Ausführung einer Aktionsabfrage automatisch MFE-Event feuern (z. B. `CALCULATION_UPDATED`).

---

## 📅 10. Priorisierte Umsetzungs-Phasen & Roadmap

| Phase | Fokusbereich | Konkrete Implementierungs-Schritte |
| :--- | :--- | :--- |
| **Phase 1** | *Join Engine & Aliases* | • Visueller Join-Editor (`INNER`, `LEFT`, `RIGHT`, `FULL`)<br>• Self-Joins & Alias-Konflikt-Behebung<br>• Ad-hoc Join-Bedingungen auf Nicht-Schlüsselfelder |
| **Phase 2** | *Expressions & Finance* | • Kaufmännische Rundungsfunktionen (`ROUND_CURRENCY`)<br>• Access-Transpiler (`Nz`, `IIf`, `DateDiff`, `Format`)<br>• Fensterfunktionen (`ROW_NUMBER()`, `SUM() OVER ()`) |
| **Phase 3** | *Dynamic Parameters* | • Typisierte Parameter (`:projektId`, `@datumVon`)<br>• Interaktiver Parameter-Eingabedialog<br>• Formular- & Session-Kontext-Bindung (`[Forms]![...]`) |
| **Phase 4** | *Action Queries & Safety* | • Massen-Updates (`UPDATE ... WHERE`)<br>• Anfüge-Abfragen (`INSERT INTO ... SELECT`)<br>• Dry-Run Vorschau & Transaktionssicherheit |
| **Phase 5** | *Crosstab & Analytics* | • Visueller Kreuztabellen / Pivot Wizard (Zeilen, Spalten, Werte)<br>• Kostenarten-Matrix & Bieter-Preisspiegel Generator |
| **Phase 6** | *MFE Export & OpenAPI* | • 1-Klick OpenAPI/Swagger & REST-Endpunkt-Export<br>• Typsichere TypeScript/React/Angular Client-Hooks<br>• Explain-Plan & Index-Optimierer |



---

<a id="formdesigner"></a>
# FormDesigner

> **Originaldatei:** `docs/FormDesigner.md`

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
- [x] **Visuelles 12-Spalten-Raster mit Live-Dropzones**:
  - Magnetisches Einrasten von Feldern und Labels.
  - Horizontale und vertikale Container mit automatischer Breitenberechnung.
- [x] **Multi-Selection & Batch-Styling**:
  - Mehrfachauswahl von Feldern mit `Shift+Klick` oder Rahmen-Aufziehen.
  - Gemeinsames Ausrichten (Linksbündig, Rechtsbündig, Gleiche Breite, Gleicher Abstand).
- [x] **Akkordeon- & Collapse-Sektionen**:
  - Einklappbare Formulargruppen für umfangreiche Stammdaten (z. B. "Kaufmännische Daten", "Zahlungsbedingungen", "VOB-Klauseln").
- [x] **Dynamischer Ribbon FormDesignTab**:
  - Direkte Werkzeuge für Feldplatzierung, Container, Tabs, Aktionsbuttons und Validierungsregeln im Ribbon-Menü.

---

## 🏗️ 3. Bauspezifische Fach- & Eingabe-Komponenten

Für ein vollwertiges Baukalkulations- und ERP-System benötigt der Form Designer spezialisierte Widgets:

### 3.1 Baukaufmännische Spezial-Widgets
- [x] **LV- & Positions-Picker (Katalog / GAEB)**:
  - Intelligente Nachschlage-Maske mit Volltextsuche nach Kurztext, Langtext und DIN 276 Kostengruppen.
- [x] **Aufmaß-Schnelleingabe-Grid**:
  - Direkte Eingabezeilen für `Position | Formel / Rechenansatz | Menge | Einheit | Faktor`.
- [x] **Kaufmännische Währungs- & Rundungsfelder**:
  - Automatische Formatierung (`12.345,67 €`), VOB/B Mehrwertsteuer-Splitting und Nachkommastellen-Präzision (bis 4 Dezimalstellen für Kalkulationsfaktoren).
- [x] **DIN 5008 Adress-Block Widget**:
  - Standardisiertes 8-zeiliges Anschriftenfeld (Zusatz-, Vermerkzone, Anschriftzone) mit automatischer PLZ/Ort-Prüfung.

### 3.2 Baustellen- & Mobile-Erfassung
- [x] **Digitale Unterschrift (Signature Pad)**:
  - Touch- und Stift-fähiges Signaturfeld für Baustellenabnahmen, Regieberichte und Stundenzettel mit Zeitstempel und Hash-Prüfsumme.
- [x] **Foto- & Dokumenten-Upload mit Planmarker**:
  - Upload von Baustellenfotos direkt aus der Kamera, Zuweisung von Mangel-Kategorien und Pin-Platzierung auf PDF-Bauplänen.
- [x] **GPS-Standort & Baustellen-Geocoding**:
  - Ein-Klick-Übernahme der aktuellen GPS-Koordinaten und Adress-Rückwärtsauflösung.
- [x] **Barcode & QR-Code Scanner**:
  - Kamera-basierter Scanner für Lieferschein-Barcodes, EAN-13 Materialcodes und Geräte-Inventar-Tags.

---

## 🧠 4. Low-Code Logik-, Validierungs- & Rechen-Engine

### 4.1 Live Formel- & Rechen-Engine (Computed Fields)
- [x] **Echtzeit-Berechnung abhängiger Felder**:
  - Syntax: `= [Menge] * [Einheitspreis] * (1 - [RabattProzent] / 100)`
  - Automatische Aktualisierung bei Feldänderung ohne Server-Roundtrip.
- [x] **Summen- & Aggregat-Felder über Subformulare**:
  - Syntax: `= SUM(Subform.Positionen.Gesamtpreis)` oder `= COUNT(Subform.Mängel.Id)`.

### 4.2 Bedingte Sichtbarkeit & Feldsperren (Dynamic UI)
- [x] **Regelbasierte Sichtbarkeit (`VisibleIf`)**:
  - Ein-/Ausblenden von Feldern oder ganzen Tabs basierend auf Feldwerten (z. B. "Bürgschaftsdetails nur anzeigen, wenn `Sicherheitseinbehalt > 0`").
- [x] **Regelbasierte Bearbeitbarkeit (`EnabledIf` / `ReadOnlyIf`)**:
  - Sperren von Rechnungsfeldern, sobald der Status auf `"Freigegeben"` oder `"Abgerechnet"` wechselt.

### 4.3 Kaskadierende Dropdowns & abhängige Lookups
- [x] **Hierarchische Filterung**:
  - Auswahl `Gewerk` filtert die verfügbaren Optionen in `Leistungsgruppe` -> filtert `Positionen`.

### 4.4 Feldübergreifende Validierung (Cross-Field Validation)
- [x] **Erweiterte Konsistenzprüfungen**:
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

- [x] **Lokales IndexedDB / LocalStorage Draft-Caching**:
  - Automatisches Zwischenspeichern ungespeicherter Formulardaten im Browser-Cache gegen Datenverlust bei Verbindungsabbruch.
- [x] **Offline-Queue für Datensatz-Änderungen**:
  - Erfassung von Bautagesberichten und Mängeln ohne Internetverbindung; automatische Synchronisation beim Wiederherstellen der Verbindung.
- [x] **Konflikterkennung & Merging (Optimistic Locking)**:
  - Erkennung von Versionskonflikten anhand eines `version` / `updated_at` Zeitstempels mit Side-by-Side Diff-Dialog.

---

## 🔒 7. Sicherheit, Rollen (RBAC) & Revisionssicheres Audit-Logging

- [x] **Feld-Ebene Berechtigungen (Field-Level Security)**:
  - Deklaration von Lese- und Schreibrechten pro Feld (`allowedReadRoles`, `allowedWriteRoles`), z. B. Kalkulationsaufschläge nur für Rolle `Kalkulator` sichtbar.
- [x] **Revisionssicheres Audit-Log pro Feldänderung**:
  - Lückenlose Aufzeichnung: `Wer` hat `welches Feld` von `Wert Alt` auf `Wert Neu` zu welchem `Zeitpunkt` geändert?
- [x] **4-Augen-Freigabe-Workflow**:
  - Formularfelder für Freigaben können nur von berechtigten Prüfern mit digitalem Freigabe-Stempel signiert werden.

---

## 💻 8. Multi-Framework Code-Generierung (React & Angular)

- [x] **React Export (`React Hook Form` + `Zod` Schema)**:
  - Generierung von sauberem TypeScript-Code mit Tailwind-CSS und voller Validierungstypisierung.
- [x] **Angular Standalone Component Export**:
  - Export als Angular 18+ Reactive Forms Komponente mit Typed Forms (`FormGroup`, `FormControl`) und Signals.
- [x] **Ausfüllbarer PDF-Formular-Export (AcroForm)**:
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
- [x] Vollständige Ribbon-Anbindung im `FormDesignTab` (Controls, Formatierung, Tools, Aktionen).
- [x] Visueller Drag & Drop Re-Order & Spalten-Resizing im Designer.
- [x] Multi-Tab-Seiten (`tab_page`) Verwaltung im Designer-Baum.

### 🔹 Phase 2: Bauspezifische Fach-Widgets
- [x] Digitale Signatur (`SignaturePadWidget`).
- [x] Foto-Upload mit Markern (`BlueprintPhotoMarkerWidget`).
- [x] DIN 5008 Adressblock-Komponente (`Din5008AddressWidget`).
- [x] GPS-Standort & Geocoding-Komponente (`GeoLocationWidget`).
- [x] Barcode & QR-Code Scanner (`BarcodeScannerWidget`).
- [x] Kaufmännische Währungs- & VOB/B Steuerfelder (`CurrencyCalculationWidget`).

### 🔹 Phase 3: Rechen-Engine & Dynamik
- [x] Parser für berechnete Felder (`=[Menge]*[EP]`).
- [x] Dynamische `VisibleIf` und `ReadOnlyIf` Regelauswertung im laufenden Formular.
- [x] Kaskadierende Dropdown-Filterung (Dependent Lookups).

### 🔹 Phase 4: MFE Event-Bus & Offline-Sync
- [x] Globales Event-Bus Protokoll für `FORM_LOAD_RECORD`, `FORM_RECORD_SAVED`.
- [x] IndexedDB / LocalStorage Draft-Speicher für lückenlose Offline-Fähigkeit.
- [x] Optimistic Locking & Konflikt-Dialog bei gleichzeitiger Bearbeitung.

### 🔹 Phase 5: Governance & Code-Generierung
- [x] Field-Level RBAC & Dynamic Evaluation.
- [x] React Hook Form + Zod Generator.
- [x] Angular Standalone Reactive Form Generator.



---

<a id="pagedesigner"></a>
# PageDesigner

> **Originaldatei:** `docs/PageDesigner.md`

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
- [x] **Hierarchische Ordnungszahlen (OZ)**:
  - Darstellung von Titeln, Losen, Unterbeschreibungen, Normalpositionen, Grund-/Wahlpositionen, Eventualpositionen und Zulagepositionen (z. B. `01.02.0030`).
- [x] **GAEB XML / ÖNORM / DATANORM Viewer & Editor**:
  - Drag & Drop Import von GAEB-Dateien (X83 Angebotsaufforderung, X84 Angebotsabgabe, X86 Auftrags-LV).
  - Native Anzeige von Langtexten, Kurztexten und Einheitspreisen.
- [x] **Mengenermittlung & Aufmaßblatt (REB 23.003 / Freies Aufmaß)**:
  - Formelbasierte Mengenberechnung pro Position (z. B. `Länge * Breite * Höhe - Abzüge`).
  - Zeilenweise Dokumentation mit Bauteilzuordnung und Aufmaß-Status (Freigegeben / Vorläufig).

### 2.2 EKT-Kalkulationsmatrix (Einzelkosten der Teilleistungen)
- [x] **Kalkulations-Splitter nach Kostenarten**:
  - Aufteilung jeder Position in: **Lohn (L)**, **Stoff/Material (M)**, **Geräte (G)**, **Sonstiges (S)**, **Nachunternehmer (NU)**.
- [x] **Zuschlagskalkulation (Gemeinkosten & Deckungsbeitrag)**:
  - Zuschlagssätze für Baustellengemeinkosten (BGK), Allgemeine Geschäftskosten (AGK) sowie Wagnis & Gewinn (W&G).
  - Berechnung von Endpreisen (EP) und Gesamtbeträgen (GB) mit Live-Update.
- [x] **Bieter-Preisspiegel & Ausreißer-Analyse**:
  - Matrix-Komponente zum Vergleich mehrerer Nachunternehmer-Angebote mit prozentualer Abweichung zum Richtpreis und farblicher Heatmap (günstigster/teuerster Bieter).

### 2.3 Bautagebuch, Mängel- & Baustellen-Management
- [x] **Wetter-Widget mit API-Automatik**:
  - Erfassung von Temperatur, Niederschlag und Witterung für den Bautag (relevant für Bedenkenanzeigen).
- [x] **Kolonnen- & Geräte-Erfassung**:
  - Schnelleingabe anwesender Gewerke, eigener Mitarbeiter und Großgeräte.
- [x] **Mängel-Tracking mit Foto-Marker**:
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
- [x] **Visueller Event-Trigger Editor**:
  - Konfigurieren von Publikationen: z. B. Event `CONSTRUCTION_ARTICLE_SELECTED` mit Payload `{ articleId, unit, ekPrice }`.
  - Konfigurieren von Abonnements: Tabelle oder Formular lauscht auf `PROJECT_CHANGED` und filtert eigene Daten automatisch.
- [x] **Cross-MFE Drag & Drop Zonen**:
  - Ziehen eines Artikels aus der `Articles`-MFE-Komponente direkt in eine Kalkulations-Zeile der `Calc`-MFE.
  - Konfigurierbare Payload-Mappung: `source.price_ek` -> `target.cost_material`.
- [x] **Zentrales Session- & Filter-Context Sharing**:
  - Globaler Projekt-Umschalter (z. B. `activeProjectId`) steuert automatisch alle eingebetteten Subpages über Domain-Grenzen hinweg.

---

## 🧮 4. Low-Code Logik-Engine, Workflows & Formel-Parser

### 4.1 Client-Side Expression Engine (Excel-Syntax)
- [x] **Mathematische & Kaufmännische Formeln**:
  - Syntax: `{{ ROUND(Menge * Einzelpreis * (1 - Rabatt / 100), 2) }}`.
  - Aggregationen: `{{ SUM(Positionen.Gesamtpreis) }}`, `{{ AVG(Messwerte.Druck) }}`.
- [x] **Konditionale Logik**:
  - `{{ IF(Zahlungsstatus == 'Bezahlt', 'Abgeschlossen', IF(Faelligkeit < TODAY(), 'Überfällig', 'Offen')) }}`.
- [x] **Datums-Arithmetik**:
  - `{{ DATEADD(Rechnungsdatum, 14, 'days') }}` für automatische Zahlungsziele.

### 4.2 Visueller Action-Flow Builder (Node-Graph)
- [x] **Ereignis-Kaskaden**:
  - Auslöser: `OnClick`, `OnRowDoubleClick`, `OnFieldChange`, `OnPageLoad`.
  - Aktionen-Pipeline:
    1. `ValidateForm(formId)`
    2. `API_Call(POST /api/invoices, payload)`
    3. `ToastMessage("Erfolgreich gespeichert", "success")`
    4. `CloseModal(modalId)`
    5. `EmitEventBus("INVOICE_CREATED", res.data)`
    6. `ReloadDataset("invoiceList")`
- [x] **Bedingte Verzweigungen**: Wenn API-Status `200` -> Route wechseln; Wenn `400` -> Validierungsfehler an Feldern markieren.

---

## 📊 5. Enterprise Tabellen- & Daten-Raster (High-Density Data Grid)

Enterprise-Anwender im Bauwesen verlangen extrem performante und flexible Tabellen:

- [x] **In-Line Cell Editing (Excel-Feeling)**:
  - Direkte Bearbeitung von Preisen, Mengen und Beschreibungen in der Zeile ohne Modal-Öffnung.
  - Tastaturnavigation: Pfeiltasten, `Tab` für nächste Zelle, `Enter` zum Bestätigen.
- [x] **Virtuelles Scrolling (Virtualization)**:
  - Flüssiges Rendern von über 50.000 Datensätzen mit konstant 60 FPS (DOM-Recycling).
- [x] **Spalten-Management & Personalisierung**:
  - Drag & Drop Spalten-Reihenfolge.
  - Interaktives Spaltenbreiten-Resizing mit persistenter Speicherung je Benutzer.
  - Column-Picker (Spalten ein-/ausblenden).
  - Sticky/Frozen Columns (z. B. Spalte `Position` und `Aktionen` fixiert beim horizontalen Scrollen).
- [x] **Mehrstufige Gruppierung & Zwischensummen**:
  - Gruppierung nach Gewerk -> Los -> Titel mit automatischen Zwischensummenzeilen.
- [x] **1-Klick Daten-Export & Import**:
  - Export nach Excel (.xlsx mit intakten Formeln), CSV, GAEB und JSON.
  - CSV/Excel-Paste: Mehrere Zeilen aus Excel kopieren und direkt in die Tabelle einfügen.

---

## 📝 6. Formular-, Validierungs- & Eingabe-Komponenten

- [x] **Intelligenter Datepicker mit Fristen- & Feiertagsrechner**:
  - Anzeige von Werktagen (ohne Samstage, Sonn- und Feiertage) für Bauzeitpläne.
  - Von-Bis Bereichsauswahl (Date-Range).
- [x] **Multi-Select Tag-Picker mit Asynchroner Suche**:
  - Schnellsuche nach Gewerken, Kostenstellen oder Lieferanten mit Chips-Darstellung.
- [x] **Digitale Unterschrift (Canvas Signature Pad)**:
  - Unterschriftsfeld für Monteure und Kunden auf Baustellen-Tablets mit Export als PNG/SVG/Base64.
- [x] **Drag & Drop Datei- & Plan-Uploader**:
  - Mehrfach-Upload mit Fortschrittsbalken, Bildkomprimierung und PDF-Vorschau.
- [x] **Cross-Field Validierungs-Engine**:
  - Relationale Prüfungen: `SkontoFristDatum <= FaelligkeitsDatum`, `RechnungsSumme == SUM(Positionen)`.
  - Regex-Muster (IBAN, USt-IdNr, Steuernummer, Postleitzahl, E-Mail).

---

## 📄 7. Dokumenten-, PDF- & Druckvorlagen-Designer

- [x] **Pixelgenauer Druckseiten-Designer (A4 Portrait / Landscape)**:
  - Feste Seitenränder, Kopfzeilen mit Firmenlogo und wiederholende Fußzeilen mit Paginierung ("Seite X von Y").
  - Dynamischer Seitenumbruch (Page-Break) bei langen Positionslisten ohne abgeschnittene Zeilen.
- [x] **Zahlungsverkehr & EPC-QR-Code (GiroCode)**:
  - Automatische Generierung von Bezahl-QR-Codes auf Rechnungen (gemäß EPC-Standard für Banking-Apps).
- [x] **E-Rechnungs-Konformität (ZUGFeRD / XRechnung)**:
  - Integrierte Validierung und Vorschau für strukturierte XML-Rechnungen (Pflicht im B2B/B2G-Baugeschäft).

---

## 🔐 8. Sicherheit, RBAC, Governance & Compliance

- [x] **Granulare Rollen- & Berechtigungssteuerung (Field-Level Security)**:
  - Konfigurierbare Rechte pro Komponente oder Spalte:
    - *Vollzugriff (Read/Write)*
    - *Nur Lesen (Read-Only)*
    - *Maskiert (z. B. Einkaufspreis nur für Kalkulatoren sichtbar, Monteure sehen `*** €`)*
    - *Vollständig ausgeblendet*
- [x] **Revisionssicherheit & Audit Trail**:
  - Automatische Protokollierung jeder Layout-Änderung (Wer hat welche Komponente umgestellt?).
  - Diff-Vergleich zwischen Layout-Versionen mit Rollback-Funktion.
- [x] **Draft vs. Published Workflow**:
  - Änderungen am Seitenlayout verbleiben im Entwurfsmodus (Draft) und werden erst nach Freigabe für Endanwender aktiv geschaltet.

---

## ⚡ 9. Multi-Framework Code-Generierung (React & Angular Signals)

Der Code-Generator muss sauberen, wartbaren und produktionsreifen Code ausgeben:

### 9.1 Angular Export (Moderne Standalone Architektur)
- [x] **Signals & WritableSignals**: Generierung von `signal()`, `computed()` und `effect()` für reaktives State Management statt veralteter BehaviorSubjects.
- [x] **Neue Control-Flow Syntax**: Native Nutzung von `@if`, `@for (item of items; track item.id)`, `@switch`.
- [x] **Typed Reactive Forms**: Typsichere `FormGroup<{ [key]: FormControl<string> }>` mit Validatoren.
- [x] **Micro Frontend Module Export**: Bereitstellung als eigenständige Remote-Komponente für Webpack/Vite Module Federation.

### 9.2 React Export (Modernes React 18+ / Next.js)
- [x] **React Hook Form & Zod Schema**: Automatische Generierung von Zod-Validierungsschemas aus den Designer-Regeln.
- [x] **TanStack Table (v8) Integration**: Generierung moderner Grid-Konfigurationen mit Sortierung und Pagination.
- [x] **Tailwind CSS Utility Generation**: Saubere, redundanzfreie Klassen ohne Gradienten oder verbotene UI-Muster.

---

## 🎨 10. Designer-Ergonomie, Canvas-Tools & AI-Copilot

- [x] **Canvas Zoom, Pan & Mini-Map**:
  - Stufenloser Zoom (50% bis 200%), Verschieben des Arbeitsbereichs (Pan per Leertaste + Drag).
- [x] **Ausrichtungs- & Multi-Select Werkzeuge**:
  - Mehrfachauswahl von Elementen (`Shift + Klick`), Ausrichten (Links, Zentriert, Gleichmäßiger Abstand).
  - 8px Baseline-Grid mit Snap-to-Grid Hilfslinien.
- [x] **Undo / Redo Transaktionsspeicher (`Ctrl+Z` / `Ctrl+Y`)**:
  - Volle Historie aller Aktionen mit Tastatur-Shortcuts.
- [x] **Device Breakpoint Simulator**:
  - Live-Umschaltung zwischen Desktop (1920px), Tablet Baustelle (1024px) und Smartphone (375px).
- [x] **AI-Copilot (Generative UI Assistant)**:
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



---

<a id="reportdesigner"></a>
# ReportDesigner

> **Originaldatei:** `docs/ReportDesigner.md`

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
- [x] **Berichtskopf (Report Header)**:
  - Wird genau **einmal** ganz am Anfang des Gesamtdokuments gedruckt (z. B. Deckblatt, Projekt-Titelbild, Anschreiben).
- [x] **Seitenkopf (Page Header)**:
  - Wird oben auf **jeder Seite** wiederholt (z. B. Minilogo, Projektname, Bauvorhaben, Datum, Spaltenüberschriften).
- [x] **Gruppenkopf (Group Header - Ebene n)**:
  - Beginnt bei jedem Gruppenwechsel (z. B. `Gewerk 01 - Rohbauarbeiten`, `Titel 02 - Erdarbeiten`).
  - Option: *"Auf jeder Folgeseite wiederholen, falls Gruppe umbrochen wird"* (`RepeatOnEveryPage`).
  - Option: *"Neue Seite bei Gruppenwechsel beginnen"* (`PageBreakBefore`).
- [x] **Detail-Bereich (Detail Band)**:
  - Wird für jeden einzelnen Datensatz / jede LV-Position gedruckt.
  - Dynamische Zeilenhöhe (Textumbruch für lange Leistungsbeschreibungen).
  - Option: *"Zeile nicht trennen"* (`KeepTogether` – verhindert halbe Zeilen am Seitenende).
- [x] **Gruppenfuß (Group Footer - Ebene n)**:
  - Summenzeile der Gruppe (z. B. `Summe Titel 02: 48.250,00 €`).
- [x] **Seitenfuß (Page Footer)**:
  - Wird unten auf **jeder Seite** gedruckt (z. B. Seitenzahl `"Seite X von Y"`, Druckdatum, Bearbeiter).
- [x] **Berichtsfuß (Report Footer)**:
  - Wird genau **einmal** am Ende des Gesamtdokuments gedruckt (z. B. Gesamtsumme Netto/MwSt/Brutto, Skontovermerk, Zahlungsbedingungen, Unterschriftsfelder).

---

## 📑 3. DIN 5008 / Baugewerbe Briefbogen & Geschäftsbrief-Engine

Für rechtskonforme Angebote, Rechnungen und Bautagesberichte nach deutschem Standard:

### 3.1 DIN 5008 Konformität (Form A / Form B)
- [x] **Absenderzeile (Rücksendeangabe)**:
  - Einzeilige Mini-Absenderzeile im Adressfenster (Schriftgröße 7-8pt): `Musterbau GmbH • Baustraße 1 • 10115 Berlin`.
- [x] **Empfänger-Adressfeld (Fensterbriefumschlag C4/C5)**:
  - Exakte Positionierung nach DIN 5008 (45mm x 85mm; Abstand von oben: Form A 27mm, Form B 45mm).
  - Zusatz-/Vermerkzone (z. B. `Einschreiben`, `Elektronische Vorabmitteilung`).
- [x] **Infoblock / Bezugszeichenblock (Rechts)**:
  - Rechtsbündiger oder tabellarischer Block mit:
    - *Unser Zeichen / Bearbeiter*
    - *Ihre Kundennummer / Rechnungsnummer*
    - *Projekt- / Baustellen-Nr.*
    - *Datum / Leistungszeitraum*
    - *Telefon / E-Mail*
- [x] **Dreispaltiger Firmen-Geschäftsfuß (Footer)**:
  - Spalte 1: Firmensitz, Registergericht, HRB-Nummer, Geschäftsführer.
  - Spalte 2: Bankverbindung, IBAN, BIC, Bankname.
  - Spalte 3: Steuernummer, USt-IdNr., Gläubiger-ID.

---

## 💶 4. Kaufmännische Summen-, Übertrag- & GAEB-Zwischensummen-Engine

Im Baugewerbe und bei mehrseitigen Rechnungen ist die korrekte Seitenübertragsrechnung zwingend vorgeschrieben:

### 4.1 Seitenübertrag (Carry-Over / Page Totals)
- [x] **Übertrag am Seitenende (Bottom Carry-Over)**:
  - Automatische Berechnung: `"Übertrag auf Seite (N+1): 124.500,00 €"`.
- [x] **Übertrag am Seitenanfang (Top Carry-Over)**:
  - Automatische Wiederholung auf Folgeseite: `"Übertrag von Seite N: 124.500,00 €"`.
- [x] **GAEB-Hierarchie-Summen**:
  - `Summe Position` ➔ `Summe Untertitel` ➔ `Summe Titel` ➔ `Summe Los` ➔ `Summe Gewerk` ➔ `Gesamtsumme Angebot`.
- [x] **Umsatzsteuer-Aufschlüsselung (Multi-Tax Matrix)**:
  - Automatische Tabelle im Rechnungsfuß nach Steuersätzen:
    - Netto 19% (z. B. Material/Leistung): `100.000,00 €` ➔ MwSt: `19.000,00 €`
    - Netto 7% (z. B. Sonderleistungen): `5.000,00 €` ➔ MwSt: `350,00 €`
    - Netto 0% (§13b UStG Bauleistungen / Steuerschuldnerschaft): `50.000,00 €` ➔ MwSt: `0,00 €`
    - **Gesamtbetrag Brutto**: `174.350,00 €`
- [x] **Sicherheitseinbehalt & Abzüge**:
  - Automatische Abzugsberechnung:
    - `- 5% Gewährleistungseinbehalt (VOB/B)`
    - `- 1% Bauwesenversicherung / Baustrom`
    - `- Geleistete Abschlagszahlungen (1. bis 3. Abschlag)`
    - `= Verbleibender Zahlbetrag`.

---

## 📦 5. Sub-Reports, Verknüpfungen & n-Ebenen Hierarchien

Ermöglicht verschachtelte Dokumente wie z. B. **Rechnung mit integriertem Aufmaßblatt** oder **Projektbericht mit Mängelprotokoll**:

- [x] **Master-Detail Verknüpfung**:
  - Übergabe von Primärschlüsseln aus dem Hauptbericht an den Sub-Report (`MasterField: "id" -> ChildField: "invoice_id"`).
- [x] **Inline- vs. Block-Sub-Reports**:
  - *Inline-Sub-Report*: Rendert direkt innerhalb des Detail-Bandes einer Position (z. B. Stückliste/Kalkulationsansatz zu einer LV-Position).
  - *Nachgelagerter Sub-Report*: Beginnt auf einer neuen Seite nach dem Hauptdokument (z. B. Anhang, AGBs, Fotodokumentation).
- [x] **Unabhängige Spaltenraster im Sub-Report**:
  - Hauptbericht mit 4 Spalten, Sub-Report mit 8 Spalten ohne Layout-Kollision.

---

## 🔲 6. Barcode-, QR-Code- & ZUGFeRD / XRechnung-Engine

- [x] **EPC-QR-Code (GiroCode)**:
  - Automatisches Generieren des europäischen Standard-Bank-QR-Codes im Rechnungsfuß.
  - Ermöglicht dem Kunden das sekundenschnelle Bezahlen per Banking-App ohne Tippfehler bei IBAN/Betrag/Verwendungszweck.
- [x] **Schweizer QR-Rechnung (Swiss QR Code)**:
  - QR-Bill Zahlteil nach Schweizer Standard mit Zahlungsreferenz (QRR) und Kreuz im Zentrum.
- [x] **Industrie-Barcodes**:
  - `Code 128`, `Code 39`, `EAN-13`, `DataMatrix` (z. B. für Lieferschein-Nummern, Inventar-Tags und Materialetiketten).
- [x] **E-Rechnung (ZUGFeRD 2.2 / XRechnung Factur-X)**:
  - Generierung von hybriden **PDF/A-3** Dokumenten mit eingebetteter `factur-x.xml`.
  - Pflicht ab 2025/2026 für B2B-Geschäftsverkehr in Deutschland und Europa.

---

## 🎨 7. Visueller Pixel-Perfect Drag & Drop Designer (Freeform Canvas)

Erweiterung von der reinen Spalten-Tabelle hin zum vollwertigen visuellen Dokumenten-Gestalter:

- [x] **Frei platzierbare Report-Elemente**:
  - [x] **Textfeld / Label**: Statischer Text oder dynamische Datenbindung (`{{ Kunde.Firma }}`).
  - [x] **Rechteck / Rahmen / Trennlinien**: Dekorative Boxen, Hintergrundflächen, Signaturlinien.
  - [x] **Bild / Logo**: Firmenlogos, Stempel, Prüfsiegel, Unterschriften.
  - [x] **Formel-Container**: `SUM()`, Datumsausdrücke, String-Verkettung.
  - [x] **Rich-Text / HTML-Block**: Formatierte Leistungsbeschreibungen mit Fettdruck, Listen und Absätzen.
- [x] **Ausrichtungs- & Layout-Hilfen**:
  - [x] Millimeter-/Punkt-Lineal (A4: 210mm x 297mm).
  - [x] Magnetische Fanglinien (Snap-to-Grid & Snap-to-Object).
  - [x] Ausrichtungs-Werkzeuge (Links-, Rechts-, Zentriert-, Oben-, Untenbündig, Gleichmäßiger Abstand).

---

## 🖨️ 8. Druck-, Paginierungs- & PDF-Export-Engine

- [x] **Perfekte PDF-Seitenumbruch-Kontrolle**:
  - [x] Waisen- und Witwenkontrolle (Verhindert einzelne Zeilen am oberen/unteren Seitenrand).
  - [x] Unterschriftenfeld darf nicht isoliert auf einer leeren letzten Seite stehen (`KeepWithNext`).
- [x] **Dynamische Paginierung**:
  - [x] `"Seite {PAGE_NUM} von {TOTAL_PAGES}"` (Zweiphasen-Rendering).
- [x] **Hintergrund-Briefpapier (Stationery Overlay / Underlay)**:
  - [x] Einbinden eines hochauflösenden PDF-Briefbogens als Hintergrund (Wasserzeichen / Firmenlayout).
  - [x] Getrenntes Briefpapier für *Seite 1* (mit Logo/Briefkopf) und *Folgeseiten* (schlichter Kopf).
- [x] **Archivierungsstandard PDF/A-1b & PDF/A-3b**:
  - [x] Vollständige Einbettung aller Schriften (Font Embedding).
  - [x] Konformität für revisionssichere Langzeitarchivierung (GoBD).

---

## ⚡ 9. Micro Frontend (MFE) Export & Druck-Service Integration

- [x] **MFE Print-Event-Bus**:
  - [x] Senden von Druckaufträgen aus anderen Micro Frontends:
    ```typescript
    eventBus.publish('PRINT_REPORT', {
      reportId: 'rep_schlussrechnung_vob',
      parameters: { invoiceId: 'INV-2026-0042' },
      outputFormat: 'pdf_download' // 'print_dialog' | 'email_direct'
    });
    ```
- [x] **Headless PDF Generation Service (Server-Side)**:
  - [x] Node.js Backend-Endpunkt: `POST /api/reports/render-pdf` für automatisierte Hintergrund-Generierung und nächtlichen Rechnungsversand.
- [x] **E-Mail-Versand-Integration**:
  - [x] Direktes Versenden des generierten PDF-Berichts als E-Mail-Anhang an Kunden/Nachunternehmer.

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



---

<a id="gaebandinterfaces"></a>
# GaebAndInterfaces

> **Originaldatei:** `docs/GaebAndInterfaces.md`

# Branchen-Schnittstellen (GAEB, DATANORM, ZUGFeRD) – Blueprint
**System: Enterprise Bausoftware & Kalkulation (MFE-Architektur)**  
*Status: Schnittstellen-Spezifikation, Parser/Generator-Konzepte & Checkliste*

---

## 📑 Inhaltsverzeichnis
1. [🟢 1. Übersicht der Baubranchen-Standards](#-1-übersicht-der-baubranchen-standards)
2. [📐 2. GAEB Datenaustausch (DA XML, GAEB 90, GAEB 2000)](#-2-gaeb-datenaustausch-da-xml-gaeb-90-gaeb-2000)
3. [📦 3. DATANORM 4.0 & 5.0 Großhandels-Kataloge](#-3-datanorm-40--50-großhandels-kataloge)
4. [💶 4. E-Rechnung (ZUGFeRD 2.2 / XRechnung Factur-X)](#-4-e-rechnung-zugferd-22--xrechnung-factur-x)
5. [🔄 5. Datenmapping & Import/Export Pipeline](#-5-datenmapping--importexport-pipeline)
6. [📅 6. Priorisierte Umsetzungs-Checkliste & Roadmap](#-6-priorisierte-umsetzungs-checkliste--roadmap)

---

## 🟢 1. Übersicht der Baubranchen-Standards

- [x] **GAEB (Gemeinsamer Ausschuss Elektronik im Bauwesen)**: Universeller Standard für Ausschreibungen und Angebote in Deutschland und Österreich.
- [x] **DATANORM**: Dateiformat zum Einlesen von Artikelstammdaten und Einkaufspreisen von Baustoff-, Sanitär- und Elektrogroßhändlern.
- [x] **ZUGFeRD / XRechnung**: Gesetzlicher Standard für elektronische Rechnungsstellung an öffentliche und B2B-Auftraggeber.

---

## 📐 2. GAEB Datenaustausch (DA XML, GAEB 90, GAEB 2000)

### 2.1 Unterstützte Phasen (Austauschphasen)
- [x] **Phase 81 (X81 / D81 / P81)**: *Leistungsbeschreibung (Ausschreibung / Vorabzug)*.
- [x] **Phase 82 (X82 / D82 / P82)**: *Kostenansatz (Kostenschätzung durch Planer)*.
- [x] **Phase 83 (X83 / D83 / P83)**: *Angebotsaufforderung (Ausschreibung zur Bepreisung)*.
- [x] **Phase 84 (X84 / D84 / P84)**: *Angebotsabgabe (Ausgefüllte Einheitspreise des Bauunternehmens)*.
- [x] **Phase 86 (X86 / D86 / P86)**: *Auftragserteilung (Vergabe-LV mit Festpreisen)*.

### 2.2 Parser & Generator Architektur
- [x] **GAEB DA XML 3.2 & 3.3 Engine**:
  - Validierung gegen offizielle XSD-Schemas des GAEB.
  - Hierarchische Rekursion: Projekt ➔ Gewerk ➔ Los ➔ Titel ➔ Untertitel ➔ Position.
  - Unterstützung für Langtexte (HTML, RTF, reiner Text) und Hinweistexte.
- [x] **GAEB 90 / 2000 Legacy Parser**:
  - Feste Satzlängen (Spaltenformat) und Zeilenumbruch-Verarbeitung.

---

## 📦 3. DATANORM 4.0 & 5.0 Großhandels-Kataloge

### 3.1 Dateitypen & Satzarten
- [x] **`DATANORM.001`**: Neuanlage von Artikelstammdaten (A-Satz, B-Satz).
- [x] **`DATANORM.WRG`**: Warengruppendatei.
- [x] **`DATANORM.RAB`**: Rabattgruppendatei für individuelle Firmenkonditionen.
- [x] **`DATPREIS.001`**: Reine Preisänderungsdatei (P-Satz).

### 3.2 Parsing & Datenbank-Import
- [x] **Streaming-Parser für Großdateien**:
  - Asynchrones Chunking (ermöglicht das Einlesen von Katalogen mit >100.000 Artikeln ohne UI-Blockade).
- [x] **Kalkulationsaufschlag**:
  - Automatisches Berechnen von Verkaufspreisen basierend auf Rabattgruppe und Marge:  
    $\text{VK} = \text{Brutto-Listenpreis} \times (1 - \text{Rabatt}) \times (1 + \text{Aufschlag})$.

---

## 💶 4. E-Rechnung (ZUGFeRD 2.2 / XRechnung Factur-X)

### 4.1 Hybrid-Format & Profile
- [x] **Profil "COMFORT" / "EXTENDED"**: Vollständige strukturierte Positionsdaten im XML.
- [x] **Profil "MINIMUM" / "BASIC"**: Kopf- und Summenprüfung.
- [x] **XRechnung-Profil (Profil CEN / EN 16931)**: Vollständige Konformität für Bundes- und Landesbehörden (Leitweg-ID).

### 4.2 PDF/A-3 Generierung
- [x] Einbettung der `factur-x.xml` in den PDF-Dateianhang (Attachment).
- [x] Validierung der Pflichtfelder:
  - Käuferreferenz (Leitweg-ID)
  - Bankverbindung (IBAN/BIC)
  - Steuernummern (USt-IdNr.)
  - Zahlungsziel & Skontofristen

---

## 🔄 5. Datenmapping & Import/Export Pipeline

```text
[GAEB / DATANORM / XML]
         │
         ▼ (Parser & Schema-Validierung)
[Standardisiertes Bau-AST / Zwischenformat]
         │
         ├──► [Tabellen-Import: tbl_positions / tbl_articles]
         └──► [Kalkulations-Engine (Calc-MFE)]
```

---

## 📅 6. Priorisierte Umsetzungs-Checkliste & Roadmap

- [x] **Phase 1: GAEB X83 / X84 XML Parser**:
  - [x] XML-Schema Parser für GAEB DA XML 3.2.
  - [x] Import in die Positionstabelle `tbl_positions`.
  - [x] Export von ausgefüllten Angebotspreisen als `.X84`.
- [x] **Phase 2: DATANORM 5.0 Importer**:
  - [x] Satzarten A, B, P und WRG einlesen.
  - [x] Batch-Insert in den Artikelstamm `tbl_articles`.
- [x] **Phase 3: ZUGFeRD 2.2 / XRechnung Generator**:
  - [x] XML-Generator basierend auf `tbl_invoices` Daten.
  - [x] PDF/A-3 Konverter mit Attachment-Integration im Report Designer.
- [x] **Phase 4: GAEB 90 Legacy Fallback**:
  - [x] Textbasierter Spalten-Parser für historische D83/D84 Dateien.




---

