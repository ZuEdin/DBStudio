export interface ChecklistItem {
  id: string;
  category: 'gaeb' | 'access' | 'dach_tax' | 'backend' | 'einvoicing' | 'offline';
  title: string;
  description: string;
  technicalRule: string;
  status: boolean;
  actionLabel?: string;
  actionTarget?: string;
}

export interface ChecklistCategoryMeta {
  id: 'all' | 'gaeb' | 'access' | 'dach_tax' | 'backend' | 'einvoicing' | 'offline';
  label: string;
  badge: string;
  colorClass: string;
}

export const CHECKLIST_CATEGORIES_META: ChecklistCategoryMeta[] = [
  { id: 'all', label: 'Alle Checklisten', badge: 'Gesamt', colorClass: 'bg-indigo-600 text-white' },
  { id: 'dach_tax', label: 'DACH-Steuern & Baunormen', badge: 'AT / DE / CH', colorClass: 'bg-red-600 text-white' },
  { id: 'access', label: 'Access Migration & In-Browser', badge: 'MDB / ACCDB', colorClass: 'bg-emerald-600 text-white' },
  { id: 'backend', label: 'Fullstack & .NET 10 EF Core', badge: 'C# / Node / DB', colorClass: 'bg-cyan-600 text-white' },
  { id: 'einvoicing', label: 'E-Invoicing & ZUGFeRD', badge: 'ZUGFeRD / QR', colorClass: 'bg-amber-600 text-white' },
  { id: 'gaeb', label: 'GAEB DA XML 3.2/3.3', badge: 'X81-X86', colorClass: 'bg-indigo-600 text-white' },
  { id: 'offline', label: 'Offline-First & IndexedDB', badge: 'PWA / Storage', colorClass: 'bg-purple-600 text-white' }
];

