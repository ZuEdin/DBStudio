import React, { useState } from 'react';
import { Building2, X, Check, ArrowRight, Layers, Table as TableIcon } from 'lucide-react';
import { Table } from '../../../types';
import { INDUSTRY_TABLE_TEMPLATES } from '../config/industryTableTemplates';

interface IndustryTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (tableTemplate: Table) => void;
}

export const IndustryTemplatesModal: React.FC<IndustryTemplatesModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('construction');
  const [selectedTemplate, setSelectedTemplate] = useState<Table | null>(
    INDUSTRY_TABLE_TEMPLATES[0]?.templates[0] || null
  );

  if (!isOpen) return null;

  const currentCategory = INDUSTRY_TABLE_TEMPLATES.find((c) => c.id === selectedCategoryId);

  const handleApply = () => {
    if (selectedTemplate) {
      onApplyTemplate(selectedTemplate);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full h-[600px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Branchen-Vorlagen (Bau &amp; Handwerk)</h3>
              <p className="text-xs text-slate-400">Vorkonfigurierte Tabellenstrukturen mit Fachdatentypen &amp; Formeln</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Split: Left Categories & Templates, Right Field Details */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column */}
          <div className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col overflow-y-auto p-3 space-y-4 shrink-0">
            {INDUSTRY_TABLE_TEMPLATES.map((cat) => (
              <div key={cat.id} className="space-y-1">
                <span className="text-xs font-bold text-slate-600 px-2 uppercase tracking-wider block">
                  {cat.name}
                </span>
                <div className="space-y-1">
                  {cat.templates.map((tpl) => {
                    const isSelected = selectedTemplate?.id === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId(cat.id);
                          setSelectedTemplate(tpl);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'hover:bg-slate-200/70 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{tpl.name}</span>
                        {isSelected && <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Template Detail Preview */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white p-5">
            {selectedTemplate ? (
              <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <TableIcon className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold text-slate-800 text-base font-mono">
                      {selectedTemplate.name}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{selectedTemplate.description}</p>
                </div>

                <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                  <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between">
                    <span>Enthaltene Spalten ({selectedTemplate.fields.length})</span>
                    <span className="text-slate-400 font-normal">Datentyp &amp; Eigenschaften</span>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {selectedTemplate.fields.map((f) => (
                      <div key={f.id} className="p-2.5 px-3 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          {f.isPrimaryKey && (
                            <span className="px-1 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                              PK
                            </span>
                          )}
                          <span className="font-mono font-semibold text-slate-800">{f.name}</span>
                          {f.comment && (
                            <span className="text-[11px] text-slate-400 truncate max-w-xs">
                              — {f.comment}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {f.isCalculated && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono font-bold">
                              ⚡ Formel
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[11px]">
                            {f.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Wähle links eine Vorlage aus.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            Abbrechen
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedTemplate}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Check className="w-4 h-4" /> Vorlage in Designer laden
          </button>
        </div>
      </div>
    </div>
  );
};
