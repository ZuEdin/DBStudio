
import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { LogIn, User, Lock, Loader2, AlertCircle } from 'lucide-react';

export const LoginPrompt: React.FC = () => {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await login(email, password);
      if (!success) {
        setError('Ungültige Zugangsdaten. Tipp: admin@demo.com / admin123');
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 h-full flex flex-col justify-center">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <LogIn size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Anmelden</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Geben Sie Ihre Zugangsdaten ein</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">E-Mail</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="email"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="name@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Passwort</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="password"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-lg animate-shake">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
          <span>Anmelden</span>
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
        <p className="text-[10px] text-blue-700 dark:text-blue-300 text-center leading-relaxed">
          <strong>Hinweis für Cloud-Tests:</strong><br />
          Um Cloud-Projekte zu testen, ist eine Registrierung erforderlich. Kontaktieren Sie Ihren Administrator für Test-Zugänge oder nutzen Sie die Demo-Accounts aus der CREDENTIALS.md.
        </p>
      </div>
    </div>
  );
};
