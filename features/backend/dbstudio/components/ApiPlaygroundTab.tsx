import React, { useState } from 'react';
import { Table } from '../../../../types/index';
import { 
  PlayCircle, Play, Copy, Check 
} from 'lucide-react';
import { generateOpenApiSpec, generatePostmanCollection } from '../utils/codeGenerators';

interface ApiPlaygroundTabProps {
  tables: Table[];
  selectedTables: Record<string, boolean>;
  queries?: any[];
  selectedQueries?: Record<string, boolean>;
  apiSpecTab: 'playground' | 'openapi' | 'postman';
  setApiSpecTab: (val: 'playground' | 'openapi' | 'postman') => void;
  playgroundTable: string;
  setPlaygroundTable: (val: string) => void;
  playgroundMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  setPlaygroundMethod: (val: 'GET' | 'POST' | 'PUT' | 'DELETE') => void;
  playgroundPayload: string;
  setPlaygroundPayload: (val: string) => void;
  isExecutingApiReq: boolean;
  handleExecuteApiRequest?: () => void;
  executeApiRequest?: () => void;
  playgroundResponse: {
    status: number;
    statusText: string;
    timeMs: number;
    data: any;
  } | null;
  implementGoal?: string;
  remoteServerUrl: string;
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export const ApiPlaygroundTab: React.FC<ApiPlaygroundTabProps> = ({
  tables,
  selectedTables,
  apiSpecTab,
  setApiSpecTab,
  playgroundTable,
  setPlaygroundTable,
  playgroundMethod,
  setPlaygroundMethod,
  playgroundPayload,
  setPlaygroundPayload,
  isExecutingApiReq,
  handleExecuteApiRequest,
  executeApiRequest,
  playgroundResponse,
  implementGoal = '',
  remoteServerUrl,
  showMessage,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const openApiCode = generateOpenApiSpec(tables, selectedTables, implementGoal, remoteServerUrl);
  const postmanCode = generatePostmanCollection(tables, selectedTables, remoteServerUrl);

  const handleCopySpec = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showMessage("Kopiert", "Spezifikation wurde in die Zwischenablage kopiert.", "success");
  };

  return (
    <div id="api_playground_tab_container" className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/80 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/60 pb-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PlayCircle className="text-indigo-400" size={20} />
              <span>Punkt 3: REST API Playground & OpenAPI / Postman Specs</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Interaktiver API-Tester und automatischer Export von OpenAPI 3.0 Specs & Postman Collections.</p>
          </div>

          {/* Sub-tab Switch */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700 shrink-0 font-mono text-xs">
            {(['playground', 'openapi', 'postman'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setApiSpecTab(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all ${apiSpecTab === tab ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {tab === 'playground' ? 'API Playground' : tab === 'openapi' ? 'OpenAPI 3.0 Spec' : 'Postman Collection'}
              </button>
            ))}
          </div>
        </div>

        {/* API Playground View */}
        {apiSpecTab === 'playground' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
            {/* Left Controls */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tabelle auswählen</label>
                <select
                  value={playgroundTable}
                  onChange={(e) => setPlaygroundTable(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs font-mono p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {tables.map(t => (
                    <option key={t.id} value={t.name}>{t.name} (/api/data/{t.name.toLowerCase()})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">HTTP Methode</label>
                <div className="grid grid-cols-4 gap-2 font-mono text-xs font-bold">
                  {(['GET', 'POST', 'PUT', 'DELETE'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setPlaygroundMethod(m)}
                      className={`py-2 rounded-xl border transition-all cursor-pointer ${playgroundMethod === m ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {(playgroundMethod === 'POST' || playgroundMethod === 'PUT') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">JSON Body Payload</label>
                  <textarea
                    rows={6}
                    value={playgroundPayload}
                    onChange={(e) => setPlaygroundPayload(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 font-mono text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              <button
                onClick={handleExecuteApiRequest || executeApiRequest}
                disabled={isExecutingApiReq}
                className="w-full py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all border border-emerald-400/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play size={14} className={isExecutingApiReq ? 'animate-spin' : ''} />
                <span>Anfrage Senden ({playgroundMethod} /api/data/{playgroundTable.toLowerCase()})</span>
              </button>
            </div>

            {/* Right Response Viewer */}
            <div className="lg:col-span-7 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs flex flex-col min-h-[300px]">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 text-slate-400">
                <span className="font-bold text-slate-200">HTTP Antwort-Stream</span>
                {playgroundResponse && (
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded font-bold ${playgroundResponse.status >= 200 && playgroundResponse.status < 300 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'bg-amber-500/20 text-amber-300 border border-amber-500/20'}`}>
                      {playgroundResponse.status} {playgroundResponse.statusText}
                    </span>
                    <span className="text-slate-500">{playgroundResponse.timeMs}ms</span>
                  </div>
                )}
              </div>

              <div className="p-3 overflow-y-auto flex-1 font-mono text-slate-300 leading-relaxed max-h-80">
                {playgroundResponse ? (
                  <pre><code>{JSON.stringify(playgroundResponse.data, null, 2)}</code></pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 py-12">
                    <span className="text-xl">📡</span>
                    <span className="italic">Klicken Sie auf 'Anfrage Senden' oben, um den simulierten HTTP Request auszuführen.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* OpenAPI Spec View */}
        {apiSpecTab === 'openapi' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">Generierte OpenAPI 3.0 YAML / JSON-Spezifikation für Ihre Backend-Routen:</span>
              <button
                onClick={() => handleCopySpec(openApiCode)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer font-bold"
              >
                {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedCode ? 'Kopiert!' : 'Kopieren'}</span>
              </button>
            </div>
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs">
              <pre className="text-slate-300 overflow-x-auto max-h-96"><code>{openApiCode}</code></pre>
            </div>
          </div>
        )}

        {/* Postman Collection View */}
        {apiSpecTab === 'postman' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">Importierbare Postman v2.1 JSON-Collection für Ihr gesamtes Schema:</span>
              <button
                onClick={() => handleCopySpec(postmanCode)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer font-bold"
              >
                {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedCode ? 'Kopiert!' : 'Kopieren'}</span>
              </button>
            </div>
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs">
              <pre className="text-slate-300 overflow-x-auto max-h-96"><code>{postmanCode}</code></pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
