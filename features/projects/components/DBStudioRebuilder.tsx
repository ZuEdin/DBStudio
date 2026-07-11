import React, { useState } from 'react';
import { Layers, Lightbulb, Puzzle, Code, RefreshCw, Sparkles, Wand2 } from 'lucide-react';

export const DBStudioRebuilder: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      title: "1. Das Haupt-Layout & Menüband (Ribbon)",
      subtitle: "SDUI Page & Component Engine",
      challenge: "Wie baut man die Navigation und die dynamischen Ribbon-Tabs ohne statischen Code nach?",
      solution: "Verwenden Sie die 'Pages & SDUI' Engine von DB Studio. Definieren Sie ein horizontales Layout für die Ribbon-Kopfzeile und binden Sie das aktive Tab-Ereignis an ein lokales State-Objekt. Die einzelnen Ribbon-Buttons können als 'Custom Components' definiert werden, welche bei Klick vordefinierte Ereignis-Routen triggern.",
      tools: ["Page Designer", "Custom Components Manager"],
      blueprint: `{
  "type": "container",
  "props": { "direction": "row", "padding": "4", "bg": "slate-800" },
  "children": [
    {
      "type": "button",
      "props": { "label": "Start", "action": "SET_TAB_HOME" }
    },
    {
      "type": "button",
      "props": { "label": "Erstellen", "action": "SET_TAB_CREATE" }
    }
  ]
}`
    },
    {
      title: "2. Tabellen- & Schema-Editor",
      subtitle: "ER-Beziehungen & Datenbank-Kompilierung",
      challenge: "Wie verwaltet man dynamisch Tabellen und deren Fremdschlüssel über eine visuelle Oberfläche?",
      solution: "Nutzen Sie den integrierten 'ERDiagramTab' und den Schema-Wizard im 'Erstellen'-Tab. Über das ER-Diagramm können Entitäten als interaktive Boxen gerendert und Beziehungen per Drag-and-Drop gezeichnet werden. Das resultierende JSON-Schema wird direkt in das SQLite Migrations-Skript kompiliert.",
      tools: ["Relationships ER-Diagram", "Schema Wizard"],
      blueprint: `CREATE TABLE IF NOT EXISTS "TablesMetadata" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "columns_json" TEXT NOT NULL,
    "relationships_json" TEXT
);`
    },
    {
      title: "3. Workflow- & Event-Steuerung",
      subtitle: "Prozess-Modellierung mit SignalR",
      challenge: "Wie reagiert das selbstgebaute Studio auf Schema-Updates oder Benutzer-Eingaben in Echtzeit?",
      solution: "Verwenden Sie den 'Workflow Design'-Tab. Definieren Sie Trigger (z.B. 'OnTableCreated'), Bedingungen und Aktionen (z.B. 'SendSignalRNotification'). Das .NET 10 Backend fungiert als SignalR-Relay, das die Schema-Events an alle kooperierenden Entwickler-Clients verteilt.",
      tools: ["Workflow Designer", "Logic Designer", ".NET 10 & SignalR Engine"],
      blueprint: `// SignalR Client-Empfänger für Workflow-Aktionen
connection.on("SchemaChanged", (data) => {
    workflowEngine.trigger("OnTableCreated", data);
});`
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden p-1">
      {/* Steps Selector & Info (5 Columns) */}
      <div className="lg:col-span-5 border-r border-slate-200 dark:border-slate-800 pr-4 flex flex-col justify-between h-full overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers size={14} className="text-purple-600" />
              DB Studio Selbstbau-Anleitung
            </h3>
            <p className="text-[11px] text-slate-500">
              Bauen Sie das gesamte DB Studio mit den hauseigenen Ribbon-Tools und SDUI-Komponenten vollständig nach. Folgen Sie diesem Fahrplan:
            </p>
          </div>

          <div className="space-y-2">
            {steps.map((st, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`w-full p-2.5 rounded-lg border text-left transition text-xs ${
                  activeStep === i
                    ? 'border-purple-600 bg-purple-50/20 dark:bg-purple-950/20 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${
                    activeStep === i ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="truncate flex-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{st.title}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{st.subtitle}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 p-3 rounded-lg flex items-start gap-2 text-[11px] text-purple-800 dark:text-purple-300">
            <Lightbulb size={16} className="text-purple-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Eigengewächs-Philosophie:</span> Durch die Kombination von SDUI, EF Core SQLite und Workflows ist DB Studio absolut in der Lage, sich selbst zu entwerfen und zu betreiben!
            </div>
          </div>
        </div>
      </div>

      {/* Blueprint Code/Spec Viewer (7 Columns) */}
      <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
        <div className="space-y-4 flex-1 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Sparkles size={14} className="text-purple-600" />
              Architektur-Fahrplan für Schritt {activeStep + 1}
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-200 dark:border-slate-850">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200">🎯 Die Herausforderung:</span>
                <p className="mt-0.5 text-slate-500">{steps[activeStep].challenge}</p>
              </div>
              <div className="pt-2">
                <span className="font-bold text-slate-700 dark:text-slate-200">🛠️ Die Lösung im Selbstbau:</span>
                <p className="mt-0.5 text-slate-500">{steps[activeStep].solution}</p>
              </div>
            </div>

            {/* Required ribbon tools badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mr-1">Benötigte Ribbon-Tools:</span>
              {steps[activeStep].tools.map((t, i) => (
                <span key={i} className="text-[10px] bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 font-semibold px-2 py-0.5 rounded border border-purple-200 dark:border-purple-900/40">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Blueprint template config block */}
          <div className="flex flex-col flex-1 min-h-[160px] pt-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
              <Code size={13} className="text-purple-500" />
              SDUI Schema / Code-Blueprint
            </div>
            <div className="flex-1 overflow-auto bg-slate-900 dark:bg-slate-950 p-3.5 rounded-lg font-mono text-[11px] text-purple-300 leading-relaxed border border-slate-800">
              <pre>{steps[activeStep].blueprint}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
