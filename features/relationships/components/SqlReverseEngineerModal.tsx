import React, { useState } from 'react';
import { Table, Relationship } from '../../../types/index';
import { SqlDdlReverseEngineerService } from '../services/sqlDdlReverseEngineer';
import { 
  Database, 
  UploadCloud, 
  FileText, 
  Check, 
  AlertCircle, 
  X, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface SqlReverseEngineerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (tables: Table[], relationships: Relationship[]) => void;
}

export const SqlReverseEngineerModal: React.FC<SqlReverseEngineerModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [sqlText, setSqlText] = useState<string>('');
  const [dialect, setDialect] = useState<'generic' | 'postgres' | 'mysql' | 'sqlite'>('generic');
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [previewResult, setPreviewResult] = useState<{
    tables: Table[];
    relationships: Relationship[];
  } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setSqlText(text);
        runParse(text);
      };
      reader.readAsText(file);
    }
  };

  const runParse = (content: string) => {
    const { tables, relationships, errors } = SqlDdlReverseEngineerService.parseSqlDdl(content);
    if (errors.length > 0) {
      setErrorMessages(errors);
      setPreviewResult(null);
    } else {
      setErrorMessages([]);
      setPreviewResult({ tables, relationships });
    }
  };

  const handleApply = () => {
    if (!previewResult || previewResult.tables.length === 0) {
      runParse(sqlText);
      return;
    }
    onImport(previewResult.tables, previewResult.relationships);
    onClose();
  };

  const sampleSql = `-- PostgreSQL / MySQL Beispiel-Schema
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(30) DEFAULT 'OFFEN',
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT DEFAULT 1,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-3xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">SQL DDL Reverse Engineering</h2>
              <p className="text-xs text-neutral-500">Erstellen Sie ein vollständiges ER-Diagramm direkt aus SQL CREATE TABLE Skripten</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">SQL Dialekt:</label>
              <select
                value={dialect}
                onChange={(e: any) => setDialect(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              >
                <option value="generic">Universal / ANSI SQL</option>
                <option value="postgres">PostgreSQL</option>
                <option value="mysql">MySQL / MariaDB</option>
                <option value="sqlite">SQLite</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSqlText(sampleSql);
                  runParse(sampleSql);
                }}
                className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
              >
                Beispiel-DDL einfügen
              </button>

              <label className="px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer flex items-center gap-1 transition-colors">
                <UploadCloud size={13} />
                <span>.sql Datei wählen</span>
                <input type="file" accept=".sql,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* SQL Input Area */}
          <div className="rounded-xl border border-neutral-300 dark:border-neutral-700 overflow-hidden bg-[#1e1e1e]">
            <textarea
              value={sqlText}
              onChange={(e) => {
                setSqlText(e.target.value);
                runParse(e.target.value);
              }}
              placeholder="Fügen Sie hier Ihr SQL-Skript (CREATE TABLE, FOREIGN KEY, etc.) ein..."
              className="w-full h-48 bg-transparent text-emerald-400 font-mono text-xs p-3 resize-none focus:outline-none leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Errors */}
          {errorMessages.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle size={14} />
                <span>Fehler beim Parsen:</span>
              </div>
              {errorMessages.map((msg, i) => (
                <div key={i} className="pl-5 text-[11px] font-mono">{msg}</div>
              ))}
            </div>
          )}

          {/* Live Preview Summary */}
          {previewResult && previewResult.tables.length > 0 && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <Check size={16} />
                  <span>Erfolgreich erkannt: {previewResult.tables.length} Tabellen, {previewResult.relationships.length} Fremdschlüssel-Relationen</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {previewResult.tables.map(t => (
                  <span key={t.id} className="px-2 py-0.5 rounded bg-white dark:bg-neutral-800 text-[11px] font-mono text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                    {t.name} ({t.fields.length} Spalten)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleApply}
            disabled={!previewResult || previewResult.tables.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Sparkles size={14} />
            In Diagramm importieren
          </button>
        </div>
      </div>
    </div>
  );
};
