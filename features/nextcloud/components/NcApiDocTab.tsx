import React, { useState } from 'react';
import { VirtualFile } from '../../../types/index';
import { Copy, Check, FileText, Download } from 'lucide-react';

interface NcApiDocTabProps {
  files: VirtualFile[];
}

export const NcApiDocTab: React.FC<NcApiDocTabProps> = ({ files }) => {
  const [copied, setCopied] = useState(false);
  const mdFile = files.find(f => f.path === 'NEXTCLOUD_API.md') || files[0];

  const handleCopy = () => {
    if (mdFile) {
      navigator.clipboard.writeText(mdFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMd = () => {
    if (!mdFile) return;
    const blob = new Blob([mdFile.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NEXTCLOUD_API.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-blue-600" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            NEXTCLOUD_API.md (Vollständige Markdown API-Spezifikation)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 transition"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            {copied ? 'Kopiert!' : 'Markdown kopieren'}
          </button>
          <button
            onClick={handleDownloadMd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            <Download size={14} />
            MD herunterladen
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs leading-relaxed border border-slate-800 whitespace-pre-wrap max-h-[500px]">
        {mdFile?.content || 'Keine Dokumentation verfügbar.'}
      </div>
    </div>
  );
};
