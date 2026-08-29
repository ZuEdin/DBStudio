import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  FolderGit2, 
  Sparkles, 
  Package, 
  Play, 
  FolderOpen, 
  RotateCw, 
  Plus,
  Globe,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { bridgeApi } from '../../services/bridgeApi';
import { LocalProject } from '../../types/bridge';

export const WorkspacesTab: React.FC = () => {
  const [workspacePath, setWorkspacePath] = useState('C:\\_DEV\\dbstudio_bridge\\Projects');
  const [savedProjects, setSavedProjects] = useState<LocalProject[]>([]);
  const [cleanBuildOnDeploy, setCleanBuildOnDeploy] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [iconSyncStatus, setIconSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const settings = await bridgeApi.getSettings();
      if (settings?.projectsDir) {
        setWorkspacePath(settings.projectsDir);
      }
      const projects = await bridgeApi.getProjects();
      setSavedProjects(projects);
    } catch {
      // Fallback
    }
  };

  const handleSave = async () => {
    try {
      const current = await bridgeApi.getSettings();
      await bridgeApi.saveSettings({
        ...current,
        projectsDir: workspacePath
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      loadData();
    } catch {
      // Fallback
    }
  };

  const handleOpenFolder = async (folderPath: string) => {
    await bridgeApi.openPackageFolder(folderPath);
  };

  const handleSyncIcons = async () => {
    setIconSyncStatus('Prüfe...');
    try {
      const res = await bridgeApi.syncTauriIcons();
      setIconSyncStatus(res.success ? 'Icons verifiziert' : 'Fehler');
      setTimeout(() => setIconSyncStatus(null), 3000);
    } catch {
      setIconSyncStatus('Fehler');
      setTimeout(() => setIconSyncStatus(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">Projekt- & Workspace-Verzeichnis</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Geben Sie den lokalen Ordner an, in den empfangene Projekte extrahiert und ausgeführt werden.</p>
            </div>
          </div>

          <button
            onClick={handleSyncIcons}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0b1326] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded-xl"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>{iconSyncStatus || 'Icons prüfen'}</span>
          </button>
        </div>

        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Standard-Speicherort</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={workspacePath}
                onChange={(e) => setWorkspacePath(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <button 
                onClick={handleSave}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shrink-0"
              >
                {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{isSaved ? 'Gespeichert!' : 'Speichern'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {savedProjects.map((proj) => (
          <div key={proj.id} className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{proj.name}</h4>
              <span className="text-[10px] font-mono bg-emerald-50 dark:bg-[#0b1326] text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-slate-700">
                {proj.framework}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{proj.path}</p>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => bridgeApi.launchProject(proj.id)}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Starten</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
