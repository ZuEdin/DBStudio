
import React, { useRef, useState, useEffect } from 'react';
import { Table, ApiQueryParam, Field, Relationship } from '../../types/index';
import { Plus, Trash2, Upload, RefreshCw, Loader2, Sliders, Filter, X, ExternalLink, Layout, List } from 'lucide-react';
import { VirtualTable } from '../../components/VirtualTable';
import { fetchApiData } from '../../utils/apiImportHelper';
import { useDataFilter } from '../../hooks/useDataFilter';
import { RecordDetailModal } from '../../components/RecordDetailModal';
import { KanbanBoard } from './components/KanbanBoard';

interface TableViewProps {
  table: Table;
  allTables: Table[];
  relationships: Relationship[];
  onTableChange: (table: Table) => void;
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
}

const formatDateValue = (val: any, format?: string, type?: string) => {
    if (!val) return '';
    
    // For TIME fields without format string, or if value is just HH:mm
    if (type === 'TIME' && typeof val === 'string' && val.length <= 8 && val.includes(':')) {
        return format ? val : val.substring(0, 5); // Return HH:mm if just time
    }

    let date: Date;
    if (typeof val === 'number') {
        date = new Date(val > 10000000000 ? val : val * 1000);
    } else {
        // If it’s just a time string, map it to today
        if (type === 'TIME' && typeof val === 'string' && val.match(/^\d{2}:\d{2}/)) {
            const [h, m, s] = val.split(':');
            date = new Date();
            date.setHours(parseInt(h || '0'), parseInt(m || '0'), parseInt(s || '0'), 0);
        } else {
            date = new Date(val);
        }
    }
    if (isNaN(date.getTime())) return String(val);
    
    if (!format) {
        if (type === 'TIME') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (type === 'DATE') return date.toLocaleDateString();
        return date.toLocaleString();
    }
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    const H = date.getHours().toString().padStart(2, '0');
    const M = date.getMinutes().toString().padStart(2, '0');
    const S = date.getSeconds().toString().padStart(2, '0');
    return format.replace('dd', d).replace('MM', m).replace('yyyy', String(y)).replace('HH', H).replace('mm', M).replace('ss', S);
};

