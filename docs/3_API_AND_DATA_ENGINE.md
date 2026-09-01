# DB Studio Pro - API & Daten-Engine Referenz

> Technische Dokumentation für APIs, das SQL-Ausführungssystem, die lokale IndexedDB-Engine, EventBus-Verträge, QBE-Query-Designer und Feldformatierungen.

## Inhaltsverzeichnis

1. [API](#api)
2. [APIs](#apis)
3. [API DOCUMENTATION](#api-documentation)
4. [API SCHEMA DESIGNER](#api-schema-designer)
5. [ButtonInfoAPI](#buttoninfoapi)
6. [PAGE FIELD FORMATTING API](#page-field-formatting-api)
7. [QBE QUERY DESIGNER API](#qbe-query-designer-api)
8. [SQL ENGINE AND INDEXEDDB API](#sql-engine-and-indexeddb-api)
9. [EventBusContracts](#eventbuscontracts)

---

<a id="api"></a>
# API

> **Originaldatei:** `docs/API.md`

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





---

<a id="apis"></a>
# APIs

> **Originaldatei:** `docs/APIs.md`

# Datenbank- & API-Spezifikation (IndexedDB & SQL/MySQL Abstraktion)

Diese Spezifikation beschreibt die Datenhaltungs- und API-Architektur des Projekts. Sie stellt sicher, dass das System standardmäßig vollständig offline-fähig und performant auf **IndexedDB** operiert, während die Schnittstellen so entkoppelt sind, dass ein Wechsel auf ein SQL-basiertes Backend (z. B. PostgreSQL, MySQL, SQLite) mit minimalem Aufwand realisierbar ist.

---

## 1. Datenhaltungs-Strategie

Das Projekt nutzt ein zweistufiges Modell für maximale Flexibilität:

1. **Lokale Priorität (IndexedDB)**:
   - Alle Tabellen, Schemata, Abfragen, Formulare, Seiten (Pages) sowie die tatsächlichen Nutzdaten werden über den `storageService` lokal im Browser in einer IndexedDB-Datenbank namens `DBStudioProDB` gespeichert.
   - Dies ermöglicht sofortige Ladezeiten, Offline-Unterstützung und eine sandboxierte Entwicklungsumgebung für den Benutzer.

2. **Zukünftige Cloud-Migration (SQL/MySQL/Postgres)**:
   - Die internen Datenstrukturen und Abfragen sind nach dem relationalen Datenbankmodell entworfen (mit Primärschlüsseln, Fremdschlüsseln und strukturierten Tabellendefinitionen).
   - Um auf eine SQL-Datenbank umzustellen, muss lediglich der `storageService` bzw. der API-Client gegen einen REST- oder GraphQL-Service ausgetauscht werden, der dieselben Payload-Modelle bedient.

---

## 2. API-Schnittstellen (Payloads & Endpunkte)

Nachfolgend sind die standardisierten API-Endpunkte spezifiziert, die für ein zukünftiges SQL-Backend implementiert werden können.

### 2.1. Projekte (Projects)

Verwaltet die logischen Arbeitsbereiche des Nutzers. Ein Projekt enthält Tabellen, Formulare, Queries und Pages.

#### `GET /api/projects`
Gibt eine Liste aller Projekte zurück.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "project-uuid-1",
      "name": "Kunden- & Auftragsverwaltung",
      "lastModified": 1719231259000
    }
  ]
  ```

#### `POST /api/projects`
Erstellt ein neues Projekt.
- **Request Body**:
  ```json
  {
    "name": "Personalplaner"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": "new-project-uuid",
    "name": "Personalplaner",
    "lastModified": 1719231259000,
    "tables": [],
    "queries": [],
    "forms": [],
    "pages": []
  }
  ```

#### `PUT /api/projects/:id`
Speichert das vollständige Projekt-Schema und die Konfigurationen.
- **Request Body**: Vollständiges `Project`-Objekt (siehe Abschnitt 3).
- **Response (200 OK)**: `{ "status": "saved" }`

---

### 2.2. Dynamische Nutzdaten-APIs (CRUD)

Diese APIs verwalten die eigentlichen Zeilen und Spalten der vom Benutzer erstellten Tabellen. Sie mappen 1:1 auf SQL-Inserts, Updates und Deletes.

#### `GET /api/projects/:projectId/tables/:tableId/data`
Liest alle Zeilen (Datensätze) einer benutzerdefinierten Tabelle aus.
- **Query Parameter (Optional)**:
  - `_filterField`: Name der Spalte (z. B. `UserId`)
  - `_filterValue`: Wert (z. B. `123`)
- **Response (200 OK)**:
  ```json
  [
    { "Id": "1", "Vorname": "Max", "Nachname": "Mustermann", "E-Mail": "max@test.de", "UserId": "123" },
    { "Id": "2", "Vorname": "Erika", "Nachname": "Musterfrau", "E-Mail": "erika@test.de", "UserId": "456" }
  ]
  ```

#### `POST /api/projects/:projectId/tables/:tableId/data`
Fügt einen neuen Datensatz hinzu. Entspricht SQL: `INSERT INTO tableId (...) VALUES (...)`
- **Request Body**:
  ```json
  {
    "Vorname": "John",
    "Nachname": "Doe",
    "E-Mail": "john@doe.com"
  }
  ```
- **Response (201 Created)**:
  ```json
  { "Id": "3", "Vorname": "John", "Nachname": "Doe", "E-Mail": "john@doe.com" }
  ```

#### `PUT /api/projects/:projectId/tables/:tableId/data/:recordId`
Aktualisiert einen bestehenden Datensatz anhand seines Primärschlüssels. Entspricht SQL: `UPDATE tableId SET ... WHERE Id = recordId`
- **Request Body**:
  ```json
  {
    "Vorname": "John (Updated)",
    "E-Mail": "john.updated@doe.com"
  }
  ```
- **Response (200 OK)**:
  ```json
  { "Id": "3", "Vorname": "John (Updated)", "Nachname": "Doe", "E-Mail": "john.updated@doe.com" }
  ```

#### `DELETE /api/projects/:projectId/tables/:tableId/data/:recordId`
Löscht einen Datensatz. Entspricht SQL: `DELETE FROM tableId WHERE Id = recordId`
- **Response (200 OK)**:
  ```json
  { "status": "deleted", "id": "3" }
  ```

---

## 3. Einheitliches TypeScript Datenmodell (`types/index.ts`)

Dieses Modell wird im Frontend verwendet und lässt sich einfach in relationale Tabellen übersetzen:

```typescript
export interface Table {
  id: string;          // Mapped auf SQL-Tabellenname oder ID
  name: string;        // Anzeigename
  fields: Field[];     // Spaltendefinitionen (Datentypen, PK, FK)
  data: any[];         // Datensätze (In SQL: Zeilen der Tabelle)
}

export interface Field {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  isPrimaryKey: boolean;
  isForeignKey?: boolean;
  foreignKeyTableId?: string;
  foreignKeyField?: string;
}

export interface CustomPage {
  id: string;
  name: string;
  layout: PageComponent;
}

export interface PageComponent {
  id: string;
  type: PageComponentType;
  props: Record<string, any>; // z.B. actionType, selectionParamName, filterParamField, subPageId, parameterMappings
  children?: PageComponent[];
}

export type PageComponentType = 
  | 'container'
  | 'text'
  | 'button'
  | 'dropdown'
  | 'table_view'
  | 'list_repeater'
  | 'subpage_container';
```

---

## 4. Sub-Page & Parameter-Passing Flow

Die Interaktion zwischen Haupt- und Unterseiten verläuft nach folgendem relationalen Prinzip:

1. **Parameter Definition**: Eine übergeordnete Seite setzt bei einer Benutzerinteraktion (z. B. Tabellen-Zeilenklick oder Button-Klick) einen Parameter:
   - Parameter: `selectedId = "row-456"`
2. **Subpage Parameter Mapping**: Der `subpage_container` empfängt die Konfiguration:
   - Mapping: `selectedId ➔ customerId`
3. **Subpage Filterung**: Auf der eingebundenen Unterseite wird eine `table_view` oder ein Repeater mit folgender Filterung platziert:
   - Filter-Feld: `CustomerId` (in der Tabelle)
   - Filter-Parameter: `customerId`
4. **Ausführung**: Die Unterseite rendert dynamisch nur diejenigen Zeilen, die zum übergebenen Kunden gehören (Master-Detail Ansicht).

---

### 4.1. Schritt-für-Schritt Anleitung: Wo wird was im Designer eingegeben?

Um das Beispiel **Standort (Tabelle) ➔ ID auswählen ➔ Subpage einblenden & Standort-Details anzeigen** im Designer umzusetzen, gehen Sie wie folgt vor:

#### Schritt 1: Hauptseite & Auslöser konfigurieren (Standort-Tabelle)
1. Platzieren Sie auf Ihrer Hauptseite eine **Tabelle** (z. B. mit Daten aus Ihrer Standort-Tabelle).
2. Klicken Sie auf die Tabelle, um die Eigenschaften im rechten Seitenmenü zu öffnen.
3. Scrollen Sie nach unten zum Bereich **Tabellen-Interaktionen**:
   - **Zeilenklick-Aktion**: Wählen Sie `Parameter setzen` aus.
   - **Parameter Name**: Geben Sie `selectedId` ein.
   - **Parameter Spalte**: Wählen Sie `id` aus.
   - **Ereignis-Trigger für Details**: Wählen Sie zwischen `Einfacher Klick` (Standard, sofortige Ausführung) oder `Doppelklick` (markiert Zeile bei Klick, öffnet Details erst bei Doppelklick).
   *Effekt:* Sobald ein Nutzer eine Zeile der Tabelle anklickt (oder doppelklickt, je nach Einstellung), wird die ID dieses Standorts im globalen Parameter `selectedId` gespeichert.

#### Schritt 2: Unterseite erstellen & Filterung einrichten (Standort-Details)
1. Erstellen Sie eine neue Seite (z. B. namens `Standort Details`).
2. Aktivieren Sie in den Seiteneinstellungen die Option **Als Unterseite (Subpage) verwenden** (damit sie nicht im Hauptmenü erscheint).
3. Platzieren Sie eine Detail-Tabelle oder Felder auf dieser Seite.
4. Klicken Sie die Detail-Tabelle an und scrollen Sie rechts zu **Daten filtern über Parameter**:
   - **Filter-Spalte**: Wählen Sie `id` (oder `standort_id` falls es sich um verknüpfte Daten handelt).
   - **Filter-Parameter Name**: Tragen Sie hier den Namen des Unterseiten-Parameters ein, z. B. `targetStandortId`.
   *Effekt:* Diese Detail-Tabelle zeigt nur noch Zeilen an, deren ID-Spalte mit dem Wert übereinstimmt, der ihr als `targetStandortId` übergeben wird.

#### Schritt 3: Unterseite auf der Hauptseite einbinden (Subpage Container)
1. Gehen Sie zurück zur Hauptseite.
2. Ziehen Sie einen **Unterseiten-Container (Sub-Page)** auf die Seite.
3. Klicken Sie den Container an, um rechts die Einstellungen zu öffnen:
   - **Eingebundene Seite (Sub-Page)**: Wählen Sie `Standort Details`.
4. Scrollen Sie im rechten Panel zum Bereich **Parameter-Mappings (Übergabe an Unterseite)**:
   - Klicken Sie auf **Mapping hinzufügen**.
   - **Parent Parameter (Quelle)**: Tragen Sie `selectedId` ein.
   - **Sub Parameter (Ziel)**: Tragen Sie `targetStandortId` ein.
   *Effekt:* Die ID aus der Hauptseite wird als Parameter an die Unterseite weitergereicht.

#### Schritt 4: Sichtbarkeit steuern (Optional)
Damit die Unterseite erst sichtbar wird, wenn tatsächlich ein Standort angeklickt wurde, konfigurieren Sie am **Unterseiten-Container (Sub-Page)** unter Sichtbarkeit:
- **Filter-Feld**: Tragen Sie `selectedId` ein.
- **Operator**: Wählen Sie `ist gesetzt (nicht leer)`.
*Effekt:* Der Container ist anfangs unsichtbar. Erst wenn ein Standort in der Tabelle angeklickt wurde und `selectedId` einen Wert erhält, blendet sich die Unterseite geschmeidig ein.

---

## 5. Schema & Project Import API Specifications

To allow users to bootstrap database structures quickly, the system supports importing raw SQL, JSON, or CSV schemas directly. These are stored locally inside **IndexedDB** for fast client-side accessibility, but can easily be bound to a REST / JSON API backend proxy.

### 5.1. Import Endpoint (Schema & Data Parsing)

#### `POST /api/projects/:projectId/import-schema`
Parses pasted text schemas (SQL DDL, JSON Schema, CSV format, or JSON lists) and registers them as new tables within the project.

- **Request Payload**:
  ```json
  {
    "inputText": "CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(255));",
    "format": "sql"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "tables": [
      {
        "id": "table-uuid-1",
        "name": "customers",
        "fields": [
          { "id": "field-uuid-1", "name": "id", "type": "INTEGER", "isPrimaryKey": true, "allowNull": false },
          { "id": "field-uuid-2", "name": "name", "type": "VARCHAR", "isPrimaryKey": false, "allowNull": true }
        ],
        "data": []
      }
    ]
  }
  ```

---

## 6. IndexedDB Storage Architecture & Backend Synchronization

To keep local development responsive, all state synchronization follows a decoupled queue pattern. Later migratable backend engines (MySQL, Postgres, etc.) can be seamlessly plugged in.

```text
+------------------------------------------+
|            Client View Layer             |
+------------------------------------------+
                     |
                     v
+------------------------------------------+
|          stores/useProjectStore          |
+------------------------------------------+
                     |
       +-------------+-------------+
       |                           | (Async Sync)
       v                           v
+--------------+           +---------------+
|  IndexedDB   |           |  SQL Backend  |
|  (Priority)  |           | (Optional API)|
+--------------+           +---------------+
```

All table structural changes trigger `saveProjectToStorage()` or `addTable()`, operating asynchronously with IndexedDB as the source of truth, offering instantaneous state restores and offline compatibility.

---

## 7. Collaborative Tickets & Tasks API Specifications

To allow designers and developers to coordinate schema adjustments, query tuning, and reports, the system supports a Kanban Ticket Board.

### 7.1. SQL Database Table Schema (`sys_tickets`)

For direct integration with relational backends (PostgreSQL, MySQL, SQLite), the following DDL describes the storage format:

```sql
CREATE TABLE sys_tickets (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'done'
    priority VARCHAR(10) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
    assigned_to VARCHAR(50) NOT NULL DEFAULT 'all', -- ID or 'all'
    assigned_to_name VARCHAR(100) NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    created_by_name VARCHAR(100) NOT NULL,
    created_at BIGINT NOT NULL
);
```

### 7.2. REST API Endpoints

#### `GET /api/tickets`
Fetches all task tracking cards.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "ticket-1",
      "title": "Datenbankschema für Kunden & Rechnungen anlegen",
      "description": "Bitte erstelle die Tabelle sys_customers mit Primärschlüssel.",
      "status": "todo",
      "priority": "high",
      "assignedTo": "u2",
      "assignedToName": "Sarah Lee",
      "createdBy": "u1",
      "createdByName": "Me",
      "createdAt": 1719631200000
    }
  ]
  ```

#### `POST /api/tickets`
Creates a new task.
- **Request Body**:
  ```json
  {
    "title": "Query-Tuning",
    "description": "Index auf Kunden-ID hinzufügen.",
    "priority": "high",
    "assignedTo": "u3"
  }
  ```
- **Response (201 Created)**: Created ticket object with status `'todo'`.

#### `PATCH /api/tickets/:id/status`
Updates a ticket's kanban stage (To Do, In Progress, Done).
- **Request Body**:
  ```json
  {
    "status": "in_progress"
  }
  ```
- **Response (200 OK)**: `{ "status": "updated" }`

#### `DELETE /api/tickets/:id`
Deletes an task.
- **Response (200 OK)**: `{ "status": "deleted" }`

---

## 8. IndexedDB Local Storage Specifications

As prioritized, all collaborative elements are backed by standard **IndexedDB** databases directly in the browser to enable instantaneous state restoration, offline-first reliability, and seamless scaling.

### 8.1. Tickets Storage
- **Database Name**: `DBStudioProTickets`
- **Object Store**: `tickets`
- **Key Path**: `id`
- **Fallback Seeding**: Provided automatically on the first load to populate realistic database schema designer, index-optimization, and validation tasks.

### 8.2. Chats & Messages Storage
- **Database Name**: `DBStudioProChats`
- **Object Store**: `chats`
- **Key Path**: `id`
- **Schema Shape**:
  ```typescript
  interface Chat {
      id: string;
      type: 'private' | 'group';
      name: string;
      participants: string[];
      messages: ChatMessage[];
      unreadCount?: number;
      isOnline?: boolean;
  }
  ```
- **Updates**: Any sent message is instantly pushed into the local object store asynchronously before updating local React state, minimizing the risk of data loss.

---

## 9. Premium Backend-API Proxy & Cache-Manager (Option A & Option B)

Um CORS-Fehler im Browser zu vermeiden, sensible API-Schlüssel/Credentials sicher zu verbergen und Offline-Betrieb zu garantieren, verfügt das System über eine integrierte Premium-Schnittstelle im Node.js-Backend.

Diese verwaltet registrierte externe APIs im Dateisystem unter `data/backend_api_configs.json` und unterstützt zwei flexible Betriebsmodi:

### 9.1. Betriebsmodi

*   **Option A: Live Echtzeit-Proxy**
    *   Der Server fungiert als direkter Proxy. Bei jedem Aufruf von `/api/backend-apis/:name/data` holt der Server die Daten live von der konfigurierten URL ab, fügt evtl. definierte Header oder Query-Parameter hinzu, führt sie aus und reicht das Ergebnis an das Frontend weiter.
    *   *Vorteil*: Extrem sicher (keine Credentials im Browser sichtbar) und immer top-aktuelle Daten.
*   **Option B: Server-Datenbank & Cache**
    *   Der Server zieht die Daten von der externen Quelle ab und legt sie in einer lokalen JSON-Datenbankdatei auf dem Server ab (z. B. `data/api_cache_Kunden.json`). Abfragen werden blitzschnell und ohne Netzwerklatenz direkt aus dem Cache bedient.
    *   Der Cache kann manuell aktualisiert werden oder über ein Hintergrund-Intervall (z. B. alle 10 Minuten, 30 Minuten, stündlich, täglich).
    *   *Vorteil*: Voller Offline-Betrieb, keine externen API-Ausfälle, und die gecachten Daten können direkt auf dem Server editiert und manipuliert werden.

### 9.2. API Endpunkte (Backend-APIs)

#### `GET /api/backend-apis`
Gibt eine Liste aller im Backend registrierten API-Konfigurationen zurück.
*   **Response (200 OK)**:
    ```json
    [
      {
        "name": "KundenAPI",
        "url": "https://jsonplaceholder.typicode.com/users",
        "method": "GET",
        "option": "B",
        "refreshInterval": 30,
        "lastRefreshed": "2026-07-07T15:30:00.000Z"
      }
    ]
    ```

#### `POST /api/backend-apis`
Registriert oder aktualisiert eine API-Konfiguration im Backend.
*   **Request Body**:
    ```json
    {
      "name": "KundenAPI",
      "url": "https://jsonplaceholder.typicode.com/users",
      "method": "GET",
      "headers": "{\"Authorization\": \"Bearer SECRET_TOKEN\"}",
      "queryParams": [],
      "option": "B",
      "refreshInterval": 30,
      "fields": [],
      "data": []
    }
    ```
*   **Response (200 OK)**: `{ "status": "registered", "name": "KundenAPI" }`

#### `DELETE /api/backend-apis/:name`
Löscht eine registrierte API-Konfiguration und deren gecachte Server-Datenbankdatei.
*   **Response (200 OK)**: `{ "status": "deleted", "name": "KundenAPI" }`

#### `POST /api/backend-apis/:name/refresh`
Erzwingt eine sofortige Synchronisierung des Server-Caches (holt live Daten von der externen API und aktualisiert die lokale JSON-Datenbankdatei auf dem Server).
*   **Response (200 OK)**: `{ "status": "refreshed", "records": 10 }`

#### `GET /api/backend-apis/:name/data`
Liefert die Daten der registrierten API zurück.
*   *Bei Option A*: Holt die Daten live von der externen URL und liefert sie aus.
*   *Bei Option B*: Liefert die im Server-Cache gespeicherten JSON-Daten extrem schnell und offline-fähig aus.
*   **Response (200 OK)**: Array von JSON-Objekten (Datensätze).

#### `PUT /api/backend-apis/:name/data`
Aktualisiert die im Server-Cache (Option B) gespeicherten Daten direkt auf dem Server. Dies ermöglicht es dem Benutzer, Zeilen hinzuzufügen, zu bearbeiten oder zu löschen, welche direkt auf dem Server synchronisiert werden!
*   **Request Body**: Array aller neuen/modifizierten Datenzeilen.
*   **Response (200 OK)**: `{ "status": "updated", "records": 10 }`

---

## 10. SharePoint & XML API Integration (Auto-Format-Detection)

Das System verfügt über eine integrierte **Format-Erkennung (JSON oder XML)** im Frontend und Node.js-Backend. Dadurch können sowohl standardmäßige REST-APIs als auch ältere SOAP-Dienste oder Microsoft SharePoint-Listen nahtlos angebunden werden.

### 10.1. Automatische Erkennung & Konvertierung
*   **XML-Erkennung**: Beginnt eine API-Antwort mit `<` (z. B. `<?xml` oder `<feed`), schaltet das System automatisch in den XML-Parsing-Modus um.
*   **Namensraum-Bereinigung**: XML-Element-Namensräume (z. B. `<d:Title>` oder `<m:properties>`) werden automatisch bereinigt. Im Frontend-Raster (Grid) erscheinen sie als flache, saubere Schlüssel wie `Title` oder `ID`.
*   **Listen-Extraktion**: Das System extrahiert automatisch das größte enthaltene Array (z. B. RSS `<item>`-Listen, SOAP-Arrays oder SharePoint `<entry>`-Objekte) und stellt diese als Zeilen im Grid dar.

### 10.2. SharePoint-Listen aufrufen (Anleitung)

Wenn Sie eine bestimmte Liste aus SharePoint Online importieren möchten, führen Sie folgende Schritte im **API-Laden / Import**-Tool aus:

#### 1. Die richtige SharePoint-URL konstruieren
Die SharePoint REST-API verwendet das OData-Protokoll. Verwenden Sie folgendes URL-Format:
```text
https://{ihr-unternehmen}.sharepoint.com/sites/{ihre-website}/_api/web/lists/getbytitle('{listen-name}')/items
```
*Beispiel*: `https://acme.sharepoint.com/sites/Vertrieb/_api/web/lists/getbytitle('Kundenliste')/items`

#### 2. Notwendige Header hinzufügen
Da SharePoint standardmäßig XML im Atom-Feed-Format zurückgibt, können Sie dieses entweder direkt XML-parsen lassen oder durch Angabe von Headern JSON anfordern:
*   **Für JSON-Rückgabe (Empfohlen)**:
    Fügen Sie im Header-Bereich folgenden Eintrag hinzu:
    *   `Accept`: `application/json;odata=verbose`
*   **Für XML-Rückgabe (Fallunterscheidung)**:
    Wenn Sie keine Header angeben, liefert SharePoint XML zurück. Unser Parser verarbeitet das Atom-Feed-Format automatisch, holt die `<entry>`-Elemente heraus und flacht die `<content><m:properties>` ab.

#### 3. Authentifizierung (Bearer Token oder Cookie)
SharePoint Online erfordert eine Authentifizierung. Fügen Sie einen entsprechenden Header hinzu:
*   `Authorization`: `Bearer {Ihr_OAuth_Token}`
*   Alternativ können Sie temporäre Session-Cookies im Browser mitsenden, wenn Sie im gleichen Browser bei SharePoint eingeloggt sind (`credentials: "include"`).

#### 4. Registrieren als Premium-Backend-API
Um CORS-Probleme des SharePoint-Servers im Browser zu umgehen, registrieren Sie die SharePoint-API als **Backend-API (Option A oder B)**:
1. Tragen Sie SharePoint-URL und Header ein.
2. Klicken Sie auf **"Als Tabelle speichern"** -> **"Als Backend-API speichern (Premium)"**.
3. Wählen Sie **Option A (Proxy)** oder **Option B (Server Cache)**.
4. Das Node.js-Backend übernimmt nun die sichere Kommunikation und reicht die Daten sauber an Ihr Daten-Studio weiter!

---

## 11. Erweiterter Excel-Import (Mehrere Arbeitsblätter, Auto-Enums & SVERWEIS)

Das Excel-Import-System verfügt über erstklassige, automatisierte Datenvorbereitungs- und Mapping-Features, um die Datenqualität beim Importieren massiv zu erhöhen.

### 11.1. Arbeitsblatt-Auswahl (Multiple Sheets)
*   **Automatische Erkennung**: Beim Laden einer Excel-Arbeitsmappe (`.xlsx`) wird geprüft, ob sich darin mehrere Mappenblätter (Arbeitsblätter) befinden.
*   **Visuelle Auswahlliste**: Sind mehrere Blätter vorhanden, wird dem Benutzer im ersten Schritt eine intuitive Auswahlliste präsentiert. Der Benutzer wählt das gewünschte Arbeitsblatt aus, um den Importvorgang fortzusetzen.
*   **Dynamische Umschaltung**: Im Spalten-Zuweisungsschritt kann der Benutzer jederzeit über ein Dropdown-Menü zwischen den Arbeitsblättern hin- und herwechseln. Die Tabellenvorschau und die Spaltenerkennung aktualisieren sich verzögerungsfrei.

### 11.2. Intelligente Enum-Erkennung (Dropdowns & Datenüberprüfung)
*   **Kardinalitäts-Analyse**: Spalten, die weniger als oder genau 15 eindeutige Werte besitzen (und mindestens 3 Zeilen enthalten), werden automatisch als `ENUM`-Datentyp erkannt.
*   **Interaktiver Enum-Editor**: Im Spaltenzuweisungs-Schritt kann der Benutzer die erkannten Dropdown-Optionen einsehen, löschen oder manuell neue Optionen hinzufügen.
*   **Payload-Modell**: Enum-Werte werden im Feld-Objekt als `enumValues` vom Typ `string[]` definiert und nahtlos in der IndexedDB gespeichert.

### 11.3. SVERWEIS / Beziehungs-Vorschläge (VLOOKUP Relationships)
*   **Ähnlichkeits-Suche**: Das System vergleicht Spaltennamen automatisch mit den Namen und Primärschlüsseln aller im Projekt bereits vorhandenen Tabellen (z. B. Spalte `kunde_id` zu Tabelle `Kunden`).
*   **Verknüpfungs-Dropdown**: Wird eine Ähnlichkeit erkannt, schlägt der Assistent automatisch eine Beziehung vor. Der Benutzer kann die Beziehung manuell anpassen oder auf eine andere Tabelle verweisen.
*   **Beziehungs-Erstellung**: Nach dem Import wird die neue Tabelle mitsamt allen ausgewählten `1:n`-Beziehungen im globalen Beziehungs-Schema des Daten-Studios registriert. Diese Verknüpfungen stehen sofort in Abfragen (Queries) und im ER-Diagramm zur Verfügung.

## 12. ENUM-Felder & Dropdown-Werte (Tabellenentwurf & Datenblatt)

### 12.1. Feld-Konfiguration im Tabellenentwurf
*   **Datentyp**: Bei Auswahl des Datentyps `ENUM` im Tabellenentwurf (`TableDesigner`) wird im Bereich *Feldeigenschaften* ein visueller **ENUM-Auswahlwerte-Manager** eingeblendet.
*   **Werte-Eingabe**:
    *   **Einzeleingabe**: Wert tippen und mit `Enter` oder `+ Hinzufügen` bestätigen.
    *   **Komma-getrennte Mehrfacheingabe**: z. B. `Offen, In Bearbeitung, Erledigt, Storniert` wird automatisch in separate Auswahlwerte aufgeteilt.
    *   **Schnellvorlagen (Presets)**: Vorlagen für Anrede, Status, Priorität, Ticket, Ja/Nein, Einheiten und Zahlung per Klick sofort einsatzbereit.
    *   **Standardwert**: Ein interaktives Dropdown im Eigenschaften-Panel erlaubt die direkte Wahl des Standardwertes (`defaultValue`) aus den definierten Optionen.
*   **Persistenz**: Die Werte werden im Schema als `field.enumValues: string[]` in der lokalen **IndexedDB** gespeichert.

### 12.2. Interaktives Datenblatt (Data Grid)
*   Im Datenblatt (`TableView`) wird bei Feldern vom Typ `ENUM` automatisch eine native Dropdown-Auswahlbox gerendert, welche die Eingabe auf die definierten Enum-Optionen beschränkt und Fehleingaben verhindert.

### 12.3. Backend- & SQL-Export
*   **MySQL / MariaDB**: `ENUM('Wert1', 'Wert2', ...)`
*   **PostgreSQL**: `VARCHAR(255) CHECK (field IN ('Wert1', 'Wert2', ...))` oder `CREATE TYPE ... AS ENUM`
*   **SQLite**: `TEXT CHECK (field IN ('Wert1', 'Wert2', ...))`
*   **.NET (C#)**: `enum StatusEnum { Wert1, Wert2 }`
*   **PHP / Laravel**: `$table->enum('field', ['Wert1', 'Wert2'])`

---

## 13. Multi-Backend & Desktop Seeding-Architektur (Cross-Generator Standard)

Um ein konsistentes Verhalten über alle Ziel-Frameworks hinweg zu gewährleisten, implementieren alle Codegeneratoren einheitliche Schema- und Initialdaten-Initialisierungsmechanismen:

### 13.1. Übersicht nach Generator

| Generator | Schema & Initialdaten-Datei | Automatischer Seeding-Mechanismus beim Start |
| :--- | :--- | :--- |
| **.NET C# / MAUI** | `DbInitializer.cs` & `seed.sql` | Topologisch sortierte Seed-Ausführung (`sortTablesByDependencies`), Transaktions-Sicherheit, `INSERT OR REPLACE INTO` für SQLite (`PRAGMA foreign_keys = OFF`), Case-Insensitive Key-Matching & isolierte Tabellen-Try/Catches |
| **Node.js (Express)** | `seed.sql` | `db.sequelize.sync()` führt topologisch sortiertes `bulkCreate` mit `{ ignoreDuplicates: true, validate: false }` und isoliertem Try/Catch je Tabelle aus |
| **Laravel** | `database/seed.sql` & `database/seeders/DatabaseSeeder.php` | `php artisan migrate --seed` führt `DatabaseSeeder.php` mit `Schema::disableForeignKeyConstraints()` und `insertOrIgnore()` topologisch sortiert aus |
| **Python (FastAPI)** | `seed.sql` | `@app.on_event("startup")` erzeugt Tabellen via `Base.metadata.create_all` und importiert vorhandene `seed.sql` Statement für Statement fehlertolerant |
| **PHP Native** | `database/schema.sql` & `database/seed.sql` | `Database.php` prüft SQLite-Datei und führt bei Neuanlage `seed.sql` (mit integrierter FK-Deaktivierung & idempotentem Insert) aus |
| **Tauri (Desktop / Rust)** | `seed.sql` & `src-tauri/seed.sql` | Rust `rusqlite` (bundled) Auto-Initialisierung beim Start: Prüft `__studio_seeded`, führt Transaction-Batch-Seeding mit `PRAGMA foreign_keys = OFF` aus und bündelt `include_str!("../seed.sql")` direkt in die Binary |
| **Electron (Desktop)** | `seed.sql` & `Backend/seed.sql` | Express-Server mit Sequelize Auto-BulkCreate / SQLite-Bootstrap |

### 13.2. Vierstufiger Resilienz-Standard für alle Backends
1. **Topologische Tabellen-Sortierung**: Parent-Tabellen werden vor Child-Tabellen verarbeitet, sodass verknüpfte Fremdschlüssel (z. B. `Berufsschule`, `PersonasFunktionen`) immer vor den abhängigen Datensätzen existieren.
2. **Idempotente Inserts (`INSERT OR REPLACE` / `INSERT IGNORE`)**: Verhindert Primärschlüssel-Kollisionen bei wiederholtem Start oder bereits existierenden Datensätzen.
3. **Case-Insensitive Feld-Zuordnung**: Toleriert Abweichungen zwischen Daten-JSON (`wdIdMitarbeiter`) und DB-Spalten (`wdidmitarbeiter`).
4. **Isolierte Tabellen-Transaktionen / Try-Catches**: Ein einzelner fehlerhafter Datensatz in einer Tabelle bringt nicht mehr den gesamten Backend-Startprozess zum Abbruch.


### 13.3. Einheitliche SQLite & SQL Kompatibilität
Alle generierten SQLite-Dateien werden standardmäßig lokal im Anwendungsdaten- oder Projekt-Verzeichnis abgelegt und mit denselben relationalen Tabellen- und Datensatzmodellen initialisiert, sodass der Übergang von lokaler **IndexedDB** im Browser zu beliebigen relationalen Backends (**MySQL, PostgreSQL, MS SQL, SQLite**) ohne manuelle Eingriffe reibungslos funktioniert.

---

## 14. Subform- & 1:1-Beziehungs-Resilienz (React & Angular)

Bei 1:1- und 1:n-Beziehungen, bei denen Primär- und Fremdschlüssel identische Bezeichner tragen (z. B. `employeeid`, `lehrberufabk`), traten in generierten Formularen doppelte Key-Deklarationen in TypeScript-Objektliteralen auf (`error TS1117`).

### 14.1. Standard für Subform-Payloads
Zur Vermeidung von TypeScript- und Laufzeit-Kollisionen bei Formular- und Subformular-Aktionen:
- **Dynamische Key-Zuweisung**: Payloads werden zuerst als Basisobjekt instanziiert (`const payload: any = { ...subData };`) und Verknüpfungsfelder anschließend dynamisch zugewiesen (`payload[key] = masterVal;`).
- **Idempotente Feld-Sets**: Mehrfachbelegungen (z. B. `childFieldCamel`, `childFieldName`, `m.childField`) überschreiben sich sauber im selben Objekt, ohne syntaktische Duplikate im Literal zu erzeugen.
- **Framework-übergreifende Konsistenz**: Dieser Standard ist sowohl für **React** (`customFormPageGenerator`, `customPageGenerator`, `subformNodeGenerator`) als auch für **Angular** (`subformNode`, `tableComponentGenerator`, `customComponentGenerator`) implementiert.

---

## 15. Tauri Windows Native SQLite Seeding & Execution Architecture

Für native Desktop-Builds (Tauri auf Windows/macOS/Linux) wird die SQLite-Initialisierung direkt im Rust-Backend über `rusqlite` (mit dem Feature `bundled`) ausgeführt:

### 15.1. Rust-Initialisierungs-Ablauf beim App-Start
1. **Pfad-Lokalisierung**: `get_db_path()` ermittelt den relativen Pfad der Datenbankdatei (`<projectname>.db`).
2. **Migrations- & Seed-Status Check**: Über `SELECT name FROM sqlite_master WHERE type='table' AND name='__studio_seeded'` wird geprüft, ob die Datenbank bereits initialisiert wurde.
3. **Compile-Time & Run-Time Fallback**: 
   - Das SQL-Seed-Skript wird zur Compile-Zeit via `const EMBEDDED_SEED_SQL: &str = include_str!("../seed.sql");` direkt in das Executable integriert.
   - Zur Laufzeit wird primär eine externe `seed.sql` geladen (falls vorhanden), andernfalls das eingebettete Schema.
4. **Transaktionale Ausführung**:
   - `PRAGMA foreign_keys = OFF;`
   - Atomare Ausführung aller `CREATE TABLE` und `INSERT INTO` Statements innerhalb einer Transaction (`tx.execute_batch`).
   - Anlegen der Tracking-Tabelle `__studio_seeded` zur Vermeidung doppelter Ausführungen.
   - Re-Aktivierung: `PRAGMA foreign_keys = ON;`.

### 15.2. Tauri Invoke Commands
- `execute_local_query(sql: String)`: Führt native SQL-Queries auf der lokalen SQLite-DB aus und liefert JSON-serialisierte Zeilen zurück.
- `get_db_info()`: Liefert Konfigurationsparameter für das Frontend (Host, Port, DB-Name, SQLite-Flag).
- `get_seed_sql()`: Gibt das vollständige SQL-Initialisierungsskript als String zurück.
- `force_reseed_db()`: Ermöglicht das Zurücksetzen und Neu-Seeden der SQLite-Datenbank.

---

## 16. IndexedDB ObjectStore KeyPath & Seeding Resilienz

Um Laufzeitfehler wie `Uncaught DataError: Failed to execute 'add' on 'IDBObjectStore': Evaluating the object store's key path did not yield a value.` bei der Ausführung im Browser/Frontend vollständig zu verhindern, wird ein mehrstufiger Schutzmechanismus angewendet:

### 16.1. Automatische ID-Synthese & AutoIncrement
- **AutoIncrement-Fallback bei Store-Erstellung**: `db.createObjectStore(store.name, { keyPath: store.keyPath || 'id', autoIncrement: true });` stellt sicher, dass IndexedDB selbst dann gültige Primärschlüssel vergeben kann, wenn in einem Datensatz kein Schlüsselwert übergeben wurde.
- **Vollständige Feld-Synthese im Seed-Generator**: Bei der Generierung von `STORES_DATA` werden alle Primärschlüssel-Varianten (`camelCase`, `PascalCase`, `id`, Original-Feldname) synchronisiert. Sollte eine Zeile keinen Primärschlüssel enthalten, wird deterministisch ein Index-Schlüssel (`idx + 1`) vergeben.
- **Resiliente Schreib-Operationen**: Statt des strikten `objStore.add(row)` wird transaktional `objStore.put(row)` in Kombination mit Vorab-Validierung und einem `try-catch`-Block verwendet. Dadurch werden Schlüssel-Kollisionen und unvollständige Datensätze abwärtskompatibel verarbeitet.









---

<a id="api-documentation"></a>
# API DOCUMENTATION

> **Originaldatei:** `docs/API_DOCUMENTATION.md`

# 📖 DB Studio Pro - API & Storage Dokumentation

Diese Dokumentation beschreibt die Schnittstellenarchitektur, die Speicher-Engines sowie die standardisierten API-Endpunkte für die Anbindung an diverse relationale Datenbanksysteme (MySQL, PostgreSQL, MSSQL, SQLite) und Backend-Frameworks (.NET 10, Node.js/Express, PHP/Laravel, Python/FastAPI).

---

## 1. Primäre Speicher-Engine: IndexedDB (Browser-Persistenz)

Als **Standard- und Prioritätsdatenbank** fungiert **IndexedDB**. Dadurch arbeitet die gesamte Applikation 100% autark, offline-fähig und persistent im Browser des Anwenders.

### IndexedDB Schema (`DBStudioProDB`, Version 3)
* **`projects_meta`** (KeyPath: `id`): Metadaten für Schnellansichten und die DB Studio Startseite.
  ```typescript
  interface ProjectMetadata {
    id: string;             // UUID
    name: string;           // z.B. "Kundenverwaltung.dbsp"
    lastModified: number;   // Timestamp (Unix ms)
    isCloud?: boolean;
    owner?: string;
    dbType?: 'SQLite' | 'SQL' | 'MySQL' | 'PostgreSQL' | 'NoSQL';
    language?: 'csharp' | 'typescript' | 'php' | 'python';
  }
  ```
* **`projects_data`** (KeyPath: `projectId`): Vollständiges relationales Schema inklusive Tabellendefinitionen, Feldern, Datensätzen, Relationen, Formularen, Berichten und Workflows.
  ```typescript
  interface ProjectPayload {
    projectId: string;
    data: {
      tables: Table[];
      relationships: Relationship[];
      queries: Query[];
      forms: Form[];
      reports: Report[];
      charts: Chart[];
      workflows: Workflow[];
      records: Record<string, any[]>; // Tabellen-Datensätze: tableId -> rows
      backendConfig: BackendConfig;
    };
  }
  ```

### Storage-Service API (`/services/storageService.ts`)
* `saveProjectToStorage(project: Project): Promise<void>` - Sichert Projekt und Datensätze in IndexedDB.
* `getAllProjects(): Promise<Project[]>` - Lädt alle verfügbaren Datenbanken für die Startseite.
* `getProjectById(id: string): Promise<Project | undefined>` - Lädt vollständige Schemata & Records.
* `deleteProjectFromStorage(id: string): Promise<void>` - Löscht die Datenbank vollständig aus IndexedDB.

---

## 2. Einheitliche RDBMS-Abstraktionsschicht

Die Schemadefinitionen und Datentypen sind abstrahiert aufgebaut, sodass ein Wechsel von **IndexedDB** zu **MySQL**, **PostgreSQL** oder **MSSQL** ohne Umbau der UI-Komponenten möglich ist.

### Datentyp-Mapping

| DB Studio Typ | IndexedDB / JS | SQLite | MySQL / MariaDB | PostgreSQL | MS SQL Server |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `INTEGER` | `number` | `INTEGER` | `INT` | `INTEGER` | `INT` |
| `VARCHAR` | `string` | `TEXT` | `VARCHAR(255)` | `VARCHAR(255)` | `NVARCHAR(255)` |
| `TEXT` | `string` | `TEXT` | `LONGTEXT` | `TEXT` | `NVARCHAR(MAX)` |
| `DECIMAL` | `number` | `NUMERIC` | `DECIMAL(18,2)` | `NUMERIC(18,2)` | `DECIMAL(18,2)` |
| `BOOLEAN` | `boolean` | `INTEGER` (0/1) | `TINYINT(1)` | `BOOLEAN` | `BIT` |
| `DATETIME` | `string (ISO)` | `TEXT` | `DATETIME` | `TIMESTAMP` | `DATETIME2` |
| `UUID` | `string` | `TEXT` | `CHAR(36)` | `UUID` | `UNIQUEIDENTIFIER` |

---

## 3. Standardisierte REST-Backend Schnittstellen

Für externe Backends können die generierten Controller und ORM-Modelle direkt über folgende REST-Routen angesprochen werden:

### 3.1 Projekt- und Schemamanagement
* **`GET /api/projects`**
  * Liefert Liste aller Datenbankprojekte mit Metadaten.
* **`GET /api/projects/:id`**
  * Lädt das vollständige Schema und die Datensätze.
* **`POST /api/projects`**
  * Erstellt oder aktualisiert ein Projekt.
* **`DELETE /api/projects/:id`**
  * Entfernt ein Projekt aus dem Server-Speicher.

### 3.2 Generische Tabellen-CRUD-Endpunkte (Entity API)
Für jede Tabelle (z. B. `Kunden`) generiert das Backend typisierte CRUD-Routen:

* **`GET /api/data/:tableName`**
  * Query-Parameter: `?page=1&limit=50&sort=ID&order=asc&search=Müller`
  * Response: `{ items: [...], totalCount: 142, page: 1 }`
* **`GET /api/data/:tableName/:id`**
  * Liefert Einzeldatensatz anhand des Primärschlüssels.
* **`POST /api/data/:tableName`**
  * Erstellt einen neuen Datensatz (inklusive Validierung & AutoWert).
  * Payload: `{ Name: "Musterfirma GmbH", Ort: "Berlin", Umsatz: 45000 }`
* **`PUT /api/data/:tableName/:id`**
  * Aktualisiert den angegebenen Datensatz.
* **`DELETE /api/data/:tableName/:id`**
  * Löscht den Datensatz unter Berücksichtigung von Fremdschlüssel-Kaskaden.

### 3.3 Abfragen & SQL-Ausführung (Query Engine)
* **`POST /api/query/execute`**
  * Führt parametrisierte Abfragen oder dynamische SQL-Statements sicher aus.
  * Payload:
    ```json
    {
      "sql": "SELECT Kunden.Name, Aufträge.Betrag FROM Kunden INNER JOIN Aufträge ON Kunden.ID = Aufträge.KundenID WHERE Aufträge.Status = @status",
      "parameters": {
        "status": "Offen"
      }
    }
    ```

---

## 4. Unterstützte Backend-Code-Generatoren

1. **C# / .NET 10 (ASP.NET Core Web API)**
   * Entity Framework Core 10 DbContext & Models
   * Fluent API Konfiguration für Primär- und Fremdschlüssel
   * Async Controller mit Swagger / OpenAPI Dokumentation
2. **TypeScript / Node.js (Express + Prisma / Drizzle ORM)**
   * Typsichere Schema-Deklarationen
   * Zod-Validierungspipelines
3. **PHP / Laravel 11**
   * Eloquent Models & Migration Scripts
   * Resource Controller & Form Requests
4. **Python / FastAPI + SQLAlchemy 2.0**
   * Pydantic V2 Schemas & Async Session CRUD Endpoints

---

## 5. Offline-Synchronisation & Wechsel zwischen Engines

Im Menü **Datei -> Optionen** oder über das UI-Setting `config.storage` kann nahtlos zwischen:
* **`local` (IndexedDB)**: Maximale Geschwindigkeit und autarkes Arbeiten.
* **`server` (Remote REST API)**: Zentralisierte Multi-User Kollaboration.

umgeschaltet werden. Bei einem Fehlschlagen der Server-Verbindung greift die Applikation transparent auf die lokale IndexedDB zurück.

---

## 6. Enterprise Security & Governance APIs

### 6.1 Rollenbasierte Rechteprüfung (RBAC)
* **`GET /api/security/roles`** - Liefert definierte Rollen (`admin`, `manager`, `editor`, `user`, `guest`).
* **`POST /api/security/roles`** - Erstellt/Aktualisiert Berechtigungsmatrizen auf Tabellen- und Spaltenebene.
* **`POST /api/security/verify-access`** - Prüft CRUD-Rechte eines Benutzers für Tabellen/Felder.

### 6.2 Row Level Security (RLS) & Mandantentrennung
* **`POST /api/security/rls-policies`** - Erzeugt mandantenbasierte Filterkriterien (`tenant_id = @current_tenant`).
* **`GET /api/security/rls-ddl/:dialect`** - Exportiert DDL für PostgreSQL (`CREATE POLICY`), SQL Server (`SECURITY PREDICATE`) oder EF Core Global Query Filter.

### 6.3 Audit Trail & Revisionssicherheit
* **`GET /api/security/audit-log`** - Liefert lückenlose Änderungshistorie (`timestamp`, `user_id`, `table_name`, `record_id`, `action`, `diff`).
* **`POST /api/security/audit-rollback`** - Führt revisionssicheren Rollback eines Datensatzes auf einen früheren Stand durch.

---

## 7. DACH Branchen-Schnittstellen APIs

### 7.1 GAEB DA XML & GAEB 90
* **`POST /api/gaeb/import`** - Liest `.X83`, `.X84`, `.D83` oder `.X81` Dateien ein und konvertiert sie in relationale Tabellen (Leistungsverzeichnis, Lose, Positionen, Einheitspreise).
* **`POST /api/gaeb/export`** - Erzeugt standardkonforme GAEB XML 3.2 / 3.3 oder GAEB 90 Dateien für Angebotsabgaben (X84).

### 7.2 DATANORM 4.0 / 5.0
* **`POST /api/datanorm/import`** - Parst Großhandelskataloge (Artikel, Preise, Matchcodes, Warengruppen) und speichert diese direkt in der IndexedDB.

### 7.3 E-Invoicing (ZUGFeRD 2.2 / XRechnung & Swiss QR Bill)
* **`POST /api/invoicing/zugferd/generate`** - Erzeugt rechtskonforme Factur-X / ZUGFeRD 2.2 Hybrid-Rechnungen (PDF/A-3 mit XML) inklusive Leitweg-ID.
* **`POST /api/invoicing/swiss-qr/generate`** - Erzeugt den offiziellen Schweizer QR-Zahlteil nach ISO 20022 mit QR-IBAN und Referenznummer.




---

<a id="api-schema-designer"></a>
# API SCHEMA DESIGNER

> **Originaldatei:** `docs/API_SCHEMA_DESIGNER.md`

# Database & Schema Designer API Architecture

Diese Dokumentation beschreibt die modulare, backend-unabhängige Architektur des **In-Browser Schema- & ER-Designers**. Das System priorisiert standardmäßig **IndexedDB** für persistente, offline-fähige Client-Side Speicherung und bietet eine generische Abstraktionsschicht für einfache Migrationen zu **PostgreSQL, MySQL, SQLite, Supabase und REST/GraphQL Backends**.

---

## 1. Storage & Persistence Layer (`IStorageAdapter`)

Alle Tabellendefinitionen, Feldtypen, Relationen, Indizes, CHECK-Constraints, Gruppen und Mock-Datensätze werden über standardisierte Schnittstellen verwaltet.

### Speicher-Hierarchie:
1. **IndexedDB** (Primäre lokale Persistenz über ObjectStore `project_schema_store` und `table_records_store`)
2. **In-Memory SQLite Virtual Engine** (für In-Browser SQL Abfragen, Aggregationen & JOINs)
3. **Pluggable Remote SQL Connector** (PostgreSQL / MySQL / SQLite / Supabase)

### Storage Interface:
```typescript
export interface ISchemaStorageAdapter {
  loadSchema(projectId: string): Promise<ProjectSchema>;
  saveSchema(projectId: string, schema: ProjectSchema): Promise<void>;
  
  // Table Data API (IndexedDB / SQL)
  queryTableData(tableId: string, options?: QueryOptions): Promise<any[]>;
  insertRows(tableId: string, rows: any[]): Promise<void>;
  updateRow(tableId: string, primaryKeyValue: any, row: any): Promise<void>;
  deleteRow(tableId: string, primaryKeyValue: any): Promise<void>;
}
```

---

## 2. Service Endpoints & Utilities

### 2.1 Auto-Layout Engine (`AutoLayoutEngine`)
- **Topological & Hierarchical DAG**: Ordnet Entitäten nach Abhängigkeitsebenen (0-Ebene Parent Tables bis N-Ebene Detail Tables)
- **Physics Force-Directed**: Federmodell basierend auf Coulomb-Repulsion und Hooke-Attraktion
- **Methoden**:
  - `AutoLayoutEngine.calculateAutoLayout(tables, relationships, config)`
  - `AutoLayoutEngine.calculateGridLayout(tables, config)`

### 2.2 Schema Linter & Normalization (`SchemaLinterService`)
- **Score-Algorithmus (0-100)** mit 12 statischen Analyseregeln:
  - Fehlende Primärschlüssel (`PK_MISSING`)
  - Unindexierte Fremdschlüssel (`FK_UNINDEXED`)
  - Ungleiche Fremdschlüssel-Datentypen (`FK_TYPE_MISMATCH`)
  - Fehlende Audit-Spalten (`MISSING_AUDIT_FIELDS`)
  - 1NF, 2NF und 3NF Normalisierungsempfehlungen
- **Methoden**:
  - `SchemaLinterService.analyzeSchema(tables, relationships): LinterReport`
  - `SchemaLinterService.analyzeNormalization(tables, relationships): NormalizationSuggestion[]`

### 2.3 DBML Transpiler (`DbmlTranspilerService`)
- 2-Wege Übersetzung zwischen visualisiertem Schema und standardisiertem DBML:
  - `DbmlTranspilerService.tablesToDbml(tables, relationships, groups): string`
  - `DbmlTranspilerService.parseDbmlToSchema(dbmlCode): { tables, relationships, errors }`

### 2.4 SQL DDL Reverse Engineering (`SqlDdlReverseEngineerService`)
- Parser für `CREATE TABLE`, `PRIMARY KEY`, `FOREIGN KEY ... REFERENCES`, `NOT NULL`, `DEFAULT`, `CHECK` und `UNIQUE`
- Dialekte: Universal ANSI, PostgreSQL, MySQL/MariaDB, SQLite
- **Methode**:
  - `SqlDdlReverseEngineerService.parseSqlDdl(sqlText, dialect): { tables, relationships, errors }`

### 2.5 Schema-Diff & Migration Engine (`SchemaDiffService`)
- Berechnet Differenzen zwischen Baseline-Snapshot und aktuellem Canvas
- Generiert idempotente `UP` und `DOWN` Migrationsskripte für:
  - `PostgreSQL` (`ALTER TABLE ADD COLUMN`, `ADD CONSTRAINT`)
  - `MySQL` (`ALTER TABLE ...`)
  - `SQLite` (Table Recreation Pattern bei Constraint-Änderungen)
- **Methoden**:
  - `SchemaDiffService.compareSchemas(oldTables, oldRels, newTables, newRels): SchemaDiffItem[]`
  - `SchemaDiffService.generateMigrationScript(diffItems, dialect): { upScript, downScript }`

### 2.6 Graph-Aware Mock-Data Generator (`MockDataSynthesisService`)
- Topologische Sortierung verhindert Fremdschlüssel-Verletzungen (Parent Tables werden vor Child Tables gefüllt)
- Realistische deutsche/englische Adress-, Namen-, E-Mail-, IBAN- und Finanzdaten
- **Methode**:
  - `MockDataSynthesisService.generateMockData(tables, relationships, config): Record<tableId, any[]>`

### 2.7 Data-Dictionary & ORM Export (`SchemaDocumentationService`)
- Formate:
  - **Markdown**: Druckfertiges Handbuch mit Tabellenbeschreibungen, Feldtypen und Relationen
  - **Prisma ORM**: `.prisma` Schema mit `@id`, `@relation`, `@default` und `@unique`
  - **TypeSpec**: Moderne API & Domain Schemas
- **Methoden**:
  - `SchemaDocumentationService.generateMarkdownDictionary(tables, relationships, groups)`
  - `SchemaDocumentationService.generatePrismaSchema(tables, relationships)`
  - `SchemaDocumentationService.generateTypeSpec(tables)`

---

## 3. Datenbankschemata-Kompatibilität

| Datenbank | Typ-Mapping UUID | Typ-Mapping AutoIncrement | Foreign Key Cascade |
| :--- | :--- | :--- | :--- |
| **IndexedDB** | `crypto.randomUUID()` | `autoIncrement: true` (KeyPath) | Client-Side Cascade |
| **PostgreSQL** | `UUID DEFAULT gen_random_uuid()` | `BIGSERIAL` / `GENERATED ALWAYS` | `ON DELETE CASCADE` |
| **MySQL / MariaDB** | `VARCHAR(36)` / `BINARY(16)` | `INT AUTO_INCREMENT` | `ON DELETE CASCADE` |
| **SQLite** | `TEXT` | `INTEGER PRIMARY KEY AUTOINCREMENT` | `PRAGMA foreign_keys = ON` |
| **Microsoft SQL Server** | `UNIQUEIDENTIFIER DEFAULT NEWID()` | `INT IDENTITY(1,1)` | `ON DELETE CASCADE` |



---

<a id="buttoninfoapi"></a>
# ButtonInfoAPI

> **Originaldatei:** `docs/ButtonInfoAPI.md`

# DB Studio Pro - Button Information & Modal API Specification

Diese Dokumentation beschreibt die Datenstrukturen, IndexedDB-Mappings und API-Endpunkte für die Verwaltung und Anzeige von Schaltflächen-Informationen (Button-Dokumentation) in **DB Studio Pro**.

---

## 1. Übersicht & Zielsetzung

Die Schaltflächen-Informationen ermöglichen es Benutzern, Funktionen, Tastenkombinationen (Shortcuts) und Datenbank-Auswirkungen (IndexedDB-Transaktionen / SQL-Befehle) der einzelnen UI-Elemente direkt im Anwendungskontext abzurufen.

Die Daten werden primär im lokalen **IndexedDB**-Speicher abgelegt und können reaktiv über den `useUIStore` in einem dezimierten Modalfenster (`ButtonInfoModal`) durchsucht und gefiltert werden.

---

## 2. IndexedDB Schema-Definition (`sys_button_info`)

Die Schaltflächen-Metadaten können bei Bedarf im IndexedDB Store `sys_button_info` persistiert werden:

| Feld (KeyPath) | Typ | Beschreibung |
| :--- | :--- | :--- |
| `id` (KeyPath) | `string` | Eindeutige Kennung der Schaltfläche (z. B. `form_refresh`, `project_backup`) |
| `label` | `string` | Name/Beschriftung im UI (z. B. "Alle aktualisieren") |
| `category` | `string` | Kategorie/Tab (`home`, `create`, `external`, `pages`, `deploy`) |
| `categoryLabel` | `string` | Anzeigename der Kategorie |
| `iconName` | `string` | Lucide-React Icon Name |
| `description` | `string` | Detaillierte Funktionsbeschreibung |
| `dbAction` | `string` | Beschreibung der auslösenden IndexedDB / SQL Transaktion |
| `shortcut` | `string` (optional) | Tastaturkürzel (z. B. `Ctrl+S`, `F5`) |
| `actionKey` | `string` | Interner Action-Trigger Key |

---

## 3. Generische API-Schnittstellen

### 3.1 Abrufen aller Schaltflächen-Informationen
#### `GET /api/button-info`
- **IndexedDB**: Lädt alle Datensätze aus dem Object Store `sys_button_info` oder aus dem lokalen In-Memory Katalog `BUTTON_INFO_DATA`.
- **Rückgabe**: `Promise<ButtonInfoItem[]>`

### 3.2 Filtern nach Kategorie oder Suchbegriff
#### `GET /api/button-info?category=:category&search=:query`
- **IndexedDB**: Filtert die Datensätze lokal nach Kategorie und Suchbegriff im Titel, der Beschreibung oder dem Tastenkürzel.
- **Rückgabe**: `Promise<ButtonInfoItem[]>`

### 3.3 Ausführen einer Schaltflächen-Aktion
#### `POST /api/button-info/execute/:actionKey`
- **IndexedDB / UI**: Triggert die verknüpfte Aktion im `useUIStore` / `useProjectStore`.
- **Rückgabe**: `Promise<{ success: boolean, actionKey: string }>`

---

## 4. Migration & Multi-Backend Kompatibilität

Wenn das System von der lokalen IndexedDB zu einem relationalen MySQL-, PostgreSQL- oder SQLite-Server migriert wird:
1. `sys_button_info` wird als SQL-Tabelle `sys_button_info` angelegt.
2. Die UI-Komponente `ButtonInfoModal.tsx` bleibt unangetastet, da sie ausschließlich mit der entkoppelten Store- / API-Schicht interagiert.



---

<a id="page-field-formatting-api"></a>
# PAGE FIELD FORMATTING API

> **Originaldatei:** `docs/PAGE_FIELD_FORMATTING_API.md`

# DB Studio Pro - Page Field Formatting & Pipe Engine API

## 1. Überblick

Die **Field Formatting & Pipe Engine** ermöglicht im Page Designer, SDUI-Renderer und den Code-Generatoren eine flexible, deklarative Formatierung von beliebigen Datenfeldern (z. B. Datum, Uhrzeit, Währung, Zahlen, Texttransformationen und Booleans).

Die Engine arbeitet datenbank-agnostisch: Daten können aus der lokalen **IndexedDB** (`storageService`), aus REST-APIs, GraphQL oder relationalen SQL/MySQL-Backends bezogen werden. Die Formatierung findet auf der Präsentationsschicht sowie in den exportierten Frontend-Komponenten (React, Angular, etc.) statt.

---

## 2. Formatierungs-Modi

Das System unterstützt zwei komplementäre Formatierungs-Ansätze:

### A. UI-gestützte Komponenten-Formatierung (Component Properties)
Wird direkt im **Eigenschaften-Panel** des Page Designers für Text-Komponenten (`type: 'text'`), Stat-Cards (`type: 'stat_card'`) oder Tabellenspalten konfiguriert.

```json
{
  "id": "text-node-1",
  "type": "text",
  "props": {
    "text": "{{context.created_at}}",
    "formatType": "date",
    "dateFormat": "DD.MM.YYYY HH:mm",
    "prefix": "Erstellt am: ",
    "suffix": " Uhr",
    "emptyFallback": "-"
  }
}
```

### B. Deklarative Inline-Pipe-Syntax in Templates
Ermöglicht das Einbetten formatierter Platzhalter direkt in Fließtexte, Button-Labels, Benachrichtigungen oder Header-Titel:

- `{{created_at | date:'DD.MM.YYYY'}}` ➔ `28.08.2026`
- `{{created_at | date:'DD.MM.YYYY HH:mm'}}` ➔ `28.08.2026 14:30`
- `{{created_at | date:'relative'}}` ➔ `vor 2 Tagen` / `heute`
- `{{total_price | currency:'EUR'}}` ➔ `1.250,00 €`
- `{{total_price | currency:'USD':2}}` ➔ `$ 1,250.00`
- `{{amount | number:2}}` ➔ `1.234,50`
- `{{status | uppercase}}` ➔ `AKTIV`
- `{{description | truncate:40}}` ➔ `Langer Beschreibungstext...`
- `{{is_active | boolean:'Aktiv':'Gesperrt'}}` ➔ `Aktiv`
- `{{missing_field | default:'Keine Angabe'}}` ➔ `Keine Angabe`

---

## 3. Unterstützte Datums- & Zeitmuster

| Pattern Token | Beschreibung | Beispiel |
| :--- | :--- | :--- |
| `DD.MM.YYYY` | Deutsches Standard-Datum | `28.08.2026` |
| `DD.MM.YYYY HH:mm` | Datum mit 24h-Uhrzeit | `28.08.2026 14:30` |
| `DD.MM.YYYY HH:mm:ss` | Datum mit Sekunden | `28.08.2026 14:30:45` |
| `YYYY-MM-DD` | ISO/SQL-Format | `2026-08-28` |
| `DD. MMMM YYYY` | Deutsches Langformat | `28. August 2026` |
| `dddd, DD.MM.YYYY` | Wochentag mit Datum | `Freitag, 28.08.2026` |
| `relative` | Relative Zeitspanne | `gerade eben`, `vor 3 Stunden`, `gestern` |
| `HH:mm` | Nur Uhrzeit | `14:30` |
| `HH:mm:ss` | Uhrzeit mit Sekunden | `14:30:45` |

---

## 4. API & TypeScript-Schnittstellen

### `formatFieldValue(val: any, options: FieldFormatOptions): string`
Hauptfunktion für die Formatierung beliebiger Rohwerte.

```typescript
import { formatFieldValue } from '@/features/pages/utils/formatUtils';

const formatted = formatFieldValue('2026-08-28T14:30:00Z', {
    formatType: 'date',
    dateFormat: 'DD.MM.YYYY HH:mm',
    prefix: 'Stand: '
});
// Ergebnis: "Stand: 28.08.2026 14:30"
```

### `applyPipeChain(val: any, pipeChain: string[]): string`
Wendet eine Kette von Pipe-Transformationen nacheinander auf einen Wert an.

```typescript
import { applyPipeChain } from '@/features/pages/utils/formatUtils';

const result = applyPipeChain(1250.5, ["currency:'EUR'", "prefix:'Gesamt: '"]);
// Ergebnis: "Gesamt: 1.250,50 €"
```

### `resolvePlaceholders(text: string, context?: Record<string, any>, params?: Record<string, any>): string`
Löst verschachtelte Parameter und Inline-Pipes in Texten auf.

```typescript
import { resolvePlaceholders } from '@/features/pages/utils/pageViewUtils';

const text = resolvePlaceholders(
    "Auftrag vom {{context.order_date | date:'DD.MM.YYYY'}}: {{context.amount | currency:'EUR'}}",
    { order_date: '2026-08-28', amount: 849.99 }
);
// Ergebnis: "Auftrag vom 28.08.2026: 849,99 €"
```

---

## 5. Kompatibilität mit Backend-Datenbanken (IndexedDB & SQL/MySQL)

- **IndexedDB**: Datumswerte werden standardmäßig als ISO-String (`YYYY-MM-DDTHH:mm:ss.sssZ`) oder Unix-Timestamp (`number`) in den IndexedDB Object Stores gespeichert.
- **SQL / MySQL**: Beim Export oder bei direkter Backend-Anbindung entsprechen die Feldtypen `DATETIME`, `TIMESTAMP` oder `DATE`. Die `formatUtils`-Engine verarbeitet ISO-Strings, Unix-Timestamps und SQL-Datumsformate identisch.



---

<a id="qbe-query-designer-api"></a>
# QBE QUERY DESIGNER API

> **Originaldatei:** `docs/QBE_QUERY_DESIGNER_API.md`

# 🔍 Visueller QBE SQL Abfrage-Designer Enterprise API Documentation

Diese Dokumentation beschreibt die Schnittstellen, Datenstrukturen, Transpiler, IndexedDB WASM Sandboxing und Performance-Analyzer des **Visuellen QBE SQL Abfrage-Designers (Enterprise Level 100%)**.

---

## 💾 1. IndexedDB Query Execution & WASM Sandbox API
`features/queries/services/queryWasmSandboxService.ts`

Priorisierte lokale Speicherung & Ausführung in IndexedDB mit automatischer Messung von Latenzen, Rows Affected, Scanned Rows und Memory Usage.

### Interfaces
```typescript
export interface QueryExecutionMetrics {
  executionTimeMs: number;
  rowsAffected: number;
  scannedRows: number;
  memoryUsageKb: number;
  usedIndexes: string[];
  dialectUsed: string;
}

export interface SandboxQueryResult {
  columns: string[];
  rows: Record<string, any>[];
  metrics: QueryExecutionMetrics;
}
```

### Methods
- `executeQueryInWasmSandbox(sql, sampleData, dialect)`: Speichert die Abfrage in IndexedDB (`query_cache`) und führt sie mit Leistungsmessung aus.

---

## 🌐 2. Multi-Dialect SQL Transpiler API
`features/queries/utils/multiDialectSqlGenerator.ts`

Generiert ansi-konformen SQL Code für multiple Ziel-Datenbanken.

### Supported Dialects
- `POSTGRES`: PostgreSQL Standard mit Anführungszeichen.
- `MYSQL`: MySQL / MariaDB (Backtick Quoting).
- `SQLITE`: SQLite standard ANSI SQL.
- `MSSQL`: Microsoft SQL Server (T-SQL Square Brackets `[Col]`).
- `ORACLE`: Oracle PL/SQL mit ROWNUM Support.
- `NEXTCLOUD_OCP`: Nextcloud OCP QueryBuilder PHP-Code.

---

## 🧮 3. Window Functions & Analytische Funktionen API
`features/queries/utils/windowFunctionBuilder.ts` & `features/queries/components/WindowFunctionModal.tsx`

Erstellt komplexe analytische Fensterfunktionen mit `OVER (PARTITION BY ... ORDER BY ... ROWS BETWEEN ...)`:
- `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`
- `LEAD()`, `LAG()`
- `SUM() OVER ()`, `AVG() OVER ()`
- `NTILE(n)`, `FIRST_VALUE()`

---

## 🌳 4. CTE (Common Table Expressions) & Rekursions-Engine API
`features/queries/components/CteQueryBuilderModal.tsx`

Ermöglicht hierarchische Abfragen (Stücklisten, Organigramme, Stammbäume) über `WITH RECURSIVE` Blöcke mit Anker- und Rekursions-Teilabfragen.

---

## ⚡ 5. Visual EXPLAIN & Missing Index Advisor API
`features/queries/utils/indexAdvisor.ts` & `features/queries/components/VisualExplainCostTreeModal.tsx`

Analysiert `JOIN`-, `WHERE`- und `ORDER BY`-Klauseln und berechnet automatisch fehlende Indizes mit geschätztem Performance-Gewinn.

```typescript
export interface IndexRecommendation {
  id: string;
  tableName: string;
  suggestedIndexName: string;
  columns: string[];
  reason: string;
  estimatedPerformanceGainPercent: number;
  sqlCommand: string;
}
```

---

## 📦 6. Multi-Format Export Engine API
`features/queries/utils/queryExportEngine.ts`

Exportiert Abfrage-Ergebnissets mit 1 Klick in:
- Excel (`.xlsx` formatted CSV BOM)
- Standard CSV
- JSON
- XML
- HTML Table
- Apache Parquet Schema JSON



---

<a id="sql-engine-and-indexeddb-api"></a>
# SQL ENGINE AND INDEXEDDB API

> **Originaldatei:** `docs/SQL_ENGINE_AND_INDEXEDDB_API.md`

# 🛠️ SQL Engine, WASM & IndexedDB Synchronization API

Diese Dokumentation beschreibt die Architektur, Lifecycle-Synchronisation und Ausführungsmodi der SQL-Engine mit prioritärer IndexedDB-Persistenz und SQLite WASM / nativer Treiber-Brücke (Tauri / Electron / Web).

---

## 🏗️ 1. Architekturübersicht

```
+-------------------------------------------------------------+
|                      React UI / Store                       |
|   (useProjectStore, ViewRouter, Visual Query Designer)      |
+-------------------------------------------------------------+
                              |
        +---------------------+---------------------+
        |                                           |
        v                                           v
+-------------------------------+   +-------------------------------+
| IndexedDB Prioritäts-Speicher |   | SQLite WASM / Native Engine   |
| (saveProjectToStorage,        |   | (sqlEngine.ts, SQL.js,        |
|  queryWasmSandboxService)     |   |  syncTablesToSql,             |
|                               |   |  executeRawSql)               |
+-------------------------------+   +-------------------------------+
                                                    |
                              +---------------------+---------------------+
                              |                                           |
                              v                                           v
                    +-------------------+                       +-------------------+
                    | SQLite Execution  |                       | JS Memory Engine  |
                    | (Instant WASM)    |                       | (Graceful Fallback|
                    |                   |                       |  if SQL parsing)  |
                    +-------------------+                       +-------------------+
```

---

## 📦 2. Core API Schnittstellen

### `services/sqlEngine.ts`

- **`initSqlEngine(initialTables?: Table[]): Promise<any>`**
  - Initialisiert asynchron den SQLite WASM Stack (`sql.js`) bzw. Desktop-Treiber (Tauri / Electron).
  - Synchronisiert übergebene Tabellen sofort nach Bereitstellung der Datenbankinstanz.
- **`syncTablesToSql(tables: Table[]): Promise<void>`**
  - Erstellt alle Schemas mit typsicherem Mapping (`INTEGER`, `REAL`, `TEXT`) und fügt alle Zeilendaten über Prepared Statements ein (`stmt.run(...)`).
  - Berechnet eine Checksumme, um redundante Synchronisationen zu vermeiden.
  - Puffert Tabellen im Fall von verzögertem WASM-Init (`lastKnownTables`).
- **`executeRawSql(sql: string, tables?: Table[]): any[]`**
  - Führt SQL-Abfragen gegen die aktive SQLite-Instanz aus.
  - Prüft bei Bedarf die Tabellen-Synchronität vorab.
  - Fängt etwaige Tabellen-/Syntaxfehler ab und liefert leere Arrays zurück, sodass der Store nahtlos auf die JS-Engine zurückgreifen kann.
- **`isSqlEngineReady(): boolean`**
  - Gibt `true` zurück, sobald die Datenbank betriebsbereit ist.
- **`exportSqliteDatabaseFile(): Uint8Array | null`**
  - Exportiert den aktuellen Stand als herunterladbare `.sqlite` Binärdatei.

---

## ⚡ 3. Query Execution Pipeline in `useProjectStore`

- **`executeQuery(query: Query, context?: Record<string, any>): Record<string, any>[]`**
  1. Extrahiert Tabellennamen und Spaltenzuordnungen über `generateSqlSelect` in `utils/sqlHelper.ts`.
  2. Versucht die Ausführung direkt in SQLite WASM über `executeRawSql(sql, currentTables)`.
  3. Bei Abfragen mit berechneten JavaScript-Ausdrücken oder Kreuztabellen erfolgt die Auswertung direkt und performant über `executeJsQuery`.
  4. Garantiert vollständige Fehlertoleranz und verhindert "No such table"-Meldungen.



---

<a id="eventbuscontracts"></a>
# EventBusContracts

> **Originaldatei:** `docs/EventBusContracts.md`

# Event-Bus & Cross-MFE Kommunikation – Architektur- & Payload-Blueprint
**System: Enterprise Bausoftware & Kalkulation (MFE-Architektur: Shell, CRM, Articles, Calc, Billing)**  
*Status: Schnittstellenspezifikation, Payload-Verträge & Implementierungs-Checkliste*

---

## 📑 Inhaltsverzeichnis
1. [🟢 1. Architektur-Prinzipien & Entkopplung](#-1-architektur-prinzipien--entkopplung)
2. [📡 2. Event-Bus Infrastruktur & Lifecycle](#-2-event-bus-infrastruktur--lifecycle)
3. [📋 3. Standardisierte Event-Payload Typdefinitionen](#-3-standardisierte-event-payload-typdefinitionen)
4. [🔄 4. MFE-spezifische Event-Verträge (Domain Contracts)](#-4-mfe-spezifische-event-verträge-domain-contracts)
5. [🖱️ 5. Cross-MFE Drag & Drop Protokoll](#️-5-cross-mfe-drag--drop-protokoll)
6. [🗄️ 6. Globaler Cache-, State- & Schema-Sync](#️-6-globaler-cache--state---schema-sync)
7. [🛡️ 7. Fehlerbehandlung, Timeouts & Dead-Letter-Handling](#️-7-fehlerbehandlung-timeouts--dead-letter-handling)
8. [📅 8. Implementierungs-Checkliste & Phasenplan](#-8-implementierungs-checkliste--phasenplan)

---

## 🟢 1. Architektur-Prinzipien & Entkopplung

- [x] **Strikte Isolation**: Frontends importieren niemals Quellcode direkt voneinander.
- [x] **Asynchrone Entkopplung**: Kommunikation erfolgt ausschließlich über den typisierten globalen Event-Bus.
- [x] **Vertragstreue (Contract-First)**: Jedes Event besitzt ein unveränderliches Payload-Schema mit Versionierung (`v1`, `v2`).
- [x] **Kein direkter DOM-Zugriff**: Keine Abhängigkeiten auf DOM-Elemente anderer Micro Frontends.

---

## 📡 2. Event-Bus Infrastruktur & Lifecycle

- [x] **Global Event Bus Singleton**:
  - `window.__ENTERPRISE_EVENT_BUS__` als leichtgewichtiger, framework-agnostischer Pub/Sub-Kanal.
  - Sichere Event-Typisierung in TypeScript.
- [x] **Abonnement & Cleanup (Memory-Leak Schutz)**:
  - Automatisches Unsubscribe beim Unmounten von React/Angular Komponenten via Custom Hook `useMfeEvent(type, handler)`.
- [x] **Event-History & Replay**:
  - Puffer der letzten $N$ Events zur Initialisierung neu geladener Micro Frontends (`replayLastEvent`).

---

## 📋 3. Standardisierte Event-Payload Typdefinitionen

```typescript
export interface MfeBaseEvent<T = any> {
  eventId: string;          // UUID v4
  eventType: string;        // z.B. 'CALC:POSITION_ADDED'
  sourceDomain: 'SHELL' | 'CRM' | 'ARTICLES' | 'CALC' | 'BILLING' | 'STUDIO';
  targetDomain?: 'SHELL' | 'CRM' | 'ARTICLES' | 'CALC' | 'BILLING' | '*';
  timestamp: number;        // Unix Timestamp (ms)
  version: '1.0';
  correlationId?: string;   // Trace-ID für Transaktionsketten
  payload: T;
}
```

---

## 🔄 4. MFE-spezifische Event-Verträge (Domain Contracts)

### 4.1 Shell & Navigation Events
- [x] `SHELL:PROJECT_SELECTED`:
  - Payload: `{ projectId: string; projectNumber: string; customerId: string; title: string }`
  - Wirkung: Informiert alle geöffneten MFEs (CRM, Calc, Billing) über das aktive Bauvorhaben.
- [x] `SHELL:USER_AUTHENTICATED`:
  - Payload: `{ userId: string; roles: string[]; tenantId: string; permissions: string[] }`

### 4.2 CRM Events
- [x] `CRM:CUSTOMER_UPDATED`:
  - Payload: `{ customerId: string; companyName: string; paymentTermsDays: number; discountPercentage: number }`
  - Wirkung: Aktualisiert Zahlungskonditionen im Billing- und Calc-MFE.

### 4.3 Articles / Materialstamm Events
- [x] `ARTICLES:PRICE_CHANGED`:
  - Payload: `{ articleId: string; oldPrice: number; newPrice: number; validFrom: string }`
  - Wirkung: Markiert betroffene Positionen im Calc-MFE als "Preisaktualisierung verfügbar".

### 4.4 Calc / Kalkulation Events
- [x] `CALC:TOTALS_CHANGED`:
  - Payload: `{ projectId: string; totalLabor: number; totalMaterial: number; totalEquipment: number; totalNet: number; totalGross: number }`
  - Wirkung: Aktualisiert Projekt-KPIs in der Shell und Rechnungsbasis im Billing-MFE.
- [x] `CALC:OFFER_FINALIZED`:
  - Payload: `{ projectId: string; offerNumber: string; netAmount: number; positionsCount: number }`

### 4.5 Billing / Rechnungs-Events
- [x] `BILLING:INVOICE_CREATED`:
  - Payload: `{ invoiceId: string; invoiceNumber: string; projectId: string; customerId: string; netAmount: number; grossAmount: number; invoiceType: 'ADVANCE' | 'PARTIAL' | 'FINAL' }`
- [x] `BILLING:PAYMENT_RECEIVED`:
  - Payload: `{ invoiceId: string; paidAmount: number; paidDate: string; remainingAmount: number }`

---

## 🖱️ 5. Cross-MFE Drag & Drop Protokoll

Zieht Artikel aus dem Artikelkatalog direkt in das Leistungsverzeichnis der Baukalkulation:

- [x] **Standardisiertes MIME-Type Format**:
  - `application/x-enterprise-article`
  - `application/x-enterprise-position`
- [x] **D&D Payload**:
  ```json
  {
    "type": "ARTICLE",
    "articleId": "ART-99201",
    "articleNumber": "04.11.020",
    "shortText": "Beton C25/30 für Bodenplatte",
    "unit": "m³",
    "unitPriceMaterial": 115.50,
    "unitPriceLabor": 45.00
  }
  ```
- [x] **Visuelle Drop-Zone Indikatoren**: Einheitliche Highlight-Rahmen über Domain-Grenzen hinweg.

---

## 🗄️ 6. Globaler Cache-, State- & Schema-Sync

- [x] `STUDIO:SCHEMA_MODIFIED`:
  - Wenn im Tabellendesigner Spalten/Tabellen geändert werden, feuert das Studio ein Event.
  - Abfrage- und Seitendesigner invalidieren ihren lokalen Schema-Cache sofort.
- [x] `STUDIO:QUERY_EXECUTED`:
  - Übermittelt Abfrage-Ergebnisse an abonnierende Widget-Container.

---

## 🛡️ 7. Fehlerbehandlung, Timeouts & Dead-Letter-Handling

- [x] **Dead-Letter-Queue (DLQ)**: Auffangen von Events ohne registrierte Empfänger zur Diagnose.
- [x] **Timeout bei Request-Response Mustern**: Automatischer Abbruch nach 5000ms bei synchronen MFE-Abfragen.
- [x] **DevTools Event-Inspector**: Visuelle Timeline aller gefeuerten Events im Debug-Modus.

---

## 📅 8. Implementierungs-Checkliste & Phasenplan

- [x] **Phase 1**: Singleton Event-Bus Engine & TypeScript Base Types erstellen.
- [x] **Phase 2**: `useMfeEvent` & `publishMfeEvent` React Custom Hooks implementieren.
- [x] **Phase 3**: Shell- und Projektwechsel-Events (`SHELL:PROJECT_SELECTED`) anbinden.
- [x] **Phase 4**: Cross-MFE Drag & Drop Protokoll für Artikel -> Kalkulation umsetzen.
- [x] **Phase 5**: Schema-Synchronisation zwischen Studio-Modulen etablieren.
- [x] **Phase 6**: DevTools Event-Logger und Replay-Debugger integrieren.



---

