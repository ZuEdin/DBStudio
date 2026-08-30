import React from 'react';
import { 
  Layers, 
  Database, 
  Percent, 
  Code2, 
  Printer, 
  Server 
} from 'lucide-react';

export interface FaqItem {
  id: number;
  question: string;
  answer: React.ReactNode;
  codeSnippet?: {
    lang: string;
    code: string;
  };
}

export interface FaqCategory {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  description: string;
  items: FaqItem[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'part1',
    title: 'Teil 1: Grundlagen, Architektur & Reifegrad',
    badge: 'Architektur & Grundlagen',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    icon: <Layers size={18} className="text-indigo-400" />,
    description: 'Kernkonzepte, In-Browser Metamodell, Local-First Prinzip, Lizenzierung und transparenter Reifegrad.',
    items: [
      {
        id: 1,
        question: '1. Was genau ist DB Studio Pro?',
        answer: 'DB Studio Pro ist eine visuelle Rapid-Application-Development- (RAD) und Low-Code-Plattform zur visuellen Modellierung von relationalen Datenstrukturen, Formularen, Abfragen und Workflows mit anschließendem Quellcode-Export für professionelle Fullstack-Umgebungen (.NET, Node.js, Angular, React, PHP).'
      },
      {
        id: 2,
        question: '2. Ist DB Studio Pro ein eigener Datenbankserver?',
        answer: 'Nein, DB Studio Pro ist kein eigenständiger Datenbankserver (wie PostgreSQL oder SQL Server), sondern ein visuelles Modellierungs- und Codegenerierungs-Werkzeug (In-Browser-Metamodell in IndexedDB), das standardisierte DDL-Skripte und Backend-APIs für externe Datenbanken generiert.'
      },
      {
        id: 3,
        question: '3. In welcher Entwicklungsphase befindet sich das Tool aktuell?',
        answer: 'Das System befindet sich in der Vor-1.0 Entwicklungsphase (Beta). Die Web-Suite läuft auf Version 0.8.5, die optionale Local Bridge auf Version 0.9.2. Sehr viele Kernfunktionen laufen hochstabil und werden kontinuierlich im Produktiveinsatz optimiert.'
      },
      {
        id: 4,
        question: '4. Was bedeutet die „Be Honest“-Methode bezüglich des Reifegrads?',
        answer: 'Es ist ein transparenter Ansatz des Entwicklers, der den echten Reifegrad offenlegt (Pre-1.0 Beta: DB Studio v0.8.5 mit ca. 85 % Reife, Local Bridge v0.9.2 mit ca. 75 % Reife, Gesamtreifegrad ~82 %), anstatt mit unrealistischen Versprechungen eine fehlerfreie Version 1.0 zu suggerieren.'
      },
      {
        id: 5,
        question: '5. Wo werden meine Daten und Schemata gespeichert (Local-First)?',
        answer: 'Alle Entwürfe, Tabellen, Abfragen, Formulare und Testdaten werden clientseitig in der Browser-IndexedDB gesichert. Es werden keine Daten ungefragt an externe Server übertragen.'
      },
      {
        id: 6,
        question: '6. Gibt es einen Vendor Lock-in?',
        answer: 'Nein. Sie können Ihr Projekt jederzeit als offene `.dbsp` (JSON) Datei, als reine SQL-DDL Skripte oder als vollständig kompilierbares Quellcode-Projekt (C#, TypeScript, PHP) herunterladen.'
      }
    ]
  },
  {
    id: 'part2',
    title: 'Teil 2: Microsoft Access Migration (In-Browser & Bridge)',
    badge: 'Access Migration',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: <Database size={18} className="text-emerald-400" />,
    description: '100% In-Browser Binary MDB/ACCDB Parsing, MSysQueries, Formulare, Berichte, OLE-Container und Auto-PK.',
    items: [
      {
        id: 7,
        question: '7. Wie funktioniert der neue In-Browser Access (.mdb / .accdb) Import?',
        answer: 'Über einen integrierten binären Page-Parser (MDBReader mit Node-Polyfills) liest DB Studio Pro Access-Dateien direkt im Browser ohne Server-Upload ein. Tabellen, Spaltentypen, Beziehungen und Daten werden in Sekunden in das relationale Metamodell konvertiert.'
      },
      {
        id: 8,
        question: '8. Werden neben Tabellen auch Access-Abfragen, Formulare und Berichte migriert?',
        answer: 'Ja! DB Studio Pro inspiziert die Systemtabellen MSysObjects und MSysQueries. Abfragen werden automatisch in relationale Select-Queries übersetzt; für Formulare und Berichte werden entsprechende visuelle Layout-Container mit Widgets und Feld-Mappings erzeugt.'
      },
      {
        id: 9,
        question: '9. Wie werden Primärschlüssel bei alten Access-Tabellen ohne PK erkannt?',
        answer: 'Ein intelligenter Inferenz-Algorithmus erkennt AutoWert-Felder, Bezeichner wie ID, <Tabelle>Id, <Tabelle>Nr, Fremdschlüssel-Ursprünge aus Relationen oder Unique-Indizes und setzt automatisch den passenden Primärschlüssel.'
      },
      {
        id: 10,
        question: '10. Was geschieht mit OLE-Objekten (Bilder, Dokumente) in Access-Tabellen?',
        answer: 'Der integrierte AccessDataTranspiler schneidet den proprietären 78-Byte Microsoft OLE-Header (\\x15\\x1C) ab und wandelt die Roh-Binärdaten in standardisierte Base64-Bilder (JPEG/PNG) um.',
        codeSnippet: {
          lang: 'typescript',
          code: `// OLE-Container Header Stripping in DB Studio Pro
export function stripOleHeader(buffer: Uint8Array): string {
  if (buffer.length > 78 && buffer[0] === 0x15 && buffer[1] === 0x1C) {
    const rawImage = buffer.slice(78);
    return 'data:image/jpeg;base64,' + btoa(String.fromCharCode(...rawImage));
  }
  return '';
}`
        }
      },
      {
        id: 11,
        question: '11. Werden VBA-Ausdrücke wie NZ(), IIF() und Format() übersetzt?',
        answer: 'Ja, der integrierte Expression-Transpiler wandelt gängige Access VBA-Funktionen in die jeweiligen SQL-Dialekte um (z. B. COALESCE() für SQLite/PostgreSQL, CASE WHEN für MySQL, ISNULL() für MSSQL).'
      }
    ]
  },
  {
    id: 'part3',
    title: 'Teil 3: DACH-Kalkulation, Steuersätze & Baunormen',
    badge: 'DACH & Baunormen',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    icon: <Percent size={18} className="text-red-400" />,
    description: 'Steuersatz-Engine für Österreich (AT), Deutschland (DE), Schweiz (CH), ÖNORM B 2110 und VOB/B.',
    items: [
      {
        id: 12,
        question: '12. Welche Steuersätze für AT, DE und CH sind integriert?',
        answer: 'DB Studio Pro unterstützt vordefinierte Steuersätze: 🇦🇹 Österreich (20% Regelsteuersatz, 10% & 13% ermäßigt, 0% §19 UStG Bauleistungen / Reverse Charge), 🇩🇪 Deutschland (19% Regelsteuersatz, 7% ermäßigt, 0% §13b UStG Bauleistungen) und 🇨🇭 Schweiz (8.1% Normalsatz, 2.6% reduziert, 3.8% Beherbergung).'
      },
      {
        id: 13,
        question: '13. Kann die Tabelle "Steuersaetze" mit einem Klick in der DB angelegt werden?',
        answer: 'Ja! Über das CurrencyCalculationWidget oder die Vorlagen-Bibliothek kann mit einem Klick die strukturierte Tabelle "Steuersaetze" inklusive aller DACH-Sätze angelegt werden. Formulare greifen anschließend dynamisch auf die DB-Tabelle zu.'
      },
      {
        id: 14,
        question: '14. Wie werden Sicherheitseinbehalte nach VOB/B und ÖNORM B 2110 berechnet?',
        answer: 'Das kaufmännische Berechnungs-Widget bietet Umschalter für 3% (ÖNORM B 2110 Haftrücklass), 5% (VOB/B Deckungsrücklass / Mängelansprüche) und 10% (Erfüllungsgarantie) mit automatischer Abzugs- und Auszahlungsbetrags-Kalkulation.'
      },
      {
        id: 15,
        question: '15. Werden Rundungsdifferenzen nach DIN 1333 berücksichtigt?',
        answer: 'Ja, alle Berechnungen (Netto, MwSt-Spaltung nach Steuersatz, Brutto, Skonto und Einbehalte) erfolgen mit kaufmännischer Cent-Genauigkeit (Math.round() auf 2 Nachkommastellen).'
      }
    ]
  },
  {
    id: 'part4',
    title: 'Teil 4: Code-Generatoren & Fullstack-Architektur',
    badge: 'Code-Generierung',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    icon: <Code2 size={18} className="text-cyan-400" />,
    description: 'C# ASP.NET Core (.NET 9/10), Entity Framework Core Multi-DB, Angular SDUI, React und Node.js.',
    items: [
      {
        id: 16,
        question: '16. Welche Datenbanken unterstützt der .NET 10 EF Core Generator?',
        answer: 'Der C# Generator unterstützt 4 Ziel-Engines: Microsoft SQL Server (MSSQL), SQLite, MySQL / MariaDB (via Pomelo.EntityFrameworkCore.MySql) und PostgreSQL (via Npgsql.EntityFrameworkCore.PostgreSQL).'
      },
      {
        id: 17,
        question: '17. Wie werden Primärschlüssel und SET IDENTITY_INSERT in C# behandelt?',
        answer: 'Die DB-Initializer Logik ermittelt für jede Tabelle den effektiven Primärschlüssel, generiert DDL-Erstellungsskripte vor dem Seeding und umschließt Batch-Inserts auf SQL Server mit SET IDENTITY_INSERT ON / OFF.'
      },
      {
        id: 18,
        question: '18. Wie funktioniert die Feldauflösung bei generierten Angular- und React-Queries?',
        answer: 'Die Query-Generatoren verwenden eine normalisierte Schlüsselprüfung (`clean(alias)` vs `clean(fieldName)`), die Groß-/Kleinschreibung, Unterstriche und Bindestriche ignoriert. Dadurch werden auch gemischte Spaltennamen wie `Kategorie_lang` oder `kategorieLang` fehlerfrei im Grid gerendert.'
      },
      {
        id: 19,
        question: '19. Werden viele-zu-viele (n:m) Beziehungen generiert?',
        answer: 'Ja! DB Studio Pro erkennt Junction-Tabellen automatisch und generiert in EF Core `.UsingEntity<T>()` Mappings bzw. in Drizzle ORM Many-to-Many Relationen mit Cascade Deletes.'
      }
    ]
  },
  {
    id: 'part5',
    title: 'Teil 5: E-Invoicing, ZUGFeRD, Swiss QR & Berichte',
    badge: 'E-Invoicing & Berichte',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: <Printer size={18} className="text-amber-400" />,
    description: 'ZUGFeRD 2.0 / Factur-X, Swiss QR-Bill, DIN 5008 Faltmarken und A4 PDF-Generierung.',
    items: [
      {
        id: 20,
        question: '20. Erzeugt DB Studio Pro ZUGFeRD / Factur-X konforme Rechnungen?',
        answer: 'Ja! Das Berichts-Modul generiert standardkonforme ZUGFeRD 2.0 / Factur-X XML-Dateien (Cross Industry Invoice CII) mit allen steuerrechtlichen Pflichtangaben für B2B- und B2G-Vergaben.'
      },
      {
        id: 21,
        question: '21. Wird die Schweizer QR-Rechnung (Swiss QR-Bill) unterstützt?',
        answer: 'Ja, Rechnungsberichte können mit einem standardisierten Swiss QR-Code (SPC) inklusive Creditor-Adresse, QR-IBAN und Referenznummer für den Schweizer Zahlungsverkehr ausgestattet werden.'
      },
      {
        id: 22,
        question: '22. Sind die Berichte nach DIN 5008 formatiert?',
        answer: 'Ja, das Berichts-Layout verfügt über genormte Absenderzeilen, Fensterbriefumschlag-Adressfelder (DIN 5008 Form A & B), optische Falt- und Lochmarken sowie konfigurierbare Kopf- und Fußzeilen.'
      }
    ]
  },
  {
    id: 'part6',
    title: 'Teil 6: Local Bridge, OpenAPI Mock Server & DevOps',
    badge: 'DevOps & Tooling',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: <Server size={18} className="text-purple-400" />,
    description: 'OpenAPI 3.0 Live Mock Server, GAEB DA XML 3.3, CSV/Excel/DATEV Import und Git Deployer.',
    items: [
      {
        id: 23,
        question: '23. Was ist der integrierte OpenAPI 3.0 Mock Server?',
        answer: 'Ein In-Memory HTTP Mock Server, der direkt im Browser läuft. Er simuliert REST-Endpoints für alle Ihre Tabellen mit CRUD-Operationen, einstellbarer Latenz, Filterung, Paginierung und Auth-Token Prüfung.'
      },
      {
        id: 24,
        question: '24. Welche GAEB-Phasen werden unterstützt?',
        answer: 'DB Studio Pro validiert und verarbeitet GAEB DA XML 3.2 und 3.3 in den Austauschphasen X81 (Leistungsbeschreibung), X83 (Angebotsaufforderung), X84 (Angebotsabgabe mit EPs) und X86 (Auftragserteilung).'
      },
      {
        id: 25,
        question: '25. Welche Importformate werden im 3-Schritt Import-Assistenten unterstützt?',
        answer: 'Der Assistent verarbeitet Excel (.xlsx, .xls), CSV mit automatischer Trennzeichen-Erkennung (Komma, Semikolon, Tab) sowie DATEV-kompatible Buchungsstapel mit automatischer Typ-Inferenz.'
      }
    ]
  }
];
