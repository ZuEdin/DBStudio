import React from 'react';
import {
  Type,
  Box,
  Columns,
  Download,
  Zap,
  ChevronDown,
  Layout,
  Layers,
  BookOpen,
  Calculator,
  PenTool,
  MapPin,
  Barcode,
  Coins,
  ShieldCheck,
  Printer,
  Copy,
  Trash2,
  AlignLeft,
  AlignRight,
  Maximize2,
  Code,
  Image,
  Mail,
  ChevronsUpDown,
  Eye,
  LayoutTemplate,
  FormInput,
  CheckSquare,
  Calendar,
  ListOrdered,
  Subtitles,
  SplitSquareVertical
} from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../../stores/useUIStore';
import { useProjectStore } from '../../../stores/useProjectStore';

interface FormDesignTabProps {
  onAction: (action: string, payload?: any) => void;
}

export const FormDesignTab: React.FC<FormDesignTabProps> = ({ onAction }) => {
  const { t } = useTranslation();
  const ui = useUIStore();
  const store = useProjectStore();

  const { currentView, activeObject } = ui;
  const isFormView = currentView.type === 'form_view';
  const isFormDesigner = currentView.type === 'form_designer';
  const formId = (activeObject && 'layout' in activeObject ? activeObject.id : null) ||
    (currentView.type === 'form_designer' || currentView.type === 'form_view' ? currentView.formId : store.forms[0]?.id);

  return (
    <div className="flex gap-2 h-full items-stretch">
      {/* 1. Ansichten */}
      <RibbonGroup label="Ansichten">
        <RibbonButton
          icon={<LayoutTemplate className="text-indigo-600" />}
          label="Entwurfsansicht"
          active={isFormDesigner}
          onClick={() => {
            if (formId) ui.setCurrentView({ type: 'form_designer', formId });
          }}
          size="large"
          title="Visueller Formular-Designer"
        />
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[120px]">
          <button
            onClick={() => {
              if (formId) ui.setCurrentView({ type: 'form_view', formId });
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors text-left font-medium cursor-pointer ${
              isFormView
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-semibold'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Formular-Ansicht (Live Dateneingabe)"
          >
            <Eye size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Formularansicht</span>
          </button>
          <button
            onClick={() => onAction('form_export_code')}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Quellcode (React / HTML / C# Razor) generieren"
          >
            <Code size={13} className="text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="truncate">Code generieren</span>
          </button>
        </div>
      </RibbonGroup>

      {/* 2. Steuerelemente (Toolbox) */}
      <RibbonGroup label="Steuerelemente">
        <RibbonButton
          icon={<FormInput className="text-blue-600 dark:text-blue-400" />}
          label="Textfeld"
          onClick={() => onAction('form_add_text_input')}
          size="large"
          title="Fügt ein Eingabefeld für Text oder Zahlen hinzu"
        />
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[115px] border-r border-slate-200/50 dark:border-slate-700/60 pr-2">
          <button
            onClick={() => onAction('form_add_dropdown_input')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Kombinationsfeld / Lookup Dropdown"
          >
            <ListOrdered size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">Dropdown / Lookup</span>
          </button>
          <button
            onClick={() => onAction('form_add_checkbox_input')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Kontrollkästchen / Checkbox"
          >
            <CheckSquare size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="truncate">Kontrollkästchen</span>
          </button>
          <button
            onClick={() => onAction('form_add_date_input')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Datumsauswahl / Kalenderfeld"
          >
            <Calendar size={13} className="text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="truncate">Datumsauswahl</span>
          </button>
        </div>
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[115px]">
          <button
            onClick={() => onAction('form_add_subform')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Unterformular für 1:n Master-Detail Beziehungen (z.B. Rechnungspositionen)"
          >
            <SplitSquareVertical size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">Unterformular</span>
          </button>
          <button
            onClick={() => onAction('form_add_label')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            title="Bezeichnungsfeld / Statischer Text"
          >
            <Type size={13} className="text-slate-600 dark:text-slate-400 shrink-0" />
            <span className="truncate">Bezeichnungsfeld</span>
          </button>
        </div>
      </RibbonGroup>

      {/* 3. Layout & Container */}
      <RibbonGroup label="Layout & Container">
        <RibbonButton
          icon={<Box className="text-blue-600" />}
          label={t('ribbon.actions.container')}
          onClick={() => onAction('form_add_container')}
        />
        <RibbonButton
          icon={<Columns className="text-indigo-600" />}
          label="2 Spalten"
          onClick={() => onAction('form_add_2col')}
        />
        <RibbonButton
          icon={<Layout className="text-emerald-600" />}
          label="Tabs (Register)"
          onClick={() => onAction('form_add_tabs')}
        />
        <RibbonButton
          icon={<ChevronsUpDown className="text-violet-600" />}
          label="Akkordeon"
          onClick={() => onAction('form_add_accordion')}
        />
      </RibbonGroup>

      {/* 4. Schaltflächen & Aktionen */}
      <RibbonGroup label="Aktionen & Makros">
        <RibbonButton
          icon={<Zap className="text-amber-500 fill-amber-400" />}
          label="Makro-Button"
          onClick={() => onAction('form_add_button')}
        />
        <RibbonButton
          icon={
            <div className="flex items-center gap-0.5">
              <Zap size={14} className="text-indigo-500 fill-indigo-400" />
              <ChevronDown size={12} className="text-indigo-600" />
            </div>
          }
          label="Dropdown-Menü"
          onClick={() => onAction('form_add_dropdown_button')}
        />
      </RibbonGroup>

      {/* 5. Bau- & Fach-Widgets */}
      <RibbonGroup label="Bau- & Fach-Widgets">
        <RibbonButton
          icon={<BookOpen className="text-blue-600" />}
          label="GAEB-Picker"
          onClick={() => onAction('form_add_gaeb_picker')}
        />
        <RibbonButton
          icon={<Calculator className="text-amber-600" />}
          label="Aufmaß-Grid"
          onClick={() => onAction('form_add_measurement_grid')}
        />
        <RibbonButton
          icon={<ShieldCheck className="text-indigo-600" />}
          label="4-Augen"
          onClick={() => onAction('form_add_four_eyes')}
        />
        <RibbonButton
          icon={<PenTool className="text-purple-600" />}
          label="Unterschrift"
          onClick={() => onAction('form_add_signature')}
        />
        <RibbonButton
          icon={<Image className="text-rose-600" />}
          label="Plan-Marker"
          onClick={() => onAction('form_add_photo_marker')}
        />
        <RibbonButton
          icon={<Barcode className="text-slate-700" />}
          label="GiroCode QR"
          onClick={() => onAction('form_add_barcode')}
        />
      </RibbonGroup>

      {/* 6. Anordnung */}
      <RibbonGroup label="Anordnung">
        <RibbonButton
          icon={<Copy className="text-blue-600" />}
          label="Duplizieren"
          onClick={() => onAction('form_duplicate')}
        />
        <RibbonButton
          icon={<Trash2 className="text-rose-600" />}
          label="Löschen"
          onClick={() => onAction('form_delete')}
        />
      </RibbonGroup>

      {/* 7. Druck & Export */}
      <RibbonGroup label="Druck" isLast>
        <RibbonButton
          icon={<Printer className="text-blue-600" />}
          label="Drucken / PDF"
          onClick={() => onAction('form_open_print')}
        />
      </RibbonGroup>
    </div>
  );
};
