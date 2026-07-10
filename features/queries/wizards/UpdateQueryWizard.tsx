import React, { useState, useEffect, useMemo } from 'react';
import { Table as DBTable, Field } from '../../../types/index';
import { X, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, Upload, Check, AlertTriangle, FileText, FileSpreadsheet, FileJson, HelpCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface UpdateQueryWizardProps {
  tables: DBTable[];
  onExecute: (targetTable: DBTable, updatedData: any[]) => void;
  onSaveQuery?: (queryName: string, targetTableId: string, mapping: Record<string, string>, matchField: string) => void;
  onClose: () => void;
}

export const UpdateQueryWizard: React.FC<UpdateQueryWizardProps> = ({ tables, onExecute, onSaveQuery, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [targetTableId, setTargetTableId] = useState('');
  const [queryName, setQueryName] = useState('Neue Aktualisierungsabfrage');

  // File states
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'csv' | 'xlsx' | 'xml' | 'json' | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  // Mapping states
  const [matchFieldId, setMatchFieldId] = useState<string>(''); // Target table field to match on
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({}); // TargetFieldId -> FileColumnName

  const targetTable = tables.find(t => t.id === targetTableId);

  // Auto-Match matchField to PK on table selection
  useEffect(() => {
    if (targetTable) {
      const pkField = targetTable.fields.find(f => f.isPrimaryKey);
      if (pkField) {
        setMatchFieldId(pkField.id);
      } else if (targetTable.fields.length > 0) {
        setMatchFieldId(targetTable.fields[0].id);
      }
      setQueryName(`Aktualisiere_${targetTable.name}`);
    }
  }, [targetTableId, tables]);

  // Handle Drag & Drop / File Upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setFileError(null);
    const name = selectedFile.name.toLowerCase();
    
    let type: 'csv' | 'xlsx' | 'xml' | 'json' | null = null;
    if (name.endsWith('.csv')) type = 'csv';
    else if (name.endsWith('.xlsx') || name.endsWith('.xls')) type = 'xlsx';
    else if (name.endsWith('.xml')) type = 'xml';
    else if (name.endsWith('.json')) type = 'json';

    if (!type) {
      setFileError('Ungültiges Dateiformat. Bitte laden Sie eine Excel-, CSV-, XML- oder JSON-Datei hoch.');
      return;
    }
    setFileType(type);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result) throw new Error('Datei konnte nicht gelesen werden.');

        let data: any[] = [];
        let cols: string[] = [];

        if (type === 'json') {
          const parsed = JSON.parse(result as string);
          data = Array.isArray(parsed) ? parsed : [parsed];
          if (data.length > 0) {
            cols = Object.keys(data[0]);
          }
        } else if (type === 'xlsx') {
          const workbook = XLSX.read(result, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          data = json;
          if (data.length > 0) {
            cols = Object.keys(data[0]);
          }
        } else if (type === 'csv') {
          const text = result as string;
          const workbook = XLSX.read(text, { type: 'string' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          data = json;
          if (data.length > 0) {
            cols = Object.keys(data[0]);
          }
        } else if (type === 'xml') {
          const text = result as string;
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(text, "text/xml");
          
          // Basic XML parser to flat objects
          const rows = xmlDoc.getElementsByTagName("row") || xmlDoc.getElementsByTagName("record") || xmlDoc.childNodes[0]?.childNodes;
          const items: any[] = [];
          
          for (let i = 0; i < rows.length; i++) {
            const node = rows[i];
            if (node.nodeType === 1) { // Element node
              const obj: any = {};
              const children = node.childNodes;
              for (let j = 0; j < children.length; j++) {
                const child = children[j];
                if (child.nodeType === 1) {
                  obj[child.nodeName] = child.textContent;
                }
              }
              if (Object.keys(obj).length > 0) {
                items.push(obj);
              }
            }
          }
          data = items;
          if (data.length > 0) {
            cols = Object.keys(data[0]);
          } else {
            throw new Error('Keine Datensätze (z.B. <row> oder <record>) im XML gefunden.');
          }
        }

        if (data.length === 0) {
          throw new Error('Die Datei enthält keine Daten.');
        }

        setParsedData(data);
        setFileColumns(cols);

        // Auto-match remaining fields
        if (targetTable) {
          const initialMap: Record<string, string> = {};
          targetTable.fields.forEach(f => {
            // Find exact or case-insensitive column match
            const match = cols.find(c => c.toLowerCase() === f.name.toLowerCase());
            if (match) {
              initialMap[f.id] = match;
            }
          });
          setFieldMapping(initialMap);
        }

        setStep(3); // Go to mapping step
      } catch (err: any) {
        setFileError(`Fehler beim Analysieren der Datei: ${err.message || err}`);
      }
    };

    if (type === 'xlsx') {
      reader.readAsBinaryString(selectedFile);
    } else {
      reader.readAsText(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Preview match and update stats
  const matchField = targetTable?.fields.find(f => f.id === matchFieldId);
  
  const correlationPreview = useMemo(() => {
    if (!targetTable || !matchField || parsedData.length === 0) {
      return { matches: 0, nonMatches: 0, details: [] };
    }

    const matchedCol = fieldMapping[matchField.id];
    if (!matchedCol) {
      return { matches: 0, nonMatches: 0, details: [] };
    }

    let matchesCount = 0;
    let nonMatchesCount = 0;
    const details: any[] = [];

    parsedData.forEach(importedRow => {
      const importedVal = String(importedRow[matchedCol] ?? '').trim().toLowerCase();
      
      const foundInDb = targetTable.data?.find(dbRow => {
        const dbVal = String(dbRow[matchField.name] ?? '').trim().toLowerCase();
        return dbVal === importedVal && dbVal !== '';
      });

      if (foundInDb) {
        matchesCount++;
        details.push({
          key: importedRow[matchedCol],
          status: 'Gefunden',
          imported: importedRow,
          current: foundInDb
        });
      } else {
        nonMatchesCount++;
        details.push({
          key: importedRow[matchedCol],
          status: 'Nicht gefunden (Wird ignoriert)',
          imported: importedRow,
          current: null
        });
      }
    });

    return { matches: matchesCount, nonMatches: nonMatchesCount, details };
  }, [targetTable, matchFieldId, parsedData, fieldMapping]);

  // Execute actual database modifications locally
  const handleExecuteUpdate = () => {
    if (!targetTable || !matchField) return;

    const matchedCol = fieldMapping[matchField.id];
    if (!matchedCol) return;

    // Build the updated array of database rows
    const updatedDbRows = (targetTable.data || []).map(dbRow => {
      const dbVal = String(dbRow[matchField.name] ?? '').trim().toLowerCase();
      
      // Find matching row in imported file
      const matchingImportRow = parsedData.find(importedRow => {
        const importVal = String(importedRow[matchedCol] ?? '').trim().toLowerCase();
        return importVal === dbVal && importVal !== '';
      });

      if (matchingImportRow) {
        // Apply field mappings to this DB row
        const newRow = { ...dbRow };
        targetTable.fields.forEach(f => {
          // Do not update the primary match key field if it is a PK or ID
          if (f.id === matchField.id && f.isPrimaryKey) return;

          const importColName = fieldMapping[f.id];
          if (importColName && matchingImportRow[importColName] !== undefined) {
            let val = matchingImportRow[importColName];
            
            // Basic data type coercions
            if (f.type === 'INTEGER' || f.type === 'NUMBER') {
              val = isNaN(Number(val)) ? val : Number(val);
            } else if (f.type === 'BOOLEAN') {
              val = val === 'true' || val === true || val === '1' || val === 1 || String(val).toLowerCase() === 'ja';
            }
            newRow[f.name] = val;
          }
        });
        return newRow;
      }

      return dbRow;
    });

    // Notify state manager to apply changes
    onExecute(targetTable, updatedDbRows);

    // Save query definition as an Action Query if callback provided
    if (onSaveQuery) {
      onSaveQuery(queryName, targetTableId, fieldMapping, matchField.name);
    }

    setStep(4); // Success step
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm" id="update-query-wizard-overlay">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-slate-300 flex flex-col h-[650px] overflow-hidden" id="update-query-wizard-container">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
               <RefreshCw className="text-blue-200 animate-spin-slow" size={24}/> Aktualisierungsabfrage Assistent
            </h2>
            <p className="text-blue-100 text-sm mt-1">Bestehende Datensätze über eine Importdatei (Excel, CSV, XML, JSON) aktualisieren.</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors" id="close-wizard-btn">
            <X size={24} />
          </button>
        </div>

        {/* Steps Breadcrumbs */}
        <div className="flex bg-slate-100 border-b border-slate-200 px-6 py-2 text-xs font-semibold text-slate-500 shrink-0 gap-6">
          <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-blue-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-300'}`}>1</span> Tabelle
          </div>
          <ArrowRight size={14} className="text-slate-400 self-center"/>
          <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-blue-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-300'}`}>2</span> Datei-Upload
          </div>
          <ArrowRight size={14} className="text-slate-400 self-center"/>
          <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-blue-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs ${step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-300'}`}>3</span> Mapping & Abgleich
          </div>
          <ArrowRight size={14} className="text-slate-400 self-center"/>
          <div className={`flex items-center gap-1.5 ${step === 4 ? 'text-blue-700' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs ${step === 4 ? 'bg-green-600 text-white' : 'bg-slate-300'}`}>4</span> Fertiggestellt
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
          
          {/* STEP 1: Select Target Table */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-lg">Schritt 1: Wählen Sie die zu aktualisierende Tabelle</h3>
                <p className="text-sm text-slate-500">
                  Wählen Sie die Tabelle aus Ihrer Datenbank aus, deren Datensätze aktualisiert werden sollen.
                </p>
                
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 uppercase">Ziel-Tabelle</label>
                  <select 
                    className="w-full border border-slate-300 rounded p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={targetTableId}
                    onChange={e => setTargetTableId(e.target.value)}
                    id="target-table-select"
                  >
                    <option value="">Bitte wählen...</option>
                    {tables.map(t => <option key={t.id} value={t.id}>{t.name} ({t.data?.length || 0} Datensätze)</option>)}
                  </select>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-sm font-bold text-slate-700 uppercase">Name der Abfrage (Optional)</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={queryName}
                    onChange={e => setQueryName(e.target.value)}
                    placeholder="z.B. Update_Preise"
                    id="query-name-input"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
                <HelpCircle className="text-blue-600 shrink-0 mt-0.5" size={20}/>
                <div className="text-sm text-blue-800 space-y-1">
                  <strong>Wie funktioniert das Update?</strong>
                  <p>In den nächsten Schritten laden Sie Ihre CSV-, Excel-, XML- oder JSON-Datei hoch. Der Assistent vergleicht einen Schlüssel (z.B. die Kundennummer oder ID) aus Ihrer Datei mit der Datenbank und aktualisiert alle übereinstimmenden Datensätze.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: File Upload */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h3 className="font-bold text-slate-800 text-lg">Schritt 2: Import-Datei hochladen</h3>
              
              <div 
                className="border-2 border-dashed border-slate-300 rounded-xl bg-white p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-indigo-500 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('wizard-file-input')?.click()}
                id="file-drop-zone"
              >
                <input 
                  type="file" 
                  id="wizard-file-input"
                  className="hidden" 
                  accept=".csv, .xlsx, .xls, .xml, .json"
                  onChange={handleFileChange}
                />
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shadow-inner">
                  <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-700">Ziehen Sie Ihre Datei hierher oder klicken Sie zum Suchen</p>
                  <p className="text-xs text-slate-400 mt-1">Unterstützt Excel (.xlsx), CSV (.csv), XML (.xml) und JSON (.json)</p>
                </div>
              </div>

              {fileError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center gap-3">
                  <AlertTriangle size={20} className="shrink-0" />
                  <p className="text-sm">{fileError}</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Mapping & Preview */}
          {step === 3 && targetTable && (
            <div className="space-y-6 animate-in slide-in-from-right-4 h-full flex flex-col pb-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                     <FileSpreadsheet size={16} className="text-green-600"/> {file?.name}
                  </h4>
                  <button 
                    onClick={() => setStep(2)} 
                    className="text-xs text-indigo-600 hover:underline font-semibold"
                    id="change-file-btn"
                  >
                    Andere Datei wählen
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Correlating Field Selector */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Abgleich-Schlüssel (in {targetTable.name})</label>
                    <select 
                      className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-semibold bg-indigo-50/50"
                      value={matchFieldId}
                      onChange={e => setMatchFieldId(e.target.value)}
                      id="match-field-select"
                    >
                      {targetTable.fields.map(f => (
                        <option key={f.id} value={f.id}>{f.name} {f.isPrimaryKey ? '🔑 (PK)' : ''}</option>
                      ))}
                    </select>
                  </div>

                  {/* Imported Correlating Column */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Abgleich-Spalte (in Datei)</label>
                    <select 
                      className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-semibold bg-indigo-50/50"
                      value={fieldMapping[matchFieldId] || ''}
                      onChange={e => setFieldMapping({ ...fieldMapping, [matchFieldId]: e.target.value })}
                      id="match-column-select"
                    >
                      <option value="">Bitte wählen...</option>
                      {fileColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Report Badge */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
                  <div className="text-2xs font-bold text-blue-500 uppercase">Gelesene Zeilen</div>
                  <div className="text-xl font-extrabold text-blue-800">{parsedData.length}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                  <div className="text-2xs font-bold text-green-500 uppercase">Zugeordnete Treffer</div>
                  <div className="text-xl font-extrabold text-green-800" id="matched-rows-count">{correlationPreview.matches}</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded p-3 text-center">
                  <div className="text-2xs font-bold text-orange-500 uppercase">Ignorierte Zeilen</div>
                  <div className="text-xl font-extrabold text-orange-800">{correlationPreview.nonMatches}</div>
                </div>
              </div>

              {/* Field Mapping Matrix */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 text-sm">Feld-Zuordnungen konfigurieren</h4>
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-h-[180px] overflow-y-auto shadow-inner">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-500 border-b">
                      <tr>
                        <th className="p-2 text-left">Ziel-Datenfeld ({targetTable.name})</th>
                        <th className="p-2 text-center w-10">Typ</th>
                        <th className="p-2 text-left">Quell-Spalte (Datei)</th>
                        <th className="p-2 text-center w-12">Importieren</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {targetTable.fields.map(field => {
                        const isKey = field.id === matchFieldId;
                        const isMapped = !!fieldMapping[field.id];
                        
                        return (
                          <tr key={field.id} className={isKey ? "bg-indigo-50/50" : ""}>
                            <td className="p-2 font-medium">
                              <span className="flex items-center gap-1.5">
                                {field.name} 
                                {isKey && <span className="text-3xs bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">Schlüssel</span>}
                              </span>
                            </td>
                            <td className="p-2 text-center text-xs text-slate-400 font-mono">{field.type}</td>
                            <td className="p-2">
                              {isKey ? (
                                <span className="text-xs text-slate-500 font-semibold italic">Als Abgleichschlüssel festgelegt</span>
                              ) : (
                                <select
                                  className="w-full border border-slate-200 rounded p-1 text-xs outline-none bg-slate-50 focus:bg-white"
                                  value={fieldMapping[field.id] || ''}
                                  onChange={e => setFieldMapping({ ...fieldMapping, [field.id]: e.target.value })}
                                  disabled={!isMapped && fieldMapping[field.id] === undefined}
                                >
                                  <option value="">-- Nicht aktualisieren --</option>
                                  {fileColumns.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {!isKey && (
                                <input 
                                  type="checkbox"
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  checked={isMapped}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      // Suggest a match or pick first
                                      const automaticMatch = fileColumns.find(c => c.toLowerCase() === field.name.toLowerCase()) || fileColumns[0] || '';
                                      setFieldMapping({ ...fieldMapping, [field.id]: automaticMatch });
                                    } else {
                                      const { [field.id]: _, ...rest } = fieldMapping;
                                      setFieldMapping(rest);
                                    }
                                  }}
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success Message */}
          {step === 4 && targetTable && (
            <div className="space-y-6 text-center py-10 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-slate-800">Aktualisierung erfolgreich ausgeführt!</h3>
                <p className="text-sm text-slate-500">
                  Insgesamt wurden <strong>{correlationPreview.matches}</strong> Datensätze in der Tabelle <strong>{targetTable.name}</strong> mit den Werten aus Ihrer Datei aktualisiert.
                </p>
              </div>

              <div className="bg-slate-100 p-4 rounded-lg border max-w-md mx-auto text-left text-xs text-slate-600 space-y-1.5 font-mono">
                <div>Abfrage: {queryName}</div>
                <div>Tabelle: {targetTable.name}</div>
                <div>Aktualisierte Zeilen: {correlationPreview.matches}</div>
                <div>Ignorierte Zeilen: {correlationPreview.nonMatches}</div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t flex justify-between items-center shrink-0">
          <button 
            onClick={onClose} 
            className="px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 text-sm font-semibold"
            id="cancel-wizard-footer"
          >
            {step === 4 ? 'Schließen' : 'Abbrechen'}
          </button>

          <div className="flex gap-2">
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={!targetTableId}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-sm font-semibold flex items-center gap-1"
                id="next-to-upload-btn"
              >
                Weiter <ArrowRight size={16} />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-sm font-semibold"
                id="back-to-table-btn"
              >
                Zurück
              </button>
            )}

            {step === 3 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-sm font-semibold"
                  id="back-to-upload-btn"
                >
                  Zurück
                </button>
                <button
                  onClick={handleExecuteUpdate}
                  disabled={!matchFieldId || !fieldMapping[matchFieldId] || correlationPreview.matches === 0}
                  className="px-5 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 text-white rounded text-sm font-semibold flex items-center gap-1 shadow"
                  id="execute-update-btn"
                >
                  <RefreshCw size={16} className="animate-spin-slow"/> Ausführen
                </button>
              </div>
            )}

            {step === 4 && (
              <button
                onClick={onClose}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-semibold"
                id="finish-wizard-btn"
              >
                Fertig
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
