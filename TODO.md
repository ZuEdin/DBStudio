# 🚀 DB Studio Pro - ToDo List

Hier sind Vorschläge für zukünftige Features und Verbesserungen. Markiere die Dinge, die als Nächstes umgesetzt werden sollen!

## 📐 ER-Diagramm & Canvas
- [x] **Smarte Auto-Layouting Engine**: Einbettung eines Force-Directed-Algorithmus (z. B. d3-force oder dagre), um Tabellen automatisch übersichtlich anzuordnen. (Physik-basiert & Grid-Anordnung)
- [x] **Smarte Beziehungs-Overlays**: Erweiterte Tooltips und Highlighting für Primary/Foreign-Keys, wenn man über Beziehungs-Pfade hovert. (PK/FK-Hervorhebung & Midpoint-Overlay)
- [ ] **Minimap / Radar-View**: Eine kleine Übersichtskarte in der Ecke für sehr große, komplexe Schemata.

## 🔄 Schema Migration & Versionierung
- [x] **Visual Migration Diff-Tool**: Eine detaillierte Side-by-Side UI, um die Unterschiede zwischen Snapshots anzuzeigen und die generierten `ALTER TABLE` Skripte anzupassen. (Mit interaktivem SQL Live-Editor und Code-Highlights)
- [x] **Migration Rollback-Support**: UI zum Verwalten und Ausführen von Down-Skripten.
- [ ] **Datenbank-Synchronisation (Live)**: Direkte Verbindung zu einer Live-Datenbank herstellen, um Schemata abzugleichen (Introspection).

## 💻 Code Generierung & ORM
- [x] **Export-Vorschau (Live Preview)**: Eine Echtzeit-Vorschau des generierten Codes für ORMs (Sequelize, Prisma, TypeORM, Drizzle) direkt im Editor. (Vollständig integriert im Projekt Explorer)
- [ ] **CRUD API-Generierung**: Automatische Erstellung von REST- oder GraphQL-Endpoints (z. B. Express/NestJS Routen) für das entworfene Schema.
- [ ] **Frontend-Generierung (React/Vue)**: Automatisches Generieren von CRUD-Ansichten (Listen, Formulare) basierend auf dem Tabellen-Schema.

## 🧠 AI & Automatisierung
- [ ] **AI Schema Assistant**: Ein Chat-Interface, um per natürlicher Sprache (Prompt) komplexe Datenbank-Schemata entwerfen zu lassen.
- [ ] **AI Mock-Data Generator**: Automatische Generierung von realistischen Testdaten basierend auf den Datentypen und Spaltennamen.
- [ ] **Natural Language to SQL**: KI-Unterstützung im Query-Builder, um Fragen in SQL-Abfragen zu übersetzen.

## 👥 Tools & Collaboration
- [ ] **Echtzeit-Kollaboration (Multiplayer)**: Gemeinsames Arbeiten am gleichen Schema im Team (ähnlich wie in Figma oder Miro).
- [ ] **Projekt-Export zu GitHub**: Direkter Push der generierten App, ORM-Modelle und Migrationsskripte in ein verknüpftes GitHub-Repository.
- [ ] **Erweiterte Ticket-Integration**: Verknüpfung der Tickets im Kanban-Board mit spezifischen Tabellen oder Feldern im Schema.

## 🎨 UI & UX
- [x] **Dark Mode / Light Mode Toggle**: Ein nahtloser Wechsel zwischen verschiedenen Themes für die gesamte Applikation. (Durchgängige Dark-Mode-Integration)
- [ ] **Tastatur-Shortcuts (Hotkeys)**: Schnelleres Arbeiten durch Shortcuts (z. B. Tabellen duplizieren, Suchen & Ersetzen).
- [ ] **Custom Types & Domains**: Unterstützung für benutzerdefinierte Datentypen (z.B. Enums, UUIDs) quer durch die Datenbank-Dialekte.