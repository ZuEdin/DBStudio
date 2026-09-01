import React, { useState } from 'react';
import { X, FileText, Send, Download, ShieldCheck, Mail, Check, AlertCircle } from 'lucide-react';
import { generateZugferdXml, downloadZugferdXml } from '../utils/zugferdGenerator';
import { savePrintJobToIndexedDB } from '../services/reportIndexedDBService';

interface PdfExportWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle?: string;
}

export const PdfExportWorkflowModal: React.FC<PdfExportWorkflowModalProps> = ({
  isOpen,
  onClose,
  reportTitle = 'Ausgangsrechnung_2026_001',
}) => {
  const [isPdfA3, setIsPdfA3] = useState(true);
  const [embedZugferd, setEmbedZugferd] = useState(true);
  const [zugferdProfile, setZugferdProfile] = useState<'COMFORT' | 'EXTENDED' | 'XRECHNUNG'>('COMFORT');
  const [recipientEmail, setRecipientEmail] = useState('buchhaltung@kunde.de');
  const [emailSubject, setEmailSubject] = useState(`Rechnung ${reportTitle} - Musterbau GmbH`);
  const [emailBody, setEmailBody] = useState(
    `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie Ihre Rechnung als PDF/A-3 mit eingebetteter ZUGFeRD 2.2 E-Rechnung.\n\nMit freundlichen Grüßen,\nMusterbau GmbH`
  );
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExportPdf = async () => {
    await savePrintJobToIndexedDB({
      id: `job_${Date.now()}`,
      reportTitle,
      printedAt: Date.now(),
      pageCount: 2,
      status: 'PRINTED',
    });

    if (embedZugferd) {
      downloadZugferdXml(
        {
          enabled: true,
          profile: zugferdProfile,
          invoiceNumber: 'INV-2026-881',
          sellerName: 'Musterbau GmbH',
          sellerVatId: 'DE123456789',
          buyerName: 'Kunde AG',
          currency: 'EUR',
          pdfCompliance: 'PDF/A-3b',
        },
        1250.0,
        237.5,
        1487.5
      );
      onClose();
    } else {
      onClose();
      setTimeout(() => {
        window.print();
      }, 120);
    }
  };

  const handleSendEmail = async () => {
    setIsSendingMail(true);
    await new Promise((r) => setTimeout(r, 800));

    await savePrintJobToIndexedDB({
      id: `job_mail_${Date.now()}`,
      reportTitle,
      printedAt: Date.now(),
      pageCount: 2,
      status: 'EMAILED',
      recipientEmail,
    });

    setIsSendingMail(false);
    setSendSuccess(true);
    setTimeout(() => {
      setSendSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      data-no-print="true"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print print:hidden"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <FileText size={20} className="text-emerald-400" />
            <h3 className="font-bold text-base">E-Rechnung (ZUGFeRD / XRechnung), PDF/A & E-Mail Workflow</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {/* PDF/A Compliance & ZUGFeRD Settings */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase">
              <ShieldCheck size={16} className="text-emerald-600" /> Revisionssicherer PDF Standard & E-Rechnung
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-white p-2.5 rounded border border-slate-300">
                <input
                  type="checkbox"
                  checked={isPdfA3}
                  onChange={(e) => setIsPdfA3(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>PDF/A-3 Kompatibilität (Langzeit-Archiv)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-white p-2.5 rounded border border-slate-300">
                <input
                  type="checkbox"
                  checked={embedZugferd}
                  onChange={(e) => setEmbedZugferd(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>ZUGFeRD 2.2 / Factur-X XML einbetten</span>
              </label>
            </div>

            {embedZugferd && (
              <div>
                <label className="block font-bold mb-1 text-slate-700">ZUGFeRD / XRechnung Profil:</label>
                <select
                  value={zugferdProfile}
                  onChange={(e) => setZugferdProfile(e.target.value as any)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white font-medium"
                >
                  <option value="COMFORT">ZUGFeRD COMFORT / Factur-X Standard (EN 16931)</option>
                  <option value="XRECHNUNG">XRechnung (Behördenstandard Deutschland)</option>
                  <option value="EXTENDED">ZUGFeRD EXTENDED (Erweiterte Branchenfelder)</option>
                </select>
              </div>
            )}
          </div>

          {/* Email Dispatch Section */}
          <div className="border border-slate-200 p-4 rounded-lg space-y-3">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase">
              <Mail size={16} className="text-blue-600" /> Direkter SMTP E-Mail Versand
            </h4>

            <div className="space-y-2">
              <div>
                <label className="block font-bold mb-1 text-slate-700">Empfänger-Adresse:</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700">Betreff:</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700">Nachrichten-Text:</label>
                <textarea
                  rows={3}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex justify-between items-center">
          <button
            onClick={handleSendEmail}
            disabled={isSendingMail}
            className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send size={14} />
            <span>{isSendingMail ? 'Wird versendet...' : 'Per E-Mail versenden'}</span>
          </button>

          <div className="flex gap-2">
            <button onClick={onClose} className="px-3.5 py-1.5 rounded border border-slate-300 bg-white font-medium">
              Abbrechen
            </button>
            <button
              onClick={handleExportPdf}
              className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <Download size={14} />
              <span>PDF / ZUGFeRD Exportieren</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
