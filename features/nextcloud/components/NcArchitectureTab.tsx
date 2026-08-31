import React from 'react';
import { NextcloudAppConfig } from '../../../types/nextcloud';
import { Shield, Server, Database, RefreshCw, Cpu, Activity } from 'lucide-react';

interface NcArchitectureTabProps {
  config: NextcloudAppConfig;
  onChange: (updates: Partial<NextcloudAppConfig>) => void;
}

export const NcArchitectureTab: React.FC<NcArchitectureTabProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* REST API & DI Features */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/60">
          <div className="flex items-center gap-2 mb-3">
            <Server size={18} className="text-blue-600" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Nextcloud OCP REST-API & Dependency Injection
            </h4>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableRestApi}
                onChange={e => onChange({ enableRestApi: e.target.checked })}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200">OCP REST-API aktivieren</div>
                <div className="text-[11px] text-slate-500">Generiert Controller mit <code>#[NoAdminRequired]</code>, Parameter-Mapping und DataResponse.</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enablePublicNoCSRF}
                onChange={e => onChange({ enablePublicNoCSRF: e.target.checked })}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200">Externe REST-Aufrufe ohne CSRF erlauben (#[NoCSRFRequired])</div>
                <div className="text-[11px] text-slate-500">Erlaubt den Zugriff über Webhooks, Drittsysteme oder externe API-Clients via Basic Auth / Bearer Token.</div>
              </div>
            </label>
          </div>
        </div>

        {/* Database & Multi-Backend */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/60">
          <div className="flex items-center gap-2 mb-3">
            <Database size={18} className="text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Doctrine DBAL & Schema-Migrationen
            </h4>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableMigrations}
                onChange={e => onChange({ enableMigrations: e.target.checked })}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200">Automatische Schema-Migrationen (ISchemaWrapper)</div>
                <div className="text-[11px] text-slate-500">Erstellt <code>lib/Migration/Version...php</code> zur automatischen Tabellenerstellung beim Aktivieren der App.</div>
              </div>
            </label>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg text-xs border border-slate-200 dark:border-slate-800">
              <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Unterstützte Datenbank-Engines:</div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-semibold">MySQL / MariaDB</span>
                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 text-[10px] font-semibold">PostgreSQL</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-semibold">SQLite 3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Background Jobs & Hooks */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/60">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw size={18} className="text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Hintergrund-Dienste & Cron-Jobs
            </h4>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableCronBackgroundJobs}
                onChange={e => onChange({ enableCronBackgroundJobs: e.target.checked })}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200">Nextcloud Cron Background-Jobs registrieren</div>
                <div className="text-[11px] text-slate-500">Automatische Datenbereinigung, Audit-Protokollierung und Status-Synchronisierung über <code>cron.php</code>.</div>
              </div>
            </label>
          </div>
        </div>

        {/* Activity & Stream */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/60">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={18} className="text-amber-600" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Nextcloud Activity & Audit-Stream
            </h4>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableActivityStream}
                onChange={e => onChange({ enableActivityStream: e.target.checked })}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200">Aktivitäts-Feed-Integration</div>
                <div className="text-[11px] text-slate-500">Änderungen an Datensätzen erscheinen direkt im Nextcloud-Aktivitäten-Feed der berechtigten Benutzer.</div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
