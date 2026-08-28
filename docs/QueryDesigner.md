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
- [ ] **Visuelle Klick-Konfiguration auf Beziehungslinien**:
  - [ ] **`INNER JOIN` (Gleichheitsverknüpfung)**: Nur Datensätze einschließen, bei denen die verknüpften Felder in beiden Tabellen übereinstimmen.
  - [ ] **`LEFT OUTER JOIN`**: Alle Datensätze aus Tabelle A und die passenden aus Tabelle B (Standard).
  - [ ] **`RIGHT OUTER JOIN`**: Alle Datensätze aus Tabelle B und die passenden aus Tabelle A.
  - [ ] **`FULL OUTER JOIN`**: Alle Datensätze aus beiden Tabellen einschließen (für Vollständigkeitsanalysen).
  - [ ] **`CROSS JOIN` (Kartesisches Produkt)**: Matrix-Kombinationen (z. B. alle Gewerke x alle Baustellen für Planungsraster).
- [ ] **Self-Joins & Mehrfach-Instanzen derselben Tabelle**:
  - [ ] Selbe Tabelle mehrfach auf die Canvas ziehen (z. B. `tbl_mitarbeiter` als *Bauleiter* und `tbl_mitarbeiter` als *Vertreter*).
  - [ ] Eindeutige Alias-Verwaltung (`Mitarbeiter_Bauleiter`, `Mitarbeiter_Vertreter`).
- [ ] **Ad-hoc Join-Bedingungen (Non-Key Joins)**:
  - [ ] Verknüpfung auf beliebige Felder ohne expliziten Fremdschlüssel (z. B. Verknüpfung über `PLZ` oder `ProjektNummer`).
  - [ ] Komplexe Join-Bedingungen (z. B. `ON a.GueltigAb <= b.Datum AND a.GueltigBis >= b.Datum`).

---

## 🧮 3. Aggregationen, Fensterfunktionen & Baukalkulations-Ausdrücke

### 3.1 Erweiterte Baukalkulations- & Finanz-Funktionen
- [ ] **Kaufmännische Rundung & Währungs-Formatierung**:
  - [ ] `ROUND_CURRENCY(val)` (Rundet exakt kaufmännisch nach DIN 1333 auf 2 Dezimalstellen).
  - [ ] `SUM_CURRENCY(col)` mit Überlaufschutz für große Bauaufträge.
- [ ] **Kumulierte Summen & Zwischensummen (Rollup / Cube)**:
  - [ ] `GROUP BY ROLLUP(Gewerk, Los, Titel)`: Erzeugt automatische Zwischensummenzeilen für jede Hierarchiestufe im Leistungsverzeichnis.
- [ ] **SQL Fensterfunktionen (Window Functions / Analytic Functions)**:
  - [ ] `ROW_NUMBER() OVER (PARTITION BY ProjektId ORDER BY Ordnungszahl)` (Automatische Neunummerierung von Positionen).
  - [ ] `SUM(Gesamtbetrag) OVER (PARTITION BY ProjektId ORDER BY Rechnungsdatum)` (Kumulierter Rechnungsstand / Zahlungsverlauf).
  - [ ] `LAG(Preis, 1) OVER (PARTITION BY ArtikelId ORDER BY Datum)` (Preishistorie / Preissteigerungs-Vergleich zum Vormonat).
  - [ ] `DENSE_RANK()` / `PERCENT_RANK()` für Bieter-Rangfolgen im Preisspiegel.

### 3.2 Access- & Excel-Kompatibilitäts-Funktionen (Auto-Transpiler)
- [ ] Automatische Übersetzung historischer Access-Ausdrücke in ANSI-SQL:
  - [ ] `Nz([Feld], 0)` ➔ `COALESCE("Feld", 0)`
  - [ ] `IIf([Menge] > 10, 'Groß', 'Klein')` ➔ `CASE WHEN "Menge" > 10 THEN 'Groß' ELSE 'Klein' END`
  - [ ] `Format([Datum], 'yyyy-mm-dd')` ➔ `TO_CHAR` / `STRFTIME` / `FORMAT`
  - [ ] `DateDiff('d', [Start], [Ende])` ➔ Dialekt-spezifische Tagesdifferenz.

---

## 🎯 4. Parameter-, Filter- & Kriterien-Engine (Formeln & Formular-Binding)

