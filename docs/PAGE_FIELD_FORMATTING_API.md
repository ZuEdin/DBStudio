# DB Studio Pro - Page Field Formatting & Pipe Engine API

## 1. Überblick

Die **Field Formatting & Pipe Engine** ermöglicht im Page Designer, SDUI-Renderer und den Code-Generatoren eine flexible, deklarative Formatierung von beliebigen Datenfeldern (z. B. Datum, Uhrzeit, Währung, Zahlen, Texttransformationen und Booleans).

Die Engine arbeitet datenbank-agnostisch: Daten können aus der lokalen **IndexedDB** (`storageService`), aus REST-APIs, GraphQL oder relationalen SQL/MySQL-Backends bezogen werden. Die Formatierung findet auf der Präsentationsschicht sowie in den exportierten Frontend-Komponenten (React, Angular, etc.) statt.

---

## 2. Formatierungs-Modi

Das System unterstützt zwei komplementäre Formatierungs-Ansätze:

### A. UI-gestützte Komponenten-Formatierung (Component Properties)
Wird direkt im **Eigenschaften-Panel** des Page Designers für Text-Komponenten (`type: 'text'`), Stat-Cards (`type: 'stat_card'`) oder Tabellenspalten konfiguriert.

```json
{
  "id": "text-node-1",
  "type": "text",
  "props": {
    "text": "{{context.created_at}}",
    "formatType": "date",
    "dateFormat": "DD.MM.YYYY HH:mm",
    "prefix": "Erstellt am: ",
    "suffix": " Uhr",
    "emptyFallback": "-"
  }
}
```

### B. Deklarative Inline-Pipe-Syntax in Templates
Ermöglicht das Einbetten formatierter Platzhalter direkt in Fließtexte, Button-Labels, Benachrichtigungen oder Header-Titel:

- `{{created_at | date:'DD.MM.YYYY'}}` ➔ `28.08.2026`
- `{{created_at | date:'DD.MM.YYYY HH:mm'}}` ➔ `28.08.2026 14:30`
- `{{created_at | date:'relative'}}` ➔ `vor 2 Tagen` / `heute`
- `{{total_price | currency:'EUR'}}` ➔ `1.250,00 €`
- `{{total_price | currency:'USD':2}}` ➔ `$ 1,250.00`
- `{{amount | number:2}}` ➔ `1.234,50`
- `{{status | uppercase}}` ➔ `AKTIV`
- `{{description | truncate:40}}` ➔ `Langer Beschreibungstext...`
- `{{is_active | boolean:'Aktiv':'Gesperrt'}}` ➔ `Aktiv`
- `{{missing_field | default:'Keine Angabe'}}` ➔ `Keine Angabe`

---

## 3. Unterstützte Datums- & Zeitmuster

| Pattern Token | Beschreibung | Beispiel |
| :--- | :--- | :--- |
| `DD.MM.YYYY` | Deutsches Standard-Datum | `28.08.2026` |
| `DD.MM.YYYY HH:mm` | Datum mit 24h-Uhrzeit | `28.08.2026 14:30` |
| `DD.MM.YYYY HH:mm:ss` | Datum mit Sekunden | `28.08.2026 14:30:45` |
| `YYYY-MM-DD` | ISO/SQL-Format | `2026-08-28` |
| `DD. MMMM YYYY` | Deutsches Langformat | `28. August 2026` |
| `dddd, DD.MM.YYYY` | Wochentag mit Datum | `Freitag, 28.08.2026` |
| `relative` | Relative Zeitspanne | `gerade eben`, `vor 3 Stunden`, `gestern` |
| `HH:mm` | Nur Uhrzeit | `14:30` |
| `HH:mm:ss` | Uhrzeit mit Sekunden | `14:30:45` |

---

## 4. API & TypeScript-Schnittstellen

### `formatFieldValue(val: any, options: FieldFormatOptions): string`
Hauptfunktion für die Formatierung beliebiger Rohwerte.

```typescript
import { formatFieldValue } from '@/features/pages/utils/formatUtils';

const formatted = formatFieldValue('2026-08-28T14:30:00Z', {
    formatType: 'date',
    dateFormat: 'DD.MM.YYYY HH:mm',
    prefix: 'Stand: '
});
// Ergebnis: "Stand: 28.08.2026 14:30"
```

### `applyPipeChain(val: any, pipeChain: string[]): string`
Wendet eine Kette von Pipe-Transformationen nacheinander auf einen Wert an.

```typescript
import { applyPipeChain } from '@/features/pages/utils/formatUtils';

const result = applyPipeChain(1250.5, ["currency:'EUR'", "prefix:'Gesamt: '"]);
// Ergebnis: "Gesamt: 1.250,50 €"
```

### `resolvePlaceholders(text: string, context?: Record<string, any>, params?: Record<string, any>): string`
Löst verschachtelte Parameter und Inline-Pipes in Texten auf.

```typescript
import { resolvePlaceholders } from '@/features/pages/utils/pageViewUtils';

const text = resolvePlaceholders(
    "Auftrag vom {{context.order_date | date:'DD.MM.YYYY'}}: {{context.amount | currency:'EUR'}}",
    { order_date: '2026-08-28', amount: 849.99 }
);
// Ergebnis: "Auftrag vom 28.08.2026: 849,99 €"
```

---

## 5. Kompatibilität mit Backend-Datenbanken (IndexedDB & SQL/MySQL)

- **IndexedDB**: Datumswerte werden standardmäßig als ISO-String (`YYYY-MM-DDTHH:mm:ss.sssZ`) oder Unix-Timestamp (`number`) in den IndexedDB Object Stores gespeichert.
- **SQL / MySQL**: Beim Export oder bei direkter Backend-Anbindung entsprechen die Feldtypen `DATETIME`, `TIMESTAMP` oder `DATE`. Die `formatUtils`-Engine verarbeitet ISO-Strings, Unix-Timestamps und SQL-Datumsformate identisch.
