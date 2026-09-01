import React, { useState } from 'react';
import { Database, Layout, Layers, Code, Plus, Shield, Copy, Check, FileCheck, QrCode } from 'lucide-react';

interface PromoInteractiveShowcaseProps {
  device: 'desktop' | 'tablet' | 'mobile';
}

export const PromoInteractiveShowcase: React.FC<PromoInteractiveShowcaseProps> = ({ device }) => {
  const [selectedFeature, setSelectedFeature] = useState<'schema' | 'forms' | 'einvoice' | 'export'>('schema');
  const [selectedLang, setSelectedLang] = useState<'react-node' | 'dotnet' | 'python' | 'sql'>('react-node');
  const [schemaFields, setSchemaFields] = useState<Array<{ name: string; type: string }>>([
    { name: 'id', type: 'uuid' },
    { name: 'firma', type: 'varchar' },
    { name: 'rechnungsbetrag_netto', type: 'decimal' },
    { name: 'ust_satz', type: 'decimal' },
    { name: 'status', type: 'varchar' }
  ]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('varchar');
  const [copied, setCopied] = useState(false);

  const addSchemaField = () => {
    if (!newFieldName.trim()) return;
    setSchemaFields([...schemaFields, { name: newFieldName.toLowerCase().replace(/\s+/g, '_'), type: newFieldType }]);
    setNewFieldName('');
  };

  const toPascalCase = (str: string) => {
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  };

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeSnippets = {
    'react-node': {
      title: 'React + Node/Express (TypeScript)',
      server: `// server.ts - REST API mit automatischem Routing
import express from 'express';
import { pool } from './db';

const app = express();
app.use(express.json());

// Automatischer Endpunkt für Schema-Tabelle
app.get('/api/rechnungen', async (req, res) => {
  try {
    const result = await pool.query('SELECT ${schemaFields.map(f => f.name).join(', ')} FROM rechnungen');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});`,
      client: `// RechnungenPage.tsx - Modernes Dashboard
import React, { useEffect, useState } from 'react';

export const RechnungenPage = () => {
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/rechnungen').then(r => r.json()).then(setRecords);
  }, []);

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl">
      <h2 className="text-xl font-bold mb-4">Rechnungsübersicht</h2>
      <table className="w-full text-xs">
        <thead className="bg-slate-800 text-indigo-300">
          <tr>${schemaFields.map(f => `<th className="p-2 text-left">${f.name}</th>`).join('')}</tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={i} className="border-t border-slate-800">
              ${schemaFields.map(f => `<td className="p-2">{String(r.${f.name} ?? '')}</td>`).join('')}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};`
    },
    'dotnet': {
      title: 'ASP.NET Core .NET 10 + EF Core C#',
      server: `// RechnungenController.cs (.NET 10 C#)
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class RechnungenController : ControllerBase
{
    private readonly AppDbContext _context;
    public RechnungenController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Rechnung>>> GetAll()
    {
        return await _context.Rechnungen.AsNoTracking().ToListAsync();
    }
}`,
      client: `// Rechnung.cs - EF Core Entity Model
public class Rechnung
{
    ${schemaFields.map(f => `public ${f.type === 'uuid' ? 'Guid' : f.type === 'decimal' ? 'decimal' : 'string'} ${toPascalCase(f.name)} { get; set; }`).join('\n    ')}
}`
    },
    'python': {
      title: 'Python FastAPI + Pydantic v2 + SQLAlchemy',
      server: `# main.py - FastAPI Endpoint
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from .database import get_db, RechnungModel

app = FastAPI(title="DB Studio API")

@app.get("/api/rechnungen")
def list_rechnungen(db: Session = Depends(get_db)):
    return db.query(RechnungModel).all()`,
      client: `# schemas.py - Pydantic Model
from pydantic import BaseModel
from typing import Optional

class RechnungSchema(BaseModel):
    ${schemaFields.map(f => `${f.name}: ${f.type === 'decimal' ? 'float' : 'str'}`).join('\n    ')}

    class Config:
        from_attributes = True`
    },
    'sql': {
      title: 'Universal SQL DDL (Postgres / MySQL / SQLite)',
      server: `-- Multi-DB DDL Export
CREATE TABLE IF NOT EXISTS rechnungen (
  ${schemaFields.map(f => `${f.name} ${f.type === 'uuid' ? 'UUID PRIMARY KEY' : f.type === 'decimal' ? 'DECIMAL(12,2) NOT NULL' : 'VARCHAR(255)'}`).join(',\n  ')}
);

-- Indizes & Performance
CREATE INDEX idx_rechnungen_status ON rechnungen (status);`,
      client: `-- Schema Validation
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rechnungen';`
    }
  };

  return (
    <div id="interactive-showroom" className="relative max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-white flex items-center gap-2">
            Interaktiver Live-Showroom &amp; Code-Engine
          </h3>
          <p className="text-xs text-slate-400">
            Erleben Sie live, wie Schema-Änderungen in Echtzeit sofortigen, validierten Quellcode und Formularmasken erzeugen.
          </p>
        </div>
      </div>

      {/* Device Shell */}
      <div className={`mx-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${
        device === 'mobile' ? 'max-w-[380px]' : 
        device === 'tablet' ? 'max-w-[768px]' : 
        'w-full'
      }`}>
        {/* Browser Mockup Top */}
        <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-red-500/80 block" />
            <span className="size-3 rounded-full bg-yellow-500/80 block" />
            <span className="size-3 rounded-full bg-green-500/80 block" />
          </div>
          <div className="bg-slate-950 px-3 py-1 rounded text-[11px] text-slate-400 font-mono flex items-center gap-1.5 shadow-inner">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            https://dbstudio.pro/app/sandbox-live
          </div>
          <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest hidden sm:block">
            In-Browser Compiler
          </div>
        </div>

        {/* Inner Content */}
        <div className="p-6 bg-slate-900 min-h-[460px] text-slate-300 space-y-6">
          {/* Sub-Feature Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'schema', label: '1. Tabellen & Schema', icon: Database },
              { id: 'forms', label: '2. Formulare & Rollen', icon: Layout },
              { id: 'einvoice', label: '3. E-Invoicing / DACH', icon: FileCheck },
              { id: 'export', label: '4. Code Export (Multi-Lang)', icon: Code }
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFeature(tab.id as any)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    selectedFeature === tab.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-inner ring-1 ring-indigo-400/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <TabIcon size={16} className={selectedFeature === tab.id ? 'text-indigo-400' : 'text-slate-500'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Schema */}
          {selectedFeature === 'schema' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-indigo-950/30 p-3 rounded-lg border border-indigo-900/40 text-xs text-indigo-200">
                💡 <strong>Echtzeit-Schema-Builder:</strong> Fügen Sie Felder hinzu. Das Datenmodell wird sofort im Code-Export Tab in echtes TypeScript, C#, Python und SQL übersetzt!
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wide">Feld hinzufügen</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-medium">Spaltenname</label>
                      <input 
                        type="text" 
                        value={newFieldName}
                        onChange={e => setNewFieldName(e.target.value)}
                        placeholder="z.B. rabatt, steuer_id, lieferdatum" 
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-medium">Datentyp</label>
                      <select 
                        value={newFieldType}
                        onChange={e => setNewFieldType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="varchar">VARCHAR(255) / Text</option>
                        <option value="decimal">DECIMAL(12,2) / Währung</option>
                        <option value="integer">INTEGER / Ganzzahl</option>
                        <option value="boolean">BOOLEAN / Checkbox</option>
                        <option value="timestamp">TIMESTAMP / Datum</option>
                      </select>
                    </div>
                    <button 
                      onClick={addSchemaField}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Plus size={14} /> Spalte hinzufügen
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold font-mono text-indigo-400">table: rechnungen</span>
                    <span className="text-[10px] text-slate-400 font-mono">{schemaFields.length} Spalten</span>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {schemaFields.map((field, index) => (
                      <div key={index} className="flex justify-between items-center bg-slate-900/80 px-2.5 py-1.5 rounded text-xs border border-slate-800/60">
                        <span className="font-mono text-slate-200">{field.name}</span>
                        <span className="font-mono text-indigo-400 text-[10px] bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-900">{field.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Forms */}
          {selectedFeature === 'forms' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 max-w-xl mx-auto space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white">Formular-Vorschau (Live-Binding)</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded font-semibold">
                    RLS / Role-Security Aktiv
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Empfänger / Firma</label>
                    <input type="text" disabled value="Musterbau GmbH & Co. KG" className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Netto-Betrag (€)</label>
                      <input type="text" disabled value="14.850,00" className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300 font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">MwSt. (19%)</label>
                      <input type="text" disabled value="2.821,50" className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300 font-mono" />
                    </div>
                  </div>
                  <div className="border border-indigo-900/60 bg-indigo-950/30 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-300">
                      <Shield size={12} /> Freigabe-Stufe (Nur Buchhaltung &amp; GF)
                    </div>
                    <span className="text-[10px] text-slate-400 block">Status: Freigegeben für Rechnungsversand (ZUGFeRD 2.3 XML)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: E-Invoice */}
          {selectedFeature === 'einvoice' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <FileCheck size={16} /> ZUGFeRD 2.3 &amp; XRechnung 3.0
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Vollständige Konformität nach EN16931 für Deutschland &amp; Österreich. Erzeugt hybride PDF/A-3 Rechnungen mit eingebettetem XML-Datensatz.
                  </p>
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-[11px] font-mono text-emerald-300">
                    &lt;rsm:CrossIndustryInvoice&gt;<br />
                    &nbsp;&nbsp;&lt;rsm:ExchangedDocument&gt;...&lt;/rsm:ExchangedDocument&gt;<br />
                    &lt;/rsm:CrossIndustryInvoice&gt;
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <QrCode size={16} /> Schweizer QR-Rechnung (Swiss QR-Bill)
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Offizieller Zahlteil mit Schweizer Kreuz, QR-IBAN, Referenznummer und Betrag in CHF / EUR.
                  </p>
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                    <span>Validierung: ISO 20022 Standard</span>
                    <span className="text-emerald-400 font-bold">100% Gültig ✔</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Code Export */}
          {selectedFeature === 'export' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <p className="text-xs text-slate-400">
                  Kompilierbarer Quellcode für Ihr definiertes Schema:
                </p>
                <div className="bg-slate-950 border border-slate-800 p-0.5 rounded-lg flex text-xs font-bold">
                  {[
                    { id: 'react-node', label: 'React + Node' },
                    { id: 'dotnet', label: '.NET 10 (C#)' },
                    { id: 'python', label: 'Python (FastAPI)' },
                    { id: 'sql', label: 'Universal SQL' }
                  ].map(l => (
                    <button
                      key={l.id}
                      onClick={() => setSelectedLang(l.id as any)}
                      className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                        selectedLang === l.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-64">
                  <div className="bg-slate-900 border-b border-slate-800/80 px-3 py-1.5 flex justify-between items-center">
                    <span className="text-xs text-indigo-400 font-mono font-bold">Backend / Server</span>
                    <button 
                      onClick={() => copyToClipboard(codeSnippets[selectedLang].server)}
                      className="text-[10px] text-slate-400 hover:text-white bg-slate-950 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={10} /> Kopieren
                    </button>
                  </div>
                  <pre className="p-3 text-[10px] font-mono text-slate-300 overflow-auto flex-1 leading-relaxed whitespace-pre bg-slate-950/90">
                    {codeSnippets[selectedLang].server}
                  </pre>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-64">
                  <div className="bg-slate-900 border-b border-slate-800/80 px-3 py-1.5 flex justify-between items-center">
                    <span className="text-xs text-indigo-400 font-mono font-bold">Client / Entity Model</span>
                    <button 
                      onClick={() => copyToClipboard(codeSnippets[selectedLang].client)}
                      className="text-[10px] text-slate-400 hover:text-white bg-slate-950 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={10} /> Kopieren
                    </button>
                  </div>
                  <pre className="p-3 text-[10px] font-mono text-slate-300 overflow-auto flex-1 leading-relaxed whitespace-pre bg-slate-950/90">
                    {codeSnippets[selectedLang].client}
                  </pre>
                </div>
              </div>

              {copied && (
                <div className="text-center text-xs text-emerald-400 font-bold bg-emerald-950/30 py-2 rounded border border-emerald-800 flex items-center justify-center gap-1.5">
                  <Check size={14} /> Quellcode erfolgreich in die Zwischenablage kopiert!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
