import React from 'react';
import { 
  Layers, 
  Users, 
  Building2, 
  Globe, 
  HardDrive, 
  Search, 
  RefreshCw, 
  Settings,
  X,
  ExternalLink
} from 'lucide-react';
import { ProviderTabInfo } from '../../../utils/templateFilterUtils';

interface TemplateFilterToolbarProps {
  tabs: ProviderTabInfo[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSyncing: boolean;
  onSync: () => void;
  onManageProviders?: () => void;
  variant?: 'dark' | 'light';
}

export const TemplateFilterToolbar: React.FC<TemplateFilterToolbarProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  isSyncing,
  onSync,
  onManageProviders,
  variant = 'dark'
}) => {
  const isDark = variant === 'dark';
  const activeTabInfo = tabs.find(t => t.id === activeTab) || tabs[0];

  const getIcon = (type: ProviderTabInfo['iconType']) => {
    switch (type) {
      case 'all':
        return <Layers size={14} className="shrink-0" />;
      case 'community':
        return <Users size={14} className="shrink-0 text-emerald-400" />;
      case 'enterprise':
        return <Building2 size={14} className="shrink-0 text-indigo-400" />;
      case 'builtin':
        return <HardDrive size={14} className="shrink-0 text-amber-400" />;
      case 'provider':
      default:
        return <Globe size={14} className="shrink-0 text-sky-400" />;
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Top Row: Provider Switcher Buttons + Sync & Manage Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Provider Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#232323] border border-[#3d3d3d] shadow-inner">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                id={`btn-filter-provider-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : isDark
                    ? 'text-neutral-300 hover:text-white hover:bg-[#333333]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={tab.description || tab.name}
              >
                {getIcon(tab.iconType)}
                <span>{tab.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isDark
                      ? 'bg-[#333333] text-neutral-400 border border-[#444444]'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Controls: Sync & Settings */}
        <div className="flex items-center gap-2">
          <button
            id="btn-sync-external-templates-toolbar"
            onClick={onSync}
            disabled={isSyncing}
            className={`px-3 py-1.5 text-xs rounded-lg font-semibold border flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
              isDark
                ? 'bg-[#333333] hover:bg-[#3d3d3d] text-neutral-200 border-[#4a4a4a]'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
            }`}
            title="Vorlagen von konfigurierten Anbietern aktualisieren"
          >
            <RefreshCw
              size={13}
              className={isSyncing ? 'animate-spin text-indigo-400' : 'text-neutral-400'}
            />
            <span>{isSyncing ? 'Synchronisiere...' : 'Anbieter synchronisieren'}</span>
          </button>

          {onManageProviders && (
            <button
              id="btn-open-provider-settings"
              onClick={onManageProviders}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#333333] hover:bg-[#3d3d3d] text-neutral-300 hover:text-white border-[#4a4a4a]'
                  : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-300'
              }`}
              title="Anbieter-URLs & Quellen verwalten"
            >
              <Settings size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Second Row: Search Input + Active Filter Info Pill */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          />
          <input
            type="text"
            id="input-search-templates"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Vorlagen in "${activeTabInfo.name}" durchsuchen (z.B. CRM, Kasse, IoT)...`}
            className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs outline-none transition-all ${
              isDark
                ? 'bg-[#232323] border border-[#3d3d3d] text-white placeholder-neutral-500 focus:border-indigo-500 focus:bg-[#282828]'
                : 'bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-indigo-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5 rounded cursor-pointer"
              title="Suche zurücksetzen"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Active Provider Info / Source Indicator */}
        {activeTabInfo.description && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] ${
              isDark
                ? 'bg-[#242424] text-neutral-400 border border-[#383838]'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <span className="truncate max-w-xs sm:max-w-md">
              {activeTabInfo.description}
            </span>
            {activeTabInfo.url && (
              <a
                href={activeTabInfo.url}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-0.5 shrink-0"
                title="Quell-URL im Browser öffnen"
              >
                <span>Quelle</span>
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
