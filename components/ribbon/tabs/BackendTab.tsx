
import React from 'react';
import { Settings, Play, Download, AppWindow } from 'lucide-react';
import { BackendConfig, DbType, FrontendFramework } from '../../../types/index';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';

interface BackendTabProps {
  onAction: (action: string) => void;
  backendConfig: BackendConfig;
  setBackendConfig: (config: BackendConfig) => void;
  onOpenSettings: () => void;
}

const getDefaultPort = (framework: FrontendFramework): number => {
    switch (framework) {
        case 'angular': return 4200;
        case 'vue': return 5173;
        case 'blazor': return 5002;
        default: return 3000; // react, electron, none
    }
};

export const BackendTab: React.FC<BackendTabProps> = ({ onAction, backendConfig, setBackendConfig, onOpenSettings }) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-4 items-start h-full">
        {/* Settings Group */}
        <div className="flex flex-col px-2 border-r border-slate-300 pr-4 h-full justify-between py-1">
           <div className="flex gap-2">
             {/* 1. Database (Foundation) */}
             <div className="w-24">
                <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Datenbank</label>
                <select 
                    className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs bg-white"
                    value={backendConfig.dbType}
                    onChange={e => setBackendConfig({ ...backendConfig, dbType: e.target.value as DbType })}
                >
                    <option value="SQL">SQL Server</option>
                    <option value="MySQL">MySQL</option>
                    <option value="SQLite">SQLite</option>
                    <option value="NoSQL">NoSQL (Mongo)</option>
                </select>
             </div>

             {/* 2. Backend (Logic) */}
             <div className="w-24">
                <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Backend</label>
                <select 
                    className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs bg-white"
                    value={backendConfig.language}
                    onChange={e => setBackendConfig({ ...backendConfig, language: e.target.value as any })}
                >
                    <option value="dotnet">.NET API</option>
                    <option value="nodejs">Node.js</option>
                    <option value="php">PHP</option>
                    <option value="laravel">Laravel</option>
                    <option value="electron">Electron</option>
                </select>
             </div>

             {/* 2.1 .NET Version Selector (Conditional) */}
             {backendConfig.language === 'dotnet' && (
                 <div className="w-16 animate-in fade-in slide-in-from-left-1">
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Version</label>
                    <select 
                        className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs bg-white font-mono text-blue-700"
                        value={backendConfig.backendVersion || '9.0'}
                        onChange={e => setBackendConfig({ ...backendConfig, backendVersion: e.target.value })}
                        title="Wähle die installierte .NET SDK Version"
                    >
                        <option value="9.0">9.0</option>
                        <option value="8.0">8.0 (LTS)</option>
                        <option value="7.0">7.0</option>
                        <option value="6.0">6.0 (LTS)</option>
                    </select>
                 </div>
             )}

             {/* 3. Frontend (UI) */}
             <div className="w-24">
                <label className="block text--[10px] text-slate-500 font-bold mb-0.5">Frontend</label>
                <select 
                    className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs bg-white"
                    value={backendConfig.frontendFramework}
                    onChange={e => {
                        const fw = e.target.value as FrontendFramework;
                        setBackendConfig({ 
                            ...backendConfig, 
                            frontendFramework: fw,
                            frontendPort: getDefaultPort(fw)
                        });
                    }}
                >
                    <option value="react">React</option>
                    <option value="vue">Vue.js</option>
                    <option value="angular">Angular</option>
                    <option value="blazor">Blazor (WASM)</option>
                    <option value="none">Keins (Nur API)</option>
                </select>
             </div>

             {/* 4. Ports */}
             <div className="w-20 flex flex-col gap-1">
                <div className="flex gap-1 items-center">
                    <label className="text-[9px] text-slate-500 font-bold w-6">API:</label>
                    <input 
                        type="number" 
                        className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs bg-white"
                        value={backendConfig.port}
                        onChange={e => setBackendConfig({ ...backendConfig, port: parseInt(e.target.value) || 5000 })}
                        title="Backend Port (Localhost)"
                    />
                </div>
                <div className="flex gap-1 items-center">
                    <label className="text-[9px] text-slate-500 font-bold w-6">Web:</label>
                    <input 
                        type="number" 
                        className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs bg-white"
                        value={backendConfig.frontendPort || 3000}
                        onChange={e => setBackendConfig({ ...backendConfig, frontendPort: parseInt(e.target.value) || 3000 })}
                        title="Frontend Port (Localhost)"
                    />
                </div>
             </div>
           </div>
           
           <div className="flex gap-2 mt-1">
               <button 
                    onClick={onOpenSettings}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300 rounded px-2 py-0.5 text-xs flex items-center justify-center gap-1"
                >
                    <Settings size={12} /> Connection String
                </button>
               {backendConfig.language === 'electron' && (
                    <button 
                        onClick={() => onAction('electron_settings')}
                        className="flex-1 bg-teal-100 hover:bg-teal-200 text-teal-800 border border-teal-300 rounded px-2 py-0.5 text-xs flex items-center justify-center gap-1"
                    >
                        <AppWindow size={12} /> Config
                    </button>
               )}
           </div>
           <span className="text-[10px] text-slate-500 mt-auto uppercase tracking-wider self-center">{t('ribbon.groups.settings')}</span>
        </div>

        {/* Actions Group */}
        <RibbonGroup label={t('ribbon.groups.actions')}>
            <RibbonButton icon={<Play className="text-green-600"/>} label={t('ribbon.actions.generate')} onClick={() => onAction('backend_generate')} size="large" />
        </RibbonGroup>
        
        {/* Source Download Group */}
        <RibbonGroup label={t('ribbon.groups.export')} isLast>
            <RibbonButton icon={<Download />} label={t('ribbon.actions.download_zip')} onClick={() => onAction('backend_export')} />
        </RibbonGroup>
    </div>
  );
};
