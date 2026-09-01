# .NET Backend Generator – Query & SQL View Mapping Architecture

## Problemstellung & Ursachenanalyse

### Fehlerbild:
```text
Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 1: 'no such table: main.Lehrlinge_Lehre'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
```

### Warum erscheint `main.` im Fehler?
In **SQLite** ist `main` der interne Standard-Schemaname für die primäre Datenbankdatei (analog zu `dbo` in MSSQL oder `public` in PostgreSQL). Wenn SQLite einen SQL-View oder eine Abfrage ausführt und eine referenzierte Tabelle nicht findet, gibt SQLite die Fehlermeldung mit Schemapräfix aus (`no such table: main.<Tabellenname>`). Das Präfix `main.` wurde also nicht vom Code generiert, sondern ist die originäre Fehlerausgabe der SQLite-Engine.

### Ursache des Fehlers:
1. **Tabellenerstellung im .NET Generator**:
   - Im .NET Generator (`utils/generators/dotnet/seed.ts` und `models.ts`) werden alle Entitätstabellen für C#/EF Core im PascalCase-Format angelegt (z. B. `Lehrlinge_Lehre` &rarr; `LehrlingeLehre`, `CREATE TABLE [LehrlingeLehre] (...)` und `modelBuilder.Entity<LehrlingeLehre>().ToTable("LehrlingeLehre")`).
2. **View-Generierung für Queries**:
   - Beim Erstellen der SQL-Views (`CREATE VIEW [MeineAbfrage] AS SELECT ... FROM [Lehrlinge_Lehre]`) nutzte `generateSqlSelect` bisher die rohen Designernamen (`Lehrlinge_Lehre`).
   - SQLite fand beim Ausführen des Views `[MeineAbfrage]` die Tabelle `[Lehrlinge_Lehre]` nicht, da in der Datenbank nur `[LehrlingeLehre]` existierte.

---

### Fehlerbild 2:
```text
Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 1: 'no such column: Rechnungen.RechnungsNr'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at FakturierungPro.Controllers.QueriesController.GetOffeneRechnungen(Int32 page, Int32 pageSize)
```

### Ursache von Fehler 2:
1. **Knoten-Aliase in SQL-Joins**:
   - Wenn eine SQL-Abfrage aus mehreren Tabellen-Knoten (z. B. `n1`, `n2`) besteht, erzeugt SQL die Tabellen als `FROM [Kunden] AS [n1] LEFT JOIN [Rechnungen] AS [n2]`.
   - Sobald eine Tabelle im SQL-FROM/JOIN einen Alias besitzt (`AS [n2]`), verbietet SQLite (und ANSI-SQL), Spalten über den ursprünglichen Tabellennamen (`Rechnungen.RechnungsNr`) zu referenzieren.
   - Wenn in den Query-Spalten das Feld `nodeId` fehlte oder nicht direkt gemappt wurde, fiel der Spalten-Präfix fälschlicherweise auf `col.tableName` (`Rechnungen.RechnungsNr`) anstelle des Knoten-Alias (`n2.RechnungsNr`) zurück.
   - Beim Ausführen des Views in SQLite trat daraufhin `no such column: Rechnungen.RechnungsNr` auf.

---

## Durchgeführte Behebungen

### 1. Intelligente Spalten-Knoten-Auflösung (`utils/sqlHelper.ts`)
- Die neue Funktion `resolveColumnNode` mappt jede Spalte im `SELECT`, `WHERE`, `GROUP BY` und `ORDER BY` exakt auf den aktiven Knoten-Alias (`nodeInfo.alias`):
  1. Direkte `nodeId`-Übereinstimmung
  2. Tabellen-ID (`tableId`) Abgleich mit den Knoten
  3. Tabellennamen-Abgleich (`tableName` in PascalCase oder Designername)
  4. Spalten-/Feld-ID-Abgleich (`fieldId` oder `fieldName` in den Entitätsfeldern der Tabelle)
  5. Fallback auf den Root-Knoten-Alias
- Im `SELECT` werden alle Spalten nun immer mit `AS [Spaltenname]` exportiert, sodass die View-Spaltennamen exakt den C#-Properties und `[Column("...")]`-Attributen entsprechen.

### 2. `generateSqlSelect` mit `usePascalCaseTableNames` (`utils/sqlHelper.ts`)
- `generateSqlSelect` unterstützt das Flag `usePascalCaseTableNames: boolean`.
- Bei Aktivierung werden Root-Tabellennamen sowie alle `JOIN`-Tabellennamen konsistent in PascalCase umgewandelt (`toPascalCase(rawTableName)`), passend zur generierten Datenbankstruktur.

### 3. .NET Seed & View-Initialisierung (`utils/generators/dotnet/seed.ts`)
- In `DbInitializer.Initialize` wird `generateSqlSelect(..., true)` mit aktiviertem PascalCase-Flag aufgerufen.
- Die erzeugten Views (z. B. `CREATE VIEW IF NOT EXISTS [MeineAbfrage] AS SELECT [n2].[RechnungsNr] AS [RechnungsNr] ... FROM [Kunden] AS [n1] LEFT JOIN [Rechnungen] AS [n2] ON ...`) referenzieren exakt dieselben Tabellen und Aliase, die per EF Core und `DbInitializer` angelegt wurden.

### 4. Schema & Database Generator (`utils/generators/databaseGenerator.ts`)
- Auch in `databaseGenerator.ts` werden die Views im generierten `schema.sql` synchron mit den PascalCase-Tabellendefinitionen erzeugt.

### 5. EF Core Spaltenmapping für Query-Modelle (`utils/generators/dotnet/models.ts`)
- Alle sichtbaren Spalten (`c.show !== false`) in den generierten Query-Modellen (`Models/<QueryName>.cs`) erhalten explizit:
  - `[Column("<Spaltenname>")]` für sicheres EF Core View-Mapping (auch bei Sonderzeichen, Unterstrichen oder Aliasen).
  - `[JsonPropertyName("<Spaltenname>")]` für saubere REST API JSON-Serialisierung.

---

## API Endpoints für Abfragen (Queries)

| Methode | Route | Beschreibung |
| :--- | :--- | :--- |
| `GET` | `/api/queries/{queryName}` | Paginierte Abfrage des Views (`page`, `pageSize`, dynamic filters) |
| `GET` | `/api/queries/{queryName}?pageSize=1000` | Abruf aller Datensätze der Abfrage für Reports/Grids |
