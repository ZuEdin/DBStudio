import React, { useState } from 'react';
import { ShieldCheck, Check, X, Sparkles, AlertCircle } from 'lucide-react';
import { Field } from '../../../types';
import { AuditFieldsConfig, generateEnterpriseAuditFields } from '../config/auditColumnsPreset';

interface AuditFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (newFields: Field[]) => void;
  existingFieldNames: string[];
}

export const AuditFieldsModal: React.FC<AuditFieldsModalProps> = ({
  isOpen,
  onClose,
  onApply,
  existingFieldNames,
}) => {
  const [config, setConfig] = useState<AuditFieldsConfig>({
    includeCreated: true,
    includeUpdated: true,
    includeSoftDelete: true,
    includeRowVersion: true,
    prefix: '',
  });

  if (!isOpen) return null;

  const generated = generateEnterpriseAuditFields(config);
  const conflicts = generated.filter((f) =>
    existingFieldNames.map((n) => n.toLowerCase()).includes(f.name.toLowerCase())
  );

  const handleApply = () => {
    onApply(generated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">Enterprise Audit- & Systemfelder</h3>
              <p className="text-xs text-slate-400">Automatische Nachverfolgung, DSGVO/GoBD & Concurrency-Locking</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Einzufügende Standardfelder auswählen:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={config.includeCreated}
                  onChange={(e) => setConfig({ ...config, includeCreated: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">CreatedAt &amp; CreatedBy</span>
                  <span className="text-[11px] text-slate-500">Erstellungszeitpunkt &amp; Benutzer</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={config.includeUpdated}
                  onChange={(e) => setConfig({ ...config, includeUpdated: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">UpdatedAt &amp; UpdatedBy</span>
                  <span className="text-[11px] text-slate-500">Änderungszeitpunkt &amp; Bearbeiter</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={config.includeSoftDelete}
                  onChange={(e) => setConfig({ ...config, includeSoftDelete: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">IsDeleted (Soft-Delete)</span>
                  <span className="text-[11px] text-slate-500">Revisionssicheres Archivieren</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={config.includeRowVersion}
                  onChange={(e) => setConfig({ ...config, includeRowVersion: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">RowVersion (Concurrency)</span>
                  <span className="text-[11px] text-slate-500">Optimistisches Sperren bei Konflikten</span>
                </div>
              </label>
            </div>
          </div>

          {/* Preview list */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Vorschau der generierten Spalten ({generated.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {generated.map((f) => (
                <span
                  key={f.name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-mono text-slate-700 shadow-2xs"
                >
                  <span className="font-semibold text-indigo-700">{f.name}</span>
                  <span className="text-[10px] text-slate-400">({f.type})</span>
                </span>
              ))}
            </div>
          </div>

          {conflicts.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-amber-800 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Hinweis:</strong> Folgende Spalten existieren bereits und werden übersprungen bzw. ergänzt: {conflicts.map((c) => c.name).join(', ')}.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            Abbrechen
          </button>
          <button
            onClick={handleApply}
            disabled={generated.length === 0}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Check className="w-4 h-4" /> Spalten einfügen
          </button>
        </div>
      </div>
    </div>
  );
};
