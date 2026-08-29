import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Sparkles, 
  Server, 
  Code, 
  Terminal, 
  Database, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  FileText, 
  Check, 
  Copy,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface FaqItem {
  id: number;
  question: string;
  answer: React.ReactNode;
  codeSnippet?: {
    lang: string;
    code: string;
  };
}

interface FaqCategory {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  description: string;
  items: FaqItem[];
}

export const FaqSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({
    1: true,
    9: true,
    26: true,
    35: true,
    45: true
  });
  const [copiedSnippetId, setCopiedSnippetId] = useState<number | null>(null);

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const categories: FaqCategory[] = [
    {
      id: 'part1',
      title: 'Teil 1: Grundlagen & Kernarchitektur',
      badge: 'Architektur & Grundlagen',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      icon: <Layers size={18} className="text-indigo-400" />,
      description: 'Kernkonzepte, Metamodell, Local-First Prinzip, Lizenzierung und Entwicklungsphase.',
      items: [
        {
          id: 1,
          question: '1. Was genau ist DB Studio Pro?',
          answer: 'DB Studio Pro ist eine visuelle Rapid-Application-Development- (RAD) und Low-Code-Plattform zur visuellen Modellierung von relationalen Datenstrukturen, Formularen, Abfragen und Workflows mit anschließendem Quellcode-Export für professionelle Fullstack-Umgebungen.'
        },
        {
          id: 2,
          question: '2. Ist DB Studio Pro ein eigener Datenbankserver?',
          answer: 'Nein, DB Studio Pro ist kein eigenständiger Datenbankserver (wie PostgreSQL oder MySQL), sondern ein visuelles Modellierungs- und Codegenerierungs-Werkzeug (In-Browser-Metamodell), das DDL-Skripte und Backend-APIs für externe Datenbanken generiert.'
        },
        {
          id: 3,
          question: '3. In welcher Entwicklungsphase befindet sich das Tool aktuell?',
          answer: 'Das System befindet sich in der Vor-1.0 Entwicklungsphase (Beta). Die Web-Suite läuft auf Version 0.8.5, die Local Bridge auf Version 0.9.2. Sehr viele Kernfunktionen laufen stabil und werden kontinuierlich im Produktiveinsatz optimiert.'
        },
        {
          id: 4,
          question: '4. Was bedeutet die „Be Honest“-Methode bezüglich des Reifegrads?',
          answer: 'Es ist ein transparenter Ansatz des Entwicklers, der den echten Reifegrad offenlegt (Pre-1.0 Beta: DB Studio v0.8.5 mit ca. 85 % Reife, Local Bridge v0.9.2 mit ca. 75 % Reife, Gesamtreifegrad ~82 %), anstatt mit falschen Marketing-Versprechen „100 % fehlerfreie“ Software zu suggerieren.'
        },
        {
          id: 5,
          question: '5. Wie speichert DB Studio Projekte intern ab?',
          answer: 'Projekte werden in einem deklarativen, serialisierbaren JSON-Metamodell (im nativen Dateiformat .dbsp) gespeichert. Dies enthält Tabellenschemata, Relationen, UI-Layouts und ER-Diagramm-Koordinaten.'
        },
        {
          id: 6,
          question: '6. Was ist das Prinzip „Local-First“ bei DB Studio?',
          answer: 'Das System läuft als clientseitige Single-Page-Applikation (SPA) im Browser; alle Schemadaten verbleiben lokal im Speicher (Zustand / IndexedDB / LocalStorage / SQLite WASM) und werden nicht ungefragt auf Fremdserver übertragen (DSGVO-konform).'
        },
        {
          id: 7,
          question: '7. Welche Rolle spielt die „DB Studio Local Bridge“?',
          answer: 'Die Local Bridge ist ein nativer Windows-Hintergrunddienst (Daemon auf Port 5050), der für Aufgaben wie 64-Bit-OLEDB-Treiberzugriff (Access-Migration), Dateisystem-Operationen, Migrationen und Desktop-Kompilierungen (Tauri/Electron) zuständig ist.'
        },
        {
          id: 8,
          question: '8. Gibt es einen Vendor Lock-in?',
          answer: 'Nein; es wird 100 % echter, unverschlüsselter Quellcode exportiert, der Ihnen gehört und ohne DB Studio in jeder IDE (VS Code, Visual Studio, JetBrains) unabhängig weiterentwickelt werden kann.'
        },
        {
          id: 9,
          question: '9. Fallen für die generierten Anwendungen Laufzeit-Lizenzkosten an?',
          answer: 'Nein, die erzeugten Web-Apps und Backends verursachen 0 € Lizenz- oder Runtime-Kosten und können unbegrenzt auf eigener Infrastruktur oder Cloud-Servern betrieben werden.'
        },
        {
          id: 10,
          question: '10. Für wen ist DB Studio Pro konzipiert und bietet es Teamarbeit?',
          answer: 'Es richtet sich an Business-Experten, Planer und Bauleiter (zur Prozessautomatisierung und Legacy-Migration) sowie an Profi-Entwickler, die Boilerplate einsparen wollen. Es bietet Live-Collaboration in Echtzeit mit sichtbaren Cursorn, Chat-Funktionen und einem integrierten Kanban-Board.'
        }
      ]
    },
    {
      id: 'part2',
      title: 'Teil 2: Was DB Studio KANN (Kernfähigkeiten)',
      badge: 'Solide Kernfunktionen',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: <CheckCircle2 size={18} className="text-emerald-400" />,
      description: 'Multi-Stack Backend- & Frontend-Generierung, visuelle Designer, Reporting und Branchen-Engines.',
      items: [
        {
          id: 11,
          question: '11. Welche Backend-Stacks kann DB Studio generieren?',
          answer: 'Die Engine exportiert produktionsreifen Code für: 1) C# ASP.NET Core (.NET 10 Minimal APIs & Entity Framework Core), 2) Node.js (Express & TypeScript mit Drizzle/Prisma-Unterstützung), 3) PHP 8.x mit PDO Prepared Statements, sowie Go (GORM), Python (SQLAlchemy) und Rust (Diesel).'
        },
        {
          id: 12,
          question: '12. Welche Frontend-Technologien werden unterstützt?',
          answer: 'Moderne Single-Page-Applications (SPA) in React mit Tailwind CSS und Server-Driven UI (SDUI) sowie Angular SPAs mit modularen Komponenten.'
        },
        {
          id: 13,
          question: '13. Welche Ziel-Datenbanken werden durch SQL-DDL-Exporte unterstützt?',
          answer: 'SQLite, MySQL / MariaDB, PostgreSQL sowie Migrationsskripte für Drizzle, Flyway und Liquibase inklusive Foreign Keys, Datentyp-Mapping und Indizes.'
        },
        {
          id: 14,
          question: '14. Was leistet der relationale Tabellen- & Schema-Designer?',
          answer: 'Er ermöglicht das visuelle Anlegen von Tabellen, AutoWert-/Primärschlüsseln, 1:1, 1:n und n:m Relationen, Indizes sowie das automatische Berechnen von Layout-Koordinaten für das interaktive ER-Diagramm.'
        },
        {
          id: 15,
          question: '15. Wie funktioniert der Formular-Designer?',
          answer: 'Er bietet 1- bis 4-spaltige Grid-Layouts, Container-Verschachtelungen, N-Ebenen Subforms (Master-Detail), Lookup-Dropdowns, dynamische Validierungen und Berechnungsformeln (z. B. Brutto = Netto * 1.19).'
        },
        {
          id: 16,
          question: '16. Welche Möglichkeiten bietet der visuelle No-Code Query-Builder?',
          answer: 'Grafisches Zusammenklicken von Tabellen-JOINs anhand bestehender Fremdschlüssel, Kriterienfilter, Sortierungen, Aggregationen (SUM, AVG, COUNT, MIN, MAX) und Live-SQL-Syntax-Vorschau in Echtzeit.'
        },
        {
          id: 17,
          question: '17. Unterstützt DB Studio rollenbasierte Zugriffsrechte (RBAC)?',
          answer: 'Ja, Formularfelder und Entitäten können mit Rollenberechtigungen versehen werden (z. B. Admin, Sachbearbeiter, Gast / Read-Only / Hidden) mit Vorbereitung für Active Directory / LDAP Anbindungen.'
        },
        {
          id: 18,
          question: '18. Was bietet die Berichts- & Druck-Engine?',
          answer: 'Erstellung von druckreifen A4-Vorlagen für Angebote, Rechnungen und Listen mit Kopf-, Detail- und Fußzeilen, Zwischensummen sowie automatischem Seitenumbruch.'
        },
        {
          id: 19,
          question: '19. Können Kanban-Boards und moderne Dashboards erstellt werden?',
          answer: 'Ja, über die Server-Driven UI (SDUI) können interaktive Kanban-Boards mit Drag-&-Drop-Statusspalten, Prioritätsfiltern und interaktive KPI-Widgets definiert werden.'
        },
        {
          id: 20,
          question: '20. Wie unterstützt das System beim Testen mit Daten?',
          answer: 'Es besitzt einen integrierten Mock-Daten-Generator, der 10 bis 500 synthetische, realistische Geschäftsdatensätze zur Entwurfszeit clientseitig erzeugt.'
        },
        {
          id: 21,
          question: '21. Welche Desktop-Apps können gebaut werden?',
          answer: 'Über die Local Bridge können native Installationspakete für Tauri 2.0 (MSI/NSIS), Electron (Setup.exe) und .NET 10 Single-File Releases kompiliert werden.'
        },
        {
          id: 22,
          question: '22. Wie funktioniert die MS-Access-Migration?',
          answer: 'Die Local Bridge liest .accdb- und .mdb-Dateien über Microsofts 64-Bit-OLEDB-Treiber aus und wandelt Schema und Daten direkt in native .dbsp-Projekte um.'
        },
        {
          id: 23,
          question: '23. Was macht der integrierte VBA-Transpiler?',
          answer: 'Er übersetzt proprietäre Access-Funktionen wie NZ() in COALESCE, IIF() in CASE WHEN sowie Format() und Date() in ANSI-SQL bzw. JavaScript.'
        },
        {
          id: 24,
          question: '24. Was ist der topologische Live-Data-Sync?',
          answer: 'Ein Dependency-Graph-Algorithmus ermittelt die exakte mathematische Einfügereihenfolge von Datensätzen, damit Fremdschlüssel-Constraints (Eltern vor Kindern) beim Import nicht verletzt werden.'
        },
        {
          id: 25,
          question: '25. Welche Branchenschnittstellen (Bau & Handwerk) sind integriert?',
          answer: 'GAEB 90/2000/XML (X83/X84 Leistungsverzeichnisse), ZUGFeRD 2.2 & XRechnung 3.0 (E-Rechnung), DATANORM 4/5, SHK Connect und ÖNORM.'
        }
      ]
    },
    {
      id: 'part3',
      title: 'Teil 3: Was DB Studio NICHT KANN (Grenzen & Limits)',
      badge: 'Ehrliche Grenzen',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: <XCircle size={18} className="text-rose-400" />,
      description: 'Bewusste architektonische Abgrenzungen, Nicht-Ziele und Systemgrenzen.',
      items: [
        {
          id: 26,
          question: '26. Kann DB Studio komplexe VBA-Makros vollautomatisch 1:1 in C# oder JS übersetzen?',
          answer: 'Nein; mathematische Formeln und Abfrageausdrücke werden transpiliert, tief verflochtene prozedurale VBA-Makro-Logik und Windows-API/COM-Hooks müssen jedoch visuell neu definiert oder manuell in der Ziel-IDE programmiert werden.'
        },
        {
          id: 27,
          question: '27. Ist DB Studio ein direkter Ersatz für SQL-Management-Tools wie DBeaver oder pgAdmin?',
          answer: 'Nein; es ist kein dedizierter universeller Datenbank-Admin-Client zur Live-Verwaltung beliebiger Fremddatenbanken via generischer JDBC/ODBC-Treiber, sondern ein App-Builder, Metamodell-Designer und Migrationswerkzeug.'
        },
        {
          id: 28,
          question: '28. Kann DB Studio direkt native Microsoft-Office-Dokumente (.docx, .xlsx, .odt) erzeugen?',
          answer: 'Nein; es erzeugt HTML/Canvas-Druckansichten, PDF-taugliche Drucklayouts und Web-Dashboards, besitzt jedoch keine native Office-Suite-Bindung (wie LibreOffice Writer/Calc Automation oder Word-Serienbriefe).'
        },
        {
          id: 29,
          question: '29. Führt DB Studio eigenen Python- oder Basic-Code direkt zur Laufzeit im Designer aus?',
          answer: 'Nein; DB Studio führt innerhalb der UI keine freie Makrosprache aus. Logik wird in deklarativen Ausdrücken erfasst oder in den exportierten Ziel-Quellcode ausgelagert.'
        },
        {
          id: 30,
          question: '30. Kann DB Studio ohne externe Werkzeuge eigenständig .NET- oder Rust-Code kompilieren?',
          answer: 'Nein; DB Studio erzeugt den Quellcode. Zum Kompilieren der Exporte werden auf dem Entwicklerrechner die jeweiligen SDKs (.NET SDK, Rust/Cargo, Node.js) benötigt.'
        },
        {
          id: 31,
          question: '31. Hostet DB Studio die fertige Anwendung in einer Plattform-Cloud?',
          answer: 'Nein; es ist kein proprietärer SaaS-Cloud-Hoster wie Airtable. Das Hosting der exportierten Backends und Datenbanken muss auf eigenen Servern oder Cloud-Providern eingerichtet werden.'
        },
        {
          id: 32,
          question: '32. Kann die Browser-App ohne Local Bridge auf lokale OLEDB-Treiber zugreifen?',
          answer: 'Nein; aus Sicherheitsgründen der Browser-Sandbox kann die Web-App nicht direkt auf lokale Windows-Dateipfade oder OLEDB-Treiber zugreifen. Dafür ist zwingend die Local Bridge erforderlich.'
        },
        {
          id: 33,
          question: '33. Läuft die Local Bridge auf macOS oder Linux?',
          answer: 'Nein, die Local Bridge ist aktuell ein nativer Windows-Daemon, bedingt durch Microsofts 64-Bit OLEDB-Treiber für Access. (Die Web-Suite selbst läuft plattformunabhängig auf allen Betriebssystemen).'
        },
        {
          id: 34,
          question: '34. Unterstützt DB Studio unstrukturierte NoSQL-Datenbanken (z. B. MongoDB) out-of-the-box?',
          answer: 'Der primäre Fokus und das Datenmetamodell basieren strikt auf relationalen Tabellenstrukturen, Primärschlüsseln und Fremdschlüsseln.'
        },
        {
          id: 35,
          question: '35. Gibt es bereits eine Version 1.0 mit Langzeit-Support (LTS)?',
          answer: 'Nein, das System befindet sich aktuell in der Vor-1.0 Beta-Phase (Studio v0.8.5 / Bridge v0.9.2).'
        }
      ]
    },
    {
      id: 'part4',
      title: 'Teil 4: Voraussetzungen & Entwickler-Ökosystem',
      badge: 'Dev-Setup & Toolchains',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: <Terminal size={18} className="text-amber-400" />,
      description: 'Systemanforderungen, SDKs, CLI-Befehle und Startanleitungen für generierte Stacks.',
      items: [
        {
          id: 36,
          question: '36. Welche Systemanforderungen gelten für den Betrieb von DB Studio Pro?',
          answer: 'Ein moderner Webbrowser (Chrome, Edge, Firefox) mit Unterstützung für HTML5, JavaScript (ES6+) und IndexedDB. Keine Installation für den visuellen Entwurf nötig.'
        },
        {
          id: 37,
          question: '37. Welche Voraussetzungen benötigt die DB Studio Local Bridge?',
          answer: 'Ein Windows-Betriebssystem (für OLEDB-Access-Treiber) mit Node.js Runtime und Rechten zur Ausführung des lokalen Port-5050-Daemons.'
        },
        {
          id: 38,
          question: '38. Was muss installiert sein, um einen exportierten Node.js-Stack zu starten?',
          answer: 'Node.js (ab Version 18+), der Paketmanager npm / pnpm und eine laufende Datenbankinstanz (z. B. MySQL, PostgreSQL oder SQLite).'
        },
        {
          id: 39,
          question: '39. Welche Befehle sind nötig, um ein exportiertes Node.js-Backend auszuführen?',
          answer: 'Entpacken, Abhängigkeiten installieren, Schema importieren und Dev-Server starten:',
          codeSnippet: {
            lang: 'bash',
            code: 'unzip projekt.zip && cd projekt\nnpm install\nmysql -u root -p datenbank < database/schema.sql\nnpm run dev'
          }
        },
        {
          id: 40,
          question: '40. Was muss installiert sein, um einen exportierten .NET 10 Stack zu kompilieren?',
          answer: 'Das .NET 10 SDK von Microsoft sowie optional eine IDE wie Visual Studio oder VS Code mit C#-Dev-Kit.'
        },
        {
          id: 41,
          question: '41. Welche Befehle sind für den Start des C# ASP.NET Core Backends nötig?',
          answer: 'Navigieren Sie in das Backend-Verzeichnis und starten Sie das Projekt über die .NET CLI:',
          codeSnippet: {
            lang: 'bash',
            code: 'cd backend_dotnet\ndotnet restore\ndotnet build\ndotnet run'
          }
        },
        {
          id: 42,
          question: '42. Was ist für die Kompilierung von Tauri Desktop-Apps erforderlich?',
          answer: 'Die Rust-Toolchain (inklusive cargo), das Tauri-CLI (cargo install tauri-cli) und die C++ Build Tools für Windows.'
        },
        {
          id: 43,
          question: '43. Wie wird die Datenbankanbindung im exportierten Code konfiguriert?',
          answer: 'Über standardisierte Konfigurationsdateien: In Node.js über die .env-Datei, in .NET über die appsettings.json, in PHP über config.php.'
        },
        {
          id: 44,
          question: '44. Was ist für das Hosting eines exportierten PHP-Stacks notwendig?',
          answer: 'Ein Standard-Webserver (Apache oder Nginx) mit PHP 8.x und aktivierter pdo_mysql- oder pdo_pgsql-Erweiterung.'
        }
      ]
    },
    {
      id: 'part5',
      title: 'Teil 5: Workflow, Migration & Praxis-Szenarien',
      badge: 'Praxis & Migration',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      icon: <Cpu size={18} className="text-cyan-400" />,
      description: 'Access-Modernisierung in 4 Schritten, Optimierung der Build-Zeiten und ideale Einsatzgebiete.',
      items: [
        {
          id: 45,
          question: '45. In welchen 4 Schritten läuft die Modernisierung einer MS-Access-Datenbank ab?',
          answer: '1) .accdb- oder .mdb-Datei per Drag & Drop in die Local Bridge laden. 2) Live-Analyse und automatische VBA-/Typen-Transpilierung durchführen. 3) Generierte .dbsp-Projektdatei exportieren. 4) .dbsp in DB Studio Pro öffnen, UI/Logik visuell anpassen und Ziel-Code generieren.'
        },
        {
          id: 46,
          question: '46. Was passiert mit Access-Formularen während des Imports?',
          answer: 'Metadaten und Strukturinformationen werden ausgelesen; das exakte UI wird im Formular-Studio auf Basis moderner Webkomponenten und Grids nachmodelliert.'
        },
        {
          id: 47,
          question: '47. Können nach dem Code-Export manuelle Anpassungen vorgenommen werden?',
          answer: 'Ja, der generierte Quellcode ist modular aufgebaut (getrennte Schichten für Routing, Controller, Services, DB-Access) und kann beliebig um eigene Business-Logik erweitert werden.'
        },
        {
          id: 48,
          question: '48. Wie werden Abhängigkeiten bei wiederholten Builds lokal optimiert?',
          answer: 'Über das Shared_Dependencies-Verzeichnis der Local Bridge, das Pakete mittels NTFS-Symlinks verknüpft und so bis zu 80 % Speicherplatz und Build-Zeit spart.'
        },
        {
          id: 49,
          question: '49. Für welche Anwendungsfälle ist DB Studio ideal geeignet?',
          answer: 'Für Rapid Prototyping, das Ablösen veralteter Access-/Excel-Lösungen, Kunden- und Auftragsverwaltungen (CRM/ERP), Baukalkulationen, Dashboards und Multi-Stack Web-/Desktop-Entwicklungen.'
        },
        {
          id: 50,
          question: '50. Wann sollte man auf klassische Individualprogrammierung setzen statt auf DB Studio?',
          answer: 'Wenn extrem spezialisierte High-Performance-Treiber, proprietäre Nicht-Standard-Datenbanken oder tief in Betriebssystem-Routinen eingreifende Low-Level-Funktionalitäten benötigt werden, die über relationale Standardarchitekturen hinausgehen.'
        }
      ]
    }
  ];

  // Filter items based on category and search query
  const filteredCategories = categories.map((cat) => {
    if (activeCategory !== 'all' && activeCategory !== cat.id) {
      return { ...cat, items: [] };
    }
    const matchingItems = cat.items.filter((item) => {
      const q = searchQuery.toLowerCase();
      return (
        item.question.toLowerCase().includes(q) ||
        (typeof item.answer === 'string' && item.answer.toLowerCase().includes(q))
      );
    });
    return { ...cat, items: matchingItems };
  }).filter((cat) => cat.items.length > 0);

  const totalQuestions = categories.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1f1f2e] to-slate-950 border border-slate-700/60 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                <HelpCircle size={14} className="text-indigo-400" /> Umfassende Wissensdatenbank (FAQ)
              </span>
              <span className="text-xs text-slate-500">|</span>
              <span className="text-xs text-slate-400 font-mono">
                {totalQuestions} verifizierte Fragen &amp; Antworten
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Häufig gestellte Fragen &amp; Technische Fakten
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl mt-1.5 leading-relaxed">
              Vollständige, transparente und ehrliche Antworten zu Architektur, Fähigkeiten, Grenzen, Toolchains und Migrations-Workflows.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#docs"
              onClick={(e) => {
                e.preventDefault();
                alert('Die vollständige Machbarkeits-Auswertung ist in /docs/auswertung.md hinterlegt.');
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <BookOpen size={15} />
              <span>Auswertung (.md) einsehen</span>
            </a>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Frage oder Stichwort suchen (z. B. .NET, Access, OLEDB, Lizenz, Node.js)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Zurücksetzen
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              Alle ({totalQuestions})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === c.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                {c.title.split(':')[0]} ({c.items.length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accordion Categories */}
      <div className="space-y-8">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 p-6">
            <AlertCircle size={32} className="mx-auto text-amber-400 mb-2" />
            <div className="text-base font-bold text-white">Keine passenden Fragen gefunden</div>
            <p className="text-xs text-slate-400 mt-1">
              Versuchen Sie einen anderen Suchbegriff oder setzen Sie den Filter zurück.
            </p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-[#181824] border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
            >
              {/* Category Header */}
              <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{category.title}</h3>
                    <p className="text-xs text-slate-400">{category.description}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${category.badgeColor}`}>
                  {category.items.length} Fragen
                </span>
              </div>

              {/* Category Questions List */}
              <div className="divide-y divide-slate-800/60">
                {category.items.map((item) => {
                  const isExpanded = !!expandedItems[item.id];
                  return (
                    <div key={item.id} className="transition-colors hover:bg-slate-900/30">
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="w-full px-6 py-4 flex items-start justify-between text-left gap-4 cursor-pointer select-none"
                      >
                        <span className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
                          {item.question}
                        </span>
                        <div className="p-1 rounded-lg bg-slate-800/80 text-slate-400 shrink-0 mt-0.5">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-6 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/30 bg-slate-950/30 space-y-3">
                          <div>{item.answer}</div>

                          {item.codeSnippet && (
                            <div className="relative mt-2 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                              <div className="px-4 py-1.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                                  {item.codeSnippet.lang}
                                </span>
                                <button
                                  onClick={() => handleCopyCode(item.id, item.codeSnippet!.code)}
                                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer"
                                >
                                  {copiedSnippetId === item.id ? (
                                    <>
                                      <Check size={12} className="text-emerald-400" />
                                      <span className="text-emerald-400">Kopiert</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      <span>Kopieren</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="p-4 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
                                {item.codeSnippet.code}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info Box */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
          <span>
            Alle Angaben entsprechen der <strong>„Be Honest“-Methodik</strong> für maximale Verlässlichkeit und Transparenz.
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          DB Studio Pro v0.8.5 Beta • Local Bridge v0.9.2
        </div>
      </div>
    </div>
  );
};
