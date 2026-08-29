import React, { useState } from 'react';
import { Table } from '../../../types';
import { DATA_TYPES } from '../../../config/dataTypes';
import { Copy, Check, Terminal } from 'lucide-react';

interface TableDdlViewerProps {
  table: Table;
  dbType?: 'PostgreSQL' | 'MySQL' | 'SQLite' | 'SQL Server';
}

export const TableDdlViewer: React.FC<TableDdlViewerProps> = ({
  table,
  dbType = 'PostgreSQL',
}) => {
  const [selectedDb, setSelectedDb] = useState<'PostgreSQL' | 'MySQL' | 'SQLite' | 'SQL Server'>(dbType);
  const [copied, setCopied] = useState(false);

  const generateSql = (): string => {
    const lines: string[] = [];
    lines.push(`-- DDL Schema Generator für ${table.name}`);
    lines.push(`-- Dialekt: ${selectedDb}\n`);
    lines.push(`CREATE TABLE "${table.name}" (`);

    const fieldLines: string[] = [];

    for (const field of table.fields) {
      if (field.isCalculated && field.calculationFormula) {
        const storedStr = field.isStored ? 'STORED' : 'VIRTUAL';
        const typeStr = DATA_TYPES[field.type]?.mappings?.sql?.type({ dbType: selectedDb, length: field.length, precision: field.precision, scale: field.scale }) || 'DECIMAL(18, 2)';
        fieldLines.push(`  "${field.name}" ${typeStr} GENERATED ALWAYS AS (${field.calculationFormula.replace(/\[/g, '"').replace(/\]/g, '"')}) ${storedStr}`);
        continue;
      }

      const typeConfig = DATA_TYPES[field.type];
      let sqlDataType = 'VARCHAR(255)';

      if (typeConfig?.mappings?.sql) {
        sqlDataType = typeConfig.mappings.sql.type({
          dbType: selectedDb,
          length: field.length,
          precision: field.precision,
          scale: field.scale,
          enumValues: field.enumValues,
        });
      }

      let line = `  "${field.name}" ${sqlDataType}`;

      if (field.isPrimaryKey) {
        line += ' PRIMARY KEY';
      }

      if (field.allowNull === false && !field.isPrimaryKey) {
        line += ' NOT NULL';
      }

      if (field.defaultValue) {
        line += ` DEFAULT ${field.defaultValue}`;
      }

      if (field.isUnique && !field.isPrimaryKey) {
        line += ' UNIQUE';
      }

      fieldLines.push(line);
    }

    lines.push(fieldLines.join(',\n'));
    lines.push(');');

    return lines.join('\n');
  };

  const sqlCode = generateSql();

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-slate-900 text-slate-100 shadow-md">
      {/* Header */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <Terminal size={14} className="text-emerald-400" />
          <span>DDL Schema Generator</span>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDb}
            onChange={(e) => setSelectedDb(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500"
          >
            <option value="PostgreSQL">PostgreSQL (Standard)</option>
            <option value="MySQL">MySQL / MariaDB</option>
            <option value="SQLite">SQLite 3</option>
            <option value="SQL Server">Microsoft SQL Server</option>
          </select>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-2xs transition-colors"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Kopiert!' : 'SQL kopieren'}
          </button>
        </div>
      </div>

      {/* Code Area */}
      <pre className="p-4 text-xs font-mono text-emerald-300 overflow-auto max-h-96 leading-relaxed bg-slate-900">
        {sqlCode}
      </pre>
    </div>
  );
};
