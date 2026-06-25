
import React, { useState } from 'react';
import { Play, Download, Globe, FileJson, FileSpreadsheet, FileText, Printer, Save, Table as TableIcon, RefreshCw, Plus, Trash2, List, Type, CheckSquare, Settings2, Sliders, Server, GitFork } from 'lucide-react';
import { VirtualTable } from '../../components/VirtualTable';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Table, Field, ApiQueryParam, BackendConfig } from '../../types/index';
import { InputModal } from '../../components/InputModal';
import { fetchApiData, inferFieldType } from '../../utils/apiImportHelper';
import { ArrayExtractionModal } from './ArrayExtractionModal';

interface ApiImportViewProps {
    onSaveTable?: (table: Table) => void;
    showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
    backendConfig?: BackendConfig;
    onUpdateConfig?: (config: BackendConfig) => void;
}

export const ApiImportView: React.FC<ApiImportViewProps> = ({ onSaveTable, showMessage, backendConfig, onUpdateConfig }) => {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState('');
  const [queryParams, setQueryParams] = useState<ApiQueryParam[]>([]);
  const [refreshOnLoad, setRefreshOnLoad] = useState(false);
  
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showParamBuilder, setShowParamBuilder] = useState(true);
  const [showBaseUrlSettings, setShowBaseUrlSettings] = useState(false);

  // Extraction State
  const [extractColumn, setExtractColumn] = useState<string | null>(null);

  // Schema Mapping State
  const [schemaOverrides, setSchemaOverrides] = useState<Record<string, Field['type']>>({});
  const [activeViewTab, setActiveViewTab] = useState<'data' | 'schema'>('data');
  const [primaryKeyCol, setPrimaryKeyCol] = useState<string | null>(null);

  // --- Parameter Logic ---
  const addParam = () => {
      setQueryParams([...queryParams, {
          id: crypto.randomUUID(),
          key: '',
          value: '',
          type: 'text',
          isActive: true
      }]);
  };

  const updateParam = (id: string, updates: Partial<ApiQueryParam>) => {
      setQueryParams(queryParams.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removeParam = (id: string) => {
      setQueryParams(queryParams.filter(p => p.id !== id));
  };

  const getEffectiveUrl = () => {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      
      const baseUrl = backendConfig?.apiBaseUrl;
      if (baseUrl) {
          const cleanBase = baseUrl.replace(/\/$/, '');
          const cleanPath = url.startsWith('/') ? url : '/' + url;
          return cleanBase + cleanPath;
      }
      return url; 
  };

  const handleFetch = async () => {
    const targetUrl = getEffectiveUrl();
    if (!targetUrl) return;
    
    setIsLoading(true);
    setError(null);
    setData([]);
    setPrimaryKeyCol(null); // Reset PK when fetching new data

    const result = await fetchApiData(targetUrl, method, headers, queryParams);
    
    if (result.error) {
        setError(result.error);
        showMessage("API Fehler", result.error, 'error');
    } else {
        setData(result.data);
        if (result.data.length === 0) {
            showMessage("Hinweis", "Die API lieferte eine leere Antwort.", 'info');
        }
    }
    setIsLoading(false);
  };

  const getColumns = () => {
      if (data.length === 0) return [];
      return Object.keys(data[0]).filter(k => k !== '_ImportId');
  };

  const handleSaveClick = () => {
      if (!onSaveTable || data.length === 0) return;
      setShowSaveModal(true);
  };

  const handleExtractionSave = (newTable: Table) => {
      if(onSaveTable) {
          onSaveTable(newTable);
          showMessage("Tabelle erstellt", `Die Tabelle "${newTable.name}" wurde aus dem Array extrahiert.`, 'success');
      }
  };

  const performSave = (tableName: string) => {
      if (!tableName) return;

      const columns = getColumns();
      const sampleRow = data[0];

      let needsAutoId = false;
      const hasIdColumn = columns.some(c => c.toLowerCase() === 'id');
      if (!primaryKeyCol && !hasIdColumn) {
          needsAutoId = true;
      }

      const fields: Field[] = columns.map(col => {
          const sampleVal = sampleRow[col];
          const inferredType = Array.isArray(sampleVal) ? 'TEXT' : inferFieldType(sampleVal);
          const type = schemaOverrides[col] || inferredType;
          
          let isId = false;
          if (primaryKeyCol) {
              isId = col === primaryKeyCol;
          } else {
              isId = col.toLowerCase() === 'id';
          }
          
          return {
              id: crypto.randomUUID(),
              name: col,
              type: type,
              isPrimaryKey: isId,
              isAutoIncrement: isId && type === 'INTEGER',
              allowNull: !isId
          };
      });

      // Ensure stable ID for linking
      if (needsAutoId) {
          fields.unshift({
              id: crypto.randomUUID(),
              name: 'id',
              type: 'INTEGER',
              isPrimaryKey: true,
              isAutoIncrement: true
          });
      } else {
          // If we have a PK, ensure _ImportId is also present if we rely on it for extraction linking,
          // but usually the extraction happens BEFORE save. 
          // If we save the main table, we might want to preserve the _ImportId as a key if it was used for linking.
          // For simplicity, we just add _ImportId as a regular field if it exists in data
          if (data[0]['_ImportId']) {
               fields.push({ id: crypto.randomUUID(), name: '_ImportId', type: 'INTEGER' });
          }
      }

      const savedUrl = getEffectiveUrl();

      // Clean data for saving (stringify remaining arrays, cast types)
      const cleanData = data.map(row => {
          const newRow = { ...row };
          if (needsAutoId) {
              newRow['id'] = newRow['_ImportId'];
          }

          for (const key in newRow) {
              const override = schemaOverrides[key];
              if (Array.isArray(newRow[key])) {
                  newRow[key] = JSON.stringify(newRow[key]); // Flatten for storage
              } else if (override === 'INTEGER' && newRow[key] !== null && newRow[key] !== undefined) {
                  const parsed = parseInt(newRow[key], 10);
                  newRow[key] = isNaN(parsed) ? null : parsed;
              } else if (override === 'REAL' && newRow[key] !== null && newRow[key] !== undefined) {
                  const parsed = parseFloat(newRow[key]);
                  newRow[key] = isNaN(parsed) ? null : parsed;
              } else if (override === 'BOOLEAN' && newRow[key] !== null && newRow[key] !== undefined) {
                  newRow[key] = (newRow[key] === 'true' || newRow[key] === true || newRow[key] === 1 || newRow[key] === '1') ? 1 : 0;
              } else if (override === 'TEXT' && newRow[key] !== null && newRow[key] !== undefined) {
                  newRow[key] = String(newRow[key]);
              }
          }
          return newRow;
      });

      const newTable: Table = {
          id: crypto.randomUUID(),
          name: tableName,
          fields: fields,
          data: cleanData,
          isApiImport: true,
          apiConfig: {
              url: savedUrl,
              method,
              headers: headers || undefined,
              queryParams,
              refreshOnLoad
          }
      };

      onSaveTable && onSaveTable(newTable);
      setShowSaveModal(false);
      showMessage("Tabelle erstellt", `Tabelle "${tableName}" gespeichert.`, 'success');
  };

  const renderRow = (row: any, rowIndex: number) => {
      const cols = getColumns();
      return (
        <div className="flex border-b border-slate-100 hover:bg-sky-50 group h-full items-center text-sm text-slate-700">
            {cols.map(header => {
                const val = row[header];
                if (Array.isArray(val)) {
                    return (
                        <div key={`${rowIndex}-${header}`} className="w-40 shrink-0 border-r border-slate-100 h-full px-2 py-1 flex items-center justify-center bg-slate-50">
                            <button 
                                onClick={() => setExtractColumn(header)}
                                className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-200 flex items-center gap-1 font-semibold transition-colors"
                                title="Klicken um als eigene Tabelle zu extrahieren"
                            >
                                <GitFork size={12}/> Array ({val.length})
                            </button>
                        </div>
                    );
                }
                return (
                    <div key={`${rowIndex}-${header}`} className="w-40 shrink-0 border-r border-slate-100 h-full px-2 py-1 overflow-hidden truncate" title={String(val)}>
                        {String(val ?? '')}
                    </div>
                );
            })}
        </div>
      );
  };

  const constructPreviewUrl = () => {
      try {
          const effective = getEffectiveUrl();
          const urlObj = new URL(effective || 'http://localhost');
          queryParams.forEach(p => {
              if (p.isActive && p.key) urlObj.searchParams.append(p.key, p.value);
          });
          return urlObj.toString();
      } catch { return getEffectiveUrl(); }
  };

  const updateBaseUrl = (newUrl: string) => {
      if (backendConfig && onUpdateConfig) {
          onUpdateConfig({ ...backendConfig, apiBaseUrl: newUrl });
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Config Bar */}
      <div className="bg-white p-4 border-b border-slate-200 shadow-sm shrink-0">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <Globe className="text-blue-600" /> API Abfrage & Import
            </h2>
            <div className="flex items-center gap-2">
                {backendConfig && (
                    <button 
                        onClick={() => setShowBaseUrlSettings(!showBaseUrlSettings)} 
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold border rounded transition-colors ${showBaseUrlSettings || backendConfig.apiBaseUrl ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                        title="Globale Server-URL definieren"
                    >
                        <Server size={14}/> {backendConfig.apiBaseUrl ? 'Basis-URL aktiv' : 'Basis-URL definieren'}
                    </button>
                )}
                {data.length > 0 && onSaveTable && (
                    <div className="flex items-center gap-2 border-l pl-2 ml-2">
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer border border-slate-300 rounded px-2 py-1 bg-slate-50 hover:bg-white">
                            <input 
                                type="checkbox" 
                                checked={refreshOnLoad} 
                                onChange={e => setRefreshOnLoad(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="flex items-center gap-1"><RefreshCw size={14} /> Live-Verbindung</span>
                        </label>
                        <button 
                            onClick={handleSaveClick}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-semibold shadow-sm transition-colors"
                        >
                            <Save size={16} /> Speichern
                        </button>
                    </div>
                )}
            </div>
        </div>
        
        {/* Base URL Settings Panel */}
        {showBaseUrlSettings && backendConfig && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded animate-in slide-in-from-top-2">
                <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Globale Projekt Basis-URL</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={backendConfig.apiBaseUrl || ''}
                        onChange={e => updateBaseUrl(e.target.value)}
                        placeholder="https://api.mein-server.de/v1"
                        className="flex-1 border border-blue-200 rounded px-2 py-1 text-sm text-blue-900 placeholder:text-blue-300 focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                </div>
            </div>
        )}

        <div className="flex flex-col gap-4">
            <div className="flex gap-2">
                <select 
                    value={method} 
                    onChange={e => setMethod(e.target.value)}
                    className="border border-slate-300 rounded px-3 py-2 bg-slate-50 font-bold text-slate-700 text-sm"
                >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                </select>
                <input 
                    type="text" 
                    value={url} 
                    onChange={e => setUrl(e.target.value)}
                    placeholder={backendConfig?.apiBaseUrl ? "/endpoint (oder volle URL)" : "https://api.example.com/data"}
                    className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
                <button 
                    onClick={handleFetch} 
                    disabled={isLoading || !url}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                    {isLoading ? 'Laden...' : <><Play size={16} /> Abrufen</>}
                </button>
            </div>

            {/* Params Builder Toggle */}
            <div className="flex items-center gap-4 text-sm">
                <button onClick={() => setShowParamBuilder(!showParamBuilder)} className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-semibold">
                    <Sliders size={14} /> {showParamBuilder ? 'Parameter verbergen' : 'Parameter & Optionen'}
                </button>
                <div className="text-slate-400 text-xs truncate max-w-xl font-mono bg-slate-100 px-2 py-0.5 rounded">
                    {constructPreviewUrl()}
                </div>
            </div>

            {/* Params Builder Area */}
            {showParamBuilder && (
                <div className="bg-slate-50 border border-slate-200 rounded p-3 animate-in slide-in-from-top-2">
                    <div className="space-y-2">
                        {queryParams.map((param, idx) => (
                            <div key={param.id} className="flex gap-2 items-center">
                                <input 
                                    type="checkbox" 
                                    checked={param.isActive} 
                                    onChange={e => updateParam(param.id, { isActive: e.target.checked })}
                                    className="rounded"
                                />
                                <input 
                                    type="text" 
                                    placeholder="Name (z.B. status)"
                                    value={param.key}
                                    onChange={e => updateParam(param.id, { key: e.target.value })}
                                    className="w-40 border border-slate-300 rounded px-2 py-1 text-sm"
                                />
                                
                                <div className="flex border border-slate-300 rounded bg-white overflow-hidden">
                                    <button 
                                        onClick={() => updateParam(param.id, { type: 'text' })}
                                        className={`px-2 py-1 ${param.type === 'text' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-50'}`}
                                        title="Freitext"
                                    >
                                        <Type size={14} />
                                    </button>
                                    <button 
                                        onClick={() => updateParam(param.id, { type: 'select' })}
                                        className={`px-2 py-1 ${param.type === 'select' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-50'}`}
                                        title="Dropdown Liste"
                                    >
                                        <List size={14} />
                                    </button>
                                </div>

                                {param.type === 'select' ? (
                                    <div className="flex gap-2 flex-1">
                                        <input 
                                            type="text" 
                                            placeholder="Optionen kommasepariert (z.B. available, pending, sold)"
                                            value={param.options ? param.options.join(',') : ''}
                                            onChange={e => updateParam(param.id, { options: e.target.value.split(',') })}
                                            className="flex-1 border border-orange-200 rounded px-2 py-1 text-sm bg-orange-50 focus:bg-white transition-colors"
                                        />
                                        <select 
                                            value={param.value}
                                            onChange={e => updateParam(param.id, { value: e.target.value })}
                                            className="w-40 border border-slate-300 rounded px-2 py-1 text-sm"
                                        >
                                            <option value="">(Auswählen)</option>
                                            {param.options?.map(opt => <option key={opt} value={opt.trim()}>{opt.trim()}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <input 
                                        type="text" 
                                        placeholder="Wert"
                                        value={param.value}
                                        onChange={e => updateParam(param.id, { value: e.target.value })}
                                        className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm"
                                    />
                                )}

                                <button onClick={() => removeParam(param.id)} className="text-slate-400 hover:text-red-500">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button onClick={addParam} className="text-xs flex items-center gap-1 text-blue-600 hover:underline mt-2">
                            <Plus size={12} /> Parameter hinzufügen
                        </button>
                    </div>
                </div>
            )}
            
            <details className="text-xs">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-700 font-semibold mb-1">Header Optionen (Authorization)</summary>
                <textarea 
                    value={headers}
                    onChange={e => setHeaders(e.target.value)}
                    placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
                    className="w-full border border-slate-300 rounded p-2 font-mono h-20"
                />
            </details>
        </div>
      </div>

      {error && (
          <div className="bg-red-50 text-red-600 p-4 border-b border-red-100 text-sm">
              <strong>Letzter Fehler:</strong> {error}
          </div>
      )}

      {/* TABS */}
      {data.length > 0 && (
         <div className="flex border-b border-slate-200 px-4 bg-white shrink-0">
             <button onClick={() => setActiveViewTab('data')} className={`px-4 py-2 text-sm font-bold border-b-2 flex items-center gap-2 ${activeViewTab === 'data' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                 <TableIcon size={16} /> Daten-Vorschau
             </button>
             <button onClick={() => setActiveViewTab('schema')} className={`px-4 py-2 text-sm font-bold border-b-2 flex items-center gap-2 ${activeViewTab === 'schema' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                 <Sliders size={16} /> Datentyp-Mapper / Schema
             </button>
         </div>
      )}

      {/* Data Table */}
      <div className="flex-1 overflow-hidden relative bg-slate-50">
          {data.length > 0 ? (
             activeViewTab === 'data' ? (
              <VirtualTable 
                data={data}
                headers={getColumns()}
                renderRow={renderRow}
                rowHeight={35}
              />
             ) : (
                <div className="p-4 h-full overflow-auto bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Schema & Datentyp Mapping</h3>
                    <p className="text-sm text-slate-600 mb-6 max-w-4xl">
                        Alle Felder wurden basierend auf dem ersten Datensatz automatisch erkannt. Sie können jedoch explizit erzwingen, dass bestimmte Felder als Zahl, Text oder Datum konvertiert werden sollen. Dies ist besonders nützlich, wenn Ihre API Zahlen als Text-Strings liefert und Sie diese für Berechnungen oder Filterung umwandeln müssen.
                    </p>
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm max-w-4xl">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
                                <tr>
                                    <th className="px-4 py-3">Spaltenname (API)</th>
                                    <th className="px-4 py-3 text-center">Primärschlüssel</th>
                                    <th className="px-4 py-3">Beispielwert</th>
                                    <th className="px-4 py-3">Erkannter / Gewählter Typ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y border-slate-100">
                                {getColumns().map(col => {
                                    const sampleVal = data[0][col];
                                    const currentType = schemaOverrides[col] || (Array.isArray(sampleVal) ? 'TEXT' : inferFieldType(sampleVal));
                                    
                                    return (
                                        <tr key={col} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-mono font-bold text-slate-700">{col}</td>
                                            <td className="px-4 py-3 text-center">
                                                <input 
                                                    type="radio" 
                                                    name="primaryKeyApi" 
                                                    checked={primaryKeyCol === col} 
                                                    onChange={() => setPrimaryKeyCol(col)}
                                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]" title={String(sampleVal)}>
                                                {Array.isArray(sampleVal) ? `[Array mit ${sampleVal.length} Elementen]` : String(sampleVal ?? 'null')}
                                            </td>
                                            <td className="px-4 py-3 flex items-center gap-2">
                                                <select 
                                                    value={currentType}
                                                    onChange={e => setSchemaOverrides(prev => ({ ...prev, [col]: e.target.value as Field['type'] }))}
                                                    className={`border rounded px-2 py-1.5 text-sm w-full max-w-[200px] outline-none ${schemaOverrides[col] ? 'border-orange-400 bg-orange-50 font-bold text-orange-800' : 'border-slate-300 bg-white text-slate-700'}`}
                                                >
                                                    <option value="TEXT">Text (VARCHAR)</option>
                                                    <option value="INTEGER">Ganzzahl (INTEGER)</option>
                                                    <option value="REAL">Dezimalzahl (REAL)</option>
                                                    <option value="BOOLEAN">Wahrheitswert (BOOLEAN)</option>
                                                    <option value="DATE">Datum (DATE)</option>
                                                    <option value="TIME">Uhrzeit (TIME)</option>
                                                    <option value="DATETIME">Datum & Zeit (DATETIME)</option>
                                                    <option value="TIMESTAMP">Zeitstempel (TIMESTAMP)</option>
                                                    <option value="TINYINT">Winzige Ganzzahl (TINYINT)</option>
                                                </select>
                                                {schemaOverrides[col] ? (
                                                    <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">Manuell geändert</span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Automatisch erkannt</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
             )
          ) : (
              !isLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                      <FileJson size={64} className="opacity-20" />
                      <div className="text-center">
                          <p className="font-semibold">Konfigurieren Sie die API-Anfrage oben.</p>
                      </div>
                  </div>
              )
          )}
      </div>

      {showSaveModal && (
        <InputModal 
            title="Tabelle speichern" 
            label="Name der neuen Tabelle:" 
            initialValue="ApiData" 
            onConfirm={performSave} 
            onCancel={() => setShowSaveModal(false)} 
        />
      )}

      {extractColumn && (
          <ArrayExtractionModal 
            parentData={data} 
            arrayColumn={extractColumn} 
            onSave={handleExtractionSave}
            onClose={() => setExtractColumn(null)}
          />
      )}
    </div>
  );
};
