
import React, { useState, useMemo } from 'react';
import { Table, Query, Report, Form } from '../types/index';
import { Table as TableIcon, Search, FileText, Layout, ChevronDown, ChevronRight, Database, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Folder, FolderOpen } from 'lucide-react';

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
  name: string; // The prefix/group name
  items: GroupedItem<T>[];
  isVirtual: boolean; // True if multiple items, false if single item (no group needed)
}

export const Sidebar: React.FC<SidebarProps> = ({ tables, queries, reports, forms, onSelectTable, onSelectQuery, onSelectReport, onSelectForm, onItemContextMenu, isOpen, toggleSidebar }) => {
  const [openGroups, setOpenGroups] = useState({ tables: true, queries: true, reports: true, forms: true });
  // Track open states of dynamic folders (e.g. "Users")
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

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

  // Helper to group items based on prefix (e.g. "Users", "UsersRoles" -> Group "Users")
  const groupItems = <T extends { id: string; name: string }>(items: T[]): Group<T>[] => {
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
    const groups: Group<T>[] = [];

    // Map to track which items are processed
    const processed = new Set<string>();

    sorted.forEach((item) => {
      if (processed.has(item.id)) return;

      // Check if this item acts as a prefix for subsequent items
      // Example: item="Users" matches "UsersRoles", "UsersLog"
      const related = sorted.filter(candidate => 
        candidate.id !== item.id && 
        candidate.name.startsWith(item.name) &&
        // Ensure it's a valid semantic child (CamelCase or Separator)
        // e.g. "Users" matches "UsersRoles" (R is upper) or "Users_Roles"
        (candidate.name.length > item.name.length)
      );

      if (related.length > 0) {
        // It's a group!
        const groupItems: GroupedItem<T>[] = [];
        
        // Add Parent (Self)
        groupItems.push({
          id: item.id,
          original: item,
          displayName: item.name // Or "(Haupttabelle)" / "(Basis)"
        });
        processed.add(item.id);

        // Add Children
        related.forEach(child => {
          if (processed.has(child.id)) return; // Already in another subgroup? (Nested not fully supported yet)
          
          let shortName = child.name.slice(item.name.length);
          // Remove potential separators like underscore
          if (shortName.startsWith('_')) shortName = shortName.substring(1);
          // If perfectly empty (shouldn't happen due to length check), keep original
          if (!shortName) shortName = child.name;

          groupItems.push({
            id: child.id,
            original: child,
            displayName: shortName
          });
          processed.add(child.id);
        });

        groups.push({
          id: `grp_${item.id}`,
          name: item.name,
          items: groupItems,
          isVirtual: true
        });
      } else {
        // Standalone item
        groups.push({
          id: item.id,
          name: item.name,
          items: [{ id: item.id, original: item, displayName: item.name }],
          isVirtual: false
        });
        processed.add(item.id);
      }
    });

    return groups;
  };

  const groupedTables = useMemo(() => groupItems(tables), [tables]);
  const groupedQueries = useMemo(() => groupItems(queries), [queries]);
  const groupedReports = useMemo(() => groupItems(reports), [reports]);
  const groupedForms = useMemo(() => groupItems(forms), [forms]);

  const RenderGroup = ({ 
    group, 
    icon: Icon, 
    colorClass, 
    bgClass,
    onSelect, 
    type 
  }: { 
    group: Group<any>, 
    icon: any, 
    colorClass: string, 
    bgClass: string,
    onSelect: (id: string) => void, 
    type: 'table' | 'query' | 'report' | 'form' 
  }) => {
    // If singular, render as normal item
    if (!group.isVirtual || group.items.length === 1) {
      const item = group.items[0];
      return (
        <div className={`flex items-center justify-between px-2 py-1 ${bgClass} rounded text-sm text-slate-700 group relative`}>
          <div
            className="flex items-center gap-2 flex-grow cursor-pointer truncate"
            onClick={() => onSelect(item.id)}
            draggable={type === 'table' || type === 'query'}
            onDragStart={(e) => (type === 'table' || type === 'query') && handleDragStart(e, type, item.id)}
          >
            <Icon size={14} className={`${colorClass} flex-shrink-0`} />
            <span className="truncate" title={item.original.name}>{item.displayName}</span>
          </div>
          <button onClick={(e) => onItemContextMenu(e, type, item.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-800 p-0.5 rounded flex-shrink-0">
            <MoreHorizontal size={16} />
          </button>
        </div>
      );
    }

    // If Group
    const isOpen = openFolders[group.id] !== false; // Default open
    
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
            {group.items.map(item => (
              <div key={item.id} className={`flex items-center justify-between px-2 py-1 ${bgClass} rounded text-sm text-slate-700 group relative`}>
                <div
                  className="flex items-center gap-2 flex-grow cursor-pointer truncate"
                  onClick={() => onSelect(item.id)}
                  draggable={type === 'table' || type === 'query'}
                  onDragStart={(e) => (type === 'table' || type === 'query') && handleDragStart(e, type, item.id)}
                >
                  <Icon size={14} className={`${colorClass} flex-shrink-0`} />
                  <span className="truncate" title={item.original.name}>{item.displayName}</span>
                </div>
                <button onClick={(e) => onItemContextMenu(e, type, item.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-800 p-0.5 rounded flex-shrink-0">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            ))}
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
          <span>Alle DBObjekte</span>
        </div>
        <button onClick={toggleSidebar} className="text-slate-500 hover:text-slate-800 p-0.5 rounded">
           <PanelLeftClose size={16} />
        </button>
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
              {groupedTables.map(group => (
                <RenderGroup 
                  key={group.id} 
                  group={group} 
                  icon={TableIcon} 
                  colorClass="text-orange-600" 
                  bgClass="hover:bg-orange-100 hover:text-orange-900"
                  onSelect={onSelectTable}
                  type="table"
                />
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
              {groupedQueries.map(group => (
                <RenderGroup 
                  key={group.id} 
                  group={group} 
                  icon={Search} 
                  colorClass="text-blue-600" 
                  bgClass="hover:bg-blue-100 hover:text-blue-900"
                  onSelect={onSelectQuery}
                  type="query"
                />
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
              {groupedReports.map(group => (
                <RenderGroup 
                  key={group.id} 
                  group={group} 
                  icon={FileText} 
                  colorClass="text-green-600" 
                  bgClass="hover:bg-green-100 hover:text-green-900"
                  onSelect={onSelectReport}
                  type="report"
                />
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
                {groupedForms.map(group => (
                  <RenderGroup 
                    key={group.id} 
                    group={group} 
                    icon={Layout} 
                    colorClass="text-indigo-600" 
                    bgClass="hover:bg-indigo-100 hover:text-indigo-900"
                    onSelect={onSelectForm}
                    type="form"
                  />
                ))}
               {forms.length === 0 && <span className="text-xs text-slate-400 italic px-2">Keine Formulare</span>}
             </div>
          )}
        </div>

      </div>
    </div>
  );
};
