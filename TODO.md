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
- [x] **Gesteuerte Feld-Validierung & Formular-Ereignisse (Event Handler)**
- [x] **VBA-Ersatz durch JS-Event Engine**
- [x] **MDB / ACCDB Schema-Import-Assistent & SQL Dialekt Konverter**
- [x] **Audit Trail & Spaltenbezogene Rollenrechte (RBAC)**

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

---

*Letzte Aktualisierung: Juli 2026 • DB Studio Pro Engineering Team*
