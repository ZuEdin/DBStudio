
import React, { useState } from 'react';
import { IntegrationsConfig, SsoConfig, WebhookConfig, StorageConfig } from '../../types/index';
import { X, Save, HardDrive, Key, CloudLightning, Plus, Trash2 } from 'lucide-react';

interface IntegrationsModalProps {
  config: IntegrationsConfig | undefined;
  onSave: (config: IntegrationsConfig) => void;
  onClose: () => void;
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({ config, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'storage' | 'sso' | 'webhooks'>('storage');
  
  const [storage, setStorage] = useState<StorageConfig>(config?.storage || { provider: 'local' });
  const [sso, setSso] = useState<SsoConfig[]>(config?.sso || []);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(config?.webhooks || []);

  const handleSave = () => {
    onSave({ storage, sso, webhooks });
    onClose();
  };

  const addSso = () => setSso([...sso, { provider: 'google', clientId: '' }]);
  const updateSso = (idx: number, updates: Partial<SsoConfig>) => {
      const newSso = [...sso];
      newSso[idx] = { ...newSso[idx], ...updates };
      setSso(newSso);
  };
  const removeSso = (idx: number) => setSso(sso.filter((_, i) => i !== idx));

  const addWebhook = () => setWebhooks([...webhooks, { url: '', events: ['create'] }]);
  const updateWebhook = (idx: number, updates: Partial<WebhookConfig>) => {
      const newWebhooks = [...webhooks];
      newWebhooks[idx] = { ...newWebhooks[idx], ...updates };
      setWebhooks(newWebhooks);
  };
  const removeWebhook = (idx: number) => setWebhooks(webhooks.filter((_, i) => i !== idx));

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border border-slate-300 flex flex-col h-[700px] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-slate-900 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
               <CloudLightning size={24} className="text-yellow-400"/> Integrations Hub
            </h2>
            <p className="text-slate-400 text-sm mt-1">Verbinden Sie Ihre App mit der Außenwelt.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden">
            <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 space-y-2">
                <button 
                    onClick={() => setActiveTab('storage')}
                    className={`w-full text-left p-3 rounded flex items-center gap-3 transition-colors ${activeTab === 'storage' ? 'bg-white shadow text-blue-600 font-bold border border-slate-200' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                    <HardDrive size={18} /> Datei-Speicher
                </button>
                <button 
                    onClick={() => setActiveTab('sso')}
                    className={`w-full text-left p-3 rounded flex items-center gap-3 transition-colors ${activeTab === 'sso' ? 'bg-white shadow text-blue-600 font-bold border border-slate-200' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                    <Key size={18} /> Single Sign-On (SSO)
                </button>
                <button 
                    onClick={() => setActiveTab('webhooks')}
                    className={`w-full text-left p-3 rounded flex items-center gap-3 transition-colors ${activeTab === 'webhooks' ? 'bg-white shadow text-blue-600 font-bold border border-slate-200' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                    <CloudLightning size={18} /> Webhooks & Zapier
                </button>
            </div>

            <div className="flex-1 p-8 overflow-y-auto bg-white">
                
                {/* STORAGE TAB */}
                {activeTab === 'storage' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm text-blue-800">
                            Wählen Sie aus, wo hochgeladene Dateien (Bilder, Dokumente) gespeichert werden sollen.
                        </div>
                        
                        <div>
                            <label className="block font-bold text-slate-700 mb-2">Provider</label>
                            <select 
                                value={storage.provider}
                                onChange={e => setStorage({ ...storage, provider: e.target.value as any })}
                                className="w-full border p-2 rounded"
                            >
                                <option value="local">Lokales Dateisystem (Uploads/)</option>
                                <option value="s3">Amazon S3 (AWS)</option>
                                <option value="azure">Azure Blob Storage</option>
                            </select>
                        </div>

                        {storage.provider === 's3' && (
                            <div className="space-y-4 border-t pt-4">
                                <h4 className="font-bold text-slate-600">AWS Konfiguration</h4>
                                <input 
                                    type="text" placeholder="Bucket Name" className="w-full border p-2 rounded"
                                    value={storage.bucketName || ''} onChange={e => setStorage({...storage, bucketName: e.target.value})}
                                />
                                <input 
                                    type="text" placeholder="Region (z.B. eu-central-1)" className="w-full border p-2 rounded"
                                    value={storage.region || ''} onChange={e => setStorage({...storage, region: e.target.value})}
                                />
                                <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">
                                    Hinweis: Access Key und Secret werden im generierten Code über <code>process.env</code> geladen.
                                </div>
                            </div>
                        )}
                        {storage.provider === 'azure' && (
                            <div className="space-y-4 border-t pt-4">
                                <h4 className="font-bold text-slate-600">Azure Konfiguration</h4>
                                <input 
                                    type="text" placeholder="Container Name" className="w-full border p-2 rounded"
                                    value={storage.bucketName || ''} onChange={e => setStorage({...storage, bucketName: e.target.value})}
                                />
                                <input 
                                    type="text" placeholder="Connection String (Env Var Key)" className="w-full border p-2 rounded"
                                    value={storage.connectionString || 'AZURE_STORAGE_CONNECTION_STRING'} onChange={e => setStorage({...storage, connectionString: e.target.value})}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* SSO TAB */}
                {activeTab === 'sso' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="bg-purple-50 border border-purple-200 p-4 rounded text-sm text-purple-800">
                            Ermöglichen Sie Nutzern das Login über externe Anbieter (OAuth2).
                        </div>
                        
                        {sso.map((provider, idx) => (
                            <div key={idx} className="border p-4 rounded-lg space-y-3 relative group">
                                <button onClick={() => removeSso(idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                                <div className="flex gap-4">
                                    <div className="w-1/3">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Anbieter</label>
                                        <select 
                                            className="w-full border rounded p-2"
                                            value={provider.provider}
                                            onChange={e => updateSso(idx, { provider: e.target.value as any })}
                                        >
                                            <option value="google">Google</option>
                                            <option value="microsoft">Microsoft 365</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client ID</label>
                                        <input 
                                            type="text" className="w-full border rounded p-2"
                                            value={provider.clientId}
                                            onChange={e => updateSso(idx, { clientId: e.target.value })}
                                        />
                                    </div>
                                </div>
                                {provider.provider === 'microsoft' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tenant ID (Optional)</label>
                                        <input 
                                            type="text" className="w-full border rounded p-2"
                                            value={provider.tenantId || ''}
                                            onChange={e => updateSso(idx, { tenantId: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                        <button onClick={addSso} className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline"><Plus size={16}/> Anbieter hinzufügen</button>
                    </div>
                )}

                {/* WEBHOOKS TAB */}
                {activeTab === 'webhooks' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded text-sm text-orange-800">
                            Senden Sie Datenänderungen (Events) an externe Systeme wie Zapier, Make.com oder Slack.
                        </div>

                        {webhooks.map((hook, idx) => (
                            <div key={idx} className="border p-4 rounded-lg space-y-3 relative">
                                <button onClick={() => removeWebhook(idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Webhook URL (Ziel)</label>
                                    <input 
                                        type="text" className="w-full border rounded p-2 font-mono text-sm"
                                        placeholder="https://hooks.zapier.com/..."
                                        value={hook.url}
                                        onChange={e => updateWebhook(idx, { url: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Auslöser</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={hook.events.includes('create')}
                                                onChange={e => {
                                                    const events = e.target.checked 
                                                        ? [...hook.events, 'create'] 
                                                        : hook.events.filter(ev => ev !== 'create');
                                                    updateWebhook(idx, { events: events as any });
                                                }}
                                            /> Erstellen
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={hook.events.includes('update')}
                                                onChange={e => {
                                                    const events = e.target.checked 
                                                        ? [...hook.events, 'update'] 
                                                        : hook.events.filter(ev => ev !== 'update');
                                                    updateWebhook(idx, { events: events as any });
                                                }}
                                            /> Ändern
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={hook.events.includes('delete')}
                                                onChange={e => {
                                                    const events = e.target.checked 
                                                        ? [...hook.events, 'delete'] 
                                                        : hook.events.filter(ev => ev !== 'delete');
                                                    updateWebhook(idx, { events: events as any });
                                                }}
                                            /> Löschen
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={addWebhook} className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline"><Plus size={16}/> Webhook hinzufügen</button>
                    </div>
                )}

            </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 bg-slate-50 border-t border-slate-200 shrink-0">
          <button onClick={onClose} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-2 rounded-lg text-sm font-medium transition-colors">
            Abbrechen
          </button>
          <button onClick={handleSave} className="bg-slate-900 hover:bg-black text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
            <Save size={18} /> Konfiguration speichern
          </button>
        </div>
      </div>
    </div>
  );
};