### 4.1 Dynamische Abfrage-Parameter
- [ ] **Explizite Parameter-Definition**:
  - [ ] Parameter-Typen: `STRING`, `NUMBER`, `DATE`, `DATE_RANGE`, `BOOLEAN`, `ARRAY/MULTI_SELECT`.
  - [ ] Standardwerte und Pflichtfeld-Flags.
  - [ ] Syntax im SQL: `:p_projekt_id` oder `@ProjektId` oder `$1`.
- [ ] **Interaktiver Parameter-Prompt bei Ausführung**:
  - [ ] Vor der Ausführung öffnet sich automatisch ein modaler Dialog zur Eingabe der Parameterwerte (z. B. Datum von/bis oder Projektauswahl).

### 4.2 Kriterien-Zeilen & ODER-Logik (Grid Kriterien)
- [ ] **Mehrzeilige Kriterien im QBE-Grid**:
  - [ ] Gleiche Zeile = `UND` (AND-Bedingung).
  - [ ] Untereinanderliegende Kriterien-Zeilen = `ODER` (OR-Bedingung).
- [ ] **Filter-Operatoren-Syntax**:
  - [ ] Vergleichsoperatoren: `>`, `<`, `>=`, `<=`, `<>`, `!=`, `=`.
  - [ ] Textsuche: `LIKE 'Muster*'`, `STARTS_WITH`, `CONTAINS`, `REGEX`.
  - [ ] Mengenoperatoren: `IN ('Offen', 'In Bearbeitung')`, `NOT IN (...)`.
  - [ ] Bereichsoperatoren: `BETWEEN '2026-01-01' AND '2026-12-31'`.
  - [ ] Null-Prüfung: `IS NULL`, `IS NOT NULL`.

### 4.3 Formular- & Kontext-Bindung (`[Forms]![...]![...]`)
- [ ] **Laufzeit-Auflösung von UI-Kontextwerten**:
  - [ ] Auflösung von `[Forms]![RechnungsFormular]![ProjektId]` ➔ Liest den aktuell im geöffneten Formular ausgewählten Projekt-Wert.
  - [ ] Globale Session-Variablen: `[CurrentUserId]`, `[CurrentTenantId]`, `[ActiveProjectId]`, `[Today]`.

---

## ⚡ 5. Aktions- & Mutations-Abfragen (Action Queries & Bulk Updates)

Aktionsabfragen ermöglichen Massenoperationen im Hintergrund ohne zeilenweises Einzelschreiben:

### 5.1 Massen-Aktualisierung (Update Queries)
- [ ] **Index-Anpassungen & Teuerungszuschlag**:
  - [ ] Beispiel: *"Erhöhe alle Lohn-Einheitspreise im Los 02 um 3.5%"*.
  - [ ] SQL-Generierung: `UPDATE tbl_positions SET UnitPrice_Labor = UnitPrice_Labor * 1.035 WHERE ProjectId = :pid AND OZ LIKE '02.%';`
- [ ] **Massen-Statuswechsel**:
  - [ ] *"Setze alle geprüften Rechnungen mit Fälligkeit < Heute auf 'Überfällig'"*.

### 5.2 Anfüge- & Duplizier-Abfragen (Append Queries / Insert into ... Select)
- [ ] **LV-Positions-Kopierer**:
  - [ ] Kopieren ganzer Positionspakete von Projekt A nach Projekt B mit neuer ProjektId.
  - [ ] `INSERT INTO tbl_positions (ProjectId, OZ, ShortText, UnitPrice) SELECT :targetProjectId, OZ, ShortText, UnitPrice FROM tbl_positions WHERE ProjectId = :sourceProjectId;`

### 5.3 Tabellenerstellungs-Abfragen (Make Table / CTAS)
- [ ] **Kalkulations-Snapshot & Archivierung**:
  - [ ] Erzeugt eine physische Historientabelle zum Zeitpunkt der Angebotsabgabe (`CREATE TABLE tbl_quote_snapshot_2026_01 AS SELECT ...`).

### 5.4 Transaktions-Sicherheit & Dry-Run
- [ ] **Test-Lauf (Dry-Run / Preview)**:
  - [ ] Vor Ausführung anzeigen: *"Diese Abfrage wird 428 Datensätze in 'tbl_positions' modifizieren."*
  - [ ] Transaktionsschutz (`BEGIN TRANSACTION ... COMMIT / ROLLBACK`).

---

