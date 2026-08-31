import React, { useState, useMemo } from 'react';
import JSZip from 'jszip';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';
import { useBridgeStore } from '../../stores/useBridgeStore';
import { NextcloudAppConfig, NcTab } from '../../types/nextcloud';
import { getDefaultNextcloudConfig, generateNextcloudApp } from '../../utils/generators/nextcloudGenerator';
import { NcMetadataTab } from './components/NcMetadataTab';
import { NcEntitySelectorTab } from './components/NcEntitySelectorTab';
import { NcArchitectureTab } from './components/NcArchitectureTab';
import { NcFrontendTab } from './components/NcFrontendTab';
import { NcApiDocTab } from './components/NcApiDocTab';
import { NcCodePreviewTab } from './components/NcCodePreviewTab';
import {
  X,
  Download,
  Send,
  Cloud,
  FileText,
  Code,
  Shield,
  Layers,
  Database,
  Save,
  Check
} from 'lucide-react';

interface NextcloudGeneratorModalProps {
  onClose: () => void;
}

export const NextcloudGeneratorModal: React.FC<NextcloudGeneratorModalProps> = ({ onClose }) => {
  const { tables, forms, reports, pages, queries, backendConfig, setBackendConfig } = useProjectStore();
  const { addToast } = useUIStore();
  const bridgeStore = useBridgeStore();

  const [activeTab, setActiveTab] = useState<NcTab>('metadata');
  const [config, setConfig] = useState<NextcloudAppConfig>(() => ({
    ...getDefaultNextcloudConfig(backendConfig),
    ...(backendConfig?.nextcloudApp || {})
  }));
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  const generatedFiles = useMemo(() => {
    return generateNextcloudApp(tables, forms, reports, pages, queries, config, backendConfig);
  }, [tables, forms, reports, pages, queries, config, backendConfig]);

  const handleConfigChange = (updates: Partial<NextcloudAppConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleSaveConfig = () => {
    setBackendConfig({
      ...backendConfig,
      nextcloudApp: config
    });
    addToast('Nextcloud App-Konfiguration im Projekt gespeichert!', 'success');
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      // Nextcloud apps expect files to be inside the app folder named after appId
      const folderName = config.appId || 'dbs_custom_app';
      const rootFolder = zip.folder(folderName) || zip;

      generatedFiles.forEach(file => {
        rootFolder.file(file.path, file.content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.appId || 'nextcloud-app'}-v${config.version || '1.0.0'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast(`Nextcloud App ZIP erfolgreich heruntergeladen: ${a.download}`, 'success');
    } catch (err: any) {
      addToast(`Fehler beim Erstellen des ZIPs: ${err.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeployToBridge = async () => {
    setIsDeploying(true);
    try {
      const isOnline = await bridgeStore.checkHealth();
      if (!isOnline) {
        addToast('Lokale Bridge ist nicht aktiv (Port 5050). Bitte starten Sie die Bridge.', 'warning');
        bridgeStore.setRunnerModalOpen(true);
        setIsDeploying(false);
        return;
      }

      const payload = {
        projectId: config.appId || 'nextcloud-app',
        projectName: config.appName || 'Nextcloud App',
        stack: {
          backendType: 'nextcloud',
          frontendType: config.enableVueFrontend ? 'vue' : 'none',
          databaseType: 'MySQL'
        },
        ports: {
          backendPort: 80,
          frontendPort: 80
        },
        options: {
          useSharedDependencies: true,
          autoInstall: false,
          autoMigrateDb: true,
          autoRun: false
        },
        files: generatedFiles.map(f => ({ path: f.path, content: f.content }))
      };

      const res = await bridgeStore.deployProject(payload);
      if (res.success) {
        addToast('Nextcloud App erfolgreich über Bridge bereitgestellt!', 'success');
        bridgeStore.setRunnerModalOpen(true);
      } else {
        addToast(`Deploy fehlgeschlagen: ${res.error}`, 'error');
      }
    } catch (err: any) {
      addToast(`Bridge Deploy Fehler: ${err.message}`, 'error');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Cloud size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Nextcloud App & OCP REST-API Generator
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-semibold">
                  PHP 8.x • OCP • Vue 3
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Generieren Sie native, installierbare Nextcloud-Apps mit Dependency Injection, Doctrine DBAL und @nextcloud/vue Frontend.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              title="Konfiguration im aktuellen Projekt sichern"
            >
              <Save size={14} />
              Konfig speichern
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex gap-1 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('metadata')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'metadata'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Cloud size={15} />
            App-Metadaten (info.xml)
          </button>

          <button
            onClick={() => setActiveTab('entities')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'entities'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database size={15} />
            Tabellen & REST Endpunkte
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'architecture'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Shield size={15} />
            Architektur & DI (OCP / DBAL)
          </button>

          <button
            onClick={() => setActiveTab('frontend')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'frontend'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers size={15} />
            Vue 3 Frontend (@nextcloud/vue)
          </button>

          <button
            onClick={() => setActiveTab('apidoc')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'apidoc'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText size={15} />
            API-Doku (Markdown)
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Code size={15} />
            Code-Vorschau ({generatedFiles.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40 dark:bg-slate-950/40">
          {activeTab === 'metadata' && (
            <NcMetadataTab config={config} onChange={handleConfigChange} />
          )}

          {activeTab === 'entities' && (
            <NcEntitySelectorTab
              config={config}
              onChange={handleConfigChange}
              tables={tables}
              forms={forms}
              reports={reports}
              queries={queries}
            />
          )}

          {activeTab === 'architecture' && (
            <NcArchitectureTab config={config} onChange={handleConfigChange} />
          )}

          {activeTab === 'frontend' && (
            <NcFrontendTab config={config} onChange={handleConfigChange} />
          )}

          {activeTab === 'apidoc' && (
            <NcApiDocTab files={generatedFiles} />
          )}

          {activeTab === 'preview' && (
            <NcCodePreviewTab files={generatedFiles} />
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>📦 <strong>{generatedFiles.length}</strong> Dateien generiert</span>
            <span>•</span>
            <span>🏷️ ID: <strong className="font-mono text-blue-600">{config.appId}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDeployToBridge}
              disabled={isDeploying}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition disabled:opacity-50"
            >
              <Send size={14} className={isDeploying ? 'animate-spin' : ''} />
              {isDeploying ? 'Deploye...' : 'Auf lokaler Bridge bereitstellen'}
            </button>

            <button
              onClick={handleDownloadZip}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition disabled:opacity-50"
            >
              <Download size={14} className={isExporting ? 'animate-spin' : ''} />
              {isExporting ? 'Erstelle ZIP...' : 'Nextcloud App ZIP herunterladen'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
