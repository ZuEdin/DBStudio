
import React, { useState } from 'react';
import { Table as TableIcon, Search, FileText, Layout, Wand2, Copy, Unlink, ChevronDown, PlusSquare, Trash } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';

interface CreateTabProps {
  onAction: (action: string) => void;
}

export const CreateTab: React.FC<CreateTabProps> = ({ onAction }) => {
  const [showWizardDropdown, setShowWizardDropdown] = useState(false);
  const [showActionQueryDropdown, setShowActionQueryDropdown] = useState(false);

  return (
    <div className="flex gap-1 h-full">
      {/* Tables Group */}
      <RibbonGroup label="Tabellen">
        <RibbonButton icon={<TableIcon />} label="Tabelle" onClick={() => onAction('create_table')} />
        <RibbonButton icon={<Wand2 className="text-purple-600" />} label="AI-Assistent" onClick={() => onAction('create_table_ai')} />
      </RibbonGroup>

      {/* Queries Group */}
      <RibbonGroup label="Abfragen">
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
      </RibbonGroup>

      {/* Forms Group */}
      <RibbonGroup label="Formulare">
        <RibbonButton icon={<Layout />} label="Formular" onClick={() => onAction('create_form')} />
      </RibbonGroup>

      {/* Reports Group */}
      <RibbonGroup label="Berichte" isLast>
        <RibbonButton icon={<FileText />} label="Bericht" onClick={() => onAction('create_report')} />
      </RibbonGroup>
    </div>
  );
};