## 📊 6. Kreuztabellen-, Pivot- & Kostenmatrix-Abfragen

Für Baukalkulation und Finanzcontrolling sind Pivot-Abfragen unerlässlich:

- [ ] **Visueller Kreuztabellen-Assistent (Crosstab / Pivot Wizard)**:
  - [ ] **Zeilenüberschriften (Row Headers)**: z. B. `Gewerk` oder `ProjektId`.
  - [ ] **Spaltenüberschriften (Column Headers)**: z. B. `Monat` oder `Kostenart (L/M/G/S/NU)`.
  - [ ] **Zellenwerte (Value / Aggregation)**: `SUM(Gesamtbetrag)` oder `SUM(Arbeitsstunden)`.
- [ ] **Automatische SQL-Generierung für Pivot-Tabellen**:
  - [ ] PostgreSQL: `crosstab()` via `tablefunc` oder conditional aggregation (`SUM(CASE WHEN ...) AS Lohn`).
  - [ ] MS SQL Server: Native `PIVOT(...)` Syntax.
  - [ ] SQLite / MySQL: Dynamische `CASE WHEN`-Spaltensynthese.

---

## 🛡️ 7. SQL-Dialekt-Engine, Prepared Statements & SQL-Injection-Schutz

- [ ] **Sichere Parameter-Ersetzung (Prepared Statements)**:
  - [ ] Volle Trennung von SQL-Code und Datenwerten (kein unsicheres String-Concatenating).
  - [ ] Automatische Typ-Konvertierung und Escaping.
- [ ] **Multi-Dialekt DQL Generator**:
  - [ ] **PostgreSQL**: `LIMIT n OFFSET m`, `ILIKE`, `::jsonb`, `RETURNING`.
  - [ ] **SQLite**: `STRFTIME`, dynamische Typen.
  - [ ] **Microsoft SQL Server**: `TOP (n)`, `OFFSET n ROWS FETCH NEXT m ROWS ONLY`, `CONVERT()`.
  - [ ] **MySQL / MariaDB**: Backticks, `IFNULL()`, `GROUP_CONCAT()`.
- [ ] **SQL Syntax Highlighter & Live-Linter**:
  - [ ] Validierung von Tabellen- und Spaltennamen gegen das aktive Schema in Echtzeit.
  - [ ] Warnung bei unvollständigen `GROUP BY` Klauseln (SQL Standard-Konformität).

---

## 🚀 8. Performance, Virtualisiertes Live-Preview & Explain-Plan

- [ ] **Explain-Plan & Query-Kostenanalyse**:
  - [ ] Visualisierung des Ausführungsplans (Sequential Scan vs. Index Scan).
  - [ ] Erkennung fehlender Indizes mit 1-Klick-Button: *"Empfohlenen Index auf `tbl_positions.ProjectId` erstellen"*.
- [ ] **Virtualisiertes Daten-Grid für Vorschau**:
  - [ ] Schnelles Rendern von bis zu 100.000 Ergebniszeilen im Designer mit virtuellem DOM.
- [ ] **Query Execution Timeout & Limitierung**:
  - [ ] Standard-Limit im Entwurfsmodus (`LIMIT 500`) zur Vermeidung von Browser-Freezes.
  - [ ] Abbrechbare Abfragen (AbortController).

---

## 🔌 9. Micro Frontend (MFE) API-Export & REST/GraphQL Integration

Jede gespeicherte Abfrage kann direkt als Backend-Schnittstelle exportiert werden:

- [ ] **Automatischer REST-API-Endpunkt Generator**:
  - [ ] `GET /api/queries/v1/ProjektKostenUebersicht?projektId=1001`
  - [ ] Automatische Swagger / OpenAPI 3.0 Dokumentations-Generierung für die Abfrage.
- [ ] **TypeScript Data-Access Hook Generator**:
  - [ ] Generiert typsichere React/Angular Hooks:
    ```typescript
    export const useProjektKostenUebersicht = (projektId: string) => {
      return useQuery(['query', 'ProjektKostenUebersicht', projektId], () => 
        apiClient.get<ProjektKostenRow[]>(`/api/queries/ProjektKostenUebersicht`, { params: { projektId } })
      );
    };
    ```
- [ ] **Event-Bus Trigger**:
  - [ ] Option: Nach Ausführung einer Aktionsabfrage automatisch MFE-Event feuern (z. B. `CALCULATION_UPDATED`).

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
