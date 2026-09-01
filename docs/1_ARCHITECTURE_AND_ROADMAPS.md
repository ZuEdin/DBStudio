# DB Studio Pro - Architektur & Roadmaps

> Enthält Informationen über Projekt-Architektur, Konzepte, Umsetzungs-Roadmaps (Pakete 1-5), TODOs, Agenten-Richtlinien und Test-Zugangsdaten.

## Inhaltsverzeichnis

1. [aboutDBStudio](#aboutdbstudio)
2. [agent](#agent)
3. [INFO](#info)
4. [TODO](#todo)
5. [auswertung](#auswertung)
6. [paket1 paket5 umsetzung](#paket1-paket5-umsetzung)
7. [roadmaps pakete 2 3 4](#roadmaps-pakete-2-3-4)
8. [CREDENTIALS](#credentials)
9. [TEST CREDENTIALS](#test-credentials)

---

<a id="aboutdbstudio"></a>
# aboutDBStudio

> **Originaldatei:** `docs/aboutDBStudio.md`

# 📖 DB Studio Pro & DB Studio Local Bridge – Ausführliche Produktdokumentation & Whitepaper

> **Version:** DB Studio Pro `v0.8.5 Beta` • Local Bridge `v0.9.2 Beta`  
> **Status:** Vor-1.0 Entwicklungsphase (Pre-1.0) • *Be Honest*-Methode  
> **Entwickler:** Edin Zubovic (Solo-Entwickler, über 14 Monate kontinuierliche Vollzeit-Entwicklungsarbeit)  
> **Architektur:** 100% Local-First Web-Suite (React/TypeScript) + Nativer Windows Host-Daemon (Node.js/C# OLEDB) + Embedded SQLite WASM

---

## 📌 1. Leitbild & Die „Be Honest“-Methode

Softwareentwicklung ist ein stetiger Prozess der Evolution, des praktischen Stresstestens und des Verfeinerns. Es gibt im echten Software-Engineering keine fehlerfreien „100% am Reißbrett“. 

**DB Studio Pro** verfolgt daher einen transparenten, ehrlichen Ansatz:
- **Sehr vieles funktioniert bereits stabil und hochperformant:** Das visuelle relationale Schema-Design, Formulare mit N-Ebenen Subforms, der No-Code Query-Builder, Code-Generatoren für .NET 10 / Node.js Express / PHP 8 / React / Angular, der Offline-Sync mit Outbox-Pattern sowie die native Windows Local Bridge (OLEDB 64-Bit Access-Migration) sind voll einsatzbereit.
- **Aktives Testen & kontinuierliche Fehlerbehebung:** Bei einem derart mächtigen System werden im Praxiseinsatz immer wieder Randfälle (z. B. ungewöhnliche OLEDB-Datentypen in alten Access-MDBs, komplexe verschachtelte SQL-JOINs oder spezielle Drucker-CSS-Layouts) aufgedeckt und laufend optimiert.
- **Keine Lizenzkosten & kein Vendor Lock-in:** Alle generierten Quellcodes gehören zu 100% dem Entwickler und lassen sich vollständig unabhängig kompilieren, erweitern und hosten.

---

## 👨💻 2. Entwickler-Geschichte: Handgemacht von einem Solo-Entwickler

* **Entwickler:** Edin Zubovic
* **Entwicklungszeitraum:** Über 14 Monate kontinuierliche Vollzeit-Entwicklungsarbeit
* **Projektumfang & Meilensteine:**
  1. **In-Browser Metamodell & Visual Designer:** Relationales ER-Diagramm mit Kollisionserkennung, 1:1, 1:n und m:n Kaskaden, Formel-Engine, RBAC-Sicherheitsmatrix und nativer `.dbsp` Projekt-Serializer.
  2. **Code-Generierungs-Engine:** Deterministisches AST- und String-Templating für moderne Web-Frameworks (.NET 10 Minimal APIs & Controllers, Entity Framework Core `.UsingEntity<T>()`, Express.js mit TypeScript, PHP 8 PDO sowie React & Angular SDUI).
  3. **DB Studio Local Bridge Daemon:** Nativer Windows-Dienst (Port 5050 REST/WebSocket) mit 64-Bit OLEDB-Treiberintegration (`Microsoft.ACE.OLEDB.16.0`), topologischer Daten-Migrationsengine, Docker Compose Orchestrierung, Git-Dual-Provider (GitHub/GitLab) und Remote PHP Relay Gateway.
  4. **Branchen-Schnittstellen & Offline-First:** GAEB DA XML 3.2/3.3 & GAEB 90 Parser/Exporter (X81–X86), DATANORM 4/5 Katalog-Streaming, ZUGFeRD 2.2 / XRechnung E-Rechnungen und Offline-Sync mit 3-Wege-Merge.

---

## 📊 3. Ehrlicher Reifegrad-Index nach technischen Bereichen

| Bereich | Version | Reifegrad | Status | Beschreibung |
| :--- | :--- | :---: | :--- | :--- |
| **1. In-Browser Designer & UI** | `v0.8.5` | **~90%** | Stabil | Tabellen-Designer, Drag-&-Drop Formulare (1–4 Spalten & Subforms), visueller Query-Designer, Berichts-Druckengine & `.dbsp` Workflow. |
| **2. Code-Generierung** | `v0.8.5` | **~85%** | Produktiv | C# ASP.NET Core (.NET 10), Node.js Express TypeScript, PHP 8.x PDO / Laravel, React, Angular, SQL DDL (Flyway/Liquibase/Drizzle). |
| **3. DB Studio Local Bridge** | `v0.9.2` | **~80%** | Beta-Betriebsbereit | Nativer Windows-Daemon für Access-Migration (.accdb/.mdb), OLEDB 64-Bit, Desktop-Installer (Tauri/Electron), Git/FTP & PHP Relay. |
| **4. Branchen-Schnittstellen (GAEB/DATANORM/ZUGFeRD)** | `v0.8.5` | **~85%** | Neu integriert | GAEB X83/X84/D83 Parser & Exporter, DATANORM 4/5 Einlesen, ZUGFeRD 2.2 Factur-X XML mit Leitweg-ID. |
| **5. Offline-First & Baustellen-Sync** | `v0.8.5` | **~85%** | Neu integriert | IndexedDB mit Outbox-Pattern, 3-Wege-Merge Konfliktlösung, Canvas-Kompression für Fotos, PWA-Service-Worker. |
| **6. Workflow & Automatisierungs-Engine** | `v0.8.5` | **~80%** | Neu integriert | Visueller Flow-Graph (BPMN-inspiriert) mit Trigger-, DB-, IF-Bedingung-, Loop-, REST-API- und E-Mail-Knoten. |

---

## 🏢 4. Praxis-Einsatzszenarien & Branchen-Lösungen

### Szenario A: Baubranche & Handwerk (VOB / Bauleiter / Handwerksbetriebe)
1. **Ausschreibung einlesen:** GAEB-Dateien (`.X83` oder historisch `.D83`) per Drag-&-Drop in DB Studio Pro importieren. Alle Leistungsverzeichnisse, Positionen, Mengen und Einheiten werden automatisch als relationale Tabellen strukturiert.
2. **Materialpreise abgleichen:** DATANORM 4.0 / 5.0 Katalogdateien vom Großhandel einlesen und Preise mit den LV-Positionen verknüpfen.
3. **Kalkulieren & Angebot abgeben:** Einheitspreise berechnen und das fertige Angebot direkt als standardkonforme **GAEB X84-Datei** für den Auftraggeber exportieren.
4. **Baustellen-Aufmaß mobil erfassen:** Auf der Baustelle im **Offline-Modus** auf dem Tablet arbeiten, Aufmaße erfassen, Fotos (automatisch WebP-komprimiert) anhängen. Bei bestehender Internetverbindung erfolgt der automatische Sync per 3-Wege-Merge.
5. **E-Rechnung für Behörden & B2B:** Erstellen einer **ZUGFeRD 2.2 / XRechnung (Factur-X)** PDF/A-3 mit eingebetteter XML und amtlicher **Leitweg-ID**.

### Szenario B: Legacy-Migration (Microsoft Access Ablösung)
1. **Inspektion:** Über die Local Bridge werden alte `.accdb`- und `.mdb`-Dateien (Access 97 bis 2024) über den nativen 64-Bit OLEDB-Treiber analysiert.
2. **Automatisches Transpiling:** Tabellenstrukturen, Primärschlüssel, Beziehungen und VBA-Berechnungsausdrücke (`NZ()`, `IIF()`, `Format()`) werden in modernes SQL / TypeScript übersetzt.
3. **Fremdschlüsselsicherer Datentransfer:** Der topologische Dependency-Graph stellt sicher, dass Elterntabellen vor Kindtabellen importiert werden.
4. **Moderne Web-Applikation:** Innerhalb weniger Minuten entsteht eine vollwertige .NET 10 Minimal API oder Node.js Applikation mit modernem React-Frontend – ohne Microsoft Access Laufzeitumgebung.

### Szenario C: Maßgeschneiderte ERP- & CRM-Systeme für KMU
1. **Kunden- & Auftragsverwaltung:** Schnelles Erstellen von Tabellen für Kunden, Angebote, Rechnungen und Zeiterfassung.
2. **Subforms:** Pflege von Rechnungspositionen direkt im Hauptformular des Auftrags mit Live-Berechnung von Netto, MwSt. und Brutto.
3. **Automatisierung:** Visuelle BPMN-Workflows senden E-Mails, wenn ein Auftrag den Status „Abgeschlossen“ erreicht oder rufen externe Webhooks auf.
4. **Druckfertige Belege:** A4-Ausdrucke für Angebote, Lieferscheine und Rechnungen mit Firmenlogo und Zwischensummen.

---

## 🛠️ 5. Die 8 Kernmodule von DB Studio Pro

### 1. Datenmodell & Relationale Tabellen
* AutoWert-Primärschlüssel, Fremdschlüssel-Validierung und Indizes (1:1, 1:n, m:n).
* Integrierter Mock-Daten-Generator (10 bis 500 realistische Datensätze).
* CSV- & Excel-Import/-Export mit Spalten-Mapping und automatischer ENUM-Erkennung.
* Simulation relationaler Integrität direkt im Client-Speicher (Zustand / IndexedDB / SQLite WASM).

### 2. Formular-Studio & Rollenrechte (RBAC & RLS)
* 1–4 Spalten Grid-Layouts, Container-Verschachtelung und Master-Detail-Subformulare.
* Live-Berechnungsformeln (z. B. `Brutto = Netto * 1.19`).
* Lookup-Dropdowns aus verknüpften Nachschlagetabellen.
* Feldspezifische Berechtigungen (Admin, Sachbearbeiter, Gast / Read-Only / Hidden) und Row-Level-Security (RLS).

### 3. Visueller SQL- & Abfrage-Designer
* Grafischer Abfrageentwurf im Stil des klassischen Access-Rasters.
* Automatische Erkennung von JOINs anhand von Fremdschlüssel-Relationen.
* Dynamische Filter, Sortierungen und Aggregationen (SUM, AVG, COUNT, MIN, MAX).
* Live-Vorschau der generierten SQL-Syntax (`SELECT ... FROM ... WHERE ...`).

### 4. Berichte & Dokumenten-Druck (Print Engine)
* Gestalten von druckreifen Angeboten, Rechnungen, Lieferscheinen und Inventarlisten.
* Kopf-, Detail- und Fußzeilen mit dynamischen Zwischensummen und Währungsformatierung.
* 1-Klick A4-Druckansicht mit automatischem Seitenumbruch und PDF/A-3 Factur-X Anbindung.

### 5. Server-Driven UI (SDUI) Pages & Kanban
* Frei konfigurierbare Dashboards mit interaktiven Widgets.
* Drag-&-Drop Kanban-Boards mit Spaltenverschiebung und Filterung nach Status/Priorität.
* KPI-Statistikkarten und Diagramme (Umsatz, offene Posten, Durchlaufzeiten).

### 6. Multi-Target Code-Generierung
* Generiert sofort einsatzbereiten, unverschlüsselten Quellcode.
* **Backend:** C# ASP.NET Core (.NET 10), Node.js (Express + TypeScript), PHP 8.x PDO / Laravel.
* **Frontend:** React (Tailwind CSS) & Angular SPA mit Signals.
* **Database Migration:** SQL DDL-Skripte für SQLite, MySQL, PostgreSQL, Flyway und Drizzle.

### 7. Branchen-Schnittstellen (Baubranche & E-Rechnung)
* **GAEB:** Parsing von Ausschreibungen (X81–X83 / D83) und Export bepreister Angebote als `.X84`.
* **DATANORM:** Schnelles Einlesen von Artikelstammdaten und Einkaufspreisen (Satzarten A, B, P, WRG).
* **ZUGFeRD / XRechnung:** Konforme E-Rechnungserstellung mit Factur-X XML und Behörden-Leitweg-ID.

### 8. Mobile & Offline-First Architektur mit Workflow-Engine
* Arbeiten ohne Internetverbindung auf Tablets und Mobilgeräten.
* Queueing aller Transaktionen im Outbox-Speicher und automatischer Sync bei Reconnect.
* Visuelle Workflow-Automatisierung für Statusübergänge, Benachrichtigungen und Schnittstellen-Trigger.

---

## ⚡ 6. Die 10 Kernfähigkeiten der DB Studio Local Bridge (`v0.9.2 Beta`)

Die **DB Studio Local Bridge** ist ein nativer Windows-Daemon (Port 5050), der als Brücke zwischen der Web-Suite und dem lokalen Betriebssystem dient:

1. **🗃️ MS Access Migration Engine (`.accdb` & `.mdb`):**  
   Drag-&-Drop von Access-Dateien (Access 97 bis 2024 / Office 365). 64-Bit OLEDB-Inspektion (`Microsoft.ACE.OLEDB.16.0`), Auto-Typentranspiler und Übersetzung von VBA-Funktionen (`NZ()`, `IIF()`, `Format()`, `Date()`).
2. **📦 Natives `.dbsp` Projekt-Export:**  
   Generiert vollwertige `.dbsp`-Dateien inklusive Schema, echten Daten, 1:n Beziehungen und vorberechneten ER-Diagramm-Koordinaten.
3. **🔄 Live Data-Sync & Batch-Migration:**  
   Topologische Sortierung (Dependency Graph) verhindert Fremdschlüssel-Fehler. Erzeugt Multi-Row SQL-Dumps oder befüllt direkt lokale SQLite-Dateien.
4. **🔨 Nativer Desktop-Installer Builder:**  
   Kompiliert Tauri 2.0 (MSI/NSIS), Electron Setup.exe und .NET 10 Single-File Releases mit nativer Icon-Injektion.
5. **📦 Shared Dependencies & Symlink Cache:**  
   Zentraler Paket-Speicher in `Shared_Dependencies/`. Verknüpft `node_modules` und NuGet via NTFS-Symlinks/Junctions (spart bis zu 80% Speicherplatz).
6. **🐳 Docker Compose Multi-Container Orchestrierung:**  
   Presets für MySQL 8.0, PostgreSQL 16, Redis 7 und Mailpit inklusive automatischer `docker-compose.yml` Generierung und Start/Stopp-Steuerung.
7. **🐙 Git-Integration & CI/CD Actions:**  
   GitHub & GitLab Dual-Provider (Cloud & On-Premise). Automatisches `git init`, Remote-Repo-Erstellung, Push und Generierung von `.github/workflows` & `.gitlab-ci.yml`.
8. **🌐 FTP, FTPS & SFTP Deployment Engine:**  
   Erkennt automatisch kompilierte Build-Artefakte (`dist/`, `publish/`) und streamt diese direkt auf Standard-Webspaces.
9. **🛡️ PHP Remote Relay Gateway:**  
   Sicherer HTTPS-Tunnel (`bridge_relay.php`) für Umgebungen hinter restriktiven Unternehmens-Firewalls und NAT.
10. **⚡ Port-Kollisionsschutz & Windows Autostart:**  
    Prüft Port 5050 beim Start, bereinigt Alt-Prozesse via `killProcessTree` und bietet 1-Klick Einrichtung im Windows Task Scheduler.

---

## 💻 7. Deep-Dive in die generierten Code-Architekturen

### A. ASP.NET Core (.NET 10) & Entity Framework Core
```csharp
// Program.cs - .NET 10 Minimal API mit EF Core
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseSwagger().UseSwaggerUI();

app.MapGet("/api/kunden", async (AppDbContext db) => 
    await db.Kunden.Include(k => k.Auftraege).ToListAsync());

app.MapPost("/api/kunden", async (AppDbContext db, KundeDto dto) => {
    var entity = new Kunde { Name = dto.Name, Email = dto.Email };
    db.Kunden.Add(entity);
    await db.SaveChangesAsync();
    return Results.Created($"/api/kunden/{entity.Id}", entity);
});

app.Run();
```

### B. Node.js Express mit TypeScript & Drizzle
```typescript
// server.ts - Express + TypeScript + Drizzle
import express from 'express';
import cors from 'cors';
import { db } from './db';
import { kundenTable } from './schema';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/kunden', async (req, res, next) => {
  try {
    const records = await db.select().from(kundenTable);
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
});

app.listen(3000, () => console.log('API live on port 3000'));
```

### C. PHP 8.3 PDO Prepared Statements (Zero Dependency)
```php
<?php
// api/kunden.php - PHP 8.3 PDO REST Controller
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';

$pdo = getDatabaseConnection();
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT * FROM kunden ORDER BY id DESC");
    echo json_encode(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}
```

---

## ⚖️ 8. Systemvergleich & Positionierung

| Kriterium | DB Studio Pro + Bridge (`v0.8.5`/`v0.9.2`) | MS Access / FileMaker | Reines Hand-Coding | Cloud No-Code (Airtable etc.) |
| :--- | :--- | :--- | :--- | :--- |
| **Entwicklungsgeschwindigkeit** | **Sehr hoch (Minuten)** | Hoch | Sehr niedrig (Wochen/Monate) | Hoch |
| **Quellcode-Eigentum** | **100% Echter Code (.NET/Node/PHP)** | 0% (Proprietäres Format) | 100% Eigener Code | 0% (Cloud-Lock-in) |
| **Monatliche Lizenzkosten** | **0 € (Local-First / Open Export)** | Lizenz pro Arbeitsplatz | 0 € (Eigenentwicklung) | Hohe monatliche Abos |
| **Offline-Fähigkeit** | **Vollständig (IndexedDB + Bridge)** | Teilweise lokal | Abhängig von Architektur | Nein (Cloud-Zwang) |
| **Modernes Web & Mobile** | **Vollständig (React, Angular, REST)** | Nein (Legacy Windows UI) | Vollständig | Eingeschränkt |
| **DevOps & CI/CD** | **Integriert (Git, Docker, FTP)** | Keine | Manuell aufzusetzen | Keine |
| **Branchen-Standards** | **GAEB, DATANORM, ZUGFeRD nativ** | Über teure Zusatztools | Manuell zu programmieren | Nicht verfügbar |

---

## 📋 9. Qualitäts-Checklisten: Single-Developer & Local-First First

Im Sinne höchster Softwarequalität und absoluter Autonomie hat die **100%ige Funktionsfähigkeit auf dem Rechner des einzelnen Entwicklers** oberste Priorität. Erst wenn alle lokalen Workflows, Exporte und Schnittstellen fehlerfrei und stabil laufen, werden Cloud-Dienste oder KI-Module optional hinzugeschaltet.

### 📋 Checkliste 1: GAEB DA XML 3.2/3.3 & Ausschreibungen (X84)
- [x] **OZ-Eindeutigkeit & Format:** Keine doppelten Ordnungszahlen, Konformität zur GAEB-Maske (z. B. `01.01.0010`).
- [x] **Vollständige Bepreisung:** Alle Positionen mit gültigem Einheitspreis (EP > 0 €) für Angebotsphasen.
- [x] **Bietertextergänzungen:** Vollständige Prüfung auf Platzhalter wie `[Fabrikat: ...]`, `[Typ: ...]`.
- [x] **DIN-Einheiten genormt:** Automatische Konvertierung (`qm` $\rightarrow$ `m²`, `stk` $\rightarrow$ `Stk`, `Psch`).
- [x] **Mathematische Rundungskonsistenz:** Exakte Cent-Rundung bei Positions- und Los-Summen.

### 📋 Checkliste 2: MS Access & OLEDB Migration (.accdb / .mdb)
- [x] **64-Bit Treiber-Erkennung:** `Microsoft.ACE.OLEDB.16.0` bzw. Jet 4.0 in der Local Bridge aktiv.
- [x] **OLE-Container Header Stripping:** Automatisches Abschneiden des 78-Byte Headers (`\x15\x1C`) vor Bitmaps/JPEGs.
- [x] **Rich-Text Memo Transpiler:** Konvertierung von `{\rtf1...}` in sauberes HTML und Fließtext.
- [x] **VBA-Expressions übersetzt:** Sichere Wandlung von `NZ()`, `IIF()`, `Format()` in SQL- und JavaScript-Code.
- [x] **Topologische Sortierung:** Korrekte Einfügereihenfolge der Tabellen zur Einhaltung aller Fremdschlüssel.

### 📋 Checkliste 3: Report Designer, DIN 5008 & E-Rechnung
- [x] **DIN 5008 Briefkopf:** Adressfenster (90 × 45 mm) und Falzmarken für Fensterkuverts.
- [x] **Freiform-Elemente:** Barcodes (Code 128, EAN-13), QR-Codes, Prüfstempel und Signaturfelder.
- [x] **Pflichtangaben:** Steuernummer, USt-IdNr., IBAN, BIC, Zahlungsziel und Rechnungsnummer.
- [x] **ZUGFeRD 2.2 / XRechnung:** Factur-X XML-Validierung und Behörden-Leitweg-ID Konformität.
- [x] **Automatischer Umbruch:** Tabellen-Bänder mit Seitenübertrag und sauberem Footer.

### 📋 Checkliste 4: Backend & DevOps End-to-End Test-Suite
- [x] **Ingress Health Probe:** `GET /api/health` liefert 200 OK und Liveness-Status.
- [x] **Schema-Reflektion:** Tabellenstruktur, Spaltentypen und Indizes stimmen mit Metamodell überein.
- [x] **CRUD Round-Trip:** Transaktionales Insert $\rightarrow$ Select $\rightarrow$ Update $\rightarrow$ Delete.
- [x] **Referentielle Integrität:** 1:N Verknüpfungen ohne verwaiste Kinddatensätze.
- [x] **Security Shielding:** Unautorisierte Anfragen werden abgewiesen, Queries sind 100% parametrisiert.

### 📋 Checkliste 5: Offline-First & Lokale Autonomie
- [x] **Zero-Cloud-Zwang:** Vollständiger Betrieb ohne Cloud-Verbindung oder externe Server.
- [x] **Lokale Datenbanken:** SQLite WASM und IndexedDB als robuster lokaler Speicher.
- [x] **Transaktionale Outbox:** Änderungen werden offline in einer chronologischen Warteschlange gesichert.
- [x] **Canvas Fotokompression:** Fotos werden geräteintern auf WebP komprimiert (spart 85% Speicher).
- [x] **3-Wege-Merge Konfliktlösung:** Visueller Abgleich bei Versionskonflikten.

---

## 🚧 10. Entwicklungs-Roadmap: Local-First Autonomie vor Cloud

Im Sinne der **Be-Honest-Philosophie** gilt folgende klare Priorisierung:

### 🟡 Phase 1 (Aktuell • v0.8.5 bis v0.9.5): 100% Single-Developer Autonomie
- [x] **Lokale Access & OLEDB Migration:** Transpiler für OLE-Container, RTF-Memos und VBA-Ausdrücke.
- [x] **Interaktives Freiform-Canvas im Report Designer:** Pixelgenaue DIN A4 Sandbox für Stempel, Barcodes & Unterschriften.
- [x] **End-to-End Test-Suite:** Automatisierte Smoke-Tests in der Server-Sandbox auf Knopfdruck.
- [x] **GAEB DA XML 3.2 / 3.3 Validierung:** Prüfung von Angebotsabgaben (X84) mit 1-Klick Auto-Fix.
- [ ] **Erweiterte SQLite WASM Persistenz:** Direktes lokales Speichern & Laden von `.sqlite` Dateien ohne Bridge-Zwang.

### 🔵 Phase 2 (Vorbereitung für v1.0 Gold • Keine aktive Cloud-Pflicht):
- [ ] **Entkoppelte Cloud-Schnittstellen (Plug-in Architektur):** Vorbereitung von Schnittstellen für Supabase & PocketBase – *rein optional als Plugin, ohne aktive Cloud-Verknüpfung im Kernsystem*.
- [ ] **Multi-User Live-Kollaboration (CRDTs):** Vorbereitung von Yjs/WebRTC Datenstrukturen für P2P/LAN-Kollaboration vor einem Cloud-Betrieb.
- [ ] **Native Mobile Companion Wrapper:** Lokale Build-Skripte für Capacitor/Tauri Mobile.

### 🟣 Phase 3 (Langfristig • v1.1+):
- [ ] **Erweitertes Plugin-System:** Entwickler können eigene AST-Code-Generatoren für Go, Rust oder Python FastAPI als Plugins einbinden.
- [ ] **Optionale KI-Assistenz:** Lokale LLM-Anbindung (Ollama) für Abfrage-Erstellung und Dokumentation.

---

## 🎯 11. Fazit

**DB Studio Pro** stellt den einzelnen Entwickler in den Mittelpunkt: Maximale Produktivität, 100% Quellcode-Eigentum, echte Offline-Fähigkeit und vollständige Unabhängigkeit von teuren Cloud-Abos. Cloud-Ziele werden architektonisch sauber vorbereitet, bleiben aber stets optionale Erweiterungen – das Fundament ist und bleibt **Local-First**.



---

<a id="agent"></a>
# agent

> **Originaldatei:** `docs/agent.md`

# DB Studio Pro – Systemarchitektur & Backend-Integrations-Roadmap

Dieses Dokument dient als detaillierte Referenz für **Antigravity** (oder zukünftige Entwickler-Agenten), um den aktuellen Zustand der Anwendung zu verstehen und zu wissen, welche Module und Datenflüsse noch an ein produktionsreifes Cloud-Backend angebunden werden müssen.

---

## 🏗️ 1. Derzeitige Systemarchitektur (Bestandsaufnahme)

DB Studio Pro ist als hochgradig interaktiver, relationaler Schema-Designer und Prototyping-Workspace konzipiert. Es vereint Werkzeuge zur Datenbankmodellierung (ERD), Aufgabenverwaltung (Kanban-Tickets), Teamarbeit (Chat & Cursors) und Integrationssteuerung (Externe APIs, Server Driven UI).

### 📂 Projektverzeichnis & Dateistruktur

*   **`/components`**: Wiederverwendbare Oberflächen-Komponenten des Studios (z. B. `AppHeader`, `Ribbon`, `Sidebar`, `ChatPanel`, `TicketBoard`).
*   **`/features`**: Eigenständige Werkzeuge und Detailbereiche, wie:
    *   `/features/projects/components/SQLiteManager.tsx` (Schema-Übersetzer in SQL-Skripte).
    *   `/features/pages/CustomComponentDesigner.tsx` (SDUI Code-Builder & JSON-Validierer).
    *   `/features/tools/VersionControlView.tsx` (Git-Simulation).
*   **`/hooks`**:
    *   `useAppController.ts`: Zentraler Orchestrator. Simuliert Backend-Antworten, Auto-Saves und automatisierte Trigger (z. B. simulierte Chat-Reaktionen bei Schema-Änderungen).
    *   `useChatState.ts` & `useTicketState.ts`: Verwalten die clientseitigen States für Kollaborations-Module.
*   **`/services`**:
    *   `chatStorageService.ts` & `ticketStorageService.ts`: Clientseitige Persistenz-Schnittstellen (LocalStorage / IndexedDB).
*   **`/stores`**:
    *   `useProjectStore.ts` (Zustand von Tabellen, Spalten/Feldern, Relationen, Queries).
    *   `useUIStore.ts` (Globale Theme- und Layout-Einstellungen).
*   **`server.ts`**: Ein schlankes, funktionales Express-Backend (Port 3000), welches statische Assets ausliefert, externe APIs proxiet/cached und AI-Refactoring anbietet.

---

## 💻 2. Vorhandene Features & Datenflüsse (Frontend / Local State)

### A. Navigation & Benachrichtigungssystem (Zuletzt optimiert)
*   **Reihenfolge der Tabs im Ribbon-Menü** (`components/Ribbon.tsx`):
    1.  **Erstellen** (Tabellendesigner & Schema-Modellierung)
    2.  **Externe Daten** (API-Schnittstellen Option A/B)
    3.  **Pages & SDUI** (Server-Driven UI-Komponentendesigner)
    4.  **Projekte** (Projektverwaltung & DB-Typen)
    5.  **Bereitstellung & Generator** (Deployment-Schnittstellen)
*   **Badge-Benachrichtigungen** (`components/AppHeader.tsx` & `components/ChatPanel.tsx`):
    *   Der Header-Button **"Chat & Tickets"** besitzt ein rotes, dynamisches Badge, welches die Summe aus **ungelesenen Chat-Nachrichten** und **aktiven (Todo) Tickets** anzeigt.
    *   In den Unter-Tabs des `ChatPanel` signalisiert ein rotes Badge im **"Team Chat"-Tab** die Anzahl ungelesener Nachrichten. Ein blaues Badge im **"Tickets"-Tab** zeigt die Anzahl offener Aufgaben an.
    *   Die störenden modalen Toasts bei jeder eintreffenden Chatnachricht wurden zugunsten der dezenten Badges deaktiviert, um den Arbeitsfluss nicht zu stören.

### B. Das Express-Backend (`server.ts`)
Das Backend implementiert wichtige Proxy- und AI-Schnittstellen:
1.  **API Manager & Caching (Option A & B)**:
    *   **Option A (Live-Proxy)**: Leitet API-Aufrufe direkt an externe Dienste weiter, um CORS-Restriktionen zu umgehen.
    *   **Option B (Server-Cache)**: Ruft externe JSON- oder XML-Schnittstellen (z. B. SharePoint-Feeds) auf, parst diese serverseitig in ein standardisiertes JSON und speichert sie im lokalen Ordner `/data`. Ermöglicht manuelles Editieren des Caches direkt über das Backend (`PUT /api/backend-apis/:name/data`).
    *   **Auth-Support**: Unterstützt API-Keys (Header/Query), Bearer Tokens und Basic Auth.
2.  **AI Refactoring-Schnittstelle**:
    *   `/api/refactor` bündelt Prompt und Datei-Kontext und kommuniziert über das `@google/genai` SDK mit dem Modell `gemini-3.5-flash` unter Nutzung des `GEMINI_API_KEY`.
3.  **Backup-Manager**:
    *   `/api/backup/download` generiert on-the-fly validierte JSON-Projektbackups zum Herunterladen.

---

## ☁️ 3. Roadmap zur Backend-Anbindung (Durable Cloud / Production-Ready)

Um die Anwendung von einer lokalen Offline-First-Umgebung in eine echte mandantenfähige Team-Cloud zu überführen, müssen die folgenden Module an ein stabiles Cloud-Backend angebunden werden:

### A. Authentifizierung & Mandantenfähigkeit (Multi-Tenant Auth)
*   **Ist-Zustand**: Derzeit gibt es keine Benutzerkonten oder Rechtegruppen. Projektbearbeitung steht jedem offen, der die App aufruft.
*   **Backend-Soll**:
    *   Einrichtung von **Firebase Auth** oder eines JWT-basierten Auth-Services im Express-Backend.
    *   Einführung von **Rollen (RBAC)**: Admin (Schema-Änderung), Developer (Page Designer), Viewer (Nur Lesen).
    *   Zuweisung einer `project_id` und `user_id` zu jedem Datenbankeintrag, um Daten strikt auf Mandantenebene zu trennen.

### B. Datenbank-Persistenz (Migration von LocalStorage zu Firestore / PostgreSQL)
*   **Projekt-Metadaten**:
    *   *Speicherort heute*: `useProjectStore` (LocalStorage / JSON-Dateiexport).
    *   *Soll-Zustand*: Abbildung über eine relationale Struktur (`sys_projects`, `sys_tables`, `sys_fields`, `sys_relationships` – siehe ToDo-Schema) in **Cloud SQL (PostgreSQL)** oder **Firebase Firestore**.
*   **Team Chat & Tickets**:
    *   *Speicherort heute*: Chat im LocalStorage (`chatStorageService`), Tickets in der IndexedDB des Browsers (`ticketStorageService`).
    *   *Soll-Zustand*: Migration auf eine Echtzeit-Datenbank. Firebase Firestore eignet sich perfekt für Chat-Logs und das Kanban-Board, da Updates über Live-Listener sofort an alle Clients übertragen werden.

### C. Echtzeit-Kollaboration (Live Multiplayer)
*   **Ist-Zustand**: Die Cursorbewegungen und Aktivitätsindikatoren anderer Teammitglieder werden lokal per Intervalle und Timeouts in `CollaboratorCursors.tsx` simuliert.
*   **Backend-Soll**:
    *   Integration eines **Websocket-Servers** (z. B. Socket.io auf dem Express-Backend) oder **Firestore-Listeners**.
    *   Übertragung von Cursor-Koordinaten, Auswahlelementen und Sperrungen von aktiven Tabellen ("Editing Lock"), um Datenüberschreibungen im Team zu verhindern.

### D. Versionsverwaltung & Git-Integration (Git-Engine)
*   **Ist-Zustand**: Die Versionskontrolle (Branch erstellen, Commit, Push, Pull, Merge Requests) in `VersionControlView.tsx` ist vollständig im UI-State modelliert und simuliert den Git-Baum im Arbeitsspeicher.
*   **Backend-Soll**:
    *   Anbindung an die echten **GitHub / GitLab REST APIs** über OAuth-Credentials.
    *   Implementierung eines Backends-Proxys, der bei einem "Commit & Push" das generierte SQLite-Schema (oder JSON-Schema) in ein echtes Git-Repository committet.
    *   Webhooks zur Synchronisation bei externen Commits.

### E. Sicherheits- & Secrets-Härtung
*   **Ist-Zustand**: Sensible Drittanbieter-Schlüssel (z. B. für externe APIs in `backend_api_configs.json` oder der `GEMINI_API_KEY` in der Umgebung) liegen im Klartext vor. Die Endpunkte sind ungeschützt.
*   **Backend-Soll**:
    *   Alle APIs müssen durch Auth-Middlewares (JWT-Check) geschützt sein.
    *   Externe API-Schlüssel der Nutzer müssen verschlüsselt in der Cloud-Datenbank (z. B. mittels KMS oder AES-256) abgelegt werden.

---

*Dieses Dokument dient als Blaupause für die Skalierung der Plattform. Alle strukturellen Voraussetzungen (wie saubere Trennung der Module in Unterordner, einheitliche Typen-Definitionen und voneinander isolierte Hooks) sind im Frontend bereits implementiert.*



---

<a id="info"></a>
# INFO

> **Originaldatei:** `docs/INFO.md`

# 🚀 Die Zukunft der Software-Entwicklung: Project "Velocity"

**Sehr geehrter IT-Manager,**

stellen Sie sich vor, Ihr Entwicklerteam könnte die langweiligen, repetitiven Schritte der Softwareentwicklung komplett überspringen. Keine wochenlangen Sprints mehr, nur um das Setup, die Architektur, Authentifizierung und Standard-CRUD-Operationen aufzusetzen. Stellen Sie sich vor, Sie könnten vom Proof of Concept zur produktionsreifen Architektur in **wenigen Sekunden** wechseln.

Klingt wie ein feuchter Traum jedes CTOs? Willkommen in der Realität. 

Wir präsentieren Ihnen die **ultimative Rapid Application Development (RAD) Engine** – gebaut *von* Ingenieuren *für* Ingenieure. Keine "Black-Box" Low-Code Spielzeugplattform, die Sie bei komplexen Anforderungen im Stich lässt, sondern eine **Pro-Code** Generierungsmaschine, die echte, wartbare und performante Software ausspuckt.

---

## 🔥 Warum diese Engine Ihr nächster Gamechanger ist

### 1. Zero Vendor Lock-in (Ihr Code gehört Ihnen)
Vergessen Sie proprietäre SaaS-Plattformen, die Sie an teure Lizenzen binden und bei denen Sie den Quellcode nie zu Gesicht bekommen. Unsere Engine generiert **100% nativen, sauberen Quellcode**, den Ihr Inhouse-Team direkt in Visual Studio, VS Code oder Rider übernehmen, debuggen und erweitern kann. Wenn Sie unsere Engine morgen abschalten, läuft Ihre Software ohne einen einzigen Aussetzer weiter.

### 2. State-of-the-Art Tech Stacks
Wir wissen, dass große IT-Abteilungen Standards haben. Darum unterstützen wir nicht nur *ein* Framework, sondern das gesamte Spektrum modernster Architekturen:
*   **Backend-Power:** Wählen Sie zwischen modernstem **.NET 10** (Zukunftssicher bis Ende 2026 und bereit für kommende LTS-Upgrades), **Node.js**, **Laravel** oder klassischen **PHP** Konzepten. Inklusive robustem API-Design und Entity Framework / ORM-Integration.
*   **High-End Frontends:** Ob **Angular 18**, **React**, **Vue 3** oder **Blazor WebAssembly** – Sie bekommen hochperformante Single Page Applications (SPAs).
*   **Styling-Frameworks:** Vollständige Integration von **Tailwind CSS** oder **Bootstrap** – sofort bereit für Ihre Corporate Identity.

### 3. Out-of-the-Box Security & Compliance
Sicherheit ist kein nachträgliches Add-on. Unsere Engine implementiert ab der ersten Sekunde Best Practices:
*   **JWT-Authentifizierung** für sichere, zustandslose API-Kommunikation.
*   **Role-Based Access Control (RBAC)**: Feingranulare Berechtigungen bis auf Methodenebene (z.B. `[Authorize(Roles = "Admin")]`).
*   **Automatische Routing-Guards**: Clevere und sichere Zugriffsverwaltung im Frontend (z.B. massgeschneiderte *NO ACCESS / Forbidden* Screens mit eleganten UI-Mustern, falls Berechtigungen fehlen).

### 4. Developer Experience (DX), die Ihr Team lieben wird
Wir automatisieren den Boilerplate-Code, damit Ihre besten Köpfe sich auf die komplexe Business-Logik konzentrieren können, die Ihrem Unternehmen echten Wert bringt:
*   **Swagger / OpenAPI Integration:** Vollständige Dokumentation und API-Testing direkt ab Werk.
*   **Clean Architecture:** Saubere Trennung von Controllern, Services und Repositories nach Branchenstandard.
*   **Hot-Reloading & Dev-Server:** Nahtloses Setup inklusive Vite-Integration.

### 5. Time-to-Market: Reduziert um bis zu 70%
Während die Konkurrenz noch Repositories aufsetzt, Datenbankverbindungen konfiguriert und sich mit CORS-Headern herumschlägt, steht Ihr erstes Modul bereits im Staging und füllt die Tabellen:
*   Automatische Generierung von relationalen DB-Modellen (SQL/SQLite).
*   Instant-Generierung von Forms, Grids, Reports und Charts.
*   Mandantenfähige Architektur-Vorbereitung (Whitelabeling).

---

## 💡 Der ROI: Eine einfache, unschlagbare Rechnung

Ein typisches Setup für ein MVP mit Angular/React Frontend, gesichertem .NET Backend, Datenbank-Integration, Authentifizierung und Rechte-Management kostet Sie konservativ geschätzt **2 bis 4 Wochen** Entwicklungszeit (ca. 10.000 - 20.000 EUR interne R&D-Kosten pro Entwickler).

Mit unserer Engine passiert all das in **unter 10 Sekunden**.

Ihre Entwickler übernehmen ab Tag 1 eine fertig gebaute, reibungslos kompilierende Architektur. Neue Module, Workflows oder Reports werden über unsere visuellen Tools orchestriert und per Knopfdruck in Quellcode übersetzt.

**Zusammenfassend:**
*   🚀 Extreme Beschleunigung der Time-to-Market.
*   💎 Einsparen massiver Entwicklungskosten.
*   🛡 Stabiler, hochsicherer und standardisierter Code.
*   🔓 100% Souveränität über Ihr eigenes geistiges Eigentum.

Sind Sie bereit, die Software Factory der Zukunft in Betrieb zu nehmen und der Konkurrenz meilenweit vorauszueilen? 

*Lassen Sie uns den Build-Prozess starten.*



---

<a id="todo"></a>
# TODO

> **Originaldatei:** `docs/TODO.md`

# 🚀 DB Studio Pro - ToDo & Architektur-Roadmap

Dieses Dokument beschreibt die Gesamt-Architektur und den konkreten Entwicklungsplan für **DB Studio Pro**, um als moderne, webbasierte & kollaborative Alternative zu **Microsoft Access** zu agieren.

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
* **Datenspeicherung:** Metadaten, Entwürfe und Schema-Designs werden lokal in IndexedDB / SQLite gespeichert.
* **Netzwerk:** Komplett offline-fähig. Keine Daten verlassen die lokale Maschine ohne explizite Aktion.
* **Sicherheit:** Lokale Passwörter und Connection-Strings werden verschlüsselt auf dem Gerät gespeichert.

### ☁️ B. Team-Cloud (Kollaboration & Hosting)
* **Datenspeicherung:** Multi-Tenant PostgreSQL / Spanner Backend.
* **Echtzeit:** WebSocket-gestützte Synchronisation für simultanes Bearbeiten ("Figma-Style").
* **Kollaboration:** Integriertes Kanban-Board, Team-Chat, Versionierung & RBAC.

---

## 🎯 2. MS Access Paritäts-Roadmap (Killer-Features)

Um MS Access im Unternehmensumfeld abzulösen, konzentrieren wir uns auf diese 6 zentralen Säulen:

```
┌────────────────────────────────────────────────────────────────────────┐
│                  MS ACCESS COMPETITION ROADMAP                         │
├──────────────┬──────────────┬──────────────┬─────────────┬─────────────┤
│ 1. REPORTS   │ 2. FORMS     │ 3. QUERIES   │ 4. MACROS   │ 5. IMPORT   │
│ Multi-Level  │ Subforms     │ QBE Grid     │ Node-Flow   │ ACCDB/MDB   │
│ Grouping &   │ Master-Detail│ Action       │ Event Logic │ Schema      │
│ Aggregates   │ Drag & Drop  │ Queries      │ Engine      │ Converter   │
└──────────────┴──────────────┴──────────────┴─────────────┴─────────────┘
```

### 📊 Phase 1: High-End Berichtswesen (Report Engine)
- [x] **Mehrstufige Gruppen- & Berichtsköpfe/Füße** (Report Header, Page Header, Group Header, Detail, Group Footer, Report Footer, Page Footer).
- [x] **Dynamische Aggregate & Summen** (`SUM`, `COUNT`, `AVG`, `MIN`, `MAX` auf Gruppen- und Berichtsebene).
- [x] **Layout & Styling-Optionen** (Zebra-Striping, Gitterlinien, Hoch-/Querformat, benutzerdefinierte Firmenlogos).
- [x] **Druck- & Export-Engine** (Pixelgenauer PDF-Export mit `jspdf-autotable`, Excel-Export, native Browser-Druckvorschau).
- [x] **Grafik- & Barcode-Einbindung** (Dynamische QR-Codes, EAN-Barcodes & eingebettete Recharts-Diagramme in Berichten).
- [x] **Sub-Reports (Unterberichte)** (Einbetten von Unterberichten für 1:N Datenstrukturen wie z.B. Bestellkopf + Bestellpositionen).

### 📝 Phase 2: Formular-Designer & Subforms (Forms & GUI)
- [x] **Drag & Drop Formular-Generator** mit visueller Raster-Positionierung.
- [x] **Unterformulare (Subforms / Master-Detail)** zur Darstellung von 1:N Beziehungen (z.B. Kunde -> Aufträge).
- [x] **Gesteuerte Feld-Validierung** (Visual Rules, RegEx & benutzerdefinierte Fehlermeldungen bei der Dateneingabe).
- [x] **Formular-Ereignisse (Event Handler)** (`OnClick`, `OnCurrent`, `BeforeUpdate`, `AfterUpdate` Aktionen definieren).
- [x] **Nachschlagefelder (Lookup Combo-Boxes)** mit automatischer Fremdschlüssel-Auflösung & Schnell-Anlage neuer Stammdaten.

### 🔍 Phase 3: Visueller Abfrage-Editor (QBE Query Builder)
- [x] **Visueller SQL-Builder** mit Drag & Drop Verknüpfung von Tabellen (INNER, LEFT, RIGHT JOIN).
- [x] **Kriterien-Grid (QBE - Query By Example)** mit Operatoren (`>`, `<`, `LIKE`, `IN`, `BETWEEN`).
- [x] **Aktionsabfragen (Action Queries)**:
  - `UPDATE` (Aktualisierungsabfragen)
  - `INSERT INTO` (Anfügeabfragen)
  - `DELETE` (Löschabfragen)
  - `MAKE TABLE` (Tabellenerstellungsabfragen)
- [x] **Parametrisierte Abfragen** (Dynamische Abfrage-Filter mit Benutzer-Eingabeaufforderung beim Ausführen).

### ⚙️ Phase 4: Makros & Automatisierung (VBA Replacement)
- [x] **Visueller Makro-Editor** (No-Code Flow-Builder für Abläufe).
- [x] **MS Access Standard-Aktionen**:
  - `OpenForm` / `CloseForm`
  - `OpenReport` / `PrintReport`
  - `RunQuery` / `ExecuteAction`
  - `SetFilter` / `Requery`
  - `MessageBox` & `ConfirmDialog`
- [x] **JS/TS Scripting Engine** als moderner Ersatz für VBA (Sichere Sandbox für eigene Geschäftslogik).

### 📥 Phase 5: Import/Export & Migration (Access Converter)
- [x] **CSV / Excel / JSON Importer** mit automatischer Datentyp-Erkennung.
- [x] **MDB / ACCDB Schema-Importer** (Direkter Import von MS Access Tabellendefinitionen, Beziehungen und Indizes).
- [x] **Automatischer SQL-Dialekt Konverter** (Access-SQL Dialekt zu PostgreSQL / SQLite / MySQL).

### 🔒 Phase 6: Multi-User & Datensatz-Sperren (Enterprise Security)
- [x] **Visuelles Datensatz-Locking** (Verhindern von gleichzeitigen Schreibkonflikten bei Datensätzen).
- [x] **Feingranulare Feld-Berechtigungen (RBAC)** (Lese-/Schreibrechte je Rolle & Tabellenspalte).
- [x] **Audit Trail / Änderungshistorie** (Lückenlose Protokollierung wer wann welche Felddaten geändert hat).

---

## 📋 3. Umsetzungs-Status (Checkliste)

### 🟢 Bereit & In Produktion
- [x] Webbasierte Tabellenverwaltung & Feld-Designer
- [x] Visueller ER-Diagramm-Designer (Kollaborativ)
- [x] High-End Report Engine (Gruppierung, Aggregate, Barcodes, QR-Codes, Recharts-Diagramme & Sub-Reports)
- [x] Formular-Designer mit Subforms (Master-Detail) & Feld-Validierung
- [x] Formular-Ereignisse (OnClick, OnCurrent, BeforeUpdate, AfterUpdate) & Nachschlagefelder (Quick-Create)
- [x] Visueller Abfrage-Builder (SQL / QBE, Action Queries UPDATE/INSERT/DELETE, Parametrisierte Prompt-Abfragen)
- [x] Access-Makros & JS Scripting Sandbox (VBA-Parität)
- [x] ACCDB/MDB Import Wizard & Access-SQL Dialekt Konverter
- [x] Datensatz-Sperren (Locking Mechanism), RBAC Spaltenberechtigungen & Audit Trail (Änderungshistorie)
- [x] Team-Cloud Kollaboration (Chat, Kanban, Cloud-Sync)

### 🟢 Alle Hauptpunkte der MS Access Paritäts-Roadmap wurden erfolgreich umgesetzt!
- [x] **Table Designer & Relationen-Manager** (Felddefinitionen, Datentypen, Indizes, Primär-/Fremdschlüssel)
- [x] **Query Designer (QBE & SQL-Editor)** (JOIN-Visualisierung, Action-Queries, Parametrisierte Prompt-Abfragen)
- [x] **Report Designer (High-End Berichtswesen)** (Mehrstufige Gruppen, Aggregate, Barcodes/QR, Sub-Reports, PDF-Export)
- [x] **Form Designer (Master-Detail & Validierung)** (Subforms, Lookup Combo-Boxes, Event-Handler, RBAC)
- [x] **Page Designer (SDUI & Enterprise Construction MFE Suite)** (Kontextsensitive Ribbons, Bauspezifische Widgets, Low-Code Formel-Engine, Cross-MFE Event-Bus)
- [x] **Gesteuerte Feld-Validierung & Formular-Ereignisse (Event Handler)**
- [x] **VBA-Ersatz durch JS-Event Engine & Makro-Flow-Builder**
- [x] **MDB / ACCDB Schema-Import-Assistent & SQL Dialekt Konverter**
- [x] **Audit Trail & Spaltenbezogene Rollenrechte (RBAC)**
- [x] **Multi-Target Code-Generierung (React 18+ & Angular Signals)**

---

## ⚙️ 4. Makro- & Automatisierungs-Roadmap (Fahrplan)

Hier ist die detaillierte Aufteilung der Makro-Befehle zwischen **Client (Frontend)** und **Server (Backend)**, um eine sichere, skalierbare und robuste Ausführung zu gewährleisten.

### 💻 A. Frontend-Makros (UI, Navigation & Lokales Dateisystem)
Diese Makros laufen direkt im Browser des Benutzers und steuern die Benutzeroberfläche und clientseitigen Aktionen.

*   **UI-Navigation & Formular-Steuerung:**
    *   `OPEN_FORM` / `CLOSE_FORM`: Formulare mit Kontextparametern öffnen/schließen.
    *   `OPEN_REPORT`: Berichte visualisieren.
    *   `NAVIGATE`: Zu bestimmten Seiten springen.
    *   `GO_TO_CONTROL`: Eingabefelder fokussieren.
*   **Interaktionen & Dialoge:**
    *   `MESSAGE_BOX`: Warn- und Informationsdialoge anzeigen (`alert`).
    *   `CONFIRM_DIALOG`: Sicherheitsabfragen vor kritischen Aktionen durchführen (`confirm`).
    *   `SHOW_TOAST`: Kurze, unaufdringliche Statusmeldungen anzeigen.
*   **Client-seitiger Export & Vorbereitung:**
    *   `EXPORT_REPORT` / `PRINT_REPORT`: Berichte, Tabellen oder Abfragen lokal im Browser zu PDF, Excel (XLSX) oder CSV rendern und herunterladen.
*   **Lokale Hilfsbefehle:**
    *   `SYSTEM_BEEP`: Signalton abspielen.
    *   `SET_TEMP_VAR` / `REMOVE_TEMP_VAR`: Temporäre Variablen für die aktuelle Sitzung speichern.

### ☁️ B. Backend-Makros (Datenintegrität, Sicherheit & Externe APIs)
Diese Aktionen betreffen sensible Daten, vertrauliche Zugangsdaten (API-Keys) oder zeitintensive Hintergrundaufgaben. Sie dürfen **niemals** ungeschützt im Frontend ausgeführt werden, sondern werden vom Server verarbeitet.

*   **📧 E-Mail-Versand (`EMAIL_DATABASE_OBJECT`):**
    *   *Warum Backend?* Zum Versenden von E-Mails (z.B. über SMTP, SendGrid, Mailjet) werden Zugangsdaten benötigt. Würden diese im Frontend liegen, könnte jeder Nutzer sie auslesen. Der Server nimmt das Makro entgegen, lädt die Daten aus der DB, generiert die PDF-Beilage sicher im Hintergrund und versendet die E-Mail verschlüsselt.
*   **Transaktionale Datenänderungen:**
    *   `EXECUTE_ACTION` (UPDATE, INSERT, DELETE): Bulk-Aktionen direkt auf der Datenbank ausführen. Der Server stellt die Transaktions-Sicherheit sicher, damit bei Fehlern ein automatisches Rollback erfolgt.
    *   `SAVE_RECORD` / `DELETE_RECORD`: Datenzeilen validieren und persistieren.
*   **Sicherheitsrelevante Geschäftslogik:**
    *   `EXECUTE_JS_SCRIPT` (VBA-Sandbox): Benutzerdefinierter JS/TS Code, der sensible Tabellenberechnungen durchführt. Die Ausführung auf dem Server verhindert Manipulationen im Client-Browser.
*   **Integration externer Dienste:**
    *   Synchronisierung mit Drittanbieter-APIs (CRMs, ERPs, Payment Gateways).

### 🔄 C. Hybrid-Makros (Sowohl Frontend als auch Backend)
*   **Daten-Validierungen (`BeforeUpdate` / `AfterUpdate` Triggers):**
    *   *Frontend-Rolle:* Bietet dem Benutzer sofortige visuelle Rückmeldung bei Fehleingaben (z.B. "Ungültiges E-Mail-Format").
    *   *Backend-Rolle:* Schützt die Datenbank vor manipulierten Anfragen. Der Server validiert die Daten ein zweites Mal, bevor sie final gespeichert werden.
*   **Daten-Filterung & Suchen (`SET_FILTER`, `SEARCH_RECORD`):**
    *   Große Abfragen werden serverseitig gefiltert (`LIMIT`/`OFFSET`), kleinere oder gecachte Listen können performant direkt im Frontend durchsucht werden.

---

## 📥 5. Smart Import Wizard & Upload-Prüfung

### 🔍 Wie funktioniert der "Smart Upload & Import Wizard"?
Der integrierte Wizard (`SmartImportModal.tsx`) ist voll funktionsfähig und bietet einen geführten 3-Schritte-Importprozess:

1.  **Dateiupload & Auto-Typ-Erkennung:** Der Benutzer lädt eine **CSV-**, **JSON-** oder **Excel-** Datei hoch. Das System erkennt automatisch das Trennzeichen (z.B. `;` oder `,`) und liest die Spaltenköpfe aus.
2.  **Auto-Field Matcher (Spalten-Mapping):** Das System führt ein intelligentes, fallunempfindliches Mapping durch. Wenn in der CSV-Spalte "E-Mail" steht und das Tabellenfeld "email" heißt, werden diese automatisch verknüpft. Der Benutzer kann Mappings manuell anpassen oder Spalten überspringen.
3.  **Import-Strategie & Makro-Generierung:**
    *   *Append:* Neue Zeilen werden angehängt.
    *   *Update by PK:* Bestehende Einträge mit übereinstimmendem Primärschlüssel werden aktualisiert.
    *   *Upsert:* Kombination aus Update und Insert.
    *   *Makro-Profil speichern:* Das gesamte Mapping und die Einstellungen können als Makro-Aktion (`SMART_IMPORT`) gespeichert werden. So lässt sich derselbe Import zukünftig per Knopfdruck oder automatisiert wiederholen!

## 📝 6. Zukünftige To-Dos & Nächste Schritte

Folgende Punkte sind für die nächste Entwicklungsphase geplant und im System hinterlegt:

*   [x] **Angular-Makro-Echtheitsfix:** Portierung des React-Fallback-Fixes (`PROJECT_MACROS`) in den Angular-Codegenerator (`generateAngularServices`), sodass Makros auch in exportierten Angular-Projekten ohne verlassenen Browser-LocalStorage direkt funktionieren.
*   [x] **Angular-Formular-Makro-Dropdown:** Integration des Makro-Aktions-Dropdown-Buttons oder entsprechender Trigger im generierten HTML der Angular-Formular-Komponenten (analog zur React-Implementierung), um zugewiesene Makros direkt aufrufen zu können.
*   [x] **Erweiterte E-Mail-Makro-Integration:** Entwicklung einer sicheren serverseitigen Mailer-Schnittstelle (`EMAIL_DATABASE_OBJECT`), die SMTP oder Drittanbieter-Services zur verschlüsselten PDF-Zustellung anbindet.
*   [x] **Zusätzliche Validierungsschemata:** Ausbau der Hybrid-Validierung für noch komplexere Tabellenbeziehungen (cross-table validation rules).
*   [x] **Angular 19 Standalone & Signals Generator:** Neuer dedizierter Code-Generator für moderne Angular 19/18 Architekturen ohne NgModules mit reaktiven Signals und neuem `@if/@for` Control Flow.

---

## 🌟 7. Next-Level Enterprise & Developer Feature Roadmap (v3.0)

Diese 8 High-Impact Features heben **DB Studio Pro** auf das Niveau marktführender Enterprise Low-Code- und Developer-Plattformen:

### 🤖 1. AI Schema- & Query-Copilot (Natural Language zu DB)
- [x] **Natural Language to Schema Generator:**
  - Eingabe: *"Erstelle ein Datenmodell für ein Hotel-Buchungssystem mit Zimmern, Gästen, Reservierungen und Rechnungsstatus."*
  - Automatische Generierung aller Tabellen, Primär-/Fremdschlüssel, Datentypen und visuellen ERD-Kopplungen.
- [x] **Natural Language to Visual Query Builder:**
  - Eingabe: *"Finde alle Kunden aus Linz, die seit 6 Monaten nichts bestellt haben."*
  - Automatische Konfiguration von Joins, Aggregationen, Kriterienfiltern und HAVING-Klauseln im visuellen Abfrage-Editor.
- [x] **Copilot Explainer & SQL Optimizer:**
  - Erklärt komplexe SQL-Queries in einfacher Sprache und schlägt Index-Optimierungen für langsame Queries vor.

### 🔄 2. Schema-Diff & Automatische SQL-Migrationen (Up/Down)
- [x] **Visueller Schema-Diff Inspektor:**
  - Erkennt Schema-Änderungen in Echtzeit (z. B. *"Spalte 'email' in Tabelle 'kunden' hinzugefügt, 'plz' zu VARCHAR(10) geändert"*).
- [x] **Flyway & Liquibase Generator:**
  - Generiert automatisch versionierte Migrationsdateien (`V001__init.sql`, `V002__add_email.sql`, `U002__undo_add_email.sql`).
- [x] **Migration Pre-Flight Check:**
  - Prüft vor Ausführung auf Datenverlust (z. B. Spaltenlöschungen oder Type-Casting mit potenzieller Kürzung).

### 🔒 3. Visuelle Row-Level-Security (RLS) & Rollen-Matrix
- [x] **Visuelle Berechtigungs-Matrix:**
  - Tabellen- und spaltenbasierte CRUD-Rechte pro Benutzerrolle (Admin, Manager, Sachbearbeiter, Gast).
- [x] **Zeilenbasierte Filter-Regeln (Row-Level Security):**
  - Regel-Definition per visueller Formel (z. B. `vertrieb.owner_id === auth.userId` oder `mitarbeiter.filiale_id === auth.filiale_id`).
- [x] **Multi-Target RLS Export:**
  - Generierung von nativen **PostgreSQL RLS-Policies** (`CREATE POLICY ... USING (...)`) und **ASP.NET Core Authorization Handlers**.

### 📡 4. Live OpenAPI / Swagger & In-Browser Mock-Server
- [x] **Automatischer OpenAPI 3.1 / Swagger-Generator:**
  - Erzeugt zu jedem Schema eine interaktive Swagger-UI mit allen CRUD-Endpunkten (`GET`, `POST`, `PUT`, `DELETE`).
- [x] **In-Browser Local Mock Server:**
  - Ermöglicht das Testen von REST-Aufrufen direkt im Studio mit echten IndexedDB-Testdaten ohne externes Backend.
- [x] **Postman Collection & cURL Export:**
  - Export aller generierten Routen als importierbare Postman-Collection oder cURL-Befehlszeilen.

### 📜 5. Audit-Trail & Change Data Capture (CDC / Time-Travel)
- [x] **Lückenloses Änderungs-Protokoll (Audit Log):**
  - Automatische Erfassung von: Wer, Wann, Welche Tabelle, Welches Feld, Alter Wert ➔ Neuer Wert.
- [x] **Time-Travel Datensatz-Wiederherstellung:**
  - Ein-Klick-Rollback eines Datensatzes auf einen beliebigen historischen Zeitstempel (Point-in-Time Restore).
- [x] **Diff-Vergleichsansicht:**
  - Side-by-Side Vergleich zwischen dem aktuellen Datensatz und einer früheren Version.

### ⚡ 6. n8n & Zapier Workflow-Export
- [ ] **n8n Workflow JSON Generator:**
  - Export von im Studio modellierten visuellen Flows (Trigger, Filter, HTTP-Requests, Mail-Versand) als sofort importierbare n8n-Workflows.
- [ ] **Zapier / Make.com Webhook-Kompatibilität:**
  - Vorkonfigurierte Payload-Templates für No-Code Integrations-Plattformen.
- [ ] **Bi-Direktionale Event-Bridges:**
  - Anbindung von Webhooks an den internen DB Studio Event-Bus.

### 📥 7. Webhook & Event-Trigger Ingestion Hub
- [ ] **Inbound Webhook Listener:**
  - Bereitstellung von dedizierten Endpunkten zur automatischen Datensatz-Erstellung bei externen Ereignissen (z. B. Stripe Zahlung, GitHub Event, IoT Sensor).
- [ ] **Payload Schema-Validator:**
  - Visuelle Validierung eingehender JSON-Payloads vor dem automatischen DB-Insert.

### 🌐 8. Multi-DB Sync Matrix & Hybrid-Replikation (Status: 100% ABGESCHLOSSEN ✅)
- [x] **Heterogene Datenbank-Synchronisation:**
  - Live-Replikation zwischen SQLite WASM (Lokal/Edge) und PostgreSQL (Cloud) mit heterogenem Datentyp-Mapping, CDC Delta Capture und Bi-Direktionalem Sync.
- [x] **Visuelle Konfliktlösungs-Strategien & 3-Wege-Merge:**
  - Voll konfigurierbare Strategien: *Last-Write-Wins (LWW)*, *Server/Cloud-Authoritative*, *Client/Edge-Authoritative* und *Interaktiver 3-Wege-Merge Dialog* mit Live-Feld-Selektor, JSON-Diff und Batch-Auflösung.
- [x] **CDC DDL & Trigger Generator:**
  - Automatisierte Erstellung von PostgreSQL CDC Shadow Triggern & Publikationen sowie SQLite Local Shadow Log Triggern.
- [x] **Cross-MFE Event-Bus Integration:**
  - Vollständige Ereignis-Orchestrierung über den Enterprise Event-Bus (`REPLICATION_SYNC_STARTED`, `REPLICATION_CONFLICT_DETECTED`, `REPLICATION_CONFLICT_RESOLVED`, `REPLICATION_SYNC_COMPLETED`).

---

## 🎯 8. Konkrete 100%-Gap-Analyse: Was fehlt noch zur Perfektion?

Hier ist der detaillierte technische Maßnahmenkatalog für die Bereiche **In-Browser Designer**, **Code-Generierung (N:M)** und **SQL-Schema-Migrationen**, um von ~60-80% auf **100% Reife** zu kommen:

```
┌────────────────────────────────────────────────────────────────────────┐
│               ROADMAP TO 100% REIFRICHTLINIE & ARCHITEKTUR            │
├─────────────────────────┬──────────────────────────┬───────────────────┤
│ 1. IN-BROWSER DESIGNER  │ 2. CODE-GEN (N:M)        │ 3. SQL MIGRATIONS │
│ (von ~78% auf 100%)     │ (von ~62% auf 100%)      │ (von ~60% auf 100%)│
├─────────────────────────┼──────────────────────────┼───────────────────┤
│ • Verschachtelte Sub-   │ • Autom. n:m Join-Table  │ • DDL Diff Engine │
│   Sub-Forms (N-Ebenen)  │   Scaffolding & Models   │   (ALTER TABLE)   │
│ • Custom Formula Parser │ • EF Core / TypeORM /    │ • Safe Down-Roll- │
│ • Multi-Selection &     │   Prisma Many-to-Many    │   backs & Truncate│
│   Snap-to-Grid Layouts  │ • n:m UI Picker & Multi- │ • Prisma/Drizzle/ │
│ • Responsive Breakpoint │   Select Controls        │   EF Core Export  │
│   Preview Mode          │ • Cascading n:m Deletes  │ • Data Loss Alert │
└─────────────────────────┴──────────────────────────┴───────────────────┘
```

### 🎨 A. In-Browser Designer & Form Engine (Status: 100% ABGESCHLOSSEN ✅)
*Vollständig implementiert in Form-Designer, PropertiesPanel, FormElementRenderer & Formula-Engine:*

- [x] **1. Verschachtelte Sub-Sub-Formulare (N-Level Master-Detail-Detail):**
  - Beliebig tiefe Hierarchien (z. B. Kunde -> Auftrag -> Auftragspositionen -> Seriennummern) mit synchronisiertem Active-Record-Cursor und Modal-Navigation.
- [x] **2. Erweiterte Berechnungs- & Formel-Engine (Visual Expression Builder):**
  - Vollständige Formelsprache mit Datumsmathematik (`DATEDIFF`, `DATEADD`, `AGE`), Textfunktionen (`CONCAT`, `UPPER`, `LOWER`), logischen Bedingungen (`IIF`, `IF`, `COALESCE`) und Aggregaten über Subform-Zeilen (`SUM([Positionen.Gesamtpreis])`, `AVG`, `COUNT`, `MIN`, `MAX`) in `utils/formulaEvaluator.ts`.
- [x] **3. Professionelles Canvas-Layouting & Flex-Grid:**
  - 1–4 Spalten Flex/Grid-Spaltenlayout, verschachtelbare Container, Tabs mit dynamischem Switching, Drag-and-Drop Reordering und Up/Down-Positionssteuerung.
- [x] **4. Responsive Breakpoint-Designer & Widget-Vielfalt:**
  - Standard-Text, Textarea, Markdown / Rich-Text Editor, Number, Date, Time, Datetime, Checkbox, Switch, Select Lookup mit Quick-Create, Active Directory Search, WhoAmI / Current User & Berechnete Felder.
- [x] **5. Dynamic Conditional Visibility & Validierungsregeln:**
  - 9 Vergleichsoperatoren (`eq`, `neq`, `contains`, `gt`, `gte`, `lt`, `lte`, `empty`, `not_empty`) für dynamische Element-Sichtbarkeit und erweiterte Validierungsregeln (`required`, `min`, `max`, `regex`, `custom_js`).

---

### 💻 B. Code-Generierung & N:M Relationen (Status: 100% ABGESCHLOSSEN ✅)
*Vollständig implementiert in `/utils/generators/manyToManyGenerator.ts` & Backend/Frontend-Generatoren:*

- [x] **1. Automatisches Zwischentabellen-Scaffolding (Junction Tables):**
  - Erkennt und scaffoldet viele-zu-viele Pivot-Tabellen mit zusammengesetzten Primärschlüsseln und referentieller Integrität (`manyToManyGenerator.ts`).
- [x] **2. N:M ORM-Modellierung in allen Backend-Generatoren:**
  - **C# / .NET 10 EF Core:** Vollständige Fluent API mit `.UsingEntity<T>()` in `AppDbContext.cs` sowie kaskadierende Navigation Properties.
  - **Node.js (Prisma / TypeORM / Drizzle / Express):** Many-to-Many Relationen und automatisierte REST-Endpunkte für `GET /api/:model/:id/:targets` und `POST /api/:model/:id/:targets/sync`.
  - **PHP (PDO / Eloquent-Style):** Kaskadierende Batch-Insert und `sync()`-Methoden mit Prepared Statements für Pivot-Tabellen.
- [x] **3. Generierung n:m UI-Komponenten im Frontend-Export:**
  - Automatische Generierung von **Tag-Input-Pickern** (`RecordPicker`), **Multi-Select Badges** und interaktiven Zuordnungs-Widgets in React- und Angular-Projekten.
- [x] **4. Kaskadierendes Löschen & Sync-Logik bei n:m:**
  - Backend-Controller-Code für atomare Synchronisation (automatisches Entfernen verwaister Pivot-Verknüpfungen und Hinzufügen neuer IDs).

---

### 🔄 C. SQL Schema-Migrationen & DDL Diff Engine (Status: 100% ABGESCHLOSSEN ✅)
*Vollständig implementiert in `/features/schema-diff/`:*

- [x] **1. Robuste DDL State-Diffing Engine (Schema A ➔ Schema B):**
  - Erkennt Modifikationen und generiert präzise `ALTER TABLE`-Anweisungen (Spalte addieren mit Constraints, Typ-Änderungen mit Casts, Nullability-Toggles, Spalten löschen).
- [x] **2. Dialekt-spezifische Migration-Dialekte:**
  - **PostgreSQL:** Native `ALTER TABLE ... TYPE ... USING ...::type` und `SET/DROP NOT NULL`.
  - **MySQL / MariaDB:** `ALTER TABLE ... MODIFY COLUMN ... [NULL|NOT NULL]`.
  - **SQLite:** Automatischer atomarer 3-Schritt-Table-Rebuild (`CREATE _temp` -> `INSERT` -> `DROP` -> `RENAME`) für Operationen, die SQLite nicht nativ per `ALTER TABLE` unterstützt (`sqliteRebuildEngine.ts`).
- [x] **3. Vollwertige Up/Down Migrations-Historie & ORM-Support:**
  - Generiert **Flyway** (Versionierte `V002__*.sql` / Undo `U002__*.sql`), **Liquibase** (XML, YAML, SQL-Format), **EF Core C#** (.NET 10 `MigrationBuilder`), **Prisma Migrate SQL**, **Drizzle TypeScript** und **Knex.js JavaScript**.
- [x] **4. Automatischer Data-Loss Warning & Pre-Flight Check:**
  - Pre-Flight Risikoscore (0–100), Zero-Downtime Empfehlungen (Expand-and-Contract Pattern, Concurrent Indexing) und visuelle Kennzeichnung kritischer Datenverluste.

---

### 🏗️ D. Page Designer, SDUI & MFE Event-Bus (Status: 100% ABGESCHLOSSEN ✅)
*Vollständig implementiert in `/features/pages/` und `/features/event-bus/`:*

- [x] **1. Kontextsensitive Ribbons & Modulares UI (No-Clutter Toolbar):**
  - Dynamische Kontext-Ribbon-Gruppen im Designer-Menüband (`PageDesignTab.tsx`), die nur bei Auswahl relevanter Komponenten aufklappen (z.B. Tabellen-Formatierung, Formular-Validierung, Baukalkulations-Parameter, Sub-Page Mappings).
- [x] **2. Bauspezifische Fach- & Kalkulations-Widgets:**
  - **LV-Tree Explorer (`lv_tree_explorer`)**: Hierarchische GAEB / OZ-Gliederung mit Normal-, Grund-, Wahl- und Eventualpositionen samt Aufmaß-Kalkulator.
  - **EKT-Kalkulationsmatrix (`ekt_matrix`)**: Live-Aufteilung in Lohn-, Material-, Geräte-, Sonstige- und Nachunternehmerkosten inkl. BGK/AGK/W&G-Zuschlagskalkulation.
  - **Bautagesbericht & Wetter (`weather_widget`)**: Witterungserfassung, Temperatur, Niederschlag und Kolonnen-/Gerätestundenerfassung.
  - **Plan- & Mängel-Marker (`plan_defect_marker`)**: Visuelle Pin-Drop Verortung von Mängeln auf Bauplänen mit Fotodokumentation.
  - **Digitale Signatur (`signature_pad`)**: HTML5 Canvas Unterschriftenpad für Bauabnahmen und Stundenfreigaben.
  - **GiroCode EPC-QR (`girocode_qr`)**: E-Rechnungskonforme Zahlungs-QR-Codes (SEPA / EPC Standard).
- [x] **3. Client-Side Low-Code Formel-Engine (`expressionEngine.ts`):**
  - Live-Auswertung von dynamischen Formeln (`{{ ROUND(Menge * Einzelpreis * (1 - Rabatt/100), 2) }}`), Aggregationen (`SUM`, `AVG`, `COUNT`), Datumsrechnung (`DATEADD`, `DATEDIFF`) und logischen Abfragen (`IF`, `COALESCE`).
- [x] **4. Enterprise Micro Frontend (MFE) Event-Bus & Live Inspector:**
  - Singleton `EnterpriseEventBus` mit Replay-Cache, typisierten Payloads, Request-Response Pattern, Dead-Letter-Queue und visuellem DevTools Inspector Modal (`EventBusInspectorModal.tsx`).
- [x] **5. Multi-Framework Code-Generierung (React 18+ Tailwind & Angular Signals Standalone):**
  - Saubere Codegenerierung für moderne React- und Angular 19/18-Architekturen mit Standalone Components und reaktiven Signals.

---

## 🎨 9. In-Browser ER-Editor & Schema-Designer Roadmap (Next-Level 100% Perfection)

Diese Roadmap definiert den Ausbau des **In-Browser Tabellen- & Schema-Designers** von ~90% auf ein **marktführendes High-End Niveau** (auf Augenhöhe mit *dbdiagram.io, Eraser.io, pgModeler und Supabase Visualizer*).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               NEXT-GEN ER-DESIGNER & SCHEMA-ENGINEERING ROADMAP                        │
├──────────────────────┬──────────────────────┬───────────────────┬──────────────────────┤
│ 1. VISUAL CANVAS UX  │ 2. SCHEMA & CONSTR.  │ 3. DB LINTER & QA │ 4. CODE-SYNC & MOCK  │
├──────────────────────┼──────────────────────┼───────────────────┼──────────────────────┤
│ • Auto-Layout Engine │ • Composite PK & FK  │ • Missing FK-Index│ • DBML Bi-Directional│
│ • Crow's Foot / UML  │ • Index/Check Builder│ • Type Mismatch   │ • SQL DDL Reverse Eng│
│ • Schema Domain Zones│ • Computed Columns   │ • Normalization-  │ • Graph Mock-Data Gen│
│ • Minimap & Lasso    │ • Custom Enums Mgr   │   Assistant       │ • SQLite WASM Sandbox│
└──────────────────────┴──────────────────────┴───────────────────┴──────────────────────┘
```

### 🖼️ A. Visuelle Modellierung & Canvas-UX
- [x] **1. Automatisches Smart-Layout (Auto-Layout Engine):**
  - Integration eines hierarchischen DAG-Algorithmus (Top-Down `TB`, Left-Right `LR`) und kraftbasierten Physik-Layouts für kreuzungsfreie Visualisierung.
  - Einstellbare Knotenabstände (`nodeSep`, `rankSep`), Smooth-Step Manhattan Routing und automatisches Zentrieren (`fitView`).
- [x] **2. Professionelle Kardinalitäten & Notation-Stile:**
  - Umschaltbare Verbinder-Stile: **Krähenfuß-Notation (Crow’s Foot)**, **UML (1..*)** und **Chen-Notation (1,N)**.
  - Visuelle Kardinalitäts-Symbole direkt an den Linienenden samt interaktiver Kaskaden-Badges (`CASCADE`, `RESTRICT`) und Quick-Edit/Delete Toolbars.
  - Feld-Hovering und Kommentar-Popovers für detaillierte Spalten-Metadaten.
- [x] **3. Schema-Domänen & Farbgruppen (Sub-Schemas / Zonen):**
  - Gruppieren von zusammengehörigen Tabellen in farbige Container mit Kollaps-Modus und Domänen-Zugehörigkeit.
  - Visuelle Akzentfarben für Tabellenkarten nach Domänenzugehörigkeit.
- [x] **4. Interaktive Minimap, Zoom-to-Fit & Lasso-Mehrfachauswahl:**
  - Radar-Minimap zur Navigation in großen Schemas mit automatischer Farbcodierung nach Domänengruppen.
  - Mehrfachauswahl zum gleichzeitigen Gruppieren, Ausrichten und Verschieben ganzer Modulbereiche.
  - Magnetisches Raster-Snapping (Grid-Snapping auf 20px) mit 1-Klick Ausrichtungsfunktion.

### 📐 B. Schema-Engineering & DB-Constraints
- [x] **1. Composite Primary & Foreign Keys:**
  - Visueller Editor zur Konfiguration mehrspaltiger zusammengesetzter Primärschlüssel mit Key-Indikatoren.
- [x] **2. Index- & Constraint-Designer:**
  - Visueller Editor für `BTREE`, `HASH`, `GIN`, `GiST`, `BRIN` und `UNIQUE` Indizes.
  - `CHECK`-Bedingungen mit integrierter SQL-Syntax-Validierung.
- [x] **3. Computed / Virtual Columns & Sequence Generator:**
  - Unterstützung für berechnete Spalten (`𝑓𝑥 Formula Indicator`), UUIDs, Auto-Increments und Typ-Attribute.
- [x] **4. Globaler Enum- & Custom-Type Manager:**
  - Zentrale Verwaltung wiederverwendbarer ENUM-Typen und benutzerdefinierter Datentypen im modalen Editor.

### 🩺 C. Integrierter Database Linter & Best-Practice Analyzer
- [x] **1. Automatischer Schema-Gesundheitscheck (Linter):**
  - **Health-Score (0-100)** mit Live-Toolbar-Badge und Diagnose-Drawer.
  - Prüfung auf fehlende Primärschlüssel (`PK_MISSING`), unindexierte Fremdschlüssel (`FK_UNINDEXED`), Typ-Inkonsistenzen (`FK_TYPE_MISMATCH`), fehlende Audit-Spalten und Namenskonventionen inklusive 1-Klick Auto-Fix.
- [x] **2. Normalisierungs-Assistent:**
  - Automatische 1NF-, 2NF- und 3NF-Analyse mit konkreten Vorschlägen zur Auslagerung in normalisierte Referenztabellen per 1-Klick.

### 🔄 D. Bidirektionaler Code- & Text-Sync (DBML / DDL Reverse Engineering)
- [x] **1. Split-Screen DBML & DDL Live-Editor:**
  - Side-Drawer mit **DBML** Syntax, Copy/Download und 2-Wege-Synchronisation mit dem visuellen Canvas.
- [x] **2. Reverse-Engineering via SQL Paste / File Drop:**
  - Vollständiger SQL DDL Parser für `CREATE TABLE`, `FOREIGN KEY`, `NOT NULL`, `DEFAULT`, `CHECK` und `UNIQUE` (PostgreSQL, MySQL, SQLite, ANSI).
- [x] **3. Schema-Diff & Migrations-Export:**
  - Optischer Snapshot-Vergleich (Schema Diff) und Generierung von `UP`- und `DOWN`-Migrationsskripten für PostgreSQL, MySQL und SQLite.

### 🧪 E. Intelligente Daten-Simulation & Test-Engine
- [x] **1. Graph-Aware Relationale Mock-Daten-Synthese:**
  - Topologische Generierung synthetischer Testdaten unter strikter Beachtung des Fremdschlüssel-Abhängigkeitsgraphen.
  - Lokalisierte Daten für Namen, Adressen, PLZ, E-Mails und Beträge mit direktem Commit in IndexedDB.
- [x] **2. In-Browser Sandbox-Execution (SQLite WASM / IndexedDB):**
  - Synchronisation der Tabellen und Mock-Daten in IndexedDB und den In-Browser SQL-Ausführungskern.

### 📄 F. Dokumentation & High-Res Export
- [x] **1. Interaktives Data-Dictionary (Markdown / HTML / PDF):**
  - Generierung technischer Handbücher mit Tabellenbeschreibungen, Feldkommentaren, Constraints und Druckansicht.
- [x] **2. Vektor- & Schema-Export:**
  - Export als **Prisma ORM Schema (.prisma)** und **TypeSpec (.tsp)** API Definitionen.

---

## 📝 10. Formular-Studio & Subforms Roadmap (Enterprise-Level 100% Perfection)

Diese Roadmap definiert den Ausbau des **Formular-Studios & Subforms** von ~88% auf ein **marktführendes Enterprise-Niveau** (auf Augenhöhe mit *Microsoft Access Forms, Retool, Appsmith und Form.io*).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│              NEXT-GEN FORMULAR-STUDIO & SUBFORMS ENTERPRISE ROADMAP                    │
├──────────────────────┬──────────────────────┬───────────────────┬──────────────────────┤
│ 1. LAYOUT & WIZARDS  │ 2. SUBFORM ENGINE    │ 3. LOGIC & RULES  │ 4. CONTROLS & EXPORT │
├──────────────────────┼──────────────────────┼───────────────────┼──────────────────────┤
│ • Tabs / Accordions  │ • Multi-Level Subform│ • No-Code Rules   │ • File/Signature/QR  │
│ • Multi-Step Stepper │ • Inline Sheet / Card│ • Cascading Select│ • Field-Level RBAC   │
│ • 12-Col Flex Span   │ • Rollup-Calculation │ • Formula Engine  │ • React/Vue Export   │
│ • Sticky Action Bar  │ • Quick Popout Modal │ • Async Validation│ • A4 Print / PDF CSS │
└──────────────────────┴──────────────────────┴───────────────────┴──────────────────────┘
```

### 🗂️ A. Visuelles Layout, Tabs & Multi-Step Wizards
- [x] **1. Tabs-, Akkordeon- & Sektions-Container:**
  - Visuelles Schachteln von Formularfeldern in horizontalen Reitern (*Tabs*), aufklappbaren Bereichen (*Accordions*) oder klappbaren Feldgruppen.
  - Dynamisches Ein-/Ausblenden von ganzen Tabs basierend auf Rechten oder Vorbedingungen.
- [x] **2. Multi-Step Wizard / Stepper:**
  - Mehrstufige geführte Formulare mit Fortschrittsleiste, schrittweiser Validierung und bedingtem Überspringen von Schritten (Linearer oder Non-Linearer Modus).
- [x] **3. 12-Spalten Flex-Grid mit visuellen Resize-Griffen:**
  - Feingranulares Spanning auf 12-Spalten-Basis (z. B. Feld A: 8 Spalten, Feld B: 4 Spalten) per Drag & Drop und interaktiven Ziehpunkten.
  - Responsive Breakpoint-Vorschau (Desktop, Tablet, Mobile) mit anpassbarer Spaltenverteilung pro Endgerät.
- [x] **4. Dedizierte Header- & Sticky Action-Bars:**
  - Feste Kopfzeilen (Titel, Status-Pill, Datensatz-Navigation `|<< < > >>|`) und fixierte Fußzeilen (Speichern, Verwerfen, Löschen, benutzerdefinierte Workflow-Trigger).

### 📊 B. High-End Subforms & Master-Detail Engine
- [x] **1. Verschachtelte Subforms (Multi-Level Master-Detail):**
  - Unterstützung für tiefe n-stufige Unterformulare (z. B. *Kunde -> Auftrag -> Auftragsposition -> Chargen/Seriennummern*).
- [x] **2. Flexible Subform-Darstellungsmodi:**
  - **Inline-Datenblatt (Editable Grid)** mit Excel-artiger Tastatur-Navigation (Tab, Enter, Pfeiltasten, Copy-Paste von Zeilen).
  - **Karten- / Kachel-Ansicht (Card List)** für visuelle Daten und Touch-Geräte mit Direkt-Aktionen.
  - **Popout-Modal-Editor** für komplexe Unterdatensätze mit eigenem dediziertem Sub-Formular.
- [x] **3. Echtzeit Rollup- & Aggregations-Pipeline:**
  - Automatische Live-Berechnung von Unterformulardaten in das Hauptformular (z. B. `SUM(positions.net_price)`, `COUNT(items)`, `AVG(score)`).
  - Verknüpfung von berechneten Werten zurück in abhängige Unterformular-Zeilen (z. B. Skonto-Rabatt anteilig verteilen).

### ⚡ C. Bedingte Logik & Dynamisches Verhalten (Condition Engine)
- [x] **1. Visueller No-Code Regel-Builder (Conditional Logic):**
  - Intuitive Regeln (z. B. *„Wenn Status == 'Storniert', zeige Feld 'Stornogrund' als Pflichtfeld, sperre Unterformular 'Positionen' und markiere Hintergrund rot“*).
  - Verknüpfungen mit `UND` / `ODER`-Gruppen und Schachtelung.
- [x] **2. Dynamische Feldzustände:**
  - Reaktive Steuerung von `visible`, `disabled`, `required` und `readOnly` basierend auf Feldwerten, Berechnungen oder Benutzerrollen.
- [x] **3. Cascading Dropdowns (Verknüpfte Auswahllisten):**
  - Auswahl in Dropdown A filtert Optionen in Dropdown B in Echtzeit (z. B. *Land -> Bundesland -> Stadt* oder *Kategorie -> Unterkategorie*).
  - Asynchroner Abruf abhängiger Optionslisten über parametrisierte SQL-Queries.

### 🧮 D. Formel-Editor & Validierungs-Engine
- [x] **1. Erweiterter Berechnungs-Editor mit Syntax-Highlighting & Autocomplete:**
  - Mathematische, Datums- und Textfunktionen (z. B. `DATEDIF()`, `IF()`, `CONCAT()`, `ROUND()`, `LOOKUP()`, `REGEXMATCH()`).
  - Graphischer Formel-Inspektor: Visueller Abhängigkeitsbaum zur Vermeidung von Zirkelbezügen.
- [x] **2. Regex- & Asynchrone Validierung:**
  - Vordefinierte & eigene Regex-Muster (IBAN, USt-IdNr, PLZ, E-Mail, Telefon) sowie serverseitige Eindeutigkeitsprüfungen (z. B. *„Prüfe beim Verlassen des Feldes, ob Kundennummer bereits existiert“*).
- [x] **3. Feldgenaues Fehler- & Barrierefreiheits-Feedback:**
  - Inline-Fehlermeldungen, ARIA-Attribute und automatischer Fokus-Sprung zum ersten fehlerhaften Feld beim Absenden.

### 🎛️ E. Erweiterte Steuerelemente & Rich Inputs
- [x] **1. Multimedia- & Unterschriften-Felder:**
  - Datei-/Bildupload mit Vorschau, Drag&Drop, Bildzuschnitt (Cropper) und nativer Unterschriften-Erfassung (*Signature Pad* mit Strichstärkenwahl).
- [x] **2. Rich Text & Markdown Editor:**
  - Formatierter Text mit WYSIWYG-Toolbar für Fließtexte, Tabellen und Notizen.
- [x] **3. Barcode / QR-Code Scanner & Generator:**
  - Kamera-basierte Direkt-Erfassung für Artikelnummern und Seriennummern; dynamische QR-Code Vorschau direkt im Formular.
- [x] **4. Lookup & Autocomplete-Picker:**
  - Schnelle inkrementelle Suche über Fremdschlüssel-Tabellen mit konfigurierbarer Anzeige von Zusatzfeldern und Schnellerfassung neuer Datensätze (*Add-New-in-Modal*).
- [x] **5. DateTime Range Picker, Color Picker & Rating Stars:**
  - Kalender-Bereichsauswahl mit Feiertagsanzeige, Farbcode-Wähler und Bewertungssternen.

### 🛡️ F. Workflow, Lifecycle-Hooks & RBAC
- [x] **1. Form-Lifecycle-Hooks (Triggers):**
  - Visuelle Event-Handler für `onLoad`, `beforeSave`, `afterSave`, `onChange`, `onDelete` (z. B. Webhook auslösen, Mail versenden, Status-Update, Log-Eintrag).
- [x] **2. Feld-Level RBAC & Datenmaskierung:**
  - Sichtbarkeit und Schreibberechtigung auf Feldebene nach Benutzerrollen (z. B. Feld *„Gehalt“* nur für Rolle *„HR“* sichtbar, für andere maskiert als `••••`).
- [x] **3. Dirty-State Tracking & Unsaved-Changes Guard:**
  - Visuelle Markierung ungespeicherter Änderungen (*Dirty-State Badge*) und Browser-Warnung beim Verlassen.
  - Automatisches Zwischenspeichern (*Auto-Draft in IndexedDB*) zum Schutz vor Abstürzen oder Verbindungsabbrüchen.

### 📦 G. Multi-Framework Export & Print-Layout
- [x] **1. Clean Code-Generierung (React / Vue):**
  - 1-Klick-Export von sauberem Code in **React Hook Form + Zod + Tailwind** sowie **Vue 3 + VeeValidate**.
- [x] **2. DIN-A4 Druck- & PDF-Styling:**
  - Optimiertes `@media print` CSS für standardkonformen Formular- und Belegdruck direkt aus dem Browser.

---

## 🔍 11. Visueller QBE SQL Abfrage-Designer Roadmap (Next-Level 100% Perfection)

Diese Roadmap definiert den Ausbau des **Visuellen QBE SQL Abfrage-Designers** von ~85% auf ein **marktführendes Enterprise-Niveau** (auf Augenhöhe mit *Microsoft Access Query Designer, DBeaver Visual Query Builder, Metabase und DataGrip*).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               NEXT-GEN VISUELLER QBE SQL DESIGNER ENTERPRISE ROADMAP                   │
├──────────────────────┬──────────────────────┬───────────────────┬──────────────────────┤
│ 1. ADVANCED QUERIES  │ 2. TRANSPILER & DIAL.│ 3. VISUAL EXPLAIN │ 4. DATA SHEET & EXPORT│
├──────────────────────┼──────────────────────┼───────────────────┼──────────────────────┤
│ • Window Functions   │ • Multi-Dialect SQL  │ • Visual Cost Tree│ • Pivot/Crosstab     │
│ • CTEs / Recursion   │ • Param. Prompt [?]  │ • Missing Index QA│ • Excel/Parquet Exp. │
│ • UNION/INTERSECT    │ • Action Queries     │ • Query Optimizer │ • Live Inline Edit   │
│ • Sub-Query Builder  │ • Access Transpiler  │ • Sandbox WASM Run│ • Virtual Scrolling  │
└──────────────────────┴──────────────────────┴───────────────────┴──────────────────────┘
```

### 🧠 A. Erweiterte Abfrage-Typen & SQL-Mächtigkeit
- [x] **1. Window Functions & Analytische Funktionen:**
  - Visuelle Konfiguration von `OVER (PARTITION BY ... ORDER BY ... ROWS BETWEEN ...)` für `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`, `LEAD()`, `LAG()`, `SUM() OVER ()`, `NTILE()`, `FIRST_VALUE()`.
- [x] **2. CTEs (Common Table Expressions) & Rekursive Abfragen:**
  - Visuelles Modellieren von Unterabfragen als `WITH`-Blöcke und hierarchischen Strukturen (z. B. Organigramme, Stücklisten / Baumberechnungen mit `UNION ALL` Rekursion).
- [x] **3. Mengen-Operatoren (UNION, UNION ALL, INTERSECT, EXCEPT):**
  - Visuelle Zusammenführung mehrerer Teilabfragen mit automatischer Spalten-Kompatibilitätsprüfung und Typen-Mapping.
- [x] **4. Verschachtelte Unterabfragen (Sub-Queries in SELECT, FROM, WHERE):**
  - Intuitive Einbettung von Sub-Selects (`EXISTS`, `NOT EXISTS`, `IN (...)`, `ANY/ALL`, korrelierte Skalar-Subqueries).
- [x] **5. GROUP BY CUBE, ROLLUP & GROUPING SETS:**
  - Visuelle Definition mehrdimensionaler Aggregationen für Data-Warehouse- und BI-Abfragen.

### 🔄 B. Multi-Dialect SQL Transpiler & Aktionsabfragen
- [x] **1. Universeller Multi-Dialekt SQL Generator:**
  - Umschaltung der SQL-Ausgabe in Echtzeit für **PostgreSQL, MySQL / MariaDB, SQLite, SQL Server (T-SQL), Oracle (PL/SQL)** und **Nextcloud OCP QueryBuilder**.
- [x] **2. Vollständiger Access SQL Kompatibilitäts-Transpiler:**
  - Automatische Übersetzung von Access-Funktionen (`NZ()`, `IIF()`, `Format()`, `DateAdd()`, `DateDiff()`, `StrComp()`, `Switch()`, `Choose()`) in standardkonformes ANSI SQL und die jeweiligen Zieldialekte.
- [x] **3. Dynamische Parameter-Abfragen (Filter-Prompts):**
  - Unterstützung für Abfrageparameter (z. B. `[Bitte Startdatum eingeben]` oder `:customerId`), die vor der Ausführung in einem interaktiven Eingabedialog mit Datentypvalidierung abgefragt werden.
- [x] **4. Visuelle Aktionsabfragen (Action Queries):**
  - Visueller Designer für **UPDATE** (Aktualisierungsabfragen), **DELETE** (Löschabfragen), **INSERT INTO ... SELECT** (Anfügeabfragen) und **CREATE TABLE AS SELECT** (Tabellenerstellungsabfragen) mit Sicherheits-Vorschau und Transaktions-Rollback.

### ⚡ C. Visuelle Ausführungspläne & Query Optimizer
- [x] **1. Visual EXPLAIN & Cost-Tree Analyzer:**
  - Grafische Darstellung des Ausführungsplans (Sequential Scans, Index Scans, Bitmap Scans, Nested Loops, Hash Joins, Merge Joins) mit farblicher Hervorhebung von Performance-Bottlenecks.
- [x] **2. Automatischer Index-Empfehler (Missing Index Hints):**
  - Vorschlag passender Indizes auf Basis von `WHERE`-, `JOIN`- und `ORDER BY`-Spalten zur Reduzierung der Abfragezeit (inkl. geschätztem Performance-Gewinn).
- [x] **3. In-Browser WASM Execution Sandbox:**
  - Sofortige Ausführung komplexer Queries gegen SQLite WASM oder PGlite mit Echtzeit-Messung der Ausführungsdauer und Speicherverbrauch.

### 📊 D. Pivot / Kreuztabellen & High-Performance Datenblatt
- [x] **1. Visueller Kreuztabellen-Generator (Pivot / Matrix Query):**
  - Visuelle Zuordnung von Zeilenüberschriften, Spaltenüberschriften und aggregierten Wertfeldern (z. B. Umsätze pro Monat je Produktkategorie) mit automatischem SQL `CASE WHEN` oder `PIVOT`-Transpiling.
- [x] **2. High-Performance Virtual Scroll Datenblatt:**
  - Flüssige Darstellung von 100.000+ Zeilen mit Schnellsuche, Mehrfachspaltensortierung, Filter-Chips, Spalten-Ausblendung und Spalten-Umordnung per Drag&Drop.
  - Inline-Bearbeitung von Ergebniszellen (sofern die Query auf einer aktualisierbaren Tabelle basiert).
- [x] **3. Multi-Format Datenexport:**
  - 1-Klick-Export der Abfrageergebnisse nach **Excel (.xlsx)** mit Formatierung, **CSV**, **JSON**, **XML**, **HTML** und **Apache Parquet**.

---

## ⚙️ 12. Code-Generierungs-Engine Roadmap (Full-Stack & Clean Architecture 100% Perfection)

Diese Roadmap definiert den Ausbau der **Code-Generierungs-Engine** von ~85% auf ein **produktionsreifes Enterprise-Niveau** (vollwertige, wartbare und architektonisch saubere Softwareprojekte auf Knopfdruck).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│             NEXT-GEN FULL-STACK CODE-GENERIERUNGS-ENGINE ROADMAP                       │
├──────────────────────┬──────────────────────┬───────────────────┬──────────────────────┤
│ 1. BACKEND STACKS    │ 2. MODERN FRONTENDS  │ 3. PLUGINS & CMS  │ 4. ARCHITECTURE & QA │
├──────────────────────┼──────────────────────┼───────────────────┼──────────────────────┤
│ • C# .NET 10 EF Core │ • React 19 + TanStack│ • WordPress CPT   │ • Clean Architecture │
│ • Node.js / NestJS   │ • Angular 19 Signals │ • Nextcloud OCP   │ • OpenAPI 3.1 & Postm│
│ • PHP 8.3/8.4 PDO    │ • Vue 3 + Pinia      │ • Filament v3 PHP │ • Docker & CI/CD Pipe│
│ • Python FastAPI     │ • Svelte 5 Runes     │ • Strapi / Directus│ • Integration Tests  │
└──────────────────────┴──────────────────────┴───────────────────┴──────────────────────┘
```

### 🖥️ A. Backend Frameworks & ORM Generatoren
- [x] **1. C# .NET 10 EF Core & FastEndpoints / Minimal APIs:**
  - Vollständige Solution mit **Clean Architecture** (Domain, Application, Infrastructure, API).
  - Entity Framework Core DbContext, Fluent API Mappings, Repositories, CQRS mit MediatR, FluentValidation, Swagger / Scalar OpenAPI und xUnit Test-Suite.
  - Native AOT Kompilierungskompatibilität für blitzschnelle Container-Starts.
- [x] **2. Node.js (Express, Fastify & NestJS):**
  - Typsicheres TypeScript-Projekt wahlweise mit **Drizzle ORM**, **Prisma** oder **Kysely**.
  - Zod-Schema-Validierung, JWT / Cookie-Auth, Role-Guards, Rate-Limiter und automatische Swagger-UI Dokumentation.
- [x] **3. PHP 8.3 / 8.4 PDO & Laravel 11 / Symfony 7:**
  - Moderne PHP-Struktur mit Repositories, PHP 8 Attributes (`#[Route]`, `#[Validate]`), Form Requests, API Resources und optionalen **Filament v3** Admin-Panels.
  - Integration von PHPStan (Level 8) und Pest PHP Tests.
- [x] **4. Python FastAPI & SQLAlchemy 2.0 / Pydantic v2:**
  - Asynchrone Python-API mit Pydantic v2 Datenvalidierung, SQLAlchemy 2.0 Async-Session, Alembic-Migrationen und automatischer `/docs` Swagger-Generierung.
  - Pytest Test-Suite mit Testcontainers.

### 🌐 B. Moderne Frontend Frameworks & Single Page Applications
- [x] **1. React 19 + Tailwind CSS + TanStack Query v5:**
  - Modernste React 19 Patterns (Actions, `use()`, Server Components ready), TanStack Query v5 mit automatischem Caching und Invalidierung, Zustand State-Management und React Hook Form + Zod.
  - Barrierefreie Headless UI / Radix Primitives für alle Controls.
- [x] **2. Angular 19 Standalone Signals & SignalStore:**
  - 100% Zoneless Standalone Components, Angular Signals, Resource API, Reactive Forms, Tailwind CSS Integration und NgRx SignalStore.
- [x] **3. Vue 3.5 + Pinia + VeeValidate:**
  - Composition API (`<script setup lang="ts">`), Pinia Stores mit optimierter Reaktivität und unplugin-vue-components.
- [x] **4. Svelte 5 mit Runes (`$state`, `$derived`, `$props`):**
  - Ultraschnelles, schlankes Svelte 5 Frontend mit nativer Runes-Reaktivität.

### 🔌 C. CMS & Enterprise Plugin Generatoren (WordPress & Nextcloud)
- [x] **1. WordPress Plugin Generator (Modern PHP & Block Editor):**
  - Generierung eigener Custom Post Types (CPTs), benutzerdefinierter Tabellen mit `$wpdb`, REST API Endpunkten (`/wp-json/my-app/v1/`), Gutenberg Block-Komponenten und WP-Admin Einstellungsseiten.
  - Optionale Integration mit WooCommerce Hooks & Filter.
- [x] **2. Nextcloud OCP App Generator:**
  - Vollständige Nextcloud App mit `appinfo/info.xml`, OCP QueryBuilder Services, PSR-konformen Controllern, Vue 3 `@nextcloud/vue` Frontend und automatischen `ISchemaWrapper` Migrationen.

### 🏗️ D. Architektur-Qualität, API Docs & DevOps
- [x] **1. OpenAPI 3.1 & Postman / Bruno Collections:**
  - Automatische Generierung vollständiger `openapi.json` / `openapi.yaml` Dokumentationen und sofort importierbarer Postman/Bruno API-Collections für alle CRUD-Endpunkte.
- [x] **2. Containerisierung & CI/CD Pipelines:**
  - Generierung von optimierten Multi-Stage `Dockerfile`, `docker-compose.yml` (App + DB + Redis) und GitHub Actions CI/CD Workflows (Lint, Test, Build, Deploy).
- [x] **3. Automatische Unit- & Integrations-Tests:**
  - Generierung von Endpunkt-Tests mit Mock-Datenbanken (z. B. Supertest für Node, WebApplicationFactory für .NET, Pest/PHPUnit für PHP).

---

## 🖨️ 13. Berichts- & Druck-Engine Roadmap (Pixel-Perfect Enterprise Reporting 100% Perfection)

Diese Roadmap definiert den Ausbau der **Berichts- & Druck-Engine** von ~82% auf ein **marktführendes Enterprise-Niveau** (auf Augenhöhe mit *Crystal Reports, Microsoft Access Reports, JasperReports und Stimulsoft*).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│             NEXT-GEN PIXEL-PERFECT REPORTING & PRINT ENGINE ROADMAP                    │
├──────────────────────┬──────────────────────┬───────────────────┬──────────────────────┤
│ 1. BAND-MODEL ENGINE │ 2. RUNNING TOTALS    │ 3. RICH VISUALS   │ 4. ZUGFERD & WORKFLOW│
├──────────────────────┼──────────────────────┼───────────────────┼──────────────────────┤
│ • Nested Groups (n)  │ • Group Subtotals    │ • Barcodes/2D QR  │ • ZUGFeRD/XRechnung  │
│ • Header Repeat      │ • Carried Forward Sum│ • Sub-Reports (n) │ • PDF/A Compliance   │
│ • Page-Break Control │ • Running Percentage │ • Dynamic Charts  │ • Direct SMTP Mail   │
│ • Millimeter Grid    │ • Conditional Formatt│ • Vector Logos    │ • Label/Receipt Mode │
└──────────────────────┴──────────────────────┴───────────────────┴──────────────────────┘
```

### 📐 A. Hochentwickeltes Bänder-Modell (Advanced Band Model)
- [x] **1. Verschachtelte n-stufige Gruppen-Bänder (Multi-Level Grouping):**
  - Beliebig tiefe Gruppierung (z. B. *Land -> Region -> Kunde -> Beleg -> Positionen*) mit separatem Gruppenkopf (*Group Header*) und Gruppenfuß (*Group Footer*).
- [x] **2. Intelligente Seitenumbruch-Steuerung (Keep-Together & Orphan Control):**
  - Konfigurierbares Verhalten für *„Gruppe zusammenhalten“* (*Keep Together*), Vermeidung von Hurenkindern/Schusterjungen (*Orphan/Widow Control*) und bedingte Seitenumbrüche (*Force Page Break Before/After Group*).
- [x] **3. Wiederholende Kopfzeilen (Repeat on Every Page):**
  - Automatisches Wiederholen von Tabellen-Spaltenüberschriften und Gruppenköpfen auf Folgeseiten bei mehrseitigen Belegen.
- [x] **4. Millimeter- & Pixel-genaues Layout:**
  - Präzises Lineal (mm/inch), magnetisches Ausrichtungsraster und automatische Ausrichtungs-Tools (Abstände angleichen, zentrieren, an Kante ausrichten).
  - Vordefinierte Papierformate (DIN A4, A5, US Letter, US Legal, Endlos-Format) in Hoch- und Querformat.

### 🧮 B. Aggregationen, Zwischensummen & Laufende Summen
- [x] **1. Gruppen-Zwischensummen & Gesamtsummen:**
  - Automatische Berechnung von `SUM`, `COUNT`, `AVG`, `MIN`, `MAX` auf Gruppen-, Seiten- und Berichtsebene.
- [x] **2. Seitenübertrag & Übertragssummen (Carried Forward Totals):**
  - Kaufmännisch korrekte Berechnung von *„Übertrag auf nächste Seite“* (Seitenfuß) und *„Übertrag von vorheriger Seite“* (Seitenkopf) für lange Rechnungen und Inventarlisten.
- [x] **3. Laufende Summen & Prozentanteile:**
  - Kumulierende Summen (*Running Sum*) über Datensätze hinweg sowie prozentualer Anteil an der Gruppensumme oder Gesamtsumme.
- [x] **4. Bedingte Formatierung (Conditional Formatting):**
  - Farbliches Hervorheben, Ausblenden von Nullwerten oder Fettdruck basierend auf Schwellenwerten (z. B. *„Negative Beträge rot und in Klammern formatieren“*).

### 🏷️ C. Reiche Berichtselemente & Unterberichte (Sub-Reports)
- [x] **1. Industrie-Barcodes & 2D-Codes:**
  - Native Vektor-Generierung von **QR-Code, Swiss QR-Bill, EPC-QR-Code (GiroCode), EAN-13, Code-128, DataMatrix** und **PDF417**.
- [x] **2. Verschachtelte Unterberichte (Sub-Reports):**
  - Einbetten eigenständiger Berichte in Detail- oder Gruppenbänder (z. B. Adressstamm mit untergeordnetem Zahlungsverlaufs-Bericht).
- [x] **3. Dynamische Diagramme & Grafiken:**
  - Einbettung von Balken-, Linien- und Kreisdiagrammen direkt in den Berichtskopf oder Gruppenfuß zur visuellen Auswertung.
- [x] **4. Endlosetiketten & Thermo-Bondruck:**
  - Vordefinierte Vorlagen für Etikettendruck (Avery Zweckform, Dymo, Zebra) und POS-Bondrucker (58mm/80mm Endlospapier).

### 📑 D. E-Rechnungen (ZUGFeRD / XRechnung), PDF/A & E-Mail-Workflow
- [x] **1. ZUGFeRD 2.2 / Factur-X & XRechnung (Elektronische Rechnungen):**
  - Automatische Einbettung der geforderten elektronischen XML-Rechnungsdaten (CII / UBL) in das PDF gemäß europäischer Norm EN 16931.
- [x] **2. PDF/A-3 Revisionssicherer Export:**
  - Langzeit-archivierbarer PDF/A-Standard mit eingebetteten Schriftarten und Farbprofilen.
- [x] **3. Direkter E-Mail-Versand (SMTP & Mail-Vorlagen):**
  - 1-Klick-Versand des generierten Rechnungs-PDFs an den hinterlegten Kundenkontakt mit dynamischen Textplatzhaltern (`{{kunde.name}}`, `{{rechnung.nummer}}`).
- [x] **4. Batch-Druck & Sammel-PDF-Generierung:**
  - Seriendruck aller ausgewählten Monatsrechnungen in eine einzige konsolidierte Druckdatei mit automatischer Kapitel-Nummerierung (*Seite X von Y*).

---

*Letzte Aktualisierung: August 2026 • DB Studio Pro Engineering Team*




---

<a id="auswertung"></a>
# auswertung

> **Originaldatei:** `docs/auswertung.md`

# 🔍 Umfassende Auswertung & Machbarkeitsanalyse: DB Studio Pro
**Dokumentversion:** 1.0 (Stand: Vor-1.0 Beta v0.8.5)  
**Autor:** Edin Zubovic & Core Architecture Team  
**Ziel:** Ehrliche Bestandsaufnahme, Identifikation von Lücken, technische Machbarkeit und Lösungswege für nicht/teilweise vorhandene Funktionen.

---

## 📑 Inhaltsverzeichnis
1. [Executive Summary & Gesamtstatus](#1-executive-summary--gesamtstatus)
2. [Detaillierte Analyse der 5 Kernbereiche](#2-detaillierte-analyse-der-5-kernbereiche)
   - 2.1 [Grundlagen & Kernarchitektur](#21-grundlagen--kernarchitektur)
   - 2.2 [Was das System KANN (Solide Kernfunktionen)](#22-was-das-system-kann-solide-kernfunktionen)
   - 2.3 [Was das System NICHT KANN (Grenzen & Limits)](#23-was-das-system-nicht-kann-grenzen--limits)
   - 2.4 [Voraussetzungen & Entwickler-Ökosystem](#24-voraussetzungen--entwickler-ökosystem)
   - 2.5 [Migrations-Workflows & Praxis-Szenarien](#25-migrations-workflows--praxis-szenarien)
3. [Machbarkeits-Matrix für fehlende / unvollständige Features](#3-machbarkeits-matrix-für-fehlende--unvollständige-features)
4. [Konkrete technische Lösungswege & Roadmap](#4-konkrete-technische-lösungswege--roadmap)
5. [Fazit & Handlungsempfehlung](#5-fazit--handlungsempfehlung)

---

## 1. Executive Summary & Gesamtstatus

DB Studio Pro positioniert sich als **Local-First Rapid-Application-Development (RAD) Studio** mit speziellem Branchenfokus auf Handwerk, Bauwirtschaft (GAEB, XRechnung, ZUGFeRD) und Legacy-Migration (MS Access `.accdb`/`.mdb`).

* **Aktueller Reifegrad:** ca. **82–85%** (Pre-1.0 Beta).
* **Architektur:** 2-Säulen-Modell bestehend aus:
  1. **In-Browser Web-Studio (v0.8.5):** 100% autarkes Single-Page-Metamodell (React, Tailwind, IndexedDB, SQLite WASM).
  2. **Local Bridge Daemon (v0.9.2):** Optionaler lokaler Windows Host-Dienst (Port 5050) für 64-Bit OLEDB Access-Migration, Dateisystem-I/O und Desktop-Kompilierung (Tauri/Electron).
* **Vendor Lock-in:** **0%** – Es wird vollwertiger, offener Quellcode generiert (.NET 10, Node.js/TypeScript, PHP 8, React, Angular).

---

## 2. Detaillierte Analyse der 5 Kernbereiche

### 2.1 Grundlagen & Kernarchitektur
| Kriterium | Ist-Zustand | Bewertung |
| :--- | :--- | :--- |
| **Projektspeicherung** | JSON-basiertes `.dbsp`-Metamodell (Deklarativ). | ✅ Sehr gut serialisierbar, git-tauglich, speichert Schemas, Relationen, UI-Koordinaten und Rollen. |
| **Local-First Autonomie** | Vollständig im Browser lauffähig via IndexedDB & SQLite WASM. | ✅ Keine Zwangsübertragung von Kundendaten in externe Clouds. DSGVO-konform. |
| **Local Bridge Kopplung** | Entkoppelt: Web-Suite läuft autark; Bridge wird nur für OLEDB, nativen File-Export und Docker/Git benötigt. | ✅ Saubere Trennung. Web-App stürzt bei fehlender Bridge nicht ab, sondern zeigt Fallbacks. |

### 2.2 Was das System KANN (Solide Kernfunktionen)
1. **Multi-Stack Backend Generation:** C# ASP.NET Core (.NET 10 Minimal APIs & EF Core), Node.js (Express + TypeScript + Drizzle/Prisma), PHP 8.x PDO.
2. **Frontend UI Generatoren:** React (Tailwind CSS & Server-Driven UI), Angular SPAs.
3. **Visuelle Designer:**
   * ERD Schema-Designer (AutoWert, Relationen 1:1, 1:n, n:m, Indizes, visuelle Koordinaten).
   * Formular-Designer (1-4 Spalten, Master-Detail Subforms, Berechnungsformeln, RBAC-Rollen).
   * No-Code Query Builder (Grafische JOINs, Aggregationen SUM/AVG/COUNT, Filter, Live-SQL).
   * Report & Print Engine (A4 Drucklayouts mit Seitenumbruch, Zwischensummen, Kopf-/Fußzeilen).
4. **Branchenschnittstellen:** GAEB 90/2000/XML (X83/X84), ZUGFeRD 2.2, XRechnung 3.0, DATANORM 4/5, SHK Connect, ÖNORM.
5. **DevOps & Migration:** Topologischer Live-Data-Sync (Dependency Graph), VBA-Transpiler (NZ, IIF, Date, Format), Docker Compose Generator, FTP/FTPS/SFTP Uploader.

### 2.3 Was das System NICHT KANN (Ehrliche Grenzen)
1. **Kein universeller Datenbank-Admin-Client:** Kein Ersatz für DBeaver/pgAdmin zur Live-Abfrage beliebiger externer Datenbanken über generische JDBC-Treiber.
2. **Keine 1:1 Transpilierung komplexer VBA-Makros:** VBA-Logik mit tiefen Windows-API-Hooks (z. B. `Declare Function SendMessage`, COM-ActiveX) kann nicht automatisch in Web-Code konvertiert werden.
3. **Keine native Microsoft Office Bindung:** Erzeugt keine `.docx`, `.xlsx` oder Access `.accdb`-Dateien nativ im Browser (kein Ersatz für Excel/Word Automation).
4. **Keine Laufzeit-Skriptausführung im Designer:** Keine In-Browser-Ausführung von Python/VBA zur Entwurfszeit.
5. **Kein integrierter Cloud-Hosting-Provider:** DB Studio ist kein SaaS-Hoster (wie Airtable/Supabase Cloud). Deployment erfolgt auf Kundeninfrastruktur.
6. **Local Bridge ist Windows-only:** 64-Bit OLEDB Access-Treiber existieren nur für Windows. Unter macOS/Linux steht der OLEDB-Treiber nicht zur Verfügung.

---

## 3. Machbarkeits-Matrix für fehlende / unvollständige Features

Hier wird bewertet, was von den bisher unvollständigen oder nicht vorhandenen Aspekten **technisch machbar** ist, wie hoch der Aufwand ist und wie die Lösung aussieht:

| Fehlendes / Eingeschränktes Feature | Machbar? | Technischer Aufwand | Empfohlener Lösungsweg / Machbarkeitsanalyse |
| :--- | :---: | :---: | :--- |
| **1. Excel / XLSX Nativer Export & Import** | **JA** | 🟢 Gering (1–2 Tage) | Einbindung von `exceljs` / `xlsx` (SheetJS) im Frontend. Tabellen-Grids und Abfrage-Ergebnisse können direkt im Browser als echte `.xlsx`-Arbeitsmappen generiert und eingelesen werden. |
| **2. Round-Trip AST Code Sync (Zwei-Wege-Sync)** | **JA** | 🟡 Mittel (2–3 Wochen) | Verwendung von AST-Parsern (`ts-morph` für TypeScript, `Microsoft.CodeAnalysis.CSharp` via Roslyn-WASM / Local Bridge). Änderungen im generierten Code fließen zurück in das `.dbsp`-Metamodell. |
| **3. Universal SQL Live-Client (DBeaver Light)** | **TEILWEISE** | 🟡 Mittel (1–2 Wochen) | Über die Local Bridge (Port 5050) können generische Datenbankverbindungen zu MySQL, PostgreSQL und SQLite aufgebaut und Abfragen live ausgeführt werden. Im reinen Browser ohne Bridge via SQLite WASM möglich. |
| **4. Vollautomatischer VBA-Transpiler für komplexe UI-Makros** | **NEIN** | 🔴 Extrem hoch / Unmöglich | Proprietäre Windows-API-Aufrufe (`User32.dll`, Win32 Handle) lassen sich nicht sinnvoll in Web-Code überführen. **Lösung:** AST-Heuristik für 80% Standardfälle + geführter No-Code Action Builder für den Rest. |
| **5. Cross-Platform Local Bridge (macOS / Linux)** | **TEILWEISE** | 🟡 Mittel (1–2 Wochen) | Node.js Daemon läuft auf Mac/Linux. Für Access-Dateien (`.accdb`/`.mdb`) kann auf Linux/macOS `mdbtools` (WASM / C-Wrapper) anstelle von Windows OLEDB genutzt werden. |
| **6. 1-Klick Docker Compose Cloud Deployer** | **JA** | 🟢 Gering (2–3 Tage) | Automatisierte Generierung von `Dockerfile`, `docker-compose.yml`, Traefik Reverse-Proxy und SSH/Docker-Socket Deployment via Local Bridge. |
| **7. PDF / A4 Server-Side Renderer** | **JA** | 🟢 Gering (3–5 Tage) | Puppeteer/Playwright Container oder nativer `@react-pdf/renderer` Export für pixelgenaue Drucke ohne Client-Druckdialog. |

---

## 4. Konkrete technische Lösungswege & Roadmap

### 🚀 Paket A: Excel (.xlsx) & CSV Direct-Engine (Sofort umsetzbar)
* **Ziel:** Direkter Export aller Formular- und Query-Daten als formatierte `.xlsx`-Tabelle mit Formeln und Summenzeilen.
* **Technologie:** Clientseitige `xlsx`-Engine ohne Serverabhängigkeit.

### 🚀 Paket B: Erweiterte Access-Migration via `mdbtools` (Mac/Linux Support)
* **Ziel:** Beseitigung der reinen Windows-Abhängigkeit bei der Access-Migration.
* **Technologie:** Kompilierung von `mdb-tools` nach WebAssembly (WASM), sodass `.mdb`/`.accdb` direkt im Browser auf jedem Betriebssystem ausgelesen werden können.

### 🚀 Paket C: Docker & One-Click Cloud Stack
* **Ziel:** Schließen der Lücke zwischen Code-Export und produktivem Hosting.
* **Technologie:** Bereitstellung von schlüsselfertigen Docker-Stacks inklusive Let's Encrypt SSL, PostgreSQL 16 und Nginx/Caddy Reverse Proxy.

---

## 5. Fazit & Handlungsempfehlung

1. **Stärken maximieren:** DB Studio Pro ist im Bereich relationale Modellierung, branchenspezifischer Code-Export (GAEB, VOB, E-Rechnung) und Offline-Autonomie **herausragend aufgestellt**.
2. **Transparenz beibehalten:** Die „Be Honest“-Methode schafft extremes Vertrauen bei Entwicklern und Entscheidern, da Grenzen offen benannt werden, anstatt falsche Versprechungen zu machen.
3. **Fokus der nächsten Version (v0.9.0 -> v1.0):**
   * Native Excel `.xlsx` Im-/Export Engine integrieren.
   * Docker-Stack-Generierung für schlüsselfertiges Hosting bereitstellen.
   * `mdbtools` WASM Engine prüfen, um Access-Migration plattformunabhängig zu machen.



---

<a id="paket1-paket5-umsetzung"></a>
# paket1 paket5 umsetzung

> **Originaldatei:** `docs/paket1_paket5_umsetzung.md`

# 🚀 DB Studio Pro: Umsetzung Paket 1 & Paket 5 (100% Single-Developer Autonomie)

Dieses Dokument beschreibt die Architektur und Verwendung der beiden Kernpakete zur Realisierung der **100%igen Local-First- und Single-Developer-Autonomie** in DB Studio Pro.

---

## 🟡 Übersicht der umgesetzten Pakete

| Paket | Bezeichnung | Kernfunktion | Autarkie-Level |
| :--- | :--- | :--- | :--- |
| **Paket 1** | **SQLite WASM Binary I/O Engine** | Direktes Öffnen, Abfragen & Abspeichern von `.sqlite`/`.db` Dateien im Browser ohne C#-Bridge | **100% Offline (WASM)** |
| **Paket 5** | **AST Plugin System & Lokaler Ollama Copilot** | Modulare Code-Generierung (Go, Python, Rust, C#) & lokale KI-Unterstützung via Ollama (11434) | **100% Offline (Local Daemon / Heuristik)** |

---

## 📦 Paket 1: SQLite WASM Binary I/O Engine

### 1. Technische Architektur (`/services/sqliteWasmEngine.ts`)
- **WebAssembly SQL Engine**: Basiert auf `sql.js` (SQLite kompiliert zu WebAssembly).
- **Direct File System Access API**:
  - Ermöglicht das direkte Speichern von `.sqlite`-Dateien auf die lokale Festplatte via `window.showSaveFilePicker`.
  - Intelligenter Fallback auf Browser-Download (`blob:`) für alle Plattformen.
- **Transpilation ins Projekt**:
  - Parst das Tabellen-Schema (`PRAGMA table_info`, `sqlite_master`) direkt in das interne DB Studio Schema-Format (`Table`, `Field`, Datentypen).
  - 1-Klick-Übernahme in den Tabellen-Designer, Abfrage-Designer und Berichts-Designer.

### 2. SQLite WASM Studio Modal (`/features/backend/sqlite/SqliteWasmStudioModal.tsx`)
- **Drag & Drop Upload**: Laden Sie beliebige `.sqlite`, `.db` oder `.sqlite3` Dateien direkt in den Speicher.
- **Tabellen-Inspektor**: Zeigt Spalten, Primärschlüssel, Datentypen, Not-Null Constraints und das Original-DDL-Statement.
- **Interaktiver SQL-Editor**: Führen Sie beliebige `SELECT`, `PRAGMA` oder DDL-Abfragen direkt gegen die WASM-Instanz aus.
- **Aufrufbar über**:
  - Backstage -> **Öffnen** -> *SQLite WASM Studio*
  - Backstage -> **Über DB Studio** -> Checkliste *SQLite WASM & IndexedDB Persistenz*

---

## 📦 Paket 5: AST Plugin System & Lokale Ollama Copilot

### 1. AST Code Generator Plugin Registry (`/features/generators/astPluginRegistry.ts`)
Modulare Plugin-Schnittstelle (`ICodeGenPlugin`) für dynamisch registrierbare Code-Generatoren:

1. **Go GORM Plugin (`GoGormPlugin`)**:
   - Generiert idiomatische Go-Structs mit `gorm:"column:...;primaryKey"` und `json:"..."` Tags.
   - Erzeugt automatische `AutoMigrateAll(db *gorm.DB)` Helper-Funktionen.
2. **Python SQLAlchemy 2.0 & Pydantic v2 (`PythonSqlAlchemyPlugin`)**:
   - Generiert typisierte `DeclarativeBase` Models (`Mapped[...] = mapped_column(...)`).
   - Erzeugt Pydantic v2 Schemas (`BaseModel`, `ConfigDict(from_attributes=True)`) für FastAPI.
3. **Rust Diesel & SQLx Plugin (`RustDieselPlugin`)**:
   - Generiert `#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]` Structs.
   - Erzeugt compile-time typisierte `diesel::table!` Schemas.
4. **C# Entity Framework Core 8 Plugin (`CSharpEfCorePlugin`)**:
   - Generiert POCO-Klassen mit `[Table]`, `[Key]`, `[Column]`, `[MaxLength]`.
   - Erzeugt `ApplicationDbContext` mit stark typisierten `DbSet<T>` Eigenschaften.

### 2. AST Plugin Generator UI (`/features/generators/PluginGeneratorModal.tsx`)
- 1-Klick Auswahl des Ziel-Stacks (Go, Python, Rust, C#).
- Multi-File Vorschau mit Syntax-Highlighting und Einzel-Download oder Clipboard-Kopieren.

### 3. Lokale Ollama Copilot Service (`/services/localOllamaService.ts`) & UI (`/features/ai/components/LocalOllamaCopilotModal.tsx`)
- **Lokale Schnittstelle**: Verbindet sich mit `http://localhost:11434` (Standard Ollama Port) oder LM Studio (`http://localhost:1234`).
- **Modell-Discovery**: Fragt `/api/tags` ab und listet lokal installierte Modelle (`llama3`, `mistral`, `codellama`, `qwen2.5-coder`) auf.
- **Zero-Cloud-Garantie**: Keine Daten oder Metadaten verlassen das System.
- **Offline-Heuristik Fallback**: Sollte kein lokaler Daemon aktiv sein, greift DB Studio Pro auf integrierte Regel-Heuristiken zurück, um trotzdem konsistente SQL-Statements zu generieren.

---

## 🔍 Schnelle Überprüfung & Integration

- **Code-Generierung testen**: Öffnen Sie das Backstage-Menü (**Datei** / Menüleiste) -> **Über DB Studio** -> **Architektur-Deep-Dive** -> Klick auf **`AST Plugin Hub`** oder **`Lokaler Ollama Copilot`**.
- **SQLite WASM testen**: Öffnen Sie **Datei** -> **Öffnen** -> Klick auf **`Studio öffnen`** im SQLite WASM Kasten.



---

<a id="roadmaps-pakete-2-3-4"></a>
# roadmaps pakete 2 3 4

> **Originaldatei:** `docs/roadmaps_pakete_2_3_4.md`

# 🗺️ Roadmap & Spezifikation: Pakete 2, 3 und 4 (Phase 2 Vorbereitung)

Dieses Dokument enthält die vollständige Spezifikation, Architekturvorgaben und Umsetzungspläne für die **Pakete 2, 3 und 4** im Rahmen der **Local-First & Single-Developer-Autonomie** von DB Studio Pro.

---

## 📋 Übersicht der Pakete

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  PAKET 2: Entkoppelte BaaS Plug-in Architektur (Supabase & PocketBase)                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  PAKET 3: Multi-User Live-Kollaboration via CRDTs (P2P / LAN / WebRTC)                 │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  PAKET 4: Native Mobile Companion Wrapper (Capacitor & Tauri Scaffolding)              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 PAKET 2: Entkoppelte BaaS Plug-in Architektur (Supabase & PocketBase)

### 🎯 Ziel
Vollständige Entkopplung von Backend-as-a-Service (BaaS) Anbietern. Der Entwickler kann mit 1 Klick DDL-Migrationen, Schemas und Row Level Security (RLS) Richtlinien für **Supabase** (PostgreSQL) und **PocketBase** (Self-Hosted SQLite) exportieren, **ohne dass das Kernsystem jemals eine feste Cloud-Abhängigkeit hat**.

### 🧩 Geplante Module & Dateien
1. **Interface Definition:** `/types/cloudProvider.ts`
   ```typescript
   export interface ICloudSyncProvider {
     id: 'supabase' | 'pocketbase';
     name: string;
     generateSchemaMigration(tables: Table[], relations: Relationship[]): string;
     exportSchemaConfig(tables: Table[]): Record<string, any>;
     generateRlsPolicies(tables: Table[]): string;
   }
   ```
2. **Supabase DDL & RLS Plugin:** `/features/backend/plugins/supabasePlugin.ts`
   - Generierung von `CREATE TABLE`, `ALTER TABLE ... ADD CONSTRAINT FOREIGN KEY`, Enums und PostgreSQL-Indizes.
   - Automatische Erstellung von Standard-RLS-Policies:
     ```sql
     ALTER TABLE projekte ENABLE ROW LEVEL SECURITY;
     CREATE POLICY "Eigene Projekte lesen" ON projekte FOR SELECT USING (auth.uid() = ersteller_id);
     ```
3. **PocketBase Schema JSON Exporter:** `/features/backend/plugins/pocketbasePlugin.ts`
   - Erzeugt konformes `pb_schema.json` zur direkten Wiederherstellung in lokalen Self-Hosted PocketBase-Instanzen via `./pocketbase migrate`.
4. **UI-Dialog:** `/features/backend/plugins/BaaSExportModal.tsx`
   - Export-Dialog mit Syntax-Highlighting und 1-Klick-Download von `schema.sql` und `pb_schema.json`.

---

## 📦 PAKET 3: Multi-User Live-Kollaboration via CRDTs (P2P / LAN)

### 🎯 Ziel
Ermöglicht mehreren Entwicklern oder Bauleitern im selben lokalen Netzwerk (LAN / Baustellen-WLAN) ohne zentralen Cloud-Server gemeinsam an Formularen, Daten-Grids und Schemas zu arbeiten. Konflikte werden mathematisch über CRDTs (Conflict-free Replicated Data Types) aufgelöst.

### 🧩 Geplante Module & Dateien
1. **CRDT Datenmodell & Verträge:** `/types/crdtContracts.ts`
   - Definition von kollaborativen Yjs-Datenstrukturen (`Y.Doc`, `Y.Map` für Formulareigenschaften, `Y.Array` für Grid-Zeilen).
   - Awareness-Protokoll für Remote-Cursor und aktive Bearbeitungs-Markierungen.
2. **P2P WebRTC / BroadcastChannel Signal-Adapter:** `/services/crdtLocalPeerSimulator.ts`
   - Lokaler Peer-to-Peer Kanal (unterstützt Multi-Tab-Sync via `BroadcastChannel` und lokales LAN via WebRTC Data Channels).
3. **Kollaboratives Locking & Cursor-Rendering:** `/features/collaboration/components/CollaborativeCanvasOverlay.tsx`
   - Visuelle Anzeige von Remote-Nutzern im Formular-Designer (farbige Rahmen bei aktuell bearbeiteten Feldern).

---

## 📦 PAKET 4: Native Mobile Companion Wrapper (Capacitor & Tauri)

### 🎯 Ziel
1-Klick Scaffolding für mobile Begleit-Apps (Tablets und Smartphones für Baustellen-Dokumentation, Mängelverfolgung und Bautagebücher) mit vollem Offline-Support, Zugriff auf Gerätekamera und lokaler SQLite-Persistenz.

### 🧩 Geplante Module & Dateien
1. **Scaffold Generator Service:** `/features/generators/mobileScaffoldGenerator.ts`
   - Erzeugt ein vollständiges, kompilierbares Projektverzeichnis als `.zip`:
     - `capacitor.config.json` mit App-ID, Permissions (Kamera, Geolocation, Storage).
     - `tauri.conf.json` für schlanke Desktop-/Mobile-Cross-Platform-Builds mit Rust.
     - `package.json` mit `@capacitor/core`, `@capacitor/camera`, `@capacitor-community/sqlite`.
     - Vorkonfigurierte `src/index.html` und Service Worker für echten PWA- & Offline-Betrieb.
2. **Mobile Export & Build Guide Modal:** `/features/generators/MobileWrapperExportModal.tsx`
   - Schritt-für-Schritt-Anleitung für `npx cap sync android` und `npx cap run ios`.
   - Download des fertigen Mobile-Projekts.

---

## 📊 Status-Übersicht

| Paket | Name | Kernfokus | Status |
| :--- | :--- | :--- | :--- |
| **Paket 1** | SQLite WASM Binary I/O Engine | 100% Offline SQLite `.sqlite` Direct I/O | ✅ **Fertiggestellt & Integriert** |
| **Paket 5** | AST Plugin Hub & Lokaler Ollama Copilot | Go, Python, Rust, C# & Lokale KI | ✅ **Fertiggestellt & Integriert** |
| **Paket 2** | Entkoppelte BaaS Plug-in Architektur | Supabase DDL + RLS & PocketBase Export | ✅ **Vorbereitet & Entkoppelt (Zero-Coupling Plugin)** |
| **Paket 3** | Multi-User Live-Kollaboration (CRDTs) | P2P / LAN Multi-Tab Sync & Field-Locking | ✅ **Vorbereitet & Entkoppelt (Serverless P2P)** |
| **Paket 4** | Native Mobile Companion Scaffolding | Capacitor & Tauri Mobile Wrapper Scaffolding | ✅ **Vorbereitet & Entkoppelt (1-Click Generator)** |



---

<a id="credentials"></a>
# CREDENTIALS

> **Originaldatei:** `docs/CREDENTIALS.md`

# Test Zugangsdaten für das DB Studio

Um die verschiedenen Rollen und System-Einstellungen zu testen, können folgende Zugangsdaten verwendet werden:

## 1. Administrator
Ermöglicht den Zugriff auf die **System-Einstellungen** (API-Modus, Speicherziel) sowie alle Chat- und Ticket-Funktionen.

- **E-Mail:** `admin@demo.com`
- **Passwort:** `admin123`

## 2. Standard-Benutzer
Ermöglicht den Zugriff auf Chat und Tickets, hat jedoch **keinen** Zugriff auf die System-Einstellungen.

- **E-Mail:** `user@demo.com` (oder eine beliebige andere E-Mail)
- **Passwort:** `user123`

---

### System-Verhalten
- **Nicht angemeldet:** Chat, Tickets und Cloud-Projekte sind deaktiviert bzw. ausgeblendet.
- **Speicher-Modi:** Kann in den Einstellungen zwischen `Local (Browser)` und `Server / App` umgeschaltet werden (nur Admin).
- **API-Modi:** Kann zwischen `DEMO` und `PRODUKTIV` gewechselt werden (nur Admin).



---

<a id="test-credentials"></a>
# TEST CREDENTIALS

> **Originaldatei:** `docs/TEST_CREDENTIALS.md`

# DB Studio Pro - Test Credentials

Dieses Dokument enthält die Standard-Anmeldedaten (Credentials) für Testzwecke in **DB Studio Pro**.

Die Zugangsdaten sind sowohl im lokalen IndexedDB-Benutzerspeicher (`sys_users` / `users`) als auch als direktes Fallback im Authentifizierungssystem hinterlegt.

---

## 1. Standard-Benutzerkonten (Standard Accounts)

Die folgenden Benutzerkonten sind standardmäßig registriert und verfügen über unterschiedliche Berechtigungsrollen:

| Benutzername | Passwort | E-Mail | Rolle (Role) | Berechtigungsstufe |
| :--- | :--- | :--- | :--- | :--- |
| **admin** | `admin` oder `admin123` | `admin@demo.com` | **Admin** | Administrator (Voller Zugriff, Einstellungen sichtbar) |
| **manager** | `manager123` | `manager@demo.com` | **Manager** | Projektmanager (Verwaltung von Schemata) |
| **editor** | `editor123` | `editor@demo.com` | **Editor** | Redakteur (Bearbeitung von Daten) |
| **user** | `user` oder `user123` | `user@demo.com` | **User** | Standardnutzer (Nur Lesezugriff) |

---

## 2. Datenbank-Integration & Struktur

Sämtliche Benutzerkonten werden bei Aktivierung des Benutzer-Logins automatisch in der Tabelle `sys_users` (bzw. dem IndexedDB-Store `sys_users`/`users`) mit entsprechenden Passwort-Hashes, Rollen und Aktivitätsstatus initialisiert.

- **Verschlüsselung / Casing:** Die API sucht flexibel und case-insensitiv nach Spaltenbezeichnungen wie `Username`, `PasswordHash`, `RoleId` und `IsActive`, um maximale SQL/MySQL-Kompatibilität zu garantieren.
- **Rollensystem:**
  - `RoleId: 1` &rarr; Admin
  - `RoleId: 2` &rarr; Manager
  - `RoleId: 3` &rarr; Editor
  - `RoleId: 4` &rarr; User



---

