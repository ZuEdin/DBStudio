# DB Studio Pro — Banded Report Engine & Grouping API

Dieses Dokument spezifiziert die Architektur, Datenstrukturen und Schnittstellen der **Banded Report Engine** und des **Multi-Level Grouping Processors**. Das System ist primär auf **IndexedDB** im Browser ausgerichtet und so modular aufgebaut, dass ein nahtloser Wechsel auf relationale Backends (MySQL, PostgreSQL, SQLite, REST) ohne Anpassungen der Rendering-Schicht möglich ist.

---

## 1. Architektur-Übersicht

```
+-------------------------------------------------------------------------+
|                              Report UI Layer                            |
|  ReportView.tsx | ReportGroupNodeRenderer.tsx | WysiwygBandedDesigner   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                       Group Tree & Summary Engine                       |
|               buildMultiLevelGroupTree() / calculateSliceSummaries()    |
|   (Hierarchische Partitionierung nach N Ebenen mit Subgruppen-Summen)    |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                      Storage & Repository Layer                         |
|   reportIndexedDBService.ts (IndexedDB Stores: reports, data, configs)  |
|          -> Austauschbar durch MySQL / PostgreSQL Repository            |
+-------------------------------------------------------------------------+
```

---

## 2. Datenmodelle (Types & Schemas)

### 2.1 Gruppierungsebenen (`GroupLevel`)

```typescript
export interface GroupLevel {
  fieldId: string;           // ID des Feldes in der Quelltabelle / Abfrage
  fieldName?: string;        // Anzeigename des Feldes (z. B. "Beruf", "Geschlecht")
  sortOrder?: 'asc' | 'desc';// Sortierung innerhalb der Gruppe
  showHeader?: boolean;      // Gruppenkopf einblenden
  showFooter?: boolean;      // Gruppenfuß mit Zwischensummen einblenden
  pageBreakBefore?: boolean; // Seitenumbruch vor neuer Gruppe (z. B. Kostenstelle)
  pageBreakAfter?: boolean;  // Seitenumbruch nach Gruppenabschluss
  keepTogether?: boolean;    // Gruppe zusammenhalten (Schutz vor Waisen-Zeilen)
  repeatOnEveryPage?: boolean;
}
```

### 2.2 Aggregationen & Zwischensummen (`ReportSummary`)

```typescript
export interface ReportSummary {
  fieldId: string;
  fieldName: string;
  calculation: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
  groupFieldId?: string; // Optional: Nur für bestimmte Gruppierungsebene oder Gesamtfuß
}
```

### 2.3 Banded Section Konfiguration (`BandSectionConfig`)

```typescript
export interface BandSectionConfig {
  reportHeader: { 
    visible: boolean; 
    height?: number; 
    text?: string; 
    coverPage?: boolean; 
  };
  pageHeader: { 
    visible: boolean; 
    height?: number; 
    repeatLogo?: boolean; 
  };
  detailBand: { 
    keepTogether?: boolean; 
    alternateZebra?: boolean; 
  };
  pageFooter: { 
    visible: boolean; 
    showPageNumbers?: boolean; 
    printDate?: boolean; 
  };
  reportFooter: { 
    visible: boolean; 
    showGrandTotal?: boolean; 
    signatureBox?: boolean; 
    closingText?: string; 
  };
}
```

---

## 3. Multi-Level Grouping Engine (`groupTreeProcessor.ts`)

### 3.1 `buildMultiLevelGroupTree`

Generiert einen hierarchischen N-stufigen Baum (`GroupTreeNode[]`) aus einer flachen Datensatzmenge:

```typescript
export function buildMultiLevelGroupTree(
  data: Record<string, any>[],
  groupLevels: GroupLevel[],
  sourceFields: Field[],
  summaries: ReportSummary[] = [],
  groupMethod?: string
): GroupTreeNode[]
```

**Funktionsweise:**
1. **Rekursive Partitionierung:** Auf Ebene 0 wird nach `groupLevels[0]` partitioniert (z. B. *Beruf* = "Ingenieur", "Arzt").
2. **Subgruppen-Teilung:** Jede Gruppe auf Ebene 0 wird rekursiv nach `groupLevels[1]` partitioniert (z. B. *Geschlecht* = "m", "w", "d").
3. **Isolierte Berechnung:** Die Summen und Zähler (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) im Gruppenfuß werden **streng isoliert auf der Teilmenge der Datensätze** dieser Subgruppe berechnet.
4. **Blattknoten-Tabelle:** Erst auf der tiefsten Ebene werden die Tabellenzeilen gerendert.

### 3.2 `calculateSliceSummaries`

Berechnet die Aggregationen für einen exakten Datensatz-Slice:

```typescript
export function calculateSliceSummaries(
  items: Record<string, any>[],
  allSummaries: ReportSummary[] = [],
  currentGroupFieldId?: string
): SummaryResult[]
```

---

## 4. Druck-Architektur & Band-Sektionen

Beim Drucken (`window.print()`) werden folgende 5 Bereiche gerendert:

| Sektion | CSS-Klasse | Verhalten im Druck |
| :--- | :--- | :--- |
| **1. Berichtskopf (Report Header)** | `.report-header-band` | Genau einmal am Dokumentenanfang. Unterstützt DIN 5008 Briefkopf, Firmenlogo, Titel, Datum & Uhrzeit sowie Deckblatt-Umbruch (`coverPage`). |
| **2. Seitenkopf (Page Header)** | `.report-page-header-band` | Spaltenüberschriften, wiederholtes Mini-Logo, Berichtsreferenz und Druckdatum. |
| **3. Detailbereich & Gruppen** | `.report-detail-section` | Rekursive Gruppenköpfe (`.report-group-header-band`), Zeilen mit Zebrastreifen & Gitterlinien sowie Gruppenfüße (`.report-group-footer-band`). |
| **4. Berichtsfuß (Report Footer)** | `.report-footer-band` | Genau einmal am Dokumentenende. Kaufmännische Gesamtergebnisse, Schlusstext, Unterschriftenfelder. |
| **5. Seitenfuß (Page Footer)** | `.report-page-footer-band` | Am unteren Rand jeder Seite. DIN 5008 3-Spalten-Fuß oder Standard-Fuß mit Datumsformel (`=Datum()`) und Paginierung (`="Seite " & [Seite] & " von " & [Seiten]`). |

### Chrome-Isolierung:
Die Anwendungs-Navigation (`.app-header`, `.app-ribbon`, `.app-sidebar`, `.app-statusbar`, `.app-tabbar`, `.toast-container`, `.app-modal-layer`) wird im Print-Stylesheet via `display: none !important;` vollständig ausgeblendet.

---

## 5. Storage API & Backend-Austauschbarkeit

Die Schnittstelle `IReportStorageProvider` definiert alle CRUD-Operationen:

```typescript
export interface IReportStorageProvider {
  getReports(): Promise<Report[]>;
  getReportById(id: string): Promise<Report | null>;
  saveReport(report: Report): Promise<void>;
  deleteReport(id: string): Promise<void>;
  fetchReportData(sourceType: 'table' | 'query', sourceId: string): Promise<Record<string, any>[]>;
}
```

### IndexedDB Implementierung (Standard):
- Datenbankname: `DBStudioPro_DB`
- Object Stores: `reports`, `tables`, `queries`, `data_records`

### Migration auf MySQL / PostgreSQL:
Zur Umstellung auf eine relationale Datenbank muss lediglich die Repository-Klasse `SqlReportStorageProvider` implementiert werden, welche die gleichen Methoden über HTTP/REST oder SQL-Queries bedient.
