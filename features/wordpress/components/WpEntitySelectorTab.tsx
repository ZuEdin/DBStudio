import React from 'react';
import { Table, Form, Report, CustomPage, Query } from '../../../types/index';
import { WordPressPluginConfig } from '../../../types/wordpress';
import { Table as TableIcon, FileText, BarChart3, Layout, Database, CheckSquare, Square } from 'lucide-react';

interface WpEntitySelectorTabProps {
  config: WordPressPluginConfig;
  onChange: (updates: Partial<WordPressPluginConfig>) => void;
  tables: Table[];
  forms: Form[];
  reports: Report[];
  pages: CustomPage[];
  queries: Query[];
}

export const WpEntitySelectorTab: React.FC<WpEntitySelectorTabProps> = ({
  config,
  onChange,
  tables,
  forms,
  reports,
  pages,
  queries
}) => {
  const toggleItem = (listKey: keyof WordPressPluginConfig, id: string) => {
    const current = (config[listKey] as string[]) || [];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    onChange({ [listKey]: next });
  };

  const toggleAll = (listKey: keyof WordPressPluginConfig, allIds: string[]) => {
    const current = (config[listKey] as string[]) || [];
    if (current.length === allIds.length) {
      onChange({ [listKey]: [] });
    } else {
      onChange({ [listKey]: allIds });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
          Inhalte & Entitäten für das WordPress Plugin auswählen
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Wählen Sie die Formulare, Tabellen, Berichte und Custom Pages aus, die als REST-Endpunkte, WP-Admin-Menüs und Shortcodes bereitgestellt werden sollen. (Standard: Alle enthalten)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Forms Selection */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-850">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 dark:text-slate-100">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Formulare ({forms.length})
            </div>
            <button
              onClick={() => toggleAll('includedFormIds', forms.map(f => f.id))}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {config.includedFormIds?.length === forms.length ? 'Keine' : 'Alle'}
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {forms.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Keine Formulare vorhanden.</p>
            ) : (
              forms.map(form => {
                const isSelected = config.includedFormIds.length === 0 || config.includedFormIds.includes(form.id);
                return (
                  <div
                    key={form.id}
                    onClick={() => toggleItem('includedFormIds', form.id)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs border ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
                        : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-medium truncate">{form.name}</span>
                    {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tables Selection */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-850">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 dark:text-slate-100">
              <TableIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Tabellen & Datenbank ({tables.length})
            </div>
            <button
              onClick={() => toggleAll('includedTableIds', tables.map(t => t.id))}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {config.includedTableIds?.length === tables.length ? 'Keine' : 'Alle'}
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {tables.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Keine Tabellen vorhanden.</p>
            ) : (
              tables.map(table => {
                const isSelected = config.includedTableIds.length === 0 || config.includedTableIds.includes(table.id);
                return (
                  <div
                    key={table.id}
                    onClick={() => toggleItem('includedTableIds', table.id)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs border ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
                        : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-medium truncate">{table.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({table.fields.length} Spalten)</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Reports Selection */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-850">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 dark:text-slate-100">
              <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Berichte & Analysen ({reports.length})
            </div>
            <button
              onClick={() => toggleAll('includedReportIds', reports.map(r => r.id))}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {config.includedReportIds?.length === reports.length ? 'Keine' : 'Alle'}
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {reports.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Keine Berichte vorhanden.</p>
            ) : (
              reports.map(report => {
                const isSelected = config.includedReportIds.length === 0 || config.includedReportIds.includes(report.id);
                return (
                  <div
                    key={report.id}
                    onClick={() => toggleItem('includedReportIds', report.id)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs border ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
                        : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-medium truncate">{report.name}</span>
                    {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Custom Pages Selection */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-850">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 dark:text-slate-100">
              <Layout className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Custom Pages & Views ({pages.length})
            </div>
            <button
              onClick={() => toggleAll('includedPageIds', pages.map(p => p.id))}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {config.includedPageIds?.length === pages.length ? 'Keine' : 'Alle'}
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {pages.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Keine Custom Pages vorhanden.</p>
            ) : (
              pages.map(page => {
                const isSelected = config.includedPageIds.length === 0 || config.includedPageIds.includes(page.id);
                return (
                  <div
                    key={page.id}
                    onClick={() => toggleItem('includedPageIds', page.id)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs border ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
                        : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-medium truncate">{page.name}</span>
                    {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
