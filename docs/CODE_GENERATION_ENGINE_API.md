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
