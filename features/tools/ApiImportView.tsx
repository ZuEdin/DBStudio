
import React, { useState } from 'react';
import { Play, Download, Globe, FileJson, FileSpreadsheet, FileText, Printer, Save, Table as TableIcon, RefreshCw, Plus, Trash2, List, Type, CheckSquare, Settings2, Sliders, Server, GitFork, Copy, Check, Database, ChevronDown } from 'lucide-react';
import { VirtualTable } from '../../components/VirtualTable';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Table, Field, ApiQueryParam, BackendConfig } from '../../types/index';
import { InputModal } from '../../components/InputModal';
import { fetchApiData, inferFieldType } from '../../utils/apiImportHelper';
import { ArrayExtractionModal } from './ArrayExtractionModal';
import { generateSqlServerMigration, generateDotNetCode, generateNodeCode, generatePhpCode } from '../../utils/apiCodeGenerator';

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
  const [saveTableName, setSaveTableName] = useState('ApiData');
  const [showParamBuilder, setShowParamBuilder] = useState(true);
  const [showBaseUrlSettings, setShowBaseUrlSettings] = useState(false);

  // Extraction State
  const [extractColumn, setExtractColumn] = useState<string | null>(null);

  // Schema Mapping State
  const [schemaOverrides, setSchemaOverrides] = useState<Record<string, Field['type']>>({});
  const [activeViewTab, setActiveViewTab] = useState<'data' | 'schema' | 'backend_code'>('data');
  const [primaryKeyCol, setPrimaryKeyCol] = useState<string | null>(null);
  const [backendLang, setBackendLang] = useState<'dotnet' | 'node' | 'php'>('dotnet');
  const [copied, setCopied] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);

  // Backend API states
  const [showBackendApiModal, setShowBackendApiModal] = useState(false);
  const [backendApiName, setBackendApiName] = useState('ApiData');
  const [backendApiOption, setBackendApiOption] = useState<'A' | 'B'>('A');
  const [backendRefreshInterval, setBackendRefreshInterval] = useState<number>(0);
  const [isRegistering, setIsRegistering] = useState(false);

  // API Authentication States
  const [authType, setAuthType] = useState<'none' | 'apiKey' | 'bearer' | 'basic'>('none');
  const [authApiKeyName, setAuthApiKeyName] = useState('Authorization');
  const [authApiKeyValue, setAuthApiKeyValue] = useState('');
  const [authApiKeyPrefix, setAuthApiKeyPrefix] = useState('Bearer ');
  const [authApiKeyLocation, setAuthApiKeyLocation] = useState<'header' | 'query'>('header');
  const [authBearerToken, setAuthBearerToken] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');

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

    const result = await fetchApiData(targetUrl, method, headers, queryParams, {
        authType,
        authApiKeyName,
        authApiKeyValue,
        authApiKeyPrefix,
        authApiKeyLocation,
        authBearerToken,
        authUsername,
        authPassword
    });
    
    if (result.error) {
        setError(result.error);
        showMessage("API Fehler", result.error, 'error');
    } else {
        setData(result.data);
        if (result.data.length > 0) {
            const cols = Object.keys(result.data[0]).filter(k => k !== '_ImportId');
            // Check for exact 'id' (case-insensitive)
            let detectedPk = cols.find(c => c.toLowerCase() === 'id');
            if (!detectedPk) {
                // Check for columns ending with 'id' or '_id'
                detectedPk = cols.find(c => c.toLowerCase().endsWith('id') || c.toLowerCase().endsWith('_id'));
            }
            if (detectedPk) {
                setPrimaryKeyCol(detectedPk);
            }
        }
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
      setSaveTableName('ApiData');
      setShowSaveModal(true);
  };

  const handleExtractionSave = (newTable: Table) => {
      if(onSaveTable) {
          onSaveTable(newTable);
          showMessage("Tabelle erstellt", `Die Tabelle "${newTable.name}" wurde aus dem Array extrahiert.`, 'success');
      }
  };

  const performBackendSave = async () => {
      if (!backendApiName) return;
      setIsRegistering(true);

      try {
          const columns = getColumns();
          const sampleRow = data[0];

          let needsAutoId = false;
          if (!primaryKeyCol) {
              const hasIdColumn = columns.some(c => c.toLowerCase() === 'id');
              if (!hasIdColumn) {
                  needsAutoId = true;
              }
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

          if (needsAutoId) {
              fields.unshift({
                  id: crypto.randomUUID(),
                  name: 'id',
                  type: 'INTEGER',
                  isPrimaryKey: true,
                  isAutoIncrement: true,
                  allowNull: false
              });
          } else if (data[0] && data[0]['_ImportId']) {
              fields.push({ id: crypto.randomUUID(), name: '_ImportId', type: 'INTEGER', allowNull: true });
          }

          const savedUrl = getEffectiveUrl();

          const cleanData = data.map(row => {
              const newRow = { ...row };
              if (needsAutoId) {
                  newRow['id'] = newRow['_ImportId'];
              }

              for (const key in newRow) {
                  const override = schemaOverrides[key];
                  if (Array.isArray(newRow[key])) {
                      newRow[key] = JSON.stringify(newRow[key]);
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

          // 1. Send configuration to backend
          const response = await fetch('/api/backend-apis', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  name: backendApiName,
                  url: savedUrl,
                  method,
                  headers: headers || "{}",
                  queryParams,
                  option: backendApiOption,
                  refreshInterval: backendRefreshInterval,
                  fields: fields,
                  data: backendApiOption === 'A' ? [] : cleanData,
                  authType,
                  authApiKeyName,
                  authApiKeyValue,
                  authApiKeyPrefix,
                  authApiKeyLocation,
                  authBearerToken,
                  authUsername,
                  authPassword
              })
          });

          if (!response.ok) {
              const errData = await response.json();
              throw new Error(errData.error || 'Fehler beim Registrieren im Backend.');
          }

          // 2. If Option B is chosen, let's trigger a refresh so the backend fetches live data and populates files right away
          if (backendApiOption === 'B') {
              const refreshResponse = await fetch(`/api/backend-apis/${encodeURIComponent(backendApiName)}/refresh`, {
                  method: 'POST'
              });
              if (!refreshResponse.ok) {
                  console.warn("Backend Cache initial sync warning");
              }
          }

          // 3. Create active table model in frontend pointing to our backend API!
          const newTable: Table = {
              id: crypto.randomUUID(),
              name: backendApiName,
              fields: fields,
              data: cleanData,
              isApiImport: true,
              apiConfig: {
                  url: `/api/backend-apis/${backendApiName}/data`,
                  method: 'GET',
                  headers: '{}',
                  queryParams: [],
                  refreshOnLoad: true
              }
          };

          onSaveTable && onSaveTable(newTable);
          setShowBackendApiModal(false);
          showMessage("Backend-API registriert", `Die API "${backendApiName}" wurde erfolgreich registriert (Option ${backendApiOption === 'A' ? 'A - Proxy' : 'B - Cache'}) und als lokale Tabelle gespeichert.`, 'success');
      } catch (err: any) {
          showMessage("Fehler bei Backend-Registrierung", err.message || "Es trat ein Fehler auf.", "error");
      } finally {
          setIsRegistering(false);
      }
  };

  const performSave = (tableName: string) => {
      if (!tableName) return;

      const columns = getColumns();
      const sampleRow = data[0];

      let needsAutoId = false;
      if (!primaryKeyCol) {
          const hasIdColumn = columns.some(c => c.toLowerCase() === 'id');
          if (!hasIdColumn) {
              needsAutoId = true;
          }
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
              refreshOnLoad,
              authType,
              authApiKeyName,
              authApiKeyValue,
              authApiKeyPrefix,
              authApiKeyLocation,
              authBearerToken,
              authUsername,
              authPassword
          }
      };

      onSaveTable && onSaveTable(newTable);
      setShowSaveModal(false);
      showMessage("Tabelle erstellt", `Tabelle "${tableName}" gespeichert.`, 'success');
  };

  const exportToExcel = () => {
      try {
          const ws = XLSX.utils.json_to_sheet(data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "API Daten");
          XLSX.writeFile(wb, "api_export.xlsx");
          showMessage("Excel Export", "Die Daten wurden erfolgreich als Excel-Datei exportiert.", "success");
      } catch (err: any) {
          showMessage("Fehler beim Export", err.message || "Unbekannter Fehler beim Excel-Export.", "error");
      }
  };

  const exportToJson = () => {
      try {
          const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
          const downloadAnchor = document.createElement('a');
          downloadAnchor.setAttribute("href", jsonString);
          downloadAnchor.setAttribute("download", "api_export.json");
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();
          showMessage("JSON Export", "Die Daten wurden erfolgreich als JSON-Datei exportiert.", "success");
      } catch (err: any) {
          showMessage("Fehler beim Export", err.message || "Unbekannter Fehler beim JSON-Export.", "error");
      }
  };

  const exportToPdf = () => {
      try {
          const doc = new jsPDF();
          doc.text("API Daten Export", 14, 15);
          
          const headers = getColumns();
          const rows = data.map(item => headers.map(header => {
              const val = item[header];
              return Array.isArray(val) ? `[Array(${val.length})]` : String(val ?? '');
          }));

          autoTable(doc, {
              head: [headers],
              body: rows,
              startY: 20,
              theme: 'striped',
              styles: { fontSize: 8, overflow: 'ellipsize' }
          });

          doc.save("api_export.pdf");
          showMessage("PDF Export", "Die Daten wurden erfolgreich als PDF-Datei exportiert.", "success");
      } catch (err: any) {
          showMessage("Fehler beim Export", err.message || "Unbekannter Fehler beim PDF-Export.", "error");
      }
  };

  const getDynamicFields = (): Field[] => {
      const columns = getColumns();
      if (columns.length === 0) return [];
      const sampleRow = data[0];

      return columns.map(col => {
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
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer border border-slate-300 rounded px-2 py-1 bg-slate-50 hover:bg-white select-none">
                            <input 
                                type="checkbox" 
                                checked={refreshOnLoad} 
                                onChange={e => setRefreshOnLoad(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="flex items-center gap-1"><RefreshCw size={14} /> Live-Verbindung</span>
                        </label>
                        
                        <div className="relative inline-block text-left">
                            <div className="flex items-center shadow-sm rounded-md overflow-hidden">
                                <button 
                                    onClick={handleSaveClick}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white pl-4 pr-3 py-2 text-sm font-semibold transition-colors border-r border-indigo-500"
                                    title="Daten direkt als eigene Tabelle in IndexedDB speichern"
                                >
                                    <Save size={16} /> Speichern als eigene Tabelle
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-2 text-sm font-semibold transition-colors h-[38px] flex items-center justify-center"
                                    title="Weitere Speicher- & Export-Optionen"
                                >
                                    <ChevronDown size={16} className={`transition-transform duration-200 ${showSaveDropdown ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            {showSaveDropdown && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={() => setShowSaveDropdown(false)}
                                    />
                                    <div className="absolute right-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden divide-y divide-slate-100 origin-top-right animate-in fade-in slide-in-from-top-1 duration-150">
                                        <div className="p-1">
                                            <button
                                                onClick={() => {
                                                    setShowSaveDropdown(false);
                                                    handleSaveClick();
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 rounded flex items-start gap-2.5 transition-colors group"
                                            >
                                                <TableIcon size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                                                <div>
                                                    <span className="font-bold block text-xs text-slate-800">In App-Datenbank speichern</span>
                                                    <span className="text-[10px] text-slate-500 block leading-normal mt-0.5">
                                                        Erstellt automatisch eine eigene Tabelle im lokalen App-Speicher (IndexedDB). Kein SQL-Code erforderlich!
                                                    </span>
                                                </div>
                                            </button>
                                        </div>

                                        <div className="p-1 border-t border-slate-100">
                                            <button
                                                onClick={() => {
                                                    setShowSaveDropdown(false);
                                                    setBackendApiName('ApiData');
                                                    setShowBackendApiModal(true);
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 rounded flex items-start gap-2.5 transition-colors group"
                                            >
                                                <Server size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                                                <div>
                                                    <span className="font-bold block text-xs text-slate-800">Als Backend-API speichern</span>
                                                    <span className="text-[10px] text-slate-500 block leading-normal mt-0.5">
                                                        Registriert die API am Backend (Option A Proxy / Option B Server-Datenbank) für vollständige Kontrolle.
                                                    </span>
                                                </div>
                                            </button>
                                        </div>

                                        <div className="p-1.5 bg-slate-50">
                                            <span className="block px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lokaler Datei-Export</span>
                                            
                                            <button
                                                onClick={() => {
                                                    setShowSaveDropdown(false);
                                                    exportToExcel();
                                                }}
                                                className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-white hover:text-emerald-700 rounded flex items-center gap-2 transition-colors mt-1 font-medium"
                                            >
                                                <FileSpreadsheet size={14} className="text-emerald-600" />
                                                <span>Excel-Export (.xlsx)</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setShowSaveDropdown(false);
                                                    exportToJson();
                                                }}
                                                className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-white hover:text-amber-700 rounded flex items-center gap-2 transition-colors font-medium"
                                            >
                                                <FileJson size={14} className="text-amber-600" />
                                                <span>JSON-Export (.json)</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setShowSaveDropdown(false);
                                                    exportToPdf();
                                                }}
                                                className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-white hover:text-rose-700 rounded flex items-center gap-2 transition-colors font-medium"
                                            >
                                                <FileText size={14} className="text-rose-600" />
                                                <span>PDF-Export (.pdf)</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
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

        {/* Preset API Selector */}
        <div className="mb-4 bg-slate-50 border border-slate-200 rounded p-3">
            <span className="block text-xs font-bold text-slate-500 uppercase mb-2">Beispiel-APIs zum schnellen Testen:</span>
            <div className="flex flex-wrap gap-2">
                <button 
                    type="button"
                    onClick={() => {
                        setUrl('https://jsonplaceholder.typicode.com/users');
                        setMethod('GET');
                        setQueryParams([]);
                    }}
                    className="bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-xs font-medium text-slate-700 px-3 py-1.5 rounded transition-all flex items-center gap-1 shadow-sm"
                >
                    <Globe size={12} className="text-blue-500" /> Benutzer-Daten (REST)
                </button>
                <button 
                    type="button"
                    onClick={() => {
                        setUrl('https://jsonplaceholder.typicode.com/todos');
                        setMethod('GET');
                        setQueryParams([]);
                    }}
                    className="bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-xs font-medium text-slate-700 px-3 py-1.5 rounded transition-all flex items-center gap-1 shadow-sm"
                >
                    <Globe size={12} className="text-emerald-500" /> Todo-Liste (REST)
                </button>
                <button 
                    type="button"
                    onClick={() => {
                        setUrl('https://dummyjson.com/products');
                        setMethod('GET');
                        setQueryParams([]);
                    }}
                    className="bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-xs font-medium text-slate-700 px-3 py-1.5 rounded transition-all flex items-center gap-1 shadow-sm"
                >
                    <Globe size={12} className="text-orange-500" /> Produkt-Katalog (DummyJSON)
                </button>
            </div>
        </div>

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
            
            {/* API Authentication Card */}
            <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-2 mt-2">
                <span className="block text-xs font-bold text-slate-500 uppercase mb-2">📡 API-Authentifizierung (API Auth)</span>
                
                {/* Auth Type Buttons */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                    <button 
                        type="button"
                        onClick={() => setAuthType('none')}
                        className={`py-1.5 text-xs font-bold rounded border transition-all ${authType === 'none' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        Keine Auth
                    </button>
                    <button 
                        type="button"
                        onClick={() => setAuthType('bearer')}
                        className={`py-1.5 text-xs font-bold rounded border transition-all ${authType === 'bearer' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        Bearer Token
                    </button>
                    <button 
                        type="button"
                        onClick={() => setAuthType('apiKey')}
                        className={`py-1.5 text-xs font-bold rounded border transition-all ${authType === 'apiKey' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        API-Key
                    </button>
                    <button 
                        type="button"
                        onClick={() => setAuthType('basic')}
                        className={`py-1.5 text-xs font-bold rounded border transition-all ${authType === 'basic' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        Basic Auth
                    </button>
                </div>

                {/* Conditional Inputs */}
                {authType === 'bearer' && (
                    <div className="space-y-2 animate-in fade-in duration-150">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">Bearer Token</label>
                            <input 
                                type="password"
                                placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                                value={authBearerToken}
                                onChange={e => setAuthBearerToken(e.target.value)}
                                className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-mono"
                            />
                            <span className="text-[10px] text-slate-400 mt-0.5 block">Fügt automatisch den Header <code>Authorization: Bearer &lt;Token&gt;</code> hinzu.</span>
                        </div>
                    </div>
                )}

                {authType === 'apiKey' && (
                    <div className="space-y-3 animate-in fade-in duration-150">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">Parameter / Header Name</label>
                                <input 
                                    type="text"
                                    placeholder="X-API-Key oder api_key"
                                    value={authApiKeyName}
                                    onChange={e => setAuthApiKeyName(e.target.value)}
                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">Übertragungsweg</label>
                                <select 
                                    value={authApiKeyLocation}
                                    onChange={e => setAuthApiKeyLocation(e.target.value as 'header' | 'query')}
                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs bg-white"
                                >
                                    <option value="header">Header (Empfohlen)</option>
                                    <option value="query">Query-Parameter (URL)</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">API Key Wert</label>
                            <input 
                                type="password"
                                placeholder="Geheimer Schlüssel"
                                value={authApiKeyValue}
                                onChange={e => setAuthApiKeyValue(e.target.value)}
                                className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-mono"
                            />
                        </div>
                        {authApiKeyLocation === 'header' && (
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">Prefix (Optional)</label>
                                <input 
                                    type="text"
                                    placeholder="z.B. Bearer oder Token (leerlassen für kein Prefix)"
                                    value={authApiKeyPrefix}
                                    onChange={e => setAuthApiKeyPrefix(e.target.value)}
                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-mono"
                                />
                            </div>
                        )}
                    </div>
                )}

                {authType === 'basic' && (
                    <div className="space-y-2 animate-in fade-in duration-150">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">Benutzername</label>
                                <input 
                                    type="text"
                                    placeholder="Username / Client ID"
                                    value={authUsername}
                                    onChange={e => setAuthUsername(e.target.value)}
                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">Passwort</label>
                                <input 
                                    type="password"
                                    placeholder="Password / Secret"
                                    value={authPassword}
                                    onChange={e => setAuthPassword(e.target.value)}
                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-mono"
                                />
                            </div>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">Fügt automatisch den Base64-codierten <code>Authorization: Basic ...</code> Header hinzu.</span>
                    </div>
                )}
            </div>

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
             <button onClick={() => setActiveViewTab('backend_code')} className={`px-4 py-2 text-sm font-bold border-b-2 flex items-center gap-2 ${activeViewTab === 'backend_code' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                 <Server size={16} className="text-emerald-500" /> ⚡ SQL Server Backend-Code
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
             ) : activeViewTab === 'schema' ? (
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
             ) : (
                (() => {
                    const fieldsForCode = getDynamicFields();
                    const targetUrlForCode = getEffectiveUrl() || 'https://api.example.com/data';
                    const tableNameForCode = 'ApiData';

                    let activeCode = '';
                    if (backendLang === 'dotnet') {
                        activeCode = generateDotNetCode(tableNameForCode, fieldsForCode, targetUrlForCode);
                    } else if (backendLang === 'node') {
                        activeCode = generateNodeCode(tableNameForCode, fieldsForCode, targetUrlForCode);
                    } else {
                        activeCode = generatePhpCode(tableNameForCode, fieldsForCode, targetUrlForCode);
                    }

                    const sqlServerMigration = generateSqlServerMigration(tableNameForCode, fieldsForCode);

                    return (
                        <div className="p-4 h-full overflow-auto bg-slate-50 flex flex-col gap-4 animate-in fade-in duration-200">
                            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 rounded-lg p-4 shadow-sm shrink-0 gap-4">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                        <Server size={18} className="text-emerald-500" /> SQL Server Code-Generator
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Generieren Sie einsatzbereiten Code, um diese API-Struktur automatisch in Ihrer produktiven SQL-Server-Datenbank zu synchronisieren.
                                    </p>
                                </div>
                                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto shrink-0">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setBackendLang('dotnet');
                                            setCopied(false);
                                        }}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${backendLang === 'dotnet' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'}`}
                                    >
                                        .NET C# (EF Core)
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setBackendLang('node');
                                            setCopied(false);
                                        }}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${backendLang === 'node' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'}`}
                                    >
                                        Node.js (Prisma)
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setBackendLang('php');
                                            setCopied(false);
                                        }}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${backendLang === 'php' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'}`}
                                    >
                                        PHP (Laravel)
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2 flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden min-h-[480px]">
                                    <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center shrink-0">
                                        <span className="font-mono text-xs text-slate-500 font-semibold">
                                            {backendLang === 'dotnet' ? 'SqlServerApiImporter/SyncController.cs' : backendLang === 'node' ? 'server.js & schema.prisma' : 'SyncController.php & migrations.php'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(activeCode);
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                                showMessage("Kopiert", "Backend-Code wurde in die Zwischenablage kopiert.", "success");
                                            }}
                                            className="flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                                        >
                                            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                            {copied ? 'Kopiert!' : 'Code kopieren'}
                                        </button>
                                    </div>
                                    <pre className="flex-1 p-4 font-mono text-xs overflow-auto bg-slate-950 text-emerald-400 select-text leading-relaxed">
                                        <code>{activeCode}</code>
                                    </pre>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                                        <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5 border-b pb-2 uppercase tracking-wider">
                                            <Database size={14} className="text-blue-500" /> SQL Server Tabellen-Schema (DDL)
                                        </h4>
                                        <p className="text-xs text-slate-600 mb-3">
                                            Führen Sie diese SQL-Anweisung in Ihrem SQL-Client (z.B. SSMS, DBeaver) aus, um die Struktur anzulegen:
                                        </p>
                                        <div className="relative">
                                            <pre className="bg-slate-950 text-slate-300 p-3 rounded font-mono text-[10px] overflow-auto max-h-[160px] select-text leading-normal">
                                                <code>{sqlServerMigration}</code>
                                            </pre>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(sqlServerMigration);
                                                    showMessage("Kopiert", "SQL-Migrationsskript kopiert.", "success");
                                                }}
                                                className="absolute right-2 top-2 p-1 bg-slate-800 border border-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                                title="Kopieren"
                                            >
                                                <Copy size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-lg shadow-sm p-4">
                                        <h4 className="text-xs font-bold text-indigo-900 mb-2 uppercase tracking-wider">Anleitung zur Einrichtung:</h4>
                                        <ol className="text-xs text-indigo-950 space-y-2 list-decimal list-inside leading-relaxed">
                                            <li>Kopieren Sie den DDL-Code links und erstellen Sie die Tabelle auf Ihrem SQL-Server.</li>
                                            <li>Kopieren Sie den generierten Backend-Code für Ihr Wunschframework (.NET, Node, PHP).</li>
                                            <li>Fügen Sie den Code in Ihr Backend-Projekt ein und konfigurieren Sie die SQL Server-Verbindung.</li>
                                            <li>Verwenden Sie die Route, um Daten aus der API abzuholen und direkt in Ihre produktive SQL-Server-Tabelle zu speichern!</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <TableIcon size={18} className="text-blue-600" /> Tabelle speichern
              </h3>
              <button 
                onClick={() => setShowSaveModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tabellenname</label>
                <input 
                  type="text" 
                  value={saveTableName}
                  onChange={e => setSaveTableName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="ApiData"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Primärschlüssel (PK)</label>
                <select 
                  value={primaryKeyCol || '__auto_id__'}
                  onChange={e => {
                    const val = e.target.value;
                    setPrimaryKeyCol(val === '__auto_id__' ? null : val);
                  }}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="__auto_id__">✨ Automatisch generierte ID (id)</option>
                  {getColumns().map(col => (
                    <option key={col} value={col}>Eigener PK: {col} ({schemaOverrides[col] || (Array.isArray(data[0][col]) ? 'TEXT' : inferFieldType(data[0][col]))})</option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {primaryKeyCol 
                    ? `Verwendet das vorhandene Feld "${primaryKeyCol}" als eindeutigen Primärschlüssel.`
                    : 'Erstellt automatisch eine neue fortlaufende ID-Spalte (id) am Anfang der Tabelle.'
                  }
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end gap-2 shrink-0">
              <button 
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button 
                type="button"
                onClick={() => {
                  performSave(saveTableName);
                  setShowSaveModal(false);
                }}
                disabled={!saveTableName}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Save size={14} /> Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {showBackendApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Server size={18} className="text-indigo-600" /> Backend-API registrieren
              </h3>
              <button 
                onClick={() => setShowBackendApiModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tabellen- / API-Name</label>
                <input 
                  type="text" 
                  value={backendApiName}
                  onChange={e => setBackendApiName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="KundenAPI"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-300"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Wird im Backend als Endpunkt <code>/api/backend-apis/{backendApiName || 'name'}/data</code> freigegeben.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Primärschlüssel (PK)</label>
                <select 
                  value={primaryKeyCol || '__auto_id__'}
                  onChange={e => {
                    const val = e.target.value;
                    setPrimaryKeyCol(val === '__auto_id__' ? null : val);
                  }}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="__auto_id__">✨ Automatisch generierte ID (id)</option>
                  {getColumns().map(col => (
                    <option key={col} value={col}>Eigener PK: {col} ({schemaOverrides[col] || (Array.isArray(data[0][col]) ? 'TEXT' : inferFieldType(data[0][col]))})</option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {primaryKeyCol 
                    ? `Verwendet das vorhandene Feld "${primaryKeyCol}" als eindeutigen Primärschlüssel.`
                    : 'Erstellt automatisch eine neue fortlaufende ID-Spalte (id) am Anfang der Tabelle.'
                  }
                </span>
              </div>

              {/* Options A & B Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Backend-Ausführungsmodus</label>
                <div className="grid grid-cols-1 gap-3">
                  {/* Option A */}
                  <div 
                    onClick={() => setBackendApiOption('A')}
                    className={`border rounded-lg p-3.5 cursor-pointer transition-all ${backendApiOption === 'A' ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${backendApiOption === 'A' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                          {backendApiOption === 'A' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        Option A: Echtzeit Backend-Proxy
                      </span>
                      <span className="text-[9px] bg-sky-100 text-sky-800 font-extrabold px-1.5 py-0.5 rounded uppercase">Live</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal pl-5">
                      Der Server ruft die Daten live bei jedem Client-Request von der externen API ab. Verbirgt API-Keys/Auth-Header sicher vor dem Browser des Nutzers und umgeht CORS.
                    </p>
                  </div>

                  {/* Option B */}
                  <div 
                    onClick={() => setBackendApiOption('B')}
                    className={`border rounded-lg p-3.5 cursor-pointer transition-all ${backendApiOption === 'B' ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${backendApiOption === 'B' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                          {backendApiOption === 'B' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        Option B: Server-Datenbank & Cache
                      </span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded uppercase">Fast & Offline</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal pl-5">
                      Der Server lädt die Daten einmalig herunter und speichert sie als lokale JSON-Tabelle. Erlaubt direktes Editieren/Manipulieren der Zeilen auf dem Server sowie vollen Offline-Betrieb.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sync Interval */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Automatisches Synchronisierungs-Intervall</label>
                <select 
                  value={backendRefreshInterval}
                  onChange={e => setBackendRefreshInterval(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value={0}>Nur Manuell (über Aktualisieren-Button)</option>
                  <option value={10}>Alle 10 Minuten im Hintergrund synchronisieren</option>
                  <option value={30}>Alle 30 Minuten im Hintergrund synchronisieren</option>
                  <option value={60}>Stündlich im Hintergrund synchronisieren</option>
                  <option value={1440}>Täglich im Hintergrund synchronisieren</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end gap-2 shrink-0">
              <button 
                type="button"
                onClick={() => setShowBackendApiModal(false)}
                disabled={isRegistering}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button 
                type="button"
                onClick={performBackendSave}
                disabled={isRegistering || !backendApiName}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isRegistering ? (
                  <>
                    <RefreshCw className="animate-spin text-white" size={14} /> Registriere...
                  </>
                ) : (
                  <>
                    <Save size={14} /> API im Backend speichern
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
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
