# 🚀 DB Studio Pro: Umsetzung Paket 1 & Paket 5 (100% Single-Developer Autonomie)

Dieses Dokument beschreibt die Architektur und Verwendung der beiden Kernpakete zur Realisierung der **100%igen Local-First- und Single-Developer-Autonomie** in DB Studio Pro.

---

## 🟡 Übersicht der umgesetzten Pakete

| Paket | Bezeichnung | Kernfunktion | Autarkie-Level |
| :--- | :--- | :--- | :--- |
| **Paket 1** | **SQLite WASM Binary I/O Engine** | Direktes Öffnen, Abfragen & Abspeichern von `.sqlite`/`.db` Dateien im Browser ohne C#-Bridge | **100% Offline (WASM)** |
| **Paket 5** | **AST Plugin System & Lokaler Ollama Copilot** | Modulare Code-Generierung (Go, Python, Rust, C#) & lokale KI-Unterstützung via Ollama (11434) | **100% Offline (Local Daemon / Heuristik)** |

---

## 📦 Paket 1: SQLite WASM Binary I/O Engine

### 1. Technische Architektur (`/services/sqliteWasmEngine.ts`)
- **WebAssembly SQL Engine**: Basiert auf `sql.js` (SQLite kompiliert zu WebAssembly).
- **Direct File System Access API**:
  - Ermöglicht das direkte Speichern von `.sqlite`-Dateien auf die lokale Festplatte via `window.showSaveFilePicker`.
  - Intelligenter Fallback auf Browser-Download (`blob:`) für alle Plattformen.
- **Transpilation ins Projekt**:
  - Parst das Tabellen-Schema (`PRAGMA table_info`, `sqlite_master`) direkt in das interne DB Studio Schema-Format (`Table`, `Field`, Datentypen).
  - 1-Klick-Übernahme in den Tabellen-Designer, Abfrage-Designer und Berichts-Designer.

### 2. SQLite WASM Studio Modal (`/features/backend/sqlite/SqliteWasmStudioModal.tsx`)
- **Drag & Drop Upload**: Laden Sie beliebige `.sqlite`, `.db` oder `.sqlite3` Dateien direkt in den Speicher.
- **Tabellen-Inspektor**: Zeigt Spalten, Primärschlüssel, Datentypen, Not-Null Constraints und das Original-DDL-Statement.
- **Interaktiver SQL-Editor**: Führen Sie beliebige `SELECT`, `PRAGMA` oder DDL-Abfragen direkt gegen die WASM-Instanz aus.
- **Aufrufbar über**:
  - Backstage -> **Öffnen** -> *SQLite WASM Studio*
  - Backstage -> **Über DB Studio** -> Checkliste *SQLite WASM & IndexedDB Persistenz*

---

## 📦 Paket 5: AST Plugin System & Lokale Ollama Copilot

### 1. AST Code Generator Plugin Registry (`/features/generators/astPluginRegistry.ts`)
Modulare Plugin-Schnittstelle (`ICodeGenPlugin`) für dynamisch registrierbare Code-Generatoren:

1. **Go GORM Plugin (`GoGormPlugin`)**:
   - Generiert idiomatische Go-Structs mit `gorm:"column:...;primaryKey"` und `json:"..."` Tags.
   - Erzeugt automatische `AutoMigrateAll(db *gorm.DB)` Helper-Funktionen.
2. **Python SQLAlchemy 2.0 & Pydantic v2 (`PythonSqlAlchemyPlugin`)**:
   - Generiert typisierte `DeclarativeBase` Models (`Mapped[...] = mapped_column(...)`).
   - Erzeugt Pydantic v2 Schemas (`BaseModel`, `ConfigDict(from_attributes=True)`) für FastAPI.
3. **Rust Diesel & SQLx Plugin (`RustDieselPlugin`)**:
   - Generiert `#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]` Structs.
   - Erzeugt compile-time typisierte `diesel::table!` Schemas.
4. **C# Entity Framework Core 8 Plugin (`CSharpEfCorePlugin`)**:
   - Generiert POCO-Klassen mit `[Table]`, `[Key]`, `[Column]`, `[MaxLength]`.
   - Erzeugt `ApplicationDbContext` mit stark typisierten `DbSet<T>` Eigenschaften.

### 2. AST Plugin Generator UI (`/features/generators/PluginGeneratorModal.tsx`)
- 1-Klick Auswahl des Ziel-Stacks (Go, Python, Rust, C#).
- Multi-File Vorschau mit Syntax-Highlighting und Einzel-Download oder Clipboard-Kopieren.

### 3. Lokale Ollama Copilot Service (`/services/localOllamaService.ts`) & UI (`/features/ai/components/LocalOllamaCopilotModal.tsx`)
- **Lokale Schnittstelle**: Verbindet sich mit `http://localhost:11434` (Standard Ollama Port) oder LM Studio (`http://localhost:1234`).
- **Modell-Discovery**: Fragt `/api/tags` ab und listet lokal installierte Modelle (`llama3`, `mistral`, `codellama`, `qwen2.5-coder`) auf.
- **Zero-Cloud-Garantie**: Keine Daten oder Metadaten verlassen das System.
- **Offline-Heuristik Fallback**: Sollte kein lokaler Daemon aktiv sein, greift DB Studio Pro auf integrierte Regel-Heuristiken zurück, um trotzdem konsistente SQL-Statements zu generieren.

---

## 🔍 Schnelle Überprüfung & Integration

- **Code-Generierung testen**: Öffnen Sie das Backstage-Menü (**Datei** / Menüleiste) -> **Über DB Studio** -> **Architektur-Deep-Dive** -> Klick auf **`AST Plugin Hub`** oder **`Lokaler Ollama Copilot`**.
- **SQLite WASM testen**: Öffnen Sie **Datei** -> **Öffnen** -> Klick auf **`Studio öffnen`** im SQLite WASM Kasten.
