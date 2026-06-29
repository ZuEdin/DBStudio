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

