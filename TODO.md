# 🚀 DB Studio Pro - ToDo & Architektur-Roadmap

Dieses Dokument beschreibt die Architektur und den Entwicklungsplan, um **DB Studio Pro** als eigenes, selbst-hostendes Backend ("Eating our own dog food") zu betreiben. Es teilt sich auf in lokale Offline-First-Ausführung und die kollaborative Team-Cloud.

---

## 🏗️ 1. Die Zwei-System-Architektur: Lokal vs. Team-Cloud

Für maximale Privatsphäre und reibungslose Teamarbeit trennen wir das System in zwei sauber getrennte Modi:

```
┌────────────────────────────────────────┐
│             DB Studio Pro              │
│       (Local Desktop / Developer)      │
│   - SQLite / IndexedDB für Metadaten   │
│   - Lokale Datenbank-Verbindungen      │
└───────────────────┬────────────────────┘
                    │
                    │  🔒 Sicherer Upload (Sync Wizard)
                    │  - Schema-Auswahl (Tabellen, Queries)
                    │  - Anforderungs-Abfrage (Was soll wohin?)
                    │  - Schema Migrationserstellung
                    ▼
┌────────────────────────────────────────┐
│             Team-Cloud Hub             │
│      (Kollaborativ / Hosted Server)     │
│   - PostgreSQL / Spanner (Multi-Tenant)│
│   - Live Echtzeit-Kollaboration        │
│   - Team-Chat, Kanban & Tickets        │
└────────────────────────────────────────┘
```

### 💻 A. Lokal (Rechner des Entwicklers)
*   **Datenspeicherung:** Alle Metadaten, Entwürfe und Schema-Designs werden lokal in einer **SQLite-Datei** (via Electron/Tauri) oder in der **IndexedDB** des Browsers gespeichert.
*   **Netzwerk:** Läuft komplett offline. Keine Daten verlassen die lokale Maschine ohne explizite Aktion.
*   **Sicherheit:** Lokale Passwörter und Connection-Strings werden verschlüsselt gespeichert (z.B. OS Keychain).

### ☁️ B. Team-Cloud (Kollaboration & Hosting)
*   **Datenspeicherung:** Ein hochverfügbares, mandantenfähiges (**Multi-Tenant**) Relationales Datenbanksystem (PostgreSQL/Spanner).
*   **Echtzeit:** WebSocket-gestützte Synchronisation für simultanes Bearbeiten des ER-Diagramms ("Figma-Style").
*   **Kollaborations-Features:** Integriertes Kanban-Board, Team-Chat, Änderungsverlauf und Rollen-Management (RBAC).

---

## 🗄️ 2. DB Studio Metadaten-Schema (Self-Hosting)

Um DB Studio mit sich selbst zu verwalten, nutzen wir dieses standardisierte relationale Schema für die Metadaten. Jedes Projekt baut genau auf dieser Struktur auf:

### `sys_projects` (Projekte)
*   `id` (UUID, PK) - Eindeutige ID des Projekts
*   `name` (VARCHAR) - Name des Projekts (z. B. "Kundenportal")
*   `db_type` (VARCHAR) - Verwendeter Dialekt (PostgreSQL, MySQL, SQLite etc.)
*   `is_cloud` (BOOLEAN) - Ob das Projekt in der Team-Cloud liegt
*   `created_at` (TIMESTAMP)

### `sys_tables` (Tabellen-Metadaten)
*   `id` (UUID, PK)
*   `project_id` (UUID, FK -> `sys_projects.id` ON DELETE CASCADE)
*   `name` (VARCHAR) - Tabellenname
*   `description` (TEXT) - Zweck der Tabelle

### `sys_fields` (Tabellenspalten-Metadaten)
*   `id` (UUID, PK)
*   `table_id` (UUID, FK -> `sys_tables.id` ON DELETE CASCADE)
*   `name` (VARCHAR) - Spaltenname
*   `type` (VARCHAR) - Datentyp (INTEGER, VARCHAR, UUID etc.)
*   `is_primary_key` (BOOLEAN)
*   `is_nullable` (BOOLEAN)
*   `default_value` (VARCHAR)

