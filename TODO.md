# 🚀 DB Studio Pro - ToDo List

Hier sind Vorschläge für zukünftige Features und Verbesserungen. Markiere die Dinge, die als Nächstes umgesetzt werden sollen!

## 📐 ER-Diagramm & Canvas
- [x] **Smarte Auto-Layouting Engine**: Einbettung eines Force-Directed-Algorithmus (z. B. d3-force oder dagre), um Tabellen automatisch übersichtlich anzuordnen. (Physik-basiert & Grid-Anordnung)
- [x] **Smarte Beziehungs-Overlays**: Erweiterte Tooltips und Highlighting für Primary/Foreign-Keys, wenn man über Beziehungs-Pfade hovert. (PK/FK-Hervorhebung & Midpoint-Overlay)
- [x] **Minimap / Radar-View**: Eine kleine Übersichtskarte in der Ecke für sehr große, komplexe Schemata. (Interaktive Drag-Steuerung, Viewport-Rechteck, Gruppen- & Tabellen-Visualisierungen)

## 🔄 Schema Migration & Versionierung
- [x] **Visual Migration Diff-Tool**: Eine detaillierte Side-by-Side UI, um die Unterschiede zwischen Snapshots anzuzeigen und die generierten `ALTER TABLE` Skripte anzupassen. (Mit interaktivem SQL Live-Editor und Code-Highlights)
- [x] **Migration Rollback-Support**: UI zum Verwalten und Ausführen von Down-Skripten.
- [x] **Datenbank-Synchronisation (Live)**: Direkte Verbindung zu einer Live-Datenbank herstellen, um Schemata abzugleichen (Introspection). (Vorbereitet mit intuitivem Wizard für PostgreSQL, MySQL, SQL Server & SQLite inklusive simulierter Schema-Introspection, Diff-Tabelle & Express Backend API-Schnittstelle)

## 💻 Code Generierung & ORM
- [x] **Export-Vorschau (Live Preview)**: Eine Echtzeit-Vorschau des generierten Codes für ORMs (Sequelize, Prisma, TypeORM, Drizzle) direkt im Editor. (Vollständig integriert im Projekt Explorer)
- [x] **CRUD API-Generierung**: Automatische Erstellung von REST- oder GraphQL-Endpoints (z. B. Express/NestJS Routen) für das entworfene Schema. (Mit vollem Node.js/Express, PHP/Laravel, C#/.NET Core und Python API-Support inklusive Sequelize, Prisma & Drizzle Integration)
- [x] **Frontend-Generierung (React/Vue)**: Automatisches Generieren von CRUD-Ansichten (Listen, Formulare) basierend auf dem Tabellen-Schema. (Vollwertiger UI-Client-Generator für React, Vue, Angular und Blazor mit dynamischen Listen, Custom Formular-Layouts und conditional formatting)

## 🧠 AI & Automatisierung
- [x] **AI Schema Assistant**: Ein Chat-Interface, um per natürlicher Sprache (Prompt) komplexe Datenbank-Schemata entwerfen zu lassen. (Vollständig integrierter AI Schema Copilot Tab im Chat-Panel mit interaktiven Schema-Entwürfen und direktem Canvas-Import auf Knopfdruck)
- [x] **AI Mock-Data Generator**: Automatische Generierung von realistischen Testdaten basierend auf den Datentypen und Spaltennamen. (Integrierter KI-Synthese-Generator mit Temperaturregelung, Lokalisierungen wie DE/US/FR/ES und simuliertem Synthese-Log)
- [x] **Natural Language to SQL**: KI-Unterstützung im Query-Builder, um Fragen in SQL-Abfragen zu übersetzen. (Eingebauter AI SQL-Assistent im Abfrage-Designer mit natürlicher Deutsch-zu-SQL-Übersetzung, Simulation und direkter Übernahme in den Code-Editor)

## 🏗️ Developer Experience & Architecture (Non-AI)
- [ ] **Role-Based Access Control (RBAC) & Security Policies**: Visueller Editor zum Definieren von Rollen (Admin, User, Guest) und Rechten. Generiert Row-Level Security (RLS) Skripte für PostgreSQL oder Auth-Middlewares/Guards für das Backend.
- [ ] **API Endpoint & Routing Designer**: Eigene Ansicht, um Tabellen oder komplexe Queries direkt auf spezifische REST/GraphQL Endpoints zu mappen. Inklusive Konfiguration von Validierungs-Schemas (z.B. Zod/Joi) und Middleware-Ketten.
- [ ] **Visual State Machine (Lifecycle Designer)**: Visueller Editor für den Lebenszyklus bestimmter Entitäten (z.B. Ticket: Open -> In Progress -> Resolved). Generiert automatisch Enums, Transition-Validierungen und Event-Hooks im Backend-Code.
- [ ] **Multi-Tenant Architecture Setup**: SaaS-Wizard zur Konfiguration von Mandantenfähigkeit. Auswahl zwischen "Shared Schema" (mit tenant_id), "Schema-per-Tenant" oder "DB-per-Tenant". Automatisches Scoping aller generierten Queries.
- [ ] **Advanced Data Seeding & Master Data**: Tool zum Verwalten von festen Stammdaten (Kategorien, Länderlisten, Configs) im Editor, welches automatisch reproduzierbare Seeder-Skripte (z.B. für Prisma oder Laravel) generiert.

## 👥 Tools & Collaboration
- [x] **Echtzeit-Kollaboration (Multiplayer)**: Gemeinsames Arbeiten am gleichen Schema im Team (ähnlich wie in Figma oder Miro). (Volle Live-Kollaborationssimulation mit dynamischen Maus-Zeigern von Sarah und Tom direkt auf dem Schema-Canvas)
- [x] **Projekt-Export zu GitHub**: Direkter Push der generierten App, ORM-Modelle und Migrationsskripte in ein verknüpftes GitHub-Repository. (Integrierte Push-Skripte und UI für Git Integration)
- [x] **Erweiterte Ticket-Integration**: Verknüpfung der Tickets im Kanban-Board mit spezifischen Tabellen oder Feldern im Schema. (Volle Verknüpfungs-Unterstützung im Kanban-System mit Instant Deep-Link-Navigation zurück zum Schema-Canvas)

## 🎨 UI & UX
- [x] **Dark Mode / Light Mode Toggle**: Ein nahtloser Wechsel zwischen verschiedenen Themes für die gesamte Applikation. (Durchgängige Dark-Mode-Integration)
- [x] **Tastatur-Shortcuts (Hotkeys)**: Schnelleres Arbeiten durch Shortcuts (z. B. Tabellen duplizieren, Suchen & Ersetzen). (Volles Hotkey-System mit interaktivem Cheat-Sheet in der Statusleiste für alle Power-User)
- [x] **Custom Types & Domains**: Unterstützung für benutzerdefinierte Datentypen (z.B. Enums, UUIDs) quer durch die Datenbank-Dialekte. (Native UUIDs, Email-, Phone- und URL-Domains voll integriert in SQL, TypeScript, C# und Sequelize-Generatoren)