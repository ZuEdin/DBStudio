# DB Studio Pro – Master Roadmap & Entwicklungs-TODO (100% Gold Master)

> **Aktueller Gesamtreifegrad:** 100%  
> **Ziel:** 100% Enterprise Gold Master Status  
> **Fokus:** Höchste Zuverlässigkeit, DACH-Konformität, Multi-DB-Architektur & Desktop-Betrieb

---

## 📊 Modul-Status & Reifegrad-Matrix

| Nr. | Modul / Bereich | Ist-Status | Ziel | Priorität |
|:---:|:---|:---:|:---:|:---:|
| 1 | **Local Bridge Daemon & Desktop Suite** | 100% | 100% | 🟢 Abgeschlossen |
| 2 | **Visuelle Workflow- & Automatisierungs-Engine (BPMN)** | 100% | 100% | 🟢 Abgeschlossen |
| 3 | **Offline-Sync & Outbox-Pattern** | 100% | 100% | 🟢 Abgeschlossen |
| 4 | **Berichts- & Druck-Engine (Banded Reports)** | 100% | 100% | 🟢 Abgeschlossen |
| 5 | **GAEB DA XML & DATANORM 5.0** | 100% | 100% | 🟢 Abgeschlossen |
| 6 | **ZUGFeRD 2.2 & E-Rechnungen (EN 16931)** | 100% | 100% | 🟢 Abgeschlossen |
| 7 | **Visueller QBE SQL Abfrage-Designer** | 100% | 100% | 🟢 Abgeschlossen |
| 8 | **Code-Generierungs-Engine & Desktop-Build** | 100% | 100% | 🟢 Abgeschlossen |
| 9 | **Formular-Studio & Subforms** | 100% | 100% | 🟢 Abgeschlossen |
| 10 | **In-Browser Tabellen- & Schema-Designer** | 100% | 100% | 🟢 Abgeschlossen |

---

## 🛠️ Detaillierte Aufgabenliste nach Modulen

### 1. 🔌 Local Bridge Daemon & Desktop Suite (100% ✅ Abgeschlossen)
- [x] **Auto-Reconnect & Heartbeat:**
  - WebSocket-Verbindung mit exponentiellem Backoff bei Verbindungsunterbrechung (1s, 2s, 4s, 8s, max 15s).
  - Automatisches Health-Check Ping/Pong alle 5 Sekunden mit visueller Latenzanzeige (ms) und Verbindungsampel im UI.
- [x] **MDB / ACCDB File-Locking Schutz:**
  - Erkennung von `.ldb` / `.laccdb` Sperrdateien bei paralleler Nutzung von MS Access.
  - Saubere Dialogmeldung statt unkontrolliertem Prozessabbruch bei Lese-/Schreibkonflikten mit Ausweichoption.
- [x] **Direct-Query Passthrough & Desktop-Aufarbeitung:**
  - Aufarbeitung der `bridge-app` (Tauri Suite, OLEDB/ACE-Transpilation, SQL-Dumps, SQLite-Sync).
  - Sicheres Escaping von Access-spezifischen Schlüsselwörtern und Streaming-Transpilation.

---

### 2. ⚡ Workflow- & Automatisierungs-Engine (100% ✅ Abgeschlossen)
- [x] **Ausführungs-Historie & Run-Logs:**
  - Persistentes Protokollieren aller Flow-Ausführungen mit Zeitstempeln, Dauer und Status (Success / Failed).
  - Detailansicht für jeden Knoten mit Input- und Output-Payloads zur Fehleranalyse.
  - JSON-Export aller Logs und Filter nach Status.
- [x] **Zeitgesteuerte Cron-Trigger:**
  - Implementierung von Cron-Intervallen (z. B. nächtlicher Datenabgleich, automatischer Rechnungs-Export am 1. des Monats).
  - Übersicht aller anstehenden geplanten Aufgaben im Scheduler-Tab mit Berechnung des nächsten Ausführungszeitpunkts.
  - Direkte manuelle Trigger-Ausführung mit Live-Persistierung im Store.
- [x] **Visueller Step-by-Step Debugger:**
  - Breakpoints auf Flow-Knoten per Klick oder Eigenschafts-Panel setzen.
  - Einzelschritt-Ausführung (Step Over) mit Live-Inspektion und Live-Modifikation der Variablen-Zustände im Editor.
  - Pause/Resume-Steuerung mit optischer Highlighting-Anzeige auf der Canvas-Arbeitsfläche.

---

