import React from 'react';
import { WordPressPluginConfig } from '../../../types/wordpress';
import { Package, Globe, Tag, User, Layers, Shield } from 'lucide-react';

interface WpPluginMetadataTabProps {
  config: WordPressPluginConfig;
  onChange: (updates: Partial<WordPressPluginConfig>) => void;
}

export const WpPluginMetadataTab: React.FC<WpPluginMetadataTabProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
        <div className="flex items-center gap-2 mb-2 text-slate-800 dark:text-slate-100 font-semibold text-sm">
          <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Plugin Stammdaten & WordPress Header
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Diese Metadaten werden im offiziellen WordPress Plugin-Header hinterlegt und im WP-Admin-Dashboard angezeigt.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Plugin Name
          </label>
          <input
            type="text"
            value={config.pluginName}
            onChange={(e) => onChange({ pluginName: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-slate-100"
            placeholder="Mein DB Studio Plugin"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Plugin Slug (Ordner- & Datei-Präfix)
          </label>
          <input
            type="text"
            value={config.pluginSlug}
            onChange={(e) => onChange({ pluginSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-slate-900 dark:text-slate-100"
            placeholder="mein-db-plugin"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Beschreibung
          </label>
          <textarea
            rows={2}
            value={config.description}
            onChange={(e) => onChange({ description: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-slate-100"
            placeholder="Plugin zur Erfassung und Auswertung von Betriebsdaten via DB Studio Pro."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Version
          </label>
          <input
            type="text"
            value={config.version}
            onChange={(e) => onChange({ version: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-slate-100"
            placeholder="1.0.0"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Autor & Lizenz
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={config.author}
              onChange={(e) => onChange({ author: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-slate-100"
              placeholder="Autor"
            />
            <input
              type="text"
              value={config.license}
              onChange={(e) => onChange({ license: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-slate-100"
              placeholder="GPL-2.0+"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            WordPress Menütitel
          </label>
          <input
            type="text"
            value={config.menuTitle}
            onChange={(e) => onChange({ menuTitle: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-slate-100"
            placeholder="DB Studio"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Dashicon Symbol
          </label>
          <select
            value={config.menuIcon}
            onChange={(e) => onChange({ menuIcon: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-slate-100"
          >
            <option value="dashicons-database">dashicons-database (Datenbank)</option>
            <option value="dashicons-forms">dashicons-forms (Formulare)</option>
            <option value="dashicons-chart-bar">dashicons-chart-bar (Berichte)</option>
            <option value="dashicons-layout">dashicons-layout (Layouts)</option>
            <option value="dashicons-admin-generic">dashicons-admin-generic (Zahnrad)</option>
            <option value="dashicons-admin-plugins">dashicons-admin-plugins (Plugin)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Tabellen-Präfix in WordPress DB ($wpdb-&gt;prefix)
          </label>
          <input
            type="text"
            value={config.tablePrefix}
            onChange={(e) => onChange({ tablePrefix: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-slate-900 dark:text-slate-100"
            placeholder="dbs_"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Mindestanforderung (PHP / WordPress)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={config.requiresPhp}
              onChange={(e) => onChange({ requiresPhp: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-slate-100"
              placeholder="PHP 7.4+"
            />
            <input
              type="text"
              value={config.requiresWp}
              onChange={(e) => onChange({ requiresWp: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-slate-100"
              placeholder="WP 5.8+"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
