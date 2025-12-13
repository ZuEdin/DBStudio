
import React, { useState, useEffect } from 'react';
import { 
  Table as TableIcon, 
  Search, 
  FileText, 
  Layout, 
  Network, 
  Wand2, 
  Database,
  Save,
  ChevronDown,
  ChevronUp,
  PlusSquare,
  Trash,
  Copy,
  Unlink,
  Type,
  Box,
  Columns,
  Download,
  Server,
  Code,
  Settings,
  Play
} from 'lucide-react';
import { ViewType, BackendConfig, DbType, FrontendFramework } from '../types/index';
import { ConnectionSettingsModal } from './ConnectionSettingsModal';

interface RibbonProps {
  onAction: (action: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentDbType: string;
  currentView: ViewType;
  isOpen: boolean;
  toggleRibbon: () => void;
  backendConfig?: BackendConfig;
  setBackendConfig?: (config: BackendConfig) => void;
}

export const Ribbon: React.FC<RibbonProps> = ({ onAction, activeTab, setActiveTab, currentDbType, currentView, isOpen, toggleRibbon, backendConfig, setBackendConfig }) => {
  const [showQueryDropdown, setShowQueryDropdown] = useState(false);
  const [showActionQueryDropdown, setShowActionQueryDropdown] = useState(false);
  const [showWizardDropdown, setShowWizardDropdown] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  // Automatisch zum Kontext-Tab wechseln, wenn im Formular-Designer
  useEffect(() => {
    if (currentView.type === 'form_designer') {
      setActiveTab('form_design');
    }
  }, [currentView.type, setActiveTab]);

  return (
    <div className="flex flex-col bg-slate-100 border-b border-slate-300 select-none relative z-20 transition-all duration-300 print:hidden">
      {/* Tab Headers and Toggle */}
      <div className="flex bg-slate-800 text-white pt-1 px-2 gap-1 overflow-x-auto items-end justify-between">
        <div className="flex gap-1">
            <button 
            onClick={() => setActiveTab('file')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap ${activeTab === 'file' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            Datei
            </button>
            <button 
            onClick={() => setActiveTab('create')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap ${activeTab === 'create' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            Erstellen
            </button>
            <button 
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap ${activeTab === 'tools' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            Datenbanktools
            </button>
            <button 
            onClick={() => setActiveTab('backend')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap border-t-2 border-green-500 ${activeTab === 'backend' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            Backend & API
            </button>
            
            {/* Context Tab: Form Design */}
            {currentView.type === 'form_designer' && (
            <button 
                onClick={() => setActiveTab('form_design')}
                className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap border-t-2 border-indigo-500 ${activeTab === 'form_design' ? 'bg-slate-100 text-slate-900 font-semibold' : 'bg-indigo-900 hover:bg-indigo-800'}`}
            >
                Formular-Entwurf
            </button>
            )}
        </div>
        
        <button onClick={toggleRibbon} className="text-slate-400 hover:text-white px-2 py-1" title={isOpen ? "Menüband minimieren" : "Menüband erweitern"}>
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Tab Content */}
      {isOpen && (
        <div className="h-28 px-4 flex items-center gap-2 overflow-visible shadow-inner bg-slate-50 animate-in fade-in slide-in-from-top-2 duration-200">
            
            {activeTab === 'file' && (
            <div className="flex gap-4">
                <div className="flex flex-col items-center group cursor-pointer p-2 hover:bg-slate-200 rounded" onClick={() => onAction('new_db')}>
                <Database className="w-8 h-8 text-blue-600 mb-1" />
                <span className="text-xs">Neue DB</span>
                </div>
                <div className="flex flex-col items-center group cursor-pointer p-2 hover:bg-slate-200 rounded" onClick={() => onAction('save')}>
                <Save className="w-8 h-8 text-green-600 mb-1" />
                <span className="text-xs">Speichern</span>
                </div>
                <div className="border-l border-slate-300 mx-2 h-16"></div>
                <div className="flex flex-col justify-center text-sm text-slate-600">
                <span className="font-bold">Aktuelle DB:</span>
                <span>{currentDbType}</span>
                </div>
            </div>
            )}

            {activeTab === 'create' && (
            <div className="flex gap-1">
                {/* Tables Group */}
                <div className="flex flex-col items-center px-2 border-r border-slate-300 pr-4">
                <div className="flex gap-2">
                    <RibbonButton icon={<TableIcon />} label="Tabelle" onClick={() => onAction('create_table')} />
                    <RibbonButton icon={<Wand2 className="text-purple-600" />} label="AI-Assistent" onClick={() => onAction('create_table_ai')} />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Tabellen</span>
                </div>

                {/* Queries Group */}
                <div className="flex flex-col items-center px-2 border-r border-slate-300 pr-4">
                <div className="flex gap-2">
                    <RibbonButton icon={<Search />} label="Abfrageentwurf" onClick={() => onAction('create_query')} />
                    
                    {/* Wizards Dropdown */}
                    <div className="relative" onMouseLeave={() => setShowWizardDropdown(false)}>
                        <RibbonButton icon={<Wand2 className="text-teal-600" />} label="Assistenten" onClick={() => setShowWizardDropdown(p => !p)} />
                        {showWizardDropdown && (
                        <div className="absolute top-full left-0 bg-white shadow-lg border rounded z-50 text-sm w-48 mt-1">
                            <button onClick={() => { onAction('wizard_duplicate'); setShowWizardDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 text-left"><Copy size={14} /> Duplikatsuche</button>
                            <button onClick={() => { onAction('wizard_inconsistency'); setShowWizardDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 text-left"><Unlink size={14} /> Inkonsistenzsuche</button>
                        </div>
                        )}
                    </div>

                    {/* Action Queries Dropdown */}
                    <div className="relative" onMouseLeave={() => setShowActionQueryDropdown(false)}>
                        <RibbonButton icon={<ChevronDown/>} label="Aktionsabfragen" onClick={() => setShowActionQueryDropdown(p => !p)} />
                        {showActionQueryDropdown && (
                        <div className="absolute top-full left-0 bg-white shadow-lg border rounded z-50 text-sm w-40 mt-1">
                            <button onClick={() => { onAction('create_append_query'); setShowActionQueryDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 text-left"><PlusSquare size={14} /> Anfügeabfrage</button>
                            <button onClick={() => { onAction('create_delete_query'); setShowActionQueryDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 text-left"><Trash size={14} /> Löschabfrage</button>
                        </div>
                        )}
                    </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Abfragen</span>
                </div>

                {/* Forms Group */}
                <div className="flex flex-col items-center px-2 border-r border-slate-300 pr-4">
                <RibbonButton icon={<Layout />} label="Formular" onClick={() => onAction('create_form')} />
                <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Formulare</span>
                </div>

                {/* Reports Group */}
                <div className="flex flex-col items-center px-2">
                <RibbonButton icon={<FileText />} label="Bericht" onClick={() => onAction('create_report')} />
                <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Berichte</span>
                </div>
            </div>
            )}

            {activeTab === 'form_design' && (
            <div className="flex gap-4">
                {/* Controls Group */}
                <div className="flex flex-col items-center px-2 border-r border-slate-300 pr-4">
                    <div className="flex gap-2">
                    <RibbonButton icon={<Type />} label="Label" onClick={() => onAction('form_add_label')} />
                    <RibbonButton icon={<Box />} label="Container" onClick={() => onAction('form_add_container')} />
                    <RibbonButton icon={<Columns />} label="Spalten (2)" onClick={() => onAction('form_add_2col')} />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Steuerelemente</span>
                </div>
                
                {/* Tools */}
                <div className="flex flex-col items-center px-2">
                <RibbonButton icon={<Download />} label="Export" onClick={() => onAction('export_form')} />
                    <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Daten</span>
                </div>
            </div>
            )}

            {activeTab === 'tools' && (
            <div className="flex gap-4">
                <div className="flex flex-col items-center px-2">
                <RibbonButton icon={<Network />} label="Beziehungen" onClick={() => onAction('relationships')} size="large" />
                <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Beziehungen</span>
                </div>
            </div>
            )}

            {activeTab === 'backend' && backendConfig && setBackendConfig && (
            <div className="flex gap-4 items-start">
                {/* Settings Group */}
                <div className="flex flex-col px-2 border-r border-slate-300 pr-4 h-24 justify-between py-1">
                   <div className="flex gap-2">
                     <div className="w-32">
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Backend Stack</label>
                        <select 
                            className="w-full border border-slate-300 rounded px-1 py-0.5 text-xs bg-white"
                            value={backendConfig.language}
                            onChange={e => setBackendConfig({ ...backendConfig, language: e.target.value as any })}
                        >
                            <option value="dotnet">.NET 8 (C#)</option>
                            <option value="nodejs">Node.js (Express)</option>
                            <option value="php">PHP (Raw)</option>
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
                <div className="flex flex-col px-2 border-r border-slate-300 pr-4 h-24 py-1 w-40">
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
                        onClick={() => setShowConnectionModal(true)}
                        className="flex items-center justify-center gap-1 w-full bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300 rounded px-2 py-1 text-xs"
                    >
                        <Settings size={12} />
                        Konfigurieren
                    </button>
                    <span className="text-[10px] text-slate-500 mt-auto uppercase tracking-wider self-center">Datenbank</span>
                </div>
                
                {/* Features Group */}
                <div className="flex flex-col px-2 border-r border-slate-300 pr-4 h-24 py-1 w-32">
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
                                <option value="angular">Angular</option>
                                <option value="react">React (Vite)</option>
                            </select>
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-auto uppercase tracking-wider self-center">Features</span>
                </div>

                {/* Actions Group */}
                <div className="flex flex-col items-center px-2 border-r border-slate-300 pr-4">
                    <RibbonButton icon={<Play className="text-green-600"/>} label="Generieren" onClick={() => onAction('backend_generate')} size="large" />
                    <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Ausführen</span>
                </div>
                 <div className="flex flex-col items-center px-2">
                    <RibbonButton icon={<Download />} label="Download ZIP" onClick={() => onAction('backend_export')} />
                    <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Export</span>
                </div>
            </div>
            )}
        </div>
      )}

      {/* Connection Modal */}
      {showConnectionModal && backendConfig && setBackendConfig && (
          <ConnectionSettingsModal 
            dbType={backendConfig.dbType}
            currentConnectionString={backendConfig.dbConnection}
            onSave={(newConn) => setBackendConfig({...backendConfig, dbConnection: newConn})}
            onClose={() => setShowConnectionModal(false)}
          />
      )}
    </div>
  );
};

const RibbonButton = ({ icon, label, onClick, size = 'normal' }: { icon: React.ReactNode, label: string, onClick: () => void, size?: 'normal' | 'large' }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 rounded hover:bg-sky-100 hover:text-sky-900 transition-colors ${size === 'large' ? 'w-20' : 'w-16'}`}
  >
    <div className={`${size === 'large' ? 'scale-150 mb-2' : 'mb-1'}`}>
      {icon}
    </div>
    <span className="text-xs text-center leading-tight">{label}</span>
  </button>
);
