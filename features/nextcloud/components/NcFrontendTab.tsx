import React from 'react';
import { NextcloudAppConfig } from '../../../types/nextcloud';
import { Layout, Palette, Code, CheckCircle } from 'lucide-react';

interface NcFrontendTabProps {
  config: NextcloudAppConfig;
  onChange: (updates: Partial<NextcloudAppConfig>) => void;
}

export const NcFrontendTab: React.FC<NcFrontendTabProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 rounded-xl p-4 text-xs text-indigo-900 dark:text-indigo-200">
        <h4 className="font-bold text-sm mb-1 flex items-center gap-1.5">
          <span>🎨</span> Vue 3 & @nextcloud/vue Frontend Integration
        </h4>
        <p className="opacity-90">
          Nextcloud empfiehlt Vue.js und TypeScript für moderne App-Oberflächen. Die generierte App nutzt <code>@nextcloud/vue</code>, standardisierte CSS-Variablen und integriert sich nahtlos in das Nextcloud App-Layout.
        </p>
      </div>

      <div className="space-y-4">
        <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enableVueFrontend}
            onChange={e => onChange({ enableVueFrontend: e.target.checked })}
            className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
          />
          <div className="text-xs">
            <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">Vue 3 Single Page Application generieren</div>
            <div className="text-slate-500 mt-1">
              Erstellt <code>src/App.vue</code>, <code>src/views/TableView.vue</code>, Axios-Service und Vite-Konfiguration für interaktive Tabellen, Filter und Detailansichten direkt in Nextcloud.
            </div>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enableNavigationMenu}
            onChange={e => onChange({ enableNavigationMenu: e.target.checked })}
            className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
          />
          <div className="text-xs">
            <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">Nextcloud Hauptnavigations-Eintrag</div>
            <div className="text-slate-500 mt-1">
              Fügt die App der oberen Nextcloud-Hauptnavigationsleiste hinzu (Icon: <code>img/app.svg</code>).
            </div>
          </div>
        </label>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/60">
        <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Enthaltene Vue-Bibliotheken im Frontend:</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="font-mono text-[11px]">@nextcloud/vue</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="font-mono text-[11px]">@nextcloud/axios (CSRF-Safe)</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="font-mono text-[11px]">@nextcloud/router (generateUrl)</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="font-mono text-[11px]">Vue 3 + TypeScript Composition API</span>
          </div>
        </div>
      </div>
    </div>
  );
};
