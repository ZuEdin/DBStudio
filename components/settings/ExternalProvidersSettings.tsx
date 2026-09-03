import React, { useState } from 'react';
import { useConfigStore, DEFAULT_TEMPLATE_PROVIDERS } from '../../stores/useConfigStore';
import { ExternalTemplateProvider } from '../../types/config';
import { externalTemplateService } from '../../services/externalTemplateService';
import { useUIStore } from '../../stores/useUIStore';
import { 
  Globe, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Layers,
  Database,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export const ExternalProvidersSettings: React.FC = () => {
  const { config, updateConfig } = useConfigStore();
  const ui = useUIStore();

  const providers: ExternalTemplateProvider[] = 
    config.externalTemplateProviders || DEFAULT_TEMPLATE_PROVIDERS;

  // New provider form state
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleToggleProvider = (id: string) => {
    const updated = providers.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p);
    updateConfig({ externalTemplateProviders: updated });
    ui.addToast('Anbieter-Status aktualisiert', 'info');
  };

  const handleDeleteProvider = (id: string) => {
    const updated = providers.filter(p => p.id !== id);
    updateConfig({ externalTemplateProviders: updated });
    ui.addToast('Anbieter entfernt', 'info');
  };

  const handleTestUrl = async () => {
    if (!url.trim()) {
      setTestResult({ success: false, message: 'Bitte geben Sie eine gültige URL ein.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await externalTemplateService.testProviderConnection(url.trim(), 'test_id', name.trim() || 'Externer Anbieter');
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Verbindung fehlgeschlagen' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddProvider = () => {
    if (!name.trim() || !url.trim()) {
      ui.addToast('Name und URL sind erforderlich', 'error');
      return;
    }

    const newProvider: ExternalTemplateProvider = {
      id: `prov_${Date.now()}`,
      name: name.trim(),
      url: url.trim(),
      description: description.trim() || undefined,
      enabled: true,
      status: 'idle'
    };

    const updated = [...providers, newProvider];
    updateConfig({ externalTemplateProviders: updated });
    setName('');
    setUrl('');
    setDescription('');
    setTestResult(null);
    ui.addToast(`Anbieter "${newProvider.name}" hinzugefügt`, 'success');
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const res = await externalTemplateService.syncAllProviders();
      ui.addToast(
        `Synchronisierung abgeschlossen: ${res.totalCount} externe Vorlagen geladen.`, 
        'success'
      );
    } catch (err: any) {
      ui.addToast(`Fehler bei der Synchronisierung: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetToDefaults = () => {
    updateConfig({ externalTemplateProviders: DEFAULT_TEMPLATE_PROVIDERS });
    externalTemplateService.clearCache();
    ui.addToast('Vorlagen-Anbieter auf Werkseinstellungen zurückgesetzt', 'info');
  };

  const applyPreset = (presetName: string, presetUrl: string, presetDesc: string) => {
    setName(presetName);
    setUrl(presetUrl);
    setDescription(presetDesc);
    setTestResult(null);
  };

  return (
    <div id="external-providers-settings-container" className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Globe size={18} className="text-blue-500 shrink-0" />
            Externe Vorlagen- & Schema-Anbieter
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Verbinden Sie Remote-URLs, Firmen-Repositories oder Open-Source-Registries zur Einbindung fremder Datenbankschemen.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-sync-all-providers"
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Alle aktiven Anbieter nach neuen Schemen abfragen"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Synchronisiere...' : 'Jetzt Synchronisieren'}</span>
          </button>
          <button
            id="btn-reset-providers"
            onClick={handleResetToDefaults}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Auf Standard-Provider zurücksetzen"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* List of Configured Providers */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400">
          Konfigurierte Anbieter ({providers.length})
        </div>

        {providers.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <Database size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs text-slate-500">Keine externen Anbieter eingerichtet.</p>
          </div>
        ) : (
          providers.map((p) => {
            const isSuccess = p.status === 'success';
            const isError = p.status === 'error';

            return (
              <div
                key={p.id}
                id={`provider-item-${p.id}`}
                className={`p-4 rounded-xl border transition-all ${
                  p.enabled
                    ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-800 dark:text-white">
                        {p.name}
                      </span>
                      {p.enabled ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          Aktiv
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          Pausiert
                        </span>
                      )}

                      {isSuccess && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          {p.templatesCount || 0} Schemen geladen
                        </span>
                      )}

                      {isError && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center gap-1">
                          <AlertCircle size={11} />
                          Fehler
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-neutral-400 font-mono mt-1 truncate">
                      {p.url}
                    </div>

                    {p.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5">
                        {p.description}
                      </p>
                    )}

                    {p.lastSync && (
                      <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-2 flex items-center gap-1">
                        <Clock size={11} />
                        Zuletzt synchronisiert: {new Date(p.lastSync).toLocaleString('de-DE')}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id={`btn-toggle-${p.id}`}
                      onClick={() => handleToggleProvider(p.id)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        p.enabled
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                      }`}
                    >
                      {p.enabled ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                    <button
                      id={`btn-delete-${p.id}`}
                      onClick={() => handleDeleteProvider(p.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                      title="Anbieter löschen"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Provider Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Plus size={16} className="text-blue-500 font-bold" />
          <h4 className="font-bold text-sm text-slate-800 dark:text-white">
            Neuen Vorlagen-Anbieter hinzufügen
          </h4>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 block mb-1.5">
            Schnellauswahl / Standard-Registries:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset(
                'DBStudio Community Hub',
                'https://raw.githubusercontent.com/dbstudio-templates/registry/main/community-templates.json',
                'Offizielle Community-Vorlagen für CRM, ERP, Fuhrpark & Logistik'
              )}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 dark:bg-slate-700/60 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-600 flex items-center gap-1"
            >
              <Layers size={12} /> Community Hub
            </button>
            <button
              type="button"
              onClick={() => applyPreset(
                'Enterprise Industry Standards',
                'https://raw.githubusercontent.com/dbstudio-templates/registry/main/enterprise-standards.json',
                'Standardisierte ISO/DIN Schemen für Gesundheitswesen und Industrie'
              )}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 dark:bg-slate-700/60 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-600 flex items-center gap-1"
            >
              <ShieldCheck size={12} /> Enterprise ISO Hub
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Name des Anbieters
            </label>
            <input
              id="input-provider-name"
              type="text"
              placeholder="z.B. Mein Firmen-Schema-Hub"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Vorlagen-URL (JSON Endpoint)
            </label>
            <input
              id="input-provider-url"
              type="text"
              placeholder="https://company.org/schemas.json"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Beschreibung (Optional)
          </label>
          <input
            id="input-provider-desc"
            type="text"
            placeholder="Interne Vorlagen für Projekt- und Ressourcenplanung"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            id="provider-test-result"
            className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
              testResult.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{testResult.message}</p>
              {testResult.count !== undefined && (
                <p className="text-[11px] opacity-90 mt-0.5">Erkannte Vorlagen: {testResult.count}</p>
              )}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            id="btn-test-provider-url"
            type="button"
            onClick={handleTestUrl}
            disabled={isTesting || !url.trim()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={12} className={isTesting ? 'animate-spin' : ''} />
            <span>{isTesting ? 'Prüfe Verbindung...' : 'URL Testen'}</span>
          </button>
          <button
            id="btn-save-provider"
            type="button"
            onClick={handleAddProvider}
            disabled={!name.trim() || !url.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus size={14} />
            <span>Anbieter Speichern</span>
          </button>
        </div>
      </div>
    </div>
  );
};
