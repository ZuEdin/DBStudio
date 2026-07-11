import React, { useState, useEffect } from 'react';
import { 
  Globe, FileJson, Save, Table as TableIcon, Sliders, Server, GitFork 
} from 'lucide-react';
import { VirtualTable } from '../../components/VirtualTable';
import { Table, Field, ApiQueryParam, BackendConfig } from '../../types/index';
import { fetchApiData } from '../../utils/apiImportHelper';
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
    <div className="h-full flex flex-col bg-slate-50">
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
          <ApiPresetButtons
            setUrl={setUrl}
            setMethod={setMethod}
            setQueryParams={setQueryParams}
          />

          <ApiParamBuilder
            queryParams={queryParams}
            setQueryParams={setQueryParams}
            showParamBuilder={showParamBuilder}
            setShowParamBuilder={setShowParamBuilder}
            constructPreviewUrl={constructPreviewUrl}
          />

          <ApiAuthSection
            authType={authType}
            setAuthType={setAuthType}
            authBearerToken={authBearerToken}
            setAuthBearerToken={setAuthBearerToken}
            authApiKeyName={authApiKeyName}
            setAuthApiKeyName={setAuthApiKeyName}
            authApiKeyLocation={authApiKeyLocation}
            setAuthApiKeyLocation={setAuthApiKeyLocation}
            authApiKeyValue={authApiKeyValue}
            setAuthApiKeyValue={setAuthApiKeyValue}
            authApiKeyPrefix={authApiKeyPrefix}
            setAuthApiKeyPrefix={setAuthApiKeyPrefix}
            authUsername={authUsername}
            setAuthUsername={setAuthUsername}
            authPassword={authPassword}
            setAuthPassword={setAuthPassword}
            headers={headers}
            setHeaders={setHeaders}
          />
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 border-b border-red-100 text-sm">
          <strong>Letzter Fehler:</strong> {error}
        </div>
      )}

      {/* TABS */}
      {data.length > 0 && (
        <div className="flex border-b border-slate-200 px-4 bg-white shrink-0">
          <button 
            type="button"
            onClick={() => setActiveViewTab('data')} 
            className={`px-4 py-2 text-sm font-bold border-b-2 flex items-center gap-2 ${
              activeViewTab === 'data' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TableIcon size={16} /> Daten-Vorschau
          </button>
          <button 
            type="button"
            onClick={() => setActiveViewTab('schema')} 
            className={`px-4 py-2 text-sm font-bold border-b-2 flex items-center gap-2 ${
              activeViewTab === 'schema' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders size={16} /> Datentyp-Mapper / Schema
          </button>
          <button 
            type="button"
            onClick={() => setActiveViewTab('backend_code')} 
            className={`px-4 py-2 text-sm font-bold border-b-2 flex items-center gap-2 ${
              activeViewTab === 'backend_code' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
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
            <ApiSchemaMapper
              columns={getColumns()}
              primaryKeyCol={primaryKeyCol}
              setPrimaryKeyCol={setPrimaryKeyCol}
              schemaOverrides={schemaOverrides}
              setSchemaOverrides={setSchemaOverrides}
              data={data}
            />
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
                <ApiBackendCodeGenerator
                  backendLang={backendLang}
                  setBackendLang={setBackendLang}
                  copied={copied}
                  setCopied={setCopied}
                  activeCode={activeCode}
                  sqlServerMigration={sqlServerMigration}
                  showMessage={showMessage}
                />
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
