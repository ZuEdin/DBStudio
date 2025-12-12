import React, { useState } from 'react';
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
  PlusSquare,
  Trash
} from 'lucide-react';

interface RibbonProps {
  onAction: (action: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentDbType: string;
}

export const Ribbon: React.FC<RibbonProps> = ({ onAction, activeTab, setActiveTab, currentDbType }) => {
  const [showQueryDropdown, setShowQueryDropdown] = useState(false);
  const [showActionQueryDropdown, setShowActionQueryDropdown] = useState(false);

  return (
    <div className="flex flex-col bg-slate-100 border-b border-slate-300 select-none">
      {/* Tab Headers */}
      <div className="flex bg-slate-800 text-white pt-1 px-2 gap-1">
        <button 
          onClick={() => setActiveTab('file')}
          className={`px-4 py-1 rounded-t-lg text-sm ${activeTab === 'file' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
        >
          Datei
        </button>
        <button 
          onClick={() => setActiveTab('create')}
          className={`px-4 py-1 rounded-t-lg text-sm ${activeTab === 'create' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
        >
          Erstellen
        </button>
        <button 
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-1 rounded-t-lg text-sm ${activeTab === 'tools' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
        >
          Datenbanktools
        </button>
      </div>

      {/* Tab Content */}
      <div className="h-28 px-4 flex items-center gap-2 overflow-x-auto shadow-inner bg-slate-50">
        
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
                <RibbonButton icon={<Wand2 className="text-teal-600" />} label="Abfrage-Assistent" onClick={() => onAction('query_wizard')} />
                 <div className="relative" onMouseLeave={() => setShowActionQueryDropdown(false)}>
                    <RibbonButton icon={<ChevronDown/>} label="Aktionsabfragen" onClick={() => setShowActionQueryDropdown(p => !p)} />
                    {showActionQueryDropdown && (
                      <div className="absolute top-full left-0 bg-white shadow-lg border rounded z-10 text-sm w-40">
                         <button onClick={() => { onAction('create_append_query'); setShowActionQueryDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100"><PlusSquare size={14} /> Anfügeabfrage</button>
                         <button onClick={() => { onAction('create_delete_query'); setShowActionQueryDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100"><Trash size={14} /> Löschabfrage</button>
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

        {activeTab === 'tools' && (
          <div className="flex gap-4">
            <div className="flex flex-col items-center px-2">
              <RibbonButton icon={<Network />} label="Beziehungen" onClick={() => onAction('relationships')} size="large" />
              <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Beziehungen</span>
            </div>
          </div>
        )}
      </div>
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