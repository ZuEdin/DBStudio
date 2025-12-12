import React, { useState } from 'react';
import { Table, Field, FieldType } from '../types/index';
import { Plus, Trash2, Key, Wand2 } from 'lucide-react';
import { generateTableSchema } from '../services/geminiService';

interface TableDesignerProps {
  table: Table;
  onTableChange: (table: Table) => void;
}

export const TableDesigner: React.FC<TableDesignerProps> = ({ table, onTableChange }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);
  
  const { name: tableName, fields } = table;

  const setTableName = (name: string) => {
    onTableChange({ ...table, name });
  }

  const setFields = (fields: Field[]) => {
    onTableChange({ ...table, fields });
  }

  const addField = () => {
    setFields([...fields, { id: crypto.randomUUID(), name: `Feld${fields.length + 1}`, type: 'VARCHAR' }]);
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    const schema = await generateTableSchema(aiPrompt);
    if (schema) {
      const newTable = { ...table };
      newTable.name = schema.tableName || tableName;
      if (schema.fields && Array.isArray(schema.fields)) {
        const newFields: Field[] = schema.fields.map((f: any) => ({
          id: crypto.randomUUID(),
          name: f.name,
          type: (['INTEGER', 'VARCHAR', 'TEXT', 'DATE', 'BOOLEAN'].includes(f.type) ? f.type : 'VARCHAR') as FieldType,
          isPrimaryKey: f.name.toLowerCase() === 'id'
        }));
        newTable.fields = newFields;
      }
      onTableChange(newTable);
    }
    setIsAiLoading(false);
    setShowAi(false);
  };

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto bg-white shadow-lg border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Tabellenentwurf</h2>
          <button onClick={() => setShowAi(!showAi)} className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-sm">
            <Wand2 size={14} /> AI-Entwurf
          </button>
        </div>

        {showAi && (
          <div className="p-4 bg-purple-50 border-b border-purple-100 animate-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-purple-900 mb-1">Beschreibe deine Tabelle:</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 border border-purple-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="z.B. Kunden Tabelle mit Name, Adresse, Email und Geburtsdatum"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
              />
              <button 
                onClick={handleAiGenerate}
                disabled={isAiLoading}
                className="bg-purple-600 text-white px-4 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {isAiLoading ? 'Denkt nach...' : 'Generieren'}
              </button>
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-1">Tabellenname</label>
            <input 
              type="text" 
              value={tableName} 
              onChange={(e) => setTableName(e.target.value)}
              className="w-full max-w-md border border-slate-300 rounded p-2 font-mono text-sm"
            />
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-2 w-10 text-center">PK</th>
                <th className="p-2 w-1/3">Feldname</th>
                <th className="p-2 w-1/3">Datentyp</th>
                <th className="p-2">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {fields.map((field) => (
                <tr key={field.id} className="hover:bg-slate-50">
                  <td className="p-2 text-center">
                    <button 
                      onClick={() => updateField(field.id, { isPrimaryKey: !field.isPrimaryKey })}
                      className={`hover:bg-slate-200 p-1 rounded ${field.isPrimaryKey ? 'text-yellow-600' : 'text-slate-300'}`}
                    >
                      <Key size={16} />
                    </button>
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={field.name}
                      onChange={(e) => updateField(field.id, { name: e.target.value })}
                      className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-sm"
                    />
                  </td>
                  <td className="p-2">
                    <select 
                      value={field.type}
                      onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                      className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-sm"
                    >
                      <option value="INTEGER">Zahl (Integer)</option>
                      <option value="VARCHAR">Kurzer Text (Varchar)</option>
                      <option value="TEXT">Langer Text</option>
                      <option value="DATE">Datum/Zeit</option>
                      <option value="BOOLEAN">Ja/Nein</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <button 
                      onClick={() => removeField(field.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="Feld löschen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button 
            onClick={addField}
            className="mt-4 flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-semibold"
          >
            <Plus size={16} /> Feld hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
};