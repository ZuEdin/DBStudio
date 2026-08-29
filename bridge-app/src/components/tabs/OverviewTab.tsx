import React, { useState } from 'react';
import { EnvironmentHealth, BridgeProcess } from '../../types/bridge';
import { StatusCard } from '../StatusCard';
import { 
  Terminal, 
  HardDrive, 
  Play, 
  Square, 
  RotateCw, 
  Globe, 
  Layers, 
  AlertCircle, 
  Package, 
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Zap
} from 'lucide-react';
import { bridgeApi } from '../../services/bridgeApi';

interface OverviewTabProps {
  health: EnvironmentHealth;
  processes: BridgeProcess[];
  onStartProcess: (id: string) => void;
  onStopProcess: (id: string) => void;
  onRestartProcess: (id: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  health,
  processes,
  onStartProcess,
  onStopProcess,
  onRestartProcess
}) => {
  const [packagingState, setPackagingState] = useState<Record<string, { isBuilding: boolean; message?: string; installerPath?: string }>>({});

  const getProjectId = (procId: string) => {
    return procId.replace(/_tauri|_backend|_frontend|_electron|_process|_build/g, '');
  };

  const handleBuildAndRunInstaller = async (projectId: string) => {
    setPackagingState(prev => ({
      ...prev,
      [projectId]: { isBuilding: true, message: 'Erstelle Installationspaket...' }
    }));

    try {
      const res = await bridgeApi.buildPackage(projectId);
      if (res.success && res.installerPath) {
        setPackagingState(prev => ({
          ...prev,
          [projectId]: { isBuilding: false, installerPath: res.installerPath, message: `Installer bereit: ${res.installerName}` }
        }));
        await bridgeApi.launchPackage(res.installerPath);
      } else {
        setPackagingState(prev => ({
          ...prev,
          [projectId]: { 
            isBuilding: false, 
            message: res.allInstallers && res.allInstallers.length > 0 
              ? 'Installer gebaut' 
              : 'Build abgeschlossen' 
          }
        }));
        if (res.packageDir) {
          await bridgeApi.openPackageFolder(res.packageDir);
        }
      }
    } catch (err: any) {
      setPackagingState(prev => ({
        ...prev,
        [projectId]: { isBuilding: false, message: `Fehler: ${err.message}` }
      }));
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'building':
      case 'installing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <RotateCw className="w-3 h-3 animate-spin text-amber-500" />
            <span>Kompiliert...</span>
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Aktiv</span>
          </span>
        );
      case 'stopped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span>Bereit / Gestoppt</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            <span>Fehlgeschlagen</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            {status}
          </span>
        );
    }
  };

  const runningCount = processes.filter(p => p.status === 'running').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#0F172A] dark:via-[#0E1526] dark:to-[#0A0F1D] border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-sm dark:shadow-2xl relative overflow-hidden transition-colors">
        <div className="hidden dark:block absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="hidden dark:block absolute bottom-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                Bridge Daemon Active & Listening
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">
              Lokaler Workspace & Ausführungsumgebung
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs max-w-2xl leading-relaxed">
              Dieser lokale Dienst empfängt C#/.NET 10 und Frontend-Generierungen direkt aus der DB Studio Web-Applikation, 
              entpackt sie im Workspace und führt <code className="text-emerald-700 dark:text-emerald-300 font-mono bg-slate-100 dark:bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">dotnet run</code> sowie <code className="text-emerald-700 dark:text-emerald-300 font-mono bg-slate-100 dark:bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">npm start / dev</code> auf Ihrem Computer aus.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="bg-slate-50 dark:bg-[#080D17]/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 px-4 py-3 rounded-2xl shadow-inner min-w-[120px] text-center">
              <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold tracking-wider">Aktive Dienste</div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {runningCount} <span className="text-xs font-normal text-slate-500">/ {processes.length}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#080D17]/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 px-4 py-3 rounded-2xl shadow-inner min-w-[120px] text-center">
              <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold tracking-wider">Bridge Port</div>
              <div className="text-xl font-black text-teal-600 dark:text-teal-400 font-mono mt-0.5">
                :{health.bridgePort}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#080D17]/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 px-4 py-3 rounded-2xl shadow-inner min-w-[120px] text-center">
              <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold tracking-wider">Toolchain</div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-2 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>SDKs Bereit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 1-Klick Schnellzugriff & Live-Endpunkte */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-[#0E1726] dark:via-[#0D1527] dark:to-[#0A101D] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-gradient-to-br dark:from-teal-500/20 dark:to-emerald-500/10 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 glow-teal shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                1-Klick Schnellzugriff & Live-Endpunkte
                <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30">
                  Direkt im Browser öffnen
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Klicken Sie direkt auf die Buttons, um Frontend, Swagger-API-Dokumentation oder REST-Endpunkte aufzurufen.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/20 border border-emerald-400/30 transition-all transform hover:-translate-y-0.5"
              title="Frontend Web-Applikation auf http://localhost:3000 öffnen"
            >
              <Globe className="w-4 h-4" />
              <span>Frontend öffnen</span>
              <span className="text-[10px] font-mono bg-black/20 px-1.5 py-0.5 rounded text-emerald-100">:3000</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-75" />
            </a>

            <a
              href="http://localhost:5000/swagger"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/20 border border-indigo-400/30 transition-all transform hover:-translate-y-0.5"
              title="OpenAPI / Swagger UI auf http://localhost:5000/swagger öffnen"
            >
              <BookOpen className="w-4 h-4" />
              <span>Swagger API UI</span>
              <span className="text-[10px] font-mono bg-black/20 px-1.5 py-0.5 rounded text-indigo-100">:5000/swagger</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-75" />
            </a>

            <a
              href="http://localhost:5000/api"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all"
              title="REST API Endpunkt auf http://localhost:5000/api öffnen"
            >
              <Zap className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>REST /api</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      {/* System Toolchains & SDKs */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Installierte Compiler & Runtimes
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Automatische Erkennung im Host-System</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            title=".NET SDK"
            subtitle="C# Compiler & Runtimes"
            icon={Layers}
            isReady={health.dotnetSdk.installed}
            version={health.dotnetSdk.version}
            path={health.dotnetSdk.path}
            badge="Backend"
            tags={
              health.dotnetSdk.installedSdks && health.dotnetSdk.installedSdks.length > 0
                ? health.dotnetSdk.installedSdks.map(s => `.NET ${s.major} (${s.version})`)
                : (health.dotnetSdk.availableMajorVersions?.map(v => `.NET ${v}`) || ['.NET 10', '.NET 9', '.NET 8'])
            }
            statusNote={
              health.dotnetSdk.installedSdks && health.dotnetSdk.installedSdks.length > 1
                ? `${health.dotnetSdk.installedSdks.length} SDK-Versionen auf diesem PC installiert`
                : undefined
            }
          />
          <StatusCard
            title="Node.js"
            subtitle="JavaScript Engine"
            icon={Globe}
            isReady={health.nodejs.installed}
            version={health.nodejs.version}
            path={health.nodejs.path}
            badge="Toolchain"
            statusNote="Ausführungsumgebung für Web-Frontends"
          />
          <StatusCard
            title="NPM Bundler"
            subtitle="Package Manager & Vite"
            icon={Terminal}
            isReady={health.npm.installed}
            version={health.npm.version}
            path={health.npm.path}
            badge="Frontend"
            statusNote="Paketverwaltung für React, Angular, Vue"
          />
          <StatusCard
            title="Docker Engine"
            subtitle="Container & Services"
            icon={HardDrive}
            isReady={health.docker?.installed && health.docker?.running}
            version={health.docker?.serverVersion || health.docker?.version || (health.docker?.installed ? 'Installiert' : 'N/A')}
            path={health.docker?.hint}
            badge={health.docker?.running ? 'Aktiv' : health.docker?.installed ? 'Gestoppt' : 'Nicht gefunden'}
            statusNote={health.docker?.running ? 'Container-Stack einsatzbereit' : 'Optional für Container-Datenbanken'}
          />
        </div>
      </div>
    </div>
  );
};
