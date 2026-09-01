
import React, { useState, useMemo } from 'react';
import { Table, Query, Report, Field, ReportSummary, GroupLevel } from '../../types/index';
import { X, FileText, Plus, Trash2, ArrowUp, ArrowDown, Layers } from 'lucide-react';
import { LogoUploadField } from '../../components/common/LogoUploadField';

interface ReportWizardModalProps {
  tables: Table[];
  queries: Query[];
  onSave: (report: Report) => void;
  onClose: () => void;
}

export const ReportWizardModal: React.FC<ReportWizardModalProps> = ({
  tables,
  queries,
  onSave,
  onClose,
}) => {
  const [reportName, setReportName] = useState('Neuer Bericht');
  const [source, setSource] = useState<string>('');
  const [groupLevels, setGroupLevels] = useState<GroupLevel[]>([]);
  const [summaries, setSummaries] = useState<ReportSummary[]>([]);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string>('');
  const [logoPosition, setLogoPosition] = useState<'left' | 'center' | 'right'>('left');

  const dataSources = useMemo(() => [
    { id: 'dashboard:none', name: 'Leeres Dashboard', type: 'Dashboard' },
    ...tables.map(t => ({ id: `table:${t.id}`, name: t.name, type: 'Tabelle' })),
    ...queries.map(q => ({ id: `query:${q.id}`, name: q.name, type: 'Abfrage' }))
  ], [tables, queries]);

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setSource(val);
      setGroupLevels([]);
      const selected = dataSources.find(ds => ds.id === val);
      if (selected) {
          setReportName(selected.name);
      }
  };

  const selectedSourceFields = useMemo((): Field[] => {
    if (!source) return [];
    const [type, id] = source.split(':');
    if (type === 'table') {
      return tables.find(t => t.id === id)?.fields || [];
    }
    if (type === 'query') {
      const query = queries.find(q => q.id === id);
      if (!query || query.type !== 'SELECT') return [];
      
      // Use Query Columns as pseudo-fields to ensure aliases are respected
      return query.columns.map(col => {
          const table = tables.find(t => t.id === col.tableId);
          const field = table?.fields.find(f => f.id === col.fieldId);
          return {
              id: col.id, // Use QueryColumn ID to link to report column
              name: col.alias && col.alias.trim() !== '' ? col.alias : col.fieldName,
              type: field?.type || 'VARCHAR', // Fallback type
              isPrimaryKey: false
          };
      });
    }
    return [];
  }, [source, tables, queries]);

  const handleAddGroupLevel = (fieldId: string) => {
    if (!fieldId) return;
    const field = selectedSourceFields.find(f => f.id === fieldId);
    if (!field) return;
    const newGroup: GroupLevel = {
      fieldId,
      fieldName: field.name,
      sortOrder: 'asc',
      showHeader: true,
      showFooter: true,
    };
    setGroupLevels(prev => [...prev, newGroup]);
  };

  const handleRemoveGroupLevel = (index: number) => {
    setGroupLevels(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveGroupLevel = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= groupLevels.length) return;
    setGroupLevels(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
  };

  const handleSummaryChange = (field: Field, calc: 'SUM' | 'COUNT', checked: boolean) => {
    setSummaries(prev => {
      const existing = prev.find(s => s.fieldId === field.id && s.calculation === calc);
      if (checked && !existing) {
        return [...prev, { fieldId: field.id, fieldName: field.name, calculation: calc }];
      }
      if (!checked && existing) {
        return prev.filter(s => !(s.fieldId === field.id && s.calculation === calc));
      }
      return prev;
    });
  };

  const handleSave = () => {
    if (!source || !reportName) return;
    const [sourceType, sourceId] = source.split(':');
    
    // Initialize columns for the report based on selected fields
    const initialColumns = selectedSourceFields.map((f, i) => ({
        fieldId: f.id,
        label: f.name,
        visible: true,
        order: i
    }));

    const newReport: Report = {
      id: crypto.randomUUID(),
      name: reportName,
      sourceType: sourceType as 'table' | 'query' | 'dashboard',
      sourceId,
      groupingFieldId: groupLevels[0]?.fieldId || undefined,
      groupingFields: groupLevels,
      summaries,
      columns: initialColumns,
      dashboardWidgets: sourceType === 'dashboard' ? [] : undefined,
      settings: {
        orientation: 'portrait',
        pageSize: 'A4',
        showGridlines: true,
        zebraStriping: true,
        showReportHeader: true,
        showReportFooter: true,
        showPageFooter: true,
        companyLogoUrl: companyLogoUrl || undefined,
        logoPosition: logoPosition
      }
    };
    onSave(newReport);
  };
  
  const numericFields = selectedSourceFields.filter(f => f.type === 'INTEGER');
  const availableGroupingFields = selectedSourceFields.filter(
    f => !groupLevels.some(g => g.fieldId === f.id)
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in-25">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl border border-slate-300 flex flex-col">
        <div className="flex justify-between items-center p-4 bg-slate-100 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="text-green-600" />
            <h2 className="text-lg font-bold text-slate-800">Bericht erstellen (Report-Assistent)</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={20} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          <div className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">1. Datenquelle auswählen</label>
              <select value={source} onChange={handleSourceChange} className="w-full border border-slate-300 rounded p-2 text-sm bg-white">
                <option value="">Bitte wählen...</option>
                {dataSources.map(ds => <option key={ds.id} value={ds.id}>{ds.type}: {ds.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Berichtsname</label>
              <input type="text" value={reportName} onChange={e => setReportName(e.target.value)} className="w-full max-w-md border border-slate-300 rounded p-2 text-sm" />
            </div>

            {source && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <Layers size={16} className="text-indigo-600" /> 2. Gruppierungsebenen (Hierarchie, optional)
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">
                    Fügen Sie mehrere hierarchische Ebenen hinzu (z. B. 1. Beruf ➔ 2. Geschlecht).
                  </p>

                  {/* Add group dropdown */}
                  <div className="flex gap-2 mb-3">
                    <select
                      id="wizard-group-select"
                      className="flex-1 border border-slate-300 rounded p-2 text-xs bg-white"
                      defaultValue=""
                    >
                      <option value="" disabled>+ Feld für Gruppierung auswählen...</option>
                      {availableGroupingFields.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const sel = document.getElementById('wizard-group-select') as HTMLSelectElement;
                        if (sel && sel.value) {
                          handleAddGroupLevel(sel.value);
                          sel.value = '';
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> Hinzufügen
                    </button>
                  </div>

                  {/* Configured group levels */}
                  {groupLevels.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {groupLevels.map((grp, idx) => (
                        <div
                          key={grp.fieldId}
                          className="flex items-center justify-between p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-indigo-600 text-white font-mono font-bold rounded text-[10px]">
                              Ebene {idx + 1}
                            </span>
                            <span className="font-bold text-indigo-950">{grp.fieldName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveGroupLevel(idx, 'up')}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              title="Nach oben verschieben"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === groupLevels.length - 1}
                              onClick={() => handleMoveGroupLevel(idx, 'down')}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              title="Nach unten verschieben"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveGroupLevel(idx)}
                              className="p-1 text-red-500 hover:bg-red-100 rounded"
                              title="Entfernen"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {numericFields.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">3. Zusammenfassungen (optional)</label>
                    <div className="border border-slate-200 rounded p-3 space-y-2 bg-slate-50">
                      {numericFields.map(field => (
                        <div key={field.id} className="grid grid-cols-3 items-center text-sm">
                          <span className="font-semibold">{field.name}</span>
                           <label className="flex items-center gap-2"><input type="checkbox" onChange={e => handleSummaryChange(field, 'SUM', e.target.checked)} /> Summe</label>
                           <label className="flex items-center gap-2"><input type="checkbox" onChange={e => handleSummaryChange(field, 'COUNT', e.target.checked)} /> Anzahl</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200">
                  <LogoUploadField
                    logoUrl={companyLogoUrl}
                    onLogoUrlChange={setCompanyLogoUrl}
                    logoPosition={logoPosition}
                    onLogoPositionChange={setLogoPosition}
                    label="4. Firmen- / Berichtslogo (optional)"
                    helperText="SVG & PNG werden per Drag & Drop direkt eingebettet."
                    showPositionSelector={true}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 bg-slate-50 border-t border-slate-200">
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded text-sm">Abbrechen</button>
          <button onClick={handleSave} disabled={!source || !reportName} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50">Bericht erstellen</button>
        </div>
      </div>
    </div>
  );
};
