import React, { useState } from 'react';
import { PageComponentType } from '../../../types/index';
import { 
  Square, Columns, Rows, CreditCard, LayoutTemplate, Layers, 
  Type, MousePointerClick, List, Table2, Layout, Image as ImageIcon, Plus,
  Rocket, Grid as GridIcon, MessageSquare, DollarSign, PanelBottom, Navigation,
  TrendingUp, AlertCircle, Tag, Sliders, Play, Search, FolderPlus, HelpCircle,
  FolderTree, Calculator, Sun, MapPin, FileSignature, QrCode, HardHat
} from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';

interface ComponentToolboxProps {
  onOpenTemplates?: () => void;
}

export const ComponentToolbox: React.FC<ComponentToolboxProps> = ({ onOpenTemplates }) => {
  const { queries, tables, customComponents = [] } = useProjectStore();
  const ui = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');

  const handleDragStart = (e: React.DragEvent, type: PageComponentType, defaultProps?: Record<string, any>) => {
      e.dataTransfer.setData('componentType', type);
      e.dataTransfer.setData('text/plain', type);
      if (defaultProps) {
        e.dataTransfer.setData('defaultProps', JSON.stringify(defaultProps));
      }
      e.dataTransfer.effectAllowed = 'copy';
  };

  const matchesSearch = (text: string) => {
    if (!searchTerm.trim()) return true;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  return (
    <div className="w-72 min-w-[288px] max-w-[288px] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-3.5 shadow-sm z-0 overflow-y-auto shrink-0 select-none text-slate-800 dark:text-slate-100">
      
      {/* Templates / Presets Quick Banner */}
      {onOpenTemplates && (
        <button
          type="button"
          onClick={onOpenTemplates}
          className="w-full mb-3 p-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between text-left hover:border-indigo-400 hover:shadow-xs transition group"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FolderPlus size={15} />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-950 dark:text-indigo-300 group-hover:text-indigo-600 transition">Vorlagen & Presets</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Master-Detail, Dashboard, etc.</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">Neu</span>
        </button>
      )}

      {/* Search Input */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Komponenten suchen..."
          className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:outline-none transition"
        />
      </div>

      {/* Bau- & ERP-Fachkomponenten Category */}
      {(matchesSearch('LV') || matchesSearch('GAEB') || matchesSearch('Kalkulation') || matchesSearch('EKT') || matchesSearch('Wetter') || matchesSearch('Mangel') || matchesSearch('Unterschrift') || matchesSearch('GiroCode') || matchesSearch('QR')) && (
        <div className="mb-4">
          <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5 bg-amber-50/80 dark:bg-amber-950/60 px-2 py-1 rounded">
            <HardHat size={12} className="text-amber-600 dark:text-amber-400"/> Bau- &amp; Kalkulations-Widgets
          </div>
          <div className="space-y-1.5">
            {matchesSearch('LV') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'lv_tree_explorer', { title: 'Leistungsverzeichnis Explorer' })} 
                className="p-2 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50/60 dark:hover:bg-amber-950/40 text-xs text-amber-950 dark:text-amber-100 font-semibold active:cursor-grabbing bg-amber-50/30 dark:bg-amber-950/20 shadow-2xs transition"
              >
                <div className="p-1 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200"><FolderTree size={14} /></div>
                <div>
                  <div>LV-Tree (GAEB / OZ)</div>
                  <div className="text-[9px] font-normal text-slate-500 dark:text-slate-400">Hierarchisches Leistungsverzeichnis</div>
                </div>
              </div>
            )}

            {matchesSearch('EKT') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'ekt_matrix', { title: 'EKT-Kalkulationsmatrix' })} 
                className="p-2 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50/60 dark:hover:bg-amber-950/40 text-xs text-amber-950 dark:text-amber-100 font-semibold active:cursor-grabbing bg-amber-50/30 dark:bg-amber-950/20 shadow-2xs transition"
              >
                <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"><Calculator size={14} /></div>
                <div>
                  <div>EKT-Kalkulationsmatrix</div>
                  <div className="text-[9px] font-normal text-slate-500 dark:text-slate-400">Lohn-, Material- &amp; Gerätekosten</div>
                </div>
              </div>
            )}

            {matchesSearch('Wetter') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'weather_widget', { title: 'Bautagesbericht & Wetter' })} 
                className="p-2 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50/60 dark:hover:bg-amber-950/40 text-xs text-amber-950 dark:text-amber-100 font-semibold active:cursor-grabbing bg-amber-50/30 dark:bg-amber-950/20 shadow-2xs transition"
              >
                <div className="p-1 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200"><Sun size={14} /></div>
                <div>
                  <div>Bautagebuch &amp; Wetter</div>
                  <div className="text-[9px] font-normal text-slate-500 dark:text-slate-400">Witterung &amp; Kolonnenstunden</div>
                </div>
              </div>
            )}

            {matchesSearch('Mangel') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'plan_defect_marker', { title: 'Plan- & Mängel-Marker' })} 
                className="p-2 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50/60 dark:hover:bg-amber-950/40 text-xs text-amber-950 dark:text-amber-100 font-semibold active:cursor-grabbing bg-amber-50/30 dark:bg-amber-950/20 shadow-2xs transition"
              >
                <div className="p-1 rounded bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200"><MapPin size={14} /></div>
                <div>
                  <div>Plan- &amp; Mängel-Marker</div>
                  <div className="text-[9px] font-normal text-slate-500 dark:text-slate-400">Visueller Pin-Drop auf Bauplänen</div>
                </div>
              </div>
            )}

            {matchesSearch('Unterschrift') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'signature_pad', { title: 'Digitale Bauherren-Unterschrift' })} 
                className="p-2 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50/60 dark:hover:bg-amber-950/40 text-xs text-amber-950 dark:text-amber-100 font-semibold active:cursor-grabbing bg-amber-50/30 dark:bg-amber-950/20 shadow-2xs transition"
              >
                <div className="p-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200"><FileSignature size={14} /></div>
                <div>
                  <div>Digitale Signatur / Pad</div>
                  <div className="text-[9px] font-normal text-slate-500 dark:text-slate-400">Abnahme &amp; Freigaben vor Ort</div>
                </div>
              </div>
            )}

            {matchesSearch('GiroCode') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'girocode_qr', { title: 'GiroCode EPC-QR-Code' })} 
                className="p-2 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50/60 dark:hover:bg-amber-950/40 text-xs text-amber-950 dark:text-amber-100 font-semibold active:cursor-grabbing bg-amber-50/30 dark:bg-amber-950/20 shadow-2xs transition"
              >
                <div className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200"><QrCode size={14} /></div>
                <div>
                  <div>GiroCode / EPC-QR</div>
                  <div className="text-[9px] font-normal text-slate-500 dark:text-slate-400">E-Rechnung Überweisungsträger</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subforms & Subpages Category */}
      {(matchesSearch('Subform') || matchesSearch('Master-Detail') || matchesSearch('Unterseite') || matchesSearch('Tabs') || matchesSearch('Repeater') || matchesSearch('Akkordeon')) && (
        <div className="mb-4">
          <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5 bg-indigo-50/70 dark:bg-indigo-950/60 px-2 py-1 rounded">
            <Layers size={12} className="text-indigo-600 dark:text-indigo-400"/> Subformulare & Subpages
          </div>
          <div className="space-y-1.5">
            {matchesSearch('Subformular') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'subform')} 
                className="p-2 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center gap-2 cursor-grab hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 text-xs text-indigo-900 dark:text-indigo-200 font-semibold active:cursor-grabbing bg-indigo-50/20 dark:bg-indigo-950/20 shadow-2xs transition"
              >
                <div className="p-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"><Layers size={14} /></div>
                <div>
                  <div>Subformular (Master-Detail)</div>
                  <div className="text-[9px] font-normal text-slate-500 dark:text-slate-400">Fremdschlüssel-gebundene Tabelle</div>
                </div>
              </div>
            )}

            {matchesSearch('Tabs') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'tabs_container')} 
                className="p-2 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center gap-2 cursor-grab hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 text-xs text-indigo-900 dark:text-indigo-200 font-semibold active:cursor-grabbing bg-indigo-50/20 dark:bg-indigo-950/20 shadow-2xs transition"
              >
                <div className="p-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"><LayoutTemplate size={14} /></div>
                <div>
                  <div>Tabs Layout (Registerkarten)</div>
                  <div className="text-[9px] font-normal text-slate-500 dark:text-slate-400">Multi-Tab Unterseiten Container</div>
                </div>
              </div>
            )}

            {matchesSearch('Unterseite') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'subpage_container')} 
                className="p-2 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 cursor-grab hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 text-xs text-emerald-900 dark:text-emerald-200 font-semibold active:cursor-grabbing bg-emerald-50/20 dark:bg-emerald-950/20 shadow-2xs transition"
              >
                <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"><Layers size={14} /></div>
                <div>
                  <div>Unterseite (Sub-Page)</div>
                  <div className="text-[9px] font-normal text-slate-500 dark:text-slate-400">Eingebettete Custom Page</div>
                </div>
              </div>
            )}

            {matchesSearch('List Repeater') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'list_repeater')} 
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium active:cursor-grabbing transition"
              >
                <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"><List size={14} /></div>
                <div>List-Repeater (Loop)</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI & Modern Widgets Category */}
      {(matchesSearch('KPI') || matchesSearch('Stat') || matchesSearch('Alert') || matchesSearch('Suchleiste') || matchesSearch('Aktionsleiste') || matchesSearch('Badge')) && (
        <div className="mb-4">
          <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5 bg-amber-50/70 dark:bg-amber-950/60 px-2 py-1 rounded">
            <TrendingUp size={12} className="text-amber-600 dark:text-amber-400"/> KPI & Widgets
          </div>
          <div className="space-y-1.5">
            {matchesSearch('KPI') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'kpi_widget')} 
                className="p-2 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50/60 dark:hover:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 font-semibold active:cursor-grabbing bg-amber-50/20 dark:bg-amber-950/20 shadow-2xs transition"
              >
                <div className="p-1 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"><TrendingUp size={14} /></div>
                <div>
                  <div>KPI Stat-Card</div>
                  <div className="text-[9px] font-normal text-slate-500 dark:text-slate-400">Große Zahl, Trend & Icon</div>
                </div>
              </div>
            )}

            {matchesSearch('Suchleiste') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'search_filter_bar')} 
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium active:cursor-grabbing transition"
              >
                <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"><Search size={14} /></div>
                <div>Such- & Filterleiste</div>
              </div>
            )}

            {matchesSearch('Aktionsleiste') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'action_group')} 
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium active:cursor-grabbing transition"
              >
                <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"><Play size={14} /></div>
                <div>Aktionsleiste / Buttons</div>
              </div>
            )}

            {matchesSearch('Alert') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'alert_box')} 
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium active:cursor-grabbing transition"
              >
                <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400"><AlertCircle size={14} /></div>
                <div>Hinweis- / Alert-Box</div>
              </div>
            )}

            {matchesSearch('Badge') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'badge_pill')} 
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium active:cursor-grabbing transition"
              >
                <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400"><Tag size={14} /></div>
                <div>Status-Badge / Pill</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Layout & Structure Category */}
      {(matchesSearch('Container') || matchesSearch('Row') || matchesSearch('Column') || matchesSearch('Card') || matchesSearch('Grid')) && (
        <div className="mb-4">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
            <Square size={12}/> Layout & Struktur
          </div>
          <div className="space-y-1.5">
            {matchesSearch('Grid') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'grid_layout')} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium active:cursor-grabbing transition">
                <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400"><GridIcon size={14}/></div>
                <div>Responsive Grid (2/3/4 Spalten)</div>
              </div>
            )}
            {matchesSearch('Card') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'card')} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium active:cursor-grabbing transition">
                <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400"><CreditCard size={14}/></div>
                <div>Card (Inhalts-Karte)</div>
              </div>
            )}
            {matchesSearch('Row') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'row')} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium active:cursor-grabbing transition">
                <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400"><Columns size={14}/></div>
                <div>Row Layout (Zeile)</div>
              </div>
            )}
            {matchesSearch('Column') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'column')} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium active:cursor-grabbing transition">
                <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400"><Rows size={14}/></div>
                <div>Column Layout (Spalte)</div>
              </div>
            )}
            {matchesSearch('Container') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'container')} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium active:cursor-grabbing transition">
                <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400"><Square size={14}/></div>
                <div>Container (Box)</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standard Elements Category */}
      {(matchesSearch('Tabelle') || matchesSearch('Formular') || matchesSearch('Text') || matchesSearch('Button') || matchesSearch('Dropdown') || matchesSearch('Bild')) && (
        <div className="mb-4">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
            <Type size={12}/> Standard Elemente
          </div>
          <div className="space-y-1.5">
            {matchesSearch('Tabelle') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'table_view')} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium active:cursor-grabbing transition">
                <div className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"><Table2 size={14}/></div>
                <div>Daten-Tabelle (Data Grid)</div>
              </div>
            )}
            {matchesSearch('Formular') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'form_view')} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium active:cursor-grabbing transition">
                <div className="p-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"><Layout size={14}/></div>
                <div>Formular (Embedded)</div>
              </div>
            )}
            {matchesSearch('Text') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'text')} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium active:cursor-grabbing transition">
                <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"><Type size={14}/></div>
                <div>Text Block</div>
              </div>
            )}
            {matchesSearch('Button') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'button')} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium active:cursor-grabbing transition">
                <div className="p-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"><MousePointerClick size={14}/></div>
                <div>Button / Schaltfläche</div>
              </div>
            )}
            {matchesSearch('Dropdown') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'dropdown')} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium active:cursor-grabbing transition">
                <div className="p-1 rounded bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400"><List size={14}/></div>
                <div>Dropdown Menu</div>
              </div>
            )}
            {matchesSearch('Bild') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'image')} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium active:cursor-grabbing transition">
                <div className="p-1 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400"><ImageIcon size={14}/></div>
                <div>Bild / Medien</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Landingpage Blocks */}
      {(matchesSearch('Navbar') || matchesSearch('Navigation') || matchesSearch('Hero') || matchesSearch('Feature') || matchesSearch('Pricing') || matchesSearch('Testimonial') || matchesSearch('Footer')) && (
        <div className="mb-4">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
            <Rocket size={12}/> Landingpage Blöcke
          </div>
          <div className="space-y-1.5">
            {matchesSearch('Navbar') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'navbar')} className="p-2 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-200 font-semibold active:cursor-grabbing bg-amber-50/40 dark:bg-amber-950/20">
                  <Navigation size={14} className="text-amber-500"/> Navigation (Navbar)
              </div>
            )}
            {matchesSearch('Hero') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'hero_section')} className="p-2 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-200 font-semibold active:cursor-grabbing bg-amber-50/40 dark:bg-amber-950/20">
                  <Rocket size={14} className="text-amber-600"/> Hero Section
              </div>
            )}
            {matchesSearch('Feature') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'feature_grid')} className="p-2 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-200 font-semibold active:cursor-grabbing bg-amber-50/40 dark:bg-amber-950/20">
                  <GridIcon size={14} className="text-amber-600"/> Feature Grid
              </div>
            )}
            {matchesSearch('Pricing') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'pricing_table')} className="p-2 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-200 font-semibold active:cursor-grabbing bg-amber-50/40 dark:bg-amber-950/20">
                  <DollarSign size={14} className="text-amber-600"/> Pricing Table
              </div>
            )}
            {matchesSearch('Testimonial') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'testimonial')} className="p-2 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-200 font-semibold active:cursor-grabbing bg-amber-50/40 dark:bg-amber-950/20">
                  <MessageSquare size={14} className="text-amber-600"/> Testimonials
              </div>
            )}
            {matchesSearch('Footer') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'footer')} className="p-2 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-200 font-semibold active:cursor-grabbing bg-amber-50/40 dark:bg-amber-950/20">
                  <PanelBottom size={14} className="text-amber-600"/> Footer
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Components Registry */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Layout size={12} className="text-emerald-600 dark:text-emerald-400" /> Custom (SDUI)
            </h3>
            <button 
                type="button"
                onClick={() => ui.setCurrentView({ type: 'custom_component_designer' })}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold flex items-center gap-0.5"
                title="Neue Custom Component erstellen"
            >
                <Plus size={10} /> Neu
            </button>
        </div>
        
        {customComponents.length > 0 ? (
            <div className="space-y-1.5">
                {customComponents.map(comp => (
                    <div 
                        key={comp.id}
                        draggable 
                        onDragStart={(e) => {
                            e.dataTransfer.setData('componentType', 'custom_component');
                            e.dataTransfer.setData('customComponentId', comp.id);
                            e.dataTransfer.setData('text/plain', 'custom_component');
                            e.dataTransfer.effectAllowed = 'copy';
                        }}
                        className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between cursor-grab hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs text-slate-700 dark:text-slate-200 font-semibold active:cursor-grabbing border-emerald-100 dark:border-emerald-800 bg-emerald-50/10 dark:bg-emerald-950/20 transition"
                        title={`${comp.name}: ${comp.description || ''}`}
                    >
                        <span className="truncate max-w-[120px]">{comp.name}</span>
                        <span className="text-[8px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1 rounded uppercase scale-90">{comp.type.replace('_view', '')}</span>
                    </div>
                ))}
            </div>
        ) : (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                    Keine Custom Components vorhanden.
                </p>
            </div>
        )}
      </div>

      {/* Queries (Abfragen) */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <Search size={12} className="text-purple-600 dark:text-purple-400" /> Abfragen ({queries.length})
          </h3>
          <span className="text-[9px] text-slate-400 dark:text-slate-500">Drag &amp; Drop</span>
        </div>
        <p className="text-[9px] text-slate-400 dark:text-slate-500 mb-2">Abfrage als Tabelle oder Ausgabefelder auf die Seite ziehen:</p>

        {queries.length > 0 ? (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {queries
              .filter(q => matchesSearch(q.name) || (('columns' in q && Array.isArray(q.columns)) ? (q.columns as any[]).some(c => matchesSearch(c.alias || c.fieldName || '')) : false))
              .map(q => {
                const queryCols = ('columns' in q && Array.isArray(q.columns)) ? (q.columns as any[]).filter(c => c.show !== false) : [];
                const colNames = queryCols.map(c => c.alias || c.fieldName).filter(Boolean);
                const colString = colNames.join(',');

                return (
                  <div key={q.id} className="border border-purple-200 dark:border-purple-800/60 rounded-lg p-2 bg-purple-50/40 dark:bg-purple-950/20 hover:border-purple-400 dark:hover:border-purple-700 transition">
                    <div 
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData('componentType', 'table_view');
                        e.dataTransfer.setData('dataSourceType', 'query');
                        e.dataTransfer.setData('dataSourceId', q.id);
                        e.dataTransfer.setData('columns', colString);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      className="font-bold text-xs text-purple-800 dark:text-purple-300 cursor-grab hover:underline flex items-center justify-between gap-1.5 group active:cursor-grabbing"
                      title={`Abfrage "${q.name}" als Datentabelle ziehen`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Search size={12} className="text-purple-600 dark:text-purple-400 shrink-0" />
                        <span className="truncate">{q.name}</span>
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 shrink-0">
                        Query Table
                      </span>
                    </div>

                    {/* Columns Chips */}
                    {colNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {colNames.map((colName: string, cIdx: number) => (
                          <div
                            key={colName + '_' + cIdx}
                            draggable
                            onDragStart={e => {
                              e.dataTransfer.setData('componentType', 'text');
                              e.dataTransfer.setData('templateText', `{{context.${colName}}}`);
                              e.dataTransfer.effectAllowed = 'copy';
                            }}
                            className="text-[9px] bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700/60 px-1.5 py-0.5 rounded text-purple-900 dark:text-purple-200 cursor-grab hover:bg-purple-100 dark:hover:bg-purple-900 hover:border-purple-400 font-mono active:cursor-grabbing shadow-2xs"
                            title={`Feld "{{context.${colName}}}" ziehen`}
                          >
                            {colName}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 italic mt-1">
                        Keine Spalten definiert
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
              Keine Abfragen vorhanden.
            </p>
          </div>
        )}
      </div>

      {/* Database Tables & Fields */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Table2 size={12} className="text-indigo-600 dark:text-indigo-400" /> Tabellen &amp; Datenfelder ({tables.length})
        </h3>
        <p className="text-[9px] text-slate-400 dark:text-slate-500 mb-2">Tabelle oder Felder auf die Seite ziehen:</p>
        
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {tables
            .filter(t => matchesSearch(t.name) || (t.fields || []).some((f: any) => matchesSearch(f.name || '')))
            .map(t => (
            <div key={t.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 bg-slate-50/50 dark:bg-slate-800/40">
              <div 
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('componentType', 'table_view');
                  e.dataTransfer.setData('dataSourceType', 'table');
                  e.dataTransfer.setData('dataSourceId', t.id);
                  e.dataTransfer.setData('columns', t.fields.map(f => f.name).join(','));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className="font-bold text-xs text-indigo-700 dark:text-indigo-400 cursor-grab hover:underline flex items-center gap-1.5 active:cursor-grabbing"
              >
                <Table2 size={12} /> {t.name}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {t.fields.map(f => (
                  <div
                    key={f.id || f.name}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('componentType', 'text');
                      e.dataTransfer.setData('templateText', `{{context.${f.name}}}`);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="text-[9px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300 cursor-grab hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-700 font-mono active:cursor-grabbing"
                  >
                    {f.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
