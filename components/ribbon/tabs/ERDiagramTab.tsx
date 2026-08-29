import React from 'react';
import {
  Save,
  Plus,
  LayoutGrid,
  FileDown,
  Network,
  ShieldCheck,
  Zap,
  Table as TableIcon,
  RefreshCw,
  Eye,
  Layers,
  Code
} from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';

interface ERDiagramTabProps {
  onAction: (action: string, payload?: any) => void;
}

export const ERDiagramTab: React.FC<ERDiagramTabProps> = ({ onAction }) => {
  const { t } = useTranslation();
  const store = useProjectStore();
  const ui = useUIStore();

  return (
    <div className="flex gap-4 h-full items-stretch overflow-x-auto pb-1 max-w-full">
      {/* 1. Layout & Speichern */}
      <RibbonGroup label="Layout & Modell">
        <RibbonButton
          icon={<Save className="text-blue-600" />}
          label="Layout Speichern"
          onClick={() => onAction('save_relationships')}
          size="large"
          title="Speichert die visuellen Positionen aller Tabellen im Beziehungsdiagramm"
        />
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[120px]">
          <button
            onClick={() => onAction('auto_layout')}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 hover:bg-sky-100 hover:text-sky-900 transition-colors text-left font-medium"
            title="Automatische, saubere Gitter-Ausrichtung aller Tabellen"
          >
            <LayoutGrid size={13} className="text-indigo-600 shrink-0" />
            <span className="truncate">Auto-Layout</span>
          </button>
          <button
            onClick={() => onAction('create_table')}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 hover:bg-sky-100 hover:text-sky-900 transition-colors text-left font-medium"
            title="Neue Tabelle im Datenmodell anlegen"
          >
            <Plus size={13} className="text-emerald-600 shrink-0" />
            <span className="truncate">Tabelle einfügen</span>
          </button>
        </div>
      </RibbonGroup>

      {/* 2. Beziehungen & Integrität */}
      <RibbonGroup label="Beziehungen & Integrität">
        <RibbonButton
          icon={<Network className="text-indigo-600" />}
          label="Alle Tabellen"
          onClick={() => onAction('show_all_tables_in_erd')}
          size="large"
          title="Fügt alle existierenden Tabellen des Projekts in das Beziehungsfenster ein"
        />
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[130px]">
          <button
            onClick={() => onAction('validate_foreign_keys')}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 hover:bg-sky-100 hover:text-sky-900 transition-colors text-left font-medium"
            title="Prüft referenzielle Integrität und verwaiste Fremdschlüssel"
          >
            <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
            <span className="truncate">Integritätsprüfung</span>
          </button>
          <button
            onClick={() => onAction('export_fk_ddl')}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 hover:bg-sky-100 hover:text-sky-900 transition-colors text-left font-medium"
            title="SQL ALTER TABLE ADD CONSTRAINT FOREIGN KEY Skript kopieren"
          >
            <Code size={13} className="text-purple-600 shrink-0" />
            <span className="truncate">FK SQL DDL Skript</span>
          </button>
        </div>
      </RibbonGroup>

      {/* 3. Export */}
      <RibbonGroup label="Export" isLast>
        <RibbonButton
          icon={<FileDown className="text-emerald-600" />}
          label="Als Bild exportieren"
          onClick={() => onAction('export_er_image')}
          size="large"
          title="Exportiert das ER-Diagramm als Bild / Druckansicht"
        />
      </RibbonGroup>
    </div>
  );
};
