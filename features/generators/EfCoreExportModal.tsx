import React, { useState } from 'react';
import { X, Code2, Database, Download, Copy, Check, Layers, Cpu, Server, Sparkles, FileCode } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { EfCoreCodeGenerator, EfCoreGeneratorOptions, GeneratedCsFile } from './efCoreGenerator';
import { useDisclaimerStore } from '../../stores/useDisclaimerStore';

interface EfCoreExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const EfCoreExportModal: React.FC<EfCoreExportModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const { tables, relationships, projectName } = useProjectStore();

  const [options, setOptions] = useState<EfCoreGeneratorOptions>({
    namespace: 'EnterpriseStudio.Data',
    dbContextName: 'EnterpriseDbContext',
    targetFramework: '.NET 10.0',
    useNullableReferenceTypes: true,
    generateFluentApi: true,
    generateSeedData: true,
    generateValidators: true,
    databaseProvider: 'SqlServer',
  });

  const [activeTab, setActiveTab] = useState<string>('dbcontext');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const result = EfCoreCodeGenerator.generateAll(tables, relationships || [], options);

  const allFiles: GeneratedCsFile[] = [
    result.dbContext,
    ...(result.seedData ? [result.seedData] : []),
    ...result.entities,
    ...(result.validators ? result.validators : []),
    ...result.controllers,
    result.csproj,
  ];

  const currentFile = allFiles.find((f) => f.fileName === activeTab) || result.dbContext;

  const handleCopy = () => {
    if (!currentFile) return;
    useDisclaimerStore.getState().requireConfirmation(`C# Code-Kopie (${currentFile.fileName})`, () => {
      navigator.clipboard.writeText(currentFile.code);
      setCopied(true);
      if (onShowToast) onShowToast(`"${currentFile.fileName}" in die Zwischenablage kopiert!`, 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadAll = () => {
    useDisclaimerStore.getState().requireConfirmation(`.NET 10 EF Core Bundle-Export`, () => {
      const combined = allFiles
        .map(
          (f) =>
            `// ==========================================================================\n// FILE: ${f.fileName} (${f.description})\n// ==========================================================================\n\n${f.code}\n`
        )
        .join('\n\n');

      const blob = new Blob([combined], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName || 'DBStudio'}-EFCore-DotNet10-Bundle.cs`;
      link.click();
      URL.revokeObjectURL(url);
      if (onShowToast) onShowToast(`EF Core Bundle erfolgreich heruntergeladen!`, 'success');
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Cpu size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  .NET 10 & Entity Framework Core Code-Generator
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  C# 13 / EF Core 10
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Erzeugt vollautomatisch typisierte Domain Entities, Fluent-API DbContext, Seed-Daten & ASP.NET Core CRUD Controller
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Download size={14} />
              Alle C# Dateien (.zip/bundle)
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
          
          {/* Left Sidebar: Settings & File Explorer */}
          <div className="w-80 border-r border-slate-800 bg-slate-950/50 flex flex-col overflow-y-auto p-4 space-y-5">
            
            {/* Quick Generator Configuration */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                C# & EF Core Parameter
              </label>
              
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">C# Namespace:</span>
                  <input
                    type="text"
                    value={options.namespace}
                    onChange={(e) => setOptions({ ...options, namespace: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">DbContext Name:</span>
                  <input
                    type="text"
                    value={options.dbContextName}
                    onChange={(e) => setOptions({ ...options, dbContextName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Datenbank Provider:</span>
                  <select
                    value={options.databaseProvider}
                    onChange={(e) => setOptions({ ...options, databaseProvider: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs focus:border-indigo-500 outline-none"
                  >
                    <option value="SqlServer">Microsoft SQL Server</option>
                    <option value="PostgreSQL">PostgreSQL (Npgsql)</option>
                    <option value="Sqlite">SQLite / LocalDB</option>
                    <option value="MySQL">MySQL / MariaDB (Pomelo)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.useNullableReferenceTypes}
                      onChange={(e) => setOptions({ ...options, useNullableReferenceTypes: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 bg-slate-800"
                    />
                    <span className="text-slate-300">#nullable enable (C# 13)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.generateSeedData}
                      onChange={(e) => setOptions({ ...options, generateSeedData: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 bg-slate-800"
                    />
                    <span className="text-slate-300">Seed-Daten HasData() generieren</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.generateValidators}
                      onChange={(e) => setOptions({ ...options, generateValidators: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 bg-slate-800"
                    />
                    <span className="text-slate-300">FluentValidation Regeln (.NET 10)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Generated Files Navigator */}
            <div className="flex-1 flex flex-col min-h-0 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Generierte C# Artefakte ({allFiles.length})
                </label>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {allFiles.map((file) => {
                  const isActive = (activeTab === file.fileName) || (activeTab === 'dbcontext' && file.category === 'dbcontext');
                  return (
                    <button
                      key={file.fileName}
                      onClick={() => setActiveTab(file.fileName)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 font-medium'
                          : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode size={14} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
                        <span className="truncate">{file.fileName}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                        {file.category}
                      </span>
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
                <span className="font-mono text-xs text-indigo-300 font-semibold">{currentFile.fileName}</span>
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

            {/* Footer Status */}
            <div className="px-5 py-2 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between text-[11px] text-slate-500">
              <span>{result.summary.totalEntities} Entities generiert • {result.summary.totalRelationships} Relationen gemapped</span>
              <span className="text-emerald-400 font-medium">Enterprise .NET 10 Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
