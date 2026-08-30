import React, { useState } from 'react';
import { Table } from '../../../types/index';
import { 
  WebhookEndpoint, 
  IngestionLogEntry, 
  getDefaultWebhookEndpoints, 
  simulateWebhookIngestion 
} from '../services/webhookIngestionEngine';
import { 
  Radio, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  Check, 
  ShieldCheck, 
  X, 
  Plus, 
  Terminal, 
  Database, 
  Sparkles, 
  Layers,
  ArrowRight
} from 'lucide-react';

interface WebhookIngestionModalProps {
  tables: Table[];
  onClose: () => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const WebhookIngestionModal: React.FC<WebhookIngestionModalProps> = ({
  tables,
  onClose,
  onShowToast
}) => {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>(() => getDefaultWebhookEndpoints(tables));
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(endpoints[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'simulator' | 'endpoints' | 'logs' | 'security'>('simulator');
  const [rawJson, setRawJson] = useState<string>(() => 
    JSON.stringify(endpoints[0]?.samplePayload || {}, null, 2)
  );
  const [logs, setLogs] = useState<IngestionLogEntry[]>([]);
  const [latestResult, setLatestResult] = useState<IngestionLogEntry | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedEndpoint = endpoints.find(e => e.id === selectedEndpointId) || endpoints[0];

  const handleSelectEndpoint = (ep: WebhookEndpoint) => {
    setSelectedEndpointId(ep.id);
    setRawJson(JSON.stringify(ep.samplePayload, null, 2));
    setLatestResult(null);
  };

  const handleRunSimulation = () => {
    try {
      const parsed = JSON.parse(rawJson);
      const result = simulateWebhookIngestion(selectedEndpoint, parsed, tables);
      setLatestResult(result);
      setLogs(prev => [result, ...prev.slice(0, 19)]);
      if (result.status === 'SUCCESS') {
        onShowToast?.(`Webhook erfolgreich validiert & verarbeitet! (ID: ${result.insertedId})`, 'success');
      } else {
        onShowToast?.('Webhook Schema-Validierung fehlgeschlagen!', 'warning');
      }
    } catch (err: any) {
      onShowToast?.(`Ungültiges JSON: ${err.message}`, 'error');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast?.('In Zwischenablage kopiert!', 'success');
  };

  const nodeVerificationSnippet = `// Node.js Express HMAC-SHA256 Webhook Ingestion
import crypto from 'crypto';

app.post('/api/v1/webhooks/ingest', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-db-studio-signature'];
  const secret = '${selectedEndpoint?.secretToken || 'whsec_live_key'}';

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');

  if (signature !== expectedSig) {
    return res.status(401).json({ error: 'Ungültige Webhook Signatur' });
  }

  const payload = JSON.parse(req.body.toString());
  // Ingestion in Tabelle '${tables.find(t => t.id === selectedEndpoint?.targetTableId)?.name || 'DB'}'
  res.status(200).json({ status: 'ACCEPTED', received: true });
});`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Radio size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Webhook &amp; Event-Trigger Ingestion Hub</h3>
                <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  Live Simulator
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inbound Webhook-Endpunkte mit visueller Schema-Validierung und automatischem DB-Insert
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-950/80 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all border-t-2 ${
              activeTab === 'simulator'
                ? 'bg-slate-900 text-cyan-400 border-cyan-500 font-bold'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <Play size={14} />
            <span>Live Payload Simulator &amp; Validator</span>
          </button>
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all border-t-2 ${
              activeTab === 'endpoints'
                ? 'bg-slate-900 text-emerald-400 border-emerald-500 font-bold'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <Database size={14} />
            <span>Endpunkte ({endpoints.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all border-t-2 ${
              activeTab === 'logs'
                ? 'bg-slate-900 text-amber-400 border-amber-500 font-bold'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <Terminal size={14} />
            <span>Audit Ingestion Logs ({logs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all border-t-2 ${
              activeTab === 'security'
                ? 'bg-slate-900 text-indigo-400 border-indigo-500 font-bold'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <ShieldCheck size={14} />
            <span>HMAC Signatur &amp; Security</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Preset + Editor */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Wähle Webhook-Vorlage:</label>
                  <span className="text-[11px] text-cyan-400 font-mono">POST /api/v1/webhooks/ingest</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {endpoints.map(ep => (
                    <button
                      key={ep.id}
                      onClick={() => handleSelectEndpoint(ep)}
                      className={`p-2 rounded-lg border text-left text-xs transition-all ${
                        selectedEndpointId === ep.id
                          ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300 ring-1 ring-cyan-500/30 font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <div className="truncate font-semibold">{ep.name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{ep.provider}</div>
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Eingehende JSON-Payload:</span>
                    <button
                      onClick={() => handleCopy(rawJson)}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />} Kopieren
                    </button>
                  </div>
                  <textarea
                    value={rawJson}
                    onChange={(e) => setRawJson(e.target.value)}
                    rows={12}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  onClick={handleRunSimulation}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play size={14} />
                  <span>Payload Validieren &amp; Ingestion Testen</span>
                </button>
              </div>

              {/* Right Column: Live Validation Report */}
              <div className="lg:col-span-6 space-y-3">
                <span className="text-xs font-bold text-slate-300 block">Schema-Validierungsbericht:</span>
                
                {latestResult ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        {latestResult.status === 'SUCCESS' ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 size={15} />
                            <span>VALIDE (Bereit für DB-Insert)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs bg-rose-950/50 border border-rose-500/30 px-2.5 py-1 rounded-lg">
                            <XCircle size={15} />
                            <span>SCHEMA-KONFLIKT</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Dauer: {latestResult.durationMs}ms
                      </span>
                    </div>

                    {/* Issues List */}
                    {latestResult.validationResult.issues.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-400">Prüfpunkte:</span>
                        {latestResult.validationResult.issues.map((issue, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg text-xs flex items-start gap-2 border ${
                              issue.type === 'error'
                                ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                                : issue.type === 'warning'
                                ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                                : 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300'
                            }`}
                          >
                            {issue.type === 'error' ? <AlertTriangle size={14} className="shrink-0 mt-0.5" /> : <Sparkles size={14} className="shrink-0 mt-0.5" />}
                            <span>{issue.message}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Mapped DB Record */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block mb-1">
                        Gemappter Datenbank-Datensatz:
                      </span>
                      <pre className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-emerald-400 max-h-48 overflow-x-auto">
                        {JSON.stringify(latestResult.validationResult.mappedRecord, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/50 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs space-y-2">
                    <Layers size={28} className="mx-auto text-slate-600" />
                    <p>Klicken Sie links auf <strong>"Payload Validieren &amp; Ingestion Testen"</strong>, um die JSON-Struktur gegen das Tabellenschema zu prüfen.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ENDPOINTS */}
          {activeTab === 'endpoints' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {endpoints.map(ep => {
                  const targetTbl = tables.find(t => t.id === ep.targetTableId);
                  return (
                    <div key={ep.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{ep.name}</span>
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-mono uppercase font-bold">
                            {ep.provider}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          <span>Topic: <code className="text-cyan-300">{ep.eventTopic}</code></span>
                          <span>•</span>
                          <span>Ziel-Tabelle: <code className="text-emerald-400">{targetTbl?.name || 'Standard'}</code></span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono text-slate-500">{ep.secretToken.slice(0, 12)}...</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">Noch keine Webhook-Events protokolliert.</div>
              ) : (
                <div className="space-y-2">
                  {logs.map(l => (
                    <div key={l.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          l.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {l.status}
                        </span>
                        <span className="font-semibold text-white">{l.endpointName}</span>
                        <span className="text-slate-400 text-[11px]">{l.timestamp}</span>
                      </div>
                      <span className="text-[11px] font-mono text-cyan-400">{l.durationMs} ms</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-3">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400">HMAC-SHA256 Verifikations-Handler (Node.js)</span>
                  <button
                    onClick={() => handleCopy(nodeVerificationSnippet)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                  >
                    <Copy size={12} /> Kopieren
                  </button>
                </div>
                <pre className="bg-slate-900 p-3 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {nodeVerificationSnippet}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-cyan-400" />
            <span>Unterstützt Stripe, GitHub, Shopify, Make &amp; Zapier Webhooks</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
