
import React, { useState } from 'react';
import { Table, Field } from '../../types/index';
import { X, Wand2, Database } from 'lucide-react';

interface DummyDataWizardProps {
  tables: Table[];
  onGenerate: (table: Table) => void;
  onClose: () => void;
}

export const DummyDataWizard: React.FC<DummyDataWizardProps> = ({ tables, onGenerate, onClose }) => {
  const [selectedTableId, setSelectedTableId] = useState(tables[0]?.id || '');
  const [amount, setAmount] = useState(10);
  
  const selectedTable = tables.find(t => t.id === selectedTableId);

  const generateRandomValue = (field: Field) => {
      const name = field.name.toLowerCase();
      
      if (field.isAutoIncrement) return null; // Skip

      if (field.type === 'BOOLEAN') return Math.random() > 0.5;
      
      if (field.type === 'INTEGER' || field.type === 'DECIMAL' || field.type === 'DOUBLE') {
          if (name.includes('price') || name.includes('preis')) return (Math.random() * 1000).toFixed(2);
          if (name.includes('qty') || name.includes('menge') || name.includes('anzahl')) return Math.floor(Math.random() * 100);
          if (name.includes('id') && !field.isPrimaryKey) return 1; // FK Mock
          return Math.floor(Math.random() * 1000);
      }

      if (field.type === 'DATE' || field.type === 'DATETIME') {
          const start = new Date(2020, 0, 1);
          const end = new Date();
          const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
          if (field.type === 'DATE') return d.toISOString().split('T')[0];
          return d.toISOString().slice(0, 19).replace('T', ' ');
      }

      // Strings (Heuristics)
      const firstNames = ['Max', 'Erika', 'Tom', 'Lisa', 'John', 'Sarah', 'Tim', 'Anna'];
      const lastNames = ['Mustermann', 'Müller', 'Schmidt', 'Doe', 'Smith', 'Wick', 'Taylor'];
      const cities = ['Berlin', 'München', 'Hamburg', 'Wels', 'Wien', 'London', 'New York'];
      const companies = ['Acme Corp', 'Global Ltd', 'Tech Solutions', 'Paper Inc', 'SoftWarez'];
      const streets = ['Hauptstr.', 'Nebenweg', 'Bahnhofsallee', 'Dorfplatz'];
      const statuses = ['Active', 'Inactive', 'Pending', 'Done'];
      const categories = ['Hardware', 'Software', 'Service', 'Other'];

      const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

      if (name.includes('email') || name.includes('mail')) return `${rand(firstNames).toLowerCase()}.${rand(lastNames).toLowerCase()}@example.com`;
      if (name.includes('first') || name.includes('vorname')) return rand(firstNames);
      if (name.includes('last') || name.includes('nachname')) return rand(lastNames);
      if (name.includes('name') || name.includes('user')) return `${rand(firstNames)} ${rand(lastNames)}`;
      if (name.includes('company') || name.includes('firma')) return rand(companies);
      if (name.includes('city') || name.includes('stadt') || name.includes('ort')) return rand(cities);
      if (name.includes('street') || name.includes('strasse')) return `${rand(streets)} ${Math.floor(Math.random() * 100)}`;
      if (name.includes('status')) return rand(statuses);
      if (name.includes('cat') || name.includes('kategorie')) return rand(categories);
      if (name.includes('phone') || name.includes('tel')) return `+49 123 45678${Math.floor(Math.random()*10)}`;
      if (name.includes('desc') || name.includes('beschreibung')) return 'Lorem ipsum dolor sit amet.';

      return `Test-${Math.floor(Math.random() * 1000)}`;
  };

  const handleRun = () => {
      if (!selectedTable) return;
      
      const newRows: any[] = [];
      const autoIncFields = selectedTable.fields.filter(f => f.isAutoIncrement && f.type === 'INTEGER');
      
      // Calculate next IDs
      const nextAutoIncValues: Record<string, number> = {};
      autoIncFields.forEach(f => {
          const maxVal = (selectedTable.data || []).reduce((max, row) => {
              const val = parseInt(row[f.name], 10);
              return !isNaN(val) && val > max ? val : max;
          }, 0);
          nextAutoIncValues[f.name] = maxVal + 1;
      });

      for (let i = 0; i < amount; i++) {
          const row: any = {};
          selectedTable.fields.forEach(f => {
              if (f.isAutoIncrement) {
                  row[f.name] = nextAutoIncValues[f.name]++;
              } else {
                  row[f.name] = generateRandomValue(f);
              }
          });
          newRows.push(row);
      }

      const updatedTable = { ...selectedTable, data: [...(selectedTable.data || []), ...newRows] };
      onGenerate(updatedTable);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-300 overflow-hidden">
        <div className="p-5 bg-purple-800 text-white flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2"><Wand2 className="text-purple-300"/> Testdaten Generator</h3>
            <button onClick={onClose}><X size={20}/></button>
        </div>
        
        <div className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Zieltabelle</label>
                <div className="flex items-center gap-2 border border-slate-300 rounded p-2 bg-slate-50">
                    <Database size={16} className="text-slate-400"/>
                    <select 
                        value={selectedTableId} 
                        onChange={e => setSelectedTableId(e.target.value)}
                        className="bg-transparent outline-none flex-1 text-sm"
                    >
                        {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Anzahl der Einträge: {amount}</label>
                <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={amount} 
                    onChange={e => setAmount(parseInt(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>1</span>
                    <span>50</span>
                    <span>100</span>
                </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 p-3 rounded text-xs text-purple-800">
                Der Generator analysiert die Feldnamen (z.B. "Email", "Stadt", "Datum") und versucht, passende realistische Daten zu erzeugen.
            </div>
        </div>

        <div className="p-5 bg-slate-50 border-t flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded">Abbrechen</button>
            <button onClick={handleRun} className="px-6 py-2 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded font-bold shadow-md flex items-center gap-2">
                <Wand2 size={16}/> Generieren
            </button>
        </div>
      </div>
    </div>
  );
};
