
import React, { useState } from 'react';
import { Table as TableIcon, Search, FileText, Layout, Wand2, Copy, Unlink, ChevronDown, PlusSquare, Trash, BarChart, GitFork } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';

interface CreateTabProps {
  onAction: (action: string) => void;
}

export const CreateTab: React.FC<CreateTabProps> = ({ onAction }) => {
  const [showWizardDropdown, setShowWizardDropdown] = useState(false);
  const [showFormWizardDropdown, setShowFormWizardDropdown] = useState(false);
  const [showActionQueryDropdown, setShowActionQueryDropdown] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="flex gap-1 h-full">
      {/* Tables Group */}
      <RibbonGroup label={t('ribbon.groups.tables')}>
        <RibbonButton icon={<TableIcon />} label={t('ribbon.actions.table')} onClick={() => onAction('create_table')} />
        <RibbonButton icon={<Wand2 className="text-purple-600" />} label={t('ribbon.actions.ai_assist')} onClick={() => onAction('create_table_ai')} />
      </RibbonGroup>

      {/* Queries Group */}
      <RibbonGroup label={t('ribbon.groups.queries')}>
        <RibbonButton icon={<Search />} label={t('ribbon.actions.query_design')} onClick={() => onAction('create_query')} />
        
        {/* Wizards Dropdown */}
        <div className="relative" onMouseLeave={() => setShowWizardDropdown(false)}>
            <RibbonButton icon={<Wand2 className="text-teal-600" />} label={t('ribbon.actions.wizards')} onClick={() => setShowWizardDropdown(p => !p)} />
            {showWizardDropdown && (
            <div className="absolute top-full left-0 bg-white shadow-lg border rounded z-50 text-sm w-48 mt-1">
                <button onClick={() => { onAction('wizard_duplicate'); setShowWizardDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 text-left"><Copy size={14} /> {t('ribbon.actions.wizard_duplicate')}</button>
                <button onClick={() => { onAction('wizard_inconsistency'); setShowWizardDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 text-left"><Unlink size={14} /> {t('ribbon.actions.wizard_inconsistency')}</button>
            </div>
            )}
        </div>

        {/* Action Queries Dropdown */}
        <div className="relative" onMouseLeave={() => setShowActionQueryDropdown(false)}>
            <RibbonButton icon={<ChevronDown/>} label={t('ribbon.actions.action_queries')} onClick={() => setShowActionQueryDropdown(p => !p)} />
            {showActionQueryDropdown && (
            <div className="absolute top-full left-0 bg-white shadow-lg border rounded z-50 text-sm w-48 mt-1">
                <button onClick={() => { onAction('wizard_append'); setShowActionQueryDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 text-left"><PlusSquare size={14} className="text-green-600"/> {t('ribbon.actions.query_append')}</button>
                <button onClick={() => { onAction('wizard_delete'); setShowActionQueryDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 text-left text-red-600"><Trash size={14} /> {t('ribbon.actions.query_delete')}</button>
            </div>
            )}
        </div>
      </RibbonGroup>

      {/* Forms Group */}
      <RibbonGroup label={t('ribbon.groups.forms')}>
        <RibbonButton icon={<Layout />} label={t('ribbon.actions.form')} onClick={() => onAction('create_form')} />
        <div className="relative" onMouseLeave={() => setShowFormWizardDropdown(false)}>
             <RibbonButton icon={<Wand2 className="text-indigo-600" />} label="Security Forms" onClick={() => setShowFormWizardDropdown(p => !p)} />
             {showFormWizardDropdown && (
             <div className="absolute top-full left-0 bg-white shadow-lg border border-slate-200 rounded z-50 text-sm w-48 mt-1">
                 <button onClick={() => { onAction('create_login_form'); setShowFormWizardDropdown(false); }} className="flex items-center gap-2 w-full p-2 py-2 hover:bg-slate-50 text-left text-slate-700">Login Formular</button>
                 <button onClick={() => { onAction('create_usermgmt_form'); setShowFormWizardDropdown(false); }} className="flex items-center gap-2 w-full p-2 py-2 hover:bg-slate-50 text-left text-slate-700 border-t border-slate-100">User Management</button>
                 <button onClick={() => { onAction('create_register_form'); setShowFormWizardDropdown(false); }} className="flex items-center gap-2 w-full p-2 py-2 hover:bg-slate-50 text-left text-slate-700 border-t border-slate-100">Registrierung</button>
             </div>
             )}
         </div>
      </RibbonGroup>

      {/* Reports Group */}
      <RibbonGroup label={t('ribbon.groups.reports')}>
        <RibbonButton icon={<FileText />} label={t('ribbon.actions.report')} onClick={() => onAction('create_report')} />
      </RibbonGroup>

      {/* Charts Group */}
      <RibbonGroup label={t('ribbon.groups.charts')}>
        <RibbonButton icon={<BarChart className="text-orange-600"/>} label={t('ribbon.actions.chart')} onClick={() => onAction('create_chart')} />
      </RibbonGroup>

      {/* Logic/Workflow Group (NEW) */}
      <RibbonGroup label="Logik" isLast>
        <RibbonButton icon={<GitFork className="text-purple-600"/>} label="Workflow" onClick={() => onAction('create_workflow')} />
      </RibbonGroup>
    </div>
  );
};
