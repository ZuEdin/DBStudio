
import React, { useState } from 'react';
import { Table as TableIcon, Search, FileText, Layout, Wand2, Copy, Unlink, ChevronDown, PlusSquare, Trash, BarChart, GitFork, LayoutTemplate, FileCode, RefreshCw, Cpu, Sparkles } from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonSplitButton } from '../RibbonSplitButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';
import { TableTemplate } from '../../../types/tableTemplates';

interface CreateTabProps {
  onAction: (action: string, payload?: any) => void;
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
        <RibbonSplitButton 
          label={t('ribbon.actions.table')}
          onMainClick={() => onAction('create_table')}
          onSelectTemplate={(template: TableTemplate, withSampleData: boolean) => 
            onAction('create_table_from_template', { template, withSampleData })
          }
          onOpenTemplateManager={() => onAction('open_table_template_manager')}
          onSaveCurrentAsTemplate={() => onAction('save_current_as_template')}
        />
        <RibbonButton icon={<Sparkles className="text-indigo-600" />} label="AI Copilot (Vorbereitet)" onClick={() => onAction('open_ai_copilot', 'schema')} />
        <RibbonButton icon={<FileCode className="text-teal-600" />} label="Projekt/SQL Import" onClick={() => onAction('import_schema')} />
      </RibbonGroup>

      {/* Queries Group */}
      <RibbonGroup label={t('ribbon.groups.queries')}>
        <RibbonButton icon={<Search />} label={t('ribbon.actions.query_design')} onClick={() => onAction('create_query')} />
        <RibbonButton icon={<Sparkles className="text-indigo-600" />} label="AI Query (Vorbereitet)" onClick={() => onAction('open_ai_copilot', 'query')} />
        
        {/* Wizards Dropdown */}
        <div className="relative" onMouseLeave={() => setShowWizardDropdown(false)}>
            <RibbonButton icon={<Wand2 className="text-teal-600 dark:text-teal-400" />} label={t('ribbon.actions.wizards')} onClick={() => setShowWizardDropdown(p => !p)} />
            {showWizardDropdown && (
            <div className="absolute top-full left-0 bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-lg z-50 text-xs w-52 py-1 text-slate-800 dark:text-slate-100 animate-in fade-in-25">
                <button onClick={() => { onAction('wizard_duplicate'); setShowWizardDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-200 cursor-pointer"><Copy size={14} /> {t('ribbon.actions.wizard_duplicate')}</button>
                <button onClick={() => { onAction('wizard_inconsistency'); setShowWizardDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-200 border-t border-slate-100 dark:border-slate-800 cursor-pointer"><Unlink size={14} /> {t('ribbon.actions.wizard_inconsistency')}</button>
            </div>
            )}
        </div>

        {/* Action Queries Dropdown */}
        <div className="relative" onMouseLeave={() => setShowActionQueryDropdown(false)}>
            <RibbonButton icon={<ChevronDown/>} label={t('ribbon.actions.action_queries')} onClick={() => setShowActionQueryDropdown(p => !p)} />
            {showActionQueryDropdown && (
            <div className="absolute top-full left-0 bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-lg z-50 text-xs w-60 py-1 text-slate-800 dark:text-slate-100 animate-in fade-in-25">
                <button onClick={() => { onAction('wizard_append'); setShowActionQueryDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-200 cursor-pointer"><PlusSquare size={14} className="text-green-600 dark:text-green-400"/> {t('ribbon.actions.query_append')}</button>
                <button onClick={() => { onAction('wizard_delete'); setShowActionQueryDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-rose-600 dark:text-rose-400 border-t border-slate-100 dark:border-slate-800 cursor-pointer"><Trash size={14} /> {t('ribbon.actions.query_delete')}</button>
                <button onClick={() => { onAction('wizard_update'); setShowActionQueryDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-blue-600 dark:text-blue-400 border-t border-slate-100 dark:border-slate-800 cursor-pointer"><RefreshCw size={14} /> {t('ribbon.actions.query_update')}</button>
                <button onClick={() => { onAction('wizard_maketable'); setShowActionQueryDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-teal-600 dark:text-teal-400 border-t border-slate-100 dark:border-slate-800 cursor-pointer"><TableIcon size={14} /> Tabellenerstellungsabfrage</button>
            </div>
            )}
        </div>
      </RibbonGroup>

      {/* Forms Group */}
      <RibbonGroup label={t('ribbon.groups.forms')}>
        <RibbonButton icon={<Layout />} label={t('ribbon.actions.form')} onClick={() => onAction('create_form')} />
        <div className="relative" onMouseLeave={() => setShowFormWizardDropdown(false)}>
             <RibbonButton icon={<Wand2 className="text-indigo-600 dark:text-indigo-400" />} label="Security Forms" onClick={() => setShowFormWizardDropdown(p => !p)} />
             {showFormWizardDropdown && (
             <div className="absolute top-full left-0 bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-lg z-50 text-xs w-52 py-1 text-slate-800 dark:text-slate-100 animate-in fade-in-25">
                 <button onClick={() => { onAction('create_login_form'); setShowFormWizardDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-200 cursor-pointer">Login Formular</button>
                 <button onClick={() => { onAction('create_usermgmt_form'); setShowFormWizardDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-200 border-t border-slate-100 dark:border-slate-800 cursor-pointer">User Management</button>
                 <button onClick={() => { onAction('create_register_form'); setShowFormWizardDropdown(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-200 border-t border-slate-100 dark:border-slate-800 cursor-pointer">Registrierung</button>
             </div>
             )}
         </div>
      </RibbonGroup>

      {/* Pages Group */}
      <RibbonGroup label="Pages">
        <RibbonButton icon={<LayoutTemplate className="text-amber-600"/>} label="Page" onClick={() => onAction('create_page')} />
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
        <RibbonButton icon={<Cpu className="text-indigo-600"/>} label="Makros" onClick={() => onAction('logic_designer')} />
        <RibbonButton icon={<GitFork className="text-purple-600"/>} label="Workflow" onClick={() => onAction('create_workflow')} />
      </RibbonGroup>
    </div>
  );
};
