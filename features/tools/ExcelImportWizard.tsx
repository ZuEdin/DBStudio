
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Table, Field, FieldType } from '../../types/index';
import { X, Upload, ArrowRight, Check, Database, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { inferFieldType } from '../../utils/apiImportHelper';

import md5 from 'md5';

interface ExcelImportWizardProps {
  onSave: (table: Table) => void;
  onClose: () => void;
}

interface ColumnMapping {
  index: number;
  originalName: string;
  targetName: string;
  type: FieldType;
  selected: boolean;
  sampleValue: any;
  md5Hash?: boolean;
}

export const ExcelImportWizard: React.FC<ExcelImportWizardProps> = ({ onSave, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<any[][]>([]); // Array of Arrays
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [tableName, setTableName] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    processFile(uploadedFile);
  };

  const processFile = (f: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        // Read as array of arrays to handle headers manually
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        if (data.length === 0) {
            alert("Die Datei scheint leer zu sein.");
            setLoading(false);
            return;
        }

        const headers = data[0]; // First row as headers
        const samples = data.length > 1 ? data[1] : []; // Second row for type inference

        // Generate Initial Mappings
        const newMappings: ColumnMapping[] = headers.map((h, idx) => {
            const val = samples[idx];
            return {
                index: idx,
                originalName: String(h || `Spalte ${idx + 1}`),
                targetName: String(h || `Spalte${idx + 1}`).replace(/[^a-zA-Z0-9_]/g, ''),
                type: inferFieldType(val),
                selected: true,
                sampleValue: val
            };
        });

        setRawRows(data.slice(1)); // Store data without header
        setMappings(newMappings);
        setTableName(f.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, ''));
        setStep(2);
      } catch (err) {
        console.error(err);
        alert("Fehler beim Lesen der Datei.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(f);
  };

  const updateMapping = (index: number, updates: Partial<ColumnMapping>) => {
      setMappings(prev => prev.map(m => m.index === index ? { ...m, ...updates } : m));
  };

  const toggleSelection = (index: number) => {
      const m = mappings.find(x => x.index === index);
      if (m) updateMapping(index, { selected: !m.selected });
  };

  const handleFinish = () => {
      if (!tableName) return alert("Bitte Tabellennamen angeben.");
      
      const selectedMappings = mappings.filter(m => m.selected);
      if (selectedMappings.length === 0) return alert("Bitte mindestens eine Spalte auswählen.");

      // 1. Create Fields
      const fields: Field[] = [];
      
      // Auto-Add ID if not present (Best Practice)
      const hasId = selectedMappings.some(m => m.targetName.toLowerCase() === 'id');
      if (!hasId) {
          fields.push({ id: crypto.randomUUID(), name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true });
      }

      selectedMappings.forEach(m => {
          fields.push({
              id: crypto.randomUUID(),
              name: m.targetName,
              type: m.type,
              isPrimaryKey: false, // Imported data usually doesn't carry PK logic easily
              allowNull: true
          });
      });

      // 2. Map Data
      const importedData = rawRows.map(row => {
          const rowObj: any = {};
          // If we added an artificial ID, we need to generate it? 
          // No, usually TableView auto-handles display, but strictly speaking the data array should ideally match.
          // However, our system is flexible. If ID is AutoInc, we can calculate it or let backend handle it.
          // For local "in-memory" DB, let's generate IDs if we added the column.
          
          selectedMappings.forEach(m => {
              let val = row[m.index];
              // Basic Type Conversion
              if (m.type === 'INTEGER') val = parseInt(val) || 0;
              else if (m.type === 'DECIMAL' || m.type === 'DOUBLE') val = parseFloat(val) || 0.0;
              else if (m.type === 'BOOLEAN') val = (String(val).toLowerCase() === 'true' || val === 1);
              else val = String(val ?? '');
              
              if (m.md5Hash) {
                  val = md5(String(val));
              }

              rowObj[m.targetName] = val;
          });
          return rowObj;
      });

      // Fill IDs if artificial
      if (!hasId) {
          importedData.forEach((row, i) => row['Id'] = i + 1);
      }

      const newTable: Table = {
          id: crypto.randomUUID(),
          name: tableName,
          fields: fields,
          data: importedData
      };

      onSave(newTable);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl border border-slate-300 flex flex-col h-[80vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-green-700 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
               <FileSpreadsheet className="text-green-200"/> Excel Import Assistent
            </h2>
            <p className="text-green-100 text-sm mt-1">Schritt {step} von 3: {step === 1 ? 'Datei wählen' : step === 2 ? 'Spalten zuweisen' : 'Abschließen'}</p>
          </div>
          <button onClick={onClose} className="text-green-200 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-50 p-8 overflow-hidden flex flex-col">
            
            {step === 1 && (
                <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-slate-300 rounded-xl bg-slate-100 hover:bg-white transition-colors gap-4">
                    <div className="p-6 bg-green-100 rounded-full text-green-600">
                        <Upload size={48} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-slate-700">Excel-Datei hier ablegen</h3>
                        <p className="text-slate-500 text-sm">oder klicken zum Auswählen (.xlsx, .csv)</p>
                    </div>
                    <input 
                        type="file" 
                        accept=".xlsx, .xls, .csv" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload}
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold shadow-md transition-all"
                    >
                        {loading ? 'Lese Datei...' : 'Datei wählen'}
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="flex flex-col h-full gap-4">
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-800 flex gap-2 items-start">
                        <Database size={16} className="mt-0.5 shrink-0"/>
                        <div>
                            Wählen Sie die Spalten aus, die Sie importieren möchten. Sie können Namen und Datentypen anpassen.
                            Nicht ausgewählte Spalten werden ignoriert.
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto border border-slate-300 rounded bg-white shadow-inner">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    {mappings.map((map, i) => (
                                        <th key={i} className={`p-2 border-b border-r border-slate-200 min-w-[180px] bg-slate-50 transition-colors ${!map.selected ? 'opacity-50 bg-slate-100' : ''}`}>
                                            {/* Configuration Block per Column */}
                                            <div className="flex flex-col gap-2">
                                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={map.selected} 
                                                        onChange={() => toggleSelection(map.index)}
                                                        className="rounded text-green-600 focus:ring-green-500"
                                                    />
                                                    <span className={`text-xs font-bold uppercase ${map.selected ? 'text-green-700' : 'text-slate-400'}`}>
                                                        {map.selected ? 'Importieren' : 'Ignorieren'}
                                                    </span>
                                                </label>
                                                
                                                <input 
                                                    type="text" 
                                                    value={map.targetName} 
                                                    disabled={!map.selected}
                                                    onChange={e => updateMapping(map.index, { targetName: e.target.value })}
                                                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm font-bold text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                                                    placeholder="Spaltenname"
                                                />

                                                <select 
                                                    value={map.type}
                                                    disabled={!map.selected}
                                                    onChange={e => updateMapping(map.index, { type: e.target.value as FieldType })}
                                                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white disabled:bg-slate-100 disabled:text-slate-400"
                                                >
                                                    <option value="VARCHAR">Text (Kurz)</option>
                                                    <option value="TEXT">Text (Lang)</option>
                                                    <option value="INTEGER">Ganzzahl</option>
                                                    <option value="DECIMAL">Kommazahl</option>
                                                    <option value="DATE">Datum (DATE)</option>
                                                    <option value="TIME">Uhrzeit (TIME)</option>
                                                    <option value="DATETIME">Datum & Zeit (DATETIME)</option>
                                                    <option value="TIMESTAMP">Zeitstempel (TIMESTAMP)</option>
                                                    <option value="BOOLEAN">Ja/Nein</option>
                                                    <option value="ENUM">Auswahl (Enum)</option>
                                                </select>
                                                
                                                <div className="text-[10px] text-slate-400 truncate" title={`Original: ${map.originalName}`}>
                                                    Orig: {map.originalName}
                                                </div>
                                                {(map.type === 'VARCHAR' || map.type === 'TEXT') && (
                                                    <label className={`flex items-center gap-1 cursor-pointer select-none mt-1 ${!map.selected ? 'opacity-50 pointer-events-none' : ''}`}>
                                                        <input 
                                                            type="checkbox" 
                                                            disabled={!map.selected}
                                                            checked={!!map.md5Hash}
                                                            onChange={e => updateMapping(map.index, { md5Hash: e.target.checked })}
                                                            className="rounded w-3 h-3 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-[10px] font-bold text-slate-600">MD5 Hash (Passwort)</span>
                                                    </label>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rawRows.slice(0, 5).map((row, rIdx) => (
                                    <tr key={rIdx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                        {mappings.map((map, cIdx) => (
                                            <td key={cIdx} className={`p-2 text-sm text-slate-600 border-r border-slate-100 truncate max-w-[180px] ${!map.selected ? 'opacity-30 bg-slate-50' : ''}`}>
                                                {String(row[cIdx] ?? '')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="text-xs text-slate-400 text-right">Zeige Vorschau der ersten 5 Zeilen.</div>
                </div>
            )}

            {step === 3 && (
                <div className="flex flex-col items-center justify-center h-full gap-6 max-w-lg mx-auto w-full">
                    <div className="bg-green-50 p-6 rounded-full text-green-600 mb-4 animate-in zoom-in">
                        <Check size={48} />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-slate-800">Fast fertig!</h3>
                    <p className="text-slate-500 text-center">
                        Wir haben {mappings.filter(m => m.selected).length} Spalten zum Import vorbereitet.
                        Wie soll die neue Tabelle heißen?
                    </p>

                    <div className="w-full">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tabellenname</label>
                        <input 
                            type="text" 
                            value={tableName}
                            onChange={e => setTableName(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="z.B. ImportierteKunden"
                            autoFocus
                        />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800 flex gap-2 w-full">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5"/>
                        <div>
                            <strong>Hinweis:</strong> Die Tabelle wird lokal im Projekt gespeichert. 
                            Stellen Sie sicher, dass der Name eindeutig ist.
                        </div>
                    </div>
                </div>
            )}

        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-slate-200 flex justify-between shrink-0">
            {step > 1 ? (
                <button onClick={() => setStep(prev => (prev - 1) as any)} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium border border-slate-300">
                    Zurück
                </button>
            ) : (
                <div></div>
            )}

            {step === 2 && (
                <button onClick={() => setStep(3)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold shadow-md flex items-center gap-2">
                    Weiter <ArrowRight size={18}/>
                </button>
            )}
            
            {step === 3 && (
                <button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded font-bold shadow-md flex items-center gap-2">
                    <Database size={18}/> Import Abschließen
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
