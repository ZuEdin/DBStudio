import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, FileJson, Save, Table as TableIcon, Sliders, Server, GitFork,
  Upload, Download, FileSpreadsheet, Database, FileCode, RefreshCw, 
  Trash2, Plus, Check, AlertCircle, X, ChevronRight, Edit3, ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import md5 from 'md5';

import { VirtualTable } from '../../components/VirtualTable';
import { Table, Field, ApiQueryParam, BackendConfig, Relationship } from '../../types/index';
import { fetchApiData, inferFieldType } from '../../utils/apiImportHelper';
import { ArrayExtractionModal } from './ArrayExtractionModal';
import { 
  generateSqlServerMigration, generateDotNetCode, generateNodeCode, generatePhpCode 
} from '../../utils/apiCodeGenerator';

// Subcomponents
import { ApiPresetButtons } from './api-import/ApiPresetButtons';
import { ApiParamBuilder } from './api-import/ApiParamBuilder';
import { ApiAuthSection } from './api-import/ApiAuthSection';
import { ApiSchemaMapper } from './api-import/ApiSchemaMapper';
import { ApiBackendCodeGenerator } from './api-import/ApiBackendCodeGenerator';
import { ApiSaveModal } from './api-import/ApiSaveModal';
import { ApiBackendSaveModal } from './api-import/ApiBackendSaveModal';
import { ApiConfigHeader } from './api-import/ApiConfigHeader';

// Helpers
import { exportToExcel, exportToJson, exportToPdf } from './api-import/apiExportHelper';
import { mapColumnsToFields, mapAndCleanData } from './api-import/apiDataMapper';

import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';

interface ApiImportViewProps {
  onSaveTable?: (table: Table) => void;
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
  backendConfig?: BackendConfig;
  onUpdateConfig?: (config: BackendConfig) => void;
}

