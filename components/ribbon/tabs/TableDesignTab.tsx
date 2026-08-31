import React, { useState } from 'react';
import {
  Table as TableIcon,
  Eye,
  Code,
  Plus,
  Key,
  CheckCircle2,
  Lock,
  Calculator,
  Binary,
  Trash2,
  Briefcase,
  ShieldCheck,
  FileSpreadsheet,
  Dices,
  Sliders,
  Network,
  Type,
  Hash,
  Calendar,
  DollarSign,
  ToggleLeft,
  ListOrdered,
  Layers,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useUIStore } from '../../../stores/useUIStore';
import { useProjectStore } from '../../../stores/useProjectStore';
import { Table, Field } from '../../../types';

interface TableDesignTabProps {
  onAction: (action: string, payload?: any) => void;
}

export const TableDesignTab: React.FC<TableDesignTabProps> = ({ onAction }) => {
  const ui = useUIStore();
  const store = useProjectStore();
  const [showQuickAddFieldMenu, setShowQuickAddFieldMenu] = useState(false);
  const [showMockMenu, setShowMockMenu] = useState(false);

  const { currentView, activeObject } = ui;
  const isTableView = currentView.type === 'table_data';
  const isTableDesigner = currentView.type === 'table_edit' || currentView.type === 'table_create';

  const table = (activeObject && 'fields' in activeObject ? activeObject as Table : null) ||
    (currentView.type === 'table_edit' || currentView.type === 'table_data' 
      ? store.tables.find(t => t.id === currentView.tableId) || null 
      : null);

  const handleAddFieldWithType = (fieldType: string, length?: number) => {
    onAction('table_add_field_typed', { fieldType, length });
    setShowQuickAddFieldMenu(false);
  };

  return (
    <div className="flex gap-2 h-full items-stretch">
      {/* 1. Ansichten */}
      <RibbonGroup label="Ansichten">
        <RibbonButton
          icon={<TableIcon className="text-blue-600" />}
          label="Datenblatt"
          active={isTableView}
          onClick={() => {
            if (table) {
              ui.setCurrentView({ type: 'table_data', tableId: table.id });
            } else if (store.tables.length > 0) {
              ui.setCurrentView({ type: 'table_data', tableId: store.tables[0].id });
            }
          }}
          size="large"
          title="Zur interaktiven Tabellen-Datenansicht wechseln"
        />
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[120px]">
          <button
            onClick={() => {
              if (table) {
                ui.setCurrentView({ type: 'table_edit', tableId: table.id });
              } else if (store.tables.length > 0) {
                ui.setCurrentView({ type: 'table_edit', tableId: store.tables[0].id });
              }
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors text-left font-medium cursor-pointer ${
              isTableDesigner 
                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 font-semibold' 
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Tabellen-Entwurfsansicht zur Schema-Bearbeitung"
          >
            <Eye size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">Entwurfsansicht</span>
          </button>
          <button
            onClick={() => onAction('table_open_ddl')}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="SQL DDL Skript (CREATE TABLE / ALTER TABLE) anzeigen"
          >
            <Code size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">SQL DDL Vorschau</span>
          </button>
        </div>
      </RibbonGroup>

      {/* 2. Felder hinzufügen (Schnell-Auswahl) */}
      <RibbonGroup label="Feld hinzufügen">
        <RibbonButton
          icon={<Plus className="text-emerald-600 dark:text-emerald-400" />}
          label="Neues Feld"
          onClick={() => onAction('table_add_field')}
          size="large"
          title="Fügt der aktuellen Tabelle ein Standard-Feld hinzu"
        />

        {/* Spalte 1: Standard-Datentypen */}
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[120px] border-r border-slate-200/50 dark:border-slate-700/60 pr-2">
          <button
            onClick={() => handleAddFieldWithType('VARCHAR', 255)}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Textfeld (Kurzer Text / VARCHAR)"
          >
            <Type size={13} className="text-blue-500 shrink-0" />
            <span className="truncate">Kurzer Text</span>
          </button>
          <button
            onClick={() => handleAddFieldWithType('INTEGER')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Ganzzahl / Zahl (INTEGER)"
          >
            <Hash size={13} className="text-amber-500 shrink-0" />
            <span className="truncate">Ganzzahl</span>
          </button>
          <button
            onClick={() => handleAddFieldWithType('DECIMAL')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Währungsfeld / Dezimal (DECIMAL 10,2)"
          >
            <DollarSign size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Währung (€)</span>
          </button>
        </div>

        {/* Spalte 2: Erweiterte Typen */}
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[120px]">
          <button
            onClick={() => handleAddFieldWithType('DATETIME')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Datum & Uhrzeit (DATETIME / TIMESTAMP)"
          >
            <Calendar size={13} className="text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="truncate">Datum / Zeit</span>
          </button>
          <button
            onClick={() => handleAddFieldWithType('BOOLEAN')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Ja / Nein Schalter (BOOLEAN)"
          >
            <ToggleLeft size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="truncate">Ja / Nein (Bool)</span>
          </button>
          <button
            onClick={() => handleAddFieldWithType('ENUM')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Auswahlliste / Lookup Dropdown (ENUM)"
          >
            <ListOrdered size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">Auswahlliste</span>
          </button>
        </div>
      </RibbonGroup>

      {/* 3. Feldeigenschaften & Schlüssel */}
      <RibbonGroup label="Eigenschaften & Schlüssel">
        <RibbonButton
          icon={<Key className="text-amber-500 fill-amber-400" />}
          label="Primärschlüssel"
          onClick={() => onAction('table_toggle_pk')}
          size="large"
          title="Ausgewähltes Feld als Primärschlüssel (Primary Key) festlegen oder aufheben"
        />

        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[130px] border-r border-slate-200/50 dark:border-slate-700/60 pr-2">
          <button
            onClick={() => onAction('table_toggle_nullable')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Pflichtfeld (NOT NULL) aktivieren oder deaktivieren"
          >
            <CheckCircle2 size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">Pflichtfeld (NOT NULL)</span>
          </button>
          <button
            onClick={() => onAction('table_toggle_unique')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Eindeutiger Index (UNIQUE Constraint)"
          >
            <Lock size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">Eindeutig (UNIQUE)</span>
          </button>
          <button
            onClick={() => onAction('table_delete_selected_field')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-800 dark:hover:text-rose-300 transition-colors text-left font-medium cursor-pointer"
            title="Ausgewähltes Feld aus der Tabelle entfernen"
          >
            <Trash2 size={13} className="text-rose-500 shrink-0" />
            <span className="truncate">Feld löschen</span>
          </button>
        </div>

        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[130px]">
          <button
            onClick={() => onAction('table_open_computed_modal')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Berechnete Spalte mit Formel / SQL-Ausdruck"
          >
            <Calculator size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">Berechnetes Feld</span>
          </button>
          <button
            onClick={() => onAction('table_open_sequence_modal')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="AutoWert / Sequenz (Startwert & Schrittweite)"
          >
            <Binary size={13} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="truncate">AutoWert-Sequenz</span>
          </button>
          <button
            onClick={() => onAction('table_open_validation_modal')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Validierungsregeln & Gültigkeitsprüfung"
          >
            <Sliders size={13} className="text-violet-600 dark:text-violet-400 shrink-0" />
            <span className="truncate">Validierungsregeln</span>
          </button>
        </div>
      </RibbonGroup>

      {/* 4. Branchen & Vorlagen */}
      <RibbonGroup label="Vorlagen & Branchen">
        <RibbonButton
          icon={<Briefcase className="text-blue-600 dark:text-blue-400" />}
          label="Branchen-Vorlagen"
          onClick={() => onAction('table_open_templates_modal')}
          size="large"
          title="Fertige Tabellen-Vorlagen für Handwerk, Bau, GAEB, VOB, CRM & ERP einfügen"
        />
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[130px]">
          <button
            onClick={() => onAction('table_apply_audit_fields')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Fügt ErstelltAm, ErstelltVon, GeändertAm, GeändertVon automatisch hinzu"
          >
            <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Audit-Felder (+4)</span>
          </button>
          <button
            onClick={() => onAction('table_open_gaeb_import')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="GAEB / DATANORM / Baukatalog Schema-Import"
          >
            <FileSpreadsheet size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="truncate">GAEB / DATANORM</span>
          </button>
          <button
            onClick={() => onAction('relationships')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Öffnet das relationale ER-Beziehungsdiagramm"
          >
            <Network size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">Beziehungen prüfen</span>
          </button>
        </div>
      </RibbonGroup>

      {/* 5. Testdaten & Mock-Generator */}
      <RibbonGroup label="Testdaten" isLast>
        <RibbonButton
          icon={<Dices className="text-purple-600 dark:text-purple-400" />}
          label="Testdaten (+10)"
          onClick={() => onAction('table_generate_mock', { count: 10 })}
          size="large"
          title="Generiert 10 realistische Testdatensätze für die aktuelle Tabelle"
        />
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[110px]">
          <button
            onClick={() => onAction('table_generate_mock', { count: 50 })}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="50 Testdatensätze generieren"
          >
            <Sparkles size={13} className="text-purple-500 shrink-0" />
            <span className="truncate">+ 50 Datensätze</span>
          </button>
          <button
            onClick={() => onAction('table_generate_mock', { count: 100 })}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="100 Testdatensätze generieren"
          >
            <Layers size={13} className="text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="truncate">+ 100 Datensätze</span>
          </button>
          <button
            onClick={() => onAction('table_open_mock_generator')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Erweiterten Mock-Daten-Generator öffnen"
          >
            <Dices size={13} className="text-amber-500 shrink-0" />
            <span className="truncate">Konfigurieren...</span>
          </button>
        </div>
      </RibbonGroup>
    </div>
  );
};
