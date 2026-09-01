import React, { useMemo } from 'react';
import { 
  Network, ShieldCheck, ClipboardList, Sparkles, History, Shield, Cpu, Code,
  Filter, ArrowUpAZ, ArrowDownZA, RotateCcw, Zap, SlidersHorizontal, CheckSquare,
  RefreshCw, Plus, Save, Trash2, Sigma, CheckCheck, ChevronDown, TableProperties,
  PencilRuler, Eye
} from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useUIStore } from '../../../stores/useUIStore';
import { useProjectStore } from '../../../stores/useProjectStore';
import { ViewType, Table, Query, Form, Report, CustomPage } from '../../../types';

interface HomeTabProps {
  onAction: (action: string, payload?: any) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ onAction }) => {
  const ui = useUIStore();
  const store = useProjectStore();
  const [showDeleteMenu, setShowDeleteMenu] = React.useState(false);

  const { currentView, activeObject } = ui;

  // Ermittelt das aktuell geladene Objekt und das Ziel für die Entwurfsansicht
  const activeTargetInfo = useMemo(() => {
    // 1. Tabelle
    if (currentView.type === 'table_data' || currentView.type === 'table_edit' || currentView.type === 'table_create') {
      const tableId = (currentView as any).tableId;
      const table = (tableId ? store.tables.find(t => t.id === tableId) : null) || 
        (activeObject && 'fields' in activeObject ? (activeObject as Table) : null) ||
        store.tables[0];

      if (table) {
        return {
          typeLabel: 'Tabelle',
          name: table.name,
          designView: { type: 'table_edit', tableId: table.id } as ViewType,
          designTab: 'table_design',
          runtimeView: { type: 'table_data', tableId: table.id } as ViewType,
          runtimeLabel: 'Datenblatt',
          isAlreadyDesign: currentView.type === 'table_edit' || currentView.type === 'table_create',
          isRuntime: currentView.type === 'table_data'
        };
      }
    }

    // 2. Abfrage
    if (currentView.type === 'query_results' || currentView.type === 'query_designer') {
      const queryId = (currentView as any).queryId;
      const query = (queryId ? store.queries.find(q => q.id === queryId) : null) ||
        (activeObject && 'columns' in activeObject ? (activeObject as Query) : null) ||
        store.queries[0];

      if (query) {
        return {
          typeLabel: 'Abfrage',
          name: query.name,
          designView: { type: 'query_designer', queryId: query.id } as ViewType,
          designTab: 'query_design',
          runtimeView: { type: 'query_results', queryId: query.id } as ViewType,
          runtimeLabel: 'Ergebnisansicht',
          isAlreadyDesign: currentView.type === 'query_designer',
          isRuntime: currentView.type === 'query_results'
        };
      }
    }

    // 3. Formular
    if (currentView.type === 'form_view' || currentView.type === 'form_designer') {
      const formId = (currentView as any).formId;
      const form = (formId ? store.forms.find(f => f.id === formId) : null) ||
        (activeObject && 'layout' in activeObject && !('sections' in activeObject) ? (activeObject as Form) : null) ||
        store.forms[0];

      if (form) {
        return {
          typeLabel: 'Formular',
          name: form.name,
          designView: { type: 'form_designer', formId: form.id } as ViewType,
          designTab: 'form_design',
          runtimeView: { type: 'form_view', formId: form.id } as ViewType,
          runtimeLabel: 'Formularansicht',
          isAlreadyDesign: currentView.type === 'form_designer',
          isRuntime: currentView.type === 'form_view'
        };
      }
    }

    // 4. Bericht
    if (currentView.type === 'report_view' || currentView.type === 'report_designer') {
      const reportId = (currentView as any).reportId;
      const report = (reportId ? store.reports.find(r => r.id === reportId) : null) ||
        (activeObject && 'sections' in activeObject ? (activeObject as Report) : null) ||
        store.reports[0];

      if (report) {
        return {
          typeLabel: 'Bericht',
          name: report.name,
          designView: { type: 'report_designer', reportId: report.id } as ViewType,
          designTab: 'report_design',
          runtimeView: { type: 'report_view', reportId: report.id } as ViewType,
          runtimeLabel: 'Berichtsansicht',
          isAlreadyDesign: currentView.type === 'report_designer',
          isRuntime: currentView.type === 'report_view'
        };
      }
    }

    // 5. Seite (Custom Page)
    if (currentView.type === 'page_view' || currentView.type === 'page_designer') {
      const pageId = (currentView as any).pageId;
      const page = (pageId ? store.pages?.find(p => p.id === pageId) : null) ||
        (activeObject && 'layout' in activeObject && ('isSubpage' in activeObject || 'expectedParams' in activeObject) ? (activeObject as CustomPage) : null) ||
        store.pages?.[0];

      if (page) {
        return {
          typeLabel: 'Seite',
          name: page.name,
          designView: { type: 'page_designer', pageId: page.id } as ViewType,
          designTab: 'page_design',
          runtimeView: { type: 'page_view', pageId: page.id } as ViewType,
          runtimeLabel: 'Seitenansicht',
          isAlreadyDesign: currentView.type === 'page_designer',
          isRuntime: currentView.type === 'page_view'
        };
      }
    }

    // 6. Workflow
    if (currentView.type === 'workflow_designer') {
      const workflowId = (currentView as any).workflowId;
      const workflow = workflowId ? store.workflows?.find(w => w.id === workflowId) : store.workflows?.[0];
      if (workflow) {
        return {
          typeLabel: 'Workflow',
          name: workflow.name,
          designView: { type: 'workflow_designer', workflowId: workflow.id } as ViewType,
          designTab: 'workflow_design',
          runtimeView: null,
          runtimeLabel: '',
          isAlreadyDesign: true,
          isRuntime: false
        };
      }
    }

    // 7. Fallback: Wenn activeObject gesetzt ist
    if (activeObject) {
      if ('fields' in activeObject && 'name' in activeObject) {
        return {
          typeLabel: 'Tabelle',
          name: (activeObject as Table).name,
          designView: { type: 'table_edit', tableId: (activeObject as Table).id } as ViewType,
          designTab: 'table_design',
          runtimeView: { type: 'table_data', tableId: (activeObject as Table).id } as ViewType,
          runtimeLabel: 'Datenblatt',
          isAlreadyDesign: false,
          isRuntime: false
        };
      }
      if ('columns' in activeObject && 'name' in activeObject) {
        return {
          typeLabel: 'Abfrage',
          name: (activeObject as Query).name,
          designView: { type: 'query_designer', queryId: (activeObject as Query).id } as ViewType,
          designTab: 'query_design',
          runtimeView: { type: 'query_results', queryId: (activeObject as Query).id } as ViewType,
          runtimeLabel: 'Ergebnisansicht',
          isAlreadyDesign: false,
          isRuntime: false
        };
      }
    }

    return null;
  }, [currentView, activeObject, store.tables, store.queries, store.forms, store.reports, store.pages, store.workflows]);

  const handleSwitchToDesign = () => {
    if (!activeTargetInfo) return;
    ui.setCurrentView(activeTargetInfo.designView);
    ui.setActiveTab(activeTargetInfo.designTab);
    ui.addToast(`In die Entwurfsansicht gewechselt (${activeTargetInfo.typeLabel}: "${activeTargetInfo.name}")`, 'info');
  };

  const handleSwitchToRuntime = () => {
    if (!activeTargetInfo || !activeTargetInfo.runtimeView) return;
    ui.setCurrentView(activeTargetInfo.runtimeView);
  };

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
          onClick={() => onAction('form_filter_advanced')} 
          size="large" 
        />
        
        {/* Column 1: Sorting */}
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[130px] border-r border-slate-200/50 dark:border-slate-700/60 pr-2">
          <button 
            onClick={() => onAction('form_sort_asc')}
            className="flex items-center gap-2 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
          >
            <ArrowUpAZ size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">Aufsteigend</span>
          </button>
          <button 
            onClick={() => onAction('form_sort_desc')}
            className="flex items-center gap-2 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
          >
            <ArrowDownZA size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">Absteigend</span>
          </button>
          <button 
            onClick={() => onAction('form_clear_sort')}
            className="flex items-center gap-2 px-1.5 py-0.5 rounded text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-left font-medium cursor-pointer"
          >
            <RotateCcw size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">Sortierung entfernen</span>
          </button>
        </div>

        {/* Column 2: Advanced Filtering */}
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[110px]">
          <button 
            onClick={() => onAction('form_filter_selection')}
            title="Filtert nach dem aktuell markierten Zellwert (Access 'Filter nach Auswahl')"
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
          >
            <Zap size={13} className="text-amber-500 shrink-0" />
            <span className="truncate">Auswahl</span>
          </button>
          <button 
            onClick={() => onAction('form_filter_advanced')}
            title="Öffnet das erweiterte Filter-Modalfenster mit Mehrfach-Kriterien"
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
          >
            <SlidersHorizontal size={13} className="text-blue-500 shrink-0" />
            <span className="truncate">Erweitert</span>
          </button>
          <button 
            onClick={() => onAction('form_toggle_filter')}
            title="Blendet die Schnell-Suchzeile direkt über den Tabellenspalten ein/aus"
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
          >
            <CheckSquare size={13} className="text-emerald-600 shrink-0" />
            <span className="truncate">Filter Zeile</span>
          </button>
        </div>
      </RibbonGroup>

      {/* Datensätze */}
      <RibbonGroup label="Datensätze">
        <RibbonButton 
          icon={
            <div className="relative">
              <RefreshCw className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
            </div>
          } 
          label="Alle aktualisieren" 
          onClick={() => onAction('form_refresh')} 
          size="large" 
        />

        {/* Column 1: Record Operations */}
        <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[110px] border-r border-slate-200/50 dark:border-slate-700/60 pr-2">
          <button 
            onClick={() => onAction('form_new_record')}
            className="flex items-center gap-2 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
          >
            <Plus size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Neu</span>
          </button>
          <button 
            onClick={() => onAction('form_save_record')}
            className="flex items-center gap-2 px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
          >
            <Save size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">Speichern</span>
          </button>
          <div className="relative" onMouseLeave={() => setShowDeleteMenu(false)}>
            <button 
              onClick={() => setShowDeleteMenu(p => !p)}
              className="flex items-center gap-1 w-full px-1.5 py-0.5 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-left font-medium cursor-pointer"
            >
              <Trash2 size={13} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="truncate">Löschen</span>
              <ChevronDown size={10} className="text-slate-400 shrink-0 ml-auto" />
            </button>
            {showDeleteMenu && (
              <div className="absolute top-full left-0 bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-lg z-50 text-xs w-56 py-1 animate-in fade-in-25">
                <button 
                  onClick={() => { onAction('form_delete_record'); setShowDeleteMenu(false); }} 
                  className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <Trash2 size={13} className="text-rose-600 dark:text-rose-400"/> Datensatz löschen
                </button>
                <button 
                  onClick={() => { onAction('form_delete_cascade'); setShowDeleteMenu(false); }} 
                  className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-left font-semibold text-amber-900 dark:text-amber-300 border-t border-slate-100 dark:border-slate-800 cursor-pointer"
                >
                  <ShieldCheck size={13} className="text-amber-600 dark:text-amber-400"/> Erweitertes Löschen (Cascade & Ref. Integrität)
                </button>
              </div>
            )}
          </div>
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

      <RibbonGroup label="Zusammenarbeit" isLast={!activeTargetInfo}>
        <RibbonButton icon={<ClipboardList className="text-sky-600" />} label="Kanban-Board" onClick={() => onAction('tickets_board')} size="large" />
        <RibbonButton icon={<History className="text-amber-600" />} label="Git-Schema" onClick={() => onAction('version_control')} size="large" />
        <RibbonButton icon={<Sparkles className="text-purple-600" />} label="AI Copilot" onClick={() => onAction('open_ai_copilot', 'schema')} size="large" />
      </RibbonGroup>

      {/* Ganz rechts außen: Entwurf-Button für aktuell geladene Tabelle, Abfrage, Formular, Bericht, etc. */}
      {activeTargetInfo && (
        <RibbonGroup label="Entwurf" isLast>
          <RibbonButton
            icon={<PencilRuler className="text-amber-600 dark:text-amber-400" />}
            label="Entwurf"
            size="large"
            active={activeTargetInfo.isAlreadyDesign}
            onClick={handleSwitchToDesign}
            title={`In die Entwurfsansicht für ${activeTargetInfo.typeLabel} "${activeTargetInfo.name}" wechseln`}
          />

          <div className="flex flex-col gap-1 justify-center h-full py-1 min-w-[130px]">
            <button
              onClick={handleSwitchToDesign}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors text-left font-medium cursor-pointer ${
                activeTargetInfo.isAlreadyDesign
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 font-semibold ring-1 ring-amber-300 dark:ring-amber-700'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={`Entwurfsansicht für ${activeTargetInfo.typeLabel} "${activeTargetInfo.name}" öffnen`}
            >
              <PencilRuler size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">Entwurfsansicht</span>
            </button>

            {activeTargetInfo.runtimeView && (
              <button
                onClick={handleSwitchToRuntime}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors text-left font-medium cursor-pointer ${
                  activeTargetInfo.isRuntime
                    ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 font-semibold ring-1 ring-blue-300 dark:ring-blue-700'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={`${activeTargetInfo.runtimeLabel} für ${activeTargetInfo.typeLabel} "${activeTargetInfo.name}" öffnen`}
              >
                <Eye size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">{activeTargetInfo.runtimeLabel}</span>
              </button>
            )}

            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate px-1 pt-0.5 border-t border-slate-200/60 dark:border-slate-700/60 font-mono">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{activeTargetInfo.typeLabel}:</span> {activeTargetInfo.name}
            </div>
          </div>
        </RibbonGroup>
      )}
    </div>
  );
};

