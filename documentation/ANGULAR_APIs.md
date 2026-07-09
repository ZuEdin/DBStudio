# Angular APIs & Storage Architecture Documentation

Diese Dokumentation beschreibt die Generierung, die API-Schnittstellen und die Datenhaltungs-Architektur der generierten Angular-Anwendungen (Versionen 18, 19, 20 und 21).

---

## 1. 🗄️ Datenhaltungs-Priorität: Browser-seitige IndexedDB mit intelligentem Backend-Fallback

Um die sofortige, lokale Lauffähigkeit zu garantieren und Datenverlusten durch gelöschten Session-Speicher oder Cookies vorzubeugen, wird standardmäßig **IndexedDB** als Primärdatenbank verwendet. 

Dazu wird ein dynamischer `IndexedDbService` generiert, der die Tabellen-Struktur der Anwendung beim ersten Laden im Browser automatisch instanziiert und verwaltet.

### 1.1 `IndexedDbService` Schnittstelle
Der Service stellt asynchrone, reaktive CRUD-Operationen basierend auf RxJS Observables zur Verfügung:

```typescript
@Injectable({ providedIn: 'root' })
export class IndexedDbService {
  // Initialisiert die Datenbank und erstellt Stores für alle registrierten Entitäten
  private initDb(): Promise<IDBDatabase>;

  // Überprüft, ob ein bestimmter Object Store existiert (verhindert NotFoundError)
  hasStore(storeName: string): Promise<boolean>;

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

## 2. ⚡ Intelligente Abstraktions-Schicht & Hybride Routing-Logik mit automatischem Backend-Sync

Damit kein Umbau der Pages oder Komponenten notwendig ist, wenn die Anwendung auf ein echtes Backend (z.B. NodeJS, PostgreSQL/MySQL) portiert wird, fungiert der `ApiService` als einheitliches Gateway.

Der `ApiService` implementiert eine **hybride Routing-Logik** mit automatischem Fallback und **vollautomatischem Server-Synchronisierungs-Mechanismus**:
1. **Prüfung der Existenz**: Vor jeder Datenbanktransaktion wird asynchron geprüft, ob für den angefragten `storeName` (z.B. `customers`) ein lokaler IndexedDB-Store vorhanden ist.
2. **Datenbank-Priorität**: Wenn `useIndexedDb = true` aktiv ist und der Store existiert, wird die Anfrage bevorzugt lokal verarbeitet.
3. **Vollautomatischer Server-Sync (Seeding)**: Um zu verhindern, dass neu angelegte Tabellen oder Server-Daten (z.B. aus Excel-Importen, die über Swagger sichtbar sind) auf dem Client leer bleiben, prüft der `ApiService` im `localStorage` den Synchronisierungsstatus (`synced_[endpoint]`). Wenn dieser für den Store noch nicht auf `true` steht, wird **automatisch beim ersten Abruf** ein Hintergrund-Fetch an das Backend abgesetzt, der lokale IndexedDB-Store damit initial befüllt und die Tabelle als synchronisiert markiert. Ab diesem Zeitpunkt wird performant und offline-fähig direkt aus der IndexedDB gelesen!
4. **Automatischer HTTP-Fallback**: Falls der Store *nicht* existiert (z.B. bei System-Schnittstellen wie `auth/login`, `profile` oder benutzerdefinierten SQL-Queries), wird die Anfrage **transparent und fehlerfrei an das REST-Backend** weitergeleitet. Dadurch wird der gefürchtete `NotFoundError: Failed to execute 'transaction' on 'IDBDatabase'` vollständig eliminiert und Backend-Routen werden zuverlässig angesprochen!

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private indexedDb = inject(IndexedDbService);

  // STEUERVARIABLE FÜR DATENHALTUNG:
  // true  -> Nutzt bevorzugt die Browser-seitige IndexedDB mit automatischem HTTP-Fallback
  // false -> Leitet alle Anfragen direkt an das REST-Backend (PostgreSQL / MySQL) weiter
  private useIndexedDb = true;

  // Einheitliche Schnittstellen mit integrierter Fallback-Logik:
  get<T>(endpoint: string, params: any = {}): Observable<T>;
  getAll(endpoint: string, page: number = 1, pageSize: number = 20, search: string = ''): Observable<any>;
  getById(endpoint: string, id: any): Observable<any>;
  create(endpoint: string, item: any): Observable<any>;
  update(endpoint: string, id: any, item: any): Observable<any>;
  delete(endpoint: string, id: any): Observable<void>;
}
```

### 2.1 Daten-Fluss Diagramm mit Fallback-Mechanismus
```text
+-------------------------------------------------------------------------+
|                           Angular Komponente                            |
|       (z.B. Kundenliste, Login-Schnittstelle, Dashboard-Reports)        |
+-------------------------------------------------------------------------+
                                     |
                                     | Ruft auf (z.B. apiService.get('auth/login'))
                                     v
+-------------------------------------------------------------------------+
|                               ApiService                                |
|                                                                         |
|         Asynchrone Prüfung: Hat IndexedDB einen Store für diesen Pfad?   |
+-------------------------------------------------------------------------+
                     /                               \
             JA     /                                 \    NEIN (oder useIndexedDb = false)
                   v                                   v
+--------------------------------------+   +--------------------------------------+
|          IndexedDbService            |   |          HttpClient (REST)           |
|                                      |   |                                      |
| Führt lokale Transaktion aus.        |   | Proxy an Server-Backend              |
| (z.B. Offline-Kundenkatalog)         |   | (z.B. Auth-API, SQL-Queries)         |
+--------------------------------------+   +--------------------------------------+
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
