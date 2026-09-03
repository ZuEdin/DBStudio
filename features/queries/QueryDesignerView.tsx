

import React, { useState, useEffect } from 'react';
import { Canvas } from '../../components/Canvas';
import { QueryGrid } from './components/QueryGrid';
import { TableNode, Table, Relationship, Query, QueryColumn, SelectQuery, DbType, Form, QueryParameter } from '../../types/index';
import { Calculator, Sigma, Sparkles, Play, Database, Wand2, Loader2, Check, HelpCircle, X, Terminal, Code, GitCommit, Sliders, FileCode, PlayCircle, Table as TableIcon, TableProperties, Eye, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { generateSqlSelect } from '../../utils/sqlHelper';
import { AccessSqlConverterModal } from '../tools/AccessSqlConverterModal';
import { useUIStore } from '../../stores/useUIStore';
import { useProjectStore } from '../../stores/useProjectStore';
import { JoinPropertiesModal } from './components/JoinPropertiesModal';
import { QueryParametersModal } from './components/QueryParametersModal';
import { ParameterPromptModal } from './components/ParameterPromptModal';
import { QueryExportModal } from './components/QueryExportModal';
import { CrosstabWizardModal } from './components/CrosstabWizardModal';
import { extractCrosstabConfigFromQuery, generateCrosstabSql, CrosstabConfig } from './utils/crosstabGenerator';
import { ActionQueryRunner } from './components/ActionQueryRunner';
import { WindowFunctionModal } from './components/WindowFunctionModal';
import { CteQueryBuilderModal } from './components/CteQueryBuilderModal';
import { SetOperationsModal } from './components/SetOperationsModal';
import { VisualExplainCostTreeModal } from './components/VisualExplainCostTreeModal';
import { generateMultiDialectSql, SupportedSqlDialect } from './utils/multiDialectSqlGenerator';
import { executeQueryInWasmSandbox } from './services/queryWasmSandboxService';
import { LiveQueryDataPreview } from './components/LiveQueryDataPreview';

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
  const ui = useUIStore();
  const setRelationships = useProjectStore((state) => state.setRelationships);

  const [selectedRelForJoin, setSelectedRelForJoin] = useState<Relationship | null>(null);
  const [showParamsModal, setShowParamsModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCrosstabModal, setShowCrosstabModal] = useState(false);
  const [showWindowModal, setShowWindowModal] = useState(false);
  const [showCteModal, setShowCteModal] = useState(false);
  const [showSetModal, setShowSetModal] = useState(false);
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [selectedDialect, setSelectedDialect] = useState<SupportedSqlDialect>('SQLITE');

  if (query.type !== 'SELECT' && query.type !== 'CROSSTAB') {
    const actionQuery = query as any;
    return (
      <div className="flex-1 flex flex-col bg-slate-950 p-6 overflow-y-auto items-center justify-center">
        <ActionQueryRunner
          query={actionQuery}
          tables={tables}
          dbType={dbType}
        />
      </div>
    );
  }

  const selectQuery = query as SelectQuery;
  const isCrosstabInitial = query.type === 'CROSSTAB' || (query.columns && query.columns.some(c => c.crosstab));
  const [showTotals, setShowTotals] = useState(query.columns.some(c => c.aggregate) || isCrosstabInitial);
  const [showCrosstab, setShowCrosstab] = useState(isCrosstabInitial);
  const [generatedSql, setGeneratedSql] = useState('');
  const { nodes, columns: queryColumns } = query;

  // Custom SQL Override
  const [overrideSql, setOverrideSql] = useState('');
  
  useEffect(() => {
    if (queryColumns.length === 0 || nodes.length === 0) {
      setGeneratedSql('Ziehen Sie Felder in den Grid, um eine Abfrage zu erstellen.');
    } else {
      const crosstabConfig = extractCrosstabConfigFromQuery(selectQuery, tables);
      if (selectQuery.type === 'CROSSTAB' || crosstabConfig) {
        if (crosstabConfig) {
          const sql = generateCrosstabSql(crosstabConfig, tables, dbType);
          setGeneratedSql(sql);
        } else {
          const sql = generateSqlSelect(nodes, queryColumns, tables, relationships, dbType, false, undefined, Boolean(selectQuery.distinct));
          setGeneratedSql(sql + ';');
        }
      } else {
        const sql = generateSqlSelect(nodes, queryColumns, tables, relationships, dbType, false, undefined, Boolean(selectQuery.distinct));
        setGeneratedSql(sql + ';');
      }
    }
  }, [query, relationships, tables, dbType, selectQuery.distinct, selectQuery.type, selectQuery.crosstabConfig]);

  useEffect(() => {
    const handleDesignerAction = (e: Event) => {
      const customEvent = e as CustomEvent<{ action: string }>;
      const action = customEvent.detail?.action;
      if (!action) return;

      switch (action) {
        case 'open_crosstab_modal':
        case 'query_open_crosstab_wizard':
          setShowCrosstabModal(true);
          break;
        case 'open_access_converter':
        case 'query_open_access_converter':
          setShowAccessSqlModal(true);
          break;
        case 'open_sql_view':
        case 'query_open_sql_view': {
          const sqlSection = document.getElementById('query-sql-terminal-pane');
          if (sqlSection) {
            sqlSection.scrollIntoView({ behavior: 'smooth' });
          }
          ui.addToast("SQL-Ansicht im unteren Fensterbereich aktiv.", "info");
          break;
        }
        case 'query_open_join_props': {
          if (relationships && relationships.length > 0) {
            setSelectedRelForJoin(relationships[0]);
          } else {
            ui.addToast("Keine Beziehungslinien in der aktuellen Abfrage vorhanden. Verbinden Sie Tabellen per Drag-and-Drop.", "info");
          }
          break;
        }
        case 'query_open_parameters_modal':
          setShowParamsModal(true);
          break;
        case 'query_open_export_modal':
          setShowExportModal(true);
          break;
        case 'query_open_criteria_helper':
        case 'query_add_calculated_field':
          addCalculatedColumn();
          ui.addToast("Neues Berechnungs- und Kriterienfeld eingefügt.", "success");
          break;
        case 'query_toggle_totals':
          toggleTotals();
          break;
        case 'query_open_window_functions':
          setShowWindowModal(true);
          break;
        case 'query_open_cte_builder':
          setShowCteModal(true);
          break;
        case 'query_open_set_operations':
          setShowSetModal(true);
          break;
        case 'query_open_explain_plan':
          setShowExplainModal(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener('query-designer-action', handleDesignerAction);
    return () => {
      window.removeEventListener('query-designer-action', handleDesignerAction);
    };
  }, [relationships, queryColumns, nodes]);

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
  };

  const setQueryColumns = (columns: QueryColumn[]) => {
    const resolved = autoResolveAliases(columns);
    onQueryChange({ ...query, columns: resolved });
  };

  const toggleTotals = () => {
    const newState = !showTotals;
    setShowTotals(newState);
    if (!newState) {
       setQueryColumns(queryColumns.map(c => ({...c, aggregate: null})));
    } else {
       setQueryColumns(queryColumns.map(c => ({...c, aggregate: 'GROUP_BY'})));
    }
  };

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
  
  const [bottomPaneTab, setBottomPaneTab] = useState<'preview' | 'sql' | 'dialect'>('preview');

  const handleConnect = (t1: string, f1: string, t2: string, f2: string) => {
    const fromTable = tables.find(t => t.id === t1);
    const toTable = tables.find(t => t.id === t2);
    if (!fromTable || !toTable) return;
    const fromField = fromTable.fields.find(f => f.id === f1);
    const toField = toTable.fields.find(f => f.id === f2);
    const type = fromField?.isPrimaryKey && !toField?.isPrimaryKey ? '1:n' : '1:1';
    
    // Check if relationship already exists
    const existing = relationships.find(
      r => (r.fromTableId === t1 && r.fromFieldId === f1 && r.toTableId === t2 && r.toFieldId === f2) ||
           (r.fromTableId === t2 && r.fromFieldId === f2 && r.toTableId === t1 && r.toFieldId === f1)
    );

    if (!existing) {
      const newRel: Relationship = {
        id: crypto.randomUUID(),
        fromTableId: t1,
        fromFieldId: f1,
        toTableId: t2,
        toFieldId: f2,
        type: type,
        joinType: 'INNER',
        referentialIntegrity: false
      };
      setRelationships([...relationships, newRel]);
      ui.addToast(`JOIN zwischen "${fromTable.name}.${fromField?.name}" und "${toTable.name}.${toField?.name}" erstellt!`, 'success');
      setSelectedRelForJoin(newRel);
    }
  };

  const handleMoveNode = (id: string, x: number, y: number) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, x, y } : n));
  };
  
  const handleRemoveNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  const handleRelationshipClick = (_event: React.MouseEvent, relId: string) => {
    const rel = relationships.find((r) => r.id === relId);
    if (rel) {
      setSelectedRelForJoin(rel);
    }
  };

  const handleSaveRelationship = (updatedRel: Relationship) => {
    const updated = relationships.map((r) => (r.id === updatedRel.id ? updatedRel : r));
    setRelationships(updated);
  };

  const handleSaveParameters = (parameters: QueryParameter[]) => {
    onQueryChange({
      ...query,
      parameters,
    } as SelectQuery);
  };

  const handleRunQuery = () => {
    if (selectQuery.parameters && selectQuery.parameters.length > 0) {
      setShowPromptModal(true);
    } else {
      ui.setCurrentView({ type: 'query_results', queryId: query.id });
    }
  };

  const handleExecuteWithParams = (paramValues: Record<string, any>) => {
    ui.setCurrentView({ type: 'query_results', queryId: query.id });
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

  const handleApplyCrosstabFromWizard = (crosstabCfg: CrosstabConfig, sql: string) => {
    const table = tables.find(t => t.id === crosstabCfg.sourceTableId || t.name === crosstabCfg.sourceTableId) || tables[0];
    if (!table) return;

    let currentNodes = [...nodes];
    let existingNode = currentNodes.find(n => n.tableId === table.id || (n as any).data?.tableId === table.id);
    if (!existingNode) {
      existingNode = {
        id: `node_${Date.now()}`,
        tableId: table.id,
        x: 80,
        y: 80,
      };
      currentNodes.push(existingNode);
    }

    const newCols: QueryColumn[] = [];

    // Row headers
    crosstabCfg.rowHeaders.forEach((r, idx) => {
      newCols.push({
        id: `col_row_${idx}_${Date.now()}`,
        tableId: table.id,
        nodeId: existingNode!.id,
        fieldId: r.fieldId,
        tableName: table.name,
        fieldName: r.fieldName,
        alias: r.alias || r.fieldName,
        show: true,
        criteria: [],
        aggregate: 'GROUP_BY',
        crosstab: 'ROW_HEADING',
      });
    });

    // Column header
    newCols.push({
      id: `col_col_${Date.now()}`,
      tableId: table.id,
      nodeId: existingNode.id,
      fieldId: crosstabCfg.columnHeader.fieldId,
      tableName: table.name,
      fieldName: crosstabCfg.columnHeader.fieldName,
      alias: crosstabCfg.columnHeader.alias || crosstabCfg.columnHeader.fieldName,
      show: true,
      criteria: [],
      aggregate: 'GROUP_BY',
      crosstab: 'COLUMN_HEADING',
    });

    // Value field
    newCols.push({
      id: `col_val_${Date.now()}`,
      tableId: table.id,
      nodeId: existingNode.id,
      fieldId: crosstabCfg.valueField.fieldId,
      tableName: table.name,
      fieldName: crosstabCfg.valueField.fieldName,
      alias: crosstabCfg.valueField.alias || crosstabCfg.valueField.fieldName,
      show: true,
      criteria: [],
      aggregate: crosstabCfg.valueField.aggregate,
      crosstab: 'VALUE',
    });

    const updatedQuery: SelectQuery = {
      ...selectQuery,
      type: 'CROSSTAB',
      nodes: currentNodes,
      columns: newCols,
      crosstabConfig: {
        rowHeaders: crosstabCfg.rowHeaders.map(r => r.fieldName),
        columnHeader: crosstabCfg.columnHeader.fieldName,
        valueField: crosstabCfg.valueField.fieldName,
        aggregate: crosstabCfg.valueField.aggregate,
        showRowTotals: true,
        showColTotals: true,
      }
    };

    onQueryChange(updatedQuery);
    setShowTotals(true);
    setShowCrosstab(true);
    setOverrideSql('');
    ui.addToast("Kreuztabellen-Konfiguration erfolgreich in den Designer übernommen!", "success");
  };

  const [showAccessSqlModal, setShowAccessSqlModal] = useState(false);

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Top Toolbar */}
      <div className="bg-slate-100 border-b border-slate-300 p-1 flex gap-2 items-center flex-wrap">
         <button onClick={toggleTotals} className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border font-medium ${showTotals ? 'bg-slate-300 border-slate-400 font-bold text-slate-900' : 'bg-white border-slate-300 hover:bg-slate-50'}`}>
            <Sigma size={14}/> {showTotals ? 'Aggregation aus' : 'Funktionen / Summen'}
         </button>
         
         <button 
           onClick={() => {
             const nextVal = !showCrosstab;
             setShowCrosstab(nextVal);
             if (nextVal) {
               setShowTotals(true);
               onQueryChange({ ...selectQuery, type: 'CROSSTAB' });
             } else {
               onQueryChange({ ...selectQuery, type: 'SELECT' });
             }
           }} 
           className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border font-medium transition-colors ${
             showCrosstab || selectQuery.type === 'CROSSTAB' 
               ? 'bg-purple-100 border-purple-400 text-purple-900 font-bold shadow-2xs' 
               : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
           }`}
           title="Kreuztabellen-Modus (Pivot Zeilen/Spalten/Werte) aktivieren/deaktivieren"
         >
            <TableIcon size={14} className={showCrosstab ? 'text-purple-700' : 'text-slate-600'} />
            <span>Kreuztabelle {showCrosstab ? '(Aktiv)' : ''}</span>
         </button>

         <button 
           onClick={() => setShowCrosstabModal(true)} 
           className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100 font-bold transition shadow-2xs"
           title="Kreuztabellen- & Matrix-Assistent öffnen"
         >
            <Sparkles size={13} className="text-purple-600" />
            <span>Pivot Assistent</span>
         </button>

         <button onClick={addCalculatedColumn} className="flex items-center gap-1 px-2.5 py-1 rounded text-xs border bg-white border-slate-300 hover:bg-slate-50 font-medium">
            <Calculator size={14}/> Berechnetes Feld
         </button>

         <button 
           onClick={() => setShowParamsModal(true)} 
           className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border bg-white border-slate-300 hover:bg-slate-50 font-medium"
           title="Parameter wie :projekt_id verwalten"
         >
            <Sliders size={14} className="text-slate-600" />
            <span>Parameter {selectQuery.parameters && selectQuery.parameters.length > 0 ? `(${selectQuery.parameters.length})` : ''}</span>
         </button>

         <button 
           onClick={() => ui.setActiveWizard('maketable')} 
           className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100 font-semibold transition shadow-2xs cursor-pointer"
           title="Erstelle neue permanente oder temporäre Tabelle aus dieser Abfrage"
         >
            <TableProperties size={14} className="text-teal-600" />
            <span>Tabelle erstellen</span>
         </button>

         <button 
           onClick={() => setShowExportModal(true)} 
           className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border bg-white border-slate-300 hover:bg-slate-50 font-medium text-slate-700"
           title="Exportiere als React Hook oder REST API"
         >
            <FileCode size={14} className="text-indigo-600" />
            <span>API & Hook Export</span>
         </button>

         <button 
           onClick={handleRunQuery} 
           className="flex items-center gap-1.5 px-3 py-1 rounded text-xs bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-2xs transition-colors ml-1"
         >
            <PlayCircle size={14} />
            <span>Ausführen</span>
         </button>
         
         <button 
           onClick={() => setShowAccessSqlModal(true)}
           className="flex items-center gap-1 px-2.5 py-1 rounded text-xs border bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 font-bold transition ml-auto shrink-0 shadow-2xs"
         >
            <Code size={13} className="text-blue-600" />
            <span>SQL Dialekt Konverter</span>
         </button>

         <button 
           onClick={() => {
             ui.setAiCopilotTab('query');
             ui.setShowAiCopilotModal(true);
           }}
           className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold transition shrink-0 shadow-2xs"
           title="AI Query-Copilot öffnen (Vorbereitet)"
         >
            <Sparkles size={13} className="text-indigo-500" /> 
            <span>AI Query-Copilot</span>
         </button>
      </div>

      {showAccessSqlModal && (
        <AccessSqlConverterModal 
          onClose={() => setShowAccessSqlModal(false)} 
          onApplySql={(convertedSql) => {
            setOverrideSql(convertedSql);
          }}
        />
      )}

      {selectedRelForJoin && (
        <JoinPropertiesModal
          isOpen={Boolean(selectedRelForJoin)}
          onClose={() => setSelectedRelForJoin(null)}
          relationship={selectedRelForJoin}
          tables={tables}
          onSave={handleSaveRelationship}
        />
      )}

      {showParamsModal && (
        <QueryParametersModal
          isOpen={showParamsModal}
          onClose={() => setShowParamsModal(false)}
          parameters={selectQuery.parameters || []}
          onSave={handleSaveParameters}
        />
      )}

      {showPromptModal && (
        <ParameterPromptModal
          isOpen={showPromptModal}
          onClose={() => setShowPromptModal(false)}
          parameters={selectQuery.parameters || []}
          onExecute={handleExecuteWithParams}
        />
      )}

      {showExportModal && (
        <QueryExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          query={selectQuery}
          sql={overrideSql || generatedSql}
        />
      )}

      {showCrosstabModal && (
        <CrosstabWizardModal
          isOpen={showCrosstabModal}
          onClose={() => setShowCrosstabModal(false)}
          tables={tables}
          dbType={dbType}
          onApplySql={(sql) => {
            setOverrideSql(sql);
          }}
          onApplyCrosstab={handleApplyCrosstabFromWizard}
        />
      )}

      {showWindowModal && (
        <WindowFunctionModal
          isOpen={showWindowModal}
          onClose={() => setShowWindowModal(false)}
          tables={tables}
          onApplySql={(sql) => {
            addCalculatedColumn();
            ui.addToast("Window Function Spalte eingefügt.", "success");
          }}
        />
      )}

      {showCteModal && (
        <CteQueryBuilderModal
          isOpen={showCteModal}
          onClose={() => setShowCteModal(false)}
          tables={tables}
          onApplyCteSql={(sql) => {
            setOverrideSql(sql);
          }}
        />
      )}

      {showSetModal && (
        <SetOperationsModal
          isOpen={showSetModal}
          onClose={() => setShowSetModal(false)}
          queries={queries}
          tables={tables}
          onApplySql={(sql) => {
            setOverrideSql(sql);
          }}
        />
      )}

      {showExplainModal && (
        <VisualExplainCostTreeModal
          isOpen={showExplainModal}
          onClose={() => setShowExplainModal(false)}
          selectQuery={selectQuery}
          tables={tables}
          relationships={relationships}
        />
      )}

      {/* Canvas */}
      <div className="flex-1 relative bg-slate-200" onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnCanvas}>
        <Canvas 
          nodes={nodes} 
          tables={tables} 
          relationships={relationships} 
          onMoveNode={handleMoveNode} 
          onRemoveNode={handleRemoveNode} 
          onConnect={handleConnect}
          onRelationshipClick={handleRelationshipClick}
          isInteractive={true} 
        />
        {nodes.length === 0 && ( 
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none"> 
            <div className="bg-white/90 p-5 rounded-xl border border-slate-300 text-slate-600 text-sm shadow-md text-center max-w-sm"> 
              <p className="font-bold text-slate-800 text-base mb-1">Visueller Query Designer</p> 
              <p className="text-xs text-slate-500 mb-2">Ziehen Sie Tabellen aus der linken Navigationsleiste hierher. Verbinden Sie Felder per Drag-and-Drop, um JOINs (INNER, LEFT, RIGHT, CROSS) zu erstellen.</p> 
            </div> 
          </div> 
        )}
      </div>
      
      {/* Query Grid & Split-Screen Terminal / Live Preview */}
      <div className="h-80 flex flex-col bg-white border-t border-slate-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
        <div className="flex-1 overflow-hidden flex flex-col" onDragOver={e => e.preventDefault()} onDrop={handleGridDrop}>
           <QueryGrid 
             columns={queryColumns} 
             tables={tables} 
             forms={forms}
             queries={queries}
             onUpdateColumns={setQueryColumns} 
             showTotals={showTotals}
             showCrosstab={showCrosstab || Boolean(selectQuery.crosstabConfig)}
           />
        </div>
        
        {/* Terminal / Live Preview Tabs & Pane */}
        <div id="query-sql-terminal-pane" className="flex flex-col bg-slate-950 border-t border-slate-800 shrink-0 h-36">
          {/* Bottom Tabs */}
          <div className="flex items-center justify-between bg-slate-900 border-b border-slate-800 px-2 py-0.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBottomPaneTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-t transition-colors ${
                  bottomPaneTab === 'preview'
                    ? 'bg-slate-950 text-emerald-400 border-t-2 border-emerald-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>Live-Daten-Vorschau (Top 25)</span>
              </button>

              <button
                type="button"
                onClick={() => setBottomPaneTab('sql')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-t transition-colors ${
                  bottomPaneTab === 'sql'
                    ? 'bg-slate-950 text-blue-400 border-t-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Terminal size={12} className="text-blue-400" />
                <span>SQL-Terminal</span>
              </button>

              <button
                type="button"
                onClick={() => setBottomPaneTab('dialect')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-t transition-colors ${
                  bottomPaneTab === 'dialect'
                    ? 'bg-slate-950 text-indigo-400 border-t-2 border-indigo-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Code size={12} className="text-indigo-400" />
                <span>Dialekt ({selectedDialect})</span>
              </button>
            </div>

            {bottomPaneTab === 'dialect' && (
              <div className="flex items-center gap-1">
                {(['SQLITE', 'POSTGRESQL', 'MYSQL', 'MSSQL', 'ORACLE'] as SupportedSqlDialect[]).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDialect(d)}
                    className={`px-1.5 py-0.5 text-[10px] rounded font-bold transition-colors ${
                      selectedDialect === d
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pane Content */}
          <div className="flex-1 overflow-hidden relative">
            {bottomPaneTab === 'preview' && (
              <LiveQueryDataPreview
                selectQuery={selectQuery}
                tables={tables}
                relationships={relationships}
                generatedSql={overrideSql || generatedSql}
              />
            )}

            {bottomPaneTab === 'sql' && (
              <div className="h-full flex flex-col">
                {overrideSql && (
                  <div className="bg-amber-500/10 border-b border-amber-500/30 px-3 py-1 flex justify-between items-center text-[10px] text-amber-400">
                    <span className="flex items-center gap-1 font-bold">
                      <Terminal size={11} />
                      ⚠️ Manuelles SQL aktiv. Der interaktive Grid-Designer ist pausiert.
                    </span>
                    <button 
                      onClick={() => setOverrideSql('')}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-2 py-0.5 rounded font-extrabold"
                    >
                      Designer reaktivieren
                    </button>
                  </div>
                )}
                <div className="p-2.5 text-white font-mono text-xs overflow-auto flex-1">
                  <pre className="text-emerald-400 font-mono leading-relaxed">{overrideSql || generatedSql}</pre>
                </div>
              </div>
            )}

            {bottomPaneTab === 'dialect' && (
              <div className="p-2.5 text-white font-mono text-xs overflow-auto h-full">
                <pre className="text-indigo-300 font-mono leading-relaxed">
                  {generateMultiDialectSql(selectQuery, tables, relationships, selectedDialect)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