### 3. 🔄 Offline-Sync & Outbox-Pattern (100% ✅ Abgeschlossen)
- [x] **Background Sync API Integration:**
  - Automatisches Leeren der IndexedDB-Outbox via Service Worker bei wiederkehrender Netzwerkverbindung.
- [x] **Payload-Kompression:**
  - Brotli/Gzip-Kompression für Offline-Pakete (z. B. Baustellenfotos, PDF-Dokumente) vor der Übertragung.
- [x] **CRDT-Konfliktbereinigung auf Feldebene:**
  - Automatisches Mergen geänderter Datensätze ohne Benutzerdialog, wenn unterschiedliche Spalten modifiziert wurden.

---

### 4. 🖨️ Berichts- & Druck-Engine (100% ✅ Abgeschlossen)
- [x] **Mehrseitige Gruppen-Umbruchsregeln:**
  - Striktes „Zusammenhalten“ (*KeepTogether*) von Tabellenzeilen, Unterberichten und Gruppenabschlüssen über Seitenränder hinweg.
  - Konfigurierbares „Auf neuer Seite beginnen“ für Hauptkategorien und Kostenstellen.
- [x] **ESC/POS Thermo-Bondrucker Integration:**
  - Natives Senden von Raw-ESC/POS-Steuerzeichen an 58mm und 80mm Thermo-Drucker (USB, Web Serial, Bluetooth & Netzwerk).
- [x] **Vektorgrafik-Einbettung (SVG) in PDF/A:**
  - Skalierbare Firmenlogos und Vektorsignaturen ohne Raster-Verluste direkt im PDF/A-3b Dokument einbetten.

---

### 5. 🏗️ GAEB DA XML & DATANORM (100% ✅ Abgeschlossen)
- [x] **Strukturierter GAEB XML 3.3 Re-Export:**
  - Erzeugung valider GAEB XML-Dateien für Phase **X83** (Angebotsaufforderung) und **X84** (Angebotsabgabe).
  - Schema-Validierung gegen offizielle GAEB DA XML 3.3 XSD-Schemata.
- [x] **DATANORM 5.0 Rabattstaffel-Matrix:**
  - Automatische Verrechnung von 10-stufigen Warengruppen-Rabatten und Teuerungszuschlägen in der Positionskalkulation.

---

### 6. 💼 ZUGFeRD 2.2 & E-Rechnungen (100% ✅ Abgeschlossen)
- [x] **Erweiterte EN 16931 Validierungsregeln:**
  - Ergänzung branchenspezifischer Schematron-Regeln für Bauleistungen (z. B. §13b UStG Steuerschuldnerschaft des Leistungsempfängers).
  - Automatische Überprüfung der Leitweg-ID für B2G-Portale (ZRE / OZG-RE).

---

### 7. 🖥️ DevOps, Desktop-Build & Code-Generierung (100% ✅ Abgeschlossen)
- [x] **1-Klick Tauri 2.0 / Electron Package:**
  - Generierung sofort ausführbarer Windows `.exe` / `.msi` Installer und macOS `.dmg` Bundles ohne Terminal-Befehle (`DesktopPackageModal.tsx` & Generator).
- [x] **Erweiterte C# .NET 10 & Entity Framework Core Generierung:**
  - Automatische Erstellung von Migrations-Klassen (`DbContext`, Fluent API Mappings, FluentValidation und Seed-Dateien).

---

### 8. 📝 Formular-Studio & Tabellen-Designer (100% ✅ Abgeschlossen)
- [x] **Echtzeit-Regex-Validierungsregeln:**
  - Benutzerdefinierte Validierungsausdrücke für Eingabefelder mit sofortigem Inline-Feedback im Formular.
- [x] **Automatische Normalisierungs-Empfehlungen (3NF):**
  - Assistent erkennt redundante Datenfelder und schlägt automatische Tabellen-Splits mit 1:n-Fremdschlüsseln vor.

---

## 🚀 9. Agency & Headless CMS Multi-Generator Suite (Geplante Erweiterung)

> **Fokus:** Enterprise-Agentur-Fähigkeit, Headless-CMS Anbindung, schlüsselfertige Admin-Panels & White-Label Dokumentation für Kundenübergaben.

### 9.1. 🏛️ Headless CMS & WordPress Full-Stack Generatoren
- [x] **Strapi v5 & Directus Schema Engine:**
  - 1-Klick Export von Tabellenschemata in native Strapi v5 `schema.json` Content-Types und Directus API Collections.
  - Generierung von Relationen, Validierungsregeln und RBAC-Rollenberechtigungen.
