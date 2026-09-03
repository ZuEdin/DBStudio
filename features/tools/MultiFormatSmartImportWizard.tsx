import React, { useState } from 'react';
import { Table, Field, FieldType, DbType } from '../../types/index';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  FileCode, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Table as TableIcon, 
  Database, 
  Plus, 
  Layers,
  Settings,
  Hash,
  Calendar,
  DollarSign,
  ToggleLeft,
  Type
} from 'lucide-react';

interface MultiFormatSmartImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  targetTableId?: string;
}

interface InferredColumn {
  name: string;
  detectedType: FieldType;
  sampleValues: any[];
  isRequired: boolean;
  isPrimaryKey?: boolean;
}

export const MultiFormatSmartImportWizard: React.FC<MultiFormatSmartImportWizardProps> = ({
  isOpen,
  onClose,
  targetTableId
}) => {
  const { tables, setTables, addTable, updateTable } = useProjectStore();
  const ui = useUIStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [importMode, setImportMode] = useState<'new_table' | 'existing_table'>(targetTableId ? 'existing_table' : 'new_table');
  const [selectedExistingTableId, setSelectedExistingTableId] = useState<string>(targetTableId || tables[0]?.id || '');
  const [newTableName, setNewTableName] = useState<string>('Neue_Tabelle');
  
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<'csv' | 'json'>('csv');
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [inferredColumns, setInferredColumns] = useState<InferredColumn[]>([]);

  if (!isOpen) return null;

  // Auto-detection logic for data types
  const detectColumnType = (values: any[]): FieldType => {
    const nonNulls = values.filter(v => v !== undefined && v !== null && String(v).trim() !== '');
    if (nonNulls.length === 0) return 'VARCHAR';

    // Check Boolean (Ja/Nein, Wahr/Falsch, true/false, 1/0)
    const isBool = nonNulls.every(v => {
      const s = String(v).trim().toLowerCase();
      return ['true', 'false', 'ja', 'nein', 'wahr', 'falsch', '1', '0', 'j', 'n'].includes(s);
    });
    if (isBool) return 'BOOLEAN';

    // Check Currency (e.g. 1.250,50 €, 49,99 EUR, CHF 100.00)
    const isCurrency = nonNulls.every(v => {
      const s = String(v).trim();
      return /(€|EUR|CHF|\$)/i.test(s) || /^\d{1,3}(\.\d{3})*,\d{2}\s*€?$/.test(s);
    });
    if (isCurrency) return 'CURRENCY';

    // Check German / ISO Date (DD.MM.YYYY, YYYY-MM-DD)
    const isDate = nonNulls.every(v => {
      const s = String(v).trim();
      return /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(s) || /^\d{4}-\d{2}-\d{2}$/.test(s);
    });
    if (isDate) return 'DATE';

    // Check Integer
    const isInt = nonNulls.every(v => /^-?\d+$/.test(String(v).trim()));
    if (isInt) return 'INTEGER';

    // Check Float / Decimal
    const isFloat = nonNulls.every(v => {
      const s = String(v).trim().replace(',', '.');
      return !isNaN(parseFloat(s)) && isFinite(Number(s));
    });
    if (isFloat) return 'DECIMAL';

    // Check Email
    const isEmail = nonNulls.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()));
    if (isEmail) return 'EMAIL';

    // Long Text vs Short String
    const maxLen = Math.max(...nonNulls.map(v => String(v).length));
    if (maxLen > 255) return 'TEXT';

    return 'VARCHAR';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const inferredName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
    setNewTableName(inferredName || 'Import_Tabelle');

    const ext = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    if (ext === 'json') {
      setFileType('json');
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const rows = Array.isArray(json) ? json : [json];
          processParsedData(rows);
        } catch {
          ui.addToast('Ungültiges JSON-Dateiformat.', 'error');
        }
      };
      reader.readAsText(file);
    } else {
      // CSV parse
      setFileType('csv');
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCsv(text);
      };
      reader.readAsText(file);
    }
  };

  const parseCsv = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);
    if (lines.length < 1) return;

    // Detect delimiter
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

    const headers = firstLine.split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
    const rows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(delimiter).map(v => v.replace(/^["']|["']$/g, '').trim());
      const rowObj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = vals[idx] !== undefined ? vals[idx] : '';
      });
      rows.push(rowObj);
    }

    processParsedData(rows, headers);
  };

  const processParsedData = (rows: Record<string, any>[], customHeaders?: string[]) => {
    if (rows.length === 0) return;
    const headers = customHeaders || Object.keys(rows[0] || {});
    setParsedRows(rows);

    // Invert data to compute column types
    const inferred: InferredColumn[] = headers.map((header, idx) => {
      const colValues = rows.slice(0, 50).map(r => r[header]);
      const detected = detectColumnType(colValues);
      const isPkCandidate = idx === 0 || header.toLowerCase() === 'id' || header.toLowerCase().endsWith('_id');

      return {
        name: header,
        detectedType: detected,
        sampleValues: colValues.slice(0, 3),
        isRequired: false,
        isPrimaryKey: isPkCandidate
      };
    });

    setInferredColumns(inferred);
    setStep(2);
  };

  const handleExecuteImport = () => {
    if (importMode === 'new_table') {
      const newTableId = `tbl_${Date.now()}`;
      const fields: Field[] = inferredColumns.map((col, idx) => ({
        id: `fld_${Date.now()}_${idx}`,
        name: col.name.trim().replace(/[^a-zA-Z0-9_]/g, '_'),
        type: col.detectedType,
        isPrimaryKey: Boolean(col.isPrimaryKey),
        allowNull: !Boolean(col.isRequired)
      }));

      // Ensure at least one PK
      if (!fields.some(f => f.isPrimaryKey)) {
        fields.unshift({
          id: `fld_${Date.now()}_pk`,
          name: 'id',
          type: 'VARCHAR',
          length: 36,
          isPrimaryKey: true,
          allowNull: false
        });
      }

      // Convert data format if needed
      const cleanData = parsedRows.map((row, idx) => {
        const out: Record<string, any> = { ...row };
        if (!fields.some(f => f.name === 'id' && !f.isPrimaryKey) && !out.id) {
          out.id = `ROW-${idx + 1}`;
        }
        return out;
      });

      const createdTable: Table = {
        id: newTableId,
        name: newTableName,
        description: `Importiert aus ${fileName} (${cleanData.length} Zeilen)`,
        fields,
        data: cleanData
      };

      addTable(createdTable);
      ui.addToast(`Tabelle "${newTableName}" erfolgreich mit ${cleanData.length} Zeilen importiert!`, 'success');
      onClose();
    } else {
      // Append or merge into existing table
      const targetTable = tables.find(t => t.id === selectedExistingTableId);
      if (!targetTable) return;

      const mergedData = [...(targetTable.data || []), ...parsedRows];
      updateTable({
        ...targetTable,
        data: mergedData
      });

      ui.addToast(`${parsedRows.length} Datensätze in Tabelle "${targetTable.name}" importiert!`, 'success');
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-xs"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh] h-[680px] animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                Multi-Format Import-Wizard
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                  CSV · Excel · JSON
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Automatische Datentyperkennung (Datum, Währung, Boolean) & Schema-Generierung
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">1</span>
            Datei auswählen & parsen
          </div>
          <ArrowRight size={12} className="text-slate-300" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">2</span>
            Spalten & Datentypen prüfen
          </div>
          <ArrowRight size={12} className="text-slate-300" />
          <div className={`flex items-center gap-2 ${step === 3 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">3</span>
            Import abschließen
          </div>
        </div>

        {/* Wizard Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
          {step === 1 && (
            <div className="space-y-6 max-w-xl mx-auto py-4">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-8 text-center transition-colors bg-slate-50/50 dark:bg-slate-950/40">
                <Upload size={36} className="mx-auto text-blue-500 mb-3" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
                  CSV-, Excel- oder JSON-Datei hier ablegen
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Unterstützt .csv (Semikolon/Komma), .json und tabulatorgetrennte Daten
                </p>
                <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-md inline-flex items-center gap-2">
                  <Upload size={14} /> Datei durchsuchen
                  <input type="file" accept=".csv,.json,.txt" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* Import Destination Option */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Ziel für die Daten:</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setImportMode('new_table')}
                    className={`p-3 rounded-lg border text-left text-xs transition-all ${
                      importMode === 'new_table'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Plus size={14} className="text-blue-600" /> Neue Tabelle erstellen
                    </div>
                    <span className="text-[11px] font-normal text-slate-400">Automatische Schema-Generierung</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('existing_table')}
                    className={`p-3 rounded-lg border text-left text-xs transition-all ${
                      importMode === 'existing_table'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Database size={14} className="text-emerald-600" /> In bestehende Tabelle
                    </div>
                    <span className="text-[11px] font-normal text-slate-400">An vorhandene Tabelle anfügen</span>
                  </button>
                </div>

                {importMode === 'existing_table' && (
                  <div className="mt-3">
                    <label className="text-xs text-slate-500 block mb-1">Zieltabelle auswählen:</label>
                    <select
                      value={selectedExistingTableId}
                      onChange={e => setSelectedExistingTableId(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      {tables.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.fields.length} Felder)</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    Erkannte Spaltenstruktur ({inferredColumns.length} Spalten, {parsedRows.length} Zeilen)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Datentypen wurden automatisch analysiert. Sie können Typen und Primärschlüssel bei Bedarf anpassen.
                  </p>
                </div>
                {importMode === 'new_table' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tabellenname:</span>
                    <input
                      type="text"
                      value={newTableName}
                      onChange={e => setNewTableName(e.target.value)}
                      className="text-xs p-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-blue-600"
                    />
                  </div>
                )}
              </div>

              {/* Column Mapping Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5 px-3">Spaltenname</th>
                      <th className="p-2.5 px-3">Erkannter Datentyp</th>
                      <th className="p-2.5 px-3">Primärschlüssel</th>
                      <th className="p-2.5 px-3">Beispielwerte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-sans">
                    {inferredColumns.map((col, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                          <input
                            type="text"
                            value={col.name}
                            onChange={e => {
                              const updated = [...inferredColumns];
                              updated[idx].name = e.target.value;
                              setInferredColumns(updated);
                            }}
                            className="bg-transparent border-b border-dashed border-slate-400 focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-2.5 px-3">
                          <select
                            value={col.detectedType}
                            onChange={e => {
                              const updated = [...inferredColumns];
                              updated[idx].detectedType = e.target.value as FieldType;
                              setInferredColumns(updated);
                            }}
                            className="text-xs p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          >
                            <option value="VARCHAR">VARCHAR [Text]</option>
                            <option value="TEXT">TEXT [Langer Fließtext]</option>
                            <option value="INTEGER">INTEGER [Ganzzahl]</option>
                            <option value="DECIMAL">DECIMAL [Kommazahl]</option>
                            <option value="CURRENCY">CURRENCY [Währung €/CHF]</option>
                            <option value="DATE">DATE [Datum]</option>
                            <option value="BOOLEAN">BOOLEAN [Wahr/Falsch]</option>
                            <option value="EMAIL">EMAIL [E-Mail Adresse]</option>
                          </select>
                        </td>
                        <td className="p-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={Boolean(col.isPrimaryKey)}
                            onChange={e => {
                              const updated = inferredColumns.map((c, i) => ({
                                ...c,
                                isPrimaryKey: i === idx ? e.target.checked : false
                              }));
                              setInferredColumns(updated);
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5 px-3 text-slate-400 font-mono text-[11px] truncate max-w-xs">
                          {col.sampleValues.join(', ') || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 px-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={step === 2 ? () => setStep(1) : onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            {step === 2 ? 'Zurück' : 'Abbrechen'}
          </button>

          {step === 2 && (
            <button
              type="button"
              onClick={handleExecuteImport}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2 transition-all"
            >
              <CheckCircle2 size={15} />
              {importMode === 'new_table' ? 'Tabelle jetzt erstellen & importieren' : 'Daten jetzt importieren'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