export const ApiImportView: React.FC<ApiImportViewProps> = ({ 
  onSaveTable, 
  showMessage, 
  backendConfig, 
  onUpdateConfig 
}) => {
  const store = useProjectStore();
  const ui = useUIStore();

  // --- Hub Navigation & Theme ---
  const [activeHubTab, setActiveHubTab] = useState<'import' | 'export' | 'backend_sync' | 'backup'>('import');
  
  // Sub-tabs for Import Tab
  const [activeImportType, setActiveImportType] = useState<'api' | 'excel' | 'access' | 'sql_json'>('api');

  // --- Export Hub States ---
  const [selectedExportTableId, setSelectedExportTableId] = useState<string>('');
  const selectedExportTable = store.tables.find(t => t.id === selectedExportTableId);

  // --- Backend Sync States ---
  const [backendApis, setBackendApis] = useState<any[]>([]);
  const [selectedBackendApi, setSelectedBackendApi] = useState<any | null>(null);
  const [backendApiCacheData, setBackendApiCacheData] = useState<any[]>([]);
  const [isEditingCache, setIsEditingCache] = useState(false);
  const [cacheEditFields, setCacheEditFields] = useState<Field[]>([]);
  const [loadingBackendApis, setLoadingBackendApis] = useState(false);

  // Registration of local table to backend
  const [regLocalTableId, setRegLocalTableId] = useState<string>('');
  const [regApiName, setRegApiName] = useState('');
  const [registeringLocalTable, setRegisteringLocalTable] = useState(false);

  // --- Backup States ---
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const sqlFileInputRef = useRef<HTMLInputElement>(null);

  // --- API Importer Original States ---
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
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);

  // Extraction State
  const [extractColumn, setExtractColumn] = useState<string | null>(null);

  // Schema Mapping State
  const [schemaOverrides, setSchemaOverrides] = useState<Record<string, Field['type']>>({});
  const [activeViewTab, setActiveViewTab] = useState<'data' | 'schema' | 'backend_code'>('data');
  const [primaryKeyCol, setPrimaryKeyCol] = useState<string | null>(null);
  const [backendLang, setBackendLang] = useState<'dotnet' | 'node' | 'php'>('dotnet');
  const [copied, setCopied] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);

  // Backend API states (Original modal config)
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

  // --- Initial Mount ---
  useEffect(() => {
    loadBackendApis();
    if (store.tables.length > 0 && !selectedExportTableId) {
      setSelectedExportTableId(store.tables[0].id);
    }
  }, []);

  // --- Fetch backend API list ---
  const loadBackendApis = async () => {
    setLoadingBackendApis(true);
    try {
      const response = await fetch('/api/backend-apis');
      if (response.ok) {
        const list = await response.json();
        setBackendApis(list);
      }
    } catch (e) {
      console.error("Error loading backend apis:", e);
    } finally {
      setLoadingBackendApis(false);
    }
  };

  // --- Local Excel Import State ---
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelProgress, setExcelProgress] = useState('');

  // --- Access XML Import State ---
  const [accessFile, setAccessFile] = useState<File | null>(null);
  const [accessProgress, setAccessProgress] = useState('');

  // --- Manual SQL / JSON Import State ---
  const [manualSqlText, setManualSqlText] = useState('');
  const [manualJsonText, setManualJsonText] = useState('');

  // --- Escaping XML helper ---
  const escapeXml = (unsafe: string) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  // --- XML Parser helper for Access ---
  const parseAccessXmlText = (text: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("Ungültiges XML-Format.");
    }

    const root = xmlDoc.documentElement;
    const tablesMap = new Map<string, any[]>();

    for (let i = 0; i < root.children.length; i++) {
      const node = root.children[i];
      if (node.nodeType !== 1) continue;
      
      const tableName = node.tagName;
      if (!tablesMap.has(tableName)) {
        tablesMap.set(tableName, []);
      }
      
      const rowData: any = {};
      for (let j = 0; j < node.children.length; j++) {
        const fieldNode = node.children[j];
        const fieldName = fieldNode.tagName;
        const val = fieldNode.textContent;
        rowData[fieldName] = val;
      }
      tablesMap.get(tableName)?.push(rowData);
    }

    const parsedTables: Table[] = [];
    tablesMap.forEach((rows, tableName) => {
      if (rows.length === 0) return;

      const sampleRow = rows[0];
      const fields: Field[] = Object.keys(sampleRow).map(key => ({
        id: crypto.randomUUID(),
        name: key,
        type: inferFieldType(sampleRow[key]),
        isPrimaryKey: key.toLowerCase() === 'id' || key.toLowerCase().endsWith('id'),
        allowNull: true
      }));

      if (!fields.some(f => f.name.toLowerCase() === 'id')) {
        fields.unshift({ 
          id: crypto.randomUUID(), 
          name: 'ID', 
          type: 'INTEGER', 
          isPrimaryKey: true, 
          isAutoIncrement: true 
        });
        rows.forEach((r, idx) => r['ID'] = idx + 1);
      }

      parsedTables.push({
        id: crypto.randomUUID(),
        name: tableName,
        fields: fields,
        data: rows
      });
    });

    return parsedTables;
  };

  // --- Handle Local Excel Parsing ---
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);
    setExcelProgress('Datei wird geladen...');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        
        let importedCount = 0;
        wb.SheetNames.forEach((sheetName) => {
          const ws = wb.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          
          if (rawData.length > 0) {
            const headers = rawData[0] || [];
            const rows = rawData.slice(1);
            
            const fields: Field[] = headers.map((h, idx) => {
              const colName = String(h || `spalte${idx + 1}`).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
              return {
                id: crypto.randomUUID(),
                name: colName,
                type: 'VARCHAR',
                isPrimaryKey: colName === 'id',
                allowNull: true
              };
            });

            if (!fields.some(f => f.isPrimaryKey)) {
              fields.unshift({
                id: crypto.randomUUID(),
                name: 'id',
                type: 'INTEGER',
                isPrimaryKey: true,
                isAutoIncrement: true
              });
            }

            const cleanData = rows.map((row, rIdx) => {
              const rowObj: any = {};
              if (!headers.some(h => String(h).toLowerCase() === 'id')) {
                rowObj['id'] = rIdx + 1;
              }
              headers.forEach((h, cIdx) => {
                const colName = String(h).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                rowObj[colName] = row[cIdx] ?? '';
              });
              return rowObj;
            });

            const newTable: Table = {
              id: crypto.randomUUID(),
              name: sheetName.replace(/[^a-zA-Z0-9]/g, '') || `Excel_${Date.now()}`,
              fields: fields,
              data: cleanData
            };

            store.addTable(newTable);
            importedCount++;
          }
        });

        ui.addToast(`${importedCount} Excel-Tabelle(n) geladen!`, 'success');
        setExcelProgress('Erfolgreich importiert.');
      } catch (err: any) {
        ui.addToast(`Fehler: ${err.message}`, 'error');
        setExcelProgress('Import fehlgeschlagen.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- Handle Local Access XML parsing ---
  const handleAccessImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAccessFile(file);
    setAccessProgress('XML-Datei wird analysiert...');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = parseAccessXmlText(text);
        parsed.forEach(t => store.addTable(t));
        ui.addToast(`${parsed.length} Access-Tabelle(n) importiert!`, 'success');
        setAccessProgress('Import erfolgreich abgeschlossen.');
      } catch (err: any) {
        ui.addToast(`Fehler: ${err.message}`, 'error');
        setAccessProgress('Fehler beim Import.');
      }
    };
    reader.readAsText(file);
  };

  // --- Handle SQL script import parsing ---
  const handleSqlImport = () => {
    if (!manualSqlText.trim()) return showMessage("Fehler", "Bitte geben Sie SQL-Text ein.", "warning");
    
    try {
      const createRegex = /CREATE\s+TABLE\s+([a-zA-Z0-9_`"]+)\s*\(([\s\S]*?)\);/gi;
      let match;
      let count = 0;

      while ((match = createRegex.exec(manualSqlText)) !== null) {
        const tableName = match[1].replace(/[`"]/g, '').trim();
        const body = match[2];
        
        const lines = body.split(',').map(l => l.trim()).filter(Boolean);
        const fields: Field[] = [];

        lines.forEach(line => {
          const parts = line.split(/\s+/).map(p => p.replace(/[`"]/g, ''));
          if (parts.length >= 2) {
            const colName = parts[0];
            const typeStr = parts[1].toUpperCase();
            
            let type: Field['type'] = 'VARCHAR';
            if (typeStr.includes('INT')) type = 'INTEGER';
            else if (typeStr.includes('DECIMAL') || typeStr.includes('DOUBLE') || typeStr.includes('FLOAT')) type = 'DOUBLE';
            else if (typeStr.includes('BOOL')) type = 'BOOLEAN';
            else if (typeStr.includes('DATE')) type = 'DATE';
            else if (typeStr.includes('TEXT')) type = 'TEXT';

            fields.push({
              id: crypto.randomUUID(),
              name: colName,
              type: type,
              isPrimaryKey: line.toUpperCase().includes('PRIMARY KEY'),
              allowNull: !line.toUpperCase().includes('NOT NULL')
            });
          }
        });

        if (fields.length > 0) {
          if (!fields.some(f => f.isPrimaryKey)) {
            fields.unshift({ id: crypto.randomUUID(), name: 'id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true });
          }

          const newTable: Table = {
            id: crypto.randomUUID(),
            name: tableName,
            fields: fields,
            data: []
          };
          store.addTable(newTable);
          count++;
        }
      }

      if (count > 0) {
        ui.addToast(`${count} Tabelle(n) aus SQL-Schema erstellt!`, 'success');
        setManualSqlText('');
      } else {
        showMessage("SQL Import", "Keine gültigen 'CREATE TABLE' Anweisungen gefunden.", "info");
      }
    } catch (err: any) {
      showMessage("SQL Parser-Fehler", err.message, "error");
    }
  };

  // --- Handle JSON schema/data import parsing ---
  const handleJsonImport = () => {
    if (!manualJsonText.trim()) return showMessage("Fehler", "Bitte geben Sie JSON-Text ein.", "warning");
    try {
      const parsed = JSON.parse(manualJsonText);
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      if (rows.length === 0) throw new Error("Das JSON-Array ist leer.");

      const sample = rows[0];
      const fields: Field[] = Object.keys(sample).map(key => ({
        id: crypto.randomUUID(),
        name: key,
        type: inferFieldType(sample[key]),
        isPrimaryKey: key.toLowerCase() === 'id',
        allowNull: true
      }));

      if (!fields.some(f => f.isPrimaryKey)) {
        fields.unshift({ id: crypto.randomUUID(), name: 'id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true });
        rows.forEach((r, i) => r['id'] = i + 1);
      }

      const newTable: Table = {
        id: crypto.randomUUID(),
        name: `JSON_Import_${Date.now() % 10000}`,
        fields: fields,
        data: rows
      };

      store.addTable(newTable);
      ui.addToast("JSON-Tabelle erfolgreich importiert!", "success");
      setManualJsonText('');
    } catch (err: any) {
      showMessage("JSON Parser-Fehler", err.message, "error");
    }
  };

  // --- Export Actions ---
  const triggerExcelExport = () => {
    if (!selectedExportTable) return;
    const ws = XLSX.utils.json_to_sheet(selectedExportTable.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedExportTable.name);
    XLSX.writeFile(wb, `${selectedExportTable.name}_export.xlsx`);
    ui.addToast(`Excel-Export für "${selectedExportTable.name}" heruntergeladen.`, 'success');
  };

  const triggerAccessXmlExport = () => {
    if (!selectedExportTable) return;
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<dataroot xmlns:od="urn:schemas-microsoft-com:officedata" generated="${new Date().toISOString()}">\n`;
    selectedExportTable.data.forEach((row) => {
      xml += `  <${selectedExportTable.name}>\n`;
      selectedExportTable.fields.forEach(f => {
        const val = row[f.name];
        if (val !== undefined && val !== null) {
          xml += `    <${f.name}>${escapeXml(String(val))}</${f.name}>\n`;
        }
      });
      xml += `  </${selectedExportTable.name}>\n`;
    });
    xml += `</dataroot>\n`;
    
    const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedExportTable.name}_access.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ui.addToast(`Access XML für "${selectedExportTable.name}" heruntergeladen.`, 'success');
  };

  const triggerSqlDumpExport = () => {
    if (!selectedExportTable) return;
    let sql = `-- DB Studio Pro SQL Dump\n`;
    sql += `-- Erstellt am: ${new Date().toLocaleString()}\n`;
    sql += `-- Tabelle: ${selectedExportTable.name}\n\n`;
    
    sql += `CREATE TABLE \`${selectedExportTable.name}\` (\n`;
    const colDefs = selectedExportTable.fields.map(f => {
      let sqlType = 'VARCHAR(255)';
      if (f.type === 'INTEGER') sqlType = 'INT';
      else if (f.type === 'DECIMAL' || f.type === 'DOUBLE') sqlType = 'DECIMAL(10, 2)';
      else if (f.type === 'BOOLEAN') sqlType = 'TINYINT(1)';
      else if (f.type === 'DATE') sqlType = 'DATE';
      else if (f.type === 'DATETIME' || f.type === 'TIMESTAMP') sqlType = 'DATETIME';
      else if (f.type === 'TEXT') sqlType = 'TEXT';
      
      let def = `  \`${f.name}\` ${sqlType}`;
      if (f.isPrimaryKey) def += ' PRIMARY KEY';
      if (f.isAutoIncrement) def += ' AUTO_INCREMENT';
      if (!f.allowNull) def += ' NOT NULL';
      return def;
    });
    sql += colDefs.join(',\n');
    sql += `\n);\n\n`;
    
    if (selectedExportTable.data.length > 0) {
      sql += `-- Einfügen von Daten für ${selectedExportTable.name}\n`;
      selectedExportTable.data.forEach(row => {
        const columns: string[] = [];
        const values: string[] = [];
        selectedExportTable.fields.forEach(f => {
          const val = row[f.name];
          if (val !== undefined && val !== null) {
            columns.push(`\`${f.name}\``);
            if (typeof val === 'number') {
              values.push(String(val));
            } else if (typeof val === 'boolean') {
              values.push(val ? '1' : '0');
            } else {
              const escaped = String(val).replace(/'/g, "''");
              values.push(`'${escaped}'`);
            }
          }
        });
        if (columns.length > 0) {
          sql += `INSERT INTO \`${selectedExportTable.name}\` (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
      });
    }
    
    const blob = new Blob([sql], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedExportTable.name}_dump.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ui.addToast(`SQL Dump für "${selectedExportTable.name}" heruntergeladen.`, 'success');
  };

  const triggerJsonExport = () => {
    if (!selectedExportTable) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(selectedExportTable.data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `${selectedExportTable.name}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    ui.addToast(`JSON-Export für "${selectedExportTable.name}" heruntergeladen.`, 'success');
  };

  // --- Backend Multi-Source Operations ---
  const handleSelectBackendApi = async (api: any) => {
    setSelectedBackendApi(api);
    setIsEditingCache(false);
    try {
      const response = await fetch(`/api/backend-apis/${encodeURIComponent(api.name)}/data`);
      if (response.ok) {
        const rows = await response.json();
        setBackendApiCacheData(rows);
        setCacheEditFields(api.fields || []);
      }
    } catch (e) {
      console.error(e);
      ui.addToast("Fehler beim Laden der Backend-Daten.", 'error');
    }
  };

  const handleRefreshBackendApi = async (apiName: string) => {
    ui.addToast("Server-Synchronisierung läuft...", 'info');
    try {
      const response = await fetch(`/api/backend-apis/${encodeURIComponent(apiName)}/refresh`, {
        method: 'POST'
      });
      if (response.ok) {
        const res = await response.json();
        ui.addToast(`Erfolgreich synchronisiert! ${res.count} Zeilen vom Server geladen.`, 'success');
        loadBackendApis();
        if (selectedBackendApi?.name === apiName) {
          handleSelectBackendApi(selectedBackendApi);
        }
      } else {
        throw new Error("Fehler beim API Sync");
      }
    } catch (e: any) {
      ui.addToast(`Sync-Fehler: ${e.message}`, 'error');
    }
  };

  const handleImportToLocalTable = (api: any) => {
    const fields: Field[] = api.fields || [];
    const newTable: Table = {
      id: crypto.randomUUID(),
      name: api.name,
      fields: fields,
      data: backendApiCacheData,
      isApiImport: true,
      apiConfig: {
        url: `/api/backend-apis/${api.name}/data`,
        method: 'GET',
        headers: '{}',
        queryParams: [],
        refreshOnLoad: true
      }
    };
    store.addTable(newTable);
    ui.addToast(`Schnittstelle "${api.name}" erfolgreich als lokale Tabelle kopiert!`, 'success');
  };

  const handleDeleteBackendApiConfig = async (apiName: string) => {
    if (!confirm(`Möchten Sie die Backend-Schnittstelle "${apiName}" wirklich löschen?`)) return;
    try {
      const response = await fetch(`/api/backend-apis/${encodeURIComponent(apiName)}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        ui.addToast(`Schnittstelle "${apiName}" erfolgreich gelöscht.`, 'success');
        setSelectedBackendApi(null);
        loadBackendApis();
      }
    } catch (e) {
      ui.addToast("Löschen fehlgeschlagen.", 'error');
    }
  };

  const handleUpdateServerCache = async () => {
    if (!selectedBackendApi) return;
    try {
      const response = await fetch(`/api/backend-apis/${encodeURIComponent(selectedBackendApi.name)}/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendApiCacheData)
      });
      if (response.ok) {
        ui.addToast("Serverseitiger Daten-Cache erfolgreich aktualisiert!", 'success');
        setIsEditingCache(false);
      } else {
        throw new Error();
      }
    } catch (e) {
      ui.addToast("Aktualisierung des Server-Caches fehlgeschlagen.", 'error');
    }
  };

  const handleRegisterLocalTableToBackend = async () => {
    const tableToReg = store.tables.find(t => t.id === regLocalTableId);
    if (!tableToReg || !regApiName.trim()) {
      return showMessage("Fehler", "Bitte wählen Sie eine Tabelle und geben Sie einen Schnittstellennamen ein.", "warning");
    }
    setRegisteringLocalTable(true);
    try {
      const response = await fetch('/api/backend-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regApiName.trim(),
          url: `http://localhost:3000/api/mock-source/${regApiName}`,
          method: 'GET',
          headers: '{}',
          queryParams: [],
          option: 'B',
          refreshInterval: 0,
          fields: tableToReg.fields,
          data: tableToReg.data
        })
      });

      if (response.ok) {
        ui.addToast(`Lokale Tabelle "${tableToReg.name}" wurde erfolgreich als serverseitige API "${regApiName}" registriert!`, 'success');
        setRegApiName('');
        loadBackendApis();
      } else {
        throw new Error();
      }
    } catch (e) {
      ui.addToast("Registrierung fehlgeschlagen.", 'error');
    } finally {
      setRegisteringLocalTable(false);
    }
  };

  // --- Full Backup & Restore ---
  const handleDownloadFullBackup = () => {
    const payload = {
      version: 3,
      id: store.projectId || crypto.randomUUID(),
      name: store.projectName || "Unbenanntes Projekt",
      lastModified: Date.now(),
      data: {
        tables: store.tables,
        queries: store.queries,
        reports: store.reports,
        forms: store.forms,
        charts: store.charts || [],
        pages: store.pages || [],
        customComponents: store.customComponents || [],
        workflows: store.workflows || [],
        relationships: store.relationships,
        layout: store.layout,
        tableGroups: store.tableGroups || [],
        backendConfig: store.backendConfig,
        tickets: store.tickets || [],
        chats: store.chats || []
      }
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `${store.projectName.replace(/\s+/g, '_')}_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    ui.addToast("Vollständiges Schema- & Datenbackup heruntergeladen!", 'success');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (!parsed.data || !parsed.data.tables) {
          throw new Error("Ungültiges DB Studio Backup-Format.");
        }
        store.loadProject(parsed);
        ui.addToast("Projekt-Backup erfolgreich wiederhergestellt!", 'success');
      } catch (err: any) {
        showMessage("Restore-Fehler", `Wiederherstellung fehlgeschlagen: ${err.message}`, "error");
      }
    };
    reader.readAsText(file);
  };

  // --- API Importer Original Handlers ---
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
    setPrimaryKeyCol(null);

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
        let detectedPk = cols.find(c => c.toLowerCase() === 'id');
        if (!detectedPk) {
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
    if (onSaveTable) {
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
      const { fields, needsAutoId } = mapColumnsToFields(columns, sampleRow, primaryKeyCol, schemaOverrides, data);
      const cleanData = mapAndCleanData(data, needsAutoId, schemaOverrides);
      const savedUrl = getEffectiveUrl();

      const response = await fetch('/api/backend-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        const resText = await response.text();
        let errMsg = 'Fehler beim Registrieren im Backend.';
        try {
          const errData = JSON.parse(resText);
          errMsg = errData.error || errMsg;
        } catch (e) {
          errMsg = `Server-Fehler (${response.status}): ${resText.slice(0, 100)}`;
        }
        throw new Error(errMsg);
      }

      if (backendApiOption === 'B') {
        const refreshResponse = await fetch(`/api/backend-apis/${encodeURIComponent(backendApiName)}/refresh`, {
          method: 'POST'
        });
        if (!refreshResponse.ok) {
          console.warn("Backend Cache initial sync warning");
        }
      }

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
      loadBackendApis();
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
    const { fields, needsAutoId } = mapColumnsToFields(columns, sampleRow, primaryKeyCol, schemaOverrides, data);
    const cleanData = mapAndCleanData(data, needsAutoId, schemaOverrides);
    const savedUrl = getEffectiveUrl();

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

  const getDynamicFields = (): Field[] => {
    const columns = getColumns();
    if (columns.length === 0) return [];
    const sampleRow = data[0];
    const { fields } = mapColumnsToFields(columns, sampleRow, primaryKeyCol, schemaOverrides, data);
    return fields;
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
                  type="button"
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
    } catch { 
      return getEffectiveUrl(); 
    }
  };

  const updateBaseUrl = (newUrl: string) => {
    if (backendConfig && onUpdateConfig) {
      onUpdateConfig({ ...backendConfig, apiBaseUrl: newUrl });
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 select-none font-sans overflow-hidden">
      
      {/* HUB HEADER TABS */}
      <div className="flex justify-between items-center bg-white border-b border-slate-200 px-6 shrink-0 h-14 shadow-sm z-10">
        <div className="flex gap-1 h-full">
          <button 
            onClick={() => setActiveHubTab('import')}
            className={`px-4 h-full text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeHubTab === 'import' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload size={16}/> Import-Zentrum
          </button>
          
          <button 
            onClick={() => setActiveHubTab('export')}
            className={`px-4 h-full text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeHubTab === 'export' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download size={16}/> Tabellen-Exporteur
          </button>

          <button 
            onClick={() => { setActiveHubTab('backend_sync'); loadBackendApis(); }}
            className={`px-4 h-full text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeHubTab === 'backend_sync' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server size={16}/> Datenquellen & Backend-Sync
          </button>

          <button 
            onClick={() => setActiveHubTab('backup')}
            className={`px-4 h-full text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeHubTab === 'backup' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Save size={16}/> Speichern & Sichern
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
            {store.tables.length} Tabellen in IndexedDB
          </span>
        </div>
      </div>

      {/* HUB MAIN CONTENT PANELS */}
      <div className="flex-1 overflow-hidden flex flex-col">
        
        {/* TAB 1: IMPORT CENTER */}
        {activeHubTab === 'import' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Import Inner Sidebar */}
            <div className="w-56 bg-white border-r border-slate-200 p-3 flex flex-col gap-1 shrink-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Importquellen</div>
              
              <button 
                onClick={() => setActiveImportType('api')}
                className={`w-full px-3 py-2 text-left text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${
                  activeImportType === 'api' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Globe size={16} className="text-blue-500" /> API / REST Schnittstelle
              </button>

              <button 
                onClick={() => setActiveImportType('excel')}
                className={`w-full px-3 py-2 text-left text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${
                  activeImportType === 'excel' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet size={16} className="text-emerald-600" /> Excel-Import (.xlsx)
              </button>

              <button 
                onClick={() => setActiveImportType('access')}
                className={`w-full px-3 py-2 text-left text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${
                  activeImportType === 'access' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Database size={16} className="text-orange-600" /> Access XML Import
              </button>

              <button 
                onClick={() => setActiveImportType('sql_json')}
                className={`w-full px-3 py-2 text-left text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${
                  activeImportType === 'sql_json' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileCode size={16} className="text-purple-600" /> Schema / SQL & JSON
              </button>
            </div>

            {/* Import Inner Workspace */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-6 flex flex-col gap-6">
              
              {/* INNER TYPE: API CLIENT IMPORT */}
              {activeImportType === 'api' && (
                <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <ApiConfigHeader
                    backendConfig={backendConfig}
                    showBaseUrlSettings={showBaseUrlSettings}
                    setShowBaseUrlSettings={setShowBaseUrlSettings}
                    updateBaseUrl={updateBaseUrl}
                    isConfigCollapsed={isConfigCollapsed}
                    setIsConfigCollapsed={setIsConfigCollapsed}
                    data={data}
                    refreshOnLoad={refreshOnLoad}
                    setRefreshOnLoad={setRefreshOnLoad}
                    showSaveDropdown={showSaveDropdown}
                    setShowSaveDropdown={setShowSaveDropdown}
                    handleSaveClick={handleSaveClick}
                    setShowBackendApiModal={setShowBackendApiModal}
                    exportToExcel={() => exportToExcel(data, showMessage)}
                    exportToJson={() => exportToJson(data, showMessage)}
                    exportToPdf={() => exportToPdf(data, getColumns(), showMessage)}
                    url={url}
                    setUrl={setUrl}
                    method={method}
                    setMethod={setMethod}
                    handleFetch={handleFetch}
                    isLoading={isLoading}
                    onSaveTable={onSaveTable}
                    constructPreviewUrl={constructPreviewUrl}
                  />

                  {!isConfigCollapsed && (
                    <div className="bg-white px-4 pb-4 border-b border-slate-200">
                      <ApiPresetButtons setUrl={setUrl} setMethod={setMethod} setQueryParams={setQueryParams} />
                      <ApiParamBuilder queryParams={queryParams} setQueryParams={setQueryParams} showParamBuilder={showParamBuilder} setShowParamBuilder={setShowParamBuilder} constructPreviewUrl={constructPreviewUrl} />
                      <ApiAuthSection authType={authType} setAuthType={setAuthType} authBearerToken={authBearerToken} setAuthBearerToken={setAuthBearerToken} authApiKeyName={authApiKeyName} setAuthApiKeyName={setAuthApiKeyName} authApiKeyLocation={authApiKeyLocation} setAuthApiKeyLocation={setAuthApiKeyLocation} authApiKeyValue={authApiKeyValue} setAuthApiKeyValue={setAuthApiKeyValue} authApiKeyPrefix={authApiKeyPrefix} setAuthApiKeyPrefix={setAuthApiKeyPrefix} authUsername={authUsername} setAuthUsername={setAuthUsername} authPassword={authPassword} setAuthPassword={setAuthPassword} headers={headers} setHeaders={setHeaders} />
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 text-red-600 p-4 border-b border-red-100 text-sm">
                      <strong>Letzter Fehler:</strong> {error}
                    </div>
                  )}

                  {data.length > 0 && (
                    <div className="flex border-b border-slate-200 px-4 bg-white shrink-0">
                      <button type="button" onClick={() => setActiveViewTab('data')} className={`px-4 py-2 text-sm font-bold border-b-2 flex items-center gap-2 ${activeViewTab === 'data' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                        <TableIcon size={16} /> Daten-Vorschau
                      </button>
                      <button type="button" onClick={() => setActiveViewTab('schema')} className={`px-4 py-2 text-sm font-bold border-b-2 flex items-center gap-2 ${activeViewTab === 'schema' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                        <Sliders size={16} /> Datentyp-Mapper / Schema
                      </button>
                      <button type="button" onClick={() => setActiveViewTab('backend_code')} className={`px-4 py-2 text-sm font-bold border-b-2 flex items-center gap-2 ${activeViewTab === 'backend_code' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                        <Server size={16} className="text-emerald-500" /> ⚡ SQL Server Backend-Code
                      </button>
                    </div>
                  )}

                  <div className="flex-1 overflow-hidden relative bg-slate-50">
                    {data.length > 0 ? (
                      activeViewTab === 'data' ? (
                        <VirtualTable data={data} headers={getColumns()} renderRow={renderRow} rowHeight={35} />
                      ) : activeViewTab === 'schema' ? (
                        <ApiSchemaMapper columns={getColumns()} primaryKeyCol={primaryKeyCol} setPrimaryKeyCol={setPrimaryKeyCol} schemaOverrides={schemaOverrides} setSchemaOverrides={setSchemaOverrides} data={data} />
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
                            <ApiBackendCodeGenerator backendLang={backendLang} setBackendLang={setBackendLang} copied={copied} setCopied={setCopied} activeCode={activeCode} sqlServerMigration={sqlServerMigration} showMessage={showMessage} />
                          );
                        })()
                      )
                    ) : (
                      !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                          <Globe size={64} className="opacity-20 text-indigo-500" />
                          <div className="text-center">
                            <p className="font-semibold text-slate-600">API-Schnittstelle konfigurieren & abrufen</p>
                            <p className="text-xs text-slate-400 mt-1">Tragen Sie oben die Endpoint URL ein, um JSON/XML Daten direkt zu analysieren und zu speichern.</p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* INNER TYPE: LOCAL EXCEL FILE */}
              {activeImportType === 'excel' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col gap-6 max-w-3xl mx-auto w-full mt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700">
                      <FileSpreadsheet size={28}/>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Excel Arbeitsblätter importieren</h3>
                      <p className="text-slate-500 text-xs mt-1">Laden Sie eine lokale Excel-Tabelle hoch, um Arbeitsblätter automatisch als eigenständige IndexedDB-Tabellen anzulegen.</p>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50 flex flex-col items-center justify-center gap-4 hover:border-emerald-500 transition-colors cursor-pointer group">
                    <input 
                      type="file" 
                      accept=".xlsx, .xls" 
                      onChange={handleExcelImport}
                      className="hidden" 
                      id="excel-file-upload"
                    />
                    <label htmlFor="excel-file-upload" className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                      <Upload size={40} className="text-slate-400 group-hover:text-emerald-600 transition-colors mb-2" />
                      <span className="text-sm font-bold text-slate-700">Excel-Datei auswählen</span>
                      <span className="text-xs text-slate-400 mt-1">Zulässig: .xlsx, .xls (SheetJS Parser)</span>
                    </label>
                  </div>

                  {excelProgress && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center gap-2 text-sm text-slate-600">
                      <RefreshCw size={16} className="animate-spin text-emerald-600"/>
                      <span>Status: {excelProgress}</span>
                    </div>
                  )}
                </div>
              )}

              {/* INNER TYPE: MS ACCESS XML */}
              {activeImportType === 'access' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col gap-6 max-w-3xl mx-auto w-full mt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-orange-100 text-orange-700">
                      <Database size={28}/>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Microsoft Access XML Import</h3>
                      <p className="text-slate-500 text-xs mt-1">Importiert Access-Strukturen und Tabelleninhalte über exportierte XML-Dateien.</p>
                    </div>
                  </div>

                  <div className="bg-orange-50/40 p-4 rounded-lg border border-orange-100 text-xs text-orange-800 flex gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <div>
                      <p className="font-semibold">Wie exportiere ich aus MS Access?</p>
                      <p className="mt-1">Klicken Sie in Access auf die gewünschte Tabelle, wählen Sie im Menüband "Externe Daten" &rarr; "XML-Datei". Speichern Sie die Datei mit gesetztem Haken bei "Daten" und "Schema (XSD)". Laden Sie die erzeugte XML-Datei hier hoch.</p>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50 flex flex-col items-center justify-center gap-4 hover:border-orange-500 transition-colors cursor-pointer group">
                    <input 
                      type="file" 
                      accept=".xml" 
                      onChange={handleAccessImport}
                      className="hidden" 
                      id="access-xml-upload"
                    />
                    <label htmlFor="access-xml-upload" className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                      <Upload size={40} className="text-slate-400 group-hover:text-orange-600 transition-colors mb-2" />
                      <span className="text-sm font-bold text-slate-700">Access XML-Datei wählen</span>
                      <span className="text-xs text-slate-400 mt-1">Zulässig: .xml (Microsoft Access dataroot)</span>
                    </label>
                  </div>

                  {accessProgress && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center gap-2 text-sm text-slate-600">
                      <RefreshCw size={16} className="animate-spin text-orange-600"/>
                      <span>Status: {accessProgress}</span>
                    </div>
                  )}
                </div>
              )}

              {/* INNER TYPE: SQL & JSON PASTE */}
              {activeImportType === 'sql_json' && (
                <div className="grid grid-cols-2 gap-6 mt-4">
                  
                  {/* SQL Schema Parser */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <FileCode className="text-purple-600" size={22}/>
                      <h3 className="font-bold text-slate-800 text-sm">SQL-Schema (CREATE TABLE) analysieren</h3>
                    </div>
                    <p className="text-xs text-slate-400">Fügen Sie DDL-Skripte ein, um relationale Tabellenstrukturen automatisch im Workspace anzulegen.</p>
                    
                    <textarea 
                      className="flex-1 min-h-[160px] font-mono text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
                      placeholder="CREATE TABLE kunden (&#10;  id INTEGER PRIMARY KEY,&#10;  name VARCHAR(255),&#10;  ort VARCHAR(100)&#10;);"
                      value={manualSqlText}
                      onChange={(e) => setManualSqlText(e.target.value)}
                    />

                    <button 
                      onClick={handleSqlImport}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                      <Plus size={14}/> Schema generieren
                    </button>
                  </div>

                  {/* JSON array parser */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <FileJson className="text-indigo-600" size={22}/>
                      <h3 className="font-bold text-slate-800 text-sm">JSON-Daten importieren (Auto-Schema)</h3>
                    </div>
                    <p className="text-xs text-slate-400">Fügen Sie ein JSON-Array mit Datensätzen ein. Das System erzeugt Schema, Typen und Datensätze.</p>

                    <textarea 
                      className="flex-1 min-h-[160px] font-mono text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
                      placeholder="[&#10;  { &quot;name&quot;: &quot;Muster GmbH&quot;, &quot;plz&quot;: 10115, &quot;aktiv&quot;: true }&#10;]"
                      value={manualJsonText}
                      onChange={(e) => setManualJsonText(e.target.value)}
                    />

                    <button 
                      onClick={handleJsonImport}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                      <Upload size={14}/> JSON importieren
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 2: EXPORT CENTER */}
        {activeHubTab === 'export' && (
          <div className="flex-1 bg-slate-50 p-6 overflow-y-auto flex flex-col gap-6">
            
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 mt-4">
              
              {/* Select table to export */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-slate-800">Zu exportierende Tabelle wählen:</span>
                  <span className="text-xs text-slate-400">In IndexedDB gespeicherte relationale Schema & Datenbestände exportieren.</span>
                </div>
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-[220px]"
                  value={selectedExportTableId}
                  onChange={(e) => setSelectedExportTableId(e.target.value)}
                >
                  {store.tables.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.data.length} Zeilen)</option>
                  ))}
                </select>
              </div>

              {selectedExportTable ? (
                <>
                  {/* Bento Grid with Export choices */}
                  <div className="grid grid-cols-4 gap-4">
                    
                    {/* Excel Export Card */}
                    <button 
                      onClick={triggerExcelExport}
                      className="bg-white hover:bg-emerald-50/30 p-6 rounded-xl shadow-sm border border-slate-200 hover:border-emerald-400 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer text-center"
                    >
                      <div className="p-4 rounded-full bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform">
                        <FileSpreadsheet size={24}/>
                      </div>
                      <span className="text-xs font-bold text-slate-700">Excel-Export</span>
                      <span className="text-[10px] text-slate-400">Erzeugt .xlsx Datei</span>
                    </button>

                    {/* Access XML Export Card */}
                    <button 
                      onClick={triggerAccessXmlExport}
                      className="bg-white hover:bg-orange-50/30 p-6 rounded-xl shadow-sm border border-slate-200 hover:border-orange-400 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer text-center"
                    >
                      <div className="p-4 rounded-full bg-orange-100 text-orange-700 group-hover:scale-110 transition-transform">
                        <Database size={24}/>
                      </div>
                      <span className="text-xs font-bold text-slate-700">Access (XML) Export</span>
                      <span className="text-[10px] text-slate-400">MS Access dataroot XML</span>
                    </button>

                    {/* SQL Script Export Card */}
                    <button 
                      onClick={triggerSqlDumpExport}
                      className="bg-white hover:bg-indigo-50/30 p-6 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-400 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer text-center"
                    >
                      <div className="p-4 rounded-full bg-indigo-100 text-indigo-700 group-hover:scale-110 transition-transform">
                        <FileCode size={24}/>
                      </div>
                      <span className="text-xs font-bold text-slate-700">SQL Dump / Schema</span>
                      <span className="text-[10px] text-slate-400">Generiert DDL & INSERTs</span>
                    </button>

                    {/* JSON Export Card */}
                    <button 
                      onClick={triggerJsonExport}
                      className="bg-white hover:bg-slate-100 p-6 rounded-xl shadow-sm border border-slate-200 hover:border-slate-400 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer text-center"
                    >
                      <div className="p-4 rounded-full bg-slate-100 text-slate-700 group-hover:scale-110 transition-transform">
                        <FileJson size={24}/>
                      </div>
                      <span className="text-xs font-bold text-slate-700">JSON Export</span>
                      <span className="text-[10px] text-slate-400">Flaches JSON-Array</span>
                    </button>

                  </div>

                  {/* Schema Preview */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
                    <h3 className="font-bold text-sm text-slate-800">Export-Struktur: {selectedExportTable.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedExportTable.fields.map(f => (
                        <span key={f.id} className="text-xs bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 flex items-center gap-1.5 font-medium">
                          {f.isPrimaryKey && <span className="w-2 h-2 rounded-full bg-indigo-600" title="Primärschlüssel"/>}
                          {f.name} <span className="text-[10px] text-slate-400 uppercase font-mono">{f.type}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-12 text-slate-400">
                  <AlertCircle size={48} className="mx-auto text-slate-300 mb-2"/>
                  Keine Tabellen zum Exportieren vorhanden.
                </div>
              )}

            </div>

          </div>
        )}

        {/* TAB 3: BACKEND SYNCHRONIZATION (MULTI SOURCE) */}
        {activeHubTab === 'backend_sync' && (
          <div className="flex-1 flex overflow-hidden">
            
            {/* List of Registered Backend APIs on Left */}
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Registrierte Backend-APIs</span>
                <button 
                  onClick={loadBackendApis}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                  title="Schnittstellenliste neu laden"
                >
                  <RefreshCw size={14} className={loadingBackendApis ? "animate-spin" : ""}/>
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                {backendApis.length > 0 ? (
                  backendApis.map((api) => (
                    <button
                      key={api.id || api.name}
                      onClick={() => handleSelectBackendApi(api)}
                      className={`w-full text-left p-3 rounded-lg flex flex-col gap-1.5 transition-all border ${
                        selectedBackendApi?.name === api.name 
                          ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900 font-semibold shadow-sm' 
                          : 'border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm truncate w-40">{api.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          api.option === 'B' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {api.option === 'B' ? 'CACHE' : 'PROXY'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-full font-mono">{api.url}</div>
                    </button>
                  ))
                ) : (
                  <div className="text-center p-6 text-slate-400 text-xs">Keine registrierten Backend-Schnittstellen.</div>
                )}
              </div>

              {/* Register Local Table Form */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-3 shrink-0">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tabelle ins Backend pushen</div>
                <select 
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={regLocalTableId}
                  onChange={(e) => setRegLocalTableId(e.target.value)}
                >
                  <option value="">-- Tabelle wählen --</option>
                  {store.tables.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                <input 
                  type="text"
                  placeholder="Backend API-Name"
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  value={regApiName}
                  onChange={(e) => setRegApiName(e.target.value)}
                />

                <button
                  onClick={handleRegisterLocalTableToBackend}
                  disabled={registeringLocalTable}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  {registeringLocalTable ? 'Registrierung...' : <><Plus size={14}/> Im Backend registrieren</>}
                </button>
              </div>

            </div>

            {/* Display / Edit Backend cache on Right */}
            <div className="flex-1 bg-slate-50 p-6 overflow-y-auto flex flex-col gap-6">
              {selectedBackendApi ? (
                <div className="flex flex-col gap-6 max-w-5xl w-full mx-auto">
                  
                  {/* API Header Info */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex justify-between items-start">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-800">{selectedBackendApi.name}</span>
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                          selectedBackendApi.option === 'B' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          Option {selectedBackendApi.option === 'A' ? 'A (Live-Proxy)' : 'B (Serverseitiger Cache)'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{selectedBackendApi.url}</div>
                      {selectedBackendApi.lastSync && (
                        <div className="text-[10px] text-slate-400 mt-1">Letzter Sync: {new Date(selectedBackendApi.lastSync).toLocaleString()}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      
                      {selectedBackendApi.option === 'B' && (
                        <button
                          onClick={() => handleRefreshBackendApi(selectedBackendApi.name)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                          title="Führt serverseitigen Fetch aus der Originalquelle aus und aktualisiert den JSON-Cache"
                        >
                          <RefreshCw size={14}/> Server-Sync triggern
                        </button>
                      )}

                      <button
                        onClick={() => handleImportToLocalTable(selectedBackendApi)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                        title="Importiert diese Daten als neue Tabelle in den lokalen IndexedDB Workspace"
                      >
                        <Upload size={14}/> In lokale DB kopieren
                      </button>

                      <button
                        onClick={() => handleDeleteBackendApiConfig(selectedBackendApi.name)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-semibold p-1.5 rounded-lg text-xs transition-colors"
                        title="API Konfiguration vom Server löschen"
                      >
                        <Trash2 size={16}/>
                      </button>

                    </div>
                  </div>

                  {/* Cache Table Display / Editor */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[300px]">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">Cache-Datenbank vorschauen</span>
                        <span className="text-[10px] text-slate-400">Gibt den serverseitigen JSON-Cache aus ({backendApiCacheData.length} Datensätze)</span>
                      </div>

                      {selectedBackendApi.option === 'B' && (
                        <div className="flex items-center gap-2">
                          {isEditingCache ? (
                            <>
                              <button
                                onClick={handleUpdateServerCache}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1 px-3 rounded text-xs flex items-center gap-1 transition-colors"
                              >
                                <Check size={14}/> Cache speichern
                              </button>
                              <button
                                onClick={() => { setIsEditingCache(false); handleSelectBackendApi(selectedBackendApi); }}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-1 px-3 rounded text-xs flex items-center gap-1 transition-colors"
                              >
                                <X size={14}/> Abbrechen
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setIsEditingCache(true)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold py-1 px-3 rounded text-xs flex items-center gap-1 transition-colors"
                            >
                              <Edit3 size={14}/> Cache editieren
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-auto max-h-[350px]">
                      {backendApiCacheData.length > 0 ? (
                        <table className="w-full text-left text-xs border-collapse font-mono">
                          <thead>
                            <tr className="bg-slate-100 text-slate-500 sticky top-0 border-b border-slate-200">
                              {cacheEditFields.map(f => (
                                <th key={f.id} className="p-2.5 font-semibold border-r border-slate-200">{f.name}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {backendApiCacheData.map((row, rIdx) => (
                              <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50">
                                {cacheEditFields.map(f => (
                                  <td key={f.id} className="p-2 border-r border-slate-200">
                                    {isEditingCache ? (
                                      <input 
                                        type="text"
                                        className="bg-amber-50 focus:bg-white border border-transparent focus:border-amber-300 rounded px-1 py-0.5 w-full focus:outline-none"
                                        value={row[f.name] ?? ''}
                                        onChange={(e) => {
                                          const next = [...backendApiCacheData];
                                          next[rIdx] = { ...next[rIdx], [f.name]: e.target.value };
                                          setBackendApiCacheData(next);
                                        }}
                                      />
                                    ) : (
                                      <span className="px-1">{String(row[f.name] ?? '')}</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-center p-12 text-slate-400 text-xs">Der Cache-Speicher für diese API ist leer. Triggern Sie einen Sync.</div>
                      )}
                    </div>

                  </div>

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[350px] text-slate-400 gap-3 max-w-xl mx-auto text-center mt-8">
                  <Server size={64} className="opacity-10 text-slate-800" />
                  <div>
                    <h4 className="font-bold text-slate-700 text-sm">Keine Schnittstelle ausgewählt</h4>
                    <p className="text-xs text-slate-400 mt-1">Wählen Sie links eine registrierte Backend-API aus, um serverseitige Cache-Tabellen zu betrachten, zu editieren, live zu syncen oder in Ihr IndexedDB-Projekt zu klonen.</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: STORE DURABLE PERSISTENCE & BACKUP RESTORE */}
        {activeHubTab === 'backup' && (
          <div className="flex-1 bg-slate-50 p-6 overflow-y-auto flex flex-col gap-6">
            
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 mt-4">
              
              {/* SAVE TO INDEXEDDB BANNER */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="p-4 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Save size={36}/>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="text-base font-bold text-slate-800">Projekt dauerhaft in IndexedDB sichern</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md">IndexedDB ist eine hochperformante, transaktionssichere Client-Datenbank. Ihre Tabellen, Berichte, Formulare und Workflows bleiben dauerhaft erhalten – auch nach Browser-Neustarts.</p>
                  </div>
                </div>

                <button 
                  onClick={() => { store.saveProject().then(() => ui.addToast("Daten erfolgreich in IndexedDB gespeichert!", "success")); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-sm flex items-center gap-2 shadow-md transition-colors shrink-0 cursor-pointer"
                >
                  <Save size={18}/> In DB Speichern
                </button>
              </div>

              {/* DOWNLOAD & RESTORE BACKUPS */}
              <div className="grid grid-cols-2 gap-6">
                
                {/* Download backup */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Download className="text-violet-600" size={20}/>
                    <h4 className="font-bold text-slate-800 text-sm">Komplettes Backup herunterladen</h4>
                  </div>
                  <p className="text-xs text-slate-400">Erzeugt eine verschlüsselte Sicherungsdatei (.json) mit allen Tabellen, Relationen, Queries, Formularlayouts und Workflow-Definitionen für Desaster Recovery.</p>
                  
                  <div className="flex-1 flex items-end">
                    <button 
                      onClick={handleDownloadFullBackup}
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Download size={14}/> Backup-Datei erzeugen
                    </button>
                  </div>
                </div>

                {/* Restore backup */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Upload className="text-indigo-600" size={20}/>
                    <h4 className="font-bold text-slate-800 text-sm">Projekt aus Backup wiederherstellen</h4>
                  </div>
                  <p className="text-xs text-slate-400">Wählen Sie eine zuvor exportierte DB Studio Backup-Datei aus, um den aktuellen Workspace vollständig wiederherzustellen.</p>
                  
                  <input 
                    type="file" 
                    accept=".json" 
                    ref={backupFileInputRef} 
                    onChange={handleRestoreBackup}
                    className="hidden" 
                  />

                  <div className="flex-1 flex items-end">
                    <button 
                      onClick={() => backupFileInputRef.current?.click()}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Upload size={14}/> Backup hochladen
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* API Importer Original Modals */}
      <ApiSaveModal
        showSaveModal={showSaveModal}
        setShowSaveModal={setShowSaveModal}
        saveTableName={saveTableName}
        setSaveTableName={setSaveTableName}
        primaryKeyCol={primaryKeyCol}
        setPrimaryKeyCol={setPrimaryKeyCol}
        columns={getColumns()}
        schemaOverrides={schemaOverrides}
        data={data}
        performSave={performSave}
      />

      <ApiBackendSaveModal
        showBackendApiModal={showBackendApiModal}
        setShowBackendApiModal={setShowBackendApiModal}
        backendApiName={backendApiName}
        setBackendApiName={setBackendApiName}
        primaryKeyCol={primaryKeyCol}
        setPrimaryKeyCol={setPrimaryKeyCol}
        columns={getColumns()}
        schemaOverrides={schemaOverrides}
        data={data}
        backendApiOption={backendApiOption}
        setBackendApiOption={setBackendApiOption}
        backendRefreshInterval={backendRefreshInterval}
        setBackendRefreshInterval={setBackendRefreshInterval}
        performBackendSave={performBackendSave}
        isRegistering={isRegistering}
      />

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
