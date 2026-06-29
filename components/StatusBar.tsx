
import React from 'react';
import { ViewType, Table, Query, Report, Form, Chart, Workflow } from '../types/index';
import { PencilRuler, Eye, Database, Layout, FileText, Table as TableIcon } from 'lucide-react';

interface StatusBarProps {
  currentView: ViewType;
  activeObject: Table | Query | Report | Form | Chart | Workflow | null;
  onSetView: (view: ViewType) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ currentView, activeObject, onSetView }) => {
  
  const getStatusText = () => {
    if (!activeObject) return "Bereit";
    if (currentView.type === 'table_edit') return `Entwurf: Tabelle "${activeObject.name}"`;
    if (currentView.type === 'table_data') return `Datenblatt: Tabelle "${activeObject.name}"`;
    if (currentView.type === 'query_designer') return `Entwurf: Abfrage "${activeObject.name}"`;
    if (currentView.type === 'query_results') return `Datenblatt: Abfrage "${activeObject.name}"`;
    if (currentView.type === 'form_designer') return `Entwurf: Formular "${activeObject.name}"`;
    if (currentView.type === 'form_view') return `Formularansicht: "${activeObject.name}"`;
    if (currentView.type === 'report_view') return `Berichtsansicht: "${activeObject.name}"`;
    if (currentView.type === 'report_designer') return `Entwurf: Bericht "${activeObject.name}"`;
    if (currentView.type === 'chart_view') return `Diagramm: "${activeObject.name}"`;
    if (currentView.type === 'workflow_designer') return `Workflow: "${activeObject.name}"`;
    return "Bereit";
  };

  const handleSwitchView = (mode: 'design' | 'view') => {
    if (!activeObject) return;

    if ('fields' in activeObject && !('nodes' in activeObject) && !('sourceType' in activeObject)) {
        // Table
        onSetView({ type: mode === 'design' ? 'table_edit' : 'table_data', tableId: activeObject.id });
    } else if ('nodes' in activeObject && 'columns' in activeObject) { // Query has columns
        // Query
        onSetView({ type: mode === 'design' ? 'query_designer' : 'query_results', queryId: activeObject.id });
    } else if ('layout' in activeObject) {
        // Form
        onSetView({ type: mode === 'design' ? 'form_designer' : 'form_view', formId: activeObject.id });
    } else if ('summaries' in activeObject) {
        // Report
        onSetView({ type: mode === 'design' ? 'report_designer' : 'report_view', reportId: activeObject.id });
    }
  };

  const isDesignActive = ['table_edit', 'query_designer', 'form_designer', 'report_designer'].includes(currentView.type);
  const isViewActive = ['table_data', 'query_results', 'form_view', 'report_view'].includes(currentView.type);
  const canSwitch = activeObject !== null 
    && currentView.type !== 'relationships' 
    && currentView.type !== 'welcome' 
    && currentView.type !== 'table_create'
    && !currentView.type.includes('chart')
    && !currentView.type.includes('workflow');

  return (
    <div className="bg-slate-200 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 h-6 px-2 flex justify-between items-center text-xs select-none print:hidden transition-colors duration-300">
      <div className="text-slate-600 dark:text-slate-400 font-medium">
        {getStatusText()}
      </div>
      
      {canSwitch && (
        <div className="flex gap-1">
          <button 
            onClick={() => handleSwitchView('design')}
            title="Entwurfsansicht"
            className={`p-0.5 rounded hover:bg-slate-300 dark:hover:bg-slate-700 ${isDesignActive ? 'bg-slate-300 dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-inner' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <PencilRuler size={14} />
          </button>
          <button 
            onClick={() => handleSwitchView('view')}
            title="Datenblatt-/Formularansicht"
            className={`p-0.5 rounded hover:bg-slate-300 dark:hover:bg-slate-700 ${isViewActive ? 'bg-slate-300 dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-inner' : 'text-slate-500 dark:text-slate-400'}`}
          >
            {currentView.type.includes('form') ? <Layout size={14}/> : currentView.type.includes('report') ? <FileText size={14}/> : <TableIcon size={14} />}
          </button>
        </div>
      )}
    </div>
  );
};
