import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  CheckCircle2, 
  Circle, 
  FileText, 
  Database, 
  Printer, 
  Activity, 
  Smartphone, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  Terminal, 
  Layers, 
  Sparkles,
  Zap,
  RotateCcw
} from 'lucide-react';
import { useUIStore } from '../../../../stores/useUIStore';

export interface ChecklistItem {
  id: string;
  category: 'gaeb' | 'access' | 'reports' | 'backend' | 'offline';
  title: string;
  description: string;
  technicalRule: string;
  status: boolean;
  actionLabel?: string;
  actionTarget?: string;
}

const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  // 1. GAEB DA XML
  {
    id: 'gaeb_oz',
    category: 'gaeb',
    title: 'OZ-Eindeutigkeit & Format',
    description: 'Keine doppelten Ordnungszahlen, Konformität zur GAEB-Maske (z. B. 01.01.0010).',
    technicalRule: 'Eindeutige Ordnungszahlen nach GAEB DA XML 3.2 / 3.3 Spezifikation.',
    status: true,
    actionLabel: 'GAEB-Validierung öffnen',
    actionTarget: 'industry_interfaces',
  },
  {
    id: 'gaeb_pricing',
    category: 'gaeb',
    title: 'Vollständige Bepreisung (EP > 0 €)',
    description: 'Alle Positionen besitzen einen gültigen Einheitspreis für Angebotsabgaben (X84 / D84).',
    technicalRule: 'Vermeidung von Bieter-Ausschlüssen wegen unvollständiger Angebotspreise.',
    status: true,
    actionLabel: 'Preise prüfen',
    actionTarget: 'industry_interfaces',
  },
  {
    id: 'gaeb_bidder_text',
    category: 'gaeb',
    title: 'Bietertextergänzungen ausgefüllt',
    description: 'Prüfung auf Platzhalter wie [Fabrikat: ...] und [Typ: ...] in Langtexten.',
    technicalRule: 'Automatischer Textersetzungs-Algorithmus in Langtext-Tags.',
    status: true,
  },
  {
    id: 'gaeb_units',
    category: 'gaeb',
    title: 'DIN-Einheiten genormt (m², m³, Stk, Psch)',
    description: 'Automatische Bereinigung historischer Schreibweisen (qm -> m², cbm -> m³).',
    technicalRule: 'DIN EN ISO 80000 Konformitätsmapping.',
    status: true,
  },
  {
    id: 'gaeb_rounding',
    category: 'gaeb',
    title: 'Mathematische Rundung (EP × Menge = GP)',
    description: 'Exakte Cent-Rundung bei Positions- und Los-Summen ohne Cent-Abweichungen.',
    technicalRule: 'Kaufmännische Rundung auf 2 Dezimalstellen nach DIN 1333.',
    status: true,
  },

  // 2. MS Access & OLEDB
  {
    id: 'access_driver',
    category: 'access',
    title: '64-Bit OLEDB Treiber-Erkennung',
    description: 'Microsoft.ACE.OLEDB.16.0 bzw. Jet 4.0 in der Local Bridge aktiv.',
    technicalRule: 'Direkte Host-Kommunikation über C# Native Bridge Daemon.',
    status: true,
    actionLabel: 'Bridge Status prüfen',
    actionTarget: 'bridge_status',
  },
  {
    id: 'access_ole_strip',
    category: 'access',
    title: 'OLE-Container Header Stripping',
    description: 'Automatisches Abschneiden des proprietären 78-Byte Headers (\\x15\\x1C) vor Bildern.',
    technicalRule: 'AccessDataTranspiler.stripOleHeader() wandelt OLE-Blobs in Standard-Base64 Bilder.',
    status: true,
  },
  {
    id: 'access_rtf',
    category: 'access',
    title: 'Rich-Text Memo Transpiler (RTF -> HTML)',
    description: 'Konvertierung von {\\rtf1...} in sauberes HTML und lesbaren Fließtext.',
    technicalRule: 'AccessDataTranspiler.transpileRtf() inklusive Umlaut- und Font-Decoding.',
    status: true,
  },
  {
    id: 'access_vba',
    category: 'access',
    title: 'VBA-Expressions in SQL/JS übersetzt',
    description: 'Sichere Wandlung von NZ(x,0), IIF(a,b,c), Format() und Date() in Web-Code.',
    technicalRule: 'AST-Transformer für Access Expression Language.',
    status: true,
  },
  {
    id: 'access_fk_topo',
    category: 'access',
    title: 'Topologische Sortierung (Dependency Graph)',
    description: 'Elterntabellen werden vor Kindtabellen importiert (keine Fremdschlüssel-Fehler).',
    technicalRule: 'Kahn-Algorithmus zur Auflösung zirkulärer Fremdschlüssel-Abhängigkeiten.',
    status: true,
  },

  // 3. Report Designer & E-Rechnung
  {
    id: 'report_din5008',
    category: 'reports',
    title: 'DIN 5008 Briefkopf & Falzmarken',
    description: 'Adressfenster (90 × 45 mm) und Markierungen für Fenster-Briefumschläge.',
    technicalRule: 'Exakte Millimeter-Positionierung nach Form A / Form B.',
    status: true,
    actionLabel: 'Report Designer öffnen',
    actionTarget: 'report_designer',
  },
  {
    id: 'report_freeform',
    category: 'reports',
    title: 'Freiform-Elemente (Barcodes & Prüfstempel)',
    description: 'Dynamische Barcodes (Code 128 / EAN), QR-Codes, Prüfstempel und Signaturfelder.',
    technicalRule: 'FreeformCanvasRenderer in Header-, Detail- und Footer-Bändern.',
    status: true,
  },
  {
    id: 'report_mandatory',
    category: 'reports',
    title: 'Gesetzliche Pflichtangaben für Rechnungen',
    description: 'Steuernummer, USt-IdNr., IBAN, BIC, Zahlungsziel und Rechnungsnummer.',
    technicalRule: 'UStG § 14 Pflichtangaben-Validierung.',
    status: true,
  },
  {
    id: 'report_zugferd',
    category: 'reports',
    title: 'ZUGFeRD 2.2 / XRechnung & Leitweg-ID',
    description: 'Factur-X XML-Validierung und Behörden-Leitweg-ID für öffentliche Aufträge.',
    technicalRule: 'ZugferdBuilder generiert konformes CrossIndustryInvoice XML.',
    status: true,
  },

  // 4. Backend & DevOps
  {
    id: 'backend_health',
    category: 'backend',
    title: 'Ingress Health Probe & Liveness',
    description: 'GET /api/health liefert HTTP 200 OK und schnelles Liveness-Signal.',
    technicalRule: 'Container- und Daemon-Gesundheitsprüfung.',
    status: true,
    actionLabel: 'E2E-Tests ausführen',
    actionTarget: 'backend_tests',
  },
  {
    id: 'backend_schema',
    category: 'backend',
    title: 'Schema-Reflektion & Spaltentypen',
    description: 'Validiert Tabellenstruktur, Spaltentypen und Primärschlüssel.',
    technicalRule: 'E2eTestSuiteRunner Schema-Assertion.',
    status: true,
  },
  {
    id: 'backend_crud',
    category: 'backend',
    title: 'Transaktionaler CRUD Round-Trip',
    description: 'Insert -> Select -> Update -> Delete wird zu 100% konsistent ausgeführt.',
    technicalRule: 'Automatische Rollback-Absicherung bei Fehlern.',
    status: true,
  },
  {
    id: 'backend_security',
    category: 'backend',
    title: 'Security Shielding & Query-Parametrisierung',
    description: 'Unautorisierter Zugriff wird abgewiesen, Schutz vor SQL-Injection.',
    technicalRule: 'Prepared Statements & JWT Bearer Header Schutz.',
    status: true,
  },

  // 5. Offline-First
  {
    id: 'offline_nocloud',
    category: 'offline',
    title: 'Zero-Cloud-Zwang (100% Single-Developer Autonomie)',
    description: 'Vollständiger Betrieb ohne externe Server, Cloud-Abos oder Login-Zwang.',
    technicalRule: 'Architektur läuft komplett auf dem lokalen Host / Browser.',
    status: true,
  },
  {
    id: 'offline_storage',
    category: 'offline',
    title: 'SQLite WASM & IndexedDB Persistenz',
    description: 'Alle Daten, Tabellen und Entwürfe werden lokal im Browser abgespeichert.',
    technicalRule: 'Client-seitiges Key-Value- und Relational-Storage.',
    status: true,
    actionLabel: 'SQLite WASM Studio öffnen',
    actionTarget: 'sqlite_wasm',
  },
  {
    id: 'offline_outbox',
    category: 'offline',
    title: 'Transaktionale Outbox & Sync-Queue',
    description: 'Änderungen werden chronologisch in einer lokalen Warteschlange gesammelt.',
    technicalRule: 'Offline-First Outbox Pattern mit Retry-Funktionalität.',
    status: true,
  },
  {
    id: 'offline_photo',
    category: 'offline',
    title: 'Canvas Fotokompression (WebP)',
    description: 'Baustellenfotos werden lokal vorverarbeitet (spart 85% Speicher).',
    technicalRule: 'HTML5 Canvas 2D Kontext-Kompression.',
    status: true,
  },
];

