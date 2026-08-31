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
