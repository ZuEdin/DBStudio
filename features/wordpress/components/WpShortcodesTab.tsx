import React, { useState } from 'react';
import { Table, Form, Report, CustomPage } from '../../../types/index';
import { WordPressPluginConfig } from '../../../types/wordpress';
import { Code, Copy, Check, Blocks, Sparkles } from 'lucide-react';

interface WpShortcodesTabProps {
  config: WordPressPluginConfig;
  tables: Table[];
  forms: Form[];
  reports: Report[];
  pages: CustomPage[];
}

export const WpShortcodesTab: React.FC<WpShortcodesTabProps> = ({
  config,
  tables,
  forms,
  reports,
  pages
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
        <div className="flex items-center gap-2 mb-1 text-slate-800 dark:text-slate-100 font-semibold text-sm">
          <Code className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          WordPress Shortcodes & Gutenberg Blocks
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Kopieren Sie die folgenden Shortcodes, um Formulare, Tabellen, Auswertungen und Custom Pages per Mausklick in WordPress-Seiten, Beiträge oder Elementor/Divi-Widgets einzubinden.
        </p>
      </div>

      {/* Main Full App Shortcode */}
      <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 rounded-lg flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-blue-950 dark:text-blue-200">Gesamte Applikation (Full Embed)</div>
          <div className="text-[11px] text-blue-800 dark:text-blue-400 font-mono mt-0.5">[dbs_app]</div>
        </div>
        <button
          onClick={() => copyToClipboard('[dbs_app]', 'app')}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
        >
          {copiedKey === 'app' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedKey === 'app' ? 'Kopiert' : 'Kopieren'}
        </button>
      </div>

      {/* Forms Shortcodes */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Formular Shortcodes
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {forms.length === 0 ? (
            <div className="text-xs text-slate-400 italic">Keine Formulare vorhanden.</div>
          ) : (
            forms.map(form => {
              const code = `[dbs_form id="${form.id}"]`;
              return (
                <div key={form.id} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md flex items-center justify-between">
                  <div className="truncate mr-2">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{form.name}</div>
                    <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 truncate">{code}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(code, `form-${form.id}`)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                    title="Shortcode kopieren"
                  >
                    {copiedKey === `form-${form.id}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Tables Shortcodes */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Tabellen Shortcodes
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {tables.length === 0 ? (
            <div className="text-xs text-slate-400 italic">Keine Tabellen vorhanden.</div>
          ) : (
            tables.map(table => {
              const code = `[dbs_table name="${table.name.toLowerCase()}"]`;
              return (
                <div key={table.id} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md flex items-center justify-between">
                  <div className="truncate mr-2">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{table.name}</div>
                    <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 truncate">{code}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(code, `table-${table.id}`)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                    title="Shortcode kopieren"
                  >
                    {copiedKey === `table-${table.id}` ? <Check className="w-4 h-4 text-blue-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Reports & Pages Shortcodes */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Berichte & Custom Pages Shortcodes
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {reports.map(report => {
            const code = `[dbs_report id="${report.id}"]`;
            return (
              <div key={report.id} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md flex items-center justify-between">
                <div className="truncate mr-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{report.name}</div>
                  <div className="text-[11px] font-mono text-purple-600 dark:text-purple-400 truncate">{code}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(code, `report-${report.id}`)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                >
                  {copiedKey === `report-${report.id}` ? <Check className="w-4 h-4 text-purple-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
          {pages.map(page => {
            const code = `[dbs_page id="${page.id}"]`;
            return (
              <div key={page.id} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md flex items-center justify-between">
                <div className="truncate mr-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{page.name}</div>
                  <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 truncate">{code}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(code, `page-${page.id}`)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                >
                  {copiedKey === `page-${page.id}` ? <Check className="w-4 h-4 text-amber-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
