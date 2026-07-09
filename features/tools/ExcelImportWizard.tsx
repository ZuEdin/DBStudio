
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Table, Field, FieldType, Relationship } from '../../types/index';
import { X, Upload, ArrowRight, Check, Database, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { inferFieldType } from '../../utils/apiImportHelper';

import md5 from 'md5';

interface ExcelImportWizardProps {
  tables?: Table[];
  onSave: (table: Table, newRelations?: Relationship[]) => void;
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
  isPrimaryKey?: boolean;
  enumValues?: string[];
}

// Convert Excel serial number, JS Date, or parseable string to target date format
const convertValueToDateFormat = (val: any, targetType: 'DATE' | 'DATETIME' | 'TIMESTAMP'): string => {
  if (val === undefined || val === null || val === '') return '';
  
  let d: Date | null = null;
  
  if (val instanceof Date) {
    d = val;
  } else {
    const num = Number(val);
    // Excel serial date: usually between 1 and 100000
    if (!isNaN(num) && num > 1 && num < 100000) {
      // 25569 is 1970-01-01
      const utc_days = Math.floor(num - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);

      const fractional_day = num - Math.floor(num) + 0.0000001;
      const total_seconds = Math.floor(86400 * fractional_day);

      const seconds = total_seconds % 60;
      const minutes = Math.floor(total_seconds / 60) % 60;
      const hours = Math.floor(total_seconds / 3600);

      d = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
    } else {
      const strVal = String(val).trim();
      // Keep already formatted to avoid conversion shifts
      if (strVal.match(/^\d{4}-\d{2}-\d{2}$/) && targetType === 'DATE') {
        return strVal;
      }
      if (strVal.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/) && (targetType === 'DATETIME' || targetType === 'TIMESTAMP')) {
        return strVal;
      }

      const parsed = Date.parse(strVal);
      if (!isNaN(parsed)) {
        d = new Date(parsed);
      }
    }
  }

  if (!d || isNaN(d.getTime())) {
    return String(val); // Fallback to raw
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  if (targetType === 'DATE') {
    return `${year}-${month}-${day}`;
  } else {
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
};

export const ExcelImportWizard: React.FC<ExcelImportWizardProps> = ({ tables, onSave, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<any[][]>([]); // Array of Arrays
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [tableName, setTableName] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sheet states
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);

  // Suggested SVERWEIS relations: index -> { toTableId, toFieldId }
  const [suggestedRelations, setSuggestedRelations] = useState<Record<number, { toTableId: string, toFieldId: string }>>({});

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    processFile(uploadedFile);
  };

  const processSheet = (wb: XLSX.WorkBook, sheetName: string, fileName: string) => {
    const ws = wb.Sheets[sheetName];
    // Read as array of arrays to handle headers manually
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    
    if (data.length === 0) {
        alert("Das ausgewählte Arbeitsblatt scheint leer zu sein.");
        return;
    }

    const headers = data[0] || []; // First row as headers
    const samples = data.length > 1 ? data[1] : []; // Second row for type inference

    // Generate Initial Mappings and smart Enum detection
    const newMappings: ColumnMapping[] = headers.map((h, idx) => {
        const val = samples[idx];
        const originalName = String(h || `Spalte ${idx + 1}`);
        const targetName = String(h || `Spalte${idx + 1}`).replace(/[^a-zA-Z0-9_]/g, '');
        
        // Smart ENUM detection: extract non-empty values from all rows for this column
        const colValues = data.slice(1).map(row => row[idx]).filter(v => v !== undefined && v !== null && String(v).trim() !== '');
        const uniqueValues = Array.from(new Set(colValues)).map(v => String(v).trim());
        
        let inferredType = inferFieldType(val);
        let enumValues: string[] | undefined = undefined;
        
        // If unique options are <= 15 and we have at least 3 rows, propose ENUM with options!
        if (uniqueValues.length > 0 && uniqueValues.length <= 15 && data.length >= 4) {
            inferredType = 'ENUM';
            enumValues = uniqueValues;
        }

        return {
            index: idx,
            originalName,
            targetName,
            type: inferredType,
            selected: true,
            sampleValue: val,
            isPrimaryKey: false,
            enumValues
        };
    });

    // Smart SVERWEIS detection
    const newSuggestedRelations: Record<number, { toTableId: string, toFieldId: string }> = {};
    if (tables && tables.length > 0) {
        newMappings.forEach(m => {
            const colNameLower = m.targetName.toLowerCase();
            for (const t of tables) {
                const tableNameLower = t.name.toLowerCase();
                const pkField = t.fields.find(f => f.isPrimaryKey) || t.fields[0];
                
                if (colNameLower === tableNameLower || 
                    colNameLower === `${tableNameLower}id` || 
                    colNameLower === `${tableNameLower}_id` ||
                    colNameLower === `fk_${tableNameLower}` ||
                    (pkField && colNameLower === pkField.name.toLowerCase())) {
                    
                    if (pkField) {
                        newSuggestedRelations[m.index] = {
                            toTableId: t.id,
                            toFieldId: pkField.id
                        };
                        break;
                    }
                }
            }
        });
    }
    setSuggestedRelations(newSuggestedRelations);

    // Pre-convert column rows if they are inferred as Date/Datetime
    const rawSliced = data.slice(1);
    const processedRows = rawSliced.map(row => {
      const newRow = [...row];
      newMappings.forEach(m => {
        if (m.type === 'DATE' || m.type === 'DATETIME' || m.type === 'TIMESTAMP') {
          newRow[m.index] = convertValueToDateFormat(newRow[m.index], m.type);
        }
      });
      return newRow;
    });

    setRawRows(processedRows);
    setMappings(newMappings);
    const sanitizedSheetName = sheetName.replace(/[^a-zA-Z0-9]/g, '');
    setTableName(sanitizedSheetName || fileName.split('.')[0].replace(/[^a-zA-Z0-9]/g, ''));
  };

  const processFile = (f: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        // Use cellDates: true to let xlsx automatically read Excel date formatting as JS Date objects
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        
        const firstSheet = wb.SheetNames[0];
        setSelectedSheet(firstSheet);
        
        processSheet(wb, firstSheet, f.name);

        if (wb.SheetNames.length === 1) {
            setStep(2);
        }
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

  const handleTypeChange = (index: number, newType: FieldType) => {
      updateMapping(index, { type: newType });
      if (newType === 'DATE' || newType === 'DATETIME' || newType === 'TIMESTAMP') {
          setRawRows(prev => prev.map(row => {
              const newRow = [...row];
              newRow[index] = convertValueToDateFormat(newRow[index], newType);
              return newRow;
          }));
      }
  };

  const toggleSelection = (index: number) => {
      const m = mappings.find(x => x.index === index);
      if (m) {
          updateMapping(index, { selected: !m.selected });
          if (m.isPrimaryKey && m.selected) { // It's currently PK and we're turning it off (since m.selected is true currently, !m.selected will be false)
             updateMapping(index, { selected: false, isPrimaryKey: false });
          }
      }
  };

  const setPrimaryKey = (index: number) => {
      setMappings(prev => prev.map(m => m.index === index ? { ...m, isPrimaryKey: true } : { ...m, isPrimaryKey: false }));
  };

  const handleFinish = () => {
      if (!tableName) return alert("Bitte Tabellennamen angeben.");
      
      const selectedMappings = mappings.filter(m => m.selected);
      if (selectedMappings.length === 0) return alert("Bitte mindestens eine Spalte auswählen.");

      const newTableId = crypto.randomUUID();

      // 1. Create Fields
      const fields: Field[] = [];
      const fieldIdMap: Record<number, string> = {}; // map column index to field ID
      
      const pkMapping = selectedMappings.find(m => m.isPrimaryKey);
      const hasId = selectedMappings.some(m => m.targetName.toLowerCase() === 'id');
      
      let needsAutoId = false;

      if (!pkMapping) {
          if (!hasId) {
              needsAutoId = true;
              fields.push({ id: crypto.randomUUID(), name: 'id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true });
          }
      }

      selectedMappings.forEach(m => {
          const isPK = m.isPrimaryKey || (!pkMapping && m.targetName.toLowerCase() === 'id');
          const fieldId = crypto.randomUUID();
          fieldIdMap[m.index] = fieldId;

          fields.push({
              id: fieldId,
              name: m.targetName,
              type: m.type,
              isPrimaryKey: isPK,
              allowNull: !isPK,
              enumValues: m.type === 'ENUM' ? m.enumValues : undefined
          });
      });

      // 2. Map Data
      const importedData = rawRows.map(row => {
          const rowObj: any = {};
          
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
      if (needsAutoId) {
          importedData.forEach((row, i) => row['id'] = i + 1);
      }

      const newTable: Table = {
          id: newTableId,
          name: tableName,
          fields: fields,
          data: importedData
      };

      // 3. Construct relations to save
      const newRelations: Relationship[] = [];
      selectedMappings.forEach(m => {
          const relInfo = suggestedRelations[m.index];
          if (relInfo) {
              newRelations.push({
                  id: crypto.randomUUID(),
                  fromTableId: newTableId,
                  fromFieldId: fieldIdMap[m.index],
                  toTableId: relInfo.toTableId,
                  toFieldId: relInfo.toFieldId,
                  type: '1:n',
                  referentialIntegrity: false
              });
          }
      });

      onSave(newTable, newRelations);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl border border-slate-300 flex flex-col h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-green-700 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
               <FileSpreadsheet className="text-green-200"/> Excel Import Assistent
            </h2>
            <p className="text-green-100 text-sm mt-1">Schritt {step} von 3: {step === 1 ? 'Datei & Arbeitsblatt wählen' : step === 2 ? 'Spalten zuweisen' : 'Abschließen'}</p>
          </div>
          <button onClick={onClose} className="text-green-200 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-50 p-6 overflow-hidden flex flex-col">
            
            {step === 1 && !workbook && (
                <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-slate-300 rounded-xl bg-slate-100 hover:bg-white transition-colors gap-4">
                    <div className="p-6 bg-green-100 rounded-full text-green-600">
                        <Upload size={48} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-slate-700">Excel-Datei hier ablegen</h3>
                        <p className="text-slate-500 text-sm">oder klicken zum Auswählen (.xlsx, .xls, .csv)</p>
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

            {step === 1 && workbook && sheetNames.length > 1 && (
                 <div className="flex flex-col h-full gap-6 max-w-2xl mx-auto justify-center">
                     <div className="text-center">
                         <div className="inline-block p-4 bg-green-100 text-green-700 rounded-full mb-3 animate-pulse">
                             <FileSpreadsheet size={32} />
                         </div>
                         <h3 className="text-xl font-bold text-slate-800">Mehrere Arbeitsblätter gefunden</h3>
                         <p className="text-slate-500 text-sm mt-1">
                             Die Datei <strong>{file?.name}</strong> enthält mehrere Mappenblätter. Welches Arbeitsblatt möchten Sie importieren?
                         </p>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto p-2">
                         {sheetNames.map((sheetName, sIdx) => (
                             <button
                                 key={sIdx}
                                 onClick={() => {
                                     setSelectedSheet(sheetName);
                                     processSheet(workbook, sheetName, file?.name || '');
                                     setStep(2);
                                 }}
                                 className="flex items-center gap-3 p-4 bg-white border border-slate-200 hover:border-green-500 hover:bg-green-50/50 rounded-xl transition-all shadow-sm text-left group"
                             >
                                 <div className="p-2 bg-slate-100 group-hover:bg-green-100 text-slate-500 group-hover:text-green-600 rounded-lg shrink-0">
                                     <FileSpreadsheet size={18} />
                                 </div>
                                 <div className="min-w-0 flex-1">
                                     <p className="text-sm font-bold text-slate-700 truncate group-hover:text-green-800">{sheetName}</p>
                                     <p className="text-xs text-slate-400">Arbeitsblatt {sIdx + 1}</p>
                                 </div>
                             </button>
                         ))}
                     </div>
                     
                     <button
                         onClick={() => { setWorkbook(null); setSheetNames([]); setFile(null); }}
                         className="text-xs text-slate-400 hover:text-slate-600 text-center underline"
                     >
                         Andere Datei wählen
                     </button>
                 </div>
            )}

            {step === 2 && (
                <div className="flex flex-col h-full gap-4">
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-800 flex flex-wrap justify-between items-center gap-4">
                        <div className="flex gap-2 items-start flex-1 min-w-[280px]">
                            <Database size={16} className="mt-0.5 shrink-0 text-blue-600"/>
                            <div>
                                Wählen Sie die Spalten aus, die Sie importieren möchten. Sie können Namen und Datentypen anpassen.
                                Nicht ausgewählte Spalten werden ignoriert.
                            </div>
                        </div>
                        {sheetNames.length > 1 && (
                            <div className="flex items-center gap-2 shrink-0 bg-white border border-slate-200 p-1.5 rounded-lg shadow-sm">
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                    <FileSpreadsheet size={12} className="text-green-600"/> Arbeitsblatt:
                                </span>
                                <select
                                    value={selectedSheet}
                                    onChange={(e) => {
                                        const sheetName = e.target.value;
                                        setSelectedSheet(sheetName);
                                        if (workbook) {
                                            processSheet(workbook, sheetName, file?.name || '');
                                        }
                                    }}
                                    className="text-xs font-bold bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-700 cursor-pointer hover:bg-slate-100 outline-none"
                                >
                                    {sheetNames.map((n, i) => (
                                        <option key={i} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto border border-slate-300 rounded bg-white shadow-inner">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    {mappings.map((map, i) => (
                                        <th key={i} className={`p-3 border-b border-r border-slate-200 min-w-[240px] bg-slate-50 transition-colors align-top ${!map.selected ? 'opacity-50 bg-slate-100' : ''}`}>
                                            {/* Configuration Block per Column */}
                                            <div className="flex flex-col gap-2 text-left">
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
                                                    onChange={e => handleTypeChange(map.index, e.target.value as FieldType)}
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
                                                    <option value="ENUM">Auswahl (Enum / Dropdown)</option>
                                                </select>
                                                
                                                {/* Smart Enum Manager UI */}
                                                {map.type === 'ENUM' && map.selected && (
                                                    <div className="mt-1 bg-blue-50 border border-blue-100 rounded p-2 text-[11px] flex flex-col gap-1.5 w-full">
                                                        <span className="font-bold text-blue-700 uppercase text-[9px] flex justify-between items-center">
                                                            Dropdown-Werte (Enum):
                                                        </span>
                                                        <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto bg-white p-1 rounded border border-blue-200">
                                                            {(map.enumValues || []).map((val, eIdx) => (
                                                                <span key={eIdx} className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 shrink-0">
                                                                    {val}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newVals = (map.enumValues || []).filter(v => v !== val);
                                                                            updateMapping(map.index, { enumValues: newVals });
                                                                        }}
                                                                        className="text-blue-500 hover:text-blue-800 font-bold"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </span>
                                                            ))}
                                                            {(map.enumValues || []).length === 0 && (
                                                                <span className="text-slate-400 italic">Keine Optionen</span>
                                                            )}
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Wert tippen & Enter..."
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    const val = e.currentTarget.value.trim();
                                                                    if (val && !(map.enumValues || []).includes(val)) {
                                                                        const newVals = [...(map.enumValues || []), val];
                                                                        updateMapping(map.index, { enumValues: newVals });
                                                                        e.currentTarget.value = '';
                                                                    }
                                                                }
                                                            }}
                                                            className="w-full border border-blue-200 bg-white rounded px-1.5 py-0.5 text-[10px] outline-none"
                                                        />
                                                    </div>
                                                )}

                                                {/* Smart VLOOKUP/SVERWEIS relationships mapping UI */}
                                                {tables && tables.length > 0 && map.selected && (
                                                    <div className="mt-1 bg-purple-50 border border-purple-100 rounded p-2 text-[11px] flex flex-col gap-1 w-full">
                                                        <span className="font-bold text-purple-700 uppercase text-[9px] flex items-center gap-1">
                                                            🔗 SVERWEIS / Beziehung:
                                                        </span>
                                                        <select
                                                            value={suggestedRelations[map.index]?.toTableId || ''}
                                                            onChange={(e) => {
                                                                const targetTId = e.target.value;
                                                                if (!targetTId) {
                                                                    const updated = { ...suggestedRelations };
                                                                    delete updated[map.index];
                                                                    setSuggestedRelations(updated);
                                                                } else {
                                                                    const targetT = tables.find(t => t.id === targetTId);
                                                                    const targetPk = targetT?.fields.find(f => f.isPrimaryKey) || targetT?.fields[0];
                                                                    setSuggestedRelations({
                                                                        ...suggestedRelations,
                                                                        [map.index]: {
                                                                            toTableId: targetTId,
                                                                            toFieldId: targetPk?.id || ''
                                                                        }
                                                                    });
                                                                }
                                                            }}
                                                            className="w-full border border-purple-200 rounded px-1.5 py-0.5 text-[10px] bg-white text-purple-800 outline-none"
                                                        >
                                                            <option value="">Keine Verknüpfung</option>
                                                            {tables.map(t => (
                                                                <option key={t.id} value={t.id}>
                                                                    Verweis auf {t.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {suggestedRelations[map.index] && (
                                                            <span className="text-[9px] text-purple-600 bg-purple-100/50 px-1 py-0.5 rounded italic truncate">
                                                                SVERWEIS ➔ {tables.find(t => t.id === suggestedRelations[map.index].toTableId)?.name} ({
                                                                    tables.find(t => t.id === suggestedRelations[map.index].toTableId)?.fields.find(f => f.id === suggestedRelations[map.index].toFieldId)?.name || 'ID'
                                                                })
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="text-[10px] text-slate-400 truncate" title={`Original: ${map.originalName}`}>
                                                    Orig: {map.originalName}
                                                </div>

                                                <label className={`flex items-center gap-1 cursor-pointer select-none mt-1 ${!map.selected ? 'opacity-50 pointer-events-none' : ''}`}>
                                                    <input 
                                                        type="radio" 
                                                        name="primaryKey"
                                                        disabled={!map.selected}
                                                        checked={!!map.isPrimaryKey}
                                                        onChange={() => setPrimaryKey(map.index)}
                                                        className="rounded-full w-3 h-3 text-green-600 focus:ring-green-500"
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-600">Als Primärschlüssel (PK)</span>
                                                </label>
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
                                            <td key={cIdx} className={`p-3 text-sm text-slate-600 border-r border-slate-100 truncate max-w-[240px] ${!map.selected ? 'opacity-30 bg-slate-50' : ''}`}>
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
                            <strong>Hinweis:</strong> Die Tabelle wird in Ihrer IndexedDB gespeichert.
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
