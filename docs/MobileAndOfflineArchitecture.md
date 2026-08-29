# Mobile & Offline-First Architektur – Baustellen- & Bautagebuch-Blueprint
**System: Enterprise Bausoftware & Vor-Ort-Erfassung (Mobile & Offline-First)**  
*Status: Architektur-Spezifikation, Sync-Protokoll & Implementierungs-Checkliste*

---

## 📑 Inhaltsverzeichnis
1. [🟢 1. Herausforderungen auf der Baustelle (Funkloch & Robustheit)](#-1-herausforderungen-auf-der-baustelle-funkloch--robustheit)
2. [💾 2. Lokale Speicherung & IndexedDB Cache-Architektur](#-2-lokale-speicherung--indexeddb-cache-architektur)
3. [🔄 3. Bidirektionale Datensynchronisation & Konfliktlösung](#-3-bidirektionale-datensynchronisation--konfliktlösung)
4. [📱 4. Progressive Web App (PWA) & Service Worker Lifecycle](#-4-progressive-web-app-pwa--service-worker-lifecycle)
5. [📷 5. Foto-, Sprach- & Unterschriften-Erfassung vor Ort](#-5-foto--sprach---unterschriften-erfassung-vor-ort)
6. [📅 6. Priorisierte Umsetzungs-Checkliste & Roadmap](#-6-priorisierte-umsetzungs-checkliste--roadmap)

---

## 🟢 1. Herausforderungen auf der Baustelle (Funkloch & Robustheit)

Auf Baustellen ist die Netzabdeckung oft unvollständig (Kellergeschosse, Neubaugebiete, Tiefgaragen). Die Anwendung muss daher:
- **100% Offline-funktionsfähig** für Kernaufgaben sein (Bautagebuch schreiben, Mängel fotografieren, Zeiten buchen, Aufmaße erfassen).
- Alle Eingaben sofort lokal und unzerstörbar speichern.
- Automatisch synchronisieren, sobald wieder Netzempfang (WLAN/LTE) besteht.

---

## 💾 2. Lokale Speicherung & IndexedDB Cache-Architektur

- [x] **Dexie.js / IndexedDB Storage Engine**:
  - Lokale Replikation relevanter Tabellen: `local_daily_reports`, `local_defects`, `local_time_trackings`, `local_projects`.
- [x] **Outbox-Muster (Transaktions-Warteschlange)**:
  - Jede Schreibaktion wird als Mutation in `local_outbox_queue` geschrieben:
    ```typescript
    interface OutboxItem {
      id: string;
      table: string;
      operation: 'INSERT' | 'UPDATE' | 'DELETE';
      recordId: string;
      payload: any;
      createdAt: number;
      retryCount: number;
      status: 'PENDING' | 'SYNCING' | 'FAILED' | 'CONFLICT';
    }
    ```

---

## 🔄 3. Bidirektionale Datensynchronisation & Konfliktlösung

### 3.1 Synchronisations-Zyklus
- [x] **Automatischer Background-Sync**:
  - Erkennt Online-Status via `navigator.onLine` und `window.addEventListener('online', ...)`.
  - Batch-Versand aller anstehenden Einträge der Outbox an den Server (`POST /api/sync/push`).
  - Abruf neuer Server-Änderungen seit dem letzten Sync-Zeitstempel (`GET /api/sync/pull?since=...`).

### 3.2 Konfliktlösungs-Strategien
- [x] **Last-Write-Wins (LWW)** für einfache Felder (z. B. Notizen, Wetterdaten).
- [x] **Feld-Level Merge (Three-Way-Merge)**: Wenn Bauleiter A das Wetter und Bauleiter B die Kolonnenstärke bearbeitet, werden beide Änderungen zusammengeführt.
- [x] **Konflikt-Dashboard für Benutzer**: Visuelle Gegenüberstellung bei unauflösbaren Versionskollisionen (`ConflictResolutionModal`).

---

## 📱 4. Progressive Web App (PWA) & Service Worker Lifecycle

- [x] **Web App Manifest (`manifest.webmanifest`)**:
  - Installierbar als native App auf iOS, Android, Windows und macOS.
  - App-Icons, Start-URL, Standalone-Display-Modus.
- [x] **Workbox & Offline Cache**:
  - `CacheFirst` für statische Assets (HTML, JS, CSS, Schriftarten, Icons).
  - `NetworkFirst` / `StaleWhileRevalidate` für Schema-Definitionen.
- [x] **Offline-Indikator & Sync-Badge**:
  - Statusanzeige im Header: 🟢 Online (Synchronisiert) | 🟡 Offline (Funkloch-Modus) | 🔵 Synchronisiere...

---

## 📷 5. Foto-, Sprach- & Unterschriften-Erfassung vor Ort

- [x] **Client-Side Foto-Komprimierung**:
  - Direkte Skalierung von 12MP Smartphone-Fotos auf max. 1920x1080px JPEG/WebP direkt im Browser vor dem Speichern in IndexedDB (`photoCompressionUtil.ts`).
  - Verhindert das Volllaufen des Gerätespeichers.
- [x] **Foto-Annotationen & Plan-Verortung**:
  - Markierungen (Pfeile, Kreise, Text) direkt auf dem Baustellenfoto zeichnen.
  - Pin auf dem digitalen Bauplan platzieren (`LocationPlanPin`).
- [x] **Digitale Unterschrift (Signatur-Pad)**:
  - HTML5 Canvas Unterschrift für Tagesberichte und Stundenlohnzettel mit Zeitstempel und Vektorspeicherung.
- [x] **Sprach-zu-Text (Speech-to-Text)**:
  - Diktierfunktion für Bautagebuch-Notizen via Web Speech API (`speechToTextUtil.ts`).

---

## 📅 6. Priorisierte Umsetzungs-Checkliste & Roadmap

- [x] **Phase 1: IndexedDB Outbox Engine**:
  - [x] IndexedDB Schema-Definition für Bautagebuch und Mängel.
  - [x] Lokale Speicherung und Mutations-Warteschlange.
- [x] **Phase 2: Sync-Pipeline & Server-Endpunkte**:
  - [x] Push/Pull Sync-Handler mit Zeitstempel-Verwaltung.
  - [x] Online/Offline Event-Listener und Auto-Sync.
- [x] **Phase 3: PWA Manifest & App-Installation**:
  - [x] Service Worker Caching für unterbrechungsfreien Offline-Start.
- [x] **Phase 4: Baustellen-Features (Kamera, Kompression, Signatur)**:
  - [x] Foto-Upload mit Client-Kompression und Plan-Pinning.
  - [x] Digitales Unterschriften-Pad für Bauabnahmen.