### `sys_relationships` (Beziehungen)
*   `id` (UUID, PK)
*   `project_id` (UUID, FK)
*   `from_table_id` (UUID, FK -> `sys_tables.id`)
*   `from_field_id` (UUID, FK -> `sys_fields.id`)
*   `to_table_id` (UUID, FK -> `sys_tables.id`)
*   `to_field_id` (UUID, FK -> `sys_fields.id`)
*   `type` (VARCHAR) - "1:n", "1:1", "n:m"

### `sys_queries` (Gespeicherte Abfragen)
*   `id` (UUID, PK)
*   `project_id` (UUID, FK)
*   `name` (VARCHAR) - Name der Abfrage
*   `raw_sql` (TEXT) - Generiertes oder geschriebenes SQL

### `sys_sync_history` (Uploader- & Synchronisierungslog)
*   `id` (UUID, PK)
*   `project_id` (UUID, FK)
*   `user_id` (VARCHAR) - Wer hat synchronisiert
*   `sync_type` (VARCHAR) - "LOCAL_TO_CLOUD" / "CLOUD_TO_LOCAL"
*   `metadata_payload` (JSON) - Detaillierte Liste der übertragenen Tabellen/Queries
*   `implementation_prompt` (TEXT) - "Was soll implementiert werden?" Prompt für KI-Zwecke

---

## 🔄 3. Der Lokale-zu-Cloud Synchronisations-Workflow

Wenn ein Benutzer Daten aus seiner lokalen Entwicklungsumgebung in die Team-Cloud hochlädt, wird er durch einen interaktiven **Sync-Assistenten** geführt:

1.  **Verbindungstest:** Prüfung der Verbindung zur Team-Cloud.
2.  **Objekt-Auswahl:** Der Benutzer wählt detailliert aus:
    *   Welche **Tabellen** sollen hochgeladen werden?
    *   Welche **Abfragen** und Geschäftslogiken sollen hochgeladen werden?
3.  **Implementierungs-Fragebogen (AI-gestützt):**
    *   *Frage:* "Welches primäre Ziel hat dieser Upload?"
    *   *Frage:* "Sollen für die ausgewählten Tabellen direkt CRUD-Endpoints im Team-Server registriert werden?"
    *   *Frage:* "Welche Rollen (z.B. Admin, User) haben Lese-/Schreibzugriff auf die hochgeladenen Daten?"
4.  **Diff-Analyse:** Side-by-Side-Gegenüberstellung (Lokaler Stand vs. Cloud-Stand).
5.  **Schema-Migration:** Automatische Generierung von SQL-Migrations-Skripten, um das Cloud-Schema anzupassen, ohne Daten zu löschen.
6.  **Push:** Übertragung und Freigabe für das Team.

---

## 📋 4. Implementierungs-Checkliste (Fahrplan)

### Phase 1: Lokaler State & IndexedDB Sync (Local Mode)
- [x] SQLite-Verbindungstreiber für Electron/Tauri konfigurieren.
- [x] IndexedDB Wrapper für Browser-Fallback schreiben (Projekt-Auto-Save).
- [x] Styling-Frameworks (Bootstrap/Tailwind) sauber trennen und im Code-Generator unterstützen.

### Phase 2: Team-Cloud Backend & API-Infrastruktur
- [x] Express/NestJS Server-Vorlage für den Cloud Hub erstellen.
- [x] Multi-Tenant Isolation auf Datenbankebene (RLS - Row Level Security) implementieren.
- [x] JWT und OAuth2 (z. B. GitHub, Google) für Team-Logins bereitstellen.

### Phase 3: Der Interaktive Sync-Assistent (Local -> Cloud)
- [x] Eine UI-Komponente erstellen, die lokale Schema-Änderungen anzeigt.
- [x] Fragebogen-Schnittstelle implementieren ("Was soll implementiert werden?").
- [x] Validierung von FK-Beziehungen vor dem Upload, um referenzielle Integrität zu sichern.
- [x] Mock-Verbindung für Demonstrationszwecke einbauen.

### Phase 4: Team-Kollaborations-Werkzeuge (Multiplayer)
- [x] Multiplayer Cursor-Simulation für Live-Sitzungen.
- [x] Integriertes Kanban-Ticketsystem zur Aufgabensteuerung direkt an Datenfeldern.
- [x] Echtzeit-Team-Chat-Panel mit Benachrichtigungsdienst für Schema-Änderungen.
- [x] Versionsverwaltung (Git-ähnlicher Commit-Verlauf für Schemata).
