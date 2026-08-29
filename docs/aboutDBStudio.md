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

## 🚧 9. Ehrliche Roadmap: Was noch gemacht werden muss („To-Do & In Progress“)

Im Sinne der **Be-Honest-Philosophie** folgt hier der transparente Arbeitskatalog der noch offenen Punkte bis zum Erreichen der finalen Version `1.0 Gold`:

### 🟡 Kurzfristig (v0.9.0):
- [ ] **Erweiterter OLEDB-Fallback für exotische Access-Datentypen:** Tiefere Typenabdeckung für historische Sonderdatentypen (z. B. komplexe OLE-Grafikobjekte, alte binäre Anlagen und Rich-Text-Memos).
- [ ] **Interaktives Drag-&-Drop Canvas im Report Designer:** Ergänzung des bandbasierten Report-Designers um Pixel-genaue Freiform-Positionierung von Barcodes, QR-Codes und Unterschriftsfeldern.
- [ ] **Vollautomatische End-to-End Test-Suite für generierte Projekte:** Ein Klick im Export-Center soll automatisch `npm test` bzw. `dotnet test` in einer isolierten Bridge-Sandbox ausführen.
- [ ] **Erweiterte Validierung bei GAEB DA XML 3.3:** Schema-Validierung gegen offizielle XSD-Schemadateien zur Prüfung von Bietertextergänzungen vor dem Export.

### 🔵 Mittelfristig (v1.0 Gold):
- [ ] **Multi-User Live-Kollaboration via CRDTs:** Integration von Yjs/WebRTC für gleichzeitiges kollaboratives Arbeiten im Formulareditor und Datengrid.
- [ ] **Native Mobile Companion App:** Bereitstellung von vorkonfigurierten Capacitor/React Native Wrappern für iOS- und Android-App-Stores.
- [ ] **Direkte Cloud-Synchronisation für Supabase & PocketBase:** Vorgefertigte Adapter zum 1-Klick Schema-Push auf moderne BaaS-Anbieter.

### 🟣 Langfristig (v1.1+):
- [ ] **Erweitertes Plugin-System:** Entwickler können eigene AST-Code-Generatoren für Go, Rust oder Python FastAPI als Plugins einbinden.

---

## 🎯 10. Fazit

**DB Studio Pro** schließt die Lücke zwischen der enormen Produktivität visueller Rapid-Application-Development-Werkzeuge und der Zukunftsfähigkeit moderner Open-Source-Technologien. 

Es bietet Entwicklern, Handwerksbetrieben, Freelancern und IT-Teams maximale Umsetzungsgeschwindigkeit beim Entwerfen von Datenbanken und Business-Anwendungen – gepaart mit vollständiger Transparenz, aktiver Weiterentwicklung und uneingeschränktem Quellcode-Eigentum.