export const TableView: React.FC<TableViewProps> = ({ table, allTables, relationships, onTableChange, showConfirmation }) => {
  const headers = table.fields.map(field => field.name);
  const rawData = table.data || [];
  
  const { filteredData, filters, setFilter, clearFilters, showFilters, setShowFilters, columnStats } = useDataFilter(rawData);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showParams, setShowParams] = useState(false);
  const [detailView, setDetailView] = useState<{ targetTableId: string, recordId: any } | null>(null);
  
  // View Mode: List or Kanban
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const queryParams = table.apiConfig?.queryParams || [];

  useEffect(() => {
      if (table.apiConfig?.refreshOnLoad) {
          handleApiRefresh();
      }
  }, [table.id]);

  const updateParamValue = (id: string, newVal: string) => {
      if (!table.apiConfig || !table.apiConfig.queryParams) return;
      const newParams = table.apiConfig.queryParams.map(p => p.id === id ? { ...p, value: newVal } : p);
      onTableChange({ ...table, apiConfig: { ...table.apiConfig, queryParams: newParams } });
  };

  const handleDataChange = (rowToUpdate: any, header: string, value: string) => {
    const originalIndex = rawData.indexOf(rowToUpdate);
    if (originalIndex === -1) return;
    const newData = [...rawData];
    newData[originalIndex] = { ...newData[originalIndex], [header]: value };
    onTableChange({ ...table, data: newData });
  };

  const addRow = () => {
    const newRow = headers.reduce((acc, header) => {
      const field = table.fields.find(f => f.name === header);
      if (field?.isAutoIncrement && field.type === 'INTEGER') {
          const maxVal = rawData.reduce((max, row) => {
              const val = parseInt(row[header], 10);
              return !isNaN(val) && val > max ? val : max;
          }, 0);
          acc[header] = maxVal + 1;
      } else if (field?.defaultValue !== undefined && field?.defaultValue !== '') {
          if (field.type === 'BOOLEAN') {
              acc[header] = field.defaultValue === 'true';
          } else if ((field.type === 'DATE' || field.type === 'TIME' || field.type === 'DATETIME' || field.type === 'TIMESTAMP') && field.defaultValue.toUpperCase() === 'NOW') {
              acc[header] = new Date().toISOString();
          } else {
              acc[header] = field.defaultValue;
          }
      } else {
          acc[header] = '';
      }
      return acc;
    }, {} as Record<string, any>);

    const newData = [...rawData, newRow];
    onTableChange({ ...table, data: newData });
  };

  const deleteRow = (rowToDelete: any) => {
    showConfirmation('Zeile löschen', 'Möchten Sie diese Zeile wirklich löschen?', () => {
        const newData = rawData.filter(r => r !== rowToDelete);
        onTableChange({ ...table, data: newData });
    });
  };

  const handleApiRefresh = async () => {
      if (!table.apiConfig) return;
      setIsRefreshing(true);
      const result = await fetchApiData(table.apiConfig.url, table.apiConfig.method, table.apiConfig.headers, table.apiConfig.queryParams);
      if (result.error) {
          alert('Fehler beim Aktualisieren: ' + result.error);
      } else {
          onTableChange({ ...table, data: result.data });
      }
      setIsRefreshing(false);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split('\n');
      const csvHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const autoIncFields = table.fields.filter(f => f.isAutoIncrement && f.type === 'INTEGER');
      const nextAutoIncValues: Record<string, number> = {};
      autoIncFields.forEach(f => {
          const maxVal = rawData.reduce((max, row) => {
              const val = parseInt(row[f.name], 10);
              return !isNaN(val) && val > max ? val : max;
          }, 0);
          nextAutoIncValues[f.name] = maxVal + 1;
      });
      const newRows: Record<string, any>[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length === csvHeaders.length) {
          const row: Record<string, any> = {};
          table.fields.forEach(field => {
             const index = csvHeaders.findIndex(h => h.toLowerCase() === field.name.toLowerCase());
             row[field.name] = index !== -1 ? values[index] : '';
          });
          autoIncFields.forEach(f => {
              if (!row[f.name]) { row[f.name] = nextAutoIncValues[f.name]; nextAutoIncValues[f.name]++; }
          });
          newRows.push(row);
        }
      }
      if (newRows.length > 0) {
        onTableChange({ ...table, data: [...rawData, ...newRows] });
        alert(`${newRows.length} Zeilen erfolgreich importiert.`);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const renderRow = (row: any, rowIndex: number) => (
      <div className="flex border-b border-slate-100 hover:bg-sky-50 group h-full items-center text-sm text-slate-700">
          {headers.map(header => {
            const field = table.fields.find(f => f.name === header);
            const isAutoInc = field?.isAutoIncrement;
            const isDate = field?.type === 'DATE' || field?.type === 'TIME' || field?.type === 'DATETIME' || field?.type === 'TIMESTAMP';
            const rawVal = row[header] ?? '';
            const displayVal = isDate ? formatDateValue(rawVal, field?.displayFormat, field?.type) : rawVal;
            const rel = relationships.find(r => r.fromTableId === table.id && r.fromFieldId === field?.id);
            const isFK = !!rel;
            const showLink = isFK && rawVal;

            return (
                <div key={`${rowIndex}-${header}`} className={`w-40 shrink-0 border-r border-slate-100 h-full relative ${isAutoInc ? 'bg-slate-50' : ''} flex items-center`}>
                    <input
                        type="text"
                        value={displayVal} 
                        title={String(rawVal)} 
                        onChange={(e) => { handleDataChange(row, header, e.target.value) }}
                        readOnly={isAutoInc}
                        className={`flex-1 h-full px-2 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500 ${isAutoInc ? 'cursor-not-allowed italic text-slate-400' : ''} ${showLink ? 'pr-8' : ''}`}
                    />
                    {showLink && (
                        <button 
                            onClick={() => setDetailView({ targetTableId: rel.toTableId, recordId: rawVal })}
                            className="absolute right-1 top-1 bottom-1 p-1 text-blue-400 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors flex items-center justify-center"
                            title="Datensatz anzeigen"
                        >
                            <ExternalLink size={12} />
                        </button>
                    )}
                </div>
            )
          })}
          <div className="w-10 shrink-0 flex justify-center">
              <button onClick={() => deleteRow(row)} className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={14} />
              </button>
          </div>
      </div>
  );

  const targetTable = detailView ? allTables.find(t => t.id === detailView.targetTableId) : null;

  return (
    <div className="p-4 sm:p-8 bg-slate-50 h-full overflow-hidden flex flex-col">
      <div className="max-w-full mx-auto bg-white shadow-lg border border-slate-200 rounded-lg overflow-hidden flex flex-col h-full w-full">
        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Datenblatt: {table.name}</h2>
              <div className="flex items-center gap-1 ml-4 bg-slate-700 rounded p-1">
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white text-slate-800' : 'text-slate-400 hover:text-white'}`} title="Liste">
                      <List size={16}/>
                  </button>
                  <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded transition-colors ${viewMode === 'kanban' ? 'bg-white text-slate-800' : 'text-slate-400 hover:text-white'}`} title="Kanban Board">
                      <Layout size={16}/>
                  </button>
              </div>

              {viewMode === 'list' && (
                  <div className="flex items-center gap-1 ml-4">
                      <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1 px-3 py-1 rounded text-xs border transition-colors ${showFilters || Object.keys(filters).length > 0 ? 'bg-orange-500 border-orange-400 text-white' : 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300'}`}
                        title="Filter anzeigen"
                      >
                          <Filter size={14} /> Filter {Object.keys(filters).length > 0 ? `(${Object.keys(filters).length})` : ''}
                      </button>

                      {table.apiConfig && (
                        <div className="flex items-center bg-slate-700 rounded ml-2 p-1">
                            {queryParams.length > 0 && (
                                <button 
                                    onClick={() => setShowParams(!showParams)}
                                    className={`p-1 px-2 rounded text-xs flex items-center gap-1 ${showParams ? 'bg-slate-600 text-white' : 'text-slate-300 hover:text-white'}`}
                                    title="API Parameter"
                                >
                                    <Sliders size={14} /> {queryParams.length}
                                </button>
                            )}
                            <button 
                                onClick={handleApiRefresh} 
                                disabled={isRefreshing}
                                className={`flex items-center gap-1 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs ml-1 disabled:opacity-50 ${isRefreshing ? 'bg-blue-500' : 'bg-blue-600'}`}
                            >
                                {isRefreshing ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14} />}
                                {isRefreshing ? 'Lädt...' : 'Refresh'}
                            </button>
                        </div>
                      )}
                  </div>
              )}
          </div>
          <div className="flex gap-2">
            <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportCSV} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm border border-slate-600">
              <Upload size={16} /> CSV
            </button>
            <button onClick={addRow} className="flex items-center gap-1 bg-green-600 hover:bg-green-50 px-3 py-1 rounded text-sm font-semibold">
              <Plus size={16} /> Neu
            </button>
          </div>
        </div>

        {/* API Parameters Toolbar */}
        {showParams && queryParams.length > 0 && viewMode === 'list' && (
            <div className="bg-slate-100 border-b border-slate-200 p-2 flex flex-wrap gap-4 items-center animate-in slide-in-from-top-1">
                <span className="text-xs font-bold text-slate-500 uppercase">API Parameter:</span>
                {queryParams.map(p => (
                    <div key={p.id} className="flex items-center gap-1">
                        <label className="text-xs font-semibold text-slate-700">{p.key}:</label>
                        {p.type === 'select' ? (
                            <select value={p.value} onChange={e => updateParamValue(p.id, e.target.value)} className="border border-slate-300 rounded text-xs py-1 px-2">
                                <option value="">(Alle/Keine)</option>
                                {p.options?.map(opt => <option key={opt} value={opt.trim()}>{opt.trim()}</option>)}
                            </select>
                        ) : (
                            <input type="text" value={p.value} onChange={e => updateParamValue(p.id, e.target.value)} className="border border-slate-300 rounded text-xs py-1 px-2 w-24" />
                        )}
                    </div>
                ))}
            </div>
        )}

        {/* DATA FILTER BAR */}
        {showFilters && viewMode === 'list' && (
            <div className="bg-orange-50 border-b border-orange-200 p-2 flex overflow-x-auto gap-2 items-center animate-in slide-in-from-top-2 shadow-inner shrink-0">
                <div className="flex items-center gap-2 pr-4 border-r border-orange-200 mr-2">
                    <span className="text-xs font-bold text-orange-800 uppercase flex items-center gap-1"><Filter size={12}/> Filter</span>
                    <button onClick={clearFilters} className="text-orange-600 hover:text-orange-800 text-xs underline">Alle löschen</button>
                </div>
                {headers.map(h => {
                    const stats = columnStats[h];
                    const hasFilter = !!filters[h];
                    const field = table.fields.find(f => f.name === h);
                    const isDate = field?.type === 'DATE' || field?.type === 'TIME' || field?.type === 'DATETIME' || field?.type === 'TIMESTAMP';
                    return (
                        <div key={h} className={`flex flex-col min-w-[120px] max-w-[200px] ${hasFilter ? 'bg-white rounded shadow-sm' : ''} p-1`}>
                            <label className="text-[10px] font-bold text-orange-700 mb-0.5 truncate px-1">{h}</label>
                            {stats?.isLowCardinality && !isDate ? (
                                <select value={filters[h] || ''} onChange={e => setFilter(h, e.target.value)} className={`w-full border rounded px-1 py-0.5 text-xs outline-none ${hasFilter ? 'border-orange-400 bg-orange-50' : 'border-orange-200 bg-white'}`}>
                                    <option value="">(Alle)</option>
                                    {stats.uniqueValues.map(val => <option key={val} value={val}>{val}</option>)}
                                </select>
                            ) : (
                                <div className="relative">
                                    <input type="text" value={filters[h] || ''} onChange={e => setFilter(h, e.target.value)} placeholder={isDate ? "z.B. 2024-01-01" : "Suchen..."} className={`w-full border rounded px-1 py-0.5 text-xs outline-none pr-4 ${hasFilter ? 'border-orange-400 bg-orange-50' : 'border-orange-200'}`} />
                                    {filters[h] && <button onClick={() => setFilter(h, '')} className="absolute right-1 top-0.5 text-orange-400 hover:text-orange-600"><X size={10}/></button>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}

        <div className="overflow-hidden flex-1 relative bg-slate-50">
          {isRefreshing && (
              <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center backdrop-blur-sm">
                  <div className="bg-white p-4 rounded shadow-lg flex items-center gap-3 border border-slate-200">
                      <Loader2 className="animate-spin text-blue-600" size={24} />
                      <span className="text-sm font-semibold text-slate-700">Lade Live-Daten...</span>
                  </div>
              </div>
          )}
          
          {viewMode === 'kanban' ? (
              <KanbanBoard table={table} onUpdateRow={handleDataChange} />
          ) : (
              headers.length > 0 ? (
                  <VirtualTable data={filteredData} headers={headers} renderRow={renderRow} rowHeight={35} />
              ) : (
                 <div className="p-6 text-center text-slate-500"><p>Die Tabelle "{table.name}" enthält keine Daten.</p></div>
              )
          )}
        </div>
        <div className="bg-slate-50 border-t border-slate-200 p-2 text-xs text-slate-500 text-right flex justify-between shrink-0">
           <span>{Object.keys(filters).length > 0 ? `${filteredData.length} gefiltert von ${rawData.length}` : `${rawData.length} Datensätze`}</span>
           <span>{table.apiConfig?.refreshOnLoad ? '(Live API)' : '(Lokal)'}</span>
        </div>
      </div>

      {detailView && targetTable && (
          <RecordDetailModal table={targetTable} recordId={detailView.recordId} onClose={() => setDetailView(null)} />
      )}
    </div>
  );
};
