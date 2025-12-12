import React from 'react';
import { Table } from '../types/index';
import { Plus, Trash2 } from 'lucide-react';

interface TableViewProps {
  table: Table;
  onTableChange: (table: Table) => void;
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
}

export const TableView: React.FC<TableViewProps> = ({ table, onTableChange, showConfirmation }) => {
  const headers = table.fields.map(field => field.name);
  const data = table.data || [];

  const handleDataChange = (rowIndex: number, header: string, value: string) => {
    const newData = data.map((row, i) => 
      i === rowIndex ? { ...row, [header]: value } : row
    );
    onTableChange({ ...table, data: newData });
  };

  const addRow = () => {
    const newRow = headers.reduce((acc, header) => {
      acc[header] = '';
      return acc;
    }, {} as Record<string, any>);
    const newData = [...data, newRow];
    onTableChange({ ...table, data: newData });
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

  return (
    <div className="p-4 sm:p-8 bg-slate-50 h-full overflow-auto">
      <div className="max-w-full mx-auto bg-white shadow-lg border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Datenblattansicht: {table.name}</h2>
          {headers.length > 0 && (
            <button
              onClick={addRow}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm font-semibold"
            >
              <Plus size={16} /> Zeile hinzufügen
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          {headers.length > 0 ? (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {headers.map(header => (
                    <th key={header} className="p-3">{header}</th>
                  ))}
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50 group">
                    {headers.map(header => (
                      <td key={`${rowIndex}-${header}`} className="p-0 text-slate-700 whitespace-nowrap">
                        <input
                          type="text"
                          value={row[header] ?? ''}
                          onChange={(e) => handleDataChange(rowIndex, header, e.target.value)}
                          className="w-full h-full p-3 border border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent focus:outline-none focus:bg-white"
                        />
                      </td>
                    ))}
                    <td className="p-1 text-center">
                      <button 
                        onClick={() => deleteRow(rowIndex)}
                        className="text-slate-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100"
                        title="Zeile löschen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
             <div className="p-6 text-center text-slate-500">
              {headers.length > 0 ? (
                <>
                  <p>Die Tabelle "{table.name}" enthält keine Daten.</p>
                  <button onClick={addRow} className="mt-2 text-blue-600 hover:underline text-sm">Klicken Sie hier, um eine neue Zeile hinzuzufügen.</button>
                </>
              ) : (
                <p>Bitte fügen Sie zuerst Felder im Tabellenentwurf hinzu, um Daten eingeben zu können.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};