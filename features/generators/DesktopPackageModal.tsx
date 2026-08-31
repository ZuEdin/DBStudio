import React, { useState } from 'react';
import { X, Laptop, Download, Copy, Check, Terminal, Shield, Sparkles, FileCode, CheckCircle2 } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { DesktopPackagingGenerator, DesktopPackageOptions, GeneratedDesktopFile } from './desktopPackagingGenerator';

interface DesktopPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const DesktopPackageModal: React.FC<DesktopPackageModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const { projectName } = useProjectStore();

  const [options, setOptions] = useState<DesktopPackageOptions>({
    appName: projectName ? `${projectName} Desktop` : 'Enterprise Calc & Estimation Studio',
    bundleIdentifier: 'com.enterprisestudio.app',
    version: '1.0.0',
    engine: 'tauri',
    windowTitle: projectName ? `${projectName} - Enterprise Edition` : 'Enterprise Estimation Studio',
    width: 1400,
    height: 900,
    resizable: true,
    enableNativeFs: true,
    enablePrinter: true,
    enableAutoUpdate: true,
  });

  const [activeFile, setActiveFile] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generatedFiles: GeneratedDesktopFile[] = DesktopPackagingGenerator.generateDesktopPackage(options);
  const currentFile = generatedFiles.find((f) => f.filePath === activeFile) || generatedFiles[0];

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    if (onShowToast) onShowToast(`"${currentFile.filePath}" kopiert!`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    const combined = generatedFiles
      .map(
        (f) =>
          `// ==========================================================================\n// PATH: ${f.filePath} (${f.description})\n// ==========================================================================\n\n${f.code}\n`
      )
      .join('\n\n');

    const blob = new Blob([combined], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${options.appName.replace(/\s+/g, '_')}-${options.engine.toUpperCase()}-DesktopConfig.txt`;
    link.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast(`Desktop-Konfiguration exportiert!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-600/20 text-teal-400 border border-teal-500/30">
              <Laptop size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  1-Klick Desktop Wrapper Generator (Tauri 2.0 & Electron)
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Windows (.msi/.exe) • macOS (.dmg) • Linux
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Transformiert die Web-App in eine native Desktop-Anwendung mit vollem Offline-Dateisystem-Zugriff für GAEB/Datanorm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Download size={14} />
              Konfiguration herunterladen
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar: Engine & Settings */}
          <div className="w-80 border-r border-slate-800 bg-slate-950/50 flex flex-col overflow-y-auto p-4 space-y-5">
            
            {/* Engine Selection */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Desktop Engine & Runtime
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOptions({ ...options, engine: 'tauri' })}
                  className={`p-2.5 rounded-lg border text-left flex flex-col transition-all cursor-pointer ${
                    options.engine === 'tauri'
                      ? 'bg-teal-600/20 border-teal-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs">Tauri 2.0</span>
                    {options.engine === 'tauri' && <CheckCircle2 size={13} className="text-teal-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">Rust-basiert (~5MB, extrem schnell)</span>
                </button>

                <button
                  onClick={() => setOptions({ ...options, engine: 'electron' })}
                  className={`p-2.5 rounded-lg border text-left flex flex-col transition-all cursor-pointer ${
                    options.engine === 'electron'
                      ? 'bg-teal-600/20 border-teal-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs">Electron 34</span>
                    {options.engine === 'electron' && <CheckCircle2 size={13} className="text-teal-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">Node.js Main Process & IPC</span>
                </button>
              </div>
            </div>

            {/* App Details */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">App Name:</span>
                <input
                  type="text"
                  value={options.appName}
                  onChange={(e) => setOptions({ ...options, appName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Bundle ID:</span>
                <input
                  type="text"
                  value={options.bundleIdentifier}
                  onChange={(e) => setOptions({ ...options, bundleIdentifier: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:border-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block mb-1">Breite (px):</span>
                  <input
                    type="number"
                    value={options.width}
                    onChange={(e) => setOptions({ ...options, width: parseInt(e.target.value) || 1200 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Höhe (px):</span>
                  <input
                    type="number"
                    value={options.height}
                    onChange={(e) => setOptions({ ...options, height: parseInt(e.target.value) || 800 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white text-xs outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.enableNativeFs}
                    onChange={(e) => setOptions({ ...options, enableNativeFs: e.target.checked })}
                    className="rounded border-slate-700 text-teal-600 bg-slate-800"
                  />
                  <span className="text-slate-300">Natives Dateisystem (GAEB/Datanorm)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.enableAutoUpdate}
                    onChange={(e) => setOptions({ ...options, enableAutoUpdate: e.target.checked })}
                    className="rounded border-slate-700 text-teal-600 bg-slate-800"
                  />
                  <span className="text-slate-300">Auto-Update & CI/CD Pipeline</span>
                </label>
              </div>
            </div>

            {/* Generated Files Explorer */}
            <div className="flex-1 flex flex-col min-h-0 pt-2 border-t border-slate-800">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Paketdateien ({generatedFiles.length})
              </label>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {generatedFiles.map((file) => {
                  const isActive = (activeFile === file.filePath) || (!activeFile && file === generatedFiles[0]);
                  return (
                    <button
                      key={file.filePath}
                      onClick={() => setActiveFile(file.filePath)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-teal-600/30 text-teal-200 border border-teal-500/40 font-medium'
                          : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode size={14} className={isActive ? 'text-teal-400' : 'text-slate-500'} />
                        <span className="truncate">{file.filePath}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Code Previewer */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* Tab header info */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800/80 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-teal-300 font-semibold">{currentFile.filePath}</span>
                <span className="text-xs text-slate-500">— {currentFile.description}</span>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors cursor-pointer"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Kopiert!' : 'Code kopieren'}</span>
              </button>
            </div>

            {/* Code editor / pre */}
            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-200 bg-[#0d1117] leading-relaxed">
              <pre>
                <code>{currentFile.code}</code>
              </pre>
            </div>

            {/* Footer Build Command */}
            <div className="px-5 py-2.5 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-teal-400" />
                <span>Build-Befehl:</span>
                <code className="bg-slate-800 px-2 py-0.5 rounded text-teal-300 font-mono text-[11px]">
                  {options.engine === 'tauri' ? 'npm run tauri build' : 'npm run electron:build'}
                </code>
              </div>
              <span className="text-emerald-400 font-medium">Bereit für Windows/macOS Installer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
