# Angular APIs & Storage Architecture Documentation

Diese Dokumentation beschreibt die Generierung, die API-Schnittstellen und die Datenhaltungs-Architektur der generierten Angular-Anwendungen (Versionen 18, 19, 20 und 21).

---

## 1. 🗄️ Datenhaltungs-Priorität: Browser-seitige IndexedDB

Um die sofortige, lokale Lauffähigkeit zu garantieren und Datenverlusten durch gelöschten Session-Speicher oder Cookies vorzubeugen, wird standardmäßig **IndexedDB** als Primärdatenbank verwendet. 

Dazu wird ein dynamischer `IndexedDbService` generiert, der die Tabellen-Struktur der Anwendung beim ersten Laden im Browser automatisch instanziiert und verwaltet.

### 1.1 `IndexedDbService` Schnittstelle
Der Service stellt asynchrone, reaktive CRUD-Operationen basierend auf RxJS Observables zur Verfügung:

```typescript
@Injectable({ providedIn: 'root' })
export class IndexedDbService {
  // Initialisiert die Datenbank und erstellt Stores für alle registrierten Entitäten
  private initDb(): Promise<IDBDatabase>;

  // Holt alle Datensätze einer Tabelle/Store
  getAll(storeName: string): Observable<any[]>;

  // Holt einen spezifischen Datensatz per ID
  getById(storeName: string, id: any): Observable<any>;

  // Erstellt einen neuen Datensatz (generiert UUID falls keine ID vorhanden)
  create(storeName: string, item: any): Observable<any>;

  // Aktualisiert einen bestehenden Datensatz per ID
  update(storeName: string, id: any, item: any): Observable<any>;

  // Löscht einen Datensatz per ID
  delete(storeName: string, id: any): Observable<void>;
}
```

---

## 2. ⚡ Abstraktions-Schicht für nahtlosen SQL/MySQL-Wechsel

Damit kein Umbau der Pages oder Komponenten notwendig ist, wenn die Anwendung auf ein echtes Backend (z.B. .NET Web API, FastAPI, NodeJS mit PostgreSQL/MySQL) portiert wird, fungiert der `ApiService` als einheitliches Gateway.

Der `ApiService` implementiert dieselbe Schnittstelle, kapselt jedoch beide Welten (Local IndexedDB & HTTP REST-Client) über eine einzige Steuervariable.

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private indexedDb = inject(IndexedDbService);

  // STEUERVARIABLE FÜR DATENHALTUNG:
  // true  -> Nutzt die Browser-seitige IndexedDB (Standard)
  // false -> Leitet Anfragen an das REST-Backend (PostgreSQL / MySQL) weiter
  private useIndexedDb = true;

  // Einheitliche Schnittstellen für Komponenten:
  get<T>(endpoint: string, params: any = {}): Observable<T>;
  getAll(endpoint: string, page: number = 1, pageSize: number = 20, search: string = ''): Observable<any>;
  getById(endpoint: string, id: any): Observable<any>;
  create(endpoint: string, item: any): Observable<any>;
  update(endpoint: string, id: any, item: any): Observable<any>;
  delete(endpoint: string, id: any): Observable<void>;
}
```

### 2.1 Daten-Fluss Diagramm
```text
+-------------------------------------------------------------+
|                     Angular Komponente                      |
| (z.B. Kundenliste, Bestell-Formular, Dashboard-Reports)    |
+-------------------------------------------------------------+
                               |
                               | Ruft auf (z.B. apiService.getAll('customers'))
                               v
+-------------------------------------------------------------+
|                         ApiService                          |
|                                                             |
|           Evaluierung: is useIndexedDb == true?             |
+-------------------------------------------------------------+
               /                               \
       JA     /                                 \    NEIN
             v                                   v
+--------------------------+         +------------------------+
|    IndexedDbService      |         |   HttpClient (REST)    |
| (Browser-Datenbank)      |         | (PostgreSQL, MySQL...) |
+--------------------------+         +------------------------+
```

---

## 3. 🚀 Versions-Spezifische Architekturen

Jeder Angular-Generator verwendet modernste, versions-spezifische Best Practices.

### 3.1 Angular 18 (Stabile Modernisierung)
* **Reaktivität**: Einsatz von Standard-Signals (`signal()`, `computed()`) zur optimierten UI-Aktualisierung.
* **Syntax**: Moderner Control Flow (`@if`, `@for`, `@switch`) für schnelles Template-Rendering.
* **DI**: Constructor-basierter Support mit modernem `inject(...)`.
* **Modulsystem**: Reine Standalone-Komponenten.

### 3.2 Angular 19 (Der Standard)
* **Echtzeit Zoneless**: Nutzt standardmäßig `provideExperimentalZonelessChangeDetection()` in `main.ts` für überragende Rendering-Performance ohne Zone.js Overhead.
* **Modernste Primitives**: Support für Signal-basierte Inputs (`input()`), zwei-Wege Model-Signale (`model()`) und moderne Outputs (`output()`).

### 3.3 Angular 20 & 21 (Zukunftsweisende Architekturen)
* **Zoneless Standard**: Volle Zoneless-Ausführung im Kern.
* **Signal-routing**: Vorbereitet auf rein Signal-basierte Routen-Parameter und Stores.
* **Declarative Async**: Kapselung asynchroner Datenbankabfragen direkt über Signal-Resources für optimiertes Hydrations-Handling.
