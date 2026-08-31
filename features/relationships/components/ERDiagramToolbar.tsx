import React from 'react';
import { 
  Grid, 
  Zap, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  ShieldCheck, 
  Code, 
  Database, 
  GitCompare, 
  Sparkles, 
  BookOpen, 
  ListOrdered, 
  Magnet, 
  Layers, 
  ArrowDown, 
  ArrowRight,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { NotationStyle, LayoutDirection } from '../types/erDesignerTypes';

interface ERDiagramToolbarProps {
  notationStyle: NotationStyle;
  onNotationStyleChange: (style: NotationStyle) => void;
  onAutoLayout: (direction: LayoutDirection) => void;
  onPhysicsLayout: () => void;
  onGridLayout: () => void;
  linterScore: number;
  linterIssueCount: number;
  onOpenLinter: () => void;
  onToggleDbmlSplit: () => void;
  isDbmlOpen: boolean;
  onOpenSqlReverseEngineer: () => void;
  onOpenSchemaDiff: () => void;
  onOpenMockDataGenerator: () => void;
  onOpenDataDictionary: () => void;
  onOpenEnumManager: () => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

export const ERDiagramToolbar: React.FC<ERDiagramToolbarProps> = ({
  notationStyle,
  onNotationStyleChange,
  onAutoLayout,
  onPhysicsLayout,
  onGridLayout,
  linterScore,
  linterIssueCount,
  onOpenLinter,
  onToggleDbmlSplit,
  isDbmlOpen,
  onOpenSqlReverseEngineer,
  onOpenSchemaDiff,
  onOpenMockDataGenerator,
  onOpenDataDictionary,
  onOpenEnumManager,
  snapToGrid,
  onToggleSnapToGrid,
  showMinimap,
  onToggleMinimap,
  onZoomIn,
  onZoomOut,
  onFitView,
}) => {
  return (
    <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-lg p-1.5 flex flex-wrap items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-200 z-10 select-none">
      {/* 1. Notation Style Selector */}
      <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/70 p-1 rounded-xl">
        <span className="text-[10px] font-bold text-neutral-400 px-1.5 uppercase">Notation:</span>
        <button
          onClick={() => onNotationStyleChange('crows_foot')}
          className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
            notationStyle === 'crows_foot'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
          title="Crow's Foot Krähenfuß-Notation"
        >
          Crow's Foot
        </button>
        <button
          onClick={() => onNotationStyleChange('uml')}
          className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
            notationStyle === 'uml'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
          title="UML Multiplizitäts-Notation (1..*)"
        >
          UML
        </button>
        <button
          onClick={() => onNotationStyleChange('chen')}
          className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
            notationStyle === 'chen'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
          title="Chen Min/Max Notation (1,N)"
        >
          Chen
        </button>
      </div>

      <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700 mx-0.5" />

      {/* 2. Auto-Layout Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onAutoLayout('TB')}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1 font-medium text-xs"
          title="Hierarchisches Layout Oben -> Unten"
        >
          <ArrowDown size={14} className="text-blue-500" />
          <span>Top-Down</span>
        </button>
        <button
          onClick={() => onAutoLayout('LR')}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1 font-medium text-xs"
          title="Hierarchisches Layout Links -> Rechts"
        >
          <ArrowRight size={14} className="text-blue-500" />
          <span>Left-Right</span>
        </button>
        <button
          onClick={onPhysicsLayout}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1 font-medium text-xs"
          title="Physikalisches Force-Directed Federmodell"
        >
          <Zap size={14} className="text-amber-500" />
          <span>Physics</span>
        </button>
      </div>

      <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700 mx-0.5" />

      {/* 3. Schema Linter Health Badge */}
      <button
        onClick={onOpenLinter}
        className={`px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
          linterScore >= 80
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 hover:bg-emerald-100'
            : linterScore >= 50
            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 hover:bg-amber-100'
            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:border-red-800 hover:bg-red-100'
        }`}
        title="Schema-Gesundheitscheck öffnen"
      >
        <ShieldCheck size={14} />
        <span>Health {linterScore}%</span>
        {linterIssueCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-white/80 dark:bg-black/40 text-[10px]">
            {linterIssueCount}
          </span>
        )}
      </button>

      {/* 4. DBML Split Screen Toggle */}
      <button
        onClick={onToggleDbmlSplit}
        className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
          isDbmlOpen
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
        }`}
        title="DBML Live-Code Split-Editor umschalten"
      >
        <Code size={14} className="text-indigo-500" />
        <span>DBML</span>
      </button>

      {/* 5. SQL Reverse Engineer */}
      <button
        onClick={onOpenSqlReverseEngineer}
        className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1 text-xs"
        title="SQL DDL importieren (Reverse Engineering)"
      >
        <Database size={14} className="text-emerald-500" />
        <span>SQL Import</span>
      </button>

      {/* 6. Schema Diff & Migrations */}
      <button
        onClick={onOpenSchemaDiff}
        className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1 text-xs"
        title="Schema-Diff und Migrationsskripte (UP/DOWN)"
      >
        <GitCompare size={14} className="text-amber-500" />
        <span>Diff & UP/DOWN</span>
      </button>

      {/* 7. Mock Data Synthesis */}
      <button
        onClick={onOpenMockDataGenerator}
        className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1 text-xs"
        title="Graph-Aware relationale Mock-Daten synthetisieren"
      >
        <Sparkles size={14} className="text-purple-500" />
        <span>Mock-Daten</span>
      </button>

      {/* 8. Data Dictionary & Export */}
      <button
        onClick={onOpenDataDictionary}
        className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1 text-xs"
        title="Data-Dictionary Dokumentation, Prisma & TypeSpec exportieren"
      >
        <BookOpen size={14} className="text-blue-500" />
        <span>Dictionary</span>
      </button>

      {/* 9. Global Enums */}
      <button
        onClick={onOpenEnumManager}
        className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1 text-xs"
        title="Globale ENUMs & Custom Types verwalten"
      >
        <ListOrdered size={14} className="text-pink-500" />
        <span>ENUMs</span>
      </button>

      <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700 mx-0.5" />

      {/* 10. Canvas Controls (Grid Snap, Minimap, Zoom) */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleSnapToGrid}
          className={`p-1.5 rounded-lg transition-colors ${
            snapToGrid 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500'
          }`}
          title="Magnetisches Raster (Snap-to-Grid)"
        >
          <Magnet size={14} />
        </button>
        <button
          onClick={onToggleMinimap}
          className={`p-1.5 rounded-lg transition-colors ${
            showMinimap 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500'
          }`}
          title="Radar-Minimap umschalten"
        >
          <MapPin size={14} />
        </button>
        <button
          onClick={onZoomIn}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400"
          title="Vergrößern"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={onZoomOut}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400"
          title="Verkleinern"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={onFitView}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400"
          title="Alles zentrieren (Fit View)"
        >
          <Maximize size={14} />
        </button>
      </div>
    </div>
  );
};
