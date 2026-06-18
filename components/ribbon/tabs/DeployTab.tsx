import React from 'react';
import { Settings, Play, Download, AppWindow, Server, UploadCloud, CircuitBoard, CloudLightning, Radio } from 'lucide-react';
import { BackendConfig, DbType, FrontendFramework } from '../../../types/index';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';

interface DeployTabProps {
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
        default: return 3000;
    }
};

export const DeployTab: React.FC<DeployTabProps> = ({ onAction, backendConfig, setBackendConfig, onOpenSettings }) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-4 items-start h-full">
        {/* Settings Group */}
        <div className="flex flex-col px-2 border-r border-slate-300 pr-4 h-full justify-between py-1">
           <div className="flex gap-2">
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

             <div className="w-24">
                <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Backend</label>
                <select 
                    className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs bg-white"
                    value={backendConfig.language}
                    onChange={e => {
                        const lang = e.target.value as any;
                        const updatedConfig = { ...backendConfig, language: lang };
                        if (lang === 'electron') {
                            updatedConfig.deploymentConfig = {
                                ...(backendConfig.deploymentConfig || { target: 'electron' }),
                                target: 'electron'
                            };
                        } else if (backendConfig.language === 'electron') {
                            if (backendConfig.deploymentConfig?.target === 'electron') {
                                updatedConfig.deploymentConfig = {
                                    ...backendConfig.deploymentConfig,
                                    target: 'docker'
                                };
                            }
                        }
                        setBackendConfig(updatedConfig);
                    }}
                >
                    <option value="dotnet">.NET API</option>
                    <option value="nodejs">Node.js</option>
                    <option value="php">PHP</option>
                    <option value="laravel">Laravel</option>
                    <option value="electron">Electron</option>
                </select>
             </div>

             {backendConfig.language === 'dotnet' && (
                 <div className="w-16 animate-in fade-in slide-in-from-left-1">
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Version</label>
                    <select 
                        className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs bg-white font-mono text-blue-700"
                        value={backendConfig.backendVersion || '9.0'}
                        onChange={e => setBackendConfig({ ...backendConfig, backendVersion: e.target.value })}
                        title="Wähle die installierte .NET SDK Version"
                    >
                        <option value="10.0">10.0</option>
                        <option value="9.0">9.0</option>
                        <option value="8.0">8.0 (LTS)</option>
                        <option value="7.0">7.0</option>
                        <option value="6.0">6.0 (LTS)</option>
                    </select>
                 </div>
             )}

             <div className="w-24">
                <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Frontend</label>
                <select 
                    className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs bg-white"
                    value={backendConfig.frontendFramework}
                    onChange={e => {
                        const fw = e.target.value as FrontendFramework;
                        const updatedConfig = { 
                            ...backendConfig, 
                            frontendFramework: fw,
                            frontendPort: getDefaultPort(fw)
                        };
                        setBackendConfig(updatedConfig);
                    }}
                >
                    <option value="react">React</option>
                    <option value="vue">Vue.js</option>
                    <option value="angular">Angular</option>
                    <option value="blazor">Blazor (WASM)</option>
                    <option value="none">Keins (Nur API)</option>
                </select>
             </div>

             <div className="w-24">
                <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Styling</label>
                <select 
                    className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs bg-white"
                    value={backendConfig.stylingFramework || 'tailwind'}
                    onChange={e => {
                        const fw = e.target.value as any;
                        setBackendConfig({ ...backendConfig, stylingFramework: fw });
                    }}
                >
                    <option value="tailwind">Tailwind CSS</option>
                    <option value="bootstrap">Bootstrap</option>
                    <option value="none">Keins / Custom</option>
                </select>
             </div>

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
           <span className="text-[10px] text-slate-500 mt-auto uppercase tracking-wider self-center">Generator Settings</span>
        </div>

        {/* Extensions Group */}
        <RibbonGroup label="Extensions">
            <RibbonButton 
                icon={<CircuitBoard className="text-purple-600" />} 
                label="Integrations Hub" 
                onClick={() => onAction('open_integrations')} 
                size="large"
            />
            <div className="flex flex-col gap-1">
                <button onClick={() => onAction('open_integrations')} className="text-[10px] text-left px-2 py-1 hover:bg-slate-200 rounded flex items-center gap-2 text-slate-600">
                    <CloudLightning size={12}/> AI & LLM
                </button>
                <button onClick={() => onAction('open_integrations')} className="text-[10px] text-left px-2 py-1 hover:bg-slate-200 rounded flex items-center gap-2 text-slate-600">
                    <Radio size={12}/> Chat / Realtime
                </button>
            </div>
        </RibbonGroup>

        {/* Cloud Group */}
        <RibbonGroup label="Cloud & DevOps">
            <RibbonButton icon={<Server className="text-teal-600" />} label="Umgebungen" onClick={() => onAction('open_envs')} />
            <RibbonButton icon={<UploadCloud className="text-indigo-600" />} label="Deployment" onClick={() => onAction('open_deployment_modal')} />
        </RibbonGroup>

        {/* Export Group */}
        <RibbonGroup label="Export" isLast>
            <RibbonButton icon={<Play className="text-green-600"/>} label="Live-Preview" onClick={() => onAction('backend_generate')} />
            <RibbonButton icon={<Download className="text-slate-600"/>} label="App als ZIP" onClick={() => onAction('backend_export')} />
        </RibbonGroup>
    </div>
  );
};
