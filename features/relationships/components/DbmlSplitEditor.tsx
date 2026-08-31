import React, { useState, useEffect } from 'react';
import { Table, Relationship, TableGroup } from '../../../types/index';
import { DbmlTranspilerService } from '../services/dbmlTranspiler';
import { 
  Code, 
  Check, 
  Copy, 
  ArrowLeftRight, 
  AlertCircle, 
  X, 
  Download, 
  RefreshCw, 
  Sparkles 
} from 'lucide-react';

interface DbmlSplitEditorProps {
  tables: Table[];
  relationships: Relationship[];
  tableGroups?: TableGroup[];
  isOpen: boolean;
  onClose: () => void;
  onApplySchema: (tables: Table[], relationships: Relationship[]) => void;
}

export const DbmlSplitEditor: React.FC<DbmlSplitEditorProps> = ({
  tables,
  relationships,
  tableGroups,
  isOpen,
  onClose,
  onApplySchema,
}) => {
  const [dbmlCode, setDbmlCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  // Sync DBML from current canvas state whenever opened or tables change
  useEffect(() => {
    if (isOpen) {
      const code = DbmlTranspilerService.tablesToDbml(tables, relationships, tableGroups);
      setDbmlCode(code);
      setParseErrors([]);
    }
  }, [isOpen, tables, relationships, tableGroups]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(dbmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([dbmlCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema_${new Date().toISOString().split('T')[0]}.dbml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApply = () => {
    const { tables: parsedTables, relationships: parsedRels, errors } = DbmlTranspilerService.parseDbmlToSchema(dbmlCode);
    if (errors.length > 0) {
      setParseErrors(errors);
      return;
    }

    if (parsedTables.length === 0) {
      setParseErrors(['Keine Tabellendefinitionen im DBML Code gefunden.']);
      return;
    }

    setParseErrors([]);
    onApplySchema(parsedTables, parsedRels);
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-y-0 left-0 w-full max-w-xl bg-white dark:bg-neutral-900 shadow-2xl border-r border-neutral-200 dark:border-neutral-800 z-50 flex flex-col animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-600 rounded-lg">
            <Code size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">DBML Live-Code Editor</h2>
            <p className="text-xs text-neutral-500">2-Wege-Synchronisation zwischen Code & Canvas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800"
            title="In Zwischenablage kopieren"
          >
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800"
            title=".dbml Datei herunterladen"
          >
            <Download size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-3 flex flex-col bg-[#1e1e1e] overflow-hidden">
        <textarea
          value={dbmlCode}
          onChange={(e) => setDbmlCode(e.target.value)}
          placeholder="// Schreiben oder kopieren Sie hier DBML Code hinein..."
          className="flex-1 w-full bg-transparent text-emerald-400 font-mono text-xs p-2 resize-none focus:outline-none leading-relaxed selection:bg-indigo-600 selection:text-white"
          spellCheck={false}
        />
      </div>

      {/* Errors display */}
      {parseErrors.length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border-t border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle size={14} />
            <span>Syntaxfehler beim Parsen:</span>
          </div>
          {parseErrors.map((err, idx) => (
            <div key={idx} className="pl-5 text-[11px] font-mono">{err}</div>
          ))}
        </div>
      )}

      {/* Footer Bar */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between">
        <span className="text-[11px] text-neutral-500">
          Unterstützt Tabellen, Relationen (`Ref: child.id &gt; parent.id`) und Notizen
        </span>
        <div className="flex items-center gap-2">
          {appliedSuccess && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <Check size={14} />
              Canvas aktualisiert!
            </span>
          )}
          <button
            onClick={handleApply}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
          >
            <ArrowLeftRight size={13} />
            Auf Canvas anwenden
          </button>
        </div>
      </div>
    </div>
  );
};