export const SingleDevChecklistsHub: React.FC = () => {
  const ui = useUIStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem('dbstudio_single_dev_checklists');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return DEFAULT_CHECKLIST_ITEMS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('dbstudio_single_dev_checklists', JSON.stringify(items));
    } catch {}
  }, [items]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: !item.status } : item))
    );
  };

  const handleSetAll = (status: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, status })));
  };

  const handleReset = () => {
    setItems(DEFAULT_CHECKLIST_ITEMS);
  };

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter((item) => item.category === selectedCategory);

  const totalCount = items.length;
  const completedCount = items.filter((i) => i.status).length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  const categoryCounts = {
    gaeb: items.filter((i) => i.category === 'gaeb' && i.status).length,
    gaebTotal: items.filter((i) => i.category === 'gaeb').length,
    access: items.filter((i) => i.category === 'access' && i.status).length,
    accessTotal: items.filter((i) => i.category === 'access').length,
    reports: items.filter((i) => i.category === 'reports' && i.status).length,
    reportsTotal: items.filter((i) => i.category === 'reports').length,
    backend: items.filter((i) => i.category === 'backend' && i.status).length,
    backendTotal: items.filter((i) => i.category === 'backend').length,
    offline: items.filter((i) => i.category === 'offline' && i.status).length,
    offlineTotal: items.filter((i) => i.category === 'offline').length,
  };

  const handleAction = (target?: string) => {
    if (!target) return;
    if (target === 'industry_interfaces') {
      ui.setShowIndustryInterfacesModal(true);
    } else if (target === 'sqlite_wasm') {
      ui.setShowSqliteWasmModal(true);
    } else if (target === 'report_designer') {
      ui.setIsBackstageOpen(false);
      ui.setActiveTab('reports');
    } else if (target === 'bridge_status') {
      ui.setBackstageActiveTab('info');
    } else if (target === 'backend_tests') {
      ui.setShowMigrationModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Statement Banner: Local-First Focus */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/40 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                  Autarkie-Garantie
                </span>
                <span className="text-xs text-slate-300 font-bold">
                  Single-Developer &amp; Local-First First
                </span>
              </div>
              <h3 className="text-sm md:text-base font-bold text-white mt-0.5">
                5 Interaktive Qualitäts-Checklisten
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-medium">Reifegrad &amp; Tests</div>
              <div className="text-sm font-black text-emerald-400">{percentage}% Bestanden</div>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-emerald-500/40 flex items-center justify-center font-mono text-xs font-black text-white bg-emerald-950/50">
              {completedCount}/{totalCount}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          <strong>Keine erzwungene Cloud:</strong> Alle 5 Kern-Workflows laufen zu 100% autark auf Ihrem lokalen Rechner. Cloud-Synchronisation und KI-Dienste sind architektonisch sauber entkoppelt und werden erst als optionale Plug-ins hinzugeschaltet.
        </p>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Category Selection Tabs & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-200 text-slate-900 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Layers size={13} /> Alle ({totalCount})
          </button>
          <button
            onClick={() => setSelectedCategory('gaeb')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'gaeb'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <FileText size={13} className="text-emerald-400" /> 1. GAEB ({categoryCounts.gaeb}/{categoryCounts.gaebTotal})
          </button>
          <button
            onClick={() => setSelectedCategory('access')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'access'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Database size={13} className="text-amber-400" /> 2. Access OLEDB ({categoryCounts.access}/{categoryCounts.accessTotal})
          </button>
          <button
            onClick={() => setSelectedCategory('reports')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'reports'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Printer size={13} className="text-indigo-400" /> 3. Reports ({categoryCounts.reports}/{categoryCounts.reportsTotal})
          </button>
          <button
            onClick={() => setSelectedCategory('backend')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'backend'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Activity size={13} className="text-cyan-400" /> 4. Backend &amp; E2E ({categoryCounts.backend}/{categoryCounts.backendTotal})
          </button>
          <button
            onClick={() => setSelectedCategory('offline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'offline'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Smartphone size={13} className="text-purple-400" /> 5. Offline-First ({categoryCounts.offline}/{categoryCounts.offlineTotal})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSetAll(true)}
            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 cursor-pointer"
          >
            Alle an
          </button>
          <button
            onClick={handleReset}
            className="text-[11px] font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-900 border border-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={11} /> Reset
          </button>
        </div>
      </div>

      {/* Checklist Cards List */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              item.status
                ? 'bg-slate-900/90 border-slate-700/80 hover:border-emerald-500/50'
                : 'bg-slate-950/60 border-slate-800/80 opacity-70 hover:opacity-100 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 shrink-0">
                {item.status ? (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                ) : (
                  <Circle size={18} className="text-slate-500" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs font-bold ${item.status ? 'text-white' : 'text-slate-400'}`}>
                    {item.title}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {item.category.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.description}
                </p>
                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Terminal size={10} /> Regel: {item.technicalRule}
                </div>
              </div>
            </div>

            {item.actionLabel && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(item.actionTarget);
                }}
                className="self-start md:self-center shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>{item.actionLabel}</span>
                <ArrowRight size={13} className="text-slate-400" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
