import React from 'react';
import {
  Play,
  Eye,
  Code,
  Plus,
  Table as TableIcon,
  Sigma,
  Sliders,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  FileCode,
  Layers,
  ArrowRightLeft,
  Filter,
  CheckSquare,
  HelpCircle,
  Database,
  Trash2
} from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useUIStore } from '../../../stores/useUIStore';
import { useProjectStore } from '../../../stores/useProjectStore';
import { Query, SelectQuery } from '../../../types';

interface QueryDesignTabProps {
  onAction: (action: string, payload?: any) => void;
}

export const QueryDesignTab: React.FC<QueryDesignTabProps> = ({ onAction }) => {
  const ui = useUIStore();
  const store = useProjectStore();

  const { currentView, activeObject } = ui;
  const isQueryResults = currentView.type === 'query_results';
  const isQueryDesigner = currentView.type === 'query_designer';

  const query = (activeObject && 'type' in activeObject && 'columns' in activeObject ? activeObject as Query : null) ||
    (currentView.type === 'query_designer' || currentView.type === 'query_results'
      ? store.queries.find(q => q.id === currentView.queryId) || null
      : null);

  const isSelectQuery = query?.type === 'SELECT';

  return (
    <div className="flex gap-4 h-full items-stretch overflow-x-auto pb-1 max-w-full">
      {/* 1. Ergebnisse & Ausführen */}
      <RibbonGroup label="Ergebnisse & Ansichten">
        <RibbonButton
          icon={<Play className="text-emerald-600 fill-emerald-500" />}
          label="Ausführen"
          onClick={() => onAction('query_run')}
          size="large"
          title="Führt die Abfrage aus und zeigt die Ergebnisdaten an (Access '! Ausführen')"
        />

        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[120px]">
          <button
            onClick={() => {
              if (query) {
                ui.setCurrentView({ type: 'query_designer', queryId: query.id });
              } else if (store.queries.length > 0) {
                ui.setCurrentView({ type: 'query_designer', queryId: store.queries[0].id });
              }
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors text-left font-medium cursor-pointer ${
              isQueryDesigner
                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 font-semibold'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Visueller Abfrage-Designer mit QBE-Grid"
          >
            <Eye size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">Entwurfsansicht</span>
          </button>
          <button
            onClick={() => {
              if (query) {
                ui.setCurrentView({ type: 'query_results', queryId: query.id });
              } else if (store.queries.length > 0) {
                ui.setCurrentView({ type: 'query_results', queryId: store.queries[0].id });
              }
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors text-left font-medium cursor-pointer ${
              isQueryResults
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-semibold'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Ergebnistabelle mit Live-Daten anzeigen"
          >
            <TableIcon size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Datenblattansicht</span>
          </button>
          <button
            onClick={() => onAction('query_open_sql_view')}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Generierten SQL-Code anzeigen / bearbeiten"
          >
            <Code size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">SQL-Ansicht</span>
          </button>
        </div>
      </RibbonGroup>

      {/* 2. Abfragetyp (Access Query Types) */}
      <RibbonGroup label="Abfragetyp">
        <RibbonButton
          icon={<TableIcon className="text-blue-600 dark:text-blue-400" />}
          label="Auswahl (SELECT)"
          active={isSelectQuery}
          onClick={() => onAction('query_set_type_select')}
          size="large"
          title="Standard-Auswahlabfrage zur Datenanzeige"
        />

        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[130px] border-r border-slate-200/50 dark:border-slate-700/60 pr-2">
          <button
            onClick={() => onAction('query_open_crosstab_wizard')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Kreuztabellen-Assistent für Matrix- und Pivot-Auswertungen"
          >
            <FileSpreadsheet size={13} className="text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="truncate">Kreuztabelle (Pivot)</span>
          </button>
          <button
            onClick={() => ui.setActiveWizard('append')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Anfügeabfrage (INSERT INTO) mit Assistent"
          >
            <Plus size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Anfügen (INSERT)</span>
          </button>
          <button
            onClick={() => ui.setActiveWizard('update')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Aktualisierungsabfrage (UPDATE) mit Assistent"
          >
            <RefreshCw size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">Aktualisieren (UPDATE)</span>
          </button>
        </div>

        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[125px]">
          <button
            onClick={() => ui.setActiveWizard('delete')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-800 dark:hover:text-rose-300 transition-colors text-left font-medium cursor-pointer"
            title="Löschabfrage (DELETE FROM) mit Assistent"
          >
            <Trash2 size={13} className="text-rose-500 shrink-0" />
            <span className="truncate">Löschen (DELETE)</span>
          </button>
          <button
            onClick={() => ui.setActiveWizard('duplicate')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Duplikatsuche-Assistent"
          >
            <Layers size={13} className="text-blue-500 shrink-0" />
            <span className="truncate">Duplikatsuche</span>
          </button>
          <button
            onClick={() => ui.setActiveWizard('inconsistency')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Inkonsistenzsuche (verwaiste Datensätze ohne Foreign Key)"
          >
            <HelpCircle size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">Inkonsistenzsuche</span>
          </button>
        </div>
      </RibbonGroup>

      {/* 3. Abfrage-Setup */}
      <RibbonGroup label="Abfrage-Setup">
        <RibbonButton
          icon={<Sigma className="text-indigo-600 dark:text-indigo-400" />}
          label="Summen (Σ)"
          onClick={() => onAction('query_toggle_totals')}
          size="large"
          title="Blendet die Summen-Zeile (GROUP BY / Aggregationen) im QBE-Grid ein/aus"
        />

        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[130px] border-r border-slate-200/50 dark:border-slate-700/60 pr-2">
          <button
            onClick={() => onAction('query_add_table_node')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Weitere Tabelle zur visuellen Abfrage hinzufügen"
          >
            <Plus size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Tabelle einfügen</span>
          </button>
          <button
            onClick={() => onAction('query_open_join_props')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="JOIN-Eigenschaften konfigurieren (INNER JOIN, LEFT JOIN, RIGHT JOIN)"
          >
            <ArrowRightLeft size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">JOIN-Typen...</span>
          </button>
          <button
            onClick={() => onAction('query_open_parameters_modal')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Parameter definieren (z.B. [Bitte Kundennummer eingeben])"
          >
            <Sliders size={13} className="text-amber-500 shrink-0" />
            <span className="truncate">Parameter ([?])...</span>
          </button>
        </div>

        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[120px]">
          <button
            onClick={() => onAction('query_toggle_distinct')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Keine Duplikate (SELECT DISTINCT)"
          >
            <CheckSquare size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="truncate">Eindeutig (DISTINCT)</span>
          </button>
          <button
            onClick={() => onAction('query_open_criteria_helper')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Formel- und Kriterien-Assistent für WHERE-Bedingungen"
          >
            <Sparkles size={13} className="text-purple-500 shrink-0" />
            <span className="truncate">Kriterien-Assistent</span>
          </button>
        </div>
      </RibbonGroup>

      {/* 4. Konvertierung & Export */}
      <RibbonGroup label="Konvertierung & Export" isLast>
        <RibbonButton
          icon={<FileCode className="text-purple-600 dark:text-purple-400" />}
          label="Access SQL Converter"
          onClick={() => onAction('query_open_access_converter')}
          size="large"
          title="Konvertiert MS Access SQL Dialekt in PostgreSQL, SQLite, MySQL und SQL Server"
        />

        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[125px]">
          <button
            onClick={() => onAction('query_export_as_view')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Erstellt ein CREATE VIEW Skript aus dieser Abfrage"
          >
            <Database size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">Als SQL-View</span>
          </button>
          <button
            onClick={() => onAction('query_open_export_modal')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Query-Export als JSON, SQL oder C# LINQ"
          >
            <FileSpreadsheet size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Exportieren...</span>
          </button>
        </div>
      </RibbonGroup>
    </div>
  );
};
