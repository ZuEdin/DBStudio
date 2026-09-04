import React, { useState } from 'react';
import { Table } from '../../../types/index';
import { Send, Plus, Trash2, Check, Radio, Globe, Shield, RefreshCw, Key, AlertCircle } from 'lucide-react';
import { eventBus } from '../../../services/eventBus';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
}

interface DispatchLog {
  id: string;
  timestamp: string;
  url: string;
  event: string;
  status: number;
  statusText: string;
  latencyMs: number;
  requestPayload: any;
  responseBody: string;
  signature: string;
}

interface WebhookDispatcherConsoleProps {
  tables: Table[];
}

export const WebhookDispatcherConsole: React.FC<WebhookDispatcherConsoleProps> = ({ tables }) => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: 'wh_1',
      name: 'ERP / DATEV Sync Hub',
      url: 'https://api.datev-connect.de/v1/webhooks/incoming',
      secret: 'whsec_99a8b7c6d5e4f3a2b1c0d9e8',
      events: ['table.inserted', 'table.updated', 'form.submitted'],
      enabled: true,
    },
    {
      id: 'wh_2',
      name: 'Zapier / Make Automation Pipeline',
      url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef',
      secret: 'whsec_zapier_live_secret_4421',
      events: ['table.inserted', 'report.exported'],
      enabled: true,
    },
  ]);

  const [selectedWebhookId, setSelectedWebhookId] = useState<string>('wh_1');
  const [selectedEvent, setSelectedEvent] = useState<string>('table.inserted');
  const [selectedTableId, setSelectedTableId] = useState<string>(tables[0]?.id || '');
  const [isDispatching, setIsDispatching] = useState(false);
  const [logs, setLogs] = useState<DispatchLog[]>([]);

  const selectedWebhook = webhooks.find((w) => w.id === selectedWebhookId) || webhooks[0];
  const currentTable = tables.find((t) => t.id === selectedTableId) || tables[0];

  const handleAddWebhook = () => {
    const newWh: WebhookConfig = {
      id: `wh_${Date.now()}`,
      name: `Neuer Webhook #${webhooks.length + 1}`,
      url: 'https://api.mein-unternehmen.de/webhooks',
      secret: `whsec_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
      events: ['table.inserted'],
      enabled: true,
    };
    setWebhooks([...webhooks, newWh]);
    setSelectedWebhookId(newWh.id);
  };

  const handleUpdateWebhook = (patch: Partial<WebhookConfig>) => {
    if (!selectedWebhook) return;
    setWebhooks(webhooks.map((w) => (w.id === selectedWebhook.id ? { ...w, ...patch } : w)));
  };

  const handleDeleteWebhook = (id: string) => {
    const next = webhooks.filter((w) => w.id !== id);
    setWebhooks(next);
    if (selectedWebhookId === id) setSelectedWebhookId(next[0]?.id || '');
  };

  const handleDispatchTest = async () => {
    if (!selectedWebhook) return;
    setIsDispatching(true);
    const start = performance.now();

    const payload = {
      event: selectedEvent,
      timestamp: new Date().toISOString(),
      webhookId: selectedWebhook.id,
      entity: currentTable?.name || 'Table',
      data: currentTable?.data?.[0] || { id: 1, test: true, name: 'Beispiel-Datensatz' },
    };

    // Calculate a mock HMAC-SHA256 signature
    const signature = `sha256=${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    // Simulate network dispatch with realistic latency
    const simulatedLatency = Math.floor(Math.random() * 90) + 40;
    await new Promise((r) => setTimeout(r, simulatedLatency));

    const isSuccess = Math.random() > 0.05; // 95% success
    const log: DispatchLog = {
      id: `disp_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('de-DE'),
      url: selectedWebhook.url,
      event: selectedEvent,
      status: isSuccess ? 200 : 502,
      statusText: isSuccess ? 'OK' : 'Bad Gateway',
      latencyMs: simulatedLatency,
      requestPayload: payload,
      responseBody: isSuccess
        ? JSON.stringify({ received: true, eventId: `evt_${Date.now()}`, processedAt: new Date().toISOString() }, null, 2)
        : JSON.stringify({ error: 'Endpoint unreachable or returned HTTP 502' }, null, 2),
      signature,
    };

    setLogs((prev) => [log, ...prev.slice(0, 19)]);
    setIsDispatching(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden font-sans text-xs">
      {/* Top Banner */}
      <div className="bg-slate-950 p-3 px-5 border-b border-slate-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-blue-400 font-bold">
            <Radio size={16} />
            <span>Outbound Webhook Dispatcher &amp; Event-Stream</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Signierte HMAC-SHA256 Payloads an externe REST-Endpunkte bei Datenbank-Ereignissen
          </span>
        </div>

        <button
          onClick={handleAddWebhook}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
        >
          <Plus size={13} /> Neuer Endpunkt
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left Column: Webhook List */}
        <div className="md:col-span-4 bg-slate-950/70 border-r border-slate-800 p-3 flex flex-col gap-2 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1">
            Konfigurierte Webhook-Ziele ({webhooks.length})
          </div>

          {webhooks.map((wh) => (
            <div
              key={wh.id}
              onClick={() => setSelectedWebhookId(wh.id)}
              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex justify-between items-center ${
                selectedWebhook?.id === wh.id
                  ? 'bg-blue-950/60 border-blue-500 text-blue-100 font-semibold shadow-2xs'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`w-2 h-2 rounded-full ${wh.enabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <span className="truncate">{wh.name}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{wh.url}</div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteWebhook(wh.id);
                }}
                className="p-1 hover:bg-red-950 text-red-400 rounded transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Middle/Right Column: Configuration & Live Test Dispatcher */}
        <div className="md:col-span-8 flex flex-col overflow-y-auto p-4 space-y-4 bg-slate-900">
          {selectedWebhook ? (
            <>
              {/* Webhook Settings Box */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <div className="font-bold text-slate-200 text-xs">Endpunkt-Einstellungen:</div>
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={selectedWebhook.enabled}
                      onChange={(e) => handleUpdateWebhook({ enabled: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Aktiviert</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Bezeichnung:</label>
                    <input
                      type="text"
                      value={selectedWebhook.name}
                      onChange={(e) => handleUpdateWebhook({ name: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Webhook URL:</label>
                    <input
                      type="url"
                      value={selectedWebhook.url}
                      onChange={(e) => handleUpdateWebhook({ url: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    HMAC Secret Key (für `X-Hub-Signature-256` Validierung):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={selectedWebhook.secret}
                      onChange={(e) => handleUpdateWebhook({ secret: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs"
                    />
                    <button
                      onClick={() =>
                        handleUpdateWebhook({
                          secret: `whsec_${Math.random().toString(36).substring(2)}${Math.random()
                            .toString(36)
                            .substring(2)}`,
                        })
                      }
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={12} /> Neu generieren
                    </button>
                  </div>
                </div>
              </div>

              {/* Test Dispatcher Trigger Box */}
              <div className="bg-slate-950 p-4 rounded-xl border border-blue-900/40 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-blue-300 flex items-center gap-1.5">
                    <Send size={14} />
                    <span>Test-Payload an {selectedWebhook.name} senden</span>
                  </div>

                  <button
                    onClick={handleDispatchTest}
                    disabled={isDispatching}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Send size={13} />
                    <span>{isDispatching ? 'Sendet HTTP POST...' : 'Jetzt Test-Event senden'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Event-Typ:</label>
                    <select
                      value={selectedEvent}
                      onChange={(e) => setSelectedEvent(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs font-semibold"
                    >
                      <option value="table.inserted">table.inserted (Neuer Datensatz)</option>
                      <option value="table.updated">table.updated (Datensatz aktualisiert)</option>
                      <option value="table.deleted">table.deleted (Datensatz gelöscht)</option>
                      <option value="form.submitted">form.submitted (Formular abgesendet)</option>
                      <option value="report.exported">report.exported (PDF/Excel Export)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Entität / Tabelle:</label>
                    <select
                      value={selectedTableId}
                      onChange={(e) => setSelectedTableId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs font-semibold"
                    >
                      {tables.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Dispatch Logs */}
              <div className="space-y-2">
                <div className="font-bold text-slate-300 text-xs">Letzte Webhook-Dispatches ({logs.length}):</div>
                {logs.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    Noch keine Test-Events gesendet. Klicken Sie auf "Jetzt Test-Event senden".
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                log.status === 200
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-red-950 text-red-400 border border-red-800'
                              }`}
                            >
                              HTTP {log.status} {log.statusText}
                            </span>
                            <span className="text-slate-300 font-semibold">{log.event}</span>
                            <span className="text-slate-500">({log.latencyMs} ms)</span>
                          </div>
                          <span className="text-slate-500">{log.timestamp}</span>
                        </div>

                        <div className="text-[10px] text-slate-400 truncate">
                          Header Signature: <span className="text-amber-400">{log.signature}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <div className="text-[9px] text-slate-500 uppercase">Request Payload:</div>
                            <pre className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-300 overflow-x-auto max-h-24">
                              {JSON.stringify(log.requestPayload, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-500 uppercase">Response Body:</div>
                            <pre className="p-2 bg-slate-900 rounded border border-slate-800 text-emerald-400 overflow-x-auto max-h-24">
                              {log.responseBody}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-500">Wählen Sie links einen Webhook aus.</div>
          )}
        </div>
      </div>
    </div>
  );
};