- [x] **WordPress & ACF Pro (Advanced Custom Fields) Suite:**
  - Generierung von `acf-json` Feldgruppen-Definitionen für nahtlosen Import in WordPress.
  - Automatisches Scaffolding von Custom Gutenberg-Blöcken (React + PHP Server-Side Rendering) für Tabellen und Erfassungsformulare.
  - CPT (Custom Post Type) Registrierung mit REST-API-fähigen Endpunkten.
- [x] **Nextcloud OCP App & Ecosystem:**
  - Weiterer Ausbau des OCP REST API Generators für Nextcloud 28-30 Apps (`apps/` Verzeichnis Archiv).

### 9.2. 🎛️ Modern Admin-Panel & Dashboard Frameworks
- [x] **Laravel Filament v3 Resource Generator:**
  - Generierung fertiger Filament v3 `Resource`-, `Pages`- und `Form`-Klassen inkl. Tabellen-Filtern, Bulk-Actions und Formular-Validierungen.
- [x] **Next.js 15 & Refine Admin-Panel Boilerplate:**
  - Generierung von Next.js App-Router Dashboards mit Server Actions, TanStack Table v8, Zod-Validierung und Tailwind CSS.
- [x] **Supabase & PocketBase Bootstrap:**
  - Erstellung von Supabase SQL Migrationen inkl. Row-Level Security (RLS) Policies und typisierten TypeScript-Clients.

### 9.3. 💼 Agentur-Kollaboration & Kunden-Übergabe Tools
- [x] **White-Label Kunden-Dokumentation (PDF & Interaktives HTML):**
  - Automatisch generiertes, CI-konformes Datenmodell-Handbuch mit interaktivem ER-Diagramm, Datenlexikon und API-Endpoints für den Endkunden.
- [x] **Kunden-Abnahme-Modus (Client Read-Only Preview):**
  - Sicherer Präsentationsmodus für Agenturkunden zur Vorab-Freigabe und Kommentierung des Datenmodells.
- [x] **OpenAPI 3.1 & Postman Collection Exporter:**
  - Schlüsselfertige `swagger.json` und Postman Collection mit parametrisierten Mock-Requests für externe Agentur-Teams.
- [x] **Intelligenter CSV/Excel-Migration Wizard:**
  - Automatische Erkennung und Normalisierung unstrukturierter Kunden-Tabellen (Split von Adressen/Namen, Dublettenprüfung).

---

## 📐 Menüband-Reorganisation: „Bereitstellung & Generatoren“

Um das Menüband übersichtlich, aufgeräumt und auch bei vielen Generatoren skalierbar zu halten, wird die Registerkarte **„Bereitstellung & Generator“** in logische Dropdown-Zentren gegliedert:

1. **Gruppe 1: Ziel-Konfiguration & Live-Status**
   - Aktive Konfiguration (Stack-Übersicht: DB, API, Frontend, Port) & Bridge-Status.
2. **Gruppe 2: CMS & Ecosystems (Dropdown-Hub)**
   - 📦 **WordPress Suite**: Plugin Generator, ACF Pro JSON, Gutenberg Blöcke, Shortcodes
   - ☁️ **Nextcloud Suite**: OCP App Generator, REST Controller, App ZIP
   - 🚀 **Headless CMS Hub**: Strapi v5 Schemas, Directus Collections, Supabase
3. **Gruppe 3: Admin & Dashboard-Frameworks (Dropdown-Hub)**
   - 🐘 **Laravel Filament v3**: Resource & Table Generator
   - ⚛️ **Next.js 15 & Refine**: Modern Dashboard Boilerplate
4. **Gruppe 4: Cloud, DevOps & API (Dropdown-Hub)**
   - 🐳 **Docker & CI/CD**: Docker Compose, GitHub/GitLab Actions
   - 🌐 **API & Mocking**: OpenAPI 3.1, Postman Collections, Live Mock Server
   - ⚡ **Automatisierung**: n8n / Zapier Workflow Bridge, Webhook Ingestion Hub
5. **Gruppe 5: Export & Desktop-Build (Dropdown-Hub)**
   - 💻 **Desktop Wrapper**: Tauri 2.0 / Electron (.msi, .exe, .dmg)
   - ⚙️ **Backend & EF Core**: .NET 10 EF Core, Node.js, Python FastAPI, PHP
   - 📦 **Projekt ZIP**: Komplettes Projektpaket exportieren
