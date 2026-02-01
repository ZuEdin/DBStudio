
import React from 'react';
import { Eye, Download, Edit3, Trash2, Sheet, FileText, Layout, PieChart, GitFork } from 'lucide-react';

interface ItemContextMenuProps {
  x: number;
  y: number;
  itemType: 'table' | 'query' | 'report' | 'form' | 'chart' | 'workflow';
  onAction: (action: 'view' | 'view_data' | 'export' | 'rename' | 'delete') => void;
}

export const ItemContextMenu: React.FC<ItemContextMenuProps> = ({ x, y, itemType, onAction }) => {
  return (
    <div
      style={{ top: y, left: x }}
      className="fixed z-50 bg-white border border-slate-300 rounded-md shadow-lg text-sm py-1 animate-in fade-in-25 w-48"
      onClick={(e) => e.stopPropagation()} 
    >
      {itemType === 'report' ? (
        <button onClick={() => onAction('view')} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 text-slate-800">
          <FileText size={14} /><span>Öffnen</span>
        </button>
      ) : itemType === 'form' ? (
        <>
          <button onClick={() => onAction('view_data')} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 text-slate-800">
            <Layout size={14} /><span>Öffnen</span>
          </button>
           <button onClick={() => onAction('view')} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 text-slate-800">
            <Eye size={14} /><span>Entwurfsansicht</span>
          </button>
        </>
      ) : itemType === 'chart' ? (
        <button onClick={() => onAction('view')} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 text-slate-800">
          <PieChart size={14} /><span>Öffnen</span>
        </button>
      ) : itemType === 'workflow' ? (
        <button onClick={() => onAction('view')} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 text-slate-800">
          <GitFork size={14} /><span>Öffnen</span>
        </button>
      ) : (
        <>
          <button onClick={() => onAction('view_data')} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 text-slate-800">
            <Sheet size={14} /><span>Daten anzeigen</span>
          </button>
          <button onClick={() => onAction('view')} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 text-slate-800">
            <Eye size={14} /><span>Entwurfsansicht</span>
          </button>
        </>
      )}
      <button onClick={() => onAction('export')} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 text-slate-800">
        <Download size={14} /><span>Exportieren</span>
      </button>
      <button onClick={() => onAction('rename')} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-100 text-slate-800">
        <Edit3 size={14} /><span>Umbenennen</span>
      </button>
      <div className="my-1 border-t border-slate-200"></div>
      <button onClick={() => onAction('delete')} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-red-50 text-red-600">
        <Trash2 size={14} /><span>Löschen</span>
      </button>
    </div>
  );
};
