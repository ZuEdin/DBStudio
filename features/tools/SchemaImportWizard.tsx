import React, { useState } from 'react';
import { Table, Field, FieldType } from '../../types/index';
import { X, Upload, ArrowRight, Check, Database, AlertTriangle, FileText, FileCode, CheckSquare, Settings } from 'lucide-react';

interface SchemaImportWizardProps {
  onSave: (table: Table) => void;
  onClose: () => void;
  onAddToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

export const SchemaImportWizard: React.FC<SchemaImportWizardProps> = ({ onSave, onClose, onAddToast }) => {
  const [inputText, setInputText] = useState('');
  const [format, setFormat] = useState<'auto' | 'sql' | 'json' | 'csv'>('auto');
  const [detectedFormat, setDetectedFormat] = useState<string>('');
  const [step, setStep] = useState<1 | 2>(1);
  const [parsedTables, setParsedTables] = useState<Table[]>([]);
  const [error, setError] = useState<string | null>(null);

  // SQL DDL Parser
  const parseSqlDdl = (sql: string): Table[] => {
    const tables: Table[] = [];
    
    // Clean comments and normalize whitespace
    let cleanSql = sql
      .replace(/--.*$/gm, '') // single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // multi-line comments
      .replace(/\s+/g, ' ') // collapse whitespaces
      .trim();

    // Find CREATE TABLE statements
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)\s*\(([\s\S]*?)\)(?:\s*;|\s*(?:ENGINE|DEFAULT|CHARSET|collate)\b|$)/gi;
    
    let match;
    while ((match = createTableRegex.exec(cleanSql)) !== null) {
      const rawTableName = match[1].replace(/[`"']/g, '').trim();
      const columnsPart = match[2].trim();
      
      // Split columns by comma, but ignore commas inside parentheses (e.g. DECIMAL(10,2) or VARCHAR(255))
      const columns: string[] = [];
      let currentColumn = '';
      let parenDepth = 0;
      
      for (let i = 0; i < columnsPart.length; i++) {
        const char = columnsPart[i];
        if (char === '(') parenDepth++;
        else if (char === ')') parenDepth--;
        
        if (char === ',' && parenDepth === 0) {
          columns.push(currentColumn.trim());
          currentColumn = '';
        } else {
          currentColumn += char;
        }
      }
      if (currentColumn.trim()) {
        columns.push(currentColumn.trim());
      }
      
      const fields: Field[] = [];
      let primaryKeyColumn: string | null = null;
      
      // First pass or look for PRIMARY KEY (col) constraints
      columns.forEach(colStr => {
        const upperCol = colStr.toUpperCase();
        if (upperCol.startsWith('PRIMARY KEY') || upperCol.startsWith('CONSTRAINT')) {
          const pkMatch = upperCol.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
          if (pkMatch) {
            primaryKeyColumn = pkMatch[1].replace(/[`"']/g, '').trim();
          }
        }
      });

