import React, { useRef } from 'react';
import { Table } from '../../types/index';
import { Plus, Trash2, Upload } from 'lucide-react';

interface TableViewProps {
  table: Table;
  onTableChange: (table: Table) => void;
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
}

export const TableView: React.FC<TableViewProps> = ({ table, onTableChange, showConfirmation }) => {
  const headers = table.fields.map(field => field.name);
  const data = table.data || [];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDataChange = (rowIndex: number, header: string, value: string) => {
    const newData = data.map((row, i) => 
      i === rowIndex ? { ...row, [header]: value } : row
    );
    onTableChange({ ...table, data: newData });
  };

  const addRow = () => {
    // Logic to calculate Auto-Increment values
    const newRow = headers.reduce((acc, header) => {
      const field = table.fields.find(f => f.name === header);
      
      if (field?.isAutoIncrement && field.type === 'INTEGER') {
          // Find max value in this column
          const maxVal = data.reduce((max, row) => {
              const val = parseInt(row[header], 10);
              return !isNaN(val) && val > max ? val : max;
          }, 0);
          acc[header] = maxVal + 1;
      } else {
          acc[header] = '';
      }
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

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const csvHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      const newRows: Record<string, any>[] = [];
      
      // Simple CSV parser (does not handle commas inside quotes perfectly, but sufficient for basic usage)
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        
        if (values.length === csvHeaders.length) {
          const row: Record<string, any> = {};
          // Try to map CSV headers to Table fields (case insensitive)
          table.fields.forEach(field => {
             const index = csvHeaders.findIndex(h => h.toLowerCase() === field.name.toLowerCase());
             if (index !== -1) {
               row[field.name] = values[index];
             } else {
               row[field.name] = ''; // Default for missing column
             }
          });
          newRows.push(row);
        }
      }

      if (newRows.length > 0) {
        onTableChange({ ...table, data: [...data, ...newRows] });
        alert(`${newRows.length} Zeilen erfolgreich importiert.`);
      } else {
        alert('Keine gültigen Daten gefunden oder Header stimmen nicht überein.');
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 sm:p-8 bg-slate-50 h-full overflow-auto">
      <div className="max-w-full mx-auto bg-white shadow-lg border border-slate-200 rounded-lg overflow-hidden flex flex-col h-full">
        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold">Datenblattansicht: {table.name}</h2>
          <div className="flex gap-2">
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImportCSV} 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm border border-slate-600"
              title="CSV-Datei importieren (Header müssen Feldnamen entsprechen)"
            >
              <Upload size={16} /> CSV Import
            </button>
            <button
              onClick={addRow}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm font-semibold"
            >
              <Plus size={16} /> Zeile hinzufügen
            </button>
          </div>
        </div>
        <div className="overflow-auto flex-1">
          {headers.length > 0 ? (
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-slate-100 border-b border-slate-300 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {headers.map(header => (
                    <th key={header} className="p-3 bg-slate-100">{header}</th>
                  ))}
                  <th className="p-3 w-10 bg-slate-100"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50 group">
                    {headers.map(header => {
                      const field = table.fields.find(f => f.name === header);
                      const isAutoInc = field?.isAutoIncrement;
                      
                      return (
                      <td key={`${rowIndex}-${header}`} className={`p-0 text-slate-700 whitespace-nowrap ${isAutoInc ? 'bg-slate-50' : ''}`}>
                        <input
                          type="text"
                          value={row[header] ?? ''}
                          onChange={(e) => handleDataChange(rowIndex, header, e.target.value)}
                          readOnly={isAutoInc}
                          className={`w-full h-full p-3 border border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent focus:outline-none focus:bg-white ${isAutoInc ? 'text-slate-400 cursor-not-allowed italic' : ''}`}
                        />
                      </td>
                    )})}
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
        <div className="bg-slate-50 border-t border-slate-200 p-2 text-xs text-slate-500 text-right">
           {data.length} Datensätze
        </div>
      </div>
    </div>
  );
};