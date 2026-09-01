import React, { useState, useMemo } from 'react';
import { DockerStackConfig, GeneratedDeploymentFile } from './types';
import { DockerComposeGenerator } from './services/dockerComposeGenerator';
import { DockerfileGenerators } from './services/dockerfileGenerators';
import { NginxConfigGenerator } from './services/nginxConfigGenerator';
import { SqlInitGenerator } from './services/sqlInitGenerator';
import { CloudScriptsGenerator } from './services/cloudScriptsGenerator';
import { ZipPackageService } from './services/zipPackageService';

import { DockerTopologyDiagram } from './components/DockerTopologyDiagram';
import { DockerConfigForm } from './components/DockerConfigForm';
import { DockerFilePreview } from './components/DockerFilePreview';

import { Table, Relationship } from '../../types';
import { useBridgeStore } from '../../stores/useBridgeStore';
import { useDisclaimerStore } from '../../stores/useDisclaimerStore';
import { X, Play, Download, Terminal, Layers, Box, CheckCircle2, ShieldCheck, Laptop } from 'lucide-react';

interface DockerCloudDeployerModalProps {
  projectName: string;
  tables: Table[];
  relationships: Relationship[];
  onClose: () => void;
  onAddToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const DockerCloudDeployerModal: React.FC<DockerCloudDeployerModalProps> = ({
  projectName,
  tables,
  relationships,
  onClose,
  onAddToast
}) => {
  const [activeTab, setActiveTab] = useState<'topology' | 'config' | 'files' | 'deploy'>('topology');
  const [isDeploying, setIsDeploying] = useState(false);

  const [config, setConfig] = useState<DockerStackConfig>({
    projectName: projectName || 'DBStudioApp',
    backendLanguage: 'nodejs',
    backendVersion: '20-alpine',
    backendPort: 5000,
    
    frontendFramework: 'react',
    frontendPort: 3000,
    includeFrontend: true,

    dbEngine: 'postgres',
    dbVersion: '16-alpine',
    dbPort: 5432,
    dbName: `${(projectName || 'dbapp').toLowerCase().replace(/[^a-z0-9_]/g, '_')}_db`,
    dbUser: 'postgres',
    dbPassword: 'enterprise_secret_pwd',
    dbVolume: 'db_data',

    reverseProxy: 'nginx',
    httpPort: 80,
    httpsPort: 443,
    domainName: 'localhost',
    enableSsl: false,

    includeRedis: false,
    redisPort: 6379,

    includeDbAdmin: true,
    dbAdminPort: 8080,

    includeTelemetry: false,
    telemetryPort: 9090,

    cloudTarget: 'docker_compose',
    restartPolicy: 'unless-stopped',
    enableHealthchecks: true,
    enableAutoMigrate: true,
    enableSeedData: true
  });

  // Generate all files dynamically based on configuration
  const generatedFiles: GeneratedDeploymentFile[] = useMemo(() => {
    const composeFiles = DockerComposeGenerator.generateComposeFiles(config);
    const backendDocker = DockerfileGenerators.generateBackendDockerfile(config);
    const frontendDocker = config.includeFrontend ? [DockerfileGenerators.generateFrontendDockerfile(config)] : [];
    const nginxFiles = config.reverseProxy === 'nginx' ? NginxConfigGenerator.generateNginxConf(config) : [];
    const sqlInit = SqlInitGenerator.generateDatabaseInitScript(config, tables, relationships);
    const automationScripts = CloudScriptsGenerator.generateAutomationScripts(config);

    return [
      ...composeFiles,
      backendDocker,
      ...frontendDocker,
      ...nginxFiles,
      sqlInit,
      ...automationScripts
    ];
  }, [config, tables, relationships]);

  const handleDownloadZip = () => {
    useDisclaimerStore.getState().requireConfirmation(`Docker Deployment Export (${config.projectName})`, async () => {
      try {
        await ZipPackageService.downloadDeploymentZip(config.projectName, generatedFiles);
        onAddToast('Docker Deployment Paket (.zip) erfolgreich heruntergeladen!', 'success');
      } catch (e: any) {
        onAddToast(`Download fehlgeschlagen: ${e.message}`, 'error');
      }
    });
  };

  const handleDeployToBridge = () => {
    useDisclaimerStore.getState().requireConfirmation(`Container Deployment via Bridge (${config.projectName})`, async () => {
      const bridgeStore = useBridgeStore.getState();
      setIsDeploying(true);
      try {
        const isOnline = await bridgeStore.checkHealth();
        if (!isOnline) {
          onAddToast('Lokale PC-Bridge ist offline. Bitte starten Sie die Bridge.', 'warning');
          bridgeStore.setRunnerModalOpen(true);
          setIsDeploying(false);
          return;
        }

        const payload = {
          projectId: config.projectName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          projectName: config.projectName,
          stack: {
            backendType: config.backendLanguage,
            frontendType: config.frontendFramework,
            databaseType: config.dbEngine
          },
          ports: {
            backendPort: config.backendPort,
            frontendPort: config.frontendPort
          },
          options: {
            useSharedDependencies: true,
            autoInstall: true,
            autoMigrateDb: true,
            autoRun: true
          },
          files: generatedFiles.map(f => ({ path: f.path, content: f.content }))
        };

        await bridgeStore.deployProject(payload);
        onAddToast('Container-Stack erfolgreich an lokale Bridge übertragen!', 'success');
        bridgeStore.setRunnerModalOpen(true);
      } catch (err: any) {
        onAddToast(`Fehler bei Übertragung: ${err.message}`, 'error');
      } finally {
        setIsDeploying(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Box size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                1-Klick Docker Compose & Cloud Deployer
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800">
                  Ready to Ship
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Schlüsselfertige Multi-Container Setups ({config.dbEngine.toUpperCase()} + {config.backendLanguage.toUpperCase()} + {config.reverseProxy.toUpperCase()})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-2 bg-slate-50/50 dark:bg-slate-950/30">
          {[
            { id: 'topology', label: 'Architektur & Stack', icon: <Layers size={14} /> },
            { id: 'config', label: 'Service-Konfiguration', icon: <Box size={14} /> },
            { id: 'files', label: `Dateien & Manifeste (${generatedFiles.length})`, icon: <Terminal size={14} /> },
            { id: 'deploy', label: '1-Klick Ausführung', icon: <Play size={14} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900">
          {activeTab === 'topology' && (
            <div className="space-y-6">
              <DockerTopologyDiagram config={config} />
              <DockerConfigForm config={config} onChange={setConfig} />
            </div>
          )}

          {activeTab === 'config' && (
            <DockerConfigForm config={config} onChange={setConfig} />
          )}

          {activeTab === 'files' && (
            <DockerFilePreview files={generatedFiles} onDownloadZip={handleDownloadZip} />
          )}

          {activeTab === 'deploy' && (
            <div className="space-y-6 max-w-3xl mx-auto py-2">
              <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 rounded-xl">
                <h4 className="font-semibold text-sm text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  Bereitstellungsschritte für Ihren Container-Stack
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Das Container-Setup beinhaltet automatisch konfigurierte Healthchecks, Persistenz-Volumes und einen initialen SQL-Seed für alle {tables.length} Tabellen.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadZip}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-sm transition-all"
                  >
                    <Download size={16} className="text-indigo-600" />
                    ZIP Paket herunterladen (.zip)
                  </button>

                  <button
                    onClick={handleDeployToBridge}
                    disabled={isDeploying}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                  >
                    <Laptop size={16} />
                    {isDeploying ? 'Übertrage an Bridge...' : 'Auf lokalem Rechner starten (Bridge)'}
                  </button>
                </div>
              </div>

              {/* Terminal Snippet */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300">
                <div className="text-slate-500 text-[11px] mb-2 font-sans font-semibold">Schnellstart im Terminal:</div>
                <div className="text-cyan-400"># 1. In das Projektverzeichnis wechseln & starten</div>
                <div className="text-slate-200 mt-1">chmod +x deploy.sh && ./deploy.sh</div>
                <div className="text-cyan-400 mt-3"># Alternativ direkt mit Docker Compose:</div>
                <div className="text-slate-200 mt-1">docker compose up -d --build</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <span className="text-xs text-slate-500">
            {generatedFiles.length} Manifeste generiert • PostgreSQL / Express / Nginx Stack
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Schließen
            </button>
            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all"
            >
              <Download size={14} />
              ZIP Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
