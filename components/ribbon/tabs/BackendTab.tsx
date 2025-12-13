
import React from 'react';
import { Settings, Play, Download } from 'lucide-react';
import { BackendConfig, DbType, FrontendFramework } from '../../../types/index';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';

interface BackendTabProps {
  onAction: (action: string) => void;
  backendConfig: BackendConfig;
  setBackendConfig: (config: BackendConfig) => void;
  onOpenSettings: () => void;
}

export const BackendTab: React.FC<BackendTabProps> = ({ onAction, backendConfig, setBackendConfig, onOpenSettings }) => {
  return (
    <div className="flex gap-4 items-start h-full">
        {/* Settings Group */}
        <div className="flex flex-col px-2 border-r border-slate-300 pr-4 h-full justify-between py-1">
           <div className="flex gap-2">
             <div className="w-36">
                <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Backend Stack</label>
                <select 
                    className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs bg-white"
                    value={backendConfig.language === 'dotnet' ? `dotnet-${backendConfig.backendVersion || '9.0'}` : backendConfig.language}
                    onChange={e => {
                        const val = e.target.value;
                        if (val.startsWith('dotnet-')) {
                            const ver = val.replace('dotnet-', '');
                            setBackendConfig({ ...backendConfig, language: 'dotnet', backendVersion: ver });
                        } else {
                            setBackendConfig({ ...backendConfig, language: val as any });
                        }
                    }}
                >
                    <option value="dotnet-9.0">.NET 9 (Standard)</option>
                    <option value="dotnet-8.0">.NET 8 (LTS)</option>
                    <option value="dotnet-10.0">.NET 10 (Preview)</option>
                    <option value="nodejs">Node.js (Express)</option>
                    <option value="laravel">PHP (Laravel)</option>
                    <option value="php">PHP (Native)</option>
                </select>
             </div>
             <div className="w-20">
                <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Port</label>
                 <input 
                    type="number" 
                    className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs"
                    value={backendConfig.port}
                    onChange={e => setBackendConfig({ ...backendConfig, port: parseInt(e.target.value) })}
                />
             </div>
           </div>
           <div className="w-full">
                <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Projekt Name</label>
                <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs"
                    value={backendConfig.projectName}
                    onChange={e => setBackendConfig({ ...backendConfig, projectName: e.target.value })}
                />
           </div>
           <span className="text-[10px] text-slate-500 mt-auto uppercase tracking-wider self-center">Einstellungen</span>
        </div>

        {/* Database Config Group */}
        <div className="flex flex-col px-2 border-r border-slate-300 pr-4 h-full py-1 w-40">
            <div className="mb-2">
                <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Datenbank</label>
                <select 
                    className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs bg-white"
                    value={backendConfig.dbType}
                    onChange={e => setBackendConfig({ ...backendConfig, dbType: e.target.value as DbType })}
                >
                    <option value="SQL">SQL Server</option>
                    <option value="MySQL">MySQL</option>
                    <option value="SQLite">SQLite</option>
                    <option value="NoSQL">NoSQL</option>
                </select>
            </div>
            <button 
                onClick={onOpenSettings}
                className="flex items-center justify-center gap-1 w-full bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300 rounded px-2 py-1 text-xs"
            >
                <Settings size={12} />
                Konfigurieren
            </button>
            <span className="text-[10px] text-slate-500 mt-auto uppercase tracking-wider self-center">Datenbank</span>
        </div>
        
        {/* Features Group */}
        <div className="flex flex-col px-2 border-r border-slate-300 pr-4 h-full py-1 w-32">
            <div className="flex flex-col gap-1 mb-1">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                    <input type="checkbox" checked={backendConfig.useSwagger} onChange={e => setBackendConfig({...backendConfig, useSwagger: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500 h-3 w-3" />
                    Swagger
                </label>
                <div className="mt-1">
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Frontend</label>
                    <select 
                        className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs bg-white"
                        value={backendConfig.frontendFramework}
                        onChange={e => setBackendConfig({ ...backendConfig, frontendFramework: e.target.value as FrontendFramework })}
                    >
                        <option value="none">Keines</option>
                        <option value="blazor">Blazor (WASM)</option>
                        <option value="angular">Angular</option>
                        <option value="react">React (Vite)</option>
                    </select>
                </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-auto uppercase tracking-wider self-center">Features</span>
        </div>

        {/* Actions Group */}
        <RibbonGroup label="Ausführen">
            <RibbonButton icon={<Play className="text-green-600"/>} label="Generieren" onClick={() => onAction('backend_generate')} size="large" />
        </RibbonGroup>
        
        <RibbonGroup label="Export" isLast>
            <RibbonButton icon={<Download />} label="Download ZIP" onClick={() => onAction('backend_export')} />
        </RibbonGroup>
    </div>
  );
};
