import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, HardDrive, Cpu, Terminal, RefreshCw } from 'lucide-react';
import { bridgeApi } from '../../services/bridgeApi';
import { BridgeSettings } from '../../types/bridge';

export const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<BridgeSettings>({
    bridgePort: 5050,
    bridgeServerPort: 5050,
    defaultBackendPort: 5000,
    defaultFrontendPort: 3000,
    portConflictStrategy: 'auto_increment',
    allowedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    allowPublicOrigin: false,
    securityToken: 'bridge_sec_default',
    git: {
      enabled: true,
      autoInit: true,
      autoCommit: true,
      commitMessageTemplate: 'Auto-commit from DB Studio',
      defaultRemote: '',
      personalAccessToken: ''
    },
    ftp: {
      enabled: false,
      protocol: 'sftp',
      host: '',
      port: 22,
      username: '',
      remotePath: '/var/www/app',
      autoDeployOnBuild: false
    },
    autoStartOnBoot: false,
    minimizeToTray: true,
    enableRealtimeTelemetry: true,
    defaultDotnetSdk: '10.0',
    projectsDir: 'C:\\_DEV\\dbstudio_bridge\\Projects',
    sharedDependenciesDir: 'C:\\_DEV\\dbstudio_bridge\\Shared_Dependencies',
    enableDockerContainerization: true,
    logLevel: 'info'
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await bridgeApi.getSettings();
      if (data) setSettings(data);
    } catch {
      // Fallback
    }
  };

  const handleSave = async () => {
    try {
      await bridgeApi.saveSettings(settings);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">Bridge Server Einstellungen</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Konfiguration des lokalen Hosts, Ports und der Pfade</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Bridge Port</label>
              <input
                type="number"
                value={settings.bridgePort}
                onChange={(e) => setSettings({ ...settings, bridgePort: parseInt(e.target.value) || 5050 })}
                className="w-full bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Standard .NET SDK Version</label>
              <select
                value={settings.defaultDotnetSdk}
                onChange={(e) => setSettings({ ...settings, defaultDotnetSdk: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2"
              >
                <option value="10.0">.NET 10 (Empfohlen)</option>
                <option value="9.0">.NET 9</option>
                <option value="8.0">.NET 8 (LTS)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
            >
              {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? 'Gespeichert!' : 'Einstellungen Speichern'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
