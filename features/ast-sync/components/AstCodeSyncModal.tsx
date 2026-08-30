import React, { useState, useEffect } from 'react';
import { Table, Relationship } from '../../../types';
import { 
  AstCodeSyncEngine, 
  CodeLanguage, 
  AstParsedTable, 
  AstDiffItem 
} from '../services/astCodeSyncEngine';
import { 
  RefreshCw, 
  Code, 
  Check, 
  Copy, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  X, 
  Sparkles, 
  ArrowRightLeft,
  Database,
  FileCode,
  Sliders
} from 'lucide-react';

interface AstCodeSyncModalProps {
  currentTables: Table[];
  onApplyChanges: (updatedTables: Table[]) => void;
  onClose: () => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

const SAMPLE_CODE_SNIPPETS: Record<CodeLanguage, string> = {
  typescript: `// Manuell erweitertes TypeScript DTO Modell
export interface Customer {
  id: number;
  companyName: string;
  contactPerson?: string;
  email: string;
  creditLimit: number;
  vatNumber?: string; // Neu hinzugefügt
  isVipCustomer: boolean; // Neu hinzugefügt
  updatedAt: Date; // Neu hinzugefügt
}

export interface ConstructionSite {
  id: number;
  customerId: number;
  projectName: string;
  budgetAmount: number;
  estimatedCompletionDate?: Date;
  status: string;
  gpsLatitude?: number; // Neu im Frontend hinzugefügt
  gpsLongitude?: number; // Neu im Frontend hinzugefügt
}`,

  prisma: `// Prisma Schema mit manuellen Schema-Optimierungen
model Customer {
  id            Int       @id @default(autoincrement())
  companyName   String
  contactPerson String?
  email         String    @unique
  creditLimit   Decimal
  vatNumber     String?
  isVipCustomer Boolean   @default(false)
  updatedAt     DateTime  @updatedAt
  sites         ConstructionSite[]
}

model ConstructionSite {
  id            Int       @id @default(autoincrement())
  customerId    Int
  projectName   String
  budgetAmount  Decimal
  status        String
  gpsLatitude   Float?
  gpsLongitude  Float?
  customer      Customer  @relation(fields: [customerId], references: [id])
}`,

  sql: `-- Manuelles SQL DDL Script mit neuen Feldern
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(150) NOT NULL,
  credit_limit DECIMAL(12, 2),
  vat_number VARCHAR(50),
  is_vip_customer BOOLEAN DEFAULT false,
  updated_at TIMESTAMP
);

CREATE TABLE construction_sites (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  project_name VARCHAR(200) NOT NULL,
  budget_amount DECIMAL(15, 2),
  status VARCHAR(50) NOT NULL,
  gps_latitude DECIMAL(9, 6),
  gps_longitude DECIMAL(9, 6)
);`,

  go: `// Go GORM Models mit manuellen GORM-Tags
package models

import "time"

type Customer struct {
  ID            uint       \`gorm:"primaryKey"\`
  CompanyName   string     \`gorm:"size:255;not null"\`
  ContactPerson *string    \`gorm:"size:100"\`
  Email         string     \`gorm:"size:150;uniqueIndex"\`
  CreditLimit   float64    \`gorm:"type:decimal(12,2)"\`
  VatNumber     *string    \`gorm:"size:50"\`
  IsVipCustomer bool       \`gorm:"default:false"\`
  UpdatedAt     time.Time
}

type ConstructionSite struct {
  ID            uint       \`gorm:"primaryKey"\`
  CustomerID    uint       \`gorm:"not null;index"\`
  ProjectName   string     \`gorm:"size:200;not null"\`
  BudgetAmount  float64    \`gorm:"type:decimal(15,2)"\`
  Status        string     \`gorm:"size:50"\`
  GpsLatitude   *float64   \`gorm:"type:decimal(9,6)"\`
  GpsLongitude  *float64   \`gorm:"type:decimal(9,6)"\`
}`,

  python: `# Python Pydantic & SQLAlchemy Models
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Customer(BaseModel):
  id: int
  company_name: str
  contact_person: Optional[str] = None
  email: str
  credit_limit: float
  vat_number: Optional[str] = None
  is_vip_customer: bool = False
  updated_at: Optional[datetime] = None

class ConstructionSite(BaseModel):
  id: int
  customer_id: int
  project_name: str
  budget_amount: float
  status: str
  gps_latitude: Optional[float] = None
  gps_longitude: Optional[float] = None`
};

export const AstCodeSyncModal: React.FC<AstCodeSyncModalProps> = ({
  currentTables,
  onApplyChanges,
  onClose,
  onShowToast
}) => {
  const [language, setLanguage] = useState<CodeLanguage>('typescript');
  const [code, setCode] = useState<string>(SAMPLE_CODE_SNIPPETS.typescript);
  const [parsedTables, setParsedTables] = useState<AstParsedTable[]>([]);
  const [diffs, setDiffs] = useState<AstDiffItem[]>([]);
  const [copied, setCopied] = useState(false);

  // Re-run AST Parsing and Diff calculation on code or language change
  useEffect(() => {
    try {
      const parsed = AstCodeSyncEngine.parseCode(code, language);
      setParsedTables(parsed);
      const calculatedDiffs = AstCodeSyncEngine.calculateAstDiff(currentTables, parsed);
      setDiffs(calculatedDiffs);
    } catch {
      // Ignore parse errors while typing
    }
  }, [code, language, currentTables]);

  const handleLanguageChange = (lang: CodeLanguage) => {
    setLanguage(lang);
    setCode(SAMPLE_CODE_SNIPPETS[lang]);
  };

  const handleToggleDiff = (diffId: string) => {
    setDiffs(prev => prev.map(d => d.id === diffId ? { ...d, selected: !d.selected } : d));
  };

  const handleSelectAll = (select: boolean) => {
    setDiffs(prev => prev.map(d => ({ ...d, selected: select })));
  };

  const handleApplySync = () => {
    const updated = AstCodeSyncEngine.applyDiffToTables(currentTables, parsedTables, diffs);
    const selectedCount = diffs.filter(d => d.selected).length;
    onApplyChanges(updated);
    onShowToast?.(`Zwei-Wege-Sync erfolgreich: ${selectedCount} Schema-Änderung(en) ins .dbsp Metamodell synchronisiert!`, 'success');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast?.('Code in Zwischenablage kopiert!', 'success');
  };

  const selectedCount = diffs.filter(d => d.selected).length;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ArrowRightLeft size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Round-Trip AST Code Synchronisation</h3>
                <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  2-Wege Reverse Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Überträgt manuell getunten Quellcode (TypeScript, Prisma, SQL DDL, Go, Python) zurück in das .dbsp Metamodell
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

        {/* Toolbar: Language Selector */}
        <div className="px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Sprache / Quellformat:</span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {(['typescript', 'prisma', 'sql', 'go', 'python'] as CodeLanguage[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-3 py-1 rounded text-xs font-semibold uppercase transition-all ${
                    language === lang
                      ? 'bg-purple-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>Kopieren</span>
            </button>
          </div>
        </div>

        {/* 3-Way Diff Layout */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
          {/* Left Column: Code Editor */}
          <div className="lg:col-span-6 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Code size={14} className="text-purple-400" />
                <span>Manueller Quellcode (Exportiertes Projekt):</span>
              </span>
              <span className="text-[11px] text-purple-400 font-mono">
                {parsedTables.length} Tabellen erkannt
              </span>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={18}
              className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-[11px] font-mono text-purple-300 focus:outline-none focus:border-purple-500 shadow-inner"
              spellCheck={false}
            />
          </div>

          {/* Right Column: AST Diff & Cherry-Picking */}
          <div className="lg:col-span-6 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sliders size={14} className="text-emerald-400" />
                <span>Erkannte Schema-Änderungen ({diffs.length}):</span>
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  onClick={() => handleSelectAll(true)}
                  className="text-purple-400 hover:underline cursor-pointer"
                >
                  Alle
                </button>
                <span className="text-slate-600">|</span>
                <button
                  onClick={() => handleSelectAll(false)}
                  className="text-slate-400 hover:underline cursor-pointer"
                >
                  Keine
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5 overflow-y-auto max-h-[440px]">
              {diffs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500/60" />
                  <p>Metamodell und Quellcode sind 100% synchron.</p>
                  <p className="text-[11px] text-slate-600">Fügen Sie im Quellcode neue Felder oder Tabellen hinzu, um den Live-Sync zu testen.</p>
                </div>
              ) : (
                diffs.map(diff => (
                  <div
                    key={diff.id}
                    onClick={() => handleToggleDiff(diff.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      diff.selected
                        ? 'bg-slate-900 border-purple-500/60 ring-1 ring-purple-500/30'
                        : 'bg-slate-950/60 border-slate-800 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={diff.selected}
                      onChange={() => {}}
                      className="rounded bg-slate-800 border-slate-700 text-purple-500 mt-1"
                    />

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{diff.description}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          diff.severity === 'breaking'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : diff.severity === 'warning'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {diff.type}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                        <span>Tabelle: <code className="text-purple-300">{diff.tableName}</code></span>
                        {diff.fieldName && (
                          <>
                            <span>•</span>
                            <span>Spalte: <code className="text-emerald-300">{diff.fieldName}</code></span>
                          </>
                        )}
                        {diff.oldValue && diff.newValue && (
                          <>
                            <span>•</span>
                            <span className="text-amber-300">{diff.oldValue} ➔ {diff.newValue}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles size={14} className="text-purple-400" />
            <span>Ausgewählt: <strong className="text-purple-400">{selectedCount}</strong> von {diffs.length} Schema-Änderungen</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              onClick={handleApplySync}
              disabled={selectedCount === 0}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowRightLeft size={14} />
              <span>Reverse-Sync in Metamodell übernehmen ({selectedCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
