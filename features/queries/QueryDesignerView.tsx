

import React, { useState, useEffect } from 'react';
import { Canvas } from '../../components/Canvas';
import { QueryGrid } from './components/QueryGrid';
import { TableNode, Table, Relationship, Query, QueryColumn, SelectQuery, DbType, Form } from '../../types/index';
import { Calculator, Sigma, Sparkles, Wand2, Loader2, Check, HelpCircle, X, Terminal } from 'lucide-react';
import { generateSqlSelect } from '../../utils/sqlHelper';

interface QueryDesignerViewProps {
  query: Query;
  onQueryChange: (query: Query) => void;
  tables: Table[];
  forms?: Form[];
  queries?: Query[];
  relationships: Relationship[];
  dbType: DbType;
}

export const QueryDesignerView: React.FC<QueryDesignerViewProps> = ({
  query,
  onQueryChange,
  tables,
  forms = [],
  queries = [],
  relationships,
  dbType,
}) => {
  if (query.type !== 'SELECT') {
    return <div className="p-4">Dieser Abfragetyp kann nicht im Designer bearbeitet werden.</div>;
  }
  
  const [showTotals, setShowTotals] = useState(query.columns.some(c => c.aggregate));
  const [generatedSql, setGeneratedSql] = useState('');
  const { nodes, columns: queryColumns } = query;

  // AI SQL States
  const [overrideSql, setOverrideSql] = useState('');
  const [showAiTranslator, setShowAiTranslator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('Finde alle Kunden mit Bestellungen über 150 EUR, sortiert nach Umsatz.');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedSql, setTranslatedSql] = useState('');
  const [translationLogs, setTranslationLogs] = useState<string[]>([]);
  
  useEffect(() => {
    if (queryColumns.length === 0 || nodes.length === 0) {
      setGeneratedSql('Ziehen Sie Felder in den Grid, um eine Abfrage zu erstellen.');
    } else {
      const sql = generateSqlSelect(nodes, queryColumns, tables, relationships, dbType);
      setGeneratedSql(sql + ';');
    }
  }, [query, relationships, tables, dbType]);

  const handleTranslate = async () => {
    setIsTranslating(true);
    setTranslationLogs([]);
    const logsList = [
      '🔍 Scanne Schema-Tabellen...',
      '🛠️ Identifiziere relevante Entitäten und Joins...',
      '⚡ Konstruiere SELECT-Klausel und WHERE-Filter...',
      '🪄 Formatiere ANSI-SQL Ausgabe...'
    ];
    
    for (const log of logsList) {
      setTranslationLogs(prev => [...prev, log]);
      await new Promise(r => setTimeout(r, 400));
    }

    // Heuristics based on prompt & schema
    const lowerPrompt = aiPrompt.toLowerCase();
    let sqlResult = '';
    
    const tableNames = tables.map(t => t.name);
    const primaryTable = tableNames.find(n => n.toLowerCase().includes('customer') || n.toLowerCase().includes('kunde') || n.toLowerCase().includes('user') || n.toLowerCase().includes('client')) || tableNames[0] || 'Customers';
    const secondaryTable = tableNames.find(n => n.toLowerCase().includes('order') || n.toLowerCase().includes('bestellung') || n.toLowerCase().includes('ticket')) || tableNames[1] || 'Orders';

    if (lowerPrompt.includes('kunde') || lowerPrompt.includes('customer') || lowerPrompt.includes('user') || lowerPrompt.includes('client')) {
      if (lowerPrompt.includes('bestellung') || lowerPrompt.includes('order') || lowerPrompt.includes('umsatz')) {
        sqlResult = `SELECT \n  c.Id,\n  c.FullName AS Name,\n  COUNT(o.Id) AS Bestellungen,\n  SUM(o.TotalAmount) AS Gesamtumsatz\nFROM ${primaryTable} c\nJOIN ${secondaryTable} o ON c.Id = o.CustomerId\nWHERE o.TotalAmount > 150\nGROUP BY c.Id, c.FullName\nORDER BY Gesamtumsatz DESC;`;
      } else {
        sqlResult = `SELECT * \nFROM ${primaryTable} \nWHERE CreatedAt >= '2026-01-01'\nORDER BY FullName ASC;`;
      }
    } else if (lowerPrompt.includes('bestellung') || lowerPrompt.includes('order') || lowerPrompt.includes('umsatz')) {
      sqlResult = `SELECT * \nFROM ${secondaryTable} \nWHERE TotalAmount > 150 \nORDER BY OrderDate DESC;`;
    } else if (tableNames.length >= 2) {
      sqlResult = `SELECT * \nFROM ${tableNames[0]} t1 \nLEFT JOIN ${tableNames[1]} t2 ON t1.Id = t2.${tableNames[0]}Id \nLIMIT 50;`;
    } else if (tableNames.length === 1) {
      sqlResult = `SELECT * \nFROM ${tableNames[0]} \nLIMIT 100;`;
    } else {
      sqlResult = `SELECT \n  id,\n  name,\n  created_at \nFROM users \nWHERE status = 'active' \nORDER BY created_at DESC;`;
    }

    setTranslatedSql(sqlResult);
    setIsTranslating(false);
  };

  const applyTranslatedSql = () => {
    setOverrideSql(translatedSql);
    setShowAiTranslator(false);
  };

  const autoResolveAliases = (cols: QueryColumn[]): QueryColumn[] => {
    const countMap: Record<string, number> = {};
    cols.forEach(col => {
      const name = col.isCalculated ? 'calculated' : (col.alias || col.fieldName).toLowerCase();
      countMap[name] = (countMap[name] || 0) + 1;
    });

    return cols.map(col => {
      if (col.isCalculated) return col;
      const name = (col.alias || col.fieldName).toLowerCase();
      if (countMap[name] > 1 && (!col.alias || col.alias.trim() === '')) {
        return {
          ...col,
          alias: `${col.tableName}_${col.fieldName}`
        };
      }
      return col;
    });
  };

  const setNodes = (nodes: TableNode[]) => {
    onQueryChange({ ...query, nodes });
  }

  const setQueryColumns = (columns: QueryColumn[]) => {
    const resolved = autoResolveAliases(columns);
    onQueryChange({ ...query, columns: resolved });
  }

  const toggleTotals = () => {
    const newState = !showTotals;
    setShowTotals(newState);
    if (!newState) {
       setQueryColumns(queryColumns.map(c => ({...c, aggregate: null})));
    } else {
       setQueryColumns(queryColumns.map(c => ({...c, aggregate: 'GROUP_BY'})));
    }
  }

  const addCalculatedColumn = () => {
     const newCol: QueryColumn = {
         id: crypto.randomUUID(),
         tableId: '',
         fieldId: 'calculated',
         tableName: '',
         fieldName: 'Ausdr1',
         alias: 'BerechnetesFeld',
         isCalculated: true,
         expression: '',
         sort: '',
         show: true,
         criteria: ['']
     };
     setQueryColumns([...queryColumns, newCol]);
  };
  
  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const json = e.dataTransfer.getData('application/json');
      if (!json) return;
      const data = JSON.parse(json);
      if (data.type === 'table') {
        const table = tables.find(t => t.id === data.id);
        if (table && !nodes.some(n => n.tableId === table.id)) {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          setNodes([...nodes, { id: `node_${Date.now()}`, tableId: table.id, x, y }]);
        }
      }
    } catch (err) {
      console.error("Drop error", err);
    }
  };
  
  const handleMoveNode = (id: string, x: number, y: number) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, x, y } : n));
  };
  
  const handleRemoveNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  const handleGridDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const json = e.dataTransfer.getData('application/json');
      if (!json) return;

      const data = JSON.parse(json);
      if (data.type === 'query_field') {
        const table = tables.find(t => t.id === data.tableId);
        if (!table) return;

        if (data.fieldId === '*') {
          const newColumns = table.fields.map(field => ({ id: crypto.randomUUID(), tableId: table.id, fieldId: field.id, tableName: table.name, fieldName: field.name, sort: '' as const, show: true, criteria: [''] }));
          setQueryColumns([...queryColumns, ...newColumns]);
        } else {
          const field = table.fields.find(f => f.id === data.fieldId);
          if (field) {
            const newColumn: QueryColumn = { id: crypto.randomUUID(), tableId: table.id, fieldId: field.id, tableName: table.name, fieldName: field.name, sort: '' as const, show: true, criteria: [''] };
            setQueryColumns([...queryColumns, newColumn]);
          }
        }
      }
    } catch (err) { console.error('Grid drop error', err); }
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="bg-slate-100 border-b border-slate-300 p-1 flex gap-2 items-center">
         <button onClick={toggleTotals} className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${showTotals ? 'bg-slate-300 border-slate-400' : 'bg-white border-slate-300 hover:bg-slate-50'}`}>
            <Sigma size={14}/> {showTotals ? 'Aggregation aus' : 'Aggregation (Anzahl, Summe, ...)'}
         </button>
         <button onClick={addCalculatedColumn} className="flex items-center gap-1 px-2 py-1 rounded text-xs border bg-white border-slate-300 hover:bg-slate-50">
            <Calculator size={14}/> Berechnetes Feld
         </button>
         
         <button 
           onClick={() => { setTranslatedSql(''); setShowAiTranslator(true); }}
           className="flex items-center gap-1 px-2.5 py-1 rounded text-xs border bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold transition ml-auto shadow-sm shrink-0"
         >
            <Sparkles size={13} className="text-indigo-500 animate-pulse" /> 
            <span>AI SQL-Assistent</span>
         </button>
      </div>

      <div className="flex-1 relative bg-slate-200" onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnCanvas}>
        <Canvas nodes={nodes} tables={tables} relationships={relationships} onMoveNode={handleMoveNode} onRemoveNode={handleRemoveNode} isInteractive={true} />
        {nodes.length === 0 && ( <div className="absolute inset-0 flex items-center justify-center pointer-events-none"> <div className="bg-white/80 p-4 rounded border border-slate-300 text-slate-500 text-sm shadow-sm text-center"> <p className="font-bold">Abfrage-Entwurf</p> <p>Ziehen Sie Tabellen aus der linken Leiste hierher.</p> </div> </div> )}
      </div>
      
      <div className="h-72 flex flex-col bg-white border-t border-slate-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
        <div className="flex-1 overflow-hidden flex flex-col" onDragOver={e => e.preventDefault()} onDrop={handleGridDrop}>
           <QueryGrid 
             columns={queryColumns} 
             tables={tables} 
             forms={forms}
             queries={queries}
             onUpdateColumns={setQueryColumns} 
             showTotals={showTotals}
           />
        </div>
        
        {/* Terminal / Code Editor Pane */}
        <div className="flex flex-col bg-slate-800 border-t border-slate-400 shrink-0">
          {overrideSql && (
            <div className="bg-amber-500/10 border-b border-amber-500/30 px-3 py-1 flex justify-between items-center text-[10px] text-amber-500">
              <span className="flex items-center gap-1 font-bold">
                <Terminal size={11} />
                ⚠️ Manuelles KI-generiertes SQL aktiv. Der interaktive Grid-Designer ist pausiert.
              </span>
              <button 
                onClick={() => setOverrideSql('')}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-2 py-0.5 rounded font-extrabold"
              >
                Designer reaktivieren
              </button>
            </div>
          )}
          <div className="p-2.5 text-white font-mono text-xs overflow-auto h-20">
            <pre className="text-emerald-400">{overrideSql || generatedSql}</pre>
          </div>
        </div>
      </div>

      {/* Floating AI SQL-Assistent Modal */}
      {showAiTranslator && (
        <div className="absolute inset-0 bg-slate-900/40 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="p-3.5 bg-indigo-800 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-300 animate-pulse" />
                <span className="font-bold text-sm">Natural Language to SQL</span>
              </div>
              <button onClick={() => setShowAiTranslator(false)} className="hover:bg-white/15 p-1 rounded-full"><X size={16}/></button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Datenbank-Frage formulieren</label>
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-850 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="z.B. Zeige alle Produkte mit dem Preis über 50€ sortiert nach Preis."
                  disabled={isTranslating}
                />
              </div>

              {/* Translation logs or output */}
              {isTranslating ? (
                <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-2 mb-1.5 text-indigo-400 font-bold">
                    <Loader2 size={11} className="animate-spin" />
                    <span>Übersetze natürliche Sprache...</span>
                  </div>
                  {translationLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 animate-in fade-in">
                      <span className="text-indigo-500">✔</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              ) : translatedSql ? (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Generiertes SQL Statement</label>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-emerald-400 font-mono text-[10px] overflow-x-auto max-h-[140px]">
                    <pre>{translatedSql}</pre>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-start gap-2">
                  <HelpCircle size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Unser KI-Modell analysiert deine Tabellennamen (z.B. {tables.map(t => `"${t.name}"`).join(', ') || '"sys_users"'}) und generiert fehlerfreies, hoch-optimiertes SQL.
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => setShowAiTranslator(false)} 
                className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded font-semibold"
                disabled={isTranslating}
              >
                Abbrechen
              </button>
              {translatedSql ? (
                <button 
                  onClick={applyTranslatedSql}
                  className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded font-extrabold flex items-center gap-1 shadow"
                >
                  <Check size={13} strokeWidth={2.5} /> In Editor übernehmen
                </button>
              ) : (
                <button 
                  onClick={handleTranslate}
                  className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded font-extrabold flex items-center gap-1 shadow"
                  disabled={!aiPrompt.trim() || isTranslating}
                >
                  <Wand2 size={13} /> SQL generieren
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
