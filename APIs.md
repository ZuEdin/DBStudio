# DB Studio Pro - API & Datenbank-Spezifikation (IndexedDB / SQL / MySQL)

Diese Spezifikation beschreibt die Architektur der Datenhaltung von **DB Studio Pro**. Um maximale Zuverlässigkeit, Offline-Fähigkeit und Performance im Browser zu gewährleisten, hat **IndexedDB** oberste Priorität. Gleichzeitig sind die Datenmodelle und Schnittstellen so konzipiert, dass ein Wechsel zu relationalen Server-Datenbanken (z. B. PostgreSQL, MySQL, SQLite) oder die Synchronisation mit diversen Backends ohne aufwendiges Refactoring möglich ist.

---

## 1. Datenbank-Architektur & Priorisierung

### Primärer Speicher (Client-Side): **IndexedDB**
- **Warum IndexedDB?** Bietet asynchronen, transaktionalen Speicher im Browser für große Datenmengen und ist unempfindlich gegenüber Browser-Cache-Purges (im Gegensatz zu `localStorage`).
- **Abstraktionsschicht:** Der Zugriff erfolgt über ein einheitliches Repository-Muster (`storageService`), welches im Hintergrund IndexedDB anspricht.
- **Transaktions-Sicherheit:** Alle Operationen werden transaktionsbasiert ausgeführt, um Datenkorruption bei plötzlichen Verbindungsabbrüchen zu verhindern.

### Sekundärer/Server-Speicher (SQL, MySQL, etc.)
- Das Datenbankschema in IndexedDB spiegelt eine relationale Struktur wider (normalisierte Tabellen, Fremdschlüssel-Beziehungen).
- APIs und Repositories nutzen asynchrone Schnittstellen (Promises), um nahtlos durch API-Calls (REST/GraphQL) an ein relationales MySQL/PostgreSQL-Backend ausgetauscht werden zu können.

---

## 2. IndexedDB Schema-Definition (Object Stores)

Die IndexedDB nutzt folgende Object Stores unter der Datenbank `db_studio_pro_db`:

### Store: `projects`
Speichert die kompletten Metadaten des relationalen Modellierungsprojekts.

| Key (Path) | Typ | Beschreibung |
| :--- | :--- | :--- |
| `id` (KeyPath) | `string` (UUID) | Eindeutige Projekt-ID |
| `name` | `string` | Projektname (z. B. "Kundenverwaltung") |
| `lastModified` | `number` | Letzter Änderungszeitstempel (UTC Epoch) |
| `data` | `object` | Das komplette relationale Schema (siehe unten) |

#### Struktur des `data`-Objekts:
- `tables`: Array aller definierten Tabellen (mit Spalten, Primärschlüsseln, Indizes).
- `relationships`: Definitionen aller Foreign Key-Beziehungen (Tabelle A verweist auf Tabelle B).
- `queries`: Gespeicherte relationale Abfragen (z. B. SELECT-Queries mit Joins).
- `forms`: Formulardefinitionen und UI-Layouts für Dateneingabe.
- `reports`: Strukturierte Berichte und Dashboard-Widgets.
- `workflows`: Automatisierungs-Workflows (Trigger, Conditions, Actions).

---

## 3. Generische API-Schnittstellen (CRUD & Synchronisation)

Alle Service-Methoden geben standardmäßig `Promise<T>` zurück, damit die Benutzeroberfläche nicht blockiert und ein Austausch der lokalen IndexedDB-Logik durch Server-APIs (Fetch/Axios) transparent bleibt.

### 3.1 Projekt-Verwaltung

#### `GET /api/projects` (bzw. `storageService.getAllProjects()`)
Ruft alle vorhandenen Projekte ab.
- **Rückgabe:** `Promise<Project[]>`

#### `GET /api/projects/:id` (bzw. `storageService.getProjectById(id)`)
Lädt ein spezifisches Projekt anhand seiner ID.
- **Rückgabe:** `Promise<Project | null>`

