import React, { useState } from 'react';
import { Workflow, Table } from '../../../types/index';
import { generateEnhancedN8nWorkflow } from '../services/n8nWorkflowGenerator';
import { generateZapierTemplates, ZapierWebhookTemplate } from '../services/zapierTemplateGenerator';
import { generateMakeBlueprint } from '../services/makeTemplateGenerator';
import { 
  Zap, 
  Copy, 
  Download, 
  Check, 
  Code, 
  Layers, 
  Globe, 
  Sparkles, 
  X, 
  Radio, 
  CheckCircle2, 
  ExternalLink,
  Workflow as WorkflowIcon,
  Send,
  Cpu
} from 'lucide-react';

interface AutomationExportModalProps {
  workflow?: Workflow | null;
  tables: Table[];
  onClose: () => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const AutomationExportModal: React.FC<AutomationExportModalProps> = ({
  workflow,
  tables,
  onClose,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'n8n' | 'zapier' | 'make' | 'event_bridge' | 'curl'>('n8n');
  const [copied, setCopied] = useState(false);
  const [selectedZapierIndex, setSelectedZapierIndex] = useState(0);
  const [baseUrl, setBaseUrl] = useState('http://localhost:5000');
  const [eventTopic, setEventTopic] = useState('erp.orders.synced');
  const [eventDirection, setEventDirection] = useState<'inbound' | 'outbound' | 'bidirectional'>('bidirectional');

  const defaultWorkflow: Workflow = workflow || {
    id: 'wf_demo',
    name: 'DB Studio Auto-Sync Flow',
    description: 'Automatischer Datensatz-Sync mit externen Systemen',
    active: true,
    nodes: [
      {
        id: 'node_trigger',
        type: 'triggerNode',
        position: { x: 100, y: 150 },
        data: { label: 'DB Insert Trigger', triggerConfig: { event: 'onCreate', tableId: tables[0]?.id || 'tbl_orders' } }
      },
      {
        id: 'node_db',
        type: 'databaseActionNode',
        position: { x: 400, y: 150 },
        data: { label: 'PostgreSQL Sync', dbActionConfig: { action: 'insert', tableId: tables[0]?.id || 'tbl_orders' } }
      },
      {
        id: 'node_notify',
        type: 'emailActionNode',
        position: { x: 700, y: 150 },
        data: { label: 'Admin Benachrichtigen', emailConfig: { to: 'admin@bau-erp.de', subject: 'Neuer Datensatz eingegangen' } }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'node_trigger', target: 'node_db' },
      { id: 'e2-3', source: 'node_db', target: 'node_notify' }
    ]
  };

  // Generators
  const n8nWorkflow = generateEnhancedN8nWorkflow(defaultWorkflow, tables, baseUrl);
  const n8nJson = JSON.stringify(n8nWorkflow, null, 2);

  const zapierTemplates = generateZapierTemplates(defaultWorkflow, tables);
  const currentZapier = zapierTemplates[selectedZapierIndex] || zapierTemplates[0];

  const makeBlueprint = generateMakeBlueprint(defaultWorkflow, tables);
  const makeJson = JSON.stringify(makeBlueprint, null, 2);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast?.(`${label} erfolgreich kopiert!`, 'success');
  };

  const handleDownloadJson = (data: string, filename: string) => {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast?.(`Datei '${filename}' heruntergeladen.`, 'success');
  };

  const curlExample = `curl -X POST "${baseUrl}/api/v1/webhooks/ingest" \\
  -H "Content-Type: application/json" \\
  -H "X-DB-Studio-Event: ${eventTopic}" \\
  -H "X-DB-Studio-Secret: whsec_live_948a31e0b" \\
  -d '{
    "event": "${eventTopic}",
    "timestamp": "${new Date().toISOString()}",
    "data": {
      "id": 1042,
      "status": "APPROVED",
      "source": "n8n_zapier_hub"
    }
  }'`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Zap size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">n8n, Zapier &amp; No-Code Workflow Export</h3>
                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  v3.0 Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Exportieren Sie DB Studio Workflows als n8n JSON, Zapier Webhooks, Make.com Szenarien und bi-direktionale Event-Bridges
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
            onClick={() => setActiveTab('n8n')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all border-t-2 ${
              activeTab === 'n8n'
                ? 'bg-slate-900 text-orange-400 border-orange-500 font-bold'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <Zap size={14} />
            <span>n8n Workflow (JSON v1.1)</span>
          </button>
          <button
            onClick={() => setActiveTab('zapier')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all border-t-2 ${
              activeTab === 'zapier'
                ? 'bg-slate-900 text-amber-400 border-amber-500 font-bold'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <WorkflowIcon size={14} />
            <span>Zapier Webhooks &amp; Code</span>
          </button>
          <button
            onClick={() => setActiveTab('make')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all border-t-2 ${
              activeTab === 'make'
                ? 'bg-slate-900 text-purple-400 border-purple-500 font-bold'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <Layers size={14} />
            <span>Make.com (Integromat)</span>
          </button>
          <button
            onClick={() => setActiveTab('event_bridge')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all border-t-2 ${
              activeTab === 'event_bridge'
                ? 'bg-slate-900 text-cyan-400 border-cyan-500 font-bold'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <Radio size={14} />
            <span>Bi-Direktionale Event-Bridge</span>
          </button>
          <button
            onClick={() => setActiveTab('curl')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all border-t-2 ${
              activeTab === 'curl'
                ? 'bg-slate-900 text-emerald-400 border-emerald-500 font-bold'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <Code size={14} />
            <span>cURL &amp; Postman</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: N8N WORKFLOW EXPORT */}
          {activeTab === 'n8n' && (
            <div className="space-y-4">
              <div className="bg-orange-950/30 border border-orange-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                    <Sparkles size={14} />
                    <span>Sofortiger n8n Canvas Import</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Drücken Sie in n8n einfach <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[11px] border border-slate-700">Ctrl + V</kbd> auf dem Arbeitsbereich oder laden Sie die `.json`-Datei herunter.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyText(n8nJson, 'n8n Workflow JSON')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Kopiert!' : 'In Zwischenablage'}</span>
                  </button>
                  <button
                    onClick={() => handleDownloadJson(n8nJson, `${(defaultWorkflow.name || 'db-studio-flow').toLowerCase().replace(/[^a-z0-9]/g, '-')}-n8n.json`)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    <span>JSON Download</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs">
                <label className="text-slate-400 font-medium">DB Studio API Basis-URL:</label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 font-mono text-xs flex-1"
                />
              </div>

              <div className="relative">
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72">
                  <code>{n8nJson}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: ZAPIER TEMPLATES */}
          {activeTab === 'zapier' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {zapierTemplates.map((tpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedZapierIndex(idx)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      selectedZapierIndex === idx
                        ? 'bg-amber-950/30 border-amber-500/60 text-amber-300 ring-1 ring-amber-500/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">{tpl.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-400">
                        {tpl.eventType}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{tpl.description}</p>
                  </button>
                ))}
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-200">Zapier Standard Event Payload</span>
                  <button
                    onClick={() => handleCopyText(JSON.stringify(currentZapier.samplePayload, null, 2), 'Zapier Payload')}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    <Copy size={12} /> Kopieren
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-40">
                  {JSON.stringify(currentZapier.samplePayload, null, 2)}
                </pre>

                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200">Zapier Code Step (JavaScript)</span>
                    <button
                      onClick={() => handleCopyText(currentZapier.zapierCodeStepJs, 'Zapier JS Code')}
                      className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      <Copy size={12} /> JS Kopieren
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-36 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    {currentZapier.zapierCodeStepJs}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MAKE.COM BLUEPRINT */}
          {activeTab === 'make' && (
            <div className="space-y-4">
              <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Sparkles size={14} />
                    <span>Make.com (Integromat) Blueprint Import</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Importieren Sie dieses Blueprint direkt in Make.com unter <em>Scenario → More options → Import Blueprint</em>.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyText(makeJson, 'Make.com Blueprint')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>Blueprint Kopieren</span>
                  </button>
                  <button
                    onClick={() => handleDownloadJson(makeJson, 'db-studio-make-blueprint.json')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Blueprint (.json)</span>
                  </button>
                </div>
              </div>

              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-purple-300 overflow-x-auto max-h-72">
                <code>{makeJson}</code>
              </pre>
            </div>
          )}

          {/* TAB 4: EVENT BRIDGE CONFIG */}
          {activeTab === 'event_bridge' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                  <Radio size={16} />
                  <span>Bi-Direktionale Event-Bus Bridge Konfiguration</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Verbindet eingehende Webhooks und ausgehende MFE-Events mit automatischem Schema-Insert und Trigger-Propagation.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Event Topic Name:</label>
                    <input
                      type="text"
                      value={eventTopic}
                      onChange={(e) => setEventTopic(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Bridge Richtung:</label>
                    <select
                      value={eventDirection}
                      onChange={(e) => setEventDirection(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                    >
                      <option value="bidirectional">Bi-Direktional (Inbound + Outbound)</option>
                      <option value="inbound">Nur Inbound (Webhook → EventBus → DB)</option>
                      <option value="outbound">Nur Outbound (DB Event → Webhook Target)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2 mt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 size={14} />
                    <span>Aktive MFE Payload-Bindung:</span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300">
{`// EventBus Subscription Pattern
window.__DB_STUDIO_EVENT_BUS__.subscribe('${eventTopic}', (eventPayload) => {
  console.log('[Bridge Sync]', eventPayload);
  // Auto-Insert in Tabelle '${tables[0]?.name || 'Records'}'
});`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CURL & POSTMAN */}
          {activeTab === 'curl' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">cURL Inbound Webhook Testaufruf</span>
                  <button
                    onClick={() => handleCopyText(curlExample, 'cURL Befehl')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-600/30"
                  >
                    <Copy size={13} /> Kopieren
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-slate-200 bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                  {curlExample}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-orange-400" />
            <span>Kompatibel mit n8n v1.0+, Zapier CLI, Make.com &amp; Node.js</span>
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
