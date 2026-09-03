import React, { useState, useMemo } from 'react';
import { 
  Database, Briefcase, Package, Layout, Monitor, 
  PlayCircle, Activity, Truck, Globe, Users, Building2, Layers, Search 
} from 'lucide-react';
import { ProjectTemplate } from '../../../../types';
import { useConfigStore } from '../../../../stores/useConfigStore';
import { useUIStore } from '../../../../stores/useUIStore';
import { externalTemplateService } from '../../../../services/externalTemplateService';
import { TemplateFilterToolbar } from '../../../backstage/components/TemplateFilterToolbar';
import { 
  getTemplateProviderTabs, 
  filterProjectTemplates, 
  isCommunityTemplate, 
  isEnterpriseTemplate 
} from '../../../../utils/templateFilterUtils';

interface NewProjectTemplatesListProps {
  templates: ProjectTemplate[];
  onSelectTemplate: (templateId: string) => void;
  t: (key: string) => string;
}

export const NewProjectTemplatesList: React.FC<NewProjectTemplatesListProps> = ({
  templates,
  onSelectTemplate,
  t
}) => {
  const { config } = useConfigStore();
  const ui = useUIStore();
  const [activeProviderTab, setActiveProviderTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);

  const providerTabs = useMemo(
    () => getTemplateProviderTabs(templates, config.externalTemplateProviders || []),
    [templates, config.externalTemplateProviders]
  );

  const filteredTemplates = useMemo(
    () => filterProjectTemplates(templates, activeProviderTab, searchQuery),
    [templates, activeProviderTab, searchQuery]
  );

  const handleSyncProviders = async () => {
    setIsSyncing(true);
    try {
      const providers = config.externalTemplateProviders || [];
      const res = await externalTemplateService.syncFromProviders(providers);
      ui.addToast(
        `${res.templates.length} Vorlagen erfolgreich synchronisiert (${res.errors.length} Fehler).`,
        res.errors.length ? 'info' : 'success'
      );
    } catch (err: any) {
      ui.addToast(`Fehler beim Synchronisieren: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      id="templates-list-view"
      className="space-y-4 animate-in fade-in slide-in-from-right-2 bg-white p-6 rounded-2xl shadow-xl border border-slate-200/80"
    >
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            {t('start.templates') || 'Vorlagen & Schemas'}
          </h2>
          <p className="text-xs text-slate-500">
            {t('start.start_schema') || 'Wählen Sie ein vorgefertigtes Schema zur schnellen Initialisierung.'}
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          {filteredTemplates.length} / {templates.length} Vorlagen
        </span>
      </div>

      {/* Provider Switcher Buttons Toolbar */}
      <TemplateFilterToolbar
        tabs={providerTabs}
        activeTab={activeProviderTab}
        onSelectTab={setActiveProviderTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSyncing={isSyncing}
        onSync={handleSyncProviders}
        variant="light"
      />

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 px-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 mx-auto">
            <Layers size={20} />
          </div>
          <h4 className="text-sm font-bold text-slate-700">Keine Vorlagen gefunden</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `Keine Vorlagen für den Suchbegriff "${searchQuery}" gefunden.`
              : 'Für diesen ausgewählten Anbieter liegen derzeit keine Vorlagen vor.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium cursor-pointer"
              >
                Suche zurücksetzen
              </button>
            )}
            <button
              onClick={() => setActiveProviderTab('all')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
            >
              Alle Vorlagen anzeigen
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTemplates.map((tmpl) => {
            const isComm = isCommunityTemplate(tmpl);
            const isEnt = isEnterpriseTemplate(tmpl);

            const Icon = tmpl.icon === 'Briefcase' 
              ? Briefcase 
              : tmpl.icon === 'Package' 
              ? Package 
              : tmpl.icon === 'Kanban' 
              ? Layout 
              : tmpl.icon === 'Monitor' 
              ? Monitor 
              : tmpl.icon === 'Activity' 
              ? Activity 
              : tmpl.icon === 'Truck' 
              ? Truck 
              : isComm 
              ? Users 
              : isEnt 
              ? Building2 
              : tmpl.isExternal 
              ? Globe 
              : Database;

            const badgeText = tmpl.isExternal 
              ? (tmpl.providerName || 'EXTERN') 
              : (isComm ? 'COMMUNITY' : isEnt ? 'ENTERPRISE' : tmpl.category || 'VORLAGE');

            const badgeStyle = isComm
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : isEnt
              ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
              : tmpl.isExternal
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : 'bg-slate-100 text-slate-700 border-slate-200';

            const iconStyle = isComm
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : isEnt
              ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
              : tmpl.isExternal
              ? 'bg-blue-50 text-blue-600 border border-blue-200'
              : 'bg-slate-50 text-slate-600 border border-slate-200';

            const tableCount = tmpl.data?.tables?.length || 0;

            return (
              <div 
                key={tmpl.id}
                id={`btn-select-template-${tmpl.id}`}
                onClick={() => onSelectTemplate(tmpl.id)}
                className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className={`p-2.5 rounded-lg shrink-0 ${iconStyle}`}>
                      <Icon size={20} />
                    </div>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 max-w-[140px] truncate ${badgeStyle}`}>
                      {badgeText}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm truncate">
                    {tmpl.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-600 border border-slate-200">
                      {tableCount} {tableCount === 1 ? 'Tabelle' : 'Tabellen'}
                    </span>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-500 border border-slate-200">
                      {tmpl.data?.backendConfig?.language || 'dotnet'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 font-bold text-xs group-hover:translate-x-0.5 transition-transform">
                    <span>Wählen</span>
                    <PlayCircle size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
