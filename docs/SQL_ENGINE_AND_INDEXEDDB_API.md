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
