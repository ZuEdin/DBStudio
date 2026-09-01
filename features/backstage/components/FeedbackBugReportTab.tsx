import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  Send, 
  Copy, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  RefreshCw, 
  FileText, 
  Cpu, 
  Database, 
  ShieldAlert, 
  Laptop, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';
import { useBridgeStore } from '../../../stores/useBridgeStore';
import { saveLocalTicket } from '../../../services/ticketStorageService';
import { Ticket } from '../../../types';

interface FeedbackBugReportTabProps {
  onGoToTickets?: () => void;
}

export const FeedbackBugReportTab: React.FC<FeedbackBugReportTabProps> = ({ onGoToTickets }) => {
  const store = useProjectStore();
  const ui = useUIStore();
  const bridge = useBridgeStore();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [category, setCategory] = useState<'ui' | 'database' | 'code_export' | 'einvoice' | 'performance' | 'other'>('ui');
  const [includeSystemDiagnostics, setIncludeSystemDiagnostics] = useState(true);

  // Status feedback
  const [copied, setCopied] = useState(false);
  const [savedToTickets, setSavedToTickets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live System Diagnosis State
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const gatherDiagnostics = () => {
    const tableCount = store.tables?.length || 0;
    const queryCount = store.queries?.length || 0;
    const formCount = store.forms?.length || 0;
    const reportCount = store.reports?.length || 0;
    const totalFields = (store.tables || []).reduce((sum, t) => sum + (t.fields?.length || 0), 0);

    const diag = {
      timestamp: new Date().toISOString(),
      app: {
        name: 'DB Studio Pro',
        version: '1.0.0 (2026 Gold Master)',
        mode: 'Client-Side / Local-First',
        theme: ui.darkMode ? 'Dark Mode' : 'Light Mode'
      },
      currentView: {
        type: ui.currentView?.type || 'unknown',
        activeTab: ui.activeTab || 'home',
        activeObject: ui.activeObject?.name || ui.activeObject?.id || null
      },
      project: {
        id: store.projectId || 'none',
        name: store.projectName || 'Unbenannt',
        tablesCount: tableCount,
        fieldsCount: totalFields,
        queriesCount: queryCount,
        formsCount: formCount,
        reportsCount: reportCount,
        hasUnsavedChanges: ui.isDirty
      },
      bridge: {
        isOnline: bridge.isOnline,
        host: bridge.config?.host || 'localhost:5000'
      },
      environment: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
        language: typeof navigator !== 'undefined' ? navigator.language : 'de-DE',
        screenResolution: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
        indexedDbAvailable: typeof window !== 'undefined' && 'indexedDB' in window
      }
    };
    setDiagnostics(diag);
    return diag;
  };

  useEffect(() => {
    gatherDiagnostics();
  }, [store.projectId, store.tables, ui.currentView, bridge.isOnline]);

  const generateReportPayload = () => {
    return {
      reportType: 'BUG_REPORT',
      title: title.trim() || 'Unbenannter Fehlerbericht',
      description: description.trim(),
      stepsToReproduce: stepsToReproduce.trim(),
      severity,
      category,
      createdAt: new Date().toISOString(),
      systemDiagnostics: includeSystemDiagnostics ? diagnostics : { note: 'Vom Benutzer deaktiviert' }
    };
  };

  const generateReportMarkdown = () => {
    const payload = generateReportPayload();
    return `### 🐛 [BUG REPORT] ${payload.title}
**Dringlichkeit:** ${severity.toUpperCase()} | **Kategorie:** ${category}
**Erstellt am:** ${new Date().toLocaleString('de-DE')}
**Aktive Ansicht:** ${payload.systemDiagnostics?.currentView?.type || 'N/A'} (Tab: ${payload.systemDiagnostics?.currentView?.activeTab || 'N/A'})

#### 📝 Beschreibung
${payload.description || 'Keine nähere Beschreibung angegeben.'}

#### 🔄 Schritte zur Reproduktion
${payload.stepsToReproduce || '1. \n2. \n3. '}

${includeSystemDiagnostics ? `
<details>
<summary>🖥️ System- und Projekt-Diagnosedaten</summary>

\`\`\`json
${JSON.stringify(payload.systemDiagnostics, null, 2)}
\`\`\`
</details>
` : ''}`;
  };

  const handleCopyReport = () => {
    const md = generateReportMarkdown();
    navigator.clipboard.writeText(md);
    setCopied(true);
    ui.addToast("Fehlerbericht als formatierter Text in die Zwischenablage kopiert.", "info");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadDiagnosticsJson = () => {
    const payload = generateReportPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `db-studio-bug-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    ui.addToast("Diagnose-JSON erfolgreich heruntergeladen.", "success");
  };

  const handleSaveToTicketBoard = async () => {
    if (!title.trim()) {
      ui.addToast("Bitte geben Sie einen Kurztitel für den Fehlerbericht ein.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const priorityMap: Record<string, 'low' | 'medium' | 'high'> = {
        low: 'low',
        medium: 'medium',
        high: 'high',
        critical: 'high'
      };

      const ticketPriority = priorityMap[severity] || 'medium';
      const fullDesc = `${description.trim()}\n\n---\n**Schritte:**\n${stepsToReproduce.trim()}\n\n**Kategorie:** ${category}\n**Ansicht:** ${diagnostics?.currentView?.type || 'N/A'}`;

      const newTicket: Ticket = {
        id: 'ticket-bug-' + crypto.randomUUID(),
        title: `[BUG] ${title.trim()}`,
        description: fullDesc,
        status: 'todo',
        priority: ticketPriority,
        assignedTo: 'u1',
        assignedToName: 'Me',
        createdBy: 'u1',
        createdByName: 'Bug-Reporter',
        createdAt: Date.now()
      };

      await saveLocalTicket(newTicket);
      setSavedToTickets(true);
      ui.addToast("Fehlerbericht erfolgreich im lokalen Ticket-Board hinterlegt!", "success");
      setTimeout(() => setSavedToTickets(false), 3000);
    } catch (e) {
      console.error(e);
      ui.addToast("Fehler beim Speichern im Ticket-Board.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#2b2b2b] text-neutral-100 overflow-y-auto px-6 sm:px-10 py-6 select-none">
      {/* Header */}
      <div className="mb-6 border-b border-[#383838] pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 px-2.5 py-0.5 rounded border border-rose-800 flex items-center gap-1.5">
              <Bug size={12} className="text-rose-400" /> Diagnose &amp; Fehlererfassung
            </span>
            <span className="text-xs text-neutral-400">Backstage Feedback-Portal</span>
          </div>
          <h1 className="text-2xl font-light tracking-tight text-white flex items-center gap-2.5">
            Feedback &amp; Fehlerbericht (Bug Report)
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Erfassen Sie reproduzierbare Fehler oder Verbesserungsvorschläge inklusive automatischer Systemdiagnose.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={gatherDiagnostics}
            className="px-3 py-1.5 rounded-lg bg-[#333333] hover:bg-[#3d3d3d] border border-[#484848] text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Diagnosedaten jetzt neu auslesen"
          >
            <RefreshCw size={13} />
            <span>Diagnose aktualisieren</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left 2 Columns: Bug Report Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Main Info Card */}
          <div className="bg-[#333333] border border-[#444444] rounded-2xl p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText size={16} className="text-indigo-400" />
              1. Fehler- &amp; Feedback-Details
            </h2>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Kurztitel / Zusammenfassung <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. SQL-Abfrageeditor meldet Syntaxfehler bei LEFT JOIN oder Formular speichert Feld nicht"
                className="w-full bg-[#242424] border border-[#444444] focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none transition-colors"
              />
            </div>

            {/* Category & Severity Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Dringlichkeitsstufe (Severity)
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full bg-[#242424] border border-[#444444] focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="low">Niedrig (Kosmetisch / Tippfehler)</option>
                  <option value="medium">Mittel (Funktion teilweise beeinträchtigt)</option>
                  <option value="high">Hoch (Wesentliche Funktion blockiert)</option>
                  <option value="critical">Kritisch (Datenverlust / Absturz)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Betroffener Bereich
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-[#242424] border border-[#444444] focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="ui">Benutzeroberfläche / Ribbon / Navigation</option>
                  <option value="database">Tabellen, Relationen &amp; Schema</option>
                  <option value="code_export">Code-Export (.NET, Node, Python, SQL)</option>
                  <option value="einvoice">E-Invoicing (ZUGFeRD / Swiss QR)</option>
                  <option value="performance">Leistung / IndexedDB / Local Bridge</option>
                  <option value="other">Sonstiges / Allgemeines Feedback</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Detaillierte Fehlerbeschreibung
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Was genau ist passiert? Was war das erwartete Verhalten und was ist stattdessen aufgetreten?"
                className="w-full bg-[#242424] border border-[#444444] focus:border-indigo-500 rounded-lg p-3 text-xs text-white placeholder-neutral-500 outline-none resize-y transition-colors"
              />
            </div>

            {/* Steps to Reproduce */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Schritte zur Reproduktion (How to reproduce)
              </label>
              <textarea
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                rows={3}
                placeholder="1. Klick auf Tabelle erstellen&#10;2. Feld 'Rechnungsbetrag' als DECIMAL hinzufügen&#10;3. Klick auf Speichern..."
                className="w-full bg-[#242424] border border-[#444444] focus:border-indigo-500 rounded-lg p-3 text-xs text-white placeholder-neutral-500 outline-none resize-y font-mono text-[11px] transition-colors"
              />
            </div>

            {/* Checkbox for Diagnostics */}
            <div className="pt-2 flex items-center gap-2.5">
              <input
                type="checkbox"
                id="check-diagnostics"
                checked={includeSystemDiagnostics}
                onChange={(e) => setIncludeSystemDiagnostics(e.target.checked)}
                className="rounded accent-indigo-500 cursor-pointer size-4"
              />
              <label htmlFor="check-diagnostics" className="text-xs text-neutral-300 cursor-pointer select-none">
                Automatische System- und Projekt-Diagnosedaten anhängen (empfohlen für schnelle Analyse)
              </label>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="bg-[#333333] border border-[#444444] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSaveToTicketBoard}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ClipboardList size={15} />
                <span>Als internes Ticket speichern</span>
              </button>

              <button
                onClick={handleCopyReport}
                className="px-4 py-2.5 rounded-xl bg-[#2b2b2b] hover:bg-[#383838] border border-[#484848] text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Copy size={15} className={copied ? 'text-emerald-400' : 'text-neutral-400'} />
                <span>{copied ? 'Kopiert! ✔' : 'Bericht kopieren (Markdown)'}</span>
              </button>

              <button
                onClick={handleDownloadDiagnosticsJson}
                className="px-4 py-2.5 rounded-xl bg-[#2b2b2b] hover:bg-[#383838] border border-[#484848] text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download size={15} className="text-neutral-400" />
                <span>JSON herunterladen</span>
              </button>
            </div>

            {savedToTickets && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Ticket erfolgreich angelegt!
              </span>
            )}
          </div>
        </div>

        {/* Right 1 Column: Live Diagnostic Overview */}
        <div className="space-y-5">
          <div className="bg-[#333333] border border-[#444444] rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#444444] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-1.5">
                <Cpu size={15} className="text-emerald-400" />
                Live-Diagnosedaten
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                Echtzeit-Check
              </span>
            </div>

            {diagnostics && (
              <div className="space-y-3 text-xs">
                <div className="bg-[#242424] p-3 rounded-xl border border-[#3d3d3d] space-y-1.5">
                  <div className="text-[11px] font-bold text-indigo-300">Software &amp; Version</div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>App:</span> <span className="font-mono text-white">{diagnostics.app.name}</span>
                  </div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>Build:</span> <span className="font-mono text-neutral-400">{diagnostics.app.version}</span>
                  </div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>Aktiver Tab:</span> <span className="font-mono text-amber-400">{diagnostics.currentView.activeTab}</span>
                  </div>
                </div>

                <div className="bg-[#242424] p-3 rounded-xl border border-[#3d3d3d] space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-300">Projekt &amp; Speicher</div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>Projektname:</span> <span className="font-mono text-white">{diagnostics.project.name}</span>
                  </div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>Tabellen / Spalten:</span> <span className="font-mono text-neutral-400">{diagnostics.project.tablesCount} / {diagnostics.project.fieldsCount}</span>
                  </div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>Abfragen / Masken:</span> <span className="font-mono text-neutral-400">{diagnostics.project.queriesCount} / {diagnostics.project.formsCount}</span>
                  </div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>Ungespeicherte Änd.:</span> <span className={`font-mono font-bold ${diagnostics.project.hasUnsavedChanges ? 'text-amber-400' : 'text-emerald-400'}`}>{diagnostics.project.hasUnsavedChanges ? 'Ja (Dirty)' : 'Keine'}</span>
                  </div>
                </div>

                <div className="bg-[#242424] p-3 rounded-xl border border-[#3d3d3d] space-y-1.5">
                  <div className="text-[11px] font-bold text-sky-300">Systemumgebung &amp; Bridge</div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>IndexedDB:</span> <span className="font-mono text-emerald-400">Verfügbar (OK)</span>
                  </div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>Local Bridge:</span> <span className={`font-mono font-bold ${diagnostics.bridge.isOnline ? 'text-emerald-400' : 'text-neutral-500'}`}>{diagnostics.bridge.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                  <div className="text-neutral-300 flex justify-between">
                    <span>Auflösung:</span> <span className="font-mono text-neutral-400">{diagnostics.environment.screenResolution}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Help Info Box */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-[#2f2b3d] to-[#333333] border border-indigo-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
              <Info size={16} className="text-indigo-400" />
              <span>Wohin geht dieser Bericht?</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              DB Studio Pro ist 100% Local-First. Es werden keine Daten ungefragt an externe Server gesendet. Sie entscheiden selbst:
            </p>
            <ul className="text-[11px] text-neutral-400 space-y-1 list-disc list-inside">
              <li>Lokal im <strong>internen Kanban-Board</strong> für Ihr Team speichern</li>
              <li>Als Markdown für <strong>GitHub Issues oder E-Mails</strong> kopieren</li>
              <li>Als JSON-Datei für Support-Zwecke exportieren</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
