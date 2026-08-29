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
} from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';

interface FormDesignTabProps {
  onAction: (action: string, payload?: any) => void;
}

export const FormDesignTab: React.FC<FormDesignTabProps> = ({ onAction }) => {
  const { t } = useTranslation();

  return (
    <div className="flex gap-4 h-full overflow-x-auto">
      {/* 1. Layout & Standard-Steuerelemente */}
      <RibbonGroup label="Layout & Container">
        <RibbonButton
          icon={<Type />}
          label={t('ribbon.actions.label')}
          onClick={() => onAction('form_add_label')}
        />
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

      {/* 2. Schaltflächen & Interaktion */}
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

      {/* 3. Bauspezifische Fach-Widgets */}
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
          label="4-Augen-Freigabe"
          onClick={() => onAction('form_add_four_eyes')}
        />
        <RibbonButton
          icon={<Coins className="text-emerald-600" />}
          label="Währungsrechner"
          onClick={() => onAction('form_add_currency')}
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
          icon={<Mail className="text-teal-600" />}
          label="DIN 5008 Brief"
          onClick={() => onAction('form_add_din5008')}
        />
        <RibbonButton
          icon={<MapPin className="text-red-500" />}
          label="GPS-Standort"
          onClick={() => onAction('form_add_geolocation')}
        />
        <RibbonButton
          icon={<Barcode className="text-slate-700" />}
          label="Barcode/QR"
          onClick={() => onAction('form_add_barcode')}
        />
      </RibbonGroup>

      {/* 4. Anordnung & Ausrichtung */}
      <RibbonGroup label="Anordnung">
        <RibbonButton
          icon={<AlignLeft className="text-slate-700" />}
          label="Links bündig"
          onClick={() => onAction('form_align_left')}
        />
        <RibbonButton
          icon={<AlignRight className="text-slate-700" />}
          label="Rechts bündig"
          onClick={() => onAction('form_align_right')}
        />
        <RibbonButton
          icon={<Maximize2 className="text-slate-700" />}
          label="Gleiche Breite"
          onClick={() => onAction('form_match_width')}
        />
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

      {/* 5. Druck & Export */}
      <RibbonGroup label="Druck & Export" isLast>
        <RibbonButton
          icon={<Printer className="text-blue-600" />}
          label="Drucken / PDF"
          onClick={() => onAction('form_open_print')}
        />
        <RibbonButton
          icon={<Code className="text-emerald-600" />}
          label="Code Export"
          onClick={() => onAction('form_export_code')}
        />
      </RibbonGroup>
    </div>
  );
};
