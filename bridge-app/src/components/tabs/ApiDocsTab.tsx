import React, { useState } from 'react';
import { FileCode2, Copy, Check, ExternalLink, BookOpen, Send, Zap } from 'lucide-react';

export const ApiDocsTab: React.FC = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const endpoints = [
    {
      id: 'health',
      method: 'GET',
      path: '/api/health',
      description: 'Gibt den Health-Status der Bridge sowie installierte SDKs (.NET, Node, Docker) zurück.',
      sampleResponse: `{
  "dotnetSdk": { "installed": true, "version": "10.0.301" },
  "nodejs": { "installed": true, "version": "v22.17.1" },
  "npm": { "installed": true, "version": "11.6.2" },
  "docker": { "installed": true, "running": true, "version": "27.1.1" },
  "bridgePort": 5050,
  "isOnline": true
}`
    },
    {
      id: 'payload',
      method: 'POST',
      path: '/api/payload',
      description: 'Zentraler Empfangs-Endpunkt für DB Studio Pro Web. Nimmt generierten C# / Frontend Code an, entpackt ihn im Workspace und startet die Anwendung.',
      sampleRequest: `{
  "projectId": "my_erp_app",
  "name": "ERP Enterprise App",
  "files": [
    { "path": "Program.cs", "content": "var builder = WebApplication.CreateBuilder(args);..." }
  ],
  "autoRun": true,
  "runMode": "dotnet_run"
}`
    },
    {
      id: 'access_transpile',
      method: 'POST',
      path: '/api/access/transpile',
      description: 'Übersetzt MS Access VBA-Funktionen (NZ, IIF, Date, Str) & Tabellenschemata in ANSI-SQL für Postgres, MySQL, SQLite oder SQL Server.',
      sampleRequest: `{
  "tables": [{ "name": "Kunden", "columns": [...] }],
  "queries": [{ "name": "qryOffeneRechnungen", "sql": "SELECT IIF(Betrag > 0, NZ(Betrag, 0), 0) FROM Rechnungen" }],
  "targetDialect": "postgres"
}`
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">DB Studio Bridge REST & WebSocket API Spec</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Dokumentation der Schnittstellen zur Kommunikation zwischen DB Studio Pro (Web) und der nativen Bridge</p>
            </div>
          </div>

          <a
            href="http://localhost:5000/swagger"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/20 border border-indigo-400/30 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Interaktive Swagger UI</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-75" />
          </a>
        </div>
      </div>

      <div className="space-y-4">
        {endpoints.map((ep) => (
          <div key={ep.id} className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className={`px-2.5 py-1 rounded-lg font-bold uppercase ${
                  ep.method === 'GET' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                }`}>
                  {ep.method}
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{ep.path}</span>
              </div>
              <button
                onClick={() => copyToClipboard(`http://localhost:5050${ep.path}`, ep.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800"
              >
                {copiedEndpoint === ep.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">{ep.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
