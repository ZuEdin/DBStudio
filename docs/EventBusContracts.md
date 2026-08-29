# Event-Bus & Cross-MFE Kommunikation – Architektur- & Payload-Blueprint
**System: Enterprise Bausoftware & Kalkulation (MFE-Architektur: Shell, CRM, Articles, Calc, Billing)**  
*Status: Schnittstellenspezifikation, Payload-Verträge & Implementierungs-Checkliste*

---

## 📑 Inhaltsverzeichnis
1. [🟢 1. Architektur-Prinzipien & Entkopplung](#-1-architektur-prinzipien--entkopplung)
2. [📡 2. Event-Bus Infrastruktur & Lifecycle](#-2-event-bus-infrastruktur--lifecycle)
3. [📋 3. Standardisierte Event-Payload Typdefinitionen](#-3-standardisierte-event-payload-typdefinitionen)
4. [🔄 4. MFE-spezifische Event-Verträge (Domain Contracts)](#-4-mfe-spezifische-event-verträge-domain-contracts)
5. [🖱️ 5. Cross-MFE Drag & Drop Protokoll](#️-5-cross-mfe-drag--drop-protokoll)
6. [🗄️ 6. Globaler Cache-, State- & Schema-Sync](#️-6-globaler-cache--state---schema-sync)
7. [🛡️ 7. Fehlerbehandlung, Timeouts & Dead-Letter-Handling](#️-7-fehlerbehandlung-timeouts--dead-letter-handling)
8. [📅 8. Implementierungs-Checkliste & Phasenplan](#-8-implementierungs-checkliste--phasenplan)

---

## 🟢 1. Architektur-Prinzipien & Entkopplung

- [x] **Strikte Isolation**: Frontends importieren niemals Quellcode direkt voneinander.
- [x] **Asynchrone Entkopplung**: Kommunikation erfolgt ausschließlich über den typisierten globalen Event-Bus.
- [x] **Vertragstreue (Contract-First)**: Jedes Event besitzt ein unveränderliches Payload-Schema mit Versionierung (`v1`, `v2`).
- [x] **Kein direkter DOM-Zugriff**: Keine Abhängigkeiten auf DOM-Elemente anderer Micro Frontends.

---

## 📡 2. Event-Bus Infrastruktur & Lifecycle

- [x] **Global Event Bus Singleton**:
  - `window.__ENTERPRISE_EVENT_BUS__` als leichtgewichtiger, framework-agnostischer Pub/Sub-Kanal.
  - Sichere Event-Typisierung in TypeScript.
- [x] **Abonnement & Cleanup (Memory-Leak Schutz)**:
  - Automatisches Unsubscribe beim Unmounten von React/Angular Komponenten via Custom Hook `useMfeEvent(type, handler)`.
- [x] **Event-History & Replay**:
  - Puffer der letzten $N$ Events zur Initialisierung neu geladener Micro Frontends (`replayLastEvent`).

---

## 📋 3. Standardisierte Event-Payload Typdefinitionen

```typescript
export interface MfeBaseEvent<T = any> {
  eventId: string;          // UUID v4
  eventType: string;        // z.B. 'CALC:POSITION_ADDED'
  sourceDomain: 'SHELL' | 'CRM' | 'ARTICLES' | 'CALC' | 'BILLING' | 'STUDIO';
  targetDomain?: 'SHELL' | 'CRM' | 'ARTICLES' | 'CALC' | 'BILLING' | '*';
  timestamp: number;        // Unix Timestamp (ms)
  version: '1.0';
  correlationId?: string;   // Trace-ID für Transaktionsketten
  payload: T;
}
```

---

## 🔄 4. MFE-spezifische Event-Verträge (Domain Contracts)

### 4.1 Shell & Navigation Events
- [x] `SHELL:PROJECT_SELECTED`:
  - Payload: `{ projectId: string; projectNumber: string; customerId: string; title: string }`
  - Wirkung: Informiert alle geöffneten MFEs (CRM, Calc, Billing) über das aktive Bauvorhaben.
- [x] `SHELL:USER_AUTHENTICATED`:
  - Payload: `{ userId: string; roles: string[]; tenantId: string; permissions: string[] }`

### 4.2 CRM Events
- [x] `CRM:CUSTOMER_UPDATED`:
  - Payload: `{ customerId: string; companyName: string; paymentTermsDays: number; discountPercentage: number }`
  - Wirkung: Aktualisiert Zahlungskonditionen im Billing- und Calc-MFE.

### 4.3 Articles / Materialstamm Events
- [x] `ARTICLES:PRICE_CHANGED`:
  - Payload: `{ articleId: string; oldPrice: number; newPrice: number; validFrom: string }`
  - Wirkung: Markiert betroffene Positionen im Calc-MFE als "Preisaktualisierung verfügbar".

### 4.4 Calc / Kalkulation Events
- [x] `CALC:TOTALS_CHANGED`:
  - Payload: `{ projectId: string; totalLabor: number; totalMaterial: number; totalEquipment: number; totalNet: number; totalGross: number }`
  - Wirkung: Aktualisiert Projekt-KPIs in der Shell und Rechnungsbasis im Billing-MFE.
- [x] `CALC:OFFER_FINALIZED`:
  - Payload: `{ projectId: string; offerNumber: string; netAmount: number; positionsCount: number }`

### 4.5 Billing / Rechnungs-Events
- [x] `BILLING:INVOICE_CREATED`:
  - Payload: `{ invoiceId: string; invoiceNumber: string; projectId: string; customerId: string; netAmount: number; grossAmount: number; invoiceType: 'ADVANCE' | 'PARTIAL' | 'FINAL' }`
- [x] `BILLING:PAYMENT_RECEIVED`:
  - Payload: `{ invoiceId: string; paidAmount: number; paidDate: string; remainingAmount: number }`

---

## 🖱️ 5. Cross-MFE Drag & Drop Protokoll

Zieht Artikel aus dem Artikelkatalog direkt in das Leistungsverzeichnis der Baukalkulation:

- [x] **Standardisiertes MIME-Type Format**:
  - `application/x-enterprise-article`
  - `application/x-enterprise-position`
- [x] **D&D Payload**:
  ```json
  {
    "type": "ARTICLE",
    "articleId": "ART-99201",
    "articleNumber": "04.11.020",
    "shortText": "Beton C25/30 für Bodenplatte",
    "unit": "m³",
    "unitPriceMaterial": 115.50,
    "unitPriceLabor": 45.00
  }
  ```
- [x] **Visuelle Drop-Zone Indikatoren**: Einheitliche Highlight-Rahmen über Domain-Grenzen hinweg.

---

## 🗄️ 6. Globaler Cache-, State- & Schema-Sync

- [x] `STUDIO:SCHEMA_MODIFIED`:
  - Wenn im Tabellendesigner Spalten/Tabellen geändert werden, feuert das Studio ein Event.
  - Abfrage- und Seitendesigner invalidieren ihren lokalen Schema-Cache sofort.
- [x] `STUDIO:QUERY_EXECUTED`:
  - Übermittelt Abfrage-Ergebnisse an abonnierende Widget-Container.

---

## 🛡️ 7. Fehlerbehandlung, Timeouts & Dead-Letter-Handling

- [x] **Dead-Letter-Queue (DLQ)**: Auffangen von Events ohne registrierte Empfänger zur Diagnose.
- [x] **Timeout bei Request-Response Mustern**: Automatischer Abbruch nach 5000ms bei synchronen MFE-Abfragen.
- [x] **DevTools Event-Inspector**: Visuelle Timeline aller gefeuerten Events im Debug-Modus.

---

## 📅 8. Implementierungs-Checkliste & Phasenplan

- [x] **Phase 1**: Singleton Event-Bus Engine & TypeScript Base Types erstellen.
- [x] **Phase 2**: `useMfeEvent` & `publishMfeEvent` React Custom Hooks implementieren.
- [x] **Phase 3**: Shell- und Projektwechsel-Events (`SHELL:PROJECT_SELECTED`) anbinden.
- [x] **Phase 4**: Cross-MFE Drag & Drop Protokoll für Artikel -> Kalkulation umsetzen.
- [x] **Phase 5**: Schema-Synchronisation zwischen Studio-Modulen etablieren.
- [x] **Phase 6**: DevTools Event-Logger und Replay-Debugger integrieren.
