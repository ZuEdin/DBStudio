# API & Datenmodell Dokumentation

Diese Datei dokumentiert das Datenbankschema, die IndexedDB-Architektur und alle REST-API-Schnittstellen für Live-Synchronisation, Schema-Introspection und SQL-Server-Anbindung.

---

## 1. Primäre Datenbank: IndexedDB (`DBStudioProDB`)

Das System nutzt als **höchste Priorität** den Browser-Speicher **IndexedDB** (`DBStudioProDB`) zur schnellen, extrem performanten und offline-fähigen Datenspeicherung ohne zwingende Server-Abhängigkeiten.

### Database Stores
- **`projects_meta`**: Speichert Metadaten aller lokalen Projekte (ID, Name, Erstellungsdatum, Tabellen-Anzahl, Letzte Änderung).
- **`projects_data`**: Speichert den vollständigen Datenstand inklusive:
  - `tables`: Definition aller Datenbanktabellen, Spalten (DataTypes, Constraints, Default Values) und Datensätze (Rows).
  - `queries`: Gespeicherte SQL-Abfragen & Visual Builder Konfigurationen.
  - `relationships`: ERD-Verknüpfungen (Fremdschlüssel, 1:1, 1:n, n:m Kardinalitäten).
  - `forms`: Formulardesigner-Layouts & Validierungsregeln.
  - `reports`: Berichts- & Dashboard-Widgets.
  - `workflows`: Automatisierungs-Knoten & Trigger.
  - `backendConfig`: Ziel-Backend Konfiguration (C# ASP.NET Core, Node.js Express, Python FastAPI, PHP Laravel).

---

## 2. Live-Server & Introspection REST APIs (`server.ts`)

Das Express-Backend stellt REST-Endpunkte für den Live-Sync, die Datenbank-Introspection und die Ausführung von DDL/DML auf externen SQL-Servern bereit:

### System & Health Check
- `GET /api/health`: Überprüft den Server-Status und Antwortzeit.
- `GET /api/config`: Gibt die aktuelle System- und Serverkonfiguration zurück.

### Projekte & Live Schema Sync Endpunkte
- `GET /api/projects`: Lädt alle auf dem Server gespeicherten Projekte und Schemata herunter.
- `GET /api/projects/:id`: Lädt ein spezifisches Projekt inklusive des vollständigen Daten-Payloads (Tabellen, Abfragen, Formulare).
- `POST /api/projects`: Persistiert oder aktualisiert ein lokales Schema/Projekt auf dem Server (Push).
- `DELETE /api/projects/:id`: Löscht ein Projekt vom Server.
- `POST /api/sync`: Sendet einen Heartbeat/Metadaten-Sync-Request zur Synchronisation.

### Live SQL Database Introspection & Direct Sync API
- `POST /api/db/introspect`:
  - **Funktion**: Verbindet sich mit einem externen SQL Server (Microsoft SQL Server / MSSQL, PostgreSQL, MySQL, SQLite) über Host, Port, Benutzername, Passwort & Datenbankname.
  - **Payload**:
    ```json
    {
      "type": "mssql" | "postgresql" | "mysql" | "sqlite",
      "host": "sql.firma.de",
      "port": 1433,
      "database": "production_db",
      "username": "db_user",
      "password": "secret_password",
      "ssl": true
    }
    ```
  - **Antwort**: Gibt alle analysierten `INFORMATION_SCHEMA`-Tabellen, Spaltentypen, Primary Keys, Foreign Keys und Datensätze zurück, die direkt in die lokale IndexedDB importiert werden können.

- `POST /api/db/execute-ddl`:
  - **Funktion**: Führt Schema-Änderungen (z. B. `CREATE TABLE`, `ALTER TABLE ADD COLUMN`, `DROP TABLE`) live auf der externen SQL-Datenbank aus, wenn im DB Studio eine Tabelle oder Spalte geändert wird.
  - **Payload**:
    ```json
    {
      "connection": { "type": "mssql", "host": "...", "database": "..." },
      "ddl": "CREATE TABLE \"Invoices\" (\"Id\" INT PRIMARY KEY, \"Amount\" DECIMAL(10,2));"
    }
    ```

---

## 3. Datenfilter- & Löschstrategien (Internal Engine API)

### Advanced Data Filter (`useDataFilter.ts`)
- **Filter-Operatoren**: `contains`, `equals`, `not_equals`, `starts_with`, `ends_with`, `greater_than`, `greater_equal`, `less_than`, `less_equal`, `is_empty`, `is_not_empty`.
- **Wildcard / Platzhalter Unterstützung**:
  - `*`: Beliebige Zeichenkette (`*GmbH` = Endet mit GmbH, `Herr*` = Beginnt mit Herr, `*Muster*` = Enthält Muster, `A*B` = Beginnt mit A und endet mit B).
  - `?`: Genau ein beliebiges Zeichen.
  - `%`: Alternative zu `*` (SQL-Syntax).
- **Match-Modi**: `AND` (alle Regeln erfüllen), `OR` (mindestens eine Regel erfüllen).

### Referential Integrity & Cascade Delete (`CascadeDeleteModal.tsx`)
- **CASCADE DELETE**: Löscht den Datensatz in der Elterntabelle sowie alle kaskadierend verknüpften Einträge in Kindtabellen.
- **SET NULL**: Setzt die Fremdschlüssel-Attribute in Kindtabellen auf `null` bzw. leer.
- **RESTRICT**: Blockiert den Löschvorgang, solange verknüpfte Datensätze existieren.

---

## 4. ER-Diagram & Schema Engineering Engine (`useERDiagramStore.ts`)

Die Beziehungs- und Schema-Designer-Tools sind über einen reaktiven Zustand mit dem Microsoft-Access-Ribbon (`Beziehungen-Tools`) verknüpft:

### Zustand & Store-Funktionen
- **Notationsstile**:
  - `crows_foot`: Information Engineering (Krähenfuß mit 1, 0..1, 1..N, 0..N Symbolen).
  - `uml`: UML Class Multiplizitäts-Notation (`1..*`, `0..1`, `1..1`).
  - `chen`: Peter Chen Entity-Relationship-Notation (`1:N`, `N:M`, `1:1`).
- **Layout-Engines**:
  - `auto_layout_tb`: Hierarchisches Top-Down DAG-Layout (Dagre-Algorithmus).
  - `auto_layout_lr`: Hierarchisches Left-Right DAG-Layout.
  - `layout_physics`: Kraftbasiertes Federkraft-Entflechtungssystem (Force-Directed Graph).
  - `layout_grid`: Gleichmäßige 4-Spalten Matrix-Ausrichtung.
- **Schema-Engineering Werkzeuge**:
  - `isDbmlOpen`: 2-Wege synchronisierter DBML Live-Code Split-Editor.
  - `isSqlReverseModalOpen`: SQL DDL Reverse Engineering Parser für `CREATE TABLE` und `ALTER TABLE`.
  - `isSchemaDiffModalOpen`: Schema-Diff Generator mit automatischen `UP` und `DOWN` SQL-Migrationsskripten.
  - `isMockDataModalOpen`: Topologisch sortierter, relationaler Fake-Data-Synthesizer.
  - `isDataDictionaryModalOpen`: Technischer Wörterbuch- und Dokumentations-Export (Markdown, TypeSpec, Prisma).
  - `isEnumManagerModalOpen`: Globale ENUM-Wertelisten und benutzerdefinierte Domänentypen.
  - `linterScore` & `linterIssuesCount`: Echtzeit-Analyse auf Namenskonventionen, fehlende Primär-/Fremdschlüssel und Indizes.