#### `POST /api/projects` (bzw. `storageService.saveProject(project)`)
Erstellt oder aktualisiert ein Projekt.
- **Request-Body:** `Project` (JSON)
- **Rückgabe:** `Promise<void>`

#### `DELETE /api/projects/:id` (bzw. `storageService.deleteProject(id)`)
Löscht ein Projekt inklusive all seiner Tabellen-Strukturen.
- **Rückgabe:** `Promise<void>`

---

## 4. Daten-Schnittstellen für dynamische Tabellen (Mock & Live-Data)

Für jede im System entworfene Tabelle (z. B. `Customers`, `Orders`) stellt das System dynamische Datenschnittstellen bereit.

### 4.1 Datensätze abrufen
#### `GET /api/data/:tableId`
- **Option A (Offline/IndexedDB):** Holt die Daten direkt aus dem `data`-Array der Tabelle in der lokalen IndexedDB.
- **Option B (Server/SQL):** Entspricht `SELECT * FROM [TableName]`.
- **Rückgabe:** `Promise<Record<string, any>[]>`

### 4.2 Datensatz erstellen
#### `POST /api/data/:tableId`
- **IndexedDB:** Fügt ein neues Objekt in das Zeilen-Array hinzu. Generiert bei Bedarf auto-inkrementierende IDs.
- **SQL/MySQL:** Führt `INSERT INTO [TableName] (...) VALUES (...)` aus.
- **Request-Body:** `Record<string, any>` (Die neuen Spaltenwerte)
- **Rückgabe:** `Promise<Record<string, any>>` (Inklusive generierter ID)

### 4.3 Datensatz aktualisieren
#### `PUT /api/data/:tableId/:rowId`
- **IndexedDB:** Aktualisiert das entsprechende Objekt im Array.
- **SQL/MySQL:** Führt `UPDATE [TableName] SET ... WHERE Id = [rowId]` aus.
- **Request-Body:** `Partial<Record<string, any>>`
- **Rückgabe:** `Promise<Record<string, any>>`

### 4.4 Datensatz löschen
#### `DELETE /api/data/:tableId/:rowId`
- **IndexedDB:** Entfernt das Objekt mit der passenden ID aus dem Array.
- **SQL/MySQL:** Führt `DELETE FROM [TableName] WHERE Id = [rowId]` aus.
- **Rückgabe:** `Promise<boolean>`

---

## 5. Vorbereitung für SQL- und MySQL-Migration (Multi-Backend)

Um die Migration von der lokalen IndexedDB zu einem echten SQL- oder MySQL-Server-Backend so nahtlos wie möglich zu gestalten, wurden folgende Vorkehrungen getroffen:

1. **Relationale Datenmodellierung:** Tabellen im UI sind streng typisiert (VARCHAR, INTEGER, BOOLEAN, DATE, etc.). Das Datenmodell erzwingt Primärschlüssel und referenzielle Integrität per Foreign Key-Konfigurationen.
2. **Generischer Abfrage-Builder:** Der in der App integrierte Query-Designer generiert standardmäßigen SQL-Syntax (ANSI-SQL), welcher direkt auf PostgreSQL, MySQL oder SQLite ausgeführt werden kann.
3. **Repository-Kapselung:** Das UI spricht niemals direkt mit der IndexedDB-Instanz, sondern konsumiert ausschließlich den `useProjectStore` oder den `storageService`. Wenn Sie zu einer relationalen Datenbank migrieren, müssen Sie lediglich die Implementierung des `storageService` austauschen, während das Frontend völlig unangetastet bleibt.
4. **Referenzielle Integrität bei Feldlöschung:**
   - Sobald ein Tabellenfeld über den Designer gelöscht wird, bereinigt das System automatisch alle betroffenen Fremdschlüssel-Beziehungen, Formularelemente, Abfrage-Spalten und Workflow-Knoten.
   - Dies verhindert verwaiste Foreign Keys auf Server-Ebene, die bei echten SQL-Datenbanken zu schweren Integritätsverletzungen (`FOREIGN KEY constraint failed`) führen würden.
