import React, { useEffect, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Database, Globe, Info, Zap, Lock, Sparkles, Sliders } from 'lucide-react';

export const ERTableNodeComponent = ({ id, data, selected }: any) => {
  const { table, relationships, nodes, tableGroups, onDoubleClick, onOpenConstraints } = data;
  const [activeCommentFieldId, setActiveCommentFieldId] = useState<string | null>(null);
  const { setNodes } = useReactFlow();

  // Ensure node is on top when a comment is active
  useEffect(() => {
    if (activeCommentFieldId) {
      setNodes((nds) => 
        nds.map((node) => {
          if (node.id === id) {
            return { ...node, zIndex: 1000 };
          }
          return node;
        })
      );
    } else {
      setNodes((nds) => 
        nds.map((node) => {
          if (node.id === id) {
            return { ...node, zIndex: undefined };
          }
          return node;
        })
      );
    }
  }, [activeCommentFieldId, id, setNodes]);

  // Find if this table belongs to any group
  const layoutNode = nodes?.find((n: any) => n.tableId === table.id);
  const group = tableGroups?.find((g: any) => g.id === layoutNode?.groupId);
  const groupColor = group?.color || '#6366f1';

  return (
    <div 
      style={{ borderColor: selected ? '#8b5cf6' : (group ? groupColor : undefined) }}
      className={`bg-white dark:bg-slate-900 rounded-xl shadow-xl border-2 transition-all duration-150 ${selected || activeCommentFieldId ? 'z-50' : 'z-0'} ${selected ? 'ring-4 ring-purple-500/25 scale-[1.02] shadow-2xl' : 'border-slate-300 dark:border-slate-800 hover:border-slate-400'} min-w-[250px] text-xs`}
    >
      {/* Node Header */}
      <div 
        className="bg-gradient-to-r from-slate-800 to-slate-950 text-white p-3 font-bold flex items-center justify-between cursor-pointer select-none rounded-t-[10px]"
        onDoubleClick={onDoubleClick}
        title="Doppelklick zum Bearbeiten im Tabellen-Designer"
      >
        <div className="flex items-center gap-2 min-w-0">
          {table.isApiImport ? (
            <Globe size={14} className="text-blue-400 shrink-0" />
          ) : (
            <Database size={14} className="text-emerald-400 shrink-0" />
          )}
          <span className="font-sans text-sm tracking-tight truncate">{table.name}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {group && (
            <span 
              style={{ backgroundColor: `${groupColor}25`, borderColor: `${groupColor}50`, color: groupColor }}
              className="text-[9px] border px-1 py-0.5 rounded font-medium max-w-[80px] truncate" 
              title={`Domäne: ${group.name}`}
            >
              📁 {group.name}
            </span>
          )}
          {onOpenConstraints && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenConstraints(table);
              }}
              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-amber-300 transition-colors"
              title="Indizes, Constraints & Composite PKs"
            >
              <Sliders size={12} />
            </button>
          )}
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/50 uppercase font-mono">
            {table.isApiImport ? 'api' : 'sql'}
          </span>
        </div>
      </div>

      {/* Fields List */}
      <div className="p-1.5 space-y-1 bg-slate-50 dark:bg-slate-950 rounded-b-[10px] nodrag">
        {table.fields.map((field: any) => {
          const isPrimaryKey = field.isPrimaryKey;
          const isForeignKey = relationships?.some(
            (r: any) => r.toTableId === table.id && r.toFieldId === field.id
          );
          const isIndexed = field.isIndexed;
          const isUnique = field.isUnique;
          const isCalculated = field.isCalculated;

          return (
            <div
              key={field.id}
              className={`relative h-8 px-2 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800 rounded-lg border transition-all select-none group cursor-pointer nodrag ${activeCommentFieldId === field.id ? 'bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-900 ring-1 ring-purple-100 dark:ring-purple-900/30' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
              onClick={() => {
                if (field.comment) {
                  setActiveCommentFieldId(activeCommentFieldId === field.id ? null : field.id);
                }
              }}
            >
              {/* Target Handle (Incoming Foreign Key connection) */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${table.id}__${field.id}__target`}
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#3b82f6',
                  width: 8,
                  height: 8,
                  border: '2px solid white',
                }}
                className="opacity-40 group-hover:opacity-100 transition-opacity"
              />

              {/* Field Label and Key Icons */}
              <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                {isPrimaryKey && <span className="text-yellow-500 font-bold" title="Primary Key">🔑</span>}
                {isForeignKey && <span className="text-cyan-500 text-[10px] font-extrabold tracking-wider" title="Foreign Key">FK</span>}
                {isIndexed && !isPrimaryKey && <span title="Indexiert (BTREE)" className="inline-flex items-center"><Zap size={11} className="text-amber-500 shrink-0" /></span>}
                {isUnique && !isPrimaryKey && <span title="UNIQUE Constraint" className="inline-flex items-center"><Lock size={10} className="text-emerald-500 shrink-0" /></span>}
                {isCalculated && <span className="text-purple-500 font-mono text-[10px] font-bold" title="Berechnete Spalte (Formula)">𝑓𝑥</span>}
                <span className={`truncate font-medium ${isPrimaryKey ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                  {field.name}
                </span>
              </div>

              {/* Field Type Indicator */}
              <div className="flex items-center gap-1.5 shrink-0">
                {field.comment && (
                  <Info 
                    size={10} 
                    className={`${activeCommentFieldId === field.id ? 'text-purple-500' : 'text-slate-400 opacity-0 group-hover:opacity-100'} transition-all`} 
                  />
                )}
                <div className="text-[9px] text-slate-400 font-mono uppercase bg-slate-200/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded">
                  {field.type}
                </div>
              </div>

              {/* Comment Popover */}
              {activeCommentFieldId === field.id && field.comment && (
                <div 
                  className="absolute left-full ml-4 top-0 z-[100] w-64 bg-slate-900 text-white p-3 rounded-lg shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 slide-in-from-left-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2 mb-1.5 text-purple-400 font-bold uppercase tracking-wider text-[10px]">
                    <Info size={12} />
                    <span>Feld-Information</span>
                  </div>
                  <div className="text-[11px] leading-relaxed text-slate-200 whitespace-pre-wrap">
                    {field.comment}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800 flex justify-end">
                    <button 
                      onClick={() => setActiveCommentFieldId(null)}
                      className="text-[9px] text-slate-500 hover:text-white transition-colors"
                    >
                      Schließen
                    </button>
                  </div>
                </div>
              )}

              {/* Source Handle (Outgoing connection) */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${table.id}__${field.id}__source`}
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#10b981',
                  width: 8,
                  height: 8,
                  border: '2px solid white',
                }}
                className="opacity-40 group-hover:opacity-100 transition-opacity"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
