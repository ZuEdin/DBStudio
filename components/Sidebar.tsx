import React, { useState } from 'react';
import { Table, Query, Report, Form } from '../types/index';
import { Table as TableIcon, Search, FileText, Layout, ChevronDown, ChevronRight, Database, MoreHorizontal } from 'lucide-react';

interface SidebarProps {
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  onSelectTable: (id: string) => void;
  onSelectQuery: (id: string) => void;
  onSelectReport: (id: string) => void;
  onSelectForm: (id: string) => void;
  onItemContextMenu: (e: React.MouseEvent, type: 'table' | 'query' | 'report' | 'form', id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ tables, queries, reports, forms, onSelectTable, onSelectQuery, onSelectReport, onSelectForm, onItemContextMenu }) => {
  const [openGroups, setOpenGroups] = useState({ tables: true, queries: true, reports: true, forms: true });

  const toggleGroup = (group: keyof typeof openGroups) => {
    setOpenGroups({ ...openGroups, [group]: !openGroups[group] });
  };

  const handleDragStart = (e: React.DragEvent, type: 'table' | 'query', id: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, id }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-64 bg-slate-50 border-r border-slate-300 flex flex-col h-full select-none">
      <div className="p-2 bg-slate-200 border-b border-slate-300 font-bold text-slate-700 text-sm flex items-center gap-2">
        <Database size={16} />
        <span>Alle Objekte</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        
        {/* Tables Group */}
        <div>
          <button 
            onClick={() => toggleGroup('tables')}
            className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 hover:bg-slate-200 px-1 py-1 rounded"
          >
            {openGroups.tables ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Tabellen
          </button>
          {openGroups.tables && (
            <div className="ml-2 mt-1 space-y-1">
              {tables.map(table => (
                <div key={table.id} className="flex items-center justify-between px-2 py-1 hover:bg-orange-100 hover:text-orange-900 rounded text-sm text-slate-700 group">
                  <div
                    className="flex items-center gap-2 flex-grow cursor-pointer truncate"
                    onClick={() => onSelectTable(table.id)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'table', table.id)}
                  >
                    <TableIcon size={14} className="text-orange-600 flex-shrink-0" />
                    <span className="truncate">{table.name}</span>
                  </div>
                   <button onClick={(e) => onItemContextMenu(e, 'table', table.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-800 p-0.5 rounded flex-shrink-0">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              ))}
              {tables.length === 0 && <span className="text-xs text-slate-400 italic px-2">Keine Tabellen</span>}
            </div>
          )}
        </div>

        {/* Queries Group */}
        <div>
          <button 
            onClick={() => toggleGroup('queries')}
            className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 hover:bg-slate-200 px-1 py-1 rounded"
          >
            {openGroups.queries ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Abfragen
          </button>
          {openGroups.queries && (
            <div className="ml-2 mt-1 space-y-1">
              {queries.map(q => (
                <div key={q.id} className="flex items-center justify-between px-2 py-1 hover:bg-blue-100 hover:text-blue-900 rounded text-sm text-slate-700 group">
                   <div className="flex items-center gap-2 flex-grow cursor-pointer truncate" onClick={() => onSelectQuery(q.id)}>
                    <Search size={14} className="text-blue-600 flex-shrink-0" />
                    <span className="truncate">{q.name}</span>
                  </div>
                   <button onClick={(e) => onItemContextMenu(e, 'query', q.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-800 p-0.5 rounded flex-shrink-0">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              ))}
               {queries.length === 0 && <span className="text-xs text-slate-400 italic px-2">Keine Abfragen</span>}
            </div>
          )}
        </div>
        
        {/* Reports Group */}
        <div>
           <button 
            onClick={() => toggleGroup('reports')}
            className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 hover:bg-slate-200 px-1 py-1 rounded"
          >
            {openGroups.reports ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Berichte
          </button>
          {openGroups.reports && (
             <div className="ml-2 mt-1 space-y-1">
              {reports.map(r => (
                <div key={r.id} className="flex items-center justify-between px-2 py-1 hover:bg-green-100 hover:text-green-900 rounded text-sm text-slate-700 group">
                   <div className="flex items-center gap-2 flex-grow cursor-pointer truncate" onClick={() => onSelectReport(r.id)}>
                    <FileText size={14} className="text-green-600 flex-shrink-0" />
                    <span className="truncate">{r.name}</span>
                  </div>
                   <button onClick={(e) => onItemContextMenu(e, 'report', r.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-800 p-0.5 rounded flex-shrink-0">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              ))}
               {reports.length === 0 && <span className="text-xs text-slate-400 italic px-2">Keine Berichte</span>}
             </div>
          )}
        </div>
        
        {/* Forms Group */}
         <div>
           <button 
            onClick={() => toggleGroup('forms')}
            className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 hover:bg-slate-200 px-1 py-1 rounded"
          >
            {openGroups.forms ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Formulare
          </button>
          {openGroups.forms && (
             <div className="ml-2 mt-1 space-y-1">
                {forms.map(f => (
                <div key={f.id} className="flex items-center justify-between px-2 py-1 hover:bg-indigo-100 hover:text-indigo-900 rounded text-sm text-slate-700 group">
                   <div className="flex items-center gap-2 flex-grow cursor-pointer truncate" onClick={() => onSelectForm(f.id)}>
                    <Layout size={14} className="text-indigo-600 flex-shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </div>
                   <button onClick={(e) => onItemContextMenu(e, 'form', f.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-800 p-0.5 rounded flex-shrink-0">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              ))}
               {forms.length === 0 && <span className="text-xs text-slate-400 italic px-2">Keine Formulare</span>}
             </div>
          )}
        </div>

      </div>
    </div>
  );
};