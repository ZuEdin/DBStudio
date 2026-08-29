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
