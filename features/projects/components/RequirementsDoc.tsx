import React, { useState, useEffect } from 'react';
import { ClipboardList, BookOpen, FileText, Download, Save, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface ProjectSpec {
  lastenheft: string;
  pflichtenheft: string;
}

interface RequirementsDocProps {
  activeProjectId: string | undefined;
}

export const RequirementsDoc: React.FC<RequirementsDocProps> = ({ activeProjectId }) => {
  const [activeDocType, setActiveDocType] = useState<'lastenheft' | 'pflichtenheft'>('lastenheft');
  const [specs, setSpecs] = useState<Record<string, ProjectSpec>>({});
  const [currentContent, setCurrentContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const defaultLastenheft = `# 📑 LASTENHEFT (Anforderungen des Kunden)
**Projekt-ID:** ${activeProjectId || 'Default'}

## 1. Ausgangslage & Zielsetzung
Ziel des Projekts ist es, ein schnelles, datenbankgestütztes Informationssystem aufzubauen. Es soll einfach zu verwalten sein und eine intuitive Bedienung für Endbenutzer bieten.

## 2. Funktionale Anforderungen
- **F-10:** Speichern von Kunden- und Ticketdaten.
- **F-20:** Definition von flexiblen Beziehungen zwischen Tabellen.
- **F-30:** Echtzeit-Updates bei Schemaänderungen.

## 3. Nicht-funktionale Anforderungen
- **NF-10:** Hohe Ausfallsicherheit durch lokalen Offline-First Modus.
- **NF-20:** Antwortzeiten unter 100ms bei Datenbankabfragen.
- **NF-30:** Datenspeicherung in lokaler, portabler Datei (SQLite).
`;

  const defaultPflichtenheft = `# ⚙️ PFLICHTENHEFT (Technische Spezifikation)
**Projekt-ID:** ${activeProjectId || 'Default'}

## 1. Systemarchitektur & Technologie-Stack
- **Datenbank:** SQLite (.db Datei pro Projekt für vollkommene Kapselung).
- **Backend:** .NET 10 Minimal APIs mit integriertem SignalR Hub für Echtzeit-Ereignisse.
- **Frontend:** React 18, Vite & Tailwind CSS.

## 2. Detaillierte Systemfunktionen
- **S-10 (DB-Anbindung):** Verwendung von Entity Framework Core (EF Core) mit SQLite-Provider.
- **S-20 (SignalR Hub):** \`SchemaHub\` sendet Broadcast-Nachrichten an alle Clients bei Tabellen-Modifikationen.

## 3. Abnahmekriterien
- Alle definierten Tabellen werden fehlerfrei in die lokale SQLite-Datei geschrieben.
- Die .NET 10 REST-API liefert strukturierte JSON-Daten zurück.
`;

  // Load specs from storage
  useEffect(() => {
    const saved = localStorage.getItem('dbstudio_pm_specs');
    let loadedSpecs: Record<string, ProjectSpec> = {};
    if (saved) {
      loadedSpecs = JSON.parse(saved);
      setSpecs(loadedSpecs);
    }

    if (activeProjectId) {
      const projSpec = loadedSpecs[activeProjectId] || {
        lastenheft: defaultLastenheft,
        pflichtenheft: defaultPflichtenheft
      };
      setSpecs(prev => ({ ...prev, [activeProjectId]: projSpec }));
      setCurrentContent(activeDocType === 'lastenheft' ? projSpec.lastenheft : projSpec.pflichtenheft);
    }
  }, [activeProjectId]);

  // Update content when document type switches
  useEffect(() => {
    if (activeProjectId && specs[activeProjectId]) {
      const projSpec = specs[activeProjectId];
      setCurrentContent(activeDocType === 'lastenheft' ? projSpec.lastenheft : projSpec.pflichtenheft);
    }
  }, [activeDocType, activeProjectId]);

  const handleSave = () => {
    if (!activeProjectId) return;

    const updatedSpecs = {
      ...specs,
      [activeProjectId]: {
        ...specs[activeProjectId],
        [activeDocType]: currentContent
      }
    };

    setSpecs(updatedSpecs);
    localStorage.setItem('dbstudio_pm_specs', JSON.stringify(updatedSpecs));
    setIsEditing(false);
  };

  const handleResetToTemplate = () => {
    const template = activeDocType === 'lastenheft' ? defaultLastenheft : defaultPflichtenheft;
    setCurrentContent(template);
    setIsEditing(true);
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([currentContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeDocType}_${activeProjectId || 'project'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-1">
      {/* Doc selector and actions */}
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveDocType('lastenheft')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeDocType === 'lastenheft'
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen size={14} />
            Lastenheft (Anforderungen)
          </button>
          <button
            onClick={() => setActiveDocType('pflichtenheft')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeDocType === 'pflichtenheft'
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText size={14} />
            Pflichtenheft (Spezifikation)
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1.5 rounded transition"
            >
              <Save size={13} /> Speichern
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 border border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 text-xs px-2.5 py-1.5 rounded transition"
            >
              <Eye size={13} /> Bearbeiten
            </button>
          )}

          <button
            onClick={handleResetToTemplate}
            className="flex items-center gap-1 border border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-500 text-xs px-2.5 py-1.5 rounded transition"
            title="Auf Standard-Template zurücksetzen"
          >
            <RefreshCw size={13} /> Vorlage laden
          </button>

          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2.5 py-1.5 rounded transition"
          >
            <Download size={13} /> Markdown Export
          </button>
        </div>
      </div>

      {/* Editor/Viewer body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isEditing ? (
          <div className="flex-1 flex flex-col">
            <textarea
              value={currentContent}
              onChange={(e) => setCurrentContent(e.target.value)}
              className="flex-1 w-full p-4 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:bg-slate-950 dark:text-slate-300 resize-none"
              placeholder="Dokument-Inhalt in Markdown..."
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-200 dark:border-slate-800/80">
            <div className="prose prose-slate max-w-none text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-sans space-y-4">
              {currentContent.split('\n').map((line, idx) => {
                if (line.startsWith('# ')) {
                  return <h1 key={idx} className="text-base font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1 mt-4">{line.replace('# ', '')}</h1>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={idx} className="text-xs font-bold uppercase text-slate-400 mt-5 mb-2 tracking-wide">{line.replace('## ', '')}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={idx} className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-4">{line.replace('### ', '')}</h3>;
                }
                if (line.startsWith('- ')) {
                  return <li key={idx} className="ml-4 list-disc text-slate-600 dark:text-slate-400">{line.replace('- ', '')}</li>;
                }
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={idx} className="font-bold my-1">{line.replace(/\*\*/g, '')}</p>;
                }
                return <p key={idx} className="my-1.5">{line}</p>;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
