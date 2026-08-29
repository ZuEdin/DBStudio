import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Key, 
  Globe, 
  Save, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Lock, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { bridgeApi } from '../../services/bridgeApi';
import { CorsConfig, ApiToken } from '../../types/bridge';

export const SecurityTab: React.FC = () => {
  const [cors, setCors] = useState<CorsConfig>({
    allowedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    allowedHeaders: ['*'],
    allowCredentials: true
  });
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const data = await bridgeApi.getSecurityConfig();
      if (data?.cors) setCors(data.cors);
      if (data?.tokens) setTokens(data.tokens);
    } catch {
      // Fallback
    }
  };

  const handleSaveCors = async () => {
    try {
      await bridgeApi.saveCorsConfig(cors);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) return;
    try {
      const created = await bridgeApi.createApiToken(newTokenName.trim());
      setTokens(prev => [...prev, created]);
      setNewTokenName('');
    } catch {
      // Fallback
    }
  };

  const handleRevokeToken = async (id: string) => {
    try {
      await bridgeApi.revokeApiToken(id);
      setTokens(prev => prev.filter(t => t.id !== id));
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">CORS & Web-Origin Freigaben</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Erlaubte Domains für API-Aufrufe aus dem Web-Studio an die lokale Bridge</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Erlaubte Origins (eine URL pro Zeile)</label>
            <textarea
              rows={3}
              value={cors.allowedOrigins.join('\n')}
              onChange={(e) => setCors({ ...cors, allowedOrigins: e.target.value.split('\n').filter(Boolean) })}
              className="w-full bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 rounded-xl p-3 focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveCors}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md"
            >
              {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? 'CORS Gespeichert!' : 'CORS Speichern'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
