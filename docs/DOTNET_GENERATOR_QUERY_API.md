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

## Durchgeführte Behebung

### 1. `generateSqlSelect` mit `usePascalCaseTableNames` (`utils/sqlHelper.ts`)
- `generateSqlSelect` unterstützt nun das Flag `usePascalCaseTableNames: boolean`.
- Bei Aktivierung werden Root-Tabellennamen sowie alle `JOIN`-Tabellennamen konsistent in PascalCase umgewandelt (`toPascalCase(rawTableName)`), passend zur generierten Datenbankstruktur.

### 2. .NET Seed & View-Initialisierung (`utils/generators/dotnet/seed.ts`)
- In `DbInitializer.Initialize` wird `generateSqlSelect(..., true)` mit aktiviertem PascalCase-Flag aufgerufen.
- Die erzeugten Views (z. B. `CREATE VIEW IF NOT EXISTS [MeineAbfrage] AS SELECT ... FROM [LehrlingeLehre] AS [node1]`) referenzieren exakt dieselben Tabellennamen, die per EF Core und `DbInitializer` angelegt wurden.

### 3. Schema & Database Generator (`utils/generators/databaseGenerator.ts`)
- Auch in `databaseGenerator.ts` werden die Views im generierten `schema.sql` synchron mit den PascalCase-Tabellendefinitionen erzeugt.

### 4. EF Core Spaltenmapping für Query-Modelle (`utils/generators/dotnet/models.ts`)
- Alle Properties in den generierten Query-Modellen (`Models/<QueryName>.cs`) erhalten nun explizit:
  - `[Column("<Spaltenname>")]` für sicheres EF Core View-Mapping (auch bei Sonderzeichen, Unterstrichen oder Aliasen).
  - `[JsonPropertyName("<Spaltenname>")]` für saubere REST API JSON-Serialisierung.

---

## API Endpoints für Abfragen (Queries)

| Methode | Route | Beschreibung |
| :--- | :--- | :--- |
| `GET` | `/api/queries/{queryName}` | Paginierte Abfrage des Views (`page`, `pageSize`, dynamic filters) |
| `GET` | `/api/queries/{queryName}?pageSize=1000` | Abruf aller Datensätze der Abfrage für Reports/Grids |
