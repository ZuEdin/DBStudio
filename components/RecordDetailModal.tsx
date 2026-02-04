
import React from 'react';
import { Table, Field } from '../types/index';
import { X, Database } from 'lucide-react';

interface RecordDetailModalProps {
  table: Table;
  recordId: any;
  onClose: () => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ table, recordId, onClose }) => {
  // Find record based on Primary Key (heuristically ID or first PK)
  const pkField = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
  const record = table.data?.find(r => String(r[pkField.name]) === String(recordId));

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-lg border border-slate-300 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 bg-slate-800 text-white shrink-0">
          <h3 className="font-bold flex items-center gap-2">
            <Database size={16} className="text-blue-400" />
            {table.name} <span className="opacity-50 text-xs font-normal">#{recordId}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
        </div>

        <div className="p-0 overflow-y-auto flex-1">
            {record ? (
                <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100">
                        {table.fields.map(field => (
                            <tr key={field.id} className="hover:bg-slate-50">
                                <td className="p-3 bg-slate-50 font-semibold text-slate-600 w-1/3 border-r border-slate-100">
                                    {field.name}
                                </td>
                                <td className="p-3 text-slate-800 break-all">
                                    {String(record[field.name] ?? '-')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="p-8 text-center text-slate-500">
                    Datensatz nicht gefunden.
                </div>
            )}
        </div>
        
        <div className="p-3 bg-slate-50 border-t text-right">
            <button onClick={onClose} className="px-4 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-600 hover:bg-slate-100">Schließen</button>
        </div>
      </div>
    </div>
  );
};
