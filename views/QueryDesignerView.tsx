
import React, { useState, useEffect } from 'react';
import { Canvas } from '../components/Canvas';
// FIX: Added DbType to import to be used in props and passed to generateSqlSelect.
import { TableNode, Table, Relationship, Query, QueryColumn, SelectQuery, DbType } from '../types/index';
import { generateSqlSelect } from '../utils/sqlHelper';

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
  
  const [generatedSql, setGeneratedSql] = useState('');
  const { nodes, columns: queryColumns } = query;

  // FIX: Pass dbType to generateSqlSelect and add it to the dependency array.
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
  
  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
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
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
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

  const updateColumn = (id: string, updates: Partial<QueryColumn>) => {
    setQueryColumns(queryColumns.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleCriteriaChange = (columnId: string, criteriaIndex: number, value: string) => {
    const newColumns = queryColumns.map(col => {
      if (col.id === columnId) {
        const newCriteria = [...col.criteria];
        newCriteria[criteriaIndex] = value;
        if (criteriaIndex === col.criteria.length - 1 && value.trim() !== '') {
          newCriteria.push('');
        }
        return { ...col, criteria: newCriteria };
      }
      return col;
    });
    setQueryColumns(newColumns);
  };
  
  const maxCriteriaRows = Math.max(1, ...queryColumns.map(c => c.criteria.length));

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 relative" onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnCanvas}>
        <Canvas nodes={nodes} tables={tables} relationships={relationships} onMoveNode={handleMoveNode} onRemoveNode={handleRemoveNode} isInteractive={true} />
        {nodes.length === 0 && ( <div className="absolute inset-0 flex items-center justify-center pointer-events-none"> <div className="bg-white/80 p-4 rounded border border-slate-300 text-slate-500 text-sm shadow-sm text-center"> <p className="font-bold">Abfrage-Entwurf</p> <p>Ziehen Sie Tabellen aus der linken Leiste hierher.</p> </div> </div> )}
      </div>
      <div className="h-64 flex flex-col bg-white border-t border-slate-300">
        <div className="flex-1 p-2 overflow-auto" onDragOver={e => e.preventDefault()} onDrop={handleGridDrop}>
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr className="bg-slate-100"><th className="border border-slate-300 p-1 font-semibold text-left w-24">Feld:</th>{queryColumns.map(col => <td key={col.id} className="border border-slate-300 p-1 font-mono">{col.fieldName}</td>)}</tr>
              <tr><th className="border border-slate-300 p-1 font-semibold text-left bg-slate-100">Tabelle:</th>{queryColumns.map(col => <td key={col.id} className="border border-slate-300 p-1 font-mono">{col.tableName}</td>)}</tr>
              <tr><th className="border border-slate-300 p-1 font-semibold text-left bg-slate-100">Sortierung:</th>{queryColumns.map(col => (<td key={col.id} className="border border-slate-300 p-0"><input type="text" className="w-full h-full p-1 border-none bg-transparent" value={col.sort} onChange={e => updateColumn(col.id, { sort: e.target.value as any })} /></td>))}</tr>
              <tr><th className="border border-slate-300 p-1 font-semibold text-left bg-slate-100">Anzeigen:</th>{queryColumns.map(col => (<td key={col.id} className="border border-slate-300 p-1 text-center"><input type="checkbox" checked={col.show} onChange={e => updateColumn(col.id, { show: e.target.checked })}/></td>))}</tr>
              {Array.from({ length: maxCriteriaRows }).map((_, rowIndex) => (<tr key={rowIndex}><th className="border border-slate-300 p-1 font-semibold text-left bg-slate-100">{rowIndex === 0 ? 'Kriterien:' : 'oder:'}</th>{queryColumns.map((col) => (<td key={col.id} className="border border-slate-300 p-0"><input type="text" className="w-full h-full p-1 border-none bg-transparent" value={col.criteria[rowIndex] ?? ''} onChange={e => handleCriteriaChange(col.id, rowIndex, e.target.value)}/></td>))}</tr>))}
            </tbody>
          </table>
          {queryColumns.length === 0 && (<div className="text-center text-slate-400 py-4 border border-dashed border-slate-300 mt-[-1px]">Ziehen Sie Felder aus den obigen Tabellen hierher.</div>)}
        </div>
        <div className="bg-slate-800 p-2 text-white font-mono text-xs overflow-auto h-24 border-t border-slate-400"><pre>{generatedSql}</pre></div>
      </div>
    </div>
  );
};
