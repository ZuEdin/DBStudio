import React from 'react';
import { WordPressPluginConfig } from '../../../types/wordpress';
import { Shield, Lock, Key, Users, CheckCircle2 } from 'lucide-react';

interface WpSecurityTabProps {
  config: WordPressPluginConfig;
  onChange: (updates: Partial<WordPressPluginConfig>) => void;
}

export const WpSecurityTab: React.FC<WpSecurityTabProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
        <div className="flex items-center gap-2 mb-1 text-slate-800 dark:text-slate-100 font-semibold text-sm">
          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Sicherheits-, Rollen- & API-Konfiguration
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Steuern Sie die Berechtigungen für WordPress-Rollen, REST API Authentifizierung (Nonce & Application Passwords) und öffentliche Formulareingaben.
        </p>
      </div>

      <div className="space-y-4">
        {/* Capability Settings */}
        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Erforderliche WordPress Capability für Admin-Menü & Modifikationen
          </label>
          <select
            value={config.capability}
            onChange={(e) => onChange({ capability: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-slate-100"
          >
            <option value="manage_options">manage_options (Nur Administratoren)</option>
            <option value="edit_others_posts">edit_others_posts (Administratoren & Redakteure)</option>
            <option value="publish_posts">publish_posts (Autoren & höher)</option>
            <option value="edit_posts">edit_posts (Mitarbeiter & höher)</option>
            <option value="read">read (Alle angemeldeten Benutzer)</option>
          </select>
        </div>

        {/* Feature Switches */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850 flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">Öffentliche Formular-Submissions</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Besucher ohne Login dürfen Formulare absenden</div>
            </div>
            <input
              type="checkbox"
              checked={config.publicSubmissions}
              onChange={(e) => onChange({ publicSubmissions: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850 flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">REST API aktivieren</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">wp-json/{config.pluginSlug}/v1 Endpunkte bereitstellen</div>
            </div>
            <input
              type="checkbox"
              checked={config.enableRestApi}
              onChange={(e) => onChange({ enableRestApi: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850 flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">Shortcodes aktivieren</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">[dbs_form], [dbs_table], [dbs_report] etc.</div>
            </div>
            <input
              type="checkbox"
              checked={config.enableShortcodes}
              onChange={(e) => onChange({ enableShortcodes: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850 flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">Gutenberg Block Support</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Registrierung dynamischer Gutenberg Blöcke</div>
            </div>
            <input
              type="checkbox"
              checked={config.enableGutenberg}
              onChange={(e) => onChange({ enableGutenberg: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Security Checklist Info */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            WordPress Sicherheitsstandards (Hardened)
          </div>
          <ul className="text-[11px] text-emerald-700 dark:text-emerald-400 space-y-0.5 list-disc list-inside">
            <li>Automatischer Schutz vor Direktaufrufen (WPINC Check)</li>
            <li>WordPress Nonce-Validierung bei AJAX- und REST-Anfragen</li>
            <li>Prepared Statements mit $wpdb-&gt;prepare() &amp; Type-Sanitization</li>
            <li>Sichere Tabelleninitialisierung via dbDelta()</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
