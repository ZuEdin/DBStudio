
import React, { useState, useMemo } from 'react';
import { Table } from '../../../types/index';
import { Settings2 } from 'lucide-react';

interface KanbanBoardProps {
  table: Table;
  onUpdateRow: (row: any, fieldName: string, newValue: any) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ table, onUpdateRow }) => {
  const [groupBy, setGroupBy] = useState<string>('');
  const [titleField, setTitleField] = useState<string>('');
  
  // Auto-Select defaults on init
  useMemo(() => {
      const statusField = table.fields.find(f => f.name.toLowerCase().includes('status') || f.name.toLowerCase().includes('state') || f.name.toLowerCase().includes('kategorie'));
      const labelField = table.fields.find(f => f.name.toLowerCase().includes('name') || f.name.toLowerCase().includes('titel') || f.name.toLowerCase().includes('bez'));
      
      if (statusField && !groupBy) setGroupBy(statusField.name);
      else if (!groupBy && table.fields.length > 1) setGroupBy(table.fields[1].name);

      if (labelField && !titleField) setTitleField(labelField.name);
      else if (!titleField && table.fields.length > 0) setTitleField(table.fields[0].name);
  }, [table]);

  const columns = useMemo(() => {
      if (!groupBy) return [];
      const distinct = new Set<string>();
      (table.data || []).forEach(row => {
          const val = row[groupBy];
          if (val !== undefined && val !== null) distinct.add(String(val));
      });
      return Array.from(distinct).sort();
  }, [table.data, groupBy]);

  const handleDragStart = (e: React.DragEvent, row: any) => {
      // Find PK to identify row
      const pkField = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
      const id = row[pkField.name];
      e.dataTransfer.setData('text/plain', JSON.stringify({ id, pkName: pkField.name }));
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColValue: string) => {
      e.preventDefault();
      try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          const row = table.data?.find(r => String(r[data.pkName]) === String(data.id));
          
          if (row && String(row[groupBy]) !== targetColValue) {
              onUpdateRow(row, groupBy, targetColValue);
          }
      } catch (err) {
          console.error(err);
      }
  };

  if (!groupBy || !titleField) {
      return <div className="p-8 text-center text-slate-400">Bitte wählen Sie Spalten für die Gruppierung aus.</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
        {/* Toolbar */}
        <div className="flex gap-4 p-2 bg-slate-100 border-b border-slate-200 items-center text-sm">
            <div className="flex items-center gap-2">
                <Settings2 size={14} className="text-slate-500"/>
                <span className="font-bold text-slate-600">Board Config:</span>
            </div>
            <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 uppercase font-bold">Spalten (Status):</label>
                <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="border rounded px-2 py-1 text-xs bg-white">
                    {table.fields.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
            </div>
            <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 uppercase font-bold">Karten-Titel:</label>
                <select value={titleField} onChange={e => setTitleField(e.target.value)} className="border rounded px-2 py-1 text-xs bg-white">
                    {table.fields.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
            </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 bg-slate-200">
            <div className="flex h-full gap-4">
                {columns.map(colVal => (
                    <div 
                        key={colVal} 
                        className="w-72 flex flex-col bg-slate-100 rounded-lg shadow-sm border border-slate-300 max-h-full"
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => handleDrop(e, colVal)}
                    >
                        <div className="p-3 font-bold text-slate-700 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-lg">
                            <span className="truncate">{colVal || 'Ohne Wert'}</span>
                            <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                                {table.data?.filter(r => String(r[groupBy]) === colVal).length}
                            </span>
                        </div>
                        <div className="p-2 flex-1 overflow-y-auto space-y-2">
                            {table.data?.filter(r => String(r[groupBy]) === colVal).map((row, idx) => (
                                <div 
                                    key={idx} 
                                    draggable
                                    onDragStart={e => handleDragStart(e, row)}
                                    className="bg-white p-3 rounded border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 transition-all group"
                                >
                                    <div className="font-bold text-sm text-slate-800 mb-1">
                                        {row[titleField]}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate">
                                        {Object.keys(row).filter(k => k !== groupBy && k !== titleField && k !== 'Id').slice(0, 2).map(k => `${k}: ${row[k]}`).join(' | ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {columns.length === 0 && (
                    <div className="m-auto text-slate-400">Keine Gruppen gefunden. Prüfen Sie die Daten.</div>
                )}
            </div>
        </div>
    </div>
  );
};
