import React, { useState } from 'react';
import { 
  Cloud, 
  Database, 
  Download, 
  Copy, 
  Check, 
  X, 
  FileCode, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Server
} from 'lucide-react';
import { SupabasePlugin } from './supabasePlugin';
import { PocketBasePlugin } from './pocketbasePlugin';
import { useProjectStore } from '../../../stores/useProjectStore';
import { CloudProviderExportResult } from '../../../types/cloudProvider';

interface BaaSExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BaaSExportModal: React.FC<BaaSExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const store = useProjectStore();
  const [selectedProvider, setSelectedProvider] = useState<'supabase' | 'pocketbase'>('supabase');
  const [selectedFileIdx, setSelectedFileIdx] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentProvider = selectedProvider === 'supabase' ? SupabasePlugin : PocketBasePlugin;
  const exportResult: CloudProviderExportResult = currentProvider.generateExport(
    store.tables,
    store.relationships
  );

  const activeFile = exportResult.files[selectedFileIdx] || exportResult.files[0];

  const handleCopy = () => {
    if (activeFile) {
      navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[86vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Cloud size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Entkoppelte BaaS Plug-in Architektur (Supabase &amp; PocketBase)
                </h2>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-bold">
                  Zero-Coupling
                </span>
              </div>
              <p className="text-xs text-slate-400">
                100% entkoppelte Schema-Exporte: Keine feste Cloud-Bindung im Kernsystem.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Provider Switcher */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedProvider('supabase');
                setSelectedFileIdx(0);
              }}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                selectedProvider === 'supabase'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Database size={15} />
              <span>Supabase (PostgreSQL &amp; RLS)</span>
            </button>

            <button
              onClick={() => {
                setSelectedProvider('pocketbase');
                setSelectedFileIdx(0);
              }}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                selectedProvider === 'pocketbase'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Server size={15} />
              <span>PocketBase (Self-Hosted SQLite)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Automatische RLS- &amp; Auth-Absicherung aktiv</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* File sidebar */}
          <div className="w-64 bg-slate-950/80 border-r border-slate-800 p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase text-slate-400">
                Generierte Dateien ({exportResult.files.length})
              </div>
              <div className="space-y-1.5">
                {exportResult.files.map((f, idx) => (
                  <button
                    key={f.fileName}
                    onClick={() => setSelectedFileIdx(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
                      selectedFileIdx === idx
                        ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode size={14} />
                      <span className="truncate">{f.fileName}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-slate-800 px-1 rounded">
                      {f.language}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {exportResult.notes && (
              <div className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div className="font-bold text-slate-300">Hinweise:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {exportResult.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Main Code View */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white">{activeFile?.fileName}</span>
                {activeFile?.description && (
                  <span className="text-xs text-slate-400 font-normal">
                    — {activeFile.description}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copied ? 'Kopiert' : 'Kopieren'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Download size={13} />
                  <span>Datei herunterladen</span>
                </button>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-auto">
              <pre className="font-mono text-xs text-cyan-300 leading-relaxed">
                {activeFile?.content}
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
