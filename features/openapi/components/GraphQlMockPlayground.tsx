import React, { useState, useMemo } from 'react';
import { Table } from '../../../types/index';
import { Play, Copy, Check, Sparkles, Database, Layers, RefreshCw } from 'lucide-react';

interface GraphQlMockPlaygroundProps {
  tables: Table[];
  updateTable: (table: Table) => void;
}

export const GraphQlMockPlayground: React.FC<GraphQlMockPlaygroundProps> = ({ tables, updateTable }) => {
  const [selectedTableId, setSelectedTableId] = useState<string>(tables[0]?.id || '');
  const [copied, setCopied] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const currentTable = tables.find((t) => t.id === selectedTableId) || tables[0];
  const tableName = currentTable?.name || 'entities';
  const fields = currentTable?.fields || [];

  // Default query template
  const defaultQuery = useMemo(() => {
    if (!currentTable) return '{\n  __typename\n}';
    const fieldList = fields.slice(0, 5).map((f) => `    ${f.name}`).join('\n');
    return `query Get${tableName}List {\n  all_${tableName.toLowerCase()}(limit: 10) {\n    totalCount\n    items {\n${fieldList}\n    }\n  }\n}`;
  }, [currentTable, tableName, fields]);

  const [queryText, setQueryText] = useState(defaultQuery);
  const [variablesText, setVariablesText] = useState('{\n  "limit": 10\n}');
  const [responseOutput, setResponseOutput] = useState<string>('{\n  "data": null\n}');

  // Update query when table changes
  React.useEffect(() => {
    setQueryText(defaultQuery);
  }, [defaultQuery]);

  // Execute in-browser GraphQL simulation
  const handleExecuteQuery = () => {
    const start = performance.now();
    try {
      let vars: any = {};
      try {
        vars = JSON.parse(variablesText || '{}');
      } catch (e) {
        // ignore
      }

      // Very simple parsing of query to extract requested table and fields
      const isAllQuery = queryText.includes(`all_${tableName.toLowerCase()}`);
      const isSingleQuery = queryText.includes(`${tableName.toLowerCase()}(`);
      const isCreateMutation = queryText.includes(`create_${tableName.toLowerCase()}`);

      let resultData: any = {};

      if (isCreateMutation) {
        const newId = (currentTable.data?.length || 0) + 1;
        const newRecord: Record<string, any> = {
          id: newId,
          ...(vars.input || {}),
        };
        const updatedData = [...(currentTable.data || []), newRecord];
        updateTable({ ...currentTable, data: updatedData });
        resultData = {
          [`create_${tableName.toLowerCase()}`]: {
            success: true,
            record: newRecord,
          },
        };
      } else if (isSingleQuery) {
        const idMatch = queryText.match(/id:\s*([0-9]+|"[^"]+")/);
        const targetId = idMatch ? idMatch[1].replace(/"/g, '') : '1';
        const found = (currentTable.data || []).find((r) => String(r.id || r.ID || '') === String(targetId));
        resultData = {
          [tableName.toLowerCase()]: found || null,
        };
      } else {
        // List query
        const limit = vars.limit || 20;
        const rows = (currentTable.data || []).slice(0, limit);
        resultData = {
          [`all_${tableName.toLowerCase()}`]: {
            totalCount: currentTable.data?.length || 0,
            items: rows,
          },
        };
      }

      const elapsed = Math.round(performance.now() - start);
      setExecutionTime(elapsed);
      setResponseOutput(JSON.stringify({ data: resultData }, null, 2));
    } catch (err: any) {
      setExecutionTime(Math.round(performance.now() - start));
      setResponseOutput(JSON.stringify({ errors: [{ message: err.message }] }, null, 2));
    }
  };

  const handleCopySchema = () => {
    // Generate SDL Schema
    const sdl = tables
      .map((t) => {
        const fList = (t.fields || [])
          .map((f) => {
            const gqlType =
              f.type === 'INTEGER'
                ? 'Int'
                : f.type === 'DECIMAL' || f.type === 'CURRENCY'
                ? 'Float'
                : f.type === 'BOOLEAN'
                ? 'Boolean'
                : 'String';
            return `  ${f.name}: ${gqlType}${f.isPrimaryKey ? '!' : ''}`;
          })
          .join('\n');
        return `type ${t.name} {\n${fList}\n}\n\ntype ${t.name}Connection {\n  totalCount: Int!\n  items: [${t.name}!]!\n}`;
      })
      .join('\n\n');

    const fullSchema = `# Auto-generated GraphQL Schema for DB Studio Pro\n\n${sdl}\n\ntype Query {\n${tables
      .map((t) => `  all_${t.name.toLowerCase()}(limit: Int, offset: Int): ${t.name}Connection!\n  ${t.name.toLowerCase()}(id: ID!): ${t.name}`)
      .join('\n')}\n}\n\ntype Mutation {\n${tables
      .map((t) => `  create_${t.name.toLowerCase()}(input: ${t.name}Input!): ${t.name}Payload!\n  delete_${t.name.toLowerCase()}(id: ID!): Boolean!`)
      .join('\n')}\n}`;

    navigator.clipboard.writeText(fullSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-mono text-xs">
      {/* Top Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 p-2.5 px-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-fuchsia-400 font-bold">
            <Sparkles size={16} />
            <span>GraphQL Schema &amp; Playground</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
            <Database size={12} className="text-slate-400" />
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="bg-transparent text-slate-200 border-none outline-hidden text-xs font-semibold"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                  {t.name} ({t.data?.length || 0} Datensätze)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {executionTime !== null && (
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              ⚡ {executionTime} ms
            </span>
          )}

          <button
            onClick={handleCopySchema}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Kopiert!' : 'SDL Schema kopieren'}</span>
          </button>

          <button
            onClick={handleExecuteQuery}
            className="px-3.5 py-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors text-xs shadow-2xs"
          >
            <Play size={12} />
            <span>Query Ausführen</span>
          </button>
        </div>
      </div>

      {/* Editor & Response Columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Left: Query & Variables Editor */}
        <div className="flex flex-col border-r border-slate-800 bg-slate-950">
          <div className="bg-slate-900/80 px-3 py-1.5 border-b border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>GraphQL Query / Mutation</span>
            <span className="text-fuchsia-400">Endpoint: /api/graphql</span>
          </div>
          <textarea
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            className="flex-1 p-3 bg-slate-950 text-fuchsia-300 font-mono text-xs resize-none outline-hidden border-none"
            spellCheck={false}
          />

          {/* Variables panel */}
          <div className="border-t border-slate-800 h-28 flex flex-col bg-slate-900/40">
            <div className="bg-slate-900 px-3 py-1 border-b border-slate-800 text-[10px] text-slate-400 font-semibold uppercase">
              Variables (JSON)
            </div>
            <textarea
              value={variablesText}
              onChange={(e) => setVariablesText(e.target.value)}
              className="flex-1 p-2 bg-slate-950 text-amber-300 font-mono text-xs resize-none outline-hidden border-none"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right: Response Viewer */}
        <div className="flex flex-col bg-slate-950">
          <div className="bg-slate-900/80 px-3 py-1.5 border-b border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Server Response (JSON)</span>
            <span className="text-emerald-400">HTTP 200 OK</span>
          </div>
          <textarea
            readOnly
            value={responseOutput}
            className="flex-1 p-3 bg-slate-950 text-emerald-400 font-mono text-xs resize-none outline-hidden border-none"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
