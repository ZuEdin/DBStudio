
import React, { useState, useMemo } from 'react';
import { Table, Query, Report, Form, Chart, Workflow } from '../types/index';
import { Table as TableIcon, Search, FileText, Layout, ChevronDown, ChevronRight, Database, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Folder, FolderOpen, Globe, BarChart2, GitFork, CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  charts?: Chart[];
  workflows?: Workflow[]; // NEW
  onSelectTable: (id: string) => void;
  onSelectQuery: (id: string) => void;
  onSelectReport: (id: string) => void;
  onSelectForm: (id: string) => void;
  onSelectChart?: (id: string) => void;
  onSelectWorkflow?: (id: string) => void; // NEW
  onSelectScheduler?: () => void; // NEW
  onItemContextMenu: (e: React.MouseEvent, type: 'table' | 'query' | 'report' | 'form' | 'chart' | 'workflow', id: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

interface GroupedItem<T> {
  id: string;
  original: T;
  displayName: string;
}

interface Group<T> {
  id: string;
  name: string; 
  items: GroupedItem<T>[];
  isVirtual: boolean; 
}

export const Sidebar: React.FC<SidebarProps> = ({ tables, queries, reports, forms, charts = [], workflows = [], onSelectTable, onSelectQuery, onSelectReport, onSelectForm, onSelectChart, onSelectWorkflow, onSelectScheduler, onItemContextMenu, isOpen, toggleSidebar }) => {
  const [openGroups, setOpenGroups] = useState({ tables: true, queries: true, reports: true, forms: true, charts: true, workflows: true });
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const { t } = useTranslation();

  const toggleGroup = (group: keyof typeof openGroups) => {
    setOpenGroups({ ...openGroups, [group]: !openGroups[group] });
  };

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleDragStart = (e: React.DragEvent, type: 'table' | 'query', id: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, id }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const groupItems = <T extends { id: string; name: string }>(items: T[]): Group<T>[] => {
    if (!Array.isArray(items)) return [];
    const sorted = [...items].sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
    const groups: Group<T>[] = [];
    const processed = new Set<string>();

    sorted.forEach((item) => {
      if (!item || !item.id || processed.has(item.id)) return;
      const related = sorted.filter(candidate => 
        candidate && candidate.id !== item.id && 
        candidate.name.startsWith(item.name) &&
        (candidate.name.length > item.name.length)
      );

      if (related.length > 0) {
        const groupItems: GroupedItem<T>[] = [];
        groupItems.push({ id: item.id, original: item, displayName: item.name });
        processed.add(item.id);
        related.forEach(child => {
          if (processed.has(child.id)) return; 
          let shortName = child.name.slice(item.name.length);
          if (shortName.startsWith('_')) shortName = shortName.substring(1);
          if (!shortName) shortName = child.name;
          groupItems.push({ id: child.id, original: child, displayName: shortName });
          processed.add(child.id);
        });
        groups.push({ id: `grp_${item.id}`, name: item.name, items: groupItems, isVirtual: true });
      } else {
        groups.push({ id: item.id, name: item.name, items: [{ id: item.id, original: item, displayName: item.name }], isVirtual: false });
        processed.add(item.id);
      }
    });
    return groups;
  };

  const groupedTables = useMemo(() => groupItems(tables || []), [tables]);
  const groupedQueries = useMemo(() => groupItems(queries || []), [queries]);
  const groupedReports = useMemo(() => groupItems(reports || []), [reports]);
  const groupedForms = useMemo(() => groupItems(forms || []), [forms]);
  const groupedCharts = useMemo(() => groupItems(charts || []), [charts]);
  const groupedWorkflows = useMemo(() => groupItems(workflows || []), [workflows]);

  const RenderGroup: React.FC<{ 
    group: Group<any>; 
    icon: any; 
    colorClass: string; 
    bgClass: string;
    onSelect: ((id: string) => void) | undefined; 
    type: 'table' | 'query' | 'report' | 'form' | 'chart' | 'workflow'; 
  }> = ({ group, icon: DefaultIcon, colorClass, bgClass, onSelect, type }) => {
    const getIcon = (item: GroupedItem<any>) => {
        if (type === 'table' && (item.original as Table).isApiImport) return Globe;
        return DefaultIcon;
    };

    if (!group.isVirtual || group.items.length === 1) {
      const item = group.items[0];
      const ItemIcon = getIcon(item);
      const specificColorClass = type === 'table' && (item.original as Table).isApiImport ? 'text-blue-600' : colorClass;

      return (
        <div className={`flex items-center justify-between px-2 py-1 ${bgClass} rounded text-sm text-slate-700 group relative`}>
          <div
            className="flex items-center gap-2 flex-grow cursor-pointer truncate"
            onClick={() => onSelect && onSelect(item.id)}
            draggable={type === 'table' || type === 'query'}
            onDragStart={(e) => (type === 'table' || type === 'query') && handleDragStart(e, type, item.id)}
          >
            <ItemIcon size={14} className={`${specificColorClass} flex-shrink-0`} />
            <span className="truncate" title={item.original.name}>{item.displayName}</span>
          </div>
          <button onClick={(e) => onItemContextMenu(e, type, item.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-800 p-0.5 rounded flex-shrink-0">
            <MoreHorizontal size={16} />
          </button>
        </div>
      );
    }

    const isOpen = openFolders[group.id] !== false; 
    return (
      <div className="mb-1">
        <div 
          className="flex items-center gap-1 px-1 py-1 hover:bg-slate-200 rounded cursor-pointer text-xs font-bold text-slate-600 select-none"
          onClick={() => toggleFolder(group.id)}
        >
          {isOpen ? <FolderOpen size={14} className="text-blue-400" /> : <Folder size={14} className="text-blue-400" />}
          <span>{group.name}</span>
          <span className="ml-auto text-[9px] bg-slate-200 px-1 rounded-full text-slate-500">{group.items.length}</span>
        </div>
        {isOpen && (
          <div className="ml-3 pl-2 border-l border-slate-300 space-y-0.5 mt-0.5">
            {group.items.map(item => {
              const ItemIcon = getIcon(item);
              const specificColorClass = type === 'table' && (item.original as Table).isApiImport ? 'text-blue-600' : colorClass;
              return (
                <div key={item.id} className={`flex items-center justify-between px-2 py-1 ${bgClass} rounded text-sm text-slate-700 group relative`}>
                    <div
                    className="flex items-center gap-2 flex-grow cursor-pointer truncate"
                    onClick={() => onSelect && onSelect(item.id)}
                    draggable={type === 'table' || type === 'query'}
                    onDragStart={(e) => (type === 'table' || type === 'query') && handleDragStart(e, type, item.id)}
                    >
                    <ItemIcon size={14} className={`${specificColorClass} flex-shrink-0`} />
                    <span className="truncate" title={item.original.name}>{item.displayName}</span>
                    </div>
                    <button onClick={(e) => onItemContextMenu(e, type, item.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-800 p-0.5 rounded flex-shrink-0">
                    <MoreHorizontal size={16} />
                    </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <div className="w-8 bg-slate-50 border-r border-slate-300 flex flex-col items-center py-2 select-none">
        <button onClick={toggleSidebar} title="Seitenleiste einblenden" className="p-1 hover:bg-slate-200 rounded text-slate-600">
          <PanelLeftOpen size={20} />
        </button>
        <div className="mt-4 flex flex-col gap-4 text-slate-400">
           <Database size={16} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-slate-50 border-r border-slate-300 flex flex-col h-full select-none transition-all duration-300">
      <div className="p-2 bg-slate-200 border-b border-slate-300 font-bold text-slate-700 text-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={16} />
          <span>{t('sidebar.all_objects')}</span>
        </div>
        <button onClick={toggleSidebar} className="text-slate-500 hover:text-slate-800 p-0.5 rounded">
           <PanelLeftClose size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Tables */}
        <div>
          <button onClick={() => toggleGroup('tables')} className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 hover:bg-slate-200 px-1 py-1 rounded">
            {openGroups.tables ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {t('sidebar.tables')}
          </button>
          {openGroups.tables && (
            <div className="ml-2 mt-1 space-y-1">
              {groupedTables.map(g => <RenderGroup key={g.id} group={g} icon={TableIcon} colorClass="text-orange-600" bgClass="hover:bg-orange-100 hover:text-orange-900" onSelect={onSelectTable} type="table" />)}
            </div>
          )}
        </div>

        {/* Queries */}
        <div>
          <button onClick={() => toggleGroup('queries')} className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 hover:bg-slate-200 px-1 py-1 rounded">
            {openGroups.queries ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {t('sidebar.queries')}
          </button>
          {openGroups.queries && (
            <div className="ml-2 mt-1 space-y-1">
              {groupedQueries.map(g => <RenderGroup key={g.id} group={g} icon={Search} colorClass="text-blue-600" bgClass="hover:bg-blue-100 hover:text-blue-900" onSelect={onSelectQuery} type="query" />)}
            </div>
          )}
        </div>
        
        {/* Reports */}
        <div>
           <button onClick={() => toggleGroup('reports')} className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 hover:bg-slate-200 px-1 py-1 rounded">
            {openGroups.reports ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {t('sidebar.reports')}
          </button>
          {openGroups.reports && (
             <div className="ml-2 mt-1 space-y-1">
              {groupedReports.map(g => <RenderGroup key={g.id} group={g} icon={FileText} colorClass="text-green-600" bgClass="hover:bg-green-100 hover:text-green-900" onSelect={onSelectReport} type="report" />)}
             </div>
          )}
        </div>
        
        {/* Forms */}
         <div>
           <button onClick={() => toggleGroup('forms')} className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 hover:bg-slate-200 px-1 py-1 rounded">
            {openGroups.forms ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {t('sidebar.forms')}
          </button>
          {openGroups.forms && (
             <div className="ml-2 mt-1 space-y-1">
                {groupedForms.map(g => <RenderGroup key={g.id} group={g} icon={Layout} colorClass="text-indigo-600" bgClass="hover:bg-indigo-100 hover:text-indigo-900" onSelect={onSelectForm} type="form" />)}
             </div>
          )}
        </div>

        {/* Charts */}
        <div>
           <button onClick={() => toggleGroup('charts')} className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 hover:bg-slate-200 px-1 py-1 rounded">
            {openGroups.charts ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {t('sidebar.charts')}
          </button>
          {openGroups.charts && (
             <div className="ml-2 mt-1 space-y-1">
                {groupedCharts.map(g => <RenderGroup key={g.id} group={g} icon={BarChart2} colorClass="text-pink-600" bgClass="hover:bg-pink-100 hover:text-pink-900" onSelect={onSelectChart!} type="chart" />)}
             </div>
          )}
        </div>

        {/* Workflows & Scheduler (NEW) */}
        <div>
           <button onClick={() => toggleGroup('workflows')} className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 hover:bg-slate-200 px-1 py-1 rounded">
            {openGroups.workflows ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Logik & Jobs
          </button>
          {openGroups.workflows && (
             <div className="ml-2 mt-1 space-y-1">
                {/* Scheduler Item */}
                <div className={`flex items-center justify-between px-2 py-1 hover:bg-teal-100 hover:text-teal-900 rounded text-sm text-slate-700 cursor-pointer`} onClick={onSelectScheduler}>
                    <div className="flex items-center gap-2">
                        <CalendarClock size={14} className="text-teal-600" />
                        <span>Zeitplaner (Jobs)</span>
                    </div>
                </div>
                
                {groupedWorkflows.map(g => <RenderGroup key={g.id} group={g} icon={GitFork} colorClass="text-purple-600" bgClass="hover:bg-purple-100 hover:text-purple-900" onSelect={onSelectWorkflow} type="workflow" />)}
             </div>
          )}
        </div>

      </div>
    </div>
  );
};
