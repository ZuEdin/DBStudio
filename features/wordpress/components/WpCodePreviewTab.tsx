import React, { useState } from 'react';
import { VirtualFile } from '../../../types/index';
import { FileCode, Folder, Copy, Check } from 'lucide-react';

interface WpCodePreviewTabProps {
  files: VirtualFile[];
}

export const WpCodePreviewTab: React.FC<WpCodePreviewTabProps> = ({ files }) => {
  const [selectedPath, setSelectedPath] = useState<string>(files[0]?.path || '');
  const [copied, setCopied] = useState<boolean>(false);

  const currentFile = files.find(f => f.path === selectedPath) || files[0];

  const handleCopy = () => {
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {files.length} Dateien im WordPress Plugin-Bundle generiert
        </div>
        {currentFile && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-700 dark:text-slate-200 transition-colors font-medium"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Code kopiert!' : 'Code kopieren'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-[420px]">
        {/* File Tree */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-850 p-2 overflow-y-auto">
          <div className="text-[11px] font-bold uppercase text-slate-400 mb-2 px-2">Plugin Struktur</div>
          <div className="space-y-1">
            {files.map(file => {
              const isSelected = file.path === (currentFile?.path || selectedPath);
              return (
                <div
                  key={file.path}
                  onClick={() => setSelectedPath(file.path)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs cursor-pointer truncate ${
                    isSelected
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                  <span className="truncate">{file.path}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Code Viewer */}
        <div className="md:col-span-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-900 text-slate-100 p-3 flex flex-col font-mono text-xs overflow-hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
            <span>{currentFile?.path || 'Keine Datei ausgewählt'}</span>
            <span className="uppercase">{currentFile?.language || 'txt'}</span>
          </div>
          <pre className="flex-1 overflow-auto whitespace-pre font-mono text-[11px] leading-relaxed text-slate-200">
            {currentFile?.content || '// Keine Vorschau verfügbar'}
          </pre>
        </div>
      </div>
    </div>
  );
};
