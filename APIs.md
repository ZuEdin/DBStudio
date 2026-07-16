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

---

## 6. Interaktive Drag & Drop- / Kanban-Schnittstelle (Updatefähigkeit)

Für die Verwaltung von Status- und Positionierungsänderungen via Drag & Drop (z. B. auf Kanban-Boards) stellt das generierte Frontend eine hoch-performante, ereignisgesteuerte Update-Schnittstelle bereit.

### 6.1 Status-Aktualisierung bei Spaltenwechsel (Container Move)
Wenn ein Element (z. B. ein Task oder Ticket) von einem Container/Status in einen anderen gezogen wird, löst das System automatisch ein Update-Ereignis aus.

#### Client-seitiger Ablauf (Angular / Vue / React):
1. **Event Capture:** Das `drop`-Event ermittelt die ID des gezogenen Elements (`activeDragItem`) und den Ziel-Container (`targetColumn`).
2. **Local Sync:** Der Statuswert des Elements wird im lokalen Speicher (IndexedDB) aktualisiert.
3. **API Dispatch:** Ein asynchroner Aufruf wird an das Speicher-Repository gesendet, um die Änderung dauerhaft zu persistieren:
   - **IndexedDB:** `mauiIndexedDb.update(tableName, id, updatedRecord)`
   - **SQL-Server (über API):** `PUT /api/data/:tableId/:rowId` mit `{ status: targetColumn }`
4. **User Feedback:** Eine reaktive Notification-Bar zeigt dem Benutzer den genauen Zustand an ("Erfolgreich verschoben: 'Aufgabe A' von 'Offen' nach 'In Arbeit'"). Bei einem Netzwerk- oder Schreibfehler wird der Zustand automatisch auf den alten Spaltenwert zurückgesetzt (Rollback-Integrität).

### 6.2 Reihenfolge-Aktualisierung (Reordering im selben Container)
Beim Verschieben eines Elements innerhalb desselben Containers zur Änderung der Priorität oder Reihenfolge:
- **Index-Mapping:** Das System berechnet das neue Positions-Attribut (z. B. `position` oder `sort_order`).
- **Batch-Update:** Die betroffenen Zeilen werden lokal umsortiert und per Sammel-Update (Batch) aktualisiert, um übermäßige DB-Zugriffe zu vermeiden.
- **Konsistenz:** Die Sortier-API `api.update` stellt sicher, dass die neue Reihenfolge sowohl in der lokalen IndexedDB als auch im SQL-Backend identisch abgelegt wird.

---

## 7. Externe Daten, Exporte, Backups & Server-Synchronisation

Um den nahtlosen Datenaustausch zwischen verschiedenen Datenquellen (Excel, Access XML, SQL, JSON, APIs) und dem generierten Backend zu regeln, stehen folgende API-Schnittstellen zur Verfügung.

### 7.1 Import- & Dateiformate

#### A. Excel-Format (.xlsx, .xls)
- **Parser:** Client-seitig via `xlsx` (SheetJS).
- **Ablauf:** Datei-Upload &rarr; Schema-Inferenz (Smart Type Inference) &rarr; SVERWEIS-Beziehungsvorschläge &rarr; Speichern in IndexedDB.

#### B. Access XML-Format (.xml)
- **Struktur:** MS Access XML dataroot Format.
- **Parser:** `DOMParser` im Browser. Extrahiert Tag-Namen als Spaltenbezeichner und Textinhalte als Werte.
- **Beispiel XML-Schema:**
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <dataroot xmlns:od="urn:schemas-microsoft-com:officedata">
    <Kunden>
      <KundenID>1</KundenID>
      <Name>Muster GmbH</Name>
      <Ort>Berlin</Ort>
    </Kunden>
  </dataroot>
  ```

#### C. SQL-Schema & Insert-Dumps (.sql)
- **Import:** Unterstützt DDL-Anweisungen (`CREATE TABLE [Name] ([Feld] [Typ], ...)`) und DML (`INSERT INTO [Name] (...) VALUES (...)`).
- **Export:** Generiert vollständig kompatible ANSI-SQL DDLs und INSERT-Skripte zur direkten Ausführung in PostgreSQL, MySQL oder SQLite.

#### D. JSON-Dateien (.json)
- **Import:** Erkennt Arrays von flachen oder verschachtelten Objekten mit automatischer Inferenz.
- **Export:** Gibt die vollständige Datensatzliste als strukturiertes JSON-Array aus.

### 7.2 Backend-API Schnittstellen (Multi-Source Express Server)

Für die Synchronisation und Bereitstellung von Daten über das generierte Express-Backend werden folgende Routen verwendet:

#### `GET /api/backend-apis`
Ruft alle registrierten API-Konfigurationen und Datenquellen ab.
- **Rückgabe:** `Promise<BackendApiConfig[]>`

#### `POST /api/backend-apis`
Registriert oder aktualisiert eine API-Schnittstelle.
- **Request-Body:**
  ```json
  {
    "name": "KundenSchnittstelle",
    "url": "https://api.example.com/customers",
    "method": "GET",
    "headers": "{\"Content-Type\": \"application/json\"}",
    "queryParams": [],
    "option": "B", // A = Live-Proxy, B = Server-Cache
    "refreshInterval": 3600, // Sync-Intervall in Sekunden
    "fields": [...],
    "data": [...] // Initiale Cachedaten für Option B
  }
  ```
- **Rückgabe:** `Promise<{ success: true, config: BackendApiConfig }>`

#### `DELETE /api/backend-apis/:name`
Löscht eine registrierte Schnittstelle und bereinigt den Server-Cache.
- **Rückgabe:** `Promise<{ success: true }>`

#### `POST /api/backend-apis/:name/refresh`
Triggert eine manuelle Server-seitige Aktualisierung der API-Cachedaten. Der Server holt die Daten live von der Quell-URL und speichert sie im lokalen Dateisystem (`data/api_cache_[name].json`).
- **Rückgabe:** `Promise<{ success: true, count: number, data: any[] }>`

#### `GET /api/backend-apis/:name/data`
Gibt die Daten der registrierten Schnittstelle zurück. Bei Option A erfolgt ein Live-Proxying; bei Option B werden die serverseitig gecachten JSON-Daten ausgeliefert.
- **Rückgabe:** `Promise<any[]>`

#### `PUT /api/backend-apis/:name/data`
Ermöglicht das direkte Editieren und Überschreiben des serverseitigen Daten-Caches. Ideal für manuelle Datenkorrekturen über das Externe Daten-Hub.
- **Request-Body:** `any[]` (Komplettes Datenarray)
- **Rückgabe:** `Promise<{ success: true, count: number }>`

### 7.3 Projekt-Backup & Restore (Desaster Recovery)

#### `POST /api/backup/download`
Ermöglicht das Herunterladen eines vollständigen Relationalen-Schemas inkl. aller Daten, Queries und Layouts als komprimierte Sicherungsdatei.
- **Rückgabe:** JSON-Dateidownload
