import React from 'react';
import { 
  Network, ShieldCheck, ClipboardList, Sparkles, History, Shield, Cpu, Code,
  Filter, ArrowUpAZ, ArrowDownZA, RotateCcw, Zap, SlidersHorizontal, CheckSquare,
  RefreshCw, Plus, Save, Trash2, Sigma, CheckCheck, ChevronDown, TableProperties
} from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';

interface HomeTabProps {
  onAction: (action: string, payload?: any) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ onAction }) => {
  return (
    <div className="flex gap-4 h-full items-stretch">
      <RibbonGroup label="Design">
        <RibbonButton icon={<Network className="text-blue-600" />} label="Beziehungen" onClick={() => onAction('relationships')} size="large" />
      </RibbonGroup>

      {/* Sortieren und Filtern */}
      <RibbonGroup label="Sortieren und Filtern">
        <RibbonButton 
          icon={<Filter className="text-slate-700" />} 
          label="Filtern" 
          onClick={() => onAction('form_toggle_filter')} 
          size="large" 
        />
        
        {/* Column 1: Sorting */}
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[130px] border-r border-slate-200/50 pr-2">
          <button 
            onClick={() => onAction('form_sort_asc')}
            className="flex items-center gap-2 px-1.5 py-0.5 rounded text-xs text-slate-700 hover:bg-sky-100 hover:text-sky-900 transition-colors text-left font-medium"
          >
            <ArrowUpAZ size={13} className="text-blue-600 shrink-0" />
            <span className="truncate">Aufsteigend</span>
          </button>
          <button 
            onClick={() => onAction('form_sort_desc')}
            className="flex items-center gap-2 px-1.5 py-0.5 rounded text-xs text-slate-700 hover:bg-sky-100 hover:text-sky-900 transition-colors text-left font-medium"
          >
            <ArrowDownZA size={13} className="text-blue-600 shrink-0" />
            <span className="truncate">Absteigend</span>
          </button>
          <button 
            onClick={() => onAction('form_clear_sort')}
            className="flex items-center gap-2 px-1.5 py-0.5 rounded text-xs text-slate-700 hover:bg-sky-100 hover:text-sky-900 transition-colors text-left font-medium"
          >
            <RotateCcw size={13} className="text-slate-400 shrink-0" />
            <span className="truncate text-slate-500">Sortierung entfernen</span>
          </button>
        </div>

        {/* Column 2: Advanced Filtering */}
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[110px]">
          <button 
            onClick={() => onAction('form_filter_selection')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 hover:bg-sky-100 hover:text-sky-900 transition-colors text-left font-medium"
          >
            <Zap size={13} className="text-amber-500 shrink-0" />
            <span className="truncate">Auswahl</span>
            <ChevronDown size={10} className="text-slate-400 shrink-0 ml-auto" />
          </button>
          <button 
            onClick={() => onAction('form_filter_advanced')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 hover:bg-sky-100 hover:text-sky-900 transition-colors text-left font-medium"
          >
            <SlidersHorizontal size={13} className="text-blue-500 shrink-0" />
            <span className="truncate">Erweitert</span>
            <ChevronDown size={10} className="text-slate-400 shrink-0 ml-auto" />
          </button>
          <button 
            onClick={() => onAction('form_toggle_filter')}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 hover:bg-sky-100 hover:text-sky-900 transition-colors text-left font-medium"
          >
            <CheckSquare size={13} className="text-emerald-600 shrink-0" />
            <span className="truncate">Filter ein/aus</span>
          </button>
        </div>
      </RibbonGroup>

      {/* Datensätze */}
      <RibbonGroup label="Datensätze">
        <RibbonButton 
          icon={
            <div className="relative">
              <RefreshCw className="text-emerald-600 w-5 h-5" />
            </div>
          } 
          label="Alle aktualisieren" 
          onClick={() => onAction('form_refresh')} 
          size="large" 
        />

        {/* Column 1: Record Operations */}
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[110px] border-r border-slate-200/50 pr-2">
          <button 
            onClick={() => onAction('form_new_record')}
            className="flex items-center gap-2 px-1.5 py-0.5 rounded text-xs text-slate-700 hover:bg-sky-100 hover:text-sky-900 transition-colors text-left font-medium"
          >
            <Plus size={13} className="text-emerald-600 shrink-0" />
            <span className="truncate">Neu</span>
          </button>
          <button 
            onClick={() => onAction('form_save_record')}
            className="flex items-center gap-2 px-1.5 py-0.5 rounded text-xs text-slate-700 hover:bg-sky-100 hover:text-sky-900 transition-colors text-left font-medium"
          >
            <Save size={13} className="text-indigo-600 shrink-0" />
            <span className="truncate">Speichern</span>
          </button>
          <button 
            onClick={() => onAction('form_delete_record')}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-slate-700 hover:bg-sky-100 hover:text-sky-900 transition-colors text-left font-medium"
          >
            <Trash2 size={13} className="text-rose-600 shrink-0" />
            <span className="truncate">Löschen</span>
            <ChevronDown size={10} className="text-slate-400 shrink-0 ml-auto" />
          </button>
        </div>

        {/* Column 2: Other Operations */}
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[120px]">
          <button 
            disabled
            className="flex items-center gap-2 px-1.5 py-0.5 rounded text-xs text-slate-400 cursor-not-allowed text-left opacity-50"
          >
            <Sigma size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">Summen</span>
          </button>
          <button 
            disabled
            className="flex items-center gap-2 px-1.5 py-0.5 rounded text-xs text-slate-400 cursor-not-allowed text-left opacity-50"
          >
            <CheckCheck size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">Rechtschreibung</span>
          </button>
          <button 
            disabled
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-slate-400 cursor-not-allowed text-left opacity-50"
          >
            <TableProperties size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">Weitere Optionen</span>
            <ChevronDown size={10} className="text-slate-400 shrink-0 ml-auto" />
          </button>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Sicherheit & Audit">
        <RibbonButton icon={<Shield className="text-emerald-600" />} label="Audit Trail" onClick={() => onAction('audit_trail')} size="large" />
        <RibbonButton icon={<ShieldCheck className="text-blue-600" />} label="RBAC / Rechte" onClick={() => onAction('security_manager')} size="large" />
      </RibbonGroup>

      <RibbonGroup label="Automatisierung">
        <RibbonButton icon={<Cpu className="text-purple-600" />} label="Makros & Logik" onClick={() => onAction('logic_designer')} size="large" />
        <RibbonButton icon={<Code className="text-amber-600" />} label="Backend & API" onClick={() => onAction('dbstudio_backend')} size="large" />
      </RibbonGroup>

      <RibbonGroup label="Zusammenarbeit" isLast>
        <RibbonButton icon={<ClipboardList className="text-sky-600" />} label="Kanban-Board" onClick={() => onAction('tickets_board')} size="large" />
        <RibbonButton icon={<History className="text-amber-600" />} label="Git-Schema" onClick={() => onAction('version_control')} size="large" />
        <RibbonButton icon={<Sparkles className="text-purple-600 animate-pulse" />} label="AI-Schwarm (Inaktiv)" onClick={() => {}} size="large" disabled={true} />
      </RibbonGroup>
    </div>
  );
};
