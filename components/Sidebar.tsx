
import React, { useState, useMemo } from 'react';
import { Table, Query, Report, Form, Chart, Workflow, CustomPage } from '../types/index';
import { Table as TableIcon, Search, FileText, Layout, ChevronDown, ChevronRight, Database, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Folder, FolderOpen, Globe, BarChart2, GitFork, CalendarClock, LayoutTemplate } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  charts?: Chart[];
  workflows?: Workflow[];
  pages?: CustomPage[];
  onSelectTable: (id: string) => void;
  onSelectQuery: (id: string) => void;
  onSelectReport: (id: string) => void;
  onSelectForm: (id: string) => void;
  onSelectChart?: (id: string) => void;
  onSelectWorkflow?: (id: string) => void;
  onSelectPage?: (id: string) => void;
  onSelectScheduler?: () => void;
  onItemContextMenu: (e: React.MouseEvent, type: 'table' | 'query' | 'report' | 'form' | 'chart' | 'workflow' | 'page', id: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

interface TreeNode<T> {
  id: string;
  item: T;
  displayName: string;
  children: TreeNode<T>[];
  isVirtual?: boolean;
}

interface RenderNodeProps {
  node: TreeNode<any>; 
  icon: any; 
  colorClass: string; 
  bgClass: string;
  onSelect: ((id: string) => void) | undefined; 
  type: 'table' | 'query' | 'report' | 'form' | 'chart' | 'workflow' | 'page'; 
  openFolders: Record<string, boolean>;
  toggleFolder: (id: string) => void;
  onItemContextMenu: (e: React.MouseEvent, type: 'table' | 'query' | 'report' | 'form' | 'chart' | 'workflow' | 'page', id: string) => void;
  handleDragStart: (e: React.DragEvent, type: 'table' | 'query', id: string) => void;
}

const RenderNode: React.FC<RenderNodeProps> = ({ 
  node, icon: DefaultIcon, colorClass, bgClass, onSelect, type,
  openFolders, toggleFolder, onItemContextMenu, handleDragStart
}) => {
  const getIcon = (n: TreeNode<any>) => {
      if (type === 'table' && (n.item as Table).isApiImport) return Globe;
      if (type === 'report' && (n.item as Report).sourceType === 'dashboard') return LayoutTemplate;
      return DefaultIcon;
  };

  const hasChildren = node.children && node.children.length > 0;
  
  const renderItem = (n: TreeNode<any>, overrideName?: string) => (
    <div className={`flex items-center justify-between px-2 py-1 ${bgClass} hover:brightness-95 rounded text-sm text-slate-700 group relative`}>
      <div
        className="flex items-center gap-2 flex-grow cursor-pointer truncate"
        onClick={() => onSelect && onSelect(n.id)}
        draggable={type === 'table' || type === 'query'}
        onDragStart={(e) => (type === 'table' || type === 'query') && handleDragStart(e, type, n.id)}
      >
        {(() => {
            const DynamicIcon = getIcon(n);
            return <DynamicIcon size={14} className={`${type === 'table' && (n.item as Table).isApiImport ? 'text-blue-600' : colorClass} flex-shrink-0`} />;
        })()}
        <span className="truncate" title={n.item.name}>{overrideName || n.displayName}</span>
      </div>
      <button 
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onItemContextMenu(e, type, n.id);
        }} 
        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-800 p-0.5 rounded flex-shrink-0"
      >
        <MoreHorizontal size={16} />
      </button>
    </div>
  );

  if (!hasChildren) {
    return renderItem(node);
  }

  const isOpen = openFolders[node.id] !== false; 
  
  // Calculate total descendants to show in badge
  const countDescendants = (n: TreeNode<any>): number => {
     return 1 + n.children.reduce((acc, current) => acc + countDescendants(current), 0);
  };

  return (
    <div className="mb-1">
      <div 
        className="flex items-center gap-1 px-1 py-1 hover:bg-slate-200 rounded cursor-pointer text-xs font-bold text-slate-600 select-none"
        onClick={() => toggleFolder(node.id)}
      >
        {isOpen ? <FolderOpen size={14} className="text-blue-400" /> : <Folder size={14} className="text-blue-400" />}
        <span className="truncate">{node.displayName}</span>
        <span className="ml-auto text-[9px] bg-slate-200 px-1 rounded-full text-slate-500 flex-shrink-0">{countDescendants(node)}</span>
      </div>
      {isOpen && (
        <div className="ml-3 pl-2 border-l border-slate-300 space-y-0.5 mt-0.5">
          {!node.isVirtual && renderItem(node, node.item.name)}
          {node.children.map(child => (
            <RenderNode
              key={child.id}
              node={child}
              icon={DefaultIcon}
              colorClass={colorClass}
              bgClass={bgClass}
              onSelect={onSelect}
              type={type}
              openFolders={openFolders}
              toggleFolder={toggleFolder}
              onItemContextMenu={onItemContextMenu}
              handleDragStart={handleDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ tables, queries, reports, forms, charts = [], workflows = [], pages = [], onSelectTable, onSelectQuery, onSelectReport, onSelectForm, onSelectChart, onSelectWorkflow, onSelectPage, onSelectScheduler, onItemContextMenu, isOpen, toggleSidebar }) => {
  const [openGroups, setOpenGroups] = useState({ tables: true, queries: true, reports: true, forms: true, charts: true, workflows: true, pages: true });
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

  const buildRecursiveTree = <T extends { id: string; name: string }>(items: T[]): TreeNode<T>[] => {
    if (!Array.isArray(items)) return [];
    const sorted = [...items].sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
    
    const nodes = sorted.map(item => ({
        id: item.id,
        item,
        displayName: item.name,
        children: [],
        isVirtual: false,
        parentId: null as string | null
    }));

    const prefixCounts = new Map<string, number>();
    nodes.forEach(node => {
        const parts = node.item.name.split('_');
        let current = '';
        for(let i=0; i<parts.length-1; i++){
            current += (i===0 ? '' : '_') + parts[i];
            prefixCounts.set(current, (prefixCounts.get(current) || 0) + 1);
        }
    });

    const exactNames = new Set(nodes.map(n => n.item.name));
    const validPrefixes = new Set<string>();
    for (const [prefix, count] of prefixCounts.entries()) {
        if (count > 1 || exactNames.has(prefix) || exactNames.has(prefix + 's')) {
            validPrefixes.add(prefix);
        }
    }

    const sortedPrefixes = Array.from(validPrefixes).sort((a,b) => b.length - a.length);

    const virtualFolders = new Map<string, TreeNode<T>>();
    const exactNodes = new Map(nodes.map(n => [n.item.name, n]));

    sortedPrefixes.forEach(prefix => {
        if (!exactNodes.has(prefix) && !exactNodes.has(prefix + 's')) {
            virtualFolders.set(prefix, {
                id: 'virt_' + prefix,
                item: { name: prefix } as unknown as T,
                displayName: prefix,
                children: [],
                isVirtual: true,
                parentId: null
            } as TreeNode<T> & { isVirtual: boolean, parentId: string | null });
        }
    });

    const resolveNode = (prefix: string) => {
        if (exactNodes.has(prefix)) return exactNodes.get(prefix);
        if (exactNodes.has(prefix + 's')) return exactNodes.get(prefix + 's');
        return virtualFolders.get(prefix);
    };

    nodes.forEach(childNode => {
        let bestPrefix = null;
        for (const prefix of sortedPrefixes) {
            if (childNode.item.name.startsWith(prefix + '_')) {
                bestPrefix = prefix;
                break;
            }
        }
        
        if (bestPrefix) {
            const parent = resolveNode(bestPrefix);
            if (parent) {
                parent.children.push(childNode);
                const prefixStr = bestPrefix + '_';
                if (childNode.item.name.startsWith(prefixStr)) {
                    childNode.displayName = childNode.item.name.slice(prefixStr.length);
                }
                childNode.parentId = parent.id;
            }
        }
    });

    const allVirtuals = Array.from(virtualFolders.values()) as (TreeNode<T> & { isVirtual?: boolean, parentId?: string | null })[];
    allVirtuals.forEach(virtNode => {
        let bestPrefix = null;
        for (const prefix of sortedPrefixes) {
            if (virtNode.item.name !== prefix && virtNode.item.name.startsWith(prefix + '_')) {
                bestPrefix = prefix;
                break;
            }
        }
        if (bestPrefix) {
            const parent = resolveNode(bestPrefix);
            if (parent) {
                parent.children.push(virtNode);
                const prefixStr = bestPrefix + '_';
                if (virtNode.item.name.startsWith(prefixStr)) {
                    virtNode.displayName = virtNode.item.name.slice(prefixStr.length);
                }
                virtNode.parentId = parent.id;
            }
        }
    });

    let changed = true;
    while (changed) {
       changed = false;
       for (const virt of allVirtuals) {
           if (virt.isVirtual && virt.children.length === 1) {
               const child = virt.children[0] as TreeNode<T> & { isVirtual?: boolean, parentId?: string | null };
               if (virt.parentId) {
                   const parent = exactNodes.has(virt.parentId) ? exactNodes.get(virt.parentId) : virtualFolders.get(virt.parentId.replace('virt_', ''));
                   if (parent && parent !== virt) {
                       parent.children = parent.children.filter(c => c.id !== virt.id);
                       parent.children.push(child);
                       child.parentId = parent.id;
                       child.displayName = virt.displayName + '_' + child.displayName;
                       virt.children = [];
                       changed = true;
                   }
               } else {
                   child.parentId = null;
                   child.displayName = virt.item.name + '_' + child.displayName;
                   virt.children = [];
                   changed = true;
               }
           }
       }
    }

    const forest: TreeNode<T>[] = [];
    nodes.filter(n => !n.parentId).forEach(n => forest.push(n));
    allVirtuals.filter(n => !n.parentId && n.children.length > 0).forEach(n => forest.push(n));

    const sortNodes = (arr: TreeNode<T>[]) => {
        arr.sort((a,b) => a.displayName.localeCompare(b.displayName));
        arr.forEach(n => sortNodes(n.children));
    };
    sortNodes(forest);

    return forest;
  };

  const groupedTables = useMemo(() => buildRecursiveTree(tables || []), [tables]);
  const groupedQueries = useMemo(() => buildRecursiveTree(queries || []), [queries]);
  const groupedReports = useMemo(() => buildRecursiveTree(reports || []), [reports]);
  const groupedForms = useMemo(() => buildRecursiveTree(forms || []), [forms]);
  const groupedCharts = useMemo(() => buildRecursiveTree(charts || []), [charts]);
  const groupedWorkflows = useMemo(() => buildRecursiveTree(workflows || []), [workflows]);
  const groupedPages = useMemo(() => buildRecursiveTree(pages || []), [pages]);

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
              {groupedTables.map(g => <RenderNode key={g.id} node={g} icon={TableIcon} colorClass="text-orange-600" bgClass="hover:bg-orange-100 hover:text-orange-900" onSelect={onSelectTable} type="table" openFolders={openFolders} toggleFolder={toggleFolder} onItemContextMenu={onItemContextMenu} handleDragStart={handleDragStart} />)}
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
              {groupedQueries.map(g => <RenderNode key={g.id} node={g} icon={Search} colorClass="text-blue-600" bgClass="hover:bg-blue-100 hover:text-blue-900" onSelect={onSelectQuery} type="query" openFolders={openFolders} toggleFolder={toggleFolder} onItemContextMenu={onItemContextMenu} handleDragStart={handleDragStart} />)}
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
              {groupedReports.map(g => <RenderNode key={g.id} node={g} icon={FileText} colorClass="text-green-600" bgClass="hover:bg-green-100 hover:text-green-900" onSelect={onSelectReport} type="report" openFolders={openFolders} toggleFolder={toggleFolder} onItemContextMenu={onItemContextMenu} handleDragStart={handleDragStart} />)}
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
                {groupedForms.map(g => <RenderNode key={g.id} node={g} icon={Layout} colorClass="text-indigo-600" bgClass="hover:bg-indigo-100 hover:text-indigo-900" onSelect={onSelectForm} type="form" openFolders={openFolders} toggleFolder={toggleFolder} onItemContextMenu={onItemContextMenu} handleDragStart={handleDragStart} />)}
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
                {groupedCharts.map(g => <RenderNode key={g.id} node={g} icon={BarChart2} colorClass="text-pink-600" bgClass="hover:bg-pink-100 hover:text-pink-900" onSelect={onSelectChart!} type="chart" openFolders={openFolders} toggleFolder={toggleFolder} onItemContextMenu={onItemContextMenu} handleDragStart={handleDragStart} />)}
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
                
                {groupedWorkflows.map(g => <RenderNode key={g.id} node={g} icon={GitFork} colorClass="text-purple-600" bgClass="hover:bg-purple-100 hover:text-purple-900" onSelect={onSelectWorkflow} type="workflow" openFolders={openFolders} toggleFolder={toggleFolder} onItemContextMenu={onItemContextMenu} handleDragStart={handleDragStart} />)}
             </div>
          )}
        </div>

        {/* Pages (NEW) */}
        <div>
           <button onClick={() => toggleGroup('pages')} className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 hover:bg-slate-200 px-1 py-1 rounded">
            {openGroups.pages ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Pages
          </button>
          {openGroups.pages && (
             <div className="ml-2 mt-1 space-y-1">
                {groupedPages.map(g => <RenderNode key={g.id} node={g} icon={LayoutTemplate} colorClass="text-amber-600" bgClass="hover:bg-amber-100 hover:text-amber-900" onSelect={onSelectPage!} type="page" openFolders={openFolders} toggleFolder={toggleFolder} onItemContextMenu={onItemContextMenu} handleDragStart={handleDragStart} />)}
             </div>
          )}
        </div>

      </div>
    </div>
  );
};
