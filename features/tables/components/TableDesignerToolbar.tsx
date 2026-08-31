import React from 'react';
import { Plus, ShieldCheck, Building2, Code2, ArrowLeft, FileCode2, CheckSquare, Sparkles } from 'lucide-react';

interface TableDesignerToolbarProps {
  tableName: string;
  fieldsCount: number;
  isReadOnly: boolean;
  onAddField: () => void;
  onOpenAuditModal: () => void;
  onOpenTemplatesModal: () => void;
  onOpenImportBridge?: () => void;
  onOpenValidationModal?: () => void;
  onOpenNormalizationModal?: () => void;
  activeTab: 'fields' | 'sql' | 'indexes';
  setActiveTab: (tab: 'fields' | 'sql' | 'indexes') => void;
  onClose?: () => void;
}

export const TableDesignerToolbar: React.FC<TableDesignerToolbarProps> = ({
  tableName,
  fieldsCount,
  isReadOnly,
  onAddField,
  onOpenAuditModal,
  onOpenTemplatesModal,
  onOpenImportBridge,
  onOpenValidationModal,
  onOpenNormalizationModal,
  activeTab,
  setActiveTab,
  onClose,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
      <div className="flex items-center gap-3">
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Zurück"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>Tabellen-Designer</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono font-semibold border border-blue-200">
              {tableName || 'Neue Tabelle'}
            </span>
          </h2>
          <p className="text-[11px] text-slate-400">
            {fieldsCount} Felder definiert • Enterprise Schema Studio
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {!isReadOnly && (
          <>
            <button
              onClick={onAddField}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Feld hinzufügen
            </button>

            {onOpenNormalizationModal && (
              <button
                onClick={onOpenNormalizationModal}
                className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
                title="3NF Normalisierungs-Assistent: Redundanzen erkennen und Tabellen-Splits durchführen"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> 3NF Normalisierung
              </button>
            )}

            <button
              onClick={onOpenAuditModal}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-indigo-50 border border-slate-300 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
              title="Standard-Auditspalten (CreatedAt, UpdatedAt, SoftDelete, RowVersion) einfügen"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Audit-Felder
            </button>

            {onOpenValidationModal && (
              <button
                onClick={onOpenValidationModal}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-purple-50 border border-slate-300 hover:border-purple-300 text-slate-700 hover:text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
                title="Gültigkeitsregeln & Validierungslogik verwalten"
              >
                <CheckSquare className="w-3.5 h-3.5 text-purple-600" /> Validierung
              </button>
            )}

            {onOpenImportBridge && (
              <button
                onClick={onOpenImportBridge}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
                title="GAEB, DATANORM oder ZUGFeRD Datei importieren"
              >
                <FileCode2 className="w-3.5 h-3.5 text-emerald-600" /> GAEB / Datanorm
              </button>
            )}

            <button
              onClick={onOpenTemplatesModal}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-blue-50 border border-slate-300 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
              title="Bau & CRM Vorlagen laden"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" /> Branchen-Vorlagen
            </button>
          </>
        )}

        {/* View Mode Switch */}
        <div className="flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs">
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'fields' ? 'bg-white text-slate-800 shadow-2xs font-semibold' : 'text-slate-600'
            }`}
          >
            Entwurf
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-colors ${
              activeTab === 'sql' ? 'bg-white text-slate-800 shadow-2xs font-semibold' : 'text-slate-600'
            }`}
          >
            <Code2 className="w-3 h-3" /> DDL / SQL
          </button>
        </div>
      </div>
    </div>
  );
};
