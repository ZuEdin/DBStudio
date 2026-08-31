import React, { useState } from 'react';
import { Table, Relationship, TableGroup } from '../../../types/index';
import { SchemaDocumentationService } from '../services/schemaDocumentationService';
import { 
  BookOpen, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Code, 
  Layers, 
  X, 
  Printer 
} from 'lucide-react';

interface DataDictionaryModalProps {
  tables: Table[];
  relationships: Relationship[];
  tableGroups?: TableGroup[];
  isOpen: boolean;
  onClose: () => void;
}

export const DataDictionaryModal: React.FC<DataDictionaryModalProps> = ({
  tables,
  relationships,
  tableGroups,
  isOpen,
  onClose,
}) => {
  const [activeFormat, setActiveFormat] = useState<'markdown' | 'prisma' | 'typespec'>('markdown');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const markdownDoc = SchemaDocumentationService.generateMarkdownDictionary(tables, relationships, tableGroups);
  const prismaDoc = SchemaDocumentationService.generatePrismaSchema(tables, relationships);
  const typeSpecDoc = SchemaDocumentationService.generateTypeSpec(tables);

  const currentContent = activeFormat === 'markdown' ? markdownDoc : (activeFormat === 'prisma' ? prismaDoc : typeSpecDoc);
  const currentExtension = activeFormat === 'markdown' ? 'md' : (activeFormat === 'prisma' ? 'prisma' : 'tsp');

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema_documentation.${currentExtension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Datenbank Data Dictionary</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; }
            h1 { font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
            h3 { font-size: 16px; margin-top: 24px; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
          </style>
        </head>
        <body>
          <pre style="white-space: pre-wrap; font-family: monospace; font-size: 11px;">${markdownDoc}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Data-Dictionary & Dokumentation</h2>
              <p className="text-xs text-neutral-500">Automatisches Schema-Handbuch, Prisma ORM Models & TypeSpec Definitionen</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 px-3 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveFormat('markdown')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeFormat === 'markdown'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <FileText size={14} />
            Markdown Data-Dictionary
          </button>
          <button
            onClick={() => setActiveFormat('prisma')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeFormat === 'prisma'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Layers size={14} />
            Prisma Schema (.prisma)
          </button>
          <button
            onClick={() => setActiveFormat('typespec')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeFormat === 'typespec'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Code size={14} />
            TypeSpec REST / API Schema
          </button>
        </div>

        {/* Editor / Preview Area */}
        <div className="flex-1 p-3 flex flex-col bg-[#1e1e1e] overflow-hidden">
          <div className="flex items-center justify-end gap-2 pb-2">
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center gap-1.5 transition-colors"
            >
              <Printer size={13} />
              <span>Drucken</span>
            </button>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>Kopieren</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center gap-1.5 transition-colors"
            >
              <Download size={13} />
              <span>Herunterladen</span>
            </button>
          </div>

          <textarea
            readOnly
            value={currentContent}
            className="flex-1 w-full bg-transparent text-emerald-400 font-mono text-xs p-2 resize-none focus:outline-none leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            Exportiert alle Tabellen, Typen, Constraints, Relationen und Feld-Kommentare
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-200 dark:hover:bg-white text-white dark:text-neutral-900 text-xs font-semibold rounded-lg transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
