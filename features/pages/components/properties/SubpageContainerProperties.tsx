import React from 'react';
import { Trash2, Layers, Sparkles, ArrowRight, Link, HelpCircle } from 'lucide-react';
import { PageComponent, CustomPage } from '../../../../types';

interface SubpageContainerPropertiesProps {
  selectedNode: PageComponent;
  updateSelectedNodeProps: (newProps: any) => void;
  pages: CustomPage[];
}

export const SubpageContainerProperties: React.FC<SubpageContainerPropertiesProps> = ({
  selectedNode,
  updateSelectedNodeProps,
  pages,
}) => {
  const mappings = selectedNode.props.parameterMappings || [];
  const targetSubPageId = selectedNode.props.subPageId;
  const targetSubPage = pages.find(p => p.id === targetSubPageId);

  const addMapping = (defaultSource = 'selectedId', defaultTarget = 'selectedId') => {
    const newMapping = { 
      sourceKey: defaultSource, 
      targetKey: defaultTarget,
      sourceType: 'context_or_param' // 'context_or_param' | 'static'
    };
    updateSelectedNodeProps({ parameterMappings: [...mappings, newMapping] });
  };

  const removeMapping = (idx: number) => {
    const next = [...mappings];
    next.splice(idx, 1);
    updateSelectedNodeProps({ parameterMappings: next });
  };

  const updateMapping = (idx: number, patch: Partial<any>) => {
    const next = [...mappings];
    next[idx] = { ...next[idx], ...patch };
    updateSelectedNodeProps({ parameterMappings: next });
  };

  // 1-Click Auto Mapping
  const handleAutoMap = () => {
    if (!targetSubPage) return;
    const expected = targetSubPage.expectedParams && targetSubPage.expectedParams.length > 0
      ? targetSubPage.expectedParams
      : ['selectedId', 'id', 'parentId', 'kundeId', 'projektId'];

    const newMappings = expected.map(param => ({
      sourceKey: param,
      targetKey: param,
      sourceType: 'context_or_param'
    }));

    updateSelectedNodeProps({ parameterMappings: newMappings });
  };

  // Extract expected target parameters
  const targetExpectedParams = targetSubPage?.expectedParams || [];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
          <Layers size={14} /> Unterseiten-Einbindung (Sub-Page)
        </h4>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
          Eingebundene Seite (Sub-Page)
        </label>
        <select 
          value={selectedNode.props.subPageId || ''} 
          onChange={(e: any) => updateSelectedNodeProps({ subPageId: e.target.value })}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-xs mb-2 text-slate-800 dark:text-slate-100"
        >
          <option value="">-- Keine Seite ausgewählt --</option>
          {pages.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} {p.isSubpage ? '★ (Unterseite)' : ''}
            </option>
          ))}
        </select>

        {targetSubPage && (
          <div className="p-2.5 bg-indigo-50/70 dark:bg-slate-800/80 rounded-lg border border-indigo-100 dark:border-slate-700 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-900 dark:text-indigo-300">{targetSubPage.name}</span>
              {targetSubPage.isSubpage && (
                <span className="text-[10px] px-1.5 py-0.2 bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full font-semibold">
                  Sub-Page
                </span>
              )}
            </div>
            {targetExpectedParams.length > 0 ? (
              <div className="text-[10px] text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Erwartete Parameter: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {targetExpectedParams.map(param => (
                    <span key={param} className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-indigo-200 dark:border-slate-600 rounded text-indigo-700 dark:text-indigo-300 font-mono">
                      {param}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 italic">
                Tipp: Definiere in der Sub-Page 'Erwartete Parameter', um sie hier automatisch vorzuschlagen.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Link size={13} className="text-indigo-600" /> Parameter-Übergabe (Mapping)
          </h4>
          {targetSubPage && (
            <button
              type="button"
              onClick={handleAutoMap}
              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-indigo-200 dark:border-slate-700"
              title="Parameter automatisch mit 1 Klick verbinden"
            >
              <Sparkles size={11} /> Auto-Mapping
            </button>
          )}
        </div>

        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
          Übertrage Werte aus der übergeordneten Tabelle, dem aktuellen Datensatz oder URL-Parametern direkt an die Unterseite, damit diese gefiltert geladen wird.
        </p>
        
        <div className="space-y-2">
          {mappings.map((m: any, idx: number) => (
            <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Parameter #{idx + 1}</span>
                <button 
                  onClick={() => removeMapping(idx)}
                  className="text-slate-400 hover:text-rose-500 p-0.5 transition"
                  title="Mapping löschen"
                  type="button"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
                {/* Source Key */}
                <div>
                  <label className="block text-[9px] font-semibold text-slate-500 uppercase mb-0.5">
                    Quelle (Hauptseite / Context)
                  </label>
                  <input 
                    type="text"
                    value={m.sourceKey}
                    onChange={(e) => updateMapping(idx, { sourceKey: e.target.value })}
                    placeholder="z.B. id, selectedId"
                    className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded font-mono bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="pt-3 text-slate-400">
                  <ArrowRight size={14} />
                </div>

                {/* Target Key */}
                <div>
                  <label className="block text-[9px] font-semibold text-slate-500 uppercase mb-0.5">
                    Ziel (Sub-Page Param)
                  </label>
                  <input 
                    type="text"
                    value={m.targetKey}
                    onChange={(e) => updateMapping(idx, { targetKey: e.target.value })}
                    list={`target_params_${idx}`}
                    placeholder="z.B. filterId"
                    className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded font-mono bg-white dark:bg-slate-900 font-semibold text-indigo-700 dark:text-indigo-400"
                  />
                  {targetExpectedParams.length > 0 && (
                    <datalist id={`target_params_${idx}`}>
                      {targetExpectedParams.map(p => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => addMapping()}
            className="w-full text-center py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1"
            type="button"
          >
            + Weiteres Parameter-Mapping hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
};
