import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Package, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Link2, 
  Sparkles, 
  FolderGit2, 
  RotateCw, 
  ArrowUpCircle
} from 'lucide-react';
import { bridgeApi } from '../../services/bridgeApi';
import { DependencyTarget, DirectoryDependenciesResponse, InstalledDependency } from '../../types/bridge';

const QUICK_PRESETS = [
  { name: 'axios', manager: 'npm', desc: 'HTTP-Client für API-Requests', isDev: false },
  { name: 'zod', manager: 'npm', desc: 'TypeScript-First Schema-Validierung', isDev: false },
  { name: 'lucide-react', manager: 'npm', desc: 'Modernes Icon-Set für React', isDev: false },
  { name: 'chart.js', manager: 'npm', desc: 'Diagramme & Visualisierungen', isDev: false },
  { name: 'recharts', manager: 'npm', desc: 'Deklarative React-Chart-Bibliothek', isDev: false },
  { name: 'clsx', manager: 'npm', desc: 'Utility für bedingte CSS-Klassennamen', isDev: false },
  { name: 'tailwind-merge', manager: 'npm', desc: 'Konfliktfreies Mergen von Tailwind-Klassen', isDev: false },
  { name: 'zustand', manager: 'npm', desc: 'Leichtgewichtiges React State Management', isDev: false },
  { name: 'date-fns', manager: 'npm', desc: 'Moderne Datums- & Zeit-Bibliothek', isDev: false },
  { name: 'framer-motion', manager: 'npm', desc: 'Fluid UI & Micro-Animationen', isDev: false },
  { name: 'Newtonsoft.Json', manager: 'nuget', desc: '.NET JSON Serializer & Tools', isDev: false },
  { name: 'Microsoft.EntityFrameworkCore.Sqlite', manager: 'nuget', desc: '.NET EF Core SQLite Provider', isDev: false }
];

