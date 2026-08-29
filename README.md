# 🚀 DB Studio PRO & Local Bridge

**Von der alten Access-Datenbank zur modernen Multi-Stack-App in Rekordzeit.**  
DB Studio PRO ist eine modulare Rapid Application Development (RAD) Plattform, die es ermöglicht, datenbankgestützte Anwendungen und Enterprise-Architekturen visuell zu entwerfen, zu migrieren und als sauberen Quellcode zu exportieren – komplett ohne Vendor Lock-in und mit 100 % Datenhoheit.

---

## 📖 Projekt-Status & Philosophie

* **Version:** DB Studio Pro v0.8.5 Beta • Local Bridge v0.9.2 Beta
* **Status:** Vor-1.0 Entwicklungsphase (Pre-1.0) • *Be Honest*-Methode
* **Entwickler:** Edin Zubovic (Solo-Entwickler, über 14 Monate kontinuierliche Entwicklungsarbeit)
* **Architektur:** 100% Local-First Web-Suite (React / TypeScript / Tailwind CSS / Zustand) + Nativer Windows Host-Daemon (Node.js / C# OLEDB / WebSocket)

### 📌 Die „Be Honest“-Methode
Softwareentwicklung ist ein stetiger Prozess der Evolution. DB Studio Pro verfolgt einen transparenten, ehrlichen Ansatz:
* **Stabil & Zuverlässig:** Das relationale Schema-Design, Formulare mit N-Ebenen Subforms, der visuelle No-Code Query-Builder (QBE-Grid), Code-Generatoren für .NET 10 / Node.js / PHP / React sowie der native Windows-Daemon (Local Bridge) zur MS-Access-Transpilierung sind voll einsatzfähig.
* **Kontinuierliche Optimierung:** Im täglichen Praxiseinsatz werden Randfälle und Treiberbesonderheiten (wie z. B. spezielle OLEDB-Datentypen in alten Access-MDBs) offen dokumentiert und schrittweise behoben.
* **Kein Vendor Lock-in:** Alle generierten Quellcodes gehören zu 100% dem Entwickler und lassen sich vollständig außerhalb von DB Studio kompilieren und deployen. Keine Lizenzkosten.

---

## 🎯 Zielgruppen & Anwendungsfälle

### 💡 Für Fachabteilungen, IT-Admins & Projektmanager
Machen Sie sich unabhängig von langen IT-Warteschlangen und digitalisieren Sie Ihre Geschäftsprozesse selbst:
* **Smart Legacy-Migration:** Überführen Sie alte MS Access-Datenbanken (`.accdb` / `.mdb`), Excel-Tabellen oder SharePoint-Listen durch intelligente Import-Wizards automatisch in moderne, relationale Strukturen.
* **Visuelles Design:** Datenbanken (ER-Diagramme), UIs und Anwendungslogik einfach per Drag & Drop erstellen.
* **Visuelle Workflows:** Automatisieren Sie Geschäftsprozesse, Datenvalidierungen und Benachrichtigungen – ohne Programmierkenntnisse.
* **Reports & Dashboards:** Generieren Sie mit dem Report-Wizard auf Knopfdruck interaktive Auswertungen und druckreife PDF-Berichte.
* **Team Collaboration:** Arbeiten Sie in Echtzeit am selben Projekt (Live-Cursor, Chat, Kanban-Board).

### ⚙️ Für Software-Entwickler, Architekten & Agenturen
DB Studio PRO ist kein geschlossener Baukasten, sondern ein mächtiger Multi-Stack-Codegenerator, der Boilerplate eliminiert:
* **Multi-Stack Export-Engine:** Generieren Sie produktionsreifen Quellcode für:
  * **Frontend:** React (Vite / Tailwind), Angular, Vue, HTML/CSS
  * **Backend:** Node.js (Express / TypeScript), C# ASP.NET Core (.NET 10), Python (FastAPI), PHP 8.x (PDO / Laravel)
  * **Desktop & Mobile:** Electron, Tauri, .NET MAUI
  * **ORMs & DDL:** Drizzle, Prisma, TypeORM, ANSI SQL, PostgreSQL, MySQL, SQLite, MS SQL
* **Enterprise Security & Multi-Tenancy:** Out-of-the-Box Unterstützung für mandantenfähige Architekturen, feingranulare Rollenverwaltung (RBAC) und Active Directory (AD) Integration.
* **API-First:** Generieren Sie REST- oder GraphQL-APIs automatisch aus Ihrem relationalen Schema.
* **CI/CD & DevOps-Ready:** Automatisch erstellte Dockerfiles, `docker-compose.yml`, Infrastructure-as-Code und GitHub / GitLab Actions.
* **Grenzenlose Erweiterbarkeit:** Überschreiben Sie generierten Code, binden Sie eigene SQL-Skripte ein und integrieren Sie externe REST-APIs nativ.

---

## 🛠️ Das Kern-Arsenal (Plattform-Module)

| Modul | Version | Reifegrad | Status | Beschreibung |
| :--- | :--- | :--- | :--- | :--- |
| **1. In-Browser Designer & UI** | v0.8.5 | **~85%** | Funktional | Visueller ER-Canvas, Schema-Designer, Drag-&-Drop Formular-Studio (1–4 Spalten & Subforms), QBE SQL-Designer, Berichts-Druckengine, Workflow-Studio & `.dbsp` Projekt-Engine. |
| **2. Code-Generierung** | v0.8.5 | **~80%** | Standard-Exporte aktiv | C# ASP.NET Core (.NET 10), Node.js Express, PHP 8.x PDO, React, Angular, SQL DDL. Deterministic AST- und String-Templating. |
| **3. DB Studio Local Bridge** | v0.9.2 | **~75%** | Beta-Betriebsbereit | Nativer Windows-Daemon für Access-Migration (`.accdb`/`.mdb`), 64-Bit OLEDB/ACE, Desktop-Installer Builder (Tauri/Electron), Live Data-Sync & PHP Relay (v2.0.0). |

---

## 🧩 Funktionsübersicht im Detail

### 1. 🗄️ Relationaler Datenbank- & Schema-Designer
* **Visuelles ER-Diagramm:** Tabellen anlegen, Schlüssel definieren (Primary Key, Foreign Key, Unique Index), visuelle Beziehungslinien zeichnen mit 1:1, 1:n und n:m Kardinalitäten.
* **Umfangreiche Datentypen:** VARCHAR, TEXT, INTEGER, BIGINT, DECIMAL, FLOAT, BOOLEAN, DATE, DATETIME, TIME, BLOB, JSON, ENUM und UUID.
* **Feldeigenschaften & Validierung:** NOT NULL, Default Values, Check Constraints, Berechnete Spalten und Auto-Inkrement / Sequenzen.
* **Vorlagen & Branchen-Pakete:** Vorgefertigte Schemas für CRM, ERP, Auftragsverwaltung, Zeiterfassung und GAEB-Bauabrechnung.
* **Mock-Data-Generator:** Generiert realistische Testdatensätze mit konfigurierbaren Mustern auf Knopfdruck.

### 2. 🔍 Visueller Abfrage-Designer (QBE & SQL)
* **Access-inspiriertes QBE-Grid:** Tabellen per Drag & Drop verknüpfen, Spalten auswählen, Kriterien / Filterbedingungen (`WHERE`, `HAVING`), Sortierungen (`ORDER BY`) und Aggregationen (`Σ GROUP BY`, `SUM`, `COUNT`, `AVG`, `MIN`, `MAX`).
* **Alle Abfragetypen:** Auswahlabfragen (SELECT), Kreuztabellen (Pivot), Anfügeabfragen (INSERT INTO), Aktualisierungsabfragen (UPDATE) und Löschabfragen (DELETE).
* **Access SQL Transpiler:** Automatische Übersetzung von MS Access spezifischen Ausdrücken (`NZ()`, `IIF()`, `Format()`, `DateAdd()`, `Str()`) in Standard ANSI-SQL, PostgreSQL, MySQL und SQLite.
* **Live-Ausführung & SQL-Editor:** Umschalten zwischen QBE-Entwurfsansicht, Live-Ergebnis-Datenblatt und editierbarem SQL-Editor.

### 3. 📋 Formular-Studio & Subforms
* **Drag-&-Drop Designer:** Responsive Layout-Raster (1 bis 4 Spalten), Registerkarten (Tabs), Akkordeons und Container.
* **Master-Detail Subforms:** Voll funktionsfähige 1:n Unterformulare (z. B. Rechnungspositionen zu einer Rechnung) mit automatischer Fremdschlüssel-Synchronisation.
* **Reichhaltige Steuerelemente:** Textfelder, Nummernfelder, Kalender/Date-Picker, Lookups/Dropdowns, Checkboxen, Schalter, Datei-Uploads und Rich-Text.
* **Spezial-Widgets für Bau & Industrie:** GAEB-Picker, Aufmaß-Grid, 4-Augen-Freigabe, Signatur-Pad, Plan-/Foto-Marker und GiroCode QR-Rechnungsgenerator.

### 4. 📊 Berichts-Designer (Reports)
* **Klassischer Band-Aufbau:** Berichtskopf, Seitenkopf, Gruppenkopf, Detailbereich, Gruppenfuß, Seitenfuß und Berichtsfuß.
* **Gruppierung & Sortierung:** Mehrstufige Hierarchien mit automatischen Zwischensummen und Zählern.
* **Druck- & PDF-Engine:** Pixelgenaues DIN A4 Hoch- und Querformat-Layout, optimiert für den direkten Browserdruck und PDF-Export.

### 5. ⚡ Workflow- & Seiten-Designer
* **Visuelle Prozessketten:** Trigger (On Create, On Update, On Delete, Zeitplan), Bedingungen, Aktionen (E-Mail, Webhook, Datenänderung) und Benachrichtigungen.
* **Seiten-Designer:** Dashboards, Übersichtsseiten und Navigationsstrukturen frei zusammenstellen.

---

## ⚡ Der 4-Schritte-Workflow: MS Access zu DB Studio Pro

Die **DB Studio Local Bridge** fungiert als intelligentes Bindeglied zur Legacy-Migration:

```
┌─────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐       ┌──────────────────┐
│  MS Access      │  ───> │  Local Bridge Daemon │  ───> │  .dbsp Projektdatei  │  ───> │  DB Studio PRO   │
│  (.accdb/.mdb)  │       │  (Analyse & Transpile)│       │  (Schema, UI, Data)  │       │  (Visual RAD App)│
└─────────────────┘       └──────────────────────┘       └──────────────────────┘       └──────────────────┘
```

1. **Access-Datei ablegen:** Ziehen Sie eine beliebige `.accdb` oder `.mdb` Datei per Drag & Drop in die Local Bridge.
2. **Live-Analyse & Transpiler:** Die Bridge analysiert Tabellenstrukturen, Indizes, Relationen und transpiliert Access-spezifische Abfragen und VBA-Formeln in modernes SQL.
3. **`.dbsp` herunterladen:** Die native `.dbsp` Projektdatei (inklusive Schema, Beziehungen, Formularen, Abfragen und Daten) wird erstellt.
4. **In DB Studio Pro öffnen:** Laden Sie die `.dbsp` in DB Studio Pro. Alle Tabellen, ER-Diagramme, Formulare und Berichte sind sofort interaktiv verfügbar!

---

## 💻 Lokale Entwicklung & Start

### Voraussetzungen
* **Node.js** >= 18.x
* **npm** >= 9.x oder **pnpm** / **yarn**

### 1. Repository klonen & starten
```bash
# Repository klonen
git clone https://github.com/your-username/db-studio-pro.git
cd db-studio-pro

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten (Port 3000)
npm run dev
```

### 2. Projekt kompilieren & linten
```bash
# TypeScript Typecheck & Linting
npm run lint

# Produktions-Build erstellen
npm run build
```

---

## 🚀 Schnellstart & Installation nach dem Code-Export

Wenn Sie aus DB Studio Pro ein vollständiges Projekt exportiert haben, können Sie es eigenständig betreiben:

### Beispiel: Node.js (Express + TypeScript) & React Frontend

```bash
# 1. Exportiertes ZIP-Archiv entpacken
unzip mein_db_studio_projekt.zip
cd mein_db_studio_projekt

# 2. Abhängigkeiten im Backend & Frontend installieren
npm install

# 3. Datenbank-Schema (z.B. PostgreSQL oder MySQL) einspielen
# Für PostgreSQL:
psql -U postgres -d meine_db -f database/schema.sql
# Für MySQL:
mysql -u root -p meine_db < database/schema.sql

# 4. Umgebungsvariablen anpassen (.env)
cp .env.example .env

# 5. Fullstack-Anwendung im Entwicklungsmodus starten
npm run dev
```

### Beispiel: C# ASP.NET Core (.NET 10) Backend

```bash
cd backend-dotnet
dotnet restore
dotnet ef database update
dotnet run
```

---

## 📁 Projektstruktur

```
db-studio-pro/
├── apps/                  # Micro-Frontend Domänen & Sub-Apps
├── components/            # Wiederverwendbare UI- & Ribbon-Komponenten
│   ├── ribbon/            # Microsoft Office / Access inspiriertes Ribbon-Menüband
│   │   └── tabs/          # Home, Erstellen, Externe Daten, Tabellen-, Abfrage- & Formular-Design
│   ├── canvas/            # Visueller ER-Canvas & Drag-Drop Layouts
│   ├── query/             # Visueller QBE Query-Designer & SQL-Editor
│   └── modals/            # Assistenten, Import/Export & Einstellungs-Dialoge
├── features/              # Feature-Module (Formulare, Berichte, Workflows, Tabellen)
├── hooks/                 # Custom React Hooks & zentraler useAppController
├── services/              # Export-Generatoren (.NET, Node, PHP, React), DB-Services & Storage
├── stores/                # Zustand-State-Stores (useProjectStore, useUIStore, useAuthStore)
├── types/                 # TypeScript Schnittstellen & Datenmodell-Definitionen
└── utils/                 # Hilfsfunktionen, SQL-Parser & Validierungen
```

---

## 📄 Lizenz & Datenschutz

* **100% Local-First:** Ihre Daten verbleiben standardmäßig vollständig in Ihrem Browser bzw. in Ihrem lokalen Netzwerk.
* **Open & Extensible:** Keine versteckten Telemetrie-Zwänge, kein Vendor Lock-in.
* **Lizenz:** MIT License (oder kundenspezifische Enterprise-Lizenz).

---

**Entwickelt mit Leidenschaft für moderne Datenbankarchitekturen und Entwicklerproduktivität.**  
*DB Studio PRO – The Next-Gen Visual RAD Platform.*