      columns.forEach(colStr => {
        const parts = colStr.split(/\s+/);
        if (parts.length < 2) return;
        
        const firstPartUpper = parts[0].toUpperCase();
        if (['PRIMARY', 'CONSTRAINT', 'FOREIGN', 'KEY', 'UNIQUE', 'INDEX', 'CHECK'].includes(firstPartUpper)) {
          // Skip table-level constraints
          return;
        }
        
        const rawColName = parts[0].replace(/[`"']/g, '').trim();
        const rawTypeWithLen = parts[1].toLowerCase();
        
        // Extract base type and length/precision
        const typeMatch = rawTypeWithLen.match(/^([a-z]+)(?:\(([^)]+)\))?/i);
        const baseType = typeMatch ? typeMatch[1].toUpperCase() : 'VARCHAR';
        const typeParams = typeMatch && typeMatch[2] ? typeMatch[2] : undefined;
        
        // Determine our FieldType
        let type: FieldType = 'VARCHAR';
        let isAutoIncrement = false;
        let allowNull = true;
        let isPrimaryKey = false;
        let defaultValue: string | undefined = undefined;
        let length: number | undefined = undefined;
        
        if (['INT', 'INTEGER', 'TINYINT', 'SMALLINT', 'MEDIUMINT', 'BIGINT', 'SERIAL'].includes(baseType)) {
          type = 'INTEGER';
          if (baseType === 'SERIAL') {
            isAutoIncrement = true;
            isPrimaryKey = true;
          }
        } else if (['DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'REAL'].includes(baseType)) {
          type = 'DECIMAL';
        } else if (['BIT', 'BOOLEAN', 'BOOL'].includes(baseType)) {
          type = 'BOOLEAN';
        } else if (['DATE', 'DATETIME', 'TIMESTAMP', 'TIME'].includes(baseType)) {
          type = 'DATETIME';
        } else if (['TEXT', 'LONGTEXT', 'MEDIUMTEXT', 'TINYTEXT', 'JSON', 'BLOB', 'CLOB'].includes(baseType)) {
          type = 'TEXT';
        } else {
          type = 'VARCHAR';
          if (typeParams) {
            length = parseInt(typeParams, 10) || 255;
          } else {
            length = 255;
          }
        }
        
        const remainderStr = colStr.substring(colStr.indexOf(parts[1]) + parts[1].length).toUpperCase();
        
        if (remainderStr.includes('NOT NULL')) {
          allowNull = false;
        }
        if (remainderStr.includes('PRIMARY KEY') || rawColName.toLowerCase() === 'id' || rawColName === primaryKeyColumn) {
          isPrimaryKey = true;
          allowNull = false;
        }
        if (remainderStr.includes('AUTO_INCREMENT') || remainderStr.includes('IDENTITY') || remainderStr.includes('GENERATED ALWAYS AS IDENTITY')) {
          isAutoIncrement = true;
        }
        
        // Extract DEFAULT value if present
        const defaultMatch = remainderStr.match(/DEFAULT\s+([^(\s]+|\('[^']+'\)|'[^']+')/i);
        if (defaultMatch) {
          defaultValue = defaultMatch[1].replace(/^'|'$/g, '').trim();
          if (defaultValue.toUpperCase() === 'NULL') {
            defaultValue = undefined;
          }
        }
        
        fields.push({
          id: crypto.randomUUID(),
          name: rawColName,
          type,
          isPrimaryKey,
          allowNull,
          isAutoIncrement,
          defaultValue,
          length
        });
      });
      
      // Ensure at least one primary key if there's an ID-like field, or auto-detect
      if (!fields.some(f => f.isPrimaryKey)) {
        const idField = fields.find(f => f.name.toLowerCase() === 'id');
        if (idField) {
          idField.isPrimaryKey = true;
          idField.allowNull = false;
          if (idField.type === 'INTEGER') {
            idField.isAutoIncrement = true;
          }
        } else {
          // Fallback: make first column PK or append ID
          fields.unshift({
            id: crypto.randomUUID(),
            name: 'Id',
            type: 'INTEGER',
            isPrimaryKey: true,
            isAutoIncrement: true,
            allowNull: false
          });
        }
      }
      
      tables.push({
        id: 'table_' + Date.now() + '_' + Math.floor(Math.random() * 100000),
        name: rawTableName,
        fields,
        data: []
      });
    }
    
    return tables;
  };

  // JSON Schema / Row Data Parser
  const parseJsonSchemaOrData = (jsonText: string): Table[] => {
    const parsed = JSON.parse(jsonText);
    const tables: Table[] = [];

    // Case 1: Standard DB Studio Pro Project structure containing .tables or just list of tables
    if (parsed.tables && Array.isArray(parsed.tables)) {
      return parsed.tables.map((t: any) => ({
        id: t.id || 'table_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name: t.name || 'ImportedTable',
        fields: Array.isArray(t.fields) ? t.fields.map((f: any) => ({
          id: f.id || crypto.randomUUID(),
          name: f.name || 'Feld',
          type: f.type || 'VARCHAR',
          isPrimaryKey: !!f.isPrimaryKey,
          allowNull: f.allowNull !== false,
          isAutoIncrement: !!f.isAutoIncrement,
          length: f.length,
          defaultValue: f.defaultValue
        })) : [{ id: crypto.randomUUID(), name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true }],
        data: Array.isArray(t.data) ? t.data : []
      }));
    }

    // Case 2: Array of table definitions
    if (Array.isArray(parsed) && parsed.length > 0 && 'fields' in parsed[0]) {
      return parsed.map((t: any) => ({
        id: t.id || 'table_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name: t.name || 'ImportedTable',
        fields: Array.isArray(t.fields) ? t.fields.map((f: any) => ({
          id: f.id || crypto.randomUUID(),
          name: f.name || 'Feld',
          type: f.type || 'VARCHAR',
          isPrimaryKey: !!f.isPrimaryKey,
          allowNull: f.allowNull !== false,
          isAutoIncrement: !!f.isAutoIncrement,
          length: f.length,
          defaultValue: f.defaultValue
        })) : [],
        data: Array.isArray(t.data) ? t.data : []
      }));
    }

    // Case 3: Raw JSON row objects (e.g. [ { "id": 1, "name": "Alice" }, { "id": 2, "name": "Bob" } ])
    if (Array.isArray(parsed) && parsed.length > 0) {
      const sample = parsed[0];
      const fields: Field[] = Object.keys(sample).map(key => {
        const val = sample[key];
        let type: FieldType = 'VARCHAR';
        if (typeof val === 'number') {
          type = Number.isInteger(val) ? 'INTEGER' : 'DECIMAL';
        } else if (typeof val === 'boolean') {
          type = 'BOOLEAN';
        } else if (typeof val === 'string' && val.length > 500) {
          type = 'TEXT';
        } else if (typeof val === 'string' && !isNaN(Date.parse(val)) && val.includes('-')) {
          type = 'DATETIME';
        }
        
        return {
          id: crypto.randomUUID(),
          name: key,
          type,
          isPrimaryKey: key.toLowerCase() === 'id',
          allowNull: true
        };
      });

      if (!fields.some(f => f.isPrimaryKey)) {
        fields.unshift({
          id: crypto.randomUUID(),
          name: 'Id',
          type: 'INTEGER',
          isPrimaryKey: true,
          isAutoIncrement: true,
          allowNull: false
        });
        parsed.forEach((row: any, idx: number) => {
          row['Id'] = idx + 1;
        });
      }

      tables.push({
        id: 'table_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name: 'ImportierteTabelle',
        fields,
        data: parsed
      });
      return tables;
    }

    // Case 4: Single object (as a single table definition)
    if (typeof parsed === 'object' && parsed !== null) {
      if (parsed.name && Array.isArray(parsed.fields)) {
        return [{
          id: parsed.id || 'table_' + Date.now(),
          name: parsed.name,
          fields: parsed.fields.map((f: any) => ({
            id: f.id || crypto.randomUUID(),
            name: f.name || 'Feld',
            type: f.type || 'VARCHAR',
            isPrimaryKey: !!f.isPrimaryKey,
            allowNull: f.allowNull !== false,
            isAutoIncrement: !!f.isAutoIncrement,
            length: f.length,
            defaultValue: f.defaultValue
          })),
          data: Array.isArray(parsed.data) ? parsed.data : []
        }];
      } else {
        // Just key-value pairs representing a record
        const fields: Field[] = Object.keys(parsed).map(key => {
          const val = parsed[key];
          let type: FieldType = 'VARCHAR';
          if (typeof val === 'number') {
            type = Number.isInteger(val) ? 'INTEGER' : 'DECIMAL';
          } else if (typeof val === 'boolean') {
            type = 'BOOLEAN';
          }
          return {
            id: crypto.randomUUID(),
            name: key,
            type,
            isPrimaryKey: key.toLowerCase() === 'id',
            allowNull: true
          };
        });
        if (!fields.some(f => f.isPrimaryKey)) {
          fields.unshift({ id: crypto.randomUUID(), name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true, allowNull: false });
          parsed['Id'] = 1;
        }
        tables.push({
          id: 'table_' + Date.now(),
          name: 'ImportierteTabelle',
          fields,
          data: [parsed]
        });
        return tables;
      }
    }

    throw new Error("Konnte kein bekanntes JSON-Muster erkennen.");
  };

  // CSV Parser
  const parseCsvText = (csvText: string, delimiter?: string): Table[] => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length === 0) throw new Error("Leerer Text.");

    // Auto-detect delimiter if not specified
    if (!delimiter) {
      const firstLine = lines[0];
      const commas = (firstLine.match(/,/g) || []).length;
      const semicolons = (firstLine.match(/;/g) || []).length;
      const tabs = (firstLine.match(/\t/g) || []).length;
      if (semicolons > commas && semicolons > tabs) delimiter = ';';
      else if (tabs > commas && tabs > semicolons) delimiter = '\t';
      else delimiter = ',';
    }

    const parseRow = (line: string, delim: string) => {
      const parts: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delim && !inQuotes) {
          parts.push(current.trim().replace(/^['"]|['"]$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim().replace(/^['"]|['"]$/g, ''));
      return parts;
    };

    const headers = parseRow(lines[0], delimiter);
    if (headers.length === 0 || !headers[0]) throw new Error("Keine Header in der ersten Zeile gefunden.");

    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = parseRow(lines[i], delimiter);
      const row: any = {};
      headers.forEach((header, idx) => {
        const val = values[idx] !== undefined ? values[idx] : '';
        const key = header.toLowerCase();
        // Try to parse number/boolean
        if (val.toLowerCase() === 'true') row[key] = true;
        else if (val.toLowerCase() === 'false') row[key] = false;
        else if (val && !isNaN(Number(val))) row[key] = Number(val);
        else row[key] = val;
      });
      rows.push(row);
    }

    const fields: Field[] = headers.map(header => {
      const key = header.toLowerCase();
      // Infer type from first data row
      const sampleVal = rows.length > 0 ? rows[0][key] : undefined;
      let type: FieldType = 'VARCHAR';
      if (typeof sampleVal === 'number') {
        type = Number.isInteger(sampleVal) ? 'INTEGER' : 'DECIMAL';
      } else if (typeof sampleVal === 'boolean') {
        type = 'BOOLEAN';
      }
      return {
        id: crypto.randomUUID(),
        name: key,
        type,
        isPrimaryKey: key === 'id',
        allowNull: true
      };
    });

    if (!fields.some(f => f.isPrimaryKey)) {
      fields.unshift({
        id: crypto.randomUUID(),
        name: 'id',
        type: 'INTEGER',
        isPrimaryKey: true,
        isAutoIncrement: true,
        allowNull: false
      });
      rows.forEach((row, idx) => {
        row['id'] = idx + 1;
      });
    }

    return [{
      id: 'table_' + Date.now(),
      name: 'ImportierteTabelle',
      fields,
      data: rows
    }];
  };

  const handleAnalyze = () => {
    setError(null);
    if (!inputText.trim()) {
      setError("Bitte fügen Sie zuerst etwas Text oder SQL/JSON ein.");
      return;
    }

    let detected: 'sql' | 'json' | 'csv' | null = null;
    let tablesResult: Table[] = [];

    try {
      const trimmedText = inputText.trim();
      
      // Determine format
      if (format === 'auto') {
        if (trimmedText.startsWith('[') || trimmedText.startsWith('{')) {
          detected = 'json';
        } else if (/CREATE\s+TABLE/i.test(trimmedText)) {
          detected = 'sql';
        } else {
          detected = 'csv';
        }
      } else {
        detected = format;
      }

      setDetectedFormat(detected.toUpperCase());

      if (detected === 'json') {
        tablesResult = parseJsonSchemaOrData(trimmedText);
      } else if (detected === 'sql') {
        tablesResult = parseSqlDdl(trimmedText);
      } else {
        tablesResult = parseCsvText(trimmedText);
      }

      if (tablesResult.length === 0) {
        throw new Error("Es konnten keine Tabellen oder Schemata aus diesem Text extrahiert werden. Überprüfe die Syntax.");
      }

      setParsedTables(tablesResult);
      setStep(2);
      onAddToast(`${tablesResult.length} Tabelle(n) erfolgreich analysiert!`, 'success');

    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  const handleImport = () => {
    if (parsedTables.length === 0) return;
    parsedTables.forEach(t => onSave(t));
    onAddToast(`${parsedTables.length} Tabelle(n) erfolgreich importiert.`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border border-slate-300 flex flex-col h-[650px] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
               <Database className="text-purple-200 animate-pulse"/> Projekt & Schema Text-Import
            </h2>
            <p className="text-purple-100 text-xs mt-1">
              Füge SQL DDL Statements (CREATE TABLE), JSON Schemata oder CSV Daten direkt hier ein.
            </p>
          </div>
          <button onClick={onClose} className="text-purple-200 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
          {step === 1 && (
            <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden">
              <div className="flex justify-between items-center gap-4 shrink-0">
                <div className="flex gap-2 items-center text-sm font-medium text-slate-700">
                  <Settings size={16} className="text-slate-400"/>
                  <span>Import-Format:</span>
                  <div className="flex bg-slate-200 p-1 rounded-lg">
                    {(['auto', 'sql', 'json', 'csv'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${format === f ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
                      >
                        {f === 'auto' ? 'Auto-Erkennung' : f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                
                <span className="text-xs text-slate-400">Tipp: Du kannst beliebig viele CREATE TABLE Anweisungen kopieren.</span>
              </div>

              {/* Textarea */}
              <div className="flex-1 min-h-0 flex flex-col relative border border-slate-300 rounded-lg overflow-hidden bg-slate-900">
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={`-- BEISPIEL SQL DDL:
CREATE TABLE kunden (
    id INT PRIMARY KEY AUTO_INCREMENT,
    firma VARCHAR(255) NOT NULL,
    kontakt VARCHAR(100),
    aktiv BOOLEAN DEFAULT TRUE,
    erstellt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kontakte (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150),
    kunden_id INT
);`}
                  className="flex-1 p-4 bg-slate-900 text-slate-100 font-mono text-xs focus:outline-none resize-none overflow-y-auto leading-relaxed"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700 shrink-0">
                  <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5"/>
                  <p className="leading-normal font-medium">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm shrink-0 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <Check className="text-green-600" size={18}/> Analyse abgeschlossen
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Format: <strong className="text-purple-700">{detectedFormat}</strong> | {parsedTables.length} Tabelle(n) bereit zum Anlegen im System.
                  </p>
                </div>
                
                <div className="text-xs bg-purple-50 text-purple-700 font-bold px-3 py-1.5 rounded-lg border border-purple-100">
                  IndexedDB Engine bereit
                </div>
              </div>

              {/* Table Preview List */}
              <div className="space-y-4">
                {parsedTables.map((table, tIdx) => (
                  <div key={table.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    {/* Table title */}
                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between items-center">
                      <span className="font-bold text-slate-800 flex items-center gap-2 font-mono text-sm">
                        <Database size={16} className="text-slate-400" /> {table.name}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded font-medium">
                        {table.fields.length} Spalten {table.data && table.data.length > 0 ? `| ${table.data.length} Datensätze` : ''}
                      </span>
                    </div>

                    {/* Columns Grid */}
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-white">
                      {table.fields.map(field => (
                        <div key={field.id} className="flex flex-col p-2.5 rounded border border-slate-100 hover:border-slate-300 transition-all bg-slate-50/50">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-slate-700 truncate">{field.name}</span>
                            {field.isPrimaryKey && <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1 py-0.5 rounded">PK</span>}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                            <span className="font-mono bg-purple-50 text-purple-700 px-1 py-0.5 rounded font-bold">{field.type}</span>
                            {field.length && <span className="text-slate-400">({field.length})</span>}
                            {!field.allowNull && <span className="text-red-500 text-[9px] font-bold">NOT NULL</span>}
                          </div>
                          {field.defaultValue && (
                            <div className="text-[9px] text-slate-400 mt-1 italic truncate">
                              Default: {field.defaultValue}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between shrink-0">
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="px-5 py-2.5 border rounded-lg text-slate-700 font-bold hover:bg-slate-100 transition-all text-sm flex items-center gap-2">
              Zurück zur Bearbeitung
            </button>
          ) : (
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <CheckSquare size={14} className="text-purple-600"/>
              <span>Nach dem Import sind die Tabellen sofort in IndexedDB gespeichert und einsatzbereit.</span>
            </div>
          )}

          {step === 1 ? (
            <button
              onClick={handleAnalyze}
              className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm"
            >
              Schema analysieren <ArrowRight size={16}/>
            </button>
          ) : (
            <button
              onClick={handleImport}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm"
            >
              Tabellen anlegen <ArrowRight size={16}/>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
