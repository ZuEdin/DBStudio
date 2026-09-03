import React, { useState, useEffect, useMemo } from 'react';
import { AccessDatabaseCard } from './AccessDatabaseCard';
import { 
  Users, 
  Package, 
  CheckSquare, 
  FileText, 
  LifeBuoy, 
  Briefcase,
  HardDrive,
  ArrowRight,
  Receipt,
  Coffee,
  Database,
  ShoppingCart,
  Kanban,
  Activity,
  Calendar,
  GitMerge,
  Globe,
  Truck,
  Building2,
  Layers,
  Sparkles
} from 'lucide-react';
import { externalTemplateService } from '../../../services/externalTemplateService';
import { useConfigStore } from '../../../stores/useConfigStore';
import { useUIStore } from '../../../stores/useUIStore';
import { TemplateFilterToolbar } from './TemplateFilterToolbar';
import { 
  getTemplateProviderTabs, 
  filterProjectTemplates, 
  isCommunityTemplate, 
  isEnterpriseTemplate 
} from '../../../utils/templateFilterUtils';

interface NeuTabProps {
  onOpenNewModal: () => void;
  onApplyTemplate: (templateId: string, templateName: string) => void;
}

export const NeuTab: React.FC<NeuTabProps> = ({
  onOpenNewModal,
  onApplyTemplate,
}) => {
  const { config } = useConfigStore();
  const [updateTick, setUpdateTick] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeProviderTab, setActiveProviderTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const ui = useUIStore();

  useEffect(() => {
    const onUpdate = () => setUpdateTick(t => t + 1);
    window.addEventListener('dbstudio:external-templates-updated', onUpdate);
    return () => window.removeEventListener('dbstudio:external-templates-updated', onUpdate);
  }, []);

  const fullTemplates = useMemo(
    () => externalTemplateService.getAllAvailableProjectTemplates('de'),
    [updateTick]
  );

  const providerTabs = useMemo(
    () => getTemplateProviderTabs(fullTemplates, config.externalTemplateProviders || []),
    [fullTemplates, config.externalTemplateProviders]
  );

  const filteredTemplates = useMemo(
    () => filterProjectTemplates(fullTemplates, activeProviderTab, searchQuery),
    [fullTemplates, activeProviderTab, searchQuery]
  );

  const handleSyncProviders = async () => {
    setIsSyncing(true);
    try {
      const providers = config.externalTemplateProviders || [];
      const res = await externalTemplateService.syncFromProviders(providers);
      ui.addToast(`${res.templates.length} Vorlagen erfolgreich synchronisiert (${res.errors.length} Fehler).`, res.errors.length ? 'info' : 'success');
      setUpdateTick(t => t + 1);
    } catch (err: any) {
      ui.addToast(`Fehler beim Synchronisieren: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Custom UI styling metadata for templates
  const templateMeta: Record<string, { badge?: string; color: string; icon: any }> = {
    ecommerce_orders: {
      badge: 'ENTERPRISE ORM',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30',
      icon: ShoppingCart
    },
    pm_taskboard: {
      badge: 'INTERAKTIV & STATUS',
      color: 'border-indigo-500/40 text-indigo-400 bg-indigo-950/30',
      icon: Kanban
    },
    hr_directory: {
      badge: 'HIERARCHIEN & RBAC',
      color: 'border-amber-500/40 text-amber-400 bg-amber-950/30',
      icon: Users
    },
    iot_telemetry: {
      badge: 'TIME-SERIES & IOT',
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/30',
      icon: Activity
    },
    course_booking: {
      badge: 'PLANUNG & KOLLISIONEN',
      color: 'border-rose-500/40 text-rose-400 bg-rose-950/30',
      icon: Calendar
    },
    fakturierung_suite: {
      badge: 'NEU & EMPFOHLEN',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30',
      icon: Receipt
    },
    crm_suite: {
      badge: 'BELIEBT',
      color: 'border-blue-500/40 text-blue-400 bg-blue-950/30',
      icon: Users
    },
    inventory_app: {
      badge: 'TOP',
      color: 'border-amber-500/40 text-amber-400 bg-amber-950/30',
      icon: Package
    },
    cms_template: {
      color: 'border-purple-500/40 text-purple-400 bg-purple-950/30',
      icon: FileText
    },
    coffee_fund: {
      color: 'border-rose-500/40 text-rose-400 bg-rose-950/30',
      icon: Coffee
    },
    dbstudio_selfhost: {
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/30',
      icon: Database
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#2b2b2b] text-neutral-100 overflow-y-auto px-10 py-6 select-none">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-light tracking-tight text-white mb-1">
          Neu
        </h1>
        <p className="text-xs text-neutral-400">
          Erstellen Sie eine neue leere Datenbank oder wählen Sie eine betriebliche Vorlage
        </p>
      </div>

      {/* Featured / Blank Database Creation */}
      <div className="mb-8">
        <div className="flex items-center gap-6 p-6 rounded-xl bg-[#333333] border border-[#444444] shadow-sm">
          <AccessDatabaseCard
            title="Leere Datenbank"
            subtitle="Standard (IndexedDB)"
            onClick={onOpenNewModal}
          />
          <div className="max-w-md">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-2">
              <HardDrive size={11} />
              <span>DB Studio Engine</span>
            </div>
            <h2 className="text-base font-semibold text-white mb-1">
              Benutzerdefinierte leere Datenbank
            </h2>
            <p className="text-xs text-neutral-300 leading-relaxed mb-3">
              Erstellen Sie ein neues Schema von Grund auf mit vollem Tabellen-Designer, Abfragen, Formularen, Berichten und SQL-Unterstützung.
              Als primäre Speicher-Engine ist standardmäßig <strong>IndexedDB (Browser-Datenbank)</strong> aktiv.
            </p>
            <button
              onClick={onOpenNewModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              Jetzt erstellen
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Project Consolidation & Merge Feature Banner */}
      <div className="mb-8 p-5 rounded-xl bg-slate-800/90 border border-indigo-500/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow">
            <GitMerge size={24} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Multi-Projekt Zusammenführung</span>
            </div>
            <h2 className="text-sm font-bold text-white">
              Mehrere Projekte oder Vorlagen mit Leichtigkeit vereinen
            </h2>
            <p className="text-xs text-neutral-300 leading-relaxed max-w-xl">
              Führen Sie relationale Domänen (z.B. E-Commerce, HR, IoT, Projektmanagement) in eine konsolidierte Enterprise-Suite zusammen – mit automatischer Konflikt-Präfixierung und intelligenten Cross-Domänen-Brücken.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            ui.setIsBackstageOpen(false);
            ui.setShowProjectMergeModal(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-2 cursor-pointer flex-shrink-0"
        >
          <GitMerge size={15} />
          <span>Assistent öffnen</span>
        </button>
      </div>

      {/* Template Catalog */}
      <div>
        <div className="flex items-center justify-between border-b border-[#3d3d3d] pb-2 mb-4">
          <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Geschäftsvorlagen & Suite-Schemas
          </h2>
          <span className="text-xs text-neutral-400">
            {filteredTemplates.length} von {fullTemplates.length} Vorlagen
          </span>
        </div>

        {/* Provider Switcher Toolbar with Buttons */}
        <TemplateFilterToolbar
          tabs={providerTabs}
          activeTab={activeProviderTab}
          onSelectTab={setActiveProviderTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isSyncing={isSyncing}
          onSync={handleSyncProviders}
          onManageProviders={() => ui.setBackstageActiveTab('optionen')}
          variant="dark"
        />

        {/* Templates Grid or Empty State */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12 px-6 rounded-2xl bg-[#333333] border border-[#444444] max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#3e3e3e] flex items-center justify-center text-neutral-400 mx-auto">
              <Layers size={24} />
            </div>
            <h3 className="text-sm font-semibold text-white">Keine Vorlagen gefunden</h3>
            <p className="text-xs text-neutral-400">
              {searchQuery
                ? `Keine Vorlagen stimmen mit dem Suchbegriff "${searchQuery}" überein.`
                : 'Für diesen Anbieter sind aktuell noch keine Schemen geladen.'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1.5 rounded bg-[#3e3e3e] hover:bg-[#484848] text-neutral-200 text-xs font-medium cursor-pointer"
                >
                  Suche leeren
                </button>
              )}
              <button
                onClick={() => setActiveProviderTab('all')}
                className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
              >
                Alle Vorlagen anzeigen
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((tpl) => {
              const isComm = isCommunityTemplate(tpl);
              const isEnt = isEnterpriseTemplate(tpl);

              const meta = templateMeta[tpl.id] || {
                color: isComm
                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30'
                  : isEnt
                  ? 'border-indigo-500/40 text-indigo-400 bg-indigo-950/30'
                  : tpl.isExternal 
                  ? 'border-blue-500/40 text-blue-400 bg-blue-950/30' 
                  : 'border-slate-500/40 text-slate-300 bg-slate-900/40',
                icon: isComm ? Users : isEnt ? Building2 : tpl.isExternal ? Globe : FileText
              };
              const Icon = tpl.icon === 'Activity' ? Activity : tpl.icon === 'Truck' ? Truck : meta.icon;
              
              const displayBadge = tpl.isExternal 
                ? (tpl.providerName ? tpl.providerName : 'EXTERNER ANBIETER') 
                : (isComm ? 'COMMUNITY STANDARDS' : isEnt ? 'ENTERPRISE STANDARDS' : meta.badge);

              const badgeColor = isComm
                ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/30'
                : isEnt
                ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-500/30'
                : tpl.isExternal
                ? 'bg-blue-900/80 text-blue-200 border border-blue-500/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700';

              const tableCount = tpl.data?.tables?.length || 0;

              return (
                <div
                  key={tpl.id}
                  id={`template-card-${tpl.id}`}
                  onClick={() => onApplyTemplate(tpl.id, tpl.name)}
                  className="group relative flex flex-col justify-between p-4 rounded-xl bg-[#333333] hover:bg-[#3d3d3d] border border-[#444444] hover:border-indigo-500/60 transition-all cursor-pointer shadow-xs hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className={`p-2 rounded-lg border ${meta.color}`}>
                        <Icon size={20} />
                      </div>
                      {displayBadge && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider text-right truncate max-w-[180px] ${badgeColor}`}>
                          {displayBadge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors mb-1">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                      {tpl.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#444444] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-400">{tpl.category || 'Business'}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#282828] text-neutral-400 border border-[#3e3e3e]">
                        {tableCount} {tableCount === 1 ? 'Tabelle' : 'Tabellen'}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Vorlage nutzen <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