export const DependenciesTab: React.FC = () => {
  const [targets, setTargets] = useState<DependencyTarget[]>([]);
  const [selectedTargetPath, setSelectedTargetPath] = useState<string>('');
  const [dependenciesData, setDependenciesData] = useState<DirectoryDependenciesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'production' | 'development' | 'nuget' | 'cargo'>('all');

  const [packageName, setPackageName] = useState('');
  const [packageVersion, setPackageVersion] = useState('');
  const [packageManager, setPackageManager] = useState<'npm' | 'nuget' | 'cargo'>('npm');
  const [isDevDependency, setIsDevDependency] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState<{ success?: boolean; message?: string; output?: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRelinking, setIsRelinking] = useState(false);
  const [updatingPackages, setUpdatingPackages] = useState<Record<string, boolean>>({});
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);

  useEffect(() => {
    loadTargets();
  }, []);

  const loadTargets = async () => {
    try {
      const data = await bridgeApi.getDependencyTargets();
      if (Array.isArray(data) && data.length > 0) {
        setTargets(data);
        const defaultTarget = data[0].path;
        setSelectedTargetPath(defaultTarget);
        loadDependencies(defaultTarget);
      } else {
        const fallbackTarget = 'C:\\_DEV\\dbstudio_bridge\\Shared_Dependencies';
        setTargets([{ id: 'shared', name: '📦 Zentraler Shared Dependencies Store', type: 'global_shared', path: fallbackTarget, subTargets: [] }]);
        setSelectedTargetPath(fallbackTarget);
        loadDependencies(fallbackTarget);
      }
    } catch {
      setIsLoading(false);
    }
  };

  const loadDependencies = async (dirPath: string) => {
    if (!dirPath) return;
    setIsLoading(true);
    setInstallStatus(null);
    try {
      const data = await bridgeApi.getDependencies(dirPath);
      setDependenciesData(data);
    } catch {
      setDependenciesData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstallPackage = async (customPkg?: { name: string; manager: 'npm' | 'nuget' | 'cargo'; isDev?: boolean }) => {
    const nameToInstall = customPkg ? customPkg.name : packageName.trim();
    const managerToUse = customPkg ? customPkg.manager : packageManager;
    const isDevToUse = customPkg ? Boolean(customPkg.isDev) : isDevDependency;
    const versionToUse = customPkg ? '' : packageVersion.trim();

    if (!nameToInstall) return;

    setIsInstalling(true);
    setInstallStatus({ message: `Installiere '${nameToInstall}' via ${managerToUse.toUpperCase()}...` });

    try {
      const res = await bridgeApi.installDependency({
        targetDir: selectedTargetPath,
        packageName: nameToInstall,
        version: versionToUse,
        packageManager: managerToUse,
        isDev: isDevToUse
      });

      setInstallStatus({
        success: res.success,
        message: res.success ? `✓ Paket '${nameToInstall}' erfolgreich installiert!` : `Fehler bei der Installation von '${nameToInstall}'`,
        output: res.output || res.error
      });

      if (res.success) {
        if (!customPkg) {
          setPackageName('');
          setPackageVersion('');
        }
        await loadDependencies(selectedTargetPath);
      }
    } catch (err: any) {
      setInstallStatus({
        success: false,
        message: `Fehler: ${err.message}`
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUpdatePackage = async (pkg: InstalledDependency) => {
    setUpdatingPackages(prev => ({ ...prev, [pkg.name]: true }));
    setInstallStatus({ message: `Aktualisiere '${pkg.name}' (${pkg.manager.toUpperCase()})...` });

    try {
      const res = await bridgeApi.updateDependency({
        targetDir: selectedTargetPath,
        packageName: pkg.name,
        packageManager: pkg.manager,
        isDev: pkg.type === 'development'
      });

      setInstallStatus({
        success: res.success,
        message: res.success ? `✓ '${pkg.name}' erfolgreich aktualisiert!` : `Aktualisierung von '${pkg.name}' fehlgeschlagen`,
        output: res.output || res.error
      });

      if (res.success) {
        await loadDependencies(selectedTargetPath);
      }
    } catch (err: any) {
      setInstallStatus({
        success: false,
        message: `Fehler: ${err.message}`
      });
    } finally {
      setUpdatingPackages(prev => ({ ...prev, [pkg.name]: false }));
    }
  };

  const handleUpdateAll = async () => {
    if (!allDeps.length) return;
    setIsUpdatingAll(true);
    setInstallStatus({ message: `Aktualisiere alle ${allDeps.length} Pakete im Verzeichnis...` });

    try {
      const res = await bridgeApi.updateAllDependencies({
        targetDir: selectedTargetPath
      });

      setInstallStatus({
        success: res.success,
        message: res.success ? `✓ Alle Pakete im Verzeichnis wurden erfolgreich überprüft & aktualisiert.` : `Fehler beim Bulk-Update`,
        output: res.output || res.error
      });

      await loadDependencies(selectedTargetPath);
    } catch (err: any) {
      setInstallStatus({
        success: false,
        message: `Fehler beim Bulk-Update: ${err.message}`
      });
    } finally {
      setIsUpdatingAll(false);
    }
  };

  const handleUninstall = async (pkg: InstalledDependency) => {
    if (!confirm(`Möchten Sie das Paket '${pkg.name}' wirklich deinstallieren?`)) return;

    setIsInstalling(true);
    setInstallStatus({ message: `Deinstalliere '${pkg.name}'...` });

    try {
      const res = await bridgeApi.uninstallDependency({
        targetDir: selectedTargetPath,
        packageName: pkg.name,
        packageManager: pkg.manager
      });

      setInstallStatus({
        success: res.success,
        message: res.success ? `✓ Paket '${pkg.name}' erfolgreich deinstalliert.` : `Fehler beim Deinstallieren`,
        output: res.output || res.error
      });

      if (res.success) {
        await loadDependencies(selectedTargetPath);
      }
    } catch (err: any) {
      setInstallStatus({
        success: false,
        message: `Fehler: ${err.message}`
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleRestoreAll = async () => {
    setIsRestoring(true);
    setInstallStatus({ message: 'Führe Restore aller Pakete im Verzeichnis aus...' });
    try {
      const res = await bridgeApi.restoreDependencies({ targetDir: selectedTargetPath });
      setInstallStatus({
        success: res.success,
        message: res.success ? '✓ Alle Dependencies erfolgreich wiederhergestellt.' : 'Fehler beim Wiederherstellen',
        output: res.output || res.error
      });
      await loadDependencies(selectedTargetPath);
    } catch (err: any) {
      setInstallStatus({ success: false, message: `Fehler: ${err.message}` });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRelink = async () => {
    setIsRelinking(true);
    try {
      const res = await bridgeApi.relinkNodeModules(selectedTargetPath);
      setInstallStatus({
        success: res.success,
        message: res.success ? '✓ Shared node_modules Symlink erfolgreich verknüpft.' : 'Fehler beim Verknüpfen'
      });
      await loadDependencies(selectedTargetPath);
    } catch (err: any) {
      setInstallStatus({ success: false, message: `Fehler: ${err.message}` });
    } finally {
      setIsRelinking(false);
    }
  };

  const getDocUrl = (name: string, mgr: string) => {
    if (mgr === 'nuget') return `https://www.nuget.org/packages/${name}`;
    if (mgr === 'cargo') return `https://crates.io/crates/${name}`;
    return `https://www.npmjs.com/package/${name}`;
  };

  const allDeps: InstalledDependency[] = [];
  if (dependenciesData?.npm) {
    allDeps.push(...(dependenciesData.npm.dependencies || []), ...(dependenciesData.npm.devDependencies || []));
  }
  if (dependenciesData?.nuget) {
    allDeps.push(...(dependenciesData.nuget.packages || []));
  }
  if (dependenciesData?.cargo) {
    allDeps.push(...(dependenciesData.cargo.crates || []));
  }

  const filteredDeps = allDeps.filter((dep) => {
    const matchesSearch = dep.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'production') return dep.type === 'production';
    if (filterType === 'development') return dep.type === 'development';
    if (filterType === 'nuget') return dep.manager === 'nuget';
    if (filterType === 'cargo') return dep.manager === 'cargo';
    return true;
  });

  const isSharedStore = selectedTargetPath.toLowerCase().includes('shared_dependencies');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Hero Banner */}
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 glow-emerald">
                <Boxes className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 font-heading">
                Pakete & Dependency-Verwaltung
                <span className="text-xs font-mono uppercase bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 font-semibold">
                  Offline & Extensible
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
              Verwalten und installieren Sie zusätzliche npm-Pakete, .NET NuGet-Libraries und Cargo Crates für Ihre Projekte oder den zentralen Shared Store.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => loadDependencies(selectedTargetPath)}
              disabled={isLoading}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#0b1326] dark:hover:bg-[#1a243a] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
              title="Aktualisieren"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
              <span>Aktualisieren</span>
            </button>
            <button
              onClick={handleUpdateAll}
              disabled={isUpdatingAll || isLoading}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              title="Alle Pakete in diesem Verzeichnis mit 1 Klick auf die neueste Version aktualisieren"
            >
              <ArrowUpCircle className={`w-3.5 h-3.5 ${isUpdatingAll ? 'animate-spin' : ''}`} />
              <span>{isUpdatingAll ? 'Aktualisiere...' : '1-Klick Update (Alle)'}</span>
            </button>
            <button
              onClick={handleRestoreAll}
              disabled={isRestoring || isLoading}
              className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
              title="Alle Dependencies im Ordner neu installieren / reparieren"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
              <span>{isRestoring ? 'Wiederherstellen...' : 'Alle Restore / Sync'}</span>
            </button>
            {!isSharedStore && (
              <button
                onClick={handleRelink}
                disabled={isRelinking}
                className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                title="Windows-Junction / Symlink zu Shared_Dependencies erneuern"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>{isRelinking ? 'Verknüpfe...' : 'Symlink reparieren'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Target Selector & Environment Overview Card */}
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Aktives Ziel / Verzeichnis auswählen
            </label>
            <select
              value={selectedTargetPath}
              onChange={(e) => {
                setSelectedTargetPath(e.target.value);
                loadDependencies(e.target.value);
              }}
              className="w-full bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-xl px-3.5 py-2.5 font-mono focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
            >
              {targets.map((t) => (
                <React.Fragment key={t.id}>
                  <option value={t.path}>{t.name} ({t.path})</option>
                  {t.subTargets?.map((st) => (
                    <option key={st.id} value={st.fullPath}>
                      &nbsp;&nbsp;↳ {st.name} ({st.subPath})
                    </option>
                  ))}
                </React.Fragment>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end pt-2">
            <div className="bg-slate-50 dark:bg-[#0b1326] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono shadow-inner">
              <span className="text-slate-500">Gefundene Pakete: </span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{allDeps.length}</strong>
            </div>

            {dependenciesData?.npm?.isSymlinked && (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/30 text-xs font-mono text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 shadow-sm">
                <Link2 className="w-3.5 h-3.5" />
                <span>Shared Store verknüpft</span>
              </div>
            )}
          </div>
        </div>

        {/* Selected Path Badge */}
        <div className="bg-slate-50 dark:bg-[#0b1326] p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2 truncate shadow-inner">
          <span className="truncate">📂 Aktiver Pfad: <strong className="text-slate-800 dark:text-slate-200 font-bold">{selectedTargetPath}</strong></span>
          <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-[#171f33] border border-slate-300 dark:border-slate-700 shrink-0 font-semibold">
            {isSharedStore ? 'Zentraler Store' : 'Lokales Projekt'}
          </span>
        </div>
      </div>
    </div>
  );
};
