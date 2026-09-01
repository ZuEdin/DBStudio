import React, { useState } from 'react';
import { X, Download, Copy, Check, FileCode, Server, Terminal, Play } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';
import { generateDevOpsArtifacts } from '../../utils/generators/devOpsOpenApiGenerator';

interface OpenApiPostmanExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OpenApiPostmanExportModal: React.FC<OpenApiPostmanExportModalProps> = ({ isOpen, onClose }) => {
  const { tables, projectName } = useProjectStore();
  const { addToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<'openapi' | 'postman' | 'curl'>('openapi');
  const [baseUrl, setBaseUrl] = useState('https://api.kunde-enterprise.de');
  const [bearerToken, setBearerToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const artifacts = generateDevOpsArtifacts(projectName || 'Project', tables);
  const openApiContent = artifacts['openapi.json'] || '{}';
  const postmanContent = artifacts['postman_collection.json'] || '{}';

  const selectedTable = tables[0]?.name.toLowerCase() || 'users';
  const generatedCurl = `curl -X POST "${baseUrl}/api/${selectedTable}s" \\
  -H "Authorization: Bearer ${bearerToken}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(
    (tables[0]?.fields || []).reduce((acc: any, f) => {
      acc[f.name] = f.type === 'INTEGER' ? 123 : 'Musterdaten';
      return acc;
    }, {}),
    null,
    2
  )}'`;

  const activeContent =
    activeTab === 'openapi' ? openApiContent : activeTab === 'postman' ? postmanContent : generatedCurl;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast('Code in Zwischenablage kopiert!', 'success');
  };

  const handleDownload = () => {
    const filename =
      activeTab === 'openapi'
        ? 'openapi.json'
        : activeTab === 'postman'
        ? 'postman_collection.json'
        : 'api_request.sh';

    const mime = activeTab === 'curl' ? 'text/plain' : 'application/json';
    const blob = new Blob([activeContent], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`${filename} heruntergeladen!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">OpenAPI 3.1 &amp; Postman Collection Exporter</h2>
              <p className="text-xs text-slate-400">
                Schlüsselfertige OpenAPI Spec (`swagger.json`), Postman v2.1 Collection &amp; cURL Requests
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('openapi')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                activeTab === 'openapi'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileCode size={14} /> OpenAPI 3.1 Spec
            </button>
            <button
              onClick={() => setActiveTab('postman')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                activeTab === 'postman'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Server size={14} /> Postman Collection
            </button>
            <button
              onClick={() => setActiveTab('curl')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                activeTab === 'curl'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Terminal size={14} /> Live cURL Builder
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />} Kopieren
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition"
            >
              <Download size={14} /> Herunterladen
            </button>
          </div>
        </div>

        {/* Live Params Configuration for cURL */}
        {activeTab === 'curl' && (
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Base API URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Bearer Auth Token (JWT)
              </label>
              <input
                type="text"
                value={bearerToken}
                onChange={(e) => setBearerToken(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white"
              />
            </div>
          </div>
        )}

        {/* Code Display Area */}
        <div className="flex-1 p-6 overflow-auto bg-slate-950">
          <pre className="font-mono text-xs text-emerald-400 bg-slate-900 p-4 rounded-xl border border-slate-800 overflow-x-auto leading-relaxed">
            <code>{activeContent}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
