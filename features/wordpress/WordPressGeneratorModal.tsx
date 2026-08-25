import React, { useState, useMemo, useEffect } from 'react';
import JSZip from 'jszip';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';
import { useBridgeStore } from '../../stores/useBridgeStore';
import { WordPressPluginConfig } from '../../types/wordpress';
import { WpTab } from './types';
import { getDefaultWordPressConfig, generateWordPressPlugin } from '../../utils/generators/wordpressGenerator';
import { WpPluginMetadataTab } from './components/WpPluginMetadataTab';
import { WpEntitySelectorTab } from './components/WpEntitySelectorTab';
import { WpShortcodesTab } from './components/WpShortcodesTab';
import { WpSecurityTab } from './components/WpSecurityTab';
import { WpCodePreviewTab } from './components/WpCodePreviewTab';
import { 
  X, 
  Download, 
  Send, 
  Package, 
  FileText, 
  Code, 
  Shield, 
  Eye, 
  Sparkles, 
  Check, 
  Save 
} from 'lucide-react';

interface WordPressGeneratorModalProps {
  onClose: () => void;
}

export const WordPressGeneratorModal: React.FC<WordPressGeneratorModalProps> = ({ onClose }) => {
  const { tables, forms, reports, pages, queries, backendConfig, setBackendConfig } = useProjectStore();
  const { addToast } = useUIStore();
  const bridgeStore = useBridgeStore();

  const [activeTab, setActiveTab] = useState<WpTab>('metadata');
  const [config, setConfig] = useState<WordPressPluginConfig>(() => ({
    ...getDefaultWordPressConfig(backendConfig),
    ...(backendConfig?.wordpressPlugin || {})
  }));
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  const generatedFiles = useMemo(() => {
    return generateWordPressPlugin(tables, forms, reports, pages, queries, config, backendConfig);
  }, [tables, forms, reports, pages, queries, config, backendConfig]);

  const handleConfigChange = (updates: Partial<WordPressPluginConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleSaveConfig = () => {
    setBackendConfig({
      ...backendConfig,
      wordpressPlugin: config
    });
    addToast('WordPress Plugin-Konfiguration im Projekt gespeichert!', 'success');
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      generatedFiles.forEach(file => {
        zip.file(file.path, file.content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.pluginSlug || 'wordpress-plugin'}-v${config.version || '1.0.0'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast(`WordPress Plugin ZIP erfolgreich heruntergeladen: ${a.download}`, 'success');
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
        addToast('Lokale Bridge ist nicht aktiv (Port 5050). Bitte starten Sie die Bridge auf Ihrem PC.', 'warning');
        bridgeStore.setRunnerModalOpen(true);
        setIsDeploying(false);
        return;
      }

      const payload = {
        projectId: config.pluginSlug || 'wordpress-plugin',
        projectName: config.pluginName || 'WordPress Plugin',
        stack: {
          backendType: 'wordpress',
          frontendType: 'none',
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

      await bridgeStore.deployProject(payload as any);
      addToast('WordPress Plugin erfolgreich über die Bridge übertragen!', 'success');
      bridgeStore.setRunnerModalOpen(true);
    } catch (err: any) {
      addToast(`Fehler bei der Bridge-Übertragung: ${err.message}`, 'error');
    } finally {
      setIsDeploying(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[min(92vh,780px)] h-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                WordPress Plugin Generator
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 rounded">
                  v{config.version || '1.0.0'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Erstellen Sie schlüsselfertige WordPress Plugins mit Formularen, Tabellen-Views, Berichten, REST API &amp; Shortcodes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-md transition-colors"
            title="Schließen (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <button
            onClick={() => setActiveTab('metadata')}
            className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'metadata'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            Plugin-Stammdaten
          </button>

          <button
            onClick={() => setActiveTab('entities')}
            className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'entities'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Formulare &amp; Views ({forms.length + tables.length})
          </button>

          <button
            onClick={() => setActiveTab('shortcodes')}
            className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'shortcodes'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            Shortcodes &amp; Gutenberg
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Sicherheit &amp; Rollen
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'preview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            Code-Vorschau ({generatedFiles.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50">
          {activeTab === 'metadata' && (
            <WpPluginMetadataTab config={config} onChange={handleConfigChange} />
          )}

          {activeTab === 'entities' && (
            <WpEntitySelectorTab
              config={config}
              onChange={handleConfigChange}
              tables={tables}
              forms={forms}
              reports={reports}
              pages={pages}
              queries={queries}
            />
          )}

          {activeTab === 'shortcodes' && (
            <WpShortcodesTab
              config={config}
              tables={tables}
              forms={forms}
              reports={reports}
              pages={pages}
            />
          )}

          {activeTab === 'security' && (
            <WpSecurityTab config={config} onChange={handleConfigChange} />
          )}

          {activeTab === 'preview' && (
            <WpCodePreviewTab files={generatedFiles} />
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700 transition-colors"
            >
              Schließen
            </button>
            <button
              onClick={handleSaveConfig}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Konfiguration speichern
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeployToBridge}
              disabled={isDeploying}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {isDeploying ? 'Übertrage...' : 'Über Bridge bereitstellen'}
            </button>

            <button
              onClick={handleDownloadZip}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Packe ZIP...' : 'Plugin als .ZIP herunterladen'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