export const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  // 1. DACH-Steuern & Baunormen
  {
    id: 'tax_at_rates',
    category: 'dach_tax',
    title: 'Österreichische Steuersätze (AT 20%, 10%, 13%, 0% §19 UStG)',
    description: 'Vollständige Unterstützung für österreichische Regel-, Ermäßigt- und Bauleistungs-Reverse-Charge-Sätze.',
    technicalRule: 'Kaufmännische Steuer-Splittung nach §19 Abs 1a UStG für Bauleistungen.',
    status: true,
    actionLabel: 'Steuersätze ansehen',
    actionTarget: 'table_templates'
  },
  {
    id: 'tax_de_rates',
    category: 'dach_tax',
    title: 'Deutsche Steuersätze (DE 19%, 7%, 0% §13b UStG)',
    description: 'Konforme Berechnung von 19% Regelsteuersatz, 7% ermäßigt und §13b Bauabzugsbesteuerung.',
    technicalRule: 'Einhaltung der Umsatzsteuer-Anwendungserlasse (UStAE).',
    status: true
  },
  {
    id: 'tax_ch_rates',
    category: 'dach_tax',
    title: 'Schweizer Mehrwertsteuersätze (CH 8.1%, 2.6%, 3.8%)',
    description: 'Aktuelle MWSTG-Sätze der Schweiz (Normalsatz 8.1%, reduzierter Satz 2.6%, Sondersatz Beherbergung 3.8%).',
    technicalRule: 'Eidgenössische Steuerverwaltung (ESTV) Konformität.',
    status: true
  },
  {
    id: 'tax_oenorm_retention',
    category: 'dach_tax',
    title: 'ÖNORM B 2110 Haftrücklass (3%) & Deckungsrücklass',
    description: 'Automatischer Abzug von 3% Haftrücklass zur Sicherung von Gewährleistungsansprüchen im Bauwesen.',
    technicalRule: 'Berechnung auf Bruttobetrag mit separatem Zahlbetragsausweis.',
    status: true
  },
  {
    id: 'tax_vob_retention',
    category: 'dach_tax',
    title: 'VOB/B Sicherheitseinbehalt (5%) & Erfüllungsgarantie (10%)',
    description: 'Vergabe- und Vertragsordnung für Bauleistungen (VOB/B §17) konforme Sicherheitseinbehalte.',
    technicalRule: 'Sperrkonto- / Bürgschafts-kompatible Cent-Berechnung.',
    status: true
  },

  // 2. MS Access Migration & In-Browser Parsing
  {
    id: 'access_in_browser_reader',
    category: 'access',
    title: '100% In-Browser Binary MDB & ACCDB Parser',
    description: 'Direktes Auslesen von Access-Binärdateien im Browser ohne Server-Upload oder Treiber-Installation.',
    technicalRule: 'MDBReader mit Node-Polyfills (Buffer/Streams).',
    status: true,
    actionLabel: 'Access-Import testen',
    actionTarget: 'access_import'
  },
  {
    id: 'access_queries_forms_reports',
    category: 'access',
    title: 'MSysQueries, Formular- & Berichts-Extraktion',
    description: 'Automatische Konvertierung von gespeicherten Access-Abfragen, Formularen und Berichten in Studio-Entitäten.',
    technicalRule: 'MSysObjects Typen-Inspektion (Typ 5 = Queries, -32768 = Forms, -32764 = Reports).',
    status: true
  },
  {
    id: 'access_pk_inference',
    category: 'access',
    title: 'Intelligente Primärschlüssel-Inferenz (Auto-PK)',
    description: 'Automatische Zuordnung von Primärschlüsseln anhand von AutoWert, ID-Mustern, Relationen und Eindeutigkeit.',
    technicalRule: 'getEffectivePrimaryKey() Algorithmus sichert fehlerfreie DDL-Generierung.',
    status: true
  },
  {
    id: 'access_ole_strip',
    category: 'access',
    title: 'OLE-Container Header Stripping (78-Byte Magic Byte)',
    description: 'Automatisches Abschneiden proprietärer OLE-Header (\\x15\\x1C) zur Wiederherstellung von Bildern.',
    technicalRule: 'AccessDataTranspiler.stripOleHeader() wandelt OLE-Blobs in Standard-Base64.',
    status: true
  },

  // 3. Fullstack & .NET 10 EF Core
  {
    id: 'backend_efcore_multidb',
    category: 'backend',
    title: '.NET 10 EF Core Multi-DB (MSSQL, SQLite, MySQL, Postgres)',
    description: 'Generiert C# DbContext, Minimal APIs, Pomelo MySQL, Npgsql Postgres und SQLite Provider.',
    technicalRule: 'Dynamische DI-Konfiguration in Program.cs und OnConfiguring Multi-Tenancy.',
    status: true,
    actionLabel: 'Code-Export öffnen',
    actionTarget: 'code_export'
  },
  {
    id: 'backend_ddl_and_identity',
    category: 'backend',
    title: 'Automatische DDL & SET IDENTITY_INSERT Behandlung',
    description: 'Seed-Generierung erstellt vorab Tabellen und schützt SQL Server Auto-Inkremente zuverlässig.',
    technicalRule: 'IF OBJECT_ID() Tabellen-Init und SET IDENTITY_INSERT ON / OFF Umschaltung.',
    status: true
  },
  {
    id: 'backend_query_matching',
    category: 'backend',
    title: 'Normalisierte Spaltenzuordnung in Angular & React',
    description: 'Tolerante Auflösung von CamelCase-, PascalCase- und SnakeCase-Feldnamen (z.B. Kategorie_lang).',
    technicalRule: 'clean(alias) === clean(fieldName) Normalisierungs-Engine.',
    status: true
  },

  // 4. E-Invoicing & ZUGFeRD / Factur-X / Swiss QR
  {
    id: 'einv_zugferd_cii',
    category: 'einvoicing',
    title: 'ZUGFeRD 2.0 / Factur-X XML Generierung (CII)',
    description: 'Erzeugung standardisierter Cross Industry Invoice XML-Strukturen für E-Rechnungen.',
    technicalRule: 'Konform zu EN 16931 und ZUGFeRD 2.2 Basic/Comfort Profilen.',
    status: true,
    actionLabel: 'Berichts-Designer öffnen',
    actionTarget: 'reports'
  },
  {
    id: 'einv_swiss_qr',
    category: 'einvoicing',
    title: 'Schweizer QR-Rechnung (Swiss QR-Bill SPC)',
    description: 'Standardisierter Zahlteil mit Schweizer Kreuz, QR-IBAN und strukturierter Referenz.',
    technicalRule: 'Konform zu SIX Swiss Payment Standards (SPS 2024).',
    status: true
  },
  {
    id: 'einv_din5008',
    category: 'einvoicing',
    title: 'DIN 5008 Briefkopf, Faltmarken & Fensterkuvert',
    description: 'Exakte Millimeter-Positionierung für Kuvert-Sichtfenster (Form A & B) mit optischen Falzmarken.',
    technicalRule: 'DIN 5008:2020-03 Vorgaben für Geschäftsbriefe.',
    status: true
  },

  // 5. GAEB DA XML 3.2/3.3
  {
    id: 'gaeb_oz',
    category: 'gaeb',
    title: 'OZ-Eindeutigkeit & Maskenformat (z.B. 01.01.0010)',
    description: 'Keine doppelten Ordnungszahlen, Konformität zur GAEB-Gliederungsmaske.',
    technicalRule: 'Eindeutige Ordnungszahlen nach GAEB DA XML 3.2 / 3.3 Spezifikation.',
    status: true,
    actionLabel: 'GAEB-Validierung öffnen',
    actionTarget: 'industry_interfaces'
  },
  {
    id: 'gaeb_pricing',
    category: 'gaeb',
    title: 'Vollständige Bepreisung (EP > 0 € für X84 / D84)',
    description: 'Alle Positionen besitzen einen gültigen Einheitspreis für Angebotsabgaben.',
    technicalRule: 'Vermeidung von Bieter-Ausschlüssen wegen unvollständiger Angebotspreise.',
    status: true
  },
  {
    id: 'gaeb_rounding',
    category: 'gaeb',
    title: 'Kaufmännische Rundung (EP × Menge = GP nach DIN 1333)',
    description: 'Exakte Cent-Rundung bei Positions- und Los-Summen ohne Cent-Abweichungen.',
    technicalRule: 'Kaufmännische Rundung auf 2 Dezimalstellen nach DIN 1333.',
    status: true
  },

  // 6. Offline-First & Storage
  {
    id: 'offline_indexeddb',
    category: 'offline',
    title: 'Local-First Persistenz in IndexedDB',
    description: 'Vollständige Daten- und Schemaspeicherung lokal im Browser ohne Zwangs-Cloud.',
    technicalRule: 'Strukturierte JSON-Stores mit Versions-Migration und Komprimierung.',
    status: true
  },
  {
    id: 'offline_export_dbsp',
    category: 'offline',
    title: '1-Klick .dbsp Backup & Wiederherstellung',
    description: 'Export und Import ganzer Projekte inklusive Tabellen, Formulare, Abfragen und Layouts.',
    technicalRule: 'Offenes JSON-Schema ohne proprietäre Verschlüsselung.',
    status: true
  }
];
