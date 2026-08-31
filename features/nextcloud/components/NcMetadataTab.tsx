import React from 'react';
import { NextcloudAppConfig } from '../../../types/nextcloud';

interface NcMetadataTabProps {
  config: NextcloudAppConfig;
  onChange: (updates: Partial<NextcloudAppConfig>) => void;
}

export const NcMetadataTab: React.FC<NcMetadataTabProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-xl p-4 text-xs text-blue-900 dark:text-blue-200">
        <h4 className="font-bold text-sm mb-1 flex items-center gap-1.5">
          <span>☁️</span> Nextcloud App Spezifikationen (appinfo/info.xml)
        </h4>
        <p className="opacity-90">
          Konfigurieren Sie Metadaten, Namespace und Berechtigungen Ihrer Nextcloud-App. Die App nutzt das standardisierte OCP-Framework (PHP 8.x + Doctrine DBAL).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            App-ID (Technischer Slug) *
          </label>
          <input
            type="text"
            value={config.appId}
            onChange={e => onChange({ appId: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            placeholder="z.B. dbs_projektverwaltung"
          />
          <p className="text-[10px] text-slate-500 mt-1">Darf nur Kleinbuchstaben, Ziffern und Unterstriche enthalten.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            App-Anzeigename *
          </label>
          <input
            type="text"
            value={config.appName}
            onChange={e => onChange({ appName: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            placeholder="z.B. Projekt & Aufmaß Manager"
          />
          <p className="text-[10px] text-slate-500 mt-1">Erscheint im Nextcloud Hauptmenü und im App Store.</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Beschreibung / Summary
          </label>
          <textarea
            rows={2}
            value={config.description}
            onChange={e => onChange({ description: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            placeholder="Kurze Zusammenfassung der App-Funktionen..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Version
          </label>
          <input
            type="text"
            value={config.version}
            onChange={e => onChange({ version: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            placeholder="1.0.0"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Lizenz
          </label>
          <select
            value={config.license}
            onChange={e => onChange({ license: e.target.value as any })}
            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="AGPL-3.0-or-later">AGPL-3.0-or-later (Nextcloud Standard)</option>
            <option value="GPL-3.0-or-later">GPL-3.0-or-later</option>
            <option value="MIT">MIT License</option>
            <option value="Apache-2.0">Apache 2.0</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Autor
          </label>
          <input
            type="text"
            value={config.author}
            onChange={e => onChange({ author: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            placeholder="DB Studio Pro"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Autor E-Mail
          </label>
          <input
            type="email"
            value={config.authorEmail || ''}
            onChange={e => onChange({ authorEmail: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            placeholder="kontakt@meine-firma.de"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Min. Nextcloud Version
          </label>
          <input
            type="text"
            value={config.minNextcloudVersion}
            onChange={e => onChange({ minNextcloudVersion: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            placeholder="27"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Max. Nextcloud Version
          </label>
          <input
            type="text"
            value={config.maxNextcloudVersion}
            onChange={e => onChange({ maxNextcloudVersion: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            placeholder="31"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Kategorie
          </label>
          <select
            value={config.category}
            onChange={e => onChange({ category: e.target.value as any })}
            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="organization">Organisation & Produktivität</option>
            <option value="tools">Werkzeuge & Utilities</option>
            <option value="office">Office & Verwaltung</option>
            <option value="multimedia">Medien</option>
            <option value="custom">Individuell</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tabellen-Präfix in Nextcloud DB
          </label>
          <input
            type="text"
            value={config.tablePrefix}
            onChange={e => onChange({ tablePrefix: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            placeholder="dbs_"
          />
          <p className="text-[10px] text-slate-500 mt-1">z.B. <code>oc_dbs_projekte</code> in MySQL/Postgres.</p>
        </div>
      </div>
    </div>
  );
};
