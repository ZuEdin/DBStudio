import React, { useState } from 'react';
import { 
  Code2, 
  Layers, 
  Copy, 
  Check, 
  Download, 
  X, 
  Sparkles, 
  Cpu, 
  FileCode, 
  Database,
  Terminal,
  ArrowRight
} from 'lucide-react';
import { astPluginRegistry, ICodeGenPlugin, GeneratedPluginOutput } from './astPluginRegistry';
import { useProjectStore } from '../../stores/useProjectStore';
import { useDisclaimerStore } from '../../stores/useDisclaimerStore';

interface PluginGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PluginGeneratorModal: React.FC<PluginGeneratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const store = useProjectStore();
  const plugins = astPluginRegistry.getAllPlugins();
  const [selectedPluginId, setSelectedPluginId] = useState<string>(plugins[0]?.id || 'plugin_go_gorm');
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentPlugin = astPluginRegistry.getPlugin(selectedPluginId) || plugins[0];
  const generatedFiles: GeneratedPluginOutput[] = currentPlugin
    ? currentPlugin.generate(store.tables, store.relationships)
    : [];

  const activeFile = generatedFiles[selectedFileIndex] || generatedFiles[0];

  const handleCopy = () => {
    if (activeFile) {
      useDisclaimerStore.getState().requireConfirmation(`Plugin-Code Kopie (${activeFile.fileName})`, () => {
        navigator.clipboard.writeText(activeFile.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleDownloadFile = () => {
    if (!activeFile) return;
    useDisclaimerStore.getState().requireConfirmation(`Plugin-Datei Download (${activeFile.fileName})`, () => {
      const blob = new Blob([activeFile.code], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = activeFile.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Code2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  AST Code Generator Plugin Hub
                </h2>
                <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800 font-bold">
                  {plugins.length} Native Plugins
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generiert idiomatische Backend-ORM Models &amp; Schemas für Go, Python, Rust und .NET C#.
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

        {/* Plugin Selector Tabs */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center gap-2">
          {plugins.map((plugin) => (
            <button
              key={plugin.id}
              onClick={() => {
                setSelectedPluginId(plugin.id);
                setSelectedFileIndex(0);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                selectedPluginId === plugin.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>{plugin.name}</span>
              <span className="text-[10px] opacity-75 font-mono px-1 py-0.2 bg-black/30 rounded">
                {plugin.runtimeTarget.split('/')[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Plugin Info & File List */}
          <div className="w-72 bg-slate-950/80 border-r border-slate-800 p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Plugin-Details
                </div>
                <h3 className="text-sm font-bold text-white">{currentPlugin?.name}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {currentPlugin?.description}
                </p>
                <div className="text-[10px] font-mono text-indigo-400 mt-2 bg-indigo-950/60 p-2 rounded border border-indigo-800/40">
                  Target: {currentPlugin?.runtimeTarget}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold uppercase text-slate-400 mb-2">
                  Generierte Dateien ({generatedFiles.length})
                </div>
                <div className="space-y-1.5">
                  {generatedFiles.map((file, idx) => (
                    <button
                      key={file.fileName}
                      onClick={() => setSelectedFileIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
                        selectedFileIndex === idx
                          ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode size={14} />
                        <span className="truncate">{file.fileName}</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-slate-800 px-1 rounded">
                        {file.language}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="text-[11px] text-slate-500">
                Tabellen im Modell: <span className="text-white font-bold">{store.tables.length}</span>
              </div>
            </div>
          </div>

          {/* Right Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-indigo-400" />
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
                  onClick={handleDownloadFile}
                  className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Download size={13} />
                  <span>Datei herunterladen</span>
                </button>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-auto">
              <pre className="font-mono text-xs text-indigo-300 leading-relaxed">
                {activeFile?.code || '// Keine Daten generiert'}
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
