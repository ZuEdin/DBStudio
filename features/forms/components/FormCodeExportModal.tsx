import React, { useState } from 'react';
import { X, Copy, Check, Code, FileText, Download } from 'lucide-react';
import { Form, Table } from '../../../types/index';
import { generateReactHookFormCode, generateAngularReactiveFormCode } from '../utils/formCodeGenerators';

interface FormCodeExportModalProps {
  form: Form;
  table?: Table;
  onClose: () => void;
}

export const FormCodeExportModal: React.FC<FormCodeExportModalProps> = ({
  form,
  table,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'react' | 'angular' | 'json'>('react');
  const [copied, setCopied] = useState(false);

  const reactCode = generateReactHookFormCode(form, table);
  const angularCode = generateAngularReactiveFormCode(form, table);
  const jsonSchema = JSON.stringify(form, null, 2);

  const currentCode = activeTab === 'react' ? reactCode : activeTab === 'angular' ? angularCode : jsonSchema;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${form.name.toLowerCase().replace(/\s+/g, '_')}_form.${activeTab === 'react' ? 'tsx' : activeTab === 'angular' ? 'ts' : 'json'}`;
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <Code className="text-blue-600 dark:text-blue-400" size={20} />
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Formular-Code Generator: {form.name}
              </h2>
              <p className="text-[11px] text-slate-500">
                Exportiere typsichere React- und Angular-Formularkomponenten mit Validierung.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 bg-slate-100 dark:bg-slate-900/50">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('react')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'react'
                  ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              ⚛️ React (Hook Form + Zod)
            </button>
            <button
              onClick={() => setActiveTab('angular')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'angular'
                  ? 'border-red-600 text-red-600 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              🅰️ Angular 18+ (Reactive Signals)
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'json'
                  ? 'border-amber-600 text-amber-600 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              📄 JSON Schema / Blueprint
            </button>
          </div>

          <div className="flex items-center gap-2 py-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs transition-colors"
            >
              <Download size={13} />
              <span>Herunterladen</span>
            </button>
          </div>
        </div>

        {/* Code View */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed select-text">
          <pre className="whitespace-pre">
            <code>{currentCode}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center text-xs text-slate-500">
          <span>Enterprise MFE Form Generator • Revisionssicher & DSGVO-konform</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
