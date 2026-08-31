import React, { useState } from 'react';
import { VirtualFile } from '../../../types/index';
import { FileCode, Copy, Check, Folder } from 'lucide-react';

interface NcCodePreviewTabProps {
  files: VirtualFile[];
}

export const NcCodePreviewTab: React.FC<NcCodePreviewTabProps> = ({ files }) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedFile = files[selectedFileIndex] || files[0];

  const handleCopy = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-[520px] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
      {/* File Explorer Sidebar */}
      <div className="w-72 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Folder size={14} className="text-blue-600" /> Generierte Dateien
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
            {files.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {files.map((file, idx) => {
            const isSelected = idx === selectedFileIndex;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFileIndex(idx)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <FileCode size={13} className="shrink-0 opacity-80" />
                <span className="truncate">{file.path}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 text-slate-200">
        <div className="h-10 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-900">
          <div className="font-mono text-xs font-semibold text-slate-300 truncate">
            {selectedFile?.path}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? 'Kopiert' : 'Kopieren'}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre">
          {selectedFile?.content}
        </div>
      </div>
    </div>
  );
};
