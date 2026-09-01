# DB Studio Pro - Code-Generierung, Plug-ins & Self-Host Handbuch

> Enthält technische Spezifikationen zu den Quellcode-Generatoren für .NET, Node.js, PHP, Python, Docker/Self-Host Setups, mobile Apps (Cordova/Capacitor) sowie benutzerdefinierte Generierungs-Plug-ins.

## Inhaltsverzeichnis

1. [CODE GENERATION ENGINE API](#code-generation-engine-api)
2. [CustomComponentsAPI](#customcomponentsapi)
3. [DOTNET GENERATOR QUERY API](#dotnet-generator-query-api)
4. [FORM STUDIO API](#form-studio-api)
5. [REPORTING PRINT ENGINE API](#reporting-print-engine-api)
6. [SELF HOST](#self-host)
7. [MobileAndOfflineArchitecture](#mobileandofflinearchitecture)

---

<a id="code-generation-engine-api"></a>
# CODE GENERATION ENGINE API

> **Originaldatei:** `docs/CODE_GENERATION_ENGINE_API.md`

# ⚡ Enterprise Full-Stack Code-Generierungs-Engine API Documentation

Diese Dokumentation beschreibt die APIs, Stacks, IndexedDB-Persistenz und Architektur der **Full-Stack & Clean Architecture Code-Generierungs-Engine**.

---

## 💾 1. IndexedDB Persistence Service API
`utils/generators/services/codeGenIndexedDBService.ts`

Lokale IndexedDB-Persistenz für generierte Lösungspakete, Entwürfe und Templates.

### Data Models
```typescript
export interface CodeProjectRecord {
  id: string;
  projectName: string;
  targetStack: string;
  generatedAt: number;
  filesCount: number;
  zipSizeKb: number;
  filesJson: string; // Serialisierter Dateibaum
}

export interface CodeTemplateRecord {
  id: string;
  name: string;
  framework: string;
  version: string;
  content: string;
}
```

### Methods
- `saveCodeProjectToIndexedDB(project)`: Speichert generierte Full-Stack Projekte lokal ab.
- `getAllCodeProjectsFromIndexedDB()`: Lädt alle in IndexedDB gespeicherten Code-Projekte.

---

## 🖥️ 2. Backend Frameworks & ORM Generatoren API

### A. C# .NET 10 EF Core & FastEndpoints (`utils/generators/dotnet10Generator.ts`)
Generiert eine **Clean Architecture** Solution (`Domain`, `Application`, `Infrastructure`, `Api`, `Tests`).
- **Features**: FastEndpoints / Minimal API, EF Core 10 DbContext & Fluent Mappings, CQRS mit MediatR, FluentValidation, Native AOT Kompatibilität (`<PublishAot>true</PublishAot>`), Scalar OpenAPI UI, xUnit Tests.

### B. Node.js NestJS & Fastify (`utils/generators/nodeNestFastifyGenerator.ts`)
Generiert ein typsicheres TypeScript-Backend.
- **Features**: Fastify / Express Engine, Drizzle ORM Schema & Migrations, Zod Body/Query Validierung, JWT Authentication Guards, Swagger OpenAPI Spezifikation.

### C. PHP 8.4 PDO, Laravel 11 & Filament v3 (`utils/generators/phpLaravelFilamentGenerator.ts`)
Generiert ein modernes PHP-Backend.
- **Features**: Eloquent Models mit PHP 8 Attributes, API Resource Controllers, Form Requests, Filament v3 Admin-Panel Resourcen, Composer & Pest PHP Test-Suite Setup.

### D. Python FastAPI & SQLAlchemy 2.0 (`utils/generators/pythonFastApiGenerator.ts`)
Generiert eine asynchrone Python-API.
- **Features**: FastAPI Controller mit `/docs` Swagger-UI, Pydantic v2 Datenvalidierung, SQLAlchemy 2.0 Async-Session & Asyncpg, Alembic-Migrations-Pipeline, Pytest & Testcontainers Integration.

---

## 🌐 3. Moderne Frontend Frameworks API (`utils/generators/frontendModernGenerator.ts`)

### A. React 19 + TanStack Query v5 + Zustand
- React 19 Client/Server Patterns, TanStack Query v5 Caching & Invalidation, Zustand Global Store, Radix UI Primitives, Lucide-React Icons.

### B. Angular 19 Standalone Signals & SignalStore
- 100% Zoneless Standalone Components, `signal()`, `computed()`, Angular Resource API, NgRx SignalStore.

### C. Vue 3.5 Composition API + Pinia
- Composition API (`<script setup lang="ts">`), Pinia Stores, VeeValidate, Tailwind CSS Integration.

### D. Svelte 5 mit Runes (`$state`, `$derived`, `$props`)
- Ultraschnelles Frontend mit nativer Runes-Reaktivität (`$state`, `$derived`, `$props`).

---

## 🔌 4. CMS & Enterprise Plugin Generatoren API (`utils/generators/cmsPluginsGenerator.ts`)

### A. WordPress Plugin Generator
- Custom Post Types (CPTs), benutzerdefinierte Tabellen mit `$wpdb` & `dbDelta()`, REST API Endpunkte `/wp-json/my-app/v1/`, Gutenberg Blocks.

### B. Nextcloud OCP App Generator
- App-Deskriptor `appinfo/info.xml`, OCP QueryBuilder Services, PSR-konforme Controller (`PageController.php`), Vue 3 `@nextcloud/vue` Frontend.

---

## 🏗️ 5. OpenAPI 3.1, Docker & CI/CD Generator API (`utils/generators/devOpsOpenApiGenerator.ts`)

### A. OpenAPI 3.1 & Postman Collection
- Automatische Erstellung von `openapi.json` (OpenAPI 3.1) und `postman_collection.json` (Postman v2.1 Format).

### B. Containerisierung & CI/CD
- Multi-Stage Production `Dockerfile` (Build & Runner Stages).
- `docker-compose.yml` mit App-Server, PostgreSQL 16 & Redis 7.
- `.github/workflows/ci-cd.yml` Pipeline für automatisches Check-out, Linting, Testing und Building.



---

<a id="customcomponentsapi"></a>
# CustomComponentsAPI

> **Originaldatei:** `docs/CustomComponentsAPI.md`

# DB Studio Pro - SDUI Custom Components API-Spezifikation

Diese Spezifikation dokumentiert das JSON-basierte Konfigurationsschema der **Server-Driven UI (SDUI) Custom Components** in **DB Studio Pro**. Jede Custom Component ist so entworfen, dass sie sowohl im visuellen Designer konfiguriert als auch direkt im Browser (IndexedDB) oder über ein Server-Backend dynamisch gerendert werden kann.

---

## 1. Komponenten-Struktur (CustomComponent Schema)

Eine registrierte Custom Component besitzt die folgende Struktur:

```typescript
export interface CustomComponent {
  id: string;               // Eindeutige UUID der Komponente
  name: string;             // Name der Komponente (z. B. "UmsatzHistorie")
  description?: string;     // Beschreibung für Designer/Developer
  type: 'table_view' | 'chart_view' | 'form_view' | 'text' | 'button' | 'dropdown' | 'metric_card' | 'kanban_board'; // Basis-Renderer-Typ
  configuration: Record<string, any>; // Dynamisches JSON-Konfigurations-Schema
}
```

---

## 2. Spezifikationen der JSON-Konfigurationen (`configuration`)

### 2.1 Tabellen- & Karten-Layouts (`table_view`)

Dieser Typ unterstützt zwei Layout-Modi: **Tabelle** (Standard-HTML-Table mit `<tr>`) und **Karten-Raster** (Visual Cards Grid).

#### JSON Schema:
```json
{
  "dataSourceType": "table",      // "table" oder "query"
  "dataSourceId": "table-uuid",    // ID der Tabelle oder Abfrage
  "layoutMode": "table",          // "table" oder "grid"
  "title": "Umsatzübersicht",     // Header-Titel (unterstützt Platzhalter)
  "pageSize": 5,                  // Anzahl der Zeilen/Karten pro Seite
  "tableStyle": "striped",        // Für Layout "table": "striped", "compact", "bordered", "flat"
  "enableSearch": true,           // Globale Suche aktivieren
  "searchPlaceholder": "Suchen...",
  
  "enableFilters": true,          // Filterleiste über Tabelle aktivieren
  "filterFields": ["Status", "Ort"], // Felder, nach denen gefiltert werden kann
  "enableSorting": true,          // Spalten-Sortierung aktivieren (Anzeige von Sortier-Icons)
  "defaultSortField": "Umsatz",   // Standardmäßig vorsortierte Spalte
  "defaultSortOrder": "desc",     // Standard-Sortierrichtung: "asc" oder "desc"

  "columns": [                    // Spalten-Definitionen (nur für Layout "table")
    {
      "field": "id",              // Feldname aus der Datenquelle
      "title": "ID",              // Spaltenüberschrift im Header
      "width": "80px",            // Feste Breite oder "auto"
      "align": "left",            // Textausrichtung: "left", "center", "right"
      "type": "text",             // Zelltyp: "text", "badge", "currency", "date", "number"
      "footerType": "none"        // Footer-Aggregat: "none", "sum", "avg", "count", "custom"
    },
    {
      "field": "Umsatz",
      "title": "Umsatz (€)",
      "width": "auto",
      "align": "right",
      "type": "currency",
      "footerType": "sum"         // Berechnet automatisch die Summe im Statischen Footer
    }
  ],

  "cardGridCols": 3,              // Für Layout "grid": Anzahl der Spalten (1-4)
  "cardShadow": "sm",             // Karten-Schatten: "none", "sm", "md", "lg"
  "cardBorder": "slate",          // Karten-Rahmen: "none", "slate", "indigo"
  "cardTemplate": [               // Struktur der wiederholten Karte (nur für Layout "grid")
    {
      "type": "badge",            // Elementtyp: "title", "subtitle", "badge", "description", "button"
      "field": "Status",          // Feldname aus der Datenquelle
      "label": "Status",          // Optionales Präfix-Label
      "style": "bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full" // Tailwind-Stil
    },
    {
      "type": "title",
      "field": "Name",
      "style": "text-sm font-bold text-slate-800"
    }
  ]
}
```

---

### 2.2 Diagramm-Layouts (`chart_view`)

Visualisiert Daten als interaktive Recharts- oder D3-Komponenten.

#### JSON Schema:
```json
{
  "chartType": "bar",             // "bar", "line", "area", "pie"
  "title": "Monatlicher Umsatz",
  "dataSourceType": "table",
  "dataSourceId": "table-uuid",
  "xAxisKey": "Month",            // Spalte für die X-Achse
  "series": [                     // Datenreihen auf der Y-Achse
    {
      "key": "Revenue",
      "label": "Umsatz (€)",
      "color": "#3b82f6"          // Hexadezimaler Farbcode
    }
  ]
}
```

---

### 2.3 Formular-Einbettung (`form_view`)

Bettet vordefinierte CRUD-Formulare nahtlos ein.

#### JSON Schema:
```json
{
  "formId": "form-uuid",          // ID des registrierten Formulars
  "formMode": "create",           // "create" (INSERT) oder "edit" (UPDATE)
  "hideHeader": false,            // Kopfzeile ausblenden
  "hideActions": false            // Aktionsbuttons ausblenden (Speichern/Abbrechen)
}
```

---

### 2.4 Dynamische Texte (`text`)

Ermöglicht das Anzeigen personalisierter oder dynamic-bound Textbeschreibungen.

#### JSON Schema:
```json
{
  "text": "Hallo {name}, Ihr aktueller Status ist: {Status}!", // Platzhalter in {}
  "fontSize": "text-lg",          // "text-xs", "text-sm", "text-base", "text-lg", "text-2xl"
  "fontWeight": "font-bold",      // "font-normal", "font-medium", "font-semibold", "font-bold"
  "colorClass": "text-indigo-900",// Textfarbe
  "alignment": "text-left"        // "text-left", "text-center", "text-right"
}
```

---

### 2.5 Aktions-Buttons (`button`)

Löst client-seitige Aktionen wie Navigationen oder Zustandsänderungen aus.

#### JSON Schema:
```json
{
  "label": "Kunde ansehen",
  "actionType": "navigate",       // "submit" (Formular-Senden), "navigate", "setParam"
  "variant": "primary",           // "primary", "secondary", "danger", "outline"
  "targetPageId": "page-uuid",    // ID der Zielseite bei "navigate"
  "targetParamKey": "customerId", // Parametername bei "setParam"
  "targetParamVal": "{id}"        // Parameterwert (unterstützt dynamische Werte)
}
```

---

### 2.6 Auswahlmenüs (`dropdown`)

Rendert ein datengebundenes Dropdown-Feld für Filterungen oder Formularauswahlen.

#### JSON Schema:
```json
{
  "label": "Kunden filtern",
  "dataSourceType": "table",
  "dataSourceId": "table-uuid",
  "displayField": "Name",         // Angezeigter Text der Option
  "valueField": "id",             // Übertragener Wert beim Auswählen
  "placeholder": "-- Bitte wählen --"
}
```

---

### 2.7 Kennzahl-Karten (`metric_card`)

Zeigt berechnete KPI-Werte (z.B. Summe, Anzahl oder Mittelwert) aus Tabellendaten in einer ansprechenden Bento-Grid-Karte an.

#### JSON Schema:
```json
{
  "title": "Gesamtumsatz",         // Titel der Kennzahl
  "dataSourceType": "table",
  "dataSourceId": "table-uuid",
  "aggType": "sum",               // Berechnungstyp: "count", "sum", "avg", "min", "max", "custom"
  "aggField": "Umsatz",           // Spalte, auf die die Aggregation angewendet wird (nur bei sum, avg, min, max)
  "customValue": "24.500",        // Statischer Wert (nur wenn aggType === "custom")
  "prefix": "€ ",                 // Text vor dem Wert
  "suffix": " EUR",               // Text nach dem Wert
  "subtext": "+12% vs Vorjahr",   // Untertitel mit Trend-Beschreibung
  "themeColor": "emerald",        // Farbschema: "indigo", "emerald", "rose", "sky", "amber", "slate"
  "iconName": "TrendingUp"        // Lucide-Icon: "TrendingUp", "Users", "DollarSign", "Activity", "Calendar", "Percent", "Award", "ShoppingCart"
}
```

---

### 2.8 Aufgaben-Boards (`kanban_board`)

Gruppiert Datensätze einer Tabelle anhand einer Status-Spalte in ein vollfunktionales Kanban-Task-Board.

#### JSON Schema:
```json
{
  "title": "Aufgaben-Board",       // Board-Titel
  "dataSourceType": "table",
  "dataSourceId": "table-uuid",
  "groupByField": "Status",       // Die Spalte, nach der die Lanes gruppiert werden (z.B. "Status", "Kategorie")
  "titleField": "Name",           // Spaltenzuordnung für den Haupttitel der Karte
  "descField": "Email",           // Spaltenzuordnung für die Beschreibung der Karte
  "cardAccentField": "Umsatz"     // Spaltenzuordnung für den farbigen Akzent-Tag der Karte
}
```

---

### 2.9 Kalender-Ansicht (`calendar_view`)

Stellt datengebundene Datensätze in einem voll interaktiven Kalender dar (Monat, Woche, Tag, Agenda) mit automatischer Datumszuordnung. Es werden sowohl kombinierte Datetime-Felder als auch separate Spalten für Datum und Uhrzeit unterstützt.

#### JSON Schema:
```json
{
  "title": "Mein Terminplaner",   // Kalender-Titel
  "dataSourceType": "table",      // "table" oder "query" (Datenbanktabelle oder benutzerdefinierte SQL-Abfrage)
  "dataSourceId": "table-uuid",   // Eindeutige ID der verknüpften Tabelle oder Abfrage
  "startDateField": "date",       // Spaltenzuordnung für das Startdatum (DATE/DATETIME)
  "endDateField": "end_date",     // Optionale Spaltenzuordnung für das Enddatum (DATE/DATETIME)
  "startTimeField": "start_time", // Optionale Spaltenzuordnung für separate Startzeit (TIME/VARCHAR)
  "endTimeField": "end_time",     // Optionale Spaltenzuordnung für separate Endzeit (TIME/VARCHAR)
  "titleField": "name",           // Spaltenzuordnung für den Namen/Titel des Termins
  "colorField": "category_color", // Optionales Spaltenfeld für Termin-Farben (Hexadezimalwerte)
  "defaultView": "month",         // Standard-Kalenderansicht: "month", "week", "work_week", "day", "agenda"
  "views": ["month", "week", "day", "agenda"] // Array der auswählbaren Ansichten im Frontend
}
```

---

## 3. Runtime Rendering & Datenbindung (LiveNode Integration)

Im Renderer `LiveNode.tsx` wird jede Custom Component wie folgt verarbeitet:
1. **Daten-Fetching**: Das System lädt asynchron die verknüpfte Tabelle oder Abfrage basierend auf `dataSourceId` und `dataSourceType`.
2. **Daten-Vorschau**: Bei leeren Tabellen generiert der Designer automatisch realistische Mock-Daten basierend auf den Spaltentypen (`VARCHAR`, `INTEGER`, `DECIMAL`, `BOOLEAN`, `DATE`).
3. **Loop-Wiederholung**:
   - **Tabelle (`table_view`)**: Nur die Zeile (`<tr>`) wird wiederholt. Der Tabellenkopf (`<thead>`) und Fuß (`<tfoot>`) verbleiben statisch. Aggregate wie Summe (`sum`), Schnitt (`avg`) und Anzahl (`count`) werden live im Footer berechnet.
   - **Karten-Raster (`grid`)**: Die gesamte Card-Vorlage wird für jeden Datensatz wiederholt und responsiv als Grid gerendert.
4. **Zustandsparameter**: Das Klicken auf ein Listenelement oder eine Karte setzt den konfigurierten `selectionParamName` (z. B. `selectedId`) und leitet optional zur `detailsPageId` weiter, was Master-Detail-Ansichten ohne Programmieraufwand ermöglicht.



---

<a id="dotnet-generator-query-api"></a>
# DOTNET GENERATOR QUERY API

> **Originaldatei:** `docs/DOTNET_GENERATOR_QUERY_API.md`

# .NET Backend Generator – Query & SQL View Mapping Architecture

## Problemstellung & Ursachenanalyse

### Fehlerbild:
```text
Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 1: 'no such table: main.Lehrlinge_Lehre'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
```

### Warum erscheint `main.` im Fehler?
In **SQLite** ist `main` der interne Standard-Schemaname für die primäre Datenbankdatei (analog zu `dbo` in MSSQL oder `public` in PostgreSQL). Wenn SQLite einen SQL-View oder eine Abfrage ausführt und eine referenzierte Tabelle nicht findet, gibt SQLite die Fehlermeldung mit Schemapräfix aus (`no such table: main.<Tabellenname>`). Das Präfix `main.` wurde also nicht vom Code generiert, sondern ist die originäre Fehlerausgabe der SQLite-Engine.

### Ursache des Fehlers:
1. **Tabellenerstellung im .NET Generator**:
   - Im .NET Generator (`utils/generators/dotnet/seed.ts` und `models.ts`) werden alle Entitätstabellen für C#/EF Core im PascalCase-Format angelegt (z. B. `Lehrlinge_Lehre` &rarr; `LehrlingeLehre`, `CREATE TABLE [LehrlingeLehre] (...)` und `modelBuilder.Entity<LehrlingeLehre>().ToTable("LehrlingeLehre")`).
2. **View-Generierung für Queries**:
   - Beim Erstellen der SQL-Views (`CREATE VIEW [MeineAbfrage] AS SELECT ... FROM [Lehrlinge_Lehre]`) nutzte `generateSqlSelect` bisher die rohen Designernamen (`Lehrlinge_Lehre`).
   - SQLite fand beim Ausführen des Views `[MeineAbfrage]` die Tabelle `[Lehrlinge_Lehre]` nicht, da in der Datenbank nur `[LehrlingeLehre]` existierte.

---

### Fehlerbild 2:
```text
Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 1: 'no such column: Rechnungen.RechnungsNr'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at FakturierungPro.Controllers.QueriesController.GetOffeneRechnungen(Int32 page, Int32 pageSize)
```

### Ursache von Fehler 2:
1. **Knoten-Aliase in SQL-Joins**:
   - Wenn eine SQL-Abfrage aus mehreren Tabellen-Knoten (z. B. `n1`, `n2`) besteht, erzeugt SQL die Tabellen als `FROM [Kunden] AS [n1] LEFT JOIN [Rechnungen] AS [n2]`.
   - Sobald eine Tabelle im SQL-FROM/JOIN einen Alias besitzt (`AS [n2]`), verbietet SQLite (und ANSI-SQL), Spalten über den ursprünglichen Tabellennamen (`Rechnungen.RechnungsNr`) zu referenzieren.
   - Wenn in den Query-Spalten das Feld `nodeId` fehlte oder nicht direkt gemappt wurde, fiel der Spalten-Präfix fälschlicherweise auf `col.tableName` (`Rechnungen.RechnungsNr`) anstelle des Knoten-Alias (`n2.RechnungsNr`) zurück.
   - Beim Ausführen des Views in SQLite trat daraufhin `no such column: Rechnungen.RechnungsNr` auf.

---

## Durchgeführte Behebungen

### 1. Intelligente Spalten-Knoten-Auflösung (`utils/sqlHelper.ts`)
- Die neue Funktion `resolveColumnNode` mappt jede Spalte im `SELECT`, `WHERE`, `GROUP BY` und `ORDER BY` exakt auf den aktiven Knoten-Alias (`nodeInfo.alias`):
  1. Direkte `nodeId`-Übereinstimmung
  2. Tabellen-ID (`tableId`) Abgleich mit den Knoten
  3. Tabellennamen-Abgleich (`tableName` in PascalCase oder Designername)
  4. Spalten-/Feld-ID-Abgleich (`fieldId` oder `fieldName` in den Entitätsfeldern der Tabelle)
  5. Fallback auf den Root-Knoten-Alias
- Im `SELECT` werden alle Spalten nun immer mit `AS [Spaltenname]` exportiert, sodass die View-Spaltennamen exakt den C#-Properties und `[Column("...")]`-Attributen entsprechen.

### 2. `generateSqlSelect` mit `usePascalCaseTableNames` (`utils/sqlHelper.ts`)
- `generateSqlSelect` unterstützt das Flag `usePascalCaseTableNames: boolean`.
- Bei Aktivierung werden Root-Tabellennamen sowie alle `JOIN`-Tabellennamen konsistent in PascalCase umgewandelt (`toPascalCase(rawTableName)`), passend zur generierten Datenbankstruktur.

### 3. .NET Seed & View-Initialisierung (`utils/generators/dotnet/seed.ts`)
- In `DbInitializer.Initialize` wird `generateSqlSelect(..., true)` mit aktiviertem PascalCase-Flag aufgerufen.
- Die erzeugten Views (z. B. `CREATE VIEW IF NOT EXISTS [MeineAbfrage] AS SELECT [n2].[RechnungsNr] AS [RechnungsNr] ... FROM [Kunden] AS [n1] LEFT JOIN [Rechnungen] AS [n2] ON ...`) referenzieren exakt dieselben Tabellen und Aliase, die per EF Core und `DbInitializer` angelegt wurden.

### 4. Schema & Database Generator (`utils/generators/databaseGenerator.ts`)
- Auch in `databaseGenerator.ts` werden die Views im generierten `schema.sql` synchron mit den PascalCase-Tabellendefinitionen erzeugt.

### 5. EF Core Spaltenmapping für Query-Modelle (`utils/generators/dotnet/models.ts`)
- Alle sichtbaren Spalten (`c.show !== false`) in den generierten Query-Modellen (`Models/<QueryName>.cs`) erhalten explizit:
  - `[Column("<Spaltenname>")]` für sicheres EF Core View-Mapping (auch bei Sonderzeichen, Unterstrichen oder Aliasen).
  - `[JsonPropertyName("<Spaltenname>")]` für saubere REST API JSON-Serialisierung.

---

## API Endpoints für Abfragen (Queries)

| Methode | Route | Beschreibung |
| :--- | :--- | :--- |
| `GET` | `/api/queries/{queryName}` | Paginierte Abfrage des Views (`page`, `pageSize`, dynamic filters) |
| `GET` | `/api/queries/{queryName}?pageSize=1000` | Abruf aller Datensätze der Abfrage für Reports/Grids |



---

<a id="form-studio-api"></a>
# FORM STUDIO API

> **Originaldatei:** `docs/FORM_STUDIO_API.md`

# 📝 Formular-Studio & Subforms Enterprise API Documentation

Diese Dokumentation beschreibt die Schnittstellen, Datenstrukturen, IndexedDB-Sicherung und Event-Bus-Trigger des **Formular-Studios & Subforms (Enterprise-Level)**.

---

## 💾 1. IndexedDB Auto-Draft & Offline Persistence API
`features/forms/services/formDraftIndexedDB.ts`

Priorisierte lokale IndexedDB-Speicherung für Formularentwürfe, temporäre Änderungen und Unsaved-Changes Protection.

### Interfaces
```typescript
export interface FormDraft {
  id: string; // `${formId}_${recordId || 'new'}`
  formId: string;
  formName: string;
  recordId?: string | number;
  formData: Record<string, any>;
  lastSavedAt: number;
  isDirty: boolean;
}
```

### Methods
- `saveFormDraftToIndexedDB(formId, formName, formData, recordId?)`: Speichert/Aktualisiert den lokalen Entwurf in IndexedDB.
- `getFormDraftFromIndexedDB(formId, recordId?)`: Lädt den Entwurf eines Formulars.
- `clearFormDraftFromIndexedDB(formId, recordId?)`: Löscht den Entwurf nach erfolgreichem Speichern.
- `getAllFormDraftsFromIndexedDB()`: Ruft alle ausstehenden Formularentwürfe ab.

---

## 🧮 2. Rollup- & Berechnungs-Pipeline API
`features/forms/utils/formCalculationEngine.ts`

Bietet reaktive Berechnungen für mathematische Formeln und Subform-Aggregatfunktionen (`SUM`, `COUNT`, `AVG`, `MIN`, `MAX`).

### Syntax Beispiel
```javascript
// Berechnet die Gesamtsumme aller Positionen im Unterformular
evaluateFormFormula("SUM(positionen.NettoBetrag) * 1.19", record, { subforms });

// Datumsdifferenz in Tagen
evaluateFormFormula("DATEDIF([StartDatum], [EndDatum], 'D')", record);
```

---

## ⚡ 3. Bedingte Logik & No-Code Rule Engine API
`features/forms/components/ConditionRulesBuilderModal.tsx` & `features/forms/utils/formConditionEvaluator.ts`

Steuert dynamische Sichtbarkeit, Schreibschutz, Pflichtfeld-Status und kaskadierende Werte.

### Structure
```typescript
export interface ConditionalRule {
  id: string;
  name: string;
  matchType: 'AND' | 'OR';
  conditions: {
    fieldId: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'not_empty' | 'empty';
    value: string;
  }[];
  actions: {
    targetElementId: string;
    effect: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'optional';
  }[];
}
```

---

## 🛡️ 4. Feld-RBAC & Datenmaskierung API
`features/forms/components/FieldRbacModal.tsx`

Feingranulare Zugriffskontrolle auf Feldebene nach Benutzerrolle (`admin`, `manager`, `kalkulator`, `bauleiter`, `mitarbeiter`, `gast`) sowie automatische Maskierung vertraulicher Felder (`••••`).

---

## 📦 5. Multi-Framework Code Exporter API
`features/forms/utils/formCodeExporter.ts`

Generiert sauberen Quellcode für die Weiterverarbeitung in externen Anwendungen:
- **React**: React Hook Form + Zod + Tailwind CSS
- **Vue 3**: Vue 3 + VeeValidate + Zod + Tailwind CSS



---

<a id="reporting-print-engine-api"></a>
# REPORTING PRINT ENGINE API

> **Originaldatei:** `docs/REPORTING_PRINT_ENGINE_API.md`

# 🖨️ Pixel-Perfect Enterprise Berichts- & Druck-Engine API Documentation

Diese Dokumentation beschreibt die Datenstrukturen, Bänder-Modelle, Barcode-Generierung, Running-Totals-Engines, PDF/A-3 / ZUGFeRD E-Rechnungen und IndexedDB-Persistenz der **Pixel-Perfect Enterprise Reporting & Print Engine**.

---

## 💾 1. IndexedDB Persistence & Print Job Queue API
`features/reports/services/reportIndexedDBService.ts`

Verwaltet Berichts-Entwürfe, Layout-JSONs und Druckaufträge in der lokalen IndexedDB-Datenbank für Offline-Fähigkeit und performanten Zugriff.

### Data Models
```typescript
export interface ReportDraftRecord {
  id: string;
  reportId: string;
  title: string;
  layoutJson: string;
  lastModified: number;
  isPdfACompliant: boolean;
  zugferdEnabled: boolean;
}

export interface PrintJobRecord {
  id: string;
  reportTitle: string;
  printedAt: number;
  pageCount: number;
  status: 'QUEUED' | 'PRINTED' | 'FAILED' | 'EMAILED';
  recipientEmail?: string;
}
```

### Methods
- `saveReportDraftToIndexedDB(draft)`: Speichert Layouts und Entwürfe persistent in IndexedDB.
- `savePrintJobToIndexedDB(job)`: Dokumentiert Druck- und E-Mail-Aufträge.
- `getAllPrintJobsFromIndexedDB()`: Ruft die Historie aller Druckaufträge ab.

---

## 📐 2. Hochentwickeltes Bänder-Modell (Advanced Band Model API)
`features/reports/components/BandModelEditorModal.tsx`

Ermöglicht Millimeter-genaue Steuerung von verschachtelten n-stufigen Gruppen-Bändern, Seitenumbrüchen und Kopfzeilen-Wiederholungen.

```typescript
export interface ReportBand {
  id: string;
  name: string;
  type: 'REPORT_HEADER' | 'PAGE_HEADER' | 'GROUP_HEADER' | 'DETAIL' | 'GROUP_FOOTER' | 'PAGE_FOOTER' | 'REPORT_FOOTER';
  heightMm: number;
  keepTogether: boolean;
  repeatOnEveryPage: boolean;
  forcePageBreakBefore: boolean;
  forcePageBreakAfter: boolean;
}
```

---

## 🧮 3. Running Totals & Page Carried Forward Engine API
`features/reports/utils/runningTotalsEngine.ts`

Berechnet kaufmännische Überträge auf Folgeseiten (*„Übertrag auf nächste Seite“* / *„Übertrag von vorheriger Seite“*), kumulierte Gesamtsummen und prozentuale Anteile.

### Methods
- `calculateRunningTotals(items)`: Gibt Zwischensummen je Gruppe, Seitenüberträge je Seite und laufende Summen zurück.

---

## 🏷️ 4. Barcode & 2D Code Generator API
`features/reports/utils/barcodeGenerator.ts`

Native Vektor-Generierung (SVG) für Industrie- und Finanz-Barcodes.

### Supported Types
- `QR_CODE`: Standard 2D QR-Code.
- `GIRO_CODE`: EPC-QR-Code für SEPA-Überweisungen in der EU.
- `SWISS_QR`: Schweizer QR-Bill (mit Schweizerkreuz).
- `EAN13`: EAN-13 Barcode für Einzelhandel.
- `CODE128`: Code-128 Industriestandard.
- `DATAMATRIX`: 2D DataMatrix für Logistik.
- `PDF417`: PDF417 Stapelcode.

---

## 📑 5. E-Rechnungen (ZUGFeRD 2.2 / XRechnung), PDF/A-3 & E-Mail API
`features/reports/utils/zugferdGenerator.ts` & `features/reports/components/PdfExportWorkflowModal.tsx`

Generiert Cross-Industry Invoice (CII) XML gemäß EN 16931 für ZUGFeRD 2.2 / Factur-X / XRechnung und verwaltet den PDF/A-3 Revisionssicherheits-Export sowie direkten E-Mail-Versand.



---

<a id="self-host"></a>
# SELF HOST

> **Originaldatei:** `docs/SELF_HOST.md`

# Self-Hosting & Subfolder Deployment Guide (z.B. `https://www.firma.com/dbstudio/`)

Diese Anleitung erklärt Schritt für Schritt, wie DB Studio Pro für das Hosting unter einer eigenen Domain oder einem Unterordner (z.B. `https://www.firma.com/dbstudio/`) konfiguriert und gebaut wird.

---

## 1. Übersicht & Architektur

Wenn die Anwendung in einem Unterordner wie `/dbstudio/` gehostet wird, müssen zwei Hauptbereiche angepasst werden:
1. **Frontend Assets & Routing (`vite.config.ts`)**: Damit Scripts und Assets unter `/dbstudio/assets/...` geladen werden.
2. **API Endpoint Basis (`stores/useConfigStore.ts` & In-App Einstellungen)**: Damit API-Aufrufe an `https://www.firma.com/dbstudio/api/...` anstelle von `/api/...` geroutet werden.

---

## 2. Dateien & Konfigurationsschritte

### A. `vite.config.ts` (Vite Build-Konfiguration)

Legen Sie in `vite.config.ts` das Feld `base` fest, wenn Sie die Anwendung in einem Unterordner bereitstellen.

**Datei:** `vite.config.ts`
```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // Falls im Unterordner /dbstudio/ gehostet:
    base: '/dbstudio/',
    
    build: {
      outDir: 'dist',
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
```

---

### B. `stores/useConfigStore.ts` (Standard-Konfiguration im Code)

Falls Sie die Standardeinstellung für Neuinstallationen vorab festlegen möchten:

**Datei:** `stores/useConfigStore.ts`

```typescript
// 1. Initialer Zustand für Self-Host Betrieb:
const initialConfig: AppConfig = {
  mode: 'SELF_HOST', // Auf 'SELF_HOST' setzen
  storage: 'local',
  apiUrl: 'https://www.firma.com/dbstudio', // Oder 'http://localhost:5000' für lokalen Test
  isConfigured: true
};

// 2. Hilfskonstrukt für die Generierung aller API-Pfade:
export function getApiUrl(path: string): string {
  const config = useConfigStore.getState().config;
  let baseUrl = (config.apiUrl || '').trim();

  const cleanPath = path.startsWith('/') ? path : '/' + path;
  const envBase = ((import.meta as any).env?.BASE_URL || '/').replace(/\/$/, '');
  const relativeFallback = envBase ? `${envBase}${cleanPath}` : cleanPath;

  // Wenn nicht explizit SELF_HOST oder Standard-URL, benutze den relativen Fallback
  if ((config.mode as string) !== 'SELF_HOST' || !baseUrl || baseUrl === 'http://localhost:5000' || baseUrl === 'http://localhost:5000/') {
    return relativeFallback;
  }

  // Bei relativer baseUrl (z.B. '/dbstudio' oder '/dbstudio/api')
  if (baseUrl.startsWith('/')) {
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
      return `${cleanBase}${cleanPath.slice(4)}`;
    }
    return `${cleanBase}${cleanPath}`;
  }

  // Bei absoluter Domain-URL (z.B. 'https://www.firma.com/dbstudio')
  if (!/^https?:\/\//i.test(baseUrl)) {
    baseUrl = 'http://' + baseUrl;
  }

  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
    return `${cleanBase}${cleanPath.slice(4)}`;
  }

  return `${cleanBase}${cleanPath}`;
}
```

---

### C. Backend / Reverse Proxy (Nginx / Apache Beispiel)

Damit Aufrufe an `https://www.firma.com/dbstudio/api/` an das Backend weitergeleitet werden:

#### Nginx Konfigurationsbeispiel (`/etc/nginx/sites-available/default`)
```nginx
server {
    listen 80;
    server_name www.firma.com;

    # Static Frontend Assets
    location /dbstudio/ {
        alias /var/www/dbstudio/;
        try_files $uri $uri/ /dbstudio/index.html;
    }

    # API Proxy an das Node.js / Express Backend
    location /dbstudio/api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 3. Einstellungen in der Benutzeroberfläche (Admin-UI)

Admins können die API-URL auch direkt in den Werkzeug-Einstellungen der Anwendung anpassen:

1. Öffnen Sie die **Einstellungen** (Zahnrad-Icon).
2. Wählen Sie als Modus **Self-Host / Custom API**.
3. Tragen Sie als API-URL eine der folgenden Optionen ein:
   - **Absolut:** `https://www.firma.com/dbstudio`
   - **Relativ:** `/dbstudio`
4. Speichern Sie die Einstellungen.

---

## 4. Build ausführen

Nachdem die Anpassungen vorgenommen wurden, führen Sie den Build-Befehl aus:

```bash
npm run build
```

Das Ergebnis wird im Verzeichnis `dist/` abgelegt und kann auf den Webserver übertragen werden.



---

<a id="mobileandofflinearchitecture"></a>
# MobileAndOfflineArchitecture

> **Originaldatei:** `docs/MobileAndOfflineArchitecture.md`

# Mobile & Offline-First Architektur – Baustellen- & Bautagebuch-Blueprint
**System: Enterprise Bausoftware & Vor-Ort-Erfassung (Mobile & Offline-First)**  
*Status: Architektur-Spezifikation, Sync-Protokoll & Implementierungs-Checkliste*

---

## 📑 Inhaltsverzeichnis
1. [🟢 1. Herausforderungen auf der Baustelle (Funkloch & Robustheit)](#-1-herausforderungen-auf-der-baustelle-funkloch--robustheit)
2. [💾 2. Lokale Speicherung & IndexedDB Cache-Architektur](#-2-lokale-speicherung--indexeddb-cache-architektur)
3. [🔄 3. Bidirektionale Datensynchronisation & Konfliktlösung](#-3-bidirektionale-datensynchronisation--konfliktlösung)
4. [📱 4. Progressive Web App (PWA) & Service Worker Lifecycle](#-4-progressive-web-app-pwa--service-worker-lifecycle)
5. [📷 5. Foto-, Sprach- & Unterschriften-Erfassung vor Ort](#-5-foto--sprach---unterschriften-erfassung-vor-ort)
6. [📅 6. Priorisierte Umsetzungs-Checkliste & Roadmap](#-6-priorisierte-umsetzungs-checkliste--roadmap)

---

## 🟢 1. Herausforderungen auf der Baustelle (Funkloch & Robustheit)

Auf Baustellen ist die Netzabdeckung oft unvollständig (Kellergeschosse, Neubaugebiete, Tiefgaragen). Die Anwendung muss daher:
- **100% Offline-funktionsfähig** für Kernaufgaben sein (Bautagebuch schreiben, Mängel fotografieren, Zeiten buchen, Aufmaße erfassen).
- Alle Eingaben sofort lokal und unzerstörbar speichern.
- Automatisch synchronisieren, sobald wieder Netzempfang (WLAN/LTE) besteht.

---

## 💾 2. Lokale Speicherung & IndexedDB Cache-Architektur

- [x] **Dexie.js / IndexedDB Storage Engine**:
  - Lokale Replikation relevanter Tabellen: `local_daily_reports`, `local_defects`, `local_time_trackings`, `local_projects`.
- [x] **Outbox-Muster (Transaktions-Warteschlange)**:
  - Jede Schreibaktion wird als Mutation in `local_outbox_queue` geschrieben:
    ```typescript
    interface OutboxItem {
      id: string;
      table: string;
      operation: 'INSERT' | 'UPDATE' | 'DELETE';
      recordId: string;
      payload: any;
      createdAt: number;
      retryCount: number;
      status: 'PENDING' | 'SYNCING' | 'FAILED' | 'CONFLICT';
    }
    ```

---

## 🔄 3. Bidirektionale Datensynchronisation & Konfliktlösung

### 3.1 Synchronisations-Zyklus
- [x] **Automatischer Background-Sync**:
  - Erkennt Online-Status via `navigator.onLine` und `window.addEventListener('online', ...)`.
  - Batch-Versand aller anstehenden Einträge der Outbox an den Server (`POST /api/sync/push`).
  - Abruf neuer Server-Änderungen seit dem letzten Sync-Zeitstempel (`GET /api/sync/pull?since=...`).

### 3.2 Konfliktlösungs-Strategien
- [x] **Last-Write-Wins (LWW)** für einfache Felder (z. B. Notizen, Wetterdaten).
- [x] **Feld-Level Merge (Three-Way-Merge)**: Wenn Bauleiter A das Wetter und Bauleiter B die Kolonnenstärke bearbeitet, werden beide Änderungen zusammengeführt.
- [x] **Konflikt-Dashboard für Benutzer**: Visuelle Gegenüberstellung bei unauflösbaren Versionskollisionen (`ConflictResolutionModal`).

---

## 📱 4. Progressive Web App (PWA) & Service Worker Lifecycle

- [x] **Web App Manifest (`manifest.webmanifest`)**:
  - Installierbar als native App auf iOS, Android, Windows und macOS.
  - App-Icons, Start-URL, Standalone-Display-Modus.
- [x] **Workbox & Offline Cache**:
  - `CacheFirst` für statische Assets (HTML, JS, CSS, Schriftarten, Icons).
  - `NetworkFirst` / `StaleWhileRevalidate` für Schema-Definitionen.
- [x] **Offline-Indikator & Sync-Badge**:
  - Statusanzeige im Header: 🟢 Online (Synchronisiert) | 🟡 Offline (Funkloch-Modus) | 🔵 Synchronisiere...

---

## 📷 5. Foto-, Sprach- & Unterschriften-Erfassung vor Ort

- [x] **Client-Side Foto-Komprimierung**:
  - Direkte Skalierung von 12MP Smartphone-Fotos auf max. 1920x1080px JPEG/WebP direkt im Browser vor dem Speichern in IndexedDB (`photoCompressionUtil.ts`).
  - Verhindert das Volllaufen des Gerätespeichers.
- [x] **Foto-Annotationen & Plan-Verortung**:
  - Markierungen (Pfeile, Kreise, Text) direkt auf dem Baustellenfoto zeichnen.
  - Pin auf dem digitalen Bauplan platzieren (`LocationPlanPin`).
- [x] **Digitale Unterschrift (Signatur-Pad)**:
  - HTML5 Canvas Unterschrift für Tagesberichte und Stundenlohnzettel mit Zeitstempel und Vektorspeicherung.
- [x] **Sprach-zu-Text (Speech-to-Text)**:
  - Diktierfunktion für Bautagebuch-Notizen via Web Speech API (`speechToTextUtil.ts`).

---

## 📅 6. Priorisierte Umsetzungs-Checkliste & Roadmap

- [x] **Phase 1: IndexedDB Outbox Engine**:
  - [x] IndexedDB Schema-Definition für Bautagebuch und Mängel.
  - [x] Lokale Speicherung und Mutations-Warteschlange.
- [x] **Phase 2: Sync-Pipeline & Server-Endpunkte**:
  - [x] Push/Pull Sync-Handler mit Zeitstempel-Verwaltung.
  - [x] Online/Offline Event-Listener und Auto-Sync.
- [x] **Phase 3: PWA Manifest & App-Installation**:
  - [x] Service Worker Caching für unterbrechungsfreien Offline-Start.
- [x] **Phase 4: Baustellen-Features (Kamera, Kompression, Signatur)**:
  - [x] Foto-Upload mit Client-Kompression und Plan-Pinning.
  - [x] Digitales Unterschriften-Pad für Bauabnahmen.




---

