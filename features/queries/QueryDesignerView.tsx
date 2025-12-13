

import React, { useState, useEffect } from 'react';
import { Canvas } from '../../components/Canvas';
import { QueryGrid } from './components/QueryGrid';
import { TableNode, Table, Relationship, Query, QueryColumn, SelectQuery, DbType } from '../../types/index';
import { Calculator, Sigma } from 'lucide-react';
import { generateSqlSelect } from '../../utils/sqlHelper';

interface QueryDesignerViewProps {
  query: Query;
  onQueryChange: (query: Query) => void;
  tables: Table[];
  relationships: Relationship[];
  dbType: DbType;
}

export const QueryDesignerView: React.FC<QueryDesignerViewProps> = ({
  query,
  onQueryChange,
  tables,
  relationships,
  dbType,
}) => {
  if (query.type !== 'SELECT') {
    return <div className="p-4">Dieser Abfragetyp kann nicht im Designer bearbeitet werden.</div>;
  }
  
  const [showTotals, setShowTotals] = useState(query.columns.some(c => c.aggregate));
  const [generatedSql, setGeneratedSql] = useState('');
  const { nodes, columns: queryColumns } = query;
  
  useEffect(() => {
    if (queryColumns.length === 0 || nodes.length === 0) {
      setGeneratedSql('Ziehen Sie Felder in den Grid, um eine Abfrage zu erstellen.');
    } else {
      const sql = generateSqlSelect(nodes, queryColumns, tables, relationships, dbType);
      setGeneratedSql(sql + ';');
    }
  }, [query, relationships, tables, dbType]);

  const setNodes = (nodes: TableNode[]) => {
    onQueryChange({ ...query, nodes });
  }

  const setQueryColumns = (columns: QueryColumn[]) => {
    onQueryChange({ ...query, columns });
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
    <div className="w-full h-full flex flex-col">
      <div className="bg-slate-100 border-b border-slate-300 p-1 flex gap-2">
         <button onClick={toggleTotals} className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${showTotals ? 'bg-slate-300 border-slate-400' : 'bg-white border-slate-300 hover:bg-slate-50'}`}>
            <Sigma size={14}/> {showTotals ? 'Funktionen aus' : 'Funktionen (Gruppieren)'}
         </button>
         <button onClick={addCalculatedColumn} className="flex items-center gap-1 px-2 py-1 rounded text-xs border bg-white border-slate-300 hover:bg-slate-50">
            <Calculator size={14}/> Berechnetes Feld
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
             onUpdateColumns={setQueryColumns} 
             showTotals={showTotals}
           />
        </div>
        <div className="bg-slate-800 p-2 text-white font-mono text-xs overflow-auto h-24 border-t border-slate-400"><pre>{generatedSql}</pre></div>
      </div>
    </div>
  );
};
