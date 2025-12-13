
import React from 'react';
import { Table } from '../types/index';
import { Plus, Trash2 } from 'lucide-react';
import { VirtualTable } from '../components/VirtualTable';

interface TableViewProps {
  table: Table;
  onTableChange: (table: Table) => void;
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
}

export const TableView: React.FC<TableViewProps> = ({ table, onTableChange, showConfirmation }) => {
  const headers = table.fields.map(field => field.name);
  const data = table.data || [];

  const handleDataChange = (rowIndex: number, header: string, value: string) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [header]: value };
    onTableChange({ ...table, data: newData });
  };

  const addRow = () => {
    const newRow = headers.reduce((acc, header) => {
      acc[header] = '';
      return acc;
    }, {} as Record<string, any>);
    onTableChange({ ...table, data: [...data, newRow] });
  };

  const deleteRow = (rowIndex: number) => {
    showConfirmation(
      'Zeile löschen',
      'Möchten Sie diese Zeile wirklich löschen?',
      () => {
        const newData = data.filter((_, index) => index !== rowIndex);
        onTableChange({ ...table, data: newData });
      }
    );
  };

  const renderRow = (row: any, rowIndex: number) => (
      <div className="flex border-b border-slate-100 hover:bg-sky-50 group h-full items-center text-sm text-slate-700">
          {headers.map(header => (
              <div key={`${rowIndex}-${header}`} className="w-40 shrink-0 border-r border-slate-100 h-full">
                  <input
                    type="text"
                    value={row[header] ?? ''}
                    onChange={(e) => handleDataChange(rowIndex, header, e.target.value)}
                    className="w-full h-full px-2 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500"
                  />
              </div>
          ))}
          <div className="w-10 shrink-0 flex justify-center">
              <button 
                onClick={() => deleteRow(rowIndex)}
                className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
          </div>
      </div>
  );

  return (
    <div className="p-4 sm:p-8 bg-slate-50 h-full flex flex-col overflow-hidden">
      <div className="bg-white border border-b-0 border-slate-200 rounded-t-lg px-4 py-2 flex justify-between items-center shrink-0">
          <h2 className="font-bold text-slate-700">{table.name} <span className="text-xs font-normal text-slate-400">({data.length} Zeilen)</span></h2>
          <button
              onClick={addRow}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-semibold"
            >
              <Plus size={14} /> Neu
            </button>
      </div>
      <div className="flex-1 overflow-hidden shadow-lg rounded-b-lg">
          <VirtualTable 
            data={data}
            headers={headers}
            renderRow={renderRow}
            rowHeight={32}
          />
      </div>
    </div>
  );
};
