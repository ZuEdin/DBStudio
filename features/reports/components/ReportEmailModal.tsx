import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ReportEmailModalProps {
  reportName: string;
  onClose: () => void;
  onSendSuccess?: (recipient: string) => void;
}

export const ReportEmailModal: React.FC<ReportEmailModalProps> = ({
  reportName,
  onClose,
  onSendSuccess,
}) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState(`Berichtsausgabe: ${reportName}`);
  const [body, setBody] = useState(
    `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie den aktuellen Bericht "${reportName}" im PDF-Format.\n\nMit freundlichen Grüßen,\nDB Studio Pro Bausoftware Enterprise`
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !recipient.includes('@')) {
      setErrorMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      setStatus('error');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const res = await fetch('/api/mailer/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          subject,
          body,
          attachments: [
            {
              filename: `${reportName.replace(/[^a-z0-9]/gi, '_')}.pdf`,
              contentType: 'application/pdf',
              size: '1.4 MB',
            },
          ],
          objectContext: {
            type: 'report',
            name: reportName,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Senden der E-Mail.');
      }

      setStatus('success');
      if (onSendSuccess) {
        onSendSuccess(recipient);
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Fehler beim E-Mail-Versand.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      data-no-print="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 no-print print:hidden"
    >
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden flex flex-col">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Mail size={18} className="text-blue-400" />
            <span>Bericht per E-Mail versenden</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSend} className="p-5 space-y-4 text-xs">
          {status === 'success' && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 flex items-center gap-2 font-bold">
              <CheckCircle2 size={16} /> E-Mail erfolgreich über SMTP-Relay versendet!
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded text-rose-800 flex items-center gap-2 font-medium">
              <AlertCircle size={16} /> {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">Empfänger E-Mail-Adresse *</label>
            <input
              type="email"
              required
              placeholder="z.B. bauherr@beispiel-gmbh.de"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-hidden text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Betreff *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-hidden text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Nachrichtentext</label>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-hidden text-xs font-sans"
            />
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Anhang:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-800">
              {reportName.replace(/[^a-z0-9]/gi, '_')}.pdf (Generiert)
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || status === 'success'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Wird gesendet...
                </>
              ) : (
                <>
                  <Send size={14} /> Jetzt Senden
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
