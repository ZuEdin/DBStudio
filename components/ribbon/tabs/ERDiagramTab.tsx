import React from 'react';
import {
  Save,
  Plus,
  LayoutGrid,
  FileDown,
  Network,
  ShieldCheck,
  Zap,
  Code,
  Sparkles,
  GitFork,
  BookOpen,
  ListTree,
  Database,
  Magnet,
  MapPin,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowDown,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronDown
} from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';
import { useERDiagramStore } from '../../../features/relationships/stores/useERDiagramStore';
import { NotationStyle } from '../../../features/relationships/types/erDesignerTypes';

interface ERDiagramTabProps {
  onAction: (action: string, payload?: any) => void;
}

export const ERDiagramTab: React.FC<ERDiagramTabProps> = ({ onAction }) => {
  const { t } = useTranslation();
  const {
    notationStyle,
    setNotationStyle,
    linterScore,
    linterIssuesCount,
    isLinterOpen,
    setIsLinterOpen,
    isDbmlOpen,
    toggleDbmlOpen,
    setIsSqlReverseModalOpen,
    setIsSchemaDiffModalOpen,
    setIsMockDataModalOpen,
    setIsDataDictionaryModalOpen,
    setIsEnumManagerModalOpen,
    snapToGrid,
    toggleSnapToGrid,
    showMinimap,
    toggleMinimap,
    triggerAction
  } = useERDiagramStore();

  const getScoreColor = () => {
    if (linterScore >= 90) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700';
    if (linterScore >= 70) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700';
    return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700';
  };

  return (
    <div className="flex gap-2 h-full items-stretch overflow-x-auto pb-0.5 select-none">
      {/* 1. Layout & Modell */}
      <RibbonGroup label="Modell & Anordnung">
        <RibbonButton
          icon={<Save className="text-blue-600 dark:text-blue-400" />}
          label="Layout Speichern"
          onClick={() => onAction('save_relationships')}
          size="large"
          title="Speichert die visuellen Positionen aller Tabellen im Beziehungsdiagramm"
        />

        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[130px]">
          <button
            onClick={() => triggerAction('auto_layout_tb')}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Hierarchische Top-Down Anordnung (Dagre DAG Layout)"
          >
            <ArrowDown size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">Top-Down Layout</span>
          </button>
          <button
            onClick={() => triggerAction('auto_layout_lr')}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Hierarchische Links-nach-Rechts Anordnung"
          >
            <ArrowRight size={13} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="truncate">Left-Right Layout</span>
          </button>
          <button
            onClick={() => triggerAction('layout_physics')}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Entflechtung durch physikalische Federsimulation"
          >
            <Zap size={13} className="text-amber-500 shrink-0" />
            <span className="truncate">Physik-Entflechtung</span>
          </button>
        </div>

        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[125px]">
          <button
            onClick={() => onAction('create_table')}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Neue Tabelle im Datenmodell anlegen"
          >
            <Plus size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Tabelle einfügen</span>
          </button>
          <button
            onClick={() => onAction('show_all_tables_in_erd')}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Alle Tabellen des Projekts auf der Arbeitsfläche einblenden"
          >
            <Network size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">Alle einblenden</span>
          </button>
          <button
            onClick={() => triggerAction('layout_grid')}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Tabellen im ordentlichen 4-Spalten-Gitter anordnen"
          >
            <LayoutGrid size={13} className="text-slate-600 dark:text-slate-400 shrink-0" />
            <span className="truncate">Gitter-Raster</span>
          </button>
        </div>
      </RibbonGroup>

      {/* 2. Notation & Ansicht */}
      <RibbonGroup label="Notation & Ansicht">
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[130px]">
          <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-0.5">
            Notationsstil
          </div>
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setNotationStyle('crows_foot')}
              className={`flex-1 px-1.5 py-1 text-[11px] font-semibold rounded transition-all cursor-pointer ${
                notationStyle === 'crows_foot'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Krähenfuß-Notation (IE Crow's Foot)"
            >
              Crow's Foot
            </button>
            <button
              onClick={() => setNotationStyle('uml')}
              className={`flex-1 px-1.5 py-1 text-[11px] font-semibold rounded transition-all cursor-pointer ${
                notationStyle === 'uml'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="UML Multiplizitäts-Notation (1..*)"
            >
              UML
            </button>
            <button
              onClick={() => setNotationStyle('chen')}
              className={`flex-1 px-1.5 py-1 text-[11px] font-semibold rounded transition-all cursor-pointer ${
                notationStyle === 'chen'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Peter Chen ER-Notation (1:N, N:M)"
            >
              Chen
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[110px]">
          <button
            onClick={toggleSnapToGrid}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors text-left font-medium cursor-pointer ${
              snapToGrid
                ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 font-semibold'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
            title="Magnetisches Raster-Einrasten aktivieren/deaktivieren"
          >
            <Magnet size={13} className={snapToGrid ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
            <span className="truncate">Raster-Fang {snapToGrid ? 'An' : 'Aus'}</span>
          </button>
          <button
            onClick={toggleMinimap}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors text-left font-medium cursor-pointer ${
              showMinimap
                ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 font-semibold'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
            title="Minimap Übersichtskarte umschalten"
          >
            <MapPin size={13} className={showMinimap ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
            <span className="truncate">Minimap</span>
          </button>
        </div>

        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[100px]">
          <button
            onClick={() => triggerAction('fit_view')}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Alle Tabellen in den sichtbaren Bereich einpassen"
          >
            <Maximize2 size={13} className="text-slate-600 dark:text-slate-400 shrink-0" />
            <span className="truncate">Einpassen</span>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => triggerAction('zoom_in')}
              className="flex items-center justify-center p-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer flex-1"
              title="Heranzoomen"
            >
              <ZoomIn size={14} className="text-slate-600 dark:text-slate-400" />
            </button>
            <button
              onClick={() => triggerAction('zoom_out')}
              className="flex items-center justify-center p-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer flex-1"
              title="Herauszoomen"
            >
              <ZoomOut size={14} className="text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
      </RibbonGroup>

      {/* 3. Schema-Engineering & Code */}
      <RibbonGroup label="Schema & Code">
        <RibbonButton
          icon={<Code className="text-indigo-600 dark:text-indigo-400" />}
          label="DBML Editor"
          onClick={toggleDbmlOpen}
          active={isDbmlOpen}
          size="large"
          title="Bidirektionalen 2-Wege DBML Split-Code-Editor öffnen/schließen"
        />

        <RibbonButton
          icon={<Database className="text-emerald-600 dark:text-emerald-400" />}
          label="SQL Import"
          onClick={() => setIsSqlReverseModalOpen(true)}
          size="large"
          title="Bestehendes SQL DDL Skript importieren (Reverse Engineering)"
        />

        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[135px]">
          <button
            onClick={() => setIsSchemaDiffModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Vorher/Nachher Schema-Diff und UP/DOWN Migrationsskripte erstellen"
          >
            <GitFork size={13} className="text-amber-500 shrink-0" />
            <span className="truncate">Diff & Migrationen</span>
          </button>
          <button
            onClick={() => setIsEnumManagerModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Globale ENUM-Wertelisten und benutzerdefinierte Typen verwalten"
          >
            <ListTree size={13} className="text-pink-600 dark:text-pink-400 shrink-0" />
            <span className="truncate">ENUMs & Typen</span>
          </button>
        </div>
      </RibbonGroup>

      {/* 4. Integrität & Linter */}
      <RibbonGroup label="Integrität & Analyse">
        <button
          onClick={() => setIsLinterOpen(true)}
          className={`flex flex-col items-center justify-center p-2 rounded transition-colors cursor-pointer w-24 border ${getScoreColor()}`}
          title="Automatischer Database Linter & Normalisierungs-Assistent"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Activity size={16} />
            <span className="font-extrabold text-sm">{linterScore}%</span>
          </div>
          <span className="text-[11px] font-bold text-center leading-tight">Health Check</span>
          <span className="text-[9px] opacity-80 mt-0.5">{linterIssuesCount} {linterIssuesCount === 1 ? 'Meldung' : 'Meldungen'}</span>
        </button>

        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[130px]">
          <button
            onClick={() => onAction('validate_foreign_keys')}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Prüft referenzielle Integrität und verwaiste Fremdschlüssel"
          >
            <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">FK Integrität</span>
          </button>
          <button
            onClick={() => onAction('export_fk_ddl')}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="SQL ALTER TABLE ADD CONSTRAINT FOREIGN KEY Skript kopieren"
          >
            <Code size={13} className="text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="truncate">FK SQL Skript</span>
          </button>
        </div>
      </RibbonGroup>

      {/* 5. Synthese & Dokumentation */}
      <RibbonGroup label="Synthese & Export" isLast>
        <RibbonButton
          icon={<Sparkles className="text-purple-600 dark:text-purple-400" />}
          label="Mock-Daten"
          onClick={() => setIsMockDataModalOpen(true)}
          size="large"
          title="Synthetische, graph-konsistente Testdaten generieren"
        />

        <RibbonButton
          icon={<BookOpen className="text-cyan-600 dark:text-cyan-400" />}
          label="Data Dictionary"
          onClick={() => setIsDataDictionaryModalOpen(true)}
          size="large"
          title="Technische Dokumentation (Markdown, Prisma, TypeSpec) generieren"
        />

        <RibbonButton
          icon={<FileDown className="text-emerald-600 dark:text-emerald-400" />}
          label="Bild Export"
          onClick={() => onAction('export_er_image')}
          size="large"
          title="Exportiert das ER-Diagramm als Bild / Druckansicht"
        />
      </RibbonGroup>
    </div>
  );
};

