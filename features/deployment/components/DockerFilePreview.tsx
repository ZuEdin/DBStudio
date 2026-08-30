import React, { useState } from 'react';
import { GeneratedDeploymentFile } from '../types';
import { FileText, Copy, Check, Terminal, Database, Shield, Code, Download } from 'lucide-react';

interface DockerFilePreviewProps {
  files: GeneratedDeploymentFile[];
  onDownloadZip: () => void;
}

export const DockerFilePreview: React.FC<DockerFilePreviewProps> = ({ files, onDownloadZip }) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeFile = files[selectedFileIndex] || files[0];

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'compose': return <Terminal size={14} className="text-cyan-400" />;
      case 'dockerfile': return <Code size={14} className="text-indigo-400" />;
      case 'database': return <Database size={14} className="text-emerald-400" />;
      case 'config': return <Shield size={14} className="text-amber-400" />;
      default: return <FileText size={14} className="text-slate-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[440px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
      {/* File Tree List */}
      <div className="border-r border-slate-800 p-3 flex flex-col justify-between bg-slate-900/60 overflow-y-auto">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2">
            Generierte Manifeste ({files.length})
          </div>
          <div className="space-y-1">
            {files.map((file, idx) => (
              <button
                key={file.path}
                onClick={() => setSelectedFileIndex(idx)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                  selectedFileIndex === idx
                    ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {getFileIcon(file.category)}
                <div className="truncate flex-1">
                  <span className="block truncate font-mono">{file.name}</span>
                  <span className="text-[10px] text-slate-500 truncate block">{file.path}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800">
          <button
            onClick={onDownloadZip}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
          >
            <Download size={14} />
            Alles als .ZIP herunterladen
          </button>
        </div>
      </div>

      {/* Code Preview & Header */}
      <div className="md:col-span-2 flex flex-col h-full bg-slate-950">
        {activeFile && (
          <>
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-200 font-medium">{activeFile.path}</span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">({activeFile.description})</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copied ? 'Kopiert!' : 'Kopieren'}
              </button>
            </div>
            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-300 leading-relaxed select-text">
              <pre className="whitespace-pre-wrap">{activeFile.content}</pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
