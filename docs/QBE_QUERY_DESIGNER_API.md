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
