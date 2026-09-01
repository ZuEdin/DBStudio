import React, { useState } from 'react';
import { X, FileText, Download, Printer, Copy, Check, Sparkles, Building, Palette, Eye } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';

interface WhitelabelDocGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhitelabelDocGeneratorModal: React.FC<WhitelabelDocGeneratorModalProps> = ({ isOpen, onClose }) => {
  const { tables, relationships, projectName } = useProjectStore();
  const { addToast } = useUIStore();

  const [agencyName, setAgencyName] = useState('Acme Digital Agency');
  const [clientName, setClientName] = useState('Kunde Enterprise GmbH');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'preview'>('preview');

  if (!isOpen) return null;

  const generatedHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Datenmodell-Handbuch - ${projectName || 'Projekt'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #f8fafc; }
    .header { border-bottom: 3px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0; }
    .subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }
    .badge { background: ${primaryColor}; color: #fff; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; }
    .section { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    h2 { font-size: 20px; font-weight: 700; color: #1e293b; border-left: 4px solid ${primaryColor}; padding-left: 10px; margin-top: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
    th { background: #f1f5f9; text-align: left; padding: 10px 12px; color: #475569; font-weight: 600; border-bottom: 2px solid #cbd5e1; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
    tr:nth-child(even) { background: #f8fafc; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: #e0f2fe; color: #0369a1; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    @media print { body { background: #fff; padding: 0; } .section { box-shadow: none; border: 1px solid #ccc; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">${projectName || 'Datenbank-Projekt'} Handbuch</h1>
      <div class="subtitle">Erstellt für <strong>${clientName}</strong> von <strong>${agencyName}</strong></div>
    </div>
    <span class="badge">CI-Konform & Official</span>
  </div>

  <div class="section">
    <h2>1. Übersicht & Systemarchitektur</h2>
    <p>Dieses Dokument enthält die technische Spezifikation des Datenmodells mit <strong>${tables.length} Tabellen</strong> und <strong>${relationships?.length || 0} definierten Relationen</strong>.</p>
  </div>

  <div class="section">
    <h2>2. Datenlexikon & Tabellenschema</h2>
    ${tables
      .map(
        (t) => `
      <h3 style="margin-top: 20px; font-size: 16px; color: ${primaryColor};">Tabelle: ${t.name}</h3>
      <table>
        <thead>
          <tr>
            <th>Feldname</th>
            <th>Datentyp</th>
            <th>Primärschlüssel</th>
            <th>Pflichtfeld</th>
            <th>Eindeutig</th>
          </tr>
        </thead>
        <tbody>
          ${(t.fields || [])
            .map(
              (f) => `
            <tr>
              <td><strong>${f.name}</strong></td>
              <td><span class="tag">${f.type}</span></td>
              <td>${f.isPrimaryKey ? 'Ja (PK)' : '-'}</td>
              <td>${f.allowNull === false || f.isNullable === false ? 'Ja' : 'Nein'}</td>
              <td>${f.isUnique ? 'Ja' : '-'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `
      )
      .join('')}
  </div>

  <div class="section">
    <h2>3. Automatisch generierte API Endpunkte</h2>
    <p>Die folgenden REST-Endpunkte stehen für die Integration zur Verfügung:</p>
    <ul>
      ${tables
        .map(
          (t) => `
        <li><code>GET /api/${t.name.toLowerCase()}s</code> - Liste abrufen</li>
        <li><code>POST /api/${t.name.toLowerCase()}s</code> - Neuen Datensatz anlegen</li>
        <li><code>PUT /api/${t.name.toLowerCase()}s/{id}</code> - Datensatz aktualisieren</li>
        <li><code>DELETE /api/${t.name.toLowerCase()}s/{id}</code> - Datensatz löschen</li>
      `
        )
        .join('')}
    </ul>
  </div>

  <div class="footer">
    Documentation generated by DB Studio Pro White-Label Engine for ${agencyName} &copy; ${new Date().getFullYear()}
  </div>
</body>
</html>`;

  const handleDownload = () => {
    const blob = new Blob([generatedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'datenmodell'}_kunden_handbuch.html`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('White-Label Kundenhandbuch erfolgreich heruntergeladen!', 'success');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast('HTML-Code in Zwischenablage kopiert!', 'success');
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(generatedHtml);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FileText className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">White-Label Kunden-Dokumentation</h2>
              <p className="text-xs text-blue-200">CI-konformes Datenmodell-Handbuch (HTML & Druck-PDF)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-200">
            <X size={20} />
          </button>
        </div>

        {/* Top Controls */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Eye size={14} /> Vorschau
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                activeTab === 'config'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Building size={14} /> Branding & CI
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-lg flex items-center gap-1.5 transition"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />} Copy HTML
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-lg flex items-center gap-1.5 transition"
            >
              <Printer size={14} /> Drucken / PDF
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md transition"
            >
              <Download size={14} /> HTML Download
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-6 bg-slate-100 dark:bg-slate-950">
          {activeTab === 'config' ? (
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-md flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-600" /> Agency & Client Branding
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Name Ihrer Agentur
                </label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Kunden-Firma
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  CI Primärfarbe
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setActiveTab('preview')}
                  className="w-full py-2 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition"
                >
                  Vorschau aktualisieren &rarr;
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 max-w-4xl mx-auto min-h-full">
              <iframe
                srcDoc={generatedHtml}
                title="Dokumentation Vorschau"
                className="w-full min-h-[600px] border-0 rounded-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
