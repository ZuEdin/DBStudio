# DB Studio Pro – Master Roadmap & Entwicklungs-TODO (100% Gold Master)

> **Aktueller Gesamtreifegrad:** ~83.3%  
> **Ziel:** 100% Enterprise Gold Master Status  
> **Fokus:** Höchste Zuverlässigkeit, DACH-Konformität, Multi-DB-Architektur & Desktop-Betrieb

---

## 📊 Modul-Status & Reifegrad-Matrix

| Nr. | Modul / Bereich | Ist-Status | Ziel | Priorität |
|:---:|:---|:---:|:---:|:---:|
| 1 | **Local Bridge Daemon (v0.9.2)** | 75% | 100% | 🔴 Hoch |
| 2 | **Visuelle Workflow- & Automatisierungs-Engine (BPMN)** | 78% | 100% | 🔴 Hoch |
| 3 | **Offline-Sync & Outbox-Pattern** | 80% | 100% | 🟡 Mittel |
| 4 | **Berichts- & Druck-Engine (Banded Reports)** | 82% | 100% | 🟡 Mittel |
| 5 | **GAEB DA XML & DATANORM 5.0** | 85% | 100% | 🔴 Hoch |
| 6 | **ZUGFeRD 2.2 & E-Rechnungen (EN 16931)** | 85% | 100% | 🟢 Abgerundet |
| 7 | **Visueller QBE SQL Abfrage-Designer** | 85% | 100% | 🟢 Abgerundet |
| 8 | **Code-Generierungs-Engine & Desktop-Build** | 85% | 100% | 🟡 Mittel |
| 9 | **Formular-Studio & Subforms** | 88% | 100% | 🟢 Abgerundet |
| 10 | **In-Browser Tabellen- & Schema-Designer** | 90% | 100% | 🟢 Stabil |

---

## 🛠️ Detaillierte Aufgabenliste nach Modulen

### 1. 🔌 Local Bridge Daemon (75% ➔ 100%)
- [ ] **Auto-Reconnect & Heartbeat:**
  - WebSocket-Verbindung mit exponentiellem Backoff bei Verbindungsunterbrechung.
  - Automatisches Health-Check Ping/Pong alle 5 Sekunden mit visueller Latenzanzeige im UI.
- [ ] **MDB / ACCDB File-Locking Schutz:**
  - Erkennung von `.ldb` / `.laccdb` Sperrdateien bei paralleler Nutzung von MS Access.
  - Saubere Dialogmeldung statt unkontrolliertem Prozessabbruch bei Lese-/Schreibkonflikten.
- [ ] **Direct-Query Passthrough:**
  - Streaming-Abfragen über 64-Bit ACE/OLEDB-Treiber ohne vollständige Speicherbelastung im Browser-RAM.
  - Sicheres Escaping von Access-spezifischen Schlüsselwörtern.

---

### 2. ⚡ Workflow- & Automatisierungs-Engine (78% ➔ 100% ✅ Abgeschlossen)
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

### 3. 🔄 Offline-Sync & Outbox-Pattern (80% ➔ 100%)
- [ ] **Background Sync API Integration:**
  - Automatisches Leeren der IndexedDB-Outbox via Service Worker bei wiederkehrender Netzwerkverbindung.
- [ ] **Payload-Kompression:**
  - Brotli/Gzip-Kompression für Offline-Pakete (z. B. Baustellenfotos, PDF-Dokumente) vor der Übertragung.
- [ ] **CRDT-Konfliktbereinigung auf Feldebene:**
  - Automatisches Mergen geänderter Datensätze ohne Benutzerdialog, wenn unterschiedliche Spalten modifiziert wurden.

---

### 4. 🖨️ Berichts- & Druck-Engine (100% ✅)
- [x] **Mehrseitige Gruppen-Umbruchsregeln:**
  - Striktes „Zusammenhalten“ (*KeepTogether*) von Tabellenzeilen, Unterberichten und Gruppenabschlüssen über Seitenränder hinweg.
  - Konfigurierbares „Auf neuer Seite beginnen“ für Hauptkategorien und Kostenstellen.
- [x] **ESC/POS Thermo-Bondrucker Integration:**
  - Natives Senden von Raw-ESC/POS-Steuerzeichen an 58mm und 80mm Thermo-Drucker (USB, Web Serial, Bluetooth & Netzwerk).
- [x] **Vektorgrafik-Einbettung (SVG) in PDF/A:**
  - Skalierbare Firmenlogos und Vektorsignaturen ohne Raster-Verluste direkt im PDF/A-3b Dokument einbetten.

---

### 5. 🏗️ GAEB DA XML & DATANORM (85% ➔ 100%)
- [ ] **Strukturierter GAEB XML 3.3 Re-Export:**
  - Erzeugung valider GAEB XML-Dateien für Phase **X83** (Angebotsaufforderung) und **X84** (Angebotsabgabe).
  - Schema-Validierung gegen offizielle GAEB DA XML 3.3 XSD-Schemata.
- [ ] **DATANORM 5.0 Rabattstaffel-Matrix:**
  - Automatische Verrechnung von 10-stufigen Warengruppen-Rabatten und Teuerungszuschlägen in der Positionskalkulation.

---

### 6. 💼 ZUGFeRD 2.2 & E-Rechnungen (85% ➔ 100%)
- [ ] **Erweiterte EN 16931 Validierungsregeln:**
  - Ergänzung branchenspezifischer Schematron-Regeln für Bauleistungen (z. B. §13b UStG Steuerschuldnerschaft des Leistungsempfängers).
  - Automatische Überprüfung der Leitweg-ID für B2G-Portale (ZRE / OZG-RE).

---

### 7. 🖥️ DevOps, Desktop-Build & Code-Generierung (85% ➔ 100%)
- [ ] **1-Klick Tauri 2.0 / Electron Package:**
  - Generierung sofort ausführbarer Windows `.exe` / `.msi` Installer und macOS `.dmg` Bundles ohne Terminal-Befehle.
- [ ] **Erweiterte C# .NET 10 & Entity Framework Core Generierung:**
  - Automatische Erstellung von Migrations-Klassen (`DbContext`, Fluent API Mappings und Seed-Dateien).

---

### 8. 📝 Formular-Studio & Tabellen-Designer (100%)
- [x] **Echtzeit-Regex-Validierungsregeln:**
  - Benutzerdefinierte Validierungsausdrücke für Eingabefelder mit sofortigem Inline-Feedback im Formular.
- [x] **Automatische Normalisierungs-Empfehlungen (3NF):**
  - Assistent erkennt redundante Datenfelder und schlägt automatische Tabellen-Splits mit 1:n-Fremdschlüsseln vor.
