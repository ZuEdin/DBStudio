import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  Copy, 
  Check, 
  X, 
  FileCode, 
  Camera, 
  Database, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Terminal
} from 'lucide-react';
import { MobileScaffoldGenerator, MobileScaffoldFile } from './mobileScaffoldGenerator';
import { useProjectStore } from '../../stores/useProjectStore';
import { useDisclaimerStore } from '../../stores/useDisclaimerStore';

interface MobileWrapperExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileWrapperExportModal: React.FC<MobileWrapperExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const store = useProjectStore();
  const [selectedFileIdx, setSelectedFileIdx] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [appName, setAppName] = useState<string>('DBStudioMobile');
  const [appId, setAppId] = useState<string>('de.handwerk.dbstudio');

  if (!isOpen) return null;

  const files: MobileScaffoldFile[] = MobileScaffoldGenerator.generateCapacitorProject(appName, appId);
  const activeFile = files[selectedFileIdx] || files[0];

  const handleCopy = () => {
    if (activeFile) {
      useDisclaimerStore.getState().requireConfirmation(`Mobile Code-Kopie (${activeFile.filePath})`, () => {
        navigator.clipboard.writeText(activeFile.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleDownload = () => {
    if (!activeFile) return;
    useDisclaimerStore.getState().requireConfirmation(`Mobile Datei-Export (${activeFile.filePath})`, () => {
      const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = activeFile.filePath.split('/').pop() || 'file.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[86vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Native Mobile Companion Scaffolding (Capacitor &amp; Tauri)
                </h2>
                <span className="text-[10px] font-mono bg-orange-950 text-orange-300 px-2 py-0.5 rounded border border-orange-800 font-bold">
                  iOS &amp; Android Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                1-Klick Scaffolding für Baustellen-Tablets mit nativer Kamera, Geolocation und Offline-SQLite.
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

        {/* Configuration Toolbar */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">App Name:</span>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono text-xs w-36 outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Bundle ID:</span>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono text-xs w-44 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 size={15} />
            <span>Capacitor 6 + Tauri 2.0 konfiguriert</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* File sidebar */}
          <div className="w-72 bg-slate-950/80 border-r border-slate-800 p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase text-slate-400">
                Scaffolding-Dateien ({files.length})
              </div>
              <div className="space-y-1.5">
                {files.map((f, idx) => (
                  <button
                    key={f.filePath}
                    onClick={() => setSelectedFileIdx(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-left transition-all cursor-pointer ${
                      selectedFileIdx === idx
                        ? 'bg-orange-600/30 text-orange-300 border border-orange-500/50'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode size={14} />
                      <span className="truncate">{f.filePath}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-slate-800 px-1 rounded">
                      {f.language}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-bold text-slate-300 flex items-center gap-1.5">
                <Camera size={13} className="text-orange-400" />
                <span>Hardware-Features</span>
              </div>
              <div>• Native Kamera &amp; Foto-Kompression</div>
              <div>• Offline SQLite Storage</div>
              <div>• GPS / Geolocation für Baustellen</div>
            </div>
          </div>

          {/* Main Code View */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-orange-400" />
                <span className="text-xs font-mono font-bold text-white">{activeFile?.filePath}</span>
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
                  className="flex items-center gap-1 px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Download size={13} />
                  <span>Datei herunterladen</span>
                </button>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-auto">
              <pre className="font-mono text-xs text-orange-200 leading-relaxed">
                {activeFile?.content}
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
