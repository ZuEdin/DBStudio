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
- [ ] **1. C# .NET 10 EF Core & FastEndpoints / Minimal APIs:**
  - Vollständige Solution mit **Clean Architecture** (Domain, Application, Infrastructure, API).
  - Entity Framework Core DbContext, Fluent API Mappings, Repositories, CQRS mit MediatR, FluentValidation, Swagger / Scalar OpenAPI und xUnit Test-Suite.
  - Native AOT Kompilierungskompatibilität für blitzschnelle Container-Starts.
- [ ] **2. Node.js (Express, Fastify & NestJS):**
  - Typsicheres TypeScript-Projekt wahlweise mit **Drizzle ORM**, **Prisma** oder **Kysely**.
  - Zod-Schema-Validierung, JWT / Cookie-Auth, Role-Guards, Rate-Limiter und automatische Swagger-UI Dokumentation.
- [ ] **3. PHP 8.3 / 8.4 PDO & Laravel 11 / Symfony 7:**
  - Moderne PHP-Struktur mit Repositories, PHP 8 Attributes (`#[Route]`, `#[Validate]`), Form Requests, API Resources und optionalen **Filament v3** Admin-Panels.
  - Integration von PHPStan (Level 8) und Pest PHP Tests.
- [ ] **4. Python FastAPI & SQLAlchemy 2.0 / Pydantic v2:**
  - Asynchrone Python-API mit Pydantic v2 Datenvalidierung, SQLAlchemy 2.0 Async-Session, Alembic-Migrationen und automatischer `/docs` Swagger-Generierung.
  - Pytest Test-Suite mit Testcontainers.

### 🌐 B. Moderne Frontend Frameworks & Single Page Applications
- [ ] **1. React 19 + Tailwind CSS + TanStack Query v5:**
  - Modernste React 19 Patterns (Actions, `use()`, Server Components ready), TanStack Query v5 mit automatischem Caching und Invalidierung, Zustand State-Management und React Hook Form + Zod.
  - Barrierefreie Headless UI / Radix Primitives für alle Controls.
- [ ] **2. Angular 19 Standalone Signals & SignalStore:**
  - 100% Zoneless Standalone Components, Angular Signals, Resource API, Reactive Forms, Tailwind CSS Integration und NgRx SignalStore.
- [ ] **3. Vue 3.5 + Pinia + VeeValidate:**
  - Composition API (`<script setup lang="ts">`), Pinia Stores mit optimierter Reaktivität und unplugin-vue-components.
- [ ] **4. Svelte 5 mit Runes (`$state`, `$derived`, `$props`):**
  - Ultraschnelles, schlankes Svelte 5 Frontend mit nativer Runes-Reaktivität.

### 🔌 C. CMS & Enterprise Plugin Generatoren (WordPress & Nextcloud)
- [ ] **1. WordPress Plugin Generator (Modern PHP & Block Editor):**
  - Generierung eigener Custom Post Types (CPTs), benutzerdefinierter Tabellen mit `$wpdb`, REST API Endpunkten (`/wp-json/my-app/v1/`), Gutenberg Block-Komponenten und WP-Admin Einstellungsseiten.
  - Optionale Integration mit WooCommerce Hooks & Filter.
- [ ] **2. Nextcloud OCP App Generator:**
  - Vollständige Nextcloud App mit `appinfo/info.xml`, OCP QueryBuilder Services, PSR-konformen Controllern, Vue 3 `@nextcloud/vue` Frontend und automatischen `ISchemaWrapper` Migrationen.

### 🏗️ D. Architektur-Qualität, API Docs & DevOps
- [ ] **1. OpenAPI 3.1 & Postman / Bruno Collections:**
  - Automatische Generierung vollständiger `openapi.json` / `openapi.yaml` Dokumentationen und sofort importierbarer Postman/Bruno API-Collections für alle CRUD-Endpunkte.
- [ ] **2. Containerisierung & CI/CD Pipelines:**
  - Generierung von optimierten Multi-Stage `Dockerfile`, `docker-compose.yml` (App + DB + Redis) und GitHub Actions CI/CD Workflows (Lint, Test, Build, Deploy).
- [ ] **3. Automatische Unit- & Integrations-Tests:**
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

